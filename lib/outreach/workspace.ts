import { composeOutreachMessage, resolveSenderName } from "@/lib/outreach/compose";
import { draftMatchesTarget, resolveTargetCompanyName } from "@/lib/outreach/draft-helpers";
import { buildPitchContext } from "@/lib/outreach/pitch-context";
import type { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import type { Tables } from "@/types/database";
import { isOpenRouterConfigured } from "@/lib/env";
import {
  discoverApolloPersonContact,
  enrichWebsiteContact,
  extractContactFromRaw,
  hasPublicContact,
  mergeContacts,
  parseSocialNotes,
  socialNotes,
  type ExtractedContact,
} from "@/lib/opportunities/public-contact";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

function contactFromRow(row: Tables<"contacts"> | null): ExtractedContact {
  const social = parseSocialNotes(row?.notes);
  return {
    email: row?.email ?? null,
    phone: row?.phone ?? null,
    website: row?.website ?? null,
    linkedinUrl: social.linkedinUrl,
    facebookUrl: social.facebookUrl,
    twitterUrl: social.twitterUrl,
    fullName: row?.full_name ?? null,
    businessName: row?.business_name ?? null,
  };
}

async function loadTargetContactRow(supabase: ServerClient, opportunity: Tables<"opportunities">) {
  if (opportunity.website_id) {
    const { data } = await supabase
      .from("contacts")
      .select("*")
      .eq("website_id", opportunity.website_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return { data };
  }
  const { data } = await supabase
    .from("contacts")
    .select("*")
    .eq("opportunity_id", opportunity.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return { data };
}

export async function clearOpportunityDrafts(supabase: ServerClient, opportunityId: string) {
  await supabase.from("outreach_messages").delete().eq("opportunity_id", opportunityId).eq("status", "draft");
}

export async function enrichOpportunityContact(
  supabase: ServerClient,
  userId: string,
  opportunity: Tables<"opportunities">,
  existing: Tables<"contacts"> | null,
) {
  const stored = contactFromRow(existing);
  const fromRaw = extractContactFromRaw(opportunity.raw_payload, opportunity.domain);
  let merged = mergeContacts(stored, fromRaw, {
    fullName: opportunity.person_name,
    businessName: opportunity.company_name,
    website: opportunity.source_url,
  });

  const siteUrl = merged.website || (opportunity.domain ? `https://${opportunity.domain}` : null);
  const skipScrape =
    !siteUrl ||
    /news\.ycombinator\.com|adzuna\.|indeed\.|linkedin\.com/i.test(siteUrl);
  if (!skipScrape && siteUrl && (!merged.email || !merged.phone || !merged.linkedinUrl)) {
    merged = mergeContacts(merged, await enrichWebsiteContact(siteUrl, opportunity.domain));
  }
  const peopleChecked = Boolean(existing?.notes?.includes("apollo_people: checked"));
  if (!merged.email && !peopleChecked && opportunity.domain && opportunity.source === "apollo") {
    merged = mergeContacts(merged, await discoverApolloPersonContact(opportunity.domain));
  }

  if (hasPublicContact(merged) || merged.linkedinUrl) {
    const notes = [
      socialNotes(merged) || existing?.notes || "",
      opportunity.source === "apollo" ? "apollo_people: checked" : "",
    ]
      .filter(Boolean)
      .join("\n") || null;
    const row = {
      user_id: userId,
      opportunity_id: opportunity.id,
      website_id: opportunity.website_id,
      full_name: merged.fullName,
      business_name: merged.businessName,
      email: merged.email,
      phone: merged.phone,
      website: merged.website,
      notes,
      source_reference: opportunity.source,
      verification_status: "unverified" as const,
    };
    if (existing) {
      await supabase
        .from("contacts")
        .update({
          email: row.email ?? existing.email,
          phone: row.phone ?? existing.phone,
          website: row.website ?? existing.website,
          notes: row.notes ?? existing.notes,
          full_name: row.full_name ?? existing.full_name,
          business_name: row.business_name ?? existing.business_name,
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("contacts").insert(row);
    }
    await supabase
      .from("opportunities")
      .update({ contact_available: hasPublicContact(merged) })
      .eq("id", opportunity.id);
    if (opportunity.website_id && merged.email) {
      await supabase.from("websites").update({ has_email: true }).eq("id", opportunity.website_id);
    }
  }

  return merged;
}

export async function prepareOutreachWorkspace(
  supabase: ServerClient,
  user: User,
  opportunity: Tables<"opportunities">,
  options?: { forceRefresh?: boolean },
) {
  const [{ data: website }, { data: existingContact }, { data: profile }, { data: services }, { data: draft }, { data: analysisRow }] =
    await Promise.all([
      opportunity.website_id
        ? supabase.from("websites").select("business_name, title, domain").eq("id", opportunity.website_id).maybeSingle()
        : Promise.resolve({ data: null }),
      loadTargetContactRow(supabase, opportunity),
      supabase.from("profiles").select("full_name, email, expertise_description").eq("id", user.id).maybeSingle(),
      supabase.from("user_services").select("custom_label, service_key").eq("user_id", user.id),
      supabase
        .from("outreach_messages")
        .select("id, subject, body, created_at")
        .eq("opportunity_id", opportunity.id)
        .eq("status", "draft")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      opportunity.website_id
        ? supabase
            .from("website_analyses")
            .select("id, technical, business, overview, created_at")
            .eq("website_id", opportunity.website_id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  const { data: painPoints } = analysisRow?.id
    ? await supabase
        .from("pain_points")
        .select("title, severity, description")
        .eq("website_analysis_id", analysisRow.id)
        .order("created_at", { ascending: false })
        .limit(6)
    : await supabase
        .from("pain_points")
        .select("title, severity, description")
        .eq("opportunity_id", opportunity.id)
        .order("created_at", { ascending: false })
        .limit(6);

  const contact = await enrichOpportunityContact(supabase, user.id, opportunity, existingContact);
  const companyName = resolveTargetCompanyName({ website, opportunity, contact });
  const senderName = resolveSenderName(profile, user);
  const serviceLabels = (services ?? []).map((row) => row.custom_label || row.service_key.replace(/_/g, " "));

  const pitchContext = buildPitchContext({
    opportunity,
    analysisRow: analysisRow ?? null,
    painPoints: painPoints ?? [],
  });

  const analysisSummary = pitchContext.summary;

  const opportunityForCompose = {
    ...opportunity,
    company_name: companyName,
    title: website?.title ?? opportunity.title,
    industry:
      opportunity.industry && opportunity.industry !== "Unable to determine"
        ? opportunity.industry
        : typeof analysisRow?.overview === "object" && analysisRow.overview && "industry" in analysisRow.overview
          ? String((analysisRow.overview as { industry?: string }).industry ?? "")
          : opportunity.industry,
  };

  const draftIsFresh =
    draft &&
    draftMatchesTarget(draft, {
      domain: opportunity.domain,
      companyName,
      contactEmail: contact.email,
    }) &&
    (!analysisRow?.created_at || new Date(draft.created_at) >= new Date(analysisRow.created_at));

  let subject = draftIsFresh ? (draft?.subject ?? "") : "";
  let body = draftIsFresh ? (draft?.body ?? "") : "";

  if ((!subject || !body || options?.forceRefresh) && isOpenRouterConfigured()) {
    if (draft && !draftIsFresh) {
      await clearOpportunityDrafts(supabase, opportunity.id);
    }
    try {
      const generated = await composeOutreachMessage({
        channel: contact.email ? "email" : contact.linkedinUrl ? "linkedin" : "email",
        senderName,
        senderEmail: profile?.email ?? user.email,
        services: serviceLabels,
        opportunity: opportunityForCompose,
        contact: { ...contact, businessName: contact.businessName ?? companyName },
        pitchContext,
      });
      subject = generated.subject;
      body = generated.body;
      await supabase.from("outreach_messages").insert({
        user_id: user.id,
        opportunity_id: opportunity.id,
        channel: contact.email ? "email" : "other",
        subject,
        body,
        status: "draft",
        service_offered: opportunity.matching_service,
      });
    } catch {
      subject = subject || `Quick idea for ${companyName}`;
    }
  } else if (!subject) {
    subject = `Quick idea for ${companyName}`;
  }

  return {
    contact: { ...contact, businessName: contact.businessName ?? companyName },
    senderName,
    senderEmail: profile?.email ?? user.email ?? "",
    subject,
    body,
    analysisSummary,
    pitchContext,
    companyName,
    resetKey: `${opportunity.id}:${opportunity.domain}:${contact.email ?? "none"}:${analysisRow?.created_at ?? "none"}`,
  };
}

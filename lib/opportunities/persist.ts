import type { createClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/types/database";
import type { NormalizedOpportunity } from "@/lib/opportunities/types";
import { shouldPersistWebsite } from "@/lib/opportunities/domains";
import {
  extractContactFromRaw,
  hasPublicContact,
  mergeContacts,
  socialNotes,
  type ExtractedContact,
} from "@/lib/opportunities/public-contact";
import { freshnessFromDate, heuristicScore, scoreExplanation } from "@/lib/opportunities/score";

function slimRaw(raw: unknown): Json {
  if (raw == null) return null;
  try {
    const json = JSON.stringify(raw);
    if (json.length <= 8000) return raw as Json;
    return { truncated: true, preview: json.slice(0, 4000) };
  } catch {
    return null;
  }
}

type ServerClient = Awaited<ReturnType<typeof createClient>>;
type OpportunitySource = Database["public"]["Enums"]["opportunity_source_type"];

async function upsertContact(
  supabase: ServerClient,
  userId: string,
  opportunityId: string,
  websiteId: string | null,
  source: OpportunitySource,
  item: NormalizedOpportunity,
  contact: ExtractedContact,
) {
  if (!contact.email && !contact.phone && !contact.linkedinUrl) return;

  const row = {
    user_id: userId,
    opportunity_id: opportunityId,
    website_id: websiteId,
    full_name: contact.fullName ?? item.personName ?? null,
    business_name: contact.businessName ?? item.companyName ?? null,
    email: contact.email,
    phone: contact.phone,
    website: contact.website ?? item.sourceUrl ?? null,
    notes: socialNotes(contact) || null,
    source_reference: source,
    verification_status: "unverified" as const,
  };

  const { data: existing } = await supabase
    .from("contacts")
    .select("id, email, phone, notes, website")
    .eq("opportunity_id", opportunityId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("contacts")
      .update({
        email: existing.email || row.email,
        phone: existing.phone || row.phone,
        website: existing.website || row.website,
        notes: existing.notes || row.notes,
        full_name: row.full_name,
        business_name: row.business_name,
      })
      .eq("id", existing.id);
    return;
  }

  await supabase.from("contacts").insert(row);
}

export async function persistOpportunities(
  supabase: ServerClient,
  userId: string,
  source: OpportunitySource,
  items: NormalizedOpportunity[],
  options?: { matchingService?: string | null; keywords?: string[]; freshnessHours?: number },
) {
  let stored = 0;
  let newCount = 0;
  const newTitles: string[] = [];
  const errors: string[] = [];

  for (const item of items) {
    const hash = item.contentHash;
    if (!hash) {
      errors.push(`Skipped "${item.title}" because it had no content hash`);
      continue;
    }

    const { data: existingOpportunity } = await supabase
      .from("opportunities")
      .select("id")
      .eq("user_id", userId)
      .eq("content_hash", hash)
      .maybeSingle();

    if (existingOpportunity) {
      await supabase
        .from("opportunities")
        .update({
          last_verified_at: new Date().toISOString(),
          freshness_status: freshnessFromDate(item.publishedAt, options?.freshnessHours ?? 48),
        })
        .eq("id", existingOpportunity.id);
      continue;
    }

    let websiteId: string | null = null;
    if (shouldPersistWebsite(item.domain)) {
      const { data: website, error: websiteError } = await supabase
        .from("websites")
        .upsert(
          {
            user_id: userId,
            domain: item.domain!,
            normalized_url: item.normalizedUrl ?? item.domain!,
            url: item.sourceUrl ?? `https://${item.domain}`,
            title: item.title,
            business_name: item.companyName ?? item.domain,
            industry: item.industry ?? null,
            location: item.location ?? null,
            country: item.location ?? null,
            discovered_at: item.publishedAt ?? new Date().toISOString(),
            last_verified_at: new Date().toISOString(),
            is_demo: false,
          },
          { onConflict: "user_id,domain" },
        )
        .select("id")
        .maybeSingle();
      if (websiteError) errors.push(`${item.domain}: ${websiteError.message}`);
      websiteId = website?.id ?? null;
    }

    const extracted = mergeContacts(
      extractContactFromRaw(item.raw, item.domain),
      {
        fullName: item.personName ?? null,
        businessName: item.companyName ?? null,
        website: item.sourceUrl ?? null,
      },
    );
    const score = heuristicScore(item, options?.keywords);
    const row = {
      user_id: userId,
      website_id: websiteId,
      title: item.title.slice(0, 300),
      company_name: item.companyName ?? null,
      person_name: item.personName ?? extracted.fullName ?? null,
      source,
      source_id: item.sourceId ?? null,
      source_url: item.sourceUrl ?? null,
      normalized_url: item.normalizedUrl ?? null,
      domain: item.domain ?? null,
      content_hash: hash,
      industry: item.industry ?? null,
      location: item.location ?? null,
      estimated_need: item.estimatedNeed ?? null,
      matching_service: options?.matchingService ?? null,
      opportunity_score: score,
      score_explanation: scoreExplanation(item, score) as Json,
      contact_available: hasPublicContact(extracted),
      discovered_at: item.publishedAt ?? new Date().toISOString(),
      published_at: item.publishedAt ?? null,
      last_verified_at: new Date().toISOString(),
      freshness_status: freshnessFromDate(item.publishedAt, options?.freshnessHours ?? 48),
      status: "new" as const,
      is_demo: false,
      raw_payload: slimRaw(item.raw),
    };

    const { data: saved, error } = await supabase.from("opportunities").insert(row).select("id").maybeSingle();
    if (error || !saved) {
      if (error?.code === "23505" || error?.message?.toLowerCase().includes("duplicate")) {
        continue;
      }
      errors.push(`${item.title}: ${error?.message ?? "could not save"}`);
      continue;
    }

    stored += 1;
    newCount += 1;
    if (newTitles.length < 3) newTitles.push(item.title);
    await upsertContact(supabase, userId, saved.id, websiteId, source, item, extracted);

    if (websiteId && extracted.email) {
      await supabase.from("websites").update({ has_email: true }).eq("id", websiteId);
    }
    if (websiteId && (extracted.linkedinUrl || extracted.facebookUrl || extracted.twitterUrl)) {
      await supabase.from("websites").update({ has_social: true }).eq("id", websiteId);
    }
  }

  return { stored, newCount, newTitles, errors };
}

"use server";

import { revalidatePath } from "next/cache";
import { analyzeWebsite } from "@/lib/ai";
import { collectWebsiteEvidence, emptyWebsiteEvidence } from "@/lib/analysis/collect-evidence";
import { buildHeuristicAnalysis } from "@/lib/analysis/from-evidence";
import { parseJsonFromModel } from "@/lib/ai/json";
import { getModel } from "@/lib/ai/client";
import { isOpenRouterConfigured } from "@/lib/env";
import { shouldPersistWebsite } from "@/lib/opportunities/domains";
import {
  enrichWebsiteContact,
  hasPublicContact,
  mergeContacts,
  socialNotes,
  type ExtractedContact,
} from "@/lib/opportunities/public-contact";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

function asOverview(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const row = value as { businessType?: unknown; industry?: unknown; label?: unknown; summary?: unknown };
  return {
    businessType: typeof row.businessType === "string" ? row.businessType : null,
    industry: typeof row.industry === "string" ? row.industry : null,
    label: typeof row.label === "string" ? row.label : null,
    summary: typeof row.summary === "string" ? row.summary : null,
  };
}

function publicError(error: unknown) {
  const message = error instanceof Error ? error.message : "Analysis failed";
  if (/api[_-]?key|bearer|authorization|sk-|secret/i.test(message)) return "Analysis failed";
  return message.slice(0, 220);
}

function mergeParsed(
  heuristic: ReturnType<typeof buildHeuristicAnalysis>,
  ai: Record<string, unknown> | null,
) {
  if (!ai) return heuristic;
  const technical = Array.isArray(ai.technical) && ai.technical.length ? ai.technical : heuristic.technical;
  const business = Array.isArray(ai.business) && ai.business.length ? ai.business : heuristic.business;
  const overview =
    ai.overview && typeof ai.overview === "object"
      ? { ...heuristic.overview, ...(ai.overview as Record<string, unknown>) }
      : heuristic.overview;
  return {
    overview,
    technical,
    business,
    painPoints: Array.isArray(ai.painPoints) ? ai.painPoints : heuristic.painPoints,
    score: typeof ai.score === "number" ? ai.score : heuristic.score,
    scoreExplanation:
      typeof ai.scoreExplanation === "string" ? ai.scoreExplanation : heuristic.scoreExplanation,
    estimatedNeed: typeof ai.estimatedNeed === "string" ? ai.estimatedNeed : heuristic.estimatedNeed,
    matchingService: typeof ai.matchingService === "string" ? ai.matchingService : heuristic.matchingService,
  };
}

export async function runAnalysis(targetId: string) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) return { ok: false as const, error: "Sign in required" };

    const { data: website } = await supabase.from("websites").select("*").eq("id", targetId).maybeSingle();
    const { data: opportunity } = website
      ? await supabase
          .from("opportunities")
          .select("*")
          .eq("website_id", website.id)
          .order("discovered_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : await supabase.from("opportunities").select("*").eq("id", targetId).maybeSingle();

    if (!website && !opportunity) {
      return { ok: false as const, error: "Nothing to analyze" };
    }

    const url = website?.url ?? opportunity?.source_url ?? (website?.domain ? `https://${website.domain}` : null);
    const domain = website?.domain ?? opportunity?.domain ?? null;
    const canScanSite = shouldPersistWebsite(domain);
    const page = canScanSite
      ? await collectWebsiteEvidence({
          url,
          domain,
          urlscanUuid: opportunity?.source === "website_discovery" ? opportunity.source_id : null,
        })
      : emptyWebsiteEvidence([
          opportunity?.source === "job"
            ? "This is a hiring ad, not a company website. No public company domain was stored to scan."
            : "No public company domain was stored, so live page capture was skipped.",
        ]);

    const evidence = {
      domain,
      url: page.finalUrl ?? (canScanSite ? url : null),
      storedTitle: website?.title ?? opportunity?.title ?? null,
      company: website?.business_name ?? opportunity?.company_name ?? page.ogSiteName ?? null,
      storedIndustry: website?.industry ?? opportunity?.industry ?? null,
      storedLocation: website?.location ?? opportunity?.location ?? null,
      estimatedNeed: opportunity?.estimated_need ?? null,
      source: opportunity?.source ?? null,
      page,
    };

    const heuristic = buildHeuristicAnalysis({
      domain,
      company: evidence.company,
      page,
      listing: {
        title: opportunity?.title ?? null,
        source: opportunity?.source ?? null,
        location: opportunity?.location ?? website?.location ?? null,
        industry: opportunity?.industry ?? website?.industry ?? null,
        estimatedNeed: opportunity?.estimated_need ?? null,
        sourceUrl: opportunity?.source_url ?? url,
      },
    });

    let parsed = heuristic;
    let modelUsed = "heuristic";
    let aiWarning: string | undefined;

    if (!page.fetched) {
      aiWarning = canScanSite
        ? undefined
        : opportunity?.source === "job"
          ? "This is a hiring ad. Findings come from the listing because no company website was stored."
          : "No public company domain was stored, so live page capture was skipped.";
    } else if (!isOpenRouterConfigured()) {
      aiWarning = "OpenRouter is not configured. Showing captured page evidence only.";
    } else {
      const prompt = `Return JSON only with this shape:
{"overview":{"businessType":"string","industry":"string","label":"detected|possible|unable_to_determine"},"technical":[{"title":"string","label":"detected|possible|unable_to_determine","evidence":"string"}],"business":[{"title":"string","label":"detected|possible|unable_to_determine","evidence":"string"}],"painPoints":[{"title":"string","severity":"critical|high|medium|low","confidence":"detected|possible|unable_to_determine","why":"string"}],"score":0,"scoreExplanation":"string","estimatedNeed":"string","matchingService":"string"}

Rules:
- Use only the evidence JSON. Never invent contacts, traffic, revenue, Core Web Vitals, or stack items.
- If page.fetched is true, analyze the title, meta description, headings, technologies, platform, and text snippet.
- If page.fetched is false, every unsupported field must be unable_to_determine. Do not invent defects from missing fields.
- A normal domain like example.com is a custom domain. Never say the business lacks a custom domain.
- Title matching the domain is only a finding if page.title was actually captured and is weak.
- Pain points must cite evidence. Absence of urlscan data is not a client pain point.

Evidence:
${JSON.stringify(evidence)}`;

      try {
        const analysisText = await analyzeWebsite(prompt);
        const ai = parseJsonFromModel(analysisText);
        parsed = mergeParsed(heuristic, ai);
        modelUsed = getModel("default");
        if (!ai || (!Array.isArray(ai.technical) && !ai.overview)) {
          aiWarning = "AI did not return structured findings. Showing captured page evidence.";
        }
      } catch (error) {
        aiWarning = `${publicError(error)} Showing captured page evidence instead.`;
      }
    }

    const overviewFields = asOverview(parsed.overview);
    const overview = {
      ...(typeof parsed.overview === "object" && parsed.overview
        ? (parsed.overview as Record<string, unknown>)
        : { summary: heuristic.overview.businessType }),
      evidenceSource:
        page.source !== "none"
          ? page.source
          : opportunity?.source === "job" ||
              opportunity?.source === "problem_post" ||
              opportunity?.source === "adzuna"
            ? "listing"
            : page.source,
      evidenceTitle: page.title ?? opportunity?.title,
      evidenceUrl: page.finalUrl,
      evidenceNotes: page.notes,
    } as Json;
    const technical = (parsed.technical as Json) ?? [];
    const business = (parsed.business as Json) ?? [];
    const score =
      typeof parsed.score === "number" ? Math.max(0, Math.min(100, parsed.score)) : (opportunity?.opportunity_score ?? null);
    const usableOverview = overviewFields?.label === "detected" || overviewFields?.label === "possible";

    let websiteId = website?.id ?? opportunity?.website_id ?? null;
    const location =
      [page.city, page.country].filter(Boolean).join(", ") || website?.location || opportunity?.location || null;
    if (!websiteId && shouldPersistWebsite(domain) && domain) {
      const { data: created } = await supabase
        .from("websites")
        .upsert(
          {
            user_id: user.id,
            domain,
            normalized_url: opportunity?.normalized_url ?? domain,
            url: page.finalUrl ?? url ?? `https://${domain}`,
            title: page.title ?? website?.title ?? opportunity?.title,
            business_name: page.ogSiteName ?? website?.business_name ?? opportunity?.company_name ?? domain,
            discovered_at: new Date().toISOString(),
            last_verified_at: new Date().toISOString(),
            is_demo: false,
          },
          { onConflict: "user_id,domain" },
        )
        .select("id")
        .maybeSingle();
      websiteId = created?.id ?? null;
    }

    if (websiteId) {
      await supabase
        .from("websites")
        .update({
          url: page.finalUrl ?? url ?? website?.url,
          title: page.title ?? website?.title ?? null,
          business_name: page.ogSiteName ?? website?.business_name ?? opportunity?.company_name ?? domain,
          business_type: usableOverview ? overviewFields?.businessType : website?.business_type,
          industry: usableOverview ? overviewFields?.industry : website?.industry,
          location,
          country: page.country ?? website?.country ?? null,
          technology: page.technologies,
          platform: page.platform ?? website?.platform ?? null,
          is_ecommerce: page.isEcommerce,
          has_email: page.emails.length > 0 || website?.has_email || false,
          last_verified_at: new Date().toISOString(),
        })
        .eq("id", websiteId);
    }

    if (canScanSite && (websiteId || opportunity?.id)) {
      let contact: ExtractedContact = {
        email: page.emails[0] ?? null,
        phone: page.phones[0] ?? null,
        website: page.finalUrl ?? url,
        linkedinUrl: null,
        facebookUrl: null,
        twitterUrl: null,
        fullName: null,
        businessName: page.ogSiteName ?? evidence.company,
      };
      if (!contact.email) {
        const siteUrl = page.finalUrl ?? url;
        if (siteUrl) {
          contact = mergeContacts(contact, await enrichWebsiteContact(siteUrl, domain));
        }
      }
      if (hasPublicContact(contact) || contact.linkedinUrl) {
        const { data: existing } = opportunity?.id
          ? await supabase
              .from("contacts")
              .select("id, email, phone, notes, website, full_name, business_name")
              .eq("opportunity_id", opportunity.id)
              .maybeSingle()
          : websiteId
            ? await supabase
                .from("contacts")
                .select("id, email, phone, notes, website, full_name, business_name")
                .eq("website_id", websiteId)
                .maybeSingle()
            : { data: null };
        const row = {
          user_id: user.id,
          opportunity_id: opportunity?.id ?? null,
          website_id: websiteId,
          full_name: contact.fullName,
          business_name: contact.businessName,
          email: contact.email,
          phone: contact.phone,
          website: contact.website,
          notes: socialNotes(contact) || null,
          source_reference: opportunity?.source ?? "manual",
          verification_status: "unverified" as const,
        };
        if (existing) {
          await supabase
            .from("contacts")
            .update({
              email: existing.email || row.email,
              phone: existing.phone || row.phone,
              website: existing.website || row.website,
              notes: existing.notes || row.notes,
              full_name: existing.full_name || row.full_name,
              business_name: existing.business_name || row.business_name,
            })
            .eq("id", existing.id);
        } else {
          await supabase.from("contacts").insert(row);
        }
        if (opportunity?.id) {
          await supabase.from("opportunities").update({ contact_available: hasPublicContact(contact) }).eq("id", opportunity.id);
        }
        if (websiteId && contact.email) {
          await supabase.from("websites").update({ has_email: true }).eq("id", websiteId);
        }
        revalidatePath("/contacts");
      }
    }

    let analysisId: string | null = null;
    if (websiteId) {
      const { data: analysis } = await supabase
        .from("website_analyses")
        .insert({
          user_id: user.id,
          website_id: websiteId,
          status: "completed",
          overview,
          technical,
          business,
          model_used: modelUsed,
        })
        .select("id")
        .single();
      analysisId = analysis?.id ?? null;
    }

    await supabase.from("ai_analyses").insert({
      user_id: user.id,
      entity_type: websiteId ? "website" : "opportunity",
      entity_id: websiteId ?? opportunity?.id ?? targetId,
      analysis_type: "website_analysis",
      model_used: modelUsed,
      input_summary: evidence.domain ?? page.title,
      result: {
        overview,
        technical,
        business,
        page,
      } as Json,
    });

    if (opportunity?.id) {
      await supabase.from("pain_points").delete().eq("opportunity_id", opportunity.id);
    }
    if (websiteId) {
      const { data: prior } = await supabase.from("website_analyses").select("id").eq("website_id", websiteId);
      const ids = (prior ?? []).map((row) => row.id);
      if (ids.length) {
        await supabase.from("pain_points").delete().in("website_analysis_id", ids);
      }
    }

    const painPoints = Array.isArray(parsed.painPoints) ? parsed.painPoints : [];
    for (const point of painPoints as {
      title?: string;
      severity?: string;
      confidence?: string;
      why?: string;
    }[]) {
      if (!point.title) continue;
      const severity =
        point.severity === "critical" ||
        point.severity === "high" ||
        point.severity === "medium" ||
        point.severity === "low"
          ? point.severity
          : "medium";
      const confidence =
        point.confidence === "detected" ||
        point.confidence === "possible" ||
        point.confidence === "unable_to_determine"
          ? point.confidence
          : "unable_to_determine";
      await supabase.from("pain_points").insert({
        user_id: user.id,
        website_analysis_id: analysisId,
        opportunity_id: opportunity?.id ?? null,
        title: point.title,
        description: point.why ?? null,
        why_it_matters: point.why ?? null,
        severity,
        confidence,
      });
    }

    if (opportunity) {
      await supabase
        .from("opportunities")
        .update({
          status: "analyzed",
          website_id: websiteId ?? opportunity.website_id,
          opportunity_score: score,
          estimated_need: typeof parsed.estimatedNeed === "string" ? parsed.estimatedNeed : opportunity.estimated_need,
          matching_service:
            typeof parsed.matchingService === "string" ? parsed.matchingService : opportunity.matching_service,
          score_explanation: {
            score,
            explanation: parsed.scoreExplanation,
            method: modelUsed === "heuristic" ? "heuristic" : "ai",
            note: "Estimate from available evidence. Not a guaranteed outcome.",
          } as unknown as Json,
        })
        .eq("id", opportunity.id);
    }

    revalidatePath("/analyze");
    revalidatePath(`/analyze/${targetId}`);
    if (websiteId) revalidatePath(`/analyze/${websiteId}`);
    revalidatePath("/discover");
    revalidatePath("/websites");
    revalidatePath("/dashboard");

    const warnings = [
      canScanSite && !page.fetched
        ? "The live page could not be read. Findings stay limited to public scan data."
        : null,
      aiWarning ?? null,
    ].filter(Boolean);
    return {
      ok: true as const,
      warning: warnings.length ? warnings.join(" ") : undefined,
    };
  } catch (error) {
    return { ok: false as const, error: publicError(error) };
  }
}

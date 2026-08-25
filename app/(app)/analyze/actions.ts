"use server";

import { revalidatePath } from "next/cache";
import { analyzeWebsite, extractPainPoints, scoreLead } from "@/lib/ai";
import { collectWebsiteEvidence } from "@/lib/analysis/collect-evidence";
import { parseJsonFromModel } from "@/lib/ai/json";
import { getModel } from "@/lib/ai/client";
import { isOpenRouterConfigured } from "@/lib/env";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export const maxDuration = 60;

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

export async function runAnalysis(targetId: string) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return { ok: false as const, error: "Sign in required" };
  if (!isOpenRouterConfigured()) {
    return { ok: false as const, error: "OpenRouter is not configured" };
  }

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
  const page = await collectWebsiteEvidence({
    url,
    domain,
    urlscanUuid: opportunity?.source === "website_discovery" ? opportunity.source_id : null,
  });

  const evidence = {
    domain,
    url: page.finalUrl ?? url,
    storedTitle: website?.title ?? opportunity?.title ?? null,
    company: website?.business_name ?? opportunity?.company_name ?? page.ogSiteName ?? null,
    storedIndustry: website?.industry ?? opportunity?.industry ?? null,
    storedLocation: website?.location ?? opportunity?.location ?? null,
    estimatedNeed: opportunity?.estimated_need ?? null,
    page,
  };

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
${JSON.stringify(evidence, null, 2)}`;

  const [analysisText, scoreText, painText] = await Promise.all([
    analyzeWebsite(prompt),
    scoreLead(`Score this opportunity from evidence only.\n${JSON.stringify(evidence)}`),
    extractPainPoints(`Extract pain points from evidence only. Do not invent issues from missing fields.\n${JSON.stringify(evidence)}`),
  ]);

  const parsed = parseJsonFromModel(analysisText) ?? {};
  const overviewFields = asOverview(parsed.overview);
  const overview = {
    ...(typeof parsed.overview === "object" && parsed.overview ? (parsed.overview as Record<string, unknown>) : { summary: analysisText }),
    evidenceSource: page.source,
    evidenceTitle: page.title,
    evidenceUrl: page.finalUrl,
    evidenceNotes: page.notes,
  } as Json;
  const technical = (parsed.technical as Json) ?? [];
  const business = (parsed.business as Json) ?? [];
  const score =
    typeof parsed.score === "number"
      ? Math.max(0, Math.min(100, parsed.score))
      : opportunity?.opportunity_score ?? null;
  const usableOverview = overviewFields?.label === "detected" || overviewFields?.label === "possible";

  let websiteId = website?.id ?? opportunity?.website_id ?? null;
  const location = [page.city, page.country].filter(Boolean).join(", ") || website?.location || opportunity?.location || null;
  if (!websiteId && domain) {
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
        model_used: getModel("reasoning"),
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
    model_used: getModel("reasoning"),
    input_summary: evidence.domain ?? page.title,
    result: {
      overview,
      technical,
      business,
      scoreText,
      painText,
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
      point.severity === "critical" || point.severity === "high" || point.severity === "medium" || point.severity === "low"
        ? point.severity
        : "medium";
    const confidence =
      point.confidence === "detected" || point.confidence === "possible" || point.confidence === "unable_to_determine"
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
        estimated_need:
          typeof parsed.estimatedNeed === "string" ? parsed.estimatedNeed : opportunity.estimated_need,
        matching_service:
          typeof parsed.matchingService === "string" ? parsed.matchingService : opportunity.matching_service,
        score_explanation: {
          score,
          explanation: parsed.scoreExplanation ?? scoreText,
          method: "ai",
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
  return {
    ok: true as const,
    warning: page.fetched ? undefined : "The live page could not be read. Findings stay limited to public scan data.",
  };
}

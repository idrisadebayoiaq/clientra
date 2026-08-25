"use server";

import { revalidatePath } from "next/cache";
import { analyzeWebsite, extractPainPoints, scoreLead } from "@/lib/ai";
import { parseJsonFromModel } from "@/lib/ai/json";
import { getModel } from "@/lib/ai/client";
import { isOpenRouterConfigured, isUrlscanConfigured, getServerEnv } from "@/lib/env";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

async function evidenceFromUrlscan(uuid: string) {
  if (!isUrlscanConfigured()) return null;
  const env = getServerEnv();
  const response = await fetch(`https://urlscan.io/api/v1/result/${uuid}/`, {
    headers: { "API-Key": env.urlscanApiKey },
  });
  if (!response.ok) return null;
  const json = (await response.json()) as {
    page?: {
      title?: string;
      domain?: string;
      url?: string;
      country?: string;
      server?: string;
      ip?: string;
      status?: string;
    };
    verdicts?: { overall?: { score?: number; malicious?: boolean } };
  };
  return json.page
    ? {
        title: json.page.title ?? null,
        domain: json.page.domain ?? null,
        url: json.page.url ?? null,
        country: json.page.country ?? null,
        server: json.page.server ?? null,
        ip: json.page.ip ?? null,
        status: json.page.status ?? null,
        malicious: json.verdicts?.overall?.malicious ?? null,
      }
    : null;
}

export async function runAnalysis(targetId: string) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return { ok: false as const, error: "Sign in required" };
  if (!isOpenRouterConfigured()) {
    return { ok: false as const, error: "OpenRouter is not configured" };
  }

  const { data: website } = await supabase.from("websites").select("*").eq("id", targetId).maybeSingle();
  const { data: opportunity } = website
    ? await supabase.from("opportunities").select("*").eq("website_id", website.id).maybeSingle()
    : await supabase.from("opportunities").select("*").eq("id", targetId).maybeSingle();

  if (!website && !opportunity) {
    return { ok: false as const, error: "Nothing to analyze" };
  }

  let scan: Awaited<ReturnType<typeof evidenceFromUrlscan>> = null;
  if (opportunity?.source === "website_discovery" && opportunity.source_id) {
    scan = await evidenceFromUrlscan(opportunity.source_id);
  }

  const evidence = {
    domain: website?.domain ?? opportunity?.domain ?? null,
    url: website?.url ?? opportunity?.source_url ?? null,
    title: website?.title ?? opportunity?.title ?? null,
    company: website?.business_name ?? opportunity?.company_name ?? null,
    industry: website?.industry ?? opportunity?.industry ?? null,
    location: website?.location ?? opportunity?.location ?? null,
    estimatedNeed: opportunity?.estimated_need ?? null,
    urlscan: scan,
  };

  const prompt = `Return JSON only with this shape:
{"overview":{"businessType":"string","industry":"string","label":"detected|possible|unable_to_determine"},"technical":[{"title":"string","label":"detected|possible|unable_to_determine","evidence":"string"}],"business":[{"title":"string","label":"detected|possible|unable_to_determine","evidence":"string"}],"painPoints":[{"title":"string","severity":"critical|high|medium|low","confidence":"detected|possible|unable_to_determine","why":"string"}],"score":0,"scoreExplanation":"string","estimatedNeed":"string","matchingService":"string"}
Use only this evidence. If a field is not supported, use Unable to determine. Never invent contacts or issues.
Evidence:
${JSON.stringify(evidence, null, 2)}`;

  const [analysisText, scoreText, painText] = await Promise.all([
    analyzeWebsite(prompt),
    scoreLead(`Score this opportunity from evidence only.\n${JSON.stringify(evidence)}`),
    extractPainPoints(`Extract pain points from evidence only.\n${JSON.stringify(evidence)}`),
  ]);

  const parsed = parseJsonFromModel(analysisText) ?? {};
  const overview = (parsed.overview as Json) ?? { summary: analysisText };
  const technical = (parsed.technical as Json) ?? [];
  const business = (parsed.business as Json) ?? [];
  const score =
    typeof parsed.score === "number"
      ? Math.max(0, Math.min(100, parsed.score))
      : opportunity?.opportunity_score ?? null;

  let websiteId = website?.id ?? opportunity?.website_id ?? null;
  if (!websiteId && (website?.domain || opportunity?.domain)) {
    const domain = website?.domain ?? opportunity?.domain;
    if (domain) {
      const { data: created } = await supabase
        .from("websites")
        .upsert(
          {
            user_id: user.id,
            domain,
            normalized_url: opportunity?.normalized_url ?? domain,
            url: website?.url ?? opportunity?.source_url ?? `https://${domain}`,
            title: website?.title ?? opportunity?.title,
            business_name: website?.business_name ?? opportunity?.company_name ?? domain,
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
    input_summary: evidence.domain ?? evidence.title,
    result: {
      overview,
      technical,
      business,
      scoreText,
      painText,
    } as Json,
  });

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
  revalidatePath("/discover");
  revalidatePath("/websites");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

import type { NormalizedOpportunity } from "@/lib/opportunities/types";
import type { Database } from "@/types/database";

type Freshness = Database["public"]["Enums"]["freshness_status"];

export function freshnessFromDate(publishedAt?: string, freshnessHours = 48): Freshness {
  if (!publishedAt) return "UNKNOWN";
  const ageHours = (Date.now() - new Date(publishedAt).getTime()) / 3_600_000;
  if (Number.isNaN(ageHours) || ageHours < 0) return "UNKNOWN";
  if (ageHours <= 24) return "NEW";
  if (ageHours <= freshnessHours) return "FRESH";
  if (ageHours <= 72) return "AGING";
  return "EXPIRED";
}

export function heuristicScore(item: NormalizedOpportunity, keywords: string[] = []) {
  let score = 42;
  const haystack = `${item.title} ${item.companyName ?? ""} ${item.estimatedNeed ?? ""}`.toLowerCase();
  if (item.publishedAt) {
    const ageHours = (Date.now() - new Date(item.publishedAt).getTime()) / 3_600_000;
    if (ageHours <= 24) score += 18;
    else if (ageHours <= 48) score += 12;
    else if (ageHours <= 72) score += 6;
  }
  if (item.domain) score += 8;
  if (item.sourceUrl) score += 6;
  if (keywords.some((keyword) => haystack.includes(keyword.toLowerCase()))) score += 14;
  return Math.max(15, Math.min(92, score));
}

export function scoreExplanation(item: NormalizedOpportunity, score: number) {
  return {
    score,
    method: "heuristic",
    note: "Estimate from freshness, public source data, and service-keyword overlap. Not a guaranteed outcome.",
    signals: {
      domain: Boolean(item.domain),
      sourceUrl: Boolean(item.sourceUrl),
      publishedAt: item.publishedAt ?? null,
    },
  };
}

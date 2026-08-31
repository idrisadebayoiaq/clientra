import type { Tables } from "@/types/database";
import type { Json } from "@/types/database";

export type PitchAngle = {
  angle: string;
  evidence?: string;
  service?: string;
};

export type PitchContext = {
  summary: string;
  gaps: string[];
  pitchAngles: PitchAngle[];
  painPoints: { title: string; severity: string; description?: string | null }[];
  localInsights: string[];
  recommendedService: string | null;
  websiteAudited: boolean;
};

function asRecord(value: Json | null | undefined): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function asPitchAngles(value: unknown): PitchAngle[] {
  if (!Array.isArray(value)) return [];
  const result: PitchAngle[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const angle = typeof row.angle === "string" ? row.angle : typeof row.title === "string" ? row.title : null;
    if (!angle) continue;
    result.push({
      angle,
      evidence: typeof row.evidence === "string" ? row.evidence : undefined,
      service: typeof row.service === "string" ? row.service : undefined,
    });
  }
  return result;
}

export function buildPitchContext(input: {
  opportunity: Tables<"opportunities">;
  analysisRow?: {
    overview: Json;
    technical: Json;
    business: Json;
  } | null;
  painPoints?: { title: string; severity: string; description?: string | null }[];
}): PitchContext {
  const overview = asRecord(input.analysisRow?.overview as Json);
  const scoreExplanation = asRecord(input.opportunity.score_explanation);
  const gaps = asStringArray(overview.gaps ?? scoreExplanation.gaps);
  const pitchAngles = [
    ...asPitchAngles(overview.pitchAngles),
    ...asPitchAngles(scoreExplanation.pitchAngles),
  ];
  const localInsights = asStringArray(scoreExplanation.insights);
  const recommendedService =
    (typeof scoreExplanation.recommendedService === "string" ? scoreExplanation.recommendedService : null) ??
    input.opportunity.estimated_need ??
    input.opportunity.matching_service ??
    null;

  const technicalFindings = Array.isArray(input.analysisRow?.technical)
    ? (input.analysisRow!.technical as { title?: string; evidence?: string; label?: string }[])
        .filter((row) => row.label === "detected" || row.label === "possible")
        .slice(0, 4)
        .map((row) => `${row.title}: ${row.evidence ?? ""}`.trim())
    : [];

  const businessFindings = Array.isArray(input.analysisRow?.business)
    ? (input.analysisRow!.business as { title?: string; evidence?: string; label?: string }[])
        .filter((row) => row.label === "detected" || row.label === "possible")
        .slice(0, 4)
        .map((row) => `${row.title}: ${row.evidence ?? ""}`.trim())
    : [];

  const painPoints = input.painPoints ?? [];
  const websiteAudited = input.opportunity.status === "analyzed" || Boolean(input.analysisRow);

  const summaryParts = [
    `Business: ${input.opportunity.company_name ?? input.opportunity.title}`,
    input.opportunity.industry ? `Industry: ${input.opportunity.industry}` : null,
    input.opportunity.location ? `Location: ${input.opportunity.location}` : null,
    recommendedService ? `Recommended service to pitch: ${recommendedService}` : null,
    gaps.length ? `Website gaps: ${gaps.join("; ")}` : null,
    pitchAngles.length
      ? `Pitch angles: ${pitchAngles.map((item) => item.angle).join("; ")}`
      : null,
    painPoints.length
      ? `Pain points: ${painPoints.map((point) => `${point.severity} — ${point.title}`).join("; ")}`
      : null,
    technicalFindings.length ? `Technical audit: ${technicalFindings.join(" | ")}` : null,
    businessFindings.length ? `Business audit: ${businessFindings.join(" | ")}` : null,
    localInsights.length ? `Google listing insights: ${localInsights.join("; ")}` : null,
    scoreExplanation.websiteStatus === "missing"
      ? "No website on Google — pitch web presence, credibility, and lead capture."
      : null,
  ].filter(Boolean);

  return {
    summary: summaryParts.join("\n"),
    gaps,
    pitchAngles,
    painPoints,
    localInsights,
    recommendedService,
    websiteAudited,
  };
}

export function pitchContextForPrompt(context: PitchContext) {
  return `Use this audit evidence to write a pitch. Lead with what the business is lacking or could improve. Tie each point to a service the sender offers. Do not invent facts.

${context.summary}

Pitch instructions:
- Open with one specific gap or opportunity from the audit (not a generic compliment).
- Offer 1–2 concrete ways you can help based on detected gaps.
- Keep tone helpful, not salesy. Under 180 words for email.
- If no website was found, pitch building one and capturing leads from their Google reviews.
- If website was audited, reference specific findings (SEO, speed, mobile, conversion, outdated design, missing contact paths).
`;
}

import type { LocalBusinessCardData } from "@/components/app/local-business-card";
import type { Json } from "@/types/database";

type ScoreExplanation = {
  insights?: string[];
  recommendedService?: string;
  websiteStatus?: "missing" | "present";
  batchId?: string;
  searchCategory?: string;
  searchLocation?: string;
};

function asScoreExplanation(value: Json | null): ScoreExplanation {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as ScoreExplanation;
}

type OpportunityRow = {
  id: string;
  title: string;
  opportunity_score: number | null;
  score_explanation: Json | null;
  estimated_need: string | null;
  website_id: string | null;
  status: string;
  raw_payload: Json | null;
  contacts?:
    | {
        email: string | null;
        phone: string | null;
        website: string | null;
        notes: string | null;
        verification_status: "verified" | "unverified" | "unknown";
      }[]
    | {
        email: string | null;
        phone: string | null;
        website: string | null;
        notes: string | null;
        verification_status: "verified" | "unverified" | "unknown";
      }
    | null;
};

export function mapOpportunityToLocalBusinessCard(
  row: OpportunityRow,
  options?: { category?: string; location?: string; saved?: boolean },
): LocalBusinessCardData | null {
  if (!row.website_id) return null;

  const explanation = asScoreExplanation(row.score_explanation);
  const raw = row.raw_payload as {
    searchCategory?: string;
    searchLocation?: string;
    place?: {
      name?: string;
      address?: string | null;
      phone?: string | null;
      website?: string | null;
      googleMapsUrl?: string | null;
      rating?: number | null;
      reviewCount?: number | null;
      categoryLabel?: string | null;
    };
  } | null;
  const place = raw?.place;
  const contact = Array.isArray(row.contacts) ? row.contacts[0] : row.contacts;
  const contactSummary = contact
    ? {
        email: contact.email,
        phone: contact.phone,
        website: contact.website,
        notes: contact.notes,
        verification_status: contact.verification_status,
        business_name: null,
        full_name: null,
      }
    : null;

  const isSaved = options?.saved ?? row.status === "saved";

  return {
    opportunityId: row.id,
    websiteId: row.website_id,
    name: row.title,
    categoryLabel: place?.categoryLabel ?? null,
    searchCategory:
      explanation.searchCategory ?? options?.category ?? raw?.searchCategory ?? "Local",
    address: place?.address ?? null,
    phone: place?.phone ?? contact?.phone ?? null,
    website: place?.website ?? contact?.website ?? null,
    googleMapsUrl: place?.googleMapsUrl ?? null,
    rating: place?.rating ?? null,
    reviewCount: place?.reviewCount ?? null,
    score: row.opportunity_score ?? 0,
    insights: explanation.insights ?? [],
    recommendedService:
      explanation.recommendedService ?? row.estimated_need ?? "Website Design & Development",
    websiteStatus: explanation.websiteStatus ?? (place?.website ? "present" : "missing"),
    savedStatus: isSaved ? "saved" : "new",
    contact: contactSummary,
    inLeads: isSaved,
  };
}

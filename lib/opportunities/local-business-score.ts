import type { GooglePlaceBusiness } from "@/lib/opportunities/google-places";

export type LocalBusinessScore = {
  score: number;
  insights: string[];
  recommendedService: string;
  websiteStatus: "missing" | "present";
};

const SERVICE_RECOMMENDATIONS: Record<string, string> = {
  website: "Website Design & Development",
  ui_ux: "Website Design & UI/UX",
  seo: "SEO & Local Search",
  digital_marketing: "Digital Marketing",
  branding: "Branding & Online Presence",
  ecommerce: "E-commerce Development",
  full_stack: "Custom Web Application",
  other: "Digital Services",
};

export function scoreLocalBusiness(
  place: GooglePlaceBusiness,
  options?: { matchingService?: string | null; searchCategory?: string },
): LocalBusinessScore {
  let score = 38;
  const insights: string[] = [];
  const hasWebsite = Boolean(place.website);
  const websiteStatus = hasWebsite ? "present" : "missing";

  if (!hasWebsite) {
    score += 28;
    insights.push("No website listed on Google — full web presence opportunity");
  } else {
    score += 8;
    insights.push("Website detected — audit for improvements and conversion gaps");
  }

  if (place.reviewCount != null && place.reviewCount >= 5) {
    score += 12;
    insights.push(`${place.reviewCount} reviews — active business`);
  }

  if (place.rating != null && place.rating >= 4.5) {
    score += 10;
    insights.push(`Well rated (${place.rating.toFixed(1)}★) — reputation worth showcasing online`);
  } else if (place.rating != null && place.rating < 3.5 && place.reviewCount && place.reviewCount >= 3) {
    score += 6;
    insights.push(`Lower rating (${place.rating.toFixed(1)}★) — reputation and web presence may need work`);
  }

  if (place.phone) {
    score += 8;
    insights.push("Phone listed on Google — reachable for outreach");
  }

  if (place.businessStatus && place.businessStatus !== "OPERATIONAL") {
    score -= 15;
    insights.push(`Business status: ${place.businessStatus.replace(/_/g, " ").toLowerCase()}`);
  }

  const category = options?.searchCategory?.trim();
  if (category) {
    score += 6;
    insights.push(`Matches your search: ${category}`);
  }

  const baseService = options?.matchingService ?? SERVICE_RECOMMENDATIONS.website;
  const recommendedService = hasWebsite ? `${baseService} · Site audit` : baseService;

  return {
    score: Math.max(15, Math.min(98, score)),
    insights: insights.slice(0, 4),
    recommendedService,
    websiteStatus,
  };
}

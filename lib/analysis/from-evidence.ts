import type { WebsiteEvidence } from "@/lib/analysis/collect-evidence";

type Finding = { title: string; label: "detected" | "possible" | "unable_to_determine"; evidence: string };

function inferIndustry(page: WebsiteEvidence) {
  const types = page.jsonLdTypes.join(" ").toLowerCase();
  const text = [page.title, page.metaDescription, page.textSnippet, page.ogSiteName, ...page.headings]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/bakery|pastry|baker|patisserie/.test(text) || /bakery|pastry|foodestablishment|restaurant/.test(types)) {
    return "Food & bakery";
  }
  if (/restaurant|cafe|coffee|catering/.test(text) || /restaurant|foodestablishment/.test(types)) {
    return "Food & hospitality";
  }
  if (/ecommerce|shopify|woocommerce|store|retail/.test(text) || /store|product/.test(types) || page.isEcommerce) {
    return "Retail / ecommerce";
  }
  if (/agency|marketing|seo|design studio/.test(text)) return "Professional services";
  if (/software|saas|developer|app/.test(text)) return "Technology";
  if (/health|clinic|dental|medical/.test(text)) return "Healthcare";
  if (/law|legal|attorney/.test(text)) return "Legal services";
  if (/real estate|property|realtor/.test(text)) return "Real estate";
  if (page.platform === "Squarespace" && /portfolio|photography|creative/.test(text)) return "Creative services";
  return "Unable to determine";
}

export function buildHeuristicAnalysis(input: {
  domain: string | null;
  company: string | null;
  page: WebsiteEvidence;
  listing?: {
    title?: string | null;
    source?: string | null;
    location?: string | null;
    industry?: string | null;
    estimatedNeed?: string | null;
    sourceUrl?: string | null;
  };
}) {
  const page = input.page;
  const listing = input.listing;
  const technical: Finding[] = [];
  const business: Finding[] = [];
  const isListing =
    listing?.source === "job" ||
    listing?.source === "problem_post" ||
    listing?.source === "adzuna" ||
    (listing?.source === "manual" && listing?.title && !/^analyze\s+/i.test(listing.title));

  if (page.https != null) {
    technical.push({
      title: "HTTPS",
      label: page.https ? "detected" : "possible",
      evidence: page.https ? `${page.finalUrl ?? input.domain} uses https.` : "The captured URL did not use https.",
    });
  }
  if (page.title) {
    technical.push({
      title: "Page title",
      label: "detected",
      evidence: page.title,
    });
  }
  if (page.technologies.length) {
    technical.push({
      title: "Technology",
      label: "detected",
      evidence: page.technologies.join(", "),
    });
  } else if (page.fetched) {
    technical.push({
      title: "Technology",
      label: "unable_to_determine",
      evidence: "No stack signatures were present in the captured HTML.",
    });
  }
  if (page.server) {
    technical.push({
      title: "Hosting / server",
      label: "detected",
      evidence: page.server,
    });
  }
  if (page.hasViewport != null) {
    technical.push({
      title: "Mobile viewport",
      label: page.hasViewport ? "detected" : "possible",
      evidence: page.hasViewport ? "A viewport meta tag was present." : "No viewport meta tag was found in the captured HTML.",
    });
  }
  if (page.metaDescription) {
    technical.push({
      title: "Meta description",
      label: "detected",
      evidence: page.metaDescription,
    });
  } else if (page.fetched) {
    technical.push({
      title: "Meta description",
      label: "possible",
      evidence: "Captured HTML did not include a meta description.",
    });
  }
  if (!page.fetched) {
    technical.push({
      title: "Company website",
      label: "unable_to_determine",
      evidence: isListing
        ? "This record is a listing, not a captured company homepage. Stack and SEO checks were not run."
        : "No live HTML or urlscan snapshot was available.",
    });
  }

  if (page.ogSiteName || input.company) {
    business.push({
      title: "Brand / company",
      label: "detected",
      evidence: page.ogSiteName || input.company || "",
    });
  }
  if (listing?.title && listing.source !== "manual") {
    business.push({
      title: listing.source === "job" || listing.source === "adzuna" ? "Role / listing" : "Listing title",
      label: "detected",
      evidence: listing.title,
    });
  } else if (listing?.title && listing.source === "manual" && !/^analyze\s+/i.test(listing.title)) {
    business.push({
      title: "Listing title",
      label: "detected",
      evidence: listing.title,
    });
  }
  if (listing?.industry) {
    business.push({
      title: "Industry",
      label: "detected",
      evidence: listing.industry,
    });
  }
  if (listing?.location || page.city || page.country) {
    business.push({
      title: "Location",
      label: "detected",
      evidence: listing?.location || [page.city, page.country].filter(Boolean).join(", "),
    });
  }
  if (listing?.estimatedNeed) {
    business.push({
      title: "Public listing copy",
      label: "detected",
      evidence: listing.estimatedNeed.slice(0, 400),
    });
  }
  if (page.textSnippet) {
    business.push({
      title: "Public copy",
      label: "detected",
      evidence: page.textSnippet.slice(0, 400),
    });
  }
  if (page.isEcommerce != null) {
    business.push({
      title: "Ecommerce signals",
      label: page.isEcommerce ? "detected" : "possible",
      evidence: page.isEcommerce
        ? `Cart/product markers or ecommerce platform (${page.platform ?? "unknown"}) were present.`
        : "No ecommerce markers were found in the captured HTML.",
    });
  }
  if (page.jsonLdTypes.length) {
    business.push({
      title: "Structured data",
      label: "detected",
      evidence: page.jsonLdTypes.join(", "),
    });
  }

  const painPoints = [];
  if (page.fetched && !page.metaDescription) {
    painPoints.push({
      title: "Missing meta description",
      severity: "low" as const,
      confidence: "detected" as const,
      why: "The captured HTML has no meta description, which can weaken search snippets.",
    });
  }

  const inferredIndustry = inferIndustry(page);
  const businessType =
    page.jsonLdTypes.find((item) => /organization|localbusiness|store|product|restaurant|bakery|food/i.test(item)) ||
    page.platform ||
    (listing?.source === "job" || listing?.source === "adzuna" ? "Hiring / job listing" : null) ||
    (page.ogSiteName ? "Website / online business" : null);

  return {
    overview: {
      businessType: businessType ?? "Unable to determine",
      industry: listing?.industry && listing.industry !== "Unable to determine" ? listing.industry : inferredIndustry,
      label: page.fetched || input.company || listing?.title ? "detected" : "unable_to_determine",
    },
    technical: technical.length
      ? technical
      : [{ title: "Page capture", label: "unable_to_determine" as const, evidence: "No live HTML or urlscan snapshot was available." }],
    business: business.length
      ? business
      : [{ title: "Business profile", label: "unable_to_determine" as const, evidence: "No public business copy was captured." }],
    painPoints,
    score: page.fetched ? 45 : listing?.title ? 30 : 10,
    scoreExplanation: page.fetched
      ? "Baseline score from captured public page evidence only. Not a guaranteed outcome."
      : listing?.title
        ? "Score from listing details only. A company website was not captured."
        : "Little public page evidence was captured, so the score stays low.",
    estimatedNeed: listing?.estimatedNeed ?? "Unable to determine",
    matchingService: "Unable to determine",
  };
}

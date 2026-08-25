import type { WebsiteEvidence } from "@/lib/analysis/collect-evidence";

type Finding = { title: string; label: "detected" | "possible" | "unable_to_determine"; evidence: string };

export function buildHeuristicAnalysis(input: {
  domain: string | null;
  company: string | null;
  page: WebsiteEvidence;
}) {
  const page = input.page;
  const technical: Finding[] = [];
  const business: Finding[] = [];

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
  } else {
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

  if (page.ogSiteName || input.company) {
    business.push({
      title: "Brand / company",
      label: "detected",
      evidence: page.ogSiteName || input.company || "",
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
  if (page.country || page.city) {
    business.push({
      title: "Location",
      label: "detected",
      evidence: [page.city, page.country].filter(Boolean).join(", "),
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

  const businessType =
    page.jsonLdTypes.find((item) => /organization|localbusiness|store|product/i.test(item)) ||
    page.platform ||
    (page.ogSiteName ? "Website / online business" : null);

  return {
    overview: {
      businessType: businessType ?? "Unable to determine",
      industry: "Unable to determine",
      label: page.fetched ? (businessType ? "detected" : "possible") : "unable_to_determine",
    },
    technical: technical.length
      ? technical
      : [{ title: "Page capture", label: "unable_to_determine" as const, evidence: "No live HTML or urlscan snapshot was available." }],
    business: business.length
      ? business
      : [{ title: "Business profile", label: "unable_to_determine" as const, evidence: "No public business copy was captured." }],
    painPoints,
    score: page.fetched ? 45 : 10,
    scoreExplanation: page.fetched
      ? "Baseline score from captured public page evidence only. Not a guaranteed outcome."
      : "Little public page evidence was captured, so the score stays low.",
    estimatedNeed: "Unable to determine",
    matchingService: "Unable to determine",
  };
}

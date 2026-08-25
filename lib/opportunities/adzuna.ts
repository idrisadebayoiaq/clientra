import { getServerEnv, isAdzunaConfigured } from "@/lib/env";
import { contentHash } from "@/lib/opportunities/hash";
import {
  SourceNotConfiguredError,
  type DiscoverOptions,
  type NormalizedOpportunity,
  type OpportunitySourceAdapter,
} from "@/lib/opportunities/types";

type AdzunaJob = {
  id?: string | number;
  title?: string;
  description?: string;
  created?: string;
  redirect_url?: string;
  location?: { display_name?: string };
  company?: { display_name?: string };
  category?: { label?: string };
};

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function normalize(raw: unknown): NormalizedOpportunity {
  const job = raw as AdzunaJob;
  const description = job.description ? stripHtml(job.description).slice(0, 400) : undefined;
  const sourceId = String(job.id ?? "");
  return {
    title: job.title || "Job opportunity",
    companyName: job.company?.display_name,
    sourceId,
    sourceUrl: job.redirect_url,
    contentHash: contentHash(`adzuna:${sourceId}`),
    industry: job.category?.label,
    location: job.location?.display_name,
    estimatedNeed: description,
    publishedAt: job.created,
    raw,
  };
}

async function searchCountry(country: string, what: string, freshnessHours: number) {
  const env = getServerEnv();
  const params = new URLSearchParams({
    app_id: env.adzunaAppId,
    app_key: env.adzunaAppKey,
    results_per_page: "15",
    what,
    max_days_old: String(Math.max(1, Math.ceil(freshnessHours / 24))),
    sort_by: "date",
    content_type: "application/json",
  });
  const response = await fetch(
    `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params.toString()}`,
  );
  if (!response.ok) {
    throw new Error(`Adzuna request failed for ${country}`);
  }
  const json = (await response.json()) as { results?: AdzunaJob[] };
  return json.results ?? [];
}

export const adzunaAdapter: OpportunitySourceAdapter = {
  name: "Adzuna",
  configured: () => isAdzunaConfigured(),
  discover: async (options?: DiscoverOptions) => {
    if (!isAdzunaConfigured()) throw new SourceNotConfiguredError("Adzuna");
    const what = (options?.keywords ?? ["website developer", "shopify", "seo"]).slice(0, 4).join(" OR ");
    const countries = (options?.adzunaCountries ?? options?.countries ?? ["us", "gb"]).slice(0, 2);
    const freshnessHours = options?.freshnessHours ?? 48;

    const batches = await Promise.allSettled(
      countries.map((country) => searchCountry(country.toLowerCase(), what, freshnessHours)),
    );
    const jobs = batches.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
    if (!jobs.length && batches.every((result) => result.status === "rejected")) {
      throw new Error("Adzuna provider request failed");
    }
    return adzunaAdapter.deduplicate(jobs.map(normalize));
  },
  fetch: async (id) => {
    const items = await adzunaAdapter.discover();
    return items.find((item) => item.sourceId === id) ?? null;
  },
  normalize,
  deduplicate: (items) => {
    const seen = new Set<string>();
    return items.filter((item) => {
      const key = item.sourceId ?? item.contentHash ?? item.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },
  score: () => null,
};

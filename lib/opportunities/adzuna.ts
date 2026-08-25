import { getServerEnv, isAdzunaConfigured } from "@/lib/env";
import { shouldPersistWebsite } from "@/lib/opportunities/domains";
import { contentHash } from "@/lib/opportunities/hash";
import {
  SourceNotConfiguredError,
  type DiscoverOptions,
  type NormalizedOpportunity,
  type OpportunitySourceAdapter,
} from "@/lib/opportunities/types";
import { extractDomain, normalizeUrl } from "@/lib/utils";

const ADZUNA_COUNTRIES = new Set([
  "at",
  "au",
  "be",
  "br",
  "ca",
  "ch",
  "de",
  "es",
  "fr",
  "gb",
  "ie",
  "in",
  "it",
  "mx",
  "nl",
  "nz",
  "pl",
  "sg",
  "us",
  "za",
]);

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

function sanitizeWhat(value: string) {
  return value.replace(/[^\w\s+-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

function firstCompanySite(text?: string) {
  const match = text?.match(/https?:\/\/[^\s<"']+/i);
  if (!match?.[0]) return undefined;
  const domain = extractDomain(match[0]);
  return shouldPersistWebsite(domain) ? { domain, url: match[0] } : undefined;
}

function normalize(raw: unknown): NormalizedOpportunity {
  const job = raw as AdzunaJob;
  const description = job.description ? stripHtml(job.description).slice(0, 400) : undefined;
  const sourceId = String(job.id ?? "");
  const site = firstCompanySite(job.description);
  return {
    title: job.title || "Job opportunity",
    companyName: job.company?.display_name,
    sourceId,
    sourceUrl: site?.url ?? job.redirect_url,
    normalizedUrl: site?.url ? normalizeUrl(site.url) : undefined,
    domain: site?.domain,
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
    results_per_page: "20",
    what,
    max_days_old: String(Math.max(1, Math.ceil(freshnessHours / 24))),
  });
  const response = await fetch(
    `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params.toString()}`,
  );
  if (!response.ok) return [];
  const json = (await response.json()) as { results?: AdzunaJob[] };
  return json.results ?? [];
}

export const adzunaAdapter: OpportunitySourceAdapter = {
  name: "Adzuna",
  configured: () => isAdzunaConfigured(),
  discover: async (options?: DiscoverOptions) => {
    if (!isAdzunaConfigured()) throw new SourceNotConfiguredError("Adzuna");
    const freshnessHours = options?.freshnessHours ?? 48;
    const countries = (options?.adzunaCountries ?? [])
      .map((country) => country.toLowerCase())
      .filter((country) => ADZUNA_COUNTRIES.has(country));
    const usableCountries = (countries.length ? countries : ["us", "gb"]).slice(0, 2);
    const keywords = (options?.keywords ?? ["web developer", "shopify", "seo"])
      .map(sanitizeWhat)
      .filter((keyword) => keyword.length >= 2)
      .slice(0, 2);
    const usableKeywords = keywords.length ? keywords : ["web developer"];

    const jobs: AdzunaJob[] = [];
    for (const country of usableCountries) {
      for (const what of usableKeywords) {
        jobs.push(...(await searchCountry(country, what, freshnessHours)));
        if (jobs.length >= 20) break;
      }
      if (jobs.length >= 20) break;
    }

    if (!jobs.length) {
      jobs.push(...(await searchCountry("us", "software developer", Math.max(freshnessHours, 72))));
      jobs.push(...(await searchCountry("gb", "web developer", Math.max(freshnessHours, 72))));
    }

    return adzunaAdapter.deduplicate(jobs.map(normalize).filter((item) => item.sourceId));
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

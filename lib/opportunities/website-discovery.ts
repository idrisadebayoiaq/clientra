import { getServerEnv, isUrlscanConfigured } from "@/lib/env";
import { isJunkDiscoveryDomain } from "@/lib/opportunities/domains";
import { contentHash } from "@/lib/opportunities/hash";
import { extractDomain, normalizeUrl } from "@/lib/utils";
import {
  SourceNotConfiguredError,
  type NormalizedOpportunity,
  type OpportunitySourceAdapter,
} from "@/lib/opportunities/types";

type UrlscanHit = {
  task?: { uuid?: string; time?: string; url?: string };
  page?: {
    domain?: string;
    url?: string;
    country?: string;
    title?: string;
    server?: string;
  };
};

function normalize(raw: unknown): NormalizedOpportunity {
  const hit = raw as UrlscanHit;
  const url = hit.page?.url ?? hit.task?.url ?? "";
  const domain = hit.page?.domain ?? (url ? extractDomain(url) : "");
  return {
    title: hit.page?.title || domain || "Newly detected website",
    companyName: domain,
    sourceId: hit.task?.uuid,
    sourceUrl: url,
    normalizedUrl: url ? normalizeUrl(url) : domain,
    domain,
    contentHash: contentHash(`urlscan:${domain}:${url}`),
    location: hit.page?.country,
    publishedAt: hit.task?.time,
    raw,
  };
}

export const websiteDiscoveryAdapter: OpportunitySourceAdapter = {
  name: "Website Discovery",
  configured: () => isUrlscanConfigured(),
  discover: async (options) => {
    if (!isUrlscanConfigured()) throw new SourceNotConfiguredError("Website Discovery");
    const env = getServerEnv();
    const hours = options?.freshnessHours ?? 48;
    const days = hours <= 24 ? "24h" : hours <= 48 ? "2d" : "3d";
    const countryCodes = (options?.countries ?? [])
      .map((country) => country.trim().toUpperCase())
      .filter((country) => /^[A-Z]{2}$/.test(country))
      .slice(0, 3);
    const countryQuery =
      !options?.worldwide && countryCodes.length
        ? ` AND (${countryCodes.map((code) => `page.country:${code}`).join(" OR ")})`
        : "";
    const query = `date:>now-${days} AND page.status:200${countryQuery}`;
    const response = await fetch(
      `https://urlscan.io/api/v1/search/?q=${encodeURIComponent(query)}&size=25`,
      { headers: { "API-Key": env.urlscanApiKey, "User-Agent": "clientra/0.1" } },
    );
    if (!response.ok) {
      throw new Error("Website discovery provider request failed");
    }
    const json = (await response.json()) as { results?: UrlscanHit[] };
    const items = (json.results ?? [])
      .map(normalize)
      .filter((item) => Boolean(item.domain) && !isJunkDiscoveryDomain(item.domain));
    return websiteDiscoveryAdapter.deduplicate(items);
  },
  fetch: async (id) => {
    const items = await websiteDiscoveryAdapter.discover();
    return items.find((item) => item.sourceId === id) ?? null;
  },
  normalize,
  deduplicate: (items) => {
    const seen = new Set<string>();
    return items.filter((item) => {
      const key = item.normalizedUrl ?? item.domain ?? item.sourceId ?? item.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },
  score: () => null,
};

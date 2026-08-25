import { getServerEnv, isApolloConfigured } from "@/lib/env";
import { contentHash } from "@/lib/opportunities/hash";
import {
  SourceNotConfiguredError,
  type DiscoverOptions,
  type NormalizedOpportunity,
  type OpportunitySourceAdapter,
} from "@/lib/opportunities/types";
import { extractDomain, normalizeUrl } from "@/lib/utils";

type ApolloOrg = {
  id?: string;
  name?: string;
  website_url?: string;
  primary_domain?: string;
  industry?: string;
  short_description?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  linkedin_url?: string;
};

function normalize(raw: unknown): NormalizedOpportunity {
  const org = raw as ApolloOrg;
  const url = org.website_url || (org.primary_domain ? `https://${org.primary_domain}` : "");
  const domain = org.primary_domain ?? (url ? extractDomain(url) : "");
  const location = [org.city, org.state, org.country].filter(Boolean).join(", ") || undefined;
  return {
    title: org.name || domain || "Company",
    companyName: org.name,
    sourceId: org.id,
    sourceUrl: url || org.linkedin_url,
    normalizedUrl: url ? normalizeUrl(url) : domain,
    domain,
    contentHash: contentHash(`apollo:${org.id ?? domain}:${url}`),
    industry: org.industry,
    location,
    estimatedNeed: org.short_description,
    raw,
  };
}

export const apolloAdapter: OpportunitySourceAdapter = {
  name: "Apollo",
  configured: () => isApolloConfigured(),
  discover: async (options?: DiscoverOptions) => {
    if (!isApolloConfigured()) throw new SourceNotConfiguredError("Apollo");
    const env = getServerEnv();
    const keywords = (options?.keywords ?? ["website", "ecommerce", "saas"]).slice(0, 6);
    const locations = [
      ...(options?.worldwide === false ? (options.countries ?? []) : []),
      ...(options?.cities ?? []),
    ].slice(0, 5);

    const body: Record<string, unknown> = {
      page: 1,
      per_page: 15,
      q_keywords: keywords.join(" "),
    };
    if (locations.length) {
      body.organization_locations = locations;
    }

    const response = await fetch("https://api.apollo.io/api/v1/organizations/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "x-api-key": env.apolloApiKey,
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error("Apollo provider request failed");
    }
    const json = (await response.json()) as { organizations?: ApolloOrg[]; accounts?: ApolloOrg[] };
    const rows = json.organizations ?? json.accounts ?? [];
    const items = rows.map(normalize).filter((item) => item.domain || item.sourceUrl);
    return apolloAdapter.deduplicate(items);
  },
  fetch: async (id) => {
    const items = await apolloAdapter.discover();
    return items.find((item) => item.sourceId === id) ?? null;
  },
  normalize,
  deduplicate: (items) => {
    const seen = new Set<string>();
    return items.filter((item) => {
      const key = item.domain ?? item.sourceId ?? item.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },
  score: () => null,
};

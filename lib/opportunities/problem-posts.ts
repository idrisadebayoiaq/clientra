import { contentHash } from "@/lib/opportunities/hash";
import {
  type DiscoverOptions,
  type NormalizedOpportunity,
  type OpportunitySourceAdapter,
} from "@/lib/opportunities/types";

type HnHit = {
  objectID?: string;
  title?: string;
  story_text?: string;
  comment_text?: string;
  url?: string;
  author?: string;
  created_at?: string;
  points?: number;
};

function normalize(raw: unknown): NormalizedOpportunity {
  const hit = raw as HnHit;
  const sourceId = String(hit.objectID ?? "");
  const sourceUrl = sourceId ? `https://news.ycombinator.com/item?id=${sourceId}` : hit.url;
  const body = hit.story_text || hit.comment_text || hit.title || "";
  return {
    title: hit.title || "Public request",
    personName: hit.author,
    sourceId,
    sourceUrl: hit.url || sourceUrl,
    contentHash: contentHash(`hn:${sourceId}`),
    estimatedNeed: body.slice(0, 400) || undefined,
    publishedAt: hit.created_at,
    raw: {
      objectID: hit.objectID,
      title: hit.title,
      url: hit.url,
      author: hit.author,
      created_at: hit.created_at,
      points: hit.points,
    },
  };
}

async function searchHn(query: string, freshnessHours: number) {
  const since = Math.floor(Date.now() / 1000) - freshnessHours * 3600;
  const params = new URLSearchParams({
    query,
    tags: "(story,ask_hn)",
    hitsPerPage: "12",
    numericFilters: `created_at_i>${since}`,
  });
  const response = await fetch(`https://hn.algolia.com/api/v1/search_by_date?${params.toString()}`, {
    headers: { "User-Agent": "clientra/0.1" },
  });
  if (!response.ok) throw new Error("Problem discovery provider request failed");
  const json = (await response.json()) as { hits?: HnHit[] };
  return json.hits ?? [];
}

export function isProblemDiscoveryConfigured() {
  return true;
}

export const problemPostsAdapter: OpportunitySourceAdapter = {
  name: "Problem Posts",
  configured: () => isProblemDiscoveryConfigured(),
  discover: async (options?: DiscoverOptions) => {
    const freshnessHours = Math.max(options?.freshnessHours ?? 48, 72);
    const keywords = (options?.keywords ?? ["website", "developer", "shopify", "seo"]).slice(0, 3);
    const queries = [
      ...keywords.map((keyword) => `${keyword} (looking OR need OR hire OR freelance)`),
      "looking for freelancer",
      "Ask HN",
    ];

    const batches = await Promise.allSettled(queries.map((query) => searchHn(query, freshnessHours)));
    const hits = batches.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
    if (!hits.length && batches.every((result) => result.status === "rejected")) {
      throw new Error("Problem discovery provider request failed");
    }
    return problemPostsAdapter.deduplicate(
      hits
        .filter((hit) => hit.title || hit.story_text)
        .map(normalize),
    );
  },
  fetch: async (id) => {
    const items = await problemPostsAdapter.discover();
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

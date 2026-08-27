export type NormalizedOpportunity = {
  title: string;
  companyName?: string;
  personName?: string;
  sourceId?: string;
  sourceUrl?: string;
  normalizedUrl?: string;
  domain?: string;
  contentHash?: string;
  industry?: string;
  location?: string;
  estimatedNeed?: string;
  publishedAt?: string;
  raw?: unknown;
};

export class SourceNotConfiguredError extends Error {
  constructor(public source: string) {
    super(`${source} is not configured`);
    this.name = "SourceNotConfiguredError";
  }
}

export type DiscoverOptions = {
  keywords?: string[];
  countries?: string[];
  adzunaCountries?: string[];
  cities?: string[];
  worldwide?: boolean;
  freshnessHours?: number;
  /** Rotates Adzuna pages/keywords so periodic refresh surfaces different listings. */
  discoveryPass?: number;
};

export type OpportunitySourceAdapter = {
  name: string;
  configured: () => boolean;
  discover: (options?: DiscoverOptions) => Promise<NormalizedOpportunity[]>;
  fetch: (id: string) => Promise<NormalizedOpportunity | null>;
  normalize: (raw: unknown) => NormalizedOpportunity;
  deduplicate: (items: NormalizedOpportunity[]) => NormalizedOpportunity[];
  score: (item: NormalizedOpportunity) => number | null;
};

export function notConfiguredAdapter(name: string): OpportunitySourceAdapter {
  return {
    name,
    configured: () => false,
    discover: async () => {
      throw new SourceNotConfiguredError(name);
    },
    fetch: async () => {
      throw new SourceNotConfiguredError(name);
    },
    normalize: () => {
      throw new SourceNotConfiguredError(name);
    },
    deduplicate: (items) => items,
    score: () => null,
  };
}

import { websiteDiscoveryAdapter } from "@/lib/opportunities/website-discovery";
import { apolloAdapter } from "@/lib/opportunities/apollo";
import { adzunaAdapter } from "@/lib/opportunities/adzuna";
import { problemPostsAdapter } from "@/lib/opportunities/problem-posts";
import { notConfiguredAdapter, type OpportunitySourceAdapter } from "@/lib/opportunities/types";

export { websiteDiscoveryAdapter, apolloAdapter, adzunaAdapter, problemPostsAdapter };

export const fisherLeadsAdapter = notConfiguredAdapter("FisherLeads");

export const SOURCE_ADAPTERS: OpportunitySourceAdapter[] = [
  websiteDiscoveryAdapter,
  problemPostsAdapter,
  adzunaAdapter,
  fisherLeadsAdapter,
  apolloAdapter,
];

export function getAdapter(name: string) {
  return SOURCE_ADAPTERS.find((adapter) => adapter.name === name) ?? notConfiguredAdapter(name);
}

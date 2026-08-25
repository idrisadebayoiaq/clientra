import OpportunityTabs from "@/components/app/opportunity-tabs";
import { AppPageShell } from "@/components/app/page-shell";
import { DiscoverSourceButton } from "@/components/app/discover-source-button";
import {
  discoverApolloCompanies,
  discoverConfiguredSources,
  discoverJobs,
  discoverProblemPosts,
  discoverWebsites,
  ensureUserDiscovery,
} from "@/app/(app)/discover/actions";
import {
  isAdzunaConfigured,
  isApolloConfigured,
  isProblemDiscoveryConfigured,
  isUrlscanConfigured,
} from "@/lib/env";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export default async function DiscoverPage() {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return null;
  await ensureUserDiscovery();

  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("*")
    .order("discovered_at", { ascending: false })
    .limit(50);

  return (
    <AppPageShell
      title="Opportunity Feed"
      description="Live websites, public requests, companies, and jobs from connected providers. Only stored records are shown."
      actions={
        <div className="flex flex-wrap gap-3">
          {isUrlscanConfigured() ? (
            <DiscoverSourceButton action={discoverWebsites} label="Discover websites" pendingLabel="Scanning…" />
          ) : null}
          {isProblemDiscoveryConfigured() ? (
            <DiscoverSourceButton action={discoverProblemPosts} label="Discover problems" pendingLabel="Searching…" />
          ) : null}
          {isApolloConfigured() ? (
            <DiscoverSourceButton action={discoverApolloCompanies} label="Discover companies" pendingLabel="Searching…" />
          ) : null}
          {isAdzunaConfigured() ? (
            <DiscoverSourceButton action={discoverJobs} label="Discover jobs" pendingLabel="Searching…" />
          ) : null}
          <DiscoverSourceButton action={discoverConfiguredSources} label="Discover all" pendingLabel="Importing…" />
        </div>
      }
    >
      <p className="text-sm text-ink-muted">
        {[
          isUrlscanConfigured() ? "urlscan connected" : null,
          "Hacker News connected",
          isApolloConfigured() ? "Apollo connected" : null,
          isAdzunaConfigured() ? "Adzuna connected" : null,
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>
      <OpportunityTabs
        opportunities={opportunities ?? []}
        emptyDescription="No records in this view yet. Use Discover all to import live results from connected providers."
      />
    </AppPageShell>
  );
}

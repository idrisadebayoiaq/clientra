import OpportunityTabs from "@/components/app/opportunity-tabs";
import { AppPageShell } from "@/components/app/page-shell";
import { DiscoverSourceButton } from "@/components/app/discover-source-button";
import {
  discoverApolloCompanies,
  discoverConfiguredSources,
  discoverJobs,
  discoverWebsites,
} from "@/app/(app)/discover/actions";
import { isAdzunaConfigured, isApolloConfigured, isUrlscanConfigured } from "@/lib/env";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export default async function DiscoverPage() {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return null;

  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("*")
    .order("discovered_at", { ascending: false })
    .limit(50);

  return (
    <AppPageShell
      title="Opportunity Feed"
      description="A single place for websites, companies, and jobs from configured providers. Only real stored records are shown."
      actions={
        <div className="flex flex-wrap gap-3">
          {isUrlscanConfigured() ? (
            <DiscoverSourceButton action={discoverWebsites} label="Discover websites" pendingLabel="Scanning…" />
          ) : null}
          {isApolloConfigured() ? (
            <DiscoverSourceButton action={discoverApolloCompanies} label="Discover companies" pendingLabel="Searching…" />
          ) : null}
          {isAdzunaConfigured() ? (
            <DiscoverSourceButton action={discoverJobs} label="Discover jobs" pendingLabel="Searching…" />
          ) : null}
          {isUrlscanConfigured() || isApolloConfigured() || isAdzunaConfigured() ? (
            <DiscoverSourceButton action={discoverConfiguredSources} label="Discover all" pendingLabel="Importing…" />
          ) : null}
        </div>
      }
    >
      <OpportunityTabs
        opportunities={opportunities ?? []}
        emptyDescription="No records in this view yet. Use Discover websites, companies, or jobs to import live results."
      />
    </AppPageShell>
  );
}

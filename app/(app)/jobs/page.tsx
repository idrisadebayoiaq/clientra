import { AppPageShell, SourceNotReady } from "@/components/app/page-shell";
import { DiscoverSourceButton } from "@/components/app/discover-source-button";
import { OpportunityCard } from "@/components/app/opportunity-card";
import { discoverJobs, ensureUserDiscovery } from "@/app/(app)/discover/actions";
import { isAdzunaConfigured } from "@/lib/env";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export default async function JobsPage() {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return null;
  await ensureUserDiscovery();
  const configured = isAdzunaConfigured();
  const { data } = configured
    ? await supabase
        .from("opportunities")
        .select("*")
        .eq("source", "job")
        .order("discovered_at", { ascending: false })
        .limit(50)
    : { data: [] };

  return (
    <AppPageShell
      title="Job Opportunities"
      description="Recent hiring ads from Adzuna that may match the services you sell. Automatic sending is never implied."
      actions={
        configured ? (
          <DiscoverSourceButton action={discoverJobs} label="Discover recent jobs" pendingLabel="Searching…" />
        ) : undefined
      }
    >
      {data?.length ? (
        <div className="space-y-4">
          {data.map((opportunity) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </div>
      ) : configured ? (
        <SourceNotReady
          source="Job discovery"
          ready
          description="Adzuna is connected. Use Discover recent jobs to import listings from the last 24–72 hours based on your services. Clientra will not invent job ads."
        />
      ) : (
        <SourceNotReady
          source="Job discovery"
          description="Adzuna is not configured. This page stays empty rather than showing invented listings."
        />
      )}
    </AppPageShell>
  );
}

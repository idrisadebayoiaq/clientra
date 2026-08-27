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
  const { data } = await supabase
    .from("opportunities")
    .select("*, contacts(email, phone, website, full_name, business_name, notes, verification_status)")
    .eq("source", "job")
    .neq("status", "ignored")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("discovered_at", { ascending: false })
    .limit(50);

  return (
    <AppPageShell
      title="Job Opportunities"
      description="Recent hiring ads from Adzuna that may match the services you sell. Clientra checks for new jobs about every 10 minutes while you use the app."
      actions={
        configured ? (
          <DiscoverSourceButton
            action={discoverJobs}
            label="Discover recent jobs"
            pendingLabel="Searching…"
            successLabel="Checked Adzuna — "
          />
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

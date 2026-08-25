import { AppPageShell, SourceNotReady } from "@/components/app/page-shell";
import { DiscoverSourceButton } from "@/components/app/discover-source-button";
import { OpportunityCard } from "@/components/app/opportunity-card";
import { discoverProblemPosts, ensureUserDiscovery } from "@/app/(app)/discover/actions";
import { isProblemDiscoveryConfigured } from "@/lib/env";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export default async function ProblemsPage() {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return null;
  await ensureUserDiscovery();
  const configured = isProblemDiscoveryConfigured();
  const { data } = await supabase
    .from("opportunities")
    .select("*, contacts(email, phone, website, full_name, business_name, notes, verification_status)")
    .eq("source", "problem_post")
    .order("discovered_at", { ascending: false })
    .limit(50);

  return (
    <AppPageShell
      title="Problem Opportunities"
      description="Recent public posts where people ask for help or discuss problems your services can solve. Only authorized public APIs are used."
      actions={
        <DiscoverSourceButton
          action={discoverProblemPosts}
          label="Discover recent posts"
          pendingLabel="Searching…"
        />
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
          source="Problem discovery"
          ready
          description="Hacker News is connected through its official public API. Use Discover recent posts to import Ask HN and similar requests from the last 24–72 hours. Clientra will not invent posts."
        />
      ) : (
        <SourceNotReady
          source="Problem discovery"
          description="Social networks without an official API stay unavailable. This page will stay empty rather than showing invented posts."
        />
      )}
    </AppPageShell>
  );
}

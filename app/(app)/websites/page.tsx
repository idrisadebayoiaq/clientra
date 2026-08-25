import { AppPageShell, SourceNotReady } from "@/components/app/page-shell";
import { AnalyzeOwnWebsiteForm } from "@/components/app/analyze-own-website-form";
import { DiscoverWebsitesButton } from "@/components/app/discover-websites-button";
import { SaveLeadButton } from "@/components/app/save-lead-button";
import { Badge, ButtonLink, Card } from "@/components/ui/primitives";
import { ScoreRing } from "@/components/ui/score-and-tabs";
import { isUrlscanConfigured } from "@/lib/env";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { ensureUserDiscovery } from "@/app/(app)/discover/actions";
import { formatRelativeTime } from "@/lib/utils";

export default async function WebsitesPage() {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return null;
  await ensureUserDiscovery();
  const { data } = await supabase
    .from("websites")
    .select("*")
    .order("discovered_at", { ascending: false })
    .limit(50);
  const configured = isUrlscanConfigured();

  return (
    <AppPageShell
      title="Website Discovery"
      description="Newly detected websites from configured sources. Filters apply to stored records only."
      actions={configured ? <DiscoverWebsitesButton /> : undefined}
    >
      <AnalyzeOwnWebsiteForm />
      {data?.length ? (
        <div className="grid gap-4">
          {data.map((site) => (
            <Card key={site.id} className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">{site.business_name ?? site.domain}</h2>
                    {site.is_demo ? <Badge tone="gold">DEMO</Badge> : null}
                  </div>
                  <p className="text-sm text-ink-muted">{site.domain}</p>
                  <p className="mt-2 text-sm">Detected: {formatRelativeTime(site.discovered_at)}</p>
                  <p className="mt-1 text-sm">Industry: {site.industry ?? "Unknown"}</p>
                  <p className="mt-1 text-sm">Technology: {site.technology?.join(", ") || "Unable to determine"}</p>
                  <p className="mt-1 text-sm">Contact: {site.has_email ? "Public email flagged" : "No public email stored"}</p>
                </div>
                <ScoreRing score={null} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <ButtonLink href={`/analyze/${site.id}`} size="sm">Analyze Website</ButtonLink>
                <ButtonLink href={site.url} size="sm" variant="outline">View Website</ButtonLink>
                <SaveLeadButton websiteId={site.id} />
              </div>
            </Card>
          ))}
        </div>
      ) : configured ? (
        <SourceNotReady
          source="Website discovery"
          ready
          description="urlscan is connected. Use Discover recent websites to import publicly scanned sites from the last 48 hours. Clientra will not invent domains."
        />
      ) : (
        <SourceNotReady
          source="Website discovery"
          description="Connect a permitted website discovery provider. This page will not invent newly launched sites."
        />
      )}
    </AppPageShell>
  );
}

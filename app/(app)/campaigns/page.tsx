import { AppPageShell } from "@/components/app/page-shell";
import { EmptyState } from "@/components/ui/feedback";
import { ButtonLink, Card } from "@/components/ui/primitives";
import { MetricGrid } from "@/components/app/page-shell";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export default async function CampaignsPage() {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return null;
  const { data } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false });

  return (
    <AppPageShell
      title="Campaigns"
      description="Outreach campaigns with approval modes. Automatic sending stays off unless you activate it."
      actions={<ButtonLink href="/campaigns/new">New campaign</ButtonLink>}
    >
      <MetricGrid
        items={[
          { label: "Campaigns", value: data?.length ?? 0 },
          { label: "Active", value: data?.filter((c) => c.status === "active").length ?? 0 },
        ]}
      />
      {data?.length ? (
        <div className="grid gap-3">
          {data.map((campaign) => (
            <Card key={campaign.id} className="p-4">
              <p className="font-medium">{campaign.name}</p>
              <p className="text-sm text-ink-muted">{campaign.status} · {campaign.approval_mode}</p>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="No campaigns" description="Create a campaign when you are ready to sequence approved outreach." />
      )}
    </AppPageShell>
  );
}

import { AppPageShell } from "@/components/app/page-shell";
import { EmptyState } from "@/components/ui/feedback";
import { Badge, ButtonLink, Card } from "@/components/ui/primitives";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export default async function LeadsPage() {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return null;
  const { data } = await supabase.from("leads").select("*").order("updated_at", { ascending: false });

  return (
    <AppPageShell title="Leads" description="Every CRM lead associated with your account.">
      {data?.length ? (
        <div className="grid gap-3">
          {data.map((lead) => (
            <Card key={lead.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">
                  {lead.company_name ?? "Untitled lead"} {lead.is_demo ? <Badge tone="gold">DEMO</Badge> : null}
                </p>
                <p className="text-sm text-ink-muted">
                  {lead.website_url ?? "No website"} · {lead.status} · score {lead.score ?? "—"}
                </p>
              </div>
              <ButtonLink href={`/leads/${lead.id}`} size="sm">
                Details
              </ButtonLink>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="No leads yet" description="Leads are created from saved or analyzed opportunities." />
      )}
    </AppPageShell>
  );
}

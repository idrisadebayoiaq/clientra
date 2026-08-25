import { AppPageShell } from "@/components/app/page-shell";
import { EmptyState } from "@/components/ui/feedback";
import { Badge, ButtonLink, Card } from "@/components/ui/primitives";
import { PIPELINE_STAGES } from "@/lib/constants";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export default async function CrmPage() {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return null;
  const { data: leads } = await supabase.from("leads").select("*").order("updated_at", { ascending: false });

  return (
    <AppPageShell title="CRM" description="Lightweight pipeline from newly discovered leads through won or lost.">
      <div className="flex gap-3 overflow-x-auto pb-2">
        {PIPELINE_STAGES.map((stage) => {
          const stageLeads = leads?.filter((lead) => lead.status === stage.key) ?? [];
          return (
            <section key={stage.key} className="w-64 shrink-0 rounded-2xl border border-border bg-white p-3">
              <h2 className="text-sm font-semibold">
                {stage.label} <span className="text-ink-subtle">{stageLeads.length}</span>
              </h2>
              <div className="mt-3 space-y-2">
                {stageLeads.length === 0 ? (
                  <p className="text-xs text-ink-subtle">None</p>
                ) : (
                  stageLeads.map((lead) => (
                    <Card key={lead.id} className="p-3">
                      <p className="text-sm font-medium">{lead.company_name ?? "Untitled lead"}</p>
                      {lead.is_demo ? <Badge tone="gold">DEMO</Badge> : null}
                      <p className="text-xs text-ink-muted">{lead.website_url ?? "No website"}</p>
                      <ButtonLink href={`/leads/${lead.id}`} size="sm" variant="ghost" className="mt-2 px-0">
                        Open
                      </ButtonLink>
                    </Card>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
      {!leads?.length ? (
        <EmptyState
          title="CRM is empty"
          description="Save or analyze an opportunity to create a lead. Pipeline columns stay ready in the meantime."
        />
      ) : null}
    </AppPageShell>
  );
}

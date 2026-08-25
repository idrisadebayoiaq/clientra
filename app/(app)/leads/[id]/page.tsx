import { notFound } from "next/navigation";
import { AppPageShell } from "@/components/app/page-shell";
import { Badge, Card } from "@/components/ui/primitives";
import { ScoreRing } from "@/components/ui/score-and-tabs";
import { EmptyState } from "@/components/ui/feedback";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export default async function LeadDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return null;

  const { data: lead } = await supabase.from("leads").select("*").eq("id", id).maybeSingle();
  if (!lead) notFound();

  const [{ data: notes }, { data: events }, { data: messages }, { data: painPoints }, { data: tasks }] =
    await Promise.all([
      supabase.from("lead_notes").select("*").eq("lead_id", id).order("created_at", { ascending: false }),
      supabase.from("lead_events").select("*").eq("lead_id", id).order("created_at", { ascending: false }),
      supabase.from("outreach_messages").select("*").eq("lead_id", id).order("created_at", { ascending: false }),
      supabase.from("pain_points").select("*").eq("lead_id", id),
      supabase.from("tasks").select("*").eq("lead_id", id),
    ]);

  return (
    <AppPageShell title={lead.company_name ?? "Lead"} description={lead.website_url ?? "No website stored"}>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ink-muted">Status</p>
              <p className="capitalize">{lead.status}</p>
            </div>
            <ScoreRing score={lead.score} />
          </div>
          {lead.is_demo ? <Badge tone="gold">DEMO</Badge> : null}
          <h2 className="mt-6 font-semibold">Pain points</h2>
          {painPoints?.length ? (
            <ul className="mt-2 space-y-2 text-sm">
              {painPoints.map((item) => (
                <li key={item.id}>
                  <strong>{item.severity}:</strong> {item.title} ({item.confidence})
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-ink-muted">No analysis stored yet.</p>
          )}
          <h2 className="mt-6 font-semibold">Outreach history</h2>
          {messages?.length ? (
            <ul className="mt-2 space-y-2 text-sm">
              {messages.map((item) => (
                <li key={item.id}>
                  {item.channel} · {item.status} · {item.subject ?? "No subject"}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No outreach yet" description="Generate a message from the outreach composer." />
          )}
        </Card>
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="font-semibold">Notes</h2>
            {notes?.length ? notes.map((note) => <p key={note.id} className="mt-2 text-sm">{note.body}</p>) : <p className="mt-2 text-sm text-ink-muted">None</p>}
          </Card>
          <Card className="p-5">
            <h2 className="font-semibold">Tasks</h2>
            {tasks?.length ? tasks.map((task) => <p key={task.id} className="mt-2 text-sm">{task.title}</p>) : <p className="mt-2 text-sm text-ink-muted">None</p>}
          </Card>
          <Card className="p-5">
            <h2 className="font-semibold">Events</h2>
            {events?.length ? events.map((event) => <p key={event.id} className="mt-2 text-sm">{event.event_type}</p>) : <p className="mt-2 text-sm text-ink-muted">None</p>}
          </Card>
        </div>
      </div>
    </AppPageShell>
  );
}

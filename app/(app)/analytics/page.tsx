import { AppPageShell, MetricGrid } from "@/components/app/page-shell";
import { Card } from "@/components/ui/primitives";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export default async function AnalyticsPage() {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return null;

  const [discovered, analyzed, qualified, sent, replies, meetings, proposals, won] = await Promise.all([
    supabase.from("opportunities").select("id", { count: "exact", head: true }),
    supabase.from("website_analyses").select("id", { count: "exact", head: true }),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "qualified"),
    supabase.from("outreach_messages").select("id", { count: "exact", head: true }).eq("status", "sent"),
    supabase.from("conversation_messages").select("id", { count: "exact", head: true }).eq("direction", "inbound"),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "meeting"),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "proposal"),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "won"),
  ]);

  const sentCount = sent.count ?? 0;
  const replyCount = replies.count ?? 0;
  const wonCount = won.count ?? 0;

  return (
    <AppPageShell title="Analytics" description="Workspace metrics from stored activity. Empty values mean no activity yet, not invented results.">
      <MetricGrid
        items={[
          { label: "Opportunities discovered", value: discovered.count ?? 0 },
          { label: "Opportunities analyzed", value: analyzed.count ?? 0 },
          { label: "Qualified leads", value: qualified.count ?? 0 },
          { label: "Emails sent", value: sentCount },
          { label: "Replies", value: replyCount },
          { label: "Meetings", value: meetings.count ?? 0 },
          { label: "Proposals", value: proposals.count ?? 0 },
          { label: "Won clients", value: wonCount },
          { label: "Conversion rate", value: sentCount ? `${Math.round((wonCount / sentCount) * 100)}%` : "—" },
          { label: "Response rate", value: sentCount ? `${Math.round((replyCount / sentCount) * 100)}%` : "—" },
        ]}
      />
      <Card className="p-5 text-sm text-ink-muted">
        Charts will plot these same stored metrics. Estimated pipeline value and revenue appear after leads have values.
      </Card>
    </AppPageShell>
  );
}

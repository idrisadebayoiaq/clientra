import Link from "next/link";
import { Card } from "@/components/ui/primitives";
import { EmptyState, PageHeader } from "@/components/ui/feedback";
import { PIPELINE_STAGES } from "@/lib/constants";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { formatRelativeTime } from "@/lib/utils";

export default async function DashboardPage() {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return null;

  const [
    opportunities,
    highScore,
    analyses,
    outreach,
    replies,
    interested,
    meetings,
    won,
    recent,
    unreadReplies,
  ] = await Promise.all([
    supabase.from("opportunities").select("id", { count: "exact", head: true }),
    supabase.from("opportunities").select("id", { count: "exact", head: true }).gte("opportunity_score", 80),
    supabase.from("website_analyses").select("id", { count: "exact", head: true }),
    supabase.from("outreach_messages").select("id", { count: "exact", head: true }).eq("status", "sent"),
    supabase.from("conversation_messages").select("id", { count: "exact", head: true }).eq("direction", "inbound"),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "interested"),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "meeting"),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "won"),
    supabase
      .from("opportunities")
      .select("id, company_name, domain, source, opportunity_score, estimated_need, contact_available, discovered_at, status, is_demo")
      .order("discovered_at", { ascending: false })
      .limit(8),
    supabase.from("conversations").select("id", { count: "exact", head: true }).eq("unread", true),
  ]);

  const cards = [
    ["New Opportunities", opportunities.count ?? 0],
    ["High-Score Leads", highScore.count ?? 0],
    ["Websites Analyzed", analyses.count ?? 0],
    ["Outreach Sent", outreach.count ?? 0],
    ["Replies", replies.count ?? 0],
    ["Interested Prospects", interested.count ?? 0],
    ["Meetings", meetings.count ?? 0],
    ["Converted Clients", won.count ?? 0],
  ] as const;

  const pipeline = await Promise.all(
    PIPELINE_STAGES.map(async (stage) => {
      const { count } = await supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", stage.key);
      return { ...stage, count: count ?? 0 };
    }),
  );

  const recommendations = [
    opportunities.count
      ? `${opportunities.count} opportunities are in your feed.`
      : "No live opportunities yet. Use Discover to import from urlscan, Apollo, or Adzuna.",
    unreadReplies.count
      ? `${unreadReplies.count} conversations may need a response.`
      : "No unread prospect replies.",
    highScore.count
      ? `${highScore.count} high-score opportunities are waiting.`
      : "High-score leads will appear after analysis.",
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Your client acquisition overview. Counts come from your own workspace data."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <Card key={label} className="p-4">
            <p className="text-sm text-ink-muted">{label}</p>
            <p className="mt-2 text-3xl font-semibold">{value}</p>
          </Card>
        ))}
      </div>

      <section>
        <h2 className="text-lg font-semibold">Opportunity pipeline</h2>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
          {pipeline.map((stage, index) => (
            <div key={stage.key} className="min-w-28 rounded-xl border border-border bg-white p-3">
              <p className="text-xs text-ink-muted">
                {index > 0 ? "→ " : ""}
                {stage.label}
              </p>
              <p className="mt-1 text-xl font-semibold">{stage.count}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">AI recommendations</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {recommendations.map((item) => (
            <Card key={item} className="p-4 text-sm text-ink-muted">
              {item}
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent opportunities</h2>
          <Link href="/discover" className="text-sm font-medium text-accent">
            Open feed
          </Link>
        </div>
        {recent.data?.length ? (
          <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-white">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border text-ink-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Website</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Score</th>
                  <th className="px-4 py-3 font-medium">Need</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Discovered</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.data.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      {row.company_name ?? "Unknown"}
                      {row.is_demo ? <span className="ml-2 text-[10px] font-semibold text-gold">DEMO</span> : null}
                    </td>
                    <td className="px-4 py-3">{row.domain ?? "—"}</td>
                    <td className="px-4 py-3">{row.source}</td>
                    <td className="px-4 py-3">{row.opportunity_score ?? "—"}</td>
                    <td className="px-4 py-3">{row.estimated_need ?? "—"}</td>
                    <td className="px-4 py-3">{row.contact_available ? "Available" : "Unknown"}</td>
                    <td className="px-4 py-3">{formatRelativeTime(row.discovered_at)}</td>
                    <td className="px-4 py-3 capitalize">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            className="mt-3"
            title="No opportunities yet"
            description="Use Discover to import websites, companies, and jobs. The feed, CRM, and analysis workspace only show stored records."
          />
        )}
      </section>
    </div>
  );
}

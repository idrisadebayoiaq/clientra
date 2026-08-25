import { AppPageShell } from "@/components/app/page-shell";
import { EmptyState } from "@/components/ui/feedback";
import { Badge, ButtonLink, Card } from "@/components/ui/primitives";
import { getAuthenticatedUser } from "@/lib/supabase/server";

const SECTIONS = ["all", "unread", "interested", "needs_reply", "follow_up", "archived"] as const;

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const current = SECTIONS.includes((tab ?? "all") as (typeof SECTIONS)[number]) ? tab ?? "all" : "all";
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return null;

  let query = supabase.from("conversations").select("*").order("last_message_at", { ascending: false });
  if (current === "unread") query = query.eq("unread", true);
  if (current === "archived") query = query.eq("archived", true);
  if (current === "interested") query = query.in("ai_classification", ["interested", "very_interested"]);
  if (current === "needs_reply") query = query.eq("unread", true).eq("archived", false);
  const { data } = await query;

  return (
    <AppPageShell title="Inbox" description="Conversations from authorized email accounts, classified when AI is configured.">
      <div className="flex flex-wrap gap-2">
        {SECTIONS.map((section) => (
          <ButtonLink key={section} href={`/inbox?tab=${section}`} size="sm" variant={current === section ? "secondary" : "outline"}>
            {section.replace("_", " ")}
          </ButtonLink>
        ))}
      </div>
      {data?.length ? (
        <div className="space-y-3">
          {data.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{item.subject ?? "Conversation"}</p>
                {item.ai_classification ? <Badge>{item.ai_classification}</Badge> : null}
              </div>
              <p className="mt-1 text-sm text-ink-muted">{item.channel} · {item.unread ? "Unread" : "Read"}</p>
              {item.recommended_reply ? <p className="mt-2 text-sm">{item.recommended_reply}</p> : null}
              <div className="mt-3 flex gap-2">
                <ButtonLink href={`/inbox/${item.id}`} size="sm">Reply</ButtonLink>
                <ButtonLink href={`/inbox/${item.id}?ai=1`} size="sm" variant="outline">Generate AI Reply</ButtonLink>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="Inbox is empty" description="Connect Gmail in Integrations to send and receive authorized messages." />
      )}
    </AppPageShell>
  );
}

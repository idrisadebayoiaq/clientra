import { AppPageShell } from "@/components/app/page-shell";
import { EmptyState } from "@/components/ui/feedback";
import { Card } from "@/components/ui/primitives";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { formatRelativeTime } from "@/lib/utils";

export default async function FollowUpsPage() {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return null;
  const { data } = await supabase.from("follow_ups").select("*").order("scheduled_at");

  return (
    <AppPageShell
      title="Follow-ups"
      description="Default cadence is 3, 7, and 14 days. Follow-ups stop after a reply, not-interested, conversion, or pause. Automatic send requires explicit activation."
    >
      {data?.length ? (
        <div className="space-y-3">
          {data.map((item) => (
            <Card key={item.id} className="p-4 text-sm">
              Step {item.step} · {item.status} · {formatRelativeTime(item.scheduled_at)}
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="No follow-ups scheduled" description="Create a sequence from a campaign or lead. Automatic delivery stays off until you enable it." />
      )}
    </AppPageShell>
  );
}

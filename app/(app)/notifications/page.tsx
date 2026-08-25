import { AppPageShell } from "@/components/app/page-shell";
import { EmptyState } from "@/components/ui/feedback";
import { Card } from "@/components/ui/primitives";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { formatRelativeTime } from "@/lib/utils";

export default async function NotificationsPage() {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return null;
  const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50);

  return (
    <AppPageShell title="Notifications" description="In-app alerts for replies, opportunities, and integration health. Email and browser notifications can be added later.">
      {data?.length ? (
        <div className="space-y-3">
          {data.map((item) => (
            <Card key={item.id} className="p-4">
              <p className="font-medium">{item.title}</p>
              <p className="text-sm text-ink-muted">{item.body}</p>
              <p className="mt-1 text-xs text-ink-subtle">{formatRelativeTime(item.created_at)}</p>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="No notifications" description="You will see alerts here when prospects reply or new high-value opportunities are stored." />
      )}
    </AppPageShell>
  );
}

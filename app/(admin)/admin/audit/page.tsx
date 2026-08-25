import { PageHeader } from "@/components/ui/feedback";
import { Card } from "@/components/ui/primitives";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatRelativeTime } from "@/lib/utils";

export default async function AdminAuditPage() {
  const admin = createAdminClient();
  const { data } = await admin.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(100);
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title="Audit logs" description="Security-relevant actions across the platform." />
      <div className="space-y-2">
        {data?.map((item) => (
          <Card key={item.id} className="p-4 text-sm">
            {item.action} · {item.entity_type ?? "n/a"} · {formatRelativeTime(item.created_at)}
          </Card>
        ))}
      </div>
    </div>
  );
}

import Link from "next/link";
import { PageHeader } from "@/components/ui/feedback";
import { Card } from "@/components/ui/primitives";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminHomePage() {
  const admin = createAdminClient();
  const [{ count: users }, { data: health }] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("system_health").select("*").order("provider"),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title="Admin" description="Restricted to users with the admin role." />
      <div className="flex flex-wrap gap-3 text-sm">
        <Link className="text-accent" href="/admin/users">Users</Link>
        <Link className="text-accent" href="/admin/health">API health</Link>
        <Link className="text-accent" href="/admin/audit">Audit logs</Link>
      </div>
      <Card className="p-5">
        <p className="text-sm text-ink-muted">Users</p>
        <p className="text-3xl font-semibold">{users ?? 0}</p>
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        {health?.map((item) => (
          <Card key={item.provider} className="p-4">
            <p className="font-medium capitalize">{item.provider.replace("_", " ")}</p>
            <p className="text-sm text-ink-muted">{item.status}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

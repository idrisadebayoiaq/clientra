import { PageHeader } from "@/components/ui/feedback";
import { Card } from "@/components/ui/primitives";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminUsersPage() {
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("id, email, full_name, role, created_at").order("created_at", { ascending: false }).limit(100);
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title="Users" description="All workspace profiles." />
      <div className="space-y-2">
        {data?.map((user) => (
          <Card key={user.id} className="p-4 text-sm">
            {user.full_name ?? "Unnamed"} · {user.email} · {user.role}
          </Card>
        ))}
      </div>
    </div>
  );
}

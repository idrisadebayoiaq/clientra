import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function POST() {
  const { user } = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createAdminClient();
  const { data: accounts } = await admin.from("email_accounts").select("id").eq("user_id", user.id);
  const ids = accounts?.map((item) => item.id) ?? [];
  if (ids.length) {
    await admin.from("email_account_tokens").delete().in("email_account_id", ids);
    await admin.from("email_accounts").delete().eq("user_id", user.id);
  }
  await admin.from("integrations").update({ status: "not_connected", connected_at: null }).eq("user_id", user.id).eq("provider", "gmail");
  await writeAuditLog({ userId: user.id, action: "gmail_disconnected", entityType: "integration" });
  return NextResponse.json({ ok: true });
}

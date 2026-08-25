import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit";
import { sendGmailMessage } from "@/lib/gmail/send";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function POST() {
  const { user } = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sent = await sendGmailMessage(
    user.id,
    "",
    "Clientra test email",
    "This is a Clientra Gmail connection test.",
  );
  if (!sent.ok) {
    return NextResponse.json({ error: sent.error }, { status: 400 });
  }

  await writeAuditLog({
    userId: user.id,
    action: "email_sent",
    entityType: "email_account",
    entityId: sent.emailAccountId,
    metadata: { type: "test" },
  });
  return NextResponse.json({ ok: true });
}

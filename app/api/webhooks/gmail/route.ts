import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit";
import { getServerEnv } from "@/lib/env";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(request: Request) {
  const env = getServerEnv();
  if (!env.googlePubsubTopic || !env.googlePubsubSubscription) {
    return NextResponse.json({ error: "Pub/Sub is not configured" }, { status: 503 });
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return unauthorized();

  const valid = await verifyGoogleOidc(token);
  if (!valid) return unauthorized();

  const body = (await request.json().catch(() => null)) as { message?: { data?: string; attributes?: Record<string, string> } } | null;
  if (!body?.message?.data) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const decoded = JSON.parse(Buffer.from(body.message.data, "base64").toString("utf8")) as {
    emailAddress?: string;
    historyId?: string;
  };

  const admin = createAdminClient();
  const { data: account } = await admin
    .from("email_accounts")
    .select("id, user_id, email_address")
    .eq("email_address", decoded.emailAddress ?? "")
    .maybeSingle();

  if (!account) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  await admin
    .from("email_accounts")
    .update({ history_id: decoded.historyId ?? null, last_sync_at: new Date().toISOString() })
    .eq("id", account.id);

  await admin.from("notifications").insert({
    user_id: account.user_id,
    type: "reply",
    title: "Gmail activity detected",
    body: "Clientra received a Gmail push notification for your connected account.",
    href: "/inbox",
  });

  await writeAuditLog({
    userId: account.user_id,
    action: "gmail_pubsub_received",
    entityType: "email_account",
    entityId: account.id,
    metadata: { historyId: decoded.historyId ?? null },
  });

  return NextResponse.json({ ok: true });
}

async function verifyGoogleOidc(token: string) {
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`);
  if (!response.ok) return false;
  const payload = (await response.json()) as { email?: string; aud?: string; iss?: string };
  const issuerOk = payload.iss === "accounts.google.com" || payload.iss === "https://accounts.google.com";
  return issuerOk && Boolean(payload.email);
}

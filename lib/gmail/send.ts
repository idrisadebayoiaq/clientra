import { refreshGmailToken } from "@/lib/gmail/oauth";
import { createAdminClient } from "@/lib/supabase/admin";

export type GmailSendResult =
  | {
      ok: true;
      emailAccountId: string;
      from: string;
      externalMessageId: string | null;
      threadId: string | null;
    }
  | { ok: false; error: string };

export async function sendGmailMessage(
  userId: string,
  to: string,
  subject: string,
  body: string,
): Promise<GmailSendResult> {
  const admin = createAdminClient();
  const { data: account } = await admin
    .from("email_accounts")
    .select("id, email_address, status")
    .eq("user_id", userId)
    .eq("provider", "gmail")
    .maybeSingle();
  if (!account || account.status !== "connected") {
    return { ok: false, error: "Gmail is not connected" };
  }

  const { data: tokens } = await admin
    .from("email_account_tokens")
    .select("*")
    .eq("email_account_id", account.id)
    .maybeSingle();
  if (!tokens?.refresh_token_encrypted && !tokens?.access_token_encrypted) {
    return { ok: false, error: "Gmail tokens are unavailable" };
  }

  let accessToken = tokens.access_token_encrypted ?? "";
  if (tokens.token_expiry && new Date(tokens.token_expiry) < new Date() && tokens.refresh_token_encrypted) {
    const refreshed = await refreshGmailToken(tokens.refresh_token_encrypted);
    accessToken = refreshed.access_token;
    await admin
      .from("email_account_tokens")
      .update({
        access_token_encrypted: refreshed.access_token,
        token_expiry: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
      })
      .eq("email_account_id", account.id);
  }

  const recipient = to.trim() || account.email_address;
  const raw = [
    `To: ${recipient}`,
    `From: ${account.email_address}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    body,
  ].join("\r\n");

  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: Buffer.from(raw).toString("base64url") }),
  });
  if (!response.ok) {
    return { ok: false, error: "Send failed" };
  }
  const json = (await response.json()) as { id?: string; threadId?: string };
  return {
    ok: true,
    emailAccountId: account.id,
    from: account.email_address,
    externalMessageId: json.id ?? null,
    threadId: json.threadId ?? null,
  };
}

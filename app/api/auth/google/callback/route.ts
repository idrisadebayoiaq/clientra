import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit";
import { exchangeGmailCode, gmailOAuthConfigured, resolveGmailRedirectUri } from "@/lib/gmail/oauth";
import { startGmailWatch } from "@/lib/gmail/watch";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const done = (path: string) => NextResponse.redirect(new URL(path, origin));

  if (!gmailOAuthConfigured()) {
    return done("/integrations?error=not_configured");
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) {
    return done("/integrations?error=missing_state");
  }

  const admin = createAdminClient();
  const { data: saved } = await admin
    .from("oauth_states")
    .select("*")
    .eq("state", state)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!saved) {
    return done("/integrations?error=invalid_state");
  }

  await admin.from("oauth_states").delete().eq("id", saved.id);
  const redirectUri = resolveGmailRedirectUri(request);

  try {
    const tokens = await exchangeGmailCode(code, redirectUri);
    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = (await profileResponse.json()) as { email?: string };
    if (!profile.email) {
      return done("/integrations?error=no_email");
    }

    const { data: account, error } = await admin
      .from("email_accounts")
      .upsert(
        {
          user_id: saved.user_id,
          provider: "gmail",
          email_address: profile.email,
          status: "connected",
          scopes: (tokens.scope ?? "").split(" ").filter(Boolean),
        },
        { onConflict: "user_id,email_address" },
      )
      .select("id")
      .single();
    if (error || !account) throw error;

    const refreshToken = tokens.refresh_token ?? null;
    await admin.from("email_account_tokens").upsert({
      email_account_id: account.id,
      access_token_encrypted: tokens.access_token,
      ...(refreshToken ? { refresh_token_encrypted: refreshToken } : {}),
      token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    });

    const watch = await startGmailWatch(tokens.access_token);
    if (watch.configured && watch.ok) {
      await admin
        .from("email_accounts")
        .update({
          history_id: watch.historyId ?? null,
          watch_expiration: watch.expiration,
        })
        .eq("id", account.id);
    }

    await admin.from("integrations").upsert(
      {
        user_id: saved.user_id,
        provider: "gmail",
        status: "connected",
        connected_at: new Date().toISOString(),
      },
      { onConflict: "user_id,provider" },
    );

    await writeAuditLog({
      userId: saved.user_id,
      action: "gmail_connected",
      entityType: "email_account",
      entityId: account.id,
    });
  } catch {
    return done("/integrations?error=oauth_failed");
  }

  return done("/integrations?gmail=connected");
}

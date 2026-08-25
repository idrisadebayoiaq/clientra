import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit";
import { buildGmailAuthUrl, gmailOAuthConfigured, resolveGmailRedirectUri } from "@/lib/gmail/oauth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function GET(request: Request) {
  if (!gmailOAuthConfigured()) {
    return NextResponse.json({ error: "Gmail OAuth is not configured" }, { status: 503 });
  }
  const { user } = await getAuthenticatedUser();
  const origin = new URL(request.url).origin;
  if (!user) {
    return NextResponse.redirect(new URL("/login?next=/integrations", origin));
  }

  const redirectUri = resolveGmailRedirectUri(request);
  const state = randomBytes(24).toString("hex");
  const admin = createAdminClient();
  await admin.from("oauth_states").insert({
    user_id: user.id,
    provider: "gmail",
    state,
    redirect_to: `${origin}/integrations`,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  });
  await writeAuditLog({ userId: user.id, action: "gmail_oauth_started", entityType: "integration" });
  return NextResponse.redirect(buildGmailAuthUrl(state, redirectUri));
}

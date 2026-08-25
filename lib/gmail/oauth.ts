import { GMAIL_REDIRECT_URI, PRODUCTION_APP_URL, getServerEnv, isGmailOAuthConfigured } from "@/lib/env";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
  "openid",
  "email",
  "profile",
].join(" ");

export function gmailOAuthConfigured() {
  return isGmailOAuthConfigured();
}

export function resolveGmailRedirectUri(_request?: Request) {
  return GMAIL_REDIRECT_URI;
}

export function gmailAppOrigin() {
  return PRODUCTION_APP_URL;
}

export function buildGmailAuthUrl(state: string, redirectUri: string) {
  const env = getServerEnv();
  const params = new URLSearchParams({
    client_id: env.googleClientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGmailCode(code: string, redirectUri: string) {
  const env = getServerEnv();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.googleClientId,
      client_secret: env.googleClientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!response.ok) {
    throw new Error("Gmail token exchange failed");
  }
  return (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope?: string;
  };
}

export async function refreshGmailToken(refreshToken: string) {
  const env = getServerEnv();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: env.googleClientId,
      client_secret: env.googleClientSecret,
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) {
    throw new Error("Gmail token refresh failed");
  }
  return (await response.json()) as { access_token: string; expires_in: number };
}

function normalize(value: string | undefined) {
  if (!value) return "";
  return value.replace(/^\uFEFF/, "").trim().replace(/^["']|["']$/g, "");
}

function required(name: string, value: string | undefined): string {
  const normalized = normalize(value);
  if (!normalized) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return normalized;
}

export const PRODUCTION_APP_URL = "https://clientra-xi-rouge.vercel.app";
export const GMAIL_REDIRECT_URI = `${PRODUCTION_APP_URL}/api/auth/google/callback`;

function defaultAppUrl() {
  const explicit = normalize(process.env.NEXT_PUBLIC_APP_URL);
  if (explicit) return explicit.replace(/\/$/, "");
  const vercelProduction = normalize(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  if (vercelProduction) {
    return vercelProduction.startsWith("http")
      ? vercelProduction.replace(/\/$/, "")
      : `https://${vercelProduction}`;
  }
  const vercelUrl = normalize(process.env.VERCEL_URL);
  if (vercelUrl) return `https://${vercelUrl.replace(/\/$/, "")}`;
  return "http://localhost:3000";
}

export const publicEnv = {
  supabaseUrl: normalize(process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: normalize(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  appUrl: defaultAppUrl(),
};

export function getServerEnv() {
  return {
    supabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnonKey: required(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
    supabaseServiceRoleKey: required(
      "SUPABASE_SERVICE_ROLE_KEY",
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    ),
    openRouterApiKey: normalize(process.env.OPENROUTER_API_KEY),
    aiModel: normalize(process.env.AI_MODEL) || "anthropic/claude-sonnet-5",
    aiFastModel: normalize(process.env.AI_FAST_MODEL) || "google/gemini-3.7-flash",
    aiReasoningModel: normalize(process.env.AI_REASONING_MODEL) || "anthropic/claude-opus-5",
    googleClientId: normalize(process.env.GOOGLE_CLIENT_ID),
    googleClientSecret: normalize(process.env.GOOGLE_CLIENT_SECRET),
    googleProjectId:
      normalize(process.env.GOOGLE_CLOUD_PROJECT_ID) || normalize(process.env.GOOGLE_PROJECT_ID),
    googleProjectNumber:
      normalize(process.env.GOOGLE_CLOUD_PROJECT_NUMBER) ||
      normalize(process.env.GOOGLE_PROJECT_NUMBER),
    googleRedirectUri: GMAIL_REDIRECT_URI,
    googleRedirectUriProduction: GMAIL_REDIRECT_URI,
    googlePubsubTopic: normalize(process.env.GOOGLE_PUBSUB_TOPIC),
    googlePubsubSubscription: normalize(process.env.GOOGLE_PUBSUB_SUBSCRIPTION),
    urlscanApiKey: normalize(process.env.URLSCAN_API_KEY),
    apolloApiKey: normalize(process.env.APOLLO_API_KEY),
    adzunaAppId: normalize(process.env.ADZUNA_APP_ID),
    adzunaAppKey: normalize(process.env.ADZUNA_APP_KEY),
    appUrl: publicEnv.appUrl,
  };
}

export function isOpenRouterConfigured(): boolean {
  return Boolean(normalize(process.env.OPENROUTER_API_KEY));
}

export function isGmailOAuthConfigured(): boolean {
  return Boolean(normalize(process.env.GOOGLE_CLIENT_ID) && normalize(process.env.GOOGLE_CLIENT_SECRET));
}

export function isUrlscanConfigured(): boolean {
  return Boolean(normalize(process.env.URLSCAN_API_KEY));
}

export function isApolloConfigured(): boolean {
  return Boolean(normalize(process.env.APOLLO_API_KEY));
}

export function isAdzunaConfigured(): boolean {
  return Boolean(normalize(process.env.ADZUNA_APP_ID) && normalize(process.env.ADZUNA_APP_KEY));
}

export function isProblemDiscoveryConfigured(): boolean {
  return true;
}

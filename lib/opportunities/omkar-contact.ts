import { getServerEnv, isOmkarConfigured } from "@/lib/env";
import type { ExtractedContact } from "@/lib/opportunities/public-contact";

type OmkarItem = {
  value?: string;
  is_likely_official?: boolean;
};

type OmkarResponse = {
  domain?: string;
  title?: string;
  emails?: OmkarItem[];
  phones?: OmkarItem[];
  phones_uncertain?: OmkarItem[];
  linkedins?: OmkarItem[];
  facebooks?: OmkarItem[];
  twitters?: OmkarItem[];
  error?: string | null;
};

function pickOfficial(items?: OmkarItem[]) {
  if (!items?.length) return null;
  const official = items.find((item) => item.is_likely_official && item.value)?.value;
  return official ?? items.find((item) => item.value)?.value ?? null;
}

function asContact(json: OmkarResponse, website: string): ExtractedContact | null {
  const email = pickOfficial(json.emails);
  const phone = pickOfficial(json.phones) ?? pickOfficial(json.phones_uncertain);
  const linkedinUrl = pickOfficial(json.linkedins);
  const facebookUrl = pickOfficial(json.facebooks);
  const twitterUrl = pickOfficial(json.twitters);
  if (!email && !phone && !linkedinUrl) return null;
  return {
    email,
    phone,
    website: website.startsWith("http") ? website : `https://${website}`,
    linkedinUrl,
    facebookUrl,
    twitterUrl,
    fullName: null,
    businessName: json.title ?? null,
  };
}

/**
 * Optional deeper crawl via Omkar hosted API or a self-hosted Omkar-compatible endpoint.
 * Set OMKAR_API_KEY (and optionally OMKAR_CONTACT_API_URL) on Vercel.
 * Docs: https://github.com/omkarcloud/website-email-contact-scraper
 */
export async function discoverOmkarWebsiteContact(website: string): Promise<ExtractedContact | null> {
  if (!isOmkarConfigured() || !website) return null;
  const env = getServerEnv();
  const base = (env.omkarContactApiUrl || "https://website-email-contact-scraper.omkar.cloud").replace(/\/$/, "");
  const target = new URL(`${base}/contacts`);
  target.searchParams.set("website", website.replace(/^https?:\/\//, "").replace(/\/$/, ""));
  target.searchParams.set("mode", "key_pages");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 28000);
  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "User-Agent": "clientra/0.1",
    };
    if (env.omkarApiKey) {
      headers["X-API-Key"] = env.omkarApiKey;
      headers["api-key"] = env.omkarApiKey;
      headers.Authorization = `Bearer ${env.omkarApiKey}`;
    }
    if (env.rapidApiKey) {
      headers["X-RapidAPI-Key"] = env.rapidApiKey;
      headers["X-RapidAPI-Host"] = env.rapidApiHost || new URL(base).host;
    }

    const response = await fetch(target.toString(), { signal: controller.signal, headers });
    if (!response.ok) return null;
    const json = (await response.json()) as OmkarResponse;
    if (json.error) return null;
    return asContact(json, website);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

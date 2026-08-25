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
  message?: string;
};

const DEFAULT_OMKAR_BASE = "https://website-email-contact-scraper.omkar.cloud";
const CONTACTS_PATH = "/website-email-contact/v1/contacts";

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

function contactsUrl(base: string, website: string, mode: "homepage" | "key_pages") {
  const root = base.replace(/\/$/, "");
  const target = new URL(root.includes("/website-email-contact/") ? root : `${root}${CONTACTS_PATH}`);
  target.searchParams.set("website", website.replace(/^https?:\/\//, "").replace(/\/$/, ""));
  target.searchParams.set("mode", mode);
  return target;
}

/**
 * Omkar hosted contact scraper.
 * Auth: header `API-Key`
 * Endpoint: GET /website-email-contact/v1/contacts?website=&mode=
 * Docs: https://www.omkar.cloud/tools/website-email-contact-scraper
 */
export async function discoverOmkarWebsiteContact(website: string): Promise<ExtractedContact | null> {
  if (!isOmkarConfigured() || !website) return null;
  const env = getServerEnv();
  const base = env.omkarContactApiUrl || DEFAULT_OMKAR_BASE;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 35000);

  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "User-Agent": "clientra/0.1",
    };
    if (env.omkarApiKey) {
      headers["API-Key"] = env.omkarApiKey;
    }
    if (env.rapidApiKey) {
      headers["X-RapidAPI-Key"] = env.rapidApiKey;
      headers["X-RapidAPI-Host"] = env.rapidApiHost || new URL(base.startsWith("http") ? base : `https://${base}`).host;
    }

    // Prefer key_pages for better contact hits; fall back to homepage if that times out or fails.
    for (const mode of ["key_pages", "homepage"] as const) {
      const response = await fetch(contactsUrl(base, website, mode).toString(), {
        signal: controller.signal,
        headers,
      });
      if (!response.ok) {
        if (mode === "homepage") return null;
        continue;
      }
      const json = (await response.json()) as OmkarResponse;
      if (json.error || json.message?.toLowerCase().includes("authentication")) {
        if (mode === "homepage") return null;
        continue;
      }
      const contact = asContact(json, website);
      if (contact) return contact;
      if (mode === "homepage") return null;
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

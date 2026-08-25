import { getServerEnv, isApolloConfigured } from "@/lib/env";
import { extractDomain } from "@/lib/utils";

export type ExtractedContact = {
  email: string | null;
  phone: string | null;
  website: string | null;
  linkedinUrl: string | null;
  facebookUrl: string | null;
  twitterUrl: string | null;
  fullName: string | null;
  businessName: string | null;
};

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const MAILTO_RE = /mailto:([^"'?\s>]+)/gi;
const TEL_RE = /tel:(\+?[\d().\s-]{7,20})/gi;
const IGNORE_EMAIL_HOSTS = new Set([
  "sentry.io",
  "wixpress.com",
  "example.com",
  "cloudflare.com",
  "schema.org",
  "w3.org",
  "github.com",
  "githubusercontent.com",
  "google.com",
  "gstatic.com",
]);

function asRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
}

function asString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value && typeof value === "object" && "number" in value) {
    const nested = (value as { number?: unknown }).number;
    if (typeof nested === "string" && nested.trim()) return nested.trim();
  }
  return null;
}

function decodeHtml(value: string) {
  return value.replace(/&amp;/g, "&").replace(/&#64;/g, "@").replace(/%40/gi, "@");
}

function isPlausibleEmail(email: string, siteDomain?: string | null) {
  const normalized = email.toLowerCase().replace(/^mailto:/, "").split("?")[0];
  const [local, host] = normalized.split("@");
  if (!local || !host || local.length > 64 || host.length > 255) return false;
  if (/\.(png|jpe?g|gif|webp|svg|css|js)$/i.test(local) || /\.(png|jpe?g|gif|webp|svg)$/i.test(host)) {
    return false;
  }
  if (/^(noreply|no-reply|donotreply|mailer-daemon)$/i.test(local)) return false;
  if (IGNORE_EMAIL_HOSTS.has(host)) return false;
  if (siteDomain) {
    const domain = siteDomain.replace(/^www\./, "").toLowerCase();
    if (host === domain || host.endsWith(`.${domain}`)) return true;
  }
  return /^(info|hello|contact|hi|team|support|sales|admin|owner|office)$/i.test(local);
}

function pickEmail(candidates: string[], siteDomain?: string | null) {
  const unique = Array.from(new Set(candidates.map((item) => item.toLowerCase().replace(/^mailto:/, "").split("?")[0])));
  const valid = unique.filter((item) => isPlausibleEmail(item, siteDomain));
  const sameDomain = valid.find((item) => {
    const host = item.split("@")[1] ?? "";
    const domain = siteDomain?.replace(/^www\./, "").toLowerCase();
    return domain && (host === domain || host.endsWith(`.${domain}`));
  });
  return sameDomain ?? valid[0] ?? null;
}

function pickPhone(value: string | null) {
  if (!value) return null;
  const compact = value.replace(/[^\d+]/g, "");
  if (compact.replace(/\D/g, "").length < 7) return null;
  return value.replace(/\s+/g, " ").trim();
}

export function extractContactFromText(text: string, siteDomain?: string | null): Pick<ExtractedContact, "email" | "phone"> {
  const decoded = decodeHtml(text);
  const emails = decoded.match(EMAIL_RE) ?? [];
  const mailtos = Array.from(decoded.matchAll(MAILTO_RE)).map((match) => decodeURIComponent(match[1] ?? ""));
  const tels = Array.from(decoded.matchAll(TEL_RE)).map((match) => match[1] ?? "");
  return {
    email: pickEmail([...mailtos, ...emails], siteDomain),
    phone: pickPhone(tels[0] ?? null),
  };
}

export function extractContactFromRaw(raw: unknown, siteDomain?: string | null): ExtractedContact {
  const org = asRecord(raw);
  const nestedPhone = asRecord(org.primary_phone);
  const fromText = extractContactFromText(JSON.stringify(raw ?? {}), siteDomain);
  const website = asString(org.website_url) ?? asString(org.url) ?? (siteDomain ? `https://${siteDomain}` : null);
  return {
    email:
      asString(org.email) ??
      asString(org.primary_email) ??
      asString(org.organization_email) ??
      fromText.email,
    phone:
      asString(org.phone) ??
      asString(org.primary_phone) ??
      asString(nestedPhone.number) ??
      fromText.phone,
    website,
    linkedinUrl: asString(org.linkedin_url),
    facebookUrl: asString(org.facebook_url),
    twitterUrl: asString(org.twitter_url),
    fullName: asString(org.author) ?? asString(org.person_name) ?? ([asString(org.first_name), asString(org.last_name)].filter(Boolean).join(" ") || null),
    businessName: asString(org.name) ?? asString(org.company),
  };
}

export function socialNotes(contact: ExtractedContact) {
  return [
    contact.linkedinUrl ? `linkedin: ${contact.linkedinUrl}` : null,
    contact.facebookUrl ? `facebook: ${contact.facebookUrl}` : null,
    contact.twitterUrl ? `twitter: ${contact.twitterUrl}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export function parseSocialNotes(notes: string | null | undefined) {
  const result = { linkedinUrl: null as string | null, facebookUrl: null as string | null, twitterUrl: null as string | null };
  if (!notes) return result;
  for (const line of notes.split("\n")) {
    const [key, ...rest] = line.split(":");
    const value = rest.join(":").trim();
    if (!value) continue;
    if (key?.trim() === "linkedin") result.linkedinUrl = value;
    if (key?.trim() === "facebook") result.facebookUrl = value;
    if (key?.trim() === "twitter") result.twitterUrl = value;
  }
  return result;
}

async function fetchHtml(url: string, timeoutMs = 4000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        Accept: "text/html,text/plain",
        "User-Agent": "clientra/0.1 (public contact discovery)",
      },
    });
    if (!response.ok) return null;
    const type = response.headers.get("content-type") ?? "";
    if (!type.includes("text/html") && !type.includes("text/plain")) return null;
    return (await response.text()).slice(0, 180_000);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function contactPageUrl(html: string, baseUrl: string) {
  const match = html.match(/href=["']([^"']*(contact|get-in-touch|about)[^"']*)["']/i);
  if (!match?.[1]) return null;
  try {
    return new URL(match[1], baseUrl).toString();
  } catch {
    return null;
  }
}

export async function discoverPublicWebsiteContact(url: string, domain?: string | null): Promise<ExtractedContact> {
  const empty: ExtractedContact = {
    email: null,
    phone: null,
    website: url,
    linkedinUrl: null,
    facebookUrl: null,
    twitterUrl: null,
    fullName: null,
    businessName: null,
  };
  const html = await fetchHtml(url);
  if (!html) return empty;
  const first = extractContactFromText(html, domain);
  const linkedin = html.match(/https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/[^\s"'<>]+/i)?.[0] ?? null;
  const facebook = html.match(/https?:\/\/(?:www\.)?facebook\.com\/[^\s"'<>]+/i)?.[0] ?? null;
  const twitter = html.match(/https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[^\s"'<>]+/i)?.[0] ?? null;
  let email = first.email;
  let phone = first.phone;
  if (!email) {
    const nextUrl = contactPageUrl(html, url);
    if (nextUrl && nextUrl !== url) {
      const nextHtml = await fetchHtml(nextUrl);
      if (nextHtml) {
        const second = extractContactFromText(nextHtml, domain);
        email = second.email;
        phone = phone ?? second.phone;
      }
    }
  }
  return {
    ...empty,
    email,
    phone,
    linkedinUrl: linkedin,
    facebookUrl: facebook,
    twitterUrl: twitter,
  };
}

type ApolloPerson = {
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  title?: string;
};

export async function discoverApolloPersonContact(domain: string): Promise<Partial<ExtractedContact> | null> {
  if (!isApolloConfigured() || !domain) return null;
  try {
    const env = getServerEnv();
    const response = await fetch("https://api.apollo.io/api/v1/mixed_people/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "x-api-key": env.apolloApiKey,
      },
      body: JSON.stringify({
        page: 1,
        per_page: 3,
        q_organization_domains_list: [domain],
        person_titles: ["owner", "founder", "co-founder", "ceo", "president"],
      }),
    });
    if (!response.ok) return null;
    const json = (await response.json()) as { people?: ApolloPerson[] };
    const person = (json.people ?? []).find((item) => item.email && !item.email.includes("*"));
    if (!person?.email) return null;
    const fullName =
      person.name ||
      [person.first_name, person.last_name].filter(Boolean).join(" ") ||
      null;
    return { email: person.email, fullName };
  } catch {
    return null;
  }
}

export function mergeContacts(...parts: Array<Partial<ExtractedContact> | null | undefined>): ExtractedContact {
  const merged: ExtractedContact = {
    email: null,
    phone: null,
    website: null,
    linkedinUrl: null,
    facebookUrl: null,
    twitterUrl: null,
    fullName: null,
    businessName: null,
  };
  for (const part of parts) {
    if (!part) continue;
    merged.email = merged.email ?? part.email ?? null;
    merged.phone = merged.phone ?? part.phone ?? null;
    merged.website = merged.website ?? part.website ?? null;
    merged.linkedinUrl = merged.linkedinUrl ?? part.linkedinUrl ?? null;
    merged.facebookUrl = merged.facebookUrl ?? part.facebookUrl ?? null;
    merged.twitterUrl = merged.twitterUrl ?? part.twitterUrl ?? null;
    merged.fullName = merged.fullName ?? part.fullName ?? null;
    merged.businessName = merged.businessName ?? part.businessName ?? null;
  }
  return merged;
}

export function hasPublicContact(contact: Partial<ExtractedContact> | null | undefined) {
  return Boolean(contact?.email || contact?.phone);
}

export function domainFromUrl(url: string | null | undefined) {
  if (!url) return null;
  const domain = extractDomain(url);
  return domain.includes(".") ? domain : null;
}

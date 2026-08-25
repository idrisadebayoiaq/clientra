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
const TEL_RE = /tel:(\+?[\d().\s-]{7,22})/gi;
const PHONE_VISIBLE_RE =
  /(?:\+|00)?(?:\d[\s().-]?){7,16}\d|(?:\(?\d{2,4}\)?[\s.-]?){2,4}\d{3,4}/g;
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
  "googleapis.com",
  "microsoft.com",
  "office.com",
  "zendesk.com",
  "intercom.io",
  "hubspot.com",
  "mailchimp.com",
]);
const CONTACT_PATHS = [
  "/contact",
  "/contact-us",
  "/contactus",
  "/get-in-touch",
  "/about",
  "/about-us",
  "/aboutus",
  "/team",
  "/our-team",
  "/support",
  "/impressum",
  "/imprint",
  "/company",
];

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
  return value
    .replace(/&amp;/g, "&")
    .replace(/&#64;/g, "@")
    .replace(/&#x40;/gi, "@")
    .replace(/%40/gi, "@")
    .replace(/&#46;/g, ".")
    .replace(/&#x2e;/gi, ".");
}

function decodeCfEmail(hex: string) {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length < 4) return null;
  try {
    const key = parseInt(hex.slice(0, 2), 16);
    let email = "";
    for (let i = 2; i < hex.length; i += 2) {
      email += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16) ^ key);
    }
    return EMAIL_RE.test(email) ? email : null;
  } catch {
    return null;
  }
}

function deobfuscateEmails(text: string) {
  const decoded = decodeHtml(text);
  const patterns = [
    /([a-zA-Z0-9._%+-]+)\s*(?:\[|\(|\{)?\s*(?:at|AT)\s*(?:\]|\)|\})?\s*([a-zA-Z0-9.-]+)\s*(?:\[|\(|\{)?\s*(?:dot|DOT)\s*(?:\]|\)|\})?\s*([a-zA-Z]{2,})/g,
    /([a-zA-Z0-9._%+-]+)\s*@\s*([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
  ];
  const found: string[] = [];
  for (const pattern of patterns) {
    for (const match of decoded.matchAll(pattern)) {
      if (match[3]) found.push(`${match[1]}@${match[2]}.${match[3]}`);
      else if (match[2]) found.push(`${match[1]}@${match[2]}`);
    }
  }
  for (const match of decoded.matchAll(/data-cfemail=["']([0-9a-f]+)["']/gi)) {
    const email = decodeCfEmail(match[1] ?? "");
    if (email) found.push(email);
  }
  return found;
}

function isPlausibleEmail(email: string, siteDomain?: string | null) {
  const normalized = email.toLowerCase().replace(/^mailto:/, "").split("?")[0];
  const [local, host] = normalized.split("@");
  if (!local || !host || local.length > 64 || host.length > 255) return false;
  if (/\.(png|jpe?g|gif|webp|svg|css|js)$/i.test(local) || /\.(png|jpe?g|gif|webp|svg)$/i.test(host)) {
    return false;
  }
  if (/^(noreply|no-reply|donotreply|mailer-daemon|notifications?)$/i.test(local)) return false;
  if (IGNORE_EMAIL_HOSTS.has(host)) return false;
  if (siteDomain) {
    const domain = siteDomain.replace(/^www\./, "").toLowerCase();
    if (host === domain || host.endsWith(`.${domain}`)) return true;
  }
  return /^(info|hello|contact|hi|team|support|sales|admin|owner|office|enquiries|inquiry|hello|mail)$/i.test(
    local,
  );
}

function pickEmail(candidates: string[], siteDomain?: string | null) {
  const unique = Array.from(
    new Set(candidates.map((item) => item.toLowerCase().replace(/^mailto:/, "").split("?")[0])),
  );
  const valid = unique.filter((item) => isPlausibleEmail(item, siteDomain));
  const preferredLocal = /^(info|hello|contact|sales|team|office|enquiries|inquiry)$/i;
  const sameDomainPreferred = valid.find((item) => {
    const [local, host] = item.split("@");
    const domain = siteDomain?.replace(/^www\./, "").toLowerCase();
    return domain && (host === domain || host?.endsWith(`.${domain}`)) && preferredLocal.test(local ?? "");
  });
  if (sameDomainPreferred) return sameDomainPreferred;
  const sameDomain = valid.find((item) => {
    const host = item.split("@")[1] ?? "";
    const domain = siteDomain?.replace(/^www\./, "").toLowerCase();
    return domain && (host === domain || host.endsWith(`.${domain}`));
  });
  return sameDomain ?? valid[0] ?? null;
}

function pickPhone(value: string | null) {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return null;
  if (/^0+$/.test(digits) || /^1234567/.test(digits)) return null;
  return value.replace(/\s+/g, " ").trim();
}

function extractPhonesFromText(text: string) {
  const tels = Array.from(text.matchAll(TEL_RE)).map((match) => match[1] ?? "");
  const visible = text.match(PHONE_VISIBLE_RE) ?? [];
  const ranked = [...tels, ...visible]
    .map((item) => pickPhone(item))
    .filter((item): item is string => Boolean(item));
  return ranked[0] ?? null;
}

function jsonLdContacts(html: string) {
  const blocks = Array.from(
    html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
  );
  const emails: string[] = [];
  const phones: string[] = [];
  let businessName: string | null = null;
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block[1] ?? "");
      const rows = Array.isArray(parsed) ? parsed : [parsed];
      for (const row of rows) {
        if (!row || typeof row !== "object") continue;
        const record = row as Record<string, unknown>;
        if (!businessName) businessName = asString(record.name);
        const email = asString(record.email);
        const telephone = asString(record.telephone) ?? asString(record.phone);
        if (email) emails.push(email);
        if (telephone) phones.push(telephone);
        const contactPoint = record.contactPoint;
        const points = Array.isArray(contactPoint) ? contactPoint : contactPoint ? [contactPoint] : [];
        for (const point of points) {
          if (!point || typeof point !== "object") continue;
          const item = point as Record<string, unknown>;
          const pointEmail = asString(item.email);
          const pointPhone = asString(item.telephone) ?? asString(item.phone);
          if (pointEmail) emails.push(pointEmail);
          if (pointPhone) phones.push(pointPhone);
        }
      }
    } catch {
      // Ignore malformed JSON-LD.
    }
  }
  return { emails, phones, businessName };
}

function extractSocial(html: string) {
  const linkedin =
    html.match(/https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in|school)\/[a-zA-Z0-9._%-]+\/?/i)?.[0] ?? null;
  const facebook =
    html.match(/https?:\/\/(?:www\.)?facebook\.com\/(?!sharer|share\.php|dialog)[a-zA-Z0-9._%-]+\/?/i)?.[0] ??
    null;
  const twitter =
    html.match(/https?:\/\/(?:www\.)?(?:twitter|x)\.com\/(?!intent|share)[a-zA-Z0-9_]+\/?/i)?.[0] ?? null;
  return {
    linkedinUrl: linkedin?.replace(/[),.;]+$/, "") ?? null,
    facebookUrl: facebook?.replace(/[),.;]+$/, "") ?? null,
    twitterUrl: twitter?.replace(/[),.;]+$/, "") ?? null,
  };
}

function contactLinksFromHtml(html: string, baseUrl: string) {
  const matches = Array.from(
    html.matchAll(/href=["']([^"']*(?:contact|get-in-touch|about|team|impressum|imprint|support)[^"']*)["']/gi),
  );
  const urls: string[] = [];
  for (const match of matches) {
    try {
      const absolute = new URL(match[1] ?? "", baseUrl).toString();
      if (!urls.includes(absolute) && absolute.startsWith("http")) urls.push(absolute);
    } catch {
      // Ignore bad hrefs.
    }
  }
  return urls.slice(0, 4);
}

function candidateContactUrls(baseUrl: string, html: string) {
  const fromLinks = contactLinksFromHtml(html, baseUrl);
  const fromPaths: string[] = [];
  try {
    const origin = new URL(baseUrl).origin;
    for (const path of CONTACT_PATHS) {
      fromPaths.push(`${origin}${path}`);
    }
  } catch {
    // Ignore bad base URL.
  }
  return Array.from(new Set([...fromLinks, ...fromPaths])).slice(0, 6);
}

export function extractContactFromText(text: string, siteDomain?: string | null): Pick<ExtractedContact, "email" | "phone"> {
  const decoded = decodeHtml(text);
  const emails = decoded.match(EMAIL_RE) ?? [];
  const mailtos = Array.from(decoded.matchAll(MAILTO_RE)).map((match) => decodeURIComponent(match[1] ?? ""));
  const obfuscated = deobfuscateEmails(decoded);
  return {
    email: pickEmail([...mailtos, ...obfuscated, ...emails], siteDomain),
    phone: extractPhonesFromText(decoded),
  };
}

export function extractContactFromHtml(html: string, siteDomain?: string | null, website?: string | null): ExtractedContact {
  const fromText = extractContactFromText(html, siteDomain);
  const jsonLd = jsonLdContacts(html);
  const social = extractSocial(html);
  return {
    email: pickEmail([...(jsonLd.emails ?? []), fromText.email].filter(Boolean) as string[], siteDomain),
    phone: pickPhone(jsonLd.phones[0] ?? null) ?? fromText.phone,
    website: website ?? (siteDomain ? `https://${siteDomain}` : null),
    linkedinUrl: social.linkedinUrl,
    facebookUrl: social.facebookUrl,
    twitterUrl: social.twitterUrl,
    fullName: null,
    businessName: jsonLd.businessName,
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
    fullName:
      asString(org.author) ??
      asString(org.person_name) ??
      ([asString(org.first_name), asString(org.last_name)].filter(Boolean).join(" ") || null),
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
  const result = {
    linkedinUrl: null as string | null,
    facebookUrl: null as string | null,
    twitterUrl: null as string | null,
  };
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

async function fetchHtml(url: string, timeoutMs = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "User-Agent":
          "Mozilla/5.0 (compatible; Clientra/0.1; +https://clientra-xi-rouge.vercel.app; public contact discovery)",
      },
    });
    if (!response.ok) return null;
    const type = response.headers.get("content-type") ?? "";
    if (!type.includes("text/html") && !type.includes("text/plain") && !type.includes("xhtml")) return null;
    return (await response.text()).slice(0, 220_000);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
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
  const siteDomain = domain ?? domainFromUrl(url);
  const html = await fetchHtml(url);
  if (!html) return empty;

  let merged = extractContactFromHtml(html, siteDomain, url);
  if (merged.email && merged.phone) return merged;

  const candidates = candidateContactUrls(url, html).filter((item) => item !== url);
  for (const nextUrl of candidates) {
    if (merged.email && merged.phone) break;
    const nextHtml = await fetchHtml(nextUrl, 5000);
    if (!nextHtml) continue;
    merged = mergeContacts(merged, extractContactFromHtml(nextHtml, siteDomain, url));
  }
  return merged;
}

/** Local public crawl, then optional Omkar / self-hosted deeper crawl when configured. */
export async function enrichWebsiteContact(url: string, domain?: string | null): Promise<ExtractedContact> {
  const local = await discoverPublicWebsiteContact(url, domain);
  if (hasPublicContact(local) && local.linkedinUrl) return local;
  try {
    const { discoverOmkarWebsiteContact } = await import("@/lib/opportunities/omkar-contact");
    const deeper = await discoverOmkarWebsiteContact(domain || url);
    return mergeContacts(local, deeper);
  } catch {
    return local;
  }
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
      person.name || [person.first_name, person.last_name].filter(Boolean).join(" ") || null;
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

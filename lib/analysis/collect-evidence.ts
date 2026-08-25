import { extractContactFromText } from "@/lib/opportunities/public-contact";
import { getServerEnv, isUrlscanConfigured } from "@/lib/env";

export type WebsiteEvidence = {
  fetched: boolean;
  finalUrl: string | null;
  status: number | null;
  https: boolean | null;
  title: string | null;
  metaDescription: string | null;
  ogSiteName: string | null;
  ogTitle: string | null;
  canonical: string | null;
  generator: string | null;
  language: string | null;
  headings: string[];
  technologies: string[];
  platform: string | null;
  isEcommerce: boolean | null;
  hasViewport: boolean | null;
  jsonLdTypes: string[];
  textSnippet: string | null;
  emails: string[];
  phones: string[];
  country: string | null;
  city: string | null;
  server: string | null;
  ip: string | null;
  source: "html" | "urlscan" | "html+urlscan" | "none";
  notes: string[];
};

const TECH_SIGNATURES: Array<{ name: string; pattern: RegExp; platform?: boolean; ecommerce?: boolean }> = [
  { name: "Shopify", pattern: /cdn\.shopify\.com|Shopify\.theme|myshopify\.com/i, platform: true, ecommerce: true },
  { name: "WooCommerce", pattern: /woocommerce|wp-content\/plugins\/woocommerce/i, platform: true, ecommerce: true },
  { name: "Magento", pattern: /Magento|mage\/cookies/i, platform: true, ecommerce: true },
  { name: "BigCommerce", pattern: /bigcommerce/i, platform: true, ecommerce: true },
  { name: "WordPress", pattern: /wp-content|wp-includes|wordpress/i, platform: true },
  { name: "Wix", pattern: /wixstatic\.com|X-Wix|_wixCIDX/i, platform: true },
  { name: "Squarespace", pattern: /squarespace|static1\.squarespace/i, platform: true },
  { name: "Webflow", pattern: /webflow/i, platform: true },
  { name: "Next.js", pattern: /__NEXT_DATA__|_next\/static/i, platform: true },
  { name: "React", pattern: /react|data-reactroot/i },
  { name: "Google Analytics", pattern: /googletagmanager\.com|gtag\(|google-analytics\.com/i },
  { name: "Google Tag Manager", pattern: /googletagmanager\.com\/gtm/i },
  { name: "Cloudflare", pattern: /cloudflare|cf-ray|cdnjs\.cloudflare/i },
  { name: "HubSpot", pattern: /hs-scripts\.com|hubspot/i },
  { name: "Stripe", pattern: /js\.stripe\.com|Stripe\(/i, ecommerce: true },
];

function decode(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function attr(html: string, key: string) {
  const named = html.match(
    new RegExp(`<meta[^>]+(?:name|property)=["']${key}["'][^>]*content=["']([^"']*)["']`, "i"),
  );
  if (named?.[1]) return decode(named[1]);
  const reversed = html.match(
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:name|property)=["']${key}["']`, "i"),
  );
  return reversed?.[1] ? decode(reversed[1]) : null;
}

function tagText(html: string, tag: string) {
  const match = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return match?.[1] ? decode(match[1].replace(/<[^>]+>/g, " ")) : null;
}

function collectHeadings(html: string) {
  const matches = Array.from(html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi));
  return Array.from(
    new Set(
      matches
        .map((item) => decode((item[1] ?? "").replace(/<[^>]+>/g, " ")))
        .filter((item) => item.length > 1 && item.length < 140),
    ),
  ).slice(0, 12);
}

function jsonLdTypes(html: string) {
  const blocks = Array.from(html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi));
  const types: string[] = [];
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block[1] ?? "");
      const rows = Array.isArray(parsed) ? parsed : [parsed];
      for (const row of rows) {
        const value = row?.["@type"];
        if (typeof value === "string") types.push(value);
        if (Array.isArray(value)) types.push(...value.filter((item): item is string => typeof item === "string"));
      }
    } catch {
      // Ignore malformed JSON-LD.
    }
  }
  return Array.from(new Set(types)).slice(0, 12);
}

function detectTech(html: string) {
  const technologies: string[] = [];
  let platform: string | null = null;
  let ecommerce = false;
  for (const item of TECH_SIGNATURES) {
    if (item.pattern.test(html)) {
      technologies.push(item.name);
      if (item.platform && !platform) platform = item.name;
      if (item.ecommerce) ecommerce = true;
    }
  }
  if (/\/cart\b|add-to-cart|product-card|buy now/i.test(html)) ecommerce = true;
  if (jsonLdTypes(html).some((item) => /product|offer|store|ecommerce/i.test(item))) ecommerce = true;
  return { technologies: Array.from(new Set(technologies)), platform, isEcommerce: ecommerce || null };
}

function isChallengePage(html: string, title: string | null) {
  const compact = html.slice(0, 8000).toLowerCase();
  const titleText = (title ?? "").toLowerCase();
  return (
    html.length < 500 ||
    /just a moment|attention required|access denied|cf-browser-verification|cdn-cgi\/challenge-platform|enable javascript and cookies to continue/i.test(
      compact,
    ) ||
    titleText.includes("just a moment") ||
    titleText.includes("access denied")
  );
}

function visibleText(html: string) {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  return decode(withoutScripts).slice(0, 2500);
}

async function fetchHtml(url: string, timeoutMs = 12000) {
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
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      },
    });
    const type = response.headers.get("content-type") ?? "";
    if (!type.includes("text/html") && !type.includes("application/xhtml")) {
      return { ok: false, status: response.status, url: response.url, html: null as string | null };
    }
    const html = (await response.text()).slice(0, 250_000);
    return { ok: response.ok, status: response.status, url: response.url, html };
  } catch {
    return { ok: false, status: null, url, html: null as string | null };
  } finally {
    clearTimeout(timer);
  }
}

function parseHtml(html: string, finalUrl: string, domain: string, status: number | null): WebsiteEvidence {
  const title = tagText(html, "title");
  const lang = html.match(/<html[^>]*lang=["']([^"']+)/i)?.[1] ?? null;
  const tech = detectTech(html);
  const contact = extractContactFromText(html, domain);
  const blocked = isChallengePage(html, title);
  return {
    fetched: !blocked,
    finalUrl,
    status,
    https: finalUrl.startsWith("https://"),
    title: blocked ? null : title,
    metaDescription: blocked ? null : attr(html, "description") ?? attr(html, "og:description"),
    ogSiteName: blocked ? null : attr(html, "og:site_name"),
    ogTitle: blocked ? null : attr(html, "og:title"),
    canonical: blocked ? null : attr(html, "canonical") ?? html.match(/rel=["']canonical["'][^>]*href=["']([^"']+)/i)?.[1] ?? null,
    generator: blocked ? null : attr(html, "generator"),
    language: lang,
    headings: blocked ? [] : collectHeadings(html),
    technologies: blocked ? [] : tech.technologies,
    platform: blocked ? null : tech.platform,
    isEcommerce: blocked ? null : tech.isEcommerce,
    hasViewport: blocked ? null : Boolean(attr(html, "viewport") || /name=["']viewport["']/i.test(html)),
    jsonLdTypes: blocked ? [] : jsonLdTypes(html),
    textSnippet: blocked ? null : visibleText(html),
    emails: contact.email ? [contact.email] : [],
    phones: contact.phone ? [contact.phone] : [],
    country: null,
    city: null,
    server: null,
    ip: null,
    source: blocked ? "none" : "html",
    notes: blocked ? ["Homepage returned a challenge or empty page, so HTML evidence was ignored."] : [],
  };
}

type UrlscanResult = {
  page?: {
    title?: string;
    domain?: string;
    url?: string;
    country?: string;
    city?: string;
    server?: string;
    ip?: string;
    status?: string | number;
  };
  lists?: { servers?: string[]; countries?: string[] };
  meta?: { processors?: { wappa?: { data?: Array<{ app?: string; confidence?: number }> } } };
  verdicts?: { overall?: { malicious?: boolean } };
};

async function urlscanByUuid(uuid: string) {
  const env = getServerEnv();
  const response = await fetch(`https://urlscan.io/api/v1/result/${uuid}/`, {
    headers: { "API-Key": env.urlscanApiKey, "User-Agent": "clientra/0.1" },
  });
  if (!response.ok) return null;
  return (await response.json()) as UrlscanResult;
}

async function urlscanSearch(domain: string) {
  if (!isUrlscanConfigured()) return null;
  const env = getServerEnv();
  const query = `page.domain:${domain} AND page.status:200`;
  const response = await fetch(
    `https://urlscan.io/api/v1/search/?q=${encodeURIComponent(query)}&size=1`,
    { headers: { "API-Key": env.urlscanApiKey, "User-Agent": "clientra/0.1" } },
  );
  if (!response.ok) return null;
  const json = (await response.json()) as { results?: Array<{ task?: { uuid?: string } }> };
  const uuid = json.results?.[0]?.task?.uuid;
  return uuid ? urlscanByUuid(uuid) : null;
}

function fromUrlscan(scan: UrlscanResult): Partial<WebsiteEvidence> {
  const apps = (scan.meta?.processors?.wappa?.data ?? [])
    .map((item) => item.app)
    .filter((item): item is string => Boolean(item));
  return {
    title: scan.page?.title ?? null,
    finalUrl: scan.page?.url ?? null,
    https: scan.page?.url ? scan.page.url.startsWith("https://") : null,
    country: scan.page?.country ?? scan.lists?.countries?.[0] ?? null,
    city: scan.page?.city ?? null,
    server: scan.page?.server ?? scan.lists?.servers?.[0] ?? null,
    ip: scan.page?.ip ?? null,
    status: scan.page?.status ? Number(scan.page.status) : null,
    technologies: apps,
    platform: apps.find((item) => /shopify|wordpress|wix|squarespace|webflow|next/i.test(item)) ?? null,
    isEcommerce: apps.some((item) => /shopify|woocommerce|magento|bigcommerce|shop/i.test(item)) || null,
    notes: scan.verdicts?.overall?.malicious ? ["urlscan marked this scan as potentially malicious."] : [],
  };
}

function mergeEvidence(html: WebsiteEvidence | null, scan: Partial<WebsiteEvidence> | null): WebsiteEvidence {
  const empty: WebsiteEvidence = {
    fetched: false,
    finalUrl: null,
    status: null,
    https: null,
    title: null,
    metaDescription: null,
    ogSiteName: null,
    ogTitle: null,
    canonical: null,
    generator: null,
    language: null,
    headings: [],
    technologies: [],
    platform: null,
    isEcommerce: null,
    hasViewport: null,
    jsonLdTypes: [],
    textSnippet: null,
    emails: [],
    phones: [],
    country: null,
    city: null,
    server: null,
    ip: null,
    source: "none",
    notes: [],
  };
  const base = html ?? empty;
  if (!scan) return base;
  const technologies = Array.from(new Set([...base.technologies, ...(scan.technologies ?? [])]));
  const source = html?.fetched && scan.title ? "html+urlscan" : html?.fetched ? "html" : scan.title || scan.finalUrl ? "urlscan" : base.source;
  return {
    ...base,
    fetched: Boolean(html?.fetched || scan.title || scan.finalUrl),
    finalUrl: base.finalUrl ?? scan.finalUrl ?? null,
    status: base.status ?? scan.status ?? null,
    https: base.https ?? scan.https ?? null,
    title: base.title ?? scan.title ?? null,
    technologies,
    platform: base.platform ?? scan.platform ?? null,
    isEcommerce: base.isEcommerce ?? scan.isEcommerce ?? null,
    country: base.country ?? scan.country ?? null,
    city: base.city ?? scan.city ?? null,
    server: base.server ?? scan.server ?? null,
    ip: base.ip ?? scan.ip ?? null,
    source,
    notes: [...base.notes, ...(scan.notes ?? [])],
  };
}

async function urlscanSubmitAndWait(url: string) {
  const env = getServerEnv();
  const submit = await fetch("https://urlscan.io/api/v1/scan/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "API-Key": env.urlscanApiKey,
      "User-Agent": "clientra/0.1",
    },
    body: JSON.stringify({ url, visibility: "public" }),
  });
  if (!submit.ok) return null;
  const json = (await submit.json()) as { uuid?: string };
  if (!json.uuid) return null;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    const result = await urlscanByUuid(json.uuid);
    if (result?.page) return result;
  }
  return null;
}

export async function collectWebsiteEvidence(input: {
  url?: string | null;
  domain?: string | null;
  urlscanUuid?: string | null;
}) {
  const domain = input.domain?.replace(/^www\./, "") ?? null;
  const startUrl = input.url || (domain ? `https://${domain}` : null);
  const [page, existingScan] = await Promise.all([
    startUrl ? fetchHtml(startUrl) : Promise.resolve(null),
    input.urlscanUuid && isUrlscanConfigured()
      ? urlscanByUuid(input.urlscanUuid)
      : domain
        ? urlscanSearch(domain)
        : Promise.resolve(null),
  ]);

  const htmlEvidence =
    page?.html && domain ? parseHtml(page.html, page.url, domain, page.status) : null;
  let scanEvidence = existingScan ? fromUrlscan(existingScan) : null;
  let merged = mergeEvidence(htmlEvidence, scanEvidence);

  if (!merged.fetched && startUrl && isUrlscanConfigured()) {
    const submitted = await urlscanSubmitAndWait(startUrl);
    if (submitted) {
      scanEvidence = fromUrlscan(submitted);
      merged = mergeEvidence(htmlEvidence, scanEvidence);
    }
  }

  if (!merged.fetched) {
    merged.notes.push("No live page HTML or urlscan result was available. Findings must stay Unable to determine unless a field is present above.");
  }
  return merged;
}

import { extractContactFromHtml } from "@/lib/opportunities/public-contact";
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

type UrlscanHit = {
  _id?: string;
  task?: { uuid?: string; url?: string };
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

function urlscanHeaders() {
  const headers: Record<string, string> = { "User-Agent": "clientra/0.1" };
  if (isUrlscanConfigured()) {
    const key = getServerEnv().urlscanApiKey;
    headers["API-Key"] = key;
    headers["api-key"] = key;
  }
  return headers;
}

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
  const blocks = Array.from(
    html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
  );
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

function isChallengePage(html: string, title: string | null, status: number | null) {
  if (status && status >= 400) return true;
  const compact = html.slice(0, 12000).toLowerCase();
  const titleText = (title ?? "").toLowerCase();
  return (
    html.length < 500 ||
    /just a moment|attention required|access denied|cf-browser-verification|cdn-cgi\/challenge-platform|enable javascript and cookies to continue|it needs a human touch|verify you are human|are you a robot/i.test(
      compact,
    ) ||
    titleText.includes("just a moment") ||
    titleText.includes("access denied") ||
    titleText.includes("it needs a human touch") ||
    titleText.includes("attention required")
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

async function fetchHtml(url: string, timeoutMs = 8000) {
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
    if (!type.includes("text/html") && !type.includes("application/xhtml") && !type.includes("text/plain")) {
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
  const blocked = isChallengePage(html, title, status);
  const lang = html.match(/<html[^>]*lang=["']([^"']+)/i)?.[1] ?? null;
  const tech = detectTech(html);
  const contact = blocked ? null : extractContactFromHtml(html, domain, finalUrl);
  return {
    fetched: !blocked,
    finalUrl,
    status,
    https: finalUrl.startsWith("https://"),
    title: blocked ? null : title,
    metaDescription: blocked ? null : attr(html, "description") ?? attr(html, "og:description"),
    ogSiteName: blocked ? null : attr(html, "og:site_name") ?? contact?.businessName ?? null,
    ogTitle: blocked ? null : attr(html, "og:title"),
    canonical: blocked ? null : html.match(/rel=["']canonical["'][^>]*href=["']([^"']+)/i)?.[1] ?? null,
    generator: blocked ? null : attr(html, "generator"),
    language: lang,
    headings: blocked ? [] : collectHeadings(html),
    technologies: blocked ? [] : tech.technologies,
    platform: blocked ? null : tech.platform,
    isEcommerce: blocked ? null : tech.isEcommerce,
    hasViewport: blocked ? null : Boolean(attr(html, "viewport") || /name=["']viewport["']/i.test(html)),
    jsonLdTypes: blocked ? [] : jsonLdTypes(html),
    textSnippet: blocked ? null : visibleText(html),
    emails: contact?.email ? [contact.email] : [],
    phones: contact?.phone ? [contact.phone] : [],
    country: null,
    city: null,
    server: null,
    ip: null,
    source: blocked ? "none" : "html",
    notes: blocked ? [`Direct page fetch was blocked or returned HTTP ${status ?? "error"}.`] : [],
  };
}

function emptyEvidence(): WebsiteEvidence {
  return {
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
}

export function emptyWebsiteEvidence(notes: string[] = []): WebsiteEvidence {
  const fallback = emptyEvidence();
  fallback.notes = notes;
  return fallback;
}

function homepageScore(hit: UrlscanHit, domain: string) {
  const raw = hit.page?.url ?? hit.task?.url ?? "";
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (host !== domain) return -1;
    let score = 10;
    if (url.pathname === "/" || url.pathname === "") score += 50;
    if (!url.search) score += 20;
    if ((hit.page?.title ?? "").length > 8) score += 5;
    return score;
  } catch {
    return -1;
  }
}

function fromUrlscanHit(hit: UrlscanHit, extra?: Partial<WebsiteEvidence>): Partial<WebsiteEvidence> {
  return {
    title: hit.page?.title ?? extra?.title ?? null,
    finalUrl: hit.page?.url ?? extra?.finalUrl ?? null,
    https: hit.page?.url ? hit.page.url.startsWith("https://") : extra?.https ?? null,
    country: hit.page?.country ?? extra?.country ?? null,
    city: hit.page?.city ?? extra?.city ?? null,
    server: hit.page?.server ?? extra?.server ?? null,
    ip: hit.page?.ip ?? extra?.ip ?? null,
    status: hit.page?.status ? Number(hit.page.status) : extra?.status ?? null,
    technologies: extra?.technologies ?? [],
    platform: extra?.platform ?? null,
    isEcommerce: extra?.isEcommerce ?? null,
    notes: extra?.notes ?? [],
  };
}

function mergeEvidence(html: WebsiteEvidence | null, scan: Partial<WebsiteEvidence> | null): WebsiteEvidence {
  const base = html ?? emptyEvidence();
  if (!scan) return base;
  const technologies = Array.from(new Set([...base.technologies, ...(scan.technologies ?? [])]));
  const hasScan = Boolean(scan.title || scan.finalUrl);
  const source = html?.fetched && hasScan ? "html+urlscan" : html?.fetched ? "html" : hasScan ? "urlscan" : base.source;
  return {
    ...base,
    fetched: Boolean(html?.fetched || hasScan),
    finalUrl: (html?.fetched ? html.finalUrl : null) ?? scan.finalUrl ?? base.finalUrl,
    status: base.status ?? scan.status ?? null,
    https: base.https ?? scan.https ?? null,
    title: (html?.fetched ? html.title : null) ?? scan.title ?? base.title,
    metaDescription: html?.fetched ? html.metaDescription : base.metaDescription,
    ogSiteName: html?.fetched ? html.ogSiteName : base.ogSiteName,
    headings: html?.fetched && html.headings.length ? html.headings : base.headings,
    textSnippet: html?.fetched ? html.textSnippet : base.textSnippet,
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

async function urlscanSearchHomepage(domain: string): Promise<UrlscanHit | null> {
  try {
    const query = `page.domain:"${domain}" AND page.status:200`;
    const response = await fetch(`https://urlscan.io/api/v1/search/?q=${encodeURIComponent(query)}&size=15`, {
      headers: urlscanHeaders(),
    });
    if (!response.ok) return null;
    const json = (await response.json()) as { results?: UrlscanHit[] };
    const ranked = (json.results ?? [])
      .map((hit) => ({ hit, score: homepageScore(hit, domain) }))
      .filter((row) => row.score >= 0)
      .sort((a, b) => b.score - a.score);
    return ranked[0]?.hit ?? json.results?.[0] ?? null;
  } catch {
    return null;
  }
}

async function urlscanDom(uuid: string, domain: string, siteUrl?: string | null) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`https://urlscan.io/dom/${uuid}/`, {
      signal: controller.signal,
      headers: urlscanHeaders(),
    });
    if (!response.ok) return null;
    const html = (await response.text()).slice(0, 250_000);
    if (!html) return null;
    const parsed = parseHtml(html, siteUrl || `https://${domain}`, domain, 200);
    if (parsed.fetched) parsed.source = "urlscan";
    return parsed;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function collectWebsiteEvidence(input: {
  url?: string | null;
  domain?: string | null;
  urlscanUuid?: string | null;
}) {
  try {
    const domain = input.domain?.replace(/^www\./, "").toLowerCase() ?? null;
    const startUrl = input.url || (domain ? `https://${domain}` : null);
    const notes: string[] = [];

    const [livePage, searchHit] = await Promise.all([
      startUrl ? fetchHtml(startUrl) : Promise.resolve(null),
      domain ? urlscanSearchHomepage(domain) : Promise.resolve(null),
    ]);

    const liveParsed =
      livePage?.html && domain ? parseHtml(livePage.html, livePage.url, domain, livePage.status) : null;
    const usableLive = liveParsed?.fetched ? liveParsed : null;
    if (liveParsed && !liveParsed.fetched) notes.push(...liveParsed.notes);

    const uuid = input.urlscanUuid || searchHit?._id || searchHit?.task?.uuid || null;
    const siteUrl = searchHit?.page?.url || startUrl;
    const domEvidence = uuid && domain ? await urlscanDom(uuid, domain, siteUrl) : null;
    const scanMeta = searchHit ? fromUrlscanHit(searchHit) : null;

    let merged = mergeEvidence(usableLive ?? (domEvidence?.fetched ? domEvidence : null), scanMeta);
    if (domEvidence?.fetched) {
      merged = mergeEvidence(domEvidence, merged);
      merged.source = usableLive ? "html+urlscan" : "urlscan";
    }

    merged.notes = Array.from(new Set([...notes, ...merged.notes]));
    if (!merged.fetched) {
      merged.notes.push("No live page HTML or urlscan result was available.");
    }
    return merged;
  } catch {
    const fallback = emptyEvidence();
    fallback.notes.push("Page capture failed before any HTML or urlscan snapshot could be stored.");
    return fallback;
  }
}

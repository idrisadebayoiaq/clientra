const SKIP_DOMAINS = new Set([
  "google.com",
  "gmail.com",
  "youtube.com",
  "facebook.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "linkedin.com",
  "microsoft.com",
  "apple.com",
  "amazon.com",
  "cloudflare.com",
  "github.com",
  "githubusercontent.com",
  "wix.com",
  "wixsite.com",
  "wordpress.com",
  "blogspot.com",
  "urlscan.io",
  "sentry.io",
  "schema.org",
  "w3.org",
  "example.com",
  "localhost",
  "adzuna.com",
  "indeed.com",
  "glassdoor.com",
  "ziprecruiter.com",
  "monster.com",
]);

export function isJunkDiscoveryDomain(domain: string | null | undefined) {
  if (!domain) return true;
  const host = domain.replace(/^www\./, "").toLowerCase();
  if (!host.includes(".") || host.endsWith(".local")) return true;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return true;
  if (SKIP_DOMAINS.has(host)) return true;
  const parts = host.split(".");
  const root = parts.slice(-2).join(".");
  return SKIP_DOMAINS.has(root);
}

export function shouldPersistWebsite(domain: string | null | undefined) {
  return Boolean(domain) && !isJunkDiscoveryDomain(domain);
}

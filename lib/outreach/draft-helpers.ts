import type { Tables } from "@/types/database";

type DraftRow = Pick<Tables<"outreach_messages">, "id" | "subject" | "body" | "created_at">;

function normalizeToken(value: string | null | undefined) {
  return (value ?? "").toLowerCase().replace(/^www\./, "").trim();
}

export function resolveTargetCompanyName(input: {
  website?: { business_name?: string | null; title?: string | null; domain?: string | null } | null;
  opportunity?: { company_name?: string | null; title?: string | null; domain?: string | null; source?: string | null } | null;
  contact?: { business_name?: string | null; full_name?: string | null; website?: string | null; email?: string | null } | null;
}) {
  const domain = input.opportunity?.domain ?? input.website?.domain ?? null;
  const placeholder = domain ? `analyze ${domain}` : "";
  const candidates = [
    input.website?.business_name,
    input.website?.title,
    input.contact?.business_name,
    input.opportunity?.company_name,
    input.opportunity?.title,
    domain,
  ]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .filter((value) => normalizeToken(value) !== normalizeToken(placeholder))
    .filter((value) => !domain || normalizeToken(value) !== normalizeToken(domain));

  return candidates[0] ?? domain ?? "this business";
}

export function draftMatchesTarget(
  draft: DraftRow | null | undefined,
  input: {
    domain?: string | null;
    companyName?: string | null;
    contactEmail?: string | null;
  },
) {
  if (!draft?.subject && !draft?.body) return false;
  const haystack = `${draft.subject ?? ""}\n${draft.body ?? ""}`.toLowerCase();
  const domain = normalizeToken(input.domain);
  const company = normalizeToken(input.companyName);
  const email = normalizeToken(input.contactEmail);

  if (domain && domain.length > 3 && !haystack.includes(domain)) return false;
  if (email) {
    const emailDomain = email.split("@")[1];
    if (emailDomain && emailDomain.length > 3 && !haystack.includes(emailDomain)) return false;
  }
  if (company && company.length > 3 && domain && haystack.includes(domain)) return true;
  if (company && company.length > 3 && haystack.includes(company)) return true;
  return Boolean(domain && haystack.includes(domain));
}

export function isManualPlaceholderTitle(title?: string | null, domain?: string | null) {
  if (!title) return false;
  const normalized = title.trim().toLowerCase();
  if (!normalized.startsWith("analyze ")) return false;
  if (!domain) return true;
  return normalized.includes(domain.toLowerCase());
}

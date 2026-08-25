import type { createClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/types/database";
import type { NormalizedOpportunity } from "@/lib/opportunities/types";
import { freshnessFromDate, heuristicScore, scoreExplanation } from "@/lib/opportunities/score";

function publicPhone(raw: unknown) {
  const org = raw as { phone?: unknown; primary_phone?: unknown };
  if (typeof org.phone === "string" && org.phone.trim()) return org.phone.trim();
  if (typeof org.primary_phone === "string" && org.primary_phone.trim()) return org.primary_phone.trim();
  if (org.primary_phone && typeof org.primary_phone === "object") {
    const number = (org.primary_phone as { number?: unknown }).number;
    if (typeof number === "string" && number.trim()) return number.trim();
  }
  return null;
}

function slimRaw(raw: unknown): Json {
  if (raw == null) return null;
  try {
    const json = JSON.stringify(raw);
    if (json.length <= 8000) return raw as Json;
    return { truncated: true, preview: json.slice(0, 4000) };
  } catch {
    return null;
  }
}

type ServerClient = Awaited<ReturnType<typeof createClient>>;
type OpportunitySource = Database["public"]["Enums"]["opportunity_source_type"];

export async function persistOpportunities(
  supabase: ServerClient,
  userId: string,
  source: OpportunitySource,
  items: NormalizedOpportunity[],
  options?: { matchingService?: string | null; keywords?: string[]; freshnessHours?: number },
) {
  let stored = 0;
  const errors: string[] = [];

  for (const item of items) {
    const hash = item.contentHash;
    if (!hash) {
      errors.push(`Skipped "${item.title}" because it had no content hash`);
      continue;
    }

    let websiteId: string | null = null;
    if (item.domain && (source === "website_discovery" || source === "apollo")) {
      const { data: website, error: websiteError } = await supabase
        .from("websites")
        .upsert(
          {
            user_id: userId,
            domain: item.domain,
            normalized_url: item.normalizedUrl ?? item.domain,
            url: item.sourceUrl ?? `https://${item.domain}`,
            title: item.title,
            business_name: item.companyName ?? item.domain,
            industry: item.industry ?? null,
            location: item.location ?? null,
            country: item.location ?? null,
            discovered_at: item.publishedAt ?? new Date().toISOString(),
            last_verified_at: new Date().toISOString(),
            is_demo: false,
          },
          { onConflict: "user_id,domain" },
        )
        .select("id")
        .maybeSingle();
      if (websiteError) errors.push(`${item.domain}: ${websiteError.message}`);
      websiteId = website?.id ?? null;
    }

    const score = heuristicScore(item, options?.keywords);
    const phone = publicPhone(item.raw);
    const row = {
      user_id: userId,
      website_id: websiteId,
      title: item.title.slice(0, 300),
      company_name: item.companyName ?? null,
      person_name: item.personName ?? null,
      source,
      source_id: item.sourceId ?? null,
      source_url: item.sourceUrl ?? null,
      normalized_url: item.normalizedUrl ?? null,
      domain: item.domain ?? null,
      content_hash: hash,
      industry: item.industry ?? null,
      location: item.location ?? null,
      estimated_need: item.estimatedNeed ?? null,
      matching_service: options?.matchingService ?? null,
      opportunity_score: score,
      score_explanation: scoreExplanation(item, score) as Json,
      contact_available: Boolean(phone),
      discovered_at: item.publishedAt ?? new Date().toISOString(),
      published_at: item.publishedAt ?? null,
      last_verified_at: new Date().toISOString(),
      freshness_status: freshnessFromDate(item.publishedAt, options?.freshnessHours ?? 48),
      status: "new" as const,
      is_demo: false,
      raw_payload: slimRaw(item.raw),
    };

    const { data: opportunity, error } = await supabase
      .from("opportunities")
      .upsert(row, { onConflict: "user_id,content_hash" })
      .select("id")
      .maybeSingle();

    let saved = opportunity;
    if (error || !saved) {
      const { data: inserted, error: insertError } = await supabase
        .from("opportunities")
        .insert(row)
        .select("id")
        .maybeSingle();
      if (insertError || !inserted) {
        if (insertError?.code === "23505" || insertError?.message?.toLowerCase().includes("duplicate")) {
          stored += 1;
          continue;
        }
        errors.push(`${item.title}: ${error?.message ?? insertError?.message ?? "could not save"}`);
        continue;
      }
      saved = inserted;
    }

    stored += 1;

    if (phone) {
      const { data: existingContact } = await supabase
        .from("contacts")
        .select("id")
        .eq("opportunity_id", saved.id)
        .maybeSingle();
      if (!existingContact) {
        await supabase.from("contacts").insert({
          user_id: userId,
          opportunity_id: saved.id,
          website_id: websiteId,
          business_name: item.companyName ?? null,
          phone,
          website: item.sourceUrl ?? null,
          source_reference: source,
          verification_status: "unverified",
        });
      }
    }
  }

  return { stored, errors };
}

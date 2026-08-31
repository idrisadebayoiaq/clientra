"use server";

import { discoverJobs, discoverWebsites } from "@/app/(app)/discover/actions";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { extractDomain, normalizeUrl } from "@/lib/utils";
import { contentHash } from "@/lib/opportunities/hash";
import {
  fetchUnseenPlaces,
  getSearchSession,
  getSeenPlaceIds,
  localSearchKey,
  markPlacesSeen,
  saveSearchSession,
} from "@/lib/opportunities/google-places-session";
import { persistLocalBusinessBatch } from "@/lib/opportunities/persist-local-business";
import { isGoogleMapsConfigured, isOpenRouterConfigured } from "@/lib/env";
import { enrichLocalBusinessInsights } from "@/lib/ai";
import { saveOpportunity } from "@/app/(app)/discover/actions";
import { revalidatePath } from "next/cache";

function parseAiJson<T>(raw: string): T | null {
  const trimmed = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    return null;
  }
}

export async function discoverWebsitesAction() {
  return discoverWebsites();
}

export { discoverJobs, discoverWebsites };

export async function findLocalOpportunities(input: {
  category: string;
  location: string;
  refresh?: boolean;
}) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return { ok: false as const, error: "Sign in required" };

  const category = input.category.trim();
  const location = input.location.trim();
  if (!category) return { ok: false as const, error: "Enter a business category" };
  if (!location) return { ok: false as const, error: "Enter a country, city, or address" };
  if (!isGoogleMapsConfigured()) {
    return {
      ok: false as const,
      error: "Google Maps API is not configured. Add GOOGLE_MAPS_API_KEY in Integrations.",
    };
  }

  const searchKey = localSearchKey(category, location);
  const seenIds = await getSeenPlaceIds(supabase, user.id);

  let startPageToken: string | undefined;
  if (input.refresh) {
    const session = await getSearchSession(supabase, user.id, searchKey);
    if (!session?.next_page_token) {
      return {
        ok: false as const,
        error: "No more new results for this search. Try a different category or location.",
      };
    }
    startPageToken = session.next_page_token;
  }

  const { places, nextPageToken, error } = await fetchUnseenPlaces(category, location, seenIds, {
    pageToken: startPageToken,
    maxResults: 20,
  });
  if (error) return { ok: false as const, error };
  if (!places.length) {
    return {
      ok: false as const,
      error: "No new businesses found. Try a different category or location.",
    };
  }

  const batchId = `${Date.now()}`;
  let { results, errors } = await persistLocalBusinessBatch(supabase, user.id, places, {
    category,
    location,
    batchId,
  });

  await markPlacesSeen(
    supabase,
    user.id,
    places.map((place) => place.placeId),
  );
  await saveSearchSession(supabase, user.id, {
    searchKey,
    category,
    location,
    nextPageToken,
    lastBatchId: batchId,
  });

  if (isOpenRouterConfigured()) {
    const enriched = await Promise.allSettled(
      results.map(async (item) => {
        const ai = await enrichLocalBusinessInsights(
          JSON.stringify({
            name: item.place.name,
            category,
            location: item.place.address ?? location,
            phone: item.place.phone,
            website: item.place.website,
            rating: item.place.rating,
            reviewCount: item.place.reviewCount,
            types: item.place.types,
          }),
        );
        if (!ai) return item;
        const parsed = parseAiJson<{
          insights?: string[];
          recommendedService?: string;
          opportunityScore?: number;
          pitchAngles?: { angle?: string; evidence?: string; service?: string }[];
        }>(ai);
        if (!parsed) return item;
          const insights = parsed.insights?.filter(Boolean).slice(0, 4);
          const pitchAngles = (parsed.pitchAngles ?? [])
            .filter((row) => row?.angle)
            .slice(0, 4)
            .map((row) => ({
              angle: row.angle!,
              evidence: row.evidence,
              service: row.service,
            }));
          const score =
            typeof parsed.opportunityScore === "number"
              ? Math.max(15, Math.min(98, Math.round(parsed.opportunityScore)))
              : item.score;
          if (insights?.length || parsed.recommendedService || pitchAngles.length) {
            await supabase
              .from("opportunities")
              .update({
                opportunity_score: score,
                estimated_need: parsed.recommendedService ?? item.recommendedService,
                score_explanation: {
                  method: "local_business_ai",
                  insights: insights?.length ? insights : item.insights,
                  recommendedService: parsed.recommendedService ?? item.recommendedService,
                  pitchAngles,
                  websiteStatus: item.websiteStatus,
                  batchId,
                  searchCategory: category,
                  searchLocation: location,
                },
              })
              .eq("id", item.opportunityId);
            return {
              ...item,
              score,
              insights: insights?.length ? insights : item.insights,
              recommendedService: parsed.recommendedService ?? item.recommendedService,
            };
          }
        return item;
      }),
    );
    results = enriched.map((entry, index) =>
      entry.status === "fulfilled" ? entry.value : results[index],
    );
  }

  revalidatePath("/websites");
  return {
    ok: true as const,
    batchId,
    category,
    location,
    results,
    nextPageToken,
    hasMore: Boolean(nextPageToken),
    errors,
  };
}

export async function refreshLocalOpportunities(input: { category: string; location: string }) {
  return findLocalOpportunities({ ...input, refresh: true });
}

export async function saveLocalBusinessLead(opportunityId: string) {
  const result = await saveOpportunity(opportunityId);
  if (result.ok) {
    revalidatePath("/saved-leads");
    revalidatePath("/websites");
    revalidatePath("/leads");
  }
  return result;
}

export async function importWebsiteForAnalysis(rawUrl: string) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return { ok: false as const, error: "Sign in required" };

  const trimmed = rawUrl.trim();
  if (!trimmed) return { ok: false as const, error: "Enter a website URL" };

  const domain = extractDomain(trimmed);
  if (!domain || !domain.includes(".")) {
    return { ok: false as const, error: "Enter a valid website such as example.com" };
  }

  const url = normalizeUrl(trimmed.startsWith("http") ? trimmed : `https://${domain}`);

  const { data: website, error: websiteError } = await supabase
    .from("websites")
    .upsert(
      {
        user_id: user.id,
        domain,
        normalized_url: url,
        url,
        title: domain,
        business_name: domain,
        discovered_at: new Date().toISOString(),
        last_verified_at: new Date().toISOString(),
        is_demo: false,
      },
      { onConflict: "user_id,domain" },
    )
    .select("id")
    .maybeSingle();

  if (websiteError || !website) {
    return { ok: false as const, error: websiteError?.message ?? "Could not save that website" };
  }

  await supabase.from("opportunities").upsert(
    {
      user_id: user.id,
      website_id: website.id,
      title: domain,
      company_name: domain,
      source: "manual",
      source_url: url,
      normalized_url: url,
      domain,
      content_hash: contentHash(`manual:${user.id}:${domain}`),
      discovered_at: new Date().toISOString(),
      last_verified_at: new Date().toISOString(),
      freshness_status: "NEW",
      status: "new",
      is_demo: false,
    },
    { onConflict: "user_id,content_hash" },
  );

  revalidatePath("/websites");
  revalidatePath("/analyze");
  revalidatePath("/discover");
  return { ok: true as const, websiteId: website.id };
}

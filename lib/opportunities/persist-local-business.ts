import type { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";
import { contentHash } from "@/lib/opportunities/hash";
import {
  type GooglePlaceBusiness,
  placeDomain,
} from "@/lib/opportunities/google-places";
import { scoreLocalBusiness } from "@/lib/opportunities/local-business-score";
import { getUserTargeting } from "@/lib/opportunities/targeting";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export type PersistedLocalBusiness = {
  opportunityId: string;
  websiteId: string;
  place: GooglePlaceBusiness;
  score: number;
  insights: string[];
  recommendedService: string;
  websiteStatus: "missing" | "present";
  savedStatus: "new" | "saved";
};

export async function persistLocalBusinessBatch(
  supabase: ServerClient,
  userId: string,
  places: GooglePlaceBusiness[],
  context: { category: string; location: string; batchId: string },
): Promise<{ results: PersistedLocalBusiness[]; errors: string[] }> {
  const targeting = await getUserTargeting(supabase, userId);
  const results: PersistedLocalBusiness[] = [];
  const errors: string[] = [];

  for (const place of places) {
    const hash = contentHash(`google_places:${place.placeId}`);
    const domain = placeDomain(place.placeId, place.website);
    const url =
      place.website ??
      place.googleMapsUrl ??
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.placeId}`;
    const scoring = scoreLocalBusiness(place, {
      matchingService: targeting.matchingService,
      searchCategory: context.category,
    });

    const { data: website, error: websiteError } = await supabase
      .from("websites")
      .upsert(
        {
          user_id: userId,
          domain,
          normalized_url: url,
          url,
          title: place.name,
          business_name: place.name,
          business_type: place.categoryLabel,
          industry: context.category,
          location: place.address,
          country: context.location,
          has_email: false,
          has_social: false,
          discovered_at: new Date().toISOString(),
          last_verified_at: new Date().toISOString(),
          is_demo: false,
        },
        { onConflict: "user_id,domain" },
      )
      .select("id")
      .maybeSingle();

    if (websiteError || !website) {
      errors.push(`${place.name}: ${websiteError?.message ?? "could not save website"}`);
      continue;
    }

    const scoreExplanation = {
      method: "local_business",
      insights: scoring.insights,
      recommendedService: scoring.recommendedService,
      websiteStatus: scoring.websiteStatus,
      batchId: context.batchId,
      searchCategory: context.category,
      searchLocation: context.location,
      rating: place.rating,
      reviewCount: place.reviewCount,
      googleMapsUrl: place.googleMapsUrl,
      types: place.types,
    };

    const opportunityRow = {
      user_id: userId,
      website_id: website.id,
      title: place.name,
      company_name: place.name,
      source: "google_places" as const,
      source_id: place.placeId,
      source_url: place.googleMapsUrl ?? url,
      normalized_url: place.website ?? url,
      domain,
      content_hash: hash,
      industry: context.category,
      location: place.address ?? context.location,
      estimated_need: scoring.recommendedService,
      matching_service: targeting.matchingService,
      opportunity_score: scoring.score,
      score_explanation: scoreExplanation as Json,
      contact_available: Boolean(place.phone),
      discovered_at: new Date().toISOString(),
      last_verified_at: new Date().toISOString(),
      freshness_status: "NEW" as const,
      status: "new" as const,
      is_demo: false,
      raw_payload: {
        batchId: context.batchId,
        searchCategory: context.category,
        searchLocation: context.location,
        place,
      } as Json,
    };

    const { data: existing } = await supabase
      .from("opportunities")
      .select("id, status")
      .eq("user_id", userId)
      .eq("content_hash", hash)
      .maybeSingle();

    let opportunityId = existing?.id;
    let savedStatus: "new" | "saved" = existing?.status === "saved" ? "saved" : "new";

    if (existing) {
      await supabase
        .from("opportunities")
        .update({
          opportunity_score: scoring.score,
          score_explanation: scoreExplanation as Json,
          estimated_need: scoring.recommendedService,
          last_verified_at: new Date().toISOString(),
          raw_payload: opportunityRow.raw_payload,
        })
        .eq("id", existing.id);
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("opportunities")
        .insert(opportunityRow)
        .select("id, status")
        .maybeSingle();
      if (insertError || !inserted) {
        errors.push(`${place.name}: ${insertError?.message ?? "could not save opportunity"}`);
        continue;
      }
      opportunityId = inserted.id;
      savedStatus = inserted.status === "saved" ? "saved" : "new";
    }

    if (!opportunityId) continue;

    if (place.phone) {
      const { data: existingContact } = await supabase
        .from("contacts")
        .select("id")
        .eq("opportunity_id", opportunityId)
        .maybeSingle();

      const contactRow = {
        user_id: userId,
        opportunity_id: opportunityId,
        website_id: website.id,
        business_name: place.name,
        phone: place.phone,
        website: place.website,
        location: place.address,
        source_reference: "google_places",
        verification_status: "unverified" as const,
        notes: "Phone from Google Business Profile",
      };

      if (existingContact) {
        await supabase.from("contacts").update(contactRow).eq("id", existingContact.id);
      } else {
        await supabase.from("contacts").insert(contactRow);
      }
    }

    results.push({
      opportunityId,
      websiteId: website.id,
      place,
      score: scoring.score,
      insights: scoring.insights,
      recommendedService: scoring.recommendedService,
      websiteStatus: scoring.websiteStatus,
      savedStatus,
    });
  }

  return { results, errors };
}

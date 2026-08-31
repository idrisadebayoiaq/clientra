import type { createClient } from "@/lib/supabase/server";
import { contentHash } from "@/lib/opportunities/hash";
import {
  searchGooglePlaces,
  type GooglePlaceBusiness,
} from "@/lib/opportunities/google-places";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export function localSearchKey(category: string, location: string) {
  return contentHash(`local:${category.trim().toLowerCase()}:${location.trim().toLowerCase()}`);
}

export async function getSeenPlaceIds(supabase: ServerClient, userId: string) {
  const { data } = await supabase.from("google_places_seen").select("place_id").eq("user_id", userId);
  return new Set((data ?? []).map((row) => row.place_id));
}

export async function markPlacesSeen(
  supabase: ServerClient,
  userId: string,
  placeIds: string[],
) {
  if (!placeIds.length) return;
  await supabase.from("google_places_seen").upsert(
    placeIds.map((placeId) => ({ user_id: userId, place_id: placeId })),
    { onConflict: "user_id,place_id", ignoreDuplicates: true },
  );
}

export async function getSearchSession(
  supabase: ServerClient,
  userId: string,
  searchKey: string,
) {
  const { data } = await supabase
    .from("google_places_search_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("search_key", searchKey)
    .maybeSingle();
  return data;
}

export async function saveSearchSession(
  supabase: ServerClient,
  userId: string,
  input: {
    searchKey: string;
    category: string;
    location: string;
    nextPageToken: string | null;
    lastBatchId: string;
  },
) {
  await supabase.from("google_places_search_sessions").upsert(
    {
      user_id: userId,
      search_key: input.searchKey,
      category: input.category,
      location: input.location,
      next_page_token: input.nextPageToken,
      last_batch_id: input.lastBatchId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,search_key" },
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchUnseenPlaces(
  category: string,
  location: string,
  seenIds: Set<string>,
  options?: { pageToken?: string | null; maxResults?: number },
): Promise<{
  places: GooglePlaceBusiness[];
  nextPageToken: string | null;
  error?: string;
}> {
  const maxResults = options?.maxResults ?? 20;
  const collected: GooglePlaceBusiness[] = [];
  const collectedIds = new Set<string>();
  let pageToken = options?.pageToken ?? undefined;
  let nextPageToken: string | null = null;
  let pagesFetched = 0;

  while (collected.length < maxResults && pagesFetched < 6) {
    if (pagesFetched > 0 && pageToken) {
      await sleep(2100);
    }

    const response = await searchGooglePlaces(category, location, {
      maxResults: 20,
      pageToken,
    });
    if (response.error) {
      return {
        places: collected,
        nextPageToken,
        error: collected.length ? undefined : response.error,
      };
    }

    nextPageToken = response.nextPageToken;
    pagesFetched += 1;

    for (const place of response.places) {
      if (seenIds.has(place.placeId) || collectedIds.has(place.placeId)) continue;
      collected.push(place);
      collectedIds.add(place.placeId);
      if (collected.length >= maxResults) break;
    }

    if (!nextPageToken || collected.length >= maxResults) break;
    pageToken = nextPageToken;
  }

  if (!collected.length) {
    return {
      places: [],
      nextPageToken,
      error: nextPageToken
        ? "No new businesses found on this page. Try again in a moment."
        : "No new businesses found. Try a different category or location.",
    };
  }

  return { places: collected, nextPageToken };
}

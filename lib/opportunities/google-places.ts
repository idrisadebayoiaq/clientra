import { getServerEnv } from "@/lib/env";
import { extractDomain } from "@/lib/utils";

export type GooglePlaceBusiness = {
  placeId: string;
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  googleMapsUrl: string | null;
  rating: number | null;
  reviewCount: number | null;
  types: string[];
  businessStatus: string | null;
  categoryLabel: string | null;
};

type PlacesSearchResponse = {
  places?: Array<Record<string, unknown>>;
  nextPageToken?: string;
};

function asString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value && typeof value === "object" && "text" in value) {
    const text = (value as { text?: unknown }).text;
    if (typeof text === "string" && text.trim()) return text.trim();
  }
  return null;
}

function formatCategory(types: string[], fallback: string) {
  const skip = new Set(["point_of_interest", "establishment", "store", "finance"]);
  const primary = types.find((type) => !skip.has(type));
  if (!primary) return fallback;
  return primary.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizePlace(raw: Record<string, unknown>, searchCategory: string): GooglePlaceBusiness | null {
  const placeId = asString(raw.id) ?? asString(raw.name)?.replace(/^places\//, "");
  const displayName = raw.displayName as { text?: string } | undefined;
  const name = displayName?.text ?? asString(raw.displayName);
  if (!placeId || !name) return null;

  const types = Array.isArray(raw.types)
    ? raw.types.filter((value): value is string => typeof value === "string")
    : [];

  return {
    placeId: placeId.replace(/^places\//, ""),
    name,
    address: asString(raw.formattedAddress),
    phone: asString(raw.nationalPhoneNumber) ?? asString(raw.internationalPhoneNumber),
    website: asString(raw.websiteUri),
    googleMapsUrl: asString(raw.googleMapsUri),
    rating: typeof raw.rating === "number" ? raw.rating : null,
    reviewCount: typeof raw.userRatingCount === "number" ? raw.userRatingCount : null,
    types,
    businessStatus: asString(raw.businessStatus),
    categoryLabel: formatCategory(types, searchCategory),
  };
}

export function placeDomain(placeId: string, website: string | null | undefined) {
  if (website) {
    const domain = extractDomain(website);
    if (domain && domain.includes(".")) return domain;
  }
  const safeId = placeId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48) || "unknown";
  return `place-${safeId}.localbiz`;
}

export function phoneDigits(phone: string | null | undefined) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 8 ? digits : null;
}

export function whatsAppUrl(phone: string | null | undefined) {
  const digits = phoneDigits(phone);
  return digits ? `https://wa.me/${digits}` : null;
}

export async function searchGooglePlaces(
  category: string,
  location: string,
  options?: { maxResults?: number; pageToken?: string },
): Promise<{ places: GooglePlaceBusiness[]; nextPageToken: string | null; error?: string }> {
  const apiKey = getServerEnv().googleMapsApiKey;
  if (!apiKey) {
    return { places: [], nextPageToken: null, error: "Google Maps API key is not configured" };
  }

  const maxResults = Math.min(options?.maxResults ?? 20, 20);
  const textQuery = `${category.trim()} in ${location.trim()}`;

  const body: Record<string, unknown> = {
    textQuery,
    maxResultCount: maxResults,
    languageCode: "en",
  };
  if (options?.pageToken) body.pageToken = options.pageToken;

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.nationalPhoneNumber",
        "places.internationalPhoneNumber",
        "places.websiteUri",
        "places.googleMapsUri",
        "places.rating",
        "places.userRatingCount",
        "places.types",
        "places.businessStatus",
        "nextPageToken",
      ].join(","),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    const { formatGooglePlacesError } = await import("@/lib/opportunities/places-errors");
    return {
      places: [],
      nextPageToken: null,
      error: formatGooglePlacesError(response.status, detail),
    };
  }

  const payload = (await response.json()) as PlacesSearchResponse;
  const places = (payload.places ?? [])
    .map((place) => normalizePlace(place, category))
    .filter((place): place is GooglePlaceBusiness => Boolean(place));

  return {
    places,
    nextPageToken: payload.nextPageToken ?? null,
  };
}

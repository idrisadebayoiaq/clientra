import { SERVICES } from "@/lib/constants";
import type { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

const SERVICE_KEYWORDS: Record<string, string[]> = {
  full_stack: ["full stack developer", "web developer", "software engineer"],
  frontend: ["frontend developer", "react developer", "next.js"],
  backend: ["backend developer", "api developer"],
  mobile: ["mobile app developer", "ios android"],
  ui_ux: ["ui ux designer", "product designer"],
  website: ["website developer", "web design", "wordpress"],
  ecommerce: ["shopify", "woocommerce", "ecommerce website"],
  seo: ["seo specialist", "search engine optimization"],
  digital_marketing: ["digital marketing", "paid ads", "email marketing"],
  automation: ["automation", "zapier", "workflow"],
  ai_integration: ["ai integration", "chatgpt", "llm"],
  branding: ["branding", "brand identity"],
  graphic_design: ["graphic designer", "visual design"],
  copywriting: ["copywriter", "website copy"],
  video_editing: ["video editor", "video production"],
  other: ["freelancer", "consultant"],
};

const ADZUNA_COUNTRY_MAP: Record<string, string> = {
  uk: "gb",
  gb: "gb",
  "united kingdom": "gb",
  england: "gb",
  us: "us",
  usa: "us",
  "united states": "us",
  "united states of america": "us",
  au: "au",
  australia: "au",
  ca: "ca",
  canada: "ca",
  de: "de",
  germany: "de",
  fr: "fr",
  france: "fr",
  in: "in",
  india: "in",
  nl: "nl",
  netherlands: "nl",
  ie: "ie",
  ireland: "ie",
  za: "za",
  "south africa": "za",
  sg: "sg",
  singapore: "sg",
  nz: "nz",
  "new zealand": "nz",
};

export type UserTargeting = {
  keywords: string[];
  serviceLabels: string[];
  matchingService: string | null;
  countries: string[];
  adzunaCountries: string[];
  cities: string[];
  worldwide: boolean;
  freshnessHours: number;
};

export async function getUserTargeting(supabase: ServerClient, userId: string): Promise<UserTargeting> {
  const [{ data: services }, { data: prefs }] = await Promise.all([
    supabase.from("user_services").select("service_key, custom_label").eq("user_id", userId),
    supabase.from("user_preferences").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  const serviceLabels = (services ?? []).map((row) => {
    if (row.custom_label) return row.custom_label;
    return SERVICES.find((item) => item.key === row.service_key)?.label ?? row.service_key;
  });

  const keywords = Array.from(
    new Set(
      (services ?? []).flatMap((row) => {
        if (row.custom_label) return [row.custom_label];
        return SERVICE_KEYWORDS[row.service_key] ?? [row.service_key.replace(/_/g, " ")];
      }),
    ),
  );

  const countries = prefs?.target_countries ?? [];
  const adzunaCountries = Array.from(
    new Set(
      countries
        .map((country) => ADZUNA_COUNTRY_MAP[country.trim().toLowerCase()])
        .filter((value): value is string => Boolean(value)),
    ),
  );

  return {
    keywords: keywords.length ? keywords : ["website developer", "shopify", "seo"],
    serviceLabels,
    matchingService: serviceLabels[0] ?? null,
    countries,
    adzunaCountries: adzunaCountries.length ? adzunaCountries : ["us", "gb"],
    cities: prefs?.target_cities ?? [],
    worldwide: prefs?.target_worldwide ?? true,
    freshnessHours: prefs?.freshness_hours ?? 48,
  };
}

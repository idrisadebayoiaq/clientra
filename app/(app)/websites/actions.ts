"use server";

import { discoverJobs, discoverWebsites } from "@/app/(app)/discover/actions";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { extractDomain, normalizeUrl } from "@/lib/utils";
import { contentHash } from "@/lib/opportunities/hash";
import { revalidatePath } from "next/cache";

export async function discoverWebsitesAction() {
  return discoverWebsites();
}

export { discoverJobs, discoverWebsites };

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
      title: `Analyze ${domain}`,
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

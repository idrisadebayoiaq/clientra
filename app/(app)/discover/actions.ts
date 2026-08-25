"use server";

import { revalidatePath } from "next/cache";
import {
  adzunaAdapter,
  apolloAdapter,
  problemPostsAdapter,
  websiteDiscoveryAdapter,
} from "@/lib/opportunities";
import { persistOpportunities } from "@/lib/opportunities/persist";
import { getUserTargeting } from "@/lib/opportunities/targeting";
import { SourceNotConfiguredError } from "@/lib/opportunities/types";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type OpportunitySource = Database["public"]["Enums"]["opportunity_source_type"];

function revalidateDiscovery() {
  revalidatePath("/discover");
  revalidatePath("/websites");
  revalidatePath("/jobs");
  revalidatePath("/problems");
  revalidatePath("/dashboard");
  revalidatePath("/leads");
  revalidatePath("/crm");
}

async function runDiscovery(kind: OpportunitySource) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return { ok: false as const, error: "Sign in required", count: 0 };

  const targeting = await getUserTargeting(supabase, user.id);
  const options = {
    keywords: targeting.keywords,
    countries: targeting.countries,
    adzunaCountries: targeting.adzunaCountries,
    cities: targeting.cities,
    worldwide: targeting.worldwide,
    freshnessHours: targeting.freshnessHours,
  };

  try {
    const items =
      kind === "website_discovery"
        ? await websiteDiscoveryAdapter.discover(options)
        : kind === "job"
          ? await adzunaAdapter.discover(options)
          : kind === "apollo"
            ? await apolloAdapter.discover(options)
          : kind === "problem_post"
            ? await problemPostsAdapter.discover(options)
            : [];

    const { stored, errors } = await persistOpportunities(supabase, user.id, kind, items, {
      matchingService: targeting.matchingService,
      keywords: targeting.keywords,
      freshnessHours: targeting.freshnessHours,
    });
    revalidateDiscovery();
    if (!stored && errors.length) {
      return { ok: false as const, error: errors[0], count: 0 };
    }
    return { ok: true as const, count: stored, warning: errors[0] };
  } catch (error) {
    if (error instanceof SourceNotConfiguredError) {
      return { ok: false as const, error: `${error.source} is not configured`, count: 0 };
    }
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Discovery request failed",
      count: 0,
    };
  }
}

export async function discoverWebsites() {
  return runDiscovery("website_discovery");
}

export async function discoverJobs() {
  return runDiscovery("job");
}

export async function discoverApolloCompanies() {
  return runDiscovery("apollo");
}

export async function discoverProblemPosts() {
  return runDiscovery("problem_post");
}

export async function discoverConfiguredSources() {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return { ok: false as const, error: "Sign in required", count: 0 };

  const results = await Promise.all([
    websiteDiscoveryAdapter.configured() ? runDiscovery("website_discovery") : null,
    adzunaAdapter.configured() ? runDiscovery("job") : null,
    apolloAdapter.configured() ? runDiscovery("apollo") : null,
    problemPostsAdapter.configured() ? runDiscovery("problem_post") : null,
  ]);
  const usable = results.filter((result): result is NonNullable<typeof result> => Boolean(result));
  const count = usable.reduce((sum, result) => sum + (result.ok ? result.count : 0), 0);
  const error = usable.find((result) => !result.ok)?.error ?? null;

  await supabase.from("user_preferences").upsert(
    {
      user_id: user.id,
      last_discovery_at: new Date().toISOString(),
      last_discovery_count: count,
      last_discovery_error: count ? null : error,
    },
    { onConflict: "user_id" },
  );

  if (!usable.length) {
    return { ok: false as const, error: "No discovery providers are configured", count: 0 };
  }
  if (!count && error) {
    return { ok: false as const, error, count: 0 };
  }
  return { ok: true as const, count, warning: count ? error ?? undefined : undefined };
}

export async function ensureUserDiscovery() {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return { ok: false as const, error: "Sign in required", count: 0 };

  const [{ count }, prefs] = await Promise.all([
    supabase.from("opportunities").select("id", { count: "exact", head: true }),
    supabase
      .from("user_preferences")
      .select("last_discovery_at")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if ((count ?? 0) > 0) {
    return { ok: true as const, count: count ?? 0 };
  }

  const last = prefs.data?.last_discovery_at;
  if (last && Date.now() - new Date(last).getTime() < 10 * 60 * 1000) {
    return { ok: true as const, count: 0 };
  }

  return discoverConfiguredSources();
}

export async function saveOpportunity(opportunityId: string) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return { ok: false as const, error: "Sign in required" };

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("*")
    .eq("id", opportunityId)
    .maybeSingle();
  if (!opportunity) return { ok: false as const, error: "Opportunity not found" };

  await supabase.from("saved_opportunities").upsert(
    { user_id: user.id, opportunity_id: opportunityId },
    { onConflict: "user_id,opportunity_id" },
  );
  await supabase.from("opportunities").update({ status: "saved" }).eq("id", opportunityId);

  const { data: existing } = await supabase
    .from("leads")
    .select("id")
    .eq("opportunity_id", opportunityId)
    .maybeSingle();
  if (!existing) {
    await supabase.from("leads").insert({
      user_id: user.id,
      opportunity_id: opportunityId,
      website_id: opportunity.website_id,
      website_url: opportunity.source_url ?? (opportunity.domain ? `https://${opportunity.domain}` : null),
      company_name: opportunity.company_name,
      opportunity_source: opportunity.source,
      score: opportunity.opportunity_score,
      status: "new",
      is_demo: false,
    });
  }

  revalidateDiscovery();
  return { ok: true as const };
}

export async function saveOpportunityForm(opportunityId: string) {
  await saveOpportunity(opportunityId);
}

export async function ignoreOpportunity(opportunityId: string) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return { ok: false as const, error: "Sign in required" };
  await supabase.from("opportunities").update({ status: "ignored" }).eq("id", opportunityId);
  revalidateDiscovery();
  return { ok: true as const };
}

export async function ignoreOpportunityForm(opportunityId: string) {
  await ignoreOpportunity(opportunityId);
}

export async function saveWebsiteAsLead(websiteId: string) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return { ok: false as const, error: "Sign in required" };

  const { data: website } = await supabase.from("websites").select("*").eq("id", websiteId).maybeSingle();
  if (!website) return { ok: false as const, error: "Website not found" };

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("id")
    .eq("website_id", websiteId)
    .maybeSingle();
  if (opportunity) {
    return saveOpportunity(opportunity.id);
  }

  await supabase.from("leads").insert({
    user_id: user.id,
    website_id: websiteId,
    website_url: website.url,
    company_name: website.business_name,
    opportunity_source: "website_discovery",
    status: "new",
    is_demo: false,
  });
  revalidateDiscovery();
  return { ok: true as const };
}

"use server";

import { revalidatePath } from "next/cache";
import { adzunaAdapter, apolloAdapter, websiteDiscoveryAdapter } from "@/lib/opportunities";
import { persistOpportunities } from "@/lib/opportunities/persist";
import { getUserTargeting } from "@/lib/opportunities/targeting";
import { SourceNotConfiguredError } from "@/lib/opportunities/types";
import { getAuthenticatedUser } from "@/lib/supabase/server";

function revalidateDiscovery() {
  revalidatePath("/discover");
  revalidatePath("/websites");
  revalidatePath("/jobs");
  revalidatePath("/dashboard");
  revalidatePath("/leads");
  revalidatePath("/crm");
}

async function runDiscovery(
  kind: "website_discovery" | "job" | "apollo",
) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return { ok: false as const, error: "Sign in required" };

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
          : await apolloAdapter.discover(options);

    const stored = await persistOpportunities(supabase, user.id, kind, items, {
      matchingService: targeting.matchingService,
      keywords: targeting.keywords,
      freshnessHours: targeting.freshnessHours,
    });
    revalidateDiscovery();
    return { ok: true as const, count: stored };
  } catch (error) {
    if (error instanceof SourceNotConfiguredError) {
      return { ok: false as const, error: `${error.source} is not configured` };
    }
    return { ok: false as const, error: "Discovery request failed" };
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

export async function discoverConfiguredSources() {
  const { user } = await getAuthenticatedUser();
  if (!user) return { ok: false as const, error: "Sign in required" };

  const results = await Promise.all([
    websiteDiscoveryAdapter.configured() ? runDiscovery("website_discovery") : null,
    adzunaAdapter.configured() ? runDiscovery("job") : null,
    apolloAdapter.configured() ? runDiscovery("apollo") : null,
  ]);
  const usable = results.filter((result): result is NonNullable<typeof result> => Boolean(result));
  if (!usable.length) {
    return { ok: false as const, error: "No discovery providers are configured" };
  }
  if (usable.every((result) => !result.ok)) {
    return { ok: false as const, error: usable[0]?.error ?? "Discovery request failed" };
  }
  const count = usable.reduce((sum, result) => sum + (result.ok ? result.count : 0), 0);
  return { ok: true as const, count };
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

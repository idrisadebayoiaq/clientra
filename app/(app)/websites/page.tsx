import { AppPageShell } from "@/components/app/page-shell";
import { FindOpportunityForm } from "@/components/app/find-opportunity-form";
import { LocalBusinessCard } from "@/components/app/local-business-card";
import { RefreshOpportunityResults } from "@/components/app/refresh-opportunity-results";
import { ButtonLink } from "@/components/ui/primitives";
import { isGoogleMapsConfigured } from "@/lib/env";
import {
  getSearchSession,
  localSearchKey,
} from "@/lib/opportunities/google-places-session";
import { mapOpportunityToLocalBusinessCard } from "@/lib/opportunities/map-local-business-card";
import type { LocalBusinessCardData } from "@/components/app/local-business-card";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

type ScoreExplanation = {
  batchId?: string;
};

function asScoreExplanation(value: Json | null): ScoreExplanation {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as ScoreExplanation;
}

export default async function WebsitesPage({
  searchParams,
}: {
  searchParams: Promise<{ batch?: string; category?: string; location?: string }>;
}) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return null;

  const params = await searchParams;
  const configured = isGoogleMapsConfigured();
  let businesses: LocalBusinessCardData[] = [];
  let hasMore = false;

  if (params.batch && params.category && params.location) {
    const searchKey = localSearchKey(params.category, params.location);
    const session = await getSearchSession(supabase, user.id, searchKey);
    hasMore = Boolean(session?.next_page_token);

    const { data: opportunities } = await supabase
      .from("opportunities")
      .select(
        "id, title, opportunity_score, score_explanation, estimated_need, website_id, status, raw_payload, contacts(email, phone, website, notes, verification_status)",
      )
      .eq("user_id", user.id)
      .eq("source", "google_places")
      .order("discovered_at", { ascending: false })
      .limit(40);

    const filtered = (opportunities ?? []).filter((row) => {
      const explanation = asScoreExplanation(row.score_explanation);
      const raw = row.raw_payload as { batchId?: string } | null;
      return explanation.batchId === params.batch || raw?.batchId === params.batch;
    });

    businesses = filtered
      .slice(0, 20)
      .map((row) =>
        mapOpportunityToLocalBusinessCard(row, {
          category: params.category,
          location: params.location,
        }),
      )
      .filter((row): row is NonNullable<typeof row> => Boolean(row));
  }

  return (
    <AppPageShell
      title="Find Opportunity"
      description="Search Google Maps for local businesses by category and location. Results are scored for outreach potential — nothing is listed until you run a search."
    >
      <FindOpportunityForm
        configured={configured}
        initialCategory={params.category ?? ""}
        initialLocation={params.location ?? ""}
      />

      {businesses.length ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-ink-muted">
              Showing {businesses.length} new result{businesses.length === 1 ? "" : "s"}
              {params.category ? ` for ${params.category}` : ""}
              {params.location ? ` in ${params.location}` : ""}.
            </p>
            <div className="flex flex-wrap gap-2">
              <RefreshOpportunityResults
                category={params.category!}
                location={params.location!}
                hasMore={hasMore}
              />
              <ButtonLink href="/saved-leads" size="sm" variant="outline">
                Saved Leads
              </ButtonLink>
            </div>
          </div>
          <div className="grid gap-4">
            {businesses.map((business) => (
              <LocalBusinessCard key={business.opportunityId} business={business} />
            ))}
          </div>
        </div>
      ) : params.batch ? (
        <p className="text-sm text-ink-muted">
          No results for this batch. Run Find Opportunity again or refresh for the next page.
        </p>
      ) : (
        <p className="text-sm text-ink-muted">
          {configured
            ? "Enter a category and location above, then click Find Opportunity to load up to 20 Google Maps businesses."
            : "Add GOOGLE_MAPS_API_KEY on Integrations to search Google Maps for local businesses."}
        </p>
      )}
    </AppPageShell>
  );
}

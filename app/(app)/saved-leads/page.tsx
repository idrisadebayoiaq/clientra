import { AppPageShell } from "@/components/app/page-shell";
import { LocalBusinessCard } from "@/components/app/local-business-card";
import { ButtonLink, Card } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/feedback";
import { mapOpportunityToLocalBusinessCard } from "@/lib/opportunities/map-local-business-card";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export default async function SavedLeadsPage() {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return null;

  const { data: savedRows } = await supabase
    .from("saved_opportunities")
    .select(
      `
      created_at,
      opportunities (
        id,
        title,
        opportunity_score,
        score_explanation,
        estimated_need,
        website_id,
        status,
        raw_payload,
        source,
        contacts (email, phone, website, notes, verification_status)
      )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const businesses = (savedRows ?? [])
    .map((row) => {
      const opportunity = Array.isArray(row.opportunities) ? row.opportunities[0] : row.opportunities;
      if (!opportunity || opportunity.source !== "google_places") return null;
      return mapOpportunityToLocalBusinessCard(
        {
          ...opportunity,
          status: "saved",
        },
        { saved: true },
      );
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  return (
    <AppPageShell
      title="Saved Leads"
      description="Businesses you saved from Find Opportunity. Reach out when you're ready — they're kept here for easy access."
      actions={
        <ButtonLink href="/websites" size="sm" variant="outline">
          Find more opportunities
        </ButtonLink>
      }
    >
      {businesses.length ? (
        <div className="grid gap-4">
          {businesses.map((business) => (
            <LocalBusinessCard key={business.opportunityId} business={business} />
          ))}
        </div>
      ) : (
        <Card className="p-6">
          <EmptyState
            title="No saved leads yet"
            description="When you find a business you want to revisit later, click Save Lead on its card in Find Opportunity."
          />
          <div className="mt-4 flex justify-center">
            <ButtonLink href="/websites">Go to Find Opportunity</ButtonLink>
          </div>
        </Card>
      )}
    </AppPageShell>
  );
}

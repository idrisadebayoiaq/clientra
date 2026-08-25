import { Badge, Button, ButtonLink, Card } from "@/components/ui/primitives";
import { ScoreRing } from "@/components/ui/score-and-tabs";
import { formatRelativeTime } from "@/lib/utils";
import type { Tables } from "@/types/database";
import { saveOpportunityForm, ignoreOpportunityForm } from "@/app/(app)/discover/actions";

export function OpportunityCard({ opportunity }: { opportunity: Tables<"opportunities"> }) {
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold">{opportunity.title}</h3>
            {opportunity.is_demo ? <Badge tone="gold">DEMO</Badge> : null}
            <Badge>{opportunity.freshness_status}</Badge>
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            {opportunity.company_name ?? opportunity.person_name ?? "Unknown"} · {opportunity.source}
            {opportunity.source_url ? ` · ${opportunity.source_url}` : ""}
          </p>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-ink-subtle">Discovered</dt>
              <dd>{formatRelativeTime(opportunity.discovered_at)}</dd>
            </div>
            <div>
              <dt className="text-ink-subtle">Industry / location</dt>
              <dd>
                {opportunity.industry ?? "Unknown"} · {opportunity.location ?? "Unknown"}
              </dd>
            </div>
            <div>
              <dt className="text-ink-subtle">Estimated need</dt>
              <dd>{opportunity.estimated_need ?? "Unable to determine"}</dd>
            </div>
            <div>
              <dt className="text-ink-subtle">Matching service</dt>
              <dd>{opportunity.matching_service ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-ink-subtle">Contact</dt>
              <dd>{opportunity.contact_available ? "Public contact available" : "No public contact stored"}</dd>
            </div>
            <div>
              <dt className="text-ink-subtle">Status</dt>
              <dd className="capitalize">{opportunity.status}</dd>
            </div>
          </dl>
        </div>
        <ScoreRing score={opportunity.opportunity_score} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <ButtonLink href={`/analyze/${opportunity.id}`} size="sm">
          Analyze
        </ButtonLink>
        <form action={saveOpportunityForm.bind(null, opportunity.id)}>
          <Button type="submit" variant="outline" size="sm">
            Save
          </Button>
        </form>
        <ButtonLink href={`/outreach?opportunity=${opportunity.id}`} variant="outline" size="sm">
          Contact
        </ButtonLink>
        <form action={ignoreOpportunityForm.bind(null, opportunity.id)}>
          <Button type="submit" variant="ghost" size="sm">
            Ignore
          </Button>
        </form>
      </div>
    </Card>
  );
}

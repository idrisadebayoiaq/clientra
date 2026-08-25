"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/feedback";
import { Tabs } from "@/components/ui/score-and-tabs";
import { OpportunityCard } from "@/components/app/opportunity-card";
import type { ContactSummary } from "@/components/app/contact-details";
import type { Tables } from "@/types/database";

const TABS = [
  { id: "all", label: "All" },
  { id: "website_discovery", label: "New Websites" },
  { id: "problem_post", label: "Business Problems" },
  { id: "job", label: "Job Opportunities" },
  { id: "apollo", label: "Companies" },
  { id: "high", label: "High Intent" },
  { id: "recommended", label: "Recommended" },
];

type OpportunityWithContacts = Tables<"opportunities"> & {
  contacts?: ContactSummary[] | ContactSummary | null;
};

export default function OpportunityTabs({
  opportunities,
  emptyDescription = "No records in this view yet. Use Discover to import live websites, companies, or jobs.",
}: {
  opportunities: OpportunityWithContacts[];
  emptyDescription?: string;
}) {
  const [tab, setTab] = useState("all");

  const filtered = useMemo(() => {
    if (tab === "all") return opportunities;
    if (tab === "high") return opportunities.filter((item) => (item.opportunity_score ?? 0) >= 80);
    if (tab === "recommended") {
      return opportunities.filter((item) => Boolean(item.matching_service) && item.status !== "ignored");
    }
    return opportunities.filter((item) => item.source === tab);
  }, [opportunities, tab]);

  return (
    <div className="space-y-4">
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      {filtered.length === 0 ? (
        <EmptyState
          title="No opportunities in this view"
          description={emptyDescription}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((opportunity) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </div>
      )}
    </div>
  );
}

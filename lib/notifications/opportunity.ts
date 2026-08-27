import type { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type ServerClient = Awaited<ReturnType<typeof createClient>>;
type OpportunitySource = Database["public"]["Enums"]["opportunity_source_type"];

const SOURCE_HREF: Partial<Record<OpportunitySource, string>> = {
  job: "/jobs",
  website_discovery: "/websites",
  problem_post: "/problems",
  apollo: "/discover",
};

const SOURCE_LABEL: Partial<Record<OpportunitySource, string>> = {
  job: "job",
  website_discovery: "website",
  problem_post: "problem post",
  apollo: "company",
};

export async function notifyNewOpportunities(
  supabase: ServerClient,
  userId: string,
  source: OpportunitySource,
  newCount: number,
  sampleTitles: string[] = [],
) {
  if (newCount <= 0) return;

  const label = SOURCE_LABEL[source] ?? "opportunity";
  const title =
    newCount === 1 && sampleTitles[0]
      ? `New ${label}: ${sampleTitles[0].slice(0, 120)}`
      : `${newCount} new ${newCount === 1 ? label : `${label}s`}`;

  const body =
    newCount === 1
      ? "A fresh match was added to your feed."
      : `${newCount} fresh matches were added to your feed.`;

  await supabase.from("notifications").insert({
    user_id: userId,
    type: "opportunity",
    title,
    body,
    href: SOURCE_HREF[source] ?? "/discover",
    metadata: { source, count: newCount, samples: sampleTitles.slice(0, 3) },
  });
}

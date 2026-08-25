import { AppPageShell } from "@/components/app/page-shell";
import { DiscoverSourceButton } from "@/components/app/discover-source-button";
import { NotConfiguredState } from "@/components/ui/feedback";
import { Card } from "@/components/ui/primitives";
import { runAnalysis } from "@/app/(app)/analyze/actions";
import { isOpenRouterConfigured } from "@/lib/env";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-subtle">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export default async function AnalyzePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return null;

  const { data: website } = await supabase.from("websites").select("*").eq("id", id).maybeSingle();
  const { data: opportunity } = website
    ? await supabase.from("opportunities").select("*").eq("website_id", website.id).maybeSingle()
    : await supabase.from("opportunities").select("*").eq("id", id).maybeSingle();

  const websiteId = website?.id ?? opportunity?.website_id ?? null;
  const { data: analysis } = websiteId
    ? await supabase
        .from("website_analyses")
        .select("*")
        .eq("website_id", websiteId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  let painPoints: Tables<"pain_points">[] = [];
  if (opportunity?.id) {
    const result = await supabase
      .from("pain_points")
      .select("*")
      .eq("opportunity_id", opportunity.id)
      .order("created_at", { ascending: false });
    painPoints = result.data ?? [];
  } else if (analysis?.id) {
    const result = await supabase
      .from("pain_points")
      .select("*")
      .eq("website_analysis_id", analysis.id)
      .order("created_at", { ascending: false });
    painPoints = result.data ?? [];
  }

  const configured = isOpenRouterConfigured();
  const targetId = website?.id ?? opportunity?.id ?? id;

  return (
    <AppPageShell
      title="Analyze Website"
      description="AI analysis workspace. Findings are labeled Detected, Possible, or Unable to determine."
      actions={
        configured ? (
          <DiscoverSourceButton
            action={() => runAnalysis(targetId)}
            label="Run analysis"
            pendingLabel="Analyzing…"
            successLabel="Analysis saved."
          />
        ) : undefined
      }
    >
      {!configured ? (
        <NotConfiguredState
          title="OpenRouter is not configured"
          description="Set OPENROUTER_API_KEY on the server to run analysis. The workspace layout is ready."
        />
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold">Website Overview</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Domain" value={website?.domain ?? opportunity?.domain ?? "Unable to determine"} />
            <Row label="Title" value={website?.title ?? opportunity?.title ?? "Unable to determine"} />
            <Row label="Business type" value={website?.business_type ?? "Unable to determine"} />
            <Row label="Industry" value={website?.industry ?? opportunity?.industry ?? "Unable to determine"} />
            <Row label="Location" value={website?.location ?? opportunity?.location ?? "Unable to determine"} />
            <Row label="Technology" value={website?.technology.join(", ") || "Unable to determine"} />
            <Row
              label="Ecommerce"
              value={website?.is_ecommerce == null ? "Unable to determine" : website.is_ecommerce ? "Yes" : "No"}
            />
          </dl>
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold">Technical Analysis</h2>
          <AnalysisBlock data={analysis?.technical} empty="Performance, accessibility, SEO, and stack checks run only when supporting data exists." />
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold">Business Analysis</h2>
          <AnalysisBlock data={analysis?.business} empty="Business model, audience, and conversion opportunities appear after a successful analysis run." />
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold">Pain Points</h2>
          {painPoints?.length ? (
            <ul className="mt-2 space-y-2 text-sm">
              {painPoints.map((item) => (
                <li key={item.id}>
                    <strong className="capitalize">{item.severity}:</strong> {item.title} ({item.confidence.replace(/_/g, " ")})
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-ink-muted">Ranked Critical / High / Medium / Low after analysis.</p>
          )}
        </Card>
      </div>
    </AppPageShell>
  );
}

function AnalysisBlock({ data, empty }: { data: unknown; empty: string }) {
  if (Array.isArray(data) && data.length) {
    return (
      <ul className="mt-2 space-y-2 text-sm">
        {data.map((item, index) => {
          const row = item as { title?: string; label?: string; evidence?: string };
          return (
            <li key={`${row.title ?? index}`}>
              <p className="font-medium">{row.title ?? "Finding"}</p>
              <p className="text-ink-muted">{row.label ?? "Unable to determine"}{row.evidence ? ` — ${row.evidence}` : ""}</p>
            </li>
          );
        })}
      </ul>
    );
  }
  return <p className="mt-2 text-sm text-ink-muted">{empty}</p>;
}

import { AppPageShell } from "@/components/app/page-shell";
import { AnalyzeWebsiteButton } from "@/components/app/analyze-website-button";
import { NotConfiguredState } from "@/components/ui/feedback";
import { Card } from "@/components/ui/primitives";
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

export const maxDuration = 60;

export default async function AnalyzePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return null;

  const { data: website } = await supabase.from("websites").select("*").eq("id", id).maybeSingle();
  const { data: opportunity } = website
    ? await supabase
        .from("opportunities")
        .select("*")
        .eq("website_id", website.id)
        .order("discovered_at", { ascending: false })
        .limit(1)
        .maybeSingle()
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
  if (analysis?.id) {
    const result = await supabase
      .from("pain_points")
      .select("*")
      .eq("website_analysis_id", analysis.id)
      .order("created_at", { ascending: false });
    painPoints = result.data ?? [];
  } else if (opportunity?.id) {
    const result = await supabase
      .from("pain_points")
      .select("*")
      .eq("opportunity_id", opportunity.id)
      .order("created_at", { ascending: false });
    painPoints = result.data ?? [];
  }

  const configured = isOpenRouterConfigured();
  const targetId = website?.id ?? opportunity?.id ?? id;
  const title = website?.business_name ?? website?.domain ?? opportunity?.title ?? "Website";
  const overview = (analysis?.overview ?? null) as {
    businessType?: string;
    industry?: string;
    label?: string;
    summary?: string;
    evidenceSource?: string;
    evidenceTitle?: string;
    evidenceUrl?: string;
    evidenceNotes?: string[];
  } | null;
  const technology = website?.technology?.length ? website.technology.join(", ") : "Unable to determine";
  const businessType = website?.business_type ?? overview?.businessType ?? "Unable to determine";
  const industry = website?.industry ?? opportunity?.industry ?? overview?.industry ?? "Unable to determine";
  const evidenceLabel =
    overview?.evidenceSource === "html+urlscan"
      ? "Live page + urlscan"
      : overview?.evidenceSource === "urlscan"
        ? "urlscan"
        : overview?.evidenceSource === "html"
          ? "Live page"
          : null;

  if (!website && !opportunity) {
    return (
      <AppPageShell
        title="Analyze Website"
        description="This record was not found in your workspace."
      >
        <Card className="p-5 text-sm text-ink-muted">
          Open Analyze Website from the sidebar and paste a URL, or choose a site from Website Opportunities.
        </Card>
      </AppPageShell>
    );
  }

  return (
    <AppPageShell
      title={`Analyze ${title}`}
      description="AI analysis workspace. Findings are labeled Detected, Possible, or Unable to determine."
      actions={<AnalyzeWebsiteButton targetId={targetId} />}
    >
      {!configured ? (
        <NotConfiguredState
          title="OpenRouter is not configured"
          description="Set OPENROUTER_API_KEY on Vercel Production to add AI commentary. Run analysis still captures the public page and urlscan evidence."
        />
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold">Website Overview</h2>
          {evidenceLabel ? (
            <p className="mt-1 text-xs text-ink-muted">Evidence source: {evidenceLabel}</p>
          ) : (
            <p className="mt-1 text-xs text-ink-muted">Run analysis to capture the live page and urlscan data.</p>
          )}
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Domain" value={website?.domain ?? opportunity?.domain ?? "Unable to determine"} />
            <Row label="Title" value={website?.title ?? opportunity?.title ?? "Unable to determine"} />
            <Row label="Business type" value={businessType} />
            <Row label="Industry" value={industry} />
            <Row label="Location" value={website?.location ?? opportunity?.location ?? "Unable to determine"} />
            <Row label="Technology" value={technology} />
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
                    <strong className="capitalize">{item.severity}:</strong> {item.title} ({(item.confidence ?? "unable_to_determine").replace(/_/g, " ")})
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

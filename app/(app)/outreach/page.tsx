import { AppPageShell } from "@/components/app/page-shell";
import { OutreachComposer } from "@/components/app/outreach-composer";
import { NotConfiguredState } from "@/components/ui/feedback";
import { Card } from "@/components/ui/primitives";
import { isOpenRouterConfigured } from "@/lib/env";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export default async function OutreachPage({
  searchParams,
}: {
  searchParams: Promise<{ opportunity?: string }>;
}) {
  const { opportunity: opportunityId } = await searchParams;
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return null;

  const { data: opportunity } = opportunityId
    ? await supabase.from("opportunities").select("*").eq("id", opportunityId).maybeSingle()
    : { data: null };
  const { data: gmail } = await supabase
    .from("email_accounts")
    .select("status")
    .eq("provider", "gmail")
    .maybeSingle();

  const configured = isOpenRouterConfigured();
  const context = [
    opportunity?.title,
    opportunity?.company_name,
    opportunity?.domain,
    opportunity?.estimated_need,
    opportunity?.matching_service,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <AppPageShell title="Outreach" description="Generate personalized messages. Email sending requires a connected Gmail account. Other channels copy-only.">
      {!configured ? (
        <NotConfiguredState
          title="AI generation not configured"
          description="Set OPENROUTER_API_KEY to generate messages. You can still compose manually."
        />
      ) : null}
      <Card className="p-5">
        {opportunity ? (
          <p className="mb-4 text-sm text-ink-muted">
            Drafting for {opportunity.company_name ?? opportunity.title}
            {opportunity.source_url ? ` · ${opportunity.source_url}` : ""}.
          </p>
        ) : null}
        <OutreachComposer
          opportunityId={opportunity?.id}
          defaultContext={context}
          gmailReady={gmail?.status === "connected"}
        />
      </Card>
    </AppPageShell>
  );
}

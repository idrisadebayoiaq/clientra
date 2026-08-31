import { AppPageShell } from "@/components/app/page-shell";
import { OutreachComposer } from "@/components/app/outreach-composer";
import { NotConfiguredState } from "@/components/ui/feedback";
import { Card } from "@/components/ui/primitives";
import { ensureOpportunityAudited } from "@/app/(app)/analyze/actions";
import { isOpenRouterConfigured } from "@/lib/env";
import { prepareOutreachWorkspace } from "@/lib/outreach/workspace";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function OutreachPage({
  searchParams,
}: {
  searchParams: Promise<{ opportunity?: string; website?: string; refresh?: string; audit?: string }>;
}) {
  const { opportunity: opportunityId, website: websiteId, refresh, audit } = await searchParams;
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return null;

  if (audit === "1" && opportunityId) {
    await ensureOpportunityAudited(opportunityId);
  }

  const { data: opportunity } = opportunityId
    ? await supabase.from("opportunities").select("*").eq("id", opportunityId).maybeSingle()
    : websiteId
      ? await supabase
          .from("opportunities")
          .select("*")
          .eq("website_id", websiteId)
          .order("discovered_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : { data: null };
  const { data: gmail } = await supabase
    .from("email_accounts")
    .select("status")
    .eq("provider", "gmail")
    .maybeSingle();

  const workspace = opportunity
    ? await prepareOutreachWorkspace(supabase, user, opportunity, { forceRefresh: refresh === "1" })
    : null;
  const configured = isOpenRouterConfigured();
  const context = [
    workspace?.companyName ?? opportunity?.company_name,
    opportunity?.domain,
    opportunity?.estimated_need,
    opportunity?.matching_service,
    workspace?.analysisSummary,
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
            {opportunity.source_url ? ` · ${opportunity.source_url}` : ""}
            {workspace?.senderName ? ` · Signing as ${workspace.senderName}` : ""}.
          </p>
        ) : null}
        <OutreachComposer
          key={workspace?.resetKey ?? opportunity?.id ?? websiteId ?? "blank"}
          resetKey={workspace?.resetKey ?? opportunity?.id ?? websiteId ?? "blank"}
          opportunityId={opportunity?.id}
          defaultContext={context}
          defaultTo={workspace?.contact.email ?? undefined}
          defaultSubject={workspace?.subject}
          defaultBody={workspace?.body}
          defaultChannel={workspace?.contact.email ? "email" : workspace?.contact.linkedinUrl ? "linkedin" : "email"}
          senderName={workspace?.senderName}
          contact={
            workspace
              ? {
                  email: workspace.contact.email,
                  phone: workspace.contact.phone,
                  website: workspace.contact.website,
                  full_name: workspace.contact.fullName,
                  business_name: workspace.contact.businessName,
                  notes: [
                    workspace.contact.linkedinUrl ? `linkedin: ${workspace.contact.linkedinUrl}` : null,
                    workspace.contact.facebookUrl ? `facebook: ${workspace.contact.facebookUrl}` : null,
                    workspace.contact.twitterUrl ? `twitter: ${workspace.contact.twitterUrl}` : null,
                  ]
                    .filter(Boolean)
                    .join("\n"),
                  verification_status: "unverified",
                }
              : null
          }
          gmailReady={gmail?.status === "connected"}
        />
      </Card>
    </AppPageShell>
  );
}

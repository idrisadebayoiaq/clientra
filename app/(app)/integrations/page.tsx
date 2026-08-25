import { AppPageShell } from "@/components/app/page-shell";
import { Badge, ButtonLink, Card } from "@/components/ui/primitives";
import { isAdzunaConfigured, isApolloConfigured, isGmailOAuthConfigured, isUrlscanConfigured } from "@/lib/env";
import { getAuthenticatedUser } from "@/lib/supabase/server";

const SOCIAL = [
  { key: "outlook", name: "Outlook", status: "Coming Soon" },
  { key: "facebook", name: "Facebook", status: "Coming Soon" },
  { key: "instagram", name: "Instagram", status: "Coming Soon" },
  { key: "linkedin", name: "LinkedIn", status: "Coming Soon" },
  { key: "x", name: "X", status: "Coming Soon" },
] as const;

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ gmail?: string; error?: string }>;
}) {
  const { supabase, user } = await getAuthenticatedUser();
  const params = await searchParams;
  if (!user) return null;
  const { data: gmail } = await supabase
    .from("email_accounts")
    .select("email_address, status")
    .eq("provider", "gmail")
    .maybeSingle();
  const gmailReady = isGmailOAuthConfigured();

  return (
    <AppPageShell title="Integrations" description="Connect official providers. Unsupported networks stay on copy-and-open-profile workflows.">
      {params.gmail === "connected" ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Gmail is connected. You can send a test email, then use outreach from a real opportunity.
        </p>
      ) : null}
      {params.error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Gmail could not be connected. Confirm the Google redirect URI matches this origin, then try again.
        </p>
      ) : null}
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Gmail</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Connect an authorized Gmail account to send outreach and read replies. Clientra never asks for your Gmail password.
            </p>
            <p className="mt-2 text-sm">
              Status:{" "}
              <Badge tone={gmail?.status === "connected" ? "success" : "warning"}>
                {gmail ? `${gmail.status} · ${gmail.email_address}` : gmailReady ? "Not connected" : "Not configured"}
              </Badge>
            </p>
          </div>
          {gmailReady ? (
            <div className="flex flex-wrap gap-2">
              <ButtonLink href="/api/auth/google">{gmail ? "Reconnect Gmail" : "Connect Gmail"}</ButtonLink>
              {gmail ? (
                <>
                  <form action="/api/gmail/send-test" method="post">
                    <button type="submit" className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm">
                      Send test email
                    </button>
                  </form>
                  <form action="/api/gmail/disconnect" method="post">
                    <button type="submit" className="inline-flex h-10 items-center rounded-lg px-4 text-sm text-danger">
                      Disconnect
                    </button>
                  </form>
                </>
              ) : null}
            </div>
          ) : (
            <Badge tone="warning">Integration not configured</Badge>
          )}
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-3">
        {[
          {
            name: "urlscan",
            ready: isUrlscanConfigured(),
            body: "Imports newly detected public websites into Website Opportunities.",
          },
          {
            name: "Hacker News",
            ready: true,
            body: "Imports recent public Ask HN and hiring/help requests into Problem Opportunities. No extra API key is required.",
          },
          {
            name: "Apollo",
            ready: isApolloConfigured(),
            body: "Finds companies that may match the services you sell.",
          },
          {
            name: "Adzuna",
            ready: isAdzunaConfigured(),
            body: "Imports recent job ads as hiring opportunities.",
          },
        ].map((item) => (
          <Card key={item.name} className="p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold">{item.name}</h2>
              <Badge tone={item.ready ? "success" : "warning"}>{item.ready ? "Configured" : "Not configured"}</Badge>
            </div>
            <p className="mt-2 text-sm text-ink-muted">{item.body}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {SOCIAL.map((item) => (
          <Card key={item.key} className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{item.name}</h2>
              <Badge>{item.status}</Badge>
            </div>
            <p className="mt-2 text-sm text-ink-muted">
              Automatic sending is not available. You can still generate a message, copy it, and open the public profile.
            </p>
            <div className="mt-4 flex gap-2">
              <ButtonLink href="/outreach" size="sm">Generate Message</ButtonLink>
              <ButtonLink href="/outreach" size="sm" variant="outline">Copy Message</ButtonLink>
            </div>
          </Card>
        ))}
      </div>
    </AppPageShell>
  );
}

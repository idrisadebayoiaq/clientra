import { PageHeader } from "@/components/ui/feedback";
import { Card } from "@/components/ui/primitives";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isAdzunaConfigured,
  isApolloConfigured,
  isGmailOAuthConfigured,
  isOpenRouterConfigured,
  isUrlscanConfigured,
} from "@/lib/env";

export default async function AdminHealthPage() {
  const admin = createAdminClient();
  const { data } = await admin.from("system_health").select("*").order("provider");
  const live = [
    { provider: "supabase", status: "connected" },
    { provider: "openrouter", status: isOpenRouterConfigured() ? "connected" : "not_configured" },
    { provider: "gmail", status: isGmailOAuthConfigured() ? "connected" : "not_configured" },
    { provider: "urlscan", status: isUrlscanConfigured() ? "connected" : "not_configured" },
    { provider: "apollo", status: isApolloConfigured() ? "connected" : "not_configured" },
    { provider: "adzuna", status: isAdzunaConfigured() ? "connected" : "not_configured" },
    { provider: "pubsub", status: isGmailOAuthConfigured() && process.env.GOOGLE_PUBSUB_TOPIC ? "connected" : "not_configured" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title="API health" description="Live configuration status plus stored provider rows." />
      <div className="grid gap-3 md:grid-cols-2">
        {live.map((item) => (
          <Card key={item.provider} className="p-4">
            <p className="font-medium">{item.provider}</p>
            <p className="text-sm text-ink-muted">{item.status}</p>
          </Card>
        ))}
        {data?.map((item) => (
          <Card key={item.id} className="p-4">
            <p className="font-medium">{item.provider}</p>
            <p className="text-sm text-ink-muted">{item.status}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

import { AppPageShell } from "@/components/app/page-shell";
import { Card } from "@/components/ui/primitives";
import { PLANS } from "@/lib/constants";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export default async function BillingPage() {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return null;
  const { data: sub } = await supabase.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle();

  return (
    <AppPageShell title="Billing" description="Subscription architecture is in place. Payment processing is not enabled yet.">
      <p className="text-sm text-ink-muted">Current plan: {sub?.plan ?? "free"} ({sub?.status ?? "active"})</p>
      <div className="grid gap-3 lg:grid-cols-4">
        {PLANS.map((plan) => (
          <Card key={plan.key} className="p-5">
            <h2 className="font-semibold">{plan.name}</h2>
            <p className="mt-1 text-2xl">{plan.price}</p>
            <p className="mt-2 text-sm text-ink-muted">{plan.description}</p>
          </Card>
        ))}
      </div>
    </AppPageShell>
  );
}

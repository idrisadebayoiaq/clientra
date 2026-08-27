import type { Metadata } from "next";
import { FinalCta, MarketingHero, MarketingSection } from "@/components/marketing/blocks";
import { MarketingAuthCta } from "@/components/marketing/auth-cta";
import { ButtonLink, Card } from "@/components/ui/primitives";
import { PLANS } from "@/lib/constants";
import { FAQS } from "@/lib/marketing";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Free, Pro, Agency, and Enterprise plans for Clientra. Payment processing is not enabled yet.",
};

export default function PricingPage() {
  return (
    <main>
      <MarketingHero
        eyebrow="Pricing"
        title="Start simple. Grow when the pipeline does."
        description="Plans are ready in the product. Payment processing is not enabled yet, so you can explore the workspace on Free while billing is wired."
      >
        <MarketingAuthCta size="lg" signedOutLabel="Create a free workspace" signedInLabel="Open dashboard" />
      </MarketingHero>
      <MarketingSection title="Plans" eyebrow="Transparent">
        <div className="grid gap-4 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <Card key={plan.key} className={`p-6 ${"highlighted" in plan && plan.highlighted ? "ring-2 ring-accent" : ""}`}>
              <p className="text-sm text-ink-muted">{plan.name}</p>
              <p className="mt-2 text-3xl font-semibold">{plan.price}</p>
              <p className="mt-2 text-sm text-ink-muted">{plan.description}</p>
              <ul className="mt-4 space-y-2 text-sm text-ink-muted">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <MarketingAuthCta
                className="mt-6 w-full"
                variant={"highlighted" in plan && plan.highlighted ? "primary" : "outline"}
                signedOutLabel="Get started"
                signedInLabel="Open dashboard"
              />
            </Card>
          ))}
        </div>
        <p className="mt-4 text-xs text-ink-subtle">Payment processing is not enabled yet. Limits will be enforced when billing goes live.</p>
      </MarketingSection>
      <MarketingSection title="What is live today" eyebrow="Honest scope">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-6">
            <h3 className="font-semibold">Included now</h3>
            <p className="mt-2 text-sm text-ink-muted">
              Workspace, onboarding, website discovery when configured, AI analysis through OpenRouter, Gmail connect, inbox, CRM, and analytics from stored activity.
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="font-semibold">Coming next</h3>
            <p className="mt-2 text-sm text-ink-muted">
              Card billing, additional official discovery sources, and extra connected inboxes. Those features stay labeled until they are real.
            </p>
          </Card>
        </div>
      </MarketingSection>
      <MarketingSection title="Pricing questions">
        <div className="space-y-3">
          {FAQS.slice(0, 4).map((item) => (
            <Card key={item.q} className="p-5">
              <h2 className="font-semibold">{item.q}</h2>
              <p className="mt-2 text-sm leading-6 text-ink-muted">{item.a}</p>
            </Card>
          ))}
        </div>
      </MarketingSection>
      <FinalCta title="Create a workspace and start with Free." />
    </main>
  );
}

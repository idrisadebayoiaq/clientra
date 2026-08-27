import type { Metadata } from "next";
import { ButtonLink, Card, Badge } from "@/components/ui/primitives";
import { MarketingAuthCta } from "@/components/marketing/auth-cta";
import { FeatureGrid, FinalCta, MarketingSection } from "@/components/marketing/blocks";
import { FAQS } from "@/lib/marketing";
import { PLANS } from "@/lib/constants";

export const metadata: Metadata = {
  title: {
    absolute: "Clientra — Your AI Client Acquisition Engine",
  },
  description:
    "Find the people who need what you build. Discover new businesses, analyze them with evidence, and start personalized client conversations.",
};

export default function LandingPage() {
  return (
    <main>
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(13,148,136,0.22),transparent_42%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
          <div>
            <p className="text-sm font-medium tracking-wide text-accent-hover">
              Clientra — Your AI Client Acquisition Engine
            </p>
            <h1 className="font-display mt-4 max-w-3xl text-4xl leading-tight sm:text-6xl">
              Find the people who need what you build.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/70">
              Clientra uses AI to discover new businesses, website opportunities, public
              requests, and customer pain points — then helps you turn them into personalized
              client conversations.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <MarketingAuthCta size="lg" />
              <ButtonLink href="/how-it-works" variant="outline" size="lg" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                See How It Works
              </ButtonLink>
            </div>
            <p className="mt-6 text-sm text-white/50">Not a freelancer marketplace. A proactive acquisition system.</p>
          </div>
          <Card className="border-white/10 bg-white/5 p-5 text-white shadow-none">
            <p className="text-xs uppercase tracking-wider text-white/50">Opportunity feed</p>
            <div className="mt-4 space-y-3">
              {[
                ["New Shopify store", "Website · 24 min ago", "92"],
                ["Need a React developer", "Problem post · 1 hr ago", "88"],
                ["Slow WordPress site", "Public request · 3 hr ago", "81"],
              ].map(([title, meta, score]) => (
                <div key={title} className="rounded-xl border border-white/10 bg-ink-soft p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{title}</p>
                      <p className="mt-1 text-xs text-white/50">{meta}</p>
                    </div>
                    <span className="rounded-full bg-accent/20 px-2 py-1 text-xs text-accent-hover">{score}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-white/40">Marketing illustration. Live results only appear from configured sources.</p>
          </Card>
        </div>
      </section>

      <MarketingSection title="Not a marketplace" eyebrow="Positioning">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-6">
            <h3 className="font-semibold">Job boards wait for inbound</h3>
            <p className="mt-2 text-sm text-ink-muted">
              You compete on posted work after the client already has ten other proposals.
            </p>
          </Card>
          <Card className="p-6 ring-2 ring-accent">
            <h3 className="font-semibold">Clientra finds the problem first</h3>
            <p className="mt-2 text-sm text-ink-muted">
              Discover businesses and public requests that already match your services, then start a relevant conversation.
            </p>
          </Card>
        </div>
      </MarketingSection>

      <MarketingSection title="The problem" eyebrow="Why Clientra exists">
        <p className="max-w-3xl text-lg text-ink-muted">
          Most service providers wait for inbound leads or spend hours hunting through
          feeds. Clientra is built for the opposite motion: continuously discover who may
          need your work, understand the pain, and start a relevant conversation.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["Waiting is expensive", "Good-fit clients already have the problem. They just are not looking on a marketplace."],
            ["Generic outreach fails", "Templates that ignore the actual website or request get ignored."],
            ["Tools are scattered", "Discovery, analysis, email, and CRM usually live in four different products."],
          ].map(([title, body]) => (
            <Card key={title} className="p-5">
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-ink-muted">{body}</p>
            </Card>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection title="How Clientra works" eyebrow="The loop">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["1. Discover", "Find new websites, public requests, and job-like opportunities from authorized sources."],
            ["2. Analyze", "Use AI to identify problems, fit, and a responsible opportunity score."],
            ["3. Reach out", "Generate personalized messages. Send email only through authorized accounts."],
            ["4. Convert", "Track replies, follow-ups, and pipeline status in a lightweight CRM."],
          ].map(([title, body]) => (
            <Card key={title} className="p-5">
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-ink-muted">{body}</p>
            </Card>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection title="Opportunity discovery" eyebrow="Engine A + Engine B">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-6">
            <Badge tone="accent">Engine A</Badge>
            <h3 className="mt-3 text-lg font-semibold">Website opportunities</h3>
            <p className="mt-2 text-sm text-ink-muted">
              Newly detected businesses and sites, filtered by industry, technology, contact
              availability, and score.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-ink-muted">
              <li>Publicly scanned websites from permitted providers</li>
              <li>Freshness-first ranking</li>
              <li>Analyze, save, or ignore from the feed</li>
            </ul>
          </Card>
          <Card className="p-6">
            <Badge tone="gold">Engine B</Badge>
            <h3 className="mt-3 text-lg font-semibold">Problem and need discovery</h3>
            <p className="mt-2 text-sm text-ink-muted">
              Recent public posts where people ask for help — websites, Shopify, SEO, apps,
              and design — prioritized by freshness.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-ink-muted">
              <li>Last 24, 48, or 72 hours</li>
              <li>Official APIs and licensed feeds only</li>
              <li>No scraping of private accounts</li>
            </ul>
          </Card>
        </div>
      </MarketingSection>

      <MarketingSection title="AI website analysis" eyebrow="Evidence over guesses">
        <p className="max-w-3xl text-ink-muted">
          Findings are labeled Detected, Possible, or Unable to determine. Clientra will not
          claim a technical issue unless the available data supports it.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Badge tone="success">Detected</Badge>
          <Badge tone="warning">Possible</Badge>
          <Badge>Unable to determine</Badge>
        </div>
      </MarketingSection>

      <MarketingSection title="Problem discovery" eyebrow="Recent by default">
        <p className="max-w-3xl text-ink-muted">
          Freshness thresholds of 24, 48, and 72 hours keep the feed focused on opportunities
          that are still timely.
        </p>
      </MarketingSection>

      <MarketingSection title="AI outreach" eyebrow="Personalized, reviewable">
        <p className="max-w-3xl text-ink-muted">
          Generate messages for email and social channels. Social networks without an official
          API stay on Copy Message and Open Profile — never fake auto-send.
        </p>
        <div className="mt-6 flex flex-wrap gap-2 text-sm">
          {["Email", "LinkedIn", "Instagram", "Facebook", "X"].map((channel) => (
            <Badge key={channel}>{channel}</Badge>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection title="Inbox automation" eyebrow="Replies that matter">
        <p className="max-w-3xl text-ink-muted">
          Classify replies, extract questions, and recommend next actions. Automatic replies
          remain off until you turn them on.
        </p>
      </MarketingSection>

      <MarketingSection title="CRM" eyebrow="From discovered to won">
        <div className="flex gap-2 overflow-x-auto pb-2 text-sm">
          {["New", "Analyzed", "Qualified", "Contacted", "Replied", "Interested", "Meeting", "Won"].map((stage, index) => (
            <div key={stage} className="min-w-28 rounded-xl border border-border bg-white p-3">
              <p className="text-xs text-ink-subtle">{index > 0 ? "→" : ""} {stage}</p>
            </div>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection title="Analytics" eyebrow="See what converts">
        <p className="max-w-3xl text-ink-muted">
          Track discoveries, outreach, replies, meetings, and estimated pipeline value without
          cluttered dashboards.
        </p>
      </MarketingSection>

      <MarketingSection title="Use cases" eyebrow="Built for specialists">
        <FeatureGrid
          items={[
            "Developers",
            "Agencies",
            "Designers",
            "Marketers",
            "SEO specialists",
            "Automation consultants",
          ].map((item) => ({
            title: item,
            body: "Find businesses and public requests that match the services you actually sell.",
          }))}
        />
      </MarketingSection>

      <MarketingSection title="Pricing" eyebrow="Start simple" id="pricing">
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
        <p className="mt-4 text-xs text-ink-subtle">Payment processing is not enabled yet.</p>
      </MarketingSection>

      <MarketingSection title="FAQ" eyebrow="Straight answers">
        <div className="space-y-3">
          {FAQS.map((item) => (
            <Card key={item.q} className="p-5">
              <h3 className="font-semibold">{item.q}</h3>
              <p className="mt-2 text-sm text-ink-muted">{item.a}</p>
            </Card>
          ))}
        </div>
      </MarketingSection>

      <FinalCta title="Start finding clients who already have the problem you solve." />
    </main>
  );
}

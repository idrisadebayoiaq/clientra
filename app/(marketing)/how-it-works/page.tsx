import type { Metadata } from "next";
import { FinalCta, MarketingHero, MarketingSection } from "@/components/marketing/blocks";
import { ButtonLink, Card } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "How it works",
  description: "Create a workspace, discover recent opportunities, analyze with evidence, then reach out through authorized channels.",
};

const steps = [
  { n: "01", title: "Create your workspace", body: "Sign up with email or Google. Google login uses the Supabase Auth callback and is separate from Gmail sending." },
  { n: "02", title: "Tell Clientra what you sell", body: "Choose services, audience, locations, project value, and outreach preferences. Automatic actions stay off by default." },
  { n: "03", title: "Discover recent opportunities", body: "Import newly detected websites and, later, public problem posts and jobs from official APIs." },
  { n: "04", title: "Analyze with evidence", body: "Run AI analysis on a site or lead. Clientra labels findings instead of inventing issues." },
  { n: "05", title: "Reach out on your terms", body: "Generate a message, review it, and send through connected Gmail. Copy-and-open-profile for other channels." },
  { n: "06", title: "Manage the conversation", body: "Replies land in the inbox, get classified, and move through the CRM until they are won or lost." },
];

export default function HowItWorksPage() {
  return (
    <main>
      <MarketingHero
        eyebrow="How it works"
        title="A repeatable loop, not a job board."
        description="Clientra is built for specialists who already know what they sell and want a better way to find people with that problem."
      >
        <ButtonLink href="/signup" size="lg">Start Finding Clients</ButtonLink>
      </MarketingHero>
      <MarketingSection title="The six steps" eyebrow="From signup to won">
        <div className="grid gap-4 md:grid-cols-2">
          {steps.map((step) => (
            <Card key={step.n} className="p-6">
              <p className="text-xs font-semibold tracking-widest text-accent">{step.n}</p>
              <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-muted">{step.body}</p>
            </Card>
          ))}
        </div>
      </MarketingSection>
      <MarketingSection title="Not a marketplace" eyebrow="The difference">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-6">
            <h3 className="font-semibold">Marketplaces wait</h3>
            <p className="mt-2 text-sm text-ink-muted">
              You bid on posted jobs, compete on price, and hope the right client finds you.
            </p>
          </Card>
          <Card className="p-6 ring-2 ring-accent">
            <h3 className="font-semibold">Clientra goes first</h3>
            <p className="mt-2 text-sm text-ink-muted">
              You discover businesses and public requests that already match your services, then start a relevant conversation.
            </p>
          </Card>
        </div>
      </MarketingSection>
      <MarketingSection title="Two Google connections" eyebrow="Login vs Gmail">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-6">
            <h3 className="font-semibold">Continue with Google</h3>
            <p className="mt-2 text-sm text-ink-muted">
              Signs you into Clientra. It uses the Supabase Auth callback and does not grant inbox access.
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="font-semibold">Connect Gmail</h3>
            <p className="mt-2 text-sm text-ink-muted">
              A separate OAuth grant used only to send outreach and read replies from your own mailbox.
            </p>
          </Card>
        </div>
      </MarketingSection>
      <FinalCta title="See the loop in your own workspace." />
    </main>
  );
}

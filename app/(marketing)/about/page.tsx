import type { Metadata } from "next";
import { FinalCta, MarketingHero, MarketingSection } from "@/components/marketing/blocks";
import { ButtonLink, Card } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "About",
  description: "Clientra exists to make client acquisition proactive for specialists who already know what they sell.",
};

export default function AboutPage() {
  return (
    <main>
      <MarketingHero
        eyebrow="About"
        title="Clientra exists to make client acquisition proactive."
        description="Too many specialists are excellent at the work and still rely on luck, referrals, or generic marketplaces. Clientra is the engine that finds the people who already need that work."
      >
        <ButtonLink href="/contact" size="lg" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
          Talk to the team
        </ButtonLink>
      </MarketingHero>
      <MarketingSection title="What we believe" eyebrow="Principles">
        <div className="grid gap-4 md:grid-cols-2">
          {[
            ["Authorized data only", "Official APIs, permitted feeds, and public information. No bypassing logins, CAPTCHAs, or platform rules."],
            ["Evidence over invention", "AI can miss things. Clientra labels uncertainty instead of fabricating contacts or technical issues."],
            ["Human approval first", "Automatic sending, follow-ups, and replies stay off until you turn them on."],
            ["Your accounts stay yours", "Gmail is connected through Google OAuth. You can disconnect and revoke access at any time."],
          ].map(([title, body]) => (
            <Card key={title} className="p-6">
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-ink-muted">{body}</p>
            </Card>
          ))}
        </div>
      </MarketingSection>
      <MarketingSection title="The product in one sentence" eyebrow="Positioning">
        <Card className="p-6">
          <p className="text-lg leading-8 text-ink">
            Clientra is an AI client-acquisition engine for developers, agencies, designers, and marketers — not a place to bid on jobs.
          </p>
        </Card>
      </MarketingSection>
      <FinalCta title="Build a quieter, more precise pipeline." />
    </main>
  );
}

import type { Metadata } from "next";
import { MarketingHero, MarketingSection } from "@/components/marketing/blocks";
import { Card } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms for using Clientra, including AI output, authorized access, and connected accounts.",
};

export default function TermsPage() {
  return (
    <main>
      <MarketingHero
        eyebrow="Legal"
        title="Terms of Service"
        description="Clientra provides software for discovering and managing outreach opportunities. You remain responsible for the messages you send."
      />
      <MarketingSection title="Using Clientra">
        <div className="space-y-4">
          {[
            ["The product", "Clientra is a client acquisition engine, not a freelancer marketplace and not a guarantee of clients or revenue."],
            ["AI output", "Analysis, scores, and drafts can be incomplete or incorrect. Review them before you send anything."],
            ["Authorized access", "Do not use Clientra to bypass authentication, scrape private data, or send unsolicited bulk email."],
            ["Connected accounts", "Gmail access is granted through Google OAuth. You can revoke it in Google and disconnect it in Clientra."],
            ["Acceptable use", "Respect platform rules, privacy law, and anti-spam requirements in the places you operate."],
            ["Changes", "These terms can evolve as billing, sources, and integrations are added. Continued use after an update means you accept the current version."],
          ].map(([title, body]) => (
            <Card key={title} className="p-5">
              <h2 className="font-semibold">{title}</h2>
              <p className="mt-2 text-sm text-ink-muted">{body}</p>
            </Card>
          ))}
        </div>
      </MarketingSection>
    </main>
  );
}

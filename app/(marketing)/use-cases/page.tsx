import type { Metadata } from "next";
import { FeatureGrid, FinalCta, MarketingHero, MarketingSection } from "@/components/marketing/blocks";
import { ButtonLink, Card } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Use cases",
  description: "How developers, agencies, designers, marketers, SEO specialists, and automation consultants use Clientra.",
};

const scenarios = [
  {
    title: "Independent developer",
    body: "You sell Next.js builds, Shopify work, or performance fixes. Clientra surfaces newly detected stores and public posts asking for that exact help.",
  },
  {
    title: "Studio or agency",
    body: "Keep a shared pipeline of website and problem opportunities, then run approved outreach instead of a shared spreadsheet of random leads.",
  },
  {
    title: "Designer",
    body: "Find public redesign requests and sites with visible UX or branding gaps, then send a specific note instead of a generic portfolio blast.",
  },
  {
    title: "Marketer or SEO specialist",
    body: "Catch businesses asking for SEO, ads, email, or conversion help while the thread is still fresh.",
  },
];

export default function UseCasesPage() {
  return (
    <main>
      <MarketingHero
        eyebrow="Use cases"
        title="Built for people who already sell a service."
        description="Clientra helps specialists find businesses and public requests that match the work they already do."
      >
        <ButtonLink href="/signup" size="lg">Start Finding Clients</ButtonLink>
      </MarketingHero>
      <MarketingSection title="Who it is for" eyebrow="Specialists">
        <FeatureGrid
          items={[
            { title: "Developers", body: "Find stores, apps, and sites with conversion, performance, or build requests that match your stack." },
            { title: "Agencies", body: "Keep a shared pipeline of website and problem opportunities, then run approved outreach campaigns." },
            { title: "Designers", body: "Spot public redesign requests and sites with visible UX or branding gaps." },
            { title: "Marketers", body: "Catch businesses asking for SEO, ads, email, or conversion help before the thread goes cold." },
            { title: "SEO specialists", body: "Prioritize sites and public posts where search or content problems are already being discussed." },
            { title: "Automation consultants", body: "Find operators who are asking for workflows, integrations, or AI assistance." },
          ]}
        />
      </MarketingSection>
      <MarketingSection title="How it shows up in the work week" eyebrow="Scenarios">
        <div className="grid gap-4 md:grid-cols-2">
          {scenarios.map((item) => (
            <Card key={item.title} className="p-6">
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-muted">{item.body}</p>
            </Card>
          ))}
        </div>
      </MarketingSection>
      <FinalCta title="Match your services to people who already need them." />
    </main>
  );
}

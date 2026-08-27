import type { Metadata } from "next";
import { FeatureGrid, FinalCta, MarketingHero, MarketingSection } from "@/components/marketing/blocks";
import { MarketingAuthCta } from "@/components/marketing/auth-cta";
import { Badge, ButtonLink, Card } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Features",
  description: "Discovery, AI analysis, authorized outreach, inbox, CRM, and analytics in one Clientra workspace.",
};

export default function FeaturesPage() {
  return (
    <main>
      <MarketingHero
        eyebrow="Product"
        title="Everything you need to find and convert clients."
        description="Clientra combines discovery, analysis, authorized outreach, inbox classification, and a lightweight CRM. It is not a freelancer marketplace."
      >
        <div className="flex flex-wrap gap-3">
          <MarketingAuthCta size="lg" />
          <ButtonLink href="/how-it-works" size="lg" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
            See the loop
          </ButtonLink>
        </div>
      </MarketingHero>

      <MarketingSection title="Core platform" eyebrow="What you get">
        <FeatureGrid
          items={[
            { title: "Website discovery", body: "Import newly detected public websites from permitted providers and review them before you reach out." },
            { title: "Problem discovery", body: "Surface recent public requests for developers, designers, marketers, and specialists." },
            { title: "AI website analysis", body: "Inspect technical and business issues with Detected, Possible, and Unable to determine labels." },
            { title: "Opportunity scoring", body: "A 0–100 estimate with an explanation. Never presented as a guaranteed outcome." },
            { title: "Contact intelligence", body: "Store only publicly available or authorized details, with source and verification status." },
            { title: "AI outreach", body: "Generate personalized messages, then send email through a connected Gmail account." },
            { title: "Inbox", body: "Classify replies such as pricing requests, meeting asks, not interested, and out of office." },
            { title: "Follow-ups", body: "Schedule 3, 7, and 14 day sequences. Automatic send stays off until you enable it." },
            { title: "CRM and campaigns", body: "Move leads from New to Won, and group outreach into approval-based campaigns." },
            { title: "Analytics", body: "Track discoveries, sends, replies, meetings, and conversion from stored activity." },
            { title: "Integrations", body: "Gmail is live via OAuth. Other networks stay on copy-and-open-profile until official APIs exist." },
            { title: "Security", body: "Row Level Security, server-side secrets, token isolation, and audit logs for important actions." },
          ]}
        />
      </MarketingSection>

      <MarketingSection title="Evidence-first analysis" eyebrow="AI that can say it does not know">
        <p className="max-w-3xl text-ink-muted">
          Website analysis labels every finding. Clientra will not invent a contact, a metric, or a technical issue just to fill a report.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card className="p-5">
            <Badge tone="success">Detected</Badge>
            <p className="mt-3 text-sm text-ink-muted">Supported by the available page or source data.</p>
          </Card>
          <Card className="p-5">
            <Badge tone="warning">Possible</Badge>
            <p className="mt-3 text-sm text-ink-muted">A signal exists, but it is not conclusive. Review before you mention it.</p>
          </Card>
          <Card className="p-5">
            <Badge>Unable to determine</Badge>
            <p className="mt-3 text-sm text-ink-muted">The source does not support a claim. The report stays honest.</p>
          </Card>
        </div>
      </MarketingSection>

      <MarketingSection title="Outreach without fake auto-send" eyebrow="Authorized channels only">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-6">
            <h3 className="font-semibold">Gmail</h3>
            <p className="mt-2 text-sm text-ink-muted">
              Connect Google OAuth to send from your own inbox and read replies. Automatic sending stays off until you turn it on.
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="font-semibold">Social networks</h3>
            <p className="mt-2 text-sm text-ink-muted">
              LinkedIn, Instagram, Facebook, and X stay on Generate, Copy, and Open Profile until an official API is connected.
            </p>
          </Card>
        </div>
      </MarketingSection>
      <FinalCta title="Put the full acquisition loop in one workspace." />
    </main>
  );
}

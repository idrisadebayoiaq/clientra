import type { Metadata } from "next";
import { MarketingHero, MarketingSection } from "@/components/marketing/blocks";
import { Card } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Clientra stores account data, outreach, Gmail tokens, and contact inquiries.",
};

export default function PrivacyPage() {
  return (
    <main>
      <MarketingHero
        eyebrow="Legal"
        title="Privacy Policy"
        description="Clientra is designed to keep account data, outreach, and connected-account tokens under your control."
      />
      <MarketingSection title="What we store">
        <div className="space-y-4">
          {[
            ["Account data", "Email, name, onboarding preferences, services, and workspace settings live in Supabase."],
            ["Opportunities and CRM", "Websites, leads, messages, notes, and scores that you generate or import are stored for your account only."],
            ["Gmail", "Connection metadata is visible in the app. Access and refresh tokens are stored server-side and are not exposed to the browser."],
            ["AI", "Prompts and results may be stored as analyses. API keys stay on the server and are never sent to the client as NEXT_PUBLIC values."],
            ["Contact form", "Messages submitted on this website are stored as private inquiries."],
            ["Your choices", "Disconnect Gmail at any time. Use Data & Privacy in Settings, or contact us, to request deletion of workspace data."],
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

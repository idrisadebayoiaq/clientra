import type { Metadata } from "next";
import { MarketingHero, MarketingSection } from "@/components/marketing/blocks";
import { ContactForm } from "@/components/marketing/contact-form";
import { Card } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Contact",
  description: "Talk to the Clientra team about the product, Gmail access, or a future agency rollout.",
};

export default function ContactPage() {
  return (
    <main>
      <MarketingHero
        eyebrow="Contact"
        title="Talk to the Clientra team."
        description="Questions about the product, Gmail access, or a future agency rollout? Send a note. We store inquiries privately — they are not a public lead feed."
      />
      <MarketingSection title="Send a message">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <ContactForm />
          </Card>
          <Card className="p-6 text-sm leading-6 text-ink-muted">
            <h2 className="text-base font-semibold text-ink">What to include</h2>
            <p className="mt-3">Your service, the problem you want Clientra to solve, and whether you need Gmail sending, discovery, or a team workspace.</p>
            <p className="mt-3">For account deletion or integration issues, mention the email on the workspace.</p>
          </Card>
        </div>
      </MarketingSection>
    </main>
  );
}

import type { Metadata } from "next";
import { FinalCta, MarketingHero, MarketingSection } from "@/components/marketing/blocks";
import { ButtonLink, Card } from "@/components/ui/primitives";
import { FAQS } from "@/lib/marketing";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers about Clientra, discovery sources, Gmail access, AI scores, and data deletion.",
};

export default function FaqPage() {
  return (
    <main>
      <MarketingHero
        eyebrow="FAQ"
        title="Straight answers about Clientra."
        description="If you are wondering whether this is a marketplace, how Gmail works, or whether AI scores are promises — start here."
      >
        <ButtonLink href="/contact" size="lg" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
          Ask a question
        </ButtonLink>
      </MarketingHero>
      <MarketingSection title="Common questions">
        <div className="space-y-3">
          {FAQS.map((item) => (
            <Card key={item.q} className="p-5">
              <h2 className="font-semibold">{item.q}</h2>
              <p className="mt-2 text-sm leading-6 text-ink-muted">{item.a}</p>
            </Card>
          ))}
        </div>
      </MarketingSection>
      <FinalCta title="Still need a human? Send a note from Contact." />
    </main>
  );
}

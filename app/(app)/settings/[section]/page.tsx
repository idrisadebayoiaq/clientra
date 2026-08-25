import { AppPageShell } from "@/components/app/page-shell";
import { Card } from "@/components/ui/primitives";

const COPY: Record<string, { title: string; body: string }> = {
  profile: { title: "Profile", body: "Name and avatar are stored on your profile. Role cannot be changed except by an admin." },
  services: { title: "Services", body: "Update the services you sell. These drive matching and recommendations." },
  "target-market": { title: "Target market", body: "Audiences and locations, including worldwide." },
  opportunities: { title: "Opportunity preferences", body: "Freshness defaults to the last 24 hours." },
  outreach: { title: "Outreach preferences", body: "Automatic follow-ups and automatic replies stay off unless you enable them." },
  ai: {
    title: "AI settings",
    body: "Outreach and analysis use Claude Sonnet 5. Scoring and intent use Gemini 3.7 Flash. Deep website analysis uses Claude Opus 5. All calls go through OpenRouter on the server.",
  },
  notifications: { title: "Notifications", body: "In-app notifications are enabled. Email and browser notifications can be added later." },
  security: { title: "Security", body: "Use a strong password. Gmail is connected only through Google OAuth." },
  privacy: { title: "Data & Privacy", body: "You can disconnect integrations and request deletion of your workspace data." },
};

export default async function SettingsSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const copy = COPY[section] ?? { title: "Settings", body: "This settings section is ready for additional controls." };
  return (
    <AppPageShell title={copy.title} description={copy.body}>
      <Card className="p-5 text-sm text-ink-muted">
        Use onboarding or the related product pages to update these values today. Dedicated forms can be expanded here without changing the data model.
      </Card>
    </AppPageShell>
  );
}

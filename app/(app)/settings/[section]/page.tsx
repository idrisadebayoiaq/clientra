import { AppPageShell } from "@/components/app/page-shell";
import { ProfileNameForm } from "@/components/app/profile-name-form";
import { Card } from "@/components/ui/primitives";
import { getAuthenticatedUser } from "@/lib/supabase/server";

const COPY: Record<string, { title: string; body: string }> = {
  profile: { title: "Profile", body: "This name is used to sign AI-generated outreach emails. Role cannot be changed except by an admin." },
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
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return null;
  const { data: profile } =
    section === "profile"
      ? await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle()
      : { data: null };

  return (
    <AppPageShell title={copy.title} description={copy.body}>
      {section === "profile" ? (
        <Card className="p-5">
          <ProfileNameForm defaultName={profile?.full_name ?? ""} />
        </Card>
      ) : (
        <Card className="p-5 text-sm text-ink-muted">
          Use onboarding or the related product pages to update these values today. Dedicated forms can be expanded here without changing the data model.
        </Card>
      )}
    </AppPageShell>
  );
}

import { AppPageShell } from "@/components/app/page-shell";
import { Card } from "@/components/ui/primitives";

export default function HelpPage() {
  return (
    <AppPageShell title="Help" description="Clientra is a client acquisition engine, not a freelancer marketplace.">
      <Card className="space-y-3 p-5 text-sm text-ink-muted">
        <p>Use Discover for a combined feed, Website Opportunities for newly detected sites, and Problem Opportunities for public requests.</p>
        <p>Analyze a website before outreach. Scores are estimates, not guarantees.</p>
        <p>Connect Gmail only through Google OAuth. Never share your Gmail password.</p>
        <p>Automatic follow-ups and automatic replies stay off until you enable them in onboarding or settings.</p>
      </Card>
    </AppPageShell>
  );
}

import { AppPageShell } from "@/components/app/page-shell";
import { ButtonLink, Card } from "@/components/ui/primitives";

const LINKS = [
  ["Profile", "/settings/profile"],
  ["Services", "/settings/services"],
  ["Target market", "/settings/target-market"],
  ["Opportunity preferences", "/settings/opportunities"],
  ["Outreach preferences", "/settings/outreach"],
  ["AI settings", "/settings/ai"],
  ["Email integrations", "/integrations"],
  ["Social integrations", "/integrations"],
  ["Notifications", "/settings/notifications"],
  ["Security", "/settings/security"],
  ["Billing", "/billing"],
  ["Data & Privacy", "/settings/privacy"],
  ["Connected accounts", "/integrations"],
];

export default function SettingsPage() {
  return (
    <AppPageShell title="Settings" description="Control profile, targeting, outreach automation, and connected accounts.">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LINKS.map(([label, href]) => (
          <Card key={href} className="p-4">
            <ButtonLink href={href} variant="ghost" className="justify-start px-0">
              {label}
            </ButtonLink>
          </Card>
        ))}
      </div>
    </AppPageShell>
  );
}

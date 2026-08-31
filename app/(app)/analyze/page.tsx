import { AppPageShell } from "@/components/app/page-shell";
import { AnalyzeOwnWebsiteForm } from "@/components/app/analyze-own-website-form";

export default function AnalyzeIndexPage() {
  return (
    <AppPageShell
      title="Audit Website"
      description="Paste a website URL. Clientra audits the site, detects contacts, and helps you write outreach based on what it finds."
    >
      <AnalyzeOwnWebsiteForm />
    </AppPageShell>
  );
}

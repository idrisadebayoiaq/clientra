import { AppPageShell } from "@/components/app/page-shell";
import { AnalyzeOwnWebsiteForm } from "@/components/app/analyze-own-website-form";

export default function AnalyzeIndexPage() {
  return (
    <AppPageShell
      title="Analyze Website"
      description="Paste a website you found yourself, or open Analyze Website from a discovered site in Website Opportunities."
    >
      <AnalyzeOwnWebsiteForm />
    </AppPageShell>
  );
}

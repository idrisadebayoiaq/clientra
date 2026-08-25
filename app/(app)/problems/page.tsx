import { AppPageShell, SourceNotReady } from "@/components/app/page-shell";

export default function ProblemsPage() {
  return (
    <AppPageShell
      title="Problem Opportunities"
      description="Recent public posts where people discuss problems or request services. Only authorized sources will be used."
    >
      <SourceNotReady
        source="Problem discovery"
        description="Social feeds, Google Search, and Brave Search are not wired yet. Job ads from Adzuna already appear under Job Opportunities. This page will stay empty until a public-post provider is added."
      />
    </AppPageShell>
  );
}

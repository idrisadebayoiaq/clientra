"use client";

import { runAnalysis } from "@/app/(app)/analyze/actions";
import { DiscoverSourceButton } from "@/components/app/discover-source-button";

export function AnalyzeWebsiteButton({ targetId }: { targetId: string }) {
  return (
    <DiscoverSourceButton
      action={() => runAnalysis(targetId)}
      label="Run audit"
      pendingLabel="Auditing…"
      successLabel="Audit saved."
    />
  );
}

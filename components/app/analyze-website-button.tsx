"use client";

import { runAnalysis } from "@/app/(app)/analyze/actions";
import { DiscoverSourceButton } from "@/components/app/discover-source-button";

export function AnalyzeWebsiteButton({ targetId }: { targetId: string }) {
  return (
    <DiscoverSourceButton
      action={() => runAnalysis(targetId)}
      label="Run analysis"
      pendingLabel="Analyzing…"
      successLabel="Analysis saved."
    />
  );
}

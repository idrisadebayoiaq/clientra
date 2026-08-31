"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { refreshLocalOpportunities } from "@/app/(app)/websites/actions";
import { Button } from "@/components/ui/primitives";

export function RefreshOpportunityResults({
  category,
  location,
  hasMore,
}: {
  category: string;
  location: string;
  hasMore: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onRefresh() {
    setPending(true);
    setError(null);
    try {
      const result = await refreshLocalOpportunities({ category, location });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const params = new URLSearchParams({
        batch: result.batchId,
        category: result.category,
        location: result.location,
      });
      router.push(`/websites?${params.toString()}`);
      router.refresh();
    } catch {
      setError("Could not load new results. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={onRefresh}
        disabled={pending || !hasMore}
        className="gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
        {pending ? "Loading new results…" : "Refresh — next 20"}
      </Button>
      {!hasMore ? (
        <p className="text-xs text-ink-muted">No more Google Maps pages for this search.</p>
      ) : (
        <p className="text-xs text-ink-muted">Previously shown businesses will not appear again.</p>
      )}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}

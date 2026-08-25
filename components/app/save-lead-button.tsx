"use client";

import { useState } from "react";
import { Button } from "@/components/ui/primitives";
import { saveWebsiteAsLead } from "@/app/(app)/discover/actions";

export function SaveLeadButton({ websiteId }: { websiteId: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    const result = await saveWebsiteAsLead(websiteId);
    setLoading(false);
    setMessage(result.ok ? "Saved to leads." : result.error ?? "Could not save");
  }

  return (
    <div className="flex items-center gap-2">
      <Button type="button" size="sm" variant="ghost" onClick={onClick} disabled={loading}>
        {loading ? "Saving…" : "Save Lead"}
      </Button>
      {message ? <span className="text-xs text-ink-muted">{message}</span> : null}
    </div>
  );
}

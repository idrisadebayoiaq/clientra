"use client";

import { useState } from "react";
import { Button } from "@/components/ui/primitives";

export function DiscoverSourceButton({
  action,
  label,
  pendingLabel,
  successLabel,
}: {
  action: () => Promise<{ ok: boolean; count?: number; error?: string }>;
  label: string;
  pendingLabel: string;
  successLabel?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setMessage(null);
    const result = await action();
    setLoading(false);
    setMessage(
      result.ok
        ? (successLabel ?? `Imported ${result.count ?? 0} records.`)
        : result.error ?? "Request failed",
    );
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button type="button" onClick={onClick} disabled={loading}>
        {loading ? pendingLabel : label}
      </Button>
      {message ? <p className="text-sm text-ink-muted">{message}</p> : null}
    </div>
  );
}

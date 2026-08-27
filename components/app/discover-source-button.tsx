"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/primitives";

export function DiscoverSourceButton({
  action,
  label,
  pendingLabel,
  successLabel,
}: {
  action: () => Promise<{ ok: boolean; count?: number; error?: string; warning?: string }>;
  label: string;
  pendingLabel: string;
  successLabel?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setMessage(null);
    try {
      const result = await action();
      setMessage(
        result.ok
          ? `${successLabel ?? ""}${result.count ?? 0} new record${result.count === 1 ? "" : "s"} added.${result.warning ? ` ${result.warning}` : ""}`
          : result.error ?? "Request failed",
      );
      if (result.ok) router.refresh();
    } catch {
      setMessage("Request failed. Try again.");
    } finally {
      setLoading(false);
    }
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

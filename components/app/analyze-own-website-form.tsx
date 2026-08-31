"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { importWebsiteForAnalysis } from "@/app/(app)/websites/actions";
import { Button, Card, Input, Label } from "@/components/ui/primitives";

export function AnalyzeOwnWebsiteForm({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await importWebsiteForAnalysis(url);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/analyze/${result.websiteId}`);
      router.refresh();
    } catch {
      setError("Could not open that website. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className={compact ? "p-4" : "p-5"}>
      <h2 className="text-base font-semibold">Audit a website</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Paste any public URL. Clientra saves it to your workspace, audits the site, and opens the audit page.
      </p>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <Label htmlFor="manual-website-url">Website URL</Label>
          <Input
            id="manual-website-url"
            type="url"
            inputMode="url"
            placeholder="https://example.com"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Opening…" : "Audit website"}
        </Button>
      </form>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
    </Card>
  );
}

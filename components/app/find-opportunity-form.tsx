"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { findLocalOpportunities } from "@/app/(app)/websites/actions";
import { Button, Card, Input, Label } from "@/components/ui/primitives";

export function FindOpportunityForm({
  configured,
  initialCategory = "",
  initialLocation = "",
}: {
  configured: boolean;
  initialCategory?: string;
  initialLocation?: string;
}) {
  const router = useRouter();
  const [category, setCategory] = useState(initialCategory);
  const [location, setLocation] = useState(initialLocation);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!configured) {
      setError("Google Maps API is not configured. Add GOOGLE_MAPS_API_KEY on the Integrations page.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const result = await findLocalOpportunities({ category, location });
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
      setError("Could not search Google Maps. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold">Find local businesses</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Enter a category and location. Clientra searches Google Maps and returns up to 20 businesses with
        outreach signals — no automatic listing until you search.
      </p>
      <form onSubmit={onSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="find-category">Business category</Label>
          <Input
            id="find-category"
            placeholder="e.g. real estate"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="find-location">Country or address</Label>
          <Input
            id="find-location"
            placeholder="e.g. New York, USA"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            required
          />
        </div>
        <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending || !configured}>
            {pending ? "Searching Google Maps…" : "Find Opportunity"}
          </Button>
          {!configured ? (
            <p className="text-sm text-amber-700">
              Connect Google Maps on{" "}
              <a href="/integrations" className="underline">
                Integrations
              </a>
              . Enable <strong>Places API (New)</strong> in Google Cloud Console.
            </p>
          ) : null}
          {error ? (
            <div className="sm:col-span-2 space-y-1">
              <p className="text-sm text-danger">{error}</p>
              {error.includes("Places API") ? (
                <p className="text-xs text-ink-muted">
                  In{" "}
                  <a
                    href="https://console.cloud.google.com/apis/library/places.googleapis.com"
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    Google Cloud Console
                  </a>
                  , enable Places API (New) for your project, then retry.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </form>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { saveLocalBusinessLead } from "@/app/(app)/websites/actions";
import { ScanContactsButton } from "@/components/app/scan-contacts-button";
import { Badge, Button, ButtonLink, Card } from "@/components/ui/primitives";
import { ScoreRing } from "@/components/ui/score-and-tabs";
import { whatsAppUrl } from "@/lib/opportunities/google-places";
import { parseSocialNotes } from "@/lib/opportunities/public-contact";
import { scoreLabel } from "@/lib/utils";
import type { ContactSummary } from "@/components/app/contact-details";
import { Sparkles } from "lucide-react";

export type LocalBusinessCardData = {
  opportunityId: string;
  websiteId: string;
  name: string;
  categoryLabel: string | null;
  searchCategory: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  googleMapsUrl: string | null;
  rating: number | null;
  reviewCount: number | null;
  score: number;
  insights: string[];
  recommendedService: string;
  websiteStatus: "missing" | "present";
  savedStatus: "new" | "saved";
  contact?: ContactSummary | null;
  inLeads?: boolean;
};

function SocialChip({ label, value }: { label: string; value: string | null }) {
  return (
    <span
      className={
        value
          ? "inline-flex items-center rounded-full border border-border bg-white px-3 py-1.5 text-xs text-ink"
          : "inline-flex items-center rounded-full border border-dashed border-border px-3 py-1.5 text-xs text-ink-muted"
      }
    >
      {label} {value ? value.replace(/^https?:\/\/(www\.)?/, "").slice(0, 28) : "Not found"}
    </span>
  );
}

export function LocalBusinessCard({ business }: { business: LocalBusinessCardData }) {
  const [saved, setSaved] = useState(business.savedStatus === "saved" || business.inLeads);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const social = parseSocialNotes(business.contact?.notes);
  const waLink = whatsAppUrl(business.phone);
  const email = business.contact?.email ?? null;

  async function onSave() {
    setSaving(true);
    setSaveMessage(null);
    const result = await saveLocalBusinessLead(business.opportunityId);
    setSaving(false);
    if (result.ok) {
      setSaved(true);
      setSaveMessage("Saved to Saved Leads.");
    } else {
      setSaveMessage(result.error ?? "Could not save lead");
    }
  }

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">{business.name}</h2>
            {business.categoryLabel ? <Badge>{business.categoryLabel}</Badge> : null}
            <Badge tone="gold">{business.searchCategory}</Badge>
            {saved ? <Badge tone="success">Saved lead</Badge> : null}
          </div>
          {business.address ? (
            <p className="mt-1 text-sm text-ink-muted">{business.address}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-ink-muted">
            {business.phone ? <span>{business.phone}</span> : null}
            {business.rating != null ? (
              <span>
                {business.rating.toFixed(1)}★
                {business.reviewCount != null ? ` (${business.reviewCount})` : ""}
              </span>
            ) : null}
            {business.googleMapsUrl ? (
              <a
                href={business.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                Google Maps
              </a>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {business.websiteStatus === "missing" ? (
              <Badge tone="warning">No website detected</Badge>
            ) : (
              <Badge tone="success">Website on Google</Badge>
            )}
            <span className="text-sm text-ink-muted">
              Recommended: {business.recommendedService}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {business.phone && waLink ? (
              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full border border-teal-700/40 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-900"
              >
                WhatsApp · Unverified — from Google phone
              </a>
            ) : null}
            {business.phone ? (
              <a
                href={`tel:${business.phone}`}
                className="inline-flex items-center rounded-full border border-border bg-white px-3 py-1.5 text-xs text-ink"
              >
                Call {business.phone}
              </a>
            ) : null}
            <SocialChip label="Instagram" value={null} />
            <SocialChip label="Facebook" value={social.facebookUrl} />
            <SocialChip label="LinkedIn" value={social.linkedinUrl} />
            <SocialChip label="Email" value={email} />
            {business.website ? (
              <a
                href={business.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full border border-border bg-white px-3 py-1.5 text-xs text-ink"
              >
                Website
              </a>
            ) : null}
            {business.website ? <ScanContactsButton targetId={business.websiteId} /> : (
              <span className="inline-flex items-center rounded-full border border-dashed border-border px-3 py-1.5 text-xs text-ink-muted">
                Find contacts — needs a website
              </span>
            )}
          </div>

          {business.insights.length ? (
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-ink-muted">
              {business.insights.map((insight) => (
                <li key={insight}>{insight}</li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="flex flex-col items-start gap-3 lg:items-end">
          <div className="text-right">
            <ScoreRing score={business.score} />
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-teal-800">
              {scoreLabel(business.score)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant={saved ? "primary" : "outline"} onClick={onSave} disabled={saving || saved}>
          {saved ? "Saved" : saving ? "Saving…" : "Save Lead"}
        </Button>
        {saveMessage ? <span className="text-xs text-ink-muted">{saveMessage}</span> : null}
        <ButtonLink href={`/outreach?opportunity=${business.opportunityId}&refresh=1&audit=1`} size="sm" className="gap-1.5">
          <Sparkles className="h-4 w-4" />
          Generate Pitch
        </ButtonLink>
        {business.website ? (
          <ButtonLink href={`/analyze/${business.websiteId}`} size="sm" variant="outline">
            Audit Website
          </ButtonLink>
        ) : null}
      </div>
    </Card>
  );
}

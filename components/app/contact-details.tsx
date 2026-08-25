import { Badge } from "@/components/ui/primitives";
import { parseSocialNotes } from "@/lib/opportunities/public-contact";
import type { Tables } from "@/types/database";

export type ContactSummary = Pick<
  Tables<"contacts">,
  "email" | "phone" | "website" | "full_name" | "business_name" | "notes" | "verification_status"
>;

export function firstContact(contacts: ContactSummary[] | ContactSummary | null | undefined) {
  if (Array.isArray(contacts)) return contacts[0] ?? null;
  return contacts ?? null;
}

export function ContactDetails({
  contact,
  fallbackLabel = "No public contact stored",
}: {
  contact?: ContactSummary | null;
  fallbackLabel?: string;
}) {
  if (!contact?.email && !contact?.phone && !contact?.website && !contact?.notes) {
    return <p className="text-sm text-ink-muted">{fallbackLabel}</p>;
  }
  const social = parseSocialNotes(contact.notes);
  return (
    <dl className="grid gap-1 text-sm">
      {contact.full_name ? (
        <div className="flex justify-between gap-3">
          <dt className="text-ink-subtle">Name</dt>
          <dd>{contact.full_name}</dd>
        </div>
      ) : null}
      <div className="flex justify-between gap-3">
        <dt className="text-ink-subtle">Email</dt>
        <dd className="break-all">{contact.email ?? "No public email stored"}</dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt className="text-ink-subtle">Phone</dt>
        <dd>{contact.phone ?? "No public phone stored"}</dd>
      </div>
      {contact.website ? (
        <div className="flex justify-between gap-3">
          <dt className="text-ink-subtle">Website</dt>
          <dd className="break-all">{contact.website}</dd>
        </div>
      ) : null}
      {social.linkedinUrl ? (
        <div className="flex justify-between gap-3">
          <dt className="text-ink-subtle">LinkedIn</dt>
          <dd className="break-all">{social.linkedinUrl}</dd>
        </div>
      ) : null}
      <div>
        <Badge>{contact.verification_status ?? "unverified"}</Badge>
      </div>
    </dl>
  );
}

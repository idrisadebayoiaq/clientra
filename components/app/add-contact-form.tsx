"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { addWorkspaceContact } from "@/app/(app)/contacts/actions";
import { Button, Card, Input, Label } from "@/components/ui/primitives";

export function AddContactForm({
  opportunityId,
  websiteId,
  defaultWebsite,
}: {
  opportunityId?: string | null;
  websiteId?: string | null;
  defaultWebsite?: string | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    try {
      const form = new FormData(event.currentTarget);
      const result = await addWorkspaceContact(form);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setMessage("Contact saved.");
      event.currentTarget.reset();
      router.refresh();
    } catch {
      setMessage("Could not save that contact.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="p-5" id="add-contact">
      <h2 className="font-semibold">Add contact</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Save a public or authorized contact for this record. Clientra will not invent an email or phone.
      </p>
      <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
        {opportunityId ? <input type="hidden" name="opportunityId" value={opportunityId} /> : null}
        {websiteId ? <input type="hidden" name="websiteId" value={websiteId} /> : null}
        <div>
          <Label htmlFor="contact-name">Name</Label>
          <Input id="contact-name" name="fullName" placeholder="Name" />
        </div>
        <div>
          <Label htmlFor="contact-role">Role</Label>
          <Input id="contact-role" name="roleTitle" placeholder="Optional" />
        </div>
        <div>
          <Label htmlFor="contact-email">Email</Label>
          <Input id="contact-email" name="email" type="email" placeholder="name@company.com" />
        </div>
        <div>
          <Label htmlFor="contact-phone">Phone</Label>
          <Input id="contact-phone" name="phone" placeholder="Optional" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="contact-website">Website</Label>
          <Input id="contact-website" name="website" defaultValue={defaultWebsite ?? ""} placeholder="https://" />
        </div>
        <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save contact"}
          </Button>
          {message ? <p className="text-sm text-ink-muted">{message}</p> : null}
        </div>
      </form>
    </Card>
  );
}

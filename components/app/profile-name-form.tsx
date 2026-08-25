"use client";

import { useState } from "react";
import { updateProfileName } from "@/app/(app)/settings/actions";
import { Button, Input, Label } from "@/components/ui/primitives";

export function ProfileNameForm({ defaultName }: { defaultName: string }) {
  const [name, setName] = useState(defaultName);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit() {
    setPending(true);
    setMessage(null);
    const form = new FormData();
    form.set("fullName", name);
    const result = await updateProfileName(form);
    setPending(false);
    setMessage(result.ok ? "Saved. Outreach emails will sign with this name." : result.error ?? "Could not save");
  }

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="fullName">Name on outreach emails</Label>
        <Input id="fullName" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" />
      </div>
      <Button type="button" onClick={onSubmit} disabled={pending || !name.trim()}>
        {pending ? "Saving…" : "Save name"}
      </Button>
      {message ? <p className="text-sm text-ink-muted">{message}</p> : null}
    </div>
  );
}

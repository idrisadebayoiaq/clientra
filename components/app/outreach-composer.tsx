"use client";

import { useState } from "react";
import { Button, Label, Select, Textarea, Input } from "@/components/ui/primitives";
import { generateOutreachDraft, sendOutreachEmail } from "@/app/(app)/outreach/actions";

export function OutreachComposer({
  opportunityId,
  defaultContext,
  gmailReady,
}: {
  opportunityId?: string;
  defaultContext?: string;
  gmailReady: boolean;
}) {
  const [channel, setChannel] = useState("email");
  const [context, setContext] = useState(defaultContext ?? "");
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    setMessage(null);
    const form = new FormData();
    form.set("channel", channel);
    form.set("context", context);
    if (opportunityId) form.set("opportunityId", opportunityId);
    const result = await generateOutreachDraft(form);
    setLoading(false);
    if (!result.ok) {
      setMessage(result.error ?? "Could not generate a draft");
      return;
    }
    setSubject(result.subject);
    setBody(result.body);
  }

  async function sendEmail() {
    setLoading(true);
    setMessage(null);
    const form = new FormData();
    form.set("to", to);
    form.set("subject", subject);
    form.set("body", body);
    if (opportunityId) form.set("opportunityId", opportunityId);
    const result = await sendOutreachEmail(form);
    setLoading(false);
    setMessage(result.ok ? "Email sent through your connected Gmail account." : result.error ?? "Send failed");
  }

  async function copy() {
    await navigator.clipboard.writeText(body);
    setMessage("Message copied.");
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="channel">Channel</Label>
        <Select id="channel" value={channel} onChange={(event) => setChannel(event.target.value)}>
          <option value="email">Email</option>
          <option value="linkedin">LinkedIn</option>
          <option value="instagram">Instagram</option>
          <option value="facebook">Facebook</option>
          <option value="x">X</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="context">Context</Label>
        <Textarea
          id="context"
          value={context}
          onChange={(event) => setContext(event.target.value)}
          placeholder="Pain point, service, and any public context you verified."
        />
      </div>
      {channel === "email" ? (
        <div>
          <Label htmlFor="to">Recipient email</Label>
          <Input
            id="to"
            type="email"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            placeholder="Only use an address you already have permission to contact."
          />
        </div>
      ) : null}
      <div>
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" value={subject} onChange={(event) => setSubject(event.target.value)} />
      </div>
      <div>
        <Label htmlFor="body">Message</Label>
        <Textarea id="body" value={body} onChange={(event) => setBody(event.target.value)} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={generate} disabled={loading}>
          {loading ? "Working…" : "Generate message"}
        </Button>
        <Button type="button" variant="outline" onClick={copy} disabled={!body}>
          Copy Message
        </Button>
        {channel === "email" ? (
          <Button type="button" variant="secondary" onClick={sendEmail} disabled={loading || !gmailReady || !to || !body}>
            Send with Gmail
          </Button>
        ) : (
          <Button type="button" variant="ghost" disabled>
            Open Profile
          </Button>
        )}
      </div>
      {message ? <p className="text-sm text-ink-muted">{message}</p> : null}
      <p className="text-xs text-ink-subtle">
        Automatic sending is not enabled for social channels without an official API. Email send uses a connected Gmail account only.
      </p>
    </div>
  );
}

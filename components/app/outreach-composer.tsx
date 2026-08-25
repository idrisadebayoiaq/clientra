"use client";

import { useState } from "react";
import { Button, Label, Select, Textarea, Input } from "@/components/ui/primitives";
import { generateOutreachDraft, sendOutreachEmail } from "@/app/(app)/outreach/actions";
import { ContactDetails, type ContactSummary } from "@/components/app/contact-details";
import { parseSocialNotes } from "@/lib/opportunities/public-contact";

export function OutreachComposer({
  opportunityId,
  defaultContext,
  defaultTo,
  defaultSubject,
  defaultBody,
  defaultChannel,
  senderName,
  contact,
  gmailReady,
}: {
  opportunityId?: string;
  defaultContext?: string;
  defaultTo?: string;
  defaultSubject?: string;
  defaultBody?: string;
  defaultChannel?: string;
  senderName?: string;
  contact?: ContactSummary | null;
  gmailReady: boolean;
}) {
  const social = parseSocialNotes(contact?.notes);
  const [channel, setChannel] = useState(defaultChannel ?? (defaultTo ? "email" : social.linkedinUrl ? "linkedin" : "email"));
  const [context, setContext] = useState(defaultContext ?? "");
  const [to, setTo] = useState(defaultTo ?? "");
  const [signAs, setSignAs] = useState(senderName ?? "");
  const [subject, setSubject] = useState(defaultSubject ?? "");
  const [body, setBody] = useState(defaultBody ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    setMessage(null);
    const form = new FormData();
    form.set("channel", channel);
    form.set("context", context);
    form.set("senderName", signAs);
    if (opportunityId) form.set("opportunityId", opportunityId);
    const result = await generateOutreachDraft(form);
    setLoading(false);
    if (!result.ok) {
      setMessage(result.error ?? "Could not generate a draft");
      return;
    }
    setSubject(result.subject);
    setBody(result.body);
    if (result.to) setTo(result.to);
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

  const profileUrl =
    channel === "linkedin"
      ? social.linkedinUrl
      : channel === "facebook"
        ? social.facebookUrl
        : channel === "x"
          ? social.twitterUrl
          : null;

  return (
    <div className="space-y-4">
      {contact ? (
        <div className="rounded-xl border border-border bg-paper-muted/60 p-4">
          <h3 className="text-sm font-semibold">Public contact details</h3>
          <div className="mt-2">
            <ContactDetails contact={contact} />
          </div>
        </div>
      ) : (
        <p className="text-sm text-ink-muted">No public contact is stored for this record yet. Clientra will not invent an email address.</p>
      )}
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
        <Label htmlFor="signAs">Sign as</Label>
        <Input id="signAs" value={signAs} onChange={(event) => setSignAs(event.target.value)} />
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
            placeholder={contact?.email ? contact.email : "No public email stored. Paste an address you are allowed to contact."}
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
        ) : profileUrl ? (
          <Button type="button" variant="ghost" onClick={() => window.open(profileUrl, "_blank", "noopener,noreferrer")}>
            Open Profile
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

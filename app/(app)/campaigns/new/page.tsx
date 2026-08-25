"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppPageShell } from "@/components/app/page-shell";
import { Button, Card, Input, Label, Select, Textarea } from "@/components/ui/primitives";
import { createClient } from "@/lib/supabase/client";

export default function NewCampaignPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [service, setService] = useState("");
  const [template, setTemplate] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error: insertError } = await supabase.from("campaigns").insert({
      user_id: user.id,
      name,
      service,
      message_template: template,
      follow_up_sequence: [
        { step: 1, delayDays: 3 },
        { step: 2, delayDays: 7 },
        { step: 3, delayDays: 14 },
      ],
      approval_mode: "manual",
      status: "draft",
    });
    if (insertError) {
      setError(insertError.message);
      return;
    }
    router.push("/campaigns");
    router.refresh();
  }

  return (
    <AppPageShell title="New campaign" description="Campaigns start in draft. Automatic sending requires later explicit activation.">
      <Card className="p-5">
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <Label htmlFor="name">Campaign name</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="service">Service</Label>
            <Input id="service" value={service} onChange={(e) => setService(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="approval">Approval mode</Label>
            <Select id="approval" defaultValue="manual">
              <option value="manual">Manual</option>
              <option value="ai_approval">AI with approval</option>
              <option value="automatic">Automatic</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="template">Message template</Label>
            <Textarea id="template" value={template} onChange={(e) => setTemplate(e.target.value)} />
          </div>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit">Create draft</Button>
        </form>
      </Card>
    </AppPageShell>
  );
}

"use server";

import { revalidatePath } from "next/cache";
import { generateOutreach } from "@/lib/ai";
import { isOpenRouterConfigured } from "@/lib/env";
import { sendGmailMessage } from "@/lib/gmail/send";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function generateOutreachDraft(formData: FormData) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return { ok: false as const, error: "Sign in required" };
  if (!isOpenRouterConfigured()) {
    return { ok: false as const, error: "OpenRouter is not configured" };
  }

  const opportunityId = String(formData.get("opportunityId") ?? "");
  const channel = String(formData.get("channel") ?? "email");
  const extra = String(formData.get("context") ?? "").trim();

  const { data: opportunity } = opportunityId
    ? await supabase.from("opportunities").select("*").eq("id", opportunityId).maybeSingle()
    : { data: null };

  const prompt = `Write a short personalized ${channel} message.
Do not invent contact names, emails, metrics, or technical issues.
If evidence is thin, keep the note general and honest.

Opportunity:
${JSON.stringify(
  {
    title: opportunity?.title,
    company: opportunity?.company_name,
    domain: opportunity?.domain,
    need: opportunity?.estimated_need,
    industry: opportunity?.industry,
    location: opportunity?.location,
    service: opportunity?.matching_service,
    extra: extra || null,
  },
  null,
  2,
)}`;

  const body = await generateOutreach(prompt);
  const subject =
    opportunity?.company_name
      ? `Quick idea for ${opportunity.company_name}`
      : opportunity?.title
        ? `Regarding ${opportunity.title}`
        : "Introduction";

  const { data: draft } = await supabase
    .from("outreach_messages")
    .insert({
      user_id: user.id,
      opportunity_id: opportunity?.id ?? null,
      channel: channel === "linkedin" || channel === "instagram" || channel === "facebook" || channel === "x" || channel === "email" ? channel : "other",
      subject,
      body,
      status: "draft",
      service_offered: opportunity?.matching_service,
    })
    .select("id, subject, body")
    .single();

  revalidatePath("/outreach");
  return {
    ok: true as const,
    subject: draft?.subject ?? subject,
    body: draft?.body ?? body,
    draftId: draft?.id ?? null,
  };
}

export async function sendOutreachEmail(formData: FormData) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return { ok: false as const, error: "Sign in required" };

  const to = String(formData.get("to") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const opportunityId = String(formData.get("opportunityId") ?? "") || null;
  if (!to || !subject || !body) {
    return { ok: false as const, error: "Email, subject, and message are required." };
  }

  const sent = await sendGmailMessage(user.id, to, subject, body);
  if (!sent.ok) return { ok: false as const, error: sent.error };

  await supabase.from("outreach_messages").insert({
    user_id: user.id,
    opportunity_id: opportunityId,
    email_account_id: sent.emailAccountId,
    channel: "email",
    subject,
    body,
    status: "sent",
    sent_at: new Date().toISOString(),
    external_message_id: sent.externalMessageId,
    thread_id: sent.threadId,
  });

  if (opportunityId) {
    await supabase.from("opportunities").update({ status: "contacted" }).eq("id", opportunityId);
  }

  revalidatePath("/outreach");
  revalidatePath("/inbox");
  revalidatePath("/crm");
  return { ok: true as const };
}

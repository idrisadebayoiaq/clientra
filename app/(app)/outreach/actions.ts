"use server";

import { revalidatePath } from "next/cache";
import { isOpenRouterConfigured } from "@/lib/env";
import { sendGmailMessage } from "@/lib/gmail/send";
import { composeOutreachMessage, resolveSenderName } from "@/lib/outreach/compose";
import { clearOpportunityDrafts, enrichOpportunityContact } from "@/lib/outreach/workspace";
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
  const requestedName = String(formData.get("senderName") ?? "").trim();

  const [{ data: opportunity }, { data: profile }, { data: services }] = await Promise.all([
    opportunityId
      ? supabase.from("opportunities").select("*").eq("id", opportunityId).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("profiles").select("full_name, email").eq("id", user.id).maybeSingle(),
    supabase.from("user_services").select("custom_label, service_key").eq("user_id", user.id),
  ]);

  const { data: existingContact } = opportunity?.website_id
    ? await supabase
        .from("contacts")
        .select("*")
        .eq("website_id", opportunity.website_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : opportunity
      ? await supabase
          .from("contacts")
          .select("*")
          .eq("opportunity_id", opportunity.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : { data: null };

  const contact = opportunity
    ? await enrichOpportunityContact(supabase, user.id, opportunity, existingContact)
    : null;
  const senderName = requestedName || resolveSenderName(profile, user);
  const serviceLabels = (services ?? []).map((row) => row.custom_label || row.service_key.replace(/_/g, " "));

  if (opportunity?.id) {
    await clearOpportunityDrafts(supabase, opportunity.id);
  }

  const { subject, body } = await composeOutreachMessage({
    channel,
    senderName,
    senderEmail: profile?.email ?? user.email,
    services: serviceLabels,
    opportunity,
    contact,
    extra,
  });

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
    to: contact?.email ?? null,
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
    await clearOpportunityDrafts(supabase, opportunityId);
    await supabase.from("opportunities").update({ status: "contacted" }).eq("id", opportunityId);
    const { data: opportunity } = await supabase
      .from("opportunities")
      .select("website_id")
      .eq("id", opportunityId)
      .maybeSingle();
    revalidatePath("/analyze");
    if (opportunity?.website_id) revalidatePath(`/analyze/${opportunity.website_id}`);
    revalidatePath(`/analyze/${opportunityId}`);
  }

  revalidatePath("/outreach");
  revalidatePath("/inbox");
  revalidatePath("/crm");
  return { ok: true as const };
}

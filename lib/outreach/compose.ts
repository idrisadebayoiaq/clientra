import type { User } from "@supabase/supabase-js";
import { generateOutreach } from "@/lib/ai";
import type { ExtractedContact } from "@/lib/opportunities/public-contact";
import { resolveTargetCompanyName } from "@/lib/outreach/draft-helpers";
import { pitchContextForPrompt, type PitchContext } from "@/lib/outreach/pitch-context";

export function resolveSenderName(
  profile: { full_name?: string | null; email?: string | null } | null,
  user: Pick<User, "email" | "user_metadata">,
) {
  const meta = user.user_metadata ?? {};
  const fromMeta =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    "";
  const named = profile?.full_name?.trim() || fromMeta.trim();
  if (named) return named;
  const email = profile?.email || user.email || "";
  const local = email.split("@")[0] ?? "";
  if (!local) return "Clientra user";
  return local
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
}

export async function composeOutreachMessage(input: {
  channel: string;
  senderName: string;
  senderEmail?: string | null;
  services: string[];
  opportunity: {
    title?: string | null;
    company_name?: string | null;
    domain?: string | null;
    estimated_need?: string | null;
    industry?: string | null;
    location?: string | null;
    matching_service?: string | null;
    person_name?: string | null;
  } | null;
  contact: ExtractedContact | null;
  extra?: string;
  pitchContext?: PitchContext | null;
}) {
  const companyName = resolveTargetCompanyName({
    opportunity: input.opportunity,
    contact: input.contact,
  });
  const recipientName = input.contact?.fullName || input.opportunity?.person_name || companyName;
  const auditBlock = input.pitchContext ? pitchContextForPrompt(input.pitchContext) : input.extra || "";
  const prompt = `Write a short personalized ${input.channel} message the user can send now.

Rules:
- Sign the message with this exact sender name: ${input.senderName}
- Never use placeholders such as "(Your name)", "[Your Name]", "Your name", or "Best regards, Name".
- Do not invent contact names, emails, metrics, or technical issues.
- If evidence is thin, keep the note general and honest.
- Mention only this business: ${companyName}${input.opportunity?.domain ? ` (${input.opportunity.domain})` : ""}.
- Do not mention any other company, website, or domain from earlier drafts.
- Use the recipient's public name or company when available. Do not greet a specific person unless that name was provided.
${input.senderEmail ? `- The sender's email is ${input.senderEmail}. Do not put that in a To/recipient field.` : ""}

Sender: ${input.senderName}
Services they offer: ${input.services.join(", ") || "Not specified"}
Recipient: ${recipientName ?? "Unknown"}
Public contact: ${JSON.stringify({
    email: input.contact?.email ?? null,
    phone: input.contact?.phone ?? null,
    website: input.contact?.website ?? null,
    linkedin: input.contact?.linkedinUrl ?? null,
  })}
Opportunity:
${JSON.stringify(
  {
    title: input.opportunity?.title,
    company: companyName,
    domain: input.opportunity?.domain,
    need: input.opportunity?.estimated_need,
    industry: input.opportunity?.industry,
    location: input.opportunity?.location,
    service: input.opportunity?.matching_service,
    extra: input.extra || null,
  },
  null,
  2,
)}

${auditBlock ? `Audit & pitch evidence:\n${auditBlock}` : ""}`;

  const body = await generateOutreach(prompt);
  const cleaned = body
    .replace(/\(Your name\)/gi, input.senderName)
    .replace(/\[Your name\]/gi, input.senderName)
    .replace(/Best regards,\s*(Your name|\[Your name\]|\(Your name\))/gi, `Best regards,\n${input.senderName}`)
    .trim();
  const subject = `Quick idea for ${companyName}`;
  return { subject, body: cleaned };
}

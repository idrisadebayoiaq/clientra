import { complete } from "@/lib/ai/client";

export async function analyzeWebsite(input: string) {
  return complete(
    `You are a website auditor helping a freelancer pitch improvements to a business owner. Analyze only the evidence provided. Return JSON only.

Focus on gaps the business owner would care about: missing or weak web presence, SEO, mobile UX, speed, trust signals, conversion paths, outdated stack, poor contact discoverability, and opportunities to showcase reviews.

Include pitchAngles: specific outreach hooks tied to evidence and a service to offer.

${input}`,
    "default",
  );
}

export async function generateOutreach(input: string) {
  return complete(
    `Write a personalized outreach message for a freelancer pitching their services to a business owner.

Rules:
- Lead with a specific gap or opportunity from the audit evidence (what their website/business is lacking).
- Propose how you can help fix it — be concrete but honest.
- Do not invent metrics, contacts, or technical issues not in the evidence.
- Be concise, human, and non-spammy. No placeholder names.
- End with a soft call to action (quick call or reply).

${input}`,
    "default",
  );
}

export async function analyzeOpportunity(input: string) {
  return complete(`Analyze this opportunity. Do not invent contacts or facts.\n\n${input}`);
}

export async function scoreLead(input: string) {
  return complete(`Score 0-100 and explain why. Never present estimates as guaranteed facts.\n\n${input}`, "fast");
}

export async function extractPainPoints(input: string) {
  return complete(`Extract ranked pain points: Critical, High, Medium, Low.\n\n${input}`);
}

export async function analyzeReply(input: string) {
  return complete(`Classify the reply intent and extract questions, objections, sentiment, and next action.\n\n${input}`);
}

export async function generateReply(input: string) {
  return complete(`Draft a reply. Do not promise work you cannot do.\n\n${input}`);
}

export async function generateFollowUp(input: string) {
  return complete(`Write a short follow-up.\n\n${input}`, "fast");
}

export async function enrichLocalBusinessInsights(input: string) {
  return complete(
    `You are scoring outreach potential for a local business found on Google Maps. Return JSON only with keys:
- insights (string array, max 4 bullets about outreach opportunities)
- recommendedService (string — what the freelancer should pitch)
- opportunityScore (integer 0-100)
- pitchAngles (array of {angle, evidence, service} — specific hooks for outreach)

Use only the facts provided. Do not invent email, WhatsApp verification, or social handles. If no website, emphasize building web presence.

${input}`,
    "fast",
  );
}

export async function classifyIntent(input: string) {
  return complete(`Classify intent into one of: interested, very_interested, question, pricing_request, meeting_request, not_interested, not_now, wrong_person, out_of_office, spam, unclear.\n\n${input}`, "fast");
}

export async function recommendService(input: string) {
  return complete(`Recommend a matching service from the user's offerings. If unsure, say Unable to determine.\n\n${input}`, "fast");
}

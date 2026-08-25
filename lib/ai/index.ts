import { complete } from "@/lib/ai/client";

export async function analyzeWebsite(input: string) {
  return complete(`Analyze this website using only provided evidence. Label each finding Detected, Possible, or Unable to determine.\n\n${input}`, "reasoning");
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

export async function generateOutreach(input: string) {
  return complete(`Write a personalized outreach message. Be specific, concise, and non-spammy.\n\n${input}`);
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

export async function classifyIntent(input: string) {
  return complete(`Classify intent into one of: interested, very_interested, question, pricing_request, meeting_request, not_interested, not_now, wrong_person, out_of_office, spam, unclear.\n\n${input}`, "fast");
}

export async function recommendService(input: string) {
  return complete(`Recommend a matching service from the user's offerings. If unsure, say Unable to determine.\n\n${input}`, "fast");
}

export const AI_MODELS = {
  default: "anthropic/claude-sonnet-5",
  fast: "google/gemini-3.7-flash",
  reasoning: "anthropic/claude-opus-5",
} as const;

export const AI_MODEL_ROLES = {
  default: "Outreach, replies, opportunity analysis, and CRM writing",
  fast: "Scoring, intent classification, and follow-up drafts",
  reasoning: "Deep website analysis and high-stakes recommendations",
} as const;

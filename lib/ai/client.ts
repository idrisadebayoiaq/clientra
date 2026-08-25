import { getServerEnv, isOpenRouterConfigured, publicEnv } from "@/lib/env";
import { AI_MODELS } from "@/lib/ai/models";

export class AiNotConfiguredError extends Error {
  constructor() {
    super("OpenRouter is not configured");
    this.name = "AiNotConfiguredError";
  }
}

export function getModel(kind: "default" | "fast" | "reasoning" = "default") {
  const env = getServerEnv();
  if (kind === "fast") return env.aiFastModel || AI_MODELS.fast;
  if (kind === "reasoning") return env.aiReasoningModel || AI_MODELS.reasoning;
  return env.aiModel || AI_MODELS.default;
}

export async function complete(prompt: string, kind: "default" | "fast" | "reasoning" = "default") {
  if (!isOpenRouterConfigured()) throw new AiNotConfiguredError();
  const env = getServerEnv();
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.openRouterApiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": publicEnv.appUrl,
      "X-Title": "Clientra",
    },
    body: JSON.stringify({
      model: getModel(kind),
      temperature: kind === "fast" ? 0.2 : 0.4,
      messages: [
        {
          role: "system",
          content:
            "You are Clientra, an AI client-acquisition assistant. Use only provided evidence. Never invent contact details, metrics, or technical issues. If something is uncertain, say Unable to determine. Do not present estimates as guaranteed facts.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!response.ok) {
    throw new Error("AI provider request failed");
  }
  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return json.choices?.[0]?.message?.content ?? "";
}

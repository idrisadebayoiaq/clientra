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

class AiRequestError extends Error {
  retryable: boolean;
  constructor(message: string, retryable = false) {
    super(message);
    this.name = "AiRequestError";
    this.retryable = retryable;
  }
}

async function completeOnce(model: string, prompt: string, temperature: number) {
  const env = getServerEnv();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${env.openRouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": publicEnv.appUrl,
        "X-Title": "Clientra",
      },
      body: JSON.stringify({
        model,
        temperature,
        messages: [
          {
            role: "system",
            content:
              "You are Clientra, an AI client-acquisition assistant. Use only provided evidence. Never invent contact details, metrics, or technical issues. If something is uncertain, say Unable to determine. Do not present estimates as guaranteed facts. When asked for JSON, return JSON only.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });
    const raw = await response.text();
    let json: { error?: { message?: string }; choices?: { message?: { content?: string } }[] } = {};
    try {
      json = raw ? (JSON.parse(raw) as typeof json) : {};
    } catch {
      throw new AiRequestError(`AI provider request failed (${response.status})`, response.status >= 500);
    }
    if (!response.ok) {
      throw new AiRequestError(
        json.error?.message || `AI provider request failed (${response.status})`,
        response.status === 404 || response.status === 400 || response.status >= 500,
      );
    }
    const content = json.choices?.[0]?.message?.content ?? "";
    if (!content.trim()) throw new AiRequestError("AI provider returned an empty response", true);
    return content;
  } catch (error) {
    if (error instanceof AiRequestError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new AiRequestError("AI request timed out", false);
    }
    throw new AiRequestError(error instanceof Error ? error.message : "AI provider request failed", true);
  } finally {
    clearTimeout(timer);
  }
}

export async function complete(prompt: string, kind: "default" | "fast" | "reasoning" = "default") {
  if (!isOpenRouterConfigured()) throw new AiNotConfiguredError();
  const models = Array.from(new Set([getModel(kind), "openrouter/auto"]));
  const temperature = kind === "fast" ? 0.2 : 0.4;
  let lastError: Error | null = null;
  for (const [index, model] of models.entries()) {
    try {
      return await completeOnce(model, prompt, temperature);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("AI provider request failed");
      const retryable = error instanceof AiRequestError ? error.retryable : false;
      if (!retryable || index === models.length - 1) break;
    }
  }
  throw lastError ?? new Error("AI provider request failed");
}

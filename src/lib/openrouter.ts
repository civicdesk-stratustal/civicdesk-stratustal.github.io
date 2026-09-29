import { getServerEnv } from "./server-env";

const DEFAULT_MODELS = [
  "google/gemma-4-26b-a4b-it",
  "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen3-32b:free",
];

/** Ordered, server-configurable models. Never expose the OpenRouter key to the browser. */
export function openRouterModels() {
  const configured = getServerEnv("OPENROUTER_MODELS")
    ?.split(",")
    .map((model) => model.trim())
    .filter(Boolean);
  return configured?.length ? configured : DEFAULT_MODELS;
}

function shouldTryNext(status: number) {
  // 402 is credit exhaustion. 429 and provider 5xx responses are commonly
  // temporary capacity/limit failures; authentication and bad requests are not.
  return status === 402 || status === 429 || status >= 500;
}

export async function openRouterChat(body: Record<string, unknown>) {
  const apiKey = getServerEnv("OPENROUTER_API_KEY");
  if (!apiKey) throw new Error("The AI service is not configured yet.");

  let lastError = "";
  for (const model of openRouterModels()) {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": getServerEnv("APP_URL") ?? "https://civicdesk.stratustal.workers.dev",
        "X-Title": "CivicDesk",
      },
      body: JSON.stringify({
        ...body,
        model,
        provider: { data_collection: "deny" },
      }),
    });

    if (response.ok) return response;
    lastError = await response.text();
    console.error("OpenRouter model failed", { model, status: response.status, body: lastError });
    if (!shouldTryNext(response.status)) break;
  }
  throw new Error("The AI service is temporarily unavailable. Please try again shortly.");
}

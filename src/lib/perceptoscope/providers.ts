import type { ImageObservationInput, PerceptoscopeProviderName } from "./types";

export interface ProviderMessagePayload {
  system: string;
  prompt: string;
  images?: ImageObservationInput[];
  pdf?: {
    filename: string;
    dataUrl: string;
    useOcr: boolean;
  };
  temperature?: number;
  maxTokens?: number;
}

export interface ProviderResponse<T> {
  provider: PerceptoscopeProviderName;
  model: string;
  data: T;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
  error?: {
    message?: string;
  };
}

const DEFAULT_GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const DEFAULT_OPENROUTER_MODEL = "nvidia/nemotron-nano-12b-v2-vl:free";
const DEFAULT_PROVIDER_TIMEOUT_MS = 45_000;

export function hasGroqKey() {
  return Boolean(process.env.GROQ_KEY || process.env.GROQ_API_KEY);
}

export function hasOpenRouterKey() {
  return Boolean(process.env.OPEN_ROUTER_KEY || process.env.OPENROUTER_API_KEY);
}

export function chooseProvider(options: {
  needsPdfOcr?: boolean;
  hasImages?: boolean;
  preferred?: string | null;
}): PerceptoscopeProviderName {
  const preferred = normalizeProviderName(options.preferred) || normalizeProviderName(process.env.PERCEPTOSCOPE_PROVIDER);
  if (preferred === "OPENROUTER" && hasOpenRouterKey()) return "OPENROUTER";
  if (preferred === "GROQ" && hasGroqKey()) return "GROQ";
  if (preferred) {
    throw new Error(`PERCEPTOSCOPE_PROVIDER=${preferred} is configured, but its API key is missing.`);
  }
  if (options.needsPdfOcr && hasOpenRouterKey()) return "OPENROUTER";
  if (options.hasImages && hasGroqKey()) return "GROQ";
  if (hasOpenRouterKey()) return "OPENROUTER";
  if (hasGroqKey()) return "GROQ";
  throw new Error("Perceptoscope requires GROQ_KEY or OPEN_ROUTER_KEY in .env.local.");
}

export async function callPerceptoscopeModel<T>(
  provider: PerceptoscopeProviderName,
  payload: ProviderMessagePayload
): Promise<ProviderResponse<T>> {
  if (provider === "OPENROUTER") return callOpenRouter<T>(payload);
  return callGroq<T>(payload);
}

async function callGroq<T>(payload: ProviderMessagePayload): Promise<ProviderResponse<T>> {
  const key = process.env.GROQ_KEY || process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_KEY is not configured.");

  const model = process.env.PERCEPTOSCOPE_GROQ_MODEL || DEFAULT_GROQ_MODEL;
  const content = buildMultimodalContent(payload.prompt, payload.images);

  const response = await fetchWithTimeout("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: payload.system },
        { role: "user", content },
      ],
      temperature: payload.temperature ?? 0.2,
      max_completion_tokens: payload.maxTokens ?? 1800,
      response_format: { type: "json_object" },
    }),
  });

  const json = (await response.json()) as ChatCompletionResponse;
  if (!response.ok) {
    throw new Error(json.error?.message || `Groq request failed with status ${response.status}.`);
  }

  return {
    provider: "GROQ",
    model,
    data: parseCompletionJson<T>(json),
  };
}

async function callOpenRouter<T>(payload: ProviderMessagePayload): Promise<ProviderResponse<T>> {
  const key = process.env.OPEN_ROUTER_KEY || process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPEN_ROUTER_KEY is not configured.");

  const model = getOpenRouterModel();
  const pdf = shouldSendPdfFile(model) ? payload.pdf : undefined;
  const content = buildMultimodalContent(payload.prompt, payload.images, pdf);
  const plugins = pdf
    ? [{ id: "file-parser", pdf: { engine: pdf.useOcr ? "mistral-ocr" : "cloudflare-ai" } }]
    : undefined;
  const provider = buildOpenRouterRouting(model);

  const response = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "Suits & Stories Perceptoscope",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: payload.system },
        { role: "user", content },
      ],
      provider,
      plugins,
      temperature: payload.temperature ?? 0.2,
      max_tokens: payload.maxTokens ?? 1800,
      response_format: { type: "json_object" },
    }),
  });

  const json = (await response.json()) as ChatCompletionResponse;
  if (!response.ok) {
    throw new Error(json.error?.message || `OpenRouter request failed with status ${response.status}.`);
  }

  return {
    provider: "OPENROUTER",
    model,
    data: parseCompletionJson<T>(json),
  };
}

function buildMultimodalContent(
  prompt: string,
  images?: ImageObservationInput[],
  pdf?: { filename: string; dataUrl: string }
) {
  const content: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
    | { type: "file"; file: { filename: string; file_data: string } }
  > = [{ type: "text", text: prompt }];

  if (pdf) {
    content.push({
      type: "file",
      file: {
        filename: pdf.filename,
        file_data: pdf.dataUrl,
      },
    });
  }

  for (const image of images || []) {
    content.push({
      type: "image_url",
      image_url: { url: image.dataUrl },
    });
  }

  return content;
}

function normalizeProviderName(value?: string | null): PerceptoscopeProviderName | null {
  const normalized = value?.trim().toUpperCase();
  if (normalized === "OPENROUTER" || normalized === "GROQ") return normalized;
  return null;
}

function getOpenRouterModel() {
  if (process.env.PERCEPTOSCOPE_TEST_MODE === "true" && process.env.PERCEPTOSCOPE_OPENROUTER_TEST_MODEL) {
    return process.env.PERCEPTOSCOPE_OPENROUTER_TEST_MODEL;
  }

  return process.env.PERCEPTOSCOPE_OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL;
}

function buildOpenRouterRouting(model: string) {
  const requireParameters = process.env.PERCEPTOSCOPE_OPENROUTER_REQUIRE_PARAMETERS !== "false";
  const freeOnly =
    process.env.PERCEPTOSCOPE_OPENROUTER_FREE_ONLY === "true" ||
    model === "openrouter/free" ||
    model.endsWith(":free");

  if (!requireParameters && !freeOnly) return undefined;

  return {
    ...(requireParameters ? { require_parameters: true } : {}),
    ...(freeOnly ? { max_price: { prompt: 0, completion: 0, image: 0 } } : {}),
  };
}

function shouldSendPdfFile(model: string) {
  return !(process.env.PERCEPTOSCOPE_TEST_MODE === "true" && model.endsWith(":free"));
}

function parseCompletionJson<T>(json: ChatCompletionResponse): T {
  const content = json.choices?.[0]?.message?.content;
  const text = typeof content === "string"
    ? content
    : content?.map((part) => part.text || "").join("\n") || "";
  const cleaned = extractJsonObject(text);
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error("Model returned an invalid JSON diagnosis.");
  }
}

async function fetchWithTimeout(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timeoutMs = Number(process.env.PERCEPTOSCOPE_PROVIDER_TIMEOUT_MS || DEFAULT_PROVIDER_TIMEOUT_MS);
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Model provider request timed out after ${Math.round(timeoutMs / 1000)} seconds.`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function extractJsonObject(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}

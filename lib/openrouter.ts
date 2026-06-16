/**
 * OpenRouter provider: catalog fetching, model ranking, and chat completion.
 *
 * Uses expo/fetch instead of the React Native global fetch so that
 * res.body.getReader() streaming works on iOS.
 */

import { fetch } from "expo/fetch";

export const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

// Default timeout for non-streaming requests so a stalled connection surfaces
// as an error instead of hanging the UI indefinitely.
const REQUEST_TIMEOUT_MS = 30_000;

/**
 * Run an async request with an abort-based timeout. The streaming chat path
 * deliberately does NOT use this, since a stream can legitimately stay open
 * far longer than any single request timeout.
 */
async function withTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  ms = REQUEST_TIMEOUT_MS
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fn(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

// ---------- Catalog ----------

export type OpenRouterModel = {
  id: string;
  name: string;
  contextLength: number;
  promptPricePer1M: number;
  completionPricePer1M: number;
  isFree: boolean;
};

type RawORModel = {
  id: string;
  name?: string;
  context_length?: number;
  pricing?: { prompt?: string; completion?: string };
};

export function normalizeModel(raw: RawORModel): OpenRouterModel {
  const prompt = parseFloat(raw.pricing?.prompt ?? "0");
  const completion = parseFloat(raw.pricing?.completion ?? "0");
  return {
    id: raw.id,
    name: raw.name || raw.id,
    contextLength: raw.context_length ?? 0,
    promptPricePer1M: isNaN(prompt) ? 0 : prompt * 1_000_000,
    completionPricePer1M: isNaN(completion) ? 0 : completion * 1_000_000,
    isFree:
      (raw.pricing?.prompt === "0" ||
        raw.pricing?.prompt === "0.0" ||
        !raw.pricing?.prompt) &&
      (raw.pricing?.completion === "0" ||
        raw.pricing?.completion === "0.0" ||
        !raw.pricing?.completion),
  };
}

export async function fetchModelCatalog(): Promise<OpenRouterModel[]> {
  const res = await withTimeout((signal) =>
    fetch(`${OPENROUTER_BASE}/models`, {
      headers: { Accept: "application/json" },
      signal,
    })
  );
  if (!res.ok)
    throw new Error(`OpenRouter catalog fetch failed: ${res.status} ${res.statusText}`);
  const json = (await res.json()) as { data?: RawORModel[] };
  const raw: RawORModel[] = Array.isArray(json.data) ? json.data : [];
  return raw.map(normalizeModel);
}

export function rankModels(models: OpenRouterModel[]): OpenRouterModel[] {
  return [...models].sort((a, b) => {
    if (a.isFree !== b.isFree) return a.isFree ? -1 : 1;
    if (a.completionPricePer1M !== b.completionPricePer1M)
      return a.completionPricePer1M - b.completionPricePer1M;
    return b.contextLength - a.contextLength;
  });
}

// ---------- Chat completions ----------

export type ORMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatOpts = {
  temperature?: number;
  format?: object;
};

const APP_URL = "https://github.com/AnubisRooster/adaptive-tutor-ios";

function buildHeaders(apiKey: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "HTTP-Referer": APP_URL,
    "X-Title": "Adaptive Tutor",
  };
}

function buildBody(
  model: string,
  messages: ORMessage[],
  opts: ChatOpts,
  stream: boolean
): object {
  const body: Record<string, unknown> = {
    model,
    messages,
    stream,
    temperature: opts.temperature ?? 0.6,
  };
  if (opts.format) {
    body.response_format = {
      type: "json_schema",
      json_schema: { name: "output", schema: opts.format, strict: true },
    };
  }
  return body;
}

/** Stream a chat response from OpenRouter, yielding text chunks. */
export async function* openrouterChatStream(
  apiKey: string,
  model: string,
  messages: ORMessage[],
  opts: ChatOpts = {}
): AsyncGenerator<string> {
  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: buildHeaders(apiKey),
    body: JSON.stringify(buildBody(model, messages, opts, true)),
  });

  if (!res.ok || !res.body) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`OpenRouter error ${res.status}: ${errText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") return;
      try {
        const ev = JSON.parse(payload) as {
          choices?: { delta?: { content?: string } }[];
        };
        const chunk = ev.choices?.[0]?.delta?.content;
        if (chunk) yield chunk;
      } catch {
        /* skip malformed SSE lines */
      }
    }
  }
}

/** One-shot (non-streaming) chat completion from OpenRouter. */
export async function openrouterChatOnce(
  apiKey: string,
  model: string,
  messages: ORMessage[],
  opts: ChatOpts = {}
): Promise<string> {
  const res = await withTimeout((signal) =>
    fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: "POST",
      headers: buildHeaders(apiKey),
      body: JSON.stringify(buildBody(model, messages, opts, false)),
      signal,
    })
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`OpenRouter error ${res.status}: ${errText}`);
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return json.choices?.[0]?.message?.content ?? "";
}

/** Validate an OpenRouter API key by hitting the /auth/key endpoint. */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const res = await withTimeout((signal) =>
      fetch(`${OPENROUTER_BASE}/auth/key`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal,
      })
    );
    return res.ok;
  } catch {
    return false;
  }
}

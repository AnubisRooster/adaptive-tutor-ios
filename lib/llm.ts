/**
 * LLM dispatch layer for iOS.
 *
 * Supports two providers:
 *   "openrouter"  — cloud inference via OpenRouter; API key in iOS Keychain.
 *   "on-device"   — local GGUF inference via llama.rn + Metal GPU; no network.
 *
 * All call sites use streamChat / chatOnce / streamStructured — they never
 * need to know which provider is active.
 */

import type { Student } from "@/db/schema";
import { getStudent } from "@/lib/data";
import { getApiKey } from "@/lib/key-store";
import { openrouterChatStream, openrouterChatOnce } from "@/lib/openrouter";
import {
  onDeviceChatStream,
  onDeviceChatOnce,
  loadModel,
} from "@/lib/ondevice";

// ---------- Types ----------

export type LlmProvider = "openrouter" | "on-device";

export type LlmConfig =
  | { provider: "openrouter"; model: string; apiKey: string }
  | { provider: "on-device"; modelId: string };

export type LlmMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatOpts = {
  temperature?: number;
  format?: object;
};

// ---------- Config resolution ----------

/**
 * Resolve the LLM config for a student.
 * For on-device: ensures the model context is loaded before returning.
 * For OpenRouter: reads the API key from the Keychain.
 */
export async function resolveLlmConfig(student: Student): Promise<LlmConfig> {
  if (student.llmProvider === "on-device") {
    const modelId = student.ondeviceModel ?? "llama-3.2-3b-q4";
    await loadModel(modelId);
    return { provider: "on-device", modelId };
  }

  const apiKey = await getApiKey(student.id);
  if (!apiKey) {
    throw new Error(
      "No OpenRouter API key found. Go to Settings and enter your key."
    );
  }
  const model = student.openrouterModel ?? "google/gemma-3-27b-it:free";
  return { provider: "openrouter", model, apiKey };
}

/**
 * Resolve config from just a student ID. Used by generators that receive
 * a studentId rather than the full Student row.
 */
export async function resolveLlmConfigById(studentId: string): Promise<LlmConfig> {
  const student = getStudent(studentId);
  if (!student) throw new Error(`Student ${studentId} not found.`);
  return resolveLlmConfig(student);
}

// ---------- Inference helpers ----------

/** Stream a free-form chat response, yielding text chunks. */
export async function* streamChat(
  cfg: LlmConfig,
  messages: LlmMessage[],
  opts: ChatOpts = {}
): AsyncGenerator<string> {
  if (cfg.provider === "on-device") {
    yield* onDeviceChatStream(messages, { temperature: opts.temperature });
  } else {
    yield* openrouterChatStream(cfg.apiKey, cfg.model, messages, opts);
  }
}

/**
 * Stream a structured (JSON-constrained) response, yielding the full JSON
 * string as one chunk once the completion finishes.
 *
 * Note: on-device models do not support JSON schema enforcement via llama.rn,
 * so the response is collected as plain text and the caller must parse/validate.
 */
export async function* streamStructured(
  cfg: LlmConfig,
  messages: LlmMessage[],
  opts: ChatOpts = {}
): AsyncGenerator<string> {
  if (cfg.provider === "on-device") {
    const result = await onDeviceChatOnce(messages, {
      temperature: opts.temperature,
    });
    yield result;
  } else {
    const result = await openrouterChatOnce(cfg.apiKey, cfg.model, messages, opts);
    yield result;
  }
}

/** One-shot (non-streaming) chat completion. */
export async function chatOnce(
  cfg: LlmConfig,
  messages: LlmMessage[],
  opts: ChatOpts = {}
): Promise<string> {
  if (cfg.provider === "on-device") {
    return onDeviceChatOnce(messages, { temperature: opts.temperature });
  }
  return openrouterChatOnce(cfg.apiKey, cfg.model, messages, opts);
}

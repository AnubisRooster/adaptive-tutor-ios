/**
 * OpenRouter-only LLM dispatch layer for iOS.
 * All providers and structured outputs route through openrouter.ts.
 * The API key is read from the iOS Keychain (expo-secure-store), never from SQLite.
 */

import type { Student } from "@/db/schema";
import { getStudent } from "@/lib/data";
import { getApiKey } from "@/lib/key-store";
import { openrouterChatStream, openrouterChatOnce } from "@/lib/openrouter";

export type LlmProvider = "openrouter";

export type LlmConfig = {
  provider: LlmProvider;
  model: string;
  apiKey: string;
};

export type LlmMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatOpts = {
  temperature?: number;
  format?: object;
};

/**
 * Resolve the LLM config for a student. Reads the API key from Keychain.
 * Throws if no key is stored or no model has been selected.
 */
export async function resolveLlmConfig(student: Student): Promise<LlmConfig> {
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

/** Stream a free-form chat response, yielding text chunks. */
export async function* streamChat(
  cfg: LlmConfig,
  messages: LlmMessage[],
  opts: ChatOpts = {}
): AsyncGenerator<string> {
  yield* openrouterChatStream(cfg.apiKey, cfg.model, messages, opts);
}

/**
 * Stream a structured (JSON-constrained) response, yielding the full JSON
 * as one chunk once the completion finishes.
 */
export async function* streamStructured(
  cfg: LlmConfig,
  messages: LlmMessage[],
  opts: ChatOpts = {}
): AsyncGenerator<string> {
  const result = await openrouterChatOnce(cfg.apiKey, cfg.model, messages, opts);
  yield result;
}

/** One-shot (non-streaming) chat completion. */
export async function chatOnce(
  cfg: LlmConfig,
  messages: LlmMessage[],
  opts: ChatOpts = {}
): Promise<string> {
  return openrouterChatOnce(cfg.apiKey, cfg.model, messages, opts);
}

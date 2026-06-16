/**
 * Thin wrapper around expo-secure-store for per-student OpenRouter API key
 * storage. Keys live in the iOS Keychain — never in SQLite.
 */

import * as SecureStore from "expo-secure-store";

const PREFIX = "openrouter_key_";

function storeKey(studentId: string): string {
  return PREFIX + studentId;
}

export async function getApiKey(studentId: string): Promise<string | null> {
  return SecureStore.getItemAsync(storeKey(studentId));
}

export async function setApiKey(studentId: string, apiKey: string): Promise<void> {
  await SecureStore.setItemAsync(storeKey(studentId), apiKey);
}

export async function deleteApiKey(studentId: string): Promise<void> {
  await SecureStore.deleteItemAsync(storeKey(studentId));
}

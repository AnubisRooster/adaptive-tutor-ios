/**
 * First-run setup state for a student, stored in SecureStore (no DB migration).
 *
 * Tracks two per-student flags:
 *   - setup_done_{id}: whether the student finished the first-run setup screen.
 *   - cloud_consent_{id}: whether the student explicitly acknowledged that
 *     prompts/answers are sent to OpenRouter in Cloud mode.
 */

import * as SecureStore from "expo-secure-store";

const setupDoneKey = (studentId: string) => `setup_done_${studentId}`;
const cloudConsentKey = (studentId: string) => `cloud_consent_${studentId}`;

export async function needsSetup(studentId: string): Promise<boolean> {
  const done = await SecureStore.getItemAsync(setupDoneKey(studentId));
  return done !== "true";
}

export async function markSetupDone(studentId: string): Promise<void> {
  await SecureStore.setItemAsync(setupDoneKey(studentId), "true");
}

export async function hasCloudConsent(studentId: string): Promise<boolean> {
  const granted = await SecureStore.getItemAsync(cloudConsentKey(studentId));
  return granted === "true";
}

export async function grantCloudConsent(studentId: string): Promise<void> {
  await SecureStore.setItemAsync(cloudConsentKey(studentId), "true");
}
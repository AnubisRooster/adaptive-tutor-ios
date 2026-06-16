import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const LOCK_KEY = "biometric_lock_enabled";

export async function isBiometricAvailable(): Promise<boolean> {
  const [hw, enrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  return hw && enrolled;
}

export async function authenticateWithBiometrics(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Unlock Adaptive Tutor",
    fallbackLabel: "Use Passcode",
    disableDeviceFallback: false,
  });
  return result.success;
}

export async function getBiometricLockEnabled(): Promise<boolean> {
  const val = await SecureStore.getItemAsync(LOCK_KEY);
  return val === "true";
}

export async function setBiometricLockEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(LOCK_KEY, enabled ? "true" : "false");
}

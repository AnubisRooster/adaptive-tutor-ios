/* eslint-disable import/first */
jest.mock("expo-local-authentication", () => ({
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  authenticateAsync: jest.fn(),
}));

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import {
  isBiometricAvailable,
  authenticateWithBiometrics,
  getBiometricLockEnabled,
  setBiometricLockEnabled,
} from "@/lib/biometric";

const mockHasHardware = LocalAuthentication.hasHardwareAsync as jest.Mock;
const mockIsEnrolled = LocalAuthentication.isEnrolledAsync as jest.Mock;
const mockAuthenticate = LocalAuthentication.authenticateAsync as jest.Mock;
const mockGetItem = SecureStore.getItemAsync as jest.Mock;
const mockSetItem = SecureStore.setItemAsync as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe("isBiometricAvailable", () => {
  it("returns true when hardware is present and enrolled", async () => {
    mockHasHardware.mockResolvedValue(true);
    mockIsEnrolled.mockResolvedValue(true);
    await expect(isBiometricAvailable()).resolves.toBe(true);
  });

  it("returns false when hardware is present but not enrolled", async () => {
    mockHasHardware.mockResolvedValue(true);
    mockIsEnrolled.mockResolvedValue(false);
    await expect(isBiometricAvailable()).resolves.toBe(false);
  });

  it("returns false when no hardware", async () => {
    mockHasHardware.mockResolvedValue(false);
    mockIsEnrolled.mockResolvedValue(true);
    await expect(isBiometricAvailable()).resolves.toBe(false);
  });
});

describe("authenticateWithBiometrics", () => {
  it("returns true on successful authentication", async () => {
    mockAuthenticate.mockResolvedValue({ success: true });
    await expect(authenticateWithBiometrics()).resolves.toBe(true);
  });

  it("returns false when authentication is cancelled or fails", async () => {
    mockAuthenticate.mockResolvedValue({ success: false, error: "user_cancel" });
    await expect(authenticateWithBiometrics()).resolves.toBe(false);
  });

  it("passes the correct prompt message", async () => {
    mockAuthenticate.mockResolvedValue({ success: true });
    await authenticateWithBiometrics();
    expect(mockAuthenticate).toHaveBeenCalledWith(
      expect.objectContaining({ promptMessage: "Unlock Adaptive Tutor" })
    );
  });
});

describe("getBiometricLockEnabled", () => {
  it("returns false when nothing is stored", async () => {
    mockGetItem.mockResolvedValue(null);
    await expect(getBiometricLockEnabled()).resolves.toBe(false);
  });

  it("returns true when stored value is 'true'", async () => {
    mockGetItem.mockResolvedValue("true");
    await expect(getBiometricLockEnabled()).resolves.toBe(true);
  });

  it("returns false when stored value is 'false'", async () => {
    mockGetItem.mockResolvedValue("false");
    await expect(getBiometricLockEnabled()).resolves.toBe(false);
  });
});

describe("setBiometricLockEnabled", () => {
  it("saves 'true' string when enabled", async () => {
    mockSetItem.mockResolvedValue(undefined);
    await setBiometricLockEnabled(true);
    expect(mockSetItem).toHaveBeenCalledWith("biometric_lock_enabled", "true");
  });

  it("saves 'false' string when disabled", async () => {
    mockSetItem.mockResolvedValue(undefined);
    await setBiometricLockEnabled(false);
    expect(mockSetItem).toHaveBeenCalledWith("biometric_lock_enabled", "false");
  });
});

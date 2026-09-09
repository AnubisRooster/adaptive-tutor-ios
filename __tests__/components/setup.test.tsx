/* eslint-disable import/first */
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import SetupScreen from "@/app/setup";

const mockRouter = { replace: jest.fn(), push: jest.fn(), back: jest.fn() };

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));
jest.mock("@/lib/session", () => ({
  getActiveStudentId: jest.fn().mockResolvedValue("stu-1"),
}));
jest.mock("@/db", () => ({ db: {} }));
jest.mock("@/lib/data", () => ({
  getStudent: jest.fn().mockReturnValue({
    id: "stu-1", name: "Alice", color: "#6366f1", xp: 0, openrouterModel: null,
    ondeviceModel: "llama-3.2-3b-q4", pinHash: null, isAdmin: false, pacePref: "normal",
    tonePref: "encouraging", themePref: "system", llmProvider: "on-device",
    streakCount: 0, streakLastDay: null, shareStats: false, createdAt: 0, lastActiveAt: 0,
  }),
  updateStudentProvider: jest.fn(),
  updateStudentModel: jest.fn(),
  updateStudentOndeviceModel: jest.fn(),
}));
jest.mock("@/lib/ondevice", () => ({
  ON_DEVICE_MODELS: [
    { id: "llama-3.2-3b-q4", name: "Llama 3.2 3B (Q4_K_M)", description: "Best balance.", sizeBytes: 1_920_000_000, url: "https://example.com/model.gguf", recommended: true },
    { id: "llama-3.2-1b-q4", name: "Llama 3.2 1B (Q4_K_M)", description: "Fastest.", sizeBytes: 735_000_000, url: "https://example.com/1b.gguf", recommended: false },
  ],
  isModelDownloaded: jest.fn().mockResolvedValue(false),
  downloadModel: jest.fn().mockResolvedValue("/path/to/model.gguf"),
  formatBytes: (n: number) => `${(n / 1e9).toFixed(1)} GB`,
}));
jest.mock("@/lib/openrouter", () => ({
  validateApiKey: jest.fn().mockResolvedValue(true),
}));
jest.mock("@/lib/key-store", () => ({
  setApiKey: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/lib/setup", () => ({
  markSetupDone: jest.fn().mockResolvedValue(undefined),
  grantCloudConsent: jest.fn().mockResolvedValue(undefined),
  hasCloudConsent: jest.fn().mockResolvedValue(false),
}));

import { useRouter } from "expo-router";
import { markSetupDone } from "@/lib/setup";
import { isModelDownloaded, downloadModel } from "@/lib/ondevice";

const mockIsDownloaded = isModelDownloaded as jest.Mock;
const mockDownload = downloadModel as jest.Mock;
const mockMarkDone = markSetupDone as jest.Mock;

beforeEach(() => {
  (useRouter as jest.Mock).mockReturnValue(mockRouter);
  mockRouter.replace.mockClear();
  mockRouter.back.mockClear();
  mockIsDownloaded.mockResolvedValue(false);
  mockDownload.mockResolvedValue("/path/to/model.gguf");
  mockMarkDone.mockResolvedValue(undefined);
});

describe("SetupScreen", () => {
  it("shows the welcome step on first run", async () => {
    const { findByText } = await render(<SetupScreen />);
    expect(await findByText(/Welcome, Alice/)).toBeTruthy();
    expect(await findByText(/keeps your learning on this device/)).toBeTruthy();
  });

  it("can skip straight into preview mode", async () => {
    const { findByText } = await render(<SetupScreen />);
    await fireEvent.press(await findByText(/Not now/));
    await waitFor(() => expect(mockMarkDone).toHaveBeenCalledWith("stu-1"));
    expect(mockRouter.replace).toHaveBeenCalledWith("/learn");
  });

  it("lists on-device models with a download button", async () => {
    const { findByText, getByTestId } = await render(<SetupScreen />);
    await fireEvent.press(await findByText("Get started"));
    await findByText("Llama 3.2 3B (Q4_K_M)");
    expect(getByTestId("download-llama-3.2-3b-q4")).toBeTruthy();
    expect(getByTestId("download-llama-3.2-1b-q4")).toBeTruthy();
  });

  it("enables Continue only after a model is downloaded", async () => {
    mockIsDownloaded.mockResolvedValueOnce(true);
    const { findByText, findByTestId } = await render(<SetupScreen />);
    await fireEvent.press(await findByText("Get started"));
    await findByText("Llama 3.2 3B (Q4_K_M)");
    const continueBtn = await findByTestId("setup-continue");
    expect(continueBtn.props.accessibilityState?.disabled ?? continueBtn.props.disabled).toBe(false);
  });

  it("requires consent before validating an OpenRouter key", async () => {
    const { findByText, getByTestId, findByPlaceholderText } = await render(<SetupScreen />);
    await fireEvent.press(await findByText("Get started"));
    await fireEvent.press(getByTestId("provider-openrouter"));
    const input = await findByPlaceholderText("sk-or-v1-…");
    await fireEvent.changeText(input, "sk-or-v1-test-key-12345678");
    await fireEvent.press(getByTestId("setup-save-key"));
    await findByText(/consent/i);
  });

  it("grants consent and switches provider when consent is given and key is valid", async () => {
    const { findByText, getByTestId, findByPlaceholderText, findByTestId } = await render(<SetupScreen />);
    await fireEvent.press(await findByText("Get started"));
    await findByText("Llama 3.2 3B (Q4_K_M)");
    await fireEvent.press(getByTestId("provider-openrouter"));
    await fireEvent.press(await findByTestId("setup-consent-toggle"));
    const input = await findByPlaceholderText("sk-or-v1-…");
    await fireEvent.changeText(input, "sk-or-v1-test-key-12345678");
    await fireEvent.press(getByTestId("setup-save-key"));
    await findByText(/all set/);
  });

  it("marks setup done and navigates to /learn on finish", async () => {
    mockIsDownloaded.mockResolvedValueOnce(true);
    const { findByText, findByTestId } = await render(<SetupScreen />);
    await fireEvent.press(await findByText("Get started"));
    await fireEvent.press(await findByTestId("setup-continue"));
    const finish = await findByTestId("setup-finish");
    await fireEvent.press(finish);
    await waitFor(() => expect(mockMarkDone).toHaveBeenCalledWith("stu-1"));
    expect(mockRouter.replace).toHaveBeenCalledWith("/learn");
  });
});
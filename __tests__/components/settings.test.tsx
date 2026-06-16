/* eslint-disable import/first */
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import SettingsScreen from "@/app/settings";

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn() }),
}));
jest.mock("@/lib/session", () => ({
  getActiveStudentId: jest.fn().mockResolvedValue("stu-1"),
}));
jest.mock("@/lib/key-store", () => ({
  getApiKey: jest.fn().mockResolvedValue(null),
  setApiKey: jest.fn().mockResolvedValue(undefined),
  deleteApiKey: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/lib/openrouter", () => ({
  validateApiKey: jest.fn().mockResolvedValue(true),
  fetchModelCatalog: jest.fn().mockResolvedValue([]),
  rankModels: jest.fn().mockReturnValue([]),
}));
jest.mock("@/lib/data", () => ({
  getStudent: jest.fn().mockReturnValue({
    id: "stu-1", name: "Alice", openrouterModel: null,
    color: "#6366f1", pinHash: null, isAdmin: false, pacePref: "normal",
    tonePref: "encouraging", themePref: "system", llmProvider: "openrouter",
    xp: 0, streakCount: 0, streakLastDay: null, shareStats: false,
    createdAt: 0, lastActiveAt: 0,
  }),
  updateStudentModel: jest.fn(),
}));
jest.mock("@/db", () => ({ db: {} }));

import { validateApiKey, fetchModelCatalog, rankModels } from "@/lib/openrouter";
import { getApiKey, setApiKey } from "@/lib/key-store";

const mockValidate = validateApiKey as jest.Mock;
const mockGetKey = getApiKey as jest.Mock;
const mockSetKey = setApiKey as jest.Mock;

beforeEach(() => {
  mockValidate.mockResolvedValue(true);
  mockGetKey.mockResolvedValue(null);
  mockSetKey.mockResolvedValue(undefined);
  (fetchModelCatalog as jest.Mock).mockResolvedValue([]);
  (rankModels as jest.Mock).mockReturnValue([]);
});

describe("SettingsScreen", () => {
  it("renders the Settings title", async () => {
    const { findByText } = await render(<SettingsScreen />);
    await findByText(/Settings/);
  });

  it("shows 'No key stored' hint when no key exists", async () => {
    const { findByText } = await render(<SettingsScreen />);
    await findByText(/No key stored/);
  });

  it("renders the API key input field", async () => {
    const { findByPlaceholderText } = await render(<SettingsScreen />);
    await findByPlaceholderText("sk-or-v1-...");
  });

  it("shows error when submitting with an empty key", async () => {
    const { findByText } = await render(<SettingsScreen />);
    const btn = await findByText("Validate & Save");
    await fireEvent.press(btn);
    await findByText(/Please enter an API key/);
  });

  it("saves a valid key and shows success message", async () => {
    const { findByPlaceholderText, findByText } = await render(<SettingsScreen />);
    const input = await findByPlaceholderText("sk-or-v1-...");
    await fireEvent.changeText(input, "sk-or-v1-test-key-12345678");
    const btn = await findByText("Validate & Save");
    await fireEvent.press(btn);
    await waitFor(() => {
      expect(mockValidate).toHaveBeenCalledWith("sk-or-v1-test-key-12345678");
      expect(mockSetKey).toHaveBeenCalledWith("stu-1", "sk-or-v1-test-key-12345678");
    });
    await findByText("Key saved and validated.");
  });

  it("shows error on invalid key", async () => {
    mockValidate.mockResolvedValueOnce(false);
    const { findByPlaceholderText, findByText } = await render(<SettingsScreen />);
    const input = await findByPlaceholderText("sk-or-v1-...");
    await fireEvent.changeText(input, "sk-or-bad-key");
    const btn = await findByText("Validate & Save");
    await fireEvent.press(btn);
    await findByText(/Key rejected by OpenRouter/);
  });
});

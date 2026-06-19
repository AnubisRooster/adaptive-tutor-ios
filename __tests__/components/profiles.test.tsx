/* eslint-disable import/first */
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import ProfilesScreen from "@/app/index";

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));
jest.mock("@/lib/session", () => ({
  setActiveStudentId: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/db", () => ({ db: {} }));
jest.mock("@/lib/data", () => ({
  listStudents: jest.fn(),
  createStudent: jest.fn(),
  verifyPin: jest.fn(),
}));

import { listStudents, createStudent, verifyPin } from "@/lib/data";
import { setActiveStudentId } from "@/lib/session";

const mockList = listStudents as jest.Mock;
const mockCreate = createStudent as jest.Mock;
const mockVerify = verifyPin as jest.Mock;

beforeEach(() => {
  mockList.mockReturnValue([]);
  mockCreate.mockImplementation(() => {});
  mockVerify.mockReturnValue(true);
  (setActiveStudentId as jest.Mock).mockResolvedValue(undefined);
});

describe("ProfilesScreen", () => {
  it("renders the app title and 'Who's learning?' heading", async () => {
    const { getByText } = await render(<ProfilesScreen />);
    expect(getByText("Adaptive Tutor")).toBeTruthy();
    expect(getByText(/Who.*s learning\?/i)).toBeTruthy();
  });

  it("shows 'New profile' button when no profiles exist", async () => {
    const { getByText } = await render(<ProfilesScreen />);
    expect(getByText("New profile")).toBeTruthy();
  });

  it("renders existing profiles", async () => {
    mockList.mockReturnValue([
      { id: "s1", name: "Alice", color: "#6366f1", pinHash: null, isAdmin: false,
        pacePref: "normal", tonePref: "encouraging", themePref: "system",
        llmProvider: "openrouter", openrouterModel: null, ondeviceModel: null, xp: 0, streakCount: 0,
        streakLastDay: null, shareStats: false, createdAt: 0, lastActiveAt: 0 },
    ]);
    const { getByText } = await render(<ProfilesScreen />);
    expect(getByText("Alice")).toBeTruthy();
  });

  it("opens create modal when 'New profile' is pressed", async () => {
    const { getByText, findByText } = await render(<ProfilesScreen />);
    await fireEvent.press(getByText("New profile"));
    await findByText("Create a profile");
  });

  it("shows error when create is submitted with empty name", async () => {
    const { getByText, findAllByText } = await render(<ProfilesScreen />);
    await fireEvent.press(getByText("New profile"));
    await fireEvent.press(getByText("Start learning"));
    const errors = await findAllByText("Please enter a name.");
    expect(errors.length).toBeGreaterThan(0);
  });

  it("calls createStudent and navigates on valid creation", async () => {
    const created = {
      id: "s2", name: "Bob", color: "#ec4899", pinHash: null, isAdmin: false,
      pacePref: "normal", tonePref: "encouraging", themePref: "system",
      llmProvider: "openrouter", openrouterModel: null, ondeviceModel: null, xp: 0, streakCount: 0,
      streakLastDay: null, shareStats: false, createdAt: 0, lastActiveAt: 0,
    };
    mockList.mockReturnValueOnce([]).mockReturnValueOnce([created]);

    const { getByText, getByPlaceholderText } = await render(<ProfilesScreen />);
    await fireEvent.press(getByText("New profile"));
    await fireEvent.changeText(getByPlaceholderText("e.g. Maya"), "Bob");
    await fireEvent.press(getByText("Start learning"));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Bob" })
      );
    });
  });

  it("shows PIN prompt when selecting a PIN-protected profile", async () => {
    mockList.mockReturnValue([
      { id: "s3", name: "Carol", color: "#10b981", pinHash: "hash123", isAdmin: false,
        pacePref: "normal", tonePref: "encouraging", themePref: "system",
        llmProvider: "openrouter", openrouterModel: null, ondeviceModel: null, xp: 0, streakCount: 0,
        streakLastDay: null, shareStats: false, createdAt: 0, lastActiveAt: 0 },
    ]);
    const { getByText, findByText } = await render(<ProfilesScreen />);
    await fireEvent.press(getByText("Carol"));
    await findByText(/Enter PIN for Carol/);
  });
});

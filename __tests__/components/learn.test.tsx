/* eslint-disable import/first */
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import LearnScreen from "@/app/learn";

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn() }),
}));
jest.mock("@/lib/session", () => ({
  getActiveStudentId: jest.fn().mockResolvedValue("stu-1"),
  clearActiveStudentId: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/db", () => ({ db: {} }));
jest.mock("@/lib/data", () => ({
  getStudent: jest.fn().mockReturnValue({
    id: "stu-1", name: "Alice", color: "#6366f1", pinHash: null, isAdmin: false,
    pacePref: "normal", tonePref: "encouraging", themePref: "system",
    llmProvider: "openrouter", openrouterModel: null, ondeviceModel: null, xp: 0, streakCount: 0,
    streakLastDay: null, shareStats: false, createdAt: 0, lastActiveAt: 0,
  }),
  listSubjects: jest.fn().mockReturnValue([
    { id: "philosophy", name: "Philosophy", description: "Reasoning about knowledge.", framing: "", orderIndex: 0 },
  ]),
  listTopics: jest.fn().mockReturnValue([
    { id: "t1", subjectId: "philosophy", name: "Epistemology", description: "Study of knowledge.", prerequisites: "[]", subtopics: "[]", orderIndex: 0 },
    { id: "t2", subjectId: "philosophy", name: "Ethics", description: "Study of morality.", prerequisites: "[]", subtopics: "[]", orderIndex: 1 },
  ]),
  getMasteryMap: jest.fn().mockReturnValue(new Map()),
  listOpenGaps: jest.fn().mockReturnValue([]),
  getTopicSubtopics: jest.fn().mockReturnValue([]),
  getOrCreateSession: jest.fn().mockReturnValue({ id: "sess-1", studentId: "stu-1", subjectId: "philosophy", startedAt: 0, lastActiveAt: 0 }),
  getRecentMessages: jest.fn().mockReturnValue([]),
  addMessage: jest.fn(),
}));
jest.mock("@/lib/orchestrator", () => ({
  buildTutorTurn: jest.fn().mockResolvedValue({ messages: [], topicName: "Epistemology", subjectName: "Philosophy" }),
}));
jest.mock("@/lib/llm", () => ({
  resolveLlmConfig: jest.fn(),
  streamChat: jest.fn(),
}));
jest.mock("@/lib/adaptive", () => ({
  recommendStartTopic: jest.fn().mockReturnValue(null),
}));
jest.mock("@/lib/gamify", () => ({
  XP_TEACH: 5,
  addXp: jest.fn(),
  awardForTeach: jest.fn().mockReturnValue({ totalXp: 10, streak: 1 }),
}));

import { streamChat, resolveLlmConfig } from "@/lib/llm";

const mockStream = streamChat as jest.Mock;
const mockResolve = resolveLlmConfig as jest.Mock;

async function* fakeStream() { yield "Hello from the tutor!"; }

beforeEach(() => {
  mockStream.mockImplementation(fakeStream);
  mockResolve.mockResolvedValue({ provider: "openrouter", model: "google/gemma-3-27b-it:free", apiKey: "sk-test" });
});

describe("LearnScreen", () => {
  it("renders the subject name in the header after loading", async () => {
    const { findByText } = await render(<LearnScreen />);
    await findByText("Philosophy");
  });

  it("renders the first topic name in the topic bar", async () => {
    const { findByText } = await render(<LearnScreen />);
    await findByText("Epistemology");
  });

  it("renders 'Teach me', 'Review', and 'Quiz me' action buttons", async () => {
    const { findByText } = await render(<LearnScreen />);
    await findByText("Teach me");
    await findByText("Review");
    await findByText("Quiz me");
  });

  it("shows empty state when no messages", async () => {
    const { findByText } = await render(<LearnScreen />);
    await findByText("Ready when you are.");
  });

  it("opens topic drawer when menu button is pressed", async () => {
    const { getByTestId, findByText } = await render(<LearnScreen />);
    await findByText("Philosophy"); // wait for load
    await fireEvent.press(getByTestId("menu-btn"));
    await findByText("Topics");
    await findByText("Ethics");
  });

  it("streams a tutor response when 'Teach me' is pressed", async () => {
    const { findByText } = await render(<LearnScreen />);
    const btn = await findByText("Teach me");
    await fireEvent.press(btn);
    await waitFor(() => expect(mockStream).toHaveBeenCalled(), { timeout: 3000 });
    await findByText(/Hello from the tutor!/);
  });

  it("shows API key error banner when no key is set", async () => {
    mockResolve.mockRejectedValueOnce(new Error("No OpenRouter API key found. Go to Settings and enter your key."));
    const { findByText } = await render(<LearnScreen />);
    const btn = await findByText("Teach me");
    await fireEvent.press(btn);
    await waitFor(() => findByText(/No API key set/), { timeout: 3000 });
  });
});

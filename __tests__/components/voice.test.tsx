/* eslint-disable import/first, @typescript-eslint/no-require-imports */
import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import VoiceScreen from "@/app/voice";

const listeners: Record<string, (event?: unknown) => void> = {};

jest.mock("expo-router", () => {
  const ctx = { replace: jest.fn(), push: jest.fn(), back: jest.fn() };
  const ReactActual = jest.requireActual("react");
  return {
    useRouter: () => ctx,
    useLocalSearchParams: () => ({}),
    useFocusEffect: (cb: () => void) => {
      ReactActual.useEffect(() => {
        cb();
      }, [cb]);
    },
    __getRouter: () => ctx,
  };
});

jest.mock("expo-speech-recognition", () => ({
  ExpoSpeechRecognitionModule: {
    start: jest.fn(),
    abort: jest.fn(),
    stop: jest.fn(),
    requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  },
  useSpeechRecognitionEvent: (name: string, cb: (e?: unknown) => void) => {
    listeners[name] = cb;
  },
}));

jest.mock("@/lib/session", () => ({
  getActiveStudentId: jest.fn().mockResolvedValue("stu-1"),
}));
jest.mock("@/db", () => ({ db: {} }));
jest.mock("@/lib/data", () => ({
  getStudent: jest.fn(() => ({
    id: "stu-1",
    name: "Alice",
    color: "#6366f1",
    pinHash: null,
    isAdmin: false,
    pacePref: "normal",
    tonePref: "encouraging",
    themePref: "system",
    llmProvider: "openrouter",
    openrouterModel: "google/gemma-3-27b-it:free",
    ondeviceModel: null,
    voiceSpeakReplies: false,
    xp: 0,
    streakCount: 0,
    streakLastDay: null,
    shareStats: false,
    createdAt: 0,
    lastActiveAt: 0,
  })),
  listSubjects: jest.fn(() => [{ id: "bio", name: "Biology" }]),
  listTopics: jest.fn(() => [{ id: "t1", name: "Photosynthesis" }]),
  getOrCreateSession: jest.fn(() => ({ id: "session-1" })),
  getRecentMessages: jest.fn(() => []),
  addMessage: jest.fn(),
}));
jest.mock("@/lib/orchestrator", () => ({
  buildTutorTurn: jest.fn().mockResolvedValue({
    messages: [{ role: "system", content: "sys" }],
    topicName: "Photosynthesis",
    subjectName: "Biology",
  }),
}));

jest.mock("@/lib/llm", () => ({
  resolveLlmConfigById: jest.fn().mockResolvedValue({ provider: "openrouter", model: "m", apiKey: "k" }),
  streamChat: jest.fn(),
  isProviderUnavailable: jest.fn().mockReturnValue(false),
}));
jest.mock("@/lib/preview", () => ({ previewTutorTurn: jest.fn().mockReturnValue("Preview text.") }));
jest.mock("@/lib/gamify", () => ({ awardForTeach: jest.fn().mockReturnValue({ totalXp: 5, streak: 1 }) }));
jest.mock("@/lib/voice", () => ({
  speakText: jest.fn().mockResolvedValue(undefined),
  stopSpeaking: jest.fn().mockResolvedValue(undefined),
}));

import { getStudent, addMessage } from "@/lib/data";
import { streamChat } from "@/lib/llm";
import { getActiveStudentId } from "@/lib/session";
import { speakText } from "@/lib/voice";
import { ExpoSpeechRecognitionModule } from "expo-speech-recognition";

const mockGetStudent = getStudent as jest.Mock;
const mockAddMessage = addMessage as jest.Mock;
const mockGetActiveStudentId = getActiveStudentId as jest.Mock;
const mockStreamChat = streamChat as jest.Mock;
const mockSpeakText = speakText as jest.Mock;
const mockStart = ExpoSpeechRecognitionModule.start as jest.Mock;
const mockAbort = ExpoSpeechRecognitionModule.abort as jest.Mock;
const mockRequestPerms = ExpoSpeechRecognitionModule.requestPermissionsAsync as jest.Mock;
const router = (
  require("expo-router") as { __getRouter: () => { replace: jest.Mock; push: jest.Mock; back: jest.Mock } }
).__getRouter();

function fireResult(finalText: string) {
  const cb = listeners.result;
  if (!cb) return;
  cb({ isFinal: true, results: [{ transcript: finalText }] });
}

// React 19 defers the multi-await turn-handling chain to macrotask yields, so
// pump the event loop inside act() to let the whole chain and its re-renders
// settle deterministic.
async function flushChain(rounds = 40) {
  for (let i = 0; i < rounds; i++) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1));
    });
  }
}

beforeEach(() => {
  for (const key of Object.keys(listeners)) delete listeners[key];
  mockGetActiveStudentId.mockResolvedValue("stu-1");
  mockGetStudent.mockReturnValue({
    id: "stu-1",
    name: "Alice",
    color: "#6366f1",
    llmProvider: "openrouter",
    voiceSpeakReplies: false,
  });
  mockAddMessage.mockClear();
  mockStreamChat.mockClear();
  mockStreamChat.mockImplementation(async function* () {
    yield "Light is converted ";
    yield "into energy.";
  });
  mockStart.mockClear();
  mockAbort.mockClear();
  mockSpeakText.mockClear();
  mockRequestPerms.mockResolvedValue({ granted: true });
  router.replace.mockClear();
  router.push.mockClear();
  router.back.mockClear();
});

describe("VoiceScreen", () => {
  it("redirects to home when no active student exists", async () => {
    mockGetActiveStudentId.mockResolvedValue(null);
    await render(<VoiceScreen />);
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
  });

  it("shows an empty hands-free prompt", async () => {
    const { findByTestId, findByText } = await render(<VoiceScreen />);
    await findByTestId("voice-prompt");
    await findByText(/Tap to start talking/);
    await findByText(/Talk to your tutor\./);
  });

  it("starts listening when the mic is tapped", async () => {
    const { findByTestId } = await render(<VoiceScreen />);
    await fireEvent.press(await findByTestId("voice-mic"));
    await waitFor(() => expect(mockStart).toHaveBeenCalled());
    expect(mockStart.mock.calls[0][0]).toMatchObject({
      lang: "en-US",
      continuous: false,
      addsPunctuation: true,
    });
  });

  it("streams a tutor reply after a final utterance and persists it", async () => {
    const { findByText, findByTestId } = await render(<VoiceScreen />);
    await findByText(/Tap to start talking/);
    await fireEvent.press(await findByTestId("voice-mic"));
    await waitFor(() => expect(mockStart).toHaveBeenCalled());
    fireResult("Why do plants need light?");
    await flushChain();
    await findByText(/Light is converted into energy\./);
    await findByText(/Why do plants need light\?/);
    expect(mockAddMessage).toHaveBeenCalledTimes(2);
    expect(mockAddMessage.mock.calls[0][0]).toMatchObject({
      role: "user",
      content: "Why do plants need light?",
    });
    expect(mockAddMessage.mock.calls[1][0]).toMatchObject({ role: "assistant" });
  });

  it("speaks the reply when Speak replies is enabled", async () => {
    mockGetStudent.mockReturnValue({
      id: "stu-1",
      name: "Alice",
      color: "#6366f1",
      llmProvider: "openrouter",
      voiceSpeakReplies: true,
    });
    const { findByText, findByTestId } = await render(<VoiceScreen />);
    await findByText(/Tap to start talking/);
    await fireEvent.press(await findByTestId("voice-mic"));
    await waitFor(() => expect(mockStart).toHaveBeenCalled());
    fireResult("Explain photosynthesis");
    await flushChain();
    expect(mockSpeakText).toHaveBeenCalledWith("Light is converted into energy.");
  });

  it("stops the loop when the mic is tapped again", async () => {
    const { findByTestId } = await render(<VoiceScreen />);
    await fireEvent.press(await findByTestId("voice-mic"));
    await waitFor(() => expect(mockStart).toHaveBeenCalled());
    await fireEvent.press(await findByTestId("voice-mic"));
    expect(mockAbort).toHaveBeenCalled();
  });
});
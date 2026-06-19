/* eslint-disable import/first */
import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import QuizScreen from "@/app/quiz";

const mockRouter = { replace: jest.fn(), push: jest.fn(), back: jest.fn() };

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn().mockReturnValue({ subjectId: "philosophy", topicId: "t1" }),
}));
jest.mock("@/lib/session", () => ({
  getActiveStudentId: jest.fn().mockResolvedValue("stu-1"),
}));
jest.mock("@/db", () => ({ db: {} }));
jest.mock("@/lib/data", () => ({
  getStudent: jest.fn().mockReturnValue({
    id: "stu-1", name: "Alice", color: "#6366f1", xp: 0, openrouterModel: null,
    ondeviceModel: null, pinHash: null, isAdmin: false, pacePref: "normal", tonePref: "encouraging",
    themePref: "system", llmProvider: "openrouter", streakCount: 0, streakLastDay: null,
    shareStats: false, createdAt: 0, lastActiveAt: 0,
  }),
  getSubject: jest.fn().mockReturnValue({ id: "philosophy", name: "Philosophy" }),
  getTopic: jest.fn().mockReturnValue({ id: "t1", name: "Epistemology", description: "Study of knowledge." }),
  getMastery: jest.fn().mockReturnValue({ mastery: 0.4, bloomLevel: 2, attempts: 3, correct: 2 }),
}));
jest.mock("@/lib/llm", () => ({
  resolveLlmConfig: jest.fn().mockResolvedValue({ provider: "openrouter", model: "test", apiKey: "sk-test" }),
}));
jest.mock("@/lib/quiz-gen", () => ({
  generateQuizQuestion: jest.fn(),
}));
jest.mock("@/lib/grader", () => ({
  gradeAnswer: jest.fn(),
}));
jest.mock("@/lib/adaptive", () => ({
  applyGrade: jest.fn(),
}));
jest.mock("@/lib/gamify", () => ({
  awardForGrade: jest.fn(),
  levelForXp: jest.fn().mockReturnValue({ level: 1, title: "Novice", levelFloorXp: 0, nextLevelXp: 50 }),
}));

import { useRouter } from "expo-router";
import { generateQuizQuestion } from "@/lib/quiz-gen";
import { gradeAnswer } from "@/lib/grader";
import { applyGrade } from "@/lib/adaptive";
import { awardForGrade } from "@/lib/gamify";

const mockGenerate = generateQuizQuestion as jest.Mock;
const mockGrade = gradeAnswer as jest.Mock;
const mockApply = applyGrade as jest.Mock;
const mockAward = awardForGrade as jest.Mock;

const QUESTION = {
  question: "What is justified true belief?",
  bloomLevel: 2,
  idealAnswerOutline: "A belief that is true and for which the holder has adequate justification.",
};

const GRADE = {
  correct: true,
  score: 0.85,
  misconceptions: [],
  masteryDelta: 0.1,
  nextRecommendation: "advance" as const,
  feedbackForStudent: "You correctly identified the core concepts.",
};

const APPLY_RESULT = {
  mastery: { mastery: 0.6, bloomLevel: 2, attempts: 4, correct: 3, progress: "{}", studentId: "stu-1", topicId: "t1", updatedAt: 0 },
  leveledUp: false,
  next: { topicId: "t2", topicName: "Ethics", reason: "advance" as const, note: "Ready to advance." },
};

const GAMIFY_RESULT = {
  xpGained: 10,
  totalXp: 60,
  prevLevel: { level: 1, title: "Novice", levelFloorXp: 0, nextLevelXp: 50 },
  newLevel: { level: 2, title: "Apprentice", levelFloorXp: 50, nextLevelXp: 150 },
  leveledUpLevel: true,
  newBadges: [],
  streak: 1,
};

beforeEach(() => {
  (useRouter as jest.Mock).mockReturnValue(mockRouter);
  mockRouter.replace.mockClear();
  mockRouter.push.mockClear();
  mockRouter.back.mockClear();
  mockGenerate.mockResolvedValue(QUESTION);
  mockGrade.mockResolvedValue(GRADE);
  mockApply.mockReturnValue(APPLY_RESULT);
  mockAward.mockReturnValue(GAMIFY_RESULT);
});

describe("QuizScreen", () => {
  it("shows generating spinner on initial load", async () => {
    // Make generate never resolve so the component stays in "init" phase
    mockGenerate.mockImplementationOnce(() => new Promise(() => {}));
    const { getByTestId } = await render(<QuizScreen />);
    expect(getByTestId("phase-init")).toBeTruthy();
  });

  it("shows the question after generation completes", async () => {
    const { findByText } = await render(<QuizScreen />);
    await findByText("What is justified true belief?");
  });

  it("submit button is disabled when answer is empty", async () => {
    const { findByTestId } = await render(<QuizScreen />);
    await findByTestId("answer-input"); // wait for question to load
    const btn = await findByTestId("submit-btn");
    expect(btn.props.accessibilityState?.disabled ?? btn.props.disabled).toBeTruthy();
  });

  it("submit button enabled after typing an answer", async () => {
    const { findByTestId } = await render(<QuizScreen />);
    const input = await findByTestId("answer-input");
    await fireEvent.changeText(input, "A belief that is both true and justified.");
    const btn = await findByTestId("submit-btn");
    expect(btn.props.accessibilityState?.disabled ?? btn.props.disabled).toBeFalsy();
  });

  it("shows grade result after submitting an answer", async () => {
    const { findByTestId, findByText } = await render(<QuizScreen />);
    const input = await findByTestId("answer-input");
    await fireEvent.changeText(input, "Justified true belief is a belief that is true and justified.");
    await fireEvent.press(await findByTestId("submit-btn"));
    await findByTestId("phase-result");
    await findByText("You correctly identified the core concepts.");
  });

  it("shows level-up message when player levels up", async () => {
    const { findByTestId, findByText } = await render(<QuizScreen />);
    const input = await findByTestId("answer-input");
    await fireEvent.changeText(input, "Some answer about knowledge.");
    await fireEvent.press(await findByTestId("submit-btn"));
    await findByTestId("phase-result");
    await findByText(/Level up/);
  });

  it("continue button calls router.back", async () => {
    const { findByTestId } = await render(<QuizScreen />);
    const input = await findByTestId("answer-input");
    await fireEvent.changeText(input, "Answer text here.");
    await fireEvent.press(await findByTestId("submit-btn"));
    const continueBtn = await findByTestId("continue-btn");
    await fireEvent.press(continueBtn);
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it("shows error state when question generation fails", async () => {
    mockGenerate.mockRejectedValueOnce(new Error("LLM unavailable"));
    const { findByTestId } = await render(<QuizScreen />);
    await findByTestId("phase-error");
  });
});

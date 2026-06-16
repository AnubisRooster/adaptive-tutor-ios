/* eslint-disable import/first */
import { gradeAnswer } from "@/lib/grader";

jest.mock("@/lib/data", () => ({
  getStudent: jest.fn().mockReturnValue({
    id: "stu-1", name: "Alice", openrouterModel: "google/gemma-3-27b-it:free",
    xp: 0, streakCount: 0, streakLastDay: null,
  }),
  getSubject: jest.fn().mockReturnValue({ id: "philosophy", name: "Philosophy" }),
  getTopic: jest.fn().mockReturnValue({ id: "t1", name: "Epistemology", description: "Study of knowledge." }),
}));

jest.mock("@/lib/llm", () => ({
  chatOnce: jest.fn(),
  resolveLlmConfigById: jest.fn().mockResolvedValue({
    provider: "openrouter", model: "google/gemma-3-27b-it:free", apiKey: "sk-test",
  }),
}));

import { chatOnce } from "@/lib/llm";
const mockChat = chatOnce as jest.Mock;

const QUESTION = {
  question: "What is justified true belief?",
  bloomLevel: 2,
  idealAnswerOutline: "A belief that is true and for which the holder has adequate justification.",
};

const VALID_GRADE = JSON.stringify({
  correct: true,
  score: 0.85,
  misconceptions: [],
  masteryDelta: 0.1,
  nextRecommendation: "advance",
  feedbackForStudent: "You correctly identified the core components. Well done!",
});

beforeEach(() => {
  mockChat.mockClear();
  mockChat.mockResolvedValue(VALID_GRADE);
});

it("returns a parsed Grade when model responds correctly", async () => {
  const grade = await gradeAnswer({
    studentId: "stu-1",
    subjectId: "philosophy",
    topicId: "t1",
    question: QUESTION,
    studentAnswer: "Justified true belief is a belief that is true and that we have good reason to hold.",
  });
  expect(grade.correct).toBe(true);
  expect(grade.score).toBe(0.85);
  expect(grade.feedbackForStudent).toContain("Well done");
  expect(mockChat).toHaveBeenCalledTimes(1);
});

it("throws when student answer is empty", async () => {
  await expect(
    gradeAnswer({
      studentId: "stu-1", subjectId: "philosophy", topicId: "t1",
      question: QUESTION, studentAnswer: "   ",
    })
  ).rejects.toThrow("Student answer is empty");
});

it("passes the question text to chatOnce", async () => {
  await gradeAnswer({
    studentId: "stu-1", subjectId: "philosophy", topicId: "t1",
    question: QUESTION,
    studentAnswer: "It is a belief that is both true and justified.",
  });
  const userMsg = mockChat.mock.calls[0][1].find((m: { role: string }) => m.role === "user");
  expect(userMsg.content).toContain("What is justified true belief?");
  expect(userMsg.content).toContain("Epistemology");
});

it("throws when model returns invalid JSON grade", async () => {
  mockChat.mockResolvedValueOnce('{"correct": true}'); // missing required fields
  await expect(
    gradeAnswer({
      studentId: "stu-1", subjectId: "philosophy", topicId: "t1",
      question: QUESTION, studentAnswer: "Some answer here.",
    })
  ).rejects.toThrow("invalid grade");
});

it("uses provided cfg instead of resolving by id", async () => {
  const cfg = { provider: "openrouter" as const, model: "custom-model", apiKey: "sk-custom" };
  await gradeAnswer({
    studentId: "stu-1", subjectId: "philosophy", topicId: "t1",
    question: QUESTION, studentAnswer: "Some answer.", cfg,
  });
  expect(mockChat.mock.calls[0][0]).toEqual(cfg);
});

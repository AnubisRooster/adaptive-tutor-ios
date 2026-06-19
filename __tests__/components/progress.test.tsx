import React from "react";
import { render } from "@testing-library/react-native";
import ProgressScreen from "@/app/progress";

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn() }),
}));
jest.mock("@/lib/session", () => ({
  getActiveStudentId: jest.fn().mockResolvedValue("stu-1"),
}));
jest.mock("@/db", () => ({ db: {} }));
jest.mock("@/lib/data", () => ({
  getStudent: jest.fn().mockReturnValue({
    id: "stu-1", name: "Alice", color: "#6366f1", xp: 120, openrouterModel: null,
    ondeviceModel: null, pinHash: null, isAdmin: false, pacePref: "normal", tonePref: "encouraging",
    themePref: "system", llmProvider: "openrouter", streakCount: 3, streakLastDay: "2026-06-15",
    shareStats: false, createdAt: 0, lastActiveAt: 0,
  }),
  listSubjects: jest.fn().mockReturnValue([
    { id: "philosophy", name: "Philosophy", description: "Reasoning.", framing: "", orderIndex: 0 },
  ]),
  listTopics: jest.fn().mockReturnValue([
    { id: "t1", subjectId: "philosophy", name: "Epistemology", description: "Study of knowledge.", prerequisites: "[]", subtopics: "[]", orderIndex: 0 },
    { id: "t2", subjectId: "philosophy", name: "Ethics", description: "Study of morality.", prerequisites: "[]", subtopics: "[]", orderIndex: 1 },
  ]),
  getMasteryMap: jest.fn().mockReturnValue(new Map([
    ["t1", { mastery: 0.75, bloomLevel: 3, attempts: 5, correct: 4, progress: "{}", studentId: "stu-1", topicId: "t1", updatedAt: 0 }],
  ])),
}));
jest.mock("@/lib/gamify", () => ({
  gamifySummary: jest.fn().mockReturnValue({
    xp: 120,
    level: 2,
    title: "Apprentice",
    levelFloorXp: 50,
    nextLevelXp: 150,
    streak: 3,
    shareStats: false,
    badges: [
      { code: "first_session", title: "First Steps", description: "Completed first session.", emoji: "🎓", earnedAt: 0 },
    ],
  }),
  levelForXp: jest.fn().mockReturnValue({ level: 2, title: "Apprentice", levelFloorXp: 50, nextLevelXp: 150 }),
}));

describe("ProgressScreen", () => {
  it("renders the student name", async () => {
    const { findByText } = await render(<ProgressScreen />);
    await findByText("Alice");
  });

  it("renders the level and title", async () => {
    const { findByText } = await render(<ProgressScreen />);
    await findByText(/Level 2.*Apprentice/);
  });

  it("shows the XP total", async () => {
    const { findByText } = await render(<ProgressScreen />);
    await findByText(/120 XP/);
  });

  it("renders topic mastery rows", async () => {
    const { findByText } = await render(<ProgressScreen />);
    await findByText("Epistemology");
    await findByText("Ethics");
  });

  it("renders achievement badges", async () => {
    const { findByText } = await render(<ProgressScreen />);
    await findByText("First Steps");
  });
});

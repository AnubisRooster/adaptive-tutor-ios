/**
 * Integration tests for adaptive.ts — mock the entire data layer so no native
 * SQLite is needed in Jest. The TOPICS catalog from db/curriculum provides
 * real prerequisite data so selectNextTopic and recommendStartTopic behave
 * exactly as they will on-device.
 */

import type { Mastery, Student, Topic, Gap } from "@/db/schema";
import type { Grade } from "@/lib/schemas";
import { TOPICS } from "@/db/curriculum";
import { applyGrade, selectNextTopic, recommendStartTopic } from "@/lib/adaptive";
import { createStudent, getMastery, upsertMastery, listOpenGaps } from "@/lib/data";

// ---- In-memory data stores shared with the jest.mock factory ----
// Must be prefixed with "mock" so jest's babel transform allows them
// inside the hoisted factory.
const mockStudentsMap = new Map<string, Student>();
const mockMasteryMap = new Map<string, Mastery>(); // key = `${studentId}:${topicId}`
const mockGapsArr: Gap[] = [];

// Build a Topic (DB row shape) from the seed catalog's SeedTopic entries.
const mockTopicById = new Map<string, Topic>(
  TOPICS.map((t) => [
    t.id,
    {
      id: t.id,
      subjectId: t.subjectId,
      name: t.name,
      description: t.description,
      prerequisites: JSON.stringify(t.prerequisites),
      subtopics: "[]",
      orderIndex: t.orderIndex,
    } satisfies Topic,
  ])
);

const mockTopicsBySubject = new Map<string, Topic[]>();
for (const t of mockTopicById.values()) {
  const list = mockTopicsBySubject.get(t.subjectId) ?? [];
  list.push(t);
  mockTopicsBySubject.set(t.subjectId, list);
}
for (const list of mockTopicsBySubject.values()) {
  list.sort((a, b) => a.orderIndex - b.orderIndex);
}

jest.mock("@/lib/data", () => ({
  createStudent: (input: { name: string; color?: string }) => {
    const id = Math.random().toString(36).slice(2, 10);
    const s: Student = {
      id,
      name: input.name,
      color: input.color ?? "#6366f1",
      pinHash: null,
      isAdmin: false,
      pacePref: "normal",
      tonePref: "encouraging",
      themePref: "system",
      llmProvider: "openrouter",
      openrouterModel: null,
      ondeviceModel: null,
      xp: 0,
      streakCount: 0,
      streakLastDay: null,
      shareStats: false,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    };
    mockStudentsMap.set(id, s);
    return s;
  },

  getStudent: (id: string) => mockStudentsMap.get(id),

  getMastery: (studentId: string, topicId: string) =>
    mockMasteryMap.get(`${studentId}:${topicId}`),

  getMasteryMap: (studentId: string): Map<string, Mastery> => {
    const map = new Map<string, Mastery>();
    for (const [key, val] of mockMasteryMap.entries()) {
      if (key.startsWith(studentId + ":")) {
        map.set(key.slice(studentId.length + 1), val);
      }
    }
    return map;
  },

  upsertMastery: (
    studentId: string,
    topicId: string,
    patch: Partial<Pick<Mastery, "mastery" | "bloomLevel" | "attempts" | "correct">>
  ) => {
    const key = `${studentId}:${topicId}`;
    const existing = mockMasteryMap.get(key);
    const updated: Mastery = {
      id: existing?.id ?? key,
      studentId,
      topicId,
      mastery: patch.mastery ?? existing?.mastery ?? 0,
      bloomLevel: patch.bloomLevel ?? existing?.bloomLevel ?? 1,
      attempts: patch.attempts ?? existing?.attempts ?? 0,
      correct: patch.correct ?? existing?.correct ?? 0,
      lastSeen: Date.now(),
      phase: existing?.phase ?? "learn",
      progress: existing?.progress ?? "{}",
    };
    mockMasteryMap.set(key, updated);
    return updated;
  },

  getTopic: (id: string) => mockTopicById.get(id),

  listTopics: (subjectId: string) => mockTopicsBySubject.get(subjectId) ?? [],

  topicPrerequisites: (topic: Topic): string[] => {
    try {
      return JSON.parse(topic.prerequisites) as string[];
    } catch {
      return [];
    }
  },

  addGap: (studentId: string, topicId: string, misconception: string) => {
    mockGapsArr.push({
      id: Math.random().toString(36).slice(2),
      studentId,
      topicId,
      misconception,
      status: "open",
      detectedAt: Date.now(),
      clearedAt: null,
    });
  },

  clearGapsForTopic: (studentId: string, topicId: string) => {
    for (const g of mockGapsArr) {
      if (g.studentId === studentId && g.topicId === topicId && g.status === "open") {
        g.status = "cleared";
      }
    }
  },

  listOpenGaps: (studentId: string, topicId?: string): Gap[] =>
    mockGapsArr.filter(
      (g) =>
        g.studentId === studentId &&
        (topicId === undefined || g.topicId === topicId) &&
        g.status === "open"
    ),

  markSubtopicQuizzed: jest.fn(),
}));

beforeEach(() => {
  mockStudentsMap.clear();
  mockMasteryMap.clear();
  mockGapsArr.length = 0;
});

function grade(partial: Partial<Grade> = {}): Grade {
  return {
    correct: true,
    score: 0.9,
    misconceptions: [],
    masteryDelta: 0.2,
    nextRecommendation: "reinforce",
    feedbackForStudent: "ok",
    ...partial,
  };
}

describe("applyGrade", () => {
  it("raises mastery on a correct answer", () => {
    const s = createStudent({ name: "Riser" });
    const before = getMastery(s.id, "ai.intro")?.mastery ?? 0;
    const res = applyGrade(s.id, "ai.intro", grade({ masteryDelta: 0.25 }));
    expect(res.mastery.mastery).toBeGreaterThan(before);
    expect(res.mastery.attempts).toBe(1);
    expect(res.mastery.correct).toBe(1);
  });

  it("records misconceptions as open gaps", () => {
    const s = createStudent({ name: "Gapper" });
    applyGrade(
      s.id,
      "ai.intro",
      grade({
        correct: false,
        masteryDelta: -0.1,
        misconceptions: ["confuses agent with environment"],
      })
    );
    const openGaps = listOpenGaps(s.id, "ai.intro");
    expect(openGaps.some((g) => g.misconception.includes("agent"))).toBe(true);
  });

  it("levels up the Bloom level and advances when a topic is mastered", () => {
    const s = createStudent({ name: "Advancer" });
    upsertMastery(s.id, "philosophy.logic", { mastery: 0.85, bloomLevel: 1 });
    const res = applyGrade(
      s.id,
      "philosophy.logic",
      grade({ masteryDelta: 0.1, nextRecommendation: "advance" })
    );
    expect(res.mastery.mastery).toBeGreaterThanOrEqual(0.8);
    expect(res.mastery.bloomLevel).toBe(2);
    expect(res.leveledUp).toBe(true);
    expect(res.next.topicId).toBe("philosophy.epistemology");
    expect(res.next.reason).toBe("advance");
  });

  it("drops to the weakest prerequisite when recommended", () => {
    const s = createStudent({ name: "Backtracker" });
    upsertMastery(s.id, "philosophy.logic", { mastery: 0.1 });
    const res = applyGrade(
      s.id,
      "philosophy.epistemology",
      grade({ correct: false, masteryDelta: -0.15, nextRecommendation: "prerequisite" })
    );
    expect(res.next.reason).toBe("prerequisite");
    expect(res.next.topicId).toBe("philosophy.logic");
  });

  it("clears gaps when mastery reaches 0.8+", () => {
    const s = createStudent({ name: "GapClearer" });
    applyGrade(
      s.id,
      "ai.intro",
      grade({ correct: false, masteryDelta: -0.1, misconceptions: ["confused"] })
    );
    expect(listOpenGaps(s.id, "ai.intro").length).toBe(1);
    upsertMastery(s.id, "ai.intro", { mastery: 0.75 });
    applyGrade(s.id, "ai.intro", grade({ masteryDelta: 0.2, nextRecommendation: "advance" }));
    expect(listOpenGaps(s.id, "ai.intro").length).toBe(0);
  });

  it("increments attempts on each call", () => {
    const s = createStudent({ name: "MultiCall" });
    applyGrade(s.id, "coding.basics", grade({ masteryDelta: 0.1 }));
    applyGrade(s.id, "coding.basics", grade({ masteryDelta: 0.1 }));
    const m = getMastery(s.id, "coding.basics")!;
    expect(m.attempts).toBe(2);
  });
});

describe("selectNextTopic", () => {
  it("reinforces the current topic when not yet mastered", () => {
    const s = createStudent({ name: "Steady" });
    const next = selectNextTopic(s.id, "physics.mechanics", "reinforce", 0.4);
    expect(next.topicId).toBe("physics.mechanics");
    expect(next.reason).toBe("reinforce");
  });

  it("reinforces when advance is requested but mastery is below threshold", () => {
    const s = createStudent({ name: "NotReady" });
    const next = selectNextTopic(s.id, "coding.basics", "advance", 0.5);
    expect(next.topicId).toBe("coding.basics");
    expect(next.reason).toBe("reinforce");
  });

  it("falls back to reinforce when no prereqs exist", () => {
    const s = createStudent({ name: "NoPrereq" });
    const next = selectNextTopic(s.id, "coding.basics", "prerequisite", 0.2);
    expect(next.reason).toBe("reinforce");
    expect(next.topicId).toBe("coding.basics");
  });
});

describe("recommendStartTopic", () => {
  it("returns the first not-yet-mastered topic of a subject", () => {
    const s = createStudent({ name: "Newcomer" });
    const t = recommendStartTopic(s.id, "coding");
    expect(t?.id).toBe("coding.basics");
  });

  it("skips mastered topics", () => {
    const s = createStudent({ name: "Partly" });
    upsertMastery(s.id, "coding.basics", { mastery: 0.9 });
    const t = recommendStartTopic(s.id, "coding");
    expect(t?.id).not.toBe("coding.basics");
  });

  it("returns first topic when all are mastered", () => {
    const s = createStudent({ name: "Expert" });
    const codingTopics = TOPICS.filter((t) => t.subjectId === "coding");
    for (const t of codingTopics) {
      upsertMastery(s.id, t.id, { mastery: 0.9 });
    }
    const t = recommendStartTopic(s.id, "coding");
    expect(t?.id).toBe("coding.basics");
  });
});

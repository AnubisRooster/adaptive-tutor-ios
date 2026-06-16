/**
 * Tests for the pure helpers exported from lib/data that do NOT require a
 * database connection: recomputePhase, topicPrerequisites, slugify,
 * getTopicSubtopics. The rest of lib/data is integration-tested on-device.
 */

import {
  recomputePhase,
  topicPrerequisites,
  slugify,
  getTopicSubtopics,
} from "@/lib/data";
import type { Topic } from "@/db/schema";

// Mock @/db so the module import doesn't try to open expo-sqlite.
jest.mock("@/db", () => ({ db: {} }));

function makeTopic(overrides: Partial<Topic> = {}): Topic {
  return {
    id: "test.topic",
    subjectId: "test",
    name: "Test Topic",
    description: "",
    prerequisites: "[]",
    subtopics: "[]",
    orderIndex: 0,
    ...overrides,
  };
}

describe("recomputePhase", () => {
  it("returns learn when prog is empty", () => {
    expect(recomputePhase({}, 0, "learn")).toBe("learn");
  });

  it("stays complete once complete", () => {
    expect(recomputePhase({}, 0, "complete")).toBe("complete");
  });

  it("returns complete when mastery >= 0.8", () => {
    const prog = { A: { taught: true, quizzed: true, lastScore: 0.9 } };
    expect(recomputePhase(prog, 0.85, "mastery")).toBe("complete");
  });

  it("returns learn when any sub-area is untaught", () => {
    const prog = {
      A: { taught: true, quizzed: false, lastScore: null },
      B: { taught: false, quizzed: false, lastScore: null },
    };
    expect(recomputePhase(prog, 0.3, "learn")).toBe("learn");
  });

  it("returns quiz when all taught but some unquizzed", () => {
    const prog = {
      A: { taught: true, quizzed: true, lastScore: 0.8 },
      B: { taught: true, quizzed: false, lastScore: null },
    };
    expect(recomputePhase(prog, 0.4, "learn")).toBe("quiz");
  });

  it("returns quiz when all quizzed but avg score below 0.65", () => {
    const prog = {
      A: { taught: true, quizzed: true, lastScore: 0.4 },
      B: { taught: true, quizzed: true, lastScore: 0.5 },
    };
    expect(recomputePhase(prog, 0.4, "quiz")).toBe("quiz");
  });

  it("returns mastery when all quizzed, avg >= 0.65, but overall mastery < 0.8", () => {
    const prog = {
      A: { taught: true, quizzed: true, lastScore: 0.7 },
      B: { taught: true, quizzed: true, lastScore: 0.8 },
    };
    expect(recomputePhase(prog, 0.6, "quiz")).toBe("mastery");
  });
});

describe("topicPrerequisites", () => {
  it("returns an empty array for a topic with no prerequisites", () => {
    const t = makeTopic({ prerequisites: "[]" });
    expect(topicPrerequisites(t)).toEqual([]);
  });

  it("returns the ids from a valid JSON array", () => {
    const t = makeTopic({ prerequisites: '["a.intro","a.core"]' });
    expect(topicPrerequisites(t)).toEqual(["a.intro", "a.core"]);
  });

  it("returns an empty array for malformed JSON", () => {
    const t = makeTopic({ prerequisites: "not-json" });
    expect(topicPrerequisites(t)).toEqual([]);
  });

  it("returns an empty array for a non-array JSON value", () => {
    const t = makeTopic({ prerequisites: '{"id":"x"}' });
    expect(topicPrerequisites(t)).toEqual([]);
  });
});

describe("slugify", () => {
  it("lowercases, trims, and replaces spaces with dashes", () => {
    expect(slugify("  Hello World  ")).toBe("hello-world");
  });

  it("collapses multiple non-alphanumeric chars into a single dash", () => {
    expect(slugify("Organic Chemistry!")).toBe("organic-chemistry");
  });

  it("strips leading and trailing dashes", () => {
    expect(slugify("---test---")).toBe("test");
  });

  it("handles an empty string", () => {
    expect(slugify("")).toBe("");
  });

  it("handles a string of only special chars", () => {
    expect(slugify("!@#$")).toBe("");
  });

  it("truncates to 50 chars", () => {
    const long = "a".repeat(60);
    expect(slugify(long)).toHaveLength(50);
  });
});

describe("getTopicSubtopics", () => {
  it("returns empty array for a topic with no subtopics", () => {
    const t = makeTopic({ subtopics: "[]" });
    expect(getTopicSubtopics(t)).toEqual([]);
  });

  it("parses valid subtopics", () => {
    const t = makeTopic({
      subtopics: JSON.stringify([{ name: "A", description: "desc A" }]),
    });
    const result = getTopicSubtopics(t);
    expect(result).toEqual([{ name: "A", description: "desc A" }]);
  });

  it("ignores entries missing a name", () => {
    const t = makeTopic({
      subtopics: JSON.stringify([{ description: "no name" }]),
    });
    expect(getTopicSubtopics(t)).toEqual([]);
  });

  it("truncates long names and descriptions", () => {
    const longName = "x".repeat(200);
    const longDesc = "y".repeat(500);
    const t = makeTopic({
      subtopics: JSON.stringify([{ name: longName, description: longDesc }]),
    });
    const [s] = getTopicSubtopics(t);
    expect(s.name.length).toBeLessThanOrEqual(120);
    expect(s.description.length).toBeLessThanOrEqual(300);
  });

  it("returns empty array for malformed JSON", () => {
    const t = makeTopic({ subtopics: "not-json" });
    expect(getTopicSubtopics(t)).toEqual([]);
  });
});

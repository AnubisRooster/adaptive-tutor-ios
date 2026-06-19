// Stub the data layer so the DB chain (expo-sqlite → expo-asset) is not loaded in unit tests.
jest.mock("@/lib/data", () => ({
  getStudent: jest.fn(),
  addXp: jest.fn(),
  setStreak: jest.fn(),
  getMasteryMap: jest.fn().mockReturnValue(new Map()),
  countMasteredTopics: jest.fn().mockReturnValue(0),
  countClearedGaps: jest.fn().mockReturnValue(0),
  listTouchedSubjectIds: jest.fn().mockReturnValue([]),
  listAchievements: jest.fn().mockReturnValue([]),
  grantAchievement: jest.fn().mockReturnValue(true),
}));

import { levelForXp, computeStreak, xpForQuiz, XP_TEACH } from "@/lib/gamify";
import { ACHIEVEMENTS, type AchievementSnapshot } from "@/lib/gamify-catalog";

describe("levelForXp", () => {
  it("returns level 1 Novice at 0 XP", () => {
    const r = levelForXp(0);
    expect(r.level).toBe(1);
    expect(r.title).toBe("Novice");
    expect(r.levelFloorXp).toBe(0);
    expect(r.nextLevelXp).toBeGreaterThan(0);
  });

  it("returns level 2 Apprentice at threshold", () => {
    const r = levelForXp(50);
    expect(r.level).toBe(2);
    expect(r.title).toBe("Apprentice");
  });

  it("still level 1 just below threshold", () => {
    expect(levelForXp(49).level).toBe(1);
  });

  it("returns Scholar at 350 XP", () => {
    const r = levelForXp(350);
    expect(r.title).toBe("Scholar");
    expect(r.level).toBe(4);
  });

  it("reaches max level (Luminary) at high XP", () => {
    const r = levelForXp(99999);
    expect(r.title).toBe("Luminary");
    expect(r.level).toBe(9);
    expect(r.nextLevelXp).toBe(r.levelFloorXp);
  });

  it("levelFloorXp <= xp < nextLevelXp for mid-level", () => {
    const r = levelForXp(800);
    expect(r.levelFloorXp).toBeLessThanOrEqual(800);
    expect(r.nextLevelXp).toBeGreaterThan(800);
  });
});

describe("computeStreak", () => {
  it("starts streak at 1 with no prior day", () => {
    const r = computeStreak(0, null, "2026-06-08");
    expect(r.count).toBe(1);
    expect(r.day).toBe("2026-06-08");
  });

  it("does not change count when called again on same day", () => {
    const r = computeStreak(3, "2026-06-08", "2026-06-08");
    expect(r.count).toBe(3);
  });

  it("increments streak on consecutive day", () => {
    expect(computeStreak(5, "2026-06-07", "2026-06-08").count).toBe(6);
  });

  it("resets to 1 after a gap of 2 days", () => {
    expect(computeStreak(5, "2026-06-06", "2026-06-08").count).toBe(1);
  });

  it("resets to 1 after a long gap", () => {
    expect(computeStreak(30, "2026-01-01", "2026-06-08").count).toBe(1);
  });
});

describe("xpForQuiz", () => {
  it("XP_TEACH is a positive constant", () => {
    expect(XP_TEACH).toBeGreaterThan(0);
  });

  it("returns base XP for a wrong answer at bloom 1", () => {
    const xp = xpForQuiz({ score: 0, bloomLevel: 1, gapCleared: false });
    expect(xp).toBeGreaterThanOrEqual(1);
    expect(xp).toBeLessThan(20);
  });

  it("returns higher XP for a perfect answer at bloom 6 with gap cleared", () => {
    const high = xpForQuiz({ score: 1, bloomLevel: 6, gapCleared: true });
    const low = xpForQuiz({ score: 0, bloomLevel: 1, gapCleared: false });
    expect(high).toBeGreaterThan(low);
  });

  it("gap-cleared bonus adds XP", () => {
    const withGap = xpForQuiz({ score: 0.5, bloomLevel: 3, gapCleared: true });
    const withoutGap = xpForQuiz({ score: 0.5, bloomLevel: 3, gapCleared: false });
    expect(withGap).toBeGreaterThan(withoutGap);
  });

  it("bloom level bonus increases XP", () => {
    const b1 = xpForQuiz({ score: 0.5, bloomLevel: 1, gapCleared: false });
    const b6 = xpForQuiz({ score: 0.5, bloomLevel: 6, gapCleared: false });
    expect(b6).toBeGreaterThan(b1);
  });
});

function snap(overrides: Partial<AchievementSnapshot> = {}): AchievementSnapshot {
  return {
    masteredTopicsCount: 0,
    clearedGapsCount: 0,
    streakCount: 0,
    touchedSubjectsCount: 0,
    bestScore: 0,
    maxBloom: 1,
    ...overrides,
  };
}

function findAch(code: string) {
  const def = ACHIEVEMENTS.find((a) => a.code === code);
  if (!def) throw new Error(`Achievement ${code} not found`);
  return def;
}

describe("ACHIEVEMENTS predicates", () => {
  it("first_mastery triggers at 1 mastered topic", () => {
    expect(findAch("first_mastery").predicate(snap({ masteredTopicsCount: 0 }))).toBe(false);
    expect(findAch("first_mastery").predicate(snap({ masteredTopicsCount: 1 }))).toBe(true);
  });

  it("mastery_5 triggers at 5 mastered topics", () => {
    expect(findAch("mastery_5").predicate(snap({ masteredTopicsCount: 4 }))).toBe(false);
    expect(findAch("mastery_5").predicate(snap({ masteredTopicsCount: 5 }))).toBe(true);
  });

  it("streak_7 triggers at streak 7", () => {
    expect(findAch("streak_7").predicate(snap({ streakCount: 6 }))).toBe(false);
    expect(findAch("streak_7").predicate(snap({ streakCount: 7 }))).toBe(true);
  });

  it("gap_buster triggers at 5 cleared gaps", () => {
    expect(findAch("gap_buster").predicate(snap({ clearedGapsCount: 4 }))).toBe(false);
    expect(findAch("gap_buster").predicate(snap({ clearedGapsCount: 5 }))).toBe(true);
  });

  it("perfectionist triggers at 100% score", () => {
    expect(findAch("perfectionist").predicate(snap({ bestScore: 0.99 }))).toBe(false);
    expect(findAch("perfectionist").predicate(snap({ bestScore: 1.0 }))).toBe(true);
  });

  it("bloom_climber triggers at bloom 5", () => {
    expect(findAch("bloom_climber").predicate(snap({ maxBloom: 4 }))).toBe(false);
    expect(findAch("bloom_climber").predicate(snap({ maxBloom: 5 }))).toBe(true);
  });

  it("polymath triggers at 3 subjects", () => {
    expect(findAch("polymath").predicate(snap({ touchedSubjectsCount: 2 }))).toBe(false);
    expect(findAch("polymath").predicate(snap({ touchedSubjectsCount: 3 }))).toBe(true);
  });

  it("all achievements have unique codes", () => {
    const codes = ACHIEVEMENTS.map((a) => a.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("all achievements have emoji, title, and description", () => {
    for (const a of ACHIEVEMENTS) {
      expect(a.emoji.length).toBeGreaterThan(0);
      expect(a.title.length).toBeGreaterThan(0);
      expect(a.description.length).toBeGreaterThan(0);
    }
  });
});

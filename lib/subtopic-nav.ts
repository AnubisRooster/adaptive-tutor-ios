/**
 * Pure navigation helpers for subtopic-level progression.
 * No React, no server imports — fully unit-testable.
 */

export type SubtopicItem = { name: string; description: string };
export type SubtopicProgressEntry = {
  taught: boolean;
  quizzed: boolean;
  lastScore: number | null;
};
export type ProgressMap = Record<string, SubtopicProgressEntry>;

/**
 * Return the first subtopic that hasn't been quizzed yet, or null if all are
 * quizzed (or the list is empty).
 */
export function findNextSubtopic(
  items: SubtopicItem[],
  progressMap: ProgressMap
): SubtopicItem | null {
  if (items.length === 0) return null;
  for (const item of items) {
    const entry = progressMap[item.name];
    if (!entry || !entry.quizzed) return item;
  }
  return null;
}

/** Return whether all subtopics in the list have been quizzed. */
export function allQuizzed(items: SubtopicItem[], progressMap: ProgressMap): boolean {
  if (items.length === 0) return false;
  return items.every((item) => progressMap[item.name]?.quizzed === true);
}

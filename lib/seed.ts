import { SUBJECTS, TOPICS } from "@/db/curriculum";
import { createSubject, createTopics, listSubjects } from "@/lib/data";

/** Seed the built-in curriculum on first launch. No-op if subjects already exist. */
export function seedBuiltinCurriculum(): void {
  if (listSubjects().length > 0) return;

  for (const s of SUBJECTS) {
    createSubject({
      id: s.id,
      name: s.name,
      description: s.description,
      framing: s.framing,
      orderIndex: s.orderIndex,
    });
  }

  const topicsBySubject = new Map<string, typeof TOPICS>();
  for (const t of TOPICS) {
    const arr = topicsBySubject.get(t.subjectId) ?? [];
    arr.push(t);
    topicsBySubject.set(t.subjectId, arr);
  }

  for (const [subjectId, topics] of topicsBySubject) {
    createTopics(
      topics.map((t) => ({
        id: t.id,
        subjectId,
        name: t.name,
        description: t.description,
        prerequisites: t.prerequisites,
        orderIndex: t.orderIndex,
      }))
    );
  }
}

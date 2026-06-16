import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  students,
  subjects,
  topics,
  mastery,
  sessions,
  messages,
  gaps,
  achievements,
  knowledgeChunks,
  sources,
  systemSettings,
  type Student,
  type Subject,
  type Topic,
  type Mastery,
  type Gap,
  type Achievement,
  type KnowledgeChunk,
  type Message,
  type Source,
} from "@/db/schema";

const now = () => Date.now();

// React Native has crypto.randomUUID in newer versions; provide a fallback.
function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function hashPin(studentId: string, pin: string): string {
  // Lightweight PIN hashing suitable for on-device profile separation.
  // NOT for cryptographic security against an attacker with DB access.
  let h = 5381;
  const s = `${studentId}:${pin}`;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) & 0xffffffff;
  }
  return (h >>> 0).toString(16).padStart(8, "0") + s.length.toString(16);
}

// ---------- Students / profiles ----------

export function listStudents(): Student[] {
  return db.select().from(students).orderBy(desc(students.lastActiveAt)).all();
}

export function getStudent(id: string): Student | undefined {
  return db.select().from(students).where(eq(students.id, id)).get();
}

export function createStudent(input: {
  name: string;
  color?: string;
  pin?: string;
}): Student {
  const id = uuid();
  const ts = now();
  const pinHash = input.pin ? hashPin(id, input.pin) : null;
  const row = {
    id,
    name: input.name.trim().slice(0, 60),
    color: input.color ?? "#6366f1",
    pinHash,
    isAdmin: false as const,
    pacePref: "normal",
    tonePref: "encouraging",
    themePref: "system",
    llmProvider: "openrouter",
    openrouterModel: null,
    xp: 0,
    streakCount: 0,
    streakLastDay: null,
    shareStats: false as const,
    createdAt: ts,
    lastActiveAt: ts,
  };
  db.insert(students).values(row).run();
  return row as Student;
}

export function verifyPin(student: Student, pin?: string): boolean {
  if (!student.pinHash) return true;
  if (!pin) return false;
  return hashPin(student.id, pin) === student.pinHash;
}

export function touchStudent(id: string): void {
  db.update(students).set({ lastActiveAt: now() }).where(eq(students.id, id)).run();
}

export function updateStudentTheme(studentId: string, themePref: string): void {
  db.update(students).set({ themePref }).where(eq(students.id, studentId)).run();
}

export function updateStudentModel(studentId: string, model: string | null): void {
  db.update(students).set({ openrouterModel: model }).where(eq(students.id, studentId)).run();
}

export function updateStudentPrefs(
  studentId: string,
  prefs: Partial<Pick<Student, "pacePref" | "tonePref" | "shareStats">>
): void {
  if (Object.keys(prefs).length === 0) return;
  db.update(students).set(prefs).where(eq(students.id, studentId)).run();
}

// ---------- Gamification ----------

export function addXp(studentId: string, amount: number): number {
  const student = getStudent(studentId);
  const newXp = (student?.xp ?? 0) + amount;
  db.update(students).set({ xp: newXp }).where(eq(students.id, studentId)).run();
  return newXp;
}

export function setStreak(studentId: string, count: number, day: string): void {
  db.update(students)
    .set({ streakCount: count, streakLastDay: day })
    .where(eq(students.id, studentId))
    .run();
}

export function countMasteredTopics(studentId: string): number {
  const rows = db
    .select()
    .from(mastery)
    .where(and(eq(mastery.studentId, studentId), eq(mastery.phase, "complete")))
    .all();
  return rows.length;
}

export function countClearedGaps(studentId: string): number {
  const rows = db
    .select()
    .from(gaps)
    .where(and(eq(gaps.studentId, studentId), eq(gaps.status, "cleared")))
    .all();
  return rows.length;
}

export function listTouchedSubjectIds(studentId: string): string[] {
  const rows = db
    .select({ topicId: mastery.topicId })
    .from(mastery)
    .where(eq(mastery.studentId, studentId))
    .all();
  const subjectIds = new Set<string>();
  for (const r of rows) {
    const topic = getTopic(r.topicId);
    if (topic) subjectIds.add(topic.subjectId);
  }
  return [...subjectIds];
}

export function listAchievements(studentId: string): Achievement[] {
  return db
    .select()
    .from(achievements)
    .where(eq(achievements.studentId, studentId))
    .orderBy(asc(achievements.earnedAt))
    .all();
}

export function grantAchievement(studentId: string, code: string): boolean {
  const existing = db
    .select()
    .from(achievements)
    .where(and(eq(achievements.studentId, studentId), eq(achievements.code, code)))
    .get();
  if (existing) return false;
  db.insert(achievements)
    .values({ id: uuid(), studentId, code, earnedAt: now() })
    .run();
  return true;
}

// ---------- Subjects & topics ----------

export function listSubjects(): Subject[] {
  return db.select().from(subjects).orderBy(asc(subjects.orderIndex)).all();
}

export function getSubject(id: string): Subject | undefined {
  return db.select().from(subjects).where(eq(subjects.id, id)).get();
}

export function listTopics(subjectId: string): Topic[] {
  return db
    .select()
    .from(topics)
    .where(eq(topics.subjectId, subjectId))
    .orderBy(asc(topics.orderIndex))
    .all();
}

export function getTopic(id: string): Topic | undefined {
  return db.select().from(topics).where(eq(topics.id, id)).get();
}

export function getAllTopics(): Topic[] {
  return db.select().from(topics).orderBy(asc(topics.orderIndex)).all();
}

export function topicPrerequisites(topic: Topic): string[] {
  try {
    const parsed = JSON.parse(topic.prerequisites);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export type Subtopic = { name: string; description: string };

export function getTopicSubtopics(topic: Topic): Subtopic[] {
  try {
    const parsed = JSON.parse(topic.subtopics);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((s) => s && typeof s.name === "string")
      .map((s) => ({
        name: String(s.name).slice(0, 120),
        description: String(s.description ?? "").slice(0, 300),
      }));
  } catch {
    return [];
  }
}

export function setTopicSubtopics(topicId: string, subtopics: Subtopic[]): void {
  db.update(topics)
    .set({ subtopics: JSON.stringify(subtopics.slice(0, 12)) })
    .where(eq(topics.id, topicId))
    .run();
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export function uniqueSubjectId(name: string): string {
  const base = slugify(name) || "subject";
  let candidate = base;
  let n = 2;
  while (getSubject(candidate)) {
    candidate = `${base}-${n++}`;
  }
  return candidate;
}

export function createSubject(input: {
  id: string;
  name: string;
  description?: string;
  framing?: string;
  orderIndex?: number;
}): Subject {
  const nextOrder =
    input.orderIndex ??
    db
      .select()
      .from(subjects)
      .all()
      .reduce((max, s) => Math.max(max, s.orderIndex), -1) + 1;
  const row = {
    id: input.id,
    name: input.name.trim().slice(0, 80),
    description: (input.description ?? "").slice(0, 400),
    framing: (input.framing ?? "").slice(0, 800),
    orderIndex: nextOrder,
  };
  db.insert(subjects).values(row).run();
  return row as Subject;
}

export function createTopics(
  rows: {
    id: string;
    subjectId: string;
    name: string;
    description?: string;
    prerequisites?: string[];
    orderIndex: number;
  }[]
): void {
  if (rows.length === 0) return;
  for (const r of rows) {
    db.insert(topics)
      .values({
        id: r.id,
        subjectId: r.subjectId,
        name: r.name.trim().slice(0, 120),
        description: (r.description ?? "").slice(0, 400),
        prerequisites: JSON.stringify(r.prerequisites ?? []),
        orderIndex: r.orderIndex,
      })
      .run();
  }
}

export function updateSubject(
  id: string,
  patch: Partial<Pick<Subject, "name" | "description" | "framing" | "orderIndex">>
): void {
  const set: Record<string, unknown> = {};
  if (patch.name !== undefined) set.name = patch.name.trim().slice(0, 80);
  if (patch.description !== undefined) set.description = patch.description.slice(0, 400);
  if (patch.framing !== undefined) set.framing = patch.framing.slice(0, 800);
  if (patch.orderIndex !== undefined) set.orderIndex = patch.orderIndex;
  if (Object.keys(set).length === 0) return;
  db.update(subjects).set(set).where(eq(subjects.id, id)).run();
}

export function updateTopic(
  id: string,
  patch: Partial<Pick<Topic, "name" | "description" | "orderIndex">> & {
    prerequisites?: string[];
  }
): void {
  const set: Record<string, unknown> = {};
  if (patch.name !== undefined) set.name = patch.name.trim().slice(0, 120);
  if (patch.description !== undefined) set.description = patch.description.slice(0, 400);
  if (patch.orderIndex !== undefined) set.orderIndex = patch.orderIndex;
  if (patch.prerequisites !== undefined) set.prerequisites = JSON.stringify(patch.prerequisites);
  if (Object.keys(set).length === 0) return;
  db.update(topics).set(set).where(eq(topics.id, id)).run();
}

export function deleteTopic(id: string): void {
  const topic = getTopic(id);
  if (!topic) return;
  db.delete(knowledgeChunks).where(eq(knowledgeChunks.topicId, id)).run();
  db.delete(mastery).where(eq(mastery.topicId, id)).run();
  db.delete(gaps).where(eq(gaps.topicId, id)).run();
  db.update(sources).set({ topicId: null }).where(eq(sources.topicId, id)).run();
  for (const sibling of listTopics(topic.subjectId)) {
    const prereqs = topicPrerequisites(sibling);
    if (prereqs.includes(id)) {
      db.update(topics)
        .set({ prerequisites: JSON.stringify(prereqs.filter((p) => p !== id)) })
        .where(eq(topics.id, sibling.id))
        .run();
    }
  }
  db.delete(topics).where(eq(topics.id, id)).run();
}

export function deleteSubject(id: string): void {
  const topicIds = listTopics(id).map((t) => t.id);
  if (topicIds.length > 0) {
    db.delete(mastery).where(inArray(mastery.topicId, topicIds)).run();
    db.delete(gaps).where(inArray(gaps.topicId, topicIds)).run();
  }
  db.delete(knowledgeChunks).where(eq(knowledgeChunks.subjectId, id)).run();
  db.delete(sources).where(eq(sources.subjectId, id)).run();
  db.delete(sessions).where(eq(sessions.subjectId, id)).run();
  db.delete(topics).where(eq(topics.subjectId, id)).run();
  db.delete(subjects).where(eq(subjects.id, id)).run();
}

// ---------- Mastery ----------

export function getMastery(studentId: string, topicId: string): Mastery | undefined {
  return db
    .select()
    .from(mastery)
    .where(and(eq(mastery.studentId, studentId), eq(mastery.topicId, topicId)))
    .get();
}

export function getMasteryMap(studentId: string): Map<string, Mastery> {
  const rows = db.select().from(mastery).where(eq(mastery.studentId, studentId)).all();
  return new Map(rows.map((r) => [r.topicId, r]));
}

export function upsertMastery(
  studentId: string,
  topicId: string,
  patch: Partial<Pick<Mastery, "mastery" | "bloomLevel" | "attempts" | "correct">>
): Mastery {
  const existing = getMastery(studentId, topicId);
  if (existing) {
    const updated = {
      mastery: patch.mastery ?? existing.mastery,
      bloomLevel: patch.bloomLevel ?? existing.bloomLevel,
      attempts: patch.attempts ?? existing.attempts,
      correct: patch.correct ?? existing.correct,
      lastSeen: now(),
    };
    db.update(mastery).set(updated).where(eq(mastery.id, existing.id)).run();
    return { ...existing, ...updated };
  }
  const row = {
    id: uuid(),
    studentId,
    topicId,
    mastery: patch.mastery ?? 0,
    bloomLevel: patch.bloomLevel ?? 1,
    attempts: patch.attempts ?? 0,
    correct: patch.correct ?? 0,
    lastSeen: now(),
    phase: "learn",
    progress: "{}",
  };
  db.insert(mastery).values(row).run();
  return row as Mastery;
}

// ---------- Phase & progress helpers ----------

export type SubtopicProgress = {
  taught: boolean;
  quizzed: boolean;
  lastScore: number | null;
};
export type ProgressMap = Record<string, SubtopicProgress>;
export type TopicPhase = "learn" | "quiz" | "mastery" | "complete";

function parseProgress(json: string): ProgressMap {
  try {
    return JSON.parse(json) as ProgressMap;
  } catch {
    return {};
  }
}

export function recomputePhase(
  prog: ProgressMap,
  overallMastery: number,
  currentPhase: TopicPhase | string
): TopicPhase {
  if (currentPhase === "complete") return "complete";
  if (overallMastery >= 0.8) return "complete";

  const entries = Object.values(prog);
  if (entries.length === 0) return "learn";

  const allTaught = entries.every((e) => e.taught);
  const allQuizzed = entries.every((e) => e.quizzed);
  const scored = entries.filter((e) => e.lastScore !== null);
  const avgScore =
    scored.length > 0 ? scored.reduce((s, e) => s + (e.lastScore ?? 0), 0) / scored.length : 0;

  if (!allTaught) return "learn";
  if (!allQuizzed || avgScore < 0.65) return "quiz";
  if (overallMastery < 0.8) return "mastery";
  return "complete";
}

export function markSubtopicTaught(
  studentId: string,
  topicId: string,
  subtopicName: string
): Mastery {
  const existing = getMastery(studentId, topicId);
  const prog = parseProgress(existing?.progress ?? "{}");
  prog[subtopicName] = {
    taught: true,
    quizzed: prog[subtopicName]?.quizzed ?? false,
    lastScore: prog[subtopicName]?.lastScore ?? null,
  };
  const phase = recomputePhase(prog, existing?.mastery ?? 0, existing?.phase ?? "learn");
  const progressJson = JSON.stringify(prog);
  if (existing) {
    db.update(mastery)
      .set({ phase, progress: progressJson, lastSeen: now() })
      .where(eq(mastery.id, existing.id))
      .run();
    return { ...existing, phase, progress: progressJson };
  }
  const row = {
    id: uuid(),
    studentId,
    topicId,
    mastery: 0,
    bloomLevel: 1,
    attempts: 0,
    correct: 0,
    lastSeen: now(),
    phase,
    progress: progressJson,
  };
  db.insert(mastery).values(row).run();
  return row as Mastery;
}

export function markSubtopicQuizzed(
  studentId: string,
  topicId: string,
  subtopicName: string,
  score: number
): Mastery {
  const existing = getMastery(studentId, topicId);
  const prog = parseProgress(existing?.progress ?? "{}");
  prog[subtopicName] = {
    taught: prog[subtopicName]?.taught ?? false,
    quizzed: true,
    lastScore: score,
  };
  const phase = recomputePhase(prog, existing?.mastery ?? 0, existing?.phase ?? "learn");
  const progressJson = JSON.stringify(prog);
  if (existing) {
    db.update(mastery)
      .set({ phase, progress: progressJson, lastSeen: now() })
      .where(eq(mastery.id, existing.id))
      .run();
    return { ...existing, phase, progress: progressJson };
  }
  const row = {
    id: uuid(),
    studentId,
    topicId,
    mastery: 0,
    bloomLevel: 1,
    attempts: 0,
    correct: 0,
    lastSeen: now(),
    phase,
    progress: progressJson,
  };
  db.insert(mastery).values(row).run();
  return row as Mastery;
}

// ---------- Sessions & messages ----------

export function getOrCreateSession(studentId: string, subjectId: string) {
  const existing = db
    .select()
    .from(sessions)
    .where(and(eq(sessions.studentId, studentId), eq(sessions.subjectId, subjectId)))
    .orderBy(desc(sessions.lastActiveAt))
    .get();
  if (existing) {
    db.update(sessions)
      .set({ lastActiveAt: now() })
      .where(eq(sessions.id, existing.id))
      .run();
    return existing;
  }
  const row = {
    id: uuid(),
    studentId,
    subjectId,
    startedAt: now(),
    lastActiveAt: now(),
  };
  db.insert(sessions).values(row).run();
  return row;
}

export function addMessage(input: {
  sessionId: string;
  studentId: string;
  role: "user" | "assistant" | "system";
  content: string;
  topicId?: string | null;
}): void {
  db.insert(messages)
    .values({
      id: uuid(),
      sessionId: input.sessionId,
      studentId: input.studentId,
      role: input.role,
      content: input.content,
      topicId: input.topicId ?? null,
      createdAt: now(),
    })
    .run();
}

export function getRecentMessages(sessionId: string, limit = 20): Message[] {
  const rows = db
    .select()
    .from(messages)
    .where(eq(messages.sessionId, sessionId))
    .orderBy(sql`${messages.createdAt} desc, rowid desc`)
    .limit(limit)
    .all();
  return rows.reverse();
}

// ---------- Gaps ----------

export function addGap(studentId: string, topicId: string, misconception: string): void {
  db.insert(gaps)
    .values({
      id: uuid(),
      studentId,
      topicId,
      misconception: misconception.slice(0, 400),
      status: "open",
      detectedAt: now(),
      clearedAt: null,
    })
    .run();
}

export function listOpenGaps(studentId: string, topicId?: string): Gap[] {
  const where = topicId
    ? and(eq(gaps.studentId, studentId), eq(gaps.topicId, topicId), eq(gaps.status, "open"))
    : and(eq(gaps.studentId, studentId), eq(gaps.status, "open"));
  return db.select().from(gaps).where(where).orderBy(desc(gaps.detectedAt)).all();
}

export function clearGapsForTopic(studentId: string, topicId: string): void {
  db.update(gaps)
    .set({ status: "cleared", clearedAt: now() })
    .where(
      and(eq(gaps.studentId, studentId), eq(gaps.topicId, topicId), eq(gaps.status, "open"))
    )
    .run();
}

// ---------- Knowledge chunks ----------

export function getChunksForSubject(subjectId: string): KnowledgeChunk[] {
  return db
    .select()
    .from(knowledgeChunks)
    .where(eq(knowledgeChunks.subjectId, subjectId))
    .all();
}

export function insertKnowledgeChunk(input: {
  subjectId: string;
  topicId?: string | null;
  source?: string;
  sourceId?: string | null;
  text: string;
  embedding?: number[] | null;
}): void {
  db.insert(knowledgeChunks)
    .values({
      id: uuid(),
      subjectId: input.subjectId,
      topicId: input.topicId ?? null,
      source: input.source ?? "",
      sourceId: input.sourceId ?? null,
      text: input.text,
      embedding: input.embedding ? JSON.stringify(input.embedding) : null,
      createdAt: now(),
    })
    .run();
}

export function listChunks(subjectId: string, topicId?: string | null): KnowledgeChunk[] {
  const where =
    topicId === undefined
      ? eq(knowledgeChunks.subjectId, subjectId)
      : topicId === null
        ? and(eq(knowledgeChunks.subjectId, subjectId), isNull(knowledgeChunks.topicId))
        : and(eq(knowledgeChunks.subjectId, subjectId), eq(knowledgeChunks.topicId, topicId));
  return db
    .select()
    .from(knowledgeChunks)
    .where(where)
    .orderBy(desc(knowledgeChunks.createdAt))
    .all();
}

export function getChunk(id: string): KnowledgeChunk | undefined {
  return db.select().from(knowledgeChunks).where(eq(knowledgeChunks.id, id)).get();
}

export function getChunksForSource(sourceId: string): KnowledgeChunk[] {
  return db
    .select()
    .from(knowledgeChunks)
    .where(eq(knowledgeChunks.sourceId, sourceId))
    .all();
}

export function setChunkEmbedding(id: string, embedding: number[] | null): void {
  db.update(knowledgeChunks)
    .set({ embedding: embedding ? JSON.stringify(embedding) : null })
    .where(eq(knowledgeChunks.id, id))
    .run();
}

export function deleteChunk(id: string): void {
  db.delete(knowledgeChunks).where(eq(knowledgeChunks.id, id)).run();
}

export function deleteSource(id: string): void {
  db.delete(knowledgeChunks).where(eq(knowledgeChunks.sourceId, id)).run();
  db.delete(sources).where(eq(sources.id, id)).run();
}

// ---------- Sources (ingested documents) ----------

export function createSource(input: {
  subjectId: string;
  topicId?: string | null;
  kind?: string;
  name: string;
}): Source {
  const ts = now();
  const row = {
    id: uuid(),
    subjectId: input.subjectId,
    topicId: input.topicId ?? null,
    kind: input.kind ?? "url",
    name: input.name.slice(0, 200),
    status: "pending",
    chunkCount: 0,
    embeddedCount: 0,
    error: null,
    createdAt: ts,
    updatedAt: ts,
  };
  db.insert(sources).values(row).run();
  return row as Source;
}

export function updateSource(
  id: string,
  patch: Partial<Pick<Source, "status" | "chunkCount" | "embeddedCount" | "error">>
): void {
  db.update(sources)
    .set({ ...patch, updatedAt: now() })
    .where(eq(sources.id, id))
    .run();
}

export function getSource(id: string): Source | undefined {
  return db.select().from(sources).where(eq(sources.id, id)).get();
}

export function listSources(subjectId?: string): Source[] {
  const q = db.select().from(sources);
  const rows = subjectId ? q.where(eq(sources.subjectId, subjectId)).all() : q.all();
  return rows.sort((a, b) => b.createdAt - a.createdAt);
}

// ---------- System settings ----------

export function getSystemSetting(key: string): string | null {
  const row = db.select().from(systemSettings).where(eq(systemSettings.key, key)).get();
  return row?.value ?? null;
}

export function setSystemSetting(key: string, value: string): void {
  db.insert(systemSettings)
    .values({ key, value })
    .onConflictDoUpdate({ target: systemSettings.key, set: { value } })
    .run();
}

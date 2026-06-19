import {
  sqliteTable,
  text,
  integer,
  real,
  uniqueIndex,
  index,
} from "drizzle-orm/sqlite-core";

export const students = sqliteTable("students", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#6366f1"),
  pinHash: text("pin_hash"),
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
  pacePref: text("pace_pref").notNull().default("normal"),
  tonePref: text("tone_pref").notNull().default("encouraging"),
  themePref: text("theme_pref").notNull().default("system"),
  // LLM provider: "openrouter" (cloud) or "on-device" (llama.rn Metal)
  llmProvider: text("llm_provider").notNull().default("openrouter"),
  openrouterModel: text("openrouter_model"),
  ondeviceModel: text("ondevice_model"),
  // Gamification
  xp: integer("xp").notNull().default(0),
  streakCount: integer("streak_count").notNull().default(0),
  streakLastDay: text("streak_last_day"),
  shareStats: integer("share_stats", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at").notNull(),
  lastActiveAt: integer("last_active_at").notNull(),
});

export const subjects = sqliteTable("subjects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  framing: text("framing").notNull().default(""),
  orderIndex: integer("order_index").notNull().default(0),
});

export const topics = sqliteTable(
  "topics",
  {
    id: text("id").primaryKey(),
    subjectId: text("subject_id").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    prerequisites: text("prerequisites").notNull().default("[]"),
    subtopics: text("subtopics").notNull().default("[]"),
    orderIndex: integer("order_index").notNull().default(0),
  },
  (t) => [index("topics_by_subject").on(t.subjectId)]
);

export const mastery = sqliteTable(
  "mastery",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id").notNull(),
    topicId: text("topic_id").notNull(),
    mastery: real("mastery").notNull().default(0),
    bloomLevel: integer("bloom_level").notNull().default(1),
    attempts: integer("attempts").notNull().default(0),
    correct: integer("correct").notNull().default(0),
    lastSeen: integer("last_seen").notNull().default(0),
    phase: text("phase").notNull().default("learn"),
    progress: text("progress").notNull().default("{}"),
  },
  (t) => [
    uniqueIndex("mastery_student_topic").on(t.studentId, t.topicId),
    index("mastery_by_student").on(t.studentId),
  ]
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id").notNull(),
    subjectId: text("subject_id").notNull(),
    startedAt: integer("started_at").notNull(),
    lastActiveAt: integer("last_active_at").notNull(),
  },
  (t) => [index("sessions_by_student_subject").on(t.studentId, t.subjectId)]
);

export const messages = sqliteTable(
  "messages",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id").notNull(),
    studentId: text("student_id").notNull(),
    role: text("role").notNull(),
    content: text("content").notNull(),
    topicId: text("topic_id"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("messages_by_session").on(t.sessionId)]
);

export const gaps = sqliteTable(
  "gaps",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id").notNull(),
    topicId: text("topic_id").notNull(),
    misconception: text("misconception").notNull(),
    status: text("status").notNull().default("open"),
    detectedAt: integer("detected_at").notNull(),
    clearedAt: integer("cleared_at"),
  },
  (t) => [index("gaps_by_student").on(t.studentId)]
);

export const achievements = sqliteTable(
  "achievements",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id").notNull(),
    code: text("code").notNull(),
    earnedAt: integer("earned_at").notNull(),
  },
  (t) => [
    uniqueIndex("achievements_student_code").on(t.studentId, t.code),
    index("achievements_by_student").on(t.studentId),
  ]
);

export const knowledgeChunks = sqliteTable(
  "knowledge_chunks",
  {
    id: text("id").primaryKey(),
    subjectId: text("subject_id").notNull(),
    topicId: text("topic_id"),
    source: text("source").notNull().default(""),
    sourceId: text("source_id"),
    text: text("text").notNull(),
    // JSON-encoded number[] embedding (null until embedded).
    embedding: text("embedding"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("chunks_by_subject").on(t.subjectId)]
);

export const sources = sqliteTable(
  "sources",
  {
    id: text("id").primaryKey(),
    subjectId: text("subject_id").notNull(),
    topicId: text("topic_id"),
    kind: text("kind").notNull().default("url"),
    name: text("name").notNull(),
    status: text("status").notNull().default("pending"),
    chunkCount: integer("chunk_count").notNull().default(0),
    embeddedCount: integer("embedded_count").notNull().default(0),
    error: text("error"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [index("sources_by_subject").on(t.subjectId)]
);

export const systemSettings = sqliteTable("system_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export type Student = typeof students.$inferSelect;
export type Subject = typeof subjects.$inferSelect;
export type Topic = typeof topics.$inferSelect;
export type Mastery = typeof mastery.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Gap = typeof gaps.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type KnowledgeChunk = typeof knowledgeChunks.$inferSelect;
export type Source = typeof sources.$inferSelect;

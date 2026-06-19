// Bundled migrations for drizzle-orm/expo-sqlite useMigrations.
// Regenerate: npx drizzle-kit generate, then re-inline the SQL here.

const sql0 = `CREATE TABLE \`achievements\` (
\`id\` text PRIMARY KEY NOT NULL,
\`student_id\` text NOT NULL,
\`code\` text NOT NULL,
\`earned_at\` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX \`achievements_student_code\` ON \`achievements\` (\`student_id\`,\`code\`);--> statement-breakpoint
CREATE INDEX \`achievements_by_student\` ON \`achievements\` (\`student_id\`);--> statement-breakpoint
CREATE TABLE \`gaps\` (
\`id\` text PRIMARY KEY NOT NULL,
\`student_id\` text NOT NULL,
\`topic_id\` text NOT NULL,
\`misconception\` text NOT NULL,
\`status\` text DEFAULT 'open' NOT NULL,
\`detected_at\` integer NOT NULL,
\`cleared_at\` integer
);
--> statement-breakpoint
CREATE INDEX \`gaps_by_student\` ON \`gaps\` (\`student_id\`);--> statement-breakpoint
CREATE TABLE \`knowledge_chunks\` (
\`id\` text PRIMARY KEY NOT NULL,
\`subject_id\` text NOT NULL,
\`topic_id\` text,
\`source\` text DEFAULT '' NOT NULL,
\`source_id\` text,
\`text\` text NOT NULL,
\`embedding\` text,
\`created_at\` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX \`chunks_by_subject\` ON \`knowledge_chunks\` (\`subject_id\`);--> statement-breakpoint
CREATE TABLE \`mastery\` (
\`id\` text PRIMARY KEY NOT NULL,
\`student_id\` text NOT NULL,
\`topic_id\` text NOT NULL,
\`mastery\` real DEFAULT 0 NOT NULL,
\`bloom_level\` integer DEFAULT 1 NOT NULL,
\`attempts\` integer DEFAULT 0 NOT NULL,
\`correct\` integer DEFAULT 0 NOT NULL,
\`last_seen\` integer DEFAULT 0 NOT NULL,
\`phase\` text DEFAULT 'learn' NOT NULL,
\`progress\` text DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX \`mastery_student_topic\` ON \`mastery\` (\`student_id\`,\`topic_id\`);--> statement-breakpoint
CREATE INDEX \`mastery_by_student\` ON \`mastery\` (\`student_id\`);--> statement-breakpoint
CREATE TABLE \`messages\` (
\`id\` text PRIMARY KEY NOT NULL,
\`session_id\` text NOT NULL,
\`student_id\` text NOT NULL,
\`role\` text NOT NULL,
\`content\` text NOT NULL,
\`topic_id\` text,
\`created_at\` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX \`messages_by_session\` ON \`messages\` (\`session_id\`);--> statement-breakpoint
CREATE TABLE \`sessions\` (
\`id\` text PRIMARY KEY NOT NULL,
\`student_id\` text NOT NULL,
\`subject_id\` text NOT NULL,
\`started_at\` integer NOT NULL,
\`last_active_at\` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX \`sessions_by_student_subject\` ON \`sessions\` (\`student_id\`,\`subject_id\`);--> statement-breakpoint
CREATE TABLE \`sources\` (
\`id\` text PRIMARY KEY NOT NULL,
\`subject_id\` text NOT NULL,
\`topic_id\` text,
\`kind\` text DEFAULT 'url' NOT NULL,
\`name\` text NOT NULL,
\`status\` text DEFAULT 'pending' NOT NULL,
\`chunk_count\` integer DEFAULT 0 NOT NULL,
\`embedded_count\` integer DEFAULT 0 NOT NULL,
\`error\` text,
\`created_at\` integer NOT NULL,
\`updated_at\` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX \`sources_by_subject\` ON \`sources\` (\`subject_id\`);--> statement-breakpoint
CREATE TABLE \`students\` (
\`id\` text PRIMARY KEY NOT NULL,
\`name\` text NOT NULL,
\`color\` text DEFAULT '#6366f1' NOT NULL,
\`pin_hash\` text,
\`is_admin\` integer DEFAULT false NOT NULL,
\`pace_pref\` text DEFAULT 'normal' NOT NULL,
\`tone_pref\` text DEFAULT 'encouraging' NOT NULL,
\`theme_pref\` text DEFAULT 'system' NOT NULL,
\`llm_provider\` text DEFAULT 'openrouter' NOT NULL,
\`openrouter_model\` text,
\`xp\` integer DEFAULT 0 NOT NULL,
\`streak_count\` integer DEFAULT 0 NOT NULL,
\`streak_last_day\` text,
\`share_stats\` integer DEFAULT false NOT NULL,
\`created_at\` integer NOT NULL,
\`last_active_at\` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`subjects\` (
\`id\` text PRIMARY KEY NOT NULL,
\`name\` text NOT NULL,
\`description\` text DEFAULT '' NOT NULL,
\`framing\` text DEFAULT '' NOT NULL,
\`order_index\` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`system_settings\` (
\`key\` text PRIMARY KEY NOT NULL,
\`value\` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`topics\` (
\`id\` text PRIMARY KEY NOT NULL,
\`subject_id\` text NOT NULL,
\`name\` text NOT NULL,
\`description\` text DEFAULT '' NOT NULL,
\`prerequisites\` text DEFAULT '[]' NOT NULL,
\`subtopics\` text DEFAULT '[]' NOT NULL,
\`order_index\` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX \`topics_by_subject\` ON \`topics\` (\`subject_id\`);`;

// Migration 0001: add on-device model column to students table.
const sql1 = `ALTER TABLE \`students\` ADD \`ondevice_model\` text;`;

export default {
  journal: {
    entries: [
      { idx: 0, when: 1781635755984, tag: "0000_pink_odin", breakpoints: true },
      { idx: 1, when: 1781635800000, tag: "0001_ondevice_model", breakpoints: true },
    ],
  },
  migrations: {
    "0000_pink_odin": sql0,
    "0001_ondevice_model": sql1,
  },
};

/**
 * Auto-generate courses and lesson content for newly created subjects/topics.
 *
 * generateCurriculum  — asks the LLM to plan a progressive lesson sequence
 * seedTopicContent    — generates and stores knowledge chunks for one lesson
 */

import { chatOnce, resolveLlmConfigById } from "@/lib/llm";
import { insertKnowledgeChunk } from "@/lib/data";

// ---------- Types ----------

export type SeedProgress =
  | { phase: "planning" }
  | { phase: "generating"; lesson: number; total: number }
  | { phase: "saving"; saved: number; total: number }
  | { phase: "done"; lessonCount: number; chunkCount: number }
  | { phase: "error"; message: string };

export type LessonPlan = {
  name: string;
  description: string;
};

// ---------- Curriculum planner ----------

/**
 * Ask the LLM for a progressive lesson sequence for a new course.
 * Returns an ordered array of { name, description } lesson plans.
 */
export async function generateCurriculum(
  courseName: string,
  courseDescription: string,
  studentId: string
): Promise<LessonPlan[]> {
  const cfg = await resolveLlmConfigById(studentId);

  const descLine = courseDescription.trim()
    ? `\nCourse description: ${courseDescription.trim()}`
    : "";

  const prompt = `You are an expert curriculum designer creating a structured course plan.

Course title: "${courseName}"${descLine}

Design a progressive sequence of exactly 6 lessons for a beginner starting from zero knowledge. Each lesson should build directly on the previous one — like a real classroom course.

Return ONLY a JSON array with exactly 6 objects. Each object must have:
- "name": short lesson title (e.g. "Lesson 1: Introduction & Alphabet")  
- "description": one sentence describing what the student will learn

Example format:
[
  {"name": "Lesson 1: Introduction & Core Concepts", "description": "Discover what ${courseName} is and why it matters, with a first look at key terminology."},
  {"name": "Lesson 2: Foundations", "description": "Build the foundational knowledge needed before going deeper."},
  ...
]

Return only the JSON array, no other text.`;

  const raw = await chatOnce(cfg, [{ role: "user", content: prompt }], {
    temperature: 0.3,
    maxTokens: 800,
  });

  // Extract JSON array from response
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("Could not parse curriculum from LLM response.");

  const parsed: unknown = JSON.parse(match[0]);
  if (!Array.isArray(parsed)) throw new Error("Curriculum response was not an array.");

  return parsed
    .filter((item): item is LessonPlan =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as LessonPlan).name === "string" &&
      typeof (item as LessonPlan).description === "string"
    )
    .slice(0, 8); // cap at 8 lessons
}

// ---------- Lesson content seeder ----------

/**
 * Generate and store knowledge chunks for a single lesson topic.
 * The content is structured to teach progressively, matching the lesson's
 * position in the overall course sequence.
 */
export async function seedTopicContent(
  topic: { id: string; name: string; description?: string | null },
  subject: { id: string; name: string },
  studentId: string,
  onProgress?: (p: SeedProgress) => void,
  lessonIndex = 0,
  totalLessons = 1
): Promise<number> {
  onProgress?.({ phase: "generating", lesson: lessonIndex + 1, total: totalLessons });

  const cfg = await resolveLlmConfigById(studentId);

  const isFirst = lessonIndex === 0;
  const progressionNote = isFirst
    ? "This is the very first lesson — assume the student knows absolutely nothing. Be welcoming, clear, and accessible."
    : `This is lesson ${lessonIndex + 1} of ${totalLessons}. Build on what was covered in earlier lessons. Introduce new depth and complexity appropriate for this stage.`;

  const prompt = `You are an expert educator teaching a course on "${subject.name}".

Lesson: "${topic.name}"
${topic.description ? `Lesson summary: ${topic.description}` : ""}

${progressionNote}

Write a complete lesson covering the following sections (use ## headings):

## What You'll Learn
1–2 sentences stating the specific skills or knowledge the student will gain.

## Explanation
A clear, thorough explanation of the core content. Use plain language. Include examples inline.

## Key Points
3–5 bullet points summarising the most important takeaways.

## Practice
One hands-on exercise or reflection question the student can try right now.

Write pedagogically and engagingly. Avoid LaTeX notation.`;

  const raw = await chatOnce(cfg, [{ role: "user", content: prompt }], {
    temperature: 0.4,
    maxTokens: 1000,
  });

  const chunks = splitIntoChunks(raw);

  onProgress?.({ phase: "saving", saved: 0, total: chunks.length });

  let saved = 0;
  for (const text of chunks) {
    const trimmed = text.trim();
    if (trimmed.length < 20) continue;
    insertKnowledgeChunk({
      subjectId: subject.id,
      topicId: topic.id,
      source: "generated",
      text: trimmed,
    });
    saved++;
    onProgress?.({ phase: "saving", saved, total: chunks.length });
  }

  return saved;
}

// ---------- Full course seeder ----------

/**
 * Create all lesson topics for a new subject and seed content for Lesson 1.
 * Returns the array of created lesson IDs in order.
 */
export async function seedCourse(
  subject: { id: string; name: string },
  lessons: LessonPlan[],
  studentId: string,
  createTopicsFn: (rows: {
    id: string; subjectId: string; name: string;
    description?: string; orderIndex: number;
  }[]) => void,
  onProgress?: (p: SeedProgress) => void
): Promise<string[]> {
  // Create all lesson topics in DB first
  const topicRows = lessons.map((l, i) => ({
    id: `topic-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 5)}`,
    subjectId: subject.id,
    name: l.name,
    description: l.description,
    orderIndex: i,
  }));
  createTopicsFn(topicRows);

  // Seed content for Lesson 1 only (others generate on demand)
  const first = topicRows[0];
  const chunkCount = await seedTopicContent(
    { id: first.id, name: first.name, description: first.description },
    subject,
    studentId,
    onProgress,
    0,
    lessons.length
  );

  onProgress?.({ phase: "done", lessonCount: lessons.length, chunkCount });
  return topicRows.map((t) => t.id);
}

// ---------- Helpers ----------

function splitIntoChunks(text: string): string[] {
  const sections = text.split(/\n(?=##\s)/);
  const chunks: string[] = [];

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;

    if (trimmed.length <= 800) {
      chunks.push(trimmed);
    } else {
      const paragraphs = trimmed.split(/\n\n+/).filter((p) => p.trim().length > 0);
      chunks.push(...paragraphs);
    }
  }

  return chunks;
}

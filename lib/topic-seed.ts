/**
 * Auto-generate and store lesson seed content for a newly created topic.
 *
 * Calls the active student's LLM to produce a structured overview, then
 * splits it into paragraph-level knowledge chunks stored in SQLite so the
 * RAG layer can retrieve them during tutoring and quiz sessions.
 */

import { chatOnce, resolveLlmConfigById } from "@/lib/llm";
import { insertKnowledgeChunk } from "@/lib/data";

export type SeedProgress =
  | { phase: "generating" }
  | { phase: "saving"; saved: number; total: number }
  | { phase: "done"; chunkCount: number }
  | { phase: "error"; message: string };

export async function seedTopicContent(
  topic: { id: string; name: string; description?: string | null },
  subject: { id: string; name: string },
  studentId: string,
  onProgress?: (p: SeedProgress) => void
): Promise<number> {
  onProgress?.({ phase: "generating" });

  const cfg = await resolveLlmConfigById(studentId);

  const descLine = topic.description?.trim()
    ? `\nTopic description: ${topic.description.trim()}`
    : "";

  const prompt = `You are an expert educator creating lesson material for a course on "${subject.name}".

Generate a comprehensive lesson overview for the topic: "${topic.name}"${descLine}

Structure your response using these exact section headings (use ## for each):

## Introduction
A clear 2–3 sentence introduction explaining what this topic is and why it matters.

## Core Concepts
Explain 4–6 key ideas, principles, or terms the student must understand. Use bullet points for each concept.

## Examples
Provide 2–3 concrete, easy-to-follow examples that illustrate the core concepts.

## Common Misconceptions
List 2–3 things students often get wrong about this topic and clarify them.

## Summary
A brief 2–3 sentence recap of the most important takeaways.

Write clearly and pedagogically. Avoid LaTeX; use plain language and Unicode symbols where needed.`;

  const raw = await chatOnce(cfg, [{ role: "user", content: prompt }], {
    temperature: 0.4,
    maxTokens: 1200,
  });

  // Split into chunks by section (## heading) or paragraph
  const chunks = splitIntoChunks(raw);

  onProgress?.({ phase: "saving", saved: 0, total: chunks.length });

  for (let i = 0; i < chunks.length; i++) {
    const text = chunks[i].trim();
    if (text.length < 20) continue; // skip empty/tiny fragments
    insertKnowledgeChunk({
      subjectId: subject.id,
      topicId: topic.id,
      source: "generated",
      text,
    });
    onProgress?.({ phase: "saving", saved: i + 1, total: chunks.length });
  }

  onProgress?.({ phase: "done", chunkCount: chunks.length });
  return chunks.length;
}

function splitIntoChunks(text: string): string[] {
  // Split on section headings first
  const sections = text.split(/\n(?=##\s)/);
  const chunks: string[] = [];

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;

    // If a section is short enough, keep it whole
    if (trimmed.length <= 800) {
      chunks.push(trimmed);
    } else {
      // Further split long sections by double newline (paragraph breaks)
      const paragraphs = trimmed.split(/\n\n+/).filter((p) => p.trim().length > 0);
      chunks.push(...paragraphs);
    }
  }

  return chunks;
}

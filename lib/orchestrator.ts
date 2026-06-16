import { getStudent, getSubject, getTopic, getMastery, listOpenGaps } from "@/lib/data";
import { retrieveContext, contextBlock } from "@/lib/rag";
import { buildTutorSystemPrompt, type TutorMode, type Focus } from "@/lib/prompts";
import type { LlmMessage } from "@/lib/llm";

export type ChatTurnInput = {
  studentId: string;
  subjectId: string;
  topicId: string;
  mode: TutorMode;
  history: { role: "user" | "assistant"; content: string }[];
  focus?: Focus;
};

export type BuiltTurn = {
  messages: LlmMessage[];
  topicName: string;
  subjectName: string;
};

/** Assemble the full message list (system + recent history) for a tutor turn. */
export async function buildTutorTurn(input: ChatTurnInput): Promise<BuiltTurn> {
  const student = getStudent(input.studentId);
  const subject = getSubject(input.subjectId);
  const topic = getTopic(input.topicId);
  if (!student || !subject || !topic) {
    throw new Error("Unknown student, subject, or topic.");
  }

  const masteryRow = getMastery(student.id, topic.id);
  const openGaps = listOpenGaps(student.id, topic.id);

  const lastUser = [...input.history].reverse().find((m) => m.role === "user");
  const baseQuery = input.focus
    ? `${topic.name} — ${input.focus.name}: ${input.focus.description ?? ""}`
    : `${topic.name}: ${topic.description}`;
  const query = lastUser?.content?.trim() || baseQuery;
  const retrieved = await retrieveContext(subject.id, topic.id, query, 4);

  const system = buildTutorSystemPrompt({
    student,
    subject,
    topic,
    masteryRow,
    openGaps,
    contextText: contextBlock(retrieved),
    mode: input.mode,
    focus: input.focus,
  });

  const recent = input.history.slice(-12);
  const messages: LlmMessage[] = [
    { role: "system", content: system },
    ...recent.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];

  return { messages, topicName: topic.name, subjectName: subject.name };
}

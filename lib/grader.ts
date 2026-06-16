import { z } from "zod";
import { getStudent, getSubject, getTopic } from "@/lib/data";
import { chatOnce, resolveLlmConfigById, type LlmConfig } from "@/lib/llm";
import { GradeSchema, type Grade, type QuizQuestion } from "@/lib/schemas";

const gradeFormat: object = z.toJSONSchema(GradeSchema);

export async function gradeAnswer(args: {
  studentId: string;
  subjectId: string;
  topicId: string;
  question: QuizQuestion;
  studentAnswer: string;
  cfg?: LlmConfig;
}): Promise<Grade> {
  if (!args.studentAnswer.trim()) {
    throw new Error("Student answer is empty.");
  }

  const student = getStudent(args.studentId);
  const subject = getSubject(args.subjectId);
  const topic = getTopic(args.topicId);
  if (!student || !subject || !topic) {
    throw new Error("Unknown student, subject, or topic.");
  }

  const system = `You are a thoughtful, encouraging tutor grading a student's open-ended answer.
Grade fairly: the student needs specific feedback to improve. Be kind but honest.
Return ONLY valid JSON matching the schema. Do not add any commentary outside the JSON.`;

  const user = `Subject: ${subject.name}
Topic: ${topic.name}
Question: ${args.question.question}
Ideal answer outline: ${args.question.idealAnswerOutline}

Student's answer: ${args.studentAnswer.trim()}

Grade the answer. Set "correct" to true only if the core reasoning is essentially right.
Set "score" as a partial-credit value from 0 to 1.
List specific "misconceptions" if any (empty array if none).
Set "masteryDelta" to reflect how much the mastery for this topic should shift (-0.3 to 0.3).
Set "nextRecommendation" based on how ready the student is to advance.
Write warm, specific "feedbackForStudent" in second person ("You...").`;

  const cfg = args.cfg ?? (await resolveLlmConfigById(args.studentId));
  const raw = await chatOnce(
    cfg,
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    { temperature: 0.2, format: gradeFormat }
  );

  const parsed = GradeSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    throw new Error("The model returned an invalid grade. Please try again.");
  }
  return parsed.data;
}

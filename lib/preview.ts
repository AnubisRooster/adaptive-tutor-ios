/**
 * Preview mode — lets a brand-new user (or an App Review engineer) experience
 * the tutor and quizzes with no LLM configured at all. Everything here is
 * deterministic, runs on the device, and is clearly labelled as Preview.
 *
 * XP / mastery still flow through the real local engines (applyGrade +
 * awardForGrade), so the app is never a dead end before a model is connected.
 */

import type { QuizQuestion, Grade } from "@/lib/schemas";
import type { TutorMode } from "@/lib/prompts";

export function previewTutorTurn(input: {
  topicName: string;
  subjectName: string;
  mode: TutorMode;
  userText?: string;
  historyLength: number;
}): string {
  const { topicName } = input;
  const modeIntro =
    input.mode === "review"
      ? "Let's reinforce what you've learned so far."
      : "Let's take the next step together.";

  const responding = input.userText
    ? `You asked: "${input.userText}"\n\n`
    : "";

  return `${responding}${modeIntro}

Here's how we'll learn **${topicName}** together:

1. **Learn one step at a time** — we focus on a single sub-area, building from foundations up.
2. **Practice with short quizzes** — each answer is graded and adjusted to your level.
3. **Strengthen gaps** — if something is shaky, we come back to it until it sticks.

> You're in **preview mode** — no AI model is connected yet. Open Setup to add a
> free on-device model (~700 MB) or connect OpenRouter for real, personalized tutoring.`;
}

// ---------- Preview quizzes ----------

const PREVIEW_TOPICS = ["study-skills"];

const PREVIEW_QUESTIONS: QuizQuestion[] = [
  {
    question:
      "What is the core idea behind active recall, and why does it help learning?",
    bloomLevel: 2,
    idealAnswerOutline:
      "Active recall means retrieving information from memory rather than just rereading it; this retrieval strengthens memory and makes learning stickier.",
  },
  {
    question:
      "Why are short practice quizzes more effective for long-term learning than simply rereading notes?",
    bloomLevel: 3,
    idealAnswerOutline:
      "Quizzes force retrieval, expose gaps you didn't know you had, and give feedback that guides what to study next.",
  },
  {
    question:
      "If you keep getting a quiz question wrong, what is the most useful next step?",
    bloomLevel: 2,
    idealAnswerOutline:
      "Review the underlying concept, then retry the question later; spaced repetition helps the correction stick.",
  },
];

let previewIndex = 0;

/** Return the next preview question, cycling through the canned set. */
export function previewQuiz(): QuizQuestion {
  const q = PREVIEW_QUESTIONS[previewIndex % PREVIEW_QUESTIONS.length];
  previewIndex += 1;
  return q;
}

export function previewTopicSlug(): string {
  return PREVIEW_TOPICS[0];
}

// ---------- Preview grading ----------

const STOPWORDS = new Set([
  "the", "and", "for", "with", "that", "this", "than", "what", "why", "have",
  "from", "your", "about", "rather", "which", "they", "you", "not",
]);

/** Deterministic, keyword-based grader so Preview quizzes work without an LLM. */
export function previewGradeAnswer(
  question: QuizQuestion,
  studentAnswer: string
): Grade {
  const outlineTokens = question.idealAnswerOutline
    .toLowerCase()
    .split(/[^a-z]+/i)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));

  const answerLower = studentAnswer.toLowerCase();
  const matched = outlineTokens.filter((t) => answerLower.includes(t)).length;
  const ratio = outlineTokens.length > 0 ? matched / outlineTokens.length : 0;
  const score = Math.max(0, Math.min(1, ratio));

  const correct = score >= 0.6;
  const missing = outlineTokens.filter((t) => !answerLower.includes(t)).slice(0, 2);

  const feedbackForStudent = correct
    ? `Nice work! You captured the key idea. ${score >= 0.8 ? "That's a really solid answer." : "Keep going and you'll lock it in."}`
    : missing.length > 0
      ? `Good start — you're on the right track. To make your answer even stronger, try to mention ${missing.join(" and ")}.`
      : "Every attempt builds understanding. Try restating the idea in your own words and we'll go again.";

  return {
    correct,
    score,
    misconceptions: correct ? [] : ["Missing key points from the ideal answer."],
    masteryDelta: Math.max(-0.3, Math.min(0.3, (score - 0.5) * 0.3)),
    nextRecommendation: score >= 0.75 ? "advance" : "reinforce",
    feedbackForStudent,
  };
}
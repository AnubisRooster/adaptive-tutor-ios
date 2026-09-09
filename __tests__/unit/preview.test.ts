import { previewTutorTurn, previewQuiz, previewGradeAnswer } from "@/lib/preview";

describe("previewTutorTurn", () => {
  it("mentions the topic and preview mode", () => {
    const text = previewTutorTurn({
      topicName: "Fractions",
      subjectName: "Math",
      mode: "teach",
      userText: "",
      historyLength: 0,
    });
    expect(text).toContain("Fractions");
    expect(text).toContain("preview mode");
  });

  it("echoes the student's question when provided", () => {
    const text = previewTutorTurn({
      topicName: "Fractions",
      subjectName: "Math",
      mode: "review",
      userText: "Why do I keep confusing numerator and denominator?",
      historyLength: 4,
    });
    expect(text).toContain("Why do I keep confusing numerator and denominator?");
  });
});

describe("previewQuiz", () => {
  it("returns one of the canned questions", () => {
    const q = previewQuiz();
    expect(q).toMatchObject({
      question: expect.any(String),
      bloomLevel: expect.any(Number),
      idealAnswerOutline: expect.any(String),
    });
    expect(q.question.length).toBeGreaterThan(0);
  });

  it("cycles through the question set", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 6; i++) {
      seen.add(previewQuiz().question);
    }
    expect(seen.size).toBeGreaterThan(1);
  });
});

describe("previewGradeAnswer", () => {
const question = {
  question: "What is active recall?",
  bloomLevel: 2 as const,
  idealAnswerOutline:
    "Retrieving information from memory strengthens learning and makes material stickier.",
};

  it("a full answer is graded correct with a high score", () => {
    const g = previewGradeAnswer(
      question,
      "Retrieving information from memory strengthens learning and makes it stickier."
    );
    expect(g.correct).toBe(true);
    expect(g.score).toBeGreaterThan(0.6);
    expect(g.nextRecommendation).toBe("advance");
    expect(g.masteryDelta).toBeGreaterThan(0);
  });

  it("an empty answer scores near zero and recommends reinforce", () => {
    const g = previewGradeAnswer(question, "");
    expect(g.correct).toBe(false);
    expect(g.score).toBeLessThan(0.2);
    expect(g.nextRecommendation).toBe("reinforce");
    expect(g.masteryDelta).toBeLessThan(0);
    expect(g.misconceptions.length).toBeGreaterThan(0);
  });

  it("keeps the score within the Grade schema bounds", () => {
    const g = previewGradeAnswer(question, "memory learning stickier");
    expect(g.score).toBeGreaterThanOrEqual(0);
    expect(g.score).toBeLessThanOrEqual(1);
    expect(g.masteryDelta).toBeGreaterThanOrEqual(-0.3);
    expect(g.masteryDelta).toBeLessThanOrEqual(0.3);
  });

  it("always includes warm feedback for the student", () => {
    const g = previewGradeAnswer(question, "");
    expect(g.feedbackForStudent.length).toBeGreaterThan(0);
  });
});
import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getActiveStudentId } from "@/lib/session";
import { getStudent, getSubject, getTopic, getMastery as getMasteryRow, getTopicSubtopics } from "@/lib/data";
import { resolveLlmConfigById, isProviderUnavailable, type LlmConfig } from "@/lib/llm";
import { previewQuiz, previewGradeAnswer } from "@/lib/preview";
import { generateQuizQuestion } from "@/lib/quiz-gen";
import { gradeAnswer } from "@/lib/grader";
import { applyGrade, type ApplyGradeResult } from "@/lib/adaptive";
import { awardForGrade, type GamifyResult } from "@/lib/gamify";
import type { Grade, QuizQuestion } from "@/lib/schemas";
import type { Student } from "@/db/schema";

type Phase = "init" | "answering" | "grading" | "result" | "summary" | "error";

/** Questions per quiz session. */
const ROUNDS = 5;

const SCORE_COLOR = (score: number) =>
  score >= 0.8 ? "#10b981" : score >= 0.5 ? "#f59e0b" : "#ef4444";

type SessionResult = {
  question: QuizQuestion;
  grade: Grade;
  applyResult: ApplyGradeResult;
  gamifyResult: GamifyResult;
};

export default function QuizScreen() {
  const router = useRouter();
  const { subjectId, topicId } = useLocalSearchParams<{
    subjectId: string;
    topicId: string;
  }>();

  const [student, setStudent] = useState<Student | null>(null);
  const [cfg, setCfg] = useState<LlmConfig | null>(null);
  const [subtopics, setSubtopics] = useState<{ name: string; description: string }[]>([]);
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [answer, setAnswer] = useState("");
  const [phase, setPhase] = useState<Phase>("init");
  const [round, setRound] = useState(0);
  const [results, setResults] = useState<SessionResult[]>([]);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [applyResult, setApplyResult] = useState<ApplyGradeResult | null>(null);
  const [gamifyResult, setGamifyResult] = useState<GamifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  async function startSession(id: string) {
    setPhase("init");
    setError(null);
    setResults([]);
    setRound(0);
    setPreviewMode(false);
    try {
      const t = getTopic(topicId as string);
      const subs = t ? getTopicSubtopics(t) : [];
      setSubtopics(subs);
      const focus = subs.length > 0 ? subs[0] : undefined;
      let q: QuizQuestion;
      try {
        const c = await resolveLlmConfigById(id);
        setCfg(c);
        q = await generateQuizQuestion({
          studentId: id,
          subjectId: subjectId as string,
          topicId: topicId as string,
          cfg: c,
          focus,
        });
      } catch (e) {
        if (isProviderUnavailable(e)) {
          setCfg(null);
          setPreviewMode(true);
          q = previewQuiz();
        } else {
          throw e;
        }
      }
      setQuestion(q);
      setPhase("answering");
    } catch (e) {
      setError(String(e));
      setPhase("error");
    }
  }

  useEffect(() => {
    (async () => {
      const id = await getActiveStudentId();
      if (!id) { router.replace("/"); return; }
      const stu = getStudent(id);
      if (!stu || !subjectId || !topicId) { router.back(); return; }
      setStudent(stu);
      await startSession(id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitAnswer() {
    if (!student || !question || !answer.trim()) return;
    setPhase("grading");
    try {
      const focus = subtopics.length > 0 ? subtopics[round % subtopics.length] : undefined;
      let g: Grade;
      if (previewMode || !cfg) {
        g = previewGradeAnswer(question, answer);
      } else {
        g = await gradeAnswer({
          studentId: student.id,
          subjectId: subjectId as string,
          topicId: topicId as string,
          question,
          studentAnswer: answer,
          cfg,
        });
      }
      setGrade(g);
      // Capture mastery before applying the grade so we can detect a threshold crossing.
      const masteryBefore = getMasteryRow(student.id, topicId as string)?.mastery ?? 0;
      const ar = applyGrade(student.id, topicId as string, g, focus?.name);
      setApplyResult(ar);
      const gr = awardForGrade(student.id, {
        grade: g,
        bloomLevel: ar.mastery.bloomLevel,
        // Award the gap-cleared bonus only when mastery crosses 0.8 on this attempt.
        gapCleared: masteryBefore < 0.8 && ar.mastery.mastery >= 0.8,
      });
      setGamifyResult(gr);
      setResults((prev) => [...prev, { question, grade: g, applyResult: ar, gamifyResult: gr }]);
      if (round >= ROUNDS - 1) {
        setPhase("summary");
      } else {
        setPhase("result");
      }
    } catch (e) {
      setError(String(e));
      setPhase("answering");
    }
  }

  async function nextQuestion() {
    if (!student) return;
    const next = round + 1;
    setRound(next);
    setAnswer("");
    setError(null);
    setPhase("answering");
    try {
      const focus = subtopics.length > 0 ? subtopics[next % subtopics.length] : undefined;
      let q: QuizQuestion;
      if (previewMode || !cfg) {
        q = previewQuiz();
      } else {
        q = await generateQuizQuestion({
          studentId: student.id,
          subjectId: subjectId as string,
          topicId: topicId as string,
          cfg,
          focus,
        });
      }
      setQuestion(q);
    } catch (e) {
      setError(String(e));
      setPhase("error");
    }
  }

  const summary = useMemo(() => {
    if (results.length === 0) return null;
    const totalXp = results.reduce((s, r) => s + (r.gamifyResult.xpGained ?? 0), 0);
    const avgScore = results.reduce((s, r) => s + r.grade.score, 0) / results.length;
    const correct = results.filter((r) => r.grade.correct).length;
    const next = results[results.length - 1].applyResult.next;
    return { totalXp, avgScore, correct, next };
  }, [results]);

  const topicName = topicId ? (getTopic(topicId as string)?.name ?? "Topic") : "Topic";
  const subjectName = subjectId ? (getSubject(subjectId as string)?.name ?? "") : "";
  const currentMastery = student && topicId
    ? getMasteryRow(student.id, topicId as string)
    : undefined;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} testID="back-btn">
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle} numberOfLines={1}>Quiz — {topicName}</Text>
          {subjectName ? <Text style={styles.headerSub}>{subjectName}</Text> : null}
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          {/* Mastery context */}
          {currentMastery && phase !== "init" && (
            <View style={styles.masteryChip}>
              <Text style={styles.masteryChipText}>
                Mastery: {Math.round((currentMastery.mastery ?? 0) * 100)}%
              </Text>
            </View>
          )}

          {/* Question progress */}
          {(phase === "answering" || phase === "grading" || phase === "result") && (
            <View style={styles.roundPill}>
              <Text style={styles.roundPillText}>
                Question {round + 1} of {ROUNDS}
              </Text>
            </View>
          )}

          {previewMode && (
            <View style={styles.previewTag} testID="preview-tag">
              <Text style={styles.previewTagText}>Preview questions — answers are graded locally</Text>
            </View>
          )}

          {/* Generating */}
          {phase === "init" && (
            <View style={styles.centeredBox} testID="phase-init">
              <ActivityIndicator size="large" />
              <Text style={styles.phaseLabel}>Generating question…</Text>
            </View>
          )}

          {/* Error */}
          {phase === "error" && (
            <View style={styles.centeredBox} testID="phase-error">
              <Text style={styles.errorTitle}>Something went wrong</Text>
              <Text style={styles.errorMsg}>{error}</Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => router.back()}>
                <Text style={styles.primaryBtnText}>Go back</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Answering */}
          {(phase === "answering" || phase === "grading") && question && (
            <>
              <View style={styles.questionCard}>
                <Text style={styles.questionLabel}>Question</Text>
                <Text style={styles.questionText}>{question.question}</Text>
              </View>

              <Text style={styles.answerLabel}>Your answer</Text>
              <TextInput
                style={styles.answerInput}
                value={answer}
                onChangeText={setAnswer}
                placeholder="Type your answer here…"
                multiline
                numberOfLines={5}
                editable={phase === "answering"}
                testID="answer-input"
              />

              {error && phase === "answering" && (
                <Text style={styles.errorMsg}>{error}</Text>
              )}

              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  (!answer.trim() || phase === "grading") && styles.disabledBtn,
                ]}
                onPress={submitAnswer}
                disabled={!answer.trim() || phase === "grading"}
                testID="submit-btn"
              >
                {phase === "grading" ? (
                  <View style={styles.row}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={[styles.primaryBtnText, { marginLeft: 8 }]}>Grading…</Text>
                  </View>
                ) : (
                  <Text style={styles.primaryBtnText}>Submit answer</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* Per-question result */}
          {phase === "result" && grade && applyResult && gamifyResult && (
            <View testID="phase-result">
              {/* Score card */}
              <View style={[styles.scoreCard, { borderColor: SCORE_COLOR(grade.score) }]}>
                <View style={styles.row}>
                  <Text style={[styles.scoreEmoji]}>
                    {grade.correct ? "✓" : "✗"}
                  </Text>
                  <Text style={[styles.scorePercent, { color: SCORE_COLOR(grade.score) }]}>
                    {Math.round(grade.score * 100)}%
                  </Text>
                  {applyResult.leveledUp && (
                    <View style={styles.bloomBadge}>
                      <Text style={styles.bloomText}>Bloom ↑</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.feedbackText}>{grade.feedbackForStudent}</Text>
              </View>

              {/* XP earned */}
              <View style={styles.xpRow}>
                <Text style={styles.xpLabel}>+{gamifyResult.xpGained} XP earned</Text>
                {gamifyResult.leveledUpLevel && (
                  <Text style={styles.levelUpText}>
                    Level up! You are now Level {gamifyResult.newLevel.level} — {gamifyResult.newLevel.title}
                  </Text>
                )}
              </View>

              {/* New badges */}
              {gamifyResult.newBadges.length > 0 && (
                <View style={styles.badgesRow}>
                  {gamifyResult.newBadges.map((b) => (
                    <View key={b.code} style={styles.badgeChip}>
                      <Text style={styles.badgeEmoji}>{b.emoji}</Text>
                      <Text style={styles.badgeTitle}>{b.title}</Text>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={nextQuestion}
                testID="next-question-btn"
              >
                <Text style={styles.primaryBtnText}>
                  {round >= ROUNDS - 1 ? "See results" : "Next question"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Session summary */}
          {phase === "summary" && summary && applyResult && gamifyResult && (
            <View testID="phase-summary">
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Session complete</Text>
                <View style={styles.row}>
                  <Text style={[styles.summaryScore, { color: SCORE_COLOR(summary.avgScore) }]}>
                    {Math.round(summary.avgScore * 100)}%
                  </Text>
                  <Text style={styles.summaryMeta}>
                    avg · {summary.correct}/{results.length} correct
                  </Text>
                </View>
                <Text style={styles.summaryXp}>+{summary.totalXp} XP earned this session</Text>
                {gamifyResult.leveledUpLevel && (
                  <Text style={styles.levelUpText}>
                    Level up! You are now Level {gamifyResult.newLevel.level} — {gamifyResult.newLevel.title}
                  </Text>
                )}
              </View>

              {/* Next step */}
              <View style={styles.nextBox}>
                <Text style={styles.nextLabel}>Next up</Text>
                <Text style={styles.nextTopic}>{summary.next.topicName}</Text>
                <Text style={styles.nextNote}>{summary.next.note}</Text>
              </View>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => router.back()}
                testID="continue-btn"
              >
                <Text style={styles.primaryBtnText}>Continue</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    gap: 12,
  },
  backBtn: { padding: 4 },
  backText: { fontSize: 15, color: "#6366f1" },
  headerTitles: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: "600", color: "#111" },
  headerSub: { fontSize: 12, color: "#6b7280" },
  container: { padding: 20, paddingBottom: 40 },
  centeredBox: { alignItems: "center", paddingTop: 60, gap: 16 },
  phaseLabel: { fontSize: 15, color: "#6b7280", marginTop: 12 },
  masteryChip: {
    alignSelf: "flex-start",
    backgroundColor: "#ede9fe",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 16,
  },
  masteryChipText: { fontSize: 12, color: "#7c3aed", fontWeight: "500" },
  roundPill: {
    alignSelf: "flex-start",
    backgroundColor: "#eef2ff",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 16,
  },
  roundPillText: { fontSize: 12, color: "#6366f1", fontWeight: "600" },
  previewTag: {
    alignSelf: "flex-start",
    backgroundColor: "#fef9c3",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 16,
  },
  previewTagText: { fontSize: 12, color: "#78350f" },
  summaryCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 18,
    marginBottom: 16,
    gap: 8,
  },
  summaryTitle: { fontSize: 18, fontWeight: "700", color: "#111" },
  summaryScore: { fontSize: 34, fontWeight: "800" },
  summaryMeta: { fontSize: 13, color: "#6b7280", marginLeft: 8 },
  summaryXp: { fontSize: 15, fontWeight: "600", color: "#6366f1" },
  questionCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 20,
  },
  questionLabel: { fontSize: 11, color: "#9ca3af", fontWeight: "600", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  questionText: { fontSize: 16, color: "#111", lineHeight: 24 },
  answerLabel: { fontSize: 13, color: "#6b7280", marginBottom: 8 },
  answerInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111",
    minHeight: 120,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  primaryBtn: {
    backgroundColor: "#6366f1",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  primaryBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  disabledBtn: { backgroundColor: "#c7d2fe" },
  row: { flexDirection: "row", alignItems: "center" },
  scoreCard: {
    borderRadius: 14,
    borderWidth: 2,
    padding: 18,
    marginBottom: 16,
    gap: 10,
  },
  scoreEmoji: { fontSize: 22, marginRight: 8 },
  scorePercent: { fontSize: 28, fontWeight: "700" },
  bloomBadge: {
    marginLeft: 12,
    backgroundColor: "#ede9fe",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  bloomText: { fontSize: 12, color: "#7c3aed", fontWeight: "600" },
  feedbackText: { fontSize: 15, color: "#374151", lineHeight: 22 },
  xpRow: { marginBottom: 12, gap: 4 },
  xpLabel: { fontSize: 15, fontWeight: "600", color: "#6366f1" },
  levelUpText: { fontSize: 14, color: "#10b981", fontWeight: "600" },
  badgesRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  badgeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fef9c3",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeEmoji: { fontSize: 18 },
  badgeTitle: { fontSize: 13, fontWeight: "500", color: "#78350f" },
  nextBox: {
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 4,
  },
  nextLabel: { fontSize: 11, color: "#6b7280", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  nextTopic: { fontSize: 16, fontWeight: "600", color: "#111" },
  nextNote: { fontSize: 13, color: "#6b7280" },
  errorTitle: { fontSize: 17, fontWeight: "600", color: "#ef4444" },
  errorMsg: { fontSize: 14, color: "#6b7280", textAlign: "center", marginBottom: 8 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});

import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { getActiveStudentId } from "@/lib/session";
import {
  getStudent,
  listSubjects,
  listTopics,
  getMasteryMap,
} from "@/lib/data";
import { gamifySummary, levelForXp } from "@/lib/gamify";
import ProfileAvatar from "@/components/ProfileAvatar";
import MasteryBar from "@/components/MasteryBar";
import type { Student, Mastery, Subject, Topic } from "@/db/schema";

const BLOOM_NAMES = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"];

type Summary = ReturnType<typeof gamifySummary>;

export default function ProgressScreen() {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [masteryMap, setMasteryMap] = useState<Map<string, Mastery>>(new Map());

  useEffect(() => {
    (async () => {
      const id = await getActiveStudentId();
      if (!id) { router.replace("/"); return; }
      const stu = getStudent(id);
      if (!stu) { router.replace("/"); return; }
      setStudent(stu);
      setSummary(gamifySummary(id));
      const subs = listSubjects();
      setSubjects(subs);
      setTopics(subs.flatMap((s) => listTopics(s.id)));
      setMasteryMap(getMasteryMap(id));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!student || !summary) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const levelInfo = levelForXp(summary.xp);
  const xpInLevel = summary.xp - levelInfo.levelFloorXp;
  const xpNeeded = levelInfo.nextLevelXp - levelInfo.levelFloorXp;
  const levelProgress = xpNeeded > 0 ? Math.min(xpInLevel / xpNeeded, 1) : 1;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} testID="back-btn">
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Progress</Text>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push("/settings")}>
          <Text style={styles.settingsText}>Settings</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <ProfileAvatar name={student.name} color={student.color} size={56} />
          <View style={styles.profileInfo}>
            <Text style={styles.studentName}>{student.name}</Text>
            <Text style={styles.levelTitle}>Level {levelInfo.level} — {levelInfo.title}</Text>
          </View>
          {summary.streak > 0 && (
            <View style={styles.streakBadge} testID="streak-badge">
              <Text style={styles.streakText}>🔥 {summary.streak}</Text>
            </View>
          )}
        </View>

        {/* XP bar */}
        <View style={styles.xpSection}>
          <View style={styles.xpLabelRow}>
            <Text style={styles.xpLabel}>{summary.xp} XP total</Text>
            <Text style={styles.xpNext}>{levelInfo.nextLevelXp} XP for Level {levelInfo.level + 1}</Text>
          </View>
          <View style={styles.xpBarBg}>
            <View style={[styles.xpBarFill, { width: `${Math.round(levelProgress * 100)}%` }]} />
          </View>
        </View>

        {/* Topics mastery */}
        {subjects.map((sub) => {
          const subTopics = topics.filter((t) => t.subjectId === sub.id);
          if (subTopics.length === 0) return null;
          return (
            <View key={sub.id} style={styles.subjectSection}>
              <Text style={styles.subjectName}>{sub.name}</Text>
              {subTopics.map((t) => {
                const m = masteryMap.get(t.id);
                const mastery = m?.mastery ?? 0;
                const bloom = m?.bloomLevel ?? 1;
                return (
                  <View key={t.id} style={styles.topicRow}>
                    <View style={styles.topicRowLeft}>
                      <Text style={styles.topicName}>{t.name}</Text>
                      <Text style={styles.bloomLabel}>{BLOOM_NAMES[bloom - 1]}</Text>
                    </View>
                    <View style={styles.topicRowRight}>
                      <MasteryBar value={mastery} />
                      <Text style={styles.masteryPct}>{Math.round(mastery * 100)}%</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })}

        {/* Achievements */}
        {summary.badges.length > 0 && (
          <View style={styles.badgesSection}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <View style={styles.badgesGrid}>
              {summary.badges.map((b) => (
                <View key={b.code} style={styles.badgeCard} testID={`badge-${b.code}`}>
                  <Text style={styles.badgeEmoji}>{b.emoji}</Text>
                  <Text style={styles.badgeTitle}>{b.title}</Text>
                  <Text style={styles.badgeDesc}>{b.description}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Empty state */}
        {topics.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No topics yet. Start learning to see your progress here.</Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  backBtn: { padding: 4, marginRight: 12 },
  backText: { fontSize: 15, color: "#6366f1" },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: "600", color: "#111" },
  settingsBtn: { padding: 4 },
  settingsText: { fontSize: 14, color: "#6b7280" },
  container: { padding: 20, paddingBottom: 40, gap: 20 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    padding: 16,
  },
  profileInfo: { flex: 1 },
  studentName: { fontSize: 18, fontWeight: "700", color: "#111" },
  levelTitle: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  streakBadge: {
    backgroundColor: "#fef9c3",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  streakText: { fontSize: 15, fontWeight: "600", color: "#92400e" },
  xpSection: { gap: 6 },
  xpLabelRow: { flexDirection: "row", justifyContent: "space-between" },
  xpLabel: { fontSize: 14, fontWeight: "600", color: "#6366f1" },
  xpNext: { fontSize: 12, color: "#9ca3af" },
  xpBarBg: { height: 8, backgroundColor: "#e5e7eb", borderRadius: 4, overflow: "hidden" },
  xpBarFill: { height: 8, backgroundColor: "#6366f1", borderRadius: 4 },
  subjectSection: { gap: 10 },
  subjectName: { fontSize: 15, fontWeight: "700", color: "#111" },
  topicRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: "#f3f4f6",
  },
  topicRowLeft: { flex: 1, gap: 2 },
  topicName: { fontSize: 14, color: "#111" },
  bloomLabel: { fontSize: 11, color: "#9ca3af" },
  topicRowRight: { flexDirection: "row", alignItems: "center", gap: 8, width: 110 },
  masteryPct: { fontSize: 12, color: "#6b7280", width: 34, textAlign: "right" },
  badgesSection: { gap: 12 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111" },
  badgesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  badgeCard: {
    width: "45%",
    backgroundColor: "#fef9c3",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  badgeEmoji: { fontSize: 28 },
  badgeTitle: { fontSize: 13, fontWeight: "600", color: "#78350f", textAlign: "center" },
  badgeDesc: { fontSize: 11, color: "#92400e", textAlign: "center" },
  emptyState: { paddingVertical: 40, alignItems: "center" },
  emptyText: { fontSize: 14, color: "#9ca3af", textAlign: "center" },
});

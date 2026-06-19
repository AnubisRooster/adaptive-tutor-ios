import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { listSubjects, listTopics, listSources, createTopics } from "@/lib/data";
import { getActiveStudentId } from "@/lib/session";
import { ingestUrl, type IngestProgress } from "@/lib/ingest";
import { seedTopicContent, type SeedProgress } from "@/lib/topic-seed";
import type { Subject, Topic, Source } from "@/db/schema";

type Tab = "material" | "topic";

export default function IngestScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ subjectId?: string }>();

  const [tab, setTab] = useState<Tab>("material");

  // ── Shared state ─────────────────────────────────────────────────────────
  const [subjects] = useState<Subject[]>(() => listSubjects());
  const [subjectId, setSubjectId] = useState(params.subjectId ?? "");

  // ── Add Material tab ──────────────────────────────────────────────────────
  const [url, setUrl] = useState("");
  const [topicId, setTopicId] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "ingesting" | "done" | "error">("idle");
  const [progressMsg, setProgressMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [chunkCount, setChunkCount] = useState(0);
  const [sources, setSources] = useState<Source[]>(() =>
    subjectId ? listSources(subjectId) : listSources()
  );
  const [topics, setTopics] = useState<Topic[]>(() =>
    subjectId ? listTopics(subjectId) : []
  );

  // ── New Topic tab ─────────────────────────────────────────────────────────
  const [topicName, setTopicName] = useState("");
  const [topicDesc, setTopicDesc] = useState("");
  const [topicPhase, setTopicPhase] = useState<"idle" | "seeding" | "done" | "error">("idle");
  const [topicError, setTopicError] = useState("");
  const [seedMsg, setSeedMsg] = useState("");
  const [createdTopicId, setCreatedTopicId] = useState<string | null>(null);

  function selectSubject(id: string) {
    setSubjectId(id);
    setTopicId(null);
    setSources(listSources(id));
    setTopics(listTopics(id));
  }

  // ── Material handlers ─────────────────────────────────────────────────────
  function handleProgress(p: IngestProgress) {
    if (p.phase === "fetching") setProgressMsg("Fetching page…");
    else if (p.phase === "chunking") setProgressMsg("Splitting into chunks…");
    else if (p.phase === "saving")
      setProgressMsg(`Saving chunk ${p.saved + 1} of ${p.total}…`);
    else if (p.phase === "done") setProgressMsg("Done!");
  }

  async function handleIngest() {
    if (!url.trim() || !subjectId || phase === "ingesting") return;
    setPhase("ingesting");
    setErrorMsg("");
    setProgressMsg("Starting…");
    try {
      const result = await ingestUrl(url.trim(), subjectId, topicId, handleProgress);
      setChunkCount(result.chunkCount);
      setSources(listSources(subjectId));
      setPhase("done");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Something went wrong.");
      setPhase("error");
    }
  }

  function handleReset() {
    setPhase("idle");
    setUrl("");
    setErrorMsg("");
    setProgressMsg("");
  }

  // ── Topic handlers ────────────────────────────────────────────────────────
  async function handleCreateTopic() {
    if (!topicName.trim() || !subjectId) return;
    setTopicPhase("seeding");
    setTopicError("");
    setSeedMsg("Creating topic…");
    try {
      const id = `topic-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const sub = subjects.find((s) => s.id === subjectId)!;
      createTopics([{
        id,
        subjectId,
        name: topicName.trim(),
        description: topicDesc.trim(),
        orderIndex: topics.length,
      }]);
      setCreatedTopicId(id);
      setTopics(listTopics(subjectId));

      // Auto-generate lesson seed content via LLM
      const studentId = await getActiveStudentId();
      if (studentId) {
        await seedTopicContent(
          { id, name: topicName.trim(), description: topicDesc.trim() },
          sub,
          studentId,
          (p: SeedProgress) => {
            if (p.phase === "generating") setSeedMsg("Generating lesson content…");
            else if (p.phase === "saving")
              setSeedMsg(`Saving content… (${p.saved}/${p.total})`);
            else if (p.phase === "done") setSeedMsg(`Ready — ${p.chunkCount} lesson chunks created.`);
            else if (p.phase === "error") setSeedMsg(`Note: content generation failed (${p.message})`);
          }
        );
      }

      setTopicName("");
      setTopicDesc("");
      setTopicPhase("done");
    } catch (e) {
      setTopicError(e instanceof Error ? e.message : "Failed to create topic.");
      setTopicPhase("error");
    }
  }

  const canIngest = url.trim().length > 0 && subjectId.length > 0 && phase !== "ingesting";
  const canCreateTopic = topicName.trim().length > 0 && subjectId.length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} testID="back-btn">
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Content</Text>
      </View>

      {/* Tab switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "material" && styles.tabBtnActive]}
          onPress={() => setTab("material")}
          testID="tab-material"
        >
          <Text style={[styles.tabText, tab === "material" && styles.tabTextActive]}>
            Add Material
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "topic" && styles.tabBtnActive]}
          onPress={() => setTab("topic")}
          testID="tab-topic"
        >
          <Text style={[styles.tabText, tab === "topic" && styles.tabTextActive]}>
            New Topic
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Subject selector — shared */}
        <View style={styles.section}>
          <Text style={styles.label}>Subject</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {subjects.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.chip, s.id === subjectId && styles.chipActive]}
                onPress={() => selectSubject(s.id)}
                testID={`subject-${s.id}`}
              >
                <Text style={[styles.chipText, s.id === subjectId && styles.chipTextActive]}>
                  {s.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── ADD MATERIAL TAB ─────────────────────────────────────────────── */}
        {tab === "material" && (
          <>
            <View style={styles.section}>
              <Text style={styles.label}>URL</Text>
              <TextInput
                style={styles.urlInput}
                value={url}
                onChangeText={setUrl}
                placeholder="https://example.com/article"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                testID="url-input"
              />
            </View>

            {topics.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.label}>Topic (optional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                  <TouchableOpacity
                    style={[styles.chip, topicId === null && styles.chipActive]}
                    onPress={() => setTopicId(null)}
                  >
                    <Text style={[styles.chipText, topicId === null && styles.chipTextActive]}>
                      All topics
                    </Text>
                  </TouchableOpacity>
                  {topics.map((t) => (
                    <TouchableOpacity
                      key={t.id}
                      style={[styles.chip, t.id === topicId && styles.chipActive]}
                      onPress={() => setTopicId(t.id)}
                      testID={`topic-${t.id}`}
                    >
                      <Text style={[styles.chipText, t.id === topicId && styles.chipTextActive]}>
                        {t.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {(phase === "idle" || phase === "error") && (
              <TouchableOpacity
                style={[styles.actionBtn, !canIngest && styles.actionBtnDisabled]}
                disabled={!canIngest}
                onPress={handleIngest}
                testID="ingest-btn"
              >
                <Text style={styles.actionBtnText}>Ingest URL</Text>
              </TouchableOpacity>
            )}

            {phase === "ingesting" && (
              <View style={styles.progressCard} testID="phase-ingesting">
                <ActivityIndicator size="small" color="#6366f1" />
                <Text style={styles.progressText}>{progressMsg}</Text>
              </View>
            )}

            {phase === "done" && (
              <View style={styles.doneCard} testID="phase-done">
                <Text style={styles.doneTitle}>✓ Ingested {chunkCount} chunks</Text>
                <Text style={styles.doneDesc}>
                  This content will now ground tutor answers for the selected subject.
                </Text>
                <TouchableOpacity style={styles.addMoreBtn} onPress={handleReset} testID="add-more-btn">
                  <Text style={styles.addMoreText}>Add another URL</Text>
                </TouchableOpacity>
              </View>
            )}

            {phase === "error" && (
              <View style={styles.errorCard} testID="phase-error">
                <Text style={styles.errorTitle}>Failed to ingest</Text>
                <Text style={styles.errorDesc}>{errorMsg}</Text>
              </View>
            )}

            {sources.length > 0 && (
              <View style={styles.section} testID="sources-list">
                <Text style={styles.sectionTitle}>Ingested Sources</Text>
                {sources.map((s) => (
                  <View key={s.id} style={styles.sourceRow}>
                    <Text style={styles.sourceName} numberOfLines={1}>{s.name}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        s.status === "ready" && styles.statusReady,
                        s.status === "pending" && styles.statusPending,
                        s.status === "error" && styles.statusError,
                      ]}
                    >
                      <Text style={styles.statusText}>{s.status}</Text>
                    </View>
                    <Text style={styles.chunkCountText}>{s.chunkCount} chunks</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* ── NEW TOPIC TAB ─────────────────────────────────────────────────── */}
        {tab === "topic" && (
          <>
            <View style={styles.section}>
              <Text style={styles.label}>Topic Name</Text>
              <TextInput
                style={styles.urlInput}
                value={topicName}
                onChangeText={(t) => { setTopicName(t); setTopicPhase("idle"); }}
                placeholder="e.g. Photosynthesis, The French Revolution…"
                autoCapitalize="words"
                autoCorrect
                testID="topic-name-input"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Description (optional)</Text>
              <TextInput
                style={[styles.urlInput, styles.multilineInput]}
                value={topicDesc}
                onChangeText={setTopicDesc}
                placeholder="What should the tutor cover? Any specific angles or depth?"
                autoCapitalize="sentences"
                autoCorrect
                multiline
                numberOfLines={3}
                testID="topic-desc-input"
              />
            </View>

            <View style={styles.hintCard}>
              <Text style={styles.hintText}>
                After creating a topic, the tutor will generate lesson content and quizzes for it on demand — no material ingestion required.
              </Text>
            </View>

            {(topicPhase === "idle" || topicPhase === "error") && (
              <TouchableOpacity
                style={[styles.actionBtn, !canCreateTopic && styles.actionBtnDisabled]}
                disabled={!canCreateTopic}
                onPress={handleCreateTopic}
                testID="create-topic-btn"
              >
                <Text style={styles.actionBtnText}>Create Topic + Generate Content</Text>
              </TouchableOpacity>
            )}

            {topicPhase === "seeding" && (
              <View style={styles.progressCard} testID="topic-seeding">
                <ActivityIndicator size="small" color="#6366f1" />
                <Text style={styles.progressText}>{seedMsg}</Text>
              </View>
            )}

            {topicPhase === "done" && (
              <View style={styles.doneCard} testID="topic-done">
                <Text style={styles.doneTitle}>✓ Topic ready</Text>
                <Text style={styles.doneDesc}>{seedMsg}</Text>
                <TouchableOpacity
                  style={[styles.addMoreBtn, { backgroundColor: "#6366f1", borderColor: "#6366f1" }]}
                  onPress={() => {
                    router.replace({
                      pathname: "/learn",
                      params: { highlightTopicId: createdTopicId ?? undefined },
                    });
                  }}
                  testID="go-to-topic-btn"
                >
                  <Text style={[styles.addMoreText, { color: "#fff" }]}>Go to topic →</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addMoreBtn}
                  onPress={() => { setTopicPhase("idle"); setCreatedTopicId(null); setSeedMsg(""); }}
                  testID="add-another-topic-btn"
                >
                  <Text style={styles.addMoreText}>Add another topic</Text>
                </TouchableOpacity>
              </View>
            )}

            {topicPhase === "error" && (
              <View style={styles.errorCard} testID="topic-error">
                <Text style={styles.errorTitle}>Failed to create topic</Text>
                <Text style={styles.errorDesc}>{topicError}</Text>
              </View>
            )}

            {topics.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Existing Topics</Text>
                {topics.map((t) => (
                  <View key={t.id} style={styles.topicRow}>
                    <Text style={styles.topicName}>{t.name}</Text>
                    {!!t.description && (
                      <Text style={styles.topicDesc} numberOfLines={2}>{t.description}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </>
        )}

      </ScrollView>
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
  },
  backBtn: { padding: 4, marginRight: 12 },
  backText: { fontSize: 15, color: "#6366f1" },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: "600", color: "#111" },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabBtnActive: { borderBottomColor: "#6366f1" },
  tabText: { fontSize: 14, fontWeight: "600", color: "#9ca3af" },
  tabTextActive: { color: "#6366f1" },
  container: { padding: 20, paddingBottom: 40, gap: 20 },
  section: { gap: 8 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  urlInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: "#111",
    backgroundColor: "#f9fafb",
  },
  multilineInput: { minHeight: 80, textAlignVertical: "top" },
  chipRow: { flexDirection: "row" },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    marginRight: 8,
  },
  chipActive: { backgroundColor: "#6366f1" },
  chipText: { fontSize: 14, color: "#374151" },
  chipTextActive: { color: "#fff", fontWeight: "600" },
  actionBtn: {
    backgroundColor: "#6366f1",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  actionBtnDisabled: { backgroundColor: "#c7d2fe" },
  actionBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  hintCard: {
    backgroundColor: "#f0f0ff",
    borderRadius: 10,
    padding: 14,
  },
  hintText: { fontSize: 13, color: "#4338ca", lineHeight: 19 },
  progressCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f0f0ff",
    borderRadius: 12,
    padding: 16,
  },
  progressText: { fontSize: 14, color: "#4338ca" },
  doneCard: { backgroundColor: "#f0fdf4", borderRadius: 12, padding: 16, gap: 8 },
  doneTitle: { fontSize: 16, fontWeight: "700", color: "#15803d" },
  doneDesc: { fontSize: 14, color: "#166534" },
  addMoreBtn: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#16a34a",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  addMoreText: { fontSize: 14, color: "#16a34a", fontWeight: "600" },
  errorCard: { backgroundColor: "#fef2f2", borderRadius: 12, padding: 16, gap: 8 },
  errorTitle: { fontSize: 16, fontWeight: "700", color: "#dc2626" },
  errorDesc: { fontSize: 14, color: "#b91c1c" },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111", marginBottom: 4 },
  sourceRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#f3f4f6",
    gap: 8,
  },
  sourceName: { flex: 1, fontSize: 13, color: "#374151" },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: "#e5e7eb",
  },
  statusReady: { backgroundColor: "#dcfce7" },
  statusPending: { backgroundColor: "#fef9c3" },
  statusError: { backgroundColor: "#fee2e2" },
  statusText: { fontSize: 11, fontWeight: "600", color: "#374151" },
  chunkCountText: { fontSize: 12, color: "#9ca3af", width: 56, textAlign: "right" },
  topicRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#f3f4f6",
    gap: 4,
  },
  topicName: { fontSize: 14, fontWeight: "600", color: "#111" },
  topicDesc: { fontSize: 13, color: "#6b7280", lineHeight: 18 },
});

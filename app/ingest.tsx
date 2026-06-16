import { useMemo, useState } from "react";
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
import { listSubjects, listTopics, listSources } from "@/lib/data";
import { ingestUrl, type IngestProgress } from "@/lib/ingest";
import type { Subject, Topic, Source } from "@/db/schema";

export default function IngestScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ subjectId?: string }>();

  const [url, setUrl] = useState("");
  const [subjectId, setSubjectId] = useState(params.subjectId ?? "");
  const [topicId, setTopicId] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "ingesting" | "done" | "error">("idle");
  const [progressMsg, setProgressMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [chunkCount, setChunkCount] = useState(0);

  const [subjects] = useState<Subject[]>(() => listSubjects());
  const [sources, setSources] = useState<Source[]>(() =>
    subjectId ? listSources(subjectId) : listSources()
  );

  const topics = useMemo<Topic[]>(
    () => (subjectId ? listTopics(subjectId) : []),
    [subjectId]
  );

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

  const canIngest = url.trim().length > 0 && subjectId.length > 0 && phase !== "ingesting";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} testID="back-btn">
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Material</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

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

        <View style={styles.section}>
          <Text style={styles.label}>Subject</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {subjects.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.chip, s.id === subjectId && styles.chipActive]}
                onPress={() => { setSubjectId(s.id); setTopicId(null); setSources(listSources(s.id)); }}
                testID={`subject-${s.id}`}
              >
                <Text style={[styles.chipText, s.id === subjectId && styles.chipTextActive]}>
                  {s.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
            style={[styles.ingestBtn, !canIngest && styles.ingestBtnDisabled]}
            disabled={!canIngest}
            onPress={handleIngest}
            testID="ingest-btn"
          >
            <Text style={styles.ingestBtnText}>Ingest URL</Text>
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
  ingestBtn: {
    backgroundColor: "#6366f1",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  ingestBtnDisabled: { backgroundColor: "#c7d2fe" },
  ingestBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
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
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111" },
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
});

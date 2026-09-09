import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { getActiveStudentId } from "@/lib/session";
import { getStudent, listSubjects, getAllTopics, listChunks } from "@/lib/data";
import { searchChunks, type SearchHit } from "@/lib/rag";
import type { Student } from "@/db/schema";

export default function SearchScreen() {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);

  const subjectById = useMemo(() => new Map(listSubjects().map((s) => [s.id, s])), []);
  const topicById = useMemo(() => new Map(getAllTopics().map((t) => [t.id, t])), []);
  // Cheap, stable for the lifetime of the screen; recomputed on each open.
  const hasContent = useMemo(
    () => listSubjects().some((s) => listChunks(s.id).length > 0),
    []
  );

  useEffect(() => {
    (async () => {
      const id = await getActiveStudentId();
      if (!id) { router.replace("/"); return; }
      const stu = getStudent(id);
      if (!stu) { router.replace("/"); return; }
      setStudent(stu);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce the BM25 search (reads happen locally and are fast).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const q = query.trim();
      if (!q) {
        if (!cancelled) setResults([]);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
      if (!cancelled) setResults(searchChunks(q, 25));
    })();
    return () => { cancelled = true; };
  }, [query]);

  if (!student) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  function openHit(hit: SearchHit) {
    const params: Record<string, string> = { subjectId: hit.subjectId };
    if (hit.topicId) params.topicId = hit.topicId;
    router.replace({ pathname: "/learn", params });
  }

  const trimmed = query.trim();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} testID="back-btn">
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search</Text>
        <TouchableOpacity
          style={styles.clearAllBtn}
          onPress={() => { setQuery(""); setResults([]); }}
          testID="search-clear"
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <Text style={styles.clearAllText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Search box */}
      <View style={styles.searchBoxArea}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search your notes & sources…"
            placeholderTextColor="#9ca3af"
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            testID="search-input"
            accessibilityLabel="Search your notes and sources"
          />
        </View>
        <Text style={styles.searchHint}>Matches across every subject — notes, lessons, and saved URLs.</Text>
      </View>

      {!trimmed ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{hasContent ? "What are you studying today?" : "No saved material yet"}</Text>
          <Text style={styles.emptyDesc}>
            {hasContent
              ? "Type a topic, question, or phrase to search everything you&apos;ve added."
              : "Add material by URL to build a searchable library of your own notes and sources."}
          </Text>
          {!hasContent && (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.push("/ingest")}
              testID="search-add-material"
            >
              <Text style={styles.primaryBtnText}>+ Add material (URL)</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item, i) => `${item.subjectId}-${item.topicId}-${item.source}-${i}`}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item, index }) => {
            const subject = subjectById.get(item.subjectId);
            const topic = item.topicId ? topicById.get(item.topicId) : undefined;
            return (
              <TouchableOpacity
                style={styles.resultRow}
                onPress={() => openHit(item)}
                testID={`search-row-${index}`}
                accessibilityRole="button"
                accessibilityLabel={item.text}
              >
                <Text style={styles.resultText} numberOfLines={3}>
                  {item.text}
                </Text>
                <View style={styles.resultMeta}>
                  {subject && <Text style={styles.resultSubject}>{subject.name}</Text>}
                  {topic && <Text style={styles.resultTopic}>› {topic.name}</Text>}
                  <Text style={styles.resultSource} numberOfLines={1}>{item.source}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No results for “{trimmed}”</Text>
              <Text style={styles.emptyDesc}>Try a broader term, or add more material by URL.</Text>
            </View>
          }
          contentContainerStyle={results.length === 0 ? styles.flatEmpty : styles.flatList}
          style={styles.resultsList}
        />
      )}
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
  clearAllBtn: { padding: 4 },
  clearAllText: { fontSize: 14, color: "#6b7280" },
  searchBoxArea: { paddingHorizontal: 16, paddingTop: 14, gap: 6 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 16, color: "#111", padding: 0 },
  searchHint: { fontSize: 12, color: "#9ca3af" },
  resultsList: { flex: 1, marginTop: 4 },
  flatList: { padding: 16, gap: 12 },
  flatEmpty: { flexGrow: 1 },
  resultRow: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  resultText: { fontSize: 14, color: "#111", lineHeight: 20 },
  resultMeta: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  resultSubject: { fontSize: 12, fontWeight: "600", color: "#6366f1" },
  resultTopic: { fontSize: 12, color: "#374151" },
  resultSource: { fontSize: 12, color: "#9ca3af", flexShrink: 1 },
  emptyState: { paddingVertical: 40, paddingHorizontal: 24, alignItems: "center", gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#111", textAlign: "center" },
  emptyDesc: { fontSize: 13, color: "#6b7280", textAlign: "center", lineHeight: 19 },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: "#6366f1",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  primaryBtnText: { fontSize: 14, fontWeight: "600", color: "#fff" },
});
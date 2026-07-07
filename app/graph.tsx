import { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { getActiveStudentId } from "@/lib/session";
import { getStudent, listSubjects, listTopics, getMasteryMap } from "@/lib/data";
import { buildTopicGraph, toCytoscapeJSON } from "@/lib/graph";
import KnowledgeGraphView from "@/components/KnowledgeGraphView";
import type { Subject, Topic, Mastery } from "@/db/schema";

export default function KnowledgeMapScreen() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [masteryMap, setMasteryMap] = useState<Map<string, Mastery>>(new Map());
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  useEffect(() => {
    (async () => {
      const id = await getActiveStudentId();
      if (!id) { router.replace("/"); return; }
      const stu = getStudent(id);
      if (!stu) { router.replace("/"); return; }
      const subs: Subject[] = listSubjects();
      setTopics(subs.flatMap((s) => listTopics(s.id)));
      setMasteryMap(getMasteryMap(id));
      setReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cytoscapeJSON = useMemo(
    () => toCytoscapeJSON(buildTopicGraph(topics, masteryMap)),
    [topics, masteryMap]
  );

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} testID="back-btn">
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Knowledge Map</Text>
        <View style={styles.backBtn} />
      </View>

      <KnowledgeGraphView
        cytoscapeJSON={cytoscapeJSON}
        onNodeTap={(topicId) => setSelectedTopic(topics.find((t) => t.id === topicId) ?? null)}
      />

      {selectedTopic && (
        <View style={styles.detailCard} testID="topic-detail-card">
          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>{selectedTopic.name}</Text>
            <TouchableOpacity onPress={() => setSelectedTopic(null)} testID="detail-close-btn">
              <Text style={styles.detailClose}>✕</Text>
            </TouchableOpacity>
          </View>
          {selectedTopic.description.length > 0 && (
            <Text style={styles.detailDesc}>{selectedTopic.description}</Text>
          )}
          <Text style={styles.detailMastery}>
            Mastery: {Math.round((masteryMap.get(selectedTopic.id)?.mastery ?? 0) * 100)}%
          </Text>
        </View>
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
  backBtn: { padding: 4, marginRight: 12, minWidth: 60 },
  backText: { fontSize: 15, color: "#6366f1" },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: "600", color: "#111", textAlign: "center" },
  detailCard: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  detailHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  detailTitle: { fontSize: 16, fontWeight: "700", color: "#111", flex: 1 },
  detailClose: { fontSize: 16, color: "#9ca3af", paddingLeft: 12 },
  detailDesc: { fontSize: 13, color: "#4b5563" },
  detailMastery: { fontSize: 13, fontWeight: "600", color: "#6366f1" },
});

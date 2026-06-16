import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { getActiveStudentId } from "@/lib/session";
import { getApiKey, setApiKey, deleteApiKey } from "@/lib/key-store";
import { validateApiKey, fetchModelCatalog, rankModels } from "@/lib/openrouter";
import { getStudent, updateStudentModel } from "@/lib/data";

export default function SettingsScreen() {
  const router = useRouter();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState("");

  const [currentKey, setCurrentKey] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [keyStatus, setKeyStatus] = useState<"idle" | "validating" | "valid" | "invalid">("idle");
  const [keyError, setKeyError] = useState<string | null>(null);

  const [models, setModels] = useState<{ id: string; name: string; isFree: boolean }[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("");

  useEffect(() => {
    (async () => {
      const id = await getActiveStudentId();
      if (!id) { router.replace("/"); return; }
      setStudentId(id);
      const student = getStudent(id);
      if (student) {
        setStudentName(student.name);
        setSelectedModel(student.openrouterModel ?? "google/gemma-3-27b-it:free");
      }
      const key = await getApiKey(id);
      setCurrentKey(key);
    })();
  }, [router]);

  async function validateAndSave() {
    if (!studentId) return;
    const key = keyInput.trim();
    if (!key) { setKeyError("Please enter an API key."); return; }
    setKeyStatus("validating");
    setKeyError(null);
    const ok = await validateApiKey(key);
    if (!ok) {
      setKeyStatus("invalid");
      setKeyError("Key rejected by OpenRouter. Check it and try again.");
      return;
    }
    await setApiKey(studentId, key);
    setCurrentKey(key);
    setKeyInput("");
    setKeyStatus("valid");
    // Load model catalog now that we have a valid key
    loadModels(key);
  }

  async function removeKey() {
    if (!studentId) return;
    await deleteApiKey(studentId);
    setCurrentKey(null);
    setKeyStatus("idle");
    setModels([]);
  }

  async function loadModels(key?: string) {
    const k = key ?? currentKey;
    if (!k) return;
    setLoadingModels(true);
    try {
      const raw = await fetchModelCatalog();
      const ranked = rankModels(raw);
      setModels(ranked.slice(0, 50).map((m) => ({ id: m.id, name: m.name, isFree: m.isFree })));
    } catch {
      // non-fatal
    } finally {
      setLoadingModels(false);
    }
  }

  function saveModel(modelId: string) {
    if (!studentId) return;
    setSelectedModel(modelId);
    updateStudentModel(studentId, modelId);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Settings{studentName ? ` — ${studentName}` : ""}</Text>
        </View>

        {/* API Key section */}
        <Text style={styles.sectionTitle}>OpenRouter API Key</Text>
        {currentKey ? (
          <View style={styles.keyRow}>
            <Text style={styles.keyMasked}>
              {currentKey.slice(0, 8)}{"•".repeat(Math.max(0, currentKey.length - 12))}{currentKey.slice(-4)}
            </Text>
            <TouchableOpacity style={styles.removeBtn} onPress={removeKey}>
              <Text style={styles.removeBtnText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.hint}>No key stored. Enter one below to enable the tutor.</Text>
        )}

        <TextInput
          style={styles.input}
          value={keyInput}
          onChangeText={setKeyInput}
          placeholder="sk-or-v1-..."
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          onSubmitEditing={validateAndSave}
        />
        {keyError ? <Text style={styles.errorText}>{keyError}</Text> : null}
        {keyStatus === "valid" && !keyError ? (
          <Text style={styles.successText}>Key saved and validated.</Text>
        ) : null}
        <TouchableOpacity
          style={[styles.primaryBtn, keyStatus === "validating" && styles.btnDisabled]}
          onPress={validateAndSave}
          disabled={keyStatus === "validating"}
        >
          {keyStatus === "validating" ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>Validate &amp; Save</Text>
          )}
        </TouchableOpacity>

        {/* Model picker */}
        {currentKey ? (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Model</Text>
              {models.length === 0 && !loadingModels && (
                <TouchableOpacity onPress={() => loadModels()}>
                  <Text style={styles.loadLink}>Load catalog</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.selectedModel}>Current: {selectedModel}</Text>
            {loadingModels && <ActivityIndicator style={{ marginVertical: 8 }} />}
            {models.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[styles.modelRow, m.id === selectedModel && styles.modelRowSelected]}
                onPress={() => saveModel(m.id)}
              >
                <Text style={styles.modelName}>{m.name}</Text>
                {m.isFree && <Text style={styles.freeBadge}>FREE</Text>}
              </TouchableOpacity>
            ))}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 24, gap: 12 },
  backBtn: { padding: 4 },
  backText: { fontSize: 15, color: "#6366f1" },
  title: { fontSize: 18, fontWeight: "700", color: "#111", flex: 1 },
  sectionTitle: { fontSize: 15, fontWeight: "600", color: "#111", marginBottom: 8, marginTop: 16 },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  hint: { fontSize: 13, color: "#6b7280", marginBottom: 8 },
  keyRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  keyMasked: { flex: 1, fontFamily: "monospace", fontSize: 13, color: "#374151" },
  removeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fca5a5",
  },
  removeBtnText: { color: "#ef4444", fontSize: 13 },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: "#111",
    fontFamily: "monospace",
    marginBottom: 6,
  },
  errorText: { color: "#ef4444", fontSize: 13, marginBottom: 6 },
  successText: { color: "#10b981", fontSize: 13, marginBottom: 6 },
  primaryBtn: {
    backgroundColor: "#6366f1",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  selectedModel: { fontSize: 13, color: "#6b7280", marginBottom: 8 },
  loadLink: { fontSize: 13, color: "#6366f1" },
  modelRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 6,
  },
  modelRowSelected: { borderColor: "#6366f1", backgroundColor: "#eef2ff" },
  modelName: { flex: 1, fontSize: 13, color: "#111" },
  freeBadge: {
    fontSize: 10,
    fontWeight: "700",
    color: "#10b981",
    backgroundColor: "#d1fae5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});

import { useEffect, useState, useCallback } from "react";
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
import { useRouter } from "expo-router";
import { getActiveStudentId } from "@/lib/session";
import { getApiKey, setApiKey, deleteApiKey } from "@/lib/key-store";
import { validateApiKey, fetchModelCatalog, rankModels } from "@/lib/openrouter";
import {
  getStudent,
  updateStudentModel,
  updateStudentProvider,
  updateStudentOndeviceModel,
} from "@/lib/data";
import {
  isBiometricAvailable,
  getBiometricLockEnabled,
  setBiometricLockEnabled,
  authenticateWithBiometrics,
} from "@/lib/biometric";
import {
  requestNotificationPermission,
  scheduleDailyReminder,
  cancelDailyReminder,
  getReminderSettings,
} from "@/lib/notify";
import {
  ON_DEVICE_MODELS,
  isModelDownloaded,
  downloadModel,
  deleteModel,
  getActiveDownload,
  formatBytes,
  type DownloadProgress,
} from "@/lib/ondevice";

function formatHour(h: number): string {
  const ampm = h < 12 ? "AM" : "PM";
  const displayH = h % 12 || 12;
  return `${displayH}:00 ${ampm}`;
}

type DownloadState =
  | { status: "idle" }
  | { status: "downloading"; progress: DownloadProgress }
  | { status: "error"; message: string };

export default function SettingsScreen() {
  const router = useRouter();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState("");

  // Provider
  const [provider, setProvider] = useState<"openrouter" | "on-device">("openrouter");

  // OpenRouter
  const [currentKey, setCurrentKey] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [keyStatus, setKeyStatus] = useState<"idle" | "validating" | "valid" | "invalid">("idle");
  const [keyError, setKeyError] = useState<string | null>(null);
  const [models, setModels] = useState<{ id: string; name: string; isFree: boolean }[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("");

  // On-device
  const [downloadedModels, setDownloadedModels] = useState<Record<string, boolean>>({});
  const [selectedOndeviceModel, setSelectedOndeviceModel] = useState<string>("llama-3.2-3b-q4");
  const [downloadStates, setDownloadStates] = useState<Record<string, DownloadState>>({});

  // Security / notifications
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderHour, setReminderHour] = useState(8);

  const refreshDownloadedStatus = useCallback(async () => {
    const statuses: Record<string, boolean> = {};
    for (const m of ON_DEVICE_MODELS) {
      statuses[m.id] = await isModelDownloaded(m.id);
    }
    setDownloadedModels(statuses);
  }, []);

  // Main initialization: load student data, API key, biometrics, notifications.
  useEffect(() => {
    (async () => {
      const id = await getActiveStudentId();
      if (!id) { router.replace("/"); return; }
      setStudentId(id);
      const student = getStudent(id);
      if (student) {
        setStudentName(student.name);
        setProvider((student.llmProvider ?? "openrouter") as "openrouter" | "on-device");
        setSelectedModel(student.openrouterModel ?? "google/gemma-3-27b-it:free");
        setSelectedOndeviceModel(student.ondeviceModel ?? "llama-3.2-3b-q4");
      }
      const key = await getApiKey(id);
      setCurrentKey(key);

      const available = await isBiometricAvailable();
      setBiometricAvailable(available);
      if (available) {
        const lockOn = await getBiometricLockEnabled();
        setBiometricEnabled(lockOn);
      }
      const { enabled, hour } = await getReminderSettings();
      setReminderEnabled(enabled);
      setReminderHour(hour);
    })();
  }, [router]);

  // Separate effect: check which on-device models are already downloaded.
  useEffect(() => {
    refreshDownloadedStatus();
  }, [refreshDownloadedStatus]);

  // ── OpenRouter helpers ────────────────────────────────────────────────────

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

  function saveOrModel(modelId: string) {
    if (!studentId) return;
    setSelectedModel(modelId);
    updateStudentModel(studentId, modelId);
  }

  // ── On-device helpers ─────────────────────────────────────────────────────

  async function startDownload(modelId: string) {
    setDownloadStates((s) => ({ ...s, [modelId]: { status: "downloading", progress: { bytesWritten: 0, totalBytes: 0, fraction: 0 } } }));
    try {
      await downloadModel(modelId, (progress) => {
        setDownloadStates((s) => ({ ...s, [modelId]: { status: "downloading", progress } }));
      });
      await refreshDownloadedStatus();
      setDownloadStates((s) => ({ ...s, [modelId]: { status: "idle" } }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setDownloadStates((s) => ({ ...s, [modelId]: { status: "error", message: msg } }));
      await refreshDownloadedStatus();
    }
  }

  async function cancelDownload(modelId: string) {
    const active = getActiveDownload();
    if (active?.modelId === modelId) {
      await active.cancel();
    }
    setDownloadStates((s) => ({ ...s, [modelId]: { status: "idle" } }));
    await refreshDownloadedStatus();
  }

  async function handleDeleteModel(modelId: string) {
    await deleteModel(modelId);
    await refreshDownloadedStatus();
    if (studentId && selectedOndeviceModel === modelId) {
      const firstDownloaded = ON_DEVICE_MODELS.find((m) => downloadedModels[m.id] && m.id !== modelId);
      const fallback = firstDownloaded?.id ?? "llama-3.2-3b-q4";
      setSelectedOndeviceModel(fallback);
      updateStudentOndeviceModel(studentId, fallback);
    }
  }

  function selectOndeviceModel(modelId: string) {
    if (!studentId) return;
    setSelectedOndeviceModel(modelId);
    updateStudentOndeviceModel(studentId, modelId);
  }

  // ── Provider toggle ───────────────────────────────────────────────────────

  function switchProvider(p: "openrouter" | "on-device") {
    if (!studentId) return;
    setProvider(p);
    updateStudentProvider(studentId, p);
  }

  // ── Biometric / notification helpers ─────────────────────────────────────

  async function handleBiometricToggle() {
    if (!biometricEnabled) {
      const ok = await authenticateWithBiometrics();
      if (!ok) return;
      await setBiometricLockEnabled(true);
      setBiometricEnabled(true);
    } else {
      await setBiometricLockEnabled(false);
      setBiometricEnabled(false);
    }
  }

  async function handleReminderToggle() {
    if (!reminderEnabled) {
      const granted = await requestNotificationPermission();
      if (!granted) return;
      await scheduleDailyReminder(reminderHour, 0);
      setReminderEnabled(true);
    } else {
      await cancelDailyReminder();
      setReminderEnabled(false);
    }
  }

  async function adjustHour(delta: number) {
    const newHour = (reminderHour + delta + 24) % 24;
    setReminderHour(newHour);
    if (reminderEnabled) await scheduleDailyReminder(newHour, 0);
  }

  // ── Render ────────────────────────────────────────────────────────────────

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

        {/* ── Provider selector ── */}
        <Text style={styles.sectionTitle}>LLM Provider</Text>
        <View style={styles.segmentRow}>
          <TouchableOpacity
            style={[styles.segmentBtn, provider === "openrouter" && styles.segmentActive]}
            onPress={() => switchProvider("openrouter")}
            testID="provider-openrouter"
          >
            <Text style={[styles.segmentText, provider === "openrouter" && styles.segmentTextActive]}>
              OpenRouter
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, provider === "on-device" && styles.segmentActive]}
            onPress={() => switchProvider("on-device")}
            testID="provider-ondevice"
          >
            <Text style={[styles.segmentText, provider === "on-device" && styles.segmentTextActive]}>
              On-Device
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.hint}>
          {provider === "openrouter"
            ? "Uses OpenRouter cloud models. Requires an API key and network access."
            : "Runs a GGUF model locally on this device using the Neural Engine + GPU. No network required after download."}
        </Text>

        {/* ── OpenRouter section ── */}
        {provider === "openrouter" && (
          <>
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

            {currentKey && (
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
                    onPress={() => saveOrModel(m.id)}
                  >
                    <Text style={styles.modelName}>{m.name}</Text>
                    {m.isFree && <Text style={styles.freeBadge}>FREE</Text>}
                  </TouchableOpacity>
                ))}
              </>
            )}
          </>
        )}

        {/* ── On-device section ── */}
        {provider === "on-device" && (
          <>
            <Text style={styles.sectionTitle}>On-Device Models</Text>
            <Text style={styles.hint}>
              Download a model once (~700 MB – 2.2 GB). It runs entirely on this device using Metal GPU acceleration. No API key needed.
            </Text>

            {ON_DEVICE_MODELS.map((model) => {
              const downloaded = downloadedModels[model.id] ?? false;
              const dlState = downloadStates[model.id] ?? { status: "idle" };
              const isDownloading = dlState.status === "downloading";
              const isSelected = selectedOndeviceModel === model.id;

              return (
                <View
                  key={model.id}
                  style={[styles.ondeviceCard, isSelected && downloaded && styles.ondeviceCardSelected]}
                  testID={`model-card-${model.id}`}
                >
                  <View style={styles.ondeviceCardHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.modelNameRow}>
                        <Text style={styles.ondeviceModelName}>{model.name}</Text>
                        {model.recommended && (
                          <View style={styles.recommendedBadge}>
                            <Text style={styles.recommendedText}>Recommended</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.ondeviceModelDesc}>{model.description}</Text>
                      <Text style={styles.ondeviceModelSize}>{formatBytes(model.sizeBytes)}</Text>
                    </View>
                  </View>

                  {/* Download progress bar */}
                  {isDownloading && dlState.status === "downloading" && (
                    <View style={styles.progressContainer}>
                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${Math.round(dlState.progress.fraction * 100)}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.progressText}>
                        {formatBytes(dlState.progress.bytesWritten)} / {formatBytes(dlState.progress.totalBytes)}
                        {"  "}
                        {Math.round(dlState.progress.fraction * 100)}%
                      </Text>
                    </View>
                  )}

                  {dlState.status === "error" && (
                    <Text style={styles.errorText}>Error: {dlState.message}</Text>
                  )}

                  {/* Action buttons */}
                  <View style={styles.ondeviceActions}>
                    {!downloaded && !isDownloading && (
                      <TouchableOpacity
                        style={styles.downloadBtn}
                        onPress={() => startDownload(model.id)}
                        testID={`download-${model.id}`}
                      >
                        <Text style={styles.downloadBtnText}>Download</Text>
                      </TouchableOpacity>
                    )}

                    {isDownloading && (
                      <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => cancelDownload(model.id)}
                        testID={`cancel-${model.id}`}
                      >
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    )}

                    {downloaded && !isDownloading && (
                      <>
                        <TouchableOpacity
                          style={[styles.selectBtn, isSelected && styles.selectBtnActive]}
                          onPress={() => selectOndeviceModel(model.id)}
                          testID={`select-${model.id}`}
                        >
                          <Text style={[styles.selectBtnText, isSelected && styles.selectBtnTextActive]}>
                            {isSelected ? "Selected" : "Use this model"}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteBtn}
                          onPress={() => handleDeleteModel(model.id)}
                          testID={`delete-${model.id}`}
                        >
                          <Text style={styles.deleteBtnText}>Delete</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* ── Security ── */}
        <Text style={styles.sectionTitle}>Security</Text>
        {biometricAvailable ? (
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Require Face ID / Touch ID</Text>
              <Text style={styles.toggleDesc}>Lock the app behind biometrics on launch</Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, biometricEnabled && styles.toggleOn]}
              onPress={handleBiometricToggle}
              testID="biometric-toggle"
              accessibilityRole="switch"
              accessibilityState={{ checked: biometricEnabled }}
            >
              <View style={[styles.toggleThumb, biometricEnabled && styles.toggleThumbOn]} />
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.hint}>
            No biometric hardware or enrollment found on this device.
          </Text>
        )}

        {/* ── Study Reminders ── */}
        <Text style={styles.sectionTitle}>Study Reminders</Text>
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Daily reminder</Text>
            <Text style={styles.toggleDesc}>A nudge to keep your streak going</Text>
          </View>
          <TouchableOpacity
            style={[styles.toggle, reminderEnabled && styles.toggleOn]}
            onPress={handleReminderToggle}
            testID="reminder-toggle"
            accessibilityRole="switch"
            accessibilityState={{ checked: reminderEnabled }}
          >
            <View style={[styles.toggleThumb, reminderEnabled && styles.toggleThumbOn]} />
          </TouchableOpacity>
        </View>
        {reminderEnabled && (
          <View style={styles.timeRow} testID="time-picker">
            <Text style={styles.timeLabel}>Remind me at</Text>
            <TouchableOpacity style={styles.timeBtn} onPress={() => adjustHour(-1)} testID="hour-minus">
              <Text style={styles.timeBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.timeDisplay} testID="hour-display">{formatHour(reminderHour)}</Text>
            <TouchableOpacity style={styles.timeBtn} onPress={() => adjustHour(1)} testID="hour-plus">
              <Text style={styles.timeBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        )}

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

  // Provider segment control
  segmentRow: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
    marginBottom: 8,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  segmentActive: { backgroundColor: "#6366f1" },
  segmentText: { fontSize: 14, fontWeight: "500", color: "#6b7280" },
  segmentTextActive: { color: "#fff" },

  // OpenRouter key
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

  // On-device model cards
  ondeviceCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 14,
    marginBottom: 10,
    backgroundColor: "#f9fafb",
  },
  ondeviceCardSelected: {
    borderColor: "#6366f1",
    backgroundColor: "#eef2ff",
  },
  ondeviceCardHeader: { flexDirection: "row", alignItems: "flex-start" },
  modelNameRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6, marginBottom: 4 },
  ondeviceModelName: { fontSize: 14, fontWeight: "600", color: "#111" },
  recommendedBadge: {
    backgroundColor: "#d1fae5",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  recommendedText: { fontSize: 10, fontWeight: "700", color: "#059669" },
  ondeviceModelDesc: { fontSize: 12, color: "#6b7280", marginBottom: 2 },
  ondeviceModelSize: { fontSize: 11, color: "#9ca3af" },
  progressContainer: { marginTop: 10 },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#e5e7eb",
    overflow: "hidden",
    marginBottom: 4,
  },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: "#6366f1" },
  progressText: { fontSize: 11, color: "#6b7280" },
  ondeviceActions: { flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap" },
  downloadBtn: {
    flex: 1,
    backgroundColor: "#6366f1",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  downloadBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  cancelBtnText: { color: "#374151", fontSize: 13, fontWeight: "500" },
  selectBtn: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  selectBtnActive: { backgroundColor: "#6366f1", borderColor: "#6366f1" },
  selectBtnText: { color: "#374151", fontSize: 13, fontWeight: "500" },
  selectBtnTextActive: { color: "#fff" },
  deleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fca5a5",
  },
  deleteBtnText: { color: "#ef4444", fontSize: 13 },

  // Toggle switch
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#f3f4f6",
    gap: 12,
  },
  toggleInfo: { flex: 1 },
  toggleLabel: { fontSize: 14, fontWeight: "500", color: "#111" },
  toggleDesc: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#d1d5db",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  toggleOn: { backgroundColor: "#6366f1" },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbOn: { alignSelf: "flex-end" },

  // Time picker
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  timeLabel: { flex: 1, fontSize: 14, color: "#374151" },
  timeBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  timeBtnText: { fontSize: 20, fontWeight: "600", color: "#374151" },
  timeDisplay: { fontSize: 16, fontWeight: "600", color: "#111", minWidth: 80, textAlign: "center" },
});

import { useEffect, useState } from "react";
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
import { getStudent, updateStudentProvider, updateStudentOndeviceModel, updateStudentModel } from "@/lib/data";
import {
  ON_DEVICE_MODELS,
  isModelDownloaded,
  downloadModel,
  formatBytes,
  type DownloadProgress,
} from "@/lib/ondevice";
import { validateApiKey } from "@/lib/openrouter";
import { setApiKey } from "@/lib/key-store";
import { markSetupDone, grantCloudConsent, hasCloudConsent } from "@/lib/setup";
import type { Student } from "@/db/schema";

const FREE_MODEL = "google/gemma-3-27b-it:free";

type DownloadState =
  | { status: "idle" }
  | { status: "downloading"; progress: DownloadProgress }
  | { status: "error"; message: string };

export default function SetupScreen() {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [step, setStep] = useState(0);

  // Provider
  const [provider, setProvider] = useState<"on-device" | "openrouter">("on-device");

  // On-device
  const [downloadedModels, setDownloadedModels] = useState<Record<string, boolean>>({});
  const [selectedOndevice, setSelectedOndevice] = useState<string>("");
  const [downloadStates, setDownloadStates] = useState<Record<string, DownloadState>>({});

  // OpenRouter
  const [cloudConsent, setCloudConsent] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [keyError, setKeyError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    (async () => {
      const id = await getActiveStudentId();
      if (!id) { router.replace("/"); return; }
      const stu = getStudent(id);
      if (!stu) { router.replace("/"); return; }
      setStudent(stu);
      setProvider((stu.llmProvider ?? "on-device") as "on-device" | "openrouter");
      setSelectedOndevice(stu.ondeviceModel ?? "llama-3.2-3b-q4");
      setCloudConsent(await hasCloudConsent(id));
      const statuses: Record<string, boolean> = {};
      for (const m of ON_DEVICE_MODELS) {
        statuses[m.id] = await isModelDownloaded(m.id);
      }
      setDownloadedModels(statuses);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startDownload(modelId: string) {
    setDownloadStates((s) => ({ ...s, [modelId]: { status: "downloading", progress: { bytesWritten: 0, totalBytes: 0, fraction: 0 } } }));
    try {
      await downloadModel(modelId, (progress) => {
        setDownloadStates((s) => ({ ...s, [modelId]: { status: "downloading", progress } }));
      });
      const statuses = { ...downloadedModels, [modelId]: true };
      setDownloadedModels(statuses);
      setDownloadStates((s) => ({ ...s, [modelId]: { status: "idle" } }));
      return true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setDownloadStates((s) => ({ ...s, [modelId]: { status: "error", message: msg } }));
      return false;
    }
  }

  function selectOndeviceModel(modelId: string) {
    if (!student) return;
    setSelectedOndevice(modelId);
    updateStudentOndeviceModel(student.id, modelId);
    updateStudentProvider(student.id, "on-device");
    setProvider("on-device");
  }

  async function toggleConsent() {
    if (!student) return;
    const next = !cloudConsent;
    setCloudConsent(next);
    if (next) await grantCloudConsent(student.id);
  }

  async function validateAndSave() {
    if (!student) return;
    if (!cloudConsent) {
      setKeyError("Please consent to sending your prompts to OpenRouter first.");
      return;
    }
    const key = keyInput.trim();
    if (!key) { setKeyError("Please enter an OpenRouter API key (sk-or-v1-…)."); return; }
    setValidating(true);
    setKeyError(null);
    const ok = await validateApiKey(key);
    if (!ok) {
      setKeyError("Key rejected by OpenRouter. Check it and try again.");
      setValidating(false);
      return;
    }
    await setApiKey(student.id, key);
    updateStudentProvider(student.id, "openrouter");
    updateStudentModel(student.id, FREE_MODEL);
    setProvider("openrouter");
    setValidating(false);
    setStep(2);
  }

  function canContinue(): boolean {
  return downloadedModels[selectedOndevice] === true;
}

  async function finish() {
    if (!student) return;
    await markSetupDone(student.id);
    router.replace("/learn");
  }

  async function skip() {
    if (!student) return;
    await markSetupDone(student.id);
    router.replace("/learn");
  }

  if (!student) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} testID="setup-screen">
        {/* Progress dots */}
        <View style={styles.dotsRow}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.dot, i <= step && styles.dotActive]} />
          ))}
        </View>

        {step === 0 && (
          <>
            <Text style={styles.title}>Welcome, {student.name}</Text>
            <Text style={styles.subtitle}>
              Adaptive Tutor keeps your learning on this device by default. Nothing is
              shared unless you choose Cloud mode.
            </Text>

            <View style={styles.bulletCard}>
              <Text style={styles.bullet}>• Profiles, answers, and progress stay in the app</Text>
              <Text style={styles.bullet}>• On-Device mode runs a local model with no internet</Text>
              <Text style={styles.bullet}>• Cloud mode (optional) sends your prompts to OpenRouter</Text>
              <Text style={styles.bullet}>• No account, no ads, no tracking</Text>
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(1)} testID="setup-start">
              <Text style={styles.primaryBtnText}>Get started</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkBtn} onPress={skip} testID="setup-skip">
              <Text style={styles.linkText}>Not now — browse in Preview mode</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 1 && (
          <>
            <Text style={styles.title}>Connect a tutor</Text>
            <Text style={styles.subtitle}>
              Pick how the app powers your tutor. You can change this any time in Settings.
            </Text>

            {/* Provider chooser */}
            <View style={styles.segmentRow}>
              <TouchableOpacity
                style={[styles.segmentBtn, provider === "on-device" && styles.segmentActive]}
                onPress={() => setProvider("on-device")}
                testID="provider-ondevice"
              >
                <Text style={[styles.segmentText, provider === "on-device" && styles.segmentTextActive]}>
                  On-Device
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentBtn, provider === "openrouter" && styles.segmentActive]}
                onPress={() => setProvider("openrouter")}
                testID="provider-openrouter"
              >
                <Text style={[styles.segmentText, provider === "openrouter" && styles.segmentTextActive]}>
                  OpenRouter
                </Text>
              </TouchableOpacity>
            </View>

            {provider === "on-device" && (
              <>
                <Text style={styles.hint}>
                  Download a model once. It runs fully on this device — no internet, no key.
                </Text>
                {ON_DEVICE_MODELS.map((model) => {
                  const downloaded = downloadedModels[model.id] ?? false;
                  const dlState = downloadStates[model.id] ?? { status: "idle" };
                  const isDownloading = dlState.status === "downloading";
                  const isSelected = selectedOndevice === model.id;
                  return (
                    <View
                      key={model.id}
                      style={[styles.modelCard, isSelected && downloaded && styles.modelCardSelected]}
                      testID={`model-card-${model.id}`}
                    >
                      <View style={styles.modelHeader}>
                        <TouchableOpacity style={styles.modelTitleArea} onPress={() => !isDownloading && selectOndeviceModel(model.id)}>
                          <Text style={styles.modelName}>{model.name}</Text>
                          {model.recommended && (
                            <View style={styles.recommendedBadge}>
                              <Text style={styles.recommendedText}>Recommended</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.modelDesc}>{model.description}</Text>
                      <Text style={styles.modelSize}>{formatBytes(model.sizeBytes)}</Text>

                      {isDownloading && dlState.status === "downloading" && (
                        <View style={styles.progressContainer}>
                          <View style={styles.progressTrack}>
                            <View
                              style={[styles.progressFill, { width: `${Math.round(dlState.progress.fraction * 100)}%` }]}
                            />
                          </View>
                          <Text style={styles.progressText}>
                            {formatBytes(dlState.progress.bytesWritten)} / {formatBytes(dlState.progress.totalBytes)}
                            {"  "}{Math.round(dlState.progress.fraction * 100)}%
                          </Text>
                        </View>
                      )}
                      {dlState.status === "error" && (
                        <Text style={styles.errorText}>Error: {dlState.message}</Text>
                      )}

                      <View style={styles.actions}>
                        {!downloaded && !isDownloading && (
                          <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => startDownload(model.id)}
                            testID={`download-${model.id}`}
                          >
                            <Text style={styles.actionBtnText}>Download</Text>
                          </TouchableOpacity>
                        )}
                        {downloaded && !isDownloading && (
                          <TouchableOpacity
                            style={[styles.actionBtn, isSelected && styles.actionBtnActive]}
                            onPress={() => selectOndeviceModel(model.id)}
                            testID={`select-${model.id}`}
                          >
                            <Text style={[styles.actionBtnText, isSelected && styles.actionBtnTextActive]}>
                              {isSelected ? "Using this model" : "Use this model"}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </>
            )}

            {provider === "openrouter" && (
              <>
                <Text style={styles.hint}>
                  OpenRouter is a paid, bring-your-own-key cloud service. Your prompts and answers
                  are sent to the model provider you choose.
                </Text>

                <TouchableOpacity
                  style={styles.consentRow}
                  onPress={toggleConsent}
                  testID="setup-consent-toggle"
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: cloudConsent }}
                >
                  <View style={[styles.checkbox, cloudConsent && styles.checkboxOn]}>
                    {cloudConsent ? <Text style={styles.checkMark}>✓</Text> : null}
                  </View>
                  <Text style={styles.consentText}>
                    I understand my prompts and answers are sent to an AI provider when using Cloud mode.
                  </Text>
                </TouchableOpacity>

                <TextInput
                  style={styles.input}
                  value={keyInput}
                  onChangeText={setKeyInput}
                  placeholder="sk-or-v1-…"
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry
                  editable={!validating}
                  testID="setup-key-input"
                />
                {keyError ? <Text style={styles.errorText}>{keyError}</Text> : null}

                <TouchableOpacity
                  style={[styles.primaryBtn, validating && styles.btnDisabled]}
                  onPress={validateAndSave}
                  disabled={validating}
                  testID="setup-save-key"
                >
                  {validating ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Validate &amp; connect</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.linkBtn} onPress={() => setStep(2)} testID="setup-skip-cloud">
                  <Text style={styles.linkText}>Skip for now — browse in Preview mode</Text>
                </TouchableOpacity>
              </>
            )}

            {provider === "on-device" && (
              <>
                <TouchableOpacity
                  style={[styles.primaryBtn, !canContinue() && styles.btnDisabled]}
                  onPress={() => setStep(2)}
                  disabled={!canContinue()}
                  testID="setup-continue"
                >
                  <Text style={styles.primaryBtnText}>Continue</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.linkBtn} onPress={() => setStep(2)} testID="setup-skip-download">
                  <Text style={styles.linkText}>Skip for now — browse in Preview mode</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.title}>You&apos;re all set</Text>
            <Text style={styles.subtitle}>
              {provider === "on-device" && downloadedModels[selectedOndevice]
                ? `Your tutor is running locally on your device with ${ON_DEVICE_MODELS.find((m) => m.id === selectedOndevice)?.name ?? selectedOndevice}.`
                : "You can browse, learn, and quiz in Preview mode. Connect a model any time in Settings."}
            </Text>
            <View style={styles.bulletCard}>
              <Text style={styles.bullet}>• Start with a lesson plan for your first topic</Text>
              <Text style={styles.bullet}>• Take 5-question quizzes that adapt to you</Text>
              <Text style={styles.bullet}>• Track streaks, XP, and mastery in Progress</Text>
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={finish} testID="setup-finish">
              <Text style={styles.primaryBtnText}>Start learning</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: { padding: 24, paddingBottom: 40 },
  dotsRow: { flexDirection: "row", gap: 6, marginBottom: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#e5e7eb" },
  dotActive: { backgroundColor: "#6366f1" },
  title: { fontSize: 24, fontWeight: "700", color: "#111" },
  subtitle: { fontSize: 14, color: "#6b7280", marginTop: 8, lineHeight: 20 },
  bulletCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 14,
    marginTop: 18,
    gap: 8,
  },
  bullet: { fontSize: 13, color: "#374151", lineHeight: 19 },
  primaryBtn: {
    backgroundColor: "#6366f1",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  primaryBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  btnDisabled: { opacity: 0.5 },
  linkBtn: { paddingVertical: 12, alignItems: "center", marginTop: 4 },
  linkText: { color: "#6366f1", fontSize: 14 },
  segmentRow: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
    marginTop: 18,
    marginBottom: 12,
  },
  segmentBtn: { flex: 1, paddingVertical: 10, alignItems: "center", backgroundColor: "#f9fafb" },
  segmentActive: { backgroundColor: "#6366f1" },
  segmentText: { fontSize: 14, fontWeight: "500", color: "#6b7280" },
  segmentTextActive: { color: "#fff" },
  hint: { fontSize: 13, color: "#6b7280", marginBottom: 12, lineHeight: 19 },
  modelCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 14,
    marginBottom: 10,
    backgroundColor: "#f9fafb",
  },
  modelCardSelected: { borderColor: "#6366f1", backgroundColor: "#eef2ff" },
  modelHeader: { flexDirection: "row", alignItems: "center" },
  modelTitleArea: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 },
  modelName: { fontSize: 14, fontWeight: "600", color: "#111" },
  recommendedBadge: {
    backgroundColor: "#d1fae5",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  recommendedText: { fontSize: 10, fontWeight: "700", color: "#059669" },
  modelDesc: { fontSize: 12, color: "#6b7280", marginTop: 4 },
  modelSize: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  progressContainer: { marginTop: 10 },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: "#e5e7eb", overflow: "hidden", marginBottom: 4 },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: "#6366f1" },
  progressText: { fontSize: 11, color: "#6b7280" },
  actions: { flexDirection: "row", gap: 8, marginTop: 12 },
  actionBtn: {
    flex: 1,
    backgroundColor: "#6366f1",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  actionBtnActive: { backgroundColor: "#10b981" },
  actionBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  actionBtnTextActive: { color: "#fff" },
  consentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fef9c3",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: { backgroundColor: "#6366f1", borderColor: "#6366f1" },
  checkMark: { color: "#fff", fontSize: 14, fontWeight: "700" },
  consentText: { flex: 1, fontSize: 12, color: "#78350f", lineHeight: 17 },
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
});
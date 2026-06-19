import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { getActiveStudentId, clearActiveStudentId } from "@/lib/session";
import {
  getStudent,
  listSubjects,
  listTopics,
  getMasteryMap,
  listOpenGaps,
  getOrCreateSession,
  addMessage,
  getRecentMessages,
  updateStudentProvider,
  updateStudentModel,
  updateStudentOndeviceModel,
} from "@/lib/data";
import { buildTutorTurn } from "@/lib/orchestrator";
import { resolveLlmConfigById, streamChat } from "@/lib/llm";
import { recommendStartTopic } from "@/lib/adaptive";
import { fetchModelCatalog, type OpenRouterModel } from "@/lib/openrouter";
import { ON_DEVICE_MODELS, isModelDownloaded } from "@/lib/ondevice";
import { awardForTeach } from "@/lib/gamify";
import ProfileAvatar from "@/components/ProfileAvatar";
import MasteryBar from "@/components/MasteryBar";
import MarkdownText from "@/components/MarkdownText";
import type { Student } from "@/db/schema";
import type { TutorMode } from "@/lib/prompts";

type ChatMsg = { role: "user" | "assistant"; content: string };

const BLOOM_NAMES = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"];

export default function LearnScreen() {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [subjects, setSubjects] = useState<ReturnType<typeof listSubjects>>([]);
  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Model picker
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<"openrouter" | "on-device">("openrouter");
  const [currentModelId, setCurrentModelId] = useState<string>("");
  const [currentModelLabel, setCurrentModelLabel] = useState("Select model");
  const [orModels, setOrModels] = useState<OpenRouterModel[]>([]);
  const [loadingOrModels, setLoadingOrModels] = useState(false);
  const [downloadedOnDevice, setDownloadedOnDevice] = useState<string[]>([]);

  // Derived
  const subject = useMemo(
    () => subjects.find((s) => s.id === subjectId) ?? null,
    [subjects, subjectId]
  );
  const [topics, setTopics] = useState(() => (subjectId ? listTopics(subjectId) : []));

  // Refresh topics whenever this screen comes into focus (e.g. after adding a topic)
  useFocusEffect(
    useCallback(() => {
      if (subjectId) setTopics(listTopics(subjectId));
    }, [subjectId])
  );
  const masteryMap = useMemo(
    () => (student ? getMasteryMap(student.id) : new Map()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [student, messages.length]
  );
  const topic = useMemo(
    () => topics.find((t) => t.id === topicId) ?? null,
    [topics, topicId]
  );
  const gaps = useMemo(
    () => (student && topicId ? listOpenGaps(student.id, topicId) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [student, topicId, messages.length]
  );

  // Initial load
  useEffect(() => {
    (async () => {
      const id = await getActiveStudentId();
      if (!id) { router.replace("/"); return; }
      const stu = getStudent(id);
      if (!stu) { router.replace("/"); return; }
      setStudent(stu);
      // Initialise model picker label from saved prefs
      const provider = (stu.llmProvider ?? "openrouter") as "openrouter" | "on-device";
      setCurrentProvider(provider);
      if (provider === "on-device") {
        const mid = stu.ondeviceModel ?? "llama-3.2-3b-q4";
        setCurrentModelId(mid);
        setCurrentModelLabel(ON_DEVICE_MODELS.find((m) => m.id === mid)?.name ?? mid);
      } else {
        const mid = stu.openrouterModel ?? "";
        setCurrentModelId(mid);
        setCurrentModelLabel(mid ? mid.split("/").pop() ?? mid : "OpenRouter");
      }
      // Check which on-device models are downloaded
      const downloaded: string[] = [];
      for (const m of ON_DEVICE_MODELS) {
        if (await isModelDownloaded(m.id)) downloaded.push(m.id);
      }
      setDownloadedOnDevice(downloaded);

      const subs = listSubjects();
      setSubjects(subs);
      if (subs.length === 0) return;
      const first = subs[0];
      setSubjectId(first.id);
      const tList = listTopics(first.id);
      setTopics(tList);
      if (tList.length > 0) {
        const recommended = recommendStartTopic(id, first.id);
        setTopicId(recommended?.id ?? tList[0].id);
      }
      // Load recent messages for first subject
      loadRecentMessages(id, first.id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadRecentMessages(studentId: string, sid: string) {
    try {
      const session = getOrCreateSession(studentId, sid);
      const recent = getRecentMessages(session.id, 20);
      setMessages(recent.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })));
    } catch {
      setMessages([]);
    }
  }

  const selectSubject = useCallback(
    (sid: string) => {
      if (!student || sid === subjectId) { setNavOpen(false); return; }
      setSubjectId(sid);
      setNavOpen(false);
      const tList = listTopics(sid);
      setTopics(tList);
      if (tList.length > 0) {
        const recommended = recommendStartTopic(student.id, sid);
        setTopicId(recommended?.id ?? tList[0].id);
      }
      loadRecentMessages(student.id, sid);
    },
    [student, subjectId]
  );

  function updateLastAssistant(content: string) {
    setMessages((prev) => {
      const copy = [...prev];
      for (let i = copy.length - 1; i >= 0; i--) {
        if (copy[i].role === "assistant") {
          copy[i] = { role: "assistant", content };
          return copy;
        }
      }
      return copy;
    });
  }

  async function streamTutor(mode: TutorMode, userText?: string) {
    if (!student || !subjectId || !topicId || busy) return;
    setKeyError(null);
    setBusy(true);

    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    if (userText) {
      history.push({ role: "user", content: userText });
      setMessages((prev) => [...prev, { role: "user", content: userText }]);
    }
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
    scrollRef.current?.scrollToEnd({ animated: true });

    try {
      const cfg = await resolveLlmConfigById(student.id);
      const { messages: llmMsgs } = await buildTutorTurn({
        studentId: student.id,
        subjectId,
        topicId,
        mode,
        history,
      });
      const gen = streamChat(cfg, llmMsgs);
      let acc = "";
      for await (const chunk of gen) {
        acc += chunk;
        updateLastAssistant(acc);
        scrollRef.current?.scrollToEnd({ animated: false });
      }
      // Persist to DB and award XP for teach turns
      if (userText) {
        const session = getOrCreateSession(student.id, subjectId);
        addMessage({ sessionId: session.id, studentId: student.id, role: "user", content: userText, topicId });
        addMessage({ sessionId: session.id, studentId: student.id, role: "assistant", content: acc, topicId });
      }
      if (mode === "teach") {
        awardForTeach(student.id);
      }
    } catch (e) {
      const msg = String(e);
      if (msg.includes("No OpenRouter API key")) {
        setKeyError("No API key set. Go to Settings to add your OpenRouter key.");
        updateLastAssistant("");
        setMessages((prev) => prev.filter((m) => !(m.role === "assistant" && m.content === "")));
      } else {
        updateLastAssistant("Something went wrong — please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  function onSend() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    streamTutor("teach", text);
  }

  async function openModelPicker() {
    setModelPickerOpen(true);
    if (orModels.length === 0) {
      setLoadingOrModels(true);
      try {
        const all = await fetchModelCatalog();
        setOrModels(all.filter((m) => m.isFree).sort((a, b) => a.name.localeCompare(b.name)));
      } catch {
        // leave empty — user can retry
      } finally {
        setLoadingOrModels(false);
      }
    }
  }

  function selectModel(provider: "openrouter" | "on-device", modelId: string, label: string) {
    if (!student) return;
    setCurrentProvider(provider);
    setCurrentModelId(modelId);
    setCurrentModelLabel(label);
    updateStudentProvider(student.id, provider);
    if (provider === "on-device") {
      updateStudentOndeviceModel(student.id, modelId);
    } else {
      updateStudentModel(student.id, modelId);
    }
    setModelPickerOpen(false);
  }

  async function switchProfile() {
    await clearActiveStudentId();
    router.replace("/");
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => setNavOpen(true)} testID="menu-btn">
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {subject?.name ?? "Adaptive Tutor"}
        </Text>
        <TouchableOpacity onPress={() => router.push("/progress")} style={styles.avatarBtn} testID="progress-btn">
          <ProfileAvatar name={student.name} color={student.color} size={30} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.switchBtn} onPress={switchProfile}>
          <Text style={styles.switchBtnText}>Switch</Text>
        </TouchableOpacity>
      </View>

      {keyError && (
        <TouchableOpacity
          style={styles.keyErrorBanner}
          onPress={() => router.push("/settings")}
        >
          <Text style={styles.keyErrorText}>{keyError} Tap to fix.</Text>
        </TouchableOpacity>
      )}

      {/* Model selector bar */}
      <View style={styles.modelBar}>
        <TouchableOpacity style={styles.modelPill} onPress={openModelPicker} testID="model-pill">
          <Text style={styles.modelPillIcon}>
            {currentProvider === "on-device" ? "📱" : "☁️"}
          </Text>
          <Text style={styles.modelPillLabel} numberOfLines={1}>
            {currentModelLabel}
          </Text>
          <Text style={styles.modelPillChevron}>▾</Text>
        </TouchableOpacity>
      </View>

      {/* Current topic bar */}
      {topic && (
        <View style={styles.topicBar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.topicName}>{topic.name}</Text>
            <Text style={styles.topicDesc} numberOfLines={1}>{topic.description}</Text>
          </View>
          <View style={styles.bloomBadge}>
            <Text style={styles.bloomText}>
              {BLOOM_NAMES[(masteryMap.get(topicId)?.bloomLevel ?? 1) - 1]}
            </Text>
          </View>
        </View>
      )}

      {/* Action bar */}
      {topic && (
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={[styles.actionBtn, busy && styles.actionBtnDisabled]}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Teach me the next step"
            onPress={() => streamTutor("teach", `Please teach me the next step on "${topic.name}".`)}
          >
            <Text style={styles.actionBtnText}>Teach me</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, busy && styles.actionBtnDisabled]}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={`Review${gaps.length ? ` ${gaps.length} open gaps` : ""}`}
            onPress={() => streamTutor("review")}
          >
            <Text style={styles.actionBtnText}>Review{gaps.length ? ` (${gaps.length})` : ""}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.quizBtn, busy && styles.actionBtnDisabled]}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Start a quiz"
            onPress={() => router.push({ pathname: "/quiz", params: { subjectId, topicId } })}
            testID="quiz-btn"
          >
            <Text style={[styles.actionBtnText, styles.quizBtnText]}>Quiz me</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Ready when you are.</Text>
              <Text style={styles.emptyHint}>
                Tap &quot;Teach me&quot; or type a question below. Select a topic from the menu.
              </Text>
            </View>
          )}
          {messages.map((m, i) => (
            <ChatBubble key={i} msg={m} color={student.color} />
          ))}
          {busy && (
            <View style={styles.thinkingRow}>
              <ActivityIndicator size="small" />
              <Text style={styles.thinkingText}>thinking…</Text>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder="Ask anything…"
            multiline
            maxLength={2000}
            returnKeyType="send"
            onSubmitEditing={onSend}
            blurOnSubmit={false}
            autoCorrect
            autoCapitalize="sentences"
            spellCheck
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || busy) && styles.sendBtnDisabled]}
            disabled={!input.trim() || busy}
            onPress={onSend}
          >
            <Text style={styles.sendBtnText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Model picker sheet */}
      <Modal visible={modelPickerOpen} transparent animationType="slide">
        <TouchableOpacity
          style={styles.drawerOverlay}
          activeOpacity={1}
          onPress={() => setModelPickerOpen(false)}
        />
        <View style={styles.pickerSheet}>
          <View style={styles.pickerHandle} />
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Choose a model</Text>
            <TouchableOpacity onPress={() => setModelPickerOpen(false)}>
              <Text style={styles.drawerClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.pickerScroll} keyboardShouldPersistTaps="handled">

            {/* On-device section */}
            {downloadedOnDevice.length > 0 && (
              <>
                <Text style={styles.pickerSection}>📱  On-Device</Text>
                {ON_DEVICE_MODELS.filter((m) => downloadedOnDevice.includes(m.id)).map((m) => {
                  const active = currentProvider === "on-device" && currentModelId === m.id;
                  return (
                    <TouchableOpacity
                      key={m.id}
                      style={[styles.pickerRow, active && styles.pickerRowActive]}
                      onPress={() => selectModel("on-device", m.id, m.name)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.pickerRowName, active && styles.pickerRowNameActive]}>
                          {m.name}
                        </Text>
                        <Text style={styles.pickerRowSub}>{m.description}</Text>
                      </View>
                      {active && <Text style={styles.pickerCheck}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            {/* OpenRouter free section */}
            <Text style={styles.pickerSection}>☁️  OpenRouter — Free</Text>
            {loadingOrModels && (
              <View style={styles.pickerLoading}>
                <ActivityIndicator size="small" color="#6366f1" />
                <Text style={styles.pickerLoadingText}>Fetching models…</Text>
              </View>
            )}
            {!loadingOrModels && orModels.length === 0 && (
              <TouchableOpacity style={styles.pickerRetry} onPress={openModelPicker}>
                <Text style={styles.pickerRetryText}>Could not load models — tap to retry</Text>
              </TouchableOpacity>
            )}
            {orModels.map((m) => {
              const active = currentProvider === "openrouter" && currentModelId === m.id;
              const label = m.name || m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.pickerRow, active && styles.pickerRowActive]}
                  onPress={() => selectModel("openrouter", m.id, label)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pickerRowName, active && styles.pickerRowNameActive]}>
                      {label}
                    </Text>
                    <Text style={styles.pickerRowSub}>{m.contextLength.toLocaleString()} ctx</Text>
                  </View>
                  {active && <Text style={styles.pickerCheck}>✓</Text>}
                </TouchableOpacity>
              );
            })}

            <View style={{ height: 32 }} />
          </ScrollView>
        </View>
      </Modal>

      {/* Topic drawer */}
      <Modal visible={navOpen} transparent animationType="slide">
        <TouchableOpacity
          style={styles.drawerOverlay}
          activeOpacity={1}
          onPress={() => setNavOpen(false)}
        />
        <View style={styles.drawer}>
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Topics</Text>
            <TouchableOpacity onPress={() => setNavOpen(false)}>
              <Text style={styles.drawerClose}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Subject tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.subjectTabs}
          >
            {subjects.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.subjectTab, s.id === subjectId && styles.subjectTabActive]}
                onPress={() => selectSubject(s.id)}
              >
                <Text
                  style={[styles.subjectTabText, s.id === subjectId && styles.subjectTabTextActive]}
                >
                  {s.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Topic list */}
          <FlatList
            data={topics}
            keyExtractor={(t) => t.id}
            renderItem={({ item: t }) => {
              const m = masteryMap.get(t.id);
              const isActive = t.id === topicId;
              return (
                <TouchableOpacity
                  style={[styles.topicRow, isActive && styles.topicRowActive]}
                  onPress={() => {
                    setTopicId(t.id);
                    setNavOpen(false);
                  }}
                >
                  <Text style={[styles.topicRowName, isActive && styles.topicRowNameActive]}>
                    {t.name}
                  </Text>
                  <MasteryBar value={m?.mastery ?? 0} />
                </TouchableOpacity>
              );
            }}
          />

          {/* Add material link */}
          <TouchableOpacity
            style={styles.addMaterialBtn}
            onPress={() => {
              setNavOpen(false);
              router.push({ pathname: "/ingest", params: { subjectId } });
            }}
            testID="add-material-btn"
          >
            <Text style={styles.addMaterialText}>+ Add material (URL)</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ChatBubble({ msg, color }: { msg: ChatMsg; color: string }) {
  const isUser = msg.role === "user";
  return (
    <View style={[styles.bubbleRow, isUser && styles.bubbleRowUser]}>
      <View
        style={[
          styles.bubble,
          isUser
            ? [styles.bubbleUser, { backgroundColor: color }]
            : styles.bubbleAssistant,
        ]}
      >
        {msg.content ? (
          <MarkdownText
            content={msg.content}
            color={isUser ? "#fff" : undefined}
          />
        ) : (
          <Text style={isUser ? styles.bubbleUserText : styles.bubbleAssistantText}>…</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    gap: 8,
  },
  menuBtn: { padding: 4 },
  menuIcon: { fontSize: 18, color: "#374151" },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: "600", color: "#111" },
  avatarBtn: { padding: 2 },
  switchBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  switchBtnText: { fontSize: 12, color: "#374151" },
  // Key error
  keyErrorBanner: {
    backgroundColor: "#fef2f2",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#fecaca",
  },
  keyErrorText: { color: "#ef4444", fontSize: 13 },
  // Topic bar
  topicBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    gap: 8,
  },
  topicName: { fontSize: 14, fontWeight: "600", color: "#111" },
  topicDesc: { fontSize: 11, color: "#6b7280", marginTop: 1 },
  bloomBadge: {
    backgroundColor: "#eef2ff",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  bloomText: { fontSize: 11, color: "#6366f1", fontWeight: "600" },
  // Action bar
  actionBar: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#f9fafb",
  },
  actionBtnText: { fontSize: 13, fontWeight: "500", color: "#374151" },
  actionBtnDisabled: { opacity: 0.45 },
  quizBtn: { backgroundColor: "#ede9fe", borderColor: "#c4b5fd" },
  quizBtnText: { color: "#7c3aed" },
  // Messages
  messageList: { flex: 1 },
  messageListContent: { padding: 12, gap: 10, paddingBottom: 20 },
  emptyState: { alignItems: "center", marginTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#374151", marginBottom: 8 },
  emptyHint: { fontSize: 13, color: "#9ca3af", textAlign: "center", lineHeight: 20 },
  thinkingRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingLeft: 4 },
  thinkingText: { fontSize: 12, color: "#9ca3af" },
  // Input bar
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 120,
    color: "#111",
  },
  sendBtn: {
    backgroundColor: "#6366f1",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  // Bubbles
  bubbleRow: { alignItems: "flex-start" },
  bubbleRowUser: { alignItems: "flex-end" },
  bubble: {
    maxWidth: "85%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: { borderBottomRightRadius: 4 },
  bubbleAssistant: {
    backgroundColor: "#f3f4f6",
    borderBottomLeftRadius: 4,
  },
  bubbleUserText: { color: "#fff", fontSize: 14, lineHeight: 20 },
  bubbleAssistantText: { color: "#374151", fontSize: 14, lineHeight: 20 },
  // Drawer
  drawerOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  drawer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "80%",
    maxWidth: 320,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  drawerTitle: { fontSize: 16, fontWeight: "600", color: "#111" },
  drawerClose: { fontSize: 18, color: "#6b7280", padding: 4 },
  subjectTabs: {
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  subjectTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 6,
    backgroundColor: "#f3f4f6",
  },
  subjectTabActive: { backgroundColor: "#6366f1" },
  subjectTabText: { fontSize: 13, fontWeight: "500", color: "#374151" },
  subjectTabTextActive: { color: "#fff" },
  topicRow: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#f3f4f6",
  },
  topicRowActive: { backgroundColor: "#eef2ff" },
  topicRowName: { fontSize: 14, fontWeight: "500", color: "#111" },
  topicRowNameActive: { color: "#6366f1" },
  addMaterialBtn: {
    padding: 14,
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
  },
  addMaterialText: { fontSize: 14, color: "#6366f1", fontWeight: "500" },
  // Model bar
  modelBar: {
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fafafa",
  },
  modelPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#c7d2fe",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    maxWidth: 280,
  },
  modelPillIcon: { fontSize: 13 },
  modelPillLabel: { flex: 1, fontSize: 13, fontWeight: "600", color: "#4338ca" },
  modelPillChevron: { fontSize: 11, color: "#6366f1" },
  // Model picker sheet
  pickerSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "75%",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 16,
  },
  pickerHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#d1d5db",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  pickerScroll: { flex: 1 },
  pickerSection: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#f3f4f6",
    gap: 10,
  },
  pickerRowActive: { backgroundColor: "#eef2ff" },
  pickerRowName: { fontSize: 14, fontWeight: "500", color: "#111" },
  pickerRowNameActive: { color: "#4338ca", fontWeight: "700" },
  pickerRowSub: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  pickerCheck: { fontSize: 16, color: "#6366f1" },
  pickerLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
  },
  pickerLoadingText: { fontSize: 14, color: "#6b7280" },
  pickerRetry: { padding: 16 },
  pickerRetryText: { fontSize: 14, color: "#ef4444" },
});

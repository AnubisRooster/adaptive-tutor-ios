import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { getActiveStudentId } from "@/lib/session";
import {
  getStudent,
  listSubjects,
  listTopics,
  getOrCreateSession,
  getRecentMessages,
  addMessage,
} from "@/lib/data";
import { buildTutorTurn } from "@/lib/orchestrator";
import { resolveLlmConfigById, streamChat, isProviderUnavailable } from "@/lib/llm";
import { previewTutorTurn } from "@/lib/preview";
import { awardForTeach } from "@/lib/gamify";
import { speakText, stopSpeaking } from "@/lib/voice";
import MarkdownText from "@/components/MarkdownText";
import type { Student } from "@/db/schema";

type ChatMsg = { role: "user" | "assistant"; content: string };

type VoiceStatus = "idle" | "listening" | "thinking" | "speaking" | "error";

export default function VoiceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ subjectId?: string; topicId?: string }>();

  const [student, setStudent] = useState<Student | null>(null);
  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [topicName, setTopicName] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [interim, setInterim] = useState("");
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Loop controls. `listeningRef` mirrors the microphone being engaged; the
  // `end` event also fires after stop()/abort(), so we only restart when the
  // loop is still wanted AND we are not mid-turn.
  const listeningRef = useRef(false);
  const busyRef = useRef(false);
  const turnRef = useRef(0);

  const [speakReplies, setSpeakReplies] = useState(false);

  // Initial load
  useEffect(() => {
    (async () => {
      const id = await getActiveStudentId();
      if (!id) { router.replace("/"); return; }
      const stu = getStudent(id);
      if (!stu) { router.replace("/"); return; }
      setStudent(stu);
      setSpeakReplies(!!stu.voiceSpeakReplies);

      const subs = listSubjects();
      if (subs.length === 0) {
        setSubjectName("");
        setTopicName("");
        loadRecent(id, "");
        return;
      }
      let sid = typeof params.subjectId === "string" && params.subjectId ? params.subjectId : "";
      let tid = typeof params.topicId === "string" && params.topicId ? params.topicId : "";
      if (!subs.some((s) => s.id === sid)) {
        sid = subs[0].id;
        tid = "";
      }
      const tList = listTopics(sid);
      if (tList.length > 0 && !tList.some((t) => t.id === tid)) {
        tid = tList[0].id;
      }
      setSubjectId(sid);
      setTopicId(tid);
      setSubjectName(subs.find((s) => s.id === sid)?.name ?? "");
      setTopicName(tList.find((t) => t.id === tid)?.name ?? "");
      loadRecent(id, sid);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh the topic label whenever the screen regains focus (a lesson may
  // have been retargeted in the meantime).
  useFocusEffect(
    useCallback(() => {
      if (!subjectId) return;
      const subs = listSubjects();
      const tList = listTopics(subjectId);
      setSubjectName(subs.find((s) => s.id === subjectId)?.name ?? "");
      setTopicName(tList.find((t) => t.id === topicId)?.name ?? "");
    }, [subjectId, topicId])
  );

  function loadRecent(studentId: string, sid: string) {
    try {
      const session = getOrCreateSession(studentId, sid);
      const recent = sid ? getRecentMessages(session.id, 20) : [];
      setMessages(recent.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })));
    } catch {
      setMessages([]);
    }
  }

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

  // ── Speech recognition events ───────────────────────────────────────────

  useSpeechRecognitionEvent("result", (event) => {
    const text = event.results?.[0]?.transcript?.trim() ?? "";
    if (event.isFinal) {
      setInterim("");
      if (text) handleFinalUtterance(text);
    } else {
      setInterim(text);
    }
  });

  useSpeechRecognitionEvent("end", () => {
    // Restart the hands-free loop unless we were stopped intentionally or are
    // mid-turn (the recognizer ends when it returns a final result).
    if (listeningRef.current && !busyRef.current && status === "listening") {
      startListening(false);
    } else {
      setStatus((s) => {
        if (s === "thinking" || s === "speaking") return s;
        return listeningRef.current ? "listening" : "idle";
      });
    }
  });

  useSpeechRecognitionEvent("error", (event) => {
    if (event.error === "aborted") return;
    if (event.error === "interrupted") return;
    listeningRef.current = false;
    setStatus("error");
    setError(`Voice error: ${event.error}. ${event.message ?? ""}`.trim());
  });

  // ── Loop controls ───────────────────────────────────────────────────────

  async function requestPermissions(): Promise<boolean> {
    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!result.granted) {
      setStatus("error");
      setError("Microphone and speech recognition permission are required to use voice mode.");
      return false;
    }
    return true;
  }

  function startListening(askPermission: boolean) {
    (async () => {
      if (askPermission) {
        const ok = await requestPermissions();
        if (!ok) return;
      }
      setError(null);
      listeningRef.current = true;
      setStatus("listening");
      setInterim("");
      ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        interimResults: true,
        continuous: false,
        addsPunctuation: true,
      });
    })();
  }

  function stopLoop() {
    listeningRef.current = false;
    turnRef.current += 1;
    try {
      ExpoSpeechRecognitionModule.abort();
    } catch {
      // ignore — recognizer may already be idle
    }
    void stopSpeaking();
    setInterim("");
    setStatus("idle");
  }

  // ── Turn handling ───────────────────────────────────────────────────────

  async function handleFinalUtterance(text: string) {
    if (!student || !subjectId || !topicId || busyRef.current) return;
    busyRef.current = true;
    listeningRef.current = false;
    const turn = turnRef.current;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
    scrollRef.current?.scrollToEnd({ animated: true });

    const history = messages.map((m) => ({ role: m.role, content: m.content })).concat({ role: "user", content: text });

    try {
      const cfg = await resolveLlmConfigById(student.id);
      const { messages: llmMsgs, topicName: tName, subjectName: sName } = await buildTutorTurn({
        studentId: student.id,
        subjectId,
        topicId,
        mode: "teach",
        history,
      });
      if (tName) setTopicName(tName);
      if (sName) setSubjectName(sName);

      setStatus("thinking");
      const gen = streamChat(cfg, llmMsgs);
      let acc = "";
      for await (const chunk of gen) {
        if (turnRef.current !== turn) return;
        acc += chunk;
        updateLastAssistant(acc);
        scrollRef.current?.scrollToEnd({ animated: false });
      }

      // Persist the exchange to the local session.
      const session = getOrCreateSession(student.id, subjectId);
      addMessage({ sessionId: session.id, studentId: student.id, role: "user", content: text, topicId });
      addMessage({ sessionId: session.id, studentId: student.id, role: "assistant", content: acc, topicId });
      awardForTeach(student.id);
      setPreviewMode(false);

      // Speak the reply aloud when the learner turned that on.
      if (speakReplies && acc.trim()) {
        setStatus("speaking");
        await speakText(acc);
      }
    } catch (e) {
      if (isProviderUnavailable(e)) {
        const preview = previewTutorTurn({
          topicName: topicName || "this topic",
          subjectName: subjectName || "this subject",
          mode: "teach",
          userText: text,
          historyLength: history.length,
        });
        updateLastAssistant(preview);
        setPreviewMode(true);
        const session = getOrCreateSession(student.id, subjectId);
        addMessage({ sessionId: session.id, studentId: student.id, role: "user", content: text, topicId });
        addMessage({ sessionId: session.id, studentId: student.id, role: "assistant", content: preview, topicId });
        if (speakReplies && preview.trim()) {
          setStatus("speaking");
          await speakText(preview);
        }
      } else {
        setStatus("error");
        setError("Something went wrong — please try again.");
        updateLastAssistant("");
        setMessages((prev) => prev.filter((m) => !(m.role === "assistant" && m.content === "")));
      }
    } finally {
      busyRef.current = false;
      if (turnRef.current !== turn) return;
      if (listeningRef.current) {
        startListening(false);
      } else {
        setStatus("idle");
      }
    }
  }

  const onCancel = () => {
    if (listeningRef.current || busyRef.current || status === "speaking") {
      stopLoop();
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────

  if (!student) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const micActive = status === "listening" || status === "thinking" || status === "speaking";

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} testID="voice-back">
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>Voice Tutor</Text>
          {topicName ? (
            <Text style={styles.headerSub} numberOfLines={1}>
              {subjectName} › {topicName}
            </Text>
          ) : null}
        </View>
      </View>

      {previewMode && (
        <TouchableOpacity style={styles.previewBanner} onPress={() => router.push("/settings")} testID="voice-preview-bar">
          <Text style={styles.previewBannerText}>
            Preview mode — connect an AI model in Settings for full tutoring.
          </Text>
        </TouchableOpacity>
      )}

      {error && (
        <View style={styles.errorBanner} testID="voice-error">
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <Text style={styles.errorDismiss}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Status */}
      <View style={styles.statusRow}>
        <View style={styles.statusPill} testID="voice-status">
          {status === "listening" && (
            <>
              <View style={styles.listeningDot} />
              <Text style={styles.statusText}>Listening…</Text>
            </>
          )}
          {status === "thinking" && (
            <>
              <ActivityIndicator size="small" color="#6366f1" />
              <Text style={styles.statusText}>Thinking…</Text>
            </>
          )}
          {status === "speaking" && (
            <>
              <ActivityIndicator size="small" color="#7c3aed" />
              <Text style={[styles.statusText, { color: "#7c3aed" }]}>Reading the reply…</Text>
            </>
          )}
          {status === "error" && <Text style={[styles.statusText, { color: "#ef4444" }]}>Voice paused</Text>}
          {status === "idle" && <Text style={styles.statusText}>Tap to start talking</Text>}
        </View>
        {speakReplies && status !== "idle" && (
          <Text style={styles.speakHint}>🔊 replies</Text>
        )}
      </View>

      {/* Conversation */}
      <ScrollView
        ref={scrollRef}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {messages.length === 0 && status === "idle" && (
          <View style={styles.emptyState} testID="voice-prompt">
            <Text style={styles.emptyTitle}>Talk to your tutor.</Text>
            <Text style={styles.emptyHint}>
              Tap the microphone and ask a question. The tutor listens, thinks, and keeps the
              conversation going. Toggle “Speak replies” in Settings to hear answers aloud.
            </Text>
          </View>
        )}
        {messages.map((m, i) => (
          <ChatBubble key={i} msg={m} color={student.color} />
        ))}
        {interim && status === "listening" && (
          <View style={styles.interimRow}>
            <Text style={styles.interimText}>{interim}…</Text>
          </View>
        )}
      </ScrollView>

      {/* Mic control */}
      <View style={styles.micArea}>
        <TouchableOpacity
          style={[styles.micBtn, micActive && styles.micBtnActive]}
          onPress={micActive ? onCancel : () => startListening(true)}
          testID="voice-mic"
          accessibilityRole="button"
          accessibilityLabel={micActive ? "Stop voice mode" : "Start voice mode"}
        >
          <Text style={styles.micIcon}>{micActive ? "■" : "🎙️"}</Text>
        </TouchableOpacity>
        <Text style={styles.micLabel}>
          {micActive
            ? status === "speaking"
              ? "Tap to stop"
              : "Hands-free — keep talking"
            : "Tap to start"}
        </Text>
      </View>
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
          <MarkdownText content={msg.content} color={isUser ? "#fff" : undefined} />
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    gap: 8,
  },
  backBtn: { padding: 4 },
  backText: { fontSize: 15, color: "#6366f1" },
  headerTitle: { fontSize: 16, fontWeight: "600", color: "#111" },
  headerSub: { fontSize: 11, color: "#6b7280", marginTop: 1 },
  previewBanner: {
    backgroundColor: "#fef9c3",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#fde68a",
  },
  previewBannerText: { color: "#78350f", fontSize: 12 },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fef2f2",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#fecaca",
  },
  errorText: { color: "#ef4444", fontSize: 12, flex: 1 },
  errorDismiss: { color: "#ef4444", fontSize: 14, paddingLeft: 10 },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  listeningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
  },
  statusText: { fontSize: 13, color: "#374151" },
  speakHint: { fontSize: 11, color: "#9ca3af" },
  messageList: { flex: 1 },
  messageListContent: { padding: 12, gap: 10, paddingBottom: 20 },
  emptyState: { alignItems: "center", marginTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#374151", marginBottom: 8 },
  emptyHint: { fontSize: 13, color: "#9ca3af", textAlign: "center", lineHeight: 20 },
  interimRow: { alignItems: "flex-end", paddingRight: 4 },
  interimText: { fontSize: 14, color: "#9ca3af", fontStyle: "italic" },
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
  micArea: {
    alignItems: "center",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
    gap: 6,
  },
  micBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  micBtnActive: { backgroundColor: "#7c3aed" },
  micIcon: { fontSize: 26, color: "#fff" },
  micLabel: { fontSize: 12, color: "#6b7280" },
});
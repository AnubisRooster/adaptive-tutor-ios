import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { listStudents, createStudent, verifyPin } from "@/lib/data";
import { setActiveStudentId } from "@/lib/session";
import ProfileAvatar from "@/components/ProfileAvatar";
import type { Student } from "@/db/schema";

const COLORS = [
  "#6366f1",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
];

export default function ProfilesScreen() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>(() => listStudents());
  const [error, setError] = useState<string | null>(null);

  // Create modal state
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [newPin, setNewPin] = useState("");

  // PIN prompt state
  const [pinFor, setPinFor] = useState<Student | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);

  async function selectStudent(student: Student, pin?: string) {
    setError(null);
    if (student.pinHash && !pin) {
      setPinFor(student);
      return;
    }
    if (student.pinHash && pin !== undefined) {
      if (!verifyPin(student, pin)) {
        setPinError("Incorrect PIN.");
        return;
      }
    }
    setPinFor(null);
    setPinInput("");
    setPinError(null);
    await setActiveStudentId(student.id);
    router.replace("/learn");
  }

  async function handleCreate() {
    setError(null);
    if (newName.trim().length < 1) {
      setError("Please enter a name.");
      return;
    }
    try {
      createStudent({
        name: newName.trim(),
        color: newColor,
        pin: newPin.trim() || undefined,
      });
      setCreating(false);
      setNewName("");
      setNewColor(COLORS[0]);
      setNewPin("");
      const updated = listStudents();
      setStudents(updated);
      const created = updated.find((s) => s.name === newName.trim());
      if (created) await selectStudent(created);
    } catch (e) {
      setError(String(e));
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.appTitle}>Adaptive Tutor</Text>
        <Text style={styles.appSubtitle}>
          Your personal mentor for Philosophy, Psychology, AI, Physics &amp; Coding.
        </Text>

        <Text style={styles.sectionTitle}>Who&apos;s learning?</Text>

        <View style={styles.grid}>
          {students.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={styles.profileCard}
              onPress={() => selectStudent(s)}
            >
              <ProfileAvatar name={s.name} color={s.color} size={64} />
              <Text style={styles.profileName}>{s.name}</Text>
              {s.pinHash ? <Text style={styles.lockIcon}>🔒</Text> : null}
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[styles.profileCard, styles.newCard]}
            onPress={() => setCreating(true)}
          >
            <View style={styles.plusCircle}>
              <Text style={styles.plusText}>+</Text>
            </View>
            <Text style={styles.profileName}>New profile</Text>
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      {/* PIN modal */}
      <Modal visible={pinFor !== null} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Enter PIN for {pinFor?.name}</Text>
            <Text style={styles.modalSubtitle}>This profile is PIN protected.</Text>
            <TextInput
              style={styles.pinInput}
              value={pinInput}
              onChangeText={setPinInput}
              secureTextEntry
              keyboardType="number-pad"
              placeholder="••••"
              autoFocus
              maxLength={8}
              onSubmitEditing={() => pinFor && selectStudent(pinFor, pinInput)}
            />
            {pinError ? <Text style={styles.errorText}>{pinError}</Text> : null}
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => pinFor && selectStudent(pinFor, pinInput)}
            >
              <Text style={styles.primaryBtnText}>Continue</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                setPinFor(null);
                setPinInput("");
                setPinError(null);
              }}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Create profile modal */}
      <Modal visible={creating} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Create a profile</Text>

            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={newName}
              onChangeText={setNewName}
              placeholder="e.g. Maya"
              autoFocus
              returnKeyType="next"
            />

            <Text style={styles.label}>Color</Text>
            <View style={styles.colorRow}>
              {COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c },
                    newColor === c && styles.colorDotSelected,
                  ]}
                  onPress={() => setNewColor(c)}
                />
              ))}
            </View>

            <Text style={styles.label}>PIN (optional, 4–8 digits)</Text>
            <TextInput
              style={styles.input}
              value={newPin}
              onChangeText={(t) => setNewPin(t.replace(/\D/g, "").slice(0, 8))}
              keyboardType="number-pad"
              placeholder="optional"
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity style={styles.primaryBtn} onPress={handleCreate}>
              <Text style={styles.primaryBtnText}>Start learning</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                setCreating(false);
                setError(null);
              }}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 24, paddingBottom: 40 },
  appTitle: { fontSize: 26, fontWeight: "700", color: "#111" },
  appSubtitle: { fontSize: 13, color: "#6b7280", marginTop: 4, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#111", marginBottom: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  profileCard: {
    width: "45%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 18,
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f9fafb",
  },
  newCard: { borderStyle: "dashed" },
  profileName: { fontSize: 14, fontWeight: "500", color: "#111", textAlign: "center" },
  lockIcon: { fontSize: 12 },
  plusCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  plusText: { fontSize: 28, color: "#6b7280" },
  errorText: { color: "#ef4444", fontSize: 13, marginTop: 8 },
  // Modals
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalBox: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    gap: 0,
  },
  modalTitle: { fontSize: 18, fontWeight: "600", color: "#111", marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: "#6b7280", marginBottom: 16 },
  label: { fontSize: 13, color: "#6b7280", marginBottom: 4, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: "#111",
  },
  pinInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 22,
    textAlign: "center",
    letterSpacing: 8,
    color: "#111",
    marginBottom: 4,
  },
  colorRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotSelected: { borderWidth: 3, borderColor: "#111" },
  primaryBtn: {
    backgroundColor: "#6366f1",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 16,
  },
  primaryBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  cancelBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 8,
  },
  cancelBtnText: { color: "#6b7280", fontSize: 14 },
});

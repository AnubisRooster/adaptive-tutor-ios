import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  AppState,
  StyleSheet,
} from "react-native";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { db } from "@/db";
import migrations from "@/drizzle/migrations";
import { seedBuiltinCurriculum } from "@/lib/seed";
import { getBiometricLockEnabled, authenticateWithBiometrics } from "@/lib/biometric";

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);
  const [locked, setLocked] = useState<boolean | null>(null);
  const lockEnabledRef = useRef(false);

  useEffect(() => {
    if (!success) return;
    try { seedBuiltinCurriculum(); } catch {}
    (async () => {
      const enabled = await getBiometricLockEnabled();
      lockEnabledRef.current = enabled;
      if (!enabled) { setLocked(false); return; }
      const ok = await authenticateWithBiometrics();
      setLocked(!ok);
    })();
  }, [success]);

  // Re-lock whenever the app leaves the foreground so returning to it requires
  // re-authentication. Without this the Face ID gate only runs on cold start.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "background" && lockEnabledRef.current) {
        setLocked(true);
      }
    });
    return () => sub.remove();
  }, []);

  async function handleUnlock() {
    const ok = await authenticateWithBiometrics();
    if (ok) setLocked(false);
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Database migration failed: {error.message}</Text>
      </View>
    );
  }

  if (!success || locked === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (locked) {
    return (
      <View style={styles.center}>
        <Text style={styles.lockTitle}>Adaptive Tutor</Text>
        <Text style={styles.lockHint}>Face ID / Touch ID required</Text>
        <TouchableOpacity style={styles.unlockBtn} onPress={handleUnlock} testID="unlock-btn">
          <Text style={styles.unlockBtnText}>Unlock with Face ID</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  error: { color: "red", padding: 24, textAlign: "center" },
  lockTitle: { fontSize: 24, fontWeight: "700", color: "#111" },
  lockHint: { fontSize: 14, color: "#6b7280" },
  unlockBtn: {
    backgroundColor: "#6366f1",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 8,
  },
  unlockBtnText: { fontSize: 16, fontWeight: "600", color: "#fff" },
});

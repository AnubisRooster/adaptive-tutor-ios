import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { db } from "@/db";
import migrations from "@/drizzle/migrations";
import { seedBuiltinCurriculum } from "@/lib/seed";

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Database migration failed: {error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Migrations succeeded; seedBuiltinCurriculum is idempotent — safe to call on every render
  try { seedBuiltinCurriculum(); } catch {}

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  error: { color: "red", padding: 24, textAlign: "center" },
});

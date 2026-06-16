import { StyleSheet, Text, View } from "react-native";

/**
 * Placeholder landing screen (Phase 0). Replaced by the Profiles screen
 * in Phase 3.
 */
export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Adaptive Tutor</Text>
      <Text style={styles.subtitle}>On-device, powered by your OpenRouter key.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    opacity: 0.6,
    textAlign: "center",
  },
});

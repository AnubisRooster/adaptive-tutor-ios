import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface Props {
  name: string;
  color: string;
  size?: number;
}

export default function ProfileAvatar({ name, color, size = 56 }: Props) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const fontSize = Math.round(size * 0.4);
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
      ]}
    >
      <Text style={[styles.initial, { fontSize }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: "center",
    justifyContent: "center",
  },
  initial: {
    color: "#fff",
    fontWeight: "700",
  },
});

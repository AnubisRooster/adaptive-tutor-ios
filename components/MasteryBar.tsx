import React from "react";
import { View, StyleSheet } from "react-native";

interface Props {
  value: number; // 0–1
  height?: number;
}

export default function MasteryBar({ value, height = 4 }: Props) {
  const pct = Math.min(1, Math.max(0, value)) * 100;
  const fill = value >= 0.8 ? "#10b981" : value >= 0.45 ? "#6366f1" : "#d1d5db";
  return (
    <View style={[styles.track, { height }]}>
      <View style={[styles.fill, { width: `${pct}%` as `${number}%`, backgroundColor: fill }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: "100%",
    borderRadius: 2,
    backgroundColor: "#e5e7eb",
    overflow: "hidden",
    marginTop: 4,
  },
  fill: {
    height: "100%",
    borderRadius: 2,
  },
});

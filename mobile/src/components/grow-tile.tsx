import React from "react";
import { Pressable, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { space, radius, type, useColors } from "@/lib/theme";
export function GrowTile({ icon, label, sub, onPress }: { icon: React.ComponentProps<typeof Ionicons>["name"]; label: string; sub: string; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label}: ${sub}`}
      style={({ pressed }) => ({ width: "48.5%", padding: space.md, gap: 4, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.md, opacity: pressed ? 0.85 : 1 })}>
      <Ionicons name={icon} size={22} color={c.accent} />
      <Text style={[type.label, { color: c.ink }]}>{label}</Text>
      <Text style={[type.small, { color: c.muted }]} numberOfLines={1}>{sub}</Text>
    </Pressable>
  );
}

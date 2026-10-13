import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { fonts, radius, type, useColors } from "@/lib/theme";

/** Square photo well with camera-viewfinder corner brackets — Snapfront's signature element. */
export function Viewfinder({ uri, onPress, label = "Tap to take or choose a product photo" }: { uri?: string | null; onPress?: () => void; label?: string }) {
  const c = useColors();
  const corner = uri ? "#FFFFFF" : c.ink;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={uri ? "Change photo" : label} onPress={onPress}
      style={[styles.box, { backgroundColor: c.surface, borderColor: c.line }]}>
      {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} /> : (
        <View style={styles.empty}>
          <View style={{ width: 68, height: 68, borderRadius: 34, borderWidth: 1, borderColor: c.line, backgroundColor: c.sunk, alignItems: "center", justifyContent: "center" }}><Ionicons name="camera-outline" size={30} color={c.ink} /></View>
          <Text style={[type.heading, { color: c.ink, fontFamily: fonts.display, fontSize: 20 }]}>Snap a product</Text>
          <Text style={[type.small, { color: c.muted, textAlign: "center" }]}>{label}</Text>
        </View>
      )}
      <Brackets color={corner} />
      {uri ? <View style={[styles.ready, { backgroundColor: c.flash }]}><Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: c.onFlash }}>Photo ready</Text></View> : null}
    </Pressable>
  );
}

export function Brackets({ color, size = 28, inset = 14, weight = 3 }: { color: string; size?: number; inset?: number; weight?: number }) {
  const base = { position: "absolute" as const, width: size, height: size, borderColor: color };
  return (
    <>
      <View pointerEvents="none" style={[base, { top: inset, left: inset, borderTopWidth: weight, borderLeftWidth: weight }]} />
      <View pointerEvents="none" style={[base, { top: inset, right: inset, borderTopWidth: weight, borderRightWidth: weight }]} />
      <View pointerEvents="none" style={[base, { bottom: inset, left: inset, borderBottomWidth: weight, borderLeftWidth: weight }]} />
      <View pointerEvents="none" style={[base, { bottom: inset, right: inset, borderBottomWidth: weight, borderRightWidth: weight }]} />
    </>
  );
}

const styles = StyleSheet.create({
  box: { width: "100%", aspectRatio: 1, borderRadius: radius.lg, borderWidth: 1, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", gap: 8, paddingHorizontal: 40 },
  ready: { position: "absolute", top: 18, alignSelf: "center", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
});

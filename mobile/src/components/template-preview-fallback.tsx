import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import type { StoreTheme } from "@/lib/api";
import { availableThemePreview } from "@/lib/theme-preview-source";
import { fonts, radius, space, type, useColors } from "@/lib/theme";

export function TemplatePreviewFallback({ theme, error, onRetry }: { theme: StoreTheme | null; error: string | null; onRetry: () => void }) {
  const c = useColors();
  const snapshot = theme ? availableThemePreview(theme, []) : null;
  return (
    <View style={[styles.shell, { borderColor: theme?.colors.line ?? c.line, backgroundColor: theme?.colors.bg ?? c.sunk }]}>
      {snapshot ? <Image source={snapshot.source} contentFit="cover" style={StyleSheet.absoluteFill} accessibilityLabel={`${theme?.name} bundled example snapshot`} /> : null}
      <View style={[styles.label, { backgroundColor: c.bg, borderColor: c.line }]}>
        <Text style={[type.label, { color: c.ink }]}>Example-only {theme ? `${theme.name} snapshot` : "theme snapshot"}</Text>
        <Text style={[type.small, { color: c.muted }]}>{snapshot ? "Bundled with this app; it is not your current storefront draft." : "A selected-theme snapshot is not bundled in this app."}</Text>
      </View>
      <View style={[styles.message, { backgroundColor: c.bg, borderColor: c.line }]}>
        <Text style={[type.small, { color: c.ink }]}>{error || "Setup preview needs the latest backend. Your draft is kept on this phone; retry when it is available or keep editing manually."}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Retry setup preview" onPress={onRetry} style={{ minHeight: 44, justifyContent: "center", marginTop: 4 }}>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: c.accent }}>Retry setup preview</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { height: 430, borderWidth: 1, borderRadius: radius.lg, overflow: "hidden", justifyContent: "space-between", padding: space.md },
  label: { alignSelf: "flex-start", maxWidth: "92%", borderWidth: 1, borderRadius: radius.md, padding: space.sm, gap: 2 },
  message: { borderWidth: 1, borderRadius: radius.md, padding: space.sm, gap: 3 },
});

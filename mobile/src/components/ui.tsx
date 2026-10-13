import React from "react";
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
  type TextInputProps, type ViewStyle, type StyleProp, type ScrollViewProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { fonts, radius, space, type, useColors } from "@/lib/theme";

export function Screen({ children, scroll = true, onScroll, onLayout }: { children: React.ReactNode; scroll?: boolean; onScroll?: ScrollViewProps["onScroll"]; onLayout?: ScrollViewProps["onLayout"] }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const pad = { paddingHorizontal: space.xl, paddingTop: space.lg, paddingBottom: insets.bottom + space.xxl };
  if (!scroll) return <View style={[{ flex: 1, backgroundColor: c.bg }, pad]}>{children}</View>;
  return (
    <ScrollView onScroll={onScroll} onLayout={onLayout} scrollEventThrottle={onScroll ? 64 : undefined} style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={[pad, { gap: space.xl }]} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

export function H1({ children }: { children: React.ReactNode }) {
  const c = useColors();
  return <Text accessibilityRole="header" style={[type.hero, { color: c.ink }]}>{children}</Text>;
}
export function H2({ children }: { children: React.ReactNode }) {
  const c = useColors();
  return <Text accessibilityRole="header" style={[type.title, { color: c.ink }]}>{children}</Text>;
}
export function Body({ children, muted, style }: { children: React.ReactNode; muted?: boolean; style?: object }) {
  const c = useColors();
  return <Text style={[type.body, { color: muted ? c.muted : c.ink }, style]}>{children}</Text>;
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "flash" | "danger" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};
export function Button({ label, onPress, variant = "primary", loading, disabled, icon, style }: ButtonProps) {
  const c = useColors();
  const palette = {
    primary: { bg: c.accent, fg: c.onAccent, border: c.accent },
    secondary: { bg: c.surface, fg: c.ink, border: c.line },
    flash: { bg: c.flash, fg: c.onFlash, border: c.flash },
    danger: { bg: c.surface, fg: c.bad, border: c.line },
    ghost: { bg: "transparent", fg: c.accent, border: "transparent" },
  }[variant];
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      disabled={off}
      onPress={() => { Haptics.selectionAsync().catch(() => {}); onPress(); }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.bg, borderColor: palette.border, opacity: off ? 0.5 : pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] },
        style,
      ]}
    >
      {variant === "primary" && !off ? <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 18, right: 18, height: 2, borderRadius: 2, backgroundColor: "#FFFFFF" }} /> : null}
      {loading ? <ActivityIndicator color={palette.fg} /> : icon}
      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: palette.fg, flexShrink: 1, textAlign: "center" }}>{label}</Text>
    </Pressable>
  );
}

export function Field({ label, hint, ...props }: TextInputProps & { label: string; hint?: string }) {
  const c = useColors();
  return (
    <View style={{ gap: 6 }}>
      <Text style={[type.label, { color: c.ink }]}>{label}</Text>
      {hint ? <Text style={[type.small, { color: c.muted }]}>{hint}</Text> : null}
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={c.muted}
        {...props}
        style={[
          styles.input,
          { backgroundColor: c.surface, borderColor: c.line, color: c.ink },
          props.multiline && { minHeight: 110, textAlignVertical: "top" },
          props.style,
        ]}
      />
    </View>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  const c = useColors();
  return (
    <View style={[styles.seg, { backgroundColor: c.sunk }]} accessibilityRole="radiogroup">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable key={o.value} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => onChange(o.value)}
            style={[styles.segItem, on && { backgroundColor: c.accent }]}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: on ? c.onAccent : c.muted, textAlign: "center" }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Notice({ text, tone = "info" }: { text: string | null; tone?: "info" | "error" | "ok" }) {
  const c = useColors();
  if (!text) return null;
  const color = tone === "error" ? c.bad : tone === "ok" ? c.good : c.ink;
  return (
    <View accessibilityLiveRegion="polite" style={[styles.notice, { backgroundColor: c.sunk }]}>
      <Text style={[type.small, { color }]}>{text}</Text>
    </View>
  );
}

export function Pill({ text, tone = "neutral" }: { text: string; tone?: "neutral" | "flash" | "good" }) {
  const c = useColors();
  const bg = tone === "flash" ? c.flash : c.sunk;
  const fg = tone === "flash" ? c.onFlash : tone === "good" ? c.good : c.muted;
  return (
    <View style={{ backgroundColor: bg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3, alignSelf: "flex-start" }}>
      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: fg }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 52, borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: space.xl, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.sm },
  input: { minHeight: 52, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: space.lg, paddingVertical: 14, fontFamily: fonts.body, fontSize: 16 },
  seg: { flexDirection: "row", borderRadius: radius.md, padding: 3 },
  segItem: { flex: 1, minHeight: 44, justifyContent: "center", alignItems: "center", paddingVertical: 10, paddingHorizontal: 6, borderRadius: radius.sm },
  notice: { borderRadius: radius.md, padding: space.lg },
});

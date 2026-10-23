import React from "react";
import {
  ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions,
  type TextInputProps, type ViewStyle, type StyleProp, type ScrollViewProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { usePathname } from "expo-router";
import { fonts, radius, space, type, useColors } from "@/lib/theme";
import { PAGE_MAX, isColumn, pageWidthFor, type PageWidth } from "@/lib/page-width";

/** The page's layout on the website: in a focused column, fields and buttons share the column's edges. */
const Layout = React.createContext<PageWidth>("full");
export const usePageLayout = () => React.useContext(Layout);

export function Screen({ children, scroll = true, onScroll, onLayout, width, scrollRef }: { children: React.ReactNode; scroll?: boolean; onScroll?: ScrollViewProps["onScroll"]; onLayout?: ScrollViewProps["onLayout"]; width?: PageWidth; scrollRef?: React.Ref<ScrollView> }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const kind: PageWidth = Platform.OS === "web" ? width ?? pageWidthFor(pathname) : "full";
  const max = PAGE_MAX[kind];
  const column = max ? { width: "100%" as const, maxWidth: max, alignSelf: "center" as const } : null;
  const pad = { paddingHorizontal: space.xl, paddingTop: space.lg, paddingBottom: insets.bottom + space.xxl };
  if (!scroll) return <Layout.Provider value={kind}><View style={[{ flex: 1, backgroundColor: c.bg }, pad, column]}>{children}</View></Layout.Provider>;
  return (
    <Layout.Provider value={kind}>
      <ScrollView ref={scrollRef} onScroll={onScroll} onLayout={onLayout} scrollEventThrottle={onScroll ? 64 : undefined} style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={[pad, { gap: space.xl }, column]} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </Layout.Provider>
  );
}

/** The width this page uses on the website ("full" in the phone app). */
export function usePageWidth(width?: PageWidth): PageWidth {
  const pathname = usePathname();
  return Platform.OS === "web" ? width ?? pageWidthFor(pathname) : "full";
}

/**
 * A ScrollView for pages that lay themselves out: on the website its content sits in the
 * same centered column as the page title, so every page shares one left edge.
 */
export const PageScroll = React.forwardRef<ScrollView, ScrollViewProps & { width?: PageWidth }>(function PageScroll({ width, contentContainerStyle, children, ...rest }, ref) {
  const kind = usePageWidth(width);
  const max = PAGE_MAX[kind];
  const column = max ? { width: "100%" as const, maxWidth: max, alignSelf: "center" as const } : null;
  return (
    <Layout.Provider value={kind}>
      <ScrollView ref={ref} {...rest} contentContainerStyle={[contentContainerStyle, column]}>{children}</ScrollView>
    </Layout.Provider>
  );
});

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
  const focus = isColumn(usePageLayout());
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
        WEB && variant === "ghost" ? { paddingHorizontal: 2, minWidth: 0, minHeight: 40 } : null,
        WEB && focus ? (variant === "ghost" ? { alignSelf: "center" } : { alignSelf: "stretch" }) : null,
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
  const focus = isColumn(usePageLayout());
  return (
    <View style={{ gap: 6, ...(WEB && !focus ? { width: "100%", maxWidth: props.multiline ? 820 : 640 } : {}) }}>
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
  const focus = isColumn(usePageLayout());
  return (
    <View style={[styles.seg, { backgroundColor: c.sunk }, focus ? { maxWidth: "100%" as const } : null]} accessibilityRole="radiogroup">
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

/** Actions side by side on the website (they wrap when there isn't room); stacked full-width on the phone. */
export function ButtonRow({ children }: { children: React.ReactNode }) {
  const focus = isColumn(usePageLayout());
  if (Platform.OS !== "web") return <View style={{ gap: space.xl }}>{children}</View>;
  if (focus) return <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md }}>{React.Children.map(children, (ch) => (ch ? <View style={{ flexGrow: 1, flexBasis: 200 }}>{ch}</View> : null))}</View>;
  return <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md, alignItems: "center" }}>{children}</View>;
}

/** Two columns on a wide website screen; one column, left then right, everywhere else. */
export function Columns({ left, right, gap = space.xl }: { left: React.ReactNode; right: React.ReactNode; gap?: number }) {
  const { width } = useWindowDimensions();
  if (Platform.OS !== "web" || width < 1280) return <>{left}{right}</>;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 56 }}>
      <View style={{ flex: 1, minWidth: 0, gap }}>{left}</View>
      <View style={{ flex: 1, minWidth: 0, gap }}>{right}</View>
    </View>
  );
}

export function Notice({ text, tone = "info" }: { text: string | null; tone?: "info" | "error" | "ok" }) {
  const c = useColors();
  const focus = isColumn(usePageLayout());
  if (!text) return null;
  const color = tone === "error" ? c.bad : tone === "ok" ? c.good : c.ink;
  return (
    <View accessibilityLiveRegion="polite" style={[styles.notice, { backgroundColor: c.sunk }, focus ? { maxWidth: "100%" as const } : null]}>
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

// On the website, controls size to their content instead of stretching across a wide screen; the
// phone app keeps full-width buttons and fields that are easy to tap.
const WEB = Platform.OS === "web";
const styles = StyleSheet.create({
  button: { minHeight: WEB ? 46 : 52, borderRadius: radius.button, borderWidth: 1, paddingHorizontal: WEB ? 22 : space.xl, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.sm, ...(WEB ? { alignSelf: "flex-start", minWidth: 132 } : {}) },
  input: { minHeight: 52, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: space.lg, paddingVertical: 14, fontFamily: fonts.body, fontSize: 16 },
  seg: { flexDirection: "row", borderRadius: radius.md, padding: 3, ...(WEB ? { width: "100%", maxWidth: 560 } : {}) },
  segItem: { flex: 1, minHeight: 44, justifyContent: "center", alignItems: "center", paddingVertical: 10, paddingHorizontal: 6, borderRadius: radius.sm },
  notice: { borderRadius: radius.md, padding: space.lg, ...(WEB ? { maxWidth: 880 } : {}) },
});

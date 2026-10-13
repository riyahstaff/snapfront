// Building blocks for the back-office screens (email, affiliates, pixels, AutoDM): cards, number
// tiles, label/value lines, chips, switches and copyable links. Same look as Sales & profit.
import React from "react";
import { Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { fonts, radius, space, type, useColors } from "@/lib/theme";

export function Card({ title, sub, children, style, right }: { title?: string; sub?: string; children: React.ReactNode; style?: object; right?: React.ReactNode }) {
  const c = useColors();
  return (
    <View style={[{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, padding: space.lg, gap: space.md }, style]}>
      {title ? (
        <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: space.md }}>
          <View style={{ flexShrink: 1, gap: 2 }}>
            <Text accessibilityRole="header" style={[type.title, { color: c.ink, fontSize: 20 }]}>{title}</Text>
            {sub ? <Text style={[type.small, { color: c.muted }]}>{sub}</Text> : null}
          </View>
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );
}

export function Tile({ label, value, sub, wide }: { label: string; value: string; sub?: string; wide: boolean }) {
  const c = useColors();
  return (
    <View style={{ flexGrow: 1, flexBasis: wide ? 160 : "45%", backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.md, padding: space.lg, gap: 4 }}>
      <Text style={[type.small, { color: c.muted }]}>{label}</Text>
      <Text style={{ fontFamily: fonts.display, fontSize: 28, letterSpacing: -0.6, color: c.ink, fontVariant: ["tabular-nums"] }} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      {sub ? <Text style={[type.small, { color: c.muted }]}>{sub}</Text> : null}
    </View>
  );
}

export function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: space.md }}>
      <Text style={[strong ? type.heading : type.body, { color: c.ink, flexShrink: 1 }]}>{label}</Text>
      <Text style={[strong ? type.heading : type.body, { color: c.ink, fontVariant: ["tabular-nums"] }]}>{value}</Text>
    </View>
  );
}

export function Chip({ label, on, onPress, small }: { label: string; on?: boolean; onPress?: () => void; small?: boolean }) {
  const c = useColors();
  const body = (
    <View style={{ paddingHorizontal: small ? 8 : 12, minHeight: small ? 22 : 34, borderRadius: radius.pill, justifyContent: "center", borderWidth: 1, borderColor: on ? c.accent : c.line, backgroundColor: on ? c.accent : small ? c.sunk : "transparent" }}>
      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: small ? 11 : 13, color: on ? c.onAccent : c.muted }}>{label}</Text>
    </View>
  );
  return onPress ? <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: Boolean(on) }}>{body}</Pressable> : body;
}

/** A row of choices that scrolls sideways when it runs out of room. */
export function ChipRow<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label?: string }) {
  const c = useColors();
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={[type.label, { color: c.ink }]}>{label}</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {options.map((o) => <Chip key={o.value} label={o.label} on={o.value === value} onPress={() => onChange(o.value)} />)}
      </ScrollView>
    </View>
  );
}

export function Toggle({ label, sub, value, onChange, disabled }: { label: string; sub?: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.md, opacity: disabled ? 0.55 : 1 }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[type.heading, { color: c.ink }]}>{label}</Text>
        {sub ? <Text style={[type.small, { color: c.muted }]}>{sub}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} disabled={disabled} accessibilityLabel={label} trackColor={{ true: c.accent, false: c.line }} />
    </View>
  );
}

/** A link shown in full with a Copy button. */
export function CopyLink({ url, label = "Copy", onCopied }: { url: string; label?: string; onCopied?: () => void }) {
  const c = useColors();
  const [done, setDone] = React.useState(false);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: c.line, borderRadius: radius.md, paddingLeft: 14, paddingRight: 6, minHeight: 48, backgroundColor: c.bg }}>
      <Text selectable style={[type.small, { color: c.ink, flex: 1 }]} numberOfLines={2}>{url}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`${label} ${url}`} hitSlop={6}
        onPress={async () => { await Clipboard.setStringAsync(url).catch(() => {}); setDone(true); onCopied?.(); setTimeout(() => setDone(false), 1800); }}
        style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, height: 36, borderRadius: radius.pill, backgroundColor: c.sunk }}>
        <Ionicons name={done ? "checkmark" : "copy-outline"} size={16} color={c.ink} />
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: c.ink }}>{done ? "Copied" : label}</Text>
      </Pressable>
    </View>
  );
}

export function Search({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const c = useColors();
  return (
    <View style={{ flexGrow: 1, minWidth: 200, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: c.line, borderRadius: radius.pill, paddingHorizontal: 14, height: 46, backgroundColor: c.surface }}>
      <Ionicons name="search" size={18} color={c.muted} />
      <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={c.muted} autoCapitalize="none" style={{ flex: 1, color: c.ink, fontFamily: fonts.body, fontSize: 15, height: 44 }} accessibilityLabel={placeholder} />
    </View>
  );
}

/** Small text button used inside rows. */
export function TextAction({ label, onPress, tone }: { label: string; onPress: () => void; tone?: "bad" }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" hitSlop={8}>
      <Text style={[type.label, { color: tone === "bad" ? c.bad : c.accent }]}>{label}</Text>
    </Pressable>
  );
}

export const when = (iso: string | null | undefined) => (iso ? new Date(iso.replace(" ", "T") + (/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? "" : "Z")).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "");
export const money = (n: number) => `$${(Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const count = (n: number) => (Number(n) || 0).toLocaleString("en-US");

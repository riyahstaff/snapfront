import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { Button, Notice } from "@/components/ui";
import { api, ApiError, type StoreTheme } from "@/lib/api";
import { account, useMe } from "@/lib/account-store";
import { fonts, radius, space, type, useColors } from "@/lib/theme";

/** Pick how the storefront looks: 20 themes with their own colours, fonts and layout. */
export default function LooksScreen() {
  const c = useColors();
  const me = useMe();
  const insets = useSafeAreaInsets();
  const [themes, setThemes] = useState<StoreTheme[] | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; tone: "ok" | "error" } | null>(null);
  const current = me?.theme ?? "classic";
  const chosen = themes?.find((t) => t.id === (picked ?? current));

  useEffect(() => { api.themes().then(setThemes).catch((e) => setMsg({ text: e instanceof ApiError ? e.message : "Couldn’t load store looks.", tone: "error" })); }, []);

  async function apply() {
    if (!chosen) return;
    setSaving(true); setMsg(null);
    try {
      await api.updateStore({ theme: chosen.id });
      await account.refresh();
      setPicked(null);
      setMsg({ text: `Your store now uses ${chosen.name}.`, tone: "ok" });
    } catch (e) { setMsg({ text: e instanceof ApiError ? e.message : "Couldn’t change your store look.", tone: "error" }); }
    finally { setSaving(false); }
  }

  if (!themes) return (
    <View style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center", padding: space.lg }}>
      {msg ? <Notice text={msg.text} tone="error" /> : <ActivityIndicator color={c.accent} />}
    </View>
  );
  const changed = picked != null && picked !== current;
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <FlatList
        data={themes}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: 140 + insets.bottom }}
        ListHeaderComponent={<Text style={[type.small, { color: c.muted, marginBottom: space.xs }]}>Each look changes your store’s colours, fonts and layout. Your products and prices stay the same. Preview any look on your real store before you switch.</Text>}
        renderItem={({ item }) => (
          <ThemeCard t={item} storeName={me?.store_name || "Your store"} selected={(picked ?? current) === item.id} current={current === item.id}
            onPress={() => { setPicked(item.id); setMsg(null); }} />
        )}
      />
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: space.lg, paddingBottom: space.lg + insets.bottom, gap: space.sm, backgroundColor: c.surface, borderTopWidth: 1, borderColor: c.line }}>
        <Notice text={msg?.text ?? null} tone={msg?.tone} />
        <View style={{ flexDirection: "row", gap: space.sm }}>
          <Button label="Preview" variant="secondary" icon={<Ionicons name="eye-outline" size={18} color={c.ink} />} style={{ flex: 1 }} disabled={!chosen || !me}
            onPress={() => chosen && me && WebBrowser.openBrowserAsync(`${me.store_url}${chosen.id === current ? "" : `?theme=${chosen.id}`}`)} />
          <Button label={changed ? `Use ${chosen?.name}` : "In use"} style={{ flex: 1.4 }} disabled={!changed} loading={saving} onPress={apply} />
        </View>
      </View>
    </View>
  );
}

function ThemeCard({ t, storeName, selected, current, onPress }: { t: StoreTheme; storeName: string; selected: boolean; current: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={`${t.name}${current ? ", current look" : ""}. For ${t.for}. ${t.vibe}`}
      style={({ pressed }) => ({ backgroundColor: c.surface, borderRadius: radius.lg, borderWidth: selected ? 2 : 1, borderColor: selected ? c.accent : c.line,
        padding: selected ? space.md - 1 : space.md, gap: space.md, opacity: pressed ? 0.92 : 1 })}>
      <Mock t={t} storeName={storeName} />
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: space.sm }}>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
            <Text style={[type.heading, { color: c.ink }]}>{t.name}</Text>
            {current ? <Text style={[type.label, { color: c.good }]}>Current</Text> : null}
          </View>
          <Text style={[type.small, { color: c.ink, fontFamily: fonts.bodyMedium }]}>For {t.for.charAt(0).toLowerCase() + t.for.slice(1)}</Text>
          <Text style={[type.small, { color: c.muted }]}>{t.vibe}. Fonts: {t.fonts.display}{t.fonts.body !== t.fonts.display ? ` and ${t.fonts.body}` : ""}.</Text>
        </View>
        <Ionicons name={selected ? "radio-button-on" : "radio-button-off"} size={22} color={selected ? c.accent : c.muted} />
      </View>
    </Pressable>
  );
}

/** A small drawing of the storefront in this theme's colours and shapes. */
function Mock({ t, storeName }: { t: StoreTheme; storeName: string }) {
  const k = t.colors;
  const r = Math.min(t.shape.radius, 14) * 0.6;
  const block = t.shape.header === "block";
  const tiles = ["#E9DFD3", "#D5DEE7", "#EBD8DD"];
  const tileStyle = (i: number) => {
    const base = { flex: 1, borderRadius: r, overflow: "hidden" as const, backgroundColor: k.surface };
    switch (t.shape.card) {
      case "pop": return { ...base, borderWidth: 1.5, borderColor: k.ink, shadowColor: k.ink, shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 3, height: 3 }, elevation: 0 };
      case "flat": return { ...base, backgroundColor: "transparent" };
      case "frame": return { ...base, padding: 3, borderWidth: 1, borderColor: k.line };
      case "pastel": return { ...base, padding: 3, backgroundColor: ["#FFE1E8", "#DDEFFF", "#FFF1BF"][i] };
      case "glow": return { ...base, borderWidth: 1, borderColor: k.accent };
      case "shadow": return { ...base, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 };
      default: return { ...base, borderWidth: 1, borderColor: k.line };
    }
  };
  return (
    <View style={{ height: 156, borderRadius: radius.md, overflow: "hidden", backgroundColor: k.bg, borderWidth: 1, borderColor: k.line }} importantForAccessibility="no-hide-descendants">
      <View style={{ height: 30, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", justifyContent: t.shape.header === "center" ? "center" : "space-between",
        backgroundColor: block ? k.accent : t.shape.header === "center" ? k.bg : k.surface, borderBottomWidth: block ? 0 : 1, borderColor: k.line }}>
        <Text numberOfLines={1} style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: block ? k.onAccent : k.ink, maxWidth: "70%" }}>{storeName}</Text>
        <View style={t.shape.header === "center" ? { position: "absolute", right: 10 } : null}>
          <View style={{ width: 26, height: 12, borderRadius: 6, backgroundColor: block ? k.onAccent : k.bg, borderWidth: 1, borderColor: block ? k.onAccent : k.line }} />
        </View>
      </View>
      <View style={{ padding: 10, gap: 8, flex: 1 }}>
        <View style={{ height: 6, width: "55%", borderRadius: 3, backgroundColor: k.ink }} />
        <View style={{ height: 4, width: "35%", borderRadius: 2, backgroundColor: k.muted, opacity: 0.6 }} />
        <View style={{ flexDirection: "row", gap: 8, flex: 1 }}>
          {tiles.map((col, i) => (
            <View key={i} style={tileStyle(i)}>
              <View style={{ flex: 1, backgroundColor: col, borderRadius: t.shape.card === "flat" || t.shape.card === "frame" || t.shape.card === "pastel" ? r : 0, justifyContent: "flex-end", padding: 4 }}>
                <View style={{ alignSelf: "flex-start", width: 22, height: 8, borderRadius: 2, backgroundColor: k.badge }} />
              </View>
              <View style={{ height: 14, justifyContent: "center", paddingHorizontal: t.shape.card === "flat" ? 0 : 4 }}>
                <View style={{ height: 3, width: "70%", borderRadius: 2, backgroundColor: k.ink, opacity: 0.8 }} />
              </View>
            </View>
          ))}
        </View>
        <View style={{ height: 14, width: 64, borderRadius: Math.min(t.shape.button, 7), backgroundColor: k.accent }} />
      </View>
    </View>
  );
}

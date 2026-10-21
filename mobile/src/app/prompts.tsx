import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Platform, Pressable, ScrollView, Switch, Text, TextInput, View, useWindowDimensions } from "react-native";
import { router, useFocusEffect } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { Body, Button, Notice, usePageWidth } from "@/components/ui";
import { api, ApiError, type ConnectedApps, type LibraryPrompt, type PromptLibrary } from "@/lib/api";
import { cachedPrompts, loadPrompts } from "@/lib/prompts";
import { PAGE_MAX } from "@/lib/page-width";
import { fonts, radius, space, type, useColors } from "@/lib/theme";

/** Bonus: the prompt library. Search, filter, then open a prompt to fill it in and send it to Claude or ChatGPT. */
export default function PromptsScreen() {
  const c = useColors();
  const [lib, setLib] = useState<PromptLibrary | null>(cachedPrompts());
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [only, setOnly] = useState(false);
  const [apps, setApps] = useState<ConnectedApps | null>(null);
  const max = PAGE_MAX[usePageWidth()];
  const { width } = useWindowDimensions();
  const cols = Platform.OS === "web" ? (width >= 1100 ? 3 : width >= 720 ? 2 : 1) : 1;

  const load = useCallback(() => {
    loadPrompts().then((l) => { setLib(l); setError(null); })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Couldn't load the prompts. Check your connection and try again."));
  }, []);
  useEffect(() => { if (!lib) load(); }, [lib, load]);
  useFocusEffect(useCallback(() => {
    let active = true;
    api.connectedApps().then((a) => { if (active) setApps(a); }).catch(() => {});
    return () => { active = false; };
  }, []));

  const shown = useMemo(() => {
    if (!lib) return [];
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return lib.prompts.filter((p) => (!cat || p.category === cat) && (!only || p.snapfront)
      && words.every((w) => `${p.title} ${p.for} ${p.group} ${p.prompt}`.toLowerCase().includes(w)));
  }, [lib, q, cat, only]);
  const catName = useMemo(() => new Map(lib?.categories.map((x) => [x.id, x.name]) ?? []), [lib]);
  const connected = apps?.apps ?? [];

  const header = (
    <View style={{ gap: space.md, marginBottom: space.sm }}>
      <Body muted>{lib ? `${lib.count.toLocaleString()} ready-to-use prompts` : "Ready-to-use prompts"} for Claude and ChatGPT: digital products, your store, videos, AI agents, side hustles, money, health and your career. Pick one, fill in your details, and open it in your assistant with one tap.</Body>
      <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.md, padding: space.md, gap: space.sm }}>
        {connected.length ? (
          <Text style={[type.small, { color: c.ink }]}>
            <Ionicons name="checkmark-circle" size={14} color={c.good} /> Snapfront is connected to {connected.map((a) => a.name).join(" and ")}. Prompts marked <Text style={{ fontFamily: fonts.bodyBold, color: c.good }}>Uses Snapfront</Text> can read and update your store there, and they always ask before changing anything.
          </Text>
        ) : (
          <>
            <Text style={[type.small, { color: c.ink }]}>Connect Snapfront to Claude or ChatGPT first, so prompts marked <Text style={{ fontFamily: fonts.bodyBold, color: c.good }}>Uses Snapfront</Text> can work on your store. The others work either way.</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
              <Button label="How to connect" variant="secondary" onPress={() => WebBrowser.openBrowserAsync(api.siteUrl("connect-ai"))} />
            </View>
          </>
        )}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.md, paddingHorizontal: space.md }}>
        <Ionicons name="search" size={18} color={c.muted} />
        <TextInput value={q} onChangeText={setQ} placeholder="Search: TikTok, planner, credit, Notion…" placeholderTextColor={c.muted} accessibilityLabel="Search prompts"
          autoCorrect={false} autoCapitalize="none" returnKeyType="search" style={{ flex: 1, paddingVertical: 12, fontFamily: fonts.body, fontSize: 16, color: c.ink }} />
        {q ? <Pressable onPress={() => setQ("")} accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={10}><Ionicons name="close-circle" size={18} color={c.muted} /></Pressable> : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }} accessibilityRole="tablist">
        {[{ id: "", name: "All", count: lib?.count ?? 0 }, ...(lib?.categories ?? [])].map((x) => {
          const on = cat === x.id;
          return (
            <Pressable key={x.id || "all"} onPress={() => setCat(x.id)} accessibilityRole="tab" accessibilityState={{ selected: on }}
              style={{ flexDirection: "row", alignItems: "center", gap: 6, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: on ? c.ink : c.surface, borderWidth: 1, borderColor: on ? c.ink : c.line }}>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: on ? c.bg : c.ink }}>{x.name}</Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 13, color: on ? c.bg : c.muted }}>{x.count}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.md }}>
        <Text style={[type.small, { color: c.muted }]}>{lib ? (shown.length === lib.count ? `All ${lib.count.toLocaleString()} prompts` : `${shown.length.toLocaleString()} of ${lib.count.toLocaleString()} prompts`) : ""}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
          <Text style={[type.small, { color: c.ink }]}>Uses Snapfront only</Text>
          <Switch value={only} onValueChange={setOnly} accessibilityLabel="Show only prompts that use Snapfront" trackColor={{ true: c.accent, false: c.line }} />
        </View>
      </View>
      <Notice text={error} tone="error" />
      {error ? <Button label="Try again" variant="secondary" onPress={load} /> : null}
    </View>
  );

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={[{ paddingHorizontal: space.xl, paddingTop: space.lg, paddingBottom: space.xxl, gap: space.md }, max ? { width: "100%", maxWidth: max, alignSelf: "center" } : null]}
      key={cols}
      numColumns={cols}
      columnWrapperStyle={cols > 1 ? { gap: space.md } : undefined}
      data={shown}
      keyExtractor={(p) => p.id}
      keyboardShouldPersistTaps="handled"
      initialNumToRender={12}
      windowSize={7}
      ListHeaderComponent={header}
      ListEmptyComponent={!lib ? (error ? null : <ActivityIndicator color={c.accent} style={{ padding: space.xl }} />)
        : <Text style={[type.body, { color: c.muted, textAlign: "center", padding: space.xl }]}>No prompts match that. Try a shorter word or pick All.</Text>}
      renderItem={({ item }) => <PromptCard p={item} category={catName.get(item.category) ?? ""} cols={cols} />}
    />
  );
}

function PromptCard({ p, category, cols }: { p: LibraryPrompt; category: string; cols: number }) {
  const c = useColors();
  const preview = p.prompt.replace(/\s+/g, " ").slice(0, 190);
  return (
    <Pressable onPress={() => router.push({ pathname: "/prompt/[id]", params: { id: p.id } })} accessibilityRole="button" accessibilityLabel={`${p.title}. Open to fill in and send`}
      style={({ pressed }) => ({ flex: 1, maxWidth: cols > 1 ? `${100 / cols}%` : undefined, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.md, padding: space.md, gap: 6, opacity: pressed ? 0.85 : 1 })}>
      <Text style={[type.small, { color: c.muted }]} numberOfLines={1}>{p.group || category}</Text>
      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 21, color: c.ink }}>{p.title}</Text>
      {p.for ? <Text style={[type.small, { color: c.muted }]} numberOfLines={1}>For {p.for}</Text> : null}
      <Text style={[type.small, { color: c.ink, opacity: 0.85 }]} numberOfLines={3}>{preview}…</Text>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
        {p.snapfront ? <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: c.good }}>Uses Snapfront</Text> : <View />}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: c.accent }}>Use this prompt</Text>
          <Ionicons name="arrow-forward" size={14} color={c.accent} />
        </View>
      </View>
    </Pressable>
  );
}

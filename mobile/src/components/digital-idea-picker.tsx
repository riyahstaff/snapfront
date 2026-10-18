import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Body, Button, Field, Notice, Pill } from "./ui";
import { account, useMe } from "@/lib/account-store";
import { api, ApiError, type DigitalIdea, type DigitalIdeaCatalog } from "@/lib/api";
import { radius, space, type, useColors } from "@/lib/theme";

export function DigitalIdeaPicker() {
  const c = useColors();
  const me = useMe();
  const [catalog, setCatalog] = useState<DigitalIdeaCatalog | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState(30);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sources, setSources] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const inFlight = useRef(false);
  const requestKeys = useRef<Record<string, string>>({});
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    let active = true;
    api.digitalIdeas().then((value) => { if (active) { setCatalog(value); setError(null); } }).catch(() => { if (active) setError("The idea library could not load. Please retry."); });
    return () => { active = false; };
  }, [attempt]);
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const matches = catalog?.ideas.filter((idea) => (!category || idea.category_id === category) && words.every((word) => `${idea.title} ${idea.audience} ${idea.category_id} ${idea.format}`.toLowerCase().includes(word))) ?? [];
  const shownSources = catalog?.sources.filter((source) => !category || catalog.categories.find((cat) => cat.id === category)?.source_ids.includes(source.id)) ?? [];
  async function begin(idea: DigitalIdea) {
    if (!me || inFlight.current) return;
    const owner = me.id, revision = api.storeRevision();
    inFlight.current = true; setBusy(idea.id); setError(null);
    const key = `${owner}:${idea.id}`;
    requestKeys.current[key] ??= `idea-${Date.now()}-${Math.random().toString(36).slice(2,14)}`;
    try {
      const result = await api.startDigitalIdea(owner, idea.id, requestKeys.current[key]);
      if (!mounted.current || account.get()?.id !== owner || api.storeRevision() !== revision) return;
      router.push({ pathname: "/digital-editor", params: { id: result.product.id, storeId: owner } });
    } catch (err) {
      if (mounted.current && account.get()?.id === owner && api.storeRevision() === revision) setError(err instanceof ApiError ? err.message : "Could not start this idea. Retry safely to reopen the same draft.");
    } finally { inFlight.current = false; if (mounted.current) setBusy(null); }
  }
  return <View style={{ padding: space.lg, gap: space.md, backgroundColor: c.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: c.line }}>
    <Pill text="500 ideas · 25 categories" tone="flash" />
    <Pressable accessibilityRole="button" accessibilityLabel="Browse 500 digital product ideas" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} style={{ flexDirection: "row", gap: space.md, alignItems: "center", minHeight: 48 }}>
      <View style={{ flex: 1, gap: 4 }}><Text style={[type.heading, { color: c.ink }]}>Need an idea? Start here.</Text><Text style={[type.small, { color: c.muted }]}>Browse digital product ideas researched for 2026</Text></View>
      <Ionicons name={open ? "chevron-up" : "chevron-down"} size={22} color={c.ink} />
    </Pressable>
    {open ? <>
      <Body muted>Tap an idea to create a private draft in your current store, then make it yours with Mira, your designer assistant. Your product stays private until you finish and publish it.</Body>
      <Text style={[type.small, { color: c.muted }]}>Research-informed ideas, not a verified sales ranking. Some formats need an external working file. Research date: {catalog?.as_of ?? "2026-10-18"}.</Text>
      <Field label="Search product ideas" value={query} onChangeText={(value) => { setQuery(value); setLimit(30); }} placeholder="Try cooking, budget, wedding, tutorials…" />
      <ScrollView horizontal showsHorizontalScrollIndicator keyboardShouldPersistTaps="handled"><View style={{ flexDirection: "row", gap: 8 }}>
        {[{ id: "", name: "All categories" }, ...(catalog?.categories ?? [])].map((cat) => <Pressable key={cat.id} accessibilityRole="button" accessibilityState={{ selected: category === cat.id }} onPress={() => { setCategory(cat.id); setLimit(30); }} style={{ padding: 10, borderRadius: 16, backgroundColor: category === cat.id ? c.accent : c.sunk }}><Text style={[type.small, { color: category === cat.id ? c.onAccent : c.ink }]}>{cat.name}</Text></Pressable>)}
      </View></ScrollView>
      {!catalog && !error ? <ActivityIndicator color={c.accent} /> : null}
      {catalog ? <Text accessibilityLiveRegion="polite" style={[type.small, { color: c.muted }]}>{matches.length} ideas found · Tap one to start</Text> : null}
      <ScrollView style={{ maxHeight: 390 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
        {matches.slice(0, limit).map((idea) => <Pressable key={idea.id} accessibilityRole="button" accessibilityLabel={`Start ${idea.title}${idea.external_requirement ? ', external file required' : ''}`} disabled={!!busy || !me} onPress={() => void begin(idea)} style={({ pressed }) => ({ paddingVertical: 14, paddingHorizontal: 8, gap: 5, borderBottomWidth: 1, borderColor: c.line, opacity: busy && busy !== idea.id ? 0.5 : pressed ? 0.7 : 1 })}>
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}><Text style={[type.label, { color: c.ink, flex: 1 }]}>{idea.title}</Text>{busy === idea.id ? <ActivityIndicator color={c.accent} /> : <Ionicons name="arrow-forward" size={18} color={c.accent} />}</View>
          <Text style={[type.small, { color: c.muted }]}>{catalog?.categories.find((cat) => cat.id === idea.category_id)?.name} · {idea.external_requirement ? "External file required; starts a PDF brief" : "Editable PDF draft"}</Text>
        </Pressable>)}
        {catalog && !matches.length ? <Body muted>No matches. Try another keyword or choose All categories.</Body> : null}
        {matches.length > limit ? <Button label={`Show more (${matches.length - limit} remaining)`} variant="ghost" onPress={() => setLimit(limit + 30)} /> : null}
      </ScrollView>
      <Notice text={error} tone="error" />
      {!catalog && error ? <Button label="Retry library" variant="secondary" onPress={() => { setError(null); setAttempt(attempt + 1); }} /> : null}
      <Button label={sources ? "Hide research sources" : "How these ideas were researched"} variant="ghost" onPress={() => setSources(!sources)} />
      {sources ? <View style={{ gap: 12 }}><Body muted>{catalog?.methodology}</Body>{shownSources.map((source) => <View key={source.id} style={{ gap: 3 }}><Pressable accessibilityRole="link" onPress={() => void Linking.openURL(source.url)}><Text style={[type.label, { color: c.accent }]}>{source.title} ↗</Text></Pressable><Text style={[type.small, { color: c.muted }]}>{source.note}</Text></View>)}</View> : null}
    </> : null}
  </View>;
}

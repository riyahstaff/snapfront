import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Linking, Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Body, Button, Field, Notice, Pill } from "./ui";
import { account, useMe } from "@/lib/account-store";
import { api, ApiError, type DigitalIdea, type DigitalIdeaCatalog } from "@/lib/api";
import { radius, space, type, useColors } from "@/lib/theme";

export function DigitalIdeaPicker({ onStepChange }: { onStepChange?: () => void }) {
  const c = useColors();
  const me = useMe();
  const [catalog, setCatalog] = useState<DigitalIdeaCatalog | null>(null);
  const [selected, setSelected] = useState<DigitalIdea | null>(null);
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
  const topic = catalog?.categories.find(cat => cat.id === (selected?.category_id || category));
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
  function back() { if (selected) setSelected(null); else { setCategory(""); setQuery(""); } setError(null); onStepChange?.(); }
  return <View style={{ gap: space.lg }}>
    <Pill text="500 ideas · 25 topics" tone="flash" />
    {category || query || selected ? <Button label={selected ? "Back to ideas" : "Back to all topics"} variant="ghost" disabled={!!busy} onPress={back} /> : null}
    <Text accessibilityRole="header" style={[type.heading, { color: c.ink }]}>{selected ? "Your starting point" : category ? topic?.name : query ? "Find your idea" : "Choose a topic you love"}</Text>
    {selected ? <View style={{ gap: space.md, padding: space.lg, borderRadius: radius.lg, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line }}>
      {topic?.image_url ? <Image source={{ uri: topic.image_url }} contentFit="cover" accessibilityLabel={topic.name} style={{ width: "100%", height: 190, borderRadius: radius.md }} /> : null}
      <Text style={[type.heading, { color: c.ink }]}>{selected.title}</Text>
      <Body muted>For {selected.audience}. You’ll start with a private draft, then tell Mira how to make it yours.</Body>
      <Text style={[type.label, { color: c.ink }]}>Inside your draft</Text>
      {selected.outline.map((title,i) => <Body key={title}>{i + 1}. {title}</Body>)}
      <Notice text={selected.external_requirement} tone="info" />
      <Body muted>{selected.external_requirement ? "This starts a PDF production brief. You must create and upload the working file separately before selling it." : "You’ll create an editable PDF product. Review its writing and pictures before putting it up for sale."}</Body>
      <Button label="Next: personalize with Mira" loading={!!busy} disabled={!me || !!busy} onPress={() => void begin(selected)} />
    </View> : <>
      <Field label={category ? "Search this topic" : "Search all 500 ideas"} value={query} onChangeText={value => { setQuery(value); setLimit(30); }} placeholder="Try recipes, student planner, budget…" />
      {!catalog && !error ? <ActivityIndicator color={c.accent} /> : null}
      {!category && !query.trim() ? <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md }}>
        {catalog?.categories.map(cat => <Pressable key={cat.id} accessibilityRole="button" accessibilityLabel={`${cat.name}, 20 ideas`} onPress={() => { setCategory(cat.id); setLimit(30); onStepChange?.(); }} style={({ pressed }) => ({ flexBasis: 230, flexGrow: 1, overflow: "hidden", borderRadius: radius.lg, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, opacity: pressed ? 0.75 : 1 })}>
          <Image source={{ uri: cat.image_url }} contentFit="cover" accessibilityLabel={cat.name} style={{ width: "100%", height: 148, backgroundColor: c.sunk }} />
          <View style={{ padding: space.md, gap: space.sm }}><Text style={[type.heading, { color: c.ink }]}>{cat.name}</Text><View style={{ flexDirection: "row", justifyContent: "space-between" }}><Text style={[type.small, { color: c.muted }]}>20 ideas to make your own</Text><Ionicons name="arrow-forward" size={20} color={c.accent} /></View></View>
        </Pressable>)}
      </View> : <View style={{ gap: space.sm }}>
        <Body muted>{matches.length} ideas · Choose one to see what’s inside.</Body>
        {matches.slice(0,limit).map(idea => <Pressable key={idea.id} accessibilityRole="button" accessibilityLabel={`Explore ${idea.title}`} onPress={() => { setSelected(idea); onStepChange?.(); }} style={({ pressed }) => ({ padding: space.lg, borderRadius: radius.md, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, gap: 6, opacity: pressed ? 0.7 : 1 })}>
          <View style={{ flexDirection: "row", gap: 12 }}><Text style={[type.label, { color: c.ink, flex: 1 }]}>{idea.title}</Text><Ionicons name="chevron-forward" size={20} color={c.accent} /></View>
          <Text style={[type.small, { color: c.muted }]}>{idea.external_requirement ? "PDF brief + working file needed" : "Editable PDF"} · For {idea.audience}</Text>
        </Pressable>)}
        {!matches.length ? <Body muted>No matches yet. Try a different word or go back to all topics.</Body> : null}
        {matches.length > limit ? <Button label="Show more ideas" variant="secondary" onPress={() => setLimit(limit + 30)} /> : null}
      </View>}
    </>}
    <Notice text={error} tone="error" />
    {!catalog && error ? <Button label="Retry library" variant="secondary" onPress={() => { setError(null); setAttempt(attempt + 1); }} /> : null}
    <Button label={sources ? "Hide research notes" : "About these ideas"} variant="ghost" onPress={() => setSources(!sources)} />
    {sources ? <View style={{ gap: 12 }}><Body muted>Research-informed ideas, not a verified sales ranking. {catalog?.methodology}</Body>{shownSources.map(source => <Pressable key={source.id} accessibilityRole="link" onPress={() => void Linking.openURL(source.url)}><Text style={[type.small, { color: c.accent }]}>{source.title} ↗</Text></Pressable>)}</View> : null}
  </View>;
}

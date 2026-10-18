// Owner only: choose the avatar (and voice) that teaches Academy lessons, and which lessons she
// teaches. Saving starts making those lesson videos in the background; the old videos stay up until
// the new ones are ready.
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Button, Field, Notice, Segmented } from "@/components/ui";
import { academy, ApiError, type AcademyPresenter, type LibraryVoice } from "@/lib/api";
import { radius, space, type, useColors } from "@/lib/theme";

export function PresenterCard() {
  const c = useColors();
  const [data, setData] = useState<AcademyPresenter | null>(null);
  const [open, setOpen] = useState(false);
  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [voice, setVoice] = useState("af_bella");
  const [scope, setScope] = useState<"pilot" | "all">("pilot");
  const [pilot, setPilot] = useState("partner");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; tone: "ok" | "error" | "info" } | null>(null);
  // Searching ElevenLabs' voice library for more voices.
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<LibraryVoice[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const search = async () => {
    setSearching(true); setMsg(null);
    try { setFound((await academy.voiceLibrary({ search: query.trim(), gender: "female" })).voices); }
    catch (e) { setMsg({ text: e instanceof ApiError ? e.message : "Couldn't search the voice library.", tone: "error" }); }
    finally { setSearching(false); }
  };
  const addVoice = async (v: LibraryVoice) => {
    setAdding(v.voice_id);
    try {
      const { id } = await academy.addLibraryVoice({ public_owner_id: v.public_owner_id, voice_id: v.voice_id, name: v.name });
      const fresh = await academy.presenter();
      setData(fresh); setVoice(id);
      setMsg({ text: `${v.name} added to your ElevenLabs voices and picked. Save to use it.`, tone: "ok" });
    } catch (e) { setMsg({ text: e instanceof ApiError ? e.message : "Couldn't add that voice.", tone: "error" }); }
    finally { setAdding(null); }
  };

  const apply = useCallback((v: AcademyPresenter) => {
    setData(v);
    if (v.presenter) {
      setAvatarId(v.presenter.avatar_id); setVoice(v.presenter.voice);
      if (v.presenter.lessons === "all") setScope("all");
      else if (v.presenter.lessons.length) { setScope("pilot"); setPilot(v.presenter.lessons[0]); }
    } else setAvatarId((id) => id ?? v.avatars[0]?.id ?? null);
  }, []);
  useEffect(() => { academy.presenter().then(apply).catch(() => {}); }, [apply]);
  // While videos are being made, check every few seconds.
  useEffect(() => {
    if (!data?.building) return;
    const t = setInterval(() => academy.presenter().then(setData).catch(() => {}), 5000);
    return () => clearInterval(t);
  }, [data?.building]);

  if (!data) return null;
  const lessons = scope === "all" ? data.lessons : data.lessons.filter((l) => l.id === pilot);
  const slides = lessons.reduce((t, l) => t + l.slides, 0);
  const cost = (slides * data.cost_per_slide_usd).toFixed(2);
  const title = (id: string) => data.lessons.find((l) => l.id === id)?.title ?? id;
  const demos = data.screens.filter((s) => lessons.some((l) => l.id === s.lesson));
  const save = async () => {
    if (!avatarId) return;
    setBusy(true); setMsg(null);
    try {
      apply(await academy.setPresenter({ avatar_id: avatarId, voice, lessons: scope === "all" ? "all" : [pilot] }));
      setMsg({ text: `Saved. Making ${lessons.length === 1 ? "the lesson video" : `${lessons.length} lesson videos`} now. Each takes a few minutes; the old video stays up until the new one is ready.`, tone: "ok" });
    } catch (e) { setMsg({ text: e instanceof ApiError ? e.message : "Couldn't save.", tone: "error" }); }
    finally { setBusy(false); }
  };

  return (
    <View style={{ gap: space.md, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, backgroundColor: c.surface, padding: space.lg }}>
      <Pressable onPress={() => setOpen(!open)} accessibilityRole="button" style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
        <Ionicons name="school-outline" size={20} color={c.accent} />
        <View style={{ flex: 1 }}>
          <Text style={[type.heading, { color: c.ink }]}>Lesson presenter</Text>
          <Text style={[type.small, { color: c.muted }]}>Only you see this. {data.active ? `${data.avatars.find((a) => a.id === data.presenter?.avatar_id)?.name ?? "Your avatar"} teaches ${data.presenter?.lessons === "all" ? "every lesson" : `${data.presenter?.lessons.length ?? 0} lesson${data.presenter?.lessons.length === 1 ? "" : "s"}`}.` : "Have one of your avatars teach the lessons."}</Text>
        </View>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={c.muted} />
      </Pressable>
      {data.building ? (
        <View style={{ flexDirection: "row", gap: space.sm, alignItems: "center" }}>
          <ActivityIndicator color={c.accent} />
          <Text style={[type.small, { color: c.ink }]}>Making “{title(data.building.lesson ?? "")}”: {data.building.step}</Text>
        </View>
      ) : null}
      {data.last_error && !data.building ? <Notice text={`Last attempt didn't finish: ${data.last_error}`} tone="error" /> : null}
      {open ? (
        <>
          {data.avatars.length ? (
            <>
              <Text style={[type.label, { color: c.ink }]}>Who teaches</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
                {data.avatars.map((a) => (
                  <Pressable key={a.id} onPress={() => setAvatarId(a.id)} accessibilityRole="radio" accessibilityState={{ selected: a.id === avatarId }} accessibilityLabel={a.name} style={{ width: 84, gap: 4 }}>
                    <View style={{ width: 84, aspectRatio: 4 / 5, borderRadius: radius.md, overflow: "hidden", borderWidth: 3, borderColor: a.id === avatarId ? c.accent : "transparent", backgroundColor: c.sunk }}>
                      <Image source={{ uri: a.image_url }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                    </View>
                    <Text style={[type.small, { color: c.ink }]} numberOfLines={1}>{a.name}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : <Notice text="Make an avatar with a face first (your photo, a blend, Soft 3D, Illustrated or Mascot) in AI avatars." tone="info" />}
          <Text style={[type.label, { color: c.ink }]}>Her voice</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
            {data.voices.map((v) => (
              <Pressable key={v.id} onPress={() => setVoice(v.id)} accessibilityRole="radio" accessibilityState={{ selected: v.id === voice }}
                style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, borderWidth: v.id === voice ? 2 : 1, borderColor: v.id === voice ? c.accent : c.line, backgroundColor: c.bg }}>
                <Text style={[type.small, { color: c.ink }]}>{v.premium ? "★ " : ""}{v.name}{v.accent ? <Text style={{ color: c.muted }}>  {v.accent}</Text> : null}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={[type.small, { color: c.muted }]}>★ ElevenLabs voices use characters from your ElevenLabs plan.</Text>
          <View style={{ flexDirection: "row", gap: space.sm, alignItems: "flex-end" }}>
            <View style={{ flex: 1 }}><Field label="Find more voices (ElevenLabs library)" value={query} onChangeText={setQuery} placeholder="warm, smooth, confident…" onSubmitEditing={search} /></View>
            <Button label="Search" variant="secondary" loading={searching} onPress={search} />
          </View>
          {found ? (found.length ? found.slice(0, 8).map((v) => (
            <View key={v.voice_id} style={{ flexDirection: "row", alignItems: "center", gap: space.sm, paddingVertical: 6, borderTopWidth: 1, borderColor: c.sunk }}>
              <View style={{ flex: 1 }}>
                <Text style={[type.label, { color: c.ink }]}>{v.name}</Text>
                <Text style={[type.small, { color: c.muted }]} numberOfLines={2}>{[v.accent, v.age, v.descriptive].filter(Boolean).join(" · ")}{v.description ? ` · ${v.description}` : ""}</Text>
              </View>
              {v.preview_url ? <Button label="Listen" variant="ghost" onPress={() => Linking.openURL(v.preview_url!)} /> : null}
              <Button label="Add" variant="secondary" loading={adding === v.voice_id} onPress={() => addVoice(v)} />
            </View>
          )) : <Text style={[type.small, { color: c.muted }]}>No voices found. Try other words.</Text>) : null}
          <Text style={[type.label, { color: c.ink }]}>Which lessons</Text>
          <Segmented value={scope} onChange={setScope} options={[{ value: "all", label: "Every lesson" }, { value: "pilot", label: "Only one lesson" }]} />
          {scope === "pilot" && data.presenter?.lessons === "all" ? (
            <Notice text="Careful: saving with one lesson takes your avatar off the other lessons, and they go back to their original videos. To change her voice or look everywhere, choose Every lesson." tone="error" />
          ) : null}
          {scope === "pilot" ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
              {data.lessons.map((l) => (
                <Pressable key={l.id} onPress={() => setPilot(l.id)} accessibilityRole="radio" accessibilityState={{ selected: l.id === pilot }}
                  style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, borderWidth: l.id === pilot ? 2 : 1, borderColor: l.id === pilot ? c.accent : c.line, backgroundColor: c.bg }}>
                  <Text style={[type.small, { color: c.ink }]}>{l.title}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          <Text style={[type.small, { color: c.muted }]}>
            {slides} slides, about ${cost} on Runpod for the talking avatar. {demos.length ? `${demos.filter((d) => d.recorded).length} of ${demos.length} app demos recorded; slides without one show the lesson slide next to her.` : "These lessons show the slides next to her."}
          </Text>
          <Notice text={msg?.text ?? null} tone={msg?.tone} />
          <Button label={scope === "all" ? (data.active ? "Save and remake every lesson" : "Save and make every lesson") : `Save and remake “${title(pilot)}” only`} loading={busy} disabled={!avatarId} onPress={save} />
        </>
      ) : null}
    </View>
  );
}

// Faceless avatars: make an original AI character once, then drop it into photos with your
// products. Each finished shot goes straight to Marketing as a post, story, carousel or reel.
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Body, Button, Field, H2, Notice, Pill } from "@/components/ui";
import { api, ApiError, type Avatar, type AvatarShot, type AvatarStudio, type AvatarVideo, type AvatarVideoStudio, type Product } from "@/lib/api";
import { VideoCard, VideoPanel } from "@/components/avatar-video";
import { account, useMe } from "@/lib/account-store";
import { saveToPhone, shareFile } from "@/lib/media";
import { radius, space, type, useColors } from "@/lib/theme";

type Msg = { text: string; tone: "ok" | "error" | "info" } | null;
const errText = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);
const busyStatus = (s: string) => s === "queued" || s === "running";

export default function AvatarsScreen() {
  const c = useColors();
  const me = useMe();
  const { width } = useWindowDimensions();
  const [studio, setStudio] = useState<AvatarStudio | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [msg, setMsg] = useState<Msg>(null);
  // Making an avatar
  const [style, setStyle] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [look, setLook] = useState("");
  const [creating, setCreating] = useState(false);
  // Making a shot
  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [productId, setProductId] = useState<string | null>(null);
  const [pose, setPose] = useState<string | null>("present");
  const [prompt, setPrompt] = useState("");
  const [shooting, setShooting] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  // Videos (paid with credits)
  const [vstudio, setVstudio] = useState<AvatarVideoStudio | null>(null);
  const [panel, setPanel] = useState<{ key: string; mode: "motion" | "talk"; shotId?: string; avatarId?: string; name: string } | null>(null);
  const vtimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(() => api.avatars().then((s) => {
    setStudio(s);
    setAvatarId((id) => id ?? s.avatars.find((a) => a.status === "done")?.id ?? null);
  }).catch((e) => setMsg({ text: errText(e, "Couldn’t load your avatars."), tone: "error" })), []);
  const loadVideos = useCallback(() => api.avatarVideos().then(setVstudio).catch(() => {}), []);
  useEffect(() => {
    load();
    loadVideos();
    api.products().then((list) => { const w = list.filter((p) => p.image_file); setProducts(w); setProductId((x) => x ?? w[0]?.id ?? null); }).catch(() => {});
  }, [load, loadVideos]);
  // Check videos still being made (they take a few minutes).
  useEffect(() => {
    if (vtimer.current) clearInterval(vtimer.current);
    const running = vstudio?.videos.filter((v) => busyStatus(v.status)) ?? [];
    if (!running.length) return;
    vtimer.current = setInterval(async () => {
      const fresh = await Promise.all(running.map((v) => api.avatarVideo(v.id).catch(() => v)));
      setVstudio((st) => st && ({ ...st, videos: st.videos.map((v) => fresh.find((f) => f.id === v.id) ?? v) }));
      if (fresh.some((f) => f.status === "failed")) api.avatarVideos().then((s) => setVstudio((st) => st && ({ ...st, balance: s.balance }))).catch(() => {});
    }, 6000);
    return () => { if (vtimer.current) clearInterval(vtimer.current); };
  }, [vstudio]);
  const startedVideo = (v: AvatarVideo, balance: number) => {
    setVstudio((st) => st && ({ ...st, balance, videos: [v, ...st.videos] }));
    setPanel(null);
    setMsg({ text: v.kind === "talk" ? "Making the voice, then the video. Usually 1 to 3 minutes." : `Making your ${v.model_name} video. Usually 1 to 5 minutes.`, tone: "info" });
  };
  const deleteVideo = async (id: string) => {
    try { await api.deleteAvatarVideo(id); setVstudio((st) => st && ({ ...st, videos: st.videos.filter((v) => v.id !== id) })); }
    catch (e) { setMsg({ text: errText(e, "Couldn’t delete it."), tone: "error" }); }
  };
  const canTalk = (av?: Avatar | null) => !!av && !!vstudio?.talk.styles.includes(av.style);

  // Check avatars and shots that are still being made.
  useEffect(() => {
    if (timer.current) clearInterval(timer.current);
    if (!studio) return;
    const avs = studio.avatars.filter((a) => busyStatus(a.status));
    const shots = studio.shots.filter((s) => busyStatus(s.status));
    if (!avs.length && !shots.length) return;
    timer.current = setInterval(async () => {
      const [fa, fs] = await Promise.all([
        Promise.all(avs.map((a) => api.avatar(a.id).catch(() => a))),
        Promise.all(shots.map((s) => api.avatarShotStatus(s.id).catch(() => s))),
      ]);
      setStudio((st) => st && ({ ...st, avatars: st.avatars.map((a) => fa.find((f) => f.id === a.id) ?? a), shots: st.shots.map((s) => fs.find((f) => f.id === s.id) ?? s) }));
      const ready = fa.find((a) => a.status === "done");
      if (ready) setAvatarId((id) => id ?? ready.id);
      if ([...fa, ...fs].some((x) => x.status === "failed")) account.refresh().catch(() => {});
    }, 4000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [studio]);

  if (!studio) return <View style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center" }}>{msg ? <Notice text={msg.text} tone="error" /> : <ActivityIndicator color={c.accent} />}</View>;
  if (!studio.enabled) return <View style={{ flex: 1, backgroundColor: c.bg, padding: space.lg }}><Notice text="Faceless avatars are being switched on. Check back soon." tone="info" /></View>;

  const a = me?.account;
  const left = a ? Math.max(0, a.limits.scene - a.usage.scene) : null;
  const ready = studio.avatars.filter((x) => x.status === "done");
  const chosen = ready.find((x) => x.id === avatarId) ?? null;
  const product = products.find((p) => p.id === productId);
  const thumb = Math.min(110, (width - space.lg * 2 - space.sm * 2) / 3);

  async function createAvatar() {
    if (!style) return;
    setCreating(true); setMsg(null);
    try {
      const made = await api.createAvatar({ style, name: name.trim() || undefined, look: look.trim() || undefined });
      setStudio((s) => s && ({ ...s, avatars: [made, ...s.avatars] }));
      setName(""); setLook("");
      account.refresh().catch(() => {});
      setMsg({ text: "Making your avatar. It takes about 20 seconds.", tone: "info" });
    } catch (e) { if (!(e instanceof ApiError && e.upgrade)) setMsg({ text: errText(e, "Couldn’t start your avatar."), tone: "error" }); }
    finally { setCreating(false); }
  }
  async function makeShot() {
    if (!chosen || !product) return;
    setShooting(true); setMsg(null);
    try {
      const s = await api.avatarShot({ avatar_id: chosen.id, product_id: product.id, pose: pose ?? undefined, prompt: pose ? undefined : prompt.trim() });
      setStudio((st) => st && ({ ...st, shots: [s, ...st.shots] }));
      account.refresh().catch(() => {});
      setMsg({ text: `Putting ${chosen.name} in a photo with ${product.title}. About 20 seconds.`, tone: "info" });
    } catch (e) { if (!(e instanceof ApiError && e.upgrade)) setMsg({ text: errText(e, "Couldn’t start the photo."), tone: "error" }); }
    finally { setShooting(false); }
  }
  function confirmDelete(av: Avatar) {
    const go = async () => {
      try { await api.deleteAvatar(av.id); setStudio((s) => s && ({ ...s, avatars: s.avatars.filter((x) => x.id !== av.id), shots: s.shots.filter((x) => x.avatar_id !== av.id) })); if (avatarId === av.id) setAvatarId(null); }
      catch (e) { setMsg({ text: errText(e, "Couldn’t delete it."), tone: "error" }); }
    };
    if (Platform.OS === "web") { if (globalThis.confirm?.(`Delete ${av.name} and its photos here? Posts you already made keep their pictures.`)) void go(); return; }
    Alert.alert(`Delete ${av.name}?`, "Its photos are removed from this list. Posts you already made keep their pictures.", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => void go() }]);
  }

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: space.lg, gap: space.lg, paddingBottom: space.xxl }} keyboardShouldPersistTaps="handled">
      <Body muted>Post without being on camera. Make an original character once, put it in photos with your products, then turn those into videos.</Body>
      {vstudio ? (
        <Pressable onPress={() => router.push("/credits")} accessibilityRole="button" accessibilityLabel={`${vstudio.balance} credits. Top up`}
          style={{ flexDirection: "row", alignItems: "center", gap: space.sm, alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface }}>
          <Ionicons name="sparkles" size={16} color={c.accent} />
          <Text style={[type.label, { color: c.ink }]}>{vstudio.free ? "Owner: videos are free" : `${vstudio.balance.toLocaleString()} credits`}</Text>
          {vstudio.free ? null : <Text style={[type.small, { color: c.accent }]}>Top up</Text>}
        </Pressable>
      ) : null}

      {/* ---------- your avatars ---------- */}
      {studio.avatars.length ? (
        <View style={{ gap: space.sm }}>
          <H2>Your avatars</H2>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
            {studio.avatars.map((av) => (
              <Pressable key={av.id} disabled={av.status !== "done"} onPress={() => setAvatarId(av.id)} onLongPress={() => confirmDelete(av)}
                accessibilityRole="radio" accessibilityState={{ selected: av.id === avatarId, disabled: av.status !== "done" }} accessibilityLabel={`${av.name}${av.status === "done" ? "" : av.status === "failed" ? ", didn't work" : ", being made"}`}
                style={{ width: thumb, gap: 6 }}>
                <View style={{ width: thumb, aspectRatio: 4 / 5, borderRadius: radius.md, overflow: "hidden", borderWidth: 3, borderColor: av.id === avatarId ? c.accent : "transparent", backgroundColor: c.sunk, alignItems: "center", justifyContent: "center" }}>
                  {av.image_url ? <Image source={{ uri: av.image_url }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                    : av.status === "failed" ? <Ionicons name="alert-circle-outline" size={26} color={c.muted} /> : <ActivityIndicator color={c.accent} />}
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={[type.small, { color: c.ink, flex: 1 }]} numberOfLines={1}>{av.name}</Text>
                  <Pressable onPress={() => confirmDelete(av)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Delete ${av.name}`}><Ionicons name="trash-outline" size={15} color={c.muted} /></Pressable>
                </View>
                {av.status === "failed" ? <Text style={[type.small, { color: c.muted }]} numberOfLines={3}>{av.error}</Text> : null}
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {/* ---------- make a shot ---------- */}
      {ready.length ? (
        <View style={{ gap: space.sm, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, padding: space.md }}>
          <H2>Put {chosen ? chosen.name : "your avatar"} in a photo</H2>
          {products.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
              {products.map((p) => (
                <Pressable key={p.id} onPress={() => setProductId(p.id)} accessibilityRole="radio" accessibilityState={{ selected: p.id === productId }} accessibilityLabel={p.title}
                  style={{ width: 72, height: 72, borderRadius: radius.md, overflow: "hidden", borderWidth: 3, borderColor: p.id === productId ? c.accent : "transparent", backgroundColor: c.sunk }}>
                  <Image source={{ uri: p.image_url! }} style={{ flex: 1 }} contentFit="cover" />
                </Pressable>
              ))}
            </ScrollView>
          ) : <Notice text="Add a product with a photo first." tone="info" />}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
            {studio.poses.map((p) => <Chip key={p.id} label={p.name} on={pose === p.id} onPress={() => setPose(pose === p.id ? null : p.id)} />)}
          </View>
          {!pose ? <Field label="Or describe the shot" value={prompt} onChangeText={setPrompt} maxLength={200} placeholder="sitting on a beach towel, putting the sunscreen in a tote bag" /> : null}
          <Button label="Make the photo" icon={<Ionicons name="sparkles" size={18} color={c.onAccent} />} loading={shooting}
            disabled={!chosen || !product || (!pose && prompt.trim().length < 3)} onPress={makeShot} />
          {vstudio?.enabled && chosen && canTalk(chosen) && panel?.key !== `talk:${chosen.id}` ? (
            <Button label={`Make ${chosen.name} talk`} variant="secondary" icon={<Ionicons name="mic-outline" size={18} color={c.ink} />} onPress={() => setPanel({ key: `talk:${chosen.id}`, mode: "talk", avatarId: chosen.id, name: chosen.name })} />
          ) : null}
          {vstudio && chosen && panel?.key === `talk:${chosen.id}` ? (
            <VideoPanel studio={vstudio} mode="talk" avatarId={chosen.id} avatarName={chosen.name} onStarted={startedVideo} onClose={() => setPanel(null)} />
          ) : null}
        </View>
      ) : null}

      {/* ---------- make an avatar ---------- */}
      <View style={{ gap: space.sm }}>
        <H2>{studio.avatars.length ? "Make another avatar" : "Make your avatar"}</H2>
        <View style={{ gap: space.sm }}>
          {studio.styles.map((s) => (
            <Pressable key={s.id} onPress={() => setStyle(s.id)} accessibilityRole="radio" accessibilityState={{ selected: style === s.id }}
              style={{ flexDirection: "row", gap: space.md, alignItems: "center", padding: space.md, borderRadius: radius.md, borderWidth: style === s.id ? 2 : 1, borderColor: style === s.id ? c.accent : c.line, backgroundColor: c.surface }}>
              <Ionicons name={style === s.id ? "radio-button-on" : "radio-button-off"} size={20} color={style === s.id ? c.accent : c.muted} />
              <View style={{ flex: 1, gap: 2 }}><Text style={[type.label, { color: c.ink }]}>{s.name}</Text><Text style={[type.small, { color: c.muted }]}>{s.blurb}</Text></View>
            </Pressable>
          ))}
        </View>
        <Field label="Name (optional)" value={name} onChangeText={setName} maxLength={30} placeholder="Nova" />
        <Field label="Describe the look" hint="Hair, outfit, colors, vibe. Avatars are original characters, so don't base one on a real person." value={look} onChangeText={setLook} maxLength={200} multiline
          placeholder="lilac hoodie, silver sneakers, calm and confident" />
        <Button label="Make my avatar" icon={<Ionicons name="person-circle-outline" size={18} color={c.onAccent} />} loading={creating}
          disabled={!style || studio.avatars.filter((x) => x.status !== "failed").length >= studio.max_avatars} onPress={createAvatar} />
        {left != null ? <Text style={[type.small, { color: c.muted }]}>Avatars and avatar photos use your AI photo allowance: {left} left{a?.plan === "free" ? "" : " this month"}.</Text> : null}
      </View>

      <View style={{ flexDirection: "row", gap: space.sm, alignItems: "flex-start", backgroundColor: c.surface, borderColor: c.line, borderWidth: 1, borderRadius: radius.md, padding: space.md }}>
        <Ionicons name="information-circle-outline" size={18} color={c.accent} />
        <Text style={[type.small, { color: c.ink, flex: 1 }]}>Check each photo before you post: AI can change small details on a product. Instagram and TikTok ask you to label AI-made images, so turn on the AI label when you post.</Text>
      </View>
      <Notice text={msg?.text ?? null} tone={msg?.tone} />

      {/* ---------- videos ---------- */}
      {vstudio?.videos.length ? <H2>Your avatar videos</H2> : null}
      {vstudio?.videos.map((v) => <VideoCard key={v.id} video={v} width={Math.min(width - space.lg * 2, 520) - space.md * 2} onDelete={deleteVideo} onMsg={setMsg} />)}

      {/* ---------- finished shots ---------- */}
      {studio.shots.length ? <H2>Your avatar photos</H2> : null}
      {studio.shots.map((s) => {
        const av = studio.avatars.find((x) => x.id === s.avatar_id);
        const open = panel?.shotId === s.id ? panel : null;
        return (
          <ShotCard key={s.id} shot={s} avatar={av} onMsg={setMsg}
            video={vstudio?.enabled && s.status === "done" ? (
              open ? <VideoPanel studio={vstudio} mode={open.mode} shotId={s.id} avatarName={av?.name ?? "Your avatar"} onStarted={startedVideo} onClose={() => setPanel(null)} />
                : (
                  <View style={{ flexDirection: "row", gap: space.sm }}>
                    <Button label="Make a video" variant="secondary" style={{ flex: 1 }} icon={<Ionicons name="film-outline" size={18} color={c.ink} />} onPress={() => setPanel({ key: `motion:${s.id}`, mode: "motion", shotId: s.id, name: av?.name ?? "" })} />
                    {canTalk(av) ? <Button label="Make it talk" variant="secondary" style={{ flex: 1 }} icon={<Ionicons name="mic-outline" size={18} color={c.ink} />} onPress={() => setPanel({ key: `talk:${s.id}`, mode: "talk", shotId: s.id, name: av?.name ?? "" })} /> : null}
                  </View>
                )
            ) : null} />
        );
      })}
    </ScrollView>
  );
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected: on }}
      style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.pill, borderWidth: on ? 2 : 1, borderColor: on ? c.accent : c.line, backgroundColor: c.bg }}>
      <Text style={[type.label, { color: c.ink }]}>{label}</Text>
    </Pressable>
  );
}

function ShotCard({ shot, avatar, onMsg, video }: { shot: AvatarShot; avatar?: Avatar; onMsg: (m: Msg) => void; video?: React.ReactNode }) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const w = Math.min(width - space.lg * 2, 520) - space.md * 2;
  const [saving, setSaving] = useState(false);
  const post = (format: "post" | "story") => router.push({ pathname: "/marketing", params: { product_id: shot.product_id ?? undefined, image_url: shot.image_url ?? undefined, format } });
  return (
    <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, padding: space.md, gap: space.md }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={[type.label, { color: c.ink }]}>{avatar?.name ?? "Avatar"} photo</Text>
        <Pill text={shot.status === "done" ? "Ready" : shot.status === "failed" ? "Didn’t work" : "Making…"} tone={shot.status === "done" ? "good" : "neutral"} />
      </View>
      {busyStatus(shot.status) ? <ActivityIndicator color={c.accent} /> : null}
      {shot.status === "failed" ? <Text style={[type.small, { color: c.muted }]}>{shot.error} It didn’t count against your plan.</Text> : null}
      {shot.status === "done" && shot.image_url ? (
        <>
          <Image source={{ uri: shot.image_url }} style={{ width: w, aspectRatio: 4 / 5, borderRadius: radius.md }} contentFit="cover" accessibilityLabel={`${avatar?.name ?? "Avatar"} with your product`} />
          <View style={{ flexDirection: "row", gap: space.sm }}>
            <Button label="Make a post" style={{ flex: 1 }} onPress={() => post("post")} />
            <Button label="Make a story" variant="secondary" style={{ flex: 1 }} onPress={() => post("story")} />
          </View>
          <View style={{ flexDirection: "row", gap: space.sm }}>
            <Button label="Save" variant="ghost" style={{ flex: 1 }} loading={saving} onPress={async () => {
              setSaving(true);
              try { onMsg((await saveToPhone([shot.image_url!])) ? { text: "Saved to your phone.", tone: "ok" } : { text: "Allow photo access in Settings to save.", tone: "error" }); }
              finally { setSaving(false); }
            }} />
            <Button label="Share" variant="ghost" style={{ flex: 1 }} onPress={() => shareFile(shot.image_url!).catch(() => {})} />
          </View>
          {video}
        </>
      ) : null}
    </View>
  );
}

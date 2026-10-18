// Avatars: make an original AI character once (or use your own photo, or blend two photos), then
// drop it into photos with your products, then turn those photos into videos. The page follows
// those three steps top to bottom, and each result appears right under the button that made it:
//   1. Choose your avatar   (new avatars join the row and are picked automatically)
//   2. Put it in a photo     (new photos appear under "Make the photo" and open; older ones are thumbnails)
//   3. Make a video          (inside the open photo; its videos show in the same card)
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Body, Button, Field, Notice, Pill, Segmented } from "@/components/ui";
import { EnginePicker } from "@/components/engine-picker";
import { PhotoAvatarMaker } from "@/components/avatar-from-photos";
import { api, ApiError, type Avatar, type AvatarShot, type AvatarStudio, type AvatarVideo, type AvatarVideoStudio, type Product } from "@/lib/api";
import { VideoCard, VideoPanel } from "@/components/avatar-video";
import { account, useMe } from "@/lib/account-store";
import { saveToPhone, shareFile } from "@/lib/media";
import { radius, space, type, useColors } from "@/lib/theme";

type Msg = { text: string; tone: "ok" | "error" | "info" } | null;
type Area = "avatar" | "photo" | "video";
const errText = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);
const busyStatus = (s: string) => s === "queued" || s === "running";

export default function AvatarsScreen() {
  const c = useColors();
  const me = useMe();
  const { width } = useWindowDimensions();
  const scroller = useRef<ScrollView>(null);
  const stepY = useRef<Record<Area, number>>({ avatar: 0, photo: 0, video: 0 });
  const [studio, setStudio] = useState<AvatarStudio | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  // Messages show in the step they belong to, next to what the seller just did.
  // "where" pins a video message to the photo (or portrait) the video belongs to.
  const [note, setNote] = useState<{ at: Area; msg: NonNullable<Msg>; where?: string } | null>(null);
  const say = useCallback((at: Area, where?: string) => (m: Msg) => setNote(m ? { at, msg: m, where } : null), []);
  // Step 1: making an avatar (an original character, your own photo, or a blend of two photos)
  const [making, setMaking] = useState(false);
  const [makeMode, setMakeMode] = useState<"ai" | "photo" | "blend">("ai");
  const [style, setStyle] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [look, setLook] = useState("");
  const [creating, setCreating] = useState(false);
  const [waitingFor, setWaitingFor] = useState<string | null>(null);
  const [outfitOpen, setOutfitOpen] = useState(false);
  const [outfit, setOutfit] = useState("");
  const [dressing, setDressing] = useState(false);   // a new avatar to pick when it's ready
  // Step 2: making a photo
  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [productId, setProductId] = useState<string | null>(null);
  const [pose, setPose] = useState<string | null>("present");
  const [shotEngine, setShotEngine] = useState("standard");
  const [prompt, setPrompt] = useState("");
  const [shooting, setShooting] = useState(false);
  const [shotId, setShotId] = useState<string | null>(null);   // the photo shown in full (step 3 happens there)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  // Step 3: videos (paid with credits)
  const [vstudio, setVstudio] = useState<AvatarVideoStudio | null>(null);
  const [panel, setPanel] = useState<{ key: string; mode: "motion" | "talk"; shotId?: string; avatarId?: string; name: string } | null>(null);
  const vtimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollTo = (at: Area) => setTimeout(() => scroller.current?.scrollTo({ y: Math.max(0, stepY.current[at] - space.md), animated: true }), 50);

  const load = useCallback(() => api.avatars().then((s) => {
    setStudio(s);
    setAvatarId((id) => id ?? s.avatars.find((a) => a.status === "done")?.id ?? null);
  }).catch((e) => setNote({ at: "avatar", msg: { text: errText(e, "Couldn’t load your avatars."), tone: "error" } })), []);
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
    setNote({ at: "video", where: v.shot_id ?? `portrait:${v.avatar_id}`, msg: { text: v.kind === "talk" ? "Making the voice, then the video. Usually 1 to 3 minutes. It appears right here." : `Making your ${v.model_name} video. Usually 1 to 5 minutes. It appears right here.`, tone: "info" } });
  };
  const deleteVideo = async (id: string) => {
    try { await api.deleteAvatarVideo(id); setVstudio((st) => st && ({ ...st, videos: st.videos.filter((v) => v.id !== id) })); }
    catch (e) { say("video")({ text: errText(e, "Couldn’t delete it."), tone: "error" }); }
  };
  const canTalk = (av?: Avatar | null) => !!av && !!vstudio?.talk.styles.includes(av.style);

  // Check avatars and photos that are still being made.
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
      // A new avatar is picked as soon as it's ready, so step 2 is about it.
      const fresh = fa.find((a) => a.status === "done" && a.id === waitingFor) ?? fa.find((a) => a.status === "done");
      if (fresh) {
        setAvatarId((id) => (fresh.id === waitingFor || !id ? fresh.id : id));
        if (fresh.id === waitingFor) { setWaitingFor(null); setNote({ at: "avatar", msg: { text: `${fresh.name} is ready. Step 2 below: put ${fresh.name} in a photo with a product.`, tone: "ok" } }); }
      }
      if (fs.some((x) => x.status === "done")) setNote((n) => (n?.at === "photo" && n.msg.tone === "info" ? { at: "photo", msg: { text: "Your photo is ready. Step 3 is right below it: turn it into a video, or make a post or story.", tone: "ok" } } : n));
      if ([...fa, ...fs].some((x) => x.status === "failed")) account.refresh().catch(() => {});
    }, 4000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [studio, waitingFor]);

  if (!studio) return <View style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center" }}>{note ? <Notice text={note.msg.text} tone="error" /> : <ActivityIndicator color={c.accent} />}</View>;
  if (!studio.enabled) return <View style={{ flex: 1, backgroundColor: c.bg, padding: space.lg }}><Notice text="AI avatars are being switched on. Check back soon." tone="info" /></View>;

  const a = me?.account;
  const left = a ? Math.max(0, a.limits.scene - a.usage.scene) : null;
  const ready = studio.avatars.filter((x) => x.status === "done");
  const chosen = ready.find((x) => x.id === avatarId) ?? null;
  const product = products.find((p) => p.id === productId);
  const full = studio.avatars.filter((x) => x.status !== "failed").length >= studio.max_avatars;
  const showForm = making || !studio.avatars.length;
  const thumb = Math.min(104, (width - space.lg * 2 - space.md * 2 - space.sm * 2) / 3);
  const cardW = Math.min(width - space.lg * 2, 560) - space.md * 2;
  const videos = vstudio?.videos ?? [];
  const chosenShots = chosen ? studio.shots.filter((s) => s.avatar_id === chosen.id) : [];
  const openShot = chosenShots.find((s) => s.id === shotId) ?? chosenShots[0] ?? null;
  const portraitTalks = chosen ? videos.filter((v) => !v.shot_id && v.avatar_id === chosen.id) : [];
  // Videos whose avatar was deleted still show, at the bottom.
  const orphanVideos = videos.filter((v) => !studio.avatars.some((x) => x.id === v.avatar_id));
  const step = !ready.length ? 1 : !chosenShots.some((s) => s.status === "done") ? 2 : 3;

  const madeAvatar = (made: Avatar) => {
    setStudio((s) => s && ({ ...s, avatars: [made, ...s.avatars] }));
    setMaking(false);
    if (made.status === "done") { setAvatarId(made.id); setNote({ at: "avatar", msg: { text: `${made.name} is ready. Step 2 below: put ${made.name} in a photo with a product.`, tone: "ok" } }); }
    else { setWaitingFor(made.id); setNote({ at: "avatar", msg: { text: `Making ${made.name}. It appears here in about ${made.source === "blend" ? 30 : 20} seconds.`, tone: "info" } }); }
    account.refresh().catch(() => {});
    scrollTo("avatar");
  };
  async function createAvatar() {
    if (!style) return;
    setCreating(true); setNote(null);
    try {
      const made = await api.createAvatar({ style, name: name.trim() || undefined, look: look.trim() || undefined });
      setName(""); setLook(""); setStyle(null);
      madeAvatar(made);
    } catch (e) { if (!(e instanceof ApiError && e.upgrade)) say("avatar")({ text: errText(e, "Couldn’t start your avatar."), tone: "error" }); }
    finally { setCreating(false); }
  }
  async function makeShot() {
    if (!chosen || !product) return;
    setShooting(true); setNote(null);
    try {
      const s = await api.avatarShot({ avatar_id: chosen.id, product_id: product.id, pose: pose ?? undefined, prompt: pose ? undefined : prompt.trim(), engine: shotEngine });
      setStudio((st) => st && ({ ...st, shots: [s, ...st.shots] }));
      setShotId(s.id); setPanel(null);
      account.refresh().catch(() => {});
      say("photo")({ text: `Putting ${chosen.name} in a photo with ${product.title}. It appears just below in about 20 seconds.`, tone: "info" });
    } catch (e) { if (!(e instanceof ApiError && e.upgrade)) say("photo")({ text: errText(e, "Couldn’t start the photo."), tone: "error" }); }
    finally { setShooting(false); }
  }
  async function changeOutfit() {
    if (!chosen) return;
    setDressing(true); setNote(null);
    try {
      const made = await api.avatarOutfit(chosen.id, outfit.trim());
      setOutfit(""); setOutfitOpen(false);
      madeAvatar(made);
    } catch (e) { if (!(e instanceof ApiError && e.upgrade)) say("avatar")({ text: errText(e, "Couldn’t change the outfit."), tone: "error" }); }
    finally { setDressing(false); }
  }
  function confirmDelete(av: Avatar) {
    const go = async () => {
      try { await api.deleteAvatar(av.id); setStudio((s) => s && ({ ...s, avatars: s.avatars.filter((x) => x.id !== av.id), shots: s.shots.filter((x) => x.avatar_id !== av.id) })); if (avatarId === av.id) setAvatarId(null); }
      catch (e) { say("avatar")({ text: errText(e, "Couldn’t delete it."), tone: "error" }); }
    };
    const ownPhoto = av.source === "photo" ? " Your uploaded photo is deleted too." : "";
    if (Platform.OS === "web") { if (globalThis.confirm?.(`Delete ${av.name} and its photos here? Posts you already made keep their pictures.${ownPhoto}`)) void go(); return; }
    Alert.alert(`Delete ${av.name}?`, `Its photos are removed from this list. Posts you already made keep their pictures.${ownPhoto}`, [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => void go() }]);
  }
  const noteFor = (at: Area, where?: string) => (note?.at === at && (!where || note.where === where) ? <Notice text={note.msg.text} tone={note.msg.tone} /> : null);
  const videoList = (list: AvatarVideo[], where?: string) => list.map((v) => <VideoCard key={v.id} video={v} width={cardW - space.md * 2} onDelete={deleteVideo} onMsg={say("video", where)} />);

  return (
    <ScrollView ref={scroller} style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: space.lg, gap: space.lg, paddingBottom: space.xxl, maxWidth: 600, width: "100%", alignSelf: "center" }} keyboardShouldPersistTaps="handled">
      <Body muted>{studio.from_photos
        ? "Post without being on camera, or as yourself. Three steps: choose an avatar, put it in a photo with your product, then turn that photo into a video."
        : "Post without being on camera. Three steps: choose an avatar, put it in a photo with your product, then turn that photo into a video."}</Body>
      <View style={{ flexDirection: "row", gap: space.sm, alignItems: "center", flexWrap: "wrap" }}>
        <StepGuide step={step} />
        {vstudio ? (
          <Pressable onPress={() => router.push("/credits")} accessibilityRole="button" accessibilityLabel={vstudio.free ? "Owner: videos are free" : `${vstudio.balance} credits. Top up`}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface }}>
            <Ionicons name="sparkles" size={14} color={c.accent} />
            <Text style={[type.small, { color: c.ink }]}>{vstudio.free ? "Owner: videos are free" : `${vstudio.balance.toLocaleString()} credits`}</Text>
            {vstudio.free ? null : <Text style={[type.small, { color: c.accent }]}>Top up</Text>}
          </Pressable>
        ) : null}
      </View>

      {/* ---------- step 1: choose (or make) your avatar ---------- */}
      <Section n={1} title={studio.avatars.length ? "Choose your avatar" : "Make your avatar"} onLayout={(y) => { stepY.current.avatar = y; }}>
        {studio.avatars.length ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
            {studio.avatars.map((av) => (
              <Pressable key={av.id} disabled={av.status !== "done"} onPress={() => setAvatarId(av.id)} onLongPress={() => confirmDelete(av)}
                accessibilityRole="radio" accessibilityState={{ selected: av.id === avatarId, disabled: av.status !== "done" }} accessibilityLabel={`${av.name}${av.status === "done" ? "" : av.status === "failed" ? ", didn't work" : ", being made"}`}
                style={{ width: thumb, gap: 6 }}>
                <View style={{ width: thumb, aspectRatio: 4 / 5, borderRadius: radius.md, overflow: "hidden", borderWidth: 3, borderColor: av.id === avatarId ? c.accent : "transparent", backgroundColor: c.sunk, alignItems: "center", justifyContent: "center" }}>
                  {av.image_url ? <Image source={{ uri: av.image_url }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                    : av.status === "failed" ? <Ionicons name="alert-circle-outline" size={26} color={c.muted} /> : <ActivityIndicator color={c.accent} />}
                  {av.id === avatarId ? <View style={{ position: "absolute", top: 6, right: 6, backgroundColor: c.accent, borderRadius: 12, padding: 2 }}><Ionicons name="checkmark" size={14} color={c.onAccent} /></View> : null}
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={[type.small, { color: c.ink, flex: 1 }]} numberOfLines={1}>{av.name}</Text>
                  <Pressable onPress={() => confirmDelete(av)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Delete ${av.name}`}><Ionicons name="trash-outline" size={15} color={c.muted} /></Pressable>
                </View>
                {av.status === "failed" ? <Text style={[type.small, { color: c.muted }]} numberOfLines={3}>{av.error}</Text> : busyStatus(av.status) ? <Text style={[type.small, { color: c.muted }]}>Making…</Text> : null}
              </Pressable>
            ))}
            {!showForm && !full ? (
              <Pressable onPress={() => { setMaking(true); setNote(null); }} accessibilityRole="button" accessibilityLabel="Make a new avatar" style={{ width: thumb, gap: 6 }}>
                <View style={{ width: thumb, aspectRatio: 4 / 5, borderRadius: radius.md, borderWidth: 1.5, borderStyle: "dashed", borderColor: c.line, alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Ionicons name="add" size={28} color={c.accent} />
                  <Text style={[type.small, { color: c.ink, textAlign: "center" }]}>New avatar</Text>
                </View>
              </Pressable>
            ) : null}
          </View>
        ) : null}
        {noteFor("avatar")}

        {showForm ? (
          <View style={{ gap: space.sm, borderTopWidth: studio.avatars.length ? 1 : 0, borderColor: c.sunk, paddingTop: studio.avatars.length ? space.md : 0 }}>
            {studio.avatars.length ? (
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={[type.label, { color: c.ink }]}>New avatar</Text>
                <Pressable onPress={() => setMaking(false)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close"><Ionicons name="close" size={20} color={c.muted} /></Pressable>
              </View>
            ) : null}
            {studio.from_photos ? (
              <Segmented value={makeMode} onChange={setMakeMode} options={[{ value: "ai", label: "Character" }, { value: "photo", label: "My photo" }, { value: "blend", label: "Blend two" }]} />
            ) : null}
            {makeMode !== "ai" && studio.from_photos ? (
              <PhotoAvatarMaker key={makeMode} mode={makeMode} studio={studio} full={full} onMsg={say("avatar")} onMade={madeAvatar} />
            ) : (
              <>
                <View style={{ gap: space.sm }}>
                  {studio.styles.map((s) => (
                    <Pressable key={s.id} onPress={() => setStyle(s.id)} accessibilityRole="radio" accessibilityState={{ selected: style === s.id }}
                      style={{ flexDirection: "row", gap: space.md, alignItems: "center", padding: space.md, borderRadius: radius.md, borderWidth: style === s.id ? 2 : 1, borderColor: style === s.id ? c.accent : c.line, backgroundColor: c.bg }}>
                      <Ionicons name={style === s.id ? "radio-button-on" : "radio-button-off"} size={20} color={style === s.id ? c.accent : c.muted} />
                      <View style={{ flex: 1, gap: 2 }}><Text style={[type.label, { color: c.ink }]}>{s.name}</Text><Text style={[type.small, { color: c.muted }]}>{s.blurb}</Text></View>
                    </Pressable>
                  ))}
                </View>
                <Field label="Name (optional)" value={name} onChangeText={setName} maxLength={30} placeholder="Nova" />
                <Field label="Describe the look" hint="Hair, outfit, colors, vibe. Characters are original, so don't base one on a real person." value={look} onChangeText={setLook} maxLength={200} multiline
                  placeholder="lilac hoodie, silver sneakers, calm and confident" />
                <Button label="Make my avatar" icon={<Ionicons name="person-circle-outline" size={18} color={c.onAccent} />} loading={creating} disabled={!style || full} onPress={createAvatar} />
              </>
            )}
          </View>
        ) : null}
        {full && !showForm ? <Text style={[type.small, { color: c.muted }]}>You have {studio.max_avatars} avatars, the most you can keep. Delete one to make another.</Text> : null}

        {/* The same avatar in different clothes (a new avatar; this one stays) */}
        {chosen && !showForm && !full && chosen.style !== "hands" && chosen.style !== "silhouette" ? (
          outfitOpen ? (
            <View style={{ gap: space.sm, borderTopWidth: 1, borderColor: c.sunk, paddingTop: space.md }}>
              <Field label={`New outfit for ${chosen.name}`} hint="Describe the clothes. You get a new avatar with the same face; this one stays." value={outfit} onChangeText={setOutfit} maxLength={240}
                placeholder="a fitted cream blazer over a black silk top, gold necklace" />
              <View style={{ flexDirection: "row", gap: space.sm }}>
                <Button label="Change outfit" style={{ flex: 1 }} loading={dressing} disabled={outfit.trim().length < 3} onPress={changeOutfit} />
                <Button label="Cancel" variant="ghost" onPress={() => setOutfitOpen(false)} />
              </View>
            </View>
          ) : (
            <Button label="New outfit" variant="ghost" icon={<Ionicons name="shirt-outline" size={18} color={c.ink} />} onPress={() => { setOutfitOpen(true); setNote(null); }} />
          )
        ) : null}

        {/* A talking video straight from the avatar's portrait */}
        {chosen && vstudio?.enabled && canTalk(chosen) && !showForm ? (
          panel?.key === `talk:${chosen.id}` ? (
            <VideoPanel studio={vstudio} mode="talk" avatarId={chosen.id} avatarName={chosen.name} onStarted={startedVideo} onClose={() => setPanel(null)} />
          ) : (
            <Button label={`Make ${chosen.name} talk`} variant="secondary" icon={<Ionicons name="mic-outline" size={18} color={c.ink} />} onPress={() => setPanel({ key: `talk:${chosen.id}`, mode: "talk", avatarId: chosen.id, name: chosen.name })} />
          )
        ) : null}
        {chosen ? noteFor("video", `portrait:${chosen.id}`) : null}
        {portraitTalks.length && chosen ? videoList(portraitTalks, `portrait:${chosen.id}`) : null}
      </Section>

      {/* ---------- step 2: put the avatar in a photo; its photos (and step 3) right below ---------- */}
      {chosen ? (
        <Section n={2} title={`Put ${chosen.name} in a photo`} onLayout={(y) => { stepY.current.photo = y; }}>
          {products.length ? (
            <>
              <Text style={[type.small, { color: c.muted }]}>Pick a product{product ? `: ${product.title}` : ""}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
                {products.map((p) => (
                  <Pressable key={p.id} onPress={() => setProductId(p.id)} accessibilityRole="radio" accessibilityState={{ selected: p.id === productId }} accessibilityLabel={p.title}
                    style={{ width: 72, height: 72, borderRadius: radius.md, overflow: "hidden", borderWidth: 3, borderColor: p.id === productId ? c.accent : "transparent", backgroundColor: c.sunk }}>
                    <Image source={{ uri: p.image_url! }} style={{ flex: 1 }} contentFit="cover" />
                  </Pressable>
                ))}
              </ScrollView>
            </>
          ) : <Notice text="Add a product with a photo first." tone="info" />}
          <Text style={[type.small, { color: c.muted }]}>Pick a pose</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
            {studio.poses.map((p) => <Chip key={p.id} label={p.name} on={pose === p.id} onPress={() => setPose(pose === p.id ? null : p.id)} />)}
          </View>
          {!pose ? <Field label="Or describe the shot" value={prompt} onChangeText={setPrompt} maxLength={200} placeholder="sitting on a beach towel, putting the sunscreen in a tote bag" /> : null}
          <EnginePicker engines={studio.engines} value={shotEngine} onChange={setShotEngine} />
          <Button label="Make the photo" icon={<Ionicons name="sparkles" size={18} color={c.onAccent} />} loading={shooting}
            disabled={!product || (!pose && prompt.trim().length < 3)} onPress={makeShot} />
          {left != null && shotEngine === "standard" ? <Text style={[type.small, { color: c.muted }]}>Avatars and photos use your AI photo allowance: {left} left{a?.plan === "free" ? "" : " this month"}.</Text> : null}
          {noteFor("photo")}

          {chosenShots.length && openShot ? (
            <View style={{ gap: space.md, borderTopWidth: 1, borderColor: c.sunk, paddingTop: space.md }}>
              <Text style={[type.label, { color: c.ink }]}>Photos of {chosen.name} ({chosenShots.length})</Text>
              {chosenShots.length > 1 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
                  {chosenShots.map((s, i) => {
                    const count = videos.filter((v) => v.shot_id === s.id).length;
                    const on = s.id === openShot.id;
                    return (
                      <Pressable key={s.id} onPress={() => { setShotId(s.id); setPanel(null); }} accessibilityRole="radio" accessibilityState={{ selected: on }}
                        accessibilityLabel={`Photo ${chosenShots.length - i}${count ? `, ${count} video${count > 1 ? "s" : ""}` : ""}${busyStatus(s.status) ? ", being made" : s.status === "failed" ? ", didn't work" : ""}`}
                        style={{ width: 64, aspectRatio: 4 / 5, borderRadius: radius.md, overflow: "hidden", borderWidth: 3, borderColor: on ? c.accent : "transparent", backgroundColor: c.sunk, alignItems: "center", justifyContent: "center" }}>
                        {s.image_url ? <Image source={{ uri: s.image_url }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                          : s.status === "failed" ? <Ionicons name="alert-circle-outline" size={20} color={c.muted} /> : <ActivityIndicator color={c.accent} />}
                        {count ? <View style={{ position: "absolute", bottom: 4, right: 4, flexDirection: "row", alignItems: "center", gap: 2, backgroundColor: "rgba(0,0,0,0.65)", borderRadius: 8, paddingHorizontal: 4, paddingVertical: 1 }}>
                          <Ionicons name="film" size={10} color="#fff" /><Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>{count}</Text></View> : null}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              ) : null}
              {(() => {
                const s = openShot;
                const open = panel?.shotId === s.id ? panel : null;
                const own = videos.filter((v) => v.shot_id === s.id);
                return (
                  <ShotCard key={s.id} shot={s} avatar={chosen} width={cardW - space.md * 2} onMsg={say("photo")}>
                    {vstudio?.enabled && s.status === "done" ? (
                      <View style={{ gap: space.sm, borderTopWidth: 1, borderColor: c.sunk, paddingTop: space.md }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                          <StepBadge n={3} />
                          <Text style={[type.label, { color: c.ink }]}>Turn this photo into a video</Text>
                        </View>
                        {open ? <VideoPanel studio={vstudio} mode={open.mode} shotId={s.id} avatarName={chosen.name} onStarted={startedVideo} onClose={() => setPanel(null)} /> : (
                          <View style={{ flexDirection: "row", gap: space.sm }}>
                            <Button label="Make a video" variant="secondary" style={{ flex: 1 }} icon={<Ionicons name="film-outline" size={18} color={c.ink} />} onPress={() => { setPanel({ key: `motion:${s.id}`, mode: "motion", shotId: s.id, name: chosen.name }); setNote(null); }} />
                            {canTalk(chosen) ? <Button label="Make it talk" variant="secondary" style={{ flex: 1 }} icon={<Ionicons name="mic-outline" size={18} color={c.ink} />} onPress={() => { setPanel({ key: `talk:${s.id}`, mode: "talk", shotId: s.id, name: chosen.name }); setNote(null); }} /> : null}
                          </View>
                        )}
                        {noteFor("video", s.id)}
                        {own.length ? <Text style={[type.small, { color: c.muted }]}>Videos from this photo ({own.length})</Text> : null}
                        {videoList(own, s.id)}
                      </View>
                    ) : null}
                  </ShotCard>
                );
              })()}
            </View>
          ) : (
            <Text style={[type.small, { color: c.muted }]}>Your photos of {chosen.name} appear here. Then you can turn each one into a video.</Text>
          )}
        </Section>
      ) : null}

      {orphanVideos.length ? (
        <View style={{ gap: space.md }}>
          <Text style={[type.label, { color: c.ink }]}>Videos from deleted avatars</Text>
          {noteFor("video", "orphans")}
          {videoList(orphanVideos, "orphans")}
        </View>
      ) : null}

      <View style={{ flexDirection: "row", gap: space.sm, alignItems: "flex-start", backgroundColor: c.surface, borderColor: c.line, borderWidth: 1, borderRadius: radius.md, padding: space.md }}>
        <Ionicons name="information-circle-outline" size={18} color={c.accent} />
        <Text style={[type.small, { color: c.ink, flex: 1 }]}>Check each photo before you post: AI can change small details on a product. Instagram and TikTok ask you to label AI-made images, so turn on the AI label when you post.</Text>
      </View>
    </ScrollView>
  );
}

/** "1 Avatar → 2 Photo → 3 Video", with the step the seller is on highlighted. */
function StepGuide({ step }: { step: number }) {
  const c = useColors();
  const steps = ["Avatar", "Photo", "Video"];
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }} accessibilityLabel={`Step ${step} of 3`}>
      {steps.map((label, i) => (
        <React.Fragment key={label}>
          {i ? <Ionicons name="chevron-forward" size={12} color={c.muted} /> : null}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5, opacity: i + 1 <= step ? 1 : 0.55 }}>
            <StepBadge n={i + 1} on={i + 1 === step} done={i + 1 < step} />
            <Text style={[type.small, { color: c.ink, fontWeight: i + 1 === step ? "700" : "400" }]}>{label}</Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}
function StepBadge({ n, on = true, done = false }: { n: number; on?: boolean; done?: boolean }) {
  const c = useColors();
  return (
    <View style={{ width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: on || done ? c.accent : c.sunk }}>
      {done ? <Ionicons name="checkmark" size={13} color={c.onAccent} /> : <Text style={{ color: on ? c.onAccent : c.ink, fontSize: 12, fontWeight: "700" }}>{n}</Text>}
    </View>
  );
}
function Section({ n, title, children, onLayout }: { n: number; title: string; children: React.ReactNode; onLayout?: (y: number) => void }) {
  const c = useColors();
  return (
    <View onLayout={onLayout ? (e) => onLayout(e.nativeEvent.layout.y) : undefined}
      style={{ gap: space.md, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, padding: space.md }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
        <StepBadge n={n} />
        <Text style={[type.heading, { color: c.ink, flex: 1 }]}>{title}</Text>
      </View>
      {children}
    </View>
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

function ShotCard({ shot, avatar, width, onMsg, children }: { shot: AvatarShot; avatar?: Avatar; width: number; onMsg: (m: Msg) => void; children?: React.ReactNode }) {
  const c = useColors();
  const [saving, setSaving] = useState(false);
  const post = (format: "post" | "story") => router.push({ pathname: "/marketing", params: { product_id: shot.product_id ?? undefined, image_url: shot.image_url ?? undefined, format } });
  return (
    <View style={{ backgroundColor: c.bg, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, padding: space.md, gap: space.md }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={[type.label, { color: c.ink }]}>{avatar?.name ?? "Avatar"} photo</Text>
        <Pill text={shot.status === "done" ? "Ready" : shot.status === "failed" ? "Didn’t work" : "Making…"} tone={shot.status === "done" ? "good" : "neutral"} />
      </View>
      {busyStatus(shot.status) ? <View style={{ alignItems: "center", gap: 6, paddingVertical: space.md }}><ActivityIndicator color={c.accent} /><Text style={[type.small, { color: c.muted }]}>About 20 seconds…</Text></View> : null}
      {shot.status === "failed" ? <Text style={[type.small, { color: c.muted }]}>{shot.error} It didn’t count against your plan.</Text> : null}
      {shot.status === "done" && shot.image_url ? (
        <>
          <Image source={{ uri: shot.image_url }} style={{ width, aspectRatio: 4 / 5, borderRadius: radius.md }} contentFit="cover" accessibilityLabel={`${avatar?.name ?? "Avatar"} with your product`} />
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
          {children}
        </>
      ) : null}
    </View>
  );
}

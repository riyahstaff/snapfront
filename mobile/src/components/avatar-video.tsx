// Avatar videos, paid with credits: the panel that sets one up (model, length, quality, motion or
// script and voice) with its price in credits, and the card that plays a finished video.
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { Ionicons } from "@expo/vector-icons";
import { Button, Field, Notice, Pill } from "@/components/ui";
import { Toggle } from "@/components/panel";
import { api, ApiError, type AvatarVideo, type AvatarVideoStudio, type VideoVoice } from "@/lib/api";
import { saveToPhone, shareFile } from "@/lib/media";
import { radius, space, type, useColors } from "@/lib/theme";

type Msg = { text: string; tone: "ok" | "error" | "info" } | null;
const errText = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);

function Chip({ label, on, onPress, sub }: { label: string; on: boolean; onPress: () => void; sub?: string }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected: on }}
      style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill, borderWidth: on ? 2 : 1, borderColor: on ? c.accent : c.line, backgroundColor: c.bg }}>
      <Text style={[type.label, { color: c.ink }]}>{label}{sub ? <Text style={[type.small, { color: c.muted }]}>  {sub}</Text> : null}</Text>
    </Pressable>
  );
}

/** Set up a video from an avatar photo (mode "motion") or make the avatar talk (mode "talk"). */
export function VideoPanel({ studio, mode, shotId, avatarId, avatarName, onStarted, onClose }: {
  studio: AvatarVideoStudio; mode: "motion" | "talk"; shotId?: string; avatarId?: string; avatarName: string;
  onStarted: (v: AvatarVideo, balance: number) => void; onClose: () => void;
}) {
  const c = useColors();
  const [modelId, setModelId] = useState(studio.models[0]?.id ?? "vidu");
  const [voiceover, setVoiceover] = useState("");
  const model = studio.models.find((m) => m.id === modelId) ?? studio.models[0];
  const [duration, setDuration] = useState(model?.durations[0] ?? 5);
  const [resolution, setResolution] = useState(mode === "talk" ? "720p" : model?.resolutions[0] ?? "720p");
  const [sound, setSound] = useState(model?.sound_default ?? true);
  const [motion, setMotion] = useState<string | null>(studio.motions[0]?.id ?? null);
  const [prompt, setPrompt] = useState("");
  const [script, setScript] = useState("");
  const [voice, setVoice] = useState(studio.talk.voices[0]?.id ?? "af_heart");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  const pickModel = (id: string) => {
    const m = studio.models.find((x) => x.id === id)!;
    setModelId(m.id as typeof modelId);
    if (!m.durations.includes(duration)) setDuration(m.durations[0]);
    if (!m.resolutions.includes(resolution)) setResolution(m.resolutions[0]);
    setSound(m.sound_default ?? true);
  };
  const base = mode === "talk" ? studio.talk.prices[resolution] : model?.prices[`${duration}|${resolution}`];
  // A premium (ElevenLabs) voice adds credits by script length, priced exactly like the server.
  const spoken = (mode === "talk" ? script : voiceover).trim();
  const pv = studio.premium_voice;
  const premiumChosen = !!spoken && voice.startsWith("el:") && !!pv;
  const extra = premiumChosen && pv ? Math.max(pv.min, Math.ceil(((spoken.length || 1) / 1000) * pv.per_1k_chars / pv.step) * pv.step) : 0;
  const price = base != null ? base + extra : undefined;
  const short = !studio.free && price != null && studio.balance < price;
  const voMax = Math.max(40, Math.floor(duration * (studio.voiceover?.chars_per_second ?? 15)));
  const ready = mode === "talk" ? script.trim().length >= 8 : (!!motion || prompt.trim().length >= 3) && (voiceover.trim().length === 0 || voiceover.trim().length >= 4);

  async function go() {
    setBusy(true); setMsg(null);
    try {
      const v = await api.startAvatarVideo(mode === "talk"
        ? { kind: "talk", shot_id: shotId, avatar_id: shotId ? undefined : avatarId, script: script.trim(), voice, resolution }
        : { kind: "motion", shot_id: shotId, model: model.id, duration, resolution, sound, motion: motion ?? undefined, prompt: motion ? undefined : prompt.trim(),
          voiceover: voiceover.trim().slice(0, voMax) || undefined, voice: voiceover.trim() ? voice : undefined });
      onStarted(v, studio.free ? studio.balance : studio.balance - v.credits);
    } catch (e) {
      if (e instanceof ApiError && e.credits) setMsg({ text: `This needs ${e.credits.need} credits and you have ${e.credits.balance}.`, tone: "error" });
      else setMsg({ text: errText(e, "Couldn’t start the video."), tone: "error" });
    } finally { setBusy(false); }
  }

  return (
    <View style={{ gap: space.md, borderTopWidth: 1, borderColor: c.sunk, paddingTop: space.md }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={[type.heading, { color: c.ink }]}>{mode === "talk" ? `Make ${avatarName} talk` : "Make it a video"}</Text>
        <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close"><Ionicons name="close" size={20} color={c.muted} /></Pressable>
      </View>

      {mode === "motion" ? (
        <>
          <View style={{ gap: space.sm }}>
            {studio.models.map((m) => (
              <Pressable key={m.id} onPress={() => pickModel(m.id)} accessibilityRole="radio" accessibilityState={{ selected: m.id === modelId }}
                style={{ flexDirection: "row", gap: space.md, alignItems: "flex-start", padding: space.md, borderRadius: radius.md, borderWidth: m.id === modelId ? 2 : 1, borderColor: m.id === modelId ? c.accent : c.line, backgroundColor: c.bg }}>
                <Ionicons name={m.id === modelId ? "radio-button-on" : "radio-button-off"} size={20} color={m.id === modelId ? c.accent : c.muted} style={{ marginTop: 2 }} />
                <View style={{ flex: 1, gap: 3 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}><Text style={[type.label, { color: c.ink }]}>{m.name}</Text><Pill text={m.badge} tone="good" /></View>
                  <Text style={[type.small, { color: c.muted }]}>{m.blurb}</Text>
                  <Text style={[type.small, { color: c.ink }]}>From {Math.min(...Object.values(m.prices))} credits</Text>
                </View>
              </Pressable>
            ))}
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
            {model.durations.map((d) => <Chip key={d} label={`${d} sec`} on={d === duration} onPress={() => setDuration(d)} />)}
            {model.resolutions.length > 1 ? model.resolutions.map((r) => <Chip key={r} label={r} on={r === resolution} onPress={() => setResolution(r)} />) : null}
          </View>
          {model.sound === "optional" ? <Toggle label="Background music" sub="Made for the clip by the AI" value={sound} onChange={setSound} /> : null}
          {model.sound === "strip" ? <Toggle label={`Keep ${model.name}'s own sound`} sub="It often adds music or singing, so it's off unless you want it." value={sound} onChange={setSound} /> : null}
          {model.sound === "always" ? <Text style={[type.small, { color: c.muted }]}>{model.name} adds its own sound.</Text> : null}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
            {studio.motions.map((m) => <Chip key={m.id} label={m.name} on={motion === m.id} onPress={() => setMotion(motion === m.id ? null : m.id)} />)}
          </View>
          {!motion ? <Field label="Or describe what happens" value={prompt} onChangeText={setPrompt} maxLength={300} multiline placeholder="he spins around and holds the phone up to the camera" /> : null}
          <Field label="Voiceover (optional)" hint={`The models don't speak, so this is how words get into the video: an AI voice reads it over the top. Up to ${voMax} characters for ${duration} seconds. To make the avatar's lips move, use Make it talk.`}
            value={voiceover} onChangeText={setVoiceover} maxLength={voMax} multiline placeholder="Plan your week in two minutes. Link in bio." />
          <Text style={[type.label, { color: c.ink }]}>Voiceover voice</Text>
          <VoicePicker voices={studio.voiceover?.voices ?? studio.talk.voices} value={voice} onChange={setVoice} premiumName={pv?.name} />
          {!voiceover.trim() && voice.startsWith("el:") ? <Text style={[type.small, { color: c.muted }]}>Write a voiceover above to hear this voice. No voiceover, no extra credits.</Text> : null}
        </>
      ) : (
        <>
          <Field label="What should they say?" hint={`Up to ${studio.talk.max_chars} characters, about 30 seconds.`} value={script} onChangeText={setScript} maxLength={studio.talk.max_chars} multiline
            placeholder="Hey! This is the serum I use every single morning. Link's in my bio." />
          <Text style={[type.label, { color: c.ink }]}>Voice</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
            <VoicePicker voices={studio.talk.voices} value={voice} onChange={setVoice} premiumName={pv?.name} />
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
            {studio.talk.resolutions.map((r) => <Chip key={r} label={r} sub={`${studio.talk.prices[r]} cr`} on={r === resolution} onPress={() => setResolution(r)} />)}
          </View>
        </>
      )}

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.md, flexWrap: "wrap" }}>
        <Text style={[type.body, { color: c.ink }]}><Text style={{ fontWeight: "700" }}>{price ?? "–"} credits</Text>{extra ? <Text style={{ color: c.muted }}>{`  (includes ${extra} for the premium voice)`}</Text> : null}<Text style={{ color: c.muted }}>{studio.free ? "  ·  free for you (owner account)" : `  ·  you have ${studio.balance.toLocaleString()}`}</Text></Text>
      </View>
      <Notice text={msg?.text ?? null} tone={msg?.tone} />
      {short ? (
        <Button label="Top up credits" variant="flash" icon={<Ionicons name="add-circle-outline" size={18} color={c.onFlash} />} onPress={() => router.push("/credits")} />
      ) : (
        <Button label={`${mode === "talk" ? "Make it talk" : "Make the video"} · ${studio.free ? "free" : `${price} credits`}`} icon={<Ionicons name="film-outline" size={18} color={c.onAccent} />} loading={busy} disabled={!ready} onPress={go} />
      )}
      <Text style={[type.small, { color: c.muted }]}>If a video fails, its credits come straight back.</Text>
    </View>
  );
}

/** Free voices first, then premium ones (ElevenLabs, extra credits), in their own labelled group. */
function VoicePicker({ voices, value, onChange, premiumName }: { voices: VideoVoice[]; value: string; onChange: (id: string) => void; premiumName?: string }) {
  const c = useColors();
  const free = voices.filter((v) => !v.premium), premium = voices.filter((v) => v.premium);
  const chip = (v: VideoVoice) => <Chip key={v.id} label={v.name} sub={v.premium ? [v.accent, v.gender].filter(Boolean).join(" ") || undefined : v.accent === "British" ? "UK" : undefined} on={value === v.id} onPress={() => onChange(v.id)} />;
  return (
    <View style={{ gap: space.sm }}>
      <Text style={[type.small, { color: c.muted }]}>Free voices</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>{free.map(chip)}</View>
      {premium.length ? (
        <>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="star" size={13} color={c.accent} />
            <Text style={[type.small, { color: c.ink }]}>Premium voices{premiumName ? ` by ${premiumName}` : ""} · a few extra credits</Text>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>{premium.map(chip)}</View>
        </>
      ) : null}
    </View>
  );
}

/** A finished (or in-progress) avatar video. */
export function VideoCard({ video, width, onDelete, onMsg }: { video: AvatarVideo; width: number; onDelete: (id: string) => void; onMsg: (m: Msg) => void }) {
  const c = useColors();
  const [saving, setSaving] = useState(false);
  const label = video.kind === "talk" ? `Talking avatar${video.premium_voice ? " · premium voice" : ""}` : `${video.model_name} · ${video.duration}s ${video.resolution}${video.voiceover ? (video.premium_voice ? " · premium voiceover" : " · voiceover") : ""}`;
  return (
    <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, padding: space.md, gap: space.md }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <Text style={[type.label, { color: c.ink, flex: 1 }]} numberOfLines={1}>{label}</Text>
        <Pill text={video.status === "done" ? "Ready" : video.status === "failed" ? "Didn’t work" : "Making…"} tone={video.status === "done" ? "good" : "neutral"} />
      </View>
      {video.status === "queued" || video.status === "running" ? (
        <View style={{ flexDirection: "row", gap: space.sm, alignItems: "center" }}><ActivityIndicator color={c.accent} /><Text style={[type.small, { color: c.muted }]}>{video.stage === "voice" ? "Adding your voiceover…" : "Usually 1 to 5 minutes. You can leave this screen."}</Text></View>
      ) : null}
      {video.status === "failed" ? <Text style={[type.small, { color: c.muted }]}>{video.error}</Text> : null}
      {video.status === "done" && video.note ? <Text style={[type.small, { color: c.muted }]}>{video.note}</Text> : null}
      {video.status === "done" && video.url ? (
        <>
          <Clip url={video.url} width={Math.min(width, 360)} />
          <View style={{ flexDirection: "row", gap: space.sm }}>
            <Button label="Save" variant="secondary" style={{ flex: 1 }} loading={saving} onPress={async () => {
              setSaving(true);
              try { onMsg((await saveToPhone([video.url!])) ? { text: "Saved to your phone.", tone: "ok" } : { text: "Allow photo access in Settings to save.", tone: "error" }); }
              finally { setSaving(false); }
            }} />
            <Button label="Share" variant="secondary" style={{ flex: 1 }} onPress={() => shareFile(video.url!).catch(() => {})} />
          </View>
          <Button label="Post to YouTube Shorts" icon={<Ionicons name="logo-youtube" size={18} color={c.onAccent} />} onPress={() => router.push(`/youtube?source=avatar&id=${encodeURIComponent(video.id)}`)} />
        </>
      ) : null}
      {video.status === "done" || video.status === "failed" ? (
        <Pressable onPress={() => onDelete(video.id)} accessibilityRole="button" style={{ alignSelf: "flex-start" }}><Text style={[type.small, { color: c.muted }]}>Delete</Text></Pressable>
      ) : null}
    </View>
  );
}
function Clip({ url, width }: { url: string; width: number }) {
  const player = useVideoPlayer(url, (p) => { p.loop = true; p.muted = true; p.play(); });
  const style = useMemo(() => ({ width, height: (width * 16) / 9, borderRadius: radius.md, alignSelf: "center" as const, backgroundColor: "#000" }), [width]);
  return <VideoView player={player} style={style} contentFit="contain" nativeControls />;
}

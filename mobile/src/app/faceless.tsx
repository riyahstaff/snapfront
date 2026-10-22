// Faceless videos: pick a product and a style, let the AI write the script (edit it if you like),
// choose a voice, and Snapfront makes a vertical video with your photos, captions and voiceover.
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import * as Clipboard from "expo-clipboard";
import { Button, Field, Notice, Pill, PageScroll } from "@/components/ui";
import { Card, ChipRow, TextAction, when } from "@/components/panel";
import { api, ApiError, facelessApi, type FacelessJob, type FacelessScript, type Product } from "@/lib/api";
import { saveToPhone, shareFile } from "@/lib/media";
import { radius, space, type, useColors } from "@/lib/theme";

const errText = (e: unknown, f: string) => (e instanceof ApiError ? e.message : f);

export default function FacelessScreen() {
  const c = useColors();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [voices, setVoices] = useState<{ id: string; name: string; accent: string }[]>([]);
  const [styles, setStyles] = useState<{ id: string; name: string }[]>([]);
  const [jobs, setJobs] = useState<FacelessJob[]>([]);
  const [product, setProduct] = useState("");
  const [style, setStyle] = useState("reasons");
  const [voice, setVoice] = useState("af_heart");
  const [script, setScript] = useState<FacelessScript | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; tone: "ok" | "error" } | null>(null);

  const load = useCallback(() => {
    facelessApi.list().then((r) => { setVoices(r.voices); setStyles(r.styles); setJobs(r.jobs); }).catch(() => {});
  }, []);
  useFocusEffect(useCallback(() => {
    load();
    api.products().then((p) => { const live = p.filter((x) => x.status === "live" || x.image_url); setProducts(live); setProduct((cur) => cur || live[0]?.id || ""); }).catch(() => setProducts([]));
  }, [load]));
  // Check back while a video is being made.
  useEffect(() => {
    if (!jobs.some((j) => j.status === "queued" || j.status === "working")) return;
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [jobs, load]);

  async function write() {
    setBusy("script"); setMsg(null);
    try { setScript(await facelessApi.script(product, style)); } catch (e) { setMsg({ text: errText(e, "Couldn't write the script."), tone: "error" }); } finally { setBusy(null); }
  }
  async function make() {
    if (!script) return;
    setBusy("make"); setMsg(null);
    try {
      const { product_id, style: _s, ...rest } = script;
      const j = await facelessApi.make({ product_id, voice, script: rest });
      setJobs((x) => [j, ...x]);
      setMsg({ text: "Making your video. It takes a minute or two; it'll appear below.", tone: "ok" });
    } catch (e) { setMsg({ text: errText(e, "Couldn't start the video."), tone: "error" }); } finally { setBusy(null); }
  }
  const setScene = (i: number, patch: Partial<FacelessScript["scenes"][number]>) => setScript((s) => (s ? { ...s, scenes: s.scenes.map((x, k) => (k === i ? { ...x, ...patch } : x)) } : s));

  if (!products) return <View style={{ flex: 1, backgroundColor: c.bg, padding: space.xl }}><ActivityIndicator color={c.accent} /></View>;
  return (
    <PageScroll style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ padding: space.xl, gap: space.xl, paddingBottom: 64 }} keyboardShouldPersistTaps="handled">
      <Text style={[type.body, { color: c.muted }]}>Grow without showing your face: your product photos, big captions and a natural voiceover, ready for TikTok, Reels and Shorts.</Text>
      {!products.length ? (
        <Card title="Add a product first"><Text style={[type.body, { color: c.muted }]}>Faceless videos use your product photos.</Text><Button label="Snap a product" onPress={() => router.push("/snap")} /></Card>
      ) : (
        <Card title="1. Pick a product and a style">
          <ChipRow label="Product" value={product} onChange={(v) => { setProduct(v); setScript(null); }} options={products.map((p) => ({ value: p.id, label: p.title }))} />
          <ChipRow label="Style" value={style} onChange={(v) => { setStyle(v); setScript(null); }} options={styles.map((s) => ({ value: s.id, label: s.name }))} />
          <Button label={script ? "Write a new script" : "Write the script"} loading={busy === "script"} disabled={Boolean(busy) || !product} onPress={write} />
        </Card>
      )}
      <Notice text={msg?.text ?? null} tone={msg?.tone} />
      {script ? (
        <Card title="2. Check the script" sub="Edit any line. The first scene is the hook.">
          {script.scenes.map((sc, i) => (
            <View key={i} style={{ gap: 8, padding: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: c.line, backgroundColor: c.bg }}>
              <Text style={[type.label, { color: c.muted }]}>Scene {i + 1}</Text>
              <Field label="Words on screen" value={sc.text} onChangeText={(v) => setScene(i, { text: v })} maxLength={45} />
              <Field label="Voiceover" value={sc.say} onChangeText={(v) => setScene(i, { say: v })} multiline maxLength={160} style={{ minHeight: 70 }} />
            </View>
          ))}
          <Field label="Last screen" value={script.cta} onChangeText={(v) => setScript({ ...script, cta: v })} maxLength={40} />
          <ChipRow label="Voice" value={voice} onChange={setVoice} options={voices.map((v) => ({ value: v.id, label: `${v.name} (${v.accent})` }))} />
          <Button label="3. Make the video" loading={busy === "make"} disabled={Boolean(busy)} onPress={make} />
          {script.caption ? (
            <Pressable onPress={async () => { await Clipboard.setStringAsync(`${script.caption}\n\n${script.hashtags.map((h) => `#${h}`).join(" ")}`); setMsg({ text: "Caption copied.", tone: "ok" }); }} accessibilityRole="button">
              <Text style={[type.small, { color: c.muted }]}>Caption (tap to copy): {script.caption} {script.hashtags.map((h) => `#${h}`).join(" ")}</Text>
            </Pressable>
          ) : null}
        </Card>
      ) : null}
      {jobs.length ? <Text accessibilityRole="header" style={[type.title, { color: c.ink, fontSize: 21 }]}>Your videos</Text> : null}
      {jobs.map((j) => <JobCard key={j.id} job={j} onRemoved={load} onMsg={setMsg} />)}
    </PageScroll>
  );
}

function JobCard({ job, onRemoved, onMsg }: { job: FacelessJob; onRemoved: () => void; onMsg: (m: { text: string; tone: "ok" | "error" }) => void }) {
  const c = useColors();
  return (
    <Card>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: space.md }}>
        <Text style={[type.heading, { color: c.ink, flex: 1 }]} numberOfLines={2}>{job.script.scenes[0]?.text || job.script.hook || "Faceless video"}</Text>
        <Pill text={{ queued: "Waiting", working: "Making it", done: `${job.seconds ?? ""}s`, failed: "Didn't work" }[job.status]} tone={job.status === "done" ? "good" : "neutral"} />
      </View>
      {job.status === "done" && job.url ? <Preview url={job.url} /> : job.status === "failed" ? <Text style={[type.small, { color: c.bad }]}>{job.error}</Text> : <ActivityIndicator color={c.accent} />}
      <View style={{ flexDirection: "row", gap: space.xl, flexWrap: "wrap", alignItems: "center" }}>
        <Text style={[type.small, { color: c.muted }]}>{when(job.created_at)}</Text>
        {job.status === "done" && job.download_url ? <>
          <TextAction label="Save" onPress={async () => { try { await saveToPhone([job.download_url!]); onMsg({ text: "Saved.", tone: "ok" }); } catch { onMsg({ text: "Couldn't save the video.", tone: "error" }); } }} />
          <TextAction label="Share" onPress={() => shareFile(job.url!).catch(() => {})} />
          <TextAction label="Post to YouTube" onPress={() => router.push(`/youtube?source=faceless&id=${encodeURIComponent(job.id)}`)} />
        </> : null}
        {job.status !== "working" ? <TextAction label="Delete" tone="bad" onPress={() => Alert.alert("Delete this video?", undefined, [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: async () => { await facelessApi.remove(job.id).catch(() => {}); onRemoved(); } }])} /> : null}
      </View>
    </Card>
  );
}
function Preview({ url }: { url: string }) {
  const player = useVideoPlayer(url, (p) => { p.loop = true; });
  return (
    <View style={{ width: 220, aspectRatio: 9 / 16, borderRadius: radius.md, overflow: "hidden", backgroundColor: "#000", alignSelf: "center" }}>
      <VideoView player={player} style={{ width: "100%", height: "100%" }} contentFit="cover" nativeControls />
    </View>
  );
}

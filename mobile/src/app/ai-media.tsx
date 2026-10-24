import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { Ionicons } from "@expo/vector-icons";
import { Body, Button, Field, H2, Notice, Pill, Segmented, PageScroll } from "@/components/ui";
import { EnginePicker } from "@/components/engine-picker";
import { api, ApiError, type AiJob, type AiPresets, type Product } from "@/lib/api";
import { account, useMe } from "@/lib/account-store";
import { saveToPhone, shareFile } from "@/lib/media";
import { radius, space, type, useColors } from "@/lib/theme";

type Msg = { text: string; tone: "ok" | "error" | "info" } | null;
const errText = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);

/** AI lifestyle photos (people and places with the product) and short AI video clips. */
export default function AiMediaScreen() {
  const c = useColors();
  const me = useMe();
  const [presets, setPresets] = useState<AiPresets | null>(null);
  const [jobs, setJobs] = useState<AiJob[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState<string | null>(null);
  const [mode, setMode] = useState<"scene" | "video">("scene");
  const [preset, setPreset] = useState<string | null>(null);
  const [engine, setEngine] = useState("standard");
  const [videoProvider, setVideoProvider] = useState("runpod");
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(() => api.aiMedia().then(({ jobs: j, ...p }) => { setPresets(p); setJobs(j); }).catch((e) => setMsg({ text: errText(e, "Couldn’t load."), tone: "error" })), []);
  useEffect(() => {
    load();
    api.products().then((list) => { const w = list.filter((p) => p.image_file); setProducts(w); setProductId((x) => x ?? w[0]?.id ?? null); }).catch(() => {});
  }, [load]);
  // Check running jobs every few seconds.
  useEffect(() => {
    const running = jobs.filter((j) => j.status === "running" || j.status === "queued");
    if (timer.current) clearInterval(timer.current);
    if (!running.length) return;
    timer.current = setInterval(async () => {
      const fresh = await Promise.all(running.map((j) => api.aiJob(j.id).catch(() => j)));
      setJobs((all) => all.map((j) => fresh.find((f) => f.id === j.id) ?? j));
      if (fresh.some((f) => f.status === "failed")) account.refresh().catch(() => {});
    }, 4000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [jobs]);

  const product = products.find((p) => p.id === productId);
  async function start() {
    if (!product?.image_file) return;
    setBusy(true); setMsg(null);
    try {
      const job = await api.startAiMedia({ kind: mode, image_file: product.image_file, preset: preset ?? undefined, prompt: preset ? undefined : prompt.trim(), engine: mode === "scene" ? engine : undefined, video_provider: mode === "video" ? videoProvider : undefined });
      setJobs((j) => [job, ...j]);
      account.refresh().catch(() => {});
      setMsg({ text: mode === "video" ? "Making your clip. It takes a minute or two." : "Making your photo. It takes about 20 seconds.", tone: "info" });
    } catch (e) { if (!(e instanceof ApiError && e.upgrade)) setMsg({ text: errText(e, "Couldn’t start."), tone: "error" }); }
    finally { setBusy(false); }
  }

  if (!presets) return <View style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={c.accent} /></View>;
  if (!presets.enabled) return <View style={{ flex: 1, backgroundColor: c.bg, padding: space.lg }}><Notice text="AI photos and video are being switched on. Check back soon." tone="info" /></View>;
  const list = mode === "video" ? presets.motions : presets.scenes;
  const a = me?.account;
  const left = a ? Math.max(0, a.limits[mode] - a.usage[mode]) : null;
  const videoLocked = mode === "video" && a?.plan !== "pro";
  return (
    <PageScroll style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: space.lg, paddingHorizontal: space.xl, gap: space.lg, paddingBottom: space.xxl }} keyboardShouldPersistTaps="handled">
      <Segmented value={mode} onChange={(v) => { setMode(v); setPreset(null); }} options={[{ value: "scene", label: "Lifestyle photo" }, { value: "video", label: "Video clip" }]} />
      <Body muted>{mode === "scene"
        ? "Put your product in a real-life scene, with people if you like: a mirror routine, in someone’s hand, on a café table."
        : "Turn a product photo into a 5-second moving clip for Reels and TikTok."}</Body>

      {products.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
          {products.map((p) => (
            <Pressable key={p.id} onPress={() => setProductId(p.id)} accessibilityRole="button" accessibilityState={{ selected: p.id === productId }} accessibilityLabel={p.title}
              style={{ width: 84, height: 84, borderRadius: radius.md, overflow: "hidden", borderWidth: 3, borderColor: p.id === productId ? c.accent : "transparent", backgroundColor: c.sunk }}>
              <Image source={{ uri: p.image_url! }} style={{ flex: 1 }} contentFit="cover" />
            </Pressable>
          ))}
        </ScrollView>
      ) : <Notice text="Add a product with a photo first." tone="info" />}

      <View style={{ gap: space.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
          <H2>{mode === "video" ? "Motion" : "Scene"}</H2>
          {mode === "video" ? <Pill text="Pro" tone="flash" /> : null}
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
          {list.map((p) => (
            <Pressable key={p.id} onPress={() => setPreset(preset === p.id ? null : p.id)} accessibilityRole="radio" accessibilityState={{ selected: preset === p.id }}
              style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.pill, borderWidth: preset === p.id ? 2 : 1, borderColor: preset === p.id ? c.accent : c.line, backgroundColor: c.surface }}>
              <Text style={[type.label, { color: c.ink }]}>{p.name}</Text>
            </Pressable>
          ))}
        </View>
        {!preset ? <Field label="Or describe it" value={prompt} onChangeText={setPrompt} maxLength={300}
          placeholder={mode === "video" ? "steam rises slowly from the mug" : "a woman at a vanity applying this eyeliner"} /> : null}
      </View>
      {mode === "scene" ? <EnginePicker engines={presets?.engines} value={engine} onChange={setEngine} /> : null}
      {mode === "video" && presets.video_providers?.length ? (
        <View style={{ gap: space.sm }}>
          <H2>Video provider</H2>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
            {presets.video_providers.map((provider) => (
              <Pressable key={provider.id} onPress={() => setVideoProvider(provider.id)}
                accessibilityRole="radio" accessibilityState={{ selected: videoProvider === provider.id }}
                style={{ borderRadius: radius.pill, paddingVertical: 10, paddingHorizontal: 14,
                  backgroundColor: c.surface, borderWidth: videoProvider === provider.id ? 2 : 1,
                  borderColor: videoProvider === provider.id ? c.accent : c.line }}>
                <Text style={[type.label, { color: c.ink }]}>{provider.name}</Text>
              </Pressable>
            ))}
          </View>
          {videoProvider === "comfy" ? <Body muted>Uses your connected provider credits. Generation is limited to one request per day while the new video engine is being validated.</Body> : null}
        </View>
      ) : null}
      {videoLocked ? (
        <Button label="See membership" variant="flash" onPress={() => router.push({ pathname: "/plans", params: { highlight: "pro" } })} />
      ) : (
        <Button label={mode === "video" ? "Make the clip" : "Make the photo"} icon={<Ionicons name="sparkles" size={18} color={c.onAccent} />} loading={busy}
          disabled={!product || (!preset && prompt.trim().length < 3)} onPress={start} />
      )}
      {left != null && !videoLocked && (mode === "video" || engine === "standard") ? <Text style={[type.small, { color: c.muted }]}>{left} {mode === "video" ? "clips" : "photos"} left{a?.plan === "free" ? "" : " this month"}.</Text> : null}
      <View style={{ flexDirection: "row", gap: space.sm, alignItems: "flex-start", backgroundColor: c.surface, borderColor: c.line, borderWidth: 1, borderRadius: radius.md, padding: space.md }}>
        <Ionicons name="information-circle-outline" size={18} color={c.accent} />
        <Text style={[type.small, { color: c.ink, flex: 1 }]}>AI can change small details like logos or text, so check the result before you post. Instagram and TikTok ask you to label realistic AI images and video: turn on the AI label when you post.</Text>
      </View>
      <Notice text={msg?.text ?? null} tone={msg?.tone} />

      {jobs.length ? <H2>Your creations</H2> : null}
      {jobs.map((j) => <JobCard key={j.id} job={j} product={product} onMsg={setMsg} />)}
    </PageScroll>
  );
}

function JobCard({ job, product, onMsg }: { job: AiJob; product?: Product; onMsg: (m: Msg) => void }) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const w = width - space.lg * 2;
  const [busy, setBusy] = useState<string | null>(null);
  const label = job.kind === "video" ? "Video clip" : "Lifestyle photo";
  return (
    <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, padding: space.md, gap: space.md }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={[type.label, { color: c.ink }]}>{label}</Text>
        <Pill text={job.status === "done" ? "Ready" : job.status === "failed" ? "Didn’t work" : "Making…"} tone={job.status === "done" ? "good" : "neutral"} />
      </View>
      {job.status === "running" || job.status === "queued" ? <ActivityIndicator color={c.accent} /> : null}
      {job.status === "failed" ? <Text style={[type.small, { color: c.muted }]}>{job.error} It didn’t count against your plan.</Text> : null}
      {job.status === "done" && job.url ? (
        <>
          {job.kind === "video" ? <Clip url={job.url} width={Math.min(w - space.md * 2, 280)} /> : <Image source={{ uri: job.url }} style={{ width: w - space.md * 2, aspectRatio: 4 / 5, borderRadius: radius.md }} contentFit="cover" />}
          <View style={{ flexDirection: "row", gap: space.sm }}>
            <Button label="Save" variant="secondary" style={{ flex: 1 }} loading={busy === "save"} onPress={async () => {
              setBusy("save");
              try { onMsg((await saveToPhone([job.url!])) ? { text: "Saved to your phone.", tone: "ok" } : { text: "Allow photo access in Settings to save.", tone: "error" }); }
              finally { setBusy(null); }
            }} />
            <Button label="Share" variant="secondary" style={{ flex: 1 }} onPress={() => shareFile(job.url!).catch(() => {})} />
          </View>
          {job.kind === "scene" && product ? (
            <View style={{ flexDirection: "row", gap: space.sm }}>
              <Button label="Make a post" variant="ghost" style={{ flex: 1 }} onPress={() => router.push({ pathname: "/marketing", params: { product_id: product.id, image_url: job.url } })} />
              <Button label="Use as product photo" variant="ghost" style={{ flex: 1.3 }} loading={busy === "use"} onPress={async () => {
                setBusy("use");
                try { await api.updateProduct(product.id, { image_file: job.image_file }); onMsg({ text: `It’s now the photo for ${product.title}. Your store notes that it was made with AI.`, tone: "ok" }); }
                catch (e) { onMsg({ text: errText(e, "Couldn’t update the product."), tone: "error" }); }
                finally { setBusy(null); }
              }} />
            </View>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
function Clip({ url, width }: { url: string; width: number }) {
  // Browser autoplay is frequently blocked. Let customers explicitly tap Play/Pause,
  // seek and replay using the native controls on web, Android and iOS.
  const player = useVideoPlayer(url, (p) => { p.loop = true; });
  const style = useMemo(() => ({
    width, height: (width * 16) / 9, borderRadius: radius.md, alignSelf: "center" as const,
    backgroundColor: "#000",
  }), [width]);
  return <VideoView player={player} style={style} contentFit="contain" nativeControls />;
}

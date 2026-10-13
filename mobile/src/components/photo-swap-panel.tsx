import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, AppState, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Body, Button, Field, Notice, Pill, Segmented } from "@/components/ui";
import { account } from "@/lib/account-store";
import { API_URL, api, ApiError, type Product, type TemplatePreview as TemplatePreviewData } from "@/lib/api";
import { imageAssistant, imageJobRunning, imageRequestKey, jobsForStorefrontSlot, mergeImageJob, usableImageJob, type ImageAspect, type ImageAssistantInput, type ImageAssistantOptions, type ImageJob } from "@/lib/image-assistant";
import type { StorefrontDraft, TemplatePhoto, TemplatePhotoSlot } from "@/lib/storefront-draft";
import { radius, space, type, useColors } from "@/lib/theme";
import { draftSlotSource, productPhotoSources, type OwnedPhotoSource } from "./photo-swap-safeguards";

export type PhotoSwapPanelProps = {
  slot: TemplatePhotoSlot; slots: TemplatePreviewData["photo_slots"]; storeId: string; storeRevision: number;
  draft: StorefrontDraft; products: Product[]; busy: boolean;
  onSelectSlot: (slot: TemplatePhotoSlot) => void;
  onUpload: (slot: TemplatePhotoSlot, source: "camera" | "library") => void;
  onUsePhoto: (slot: TemplatePhotoSlot, photo: TemplatePhoto) => Promise<void>;
  onReuseMain: () => void; onClear: (slot: TemplatePhotoSlot) => void;
};
type Scoped<T> = { scope: string; value: T };
type Message = { text: string; tone: "ok" | "info" | "error" };
const examples = [
  { name: "Editorial light", prompt: "Style my real product in an elegant editorial scene on warm travertine, soft side-window light, subtle shadows and plenty of clear space around it. Keep the item and its label accurate." },
  { name: "Cinematic luxury", prompt: "Create a cinematic luxury campaign around my real product: dark graphite stone, restrained silver reflections, directional light and a refined uncluttered composition. Keep the item and its label accurate." },
];

/** Storefront-only photo direction. No candidate is inserted or applied without an explicit Use. */
export function PhotoSwapPanel(props: PhotoSwapPanelProps) {
  const { slot, slots, storeId, storeRevision, draft, products, busy, onSelectSlot, onUpload, onUsePhoto, onReuseMain, onClear } = props;
  const c = useColors();
  const scope = `${storeId}:${storeRevision}:${slot}`;
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<{ store: string; data: ImageAssistantOptions } | null>(null);
  const [history, setHistory] = useState<{ store: string; jobs: ImageJob[] } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [modeChoice, setModeChoice] = useState<Scoped<"edit" | "art"> | null>(null);
  const [promptChoice, setPromptChoice] = useState<Scoped<string> | null>(null);
  const [aspectChoice, setAspectChoice] = useState<Scoped<ImageAspect> | null>(null);
  const [sourceChoice, setSourceChoice] = useState<Scoped<OwnedPhotoSource> | null>(null);
  const [jobChoice, setJobChoice] = useState<Scoped<string> | null>(null);
  const [messageChoice, setMessageChoice] = useState<Scoped<Message> | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(AppState.currentState === "active");
  const [resume, setResume] = useState(0);
  const [stoppedId, setStoppedId] = useState<string | null>(null);
  const [retryScope, setRetryScope] = useState<string | null>(null);
  const frozen = useRef<Scoped<ImageAssistantInput> | null>(null);
  const mounted = useRef(true);
  const currentScope = useRef(scope);
  useEffect(() => { currentScope.current = scope; }, [scope]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useFocusEffect(useCallback(() => { setFocused(true); return () => setFocused(false); }, []));
  useEffect(() => { const sub = AppState.addEventListener("change", (state) => setActive(state === "active")); return () => sub.remove(); }, []);
  const original = useMemo(() => draftSlotSource(draft, slot), [draft, slot]);
  const sources = useMemo(() => productPhotoSources(products), [products]);
  const source = sourceChoice?.scope === scope ? sourceChoice.value : original;
  const mode = modeChoice?.scope === scope ? modeChoice.value : "edit";
  const prompt = promptChoice?.scope === scope ? promptChoice.value : "";
  const aspect = aspectChoice?.scope === scope ? aspectChoice.value : slot === 0 ? "wide" : "portrait";
  const options = config?.store === storeId ? config.data : null;
  const jobs = jobsForStorefrontSlot(history?.store === storeId ? history.jobs : [], slot);
  const candidate = jobs.find((job) => job.id === (jobChoice?.scope === scope ? jobChoice.value : "")) ?? null;
  const current = slots.find((item) => item.index === slot);
  const polling = jobs.find((job) => imageJobRunning(job) && job.id !== stoppedId) ?? null;
  const disabled = busy || pending === scope;
  const message = messageChoice?.scope === scope ? messageChoice.value : null;
  const owns = (requestScope = scope) => mounted.current && currentScope.current === requestScope && account.get()?.id === storeId && (!api.selectedStore() || api.selectedStore() === storeId) && api.storeRevision() === storeRevision;
  const setMessage = (value: Message) => setMessageChoice({ scope, value });

  useEffect(() => {
    if (!open || !focused || !active) return;
    let alive = true;
    void imageAssistant.options("storefront", storeId).then((data) => {
      if (!alive || account.get()?.id !== storeId || api.storeRevision() !== storeRevision) return;
      setConfig({ store: storeId, data }); setHistory((old) => ({ store: storeId, jobs: data.jobs.reduce((all, job) => mergeImageJob(all, job), old?.store === storeId ? old.jobs : []) }));
    }).catch((error) => {
      if (alive) setMessageChoice({ scope, value: { text: error instanceof ApiError ? error.message : "The Photo Agent could not connect. Your own photos and Refresh still work.", tone: "error" } });
    });
    return () => { alive = false; };
  }, [open, focused, active, storeId, storeRevision, attempt, scope]);

  const pollingId = polling?.id;
  useEffect(() => {
    if (!open || !focused || !active || !pollingId) return;
    let alive = true; let count = 0; let timer: ReturnType<typeof setTimeout> | null = null;
    const read = async () => {
      try {
        const job = await imageAssistant.job(pollingId, storeId);
        if (!alive || account.get()?.id !== storeId || api.storeRevision() !== storeRevision) return;
        setHistory((old) => ({ store: storeId, jobs: mergeImageJob(old?.store === storeId ? old.jobs : [], job) }));
        if (!imageJobRunning(job)) {
          if (usableImageJob(job)) setJobChoice({ scope, value: job.id });
          setMessageChoice({ scope, value: { text: job.status === "done" ? "Your candidate is ready. Compare it with the original, then choose whether to use it." : job.error || "This edit failed. Your earlier photo is unchanged.", tone: job.status === "done" ? "ok" : "error" } });
          setAttempt((value) => value + 1); return;
        }
      } catch (error) {
        if (!alive) return;
        setMessageChoice({ scope, value: { text: error instanceof ApiError ? error.message : "Couldn’t check this edit. It stays saved on the server; resume without generating again.", tone: "info" } });
      }
      if (!alive) return;
      if (++count >= 24) { setStoppedId(pollingId); setMessageChoice({ scope, value: { text: "This edit is taking longer. Its job is saved. Tap Resume to check again without spending another edit.", tone: "info" } }); return; }
      timer = setTimeout(() => { void read(); }, 5000);
    };
    void read();
    return () => { alive = false; if (timer) clearTimeout(timer); };
  }, [open, focused, active, pollingId, storeId, storeRevision, scope, resume]);

  async function generate(retry = false) {
    if (!owns() || disabled) return;
    if ((!options?.enabled || !options?.provider)) { setMessage({ text: options?.setup_required || "AI image generation is unavailable. Uploading and previewing your own photos still works.", tone: "info" }); return; }
    if (!retry && mode === "edit" && !source) { setMessage({ text: "Choose or upload your real photo first. Then describe how you want it redesigned.", tone: "info" }); return; }
    if (!retry && prompt.trim().length < 8) { setMessage({ text: "Describe the picture you want in a short sentence.", tone: "info" }); return; }
    if (!retry && options.allowance.ai.remaining <= 0) { setMessage({ text: "Your AI image allowance is used up. Your own uploads and Refresh still work.", tone: "info" }); return; }
    const frozenInput = frozen.current?.scope === scope ? frozen.current.value : null;
    if (retry && !frozenInput) {
      setRetryScope(null); setAttempt((value) => value + 1);
      setMessage({ text: "Check the saved requests for this photo spot. We did not create another image.", tone: "info" }); return;
    }
    const input = retry ? frozenInput! : {
      operation: mode === "edit" ? "storefront-edit" as const : "storefront-art" as const,
      prompt: prompt.trim(), image_file: mode === "edit" ? source?.image_file : undefined,
      aspect, slot, idempotency_key: imageRequestKey(),
    };
    frozen.current = { scope, value: input };
    setPending(scope); setMessage({ text: "Starting one private photo candidate. Your current photo stays in place.", tone: "info" });
    const initiated = scope;
    try {
      const job = await imageAssistant.start(input, storeId);
      if (!owns(initiated)) return;
      frozen.current = null; setRetryScope(null);
      setHistory((old) => ({ store: storeId, jobs: mergeImageJob(old?.store === storeId ? old.jobs : [], job) }));
      setJobChoice({ scope: initiated, value: job.id }); setStoppedId(null);
      setMessage({ text: job.status === "failed" ? job.error || "Couldn’t create this photo." : "Your request is saved. You can leave this screen and return to see its result.", tone: job.status === "failed" ? "error" : "info" });
    } catch (error) {
      if (owns(initiated)) { setRetryScope(error instanceof ApiError && error.status !== 0 ? null : initiated); setMessage({ text: error instanceof ApiError ? error.message : "The request did not return. Retry the same request to avoid spending twice.", tone: "error" }); }
    } finally { if (mounted.current) setPending((old) => old === initiated ? null : old); }
  }

  async function chooseCandidate() {
    if (!owns() || disabled || !usableImageJob(candidate) || candidate.slot !== slot || candidate.context !== "storefront") return;
    const initiated = scope; setPending(initiated);
    try {
      await onUsePhoto(slot, { image_file: candidate.image_file, image_url: candidate.image_url });
      if (owns(initiated)) setMessage({ text: "Candidate placed in this photo spot. Your layout is unchanged. Nothing is public until you finish your store.", tone: "ok" });
    } catch (error) { if (owns(initiated)) setMessage({ text: error instanceof Error ? error.message : "Couldn’t save that candidate. It is still in your history.", tone: "error" }); }
    finally { if (mounted.current) setPending((old) => old === initiated ? null : old); }
  }

  return <View style={{ gap: space.md }}>
    <Text style={[type.heading, { color: c.ink }]}>Photos in this layout</Text>
    <Body muted>Choose a photo spot, then upload your own picture or ask the Storefront Photo Agent to help.</Body>
    <View style={styles.tabs} accessibilityRole="tablist">{(slots.length ? slots : [{ index: 0 as const, label: "Main photo", image_url: null, sample: true }]).map((item) => <Pressable key={item.index} disabled={disabled} onPress={() => onSelectSlot(item.index)} accessibilityRole="tab" accessibilityState={{ selected: item.index === slot, disabled }} style={[styles.tab, { backgroundColor: item.index === slot ? c.accent : c.sunk }]}><Text style={[type.label, { color: item.index === slot ? c.onAccent : c.ink }]}>{item.index === 0 ? "Main" : `Detail ${item.index}`}</Text><Text style={[type.small, { color: item.index === slot ? c.onAccent : c.muted }]}>{item.sample ? "Example" : item.image_url ? "Your photo" : "Add yours"}</Text></Pressable>)}</View>
    <View style={[styles.current, { borderColor: c.line, backgroundColor: c.surface }]}>{current?.image_url ? <Image source={{ uri: current.image_url }} contentFit="cover" style={styles.thumbnail} /> : <Ionicons name="image-outline" size={32} color={c.muted} />}<View style={{ flex: 1, gap: 5 }}><Text style={[type.label, { color: c.ink }]}>{current?.label || "Main photo"}</Text><Pill text={current?.sample ? "Example" : current?.image_url ? "Your photo" : "Add yours"} /></View></View>
    <View style={styles.row}><Button label="Take photo" variant="secondary" disabled={disabled} style={{ flex: 1 }} onPress={() => onUpload(slot, "camera")} /><Button label="Choose photo" variant="secondary" disabled={disabled} style={{ flex: 1 }} onPress={() => onUpload(slot, "library")} /></View>
    {slots.length > 1 && draft.banner_file ? <Button label="Use main photo in other spots" variant="secondary" disabled={disabled} onPress={onReuseMain} /> : null}
    {original ? <Button label="Clear this spot" variant="ghost" disabled={disabled} onPress={() => onClear(slot)} /> : null}
    {sources.length ? <View style={{ gap: space.sm }}><Text style={[type.label, { color: c.ink }]}>Your product photos</Text>{sources.map((item) => <View key={item.image_file} style={[styles.current, { borderColor: c.line }]}><Image source={{ uri: item.image_url }} style={styles.thumbnail} contentFit="cover" /><Text style={[type.small, { color: c.ink, flex: 1 }]}>{item.label}</Text><Button label="Use" variant="ghost" disabled={disabled} onPress={() => { void onUsePhoto(slot, item).catch((error: unknown) => setMessage({ text: error instanceof Error ? error.message : "Couldn’t use that photo.", tone: "error" })); }} /><Button label="Redesign" variant="ghost" disabled={disabled} onPress={() => { setSourceChoice({ scope, value: item }); setModeChoice({ scope, value: "edit" }); setOpen(true); }} /></View>)}</View> : null}
    <Button label={open ? "Hide Storefront Photo Agent" : "Ask the Storefront Photo Agent"} variant="secondary" onPress={() => setOpen(!open)} />
    {open ? <View style={[styles.agent, { backgroundColor: c.sunk, borderColor: c.line }]}>
      <Text style={[type.heading, { color: c.ink }]}>Storefront Photo Agent</Text>
      <Body muted>1. Pick a picture or artwork. 2. Describe your idea. 3. Review the result. 4. Use it in this spot.</Body>
      <Segmented value={mode} onChange={(value) => { setModeChoice({ scope, value: value === "art" ? "art" : "edit" }); }} options={[{ value: "edit", label: "Redesign my photo" }, { value: "art", label: "Create backdrop" }]} />
      <Notice text={mode === "edit" ? source ? `Editing: ${source.label}. We ask AI to keep your item, logo and label accurate. Check its result before using it.` : "Choose your own picture first. Example photos are not used as your inventory." : "Creates decorative store artwork, not a new product or an accurate picture of an item you sell."} />
      {mode === "edit" ? <View style={styles.row}>{examples.map((example) => <Button key={example.name} label={example.name} variant="secondary" disabled={disabled} style={{ flex: 1 }} onPress={() => setPromptChoice({ scope, value: example.prompt })} />)}</View> : null}
      <Field label="Tell the agent what to create or change" hint="Describe the scene, colors, light and mood. Your words are not restricted to a background preset." value={prompt} onChangeText={(value) => { setPromptChoice({ scope, value }); if (retryScope !== scope) frozen.current = null; }} multiline maxLength={1200} editable={!disabled && retryScope !== scope} placeholder={mode === "edit" ? "Put my candle on cream stone with soft sunrise light and a luxury spa mood." : "A calm abstract silver-and-cream landscape with room for the store headline."} />
      <Segmented value={aspect} options={[{ value: "wide", label: "Wide hero" }, { value: "portrait", label: "Portrait" }, { value: "square", label: "Square" }]} onChange={(value) => setAspectChoice({ scope, value: value as ImageAspect })} />
      {!options ? <Button label="Load agent status" variant="secondary" onPress={() => setAttempt((value) => value + 1)} /> : <><Body muted>{options.allowance.ai.remaining} of {options.allowance.ai.limit} AI images left. One new candidate uses one image; checking a saved job does not.</Body>{(!options.enabled || !options.provider) ? <Notice text={options.setup_required || "The AI image provider is unavailable. You can still upload pictures and refresh your design."} /> : null}<Button label={pending === scope ? "Starting candidate…" : "Create one candidate"} loading={pending === scope} disabled={disabled || retryScope === scope || (!options.enabled || !options.provider) || prompt.trim().length < 8 || (mode === "edit" && !source) || options.allowance.ai.remaining <= 0} onPress={() => { void generate(); }} /></>}
      {retryScope === scope ? <Button label="Retry same request (no duplicate generation)" variant="secondary" disabled={disabled} onPress={() => { void generate(true); }} /> : null}
      {jobs.length ? <View style={{ gap: 7 }}><Text style={[type.label, { color: c.ink }]}>Saved requests for this photo spot</Text>{jobs.slice(0, 6).map((job) => <View key={job.id} style={{ gap: 5, paddingVertical: 6 }}><Button label={`${job.status === "done" ? "Review" : imageJobRunning(job) ? "Resume" : "View"}: ${job.prompt.slice(0, 55)}`} variant="secondary" disabled={disabled} onPress={() => { setJobChoice({ scope, value: job.id }); if (imageJobRunning(job)) { setStoppedId(null); setResume((value) => value + 1); } }} /><Text style={[type.small, { color: c.muted }]}>{job.status === "failed" ? job.error || "Failed — current photo unchanged" : job.status}</Text></View>)}</View> : null}
      {polling ? <View style={styles.row}><ActivityIndicator color={c.accent} /><Body muted>Creating your candidate. Your request is saved.</Body><Button label="Stop waiting" variant="ghost" onPress={() => setStoppedId(polling.id)} /></View> : null}
      {usableImageJob(candidate) ? <View style={{ gap: space.sm }}>
        <Text style={[type.heading, { color: c.ink }]}>Compare before using</Text>
        {candidate.source_file ? <><Body muted>Original photo</Body><Image source={{ uri: `${API_URL}/img/${candidate.source_file}` }} style={styles.resultImage} contentFit="contain" /></> : null}
        <Body muted>AI candidate · {candidate.aspect}</Body><Image source={{ uri: candidate.image_url }} style={styles.resultImage} contentFit="contain" />
        <Body muted>{candidate.prompt}</Body>
        <Button label="Use this candidate in this spot" disabled={disabled} onPress={() => { void chooseCandidate(); }} />
        <Notice text="Only this draft photo is replaced. Your theme, other photo spots, products and live store stay unchanged until you finish setup." />
      </View> : null}
    </View> : null}
    <Notice text={message?.text ?? null} tone={message?.tone} />
  </View>;
}
const styles = StyleSheet.create({
  tabs: { flexDirection: "row", gap: 4 }, tab: { flex: 1, minHeight: 52, borderRadius: radius.md, alignItems: "center", justifyContent: "center", gap: 3 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: space.sm, alignItems: "center" },
  current: { flexDirection: "row", minHeight: 72, borderWidth: 1, padding: space.sm, borderRadius: radius.md, alignItems: "center", gap: space.sm },
  thumbnail: { width: 54, height: 54, borderRadius: radius.sm }, agent: { padding: space.md, borderWidth: 1, borderRadius: radius.lg, gap: space.md }, resultImage: { width: "100%", height: 230, borderRadius: radius.md },
});

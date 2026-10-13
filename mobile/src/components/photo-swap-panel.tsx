import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Button, Notice, Pill } from "@/components/ui";
import { useMe } from "@/lib/account-store";
import { api, ApiError, type Product, type StudioPresets, type StudioStyle, type TemplatePreview as TemplatePreviewData } from "@/lib/api";
import type { StorefrontDraft, TemplatePhoto, TemplatePhotoSlot } from "@/lib/storefront-draft";
import { fonts, radius, space, type, useColors } from "@/lib/theme";
import {
  discardStudioResult,
  draftSlotSource,
  ownedPhoto,
  productPhotoSources,
  retainStudioResult,
  studioResultFor,
  type OwnedPhotoSource,
} from "./photo-swap-safeguards";

export type PhotoSwapPanelProps = {
  slot: TemplatePhotoSlot;
  slots: TemplatePreviewData["photo_slots"];
  storeId: string;
  storeRevision: number;
  draft: StorefrontDraft;
  products: Product[];
  busy: boolean;
  onSelectSlot: (slot: TemplatePhotoSlot) => void;
  onUpload: (slot: TemplatePhotoSlot, source: "camera" | "library") => void;
  onUsePhoto: (slot: TemplatePhotoSlot, photo: TemplatePhoto) => Promise<void>;
  onReuseMain: () => void;
  onClear: (slot: TemplatePhotoSlot) => void;
};

type PanelMessage = { text: string; tone: "error" | "info" | "ok" };
type Scoped<T> = { scope: string; value: T };
type PresetRecord = { storeId: string; presets: StudioPresets; error: string | null };

/**
 * The wizard owns uploads and draft patches. This panel only presents explicit choices: Studio
 * receives a real owner reference, and its result is never inserted until the seller taps Use.
 */
export function PhotoSwapPanel({ slot, slots, storeId, storeRevision, draft, products, busy, onSelectSlot, onUpload, onUsePhoto, onReuseMain, onClear }: PhotoSwapPanelProps) {
  const c = useColors();
  const me = useMe();
  const scope = `${storeId}:${slot}:${storeRevision}`;
  const [presetRecord, setPresetRecord] = useState<PresetRecord | null>(null);
  const [sourceChoice, setSourceChoice] = useState<Scoped<OwnedPhotoSource> | null>(null);
  const [styleChoice, setStyleChoice] = useState<Scoped<StudioStyle> | null>(null);
  const [promptChoice, setPromptChoice] = useState<Scoped<string> | null>(null);
  const [messageChoice, setMessageChoice] = useState<Scoped<PanelMessage> | null>(null);
  const [resultChoice, setResultChoice] = useState<Scoped<ReturnType<typeof studioResultFor>> | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [runningScope, setRunningScope] = useState<string | null>(null);
  const run = useRef(0);
  const current = slots.find((item) => item.index === slot) ?? null;
  const slotSource = useMemo(() => draftSlotSource(draft, slot), [draft, slot]);
  const productSources = useMemo(() => productPhotoSources(products), [products]);
  const presets = presetRecord?.storeId === storeId ? presetRecord.presets : null;
  const presetLoadError = presetRecord?.storeId === storeId ? presetRecord.error : null;
  const source = sourceChoice?.scope === scope ? sourceChoice.value : slotSource;
  const style = styleChoice?.scope === scope ? styleChoice.value : null;
  const prompt = promptChoice?.scope === scope ? promptChoice.value : "";
  const message = messageChoice?.scope === scope ? messageChoice.value : null;
  const retained = resultChoice?.scope === scope ? resultChoice.value : studioResultFor(storeId, slot, storeRevision);
  const running = runningScope === scope;
  const allowance = me?.account ? Math.max(0, me.account.limits.studio - me.account.usage.studio) : null;
  const disabled = busy || running;
  const setMessage = (value: PanelMessage | null) => setMessageChoice(value ? { scope, value } : null);

  useEffect(() => {
    let alive = true;
    void api.studioPresets().then((next) => {
      if (alive) setPresetRecord({ storeId, presets: next, error: null });
    }).catch(() => {
      if (alive) setPresetRecord({ storeId, presets: { enabled: false, custom: false, colors: [], scenes: [] }, error: "Photo Studio is unavailable right now. Your own uploaded photos still work." });
    });
    return () => { alive = false; };
  }, [storeId]);

  function selectStyle(next: StudioStyle) {
    setStyleChoice({ scope, value: next });
    setMessage(null);
  }

  async function generate() {
    const owner = storeId;
    const revision = storeRevision;
    const requestScope = scope;
    const selected = source && ownedPhoto(source, source.label, source.kind);
    if (!selected) { setMessage({ text: "Upload a photo or choose one of your real product photos first. We do not make inventory from example images.", tone: "info" }); return; }
    if (!presets?.enabled) { setMessage({ text: "Photo Studio is not enabled for this account right now. You can still use your own uploaded photo.", tone: "info" }); return; }
    if (!style) { setMessage({ text: "Choose a background style first.", tone: "info" }); return; }
    if (allowance === 0) { setMessage({ text: "You have no Studio edits left right now. Choose one of your own photos instead.", tone: "info" }); return; }
    const request = ++run.current;
    setRunningScope(requestScope); setMessage(null);
    try {
      const result = await api.studio({ image_file: selected.image_file, style }, owner);
      const saved = retainStudioResult(owner, slot, revision, selected, result);
      // A changed store, slot, or selection revision cannot display this late result.
      if (request !== run.current) return;
      if (!saved) { setMessageChoice({ scope: requestScope, value: { text: "The Studio result did not match the photo you selected, so it was not offered for use.", tone: "error" } }); return; }
      setResultChoice({ scope: requestScope, value: saved });
      setMessageChoice({ scope: requestScope, value: result.notice ? { text: result.notice, tone: "info" } : { text: "Your AI photo is ready. It is not in your storefront until you choose Use this AI photo.", tone: "ok" } });
    } catch (error) {
      if (request === run.current) setMessageChoice({ scope: requestScope, value: { text: error instanceof ApiError ? error.message : "Couldn’t make that photo. Your existing photos are unchanged.", tone: "error" } });
    } finally {
      if (request === run.current) setRunningScope((currentScope) => currentScope === requestScope ? null : currentScope);
    }
  }

  async function applyAiPhoto() {
    if (!retained || retained.storeId !== storeId || retained.slot !== slot || retained.revision !== storeRevision) return;
    const requestScope = scope;
    setRunningScope(requestScope); setMessage(null);
    try {
      await onUsePhoto(slot, retained.photo);
      discardStudioResult(storeId, slot);
      setResultChoice({ scope: requestScope, value: null });
      setMessageChoice({ scope: requestScope, value: { text: "AI photo selected for this setup draft. It is not public until you finish your store design.", tone: "ok" } });
    } catch (error) {
      setMessageChoice({ scope: requestScope, value: { text: error instanceof Error ? error.message : "Couldn’t use that AI photo. It is still available here.", tone: "error" } });
    } finally { setRunningScope((currentScope) => currentScope === requestScope ? null : currentScope); }
  }

  const main = slots.find((item) => item.index === 0);
  return (
    <View style={{ gap: space.md }}>
      <View style={{ gap: 5 }}>
        <Text style={[type.heading, { color: c.ink }]}>Photos in this layout</Text>
        <Text style={[type.small, { color: c.muted }]}>Choose a real photo for each spot. Example images are only layout placeholders.</Text>
      </View>
      <View style={[styles.tabs, { backgroundColor: c.sunk }]} accessibilityRole="tablist">
        {(slots.length ? slots.map((item) => item.index) : [0] as TemplatePhotoSlot[]).map((index) => {
          const item = slots.find((candidate) => candidate.index === index);
          const selected = index === slot;
          return <Pressable key={index} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => onSelectSlot(index)} style={[styles.tab, selected && { backgroundColor: c.accent }]}>
            <Text style={{ fontFamily: fonts.bodyBold, color: selected ? c.onAccent : c.ink, fontSize: 13 }}>{index === 0 ? "Main" : `Detail ${index}`}</Text>
            <Text style={{ fontFamily: fonts.body, color: selected ? c.onAccent : c.muted, fontSize: 11 }}>{item?.sample ? "Example" : item?.image_url ? "Your photo" : "Add yours"}</Text>
          </Pressable>;
        })}
      </View>
      <View style={[styles.current, { borderColor: c.line, backgroundColor: c.surface }]}>
        <View style={[styles.thumbnail, { backgroundColor: c.sunk }]}>{current?.image_url ? <Image source={{ uri: current.image_url }} contentFit="cover" style={StyleSheet.absoluteFill} /> : <Ionicons name="image-outline" size={24} color={c.muted} />}</View>
        <View style={{ flex: 1, gap: 3 }}><Text style={[type.label, { color: c.ink }]}>{current?.label || (slot === 0 ? "Main photo" : `Detail photo ${slot}`)}</Text><Pill text={current?.sample ? "Example" : current?.image_url ? "Your photo" : "Add your photo"} /></View>
      </View>
      <View style={{ flexDirection: "row", gap: space.sm }}>
        <Button label="Take photo" variant="secondary" disabled={disabled} style={{ flex: 1 }} onPress={() => onUpload(slot, "camera")} />
        <Button label="Choose photo" variant="secondary" disabled={disabled} style={{ flex: 1 }} onPress={() => onUpload(slot, "library")} />
      </View>
      <View style={{ flexDirection: "row", gap: space.sm }}>
        {slots.length > 1 && draft.banner_file && main?.image_url ? <Button label="Use main photo in other spots" variant="secondary" disabled={disabled} style={{ flex: 1 }} onPress={onReuseMain} /> : null}
        {(current?.image_url || slotSource) ? <Button label="Clear this spot" variant="ghost" disabled={disabled} onPress={() => onClear(slot)} /> : null}
      </View>
      {productSources.length ? <View style={{ gap: space.sm }}>
        <Text style={[type.label, { color: c.ink }]}>Choose one of your product photos</Text>
        {productSources.map((product) => <View key={product.image_file} style={[styles.product, { borderColor: c.line }]}><Image source={{ uri: product.image_url }} contentFit="cover" style={styles.productImage} /><Text numberOfLines={1} style={[type.small, { color: c.ink, flex: 1 }]}>{product.label}</Text><Pressable disabled={disabled} accessibilityRole="button" onPress={() => { void onUsePhoto(slot, product).catch((error: unknown) => setMessage({ text: error instanceof Error ? error.message : "Couldn’t use that photo.", tone: "error" })); }} style={{ minHeight: 44, minWidth: 44, justifyContent: "center" }}><Text style={{ fontFamily: fonts.bodyBold, color: c.accent }}>Use</Text></Pressable><Pressable disabled={disabled} accessibilityRole="button" onPress={() => { setSourceChoice({ scope, value: product }); setAiOpen(true); }} style={{ minHeight: 44, minWidth: 44, justifyContent: "center" }}><Text style={{ fontFamily: fonts.bodyBold, color: c.accent }}>Studio</Text></Pressable></View>)}
      </View> : null}
      <Button label={aiOpen ? "Hide AI photo help" : "Ask AI to help with this photo"} variant="secondary" disabled={disabled} onPress={() => setAiOpen(!aiOpen)} />
      {aiOpen ? <View style={[styles.studio, { backgroundColor: c.sunk, borderColor: c.line }]}>
        <Text style={[type.heading, { color: c.ink }]}>Photo Studio</Text>
        <Text style={[type.small, { color: c.muted }]}>{source ? `Source: ${source.label}. Studio changes the background only.` : "Choose one of your own uploaded or product photos before using Studio."}</Text>
        {allowance != null ? <Text style={[type.small, { color: c.ink }]}>{allowance} of {me!.account.limits.studio} Studio edits left. Each generation uses one edit.</Text> : null}
        {!presets ? <ActivityIndicator color={c.accent} /> : !presets.enabled ? <Notice text={presetLoadError || "Photo Studio is not enabled right now. No background will be generated."} /> : <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
            {presets.colors.map((item) => <Pressable key={item.id} disabled={disabled} onPress={() => selectStyle({ color: item.id })} style={[styles.preset, { borderColor: style && "color" in style && style.color === item.id ? c.accent : c.line, backgroundColor: c.surface }]}><View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: `#${item.hex}` }} /><Text style={[type.small, { color: c.ink }]}>{item.name}</Text></Pressable>)}
            {presets.scenes.map((item) => <Pressable key={item.id} disabled={disabled} onPress={() => selectStyle({ scene: item.id })} style={[styles.preset, { borderColor: style && "scene" in style && style.scene === item.id ? c.accent : c.line, backgroundColor: c.surface }]}><Text style={[type.small, { color: c.ink }]}>{item.name}</Text></Pressable>)}
          </View>
          {presets.custom ? <View style={{ gap: 6 }}><Text style={[type.label, { color: c.ink }]}>Place my product on…</Text><TextInput value={prompt} onChangeText={(value) => { setPromptChoice({ scope, value }); const text = value.trim(); setStyleChoice(text.length >= 3 ? { scope, value: { prompt: `Place my product on ${text}` } } : null); setMessage(null); }} maxLength={220} editable={!disabled} placeholder="a sunlit stone shelf" placeholderTextColor={c.muted} style={[styles.input, { color: c.ink, borderColor: c.line, backgroundColor: c.surface }]} /></View> : null}
          <Button label={running ? "Making your photo…" : "Generate one AI photo"} variant="secondary" loading={running} disabled={disabled || !source || !style || allowance === 0} onPress={generate} />
          {running ? <Pressable accessibilityRole="button" onPress={() => { run.current++; setRunningScope(null); setMessage({ text: "Stopped waiting. If the service finishes later, its result remains private to this store and slot for this app session.", tone: "info" }); }} style={{ minHeight: 44, justifyContent: "center" }}><Text style={{ fontFamily: fonts.bodyBold, color: c.accent }}>Stop waiting</Text></Pressable> : null}
        </>}
      </View> : null}
      {retained ? <View style={[styles.result, { borderColor: c.line, backgroundColor: c.surface }]}><Image source={{ uri: retained.photo.image_url }} contentFit="cover" style={styles.resultImage} /><View style={{ flex: 1, gap: 6 }}><Text style={[type.label, { color: c.ink }]}>AI photo ready</Text><Text style={[type.small, { color: c.muted }]}>It remains a private choice until you use it below. It is held for this app session; it is not restored after an app restart.</Text><Button label="Use this AI photo" disabled={disabled} loading={running} onPress={() => { void applyAiPhoto(); }} /></View></View> : null}
      <Notice text={message?.text ?? null} tone={message?.tone} />
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: "row", padding: 3, borderRadius: radius.md, gap: 3 },
  tab: { minHeight: 48, flex: 1, alignItems: "center", justifyContent: "center", borderRadius: radius.sm, gap: 1, paddingHorizontal: 4 },
  current: { flexDirection: "row", borderWidth: 1, borderRadius: radius.md, padding: space.sm, alignItems: "center", gap: space.sm },
  thumbnail: { width: 58, height: 58, borderRadius: radius.sm, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  product: { minHeight: 64, borderTopWidth: 1, flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 7 },
  productImage: { width: 48, height: 48, borderRadius: radius.sm },
  studio: { borderWidth: 1, borderRadius: radius.lg, padding: space.md, gap: space.sm },
  preset: { minHeight: 44, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 6 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 12, fontFamily: fonts.body, fontSize: 16 },
  result: { borderWidth: 1, borderRadius: radius.lg, padding: space.sm, flexDirection: "row", gap: space.sm },
  resultImage: { width: 104, height: 104, borderRadius: radius.md },
});

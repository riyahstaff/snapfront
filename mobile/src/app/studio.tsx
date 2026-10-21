import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Body, Button, Field, H2, Notice, PageScroll, usePageWidth } from "@/components/ui";
import { api, ApiError, type Product, type StudioPresets, type StudioStyle } from "@/lib/api";
import { PAGE_MAX } from "@/lib/page-width";
import { account, useMe } from "@/lib/account-store";
import { draftStore } from "@/lib/draft-store";
import { fonts, radius, space, type, useColors } from "@/lib/theme";

/** Rough colours for the scene buttons, so each reads at a glance. */
const SCENE_LOOK: Record<string, { bg: string; fg: string; icon: React.ComponentProps<typeof Ionicons>["name"] }> = {
  match: { bg: "#E7E2F7", fg: "#2B2347", icon: "color-palette-outline" },
  beach: { bg: "#EED9AE", fg: "#4A3B1C", icon: "sunny-outline" },
  wood: { bg: "#A9784F", fg: "#FFF8F0", icon: "reorder-four-outline" },
  granite: { bg: "#7D7B78", fg: "#FFFFFF", icon: "grid-outline" },
  marble: { bg: "#F1F0EE", fg: "#3B3B3B", icon: "water-outline" },
  concrete: { bg: "#BDBDB8", fg: "#262626", icon: "square-outline" },
  linen: { bg: "#E8DFD0", fg: "#4A4032", icon: "shirt-outline" },
  studio: { bg: "#F1F1F1", fg: "#2A2A2A", icon: "cube-outline" },
  arch: { bg: "#EADFD2", fg: "#4A3A28", icon: "home-outline" },
  pink: { bg: "#C9939B", fg: "#FFFFFF", icon: "ellipse-outline" },
  stone: { bg: "#4A4A4A", fg: "#FFFFFF", icon: "diamond-outline" },
};

type Shot = { file: string; url: string; label: string };
type Session = { storeId: string; target: string; sourceFile: string; storeRevision: number };

function valueParam(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

/**
 * Physical-product cleanup only. Every request starts from the verified original source; generated
 * candidates remain reviewable rather than promising that an image model preserved product identity.
 */
export default function StudioScreen() {
  const route = useLocalSearchParams<{ target?: string | string[]; image_file?: string | string[]; image_url?: string | string[] }>();
  const target = valueParam(route.target);
  const imageFile = valueParam(route.image_file);
  // Opened from Home, the menu or search (not from a product): pick the product first.
  if (!target || !imageFile) return <ProductPicker />;
  return <Cleanup target={target} imageFile={imageFile} imageUrl={valueParam(route.image_url)} />;
}

/** Choose which physical product's photo to clean up. */
function ProductPicker() {
  const c = useColors();
  const me = useMe();
  const storeId = me?.id;
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!storeId) return;
    let active = true;
    api.products(storeId).then((list) => { if (active) { setError(null); setProducts(list.filter((p) => p.kind === "physical")); } })
      .catch((e) => { if (active) setError(e instanceof ApiError ? e.message : "Couldn't load your products. Try again."); });
    return () => { active = false; };
  }, [storeId]);
  const withPhoto = products?.filter((p) => p.image_file) ?? [];
  const noPhoto = products?.filter((p) => !p.image_file) ?? [];
  return (
    <PageScroll style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ padding: space.xl, gap: space.xl, paddingBottom: 64 }}>
      <View style={{ gap: space.sm }}>
        <H2>Which product photo?</H2>
        <Body muted>Pick a physical product and Snapfront will make cleaned-up versions of its photo: a plain background in the colour you choose, or a scene like marble or wood. Your original photo stays until you choose a new one.</Body>
      </View>
      <Notice text={error} tone="error" />
      {!storeId || (!products && !error) ? <ActivityIndicator color={c.accent} /> : null}
      {products && !products.length ? (
        <View style={{ gap: space.md }}>
          <Notice text="You don't have any physical products yet. Photo cleanup works on photos of things you ship, like candles, clothes or jewelry. For digital products, use the Digital photo studio." tone="info" />
          <Button label="Snap a product" onPress={() => router.push("/snap")} />
          <Button label="Digital photo studio" variant="ghost" onPress={() => router.push("/digital-photo-studio")} />
        </View>
      ) : null}
      {withPhoto.length ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md }}>
          {withPhoto.map((p) => (
            <Pressable key={p.id} accessibilityRole="button" accessibilityLabel={`Clean up the photo of ${p.title}`}
              onPress={() => router.push({ pathname: "/studio", params: { target: p.id, image_file: p.image_file!, image_url: p.image_url ?? "" } })}
              style={({ pressed }) => ({ flexGrow: 1, flexBasis: 150, maxWidth: 230, borderRadius: radius.md, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, overflow: "hidden", opacity: pressed ? 0.85 : 1 })}>
              <Image source={{ uri: p.image_url ?? undefined }} style={{ width: "100%", aspectRatio: 1, backgroundColor: c.sunk }} contentFit="cover" />
              <View style={{ padding: space.sm, gap: 2 }}>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: c.ink }} numberOfLines={2}>{p.title}</Text>
                <Text style={[type.small, { color: c.muted }]}>{p.status === "live" ? "Live" : "Draft"}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}
      {noPhoto.length ? (
        <View style={{ gap: space.sm }}>
          <Text style={[type.small, { color: c.muted }]}>These need a photo first. Open one and add a photo, then come back here.</Text>
          {noPhoto.map((p) => <Button key={p.id} label={p.title} variant="ghost" onPress={() => router.push(`/product/${p.id}`)} />)}
        </View>
      ) : null}
    </PageScroll>
  );
}

function Cleanup({ target, imageFile, imageUrl }: { target: string; imageFile: string; imageUrl: string }) {
  const c = useColors();
  const me = useMe();
  const insets = useSafeAreaInsets();
  const max = PAGE_MAX[usePageWidth()];
  const column = max ? { width: "100%" as const, maxWidth: max, alignSelf: "center" as const } : null;
  const [presets, setPresets] = useState<StudioPresets | null>(null);
  const [shots, setShots] = useState<Shot[]>([]);
  const [selected, setSelected] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [msg, setMsg] = useState<{ text: string; tone: "error" | "ok" | "info" } | null>(null);
  const scroller = useRef<ScrollView>(null);
  const sourceRef = useRef<string | null>(null);

  const beginSession = useCallback((sourceFile?: string): Session | null => {
    const storeId = account.get()?.id;
    const file = sourceFile;
    if (!storeId || !me || me.id !== storeId || !target || !file || (api.selectedStore() && api.selectedStore() !== storeId)) return null;
    return { storeId, target, sourceFile: file, storeRevision: api.storeRevision() };
  }, [me, target]);

  const ownsSession = useCallback((started: Session) => account.get()?.id === started.storeId
    && (!api.selectedStore() || api.selectedStore() === started.storeId)
    && api.storeRevision() === started.storeRevision
    && target === started.target
    && imageFile === started.sourceFile
    && (!sourceRef.current || sourceRef.current === started.sourceFile), [imageFile, target]);

  useEffect(() => {
    const started = beginSession(imageFile);
    let active = true;
    void Promise.resolve().then(async () => {
      if (!active || !started) {
        if (active) {
          sourceRef.current = null;
          setShots([]);
          setMsg({ text: "This photo isn't from a physical product in the store you have open. Go back and choose the product again.", tone: "error" });
        }
        return;
      }
      sourceRef.current = null;
      setSelected(0);
      setShots([]);
      if (target === "draft") {
        sourceRef.current = imageFile;
        setShots([{ file: imageFile, url: imageUrl, label: "Original photo" }]);
        return;
      }
      try {
        const product = await api.product(target, started.storeId);
        if (!active || !ownsSession({ ...started, sourceFile: imageFile })) return;
        if (product.kind !== "physical" || !product.image_file || product.image_file !== imageFile) {
          setMsg({ text: "The product image changed or is not a physical-product source. Cleanup was not opened for that file.", tone: "error" });
          return;
        }
        sourceRef.current = product.image_file;
        setShots([{ file: product.image_file, url: product.image_url ?? imageUrl, label: "Original photo" }]);
      } catch (error) {
        if (active && ownsSession({ ...started, sourceFile: imageFile })) setMsg({ text: error instanceof ApiError ? error.message : "Couldn’t verify the physical product source. No cleanup request was made.", tone: "error" });
      }
    });
    return () => { active = false; };
  }, [beginSession, imageFile, imageUrl, ownsSession, target]);

  useEffect(() => {
    const started = beginSession(imageFile);
    if (!started) return;
    let active = true;
    void api.studioPresets().then((next) => {
      if (active && ownsSession({ ...started, sourceFile: imageFile })) setPresets(next);
    }).catch((error) => {
      if (active && ownsSession({ ...started, sourceFile: imageFile })) {
        setPresets({ enabled: false, custom: false, colors: [], scenes: [] });
        setMsg({ text: error instanceof ApiError ? error.message : "Couldn’t load Product Photo Cleanup options. No cleanup request was made.", tone: "error" });
      }
    });
    return () => { active = false; };
  }, [beginSession, imageFile, ownsSession]);

  const a = me?.account;
  const left = a ? Math.max(0, a.limits.studio - a.usage.studio) : null;

  async function make(style: StudioStyle, label: string) {
    const original = shots[0];
    const started = beginSession(original?.file);
    if (!original || !started || busy) {
      setMsg({ text: "The original physical product source is still being verified. No cleanup request was made.", tone: "error" });
      return;
    }
    setBusy(label); setMsg(null);
    try {
      const r = await api.studio({ image_file: original.file, style }, started.storeId);
      if (!ownsSession(started)) return;
      setShots((s) => { const next = [...s, { file: r.image_file, url: r.image_url, label }]; setSelected(next.length - 1); return next; });
      if (r.notice) setMsg({ text: r.notice, tone: "info" });
      scroller.current?.scrollTo({ y: 0, animated: true });
      account.refresh().catch(() => {});
    } catch (e) {
      if (ownsSession(started)) {
        setMsg({ text: e instanceof ApiError ? `${e.message} No cleanup candidate was applied.` : "Couldn’t make that cleanup candidate. Try again.", tone: "error" });
        scroller.current?.scrollTo({ y: 0, animated: true });
      }
    } finally { setBusy(null); }
  }

  async function use() {
    const shot = shots[selected];
    const started = beginSession(shots[0]?.file);
    if (!shot || !started || busy) {
      setMsg({ text: "This cleanup candidate no longer belongs to the current physical product source. Nothing was changed.", tone: "error" });
      return;
    }
    setBusy("use"); setMsg(null);
    try {
      if (target === "draft") {
        if (!ownsSession(started)) return;
        draftStore.patch({ image_file: shot.file, image_url: shot.url, localUri: undefined });
      } else {
        await api.updateProduct(target, { image_file: shot.file }, started.storeId);
        if (!ownsSession(started)) return;
      }
      router.back();
    } catch (e) {
      if (ownsSession(started)) setMsg({ text: e instanceof ApiError ? `${e.message} The product image was not changed.` : "Couldn’t save the cleanup candidate. The product image was not changed.", tone: "error" });
    } finally { if (ownsSession(started)) setBusy(null); }
  }

  const shot = shots[selected];
  const off = busy != null || !shots.length;
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <PageScroll ref={scroller} contentContainerStyle={{ padding: space.xl, gap: space.lg, paddingBottom: 120 + insets.bottom }} keyboardShouldPersistTaps="handled">
        <Text style={[type.small, { color: c.muted }]}>Pick a background or scene to make a new version of this photo. AI can change small details, so check the product still looks right before you use one.</Text>
        <View style={{ aspectRatio: 1, borderRadius: radius.lg, overflow: "hidden", backgroundColor: c.sunk }}>
          {shot?.url ? <Image source={{ uri: shot.url }} style={{ flex: 1 }} contentFit="cover" transition={200} accessibilityLabel={`${shot.label} photo`} /> : <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: space.lg }}><Text style={[type.small, { color: c.muted, textAlign: "center" }]}>{msg?.tone === "error" ? "This photo can't be cleaned up from here." : "Loading the product photo…"}</Text></View>}
          {busy && busy !== "use" ? (
            <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", gap: space.sm, padding: space.lg }}>
              <ActivityIndicator color="#fff" size="large" />
              <Text style={[type.heading, { color: "#fff", textAlign: "center" }]}>Creating your new photo…</Text>
              <Text style={[type.small, { color: "#fff", textAlign: "center" }]}>This takes a few seconds.</Text>
            </View>
          ) : null}
          <View style={{ position: "absolute", left: 12, bottom: 12, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5 }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: "#fff" }}>{shot?.label || "Loading"}</Text>
          </View>
        </View>

        {shots.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
            {shots.map((s, i) => (
              <Pressable key={s.file + i} onPress={() => setSelected(i)} accessibilityRole="button" accessibilityState={{ selected: i === selected }} accessibilityLabel={`Show ${s.label}`}
                style={{ width: 72, height: 72, borderRadius: radius.md, overflow: "hidden", borderWidth: 2, borderColor: i === selected ? c.accent : "transparent" }}>
                <Image source={{ uri: s.url }} style={{ flex: 1 }} contentFit="cover" />
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
        <Notice text={msg?.text ?? null} tone={msg?.tone} />

        {!presets ? (msg?.tone === "error" ? null : <ActivityIndicator color={c.accent} />) : !presets.enabled ? (
          <Notice text="The photo studio is being switched on. Check back soon." tone="info" />
        ) : (
          <>
            {left != null ? <Text style={[type.small, { color: c.muted }]}>Each new version starts from your original photo. {left} of {a!.limits.studio} photo edits left{a!.plan === "free" ? "" : " this month"}.</Text> : null}
            <View style={{ gap: space.sm }}>
              <H2>Clean background</H2>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
                {presets.colors.map((col) => (
                  <Pressable key={col.id} disabled={off} onPress={() => make({ color: col.id }, col.name)} accessibilityRole="button" accessibilityLabel={`${col.name} background`}
                    style={{ alignItems: "center", gap: 4, width: 60, opacity: off ? 0.5 : 1 }}>
                    <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: `#${col.hex}`, borderWidth: 1, borderColor: c.line }} />
                    <Text style={[type.small, { color: c.ink }]} numberOfLines={1}>{col.name}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={{ gap: space.sm }}>
              <H2>Scenes</H2>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
                {presets.scenes.map((s) => {
                  const look = SCENE_LOOK[s.id] ?? { bg: c.surface, fg: c.ink, icon: "image-outline" as const };
                  return (
                    <Pressable key={s.id} disabled={off} onPress={() => make({ scene: s.id }, s.name)} accessibilityRole="button" accessibilityLabel={`${s.name} scene`}
                      style={({ pressed }) => ({ width: "48.5%", height: 64, borderRadius: radius.md, backgroundColor: look.bg, paddingHorizontal: space.md, flexDirection: "row", alignItems: "center", gap: space.sm, opacity: off ? 0.5 : pressed ? 0.85 : 1 })}>
                      <Ionicons name={look.icon} size={20} color={look.fg} />
                      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: look.fg, flex: 1 }} numberOfLines={1}>{s.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            {presets.custom ? <View style={{ gap: space.sm }}>
              <Field label="Describe your own" hint="Say where the product should be, like “on a rustic brick wall” or “in a snowy cabin window”." value={prompt} onChangeText={setPrompt}
                placeholder="on a granite kitchen counter" maxLength={300} returnKeyType="go" onSubmitEditing={() => prompt.trim().length > 2 && make({ prompt: prompt.trim() }, "your background")} />
              <Button label="Make this background" variant="secondary" disabled={off || prompt.trim().length < 3} onPress={() => make({ prompt: prompt.trim() }, "your background")} />
            </View> : null}
          </>
        )}
      </PageScroll>
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: space.lg, paddingBottom: space.lg + insets.bottom, backgroundColor: c.surface, borderTopWidth: 1, borderColor: c.line }}>
        <View style={[column, { paddingHorizontal: column ? space.xl : space.xl - space.lg }]}>
          <Button style={{ alignSelf: "stretch" }} label={!shot ? (msg?.tone === "error" ? "Go back" : "Loading the photo…") : selected === 0 ? "Keep the original" : "Use this photo"} loading={busy === "use"} disabled={(!shot && msg?.tone !== "error") || (!!shot && off && busy !== "use")} onPress={!shot || selected === 0 ? () => router.back() : use} />
        </View>
      </View>
    </View>
  );
}

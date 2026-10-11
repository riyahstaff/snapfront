import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Button, Field, H2, Notice } from "@/components/ui";
import { api, ApiError, type StudioPresets, type StudioStyle } from "@/lib/api";
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

/**
 * Photo studio: put the product on a clean colour or a scene. Opened from a draft (target=draft)
 * or a saved product (target=<product id>); "Use this photo" puts the chosen picture on it.
 */
export default function StudioScreen() {
  const c = useColors();
  const me = useMe();
  const insets = useSafeAreaInsets();
  const { target, image_file, image_url } = useLocalSearchParams<{ target: string; image_file: string; image_url: string }>();
  const original: Shot = { file: image_file, url: image_url, label: "Original" };
  const [presets, setPresets] = useState<StudioPresets | null>(null);
  const [shots, setShots] = useState<Shot[]>([original]);
  const [selected, setSelected] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [msg, setMsg] = useState<{ text: string; tone: "error" | "ok" | "info" } | null>(null);
  const scroller = useRef<ScrollView>(null);

  useEffect(() => { api.studioPresets().then(setPresets).catch(() => setPresets({ enabled: false, custom: false, colors: [], scenes: [] })); }, []);

  const a = me?.account;
  const left = a ? Math.max(0, a.limits.studio - a.usage.studio) : null;

  async function make(style: StudioStyle, label: string) {
    setBusy(label); setMsg(null);
    try {
      const r = await api.studio({ image_file: original.file, style });
      setShots((s) => { const next = [...s, { file: r.image_file, url: r.image_url, label }]; setSelected(next.length - 1); return next; });
      if (r.notice) setMsg({ text: r.notice, tone: "info" });
      scroller.current?.scrollTo({ y: 0, animated: true });
      account.refresh().catch(() => {});
    } catch (e) {
      if (!(e instanceof ApiError && e.upgrade)) { setMsg({ text: e instanceof ApiError ? e.message : "Couldn’t make that photo. Try again.", tone: "error" }); scroller.current?.scrollTo({ y: 0, animated: true }); }
    } finally { setBusy(null); }
  }

  async function use() {
    const shot = shots[selected];
    setBusy("use"); setMsg(null);
    try {
      if (target === "draft") draftStore.patch({ image_file: shot.file, image_url: shot.url, localUri: undefined });
      else await api.updateProduct(target, { image_file: shot.file });
      router.back();
    } catch (e) {
      setMsg({ text: e instanceof ApiError ? e.message : "Couldn’t save the photo.", tone: "error" });
      setBusy(null);
    }
  }

  const shot = shots[selected];
  const off = busy != null;
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView ref={scroller} contentContainerStyle={{ padding: space.lg, gap: space.lg, paddingBottom: 120 + insets.bottom }} keyboardShouldPersistTaps="handled">
        <View style={{ aspectRatio: 1, borderRadius: radius.lg, overflow: "hidden", backgroundColor: c.sunk }}>
          {shot.url ? <Image source={{ uri: shot.url }} style={{ flex: 1 }} contentFit="cover" transition={200} accessibilityLabel={`${shot.label} photo`} /> : null}
          {busy && busy !== "use" ? (
            <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", gap: space.sm, padding: space.lg }}>
              <ActivityIndicator color="#fff" size="large" />
              <Text style={[type.heading, { color: "#fff", textAlign: "center" }]}>Creating your new photo…</Text>
              <Text style={[type.small, { color: "#fff", textAlign: "center" }]}>This takes a few seconds.</Text>
            </View>
          ) : null}
          <View style={{ position: "absolute", left: 12, bottom: 12, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5 }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: "#fff" }}>{shot.label}</Text>
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

        {!presets ? <ActivityIndicator color={c.accent} /> : !presets.enabled ? (
          <Notice text="The photo studio is being switched on. Check back soon." tone="info" />
        ) : (
          <>
            {left != null ? <Text style={[type.small, { color: c.muted }]}>Your product stays exactly as it is in your photo. Only the background changes. {left} of {a!.limits.studio} studio edits left{a!.plan === "free" ? "" : " this month"}.</Text> : null}
            <View style={{ gap: space.sm }}>
              <H2>Clean background</H2>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md }}>
                {presets.colors.map((col) => (
                  <Pressable key={col.id} disabled={off} onPress={() => make({ color: col.id }, col.name)} accessibilityRole="button" accessibilityLabel={`${col.name} background`}
                    style={{ alignItems: "center", gap: 4, width: 64, opacity: off ? 0.5 : 1 }}>
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
      </ScrollView>
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: space.lg, paddingBottom: space.lg + insets.bottom, backgroundColor: c.surface, borderTopWidth: 1, borderColor: c.line }}>
        <Button label={selected === 0 ? "Keep the original" : "Use this photo"} loading={busy === "use"} disabled={off && busy !== "use"} onPress={selected === 0 ? () => router.back() : use} />
      </View>
    </View>
  );
}

import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button, Field, H2, Notice } from "@/components/ui";
import { api, ApiError, type StoreTheme } from "@/lib/api";
import { account, useMe } from "@/lib/account-store";
import { fonts, radius, space, type, useColors } from "@/lib/theme";

type Msg = { text: string; tone: "ok" | "error" } | null;
const errText = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);

/** Store look: the classic editor plus a link to the premium builder and all 45 themes. */
export default function LooksScreen() {
  const c = useColors();
  const me = useMe();
  const insets = useSafeAreaInsets();
  const [themes, setThemes] = useState<StoreTheme[] | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const current = me?.theme ?? "classic";
  const chosen = themes?.find((t) => t.id === (picked ?? current));

  useEffect(() => {
    api.themes().then(setThemes).catch((e) => setMsg({ text: errText(e, "Couldn’t load store looks."), tone: "error" }));
    api.products().then((list) => setPhoto(list.find((p) => p.image_url)?.image_url ?? null)).catch(() => {});
  }, []);

  async function apply() {
    if (!chosen) return;
    setSaving(true); setMsg(null);
    try {
      await api.updateStore({ theme: chosen.id });
      await account.refresh();
      setPicked(null);
      setMsg({ text: `Your store now uses ${chosen.name}.`, tone: "ok" });
    } catch (e) { setMsg({ text: errText(e, "Couldn’t change your store look."), tone: "error" }); }
    finally { setSaving(false); }
  }

  if (!themes) return (
    <View style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center", padding: space.lg }}>
      {msg ? <Notice text={msg.text} tone="error" /> : <ActivityIndicator color={c.accent} />}
    </View>
  );
  const changed = picked != null && picked !== current;
  const cover = me?.banner_url ?? photo;
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <FlatList
        data={themes}
        keyExtractor={(t) => t.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: 150 + insets.bottom }}
        ListHeaderComponent={
          <View style={{ gap: space.lg, marginBottom: space.sm }}>
            <StorefrontDetails />
            <View style={{ gap: space.sm, backgroundColor: c.flash, borderRadius: radius.lg, padding: space.lg }}>
              <Text style={[type.heading, { color: c.onFlash }]}>Build a premium storefront</Text>
              <Text style={[type.small, { color: c.onFlash }]}>Choose a premium look, stage a cover, edit words and review everything before one final public apply.</Text>
              <Button label="Open premium setup" variant="secondary" onPress={() => router.push("/storefront-setup")} />
            </View>
            <View style={{ gap: 4 }}>
              <H2>Choose a look</H2>
              <Text style={[type.small, { color: c.muted }]}>Each look changes your store’s colours, fonts and layout. Your products and prices stay the same. Tap Preview to see any look on your real store.</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <ThemeCard t={item} storeName={me?.store_name || "Your store"} photo={cover} selected={(picked ?? current) === item.id} current={current === item.id}
            onPress={() => { setPicked(item.id); setMsg(null); }} />
        )}
      />
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: space.lg, paddingBottom: space.lg + insets.bottom, gap: space.sm, backgroundColor: c.surface, borderTopWidth: 1, borderColor: c.line }}>
        <Notice text={msg?.text ?? null} tone={msg?.tone} />
        <View style={{ flexDirection: "row", gap: space.sm }}>
          <Button label="Preview" variant="secondary" icon={<Ionicons name="eye-outline" size={18} color={c.ink} />} style={{ flex: 1 }} disabled={!chosen || !me}
            onPress={() => chosen && me && WebBrowser.openBrowserAsync(`${me.store_url}${chosen.id === current ? "" : `?theme=${chosen.id}`}`)} />
          <Button label={changed ? `Use ${chosen?.name}` : "In use"} style={{ flex: 1.4 }} disabled={!changed} loading={saving} onPress={apply} />
        </View>
      </View>
    </View>
  );
}

/** Cover photo, announcement line and About text: what makes a storefront feel like a real brand. */
function StorefrontDetails() {
  const c = useColors();
  const me = useMe();
  const [announcement, setAnnouncement] = useState(me?.announcement ?? "");
  const [about, setAbout] = useState(me?.about ?? "");
  const [busy, setBusy] = useState<"photo" | "save" | "remove" | null>(null);
  const [msg, setMsg] = useState<Msg>(null);
  const dirty = announcement.trim() !== (me?.announcement ?? "") || about.trim() !== (me?.about ?? "");

  async function choose() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [16, 9], quality: 0.8, base64: true });
    const a = res.assets?.[0];
    if (res.canceled || !a?.base64) return;
    setBusy("photo"); setMsg(null);
    try { await api.setBanner(a.base64, "image/jpeg"); await account.refresh(); setMsg({ text: "Cover photo updated.", tone: "ok" }); }
    catch (e) { setMsg({ text: errText(e, "Couldn’t upload that photo."), tone: "error" }); }
    finally { setBusy(null); }
  }
  async function remove() {
    setBusy("remove"); setMsg(null);
    try { await api.removeBanner(); await account.refresh(); }
    catch (e) { setMsg({ text: errText(e, "Couldn’t remove the photo."), tone: "error" }); }
    finally { setBusy(null); }
  }
  async function save() {
    setBusy("save"); setMsg(null);
    try { await api.updateStore({ announcement: announcement.trim(), about: about.trim() }); await account.refresh(); setMsg({ text: "Saved. Your store shows the new words now.", tone: "ok" }); }
    catch (e) { setMsg({ text: errText(e, "Couldn’t save."), tone: "error" }); }
    finally { setBusy(null); }
  }

  return (
    <View style={{ gap: space.md, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, padding: space.lg }}>
      <H2>Your storefront</H2>
      <View style={{ gap: 6 }}>
        <Text style={[type.label, { color: c.ink }]}>Cover photo</Text>
        <Text style={[type.small, { color: c.muted }]}>The big picture at the top of your store. A wide lifestyle shot works best. Without one, your newest product photo is used.</Text>
        <Pressable onPress={choose} disabled={busy != null} accessibilityRole="button" accessibilityLabel={me?.banner_url ? "Change cover photo" : "Choose a cover photo"}
          style={{ aspectRatio: 16 / 9, borderRadius: radius.md, overflow: "hidden", backgroundColor: c.sunk, borderWidth: me?.banner_url ? 0 : 2, borderStyle: "dashed", borderColor: c.line, alignItems: "center", justifyContent: "center", marginTop: 4 }}>
          {me?.banner_url ? <Image source={{ uri: me.banner_url }} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} contentFit="cover" /> : null}
          {busy === "photo" ? <ActivityIndicator color={c.accent} /> : !me?.banner_url ? (
            <View style={{ alignItems: "center", gap: 6 }}>
              <Ionicons name="image-outline" size={28} color={c.accent} />
              <Text style={[type.label, { color: c.accent }]}>Choose a cover photo</Text>
            </View>
          ) : null}
        </Pressable>
        {me?.banner_url ? (
          <View style={{ flexDirection: "row", gap: space.sm }}>
            <Button label="Change photo" variant="secondary" style={{ flex: 1 }} disabled={busy != null} onPress={choose} />
            <Button label="Remove" variant="ghost" loading={busy === "remove"} disabled={busy != null} onPress={remove} />
          </View>
        ) : null}
      </View>
      <Field label="Announcement" hint="One short line in the strip above your menu. Leave blank to show your shipping offer." value={announcement} onChangeText={setAnnouncement}
        placeholder="Holiday orders ship by December 18" maxLength={90} />
      <Field label="About your store" hint="A few sentences for the About section: who you are and what you make." value={about} onChangeText={setAbout}
        placeholder="We’re a two-person studio making…" multiline maxLength={600} style={{ minHeight: 96, textAlignVertical: "top" }} />
      <Button label="Save" disabled={!dirty || busy != null} loading={busy === "save"} onPress={save} />
      <Notice text={msg?.text ?? null} tone={msg?.tone} />
    </View>
  );
}

function ThemeCard({ t, storeName, photo, selected, current, onPress }: { t: StoreTheme; storeName: string; photo: string | null; selected: boolean; current: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={`${t.name}${current ? ", current look" : ""}. For ${t.for}. ${t.vibe}`}
      style={({ pressed }) => ({ backgroundColor: c.surface, borderRadius: radius.lg, borderWidth: selected ? 2 : 1, borderColor: selected ? c.accent : c.line,
        padding: selected ? space.md - 1 : space.md, gap: space.md, opacity: pressed ? 0.92 : 1 })}>
      <Mock t={t} storeName={storeName} photo={photo} />
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: space.sm }}>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
            <Text style={[type.heading, { color: c.ink }]}>{t.name}</Text>
            {current ? <Text style={[type.label, { color: c.good }]}>Current</Text> : null}
          </View>
          <Text style={[type.small, { color: c.ink, fontFamily: fonts.bodyMedium }]}>For {t.for.charAt(0).toLowerCase() + t.for.slice(1)}</Text>
          <Text style={[type.small, { color: c.muted }]}>{t.vibe}. Fonts: {t.fonts.display} and {t.fonts.body}.</Text>
        </View>
        <Ionicons name={selected ? "radio-button-on" : "radio-button-off"} size={22} color={selected ? c.accent : c.muted} />
      </View>
    </Pressable>
  );
}

/** A small drawing of the storefront's top half in this theme, using the seller's own photo. */
function Mock({ t, storeName, photo }: { t: StoreTheme; storeName: string; photo: string | null }) {
  const k = t.colors;
  const r = Math.min(t.shape.radius, 14) * 0.5;
  const upper = t.shape.upper === "all";
  const lines = (color: string, center = false, big = 1) => (
    <View style={{ gap: 4, alignItems: center ? "center" : "flex-start" }}>
      <View style={{ height: 7 * big, width: 92 * big, borderRadius: 2, backgroundColor: color }} />
      <View style={{ height: 7 * big, width: 64 * big, borderRadius: 2, backgroundColor: color }} />
      <View style={{ height: 3, width: 70, borderRadius: 2, backgroundColor: color, opacity: 0.45, marginTop: 3 }} />
      <View style={{ height: 10, width: 38, borderRadius: Math.min(t.shape.button, 5), backgroundColor: color === "#FFFFFF" ? k.accent : color, marginTop: 4 }} />
    </View>
  );
  const hero = (() => {
    switch (t.shape.hero) {
      case "overlay": return (
        <View style={{ flex: 1 }}>
          <Pic photo={photo} fill={k.line} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.35)" }} />
          <View style={{ flex: 1, justifyContent: "flex-end", padding: 10 }}>{lines("#FFFFFF")}</View>
        </View>);
      case "split": return (
        <View style={{ flex: 1, flexDirection: "row" }}>
          <View style={{ flex: 1, backgroundColor: k.panel, justifyContent: "center", padding: 10 }}>{lines(k.onPanel)}</View>
          <Pic photo={photo} fill={k.line} style={{ flex: 1.1 }} />
        </View>);
      case "collage": return (
        <View style={{ flex: 1, flexDirection: "row", gap: 6, padding: 8 }}>
          <View style={{ flex: 0.9, justifyContent: "center" }}>{lines(k.ink)}</View>
          <Pic photo={photo} fill={k.line} style={{ flex: 0.7, borderRadius: r }} />
          <View style={{ flex: 0.55, gap: 6 }}><Pic photo={photo} fill={k.line} style={{ flex: 1, borderRadius: r }} /><View style={{ flex: 1, borderRadius: r, backgroundColor: k.surface }} /></View>
        </View>);
      case "editorial": return (
        <View style={{ flex: 1, padding: 8, gap: 6, alignItems: "center" }}>
          <View style={{ height: 6, width: 110, borderRadius: 2, backgroundColor: k.ink }} />
          <View style={{ height: 6, width: 80, borderRadius: 2, backgroundColor: k.ink }} />
          <Pic photo={photo} fill={k.line} style={{ flex: 1, alignSelf: "stretch", borderRadius: r }} />
        </View>);
      case "type": return (
        <View style={{ flex: 1, padding: 8, gap: 6 }}>
          <Text numberOfLines={1} style={{ fontFamily: fonts.display, fontSize: 26, lineHeight: 28, color: k.ink, letterSpacing: -0.5 }}>{upper ? storeName.toUpperCase() : storeName}</Text>
          <View style={{ flex: 1, flexDirection: "row", gap: 5 }}>
            <Pic photo={photo} fill={k.line} style={{ flex: 1, borderRadius: r }} />{[0, 1, 2].map((i) => <View key={i} style={{ flex: 1, borderRadius: r, backgroundColor: k.surface }} />)}
          </View>
        </View>);
      default: return (
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", padding: 10, gap: 10 }}>
          <View style={{ flex: 1 }}>{lines(k.ink)}</View>
          <View style={{ width: 74, height: 74, borderRadius: 14, shadowColor: k.accent, shadowOpacity: 0.9, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 8, backgroundColor: k.accent }}>
            <Pic photo={photo} fill={k.line} style={{ flex: 1, borderRadius: 14 }} />
          </View>
        </View>);
    }
  })();
  const centered = t.shape.header !== "split";
  return (
    <View style={{ height: 190, borderRadius: radius.md, overflow: "hidden", backgroundColor: k.bg, borderWidth: 1, borderColor: k.line }} importantForAccessibility="no-hide-descendants">
      <View style={{ height: 8, backgroundColor: k.bar }} />
      <View style={{ height: 26, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", justifyContent: centered ? "center" : "space-between", borderBottomWidth: 1, borderColor: k.line }}>
        <Text numberOfLines={1} style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: k.ink, maxWidth: "70%" }}>{upper ? storeName.toUpperCase() : storeName}</Text>
        <Ionicons name="bag-outline" size={13} color={k.ink} style={centered ? { position: "absolute", right: 10 } : undefined} />
      </View>
      <View style={{ height: 112 }}>{hero}</View>
      <View style={{ flex: 1, flexDirection: "row", gap: 6, padding: 8 }}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={{ flex: 1, borderRadius: r, backgroundColor: t.shape.card === "pastel" ? ["#FFE3EA", "#DDEFFF", "#FFF1BF", "#DDF5E4"][i] : k.surface,
            borderWidth: t.shape.card === "bold" ? 1.5 : t.shape.card === "boxed" || t.shape.card === "glass" ? 1 : 0, borderColor: t.shape.card === "bold" ? k.ink : k.line }} />
        ))}
      </View>
    </View>
  );
}

function Pic({ photo, fill, style }: { photo: string | null; fill: string; style?: object }) {
  return (
    <View style={[{ backgroundColor: fill, overflow: "hidden" }, style]}>
      {photo ? <Image source={{ uri: photo }} style={{ flex: 1 }} contentFit="cover" /> : null}
    </View>
  );
}

import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Field, H2, Notice, PageScroll } from "@/components/ui";
import { ThemePicker } from "@/components/theme-picker";
import { api, ApiError, type StoreTheme } from "@/lib/api";
import { EMPTY_THEME_BROWSE, type ThemeBrowseState } from "@/lib/theme-catalog";
import { account, useMe } from "@/lib/account-store";
import { radius, space, type, useColors } from "@/lib/theme";

type Msg = { text: string; tone: "ok" | "error" } | null;
const errText = (e: unknown, fallback: string) => e instanceof ApiError ? e.message : fallback;

/** Quick storefront edits and the same complete catalog used by the setup wizard. */
export default function LooksScreen() {
  const params = useLocalSearchParams<{ query?: string }>();
  const query = typeof params.query === "string" ? params.query.slice(0, 120) : "";
  return <LooksEditor key={query} initialQuery={query} />;
}
function LooksEditor({ initialQuery }: { initialQuery: string }) {
  const c = useColors();
  const scroll = useRef<ScrollView>(null);
  const me = useMe();
  const insets = useSafeAreaInsets();
  const [themes, setThemes] = useState<StoreTheme[] | null>(null);
  const [photoState, setPhotoState] = useState<{ storeId: string; url: string | null } | null>(null);
  const [pickState, setPickState] = useState<{ storeId: string; id: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const [catalogAttempt, setCatalogAttempt] = useState(0);
  const [browse, setBrowse] = useState<ThemeBrowseState>({ ...EMPTY_THEME_BROWSE, query: initialQuery });
  const current = me?.theme ?? "classic";
  const picked = pickState?.storeId === me?.id ? pickState?.id ?? null : null;
  const photo = photoState?.storeId === me?.id ? photoState?.url ?? null : null;
  const chosen = themes?.find((theme) => theme.id === (picked ?? current));

  useEffect(() => {
    let alive = true;
    api.themes().then((next) => { if (alive) setThemes(next); })
      .catch((error) => { if (alive) setMsg({ text: errText(error, "Couldn’t load store looks."), tone: "error" }); });
    return () => { alive = false; };
  }, [catalogAttempt]);
  useEffect(() => {
    let alive = true;
    const storeId = me?.id;
    api.products().then((list) => { if (alive && storeId) setPhotoState({ storeId, url: list.find((product) => product.status === "live" && product.image_url)?.image_url ?? null }); }).catch(() => {});
    return () => { alive = false; };
  }, [me?.id]);

  function retryCatalog() { setThemes(null); setMsg(null); setCatalogAttempt((attempt) => attempt + 1); }
  async function apply() {
    if (!chosen || !me || saving) return;
    const owner = me.id;
    const revision = api.storeRevision();
    setSaving(true); setMsg(null);
    try {
      const updated = await api.updateStore({ theme: chosen.id }, owner);
      if (revision !== api.storeRevision() || account.get()?.id !== owner) return;
      account.set(updated); setPickState(null);
      setMsg({ text: `Your store now uses ${chosen.name}.`, tone: "ok" });
    } catch (error) { setMsg({ text: errText(error, "Couldn’t change your store look."), tone: "error" }); }
    finally { setSaving(false); }
  }

  if (!themes) return <View style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center", padding: space.lg }}>
    {msg ? <View style={{ width: "100%", gap: space.md }}><Notice text={msg.text} tone="error" /><Button label="Retry catalog" onPress={retryCatalog} /></View> : <ActivityIndicator color={c.accent} />}
  </View>;

  const changed = picked != null && picked !== current;
  return <View style={{ flex: 1, backgroundColor: c.bg }}>
    <PageScroll ref={scroll} width="wide" keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: space.xl, gap: space.xl, paddingBottom: 48 + insets.bottom }}>
      <View style={{ gap: space.sm }}>
        <H2>Find your store’s look</H2>
        <Text style={[type.body, { color: c.muted, maxWidth: 680 }]}>Explore complete designs, then make one yours. Preview a look up close or choose Customize to replace its photos and words.</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: space.md, paddingVertical: space.md, borderTopWidth: 1, borderBottomWidth: 1, borderColor: c.line }}>
        <View style={{ flex: 1, minWidth: 180, gap: 4 }}>
          <Text style={[type.label, { color: c.ink }]}>Current look: {themes.find((theme) => theme.id === current)?.name || current}</Text>
          <Text style={[type.small, { color: c.muted }]}>Your live store stays the same until you finish setup.</Text>
        </View>
        <Button label="Continue store setup" variant="secondary" disabled={saving || !me} onPress={() => router.push("/storefront-setup")} />
      </View>
      <Notice text={msg?.text ?? null} tone={msg?.tone} />
      <ThemePicker themes={themes} selected={picked ?? current} current={current} storeName={me?.store_name || "Your store"} photo={me?.banner_url ?? photo}
        browse={browse} onBrowse={(next) => { setBrowse(next); if (next.page !== browse.page) scroll.current?.scrollTo({ y: 0, animated: true }); }} onSelect={(id) => { if (me) setPickState({ storeId: me.id, id }); setMsg(null); }} disabled={saving} onRetry={retryCatalog}
        onCustomize={advanced ? undefined : (id) => router.push({ pathname: "/storefront-setup", params: { theme: id } })} />
      <Button label={advanced ? "Hide quick edits" : "Already have a store? Optional quick edits"} variant="ghost" onPress={() => setAdvanced(!advanced)} disabled={saving} />
      {advanced ? <View style={{ gap: space.md }}>
        <Notice text="Quick edits change your live store immediately. Hide quick edits to return to guided customization." />
        <StorefrontDetails key={me?.id} />
        {changed && (me?.banner_url || photo) ? <Button label="Only change my existing store’s style" variant="secondary" disabled={!chosen || saving} loading={saving} onPress={apply} /> : null}
      </View> : null}
    </PageScroll>
  </View>;
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
    const asset = res.assets?.[0];
    if (res.canceled || !asset?.base64) return;
    setBusy("photo"); setMsg(null);
    try { await api.setBanner(asset.base64, "image/jpeg"); await account.refresh(); setMsg({ text: "Cover photo updated.", tone: "ok" }); }
    catch (error) { setMsg({ text: errText(error, "Couldn’t upload that photo."), tone: "error" }); }
    finally { setBusy(null); }
  }
  async function remove() {
    setBusy("remove"); setMsg(null);
    try { await api.removeBanner(); await account.refresh(); }
    catch (error) { setMsg({ text: errText(error, "Couldn’t remove the photo."), tone: "error" }); }
    finally { setBusy(null); }
  }
  async function save() {
    setBusy("save"); setMsg(null);
    try { await api.updateStore({ announcement: announcement.trim(), about: about.trim() }); await account.refresh(); setMsg({ text: "Saved. Your store shows the new words now.", tone: "ok" }); }
    catch (error) { setMsg({ text: errText(error, "Couldn’t save."), tone: "error" }); }
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
          {me?.banner_url ? <Image source={{ uri: me.banner_url }} recyclingKey={me.banner_url} cachePolicy="memory-disk" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} contentFit="cover" /> : null}
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

import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button, Field, H2, Notice } from "@/components/ui";
import { ThemePreview } from "@/components/theme-preview";
import { api, ApiError, type StoreTheme, type ThemeGroup } from "@/lib/api";
import { account, useMe } from "@/lib/account-store";
import { fonts, radius, space, type, useColors } from "@/lib/theme";

type Msg = { text: string; tone: "ok" | "error" } | null;
type GroupFilter = "all" | ThemeGroup;

const errText = (e: unknown, fallback: string) => e instanceof ApiError ? e.message : fallback;
const groupName = (group: ThemeGroup) => group.charAt(0).toUpperCase() + group.slice(1);
const themeSearchText = (theme: StoreTheme) => [theme.name, theme.category, theme.for, theme.vibe].filter(Boolean).join(" ").toLocaleLowerCase();

/** Store look: original quick editor plus a searchable, virtualized catalog of available looks. */
export default function LooksScreen() {
  const c = useColors();
  const me = useMe();
  const insets = useSafeAreaInsets();
  const [themes, setThemes] = useState<StoreTheme[] | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const [catalogAttempt, setCatalogAttempt] = useState(0);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<GroupFilter>("all");
  const current = me?.theme ?? "classic";
  const chosen = themes?.find((theme) => theme.id === (picked ?? current));

  useEffect(() => {
    let alive = true;
    api.themes()
      .then((next) => { if (alive) setThemes(next); })
      .catch((error) => { if (alive) setMsg({ text: errText(error, "Couldn’t load store looks."), tone: "error" }); });
    return () => { alive = false; };
  }, [catalogAttempt]);

  function retryCatalog() {
    setThemes(null);
    setMsg(null);
    setCatalogAttempt((attempt) => attempt + 1);
  }

  useEffect(() => {
    api.products().then((list) => setPhoto(list.find((product) => product.image_url)?.image_url ?? null)).catch(() => {});
  }, []);

  const groups = useMemo(() => {
    const found = new Set<ThemeGroup>();
    themes?.forEach((theme) => { if (theme.group) found.add(theme.group); });
    return Array.from(found);
  }, [themes]);
  const filteredThemes = useMemo(() => {
    if (!themes) return [];
    const search = query.trim().toLocaleLowerCase();
    return themes.filter((theme) => (group === "all" || theme.group === group) && (!search || themeSearchText(theme).includes(search)));
  }, [themes, group, query]);

  async function apply() {
    if (!chosen) return;
    setSaving(true); setMsg(null);
    try {
      await api.updateStore({ theme: chosen.id });
      await account.refresh();
      setPicked(null);
      setMsg({ text: `Your store now uses ${chosen.name}.`, tone: "ok" });
    } catch (error) { setMsg({ text: errText(error, "Couldn’t change your store look."), tone: "error" }); }
    finally { setSaving(false); }
  }

  if (!themes) return (
    <View style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center", padding: space.lg }}>
      {msg ? <View style={{ width: "100%", gap: space.md }}><Notice text={msg.text} tone="error" /><Button label="Retry catalog" onPress={retryCatalog} /></View> : <ActivityIndicator color={c.accent} />}
    </View>
  );

  const changed = picked != null && picked !== current;
  const cover = me?.banner_url ?? photo;
  const catalogCount = filteredThemes.length === themes.length
    ? `${themes.length} available look${themes.length === 1 ? "" : "s"}`
    : `${filteredThemes.length} of ${themes.length} available looks`;
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <FlatList
        data={filteredThemes}
        keyExtractor={(theme) => theme.id}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={5}
        removeClippedSubviews
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
              <H2>Browse store looks</H2>
              <Text style={[type.small, { color: c.muted }]}>Search by look name, category, what you sell or vibe. Images marked Demo imagery illustrate a theme; Preview below opens your real store with the selected look.</Text>
            </View>
            <Field label="Search looks" value={query} onChangeText={setQuery} placeholder="Try candles, beauty, minimal…" returnKeyType="search" />
            {groups.length ? (
              <View style={{ gap: space.sm }}>
                <Text style={[type.label, { color: c.ink }]}>Collection group</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
                  {(["all", ...groups] as GroupFilter[]).map((item) => {
                    const active = item === group;
                    const label = item === "all" ? "All looks" : groupName(item);
                    return (
                      <Pressable key={item} accessibilityRole="radio" accessibilityState={{ selected: active }} onPress={() => setGroup(item)}
                        style={{ borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: active ? c.accent : c.surface, borderWidth: 1, borderColor: active ? c.accent : c.line }}>
                        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: active ? c.onAccent : c.ink }}>{label}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}
            <Text accessibilityLiveRegion="polite" style={[type.small, { color: c.muted }]}>{catalogCount}</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={{ gap: space.md, paddingVertical: space.md }}>
            <Notice text={themes.length ? "No looks match that search or group. Clear a filter and try again." : "The looks catalog is empty right now. Retry when you have a connection."} />
            {query || group !== "all" ? <Button label="Clear filters" variant="secondary" onPress={() => { setQuery(""); setGroup("all"); }} /> : <Button label="Retry catalog" variant="secondary" onPress={retryCatalog} />}
          </View>
        }
        renderItem={({ item }) => (
          <ThemeCard theme={item} storeName={me?.store_name || "Your store"} photo={cover} selected={(picked ?? current) === item.id} current={current === item.id}
            onPress={() => { setPicked(item.id); setMsg(null); }} />
        )}
      />
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: space.lg, paddingBottom: space.lg + insets.bottom, gap: space.sm, backgroundColor: c.surface, borderTopWidth: 1, borderColor: c.line }}>
        <Notice text={msg?.text ?? null} tone={msg?.tone} />
        <View style={{ flexDirection: "row", gap: space.sm }}>
          <Button label="Preview" variant="secondary" icon={<Ionicons name="eye-outline" size={18} color={c.ink} />} style={{ flex: 1 }} disabled={!chosen || !me}
            onPress={() => chosen && me && WebBrowser.openBrowserAsync(`${me.store_url}${chosen.id === current ? "" : `?theme=${encodeURIComponent(chosen.id)}`}`)} />
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

function ThemeCard({ theme, storeName, photo, selected, current, onPress }: { theme: StoreTheme; storeName: string; photo: string | null; selected: boolean; current: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={`${theme.name}${current ? ", current look" : ""}. For ${theme.for}. ${theme.vibe}`}
      style={({ pressed }) => ({ backgroundColor: c.surface, borderRadius: radius.lg, borderWidth: selected ? 2 : 1, borderColor: selected ? c.accent : c.line,
        padding: selected ? space.md - 1 : space.md, gap: space.md, opacity: pressed ? 0.92 : 1 })}>
      <ThemePreview theme={theme} storeName={storeName} photo={photo} />
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: space.sm }}>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
            <Text style={[type.heading, { color: c.ink }]}>{theme.name}</Text>
            {current ? <Text style={[type.label, { color: c.good }]}>Current</Text> : null}
          </View>
          <Text style={[type.small, { color: c.ink, fontFamily: fonts.bodyMedium }]}>For {theme.for.charAt(0).toLowerCase() + theme.for.slice(1)}</Text>
          <Text style={[type.small, { color: c.muted }]}>{theme.vibe}. Fonts: {theme.fonts.display} and {theme.fonts.body}.</Text>
        </View>
        <Ionicons name={selected ? "radio-button-on" : "radio-button-off"} size={22} color={selected ? c.accent : c.muted} />
      </View>
    </Pressable>
  );
}

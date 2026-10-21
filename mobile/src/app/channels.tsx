import React, { useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import * as Clipboard from "expo-clipboard";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { Body, Button, Field, H2, Notice, PageScroll } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { account, useMe } from "@/lib/account-store";
import { saveToPhone, shareFile } from "@/lib/media";
import { radius, space, type, useColors } from "@/lib/theme";

type Msg = { text: string; tone: "ok" | "error" | "info" } | null;

/** Get more buyers: link in bio, QR code, Google and Instagram/Facebook shopping, checkout reminders. */
export default function ChannelsScreen() {
  const c = useColors();
  const me = useMe();
  const [links, setLinks] = useState(me?.links ?? []);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<Msg>(null);
  if (!me) return null;
  const dirty = JSON.stringify(links) !== JSON.stringify(me.links);
  const pro = me.account.plan === "pro";
  const qr = api.qrUrl(`${me.links_url}?utm_source=qr`);

  const copy = async (text: string, what: string) => { await Clipboard.setStringAsync(text); setMsg({ text: `${what} copied.`, tone: "ok" }); };
  async function saveLinks() {
    setBusy("links"); setMsg(null);
    try { await api.updateStore({ links: links.filter((l) => l.label.trim() || l.url.trim()) }); await account.refresh(); setMsg({ text: "Links saved.", tone: "ok" }); }
    catch (e) { setMsg({ text: e instanceof ApiError ? e.message : "Couldn’t save links.", tone: "error" }); }
    finally { setBusy(null); }
  }
  const urlRow = (label: string, url: string) => (
    <Pressable onPress={() => copy(url, label)} accessibilityRole="button" accessibilityLabel={`Copy ${label}`}
      style={{ flexDirection: "row", alignItems: "center", gap: space.sm, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.md, padding: space.md }}>
      <View style={{ flex: 1 }}>
        <Text style={[type.label, { color: c.ink }]}>{label}</Text>
        <Text selectable numberOfLines={1} style={[type.small, { color: c.muted }]}>{url}</Text>
      </View>
      <Ionicons name="copy-outline" size={18} color={c.accent} />
    </Pressable>
  );

  return (
    <PageScroll style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: space.lg, paddingHorizontal: space.xl, gap: space.xl, paddingBottom: space.xxl }} keyboardShouldPersistTaps="handled">
      <Notice text={msg?.text ?? null} tone={msg?.tone} />

      <View style={{ gap: space.md }}>
        <H2>Link in bio</H2>
        <Body muted>One page for your Instagram or TikTok bio: your store, your newest products and any links you add.</Body>
        {urlRow("Your link-in-bio page", me.links_url)}
        <Button label="Open it" variant="secondary" onPress={() => WebBrowser.openBrowserAsync(me.links_url)} />
        {links.map((l, i) => (
          <View key={i} style={{ gap: space.sm, padding: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: c.line }}>
            <Field label="Button text" value={l.label} maxLength={40} placeholder="My TikTok" onChangeText={(label) => setLinks(links.map((x, j) => (j === i ? { ...x, label } : x)))} />
            <Field label="Web address" value={l.url} autoCapitalize="none" autoCorrect={false} keyboardType="url" placeholder="tiktok.com/@yourshop"
              onChangeText={(url) => setLinks(links.map((x, j) => (j === i ? { ...x, url } : x)))} />
            <Button label="Remove" variant="ghost" onPress={() => setLinks(links.filter((_, j) => j !== i))} />
          </View>
        ))}
        {links.length < 8 ? <Button label="Add a link" variant="ghost" icon={<Ionicons name="add" size={18} color={c.accent} />} onPress={() => setLinks([...links, { label: "", url: "" }])} /> : null}
        {dirty ? <Button label="Save links" loading={busy === "links"} onPress={saveLinks} /> : null}
      </View>

      <View style={{ gap: space.md }}>
        <H2>QR code</H2>
        <Body muted>Print it on packaging, flyers or a market table sign. It opens your link-in-bio page.</Body>
        <Image source={{ uri: qr }} style={{ width: 200, height: 200, alignSelf: "center", borderRadius: radius.md, backgroundColor: "#fff" }} accessibilityLabel="QR code for your store" />
        <View style={{ flexDirection: "row", gap: space.sm }}>
          <Button label="Save" variant="secondary" style={{ flex: 1 }} loading={busy === "qr"} onPress={async () => {
            setBusy("qr");
            try { setMsg((await saveToPhone([qr])) ? { text: "QR code saved to your phone.", tone: "ok" } : { text: "Allow photo access in Settings to save it.", tone: "error" }); }
            finally { setBusy(null); }
          }} />
          <Button label="Share" variant="secondary" style={{ flex: 1 }} onPress={() => shareFile(qr).catch(() => {})} />
        </View>
      </View>

      <View style={{ gap: space.md }}>
        <H2>Sell on Google</H2>
        <Body muted>Google shows products for free in Shopping results. Add this feed once in Google Merchant Center and it stays up to date.</Body>
        {urlRow("Google product feed", me.feeds.google)}
        <Text style={[type.small, { color: c.ink }]}>In Merchant Center: Products, Add products, Add from a file, Enter a link to your file. Paste the feed link and pick a daily schedule.</Text>
        <Button label="Open Google Merchant Center" variant="ghost" onPress={() => WebBrowser.openBrowserAsync("https://merchants.google.com")} />
      </View>

      <View style={{ gap: space.md }}>
        <H2>Shop on Instagram and Facebook</H2>
        <Body muted>Tag your products in posts and show a shop on your profile. Add this feed as a data feed in Meta Commerce Manager.</Body>
        {urlRow("Meta product feed", me.feeds.meta)}
        <Text style={[type.small, { color: c.ink }]}>In Commerce Manager: Catalog, Data sources, Data feed, then Use a URL. Paste the feed link and set it to update daily.</Text>
        <Button label="Open Commerce Manager" variant="ghost" onPress={() => WebBrowser.openBrowserAsync("https://business.facebook.com/commerce")} />
      </View>

      <View style={{ gap: space.md }}>
        <H2>Checkout reminders</H2>
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
          <Body style={{ flex: 1 }}>If a buyer leaves checkout, email them a link back to it a few hours later. Only buyers who agree to emails get one.</Body>
          <Switch value={pro && me.abandoned_emails} disabled={!pro} onValueChange={async (v) => {
            try { await api.updateStore({ abandoned_emails: v }); await account.refresh(); } catch { setMsg({ text: "Couldn’t change that.", tone: "error" }); }
          }} accessibilityLabel="Checkout reminders" />
        </View>
        {!pro ? <Button label="Comes with Pro" variant="ghost" onPress={() => router.push({ pathname: "/plans", params: { highlight: "pro" } })} /> : null}
      </View>
    </PageScroll>
  );
}

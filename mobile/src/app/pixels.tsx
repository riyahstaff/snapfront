// Ad pixels: paste the IDs from Meta, TikTok, Google Analytics and Pinterest, and the store reports
// views, add-to-carts, checkouts, purchases and sign-ups to them, so ads can find more buyers.
import React, { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Button, Field, Notice } from "@/components/ui";
import { Card } from "@/components/panel";
import { ApiError, pixels, type PixelKey, type PixelsView } from "@/lib/api";
import { space, type, useColors } from "@/lib/theme";

const EVENTS = [
  ["Page view", "Every page of your store"],
  ["View content", "Someone opens a product"],
  ["Add to cart", "A product goes in the cart"],
  ["Initiate checkout", "They tap Check out"],
  ["Purchase", "The order is paid, with its value"],
  ["Lead", "They join your email list"],
] as const;

export default function PixelsScreen() {
  const c = useColors();
  const [data, setData] = useState<PixelsView | null>(null);
  const [ids, setIds] = useState<Partial<Record<PixelKey, string>>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; tone: "ok" | "error" } | null>(null);
  useFocusEffect(useCallback(() => {
    pixels.get().then((d) => { setData(d); setIds(Object.fromEntries(d.pixels.map((p) => [p.key, p.id]))); })
      .catch((e) => setMsg({ text: e instanceof ApiError ? e.message : "Couldn't load your pixels.", tone: "error" }));
  }, []));

  async function save() {
    setBusy(true); setMsg(null);
    try {
      const d = await pixels.save(ids);
      setData(d); setIds(Object.fromEntries(d.pixels.map((p) => [p.key, p.id])));
      const n = d.pixels.filter((p) => p.id).length;
      setMsg({ text: n ? `Saved. ${n === 1 ? "Your pixel is" : `All ${n} pixels are`} live on your store now.` : "Saved. No pixels on your store.", tone: "ok" });
    } catch (e) { setMsg({ text: e instanceof ApiError ? e.message : "Couldn't save.", tone: "error" }); } finally { setBusy(false); }
  }

  if (!data) return <View style={{ flex: 1, backgroundColor: c.bg, padding: space.xl }}>{msg ? <Notice text={msg.text} tone="error" /> : <ActivityIndicator color={c.accent} />}</View>;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ padding: space.xl, gap: space.xl, paddingBottom: 64 }} keyboardShouldPersistTaps="handled">
      <Text style={[type.body, { color: c.muted }]}>Running ads? Add your pixel IDs so Meta, TikTok, Google and Pinterest can see who buys, measure your ads and find more people like your customers.</Text>
      {!data.allowed ? (
        <Card title="Ad pixels come with Snapfront Pro">
          <Button label="See plans" onPress={() => router.push({ pathname: "/plans", params: { highlight: "pro" } })} />
        </Card>
      ) : null}
      <Card>
        {data.pixels.map((p) => (
          <Field key={p.key} label={p.name} hint={p.hint} value={ids[p.key] ?? ""} onChangeText={(v) => setIds((x) => ({ ...x, [p.key]: v }))}
            autoCapitalize="characters" autoCorrect={false} editable={data.allowed || Boolean(ids[p.key])} placeholder={p.key === "ga4_id" ? "G-XXXXXXXXXX" : "Paste the ID"} />
        ))}
        <Notice text={msg?.text ?? null} tone={msg?.tone} />
        <Button label="Save pixels" onPress={save} loading={busy} />
      </Card>
      <Card title="What your store reports" sub="Sent automatically to every pixel above, in each platform's own event names.">
        {EVENTS.map(([name, when]) => (
          <View key={name} style={{ flexDirection: "row", justifyContent: "space-between", gap: space.md }}>
            <Text style={[type.heading, { color: c.ink }]}>{name}</Text>
            <Text style={[type.body, { color: c.muted, flexShrink: 1, textAlign: "right" }]}>{when}</Text>
          </View>
        ))}
        <Text style={[type.small, { color: c.muted }]}>Pixels never load in previews or theme demos, so testing your store doesn&apos;t count as visits or sales.</Text>
      </Card>
    </ScrollView>
  );
}

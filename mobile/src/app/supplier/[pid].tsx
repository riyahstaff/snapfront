import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Body, Button, Field, H2, Notice, Screen } from "@/components/ui";
import { api, ApiError, money, type CatalogProduct, type ImportResult, type SupplierId } from "@/lib/api";
import { account } from "@/lib/account-store";
import { fonts, radius, space, type, useColors } from "@/lib/theme";

const MAX_OPTIONS = 30;

const NAMES: Record<SupplierId, string> = { cj: "CJ", printful: "Printful", aliexpress: "AliExpress" };

/** A supplier's product: what it costs you, its options, and adding it to your store. */
export default function SupplierProductScreen() {
  const c = useColors();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ pid: string; source?: SupplierId }>();
  const pid = String(params.pid);
  const source: SupplierId = params.source && params.source in NAMES ? params.source : "cj";
  const [p, setP] = useState<CatalogProduct | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<ImportResult | null>(null);

  useEffect(() => {
    api.catalogProduct(source, pid)
      .then((r) => { setP(r); setPicked(new Set(r.variants.slice(0, MAX_OPTIONS).map((v) => v.vid))); })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Couldn't load this product."));
  }, [pid, source]);

  function toggle(vid: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(vid)) next.delete(vid);
      else if (next.size < MAX_OPTIONS) next.add(vid);
      return next;
    });
  }

  async function add() {
    if (!p) return;
    setBusy(true); setError(null);
    try {
      const n = Number(price.replace(/[^0-9.]/g, ""));
      const r = await api.importProduct(source, p.pid, { vids: p.variants.length ? [...picked] : undefined, price: n > 0 ? n : undefined });
      setDone(r);
      account.refresh().catch(() => {});
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't add this product. Try again.");
    } finally { setBusy(false); }
  }

  const header = <Stack.Screen options={{ title: `Product from ${NAMES[source]}` }} />;
  if (!p) {
    return (
      <Screen>
        {header}
        {error ? <Notice text={error} tone="error" /> : <ActivityIndicator color={c.accent} style={{ marginTop: space.xxl }} />}
      </Screen>
    );
  }

  if (done) {
    const pr = done.pricing;
    return (
      <Screen>
        {header}
        <View style={{ gap: space.sm }}>
          <Text accessibilityRole="header" style={[type.hero, { color: c.ink }]}>Added to{"\n"}your store</Text>
          <Body muted>It’s saved as a draft. Check the page, then publish when you’re happy.</Body>
        </View>
        <View style={{ flexDirection: "row", gap: space.md, alignItems: "center", backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, padding: space.md }}>
          <Image source={done.product.image_url ? { uri: done.product.image_url } : null} style={{ width: 64, height: 64, borderRadius: radius.sm, backgroundColor: c.sunk }} contentFit="cover" />
          <Text numberOfLines={3} style={[type.heading, { color: c.ink, flex: 1 }]}>{done.product.title}</Text>
        </View>
        <View style={{ backgroundColor: c.ink, borderRadius: radius.lg, padding: space.lg, gap: 6 }}>
          <Text style={[type.small, { color: c.bg, opacity: 0.8 }]}>Your price</Text>
          <Text style={{ fontFamily: fonts.display, fontSize: 40, color: c.flash }}>{money(pr.price)}</Text>
          <Text style={[type.body, { color: c.bg }]}>{money(pr.profit)} profit per sale after {money(pr.landed_cost)} product and shipping</Text>
          <Text style={[type.small, { color: c.bg, opacity: 0.8 }]}>Based on {pr.basis}.</Text>
          {pr.warning ? <Text style={[type.small, { color: c.flash }]}>{pr.warning}</Text> : null}
        </View>
        {done.market?.matches.length ? (
          <View style={{ gap: space.sm }}>
            <H2>Selling elsewhere for</H2>
            {done.market.matches.slice(0, 4).map((m) => (
              <View key={m.link} style={{ flexDirection: "row", justifyContent: "space-between", gap: space.md }}>
                <Text numberOfLines={1} style={[type.small, { color: c.ink, flex: 1 }]}>{m.store_name}: {m.title}</Text>
                <Text style={[type.label, { color: c.ink }]}>{money(m.price)}</Text>
              </View>
            ))}
          </View>
        ) : null}
        <Button label="Open the listing" onPress={() => router.replace({ pathname: "/product/[id]", params: { id: done.product.id } })} />
        <Button label="Find more products" variant="ghost" onPress={() => router.back()} />
      </Screen>
    );
  }

  const imgW = width - space.lg * 2;
  const allOn = picked.size === Math.min(p.variants.length, MAX_OPTIONS);
  return (
    <Screen>
      {header}
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -space.lg }}
        contentContainerStyle={{ paddingHorizontal: space.lg, gap: space.lg }} snapToInterval={imgW + space.lg} decelerationRate="fast">
        {p.images.map((u, i) => (
          <Image key={u} source={{ uri: u }} accessibilityLabel={`Photo ${i + 1} of ${p.images.length}`}
            style={{ width: imgW, height: imgW, borderRadius: radius.lg, backgroundColor: c.sunk }} contentFit="cover" transition={150} />
        ))}
      </ScrollView>
      <View style={{ gap: space.xs }}>
        <Text style={[type.heading, { color: c.ink }]}>{p.title}</Text>
        <Text style={[type.small, { color: c.muted }]}>{p.design ? "Your product in Printful. Snapfront writes a title and description for your store." : "This is the supplier’s title. Snapfront writes a fresh title and description for your store."}</Text>
      </View>

      <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, padding: space.md, gap: space.sm }}>
        <Row label="Product" value={p.cost != null ? `from ${money(p.cost)}` : "—"} />
        <Row label={p.shipping ? `Shipping to the US (${p.shipping.days} days)` : "Shipping to the US"} value={p.shipping ? money(p.shipping.price) : "not available"} />
        <View style={{ height: 1, backgroundColor: c.line }} />
        <Row label="Your cost per sale" value={p.landed_cost != null ? money(p.landed_cost) : "—"} bold />
        <Text style={[type.small, { color: c.muted }]}>You pay {p.supplier_name} this when an order comes in. Shipping is an estimate; set your store’s shipping charge in Store settings.</Text>
      </View>

      {p.variants.length > 1 ? (
        <View style={{ gap: space.sm }}>
          <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
            <H2>{p.option_name}</H2>
            <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setPicked(allOn ? new Set() : new Set(p.variants.slice(0, MAX_OPTIONS).map((v) => v.vid)))}>
              <Text style={{ fontFamily: fonts.bodyBold, color: c.accent }}>{allOn ? "Clear" : "Select all"}</Text>
            </Pressable>
          </View>
          <Text style={[type.small, { color: c.muted }]}>{picked.size} of {p.variants.length} selected{p.variants.length > MAX_OPTIONS ? ` (up to ${MAX_OPTIONS})` : ""}</Text>
          <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, overflow: "hidden" }}>
            {p.variants.map((v, i) => {
              const on = picked.has(v.vid);
              return (
                <Pressable key={v.vid} onPress={() => toggle(v.vid)} accessibilityRole="checkbox" accessibilityState={{ checked: on }}
                  style={{ flexDirection: "row", alignItems: "center", gap: space.md, padding: space.md, borderTopWidth: i ? 1 : 0, borderColor: c.line }}>
                  <Ionicons name={on ? "checkbox" : "square-outline"} size={22} color={on ? c.accent : c.muted} />
                  {v.image ? <Image source={{ uri: v.image }} style={{ width: 36, height: 36, borderRadius: 6, backgroundColor: c.sunk }} contentFit="cover" /> : null}
                  <Text style={[type.body, { color: c.ink, flex: 1 }]}>{v.name}</Text>
                  <Text style={[type.small, { color: c.muted }]}>{money(v.cost)}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      <Field label="Your price (optional)" hint={p.suggested_price ? `Leave it blank to use your Printful price, ${money(p.suggested_price)}.` : p.design ? "Leave it blank and Snapfront sets about 2.5 times your cost." : "Leave it blank and Snapfront checks Amazon, Walmart and more, then picks a price that beats them."}
        value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="e.g. 29.99" />
      <Notice text={busy ? "Writing your product page and checking market prices. This takes about half a minute." : error} tone={busy ? "info" : "error"} />
      <Button label={busy ? "Adding…" : "Add to my store"} loading={busy} disabled={p.variants.length > 1 && picked.size === 0} onPress={add} />
      {p.images[0] && !p.design ? (
        <Button label="Compare prices first" variant="secondary" disabled={busy}
          onPress={() => router.push({ pathname: "/price-check", params: { image_url: p.images[0], cost: p.landed_cost != null ? String(p.landed_cost) : undefined } })} />
      ) : null}
    </Screen>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: space.md }}>
      <Text style={[bold ? type.label : type.small, { color: c.ink, flex: 1 }]}>{label}</Text>
      <Text style={[bold ? type.label : type.small, { color: c.ink, fontVariant: ["tabular-nums"] }]}>{value}</Text>
    </View>
  );
}

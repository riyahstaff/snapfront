import React, { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, Share, Text, View } from "react-native";
import { Link, router, useFocusEffect } from "expo-router";
import { Image } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { Button, Notice, Pill } from "@/components/ui";
import { api, ApiError, money, type Product, type Seller } from "@/lib/api";
import { fonts, radius, space, type, useColors } from "@/lib/theme";

export default function StoreScreen() {
  const c = useColors();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [me, list] = await Promise.all([api.me(), api.products()]);
      setSeller(me); setItems(list);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't load your store.");
    } finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function connectStripe() {
    try {
      const { url } = await api.stripeOnboard();
      await WebBrowser.openBrowserAsync(url);
      const s = await api.stripeStatus();
      setSeller((prev) => (prev ? { ...prev, stripe_connected: s.connected, stripe_ready: s.ready } : prev));
    } catch (e) { setError(e instanceof ApiError ? e.message : "Couldn't open Stripe."); }
  }

  const header = (
    <View style={{ gap: space.md, marginBottom: space.lg }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: space.md }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[type.title, { color: c.ink }]}>{seller?.store_name ?? "My store"}</Text>
          {seller?.tagline ? <Text style={[type.small, { color: c.muted }]}>{seller.tagline}</Text> : null}
        </View>
        <Link href="/settings" asChild>
          <Pressable accessibilityRole="button" accessibilityLabel="Store settings" hitSlop={12}><Ionicons name="settings-outline" size={24} color={c.ink} /></Pressable>
        </Link>
      </View>
      {seller ? (
        <Pressable onPress={() => Share.share({ message: seller.store_url, url: seller.store_url })} accessibilityRole="button" accessibilityLabel="Share store link"
          style={{ flexDirection: "row", alignItems: "center", gap: space.sm, backgroundColor: c.surface, borderColor: c.line, borderWidth: 1, borderRadius: radius.md, padding: space.md }}>
          <Ionicons name="link" size={18} color={c.accent} />
          <Text numberOfLines={1} style={[type.small, { color: c.ink, flex: 1 }]}>{seller.store_url.replace(/^https?:\/\//, "")}</Text>
          <Text style={[type.label, { color: c.accent }]}>Share</Text>
        </Pressable>
      ) : null}
      {seller && !seller.stripe_ready ? (
        <View style={{ backgroundColor: c.flash, borderRadius: radius.lg, padding: space.lg, gap: space.sm }}>
          <Text style={[type.heading, { color: c.onFlash }]}>{seller.stripe_connected ? "Finish your Stripe setup" : "Connect Stripe to get paid"}</Text>
          <Text style={[type.small, { color: c.onFlash }]}>Payments go straight to your own Stripe account. It takes about five minutes.</Text>
          <Button label={seller.stripe_connected ? "Continue setup" : "Connect Stripe"} onPress={connectStripe} style={{ alignSelf: "flex-start" }} />
        </View>
      ) : null}
      <Notice text={error} tone="error" />
    </View>
  );

  return (
    <FlatList
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={{ padding: space.lg, gap: space.md }}
      columnWrapperStyle={{ gap: space.md }}
      numColumns={2}
      data={items}
      keyExtractor={(p) => p.id}
      ListHeaderComponent={header}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      ListEmptyComponent={loading ? null : (
        <View style={{ alignItems: "center", gap: space.md, padding: space.xl, borderWidth: 2, borderStyle: "dashed", borderColor: c.line, borderRadius: radius.lg }}>
          <Text style={[type.heading, { color: c.ink }]}>Your store is empty</Text>
          <Text style={[type.small, { color: c.muted, textAlign: "center" }]}>Snap a product photo or create a digital product to add your first listing.</Text>
          <Button label="Snap a product" onPress={() => router.navigate("/")} />
        </View>
      )}
      renderItem={({ item }) => (
        <Pressable onPress={() => router.push({ pathname: "/product/[id]", params: { id: item.id } })} accessibilityRole="button" accessibilityLabel={`${item.title}, ${money(item.price)}`}
          style={{ flex: 1, maxWidth: "50%", backgroundColor: c.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: c.line, overflow: "hidden" }}>
          <View style={{ aspectRatio: 1, backgroundColor: c.sunk }}>
            {item.image_url ? <Image source={{ uri: item.image_url }} style={{ flex: 1 }} contentFit="cover" /> : null}
            <View style={{ position: "absolute", left: 8, bottom: 8, backgroundColor: c.flash, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2 }}>
              <Text style={{ fontFamily: fonts.display, fontSize: 14, color: c.onFlash }}>{money(item.price)}</Text>
            </View>
          </View>
          <View style={{ padding: space.md, gap: 6 }}>
            <Text numberOfLines={2} style={[type.label, { color: c.ink }]}>{item.title}</Text>
            <Pill text={item.status === "live" ? "Live" : "Draft"} tone={item.status === "live" ? "good" : "neutral"} />
          </View>
        </Pressable>
      )}
    />
  );
}

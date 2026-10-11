import React, { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, Share, Text, View } from "react-native";
import { Link, router, useFocusEffect } from "expo-router";
import { Image } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { Button, Notice, Pill } from "@/components/ui";
import { api, ApiError, money, type Me, type Product } from "@/lib/api";
import { account } from "@/lib/account-store";
import { fonts, radius, space, type, useColors } from "@/lib/theme";

export default function StoreScreen() {
  const c = useColors();
  const [seller, setSeller] = useState<Me | null>(null);
  const [switching, setSwitching] = useState(false);
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [me, list] = await Promise.all([account.refresh(), api.products()]);
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
      {seller ? <PlanCard me={seller} /> : null}
      {seller && (seller.account.stores.length > 1 || seller.account.plan === "pro") ? (
        <StoreSwitcher me={seller} busy={switching} onSwitch={async (id) => {
          setSwitching(true);
          try { await api.switchStore(id); await load(); } finally { setSwitching(false); }
        }} onCreate={async () => {
          setSwitching(true); setError(null);
          try { await api.createStore(""); await load(); }
          catch (e) { if (!(e instanceof ApiError && e.upgrade)) setError(e instanceof ApiError ? e.message : "Couldn't add a store."); }
          finally { setSwitching(false); }
        }} />
      ) : null}
      {seller ? (
        <Pressable onPress={() => Share.share({ message: seller.store_url, url: seller.store_url })} accessibilityRole="button" accessibilityLabel="Share store link"
          style={{ flexDirection: "row", alignItems: "center", gap: space.sm, backgroundColor: c.surface, borderColor: c.line, borderWidth: 1, borderRadius: radius.md, padding: space.md }}>
          <Ionicons name="link" size={18} color={c.accent} />
          <Text numberOfLines={1} style={[type.small, { color: c.ink, flex: 1 }]}>{seller.store_url.replace(/^https?:\/\//, "")}</Text>
          <Text style={[type.label, { color: c.accent }]}>Share</Text>
        </Pressable>
      ) : null}
      {/* Stripe setup appears once the seller has a plan that can take payments. */}
      {seller && seller.account.plan !== "free" && !seller.stripe_ready ? (
        <View style={{ backgroundColor: c.flash, borderRadius: radius.lg, padding: space.lg, gap: space.sm }}>
          <Text style={[type.heading, { color: c.onFlash }]}>{seller.stripe_connected ? "Finish your Stripe setup" : "Connect Stripe to get paid"}</Text>
          <Text style={[type.small, { color: c.onFlash }]}>Payments go straight to your own Stripe account. It takes about five minutes.</Text>
          <Button label={seller.stripe_connected ? "Continue setup" : "Connect Stripe"} onPress={connectStripe} style={{ alignSelf: "flex-start" }} />
        </View>
      ) : null}
      <View style={{ flexDirection: "row", gap: space.sm }}>
        <Shortcut icon="receipt-outline" label="Orders" onPress={() => router.push("/orders")} />
        <Shortcut icon="pricetag-outline" label="Discounts" onPress={() => router.push("/discounts")} />
        <Shortcut icon="cube-outline" label="Shipping & tax" onPress={() => router.push("/settings")} />
      </View>
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
            <Pill text={item.status === "live" ? (item.in_stock ? "Live" : "Sold out") : "Draft"} tone={item.status === "live" && item.in_stock ? "good" : "neutral"} />
          </View>
        </Pressable>
      )}
    />
  );
}

function Shortcut({ icon, label, onPress }: { icon: React.ComponentProps<typeof Ionicons>["name"]; label: string; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}
      style={({ pressed }) => ({ flex: 1, alignItems: "center", gap: 6, paddingVertical: space.md, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.md, opacity: pressed ? 0.85 : 1 })}>
      <Ionicons name={icon} size={22} color={c.accent} />
      <Text numberOfLines={1} style={[type.small, { color: c.ink, fontFamily: fonts.bodyMedium }]}>{label}</Text>
    </Pressable>
  );
}

function PlanCard({ me }: { me: Me }) {
  const c = useColors();
  const a = me.account;
  const free = a.plan === "free";
  const meter = (used: number, max: number, label: string) => `${Math.min(used, max)} of ${max} ${label}`;
  return (
    <Pressable onPress={() => router.push("/plans")} accessibilityRole="button" accessibilityLabel={free ? "See plans and go live" : `${a.plan_name} plan, see plans`}
      style={({ pressed }) => ({ backgroundColor: free ? c.flash : c.surface, borderColor: c.line, borderWidth: free ? 0 : 1, borderRadius: radius.lg, padding: space.lg, gap: 6, opacity: pressed ? 0.9 : 1 })}>
      {free ? (
        <>
          <Text style={[type.heading, { color: c.onFlash }]}>Go live for $29</Text>
          <Text style={[type.small, { color: c.onFlash }]}>Publish your store and take payments, with no fees on your sales. After that, you connect Stripe to get paid. {meter(a.usage.photo, a.limits.photo, "free AI pages")} used.</Text>
          <Text style={[type.label, { color: c.onFlash, marginTop: 4, textDecorationLine: "underline" }]}>See plans</Text>
        </>
      ) : (
        <>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={[type.heading, { color: c.ink }]}>{a.plan_name} plan</Text>
            {a.plan === "launch" ? <Text style={[type.label, { color: c.accent }]}>Upgrade</Text> : null}
          </View>
          <Text style={[type.small, { color: c.muted }]}>
            This month: {meter(a.usage.photo, a.limits.photo, "AI pages")} · {meter(a.usage.product, a.limits.product, "AI products")} · {meter(a.usage.research, a.limits.research, "price checks")}{a.limits.agent ? ` · ${meter(a.usage.agent, a.limits.agent, "assistant requests")}` : ""}
          </Text>
        </>
      )}
    </Pressable>
  );
}

function StoreSwitcher({ me, busy, onSwitch, onCreate }: { me: Me; busy: boolean; onSwitch: (id: string) => void; onCreate: () => void }) {
  const c = useColors();
  const chip = (on: boolean) => ({ borderRadius: radius.pill, borderWidth: 1, borderColor: on ? c.accent : c.line, backgroundColor: on ? c.accent : c.surface, paddingHorizontal: 14, paddingVertical: 8 });
  return (
    <View style={{ gap: 6 }}>
      <Text style={[type.label, { color: c.ink }]}>Your stores</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
        {me.account.stores.map((s) => (
          <Pressable key={s.id} disabled={busy || s.current} onPress={() => onSwitch(s.id)} accessibilityRole="button" accessibilityState={{ selected: s.current }}
            accessibilityLabel={`${s.store_name}${s.live_allowed ? "" : ", not taking orders on your plan"}`} style={chip(s.current)}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: s.current ? c.onAccent : s.live_allowed ? c.ink : c.muted }}>{s.store_name}</Text>
          </Pressable>
        ))}
        <Pressable disabled={busy} onPress={me.account.can_add_store ? onCreate : () => router.push({ pathname: "/plans", params: { reason: "Pro runs up to 10 stores." } })}
          accessibilityRole="button" accessibilityLabel="Add a store" style={[chip(false), { flexDirection: "row", gap: 4, alignItems: "center" }]}>
          <Ionicons name="add" size={16} color={c.accent} />
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: c.accent }}>New store</Text>
        </Pressable>
      </ScrollView>
      {me.account.stores.some((s) => !s.live_allowed) && me.account.plan !== "free" ? (
        <Text style={[type.small, { color: c.muted }]}>Greyed-out stores aren’t taking orders on your current plan.</Text>
      ) : null}
    </View>
  );
}

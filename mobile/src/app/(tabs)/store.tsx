import { GrowTile } from "@/components/grow-tile";
import { DailyPromptCard } from "@/components/daily-prompt";
import React, { useCallback, useRef, useState } from "react";
import { Alert, FlatList, Pressable, RefreshControl, ScrollView, Share, Text, View } from "react-native";
import { Link, router, useFocusEffect } from "expo-router";
import { Image } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { Button, Notice, Pill, ButtonRow } from "@/components/ui";
import { api, ApiError, money, type Me, type Product } from "@/lib/api";
import { account } from "@/lib/account-store";
import { loadStorefrontDraft } from "@/lib/storefront-draft";
import { fonts, radius, space, type, useColors } from "@/lib/theme";

export default function StoreScreen() {
  const c = useColors();
  const [seller, setSeller] = useState<Me | null>(null);
  const [switching, setSwitching] = useState(false);
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [setupDraftStep, setSetupDraftStep] = useState<number | null>(null);
  const loadRevision = useRef(0);

  const load = useCallback(async () => {
    const revision = ++loadRevision.current;
    const storeRevision = api.storeRevision();
    setLoading(true); setError(null);
    try {
      const [me, list] = await Promise.all([account.refresh(), api.products()]);
      const setupDraft = await loadStorefrontDraft(me.id).catch(() => null);
      if (revision !== loadRevision.current || storeRevision !== api.storeRevision()) return;
      setSeller(me); setItems(list); setSetupDraftStep(setupDraft?.step ?? null);
    } catch (e) {
      if (revision === loadRevision.current) setError(e instanceof ApiError ? e.message : "Couldn't load your store.");
    } finally { if (revision === loadRevision.current) setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(); return () => { loadRevision.current++; }; }, [load]));

  async function connectStripe() {
    try {
      const { url } = await api.stripeOnboard();
      await WebBrowser.openBrowserAsync(url);
      const s = await api.stripeStatus();
      setSeller((prev) => (prev ? { ...prev, stripe_connected: s.connected, stripe_ready: s.ready } : prev));
    } catch (e) { setError(e instanceof ApiError ? e.message : "Couldn't open Stripe."); }
  }

  const drafts = items.filter((p) => p.status !== "live").length;
  function addProduct() {
    Alert.alert("Add a product", "How do you want to add it?", [
      { text: "Snap or upload a photo", onPress: () => router.navigate("/snap") },
      { text: "Create a digital product", onPress: () => router.navigate("/create") },
      { text: "Find a product to dropship", onPress: () => router.navigate("/find") },
      { text: "Browse the supplier directory", onPress: () => router.push("/sources") },
      { text: "Cancel", style: "cancel" },
    ]);
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
          loadRevision.current++;
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
        <View style={{ backgroundColor: c.surface, borderRadius: radius.lg, padding: space.lg, gap: space.sm }}>
          <Text style={[type.heading, { color: c.ink }]}>{seller.stripe_connected ? "Finish your Stripe setup" : "Connect Stripe to get paid"}</Text>
          <Text style={[type.small, { color: c.ink }]}>Payments go straight to your own Stripe account. It takes about five minutes.</Text>
          <Button label={seller.stripe_connected ? "Continue setup" : "Connect Stripe"} onPress={connectStripe} style={{ alignSelf: "flex-start" }} />
        </View>
      ) : null}
      <ButtonRow>
        <Button label="Add a product" icon={<Ionicons name="add-circle-outline" size={20} color={c.onAccent} />} onPress={addProduct} />
        <Button label={setupDraftStep ? `Resume storefront setup · step ${setupDraftStep}` : "Build your storefront"} variant="secondary" icon={<Ionicons name="sparkles-outline" size={20} color={c.ink} />} onPress={() => router.push("/storefront-setup")} />
        <Button label="Bundles & subscriptions" variant="secondary" onPress={() => router.push("/store-offers")} />
      </ButtonRow>
      {setupDraftStep ? <Notice text="Your storefront setup is saved on this phone. Resume it here when you’re ready." /> : null}
      {drafts > 0 ? (
        <View style={{ flexDirection: "row", gap: space.sm, alignItems: "flex-start", backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.md, padding: space.md }}>
          <Ionicons name="information-circle-outline" size={20} color={c.accent} />
          <Text style={[type.small, { color: c.ink, flex: 1 }]}>
            {drafts === 1 ? "1 product is a draft and isn’t in your store yet." : `${drafts} products are drafts and aren’t in your store yet.`} Open one to publish it.
          </Text>
        </View>
      ) : null}
      <View style={{ flexDirection: "row", gap: space.sm }}>
        <Shortcut icon="receipt-outline" label="Orders" onPress={() => router.push("/orders")} />
        <Shortcut icon="pricetag-outline" label="Discounts" onPress={() => router.push("/discounts")} />
        <Shortcut icon="color-palette-outline" label="Store look" onPress={() => router.push("/looks")} />
        <Shortcut icon="cube-outline" label="Shipping" onPress={() => router.push("/settings")} />
      </View>
      <DailyPromptCard />
      <Text style={[type.heading, { color: c.ink, marginTop: space.sm }]}>Grow your store</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
        <GrowTile icon="cash-outline" label="Sales & profit" sub="Profit, customers, payouts" onPress={() => router.push("/business")} />
        <GrowTile icon="mail-outline" label="Email marketing" sub="Your list, emails, automations" onPress={() => router.push("/email")} />
        <GrowTile icon="megaphone-outline" label="Marketing posts" sub="Posts, carousels and Reels" onPress={() => router.push("/marketing")} />
        <GrowTile icon="chatbubble-ellipses-outline" label="Instagram AutoDM" sub="Reply to keywords with your link" onPress={() => router.push("/autodm")} />
        <GrowTile icon="ribbon-outline" label="Affiliates" sub="Fans earn for each sale" onPress={() => router.push("/affiliates")} />
        <GrowTile icon="pulse-outline" label="Ad pixels" sub="Meta, TikTok, Google, Pinterest" onPress={() => router.push("/pixels")} />
        <GrowTile icon="gift-outline" label="Bonus: 1k Prompts" sub="For Claude and ChatGPT" onPress={() => router.push("/prompts")} />
        <GrowTile icon="school-outline" label="Academy" sub="Video lessons, TikTok LIVE" onPress={() => router.push("/academy")} />
        <GrowTile icon="videocam-outline" label="Faceless videos" sub="Voiceover + your photos" onPress={() => router.push("/faceless")} />
        <GrowTile icon="person-circle-outline" label="AI avatars" sub="Characters, your photo, blends, videos" onPress={() => router.push("/avatars")} />
        <GrowTile icon={seller?.addons?.youtube ? "logo-youtube" : "lock-closed-outline"} label="YouTube Shorts" sub={seller?.addons?.youtube ? "Post your videos to your channel" : "Add-on, $24.99 a month"} onPress={() => router.push("/youtube")} />
        <GrowTile icon="sparkles-outline" label="Credits" sub="For avatar videos" onPress={() => router.push("/credits")} />
        <GrowTile icon="aperture-outline" label="UGC creator kit" sub="Get paid by brands" onPress={() => router.push("/ugc")} />
        <GrowTile icon="help-buoy-outline" label="Help & support" sub="SnapCare checks and fixes problems" onPress={() => router.push("/support")} />
        <GrowTile icon="chatbubbles-outline" label="Community" sub="Discord, Whop, live coaching" onPress={() => router.push("/community")} />
        <GrowTile icon="cash-outline" label="Earn with Snapfront" sub="40% per Lifetime sale" onPress={() => router.push("/earn")} />
        <GrowTile icon="sparkles-outline" label="AI photos & video" sub="Lifestyle shots and clips" onPress={() => router.push("/ai-media")} />
        <GrowTile icon="people-outline" label="Get more buyers" sub="Link in bio, QR, Google" onPress={() => router.push("/channels")} />
        <GrowTile icon="bar-chart-outline" label="Insights" sub="Visitors and sales" onPress={() => router.push("/insights")} />
        <GrowTile icon="star-outline" label="Reviews" sub="What buyers say" onPress={() => router.push("/reviews")} />
        <GrowTile icon="business-outline" label="Suppliers" sub="Where to find products" onPress={() => router.push("/sources")} />
      </View>
      <Notice text={error} tone="error" />
      {items.length ? <Text style={[type.heading, { color: c.ink, marginTop: space.sm }]}>Your products</Text> : null}
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
          <Text style={[type.small, { color: c.muted, textAlign: "center" }]}>Tap Add a product above: snap a photo of something you sell, create a digital product, or pick one to dropship.</Text>
        </View>
      )}
      renderItem={({ item }) => (
        <Pressable onPress={() => router.push({ pathname: "/product/[id]", params: { id: item.id } })} accessibilityRole="button" accessibilityLabel={`${item.title}, ${money(item.price)}`}
          style={{ flex: 1, maxWidth: "50%", backgroundColor: c.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: c.line, overflow: "hidden" }}>
          <View style={{ aspectRatio: 1, backgroundColor: c.sunk }}>
            {item.image_url ? <Image source={{ uri: item.image_url }} style={{ flex: 1 }} contentFit="cover" /> : null}
            <View style={{ position: "absolute", left: 8, bottom: 8, backgroundColor: c.surface, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2 }}>
              <Text style={{ fontFamily: fonts.display, fontSize: 14, color: c.ink }}>{money(item.price)}</Text>
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
    <Pressable onPress={() => router.push("/plans")} accessibilityRole="button" accessibilityLabel={free ? "Snapfront membership: sign in or see what it includes" : `${a.plan_name}, see your membership`}
      style={({ pressed }) => ({ backgroundColor: c.surface, borderColor: c.line, borderWidth: 1, borderRadius: radius.lg, padding: space.lg, gap: 6, opacity: pressed ? 0.9 : 1 })}>
      {free ? (
        <>
          <Text style={[type.heading, { color: c.ink }]}>Go live with Snapfront membership</Text>
          <Text style={[type.small, { color: c.ink }]}>Publish your store and take payments, with no fees on your sales. After that, you connect Stripe to get paid. {meter(a.usage.photo, a.limits.photo, "free AI pages")} used.</Text>
          <Text style={[type.label, { color: c.ink, marginTop: 4, textDecorationLine: "underline" }]}>Members: sign in</Text>
        </>
      ) : (
        <>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={[type.heading, { color: c.ink }]}>{a.plan_name} plan</Text>
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

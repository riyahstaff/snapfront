// The website's home page (app.snapfront.app): a full-width hero, the seller's store at a glance,
// the creative tools, storefront themes and the Android app. Web-only: metro.config.js uses it in
// place of src/app/(tabs)/index.tsx (the phone's Home) when building the website.
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions, type PressableStateCallbackType } from "react-native";
import { router, useFocusEffect, type Href } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { api, ApiError, type Product, type StoreTheme } from "@/lib/api";
import { account, useMe } from "@/lib/account-store";
import { featuredThemes } from "@/lib/home-discovery";
import { DEFAULT_STORE_NAME } from "@/lib/store-address";
import { getAppInfo } from "@/lib/billing.web";
import { ThemePreview } from "@/components/theme-preview";
import { DailyPromptCard } from "@/components/daily-prompt";
import { StartHereCard } from "@/components/start-here";
import { ToolCard } from "./tool-card";
import { PromoFilm } from "./promo-film";
import { alpha, fonts, useColors } from "@/lib/theme";
import { CONTENT, WebFooter } from "./web-nav";
import { useAskVierra } from "@/lib/ask-vierra";


type Hover = PressableStateCallbackType & { hovered?: boolean };
type Icon = React.ComponentProps<typeof Ionicons>["name"];

// `art` names a short looping animation in server/assets/site/tools/ (made with tools/site-art).
const TOOLS: { title: string; art: string; detail: string; icon: Icon; href: Href }[] = [
  { title: "Snap a product", art: "snap", detail: "A photo becomes a full product page with a price and checkout.", icon: "camera-outline", href: "/snap" },
  { title: "Digital products", art: "digital", detail: "E-books, checklists, planners and prints, written and designed for you.", icon: "document-text-outline", href: "/create" },
  { title: "Marketing posts", art: "marketing", detail: "Ready-to-post images and carousels with your price and link.", icon: "megaphone-outline", href: "/marketing" },
  { title: "AI photos & video", art: "ai-media", detail: "Lifestyle shots and short clips of your product.", icon: "film-outline", href: "/ai-media" },
  { title: "Photo cleanup", art: "cleanup", detail: "Keep the product exactly as it is and change only the background.", icon: "color-wand-outline", href: "/studio" },
  { title: "Find products", art: "find", detail: "Source your next collection from trusted suppliers.", icon: "search-outline", href: "/find" },
  { title: "Store assistant", art: "assistant", detail: "Ask for ideas, copy and next steps for your shop.", icon: "chatbubbles-outline", href: "/assistant" },
  { title: "Get more buyers", art: "buyers", detail: "Link in bio, QR codes and Google Shopping.", icon: "people-outline", href: "/channels" },
  { title: "Email marketing", art: "email", detail: "Grow a list from your store, send emails and let welcome and win-back emails run themselves.", icon: "mail-outline", href: "/email" },
  { title: "Instagram AutoDM", art: "autodm", detail: "Someone comments a keyword; your Instagram DMs them the link.", icon: "chatbubble-ellipses-outline", href: "/autodm" },
  { title: "Affiliates", art: "affiliates", detail: "Fans and creators share their own link and earn on each sale.", icon: "ribbon-outline", href: "/affiliates" },
  { title: "Ad pixels", art: "pixels", detail: "Meta, TikTok, Google and Pinterest see your sales, so ads find buyers.", icon: "pulse-outline", href: "/pixels" },
  { title: "Earn with Snapfront", art: "earn", detail: "Share your link and earn 40% of every membership payment from the people you send.", icon: "cash-outline", href: "/earn" },
  { title: "Snapfront Academy", art: "academy", detail: "Short video lessons: your store, content, going LIVE on TikTok and the top 10 ways to market.", icon: "school-outline", href: "/academy" },
  { title: "Faceless videos", art: "faceless", detail: "Your product photos, big captions and a natural voiceover, ready for TikTok and Reels.", icon: "videocam-outline", href: "/faceless" },
  { title: "AI avatars", art: "avatars", detail: "An original AI character, your own photo or a blend of two that shows off your products in posts, stories and videos.", icon: "person-circle-outline", href: "/avatars" },
  { title: "Credits", art: "credits", detail: "Top up credits for avatar videos made with Vidu Q3, Seedance 2.5 and Sora 2 Pro, plus voiceovers and talking avatars.", icon: "sparkles-outline", href: "/credits" },
  { title: "UGC creator kit", art: "ugc", detail: "A portfolio page, rates, scripts and pitches to get paid by brands for short videos.", icon: "aperture-outline", href: "/ugc" },
  { title: "Community", art: "community", detail: "Post wins, ask questions, climb the leaderboard and join live coaching with other sellers.", icon: "chatbubbles-outline", href: "/community" },
];

export default function WebHome() {
  useAskVierra();
  const c = useColors();
  const me = useMe();
  const { width } = useWindowDimensions();
  const wide = width >= 980, mid = width >= 680;
  const [themes, setThemes] = useState<StoreTheme[] | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [android, setAndroid] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    let alive = true;
    api.themes().then((t) => alive && setThemes(t)).catch(() => {});
    account.refresh().then((m) => api.products(m.id)).then((p) => alive && setProducts(p)).catch(() => alive && setProducts([]));
    getAppInfo().then((a) => alive && setAndroid(a.android_url)).catch(() => {});
    return () => { alive = false; };
  }, []));

  const named = me && me.store_name !== DEFAULT_STORE_NAME;
  const featured = themes ? featuredThemes(themes) : [];
  const pad = { width: "100%" as const, maxWidth: CONTENT, alignSelf: "center" as const, paddingHorizontal: 24 };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ paddingBottom: 0 }}>
      {/* Hero */}
      <View style={{ borderBottomWidth: 1, borderColor: c.sunk, backgroundImage: `radial-gradient(1100px 520px at 75% 0%, ${c.sunk} 0%, ${alpha(c.bg, 0)} 70%)` } as object}>
        <View style={[pad, { paddingVertical: wide ? 88 : 48, flexDirection: wide ? "row" : "column", alignItems: wide ? "center" : "stretch", gap: wide ? 56 : 36 }]}>
          <View style={{ flex: wide ? 1.05 : undefined, gap: 22 }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, letterSpacing: 2.4, color: c.brand }}>CREATIVE COMMERCE STUDIO</Text>
            <Text accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: wide ? 76 : mid ? 60 : 46, lineHeight: wide ? 76 : mid ? 62 : 48, letterSpacing: wide ? -3 : -2, color: c.ink }}>
              {named ? `${me!.store_name},\nbeautifully built.` : "Your vision.\nBeautifully built."}
            </Text>
            <Text style={{ fontFamily: fonts.body, fontSize: wide ? 20 : 18, lineHeight: wide ? 31 : 28, color: c.muted, maxWidth: 560 }}>
              Upload a product photo and Snapfront writes the page, sets the price and takes payments through Stripe. Then give your brand a storefront worth discovering.
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 6 }}>
              <CTA label="Start here" icon="compass-outline" href="/start" primary />
              <CTA label="Snap a product" icon="camera-outline" href="/snap" />
              <CTA label="Choose my storefront look" href="/storefront-setup" />
            </View>
            <Text style={{ fontFamily: fonts.body, fontSize: 14, color: c.muted }}>Not sure where to begin? Start here: 5 quick questions, a plan made for you.</Text>
          </View>
          <View style={{ flex: wide ? 1 : undefined, borderRadius: 28, overflow: "hidden", borderWidth: 1, borderColor: c.line, aspectRatio: 4 / 3, boxShadow: c.dark ? "0 40px 120px rgba(0,0,0,0.6)" : "0 40px 100px rgba(15,18,23,0.18)" } as object}>
            <Image source={require("../../assets/chrome-hero.jpg")} contentFit="cover" style={{ width: "100%", height: "100%" }} accessibilityLabel="A brushed-chrome doorway with storefront examples" />
          </View>
        </View>
      </View>

      {/* The 90-second film */}
      <View style={[pad, { paddingTop: 56 }]}><PromoFilm /></View>

      {/* Your store */}
      <Section title="Your store" pad={pad}>
        <View style={{ marginBottom: 16 }}><StartHereCard /></View>
        <StorePanel products={products} wide={wide} />
        <View style={{ marginTop: 16 }}><DailyPromptCard /></View>
      </Section>

      {/* Tools */}
      <Section title="Everything you need to sell" subtitle="Each tool works on the same store, on the web and in the app." pad={pad}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
          {TOOLS.map((t) => <ToolCard key={t.title} {...t} columns={wide ? 4 : mid ? 2 : 1} />)}
        </View>
      </Section>

      {/* Themes */}
      <Section title="Designed to stand out" subtitle="Over 100 storefront themes for fashion, beauty, home, tech and more." pad={pad}
        action={<CTA label="Explore over 100 themes" href="/looks" small />}>
        {featured.length ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
            {featured.map((t) => (
              <Pressable key={t.id} onPress={() => router.push("/looks")} accessibilityLabel={`${t.name} theme`} style={(s: Hover) => ({ flexBasis: wide ? "23%" : mid ? "47%" : "100%", flexGrow: 1, gap: 10, opacity: s.hovered ? 0.92 : 1 })}>
                <ThemePreview theme={t} storeName={me?.store_name ?? "Your store"} height={wide ? 230 : 260} />
                <View style={{ gap: 2 }}>
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: c.ink }}>{t.name}</Text>
                  <Text style={{ fontFamily: fonts.body, fontSize: 14, color: c.muted }} numberOfLines={1}>{t.for}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : <ActivityIndicator color={c.accent} />}
      </Section>

      {/* Android app */}
      <Section pad={pad}>
        <View style={{ borderWidth: 1, borderColor: c.line, borderRadius: 24, padding: wide ? 40 : 24, flexDirection: wide ? "row" : "column", gap: 24, alignItems: wide ? "center" : "flex-start", backgroundImage: `linear-gradient(135deg, ${c.surface} 0%, ${c.bg} 100%)` } as object}>
          <Image source={require("../../assets/brand-mark.png")} contentFit="contain" style={{ width: 64, height: 72 }} />
          <View style={{ flex: wide ? 1 : undefined, gap: 6 }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 28, letterSpacing: -0.8, color: c.ink }}>{(me?.account.plan ?? "free") === "free" ? "Members get the app free" : "Your free Snapfront app"}</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: c.muted, maxWidth: 620 }}>
              Snap products with your phone’s camera, post from your phone and check orders on the go. Sign in to the Android app with the same email and everything here is there too.
            </Text>
          </View>
          {android ? <CTA label="Get it on Google Play" icon="logo-google-playstore" url={android} /> : null}
        </View>
      </Section>

      <WebFooter />
    </ScrollView>
  );
}

function Section({ title, subtitle, action, pad, children }: { title?: string; subtitle?: string; action?: React.ReactNode; pad: object; children: React.ReactNode }) {
  const c = useColors();
  return (
    <View style={[pad, { paddingTop: 64, gap: 24 }]}>
      {title ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
          <View style={{ gap: 6, flexShrink: 1 }}>
            <Text accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: 36, lineHeight: 40, letterSpacing: -1.2, color: c.ink }}>{title}</Text>
            {subtitle ? <Text style={{ fontFamily: fonts.body, fontSize: 16, color: c.muted }}>{subtitle}</Text> : null}
          </View>
          {action}
        </View>
      ) : null}
      {children}
    </View>
  );
}

function CTA({ label, href, url, icon, primary, small }: { label: string; href?: Href; url?: string; icon?: Icon; primary?: boolean; small?: boolean }) {
  const c = useColors();
  const body = (s: Hover) => ({
    flexDirection: "row" as const, alignItems: "center" as const, gap: 10, borderRadius: 10, borderWidth: 1,
    paddingHorizontal: small ? 18 : 24, height: small ? 42 : 52,
    borderColor: primary ? c.accent : c.line,
    backgroundColor: primary ? (s.hovered ? c.accentHover : c.accent) : s.hovered ? c.sunk : "transparent",
  });
  const inner = <>
    {icon ? <Ionicons name={icon} size={19} color={primary ? c.onAccent : c.ink} /> : null}
    <Text style={{ fontFamily: fonts.bodyBold, fontSize: small ? 14 : 16, color: primary ? c.onAccent : c.ink }}>{label}</Text>
  </>;
  if (url) return <Pressable accessibilityRole="link" onPress={() => window.open(url, "_blank", "noopener")} style={body}>{inner}</Pressable>;
  return <Pressable accessibilityRole="link" onPress={() => router.push(href!)} style={body}>{inner}</Pressable>;
}

function StorePanel({ products, wide }: { products: Product[] | null; wide: boolean }) {
  const c = useColors();
  const me = useMe();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!me) return <ActivityIndicator color={c.accent} />;
  const named = me.store_name !== DEFAULT_STORE_NAME;
  const plan = me.account.plan;
  const live = products?.filter((p) => p.status === "live").length ?? 0;
  const drafts = products ? products.length - live : 0;

  async function saveName() {
    setBusy(true); setError(null);
    try { account.set(await api.updateStore({ store_name: name.trim() })); }
    catch (e) { setError(e instanceof ApiError ? e.message : "Couldn't save the name. Try again."); }
    finally { setBusy(false); }
  }

  return (
    <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 24, padding: wide ? 32 : 22, flexDirection: wide ? "row" : "column", gap: wide ? 40 : 24 }}>
      <View style={{ flex: wide ? 1 : undefined, gap: 12 }}>
        {named ? (
          <>
            <Text style={{ fontFamily: fonts.display, fontSize: 30, letterSpacing: -0.8, color: c.ink }}>{me.store_name}</Text>
            <Pressable accessibilityRole="link" onPress={() => window.open(me.store_url, "_blank", "noopener")} style={{ flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" }}>
              {(s: Hover) => <>
                <Ionicons name="link-outline" size={16} color={c.muted} />
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 15, color: s.hovered ? c.ink : c.muted, textDecorationLine: s.hovered ? "underline" : "none" }}>{me.store_url.replace(/^https?:\/\//, "")}</Text>
                <Ionicons name="open-outline" size={14} color={c.muted} />
              </>}
            </Pressable>
          </>
        ) : (
          <View style={{ gap: 10 }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 26, letterSpacing: -0.6, color: c.ink }}>Name your store</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 15, color: c.muted }}>Buyers see it on every page, and it becomes your store’s web address.</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              <TextInput value={name} onChangeText={setName} placeholder="e.g. Paw Place" placeholderTextColor={c.muted} maxLength={80} onSubmitEditing={() => name.trim().length >= 2 && saveName()}
                accessibilityLabel="Store name" style={{ flexGrow: 1, minWidth: 220, height: 48, borderRadius: 14, borderWidth: 1, borderColor: c.line, backgroundColor: c.bg, color: c.ink, paddingHorizontal: 16, fontFamily: fonts.body, fontSize: 16 }} />
              <Pressable accessibilityRole="button" disabled={busy || name.trim().length < 2} onPress={saveName}
                style={{ height: 48, paddingHorizontal: 22, borderRadius: 10, backgroundColor: c.accent, justifyContent: "center", opacity: busy || name.trim().length < 2 ? 0.5 : 1 }}>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: c.onAccent }}>{busy ? "Saving…" : "Save name"}</Text>
              </Pressable>
            </View>
            {error ? <Text style={{ fontFamily: fonts.body, fontSize: 14, color: c.bad }}>{error}</Text> : null}
          </View>
        )}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 6 }}>
          <Stat label="Live products" value={products ? String(live) : "…"} />
          <Stat label="Drafts" value={products ? String(drafts) : "…"} />
          <Stat label="Plan" value={plan === "pro" ? "Pro" : plan === "launch" ? "Launch" : "Free"} />
        </View>
      </View>
      <View style={{ width: wide ? 340 : "100%", gap: 10, justifyContent: "center" }}>
        {plan === "free" ? (
          <View style={{ backgroundColor: c.bg, borderWidth: 1, borderColor: c.line, borderRadius: 18, padding: 18, gap: 10 }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: c.ink }}>Become a Snapfront member</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: c.muted }}>Publish your store and take payments with no fees on your sales. The Android app comes free.</Text>
            <CTA label="Become a member" href="/plans" primary small />
          </View>
        ) : null}
        <CTA label="Add a product" icon="add-circle-outline" href="/snap" small />
        <CTA label="Build your storefront" icon="sparkles-outline" href="/storefront-setup" small />
        <CTA label="Sales & profit" icon="cash-outline" href="/business" small />
        <CTA label="Orders" icon="receipt-outline" href="/orders" small />
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const c = useColors();
  return (
    <View style={{ borderWidth: 1, borderColor: c.line, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, minWidth: 120, gap: 2 }}>
      <Text style={{ fontFamily: fonts.display, fontSize: 24, color: c.ink, fontVariant: ["tabular-nums"] }}>{value}</Text>
      <Text style={{ fontFamily: fonts.body, fontSize: 13, color: c.muted }}>{label}</Text>
    </View>
  );
}

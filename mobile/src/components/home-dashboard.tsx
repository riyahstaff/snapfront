import React, { useState } from "react";
import { ActivityIndicator, Pressable, Text, View, useWindowDimensions } from "react-native";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button, Notice } from "./ui";
import { ChromeHero } from "./chrome-hero";
import { ThemeCarousel } from "./theme-carousel";
import { ReleaseInfo } from "./release-info";
import { StartHereCard } from "./start-here";
import { featuredThemes } from "@/lib/home-discovery";
import { carouselInViewport, homePrimaryAction } from "@/lib/home-carousel";
import type { Me, StoreTheme } from "@/lib/api";
import { fonts, radius, space, type, useColors } from "@/lib/theme";

type Props = { me: Me | null; themes: StoreTheme[] | null; draftStep: number | null; hasProducts?: boolean | null; viewport?: { y: number; height: number }; error: string | null; loading: boolean; onRetry: () => void };
export function HomeDashboard({ me, themes, draftStep, hasProducts = null, viewport, error, loading, onRetry }: Props) {
  const c = useColors();
  const { width, fontScale } = useWindowDimensions();
  const cards = themes ? featuredThemes(themes) : [];
  const compact = width >= 360 && fontScale <= 1.3;
  const [rail, setRail] = useState({ top: 0, height: 0 });
  const [sectionTop, setSectionTop] = useState(0);
  const hasDesign = Boolean(me && (me.theme !== "classic" || me.banner_url || me.about || me.hero_title));
  const primary = homePrimaryAction(draftStep, hasProducts, hasDesign);
  const determining = loading && draftStep === null && hasProducts === null && !hasDesign;
  const undetermined = !loading && draftStep === null && hasProducts === null && !hasDesign;
  const visible = viewport ? carouselInViewport(sectionTop + rail.top, rail.height, viewport.y, viewport.height) : true;
  return (
    <View style={{ gap: space.xl }}>
      <View style={{ gap: 10 }}>
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 10, letterSpacing: 2.8, color: c.brand }}>FROM IDEA TO ICONIC</Text>
        <ReleaseInfo />
        <Text accessibilityRole="header" style={[type.hero, { color: c.ink, fontSize: width > 500 ? 48 : 38, lineHeight: width > 500 ? 53 : 42 }]}>Your vision.{"\n"}Beautifully built.</Text>
        <Text style={[type.body, { color: c.muted, maxWidth: 450 }]}>Start with a product photo. Turn it into a page, then give your brand a storefront worth discovering.</Text>
      </View>
      <StartHereCard />
      <View style={{ gap: space.sm }}>
        <Button label={determining ? "Opening your workspace…" : undetermined ? "Open my store" : primary.label} loading={determining} icon={<Ionicons name={primary.returning || undetermined ? "arrow-forward" : "camera-outline"} color={c.onAccent} size={20} />} onPress={() => router.push(undetermined ? "/store" : primary.route)} />
        {draftStep ? <Text style={[type.small, { color: c.muted, textAlign: "center" }]}>Saved on this phone · Step {draftStep} of 5</Text> : primary.returning ? <Text style={[type.small, { color: c.muted, textAlign: "center" }]}>Your products and applied look stay yours. Review your next changes.</Text> : <Text style={[type.small, { color: c.muted, textAlign: "center" }]}>Take or choose a photo → review your product page → style your store.</Text>}
        <Button label={primary.returning ? "Snap another product" : undetermined ? "Snap a product" : "Choose my storefront look"} variant="ghost" onPress={() => router.push(primary.returning || undetermined ? "/snap" : "/storefront-setup")} />
      </View>
      <ChromeHero />
      <View onLayout={(event) => setSectionTop(event.nativeEvent.layout.y)} style={{ gap: space.md }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <Text accessibilityRole="header" style={[type.title, { color: c.ink }]}>Designed to stand out.</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Browse all storefront themes" onPress={() => router.push("/looks")} style={{ minHeight: 44, flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Text style={[type.small, { color: c.ink }]}>Explore over 100 themes</Text><Ionicons name="arrow-forward" size={17} color={c.ink} />
          </Pressable>
        </View>
        {cards.length ? <ThemeCarousel key={cards.map((theme) => theme.id).join(":")} themes={cards} visible={visible}
          onLayout={(event) => { const { y, height } = event.nativeEvent.layout; setRail((value) => value.top === y && value.height === height ? value : { top: y, height }); }} />
          : loading ? <ActivityIndicator color={c.accent} accessibilityLabel="Loading theme discovery" /> : <Text style={[type.body, { color: c.muted }]}>Open the catalog to discover your next look.</Text>}
      </View>
      {error ? <View style={{ gap: space.sm }}><Notice text={error} /><Button label="Refresh home" variant="secondary" onPress={onRetry} loading={loading} /></View> : null}
      <View style={{ flexDirection: compact ? "row" : "column", flexWrap: "wrap", gap: space.md }}>
        <ActionCard title="Snap a product" detail="A photo. A product page." icon="camera-outline" href="/snap" compact={compact} />
        <ActionCard title="AI studio" detail="Create, refine, reimagine." icon="sparkles-outline" href="/studio" compact={compact} />
        <ActionCard title="Your assistant" detail="Ideas with a next step." icon="chatbubbles-outline" href="/assistant" compact={compact} />
        <ActionCard title="Find products" detail="Source your next collection." icon="search-outline" href="/find" compact={compact} />
        <ActionCard title="Bonus: 1k Prompts" detail="Send to Claude or ChatGPT in one tap." icon="gift-outline" href="/prompts" compact={compact} />
      </View>
      {me ? <View style={{ backgroundColor: c.surface, borderColor: c.line, borderWidth: 1, borderRadius: radius.lg, padding: space.lg, gap: space.md }}>
        <View style={{ gap: 4 }}><Text style={{ fontFamily: fonts.bodyMedium, color: c.brand, letterSpacing: 2, fontSize: 10 }}>YOUR WORKSPACE</Text><Text style={[type.title, { color: c.ink }]}>{me.store_name}</Text><Text style={[type.small, { color: c.muted }]}>Design your store. Review products. Keep every detail yours.</Text></View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
          <Button label="My store" variant="secondary" style={{ flexGrow: 1 }} onPress={() => router.push("/store")} />
          <Button label="Orders" variant="secondary" style={{ flexGrow: 1 }} onPress={() => router.push("/orders")} />
        </View>
      </View> : null}
      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 10, letterSpacing: 2, color: c.muted, textAlign: "center", paddingBottom: 4 }}>YOUR IDEAS. YOUR STOREFRONT.</Text>
    </View>
  );
}
function ActionCard({ title, detail, icon, href, compact }: { title: string; detail: string; icon: React.ComponentProps<typeof Ionicons>["name"]; href: Href; compact: boolean }) {
  const c = useColors();
  return <Pressable accessibilityRole="button" accessibilityLabel={`${title}. ${detail}`} onPress={() => router.push(href)} style={({ pressed }) => ({ width: compact ? "47%" : "100%", flexGrow: 1, backgroundColor: c.surface, borderColor: c.line, borderWidth: 1, borderRadius: radius.md, padding: space.lg, gap: space.md, opacity: pressed ? 0.8 : 1 })}>
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}><Ionicons name={icon} size={25} color={c.accent} /><Ionicons name="arrow-forward" size={16} color={c.muted} /></View>
    <View style={{ gap: 4 }}><Text style={[type.heading, { color: c.ink }]}>{title}</Text><Text style={[type.small, { color: c.muted }]}>{detail}</Text></View>
  </Pressable>;
}

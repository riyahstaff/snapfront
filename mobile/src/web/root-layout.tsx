// The website's root layout (app.snapfront.app): the top menu on every page, a page title bar on
// inner pages, and content centered at a readable width. Same startup work as src/app/_layout.tsx
// (fonts, plan checks, upgrade prompts), minus the phone's "name your store" pop-up: the website's
// home page asks for the store name in place. Web-only: metro.config.js uses it instead of
// src/app/_layout.tsx when building the website. Keep the screen list in step with that file.
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { DarkTheme, router, Stack, ThemeProvider, usePathname } from "expo-router";
import { useFonts, BricolageGrotesque_600SemiBold, BricolageGrotesque_800ExtraBold } from "@expo-google-fonts/bricolage-grotesque";
import { Figtree_400Regular, Figtree_500Medium, Figtree_700Bold } from "@expo-google-fonts/figtree";
import type { NativeStackHeaderProps } from "expo-router";
import { useColors } from "@/lib/theme";
import { api, onUpgradeNeeded } from "@/lib/api";
import { account, useMe } from "@/lib/account-store";
import { startBilling } from "@/lib/billing";
import { pageWidthFor } from "@/lib/page-width";
import { PAGE_WIDTH, PageHeader, WebNav } from "./web-nav";

const TITLES: Record<string, string> = {
  snap: "Snap a product", draft: "Your product page", "product/[id]": "Product", settings: "Account and store settings", orders: "Orders", business: "Sales & profit",
  email: "Email marketing", affiliates: "Affiliates", pixels: "Ad pixels", autodm: "Instagram AutoDM", earn: "Earn with Snapfront", academy: "Snapfront Academy", prompts: "Bonus: 1k Prompts", "prompt/[id]": "Prompt", "lesson/[id]": "Lesson", community: "Community", faceless: "Faceless videos", youtube: "YouTube Shorts", avatars: "AI avatars", credits: "Credits", ugc: "UGC creator kit",
  discounts: "Discount codes", looks: "Store look", "storefront-setup": "Storefront setup", "store-offers": "Bundles & subscriptions", studio: "Product photo cleanup",
  "digital-photo-studio": "Digital photo studio", sources: "Supplier directory", marketing: "Marketing posts", "ai-media": "AI photos & video",
  insights: "Insights", reviews: "Reviews", channels: "Get more buyers", plans: "Membership", "sign-in": "Sign in", "price-check": "Price check", "supplier/[pid]": "Product",
  welcome: "Name your store", "digital-designs": "Digital designs", "digital-editor": "Design editor",
};

function Header({ options, route, back, navigation }: NativeStackHeaderProps) {
  const title = typeof options.title === "string" && options.title ? options.title : TITLES[route.name] ?? "";
  const right = options.headerRight?.({ canGoBack: Boolean(back), tintColor: undefined });
  return <PageHeader width={pageWidthFor(route.name)} title={title} canGoBack={Boolean(back) || route.name === "ugc"} onBack={() => (navigation.canGoBack() ? navigation.goBack() : router.replace(route.name === "ugc" ? "/(tabs)/store" : "/"))} right={right} />;
}

export default function WebRootLayout() {
  const c = useColors();
  const me = useMe();
  const pathname = usePathname() || "/";
  const [checked, setChecked] = useState(false);
  const [loaded, error] = useFonts({ BricolageGrotesque_600SemiBold, BricolageGrotesque_800ExtraBold, Figtree_400Regular, Figtree_500Medium, Figtree_700Bold });

  useEffect(() => {
    onUpgradeNeeded((plan, reason) => router.push({ pathname: "/plans", params: { highlight: plan, reason } }));
    account.refresh().then((m) => startBilling(m.account.id)).catch(() => {}).finally(() => setChecked(true));
    return () => onUpgradeNeeded(null);
  }, []);
  // The first anonymous device session is not a verified user account.
  // Checkout and email verification remain accessible to visitors.
  const guestRoute = pathname === "/sign-in" || pathname === "/plans";
  useEffect(() => {
    if (!checked || me?.account.email || guestRoute) return;
    // A new visitor at the app's front door sees the landing page (video, Vierra, features, pricing)
    // instead of a bare sign-in box; links deeper into the app still ask them to sign in.
    if (pathname === "/" && typeof window !== "undefined") window.location.replace(api.landingUrl());
    else router.replace("/sign-in");
  }, [checked, me?.account.email, guestRoute, pathname]);
  if ((!loaded && !error) || (!guestRoute && (!checked || !me?.account.email)))
    return <View style={{ flex: 1, backgroundColor: c.bg }} />;

  const page = { width: "100%" as const, maxWidth: PAGE_WIDTH, alignSelf: "center" as const, backgroundColor: c.bg };
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <WebNav />
      <ThemeProvider value={{ ...DarkTheme, colors: { ...DarkTheme.colors, background: c.bg, card: c.bg, border: c.sunk, text: c.ink, primary: c.accent } }}>
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <Stack screenOptions={{ header: (p) => <Header {...p} />, contentStyle: page, animation: "none" }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }} />
          {Object.entries(TITLES).filter(([name]) => !["digital-designs", "digital-editor"].includes(name)).map(([name, title]) => (
            <Stack.Screen key={name} name={name} options={{ title }} />
          ))}
        </Stack>
      </View>
      </ThemeProvider>
    </View>
  );
}

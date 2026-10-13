// The website's root layout (app.snapfront.app): the top menu on every page, a page title bar on
// inner pages, and content centered at a readable width. Same startup work as src/app/_layout.tsx
// (fonts, plan checks, upgrade prompts), minus the phone's "name your store" pop-up: the website's
// home page asks for the store name in place. Web-only: metro.config.js uses it instead of
// src/app/_layout.tsx when building the website. Keep the screen list in step with that file.
import React, { useEffect } from "react";
import { View } from "react-native";
import { DarkTheme, router, Stack, ThemeProvider } from "expo-router";
import { useFonts, BricolageGrotesque_600SemiBold, BricolageGrotesque_800ExtraBold } from "@expo-google-fonts/bricolage-grotesque";
import { Figtree_400Regular, Figtree_500Medium, Figtree_700Bold } from "@expo-google-fonts/figtree";
import type { NativeStackHeaderProps } from "expo-router";
import { useColors } from "@/lib/theme";
import { onUpgradeNeeded } from "@/lib/api";
import { account } from "@/lib/account-store";
import { startBilling } from "@/lib/billing";
import { PageHeader, WebNav } from "./web-nav";

const TITLES: Record<string, string> = {
  snap: "Snap a product", draft: "Your product page", "product/[id]": "Product", settings: "Account and store settings", orders: "Orders", business: "Sales & profit",
  email: "Email marketing", affiliates: "Affiliates", pixels: "Ad pixels", autodm: "Instagram AutoDM", earn: "Earn with Snapfront",
  discounts: "Discount codes", looks: "Store look", "storefront-setup": "Storefront setup", studio: "Product photo cleanup",
  "digital-photo-studio": "Digital photo studio", sources: "Supplier directory", marketing: "Marketing posts", "ai-media": "AI photos & video",
  insights: "Insights", reviews: "Reviews", channels: "Get more buyers", plans: "Plans", "price-check": "Price check", "supplier/[pid]": "Product",
  welcome: "Name your store", "digital-designs": "Digital designs", "digital-editor": "Design editor",
};

function Header({ options, route, back, navigation }: NativeStackHeaderProps) {
  const title = typeof options.title === "string" && options.title ? options.title : TITLES[route.name] ?? "";
  const right = options.headerRight?.({ canGoBack: Boolean(back), tintColor: undefined });
  return <PageHeader title={title} canGoBack={Boolean(back)} onBack={() => (navigation.canGoBack() ? navigation.goBack() : router.replace("/"))} right={right} />;
}

export default function WebRootLayout() {
  const c = useColors();
  const [loaded, error] = useFonts({ BricolageGrotesque_600SemiBold, BricolageGrotesque_800ExtraBold, Figtree_400Regular, Figtree_500Medium, Figtree_700Bold });

  useEffect(() => {
    onUpgradeNeeded((plan, reason) => router.push({ pathname: "/plans", params: { highlight: plan, reason } }));
    account.refresh().then((m) => startBilling(m.account.id)).catch(() => {});
    return () => onUpgradeNeeded(null);
  }, []);
  if (!loaded && !error) return <View style={{ flex: 1, backgroundColor: c.bg }} />;

  const page = { width: "100%" as const, maxWidth: 960, alignSelf: "center" as const, backgroundColor: c.bg };
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

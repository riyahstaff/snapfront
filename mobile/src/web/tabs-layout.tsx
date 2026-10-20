// The website's version of src/app/(tabs)/_layout.tsx: the same pages, with no bottom icon bar
// (the top menu in web-nav.tsx replaces it) and a page title bar instead of the phone header.
// Web-only: metro.config.js swaps it in when building the website. Keep the screens in step.
import React from "react";
import { Pressable, Text } from "react-native";
import { router, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { fonts, useColors } from "@/lib/theme";
import { assistant } from "@/lib/assistant-store";
import { PAGE_WIDTH, PageHeader } from "./web-nav";

type HeaderProps = { options: { headerTitle?: unknown; title?: string; headerRight?: (p: { canGoBack: boolean }) => React.ReactNode }; route: { name: string } };
function Header({ options, route }: HeaderProps) {
  const title = typeof options.headerTitle === "string" ? options.headerTitle : options.title ?? route.name;
  return <PageHeader title={title} canGoBack={false} onBack={() => router.replace("/")} right={options.headerRight?.({ canGoBack: false })} />;
}

export default function WebTabsLayout() {
  const c = useColors();
  const page = { width: "100%" as const, maxWidth: PAGE_WIDTH, alignSelf: "center" as const, backgroundColor: c.bg };
  return (
    <Tabs tabBar={() => null} screenOptions={{ header: (p) => <Header {...p} />, sceneStyle: page }}>
      <Tabs.Screen name="index" options={{ title: "Home", headerShown: false, sceneStyle: { backgroundColor: c.bg } }} />
      <Tabs.Screen name="find" options={{ title: "Find", headerTitle: "Find products",
        headerRight: () => (
          <Pressable onPress={() => router.push("/sources")} accessibilityRole="button" accessibilityLabel="Supplier directory" style={{ flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: c.line, borderRadius: 999, paddingHorizontal: 14, height: 36 }}>
            <Ionicons name="business-outline" size={17} color={c.accent} />
            <Text style={{ color: c.accent, fontFamily: fonts.bodyBold, fontSize: 14 }}>Suppliers</Text>
          </Pressable>
        ) }} />
      <Tabs.Screen name="assistant" options={{ title: "Assistant", headerTitle: "Store assistant",
        headerRight: () => (
          <Pressable onPress={() => assistant.clear()} accessibilityRole="button" accessibilityLabel="Start a new chat" style={{ flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: c.line, borderRadius: 999, paddingHorizontal: 14, height: 36 }}>
            <Ionicons name="create-outline" size={17} color={c.ink} />
            <Text style={{ color: c.ink, fontFamily: fonts.bodyBold, fontSize: 14 }}>New chat</Text>
          </Pressable>
        ) }} />
      <Tabs.Screen name="create" options={{ title: "Create", headerTitle: "Create a digital product" }} />
      <Tabs.Screen name="store" options={{ title: "My store", headerTitle: "My store" }} />
      <Tabs.Screen name="trends" options={{ href: null, headerTitle: "What's selling" }} />
    </Tabs>
  );
}

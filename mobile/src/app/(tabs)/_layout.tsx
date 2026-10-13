import React from "react";
import { router, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text } from "react-native";
import { fonts, useColors } from "@/lib/theme";
import { Brand } from "@/components/brand";
import { assistant } from "@/lib/assistant-store";

export default function TabsLayout() {
  const c = useColors();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: c.bg },
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: fonts.bodyMedium, fontSize: 19, color: c.ink },
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.muted,
        tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.line, paddingTop: 6, elevation: 0 },
        tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 11 },
        sceneStyle: { backgroundColor: c.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", headerTitle: () => <Brand size={28} />, headerRight: () => <Pressable onPress={() => router.push("/settings")} accessibilityRole="button" accessibilityLabel="Store settings" style={{ marginRight: 16, minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }}><Ionicons name="person-circle-outline" size={28} color={c.muted} /></Pressable>, tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="find" options={{ title: "Find", headerTitle: "Find products", tabBarIcon: ({ color, size }) => <Ionicons name="search" color={color} size={size} />,
        headerRight: () => (
          <Pressable onPress={() => router.push("/sources")} accessibilityRole="button" accessibilityLabel="Supplier directory" hitSlop={12} style={{ marginRight: 16, flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="business-outline" size={20} color={c.accent} />
            <Text style={{ color: c.accent, fontFamily: fonts.bodyBold, fontSize: 14 }}>Suppliers</Text>
          </Pressable>
        ) }} />
      <Tabs.Screen name="assistant" options={{
        title: "Assistant", headerTitle: "Store assistant",
        tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles-outline" color={color} size={size} />,
        headerRight: () => (
          <Pressable onPress={() => assistant.clear()} accessibilityRole="button" accessibilityLabel="Start a new chat" hitSlop={12} style={{ marginRight: 16 }}>
            <Ionicons name="create-outline" size={22} color={c.ink} />
          </Pressable>
        ),
      }} />
      <Tabs.Screen name="create" options={{ title: "Create", headerTitle: "Create a digital product", tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="store" options={{ title: "My store", headerTitle: "My store", tabBarIcon: ({ color, size }) => <Ionicons name="storefront-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="trends" options={{ href: null, headerTitle: "What's selling" }} />
    </Tabs>
  );
}

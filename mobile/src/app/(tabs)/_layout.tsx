import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { fonts, useColors } from "@/lib/theme";

export default function TabsLayout() {
  const c = useColors();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: c.bg },
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: fonts.display, fontSize: 20, color: c.ink },
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.muted,
        tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.line },
        tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 11 },
        sceneStyle: { backgroundColor: c.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Snap", headerTitle: "Snapfront", tabBarIcon: ({ color, size }) => <Ionicons name="scan" color={color} size={size} /> }} />
      <Tabs.Screen name="create" options={{ title: "Create", headerTitle: "Create a digital product", tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="store" options={{ title: "My store", headerTitle: "My store", tabBarIcon: ({ color, size }) => <Ionicons name="storefront-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="trends" options={{ title: "Trending", headerTitle: "What's selling", tabBarIcon: ({ color, size }) => <Ionicons name="trending-up" color={color} size={size} /> }} />
    </Tabs>
  );
}

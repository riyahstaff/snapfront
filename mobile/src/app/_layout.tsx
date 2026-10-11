import React, { useEffect } from "react";
import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts, BricolageGrotesque_600SemiBold, BricolageGrotesque_800ExtraBold } from "@expo-google-fonts/bricolage-grotesque";
import { Figtree_400Regular, Figtree_500Medium, Figtree_700Bold } from "@expo-google-fonts/figtree";
import { fonts, useColors } from "@/lib/theme";
import { onUpgradeNeeded } from "@/lib/api";
import { account } from "@/lib/account-store";
import { startBilling } from "@/lib/billing";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const c = useColors();
  const [loaded, error] = useFonts({ BricolageGrotesque_600SemiBold, BricolageGrotesque_800ExtraBold, Figtree_400Regular, Figtree_500Medium, Figtree_700Bold });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync().catch(() => {});
  }, [loaded, error]);

  useEffect(() => {
    // Anything that needs a paid plan opens the plans screen with the server's reason.
    onUpgradeNeeded((plan, reason) => router.push({ pathname: "/plans", params: { highlight: plan, reason } }));
    account.refresh().then((m) => startBilling(m.account.id)).catch(() => {});
    return () => onUpgradeNeeded(null);
  }, []);
  if (!loaded && !error) return null;

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: c.bg },
          headerShadowVisible: false,
          headerTintColor: c.ink,
          headerTitleStyle: { fontFamily: fonts.bodyBold },
          contentStyle: { backgroundColor: c.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="draft" options={{ title: "Your product page" }} />
        <Stack.Screen name="product/[id]" options={{ title: "Product" }} />
        <Stack.Screen name="settings" options={{ title: "Store settings", presentation: "modal" }} />
        <Stack.Screen name="orders" options={{ title: "Orders" }} />
        <Stack.Screen name="discounts" options={{ title: "Discount codes" }} />
        <Stack.Screen name="plans" options={{ title: "Plans", presentation: "modal" }} />
        <Stack.Screen name="price-check" options={{ title: "Price check" }} />
        <Stack.Screen name="supplier/[pid]" options={{ title: "Product from CJ" }} />
      </Stack>
    </>
  );
}

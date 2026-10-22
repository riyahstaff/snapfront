import React, { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, View } from "react-native";
import * as ScreenOrientation from "expo-screen-orientation";
import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts, BricolageGrotesque_600SemiBold, BricolageGrotesque_800ExtraBold } from "@expo-google-fonts/bricolage-grotesque";
import { Figtree_400Regular, Figtree_500Medium, Figtree_700Bold } from "@expo-google-fonts/figtree";
import { fonts, useColors } from "@/lib/theme";
import { onUpgradeNeeded } from "@/lib/api";
import { account, useMe } from "@/lib/account-store";
import { gateFor, MemberGate } from "@/components/member-gate";
import { startBilling } from "@/lib/billing";
import * as SecureStore from "expo-secure-store";
import { DEFAULT_STORE_NAME, NAMED_KEY } from "@/lib/store-address";

SplashScreen.preventAutoHideAsync().catch(() => {});
// Phones stay upright; tablets (shortest side 600dp or more) can turn sideways for the wider layout.
{
  const { width, height } = Dimensions.get("screen");
  if (Math.min(width, height) < 600) ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
}

export default function RootLayout() {
  const c = useColors();
  const [loaded, error] = useFonts({ BricolageGrotesque_600SemiBold, BricolageGrotesque_800ExtraBold, Figtree_400Regular, Figtree_500Medium, Figtree_700Bold });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync().catch(() => {});
  }, [loaded, error]);

  const me = useMe();
  const [checked, setChecked] = useState(false);
  const [failed, setFailed] = useState(false);
  const load = useCallback(() => {
    account.refresh().then((m) => startBilling(m.account.id)).then(() => setFailed(false), () => setFailed(true)).finally(() => setChecked(true));
  }, []);
  useEffect(() => {
    // Anything that needs a membership opens the membership screen with the server's reason.
    onUpgradeNeeded((plan, reason) => router.push({ pathname: "/plans", params: { highlight: plan, reason } }));
    load();
    return () => onUpgradeNeeded(null);
  }, [load]);
  // Sign in first, then members only (see member-gate.tsx). The app underneath stays mounted.
  const gate = gateFor(me, checked, failed);
  const asked = useRef(false);
  useEffect(() => {
    if (gate !== "open" || asked.current || !me) return;
    asked.current = true;
    // Members name their store first if they haven't yet; it also becomes the store's web address.
    (async () => {
      if (me.store_name === DEFAULT_STORE_NAME && !(await SecureStore.getItemAsync(NAMED_KEY).catch(() => null))) router.push("/welcome");
    })();
  }, [gate, me]);
  if (!loaded && !error) return null;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar style={c.dark ? "light" : "dark"} />
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
        <Stack.Screen name="snap" options={{ title: "Snap a product" }} />
        <Stack.Screen name="draft" options={{ title: "Your product page" }} />
        <Stack.Screen name="product/[id]" options={{ title: "Product" }} />
        <Stack.Screen name="settings" options={{ title: "Store settings", presentation: "modal" }} />
        <Stack.Screen name="orders" options={{ title: "Orders" }} />
        <Stack.Screen name="business" options={{ title: "Sales & profit" }} />
        <Stack.Screen name="email" options={{ title: "Email marketing" }} />
        <Stack.Screen name="affiliates" options={{ title: "Affiliates" }} />
        <Stack.Screen name="pixels" options={{ title: "Ad pixels" }} />
        <Stack.Screen name="autodm" options={{ title: "Instagram AutoDM" }} />
        <Stack.Screen name="earn" options={{ title: "Earn with Snapfront" }} />
        <Stack.Screen name="academy" options={{ title: "Snapfront Academy" }} />
        <Stack.Screen name="prompts" options={{ title: "Bonus: 1k Prompts" }} />
        <Stack.Screen name="youtube" options={{ title: "YouTube Shorts" }} />
        <Stack.Screen name="prompt/[id]" options={{ title: "Prompt" }} />
        <Stack.Screen name="lesson/[id]" options={{ title: "Lesson" }} />
        <Stack.Screen name="start" options={{ title: "Start here" }} />
        <Stack.Screen name="community" options={{ title: "Community" }} />
        <Stack.Screen name="community-post/[id]" options={{ title: "Post" }} />
        <Stack.Screen name="faceless" options={{ title: "Faceless videos" }} />
        <Stack.Screen name="avatars" options={{ title: "AI avatars" }} />
        <Stack.Screen name="credits" options={{ title: "Credits" }} />
        <Stack.Screen name="ugc" options={{ title: "UGC creator kit" }} />
        <Stack.Screen name="discounts" options={{ title: "Discount codes" }} />
        <Stack.Screen name="looks" options={{ title: "Store look" }} />
        <Stack.Screen name="store-offers" options={{ title: "Bundles & subscriptions" }} />
        <Stack.Screen name="storefront-setup" options={{ title: "Storefront setup" }} />
        <Stack.Screen name="studio" options={{ title: "Product Photo Cleanup" }} />
        <Stack.Screen name="digital-photo-studio" options={{ title: "Digital Photo Studio" }} />
        <Stack.Screen name="sources" options={{ title: "Supplier directory" }} />
        <Stack.Screen name="marketing" options={{ title: "Marketing posts" }} />
        <Stack.Screen name="ai-media" options={{ title: "AI photos & video" }} />
        <Stack.Screen name="insights" options={{ title: "Insights" }} />
        <Stack.Screen name="reviews" options={{ title: "Reviews" }} />
        <Stack.Screen name="channels" options={{ title: "Get more buyers" }} />
        <Stack.Screen name="plans" options={{ title: "Membership", presentation: "modal" }} />
        <Stack.Screen name="sign-in" options={{ title: "Sign in", presentation: "modal" }} />
        <Stack.Screen name="price-check" options={{ title: "Price check" }} />
        <Stack.Screen name="supplier/[pid]" options={{ title: "Product" }} />
        <Stack.Screen name="welcome" options={{ title: "", presentation: "modal" }} />
      </Stack>
      {gate !== "open" ? (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }}>
          <MemberGate state={gate} onRetry={load} />
        </View>
      ) : null}
    </View>
  );
}

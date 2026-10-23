// The website's top menu (app.snapfront.app): logo, text links, plan badge and account.
// On narrow screens the links fold into a ☰ menu. Web-only: the phone app keeps its tab bar.
import React, { useState } from "react";
import { SiteSearch } from "./site-search";
import { Pressable, ScrollView, Text, View, useWindowDimensions, type PressableStateCallbackType, type ViewStyle } from "react-native";
import { router, usePathname, type Href } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { account, useMe } from "@/lib/account-store";
import { api } from "@/lib/api";
import { alpha, fonts, theme, useColors } from "@/lib/theme";
import { PAGE_MAX, type PageWidth } from "@/lib/page-width";

// Keep the marketing funnel separate from the signed-in merchant workspace.
// `addon`: a paid add-on page; the link shows a lock until it's paid (the page itself stays locked too).
type NavItem = { label: string; href: Href; match: (p: string) => boolean; addon?: "youtube" };
export const NAV: NavItem[] = [
  { label: "My store", href: "/store", match: (p) => p.startsWith("/store") || p.startsWith("/looks") },
  { label: "Create", href: "/snap", match: (p) => p.startsWith("/snap") || p.startsWith("/draft") },
  { label: "Digital products", href: "/create", match: (p) => p.startsWith("/create") || p.startsWith("/digital") },
  { label: "Create an Avatar", href: "/avatars", match: (p) => p.startsWith("/avatars") },
  { label: "Marketing", href: "/marketing", match: (p) => p.startsWith("/marketing") },
  { label: "YouTube Shorts", href: "/youtube", match: (p) => p.startsWith("/youtube"), addon: "youtube" },
  { label: "Academy", href: "/academy", match: (p) => p.startsWith("/academy") },
  { label: "Bonus: 1k Prompts", href: "/prompts", match: (p) => p.startsWith("/prompt") },
];
export const WIDE = 980;
// Pages fill the screen on computers (up to about 1900px with a slim margin); phones and tablets fit as before.
export const CONTENT = 1840;
export const PAGE_WIDTH = CONTENT + 48;

type Hover = PressableStateCallbackType & { hovered?: boolean };
const go = (href: Href) => router.push(href);

export function WebNav() {
  const c = useColors();
  const me = useMe();
  const path = usePathname() || "/";
  const { width, height } = useWindowDimensions();
  // Leave room for every link and the membership button; smaller screens use the menu.
  const wide = width >= Math.max(WIDE, 1580);
  const locked = (n: NavItem) => Boolean(n.addon && !me?.addons?.[n.addon]);
  const [open, setOpen] = useState(false);
  const plan = me?.account.plan ?? "free";
  const signedIn = Boolean(me?.account.email);
  const menu: NavItem[] = signedIn ? [
    { label: "Home", href: "/", match: (p) => p === "/" }, ...NAV,
    { label: "Find products", href: "/find", match: (p) => p.startsWith("/find") },
    { label: "Affiliates & UGC", href: "/ugc", match: (p) => p.startsWith("/ugc") || p.startsWith("/affiliates") },
    { label: "Sales & profit", href: "/business", match: (p) => p.startsWith("/business") },
    { label: "Membership", href: "/plans", match: (p) => p.startsWith("/plans") },
    { label: "Settings", href: "/settings", match: (p) => p.startsWith("/settings") },
    { label: "Help & support", href: "/support", match: (p) => p === "/support" },
    ...(me?.owner ? [{ label: "AI Marketing Center (owner)", href: "/marketing-center" as Href, match: (p: string) => p.startsWith("/marketing-center") }, { label: "Support inbox (owner)", href: "/support-inbox" as Href, match: (p: string) => p.startsWith("/support-inbox") }] : []),
  ] : [
    { label: "Explore Snapfront", href: "/" as Href, match: (p) => p === "/" },
    { label: "Membership", href: "/plans", match: (p) => p.startsWith("/plans") },
    { label: "Sign in / Register", href: "/sign-in", match: (p) => p.startsWith("/sign-in") },
  ];

  // Checkout stays focused even when a visitor already has a verified account.
  // Never expose any store, marketing, training or profile navigation on /plans.
  if (path === "/plans") {
    return (
      <View style={{ backgroundColor: alpha(c.bg, 0.94), borderBottomWidth: 1, borderColor: c.sunk }}>
        <View style={{ height: 68, width: "100%", maxWidth: CONTENT + 48, alignSelf: "center", paddingHorizontal: 24, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Image source={require("../../assets/brand-mark.png")} contentFit="contain" style={{ width: 30, height: 33 }} />
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 20, letterSpacing: -0.3, color: c.ink }}>snapfront</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="lock-closed-outline" size={15} color={c.muted} />
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: c.muted }}>Secure membership</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ zIndex: 50, backgroundColor: alpha(c.bg, 0.94), borderBottomWidth: 1, borderColor: c.sunk }}>
      <View role="navigation" style={{ height: 68, width: "100%", maxWidth: CONTENT + 48, alignSelf: "center", paddingHorizontal: wide ? 24 : 16, flexDirection: "row", alignItems: "center", gap: wide ? 28 : 12 }}>
        <Pressable accessibilityRole="link" accessibilityLabel="Snapfront home" onPress={() => go("/")} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Image source={require("../../assets/brand-mark.png")} contentFit="contain" style={{ width: 30, height: 33 }} />
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 20, letterSpacing: -0.3, color: c.ink }}>snapfront</Text>
        </Pressable>
        {wide ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, flex: 1 }}>
            {(signedIn ? NAV : [{ label: "Explore features", href: "/" as Href, match: (p: string) => p === "/" }, { label: "Pricing", href: "/plans" as Href, match: (p: string) => p.startsWith("/plans") }]).map((n) => <NavLink key={n.label} label={n.label} href={n.href} active={n.match(path)} locked={locked(n)} />)}
          </View>
        ) : <View style={{ flex: 1 }} />}
        <View style={{ flexDirection: "row", alignItems: "center", gap: wide ? 10 : 4 }}>
          {plan === "free" ? (
            <Pressable accessibilityRole="link" onPress={() => go(signedIn ? "/plans" : "/sign-in")} style={(s: Hover): ViewStyle => ({ backgroundColor: s.hovered ? c.accentHover : c.accent, borderRadius: 10, paddingHorizontal: wide ? 18 : 14, height: 38, justifyContent: "center" })}>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: c.onAccent }}>{signedIn ? (wide ? "Unlock full access" : "Upgrade") : (wide ? "Get started free" : "Join free")}</Text>
            </Pressable>
          ) : (
            <Pressable accessibilityRole="link" onPress={() => go("/plans")} style={{ borderWidth: 1, borderColor: c.line, borderRadius: 10, paddingHorizontal: 12, height: 32, justifyContent: "center" }}>
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: c.good }}>{plan === "pro" ? (me?.account.lifetime ? "Lifetime" : "Pro") : "Launch"}</Text>
            </Pressable>
          )}
          <ThemeToggle />
          {signedIn && wide ? <Pressable accessibilityRole="link" accessibilityLabel="Account and store settings" onPress={() => go("/settings")}
            style={(s: Hover): ViewStyle => ({ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: s.hovered || path.startsWith("/settings") ? c.sunk : "transparent" })}>
            <Ionicons name="person-circle-outline" size={26} color={c.muted} />
          </Pressable> : null}
          {!wide ? (
            <Pressable accessibilityRole="button" accessibilityLabel={open ? "Close menu" : "Open menu"} accessibilityState={{ expanded: open }} onPress={() => setOpen((o) => !o)}
              style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name={open ? "close" : "menu"} size={26} color={c.ink} />
            </Pressable>
          ) : null}
        </View>
      </View>
      {signedIn ? <View style={{ width: "100%", maxWidth: CONTENT + 48, alignSelf: "center", paddingHorizontal: wide ? 24 : 16, paddingBottom: 12, zIndex: 60 }}><SiteSearch key={path} /></View> : null}
      {!wide && open ? <Pressable accessibilityLabel="Close menu" onPress={() => setOpen(false)} style={{ position: "absolute", top: signedIn ? 124 : 69, left: 0, right: 0, height: 4000, backgroundColor: c.dark ? "rgba(5,6,8,0.72)" : "rgba(15,18,23,0.35)" }} /> : null}
      {!wide && open ? (
        <View style={{ position: "absolute", top: signedIn ? 124 : 69, left: 0, right: 0, backgroundColor: c.bg, borderBottomWidth: 1, borderColor: c.line, paddingVertical: 8, paddingHorizontal: 16, boxShadow: c.dark ? "0 30px 60px rgba(0,0,0,0.5)" : "0 30px 60px rgba(15,18,23,0.12)" } as ViewStyle}>
          <ScrollView style={{ maxHeight: Math.max(160, height - (signedIn ? 148 : 93)) }}>
          {menu.map((n) => (
            <Pressable key={n.label} accessibilityRole="link" onPress={() => { setOpen(false); go(n.href); }}
              style={{ paddingVertical: 14, paddingHorizontal: 8, borderBottomWidth: 1, borderColor: c.sunk, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontFamily: n.match(path) ? fonts.bodyBold : fonts.bodyMedium, fontSize: 17, color: n.match(path) ? c.ink : c.muted }}>{n.label}</Text>
              {locked(n) ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: c.muted }}>Add-on</Text>
                  <Ionicons name="lock-closed" size={16} color={c.muted} />
                </View>
              ) : <Ionicons name="chevron-forward" size={18} color={c.line} />}
            </Pressable>
          ))}
          {signedIn ? (
            <Pressable accessibilityRole="button" onPress={async () => { setOpen(false); await api.signOut(); account.clear(); go("/sign-in"); }}
              style={{ paddingVertical: 14, paddingHorizontal: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 17, color: c.muted }}>Sign out</Text>
              <Ionicons name="log-out-outline" size={18} color={c.line} />
            </Pressable>
          ) : null}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

function NavLink({ label, href, active, locked }: { label: string; href: Href; active: boolean; locked?: boolean }) {
  const c = useColors();
  return (
    <Pressable accessibilityRole="link" accessibilityLabel={locked ? `${label}, paid add-on` : label} onPress={() => go(href)}
      style={(s: Hover): ViewStyle => ({ paddingHorizontal: 12, height: 36, borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: active ? c.sunk : s.hovered ? alpha(c.sunk, 0.7) : "transparent" })}>
      {(s: Hover) => <>
        <Text style={{ fontFamily: active ? fonts.bodyBold : fonts.bodyMedium, fontSize: 15, color: active || s.hovered ? c.ink : c.muted }}>{label}</Text>
        {locked ? <Ionicons name="lock-closed" size={13} color={c.muted} /> : null}
      </>}
    </Pressable>
  );
}

/** Page title bar for inner pages: back link, title and any page actions, aligned with the content. */
export function PageHeader({ title, canGoBack, onBack, right, width = "full" }: { title: string; canGoBack: boolean; onBack: () => void; right?: React.ReactNode; width?: PageWidth }) {
  const c = useColors();
  return (
    <View style={{ backgroundColor: c.bg }}>
      <View style={{ width: "100%", maxWidth: PAGE_MAX[width] ?? PAGE_WIDTH, alignSelf: "center", paddingHorizontal: 24, paddingTop: 22, paddingBottom: 4, flexDirection: "row", alignItems: "center", gap: 12, minHeight: 66 }}>
        {canGoBack ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack}
            style={(s: Hover): ViewStyle => ({ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: c.line, alignItems: "center", justifyContent: "center", backgroundColor: s.hovered ? c.sunk : "transparent" })}>
            <Ionicons name="arrow-back" size={18} color={c.ink} />
          </Pressable>
        ) : null}
        <Text accessibilityRole="header" numberOfLines={1} style={{ flex: 1, fontFamily: fonts.display, fontSize: 28, letterSpacing: -0.7, color: c.ink }}>{title}</Text>
        {right}
      </View>
    </View>
  );
}

/** Website footer used at the bottom of the home page. */
export function WebFooter() {
  const c = useColors();
  const link = (label: string, href: string) => (
    <Pressable key={label} accessibilityRole="link" onPress={() => window.location.assign(href)}>
      {(s: Hover) => <Text style={{ fontFamily: fonts.body, fontSize: 14, color: s.hovered ? c.ink : c.muted }}>{label}</Text>}
    </Pressable>
  );
  return (
    <View style={{ borderTopWidth: 1, borderColor: c.sunk, marginTop: 72 }}>
      <View style={{ width: "100%", maxWidth: CONTENT, alignSelf: "center", paddingHorizontal: 24, paddingVertical: 32, flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 16 }}>
        <Text style={{ fontFamily: fonts.body, fontSize: 14, color: c.muted }}>© {new Date().getFullYear()} Snapfront · support@snapfront.app</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 20 }}>
          {link("snapfront.app", "https://snapfront.app")}{link("Claude & ChatGPT", "https://snapfront.app/connect-ai")}{link("Bonus: 1k Prompts", "/prompts")}{link("Tools", "https://snapfront.app/tools")}{link("Help & FAQ", "https://snapfront.app/help")}{link("Privacy", "https://snapfront.app/privacy")}{link("Terms", "https://snapfront.app/terms")}{link("Delete account", "https://snapfront.app/delete-account")}
        </View>
      </View>
    </View>
  );
}

/** Sun/moon button: switches between the dark and light look (remembered on this device). */
function ThemeToggle() {
  const c = useColors();
  const next = c.dark ? "light" : "dark";
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Switch to the ${next} theme`} onPress={() => theme.set(next)}
      style={(s: Hover): ViewStyle => ({ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: s.hovered ? c.sunk : "transparent" })}>
      <Ionicons name={c.dark ? "sunny-outline" : "moon-outline"} size={21} color={c.muted} />
    </Pressable>
  );
}

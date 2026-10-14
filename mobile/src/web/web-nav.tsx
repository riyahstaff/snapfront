// The website's top menu (app.snapfront.app): logo, text links, plan badge and account.
// On narrow screens the links fold into a ☰ menu. Web-only: the phone app keeps its tab bar.
import React, { useState } from "react";
import { Pressable, Text, View, useWindowDimensions, type PressableStateCallbackType, type ViewStyle } from "react-native";
import { router, usePathname, type Href } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useMe } from "@/lib/account-store";
import { fonts, useColors } from "@/lib/theme";

export const NAV: { label: string; href: Href; match: (p: string) => boolean }[] = [
  { label: "Create", href: "/snap", match: (p) => p.startsWith("/snap") || p.startsWith("/draft") },
  { label: "Digital products", href: "/create", match: (p) => p.startsWith("/create") || p.startsWith("/digital") },
  { label: "My store", href: "/store", match: (p) => ["/store", "/discounts", "/looks", "/storefront-setup", "/insights", "/reviews", "/product"].some((x) => p.startsWith(x)) },
  { label: "Sales & profit", href: "/business", match: (p) => p.startsWith("/business") || p.startsWith("/orders") },
  { label: "Marketing", href: "/marketing", match: (p) => ["/marketing", "/ai-media", "/channels", "/studio", "/faceless", "/ugc", "/email", "/autodm", "/affiliates", "/pixels"].some((x) => p.startsWith(x)) },
  { label: "Find products", href: "/find", match: (p) => ["/find", "/sources", "/supplier", "/price-check", "/trends"].some((x) => p.startsWith(x)) },
  { label: "Academy", href: "/academy", match: (p) => p.startsWith("/academy") || p.startsWith("/lesson") || p.startsWith("/community") },
  { label: "Assistant", href: "/assistant", match: (p) => p.startsWith("/assistant") },
];
export const WIDE = 980;
export const CONTENT = 1180;

type Hover = PressableStateCallbackType & { hovered?: boolean };
const go = (href: Href) => router.push(href);

export function WebNav() {
  const c = useColors();
  const me = useMe();
  const path = usePathname() || "/";
  const { width } = useWindowDimensions();
  // The full row of links needs about 1300px next to the membership button; narrower gets the menu.
  const wide = width >= Math.max(WIDE, 1300);
  const [open, setOpen] = useState(false);
  const plan = me?.account.plan ?? "free";
  const menu: { label: string; href: Href; match: (p: string) => boolean }[] = [
    { label: "Home", href: "/", match: (p) => p === "/" }, ...NAV,
    { label: "Membership", href: "/plans", match: (p) => p.startsWith("/plans") },
    ...(me?.account.email ? [] : [{ label: "Sign in", href: "/sign-in" as Href, match: (p: string) => p.startsWith("/sign-in") }]),
    { label: "Earn with Snapfront", href: "/earn", match: (p) => p.startsWith("/earn") },
    { label: "Community", href: "/community", match: (p) => p.startsWith("/community") },
    { label: "Settings", href: "/settings", match: (p) => p.startsWith("/settings") },
  ];

  return (
    <View style={{ zIndex: 50, backgroundColor: "rgba(9,11,14,0.94)", borderBottomWidth: 1, borderColor: c.sunk }}>
      <View role="navigation" style={{ height: 68, width: "100%", maxWidth: CONTENT + 48, alignSelf: "center", paddingHorizontal: 24, flexDirection: "row", alignItems: "center", gap: 28 }}>
        <Pressable accessibilityRole="link" accessibilityLabel="Snapfront home" onPress={() => go("/")} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Image source={require("../../assets/brand-mark.png")} contentFit="contain" style={{ width: 30, height: 33 }} />
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 20, letterSpacing: -0.3, color: c.ink }}>snapfront</Text>
        </Pressable>
        {wide ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, flex: 1 }}>
            {NAV.map((n) => <NavLink key={n.label} label={n.label} href={n.href} active={n.match(path)} />)}
          </View>
        ) : <View style={{ flex: 1 }} />}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          {plan === "free" ? (
            <Pressable accessibilityRole="link" onPress={() => go("/plans")} style={(s: Hover): ViewStyle => ({ backgroundColor: s.hovered ? "#FFFFFF" : c.accent, borderRadius: 999, paddingHorizontal: 18, height: 38, justifyContent: "center" })}>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: c.onAccent }}>Become a member</Text>
            </Pressable>
          ) : (
            <Pressable accessibilityRole="link" onPress={() => go("/plans")} style={{ borderWidth: 1, borderColor: c.line, borderRadius: 999, paddingHorizontal: 12, height: 32, justifyContent: "center" }}>
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: c.good }}>{plan === "pro" ? (me?.account.lifetime ? "Lifetime" : "Pro") : "Launch"}</Text>
            </Pressable>
          )}
          <Pressable accessibilityRole="link" accessibilityLabel="Account and store settings" onPress={() => go("/settings")}
            style={(s: Hover): ViewStyle => ({ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: s.hovered || path.startsWith("/settings") ? c.sunk : "transparent" })}>
            <Ionicons name="person-circle-outline" size={26} color={c.muted} />
          </Pressable>
          {!wide ? (
            <Pressable accessibilityRole="button" accessibilityLabel={open ? "Close menu" : "Open menu"} accessibilityState={{ expanded: open }} onPress={() => setOpen((o) => !o)}
              style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name={open ? "close" : "menu"} size={26} color={c.ink} />
            </Pressable>
          ) : null}
        </View>
      </View>
      {!wide && open ? <Pressable accessibilityLabel="Close menu" onPress={() => setOpen(false)} style={{ position: "absolute", top: 69, left: 0, right: 0, height: 4000, backgroundColor: "rgba(5,6,8,0.72)" }} /> : null}
      {!wide && open ? (
        <View style={{ position: "absolute", top: 69, left: 0, right: 0, backgroundColor: c.bg, borderBottomWidth: 1, borderColor: c.line, paddingVertical: 8, paddingHorizontal: 16, boxShadow: "0 30px 60px rgba(0,0,0,0.5)" } as ViewStyle}>
          {menu.map((n) => (
            <Pressable key={n.label} accessibilityRole="link" onPress={() => { setOpen(false); go(n.href); }}
              style={{ paddingVertical: 14, paddingHorizontal: 8, borderBottomWidth: 1, borderColor: c.sunk, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontFamily: n.match(path) ? fonts.bodyBold : fonts.bodyMedium, fontSize: 17, color: n.match(path) ? c.ink : c.muted }}>{n.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={c.line} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function NavLink({ label, href, active }: { label: string; href: Href; active: boolean }) {
  const c = useColors();
  return (
    <Pressable accessibilityRole="link" onPress={() => go(href)}
      style={(s: Hover): ViewStyle => ({ paddingHorizontal: 12, height: 36, borderRadius: 999, justifyContent: "center", backgroundColor: active ? c.sunk : s.hovered ? "rgba(29,33,40,0.7)" : "transparent" })}>
      {(s: Hover) => <Text style={{ fontFamily: active ? fonts.bodyBold : fonts.bodyMedium, fontSize: 15, color: active || s.hovered ? c.ink : c.muted }}>{label}</Text>}
    </Pressable>
  );
}

/** Page title bar for inner pages: back link, title and any page actions, aligned with the content. */
export function PageHeader({ title, canGoBack, onBack, right }: { title: string; canGoBack: boolean; onBack: () => void; right?: React.ReactNode }) {
  const c = useColors();
  return (
    <View style={{ backgroundColor: c.bg }}>
      <View style={{ width: "100%", maxWidth: 960, alignSelf: "center", paddingHorizontal: 24, paddingTop: 22, paddingBottom: 4, flexDirection: "row", alignItems: "center", gap: 12, minHeight: 66 }}>
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
          {link("snapfront.app", "https://snapfront.app")}{link("Privacy", "https://snapfront.app/privacy")}{link("Terms", "https://snapfront.app/terms")}{link("Delete account", "https://snapfront.app/delete-account")}
        </View>
      </View>
    </View>
  );
}

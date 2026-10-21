/** Liquid Chrome UI with Noir Atelier's copper brand signature. Dark is the signature look; light is a choice. */
import { useSyncExternalStore } from "react";
import { Platform, useColorScheme } from "react-native";
import * as SecureStore from "expo-secure-store";

export const chrome = {
  bg: "#090B0E", surface: "#14171C", sunk: "#1D2128",
  ink: "#F5F6F8", muted: "#ADB4BF", line: "#363C46",
  accent: "#E5E9F0", onAccent: "#11151B", accentHover: "#FFFFFF",
  flash: "#D7DDE6", onFlash: "#11151B",
  good: "#76D8B3", bad: "#FFA89C", brand: "#D99568",
  dark: true,
};
export type Colors = { [K in keyof typeof chrome]: (typeof chrome)[K] extends boolean ? boolean : string };
/** The same chrome identity on a bright page: graphite buttons, porcelain surfaces, a deeper copper. */
export const porcelain: Colors = {
  bg: "#F4F5F7", surface: "#FFFFFF", sunk: "#E9ECF0",
  ink: "#0F1217", muted: "#596170", line: "#D5DAE1",
  accent: "#15191F", onAccent: "#FFFFFF", accentHover: "#2C333D",
  flash: "#1D2128", onFlash: "#FFFFFF",
  good: "#0A6F4E", bad: "#B8402C", brand: "#9A5328",
  dark: false,
};
/** A colour from the palette with transparency, for glass bars and fades. */
export function alpha(hex: string, a: number) {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/* ---------- the person's choice: dark (default), light, or follow the device ---------- */
export type ThemeChoice = "dark" | "light" | "system";
const KEY = "snapfront.theme";
const valid = (v: unknown): v is ThemeChoice => v === "dark" || v === "light" || v === "system";
function readNow(): ThemeChoice {
  if (Platform.OS !== "web") return "dark";
  try { const v = globalThis.localStorage?.getItem(KEY); return valid(v) ? v : "dark"; } catch { return "dark"; }
}
let choice: ThemeChoice = readNow();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((f) => f());
if (Platform.OS !== "web") SecureStore.getItemAsync(KEY).then((v) => { if (valid(v) && v !== choice) { choice = v; emit(); } }).catch(() => {});
export const theme = {
  get: () => choice,
  set(next: ThemeChoice) {
    choice = next; emit();
    if (Platform.OS === "web") { try { globalThis.localStorage?.setItem(KEY, next); } catch { /* private mode */ } }
    else SecureStore.setItemAsync(KEY, next).catch(() => {});
  },
  subscribe(f: () => void) { listeners.add(f); return () => { listeners.delete(f); }; },
};
export function useThemeChoice(): ThemeChoice { return useSyncExternalStore(theme.subscribe, theme.get, theme.get); }
/** "light" or "dark" after applying "system". */
export function useScheme(): "light" | "dark" {
  const pick = useThemeChoice();
  const device = useColorScheme();
  return pick === "system" ? (device === "light" ? "light" : "dark") : pick;
}
export const fonts = {
  display: "Figtree_700Bold", displayMedium: "Figtree_500Medium",
  body: "Figtree_400Regular", bodyMedium: "Figtree_500Medium", bodyBold: "Figtree_700Bold",
};
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
// Controls use rounded rectangles (not ovals): buttons 12, chips and tags 10, inputs 14.
export const radius = { sm: 10, md: 14, lg: 22, pill: 10, button: 12 };
export const type = {
  hero: { fontFamily: fonts.display, fontSize: 36, lineHeight: 40, letterSpacing: -1.2 },
  title: { fontFamily: fonts.display, fontSize: 25, lineHeight: 30, letterSpacing: -0.6 },
  heading: { fontFamily: fonts.bodyBold, fontSize: 17, lineHeight: 23 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23 },
  small: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19 },
  label: { fontFamily: fonts.bodyBold, fontSize: 13, lineHeight: 19 },
  price: { fontFamily: fonts.display, fontSize: 26, lineHeight: 30, fontVariant: ["tabular-nums" as const] },
};
// Dark chrome unless the person picked light (or "system" on a light-mode device).
export function useColors(): Colors { return useScheme() === "light" ? porcelain : chrome; }

/** Liquid Chrome UI with Noir Atelier's copper brand signature. */
export const chrome = {
  bg: "#090B0E", surface: "#14171C", sunk: "#1D2128",
  ink: "#F5F6F8", muted: "#ADB4BF", line: "#363C46",
  accent: "#E5E9F0", onAccent: "#11151B",
  flash: "#D7DDE6", onFlash: "#11151B",
  good: "#76D8B3", bad: "#FFA89C", brand: "#D99568",
};
export type Colors = typeof chrome;
export const fonts = {
  display: "Figtree_700Bold", displayMedium: "Figtree_500Medium",
  body: "Figtree_400Regular", bodyMedium: "Figtree_500Medium", bodyBold: "Figtree_700Bold",
};
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 10, md: 18, lg: 24, pill: 999 };
export const type = {
  hero: { fontFamily: fonts.display, fontSize: 36, lineHeight: 40, letterSpacing: -1.2 },
  title: { fontFamily: fonts.display, fontSize: 25, lineHeight: 30, letterSpacing: -0.6 },
  heading: { fontFamily: fonts.bodyBold, fontSize: 17, lineHeight: 23 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23 },
  small: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19 },
  label: { fontFamily: fonts.bodyBold, fontSize: 13, lineHeight: 19 },
  price: { fontFamily: fonts.display, fontSize: 26, lineHeight: 30, fontVariant: ["tabular-nums" as const] },
};
// The chosen dark chrome identity is intentional on both light- and dark-mode devices.
export function useColors(): Colors { return chrome; }

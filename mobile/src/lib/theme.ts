import { useColorScheme } from "react-native";

/** Snapfront design tokens (mirrors the Snapfront design system). */
const light = {
  bg: "#F2F3F7",
  surface: "#FFFFFF",
  sunk: "#E7E9F1",
  ink: "#16152E",
  muted: "#5D5F78",
  line: "#D6D9E5",
  accent: "#2C47F5",
  onAccent: "#FFFFFF",
  flash: "#FFD84A",
  onFlash: "#16152E",
  good: "#157049",
  bad: "#B02E23",
};
const dark: typeof light = {
  bg: "#0F0F1C",
  surface: "#191A2B",
  sunk: "#232438",
  ink: "#EEEEF7",
  muted: "#A3A5BE",
  line: "#2F3149",
  accent: "#7C8CFF",
  onAccent: "#0F0F1C",
  flash: "#FFD84A",
  onFlash: "#16152E",
  good: "#4CC88C",
  bad: "#FF7A6B",
};
export type Colors = typeof light;

export const fonts = {
  display: "BricolageGrotesque_800ExtraBold",
  displayMedium: "BricolageGrotesque_600SemiBold",
  body: "Figtree_400Regular",
  bodyMedium: "Figtree_500Medium",
  bodyBold: "Figtree_700Bold",
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };
export const type = {
  hero: { fontFamily: fonts.display, fontSize: 34, lineHeight: 36, letterSpacing: -0.8 },
  title: { fontFamily: fonts.display, fontSize: 24, lineHeight: 28, letterSpacing: -0.4 },
  heading: { fontFamily: fonts.bodyBold, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  small: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fonts.bodyBold, fontSize: 13, lineHeight: 18 },
  price: { fontFamily: fonts.display, fontSize: 26, lineHeight: 30, fontVariant: ["tabular-nums" as const] },
};

export function useColors(): Colors {
  return useColorScheme() === "dark" ? dark : light;
}

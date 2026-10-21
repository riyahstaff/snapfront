// "Ask Vierra" (the voice guide) in the web app: the server adds her to the page hidden, and the Home
// screen shows her launcher while it's open. The phone app doesn't load her.
import { useCallback } from "react";
import { Platform } from "react-native";
import { useFocusEffect } from "expo-router";

type VierraApi = { show?: () => void; hide?: () => void };
const vierra = () => (typeof window === "undefined" ? undefined : (window as unknown as { Vierra?: VierraApi }).Vierra);

/** Show Vierra's launcher while this screen is focused (web only). */
export function useAskVierra() {
  useFocusEffect(useCallback(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const show = () => vierra()?.show?.();
    if (vierra()) show(); else window.addEventListener("vierra-ready", show, { once: true });
    return () => { window.removeEventListener("vierra-ready", show); vierra()?.hide?.(); };
  }, []));
}

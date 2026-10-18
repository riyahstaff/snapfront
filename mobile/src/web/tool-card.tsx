import React, { useEffect, useRef } from "react";
import { Pressable, Text, View, type PressableStateCallbackType } from "react-native";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { API_URL } from "@/lib/api";
import { alpha, fonts, radius, useColors } from "@/lib/theme";
type Hover = PressableStateCallbackType & { hovered?: boolean };
type Icon = React.ComponentProps<typeof Ionicons>["name"];
const ART_VERSION = 2;   // bump when the animations are remade, so browsers fetch the new ones
const artUrl = (key: string, ext: "webm" | "mp4" | "webp") => `${API_URL}/site/tools/${key}.${ext}?v=${ART_VERSION}`;

export function ToolCard({ title, art, detail, icon, href, columns, onPress }: { title: string; art: string; detail: string; icon: Icon; href?: Href; columns: number; onPress?: () => void }) {
  const c = useColors();
  return (
    <Pressable accessibilityRole="link" accessibilityLabel={`${title}: ${detail}`} onPress={onPress ?? (() => router.push(href!))}
      style={(s: Hover) => ({ flexBasis: columns === 4 ? "23%" : columns === 2 ? "47%" : "100%", flexGrow: 1, backgroundColor: c.surface, borderWidth: 1, borderColor: s.hovered ? c.muted : c.line, borderRadius: radius.lg, overflow: "hidden",
        transform: [{ translateY: s.hovered ? -4 : 0 }], boxShadow: s.hovered ? (c.dark ? "0 24px 60px rgba(0,0,0,0.55)" : "0 24px 50px rgba(15,18,23,0.14)") : "0 0 0 rgba(0,0,0,0)", transitionDuration: "300ms", transitionProperty: "transform, box-shadow, border-color" } as object)}>
      {(s: Hover) => (
        <>
          <CardArt art={art} hovered={!!s.hovered} />
          <View style={{ position: "absolute", top: 12, left: 12, width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(9,11,14,0.62)", backdropFilter: "blur(10px)" } as object}>
            <Ionicons name={icon} size={18} color="#ffffff" />
          </View>
          <View style={{ padding: 18, paddingTop: 16, gap: 6, flexGrow: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 17, color: c.ink, flexShrink: 1 }}>{title}</Text>
              <Ionicons name="arrow-forward" size={18} color={s.hovered ? c.ink : c.muted} style={{ transform: [{ translateX: s.hovered ? 3 : 0 }], transitionDuration: "300ms" } as object} />
            </View>
            <Text style={{ fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: c.muted }}>{detail}</Text>
          </View>
        </>
      )}
    </Pressable>
  );
}

/** A short silent loop that plays while the card is on screen (a still frame for people who prefer less motion). */
function CardArt({ art, hovered }: { art: string; hovered: boolean }) {
  const c = useColors();
  const ref = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.muted = true;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const sync = () => {
      if (visible && !preference.matches && document.visibilityState === "visible") el.play().catch(() => {});
      else el.pause();
    };
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    io.observe(el);
    preference.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect(); el.pause();
      preference.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);
  return (
    <View style={{ width: "100%", aspectRatio: 4 / 3, overflow: "hidden", backgroundColor: c.sunk }}>
      <video ref={ref} poster={artUrl(art, "webp")} muted loop playsInline preload="none" aria-hidden="true" disablePictureInPicture
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transform: hovered ? "scale(1.06)" : "scale(1)", transition: "transform 700ms cubic-bezier(.2,.7,.2,1)" }}>
        <source src={artUrl(art, "webm")} type="video/webm" />
        <source src={artUrl(art, "mp4")} type="video/mp4" />
      </video>
      {art === "reviews" ? <View pointerEvents="none" accessible={false} style={{ position: "absolute", bottom: "12%", alignSelf: "center", flexDirection: "row", gap: 6, backgroundColor: "rgba(9,11,14,.7)", borderRadius: 20, padding: 10 }}>
        {[0, 1, 2, 3, 4].map((star) => <Ionicons key={star} name="star" size={22} color="#ffd778" />)}
      </View> : null}
      {art === "insights" ? <svg aria-hidden="true" viewBox="0 0 200 90" style={{ position: "absolute", bottom: "12%", left: "8%", width: "42%", pointerEvents: "none", filter: "drop-shadow(0 0 8px #14cdbb)" }}>
        <rect x="0" y="0" width="200" height="90" rx="12" fill="rgba(9,11,14,.65)" />
        <path d="M18 72 L52 60 L87 64 L120 38 L150 43 L180 16" fill="none" stroke="#7cffe0" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {[18, 52, 87, 120, 150, 180].map((x, i) => <circle key={x} cx={x} cy={[72, 60, 64, 38, 43, 16][i]} r="4" fill="#fff" />)}
      </svg> : null}
      <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "38%", backgroundImage: `linear-gradient(180deg, ${alpha(c.surface, 0)} 0%, ${c.surface} 100%)` } as object} />
    </View>
  );
}

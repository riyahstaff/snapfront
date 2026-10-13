import React, { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, AppState, Platform, Pressable, ScrollView, Text, View, type LayoutChangeEvent } from "react-native";
import { router, useIsFocused } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemePreview } from "./theme-preview";
import { allowsThemeRotation, createThemeRotation, nextThemeIndex } from "@/lib/home-carousel";
import type { StoreTheme } from "@/lib/api";
import { radius, space, type, useColors } from "@/lib/theme";

type Props = { themes: StoreTheme[]; visible: boolean; onLayout: (event: LayoutChangeEvent) => void };
export function ThemeCarousel({ themes, visible, onLayout }: Props) {
  const c = useColors();
  const focused = useIsFocused();
  const scroll = useRef<ScrollView>(null);
  const indexRef = useRef(0);
  const [index, setIndex] = useState(0);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState(AppState.currentState === "active");
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
  const [screenReader, setScreenReader] = useState<boolean | null>(null);
  const [paused, setPaused] = useState(false);
  const [rotation] = useState(createThemeRotation);
  const safeIndex = Math.min(index, themes.length - 1);
  const state = { focused, active, visible, paused, reduceMotion, screenReader, count: themes.length };
  const running = allowsThemeRotation(state);
  const canAnimate = reduceMotion === false && screenReader === false;

  useEffect(() => {
    let alive = true, motionEvent = false, readerEvent = false;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (alive && !motionEvent) setReduceMotion(value); }).catch(() => { if (alive) setReduceMotion(true); });
    AccessibilityInfo.isScreenReaderEnabled().then((value) => { if (alive && !readerEvent) setScreenReader(value); }).catch(() => { if (alive) setScreenReader(true); });
    const motion = AccessibilityInfo.addEventListener("reduceMotionChanged", (value) => { motionEvent = true; setReduceMotion(value); });
    const reader = AccessibilityInfo.addEventListener("screenReaderChanged", (value) => { readerEvent = true; setScreenReader(value); });
    const foreground = AppState.addEventListener("change", (value) => { if (value !== "active") rotation.stop(); setActive(value === "active"); });
    const blur = Platform.OS === "android" ? AppState.addEventListener("blur", () => { rotation.stop(); setActive(false); }) : null;
    const focus = Platform.OS === "android" ? AppState.addEventListener("focus", () => setActive(AppState.currentState === "active")) : null;
    return () => { alive = false; motion.remove(); reader.remove(); foreground.remove(); blur?.remove(); focus?.remove(); rotation.stop(); };
  }, [rotation]);
  useEffect(() => {
    // The timer reads the latest viewport dimensions and index without being recreated on each tick.
    rotation.setTick(() => {
      if (!width || themes.length < 2) return;
      const next = nextThemeIndex(indexRef.current, themes.length);
      indexRef.current = next; setIndex(next);
      scroll.current?.scrollTo({ x: next * width, animated: next !== 0 });
    });
  }, [rotation, width, themes.length]);
  useEffect(() => {
    rotation.update({ focused, active, visible, paused, reduceMotion, screenReader, count: width ? themes.length : 0 });
    return () => rotation.stop();
  }, [rotation, focused, active, visible, paused, reduceMotion, screenReader, themes.length, width]);

  function show(direction: number) {
    rotation.stop(); setPaused(true);
    const next = nextThemeIndex(indexRef.current, themes.length, direction);
    indexRef.current = next; setIndex(next);
    scroll.current?.scrollTo({ x: next * width, animated: canAnimate });
  }
  function stopForInteraction() { rotation.stop(); setPaused(true); }
  return <View onLayout={onLayout} style={{ gap: space.sm }}>
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      <ScrollView ref={scroll} horizontal pagingEnabled showsHorizontalScrollIndicator={false} accessibilityLabel="Featured theme carousel"
        onScrollBeginDrag={stopForInteraction} scrollEventThrottle={64}
        onMomentumScrollEnd={(event) => { const next = Math.max(0, Math.min(themes.length - 1, Math.round(event.nativeEvent.contentOffset.x / Math.max(1, width)))); indexRef.current = next; setIndex(next); }}>
        {themes.map((theme, position) => <View key={theme.id} style={{ width: width || 280, paddingRight: 1 }}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Explore ${theme.name}. Demo theme ${position + 1} of ${themes.length}. Does not apply it.`}
            onPressIn={stopForInteraction} onPress={() => router.push({ pathname: "/looks", params: { query: theme.name } })}
            style={({ pressed }) => ({ backgroundColor: c.surface, borderColor: c.line, borderWidth: 1, borderRadius: radius.md, overflow: "hidden", opacity: pressed ? 0.85 : 1 })}>
            <ThemePreview theme={theme} storeName="Theme preview" height={190} style={{ borderWidth: 0, borderRadius: 0 }} />
            <View style={{ padding: 14, gap: 4 }}><Text style={[type.heading, { color: c.ink }]}>{theme.name}</Text><Text style={[type.small, { color: c.muted }]}>{theme.category || theme.for}</Text></View>
          </Pressable>
        </View>)}
      </ScrollView>
    </View>
    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
      <Text style={[type.small, { color: c.muted }]}>{Math.max(0, safeIndex) + 1} / {themes.length} · Theme demos</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Previous featured theme" disabled={themes.length < 2} onPress={() => show(-1)} style={{ minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }}><Ionicons name="chevron-back" size={20} color={c.ink} /></Pressable>
        {canAnimate && themes.length > 1 ? <Pressable accessibilityRole="button" accessibilityLabel={paused ? "Play automatic theme carousel" : "Pause automatic theme carousel"} onPress={() => setPaused((value) => !value)} style={{ minWidth: 76, minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 }}>
          <Ionicons name={paused ? "play-outline" : "pause-outline"} size={16} color={c.ink} /><Text style={[type.small, { color: c.ink }]}>{paused ? "Play" : "Pause"}</Text>
        </Pressable> : <Text style={[type.small, { color: c.muted }]}>Manual</Text>}
        <Pressable accessibilityRole="button" accessibilityLabel="Next featured theme" disabled={themes.length < 2} onPress={() => show(1)} style={{ minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }}><Ionicons name="chevron-forward" size={20} color={c.ink} /></Pressable>
      </View>
    </View>
    <Text style={[type.small, { color: c.muted }]}>{running ? "A new look every 5 seconds. Swipe or tap to pause." : "Swipe to explore. Browsing never changes your storefront."}</Text>
  </View>;
}

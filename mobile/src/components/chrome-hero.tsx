import React, { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, AppState, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "expo-router";
import { createChromeMotion } from "@/lib/chrome-motion";
import { fonts, radius, type, useColors } from "@/lib/theme";

export function ChromeHero() {
  const c = useColors();
  const focused = useIsFocused();
  const [active, setActive] = useState(AppState.currentState === "active");
  // Unknown is static. Never animate before the initial Reduce Motion query resolves.
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
  const [paused, setPaused] = useState(false);
  const [motion] = useState(createChromeMotion);

  useEffect(() => {
    let alive = true;
    let preferenceEvent = false;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (alive && !preferenceEvent) setReduceMotion(value); }).catch(() => { if (alive) setReduceMotion(true); });
    const preference = AccessibilityInfo.addEventListener("reduceMotionChanged", (value) => { preferenceEvent = true; setReduceMotion(value); });
    const foreground = AppState.addEventListener("change", (state) => setActive(state === "active"));
    const blur = Platform.OS === "android" ? AppState.addEventListener("blur", () => setActive(false)) : null;
    const focus = Platform.OS === "android" ? AppState.addEventListener("focus", () => setActive(AppState.currentState === "active")) : null;
    return () => { alive = false; preference.remove(); foreground.remove(); blur?.remove(); focus?.remove(); motion.stop(); };
  }, [motion]);
  useEffect(() => {
    motion.update({ focused, active, reduceMotion, paused });
    return () => motion.stop();
  }, [focused, active, reduceMotion, paused, motion]);

  return (
    <View style={[styles.frame, { backgroundColor: c.bg, borderColor: c.line }]}>
      <Animated.View pointerEvents="none" style={{ opacity: motion.entrance.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }), transform: [
        { translateY: Animated.add(motion.entrance.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }), motion.drift.interpolate({ inputRange: [0, 1], outputRange: [0, -4] })) },
      ] }}>
        <Image source={require("../../assets/chrome-hero.jpg")} contentFit="contain" accessible={false} style={{ width: "100%", aspectRatio: 4 / 3 }} />
      </Animated.View>
      <View style={[styles.caption, { backgroundColor: c.surface }]}>
        <Text style={[type.small, { color: c.muted, flex: 1 }]}>A glimpse of what you can create · Concept artwork</Text>
        {reduceMotion === false ? <Pressable onPress={() => setPaused((value) => !value)} accessibilityRole="button" accessibilityLabel={paused ? "Play home artwork motion" : "Pause home artwork motion"} accessibilityState={{ selected: paused }} style={styles.motionButton}>
          <Ionicons name={paused ? "play-outline" : "pause-outline"} size={16} color={c.ink} />
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: c.ink }}>{paused ? "Play" : "Pause"}</Text>
        </Pressable> : <Text style={[type.small, { color: c.muted }]}>Still</Text>}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  frame: { borderWidth: 1, borderRadius: radius.lg, overflow: "hidden" },
  caption: { flexDirection: "row", alignItems: "center", gap: 8, paddingLeft: 14, paddingRight: 6, paddingVertical: 4 },
  motionButton: { minWidth: 64, minHeight: 44, flexDirection: "row", gap: 4, alignItems: "center", justifyContent: "center" },
});

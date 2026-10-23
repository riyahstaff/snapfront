import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { type StoreTheme } from "@/lib/api";
import { availableThemePreview, themePreviewSources } from "@/lib/theme-preview-source";
import { fonts, radius } from "@/lib/theme";

type ThemePreviewProps = {
  theme: StoreTheme;
  storeName: string;
  photo?: string | null;
  height?: number;
  /** Keep the whole renderer snapshot visible in the design gallery. */
  uncropped?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** A catalog preview is illustrative. Seller Preview still opens the seller's own storefront. */
export function ThemePreview({ theme, storeName, photo = null, height = 190, uncropped = false, style }: ThemePreviewProps) {
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const candidates = themePreviewSources(theme);
  const candidate = availableThemePreview(theme, failedSources);
  if (candidate) {
    return (
      <View
        style={[styles.preview, { height, backgroundColor: theme.colors.bg, borderColor: theme.colors.line }, style]}
        accessibilityLabel={`${theme.name} demo imagery`}
      >
        <Image
          key={candidate.key}
          source={candidate.source}
          recyclingKey={candidate.key}
          cachePolicy="memory-disk"
          contentFit={uncropped ? "contain" : "cover"}
          contentPosition="top center"
          transition={120}
          onError={() => setFailedSources((failed) => failed.includes(candidate.key) ? failed : [...failed, candidate.key])}
          style={StyleSheet.absoluteFill}
        />
        {!uncropped ? <View style={[styles.demoLabel, { backgroundColor: theme.colors.surface, borderColor: theme.colors.line }]} pointerEvents="none">
          <Ionicons name="images-outline" size={12} color={theme.colors.ink} />
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: theme.colors.ink }}>Demo imagery</Text>
        </View> : null}
      </View>
    );
  }

  // Premium catalog looks must not silently reuse one generic split drawing as their preview.
  if (candidates.length > 0 || theme.collection === "premium" || theme.id.startsWith("p-")) {
    return (
      <View style={[styles.missing, { height, backgroundColor: theme.colors.bg, borderColor: theme.colors.line }, style]} accessibilityLabel={`${theme.name} preview image unavailable`}>
        <Ionicons name="image-outline" size={22} color={theme.colors.muted} />
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: theme.colors.ink }}>Preview image unavailable</Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 11, color: theme.colors.muted }}>This look can still be selected and previewed on your store.</Text>
        {candidates.length > 0 ? <Pressable accessibilityRole="button" accessibilityLabel={`Retry ${theme.name} preview image`}
          onPress={(event) => { event.stopPropagation(); setFailedSources((failed) => failed.filter((key) => !candidates.some((source) => source.key === key))); }}
          style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: 12 }}>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: theme.colors.ink }}>Retry image</Text>
        </Pressable> : null}
      </View>
    );
  }

  return <ClassicThemeMock theme={theme} storeName={storeName} photo={photo} height={height} style={style} />;
}

/** The original mini store drawing remains available only for classic looks without a supplied thumbnail. */
export function ClassicThemeMock({ theme, storeName, photo, height = 190, style }: ThemePreviewProps) {
  const k = theme.colors;
  const r = Math.min(theme.shape.radius, 14) * 0.5;
  const upper = theme.shape.upper === "all";
  const lines = (color: string, center = false, big = 1) => (
    <View style={{ gap: 4, alignItems: center ? "center" : "flex-start" }}>
      <View style={{ height: 7 * big, width: 92 * big, borderRadius: 2, backgroundColor: color }} />
      <View style={{ height: 7 * big, width: 64 * big, borderRadius: 2, backgroundColor: color }} />
      <View style={{ height: 3, width: 70, borderRadius: 2, backgroundColor: color, opacity: 0.45, marginTop: 3 }} />
      <View style={{ height: 10, width: 38, borderRadius: Math.min(theme.shape.button, 5), backgroundColor: color === "#FFFFFF" ? k.accent : color, marginTop: 4 }} />
    </View>
  );
  const hero = (() => {
    switch (theme.shape.hero) {
      case "overlay": return (
        <View style={{ flex: 1 }}>
          <Picture photo={photo} fill={k.line} style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.35)" }]} />
          <View style={{ flex: 1, justifyContent: "flex-end", padding: 10 }}>{lines("#FFFFFF")}</View>
        </View>
      );
      case "split": return (
        <View style={{ flex: 1, flexDirection: "row" }}>
          <View style={{ flex: 1, backgroundColor: k.panel, justifyContent: "center", padding: 10 }}>{lines(k.onPanel)}</View>
          <Picture photo={photo} fill={k.line} style={{ flex: 1.1 }} />
        </View>
      );
      case "collage": return (
        <View style={{ flex: 1, flexDirection: "row", gap: 6, padding: 8 }}>
          <View style={{ flex: 0.9, justifyContent: "center" }}>{lines(k.ink)}</View>
          <Picture photo={photo} fill={k.line} style={{ flex: 0.7, borderRadius: r }} />
          <View style={{ flex: 0.55, gap: 6 }}><Picture photo={photo} fill={k.line} style={{ flex: 1, borderRadius: r }} /><View style={{ flex: 1, borderRadius: r, backgroundColor: k.surface }} /></View>
        </View>
      );
      case "editorial": return (
        <View style={{ flex: 1, padding: 8, gap: 6, alignItems: "center" }}>
          <View style={{ height: 6, width: 110, borderRadius: 2, backgroundColor: k.ink }} />
          <View style={{ height: 6, width: 80, borderRadius: 2, backgroundColor: k.ink }} />
          <Picture photo={photo} fill={k.line} style={{ flex: 1, alignSelf: "stretch", borderRadius: r }} />
        </View>
      );
      case "type": return (
        <View style={{ flex: 1, padding: 8, gap: 6 }}>
          <Text numberOfLines={1} style={{ fontFamily: fonts.display, fontSize: 26, lineHeight: 28, color: k.ink, letterSpacing: -0.5 }}>{upper ? storeName.toUpperCase() : storeName}</Text>
          <View style={{ flex: 1, flexDirection: "row", gap: 5 }}>
            <Picture photo={photo} fill={k.line} style={{ flex: 1, borderRadius: r }} />{[0, 1, 2].map((item) => <View key={item} style={{ flex: 1, borderRadius: r, backgroundColor: k.surface }} />)}
          </View>
        </View>
      );
      default: return (
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", padding: 10, gap: 10 }}>
          <View style={{ flex: 1 }}>{lines(k.ink)}</View>
          <View style={{ width: 74, height: 74, borderRadius: 14, shadowColor: k.accent, shadowOpacity: 0.9, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 8, backgroundColor: k.accent }}>
            <Picture photo={photo} fill={k.line} style={{ flex: 1, borderRadius: 14 }} />
          </View>
        </View>
      );
    }
  })();
  const centered = theme.shape.header !== "split";
  return (
    <View style={[styles.classic, { height, backgroundColor: k.bg, borderColor: k.line }, style]} importantForAccessibility="no-hide-descendants">
      <View style={{ height: 8, backgroundColor: k.bar }} />
      <View style={{ height: 26, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", justifyContent: centered ? "center" : "space-between", borderBottomWidth: 1, borderColor: k.line }}>
        <Text numberOfLines={1} style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: k.ink, maxWidth: "70%" }}>{upper ? storeName.toUpperCase() : storeName}</Text>
        <Ionicons name="bag-outline" size={13} color={k.ink} style={centered ? { position: "absolute", right: 10 } : undefined} />
      </View>
      <View style={{ height: 112 }}>{hero}</View>
      <View style={{ flex: 1, flexDirection: "row", gap: 6, padding: 8 }}>
        {[0, 1, 2, 3].map((item) => (
          <View key={item} style={{ flex: 1, borderRadius: r, backgroundColor: theme.shape.card === "pastel" ? ["#FFE3EA", "#DDEFFF", "#FFF1BF", "#DDF5E4"][item] : k.surface,
            borderWidth: theme.shape.card === "bold" ? 1.5 : theme.shape.card === "boxed" || theme.shape.card === "glass" ? 1 : 0, borderColor: theme.shape.card === "bold" ? k.ink : k.line }} />
        ))}
      </View>
    </View>
  );
}

function Picture({ photo, fill, style }: { photo?: string | null; fill: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ backgroundColor: fill, overflow: "hidden" }, style]}>
      {photo ? <Image source={{ uri: photo }} recyclingKey={photo} cachePolicy="memory-disk" style={{ flex: 1 }} contentFit="cover" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  preview: { overflow: "hidden", borderRadius: radius.md, borderWidth: 1 },
  classic: { overflow: "hidden", borderRadius: radius.md, borderWidth: 1 },
  missing: { borderRadius: radius.md, borderWidth: 1, alignItems: "center", justifyContent: "center", gap: 5, padding: 16 },
  demoLabel: { position: "absolute", right: 8, top: 8, flexDirection: "row", alignItems: "center", gap: 4, borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 4, opacity: 0.94 },
});

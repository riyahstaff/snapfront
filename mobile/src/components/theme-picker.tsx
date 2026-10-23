import React, { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { Button, Field, Notice } from "./ui";
import { ThemePreview } from "./theme-preview";
import type { StoreTheme } from "@/lib/api";
import { browseThemes, EMPTY_THEME_BROWSE, isPremiumTheme, THEME_GROUPS, type ThemeBrowseState } from "@/lib/theme-catalog";
import { fonts, radius, space, type, useColors } from "@/lib/theme";

type Props = {
  themes: StoreTheme[]; selected: string; current?: string; storeName: string; photo?: string | null;
  browse: ThemeBrowseState; onBrowse: (state: ThemeBrowseState) => void; onSelect: (id: string) => void;
  disabled?: boolean; onRetry?: () => void; onCustomize?: (id: string) => void;
};

/** Proportional renderer snapshots, sized from the actual available column, never the screen width. */
export function ThemePicker({ themes, selected, current, storeName, photo, browse, onBrowse, onSelect, disabled = false, onRetry, onCustomize }: Props) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const [availableWidth, setAvailableWidth] = useState(Math.min(width - 48, 1120));
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const columns = availableWidth >= 760 && fontScale <= 1.3 ? 2 : 1;
  const cardWidth = Math.max(0, (availableWidth - (columns - 1) * 28) / columns);
  const previewWidth = Math.max(1, Math.min(width - 48, 1080));
  const result = browseThemes(themes, browse);
  const chosen = themes.find((theme) => theme.id === selected);
  const preview = themes.find((theme) => theme.id === previewId);
  const previewIndex = result.matches.findIndex((theme) => theme.id === previewId);
  function showPreview(id: string | null) { setPreviewId(id); setPreviewError(null); }
  function chooseDesign(id: string) { onSelect(id); showPreview(null); onCustomize?.(id); }
  const update = (values: Partial<ThemeBrowseState>) => onBrowse({ ...browse, ...values, page: values.page ?? 0 });
  return (
    <View style={{ gap: space.lg, width: "100%", maxWidth: 1120, alignSelf: "center" }} onLayout={(event) => setAvailableWidth(event.nativeEvent.layout.width)}>
      <Field label="Search themes" value={browse.query} editable={!disabled} onChangeText={(query) => update({ query })}
        placeholder="Try planners, cooking, fashion, minimal…" autoCapitalize="none" autoCorrect={false} returnKeyType="search" maxLength={120} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }} accessibilityLabel="Theme collections">
        {(["all", "classic", "premium"] as const).map((collection) => <FilterChip key={collection} label={collection === "all" ? `All ${themes.length}` : `${collection === "classic" ? "Classic" : "Premium"} ${themes.filter((theme) => isPremiumTheme(theme) === (collection === "premium")).length}`}
          selected={browse.collection === collection} disabled={disabled} onPress={() => update({ collection, group: "all" })} />)}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }} accessibilityLabel="Theme categories">
        <FilterChip label="All categories" selected={browse.group === "all"} disabled={disabled} onPress={() => update({ group: "all" })} />
        {THEME_GROUPS.filter(({ value }) => themes.some((theme) => theme.group === value && (browse.collection === "all" || (isPremiumTheme(theme) ? "premium" : "classic") === browse.collection))).map(({ value, label }) =>
          <FilterChip key={value} label={label} selected={browse.group === value} disabled={disabled} onPress={() => update({ group: value })} />)}
      </ScrollView>
      <Text accessibilityLiveRegion="polite" style={[type.small, { color: c.muted }]}>{result.matches.length} of {themes.length} themes{result.matches.length ? ` · ${result.page * 12 + 1}–${result.page * 12 + result.visible.length}` : ""}</Text>
      {chosen && !result.visible.some((theme) => theme.id === selected) ? <Pressable accessibilityRole="button" disabled={disabled}
        onPress={() => onBrowse({ ...EMPTY_THEME_BROWSE, page: Math.floor(themes.findIndex((theme) => theme.id === selected) / 12) })} style={{ minHeight: 44, justifyContent: "center" }}>
        <Text style={[type.label, { color: c.accent }]}>Show selected design: {chosen.name}</Text>
      </Pressable> : null}
      {result.visible.length ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: 28, rowGap: 36 }}>
          {result.visible.map((theme) => {
            const active = selected === theme.id;
            return (
              <View key={theme.id} style={{ width: cardWidth, gap: space.md }}>
                <Pressable disabled={disabled} onPress={() => showPreview(theme.id)} accessibilityRole="button"
                  accessibilityLabel={`Preview ${theme.name}`} accessibilityHint="Opens a larger preview. Your store will not change."
                  style={({ pressed }) => ({ borderWidth: 2, borderColor: active ? c.accent : c.line, backgroundColor: theme.colors.bg,
                    borderRadius: radius.md, overflow: "hidden", opacity: pressed || disabled ? 0.8 : 1 })}>
                  <View pointerEvents="none" style={{ height: 26, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: c.sunk }}>
                    {[0, 1, 2].map((dot) => <View key={dot} style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: c.muted, opacity: 0.55 }} />)}
                    <Text numberOfLines={1} style={{ fontFamily: fonts.body, fontSize: 10, color: c.muted, marginLeft: 8, flex: 1 }}>Website preview</Text>
                    <Ionicons name="expand-outline" size={13} color={c.muted} />
                  </View>
                  <ThemePreview theme={theme} storeName={storeName} photo={photo} uncropped height={(cardWidth - 4) * 667 / 960} style={{ borderRadius: 0, borderWidth: 0 }} />
                </Pressable>
                <View style={{ gap: 5 }}>
                  <View style={{ flexDirection: "row", gap: space.sm, alignItems: "center" }}>
                    <Text style={[type.heading, { color: c.ink, flex: 1 }]}>{theme.name}</Text>
                    {active ? <Ionicons name="checkmark-circle" size={20} color={c.accent} /> : null}
                  </View>
                  <Text style={[type.small, { color: c.muted }]}>{theme.category || theme.for}{current === theme.id ? " · Current look" : active ? " · Selected" : ""}</Text>
                </View>
                <View style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap" }}>
                  <Button label="Preview" variant="secondary" disabled={disabled} style={{ flex: 1 }} onPress={() => showPreview(theme.id)} />
                  <Button label={onCustomize ? "Customize" : active ? "Selected" : "Select design"} variant={active ? "primary" : "secondary"} disabled={disabled} style={{ flex: 1 }} onPress={() => chooseDesign(theme.id)} />
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={{ gap: space.sm }}>
          <Notice text={themes.length ? "No themes match. Clear the filters or try a broader search." : "No themes are available right now. Check your connection and retry."} />
          {themes.length ? <Button label="Clear filters" variant="secondary" disabled={disabled} onPress={() => onBrowse({ ...EMPTY_THEME_BROWSE })} /> : onRetry ? <Button label="Retry catalog" disabled={disabled} onPress={onRetry} /> : null}
        </View>
      )}
      {result.pages > 1 ? (
        <View style={{ gap: space.sm }}>
          <Text style={[type.small, { color: c.muted, textAlign: "center" }]}>Page {result.page + 1} of {result.pages}</Text>
          <View style={{ flexDirection: "row", gap: space.sm }}>
            <Button label="Previous" variant="secondary" style={{ flex: 1, paddingHorizontal: space.sm }} disabled={disabled || result.page === 0} onPress={() => update({ page: result.page - 1 })} />
            <Button label="Next" variant="secondary" style={{ flex: 1, paddingHorizontal: space.sm }} disabled={disabled || result.page === result.pages - 1} onPress={() => update({ page: result.page + 1 })} />
          </View>
        </View>
      ) : null}
      <Modal visible={Boolean(preview)} animationType="fade" onRequestClose={() => showPreview(null)}>
        <View style={{ flex: 1, backgroundColor: c.bg }}>
          <View style={{ padding: space.lg, paddingTop: Math.max(space.xl, insets.top + space.md), gap: space.md, borderBottomWidth: 1, borderColor: c.line }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text accessibilityRole="header" style={[type.title, { color: c.ink }]}>{preview?.name}</Text>
                <Text style={[type.small, { color: c.muted }]}>{preview?.category || preview?.for} · Example photos and text</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close preview" onPress={() => showPreview(null)} style={{ minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="close-outline" size={28} color={c.ink} />
              </Pressable>
            </View>
            <View style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap" }}>
              <Button label="Previous" variant="secondary" disabled={disabled || previewIndex <= 0} onPress={() => showPreview(result.matches[previewIndex - 1]?.id ?? null)} />
              <Button label="Next" variant="secondary" disabled={disabled || previewIndex < 0 || previewIndex >= result.matches.length - 1} onPress={() => showPreview(result.matches[previewIndex + 1]?.id ?? null)} />
              {preview?.demo_url ? <Button label="Open full website" variant="secondary" disabled={disabled} onPress={() => {
                if (preview.demo_url) void WebBrowser.openBrowserAsync(preview.demo_url).catch(() => setPreviewError("Couldn’t open the example. Please try again."));
              }} /> : null}
              <Button label={onCustomize ? "Customize this design" : "Use this design"} disabled={disabled || !preview} onPress={() => { if (preview) chooseDesign(preview.id); }} />
            </View>
            <Notice text={previewError} tone="error" />
          </View>
          <ScrollView contentContainerStyle={{ padding: space.xl, alignItems: "center", gap: space.md, paddingBottom: 48 + insets.bottom }}>
            <Text style={[type.small, { color: c.muted }]}>See the layout up close. Open the full website to scroll through every section.</Text>
            {preview ? <ThemePreview key={preview.id} theme={preview} storeName={storeName} photo={photo} uncropped height={previewWidth * 667 / 960} style={{ width: previewWidth }} /> : null}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function FilterChip({ label, selected, disabled, onPress }: { label: string; selected: boolean; disabled: boolean; onPress: () => void }) {
  const c = useColors();
  return <Pressable disabled={disabled} accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{ selected, disabled }} onPress={onPress}
    style={{ minHeight: 44, justifyContent: "center", borderRadius: radius.pill, paddingHorizontal: 14, backgroundColor: selected ? c.accent : c.surface, borderWidth: 1, borderColor: selected ? c.accent : c.line }}>
    <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: selected ? c.onAccent : c.ink }}>{label}</Text>
  </Pressable>;
}

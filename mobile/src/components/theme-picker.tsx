import React from "react";
import { Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button, Field, Notice } from "./ui";
import { ThemePreview } from "./theme-preview";
import type { StoreTheme } from "@/lib/api";
import { browseThemes, EMPTY_THEME_BROWSE, isPremiumTheme, THEME_GROUPS, type ThemeBrowseState } from "@/lib/theme-catalog";
import { fonts, radius, space, type, useColors } from "@/lib/theme";

type Props = {
  themes: StoreTheme[]; selected: string; current?: string; storeName: string; photo?: string | null;
  browse: ThemeBrowseState; onBrowse: (state: ThemeBrowseState) => void; onSelect: (id: string) => void;
  disabled?: boolean; onRetry?: () => void;
};

/** A bounded thumbnail grid works inside either editor's ScrollView without nested virtual lists. */
export function ThemePicker({ themes, selected, current, storeName, photo, browse, onBrowse, onSelect, disabled = false, onRetry }: Props) {
  const c = useColors();
  const { width, fontScale } = useWindowDimensions();
  const compact = width >= 360 && fontScale <= 1.3;
  const result = browseThemes(themes, browse);
  const chosen = themes.find((theme) => theme.id === selected);
  const update = (values: Partial<ThemeBrowseState>) => onBrowse({ ...browse, ...values, page: values.page ?? 0 });
  return (
    <View style={{ gap: space.md }}>
      <Field label="Search themes" value={browse.query} editable={!disabled} onChangeText={(query) => update({ query })}
        placeholder="Try candles, skincare, minimal…" autoCapitalize="none" autoCorrect={false} returnKeyType="search" maxLength={120} />
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
      {chosen ? (
        <View style={{ padding: space.md, backgroundColor: c.surface, borderRadius: radius.md, gap: 6 }}>
          <Text style={[type.label, { color: c.ink }]}>Selected: {chosen.name}{current === selected ? " · Current look" : ""}</Text>
          {!result.visible.some((theme) => theme.id === selected) ? <Button label="Show selected theme" variant="secondary" disabled={disabled} onPress={() => onBrowse({ ...EMPTY_THEME_BROWSE, page: Math.floor(themes.findIndex((theme) => theme.id === selected) / 12) })} /> : null}
        </View>
      ) : null}
      {result.visible.length ? (
        <View accessibilityRole="radiogroup" style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
          {result.visible.map((theme) => {
            const active = selected === theme.id;
            return (
              <Pressable key={theme.id} disabled={disabled} onPress={() => onSelect(theme.id)} accessibilityRole="radio"
                accessibilityState={{ selected: active, disabled }} accessibilityLabel={`${theme.name}. For ${theme.for}. ${theme.vibe}${current === theme.id ? ". Current look" : ""}`}
                style={({ pressed }) => ({ width: compact ? "48%" : "100%", flexGrow: compact ? 1 : 0, maxWidth: compact ? "50%" : "100%", borderWidth: 2, borderColor: active ? c.accent : c.line,
                  backgroundColor: c.surface, borderRadius: radius.md, overflow: "hidden", opacity: pressed || disabled ? 0.75 : 1 })}>
                <ThemePreview theme={theme} storeName={storeName} photo={photo} height={compact ? 124 : 170} style={{ borderRadius: 0, borderWidth: 0 }} />
                <View style={{ padding: space.sm, gap: 5 }}>
                  <View style={{ flexDirection: "row", gap: 5, alignItems: "flex-start" }}>
                    <Text numberOfLines={2} style={[type.label, { color: c.ink, flex: 1 }]}>{theme.name}</Text>
                    <Ionicons name={active ? "checkmark-circle" : "ellipse-outline"} size={20} color={active ? c.accent : c.muted} />
                  </View>
                  <Text numberOfLines={2} style={[type.small, { color: c.muted }]}>{theme.category || theme.for}</Text>
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: active ? c.accent : c.muted }}>{active ? "Selected" : isPremiumTheme(theme) ? "Premium" : "Classic"}{current === theme.id ? " · Current" : ""}</Text>
                </View>
              </Pressable>
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

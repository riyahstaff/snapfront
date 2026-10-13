import React, { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { DIGITAL_DESIGNS, DIGITAL_FORMATS } from "@/lib/digital-design-catalog";
import { DIGITAL_DESIGN_THUMBNAILS } from "@/lib/digital-design-thumbnails";
import { mergeDigitalTemplateSummaries, type DigitalFormat, type DigitalTemplateSummary } from "@/lib/digital-design";
import { Field, Segmented } from "@/components/ui";
import { fonts, radius, space, type, useColors } from "@/lib/theme";

const PAGE_SIZE = 12;
type FormatFilter = "all" | DigitalFormat;

export type DigitalDesignPickerProps = {
  remoteTemplates?: DigitalTemplateSummary[] | null;
  selectedId?: string | null;
  onSelect: (template: DigitalTemplateSummary) => void;
};

/**
 * The 50 native covers remain the visual source of truth. Remote wording is used only when its
 * revision exactly matches that native artwork package; it never replaces local source documents.
 */
export function DigitalDesignPicker({ remoteTemplates, selectedId, onSelect }: DigitalDesignPickerProps) {
  const c = useColors();
  const [query, setQuery] = useState("");
  const [format, setFormat] = useState<FormatFilter>("all");
  const [shown, setShown] = useState(PAGE_SIZE);
  const catalog = useMemo(() => mergeDigitalTemplateSummaries(DIGITAL_DESIGNS, remoteTemplates), [remoteTemplates]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return catalog.filter((template) => {
      const matchesFormat = format === "all" || template.format === format;
      const haystack = [template.name, template.description, ...template.tags, template.sample.title, template.sample.subtitle].join(" ").toLocaleLowerCase();
      return matchesFormat && (!needle || haystack.includes(needle));
    });
  }, [catalog, format, query]);
  const visible = filtered.slice(0, shown);
  const formats = [{ value: "all" as const, label: "All" }, ...DIGITAL_FORMATS.map((item) => ({ value: item.id, label: item.name.replace(/\s*&.*$/, "") }))];

  return (
    <View style={{ gap: space.md }}>
      <View style={{ gap: 2 }}>
        <Text style={[type.heading, { color: c.ink }]}>Premium collection</Text>
        <Text style={[type.label, { color: c.accent }]}>50 signature designs</Text>
        <Text style={[type.small, { color: c.muted }]}>Curated covers with every title and line ready for your own words.</Text>
      </View>
      <Field label="Search designs" value={query} onChangeText={(value) => { setQuery(value); setShown(PAGE_SIZE); }} placeholder="Try editorial, launch, calm, planner…" />
      <Segmented value={format} options={formats} onChange={(value) => { setFormat(value as FormatFilter); setShown(PAGE_SIZE); }} />
      <Text accessibilityLiveRegion="polite" style={[type.small, { color: c.muted }]}>{filtered.length} design{filtered.length === 1 ? "" : "s"} found</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md }}>
        {visible.map((template) => {
          const selected = selectedId === template.id;
          const thumbnail = DIGITAL_DESIGN_THUMBNAILS[template.id];
          return (
            <Pressable key={template.id} onPress={() => onSelect(template)} accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={`${template.name}, ${template.format}. ${template.description}`}
              style={({ pressed }) => ({ width: "47.8%", borderWidth: selected ? 2 : 1, borderColor: selected ? c.accent : c.line, borderRadius: radius.lg, overflow: "hidden", backgroundColor: c.surface, opacity: pressed ? 0.88 : 1 })}>
              <View style={{ aspectRatio: template.format === "quotes" ? 0.8 : 612 / 792, backgroundColor: template.palette.paper }}>
                {thumbnail ? <Image source={thumbnail} contentFit="contain" style={{ width: "100%", height: "100%" }} /> : template.preview_url ? <Image source={{ uri: template.preview_url }} contentFit="contain" style={{ width: "100%", height: "100%" }} /> : null}
              </View>
              <View style={{ padding: space.md, gap: 5 }}>
                <Text numberOfLines={2} style={[type.label, { color: c.ink }]}>{template.name}</Text>
                <Text numberOfLines={2} style={[type.small, { color: c.muted }]}>{template.description}</Text>
                <View style={{ flexDirection: "row", gap: 4, flexWrap: "wrap" }}>
                  {template.tags.slice(0, 2).map((tag) => <Text key={tag} style={{ color: template.palette.accent, fontFamily: fonts.bodyBold, fontSize: 11 }}>#{tag}</Text>)}
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
      {!visible.length ? <Text style={[type.small, { color: c.muted }]}>Try another word or format. Every design in this collection is ready when you are.</Text> : null}
      {shown < filtered.length ? <Pressable accessibilityRole="button" onPress={() => setShown((count) => Math.min(count + PAGE_SIZE, filtered.length))} style={{ minHeight: 48, borderRadius: radius.md, borderWidth: 1, borderColor: c.line, justifyContent: "center", alignItems: "center" }}><Text style={{ color: c.accent, fontFamily: fonts.bodyBold }}>Show 12 more</Text></Pressable> : null}
    </View>
  );
}

import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { Notice, Pill, PageScroll } from "@/components/ui";
import { api, ApiError, type SourceDirectory, type SourceSupplier } from "@/lib/api";
import { fonts, radius, space, type, useColors } from "@/lib/theme";

/** Free directory of places to source products, for every seller. */
export default function SourcesScreen() {
  const c = useColors();
  const [dir, setDir] = useState<SourceDirectory | null>(null);
  const [group, setGroup] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { api.sources().then(setDir).catch((e) => setError(e instanceof ApiError ? e.message : "Couldn’t load the directory.")); }, []);

  if (!dir) return <View style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center", padding: space.lg }}>{error ? <Notice text={error} tone="error" /> : <ActivityIndicator color={c.accent} />}</View>;
  const groups = group === "all" ? dir.groups : dir.groups.filter((g) => g.id === group);
  const chip = (id: string, label: string) => (
    <Pressable key={id} onPress={() => setGroup(id)} accessibilityRole="button" accessibilityState={{ selected: group === id }}
      style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: group === id ? c.ink : c.line, backgroundColor: group === id ? c.ink : c.surface }}>
      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: group === id ? c.bg : c.ink }}>{label}</Text>
    </Pressable>
  );
  return (
    <PageScroll style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: space.lg, paddingHorizontal: space.xl, gap: space.lg, paddingBottom: space.xxl }}>
      <View style={{ gap: space.sm }}>
        <Text style={[type.body, { color: c.ink }]}>Places to find products to sell, from huge catalogs to US warehouses and print on demand. Snapfront already plugs into the ones marked Built in.</Text>
        <View style={{ flexDirection: "row", gap: space.sm, alignItems: "flex-start", backgroundColor: c.surface, borderColor: c.line, borderWidth: 1, borderRadius: radius.md, padding: space.md }}>
          <Ionicons name="information-circle-outline" size={18} color={c.accent} />
          <Text style={[type.small, { color: c.ink, flex: 1 }]}>{dir.note}</Text>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
        {[chip("all", "All"), ...dir.groups.map((g) => chip(g.id, g.name))]}
      </ScrollView>
      {groups.map((g) => (
        <View key={g.id} style={{ gap: space.md }}>
          <View style={{ gap: 2 }}>
            <Text style={[type.title, { color: c.ink, fontSize: 21 }]}>{g.name}</Text>
            <Text style={[type.small, { color: c.muted }]}>{g.blurb}</Text>
          </View>
          {g.suppliers.map((s) => <SupplierCard key={s.id} s={s} />)}
        </View>
      ))}
      <Text style={[type.small, { color: c.muted }]}>Prices and terms as of {dir.updated}. They change, so check each site before you sign up.</Text>
    </PageScroll>
  );
}

function SupplierCard({ s }: { s: SourceSupplier }) {
  const c = useColors();
  const row = (icon: React.ComponentProps<typeof Ionicons>["name"], text: string) => (
    <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
      <Ionicons name={icon} size={15} color={c.muted} style={{ marginTop: 2 }} />
      <Text style={[type.small, { color: c.ink, flex: 1 }]}>{text}</Text>
    </View>
  );
  return (
    <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, padding: space.lg, gap: space.sm }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
        <Text style={[type.heading, { color: c.ink, flex: 1 }]}>{s.name}</Text>
        {s.connect ? <Pill text="Built in" tone="good" /> : null}
      </View>
      <Text style={[type.body, { color: c.ink }]}>{s.sells}</Text>
      {row("airplane-outline", `Ships from ${s.shipsFrom}`)}
      {row("time-outline", s.delivery)}
      {row("pricetag-outline", s.cost)}
      {s.tip ? <Text style={[type.small, { color: c.muted }]}>{s.tip}</Text> : null}
      <View style={{ flexDirection: "row", gap: space.md, marginTop: 4 }}>
        <Pressable onPress={() => WebBrowser.openBrowserAsync(s.url)} accessibilityRole="link" accessibilityLabel={`Visit ${s.name}`} hitSlop={8}>
          <Text style={[type.label, { color: c.accent }]}>Visit site</Text>
        </Pressable>
        {s.connect ? (
          <Pressable onPress={() => (s.connect === "cj" ? router.navigate("/find") : router.push("/settings"))} accessibilityRole="button" hitSlop={8}>
            <Text style={[type.label, { color: c.accent }]}>{s.connect === "cj" ? "Search it in Find" : "Connect in Settings"}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

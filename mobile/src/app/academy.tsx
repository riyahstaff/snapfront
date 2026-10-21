// Snapfront Academy: short narrated lessons, grouped into modules, with progress.
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button, Notice, Pill, PageScroll } from "@/components/ui";
import { academy, ApiError, type AcademyCatalog } from "@/lib/api";
import { PresenterCard } from "@/components/academy-presenter";
import { radius, space, type, useColors } from "@/lib/theme";

export default function AcademyScreen() {
  const c = useColors();
  const [data, setData] = useState<AcademyCatalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  useFocusEffect(useCallback(() => { academy.catalog().then(setData).catch((e) => setError(e instanceof ApiError ? e.message : "Couldn't load the Academy.")); }, []));
  if (!data) return <View style={{ flex: 1, backgroundColor: c.bg, padding: space.xl }}>{error ? <Notice text={error} tone="error" /> : <ActivityIndicator color={c.accent} />}</View>;
  const pct = data.total ? Math.round((data.done / data.total) * 100) : 0;
  const next = data.modules.flatMap((m) => m.lessons).find((l) => !l.done && !l.locked);
  return (
    <PageScroll style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ padding: space.xl, gap: space.xl, paddingBottom: 64 }}>
      <View style={{ gap: space.sm }}>
        <Text style={[type.body, { color: c.muted }]}>Short video lessons on building your store, making content, going live and earning more. Each one ends with a button that opens the tool to do it.</Text>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: c.sunk, overflow: "hidden" }}>
          <View style={{ width: `${Math.max(pct, 2)}%`, height: "100%", backgroundColor: c.accent }} />
        </View>
        <Text style={[type.small, { color: c.muted }]}>{data.done} of {data.total} lessons done</Text>
        {next ? <Button label={data.done ? `Continue: ${next.title}` : `Start: ${next.title}`} onPress={() => router.push({ pathname: "/lesson/[id]", params: { id: next.id } })} /> : null}
      </View>
      {!data.member ? <Notice text="The first module is free. Every lesson opens with Snapfront Pro." /> : null}
      {data.owner ? <PresenterCard /> : null}
      {data.modules.map((m, mi) => (
        <View key={m.id} style={{ gap: space.sm }}>
          <Text accessibilityRole="header" style={[type.title, { color: c.ink, fontSize: 21 }]}>{mi + 1}. {m.title}</Text>
          <View style={{ borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, backgroundColor: c.surface, overflow: "hidden" }}>
            {m.lessons.map((l, i) => (
              <Pressable key={l.id} accessibilityRole="button" accessibilityLabel={`${l.title}${l.locked ? ", needs Snapfront Pro" : l.done ? ", done" : ""}`}
                onPress={() => (l.locked ? router.push({ pathname: "/plans", params: { highlight: "pro" } }) : router.push({ pathname: "/lesson/[id]", params: { id: l.id } }))}
                style={{ flexDirection: "row", alignItems: "center", gap: space.md, padding: space.lg, borderTopWidth: i ? 1 : 0, borderColor: c.sunk }}>
                <Ionicons name={l.done ? "checkmark-circle" : l.locked ? "lock-closed" : "play-circle"} size={26} color={l.done ? c.good : l.locked ? c.muted : c.accent} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[type.heading, { color: l.locked ? c.muted : c.ink }]}>{l.title}</Text>
                  <Text style={[type.small, { color: c.muted }]} numberOfLines={2}>{l.summary}</Text>
                </View>
                <Pill text={`${l.minutes} min`} />
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </PageScroll>
  );
}

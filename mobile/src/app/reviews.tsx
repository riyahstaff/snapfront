import React, { useCallback, useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Body, Button, Notice, Pill } from "@/components/ui";
import { api, ApiError, type Review } from "@/lib/api";
import { radius, space, type, useColors } from "@/lib/theme";

/** Buyer reviews: they show on product pages; hide any you don't want shown. */
export default function ReviewsScreen() {
  const c = useColors();
  const [list, setList] = useState<Review[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(() => { api.reviews().then(setList).catch((e) => setError(e instanceof ApiError ? e.message : "Couldn’t load reviews.")); }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <FlatList
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={{ padding: space.lg, gap: space.md }}
      data={list ?? []}
      keyExtractor={(r) => r.id}
      refreshControl={<RefreshControl refreshing={list === null && !error} onRefresh={load} />}
      ListHeaderComponent={<View style={{ gap: space.sm, marginBottom: space.sm }}>
        <Body muted>Buyers get a link to review after they order: on their order page, and by email a few days later. Reviews show with stars on your product pages.</Body>
        <Notice text={error} tone="error" />
      </View>}
      ListEmptyComponent={list ? <Body muted>No reviews yet. They’ll appear here as buyers leave them.</Body> : null}
      renderItem={({ item: r }) => (
        <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, padding: space.md, gap: space.sm, opacity: r.status === "hidden" ? 0.6 : 1 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: "#E8A317", fontSize: 18, letterSpacing: 1 }} accessibilityLabel={`${r.rating} out of 5 stars`}>{"★".repeat(r.rating)}<Text style={{ color: c.line }}>{"★".repeat(5 - r.rating)}</Text></Text>
            {r.status === "hidden" ? <Pill text="Hidden" /> : null}
          </View>
          {r.body ? <Text style={[type.body, { color: c.ink }]}>{r.body}</Text> : null}
          <Text style={[type.small, { color: c.muted }]}>{r.name} on {r.product_title ?? "a removed product"} · {r.created_at.slice(0, 10)}</Text>
          <Button label={r.status === "hidden" ? "Show on my store" : "Hide from my store"} variant="ghost" loading={busy === r.id}
            onPress={async () => { setBusy(r.id); try { setList(await api.setReview(r.id, r.status === "hidden" ? "published" : "hidden")); } finally { setBusy(null); } }} />
        </View>
      )}
    />
  );
}

import React, { useCallback, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Notice } from "@/components/ui";
import { api, ApiError, money, type CatalogItem } from "@/lib/api";
import { fonts, radius, space, type, useColors } from "@/lib/theme";

const IDEAS = ["pet bed", "phone stand", "LED strip lights", "posture corrector", "kitchen gadgets", "car organizer", "jewelry box", "yoga mat"];

/** Search CJdropshipping's catalog for products to sell; CJ ships them to buyers. */
export default function FindScreen() {
  const c = useColors();
  const [q, setQ] = useState("");
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [total, setTotal] = useState<number | null>(null);
  const [shownTerm, setShownTerm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const current = useRef("");

  const run = useCallback(async (term: string, nextPage = 1) => {
    const t = term.trim();
    if (!t) return;
    setBusy(true); setError(null);
    current.current = t;
    try {
      const r = await api.catalogSearch(t, nextPage);
      if (current.current !== t) return;
      setItems((prev) => (nextPage === 1 ? r.products : [...prev, ...r.products.filter((p) => !prev.some((x) => x.pid === p.pid))]));
      setPage(r.page); setPages(r.pages); setTotal(r.total); setShownTerm(t);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't search right now. Try again.");
    } finally { setBusy(false); }
  }, []);

  const search = (term: string) => { setQ(term); setItems([]); setTotal(null); run(term, 1); };

  return (
    <FlatList
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={{ padding: space.lg, gap: space.md }}
      columnWrapperStyle={{ gap: space.md }}
      numColumns={2}
      data={items}
      keyExtractor={(p) => p.pid}
      keyboardShouldPersistTaps="handled"
      onEndReachedThreshold={0.5}
      onEndReached={() => { if (!busy && items.length && page < pages) run(current.current, page + 1); }}
      ListHeaderComponent={
        <View style={{ gap: space.md, marginBottom: space.sm }}>
          <View style={{ gap: space.xs }}>
            <Text accessibilityRole="header" style={[type.hero, { color: c.ink }]}>Find products{"\n"}to sell</Text>
            <Text style={[type.body, { color: c.muted }]}>Pick from CJdropshipping’s catalog at wholesale cost. When a buyer orders, CJ ships it to them for you.</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.pill, paddingHorizontal: space.md }}>
            <Ionicons name="search" size={18} color={c.muted} />
            <TextInput value={q} onChangeText={setQ} onSubmitEditing={() => search(q)} returnKeyType="search" placeholder="Search products, e.g. pet bed"
              placeholderTextColor={c.muted} accessibilityLabel="Search products" autoCorrect={false}
              style={{ flex: 1, paddingVertical: 12, fontFamily: fonts.body, fontSize: 16, color: c.ink }} />
            {q ? (
              <Pressable onPress={() => { setQ(""); setItems([]); setTotal(null); current.current = ""; }} accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={10}>
                <Ionicons name="close-circle" size={18} color={c.muted} />
              </Pressable>
            ) : null}
          </View>
          {total == null && !busy ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
              {IDEAS.map((idea) => (
                <Pressable key={idea} onPress={() => search(idea)} accessibilityRole="button"
                  style={{ backgroundColor: c.sunk, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8 }}>
                  <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: c.ink }}>{idea}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          {total != null ? <Text style={[type.small, { color: c.muted }]}>{total.toLocaleString()} products for “{shownTerm}”</Text> : null}
          <Notice text={error} tone="error" />
        </View>
      }
      ListEmptyComponent={busy ? null : total === 0 ? (
        <Text style={[type.body, { color: c.muted, textAlign: "center", padding: space.xl }]}>Nothing found. Try a simpler word, like “lamp” instead of “sunset projection lamp”.</Text>
      ) : null}
      ListFooterComponent={busy ? <ActivityIndicator color={c.accent} style={{ padding: space.xl }} /> : null}
      renderItem={({ item }) => <Tile item={item} />}
    />
  );
}

function Tile({ item }: { item: CatalogItem }) {
  const c = useColors();
  return (
    <Pressable onPress={() => router.push({ pathname: "/supplier/[pid]", params: { pid: item.pid } })} accessibilityRole="button"
      accessibilityLabel={`${item.title}${item.cost != null ? `, costs you ${money(item.cost)}` : ""}`}
      style={({ pressed }) => ({ flex: 1, maxWidth: "50%", backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.md, overflow: "hidden", opacity: pressed ? 0.85 : 1 })}>
      <Image source={item.image ? { uri: item.image } : null} style={{ width: "100%", aspectRatio: 1, backgroundColor: c.sunk }} contentFit="cover" transition={150} />
      <View style={{ padding: space.sm, gap: 4 }}>
        <Text numberOfLines={2} style={[type.small, { color: c.ink, minHeight: 36 }]}>{item.title}</Text>
        {item.cost != null ? (
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: c.ink }}>{money(item.cost)} <Text style={[type.small, { color: c.muted }]}>your cost</Text></Text>
        ) : null}
      </View>
    </Pressable>
  );
}

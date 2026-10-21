import React, { useCallback, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Platform, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { SupplierCard } from "@/components/supplier-section";
import { Button, Notice, usePageWidth } from "@/components/ui";
import { PAGE_MAX } from "@/lib/page-width";
import { api, ApiError, money, type CatalogItem, type SupplierId } from "@/lib/api";
import { useMe } from "@/lib/account-store";
import { fonts, radius, space, type, useColors } from "@/lib/theme";

const IDEAS = ["pet bed", "phone stand", "LED strip lights", "posture corrector", "kitchen gadgets", "car organizer", "jewelry box", "yoga mat"];

const SUPPLIERS: { id: SupplierId; label: string; blurb: string; placeholder: string }[] = [
  { id: "cj", label: "CJdropshipping", blurb: "Search CJ’s catalog at wholesale cost. When a buyer orders, CJ ships it to them for you.", placeholder: "Search products, e.g. pet bed" },
  { id: "printful", label: "Printful", blurb: "Your own designs from your Printful store. Printful prints each order and ships it to your buyer.", placeholder: "Filter your Printful products" },
  { id: "aliexpress", label: "AliExpress", blurb: "Paste a product link from AliExpress. When a buyer orders, it’s placed in your AliExpress account and shipped to them.", placeholder: "Paste an AliExpress product link" },
];

/** Products from the seller's suppliers: CJ's catalog, their Printful designs, or an AliExpress link. */
export default function FindScreen() {
  const c = useColors();
  const me = useMe();
  const [source, setSource] = useState<SupplierId>("cj");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [total, setTotal] = useState<number | null>(null);
  const [shownTerm, setShownTerm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const current = useRef({ source: "cj" as SupplierId, term: "" });
  // On the website the page sits in the same centered column as its title, with more cards per row.
  const max = PAGE_MAX[usePageWidth()];
  const { width } = useWindowDimensions();
  const cols = Platform.OS === "web" ? (width >= 1100 ? 4 : width >= 760 ? 3 : 2) : 2;

  const s = me?.account.suppliers?.[source];
  const meta = SUPPLIERS.find((x) => x.id === source)!;
  const ready = Boolean(s?.connected || s?.browse_without_account || (source === "cj" && !me?.account.suppliers));

  const run = useCallback(async (src: SupplierId, term: string, nextPage = 1) => {
    const t = term.trim();
    if (!t && src !== "printful") return;
    setBusy(true); setError(null);
    current.current = { source: src, term: t };
    try {
      const r = await api.catalogSearch(src, t, nextPage);
      if (current.current.source !== src || current.current.term !== t) return;
      // A pasted AliExpress link goes straight to that product.
      if (src === "aliexpress" && r.products.length === 1 && nextPage === 1) {
        router.push({ pathname: "/supplier/[pid]", params: { pid: r.products[0].pid, source: src } });
      }
      setItems((prev) => (nextPage === 1 ? r.products : [...prev, ...r.products.filter((p) => !prev.some((x) => x.pid === p.pid))]));
      setPage(r.page); setPages(r.pages); setTotal(r.total); setShownTerm(t);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't search right now. Try again.");
    } finally { setBusy(false); }
  }, []);

  const reset = () => { setItems([]); setTotal(null); setError(null); };
  const search = (term: string) => { setQ(term); reset(); run(source, term, 1); };
  function pick(id: SupplierId) {
    if (id === source && id !== "printful") return;
    setSource(id); setQ(""); reset(); current.current = { source: id, term: "" };
    // Printful lists the seller's own products straight away.
    if (id === "printful" && me?.account.suppliers?.printful?.connected) run("printful", "", 1);
  }

  return (
    <FlatList
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={[{ paddingHorizontal: Platform.OS === "web" ? space.xl : space.lg, paddingTop: space.lg, paddingBottom: space.xxl, gap: space.md },
        max ? { width: "100%", maxWidth: max, alignSelf: "center" } : null]}
      columnWrapperStyle={{ gap: space.md }}
      key={cols}
      numColumns={cols}
      data={ready ? items : []}
      keyExtractor={(p) => `${source}:${p.pid}`}
      keyboardShouldPersistTaps="handled"
      onEndReachedThreshold={0.5}
      onEndReached={() => { if (!busy && items.length && page < pages) run(current.current.source, current.current.term, page + 1); }}
      ListHeaderComponent={
        <View style={{ gap: space.md, marginBottom: space.sm }}>
          {Platform.OS !== "web" ? <Text accessibilityRole="header" style={[type.hero, { color: c.ink }]}>Find products{"\n"}to sell</Text> : null}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -space.lg }} contentContainerStyle={{ paddingHorizontal: space.lg, gap: space.sm }}
            accessibilityRole="tablist">
            {SUPPLIERS.map((x) => {
              const on = x.id === source;
              const connected = me?.account.suppliers?.[x.id]?.connected;
              return (
                <Pressable key={x.id} onPress={() => pick(x.id)} accessibilityRole="tab" accessibilityState={{ selected: on }}
                  style={{ flexDirection: "row", alignItems: "center", gap: 6, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 9,
                    backgroundColor: on ? c.ink : c.surface, borderWidth: 1, borderColor: on ? c.ink : c.line }}>
                  {connected ? <Ionicons name="checkmark-circle" size={15} color={on ? c.flash : c.good} /> : null}
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: on ? c.bg : c.ink }}>{x.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <Text style={[type.body, { color: c.muted }]}>{meta.blurb}</Text>

          {!ready ? (
            <View style={{ gap: space.sm }}>
              <Text style={[type.heading, { color: c.ink }]}>
                {s?.pending_authorization ? `Finish connecting ${meta.label}` : `Connect your ${meta.label} account first`}
              </Text>
              <Text style={[type.small, { color: c.muted }]}>
                {source === "printful" ? "Snapfront shows the products in your own Printful store, and sends each order to your Printful account so Printful prints and ships it. Follow these steps once."
                  : "Snapfront places AliExpress orders in your own AliExpress account, so you need an AliExpress developer app (it's free). Follow these steps once."}
              </Text>
              {s ? <SupplierCard id={source} state={s} startOpen /> : <Button label={`Connect ${meta.label} in Settings`} onPress={() => router.push("/settings")} />}
              <Text style={[type.small, { color: c.muted }]}>You can also manage suppliers any time in Settings, under Suppliers.</Text>
            </View>
          ) : (
            <>
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.pill, paddingHorizontal: space.md }}>
                <Ionicons name={source === "aliexpress" ? "link" : "search"} size={18} color={c.muted} />
                <TextInput value={q} onChangeText={setQ} onSubmitEditing={() => search(q)} returnKeyType={source === "aliexpress" ? "go" : "search"}
                  placeholder={meta.placeholder} placeholderTextColor={c.muted} accessibilityLabel={meta.placeholder} autoCorrect={false} autoCapitalize="none"
                  keyboardType={source === "aliexpress" ? "url" : "default"}
                  style={{ flex: 1, paddingVertical: 12, fontFamily: fonts.body, fontSize: 16, color: c.ink }} />
                {q ? (
                  <Pressable onPress={() => { setQ(""); if (source === "printful") search(""); else { reset(); current.current = { source, term: "" }; } }}
                    accessibilityRole="button" accessibilityLabel="Clear" hitSlop={10}>
                    <Ionicons name="close-circle" size={18} color={c.muted} />
                  </Pressable>
                ) : null}
              </View>
              {source === "printful" && total == null && !busy ? (
                <Button label="Show my Printful products" variant="secondary" onPress={() => search("")} />
              ) : null}
              {source === "aliexpress" ? (
                <Button label="Open product" variant="secondary" loading={busy} disabled={!q.trim()} onPress={() => search(q)} />
              ) : null}
              {source === "cj" && total == null && !busy ? (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
                  {IDEAS.map((idea) => (
                    <Pressable key={idea} onPress={() => search(idea)} accessibilityRole="button"
                      style={{ backgroundColor: c.sunk, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8 }}>
                      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: c.ink }}>{idea}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
              {total != null && source === "cj" ? <Text style={[type.small, { color: c.muted }]}>{total.toLocaleString()} products for “{shownTerm}”</Text> : null}
              {total != null && source === "printful" ? <Text style={[type.small, { color: c.muted }]}>{total} product{total === 1 ? "" : "s"} in {s?.store_name || "your Printful store"}</Text> : null}
            </>
          )}
          <Notice text={error} tone="error" />
        </View>
      }
      ListEmptyComponent={!ready || busy ? null : total === 0 ? (
        <Text style={[type.body, { color: c.muted, textAlign: "center", padding: space.xl }]}>
          {source === "printful" ? "No products in your Printful store yet. Create one in Printful, then come back." : "Nothing found. Try a simpler word, like “lamp” instead of “sunset projection lamp”."}
        </Text>
      ) : null}
      ListFooterComponent={busy ? <ActivityIndicator color={c.accent} style={{ padding: space.xl }} /> : null}
      renderItem={({ item }) => <Tile item={item} source={source} cols={cols} />}
    />
  );
}

function Tile({ item, source, cols }: { item: CatalogItem; source: SupplierId; cols: number }) {
  const c = useColors();
  return (
    <Pressable onPress={() => router.push({ pathname: "/supplier/[pid]", params: { pid: item.pid, source } })} accessibilityRole="button"
      accessibilityLabel={`${item.title}${item.cost != null ? `, costs you ${money(item.cost)}` : ""}`}
      style={({ pressed }) => ({ flex: 1, maxWidth: `${100 / cols}%`, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.md, overflow: "hidden", opacity: pressed ? 0.85 : 1 })}>
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

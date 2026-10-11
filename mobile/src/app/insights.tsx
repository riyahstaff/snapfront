import React, { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Body, Button, H2, Notice, Segmented } from "@/components/ui";
import { api, ApiError, money, type Insights } from "@/lib/api";
import { useMe } from "@/lib/account-store";
import { fonts, radius, space, type, useColors } from "@/lib/theme";

const SOURCE: Record<string, string> = { direct: "Direct or bookmarks", instagram: "Instagram", tiktok: "TikTok", facebook: "Facebook", google: "Google", pinterest: "Pinterest", youtube: "YouTube", x: "X", snapchat: "Snapchat", email: "Email", qr: "QR code", bio: "Link in bio" };

/** Store insights (Pro): visitors, where they came from, top products, sales. */
export default function InsightsScreen() {
  const c = useColors();
  const me = useMe();
  const [days, setDays] = useState<"7" | "30" | "90">("30");
  const [data, setData] = useState<Insights | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const pro = me?.account.plan === "pro";
  const load = useCallback(() => {
    if (!pro) { setLoading(false); return; }
    setLoading(true);
    api.insights(Number(days) as 7 | 30 | 90).then((d) => { setData(d); setError(null); }).catch((e) => setError(e instanceof ApiError ? e.message : "Couldn’t load insights.")).finally(() => setLoading(false));
  }, [days, pro]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!pro) return (
    <View style={{ flex: 1, backgroundColor: c.bg, padding: space.lg, gap: space.md }}>
      <H2>See what’s working</H2>
      <Body muted>With Pro you see how many people visit, whether they came from Instagram, TikTok or Google, which products they look at most, and how many buy.</Body>
      <Button label="See Pro" variant="flash" onPress={() => router.push({ pathname: "/plans", params: { highlight: "pro" } })} />
    </View>
  );
  const max = Math.max(1, ...(data?.daily.map((d) => d.visitors) ?? [1]));
  const maxSrc = Math.max(1, ...(data?.sources.map((s) => s.visitors) ?? [1]));
  const tile = (label: string, value: string) => (
    <View style={{ flex: 1, minWidth: "45%", backgroundColor: c.surface, borderColor: c.line, borderWidth: 1, borderRadius: radius.md, padding: space.md, gap: 2 }}>
      <Text style={[type.small, { color: c.muted }]}>{label}</Text>
      <Text style={{ fontFamily: fonts.display, fontSize: 26, color: c.ink, fontVariant: ["tabular-nums"] }}>{value}</Text>
    </View>
  );
  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: space.lg, gap: space.lg, paddingBottom: space.xxl }} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <Segmented value={days} onChange={setDays} options={[{ value: "7", label: "7 days" }, { value: "30", label: "30 days" }, { value: "90", label: "90 days" }]} />
      <Notice text={error} tone="error" />
      {!data ? <ActivityIndicator color={c.accent} /> : (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
            {tile("Visitors", String(data.visitors))}
            {tile("Orders", String(data.orders))}
            {tile("Sales", money(data.sales))}
            {tile("Visitors who bought", `${data.conversion}%`)}
          </View>
          <View style={{ gap: space.sm }}>
            <H2>Visitors per day</H2>
            <View style={{ flexDirection: "row", alignItems: "flex-end", height: 120, gap: data.days > 30 ? 1 : 3 }} accessibilityLabel={`Visitors per day over ${data.days} days, up to ${max} a day`}>
              {data.daily.map((d) => (
                <View key={d.day} style={{ flex: 1, height: `${Math.max(2, (d.visitors / max) * 100)}%`, backgroundColor: d.orders ? c.accent : c.line, borderTopLeftRadius: 2, borderTopRightRadius: 2 }} />
              ))}
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={[type.small, { color: c.muted }]}>{data.daily[0]?.day.slice(5)}</Text>
              <Text style={[type.small, { color: c.muted }]}>Darker days had an order</Text>
              <Text style={[type.small, { color: c.muted }]}>{data.daily.at(-1)?.day.slice(5)}</Text>
            </View>
          </View>
          <View style={{ gap: space.sm }}>
            <H2>Where visitors came from</H2>
            {data.sources.length ? data.sources.map((s) => (
              <View key={s.source} style={{ gap: 4 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={[type.body, { color: c.ink }]}>{SOURCE[s.source] ?? s.source}</Text>
                  <Text style={[type.label, { color: c.ink, fontVariant: ["tabular-nums"] }]}>{s.visitors}</Text>
                </View>
                <View style={{ height: 6, borderRadius: 3, backgroundColor: c.sunk }}><View style={{ width: `${(s.visitors / maxSrc) * 100}%`, height: 6, borderRadius: 3, backgroundColor: c.accent }} /></View>
              </View>
            )) : <Body muted>No visits yet. Share your store link to get started.</Body>}
            <Text style={[type.small, { color: c.muted }]}>Tip: links you share from Snapfront’s QR code and link-in-bio page are tracked automatically.</Text>
          </View>
          <View style={{ gap: space.sm }}>
            <H2>Most viewed products</H2>
            {data.top_products.length ? data.top_products.map((p) => (
              <View key={p.id} style={{ flexDirection: "row", justifyContent: "space-between", gap: space.md, paddingVertical: 6, borderBottomWidth: 1, borderColor: c.line }}>
                <Text numberOfLines={1} style={[type.body, { color: c.ink, flex: 1 }]}>{p.title}</Text>
                <Text style={[type.small, { color: c.muted, fontVariant: ["tabular-nums"] }]}>{p.visitors} views · {p.sold} sold</Text>
              </View>
            )) : <Body muted>No product views yet.</Body>}
          </View>
        </>
      )}
    </ScrollView>
  );
}

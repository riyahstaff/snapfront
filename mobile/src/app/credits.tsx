// Credits: the balance, the packs (sold on the website only, like memberships) and the history.
// Credits pay for avatar videos and talking avatars; failed generations always get them back.
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button, Notice, Pill } from "@/components/ui";
import { Card } from "@/components/panel";
import { api, ApiError, type CreditPack, type CreditsView } from "@/lib/api";
import { fonts, radius, space, type, useColors } from "@/lib/theme";

type Msg = { text: string; tone: "ok" | "error" | "info" } | null;
const errText = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);
const web = Platform.OS === "web";
const when = (s: string) => new Date(`${s.replace(" ", "T")}Z`).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export default function CreditsScreen() {
  const c = useColors();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ checkout?: string; session_id?: string }>();
  const [data, setData] = useState<CreditsView | null>(null);
  const returning = web && params.checkout === "done" && !!params.session_id;
  const [msg, setMsg] = useState<Msg>(() => (web && params.checkout === "canceled" ? { text: "No charge was made.", tone: "info" } : null));
  const [busy, setBusy] = useState<string | null>(returning ? "confirm" : null);
  const confirmed = useRef(false);

  useFocusEffect(useCallback(() => { api.credits().then(setData).catch((e) => setMsg({ text: errText(e, "Couldn’t load your credits."), tone: "error" })); }, []));
  // Back from Stripe: confirm the payment, then tidy the address bar.
  useEffect(() => {
    if (!returning || confirmed.current || !params.session_id) return;
    confirmed.current = true;
    api.confirmCredits(params.session_id)
      .then((v) => { setData(v); setMsg(v.added ? { text: `${v.added.toLocaleString()} credits added. Have fun!`, tone: "ok" } : { text: "Payment received. Your credits will show up in a minute.", tone: "info" }); })
      .catch((e) => setMsg({ text: errText(e, "We couldn’t confirm that payment yet. Your credits will show up in a minute."), tone: "error" }))
      .finally(() => { setBusy(null); try { globalThis.history?.replaceState(null, "", "/credits"); } catch { /* not a browser */ } });
  }, [returning, params.session_id]);

  async function buy(p: CreditPack) {
    setBusy(p.id); setMsg(null);
    try { const { url } = await api.buyCredits(p.id); globalThis.location?.assign(url); }
    catch (e) { setMsg({ text: errText(e, "Couldn’t open checkout. You haven’t been charged."), tone: "error" }); setBusy(null); }
  }

  if (!data) return <View style={{ flex: 1, backgroundColor: c.bg, padding: space.xl }}>{msg ? <Notice text={msg.text} tone="error" /> : <ActivityIndicator color={c.accent} />}</View>;
  const cols = width >= 900 ? 4 : width >= 560 ? 2 : 1;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ padding: space.xl, gap: space.xl, paddingBottom: 64 }}>
      <View style={{ gap: 4 }}>
        <Text style={[type.small, { color: c.muted, textTransform: "uppercase", letterSpacing: 1.4, fontFamily: fonts.bodyBold }]}>Your credits</Text>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 10 }}>
          <Text accessibilityRole="header" style={{ fontFamily: fonts.bodyBold, fontSize: 52, lineHeight: 58, color: c.ink, fontVariant: ["tabular-nums"] }}>{data.balance.toLocaleString()}</Text>
          {busy === "confirm" ? <ActivityIndicator color={c.accent} /> : null}
        </View>
        <Text style={[type.body, { color: c.muted }]}>Credits make avatar videos (Kling O1, Seedance 2.5, Sora 2 Pro) and talking avatars. They never expire, and a video that fails gives its credits back.</Text>
      </View>
      <Notice text={msg?.text ?? null} tone={msg?.tone} />

      {web ? (
        <View style={{ gap: space.md }}>
          <Text style={[type.heading, { color: c.ink }]}>Top up</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md }}>
            {data.packs.map((p) => (
              <View key={p.id} style={{ width: cols === 1 ? "100%" : `${100 / cols - 2}%`, minWidth: 200, flexGrow: 1, backgroundColor: c.surface, borderWidth: p.badge ? 2 : 1, borderColor: p.badge ? c.accent : c.line, borderRadius: radius.lg, padding: space.lg, gap: space.sm }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <Text style={[type.heading, { color: c.ink }]}>{p.name}</Text>
                  {p.badge ? <Pill text={p.badge} tone="good" /> : null}
                </View>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 30, color: c.ink, fontVariant: ["tabular-nums"] }}>{p.credits.toLocaleString()} <Text style={[type.small, { color: c.muted }]}>credits</Text></Text>
                <Text style={[type.body, { color: c.muted }]}>{p.price} · {p.per_credit} a credit</Text>
                <Text style={[type.small, { color: c.muted }]}>About {Math.floor(p.credits / 35)} Kling videos or {Math.floor(p.credits / 115)} Seedance videos</Text>
                <Button label={`Buy for ${p.price}`} variant={p.badge ? "primary" : "secondary"} loading={busy === p.id} disabled={!data.enabled || !!busy} onPress={() => buy(p)} />
              </View>
            ))}
          </View>
          <Text style={[type.small, { color: c.muted }]}>Secure checkout with Stripe. {data.terms}</Text>
        </View>
      ) : (
        <Card title="Getting more credits">
          <View style={{ flexDirection: "row", gap: space.md, alignItems: "flex-start" }}>
            <Ionicons name="globe-outline" size={20} color={c.accent} />
            <Text style={[type.body, { color: c.ink, flex: 1 }]}>Credits are added on the Snapfront website. Sign in there with the same email and they show up here right away.</Text>
          </View>
        </Card>
      )}

      <Card title="History">
        {data.history.length ? data.history.map((h, i) => (
          <View key={h.id} style={{ flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: 8, borderTopWidth: i ? 1 : 0, borderColor: c.sunk }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[type.body, { color: c.ink }]} numberOfLines={2}>{h.note || h.kind}</Text>
              <Text style={[type.small, { color: c.muted }]}>{when(h.created_at)}</Text>
            </View>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: h.delta > 0 ? c.good : c.ink, fontVariant: ["tabular-nums"] }}>{h.delta > 0 ? "+" : "−"}{Math.abs(h.delta).toLocaleString()}</Text>
          </View>
        )) : <Text style={[type.body, { color: c.muted }]}>Nothing yet. Credits you buy and spend show up here.</Text>}
      </Card>
    </ScrollView>
  );
}

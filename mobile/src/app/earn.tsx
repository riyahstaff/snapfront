// Earn with Snapfront: anyone can share their own Snapfront link and earn a commission on each
// Lifetime sale it brings in. Stats, payouts and a ready-made kit for TikTok and Instagram.
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Share, Text, View, useWindowDimensions } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Button, Field, Notice, Pill } from "@/components/ui";
import { Card, CopyLink, Tile, Toggle, count, money, when } from "@/components/panel";
import { ApiError, partners, type PartnerView } from "@/lib/api";
import { fonts, radius, space, type, useColors } from "@/lib/theme";

const errText = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);

export default function EarnScreen() {
  const c = useColors();
  const [data, setData] = useState<PartnerView | null>(null);
  const [error, setError] = useState<string | null>(null);
  useFocusEffect(useCallback(() => { partners.me().then(setData).catch((e) => setError(errText(e, "Couldn't load the partner program."))); }, []));
  if (!data) return <View style={{ flex: 1, backgroundColor: c.bg, padding: space.xl }}>{error ? <Notice text={error} tone="error" /> : <ActivityIndicator color={c.accent} />}</View>;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ padding: space.xl, gap: space.xl, paddingBottom: 64 }} keyboardShouldPersistTaps="handled">
      {data.joined ? <Dashboard data={data} onChange={setData} /> : <Join data={data} onJoined={setData} />}
    </ScrollView>
  );
}

/* ---------------- Joining ---------------- */
function Join({ data, onJoined }: { data: PartnerView; onJoined: (v: PartnerView) => void }) {
  const c = useColors();
  const p = data.program;
  const [agree, setAgree] = useState(false);
  const [paypal, setPaypal] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function join() {
    setBusy(true); setError(null);
    try { onJoined(await partners.join({ agree, paypal_email: paypal.trim() || undefined })); }
    catch (e) { setError(errText(e, "Couldn't join. Try again.")); } finally { setBusy(false); }
  }
  return (
    <>
      <View style={{ gap: space.sm }}>
        <Text accessibilityRole="header" style={[type.hero, { color: c.ink }]}>Earn {money(p.per_sale)} for every Lifetime sale</Text>
        <Text style={[type.body, { color: c.muted }]}>Share Snapfront with your followers. When someone you send buys Lifetime ({money(p.lifetime_price)}), you earn {p.rate}%.</Text>
      </View>
      <Card title="How it works">
        {[
          ["Get your link", "One tap. It's yours to put in your bio, videos and Lives."],
          ["Share what Snapfront does", "Show building a store or a digital product. The kit below has hooks and captions."],
          ["Get paid", `Each sale is held ${p.hold_days} days for refunds, then paid to your Stripe or PayPal.`],
        ].map(([t, d], i) => (
          <View key={t} style={{ flexDirection: "row", gap: space.md, alignItems: "flex-start" }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: c.accent, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontFamily: fonts.bodyBold, color: c.onAccent }}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}><Text style={[type.heading, { color: c.ink }]}>{t}</Text><Text style={[type.body, { color: c.muted }]}>{d}</Text></View>
          </View>
        ))}
        <Text style={[type.small, { color: c.muted }]}>Sales count when the person buys within {p.window_days} days of first using your link.</Text>
      </Card>
      <Card title="The rules">
        {p.terms.map((t) => (
          <View key={t} style={{ flexDirection: "row", gap: 10 }}>
            <Ionicons name="checkmark" size={16} color={c.accent} style={{ marginTop: 3 }} />
            <Text style={[type.body, { color: c.ink, flex: 1 }]}>{t}</Text>
          </View>
        ))}
      </Card>
      <Card>
        {!data.has_email ? (
          <>
            <Text style={[type.body, { color: c.ink }]}>First, sign in with your email so we can reach you about payouts.</Text>
            <Button label="Add my email" variant="secondary" onPress={() => router.push("/settings")} />
          </>
        ) : (
          <>
            <Field label="PayPal email for payouts (optional)" hint="Skip this if you've connected Stripe on your store: payouts go there automatically." value={paypal} onChangeText={setPaypal} autoCapitalize="none" keyboardType="email-address" />
            <Toggle label="I agree to the rules above" value={agree} onChange={setAgree} />
            <Notice text={error} tone="error" />
            <Button label="Get my link" onPress={join} loading={busy} disabled={!agree} />
          </>
        )}
      </Card>
    </>
  );
}

/* ---------------- Partner dashboard ---------------- */
function Dashboard({ data, onChange }: { data: PartnerView; onChange: (v: PartnerView) => void }) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const wide = width >= 820;
  const s = data.stats!;
  const [paypal, setPaypal] = useState(data.payout?.paypal_email ?? "");
  const [code, setCode] = useState(data.code ?? "");
  const [msg, setMsg] = useState<{ text: string; tone: "ok" | "error" } | null>(null);
  const save = async (patch: { paypal_email?: string | null; code?: string }, done: string) => {
    try { onChange(await partners.update(patch)); setMsg({ text: done, tone: "ok" }); } catch (e) { setMsg({ text: errText(e, "Couldn't save."), tone: "error" }); }
  };
  return (
    <>
      <Card title="Your link" sub={`You earn ${data.program.rate}% (${money(data.program.per_sale)}) on every Lifetime sale it brings in.`}>
        <CopyLink url={data.link!} />
        <View style={{ flexDirection: "row", gap: space.md, flexWrap: "wrap" }}>
          <Button label="Share" icon={<Ionicons name="share-outline" size={18} color={c.onAccent} />} onPress={() => Share.share({ message: `I build my online store with Snapfront: ${data.link}` }).catch(() => {})} style={{ flexGrow: 1 }} />
        </View>
        {data.status === "suspended" ? <Notice text="Your partner link is paused. Email support@snapfront.app." tone="error" /> : null}
      </Card>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md }}>
        <Tile label="Clicks" value={count(s.clicks)} sub={`${count(s.signups)} signed up`} wide={wide} />
        <Tile label="Sales" value={count(s.sales)} sub="Lifetime plans" wide={wide} />
        <Tile label="Held" value={money(s.pending)} sub={`for ${data.program.hold_days} days, for refunds`} wide={wide} />
        <Tile label="Paid to you" value={money(s.paid)} sub={s.ready ? `${money(s.ready)} on the way` : "so far"} wide={wide} />
      </View>
      <Notice text={msg?.text ?? null} tone={msg?.tone} />

      <Card title="Getting paid" sub={data.payout?.detail}>
        {data.payout?.method !== "stripe" ? <Button label="Connect Stripe for automatic payouts" variant="secondary" onPress={() => router.push("/settings")} /> : null}
        <View style={{ flexDirection: "row", gap: space.md, alignItems: "flex-end", flexWrap: "wrap" }}>
          <View style={{ flexGrow: 1, minWidth: 220 }}><Field label="PayPal email" value={paypal} onChangeText={setPaypal} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" /></View>
          <Button label="Save" variant="secondary" onPress={() => save({ paypal_email: paypal.trim() || null }, "Saved.")} />
        </View>
      </Card>

      <Card title="Sales">
        {data.commissions?.length ? data.commissions.map((x, i) => (
          <View key={x.id} style={{ flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: 8, borderTopWidth: i ? 1 : 0, borderColor: c.sunk }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[type.heading, { color: c.ink }]}>{money(x.commission)} <Text style={[type.small, { color: c.muted }]}>on a {money(x.sale)} {x.plan === "lifetime" ? "Lifetime" : "Monthly"} sale</Text></Text>
              <Text style={[type.small, { color: c.muted }]}>{when(x.created_at)}{x.status === "pending" ? `  ·  Paid after ${when(x.available_at)}` : x.paid_at ? `  ·  Paid ${when(x.paid_at)}` : ""}</Text>
            </View>
            <Pill text={{ pending: "Held", approved: "Ready", paid: "Paid", void: "Refunded" }[x.status]} tone={x.status === "paid" ? "good" : "neutral"} />
          </View>
        )) : <Text style={[type.body, { color: c.muted }]}>Your sales show up here the moment someone buys through your link.</Text>}
      </Card>

      <Kit link={data.link!} rate={data.program.rate} />

      <Card title="Your code" sub="Changing it keeps your clicks; links with your old code stop working.">
        <View style={{ flexDirection: "row", gap: space.md, alignItems: "flex-end", flexWrap: "wrap" }}>
          <View style={{ flexGrow: 1, minWidth: 180 }}><Field label="Code" value={code} onChangeText={(v) => setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, ""))} maxLength={20} autoCapitalize="characters" /></View>
          <Button label="Change" variant="secondary" disabled={code === data.code || code.length < 3} onPress={() => save({ code }, "Code changed. Share your new link.")} />
        </View>
      </Card>
    </>
  );
}

/* ---------------- Ready-made posts ---------------- */
function Kit({ link, rate }: { link: string; rate: number }) {
  const c = useColors();
  const hooks = [
    "I built this whole online store from one photo of the product.",
    "POV: you want to sell digital products but don't know where to start.",
    "Watch me make a planner, list it and get the checkout link in under 10 minutes.",
    "The app I use to run my store, my emails and my Instagram DMs.",
    "You don't need a website person. Here's how I set up my shop on my phone.",
  ];
  const script = `Hook (0-3s): "${hooks[0]}"\nShow (3-20s): snap a product, show the page Snapfront writes, tap through the storefront.\nProof (20-35s): show your own store or product, a sale notification, or your email list.\nCall to action: "The link's in my bio. I earn a commission if you get it."`;
  const caption = `Built my store with Snapfront: product pages, checkout, email list and Instagram auto-replies, all from my phone. Link in bio. #ad I earn a commission if you buy through my link.\n${link}`;
  return (
    <Card title="Posts that sell" sub="Copy, film, post. Always say you earn a commission.">
      {hooks.map((h) => <CopyLine key={h} text={h} />)}
      <Text style={[type.label, { color: c.ink, marginTop: space.sm }]}>A 35-second video plan</Text>
      <CopyLine text={script} />
      <Text style={[type.label, { color: c.ink, marginTop: space.sm }]}>Caption</Text>
      <CopyLine text={caption} />
      <Text style={[type.small, { color: c.muted }]}>Show what Snapfront does, not what people will earn. Income promises break the rules and can cost you your {rate}%.</Text>
    </Card>
  );
}
function CopyLine({ text }: { text: string }) {
  const c = useColors();
  const [done, setDone] = useState(false);
  return (
    <Pressable onPress={async () => { await Clipboard.setStringAsync(text).catch(() => {}); setDone(true); setTimeout(() => setDone(false), 1500); }} accessibilityRole="button" accessibilityLabel={`Copy: ${text}`}
      style={{ flexDirection: "row", gap: space.md, alignItems: "flex-start", padding: space.md, borderRadius: radius.md, backgroundColor: c.bg, borderWidth: 1, borderColor: c.line }}>
      <Text style={[type.body, { color: c.ink, flex: 1 }]}>{text}</Text>
      <Ionicons name={done ? "checkmark" : "copy-outline"} size={18} color={c.muted} />
    </Pressable>
  );
}

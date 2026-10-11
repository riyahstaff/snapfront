import React, { useEffect, useState } from "react";
import { Linking, Platform, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Body, Button, Notice, Screen } from "@/components/ui";
import { api, ApiError, type PlanId, type PlanLimits } from "@/lib/api";
import { account, useMe } from "@/lib/account-store";
import { billingAvailable, buy, getOffers, restore, startBilling, type Offer } from "@/lib/billing";
import { fonts, radius, space, type, useColors } from "@/lib/theme";

const FALLBACK_PRICE = { launch: "$29", pro: "$14.99" };

function features(plan: "launch" | "pro", l?: PlanLimits): string[] {
  if (!l) return [];
  return plan === "launch"
    ? ["Publish your store and take payments", "Hosting included, for good", `${l.photo} AI product pages a month`, `${l.product} AI digital products a month`]
    : [`Up to ${l.liveStores} live stores`, `${l.photo} AI product pages a month`, `${l.product} AI digital products a month`, `Store assistant: ${l.agent} requests a month`];
}

export default function PlansScreen() {
  const c = useColors();
  const me = useMe();
  const { reason } = useLocalSearchParams<{ reason?: string; highlight?: PlanId }>();
  const [limits, setLimits] = useState<Record<PlanId, PlanLimits> | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; tone: "ok" | "error" | "info" } | null>(reason ? { text: reason, tone: "info" } : null);

  useEffect(() => {
    api.plans().then(setLimits).catch(() => {});
    (async () => {
      const m = account.get() ?? (await account.refresh().catch(() => null));
      if (m) await startBilling(m.account.id);
      setOffers(await getOffers().catch(() => []));
    })();
  }, []);

  const current = me?.account.plan ?? "free";
  const offerFor = (p: "launch" | "pro") => offers.find((o) => o.plan === p);

  async function purchase(p: "launch" | "pro") {
    const offer = offerFor(p);
    if (!offer) { setMsg({ text: "Purchases aren't available on this device yet. Install Snapfront from Google Play to buy a plan.", tone: "error" }); return; }
    setBusy(p); setMsg(null);
    try {
      const next = await buy(offer);
      if (!next) return;
      account.set(next);
      setMsg({ text: next.account.plan === "free" ? "Payment received. It can take a minute to unlock; tap Restore purchases if it doesn't." : `You're on ${next.account.plan_name}. Thank you!`, tone: "ok" });
    } catch (e) {
      setMsg({ text: e instanceof ApiError ? e.message : "The purchase didn't go through. You haven't been charged.", tone: "error" });
    } finally { setBusy(null); }
  }

  async function doRestore() {
    setBusy("restore"); setMsg(null);
    try {
      const next = await restore();
      account.set(next);
      setMsg({ text: next.account.plan === "free" ? "No purchases found for this Google account." : `Restored: you're on ${next.account.plan_name}.`, tone: next.account.plan === "free" ? "info" : "ok" });
    } catch (e) {
      setMsg({ text: e instanceof ApiError ? e.message : "Couldn't restore purchases. Try again.", tone: "error" });
    } finally { setBusy(null); }
  }

  return (
    <Screen>
      <View style={{ gap: space.sm }}>
        <Text accessibilityRole="header" style={[type.hero, { color: c.ink }]}>Go live with Snapfront</Text>
        <Body muted>No fees on your sales. Buyers pay you directly through Stripe.</Body>
      </View>
      <Notice text={msg?.text ?? null} tone={msg?.tone} />
      <PlanCard plan="launch" title="Launch" period="one time" blurb="Everything you need to sell from one store."
        current={current} price={offerFor("launch")?.price ?? FALLBACK_PRICE.launch} limits={limits?.launch} busy={busy} onBuy={purchase} />
      <PlanCard plan="pro" title="Pro" period="per month" blurb="For sellers running several shops, with the store assistant doing the busywork."
        current={current} price={offerFor("pro")?.price ?? FALLBACK_PRICE.pro} limits={limits?.pro} busy={busy} onBuy={purchase} />
      {!billingAvailable() ? <Notice text="Purchases open when Snapfront is installed from Google Play." /> : null}
      <Button label="Restore purchases" variant="ghost" loading={busy === "restore"} disabled={Boolean(busy)} onPress={doRestore} />
      {current === "pro" && Platform.OS === "android" ? (
        <Button label="Manage subscription in Google Play" variant="ghost" onPress={() => Linking.openURL("https://play.google.com/store/account/subscriptions")} />
      ) : null}
      <Text style={[type.small, { color: c.muted }]}>
        Launch is a one-time purchase. Pro renews every month until you cancel in your {Platform.OS === "ios" ? "App Store" : "Google Play"} subscriptions. If Pro ends, stores beyond your plan stop taking orders; with Launch, your first store keeps selling.
      </Text>
      <Button label="Not now" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}

type CardProps = {
  plan: "launch" | "pro"; title: string; period: string; blurb: string;
  current: PlanId; price: string; limits?: PlanLimits; busy: string | null; onBuy: (p: "launch" | "pro") => void;
};
function PlanCard({ plan, title, period, blurb, current, price, limits, busy, onBuy }: CardProps) {
  const c = useColors();
  const owned = current === plan || (plan === "launch" && current === "pro");
  const featured = plan === "pro";
  return (
    <View style={{ backgroundColor: c.surface, borderRadius: radius.lg, borderWidth: featured ? 2 : 1, borderColor: featured ? c.accent : c.line, padding: space.lg, gap: space.md }}>
      <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: space.md }}>
        <Text style={{ fontFamily: fonts.display, fontSize: 26, color: c.ink }}>{title}</Text>
        {current === plan ? (
          <View style={{ backgroundColor: c.sunk, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: c.good }}>Your plan</Text>
          </View>
        ) : null}
      </View>
      <Text style={{ color: c.ink }}>
        <Text style={{ fontFamily: fonts.display, fontSize: 34 }}>{price}</Text>
        <Text style={[type.body, { color: c.muted }]}>  {period}</Text>
      </Text>
      <Body muted>{blurb}</Body>
      <View style={{ gap: 8 }}>
        {features(plan, limits).map((f) => (
          <View key={f} style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
            <Ionicons name="checkmark-circle" size={18} color={c.accent} style={{ marginTop: 2 }} />
            <Text style={[type.body, { color: c.ink, flex: 1 }]}>{f}</Text>
          </View>
        ))}
      </View>
      {owned ? null : (
        <Button label={plan === "launch" ? `Get Launch for ${price}` : `Start Pro for ${price}/month`} variant={featured ? "primary" : "secondary"}
          loading={busy === plan} disabled={Boolean(busy)} onPress={() => onBuy(plan)} />
      )}
    </View>
  );
}

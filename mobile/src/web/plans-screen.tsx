// Plans on the website: same cards as the phone app (plans.tsx), paid through Stripe Checkout.
// Web-only: metro.config.js uses this in place of src/app/plans.tsx when building the website;
// the phone app keeps plans.tsx with Google Play Billing.
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Body, Button, Notice, Screen } from "@/components/ui";
import { api, ApiError, type PlanId, type PlanLimits } from "@/lib/api";
import { account, useMe } from "@/lib/account-store";
import { buy, checkoutCanceled, finishReturnFromCheckout, returningFromCheckout, getOffers, manageSubscription, restore, type Offer } from "@/lib/billing.web";
import { fonts, radius, space, type, useColors } from "@/lib/theme";

const FALLBACK_PRICE = { launch: "$29", pro: "$14.99" };

function features(plan: "launch" | "pro", l?: PlanLimits): string[] {
  if (!l) return [];
  return plan === "launch"
    ? ["Publish your store and take payments", "Hosting included, for good", `${l.photo} AI product pages a month`, `${l.product} AI digital products a month`, `${l.research} price checks against Amazon, Walmart and more a month`]
    : [`Up to ${l.liveStores} live stores`, `${l.photo} AI product pages a month`, `${l.product} AI digital products a month`, `${l.research} price checks a month`, `Store assistant: ${l.agent} requests a month`];
}

export default function PlansWebScreen() {
  const c = useColors();
  const me = useMe();
  const { reason } = useLocalSearchParams<{ reason?: string; highlight?: PlanId }>();
  const [limits, setLimits] = useState<Record<PlanId, PlanLimits> | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [busy, setBusy] = useState<string | null>(() => (returningFromCheckout() ? "confirm" : null));
  const [msg, setMsg] = useState<{ text: string; tone: "ok" | "error" | "info" } | null>(
    reason ? { text: reason, tone: "info" } : checkoutCanceled() ? { text: "Checkout canceled. You haven't been charged.", tone: "info" } : null);

  useEffect(() => {
    api.plans().then(setLimits).catch(() => {});
    getOffers().then(setOffers).catch(() => {});
    // Back from Stripe: the server confirms the payment with Stripe, then the plan unlocks.
    finishReturnFromCheckout().then((next) => {
      if (!next) return;
      account.set(next);
      setMsg(next.account.plan === "free"
        ? { text: "Payment received. It can take a minute to unlock. Tap Check my purchases if it doesn't.", tone: "info" }
        : { text: `You're on ${next.account.plan_name}. Thank you!`, tone: "ok" });
    }).catch((e) => setMsg({ text: e instanceof ApiError ? e.message : "We couldn't confirm that payment yet. Tap Check my purchases in a minute.", tone: "error" }))
      .finally(() => setBusy(null));
  }, []);

  const current = me?.account.plan ?? "free";
  const offerFor = (p: "launch" | "pro") => offers.find((o) => o.plan === p);

  async function purchase(p: "launch" | "pro") {
    const offer = offerFor(p);
    if (!offer) { setMsg({ text: "Plans can't be bought right now. Try again in a few minutes.", tone: "error" }); return; }
    setBusy(p); setMsg(null);
    try { await buy(offer); }
    catch (e) {
      setMsg({ text: e instanceof ApiError ? e.message : "Couldn't open checkout. You haven't been charged.", tone: "error" });
      setBusy(null);
    }
  }

  async function doRestore() {
    setBusy("restore"); setMsg(null);
    try {
      const next = await restore();
      account.set(next);
      setMsg({ text: next.account.plan === "free" ? "No plan found on this account. If you bought one on your phone, sign in with the same email in Settings." : `You're on ${next.account.plan_name}.`, tone: next.account.plan === "free" ? "info" : "ok" });
    } catch (e) {
      setMsg({ text: e instanceof ApiError ? e.message : "Couldn't check your purchases. Try again.", tone: "error" });
    } finally { setBusy(null); }
  }

  async function manage() {
    setBusy("manage"); setMsg(null);
    try { await manageSubscription(); }
    catch (e) { setMsg({ text: e instanceof ApiError ? e.message : "Couldn't open subscription settings.", tone: "error" }); setBusy(null); }
  }

  return (
    <Screen>
      <View style={{ gap: space.sm }}>
        <Text accessibilityRole="header" style={[type.hero, { color: c.ink }]}>Go live with Snapfront</Text>
        <Body muted>No fees on your sales. Buyers pay you directly through Stripe.</Body>
      </View>
      <Notice text={busy === "confirm" ? "Checking your payment…" : msg?.text ?? null} tone={busy === "confirm" ? "info" : msg?.tone} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.lg }}>
        <PlanCard plan="launch" title="Launch" period="one time" blurb="Everything you need to sell from one store."
          current={current} price={offerFor("launch")?.price ?? FALLBACK_PRICE.launch} limits={limits?.launch} busy={busy} onBuy={purchase} />
        <PlanCard plan="pro" title="Pro" period="per month" blurb="For sellers running several shops, with the store assistant doing the busywork."
          current={current} price={offerFor("pro")?.price ?? FALLBACK_PRICE.pro} limits={limits?.pro} busy={busy} onBuy={purchase} />
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Ionicons name="lock-closed" size={14} color={c.muted} />
        <Text style={[type.small, { color: c.muted, flex: 1 }]}>Secure checkout by Stripe. Your plan works on the website and in the Snapfront app.</Text>
      </View>
      <Button label="Check my purchases" variant="ghost" loading={busy === "restore"} disabled={Boolean(busy)} onPress={doRestore} />
      {current === "pro" ? <Button label="Manage subscription" variant="ghost" loading={busy === "manage"} disabled={Boolean(busy)} onPress={manage} /> : null}
      <Text style={[type.small, { color: c.muted }]}>
        Launch is a one-time purchase. Pro renews every month until you cancel. Cancel anytime from Manage subscription (or in Google Play, if you subscribed on your phone). If Pro ends, stores beyond your plan stop taking orders; with Launch, your first store keeps selling.
      </Text>
      <Button label="Not now" variant="ghost" onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} />
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
    <View style={{ flexGrow: 1, flexBasis: 300, backgroundColor: c.surface, borderRadius: radius.lg, borderWidth: featured ? 2 : 1, borderColor: featured ? c.accent : c.line, padding: space.lg, gap: space.md }}>
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

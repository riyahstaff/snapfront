import React, { useEffect, useState } from "react";
import { Linking, Platform, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Body, Button, Notice, Screen } from "@/components/ui";
import { api, ApiError, type PlanId, type PlanLimits } from "@/lib/api";
import { account, useMe } from "@/lib/account-store";
import { billingAvailable, buy, getOffers, restore, startBilling, type Offer } from "@/lib/billing";
import { space, type, useColors } from "@/lib/theme";
import { PlanCards, type PlanChoice } from "@/components/plan-cards";


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
  const offerFor = (p: PlanChoice) => offers.find((o) => o.plan === p);

  async function purchase(p: PlanChoice) {
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
      {current === "launch" ? <Notice text="You have Launch from before, with one live store. Get Lifetime or Monthly to unlock everything." /> : null}
      <PlanCards account={me?.account ?? null} prices={{ lifetime: offerFor("lifetime")?.price, pro: offerFor("pro")?.price }} limits={limits?.pro} busy={busy} onBuy={purchase} />
      {!billingAvailable() ? <Notice text="Purchases open when Snapfront is installed from Google Play." /> : null}
      <Button label="Restore purchases" variant="ghost" loading={busy === "restore"} disabled={Boolean(busy)} onPress={doRestore} />
      {current === "pro" && !me?.account.lifetime && Platform.OS === "android" ? (
        <Button label="Manage subscription in Google Play" variant="ghost" onPress={() => Linking.openURL("https://play.google.com/store/account/subscriptions")} />
      ) : null}
      <Text style={[type.small, { color: c.muted }]}>
        Lifetime is a one-time purchase. Monthly renews every month until you cancel in your {Platform.OS === "ios" ? "App Store" : "Google Play"} subscriptions. If Monthly ends, your stores stop taking orders until you renew.
      </Text>
      <Button label="Not now" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}


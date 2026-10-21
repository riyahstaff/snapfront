// Becoming a member on the website: pick Lifetime (first 500 members; then Yearly) or Monthly, confirm an email (so the membership
// belongs to that email from the start), pay through Stripe Checkout, then get the free phone app.
// Web-only: metro.config.js uses this in place of src/app/plans.tsx when building the website;
// the phone app's plans.tsx sells nothing (members sign in there).
import React, { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Body, Button, Notice, Screen } from "@/components/ui";
import { api, ApiError, type PlanId, type PlanLimits } from "@/lib/api";
import { EmailSignIn } from "@/components/email-sign-in";
import { account, useMe } from "@/lib/account-store";
import { buy, checkoutCanceled, finishReturnFromCheckout, getAppInfo, getOffers, manageSubscription, restore, returningFromCheckout, type Offer } from "@/lib/billing.web";
import { fonts, radius, space, type, useColors } from "@/lib/theme";
import { FALLBACK_PRICE, PlanCards, type LongOffer, type PlanChoice } from "@/components/plan-cards";


export default function PlansWebScreen() {
  const c = useColors();
  const me = useMe();
  const { reason, buy: buyParam } = useLocalSearchParams<{ reason?: string; highlight?: PlanId; buy?: string }>();
  const [welcome, setWelcome] = useState<{ email: string | null } | null>(null);
  const autoBuy = useRef(false);
  const [gate, setGate] = useState<PlanChoice | null>(null);   // the plan waiting for an email
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
      if (next.account.plan === "free") setMsg({ text: "Payment received. It can take a minute to unlock. Tap Check my purchases if it doesn't.", tone: "info" });
      else setWelcome({ email: next.account.email ?? next.checkout_email ?? null });
    }).catch((e) => setMsg({ text: e instanceof ApiError ? e.message : "We couldn't confirm that payment yet. Tap Check my purchases in a minute.", tone: "error" }))
      .finally(() => setBusy(null));
  }, []);

  const current = me?.account.plan ?? "free";
  // Coming from a pricing button on snapfront.app (…/plans?buy=lifetime): go straight to checkout.
  useEffect(() => {
    let want: PlanChoice | null = buyParam === "lifetime" || buyParam === "launch" ? "lifetime" : buyParam === "pro" ? "pro" : buyParam === "yearly" ? "yearly" : null;
    if (!want || autoBuy.current || !offers.length || !me || returningFromCheckout()) return;
    autoBuy.current = true;
    // An old Lifetime link after the founding spots are gone (or a Yearly link before): the plan on sale.
    if ((want === "lifetime" || want === "yearly") && !offerFor(want)) want = longOffer?.plan ?? null;
    if (!want || me.account.lifetime || (current === "pro" && want !== "lifetime")) return;
    void purchase(want);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once, when offers and the account are ready
  }, [buyParam, offers, me, current]);
  const offerFor = (p: PlanChoice) => offers.find((o) => o.plan === p);
  const longRaw = offers.find((o) => o.plan === "lifetime" || o.plan === "yearly");
  const longOffer: LongOffer | null = longRaw ? { plan: longRaw.plan as LongOffer["plan"], price: longRaw.price, left: longRaw.left, limit: longRaw.limit } : null;

  async function purchase(p: PlanChoice, emailReady = false) {
    // The membership belongs to an email from the start: confirm it before paying.
    if (!emailReady && !(account.get() ?? me)?.account.email) { setGate(p); setMsg(null); return; }
    setGate(null);
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

  if (welcome && me && me.account.plan !== "free") return <Welcome planName={me.account.plan_name} email={welcome.email} linkedEmail={me.account.email ?? null} />;
  if (gate) {
    const name = gate === "lifetime" ? "Lifetime" : gate === "yearly" ? "Yearly" : "Monthly";
    const price = offerFor(gate)?.price ?? FALLBACK_PRICE[gate];
    return (
      <Screen>
        <View style={{ gap: space.sm }}>
          <Text style={[type.label, { color: c.muted }]}>Step 1 of 2</Text>
          <Text accessibilityRole="header" style={[type.hero, { color: c.ink }]}>Your email</Text>
          <Body muted>Your {name} membership ({price}{gate === "pro" ? " a month" : gate === "yearly" ? " a year" : " once"}) is saved to this email. You’ll use it to sign in here and in the free Snapfront app. Next, you pay securely with Stripe.</Body>
        </View>
        <View style={{ maxWidth: 520, gap: space.md }}>
          <EmailSignIn confirmLabel="Continue to payment" onDone={({ me: next }) => {
            if (next.account.plan !== "free") {   // this email is already a member
              setGate(null);
              setMsg({ text: `Welcome back. ${next.account.email} is already a member (${next.account.plan_name}).`, tone: "ok" });
              return;
            }
            void purchase(gate, true);
          }} />
        </View>
        <Notice text={msg?.text ?? null} tone={msg?.tone} />
        <Button label="Back to plans" variant="ghost" onPress={() => setGate(null)} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ gap: space.sm }}>
        <Text accessibilityRole="header" style={[type.hero, { color: c.ink }]}>{current === "free" ? "Become a member" : "Your membership"}</Text>
        <Body muted>Everything in Snapfront, no fees on your sales, and the Snapfront Android app free.</Body>
      </View>
      <Notice text={busy === "confirm" ? "Checking your payment…" : msg?.text ?? null} tone={busy === "confirm" ? "info" : msg?.tone} />
      {current === "launch" ? <Notice text="You have Launch from before, with one live store. Get Lifetime or Monthly to unlock everything." /> : null}
      <PlanCards account={me?.account ?? null} long={longOffer} monthly={offerFor("pro")?.price} limits={limits?.pro} busy={busy} onBuy={purchase} wide />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Ionicons name="lock-closed" size={14} color={c.muted} />
        <Text style={[type.small, { color: c.muted, flex: 1 }]}>Secure checkout by Stripe. Your membership works here and in the free Snapfront app: sign in with the same email.</Text>
      </View>
      <Button label="Check my purchases" variant="ghost" loading={busy === "restore"} disabled={Boolean(busy)} onPress={doRestore} />
      {current === "pro" && !me?.account.lifetime ? <Button label="Manage subscription" variant="ghost" loading={busy === "manage"} disabled={Boolean(busy)} onPress={manage} /> : null}
      <Text style={[type.small, { color: c.muted }]}>
        All sales are final. Lifetime is a one-time purchase, for the first 500 members. Monthly renews every month and Yearly every year until you cancel from Manage subscription (or in Google Play, if you subscribed on your phone). If your subscription ends, your stores stop taking orders until you renew.
      </Text>
      {current === "free" && !me?.account.email ? <Button label="Already a member? Sign in" variant="ghost" onPress={() => router.push("/sign-in")} /> : null}
      <Button label={current === "free" ? "Not yet: keep trying it free" : "Back"} variant="ghost" onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} />
    </Screen>
  );
}


/** After paying: the membership is active. Get the free phone app (and save the email first, for
 * anyone who paid before the email step existed). */
function Welcome({ planName, email, linkedEmail }: { planName: string; email: string | null; linkedEmail: string | null }) {
  const c = useColors();
  const [saved, setSaved] = useState<string | null>(linkedEmail);
  const [android, setAndroid] = useState<string | null>(null);
  useEffect(() => { getAppInfo().then((a) => setAndroid(a.android_url)).catch(() => {}); }, []);

  const step = (n: number, title: string, done: boolean, body: React.ReactNode, highlight = false) => (
    <View style={{ flexDirection: "row", gap: 16, backgroundColor: c.surface, borderWidth: highlight ? 2 : 1, borderColor: highlight ? c.accent : c.line, borderRadius: radius.lg, padding: space.lg }}>
      <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: done ? c.good : c.accent }}>
        {done ? <Ionicons name="checkmark" size={20} color={c.onAccent} /> : <Text style={{ fontFamily: fonts.bodyBold, color: c.onAccent }}>{n}</Text>}
      </View>
      <View style={{ flex: 1, gap: 10 }}><Text style={{ fontFamily: fonts.bodyBold, fontSize: 18, color: c.ink }}>{title}</Text>{body}</View>
    </View>
  );
  const appStep = saved ? 1 : 2;
  return (
    <Screen>
      <View style={{ gap: space.sm }}>
        <Text style={[type.label, { color: c.good }]}>Payment received</Text>
        <Text accessibilityRole="header" style={[type.hero, { color: c.ink }]}>Welcome to {planName}</Text>
        <Body muted>{saved ? `Your membership is active and saved to ${saved}.` : "Your membership is active on this browser. Save it to your email so it follows you everywhere."}</Body>
      </View>
      {!saved ? step(1, "Save your membership to your email", false, (
        <View style={{ gap: 10, maxWidth: 520 }}>
          <Body muted>We’ll email you a 6-digit code. This is how you sign in here and in the app.</Body>
          <EmailSignIn initialEmail={email ?? ""} confirmLabel="Save" onDone={({ me: next }) => setSaved(next.account.email ?? null)} />
        </View>
      )) : null}
      {step(appStep, "Get the Snapfront app, free", false, (
        <View style={{ gap: 10 }}>
          <Body muted>Snap products with your camera, post from your phone and check orders on the go. Install Snapfront on Android, then sign in with {saved ?? "the same email"}. Your stores and membership are already there.</Body>
          {android ? <View style={{ alignSelf: "flex-start" }}><Button label="Get it on Google Play" icon={<Ionicons name="logo-google-playstore" size={18} color={c.onAccent} />} onPress={() => window.open(android, "_blank", "noopener")} /></View> : null}
        </View>
      ), Boolean(saved))}
      {step(appStep + 1, "Start building here", false, (
        <View style={{ gap: 10 }}>
          <Body muted>Everything also works right here in your browser.</Body>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <Button label="Snap your first product" variant="secondary" onPress={() => router.replace("/snap")} />
            <Button label="Start with the Academy" variant="ghost" onPress={() => router.replace("/academy")} />
          </View>
        </View>
      ))}
      <View style={{ gap: 8 }}>
        <Text style={[type.label, { color: c.ink }]}>Your membership includes</Text>
        <Text style={[type.small, { color: c.muted }]}>Up to 10 live stores with 0% Snapfront fees, AI product pages, photos and video, marketing posts, email marketing, affiliates, Instagram AutoDM, Snapfront Academy, daily post ideas and the members’ community.</Text>
      </View>
    </Screen>
  );
}

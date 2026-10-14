// The phone app's membership screen. Memberships are sold on the website, never in the app, so
// this screen sells nothing and names no prices: members sign in with the email they joined
// with, and people who bought through Google Play in earlier versions can restore and manage it.
// The website shows src/web/plans-screen.tsx here instead (Stripe checkout).
import React, { useEffect, useState } from "react";
import { Linking, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Body, Button, Notice, Screen } from "@/components/ui";
import { EmailSignIn } from "@/components/email-sign-in";
import { everything } from "@/components/plan-cards";
import { api, ApiError, type PlanId, type PlanLimits } from "@/lib/api";
import { account, useMe } from "@/lib/account-store";
import { restore, startBilling } from "@/lib/billing";
import { radius, space, type, useColors } from "@/lib/theme";

export default function MembershipScreen() {
  const c = useColors();
  const me = useMe();
  const { reason } = useLocalSearchParams<{ reason?: string; highlight?: PlanId }>();
  const [limits, setLimits] = useState<Record<PlanId, PlanLimits> | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; tone: "ok" | "error" | "info" } | null>(reason ? { text: reason, tone: "info" } : null);
  useEffect(() => { api.plans().then(setLimits).catch(() => {}); }, []);

  const a = me?.account;
  const member = Boolean(a && a.plan !== "free");

  async function doRestore() {
    setBusy("restore"); setMsg(null);
    try {
      const next = await restore();
      account.set(next);
      setMsg(next.account.plan === "free" ? { text: "No Google Play purchases found for this Google account.", tone: "info" } : { text: `Restored: you’re on ${next.account.plan_name}.`, tone: "ok" });
    } catch (e) {
      setMsg({ text: e instanceof ApiError ? e.message : "Couldn't restore purchases. Try again.", tone: "error" });
    } finally { setBusy(null); }
  }

  return (
    <Screen>
      <View style={{ gap: space.sm }}>
        <Text accessibilityRole="header" style={[type.hero, { color: c.ink }]}>{member ? "You’re a member" : "Snapfront membership"}</Text>
        <Body muted>{member
          ? `${a!.plan_name}${a!.email ? `, ${a!.email}` : ""}. Everything in your membership works here in the app and on the website.`
          : "Members get everything in Snapfront, and this app is included free."}</Body>
      </View>
      <Notice text={msg?.text ?? null} tone={msg?.tone} />
      {a?.plan === "launch" ? <Notice text="You have Launch from before, with one live store." /> : null}

      <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, padding: space.lg, gap: 10 }}>
        <Text style={[type.heading, { color: c.ink }]}>{a?.plan === "pro" ? "Your membership includes" : "Membership includes"}</Text>
        {[...everything(limits?.pro), "Snapfront Academy, the daily post idea and the members’ community"].map((f) => (
          <View key={f} style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
            <Ionicons name="checkmark-circle" size={18} color={c.accent} style={{ marginTop: 2 }} />
            <Text style={[type.body, { color: c.ink, flex: 1 }]}>{f}</Text>
          </View>
        ))}
      </View>

      {!member ? (
        <View style={{ gap: space.md }}>
          <Text style={[type.heading, { color: c.ink }]}>Already a member?</Text>
          <Body muted>{a?.email ? `This app is signed in as ${a.email}, which doesn’t have a membership. ` : ""}Sign in with the email you joined with. Your stores and membership come with you.</Body>
          <EmailSignIn onDone={async ({ me: next }) => {
            await startBilling(next.account.id);
            setMsg(next.account.plan === "free"
              ? { text: `Signed in as ${next.account.email}. We didn’t find a membership on this email.`, tone: "info" }
              : { text: `Welcome back. You’re on ${next.account.plan_name}.`, tone: "ok" });
          }} />
        </View>
      ) : null}

      <Button label="Restore Google Play purchases" variant="ghost" loading={busy === "restore"} disabled={Boolean(busy)} onPress={doRestore} />
      {a?.plan === "pro" && !a.lifetime ? (
        <Button label="Manage a Google Play subscription" variant="ghost" onPress={() => Linking.openURL("https://play.google.com/store/account/subscriptions")} />
      ) : null}
      <Button label={member ? "Done" : "Not now"} variant="ghost" onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} />
    </Screen>
  );
}

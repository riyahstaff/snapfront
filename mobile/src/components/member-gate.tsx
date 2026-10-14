// The phone app is the members' companion: memberships are bought on the website, and the app is
// included free. Before anything else, people sign in with a verified email (like the website);
// then only members get in. This screen never names a price or says where to buy, so the app
// sells nothing through Google Play. People who bought in earlier app versions can restore.
import React, { useState } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Brand } from "@/components/brand";
import { Body, Button, Notice } from "@/components/ui";
import { EmailSignIn } from "@/components/email-sign-in";
import { API_URL, ApiError, type Me } from "@/lib/api";
import { account } from "@/lib/account-store";
import { restore, startBilling } from "@/lib/billing";
import { space, type, useColors } from "@/lib/theme";

/** Flip to false to let signed-in non-members use the app's free allowance again. */
export const MEMBERS_ONLY = true;

export type GateState = "checking" | "offline" | "sign-in" | "not-member" | "open";
export function gateFor(me: Me | null, checked: boolean, failed: boolean): GateState {
  if (me) {
    if (!me.account.email) return "sign-in";
    if (MEMBERS_ONLY && me.account.plan === "free") return "not-member";
    return "open";
  }
  if (failed) return "offline";
  return checked ? "sign-in" : "checking";
}

export function MemberGate({ state, onRetry }: { state: GateState; onRetry: () => void }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; tone: "ok" | "error" | "info" } | null>(null);
  const me = account.get();

  async function doRestore() {
    setBusy(true); setMsg(null);
    try {
      const next = await restore();
      account.set(next);
      if (next.account.plan === "free") setMsg({ text: "No Google Play purchases found for this Google account.", tone: "info" });
    } catch (e) {
      setMsg({ text: e instanceof ApiError ? e.message : "Couldn't restore purchases. Try again.", tone: "error" });
    } finally { setBusy(false); }
  }

  if (state === "checking") return <View style={{ flex: 1, backgroundColor: c.bg }} />;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: space.xl, paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + 48, gap: space.lg }}>
      <Brand size={42} tagline />
      {state === "offline" ? (
        <>
          <Text accessibilityRole="header" style={[type.hero, { color: c.ink }]}>Can’t reach Snapfront</Text>
          <Body muted>Check your connection and try again.</Body>
          <Button label="Try again" onPress={onRetry} />
        </>
      ) : (
        <>
          <View style={{ gap: space.sm }}>
            <Text accessibilityRole="header" style={[type.hero, { color: c.ink }]}>
              {state === "not-member" ? "Members only" : "Sign in to Snapfront"}
            </Text>
            <Body muted>{state === "not-member"
              ? `The Snapfront app is included with Snapfront membership. ${me?.account.email ?? "This email"} doesn’t have a membership. If you joined with a different email, sign in with it below.`
              : "Sign in with the email you joined with. Your stores and membership come with you."}</Body>
          </View>
          <EmailSignIn onDone={async ({ me: next }) => {
            await startBilling(next.account.id);
            setMsg(next.account.plan === "free" && MEMBERS_ONLY ? { text: `${next.account.email} doesn’t have a membership.`, tone: "info" } : null);
          }} />
          <Notice text={msg?.text ?? null} tone={msg?.tone} />
          <View style={{ borderTopWidth: 1, borderTopColor: c.line, paddingTop: space.lg, gap: space.sm }}>
            <Text style={[type.label, { color: c.ink }]}>Bought Snapfront in this app before?</Text>
            <Button label="Restore Google Play purchases" variant="secondary" loading={busy} onPress={doRestore} />
          </View>
          {state === "not-member" ? (
            <Pressable accessibilityRole="link" onPress={() => Linking.openURL(`${API_URL}/delete-account`)} hitSlop={8}>
              <Text style={[type.small, { color: c.muted, textDecorationLine: "underline" }]}>Delete my account</Text>
            </Pressable>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

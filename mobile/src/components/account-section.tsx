import React, { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { Body, Button, Field, H2, Notice } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { account, useMe } from "@/lib/account-store";
import { startBilling } from "@/lib/billing";
import { space, type, useColors } from "@/lib/theme";

/** Plan summary and email sign-in, so stores and purchases follow the person to a new phone. */
export function AccountSection() {
  const c = useColors();
  const me = useMe();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; tone: "error" | "ok" | "info" } | null>(null);
  const a = me?.account;

  async function send() {
    setBusy(true); setMsg(null);
    try { await api.emailStart(email); setStep("code"); setMsg({ text: `We sent a 6-digit code to ${email.trim()}.`, tone: "info" }); }
    catch (e) { setMsg({ text: e instanceof ApiError ? e.message : "Couldn't send the code.", tone: "error" }); }
    finally { setBusy(false); }
  }

  async function verify() {
    setBusy(true); setMsg(null);
    try {
      const r = await api.emailVerify(email, code);
      const next = await account.refresh();
      await startBilling(next.account.id);
      setStep("email"); setCode("");
      setMsg({ text: r.status === "switched" ? `Signed in. Your ${next.account.stores.length === 1 ? "store is" : `${next.account.stores.length} stores are`} on this phone now.` : "Email saved. Sign in with it on any phone to get your stores.", tone: "ok" });
    } catch (e) { setMsg({ text: e instanceof ApiError ? e.message : "Couldn't check the code.", tone: "error" }); }
    finally { setBusy(false); }
  }

  if (!a) return null;
  return (
    <View style={{ gap: space.md }}>
      <H2>Your membership</H2>
      <Body>
        <Text style={{ fontWeight: "700" }}>{a.plan_name}</Text>
        {a.plan === "free" ? ", trying Snapfront" : a.plan === "launch" ? " · one live store" : ` · up to ${a.limits.liveStores} live stores`}
      </Body>
      <Button label="Membership" variant="secondary" onPress={() => router.push("/plans")} />

      <H2>Sign in</H2>
      {a.email ? (
        <Body muted>Signed in as {a.email}. Use this email on another phone to get your stores and purchases there.</Body>
      ) : (
        <Body muted>Add your email so your stores and purchases aren’t tied to this phone. Already use Snapfront on another phone? Enter that email to bring your stores here.</Body>
      )}
      {!a.email || step === "code" ? (
        step === "email" ? (
          <>
            <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="you@example.com" />
            <Button label="Email me a code" loading={busy} disabled={!email.includes("@")} onPress={send} />
          </>
        ) : (
          <>
            <Field label="6-digit code" value={code} onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))} keyboardType="number-pad" autoComplete="one-time-code" placeholder="123456" />
            <Button label="Sign in" loading={busy} disabled={code.length !== 6} onPress={verify} />
            <Button label="Use a different email" variant="ghost" onPress={() => { setStep("email"); setMsg(null); }} />
          </>
        )
      ) : null}
      <Notice text={msg?.text ?? null} tone={msg?.tone} />
      {a.email ? null : <Text style={[type.small, { color: c.muted }]}>We only use your email to sign you in.</Text>}
    </View>
  );
}

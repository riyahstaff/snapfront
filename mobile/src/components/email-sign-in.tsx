// Email + 6-digit code: how members sign in on the website and in the app. If the email already
// has a Snapfront account, this device switches to it (stores and membership come along);
// otherwise the email is saved to the account in use. Used by the join step on the website,
// the sign-in page and the phone app's welcome and membership screens.
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Button, Field, Notice } from "@/components/ui";
import { api, ApiError, type Me } from "@/lib/api";
import { account } from "@/lib/account-store";
import { type, useColors } from "@/lib/theme";

export type SignInResult = { me: Me; switched: boolean };

type Props = {
  onDone: (r: SignInResult) => void | Promise<void>;
  /** Button on the code step. */
  confirmLabel?: string;
  initialEmail?: string;
};
export function EmailSignIn({ onDone, confirmLabel = "Sign in", initialEmail = "" }: Props) {
  const c = useColors();
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; tone: "error" | "info" } | null>(null);
  const valid = /^\S+@\S+\.\S+$/.test(email.trim());

  async function send() {
    if (!valid || busy) return;
    setBusy(true); setMsg(null);
    try { await api.emailStart(email.trim()); setStep("code"); setMsg({ text: `We sent a 6-digit code to ${email.trim()}. It can take a minute; check spam too.`, tone: "info" }); }
    catch (e) { setMsg({ text: e instanceof ApiError ? e.message : "Couldn't send the code. Try again.", tone: "error" }); }
    finally { setBusy(false); }
  }
  async function verify() {
    if (code.length !== 6 || busy) return;
    setBusy(true); setMsg(null);
    try {
      const r = await api.emailVerify(email.trim(), code);
      const me = await account.refresh();
      setCode("");
      await onDone({ me, switched: r.status === "switched" });
    } catch (e) { setMsg({ text: e instanceof ApiError ? e.message : "That code didn't work. Try again.", tone: "error" }); }
    finally { setBusy(false); }
  }

  return (
    <View style={{ gap: 12 }}>
      {step === "email" ? (
        <>
          <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="you@example.com" returnKeyType="send" onSubmitEditing={send} />
          <Button label="Email me a code" loading={busy} disabled={!valid} onPress={send} />
        </>
      ) : (
        <>
          <Field label="6-digit code" value={code} onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))} keyboardType="number-pad" autoComplete="one-time-code" placeholder="123456" returnKeyType="done" onSubmitEditing={verify} />
          <Button label={confirmLabel} loading={busy} disabled={code.length !== 6} onPress={verify} />
          <Pressable accessibilityRole="button" onPress={() => { setStep("email"); setMsg(null); setCode(""); }} hitSlop={8}>
            <Text style={[type.small, { color: c.muted, textDecorationLine: "underline" }]}>Use a different email</Text>
          </Pressable>
        </>
      )}
      <Notice text={msg?.text ?? null} tone={msg?.tone} />
    </View>
  );
}

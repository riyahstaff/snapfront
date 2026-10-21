// Sign in with the email you joined with: stores and membership follow you to this browser or phone.
import React, { useState } from "react";
import { Platform, Text, View } from "react-native";
import { router } from "expo-router";
import { Body, Button, Notice, Screen } from "@/components/ui";
import { EmailSignIn } from "@/components/email-sign-in";
import { startBilling } from "@/lib/billing";
import { api } from "@/lib/api";
import { useMe } from "@/lib/account-store";
import { radius, space, type, useColors } from "@/lib/theme";

export default function SignInScreen() {
  const c = useColors();
  const me = useMe();
  const [done, setDone] = useState<string | null>(null);
  const signedIn = me?.account.email;

  return (
    <Screen>
      <View style={Platform.OS === "web" ? { width: "100%", maxWidth: 520, alignSelf: "center", marginTop: space.xl, padding: space.xxl, gap: space.xl, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, backgroundColor: c.surface } : { gap: space.xl }}>
      <View style={{ gap: space.sm }}>
        <Text accessibilityRole="header" style={[type.hero, { color: c.ink }]}>Sign in to Snapfront</Text>
        <Body muted>{signedIn && !done
          ? `You’re signed in as ${signedIn} (${me.account.plan_name}). To use a different account, enter its email below.`
          : "Use the email you joined with. Your stores and membership come with you."}</Body>
      </View>
      {done ? (
        <>
          <Notice text={done} tone="ok" />
          <Button label="Go to my store" onPress={() => router.replace("/")} />
        </>
      ) : (
        <EmailSignIn onDone={async ({ me: next, switched }) => {
          await startBilling(next.account.id);
          setDone(switched || next.account.plan !== "free"
            ? `Welcome back. You’re on ${next.account.plan_name}.`
            : `Signed in as ${next.account.email}. We didn’t find a membership on this email yet.`);
        }} />
      )}
      {Platform.OS === "web" && !done && me?.account.plan === "free" ? (
        <View style={{ gap: 8, marginTop: space.md }}>
          <Text style={[type.label, { color: c.ink }]}>Not a member yet?</Text>
          <Button label="Become a member" variant="secondary" onPress={() => router.push("/plans")} />
          <Button label="New here? See everything Snapfront does" variant="ghost" onPress={() => { if (typeof window !== "undefined") window.location.assign(api.landingUrl()); }} />
        </View>
      ) : null}
      {!done ? <Button label="Not now" variant="ghost" onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} /> : null}
      </View>
    </Screen>
  );
}

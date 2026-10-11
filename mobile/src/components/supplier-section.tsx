import React, { useState } from "react";
import { Switch, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { Body, Button, Field, H2, Notice } from "@/components/ui";
import { api, ApiError, type Suppliers } from "@/lib/api";
import { account, useMe } from "@/lib/account-store";
import { space, type, useColors } from "@/lib/theme";

/** The seller's own CJdropshipping account: orders for CJ products are placed there, and CJ bills them. */
export function SupplierSection() {
  const c = useColors();
  const me = useMe();
  const [key, setKey] = useState("");
  const [autoPay, setAutoPay] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; tone: "error" | "ok" | "info" } | null>(null);
  const cj = me?.account.suppliers?.cj;

  async function apply(label: string, fn: () => Promise<Suppliers>, ok: string) {
    setBusy(label); setMsg(null);
    try { await fn(); await account.refresh(); setKey(""); setMsg({ text: ok, tone: "ok" }); }
    catch (e) { setMsg({ text: e instanceof ApiError ? e.message : "Couldn't update your CJ account.", tone: "error" }); }
    finally { setBusy(null); }
  }

  if (!me) return null;
  return (
    <View style={{ gap: space.md }}>
      <H2>CJdropshipping</H2>
      {cj?.connected ? (
        <>
          <Body muted>Connected. When someone buys a CJ product from you, Snapfront places the order in your CJ account and CJ ships it to your buyer.</Body>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[type.label, { color: c.ink }]}>Pay CJ automatically</Text>
              <Text style={[type.small, { color: c.muted }]}>
                {cj.auto_pay ? "Orders are paid from your CJ wallet balance, so they ship right away. Keep money in your CJ wallet." : "Orders wait in CJ until you pay for them there (My CJ, then Orders)."}
              </Text>
            </View>
            <Switch value={cj.auto_pay} disabled={Boolean(busy)} accessibilityLabel="Pay CJ automatically from my CJ balance" trackColor={{ true: c.accent, false: c.line }}
              onValueChange={(v) => apply("auto", () => api.setCjAutoPay(v), v ? "New orders will be paid from your CJ balance." : "New orders will wait for you to pay in CJ.")} />
          </View>
          <Button label="Disconnect CJ" variant="ghost" loading={busy === "off"} onPress={() => apply("off", api.disconnectCj, "CJ disconnected. New orders won’t be sent to CJ.")} />
        </>
      ) : (
        <>
          <Body muted>Connect your own free CJ account so orders for CJ products go straight to CJ, and CJ ships them to your buyers. You pay CJ the product and shipping cost; you keep the rest.</Body>
          <Text style={[type.small, { color: c.ink }]}>
            In CJ, open My CJ, then Authorization, then API, and generate an API key. Copy it and paste it here.
          </Text>
          <Button label="Open CJdropshipping" variant="ghost" onPress={() => WebBrowser.openBrowserAsync("https://cjdropshipping.com/")} />
          <Field label="CJ API key" value={key} onChangeText={setKey} autoCapitalize="none" autoCorrect={false} secureTextEntry placeholder="Paste your API key" />
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
            <Text style={[type.small, { color: c.ink, flex: 1 }]}>Pay CJ automatically from my CJ wallet balance</Text>
            <Switch value={autoPay} onValueChange={setAutoPay} accessibilityLabel="Pay CJ automatically from my CJ wallet balance" trackColor={{ true: c.accent, false: c.line }} />
          </View>
          <Button label="Connect CJ" loading={busy === "on"} disabled={key.trim().length < 10} onPress={() => apply("on", () => api.connectCj(key.trim(), autoPay), "CJ connected. Orders for CJ products will be sent there.")} />
        </>
      )}
      <Notice text={msg?.text ?? null} tone={msg?.tone} />
    </View>
  );
}

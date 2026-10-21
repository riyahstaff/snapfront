import React, { useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { Body, Button, Field, H2, Notice } from "@/components/ui";
import { api, ApiError, type SupplierConnectInput, type SupplierId, type SupplierState } from "@/lib/api";
import { account, useMe } from "@/lib/account-store";
import { radius, space, type, useColors } from "@/lib/theme";

type Msg = { text: string; tone: "error" | "ok" | "info" } | null;

const INFO: Record<SupplierId, { what: string; time: string; payLabel: string; payOn: string; payOff: string; site: string; siteLabel: string }> = {
  cj: {
    what: "Wholesale products shipped from CJ’s warehouses.",
    time: "Takes about 2 minutes.",
    payLabel: "Pay CJ automatically", payOn: "Orders are paid from your CJ wallet, so they ship right away. Keep money in your CJ wallet.",
    payOff: "Orders wait in CJ until you pay for them there (My CJ, then Orders).",
    site: "https://cjdropshipping.com/", siteLabel: "Open CJdropshipping",
  },
  printful: {
    what: "Your own designs on shirts, mugs, posters and more, printed and shipped by Printful.",
    time: "Takes about 10 minutes, plus the time to design your products in Printful.",
    payLabel: "Send orders to Printful automatically", payOn: "Orders are confirmed in Printful straight away and charged to the card on your Printful account.",
    payOff: "Orders arrive in Printful as drafts. Confirm them in Printful (Orders) so they’re printed.",
    site: "https://developers.printful.com/", siteLabel: "Open Printful’s Developer Portal",
  },
  aliexpress: {
    what: "Products from AliExpress sellers, ordered through your own AliExpress account.",
    time: "Takes a few days: AliExpress reviews new developer accounts and apps before you get your App Key, usually within 2 to 5 working days.",
    payLabel: "Pay AliExpress automatically", payOn: "Snapfront tries to pay each order with your saved AliExpress payment method.",
    payOff: "Orders wait in your AliExpress account until you pay for them there (My Orders).",
    site: "https://openservice.aliexpress.com/", siteLabel: "Open AliExpress Open Platform",
  },
};

/** Suppliers the seller connects with their own account. Orders for those products go to that account. */
export function SupplierSection() {
  const me = useMe();
  if (!me?.account.suppliers) return null;
  const s = me.account.suppliers;
  return (
    <View style={{ gap: space.md }}>
      <H2>Suppliers</H2>
      <Body muted>Connect your own supplier accounts. You find products in the Find tab, and when a buyer orders, Snapfront places the order in your supplier account so they ship it to your buyer. You pay the supplier; you keep the rest.</Body>
      {(["cj", "printful", "aliexpress"] as const).map((id) => <SupplierCard key={id} id={id} state={s[id]} />)}
    </View>
  );
}

export function SupplierCard({ id, state, startOpen = false }: { id: SupplierId; state: SupplierState; startOpen?: boolean }) {
  const c = useColors();
  const info = INFO[id];
  const [open, setOpen] = useState(startOpen);
  const [fields, setFields] = useState<SupplierConnectInput>({});
  const [autoPay, setAutoPay] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<Msg>(null);
  const set = (k: keyof SupplierConnectInput) => (v: string) => setFields((f) => ({ ...f, [k]: v }));

  async function run(label: string, fn: () => Promise<string | null>) {
    setBusy(label); setMsg(null);
    try { const ok = await fn(); await account.refresh(); if (ok) setMsg({ text: ok, tone: "ok" }); }
    catch (e) { setMsg({ text: e instanceof ApiError ? e.message : `Couldn’t update ${state.name}.`, tone: "error" }); }
    finally { setBusy(null); }
  }

  async function authorize(url?: string) {
    const target = url || (await api.supplierAuthorizeUrl(id)).url;
    await WebBrowser.openAuthSessionAsync(target, "snapfront://settings");
    const next = await account.refresh();
    return next.account.suppliers[id].connected ? `${state.name} is connected.` : "Not connected yet. Tap Authorize and approve Snapfront on AliExpress.";
  }

  const connect = () => run("connect", async () => {
    const r = await api.connectSupplier(id, { ...fields, auto_pay: autoPay });
    setFields({});
    if (r.authorize_url) return authorize(r.authorize_url);
    setOpen(false);
    return `${state.name} connected.`;
  });

  const status = state.connected ? (state.store_name || state.account_name ? `Connected: ${state.store_name || state.account_name}` : "Connected")
    : state.pending_authorization ? "Waiting for you to approve on AliExpress" : "Not connected";
  const canSubmit = id === "cj" ? (fields.api_key || "").trim().length >= 10
    : id === "printful" ? (fields.token || "").trim().length >= 20
    : (fields.app_key || "").trim().length >= 5 && (fields.app_secret || "").trim().length >= 16;

  return (
    <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, padding: space.md, gap: space.md }}>
      <Pressable onPress={() => setOpen((o) => !o)} accessibilityRole="button" accessibilityState={{ expanded: open }}
        style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[type.heading, { color: c.ink }]}>{state.name}</Text>
          <Text style={[type.small, { color: state.connected ? c.good : c.muted }]}>{status}</Text>
        </View>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={c.muted} />
      </Pressable>

      {open ? (
        <View style={{ gap: space.md }}>
          <Text style={[type.small, { color: c.muted }]}>{info.what}{state.connected ? "" : ` ${info.time}`}</Text>
          {state.connected ? (
            <>
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[type.label, { color: c.ink }]}>{info.payLabel}</Text>
                  <Text style={[type.small, { color: c.muted }]}>{state.auto_pay ? info.payOn : info.payOff}</Text>
                </View>
                <Switch value={state.auto_pay} disabled={Boolean(busy)} accessibilityLabel={info.payLabel} trackColor={{ true: c.accent, false: c.line }}
                  onValueChange={(v) => run("auto", async () => { await api.setSupplierAutoPay(id, v); return null; })} />
              </View>
              <Button label={`Disconnect ${state.name}`} variant="ghost" loading={busy === "off"}
                onPress={() => run("off", async () => { await api.disconnectSupplier(id); return `${state.name} disconnected. New orders won’t be sent there.`; })} />
            </>
          ) : (
            <>
              <Steps id={id} callbackUrl={state.callback_url} />
              <Button label={info.siteLabel} variant="ghost" onPress={() => WebBrowser.openBrowserAsync(info.site)} />
              {state.pending_authorization ? (
                <Button label="Authorize on AliExpress" loading={busy === "auth"} onPress={() => run("auth", () => authorize())} />
              ) : null}
              {id === "cj" ? <Field label="CJ API key" value={fields.api_key || ""} onChangeText={set("api_key")} autoCapitalize="none" autoCorrect={false} secureTextEntry placeholder="Paste your API key" /> : null}
              {id === "printful" ? <Field label="Printful private token" value={fields.token || ""} onChangeText={set("token")} autoCapitalize="none" autoCorrect={false} secureTextEntry placeholder="Paste your token" /> : null}
              {id === "aliexpress" ? (
                <>
                  <Field label="App Key" value={fields.app_key || ""} onChangeText={set("app_key")} keyboardType="number-pad" placeholder="e.g. 512345" />
                  <Field label="App Secret" value={fields.app_secret || ""} onChangeText={set("app_secret")} autoCapitalize="none" autoCorrect={false} secureTextEntry placeholder="Paste your App Secret" />
                </>
              ) : null}
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
                <Text style={[type.small, { color: c.ink, flex: 1 }]}>{info.payLabel}</Text>
                <Switch value={autoPay} onValueChange={setAutoPay} accessibilityLabel={info.payLabel} trackColor={{ true: c.accent, false: c.line }} />
              </View>
              <Button label={id === "aliexpress" ? (state.pending_authorization ? "Save new details and authorize" : "Save and authorize") : `Connect ${state.name}`}
                loading={busy === "connect"} disabled={!canSubmit} onPress={connect} />
            </>
          )}
          <Notice text={msg?.text ?? null} tone={msg?.tone} />
        </View>
      ) : null}
    </View>
  );
}

function Steps({ id, callbackUrl }: { id: SupplierId; callbackUrl?: string }) {
  const c = useColors();
  const [copied, setCopied] = useState(false);
  const steps = id === "cj" ? [
    "Sign in to CJdropshipping, or create a free account.",
    "Open My CJ, then Authorization, then API.",
    "Generate an API key, copy it and paste it below. Then tap Connect CJdropshipping.",
  ] : id === "printful" ? [
    "Sign in to Printful, or create a free account at printful.com.",
    "Add a store for Snapfront: open Stores, choose Add store, then pick “Manual order platform / API”. Skip this if you already have one.",
    "Add your designs to that store as products (in the store, choose Add product). Only products in this store show up in Find.",
    "Open Printful’s Developer Portal (button below), sign in with your Printful login and open Your tokens. Create a private token.",
    "Give the token access to the store from step 2 and turn on the Orders and Sync products permissions (read and write). Pick an expiry date: when it expires, make a new token and paste it here again.",
    "Copy the token straight away (Printful only shows it once), paste it below and tap Connect Printful.",
  ] : [
    "Use an AliExpress account with your shipping details and a payment method saved. Snapfront places each order in this account.",
    "Open the AliExpress Open Platform (button below), sign in with that AliExpress account and register as a developer. AliExpress reviews this first, usually in 2 to 5 working days.",
    "Once you’re approved, open the App Console, choose Create app and pick the Dropshipping app type. Add a name (like “My Snapfront store”), a short description and a logo.",
    "In the app’s settings, set the Callback URL to the address below (tap it to copy). If AliExpress reviews the app too, wait until it’s approved.",
    "Copy the app’s App Key and App Secret, paste them below and tap Save and authorize.",
    "An AliExpress page opens: sign in with the same account and approve Snapfront. Then go to Find, choose AliExpress and paste any product link to add it to your store.",
  ];
  return (
    <View style={{ gap: 6 }}>
      {steps.map((t, i) => (
        <View key={t} style={{ flexDirection: "row", gap: space.sm }}>
          <Text style={[type.label, { color: c.accent, width: 16 }]}>{i + 1}</Text>
          <Text style={[type.small, { color: c.ink, flex: 1 }]}>{t}</Text>
        </View>
      ))}
      {id === "aliexpress" && callbackUrl ? (
        <Pressable onPress={async () => { await Clipboard.setStringAsync(callbackUrl); setCopied(true); }} accessibilityRole="button" accessibilityLabel="Copy callback URL"
          style={{ flexDirection: "row", alignItems: "center", gap: space.sm, backgroundColor: c.sunk, borderRadius: radius.md, padding: space.md, marginTop: 4 }}>
          <Text selectable style={[type.small, { color: c.ink, flex: 1 }]}>{callbackUrl}</Text>
          <Ionicons name={copied ? "checkmark" : "copy-outline"} size={18} color={copied ? c.good : c.accent} />
        </Pressable>
      ) : null}
    </View>
  );
}

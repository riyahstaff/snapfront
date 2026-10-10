import React, { useEffect, useState } from "react";
import { View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { router } from "expo-router";
import { Body, Button, Field, H2, Notice, Screen } from "@/components/ui";
import { api, ApiError, type Seller } from "@/lib/api";
import { space } from "@/lib/theme";

export default function SettingsScreen() {
  const [seller, setSeller] = useState<Seller | null>(null);
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [msg, setMsg] = useState<{ text: string; tone: "error" | "ok" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    api.me().then((s) => { setSeller(s); setName(s.store_name); setTagline(s.tagline); })
      .catch((e) => setMsg({ text: e instanceof ApiError ? e.message : "Couldn't load settings.", tone: "error" }));
  }, []);

  async function save() {
    setSaving(true); setMsg(null);
    try { const s = await api.updateStore({ store_name: name, tagline }); setSeller(s); setMsg({ text: "Store details saved.", tone: "ok" }); }
    catch (e) { setMsg({ text: e instanceof ApiError ? e.message : "Couldn't save.", tone: "error" }); }
    finally { setSaving(false); }
  }

  async function stripe() {
    try {
      const { url } = seller?.stripe_ready ? await api.stripeDashboard() : await api.stripeOnboard();
      await WebBrowser.openBrowserAsync(url);
    } catch (e) { setMsg({ text: e instanceof ApiError ? e.message : "Couldn't open Stripe.", tone: "error" }); }
  }

  return (
    <Screen>
      <H2>Your store</H2>
      <Field label="Store name" value={name} onChangeText={setName} />
      <Field label="Tagline" hint="One line under your store name." value={tagline} onChangeText={setTagline} />
      <Button label="Save store details" onPress={save} loading={saving} />
      <Notice text={msg?.text ?? null} tone={msg?.tone} />
      <View style={{ gap: space.sm, marginTop: space.lg }}>
        <H2>Payments</H2>
        <Body muted>{seller?.stripe_ready ? "Stripe is connected. Open your dashboard to see sales and payouts." : "Connect Stripe so buyers can pay you. Money goes straight to your account."}</Body>
        <Button label={seller?.stripe_ready ? "Open Stripe dashboard" : "Connect Stripe"} variant={seller?.stripe_ready ? "secondary" : "primary"} onPress={stripe} />
      </View>
      <View style={{ gap: space.sm, marginTop: space.lg }}>
        <H2>About</H2>
        <Button label="Privacy policy" variant="ghost" onPress={() => WebBrowser.openBrowserAsync(api.legalUrl("privacy"))} />
        <Button label="Terms of use" variant="ghost" onPress={() => WebBrowser.openBrowserAsync(api.legalUrl("terms"))} />
        {confirm ? (
          <>
            <Body>This deletes your store, products and photos for good. Your Stripe account and past payouts aren't affected.</Body>
            <Button label="Delete my store" variant="danger" onPress={async () => {
              try { await api.deleteAccount(); router.replace("/"); }
              catch (e) { setMsg({ text: e instanceof ApiError ? e.message : "Couldn't delete your store.", tone: "error" }); }
            }} />
            <Button label="Keep my store" variant="ghost" onPress={() => setConfirm(false)} />
          </>
        ) : <Button label="Delete my store" variant="danger" onPress={() => setConfirm(true)} />}
      </View>
    </Screen>
  );
}

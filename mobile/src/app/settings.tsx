import React, { useEffect, useState } from "react";
import { Switch, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { router } from "expo-router";
import { Body, Button, Field, H2, Notice, Screen } from "@/components/ui";
import { api, ApiError, type Me } from "@/lib/api";
import { account } from "@/lib/account-store";
import { AccountSection } from "@/components/account-section";
import { displayAddress } from "@/lib/store-address";
import { SupplierSection } from "@/components/supplier-section";
import { DomainSection } from "@/components/domain-section";
import { space, type, useColors } from "@/lib/theme";

export default function SettingsScreen() {
  const [seller, setSellerState] = useState<Me | null>(null);
  const setSeller = (s: Me) => { setSellerState(s); account.set(s); };
  const [confirmStore, setConfirmStore] = useState(false);
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [address, setAddress] = useState("");
  const [msg, setMsg] = useState<{ text: string; tone: "error" | "ok" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [shipFlat, setShipFlat] = useState("");
  const [freeOver, setFreeOver] = useState("");
  const [countries, setCountries] = useState("");
  const [tax, setTax] = useState(false);
  const [shipMsg, setShipMsg] = useState<{ text: string; tone: "error" | "ok" } | null>(null);
  const [savingShip, setSavingShip] = useState(false);
  const c = useColors();
  const [taxInfo, setTaxInfo] = useState<{ active: boolean; registrations: string[] } | null>(null);

  useEffect(() => {
    api.me().then((s) => {
      setSeller(s); setName(s.store_name); setTagline(s.tagline); setAddress(s.store_slug);
      setShipFlat(s.shipping_flat ? s.shipping_flat.toFixed(2) : ""); setFreeOver(s.free_shipping_over == null ? "" : String(s.free_shipping_over));
      setCountries(s.ship_countries.join(", ")); setTax(s.tax_enabled);
      if (s.stripe_connected) api.taxStatus().then(setTaxInfo).catch(() => {});
    })
      .catch((e) => setMsg({ text: e instanceof ApiError ? e.message : "Couldn't load settings.", tone: "error" }));
  }, []);

  async function save() {
    setSaving(true); setMsg(null);
    try {
      const slug = address.trim();
      const s = await api.updateStore({ store_name: name, tagline, ...(slug && slug !== seller?.store_slug ? { store_slug: slug } : {}) });
      setSeller(s); setAddress(s.store_slug);
      setMsg({ text: s.store_slug !== seller?.store_slug ? `Saved. Your store is now at ${displayAddress(s)}. Old links still work.` : "Store details saved.", tone: "ok" });
    }
    catch (e) { setMsg({ text: e instanceof ApiError ? e.message : "Couldn't save.", tone: "error" }); }
    finally { setSaving(false); }
  }

  async function saveShipping() {
    setSavingShip(true); setShipMsg(null);
    try {
      const s = await api.updateStore({
        shipping_flat: Number(shipFlat.replace(/[^0-9.]/g, "")) || 0,
        free_shipping_over: freeOver.trim() ? Number(freeOver.replace(/[^0-9.]/g, "")) : null,
        ship_countries: countries.split(/[\s,]+/).filter(Boolean), tax_enabled: tax,
      });
      setSeller(s); setCountries(s.ship_countries.join(", "));
      setShipMsg({ text: "Checkout settings saved.", tone: "ok" });
    } catch (e) { setShipMsg({ text: e instanceof ApiError ? e.message : "Couldn't save.", tone: "error" }); }
    finally { setSavingShip(false); }
  }

  async function setupTax() {
    setShipMsg(null);
    try {
      const { url } = await api.taxSetup();
      await WebBrowser.openBrowserAsync(url);
      setTaxInfo(await api.taxStatus());
    } catch (e) { setShipMsg({ text: e instanceof ApiError ? e.message : "Couldn't open tax setup.", tone: "error" }); }
  }

  async function stripe() {
    try {
      const { url } = seller?.stripe_ready ? await api.stripeDashboard() : await api.stripeOnboard();
      await WebBrowser.openBrowserAsync(url);
    } catch (e) { setMsg({ text: e instanceof ApiError ? e.message : "Couldn't open Stripe.", tone: "error" }); }
  }

  return (
    <Screen>
      <AccountSection />
      <View style={{ height: space.md }} />
      <H2>{seller && seller.account.stores.length > 1 ? `This store: ${seller.store_name}` : "Your store"}</H2>
      <Field label="Store name" value={name} onChangeText={setName} />
      <Field label="Tagline" hint="One line under your store name." value={tagline} onChangeText={setTagline} />
      <Field label="Store address" value={address} onChangeText={setAddress} autoCapitalize="none" autoCorrect={false} keyboardType="url"
        hint={seller ? `Your store’s link: ${seller.store_domain ? `${address.trim() || seller.store_slug}.${seller.store_domain}` : displayAddress(seller)}. Letters, numbers and dashes.` : undefined} />
      <Button label="Save store details" onPress={save} loading={saving} />
      <Notice text={msg?.text ?? null} tone={msg?.tone} />
      <View style={{ marginTop: space.lg }}>
        <DomainSection />
      </View>
      <View style={{ gap: space.md, marginTop: space.lg }}>
        <H2>Shipping and tax</H2>
        <Body muted>Shipping is charged once per order that has a physical item. Digital-only orders never pay shipping.</Body>
        <View style={{ flexDirection: "row", gap: space.md }}>
          <View style={{ flex: 1 }}><Field label="Flat shipping ($)" value={shipFlat} onChangeText={setShipFlat} keyboardType="decimal-pad" placeholder="0.00 = free" /></View>
          <View style={{ flex: 1 }}><Field label="Free over ($)" value={freeOver} onChangeText={setFreeOver} keyboardType="decimal-pad" placeholder="Off" /></View>
        </View>
        <Field label="Ships to" hint="Two-letter country codes, separated by commas." value={countries} onChangeText={setCountries} autoCapitalize="characters" autoCorrect={false} placeholder="US, CA" />
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[type.label, { color: c.ink }]}>Collect sales tax automatically</Text>
            <Text style={[type.small, { color: c.muted }]}>
              {taxInfo?.active && taxInfo.registrations.length
                ? `Stripe adds the right tax at checkout. Collecting in: ${taxInfo.registrations.join(", ")}.`
                : "Stripe works out and adds the right tax at checkout. First add your business address and where you’re registered to collect tax."}
            </Text>
          </View>
          <Switch value={tax} onValueChange={setTax} accessibilityLabel="Collect sales tax automatically" trackColor={{ true: c.accent, false: c.line }} />
        </View>
        {seller?.stripe_connected ? (
          <Button label={taxInfo?.active && taxInfo.registrations.length ? "Edit tax registrations" : "Set up sales tax"} variant="ghost" onPress={setupTax} />
        ) : null}
        <Button label="Save checkout settings" variant="secondary" loading={savingShip} onPress={saveShipping} />
        <Notice text={shipMsg?.text ?? null} tone={shipMsg?.tone} />
      </View>
      <View style={{ gap: space.sm, marginTop: space.lg }}>
        <H2>Payments</H2>
        {seller && seller.account.plan === "free" && !seller.stripe_connected ? (
          <>
            <Body muted>Taking payments comes with Launch ($29, one time). Once you have it, you connect Stripe here and buyers pay straight into your account.</Body>
            <Button label="See plans" variant="secondary" onPress={() => router.push("/plans")} />
          </>
        ) : (
          <>
            <Body muted>{seller?.stripe_ready ? "Stripe is connected. Open your dashboard to see sales and payouts." : "Connect Stripe so buyers can pay you. Money goes straight to your account."}</Body>
            <Button label={seller?.stripe_ready ? "Open Stripe dashboard" : "Connect Stripe"} variant={seller?.stripe_ready ? "secondary" : "primary"} onPress={stripe} />
          </>
        )}
      </View>
      <View style={{ marginTop: space.lg }}>
        <SupplierSection />
      </View>
      <View style={{ gap: space.sm, marginTop: space.lg }}>
        <H2>About</H2>
        <Button label="Privacy policy" variant="ghost" onPress={() => WebBrowser.openBrowserAsync(api.legalUrl("privacy"))} />
        <Button label="Terms of use" variant="ghost" onPress={() => WebBrowser.openBrowserAsync(api.legalUrl("terms"))} />
        {confirm ? (
          <>
            <Body>This deletes your account and every store, product and photo on it, for good. Your Stripe account and past payouts aren’t affected. A Pro subscription keeps renewing until you cancel it in Google Play.</Body>
            <Button label="Delete my account" variant="danger" onPress={async () => {
              try { await api.deleteAccount(); account.clear(); router.replace("/"); }
              catch (e) { setMsg({ text: e instanceof ApiError ? e.message : "Couldn't delete your store.", tone: "error" }); }
            }} />
            <Button label="Keep my account" variant="ghost" onPress={() => setConfirm(false)} />
          </>
        ) : <Button label="Delete my account" variant="danger" onPress={() => setConfirm(true)} />}
        {seller && seller.account.stores.length > 1 ? (confirmStore ? (
          <>
            <Body>Delete {seller.store_name} and its products? Your other stores aren’t affected.</Body>
            <Button label={`Delete ${seller.store_name}`} variant="danger" onPress={async () => {
              try { await api.deleteStore(seller.id); await account.refresh(); router.back(); }
              catch (e) { setMsg({ text: e instanceof ApiError ? e.message : "Couldn't delete the store.", tone: "error" }); }
            }} />
            <Button label="Keep it" variant="ghost" onPress={() => setConfirmStore(false)} />
          </>
        ) : <Button label="Delete this store only" variant="ghost" onPress={() => setConfirmStore(true)} />) : null}
      </View>
    </Screen>
  );
}

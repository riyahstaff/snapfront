import React, { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Body, Button, Field, Notice, Screen } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { account, useMe } from "@/lib/account-store";
import { DEFAULT_STORE_NAME, NAMED_KEY, slugPreview } from "@/lib/store-address";
import { fonts, radius, space, type, useColors } from "@/lib/theme";

/** First launch: name the store, which also gives it its web address. */
export default function WelcomeScreen() {
  const c = useColors();
  const me = useMe();
  const [name, setName] = useState(me && me.store_name !== DEFAULT_STORE_NAME ? me.store_name : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const slug = slugPreview(name);
  const domain = me?.store_domain;
  const preview = slug.length >= 3 ? (domain ? `${slug}.${domain}` : `…/s/${slug}`) : null;

  async function done() {
    await SecureStore.setItemAsync(NAMED_KEY, "1").catch(() => {});
    router.back();
  }

  async function save() {
    setBusy(true); setError(null);
    try {
      account.set(await api.updateStore({ store_name: name.trim() }));
      await done();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't save the name. Try again.");
    } finally { setBusy(false); }
  }

  return (
    <Screen>
      <View style={{ gap: space.sm, marginTop: space.lg }}>
        <Text accessibilityRole="header" style={[type.hero, { color: c.ink }]}>What’s your{"\n"}store called?</Text>
        <Body muted>Buyers see this name on every page. You can change it any time in Store settings.</Body>
      </View>
      <Field label="Store name" value={name} onChangeText={setName} placeholder="e.g. Paw Place" autoFocus maxLength={80} returnKeyType="done" onSubmitEditing={() => name.trim().length >= 2 && save()} />
      {preview ? (
        <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.md, padding: space.md, gap: 2 }}>
          <Text style={[type.small, { color: c.muted }]}>Your store’s address</Text>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 17, color: c.ink }} numberOfLines={1} adjustsFontSizeToFit>{preview}</Text>
          <Text style={[type.small, { color: c.muted }]}>If someone already has it, we’ll add a number. You can pick a different address later.</Text>
        </View>
      ) : null}
      <Notice text={error} tone="error" />
      <Button label="Save name" loading={busy} disabled={name.trim().length < 2} onPress={save} />
      <Button label="Later" variant="ghost" onPress={done} />
    </Screen>
  );
}

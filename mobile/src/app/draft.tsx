import React, { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Body, Button, Field, H2, Notice, Pill, Screen } from "@/components/ui";
import { ProductPreview } from "@/components/product-preview";
import { api, ApiError } from "@/lib/api";
import { draftStore, useDraft } from "@/lib/draft-store";
import { space } from "@/lib/theme";

export default function DraftScreen() {
  const d = useDraft();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!d) {
    return (
      <Screen>
        <H2>No draft yet</H2>
        <Body muted>Snap a product photo first and your page will appear here.</Body>
        <Button label="Snap a product" onPress={() => router.replace("/")} />
      </Screen>
    );
  }

  async function save() {
    if (!d) return;
    if (d.kind === "digital" && d.delivery_url && !/^https:\/\//.test(d.delivery_url)) {
      setError("The download link must start with https://"); return;
    }
    setSaving(true); setError(null);
    try {
      const { localUri: _ignored, ...draft } = d;
      const p = await api.createProduct(draft);
      draftStore.set(null);
      router.replace({ pathname: "/product/[id]", params: { id: p.id } });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't save. Try again.");
    } finally { setSaving(false); }
  }

  return (
    <Screen>
      <ProductPreview product={d} imageUri={d.localUri || d.image_url} badge={<Pill text="Draft" tone="flash" />} />
      <View style={{ gap: space.md }}>
        <H2>Fine-tune it</H2>
        <Field label="Title" value={d.title} onChangeText={(title) => draftStore.patch({ title })} />
        <Field label="Tagline" value={d.tagline} onChangeText={(tagline) => draftStore.patch({ tagline })} />
        <Field label="Price (USD)" value={String(d.price)} keyboardType="decimal-pad" onChangeText={(v) => draftStore.patch({ price: Number(v.replace(/[^0-9.]/g, "")) || 0 })} />
        <Field label="Description" value={d.description} multiline onChangeText={(description) => draftStore.patch({ description })} />
        {d.kind === "digital" ? (
          <Field label="Download link" hint="Where buyers get the file after paying, e.g. a Google Drive or Dropbox share link." value={d.delivery_url ?? ""}
            onChangeText={(delivery_url) => draftStore.patch({ delivery_url })} autoCapitalize="none" keyboardType="url" placeholder="https://" />
        ) : null}
      </View>
      <Notice text={error} tone="error" />
      <Button label="Save to my store" onPress={save} loading={saving} />
    </Screen>
  );
}

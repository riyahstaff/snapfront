import React, { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Body, Button, Field, H2, Notice, Pill, Screen } from "@/components/ui";
import { ProductPreview } from "@/components/product-preview";
import { api, ApiError } from "@/lib/api";
import { draftStore, useDraft } from "@/lib/draft-store";
import { space, useColors } from "@/lib/theme";
import { Ionicons } from "@expo/vector-icons";

export default function DraftScreen() {
  const c = useColors();
  const d = useDraft();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!d) {
    return (
      <Screen>
        <H2>No draft yet</H2>
        <Body muted>Snap a product photo first and your page will appear here.</Body>
        <Button label="Snap a product" onPress={() => router.replace("/snap")} />
      </Screen>
    );
  }

  /** Save the product, then put it in the store. If something blocks going live, it stays a draft and the product screen says why. */
  async function save() {
    if (!d) return;
    if (d.kind === "digital" && d.delivery_url && !/^https:\/\//.test(d.delivery_url)) {
      setError("The download link must start with https://"); return;
    }
    setSaving(true); setError(null);
    let id: string | null = null;
    try {
      const { localUri: _ignored, ...draft } = d;
      id = (await api.createProduct(draft)).id;
      draftStore.set(null);
      let note = "It's live in your store. Share the link to start selling.";
      try { await api.publish(id); }
      catch (e) { note = `Saved as a draft. ${e instanceof ApiError ? e.message : "Open it again to publish."}`; }
      router.replace({ pathname: "/product/[id]", params: { id, note } });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't save. Try again.");
    } finally { setSaving(false); }
  }

  return (
    <Screen>
      <ProductPreview product={d} imageUri={d.localUri || d.image_url} badge={<Pill text="Not in your store yet" tone="flash" />} />
      {d.image_file ? (
        <Button label="Change the background" variant="secondary" icon={<Ionicons name="color-wand-outline" size={18} color={c.ink} />}
          onPress={() => router.push({ pathname: "/studio", params: { target: "draft", image_file: d.image_file!, image_url: d.image_url ?? "" } })} />
      ) : null}
      <View style={{ gap: space.md }}>
        <H2>Fine-tune it</H2>
        <Field label="Title" value={d.title} onChangeText={(title) => draftStore.patch({ title })} />
        <Field label="Tagline" value={d.tagline} onChangeText={(tagline) => draftStore.patch({ tagline })} />
        <Field label="Photo label" hint="Optional. A few words shown on the photo in your store, like New, Best seller or 20% off." value={d.label ?? ""} maxLength={24}
          onChangeText={(label) => draftStore.patch({ label })} placeholder="New" />
        <Field label="Price (USD)" value={String(d.price)} keyboardType="decimal-pad" onChangeText={(v) => draftStore.patch({ price: Number(v.replace(/[^0-9.]/g, "")) || 0 })} />
        <Field label="Description" value={d.description} multiline onChangeText={(description) => draftStore.patch({ description })} />
        {d.kind === "digital" ? (
          <Field label="Download link" hint="Where buyers get the file after paying, e.g. a Google Drive or Dropbox share link." value={d.delivery_url ?? ""}
            onChangeText={(delivery_url) => draftStore.patch({ delivery_url })} autoCapitalize="none" keyboardType="url" placeholder="https://" />
        ) : null}
      </View>
      <Notice text={error} tone="error" />
      <Button label="Add to my store" onPress={save} loading={saving} />
    </Screen>
  );
}

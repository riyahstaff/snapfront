import React, { useCallback, useState } from "react";
import { Share, View } from "react-native";
import { router, Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Clipboard from "expo-clipboard";
import { Body, Button, Field, H2, Notice, Pill, Screen } from "@/components/ui";
import { ProductPreview } from "@/components/product-preview";
import { api, ApiError, type Product } from "@/lib/api";
import { space } from "@/lib/theme";

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [p, setP] = useState<Product | null>(null);
  const [price, setPrice] = useState("");
  const [msg, setMsg] = useState<{ text: string; tone: "error" | "ok" | "info" } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(() => {
    api.product(id).then((x) => { setP(x); setPrice(String(x.price)); }).catch((e) => setMsg({ text: e instanceof ApiError ? e.message : "Couldn't load this product.", tone: "error" }));
  }, [id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function run(label: string, fn: () => Promise<void>) {
    setBusy(label); setMsg(null);
    try { await fn(); } catch (e) { setMsg({ text: e instanceof ApiError ? e.message : "Something went wrong. Try again.", tone: "error" }); }
    finally { setBusy(null); }
  }

  if (!p) return <Screen><Notice text={msg?.text ?? "Loading…"} tone={msg?.tone ?? "info"} /></Screen>;

  const live = p.status === "live";
  return (
    <Screen>
      <Stack.Screen options={{ title: live ? "Live product" : "Draft product" }} />
      <ProductPreview product={p} imageUri={p.image_url} badge={<Pill text={live ? "Live · taking orders" : "Draft · not visible yet"} tone={live ? "good" : "flash"} />} />
      {live ? (
        <View style={{ gap: space.sm }}>
          <Button label="Share product link" onPress={() => p.page_url && Share.share({ message: `${p.title} ${p.page_url}`, url: p.page_url })} />
          <Button label="Open product page" variant="secondary" onPress={() => p.page_url && WebBrowser.openBrowserAsync(p.page_url)} />
          <Button label="Copy checkout link" variant="ghost" onPress={async () => { if (p.payment_link_url) { await Clipboard.setStringAsync(p.payment_link_url); setMsg({ text: "Checkout link copied.", tone: "ok" }); } }} />
        </View>
      ) : (
        <View style={{ gap: space.sm }}>
          <Body muted>Publishing creates the product and a secure checkout in your Stripe account, then puts it in your storefront.</Body>
          <Button label="Publish and start selling" loading={busy === "publish"} onPress={() => run("publish", async () => {
            const next = await api.publish(p.id); setP(next); setMsg({ text: "Published. Share the link to start selling.", tone: "ok" });
          })} />
          {p.page_url ? <Button label="Preview page" variant="secondary" onPress={() => WebBrowser.openBrowserAsync(`${p.page_url}?preview=1`)} /> : null}
        </View>
      )}
      <Notice text={msg?.text ?? null} tone={msg?.tone} />
      <View style={{ gap: space.md }}>
        <H2>Price</H2>
        <Field label="Price (USD)" hint={live ? "Changing the price unpublishes the product until you publish again." : undefined} value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
        <Button label="Save price" variant="secondary" loading={busy === "price"} onPress={() => run("price", async () => {
          const next = await api.updateProduct(p.id, { price: Number(price) || 0 }); setP({ ...p, ...next }); setMsg({ text: "Price saved.", tone: "ok" });
        })} />
      </View>
      {confirmDelete ? (
        <View style={{ gap: space.sm }}>
          <Body>Delete this product and its page? Buyers with a download link keep access until it expires.</Body>
          <Button label="Delete product" variant="danger" loading={busy === "delete"} onPress={() => run("delete", async () => { await api.deleteProduct(p.id); router.back(); })} />
          <Button label="Keep it" variant="ghost" onPress={() => setConfirmDelete(false)} />
        </View>
      ) : (
        <Button label="Delete product" variant="danger" onPress={() => setConfirmDelete(true)} />
      )}
    </Screen>
  );
}

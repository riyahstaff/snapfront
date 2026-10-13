import React, { useCallback, useState } from "react";
import { Share, View } from "react-native";
import { router, Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Clipboard from "expo-clipboard";
import { StockEditor } from "@/components/stock-editor";
import { Body, Button, Field, H2, Notice, Pill, Screen } from "@/components/ui";
import { ProductPreview } from "@/components/product-preview";
import { api, ApiError, money, type Product } from "@/lib/api";
import { space, useColors } from "@/lib/theme";
import { account, useMe } from "@/lib/account-store";
import { Ionicons } from "@expo/vector-icons";

export default function ProductScreen() {
  const c = useColors();
  const me = useMe();
  const { id, note } = useLocalSearchParams<{ id: string; note?: string }>();
  const [p, setP] = useState<Product | null>(null);
  const [price, setPrice] = useState("");
  const [words, setWords] = useState({ title: "", tagline: "", label: "", category: "", description: "" });
  const [msg, setMsg] = useState<{ text: string; tone: "error" | "ok" | "info" } | null>(note ? { text: note, tone: /^Saved as a draft/.test(note) ? "info" : "ok" } : null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(() => {
    api.product(id).then((x) => {
      setP(x); setPrice(String(x.price));
      setWords({ title: x.title, tagline: x.tagline, label: x.label ?? "", category: x.category, description: x.description });
    }).catch((e) => setMsg({ text: e instanceof ApiError ? e.message : "Couldn't load this product.", tone: "error" }));
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
      <ProductPreview product={p} imageUri={p.image_url} badge={<Pill text={live ? (p.in_stock ? "Live · taking orders" : "Live · sold out") : "Draft · not visible yet"} tone={live ? (p.in_stock ? "good" : "neutral") : "flash"} />} />
      {live ? (
        <View style={{ gap: space.sm }}>
          <Button label="Share product link" onPress={() => p.page_url && Share.share({ message: `${p.title} ${p.page_url}`, url: p.page_url })} />
          <Button label="Open product page" variant="secondary" onPress={() => p.page_url && WebBrowser.openBrowserAsync(p.page_url)} />
          <Button label="Copy product link" variant="ghost" onPress={async () => { if (p.page_url) { await Clipboard.setStringAsync(p.page_url); setMsg({ text: "Product link copied.", tone: "ok" }); } }} />
        </View>
      ) : (
        <View style={{ gap: space.sm }}>
          {me?.account.plan === "free" ? (
            <>
              <Body muted>This product isn’t in your store yet. Putting products in your store comes with Launch ($29, one time), with no fees on your sales.</Body>
              <Button label="See plans" variant="flash" onPress={() => router.push({ pathname: "/plans", params: { highlight: "launch" } })} />
            </>
          ) : me && !me.stripe_ready ? (
            <>
              <Body muted>This product isn’t in your store yet. Connect Stripe first so buyers can pay you, then publish. It takes about five minutes.</Body>
              <Button label={me.stripe_connected ? "Finish Stripe setup" : "Connect Stripe"} variant="flash" loading={busy === "stripe"} onPress={() => run("stripe", async () => {
                const { url } = await api.stripeOnboard(); await WebBrowser.openBrowserAsync(url); await api.stripeStatus(); await account.refresh();
              })} />
            </>
          ) : (
            <Body muted>Publishing puts it in your storefront. Buyers add it to their cart and pay through Stripe, straight into your account.</Body>
          )}
          <Button label="Publish and start selling" loading={busy === "publish"} onPress={() => run("publish", async () => {
            const next = await api.publish(p.id); setP(next); setMsg({ text: "Published. Share the link to start selling.", tone: "ok" });
          })} />
          {p.page_url ? <Button label="Preview page" variant="secondary" onPress={() => WebBrowser.openBrowserAsync(`${p.page_url}?preview=1`)} /> : null}
        </View>
      )}
      <Notice text={msg?.text ?? null} tone={msg?.tone} />
      {p.kind === "digital" && me ? (
        <View style={{ gap: space.sm }}>
          <H2>Digital design</H2>
          <Body muted>Edit the original source pages when available. Previewing and exporting stay private until you explicitly attach a reviewed revision.</Body>
          <Button label="Design my digital product" variant="secondary" disabled={busy !== null} onPress={() => router.push({ pathname: "/digital-editor", params: { id: p.id, storeId: me.id } })} />
        </View>
      ) : null}
      <Button label="Continue customizing my storefront" variant="secondary" disabled={busy !== null}
        onPress={() => router.navigate("/storefront-setup")} />
      <Body muted>Your saved design opens again. See this item in the layout while you finish your photos and words. Draft items stay private until published.</Body>
      {p.image_file ? (
        <Button label="Change the background" variant="secondary" icon={<Ionicons name="color-wand-outline" size={18} color={c.ink} />}
          onPress={() => router.push({ pathname: "/studio", params: { target: p.id, image_file: p.image_file!, image_url: p.image_url ?? "" } })} />
      ) : null}
      <View style={{ gap: space.md }}>
        <H2>Words</H2>
        <Field label="Title" value={words.title} onChangeText={(title) => setWords({ ...words, title })} maxLength={120} />
        <Field label="Tagline" hint="One line under the title." value={words.tagline} onChangeText={(tagline) => setWords({ ...words, tagline })} maxLength={160} />
        <Field label="Photo label" hint="Optional. A few words shown on the photo in your store, like New, Best seller or 20% off." value={words.label} maxLength={24}
          onChangeText={(label) => setWords({ ...words, label })} placeholder="New" />
        <Field label="Category" hint="Groups products in your store menu, like Sneakers or Candles." value={words.category} onChangeText={(category) => setWords({ ...words, category })} maxLength={60} />
        <Field label="Description" value={words.description} onChangeText={(description) => setWords({ ...words, description })} multiline maxLength={3000} />
        <Button label="Save words" variant="secondary" loading={busy === "words"}
          disabled={!words.title.trim() || (words.title === p.title && words.tagline === p.tagline && words.label === (p.label ?? "") && words.category === p.category && words.description === p.description)}
          onPress={() => run("words", async () => {
            const next = await api.updateProduct(p.id, { ...words, title: words.title.trim() }); setP({ ...p, ...next }); setMsg({ text: live ? "Saved. Your store shows the new words now." : "Saved.", tone: "ok" });
          })} />
      </View>
      <View style={{ gap: space.md }}>
        <H2>Price</H2>
        {p.source === "cj" && p.cost != null ? (
          <Body muted>CJdropshipping ships this for you. You pay CJ {money(p.cost)}{p.variants.length ? " or more, depending on the option," : ""} plus shipping for each one sold.</Body>
        ) : null}
        {p.image_file ? (
          <Button label="Compare with Amazon and Walmart" variant="ghost" onPress={() => router.push({ pathname: "/price-check", params: { image_file: p.image_file!, preview: p.image_url ?? undefined } })} />
        ) : null}
        <Field label="Price (USD)" hint={live ? "New prices apply to your store right away." : undefined} value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
        <Button label="Save price" variant="secondary" loading={busy === "price"} onPress={() => run("price", async () => {
          const next = await api.updateProduct(p.id, { price: Number(price) || 0 }); setP({ ...p, ...next }); setMsg({ text: "Price saved.", tone: "ok" });
        })} />
      </View>
      <StockEditor product={p} onSaved={setP} />
      {live ? (
        <Button label="Take off sale" variant="secondary" loading={busy === "unpublish"} onPress={() => run("unpublish", async () => {
          const next = await api.updateProduct(p.id, { status: "draft" }); setP(next); setMsg({ text: "Taken off sale. It's a draft again.", tone: "ok" });
        })} />
      ) : null}
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

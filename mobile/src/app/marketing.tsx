import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import * as Clipboard from "expo-clipboard";
import { useVideoPlayer, VideoView } from "expo-video";
import { Ionicons } from "@expo/vector-icons";
import { Body, Button, Field, H2, Notice, Segmented } from "@/components/ui";
import { api, ApiError, type MarketingOptions, type PostCopy, type PostFormat, type PostKind, type Product, type RenderedPost } from "@/lib/api";
import { account, useMe } from "@/lib/account-store";
import { saveToPhone, shareFile } from "@/lib/media";
import { fonts, radius, space, type, useColors } from "@/lib/theme";

type Msg = { text: string; tone: "ok" | "error" | "info" } | null;
const errText = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);

/** Make an Instagram or TikTok post for a product: AI caption, then a graphic, carousel or Reel to save and post. */
export default function MarketingScreen() {
  const c = useColors();
  const me = useMe();
  const params = useLocalSearchParams<{ product_id?: string; image_url?: string }>();
  const [opts, setOpts] = useState<MarketingOptions | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [productId, setProductId] = useState<string | null>(params.product_id ?? null);
  const [platform, setPlatform] = useState<"instagram" | "tiktok">("instagram");
  const [offer, setOffer] = useState("");
  const [copy, setCopy] = useState<PostCopy | null>(null);
  const [kind, setKind] = useState<PostKind>("image");
  const [format, setFormat] = useState<PostFormat>("post");
  const [template, setTemplate] = useState("spotlight");
  const [result, setResult] = useState<RenderedPost | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<Msg>(null);

  useEffect(() => {
    api.marketing().then(setOpts).catch(() => {});
    api.products().then((list) => {
      const withPhoto = list.filter((p) => p.image_url);
      setProducts(withPhoto);
      setProductId((cur) => cur ?? withPhoto[0]?.id ?? null);
    }).catch((e) => setMsg({ text: errText(e, "Couldn’t load your products."), tone: "error" }));
  }, []);
  const product = products?.find((p) => p.id === productId) ?? null;

  async function write() {
    if (!product) return;
    setBusy("copy"); setMsg(null); setResult(null);
    try { setCopy(await api.postCopy({ product_id: product.id, platform, offer: offer.trim() || undefined })); account.refresh().catch(() => {}); }
    catch (e) { if (!(e instanceof ApiError && e.upgrade)) setMsg({ text: errText(e, "Couldn’t write the post."), tone: "error" }); }
    finally { setBusy(null); }
  }
  function ownWords() {
    if (!product) return;
    setCopy({ headline: product.title, subline: product.tagline, bullets: product.bullets.slice(0, 3), cta: "Shop now", caption: `${product.title}. ${product.tagline}\n\nLink in bio.`, hashtags: [], link: "" });
  }
  async function create() {
    if (!product || !copy) return;
    setBusy("render"); setMsg(null); setResult(null);
    try { setResult(await api.renderPost({ product_id: product.id, kind, template, format: kind === "reel" ? "story" : format, copy, offer: offer.trim() || undefined, image_url: params.image_url })); }
    catch (e) { setMsg({ text: errText(e, "Couldn’t make the post."), tone: "error" }); }
    finally { setBusy(null); }
  }
  async function save() {
    if (!result) return;
    setBusy("save");
    try {
      const ok = await saveToPhone(result.files.map((f) => f.url));
      setMsg(ok ? { text: result.kind === "reel" ? "Video saved to your phone." : result.files.length > 1 ? "Slides saved to your phone." : "Saved to your phone.", tone: "ok" } : { text: "Allow photo access in Settings to save posts.", tone: "error" });
    } catch { setMsg({ text: "Couldn’t save. Try again.", tone: "error" }); }
    finally { setBusy(null); }
  }
  const caption = copy ? `${copy.caption}${copy.hashtags.length ? `\n\n${copy.hashtags.map((h) => `#${h}`).join(" ")}` : ""}` : "";

  if (!products || !opts) return <View style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center" }}>{msg ? <Notice text={msg.text} tone="error" /> : <ActivityIndicator color={c.accent} />}</View>;
  if (!products.length) return (
    <View style={{ flex: 1, backgroundColor: c.bg, padding: space.lg, gap: space.md }}>
      <H2>Add a product first</H2>
      <Body muted>Posts are made from your product photos. Snap or add a product, then come back here.</Body>
      <Button label="Snap a product" onPress={() => router.navigate("/")} />
    </View>
  );
  const left = me ? Math.max(0, me.account.limits.post - me.account.usage.post) : null;
  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: space.lg, gap: space.xl, paddingBottom: space.xxl }} keyboardShouldPersistTaps="handled">
      <Step n={1} title="Pick a product">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
          {products.map((p) => (
            <Pressable key={p.id} onPress={() => { setProductId(p.id); setCopy(null); setResult(null); }} accessibilityRole="button" accessibilityState={{ selected: p.id === productId }} accessibilityLabel={p.title}
              style={{ width: 96, gap: 4 }}>
              <View style={{ width: 96, height: 96, borderRadius: radius.md, overflow: "hidden", borderWidth: 3, borderColor: p.id === productId ? c.accent : "transparent", backgroundColor: c.sunk }}>
                <Image source={{ uri: p.image_url! }} style={{ flex: 1 }} contentFit="cover" />
              </View>
              <Text numberOfLines={1} style={[type.small, { color: c.ink }]}>{p.title}</Text>
            </Pressable>
          ))}
        </ScrollView>
        {params.image_url ? <Text style={[type.small, { color: c.muted }]}>Using the photo you just made.</Text> : null}
      </Step>

      <Step n={2} title="Write the post">
        <Segmented value={platform} onChange={(v) => { setPlatform(v); setCopy(null); }} options={[{ value: "instagram", label: "Instagram" }, { value: "tiktok", label: "TikTok" }]} />
        <Field label="Offer (optional)" hint="Only if it’s real, like a discount code you’ve set up." value={offer} onChangeText={setOffer} placeholder="20% off with code GLOW20" maxLength={60} />
        {!copy ? (
          <>
            <Button label="Write it for me" icon={<Ionicons name="sparkles" size={18} color={c.onAccent} />} loading={busy === "copy"} disabled={!product} onPress={write} />
            <Button label="I’ll write my own" variant="ghost" onPress={ownWords} />
            {left != null ? <Text style={[type.small, { color: c.muted }]}>{left} AI posts left{me?.account.plan === "free" ? "" : " this month"}.</Text> : null}
          </>
        ) : (
          <>
            <Field label="Headline on the graphic" value={copy.headline} maxLength={40} onChangeText={(headline) => setCopy({ ...copy, headline })} />
            <Field label="Second line" value={copy.subline} maxLength={80} onChangeText={(subline) => setCopy({ ...copy, subline })} />
            <Field label="Button text" value={copy.cta} maxLength={22} onChangeText={(cta) => setCopy({ ...copy, cta })} />
            <Field label="Caption" value={caption} multiline onChangeText={(t) => { const [cap, ...rest] = t.split(/\n\n(?=#)/); setCopy({ ...copy, caption: cap, hashtags: rest.join(" ").split(/\s+/).map((h) => h.replace(/^#/, "")).filter(Boolean) }); }} />
            <Button label="Rewrite with AI" variant="ghost" loading={busy === "copy"} onPress={write} />
          </>
        )}
      </Step>

      {copy ? (
        <Step n={3} title="Choose the look">
          <Segmented value={kind} onChange={(v) => { setKind(v); setResult(null); }} options={[{ value: "image", label: "Post" }, { value: "carousel", label: "Carousel" }, { value: "reel", label: "Reel" }]} />
          {kind !== "reel" ? (
            <Segmented value={format} onChange={(v) => { setFormat(v); setResult(null); }} options={[{ value: "post", label: "Portrait" }, { value: "square", label: "Square" }, { value: "story", label: "Story" }]} />
          ) : <Text style={[type.small, { color: c.muted }]}>A 9-second vertical video for Reels and TikTok: your design, why people love it, and where to buy.</Text>}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
            {opts.templates.map((t) => (
              <Pressable key={t.id} onPress={() => { setTemplate(t.id); setResult(null); }} accessibilityRole="radio" accessibilityState={{ selected: template === t.id }}
                style={{ width: "48.5%", padding: space.md, borderRadius: radius.md, borderWidth: template === t.id ? 2 : 1, borderColor: template === t.id ? c.accent : c.line, backgroundColor: c.surface, gap: 2 }}>
                <Text style={[type.label, { color: c.ink }]}>{t.name}</Text>
                <Text style={[type.small, { color: c.muted }]}>{t.about}</Text>
              </Pressable>
            ))}
          </View>
          <Button label={kind === "reel" ? "Make the Reel" : kind === "carousel" ? "Make the carousel" : "Make the post"} loading={busy === "render"} onPress={create} />
          {busy === "render" && kind === "reel" ? <Text style={[type.small, { color: c.muted }]}>Videos take about 15 seconds.</Text> : null}
        </Step>
      ) : null}

      <Notice text={msg?.text ?? null} tone={msg?.tone} />
      {result ? (
        <View style={{ gap: space.md }}>
          <H2>Your post</H2>
          <Preview result={result} format={kind === "reel" ? "story" : format} />
          <View style={{ flexDirection: "row", gap: space.sm }}>
            <Button label="Save to phone" icon={<Ionicons name="download-outline" size={18} color={c.onAccent} />} style={{ flex: 1 }} loading={busy === "save"} onPress={save} />
            <Button label="Share" variant="secondary" icon={<Ionicons name="share-outline" size={18} color={c.ink} />} style={{ flex: 1 }} onPress={() => shareFile(result.files[0].url).catch(() => {})} />
          </View>
          <Button label="Copy caption" variant="ghost" onPress={async () => { await Clipboard.setStringAsync(caption); setMsg({ text: "Caption copied. Paste it when you post.", tone: "ok" }); }} />
          <Text style={[type.small, { color: c.muted }]}>Post it from Instagram or TikTok, paste the caption, and put your store link in your bio.</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  const c = useColors();
  return (
    <View style={{ gap: space.md }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
        <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: c.ink, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontFamily: fonts.bodyBold, color: c.bg, fontSize: 13 }}>{n}</Text>
        </View>
        <H2>{title}</H2>
      </View>
      {children}
    </View>
  );
}

function Preview({ result, format }: { result: RenderedPost; format: PostFormat }) {
  const { width } = useWindowDimensions();
  const w = width - space.lg * 2;
  const ratio = format === "square" ? 1 : format === "story" ? 9 / 16 : 4 / 5;
  if (result.kind === "reel") return <ReelPreview url={result.files[0].url} width={Math.min(w, 300)} />;
  return (
    <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={result.files.length > 1} style={{ width: w }}>
      {result.files.map((f) => <Image key={f.file} source={{ uri: f.url }} style={{ width: w, height: w / ratio, borderRadius: radius.md }} contentFit="cover" />)}
    </ScrollView>
  );
}
function ReelPreview({ url, width }: { url: string; width: number }) {
  const player = useVideoPlayer(url, (p) => { p.loop = true; p.muted = true; p.play(); });
  const style = useMemo(() => ({ width, height: (width * 16) / 9, borderRadius: radius.md, alignSelf: "center" as const }), [width]);
  return <VideoView player={player} style={style} contentFit="cover" nativeControls={false} />;
}

import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import * as Clipboard from "expo-clipboard";
import { useVideoPlayer, VideoView } from "expo-video";
import { Ionicons } from "@expo/vector-icons";
import { Body, Button, Field, H2, Notice, Segmented } from "@/components/ui";
import { SocialPublishing } from "@/components/social-publishing";
import { api, ApiError, type MarketingOptions, type Me, type PostCopy, type PostFormat, type PostKind, type Product, type RenderedPost } from "@/lib/api";
import { account, useMe } from "@/lib/account-store";
import { ownsStoreResponse, type StoreOwner } from "@/lib/social-publishing";
import { saveToPhone, shareFile } from "@/lib/media";
import { fonts, radius, space, type, useColors } from "@/lib/theme";

type Msg = { text: string; tone: "ok" | "error" | "info" } | null;
const errText = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);

/** Make an Instagram, Facebook, or TikTok post from a seller-owned product photo. Rendering never publishes by itself. */
export default function MarketingScreen() {
  const me = useMe();
  const params = useLocalSearchParams<{ product_id?: string; image_url?: string }>();
  const storeId = me?.id ?? null;
  const storeRevision = api.storeRevision();
  // A seller switch gets a fresh screen instance rather than synchronously clearing state in an effect.
  return <MarketingContent key={`${storeId ?? "none"}:${storeRevision}:${params.product_id ?? ""}`} me={me} storeId={storeId} storeRevision={storeRevision} initialProductId={params.product_id} imageUrl={params.image_url} />;
}

function MarketingContent({ me, storeId, storeRevision, initialProductId, imageUrl }: { me: Me | null; storeId: string | null; storeRevision: number; initialProductId?: string; imageUrl?: string }) {
  const c = useColors();
  const [opts, setOpts] = useState<MarketingOptions | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [productId, setProductId] = useState<string | null>(initialProductId ?? null);
  const [platform, setPlatform] = useState<"instagram" | "facebook" | "tiktok">("instagram");
  const [offer, setOffer] = useState("");
  const [copy, setCopy] = useState<PostCopy | null>(null);
  const [kind, setKind] = useState<PostKind>("image");
  const [format, setFormat] = useState<PostFormat>("post");
  const [template, setTemplate] = useState("spotlight");
  const [result, setResult] = useState<RenderedPost | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<Msg>(null);
  const [publishingReviewOpen, setPublishingReviewOpen] = useState(false);
  const locked = !!busy || publishingReviewOpen;

  const owns = useCallback((started: StoreOwner) => ownsStoreResponse(started, { storeId, revision: api.storeRevision() }), [storeId]);

  useFocusEffect(useCallback(() => {
    let current = true;
    const started: StoreOwner = { storeId, revision: storeRevision };
    if (!started.storeId) return () => { current = false; };
    void Promise.all([api.marketing(started.storeId), api.products(started.storeId)])
      .then(([marketing, list]) => {
        if (!current || !owns(started)) return;
        const withPhoto = list.filter((product) => product.image_url);
        setOpts(marketing);
        setProducts(withPhoto);
        setProductId((selected) => {
          if (selected && withPhoto.some((product) => product.id === selected)) return selected;
          const requested = initialProductId ? withPhoto.find((product) => product.id === initialProductId) : undefined;
          return requested?.id ?? withPhoto[0]?.id ?? null;
        });
      })
      .catch((error) => {
        if (current && owns(started)) setMsg({ text: errText(error, "Couldn’t load your products."), tone: "error" });
      });
    return () => { current = false; };
  }, [initialProductId, owns, storeId, storeRevision]));

  const product = products?.find((candidate) => candidate.id === productId) ?? null;
  const caption = copy ? `${copy.caption}${copy.hashtags.length ? `\n\n${copy.hashtags.map((tag) => `#${tag}`).join(" ")}` : ""}` : "";
  const resultFormat = result?.format ?? (kind === "reel" ? "story" : format);

  async function write() {
    if (!product || !storeId || locked) return;
    const started: StoreOwner = { storeId, revision: storeRevision };
    const targetStore = started.storeId;
    if (!targetStore) return;
    setBusy("copy"); setMsg(null); setResult(null);
    try {
      const next = await api.postCopy({ product_id: product.id, platform, offer: offer.trim() || undefined }, targetStore);
      if (!owns(started)) return;
      setCopy(next);
      account.refresh().catch(() => {});
    } catch (error) {
      if (owns(started) && !(error instanceof ApiError && error.upgrade)) setMsg({ text: errText(error, "Couldn’t write the post."), tone: "error" });
    } finally {
      if (owns(started)) setBusy(null);
    }
  }

  function ownWords() {
    if (!product || locked) return;
    setResult(null);
    setCopy({ headline: product.title, subline: product.tagline, bullets: product.bullets.slice(0, 3), cta: "Shop now", caption: `${product.title}. ${product.tagline}\n\nLink in bio.`, hashtags: [], link: "" });
  }

  async function create() {
    if (!product || !copy || !storeId || locked) return;
    const started: StoreOwner = { storeId, revision: storeRevision };
    const targetStore = started.storeId;
    if (!targetStore) return;
    const effectiveFormat = kind === "reel" ? "story" : format;
    setBusy("render"); setMsg(null); setResult(null);
    try {
      const rendered = await api.renderPost({ product_id: product.id, kind, template, format: effectiveFormat, copy, offer: offer.trim() || undefined, image_url: imageUrl }, targetStore);
      if (owns(started)) setResult(rendered);
    } catch (error) {
      if (owns(started)) setMsg({ text: errText(error, "Couldn’t make the post."), tone: "error" });
    } finally {
      if (owns(started)) setBusy(null);
    }
  }

  function changeGraphicCopy(patch: Partial<Pick<PostCopy, "headline" | "subline" | "cta">>) {
    if (locked) return;
    setCopy((current) => current ? { ...current, ...patch } : current);
    // These fields are burned into the graphic. Caption-only edits intentionally keep a valid render.
    setResult(null);
  }

  function changeCaption(value: string) {
    if (locked) return;
    const [nextCaption, ...rest] = value.split(/\n\n(?=#)/);
    setCopy((current) => current ? { ...current, caption: nextCaption, hashtags: rest.join(" ").split(/\s+/).map((tag) => tag.replace(/^#/, "")).filter(Boolean) } : current);
  }

  async function save() {
    if (!result || locked) return;
    setBusy("save");
    try {
      const ok = await saveToPhone(result.files.map((file) => file.url));
      setMsg(ok ? { text: result.kind === "reel" ? "Video saved to your phone." : result.files.length > 1 ? "Slides saved to your phone." : "Saved to your phone.", tone: "ok" } : { text: "Allow photo access in Settings to save posts.", tone: "error" });
    } catch {
      setMsg({ text: "Couldn’t save. Try again.", tone: "error" });
    } finally {
      setBusy(null);
    }
  }

  const publishingPanel = <SocialPublishing storeId={storeId} storeRevision={storeRevision} renderedPost={result} caption={caption} format={resultFormat} disabled={!!busy} onReviewChange={setPublishingReviewOpen} />;

  if (!opts || !products) return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: space.lg, gap: space.xl, paddingBottom: space.xxl }}>
      <View style={{ gap: space.md }}><H2>Marketing</H2><Notice text={msg?.text ?? null} tone={msg?.tone} /><ActivityIndicator color={c.accent} /></View>
      {publishingPanel}
    </ScrollView>
  );

  if (!products.length) return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: space.lg, gap: space.xl, paddingBottom: space.xxl }}>
      <View style={{ gap: space.md }}>
        <H2>Add a product first</H2>
        <Body muted>Posts are made from your product photos. Snap or add a product, then come back here.</Body>
        <Button label="Snap a product" onPress={() => router.navigate("/snap")} />
        <Notice text={msg?.text ?? null} tone={msg?.tone} />
      </View>
      {publishingPanel}
    </ScrollView>
  );

  const left = me ? Math.max(0, me.account.limits.post - me.account.usage.post) : null;
  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: space.lg, gap: space.xl, paddingBottom: space.xxl }} keyboardShouldPersistTaps="handled">
      <Step n={1} title="Pick a product">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
          {products.map((candidate) => (
            <Pressable key={candidate.id} disabled={locked} onPress={() => { setProductId(candidate.id); setCopy(null); setResult(null); }} accessibilityRole="button" accessibilityState={{ selected: candidate.id === productId, disabled: locked }} accessibilityLabel={candidate.title}
              style={{ width: 96, gap: 4, opacity: locked ? 0.5 : 1 }}>
              <View style={{ width: 96, height: 96, borderRadius: radius.md, overflow: "hidden", borderWidth: 3, borderColor: candidate.id === productId ? c.accent : "transparent", backgroundColor: c.sunk }}>
                <Image source={{ uri: candidate.image_url! }} style={{ flex: 1 }} contentFit="cover" />
              </View>
              <Text numberOfLines={1} style={[type.small, { color: c.ink }]}>{candidate.title}</Text>
            </Pressable>
          ))}
        </ScrollView>
        {imageUrl ? <Text style={[type.small, { color: c.muted }]}>Using the photo you just made.</Text> : null}
      </Step>

      <Step n={2} title="Write the post">
        <View pointerEvents={locked ? "none" : "auto"} style={{ opacity: locked ? 0.5 : 1 }}>
          <Segmented value={platform} onChange={(value) => { setPlatform(value); setCopy(null); setResult(null); }} options={[{ value: "instagram", label: "Instagram" }, { value: "facebook", label: "Facebook" }, { value: "tiktok", label: "TikTok" }]} />
        </View>
        <Field label="Offer (optional)" hint="Only if it’s real, like a discount code you’ve set up." value={offer} onChangeText={(value) => { if (!locked) { setOffer(value); setResult(null); } }} placeholder="20% off with code GLOW20" maxLength={60} editable={!locked} />
        {!copy ? (
          <>
            <Button label="Write it for me" icon={<Ionicons name="sparkles" size={18} color={c.onAccent} />} loading={busy === "copy"} disabled={!product || locked} onPress={write} />
            <Button label="I’ll write my own" variant="ghost" disabled={locked} onPress={ownWords} />
            {left != null ? <Text style={[type.small, { color: c.muted }]}>{left} AI posts left{me?.account.plan === "free" ? "" : " this month"}.</Text> : null}
          </>
        ) : (
          <>
            <Field label="Headline on the graphic" value={copy.headline} maxLength={40} onChangeText={(headline) => changeGraphicCopy({ headline })} editable={!locked} />
            <Field label="Second line" value={copy.subline} maxLength={80} onChangeText={(subline) => changeGraphicCopy({ subline })} editable={!locked} />
            <Field label="Button text" value={copy.cta} maxLength={22} onChangeText={(cta) => changeGraphicCopy({ cta })} editable={!locked} />
            <Field label="Caption" value={caption} multiline onChangeText={changeCaption} editable={!locked} />
            <Button label="Rewrite with AI" variant="ghost" loading={busy === "copy"} disabled={locked} onPress={write} />
          </>
        )}
      </Step>

      {copy ? (
        <Step n={3} title="Choose the look">
          <View pointerEvents={locked ? "none" : "auto"} style={{ opacity: locked ? 0.5 : 1 }}>
            <Segmented value={kind} onChange={(value) => { setKind(value); setResult(null); }} options={[{ value: "image", label: "Post" }, { value: "carousel", label: "Carousel" }, { value: "reel", label: "Reel" }]} />
          </View>
          {kind !== "reel" ? (
            <>
              <View pointerEvents={locked ? "none" : "auto"} style={{ opacity: locked ? 0.5 : 1 }}>
                <Segmented value={format} onChange={(value) => { setFormat(value); setResult(null); }} options={[{ value: "post", label: "Portrait" }, { value: "square", label: "Square" }, { value: "story", label: "Story (manual)" }]} />
              </View>
              {format === "story" ? <Text style={[type.small, { color: c.muted }]}>Story art is for manual Save/Share. Native Meta publishing supports feed posts; choose Square or Portrait to publish.</Text> : null}
            </>
          ) : <Text style={[type.small, { color: c.muted }]}>A 9-second vertical video for Reels and TikTok: your design, why people love it, and where to buy.</Text>}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm, opacity: locked ? 0.5 : 1 }} pointerEvents={locked ? "none" : "auto"}>
            {opts.templates.map((item) => (
              <Pressable key={item.id} onPress={() => { setTemplate(item.id); setResult(null); }} accessibilityRole="radio" accessibilityState={{ selected: template === item.id, disabled: locked }}
                style={{ width: "48.5%", padding: space.md, borderRadius: radius.md, borderWidth: template === item.id ? 2 : 1, borderColor: template === item.id ? c.accent : c.line, backgroundColor: c.surface, gap: 2 }}>
                <Text style={[type.label, { color: c.ink }]}>{item.name}</Text>
                <Text style={[type.small, { color: c.muted }]}>{item.about}</Text>
              </Pressable>
            ))}
          </View>
          <Button label={kind === "reel" ? "Make the Reel" : kind === "carousel" ? "Make the carousel" : "Make the post"} loading={busy === "render"} disabled={locked} onPress={create} />
          {busy === "render" && kind === "reel" ? <Text style={[type.small, { color: c.muted }]}>Videos take about 15 seconds.</Text> : null}
        </Step>
      ) : null}

      <Notice text={msg?.text ?? null} tone={msg?.tone} />
      {result ? (
        <View style={{ gap: space.md }}>
          <H2>Your post</H2>
          <Preview result={result} format={resultFormat} />
          <View style={{ flexDirection: "row", gap: space.sm }}>
            <Button label="Save to phone" icon={<Ionicons name="download-outline" size={18} color={c.onAccent} />} style={{ flex: 1 }} loading={busy === "save"} disabled={locked} onPress={save} />
            <Button label="Share" variant="secondary" icon={<Ionicons name="share-outline" size={18} color={c.ink} />} style={{ flex: 1 }} disabled={locked} onPress={() => shareFile(result.files[0].url).catch(() => {})} />
          </View>
          <Button label="Copy caption" variant="ghost" disabled={locked} onPress={async () => { await Clipboard.setStringAsync(caption); setMsg({ text: "Caption copied. Paste it when you post.", tone: "ok" }); }} />
          <Text style={[type.small, { color: c.muted }]}>Manual Save, Share, and TikTok export stay available. Meta publishing always needs the separate review below.</Text>
        </View>
      ) : null}
      {publishingPanel}
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
      {result.files.map((file) => <Image key={file.file} source={{ uri: file.url }} style={{ width: w, height: w / ratio, borderRadius: radius.md }} contentFit="cover" />)}
    </ScrollView>
  );
}

function ReelPreview({ url, width }: { url: string; width: number }) {
  const player = useVideoPlayer(url, (instance) => { instance.loop = true; instance.muted = true; instance.play(); });
  const style = useMemo(() => ({ width, height: (width * 16) / 9, borderRadius: radius.md, alignSelf: "center" as const }), [width]);
  return <VideoView player={player} style={style} contentFit="cover" nativeControls={false} />;
}

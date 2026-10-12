import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as WebBrowser from "expo-web-browser";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Body, Button, Field, H1, Notice, Pill, Screen, Segmented } from "@/components/ui";
import { account, useMe } from "@/lib/account-store";
import { api, ApiError, type Me, type Product, type StorefrontCopy, type StorePatch, type StoreTheme } from "@/lib/api";
import {
  clearStorefrontDraft,
  loadStorefrontDraft,
  newStorefrontDraft,
  saveStorefrontDraft,
  type HeroMotion,
  type StorefrontDraft,
} from "@/lib/storefront-draft";
import { fonts, radius, space, type, useColors } from "@/lib/theme";

type Message = { text: string; tone: "error" | "ok" | "info" } | null;
type Busy = "photo" | "copy" | "preview" | "apply" | "saving" | null;

const STEPS = ["Look", "Cover", "Words", "Products", "Review"];
const errText = (error: unknown, fallback: string) => error instanceof ApiError ? error.message : fallback;
const isPremium = (theme: StoreTheme) => theme.collection === "premium" || theme.id.startsWith("p-");
const isMotion = (value: string): value is HeroMotion => value === "still" || value === "drift" || value === "pan";

/** Keep browser preview and final Apply exactly in sync. */
function storefrontPatchBody(draft: StorefrontDraft, seller: Me): StorePatch {
  return {
    store_name: draft.store_name.trim() || seller.store_name,
    theme: draft.theme,
    hero_title: draft.hero_title.trim(),
    hero_subtitle: draft.hero_subtitle.trim(),
    hero_eyebrow: draft.hero_eyebrow.trim(),
    hero_cta: draft.hero_cta.trim(),
    hero_motion: draft.hero_motion,
    tagline: draft.tagline.trim(),
    about: draft.about.trim(),
    announcement: draft.announcement.trim(),
    ...(draft.banner_file ? { banner_file: draft.banner_file } : {}),
  };
}

/**
 * A local-only setup flow. It stages copy and an owned cover-photo reference, then changes the
 * public storefront once, at Apply. It never publishes a product or changes billing or Stripe.
 */
export default function StorefrontSetupScreen() {
  const c = useColors();
  const me = useMe();
  const [themes, setThemes] = useState<StoreTheme[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [draft, setDraft] = useState<StorefrontDraft | null>(null);
  const [suggestions, setSuggestions] = useState<StorefrontCopy | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<Busy>(null);
  const [message, setMessage] = useState<Message>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  const premiumThemes = useMemo(() => themes.filter(isPremium), [themes]);
  const categories = useMemo(() => ["All", ...Array.from(new Set(premiumThemes.map((theme) => theme.category || "Premium")))], [premiumThemes]);
  const filteredThemes = useMemo(() => {
    if (!draft || draft.category === "" || draft.category === "All") return premiumThemes;
    return premiumThemes.filter((theme) => (theme.category || "Premium") === draft.category);
  }, [draft, premiumThemes]);
  const selectedTheme = premiumThemes.find((theme) => theme.id === draft?.theme) ?? null;
  const newestProductPhoto = products.find((product) => product.status === "live" && product.image_url)?.image_url ?? null;
  const coverUrl = draft?.banner_url ?? me?.banner_url ?? newestProductPhoto;

  const loadProducts = useCallback(async () => {
    try { setProducts(await api.products()); }
    catch { /* Product list is supplementary; setup can continue if this refresh fails. */ }
  }, []);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true); setMessage(null);
      try {
        const [seller, nextThemes, nextProducts] = await Promise.all([account.refresh(), api.themes(), api.products()]);
        const saved = await loadStorefrontDraft(seller.id);
        const premium = nextThemes.filter(isPremium);
        const defaultTheme = premium.find((theme) => theme.id === seller.theme)?.id ?? premium[0]?.id ?? seller.theme;
        const initial = newStorefrontDraft({
          step: 1,
          category: "All",
          theme: defaultTheme,
          hero_motion: seller.hero_motion,
          store_name: seller.store_name,
          hero_title: seller.hero_title,
          hero_subtitle: seller.hero_subtitle,
          hero_eyebrow: seller.hero_eyebrow,
          hero_cta: seller.hero_cta,
          tagline: seller.tagline,
          about: seller.about,
          announcement: seller.announcement,
          tone: "considered",
        });
        if (!alive) return;
        setThemes(nextThemes);
        setProducts(nextProducts);
        setDraft(newStorefrontDraft({ ...initial, ...(saved ?? {}) }));
      } catch (error) {
        if (alive) setMessage({ text: errText(error, "Couldn’t load storefront setup. Pull down or try again."), tone: "error" });
      } finally {
        if (alive) setLoading(false);
      }
    }
    void load();
    return () => { alive = false; };
  }, [loadAttempt]);

  // The photo-to-product flow is outside this wizard. Refresh the list when a seller comes back.
  useFocusEffect(useCallback(() => {
    if (!loading) void loadProducts();
  }, [loading, loadProducts]));

  function patch(values: Partial<StorefrontDraft>) {
    setDraft((previous) => {
      if (!previous) return previous;
      const next = newStorefrontDraft({ ...previous, ...values });
      if (me?.id) void saveStorefrontDraft(me.id, next).catch(() => {
        setMessage({ text: "This setup is still open, but we couldn’t save its local resume draft.", tone: "error" });
      });
      return next;
    });
  }

  function go(step: number) {
    if (busy) return;
    patch({ step });
    setMessage(null);
  }

  function discardStagedPhoto(file: string | null | undefined) {
    if (file) void api.discardStorefrontPhoto(file).catch(() => { /* Cleanup is best-effort; 409 means it is now applied. */ });
  }

  async function chooseCover() {
    if (busy) return;
    setBusy("photo"); setMessage(null);
    try {
      // SDK 57's library picker needs no permission except on iOS 10. Keeping the normal path
      // direct in this tap handler preserves web user activation.
      const oldIos = Platform.OS === "ios" && Number.parseInt(String(Platform.Version), 10) <= 10;
      if (oldIos) {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          setMessage({ text: "Allow photo access in Settings to choose a storefront cover.", tone: "error" });
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: false, quality: 0.8, base64: true });
      const asset = result.assets?.[0];
      if (result.canceled) return;
      if (!asset?.base64) {
        setMessage({ text: "That photo could not be read. Try a different image.", tone: "error" });
        return;
      }
      const previousFile = draft?.banner_file;
      const staged = await api.stageStorefrontPhoto(asset.base64, asset.mimeType || "image/jpeg");
      patch({ banner_file: staged.image_file, banner_url: staged.image_url });
      if (previousFile && previousFile !== staged.image_file) discardStagedPhoto(previousFile);
      setMessage({ text: "Cover photo staged. Your live storefront will not change until you apply it in Review.", tone: "ok" });
    } catch (error) {
      setMessage({ text: errText(error, "Couldn’t upload that cover photo."), tone: "error" });
    } finally {
      setBusy(null);
    }
  }

  async function getSuggestions() {
    if (!draft || busy) return;
    setBusy("copy"); setMessage(null);
    try {
      const next = await api.storefrontCopy({ notes: draft.notes, tone: draft.tone, theme: draft.theme, store_name: draft.store_name });
      setSuggestions(next);
      void account.refresh().catch(() => {});
      setMessage({ text: "Suggestions are ready. Review them, then choose exactly which words to use.", tone: "ok" });
    } catch (error) {
      setMessage({ text: errText(error, "Couldn’t write suggestions. You can keep editing manually."), tone: "error" });
    } finally {
      setBusy(null);
    }
  }

  function useSuggestion<K extends keyof StorefrontCopy>(field: K) {
    if (!suggestions || busy) return;
    patch({ [field]: suggestions[field] } as Partial<StorefrontDraft>);
    setMessage({ text: "Added to your editable local draft. It is not live yet.", tone: "ok" });
  }

  async function preview() {
    if (!me || !draft || busy) return;
    setBusy("preview"); setMessage(null);
    try {
      const { url } = await api.previewStorefront(storefrontPatchBody(draft, me));
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      setMessage({ text: errText(error, "Couldn’t open the storefront preview."), tone: "error" });
    } finally {
      setBusy(null);
    }
  }

  async function apply() {
    if (!me || !draft || !selectedTheme || busy) return;
    setBusy("apply"); setMessage(null);
    let updated: Me;
    try {
      updated = await api.updateStore(storefrontPatchBody(draft, me));
    } catch (error) {
      setMessage({ text: errText(error, "Couldn’t apply the storefront. Your setup draft is still saved on this phone."), tone: "error" });
      setBusy(null);
      return;
    }
    account.set(updated);
    let cleared = true;
    try {
      await clearStorefrontDraft(me.id);
    } catch {
      cleared = false;
    }
    Alert.alert(
      "Storefront applied",
      cleared
        ? "Your public storefront now has this look and wording. Products stay as they are: this does not publish any product. Your plan, Stripe connection and checkout stay unchanged."
        : "Your public storefront now has this look and wording, but we couldn’t clear this phone’s resume draft. Products, your plan, Stripe connection and checkout are unchanged.",
      [{ text: "Done", onPress: () => router.back() }],
    );
    if (!cleared) {
      setMessage({ text: "Storefront applied. This phone’s old resume draft could not be cleared.", tone: "info" });
    }
    setBusy(null);
  }

  async function leaveForProduct(path: "/" | "/create") {
    if (!me || !draft || busy) return;
    setBusy("saving"); setMessage(null);
    try {
      // Await the queued write before navigating away, so My Store can always resume step 4.
      await saveStorefrontDraft(me.id, newStorefrontDraft({ ...draft, step: 4 }));
      router.push(path);
    } catch {
      setMessage({ text: "Couldn’t save this setup draft before opening products. Try again so you can resume it from My store.", tone: "error" });
    } finally {
      setBusy(null);
    }
  }

  if (loading || !draft) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center", padding: space.lg }}>
        {loading ? <ActivityIndicator color={c.accent} /> : (
          <View style={{ width: "100%", gap: space.md }}>
            <Notice text={message?.text ?? "Couldn’t load storefront setup."} tone="error" />
            <Button label="Retry" onPress={() => setLoadAttempt((attempt) => attempt + 1)} />
          </View>
        )}
      </View>
    );
  }

  if (!premiumThemes.length) {
    return (
      <Screen>
        <H1>Premium storefront setup</H1>
        <Notice text={message?.text ?? "Premium looks aren’t available yet. Check your connection and try again."} tone="error" />
        <Button label="Retry" onPress={() => setLoadAttempt((attempt) => attempt + 1)} />
      </Screen>
    );
  }

  const nextLabel = draft.step === 1 ? "Continue to cover" : draft.step === 2 ? "Continue to words" : draft.step === 3 ? "Continue to products" : "Continue to review";
  const interactionLocked = busy !== null;
  return (
    <Screen>
      <WizardProgress step={draft.step} />
      {draft.step === 1 ? (
        <LookStep
          themes={filteredThemes}
          categories={categories}
          category={draft.category || "All"}
          selected={draft.theme}
          storeName={draft.store_name || me?.store_name || "Your store"}
          coverUrl={coverUrl}
          onCategory={(category) => patch({ category })}
          onTheme={(theme) => patch({ theme })}
        />
      ) : null}
      {draft.step === 2 ? (
        <CoverStep
          coverUrl={coverUrl}
          staged={Boolean(draft.banner_file)}
          motion={draft.hero_motion}
          busy={interactionLocked}
          uploading={busy === "photo"}
          hasProductFallback={Boolean(newestProductPhoto)}
          onChoose={chooseCover}
          onClear={() => {
            const previousFile = draft.banner_file;
            patch({ banner_file: null, banner_url: null });
            // This removes only the local staged choice; the public/current banner is untouched.
            discardStagedPhoto(previousFile);
          }}
          onMotion={(hero_motion) => patch({ hero_motion })}
        />
      ) : null}
      {draft.step === 3 ? (
        <WordsStep
          draft={draft}
          suggestions={suggestions}
          busy={interactionLocked}
          generating={busy === "copy"}
          allowance={`${Math.min(me?.account.usage.photo ?? 0, me?.account.limits.photo ?? 0)} of ${me?.account.limits.photo ?? 0}`}
          onPatch={patch}
          onGenerate={getSuggestions}
          onUse={useSuggestion}
        />
      ) : null}
      {draft.step === 4 ? <ProductsStep products={products} busy={interactionLocked} onAddPhoto={() => { void leaveForProduct("/"); }} onCreateDigital={() => { void leaveForProduct("/create"); }} /> : null}
      {draft.step === 5 ? (
        <ReviewStep
          draft={draft}
          theme={selectedTheme}
          coverUrl={coverUrl}
          liveProductCount={products.filter((product) => product.status === "live").length}
          onPreview={preview}
          onApply={apply}
          busy={busy}
        />
      ) : null}
      <Notice text={message?.text ?? null} tone={message?.tone === "ok" ? "ok" : message?.tone === "error" ? "error" : "info"} />
      {draft.step < 5 ? (
        <View style={{ flexDirection: "row", gap: space.sm, marginTop: space.sm }}>
          {draft.step > 1 ? <Button label="Back" variant="secondary" style={{ flex: 0.7 }} disabled={interactionLocked} onPress={() => go(draft.step - 1)} /> : null}
          <Button label={nextLabel} style={{ flex: 1.3 }} disabled={interactionLocked || (draft.step === 1 && !selectedTheme)} onPress={() => go(draft.step + 1)} />
        </View>
      ) : (
        <Button label="Back to products" variant="secondary" disabled={interactionLocked} onPress={() => go(4)} />
      )}
    </Screen>
  );
}

function WizardProgress({ step }: { step: number }) {
  const c = useColors();
  return (
    <View style={{ gap: space.sm }} accessibilityLabel={`Step ${step} of 5: ${STEPS[step - 1]}`}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Pill text={`Step ${step} of 5`} tone="flash" />
        <Text style={[type.small, { color: c.muted }]}>Saved on this phone</Text>
      </View>
      <View style={{ flexDirection: "row", gap: 5 }} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: 5, now: step }}>
        {STEPS.map((label, index) => <View key={label} style={{ flex: 1, height: 5, borderRadius: 99, backgroundColor: index < step ? c.accent : c.line }} />)}
      </View>
      <Text style={[type.small, { color: c.muted }]}>{STEPS.map((label, index) => `${index + 1}. ${label}`).join("  ·  ")}</Text>
    </View>
  );
}

function LookStep({ themes, categories, category, selected, storeName, coverUrl, onCategory, onTheme }: {
  themes: StoreTheme[]; categories: string[]; category: string; selected: string; storeName: string; coverUrl: string | null;
  onCategory: (category: string) => void; onTheme: (theme: string) => void;
}) {
  const c = useColors();
  return (
    <View style={{ gap: space.lg }}>
      <View style={{ gap: 6 }}>
        <H1>Choose a premium look</H1>
        <Body muted>Filter by what you sell, then choose an art direction. Nothing is live until the final Apply step.</Body>
      </View>
      <View style={{ gap: space.sm }}>
        <Text style={[type.label, { color: c.ink }]}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
          {categories.map((item) => {
            const active = item === category;
            return (
              <Pressable key={item} accessibilityRole="radio" accessibilityState={{ selected: active }} onPress={() => onCategory(item)}
                style={{ borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: active ? c.accent : c.surface, borderWidth: 1, borderColor: active ? c.accent : c.line }}>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: active ? c.onAccent : c.ink }}>{item === "All" ? "All premium" : item}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      <View accessibilityRole="radiogroup" style={{ gap: space.md }}>
        {themes.map((theme) => <PremiumThemeCard key={theme.id} theme={theme} selected={selected === theme.id} storeName={storeName} coverUrl={coverUrl} onPress={() => onTheme(theme.id)} />)}
        {!themes.length ? <Notice text="No premium looks match this category. Try All premium." /> : null}
      </View>
    </View>
  );
}

function PremiumThemeCard({ theme, selected, storeName, coverUrl, onPress }: { theme: StoreTheme; selected: boolean; storeName: string; coverUrl: string | null; onPress: () => void }) {
  const c = useColors();
  const colors = theme.colors;
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={`${theme.name}. ${theme.vibe}. ${selected ? "Selected" : ""}`}
      style={({ pressed }) => ({ borderRadius: radius.lg, overflow: "hidden", backgroundColor: c.surface, borderColor: selected ? c.accent : c.line, borderWidth: selected ? 2 : 1, opacity: pressed ? 0.9 : 1 })}>
      <View style={{ height: 156, backgroundColor: colors.bg, overflow: "hidden" }} importantForAccessibility="no-hide-descendants">
        {coverUrl ? <Image source={{ uri: coverUrl }} contentFit="cover" style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "52%" }} /> : <View style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "52%", backgroundColor: colors.panel }} />}
        <View style={{ width: "58%", height: "100%", padding: 16, justifyContent: "flex-end", gap: 6, backgroundColor: colors.bg }}>
          <Text numberOfLines={1} style={{ fontFamily: fonts.display, fontSize: 23, lineHeight: 25, color: colors.ink }}>{storeName}</Text>
          <View style={{ width: 70, height: 5, borderRadius: 4, backgroundColor: colors.muted, opacity: 0.75 }} />
          <View style={{ width: 62, height: 20, borderRadius: Math.min(theme.shape.button, 8), backgroundColor: colors.accent }} />
        </View>
        <View style={{ position: "absolute", top: 12, right: 12, backgroundColor: selected ? c.accent : colors.surface, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 4 }}>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: selected ? c.onAccent : colors.ink }}>{selected ? "Selected" : theme.category || "Premium"}</Text>
        </View>
      </View>
      <View style={{ padding: space.md, gap: 3 }}>
        <Text style={[type.heading, { color: c.ink }]}>{theme.name}</Text>
        <Text style={[type.small, { color: c.muted }]}>{theme.vibe} · {theme.family || theme.for}</Text>
      </View>
    </Pressable>
  );
}

function CoverStep({ coverUrl, staged, motion, busy, uploading, hasProductFallback, onChoose, onClear, onMotion }: {
  coverUrl: string | null; staged: boolean; motion: HeroMotion; busy: boolean; uploading: boolean; hasProductFallback: boolean;
  onChoose: () => void; onClear: () => void; onMotion: (motion: HeroMotion) => void;
}) {
  const c = useColors();
  return (
    <View style={{ gap: space.lg }}>
      <View style={{ gap: 6 }}>
        <H1>Set the hero cover</H1>
        <Body muted>Use one wide product or lifestyle photo. A chosen upload is staged now, so it will not replace your live cover until Apply.</Body>
      </View>
      <Pressable onPress={onChoose} disabled={busy} accessibilityRole="button" accessibilityLabel="Choose a storefront cover photo"
        style={{ aspectRatio: 16 / 9, overflow: "hidden", borderRadius: radius.lg, backgroundColor: c.sunk, borderWidth: coverUrl ? 0 : 2, borderStyle: "dashed", borderColor: c.line, alignItems: "center", justifyContent: "center" }}>
        {coverUrl ? <Image source={{ uri: coverUrl }} contentFit="cover" style={{ position: "absolute", inset: 0 }} /> : null}
        {coverUrl ? <View style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.18)" }} /> : null}
        {uploading ? <ActivityIndicator color={c.onAccent} /> : <View style={{ alignItems: "center", gap: 6, padding: space.lg }}><Ionicons name="image-outline" size={30} color={coverUrl ? c.onAccent : c.accent} /><Text style={[type.label, { color: coverUrl ? c.onAccent : c.accent }]}>{coverUrl ? "Choose a different photo" : "Choose a cover photo"}</Text></View>}
      </Pressable>
      {staged ? <Pill text="New cover staged — not live yet" tone="good" /> : null}
      <View style={{ flexDirection: "row", gap: space.sm }}>
        <Button label={coverUrl ? "Change photo" : "Choose photo"} style={{ flex: 1 }} loading={uploading} disabled={busy} onPress={onChoose} />
        {staged ? <Button label="Use current" variant="secondary" disabled={busy} onPress={onClear} /> : null}
      </View>
      <Notice text={hasProductFallback ? "No cover is required: if your store has no current cover, its newest live product photo is used as the storefront fallback." : "No cover is required. Use a dedicated cover, or publish a product separately if you want a live-product photo fallback."} />
      <View style={{ gap: space.sm }}>
        <Text style={[type.heading, { color: c.ink }]}>Hero movement</Text>
        <Segmented value={motion} onChange={(value) => { if (!busy && isMotion(value)) onMotion(value); }} options={[{ value: "still", label: "Still" }, { value: "drift", label: "Drift" }, { value: "pan", label: "Pan" }]} />
        <Text style={[type.small, { color: c.muted }]}>Drift and pan are gentle storefront image effects. They do not generate a video, a 3D model, or a new product view.</Text>
      </View>
    </View>
  );
}

function WordsStep({ draft, suggestions, busy, generating, allowance, onPatch, onGenerate, onUse }: {
  draft: StorefrontDraft; suggestions: StorefrontCopy | null; busy: boolean; generating: boolean; allowance: string;
  onPatch: (values: Partial<StorefrontDraft>) => void; onGenerate: () => void; onUse: <K extends keyof StorefrontCopy>(field: K) => void;
}) {
  const c = useColors();
  return (
    <View style={{ gap: space.lg }}>
      <View style={{ gap: 6 }}>
        <H1>Write the words</H1>
        <Body muted>Everything below is editable. Blank hero fields use the selected look’s own fallback copy.</Body>
      </View>
      <Field label="Store name" value={draft.store_name} onChangeText={(store_name) => onPatch({ store_name })} maxLength={80} />
      <Field label="Notes for AI (optional)" hint="Describe your products, mood or audience. Don’t add claims you can’t support." value={draft.notes} onChangeText={(notes) => onPatch({ notes })} multiline maxLength={700} placeholder="Small-batch candle studio with quiet, warm evenings…" />
      <View style={{ gap: 6 }}>
        <Text style={[type.label, { color: c.ink }]}>Writing tone</Text>
        <Segmented value={draft.tone} onChange={(tone) => { if (!busy) onPatch({ tone }); }} options={[{ value: "considered", label: "Considered" }, { value: "warm", label: "Warm" }, { value: "bold", label: "Bold" }]} />
      </View>
      <View style={{ backgroundColor: c.flash, borderRadius: radius.lg, padding: space.md, gap: 6 }}>
        <Text style={[type.heading, { color: c.onFlash }]}>Optional AI suggestions</Text>
        <Text style={[type.small, { color: c.onFlash }]}>This uses one photo-to-page allowance ({allowance} used). Manual editing is always available and uses no AI allowance. Suggestions never save or go live by themselves.</Text>
        <Button label="Get AI suggestions" variant="secondary" loading={generating} disabled={busy} onPress={onGenerate} />
      </View>
      {suggestions ? <SuggestionList suggestions={suggestions} disabled={busy} onUse={onUse} /> : null}
      <View style={{ gap: space.md }}>
        <Field label="Hero headline" hint="Up to 100 characters" value={draft.hero_title} onChangeText={(hero_title) => onPatch({ hero_title })} maxLength={100} />
        <Field label="Hero subheadline" hint="Up to 220 characters" value={draft.hero_subtitle} onChangeText={(hero_subtitle) => onPatch({ hero_subtitle })} multiline maxLength={220} />
        <Field label="Eyebrow" hint="A small line above the headline" value={draft.hero_eyebrow} onChangeText={(hero_eyebrow) => onPatch({ hero_eyebrow })} maxLength={48} />
        <Field label="Button label" hint="For example: Shop the collection" value={draft.hero_cta} onChangeText={(hero_cta) => onPatch({ hero_cta })} maxLength={32} />
        <Field label="Tagline" value={draft.tagline} onChangeText={(tagline) => onPatch({ tagline })} maxLength={160} />
        <Field label="About your store" value={draft.about} onChangeText={(about) => onPatch({ about })} multiline maxLength={600} />
        <Field label="Announcement" hint="Optional short strip above your menu" value={draft.announcement} onChangeText={(announcement) => onPatch({ announcement })} maxLength={90} />
      </View>
    </View>
  );
}

function SuggestionList({ suggestions, disabled, onUse }: { suggestions: StorefrontCopy; disabled: boolean; onUse: <K extends keyof StorefrontCopy>(field: K) => void }) {
  const c = useColors();
  const labels: { key: keyof StorefrontCopy; label: string }[] = [
    { key: "hero_title", label: "Hero headline" }, { key: "hero_subtitle", label: "Hero subheadline" }, { key: "hero_eyebrow", label: "Eyebrow" },
    { key: "hero_cta", label: "Button label" }, { key: "tagline", label: "Tagline" }, { key: "about", label: "About" }, { key: "announcement", label: "Announcement" },
  ];
  return (
    <View style={{ gap: space.sm, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, padding: space.md }}>
      <Text style={[type.heading, { color: c.ink }]}>AI suggestions — review before using</Text>
      {labels.map(({ key, label }) => (
        <View key={key} style={{ gap: 5, paddingTop: space.sm, borderTopWidth: key === "hero_title" ? 0 : 1, borderColor: c.line }}>
          <Text style={[type.label, { color: c.muted }]}>{label}</Text>
          <Text style={[type.small, { color: c.ink }]}>{suggestions[key] || "No suggestion"}</Text>
          <Button label={`Use ${label.toLowerCase()}`} variant="secondary" disabled={disabled || !suggestions[key]} onPress={() => onUse(key)} />
        </View>
      ))}
    </View>
  );
}

function ProductsStep({ products, busy, onAddPhoto, onCreateDigital }: { products: Product[]; busy: boolean; onAddPhoto: () => void; onCreateDigital: () => void }) {
  const c = useColors();
  return (
    <View style={{ gap: space.lg }}>
      <View style={{ gap: 6 }}>
        <H1>Add or review products</H1>
        <Body muted>Use Snapfront’s normal product flow for product photos, pricing and details. This storefront setup does not create or publish products.</Body>
      </View>
      <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, padding: space.lg, gap: space.sm }}>
        <Text style={[type.heading, { color: c.ink }]}>{products.length ? `${products.length} product${products.length === 1 ? "" : "s"} in this store` : "No products yet"}</Text>
        <Text style={[type.small, { color: c.muted }]}>{products.length ? `${products.filter((product) => product.status === "live").length} live · ${products.filter((product) => product.status !== "live").length} draft` : "Add a product now, or finish your store design first."}</Text>
        {products.slice(0, 3).map((product) => <ProductRow key={product.id} product={product} />)}
      </View>
      <Button label="Add a product from a photo" icon={<Ionicons name="camera-outline" size={19} color={c.onAccent} />} loading={busy} disabled={busy} onPress={onAddPhoto} />
      <Button label="Create a digital product" variant="secondary" disabled={busy} onPress={onCreateDigital} />
      <Notice text="When you return, this step refreshes your product list. Product publishing remains a separate choice in the normal product flow." />
    </View>
  );
}

function ProductRow({ product }: { product: Product }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, paddingTop: space.sm, borderTopWidth: 1, borderColor: c.line }}>
      <View style={{ width: 42, height: 42, backgroundColor: c.sunk, borderRadius: radius.sm, overflow: "hidden" }}>{product.image_url ? <Image source={{ uri: product.image_url }} contentFit="cover" style={{ flex: 1 }} /> : null}</View>
      <View style={{ flex: 1, gap: 2 }}><Text numberOfLines={1} style={[type.label, { color: c.ink }]}>{product.title}</Text><Text style={[type.small, { color: c.muted }]}>{product.status === "live" ? "Live" : "Draft"}</Text></View>
    </View>
  );
}

function ReviewStep({ draft, theme, coverUrl, liveProductCount, onPreview, onApply, busy }: {
  draft: StorefrontDraft; theme: StoreTheme | null; coverUrl: string | null; liveProductCount: number;
  onPreview: () => void; onApply: () => void; busy: Busy;
}) {
  const c = useColors();
  const previewing = busy === "preview";
  const applying = busy === "apply";
  return (
    <View style={{ gap: space.lg }}>
      <View style={{ gap: 6 }}>
        <H1>Review before applying</H1>
        <Body muted>Your local summary below includes your staged words and cover. It is not a public preview.</Body>
      </View>
      <View style={{ borderRadius: radius.lg, overflow: "hidden", backgroundColor: theme?.colors.bg ?? c.sunk, borderWidth: 1, borderColor: theme?.colors.line ?? c.line }}>
        <View style={{ height: 190, backgroundColor: theme?.colors.panel ?? c.surface }}>
          {coverUrl ? <Image source={{ uri: coverUrl }} contentFit="cover" style={{ position: "absolute", inset: 0 }} /> : null}
          <View style={{ position: "absolute", inset: 0, backgroundColor: coverUrl ? "rgba(0,0,0,0.36)" : "transparent", justifyContent: "flex-end", padding: space.lg, gap: 5 }}>
            <Text style={{ color: coverUrl ? "#FFFFFF" : (theme?.colors.onPanel ?? c.ink), fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1 }}>{draft.hero_eyebrow || theme?.copy?.eyebrow || "YOUR COLLECTION"}</Text>
            <Text numberOfLines={2} style={{ color: coverUrl ? "#FFFFFF" : (theme?.colors.onPanel ?? c.ink), fontFamily: fonts.display, fontSize: 29, lineHeight: 31 }}>{draft.hero_title || "Your selected look"}</Text>
            <Text numberOfLines={2} style={{ color: coverUrl ? "#FFFFFF" : (theme?.colors.onPanel ?? c.ink), fontFamily: fonts.body, fontSize: 13 }}>{draft.hero_subtitle || "Your editable storefront words will appear here."}</Text>
          </View>
        </View>
        <View style={{ padding: space.md, gap: 4 }}>
          <Text style={[type.heading, { color: theme?.colors.ink ?? c.ink }]}>{draft.store_name || "Your store"} · {theme?.name || "Premium look"}</Text>
          <Text style={[type.small, { color: theme?.colors.muted ?? c.muted }]}>Hero: {draft.hero_motion} · {liveProductCount} live product{liveProductCount === 1 ? "" : "s"} in preview</Text>
        </View>
      </View>
      <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, padding: space.md, gap: space.sm }}>
        <Text style={[type.heading, { color: c.ink }]}>Private storefront preview</Text>
        <Text style={[type.small, { color: c.muted }]}>Preview shows all staged cover, words and hero motion without changing your public storefront. Only existing live products appear. Store and product links navigate to your currently applied public store. This private preview expires after 30 minutes.</Text>
        <Button label="Preview my storefront" variant="secondary" icon={<Ionicons name="eye-outline" size={18} color={c.ink} />} loading={previewing} disabled={busy !== null} onPress={onPreview} />
      </View>
      <View style={{ backgroundColor: c.flash, borderRadius: radius.lg, padding: space.md, gap: 6 }}>
        <Text style={[type.heading, { color: c.onFlash }]}>Ready to change your public storefront?</Text>
        <Text style={[type.small, { color: c.onFlash }]}>Apply updates the selected look, cover and words together. It does not publish products, alter your plan, or change Stripe or checkout.</Text>
      </View>
      <Button label="Apply to public storefront" loading={applying} disabled={busy !== null} onPress={onApply} />
    </View>
  );
}

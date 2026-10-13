import React, { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Keyboard, Platform, Pressable, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as WebBrowser from "expo-web-browser";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Body, Button, Field, H1, Notice, Pill, Screen, Segmented } from "@/components/ui";
import { ThemePicker } from "@/components/theme-picker";
import { clearStorefrontSuggestions, loadStorefrontSuggestions, saveStorefrontSuggestions } from "@/lib/storefront-suggestions";
import { isPremiumTheme } from "@/lib/theme-catalog";
import { restoreStorefrontDraft, storefrontPatchBody, storefrontReadiness } from "@/lib/storefront-setup";
import { account, useMe } from "@/lib/account-store";
import { api, ApiError, type Me, type Product, type StorefrontCopy, type StoreTheme } from "@/lib/api";
import {
  clearStorefrontDraft,
  loadStorefrontDraft,
  mergeStorefrontDraft,
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
const isMotion = (value: string): value is HeroMotion => value === "still" || value === "drift" || value === "pan";
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

  const draftRef = useRef<StorefrontDraft | null>(null);
  const storeIdRef = useRef<string | null>(null);
  const storeSelectionRef = useRef(-1);
  const [draftStoreId, setDraftStoreId] = useState<string | null>(null);
  const operationRef = useRef(false);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const saveRevision = useRef(0);
  const [completed, setCompleted] = useState<{ seller: Me; cleared: boolean } | null>(null);
  const completedStoreRef = useRef<string | null>(null);
  const selectedTheme = themes.find((theme) => theme.id === draft?.theme) ?? null;
  const newestProductPhoto = products.find((product) => product.status === "live" && product.image_url)?.image_url ?? null;
  const coverUrl = draft?.banner_url ?? me?.banner_url ?? newestProductPhoto;

  // Reload on focus, not account usage updates. A returning route may now belong to another store.
  useFocusEffect(useCallback(() => {
    // A retry changes this callback identity so the focused route reloads immediately.
    void loadAttempt;
    let alive = true;
    setLoading(true); setMessage(null);
    async function load() {
      const selection = api.storeRevision();
      try {
        const [seller, nextThemes, nextProducts] = await Promise.all([account.refresh(), api.themes(), api.products()]);
        const saved = await loadStorefrontDraft(seller.id);
        const savedSuggestions = await loadStorefrontSuggestions(seller.id).catch(() => null);
        if (!alive || selection !== api.storeRevision() || account.get()?.id !== seller.id) return;
        if (completedStoreRef.current === seller.id) return;
        const inMemory = storeIdRef.current === seller.id ? draftRef.current : null;
        const restored = restoreStorefrontDraft(seller, nextThemes, inMemory ?? saved);
        if (storeIdRef.current !== seller.id) { setCompleted(null); setSuggestions(null); completedStoreRef.current = null; }
        storeIdRef.current = seller.id;
        storeSelectionRef.current = selection;
        setDraftStoreId(seller.id);
        draftRef.current = restored.draft;
        setSuggestions(savedSuggestions);
        setThemes(nextThemes); setProducts(nextProducts); setDraft(restored.draft);
        if (!saved || restored.replaced) {
          try { await saveStorefrontDraft(seller.id, restored.draft); if (alive) setSaveState("saved"); }
          catch { if (alive) setSaveState("error"); }
        } else setSaveState("saved");
        if (restored.replaced) setMessage({ text: `Your saved theme is no longer available. We kept your words and staged cover; review the replacement ${nextThemes.find((theme) => theme.id === restored.draft.theme)?.name ?? "theme"} before applying.`, tone: "info" });
      } catch (error) {
        if (alive) { setDraft(null); setMessage({ text: errText(error, "Couldn’t load setup. Check your connection and retry."), tone: "error" }); }
      } finally { if (alive) setLoading(false); }
    }
    void load();
    return () => { alive = false; };
  }, [loadAttempt]));

  function ownsDraft(owner = storeIdRef.current) {
    return Boolean(owner && storeIdRef.current === owner && account.get()?.id === owner && storeSelectionRef.current === api.storeRevision());
  }
  function patch(values: Partial<StorefrontDraft>) {
    if (!draftRef.current || !ownsDraft() || operationRef.current) return;
    const next = newStorefrontDraft({ ...draftRef.current, ...values });
    draftRef.current = next; setDraft(next);
    const owner = storeIdRef.current!;
    const revision = ++saveRevision.current;
    setSaveState("saving");
    return saveStorefrontDraft(owner, next).then(() => {
      if (owner === storeIdRef.current && revision === saveRevision.current) setSaveState("saved");
      return true;
    }).catch(() => {
      if (owner === storeIdRef.current && revision === saveRevision.current) {
        setSaveState("error");
        setMessage({ text: "Couldn’t save on this phone. Keep setup open and retry saving before leaving.", tone: "error" });
      }
      return false;
    });
  }

  async function retrySave() {
    if (!draftRef.current || !ownsDraft()) return;
    patch({});
  }

  function go(step: number) {
    if (busy || operationRef.current) return;
    Keyboard.dismiss();
    patch({ step, max_step: Math.max(draftRef.current?.max_step ?? 1, step) });
    setMessage(null);
  }

  function discardStagedPhoto(file: string | null | undefined, owner = storeIdRef.current) {
    if (file && owner) void api.discardStorefrontPhoto(file, owner).catch(() => { /* Cleanup is best-effort; 409 means it is now applied. */ });
  }

  async function chooseCover() {
    if (busy || operationRef.current || !ownsDraft()) return;
    const owner = storeIdRef.current!;
    const initiatingDraft = draftRef.current!;
    operationRef.current = true;
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
      const previousFile = draftRef.current?.banner_file;
      if (!ownsDraft(owner)) return;
      const staged = await api.stageStorefrontPhoto(asset.base64, asset.mimeType || "image/jpeg", owner);
      if (!ownsDraft(owner)) {
        try {
          await mergeStorefrontDraft(owner, { banner_file: staged.image_file, banner_url: staged.image_url }, initiatingDraft);
          if (previousFile && previousFile !== staged.image_file) discardStagedPhoto(previousFile, owner);
        } catch { discardStagedPhoto(staged.image_file, owner); }
        return;
      }
      operationRef.current = false;
      const saved = await patch({ banner_file: staged.image_file, banner_url: staged.image_url });
      if (!saved) return;
      if (previousFile && previousFile !== staged.image_file) discardStagedPhoto(previousFile, owner);
      if (!ownsDraft(owner)) return;
      setMessage({ text: "Cover photo staged. Your live storefront will not change until you apply it in Review.", tone: "ok" });
    } catch (error) {
      setMessage({ text: errText(error, "Couldn’t upload that cover photo."), tone: "error" });
    } finally {
      operationRef.current = false;
      setBusy(null);
    }
  }

  async function getSuggestions() {
    if (!draft || busy || operationRef.current || !ownsDraft()) return;
    const owner = storeIdRef.current!;
    operationRef.current = true;
    setBusy("copy"); setMessage(null);
    try {
      const next = await api.storefrontCopy({ notes: draft.notes, tone: draft.tone, theme: draft.theme, store_name: draft.store_name }, owner);
      // Keep the result for its original store even if this route has lost focus or switched stores.
      let retained = true;
      try { await saveStorefrontSuggestions(owner, next); } catch { retained = false; }
      if (!ownsDraft(owner)) return;
      setSuggestions(next);
      void account.refresh().catch(() => {});
      setMessage({ text: retained ? "Suggestions are ready. Review them, then choose exactly which words to use." : "Suggestions are ready in this session, but could not be saved for the next app restart. Review and copy the fields you need now.", tone: retained ? "ok" : "info" });
    } catch (error) {
      setMessage({ text: errText(error, "Couldn’t write suggestions. You can keep editing manually."), tone: "error" });
    } finally {
      operationRef.current = false;
      setBusy(null);
    }
  }

  function useSuggestion<K extends keyof StorefrontCopy>(field: K) {
    if (!suggestions || busy) return;
    patch({ [field]: suggestions[field] } as Partial<StorefrontDraft>);
    setMessage({ text: "Added to your editable local draft. It is not live yet.", tone: "ok" });
  }

  async function preview() {
    if (!me || !draft || busy || operationRef.current || !ownsDraft()) return;
    if (!selectedTheme) {
      setMessage({ text: "Choose an available theme before previewing your storefront.", tone: "error" });
      return;
    }
    const owner = storeIdRef.current;
    operationRef.current = true;
    setBusy("preview"); setMessage(null);
    try {
      const { url } = await api.previewStorefront(storefrontPatchBody(draft, me), me.id);
      if (ownsDraft(owner)) await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      setMessage({ text: errText(error, "Couldn’t open the storefront preview."), tone: "error" });
    } finally {
      operationRef.current = false;
      setBusy(null);
    }
  }

  async function apply() {
    if (!me || !draft || busy || operationRef.current || !ownsDraft()) return;
    if (!selectedTheme) {
      setMessage({ text: "Choose an available theme before applying your storefront.", tone: "error" });
      return;
    }
    const owner = storeIdRef.current;
    operationRef.current = true;
    setBusy("apply"); setMessage(null);
    let updated: Me;
    try {
      updated = await api.updateStore(storefrontPatchBody(draft, me), me.id);
    } catch (error) {
      setMessage({ text: errText(error, "Couldn’t apply the storefront. Your setup remains open; retry when you have a connection."), tone: "error" });
      operationRef.current = false; setBusy(null);
      return;
    }
    if (ownsDraft(owner)) account.set(updated);
    let cleared = true;
    try {
      await clearStorefrontDraft(me.id);
      await clearStorefrontSuggestions(me.id);
    } catch {
      cleared = false;
    }
    if (ownsDraft(owner)) { completedStoreRef.current = owner; setCompleted({ seller: updated, cleared }); }
    operationRef.current = false; setBusy(null);
  }

  async function leaveForProduct(path: "/snap" | "/create" | { pathname: "/product/[id]"; params: { id: string } }) {
    if (!me || !draft || busy || operationRef.current || !ownsDraft()) return;
    const owner = storeIdRef.current;
    operationRef.current = true;
    setBusy("saving"); setMessage(null);
    try {
      // Await the queued write before navigating away, so My Store can always resume step 4.
      await saveStorefrontDraft(me.id, newStorefrontDraft({ ...draft, step: 4 }));
      if (ownsDraft(owner)) router.push(path);
    } catch {
      setMessage({ text: "Couldn’t save this setup draft before opening products. Try again so you can resume it from My store.", tone: "error" });
    } finally {
      operationRef.current = false;
      setBusy(null);
    }
  }

  if (loading || !draft || me?.id !== draftStoreId) {
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

  if (!themes.length) {
    return (
      <Screen>
        <H1>Storefront setup</H1>
        <Notice text={message?.text ?? "Storefront themes aren’t available yet. Check your connection and try again."} tone="error" />
        <Button label="Retry" onPress={() => setLoadAttempt((attempt) => attempt + 1)} />
      </Screen>
    );
  }

  if (completed) return (
    <Screen>
      <Pill text="Storefront applied" tone="good" />
      <H1>Your storefront design is applied</H1>
      <Body>Your selected theme, cover and words have been applied to {completed.seller.store_name}.</Body>
      <Notice text="Products remain draft or live exactly as before. Your plan, Stripe connection and checkout have not changed." />
      {!completed.cleared ? <Notice text="The design was applied, but this phone’s old resume draft could not be cleared." /> : null}
      <Text selectable style={[type.small, { color: c.ink }]}>{completed.seller.store_url}</Text>
      <Button label="Open my storefront" onPress={() => { void WebBrowser.openBrowserAsync(completed.seller.store_url).catch(() => setMessage({ text: "Couldn’t open the link. Your storefront was still applied successfully.", tone: "error" })); }} />
      <Button label="Back to My store" variant="secondary" onPress={() => router.navigate("/store")} />
      <Notice text={message?.text ?? null} tone={message?.tone === "error" ? "error" : "info"} />
    </Screen>
  );

  const nextLabel = draft.step === 1 ? "Continue to cover" : draft.step === 2 ? "Continue to words" : draft.step === 3 ? "Continue to products" : "Continue to review";
  const interactionLocked = busy !== null;
  return (
    <Screen key={`${draftStoreId}-${draft.step}`}>
      <WizardProgress step={draft.step} maxStep={draft.max_step} saveState={saveState} disabled={interactionLocked} onStep={go} />
      {draft.step === 1 ? (
        <View style={{ gap: space.lg }}>
          <H1>Choose your store’s look</H1>
          <Body muted>Browse all {themes.length} themes. Thumbnails are illustrative demos, not your products. Choose a look now; nothing is applied until Review.</Body>
          <ThemePicker themes={themes} selected={draft.theme} current={me?.theme} storeName={draft.store_name || me?.store_name || "Your store"} photo={coverUrl}
            browse={draft.browse} onBrowse={(browse) => patch({ browse })} onSelect={(theme) => patch({ theme })} disabled={interactionLocked} />
        </View>
      ) : null}
      {draft.step === 2 ? (
        <CoverStep
          coverUrl={coverUrl}
          staged={Boolean(draft.banner_file)}
          motion={draft.hero_motion}
          busy={interactionLocked}
          uploading={busy === "photo"}
          hasProductFallback={Boolean(newestProductPhoto)}
          supportsMotion={Boolean(selectedTheme && isPremiumTheme(selectedTheme))}
          onChoose={chooseCover}
          onClear={() => {
            const previousFile = draft.banner_file;
            const owner = me?.id;
            // Discard the old staged file only after the replacement draft is saved.
            void patch({ banner_file: null, banner_url: null })?.then((saved) => { if (saved) discardStagedPhoto(previousFile, owner); });
          }}
          onMotion={(hero_motion) => patch({ hero_motion })}
        />
      ) : null}
      {draft.step === 3 ? (
        <WordsStep
          draft={draft}
          theme={selectedTheme}
          suggestions={suggestions}
          busy={interactionLocked}
          generating={busy === "copy"}
          allowance={`${Math.min(me?.account.usage.photo ?? 0, me?.account.limits.photo ?? 0)} of ${me?.account.limits.photo ?? 0}`}
          onPatch={patch}
          onGenerate={getSuggestions}
          onUse={useSuggestion}
        />
      ) : null}
      {draft.step === 4 ? <ProductsStep products={products} busy={interactionLocked} onAddPhoto={() => { void leaveForProduct("/snap"); }} onCreateDigital={() => { void leaveForProduct("/create"); }} onReviewProduct={(id) => { void leaveForProduct({ pathname: "/product/[id]", params: { id } }); }} /> : null}
      {draft.step === 5 ? (
        <ReviewStep
          draft={draft}
          theme={selectedTheme}
          coverUrl={coverUrl}
          seller={me!}
          products={products}
          onPreview={preview}
          onApply={apply}
          busy={busy}
        />
      ) : null}
      {saveState === "error" ? <Button label="Retry saving draft" variant="secondary" disabled={interactionLocked} onPress={retrySave} /> : null}
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

function WizardProgress({ step, maxStep, saveState, disabled, onStep }: { step: number; maxStep: number; saveState: "saved" | "saving" | "error"; disabled: boolean; onStep: (step: number) => void }) {
  const c = useColors();
  return <View style={{ gap: space.sm }} accessibilityLabel={`Step ${step} of 5: ${STEPS[step - 1]}`}>
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <Pill text={`Step ${step} of 5`} tone="flash" />
      <Text style={[type.small, { color: saveState === "error" ? c.bad : c.muted }]}>{saveState === "saving" ? "Saving…" : saveState === "error" ? "Not saved on phone" : "Saved on this phone"}</Text>
    </View>
    <View style={{ flexDirection: "row", gap: 5 }} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: 5, now: step }}>
      {STEPS.map((label, index) => <View key={label} style={{ flex: 1, height: 5, borderRadius: 99, backgroundColor: index < step ? c.accent : c.line }} />)}
    </View>
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5 }}>
      {STEPS.map((label, index) => <Pressable key={label} disabled={disabled || index + 1 > maxStep} onPress={() => onStep(index + 1)}
        accessibilityRole="button" accessibilityLabel={`Step ${index + 1}: ${label}`} accessibilityState={{ selected: step === index + 1, disabled: disabled || index + 1 > maxStep }}
        style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: 8, borderRadius: radius.sm, backgroundColor: step === index + 1 ? c.sunk : "transparent" }}>
        <Text style={[type.small, { color: step === index + 1 ? c.accent : c.muted }]}>{index + 1}. {label}</Text>
      </Pressable>)}
    </View>
  </View>;
}

function CoverStep({ coverUrl, staged, motion, busy, uploading, hasProductFallback, supportsMotion, onChoose, onClear, onMotion }: {
  coverUrl: string | null; staged: boolean; motion: HeroMotion; busy: boolean; uploading: boolean; hasProductFallback: boolean; supportsMotion: boolean;
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
        <View style={{ alignItems: "center", gap: 6, padding: space.lg, borderRadius: radius.md, backgroundColor: c.bg }}>
          {uploading ? <ActivityIndicator color={c.ink} /> : <><Ionicons name="image-outline" size={30} color={c.ink} /><Text style={[type.label, { color: c.ink }]}>{coverUrl ? "Choose a different photo" : "Choose a cover photo"}</Text></>}
        </View>
      </Pressable>
      {staged ? <Pill text="New cover staged — not live yet" tone="good" /> : null}
      <View style={{ flexDirection: "row", gap: space.sm }}>
        <Button label={coverUrl ? "Change photo" : "Choose photo"} style={{ flex: 1 }} loading={uploading} disabled={busy} onPress={onChoose} />
        {staged ? <Button label="Use current" variant="secondary" disabled={busy} onPress={onClear} /> : null}
      </View>
      <Notice text={hasProductFallback ? "No cover is required: if your store has no current cover, its newest live product photo is used as the storefront fallback." : "No cover is required. Use a dedicated cover, or publish a product separately if you want a live-product photo fallback."} />
      {supportsMotion ? <View style={{ gap: space.sm }}>
        <Text style={[type.heading, { color: c.ink }]}>Hero movement</Text>
        <Segmented value={motion} onChange={(value) => { if (!busy && isMotion(value)) onMotion(value); }} options={[{ value: "still", label: "Still" }, { value: "drift", label: "Drift" }, { value: "pan", label: "Pan" }]} />
        <Text style={[type.small, { color: c.muted }]}>Drift and pan are gentle storefront image effects. They do not generate a video, a 3D model, or a new product view.</Text>
      </View> : <Notice text="Classic themes keep their original image behavior. Select a premium theme to configure still, drift or pan." />}
    </View>
  );
}

function WordsStep({ draft, theme, suggestions, busy, generating, allowance, onPatch, onGenerate, onUse }: {
  draft: StorefrontDraft; theme: StoreTheme | null; suggestions: StorefrontCopy | null; busy: boolean; generating: boolean; allowance: string;
  onPatch: (values: Partial<StorefrontDraft>) => void; onGenerate: () => void; onUse: <K extends keyof StorefrontCopy>(field: K) => void;
}) {
  const c = useColors();
  const premium = Boolean(theme && isPremiumTheme(theme));
  return (
    <View style={{ gap: space.lg }}>
      <View style={{ gap: 6 }}>
        <H1>Write the words</H1>
        <Body muted>Everything below is editable. Theme demos may use sample wording, not facts about your store; nothing is copied into these fields unless you choose it.</Body>
      </View>
      <Field editable={!busy} label="Store name" value={draft.store_name} onChangeText={(store_name) => onPatch({ store_name })} maxLength={80} />
      {!premium ? <Notice text="This classic theme uses your tagline as its headline and About text for its supporting story. Separate hero headline, eyebrow, button and motion settings are used only by premium themes." /> : null}
      <ThemeCopySuggestions theme={theme} disabled={busy} onUse={(field, value) => onPatch({ [field]: value })} />
      <Field editable={!busy} label="Notes for AI (optional)" hint="Describe your products, mood or audience. Don’t add claims you can’t support." value={draft.notes} onChangeText={(notes) => onPatch({ notes })} multiline maxLength={700} placeholder="Small-batch candle studio with quiet, warm evenings…" />
      <View style={{ gap: 6 }}>
        <Text style={[type.label, { color: c.ink }]}>Writing tone</Text>
        <Segmented value={draft.tone} onChange={(tone) => { if (!busy) onPatch({ tone }); }} options={[{ value: "considered", label: "Considered" }, { value: "warm", label: "Warm" }, { value: "bold", label: "Bold" }]} />
      </View>
      <View style={{ backgroundColor: c.surface, borderRadius: radius.lg, padding: space.md, gap: 6 }}>
        <Text style={[type.heading, { color: c.ink }]}>Optional AI suggestions</Text>
        <Text style={[type.small, { color: c.ink }]}>This uses one photo-to-page allowance ({allowance} used). Manual editing is always available and uses no AI allowance. Suggestions never save or go live by themselves.</Text>
        <Button label="Get AI suggestions" variant="secondary" loading={generating} disabled={busy} onPress={onGenerate} />
      </View>
      {suggestions ? <SuggestionList premium={premium} suggestions={suggestions} disabled={busy} onUse={onUse} /> : null}
      <View style={{ gap: space.md }}>
        {premium ? <>
        <Field editable={!busy} label="Hero headline" hint="Up to 100 characters" value={draft.hero_title} onChangeText={(hero_title) => onPatch({ hero_title })} maxLength={100} />
        <Field editable={!busy} label="Hero subheadline" hint="Up to 220 characters" value={draft.hero_subtitle} onChangeText={(hero_subtitle) => onPatch({ hero_subtitle })} multiline maxLength={220} />
        <Field editable={!busy} label="Eyebrow" hint="A small line above the headline" value={draft.hero_eyebrow} onChangeText={(hero_eyebrow) => onPatch({ hero_eyebrow })} maxLength={48} />
        <Field editable={!busy} label="Button label" hint="For example: Shop the collection" value={draft.hero_cta} onChangeText={(hero_cta) => onPatch({ hero_cta })} maxLength={32} />
        </> : null}
        <Field editable={!busy} label="Tagline" value={draft.tagline} onChangeText={(tagline) => onPatch({ tagline })} maxLength={160} />
        <Field editable={!busy} label="About your store" value={draft.about} onChangeText={(about) => onPatch({ about })} multiline maxLength={600} />
        <Field editable={!busy} label="Announcement" hint="Optional short strip above your menu" value={draft.announcement} onChangeText={(announcement) => onPatch({ announcement })} maxLength={90} />
      </View>
    </View>
  );
}

function ThemeCopySuggestions({ theme, disabled, onUse }: { theme: StoreTheme | null; disabled: boolean; onUse: (field: "hero_title" | "hero_subtitle", value: string) => void }) {
  const c = useColors();
  const choices = [
    { field: "hero_title" as const, label: "Suggested headline", value: theme?.copy?.title },
    { field: "hero_subtitle" as const, label: "Suggested subheadline", value: theme?.copy?.subtitle },
  ].filter((choice): choice is { field: "hero_title" | "hero_subtitle"; label: string; value: string } => Boolean(choice.value));
  if (!choices.length) return null;
  return (
    <View style={{ gap: space.sm, backgroundColor: c.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: c.line, padding: space.md }}>
      <Text style={[type.heading, { color: c.ink }]}>Theme wording ideas — optional</Text>
      <Text style={[type.small, { color: c.muted }]}>These are illustrative suggestions from {theme?.name}, not claims about your store. Use one only if you want to edit it as your own.</Text>
      {choices.map((choice) => (
        <View key={choice.field} style={{ gap: 5 }}>
          <Text style={[type.label, { color: c.muted }]}>{choice.label}</Text>
          <Text style={[type.small, { color: c.ink }]}>{choice.value}</Text>
          <Button label={`Use suggested ${choice.field === "hero_title" ? "headline" : "subheadline"}`} variant="secondary" disabled={disabled} onPress={() => onUse(choice.field, choice.value)} />
        </View>
      ))}
    </View>
  );
}

function SuggestionList({ suggestions, disabled, onUse, premium }: { premium: boolean; suggestions: StorefrontCopy; disabled: boolean; onUse: <K extends keyof StorefrontCopy>(field: K) => void }) {
  const c = useColors();
  const labels: { key: keyof StorefrontCopy; label: string }[] = [
    { key: "hero_title", label: "Hero headline" }, { key: "hero_subtitle", label: "Hero subheadline" }, { key: "hero_eyebrow", label: "Eyebrow" },
    { key: "hero_cta", label: "Button label" }, { key: "tagline", label: "Tagline" }, { key: "about", label: "About" }, { key: "announcement", label: "Announcement" },
  ];
  return (
    <View style={{ gap: space.sm, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, padding: space.md }}>
      <Text style={[type.heading, { color: c.ink }]}>AI suggestions — review before using</Text>
      {labels.filter(({ key }) => premium || !key.startsWith("hero_")).map(({ key, label }) => (
        <View key={key} style={{ gap: 5, paddingTop: space.sm, borderTopWidth: key === "hero_title" ? 0 : 1, borderColor: c.line }}>
          <Text style={[type.label, { color: c.muted }]}>{label}</Text>
          <Text style={[type.small, { color: c.ink }]}>{suggestions[key] || "No suggestion"}</Text>
          <Button label={`Use ${label.toLowerCase()}`} variant="secondary" disabled={disabled || !suggestions[key]} onPress={() => onUse(key)} />
        </View>
      ))}
    </View>
  );
}

function ProductsStep({ products, busy, onAddPhoto, onCreateDigital, onReviewProduct }: { products: Product[]; busy: boolean; onAddPhoto: () => void; onCreateDigital: () => void; onReviewProduct: (id: string) => void }) {
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
        {products.map((product) => <ProductRow key={product.id} product={product} disabled={busy} onPress={() => onReviewProduct(product.id)} />)}
      </View>
      <Button label="Add a product from a photo" icon={<Ionicons name="camera-outline" size={19} color={c.onAccent} />} loading={busy} disabled={busy} onPress={onAddPhoto} />
      <Button label="Create a digital product" variant="secondary" disabled={busy} onPress={onCreateDigital} />
      <Notice text="When you return, this step refreshes your product list. Product publishing remains a separate choice in the normal product flow." />
    </View>
  );
}

function ProductRow({ product, disabled, onPress }: { product: Product; disabled: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable disabled={disabled} accessibilityRole="button" accessibilityLabel={`Review ${product.title}`} onPress={onPress} style={{ flexDirection: "row", alignItems: "center", gap: space.sm, paddingVertical: space.sm, minHeight: 56, borderTopWidth: 1, borderColor: c.line }}>
      <View style={{ width: 42, height: 42, backgroundColor: c.sunk, borderRadius: radius.sm, overflow: "hidden" }}>{product.image_url ? <Image source={{ uri: product.image_url }} contentFit="cover" style={{ flex: 1 }} /> : null}</View>
      <View style={{ flex: 1, gap: 2 }}><Text numberOfLines={1} style={[type.label, { color: c.ink }]}>{product.title}</Text><Text style={[type.small, { color: c.muted }]}>{product.status === "live" ? "Live" : "Draft"} · {product.price.toFixed(2)}</Text></View>
      <Ionicons name="chevron-forward" size={18} color={c.muted} />
    </Pressable>
  );
}

function ReviewStep({ draft, theme, coverUrl, seller, products, onPreview, onApply, busy }: {
  draft: StorefrontDraft; theme: StoreTheme | null; coverUrl: string | null; seller: Me; products: Product[];
  onPreview: () => void; onApply: () => void; busy: Busy;
}) {
  const c = useColors();
  const readiness = storefrontReadiness(seller, products);
  const premium = Boolean(theme && isPremiumTheme(theme));
  const liveProductCount = readiness.liveProducts;
  const previewing = busy === "preview";
  const applying = busy === "apply";
  return (
    <View style={{ gap: space.lg }}>
      <View style={{ gap: 6 }}>
        <H1>Review and deploy</H1>
        <Body muted>Your local summary below includes your staged words and cover. It is not a public preview.</Body>
      </View>
      <View style={{ borderRadius: radius.lg, overflow: "hidden", backgroundColor: theme?.colors.bg ?? c.sunk, borderWidth: 1, borderColor: theme?.colors.line ?? c.line }}>
        <View style={{ minHeight: 190, backgroundColor: theme?.colors.panel ?? c.surface }}>
          {coverUrl ? <Image source={{ uri: coverUrl }} contentFit="cover" style={{ position: "absolute", inset: 0 }} /> : null}
          <View style={{ padding: space.lg, paddingTop: 40, gap: 5 }}>
            <View style={{ backgroundColor: c.bg, borderRadius: radius.md, padding: space.md, gap: 5 }}>
            <Text style={{ color: c.ink, fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1 }}>{premium ? draft.hero_eyebrow || theme?.copy?.eyebrow || "YOUR COLLECTION" : "CLASSIC STOREFRONT"}</Text>
            <Text numberOfLines={2} style={{ color: c.ink, fontFamily: fonts.display, fontSize: 29, lineHeight: 31 }}>{(premium ? draft.hero_title : "") || draft.tagline || draft.store_name || "Your store"}</Text>
            <Text numberOfLines={2} style={{ color: c.muted, fontFamily: fonts.body, fontSize: 13 }}>{(premium ? draft.hero_subtitle : "") || ((premium || draft.tagline) ? draft.about.split(/[.!?]/)[0] : "") || ""}</Text>
            </View>
          </View>
        </View>
        <View style={{ padding: space.md, gap: 4 }}>
          <Text style={[type.heading, { color: theme?.colors.ink ?? c.ink }]}>{draft.store_name || "Your store"} · {theme?.name || "Store look"}</Text>
          <Text style={[type.small, { color: theme?.colors.muted ?? c.muted }]}>Hero: {premium ? draft.hero_motion : "Original classic behavior"} · {liveProductCount} live product{liveProductCount === 1 ? "" : "s"} in preview</Text>
        </View>
      </View>
      <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, padding: space.md, gap: space.sm }}>
        <Text style={[type.heading, { color: c.ink }]}>Ready to take orders?</Text>
        <Text style={[type.small, { color: c.ink }]}>{liveProductCount} live · {readiness.draftProducts} draft products</Text>
        <Text style={[type.small, { color: c.ink }]}>Plan: {readiness.liveAllowed ? "This store can go live" : "Build and preview only"} · Payments: {readiness.stripeReady ? "Connected" : "Stripe setup needed"}</Text>
        {!readiness.canTakeOrders ? <Notice text="You can apply the design now. To take orders, this store needs a live-store plan, Stripe setup and a published product. Applying the design does not enable these." /> : null}
      </View>
      <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, padding: space.md, gap: space.sm }}>
        <Text style={[type.heading, { color: c.ink }]}>Private storefront preview</Text>
        <Text style={[type.small, { color: c.muted }]}>Preview shows all staged cover, words and hero motion without changing your public storefront. Only existing live products appear. Store and product links navigate to your currently applied public store. This private preview expires after 30 minutes.</Text>
        <Button label="Preview my storefront" variant="secondary" icon={<Ionicons name="eye-outline" size={18} color={c.ink} />} loading={previewing} disabled={busy !== null} onPress={onPreview} />
      </View>
      <View style={{ backgroundColor: c.surface, borderRadius: radius.lg, padding: space.md, gap: 6 }}>
        <Text style={[type.heading, { color: c.ink }]}>Ready to change your public storefront?</Text>
        <Text style={[type.small, { color: c.ink }]}>Apply updates the selected look, cover and words together. It does not publish products, alter your plan, or change Stripe or checkout.</Text>
      </View>
      <Button label="Apply to public storefront" loading={applying} disabled={busy !== null} onPress={onApply} />
    </View>
  );
}

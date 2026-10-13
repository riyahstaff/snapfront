import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Keyboard, Platform, Pressable, Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as WebBrowser from "expo-web-browser";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Body, Button, Field, H1, Notice, Pill, Screen, Segmented } from "@/components/ui";
import { TemplatePreview } from "@/components/template-preview";
import { PhotoSwapPanel } from "@/components/photo-swap-panel";
import { seedThemeDraft, editTemplateDraft } from "@/lib/template-setup";
import { ThemePicker } from "@/components/theme-picker";
import { clearStorefrontSuggestions, loadStorefrontSuggestions, saveStorefrontSuggestions } from "@/lib/storefront-suggestions";
import { isPremiumTheme } from "@/lib/theme-catalog";
import { restoreStorefrontDraft, storefrontPatchBody, storefrontReadiness } from "@/lib/storefront-setup";
import { account, useMe } from "@/lib/account-store";
import { api, ApiError, type Me, type Product, type StorefrontCopy, type StoreTheme, type TemplatePreview as TemplatePreviewData } from "@/lib/api";
import {
  clearStorefrontDraft,
  loadStorefrontDraft,
  mergeStorefrontPhoto,
  newStorefrontDraft,
  saveStorefrontDraft,
  type HeroMotion,
  type StorefrontDraft,
} from "@/lib/storefront-draft";
import { radius, space, type, useColors } from "@/lib/theme";

type Message = { text: string; tone: "error" | "ok" | "info" } | null;
type Busy = "photo" | "copy" | "preview" | "apply" | "saving" | null;

const STEPS = ["Design", "Photos", "Words", "Products", "Finish"];
const errText = (error: unknown, fallback: string) => error instanceof ApiError ? error.message : fallback;
const isMotion = (value: string): value is HeroMotion => value === "still" || value === "drift" || value === "pan";
/**
 * A local-only setup flow. It stages copy and an owned cover-photo reference, then changes the
 * public storefront once, at Apply. It never publishes a product or changes billing or Stripe.
 */
export default function StorefrontSetupScreen() {
  const c = useColors();
  const me = useMe();
  const params = useLocalSearchParams<{ theme?: string }>();
  const requestedTheme = typeof params.theme === "string" ? params.theme.slice(0, 100) : "";
  const handledTheme = useRef("");
  const [photoSlot, setPhotoSlot] = useState<0 | 1 | 2>(0);
  const [showMotion, setShowMotion] = useState(false);
  const [previewAttempt, setPreviewAttempt] = useState(0);
  const previewRequest = useRef(0);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewRecord, setPreviewRecord] = useState<{ owner: string; patch: string; mode: "template" | "final"; revision: number; data: TemplatePreviewData } | null>(null);
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
  const [draftSelection, setDraftSelection] = useState(-1);
  const [draftStoreId, setDraftStoreId] = useState<string | null>(null);
  const operationRef = useRef(false);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const saveRevision = useRef(0);
  const [completed, setCompleted] = useState<{ seller: Me; cleared: boolean } | null>(null);
  const completedStoreRef = useRef<string | null>(null);
  const selectedTheme = themes.find((theme) => theme.id === draft?.theme) ?? null;
  const newestProductPhoto = products.find((product) => product.status === "live" && product.image_url)?.image_url ?? null;
  const coverUrl = draft?.banner_url ?? me?.banner_url ?? newestProductPhoto;
  const previewMode = draft?.step === 5 ? "final" : "template";
  const previewPatch = draft && me ? JSON.stringify(storefrontPatchBody(draft, me, previewMode === "template")) : null;
  const previewData = previewRecord?.owner === draftStoreId && previewRecord.mode === previewMode && previewRecord.data.theme.id === draft?.theme ? previewRecord.data : null;
  const finalPreviewReady = previewMode === "final" && Boolean(previewData) && previewRecord?.patch === previewPatch && !previewLoading && !previewError;
  const missingPhotos = previewData?.photo_slots.filter((photo) => !photo.image_url) ?? [];
  const sampleWords = draft?.sample_fields ?? [];

  useEffect(() => {
    if (loading || !draftStoreId || !previewPatch || draft?.step === 1 || me?.id !== draftStoreId || completed) return;
    let alive = true;
    const owner = draftStoreId;
    const selection = api.storeRevision();
    const request = ++previewRequest.current;
    const timer = setTimeout(() => {
      if (!alive) return;
      setPreviewLoading(true); setPreviewError(null);
      void api.templatePreview(JSON.parse(previewPatch), previewMode, owner).then((data) => {
        if (!alive || selection !== api.storeRevision() || account.get()?.id !== owner) return;
        setPreviewRecord({ owner, patch: previewPatch, mode: previewMode, revision: request, data });
        if (previewAttempt > 0) setMessage({ text: "Preview refreshed. This refresh used no AI credits. Your live store is unchanged.", tone: "ok" });
      }).catch((error) => {
        if (!alive || selection !== api.storeRevision() || account.get()?.id !== owner) return;
        setPreviewError(errText(error, "Your draft is safe. The live design preview could not load. Check your connection and retry."));
      }).finally(() => { if (alive) setPreviewLoading(false); });
    }, 350);
    return () => { alive = false; clearTimeout(timer); };
  }, [loading, draftStoreId, previewPatch, previewMode, previewAttempt, draft?.step, me?.id, completed]);

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
        const resumeTheme = nextThemes.find((theme) => theme.id === restored.draft.theme);
        const seedResumed = Boolean(resumeTheme && !restored.draft.template_theme && restored.draft.step >= 2);
        if (resumeTheme && seedResumed) restored.draft = seedThemeDraft(restored.draft, resumeTheme);
        const incoming = nextThemes.find((theme) => theme.id === requestedTheme);
        const incomingKey = `${seller.id}:${requestedTheme}`;
        const startIncoming = Boolean(incoming && handledTheme.current !== incomingKey);
        if (incoming && startIncoming) {
          restored.draft = newStorefrontDraft({ ...seedThemeDraft(restored.draft, incoming), step: 2, max_step: Math.max(2, restored.draft.max_step) });
          handledTheme.current = incomingKey;
        }
        if (storeIdRef.current !== seller.id) { setCompleted(null); setSuggestions(null); completedStoreRef.current = null; }
        storeIdRef.current = seller.id;
        storeSelectionRef.current = selection;
        setDraftSelection(selection);
        setDraftStoreId(seller.id);
        draftRef.current = restored.draft;
        setSuggestions(savedSuggestions);
        setThemes(nextThemes); setProducts(nextProducts); setDraft(restored.draft);
        if (!saved || restored.replaced || startIncoming || seedResumed) {
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
  }, [loadAttempt, requestedTheme]));

  function ownsDraft(owner = storeIdRef.current) {
    return Boolean(owner && storeIdRef.current === owner && account.get()?.id === owner && storeSelectionRef.current === api.storeRevision());
  }
  function patch(values: Partial<StorefrontDraft>, markEdited = true) {
    if (!draftRef.current || !ownsDraft() || operationRef.current) return;
    const next = markEdited ? editTemplateDraft(draftRef.current, values) : newStorefrontDraft({ ...draftRef.current, ...values });
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
    const current = draftRef.current;
    const theme = themes.find((item) => item.id === current?.theme);
    const seeded = current && theme && step >= 2 && current.template_theme !== theme.id ? seedThemeDraft(current, theme) : current;
    patch({ ...seeded, step, max_step: Math.max(current?.max_step ?? 1, step) }, false);
    setMessage(null);
  }

  function chooseTheme(id: string) {
    const theme = themes.find((item) => item.id === id);
    if (!theme || !draftRef.current || busy || !ownsDraft()) return;
    void patch({ ...seedThemeDraft(draftRef.current, theme), step: 2, max_step: Math.max(2, draftRef.current.max_step) }, false);
    setPhotoSlot(0); setMessage(null);
  }

  function discardStagedPhoto(file: string | null | undefined, owner = storeIdRef.current) {
    if (owner === storeIdRef.current && (draftRef.current?.banner_file === file || draftRef.current?.photo_files?.includes(file ?? null))) return;
    if (file && owner) void api.discardStorefrontPhoto(file, owner).catch(() => { /* Cleanup is best-effort; 409 means it is now applied. */ });
  }

  function photoValues(current: StorefrontDraft, slot: 0 | 1 | 2, photo: { image_file: string; image_url: string }): Partial<StorefrontDraft> {
    if (slot === 0) return { banner_file: photo.image_file, banner_url: photo.image_url };
    const files = [current.photo_files?.[0] ?? null, current.photo_files?.[1] ?? null];
    const urls = [current.photo_urls?.[0] ?? null, current.photo_urls?.[1] ?? null];
    files[slot - 1] = photo.image_file; urls[slot - 1] = photo.image_url;
    return { photo_files: files, photo_urls: urls };
  }

  async function usePhoto(slot: 0 | 1 | 2, photo: { image_file: string; image_url: string }) {
    if (busy || operationRef.current || !ownsDraft() || !draftRef.current) throw new Error("Open the same store’s photo step and try again. Your AI photo has not been used.");
    const owner = storeIdRef.current;
    const saved = await patch(photoValues(draftRef.current, slot, photo));
    if (!saved) throw new Error("Couldn’t save this photo in your setup draft. Retry saving before using it.");
    if (ownsDraft(owner)) setMessage({ text: "Your photo is in the design. You can see it below. Nothing is public yet.", tone: "ok" });
  }

  async function choosePhoto(slot: 0 | 1 | 2, source: "camera" | "library") {
    if (busy || operationRef.current || !ownsDraft() || !draftRef.current) return;
    const owner = storeIdRef.current!;
    const initiatingDraft = draftRef.current;
    operationRef.current = true; setBusy("photo"); setMessage(null);
    try {
      if (source === "camera") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) { if (ownsDraft(owner)) setMessage({ text: "Allow camera access, or use Upload photo instead.", tone: "error" }); return; }
      } else if (Platform.OS === "ios" && Number.parseInt(String(Platform.Version), 10) <= 10) {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) { if (ownsDraft(owner)) setMessage({ text: "Allow photo access to choose your picture.", tone: "error" }); return; }
      }
      const options = { mediaTypes: ["images"] as ImagePicker.MediaType[], allowsEditing: false, quality: 0.8, base64: true };
      const result = source === "camera" ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      const asset = result.assets?.[0];
      if (result.canceled) return;
      if (!asset?.base64) { if (ownsDraft(owner)) setMessage({ text: "That photo could not be read. Try another picture.", tone: "error" }); return; }
      if (!ownsDraft(owner)) return;
      const previousFile = slot === 0 ? draftRef.current?.banner_file : draftRef.current?.photo_files?.[slot - 1];
      const staged = await api.stageStorefrontPhoto(asset.base64, asset.mimeType || "image/jpeg", owner);
      if (!ownsDraft(owner)) {
        try { await mergeStorefrontPhoto(owner, slot, staged, initiatingDraft); } catch { discardStagedPhoto(staged.image_file, owner); }
        return;
      }
      operationRef.current = false;
      const saved = await patch(photoValues(draftRef.current!, slot, staged));
      if (!saved) return;
      if (previousFile && previousFile !== staged.image_file) discardStagedPhoto(previousFile, owner);
      if (ownsDraft(owner)) setMessage({ text: "Photo replaced. The design stays the same, and your live store has not changed.", tone: "ok" });
    } catch (error) {
      if (ownsDraft(owner)) setMessage({ text: errText(error, "Couldn’t add that photo. Your earlier design is safe."), tone: "error" });
    } finally { operationRef.current = false; setBusy(null); }
  }

  function reuseMainPhoto() {
    if (!draftRef.current || !ownsDraft() || busy) return;
    const file = draftRef.current.banner_file || me?.banner_file;
    const url = draftRef.current.banner_url || me?.banner_url;
    if (!file || !url) { setMessage({ text: "Add or choose your main photo first. Then you can use it in the other spots, too.", tone: "info" }); return; }
    void patch({ photo_files: [file, file], photo_urls: [url, url] });
  }

  function clearPhoto(slot: 0 | 1 | 2) {
    if (!draftRef.current || !ownsDraft() || busy) return;
    if (slot === 0) { void patch({ banner_file: me?.banner_file ?? null, banner_url: me?.banner_url ?? null }); return; }
    const files = [draftRef.current.photo_files?.[0] ?? null, draftRef.current.photo_files?.[1] ?? null];
    const urls = [draftRef.current.photo_urls?.[0] ?? null, draftRef.current.photo_urls?.[1] ?? null];
    files[slot - 1] = null; urls[slot - 1] = null;
    void patch({ photo_files: files, photo_urls: urls });
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
      if (ownsDraft(owner)) setMessage({ text: errText(error, "Couldn’t write suggestions. You can keep editing manually."), tone: "error" });
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
    if (!finalPreviewReady || missingPhotos.length || sampleWords.length || saveState !== "saved") {
      setMessage({ text: "Check the photo and word reminders below before finishing. Your draft is safe.", tone: "info" }); return;
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
      <H1>Your store design is saved</H1>
      <Body>Your design, photos and words are now saved for {completed.seller.store_name}.</Body>
      <Notice text="Products remain draft or live exactly as before. Your plan, Stripe connection and checkout have not changed." />
      {!completed.cleared ? <Notice text="The design was applied, but this phone’s old resume draft could not be cleared." /> : null}
      <Text selectable style={[type.small, { color: c.ink }]}>{completed.seller.store_url}</Text>
      <Button label="Open my storefront" onPress={() => { void WebBrowser.openBrowserAsync(completed.seller.store_url).catch(() => setMessage({ text: "Couldn’t open the link. Your storefront was still applied successfully.", tone: "error" })); }} />
      <Button label="Back to My store" variant="secondary" onPress={() => router.navigate("/store")} />
      <Notice text={message?.text ?? null} tone={message?.tone === "error" ? "error" : "info"} />
    </Screen>
  );

  const nextLabel = ["Use this design", "Next: change the words", "Next: add products", "Next: check my store"][draft.step - 1];
  const interactionLocked = busy !== null;
  const previewElement = <TemplatePreview renderRevision={previewRecord?.revision ?? 0} preview={previewData} loading={previewLoading} error={previewError} theme={selectedTheme}
    onRetry={() => { if (previewLoading || !ownsDraft()) return; setPreviewLoading(true); setPreviewError(null); setPreviewAttempt((value) => value + 1); }}
    onPhoto={(slot) => { if (interactionLocked) return; setPhotoSlot(slot); if (draft.step !== 2) go(2); }}
    onWords={() => { if (!interactionLocked && draft.step !== 3) go(3); }} />;
  return (
    <Screen key={`${draftStoreId}-${draft.step}`}>
      <WizardProgress step={draft.step} maxStep={draft.max_step} saveState={saveState} disabled={interactionLocked} onStep={go} />
      {draft.step === 1 ? <View style={{ gap: space.md }}>
        <H1>Pick a finished design</H1>
        <Body muted>Choose the look you like. We’ll keep its layout and show the example photos and words while you make it yours. You do not have to design a page.</Body>
        <Notice text="1. Pick a design. 2. Swap its photos. 3. Change its words. 4. Add your products. 5. Check and finish. Your live store stays unchanged until you finish." />
        <ThemePicker themes={themes} selected={draft.theme} current={me?.theme} storeName={draft.store_name || "Your shop"} photo={coverUrl}
          browse={draft.browse} onBrowse={(browse) => patch({ browse })} onSelect={chooseTheme} disabled={interactionLocked} />
      </View> : null}
      {draft.step === 2 ? <View style={{ gap: space.md }}>
        <H1>Swap the photos</H1>
        <Body muted>This is {selectedTheme?.name || "your design"}, not an empty canvas. Tap a pictured photo below, or pick its photo button. Add your picture and we’ll put it in the same place.</Body>
        {previewElement}
        <PhotoSwapPanel slot={photoSlot} slots={previewData?.photo_slots ?? []} storeId={draftStoreId!} storeRevision={draftSelection}
          draft={draft} products={products} busy={interactionLocked} onSelectSlot={setPhotoSlot}
          onUpload={(slot, source) => { void choosePhoto(slot, source); }} onUsePhoto={usePhoto} onReuseMain={reuseMainPhoto} onClear={clearPhoto} />
        <Button label={showMotion ? "Hide optional movement" : "Optional: add gentle photo movement"} variant="ghost" disabled={interactionLocked} onPress={() => setShowMotion(!showMotion)} />
        {showMotion ? selectedTheme && isPremiumTheme(selectedTheme) ? <View style={{ gap: 6 }}>
          <Segmented value={draft.hero_motion} onChange={(value) => { if (isMotion(value)) void patch({ hero_motion: value }); }} options={[{ value: "still", label: "Still" }, { value: "drift", label: "Drift" }, { value: "pan", label: "Pan" }]} />
          <Body muted>Only the picture moves gently. Your words and buttons stay still.</Body>
        </View> : <Notice text="This classic design keeps its original photo style." /> : null}
      </View> : null}
      {draft.step === 3 ? <View style={{ gap: space.md }}>
        <WordsStep draft={draft} theme={selectedTheme} suggestions={suggestions} busy={interactionLocked} generating={busy === "copy"}
          allowance={`${Math.min(me?.account.usage.photo ?? 0, me?.account.limits.photo ?? 0)} of ${me?.account.limits.photo ?? 0}`}
          onPatch={patch} onGenerate={getSuggestions} onUse={useSuggestion} />
        {previewElement}
      </View> : null}
      {draft.step === 4 ? <View style={{ gap: space.md }}>
        <ProductsStep products={products} busy={interactionLocked} onAddPhoto={() => { void leaveForProduct("/snap"); }} onCreateDigital={() => { void leaveForProduct("/create"); }} onReviewProduct={(id) => { void leaveForProduct({ pathname: "/product/[id]", params: { id } }); }} />
        {previewElement}
      </View> : null}
      {draft.step === 5 ? <View style={{ gap: space.md }}>
        <H1>Check your store</H1>
        <Body muted>This is your real store design. Example photos and example products are removed here. Check your pictures and words before you finish.</Body>
        {previewElement}
        <ReviewStep draft={draft} theme={selectedTheme} seller={me!} products={products} busy={busy} ready={finalPreviewReady && !missingPhotos.length && !sampleWords.length && saveState === "saved"}
          missingPhotos={missingPhotos} onFixPhotos={() => go(2)} onFixWords={() => go(3)} onFixProducts={() => go(4)}
          onReviewWords={() => { void patch({ sample_fields: [] }, false); }} onPreview={preview} onApply={apply} />
      </View> : null}
      {saveState === "error" ? <Button label="Retry saving draft" variant="secondary" disabled={interactionLocked} onPress={retrySave} /> : null}
      <Notice text={message?.text ?? null} tone={message?.tone === "ok" ? "ok" : message?.tone === "error" ? "error" : "info"} />
      {draft.step < 5 ? <View style={{ flexDirection: "row", gap: space.sm, marginTop: space.sm }}>
        {draft.step > 1 ? <Button label="Back" variant="secondary" style={{ flex: 0.7 }} disabled={interactionLocked} onPress={() => go(draft.step - 1)} /> : null}
        <Button label={nextLabel} style={{ flex: 1.3 }} disabled={interactionLocked || (draft.step === 1 && !selectedTheme)} onPress={() => go(draft.step + 1)} />
      </View> : <Button label="Back to products" variant="secondary" disabled={interactionLocked} onPress={() => go(4)} />}
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

function WordsStep({ draft, theme, suggestions, busy, generating, allowance, onPatch, onGenerate, onUse }: {
  draft: StorefrontDraft; theme: StoreTheme | null; suggestions: StorefrontCopy | null; busy: boolean; generating: boolean; allowance: string;
  onPatch: (values: Partial<StorefrontDraft>) => void; onGenerate: () => void; onUse: <K extends keyof StorefrontCopy>(field: K) => void;
}) {
  const c = useColors();
  const [advanced, setAdvanced] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const premium = Boolean(theme && isPremiumTheme(theme));
  return <View style={{ gap: space.md }}>
    <H1>Change the words</H1>
    <Body muted>We’ve filled in starter words so you can see the finished look. Change them to match your shop. You can see your changes in the design below.</Body>
    <Field editable={!busy} label="What is your shop called?" value={draft.store_name} onChangeText={(store_name) => onPatch({ store_name })} maxLength={80} placeholder="For example: Maya’s Candle Shop" />
    <Field editable={!busy} label="Big headline" hint="A short line that tells people what you sell." value={premium ? draft.hero_title : draft.tagline}
      onChangeText={(value) => onPatch(premium ? { hero_title: value } : { tagline: value })} maxLength={premium ? 100 : 160} />
    <Field editable={!busy} label="Tell people a little more" hint="One or two simple sentences about your products." value={premium ? draft.hero_subtitle : draft.about}
      onChangeText={(value) => onPatch(premium ? { hero_subtitle: value } : { about: value })} multiline maxLength={premium ? 220 : 600} />
    <Button label={aiOpen ? "Hide AI writing help" : "Ask AI to help me write"} variant="secondary" disabled={busy} onPress={() => setAiOpen(!aiOpen)} />
    {aiOpen ? <View style={{ gap: space.sm, backgroundColor: c.surface, padding: space.md, borderRadius: radius.lg }}>
      <Field editable={!busy} label="Tell AI what you sell" hint="For example: I make lavender candles for cozy evenings." value={draft.notes} onChangeText={(notes) => onPatch({ notes })} multiline maxLength={700} />
      <Segmented value={draft.tone} onChange={(tone) => { if (!busy) onPatch({ tone }); }} options={[{ value: "considered", label: "Simple" }, { value: "warm", label: "Friendly" }, { value: "bold", label: "Bold" }]} />
      <Body muted>Uses one AI writing request from your plan ({allowance} used). Typing your own words is free. AI suggestions do not change your store until you choose them.</Body>
      <Button label="Suggest words" loading={generating} disabled={busy} onPress={onGenerate} />
      {suggestions ? <SuggestionList premium={premium} suggestions={suggestions} disabled={busy} onUse={onUse} /> : null}
    </View> : null}
    <Button label={advanced ? "Hide extra words" : "Optional: change button, small text and story"} variant="ghost" disabled={busy} onPress={() => setAdvanced(!advanced)} />
    {advanced ? <View style={{ gap: space.md }}>
      {premium ? <>
        <Field editable={!busy} label="Small line above the headline" value={draft.hero_eyebrow} onChangeText={(hero_eyebrow) => onPatch({ hero_eyebrow })} maxLength={48} />
        <Field editable={!busy} label="Shop button words" value={draft.hero_cta} onChangeText={(hero_cta) => onPatch({ hero_cta })} maxLength={32} />
        <Field editable={!busy} label="Short shop tagline" value={draft.tagline} onChangeText={(tagline) => onPatch({ tagline })} maxLength={160} />
        <Field editable={!busy} label="Your shop’s story" value={draft.about} onChangeText={(about) => onPatch({ about })} multiline maxLength={600} />
      </> : null}
      <Field editable={!busy} label="Message at the top (optional)" hint="Only promise shipping or offers you can actually provide." value={draft.announcement} onChangeText={(announcement) => onPatch({ announcement })} maxLength={90} />
    </View> : null}
    <Notice text="Starter words are ideas, not facts about your business. In the last step you’ll review every word before saving your design." />
  </View>;
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
        <H1>Add your real products</H1>
        <Body muted>Tap Add a product from a photo. Take or upload a picture, check the product name and price, then save it. Your real items replace the example product cards; no design work is needed.</Body>
      </View>
      <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, padding: space.lg, gap: space.sm }}>
        <Text style={[type.heading, { color: c.ink }]}>{products.length ? `${products.length} product${products.length === 1 ? "" : "s"} in this store` : "No products yet"}</Text>
        <Text style={[type.small, { color: c.muted }]}>{products.length ? `${products.filter((product) => product.status === "live").length} live · ${products.filter((product) => product.status !== "live").length} draft` : "The items in the design are examples. Add your own item to replace them."}</Text>
        {products.map((product) => <ProductRow key={product.id} product={product} disabled={busy} onPress={() => onReviewProduct(product.id)} />)}
      </View>
      <Button label="Add a product from a photo" icon={<Ionicons name="camera-outline" size={19} color={c.onAccent} />} loading={busy} disabled={busy} onPress={onAddPhoto} />
      <Button label="Create a digital product" variant="secondary" disabled={busy} onPress={onCreateDigital} />
      <Notice text="Your setup is saved before you leave. Come back here to see your item inside the design. A draft item is visible while editing, but customers only see published items." />
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

function ReviewStep({ draft, theme, seller, products, onPreview, onApply, busy, ready, missingPhotos, onFixPhotos, onFixWords, onFixProducts, onReviewWords }: {
  draft: StorefrontDraft; theme: StoreTheme | null; seller: Me; products: Product[]; onPreview: () => void; onApply: () => void; busy: Busy;
  ready: boolean; missingPhotos: TemplatePreviewData["photo_slots"]; onFixPhotos: () => void; onFixWords: () => void; onFixProducts: () => void; onReviewWords: () => void;
}) {
  const c = useColors();
  const readiness = storefrontReadiness(seller, products);
  const fields: { key: keyof StorefrontCopy; label: string }[] = [
    { key: "hero_title", label: "Headline" }, { key: "hero_subtitle", label: "Short description" }, { key: "hero_eyebrow", label: "Small headline" },
    { key: "hero_cta", label: "Shop button" }, { key: "tagline", label: "Tagline" }, { key: "about", label: "Story" }, { key: "announcement", label: "Top message" },
  ];
  const sampleFields = draft.sample_fields ?? [];
  return <View style={{ gap: space.md }}>
    <Pill text={`${theme?.name || "Your design"} · ${draft.store_name}`} />
    {missingPhotos.length ? <View style={{ gap: space.sm }}>
      <Notice text={`Add your own photo for ${missingPhotos.map((photo) => photo.label).join(", ")}. Example pictures will not be published. You can use the same main photo in the other spots.`} />
      <Button label="Fix my photos" variant="secondary" disabled={busy !== null} onPress={onFixPhotos} />
    </View> : null}
    <View style={{ gap: space.sm, padding: space.md, backgroundColor: c.surface, borderRadius: radius.lg }}>
      <Text style={[type.heading, { color: c.ink }]}>Check your words</Text>
      <Text style={[type.label, { color: c.ink }]}>Shop name: {draft.store_name}</Text>
      {fields.filter(({ key }) => Boolean(draft[key])).map(({ key, label }) => <View key={key} style={{ gap: 3 }}>
        <Text style={[type.small, { color: c.muted }]}>{label}{sampleFields.includes(key) ? " · starter words" : ""}</Text>
        <Text style={[type.small, { color: c.ink }]}>{draft[key]}</Text>
      </View>)}
      {sampleFields.length ? <><Body muted>Read the starter words above. Keep them only if they describe your shop. We won’t save unreviewed example words.</Body>
        <Button label="These words describe my shop" disabled={busy !== null} onPress={onReviewWords} /></> : <Pill text="Words reviewed" tone="good" />}
      <Button label="Change my words" variant="ghost" disabled={busy !== null} onPress={onFixWords} />
    </View>
    <View style={{ gap: space.sm, padding: space.md, backgroundColor: c.surface, borderRadius: radius.lg }}>
      <Text style={[type.heading, { color: c.ink }]}>Your real products</Text>
      <Body>{readiness.liveProducts} published · {readiness.draftProducts} drafts</Body>
      {!readiness.liveProducts ? <Body muted>Example products are removed from the finished store. Add and publish your own products so customers have something to shop.</Body> : null}
      {readiness.draftProducts ? <Body muted>Draft products are saved, but customers cannot see or buy them yet. Open each item to check it and publish when you’re ready.</Body> : null}
      <Button label={products.length ? "Review my products" : "Add my first product"} variant="secondary" disabled={busy !== null} onPress={onFixProducts} />
      {!readiness.canTakeOrders ? <Notice text="You can save your design now. Taking orders also needs a live-store plan, connected payments and a published product. This button does not change your plan, payments or publish any item." /> : <Pill text="Your store can take orders" tone="good" />}
    </View>
    <Body muted>Finish saves this design, your own photos and the words above to your storefront. Sample photos and products will not be added. You can change your design later.</Body>
    <Button label="Open final preview" variant="secondary" disabled={busy !== null || !ready} loading={busy === "preview"} onPress={onPreview} />
    <Button label="Finish: save my store design" disabled={busy !== null || !ready} loading={busy === "apply"} onPress={onApply} />
    {!ready ? <Notice text="Finish unlocks when your real preview is ready, photo spots are filled, words are reviewed and this draft is saved. Use the Fix buttons above if something is missing." /> : null}
  </View>;
}

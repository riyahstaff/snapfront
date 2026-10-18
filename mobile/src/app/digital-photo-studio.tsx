import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, AppState, Platform, Pressable, Text, View } from "react-native";
import { router, Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { Body, Button, Field, H1, H2, Notice, Pill, Screen, Segmented } from "@/components/ui";
import { account, useMe } from "@/lib/account-store";
import { API_URL, api, ApiError, type Product } from "@/lib/api";
import { imageAssistant, imageJobRunning, imageRequestKey, mergeImageJob, rememberDigitalArtwork, usableImageJob, type ImageAssistantInput, type ImageAssistantOptions, type ImageJob } from "@/lib/image-assistant";
import { radius, space, type, useColors, type Colors } from "@/lib/theme";

type Tab = "artwork" | "mockups";
type ArtMode = "art" | "edit";
type Aspect = "wide" | "portrait" | "square";
type Session = { storeId: string; productId: string; storeRevision: number };
type AssistantOptions = ImageAssistantOptions;
type SourceImage = { file: string; url: string | null; label: string };
type StudioMessage = { text: string; tone: "error" | "info" | "ok" };

const MAX_FOREGROUND_POLLS = 12;
const ART_DIRECTIONS = ["Editorial", "Illustration", "Cinematic", "Soft texture"] as const;

function firstParam(value: string | string[] | undefined): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function pending(job: ImageJob | null): boolean {
  return imageJobRunning(job);
}

function artworkError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 402) return `${error.message} No artwork or mockup was started.`;
    if (error.status === 404 || error.status === 501) return "Digital Photo Studio is not active on this backend yet. No image was generated or applied.";
    if (error.status === 0) return "The request did not return. It may already be saved; retry the same request rather than creating another image. Nothing was applied.";
    return error.message;
  }
  return "That image request could not finish. No image was generated or applied.";
}

/**
 * This route only displays owner-bound server images. It never applies a candidate automatically:
 * artwork returns through the editor's scoped memory handoff and listing mockups require a review.
 */
export default function DigitalPhotoStudioScreen() {
  const c = useColors();
  const me = useMe();
  const params = useLocalSearchParams<{ product?: string | string[]; page?: string | string[]; block?: string | string[]; source?: string | string[] }>();
  const productId = firstParam(params.product);
  const pageId = firstParam(params.page);
  const blockId = firstParam(params.block);
  const sourceHint = firstParam(params.source);
  const [tab, setTab] = useState<Tab>("artwork");
  const [artMode, setArtMode] = useState<ArtMode>("art");
  const [aspect, setAspect] = useState<Aspect>("portrait");
  const [prompt, setPrompt] = useState("");
  const [framing, setFraming] = useState("");
  const [direction, setDirection] = useState<(typeof ART_DIRECTIONS)[number]>("Editorial");
  const [options, setOptions] = useState<AssistantOptions | null>(null);
  const [jobs, setJobs] = useState<ImageJob[]>([]);
  const [ownedProduct, setOwnedProduct] = useState<Product | null>(null);
  const [uploadedSource, setUploadedSource] = useState<SourceImage | null>(null);
  const [selectedSource, setSelectedSource] = useState<"cover" | "upload" | "page">("cover");
  const [pageSource, setPageSource] = useState<SourceImage | null>(null);
  const [activeJob, setActiveJob] = useState<ImageJob | null>(null);
  const [mockupPreset, setMockupPreset] = useState("chrome");
  const [busy, setBusy] = useState<"load" | "upload" | "start-art" | "start-mockup" | "apply-listing" | null>("load");
  const [polling, setPolling] = useState(false);
  const [pollAttempt, setPollAttempt] = useState(0);
  const [screenFocused, setScreenFocused] = useState(true);
  const [appActive, setAppActive] = useState(AppState.currentState === "active");
  const [message, setMessage] = useState<StudioMessage | null>(null);
  const mountedRef = useRef(true);
  const loadedStoreRef = useRef<string | null>(null);
  const [retryRequest, setRetryRequest] = useState<{ input: ImageAssistantInput; session: Session } | null>(null);

  const beginSession = useCallback((): Session | null => {
    const storeId = account.get()?.id;
    if (!storeId || !productId || me?.id !== storeId || (api.selectedStore() && api.selectedStore() !== storeId)) return null;
    return { storeId, productId, storeRevision: api.storeRevision() };
  }, [me?.id, productId]);

  const ownsSession = useCallback((started: Session) => {
    return mountedRef.current
      && account.get()?.id === started.storeId
      && (!api.selectedStore() || api.selectedStore() === started.storeId)
      && productId === started.productId
      && api.storeRevision() === started.storeRevision;
  }, [productId]);

  const productCover = useMemo<SourceImage | null>(() => {
    if (!ownedProduct?.image_file) return null;
    const previous = jobs.find((job) => job.operation === "digital-mockup" && job.product_id === ownedProduct.id && job.image_file === ownedProduct.image_file && job.source_file);
    const file = previous?.source_file || ownedProduct.image_file;
    return { file, url: previous ? `${API_URL}/img/${file}` : ownedProduct.image_url ?? null, label: "Your original digital cover" };
  }, [ownedProduct, jobs]);
  const artworkSource = selectedSource === "upload" ? uploadedSource : selectedSource === "page" ? pageSource : productCover;
  const artworkContextReady = Boolean(pageId && blockId);
  const foreground = screenFocused && appActive;
  const artAllowance = options?.allowance.ai;
  const mockupAllowance = options?.allowance.mockup;
  const providerReady = Boolean(options?.enabled && options.provider === "runpod");
  const artQuotaAvailable = (artAllowance?.remaining ?? 0) > 0;
  const mockupQuotaAvailable = (mockupAllowance?.remaining ?? 0) > 0;
  const artReady = providerReady && artQuotaAvailable;
  const mockupPresets = options?.mockups ?? [];
  const digitalJobs = useMemo(() => jobs.filter((job) => job.context === "digital" && job.product_id === productId), [jobs, productId]);

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  useFocusEffect(useCallback(() => {
    setScreenFocused(true);
    return () => setScreenFocused(false);
  }, []));

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => setAppActive(state === "active"));
    const blur = Platform.OS === "android" ? AppState.addEventListener("blur", () => setAppActive(false)) : null;
    const focus = Platform.OS === "android" ? AppState.addEventListener("focus", () => setAppActive(AppState.currentState === "active")) : null;
    return () => { subscription.remove(); blur?.remove(); focus?.remove(); };
  }, []);

  const load = useCallback(async () => {
    const started = beginSession();
    if (!started) return;
    if (loadedStoreRef.current !== started.storeId) {
      setOwnedProduct(null); setOptions(null); setJobs([]); setActiveJob(null); setUploadedSource(null); setPageSource(null); setRetryRequest(null);
      loadedStoreRef.current = started.storeId;
    }
    setBusy("load");
    setMessage(null);
    try {
      // A source filename in the route is deliberately only a hint. The source is always re-read from this owned product.
      const product = await api.product(started.productId, started.storeId);
      if (!ownsSession(started)) return;
      if (product.kind !== "digital") {
        setOwnedProduct(null);
        setMessage({ text: "Digital Photo Studio only opens a digital product owned by the current store. No image request was made.", tone: "error" });
        return;
      }
      setOwnedProduct(product);
      if (pageId && blockId) {
        const record = await api.digitalDesign(started.storeId, started.productId);
        if (!ownsSession(started)) return;
        const block = record.document?.pages.find((page) => page.id === pageId)?.blocks.find((item) => item.id === blockId);
        if (block?.kind === "image" && block.image_file) {
          setPageSource({ file: block.image_file, url: `${API_URL}/img/${block.image_file}`, label: "Picture in this saved page" });
          setSelectedSource("page");
        }
      }
      try {
        const nextOptions = await imageAssistant.options("digital", started.storeId);
        if (!ownsSession(started)) return;
        setOptions(nextOptions);
        const nextJobs = nextOptions.jobs.filter((job) => job.context === "digital" && job.product_id === started.productId);
        setJobs((old) => nextJobs.reduce((all, job) => mergeImageJob(all, job), old).sort((a, b) => b.created_at.localeCompare(a.created_at)));
        const firstPreset = nextOptions.mockups[0]?.id;
        if (firstPreset) setMockupPreset((current) => nextOptions.mockups.some((preset) => preset.id === current) ? current : firstPreset);
      } catch (error) {
        if (ownsSession(started)) {
          setOptions(null);
          setMessage({ text: `${artworkError(error)} You can retry status; nothing was started.`, tone: "error" });
        }
      }
    } catch (error) {
      if (ownsSession(started)) setMessage({ text: artworkError(error), tone: "error" });
    } finally {
      if (ownsSession(started)) setBusy(null);
    }
  }, [beginSession, ownsSession, pageId, blockId]);

  useEffect(() => {
    // Defer the initial request one turn so the effect remains a lifecycle subscription rather than a render-time state update.
    const timer = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  // Poll only a deliberate/resumed job while this screen is foregrounded. The bound stops a stuck provider
  // from keeping a native timer alive indefinitely; the durable job remains available in history to resume later.
  const activeJobId = activeJob?.id;
  const activeJobStatus = activeJob?.status;
  useEffect(() => {
    if (!foreground || !activeJobId || (activeJobStatus !== "queued" && activeJobStatus !== "running")) return;
    const started = beginSession();
    if (!started) return;
    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const check = async () => {
      if (cancelled || !ownsSession(started) || attempts >= MAX_FOREGROUND_POLLS) return;
      attempts += 1;
      setPolling(true);
      try {
        const next = await imageAssistant.job(activeJobId, started.storeId);
        if (cancelled || !ownsSession(started)) return;
        setActiveJob(next);
        setJobs((current) => mergeImageJob(current, next));
        if (pending(next) && attempts < MAX_FOREGROUND_POLLS) timer = setTimeout(check, 4000);
        if (pending(next) && attempts >= MAX_FOREGROUND_POLLS) setMessage({ text: "This image is taking longer. Tap the saved request below to check again without creating another image.", tone: "info" });
        if (next.status === "done") setMessage({ text: "Candidate ready. Review it before choosing any use action.", tone: "ok" });
        if (next.status === "failed") setMessage({ text: next.error || "That image job failed. No image was applied and no new job was started.", tone: "error" });
      } catch (error) {
        if (!cancelled && ownsSession(started)) { setMessage({ text: `${artworkError(error)} Tap the saved request to resume without generating again.`, tone: "error" }); if (attempts < MAX_FOREGROUND_POLLS) timer = setTimeout(check, 4000); }
      } finally {
        if (!cancelled && ownsSession(started)) setPolling(false);
      }
    };
    void check();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [activeJobId, activeJobStatus, beginSession, foreground, ownsSession, pollAttempt]);

  async function uploadOwnedSource() {
    const started = beginSession();
    if (!started || busy) return;
    setBusy("upload");
    setMessage(null);
    try {
      if (Platform.OS === "ios" && Number.parseInt(String(Platform.Version), 10) <= 10) {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          if (ownsSession(started)) setMessage({ text: "Allow photo access to choose an owned source image. Nothing was uploaded.", tone: "error" });
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"] as ImagePicker.MediaType[], allowsEditing: false, quality: 0.9, base64: true });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.base64) {
        if (ownsSession(started)) setMessage({ text: "That image could not be read. Try another JPG, PNG, WebP, or GIF.", tone: "error" });
        return;
      }
      const staged = await api.stageStorefrontPhoto(asset.base64, asset.mimeType || "image/jpeg", started.storeId);
      if (!ownsSession(started)) return;
      setUploadedSource({ file: staged.image_file, url: staged.image_url, label: "Your uploaded picture" });
      setSelectedSource("upload");
      setMessage({ text: "Source uploaded to your seller account. It is not public and does not change this listing.", tone: "ok" });
    } catch (error) {
      if (ownsSession(started)) setMessage({ text: artworkError(error), tone: "error" });
    } finally {
      if (ownsSession(started)) setBusy(null);
    }
  }

  function fullPrompt() {
    return [prompt.trim(), framing.trim() ? `Framing: ${framing.trim()}` : "", `Art direction: ${direction}.`].filter(Boolean).join("\n");
  }

  async function submitImage(input: ImageAssistantInput, started: Session) {
    setRetryRequest({ input, session: started });
    try {
      const job = await imageAssistant.start(input, started.storeId);
      if (!ownsSession(started)) return null;
      setRetryRequest(null);
      void imageAssistant.options("digital", started.storeId).then((next) => { if (ownsSession(started)) setOptions(next); }).catch(() => {});
      return job;
    } catch (error) {
      if (ownsSession(started) && error instanceof ApiError && error.status !== 0) setRetryRequest(null);
      throw error;
    }
  }

  async function retrySameRequest() {
    const frozen = retryRequest;
    if (!frozen || busy || !ownsSession(frozen.session)) return;
    setBusy(frozen.input.operation === "digital-mockup" ? "start-mockup" : "start-art");
    try {
      const job = await submitImage(frozen.input, frozen.session);
      if (!job) return;
      setActiveJob(job); setJobs((old) => mergeImageJob(old, job));
      setMessage({ text: "The same saved request was recovered. No duplicate image was requested.", tone: "ok" });
    } catch (error) { if (ownsSession(frozen.session)) setMessage({ text: artworkError(error), tone: "error" }); }
    finally { if (ownsSession(frozen.session)) setBusy(null); }
  }

  async function startArtwork() {
    const started = beginSession();
    const source = artworkSource;
    if (!started || busy || retryRequest) return;
    if (!artReady) {
      setMessage({ text: "Artwork generation is not available for this store right now. No quota was used.", tone: "error" });
      return;
    }
    if (prompt.trim().length < 3) {
      setMessage({ text: "Describe the artwork before starting. Nothing was generated.", tone: "error" });
      return;
    }
    if (artMode === "edit" && !source) {
      setMessage({ text: "Choose an owned source image before editing. Nothing was generated.", tone: "error" });
      return;
    }
    setBusy("start-art");
    setMessage({ text: "Starting one artwork job. It will remain a private candidate until you explicitly use it.", tone: "info" });
    try {
      const job = await submitImage({
        operation: artMode === "edit" ? "digital-edit" : "digital-art",
        prompt: fullPrompt(),
        ...(artMode === "edit" && source ? { image_file: source.file } : {}),
        aspect,
        idempotency_key: imageRequestKey(),
        product_id: started.productId,
      }, started);
      if (!job || !ownsSession(started)) return;
      setActiveJob(job);
      setJobs((current) => mergeImageJob(current, job));
      setMessage({ text: job.status === "done" ? "Candidate ready. Review it before using it." : "Artwork job started. You may leave; resume it from durable history later.", tone: "info" });
    } catch (error) {
      if (ownsSession(started)) setMessage({ text: artworkError(error), tone: "error" });
    } finally {
      if (ownsSession(started)) setBusy(null);
    }
  }

  async function startMockup() {
    const started = beginSession();
    if (!started || busy || retryRequest) return;
    // Mockups are deliberately bound to the fetched product cover, never a route filename or a generated textual description.
    if (!productCover) {
      setMessage({ text: "This digital product has no saved cover yet. Attach or save an actual export cover before creating a mockup.", tone: "error" });
      return;
    }
    if (!mockupQuotaAvailable) {
      setMessage({ text: "This store has no product presentation edits remaining. No mockup was started.", tone: "error" });
      return;
    }
    if (!mockupPresets.some((preset) => preset.id === mockupPreset)) {
      setMessage({ text: "Choose one of the available mockup presets before starting. No mockup was started.", tone: "error" });
      return;
    }
    setBusy("start-mockup");
    setMessage({ text: "Starting one product presentation. Your real saved cover will be used unchanged.", tone: "info" });
    try {
      const presetName = mockupPresets.find((preset) => preset.id === mockupPreset)?.name || mockupPreset;
      const job = await submitImage({
        operation: "digital-mockup",
        prompt: `Present the verified saved digital cover in the ${presetName} mockup. Preserve the actual cover; do not recreate its words or artwork.`,
        image_file: productCover.file,
        aspect: "portrait",
        preset: mockupPreset,
        idempotency_key: imageRequestKey(),
        product_id: started.productId,
      }, started);
      if (!job || !ownsSession(started)) return;
      setActiveJob(job);
      setJobs((current) => mergeImageJob(current, job));
      setMessage({ text: job.status === "done" ? "Mockup candidate ready. Review it before changing the listing cover." : "Mockup job started. You may leave and explicitly resume it from history later.", tone: "info" });
    } catch (error) {
      if (ownsSession(started)) setMessage({ text: artworkError(error), tone: "error" });
    } finally {
      if (ownsSession(started)) setBusy(null);
    }
  }

  function useArtworkInPage() {
    const started = beginSession();
    const candidate = activeJob;
    if (!started || !usableImageJob(candidate) || candidate.product_id !== started.productId || candidate.context !== "digital") return;
    if (candidate.operation !== "digital-art" && candidate.operation !== "digital-edit") {
      setMessage({ text: "Only an artwork candidate can be used in an editable page. Mockups are listing previews, not document artwork.", tone: "error" });
      return;
    }
    if (!pageId || !blockId) {
      setMessage({ text: "Open Digital Photo Studio from an existing image block to use artwork in a page. This candidate remains un-applied.", tone: "info" });
      return;
    }
    if (!ownsSession(started)) return;
    rememberDigitalArtwork({ storeId: started.storeId, productId: started.productId, pageId, blockId, previousImageFile: pageSource?.file ?? null, image_file: candidate.image_file, image_url: candidate.image_url });
    router.back();
  }

  function confirmListingMockup() {
    const started = beginSession();
    const candidate = activeJob;
    if (!started || !ownedProduct || !candidate || candidate.product_id !== started.productId || candidate.status !== "done" || !candidate.image_file || candidate.operation !== "digital-mockup") return;
    Alert.alert(
      ownedProduct.status === "live" ? "Change the live listing cover?" : "Change this listing cover?",
      `${ownedProduct.status === "live" ? "This changes the image buyers see on the live listing immediately. " : ""}It changes only this product’s listing picture. It does not change the editable pages, the PDF or any buyer download.`,
      [
        { text: "Keep mockup private", style: "cancel" },
        { text: ownedProduct.status === "live" ? "Change live listing cover" : "Use as listing cover", style: "destructive", onPress: () => { void applyListingMockup(started, candidate); } },
      ],
    );
  }

  async function applyListingMockup(started: Session, candidate: ImageJob) {
    if (!ownsSession(started) || !ownedProduct || candidate.operation !== "digital-mockup" || !candidate.image_file) return;
    setBusy("apply-listing");
    setMessage(null);
    try {
      // The API contract binds the active owner server-side; this call contains only image_file, never delivery_file.
      const next = await api.updateProduct(ownedProduct.id, { image_file: candidate.image_file }, started.storeId);
      if (!ownsSession(started)) return;
      setOwnedProduct(next);
      setMessage({ text: next.status === "live" ? "Live listing cover changed after your review. The buyer delivery file was not changed." : "Listing cover changed after your review. The buyer delivery file was not changed.", tone: "ok" });
    } catch (error) {
      if (ownsSession(started)) setMessage({ text: artworkError(error), tone: "error" });
    } finally {
      if (ownsSession(started)) setBusy(null);
    }
  }

  if (!productId) {
    return <Screen><Stack.Screen options={{ title: "Digital Photo Studio" }} /><Notice tone="error" text="Choose a digital product before opening Digital Photo Studio. No image request was made." /></Screen>;
  }
  if (!me) return <Screen><Stack.Screen options={{ title: "Digital Photo Studio" }} /><Notice tone="info" text="Loading the selected store…" /></Screen>;
  if (!ownedProduct && busy === "load") return <Screen><Stack.Screen options={{ title: "Digital Photo Studio" }} /><Notice tone="info" text="Checking this owned digital product and its durable image history…" /></Screen>;
  if (!ownedProduct) return <Screen><Stack.Screen options={{ title: "Digital Photo Studio" }} /><Notice tone={message?.tone ?? "error"} text={message?.text ?? "This owned digital product could not be opened."} /><Button label="Retry" onPress={() => { void load(); }} /></Screen>;

  return (
    <Screen>
      <Stack.Screen options={{ title: "Digital Photo Studio" }} />
      <StudioHero product={ownedProduct} />
      {!artworkContextReady && ownedProduct ? <Button label="Open my editable digital design" variant="secondary" onPress={() => {
        const started = beginSession();
        if (!started) return;
        router.push({ pathname: "/digital-editor", params: { id: started.productId, storeId: started.storeId } });
      }} /> : null}
      <Segmented value={tab} options={[{ value: "artwork", label: "Artwork" }, { value: "mockups", label: "Product presentations" }]} onChange={setTab} />
      {sourceHint ? <Notice tone="info" text="A requested source was ignored until this studio re-read the current product. Only owned server sources can be sent to a job." /> : null}
      <QuotaStatus options={options} providerReady={providerReady} artAllowance={artAllowance} mockupAllowance={mockupAllowance} />
      {tab === "artwork" ? (
        <View style={{ gap: space.lg }}>
          <View style={panelStyleFor(c)}>
            <Pill text="ARTWORK YOU CONTROL" tone="flash" />
            <H2>Direct the artwork.</H2>
            <Body muted>Describe the picture you want. You will review the result before adding it to your design or store.</Body>
            <Segmented value={artMode} options={[{ value: "art", label: "New artwork" }, { value: "edit", label: "Edit my picture" }]} onChange={setArtMode} />
            <Field label="Describe your artwork" hint="Describe the subject, setting, lighting, and what must be avoided." value={prompt} onChangeText={setPrompt} multiline maxLength={900} placeholder="A considered description of the artwork you want" />
            <Field label="Framing and composition" hint="Optional: choose a close-up, leave space around the picture, or say where the main subject should go." value={framing} onChangeText={setFraming} multiline maxLength={160} placeholder="Centered cover composition with generous breathing room" />
            <Text style={[type.label, { color: c.ink }]}>Aspect</Text>
            <Segmented value={aspect} options={[{ value: "portrait", label: "Portrait" }, { value: "square", label: "Square" }, { value: "wide", label: "Wide" }]} onChange={setAspect} />
            <Text style={[type.label, { color: c.ink }]}>Art direction</Text>
            <View style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap" }}>
              {ART_DIRECTIONS.map((item) => <DirectionChip key={item} selected={direction === item} label={item} onPress={() => setDirection(item)} />)}
            </View>
          </View>
          {pageSource ? <View style={{ gap: space.sm, padding: space.md, borderColor: c.line, borderWidth: 1, borderRadius: radius.md }}><ImagePreview title="Picture in this page" source={pageSource} /><Button label={selectedSource === "page" ? "Using this page picture" : "Edit this page picture"} variant="secondary" onPress={() => setSelectedSource("page")} /></View> : null}
          <SourcePanel productCover={productCover} uploadedSource={uploadedSource} selected={selectedSource} onSelect={setSelectedSource} onUpload={() => { void uploadOwnedSource(); }} uploadBusy={busy === "upload"} />
          {artMode === "edit" && !artworkSource ? <Notice tone="error" text="Editing needs an owned source. Upload one or save an actual product cover first; no request can start without it." /> : null}
          {!providerReady ? <Notice tone="info" text={options?.setup_required || "The Runpod artwork provider is unavailable. Uploading sources and product presentations remain available."} /> : null}
          {providerReady && !artQuotaAvailable ? <Notice tone="info" text="Your artwork image allowance is exhausted. Source upload remains free and product mockups use their own quota." /> : null}
          <Button label={artMode === "edit" ? "Create my image edit" : "Create my artwork"} loading={busy === "start-art"} disabled={busy !== null || !!retryRequest || !artReady || prompt.trim().length < 3 || (artMode === "edit" && !artworkSource)} onPress={() => { void startArtwork(); }} />
          {!artworkContextReady ? <Notice tone="info" text="Artwork can be generated here, but “Use in this page” is available only when you opened this studio from an existing image block in Digital editor." /> : null}
        </View>
      ) : (
        <View style={{ gap: space.lg }}>
          <View style={panelStyleFor(c)}>
            <Pill text="YOUR REAL COVER" tone="neutral" />
            <H2>Present the real cover.</H2>
            <Body muted>Mockups use this product&apos;s fetched, saved cover on a device or print scene. They do not rewrite the cover or touch the buyer delivery file.</Body>
            {!productCover ? <Notice tone="error" text="No saved product cover is available. Save or attach a real digital export before requesting a presentation mockup." /> : <ImagePreview title="Your saved digital cover" source={productCover} />}
            <Text style={[type.label, { color: c.ink }]}>Mockup preset</Text>
            <View style={{ gap: space.sm }}>
              {mockupPresets.map((preset) => <Pressable key={preset.id} accessibilityRole="radio" accessibilityState={{ selected: mockupPreset === preset.id }} onPress={() => setMockupPreset(preset.id)} style={{ borderWidth: 1, borderColor: mockupPreset === preset.id ? c.flash : c.line, borderRadius: radius.md, padding: space.md, backgroundColor: mockupPreset === preset.id ? c.sunk : c.surface }}><Text style={[type.heading, { color: c.ink }]}>{preset.name}</Text><Text style={[type.small, { color: c.muted }]}>{preset.id === "chrome" ? "Polished device presentation" : preset.id === "editorial" ? "Print-forward editorial composition" : "Dark, high-contrast presentation"}</Text></Pressable>)}
            </View>
            {!mockupPresets.length && options ? <Notice tone="info" text="No mockup presets are enabled for this account yet. Nothing can be started." /> : null}
          </View>
          {!mockupQuotaAvailable ? <Notice tone="info" text="Your product presentation allowance is exhausted. Artwork prompt quota is separate." /> : null}
          <Button label="Create presentation mockup" loading={busy === "start-mockup"} disabled={busy !== null || !!retryRequest || !productCover || !mockupQuotaAvailable || !mockupPresets.length} onPress={() => { void startMockup(); }} />
        </View>
      )}
      <CandidatePanel job={activeJob} polling={polling} pageReady={artworkContextReady} onUseArtwork={useArtworkInPage} onApplyMockup={confirmListingMockup} applying={busy === "apply-listing"} />
      <HistoryPanel jobs={digitalJobs} activeId={activeJob?.id ?? null} onResume={(job) => { setActiveJob(job); setPollAttempt((value) => value + 1); setMessage({ text: pending(job) ? "Resuming this durable job while the app is foregrounded." : "Reviewing this durable candidate. No action has been applied.", tone: "info" }); }} />
      <Notice text={message?.text ?? null} tone={message?.tone} />
      {retryRequest ? <Button label="Recover the same request" variant="secondary" disabled={busy !== null} onPress={() => { void retrySameRequest(); }} /> : null}
      <Button label="Refresh studio status" variant="ghost" disabled={busy !== null} onPress={() => { void load(); }} />
    </Screen>
  );
}

function StudioHero({ product }: { product: Product }) {
  const c = useColors();
  return <View style={{ backgroundColor: c.surface, borderRadius: radius.lg, padding: space.xl, gap: space.sm, borderWidth: 1, borderColor: c.line }}><Text style={{ color: c.muted, fontSize: 12, letterSpacing: 1.5, fontWeight: "700" }}>DIGITAL PHOTO STUDIO</Text><H1>{product.title}</H1><Text style={{ color: c.muted, fontSize: 15, lineHeight: 22 }}>Create original artwork or stylish product presentations for this digital product. Each result needs your review before it is used.</Text></View>;
}

const panelStyleFor = (c: Colors) => ({ gap: space.md, padding: space.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface }) as const;

function QuotaStatus({ options, providerReady, artAllowance, mockupAllowance }: { options: AssistantOptions | null; providerReady: boolean; artAllowance: AssistantOptions["allowance"]["ai"] | undefined; mockupAllowance: AssistantOptions["allowance"]["mockup"] | undefined }) {
  const c = useColors();
  if (!options) return <Notice tone="info" text="Checking provider status and the independent artwork and mockup allowances…" />;
  return <View style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap" }}>
    <View style={{ flex: 1, minWidth: 140, gap: 3, borderWidth: 1, borderColor: c.line, borderRadius: radius.md, padding: space.md, backgroundColor: c.surface }}><Text style={[type.label, { color: c.ink }]}>AI artwork images</Text><Text style={[type.small, { color: c.muted }]}>{providerReady ? `${artAllowance?.remaining ?? 0} of ${artAllowance?.limit ?? 0} remaining` : options.setup_required || "Provider unavailable"}</Text></View>
    <View style={{ flex: 1, minWidth: 140, gap: 3, borderWidth: 1, borderColor: c.line, borderRadius: radius.md, padding: space.md, backgroundColor: c.surface }}><Text style={[type.label, { color: c.ink }]}>Product presentations</Text><Text style={[type.small, { color: c.muted }]}>{`${mockupAllowance?.remaining ?? 0} of ${mockupAllowance?.limit ?? 0} remaining`} · independent</Text></View>
  </View>;
}

function DirectionChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const c = useColors();
  return <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress} style={{ minHeight: 40, justifyContent: "center", paddingHorizontal: space.md, borderRadius: radius.pill, borderWidth: 1, borderColor: selected ? c.flash : c.line, backgroundColor: selected ? c.sunk : c.surface }}><Text style={[type.small, { color: c.ink }]}>{label}</Text></Pressable>;
}

function SourcePanel({ productCover, uploadedSource, selected, onSelect, onUpload, uploadBusy }: { productCover: SourceImage | null; uploadedSource: SourceImage | null; selected: "cover" | "upload" | "page"; onSelect: (value: "cover" | "upload" | "page") => void; onUpload: () => void; uploadBusy: boolean }) {
  const c = useColors();
  return <View style={{ gap: space.md, padding: space.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface }}><H2>Your picture</H2><Body muted>An upload is staged to your seller account and is not public. It changes no product until a separate reviewed action.</Body>{productCover ? <Pressable accessibilityRole="radio" accessibilityState={{ selected: selected === "cover" }} onPress={() => onSelect("cover")} style={{ borderWidth: 2, borderColor: selected === "cover" ? c.accent : c.line, borderRadius: radius.md, padding: space.sm }}><ImagePreview title={productCover.label} source={productCover} /></Pressable> : <Notice tone="info" text="This product has no current saved cover. You can still upload an owned source for an artwork edit." />}{uploadedSource ? <Pressable accessibilityRole="radio" accessibilityState={{ selected: selected === "upload" }} onPress={() => onSelect("upload")} style={{ borderWidth: 2, borderColor: selected === "upload" ? c.accent : c.line, borderRadius: radius.md, padding: space.sm }}><ImagePreview title={uploadedSource.label} source={uploadedSource} /></Pressable> : null}<Button label="Upload a picture" variant="secondary" loading={uploadBusy} disabled={uploadBusy} onPress={onUpload} /></View>;
}

function ImagePreview({ title, source }: { title: string; source: SourceImage }) {
  const c = useColors();
  return <View style={{ gap: space.sm }}><Text style={[type.label, { color: c.ink }]}>{title}</Text><View style={{ height: 150, borderRadius: radius.md, overflow: "hidden", backgroundColor: c.sunk }}>{source.url ? <Image source={{ uri: source.url }} style={{ width: "100%", height: "100%" }} contentFit="contain" accessibilityLabel={title} /> : <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><Text style={[type.small, { color: c.muted }]}>Private source is available to the server</Text></View>}</View></View>;
}

function CandidatePanel({ job, polling, pageReady, onUseArtwork, onApplyMockup, applying }: { job: ImageJob | null; polling: boolean; pageReady: boolean; onUseArtwork: () => void; onApplyMockup: () => void; applying: boolean }) {
  const c = useColors();
  if (!job) return <View style={{ gap: space.sm, padding: space.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface }}><H2>Candidate review</H2><Body muted>Choose a durable job from history or explicitly start one. Nothing is waiting to be applied.</Body></View>;
  const title = job.operation === "digital-mockup" ? "Presentation mockup candidate" : "Artwork candidate";
  return <View style={{ gap: space.md, padding: space.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: job.status === "failed" ? c.bad : c.line, backgroundColor: c.surface }}><View style={{ flexDirection: "row", justifyContent: "space-between", gap: space.sm }}><H2>{title}</H2><Pill text={polling && pending(job) ? "Refreshing" : job.status} tone={job.status === "done" ? "good" : "neutral"} /></View><Text style={[type.small, { color: c.muted }]}>{job.prompt}</Text>{job.image_url ? <View style={{ height: 260, borderRadius: radius.md, overflow: "hidden", backgroundColor: c.sunk }}><Image source={{ uri: job.image_url }} style={{ width: "100%", height: "100%" }} contentFit="contain" accessibilityLabel={title} /></View> : null}{job.status === "queued" || job.status === "running" ? <Body muted>This job is durable. You can leave this screen and check the same saved request later.</Body> : null}{job.status === "failed" ? <Notice tone="error" text={job.error || "The job failed. Nothing was applied."} /> : null}{job.status === "done" && (job.operation === "digital-art" || job.operation === "digital-edit") ? <><Notice tone="info" text={pageReady ? "Use in this page changes only the image block you opened from after the editor confirms it still exists." : "To add this artwork to your digital product, open this studio from a picture spot in the digital editor."} /><Button label="Use in this page" disabled={!pageReady} onPress={onUseArtwork} /></> : null}{job.status === "done" && job.operation === "digital-mockup" ? <><Notice tone="info" text="Review required: using this changes only this listing image. Your PDF and buyer downloads stay unchanged." /><Button label="Review listing cover change" variant="flash" loading={applying} disabled={applying} onPress={onApplyMockup} /></> : null}</View>;
}

function HistoryPanel({ jobs, activeId, onResume }: { jobs: ImageJob[]; activeId: string | null; onResume: (job: ImageJob) => void }) {
  const c = useColors();
  return <View style={{ gap: space.md }}><H2>Saved images and requests</H2><Body muted>Your requests stay with this product, even if you close the app. Checking a saved request does not create another image.</Body>{jobs.length ? jobs.map((job) => <Pressable key={job.id} accessibilityRole="button" onPress={() => onResume(job)} style={{ gap: 5, padding: space.md, borderWidth: 1, borderColor: activeId === job.id ? c.accent : c.line, borderRadius: radius.md, backgroundColor: c.surface }}><View style={{ flexDirection: "row", justifyContent: "space-between", gap: space.sm }}><Text style={[type.heading, { color: c.ink }]}>{job.operation === "digital-mockup" ? "Mockup" : job.operation === "digital-edit" ? "Artwork edit" : "Artwork prompt"}</Text><Text style={[type.small, { color: c.muted }]}>{job.status}</Text></View><Text style={[type.small, { color: c.muted }]} numberOfLines={2}>{job.prompt}</Text><Text style={[type.small, { color: c.accent }]}>{pending(job) ? "Resume foreground status check" : "Review candidate"}</Text></Pressable>) : <Notice tone="info" text="No images created for this product yet." />}</View>;
}

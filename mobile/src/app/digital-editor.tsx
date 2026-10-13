import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Linking, Modal, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { router, Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Body, Button, H1, H2, Notice, Pill, Screen, Segmented } from "@/components/ui";
import { DigitalDocumentControls } from "@/components/digital-document-controls";
import { DigitalPreview } from "@/components/digital-preview";
import type { DigitalPreviewSelection } from "@/components/digital-preview-bridge";
import { account, useMe } from "@/lib/account-store";
import { api, ApiError, type DigitalDesignRecord, type DigitalExport, type DigitalPreview as DigitalPreviewData, type Product } from "@/lib/api";
import { DIGITAL_DESIGNS } from "@/lib/digital-design-catalog";
import {
  cloneDigitalDocument,
  duplicateDigitalPage,
  moveItem,
  newDigitalBlock,
  nextDigitalId,
  newDigitalDocument,
  sameDigitalSession,
  validateDigitalDocument,
  type DigitalBlock,
  type DigitalBlockKind,
  type DigitalDocument,
  type DigitalPage,
} from "@/lib/digital-design";
import { appendDigitalUndo, applyDigitalTemplateStyle, digitalSaveError, isCurrentDigitalExport } from "@/lib/digital-editor-session";
import { consumeDigitalArtwork } from "@/lib/image-assistant";
import { radius, space, type, useColors } from "@/lib/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Stage = "edit" | "preview" | "attach";
type Message = { text: string; tone: "error" | "info" | "ok" };
type Session = { storeId: string; productId: string; storeRevision: number };

function firstParam(value: string | string[] | undefined): string | null {
  return typeof value === "string" && value ? value : null;
}

/** Product/store/revision is captured for every request; late responses cannot cross a store switch. */
export default function DigitalEditorScreen() {
  const c = useColors();
  const me = useMe();
  const params = useLocalSearchParams<{ id?: string | string[]; storeId?: string | string[]; template_id?: string | string[]; legacy_rebuild?: string | string[]; replace_template?: string | string[] }>();
  const productId = firstParam(params.id);
  const routeStoreId = firstParam(params.storeId);
  const templateId = firstParam(params.template_id);
  const legacyRoute = firstParam(params.legacy_rebuild) === "1";
  const replacementRoute = firstParam(params.replace_template) === "1";
  const selectedTemplate = useMemo(() => templateId ? DIGITAL_DESIGNS.find((template) => template.id === templateId) ?? null : null, [templateId]);
  const routeOwnerMatches = Boolean(productId && routeStoreId && me?.id === routeStoreId);

  const [loading, setLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [design, setDesign] = useState<DigitalDesignRecord | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [document, setDocument] = useState<DigitalDocument | null>(null);
  const [revision, setRevision] = useState(0);
  const [stage, setStage] = useState<Stage>("edit");
  const [message, setMessage] = useState<Message | null>(null);
  const [busy, setBusy] = useState<"save" | "preview" | "export" | "attach" | "image" | null>(null);
  const [preview, setPreview] = useState<DigitalPreviewData | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewPage, setPreviewPage] = useState(0);
  const [selection, setSelection] = useState<DigitalPreviewSelection | null>(null);
  const [exported, setExported] = useState<DigitalExport | null>(null);
  const [pendingLegacyRebuild, setPendingLegacyRebuild] = useState(false);
  const [undoCount, setUndoCount] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [attachCandidate, setAttachCandidate] = useState<DigitalExport | null>(null);
  const [liveAcknowledged, setLiveAcknowledged] = useState(false);

  const documentRef = useRef<DigitalDocument | null>(null);
  const undoRef = useRef<DigitalDocument[]>([]);
  const draftGenerationRef = useRef(0);
  const savedGenerationRef = useRef<number | null>(null);
  const previewGenerationRef = useRef<number | null>(null);
  const previewRequestRef = useRef(0);
  const mountedRef = useRef(true);
  const [draftGeneration, setDraftGeneration] = useState(0);
  const [savedGeneration, setSavedGeneration] = useState<number | null>(null);
  const [previewGeneration, setPreviewGeneration] = useState<number | null>(null);

  const beginSession = useCallback((): Session | null => {
    if (!productId || !routeStoreId || account.get()?.id !== routeStoreId) return null;
    return { storeId: routeStoreId, productId, storeRevision: api.storeRevision() };
  }, [productId, routeStoreId]);

  const ownsSession = useCallback((started: Session) => {
    const currentStoreId = account.get()?.id;
    if (!mountedRef.current || !currentStoreId || !productId) return false;
    return sameDigitalSession(started, { storeId: currentStoreId, productId, storeRevision: api.storeRevision() });
  }, [productId]);

  useEffect(() => () => { mountedRef.current = false; }, []);

  useEffect(() => {
    if (!routeOwnerMatches || !productId || !routeStoreId) return;
    let active = true;
    const started: Session = { storeId: routeStoreId, productId, storeRevision: api.storeRevision() };
    void Promise.all([api.digitalDesign(routeStoreId, productId), api.product(productId, routeStoreId)]).then(([nextDesign, nextProduct]) => {
      if (!active || !sameDigitalSession(started, { storeId: account.get()?.id ?? "", productId, storeRevision: api.storeRevision() })) return;
      setDesign(nextDesign);
      setProduct(nextProduct);
      setRevision(nextDesign.revision);
      setExported(nextDesign.export);
      setPreview(null);
      setPreviewError(null);
      setPreviewGeneration(null);
      previewGenerationRef.current = null;
      setPreviewPage(0);
      undoRef.current = [];
      setUndoCount(0);
      draftGenerationRef.current = 0;
      savedGenerationRef.current = nextDesign.source_available && nextDesign.document ? 0 : null;
      setDraftGeneration(0);
      setSavedGeneration(savedGenerationRef.current);
      if (nextDesign.source_available && nextDesign.document) {
        const source = cloneDigitalDocument(nextDesign.document);
        documentRef.current = source;
        setDocument(source);
        setPendingLegacyRebuild(false);
        // The actual, server-rendered first frame makes the chosen filled design visible before editing.
        const previewRequest = ++previewRequestRef.current;
        setPreviewLoading(true);
        void api.previewDigitalDesign(started.storeId, started.productId, cloneDigitalDocument(source)).then((firstPreview) => {
          if (!active || !mountedRef.current || previewRequest !== previewRequestRef.current || draftGenerationRef.current !== 0 || !sameDigitalSession(started, { storeId: account.get()?.id ?? "", productId, storeRevision: api.storeRevision() })) return;
          setPreview(firstPreview);
          previewGenerationRef.current = 0;
          setPreviewGeneration(0);
        }).catch((error) => {
          if (!active || !mountedRef.current || previewRequest !== previewRequestRef.current || !sameDigitalSession(started, { storeId: account.get()?.id ?? "", productId, storeRevision: api.storeRevision() })) return;
          setPreviewError(digitalSaveError(error instanceof ApiError ? error : null));
        }).finally(() => {
          if (active && mountedRef.current && previewRequest === previewRequestRef.current && sameDigitalSession(started, { storeId: account.get()?.id ?? "", productId, storeRevision: api.storeRevision() })) setPreviewLoading(false);
        });
      } else {
        documentRef.current = null;
        setDocument(null);
        setPendingLegacyRebuild(false);
        setMessage({ text: nextDesign.legacy_message || "This existing buyer file has no editable source. It has not been recovered or changed.", tone: "info" });
      }
      setLoading(false);
    }).catch((error) => {
      if (!active || !sameDigitalSession(started, { storeId: account.get()?.id ?? "", productId, storeRevision: api.storeRevision() })) return;
      setLoading(false);
      setMessage({ text: digitalSaveError(error instanceof ApiError ? error : null), tone: "error" });
    });
    return () => { active = false; };
  }, [loadAttempt, productId, routeOwnerMatches, routeStoreId]);

  const commitDocument = useCallback((next: DigitalDocument, keepUndo = true) => {
    const current = documentRef.current;
    if (!current) return;
    if (keepUndo) {
      undoRef.current = appendDigitalUndo(undoRef.current, current);
      setUndoCount(undoRef.current.length);
    }
    const source = cloneDigitalDocument(next);
    documentRef.current = source;
    setDocument(source);
    draftGenerationRef.current += 1;
    setDraftGeneration(draftGenerationRef.current);
    setExported(null);
    setShowReview(false);
    setAttachCandidate(null);
    setPreviewLoading(false);
  }, []);

  function undo() {
    const previous = undoRef.current.pop();
    if (!previous) return;
    undoRef.current = [...undoRef.current];
    setUndoCount(undoRef.current.length);
    documentRef.current = cloneDigitalDocument(previous);
    setDocument(documentRef.current);
    draftGenerationRef.current += 1;
    setDraftGeneration(draftGenerationRef.current);
    setExported(null);
    setShowReview(false);
    setAttachCandidate(null);
  }

  function addPage() {
    const source = documentRef.current;
    if (!source || source.pages.length >= 60) return;
    commitDocument({ ...source, pages: [...source.pages, { id: nextDigitalId("page"), title: "New page", kind: "content", blocks: [] }] });
  }

  function duplicatePage(pageId: string) {
    const source = documentRef.current;
    const page = source?.pages.find((candidate) => candidate.id === pageId);
    if (!source || !page || source.pages.length >= 60) return;
    const index = source.pages.indexOf(page);
    const pages = [...source.pages];
    pages.splice(index + 1, 0, duplicateDigitalPage(page));
    commitDocument({ ...source, pages });
  }

  function movePage(pageId: string, direction: -1 | 1) {
    const source = documentRef.current;
    const index = source?.pages.findIndex((page) => page.id === pageId) ?? -1;
    if (!source || index < 0) return;
    commitDocument({ ...source, pages: moveItem(source.pages, index, index + direction) });
  }

  function confirmDeletePage(page: DigitalPage) {
    const source = documentRef.current;
    if (!source || source.pages.length <= 1) return;
    Alert.alert("Delete source page?", `This removes “${page.title || "Untitled page"}” and its ${page.blocks.length} editable block${page.blocks.length === 1 ? "" : "s"}. It does not change the current buyer file until you save, export, and attach a revision.`, [
      { text: "Keep page", style: "cancel" },
      { text: "Delete page", style: "destructive", onPress: () => {
        const latest = documentRef.current;
        if (!latest) return;
        commitDocument({ ...latest, pages: latest.pages.filter((candidate) => candidate.id !== page.id) });
        setSelection(null);
      } },
    ]);
  }

  function addBlock(pageId: string, kind: DigitalBlockKind) {
    const source = documentRef.current;
    const page = source?.pages.find((candidate) => candidate.id === pageId);
    if (!source || !page || page.blocks.length >= 40) return;
    commitDocument({ ...source, pages: source.pages.map((candidate) => candidate.id === pageId ? { ...candidate, blocks: [...candidate.blocks, newDigitalBlock(kind)] } : candidate) });
  }

  function moveBlock(pageId: string, blockId: string, direction: -1 | 1) {
    const source = documentRef.current;
    const page = source?.pages.find((candidate) => candidate.id === pageId);
    const index = page?.blocks.findIndex((block) => block.id === blockId) ?? -1;
    if (!source || !page || index < 0) return;
    commitDocument({ ...source, pages: source.pages.map((candidate) => candidate.id === pageId ? { ...candidate, blocks: moveItem(candidate.blocks, index, index + direction) } : candidate) });
  }

  function confirmDeleteBlock(pageId: string, block: DigitalBlock) {
    Alert.alert("Remove source block?", `This removes this ${block.kind} from the editable source page. The current buyer file remains unchanged until a reviewed export is attached.`, [
      { text: "Keep block", style: "cancel" },
      { text: "Remove block", style: "destructive", onPress: () => {
        const source = documentRef.current;
        if (!source) return;
        commitDocument({ ...source, pages: source.pages.map((page) => page.id === pageId ? { ...page, blocks: page.blocks.filter((candidate) => candidate.id !== block.id) } : page) });
        setSelection(null);
      } },
    ]);
  }

  function beginLegacyRebuild() {
    if (!selectedTemplate) return;
    Alert.alert("Start a fresh editable source?", `This uses ${selectedTemplate.name}'s actual sample, palette, and fonts. It does not recover or import your old PDF. Your existing buyer file stays in place until you later attach a reviewed export.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Use this sample", onPress: () => {
        const source = newDigitalDocument(selectedTemplate);
        documentRef.current = source;
        setDocument(source);
        undoRef.current = [];
        setUndoCount(0);
        draftGenerationRef.current = 0;
        savedGenerationRef.current = null;
        setDraftGeneration(0);
        setSavedGeneration(null);
        setPendingLegacyRebuild(true);
        setStage("edit");
        setMessage({ text: "Fresh sample source ready. Replace every sample word before saving; the old PDF was not imported.", tone: "info" });
      } },
    ]);
  }

  function confirmTemplateStyle() {
    const source = documentRef.current;
    if (!source || !selectedTemplate) return;
    Alert.alert("Apply visual style?", `This changes only the template id, format, palette, and fonts to ${selectedTemplate.name}. It keeps every existing page, block, image reference, and word.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Apply style", onPress: () => commitDocument(applyDigitalTemplateStyle(source, selectedTemplate)) },
    ]);
  }

  /** Returns true only when the exact private source snapshot was accepted for this owner/product session. */
  async function saveDraft(): Promise<boolean> {
    const source = documentRef.current;
    const started = beginSession();
    if (!source || !started || busy) return false;
    const validation = validateDigitalDocument(source);
    if (validation) { setMessage({ text: validation, tone: "error" }); return false; }
    if (!design?.source_available && !pendingLegacyRebuild) {
      setMessage({ text: "Choose a fresh source sample and explicitly confirm the rebuild before saving. The existing PDF cannot be recovered as editable source.", tone: "error" });
      return false;
    }
    const snapshot = cloneDigitalDocument(source);
    const savingGeneration = draftGenerationRef.current;
    const savingRevision = revision;
    setBusy("save");
    setMessage({ text: "Saving a private editable draft. This does not publish or replace the buyer file.", tone: "info" });
    try {
      const result = await api.saveDigitalDesign(started.storeId, started.productId, { document: snapshot, revision: savingRevision, ...(pendingLegacyRebuild ? { rebuild_legacy: true as const } : {}) });
      if (!ownsSession(started)) return false;
      setDesign(result);
      setRevision(result.revision);
      setExported(null);
      savedGenerationRef.current = savingGeneration;
      setSavedGeneration(savingGeneration);
      setPendingLegacyRebuild(false);
      if (draftGenerationRef.current === savingGeneration && result.document) {
        const serverSource = cloneDigitalDocument(result.document);
        documentRef.current = serverSource;
        setDocument(serverSource);
      }
      setMessage({ text: "Private source draft saved. Nothing has been published or attached.", tone: "ok" });
      return true;
    } catch (error) {
      if (ownsSession(started)) setMessage({ text: digitalSaveError(error instanceof ApiError ? error : null), tone: "error" });
      return false;
    } finally {
      if (ownsSession(started)) setBusy(null);
    }
  }

  // The studio cannot mutate a document directly. On return, consume one owner/product-scoped selection
  // and apply it only when the exact image block still survives in this editor session.
  useFocusEffect(useCallback(() => {
    if (loading) return;
    const started = beginSession();
    const source = documentRef.current;
    if (!started || !source) return;
    const artwork = consumeDigitalArtwork(started.storeId, started.productId);
    if (!artwork) return;
    if (!ownsSession(started) || artwork.storeId !== started.storeId || artwork.productId !== started.productId) return;
    const page = source.pages.find((candidate) => candidate.id === artwork.pageId);
    const block = page?.blocks.find((candidate) => candidate.id === artwork.blockId);
    if (!page || !block || block.kind !== "image" || (artwork.previousImageFile !== undefined && (block.image_file ?? null) !== artwork.previousImageFile)) {
      setMessage({ text: "The artwork candidate was not applied because its original image block was removed or changed while the studio was open.", tone: "info" });
      return;
    }
    commitDocument({
      ...source,
      pages: source.pages.map((candidate) => candidate.id === artwork.pageId ? {
        ...candidate,
        blocks: candidate.blocks.map((item) => item.id === artwork.blockId ? { ...item, image_file: artwork.image_file, image_fit: item.image_fit ?? "contain" } : item),
      } : candidate),
    });
    setSelection({ type: "block", pageId: artwork.pageId, blockId: artwork.blockId });
    setMessage({ text: "Reviewed artwork is now referenced by this existing image block. Save the private source again before previewing or exporting.", tone: "ok" });
  }, [beginSession, commitDocument, ownsSession, loading]));

  async function openDigitalPhotoStudio(pageId: string, block: DigitalBlock) {
    const beforeSave = beginSession();
    const source = documentRef.current;
    if (!beforeSave || !source || busy || block.kind !== "image") return;
    const exists = source.pages.some((page) => page.id === pageId && page.blocks.some((candidate) => candidate.id === block.id && candidate.kind === "image"));
    if (!exists) {
      setMessage({ text: "That image block changed before Digital Photo Studio could open. No image request was made.", tone: "error" });
      return;
    }
    // A studio handoff is never allowed to race an unsaved private source. If this fails, stay here.
    const saved = await saveDraft();
    if (!saved || !ownsSession(beforeSave)) return;
    const afterSave = documentRef.current;
    const stillExists = afterSave?.pages.some((page) => page.id === pageId && page.blocks.some((candidate) => candidate.id === block.id && candidate.kind === "image"));
    if (!stillExists) {
      setMessage({ text: "The saved source no longer contains that image block, so Digital Photo Studio was not opened.", tone: "error" });
      return;
    }
    router.push({ pathname: "/digital-photo-studio", params: { product: beforeSave.productId, page: pageId, block: block.id } });
  }

  async function renderPreview() {
    const source = documentRef.current;
    const started = beginSession();
    if (!source || !started || busy) return;
    const validation = validateDigitalDocument(source);
    if (validation) { setMessage({ text: validation, tone: "error" }); return; }
    const generation = draftGenerationRef.current;
    const request = ++previewRequestRef.current;
    setPreviewLoading(true);
    setPreviewError(null);
    setBusy("preview");
    try {
      const nextPreview = await api.previewDigitalDesign(started.storeId, started.productId, cloneDigitalDocument(source));
      if (!ownsSession(started) || request !== previewRequestRef.current || generation !== draftGenerationRef.current) return;
      setPreview(nextPreview);
      setPreviewPage(0);
      previewGenerationRef.current = generation;
      setPreviewGeneration(generation);
      setMessage({ text: "Rendered from your current editable source. This preview is not a product attachment.", tone: "ok" });
    } catch (error) {
      if (ownsSession(started) && request === previewRequestRef.current) {
        const text = digitalSaveError(error instanceof ApiError ? error : null);
        setPreviewError(text);
        setMessage({ text, tone: "error" });
      }
    } finally {
      if (ownsSession(started) && request === previewRequestRef.current) { setPreviewLoading(false); setBusy(null); }
    }
  }

  async function uploadImage(pageId: string, block: DigitalBlock) {
    const started = beginSession();
    if (!started || busy) return;
    setBusy("image");
    setMessage(null);
    try {
      if (Platform.OS === "ios" && Number.parseInt(String(Platform.Version), 10) <= 10) {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) { if (ownsSession(started)) setMessage({ text: "Allow photo access to choose an image for this design.", tone: "error" }); return; }
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"] as ImagePicker.MediaType[], allowsEditing: false, quality: 0.8, base64: true });
      const asset = result.assets?.[0];
      if (result.canceled) return;
      if (!asset?.base64) { if (ownsSession(started)) setMessage({ text: "That image could not be read. Try another JPG, PNG, WebP, or GIF.", tone: "error" }); return; }
      if (!ownsSession(started)) return;
      const staged = await api.stageStorefrontPhoto(asset.base64, asset.mimeType || "image/jpeg", started.storeId);
      if (!ownsSession(started)) return;
      const source = documentRef.current;
      if (!source) return;
      commitDocument({ ...source, pages: source.pages.map((page) => page.id === pageId ? { ...page, blocks: page.blocks.map((candidate) => candidate.id === block.id ? { ...candidate, image_file: staged.image_file, image_fit: candidate.image_fit ?? "contain" } : candidate) } : page) });
      setMessage({ text: "Image is staged in your seller account and referenced only by this editable source. Save before exporting.", tone: "ok" });
    } catch (error) {
      if (ownsSession(started)) setMessage({ text: digitalSaveError(error instanceof ApiError ? error : null), tone: "error" });
    } finally {
      if (ownsSession(started)) setBusy(null);
    }
  }

  const previewCurrent = previewGeneration === draftGeneration;
  const reviewedExport = isCurrentDigitalExport({ export: exported, revision, savedGeneration, draftGeneration, previewHash: previewCurrent ? preview?.document_hash ?? null : null });

  async function openPrivateExport(url: string, label: "PDF" | "cover") {
    let valid = false;
    try { valid = new URL(url).protocol === "https:"; } catch { /* invalid private URL is never opened */ }
    if (!valid) { setMessage({ text: `This private ${label} link is invalid or not HTTPS, so it was not opened. Export again to get a fresh signed link.`, tone: "error" }); return; }
    try {
      await Linking.openURL(url);
    } catch {
      setMessage({ text: `Couldn't open the private ${label} link. Export again to get a fresh signed link.`, tone: "error" });
    }
  }

  async function exportCurrentRevision() {
    const started = beginSession();
    const source = documentRef.current;
    if (!started || !source || busy) return;
    if (savedGenerationRef.current !== draftGenerationRef.current) { setMessage({ text: "Save the latest private source before exporting. Older saved revisions are not used.", tone: "error" }); return; }
    if (!previewCurrent || !preview) { setMessage({ text: "Render the current document before exporting so you can review the real server pages.", tone: "error" }); return; }
    const validation = validateDigitalDocument(source);
    if (validation) { setMessage({ text: validation, tone: "error" }); return; }
    const exportRevision = revision;
    const exportGeneration = draftGenerationRef.current;
    setBusy("export");
    setMessage({ text: "Building a private PDF export from the saved revision…", tone: "info" });
    try {
      const nextExport = await api.exportDigitalDesign(started.storeId, started.productId, exportRevision);
      if (!ownsSession(started) || exportGeneration !== draftGenerationRef.current || exportRevision !== revision) return;
      if (nextExport.document_hash !== preview.document_hash) {
        setExported(nextExport);
        setMessage({ text: "The export completed, but its document does not match the reviewed preview. Render again before any attach is allowed.", tone: "error" });
        return;
      }
      setExported(nextExport);
      setStage("attach");
      setMessage({ text: "Export ready for review. It is private and has not replaced a buyer file.", tone: "ok" });
    } catch (error) {
      if (ownsSession(started)) setMessage({ text: digitalSaveError(error instanceof ApiError ? error : null), tone: "error" });
    } finally {
      if (ownsSession(started)) setBusy(null);
    }
  }

  function openReview() {
    if (!reviewedExport || !exported) {
      setMessage({ text: "Review a current server preview and export before attaching. An older frame or export cannot be attached.", tone: "error" });
      return;
    }
    setAttachCandidate(exported);
    setLiveAcknowledged(product?.status !== "live");
    setShowReview(true);
  }

  async function attachReviewedExport() {
    const started = beginSession();
    const candidate = attachCandidate;
    if (!started || !candidate || busy || !reviewedExport || candidate.id !== exported?.id || candidate.revision !== revision) {
      setShowReview(false);
      setMessage({ text: "That review is no longer current. Render and export the latest saved revision before attaching.", tone: "error" });
      return;
    }
    const isLive = product?.status === "live";
    if (isLive && !liveAcknowledged) return;
    setBusy("attach");
    try {
      const result = await api.attachDigitalDesign(started.storeId, started.productId, { export_id: candidate.id, revision: candidate.revision, acknowledge_live: Boolean(isLive) });
      if (!ownsSession(started)) return;
      setProduct(result.product);
      setDesign(result.design);
      setRevision(result.design.revision);
      setExported(result.design.export);
      setShowReview(false);
      setAttachCandidate(null);
      setMessage({ text: "Reviewed export attached. Your listing, price, status, plan, and billing were not changed.", tone: "ok" });
    } catch (error) {
      if (ownsSession(started)) setMessage({ text: digitalSaveError(error instanceof ApiError ? error : null), tone: "error" });
    } finally {
      if (ownsSession(started)) setBusy(null);
    }
  }

  function reloadServerCopy() {
    Alert.alert("Reload server copy?", "This discards unsaved edits in this session and restores the server source. It does not change any attached buyer file.", [
      { text: "Cancel", style: "cancel" },
      { text: "Reload", style: "destructive", onPress: () => { setLoading(true); setMessage(null); setLoadAttempt((attempt) => attempt + 1); } },
    ]);
  }

  if (!productId || !routeStoreId) {
    return <Screen><Stack.Screen options={{ title: "Digital editor" }} /><Notice text="This editor needs both a product and the selected store owner. Return to the design library and choose a product again." tone="error" /></Screen>;
  }
  if (!me) return <Screen><Notice text="Loading the selected store…" tone="info" /></Screen>;
  if (!routeOwnerMatches) {
    return <Screen><Stack.Screen options={{ title: "Digital editor" }} /><Notice text="The selected store changed before this editor could open. This design was not loaded for the new store. Return to the product in the current store." tone="error" /></Screen>;
  }
  if (loading) return <Screen><Stack.Screen options={{ title: "Digital editor" }} /><Notice text="Loading the owner-bound editable source…" tone="info" /></Screen>;

  if (!document) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Digital editor" }} />
        <Pill text="Edit · source unavailable" tone="flash" />
        <H1>Start a new editable source.</H1>
        <Body muted>{design?.legacy_message || "This existing file has no recoverable editable source. Snapfront will not pretend your PDF was converted back into pages or text."}</Body>
        {legacyRoute && selectedTemplate ? (
          <View style={{ gap: space.md, padding: space.lg, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, backgroundColor: c.surface }}>
            <Text style={[type.heading, { color: c.ink }]}>{selectedTemplate.name}</Text>
            <Text style={[type.small, { color: c.muted }]}>{selectedTemplate.sample.title} · actual editable starter sample. Its palette and font style will be used.</Text>
            <Button label="Start a fresh editable sample" onPress={beginLegacyRebuild} />
          </View>
        ) : (
          <Button label="Choose a fresh design source" onPress={() => router.replace({ pathname: "/digital-designs", params: { rebuild_product_id: productId, storeId: routeStoreId } })} />
        )}
        <Body muted>Your current buyer file remains unchanged. After you replace the sample copy, save a private source, review a real export, and explicitly attach it if you choose.</Body>
        <Notice text={message?.text ?? null} tone={message?.tone} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: product?.status === "live" ? "Edit live digital product" : "Edit digital draft" }} />
      <View style={{ gap: space.sm }}>
        <Pill text={`Private source · revision ${revision}`} tone="flash" />
        <H1>Make this digital design yours.</H1>
        <Body muted>Work in editable source pages, then render real server pages and review one saved export before changing a buyer download. Nothing here publishes your product.</Body>
      </View>
      <Segmented value={stage} options={[{ value: "edit", label: "1 Edit" }, { value: "preview", label: "2 Preview" }, { value: "attach", label: "3 Attach" }]} onChange={setStage} />
      {replacementRoute && selectedTemplate ? <View style={{ gap: space.sm, padding: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface }}><Text style={[type.heading, { color: c.ink }]}>Try {selectedTemplate.name}&apos;s visual style</Text><Text style={[type.small, { color: c.muted }]}>This preserves every word, page, block, and owned image reference. Only format, template, palette, and fonts change after your confirmation.</Text><Button label="Apply visual style and keep content" variant="secondary" onPress={confirmTemplateStyle} /></View> : null}
      {stage === "edit" ? (
        <View style={{ gap: space.lg }}>
          <Notice text={preview && !previewCurrent ? "This frame is from an earlier source revision. It remains visible for reference only; update it before export or attach." : null} tone="info" />
          <DigitalPreview preview={preview} pageIndex={previewPage} loading={previewLoading} error={previewError} onPageIndex={setPreviewPage} onSelect={setSelection} onRetry={() => { void renderPreview(); }} />
          <Button label="Update actual preview" variant="secondary" loading={busy === "preview"} disabled={busy !== null} onPress={() => { void renderPreview(); }} />
          <DigitalDocumentControls document={document} selection={selection} undoCount={undoCount} busy={busy !== null} onChange={commitDocument} onUndo={undo} onAddPage={addPage} onDuplicatePage={duplicatePage} onMovePage={movePage} onDeletePage={confirmDeletePage} onAddBlock={addBlock} onMoveBlock={moveBlock} onDeleteBlock={confirmDeleteBlock} onUploadImage={uploadImage} onOpenDigitalPhotoStudio={openDigitalPhotoStudio} />
          <Button label="Save private draft" loading={busy === "save"} disabled={busy !== null} onPress={saveDraft} />
          <Button label="Choose another visual template" variant="ghost" disabled={busy !== null} onPress={() => router.push({ pathname: "/digital-designs", params: { edit_product_id: productId, storeId: routeStoreId } })} />
          <Button label="Reload server source" variant="ghost" disabled={busy !== null} onPress={reloadServerCopy} />
        </View>
      ) : null}
      {stage === "preview" ? (
        <View style={{ gap: space.lg }}>
          <Notice text={preview && !previewCurrent ? "The visible frame is an older preview. It is kept only for reference and cannot authorize an export or attach. Render the current source." : null} tone="info" />
          <DigitalPreview preview={preview} pageIndex={previewPage} loading={previewLoading} error={previewError} onPageIndex={setPreviewPage} onSelect={(next) => { setSelection(next); setStage("edit"); }} onRetry={() => { void renderPreview(); }} />
          <Button label="Render current source" loading={busy === "preview"} disabled={busy !== null} onPress={() => { void renderPreview(); }} />
          <Button label="Save private draft" variant="secondary" loading={busy === "save"} disabled={busy !== null} onPress={saveDraft} />
          <Button label="Continue to export review" variant="secondary" disabled={!previewCurrent || busy !== null} onPress={() => setStage("attach")} />
        </View>
      ) : null}
      {stage === "attach" ? (
        <View style={{ gap: space.lg }}>
          <H2>Review before replacing a file</H2>
          <Body muted>Export can only use the latest saved revision. It stays private until you review the exact title, page count, and export, then explicitly attach it.</Body>
          <Notice text={savedGeneration !== draftGeneration ? "Edits are not saved yet. Save the private source before exporting." : !previewCurrent ? "Render the latest source. An earlier preview cannot authorize an attach." : null} tone="info" />
          {preview ? <DigitalPreview preview={preview} pageIndex={previewPage} loading={previewLoading} error={previewError} onPageIndex={setPreviewPage} onSelect={(next) => { setSelection(next); setStage("edit"); }} onRetry={() => { void renderPreview(); }} /> : null}
          <Button label="Save latest private draft" variant="secondary" loading={busy === "save"} disabled={busy !== null || savedGeneration === draftGeneration} onPress={saveDraft} />
          <Button label="Render latest actual preview" variant="secondary" loading={busy === "preview"} disabled={busy !== null} onPress={() => { void renderPreview(); }} />
          <Button label={exported && reviewedExport ? "Export again from this saved revision" : "Export current saved revision"} loading={busy === "export"} disabled={busy !== null || savedGeneration !== draftGeneration || !previewCurrent} onPress={exportCurrentRevision} />
          {exported ? <View style={{ gap: space.sm, padding: space.md, borderWidth: 1, borderColor: c.line, borderRadius: radius.md, backgroundColor: c.surface }}><Text style={[type.heading, { color: c.ink }]}>Private export</Text><Text style={[type.small, { color: c.muted }]}>{exported.page_count} rendered pages · saved revision {exported.revision}</Text><Button label="Open private PDF" variant="secondary" onPress={() => { void openPrivateExport(exported.pdf_url, "PDF"); }} /><Button label="Open private cover" variant="secondary" onPress={() => { void openPrivateExport(exported.cover_url, "cover"); }} /></View> : null}
          <Button label="Review and attach export" variant="flash" disabled={!reviewedExport || busy !== null} onPress={openReview} />
        </View>
      ) : null}
      <Notice text={message?.text ?? null} tone={message?.tone} />
      <AttachReviewModal visible={showReview} product={product} document={document} candidate={attachCandidate} liveAcknowledged={liveAcknowledged} busy={busy === "attach"} onAcknowledge={() => setLiveAcknowledged((value) => !value)} onCancel={() => { if (!busy) { setShowReview(false); setAttachCandidate(null); } }} onAttach={attachReviewedExport} />
    </Screen>
  );
}

function AttachReviewModal({ visible, product, document, candidate, liveAcknowledged, busy, onAcknowledge, onCancel, onAttach }: {
  visible: boolean;
  product: Product | null;
  document: DigitalDocument;
  candidate: DigitalExport | null;
  liveAcknowledged: boolean;
  busy: boolean;
  onAcknowledge: () => void;
  onCancel: () => void;
  onAttach: () => void;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const live = product?.status === "live";
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
    <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" }}>
      <ScrollView style={{ maxHeight: "85%" }} contentContainerStyle={{ paddingTop: space.xl, paddingBottom: Math.max(insets.bottom, space.lg) }} keyboardShouldPersistTaps="handled">
        <View style={{ gap: space.md, paddingHorizontal: space.xl, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, backgroundColor: c.bg }}>
          <H2>Final export review</H2>
          <Text style={[type.body, { color: c.ink }]}>Title: {document.title || "Untitled digital design"}</Text>
          <Text style={[type.body, { color: c.ink }]}>Source pages: {document.pages.length}</Text>
          <Text style={[type.small, { color: c.muted }]}>Export: {candidate ? `${candidate.page_count} rendered pages · saved revision ${candidate.revision}` : "No current export"}</Text>
          <Text style={[type.small, { color: c.muted }]}>Attaching replaces only this product&apos;s delivery file and cover with this frozen export revision. It does not publish the product, change its price, listing copy, plan, or billing.</Text>
          {live ? <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: liveAcknowledged }} onPress={onAcknowledge} style={{ flexDirection: "row", alignItems: "flex-start", gap: space.sm, padding: space.md, borderWidth: 1, borderRadius: radius.md, borderColor: liveAcknowledged ? c.accent : c.line, backgroundColor: c.surface }}><View style={{ width: 22, height: 22, marginTop: 1, borderRadius: 4, borderWidth: 2, borderColor: c.accent, backgroundColor: liveAcknowledged ? c.accent : "transparent", alignItems: "center", justifyContent: "center" }}><Text style={{ color: c.onAccent, fontFamily: "System" }}>{liveAcknowledged ? "✓" : ""}</Text></View><Text style={[type.small, { color: c.ink, flex: 1 }]}>I understand that this live product&apos;s buyer download will be replaced by the reviewed export above. Earlier paid-order references remain protected by the server.</Text></Pressable> : null}
          <Button label="Keep export private" variant="secondary" disabled={busy} onPress={onCancel} />
          <Button label={live ? "Attach and replace live delivery" : "Attach reviewed export"} variant="flash" loading={busy} disabled={!candidate || (live && !liveAcknowledged)} onPress={onAttach} />
        </View>
      </ScrollView>
    </View>
  </Modal>;
}

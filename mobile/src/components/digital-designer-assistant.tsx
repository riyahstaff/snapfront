import React, { useEffect, useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Body, Button, Field, Notice, Pill } from "./ui";
import { account } from "@/lib/account-store";
import { api, ApiError, type DigitalDesignerProposal, type DigitalDocument, type DigitalIdea } from "@/lib/api";
import { imageAssistant, imageJobRunning, imageRequestKey, type ImageJob } from "@/lib/image-assistant";
import { applyMiraImages } from "@/lib/mira-images";
import { space, type, useColors } from "@/lib/theme";

type Proposal = { result: DigitalDesignerProposal; source: string; storeRevision: number; keys: string[]; jobs: (ImageJob | undefined)[] };
type Props = { storeId: string; productId: string; document: DigitalDocument; disabled: boolean; onApply: (document: DigitalDocument) => void; onBusyChange?: (busy: boolean) => void };
export function DigitalDesignerAssistant({ storeId, productId, document, disabled, onApply, onBusyChange }: Props) {
  const c = useColors();
  const [idea, setIdea] = useState<DigitalIdea | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [scope, setScope] = useState<"page" | "product">(document.pages.length > 12 ? "page" : "product");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const mounted = useRef(true), inFlight = useRef(false);
  const safePage = Math.min(pageIndex, document.pages.length - 1);
  const source = JSON.stringify(document), sourceRef = useRef(source);
  useEffect(() => { sourceRef.current = source; }, [source]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { onBusyChange?.(busy); return () => onBusyChange?.(false); }, [busy, onBusyChange]);
  useEffect(() => { let active = true; api.productIdea(storeId, productId).then(r => { if (active) setIdea(r.idea); }).catch(() => {}); return () => { active = false; }; }, [storeId, productId]);
  function current(revision: number) { return mounted.current && account.get()?.id === storeId && api.storeRevision() === revision; }
  async function ask(request: string) {
    if (inFlight.current || disabled || account.get()?.id !== storeId) return;
    const revision = api.storeRevision();
    inFlight.current = true; setBusy(true); setError(null); setProposal(null); setProgress("Mira is planning your changes…");
    try {
      const result = await api.digitalDesigner(storeId, productId, { document, page_index: safePage, message: request, scope });
      if (!current(revision)) return;
      setProposal({ result, source, storeRevision: revision, keys: (result.image_requests ?? []).map(() => imageRequestKey()), jobs: [] });
    } catch (err) { if (current(revision)) setError(err instanceof ApiError ? err.message : "Mira could not finish. Please try again."); }
    finally { inFlight.current = false; if (mounted.current) { setBusy(false); setProgress(null); } }
  }
  const stale = Boolean(proposal && (proposal.source !== source || proposal.storeRevision !== api.storeRevision() || account.get()?.id !== storeId));
  async function apply(withImages = true) {
    if (!proposal || stale || disabled || inFlight.current) return;
    const pending = { ...proposal, jobs: [...proposal.jobs] }, requests = pending.result.image_requests ?? [];
    const valid = () => current(pending.storeRevision) && sourceRef.current === pending.source;
    const remember = (index: number, job: ImageJob) => { pending.jobs[index] = job; if (valid()) setProposal(previous => previous?.keys === pending.keys ? { ...previous, jobs: [...pending.jobs] } : previous); };
    inFlight.current = true; setBusy(true); setError(null);
    try {
      if (withImages) for (let i = 0; i < requests.length; i++) {
        if (!valid()) return;
        const request = requests[i];
        setProgress(`Creating image ${i + 1} of ${requests.length}. Keep this page open…`);
        let job = pending.jobs[i];
        if (!job) job = await imageAssistant.start({ operation: "digital-art", product_id: productId, prompt: request.prompt, aspect: request.aspect, idempotency_key: pending.keys[i] }, storeId);
        remember(i,job);
        // Retry polls the same durable job, never purchases a duplicate.
        for (let poll = 0; imageJobRunning(job) && poll < 36; poll++) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          if (!valid()) return;
          job = await imageAssistant.job(job.id, storeId); remember(i,job);
        }
        if (!valid()) return;
        if (job.status === "failed") throw new Error(job.error || "This image could not be created. Apply the writing now or ask Mira for another image proposal.");
        if (job.status !== "done") throw new Error("Your image is still being created. Choose Apply again to check the same request. No duplicate image will be purchased.");
      }
      if (!valid()) return;
      onApply(applyMiraImages(pending.result.document, requests, pending.jobs, productId));
      setProposal(null); setMessage("");
    } catch (err) { if (valid()) setError(err instanceof Error ? err.message : "The images could not finish. Your current draft is unchanged."); }
    finally { inFlight.current = false; if (mounted.current) { setBusy(false); setProgress(null); } }
  }
  const imageRequests = proposal?.result.image_requests ?? [];
  return <View style={{ padding: space.lg, gap: space.md, borderRadius: 18, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface }}>
    <Pill text="Mira · Your product designer" tone="flash" />
    <Text style={[type.heading, { color: c.ink }]}>Tell Mira what you have in mind.</Text>
    <Body muted>Describe who it’s for, what it should say, and the pictures you want. Mira can write the pages, change the style, and add real images.</Body>
    {idea?.external_requirement ? <Notice text={idea.external_requirement} tone="info" /> : null}
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}><Button label="Whole product" variant={scope === "product" ? "primary" : "secondary"} disabled={busy || document.pages.length > 12} onPress={() => setScope("product")} /><Button label="One page" variant={scope === "page" ? "primary" : "secondary"} disabled={busy} onPress={() => setScope("page")} /></View>
    {document.pages.length > 12 ? <Body muted>For longer products, work on one page at a time.</Body> : null}
    {scope === "page" ? <ScrollView horizontal keyboardShouldPersistTaps="handled"><View style={{ flexDirection: "row", gap: 8 }}>{document.pages.map((page,index) => <Button key={page.id} label={`${index + 1}. ${page.title}`} variant={safePage === index ? "primary" : "secondary"} disabled={busy} onPress={() => { setPageIndex(index); setProposal(null); }} />)}</View></ScrollView> : null}
    <Field label="What would you like to create or change?" multiline maxLength={1600} value={message} onChangeText={setMessage} placeholder="Create a student planner for an introverted young woman who loves roses and rivers. Use soft pink and blue, gentle prompts, and a few pictures of roses and flowing water." />
    <Button label="Ask Mira" loading={busy} disabled={disabled || busy || message.trim().length < 4} onPress={() => void ask(message)} />
    <Button label={scope === "product" ? "Help me finish this draft" : "Help me write this page"} variant="secondary" disabled={busy || disabled} onPress={() => void ask(`Develop ${scope === "product" ? "the whole product" : "this page"} for my idea and audience. Replace draft instructions with useful original content, concrete examples, and activities. Add two relevant images, replacing the starter topic-image if present. Give it a suitable visual style.`)} />
    <Text style={[type.small, { color: c.muted }]}>Uses your Pro assistant allowance. Images use your image allowance only when you apply the proposal.</Text>
    <Notice text={progress} tone="info" /><Notice text={error} tone="error" />
    {proposal ? <View style={{ gap: space.md }}><Text style={[type.heading, { color: c.ink }]}>Mira’s proposal</Text><Body>{proposal.result.reply}</Body>
      {proposal.result.changed ? <>
        <ScrollView style={{ maxHeight: 280 }} nestedScrollEnabled>{(proposal.result.scope === "product" ? proposal.result.document.pages : [proposal.result.document.pages[proposal.result.page_index]]).map(page => <View key={page.id} style={{ gap: 8, marginBottom: 16 }}><Text style={[type.label, { color: c.ink }]}>{page.title}</Text>{page.blocks.filter(b => b.kind !== "image").map(b => <Text key={b.id} style={[type.small, { color: c.muted }]}>{b.kind === "list" ? b.items?.map(item => `• ${item}`).join("\n") : b.text}</Text>)}</View>)}</ScrollView>
        {imageRequests.length ? <View style={{ gap: 8 }}><Text style={[type.label, { color: c.ink }]}>{imageRequests.length} new images to create</Text>{imageRequests.map((request,i) => <Body key={i} muted>{i + 1}. {request.prompt} · {proposal.result.document.pages.find(page => page.id === request.page_id)?.title}</Body>)}<Body muted>Applying uses up to {imageRequests.length} images from your allowance. Completed images will be placed into these pages.</Body></View> : null}
        <Notice text={stale ? "Your draft changed. Ask Mira again so your latest edits are kept." : null} tone="info" />
        <Button label={imageRequests.length ? "Apply changes & create images" : "Apply changes"} disabled={stale || disabled || busy} onPress={() => void apply()} />
        {imageRequests.length ? <Button label="Apply without creating more images" variant="secondary" disabled={stale || disabled || busy} onPress={() => void apply(false)} /> : null}
        <Body muted>You can undo applied changes. Then click Next to preview the result.</Body>
      </> : null}<Button label="Dismiss proposal" variant="ghost" disabled={busy} onPress={() => setProposal(null)} /></View> : null}
  </View>;
}

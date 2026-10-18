import React, { useEffect, useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Body, Button, Field, Notice, Pill } from "./ui";
import { account } from "@/lib/account-store";
import { api, ApiError, type DigitalDesignerProposal, type DigitalDocument, type DigitalIdea } from "@/lib/api";
import { space, type, useColors } from "@/lib/theme";

type Props = { storeId: string; productId: string; document: DigitalDocument; disabled: boolean; onApply: (document: DigitalDocument) => void };
export function DigitalDesignerAssistant({ storeId, productId, document, disabled, onApply }: Props) {
  const c = useColors();
  const [idea, setIdea] = useState<DigitalIdea | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<{ result: DigitalDesignerProposal; source: string; storeRevision: number } | null>(null);
  const mounted = useRef(true);
  const inFlight = useRef(false);
  const safePage = Math.min(pageIndex, document.pages.length - 1);
  const source = JSON.stringify(document);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { let active = true; api.productIdea(storeId, productId).then((r) => { if (active) setIdea(r.idea); }).catch(() => {}); return () => { active = false; }; }, [storeId, productId]);
  async function ask(request: string) {
    if (inFlight.current || disabled || account.get()?.id !== storeId) return;
    const revision = api.storeRevision();
    inFlight.current = true; setBusy(true); setError(null); setProposal(null);
    try {
      const result = await api.digitalDesigner(storeId, productId, { document, page_index: safePage, message: request });
      if (!mounted.current || account.get()?.id !== storeId || api.storeRevision() !== revision) return;
      setProposal({ result, source, storeRevision: revision });
    } catch (err) { if (mounted.current && account.get()?.id === storeId && api.storeRevision() === revision) setError(err instanceof ApiError ? err.message : "Mira could not finish. Please try again."); }
    finally { inFlight.current = false; if (mounted.current) setBusy(false); }
  }
  const stale = proposal && (proposal.source !== source || proposal.storeRevision !== api.storeRevision() || account.get()?.id !== storeId);
  return <View style={{ padding: space.lg, gap: space.md, borderRadius: 18, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface }}>
    <Pill text="Mira · Digital product designer" tone="flash" />
    {idea ? <><Text style={[type.heading, { color: c.ink }]}>{idea.title}</Text><Body muted>{idea.brief}</Body>{idea.external_requirement ? <Notice text={idea.external_requirement} tone="info" /> : null}</> : null}
    <Body muted>Choose a page and tell Mira what to write or how it should look. Review the proposal before applying it. Uses your Pro assistant allowance.</Body>
    <ScrollView horizontal keyboardShouldPersistTaps="handled"><View style={{ flexDirection: "row", gap: 8 }}>{document.pages.map((page, index) => <Button key={page.id} label={`${index + 1}. ${page.title}`} variant={safePage === index ? "primary" : "secondary"} disabled={busy} onPress={() => { setPageIndex(index); setProposal(null); }} />)}</View></ScrollView>
    <Field label="Ask Mira" multiline maxLength={1600} value={message} onChangeText={setMessage} placeholder="Make this page useful for busy parents, with a worked example and a weekly checklist." />
    <View style={{ gap: 8 }}><Button label={busy ? "Mira is designing…" : "Ask Mira"} loading={busy} disabled={disabled || message.trim().length < 4} onPress={() => void ask(message)} /><Button label="Help me develop this page" variant="secondary" disabled={busy || disabled} onPress={() => void ask("Develop this page for my selected product idea and audience. Replace the draft guidance with useful original content, one concrete example, and a reusable activity. Keep the current visual style.")} /></View>
    <Notice text={error} tone="error" />
    {proposal ? <View style={{ gap: 10 }}><Body>{proposal.result.reply}</Body>{proposal.result.changed ? <><Text style={[type.label, { color: c.ink }]}>Proposed page: {proposal.result.document.pages[proposal.result.page_index].title}</Text><ScrollView style={{ maxHeight: 240 }}>{proposal.result.document.pages[proposal.result.page_index].blocks.filter((b) => b.kind !== "image").map((b) => <Text key={b.id} style={[type.small, { color: c.muted, marginBottom: 10 }]}>{b.kind === "list" ? b.items?.map((item) => `• ${item}`).join("\n") : b.text}</Text>)}</ScrollView><Notice text={stale ? "Your draft changed after this proposal. Ask again so current edits are preserved." : null} tone="info" /><Button label="Apply proposal to my draft" disabled={Boolean(stale) || disabled || busy} onPress={() => { if (stale || disabled || account.get()?.id !== storeId) return; onApply(proposal.result.document); setProposal(null); }} /><Body muted>You can undo this change. Save your draft and review its preview when ready.</Body></> : null}<Button label="Dismiss proposal" variant="ghost" onPress={() => setProposal(null)} /></View> : null}
  </View>;
}

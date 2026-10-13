import React, { useEffect, useState } from "react";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { DigitalDesignPicker } from "@/components/digital-design-picker";
import { Body, Button, H1, Notice, Pill, Screen } from "@/components/ui";
import { account, useMe } from "@/lib/account-store";
import { api, ApiError } from "@/lib/api";
import { digitalDesignRevision, type DigitalTemplateSummary } from "@/lib/digital-design";
import { space, type, useColors } from "@/lib/theme";

function firstParam(value: string | string[] | undefined): string | null {
  return typeof value === "string" && value ? value : null;
}

/** The explicit Choose step. Selecting a card never creates, publishes, or attaches a product. */
export default function DigitalDesignsScreen() {
  const c = useColors();
  const me = useMe();
  const params = useLocalSearchParams<{ rebuild_product_id?: string | string[]; edit_product_id?: string | string[]; storeId?: string | string[] }>();
  const rebuildProductId = firstParam(params.rebuild_product_id);
  const editProductId = firstParam(params.edit_product_id);
  const requestedStoreId = firstParam(params.storeId);
  const existingProductId = rebuildProductId ?? editProductId;
  const existingOwnerMatches = !existingProductId || Boolean(requestedStoreId && requestedStoreId === me?.id);
  const [remoteTemplates, setRemoteTemplates] = useState<DigitalTemplateSummary[] | null>(null);
  const [selected, setSelected] = useState<DigitalTemplateSummary | null>(null);
  const [busy, setBusy] = useState<"draft" | null>(null);
  const [message, setMessage] = useState<{ text: string; tone: "error" | "info" } | null>(null);

  useEffect(() => {
    let active = true;
    api.digitalDesigns().then((catalog) => {
      if (active) setRemoteTemplates(catalog.templates);
    }).catch(() => {
      if (active) setMessage({ text: "The latest collection could not load. All 50 signature designs are ready to browse offline.", tone: "info" });
    });
    return () => { active = false; };
  }, []);

  function beginAi() {
    if (!selected) return;
    // /create is this project's generation screen; it forwards this exact template_id to the API.
    router.push({ pathname: "/create", params: { template_id: selected.id, format: selected.format, design_revision: String(digitalDesignRevision(selected, 2)) } });
  }

  async function beginDraft() {
    if (!selected || busy || !me || !existingOwnerMatches) return;
    const owner = me.id;
    const storeRevision = api.storeRevision();
    setBusy("draft");
    setMessage(null);
    try {
      if (rebuildProductId) {
        // No server mutation here: the editor explains the legacy boundary and requires explicit rebuild_legacy on save.
        router.replace({ pathname: "/digital-editor", params: { id: rebuildProductId, storeId: owner, template_id: selected.id, legacy_rebuild: "1" } });
        return;
      }
      if (editProductId) {
        // The editor applies only the selected visual style after confirmation; source pages and writing are preserved.
        router.replace({ pathname: "/digital-editor", params: { id: editProductId, storeId: owner, template_id: selected.id, replace_template: "1" } });
        return;
      }
      const result = await api.createDigitalDesign(owner, { template_id: selected.id, design_revision: digitalDesignRevision(selected, 2) });
      if (api.storeRevision() !== storeRevision || account.get()?.id !== owner) return;
      // This is the only creation call; returning to the library never creates another draft automatically.
      router.replace({ pathname: "/digital-editor", params: { id: result.product.id, storeId: owner } });
    } catch (error) {
      if (api.storeRevision() === storeRevision && account.get()?.id === owner) {
        const text = error instanceof ApiError ? error.message : "Couldn't create the private design draft. Try again.";
        setMessage({ text: error instanceof ApiError && (error.status === 404 || error.status === 501) ? "Digital Design Studio needs the latest backend before it can create a draft. Nothing was created." : text, tone: "error" });
      }
    } finally {
      if (api.storeRevision() === storeRevision && account.get()?.id === owner) setBusy(null);
    }
  }

  const rebuilding = Boolean(rebuildProductId);
  const editingExisting = Boolean(editProductId);
  const title = rebuilding ? "Choose a fresh source design." : editingExisting ? "Choose a visual style that keeps your content." : "Start with a design you can fully edit.";
  const explanation = rebuilding
    ? "Your original PDF cannot be imported as editable source. Choose a template, replace its sample copy, then explicitly save a new source. Your current buyer file stays unchanged until you later attach an exported revision."
    : editingExisting
      ? "Choose a palette and font direction. The editor will keep your exact existing pages, blocks, text, and owned image references; it will never reset them to template sample copy."
      : "Choose from 50 signature designs. You will review every sample word, preview real rendered pages, and choose whether to attach an export.";

  return (
    <Screen>
      <Stack.Screen options={{ title: rebuilding ? "Rebuild digital source" : editingExisting ? "Choose visual style" : "Digital designs" }} />
      <View style={{ gap: space.sm }}>
        <Pill text="1 · Choose" tone="flash" />
        <H1>{title}</H1>
        <Body muted>{explanation}</Body>
      </View>
      {!existingOwnerMatches ? <Notice text="The selected store changed. This product was not opened for the new store; return to the current product before choosing a design." tone="error" /> : null}
      <DigitalDesignPicker remoteTemplates={remoteTemplates} selectedId={selected?.id} onSelect={(template) => { setSelected(template); setMessage(null); }} />
      {selected ? (
        <View style={{ gap: space.sm, padding: space.lg, borderWidth: 1, borderColor: c.line, borderRadius: 18, backgroundColor: c.surface }}>
          <Text style={[type.heading, { color: c.ink }]}>{selected.name}</Text>
          <Text style={[type.small, { color: c.muted }]}>{editingExisting ? "Visual style only: your existing pages and words remain unchanged until you explicitly confirm the style in the editor." : `${selected.sample.title} · sample copy is editable and should be reviewed before selling.`}</Text>
          <Button label={rebuilding ? "Use this template to rebuild source" : editingExisting ? "Use this visual style" : "Create private editable draft"} loading={busy === "draft"} disabled={!existingOwnerMatches} onPress={beginDraft} />
          {!rebuilding && !editingExisting ? <Button label="Use this template with AI writing" variant="secondary" onPress={beginAi} /> : null}
          {!rebuilding && !editingExisting ? <Text style={[type.small, { color: c.muted }]}>AI writing uses your existing allowance. A private manual draft does not. Neither option publishes or attaches a file.</Text> : null}
        </View>
      ) : null}
      <Notice text={message?.text ?? null} tone={message?.tone} />
    </Screen>
  );
}

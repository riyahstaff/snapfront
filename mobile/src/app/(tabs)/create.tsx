import { DigitalIdeaPicker } from "@/components/digital-idea-picker";
import React, { useEffect, useState } from "react";
import { Pressable, Text, View, Platform } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Body, Button, Field, H1, Notice, Screen } from "@/components/ui";
import { account, useMe } from "@/lib/account-store";
import { api, ApiError, type ProductType } from "@/lib/api";
import { formatFromTemplateId } from "@/lib/digital-design";
import { fonts, radius, space, type, useColors } from "@/lib/theme";

const FALLBACK: ProductType[] = [
  { id: "guide", name: "Mini e-book", sub: "6-chapter how-to guide", price: 12 },
  { id: "checklist", name: "Checklist pack", sub: "Printable checklists and worksheets", price: 8 },
  { id: "hooks", name: "Content prompt pack", sub: "60 hooks and post ideas", price: 15 },
  { id: "quotes", name: "Quote print set", sub: "6 printable 8×10 wall prints", price: 9 },
  { id: "planner", name: "Mini planner", sub: "Weekly, habit and goal pages", price: 10 },
];

function firstParam(value: string | string[] | undefined): string | null {
  return typeof value === "string" && value ? value : null;
}

export default function CreateScreen() {
  const c = useColors();
  const me = useMe();
  const params = useLocalSearchParams<{ template_id?: string | string[]; format?: string | string[]; design_revision?: string | string[] }>();
  const templateId = firstParam(params.template_id);
  const templateDesignRevision = firstParam(params.design_revision) === "2" ? 2 : null;
  const [types, setTypes] = useState(FALLBACK);
  const [type_, setType] = useState("guide");
  const [niche, setNiche] = useState("");
  // Older servers still read a colour; the AI art director now picks the real one.
  const color = "cobalt";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const typeForGeneration = templateId ? formatFromTemplateId(templateId) : type_;

  useEffect(() => { api.productTypes().then(setTypes).catch(() => {}); }, []);

  async function generate() {
    const owner = me?.id ?? null;
    const storeRevision = api.storeRevision();
    if (templateId && !owner) { setError("Wait for the selected store before creating this editable AI draft."); return; }
    setBusy(true);
    setError(null);
    try {
      const p = await api.generate({ type: typeForGeneration, niche, color, ...(templateId ? { template_id: templateId, design_revision: templateDesignRevision ?? 2 } : {}) });
      if (templateId && owner) {
        if (api.storeRevision() !== storeRevision || account.get()?.id !== owner) return;
        // The server registers the generated full source first; no generated words are replaced here.
        router.replace({ pathname: "/digital-editor", params: { id: p.id, storeId: owner } });
      } else {
        router.push({ pathname: "/product/[id]", params: { id: p.id } });
      }
    } catch (e) {
      if (!templateId || !owner || (api.storeRevision() === storeRevision && account.get()?.id === owner)) {
        setError(e instanceof ApiError ? e.message : "Couldn't create the product. Try again.");
      }
    } finally {
      if (!templateId || !owner || (api.storeRevision() === storeRevision && account.get()?.id === owner)) setBusy(false);
    }
  }

  return (
    <Screen>
      <View style={{ gap: space.sm }}>
        <H1>{templateId ? "Write into your chosen design." : <>Make something{"\n"}people already buy.</>}</H1>
        <Body muted>{templateId ? `AI will create a private ${typeForGeneration} product using your selected editable design template. You will review the full source, renderer preview, and export before any buyer file changes.` : "Choose an idea below, or start with a format and audience of your own. Snapfront helps you write, design and prepare a digital product. Review the finished work and set your own price before publishing."}</Body>
        <Button label={templateId ? "Back to design library" : "Browse 50 editable designs"} variant={templateId ? "secondary" : "primary"} onPress={() => router.push("/digital-designs")} />
        {!templateId ? <Body muted>10 e-book designs · 10 checklists · 10 content packs · 10 quote prints · 10 planners. Pick a pictured design, then make it yours.</Body> : null}
        {!templateId ? <Button label="See which formats sell best" variant="ghost" style={{ alignSelf: "flex-start", paddingHorizontal: 0, minHeight: 36 }} onPress={() => router.push("/trends")} /> : null}
      </View>
      {!templateId ? <DigitalIdeaPicker key={me?.id ?? "loading"} /> : null}
      <View style={Platform.OS === "web" ? { flexDirection: "row", flexWrap: "wrap", gap: space.md } : { gap: space.sm }} accessibilityRole="radiogroup">
        {types.map((t) => {
          const on = t.id === typeForGeneration;
          return (
            <Pressable key={t.id} disabled={Boolean(templateId)} onPress={() => setType(t.id)} accessibilityRole="radio" accessibilityState={{ selected: on, disabled: Boolean(templateId) }}
              style={{ ...(Platform.OS === "web" ? { flexGrow: 1, flexBasis: 180, minHeight: 92 } : null), flexDirection: "row", alignItems: "center", gap: space.md, padding: space.md, borderRadius: radius.md, borderWidth: on ? 2 : 1, borderColor: on ? c.accent : c.line, backgroundColor: c.surface, opacity: templateId && !on ? 0.45 : 1 }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[type.heading, { color: c.ink }]}>{t.name}</Text>
                <Text style={[type.small, { color: c.muted }]}>{t.sub}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }} accessible accessibilityLabel={`Usually sells for about ${t.price} dollars`}>
                <Text style={[type.small, { color: c.muted }]}>Sells for</Text>
                <Text style={{ fontFamily: fonts.display, fontSize: 16, color: c.ink }}>~${t.price}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      <Field label="Who is it for?" hint="Be specific: the audience and the problem it solves." value={niche} onChangeText={setNiche}
        placeholder="e.g. busy parents who meal prep on a budget" />
      {!templateId ? <View style={{ gap: 4, padding: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface }}>
        <Text style={[type.label, { color: c.ink }]}>Designed for your topic</Text>
        <Text style={[type.small, { color: c.muted }]}>Snapfront’s AI art director reads your product and designs a cover and inside images that fit it, like a styled meal for a recipe book.</Text>
      </View> : <Body muted>Your chosen design keeps its own colors. You can change them in the editor after the writing is ready.</Body>}
      <Notice text={busy ? "Writing your product and designing its cover and images. This takes about two minutes." : error} tone={busy ? "info" : "error"} />
      <Button label={busy ? "Creating…" : templateId ? "Create editable AI draft" : "Create product"} onPress={generate} loading={busy} disabled={niche.trim().length < 4} />
    </Screen>
  );
}

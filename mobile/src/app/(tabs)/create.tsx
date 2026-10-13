import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
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
const COLORS = [
  { id: "cobalt", hex: "#2C47F5", name: "Cobalt" }, { id: "forest", hex: "#1E8E5A", name: "Forest" },
  { id: "brick", hex: "#C2372B", name: "Brick" }, { id: "violet", hex: "#7A3EC8", name: "Violet" },
  { id: "ink", hex: "#16152E", name: "Ink" }, { id: "amber", hex: "#D9822B", name: "Amber" },
];

function firstParam(value: string | string[] | undefined): string | null {
  return typeof value === "string" && value ? value : null;
}

export default function CreateScreen() {
  const c = useColors();
  const me = useMe();
  const params = useLocalSearchParams<{ template_id?: string | string[]; format?: string | string[] }>();
  const templateId = firstParam(params.template_id);
  const [types, setTypes] = useState(FALLBACK);
  const [type_, setType] = useState("guide");
  const [niche, setNiche] = useState("");
  const [color, setColor] = useState("cobalt");
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
      const p = await api.generate({ type: typeForGeneration, niche, color, ...(templateId ? { template_id: templateId } : {}) });
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
        <Body muted>{templateId ? `AI will create a private ${typeForGeneration} product using your selected editable design template. You will review the full source, renderer preview, and export before any buyer file changes.` : "Pick a best-selling format and a niche. Snapfront writes the product, designs the cover, builds the PDF and drafts the listing. Prices are what buyers usually pay; you set your own and keep the sales."}</Body>
        <Button label={templateId ? "Back to design library" : "Browse 50 editable designs"} variant="ghost" style={{ alignSelf: "flex-start", paddingHorizontal: 0, minHeight: 36 }} onPress={() => router.push("/digital-designs")} />
        {!templateId ? <Button label="See which formats sell best" variant="ghost" style={{ alignSelf: "flex-start", paddingHorizontal: 0, minHeight: 36 }} onPress={() => router.push("/trends")} /> : null}
      </View>
      <View style={{ gap: space.sm }} accessibilityRole="radiogroup">
        {types.map((t) => {
          const on = t.id === typeForGeneration;
          return (
            <Pressable key={t.id} disabled={Boolean(templateId)} onPress={() => setType(t.id)} accessibilityRole="radio" accessibilityState={{ selected: on, disabled: Boolean(templateId) }}
              style={{ flexDirection: "row", alignItems: "center", gap: space.md, padding: space.md, borderRadius: radius.md, borderWidth: on ? 2 : 1, borderColor: on ? c.accent : c.line, backgroundColor: c.surface, opacity: templateId && !on ? 0.45 : 1 }}>
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
      {!templateId ? <View style={{ gap: space.sm }}>
        <Text style={[type.label, { color: c.ink }]}>Cover colour</Text>
        <View style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap" }}>
          {COLORS.map((k) => (
            <Pressable key={k.id} onPress={() => setColor(k.id)} accessibilityRole="radio" accessibilityLabel={k.name} accessibilityState={{ selected: color === k.id }}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: k.hex, borderWidth: 3, borderColor: color === k.id ? c.flash : "transparent" }} />
          ))}
        </View>
      </View> : <Body muted>Your chosen design keeps its own colors. You can change them in the editor after the writing is ready.</Body>}
      <Notice text={busy ? "Writing and designing your product. This takes about a minute." : error} tone={busy ? "info" : "error"} />
      <Button label={busy ? "Creating…" : templateId ? "Create editable AI draft" : "Create product"} onPress={generate} loading={busy} disabled={niche.trim().length < 4} />
    </Screen>
  );
}

import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Body, Button, Field, H1, Notice, Screen } from "@/components/ui";
import { api, ApiError, type ProductType } from "@/lib/api";
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

export default function CreateScreen() {
  const c = useColors();
  const [types, setTypes] = useState(FALLBACK);
  const [type_, setType] = useState("guide");
  const [niche, setNiche] = useState("");
  const [color, setColor] = useState("cobalt");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { api.productTypes().then(setTypes).catch(() => {}); }, []);

  async function generate() {
    setBusy(true); setError(null);
    try {
      const p = await api.generate({ type: type_, niche, color });
      router.push({ pathname: "/product/[id]", params: { id: p.id } });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't create the product. Try again.");
    } finally { setBusy(false); }
  }

  return (
    <Screen>
      <View style={{ gap: space.sm }}>
        <H1>Make something{"\n"}people already buy.</H1>
        <Body muted>Pick a best-selling format and a niche. Snapfront writes the product, designs the cover, builds the PDF and drafts the listing.</Body>
        <Button label="See which formats sell best" variant="ghost" style={{ alignSelf: "flex-start", paddingHorizontal: 0, minHeight: 36 }} onPress={() => router.push("/trends")} />
      </View>
      <View style={{ gap: space.sm }} accessibilityRole="radiogroup">
        {types.map((t) => {
          const on = t.id === type_;
          return (
            <Pressable key={t.id} onPress={() => setType(t.id)} accessibilityRole="radio" accessibilityState={{ selected: on }}
              style={{ flexDirection: "row", alignItems: "center", gap: space.md, padding: space.md, borderRadius: radius.md, borderWidth: on ? 2 : 1, borderColor: on ? c.accent : c.line, backgroundColor: c.surface }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[type.heading, { color: c.ink }]}>{t.name}</Text>
                <Text style={[type.small, { color: c.muted }]}>{t.sub}</Text>
              </View>
              <Text style={{ fontFamily: fonts.display, fontSize: 16, color: c.ink }}>from ${t.price}</Text>
            </Pressable>
          );
        })}
      </View>
      <Field label="Who is it for?" hint="Be specific: the audience and the problem it solves." value={niche} onChangeText={setNiche}
        placeholder="e.g. busy parents who meal prep on a budget" />
      <View style={{ gap: space.sm }}>
        <Text style={[type.label, { color: c.ink }]}>Cover colour</Text>
        <View style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap" }}>
          {COLORS.map((k) => (
            <Pressable key={k.id} onPress={() => setColor(k.id)} accessibilityRole="radio" accessibilityLabel={k.name} accessibilityState={{ selected: color === k.id }}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: k.hex, borderWidth: 3, borderColor: color === k.id ? c.flash : "transparent" }} />
          ))}
        </View>
      </View>
      <Notice text={busy ? "Writing and designing your product. This takes about a minute." : error} tone={busy ? "info" : "error"} />
      <Button label={busy ? "Creating…" : "Create product"} onPress={generate} loading={busy} disabled={niche.trim().length < 4} />
    </Screen>
  );
}

import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Body, Button, Field, H2, Notice, Segmented } from "@/components/ui";
import { api, ApiError, type Product, type VariantInput } from "@/lib/api";
import { fonts, radius, space, type, useColors } from "@/lib/theme";

type Row = { key: string; id?: string; name: string; price: string; stock: string };
const toRow = (v: Product["variants"][number]): Row => ({
  key: v.id, id: v.id, name: v.name, price: v.price_cents == null ? "" : String(v.price), stock: v.inventory == null ? "" : String(v.inventory),
});
const num = (s: string) => (s.trim() === "" ? null : Number(s.replace(/[^0-9.]/g, "")));

/** Stock count, or a list of options (sizes, colours) each with its own price and stock. */
export function StockEditor({ product, onSaved }: { product: Product; onSaved: (p: Product) => void }) {
  const c = useColors();
  const physical = product.kind === "physical";
  const [mode, setMode] = useState<"single" | "options">(product.variants.length ? "options" : "single");
  const [tracked, setTracked] = useState<"unlimited" | "tracked">(product.inventory == null ? "unlimited" : "tracked");
  const [stock, setStock] = useState(product.inventory == null ? "" : String(product.inventory));
  const [optionName, setOptionName] = useState(product.option_name || "Size");
  const [rows, setRows] = useState<Row[]>(product.variants.map(toRow));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; tone: "ok" | "error" } | null>(null);
  const onError = (text: string) => setMsg({ text, tone: "error" });

  const patch = (key: string, p: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...p } : r)));
  const addRow = () => setRows((rs) => [...rs, { key: Math.random().toString(36).slice(2), name: "", price: "", stock: "" }]);

  async function save() {
    setSaving(true); setMsg(null);
    try {
      let body;
      if (mode === "options") {
        const variants: VariantInput[] = rows.filter((r) => r.name.trim()).map((r) => ({ id: r.id, name: r.name.trim(), price: num(r.price), inventory: physical ? num(r.stock) : null }));
        if (!variants.length) { onError("Add at least one option, or switch to a single item."); return; }
        body = { option_name: optionName.trim() || "Option", variants };
      } else {
        body = { variants: [], option_name: "", inventory: physical && tracked === "tracked" ? Math.max(0, Math.floor(num(stock) ?? 0)) : null };
      }
      const next = await api.updateProduct(product.id, body);
      // Adopt the server's ids so the next save updates these rows instead of adding new ones.
      setRows(next.variants.map(toRow));
      setStock(next.inventory == null ? "" : String(next.inventory));
      onSaved(next);
      setMsg({ text: "Saved.", tone: "ok" });
    } catch (e) {
      onError(e instanceof ApiError ? e.message : "Couldn't save stock and options.");
    } finally { setSaving(false); }
  }

  const cell = { borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, color: c.ink, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 10, fontFamily: fonts.body, fontSize: 15 } as const;

  return (
    <View style={{ gap: space.md }}>
      <H2>{physical ? "Stock and options" : "Options"}</H2>
      <Segmented value={mode} onChange={(m) => { setMode(m); if (m === "options" && !rows.length) addRow(); }} options={[{ value: "single", label: "One version" }, { value: "options", label: physical ? "Sizes, colours…" : "Formats, tiers…" }]} />

      {mode === "single" ? (
        physical ? (
          <View style={{ gap: space.md }}>
            <Segmented value={tracked} onChange={setTracked} options={[{ value: "unlimited", label: "Don't track" }, { value: "tracked", label: "Track stock" }]} />
            {tracked === "tracked" ? (
              <Field label="In stock" hint="Goes down with each sale. At 0 the product shows as sold out." value={stock} onChangeText={setStock} keyboardType="number-pad" placeholder="0" />
            ) : <Body muted>Buyers can order any quantity.</Body>}
          </View>
        ) : <Body muted>Digital downloads never run out.</Body>
      ) : (
        <View style={{ gap: space.md }}>
          <Field label="What buyers choose" hint="Shown above the choices, e.g. Size or Colour." value={optionName} onChangeText={setOptionName} maxLength={30} />
          <View style={{ flexDirection: "row", gap: space.sm, paddingRight: 36 }}>
            <Text style={[type.small, { color: c.muted, flex: 2 }]}>Choice</Text>
            <Text style={[type.small, { color: c.muted, flex: 1.2 }]}>Price</Text>
            {physical ? <Text style={[type.small, { color: c.muted, flex: 1 }]}>Stock</Text> : null}
          </View>
          {rows.map((r, i) => (
            <View key={r.key} style={{ flexDirection: "row", gap: space.sm, alignItems: "center" }}>
              <TextInput value={r.name} onChangeText={(t) => patch(r.key, { name: t })} placeholder={["S", "M", "L"][i] ?? "Choice"} placeholderTextColor={c.muted}
                accessibilityLabel={`Choice ${i + 1} name`} style={[cell, { flex: 2 }]} maxLength={60} />
              <TextInput value={r.price} onChangeText={(t) => patch(r.key, { price: t })} placeholder={String(product.price)} placeholderTextColor={c.muted}
                accessibilityLabel={`Choice ${i + 1} price, blank uses the product price`} keyboardType="decimal-pad" style={[cell, { flex: 1.2 }]} />
              {physical ? (
                <TextInput value={r.stock} onChangeText={(t) => patch(r.key, { stock: t })} placeholder="Any" placeholderTextColor={c.muted}
                  accessibilityLabel={`Choice ${i + 1} stock, blank for unlimited`} keyboardType="number-pad" style={[cell, { flex: 1 }]} />
              ) : null}
              <Pressable onPress={() => setRows((rs) => rs.filter((x) => x.key !== r.key))} accessibilityRole="button" accessibilityLabel={`Remove choice ${r.name || i + 1}`} hitSlop={8}
                style={{ width: 28, alignItems: "center" }}>
                <Ionicons name="close-circle" size={22} color={c.muted} />
              </Pressable>
            </View>
          ))}
          <Text style={[type.small, { color: c.muted }]}>Leave price blank to use {`$${product.price.toFixed(2)}`}.{physical ? " Leave stock blank for no limit." : ""}</Text>
          <Button label="Add a choice" variant="ghost" onPress={addRow} icon={<Ionicons name="add" size={18} color={c.accent} />} />
        </View>
      )}
      <Button label="Save stock and options" variant="secondary" loading={saving} onPress={save} />
      <Notice text={msg?.text ?? null} tone={msg?.tone} />
    </View>
  );
}

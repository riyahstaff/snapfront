import React, { useCallback, useState } from "react";
import { Pressable, Share, Switch, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Body, Button, Field, H2, Notice, Screen, Segmented } from "@/components/ui";
import { api, ApiError, money, type Discount, type Seller } from "@/lib/api";
import { fonts, radius, space, type, useColors } from "@/lib/theme";

export default function DiscountsScreen() {
  const c = useColors();
  const [list, setList] = useState<Discount[]>([]);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [code, setCode] = useState("");
  const [kind, setKind] = useState<"percent" | "amount">("percent");
  const [value, setValue] = useState("");
  const [minimum, setMinimum] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; tone: "ok" | "error" } | null>(null);

  const fail = (e: unknown, fallback: string) => setMsg({ text: e instanceof ApiError ? e.message : fallback, tone: "error" });
  const load = useCallback(() => {
    Promise.all([api.discounts(), api.me()]).then(([d, s]) => { setList(d); setSeller(s); }).catch((e) => fail(e, "Couldn't load discount codes."));
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function create() {
    setSaving(true); setMsg(null);
    try {
      const n = Number(value.replace(/[^0-9.]/g, ""));
      const d = await api.createDiscount({
        code, kind, ...(kind === "percent" ? { percent: n } : { amount: n }),
        min_subtotal: minimum ? Number(minimum) : undefined, max_uses: maxUses ? Number(maxUses) : undefined,
      });
      setList((l) => [d, ...l]); setCode(""); setValue(""); setMinimum(""); setMaxUses("");
      setMsg({ text: `${d.code} is live. Buyers enter it in their cart.`, tone: "ok" });
    } catch (e) { fail(e, "Couldn't create the code."); }
    finally { setSaving(false); }
  }

  async function toggle(d: Discount) {
    try { const next = await api.setDiscountActive(d.id, !d.active); setList((l) => l.map((x) => (x.id === d.id ? next : x))); }
    catch (e) { fail(e, "Couldn't update the code."); }
  }

  async function remove(d: Discount) {
    try { await api.deleteDiscount(d.id); setList((l) => l.filter((x) => x.id !== d.id)); setConfirm(null); }
    catch (e) { fail(e, "Couldn't delete the code."); }
  }

  return (
    <Screen>
      <H2>New code</H2>
      <Field label="Code" hint="Letters and numbers, like SPRING20." value={code} onChangeText={(t) => setCode(t.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))}
        autoCapitalize="characters" autoCorrect={false} maxLength={32} placeholder="SPRING20" />
      <Segmented value={kind} onChange={setKind} options={[{ value: "percent", label: "% off" }, { value: "amount", label: "$ off" }]} />
      <Field label={kind === "percent" ? "Percent off" : "Dollars off the order"} value={value} onChangeText={setValue} keyboardType="decimal-pad" placeholder={kind === "percent" ? "20" : "5.00"} />
      <View style={{ flexDirection: "row", gap: space.md }}>
        <View style={{ flex: 1 }}><Field label="Minimum order" value={minimum} onChangeText={setMinimum} keyboardType="decimal-pad" placeholder="None" /></View>
        <View style={{ flex: 1 }}><Field label="Use limit" value={maxUses} onChangeText={setMaxUses} keyboardType="number-pad" placeholder="No limit" /></View>
      </View>
      <Button label="Create code" loading={saving} disabled={code.length < 3 || !value} onPress={create} />
      <Notice text={msg?.text ?? null} tone={msg?.tone} />

      <H2>Your codes</H2>
      {!list.length ? <Body muted>No codes yet. A launch code like WELCOME10 is a simple way to reward early buyers.</Body> : null}
      {list.map((d) => (
        <View key={d.id} style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, padding: space.md, gap: space.sm, opacity: d.active ? 1 : 0.7 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text selectable style={{ fontFamily: fonts.display, fontSize: 20, color: c.ink, letterSpacing: 0.5 }}>{d.code}</Text>
              <Text style={[type.small, { color: c.muted }]}>
                {d.label}{d.min_subtotal ? ` on ${money(d.min_subtotal)}+` : ""} · used {d.uses}{d.max_uses ? ` of ${d.max_uses}` : ""} time{d.uses === 1 && !d.max_uses ? "" : "s"}
              </Text>
            </View>
            <Switch value={d.active} onValueChange={() => toggle(d)} accessibilityLabel={`${d.code} ${d.active ? "on" : "off"}`} trackColor={{ true: c.accent, false: c.line }} />
          </View>
          <View style={{ flexDirection: "row", gap: space.lg }}>
            {seller ? (
              <Pressable accessibilityRole="button" onPress={() => Share.share({ message: `Use code ${d.code} for ${d.label} at ${seller.store_name}: ${seller.store_url}` })} hitSlop={8}
                style={{ flexDirection: "row", gap: 4, alignItems: "center" }}>
                <Ionicons name="share-outline" size={16} color={c.accent} /><Text style={[type.label, { color: c.accent }]}>Share</Text>
              </Pressable>
            ) : null}
            {confirm === d.id ? (
              <>
                <Pressable accessibilityRole="button" onPress={() => remove(d)} hitSlop={8}><Text style={[type.label, { color: c.bad }]}>Delete {d.code}</Text></Pressable>
                <Pressable accessibilityRole="button" onPress={() => setConfirm(null)} hitSlop={8}><Text style={[type.label, { color: c.muted }]}>Keep</Text></Pressable>
              </>
            ) : (
              <Pressable accessibilityRole="button" onPress={() => setConfirm(d.id)} hitSlop={8}><Text style={[type.label, { color: c.muted }]}>Delete</Text></Pressable>
            )}
          </View>
        </View>
      ))}
    </Screen>
  );
}

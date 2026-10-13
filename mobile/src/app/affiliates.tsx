// Affiliate program: people share the store with their own link and earn a cut of each sale it
// brings in. The seller sets the commission, approves people, sees clicks and sales per affiliate,
// and marks payouts once they've paid them.
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Button, Field, Notice, Pill } from "@/components/ui";
import { Card, CopyLink, Line, TextAction, Tile, Toggle, count, money, when } from "@/components/panel";
import { affiliates, ApiError, business, type Affiliate, type AffiliateOverview } from "@/lib/api";
import { radius, space, type, useColors } from "@/lib/theme";

const errText = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);
type Msg = { text: string; tone: "ok" | "error" } | null;

export default function AffiliatesScreen() {
  const c = useColors();
  const { width } = useWindowDimensions();
  const wide = width >= 820;
  const [data, setData] = useState<AffiliateOverview | null>(null);
  const [msg, setMsg] = useState<Msg>(null);
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const load = useCallback(() => { affiliates.overview().then(setData).catch((e) => setMsg({ text: errText(e, "Couldn't load affiliates."), tone: "error" })); }, []);
  useFocusEffect(load);

  if (!data) return <View style={{ flex: 1, backgroundColor: c.bg, padding: space.xl }}>{msg ? <Notice text={msg.text} tone="error" /> : <ActivityIndicator color={c.accent} />}</View>;
  const t = data.totals;
  const pending = data.affiliates.filter((a) => a.status === "pending");
  const others = data.affiliates.filter((a) => a.status !== "pending");

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollPage>
        {!data.pro ? (
          <Card title="Let fans sell for you" sub="Give creators and happy customers their own link. They earn a share of each sale; you only pay when they bring you an order.">
            <Button label="Get Pro to start" onPress={() => router.push({ pathname: "/plans", params: { highlight: "pro" } })} />
          </Card>
        ) : null}
        <SettingsCard data={data} onSaved={setData} />
        {data.settings.enabled ? (
          <>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md }}>
              <Tile label="Affiliate sales" value={money(t.revenue)} sub={`${count(t.orders)} order${t.orders === 1 ? "" : "s"} from ${count(t.clicks)} clicks`} wide={wide} />
              <Tile label="Commission earned" value={money(t.earned)} sub={`${count(t.affiliates)} active affiliate${t.affiliates === 1 ? "" : "s"}`} wide={wide} />
              <Tile label="You owe" value={money(t.owed)} sub={`${money(t.paid)} paid so far`} wide={wide} />
            </View>
            <Card title="Invite people" sub="Share this page. People sign up there and get their link by email.">
              <CopyLink url={data.join_url} />
            </Card>
          </>
        ) : null}
        <Notice text={msg?.text ?? null} tone={msg?.tone} />

        {data.pro ? (
          <View style={{ flexDirection: "row", gap: space.md, flexWrap: "wrap" }}>
            <Button label={adding ? "Close" : "Add an affiliate"} variant={adding ? "ghost" : "primary"} onPress={() => setAdding((x) => !x)} style={{ flexGrow: 1 }} />
            {data.affiliates.length ? <Button label="Export CSV" variant="secondary" style={{ flexGrow: 1 }}
              onPress={async () => { try { await Linking.openURL((await business.exportLink("affiliates")).url); } catch (e) { setMsg({ text: errText(e, "Couldn't make the file."), tone: "error" }); } }} /> : null}
          </View>
        ) : null}
        {adding ? <AddForm defaultRate={data.settings.rate} onAdded={(a) => { setAdding(false); setOpen(a.id); setMsg({ text: `${a.name} is in. We emailed them their link.`, tone: "ok" }); load(); }} /> : null}

        {pending.length ? (
          <Card title={`Waiting for you (${pending.length})`} sub="People who applied on your invite page.">
            {pending.map((a) => (
              <View key={a.id} style={{ gap: 6, paddingVertical: 6 }}>
                <Text style={[type.heading, { color: c.ink }]}>{a.name}</Text>
                <Text style={[type.small, { color: c.muted }]}>{a.email}{a.about ? `  ·  ${a.about}` : ""}</Text>
                <View style={{ flexDirection: "row", gap: space.xl }}>
                  <TextAction label="Approve" onPress={async () => { try { await affiliates.update(a.id, { status: "active" }); setMsg({ text: `Approved. ${a.name} got their link by email.`, tone: "ok" }); load(); } catch (e) { setMsg({ text: errText(e, "That didn't work."), tone: "error" }); } }} />
                  <TextAction label="Decline" tone="bad" onPress={async () => { try { await affiliates.remove(a.id); load(); } catch (e) { setMsg({ text: errText(e, "That didn't work."), tone: "error" }); } }} />
                </View>
              </View>
            ))}
          </Card>
        ) : null}

        {others.length ? (
          <View style={{ borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, backgroundColor: c.surface, overflow: "hidden" }}>
            {others.map((a, i) => (
              <AffiliateRow key={a.id} a={a} first={i === 0} open={open === a.id} onToggle={() => setOpen(open === a.id ? null : a.id)}
                onChanged={(text) => { if (text) setMsg({ text, tone: "ok" }); load(); }} onError={(text) => setMsg({ text, tone: "error" })} />
            ))}
          </View>
        ) : data.settings.enabled && !pending.length ? (
          <Card title="No affiliates yet"><Text style={[type.body, { color: c.muted }]}>Add a creator you know, or share your invite page in your bio and with your best customers.</Text></Card>
        ) : null}
      </ScrollPage>
    </View>
  );
}

function ScrollPage({ children }: { children: React.ReactNode }) {
  return <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.xl, paddingBottom: 64 }} keyboardShouldPersistTaps="handled">{children}</ScrollView>;
}

function SettingsCard({ data, onSaved }: { data: AffiliateOverview; onSaved: (d: AffiliateOverview) => void }) {
  const c = useColors();
  const s = data.settings;
  const [rate, setRate] = useState(String(s.rate));
  const [days, setDays] = useState(String(s.cookie_days));
  const [blurb, setBlurb] = useState(s.blurb);
  const [auto, setAuto] = useState(s.auto_approve);
  const [open, setOpen] = useState(!s.enabled);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function save(patch: Partial<AffiliateOverview["settings"]>) {
    setBusy(true); setError(null);
    try { onSaved(await affiliates.settings(patch)); } catch (e) { setError(errText(e, "Couldn't save.")); } finally { setBusy(false); }
  }
  return (
    <Card title="Affiliate program" sub={s.enabled ? `On: affiliates earn ${s.rate}% for ${s.cookie_days} days after a click.` : "Off. Turn it on to start inviting affiliates."}>
      <Toggle label="Program on" value={s.enabled} disabled={busy || !data.pro} onChange={(v) => save({ enabled: v, rate: Number(rate) || s.rate, cookie_days: Number(days) || s.cookie_days })} />
      {open ? (
        <View style={{ gap: space.md }}>
          <View style={{ flexDirection: "row", gap: space.md, flexWrap: "wrap" }}>
            <View style={{ flexGrow: 1, minWidth: 140 }}><Field label="Commission %" value={rate} onChangeText={(v) => setRate(v.replace(/\D/g, ""))} keyboardType="number-pad" hint="Of the order, before shipping and tax" /></View>
            <View style={{ flexGrow: 1, minWidth: 140 }}><Field label="Cookie window (days)" value={days} onChangeText={(v) => setDays(v.replace(/\D/g, ""))} keyboardType="number-pad" hint="How long a click counts" /></View>
          </View>
          <Toggle label="Approve sign-ups automatically" sub="Off: you approve each person who applies." value={auto} onChange={setAuto} />
          <Field label="Invite page message (optional)" value={blurb} onChangeText={setBlurb} multiline maxLength={600} placeholder="Love our candles? Share them and earn 15% of every sale." />
          <Notice text={error} tone="error" />
          <View style={{ flexDirection: "row", gap: space.md }}>
            <Button label="Save" loading={busy} disabled={!data.pro} onPress={() => save({ rate: Number(rate), cookie_days: Number(days), auto_approve: auto, blurb })} style={{ flexGrow: 1 }} />
            {s.enabled ? <Button label="Close" variant="ghost" onPress={() => setOpen(false)} /> : null}
          </View>
          <Text style={[type.small, { color: c.muted }]}>You pay affiliates yourself (PayPal, Venmo, bank transfer), then tap Mark paid. Refunded orders reduce commission automatically.</Text>
        </View>
      ) : <TextAction label="Change commission and settings" onPress={() => setOpen(true)} />}
    </Card>
  );
}

function AddForm({ defaultRate, onAdded }: { defaultRate: number; onAdded: (a: Affiliate) => void }) {
  const [name, setName] = useState("");
  const [mail, setMail] = useState("");
  const [code, setCode] = useState("");
  const [rate, setRate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function add() {
    setBusy(true); setError(null);
    try { onAdded(await affiliates.add({ name, email: mail, code: code || undefined, rate: rate ? Number(rate) : null })); }
    catch (e) { setError(errText(e, "Couldn't add them.")); } finally { setBusy(false); }
  }
  return (
    <Card title="Add an affiliate">
      <Field label="Name" value={name} onChangeText={setName} maxLength={80} />
      <Field label="Email" value={mail} onChangeText={setMail} autoCapitalize="none" keyboardType="email-address" />
      <View style={{ flexDirection: "row", gap: space.md, flexWrap: "wrap" }}>
        <View style={{ flexGrow: 1, minWidth: 150 }}><Field label="Code (optional)" value={code} onChangeText={(v) => setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, ""))} maxLength={16} placeholder="MAYA" autoCapitalize="characters" /></View>
        <View style={{ flexGrow: 1, minWidth: 150 }}><Field label="Commission % (optional)" value={rate} onChangeText={(v) => setRate(v.replace(/\D/g, ""))} keyboardType="number-pad" placeholder={String(defaultRate)} /></View>
      </View>
      <Notice text={error} tone="error" />
      <Button label="Add and email their link" loading={busy} disabled={!name.trim() || !mail.trim()} onPress={add} />
    </Card>
  );
}

function AffiliateRow({ a, first, open, onToggle, onChanged, onError }: { a: Affiliate; first: boolean; open: boolean; onToggle: () => void; onChanged: (msg?: string) => void; onError: (msg: string) => void }) {
  const c = useColors();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<unknown>, done?: string) => {
    setBusy(true);
    try { await fn(); onChanged(done); } catch (e) { onError(errText(e, "That didn't work.")); } finally { setBusy(false); }
  };
  return (
    <View style={{ borderTopWidth: first ? 0 : 1, borderColor: c.sunk }}>
      <Pressable onPress={onToggle} accessibilityRole="button" accessibilityState={{ expanded: open }} style={{ flexDirection: "row", alignItems: "center", gap: space.md, padding: space.lg }}>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Text style={[type.heading, { color: c.ink }]}>{a.name}</Text>
            <Pill text={a.code} />
            {a.status === "paused" ? <Pill text="Paused" /> : null}
          </View>
          <Text style={[type.small, { color: c.muted }]}>{count(a.clicks)} clicks  ·  {count(a.orders)} orders  ·  {a.rate}%</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={[type.heading, { color: c.ink, fontVariant: ["tabular-nums"] }]}>{money(a.revenue)}</Text>
          <Text style={[type.small, { color: a.owed > 0 ? c.ink : c.muted }]}>{a.owed > 0 ? `${money(a.owed)} owed` : "Paid up"}</Text>
        </View>
      </Pressable>
      {open ? (
        <View style={{ gap: space.md, paddingHorizontal: space.lg, paddingBottom: space.lg }}>
          <Text style={[type.label, { color: c.ink }]}>Their link</Text>
          <CopyLink url={a.link} />
          <Text style={[type.label, { color: c.ink }]}>Their stats page (private to them)</Text>
          <CopyLink url={a.portal_url} />
          <Line label="Earned" value={money(a.earned)} />
          <Line label="Paid" value={money(a.paid)} />
          <Line label="Owed" value={money(a.owed)} strong />
          <Text style={[type.small, { color: c.muted }]}>{a.email}  ·  Joined {when(a.created_at)}</Text>
          {a.owed > 0 ? (
            <View style={{ flexDirection: "row", gap: space.md, alignItems: "flex-end", flexWrap: "wrap" }}>
              <View style={{ width: 130 }}><Field label="Amount paid" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder={a.owed.toFixed(2)} /></View>
              <View style={{ flexGrow: 1, minWidth: 160 }}><Field label="Note" value={note} onChangeText={setNote} maxLength={120} placeholder="PayPal, Oct 12" /></View>
              <Button label="Mark paid" variant="secondary" loading={busy} onPress={() => run(() => affiliates.payout(a.id, Number(amount || a.owed), note), `Recorded a ${money(Number(amount || a.owed))} payment to ${a.name}.`)} />
            </View>
          ) : null}
          <View style={{ flexDirection: "row", gap: space.xl }}>
            <TextAction label={a.status === "paused" ? "Resume" : "Pause"} onPress={() => run(() => affiliates.update(a.id, { status: a.status === "paused" ? "active" : "paused" }))} />
            <TextAction label="Remove" tone="bad" onPress={() => Alert.alert(`Remove ${a.name}?`, "Their link stops working. Past orders stay in your sales.", [
              { text: "Cancel", style: "cancel" }, { text: "Remove", style: "destructive", onPress: () => run(() => affiliates.remove(a.id), `${a.name} removed.`) }])} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

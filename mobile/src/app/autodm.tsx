// Instagram AutoDM: when someone comments or messages a keyword ("LINK", "PRICE"), the seller's
// Instagram replies by DM with a link, and can answer the comment publicly too.
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Button, Field, Notice, Pill, PageScroll } from "@/components/ui";
import { Card, ChipRow, TextAction, Toggle, count, when } from "@/components/panel";
import { api, ApiError, autodm, type AutoDmRule, type AutoDmRuleInput, type AutoDmStatus, type Product } from "@/lib/api";
import { radius, space, type, useColors } from "@/lib/theme";

const errText = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);
const BLOCKERS: Record<NonNullable<AutoDmStatus["blocker"]>, { title: string; text: string; action?: { label: string; go: () => void } }> = {
  pending_meta: { title: "Almost ready", text: "AutoDM is waiting on Instagram's approval for Snapfront. Set up your replies now and they'll start working as soon as it's switched on." },
  connect_instagram: { title: "Connect Instagram", text: "AutoDM replies from your Instagram professional account. Connect it in Marketing posts first.", action: { label: "Connect Instagram", go: () => router.push("/marketing") } },
  reconnect_instagram: { title: "Reconnect Instagram", text: "Your Instagram connection needs to be renewed before AutoDM can reply.", action: { label: "Reconnect", go: () => router.push("/marketing") } },
  upgrade: { title: "AutoDM comes with Pro", text: "Turn comments into sales: reply with your link the moment someone asks.", action: { label: "See membership", go: () => router.push({ pathname: "/plans", params: { highlight: "pro" } }) } },
};

export default function AutoDmScreen() {
  const c = useColors();
  const [data, setData] = useState<AutoDmStatus | null>(null);
  const [editing, setEditing] = useState<AutoDmRule | "new" | null>(null);
  const [msg, setMsg] = useState<{ text: string; tone: "ok" | "error" } | null>(null);
  const load = useCallback(() => { autodm.get().then(setData).catch((e) => setMsg({ text: errText(e, "Couldn't load AutoDM."), tone: "error" })); }, []);
  useFocusEffect(load);
  if (!data) return <View style={{ flex: 1, backgroundColor: c.bg, padding: space.xl }}>{msg ? <Notice text={msg.text} tone="error" /> : <ActivityIndicator color={c.accent} />}</View>;
  const b = data.blocker ? BLOCKERS[data.blocker] : null;

  return (
    <PageScroll style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ padding: space.xl, gap: space.xl, paddingBottom: 64 }} keyboardShouldPersistTaps="handled">
      <Text style={[type.body, { color: c.muted }]}>Post “Comment LINK and I’ll DM it to you.” When someone does, your Instagram sends them the link straight away, even while you sleep.</Text>
      {b ? (
        <Card title={b.title}>
          <Text style={[type.body, { color: c.muted }]}>{b.text}</Text>
          {b.action ? <Button label={b.action.label} variant="secondary" onPress={b.action.go} /> : null}
        </Card>
      ) : (
        <Card title="AutoDM is on" sub={`${data.accounts.filter((a) => a.status === "connected").map((a) => a.name).join(", ")}. ${count(data.stats.sent_7d)} replies sent this week.`}>
          <TextAction label="Refresh the Instagram connection" onPress={async () => {
            try { const r = await autodm.connect(); setMsg({ text: r.pages.every((p) => p.ok) ? "Connected. New comments and messages reach Snapfront." : "Instagram didn't confirm. Reconnect it in Marketing posts.", tone: r.pages.every((p) => p.ok) ? "ok" : "error" }); }
            catch (e) { setMsg({ text: errText(e, "Couldn't refresh."), tone: "error" }); }
          }} />
        </Card>
      )}
      <Notice text={msg?.text ?? null} tone={msg?.tone} />

      {editing ? (
        <RuleForm rule={editing === "new" ? null : editing} onDone={(text) => { setEditing(null); if (text) setMsg({ text, tone: "ok" }); load(); }} />
      ) : (
        <Button label="New keyword reply" disabled={data.blocker === "upgrade"} onPress={() => setEditing("new")} />
      )}

      {data.rules.length ? data.rules.map((r) => (
        <Card key={r.id}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            {r.keywords.map((k) => <Pill key={k} text={k.toUpperCase()} />)}
            <Text style={[type.small, { color: c.muted }]}>{{ both: "in comments and DMs", comment: "in comments", dm: "in DMs" }[r.trigger]}</Text>
          </View>
          <Text style={[type.body, { color: c.ink }]} numberOfLines={3}>{r.reply}</Text>
          <Toggle label={r.enabled ? "On" : "Off"} sub={`Sent ${count(r.sent)} time${r.sent === 1 ? "" : "s"}`} value={r.enabled}
            onChange={async (v) => { try { await autodm.update(r.id, { enabled: v }); load(); } catch (e) { setMsg({ text: errText(e, "Couldn't change it."), tone: "error" }); } }} />
          <View style={{ flexDirection: "row", gap: space.xl }}>
            <TextAction label="Edit" onPress={() => setEditing(r)} />
            <TextAction label="Delete" tone="bad" onPress={() => Alert.alert("Delete this reply?", undefined, [{ text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: async () => { await autodm.remove(r.id).catch(() => {}); load(); } }])} />
          </View>
        </Card>
      )) : !editing ? (
        <Card title="No keyword replies yet"><Text style={[type.body, { color: c.muted }]}>Start with one: keyword LINK, reply “Here’s the link! 🛍️” and pick your best-selling product.</Text></Card>
      ) : null}

      {data.activity.length ? (
        <Card title="Recent replies">
          {data.activity.map((a, i) => (
            <View key={i} style={{ gap: 2, paddingVertical: 4, borderTopWidth: i ? 1 : 0, borderColor: c.sunk }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: space.md }}>
                <Text style={[type.heading, { color: c.ink, flexShrink: 1 }]} numberOfLines={1}>{a.who || (a.kind === "dm" ? "A DM" : "A comment")}: “{a.text}”</Text>
                <Pill text={{ sent: "Sent", skipped: "Skipped", failed: "Failed" }[a.status]} tone={a.status === "sent" ? "good" : "neutral"} />
              </View>
              <Text style={[type.small, { color: c.muted }]}>{when(a.at)}{a.error ? `  ·  ${a.error}` : ""}</Text>
            </View>
          ))}
        </Card>
      ) : null}
      <Text style={[type.small, { color: c.muted }]}>Each person gets a reply once a day per keyword. Instagram allows replies to comments within 7 days.</Text>
    </PageScroll>
  );
}

function RuleForm({ rule, onDone }: { rule: AutoDmRule | null; onDone: (msg?: string) => void }) {
  const c = useColors();
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => { api.products().then((p) => setProducts(p.filter((x) => x.status === "live"))).catch(() => {}); }, []);
  const [keywords, setKeywords] = useState(rule?.keywords.join(", ").toUpperCase() ?? "LINK");
  const [trigger, setTrigger] = useState<AutoDmRule["trigger"]>(rule?.trigger ?? "both");
  const [reply, setReply] = useState(rule?.reply ?? "Here you go! 🛍️");
  const [product, setProduct] = useState(rule?.product_id ?? "");
  const [link, setLink] = useState(rule?.link_url ?? "");
  const [publicReply, setPublicReply] = useState(rule?.comment_reply ?? "Sent you a DM! 💌");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function save() {
    setBusy(true); setError(null);
    const body: AutoDmRuleInput = { keywords, trigger, reply, product_id: product || null, link_url: product ? "" : link, comment_reply: publicReply };
    try { if (rule) await autodm.update(rule.id, body); else await autodm.create(body); onDone(rule ? "Saved." : "Added. It replies as soon as someone uses the keyword."); }
    catch (e) { setError(errText(e, "Couldn't save.")); } finally { setBusy(false); }
  }
  return (
    <Card title={rule ? "Edit keyword reply" : "New keyword reply"}>
      <Field label="Keywords" hint="Separate with commas. Matches the whole word, in any letter case." value={keywords} onChangeText={setKeywords} autoCapitalize="characters" placeholder="LINK, PRICE, SHOP" />
      <ChipRow label="Watch for it in" value={trigger} onChange={setTrigger} options={[{ value: "both", label: "Comments and DMs" }, { value: "comment", label: "Comments" }, { value: "dm", label: "DMs" }]} />
      <Field label="Your DM reply" value={reply} onChangeText={setReply} multiline maxLength={900} />
      <ChipRow label="Link to" value={product} onChange={setProduct} options={[{ value: "", label: "A web address" }, ...products.map((p) => ({ value: p.id, label: p.title }))]} />
      {!product ? <Field label="Web address (optional)" value={link} onChangeText={setLink} autoCapitalize="none" keyboardType="url" placeholder="Your store, a product or a landing page" /> : null}
      {trigger !== "dm" ? <Field label="Public reply to the comment (optional)" value={publicReply} onChangeText={setPublicReply} maxLength={300} hint="Shows under their comment so others know to ask too." /> : null}
      <View style={{ borderRadius: radius.md, backgroundColor: c.sunk, padding: space.lg, gap: 4 }}>
        <Text style={[type.label, { color: c.muted }]}>They&apos;ll get</Text>
        <Text style={[type.body, { color: c.ink }]}>{reply}{product || link ? `\n\n${product ? products.find((p) => p.id === product)?.page_url ?? "Your product link" : link}` : ""}</Text>
      </View>
      <Notice text={error} tone="error" />
      <View style={{ flexDirection: "row", gap: space.md }}>
        <Button label={rule ? "Save" : "Add reply"} loading={busy} onPress={save} style={{ flexGrow: 1 }} />
        <Button label="Cancel" variant="ghost" onPress={() => onDone()} />
      </View>
    </Card>
  );
}

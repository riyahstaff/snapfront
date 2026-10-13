// Email marketing: the subscriber list (from the store's sign-up box, checkout and imports),
// one-off emails to everyone or a group, automatic emails (welcome, after a purchase, win-back),
// and the sign-up box and sender settings.
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Button, Field, Notice, Pill, Segmented } from "@/components/ui";
import { Card, Chip, ChipRow, Search, TextAction, Tile, Toggle, count, when } from "@/components/panel";
import { api, ApiError, business, email, type Audience, type Campaign, type CampaignInput, type Discount, type EmailFlow, type EmailOverview, type Product, type Subscriber } from "@/lib/api";
import { radius, space, type, useColors } from "@/lib/theme";

type Tab = "list" | "send" | "auto" | "settings";
const errText = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);
type Msg = { text: string; tone: "ok" | "error" } | null;

export default function EmailScreen() {
  const c = useColors();
  const { width } = useWindowDimensions();
  const wide = width >= 820;
  const [tab, setTab] = useState<Tab>("list");
  const [data, setData] = useState<EmailOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => { email.overview().then(setData).catch((e) => setError(errText(e, "Couldn't load your email list."))); }, []);
  useFocusEffect(load);

  if (!data) return <View style={{ flex: 1, backgroundColor: c.bg, padding: space.xl }}>{error ? <Notice text={error} tone="error" /> : <ActivityIndicator color={c.accent} />}</View>;
  const left = Math.max(0, data.monthly_limit - data.used_this_month);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ padding: space.xl, gap: space.xl, paddingBottom: 64 }} keyboardShouldPersistTaps="handled">
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md }}>
        <Tile label="Subscribers" value={count(data.counts.subscribed)} sub={data.counts.unsubscribed ? `${count(data.counts.unsubscribed)} unsubscribed` : "on your list"} wide={wide} />
        <Tile label="New this month" value={count(data.counts.new_30d)} sub="joined in the last 30 days" wide={wide} />
        <Tile label="Emails left" value={data.can_broadcast ? count(left) : "—"} sub={data.can_broadcast ? `of ${count(data.monthly_limit)} this month` : "with Launch or Pro"} wide={wide} />
      </View>
      <Segmented value={tab} onChange={setTab} options={[{ value: "list", label: "Subscribers" }, { value: "send", label: "Emails" }, { value: "auto", label: "Automatic" }, { value: "settings", label: "Settings" }]} />
      {!data.mail_address && tab !== "settings" && tab !== "list" ? (
        <Pressable onPress={() => setTab("settings")} accessibilityRole="button">
          <Notice text="Add your mailing address in Settings before you send. The law requires it in every marketing email (a PO box works)." />
        </Pressable>
      ) : null}
      {tab === "list" ? <Subscribers onSettings={() => setTab("settings")} onChanged={load} signupOn={data.signup.enabled} /> : null}
      {tab === "send" ? <Broadcasts overview={data} onChanged={load} /> : null}
      {tab === "auto" ? <Automations overview={data} /> : null}
      {tab === "settings" ? <Settings data={data} onSaved={setData} /> : null}
    </ScrollView>
  );
}

/* ---------------- Subscribers ---------------- */
function Subscribers({ onSettings, onChanged, signupOn }: { onSettings: () => void; onChanged: () => void; signupOn: boolean }) {
  const c = useColors();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"subscribed" | "unsubscribed" | "">("subscribed");
  const [rows, setRows] = useState<Subscriber[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  const fetchPage = useCallback((p: number, replace: boolean) => {
    email.subscribers({ q: q.trim() || undefined, status: status || undefined, page: p })
      .then((r) => { setTotal(r.total); setPage(p); setRows((old) => (replace || !old ? r.subscribers : [...old, ...r.subscribers])); })
      .catch((e) => setMsg({ text: errText(e, "Couldn't load subscribers."), tone: "error" }));
  }, [q, status]);
  useEffect(() => { const t = setTimeout(() => fetchPage(0, true), 250); return () => clearTimeout(t); }, [fetchPage]);

  async function exportCsv() {
    try { const { url } = await business.exportLink("subscribers"); await Linking.openURL(url); }
    catch (e) { setMsg({ text: errText(e, "Couldn't make the file."), tone: "error" }); }
  }
  function act(s: Subscriber, what: "unsubscribe" | "remove") {
    const go = async () => {
      try {
        if (what === "unsubscribe") await email.unsubscribe(s.id); else await email.removeSubscriber(s.id);
        fetchPage(0, true); onChanged();
      } catch (e) { setMsg({ text: errText(e, "That didn't work."), tone: "error" }); }
    };
    Alert.alert(what === "unsubscribe" ? "Unsubscribe this person?" : "Remove from your list?",
      what === "unsubscribe" ? `${s.email} won't get your emails anymore. Only they can sign up again.` : `${s.email} will be deleted from your list.`,
      [{ text: "Cancel", style: "cancel" }, { text: what === "unsubscribe" ? "Unsubscribe" : "Remove", style: "destructive", onPress: go }]);
  }

  return (
    <View style={{ gap: space.lg }}>
      {!signupOn ? (
        <Pressable onPress={onSettings} accessibilityRole="button"><Notice text="Your store's sign-up box is off. Turn it on in Settings to grow your list." /></Pressable>
      ) : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md, alignItems: "center" }}>
        <Search value={q} onChange={setQ} placeholder="Search email or name" />
        <Button label="Add people" variant="secondary" onPress={() => setAdding((x) => !x)} style={{ minHeight: 46 }} />
        <Button label="Export CSV" variant="secondary" onPress={exportCsv} style={{ minHeight: 46 }} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        <Chip label="Subscribed" on={status === "subscribed"} onPress={() => setStatus("subscribed")} />
        <Chip label="Unsubscribed" on={status === "unsubscribed"} onPress={() => setStatus("unsubscribed")} />
        <Chip label="Everyone" on={status === ""} onPress={() => setStatus("")} />
      </ScrollView>
      <Notice text={msg?.text ?? null} tone={msg?.tone} />
      {adding ? <AddPeople onDone={(text) => { setAdding(false); setMsg({ text, tone: "ok" }); fetchPage(0, true); onChanged(); }} /> : null}

      {!rows ? <ActivityIndicator color={c.accent} /> : rows.length ? (
        <View style={{ borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, backgroundColor: c.surface, overflow: "hidden" }}>
          {rows.map((s, i) => (
            <View key={s.id} style={{ borderTopWidth: i ? 1 : 0, borderColor: c.sunk }}>
              <Pressable onPress={() => setOpen(open === s.id ? null : s.id)} accessibilityRole="button" accessibilityState={{ expanded: open === s.id }}
                style={{ flexDirection: "row", alignItems: "center", gap: space.md, padding: space.lg }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[type.heading, { color: c.ink }]} numberOfLines={1}>{s.email}</Text>
                  <Text style={[type.small, { color: c.muted }]} numberOfLines={1}>
                    {[s.name, { form: "Sign-up box", checkout: "At checkout", import: "Added by you" }[s.source] ?? s.source, `Joined ${when(s.created_at)}`].filter(Boolean).join("  ·  ")}
                  </Text>
                </View>
                {s.status === "unsubscribed" ? <Pill text="Unsubscribed" /> : s.orders ? <Pill text={`${s.orders} order${s.orders === 1 ? "" : "s"}`} tone="good" /> : null}
              </Pressable>
              {open === s.id ? (
                <View style={{ flexDirection: "row", gap: space.xl, paddingHorizontal: space.lg, paddingBottom: space.lg }}>
                  {s.orders ? <Text style={[type.small, { color: c.muted }]}>Spent ${s.spent.toFixed(2)}{s.last_order ? `, last order ${when(s.last_order)}` : ""}</Text> : null}
                  {s.status === "subscribed" ? <TextAction label="Unsubscribe" onPress={() => act(s, "unsubscribe")} /> : null}
                  <TextAction label="Remove" tone="bad" onPress={() => act(s, "remove")} />
                </View>
              ) : null}
            </View>
          ))}
        </View>
      ) : (
        <Card title={q || status !== "subscribed" ? "No one matches" : "No subscribers yet"}>
          <Text style={[type.body, { color: c.muted }]}>
            {q || status !== "subscribed" ? "Try a different search." : "People join from the sign-up box on your store and from the checkbox at checkout. Share your store link to start your list."}
          </Text>
        </Card>
      )}
      {rows && rows.length < total ? <Button label={`Show more (${count(total - rows.length)} left)`} variant="ghost" onPress={() => fetchPage(page + 1, false)} /> : null}
    </View>
  );
}

function AddPeople({ onDone }: { onDone: (text: string) => void }) {
  const [text, setText] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function add() {
    setBusy(true); setError(null);
    try {
      const r = await email.addSubscribers(text, consent);
      onDone(`Added ${r.added}.${r.skipped ? ` ${r.skipped} already on your list.` : ""}${r.invalid ? ` ${r.invalid} weren't valid addresses.` : ""}`);
    } catch (e) { setError(errText(e, "Couldn't add them.")); } finally { setBusy(false); }
  }
  return (
    <Card title="Add people" sub="Paste email addresses, one per line or separated by commas.">
      <Field label="Email addresses" value={text} onChangeText={setText} multiline autoCapitalize="none" keyboardType="email-address" placeholder={"ava@example.com\nben@example.com"} />
      <Toggle label="They asked to hear from me" sub="Only add people who agreed to get your emails, like past customers who opted in." value={consent} onChange={setConsent} />
      <Notice text={error} tone="error" />
      <Button label="Add to list" onPress={add} loading={busy} disabled={!text.trim() || !consent} />
    </Card>
  );
}

/* ---------------- One-off emails ---------------- */
function Broadcasts({ overview, onChanged }: { overview: EmailOverview; onChanged: () => void }) {
  const c = useColors();
  const [list, setList] = useState<Campaign[] | null>(null);
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [editing, setEditing] = useState<Campaign | "new" | null>(null);
  const [msg, setMsg] = useState<Msg>(null);
  const load = useCallback(() => {
    email.campaigns().then((r) => { setList(r.campaigns); setAudiences(r.audiences); }).catch((e) => setMsg({ text: errText(e, "Couldn't load your emails."), tone: "error" }));
  }, []);
  useEffect(load, [load]);
  // Sending happens in the background: refresh while anything is going out.
  useEffect(() => {
    if (!list?.some((x) => x.status === "sending")) return;
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [list, load]);

  if (!overview.can_broadcast) {
    return (
      <Card title="Email your list" sub="Send news, new products and offers to your subscribers.">
        <Text style={[type.body, { color: c.muted }]}>Launch includes 500 emails a month and Pro includes 5,000, with open and click stats for every email.</Text>
        <Button label="See plans" onPress={() => router.push({ pathname: "/plans", params: { highlight: "launch" } })} />
      </Card>
    );
  }
  if (editing) {
    return <Composer initial={editing === "new" ? null : editing} audiences={audiences} subscribers={overview.counts.subscribed}
      onClose={(text) => { setEditing(null); load(); onChanged(); if (text) setMsg({ text, tone: "ok" }); }} />;
  }
  const act = async (fn: () => Promise<unknown>, done: string) => {
    try { await fn(); setMsg({ text: done, tone: "ok" }); load(); } catch (e) { setMsg({ text: errText(e, "That didn't work."), tone: "error" }); }
  };
  return (
    <View style={{ gap: space.lg }}>
      <Button label="Write an email" onPress={() => setEditing("new")} />
      <Notice text={msg?.text ?? null} tone={msg?.tone} />
      {!list ? <ActivityIndicator color={c.accent} /> : list.length ? list.map((x) => {
        const s = x.stats;
        const statusText = { draft: "Draft", scheduled: `Scheduled for ${when(x.send_at)}`, sending: "Sending", sent: `Sent ${when(x.sent_at)}` }[x.status];
        return (
          <Card key={x.id}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: space.md, alignItems: "flex-start" }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[type.heading, { color: c.ink }]} numberOfLines={2}>{x.subject || "Untitled email"}</Text>
                <Text style={[type.small, { color: c.muted }]}>{x.status === "draft" ? `Last edited ${when(x.updated_at)}` : `${count(x.recipients)} recipient${x.recipients === 1 ? "" : "s"}`}</Text>
              </View>
              <Pill text={statusText} tone={x.status === "sent" ? "good" : "neutral"} />
            </View>
            {s && (x.status === "sent" || x.status === "sending") ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.xl }}>
                <Stat label="Delivered" value={count(s.sent)} />
                <Stat label="Opened" value={`${s.open_rate}%`} />
                <Stat label="Clicked" value={`${s.click_rate}%`} />
                <Stat label="Unsubscribed" value={count(s.unsubscribed)} />
                {s.failed ? <Stat label="Bounced" value={count(s.failed)} /> : null}
              </View>
            ) : null}
            <View style={{ flexDirection: "row", gap: space.xl, flexWrap: "wrap" }}>
              {x.status === "draft" ? <TextAction label="Edit" onPress={() => setEditing(x)} /> : null}
              <TextAction label="Duplicate" onPress={() => act(async () => setEditing(await email.duplicateCampaign(x.id)), "Copied into a new draft.")} />
              {x.status === "scheduled" ? <TextAction label="Cancel send" onPress={() => act(() => email.cancelCampaign(x.id), "Canceled. It's back in your drafts.")} /> : null}
              {x.status === "draft" ? <TextAction label="Delete" tone="bad" onPress={() => Alert.alert("Delete this draft?", undefined, [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => act(() => email.deleteCampaign(x.id), "Draft deleted.") }])} /> : null}
            </View>
          </Card>
        );
      }) : (
        <Card title="No emails yet">
          <Text style={[type.body, { color: c.muted }]}>Announce a new product, share a discount code, or say thanks. Opens and clicks show here after you send.</Text>
        </Card>
      )}
    </View>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  const c = useColors();
  return <View style={{ gap: 2 }}><Text style={[type.small, { color: c.muted }]}>{label}</Text><Text style={[type.heading, { color: c.ink, fontVariant: ["tabular-nums"] }]}>{value}</Text></View>;
}

function useStoreBits() {
  const [products, setProducts] = useState<Product[]>([]);
  const [codes, setCodes] = useState<Discount[]>([]);
  useEffect(() => {
    api.products().then((p) => setProducts(p.filter((x) => x.status === "live"))).catch(() => {});
    api.discounts().then((d) => setCodes(d.filter((x) => x.active))).catch(() => {});
  }, []);
  return { products, codes };
}
const nineAm = (days: number) => { const d = new Date(); d.setDate(d.getDate() + days); d.setHours(9, 0, 0, 0); return d; };

function Composer({ initial, audiences, subscribers, onClose }: { initial: Campaign | null; audiences: Audience[]; subscribers: number; onClose: (msg?: string) => void }) {
  const c = useColors();
  const { products, codes } = useStoreBits();
  const [id, setId] = useState<string | null>(initial?.id ?? null);
  const [f, setF] = useState<CampaignInput>({
    subject: initial?.subject ?? "", preheader: initial?.preheader ?? "", body: initial?.body ?? "", cta_label: initial?.cta_label ?? "Shop now", cta_url: initial?.cta_url ?? "",
    product_id: initial?.product_id ?? null, discount_code: initial?.discount_code ?? "", audience: initial?.audience ?? "all",
  });
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<Msg>(null);
  const [testTo, setTestTo] = useState("");
  const set = (patch: CampaignInput) => setF((x) => ({ ...x, ...patch }));
  const chosen = audiences.find((a) => a.id === f.audience);

  async function save(): Promise<string> {
    if (id) { await email.updateCampaign(id, f); return id; }
    const made = await email.createCampaign(f); setId(made.id); return made.id;
  }
  async function run(what: string, fn: () => Promise<void>) {
    setBusy(what); setMsg(null);
    try { await fn(); } catch (e) { setMsg({ text: errText(e, "That didn't work. Try again."), tone: "error" }); } finally { setBusy(null); }
  }
  function send(at?: Date) {
    const n = chosen?.count ?? subscribers;
    Alert.alert(at ? "Schedule this email?" : "Send this email now?", `It goes to ${count(n)} ${n === 1 ? "person" : "people"}${at ? ` on ${at.toLocaleString(undefined, { weekday: "long", hour: "numeric", minute: "2-digit" })}` : ""}. You can't edit it after it's sent.`, [
      { text: "Cancel", style: "cancel" },
      { text: at ? "Schedule" : "Send", onPress: () => run("send", async () => { const cid = await save(); await email.sendCampaign(cid, at?.toISOString()); onClose(at ? "Scheduled." : "Sending now. Stats appear as people open it."); }) },
    ]);
  }

  return (
    <View style={{ gap: space.lg }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text accessibilityRole="header" style={[type.title, { color: c.ink }]}>{initial ? "Edit email" : "New email"}</Text>
        <TextAction label="Back to emails" onPress={() => onClose()} />
      </View>
      <Card>
        <Field label="Subject" value={f.subject} onChangeText={(v) => set({ subject: v })} maxLength={150} placeholder="New mugs just landed" hint="Write {name} to use each person's first name." />
        <Field label="Preview text (optional)" value={f.preheader} onChangeText={(v) => set({ preheader: v })} maxLength={150} placeholder="Shows next to the subject in most inboxes" />
        <Field label="Message" value={f.body} onChangeText={(v) => set({ body: v })} multiline maxLength={10000} placeholder={"Hi {name},\n\nOur new collection is here..."} style={{ minHeight: 180 }} />
      </Card>
      <Card title="Extras">
        <ChipRow label="Feature a product" value={f.product_id ?? ""} onChange={(v) => set({ product_id: v || null })}
          options={[{ value: "", label: "None" }, ...products.map((p) => ({ value: p.id, label: p.title }))]} />
        <ChipRow label="Include a discount code" value={f.discount_code ?? ""} onChange={(v) => set({ discount_code: v })}
          options={[{ value: "", label: "None" }, ...codes.map((d) => ({ value: d.code, label: `${d.code} (${d.label})` }))]} />
        {!codes.length ? <TextAction label="Make a discount code" onPress={() => router.push("/discounts")} /> : null}
        <Field label="Button text" value={f.cta_label} onChangeText={(v) => set({ cta_label: v })} maxLength={40} placeholder="Shop now" />
        <Field label="Button link (optional)" value={f.cta_url} onChangeText={(v) => set({ cta_url: v })} autoCapitalize="none" keyboardType="url" placeholder="Leave empty to link to the product or your store" />
      </Card>
      <Card title="Who gets it">
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {audiences.map((a) => <Chip key={a.id} label={`${a.label} (${count(a.count)})`} on={f.audience === a.id} onPress={() => set({ audience: a.id })} />)}
        </View>
      </Card>
      <Notice text={msg?.text ?? null} tone={msg?.tone} />
      <Card title="Check it, then send">
        <View style={{ flexDirection: "row", gap: space.md, flexWrap: "wrap", alignItems: "flex-end" }}>
          <View style={{ flexGrow: 1, minWidth: 220 }}><Field label="Send a test to" value={testTo} onChangeText={setTestTo} autoCapitalize="none" keyboardType="email-address" placeholder="Your account email" /></View>
          <Button label="Send test" variant="secondary" loading={busy === "test"} disabled={Boolean(busy)}
            onPress={() => run("test", async () => { const cid = await save(); const r = await email.testCampaign(cid, testTo.trim() || undefined); setMsg({ text: `Test sent to ${r.sent_to}.`, tone: "ok" }); })} />
        </View>
        <View style={{ flexDirection: "row", gap: space.md, flexWrap: "wrap" }}>
          <Button label="Send now" loading={busy === "send"} disabled={Boolean(busy) || !f.subject?.trim()} onPress={() => send()} style={{ flexGrow: 1 }} />
          <Button label="Tomorrow 9 AM" variant="secondary" disabled={Boolean(busy) || !f.subject?.trim()} onPress={() => send(nineAm(1))} style={{ flexGrow: 1 }} />
          <Button label="Save draft" variant="ghost" loading={busy === "save"} disabled={Boolean(busy)} onPress={() => run("save", async () => { await save(); onClose("Draft saved."); })} />
        </View>
      </Card>
    </View>
  );
}

/* ---------------- Automatic emails ---------------- */
function Automations({ overview }: { overview: EmailOverview }) {
  const c = useColors();
  const [flows, setFlows] = useState<EmailFlow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { email.flows().then((r) => setFlows(r.flows)).catch((e) => setError(errText(e, "Couldn't load automatic emails."))); }, []);
  if (!flows) return error ? <Notice text={error} tone="error" /> : <ActivityIndicator color={c.accent} />;
  return (
    <View style={{ gap: space.lg }}>
      {!overview.can_automate ? (
        <Card title="Emails that send themselves" sub="Pro sends these for you, so every new subscriber and buyer hears from you at the right time.">
          <Button label="See Pro" onPress={() => router.push({ pathname: "/plans", params: { highlight: "pro" } })} />
        </Card>
      ) : null}
      {flows.map((fl) => <FlowCard key={fl.kind} flow={fl} locked={!overview.can_automate} onSaved={(x) => setFlows((all) => all?.map((y) => (y.kind === x.kind ? x : y)) ?? null)} />)}
    </View>
  );
}
function FlowCard({ flow, locked, onSaved }: { flow: EmailFlow; locked: boolean; onSaved: (f: EmailFlow) => void }) {
  const c = useColors();
  const { codes } = useStoreBits();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(flow);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  async function save(patch: Partial<EmailFlow>) {
    setBusy(true); setMsg(null);
    try {
      const saved = await email.updateFlow(flow.kind, patch);
      onSaved(saved);
      setMsg({ text: patch.enabled === undefined ? "Saved." : patch.enabled ? "On. It sends by itself from now on." : "Turned off.", tone: "ok" });
    } catch (e) { setMsg({ text: errText(e, "Couldn't save."), tone: "error" }); } finally { setBusy(false); }
  }
  const delayLabel = flow.kind === "welcome" ? "Days to wait after they join (0 sends right away)" : flow.kind === "after_purchase" ? "Days after their order" : "Days without an order";
  return (
    <Card>
      <Toggle label={flow.name} sub={`${flow.when}${flow.kind !== "welcome" ? ` (${flow.delay_days} days)` : ""}. Sent ${count(flow.stats.sent)} so far.`} value={flow.enabled} disabled={locked || busy} onChange={(v) => save({ enabled: v })} />
      <Notice text={msg?.text ?? null} tone={msg?.tone} />
      {open ? (
        <View style={{ gap: space.md }}>
          <Field label="Subject" value={f.subject} onChangeText={(v) => setF({ ...f, subject: v })} maxLength={150} hint="{name} is their first name, {store} your store name." />
          <Field label="Message" value={f.body} onChangeText={(v) => setF({ ...f, body: v })} multiline maxLength={5000} />
          <Field label="Button text" value={f.cta_label} onChangeText={(v) => setF({ ...f, cta_label: v })} maxLength={40} />
          <Field label={delayLabel} value={String(f.delay_days)} onChangeText={(v) => setF({ ...f, delay_days: Number(v.replace(/\D/g, "")) || 0 })} keyboardType="number-pad" />
          <ChipRow label="Discount code" value={f.discount_code} onChange={(v) => setF({ ...f, discount_code: v })} options={[{ value: "", label: "None" }, ...codes.map((d) => ({ value: d.code, label: d.code }))]} />
          {flow.kind === "after_purchase" ? <Text style={[type.small, { color: c.muted }]}>This email features one of your other products automatically.</Text> : null}
          <View style={{ flexDirection: "row", gap: space.md }}>
            <Button label="Save" loading={busy} onPress={() => save({ subject: f.subject, body: f.body, cta_label: f.cta_label, delay_days: f.delay_days, discount_code: f.discount_code })} style={{ flexGrow: 1 }} />
            <Button label="Close" variant="ghost" onPress={() => setOpen(false)} />
          </View>
        </View>
      ) : <TextAction label="Edit the email" onPress={() => setOpen(true)} />}
    </Card>
  );
}

/* ---------------- Settings ---------------- */
function Settings({ data, onSaved }: { data: EmailOverview; onSaved: (d: EmailOverview) => void }) {
  const c = useColors();
  const { codes } = useStoreBits();
  const [on, setOn] = useState(data.signup.enabled);
  const [title, setTitle] = useState(data.signup.title);
  const [text, setText] = useState(data.signup.text);
  const [code, setCode] = useState(data.signup.offer_code);
  const [fromName, setFromName] = useState(data.from_name);
  const [address, setAddress] = useState(data.mail_address);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  async function save() {
    setBusy(true); setMsg(null);
    try {
      onSaved(await email.settings({ signup_enabled: on, signup_title: title, signup_text: text, signup_offer_code: code, from_name: fromName, mail_address: address }));
      setMsg({ text: "Saved.", tone: "ok" });
    } catch (e) { setMsg({ text: errText(e, "Couldn't save."), tone: "error" }); } finally { setBusy(false); }
  }
  return (
    <View style={{ gap: space.lg }}>
      <Card title="Sign-up box on your store" sub="Shown above the footer on your store, product pages and link-in-bio page. Buyers can also join with a tick at checkout.">
        <Toggle label="Show the sign-up box" value={on} onChange={setOn} />
        <Field label="Heading" value={title} onChangeText={setTitle} maxLength={60} placeholder={data.signup.defaults.title} />
        <Field label="Short line under it" value={text} onChangeText={setText} maxLength={160} placeholder={data.signup.defaults.text} />
        <ChipRow label="Welcome code" value={code} onChange={setCode} options={[{ value: "", label: "None" }, ...codes.map((d) => ({ value: d.code, label: `${d.code} (${d.label})` }))]} />
        <Text style={[type.small, { color: c.muted }]}>New subscribers see this code right away, and it&apos;s added to their cart.{codes.length ? "" : " Make a code in Discount codes first."}</Text>
      </Card>
      <Card title="Sender details">
        <Field label="From name" value={fromName} onChangeText={setFromName} maxLength={60} hint="What people see in their inbox. Replies go to your account email." />
        <Field label="Mailing address" value={address} onChangeText={setAddress} maxLength={200} placeholder="Street or PO box, city, state, ZIP" hint="Printed small at the bottom of every email. US law (CAN-SPAM) requires a real postal address; a PO box or mailbox service works." />
      </Card>
      <Notice text={msg?.text ?? null} tone={msg?.tone} />
      <Button label="Save settings" onPress={save} loading={busy} />
    </View>
  );
}

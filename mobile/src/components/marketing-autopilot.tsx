import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Body, Button, Field, Notice } from "@/components/ui";
import { Card, Tile } from "@/components/panel";
import { autopilotApi, marketingCenterApi, type AutopilotStatus, type AutopilotSettings, type OwnerCampaign } from "@/lib/api";
import { type, useColors } from "@/lib/theme";
const row = { flexDirection: "row", flexWrap: "wrap", gap: 10, alignItems: "center" } as const;
const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const showTime = (date: string, timezone: string) => { try { return new Date(date).toLocaleString(undefined, { timeZone: timezone, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); } catch { return date; } };
export function MarketingAutopilot({ store, campaigns, onChanged, onOpen }: { store: string; campaigns: OwnerCampaign[]; onChanged: () => Promise<void>; onOpen: (id: string) => void }) {
 const c = useColors();
 const [data, setData] = useState<AutopilotStatus | null>(null);
 const [settings, setSettings] = useState<AutopilotSettings | null>(null);
 const [times, setTimes] = useState("");
 const [limit, setLimit] = useState("4");
 const [confirm, setConfirm] = useState(false);
 const [busy, setBusy] = useState(false);
 const [notice, setNotice] = useState<{ text: string; tone: "ok" | "error" | "info" } | null>(null);
 const accept = useCallback((next: AutopilotStatus) => { setData(next); setSettings(next.settings); setTimes(next.settings.social_times.join(", ")); setLimit(String(next.settings.daily_ai_limit)); setConfirm(false); }, []);
 useEffect(() => {
  let alive = true;
  autopilotApi.status(store).then((next) => { if (alive) accept(next); }).catch((e) => { if (alive) setNotice({ text: e.message, tone: "error" }); });
  const timer = setInterval(() => autopilotApi.status(store).then((next) => { if (alive) setData(next); }).catch(() => {}), 30000);
  return () => { alive = false; clearInterval(timer); };
 }, [store, accept]);
 const act = async (fn: () => Promise<void>) => { setBusy(true); setNotice(null); try { await fn(); } catch (e) { setNotice({ text: e instanceof Error ? e.message : "Couldn't update Autopilot.", tone: "error" }); } finally { setBusy(false); } };
 const change = (patch: Partial<AutopilotSettings>) => { if (settings) setSettings({ ...settings, ...patch }); setConfirm(false); };
 const choice = (label: string, selected: boolean, fn: () => void, checkbox = false) => <Pressable key={label} disabled={busy} onPress={fn} accessibilityRole={checkbox ? "checkbox" : "button"} accessibilityState={checkbox ? { checked: selected } : { selected }} style={{ padding: 12, gap: 8, flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, borderColor: selected ? c.accent : c.line, backgroundColor: selected ? c.sunk : c.surface }}><Ionicons name={selected ? "checkmark-circle" : "ellipse-outline"} color={selected ? c.accent : c.muted} size={20} /><Text style={[type.label, { color: c.ink, flexShrink: 1 }]}>{label}</Text></Pressable>;
 const save = (enabled: boolean) => act(async () => {
  if (!settings) return;
  const next = await autopilotApi.save(store, { ...settings, campaign_id: settings.campaign_id || campaigns[0]?.id || "", social_times: times.split(",").map((v) => v.trim()).filter(Boolean), daily_ai_limit: Number(limit), enabled }, confirm);
  accept(next); await onChanged(); setNotice({ text: enabled ? "Autopilot is enabled. It will create and publish on your schedule without asking you to approve each item." : "Settings saved. Autopilot is paused.", tone: "ok" });
  if (next.in_flight) setNotice({ text: `Settings updated. ${next.in_flight} publication(s) already being processed could not be recalled. Check the activity below.`, tone: "info" });
 });
 if (!data || !settings) return <Card title="Marketing Autopilot"><Notice text={notice?.text || null} tone={notice?.tone} /><ActivityIndicator color={c.accent} /></Card>;
 const currentCampaign = settings.campaign_id || campaigns[0]?.id || "";
 return <View style={{ gap: 20 }}>
  <Notice text={notice?.text || null} tone={notice?.tone} />
  <Card title={data.running ? "Autopilot is enabled" : "Let Snapfront do the recurring work"} sub="Set it up once. Your server keeps working when your browser is closed.">
   <Body>Autopilot writes fresh content, makes narrated faceless videos, publishes to your selected Facebook and Instagram accounts, and posts articles to Snapfront’s blog.</Body>
   <View style={row}><Tile label="AI writing calls today" value={`${data.ai_used_today} / ${data.settings.daily_ai_limit}`} sub="Resets at midnight UTC" wide /><Tile label="Agent" value={data.running ? "Enabled" : "Paused"} sub={data.settings.last_tick ? `Last check: ${showTime(data.settings.last_tick, data.settings.timezone)}` : "Waiting for first enabled run"} wide /></View>
   {data.running ? <Button label="Pause Autopilot" variant="danger" disabled={busy} onPress={() => act(async () => { const next = await autopilotApi.pause(store, data.settings.revision); accept(next); await onChanged(); setNotice({ text: next.in_flight ? `Paused. ${next.in_flight} publication(s) already in progress may still finish.` : "Paused. Pending automated publications were canceled. Already published content stays live.", tone: "info" }); })} /> : null}
   <Body muted>The worker checks every 30 seconds and starts preparing content up to 30 minutes early. After downtime, slots more than two hours late are skipped. A failed check holds the item rather than publishing it.</Body>
  </Card>
  <Card title="1. Choose the campaign and destinations">
   {campaigns.length ? <View style={row}>{campaigns.map((v) => choice(v.title, currentCampaign === v.id, () => change({ campaign_id: v.id })))}</View> : <><Body muted>Create a starter direction for Snapfront’s own marketing. You can refine it in Campaigns.</Body><Button label="Create starter campaign" disabled={busy} onPress={() => act(async () => { const camp = await marketingCenterApi.campaign(store, { title: "Build your first digital store", audience: "Beginners exploring digital products and a business from home", goal: "Explore Snapfront and create a useful first digital product", brief: "Friendly, practical guidance. Show the tools and the steps. No earnings promises or invented testimonials." }); change({ campaign_id: camp.id }); await onChanged(); })} /></>}
   <Body>Publish social videos to:</Body>
   <View style={row}>{data.ready.accounts.filter((a) => a.status === "connected").map((a) => choice(`${a.name} · ${a.platform}`, settings.account_ids.includes(a.id), () => change({ account_ids: settings.account_ids.includes(a.id) ? settings.account_ids.filter((id) => id !== a.id) : [...settings.account_ids, a.id] }), true))}</View>
   {!data.ready.accounts.some((a) => a.status === "connected") ? <Notice text="Connect a Facebook Page or Instagram professional account for social publishing. You can enable articles alone by leaving social times blank." tone="info" /> : null}
   <Button label="Manage social connections" variant="secondary" disabled={busy} onPress={() => router.push("/marketing")} />
  </Card>
  <Card title="2. Set the recurring schedule" sub="Starting suggestion: two videos each day and articles on Tuesday and Friday.">
   <Field label="Time zone" value={settings.timezone} editable={!busy} onChangeText={(timezone) => change({ timezone })} placeholder="America/New_York" />
   <View style={row}>{[["Eastern", "America/New_York"], ["Central", "America/Chicago"], ["Mountain", "America/Denver"], ["Pacific", "America/Los_Angeles"]].map(([label, zone]) => choice(label, settings.timezone === zone, () => change({ timezone: zone })))}</View>
   <Field label="Daily social publishing times" hint="24-hour times separated by commas. Up to three per day. Leave blank to disable social posts." value={times} editable={!busy} onChangeText={(v) => { setTimes(v); setConfirm(false); }} placeholder="09:00, 18:00" />
   <Body>Article days (choose up to three, or none)</Body><View style={row}>{days.map((day, i) => choice(day, settings.article_days.includes(i), () => change({ article_days: settings.article_days.includes(i) ? settings.article_days.filter((d) => d !== i) : [...settings.article_days, i] }), true))}</View>
   <Field label="Article publishing time" value={settings.article_time} editable={!busy} onChangeText={(article_time) => change({ article_time })} placeholder="10:00" />
   <Field label="Maximum AI writing calls per day" hint="1–6, shared across your automated campaigns. Failed attempts and retries count. Reaching the limit skips further writing for that day." value={limit} editable={!busy} onChangeText={(v) => { setLimit(v); setConfirm(false); }} keyboardType="number-pad" maxLength={1} />
   <Body muted>Writing uses your existing AI provider and its charges. This is a call limit, not a dollar spending cap. These automated videos use local narration and Snapfront visuals; they do not spend Runpod or ElevenLabs generation credits. Photorealistic avatar ads remain in the avatar tools.</Body>
   {!data.ai_configured ? <Notice text="AI writing must be configured before Autopilot can be enabled." tone="error" /> : null}
   {choice("Automatically create and publish on this schedule, within these limits, without asking me to approve each post or article.", confirm, () => setConfirm(!confirm), true)}
   <View style={row}><Button label={data.running ? "Update live schedule" : "Enable Autopilot"} disabled={busy || !confirm || !currentCampaign || !data.ai_configured} loading={busy && confirm} onPress={() => save(true)} /><Button label="Save as paused" variant="secondary" disabled={busy || !currentCampaign} onPress={() => save(false)} /><Button label="Reload saved settings" variant="ghost" disabled={busy} onPress={() => act(async () => accept(await autopilotApi.status(store)))} /></View>
  </Card>
  <Card title="Next scheduled slots" sub={`Saved schedule · ${data.settings.timezone}${data.running ? "" : " · paused preview"}`}>
   {data.upcoming.slice(0,6).map((slot) => <Body key={`${slot.kind}:${slot.slot_key}`}>{slot.kind === "blog" ? "Article" : "Social video"} · {showTime(slot.due_at,data.settings.timezone)}</Body>)}
  </Card>
  <Card title="Activity and exceptions" sub="Latest 60 slots. This updates automatically every 30 seconds.">
   {!data.jobs.length ? <Body muted>Your scheduled runs will appear here once you enable Autopilot.</Body> : data.jobs.map((job) => <View key={job.id} style={{ gap: 6, paddingVertical: 12, borderBottomWidth: 1, borderColor: c.line }}>
    <Text style={[type.label, { color: c.ink }]}>{job.title}</Text><Body muted>{job.kind === "blog" ? "Article" : "Social video"} · {job.state.replace(/_/g, " ")} · {showTime(job.due_at,data.settings.timezone)}</Body>
    {job.error ? <Notice text={job.error} tone={["canceled","skipped"].includes(job.state) ? "info" : "error"} /> : null}
    {job.posts.map((post,i) => <Body key={i} muted>{post.account_name}: {post.status}</Body>)}
    {job.content_id ? <Button label="View content" variant="ghost" onPress={() => onOpen(job.content_id!)} /> : null}
   </View>)}
  </Card>
 </View>;
}

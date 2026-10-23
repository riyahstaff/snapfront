import React, { useCallback, useState } from "react";
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { Body, Button, Field, H1, Notice, Screen } from "@/components/ui";
import { MarketingAutopilot } from "@/components/marketing-autopilot";
import { Card, Tile } from "@/components/panel";
import { useMe } from "@/lib/account-store";
import { api, ApiError, marketingCenterApi as mc, type OwnerContent, type OwnerMarketing, type OwnerAsset } from "@/lib/api";
import { type, useColors } from "@/lib/theme";

type Tab = "Autopilot" | "Campaigns" | "Social publishing" | "Blog & SEO" | "Calendar" | "Analytics";
const tabs: Tab[] = ["Autopilot", "Campaigns", "Social publishing", "Blog & SEO", "Calendar", "Analytics"];
const when = (value: string | null) => value ? new Date(value.endsWith("Z") ? value : value.replace(" ", "T") + "Z").toLocaleString() : "Unscheduled";
const errorText = (e: unknown) => e instanceof ApiError || e instanceof Error ? e.message : "Something went wrong. Please try again.";

export default function MarketingCenterScreen() {
  const me = useMe();
  if (!me) return <Screen><ActivityIndicator /></Screen>;
  if (!me.owner) return <Screen><H1>Owner workspace</H1><Body>This marketing center is for Snapfront’s owner.</Body><Button label="Go to your marketing tools" onPress={() => router.replace("/marketing")} /></Screen>;
  return <Workspace key={`${me.id}:${api.storeRevision()}`} store={me.id} />;
}
function Workspace({ store }: { store: string }) {
  const c = useColors();
  const [data, setData] = useState<OwnerMarketing | null>(null);
  const [assets, setAssets] = useState<OwnerAsset[]>([]);
  const [tab, setTab] = useState<Tab>("Autopilot");
  const [campaign, setCampaign] = useState("");
  const [form, setForm] = useState({ title: "", audience: "", goal: "", brief: "" });
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<OwnerContent | null>(null);
  const [dirty, setDirty] = useState(false);
  const [destinations, setDestinations] = useState<string[]>([]);
  const [schedule, setSchedule] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; tone: "ok" | "error" | "info" } | null>(null);
  const load = useCallback(async () => {
    const [next, media] = await Promise.all([mc.dashboard(store), mc.assets(store)]);
    setData(next); setAssets(media.assets);
    setCampaign((id) => next.campaigns.some((v) => v.id === id) ? id : next.campaigns[0]?.id || "");
  }, [store]);
  useFocusEffect(useCallback(() => { load().catch((e) => setMessage({ text: errorText(e), tone: "error" })); }, [load]));
  const act = async (fn: () => Promise<void>) => {
    setBusy(true); setMessage(null);
    try { await fn(); } catch (e) { setMessage({ text: errorText(e), tone: "error" }); }
    finally { setBusy(false); }
  };
  const select = (item: OwnerContent | null) => { setDraft(item); setDirty(false); setConfirmed(false); setDestinations([]); setSchedule(""); };
  const patch = (field: "title" | "caption" | "script" | "body" | "description", value: string) => { if (draft) setDraft({ ...draft, [field]: value }); setDirty(true); setConfirmed(false); };
  const refresh = () => act(async () => { await load(); if (!dirty && draft) { const next = await mc.dashboard(store); select(next.items.find((i) => i.id === draft.id) || null); } });
  const openUrl = (url: string) => { Linking.openURL(url).catch((e) => setMessage({ text: errorText(e), tone: "error" })); };
  const approve = () => act(async () => {
    if (!draft || dirty || !confirmed) return;
    let date: string | null = null;
    if (schedule.trim()) {
      if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(schedule.trim())) throw new Error("Use YYYY-MM-DD HH:mm, for example 2026-11-01 14:30.");
      const parsed = new Date(schedule.trim().replace(" ", "T"));
      if (!Number.isFinite(parsed.getTime()) || parsed.getTime() <= Date.now()) throw new Error("Choose a valid future date and time.");
      date = parsed.toISOString();
    }
    const saved = await mc.approve(store, draft, destinations, date);
    select(saved); await load(); setMessage({ text: saved.status === "published" ? "Your article is live." : "Approved and queued. Check the calendar for its publishing status.", tone: "ok" });
  });
  const choice = (label: string, checked: boolean, onPress: () => void, checkbox = false) => <Pressable key={label} onPress={onPress} disabled={busy} accessibilityRole={checkbox ? "checkbox" : "button"} accessibilityState={checkbox ? { checked } : { selected: checked }} style={[styles.choice, { borderColor: checked ? c.accent : c.line, backgroundColor: checked ? c.sunk : c.surface }]}><Ionicons name={checked ? "checkmark-circle" : "ellipse-outline"} size={20} color={checked ? c.accent : c.muted} /><Text style={[type.label, { color: c.ink, flexShrink: 1 }]}>{label}</Text></Pressable>;
  const visible = data?.items.filter((i) => tab === "Blog & SEO" ? i.kind === "blog" : tab === "Social publishing" ? i.kind === "social" : tab === "Calendar" ? i.status !== "draft" : i.campaign_id === campaign) || [];
  const selectedCampaign = data?.campaigns.find((v) => v.id === campaign);
  const contentCards = (items: OwnerContent[]) => items.length ? items.map((item) => <Pressable key={item.id} disabled={busy || dirty} accessibilityRole="button" accessibilityLabel={`Open ${item.title}, ${item.status}`} onPress={() => select(item)} style={[styles.contentCard, { borderColor: c.line, backgroundColor: c.surface }]}>
    <View style={styles.row}><Text style={[type.small, { color: c.accent }]}>{item.kind === "blog" ? "ARTICLE" : "SOCIAL / VIDEO"}</Text><Text style={[type.small, { color: c.muted }]}>{item.status.replace(/_/g, " ")}</Text></View>
    <Text style={[type.title, { color: c.ink, fontSize: 20 }]}>{item.title}</Text>
    <Text numberOfLines={2} style={[type.small, { color: c.muted }]}>{item.kind === "blog" ? item.description || "Add your article and search description." : item.caption || "Add a caption and finished media."}</Text>
    <Text style={[type.small, { color: c.muted }]}>{when(item.published_at || item.scheduled_at)}</Text>
  </Pressable>) : <Card title="A clear space for your next idea"><Body muted>{tab === "Calendar" ? "Approved posts and articles will appear here. Drafts stay private until you approve them." : "Start a campaign, then generate a pack or write your first draft."}</Body></Card>;

  return <Screen><View style={styles.header}>
    <Text style={[type.small, { color: c.accent }]}>SNAPFRONT · OWNER WORKSPACE</Text><H1>AI Marketing Center</H1>
    <Body muted>Plan the story. Create the content. Choose when it goes live.</Body>
    <View style={styles.row}><Button label="New campaign" disabled={busy || dirty} onPress={() => { setAdding(true); setTab("Campaigns"); select(null); }} /><Button label="Refresh status" variant="secondary" disabled={busy} onPress={refresh} /></View>
  </View>
  <Notice text={message?.text || null} tone={message?.tone} />
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} accessibilityLabel="Marketing sections">
    {tabs.map((name) => <Pressable key={name} disabled={dirty || busy} onPress={() => { setTab(name); select(null); }} accessibilityRole="tab" accessibilityState={{ selected: tab === name }} style={[styles.tab, { borderColor: tab === name ? c.accent : c.line, backgroundColor: tab === name ? c.accent : c.surface }]}><Text style={[type.label, { color: tab === name ? c.onAccent : c.ink }]}>{name}</Text></Pressable>)}
  </ScrollView>
  {!data ? <Card><ActivityIndicator color={c.accent} /><Body muted>Loading your workspace…</Body></Card> : <>
    {tab === "Autopilot" ? <MarketingAutopilot store={store} campaigns={data.campaigns} onChanged={load} onOpen={(id) => act(async () => { const next = await mc.dashboard(store); setData(next); const item = next.items.find((v) => v.id === id); if (item) { setCampaign(item.campaign_id); setTab(item.kind === "blog" ? "Blog & SEO" : "Social publishing"); select(item); } else throw new Error("That content is no longer available in the current list."); })} /> : tab === "Analytics" ? <>
      <Card title="Platform overview" sub="Current Snapfront totals, not conversions attributed to a campaign."><View style={styles.row}>
        <Tile label="Accounts with email" value={String(data.metrics.signed_in_accounts)} wide /><Tile label="Their stores" value={String(data.metrics.stores)} wide /><Tile label="Accounts with Pro access" value={String(data.metrics.pro_accounts)} sub="Includes complimentary access" wide />
      </View></Card>
      <Card title="This workspace"><View style={styles.row}><Tile label="Published content" value={String(data.metrics.published)} wide /><Tile label="Scheduled content" value={String(data.metrics.scheduled)} wide /><Tile label="Article page views" value={String(data.metrics.blog_views)} sub="Includes repeat visits and crawlers" wide /></View><Body muted>Content totals cover the latest 300 items. Article views cover all published articles in this store. Social reach, clicks, and campaign-attributed sales are not connected yet.</Body></Card>
    </> : <>
      {tab === "Campaigns" && (adding || !data.campaigns.length) ? <Card title="1. Give your campaign a direction" sub="The writer uses your audience and goal to shape three social drafts and one article.">
        <Field editable={!busy} label="Campaign name" placeholder="A first digital product, made simple" value={form.title} onChangeText={(title) => setForm({ ...form, title })} maxLength={120} />
        <Field editable={!busy} label="Who is it for?" placeholder="Busy parents exploring digital products" value={form.audience} onChangeText={(audience) => setForm({ ...form, audience })} maxLength={240} />
        <Field editable={!busy} label="What should they do?" placeholder="Explore Snapfront and create their first store" value={form.goal} onChangeText={(goal) => setForm({ ...form, goal })} maxLength={240} />
        <Field editable={!busy} label="Anything else? (optional)" multiline placeholder="Tone, feature to highlight, or an angle to try" value={form.brief} onChangeText={(brief) => setForm({ ...form, brief })} maxLength={2000} />
        <View style={styles.row}><Button label="Create campaign" loading={busy} disabled={[form.title, form.audience, form.goal].some((v) => v.trim().length < 3)} onPress={() => act(async () => { const saved = await mc.campaign(store, form); await load(); setCampaign(saved.id); setAdding(false); setForm({ title: "", audience: "", goal: "", brief: "" }); })} />{data.campaigns.length ? <Button label="Cancel" variant="ghost" disabled={busy} onPress={() => setAdding(false)} /> : null}</View>
      </Card> : null}
      {tab === "Campaigns" && data.campaigns.length ? <>
        <View style={styles.row}>{data.campaigns.map((v) => choice(v.title, campaign === v.id, () => { if (!dirty) { setCampaign(v.id); select(null); } }))}</View>
        {selectedCampaign ? <Card title="2. Build your content pack" sub={`${selectedCampaign.audience} · ${selectedCampaign.goal}`}>
          <Body muted>Get three social captions with video scripts and one article. Everything stays in drafts for your review. Video generation uses your existing tools and their normal credits.</Body>
          <View style={styles.row}><Button label="Generate campaign pack" loading={busy} disabled={!data.ai.configured || data.ai.used_today >= data.ai.daily_limit || dirty} onPress={() => act(async () => { await mc.generate(store, campaign); await load(); setMessage({ text: "Your four drafts are ready. Open one below to review it.", tone: "ok" }); })} />
          {(["social", "blog"] as const).map((kind) => <Button key={kind} label={kind === "social" ? "Write social draft" : "Write article"} variant="secondary" disabled={busy || dirty} onPress={() => act(async () => { const item = await mc.draft(store, campaign, kind); await load(); select(item); })} />)}</View>
          <Body muted>{data.ai.configured ? `${data.ai.used_today} of ${data.ai.daily_limit} AI packs used today (UTC). Failed attempts also count.` : "AI writing is not configured. You can still create and publish drafts manually."}</Body>
        </Card> : null}
      </> : null}
      {tab === "Social publishing" ? <Card title="Your publishing destinations" sub="Schedule to connected Facebook Pages and Instagram professional accounts.">
        {data.social.accounts.length ? data.social.accounts.map((a) => <Body key={a.id}>{a.name} · {a.platform} · {a.status}</Body>) : <Body muted>No social accounts are connected for this store.</Body>}
        {data.social.setup_required ? <Body muted>{data.social.setup_required}</Body> : null}
        <Button label="Manage social connections" variant="secondary" disabled={dirty || busy} onPress={() => router.push("/marketing")} />
        <Body muted>For YouTube, use the existing YouTube Shorts tool. Other networks are not scheduled from this center yet.</Body>
      </Card> : null}
      {tab === "Blog & SEO" ? <Card title="Useful guides, ready for search"><Body muted>Approved articles appear on Snapfront’s public blog with a title, description, canonical URL, structured data, and sitemap entry. Search rankings are not guaranteed.</Body><Button label="Open public blog" variant="secondary" onPress={() => openUrl(api.siteUrl("blog"))} /></Card> : null}
      {tab === "Calendar" ? <Body muted>Upcoming content and publishing history. Times are shown in your device’s time zone. Refresh to check the latest delivery status.</Body> : null}
      {dirty ? <Notice text="You have unsaved edits. Save or discard them before switching content." tone="info" /> : null}
      {draft ? <Card title={`3. Review ${draft.kind === "blog" ? "your article" : "your social post"}`} sub={`Status: ${draft.status.replace(/_/g, " ")}`}>
        {draft.status === "draft" ? <>
          <Field editable={!busy} label="Title" value={draft.title} onChangeText={(v) => patch("title", v)} maxLength={120} />
          {draft.kind === "blog" ? <><Field editable={!busy} label="Search description" value={draft.description} onChangeText={(v) => patch("description", v)} maxLength={160} /><Field editable={!busy} label="Article (plain text)" value={draft.body} onChangeText={(v) => patch("body", v)} maxLength={16000} multiline style={{ minHeight: 320 }} /></> : <>
            <Field editable={!busy} label="Caption" value={draft.caption} onChangeText={(v) => patch("caption", v)} maxLength={2200} multiline />
            <Field editable={!busy} label="Video script and scene directions" value={draft.script} onChangeText={(v) => patch("script", v)} maxLength={2500} multiline />
          </>}
          <View style={styles.row}><Button label="Save draft" disabled={!dirty || busy} loading={busy && dirty} onPress={() => act(async () => { const saved = await mc.save(store, draft); select(saved); await load(); setMessage({ text: "Draft saved.", tone: "ok" }); })} /><Button label={dirty ? "Discard edits" : "Close draft"} variant="ghost" disabled={busy} onPress={() => select(null)} /></View>
          {draft.kind === "social" ? <>
            <Body>Make your video in an existing Snapfront tool, then return here and attach it. Copy the script below to use in the generator.</Body>
            <Button label="Copy video script" variant="secondary" disabled={!draft.script || busy} onPress={() => act(async () => { await Clipboard.setStringAsync(draft.script); setMessage({ text: "Video script copied. Paste it into your generator.", tone: "ok" }); })} />
            <View style={styles.row}><Button label="Avatar studio" variant="secondary" disabled={busy || dirty} onPress={() => router.push("/avatars")} /><Button label="Faceless videos" variant="secondary" disabled={busy || dirty} onPress={() => router.push("/faceless")} /><Button label="Post designer" variant="secondary" disabled={busy || dirty} onPress={() => router.push("/marketing")} /></View>
            {draft.media ? <View style={{ gap: 8 }}><Body>Attached {draft.media.kind === "reel" ? "video" : "post"}</Body>{draft.media.kind !== "reel" && draft.media.files[0] ? <Image source={{ uri: draft.media.files[0].url }} style={{ width: "100%", height: 260, resizeMode: "contain" }} /> : null}{draft.media.files.map((f, i) => <Button key={f.url} label={`Preview media ${i + 1}`} variant="ghost" onPress={() => openUrl(f.url)} />)}</View> : <Body muted>Attach finished media before approving this post.</Body>}
            <Button label="Refresh media library" variant="ghost" disabled={busy} onPress={() => act(async () => setAssets((await mc.assets(store)).assets))} />
            <ScrollView style={{ maxHeight: 240 }} nestedScrollEnabled contentContainerStyle={{ gap: 8 }}>{assets.length ? assets.map((a) => <View key={a.id} style={styles.row}><Button label={`Attach ${a.label}`} variant="secondary" disabled={busy || dirty} onPress={() => act(async () => { select(await mc.attach(store, draft, a.id)); await load(); })} /><Button label="Preview" variant="ghost" onPress={() => openUrl(a.url)} /></View>) : <Body muted>No finished media yet. Create a video or post using the tools above.</Body>}</ScrollView>
            <Body>Choose destinations</Body><View style={styles.row}>{data.social.accounts.filter((a) => a.status === "connected").map((a) => choice(`${a.name} · ${a.platform}`, destinations.includes(a.id), () => { setDestinations((v) => v.includes(a.id) ? v.filter((id) => id !== a.id) : [...v, a.id]); setConfirmed(false); }, true))}</View>
            {!data.social.accounts.some((a) => a.status === "connected") ? <Body muted>Connect an account under Social publishing before approving.</Body> : null}
          </> : null}
          <Field editable={!busy} label="Publish time (optional)" hint="Leave blank to publish now. Or enter YYYY-MM-DD HH:mm in your device’s time zone, within 90 days." value={schedule} onChangeText={(v) => { setSchedule(v); setConfirmed(false); }} placeholder="2026-11-01 14:30" />
          {choice(`I reviewed this ${draft.kind === "blog" ? "article" : "caption, media, and destinations"} and approve publication.`, confirmed, () => setConfirmed(!confirmed), true)}
          <Button label={schedule.trim() ? "Approve and schedule" : "Approve and publish now"} disabled={busy || dirty || !confirmed || (draft.kind === "social" && (!draft.media || !destinations.length))} loading={busy && confirmed} onPress={approve} />
        </> : <>
          <Body>{draft.title}</Body><Body>{draft.kind === "blog" ? draft.body : draft.caption}</Body><Body muted>{when(draft.published_at || draft.scheduled_at)}</Body>
          {draft.url ? <Button label="Read published article" onPress={() => openUrl(draft.url!)} /> : null}
          {draft.posts.map((p) => <View key={p.id}><Body>{p.account_name} · {p.status}</Body>{p.error ? <Notice text={p.error} tone="error" /> : null}{p.permalink ? <Button label="View published post" variant="ghost" onPress={() => openUrl(p.permalink!)} /> : null}</View>)}
          {draft.status === "scheduled" ? <Button label="Cancel schedule and return to draft" variant="secondary" disabled={busy} onPress={() => act(async () => { select(await mc.cancel(store, draft)); await load(); })} /> : null}
          {["failed", "needs_review"].includes(draft.status) ? <Button label="Review delivery in social publishing" variant="secondary" onPress={() => router.push("/marketing")} /> : null}
          <Button label="Close" variant="ghost" onPress={() => select(null)} />
        </>}
      </Card> : null}
      <View style={{ gap: 12 }}>{contentCards(tab === "Calendar" ? [...visible].sort((a, b) => (a.scheduled_at || "").localeCompare(b.scheduled_at || "")) : visible)}</View>
    </>}
  </>}
  </Screen>;
}
const styles = StyleSheet.create({
  header: { gap: 12 }, row: { flexDirection: "row", flexWrap: "wrap", gap: 12, alignItems: "center" },
  tab: { paddingHorizontal: 18, paddingVertical: 13, borderWidth: 1, borderRadius: 30 },
  choice: { flexDirection: "row", alignItems: "center", gap: 9, padding: 13, borderWidth: 1, borderRadius: 12 },
  contentCard: { padding: 20, borderRadius: 16, borderWidth: 1, gap: 10 },
});

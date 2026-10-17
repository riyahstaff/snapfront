// UGC creator kit: where the paid work is, a portfolio page brands can book from, AI scripts for a
// brand's product, pitch emails, and a tracker for every deal from pitch to paid.
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Clipboard from "expo-clipboard";
import { Button, Field, Notice, Pill, Segmented } from "@/components/ui";
import { Card, ChipRow, CopyLink, TextAction, Tile, Toggle, money } from "@/components/panel";
import { ApiError, ugcApi, type UgcDeal, type UgcKit, type UgcProfile, type UgcScript } from "@/lib/api";
import { radius, space, type, useColors } from "@/lib/theme";

type Tab = "work" | "page" | "scripts" | "pitch" | "deals";
const errText = (e: unknown, f: string) => (e instanceof ApiError ? e.message : f);
type Msg = { text: string; tone: "ok" | "error" } | null;

export default function UgcScreen() {
  const c = useColors();
  const [tab, setTab] = useState<Tab>("work");
  const [kit, setKit] = useState<UgcKit | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => { ugcApi.kit().then(setKit).catch((e) => setError(errText(e, "Couldn't load your creator kit."))); }, []);
  useFocusEffect(load);
  if (!kit) return <View style={{ flex: 1, backgroundColor: c.bg, padding: space.xl }}>{error ? <Notice text={error} tone="error" /> : <ActivityIndicator color={c.accent} />}</View>;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ padding: space.xl, gap: space.xl, paddingBottom: 64 }} keyboardShouldPersistTaps="handled">
      <Text style={[type.body, { color: c.muted }]}>Brands pay creators for short videos they can use in ads. You don&apos;t need a big following, just good videos and a place to show them.</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ minWidth: 520, flexGrow: 1 }}>
          <Segmented value={tab} onChange={setTab} options={[{ value: "work", label: "Find work" }, { value: "page", label: "My page" }, { value: "scripts", label: "Scripts" }, { value: "pitch", label: "Pitches" }, { value: "deals", label: "Deals" }]} />
        </View>
      </ScrollView>
      {tab === "work" ? <FindWork kit={kit} /> : null}
      {tab === "page" ? <MyPage profile={kit.profile} onSaved={(p) => setKit({ ...kit, profile: p })} /> : null}
      {tab === "scripts" ? <Scripts /> : null}
      {tab === "pitch" ? <Pitches profile={kit.profile} /> : null}
      {tab === "deals" ? <Deals kit={kit} onChanged={load} /> : null}
    </ScrollView>
  );
}

/* ---------------- Find work ---------------- */
function FindWork({ kit }: { kit: UgcKit }) {
  const c = useColors();
  return (
    <View style={{ gap: space.lg }}>
      <Card title="Where brands hire UGC creators" sub={kit.platforms.note}>
        {kit.platforms.creators.map((p) => (
          <Pressable key={p.name} onPress={() => Linking.openURL(p.url)} accessibilityRole="link" style={{ gap: 2, paddingVertical: 8, borderTopWidth: 1, borderColor: c.sunk }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: space.md }}>
              <Text style={[type.heading, { color: c.ink }]}>{p.name}{p.referral ? <Text style={[type.small, { color: c.muted }]}>  Referral link</Text> : null}</Text>
              {p.pay ? <Text style={[type.small, { color: c.good }]}>{p.pay}</Text> : null}
            </View>
            <Text style={[type.body, { color: c.muted }]}>{p.what}{p.fee ? ` ${p.fee}.` : ""}</Text>
          </Pressable>
        ))}
        {kit.platforms.disclosure ? <Text style={[type.small, { color: c.muted }]}>{kit.platforms.disclosure}</Text> : null}
      </Card>
      <Card title="Price your videos" sub="Typical starting rates. Raise them as your portfolio grows.">
        {[["Your first videos", "$50 to $150 a video"], ["With a solid portfolio", "$150 to $400 a video"], ["Paid ad usage rights", "+30% to +100%, or a monthly fee"], ["Raw footage", "+$50 to $100"], ["Rush (under 72 hours)", "+25%"]].map(([a, b]) => (
          <View key={a} style={{ flexDirection: "row", justifyContent: "space-between", gap: space.md }}>
            <Text style={[type.body, { color: c.ink, flexShrink: 1 }]}>{a}</Text><Text style={[type.body, { color: c.muted }]}>{b}</Text>
          </View>
        ))}
      </Card>
      <Card title="Need UGC for your own store?" sub="Hire creators to make videos for your products.">
        {kit.platforms.stores.map((p) => <Button key={p.name} label={`${p.name}: ${p.what}${p.referral ? " (referral link)" : ""}`} variant="secondary" onPress={() => Linking.openURL(p.url)} />)}
        {kit.platforms.stores.some((p) => p.referral) && kit.platforms.disclosure ? <Text style={[type.small, { color: c.muted }]}>{kit.platforms.disclosure}</Text> : null}
      </Card>
    </View>
  );
}

/* ---------------- My page ---------------- */
function MyPage({ profile, onSaved }: { profile: UgcProfile; onSaved: (p: UgcProfile) => void }) {
  const c = useColors();
  const [p, setP] = useState(profile);
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<Msg>(null);
  async function save(patch: Partial<Omit<UgcProfile, "items">> & { items?: { id?: string; url?: string; title?: string }[] }, done = "Saved.") {
    setBusy("save"); setMsg(null);
    try { const next = await ugcApi.saveProfile(patch); setP(next); onSaved(next); setMsg({ text: done, tone: "ok" }); } catch (e) { setMsg({ text: errText(e, "Couldn't save."), tone: "error" }); } finally { setBusy(null); }
  }
  async function upload() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["videos"] as ImagePicker.MediaType[], allowsEditing: false, quality: 1 });
    const a = res.canceled ? null : res.assets?.[0];
    if (!a) return;
    setBusy("upload"); setMsg({ text: "Uploading and preparing your video…", tone: "ok" });
    try {
      const blob = await (await fetch(a.uri)).blob();
      const next = await ugcApi.uploadVideo(blob, a.mimeType || blob.type || "video/mp4", a.fileName?.replace(/\.[^.]+$/, "") || "");
      setP(next); onSaved(next); setMsg({ text: "Video added to your page.", tone: "ok" });
    } catch (e) { setMsg({ text: errText(e, "Couldn't upload that video."), tone: "error" }); } finally { setBusy(null); }
  }
  const items = p.items.map((i) => ({ id: i.id, title: i.title }));
  return (
    <View style={{ gap: space.lg }}>
      <Card title="Your UGC page" sub="A page brands can visit to see your videos, your rates and how to book you.">
        <Toggle label="Published" sub={p.enabled ? "Brands can see it." : "Only you can edit it for now."} value={p.enabled} disabled={busy !== null} onChange={(v) => save({ enabled: v }, v ? "Your page is live." : "Unpublished.")} />
        {p.enabled ? <CopyLink url={p.page_url} /> : null}
      </Card>
      <Notice text={msg?.text ?? null} tone={msg?.tone} />
      <Card title="Videos" sub="Upload up to 12. Three good ones beat twelve okay ones.">
        {p.items.map((i) => (
          <View key={i.id} style={{ flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: 6, borderTopWidth: 1, borderColor: c.sunk }}>
            <Pill text={i.kind === "video" ? "Video" : "Link"} />
            <Text style={[type.body, { color: c.ink, flex: 1 }]} numberOfLines={1}>{i.title || i.url || "Untitled"}</Text>
            <TextAction label="Remove" tone="bad" onPress={() => save({ items: items.filter((x) => x.id !== i.id) }, "Removed.")} />
          </View>
        ))}
        <Button label="Upload a video" loading={busy === "upload"} disabled={busy !== null || p.items.length >= 12} onPress={upload} />
        <View style={{ flexDirection: "row", gap: space.md, alignItems: "flex-end", flexWrap: "wrap" }}>
          <View style={{ flexGrow: 1, minWidth: 220 }}><Field label="Or add a link (TikTok, Instagram, YouTube, Drive)" value={link} onChangeText={setLink} autoCapitalize="none" keyboardType="url" /></View>
          <Button label="Add link" variant="secondary" disabled={!link.trim() || busy !== null} onPress={() => { save({ items: [...items, { url: link.trim(), title: "" }] }, "Link added."); setLink(""); }} />
        </View>
      </Card>
      <Card title="About you">
        <Field label="Name" value={p.name} onChangeText={(v) => setP({ ...p, name: v })} maxLength={60} />
        <Field label="Headline" value={p.headline} onChangeText={(v) => setP({ ...p, headline: v })} maxLength={100} />
        <Field label="Niches (comma separated)" value={p.niches.join(", ")} onChangeText={(v) => setP({ ...p, niches: v.split(",").map((x) => x.trimStart()) })} placeholder="beauty, home, pets" />
        <Field label="Short bio" value={p.bio} onChangeText={(v) => setP({ ...p, bio: v })} multiline maxLength={800} />
        <Field label="Email for bookings" value={p.email} onChangeText={(v) => setP({ ...p, email: v })} autoCapitalize="none" keyboardType="email-address" />
        <Field label="TikTok profile link" value={p.socials.tiktok} onChangeText={(v) => setP({ ...p, socials: { ...p.socials, tiktok: v } })} autoCapitalize="none" />
        <Field label="Instagram profile link" value={p.socials.instagram} onChangeText={(v) => setP({ ...p, socials: { ...p.socials, instagram: v } })} autoCapitalize="none" />
      </Card>
      <Card title="Rates">
        {p.rates.map((r, i) => (
          <View key={i} style={{ flexDirection: "row", gap: space.md, alignItems: "flex-end" }}>
            <View style={{ flex: 1 }}><Field label="What" value={r.label} onChangeText={(v) => setP({ ...p, rates: p.rates.map((x, k) => (k === i ? { ...x, label: v } : x)) })} maxLength={60} /></View>
            <View style={{ width: 110 }}><Field label="Price ($)" value={String(r.price)} keyboardType="number-pad" onChangeText={(v) => setP({ ...p, rates: p.rates.map((x, k) => (k === i ? { ...x, price: Number(v.replace(/\D/g, "")) || 0 } : x)) })} /></View>
            <TextAction label="Remove" tone="bad" onPress={() => setP({ ...p, rates: p.rates.filter((_, k) => k !== i) })} />
          </View>
        ))}
        {p.rates.length < 8 ? <TextAction label="Add a rate" onPress={() => setP({ ...p, rates: [...p.rates, { label: "", price: 0 }] })} /> : null}
      </Card>
      <Button label="Save my page" loading={busy === "save"} disabled={busy !== null} onPress={() => save({ name: p.name, headline: p.headline, niches: p.niches.map((x) => x.trim()).filter(Boolean), bio: p.bio, email: p.email, socials: p.socials, rates: p.rates.filter((r) => r.label.trim()) })} />
    </View>
  );
}

/* ---------------- Scripts ---------------- */
// Describe the video in your own words (or paste a brief or a rough script); AI writes the full script.
// Then ask for changes ("make the hook funnier") or try a new version.
const STYLE_CHIPS = [["auto", "AI picks"], ["testimonial", "Testimonial"], ["unboxing", "Unboxing"], ["problem-solution", "Problem, solution"], ["how-to", "How to"],
  ["before-after", "Before and after"], ["day-in-my-life", "Day in my life"], ["storytime", "Storytime"], ["comparison", "Comparison"]].map(([value, label]) => ({ value, label }));
const STYLE_NAME = Object.fromEntries(STYLE_CHIPS.map((x) => [x.value, x.label]));
function Scripts() {
  const c = useColors();
  const [idea, setIdea] = useState("");
  const [more, setMore] = useState(false);
  const [brand, setBrand] = useState("");
  const [product, setProduct] = useState("");
  const [style, setStyle] = useState("auto");
  const [seconds, setSeconds] = useState("30");
  const [out, setOut] = useState<UgcScript | null>(null);
  const [change, setChange] = useState("");
  const [busy, setBusy] = useState<"write" | "change" | "again" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const ready = idea.trim().length >= 10 || product.trim().length > 0;
  async function write(kind: "write" | "change" | "again") {
    setBusy(kind); setError(null);
    try {
      const next = await ugcApi.script({ idea: idea.trim(), brand: brand.trim() || undefined, product: product.trim() || undefined, style, seconds: Number(seconds),
        ...(kind === "change" && out ? { previous: out, change: change.trim() } : {}) });
      setOut(next);
      if (kind === "change") setChange("");
    } catch (e) { setError(errText(e, "Couldn't write the script.")); } finally { setBusy(null); }
  }
  const copy = async (what: string, text: string) => { await Clipboard.setStringAsync(text); setCopied(what); setTimeout(() => setCopied(null), 1800); };
  const everything = out ? [
    out.title ? out.title.toUpperCase() : "",
    `HOOK OPTIONS:\n${out.hooks.map((h, i) => `${i + 1}. ${h}`).join("\n")}`,
    out.full_script ? `FULL SCRIPT:\n${out.full_script}` : "",
    `SHOT LIST:\n${out.scenes.map((s, i) => `${i + 1}. ${s.shot}${s.seconds ? ` (${s.seconds}s)` : ""}\n   Say: ${s.line}${s.text ? `\n   On screen: ${s.text}` : ""}`).join("\n")}`,
    `CALL TO ACTION: ${out.cta}`,
    out.caption ? `CAPTION:\n${out.caption}${out.hashtags?.length ? `\n${out.hashtags.join(" ")}` : ""}` : "",
  ].filter(Boolean).join("\n\n") : "";
  return (
    <View style={{ gap: space.lg }}>
      <Card title="Write a UGC script" sub="Describe the video you want in your own words, paste a brand's brief, or paste a rough script. AI turns it into a full script ready to film.">
        <Field label="Describe your video" value={idea} onChangeText={setIdea} multiline maxLength={1500}
          placeholder="e.g. A chill night-time video showing how my new desk lamp makes my boring desk feel cozy. I want it to feel relatable, not salesy, and end with the link in my bio."
          style={{ minHeight: 120, textAlignVertical: "top" }} />
        <Pressable onPress={() => setMore(!more)} accessibilityRole="button" style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={[type.small, { color: c.accent }]}>{more ? "Hide brand and product" : "Add brand and product (optional)"}</Text>
        </Pressable>
        {more ? (
          <>
            <Field label="Brand" value={brand} onChangeText={setBrand} maxLength={80} />
            <Field label="Product" value={product} onChangeText={setProduct} maxLength={200} placeholder="Vitamin C serum, 30 ml" />
          </>
        ) : null}
        <ChipRow label="Style" value={style} onChange={setStyle} options={STYLE_CHIPS} />
        <ChipRow label="Length" value={seconds} onChange={setSeconds} options={["15", "30", "45", "60"].map((s) => ({ value: s, label: `${s} sec` }))} />
        <Notice text={error} tone="error" />
        <Button label={out ? "Write a fresh script" : "Write my script"} loading={busy === "write"} disabled={!ready || busy !== null} onPress={() => write("write")} />
      </Card>

      {out ? (
        <>
          <Card title={out.title || "Your script"} sub={`${STYLE_NAME[out.style] ?? out.style} · about ${out.seconds} seconds${out.words ? ` · ${out.words} words` : ""}`}
            right={<TextAction label={copied === "all" ? "Copied" : "Copy all"} onPress={() => copy("all", everything)} />}>
            {out.why ? <Text style={[type.small, { color: c.muted }]}>{out.why}</Text> : null}
            <Text style={[type.label, { color: c.ink }]}>Hook options</Text>
            {out.hooks.map((h, i) => <Text key={h} style={[type.body, { color: c.ink }]}>{i + 1}. “{h}”{i === 0 ? <Text style={[type.small, { color: c.muted }]}>  used below</Text> : null}</Text>)}
            {out.full_script ? (
              <View style={{ gap: space.sm, padding: space.md, borderRadius: radius.md, backgroundColor: c.bg, borderWidth: 1, borderColor: c.line }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={[type.label, { color: c.ink }]}>Full script (what you say)</Text>
                  <TextAction label={copied === "script" ? "Copied" : "Copy"} onPress={() => copy("script", out.full_script!)} />
                </View>
                <Text selectable style={[type.body, { color: c.ink, lineHeight: 24 }]}>{out.full_script}</Text>
              </View>
            ) : null}
            <Text style={[type.label, { color: c.ink }]}>Shot list</Text>
            {out.scenes.map((s, i) => (
              <View key={i} style={{ gap: 2, padding: space.md, borderRadius: radius.md, backgroundColor: c.bg, borderWidth: 1, borderColor: c.line }}>
                <Text style={[type.label, { color: c.muted }]}>Scene {i + 1}{s.seconds ? ` · ${s.seconds}s` : ""}: {s.shot}</Text>
                <Text style={[type.body, { color: c.ink }]}>{s.line}</Text>
                {s.text ? <Text style={[type.small, { color: c.muted }]}>On screen: {s.text}</Text> : null}
              </View>
            ))}
            <Text style={[type.body, { color: c.ink }]}>End with: {out.cta}</Text>
            {out.caption ? (
              <View style={{ gap: 4 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={[type.label, { color: c.ink }]}>Caption</Text>
                  <TextAction label={copied === "caption" ? "Copied" : "Copy"} onPress={() => copy("caption", `${out.caption}${out.hashtags?.length ? `\n${out.hashtags.join(" ")}` : ""}`)} />
                </View>
                <Text selectable style={[type.body, { color: c.ink }]}>{out.caption}</Text>
                {out.hashtags?.length ? <Text selectable style={[type.small, { color: c.accent }]}>{out.hashtags.join(" ")}</Text> : null}
              </View>
            ) : null}
            {out.tips.map((t) => <Text key={t} style={[type.small, { color: c.muted }]}>Tip: {t}</Text>)}
          </Card>
          <Card title="Want it different?" sub="Say what to change and AI rewrites it, keeping what works.">
            <Field label="What should change?" value={change} onChangeText={setChange} maxLength={300} placeholder="Make the hook funnier, mention it's on sale, shorter ending…" />
            <View style={{ flexDirection: "row", gap: space.sm }}>
              <Button label="Rewrite it" style={{ flex: 1 }} loading={busy === "change"} disabled={change.trim().length < 3 || busy !== null} onPress={() => write("change")} />
              <Button label="New version" variant="secondary" style={{ flex: 1 }} loading={busy === "again"} disabled={busy !== null} onPress={() => write("again")} />
            </View>
          </Card>
        </>
      ) : null}
    </View>
  );
}

/* ---------------- Pitches ---------------- */
function Pitches({ profile }: { profile: UgcProfile }) {
  const c = useColors();
  const [brand, setBrand] = useState("");
  const b = brand.trim() || "[Brand]";
  const link = profile.enabled ? profile.page_url : "[link to your UGC page]";
  const niche = profile.niches[0] || "[your niche]";
  const templates = [
    { title: "First pitch", body: `Subject: UGC videos for ${b}\n\nHi ${b} team,\n\nI'm ${profile.name}, a UGC creator focused on ${niche}. I love what you're doing with your products and I have a few video ideas that could work well as ads on TikTok and Instagram.\n\nHere are my videos and rates: ${link}\n\nWould you be open to a quick test video? I can deliver within 5 days.\n\nThanks,\n${profile.name}` },
    { title: "Follow-up (after 5 days)", body: `Subject: Re: UGC videos for ${b}\n\nHi again,\n\nJust following up on my note last week. I put together a quick hook idea for you: "[your hook]". Happy to film it as a test.\n\nMy portfolio: ${link}\n\n${profile.name}` },
    { title: "After a job: ask for more", body: `Subject: Next round of videos for ${b}?\n\nHi,\n\nThanks again for working with me. If the videos are performing, I'd love to make 3 more variations with new hooks. I can offer a bundle rate for a monthly package.\n\n${profile.name}` },
  ];
  return (
    <View style={{ gap: space.lg }}>
      <Field label="Brand name" value={brand} onChangeText={setBrand} placeholder="Fills it into every email" />
      {templates.map((t) => (
        <Card key={t.title} title={t.title} right={<TextAction label="Copy" onPress={() => Clipboard.setStringAsync(t.body)} />}>
          <Text selectable style={[type.body, { color: c.ink }]}>{t.body}</Text>
        </Card>
      ))}
    </View>
  );
}

/* ---------------- Deals ---------------- */
const STATUS: { value: UgcDeal["status"]; label: string }[] = [{ value: "pitched", label: "Pitched" }, { value: "talking", label: "Talking" }, { value: "booked", label: "Booked" }, { value: "delivered", label: "Delivered" }, { value: "paid", label: "Paid" }, { value: "lost", label: "Lost" }];
function Deals({ kit, onChanged }: { kit: UgcKit; onChanged: () => void }) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const [brand, setBrand] = useState("");
  const [amount, setAmount] = useState("");
  const [msg, setMsg] = useState<Msg>(null);
  const t = kit.totals;
  const act = async (fn: () => Promise<unknown>) => { try { await fn(); onChanged(); } catch (e) { setMsg({ text: errText(e, "That didn't work."), tone: "error" }); } };
  return (
    <View style={{ gap: space.lg }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md }}>
        <Tile label="Paid" value={money(t.paid)} wide={width >= 820} />
        <Tile label="Waiting on payment" value={money(t.owed)} wide={width >= 820} />
        <Tile label="Booked" value={money(t.booked)} wide={width >= 820} />
        <Tile label="In talks" value={money(t.pipeline)} wide={width >= 820} />
      </View>
      <Card title="Add a deal">
        <View style={{ flexDirection: "row", gap: space.md, alignItems: "flex-end", flexWrap: "wrap" }}>
          <View style={{ flexGrow: 1, minWidth: 180 }}><Field label="Brand" value={brand} onChangeText={setBrand} maxLength={80} /></View>
          <View style={{ width: 120 }}><Field label="Amount ($)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" /></View>
          <Button label="Add" disabled={!brand.trim()} onPress={() => act(async () => { await ugcApi.addDeal({ brand, amount: Number(amount) || 0, status: "pitched" }); setBrand(""); setAmount(""); })} />
        </View>
      </Card>
      <Notice text={msg?.text ?? null} tone={msg?.tone} />
      {kit.deals.map((d) => (
        <Card key={d.id}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: space.md }}>
            <Text style={[type.heading, { color: c.ink, flex: 1 }]}>{d.brand}</Text>
            <Text style={[type.heading, { color: c.ink }]}>{money(d.amount)}</Text>
          </View>
          <ChipRow value={d.status} onChange={(v) => act(() => ugcApi.updateDeal(d.id, { status: v }))} options={STATUS} />
          <TextAction label="Delete" tone="bad" onPress={() => Alert.alert(`Delete the ${d.brand} deal?`, undefined, [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => act(() => ugcApi.deleteDeal(d.id)) }])} />
        </Card>
      ))}
      {!kit.deals.length ? <Text style={[type.body, { color: c.muted }]}>Add every brand you pitch, so you know who to follow up with and who owes you money.</Text> : null}
    </View>
  );
}

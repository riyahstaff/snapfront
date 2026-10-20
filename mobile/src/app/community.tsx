// The Snapfront community, in the spirit of Skool: a feed of posts by category, a leaderboard with
// levels earned from likes, the members and a calendar of live calls. Free accounts can read; members
// post, comment and like. Snapfront's owner pins, removes, pauses posting and runs the calendar.
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, Switch, Text, TextInput, View, useWindowDimensions } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Button, Field, Notice, Segmented } from "@/components/ui";
import { Avatar, LevelCard, NameLine, PostCard, kindText, parseTime, timeAgo } from "@/components/community-ui";
import { ApiError, communityApi, type CommunityEvent, type CommunityHome, type CommunityNotification, type CommunityPerson, type CommunityPost, type CommunityReport } from "@/lib/api";
import { fonts, radius, space, type, useColors } from "@/lib/theme";

type Tab = "feed" | "calendar" | "members" | "leaderboard";
const errText = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);

export default function CommunityScreen() {
  const c = useColors();
  const { width } = useWindowDimensions();
  const wide = width >= 980;
  const [home, setHome] = useState<CommunityHome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("feed");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<"activity" | "new" | "top">("activity");
  const [q, setQ] = useState("");
  const [found, setFound] = useState<CommunityPost[] | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  const [bell, setBell] = useState(false);

  const load = useCallback(async () => {
    try {
      const h = await communityApi.home({ category, sort });
      setHome(h); setPosts(h.posts); setNext(h.next); setError(null);
    } catch (e) { setError(errText(e, "Couldn't load the community.")); }
  }, [category, sort]);
  useFocusEffect(useCallback(() => {
    load();
    const t = setInterval(load, 30_000);   // new posts and comments show up without a refresh
    return () => clearInterval(t);
  }, [load]));
  // Searching shows matching posts in place of the feed.
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const t = setTimeout(() => communityApi.posts({ q: term }).then((r) => setFound(r.posts)).catch(() => {}), 300);
    return () => clearTimeout(t);
  }, [q]);
  const shown = q.trim().length >= 2 ? found : null;   // search results, while searching
  const loadMore = async () => {
    if (!next) return;
    setMore(true);
    try { const r = await communityApi.posts({ category, sort, before: next }); setPosts((p) => [...p, ...r.posts.filter((x) => !p.some((y) => y.id === x.id))]); setNext(r.next); }
    catch (e) { setError(errText(e, "Couldn't load more posts.")); } finally { setMore(false); }
  };
  const like = async (p: CommunityPost) => {
    const on = !p.liked;
    setPosts((list) => list.map((x) => (x.id === p.id ? { ...x, liked: on, likes: x.likes + (on ? 1 : -1) } : x)));
    try { const r = await communityApi.like("post", p.id, on); setPosts((list) => list.map((x) => (x.id === p.id ? { ...x, liked: r.liked, likes: r.likes } : x))); }
    catch (e) { setPosts((list) => list.map((x) => (x.id === p.id ? p : x))); setError(errText(e, "Couldn't save your like.")); }
  };

  if (!home) return <View style={{ flex: 1, backgroundColor: c.bg, padding: space.xl }}>{error ? <Notice text={error} tone="error" /> : <ActivityIndicator color={c.accent} />}</View>;
  const me = home.me;
  const catOf = (id: string) => home.categories.find((x) => x.id === id);

  const sidebar = (
    <View style={{ gap: space.lg }}>
      <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, overflow: "hidden" }}>
        <View style={{ height: 6, backgroundColor: c.brand }} />
        <View style={{ padding: space.lg, gap: space.sm }}>
          <Text style={[type.title, { color: c.ink, fontSize: 21 }]}>Snapfront Community</Text>
          <Text style={[type.body, { color: c.muted }]}>Share wins, ask questions, get feedback on your store and join live calls with other sellers. Included with your membership.</Text>
          {home.links.live_schedule ? <Text style={[type.small, { color: c.ink }]}>🎙 Live coaching: {home.links.live_schedule}</Text> : null}
          <View style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap", marginTop: 4 }}>
            {home.links.discord ? <Button label="Discord" variant="secondary" onPress={() => Linking.openURL(home.links.discord!)} /> : null}
            <Button label="Academy" variant="secondary" onPress={() => router.push("/academy")} />
          </View>
        </View>
      </View>
      <LevelCard me={me} levels={home.levels} compact />
      {home.events.length ? (
        <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, padding: space.lg, gap: space.md }}>
          <Text style={[type.heading, { color: c.ink }]}>Coming up</Text>
          {home.events.map((e) => <EventRow key={e.id} e={e} small />)}
          <Button label="Open the calendar" variant="ghost" onPress={() => setTab("calendar")} />
        </View>
      ) : null}
    </View>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
      <View style={{ width: "100%", maxWidth: 1888, alignSelf: "center", paddingHorizontal: wide ? 24 : space.lg, paddingTop: space.lg, gap: space.lg }}>
        {/* Tabs and the bell */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }} style={{ flex: 1 }}>
            {([["feed", "Community"], ["calendar", "Calendar"], ["members", "Members"], ["leaderboard", "Leaderboards"]] as [Tab, string][]).map(([k, label]) => (
              <Pressable key={k} accessibilityRole="tab" accessibilityState={{ selected: tab === k }} onPress={() => setTab(k)}
                style={{ paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 2, borderColor: tab === k ? c.ink : "transparent" }}>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: tab === k ? c.ink : c.muted }}>{label}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable accessibilityRole="button" accessibilityLabel={`Notifications${me.unread ? `, ${me.unread} new` : ""}`} onPress={() => setBell(!bell)} hitSlop={8}
            style={{ width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: bell ? c.sunk : "transparent" }}>
            <Ionicons name="notifications-outline" size={22} color={c.ink} />
            {me.unread ? <View style={{ position: "absolute", top: 4, right: 4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: "#FF5A6E", alignItems: "center", justifyContent: "center", paddingHorizontal: 4 }}>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: "#FFFFFF" }}>{me.unread > 9 ? "9+" : me.unread}</Text></View> : null}
          </Pressable>
        </View>
        {bell ? <Notifications onClose={() => { setBell(false); load(); }} /> : null}
        <Notice text={error} tone="error" />
        {!me.member ? (
          <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.brand, borderRadius: radius.lg, padding: space.lg, gap: space.sm }}>
            <Text style={[type.heading, { color: c.ink }]}>You&apos;re previewing the community</Text>
            <Text style={[type.body, { color: c.muted }]}>Members post, comment, like, climb the leaderboard and get the live-call links. It&apos;s included with every Snapfront membership.</Text>
            <Button label="Become a member" onPress={() => router.push("/plans")} style={{ alignSelf: "flex-start" }} />
          </View>
        ) : me.muted ? <Notice text="Posting is paused on your account. You can still read everything." /> : null}

        <View style={{ flexDirection: wide ? "row" : "column", gap: space.xl, alignItems: "flex-start" }}>
          <View style={{ flex: wide ? 1 : undefined, width: wide ? undefined : "100%", gap: space.lg, minWidth: 0 }}>
            {tab === "feed" ? (
              <>
                {me.can_post ? <Composer home={home} onPosted={(p) => setPosts((list) => { const pins = list.filter((x) => x.pinned); return [...pins, p, ...list.filter((x) => !x.pinned)]; })} /> : null}
                {me.owner ? <Reports /> : null}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
                  {[{ id: "", name: "All", emoji: "" }, ...home.categories].map((cat) => (
                    <Pressable key={cat.id || "all"} accessibilityRole="button" accessibilityState={{ selected: category === cat.id }} onPress={() => setCategory(cat.id)}
                      style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: category === cat.id ? c.accent : c.surface, borderWidth: 1, borderColor: category === cat.id ? c.accent : c.line }}>
                      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: category === cat.id ? c.onAccent : c.ink }}>{cat.emoji ? `${cat.emoji} ` : ""}{cat.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.pill, paddingHorizontal: space.md }}>
                  <Ionicons name="search" size={17} color={c.muted} />
                  <TextInput value={q} onChangeText={setQ} placeholder="Search posts" placeholderTextColor={c.muted} accessibilityLabel="Search posts"
                    style={{ flex: 1, height: 42, fontFamily: fonts.body, fontSize: 15, color: c.ink }} />
                  {q ? <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQ("")} hitSlop={8}><Ionicons name="close-circle" size={18} color={c.muted} /></Pressable> : null}
                </View>
                {shown ? (
                  <>
                    <Text style={[type.small, { color: c.muted }]}>{shown.length ? `${shown.length} post${shown.length === 1 ? "" : "s"} found` : "No posts match that search."}</Text>
                    {shown.map((p) => <PostCard key={p.id} post={p} category={catOf(p.category)} canLike={false} onLike={() => {}} onOpen={() => router.push({ pathname: "/community-post/[id]", params: { id: p.id } })} />)}
                  </>
                ) : null}
                {!shown ? <Segmented value={sort} onChange={setSort} options={[{ value: "activity", label: "Latest activity" }, { value: "new", label: "New" }, { value: "top", label: "Top" }]} /> : null}
                {shown ? null : posts.length ? posts.map((p) => (
                  <PostCard key={p.id} post={p} category={catOf(p.category)} canLike={me.can_post && !p.mine} onLike={() => like(p)}
                    onOpen={() => router.push({ pathname: "/community-post/[id]", params: { id: p.id } })} />
                )) : (
                  <View style={{ padding: space.xl, alignItems: "center", gap: space.sm }}>
                    <Text style={{ fontSize: 34 }}>👋</Text>
                    <Text style={[type.heading, { color: c.ink }]}>{category ? "Nothing here yet" : "Be the first to post"}</Text>
                    <Text style={[type.body, { color: c.muted, textAlign: "center" }]}>Introduce yourself, share your store or ask a question.</Text>
                  </View>
                )}
                {next && !shown ? <Button label="Show more posts" variant="secondary" loading={more} onPress={loadMore} /> : null}
              </>
            ) : tab === "calendar" ? <Calendar owner={me.owner} member={me.member} />
              : tab === "members" ? <Members me={home.me} onSaved={load} />
              : <Leaderboard home={home} />}
          </View>
          {wide ? <View style={{ width: 340 }}>{sidebar}</View> : tab === "feed" ? <View style={{ width: "100%" }}>{sidebar}</View> : null}
        </View>
      </View>
    </ScrollView>
  );
}

/* ---------- writing a post ---------- */
function Composer({ home, onPosted }: { home: CommunityHome; onPosted: (p: CommunityPost) => void }) {
  const c = useColors();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("general");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [photo, setPhoto] = useState<{ file: string; url: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [emailAll, setEmailAll] = useState(false);
  const cats = home.categories.filter((x) => !x.owner_only || home.me.owner);
  const pick = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8, base64: true });
    if (r.canceled || !r.assets[0]?.base64) return;
    setUploading(true); setMsg(null);
    try { const up = await communityApi.photo(r.assets[0].base64, r.assets[0].mimeType || "image/jpeg"); setPhoto({ file: up.image_file, url: up.image_url }); }
    catch (e) { setMsg(errText(e, "Couldn't add that photo.")); } finally { setUploading(false); }
  };
  const post = async () => {
    setBusy(true); setMsg(null);
    try {
      const p = await communityApi.create({ category, title: title.trim(), body: body.trim(), image_file: photo?.file, email_members: category === "announcements" && emailAll });
      onPosted(p); setTitle(""); setBody(""); setPhoto(null); setOpen(false);
    } catch (e) { setMsg(errText(e, "Couldn't post. Try again.")); } finally { setBusy(false); }
  };
  if (!open) {
    return (
      <Pressable accessibilityRole="button" onPress={() => setOpen(true)} style={{ flexDirection: "row", alignItems: "center", gap: space.md, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, padding: space.lg }}>
        <Avatar person={home.me} size={38} />
        <Text style={[type.body, { color: c.muted, flex: 1 }]}>Write something…</Text>
        <Ionicons name="create-outline" size={20} color={c.muted} />
      </Pressable>
    );
  }
  return (
    <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, padding: space.lg, gap: space.md }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
        <Avatar person={home.me} size={38} />
        <Text style={[type.heading, { color: c.ink, flex: 1 }]}>New post</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => setOpen(false)} hitSlop={10}><Ionicons name="close" size={22} color={c.muted} /></Pressable>
      </View>
      <TextInput value={title} onChangeText={setTitle} placeholder="Title" placeholderTextColor={c.muted} maxLength={140} accessibilityLabel="Title"
        style={{ fontFamily: fonts.bodyBold, fontSize: 18, color: c.ink, paddingVertical: 6 }} />
      <TextInput value={body} onChangeText={setBody} placeholder="Share a win, ask a question, or post your store for feedback…" placeholderTextColor={c.muted} multiline maxLength={5000} accessibilityLabel="Post"
        style={{ fontFamily: fonts.body, fontSize: 15, lineHeight: 23, color: c.ink, minHeight: 110, textAlignVertical: "top" }} />
      {photo ? (
        <View>
          <Image source={{ uri: photo.url }} style={{ width: "100%", aspectRatio: 16 / 9, borderRadius: radius.md }} contentFit="cover" />
          <Pressable accessibilityRole="button" accessibilityLabel="Remove photo" onPress={() => setPhoto(null)} style={{ position: "absolute", top: 8, right: 8, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 16, padding: 6 }}>
            <Ionicons name="close" size={16} color="#fff" />
          </Pressable>
        </View>
      ) : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
        {cats.map((x) => (
          <Pressable key={x.id} accessibilityRole="radio" accessibilityState={{ selected: category === x.id }} onPress={() => setCategory(x.id)}
            style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: category === x.id ? c.accent : c.line, backgroundColor: category === x.id ? c.sunk : "transparent" }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: c.ink }}>{x.emoji} {x.name}</Text>
          </Pressable>
        ))}
      </View>
      {category === "announcements" ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
          <Switch value={emailAll} onValueChange={setEmailAll} accessibilityLabel="Email this to all members" />
          <Text style={[type.small, { color: c.ink, flex: 1 }]}>Also email this to every member (people who turned community emails off are skipped)</Text>
        </View>
      ) : null}
      <Notice text={msg} tone="error" />
      <View style={{ flexDirection: "row", gap: space.sm, alignItems: "center" }}>
        <Button label={photo ? "Change photo" : "Add photo"} variant="secondary" loading={uploading} onPress={pick} icon={<Ionicons name="image-outline" size={18} color={c.ink} />} />
        <View style={{ flex: 1 }} />
        <Button label="Post" loading={busy} disabled={title.trim().length < 3} onPress={post} />
      </View>
    </View>
  );
}

/* ---------- notifications ---------- */
function Notifications({ onClose }: { onClose: () => void }) {
  const c = useColors();
  const [list, setList] = useState<CommunityNotification[] | null>(null);
  useEffect(() => { communityApi.notifications().then(setList).catch(() => setList([])); }, []);
  const readAll = async () => { await communityApi.markRead().catch(() => {}); onClose(); };
  return (
    <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, padding: space.lg, gap: space.md }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text style={[type.heading, { color: c.ink, flex: 1 }]}>Notifications</Text>
        <Button label="Mark all read" variant="ghost" onPress={readAll} />
      </View>
      {!list ? <ActivityIndicator color={c.accent} /> : list.length ? list.map((n) => (
        <Pressable key={n.id} accessibilityRole="button" onPress={() => { onClose(); router.push({ pathname: "/community-post/[id]", params: { id: n.post_id } }); }}
          style={{ flexDirection: "row", gap: space.md, alignItems: "center", opacity: n.read ? 0.6 : 1 }}>
          <Avatar person={n.actor} size={34} badge={false} />
          <Text style={[type.small, { color: c.ink, flex: 1 }]}><Text style={{ fontFamily: fonts.bodyBold }}>{n.actor.name}</Text> {kindText[n.kind]} {n.kind === "like_post" ? "" : `“${n.post_title}”`}</Text>
          <Text style={[type.small, { color: c.muted }]}>{timeAgo(n.created_at)}</Text>
          {!n.read ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#FF5A6E" }} /> : null}
        </Pressable>
      )) : <Text style={[type.body, { color: c.muted }]}>Nothing yet. When someone likes or answers your posts, you&apos;ll see it here.</Text>}
    </View>
  );
}

/* ---------- owner: reported posts and comments ---------- */
function Reports() {
  const c = useColors();
  const [list, setList] = useState<CommunityReport[]>([]);
  useEffect(() => { communityApi.reports().then(setList).catch(() => {}); }, []);
  if (!list.length) return null;
  return (
    <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.bad, borderRadius: radius.lg, padding: space.lg, gap: space.md }}>
      <Text style={[type.heading, { color: c.ink }]}>Reported ({list.length})</Text>
      {list.map((r) => (
        <View key={r.kind + r.id} style={{ gap: 6, borderTopWidth: 1, borderColor: c.sunk, paddingTop: space.sm }}>
          <Text style={[type.small, { color: c.muted }]}>{r.kind === "post" ? "Post" : "Comment"} by {r.author.name} · {r.reports} report{r.reports === 1 ? "" : "s"}{r.reasons ? ` · ${r.reasons}` : ""}{r.removed ? " · removed" : ""}</Text>
          <Text style={[type.body, { color: c.ink }]} numberOfLines={3}>{r.text}</Text>
          <View style={{ flexDirection: "row", gap: space.sm }}>
            <Button label="Open" variant="secondary" onPress={() => router.push({ pathname: "/community-post/[id]", params: { id: r.post_id } })} />
            <Button label="Looks fine" variant="ghost" onPress={() => communityApi.resolveReport(r.kind, r.id).then(setList).catch(() => {})} />
          </View>
        </View>
      ))}
    </View>
  );
}

/* ---------- calendar ---------- */
function EventRow({ e, small, onRemove }: { e: CommunityEvent; small?: boolean; onRemove?: () => void }) {
  const c = useColors();
  const t = parseTime(e.starts_at);
  const [now] = useState(() => Date.now());
  const live = now >= t.getTime() - 10 * 60e3 && now <= t.getTime() + e.minutes * 60e3;
  return (
    <View style={{ flexDirection: "row", gap: space.md, alignItems: "flex-start" }}>
      <View style={{ width: small ? 46 : 58, borderRadius: radius.sm, overflow: "hidden", borderWidth: 1, borderColor: c.line, alignItems: "center" }}>
        <Text style={{ width: "100%", textAlign: "center", backgroundColor: c.brand, color: "#11151B", fontFamily: fonts.bodyBold, fontSize: 11, paddingVertical: 2 }}>{t.toLocaleDateString(undefined, { month: "short" }).toUpperCase()}</Text>
        <Text style={{ fontFamily: fonts.display, fontSize: small ? 20 : 26, color: c.ink, paddingVertical: 2 }}>{t.getDate()}</Text>
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: c.ink }}>{e.title}{live ? "  🔴 Live" : ""}</Text>
        <Text style={[type.small, { color: c.muted }]}>{t.toLocaleDateString(undefined, { weekday: "long" })} · {t.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} · {e.minutes} min</Text>
        {!small && e.details ? <Text style={[type.body, { color: c.muted }]}>{e.details}</Text> : null}
        {!small ? (
          <View style={{ flexDirection: "row", gap: space.sm, marginTop: 4, flexWrap: "wrap" }}>
            {e.link ? <Button label={live ? "Join now" : "Join link"} variant={live ? "primary" : "secondary"} onPress={() => Linking.openURL(e.link!)} /> : <Text style={[type.small, { color: c.muted }]}>Members get the join link.</Text>}
            {onRemove ? <Button label="Remove" variant="danger" onPress={onRemove} /> : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}
function Calendar({ owner }: { owner: boolean; member: boolean }) {
  const c = useColors();
  const [list, setList] = useState<CommunityEvent[] | null>(null);
  const [form, setForm] = useState({ title: "Live coaching", date: "", time: "20:00", minutes: "60", link: "", details: "" });
  const [msg, setMsg] = useState<{ text: string; tone: "ok" | "error" } | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { communityApi.events().then(setList).catch(() => setList([])); }, []);
  const add = async () => {
    // The date and time are in this device's time zone.
    const local = new Date(`${form.date}T${form.time || "00:00"}`);
    if (Number.isNaN(local.getTime())) { setMsg({ text: "Use a date like 2026-11-05 and a time like 20:00.", tone: "error" }); return; }
    setBusy(true); setMsg(null);
    try { setList(await communityApi.addEvent({ title: form.title, details: form.details, starts_at: local.toISOString(), minutes: Number(form.minutes) || 60, link: form.link.trim() || undefined })); setMsg({ text: "Added to the calendar.", tone: "ok" }); }
    catch (e) { setMsg({ text: errText(e, "Couldn't add the event."), tone: "error" }); } finally { setBusy(false); }
  };
  return (
    <View style={{ gap: space.lg }}>
      <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, padding: space.lg, gap: space.lg }}>
        <Text style={[type.title, { color: c.ink, fontSize: 21 }]}>Upcoming</Text>
        {!list ? <ActivityIndicator color={c.accent} /> : list.length ? list.map((e) => <EventRow key={e.id} e={e} onRemove={owner ? () => communityApi.removeEvent(e.id).then(setList).catch(() => {}) : undefined} />)
          : <Text style={[type.body, { color: c.muted }]}>No live calls scheduled yet. Check back soon.</Text>}
      </View>
      {owner ? (
        <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, padding: space.lg, gap: space.md }}>
          <Text style={[type.heading, { color: c.ink }]}>Add an event</Text>
          <Field label="Title" value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} />
          <View style={{ flexDirection: "row", gap: space.sm }}>
            <View style={{ flex: 1 }}><Field label="Date" placeholder="2026-11-05" value={form.date} onChangeText={(v) => setForm({ ...form, date: v })} /></View>
            <View style={{ flex: 1 }}><Field label="Time (your time)" placeholder="20:00" value={form.time} onChangeText={(v) => setForm({ ...form, time: v })} /></View>
            <View style={{ width: 90 }}><Field label="Minutes" keyboardType="number-pad" value={form.minutes} onChangeText={(v) => setForm({ ...form, minutes: v })} /></View>
          </View>
          <Field label="Join link (Zoom, Google Meet, YouTube…)" placeholder="https://" autoCapitalize="none" value={form.link} onChangeText={(v) => setForm({ ...form, link: v })} />
          <Field label="Details (optional)" multiline value={form.details} onChangeText={(v) => setForm({ ...form, details: v })} />
          {msg ? <Notice text={msg.text} tone={msg.tone} /> : null}
          <Button label="Add to calendar" loading={busy} onPress={add} />
        </View>
      ) : null}
    </View>
  );
}

/* ---------- members ---------- */
function Members({ me, onSaved }: { me: CommunityHome["me"]; onSaved: () => void }) {
  const c = useColors();
  const [q, setQ] = useState("");
  const [data, setData] = useState<{ total: number; members: CommunityPerson[] } | null>(null);
  const [name, setName] = useState(me.display_name || me.name);
  const [bio, setBio] = useState(me.bio);
  const [emails, setEmails] = useState(me.email_notes);
  const [msg, setMsg] = useState<{ text: string; tone: "ok" | "error" } | null>(null);
  const [muted, setMuted] = useState<Record<string, boolean>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => communityApi.members(q).then(setData).catch(() => setData({ total: 0, members: [] })), 250);
  }, [q]);
  const save = async () => {
    setMsg(null);
    try { await communityApi.profile({ display_name: name.trim(), bio: bio.trim() }); setMsg({ text: "Saved.", tone: "ok" }); onSaved(); }
    catch (e) { setMsg({ text: errText(e, "Couldn't save."), tone: "error" }); }
  };
  return (
    <View style={{ gap: space.lg }}>
      {me.member ? (
        <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, padding: space.lg, gap: space.md }}>
          <Text style={[type.heading, { color: c.ink }]}>Your profile</Text>
          <Field label="Name people see" value={name} onChangeText={setName} maxLength={40} />
          <Field label="About you (optional)" value={bio} onChangeText={setBio} maxLength={280} placeholder="What you sell and what you're working on" />
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
            <Switch value={emails} accessibilityLabel="Email me about replies and announcements"
              onValueChange={(v) => { setEmails(v); communityApi.profile({ email_notes: v }).catch(() => setEmails(!v)); }} />
            <Text style={[type.small, { color: c.ink, flex: 1 }]}>Email me when someone replies to me, and for Snapfront announcements</Text>
          </View>
          {msg ? <Notice text={msg.text} tone={msg.tone} /> : null}
          <Button label="Save profile" variant="secondary" onPress={save} style={{ alignSelf: "flex-start" }} />
        </View>
      ) : null}
      <Field label={data ? `${data.total} member${data.total === 1 ? "" : "s"}` : "Members"} placeholder="Search by name" value={q} onChangeText={setQ} />
      {!data ? <ActivityIndicator color={c.accent} /> : data.members.map((m) => (
        <View key={m.id} style={{ flexDirection: "row", gap: space.md, alignItems: "center", backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.md, padding: space.md }}>
          <Avatar person={m} size={44} />
          <View style={{ flex: 1, gap: 2 }}>
            <NameLine person={m} extra={`Level ${m.level} · ${m.level_name}`} />
            {m.bio ? <Text style={[type.small, { color: c.muted }]} numberOfLines={2}>{m.bio}</Text> : null}
          </View>
          {m.store_url ? <Button label="Store" variant="ghost" onPress={() => Linking.openURL(m.store_url!)} /> : null}
          {me.owner && !m.admin ? <Button label={muted[m.id] ? "Unpause" : "Pause posting"} variant="ghost"
            onPress={() => communityApi.mute(m.id, !muted[m.id]).then((r) => setMuted({ ...muted, [m.id]: r.muted })).catch(() => {})} /> : null}
        </View>
      ))}
    </View>
  );
}

/* ---------- leaderboards ---------- */
function Leaderboard({ home }: { home: CommunityHome }) {
  const c = useColors();
  const [period, setPeriod] = useState<"7d" | "30d" | "all">("30d");
  const [data, setData] = useState<Awaited<ReturnType<typeof communityApi.leaderboard>> | null>(null);
  useEffect(() => { communityApi.leaderboard(period).then(setData).catch(() => {}); }, [period]);
  const medal = ["🥇", "🥈", "🥉"];
  return (
    <View style={{ gap: space.lg }}>
      <LevelCard me={home.me} levels={home.levels} />
      <Segmented value={period} onChange={setPeriod} options={[{ value: "7d", label: "7 days" }, { value: "30d", label: "30 days" }, { value: "all", label: "All time" }]} />
      <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, padding: space.lg, gap: space.md }}>
        <Text style={[type.heading, { color: c.ink }]}>Top members</Text>
        {!data ? <ActivityIndicator color={c.accent} /> : data.leaders.length ? data.leaders.map((l) => (
          <View key={l.person.id} style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
            <Text style={{ width: 28, textAlign: "center", fontFamily: fonts.bodyBold, fontSize: l.rank <= 3 ? 20 : 15, color: c.muted }}>{medal[l.rank - 1] || l.rank}</Text>
            <Avatar person={l.person} size={36} />
            <Text style={{ flex: 1, fontFamily: fonts.bodyBold, fontSize: 15, color: c.ink }} numberOfLines={1}>{l.person.name}</Text>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: c.good }}>+{l.points}</Text>
          </View>
        )) : <Text style={[type.body, { color: c.muted }]}>No points yet in this period. Likes on posts and comments put people here.</Text>}
        {data ? <Text style={[type.small, { color: c.muted }]}>Your points in this period: {data.my_points}</Text> : null}
      </View>
    </View>
  );
}

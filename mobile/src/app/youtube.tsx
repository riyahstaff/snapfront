// YouTube Shorts: a paid add-on ($24.99 a month) that posts the member's finished Snapfront videos
// (faceless videos and avatar videos) straight to their own YouTube channel. Three steps on one
// screen: switch it on, connect the channel, post a video. Subscribing happens on the website; the
// phone app sends people there.
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Body, Button, Field, Notice, Segmented } from "@/components/ui";
import { Card, Toggle } from "@/components/panel";
import { ApiError, youtubeApi, type YoutubeStatus, type YoutubeVideo } from "@/lib/api";
import { radius, space, type, useColors } from "@/lib/theme";

const WEB_APP = "https://app.snapfront.app";
const errText = (e: unknown, f: string) => (e instanceof ApiError ? e.message : f);
type Msg = { text: string; tone: "ok" | "error" | "info" } | null;
const goTo = (url: string) => (Platform.OS === "web" && typeof window !== "undefined" ? window.location.assign(url) : Linking.openURL(url));

export default function YoutubeScreen() {
  const c = useColors();
  const q = useLocalSearchParams<{ checkout?: string; session_id?: string; connected?: string; accountId?: string; error?: string; error_message?: string; source?: string; id?: string }>();
  const [st, setSt] = useState<YoutubeStatus | null>(null);
  const [msg, setMsg] = useState<Msg>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [pick, setPick] = useState<YoutubeVideo | null>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [visibility, setVisibility] = useState<"public" | "unlisted" | "private">("public");
  const [ai, setAi] = useState(false);
  const [kids, setKids] = useState(false);

  const load = useCallback(() => { youtubeApi.status().then(setSt).catch((e) => setMsg({ text: errText(e, "Couldn't load YouTube posting."), tone: "error" })); }, []);
  useFocusEffect(load);
  // Back from Stripe or from connecting the channel.
  useEffect(() => {
    // Deferred a tick so the screen renders first (and the lint rule against setState in effects holds).
    const t = setTimeout(() => {
    // Zernio's return link carries error (and error_message) when connecting failed: check that first.
    if (q.error) setMsg({ text: q.error_message ? `YouTube wasn't connected: ${String(q.error_message).slice(0, 160)}` : "YouTube wasn't connected. Try again, and pick the channel you want to post to.", tone: "error" });
    else if (q.checkout === "done" && q.session_id) {
      setBusy("confirm");
      youtubeApi.confirm(String(q.session_id)).then((s) => { setSt(s); setMsg(s.subscribed ? { text: "YouTube posting is on. Next, connect your channel.", tone: "ok" } : { text: "Payment received. It can take a minute to switch on; reload this page shortly.", tone: "info" }); })
        .catch((e) => setMsg({ text: errText(e, "We couldn't confirm that payment yet. Reload in a minute."), tone: "error" })).finally(() => setBusy(null));
    } else if (q.checkout === "canceled") setMsg({ text: "Checkout canceled. You haven't been charged.", tone: "info" });
    else if (q.connected) {
      setBusy("sync");
      // Zernio can take a few seconds to list a just-connected channel, so check up to 4 times.
      const hint = typeof q.accountId === "string" ? q.accountId : undefined;
      const attempt = async (left: number): Promise<void> => {
        const s = await youtubeApi.sync(hint);
        if (s.connected || left <= 1) {
          setSt(s);
          const seen = s.diagnostic ? ` (Zernio listed ${s.diagnostic.listed} account(s), ${s.diagnostic.youtube} YouTube, ${s.diagnostic.onThisProfile} on your profile.)` : "";
          setMsg(s.connected ? { text: `Connected to ${s.connected.username}.`, tone: "ok" } : { text: `We couldn't see your channel yet. Tap Connect your channel again.${seen}`, tone: "error" });
          return;
        }
        await new Promise((r) => setTimeout(r, 2500));
        return attempt(left - 1);
      };
      attempt(4).catch((e) => setMsg({ text: errText(e, "Couldn't check your channel."), tone: "error" })).finally(() => setBusy(null));
    }
    }, 0);
    return () => clearTimeout(t);
  }, [q.checkout, q.session_id, q.connected, q.accountId, q.error, q.error_message]);
  // Opened from a video ("Post to YouTube Shorts"): pick that video.
  useEffect(() => {
    if (!st || pick) return;
    const v = st.videos.find((x) => x.source === q.source && x.id === q.id) ?? null;
    if (v) choose(v);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the list first arrives
  }, [st]);
  function choose(v: YoutubeVideo) { setPick(v); setTitle(v.title); setDesc(v.description); setAi(v.ai); }

  async function act(key: string, fn: () => Promise<void>, fail: string) {
    setBusy(key); setMsg(null);
    try { await fn(); } catch (e) { setMsg({ text: errText(e, fail), tone: "error" }); } finally { setBusy(null); }
  }
  const subscribe = () => act("checkout", async () => {
    if (Platform.OS !== "web") { await Linking.openURL(`${WEB_APP}/youtube`); return; }
    goTo((await youtubeApi.checkout()).url);
  }, "Couldn't open checkout. You haven't been charged.");
  const connect = () => act("connect", async () => { goTo((await youtubeApi.connect()).url); }, "Couldn't start connecting YouTube.");
  const disconnect = () => act("disconnect", async () => { setSt(await youtubeApi.disconnect()); setMsg({ text: "Channel disconnected.", tone: "ok" }); }, "Couldn't disconnect.");
  const send = () => act("post", async () => {
    if (!pick) return;
    const p = await youtubeApi.post({ source: pick.source, id: pick.id, title: title.trim(), description: desc, visibility, ai, made_for_kids: kids });
    setMsg(p.status === "published" ? { text: "Posted to YouTube.", tone: "ok" } : { text: "Sent. YouTube is processing it; it appears below when it's live.", tone: "ok" });
    setPick(null); load();
  }, "Couldn't post the video.");

  if (!st) return <View style={{ flex: 1, backgroundColor: c.bg, padding: space.xl }}>{msg ? <Notice text={msg.text} tone={msg.tone} /> : <ActivityIndicator color={c.accent} />}</View>;
  const step = (n: number, done: boolean) => (
    <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: done ? c.good : c.sunk }}>
      {done ? <Ionicons name="checkmark" size={16} color={c.bg} /> : <Text style={[type.label, { color: c.ink }]}>{n}</Text>}
    </View>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ padding: space.xl, gap: space.xl, paddingBottom: 64, width: "100%", maxWidth: 760, alignSelf: "center" }} keyboardShouldPersistTaps="handled">
      <View style={{ gap: space.sm }}>
        <Text accessibilityRole="header" style={[type.hero, { color: c.ink }]}>YouTube Shorts</Text>
        <Body muted>Post your Snapfront videos straight to your own YouTube channel. Vertical videos of 3 minutes or less become Shorts.</Body>
      </View>
      <Notice text={busy === "confirm" ? "Checking your payment…" : busy === "sync" ? "Checking your channel…" : msg?.text ?? null} tone={busy === "confirm" || busy === "sync" ? "info" : msg?.tone} />
      {!st.enabled ? <Notice text="YouTube posting is being switched on. Check back soon." /> : null}

      <Card title="Switch it on" right={step(1, st.subscribed)}>
        {st.subscribed ? <Body muted>{st.owner ? "Included for Snapfront's owner." : "YouTube posting is on. Manage or cancel it in Membership, under Manage subscription."}</Body> : (
          <>
            <Text style={{ color: c.ink }}><Text style={[type.hero, { fontSize: 32 }]}>{st.price}</Text><Text style={[type.body, { color: c.muted }]}>  a month, cancel any time</Text></Text>
            <Body muted>{st.member ? "An add-on for members. Billed monthly with Stripe." : "An add-on for Snapfront members. Become a member first."}</Body>
            {st.member ? <Button label={Platform.OS === "web" ? `Add YouTube posting for ${st.price}/month` : "Subscribe on the website"} loading={busy === "checkout"} disabled={!st.enabled || busy !== null} onPress={subscribe} />
              : <Button label="Become a member" variant="secondary" onPress={() => router.push("/plans")} />}
          </>
        )}
      </Card>

      <Card title="Connect your channel" right={step(2, Boolean(st.connected))}>
        {st.connected ? (
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.md, flexWrap: "wrap" }}>
            <Text style={[type.heading, { color: c.ink }]}>{st.connected.username}</Text>
            <Button label="Disconnect" variant="ghost" loading={busy === "disconnect"} disabled={busy !== null} onPress={disconnect} />
          </View>
        ) : (
          <>
            <Body muted>Sign in with the Google account that owns your channel and allow posting. Snapfront only posts the videos you choose.</Body>
            <Button label="Connect your channel" variant={st.subscribed ? "primary" : "secondary"} loading={busy === "connect"} disabled={!st.subscribed || busy !== null} onPress={connect} />
          </>
        )}
      </Card>

      <Card title="Post a video" right={step(3, st.posts.some((p) => p.status === "published"))}>
        {!st.videos.length ? (
          <View style={{ gap: space.sm }}>
            <Body muted>No finished videos yet. Make a faceless video or an avatar video first.</Body>
            <View style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap" }}>
              <Button label="Faceless videos" variant="secondary" onPress={() => router.push("/faceless")} />
              <Button label="AI avatars" variant="secondary" onPress={() => router.push("/avatars")} />
            </View>
          </View>
        ) : (
          <View style={{ gap: space.md }}>
            <View style={{ gap: 8 }}>
              {st.videos.slice(0, 12).map((v) => {
                const on = pick?.source === v.source && pick?.id === v.id;
                return (
                  <Pressable key={`${v.source}-${v.id}`} onPress={() => choose(v)} accessibilityRole="radio" accessibilityState={{ checked: on }}
                    style={{ flexDirection: "row", alignItems: "center", gap: space.md, padding: 12, borderRadius: radius.md, borderWidth: on ? 2 : 1, borderColor: on ? c.accent : c.line, backgroundColor: c.bg }}>
                    <Ionicons name={v.source === "avatar" ? "person-circle-outline" : "videocam-outline"} size={22} color={c.muted} />
                    <View style={{ flex: 1 }}>
                      <Text style={[type.label, { color: c.ink }]} numberOfLines={1}>{v.title}</Text>
                      <Text style={[type.small, { color: c.muted }]}>{v.source === "avatar" ? "Avatar video" : "Faceless video"}{v.seconds ? ` · ${v.seconds}s` : ""}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
            {pick ? (
              <View style={{ gap: space.md }}>
                <Field label="Title (up to 100 characters)" value={title} onChangeText={setTitle} maxLength={100} />
                <Field label="Description" value={desc} onChangeText={setDesc} multiline maxLength={5000} />
                <Segmented value={visibility} onChange={setVisibility} options={[{ value: "public", label: "Public" }, { value: "unlisted", label: "Unlisted" }, { value: "private", label: "Private" }]} />
                <Toggle label="Made with AI" sub={pick.ai ? "Avatar videos are always labelled, as YouTube asks." : "Turn this on if it shows realistic AI-made people, voices or scenes."} value={ai} disabled={pick.ai} onChange={setAi} />
                <Toggle label="Made for kids" sub="Only if the video is aimed at children." value={kids} onChange={setKids} />
                <Button label="Post to YouTube" loading={busy === "post"} disabled={!st.connected || title.trim().length < 3 || busy !== null} onPress={send} />
                {!st.connected ? <Text style={[type.small, { color: c.muted }]}>Connect your channel first.</Text> : null}
              </View>
            ) : <Text style={[type.small, { color: c.muted }]}>Pick a video to post.</Text>}
          </View>
        )}
      </Card>

      {st.posts.length ? (
        <Card title="Posted">
          {st.posts.map((p) => (
            <View key={p.id} style={{ flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: 6 }}>
              <Ionicons name={p.status === "published" ? "checkmark-circle" : p.status === "failed" ? "alert-circle" : "time-outline"} size={20} color={p.status === "failed" ? c.bad : p.status === "published" ? c.good : c.muted} />
              <View style={{ flex: 1 }}>
                <Text style={[type.label, { color: c.ink }]} numberOfLines={1}>{p.title}</Text>
                <Text style={[type.small, { color: c.muted }]} numberOfLines={2}>{p.status === "failed" ? p.error : p.status === "published" ? "Live on YouTube" : "YouTube is processing it"}</Text>
              </View>
              {p.url ? <Button label="Open" variant="ghost" onPress={() => Linking.openURL(p.url!)} /> : null}
            </View>
          ))}
        </Card>
      ) : null}
    </ScrollView>
  );
}

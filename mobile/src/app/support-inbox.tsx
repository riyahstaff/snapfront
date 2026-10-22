// The owner's support inbox: tickets SnapCare passed to the team. Read the conversation, reply (it
// shows in the member's chat and goes to their email), close it, and for bugs either copy a report or
// send it to GitHub, where @claude drafts a fix as a pull request for review. Owner only (the server
// refuses everyone else).
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Body, Button, Field, Notice, Segmented } from "@/components/ui";
import { Card } from "@/components/panel";
import { ApiError, supportApi, type SupportTicket, type SupportTicketRow } from "@/lib/api";
import { radius, space, type, useColors } from "@/lib/theme";

type Status = "open" | "answered" | "closed" | "all";
type Msg = { text: string; tone: "ok" | "error" | "info" } | null;
const errText = (e: unknown, f: string) => (e instanceof ApiError ? e.message : f);
const when = (iso: string) => { const d = new Date(`${iso.replace(" ", "T")}Z`); return Number.isNaN(d.getTime()) ? iso : d.toLocaleString(); };

export default function SupportInboxScreen() {
  const c = useColors();
  const [status, setStatus] = useState<Status>("open");
  const [list, setList] = useState<{ tickets: SupportTicketRow[]; counts: Record<string, number>; github: boolean } | null>(null);
  const [open, setOpen] = useState<SupportTicket | null>(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<Msg>(null);

  const load = useCallback((s: Status) => { supportApi.list(s).then(setList).catch((e) => setMsg({ text: errText(e, "Couldn't load the inbox."), tone: "error" })); }, []);
  useEffect(() => { load(status); }, [status, load]);
  async function act(key: string, fn: () => Promise<void>, fail: string) {
    setBusy(key); setMsg(null);
    try { await fn(); } catch (e) { setMsg({ text: errText(e, fail), tone: "error" }); } finally { setBusy(null); }
  }
  const pick = (id: string) => act("open", async () => { setOpen(await supportApi.get(id)); setReply(""); }, "Couldn't open that ticket.");
  const send = (close: boolean) => act("reply", async () => {
    if (!open) return;
    const t = await supportApi.reply(open.id, reply.trim(), close);
    setOpen(t); setReply(""); load(status);
    setMsg({ text: t.emailed ? "Sent. It's in their SnapCare chat and their email." : "Sent to their SnapCare chat. (Email couldn't be sent.)", tone: "ok" });
  }, "Couldn't send the reply.");
  const copy = async (text: string) => {
    try { if (Platform.OS === "web" && typeof navigator !== "undefined") { await navigator.clipboard.writeText(text); setMsg({ text: "Bug report copied. Paste it into a new GitHub issue.", tone: "ok" }); } }
    catch { setMsg({ text: "Couldn't copy. Select the report text and copy it.", tone: "error" }); }
  };
  const sentryTest = () => act("sentry", async () => { const r = await supportApi.sentryTest(); setMsg({ text: r.message, tone: r.ok ? "ok" : "info" }); }, "Couldn't send the test.");

  if (!list) return <View style={{ flex: 1, backgroundColor: c.bg, padding: space.xl }}>{msg ? <Notice text={msg.text} tone={msg.tone} /> : <ActivityIndicator color={c.accent} />}</View>;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ padding: space.xl, gap: space.lg, paddingBottom: 64, width: "100%", maxWidth: 980, alignSelf: "center" }} keyboardShouldPersistTaps="handled">
      <View style={{ gap: space.sm }}>
        <Text accessibilityRole="header" style={[type.hero, { color: c.ink }]}>Support inbox</Text>
        <Body muted>Conversations SnapCare passed to you. Your reply shows in the member’s chat and goes to their email.</Body>
      </View>
      <Notice text={msg?.text ?? null} tone={msg?.tone} />
      <Segmented value={status} onChange={(s) => { setStatus(s); setOpen(null); }} options={[
        { value: "open", label: `Open${list.counts.open ? ` (${list.counts.open})` : ""}` }, { value: "answered", label: "Answered" }, { value: "closed", label: "Closed" }, { value: "all", label: "All" }]} />

      {open ? (
        <Card title={open.summary} right={<Pressable onPress={() => setOpen(null)} accessibilityRole="button" accessibilityLabel="Back to the list" hitSlop={8}><Ionicons name="close" size={22} color={c.muted} /></Pressable>}>
          <Text style={[type.small, { color: c.muted }]}>{open.kind === "bug" ? "Bug report" : "Needs a person"} from {open.email || "a visitor"}, {when(open.created_at)}. Status: {open.status}.</Text>
          {open.stores.map((s) => <Text key={s.address} style={[type.small, { color: c.accent }]} onPress={() => Linking.openURL(s.address).catch(() => {})}>{s.name}: {s.address}</Text>)}
          <Body>{open.details}</Body>
          {open.errors.length ? (
            <View style={{ gap: 4 }}>
              <Text style={[type.label, { color: c.ink }]}>Server errors on their requests</Text>
              {open.errors.map((e, i) => <Text key={i} style={[type.small, { color: c.muted }]}>{e.route}: {e.message}{e.sentry_id ? ` (Sentry ${e.sentry_id})` : ""}</Text>)}
            </View>
          ) : null}
          <View style={{ gap: 8, padding: space.md, borderRadius: radius.md, backgroundColor: c.sunk }}>
            <Text style={[type.label, { color: c.ink }]}>Conversation</Text>
            {open.messages.map((m) => (
              <Text key={m.id} style={[type.small, { color: m.role === "user" ? c.ink : c.muted }]}>
                <Text style={{ fontWeight: "700" }}>{m.role === "user" ? "Member" : m.role === "team" ? "You" : "SnapCare"}: </Text>{m.content}
              </Text>
            ))}
          </View>
          <Field label="Reply" value={reply} onChangeText={setReply} multiline maxLength={4000} placeholder="Write your answer. It goes to their chat and email." />
          <View style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap" }}>
            <Button label="Send reply" loading={busy === "reply"} disabled={!reply.trim() || busy !== null} onPress={() => send(false)} />
            <Button label="Send and close" variant="secondary" disabled={!reply.trim() || busy !== null} onPress={() => send(true)} />
            {open.status !== "closed"
              ? <Button label="Close without reply" variant="ghost" disabled={busy !== null} onPress={() => act("close", async () => { setOpen(await supportApi.setStatus(open.id, "closed")); load(status); }, "Couldn't close it.")} />
              : <Button label="Reopen" variant="ghost" disabled={busy !== null} onPress={() => act("close", async () => { setOpen(await supportApi.setStatus(open.id, "open")); load(status); }, "Couldn't reopen it.")} />}
          </View>
          {open.kind === "bug" ? (
            <View style={{ gap: space.sm, paddingTop: space.sm, borderTopWidth: 1, borderColor: c.line }}>
              <Text style={[type.label, { color: c.ink }]}>Fix it with Claude on GitHub</Text>
              <Text style={[type.small, { color: c.muted }]}>Personal details are removed: your repository is public. The report asks @claude to find the cause and open a pull request, which you review and merge yourself.</Text>
              <Text selectable style={[type.small, { color: c.ink, padding: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: c.line }]}>{open.bug_report}</Text>
              <View style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap" }}>
                {open.github_url ? <Button label="Open the GitHub issue" variant="secondary" onPress={() => Linking.openURL(open.github_url!).catch(() => {})} />
                  : list.github ? <Button label="Send to GitHub" loading={busy === "github"} disabled={busy !== null} onPress={() => act("github", async () => { setOpen(await supportApi.github(open.id)); load(status); setMsg({ text: "Issue created on GitHub.", tone: "ok" }); }, "Couldn't create the issue.")} /> : null}
                {Platform.OS === "web" ? <Button label="Copy bug report" variant="ghost" onPress={() => copy(open.bug_report)} /> : null}
              </View>
            </View>
          ) : null}
        </Card>
      ) : (
        <View style={{ gap: 8 }}>
          {!list.tickets.length ? <Body muted>Nothing here. SnapCare is handling everything else on its own.</Body> : null}
          {list.tickets.map((t) => (
            <Pressable key={t.id} onPress={() => pick(t.id)} accessibilityRole="button"
              style={{ flexDirection: "row", alignItems: "center", gap: space.md, padding: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface }}>
              <Ionicons name={t.kind === "bug" ? "bug-outline" : "person-outline"} size={20} color={t.kind === "bug" ? c.bad : c.muted} />
              <View style={{ flex: 1 }}>
                <Text style={[type.label, { color: c.ink }]} numberOfLines={1}>{t.summary}</Text>
                <Text style={[type.small, { color: c.muted }]}>{t.email || "a visitor"}, {when(t.created_at)}{t.github_url ? ", on GitHub" : ""}</Text>
              </View>
              <Text style={[type.small, { color: c.muted }]}>{t.status}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <Card title="Error monitoring (Sentry)">
        <Body muted>Send one test error to check Sentry is connected. It shows in Sentry under Issues within a minute.</Body>
        <Button label="Send a test error" variant="secondary" loading={busy === "sentry"} disabled={busy !== null} onPress={sentryTest} />
      </Card>
    </ScrollView>
  );
}

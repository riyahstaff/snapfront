// SnapCare: the support chat. Used in the Help panel on every web page and on the Support screen in the
// phone app. Members type what's wrong; SnapCare checks their account, fixes what it can, and says what
// it did. Anything it can't fix goes to the Snapfront team, whose replies show here too.
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ApiError, snapcareApi, type CareChat, type CareMessage } from "@/lib/api";
import { fonts, radius, space, type, useColors } from "@/lib/theme";

const SUGGESTIONS = ["My avatar video seems stuck", "A buyer didn't get their download", "I paid but my plan didn't change", "How do I post to YouTube Shorts?"];
const URL_RE = /(https?:\/\/[^\s)]+)/;

/** Plain text with working links and **bold** (SnapCare bolds button and page names). */
function Linked({ text, color }: { text: string; color: string }) {
  const c = useColors();
  const parts = text.replace(/^#{1,6}\s+/gm, "").split(URL_RE);
  return (
    <Text style={[type.body, { color, lineHeight: 22 }]} selectable>
      {/* split() with a capture group puts each link at an odd index */}
      {parts.map((p, i) => (i % 2 === 1
        ? <Text key={i} style={{ color: c.accent, textDecorationLine: "underline" }} onPress={() => Linking.openURL(p).catch(() => {})}>{p}</Text>
        : p.split(/\*\*(.+?)\*\*/g).map((q, j) => (j % 2 === 1 ? <Text key={`${i}-${j}`} style={{ fontFamily: fonts.bodyBold }}>{q}</Text> : <Text key={`${i}-${j}`}>{q}</Text>))))}
    </Text>
  );
}

function Bubble({ m }: { m: CareMessage }) {
  const c = useColors();
  const mine = m.role === "user", team = m.role === "team";
  return (
    <View style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "88%", gap: 6 }}>
      {team ? <Text style={[type.small, { color: c.good, fontFamily: fonts.bodyBold }]}>Snapfront team</Text> : null}
      <View style={{ backgroundColor: mine ? c.accent : c.surface, borderWidth: mine ? 0 : 1, borderColor: team ? c.good : c.line, borderRadius: radius.lg, borderBottomRightRadius: mine ? 6 : radius.lg, borderBottomLeftRadius: mine ? radius.lg : 6, paddingVertical: 10, paddingHorizontal: 14 }}>
        <Linked text={m.content} color={mine ? c.onAccent : c.ink} />
      </View>
      {m.actions.length ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {m.actions.map((a) => (
            <View key={a} style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 3, paddingHorizontal: 8, borderRadius: radius.pill, backgroundColor: c.sunk }}>
              <Ionicons name="checkmark-circle" size={13} color={c.good} />
              <Text style={[type.small, { color: c.muted, fontSize: 12 }]}>{a}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function SnapCareChat({ onClose }: { onClose?: () => void }) {
  const c = useColors();
  const [chat, setChat] = useState<CareChat | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const scroller = useRef<ScrollView>(null);

  const load = useCallback(() => { snapcareApi.view().then(setChat).catch((e) => setError(e instanceof ApiError ? e.message : "Couldn't open SnapCare. Check your connection.")); }, []);
  useEffect(load, [load]);
  // While the team has the conversation, check for their reply now and then.
  useEffect(() => {
    if (chat?.status !== "handed_off") return;
    const t = setInterval(() => { snapcareApi.view().then((v) => setChat((cur) => (cur && v.messages.length !== cur.messages.length ? v : cur))).catch(() => {}); }, 30_000);
    return () => clearInterval(t);
  }, [chat?.status]);
  useEffect(() => { setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 50); }, [chat?.messages.length, pending]);

  async function send(msg = text) {
    const m = msg.trim();
    if (!m || !chat || pending) return;
    setPending(m); setText(""); setError(null);
    try { setChat(await snapcareApi.send(chat.id, m)); }
    catch (e) { setError(e instanceof ApiError ? e.message : "SnapCare couldn't answer just now. Try again."); setText(m); }
    finally { setPending(null); }
  }
  async function fresh() {
    setError(null);
    try { setChat(await snapcareApi.fresh()); } catch (e) { setError(e instanceof ApiError ? e.message : "Couldn't start a new conversation."); }
  }

  const empty = chat && !chat.messages.length && !pending;
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, paddingHorizontal: space.lg, paddingVertical: space.md, borderBottomWidth: 1, borderColor: c.line }}>
        <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: c.accent, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="chatbubbles" size={18} color={c.onAccent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[type.label, { color: c.ink }]}>SnapCare</Text>
          <Text style={[type.small, { color: c.muted }]}>Snapfront support. Checks your account and fixes what it can.</Text>
        </View>
        {chat?.messages.length ? (
          <Pressable onPress={fresh} accessibilityRole="button" accessibilityLabel="Start a new conversation" hitSlop={8} style={{ padding: 6 }}>
            <Ionicons name="create-outline" size={20} color={c.muted} />
          </Pressable>
        ) : null}
        {onClose ? (
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close support chat" hitSlop={8} style={{ padding: 6 }}>
            <Ionicons name="close" size={22} color={c.muted} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView ref={scroller} style={{ flex: 1 }} contentContainerStyle={{ padding: space.lg, gap: space.md }} keyboardShouldPersistTaps="handled">
        {!chat && !error ? <ActivityIndicator color={c.accent} style={{ marginTop: space.xl }} /> : null}
        {chat ? <Bubble m={{ id: 0, role: "assistant", content: chat.greeting, actions: [], created_at: "" }} /> : null}
        {empty ? (
          <View style={{ gap: 8, marginTop: 4 }}>
            {SUGGESTIONS.map((s) => (
              <Pressable key={s} onPress={() => send(s)} accessibilityRole="button" style={{ alignSelf: "flex-start", paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius.md, borderWidth: 1, borderColor: c.line }}>
                <Text style={[type.small, { color: c.ink }]}>{s}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        {chat?.messages.map((m) => <Bubble key={m.id} m={m} />)}
        {pending ? (
          <>
            <Bubble m={{ id: -1, role: "user", content: pending, actions: [], created_at: "" }} />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <ActivityIndicator size="small" color={c.accent} />
              <Text style={[type.small, { color: c.muted }]}>SnapCare is checking…</Text>
            </View>
          </>
        ) : null}
        {chat?.status === "handed_off" ? (
          <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-start", padding: space.md, borderRadius: radius.md, backgroundColor: c.sunk }}>
            <Ionicons name="people-outline" size={18} color={c.muted} />
            <Text style={[type.small, { color: c.muted, flex: 1 }]}>The Snapfront team has this conversation. They’ll reply by email and right here. You can keep chatting with SnapCare meanwhile.</Text>
          </View>
        ) : null}
        {chat && !chat.enabled ? <Text style={[type.small, { color: c.muted }]}>SnapCare isn’t switched on yet. Email support@snapfront.app.</Text> : null}
        {error ? <Text style={[type.small, { color: c.bad }]}>{error}</Text> : null}
      </ScrollView>

      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: space.sm, padding: space.md, borderTopWidth: 1, borderColor: c.line }}>
        <TextInput value={text} onChangeText={setText} placeholder="Describe the problem or ask a question" placeholderTextColor={c.muted} multiline maxLength={2000}
          accessibilityLabel="Message SnapCare" editable={Boolean(chat?.enabled)}
          onKeyPress={Platform.OS === "web" ? (e) => { const n = e.nativeEvent as unknown as { key: string; shiftKey?: boolean }; if (n.key === "Enter" && !n.shiftKey) { (e as unknown as { preventDefault?: () => void }).preventDefault?.(); send(); } } : undefined}
          style={{ flex: 1, minHeight: 44, maxHeight: 140, borderWidth: 1, borderColor: c.line, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, color: c.ink, fontFamily: fonts.body, fontSize: 15, backgroundColor: c.surface }} />
        <Pressable onPress={() => send()} disabled={!text.trim() || Boolean(pending) || !chat?.enabled} accessibilityRole="button" accessibilityLabel="Send"
          style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: text.trim() && !pending ? c.accent : c.sunk }}>
          <Ionicons name="arrow-up" size={20} color={text.trim() && !pending ? c.onAccent : c.muted} />
        </Pressable>
      </View>
    </View>
  );
}

import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { assistant, useAssistant, type Turn } from "@/lib/assistant-store";
import { money } from "@/lib/api";
import { useMe } from "@/lib/account-store";
import { fonts, radius, space, type, useColors } from "@/lib/theme";

const SUGGESTIONS = [
  "What should I sell this month?",
  "Make a holiday gift guide for dog owners and price it at $9",
  "Write 5 TikTok hooks for my best product",
  "Create a 15% off code called WELCOME15",
];

export default function AssistantScreen() {
  const c = useColors();
  const { turns, busy } = useAssistant();
  const me = useMe();
  const locked = me != null && me.account.plan !== "pro";
  const [text, setText] = useState("");
  const scroll = useRef<ScrollView>(null);

  useEffect(() => { const t = setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50); return () => clearTimeout(t); }, [turns]);

  const send = (msg: string) => { if (!msg.trim() || busy) return; setText(""); assistant.send(msg); };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <ScrollView ref={scroll} contentContainerStyle={{ padding: space.lg, gap: space.lg, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {locked && turns.length === 0 ? (
          <View style={{ gap: space.lg, flex: 1, justifyContent: "flex-end" }}>
            <View style={{ gap: space.sm }}>
              <Text style={[type.hero, { color: c.ink }]}>Your store,{"\n"}on autopilot.</Text>
              <Text style={[type.body, { color: c.muted }]}>
                With Pro, the store assistant researches what’s selling, writes and designs digital products, sets prices, stock and sizes, creates discount codes and checks your orders. You just ask.
              </Text>
            </View>
            <View style={{ gap: space.sm }}>
              {SUGGESTIONS.map((s) => (
                <View key={s} style={{ borderColor: c.line, borderWidth: 1, borderStyle: "dashed", borderRadius: radius.md, padding: space.md }}>
                  <Text style={[type.body, { color: c.muted }]}>“{s}”</Text>
                </View>
              ))}
            </View>
            <Pressable onPress={() => router.push("/plans")} accessibilityRole="button"
              style={({ pressed }) => ({ backgroundColor: c.accent, borderRadius: radius.pill, minHeight: 52, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.85 : 1 })}>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: c.onAccent }}>Get Pro to use the assistant</Text>
            </Pressable>
          </View>
        ) : turns.length === 0 ? (
          <View style={{ gap: space.lg, flex: 1, justifyContent: "flex-end" }}>
            <View style={{ gap: space.sm }}>
              <Text style={[type.hero, { color: c.ink }]}>Tell me what{"\n"}to make.</Text>
              <Text style={[type.body, { color: c.muted }]}>
                I can research what’s selling, write and design digital products, edit listings, set prices, stock and sizes, create discount codes and check your orders. Just ask.
              </Text>
            </View>
            <View style={{ gap: space.sm }}>
              {SUGGESTIONS.map((s) => (
                <Pressable key={s} onPress={() => send(s)} accessibilityRole="button"
                  style={({ pressed }) => ({ backgroundColor: c.surface, borderColor: c.line, borderWidth: 1, borderRadius: radius.md, padding: space.md, opacity: pressed ? 0.85 : 1 })}>
                  <Text style={[type.body, { color: c.ink }]}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : turns.map((t) => <Bubble key={t.id} turn={t} />)}
      </ScrollView>

      {locked ? null : <View style={{ flexDirection: "row", alignItems: "flex-end", gap: space.sm, padding: space.md, borderTopWidth: 1, borderColor: c.line, backgroundColor: c.surface }}>
        <TextInput
          value={text} onChangeText={setText} placeholder={busy ? "Working on it…" : "Ask your store assistant"} placeholderTextColor={c.muted}
          multiline editable={!busy} accessibilityLabel="Message"
          style={{ flex: 1, maxHeight: 120, minHeight: 44, borderWidth: 1, borderColor: c.line, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: 10, color: c.ink, backgroundColor: c.bg, fontFamily: fonts.body, fontSize: 16 }}
        />
        <Pressable onPress={() => send(text)} disabled={busy || !text.trim()} accessibilityRole="button" accessibilityLabel="Send"
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.accent, alignItems: "center", justifyContent: "center", opacity: busy || !text.trim() ? 0.5 : 1 }}>
          {busy ? <ActivityIndicator color={c.onAccent} /> : <Ionicons name="arrow-up" size={22} color={c.onAccent} />}
        </Pressable>
      </View>}
    </KeyboardAvoidingView>
  );
}

function Bubble({ turn }: { turn: Turn }) {
  const c = useColors();
  if (turn.role === "user") {
    return (
      <View style={{ alignSelf: "flex-end", maxWidth: "85%", backgroundColor: c.accent, borderRadius: radius.lg, borderBottomRightRadius: 4, paddingHorizontal: space.md, paddingVertical: 10 }}>
        <Text style={[type.body, { color: c.onAccent }]}>{turn.text}</Text>
      </View>
    );
  }
  const working = turn.status === "working";
  return (
    <View style={{ alignSelf: "stretch", gap: space.sm }}>
      {turn.steps?.length || working ? (
        <View style={{ gap: 6 }} accessibilityLiveRegion="polite">
          {turn.steps?.map((s, i) => (
            <View key={i} style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <Ionicons name={s.failed ? "alert-circle" : "checkmark-circle"} size={16} color={s.failed ? c.bad : c.good} />
              <Text style={[type.small, { color: s.failed ? c.bad : c.muted, flex: 1 }]}>{s.label}</Text>
            </View>
          ))}
          {working ? (
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <ActivityIndicator size="small" color={c.accent} />
              <Text style={[type.small, { color: c.muted }]}>{turn.steps?.length ? "Working…" : "Thinking it through…"}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {turn.products?.map((p) => (
        <Pressable key={p.id} onPress={() => router.push({ pathname: "/product/[id]", params: { id: p.id } })} accessibilityRole="button" accessibilityLabel={`Open ${p.title}`}
          style={{ flexDirection: "row", alignItems: "center", gap: space.md, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.md, padding: space.md }}>
          <View style={{ backgroundColor: c.flash, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 15, color: c.onFlash }}>{money(p.price)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={[type.label, { color: c.ink }]}>{p.title}</Text>
            <Text style={[type.small, { color: p.status === "live" ? c.good : c.muted }]}>{p.status === "live" ? "Live" : "Draft"}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={c.muted} />
        </Pressable>
      ))}

      {turn.text ? (
        <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: turn.status === "error" ? c.bad : c.line, borderRadius: radius.lg, borderBottomLeftRadius: 4, padding: space.md }}>
          <Text selectable style={[type.body, { color: turn.status === "error" ? c.bad : c.ink }]}>{turn.text}</Text>
        </View>
      ) : null}
    </View>
  );
}

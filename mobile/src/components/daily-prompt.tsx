// Today's post: one ready-to-film idea for the store, fresh every day.
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { academy, ApiError, type DailyPrompt } from "@/lib/api";
import { fonts, radius, space, type, useColors } from "@/lib/theme";

export function DailyPromptCard() {
  const c = useColors();
  const [d, setD] = useState<DailyPrompt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => { academy.daily().then(setD).catch((e) => setError(e instanceof ApiError ? e.message : "Couldn't load today's idea.")); }, []);
  async function another() {
    setBusy(true);
    try { setD(await academy.daily(true)); setError(null); } catch (e) { setError(e instanceof ApiError ? e.message : "Couldn't get another idea."); } finally { setBusy(false); }
  }
  return (
    <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, padding: space.lg, gap: space.md }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Ionicons name="sunny-outline" size={20} color={c.accent} />
        <Text accessibilityRole="header" style={[type.heading, { color: c.ink, flex: 1 }]}>Today&apos;s post{d ? `: ${d.kind_name}` : ""}</Text>
        {d && d.more_left > 0 ? (
          <Pressable onPress={another} disabled={busy} accessibilityRole="button" hitSlop={8}>
            {busy ? <ActivityIndicator color={c.accent} /> : <Text style={[type.label, { color: c.accent }]}>Another idea</Text>}
          </Pressable>
        ) : null}
      </View>
      {!d ? (error ? <Text style={[type.small, { color: c.muted }]}>{error}</Text> : <ActivityIndicator color={c.accent} />) : (
        <>
          <Text style={{ fontFamily: fonts.display, fontSize: 22, lineHeight: 27, color: c.ink }}>“{d.hook}”</Text>
          <View style={{ gap: 6 }}>
            {d.film.map((f, i) => (
              <View key={i} style={{ flexDirection: "row", gap: 10 }}>
                <Text style={[type.label, { color: c.muted, width: 16 }]}>{i + 1}</Text>
                <Text style={[type.body, { color: c.ink, flex: 1 }]}>{f}</Text>
              </View>
            ))}
          </View>
          {d.on_screen ? <Text style={[type.small, { color: c.muted }]}>On screen: {d.on_screen}</Text> : null}
          <View style={{ flexDirection: "row", gap: space.xl, flexWrap: "wrap" }}>
            <Pressable accessibilityRole="button" onPress={async () => { await Clipboard.setStringAsync(`${d.caption}\n\n${d.hashtags.map((h) => `#${h}`).join(" ")}`).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
              <Text style={[type.label, { color: c.accent }]}>{copied ? "Caption copied" : "Copy the caption"}</Text>
            </Pressable>
            {d.kind === "faceless" ? <Pressable accessibilityRole="button" onPress={() => router.push("/faceless")}><Text style={[type.label, { color: c.accent }]}>Make it faceless</Text></Pressable> : null}
            {d.kind === "live" ? <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/lesson/[id]", params: { id: "tiktok-live" } })}><Text style={[type.label, { color: c.accent }]}>How to go live</Text></Pressable> : null}
          </View>
        </>
      )}
    </View>
  );
}

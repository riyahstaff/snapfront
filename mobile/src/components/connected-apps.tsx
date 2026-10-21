// Settings: AI assistants (Claude, ChatGPT) connected to this account through Snapfront's connector,
// with the connector link to copy, the guide, and a way to disconnect each one.
import React, { useCallback, useState } from "react";
import { View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Clipboard from "expo-clipboard";
import { Body, Button, H2, Notice } from "@/components/ui";
import { api, ApiError, type ConnectedApps } from "@/lib/api";
import { space } from "@/lib/theme";

const day = (iso: string | null) => {
  if (!iso) return null;
  const d = new Date(`${iso.replace(" ", "T")}Z`);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

export function ConnectedAppsSection() {
  const [data, setData] = useState<ConnectedApps | null>(null);
  const [msg, setMsg] = useState<{ text: string; tone: "error" | "ok" | "info" } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(() => { api.connectedApps().then(setData).catch(() => setData(null)); }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const url = data?.connector_url ?? "https://snapfront.app/mcp";

  return (
    <View style={{ gap: space.sm }}>
      <H2>Connected AI apps</H2>
      <Body muted>Connect Snapfront to Claude or ChatGPT so your own assistant can check your store, try new designs, write product pages and make faceless videos.</Body>
      {data?.apps.length ? data.apps.map((a) => (
        <View key={a.id} style={{ gap: 4 }}>
          <Body>{a.name}{a.site ? ` · ${a.site}` : ""}</Body>
          <Body muted>Connected {day(a.connected_at) ?? ""}{a.last_used_at ? `. Last used ${day(a.last_used_at)}` : ". Not used yet"}.</Body>
          <Button label={`Disconnect ${a.name}`} variant="ghost" loading={busy === a.id} onPress={async () => {
            setBusy(a.id); setMsg(null);
            try { await api.disconnectApp(a.id); setMsg({ text: `${a.name} is disconnected. It can't reach your store anymore.`, tone: "ok" }); load(); }
            catch (e) { setMsg({ text: e instanceof ApiError ? e.message : "Couldn't disconnect. Try again.", tone: "error" }); }
            finally { setBusy(null); }
          }} />
        </View>
      )) : <Body muted>No AI apps are connected yet.</Body>}
      <Button label="Copy the connector link" variant="secondary" onPress={async () => {
        try { await Clipboard.setStringAsync(url); setMsg({ text: `Copied ${url}. Paste it as a custom connector in Claude or ChatGPT.`, tone: "ok" }); }
        catch { setMsg({ text: url, tone: "info" }); }
      }} />
      <Button label="How to connect Claude or ChatGPT" variant="ghost" onPress={() => WebBrowser.openBrowserAsync(api.siteUrl("connect-ai"))} />
      <Button label="Bonus: 1k Prompts for Claude and ChatGPT" variant="ghost" onPress={() => router.push("/prompts")} />
      <Button label="Tools that work with Snapfront" variant="ghost" onPress={() => WebBrowser.openBrowserAsync(api.siteUrl("tools"))} />
      <Notice text={msg?.text ?? null} tone={msg?.tone} />
    </View>
  );
}

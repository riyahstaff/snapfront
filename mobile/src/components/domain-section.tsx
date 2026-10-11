import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import * as Clipboard from "expo-clipboard";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { Body, Button, Field, H2, Notice } from "@/components/ui";
import { api, ApiError, type DomainView } from "@/lib/api";
import { account, useMe } from "@/lib/account-store";
import { radius, space, type, useColors } from "@/lib/theme";

/** Pro: put the store on a domain the seller owns, like shop.pawplace.com. */
export function DomainSection() {
  const c = useColors();
  const me = useMe();
  const [d, setD] = useState<DomainView | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; tone: "error" | "ok" | "info" } | null>(null);
  const pro = me?.account.plan === "pro";

  useEffect(() => { api.domain().then(setD).catch(() => {}); }, [me?.id]);

  async function run(label: string, fn: () => Promise<DomainView>, ok?: (v: DomainView) => string | null) {
    setBusy(label); setMsg(null);
    try {
      const v = await fn();
      setD(v);
      await account.refresh();
      const text = ok?.(v);
      if (text) setMsg({ text, tone: "ok" });
    } catch (e) {
      if (!(e instanceof ApiError && e.upgrade)) setMsg({ text: e instanceof ApiError ? e.message : "Couldn’t update your domain.", tone: "error" });
    } finally { setBusy(null); }
  }

  if (!d || !d.enabled) return null;
  return (
    <View style={{ gap: space.md }}>
      <H2>Your own domain</H2>
      {!pro && !d.domain ? (
        <>
          <Body muted>Put your store on a domain you own, like shop.yourstore.com. It comes with Pro.</Body>
          <Button label="See Pro" variant="secondary" onPress={() => router.push({ pathname: "/plans", params: { highlight: "pro" } })} />
        </>
      ) : !d.domain ? (
        <>
          <Body muted>Use a domain you own instead of {me?.store_url.replace(/^https?:\/\//, "")}. Buy one from any domain company (Namecheap, GoDaddy, Porkbun…), then type the address you want buyers to use.</Body>
          <Field label="Domain" value={input} onChangeText={setInput} placeholder="shop.yourstore.com" autoCapitalize="none" autoCorrect={false} keyboardType="url"
            hint="Use a subdomain like shop. or www. in front of your domain." />
          <Button label="Connect domain" loading={busy === "add"} disabled={input.trim().length < 4} onPress={() => run("add", () => api.setDomain(input.trim()), () => "Now add the record below at your domain company.")} />
        </>
      ) : (
        <>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
            <Ionicons name={d.status === "active" ? "checkmark-circle" : d.status === "failed" ? "alert-circle" : "time-outline"} size={20}
              color={d.status === "active" ? c.good : d.status === "failed" ? c.bad : c.muted} />
            <Text style={[type.heading, { color: c.ink, flex: 1 }]} numberOfLines={1}>{d.domain}</Text>
          </View>
          {d.status === "active" ? (
            <>
              <Body muted>Your store is live on your domain. Your snapfront.app address forwards here.{pro ? "" : " Your domain is paused because Pro has ended; buyers are sent to your snapfront.app address."}</Body>
              <Button label="Open your store" variant="secondary" onPress={() => d.url && WebBrowser.openBrowserAsync(d.url)} />
            </>
          ) : (
            <>
              <Body muted>{d.status === "failed" ? "Cloudflare couldn’t secure this domain. Check the record below is exactly right, then tap Check now." : "Add this record at your domain company. It usually starts working within an hour; we check every 10 minutes."}</Body>
              {d.record ? <RecordCard type_={d.record.type} host={d.record.host} value={d.record.value} /> : null}
              <Text style={[type.small, { color: c.muted }]}>In Namecheap: Domain List → Manage → Advanced DNS → Add New Record. In GoDaddy: My Products → DNS → Add.</Text>
              <Button label="Check now" variant="secondary" loading={busy === "check"} onPress={() => run("check", api.refreshDomain, (v) => (v.status === "active" ? "Your domain is live." : "Not live yet. DNS changes can take up to an hour."))} />
            </>
          )}
          <Button label="Remove domain" variant="ghost" loading={busy === "remove"} onPress={() => run("remove", api.removeDomain, () => "Domain removed. Your store is back on its snapfront.app address.")} />
        </>
      )}
      <Notice text={msg?.text ?? null} tone={msg?.tone} />
    </View>
  );
}

function RecordCard({ type_, host, value }: { type_: string; host: string; value: string }) {
  const c = useColors();
  const [copied, setCopied] = useState<string | null>(null);
  const row = (label: string, v: string) => (
    <Pressable onPress={async () => { await Clipboard.setStringAsync(v); setCopied(label); }} accessibilityRole="button" accessibilityLabel={`Copy ${label}: ${v}`}
      style={{ flexDirection: "row", alignItems: "center", gap: space.sm, paddingVertical: 6 }}>
      <Text style={[type.small, { color: c.muted, width: 52 }]}>{label}</Text>
      <Text selectable style={[type.label, { color: c.ink, flex: 1 }]}>{v}</Text>
      <Ionicons name={copied === label ? "checkmark" : "copy-outline"} size={16} color={copied === label ? c.good : c.accent} />
    </Pressable>
  );
  return (
    <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: space.sm }}>
      {row("Type", type_)}
      {row("Host", host)}
      {row("Value", value)}
    </View>
  );
}

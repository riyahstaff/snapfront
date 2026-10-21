import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Body, Button, ButtonRow, Field, Notice, PageScroll } from "@/components/ui";
import { api, ApiError, type LibraryPrompt, type Product } from "@/lib/api";
import { useMe } from "@/lib/account-store";
import { ASSISTANTS, asksForProduct, blanksIn, cachedPrompts, copyPrompt, fillBlanks, loadPrompts, sendTo, suggestFor, type Assistant } from "@/lib/prompts";
import { fonts, radius, space, type, useColors } from "@/lib/theme";

/** One prompt: fill in its blanks, then open it in Claude or ChatGPT (or copy it). */
export default function PromptScreen() {
  const c = useColors();
  const me = useMe();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [p, setP] = useState<LibraryPrompt | null>(() => cachedPrompts()?.prompts.find((x) => x.id === id) ?? null);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [msg, setMsg] = useState<{ text: string; tone: "ok" | "error" | "info" } | null>(null);

  useEffect(() => {
    if (p) return;
    let active = true;
    loadPrompts().then((lib) => {
      if (!active) return;
      const found = lib.prompts.find((x) => x.id === id);
      if (found) setP(found); else setError("That prompt isn't in the library anymore. Go back to pick another.");
    }).catch((e) => { if (active) setError(e instanceof ApiError ? e.message : "Couldn't load the prompt. Try again."); });
    return () => { active = false; };
  }, [id, p]);

  const blanks = useMemo(() => (p ? blanksIn(p.prompt) : []), [p]);
  const wantsProduct = blanks.some(asksForProduct);
  useEffect(() => {
    if (!wantsProduct || !me?.id) return;
    let active = true;
    api.products(me.id).then((list) => { if (active) setProducts(list); }).catch(() => {});
    return () => { active = false; };
  }, [wantsProduct, me?.id]);
  // Start the store's name in blanks that ask for it; anything the seller types wins.
  const filled = useMemo(() => {
    const start: Record<string, string> = {};
    for (const b of blanks) start[b] = values[b] ?? suggestFor(b, { name: me?.store_name });
    return start;
  }, [blanks, values, me?.store_name]);
  const text = p ? fillBlanks(p.prompt, filled) : "";
  const left = blanks.filter((b) => !(filled[b] || "").trim()).length;

  async function send(to: Assistant) {
    try {
      await sendTo(to, text);
      setMsg({ text: `Opening ${ASSISTANTS[to].name} with your prompt typed in. It's also copied, so if the message box is empty, paste it there.`, tone: "ok" });
    } catch {
      const ok = await copyPrompt(text);
      setMsg({ text: ok ? `Couldn't open ${ASSISTANTS[to].name}. The prompt is copied: open ${ASSISTANTS[to].name} and paste it into a new chat.` : `Couldn't open ${ASSISTANTS[to].name}. Select the prompt below and copy it.`, tone: "error" });
    }
  }

  if (!p) return (
    <PageScroll style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ padding: space.xl, gap: space.lg }}>
      {error ? <><Notice text={error} tone="error" /><Button label="Back to the prompts" variant="secondary" onPress={() => router.replace("/prompts")} /></> : <ActivityIndicator color={c.accent} />}
    </PageScroll>
  );

  return (
    <PageScroll style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ padding: space.xl, gap: space.lg, paddingBottom: 64 }} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: p.title }} />
      <View style={{ gap: space.sm }}>
        {p.for ? <Text style={[type.small, { color: c.muted }]}>For {p.for}</Text> : null}
        {p.snapfront ? (
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: space.sm, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.md, padding: space.md }}>
            <Ionicons name="link-outline" size={18} color={c.good} />
            <Text style={[type.small, { color: c.ink, flex: 1 }]}>Uses Snapfront: in a Claude or ChatGPT chat with the Snapfront connector turned on, your assistant can read and update your store. It shows you changes and waits for your OK first.</Text>
          </View>
        ) : null}
      </View>

      {blanks.length ? (
        <View style={{ gap: space.md }}>
          <View style={{ gap: 4 }}>
            <Text style={[type.heading, { color: c.ink }]}>Fill in your details</Text>
            <Body muted>Each one replaces a blank in the prompt. Leave any you’re not sure about and your assistant will ask.</Body>
          </View>
          {blanks.map((b) => (
            <View key={b} style={{ gap: space.sm }}>
              <Field label={b.charAt(0) + b.slice(1).toLowerCase()} value={filled[b] ?? ""} onChangeText={(v) => setValues((s) => ({ ...s, [b]: v }))}
                placeholder="Type it here" autoCorrect={false} multiline={/PASTE|LIST|DESCRIBE|DETAILS|SAMPLES|NOTES|STATS/.test(b)} />
              {asksForProduct(b) && products.length ? (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
                  {products.slice(0, 8).map((pr) => (
                    <Pressable key={pr.id} onPress={() => setValues((s) => ({ ...s, [b]: pr.title }))} accessibilityRole="button" accessibilityLabel={`Use ${pr.title}`}
                      style={{ backgroundColor: c.sunk, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7, maxWidth: 260 }}>
                      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: c.ink }} numberOfLines={1}>{pr.title}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      <View style={{ gap: space.sm }}>
        <Text style={[type.heading, { color: c.ink }]}>Send it to your assistant</Text>
        <ButtonRow>
          <Button label="Open in Claude" onPress={() => send("claude")} />
          <Button label="Open in ChatGPT" variant="secondary" onPress={() => send("chatgpt")} />
        </ButtonRow>
        <Button label="Copy prompt" variant="ghost" onPress={async () => setMsg(await copyPrompt(text) ? { text: "Copied. Paste it into a new Claude or ChatGPT chat.", tone: "ok" } : { text: "Couldn't copy. Select the prompt below and copy it.", tone: "error" })} />
        {left ? <Text style={[type.small, { color: c.muted }]}>{left} blank{left === 1 ? "" : "s"} still to fill in. You can send it anyway.</Text> : null}
        <Notice text={msg?.text ?? null} tone={msg?.tone} />
      </View>

      <View style={{ gap: space.sm }}>
        <Text style={[type.heading, { color: c.ink }]}>The prompt</Text>
        <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.md, padding: space.md }}>
          <Text selectable style={[type.body, { color: c.ink }]}>{text}</Text>
        </View>
      </View>
    </PageScroll>
  );
}

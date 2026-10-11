import React, { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { Body, Button, Field, H2, Notice, Screen } from "@/components/ui";
import { api, ApiError, money, type PriceCheck, type PriceMatch } from "@/lib/api";
import { priceCheckPhoto, type PendingPhoto } from "@/lib/price-check-store";
import { fonts, radius, space, type, useColors } from "@/lib/theme";

/** Find the same item at Amazon, Walmart, Target and more, and suggest a price that beats them. */
export default function PriceCheckScreen() {
  const c = useColors();
  const params = useLocalSearchParams<{ image_file?: string; image_url?: string; preview?: string; cost?: string }>();
  const [photo, setPhoto] = useState<PendingPhoto | null>(() => priceCheckPhoto.take());
  const [cost, setCost] = useState(params.cost ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PriceCheck | null>(null);
  const preview = photo?.uri ?? params.preview ?? params.image_url ?? null;
  const hasImage = Boolean(photo || params.image_file || params.image_url);

  async function pick(source: "camera" | "library") {
    const perm = source === "camera" ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { setError("Allow photo access in Settings to check a product."); return; }
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 0.7, base64: true };
    const res = source === "camera" ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    const a = res.assets?.[0];
    if (res.canceled || !a?.base64) return;
    setPhoto({ uri: a.uri, base64: a.base64, mimeType: "image/jpeg" });
    setResult(null);
  }

  async function run() {
    setBusy(true); setError(null);
    try {
      const n = Number(cost.replace(/[^0-9.]/g, ""));
      const input = photo ? { imageBase64: photo.base64, mediaType: photo.mimeType }
        : params.image_file ? { image_file: params.image_file } : { image_url: params.image_url };
      setResult(await api.priceCheck({ ...input, cost: n > 0 ? n : undefined }));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't check prices. Try again.");
    } finally { setBusy(false); }
  }

  const s = result?.summary;
  const sug = result?.suggestion;
  return (
    <Screen>
      <View style={{ gap: space.sm }}>
        <Text accessibilityRole="header" style={[type.hero, { color: c.ink }]}>Check the{"\n"}market price</Text>
        <Body muted>Use a supplier screenshot or a photo. Snapfront finds the same item at Amazon, Walmart, Target and more, then suggests a price that beats them.</Body>
      </View>

      <Pressable onPress={() => Alert.alert("Product photo", undefined, [
        { text: "Choose screenshot or photo", onPress: () => pick("library") },
        { text: "Take photo", onPress: () => pick("camera") },
        { text: "Cancel", style: "cancel" },
      ])} accessibilityRole="button" accessibilityLabel={preview ? "Change product photo" : "Add product photo"}
        style={{ flexDirection: "row", gap: space.md, alignItems: "center", backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, padding: space.md }}>
        <View style={{ width: 72, height: 72, borderRadius: radius.md, backgroundColor: c.sunk, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
          {preview ? <Image source={{ uri: preview }} style={{ width: 72, height: 72 }} contentFit="cover" /> : <Ionicons name="image-outline" size={28} color={c.muted} />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[type.label, { color: c.ink }]}>{preview ? "Product photo" : "Add a screenshot or photo"}</Text>
          <Text style={[type.small, { color: c.muted }]}>{preview ? "Tap to change" : "A clear picture of the item on a plain background works best"}</Text>
        </View>
      </Pressable>

      <Field label="Your cost (USD)" hint="What the supplier charges you, including shipping. Optional, but needed to show your profit."
        value={cost} onChangeText={setCost} keyboardType="decimal-pad" placeholder="e.g. 6.50" />
      <Notice text={error} tone="error" />
      <Button label={busy ? "Searching stores…" : "Check market price"} loading={busy} disabled={!hasImage} onPress={run} />

      {result ? (
        result.matches.length === 0 ? (
          <Notice text="No priced matches found. Try a clearer photo of just the product, or a screenshot without text over it." />
        ) : (
          <View style={{ gap: space.lg }}>
            {sug ? (
              <View style={{ backgroundColor: c.ink, borderRadius: radius.lg, padding: space.lg, gap: 6 }}>
                <Text style={[type.small, { color: c.bg, opacity: 0.8 }]}>Suggested price</Text>
                <Text style={{ fontFamily: fonts.display, fontSize: 40, color: c.flash }}>{money(sug.price)}</Text>
                {sug.profit != null ? (
                  <Text style={[type.body, { color: c.bg }]}>{money(sug.profit)} profit per sale ({sug.margin_percent}% margin)</Text>
                ) : null}
                <Text style={[type.small, { color: c.bg, opacity: 0.8 }]}>Based on {sug.basis}.</Text>
                {sug.warning ? <Text style={[type.small, { color: c.flash }]}>{sug.warning}</Text> : null}
              </View>
            ) : null}

            {s ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
                {(["amazon", "walmart", "target"] as const).map((k) => s.by_store[k] ? (
                  <Stat key={k} label={`Lowest at ${s.by_store[k].store_name}`} value={money(s.by_store[k].price)} />
                ) : null)}
                {s.median != null ? <Stat label={`Typical of ${s.count} listings`} value={money(s.median)} /> : null}
              </View>
            ) : null}

            <H2>Where it’s sold</H2>
            <Text style={[type.small, { color: c.muted, marginTop: -space.sm }]}>Check the photos to make sure it’s really the same item. If it’s a brand-name product, only sell the genuine version.</Text>
            {result.matches.map((m) => <MatchRow key={m.link} m={m} />)}
          </View>
        )
      ) : null}
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const c = useColors();
  return (
    <View style={{ flexGrow: 1, flexBasis: "45%", backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.md, padding: space.md, gap: 2 }}>
      <Text style={{ fontFamily: fonts.display, fontSize: 22, color: c.ink }}>{value}</Text>
      <Text style={[type.small, { color: c.muted }]}>{label}</Text>
    </View>
  );
}

function MatchRow({ m }: { m: PriceMatch }) {
  const c = useColors();
  return (
    <Pressable onPress={() => WebBrowser.openBrowserAsync(m.link)} accessibilityRole="link" accessibilityLabel={`${m.title}, ${money(m.price)} at ${m.store_name}`}
      style={({ pressed }) => ({ flexDirection: "row", gap: space.md, alignItems: "center", backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.md, padding: space.sm, opacity: pressed ? 0.85 : 1 })}>
      <View style={{ width: 56, height: 56, borderRadius: radius.sm, backgroundColor: c.sunk, overflow: "hidden" }}>
        {m.thumbnail ? <Image source={{ uri: m.thumbnail }} style={{ width: 56, height: 56 }} contentFit="cover" /> : null}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text numberOfLines={2} style={[type.small, { color: c.ink }]}>{m.title}</Text>
        <Text style={[type.small, { color: c.muted }]}>{m.store_name}{m.in_stock === false ? " · out of stock" : ""}</Text>
      </View>
      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: c.ink }}>{money(m.price)}</Text>
    </Pressable>
  );
}

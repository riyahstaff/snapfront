import React, { useState } from "react";
import { Alert, View } from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Body, Button, Field, H1, Notice, Screen, Segmented } from "@/components/ui";
import { Viewfinder } from "@/components/viewfinder";
import { api, ApiError } from "@/lib/api";
import { draftStore } from "@/lib/draft-store";
import { priceCheckPhoto } from "@/lib/price-check-store";
import { space } from "@/lib/theme";

type Photo = { uri: string; base64: string; mimeType: string };

export default function SnapScreen() {
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [kind, setKind] = useState<"physical" | "digital">("physical");
  const [hint, setHint] = useState("");
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(source: "camera" | "library") {
    setError(null);
    const perm = source === "camera" ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError(source === "camera" ? "Allow camera access in Settings to snap a product." : "Allow photo access in Settings to choose a product photo.");
      return;
    }
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.7, base64: true };
    const res = source === "camera" ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (res.canceled || !res.assets?.[0]?.base64) return;
    const a = res.assets[0];
    // base64 output is JPEG data regardless of the source file type
    setPhoto({ uri: a.uri, base64: a.base64!, mimeType: "image/jpeg" });
  }

  function choose() {
    Alert.alert("Add a product photo", undefined, [
      { text: "Take photo", onPress: () => pick("camera") },
      { text: "Choose from library", onPress: () => pick("library") },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  async function build() {
    if (!photo) return;
    setBusy(true); setError(null);
    try {
      const draft = await api.productFromPhoto({ imageBase64: photo.base64, mediaType: photo.mimeType, kind, hint, price, tone: "warm and friendly" });
      draftStore.set({ ...draft, localUri: photo.uri });
      router.push("/draft");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't build the page. Try again.");
    } finally { setBusy(false); }
  }

  return (
    <Screen>
      <View style={{ gap: space.sm }}>
        <H1>Snap a photo.{"\n"}Get a storefront.</H1>
        <Body muted>Snapfront writes the title, description, bullet points, FAQ and price, then sets up checkout with Stripe.</Body>
      </View>
      <Viewfinder uri={photo?.uri} onPress={choose} />
      <Segmented value={kind} onChange={setKind} options={[{ value: "physical", label: "Physical item" }, { value: "digital", label: "Digital download" }]} />
      <Field label="What is it?" hint='Optional. A few words help, like "hand-poured soy candle, 8 oz".' value={hint} onChangeText={setHint} placeholder="Leave blank and Snapfront will work it out" returnKeyType="done" />
      <Field label="Price (USD)" hint="Leave blank for a suggested price." value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="e.g. 24" />
      <Notice text={error} tone="error" />
      <Button label={busy ? "Writing your page…" : "Build product page"} onPress={build} loading={busy} disabled={!photo} />
      <Button label="Check market price first" variant="ghost" onPress={() => {
        if (photo) priceCheckPhoto.set(photo);
        router.push("/price-check");
      }} />
    </Screen>
  );
}

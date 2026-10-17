// Avatars from real photos: "Use my photo" (the seller's own photo becomes the avatar, free and
// instant) and "Blend two photos" (two adults become one new person, using an AI photo). Each photo
// is checked on the server as soon as it's picked (one person, adults only), so problems show up
// on the photo itself rather than after pressing the button.
import React, { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Button, Field } from "@/components/ui";
import { api, ApiError, type Avatar, type AvatarPhoto, type AvatarStudio } from "@/lib/api";
import { radius, space, type, useColors } from "@/lib/theme";

type Msg = { text: string; tone: "ok" | "error" | "info" } | null;

export function PhotoAvatarMaker({ mode, studio, full, onMade, onMsg }: {
  mode: "photo" | "blend"; studio: AvatarStudio; full: boolean; onMade: (a: Avatar) => void; onMsg: (m: Msg) => void;
}) {
  const c = useColors();
  const slots = mode === "photo" ? 1 : 2;
  const [photos, setPhotos] = useState<(AvatarPhoto | null)[]>([null, null]);
  const [errors, setErrors] = useState<(string | null)[]>([null, null]);
  const [uploading, setUploading] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [look, setLook] = useState("");
  const [mix, setMix] = useState(studio.mixes?.[0]?.id ?? "even");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);

  const setAt = <T,>(list: T[], i: number, v: T) => list.map((x, j) => (j === i ? v : x));
  async function pick(i: number) {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [4, 5], quality: 0.85, base64: true });
    if (res.canceled) return;
    const asset = res.assets?.[0];
    if (!asset?.base64) { setErrors((e) => setAt(e, i, "That photo couldn't be read. Try another one.")); return; }
    setUploading(i); setErrors((e) => setAt(e, i, null)); setPhotos((p) => setAt(p, i, null));
    try { const staged = await api.stageAvatarPhoto(asset.base64, asset.mimeType || "image/jpeg"); setPhotos((p) => setAt(p, i, staged)); }
    catch (e) { setErrors((list) => setAt(list, i, e instanceof ApiError ? e.message : "Couldn't upload that photo.")); }
    finally { setUploading(null); }
  }

  const ready = photos.slice(0, slots).every(Boolean) && consent && !full;
  async function make() {
    setBusy(true); onMsg(null);
    try {
      const made = mode === "photo"
        ? await api.avatarFromPhoto({ photo: photos[0]!.id, name: name.trim() || undefined, consent })
        : await api.blendAvatar({ photos: [photos[0]!.id, photos[1]!.id], mix, name: name.trim() || undefined, look: look.trim() || undefined, consent });
      onMade(made);
      setPhotos([null, null]); setName(""); setLook(""); setConsent(false);
      onMsg(mode === "photo" ? { text: `${made.name} is ready. Pick a product below to put yourself in a photo.`, tone: "ok" } : { text: "Blending the two photos. It takes about 30 seconds.", tone: "info" });
    } catch (e) {
      // Staged photos last a day; if one has gone, ask for it again.
      if (e instanceof ApiError && e.status === 404) setPhotos([null, null]);
      if (!(e instanceof ApiError && e.upgrade)) onMsg({ text: e instanceof ApiError ? e.message : "Couldn't make the avatar.", tone: "error" });
    } finally { setBusy(false); }
  }

  return (
    <View style={{ gap: space.sm }}>
      <Text style={[type.small, { color: c.muted }]}>
        {mode === "photo"
          ? "Use a clear, bright photo of yourself facing the camera. You'll appear in your product photos, and you can make it talk. Free, and ready right away."
          : "Add a photo of each person. The AI makes one new person who looks like a mix of both. Uses 1 AI photo from your allowance, and both photos are deleted once the blend is made."}
      </Text>
      <View style={{ flexDirection: "row", gap: space.sm }}>
        {Array.from({ length: slots }, (_, i) => (
          <View key={i} style={{ flex: 1, gap: 6, maxWidth: slots === 1 ? 180 : undefined }}>
            <Pressable onPress={() => pick(i)} disabled={uploading !== null} accessibilityRole="button" accessibilityLabel={photos[i] ? `Change photo ${i + 1}` : `Add photo ${i + 1}`}
              style={{ aspectRatio: 4 / 5, borderRadius: radius.md, overflow: "hidden", borderWidth: photos[i] ? 0 : 1.5, borderStyle: "dashed", borderColor: errors[i] ? c.flash : c.line, backgroundColor: c.sunk, alignItems: "center", justifyContent: "center" }}>
              {photos[i] ? <Image source={{ uri: photos[i]!.image_url }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                : uploading === i ? <View style={{ alignItems: "center", gap: 6 }}><ActivityIndicator color={c.accent} /><Text style={[type.small, { color: c.muted }]}>Checking…</Text></View>
                : <View style={{ alignItems: "center", gap: 6, padding: space.sm }}><Ionicons name="person-add-outline" size={26} color={c.muted} /><Text style={[type.small, { color: c.muted, textAlign: "center" }]}>{slots === 1 ? "Add your photo" : `Photo ${i + 1}`}</Text></View>}
            </Pressable>
            {errors[i] ? <Text style={[type.small, { color: c.ink }]}>{errors[i]}</Text> : photos[i] ? <Text style={[type.small, { color: c.muted }]}>Tap to change</Text> : null}
          </View>
        ))}
      </View>
      {mode === "blend" && studio.mixes?.length ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
          {studio.mixes.map((m) => (
            <Pressable key={m.id} onPress={() => setMix(m.id)} accessibilityRole="radio" accessibilityState={{ selected: mix === m.id }}
              style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.pill, borderWidth: mix === m.id ? 2 : 1, borderColor: mix === m.id ? c.accent : c.line, backgroundColor: c.bg }}>
              <Text style={[type.label, { color: c.ink }]}>{m.name}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <Field label="Name (optional)" value={name} onChangeText={setName} maxLength={30} placeholder={mode === "photo" ? "Me" : "Jordan"} />
      {mode === "blend" ? <Field label="Styling (optional)" hint="Outfit, hair or background for the new person." value={look} onChangeText={setLook} maxLength={200} placeholder="denim jacket, warm studio background" /> : null}
      <Pressable onPress={() => setConsent(!consent)} accessibilityRole="checkbox" accessibilityState={{ checked: consent }}
        style={{ flexDirection: "row", gap: space.sm, alignItems: "flex-start", paddingVertical: 4 }}>
        <Ionicons name={consent ? "checkbox" : "square-outline"} size={22} color={consent ? c.accent : c.muted} />
        <Text style={[type.small, { color: c.ink, flex: 1 }]}>
          {mode === "photo" ? "This is a photo of me, or the person in it agreed to be my avatar." : "Both people are adults who agreed to have their photos blended into an avatar."}
        </Text>
      </Pressable>
      <Button label={mode === "photo" ? "Use this photo" : "Blend them"} icon={<Ionicons name={mode === "photo" ? "person-circle-outline" : "git-merge-outline"} size={18} color={c.onAccent} />}
        loading={busy} disabled={!ready} onPress={make} />
      <Text style={[type.small, { color: c.muted }]}>Photos are checked first: one person per photo, adults only. Photos of other people need their permission.</Text>
    </View>
  );
}

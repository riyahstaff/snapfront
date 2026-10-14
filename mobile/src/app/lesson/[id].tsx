// One Academy lesson: the narrated video, the written guide, the transcript and the next step.
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { router, useLocalSearchParams, useNavigation, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import { Button, Notice } from "@/components/ui";
import { academy, ApiError, type AcademyLesson } from "@/lib/api";
import { radius, space, type, useColors } from "@/lib/theme";

export default function LessonScreen() {
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const nav = useNavigation();
  const [lesson, setLesson] = useState<AcademyLesson | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showText, setShowText] = useState(false);
  useEffect(() => {
    let alive = true;
    academy.lesson(String(id)).then((l) => { if (!alive) return; setLesson(l); nav.setOptions({ title: l.title }); })
      .catch((e) => alive && setError(e instanceof ApiError ? e.message : "Couldn't open this lesson."));
    return () => { alive = false; };
  }, [id, nav]);
  if (!lesson) return <View style={{ flex: 1, backgroundColor: c.bg, padding: space.xl }}>{error ? <Notice text={error} tone="error" /> : <ActivityIndicator color={c.accent} />}</View>;

  async function finish() {
    await academy.setDone(lesson!.id, true).catch(() => {});
    setLesson({ ...lesson!, done: true });
  }
  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ padding: space.xl, gap: space.lg, paddingBottom: 64 }}>
      {lesson.video ? <Player url={lesson.video} /> : (
        <View style={{ aspectRatio: 16 / 9, borderRadius: radius.lg, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, alignItems: "center", justifyContent: "center", gap: 8, padding: space.lg }}>
          <Ionicons name="film-outline" size={30} color={c.muted} />
          <Text style={[type.body, { color: c.muted, textAlign: "center" }]}>The video for this lesson is being made. The guide below has everything in it.</Text>
        </View>
      )}
      <View style={{ gap: 4 }}>
        <Text style={[type.small, { color: c.muted }]}>{lesson.module}</Text>
        <Text accessibilityRole="header" style={[type.title, { color: c.ink }]}>{lesson.title}</Text>
        <Text style={[type.body, { color: c.muted }]}>{lesson.summary}</Text>
      </View>
      {lesson.action ? <Button label={lesson.action.label} onPress={() => router.push(lesson.action!.route as Href)} /> : null}
      <View style={{ gap: space.md }}>
        {lesson.guide.map((g) => (
          <View key={g.heading} style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, padding: space.lg, gap: 8 }}>
            <Text style={[type.heading, { color: c.ink }]}>{g.heading}</Text>
            {g.points.map((p) => (
              <View key={p} style={{ flexDirection: "row", gap: 10 }}>
                <Ionicons name="checkmark" size={16} color={c.accent} style={{ marginTop: 4 }} />
                <Text style={[type.body, { color: c.ink, flex: 1 }]}>{p}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
      <Button label={showText ? "Hide the transcript" : "Read the transcript"} variant="ghost" onPress={() => setShowText((x) => !x)} />
      {showText ? <Text selectable style={[type.body, { color: c.muted }]}>{lesson.transcript}</Text> : null}
      {lesson.done ? <Notice text="Lesson done. Nice work." tone="ok" /> : <Button label="Mark as done" variant="secondary" onPress={finish} />}
      {lesson.next ? <Button label={`Next: ${lesson.next.title}`} variant="ghost" onPress={() => router.replace({ pathname: "/lesson/[id]", params: { id: lesson.next!.id } })} /> : null}
    </ScrollView>
  );
}

function Player({ url }: { url: string }) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const player = useVideoPlayer(url, (p) => { p.loop = false; });
  return (
    <View style={{ width: "100%", maxWidth: Math.min(width - 48, 900), alignSelf: "center", aspectRatio: 16 / 9, borderRadius: radius.lg, overflow: "hidden", backgroundColor: "#000", borderWidth: 1, borderColor: c.line }}>
      <VideoView player={player} style={{ width: "100%", height: "100%" }} contentFit="contain" nativeControls />
    </View>
  );
}

import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { Body, Button, H1, Screen } from "@/components/ui";
import { api, type Trend } from "@/lib/api";
import { fonts, radius, space, type, useColors } from "@/lib/theme";

export default function TrendsScreen() {
  const c = useColors();
  const [trends, setTrends] = useState<Trend[]>([]);
  useEffect(() => { api.trends().then(setTrends).catch(() => {}); }, []);
  return (
    <Screen>
      <View style={{ gap: space.sm }}>
        <H1>What’s selling right now</H1>
        <Body muted>The digital formats with the strongest demand across Etsy, TikTok, Instagram and Pinterest, ranked.</Body>
      </View>
      {trends.map((t, i) => (
        <View key={t.name} style={{ flexDirection: "row", gap: space.md, backgroundColor: c.surface, borderColor: c.line, borderWidth: 1, borderRadius: radius.lg, padding: space.lg }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 28, color: c.accent, width: 30 }}>{i + 1}</Text>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[type.heading, { color: c.ink }]}>{t.name}</Text>
            <Text style={[type.small, { color: c.muted }]}>{t.why}</Text>
            <Text style={[type.small, { color: c.ink, fontFamily: fonts.bodyMedium }]}>Sells on {t.where}</Text>
          </View>
        </View>
      ))}
      <Button label="Create one of these" onPress={() => router.navigate("/create")} />
    </Screen>
  );
}

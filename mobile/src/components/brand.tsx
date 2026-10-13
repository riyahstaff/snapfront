import React from "react";
import { Text, View } from "react-native";
import { Image } from "expo-image";
import { fonts, useColors } from "@/lib/theme";

export function Brand({ size = 34, tagline = false }: { size?: number; tagline?: boolean }) {
  const c = useColors();
  return (
    <View accessible accessibilityLabel="Snapfront creative commerce studio" style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <Image source={require("../../assets/brand-mark.png")} contentFit="contain" style={{ width: size, height: size * 1.12 }} />
      <View style={{ gap: 2 }}>
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: size * 0.72, letterSpacing: 0.7, color: c.ink }}>snapfront</Text>
        {tagline ? <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 9, letterSpacing: 2.1, color: c.muted }}>CREATIVE COMMERCE STUDIO</Text> : null}
      </View>
    </View>
  );
}

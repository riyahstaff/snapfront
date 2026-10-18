// Which AI makes a photo: Standard (included with the plan) or Google's Nano Banana models (credits).
import React from "react";
import { Pressable, Text, View } from "react-native";
import type { PhotoEngine } from "@/lib/api";
import { fonts, radius, space, type, useColors } from "@/lib/theme";

export function EnginePicker({ engines, value, onChange }: { engines?: PhotoEngine[]; value: string; onChange: (id: string) => void }) {
  const c = useColors();
  if (!engines || engines.length < 2) return null;
  return (
    <View style={{ gap: space.sm }}>
      <Text style={[type.label, { color: c.ink }]}>Photo AI</Text>
      <View style={{ gap: space.sm }}>
        {engines.map((e) => {
          const on = e.id === value;
          return (
            <Pressable key={e.id} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={`${e.name}, ${e.credits ? `${e.credits} credits` : "included"}`} onPress={() => onChange(e.id)}
              style={{ flexDirection: "row", alignItems: "center", gap: space.md, padding: space.md, borderRadius: radius.md, borderWidth: on ? 2 : 1, borderColor: on ? c.accent : c.line, backgroundColor: c.surface }}>
              <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: on ? c.accent : c.line, alignItems: "center", justifyContent: "center" }}>
                {on ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.accent }} /> : null}
              </View>
              <View style={{ flex: 1, gap: 1 }}>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: c.ink }}>{e.name}</Text>
                <Text style={[type.small, { color: c.muted }]}>{e.blurb}</Text>
              </View>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: e.credits ? c.brand : c.good }}>{e.credits ? `${e.credits} credits` : "Included"}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

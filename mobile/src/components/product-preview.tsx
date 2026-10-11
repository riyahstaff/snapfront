import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import type { Draft } from "@/lib/api";
import { money } from "@/lib/api";
import { fonts, radius, space, type, useColors } from "@/lib/theme";
import { Brackets } from "./viewfinder";

/** How the product page will look to shoppers. */
export function ProductPreview({ product, imageUri, badge }: { product: Draft; imageUri?: string | null; badge?: React.ReactNode }) {
  const c = useColors();
  const paras = (product.description || "").split(/\n\s*\n/).filter(Boolean);
  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.line }]}>
      <View style={[styles.photo, { backgroundColor: c.sunk }]}>
        {imageUri ? <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel={product.alt_text || product.title} /> : null}
        <Brackets color="#FFFFFF" size={22} inset={12} />
        {product.label ? (
          <View style={{ position: "absolute", top: 14, left: 14, backgroundColor: c.ink, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: c.bg }}>{product.label}</Text>
          </View>
        ) : null}
        <View style={[styles.price, { backgroundColor: c.flash }]}>
          <Text style={{ fontFamily: fonts.display, fontSize: 18, color: c.onFlash }}>{money(product.price)}</Text>
        </View>
      </View>
      <View style={{ padding: space.lg, gap: space.md }}>
        {badge}
        <Text style={[type.label, { color: c.accent }]}>{product.kind === "digital" ? "Digital download" : product.category || "Product"}</Text>
        <Text style={[type.title, { color: c.ink }]}>{product.title}</Text>
        {product.tagline ? <Text style={[type.body, { color: c.muted, fontSize: 16 }]}>{product.tagline}</Text> : null}
        {paras.map((p, i) => <Text key={i} style={[type.body, { color: c.ink }]}>{p}</Text>)}
        {product.bullets.length ? (
          <View style={{ gap: 8 }}>
            <Text style={[type.heading, { color: c.ink }]}>What you get</Text>
            {product.bullets.map((b, i) => (
              <View key={i} style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ width: 10, height: 10, marginTop: 6, borderWidth: 2, borderColor: c.accent, borderRadius: 2 }} />
                <Text style={[type.body, { color: c.ink, flex: 1 }]}>{b}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {product.tags.length ? <Text style={[type.small, { color: c.muted }]}>{product.tags.map((t) => `#${t}`).join("  ")}</Text> : null}
        {product.faq.map((f, i) => (
          <View key={i} style={{ borderTopWidth: StyleSheet.hairlineWidth, borderColor: c.line, paddingTop: space.sm, gap: 4 }}>
            <Text style={[type.label, { color: c.ink }]}>{f.q}</Text>
            <Text style={[type.small, { color: c.muted }]}>{f.a}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1, overflow: "hidden" },
  photo: { width: "100%", aspectRatio: 1 },
  price: { position: "absolute", left: 14, bottom: 14, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
});

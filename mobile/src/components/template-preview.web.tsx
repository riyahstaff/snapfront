import React, { useEffect, useMemo, useRef } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Notice, Pill } from "@/components/ui";
import { fonts, radius, space, type, useColors } from "@/lib/theme";
import { TemplatePreviewFallback } from "./template-preview-fallback";
import {
  buildTemplatePreviewDocument,
  previewBridgeMessage,
  setupPreviewNeedsLatestBackend,
  type TemplatePreviewProps,
} from "./template-preview-bridge";

export type { TemplatePreviewProps } from "./template-preview-bridge";

/** Browser implementation: a sandboxed srcDoc iframe whose messages must come from this exact frame. */
export function TemplatePreview({ preview, loading, error, theme, onRetry, onPhoto, onWords }: TemplatePreviewProps) {
  const c = useColors();
  const frame = useRef<HTMLIFrameElement | null>(null);
  const html = useMemo(() => preview ? buildTemplatePreviewDocument(preview.html, "web") : "", [preview]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || event.origin !== "null") return;
      const message = previewBridgeMessage(typeof event.data === "string" ? event.data : JSON.stringify(event.data));
      if (message) onPhoto(message.index);
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [onPhoto]);
  if (!preview) return <TemplatePreviewFallback theme={theme} error={setupPreviewNeedsLatestBackend(error, preview) ? "Setup preview needs the latest backend. Your draft is kept on this phone; retry when it is available or keep editing manually." : error} onRetry={onRetry} />;
  const sample = preview.mode === "template" || preview.sample_products > 0 || preview.photo_slots.some((slot) => slot.sample);
  const previewTheme = theme ?? { colors: { bg: c.sunk, line: c.line, ink: c.ink } };
  return (
    <View style={{ gap: space.sm }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.sm }}>
        <View style={{ flex: 1, gap: 2 }}><Text style={[type.heading, { color: c.ink }]}>Storefront setup preview</Text><Text style={[type.small, { color: c.muted }]}>Your chosen layout, with your changes. Scroll inside to see more.</Text></View>
        {loading ? <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}><ActivityIndicator size="small" color={c.accent} /><Text style={[type.small, { color: c.muted }]}>Updating…</Text></View> : <Pill text={preview.mode === "final" ? "Review" : "Template"} />}
      </View>
      <View style={[styles.frame, { borderColor: previewTheme.colors.line, backgroundColor: previewTheme.colors.bg }]}>
        <iframe ref={frame} title="Storefront setup preview" sandbox="allow-scripts" srcDoc={html} style={styles.iframe as React.CSSProperties} />
      </View>
      {sample ? <Notice text="Example photos and products help you see the design. Replace them with yours. You cannot shop in this private preview." /> : <Notice text="This private preview does not change your live store. Customers only see your design after you finish." />}
      {error ? <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}><Text style={[type.small, { color: c.bad, flex: 1 }]}>{error}</Text><Pressable accessibilityRole="button" onPress={onRetry} style={{ minHeight: 44, justifyContent: "center" }}><Text style={{ fontFamily: fonts.bodyBold, color: c.accent }}>Retry</Text></Pressable></View> : null}
      <View style={{ flexDirection: "row", gap: space.sm }}>
        <Pressable accessibilityRole="button" onPress={onRetry} style={[styles.control, { borderColor: c.line, backgroundColor: c.surface }]}><Ionicons name="refresh-outline" size={17} color={c.ink} /><Text style={{ fontFamily: fonts.bodyBold, color: c.ink }}>Refresh</Text></Pressable>
        {onWords ? <Pressable accessibilityRole="button" onPress={onWords} style={[styles.control, { borderColor: c.line, backgroundColor: c.surface }]}><Ionicons name="create-outline" size={17} color={c.ink} /><Text style={{ fontFamily: fonts.bodyBold, color: c.ink }}>Edit words</Text></Pressable> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { height: 430, overflow: "hidden", borderRadius: radius.lg, borderWidth: 1 },
  iframe: { borderWidth: 0, width: "100%", height: "100%", display: "flex", backgroundColor: "transparent" },
  control: { minHeight: 44, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
});

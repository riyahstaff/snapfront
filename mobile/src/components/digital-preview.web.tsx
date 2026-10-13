import React, { useEffect, useMemo, useRef } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Notice, Pill } from "@/components/ui";
import { fonts, radius, space, type, useColors } from "@/lib/theme";
import type { DigitalPreview as DigitalPreviewData } from "@/lib/api";
import { buildDigitalPreviewDocument, digitalPreviewBridgeMessage, type DigitalPreviewSelection } from "./digital-preview-bridge";

export type DigitalPreviewProps = {
  preview: DigitalPreviewData | null;
  pageIndex: number;
  loading: boolean;
  error: string | null;
  onPageIndex: (index: number) => void;
  onSelect: (selection: DigitalPreviewSelection) => void;
  onRetry: () => void;
};

/** Browser preview: the parent accepts messages only from this opaque-origin sandboxed iframe. */
export function DigitalPreview({ preview, pageIndex, loading, error, onPageIndex, onSelect, onRetry }: DigitalPreviewProps) {
  const c = useColors();
  const frame = useRef<HTMLIFrameElement | null>(null);
  const page = preview?.pages[pageIndex] ?? null;
  const html = useMemo(() => page ? buildDigitalPreviewDocument(page.svg, "web") : null, [page]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || event.origin !== "null") return;
      const selection = digitalPreviewBridgeMessage(typeof event.data === "string" ? event.data : JSON.stringify(event.data));
      if (selection) onSelect(selection);
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [onSelect]);
  if (!preview) return <Notice text={loading ? "Rendering your actual design…" : error ?? "Preview your design to see its real pages."} tone={error ? "error" : "info"} />;
  return (
    <View style={{ gap: space.sm }}>
      <View style={{ flexDirection: "row", gap: space.sm, alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flex: 1, gap: 2 }}><Text style={[type.heading, { color: c.ink }]}>Actual document preview</Text><Text style={[type.small, { color: c.muted }]}>Tap cover or body text to edit that exact field.</Text></View>
        {loading ? <ActivityIndicator color={c.accent} /> : <Pill text={`Page ${pageIndex + 1} of ${preview.page_count}`} />}
      </View>
      {html ? <View style={[styles.frame, { borderColor: c.line, backgroundColor: c.surface }]}><iframe ref={frame} title={`Digital document preview page ${pageIndex + 1}`} sandbox="allow-scripts" srcDoc={html} style={styles.iframe as React.CSSProperties} /></View> : <Notice text="This preview page could not be opened safely. It was not substituted with a sample. Render it again after checking your connection." tone="error" />}
      <View style={{ flexDirection: "row", gap: space.sm }}>
        <Pressable disabled={pageIndex <= 0} onPress={() => onPageIndex(pageIndex - 1)} accessibilityRole="button" style={[styles.control, { opacity: pageIndex <= 0 ? 0.4 : 1, borderColor: c.line, backgroundColor: c.surface }]}><Ionicons name="chevron-back" size={18} color={c.ink} /><Text style={{ color: c.ink, fontFamily: fonts.bodyBold }}>Previous</Text></Pressable>
        <Pressable disabled={pageIndex >= preview.pages.length - 1} onPress={() => onPageIndex(pageIndex + 1)} accessibilityRole="button" style={[styles.control, { opacity: pageIndex >= preview.pages.length - 1 ? 0.4 : 1, borderColor: c.line, backgroundColor: c.surface }]}><Text style={{ color: c.ink, fontFamily: fonts.bodyBold }}>Next</Text><Ionicons name="chevron-forward" size={18} color={c.ink} /></Pressable>
        <Pressable onPress={onRetry} accessibilityRole="button" accessibilityLabel="Render preview again" style={[styles.iconControl, { borderColor: c.line, backgroundColor: c.surface }]}><Ionicons name="refresh-outline" size={18} color={c.ink} /></Pressable>
      </View>
      {error ? <Notice text={error} tone="error" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { height: 510, overflow: "hidden", borderRadius: radius.lg, borderWidth: 1 },
  iframe: { borderWidth: 0, width: "100%", height: "100%", display: "flex", backgroundColor: "transparent" },
  control: { flex: 1, minHeight: 44, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 8, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 3 },
  iconControl: { width: 44, minHeight: 44, borderWidth: 1, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
});

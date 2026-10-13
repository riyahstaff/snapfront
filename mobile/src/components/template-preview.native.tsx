import React, { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { Notice, Pill } from "@/components/ui";
import { API_URL } from "@/lib/api";
import { fonts, radius, space, type, useColors } from "@/lib/theme";
import { TemplatePreviewFallback } from "./template-preview-fallback";
import {
  buildTemplatePreviewDocument,
  refreshTemplateImages,
  isAllowedPreviewNavigation,
  previewBridgeMessage,
  setupPreviewNeedsLatestBackend,
  type TemplatePreviewProps,
} from "./template-preview-bridge";

export type { TemplatePreviewProps } from "./template-preview-bridge";

/** Inline, non-navigating setup preview. It does not open a seller storefront or enable shopping. */
export function TemplatePreview({ preview, loading, error, theme, onRetry, onPhoto, onWords, renderRevision = 0 }: TemplatePreviewProps) {
  const c = useColors();
  const [frameError, setFrameError] = useState<{ revision: number; text: string } | null>(null);
  const shownError = error || (frameError?.revision === renderRevision ? frameError.text : null);
  const html = useMemo(() => preview ? buildTemplatePreviewDocument(refreshTemplateImages(preview.html, renderRevision, API_URL), "native") : "", [preview, renderRevision]);
  if (!preview && loading) return <View style={{ gap: 8, alignItems: "center", padding: space.lg }}><ActivityIndicator color={c.accent} /><Text style={[type.small, { color: c.muted }]}>Loading your chosen design…</Text></View>;
  if (!preview) return <TemplatePreviewFallback theme={theme} error={setupPreviewNeedsLatestBackend(error, preview) ? "Setup preview needs the latest backend. Your draft is kept on this phone; retry when it is available or keep editing manually." : error} onRetry={onRetry} />;
  const sample = preview.mode === "template" || preview.sample_products > 0 || preview.photo_slots.some((slot) => slot.sample);
  const previewTheme = theme ?? { colors: { bg: c.sunk, line: c.line, ink: c.ink } };
  return (
    <View style={{ gap: space.sm }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.sm }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[type.heading, { color: c.ink }]}>Storefront setup preview</Text>
          <Text style={[type.small, { color: c.muted }]}>Your chosen layout, with your changes. Scroll inside to see more.</Text>
        </View>
        {loading ? <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }} accessibilityLiveRegion="polite"><ActivityIndicator size="small" color={c.accent} /><Text style={[type.small, { color: c.muted }]}>Updating…</Text></View> : <Pill text={preview.mode === "final" ? "Review" : "Template"} />}
      </View>
      <View style={[styles.frame, { borderColor: previewTheme.colors.line, backgroundColor: previewTheme.colors.bg }]}>
        <WebView
          key={renderRevision}
          onError={() => setFrameError({ revision: renderRevision, text: "The picture frame could not load. Your draft is safe; tap Refresh to reload it." })}
          onRenderProcessGone={() => setFrameError({ revision: renderRevision, text: "Android stopped the picture frame. Your draft is safe; tap Refresh to reopen it." })}
          source={{ html, baseUrl: "about:blank" }}
          originWhitelist={["about:blank"]}
          onShouldStartLoadWithRequest={(request) => isAllowedPreviewNavigation(request.url)}
          onMessage={(event) => { const message = previewBridgeMessage(event.nativeEvent.data); if (message) onPhoto(message.index); }}
          javaScriptEnabled
          domStorageEnabled={false}
          cacheEnabled={false}
          incognito
          setSupportMultipleWindows={false}
          allowFileAccess={false}
          allowUniversalAccessFromFileURLs={false}
          mixedContentMode="never"
          scrollEnabled
          nestedScrollEnabled
          showsVerticalScrollIndicator
          bounces={false}
          style={styles.webview}
          accessibilityLabel="Storefront setup preview"
        />
      </View>
      {sample ? <Notice text="Example photos and products help you see the design. Replace them with yours. You cannot shop in this private preview." /> : <Notice text="This private preview does not change your live store. Customers only see your design after you finish." />}
      {shownError ? <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}><Text style={[type.small, { color: c.bad, flex: 1 }]}>{shownError}</Text><Pressable accessibilityRole="button" onPress={onRetry} style={{ minHeight: 44, justifyContent: "center" }}><Text style={{ fontFamily: fonts.bodyBold, color: c.accent }}>Retry</Text></Pressable></View> : null}
      <View style={{ flexDirection: "row", gap: space.sm }}>
        <Pressable accessibilityRole="button" disabled={loading} accessibilityState={{ disabled: loading, busy: loading }} onPress={onRetry} style={[styles.control, { borderColor: c.line, backgroundColor: c.surface }]}><Ionicons name="refresh-outline" size={17} color={c.ink} /><Text style={{ fontFamily: fonts.bodyBold, color: c.ink }}>{loading ? "Refreshing…" : "Refresh"}</Text></Pressable>
        {onWords ? <Pressable accessibilityRole="button" onPress={onWords} style={[styles.control, { borderColor: c.line, backgroundColor: c.surface }]}><Ionicons name="create-outline" size={17} color={c.ink} /><Text style={{ fontFamily: fonts.bodyBold, color: c.ink }}>Edit words</Text></Pressable> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { height: 430, overflow: "hidden", borderRadius: radius.lg, borderWidth: 1 },
  webview: { flex: 1, backgroundColor: "transparent" },
  control: { minHeight: 44, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
});

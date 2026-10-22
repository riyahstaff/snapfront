// Shown instead of a page that crashed (Expo Router's ErrorBoundary). The crash is reported to
// Sentry through Snapfront's server, and the person can try again or ask SnapCare for help.
import React, { useEffect } from "react";
import { Text, View } from "react-native";
import { router, type ErrorBoundaryProps } from "expo-router";
import { Button } from "@/components/ui";
import { reportError } from "@/lib/report-error";
import { space, type, useColors } from "@/lib/theme";

export function CrashScreen({ error, retry }: ErrorBoundaryProps) {
  const c = useColors();
  useEffect(() => { reportError(error, "crash-screen"); }, [error]);
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center", padding: space.xl, gap: space.lg }}>
      <Text accessibilityRole="header" style={[type.title, { color: c.ink, textAlign: "center" }]}>This page stopped working</Text>
      <Text style={[type.body, { color: c.muted, textAlign: "center", maxWidth: 420 }]}>We’ve been sent the details, so we can fix it. Try again, or go back to your store.</Text>
      <View style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap", justifyContent: "center" }}>
        <Button label="Try again" onPress={retry} />
        <Button label="Go to my store" variant="secondary" onPress={() => router.replace("/store")} />
      </View>
    </View>
  );
}

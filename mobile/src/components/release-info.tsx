import React from "react";
import { Text, View } from "react-native";
import { installedRelease } from "@/lib/release-info";
import { type, useColors } from "@/lib/theme";

export function ReleaseInfo({ detailed = false }: { detailed?: boolean }) {
  const c = useColors();
  const release = installedRelease();
  return (
    <View accessibilityLabel={`${release.label}. ${release.release}`} style={{ gap: 4 }}>
      <Text selectable style={[type.small, { color: c.muted, fontSize: detailed ? 13 : 11 }]}>{release.label}</Text>
      {detailed ? <>
        <Text selectable style={[type.small, { color: c.muted }]}>{release.release}</Text>
        <Text selectable style={[type.small, { color: c.muted }]}>{release.packageId ?? "Web development preview"}</Text>
        <Text style={[type.small, { color: c.muted }]}>If a Play test release looks different, compare this installed build with the test track’s version code. Update from your tester link; don’t clear app data or delete local drafts.</Text>
      </> : null}
    </View>
  );
}

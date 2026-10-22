// Help & support: SnapCare, full screen (the phone app's way in; on the web the Help button opens it too).
import React from "react";
import { View } from "react-native";
import { SnapCareChat } from "@/components/snapcare-chat";
import { useColors } from "@/lib/theme";

export default function SupportScreen() {
  const c = useColors();
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, alignItems: "center" }}>
      <View style={{ flex: 1, width: "100%", maxWidth: 760 }}><SnapCareChat /></View>
    </View>
  );
}

// The Help button in the bottom corner of every signed-in web page. It opens SnapCare, the support
// chat, in a panel (full screen on phones) without leaving the page.
import React, { useState } from "react";
import { Pressable, Text, View, useWindowDimensions, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SnapCareChat } from "@/components/snapcare-chat";
import { fonts, radius, useColors } from "@/lib/theme";

export function HelpButton() {
  const c = useColors();
  const { width, height } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const small = width < 640;
  const panel: ViewStyle = small
    ? { position: "fixed" as ViewStyle["position"], left: 0, right: 0, top: 0, bottom: 0 }
    : { position: "fixed" as ViewStyle["position"], right: 24, bottom: 88, width: 400, height: Math.min(640, height - 120), borderRadius: radius.lg, borderWidth: 1, borderColor: c.line, overflow: "hidden" };
  return (
    <>
      {open ? (
        <View role="dialog" aria-label="SnapCare support chat" style={[panel, { zIndex: 1000, backgroundColor: c.bg, boxShadow: c.dark ? "0 30px 80px rgba(0,0,0,0.55)" : "0 30px 80px rgba(15,18,23,0.18)" } as ViewStyle]}>
          <SnapCareChat onClose={() => setOpen(false)} />
        </View>
      ) : null}
      {!(open && small) ? (
        <Pressable onPress={() => setOpen((o) => !o)} accessibilityRole="button" accessibilityLabel={open ? "Close help" : "Help: chat with SnapCare"}
          style={(s) => ({ position: "fixed" as ViewStyle["position"], right: 24, bottom: 24, zIndex: 1001, flexDirection: "row", alignItems: "center", gap: 8, height: 48, paddingHorizontal: open ? 14 : 18, borderRadius: 24,
            backgroundColor: (s as { hovered?: boolean }).hovered ? c.accentHover : c.accent, boxShadow: "0 10px 30px rgba(0,0,0,0.3)" } as ViewStyle)}>
          <Ionicons name={open ? "close" : "chatbubbles"} size={20} color={c.onAccent} />
          {!open ? <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: c.onAccent }}>Help</Text> : null}
        </Pressable>
      ) : null}
    </>
  );
}

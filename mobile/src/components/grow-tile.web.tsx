import React from "react";
import { useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ToolCard } from "@/web/tool-card";
const artwork: Record<string, string> = {
  "Sales & profit": "sales-profit", "Email marketing": "email", "Marketing posts": "marketing",
  "Instagram AutoDM": "autodm", "Affiliates": "affiliates", "Ad pixels": "pixels",
  "Academy": "academy", "Faceless videos": "faceless", "AI avatars": "avatars", "YouTube Shorts": "faceless",
  "Credits": "credits", "UGC creator kit": "ugc", "Community": "community",
  "Earn with Snapfront": "earn", "AI photos & video": "ai-media", "Get more buyers": "buyers",
  "Insights": "insights", "Reviews": "reviews", "Suppliers": "suppliers",
};
export function GrowTile({ icon, label, sub, onPress }: {
  icon: React.ComponentProps<typeof Ionicons>["name"]; label: string; sub: string; onPress: () => void;
}) {
  const { width } = useWindowDimensions();
  return <ToolCard title={label} art={artwork[label] ?? "digital"} detail={sub} icon={icon}
    onPress={onPress} columns={width >= 980 ? 4 : width >= 600 ? 2 : 1} />;
}

import React from "react";
import { Notice } from "@/components/ui";
import type { DigitalPreviewProps } from "./digital-preview.native";

export type { DigitalPreviewProps } from "./digital-preview.native";

/** Metro resolves the native/web implementation; this fallback never fabricates an SVG preview. */
export function DigitalPreview({ preview, loading, error }: DigitalPreviewProps) {
  return <Notice text={preview ? "This platform could not open the private SVG preview." : loading ? "Rendering your actual design…" : error ?? "Preview your design to see its real pages."} tone={error ? "error" : "info"} />;
}

import React from "react";
import { TemplatePreviewFallback } from "./template-preview-fallback";
import { setupPreviewNeedsLatestBackend, type TemplatePreviewProps } from "./template-preview-bridge";

export type { TemplatePreviewProps } from "./template-preview-bridge";

/**
 * Metro selects template-preview.native.tsx or template-preview.web.tsx at runtime. This
 * WebView-free fallback only serves non-platform TypeScript/module resolution safely.
 */
export function TemplatePreview({ preview, error, theme, onRetry }: TemplatePreviewProps) {
  return <TemplatePreviewFallback theme={theme} error={setupPreviewNeedsLatestBackend(error, preview) ? "Setup preview needs the latest backend. Your draft is kept on this phone; retry when it is available or keep editing manually." : error} onRetry={onRetry} />;
}

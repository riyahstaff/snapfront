import type { StoreTheme } from "./api";
import { bundledThemePreview } from "./bundled-theme-previews";

export type ThemePreviewSource = { key: string; source: number | { uri: string } };

/** Exact renderer snapshots packaged with this release; HTTPS supports future catalog entries. */
export function themePreviewSources(theme: StoreTheme): ThemePreviewSource[] {
  const sources: ThemePreviewSource[] = [];
  const local = bundledThemePreview(theme.id);
  if (local !== null) sources.push({ key: `local:${theme.id}`, source: local });
  if (typeof theme.preview_url === "string" && /^https:\/\//i.test(theme.preview_url)) {
    sources.push({ key: `remote:${theme.id}:${theme.preview_url}`, source: { uri: theme.preview_url } });
  }
  return sources;
}

export function availableThemePreview(theme: StoreTheme, failed: readonly string[]): ThemePreviewSource | null {
  return themePreviewSources(theme).find((candidate) => !failed.includes(candidate.key)) ?? null;
}

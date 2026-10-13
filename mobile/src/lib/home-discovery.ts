import type { StoreTheme } from "./api";

/** Discover, never select: return at most four real themes, prioritizing distinct categories. */
export function featuredThemes(themes: StoreTheme[]): StoreTheme[] {
  const preferred = ["p-jewelry", "p-furniture", "p-skincare", "p-fashion"];
  const ordered = [...preferred.map((id) => themes.find((theme) => theme.id === id)).filter((theme): theme is StoreTheme => Boolean(theme)), ...themes];
  const result: StoreTheme[] = [];
  const seen = new Set<string>();
  const groups = new Set<string>();
  for (const theme of ordered) {
    if (seen.has(theme.id)) continue;
    if (result.length && theme.group && groups.has(theme.group)) continue;
    result.push(theme); seen.add(theme.id); if (theme.group) groups.add(theme.group);
    if (result.length === 4) break;
  }
  return result;
}

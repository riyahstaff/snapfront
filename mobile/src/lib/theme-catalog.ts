import type { StoreTheme, ThemeGroup } from "./api";

export type ThemeCollection = "all" | "classic" | "premium";
export type ThemeGroupFilter = "all" | ThemeGroup;
export type ThemeBrowseState = { query: string; group: ThemeGroupFilter; collection: ThemeCollection; page: number };
export const THEME_PAGE_SIZE = 12;
export const EMPTY_THEME_BROWSE: ThemeBrowseState = { query: "", group: "all", collection: "all", page: 0 };
export const THEME_GROUPS: { value: ThemeGroup; label: string }[] = [
  { value: "digital", label: "Digital products" },
  { value: "fashion", label: "Fashion" }, { value: "beauty", label: "Beauty" },
  { value: "home", label: "Home" }, { value: "technology", label: "Technology" },
  { value: "outdoor", label: "Outdoor" }, { value: "lifestyle", label: "Lifestyle" },
];
export const isPremiumTheme = (theme: StoreTheme) => theme.collection === "premium" || theme.id.startsWith("p-");
const normalize = (value: string) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

export function browseThemes(themes: StoreTheme[], browse: ThemeBrowseState) {
  const tokens = normalize(browse.query).split(/\s+/).filter(Boolean);
  const matches = themes.filter((theme) => {
    if (browse.collection !== "all" && (isPremiumTheme(theme) ? "premium" : "classic") !== browse.collection) return false;
    if (browse.group !== "all" && theme.group !== browse.group) return false;
    const searchable = normalize([theme.name, theme.category, theme.for, theme.vibe, theme.family, theme.group, isPremiumTheme(theme) ? "premium" : "classic"].filter(Boolean).join(" "));
    return tokens.every((token) => searchable.includes(token));
  });
  const pages = Math.max(1, Math.ceil(matches.length / THEME_PAGE_SIZE));
  const page = Math.max(0, Math.min(Math.floor(browse.page) || 0, pages - 1));
  return { matches, pages, page, visible: matches.slice(page * THEME_PAGE_SIZE, (page + 1) * THEME_PAGE_SIZE) };
}

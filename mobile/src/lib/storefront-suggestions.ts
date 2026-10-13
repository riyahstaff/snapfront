import * as SecureStore from "expo-secure-store";
import type { StorefrontCopy } from "./api";

const cache = new Map<string, StorefrontCopy>();
const key = (storeId: string) => `snapfront.storefront-suggestions.${storeId.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
const limits: Record<keyof StorefrontCopy, number> = { hero_title: 100, hero_subtitle: 220, hero_eyebrow: 48, hero_cta: 32, tagline: 160, about: 600, announcement: 90 };
function normalize(value: unknown): StorefrontCopy | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Record<string, unknown>;
  if (!Object.keys(limits).every((field) => typeof source[field] === "string")) return null;
  return Object.fromEntries(Object.entries(limits).map(([field, max]) => [field, String(source[field]).slice(0, max)])) as StorefrontCopy;
}
export async function saveStorefrontSuggestions(storeId: string, value: StorefrontCopy): Promise<void> {
  const suggestions = normalize(value);
  if (!suggestions) throw new Error("Invalid storefront suggestions");
  cache.set(storeId, suggestions);
  await SecureStore.setItemAsync(key(storeId), JSON.stringify(suggestions));
}
export async function loadStorefrontSuggestions(storeId: string): Promise<StorefrontCopy | null> {
  if (cache.has(storeId)) return cache.get(storeId)!;
  const raw = await SecureStore.getItemAsync(key(storeId));
  if (!raw) return null;
  try {
    const suggestions = normalize(JSON.parse(raw));
    if (suggestions) cache.set(storeId, suggestions);
    return suggestions;
  } catch { return null; }
}
export async function clearStorefrontSuggestions(storeId: string): Promise<void> {
  cache.delete(storeId);
  await SecureStore.deleteItemAsync(key(storeId));
}

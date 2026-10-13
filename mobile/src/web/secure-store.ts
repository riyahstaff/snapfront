// Web stand-in for expo-secure-store (which has no web version). The website keeps the sign-in
// token and saved setup in the browser's local storage for snapfront's own address only.
// Wired in by metro.config.js for web builds; the phone app keeps using the real secure store.
const mem = new Map<string, string>();
const ls = (): Storage | null => { try { return typeof window !== "undefined" ? window.localStorage : null; } catch { return null; } };

export async function isAvailableAsync() { return true; }
export function getItem(key: string): string | null {
  try { const v = ls()?.getItem(key); if (v != null) return v; } catch { /* private mode */ }
  return mem.get(key) ?? null;
}
export function setItem(key: string, value: string) {
  mem.set(key, value);
  try { ls()?.setItem(key, value); } catch { /* storage full or blocked: keep it for this visit */ }
}
export async function getItemAsync(key: string) { return getItem(key); }
export async function setItemAsync(key: string, value: string) { setItem(key, value); }
export async function deleteItemAsync(key: string) {
  mem.delete(key);
  try { ls()?.removeItem(key); } catch { /* ignore */ }
}
export function canUseBiometricAuthentication() { return false; }
export const AFTER_FIRST_UNLOCK = 0, AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY = 1, ALWAYS = 2, WHEN_PASSCODE_SET_THIS_DEVICE_ONLY = 3,
  ALWAYS_THIS_DEVICE_ONLY = 4, WHEN_UNLOCKED = 5, WHEN_UNLOCKED_THIS_DEVICE_ONLY = 6;

import { useSyncExternalStore } from "react";
import type { Draft } from "./api";

/** Holds the product draft between the Snap screen and the Draft editor. */
let current: (Draft & { localUri?: string }) | null = null;
const listeners = new Set<() => void>();

export const draftStore = {
  get: () => current,
  set(next: (Draft & { localUri?: string }) | null) {
    current = next;
    listeners.forEach((l) => l());
  },
  patch(p: Partial<Draft & { localUri?: string }>) {
    if (!current) return;
    current = { ...current, ...p };
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useDraft() {
  return useSyncExternalStore(draftStore.subscribe, draftStore.get, draftStore.get);
}

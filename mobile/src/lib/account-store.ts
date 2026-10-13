import { useSyncExternalStore } from "react";
import { api, type Me } from "./api";

/** The signed-in store and its account (plan, usage, other stores), shared by every screen. */
let me: Me | null = null;
let refreshRevision = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const account = {
  subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); },
  get: () => me,
  set(next: Me) { refreshRevision++; me = next; emit(); },
  clear() { refreshRevision++; me = null; emit(); },
  async refresh() {
    const revision = ++refreshRevision;
    const storeRevision = api.storeRevision();
    const next = await api.me();
    if (revision === refreshRevision && storeRevision === api.storeRevision()) { me = next; emit(); }
    return next;
  },
};

export function useMe() {
  return useSyncExternalStore(account.subscribe, account.get, account.get);
}

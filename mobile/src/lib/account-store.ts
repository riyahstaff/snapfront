import { useSyncExternalStore } from "react";
import { api, type Me } from "./api";

/** The signed-in store and its account (plan, usage, other stores), shared by every screen. */
let me: Me | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const account = {
  subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); },
  get: () => me,
  set(next: Me) { me = next; emit(); },
  clear() { me = null; emit(); },
  async refresh() {
    const next = await api.me();
    me = next; emit();
    return next;
  },
};

export function useMe() {
  return useSyncExternalStore(account.subscribe, account.get, account.get);
}

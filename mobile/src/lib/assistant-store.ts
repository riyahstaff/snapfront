import { useSyncExternalStore } from "react";
import { api, ApiError, type AgentEvent, type AgentProduct, type ChatMessage } from "./api";

/** One turn in the assistant chat, as the screen shows it. */
export type Turn = {
  id: string;
  role: "user" | "assistant";
  text: string;
  steps?: { label: string; failed?: boolean }[];
  products?: AgentProduct[];
  status?: "working" | "done" | "error";
};

type State = { turns: Turn[]; busy: boolean };
let state: State = { turns: [], busy: false };
const listeners = new Set<() => void>();
const set = (next: Partial<State>) => { state = { ...state, ...next }; listeners.forEach((l) => l()); };
const patchTurn = (id: string, p: Partial<Turn>) => set({ turns: state.turns.map((t) => (t.id === id ? { ...t, ...p } : t)) });
const uid = () => Math.random().toString(36).slice(2);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Kept at module level so the conversation survives switching tabs. */
export const assistant = {
  subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); },
  get: () => state,
  clear() { if (!state.busy) set({ turns: [] }); },

  async send(text: string) {
    const msg = text.trim();
    if (!msg || state.busy) return;
    const user: Turn = { id: uid(), role: "user", text: msg };
    const reply: Turn = { id: uid(), role: "assistant", text: "", steps: [], products: [], status: "working" };
    const history: ChatMessage[] = [...state.turns, user]
      .filter((t) => t.text && t.status !== "error" && t.status !== "working")
      .map((t) => ({ role: t.role, content: t.text }));
    set({ turns: [...state.turns, user, reply], busy: true });

    try {
      const { id } = await api.agentStart(history);
      let after = 0;
      const steps: NonNullable<Turn["steps"]> = [];
      const products = new Map<string, AgentProduct>();
      for (;;) {
        await sleep(1500);
        const run = await api.agentRun(id, after);
        after = run.next;
        for (const e of run.events as AgentEvent[]) {
          if (e.type === "step") steps.push({ label: e.label });
          if (e.type === "step_failed") steps.push({ label: e.label, failed: true });
          if (e.type === "product") products.set(e.product.id, e.product);
        }
        patchTurn(reply.id, { steps: [...steps], products: [...products.values()] });
        if (run.status === "done") { patchTurn(reply.id, { text: run.reply || "Done.", status: "done" }); break; }
        if (run.status === "error") { patchTurn(reply.id, { text: run.error || "Something went wrong. Try again.", status: "error" }); break; }
      }
    } catch (e) {
      patchTurn(reply.id, { text: e instanceof ApiError ? e.message : "Couldn't reach Snapfront. Check your connection and try again.", status: "error" });
    } finally {
      set({ busy: false });
    }
  },
};

export function useAssistant() {
  return useSyncExternalStore(assistant.subscribe, assistant.get, assistant.get);
}

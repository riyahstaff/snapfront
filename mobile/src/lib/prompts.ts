// The bonus prompt library: loaded once per app session, then shared by the list and the prompt screen.
// Sending a prompt opens Claude or ChatGPT with it already typed in (and copies it, in case the app
// that opens drops the text), so a seller whose Snapfront connector is set up there just presses send.
import { Linking } from "react-native";
import * as Clipboard from "expo-clipboard";
import { api, type PromptLibrary } from "./api";

let cache: PromptLibrary | null = null;
let loading: Promise<PromptLibrary> | null = null;

export function loadPrompts(): Promise<PromptLibrary> {
  if (cache) return Promise.resolve(cache);
  if (!loading) {
    loading = api.prompts().then((lib) => { cache = lib; return lib; }).finally(() => { loading = null; });
  }
  return loading;
}
export const cachedPrompts = () => cache;

/** The distinct [BLANKS] in a prompt, in the order they first appear. */
export function blanksIn(text: string): string[] {
  const seen = new Set<string>();
  for (const m of text.matchAll(/\[([^\]\n]{1,120})\]/g)) seen.add(m[1]);
  return [...seen];
}

/** The prompt with each filled-in blank replaced; blanks left empty stay as [BLANK] for the assistant to ask about. */
export function fillBlanks(text: string, values: Record<string, string>): string {
  return text.replace(/\[([^\]\n]{1,120})\]/g, (whole, name: string) => {
    const v = (values[name] || "").trim();
    return v ? v : whole;
  });
}

/** A starting value for a blank, from what Snapfront already knows (the store's name). */
export function suggestFor(blank: string, store: { name?: string | null }): string {
  if (/^(STORE NAME|YOUR STORE|MY STORE|BUSINESS NAME|BRAND NAME)\b/i.test(blank) && store.name) return store.name;
  return "";
}

/** Blanks that ask for one of the seller's products, so the screen can offer them as choices. */
export const asksForProduct = (blank: string) => /^(PRODUCT NAME|PRODUCT|DIGITAL PRODUCT|PHYSICAL PRODUCT|YOUR PRODUCT)\b/i.test(blank);

export type Assistant = "claude" | "chatgpt";
export const ASSISTANTS: Record<Assistant, { name: string; url: (text: string) => string }> = {
  claude: { name: "Claude", url: (t) => `https://claude.ai/new?q=${encodeURIComponent(t)}` },
  chatgpt: { name: "ChatGPT", url: (t) => `https://chatgpt.com/?q=${encodeURIComponent(t)}` },
};

/** Copy the prompt, then open a new chat in Claude or ChatGPT with it filled in. */
export async function sendTo(assistant: Assistant, text: string): Promise<void> {
  try { await Clipboard.setStringAsync(text); } catch { /* opening still works without the copy */ }
  await Linking.openURL(ASSISTANTS[assistant].url(text));
}

export async function copyPrompt(text: string): Promise<boolean> {
  try { await Clipboard.setStringAsync(text); return true; } catch { return false; }
}

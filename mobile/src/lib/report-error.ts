// Sends crashes the app sees to Snapfront's server, which forwards them to Sentry (with personal
// details removed there). Each distinct error is sent once per session, at most 10 per session.
import { Platform } from "react-native";
import { API_URL } from "@/lib/api";

const sent = new Set<string>();
export function reportError(error: unknown, where = "") {
  try {
    const e = error instanceof Error ? error : new Error(String(error));
    const key = `${e.message}|${where}`;
    if (sent.has(key) || sent.size >= 10) return;
    sent.add(key);
    const path = Platform.OS === "web" && typeof window !== "undefined" ? window.location.pathname : where;
    fetch(`${API_URL}/api/client-error`, {
      method: "POST", headers: { "Content-Type": "application/json", "X-Snapfront-App": Platform.OS },
      body: JSON.stringify({ message: e.message, stack: e.stack, path }),
    }).catch(() => {});
  } catch { /* reporting must never break the app */ }
}

let installed = false;
/** Web: catch errors and failed promises nobody handled. */
export function installErrorReporting() {
  if (installed || Platform.OS !== "web" || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("error", (ev) => reportError(ev.error ?? ev.message));
  window.addEventListener("unhandledrejection", (ev) => {
    const r = (ev as PromiseRejectionEvent).reason;
    // Expected API refusals (a 4xx the screen already shows) aren't crashes.
    if (r && typeof r === "object" && "status" in r && Number((r as { status: number }).status) > 0 && Number((r as { status: number }).status) < 500) return;
    reportError(r);
  });
}

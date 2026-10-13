// Web stand-in for React Native's Alert (react-native-web's does nothing). Shows the same title,
// message and buttons as a small dialog in Snapfront's graphite and platinum look, so confirmations
// and choices like "Take photo / Choose from library" work in the browser.
// Wired in by metro.config.js for web builds only.
type Button = { text?: string; onPress?: (value?: string) => void; style?: "default" | "cancel" | "destructive" };

const C = { scrim: "rgba(5,6,8,0.66)", bg: "#14171C", line: "#363C46", ink: "#F5F6F8", muted: "#ADB4BF", accent: "#E5E9F0", onAccent: "#11151B", bad: "#FFA89C" };
const FONT = "Figtree_400Regular, Figtree, system-ui, -apple-system, 'Segoe UI', sans-serif";
const FONT_BOLD = "Figtree_700Bold, Figtree, system-ui, -apple-system, 'Segoe UI', sans-serif";

function el<K extends keyof HTMLElementTagNameMap>(tag: K, style: Partial<CSSStyleDeclaration>, text?: string) {
  const e = document.createElement(tag);
  Object.assign(e.style, style);
  if (text != null) e.textContent = text;
  return e;
}

function show(title: string, message?: string, buttons?: Button[], options?: { cancelable?: boolean; onDismiss?: () => void }) {
  if (typeof document === "undefined") return;
  const list: Button[] = buttons && buttons.length ? buttons : [{ text: "OK" }];
  const cancel = list.find((b) => b.style === "cancel");
  const previous = document.activeElement as HTMLElement | null;

  const scrim = el("div", { position: "fixed", inset: "0", background: C.scrim, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", zIndex: "2147483000" });
  const box = el("div", { background: C.bg, border: `1px solid ${C.line}`, borderRadius: "18px", width: "100%", maxWidth: "400px", padding: "22px", boxShadow: "0 24px 64px rgba(0,0,0,0.55)", display: "flex", flexDirection: "column", gap: "10px", fontFamily: FONT, color: C.ink });
  box.setAttribute("role", "alertdialog");
  box.setAttribute("aria-modal", "true");
  const h = el("h2", { margin: "0", fontFamily: FONT_BOLD, fontSize: "18px", lineHeight: "24px", color: C.ink }, title);
  h.id = `sf-alert-${Date.now()}`;
  box.setAttribute("aria-labelledby", h.id);
  box.appendChild(h);
  if (message) box.appendChild(el("p", { margin: "0", fontSize: "15px", lineHeight: "22px", color: C.muted, whiteSpace: "pre-wrap" }, message));

  const row = el("div", { display: "flex", flexDirection: list.length > 2 ? "column" : "row", gap: "8px", marginTop: "10px" });
  let closed = false;
  const close = (b?: Button) => {
    if (closed) return;
    closed = true;
    document.removeEventListener("keydown", onKey, true);
    scrim.remove();
    previous?.focus?.();
    if (b) b.onPress?.(); else options?.onDismiss?.();
  };
  // Two buttons sit side by side in the order given (Cancel, then the action); longer lists stack with Cancel last.
  const ordered = list.length > 2 ? [...list.filter((b) => b.style !== "cancel"), ...list.filter((b) => b.style === "cancel")] : list;
  const primary = list.length === 1 ? list[0] : list.find((b) => b.style !== "cancel" && b.style !== "destructive") ?? list.find((b) => b.style !== "cancel");
  const btns: HTMLButtonElement[] = [];
  for (const b of ordered) {
    const isPrimary = b === primary && b.style !== "destructive";
    const btn = el("button", {
      flex: list.length > 2 ? "none" : "1", minHeight: "44px", borderRadius: "999px", padding: "10px 18px", cursor: "pointer",
      fontFamily: FONT_BOLD, fontSize: "15px", border: `1px solid ${isPrimary ? C.accent : C.line}`,
      background: isPrimary ? C.accent : "transparent", color: isPrimary ? C.onAccent : b.style === "destructive" ? C.bad : C.ink,
    }, b.text || "OK") as HTMLButtonElement;
    btn.type = "button";
    btn.addEventListener("click", () => close(b));
    btn.addEventListener("focus", () => { btn.style.outline = `2px solid ${C.accent}`; btn.style.outlineOffset = "2px"; });
    btn.addEventListener("blur", () => { btn.style.outline = "none"; });
    row.appendChild(btn);
    btns.push(btn);
  }
  box.appendChild(row);
  scrim.appendChild(box);
  const dismissable = Boolean(cancel) || options?.cancelable || list.length === 1;
  scrim.addEventListener("click", (e) => { if (e.target === scrim && dismissable) close(cancel ?? (list.length === 1 ? list[0] : undefined)); });
  function onKey(e: KeyboardEvent) {
    if (e.key === "Escape" && dismissable) { e.preventDefault(); close(cancel ?? (list.length === 1 ? list[0] : undefined)); }
    if (e.key === "Tab") {   // keep focus inside the dialog
      const i = btns.indexOf(document.activeElement as HTMLButtonElement);
      e.preventDefault();
      btns[(i + (e.shiftKey ? -1 : 1) + btns.length) % btns.length]?.focus();
    }
  }
  document.addEventListener("keydown", onKey, true);
  document.body.appendChild(scrim);
  (btns[ordered.indexOf(primary as Button)] ?? btns[0])?.focus();
}

class Alert {
  static alert(title: string, message?: string, buttons?: Button[], options?: { cancelable?: boolean; onDismiss?: () => void }) {
    show(title, message, buttons, options);
  }
  static prompt(title: string, message?: string, callbackOrButtons?: ((text: string) => void) | Button[], _type?: string, defaultValue?: string) {
    const v = typeof window !== "undefined" ? window.prompt([title, message].filter(Boolean).join("\n\n"), defaultValue ?? "") : null;
    if (v == null) return;
    if (typeof callbackOrButtons === "function") callbackOrButtons(v);
    else callbackOrButtons?.find((b) => b.style !== "cancel")?.onPress?.(v);
  }
}
export default Alert;

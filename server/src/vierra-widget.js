// The <script> tag that puts "Ask Vierra" on a page. The widget file's hash is in its address, so
// browsers fetch a new copy after each change even though /site files are cached for 30 days.
import fs from "node:fs";
import crypto from "node:crypto";

export const SDK_VERSION = "1.26.0";   // @elevenlabs/client, served from assets/vierra
const WIDGET = new URL("../assets/site/vierra/vierra.js", import.meta.url);
let version = null;
const widgetVersion = () => (version ??= crypto.createHash("sha256").update(fs.readFileSync(WIDGET)).digest("hex").slice(0, 10));

/** The tag, or "" when Vierra is switched off (no ElevenLabs key or VIERRA_ENABLED=false). */
export function vierraTag({ hidden = false } = {}) {
  if (!String(process.env.ELEVENLABS_API_KEY || "").trim() || process.env.VIERRA_ENABLED === "false") return "";
  return `<script src="/site/vierra/vierra.js?v=${widgetVersion()}" data-sdk="/site/vierra/elevenlabs-client-${SDK_VERSION}.js"${hidden ? " data-hidden" : ""} defer></script>`;
}

/** The web app's index.html with Vierra added, hidden until the app's Home screen shows her. */
let appPage = null;   // { mtimeMs, html }
export function withVierra(file) {
  const st = fs.statSync(file);
  if (!appPage || appPage.mtimeMs !== st.mtimeMs) {
    const html = fs.readFileSync(file, "utf8");
    const tag = vierraTag({ hidden: true });
    appPage = { mtimeMs: st.mtimeMs, html: tag && html.includes("</body>") ? html.replace("</body>", `${tag}</body>`) : html };
  }
  return appPage.html;
}

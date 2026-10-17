// The Snapfront community (Discord and Whop) and other settings Snapfront's owner changes without a
// redeploy: invite links, the live-coaching schedule, and affiliate links to UGC marketplaces.
import { db } from "./db.js";
import { httpError } from "./claude.js";
import * as plans from "./plans.js";

db.exec("CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT (datetime('now')))");

// Owner-editable settings and what each one is.
export const SETTINGS = {
  discord_url: "Discord invite link for members (https://discord.gg/...)",
  whop_url: "Snapfront's Whop page (https://whop.com/...)",
  live_schedule: "When live coaching happens, e.g. Thursdays at 8 PM Eastern",
  insense_url: "Insense link (your Insense affiliate link, for stores that want UGC)",
  joinbrands_url: "JoinBrands link (your JoinBrands affiliate link)",
};
const URL_KEYS = new Set(["discord_url", "whop_url", "insense_url", "joinbrands_url"]);
// A link set on the server (e.g. JOINBRANDS_URL on Railway) wins over one saved with the admin token,
// so it can be set without the admin token. Only https links are used.
function fromEnv(key) {
  const v = String(process.env[key.toUpperCase()] || "").trim();
  if (!v) return "";
  if (!URL_KEYS.has(key)) return v.slice(0, 500);
  try { const u = new URL(v); return u.protocol === "https:" ? u.href : ""; } catch { return ""; }
}
export function get(key) { return fromEnv(key) || db.prepare("SELECT value FROM app_settings WHERE key = ?").get(key)?.value || ""; }
export function all() { return Object.fromEntries(Object.keys(SETTINGS).map((k) => [k, get(k)])); }
export function update(b = {}) {
  for (const [k, v] of Object.entries(b)) {
    if (!(k in SETTINGS)) throw httpError(400, `Unknown setting ${k}.`);
    let value = String(v ?? "").trim().slice(0, 500);
    if (value && URL_KEYS.has(k)) {
      try { const u = new URL(value); if (u.protocol !== "https:") throw 0; value = u.href; } catch { throw httpError(400, `${k} must be an https:// link.`); }
    }
    if (value) db.prepare("INSERT INTO app_settings (key, value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')").run(k, value);
    else db.prepare("DELETE FROM app_settings WHERE key = ?").run(k);
  }
  return all();
}

/** What the Community screen shows. Invite links are for members on a paid plan. */
export function view(account) {
  const member = plans.effectivePlan(account) !== "free";
  const s = all();
  return {
    member,
    discord: s.discord_url ? (member ? s.discord_url : null) : null, has_discord: Boolean(s.discord_url),
    whop: s.whop_url || null,
    live_schedule: s.live_schedule || null,
  };
}

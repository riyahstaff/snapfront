// Helpers shared by the supplier connectors (CJdropshipping, Printful, AliExpress).
import crypto from "node:crypto";
import { config } from "./config.js";

/* ---------- sellers' supplier credentials, encrypted at rest ---------- */
// The key derivation string predates Printful/AliExpress; it stays so CJ keys saved earlier still open.
const sealKey = () => crypto.createHash("sha256").update(`cj-key:${config.downloadSecret}`).digest();
export function seal(text) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", sealKey(), iv);
  const ct = Buffer.concat([c.update(String(text), "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), ct]).toString("base64");
}
export function unseal(blob) {
  try {
    const b = Buffer.from(String(blob || ""), "base64");
    const d = crypto.createDecipheriv("aes-256-gcm", sealKey(), b.subarray(0, 12));
    d.setAuthTag(b.subarray(12, 28));
    return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString("utf8");
  } catch { return null; }
}

/* ---------- small shared bits ---------- */
export const r2 = (n) => Math.round(n * 100) / 100;
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** "1.20 -- 3.40", "US $4.10" or 1.2 -> the lowest number. */
export const lowPrice = (v) => {
  if (typeof v === "number") return v;
  const nums = String(v ?? "").replace(/,/g, "").match(/\d+(?:\.\d+)?/g);
  return nums ? Math.min(...nums.map(Number)) : null;
};

export const stripHtml = (h) => String(h || "").replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ").replace(/<br\s*\/?>|<\/p>|<\/li>|<\/div>/gi, "\n")
  .replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"')
  .replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();

export const https = (u) => (typeof u === "string" && /^(https?:)?\/\//.test(u.trim()) ? u.trim().replace(/^\/\//, "https://").replace(/^http:/, "https:") : null);

// Options in a sensible order: colours together, sizes small to large, 40cm before 65cm.
const SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "2XL", "XXXL", "3XL", "4XL", "5XL"];
const sizeKey = (n) => n.replace(/\b(XXS|XS|S|M|L|XL|XXL|2XL|XXXL|3XL|4XL|5XL)\b/gi, (t) => `~${String(SIZES.indexOf(t.toUpperCase())).padStart(2, "0")}`);
export const byOptionName = (x, y) => sizeKey(x.name).localeCompare(sizeKey(y.name), "en", { numeric: true });

export const regionName = (code) => { try { return new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code; } catch { return code; } };

export const US_STATES = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado", CT: "Connecticut", DE: "Delaware",
  DC: "District of Columbia", FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota",
  MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico",
  NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island",
  SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", PR: "Puerto Rico",
};

/** A small time-limited cache, one per connector. */
export function makeCache(max = 500) {
  const m = new Map();
  const get = async (key, ttlMs, fn) => {
    const hit = m.get(key);
    if (hit && hit.at > Date.now() - ttlMs) return hit.v;
    const v = await fn();
    m.set(key, { at: Date.now(), v });
    if (m.size > max) m.delete(m.keys().next().value);
    return v;
  };
  get.clear = () => m.clear();
  return get;
}

/** Split "+15125550100" into {country: "+1", number: "5125550100"} (good enough for the US and Canada). */
export function splitPhone(p) {
  const digits = String(p || "").replace(/[^\d+]/g, "");
  if (!digits) return { country: "", number: "" };
  if (digits.startsWith("+1")) return { country: "+1", number: digits.slice(2) };
  const m = digits.match(/^\+(\d{1,3})(\d{6,})$/);
  return m ? { country: `+${m[1]}`, number: m[2] } : { country: "", number: digits.replace(/^\+/, "") };
}

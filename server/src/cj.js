// CJdropshipping: browse the catalog with Snapfront's own key, and send paid orders to CJ with each
// seller's own key so CJ bills the seller and ships straight to the buyer.
// API: https://developers.cjdropshipping.com/en/api/introduction.html (QPS 1 per account, tokens last 180 days).
import crypto from "node:crypto";
import { config } from "./config.js";
import { db } from "./db.js";
import { httpError } from "./claude.js";

const BASE = "https://developers.cjdropshipping.com/api2.0/v1";
let fetchImpl = (...a) => fetch(...a);
let spacingMs = 1100;
/** Test hooks. */
export function setCjFetch(f, spacing = 0) { fetchImpl = f; spacingMs = spacing; cache.clear(); nextAt.clear(); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const keyHash = (k) => crypto.createHash("sha256").update(`cj:${k}`).digest("hex");

/* ---------- the seller's key, encrypted at rest ---------- */
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

/* ---------- rate limit: one call per second per CJ account ---------- */
const nextAt = new Map();
async function slot(k) {
  const now = Date.now();
  const t = Math.max(now, nextAt.get(k) || 0);
  nextAt.set(k, t + spacingMs);
  if (t > now) await sleep(t - now);
}

/* ---------- access tokens ---------- */
const farFuture = () => new Date(Date.now() + 170 * 86400e3).toISOString();
const when = (s) => { const t = Date.parse(s || ""); return Number.isFinite(t) ? new Date(t).toISOString() : farFuture(); };
const inflight = new Map();

async function raw(k, method, path, { query, body, token } = {}) {
  await slot(k);
  const qs = query ? `?${new URLSearchParams(Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== "").map(([a, v]) => [a, String(v)]))}` : "";
  let res;
  try {
    res = await fetchImpl(`${BASE}${path}${qs}`, {
      method, headers: { "Content-Type": "application/json", ...(token ? { "CJ-Access-Token": token } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    console.error("[cj] network", path, e.message);
    throw httpError(502, "Couldn't reach CJdropshipping. Try again in a minute.");
  }
  const j = await res.json().catch(() => ({}));
  return { res, j };
}

async function token(apiKey, fresh = false) {
  const k = keyHash(apiKey);
  const row = db.prepare("SELECT * FROM cj_tokens WHERE key_hash = ?").get(k);
  if (!fresh && row && Date.parse(row.access_expires) > Date.now() + 86400e3) return row.access_token;
  if (inflight.has(k)) return inflight.get(k);
  const p = (async () => {
    let data = null;
    if (row?.refresh_token && Date.parse(row.refresh_expires) > Date.now() + 3600e3) {
      const { j } = await raw(k, "POST", "/authentication/refreshAccessToken", { body: { refreshToken: row.refresh_token } });
      if (j?.result && j.data?.accessToken) data = j.data;
    }
    if (!data) {
      const { j } = await raw(k, "POST", "/authentication/getAccessToken", { body: { apiKey } });
      if (!j?.result || !j.data?.accessToken) {
        console.error("[cj] token", j?.code, j?.message);
        throw httpError(j?.code === 1601000 || /not find|invalid|apikey/i.test(j?.message || "") ? 400 : 502,
          j?.code === 1601000 || /not find|invalid|apikey/i.test(j?.message || "") ? "CJ didn't accept that API key. Copy it again from CJ: My CJ > Authorization > API." : `CJ sign-in failed: ${j?.message || "no reply"}`);
      }
      data = j.data;
    }
    db.prepare(`INSERT INTO cj_tokens (key_hash, access_token, access_expires, refresh_token, refresh_expires, updated_at) VALUES (?,?,?,?,?,datetime('now'))
      ON CONFLICT(key_hash) DO UPDATE SET access_token=excluded.access_token, access_expires=excluded.access_expires,
      refresh_token=excluded.refresh_token, refresh_expires=excluded.refresh_expires, updated_at=excluded.updated_at`)
      .run(k, data.accessToken, when(data.accessTokenExpiryDate), data.refreshToken || null, when(data.refreshTokenExpiryDate));
    return data.accessToken;
  })().finally(() => inflight.delete(k));
  inflight.set(k, p);
  return p;
}

/** Call a CJ endpoint and return its `data`, refreshing the token once if CJ rejects it. */
async function call(apiKey, method, path, opts = {}, retried = false) {
  const k = keyHash(apiKey);
  const t = await token(apiKey, retried);
  const { res, j } = await raw(k, method, path, { ...opts, token: t });
  if (j?.result === true || j?.code === 200) return j.data;
  const msg = String(j?.message || "");
  if (!retried && (res.status === 401 || j?.code === 1600001 || /token/i.test(msg))) return call(apiKey, method, path, opts, true);
  if (res.status === 429 || j?.code === 1600200 || /too many|frequen|limit/i.test(msg)) throw httpError(429, "CJ is busy right now. Try again in a few seconds.");
  console.error("[cj]", path, res.status, j?.code, msg);
  const e = httpError(502, msg ? `CJ: ${msg}` : "CJdropshipping didn't answer. Try again in a minute.");
  e.cjCode = j?.code;
  throw e;
}

/** Check a key works (used when a seller connects their CJ account). */
export async function verifyKey(apiKey) { await token(apiKey, true); return true; }

/* ---------- catalog (Snapfront's key) ---------- */
const cache = new Map();
async function cached(key, ttlMs, fn) {
  const hit = cache.get(key);
  if (hit && hit.at > Date.now() - ttlMs) return hit.v;
  const v = await fn();
  cache.set(key, { at: Date.now(), v });
  if (cache.size > 500) cache.delete(cache.keys().next().value);
  return v;
}
const platformKey = () => {
  if (!config.cjApiKey) throw httpError(503, "Product search isn't set up yet. Try again later.");
  return config.cjApiKey;
};

/** "1.20 -- 3.40" or "1.2" -> the lowest number. */
export const lowPrice = (v) => {
  if (typeof v === "number") return v;
  const nums = String(v ?? "").replace(/,/g, "").match(/\d+(?:\.\d+)?/g);
  return nums ? Math.min(...nums.map(Number)) : null;
};
const stripHtml = (h) => String(h || "").replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ").replace(/<br\s*\/?>|<\/p>|<\/li>|<\/div>/gi, "\n")
  .replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"')
  .replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
const imageList = (v) => {
  if (Array.isArray(v)) return v;
  if (typeof v === "string" && v.trim().startsWith("[")) { try { return JSON.parse(v); } catch { return []; } }
  return typeof v === "string" && v ? v.split(",") : [];
};
const https = (u) => (typeof u === "string" && /^https?:\/\//.test(u.trim()) ? u.trim().replace(/^http:/, "https:") : null);

export async function search({ q = "", page = 1, size = 20, categoryId } = {}) {
  const key = platformKey();
  const pg = Math.max(1, Math.min(100, Math.floor(Number(page) || 1)));
  const sz = Math.max(1, Math.min(50, Math.floor(Number(size) || 20)));
  const keyWord = String(q || "").trim().slice(0, 100);
  return cached(`s:${keyWord.toLowerCase()}:${pg}:${sz}:${categoryId || ""}`, 60 * 60e3, async () => {
    const data = await call(key, "GET", "/product/listV2", { query: { keyWord, page: pg, size: sz, categoryId } });
    const list = (Array.isArray(data?.content) ? data.content : []).flatMap((c) => (Array.isArray(c?.productList) ? c.productList : []));
    return {
      page: pg, total: Number(data?.totalRecords) || list.length, pages: Number(data?.totalPages) || 1,
      products: list.map((p) => ({
        pid: String(p.id || p.pid || ""), title: String(p.nameEn || p.productNameEn || "").slice(0, 200),
        image: https(p.bigImage || p.productImage), cost: lowPrice(p.sellPrice), sku: p.sku || p.productSku || null,
      })).filter((p) => p.pid && p.title),
    };
  });
}

// Options in a sensible order: colours together, sizes small to large, 40cm before 65cm.
const SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "2XL", "XXXL", "3XL", "4XL", "5XL"];
const sizeKey = (n) => n.replace(/\b(XXS|XS|S|M|L|XL|XXL|2XL|XXXL|3XL|4XL|5XL)\b/gi, (t) => `~${String(SIZES.indexOf(t.toUpperCase())).padStart(2, "0")}`);

function normalizeProduct(d) {
  const variants = (Array.isArray(d?.variants) ? d.variants : []).map((v) => ({
    vid: String(v.vid || ""), sku: String(v.variantSku || ""),
    name: String(v.variantKey || v.variantNameEn || v.variantSku || "").replace(/\s+/g, " ").trim().slice(0, 60),
    cost: lowPrice(v.variantSellPrice), image: https(v.variantImage), weight: Number(v.variantWeight) || null,
  })).filter((v) => v.vid && v.cost > 0).sort((x, y) => sizeKey(x.name).localeCompare(sizeKey(y.name), "en", { numeric: true }));
  const images = [...new Set([d?.bigImage, ...imageList(d?.productImageSet), d?.productImage].map(https).filter(Boolean))].slice(0, 12);
  const costs = variants.map((v) => v.cost);
  return {
    pid: String(d?.pid || ""), title: String(d?.productNameEn || "").slice(0, 200), sku: d?.productSku || null,
    description: stripHtml(d?.description).slice(0, 4000), images,
    option_name: String(d?.productKeyEn || "").replace(/-/g, " / ").slice(0, 30) || "Option",
    cost: costs.length ? Math.min(...costs) : lowPrice(d?.sellPrice),
    variants, weight: Number(d?.productWeight) || null,
  };
}

export async function product(pid) {
  const key = platformKey();
  const id = String(pid || "").trim();
  if (!/^[\w-]{4,64}$/.test(id)) throw httpError(400, "That product id doesn't look right.");
  return cached(`p:${id}`, 6 * 60 * 60e3, async () => {
    const d = await call(key, "GET", "/product/query", { query: { pid: id } });
    if (!d) throw httpError(404, "CJ doesn't have that product any more.");
    return normalizeProduct(d);
  });
}

/** Cheapest way to ship these CJ variants to a country, or null. */
export async function freight({ apiKey = null, to = "US", zip, items, from }) {
  const key = apiKey || platformKey();
  const products = items.map((i) => ({ vid: i.vid, quantity: i.qty || 1 }));
  for (const start of from ? [from] : ["CN", "US"]) {
    const data = await call(key, "POST", "/logistic/freightCalculate", { body: { startCountryCode: start, endCountryCode: to, zip: zip || undefined, products } })
      .catch((e) => { if (e.status === 429) throw e; return null; });
    const opts = (Array.isArray(data) ? data : []).map((o) => ({
      name: String(o.logisticName || ""), price: Number(o.totalPostageFee ?? o.logisticPrice), days: String(o.logisticAging || ""), from: start,
    })).filter((o) => o.name && Number.isFinite(o.price)).sort((a, b) => a.price - b.price);
    if (opts.length) return opts[0];
  }
  return null;
}

export async function shippingEstimate(vid) {
  return cached(`f:${vid}`, 6 * 60 * 60e3, () => freight({ items: [{ vid, qty: 1 }], to: "US" }).catch(() => null));
}

/* ---------- orders (the seller's key) ---------- */
export function createOrder(apiKey, body) { return call(apiKey, "POST", "/shopping/order/createOrderV2", { body }); }
export function orderDetail(apiKey, orderId) { return call(apiKey, "GET", "/shopping/order/getOrderDetail", { query: { orderId } }); }

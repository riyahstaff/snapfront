// CJdropshipping. The catalog can be browsed with Snapfront's key (CJ_API_KEY) or the seller's own;
// orders always go through the seller's own key, so CJ bills the seller and ships to the buyer.
// API: https://developers.cjdropshipping.com/en/api/introduction.html (QPS 1 per account, tokens last 180 days).
import crypto from "node:crypto";
import { config } from "./config.js";
import { db } from "./db.js";
import { httpError } from "./claude.js";
import { byOptionName, https, lowPrice, makeCache, r2, regionName, sleep, stripHtml } from "./supplier-util.js";

export { seal, unseal, lowPrice } from "./supplier-util.js";

const BASE = "https://developers.cjdropshipping.com/api2.0/v1";
let fetchImpl = (...a) => fetch(...a);
let spacingMs = 1100;
const cached = makeCache();
/** Test hooks. */
export function setCjFetch(f, spacing = 0) { fetchImpl = f; spacingMs = spacing; cached.clear(); nextAt.clear(); }

const keyHash = (k) => crypto.createHash("sha256").update(`cj:${k}`).digest("hex");

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
        const badKey = j?.code === 1601000 || /not find|invalid|apikey/i.test(j?.message || "");
        throw httpError(badKey ? 400 : 502, badKey ? "CJ didn't accept that API key. Copy it again from CJ: My CJ > Authorization > API." : `CJ sign-in failed: ${j?.message || "no reply"}`);
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
  throw httpError(502, msg ? `CJ: ${msg}` : "CJdropshipping didn't answer. Try again in a minute.");
}

/** Check a key works (used when a seller connects their CJ account). */
export async function verifyKey(apiKey) { await token(apiKey, true); return true; }

/* ---------- catalog ---------- */
const browseKey = (apiKey) => {
  if (apiKey) return apiKey;
  if (!config.cjApiKey) throw httpError(409, "Connect your CJ account in Store settings to search CJ's catalog.");
  return config.cjApiKey;
};
const imageList = (v) => {
  if (Array.isArray(v)) return v;
  if (typeof v === "string" && v.trim().startsWith("[")) { try { return JSON.parse(v); } catch { return []; } }
  return typeof v === "string" && v ? v.split(",") : [];
};

export async function search({ q = "", page = 1, size = 20, categoryId, apiKey } = {}) {
  const key = browseKey(apiKey);
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

function normalizeProduct(d) {
  const variants = (Array.isArray(d?.variants) ? d.variants : []).map((v) => ({
    vid: String(v.vid || ""), sku: String(v.variantSku || ""),
    name: String(v.variantKey || v.variantNameEn || v.variantSku || "").replace(/\s+/g, " ").trim().slice(0, 60),
    cost: lowPrice(v.variantSellPrice), image: https(v.variantImage), weight: Number(v.variantWeight) || null,
  })).filter((v) => v.vid && v.cost > 0).sort(byOptionName);
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

export async function product(pid, apiKey) {
  const key = browseKey(apiKey);
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
  const key = browseKey(apiKey);
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

export async function shippingEstimate(vid, apiKey) {
  return cached(`f:${vid}`, 6 * 60 * 60e3, () => freight({ apiKey, items: [{ vid, qty: 1 }], to: "US" }).catch(() => null));
}

/* ---------- orders (the seller's key) ---------- */
export function createOrder(apiKey, body) { return call(apiKey, "POST", "/shopping/order/createOrderV2", { body }); }
export function orderDetail(apiKey, orderId) { return call(apiKey, "GET", "/shopping/order/getOrderDetail", { query: { orderId } }); }

/* ---------- the common supplier interface (see suppliers.js) ---------- */
export const adapter = {
  id: "cj",
  name: "CJdropshipping",
  browseWithoutAccount: true,

  async connect(input) {
    const key = String(input?.api_key || "").trim();
    if (key.length < 10 || key.length > 200) throw httpError(400, "Paste your CJ API key. Find it in CJ under My CJ > Authorization > API.");
    await verifyKey(key);
    return { creds: { apiKey: key }, info: {} };
  },

  search: (creds, { q, page }) => search({ q, page, apiKey: creds?.apiKey }),

  async product(creds, pid) {
    const p = await product(pid, creds?.apiKey);
    const cheapest = [...p.variants].sort((x, y) => x.cost - y.cost)[0];
    const shipping = cheapest ? await shippingEstimate(cheapest.vid, creds?.apiKey) : null;
    return { ...p, shipping, landed_cost: p.cost != null ? r2(p.cost + (shipping?.price || 0)) : null };
  },

  async placeOrder(creds, { order, seller, address: a, lines, autoPay }) {
    const ship = await freight({ apiKey: creds.apiKey, to: a.country, zip: a.postal_code, items: lines.map((l) => ({ vid: l.vid, qty: l.qty })) });
    if (!ship) throw httpError(422, `CJ has no shipping method to ${regionName(a.country)} for these items.`);
    const data = await createOrder(creds.apiKey, {
      orderNumber: order.id,
      shippingCountryCode: a.country, shippingCountry: regionName(a.country),
      shippingProvince: String(a.state || a.city || "").slice(0, 50), shippingCity: String(a.city || "").slice(0, 50),
      shippingZip: a.postal_code || undefined, shippingAddress: String(a.line1).slice(0, 500), shippingAddress2: a.line2 ? String(a.line2).slice(0, 500) : undefined,
      shippingCustomerName: String(order.customer_name || "Customer").slice(0, 50), shippingPhone: a.phone ? String(a.phone).slice(0, 20) : undefined,
      logisticName: ship.name, fromCountryCode: ship.from,
      payType: autoPay ? 2 : 3,
      storeName: String(seller.store_name || "").slice(0, 50), remark: `Snapfront order ${order.id}`,
      products: lines.map((l) => ({ vid: l.vid, quantity: l.qty, storeLineItemId: `${order.id}:${l.line.variant_id || l.line.product_id}`.slice(0, 125) })),
    });
    return { supplier_order_id: data?.orderId || data?.orderNumber || null, status: autoPay ? "sent" : "awaiting_payment" };
  },

  async orderStatus(creds, supplierOrderId) {
    const d = await orderDetail(creds.apiKey, supplierOrderId);
    const st = String(d?.orderStatus || "").toUpperCase();
    return {
      status: st === "SHIPPED" ? "shipped" : st === "DELIVERED" ? "delivered" : st === "CANCELLED" ? "canceled"
        : ["CREATED", "IN_CART", "UNPAID"].includes(st) ? "awaiting_payment" : st ? "sent" : null,
      tracking_number: d?.trackNumber ? String(d.trackNumber) : null,
      carrier: d?.trackingProvider || d?.logisticName || null,
      tracking_url: null,
    };
  },
};

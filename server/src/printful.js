// Printful (print on demand), with the seller's own private token from developers.printful.com.
// The seller designs products in Printful; Snapfront lists them, and Printful prints and ships each order.
// API: https://developers.printful.com/docs/ (120 calls a minute).
import { httpError } from "./claude.js";
import { byOptionName, https, makeCache, r2 } from "./supplier-util.js";

const BASE = "https://api.printful.com";
let fetchImpl = (...a) => fetch(...a);
const cached = makeCache(300);
export function setPrintfulFetch(f) { fetchImpl = f; cached.clear(); }   // used by tests

async function call(creds, method, path, { query, body } = {}) {
  const qs = query ? `?${new URLSearchParams(Object.entries(query).filter(([, v]) => v !== undefined && v !== null).map(([k, v]) => [k, String(v)]))}` : "";
  let res;
  try {
    res = await fetchImpl(`${BASE}${path}${qs}`, {
      method,
      headers: {
        Authorization: `Bearer ${creds.token}`, "Content-Type": "application/json",
        ...(creds.storeId ? { "X-PF-Store-Id": String(creds.storeId) } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    console.error("[printful] network", path, e.message);
    throw httpError(502, "Couldn't reach Printful. Try again in a minute.");
  }
  const j = await res.json().catch(() => ({}));
  if (res.ok && (j?.code === 200 || j?.code === undefined)) return j;
  const msg = String(j?.error?.message || (typeof j?.result === "string" ? j.result : "") || "");
  console.error("[printful]", method, path, res.status, msg);
  if (res.status === 401 || res.status === 403) throw httpError(400, "Printful didn't accept that token. Create a new private token in Printful's Developer Portal and paste it again.");
  if (res.status === 429) throw httpError(429, "Printful is busy right now. Try again in a minute.");
  if (res.status === 404) throw httpError(404, "Printful doesn't have that product any more.");
  throw httpError(502, msg ? `Printful: ${msg}` : "Printful didn't answer. Try again in a minute.");
}

/** Catalog cost of a blank (what Printful charges the seller before shipping). */
const variantCost = (creds, variantId) => cached(`c:${variantId}`, 12 * 60 * 60e3, async () => {
  const j = await call(creds, "GET", `/products/variant/${encodeURIComponent(variantId)}`);
  return Number(j?.result?.variant?.price) || null;
});

async function shippingTo(creds, variantId, to = { country_code: "US", state_code: "CA", city: "Los Angeles", zip: "90001" }, qty = 1) {
  const j = await call(creds, "POST", "/shipping/rates", { body: { recipient: to, items: [{ variant_id: String(variantId), quantity: qty }], currency: "USD" } })
    .catch((e) => { if (e.status === 429) throw e; return null; });
  const rates = (Array.isArray(j?.result) ? j.result : []).map((r) => ({
    name: String(r.name || r.id || "Standard"), id: String(r.id || "STANDARD"), price: Number(r.rate),
    days: r.minDeliveryDays && r.maxDeliveryDays ? `${r.minDeliveryDays}-${r.maxDeliveryDays}` : "", from: "Printful",
  })).filter((r) => Number.isFinite(r.price)).sort((a, b) => a.price - b.price);
  return rates[0] || null;
}

const STATUS = { draft: "awaiting_payment", failed: "failed", canceled: "canceled", pending: "sent", inprocess: "sent", onhold: "sent", inreview: "sent", partial: "shipped", fulfilled: "shipped" };

export const adapter = {
  id: "printful",
  name: "Printful",
  browseWithoutAccount: false,

  async connect(input) {
    const token = String(input?.token || input?.api_key || "").trim();
    if (token.length < 20 || token.length > 300) throw httpError(400, "Paste your Printful private token. Create one at developers.printful.com under Your tokens.");
    const creds = { token, storeId: null };
    const j = await call(creds, "GET", "/stores");
    const stores = Array.isArray(j?.result) ? j.result : [];
    if (!stores.length) throw httpError(400, "That Printful account has no store yet. In Printful, add a store (choose \"Manual order platform / API\") and try again.");
    // A store-level token sees just its own store; an account-level one needs to say which store.
    const pick = stores.find((s) => /api|manual|native/i.test(String(s.type || ""))) || stores[0];
    if (stores.length > 1) creds.storeId = pick.id;
    return { creds, info: { store_name: String(pick.name || "Printful store").slice(0, 80) } };
  },

  /** The seller's own Printful products. */
  async search(creds, { q = "", page = 1 }) {
    const all = await cached(`l:${creds.token.slice(-12)}:${creds.storeId || ""}`, 5 * 60e3, async () => {
      const out = [];
      for (let offset = 0; offset < 500; offset += 100) {
        const j = await call(creds, "GET", "/store/products", { query: { offset, limit: 100 } });
        const list = Array.isArray(j?.result) ? j.result : [];
        out.push(...list);
        if (list.length < 100) break;
      }
      return out.filter((p) => !p.is_ignored).map((p) => ({ pid: String(p.id), title: String(p.name || "").slice(0, 200), image: https(p.thumbnail_url), cost: null, sku: p.external_id || null }));
    });
    const term = String(q || "").trim().toLowerCase();
    const hits = term ? all.filter((p) => p.title.toLowerCase().includes(term)) : all;
    const size = 20, pg = Math.max(1, Math.floor(Number(page) || 1));
    return { page: pg, total: hits.length, pages: Math.max(1, Math.ceil(hits.length / size)), products: hits.slice((pg - 1) * size, pg * size) };
  },

  async product(creds, pid) {
    const id = String(pid || "").trim();
    if (!/^\d{1,20}$/.test(id)) throw httpError(400, "That Printful product id doesn't look right.");
    const j = await call(creds, "GET", `/store/products/${id}`);
    const sp = j?.result?.sync_product || {};
    const svs = (Array.isArray(j?.result?.sync_variants) ? j.result.sync_variants : []).filter((v) => !v.is_ignored && v.variant_id);
    const prefix = `${sp.name || ""} / `;
    const costs = new Map();
    for (const vid of [...new Set(svs.map((v) => v.variant_id))].slice(0, 40)) costs.set(vid, await variantCost(creds, vid).catch(() => null));
    const variants = svs.map((v) => {
      const preview = (Array.isArray(v.files) ? v.files : []).find((f) => f.type === "preview" && f.preview_url)?.preview_url;
      const name = (String(v.name || "").startsWith(prefix) ? String(v.name).slice(prefix.length) : [v.color, v.size].filter(Boolean).join(" / ") || String(v.name || "")).slice(0, 60);
      return { vid: String(v.id), sku: String(v.sku || v.external_id || v.id), name, cost: costs.get(v.variant_id), image: https(preview || v.product?.image), retail: Number(v.retail_price) || null, catalog: v.variant_id };
    }).filter((v) => v.cost > 0).sort(byOptionName);
    const images = [...new Set([sp.thumbnail_url, ...variants.map((v) => v.image)].map(https).filter(Boolean))].slice(0, 12);
    const cheapest = [...variants].sort((a, b) => a.cost - b.cost)[0];
    const shipping = cheapest ? await cached(`f:${cheapest.catalog}`, 6 * 60 * 60e3, () => shippingTo(creds, cheapest.catalog)) : null;
    const retail = variants.map((v) => v.retail).filter(Boolean);
    const cost = cheapest?.cost ?? null;
    return {
      pid: String(sp.id || id), title: String(sp.name || "").slice(0, 200), description: "", images,
      option_name: variants.some((v) => v.name.includes(" / ")) ? "Colour / Size" : "Option",
      cost, variants: variants.map(({ retail: _r, catalog: _c, ...v }) => v), shipping,
      landed_cost: cost != null ? r2(cost + (shipping?.price || 0)) : null,
      suggested_price: retail.length ? Math.min(...retail) : null,
      design: true,   // the seller's own design: no point comparing prices on Amazon
    };
  },

  async placeOrder(creds, { order, address: a, lines, autoPay }) {
    const j = await call(creds, "POST", "/orders", {
      query: { confirm: autoPay ? "true" : "false" },
      body: {
        external_id: order.id.replace(/[^\w-]/g, "").slice(0, 32), shipping: "STANDARD",
        recipient: {
          name: String(order.customer_name || "Customer").slice(0, 100), address1: a.line1, address2: a.line2 || undefined,
          city: a.city, state_code: a.state || undefined, country_code: a.country, zip: a.postal_code || undefined, phone: a.phone || undefined,
        },
        items: lines.map((l) => ({ sync_variant_id: Number(l.vid), quantity: l.qty, retail_price: (l.line.unit_cents / 100).toFixed(2) })),
      },
    });
    const o = j?.result || {};
    return { supplier_order_id: o.id ? String(o.id) : null, status: o.status === "draft" ? "awaiting_payment" : "sent" };
  },

  async orderStatus(creds, supplierOrderId) {
    const j = await call(creds, "GET", `/orders/${encodeURIComponent(supplierOrderId)}`);
    const o = j?.result || {};
    const s = (Array.isArray(o.shipments) ? o.shipments : []).find((x) => x.tracking_number) || null;
    return { status: STATUS[o.status] || null, tracking_number: s?.tracking_number || null, carrier: s?.carrier || s?.service || null, tracking_url: https(s?.tracking_url) };
  },
};

// Dropshipping flow for every supplier (CJdropshipping, Printful, AliExpress): add a supplier's product
// to a store (AI copy, a sensible price), send paid orders to the seller's own supplier account, and
// bring tracking back.
import crypto from "node:crypto";
import { config, dirs } from "./config.js";
import { db } from "./db.js";
import { httpError, productFromPhoto, sniffImage } from "./claude.js";
import { writeFileSafe } from "./artwork.js";
import { r2 } from "./supplier-util.js";
import * as suppliers from "./suppliers.js";
import * as plans from "./plans.js";
import * as research from "./research.js";
import * as store from "./store.js";

let fetchImage = (...a) => fetch(...a);
export function setImageFetch(f) { fetchImage = f; }   // used by tests

const money = (n) => `$${n.toFixed(2)}`;
const IMAGE_EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };

async function downloadImage(url, supplierName) {
  const res = await fetchImage(url).catch(() => null);
  if (!res?.ok) throw httpError(502, `Couldn't download this product's photo from ${supplierName}. Try another product.`);
  const buf = Buffer.from(await res.arrayBuffer());
  // Supplier image servers often mislabel JPEGs as PNG, so go by the file itself.
  const type = sniffImage(buf);
  if (!type || buf.length < 100 || buf.length > 10 * 1024 * 1024) throw httpError(502, "This product's photo is unusable. Try another product.");
  return { buf, type, ext: IMAGE_EXT[type] };
}

/** Retail price from a landed cost when there's no market data: about 2.5x, at least $4 over cost. */
const markup = (landed) => research.charm(Math.max(landed * 2.5, landed + 4));

/* ---------- browsing ---------- */
export function search(account, source, { q, page }) {
  return suppliers.withCreds(account.id, source, (creds) => suppliers.adapterFor(source).search(creds, { q, page }));
}

/** What a seller sees before importing: details, options, and the cost including shipping to the US. */
export async function preview(account, source, pid) {
  const a = suppliers.adapterFor(source);
  const p = await suppliers.withCreds(account.id, source, (creds) => a.product(creds, pid));
  return { ...p, source, supplier_name: a.name };
}

/**
 * Turn a supplier's product into a draft listing in this store. Uses one AI product page from the plan,
 * and a price check too when there's one left, no price was given and it isn't the seller's own design.
 */
export async function importProduct(account, seller, source, pid, { price, vids, priceCheck = true } = {}) {
  plans.assertAllowance(account, "photo");
  const a = suppliers.adapterFor(source);
  const p = await preview(account, source, pid);
  if (!p.images.length) throw httpError(422, `This product has no photos on ${a.name}, so it can't be listed.`);
  let variants = p.variants;
  if (Array.isArray(vids) && vids.length) variants = variants.filter((v) => vids.includes(v.vid));
  if (!variants.length) throw httpError(400, p.variants.length ? "Choose at least one option to sell." : `${a.name} has no options of this product in stock.`);
  variants = variants.slice(0, 30);

  const img = await downloadImage(p.images[0], a.name);
  const image_file = writeFileSafe(dirs.images, `${crypto.randomUUID()}.${img.ext}`, img.buf);
  const image_url = `${config.publicUrl}/img/${image_file}`;

  const hint = `Supplier listing title: "${p.title}". Supplier details: ${p.description.slice(0, 1500) || "none"}.
Write fresh copy in your own words for an independent shop. Never mention the supplier, ${a.name}, wholesale, dropshipping or shipping from overseas, and leave out supplier SKUs and model codes.`;
  const copy = await productFromPhoto({ imageBase64: img.buf.toString("base64"), mediaType: img.type, kind: "physical", hint, price: null, tone: "warm and friendly" });

  const minCost = Math.min(...variants.map((v) => v.cost));
  const landed = r2(minCost + (p.shipping?.price || 0));
  let market = null;
  let basis = null;
  let finalPrice = Number(price) > 0 ? r2(Number(price)) : null;
  if (finalPrice) basis = "the price you set";
  if (!finalPrice && p.suggested_price > 0) { finalPrice = r2(p.suggested_price); basis = `your price in ${a.name}`; }
  if (!finalPrice && priceCheck && !p.design && config.serpapiKey) {
    try {
      plans.assertAllowance(account, "research");
      market = await research.priceCheck(image_url, landed);
      plans.recordUsage(account, "research");
      finalPrice = market.suggestion?.price || null;
      basis = market.suggestion?.basis || null;
    } catch (e) { if (e.status !== 402) console.error("[import] price check", e.message); }
  }
  if (!finalPrice) { finalPrice = markup(landed); basis = "about 2.5 times your cost including shipping"; }

  // Options that cost more than the cheapest one get the same markup on the difference.
  const ratio = finalPrice / Math.max(landed, 0.01);
  const seen = new Set();
  const rows = variants.map((v) => {
    let name = v.name || v.sku;
    if (seen.has(name.toLowerCase())) name = `${name} (${String(v.sku).slice(-6)})`.slice(0, 60);
    seen.add(name.toLowerCase());
    const extra = v.cost - minCost;
    return { name, sku: v.sku, price: extra > 0.01 ? research.charm(finalPrice + extra * ratio) : null, inventory: null, _v: v };
  });
  const single = rows.length === 1;

  const created = store.createProduct(seller, {
    title: copy.title, tagline: copy.tagline, description: copy.description, bullets: copy.bullets, faq: copy.faq, tags: copy.tags,
    category: copy.category, kind: "physical", price: finalPrice, image_file, alt_text: copy.alt_text, seo_description: copy.seo_description,
    ...(single ? { sku: rows[0].sku } : { option_name: p.option_name, variants: rows.map(({ _v, ...r }) => r) }),
  });
  db.prepare("UPDATE products SET source=?, source_id=?, source_vid=?, source_meta=?, cost_cents=? WHERE id=?")
    .run(source, p.pid, single ? rows[0]._v.vid : null, single ? rows[0]._v.meta || null : null, Math.round(minCost * 100), created.id);
  if (!single) {
    const saved = db.prepare("SELECT id, name FROM product_variants WHERE product_id = ? ORDER BY position").all(created.id);
    for (const r of rows) {
      const v = saved.find((s) => s.name === r.name);
      if (v) db.prepare("UPDATE product_variants SET source_vid=?, source_meta=?, cost_cents=? WHERE id=?").run(r._v.vid, r._v.meta || null, Math.round(r._v.cost * 100), v.id);
    }
  }
  plans.recordUsage(account, "photo");
  const product = store.withPage(seller, db.prepare("SELECT * FROM products WHERE id = ?").get(created.id));
  return {
    product,
    pricing: { price: finalPrice, cost: minCost, shipping: p.shipping, landed_cost: landed, profit: r2(finalPrice - landed), basis,
      warning: finalPrice <= landed ? "This price is at or below your cost, so you'd lose money on each sale. Raise it before publishing."
        : finalPrice - landed < landed * 0.3 ? `That leaves only ${money(finalPrice - landed)} per sale, before payment fees. Most sellers aim for at least ${money(landed * 0.3)}.`
        : market?.suggestion?.warning || null },
    market: market ? { summary: market.summary, matches: market.matches.slice(0, 8) } : null,
  };
}

/* ---------- connections ---------- */
/** Connect (or re-connect) a supplier; orders that were waiting for it go out straight away. */
export async function connect(account, source, input) {
  const out = await suppliers.connect(account.id, source, input);
  if (suppliers.connection(account.id, source)) resendWaiting(account.id, source);
  return out;
}
export function resendWaiting(accountId, source) {
  const waiting = db.prepare(`SELECT f.order_id FROM order_fulfillments f JOIN orders o ON o.id = f.order_id JOIN sellers s ON s.id = o.seller_id
    WHERE s.account_id = ? AND f.supplier = ? AND f.status = 'needs_key' AND o.status = 'paid'`).all(accountId, source);
  for (const o of waiting) sendOrder(o.order_id).catch((e) => console.error("[supplier] resend", o.order_id, e.message));
}

/* ---------- orders ---------- */
/** Supplier lines in an order, grouped by supplier: {cj: [{vid, meta, productId, qty, line}], ...} */
function supplierLines(order) {
  const out = {};
  for (const l of JSON.parse(order.items || "[]")) {
    if (l.kind !== "physical") continue;
    const p = db.prepare("SELECT source, source_id, source_vid, source_meta FROM products WHERE id = ?").get(l.product_id);
    if (!p?.source || !suppliers.ADAPTERS[p.source]) continue;
    const v = l.variant_id ? db.prepare("SELECT source_vid, source_meta FROM product_variants WHERE id = ?").get(l.variant_id) : null;
    const vid = v ? v.source_vid : p.source_vid;
    if (!vid) continue;
    (out[p.source] ||= []).push({ vid, meta: v ? v.source_meta : p.source_meta, productId: p.source_id, qty: l.qty, line: l });
  }
  return out;
}

const fulfillment = (orderId, supplier) => db.prepare("SELECT * FROM order_fulfillments WHERE order_id = ? AND supplier = ?").get(orderId, supplier);

/** Send a paid order's supplier items to each supplier. Safe to call more than once. */
export async function sendOrder(orderId) {
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
  if (!order || order.status !== "paid") return null;
  const groups = supplierLines(order);
  const seller = db.prepare("SELECT * FROM sellers WHERE id = ?").get(order.seller_id);
  const address = order.shipping_address ? JSON.parse(order.shipping_address) : null;

  for (const [source, lines] of Object.entries(groups)) {
    const a = suppliers.adapterFor(source);
    db.prepare("INSERT OR IGNORE INTO order_fulfillments (order_id, supplier, status) VALUES (?, ?, 'new')").run(order.id, source);
    const claimed = db.prepare("UPDATE order_fulfillments SET status = 'sending', error = NULL WHERE order_id = ? AND supplier = ? AND status IN ('new','needs_key','failed')").run(order.id, source);
    if (!claimed.changes) continue;
    const set = (status, error = null, extra = {}) => db.prepare(`UPDATE order_fulfillments SET status = ?, error = ?, supplier_order_id = COALESCE(?, supplier_order_id),
      checked_at = datetime('now') WHERE order_id = ? AND supplier = ?`).run(status, error, extra.supplier_order_id || null, order.id, source);

    const conn = suppliers.connection(seller.account_id, source);
    if (!conn) { set("needs_key", `Connect your ${a.name} account so this order can be sent to ${a.name}.`); continue; }
    if (!address?.country || !address?.line1) { set("failed", "This order has no shipping address."); continue; }
    try {
      const r = await suppliers.withCreds(seller.account_id, source, (creds) => a.placeOrder(creds, { order, seller, address, lines, autoPay: conn.autoPay }));
      set(r.status, null, r);
    } catch (e) {
      console.error(`[${source}] send order`, order.id, e.message);
      set(e.status === 409 && /Connect|Authorize/.test(e.message) ? "needs_key" : "failed", e.message || `${a.name} didn't accept the order.`);
    }
  }
  return db.prepare("SELECT * FROM orders WHERE id = ?").get(order.id);
}

/** Ask each supplier for progress and tracking; marks the order fulfilled once every supplier has shipped. */
export async function syncOrder(orderId) {
  const order = db.prepare("SELECT o.*, s.account_id FROM orders o JOIN sellers s ON s.id = o.seller_id WHERE o.id = ?").get(orderId);
  if (!order) return null;
  for (const f of db.prepare("SELECT * FROM order_fulfillments WHERE order_id = ? AND supplier_order_id IS NOT NULL").all(order.id)) {
    const a = suppliers.ADAPTERS[f.supplier];
    if (!a || !suppliers.connection(order.account_id, f.supplier)) continue;
    db.prepare("UPDATE order_fulfillments SET checked_at = datetime('now') WHERE order_id = ? AND supplier = ?").run(order.id, f.supplier);
    try {
      const s = await suppliers.withCreds(order.account_id, f.supplier, (creds) => a.orderStatus(creds, f.supplier_order_id));
      db.prepare("UPDATE order_fulfillments SET status = ?, tracking_number = ?, tracking_carrier = ?, tracking_url = ? WHERE order_id = ? AND supplier = ?").run(
        s.status || f.status, s.tracking_number ? String(s.tracking_number).slice(0, 100) : f.tracking_number,
        s.carrier ? String(s.carrier).slice(0, 80) : f.tracking_carrier, s.tracking_url || f.tracking_url, order.id, f.supplier);
    } catch (e) { console.error(`[${f.supplier}] sync`, order.id, e.message); }
  }
  // Fulfilled once every physical item comes from a supplier that has shipped it.
  const groups = supplierLines(order);
  const physical = JSON.parse(order.items || "[]").filter((l) => l.kind === "physical").length;
  const supplied = Object.values(groups).reduce((n, g) => n + g.length, 0);
  const all = db.prepare("SELECT status FROM order_fulfillments WHERE order_id = ?").all(order.id);
  if (order.status === "paid" && physical && supplied === physical && all.length === Object.keys(groups).length && all.every((f) => ["shipped", "delivered"].includes(f.status))) {
    db.prepare("UPDATE orders SET status='fulfilled', fulfilled_at=datetime('now') WHERE id=? AND status='paid'").run(order.id);
  }
  return db.prepare("SELECT * FROM orders WHERE id = ?").get(order.id);
}

/** Send to suppliers (or retry), then refresh tracking. */
export async function refreshOrder(orderId) {
  await sendOrder(orderId);
  return syncOrder(orderId);
}

/** Background check on supplier orders that haven't arrived yet. */
export async function syncDue(limit = 20) {
  const due = db.prepare(`SELECT DISTINCT order_id FROM order_fulfillments WHERE supplier_order_id IS NOT NULL AND status IN ('awaiting_payment','sent','shipped')
    AND (checked_at IS NULL OR checked_at < datetime('now', '-2 hours')) ORDER BY checked_at LIMIT ?`).all(limit);
  for (const o of due) await syncOrder(o.order_id).catch((e) => console.error("[supplier] sync", o.order_id, e.message));
  return due.length;
}

export const trackingUrl = (n) => (n ? `https://t.17track.net/en#nums=${encodeURIComponent(n)}` : null);

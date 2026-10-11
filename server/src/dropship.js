// Dropshipping flow: add a CJ product to a store (AI copy, market-checked price), connect the seller's
// CJ account, send paid orders to CJ, and bring tracking back.
import crypto from "node:crypto";
import { config, dirs } from "./config.js";
import { db } from "./db.js";
import { httpError, productFromPhoto, sniffImage } from "./claude.js";
import { writeFileSafe } from "./artwork.js";
import * as cj from "./cj.js";
import * as plans from "./plans.js";
import * as research from "./research.js";
import * as store from "./store.js";

let fetchImage = (...a) => fetch(...a);
export function setImageFetch(f) { fetchImage = f; }   // used by tests

const r2 = (n) => Math.round(n * 100) / 100;
const money = (n) => `$${n.toFixed(2)}`;
const IMAGE_EXT = { "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };

async function downloadImage(url) {
  const res = await fetchImage(url).catch(() => null);
  if (!res?.ok) throw httpError(502, "Couldn't download this product's photo from CJ. Try another product.");
  const buf = Buffer.from(await res.arrayBuffer());
  // CJ's image server often labels JPEGs as PNG, so go by the file itself.
  const type = sniffImage(buf);
  if (!type || buf.length < 100 || buf.length > 10 * 1024 * 1024) throw httpError(502, "This product's photo is unusable. Try another product.");
  return { buf, type, ext: IMAGE_EXT[type] };
}

/** Retail price from a landed cost when there's no market data: about 2.5x, at least $4 over cost. */
const markup = (landed) => research.charm(Math.max(landed * 2.5, landed + 4));

/** What a seller sees before importing: CJ details plus shipping to the US. */
export async function preview(pid) {
  const p = await cj.product(pid);
  const cheapest = [...p.variants].sort((x, y) => x.cost - y.cost)[0];
  const ship = cheapest ? await cj.shippingEstimate(cheapest.vid) : null;
  return { ...p, shipping: ship, landed_cost: p.cost != null ? r2(p.cost + (ship?.price || 0)) : null };
}

/**
 * Turn a CJ product into a draft listing in this store. Uses one AI product page from the plan, and a
 * price check too when there's one left and no price was given.
 */
export async function importProduct(account, seller, pid, { price, vids, priceCheck = true } = {}) {
  plans.assertAllowance(account, "photo");
  const p = await preview(pid);
  if (!p.images.length) throw httpError(422, "This product has no photos on CJ, so it can't be listed.");
  let variants = p.variants;
  if (Array.isArray(vids) && vids.length) variants = variants.filter((v) => vids.includes(v.vid));
  if (!variants.length && p.variants.length) throw httpError(400, "Choose at least one option to sell.");
  variants = variants.slice(0, 30);

  const img = await downloadImage(p.images[0]);
  const image_file = writeFileSafe(dirs.images, `${crypto.randomUUID()}.${img.ext}`, img.buf);
  const image_url = `${config.publicUrl}/img/${image_file}`;

  const hint = `Supplier listing title: "${p.title}". Supplier details: ${p.description.slice(0, 1500) || "none"}.
Write fresh copy in your own words for an independent shop. Never mention the supplier, CJ, wholesale, dropshipping or shipping from overseas, and leave out supplier SKUs and model codes.`;
  const copy = await productFromPhoto({ imageBase64: img.buf.toString("base64"), mediaType: img.type, kind: "physical", hint, price: null, tone: "warm and friendly" });

  const minCost = variants.length ? Math.min(...variants.map((v) => v.cost)) : p.cost;
  const landed = r2(minCost + (p.shipping?.price || 0));
  let market = null;
  let finalPrice = Number(price) > 0 ? r2(Number(price)) : null;
  if (!finalPrice && priceCheck && config.serpapiKey) {
    try {
      plans.assertAllowance(account, "research");
      market = await research.priceCheck(image_url, landed);
      plans.recordUsage(account, "research");
      finalPrice = market.suggestion?.price || null;
    } catch (e) { if (e.status !== 402) console.error("[import] price check", e.message); }
  }
  if (!finalPrice) finalPrice = markup(landed);

  // Options that cost more than the cheapest one get the same markup on the difference.
  const ratio = finalPrice / Math.max(landed, 0.01);
  const seen = new Set();
  const rows = variants.map((v) => {
    let name = v.name || v.sku;
    if (seen.has(name.toLowerCase())) name = `${name} (${v.sku.slice(-6)})`.slice(0, 60);
    seen.add(name.toLowerCase());
    const extra = v.cost - minCost;
    return { name, sku: v.sku, price: extra > 0.01 ? research.charm(finalPrice + extra * ratio) : null, inventory: null, _vid: v.vid, _cost: v.cost };
  });
  const single = rows.length === 1;

  const created = store.createProduct(seller, {
    title: copy.title, tagline: copy.tagline, description: copy.description, bullets: copy.bullets, faq: copy.faq, tags: copy.tags,
    category: copy.category, kind: "physical", price: finalPrice, image_file, alt_text: copy.alt_text, seo_description: copy.seo_description,
    ...(single ? { sku: rows[0].sku } : { option_name: p.option_name, variants: rows.map(({ _vid, _cost, ...r }) => r) }),
  });
  db.prepare("UPDATE products SET source='cj', source_id=?, source_vid=?, cost_cents=? WHERE id=?")
    .run(p.pid, single ? rows[0]._vid : null, Math.round(minCost * 100), created.id);
  if (!single) {
    const saved = db.prepare("SELECT id, name FROM product_variants WHERE product_id = ? ORDER BY position").all(created.id);
    for (const r of rows) {
      const v = saved.find((s) => s.name === r.name);
      if (v) db.prepare("UPDATE product_variants SET source_vid=?, cost_cents=? WHERE id=?").run(r._vid, Math.round(r._cost * 100), v.id);
    }
  }
  plans.recordUsage(account, "photo");
  const product = store.withPage(seller, db.prepare("SELECT * FROM products WHERE id = ?").get(created.id));
  return {
    product,
    pricing: { price: finalPrice, cost: minCost, shipping: p.shipping, landed_cost: landed, profit: r2(finalPrice - landed),
      basis: Number(price) > 0 ? "the price you set" : market?.suggestion ? market.suggestion.basis : "about 2.5 times your cost including shipping",
      warning: finalPrice <= landed ? "This price is at or below your cost, so you'd lose money on each sale. Raise it before publishing."
        : finalPrice - landed < landed * 0.3 ? `That leaves only ${money(finalPrice - landed)} per sale, before payment fees. Most sellers aim for at least ${money(landed * 0.3)}.`
        : market?.suggestion?.warning || null },
    market: market ? { summary: market.summary, matches: market.matches.slice(0, 8) } : null,
  };
}

/* ---------- the seller's CJ account ---------- */
export async function connect(account, apiKey, autoPay) {
  const key = String(apiKey || "").trim();
  if (key.length < 10 || key.length > 200) throw httpError(400, "Paste your CJ API key. Find it in CJ under My CJ > Authorization > API.");
  await cj.verifyKey(key);
  db.prepare("UPDATE accounts SET cj_key_enc = ?, cj_auto_pay = ? WHERE id = ?").run(cj.seal(key), autoPay ? 1 : 0, account.id);
  // Orders that were waiting for a CJ account go out now.
  const waiting = db.prepare(`SELECT o.id FROM orders o JOIN sellers s ON s.id = o.seller_id WHERE s.account_id = ? AND o.supplier_status = 'needs_key' AND o.status = 'paid'`).all(account.id);
  for (const o of waiting) sendOrder(o.id).catch((e) => console.error("[cj] resend", o.id, e.message));
  return supplierStatus(plans.getAccount(account.id));
}
export function setAutoPay(account, autoPay) {
  if (!account.cj_key_enc) throw httpError(409, "Connect your CJ account first.");
  db.prepare("UPDATE accounts SET cj_auto_pay = ? WHERE id = ?").run(autoPay ? 1 : 0, account.id);
  return supplierStatus(plans.getAccount(account.id));
}
export function disconnect(account) {
  db.prepare("UPDATE accounts SET cj_key_enc = NULL, cj_auto_pay = 0 WHERE id = ?").run(account.id);
  return supplierStatus(plans.getAccount(account.id));
}
export const supplierStatus = (account) => ({ cj: { connected: Boolean(account?.cj_key_enc), auto_pay: Boolean(account?.cj_auto_pay) } });

/* ---------- orders ---------- */
const regionName = (code) => { try { return new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code; } catch { return code; } };

/** CJ lines in an order: [{vid, qty, line}] */
function cjLines(order) {
  const out = [];
  for (const l of JSON.parse(order.items || "[]")) {
    if (l.kind !== "physical") continue;
    const p = db.prepare("SELECT source, source_vid FROM products WHERE id = ?").get(l.product_id);
    if (p?.source !== "cj") continue;
    const vid = l.variant_id ? db.prepare("SELECT source_vid FROM product_variants WHERE id = ?").get(l.variant_id)?.source_vid : p.source_vid;
    if (vid) out.push({ vid, qty: l.qty, line: l });
  }
  return out;
}

/** Send a paid order's CJ items to CJ. Safe to call more than once. */
export async function sendOrder(orderId) {
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
  if (!order || order.status !== "paid") return null;
  const lines = cjLines(order);
  if (!lines.length) return order;
  const claimed = db.prepare("UPDATE orders SET supplier_status='sending', supplier_error=NULL WHERE id=? AND (supplier_status IS NULL OR supplier_status IN ('needs_key','failed'))").run(order.id);
  if (!claimed.changes) return order;
  const fail = (status, msg) => { db.prepare("UPDATE orders SET supplier_status=?, supplier_error=? WHERE id=?").run(status, msg, order.id); return db.prepare("SELECT * FROM orders WHERE id = ?").get(order.id); };

  const seller = db.prepare("SELECT * FROM sellers WHERE id = ?").get(order.seller_id);
  const account = plans.getAccount(seller.account_id);
  const apiKey = account?.cj_key_enc ? cj.unseal(account.cj_key_enc) : null;
  if (!apiKey) return fail("needs_key", "Connect your CJ account so this order can be sent to CJ.");
  const a = order.shipping_address ? JSON.parse(order.shipping_address) : null;
  if (!a?.country || !a?.line1) return fail("failed", "This order has no shipping address.");

  try {
    const items = lines.map((l) => ({ vid: l.vid, qty: l.qty }));
    const ship = await cj.freight({ apiKey, to: a.country, zip: a.postal_code, items });
    if (!ship) return fail("failed", `CJ has no shipping method to ${regionName(a.country)} for these items.`);
    const data = await cj.createOrder(apiKey, {
      orderNumber: order.id,
      shippingCountryCode: a.country, shippingCountry: regionName(a.country),
      shippingProvince: String(a.state || a.city || "").slice(0, 50), shippingCity: String(a.city || "").slice(0, 50),
      shippingZip: a.postal_code || undefined, shippingAddress: String(a.line1).slice(0, 500), shippingAddress2: a.line2 ? String(a.line2).slice(0, 500) : undefined,
      shippingCustomerName: String(order.customer_name || "Customer").slice(0, 50), shippingPhone: a.phone ? String(a.phone).slice(0, 20) : undefined,
      logisticName: ship.name, fromCountryCode: ship.from,
      payType: account.cj_auto_pay ? 2 : 3,
      storeName: String(seller.store_name || "").slice(0, 50), remark: `Snapfront order ${order.id}`,
      products: lines.map((l) => ({ vid: l.vid, quantity: l.qty, storeLineItemId: `${order.id}:${l.line.variant_id || l.line.product_id}`.slice(0, 125) })),
    });
    const cjId = data?.orderId || data?.orderNumber || null;
    db.prepare("UPDATE orders SET supplier_status=?, supplier_order_id=?, supplier_error=NULL, supplier_checked_at=datetime('now') WHERE id=?")
      .run(account.cj_auto_pay ? "sent" : "awaiting_payment", cjId, order.id);
    return db.prepare("SELECT * FROM orders WHERE id = ?").get(order.id);
  } catch (e) {
    console.error("[cj] send order", order.id, e.message);
    return fail("failed", e.message || "CJ didn't accept the order.");
  }
}

/** Ask CJ for an order's progress and tracking; marks the order fulfilled once it ships. */
export async function syncOrder(orderId) {
  const order = db.prepare("SELECT o.*, s.account_id FROM orders o JOIN sellers s ON s.id = o.seller_id WHERE o.id = ?").get(orderId);
  if (!order?.supplier_order_id) return order;
  const account = plans.getAccount(order.account_id);
  const apiKey = account?.cj_key_enc ? cj.unseal(account.cj_key_enc) : null;
  if (!apiKey) return order;
  db.prepare("UPDATE orders SET supplier_checked_at = datetime('now') WHERE id = ?").run(order.id);
  const d = await cj.orderDetail(apiKey, order.supplier_order_id);
  const st = String(d?.orderStatus || "").toUpperCase();
  const next = st === "SHIPPED" ? "shipped" : st === "DELIVERED" ? "delivered" : st === "CANCELLED" ? "canceled"
    : ["CREATED", "IN_CART", "UNPAID"].includes(st) ? "awaiting_payment" : st ? "sent" : order.supplier_status;
  const track = d?.trackNumber ? String(d.trackNumber).slice(0, 100) : order.tracking_number;
  const carrier = d?.trackingProvider || d?.logisticName || order.tracking_carrier;
  db.prepare("UPDATE orders SET supplier_status=?, tracking_number=?, tracking_carrier=? WHERE id=?").run(next, track || null, carrier ? String(carrier).slice(0, 80) : null, order.id);
  if ((next === "shipped" || next === "delivered") && order.status === "paid") {
    db.prepare("UPDATE orders SET status='fulfilled', fulfilled_at=datetime('now') WHERE id=? AND status='paid'").run(order.id);
  }
  return db.prepare("SELECT * FROM orders WHERE id = ?").get(order.id);
}

/** Background check on orders at CJ that haven't shipped yet. */
export async function syncDue(limit = 20) {
  const due = db.prepare(`SELECT id FROM orders WHERE supplier_order_id IS NOT NULL AND supplier_status IN ('awaiting_payment','sent','shipped')
    AND (supplier_checked_at IS NULL OR supplier_checked_at < datetime('now', '-2 hours')) ORDER BY supplier_checked_at LIMIT ?`).all(limit);
  for (const o of due) await syncOrder(o.id).catch((e) => console.error("[cj] sync", o.id, e.message));
  return due.length;
}

export const trackingUrl = (n) => (n ? `https://t.17track.net/en#nums=${encodeURIComponent(n)}` : null);

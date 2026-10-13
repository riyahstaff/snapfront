// Cart pricing, discount codes, checkout and order finalisation.
// Prices are always re-read from the database: the browser only sends ids and quantities.
import { recoveryParams } from "./growth.js";
import { config } from "./config.js";
import { db, newId, rowToProduct } from "./db.js";
import { httpError } from "./claude.js";
import * as pay from "./payments.js";
import * as plans from "./plans.js";
import { storeOrigin, storeUrl } from "./urls.js";

const DIGITAL_TAX_CODE = "txcd_10302000";   // Digital Books - downloaded - non subscription - with permanent rights
const PHYSICAL_TAX_CODE = "txcd_99999999";  // General - Tangible Goods
const MAX_QTY = 20;

const money = (c) => `$${(c / 100).toFixed(2)}`;

/* ---------- discount codes ---------- */
export const normCode = (c) => String(c || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 32);

export function listDiscounts(seller) {
  return db.prepare("SELECT * FROM discounts WHERE seller_id = ? ORDER BY created_at DESC").all(seller.id).map(publicDiscount);
}
export const publicDiscount = (d) => ({
  id: d.id, code: d.code, kind: d.kind, value: d.value, active: Boolean(d.active), uses: d.uses, max_uses: d.max_uses,
  min_subtotal: d.min_subtotal_cents / 100, expires_at: d.expires_at,
  label: d.kind === "percent" ? `${d.value}% off` : `${money(d.value)} off`,
});

export function createDiscount(seller, b) {
  const code = normCode(b.code);
  if (code.length < 3) throw httpError(400, "Discount codes need at least 3 letters or numbers.");
  const kind = b.kind === "amount" ? "amount" : "percent";
  const value = kind === "percent" ? Math.round(Number(b.percent ?? b.value)) : Math.round(Number(b.amount ?? b.value) * 100);
  if (kind === "percent" && !(value >= 1 && value <= 100)) throw httpError(400, "A percentage discount must be between 1 and 100.");
  if (kind === "amount" && !(value >= 50)) throw httpError(400, "An amount discount must be at least $0.50.");
  if (db.prepare("SELECT 1 FROM discounts WHERE seller_id = ? AND code = ?").get(seller.id, code)) throw httpError(409, `You already have a code called ${code}.`);
  const expires = b.expires_at ? new Date(b.expires_at) : null;
  if (expires && isNaN(expires)) throw httpError(400, "The expiry date isn't a valid date.");
  const id = newId("dsc");
  db.prepare("INSERT INTO discounts (id, seller_id, code, kind, value, min_subtotal_cents, max_uses, expires_at) VALUES (?,?,?,?,?,?,?,?)")
    .run(id, seller.id, code, kind, value, Math.max(0, Math.round(Number(b.min_subtotal || 0) * 100)),
      b.max_uses ? Math.max(1, Math.round(Number(b.max_uses))) : null, expires ? expires.toISOString() : null);
  return publicDiscount(db.prepare("SELECT * FROM discounts WHERE id = ?").get(id));
}

export function updateDiscount(seller, id, b) {
  const d = db.prepare("SELECT * FROM discounts WHERE id = ? AND seller_id = ?").get(String(id), seller.id);
  if (!d) throw httpError(404, "That discount code doesn't exist.");
  if (b.active !== undefined) db.prepare("UPDATE discounts SET active = ? WHERE id = ?").run(b.active ? 1 : 0, d.id);
  return publicDiscount(db.prepare("SELECT * FROM discounts WHERE id = ?").get(d.id));
}

export function deleteDiscount(seller, id) {
  const r = db.prepare("DELETE FROM discounts WHERE id = ? AND seller_id = ?").run(String(id), seller.id);
  if (!r.changes) throw httpError(404, "That discount code doesn't exist.");
}

/** Returns {discount, cents} or throws a buyer-friendly error. */
function applyDiscount(seller, rawCode, subtotal) {
  const code = normCode(rawCode);
  if (!code) return { discount: null, cents: 0 };
  const d = db.prepare("SELECT * FROM discounts WHERE seller_id = ? AND code = ?").get(seller.id, code);
  if (!d || !d.active) throw httpError(400, `The code ${code} isn't valid.`);
  if (d.expires_at && new Date(d.expires_at) < new Date()) throw httpError(400, `The code ${code} has expired.`);
  if (d.max_uses != null && d.uses >= d.max_uses) throw httpError(400, `The code ${code} has been used up.`);
  if (subtotal < d.min_subtotal_cents) throw httpError(400, `The code ${code} needs an order of at least ${money(d.min_subtotal_cents)}.`);
  const cents = d.kind === "percent" ? Math.floor((subtotal * d.value) / 100) : Math.min(d.value, subtotal);
  return { discount: d, cents };
}

/* ---------- cart pricing ---------- */
/** Resolve cart lines against the database and price the whole order. */
export function priceCart(seller, rawItems, code) {
  const items = (Array.isArray(rawItems) ? rawItems : []).slice(0, 50);
  if (!items.length) throw httpError(400, "Your cart is empty.");
  const lines = [];
  for (const it of items) {
    const row = db.prepare("SELECT * FROM products WHERE id = ? AND seller_id = ? AND status = 'live'").get(String(it.product_id || ""), seller.id);
    if (!row) throw httpError(400, "Something in your cart is no longer for sale. Remove it and try again.");
    const variants = db.prepare("SELECT * FROM product_variants WHERE product_id = ? ORDER BY position").all(row.id);
    let variant = null;
    if (variants.length) {
      variant = variants.find((v) => v.id === it.variant_id);
      if (!variant) throw httpError(400, `Choose a ${row.option_name || "option"} for ${row.title}.`);
    }
    const qty = row.kind === "digital" ? 1 : Math.max(1, Math.min(MAX_QTY, Math.floor(Number(it.qty) || 1)));
    const stock = variant ? variant.inventory : row.inventory;
    if (stock != null && stock < qty) {
      throw httpError(409, stock <= 0 ? `${row.title}${variant ? ` (${variant.name})` : ""} is sold out.` : `Only ${stock} of ${row.title}${variant ? ` (${variant.name})` : ""} left.`);
    }
    const unit = variant?.price_cents ?? row.price_cents;
    const key = `${row.id}:${variant?.id || ""}`;
    const existing = lines.find((l) => l.key === key);
    if (existing) { existing.qty = row.kind === "digital" ? 1 : Math.min(MAX_QTY, existing.qty + qty); continue; }
    lines.push({ key, product_id: row.id, variant_id: variant?.id || null, title: row.title, variant: variant?.name || null,
      option_name: row.option_name || null, kind: row.kind, qty, unit_cents: unit, image_file: row.image_file, tax_code: row.tax_code, source: row.source || null });
  }
  const subtotal = lines.reduce((s, l) => s + l.unit_cents * l.qty, 0);
  const { discount, cents: discountCents } = applyDiscount(seller, code, subtotal);
  const physical = lines.some((l) => l.kind === "physical");
  const afterDiscount = subtotal - discountCents;
  const shipping = !physical ? 0
    : seller.free_shipping_over_cents != null && afterDiscount >= seller.free_shipping_over_cents ? 0
    : seller.shipping_flat_cents;
  return { lines, subtotal, discountCents, discount, physical, shipping, total: afterDiscount + shipping };
}

/** Quote for the cart page: same rules as checkout, no side effects. */
export function quote(seller, items, code) {
  const p = priceCart(seller, items, code);
  return { lines: p.lines.map(({ key, image_file, tax_code, ...l }) => l), subtotal: p.subtotal / 100, discount: p.discountCents / 100,
    discount_label: p.discount ? publicDiscount(p.discount).label : null, shipping: p.shipping / 100, total_before_tax: p.total / 100,
    tax_note: seller.tax_enabled ? "Sales tax is added at checkout." : null };
}

/* ---------- checkout ---------- */
export async function startCheckout(seller, items, code) {
  if (!seller.stripe_account_id || !seller.stripe_ready || !plans.storeCanSell(seller)) throw httpError(409, "This store isn't taking orders right now.");
  const p = priceCart(seller, items, code);
  if (p.subtotal - p.discountCents + p.shipping < 50) throw httpError(400, "The order total must be at least $0.50.");
  const orderId = newId("ord");
  db.prepare("INSERT INTO orders (id, seller_id, status, items, subtotal_cents, discount_cents, shipping_cents, total_cents, discount_code) VALUES (?,?,?,?,?,?,?,?,?)")
    .run(orderId, seller.id, "pending", JSON.stringify(p.lines.map(({ key, ...l }) => l)), p.subtotal, p.discountCents, p.shipping,
      p.total, p.discount?.code || null);
  // Pin what this checkout offers before yielding to Stripe. A later seller edit cannot
  // change the file for a payment already started. Pending orders still have no access.
  for (const line of p.lines.filter((line) => line.kind === "digital")) {
    const product = db.prepare("SELECT * FROM products WHERE id=? AND seller_id=?").get(line.product_id, seller.id);
    if (product) db.prepare(`INSERT OR IGNORE INTO digital_order_downloads
      (order_id, product_id, delivery_file, delivery_url, download_name) VALUES (?,?,?,?,?)`)
      .run(orderId, product.id, product.delivery_file || null, product.delivery_url || null, `${product.slug || "download"}.pdf`);
  }

  const tax = Boolean(seller.tax_enabled);
  const line_items = p.lines.map((l) => {
    const image = l.image_file && config.publicUrl.startsWith("https://") ? [`${config.publicUrl}/img/${l.image_file}`] : undefined;
    const price_data = {
      currency: "usd", unit_amount: l.unit_cents,
      product_data: {
        name: l.variant ? `${l.title} (${l.variant})` : l.title, images: image,
        metadata: { snapfront_product: l.product_id, snapfront_variant: l.variant_id || "" },
        ...(tax ? { tax_code: l.tax_code || (l.kind === "digital" ? DIGITAL_TAX_CODE : PHYSICAL_TAX_CODE) } : {}),
      },
      ...(tax ? { tax_behavior: "exclusive" } : {}),
    };
    return { price_data, quantity: l.qty };
  });
  const params = {
    mode: "payment",
    line_items,
    metadata: { snapfront_order: orderId },
    success_url: `${storeOrigin(seller.store_slug)}/thanks?o=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: storeUrl(seller.store_slug, "/cart"),
  };
  if (tax) params.automatic_tax = { enabled: true };
  if (p.physical) {
    params.shipping_address_collection = { allowed_countries: String(seller.ship_countries || "US").split(",").map((c) => c.trim()).filter(Boolean) };
    // Couriers for dropshipped items need a phone number.
    if (p.lines.some((l) => l.source === "cj")) params.phone_number_collection = { enabled: true };
    params.shipping_options = [{ shipping_rate_data: {
      type: "fixed_amount", fixed_amount: { amount: p.shipping, currency: "usd" },
      display_name: p.shipping ? "Standard shipping" : "Free shipping", ...(tax ? { tax_behavior: "exclusive" } : {}),
    } }];
  } else if (tax) {
    params.billing_address_collection = "required";
  }
  const fee = Math.floor(((p.subtotal - p.discountCents) * config.platformFeePercent) / 100);
  if (fee > 0) params.payment_intent_data = { application_fee_amount: fee, metadata: { snapfront_order: orderId } };

  Object.assign(params, recoveryParams(seller));   // Pro: remind buyers who leave checkout
  const session = await pay.createCheckout(seller, params, p.discountCents);
  db.prepare("UPDATE orders SET checkout_session_id = ? WHERE id = ?").run(session.id, orderId);
  return { url: session.url, order_id: orderId };
}

/* ---------- after payment (webhook or thank-you page, whichever comes first) ---------- */
export function finalizeOrder(orderId, session) {
  return db.transaction(() => {
    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
    if (!order) return null;
    if (order.status !== "pending" || session.payment_status !== "paid") return order;
    if (order.checkout_session_id && session.id !== order.checkout_session_id) return order;   // not this order's checkout
    const ship = session.collected_information?.shipping_details || session.shipping_details || null;
    const t = session.total_details || {};
    db.prepare(`UPDATE orders SET status='paid', paid_at=datetime('now'), email=?, customer_name=?, shipping_address=?, checkout_session_id=?,
      subtotal_cents=COALESCE(?, subtotal_cents), discount_cents=COALESCE(?, discount_cents), shipping_cents=COALESCE(?, shipping_cents),
      tax_cents=COALESCE(?, 0), total_cents=COALESCE(?, total_cents) WHERE id=?`)
      .run(session.customer_details?.email || null, ship?.name || session.customer_details?.name || null, ship ? JSON.stringify({ ...(ship.address || ship), ...(session.customer_details?.phone ? { phone: session.customer_details.phone } : {}) }) : null,
        session.id, session.amount_subtotal ?? null, t.amount_discount ?? null, t.amount_shipping ?? null, t.amount_tax ?? null, session.amount_total ?? null, order.id);
    for (const l of JSON.parse(order.items)) {
      if (l.variant_id) db.prepare("UPDATE product_variants SET inventory = MAX(inventory - ?, 0) WHERE id = ? AND inventory IS NOT NULL").run(l.qty, l.variant_id);
      else db.prepare("UPDATE products SET inventory = MAX(inventory - ?, 0) WHERE id = ? AND inventory IS NOT NULL").run(l.qty, l.product_id);
    }
    if (order.discount_code) db.prepare("UPDATE discounts SET uses = uses + 1 WHERE seller_id = ? AND code = ?").run(order.seller_id, order.discount_code);
    return db.prepare("SELECT * FROM orders WHERE id = ?").get(order.id);
  })();
}

/** Download links for the digital items in a paid order. */
export function downloadsFor(order) {
  if (!order || !["paid", "fulfilled"].includes(order.status)) return [];
  return JSON.parse(order.items).filter((l) => l.kind === "digital")
    .map((l) => ({ title: l.title, url: `${config.publicUrl}/d/${pay.downloadToken(l.product_id, order.id)}` }));
}

/**
 * Preserve the attachment a paid buyer purchased immediately before a seller replaces a product's
 * delivery file. Existing rows are never overwritten: an earlier replacement has already pinned
 * that buyer to the correct historical file. This is intentionally called by digital attach rather
 * than by a broad migration of every commerce path.
 */
export function snapshotProductDownloads(product) {
  if (!product || product.kind !== "digital" || (!product.delivery_file && !product.delivery_url)) return 0;
  const orders = db.prepare("SELECT id, items FROM orders WHERE seller_id = ? AND status IN ('paid','fulfilled')").all(product.seller_id);
  const insert = db.prepare(`INSERT OR IGNORE INTO digital_order_downloads
    (order_id, product_id, delivery_file, delivery_url, download_name) VALUES (?,?,?,?,?)`);
  let count = 0;
  for (const order of orders) {
    let lines;
    try { lines = JSON.parse(order.items); } catch { continue; }
    if (!Array.isArray(lines) || !lines.some((line) => line?.kind === "digital" && line.product_id === product.id)) continue;
    const result = insert.run(order.id, product.id, product.delivery_file || null, product.delivery_url || null, `${product.slug || "download"}.pdf`);
    count += result.changes;
  }
  return count;
}

/** Resolve a signed buyer token to its paid order's immutable snapshot, or the current attachment. */
export function downloadFor(orderId, productId) {
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(String(orderId || ""));
  if (!order || !["paid", "fulfilled"].includes(order.status)) return null;
  let lines;
  try { lines = JSON.parse(order.items); } catch { return null; }
  if (!Array.isArray(lines) || !lines.some((line) => line?.kind === "digital" && line.product_id === productId)) return null;
  const pinned = db.prepare("SELECT * FROM digital_order_downloads WHERE order_id = ? AND product_id = ?").get(order.id, String(productId));
  if (pinned) return { delivery_file: pinned.delivery_file, delivery_url: pinned.delivery_url, filename: pinned.download_name || "download.pdf" };
  const product = db.prepare("SELECT * FROM products WHERE id = ? AND seller_id = ?").get(String(productId), order.seller_id);
  if (!product || product.kind !== "digital") return null;
  return { delivery_file: product.delivery_file, delivery_url: product.delivery_url, filename: `${product.slug || "download"}.pdf` };
}

/* ---------- seller views ---------- */
export const publicOrder = (o) => ({
  id: o.id, status: o.status, items: JSON.parse(o.items).map((l) => ({ title: l.title, variant: l.variant, qty: l.qty, kind: l.kind, unit: l.unit_cents / 100 })),
  subtotal: o.subtotal_cents / 100, discount: o.discount_cents / 100, shipping: o.shipping_cents / 100, tax: o.tax_cents / 100, total: o.total_cents / 100,
  discount_code: o.discount_code, email: o.email, customer_name: o.customer_name,
  shipping_address: o.shipping_address ? JSON.parse(o.shipping_address) : null, paid_at: o.paid_at, fulfilled_at: o.fulfilled_at, created_at: o.created_at,
  ...fulfillmentView(o.id),
});

const SUPPLIER_NAMES = { cj: "CJdropshipping", printful: "Printful", aliexpress: "AliExpress" };
const trackUrl = (n) => `https://t.17track.net/en#nums=${encodeURIComponent(n)}`;
/** Each supplier's part of an order. `supplier` and `tracking` keep the shape older app builds read. */
function fulfillmentView(orderId) {
  const rows = db.prepare("SELECT * FROM order_fulfillments WHERE order_id = ? ORDER BY created_at, supplier").all(orderId);
  const fulfillments = rows.map((f) => ({
    supplier: f.supplier, name: SUPPLIER_NAMES[f.supplier] || f.supplier, status: f.status, order_id: f.supplier_order_id, error: f.error,
    tracking: f.tracking_number ? { number: f.tracking_number, carrier: f.tracking_carrier, url: f.tracking_url || trackUrl(f.tracking_number) } : null,
  }));
  const first = fulfillments[0];
  return {
    fulfillments,
    supplier: first ? { name: first.name, status: first.status, order_id: first.order_id, error: first.error } : null,
    tracking: fulfillments.find((f) => f.tracking)?.tracking || null,
  };
}

export function listOrders(seller) {
  return db.prepare("SELECT * FROM orders WHERE seller_id = ? AND status != 'pending' ORDER BY COALESCE(paid_at, created_at) DESC LIMIT 200").all(seller.id).map(publicOrder);
}

export function setOrderStatus(seller, id, status) {
  const o = db.prepare("SELECT * FROM orders WHERE id = ? AND seller_id = ?").get(String(id), seller.id);
  if (!o) throw httpError(404, "That order doesn't exist.");
  if (status !== "fulfilled") throw httpError(400, "Orders can be marked as fulfilled.");
  if (o.status !== "paid") throw httpError(409, o.status === "fulfilled" ? "That order is already fulfilled." : "Only paid orders can be fulfilled.");
  db.prepare("UPDATE orders SET status='fulfilled', fulfilled_at=datetime('now') WHERE id=?").run(o.id);
  return publicOrder(db.prepare("SELECT * FROM orders WHERE id = ?").get(o.id));
}

export { rowToProduct };

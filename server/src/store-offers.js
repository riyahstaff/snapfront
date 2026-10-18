import { db } from "./db.js";
import { httpError } from "./claude.js";
import * as store from "./store.js";

export function validateOffer(seller, input, publishing = false) {
  const raw = input.product_ids ?? JSON.parse(input.bundle_product_ids || "[]");
  if (!Array.isArray(raw) || raw.length > 30) throw httpError(400, "Choose up to 30 digital products.");
  const ids = [...new Set(raw.map(String))];
  const interval = input.billing_interval || null;
  if (interval !== null && !["month", "year"].includes(interval)) throw httpError(400, "Choose monthly, yearly, or one-time billing.");
  if (ids.length < (interval ? 1 : 2)) throw httpError(400, interval ? "Choose at least one digital product." : "A bundle needs at least two different products.");
  const products = ids.map((id) => db.prepare("SELECT * FROM products WHERE id=? AND seller_id=?").get(id, seller.id));
  for (const p of products) {
    if (!p || p.id === input.id || p.kind !== "digital" || p.billing_interval || JSON.parse(p.bundle_product_ids || "[]").length) throw httpError(400, "Choose individual digital products from this store, not other bundles or subscriptions.");
    if (db.prepare("SELECT 1 FROM product_variants WHERE product_id=? LIMIT 1").get(p.id)) throw httpError(400, `Use a product without variants: ${p.title}.`);
    if (p.inventory !== null && p.inventory !== undefined) throw httpError(400, `Set ${p.title} to unlimited stock before including this digital product.`);
    if (!p.delivery_file && !p.delivery_url) throw httpError(400, `Attach a download to ${p.title} first.`);
    if (publishing && p.status !== "live") throw httpError(400, `Publish ${p.title} before selling this offer.`);
  }
  return { ids, interval, products };
}

export function saveOffer(seller, input, id = null) {
  const existing = id ? store.productRow(seller, id) : null;
  if (existing && !JSON.parse(existing.bundle_product_ids || "[]").length) throw httpError(400, "Open the regular product editor for this item.");
  const { ids, interval, products } = validateOffer(seller, { ...input, id }, existing?.status === "live");
  const price = Number(input.price);
  if (!Number.isFinite(price) || price < 0.5 || price > 1000000) throw httpError(400, "Enter a price from $0.50 to $1,000,000.");
  if (!String(input.title || "").trim()) throw httpError(400, "Give your offer a name.");
  return db.transaction(() => {
    const listing = { title: input.title, description: input.description || "", price,
      kind: "digital", category: interval ? "Memberships" : "Bundles",
      tagline: interval ? `Digital access, billed ${interval === "month" ? "monthly" : "yearly"}. Cancel anytime.` : `${ids.length} digital products in one purchase`,
      label: interval ? "Subscription" : "Bundle", image_file: products[0].image_file || undefined };
    const p = existing ? store.updateProduct(seller, id, listing) : store.createProduct(seller, listing);
    db.prepare("UPDATE products SET bundle_product_ids=?, billing_interval=? WHERE id=?").run(JSON.stringify(ids), interval, p.id);
    return store.withPage(seller, store.productRow(seller, p.id));
  })();
}

export function assertProductNotIncluded(product) {
  const rows = db.prepare("SELECT id,title,bundle_product_ids FROM products WHERE seller_id=? AND id!=?").all(product.seller_id, product.id);
  if (rows.some((p) => JSON.parse(p.bundle_product_ids || "[]").includes(product.id))) throw httpError(409, "Remove this product from its bundles and subscriptions before deleting it.");
  const subscriptions = db.prepare("SELECT o.items FROM store_subscriptions s JOIN orders o ON o.id=s.order_id WHERE s.seller_id=? AND s.status NOT IN ('canceled','incomplete_expired')").all(product.seller_id);
  if (subscriptions.some((s) => JSON.parse(s.items).some((l) => l.product_id === product.id || l.deliveries?.some((d) => d.product_id === product.id)))) throw httpError(409, "This product has subscribers. Archive it to stop new sales; keep its files available for existing members.");
}

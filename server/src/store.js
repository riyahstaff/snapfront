// Store operations shared by the HTTP API and the Fable agent, so both follow the same rules.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { config, dirs } from "./config.js";
import { db, newId, slugify, uniqueSlug, rowToProduct } from "./db.js";
import { generateDigitalProduct, httpError, PRODUCT_TYPES } from "./claude.js";
import { renderCover, renderProductPdf, COVER_COLORS, writeFileSafe } from "./artwork.js";
import * as pay from "./payments.js";

export const clampStr = (v, n) => String(v ?? "").slice(0, n);
export const strList = (v, n, len = 200) => (Array.isArray(v) ? v : []).map((x) => clampStr(x, len)).filter(Boolean).slice(0, n);
export const faqList = (v) => (Array.isArray(v) ? v : []).filter((f) => f && f.q).slice(0, 6).map((f) => ({ q: clampStr(f.q, 200), a: clampStr(f.a, 800) }));
export const cents = (v) => Math.max(0, Math.round(Number(v || 0) * 100));

const fresh = (id) => db.prepare("SELECT * FROM sellers WHERE id = ?").get(id);

export const publicSeller = (s) => ({
  id: s.id, store_name: s.store_name, store_slug: s.store_slug, tagline: s.tagline,
  store_url: `${config.publicUrl}/s/${s.store_slug}`, stripe_connected: Boolean(s.stripe_account_id), stripe_ready: Boolean(s.stripe_ready),
});

export const withPage = (seller, row) => ({ ...rowToProduct(row), page_url: `${config.publicUrl}/s/${seller.store_slug}/${row.slug}` });

export function productRow(seller, id) {
  const row = db.prepare("SELECT * FROM products WHERE id = ? AND seller_id = ?").get(String(id || ""), seller.id);
  if (!row) throw httpError(404, "That product doesn't exist.");
  return row;
}

export function listProducts(seller) {
  return db.prepare("SELECT * FROM products WHERE seller_id = ? ORDER BY created_at DESC").all(seller.id).map((r) => withPage(seller, r));
}

export function updateStore(seller, b) {
  const name = b.store_name != null ? clampStr(b.store_name, 80).trim() : seller.store_name;
  const tagline = b.tagline != null ? clampStr(b.tagline, 160) : seller.tagline;
  let slug = seller.store_slug;
  if (b.store_slug) slug = uniqueSlug("sellers", "store_slug", slugify(b.store_slug, 40));
  db.prepare("UPDATE sellers SET store_name = ?, tagline = ?, store_slug = ? WHERE id = ?").run(name || seller.store_name, tagline, slug, seller.id);
  return publicSeller(fresh(seller.id));
}

export function createProduct(seller, b, deliveryFile = null) {
  if (b.delivery_url && !/^https:\/\//.test(b.delivery_url)) throw httpError(400, "The download link must start with https://");
  if (b.image_file && !/^[\w-]+\.(jpg|png|webp|gif)$/.test(b.image_file)) throw httpError(400, "Invalid image reference.");
  const id = newId("prd");
  const slug = uniqueSlug("products", "slug", slugify(b.title), seller.id);
  db.prepare(`INSERT INTO products (id, seller_id, slug, title, tagline, description, bullets, faq, tags, category, kind, price_cents, image_file, alt_text, seo_description, delivery_file, delivery_url)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    id, seller.id, slug, clampStr(b.title, 120) || "Untitled product", clampStr(b.tagline, 160), clampStr(b.description, 3000),
    JSON.stringify(strList(b.bullets, 6)), JSON.stringify(faqList(b.faq)), JSON.stringify(strList(b.tags, 6, 30).map((t) => t.replace(/^#/, ""))),
    clampStr(b.category, 60), b.kind === "digital" ? "digital" : "physical", cents(b.price), b.image_file || null,
    clampStr(b.alt_text, 200), clampStr(b.seo_description || b.tagline, 160), deliveryFile, b.delivery_url ? clampStr(b.delivery_url, 500) : null);
  return withPage(seller, db.prepare("SELECT * FROM products WHERE id = ?").get(id));
}

export function updateProduct(seller, id, b) {
  const row = productRow(seller, id);
  if (b.delivery_url && !/^https:\/\//.test(b.delivery_url)) throw httpError(400, "The download link must start with https://");
  const priceChanged = b.price != null && cents(b.price) !== row.price_cents;
  const next = {
    title: b.title != null ? clampStr(b.title, 120) : row.title,
    tagline: b.tagline != null ? clampStr(b.tagline, 160) : row.tagline,
    description: b.description != null ? clampStr(b.description, 3000) : row.description,
    category: b.category != null ? clampStr(b.category, 60) : row.category,
    price_cents: b.price != null ? cents(b.price) : row.price_cents,
    delivery_url: b.delivery_url !== undefined ? (b.delivery_url ? clampStr(b.delivery_url, 500) : null) : row.delivery_url,
    bullets: Array.isArray(b.bullets) ? JSON.stringify(strList(b.bullets, 6)) : row.bullets,
    tags: Array.isArray(b.tags) ? JSON.stringify(strList(b.tags, 6, 30).map((t) => t.replace(/^#/, ""))) : row.tags,
    faq: Array.isArray(b.faq) ? JSON.stringify(faqList(b.faq)) : row.faq,
  };
  db.prepare("UPDATE products SET title=?, tagline=?, description=?, category=?, price_cents=?, delivery_url=?, bullets=?, tags=?, faq=? WHERE id=?")
    .run(next.title, next.tagline, next.description, next.category, next.price_cents, next.delivery_url, next.bullets, next.tags, next.faq, row.id);
  // A new price needs a new Stripe price + Payment Link; take the product back to draft.
  if (priceChanged && row.status === "live") db.prepare("UPDATE products SET status='draft', payment_link_url=NULL WHERE id=?").run(row.id);
  return withPage(seller, db.prepare("SELECT * FROM products WHERE id = ?").get(row.id));
}

export function deleteProduct(seller, id) {
  const row = productRow(seller, id);
  db.prepare("DELETE FROM products WHERE id = ?").run(row.id);
  for (const [dir, f] of [[dirs.images, row.image_file], [dirs.files, row.delivery_file]]) if (f) fs.rm(path.join(dir, f), { force: true }, () => {});
}

export async function publishProduct(sellerIn, id) {
  let seller = fresh(sellerIn.id);
  const row = productRow(seller, id);
  if (!seller.stripe_account_id) throw httpError(409, "Connect Stripe first so you can get paid.");
  if (!seller.stripe_ready) {
    const ready = await pay.accountReady(seller.stripe_account_id);
    db.prepare("UPDATE sellers SET stripe_ready = ? WHERE id = ?").run(ready ? 1 : 0, seller.id);
    if (!ready) throw httpError(409, "Finish setting up your Stripe account to start selling.");
    seller = fresh(seller.id);
  }
  if (row.price_cents < 50) throw httpError(400, "Set a price of at least $0.50.");
  if (row.kind === "digital" && !row.delivery_file && !row.delivery_url) throw httpError(400, "Add the file buyers will download before publishing.");
  const s = await pay.publishToStripe(seller, rowToProduct(row));
  db.prepare("UPDATE products SET status='live', stripe_product_id=?, stripe_price_id=?, payment_link_url=? WHERE id=?")
    .run(s.stripe_product_id, s.stripe_price_id, s.payment_link_url, row.id);
  return withPage(seller, db.prepare("SELECT * FROM products WHERE id = ?").get(row.id));
}

/** Write a whole digital product, render its cover and PDF, and save it as a draft listing. */
export async function generateProduct(seller, { type = "guide", niche, color = "cobalt", price }) {
  if (!PRODUCT_TYPES[type]) throw httpError(400, `Unknown product type. Use one of: ${Object.keys(PRODUCT_TYPES).join(", ")}.`);
  if (!niche || String(niche).trim().length < 4) throw httpError(400, "Describe who the product is for, in a few words.");
  const r = await generateDigitalProduct({ type, niche: clampStr(niche, 200) });
  const hex = COVER_COLORS[color] || COVER_COLORS.cobalt;
  const cover = renderCover({ title: r.title, tagline: r.tagline, type, color: hex });
  const image_file = writeFileSafe(dirs.images, `${crypto.randomUUID()}.png`, cover);
  const pdf = await renderProductPdf({ ...r, type, storeName: seller.store_name }, cover, hex);
  const delivery_file = writeFileSafe(dirs.files, `${crypto.randomUUID()}.pdf`, pdf);
  return createProduct(seller, {
    title: r.title, tagline: r.tagline, description: r.description, bullets: r.bullets, faq: r.faq, tags: r.tags,
    category: r.category || PRODUCT_TYPES[type].name, kind: "digital", price: price || r.suggested_price || PRODUCT_TYPES[type].price,
    image_file, alt_text: `Cover of ${r.title}`, seo_description: r.tagline,
  }, delivery_file);
}

export function listOrders(seller) {
  return db.prepare(`SELECT o.id, o.email, o.amount_cents, o.created_at, p.title FROM orders o JOIN products p ON p.id = o.product_id
    WHERE p.seller_id = ? ORDER BY o.created_at DESC LIMIT 200`).all(seller.id);
}

export const TRENDS = [
  { name: "Digital planners", why: "Hyperlinked PDF planners for GoodNotes and Notability. Peak season runs October to January.", where: "Etsy, TikTok, Pinterest" },
  { name: "Printable wall art", why: "Minimalist and motivational prints, one of the highest-volume digital categories on Etsy.", where: "Etsy, Pinterest" },
  { name: "Content & hook templates", why: "Hooks, scripts and content calendars for creators and small shops.", where: "TikTok, Instagram" },
  { name: "Spreadsheet templates", why: "Budget, savings and small-business trackers for Excel and Google Sheets.", where: "Etsy, TikTok" },
  { name: "Digital stickers", why: "Transparent PNG sticker packs for iPad planners.", where: "Etsy, Instagram" },
  { name: "Canva templates", why: "Social posts, business cards and branding kits edited in Canva.", where: "Etsy, Instagram" },
  { name: "E-books & mini guides", why: "Short, specific how-to guides tied to a creator's niche.", where: "Instagram, TikTok" },
];

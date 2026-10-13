// Store operations shared by the HTTP API and the Fable agent, so both follow the same rules.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { config, dirs } from "./config.js";
import { ownsSellerImage as ownsImageFile, sellerImageIsStored } from "./media-ownership.js";
import { db, newId, slugify, uniqueSlug, rowToProduct } from "./db.js";
import { designPhotoFiles, IMAGE_FILE } from "./storefront-media.js";
import { generateDigitalProduct, httpError, PRODUCT_TYPES } from "./claude.js";
import { renderCover, renderProductPdf, COVER_COLORS, writeFileSafe } from "./artwork.js";
import * as pay from "./payments.js";
import * as plans from "./plans.js";
import * as urls from "./urls.js";
import { THEME_IDS } from "./themes.js";
import * as growth from "./growth.js";
import { snapshotProductDownloads } from "./commerce.js";
import * as digitalDesigns from "./digital-designs.js";
export const clampStr = (v, n) => String(v ?? "").slice(0, n);
export const strList = (v, n, len = 200) => (Array.isArray(v) ? v : []).map((x) => clampStr(x, len)).filter(Boolean).slice(0, n);
export const faqList = (v) => (Array.isArray(v) ? v : []).filter((f) => f && f.q).slice(0, 6).map((f) => ({ q: clampStr(f.q, 200), a: clampStr(f.a, 800) }));
export const cents = (v) => Math.max(0, Math.round(Number(v || 0) * 100));

const fresh = (id) => db.prepare("SELECT * FROM sellers WHERE id = ?").get(id);

export const publicSeller = (s) => ({
  id: s.id, store_name: s.store_name, store_slug: s.store_slug, tagline: s.tagline,
  store_url: urls.storeUrl(s.store_slug), store_domain: config.storeDomain || null,
  custom_domain: s.custom_domain ? { domain: s.custom_domain, status: s.custom_domain_status || "pending" } : null, stripe_connected: Boolean(s.stripe_account_id), stripe_ready: Boolean(s.stripe_ready),
  shipping_flat: s.shipping_flat_cents / 100,
  free_shipping_over: s.free_shipping_over_cents == null ? null : s.free_shipping_over_cents / 100,
  ship_countries: String(s.ship_countries || "").split(",").filter(Boolean),
  tax_enabled: Boolean(s.tax_enabled),
  theme: THEME_IDS.has(s.theme) ? s.theme : "classic",
  about: s.about || "", announcement: s.announcement || "",
  banner_file: s.banner_file || null,
  banner_url: s.banner_file ? `${config.publicUrl}/img/${s.banner_file}` : null,
  design_photos: designPhotoFiles(s.design_photos).map((image_file) => image_file ? ({ image_file, image_url: `${config.publicUrl}/img/${image_file}` }) : null),
  hero_title: s.hero_title || "", hero_subtitle: s.hero_subtitle || "",
  hero_eyebrow: s.hero_eyebrow || "", hero_cta: s.hero_cta || "",
  hero_motion: ["still", "drift", "pan"].includes(s.hero_motion) ? s.hero_motion : "still",
  links: growth.linksOf(s), abandoned_emails: s.abandoned_emails !== 0, ...(({ links, feeds }) => ({ links_url: links, feeds }))(growth.storeLinks(s)),
});

/** NULL/blank means unlimited stock; otherwise a whole number >= 0. */
const stock = (v) => (v === null || v === undefined || v === "" ? null : Math.max(0, Math.min(1e6, Math.floor(Number(v) || 0))));
const TAX_CODE = /^txcd_\d{8}$/;
const COUNTRY = /^[A-Z]{2}$/;

export const withPage = (seller, row) => ({ ...rowToProduct(row), page_url: urls.storeUrl(seller.store_slug, `/${row.slug}`) });

export function productRow(seller, id) {
  const row = db.prepare("SELECT * FROM products WHERE id = ? AND seller_id = ?").get(String(id || ""), seller.id);
  if (!row) throw httpError(404, "That product doesn't exist.");
  return row;
}

export function listProducts(seller) {
  return db.prepare("SELECT * FROM products WHERE seller_id = ? ORDER BY created_at DESC").all(seller.id).map((r) => withPage(seller, r));
}

export const HERO_LIMITS = { hero_title: 100, hero_subtitle: 220, hero_eyebrow: 48, hero_cta: 32 };

/** Pure validation shared by preview and apply. Uploaded files must belong to this store. */
export function storefrontPatch(seller, b) {
  const out = {};
  if (b.theme != null) {
    if (!THEME_IDS.has(b.theme)) throw httpError(400, "That store look doesn't exist.");
    out.theme = b.theme;
  }
  if (b.hero_motion != null) {
    if (!["still", "drift", "pan"].includes(b.hero_motion)) throw httpError(400, "Choose Still, Gentle float or Slow pan for hero motion.");
    out.hero_motion = b.hero_motion;
  }
  for (const [key, limit] of Object.entries(HERO_LIMITS)) {
    if (b[key] != null) out[key] = clampStr(b[key], limit).replace(/\s+/g, " ").trim();
  }
  if (b.banner_file !== undefined) {
    const file = b.banner_file;
    if (file !== null && (typeof file !== "string" || !IMAGE_FILE.test(file) || !ownsImageFile(seller.id, file) || !fs.existsSync(path.join(dirs.images, file)))) {
      throw httpError(400, "Upload a cover photo to this store before using it.");
    }
    out.banner_file = file;
  }
  if (b.design_photos !== undefined) {
    if (!Array.isArray(b.design_photos) || b.design_photos.length > 2) throw httpError(400, "Use up to two optional supporting photos.");
    const files = b.design_photos.map((file) => {
      if (file === null) return null;
      if (typeof file !== "string" || !IMAGE_FILE.test(file) || !ownsImageFile(seller.id, file) || !fs.existsSync(path.join(dirs.images, file))) {
        throw httpError(400, "Each supporting photo must be an image owned by this store.");
      }
      return file;
    });
    out.design_photos = JSON.stringify(files);
  }
  for (const [key, limit] of Object.entries({ store_name: 80, tagline: 160, about: 600, announcement: 90 })) {
    if (b[key] != null) out[key] = clampStr(b[key], limit).trim();
  }
  if (out.store_name === "") throw httpError(400, "Add a name for your store.");
  return out;
}

export function updateStore(seller, b) {
  const hero = storefrontPatch(seller, b);
  return db.transaction(() => {
  const name = b.store_name != null ? clampStr(b.store_name, 80).trim() : seller.store_name;
  const tagline = b.tagline != null ? clampStr(b.tagline, 160) : seller.tagline;
  // The address follows the name until the seller picks one; an address they type must be free.
  let slug = seller.store_slug;
  if (b.store_slug) slug = urls.checkSlug(b.store_slug, seller.id);
  else if (name && name !== seller.store_name && urls.isDefaultSlug(seller.store_slug)) slug = urls.freeSlug(name, seller.id);
  db.prepare("UPDATE sellers SET store_name = ?, tagline = ? WHERE id = ?").run(name || seller.store_name, tagline, seller.id);
  urls.moveStore(seller, slug);
  if (b.shipping_flat != null) db.prepare("UPDATE sellers SET shipping_flat_cents = ? WHERE id = ?").run(Math.min(cents(b.shipping_flat), 100000), seller.id);
  if (b.free_shipping_over !== undefined) {
    db.prepare("UPDATE sellers SET free_shipping_over_cents = ? WHERE id = ?").run(b.free_shipping_over === null || b.free_shipping_over === "" ? null : cents(b.free_shipping_over), seller.id);
  }
  if (b.ship_countries != null) {
    const list = (Array.isArray(b.ship_countries) ? b.ship_countries : String(b.ship_countries).split(/[\s,]+/))
      .map((c) => String(c).trim().toUpperCase()).filter((c) => COUNTRY.test(c));
    if (!list.length) throw httpError(400, "Add at least one country you ship to, as a two-letter code like US.");
    db.prepare("UPDATE sellers SET ship_countries = ? WHERE id = ?").run([...new Set(list)].slice(0, 60).join(","), seller.id);
  }
  if (b.tax_enabled != null) db.prepare("UPDATE sellers SET tax_enabled = ? WHERE id = ?").run(b.tax_enabled ? 1 : 0, seller.id);
  if (b.about != null) db.prepare("UPDATE sellers SET about = ? WHERE id = ?").run(clampStr(b.about, 600).trim(), seller.id);
  if (b.announcement != null) db.prepare("UPDATE sellers SET announcement = ? WHERE id = ?").run(clampStr(b.announcement, 90).replace(/\s+/g, " ").trim(), seller.id);
  if (b.links != null) db.prepare("UPDATE sellers SET links = ? WHERE id = ?").run(JSON.stringify(growth.cleanLinks(b.links)), seller.id);
  if (b.abandoned_emails != null) db.prepare("UPDATE sellers SET abandoned_emails = ? WHERE id = ?").run(b.abandoned_emails ? 1 : 0, seller.id);
  if (b.theme != null) {
    db.prepare("UPDATE sellers SET theme = ? WHERE id = ?").run(b.theme, seller.id);
  }
  for (const key of [...Object.keys(HERO_LIMITS), "hero_motion", "banner_file", "design_photos"]) {
    if (Object.hasOwn(hero, key)) db.prepare(`UPDATE sellers SET ${key} = ? WHERE id = ?`).run(hero[key], seller.id);
  }
  return publicSeller(fresh(seller.id));
  })();
}

/** updateStore, but turning on sales tax first checks the seller's Stripe Tax setup is complete. */
export async function updateStoreChecked(seller, b) {
  if (b.tax_enabled === true && !seller.tax_enabled) {
    if (!seller.stripe_account_id || !seller.stripe_ready) throw httpError(409, "Connect Stripe and finish setup before turning on sales tax.");
    const t = await pay.taxStatus(seller.stripe_account_id);
    if (!t.active) throw httpError(409, "Finish tax setup first: add your business address in Set up sales tax.");
    if (!t.registrations.length) throw httpError(409, "Add at least one place where you're registered to collect tax in Set up sales tax, then turn this on.");
  }
  return updateStore(seller, b);
}
export function createProduct(seller, b, deliveryFile = null) {
  if (b.delivery_url && !/^https:\/\//.test(b.delivery_url)) throw httpError(400, "The download link must start with https://");
  if (b.image_file && !/^[\w-]+\.(jpg|png|webp|gif)$/.test(b.image_file)) throw httpError(400, "Invalid image reference.");
  if (b.image_file && (!ownsImageFile(seller.id, b.image_file) || !fs.existsSync(path.join(dirs.images, b.image_file)))) throw httpError(400, "Upload a photo to this store before using it.");
  const id = newId("prd");
  const slug = uniqueSlug("products", "slug", slugify(b.title), seller.id);
  db.prepare(`INSERT INTO products (id, seller_id, slug, title, tagline, description, bullets, faq, tags, category, kind, price_cents, image_file, alt_text, seo_description, delivery_file, delivery_url)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    id, seller.id, slug, clampStr(b.title, 120) || "Untitled product", clampStr(b.tagline, 160), clampStr(b.description, 3000),
    JSON.stringify(strList(b.bullets, 6)), JSON.stringify(faqList(b.faq)), JSON.stringify(strList(b.tags, 6, 30).map((t) => t.replace(/^#/, ""))),
    clampStr(b.category, 60), b.kind === "digital" ? "digital" : "physical", cents(b.price), b.image_file || null,
    clampStr(b.alt_text, 200), clampStr(b.seo_description || b.tagline, 160), deliveryFile, b.delivery_url ? clampStr(b.delivery_url, 500) : null);
  applyCommerceFields(id, b);
  return withPage(seller, db.prepare("SELECT * FROM products WHERE id = ?").get(id));
}

export function updateProduct(seller, id, b) {
  const row = productRow(seller, id);
  if (b.delivery_url && !/^https:\/\//.test(b.delivery_url)) throw httpError(400, "The download link must start with https://");
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
  if (next.price_cents < 50 && row.status === "live") throw httpError(400, "Live products need a price of at least $0.50.");
  db.transaction(() => {
    if (row.delivery_url !== next.delivery_url) snapshotProductDownloads(row);
    db.prepare("UPDATE products SET title=?, tagline=?, description=?, category=?, price_cents=?, delivery_url=?, bullets=?, tags=?, faq=? WHERE id=?")
      .run(next.title, next.tagline, next.description, next.category, next.price_cents, next.delivery_url, next.bullets, next.tags, next.faq, row.id);
  })();
  if (b.image_file !== undefined && b.image_file !== null) {
    // A new photo from the photo studio (or swapping back to the original). Old files are kept so the seller can switch back.
    if (!ownsImageFile(seller.id, b.image_file) || !fs.existsSync(path.join(dirs.images, b.image_file))) throw httpError(400, "Invalid image reference.");
    db.prepare("UPDATE products SET image_file = ? WHERE id = ?").run(b.image_file, row.id);
  }
  applyCommerceFields(row.id, b);
  if (b.status === "draft" && row.status === "live") db.prepare("UPDATE products SET status='draft' WHERE id=?").run(row.id);
  return withPage(seller, db.prepare("SELECT * FROM products WHERE id = ?").get(row.id));
}

/** Inventory, SKU, tax code and the option/variant list. Prices are re-read at checkout, so edits apply immediately. */
function applyCommerceFields(id, b) {
  if (b.label != null) db.prepare("UPDATE products SET label = ? WHERE id = ?").run(clampStr(b.label, 24).replace(/\s+/g, " ").trim(), id);
  if (b.inventory !== undefined) db.prepare("UPDATE products SET inventory = ? WHERE id = ?").run(stock(b.inventory), id);
  if (b.sku != null) db.prepare("UPDATE products SET sku = ? WHERE id = ?").run(clampStr(b.sku, 64), id);
  if (b.tax_code !== undefined) {
    if (b.tax_code && !TAX_CODE.test(b.tax_code)) throw httpError(400, "Tax codes look like txcd_99999999.");
    db.prepare("UPDATE products SET tax_code = ? WHERE id = ?").run(b.tax_code || null, id);
  }
  if (b.option_name != null) db.prepare("UPDATE products SET option_name = ? WHERE id = ?").run(clampStr(b.option_name, 30), id);
  if (Array.isArray(b.variants)) setVariants(id, b.variants);
}

/** Replace a product's variants. Rows that keep their id keep their identity (open carts still match). */
export function setVariants(productId, list) {
  const clean = list.slice(0, 30).map((v) => ({
    id: typeof v.id === "string" ? v.id : null, name: clampStr(v.name, 60).trim(),
    price_cents: v.price === null || v.price === undefined || v.price === "" ? null : cents(v.price),
    inventory: stock(v.inventory), sku: clampStr(v.sku, 64),
  })).filter((v) => v.name);
  const names = clean.map((v) => v.name.toLowerCase());
  if (new Set(names).size !== names.length) throw httpError(400, "Each option needs a different name.");
  if (clean.some((v) => v.price_cents != null && v.price_cents < 50)) throw httpError(400, "Option prices must be at least $0.50.");
  db.transaction(() => {
    const existing = new Set(db.prepare("SELECT id FROM product_variants WHERE product_id = ?").all(productId).map((r) => r.id));
    const keep = new Set();
    clean.forEach((v, i) => {
      if (v.id && existing.has(v.id)) {
        db.prepare("UPDATE product_variants SET name=?, price_cents=?, inventory=?, sku=?, position=? WHERE id=?").run(v.name, v.price_cents, v.inventory, v.sku, i, v.id);
        keep.add(v.id);
      } else {
        const id = newId("var");
        db.prepare("INSERT INTO product_variants (id, product_id, name, price_cents, inventory, sku, position) VALUES (?,?,?,?,?,?,?)").run(id, productId, v.name, v.price_cents, v.inventory, v.sku, i);
        keep.add(id);
      }
    });
    for (const id of existing) if (!keep.has(id)) db.prepare("DELETE FROM product_variants WHERE id = ?").run(id);
    if (clean.length) {
      const p = db.prepare("SELECT option_name FROM products WHERE id = ?").get(productId);
      if (!p.option_name) db.prepare("UPDATE products SET option_name = 'Option' WHERE id = ?").run(productId);
    }
  })();
}

export function deleteProduct(seller, id) {
  const row = productRow(seller, id);
  // Export/source tables cascade with the product, but their private files do not. Keep any
  // buyer-pinned delivery bytes and image sources used by another surviving editable design.
  const designCovers = digitalDesigns.cleanupProductDesign(row.id);
  db.prepare("DELETE FROM products WHERE id = ?").run(row.id);
  for (const cover of designCovers) if (!sellerImageIsStored(seller.id, cover)) fs.rmSync(path.join(dirs.images, cover), { force: true });
  if (row.image_file && !digitalDesigns.imageReferencedByAnyDesign(seller.id, row.image_file) && !sellerImageIsStored(seller.id, row.image_file)) fs.rm(path.join(dirs.images, row.image_file), { force: true }, () => {});
  if (row.delivery_file && !db.prepare("SELECT 1 FROM digital_order_downloads WHERE delivery_file = ? LIMIT 1").get(row.delivery_file)) fs.rm(path.join(dirs.files, row.delivery_file), { force: true }, () => {});
}

export async function publishProduct(sellerIn, id) {
  let seller = fresh(sellerIn.id);
  const row = productRow(seller, id);
  plans.assertCanPublish(seller);
  if (!seller.stripe_account_id) throw httpError(409, "Connect Stripe first so you can get paid.");
  if (!seller.stripe_ready) {
    const ready = await pay.accountReady(seller.stripe_account_id);
    db.prepare("UPDATE sellers SET stripe_ready = ? WHERE id = ?").run(ready ? 1 : 0, seller.id);
    if (!ready) throw httpError(409, "Finish setting up your Stripe account to start selling.");
    seller = fresh(seller.id);
  }
  if (row.price_cents < 50) throw httpError(400, "Set a price of at least $0.50.");
  if (row.kind === "digital" && !row.delivery_file && !row.delivery_url) throw httpError(400, "Add the file buyers will download before publishing.");
  // Checkout sessions are created per cart from the live prices, so going live needs no Stripe objects.
  db.prepare("UPDATE products SET status='live' WHERE id=?").run(row.id);
  return withPage(seller, db.prepare("SELECT * FROM products WHERE id = ?").get(row.id));
}

/** Write a whole digital product, render its cover and PDF, and save it as a draft listing. */
export async function generateProduct(seller, { type = "guide", niche, color = "cobalt", price, template_id = null }) {
  if (!PRODUCT_TYPES[type]) throw httpError(400, `Unknown product type. Use one of: ${Object.keys(PRODUCT_TYPES).join(", ")}.`);
  if (!niche || String(niche).trim().length < 4) throw httpError(400, "Describe who the product is for, in a few words.");
  // Fail an unknown template before consuming an AI allowance. No template deliberately retains
  // the established legacy PDF output and response shape.
  if (template_id != null) digitalDesigns.catalog(); // loads the catalog before its canonical check below
  if (template_id != null) (await import("./digital-catalog.js")).templateById(String(template_id));
  const r = await generateDigitalProduct({ type, niche: clampStr(niche, 200) });
  // Convert and validate the entire original AI object before creating any cover, PDF or listing.
  // A malformed response therefore cannot leave an orphan legacy product without editable source.
  const sourceDocument = await digitalDesigns.generatedSourceDocument(seller, r, type, template_id == null ? null : String(template_id));
  const listing = {
    title: r.title, tagline: r.tagline, description: r.description, bullets: r.bullets, faq: r.faq, tags: r.tags,
    category: r.category || PRODUCT_TYPES[type].name, kind: "digital", price: price || r.suggested_price || PRODUCT_TYPES[type].price,
    alt_text: `Cover of ${r.title}`, seo_description: r.tagline,
  };
  if (template_id != null) {
    // Template-selected generation has no legacy intermediary. Save the original full structured
    // reply first, then render/attach that saved revision to this still-private draft.
    const product = createProduct(seller, listing);
    await digitalDesigns.registerGeneratedSource(seller, product.id, r, type, String(template_id), sourceDocument);
    return (await digitalDesigns.renderGeneratedTemplate(seller, product.id)).product;
  }
  const hex = COVER_COLORS[color] || COVER_COLORS.cobalt;
  const cover = renderCover({ title: r.title, tagline: r.tagline, type, color: hex });
  const image_file = writeFileSafe(dirs.images, `${crypto.randomUUID()}.png`, cover);
  db.prepare("INSERT OR IGNORE INTO seller_media (image_file,seller_id) VALUES (?,?)").run(image_file, seller.id);
  const pdf = await renderProductPdf({ ...r, type, storeName: seller.store_name }, cover, hex);
  const delivery_file = writeFileSafe(dirs.files, `${crypto.randomUUID()}.pdf`, pdf);
  const product = createProduct(seller, { ...listing, image_file }, delivery_file);
  // Keep all original structured AI content, including long paragraphs and list items, in source.
  await digitalDesigns.registerGeneratedSource(seller, product.id, r, type, null, sourceDocument);
  return product;
}

export { listOrders } from "./commerce.js";

export const TRENDS = [
  { name: "Digital planners", why: "Hyperlinked PDF planners for GoodNotes and Notability. Peak season runs October to January.", where: "Etsy, TikTok, Pinterest" },
  { name: "Printable wall art", why: "Minimalist and motivational prints, one of the highest-volume digital categories on Etsy.", where: "Etsy, Pinterest" },
  { name: "Content & hook templates", why: "Hooks, scripts and content calendars for creators and small shops.", where: "TikTok, Instagram" },
  { name: "Spreadsheet templates", why: "Budget, savings and small-business trackers for Excel and Google Sheets.", where: "Etsy, TikTok" },
  { name: "Digital stickers", why: "Transparent PNG sticker packs for iPad planners.", where: "Etsy, Instagram" },
  { name: "Canva templates", why: "Social posts, business cards and branding kits edited in Canva.", where: "Etsy, Instagram" },
  { name: "E-books & mini guides", why: "Short, specific how-to guides tied to a creator's niche.", where: "Instagram, TikTok" },
];

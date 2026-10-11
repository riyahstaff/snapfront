// Store web addresses. With STORE_DOMAIN set (snapfront.app), every store lives at https://<slug>.snapfront.app;
// without it, stores live at <PUBLIC_URL>/s/<slug>. Old addresses keep working through redirects.
import { config } from "./config.js";
import { db, slugify } from "./db.js";
import { httpError } from "./claude.js";

db.exec(`CREATE TABLE IF NOT EXISTS store_redirects (
  slug TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`);

// Subdomains Snapfront keeps for itself (and words that would confuse buyers).
export const RESERVED = new Set(("www api app apps admin administrator root mail email smtp imap pop ftp ns ns1 ns2 dns cdn static assets img images media files " +
  "download downloads d s help support docs blog status dev staging test demo beta preview store stores shop shops checkout cart pay payment payments " +
  "billing account accounts login signin signup auth oauth secure security dashboard console stripe snapfront official legal privacy terms about " +
  "contact team careers jobs press news webhook webhooks callback suppliers thanks health domains edge edge-origin").split(" "));

const DEFAULT_SLUG = /^(my-snapfront-store|store|item)(-\d+)?$/;
export const isDefaultSlug = (slug) => DEFAULT_SLUG.test(String(slug || ""));

/** A Pro store's own domain (shop.pawplace.com) once it's live; null otherwise. */
export function customDomainOf(slug) {
  return db.prepare(`SELECT s.custom_domain FROM sellers s JOIN accounts a ON a.id = s.account_id
    WHERE s.store_slug = ? AND s.custom_domain_status = 'active' AND (a.plan = 'pro' OR a.comp_plan = 'pro')`).get(slug)?.custom_domain || null;
}
/** The store whose own domain this is (any status: a request reaching us means its DNS works). */
export const sellerForDomain = (host) => db.prepare("SELECT * FROM sellers WHERE custom_domain = ?").get(String(host || "").toLowerCase());

export function storeUrl(slug, path = "") {
  const custom = config.storeDomain ? customDomainOf(slug) : null;
  if (custom) return `https://${custom}${path}`;
  return config.storeDomain ? `https://${slug}.${config.storeDomain}${path}` : `${config.publicUrl}/s/${slug}${path}`;
}
/** Where a store's buyers return after checkout: the store's own address, so their cart is cleared there. */
export const storeOrigin = (slug) => (config.storeDomain ? new URL(storeUrl(slug)).origin : config.publicUrl);

/** The store slug for a request to <slug>.snapfront.app, or null. */
export function hostStoreSlug(host) {
  const d = config.storeDomain;
  const h = String(host || "").toLowerCase();
  if (!d || !h.endsWith(`.${d}`)) return null;
  const sub = h.slice(0, -(d.length + 1));
  return /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/.test(sub) && sub !== "www" ? sub : null;
}

const takenBy = (slug) => db.prepare("SELECT id FROM sellers WHERE store_slug = ?").get(slug)?.id
  || db.prepare("SELECT seller_id AS id FROM store_redirects WHERE slug = ?").get(slug)?.id || null;

/** A free address based on a store name: adds -2, -3... when it's taken or reserved. */
export function freeSlug(name, sellerId = null) {
  let base = slugify(name, 36);
  if (base.length < 3) base = `${base}-shop`.replace(/^-/, "");
  let slug = base, n = 2;
  while (RESERVED.has(slug) || (takenBy(slug) && takenBy(slug) !== sellerId)) slug = `${base}-${n++}`;
  return slug;
}

/** Check an address the seller typed; returns the clean slug or throws a friendly error. */
export function checkSlug(input, sellerId) {
  // Accept "pawplace", "pawplace.snapfront.app" or a pasted https:// link.
  let raw = String(input || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  for (const d of [config.storeDomain, "snapfront.app"].filter(Boolean)) if (raw.endsWith(`.${d}`)) raw = raw.slice(0, -(d.length + 1));
  const slug = slugify(raw, 40);
  if (slug.length < 3) throw httpError(400, "Use at least 3 letters or numbers for your store address.");
  if (RESERVED.has(slug)) throw httpError(409, `“${slug}” is reserved. Try another address.`);
  const owner = takenBy(slug);
  if (owner && owner !== sellerId) throw httpError(409, `${config.storeDomain ? `${slug}.${config.storeDomain}` : slug} is taken. Try another address.`);
  return slug;
}

/** Move a store to a new address, keeping the old one as a redirect. */
export function moveStore(seller, slug) {
  if (slug === seller.store_slug) return;
  db.transaction(() => {
    db.prepare("DELETE FROM store_redirects WHERE slug = ?").run(slug);   // taking back one of its own old addresses
    db.prepare("INSERT OR REPLACE INTO store_redirects (slug, seller_id) VALUES (?, ?)").run(seller.store_slug, seller.id);
    db.prepare("UPDATE sellers SET store_slug = ? WHERE id = ?").run(slug, seller.id);
  })();
}

/** The store an old address now belongs to, if any. */
export const redirectFor = (slug) => db.prepare("SELECT s.* FROM store_redirects r JOIN sellers s ON s.id = r.seller_id WHERE r.slug = ?").get(String(slug || "").toLowerCase());

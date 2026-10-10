import Database from "better-sqlite3";
import path from "node:path";
import crypto from "node:crypto";
import { config } from "./config.js";

export const db = new Database(path.join(config.dataDir, "snapfront.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS sellers (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  store_name TEXT NOT NULL DEFAULT 'My Snapfront Store',
  store_slug TEXT NOT NULL UNIQUE,
  tagline TEXT NOT NULL DEFAULT '',
  stripe_account_id TEXT,
  stripe_ready INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  tagline TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  bullets TEXT NOT NULL DEFAULT '[]',
  faq TEXT NOT NULL DEFAULT '[]',
  tags TEXT NOT NULL DEFAULT '[]',
  category TEXT NOT NULL DEFAULT '',
  kind TEXT NOT NULL DEFAULT 'physical' CHECK (kind IN ('physical','digital')),
  price_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',
  image_file TEXT,
  alt_text TEXT NOT NULL DEFAULT '',
  seo_description TEXT NOT NULL DEFAULT '',
  delivery_file TEXT,
  delivery_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','live')),
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  payment_link_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (seller_id, slug)
);
`);

/* ---------- migrations (safe to run on every start) ---------- */
const cols = (t) => new Set(db.prepare(`PRAGMA table_info(${t})`).all().map((c) => c.name));
const addCol = (t, name, def) => { if (!cols(t).has(name)) db.exec(`ALTER TABLE ${t} ADD COLUMN ${name} ${def}`); };

// Phase 1 commerce: inventory, variants, tax codes, shipping and tax settings.
addCol("products", "inventory", "INTEGER");               // NULL = unlimited
addCol("products", "option_name", "TEXT NOT NULL DEFAULT ''"); // e.g. "Size"; variants hold the values
addCol("products", "tax_code", "TEXT");
addCol("products", "sku", "TEXT NOT NULL DEFAULT ''");
addCol("sellers", "shipping_flat_cents", "INTEGER NOT NULL DEFAULT 0");
addCol("sellers", "free_shipping_over_cents", "INTEGER");
addCol("sellers", "ship_countries", "TEXT NOT NULL DEFAULT 'US,CA,GB,AU,NZ,IE'");
addCol("sellers", "tax_enabled", "INTEGER NOT NULL DEFAULT 0");

// Orders became multi-item. The first schema (one product per order) is kept aside if it exists.
if (db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='orders'").get() && !cols("orders").has("seller_id")) {
  db.exec("ALTER TABLE orders RENAME TO orders_v1");
}

db.exec(`
CREATE TABLE IF NOT EXISTS product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_cents INTEGER,          -- NULL = the product's price
  inventory INTEGER,            -- NULL = unlimited
  sku TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS discounts (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('percent','amount')),
  value INTEGER NOT NULL,       -- percent (1-100) or cents
  min_subtotal_cents INTEGER NOT NULL DEFAULT 0,
  max_uses INTEGER,             -- NULL = unlimited
  uses INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (seller_id, code)
);
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','fulfilled','canceled')),
  items TEXT NOT NULL DEFAULT '[]',
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  shipping_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  discount_code TEXT,
  email TEXT,
  customer_name TEXT,
  shipping_address TEXT,
  checkout_session_id TEXT UNIQUE,
  paid_at TEXT,
  fulfilled_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS orders_seller ON orders (seller_id, created_at);
CREATE INDEX IF NOT EXISTS variants_product ON product_variants (product_id, position);
`);

export const newId = (prefix) => `${prefix}_${crypto.randomBytes(9).toString("base64url")}`;
export const hashToken = (t) => crypto.createHash("sha256").update(t).digest("hex");

export function slugify(s, max = 60) {
  return String(s || "item").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, max) || "item";
}

export function uniqueSlug(table, column, base, scope) {
  let slug = base, n = 2;
  const sql = scope
    ? db.prepare(`SELECT 1 FROM ${table} WHERE ${column} = ? AND seller_id = ?`)
    : db.prepare(`SELECT 1 FROM ${table} WHERE ${column} = ?`);
  while (scope ? sql.get(slug, scope) : sql.get(slug)) slug = `${base}-${n++}`;
  return slug;
}

const JSON_FIELDS = ["bullets", "faq", "tags"];
export function rowToProduct(r) {
  if (!r) return null;
  const p = { ...r };
  for (const f of JSON_FIELDS) { try { p[f] = JSON.parse(r[f]); } catch { p[f] = []; } }
  p.price = r.price_cents / 100;
  p.image_url = r.image_file ? `${config.publicUrl}/img/${r.image_file}` : null;
  p.has_delivery = Boolean(r.delivery_file || r.delivery_url);
  delete p.delivery_file;
  p.variants = db.prepare("SELECT id, name, price_cents, inventory, sku FROM product_variants WHERE product_id = ? ORDER BY position").all(r.id)
    .map((v) => ({ ...v, price: (v.price_cents ?? r.price_cents) / 100 }));
  p.in_stock = p.variants.length ? p.variants.some((v) => v.inventory == null || v.inventory > 0) : (r.inventory == null || r.inventory > 0);
  return p;
}

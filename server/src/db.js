import Database from "better-sqlite3";
import { repairTaviPurchase } from "./purchase-repair.js";
import path from "node:path";
import crypto from "node:crypto";
import { config } from "./config.js";
import { repairTaviStorefront } from "./storefront-repairs.js";

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

addCol("products", "bundle_product_ids", "TEXT NOT NULL DEFAULT '[]'");
addCol("products", "billing_interval", "TEXT");
addCol("products", "purchase_method", "TEXT NOT NULL DEFAULT 'direct'");
addCol("products", "external_url", "TEXT");
repairTaviPurchase(db);
// Phase 1 commerce: inventory, variants, tax codes, shipping and tax settings.
addCol("products", "inventory", "INTEGER");               // NULL = unlimited
addCol("products", "option_name", "TEXT NOT NULL DEFAULT ''"); // e.g. "Size"; variants hold the values
addCol("products", "tax_code", "TEXT");
addCol("products", "sku", "TEXT NOT NULL DEFAULT ''");
addCol("sellers", "theme", "TEXT NOT NULL DEFAULT 'classic'");   // storefront look, see themes.js
addCol("products", "label", "TEXT NOT NULL DEFAULT ''");          // short text on the product photo: "New", "20% off"
addCol("sellers", "about", "TEXT NOT NULL DEFAULT ''");           // "About us" on the storefront
addCol("sellers", "announcement", "TEXT NOT NULL DEFAULT ''");    // strip above the storefront header
addCol("sellers", "banner_file", "TEXT");                         // storefront cover photo
addCol("sellers", "design_photos", "TEXT NOT NULL DEFAULT '[]'"); // up to two ordered optional storefront photos
addCol("sellers", "hero_title", "TEXT NOT NULL DEFAULT ''");
addCol("sellers", "hero_subtitle", "TEXT NOT NULL DEFAULT ''");
addCol("sellers", "hero_eyebrow", "TEXT NOT NULL DEFAULT ''");
addCol("sellers", "hero_cta", "TEXT NOT NULL DEFAULT ''");
addCol("sellers", "hero_motion", "TEXT NOT NULL DEFAULT 'still'");
const storefrontRepair = repairTaviStorefront(db);
if (storefrontRepair.status !== "already_applied") console.info("[storefront-repair]", JSON.stringify(storefrontRepair));
// A setup photo is private to its seller and does not become the live banner until Apply.
db.exec(`CREATE TABLE IF NOT EXISTS storefront_photos (
  image_file TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS storefront_photos_seller ON storefront_photos (seller_id);`);
// Private image assets may exist before they are attached to a product. Keep their seller owner
// so a URL-looking filename cannot be borrowed as a marketing/studio source by another store.
db.exec(`CREATE TABLE IF NOT EXISTS seller_media (
  image_file TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS seller_media_seller ON seller_media (seller_id, created_at);`);
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

-- Pricing: an account (a person) owns one or more stores and holds the plan.
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','launch','pro')),  -- from purchases
  comp_plan TEXT CHECK (comp_plan IN ('launch','pro')),                     -- granted by hand
  plan_synced_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS usage (
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  period TEXT NOT NULL,          -- 'YYYY-MM', or 'trial' for the free plan
  kind TEXT NOT NULL,            -- photo | product | agent
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (account_id, period, kind)
);
CREATE TABLE IF NOT EXISTS login_codes (
  email TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL,
  account_id TEXT NOT NULL,      -- the device account that asked for the code
  expires_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0
);
`);

addCol("sellers", "account_id", "TEXT REFERENCES accounts(id) ON DELETE CASCADE");

// Dropshipping: where a product comes from, what it costs the seller, and the supplier side of each order.
addCol("products", "source", "TEXT");              // 'cj' for CJdropshipping imports
addCol("products", "source_id", "TEXT");           // CJ product id (pid)
addCol("products", "source_vid", "TEXT");          // CJ variant id when the product has no options
addCol("products", "cost_cents", "INTEGER");       // supplier price, before shipping
addCol("products", "compare_at_cents", "INTEGER"); // the "was" price shown crossed out; display only
addCol("product_variants", "source_vid", "TEXT");
addCol("product_variants", "cost_cents", "INTEGER");
addCol("products", "source_meta", "TEXT");         // supplier detail needed to order, e.g. AliExpress sku_attr
addCol("product_variants", "source_meta", "TEXT");
addCol("accounts", "cj_key_enc", "TEXT");          // the seller's own CJ API key, encrypted
addCol("accounts", "cj_auto_pay", "INTEGER NOT NULL DEFAULT 0");
addCol("orders", "supplier_status", "TEXT");       // needs_key | sending | awaiting_payment | sent | shipped | delivered | failed | canceled
addCol("orders", "supplier_order_id", "TEXT");
addCol("orders", "supplier_error", "TEXT");
addCol("orders", "supplier_checked_at", "TEXT");
addCol("orders", "tracking_number", "TEXT");
addCol("orders", "tracking_carrier", "TEXT");
db.exec(`CREATE TABLE IF NOT EXISTS cj_tokens (
  key_hash TEXT PRIMARY KEY, access_token TEXT NOT NULL, access_expires TEXT, refresh_token TEXT, refresh_expires TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`);
db.exec("CREATE INDEX IF NOT EXISTS sellers_account ON sellers (account_id, created_at)");

// Stores made before accounts existed: give each its own account and keep its device token working.
// Stores already taking payments at that moment were set up before pricing existed, so they keep Pro.
{
  const orphans = db.prepare("SELECT * FROM sellers WHERE account_id IS NULL").all();
  const mk = db.transaction(() => {
    for (const s of orphans) {
      const id = `acc_${crypto.randomBytes(9).toString("base64url")}`;
      db.prepare("INSERT INTO accounts (id, comp_plan, created_at) VALUES (?,?,?)").run(id, s.stripe_ready ? "pro" : null, s.created_at);
      db.prepare("INSERT OR IGNORE INTO sessions (token_hash, account_id) VALUES (?,?)").run(s.token_hash, id);
      db.prepare("UPDATE sellers SET account_id = ? WHERE id = ?").run(id, s.id);
    }
  });
  if (orphans.length) mk();
}

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
  p.bundle_product_ids = JSON.parse(r.bundle_product_ids || "[]");
  p.bundle_items = p.bundle_product_ids.map((id) => db.prepare("SELECT id,title FROM products WHERE id=? AND seller_id=?").get(id, r.seller_id)).filter(Boolean);
  p.billing_interval = r.billing_interval || null;
  p.price = r.price_cents / 100;
  p.image_url = r.image_file ? `${config.publicUrl}/img/${r.image_file}` : null;
  p.has_delivery = Boolean(r.delivery_file || r.delivery_url || p.bundle_product_ids.length);
  p.cost = r.cost_cents == null ? null : r.cost_cents / 100;
  p.compare_at = r.compare_at_cents == null ? null : r.compare_at_cents / 100;
  delete p.delivery_file;
  p.variants = db.prepare("SELECT id, name, price_cents, inventory, sku FROM product_variants WHERE product_id = ? ORDER BY position").all(r.id)
    .map((v) => ({ ...v, price: (v.price_cents ?? r.price_cents) / 100 }));
  p.in_stock = p.variants.length ? p.variants.some((v) => v.inventory == null || v.inventory > 0) : (r.inventory == null || r.inventory > 0);
  return p;
}

/* ---------- seller-owned Meta connections and durable publishing queue ---------- */
// Tokens never leave this database. `access_token_enc` is AES-256-GCM ciphertext created only
// when META_TOKEN_ENCRYPTION_KEY is a valid 32-byte key; an invalid configuration disables Meta.
db.exec(`
CREATE TABLE IF NOT EXISTS social_oauth_states (
  state_hash TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS social_oauth_states_expiry ON social_oauth_states (expires_at);

CREATE TABLE IF NOT EXISTS social_connections (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  meta_user_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('instagram','facebook')),
  remote_id TEXT NOT NULL,
  page_id TEXT,
  name TEXT NOT NULL,
  access_token_enc TEXT NOT NULL,
  user_access_token_enc TEXT,
  token_expires_at TEXT,
  data_access_expires_at TEXT,
  user_token_expires_at TEXT,
  user_data_access_expires_at TEXT,
  status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected','reconnect_required')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (seller_id, platform, remote_id)
);
CREATE INDEX IF NOT EXISTS social_connections_seller ON social_connections (seller_id, created_at);
CREATE INDEX IF NOT EXISTS social_connections_meta_user ON social_connections (meta_user_id);

CREATE TABLE IF NOT EXISTS social_renders (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('image','carousel','reel')),
  format TEXT NOT NULL,
  files_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS social_renders_seller ON social_renders (seller_id, created_at);

CREATE TABLE IF NOT EXISTS social_posts (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  connection_id TEXT NOT NULL REFERENCES social_connections(id) ON DELETE CASCADE,
  render_id TEXT NOT NULL REFERENCES social_renders(id) ON DELETE RESTRICT,
  platform TEXT NOT NULL CHECK (platform IN ('instagram','facebook')),
  account_name TEXT NOT NULL,
  caption TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('image','carousel','reel')),
  media_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued','processing','published','failed','uncertain','canceled')),
  publish_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  error TEXT,
  permalink TEXT,
  remote_post_id TEXT,
  retryable INTEGER NOT NULL DEFAULT 0,
  idempotency_key TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS social_posts_seller ON social_posts (seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS social_posts_idempotency ON social_posts (seller_id, idempotency_key);

CREATE TABLE IF NOT EXISTS social_publish_requests (
  seller_id TEXT NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  idempotency_key TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  post_ids_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (seller_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS social_publish_jobs (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL UNIQUE REFERENCES social_posts(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('queued','processing','published','failed','uncertain','canceled')),
  run_at TEXT NOT NULL,
  lease_owner TEXT,
  lease_until TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  safe_retries INTEGER NOT NULL DEFAULT 0,
  poll_count INTEGER NOT NULL DEFAULT 0,
  stage TEXT NOT NULL DEFAULT 'start',
  remote_ids_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS social_publish_jobs_due ON social_publish_jobs (status, run_at, lease_until);

CREATE TABLE IF NOT EXISTS social_deletion_requests (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  completed_at TEXT NOT NULL
);
`);
// These fields are kept separately because Page and long-lived User tokens have different
// lifetimes and are used by different documented Meta publishing endpoints.
addCol("social_connections", "user_access_token_enc", "TEXT");
addCol("social_connections", "user_token_expires_at", "TEXT");
addCol("social_connections", "user_data_access_expires_at", "TEXT");
addCol("social_posts", "remote_post_id", "TEXT");

// Editable source is deliberately separate from the buyer-facing product attachment. This lets a
// seller save, preview and export a draft without changing a live download.
db.exec(`
CREATE TABLE IF NOT EXISTS digital_designs (
  product_id TEXT PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  seller_id TEXT NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  source_available INTEGER NOT NULL DEFAULT 1,
  document_json TEXT,
  revision INTEGER NOT NULL DEFAULT 0,
  attached_export_id TEXT,
  legacy_message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS digital_designs_seller ON digital_designs (seller_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS digital_design_exports (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  seller_id TEXT NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  revision INTEGER NOT NULL,
  document_hash TEXT NOT NULL,
  page_count INTEGER NOT NULL,
  pdf_file TEXT NOT NULL,
  cover_file TEXT NOT NULL,
  attached_cover_file TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS digital_design_exports_current
  ON digital_design_exports (product_id, seller_id, revision, document_hash, created_at DESC);

-- A row is written only when a seller replaces an existing attachment. It intentionally does not
-- reference products: buyers of a deleted later product still need the preserved paid-order file.
CREATE TABLE IF NOT EXISTS digital_order_downloads (
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  delivery_file TEXT,
  delivery_url TEXT,
  download_name TEXT NOT NULL DEFAULT 'download.pdf',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (order_id, product_id)
);
CREATE INDEX IF NOT EXISTS digital_order_downloads_file ON digital_order_downloads (delivery_file);
`);

// Seller customer subscriptions are separate from Snapfront membership billing.
db.exec(`CREATE TABLE IF NOT EXISTS store_subscriptions (
 id TEXT PRIMARY KEY, seller_id TEXT NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
 order_id TEXT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
 stripe_account_id TEXT NOT NULL, customer_id TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'incomplete', period_end INTEGER NOT NULL DEFAULT 0,
 cancel_at_period_end INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS store_subscription_invoices (
 id TEXT PRIMARY KEY, subscription_id TEXT NOT NULL REFERENCES store_subscriptions(id) ON DELETE CASCADE,
 amount_paid INTEGER NOT NULL, currency TEXT NOT NULL, paid_at INTEGER NOT NULL
);`);

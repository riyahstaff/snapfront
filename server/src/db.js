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
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  checkout_session_id TEXT NOT NULL UNIQUE,
  email TEXT,
  amount_cents INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
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
  return p;
}

// Snapfront's connector for Claude and ChatGPT: an MCP server at /mcp with its own OAuth sign-in.
// A seller adds https://snapfront.app/mcp in their assistant, signs in with their Snapfront email
// and a 6-digit code, approves, and the assistant can then work on their stores through the tools
// below. The thinking runs on the seller's own Claude or ChatGPT plan.
//
// Sign-in follows the MCP authorization spec (OAuth 2.1): discovery metadata, dynamic client
// registration, client ID metadata documents (Claude's "published identity"), S256 PKCE on every
// request, one-time codes, short-lived access tokens and rotating refresh tokens. Only hashes of
// codes and tokens are stored. Sellers see and disconnect connected apps in Settings.
import crypto from "node:crypto";
import dns from "node:dns";
import https from "node:https";
import net from "node:net";
import sharp from "sharp";
import express from "express";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { config } from "./config.js";
import { db, newId } from "./db.js";
import { httpError } from "./claude.js";
import * as plans from "./plans.js";
import * as store from "./store.js";
import * as faceless from "./faceless.js";
import * as auth from "./auth.js";
import { THEME_IDS, publicThemes } from "./themes.js";
import { VOICES } from "./narrated.js";
import { connectPage } from "./site-pages.js";

export const ISSUER = config.publicUrl;
export const RESOURCE = `${ISSUER}/mcp`;
const SCOPE = "store";
const ACCESS_TTL = 60 * 60;                  // seconds
const REFRESH_TTL = 60 * 24 * 60 * 60;       // 60 days
const CODE_TTL = 10 * 60;
const REQUEST_TTL = 15 * 60;
const now = () => Math.floor(Date.now() / 1000);
const sha = (s) => crypto.createHash("sha256").update(String(s)).digest("hex");
const random = (n = 32) => crypto.randomBytes(n).toString("base64url");
const codeHash = (rid, email, code) => crypto.createHmac("sha256", config.downloadSecret).update(`connect:${rid}:${email}:${code}`).digest("hex");
const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };

db.exec(`
CREATE TABLE IF NOT EXISTS oauth_clients (
  client_id TEXT PRIMARY KEY, secret_hash TEXT, name TEXT NOT NULL, redirect_uris TEXT NOT NULL,
  auth_method TEXT NOT NULL DEFAULT 'none', created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS oauth_requests (
  id TEXT PRIMARY KEY, client_id TEXT NOT NULL, client_name TEXT, redirect_uri TEXT NOT NULL, state TEXT,
  code_challenge TEXT NOT NULL, scope TEXT, resource TEXT, email TEXT, code_hash TEXT, attempts INTEGER NOT NULL DEFAULT 0,
  account_id TEXT, consent_token TEXT, expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS oauth_codes (
  code_hash TEXT PRIMARY KEY, client_id TEXT NOT NULL, client_name TEXT, redirect_uri TEXT NOT NULL, code_challenge TEXT NOT NULL,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE, scope TEXT, resource TEXT, expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS oauth_grants (
  id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE, client_id TEXT NOT NULL,
  client_name TEXT, redirect_host TEXT, scope TEXT, refresh_hash TEXT UNIQUE, refresh_expires INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')), last_used_at TEXT);
CREATE TABLE IF NOT EXISTS oauth_tokens (
  token_hash TEXT PRIMARY KEY, grant_id TEXT NOT NULL REFERENCES oauth_grants(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS oauth_grants_account ON oauth_grants(account_id);
`);
function sweep() {
  const t = now();
  db.prepare("DELETE FROM oauth_requests WHERE expires_at < ?").run(t);
  db.prepare("DELETE FROM oauth_codes WHERE expires_at < ?").run(t);
  db.prepare("DELETE FROM oauth_tokens WHERE expires_at < ?").run(t);
  db.prepare("DELETE FROM oauth_grants WHERE refresh_expires < ?").run(t);
}

/* ---------- small per-key rate limits ---------- */
const hits = new Map();
function limited(key, max, windowMs) {
  const t = Date.now(), list = (hits.get(key) || []).filter((x) => t - x < windowMs);
  if (list.length >= max) return true;
  list.push(t); hits.set(key, list);
  if (hits.size > 20000) hits.clear();
  return false;
}
const limit = (name, max, windowMs) => (req, res, next) => (limited(`${name}:${req.ip}`, max, windowMs)
  ? res.status(429).json({ error: "slow_down", error_description: "Too many requests. Wait a minute and try again." }) : next());

/* ---------- clients: registered (DCR) or identified by a metadata document URL (CIMD) ---------- */
const LOOPBACK = /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?\//;
function validRedirect(u) {
  if (typeof u !== "string" || u.length > 500) return false;
  let p; try { p = new URL(u); } catch { return false; }
  if (p.hash || p.username || p.password) return false;
  if (p.protocol === "https:") return true;
  return LOOPBACK.test(u);
}
/** Loopback redirects match on everything but the port (RFC 8252); everything else matches exactly. */
function redirectAllowed(registered, uri) {
  if (registered.includes(uri)) return true;
  if (!LOOPBACK.test(uri)) return false;
  const strip = (s) => { try { const p = new URL(s); p.port = ""; return p.href; } catch { return ""; } };
  return registered.some((r) => LOOPBACK.test(r) && strip(r) === strip(uri));
}
// Client ID metadata documents are fetched only from the assistant makers' own sites.
const CIMD_HOSTS = ["claude.ai", "claude.com", "anthropic.com", "chatgpt.com", "openai.com"];
const cimdCache = new Map();
let cimdFetch = (url, opts) => fetch(url, opts);
export function setCimdFetch(f) { cimdFetch = f || ((url, opts) => fetch(url, opts)); cimdCache.clear(); }   // tests
async function cimdClient(clientId) {
  let u; try { u = new URL(clientId); } catch { return null; }
  if (u.protocol !== "https:" || u.username || u.password || u.port) return null;
  const host = u.hostname.toLowerCase();
  if (!CIMD_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) return null;
  const hit = cimdCache.get(clientId);
  if (hit && hit.expires > Date.now()) return hit.client;
  try {
    const r = await cimdFetch(clientId, { redirect: "error", signal: AbortSignal.timeout(5000), headers: { Accept: "application/json" } });
    if (!r.ok) return null;
    const text = await r.text();
    if (text.length > 65536) return null;
    const doc = JSON.parse(text);
    if (doc.client_id !== clientId || !Array.isArray(doc.redirect_uris)) return null;
    const redirect_uris = doc.redirect_uris.filter(validRedirect).slice(0, 10);
    if (!redirect_uris.length) return null;
    const client = { client_id: clientId, name: String(doc.client_name || host).slice(0, 100), redirect_uris, auth_method: "none", secret_hash: null };
    cimdCache.set(clientId, { client, expires: Date.now() + 60 * 60e3 });
    return client;
  } catch { return null; }
}
async function findClient(clientId) {
  if (typeof clientId !== "string" || !clientId || clientId.length > 500) return null;
  if (clientId.startsWith("https://")) return cimdClient(clientId);
  const row = db.prepare("SELECT * FROM oauth_clients WHERE client_id = ?").get(clientId);
  return row ? { ...row, redirect_uris: JSON.parse(row.redirect_uris) } : null;
}

/* ---------- tokens ---------- */
function issueTokens(grantId) {
  const access = random(), refresh = random();
  db.prepare("INSERT INTO oauth_tokens (token_hash, grant_id, expires_at) VALUES (?,?,?)").run(sha(access), grantId, now() + ACCESS_TTL);
  db.prepare("UPDATE oauth_grants SET refresh_hash = ?, refresh_expires = ? WHERE id = ?").run(sha(refresh), now() + REFRESH_TTL, grantId);
  return { access_token: access, token_type: "Bearer", expires_in: ACCESS_TTL, refresh_token: refresh, scope: SCOPE };
}
/** The account behind a bearer token, or null. */
export function accountForAccessToken(token) {
  if (!token) return null;
  const row = db.prepare(`SELECT g.id AS grant_id, g.account_id, g.last_used_at, t.expires_at FROM oauth_tokens t JOIN oauth_grants g ON g.id = t.grant_id WHERE t.token_hash = ?`).get(sha(token));
  if (!row || row.expires_at < now()) return null;
  const account = plans.getAccount(row.account_id);
  if (!account) return null;
  if (!row.last_used_at || Date.now() - Date.parse(`${row.last_used_at.replace(" ", "T")}Z`) > 10 * 60e3) db.prepare("UPDATE oauth_grants SET last_used_at = datetime('now') WHERE id = ?").run(row.grant_id);
  return { account, grantId: row.grant_id };
}

/* ---------- connected apps (Settings) ---------- */
export function connectedApps(accountId) {
  return db.prepare("SELECT id, client_name, redirect_host, created_at, last_used_at FROM oauth_grants WHERE account_id = ? ORDER BY created_at DESC").all(accountId)
    .map((g) => ({ id: g.id, name: g.client_name || "AI assistant", site: g.redirect_host || null, connected_at: g.created_at, last_used_at: g.last_used_at }));
}
export function disconnectApp(accountId, id) {
  const r = db.prepare("DELETE FROM oauth_grants WHERE id = ? AND account_id = ?").run(String(id || ""), accountId);
  if (!r.changes) throw httpError(404, "That connected app isn't on your account.");
}


/* ---------- pictures from a link (an image another tool made, like an AI avatar) ---------- */
// Only public internet addresses are fetched: every hostname is resolved and private, loopback and
// link-local addresses are refused at connect time (so a redirect or DNS change can't reach inside).
function isPrivate(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 198 && (b === 18 || b === 19)) || a >= 224;
  }
  const v = ip.toLowerCase();
  if (v.startsWith("::ffff:")) return isPrivate(v.slice(7));
  return v === "::" || v === "::1" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe8") || v.startsWith("fe9") || v.startsWith("fea") || v.startsWith("feb") || v.startsWith("ff");
}
const publicLookup = (host, opts, cb) => dns.lookup(host, { ...opts, all: true }, (err, addrs) => {
  if (err) return cb(err);
  const ok = addrs.filter((a) => !isPrivate(a.address));
  if (!ok.length || ok.length !== addrs.length) return cb(Object.assign(new Error("private address"), { code: "EPRIVATE" }));
  return opts.all ? cb(null, ok) : cb(null, ok[0].address, ok[0].family);
});
let imageGet = (url, opts, cb) => https.get(url, opts, cb);
export function setImageGet(f) { imageGet = f || ((url, opts, cb) => https.get(url, opts, cb)); }   // tests
export function fetchPublicImage(link, hops = 0) {
  return new Promise((resolve, reject) => {
    let u; try { u = new URL(link); } catch { return reject(httpError(400, "That isn't a valid link.")); }
    if (u.protocol !== "https:" || u.username || u.password || (u.port && u.port !== "443")) return reject(httpError(400, "Use an https link to the picture."));
    if (net.isIP(u.hostname.replace(/^\[|\]$/g, ""))) return reject(httpError(400, "Use a link with a web address, not a number address."));
    const req = imageGet(u, { lookup: publicLookup, timeout: 15000, headers: { "User-Agent": "Snapfront/1.0 (+https://snapfront.app)", Accept: "image/*" } }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        res.resume();
        if (hops >= 3) return reject(httpError(400, "That link redirects too many times."));
        return fetchPublicImage(new URL(res.headers.location, u).href, hops + 1).then(resolve, reject);
      }
      if (res.statusCode !== 200) { res.resume(); return reject(httpError(400, `The picture link answered ${res.statusCode}. Check it opens in a browser.`)); }
      const chunks = []; let size = 0;
      res.on("data", (c) => { size += c.length; if (size > 15 * 1024 * 1024) { req.destroy(); reject(httpError(413, "That picture is over 15 MB.")); } else chunks.push(c); });
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", () => reject(httpError(400, "The picture didn't download. Try again.")));
    });
    req.on("timeout", () => req.destroy(Object.assign(new Error("timeout"), { code: "ETIMEDOUT" })));
    req.on("error", (e) => reject(e.status ? e : httpError(400, e.code === "EPRIVATE" ? "That link points to a private address, so Snapfront won't open it." : "Snapfront couldn't reach that picture link.")));
  });
}
async function pictureFromLink(link) {
  const raw = await fetchPublicImage(link);
  try {
    const img = sharp(raw, { limitInputPixels: 80e6 }).rotate();
    const meta = await img.metadata();
    if (!meta.width || meta.width < 300 || meta.height < 300) throw httpError(400, "That picture is too small. Use one at least 300 pixels on each side.");
    return await img.resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
  } catch (e) { throw e.status ? e : httpError(400, "That link isn't a picture Snapfront can use (JPG, PNG, WebP or GIF)."); }
}

/* ---------- the tools ---------- */
const json = (data) => ({ content: [{ type: "text", text: JSON.stringify(data, null, 1) }], structuredContent: data });
const fail = (message) => ({ content: [{ type: "text", text: message }], isError: true });
const READ = { readOnlyHint: true, destructiveHint: false, openWorldHint: false };
const WRITE = { readOnlyHint: false, destructiveHint: false, openWorldHint: false };
const themeName = (id) => publicThemes().find((t) => t.id === id)?.name || id;
const money = (c) => (c == null ? null : Math.round(c) / 100);

function storeOf(account, storeId) {
  const stores = plans.storesOf(account.id);
  if (!stores.length) throw httpError(404, "This account has no store yet. Create one in Snapfront first.");
  if (storeId == null || storeId === "") return stores[0];
  const s = stores.find((x) => x.id === storeId);
  if (!s) throw httpError(404, "That store isn't in this Snapfront account. Use list_stores to see the store IDs.");
  return s;
}
const productSummary = (p) => ({
  product_id: p.id, title: p.title, status: p.status, kind: p.kind, price: p.price, original_price: p.compare_at ?? null,
  category: p.category || "", has_photo: Boolean(p.image_url), has_download: p.kind === "digital" ? p.has_delivery : undefined, page_url: p.page_url,
});
function storeView(s) {
  const pub = store.publicSeller(s);
  return {
    store_id: s.id, name: pub.store_name, url: pub.store_url, tagline: pub.tagline || "", about: pub.about, announcement: pub.announcement,
    look: { theme_id: pub.theme, theme_name: themeName(pub.theme), hero_title: pub.hero_title, hero_subtitle: pub.hero_subtitle, hero_eyebrow: pub.hero_eyebrow, hero_cta: pub.hero_cta, hero_motion: pub.hero_motion, cover_photo: Boolean(pub.banner_url) },
    payments_ready: pub.stripe_ready,
  };
}
const designFields = {
  theme_id: z.string().max(60).optional().describe("A store look ID from list_store_looks."),
  hero_title: z.string().max(100).optional().describe("The big headline at the top of the store (up to 100 characters)."),
  hero_subtitle: z.string().max(220).optional().describe("The line under the headline (up to 220 characters)."),
  hero_eyebrow: z.string().max(48).optional().describe("A short label above the headline (up to 48 characters)."),
  hero_cta: z.string().max(32).optional().describe("The main button's words, like Shop now (up to 32 characters)."),
  hero_motion: z.enum(["still", "drift", "pan"]).optional().describe("Cover photo motion: still, drift (gentle float) or pan (slow pan)."),
  tagline: z.string().max(160).optional().describe("One-line description of the store."),
  about: z.string().max(600).optional().describe("The About section (up to 600 characters)."),
  announcement: z.string().max(90).optional().describe("A thin banner across the top, like Free shipping over $50. Empty string removes it."),
};
function designPatch(a) {
  const out = {};
  if (a.theme_id != null) { if (!THEME_IDS.has(a.theme_id)) throw httpError(400, "That store look doesn't exist. Use list_store_looks to see the IDs."); out.theme = a.theme_id; }
  for (const k of ["hero_title", "hero_subtitle", "hero_eyebrow", "hero_cta", "hero_motion", "tagline", "about", "announcement"]) if (a[k] != null) out[k] = a[k];
  return out;
}
const productFields = {
  title: z.string().min(1).max(120).optional(),
  tagline: z.string().max(160).optional().describe("One short line under the title."),
  description: z.string().max(3000).optional().describe("The product description. Plain text; blank lines between paragraphs."),
  bullets: z.array(z.string().max(200)).max(6).optional().describe("Up to 6 short selling points."),
  faq: z.array(z.object({ q: z.string().max(200), a: z.string().max(800) })).max(6).optional().describe("Up to 6 questions and answers."),
  tags: z.array(z.string().max(30)).max(6).optional(),
  category: z.string().max(60).optional(),
  price: z.number().min(0).max(1000000).optional().describe("Price in US dollars, like 12 or 19.99."),
  original_price: z.number().positive().max(1000000).nullable().optional().describe("An optional higher original price shown crossed out next to the price, for a sale. null removes it."),
};
function productPatch(a) {
  const out = {};
  for (const k of ["title", "tagline", "description", "bullets", "faq", "tags", "category", "price"]) if (a[k] !== undefined) out[k] = a[k];
  if (a.original_price !== undefined) out.compare_at = a.original_price;
  return out;
}

function checkStore(s) {
  const issues = [];
  const add = (severity, where, problem, fix) => issues.push({ severity, where, problem, fix });
  const pub = store.publicSeller(s);
  const products = store.listProducts(s);
  const live = products.filter((p) => p.status === "live");
  if (!pub.stripe_ready) add("high", "Store", "Payments aren't set up, so buyers can't check out.", "In Snapfront, open Settings and tap Connect Stripe.");
  if (!live.length) add("high", "Store", "No products are live yet.", "Finish a product in Snapfront and tap Publish.");
  if (!pub.hero_title) add("medium", "Store look", "The store has no headline.", "Set hero_title with update_store_design.");
  if (!pub.about) add("low", "Store", "The About section is empty.", "Write a short About with update_store_design.");
  if (!pub.banner_url) add("low", "Store look", "There's no cover photo.", "Add one in Snapfront: Store look, Cover photo.");
  for (const p of products) {
    const where = `${p.title} (${p.status})`;
    if (!p.image_url) add(p.status === "live" ? "high" : "medium", where, "No product photo.", "Add a photo in Snapfront.");
    if (p.kind === "digital" && !p.has_delivery) add("high", where, "No download file is attached.", "Attach the file in Snapfront before selling.");
    if ((p.description || "").length < 120) add("medium", where, "The description is very short.", "Write a fuller description with update_product.");
    if ((p.bullets || []).length < 3) add("low", where, "Fewer than 3 selling points.", "Add bullets with update_product.");
    if (p.price_cents < 50) add(p.status === "live" ? "high" : "medium", where, "The price is under $0.50.", "Set a price with update_product.");
    if (p.compare_at_cents != null && p.compare_at_cents <= p.price_cents) add("low", where, "The original price isn't above the price, so no sale shows.", "Raise original_price or set it to null.");
  }
  return { store: pub.store_name, url: pub.store_url, live_products: live.length, draft_products: products.length - live.length, issues };
}

export function buildServer(account, deps) {
  const server = new McpServer({ name: "snapfront", title: "Snapfront", version: "1.0.0" }, {
    instructions: "Snapfront hosts online stores. Use these tools to read and improve the signed-in seller's store. Changes to a live store or a live product show to buyers right away, so tell the seller what you will change before you call a write tool. New products are created as drafts; the seller adds photos and files and publishes them in the Snapfront app. Prefer preview_store_design before update_store_design.",
  });
  const run = (fn) => async (args) => { try { return await fn(args || {}); } catch (e) { if (!e.status || e.status >= 500) console.error("[connector]", e); return fail(e.status && e.status < 500 ? e.message : "Snapfront couldn't do that just now. Try again."); } };

  server.registerTool("list_stores", { title: "List my stores", description: "Lists the stores on this Snapfront account with their IDs, web addresses, looks and product counts.", inputSchema: {}, annotations: READ },
    run(() => json({ stores: plans.storesOf(account.id).map((s) => {
      const products = store.listProducts(s);
      return { store_id: s.id, name: s.store_name, url: store.publicSeller(s).store_url, look: themeName(store.publicSeller(s).theme), live_products: products.filter((p) => p.status === "live").length, draft_products: products.filter((p) => p.status !== "live").length };
    }) })));

  server.registerTool("get_store", { title: "Get store", description: "The store's name, words, current look, payment status and its products. store_id is optional (defaults to the first store).", inputSchema: { store_id: z.string().optional() }, annotations: READ },
    run(({ store_id }) => { const s = storeOf(account, store_id); return json({ ...storeView(s), products: store.listProducts(s).map(productSummary) }); }));

  server.registerTool("get_product", { title: "Get product", description: "Everything about one product: words, price, original price, options, stock and links.", inputSchema: { product_id: z.string(), store_id: z.string().optional() }, annotations: READ },
    run(({ product_id, store_id }) => {
      const s = storeOf(account, store_id), p = store.withPage(s, store.productRow(s, product_id));
      return json({ ...productSummary(p), tagline: p.tagline, description: p.description, bullets: p.bullets, faq: p.faq, tags: p.tags, label: p.label || "",
        options: p.variants.map((v) => ({ name: v.name, price: v.price, in_stock: v.inventory == null ? "unlimited" : v.inventory })), stock: p.inventory == null ? "unlimited" : p.inventory, image_url: p.image_url });
    }));

  server.registerTool("list_store_looks", { title: "List store looks", description: "All store looks (themes) the seller can switch to: ID, name, who it suits, its vibe, light or dark, and a preview image link.", inputSchema: {}, annotations: READ },
    run(() => json({ looks: publicThemes().map((t) => ({ theme_id: t.id, name: t.name, suits: t.category || t.for, vibe: t.vibe, dark: t.dark, preview_url: t.preview_url })) })));

  server.registerTool("check_store", { title: "Check store", description: "Checks the store and its products for problems that cost sales (missing photos, files, payments, short descriptions, prices) and says how to fix each.", inputSchema: { store_id: z.string().optional() }, annotations: READ },
    run(({ store_id }) => json(checkStore(storeOf(account, store_id)))));

  server.registerTool("preview_store_design", { title: "Preview store design", description: "Makes a private preview link of the store with a new look and words, without changing the live store. The link works for 30 minutes.", inputSchema: { store_id: z.string().optional(), ...designFields }, annotations: READ },
    run((a) => { const s = storeOf(account, a.store_id); const patch = store.storefrontPatch(s, designPatch(a)); return json({ preview_url: deps.createPreview(s, patch), expires_in_minutes: 30, note: "Nothing changed on the live store." }); }));

  server.registerTool("update_store_design", { title: "Update store design", description: "Changes the live store's look and words. Buyers see the change right away. Only the fields you send change.", inputSchema: { store_id: z.string().optional(), ...designFields }, annotations: { ...WRITE, idempotentHint: true } },
    run((a) => {
      const s = storeOf(account, a.store_id), patch = designPatch(a);
      if (!Object.keys(patch).length) throw httpError(400, "Send at least one field to change.");
      store.updateStore(s, patch);
      return json({ updated: Object.keys(patch), ...storeView(plans.storesOf(account.id).find((x) => x.id === s.id)) });
    }));

  server.registerTool("create_draft_product", { title: "Create draft product", description: "Creates a new product as a draft (not visible to buyers). The seller adds the photo or download file and publishes it in Snapfront.", inputSchema: { store_id: z.string().optional(), kind: z.enum(["digital", "physical"]).describe("digital = a download, physical = something shipped"), ...productFields, title: z.string().min(1).max(120), price: z.number().min(0).max(1000000) }, annotations: WRITE },
    run((a) => {
      const s = storeOf(account, a.store_id);
      if (db.prepare("SELECT COUNT(*) n FROM products WHERE seller_id = ? AND created_at >= datetime('now','-1 day')").get(s.id).n >= 50) throw httpError(429, "That's 50 new products today. Make more tomorrow.");
      const p = store.createProduct(s, { ...productPatch(a), kind: a.kind });
      return json({ created: true, ...productSummary(p), next_step: "Open the product in Snapfront to add a photo (and the download file for digital products), then tap Publish." });
    }));

  server.registerTool("update_product", { title: "Update product", description: "Changes a product's words, price or original (sale) price. If the product is live, buyers see the change right away. Only the fields you send change.", inputSchema: { product_id: z.string(), store_id: z.string().optional(), ...productFields }, annotations: { ...WRITE, idempotentHint: true } },
    run((a) => {
      const s = storeOf(account, a.store_id), patch = productPatch(a);
      if (!Object.keys(patch).length) throw httpError(400, "Send at least one field to change.");
      const p = store.updateProduct(s, a.product_id, patch);
      return json({ updated: Object.keys(patch).map((k) => (k === "compare_at" ? "original_price" : k)), ...productSummary(p) });
    }));


  server.registerTool("use_picture_from_link", {
    title: "Use a picture from a link",
    description: "Saves a picture from a public https link (for example an image another app or connector made, like an AI avatar or model photo) and uses it as a product's photo or as the store's cover photo. Product photos on live products and the cover photo show to buyers right away.",
    inputSchema: { store_id: z.string().optional(), image_url: z.string().url().max(2000), use_as: z.enum(["product_photo", "cover_photo"]), product_id: z.string().optional().describe("Required when use_as is product_photo.") },
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
  }, run(async (a) => {
    const s = storeOf(account, a.store_id);
    if (a.use_as === "product_photo" && !a.product_id) throw httpError(400, "Say which product with product_id.");
    if (a.use_as === "product_photo") store.productRow(s, a.product_id);   // check first, before downloading
    if (limited(`picture:${s.id}`, 30, 60 * 60e3)) throw httpError(429, "That's a lot of pictures this hour. Try again later.");
    const jpg = await pictureFromLink(a.image_url);
    const file = deps.saveImage(jpg.toString("base64"), "image/jpeg", s.id);
    if (a.use_as === "product_photo") {
      const p = store.updateProduct(s, a.product_id, { image_file: file });
      return json({ saved: true, used_as: "product_photo", ...productSummary(p), image_url: p.image_url });
    }
    deps.addCoverPhoto(s, file);
    store.updateStore(s, { banner_file: file });
    return json({ saved: true, used_as: "cover_photo", store_url: store.publicSeller(s).store_url });
  }));

  server.registerTool("make_faceless_video", {
    title: "Make faceless video",
    description: `Makes a vertical faceless short video (TikTok, Reels, Shorts) for a product from a script you write: product photos with on-screen words and a voiceover. Write 3-5 scenes; spoken lines should sound natural read aloud (write numbers as words) and stay specific to the product with no made-up claims. Takes a few minutes; check it with get_video. Voices: ${VOICES.map((v) => `${v.id} (${v.name}, ${v.accent})`).join(", ")}.`,
    inputSchema: {
      store_id: z.string().optional(), product_id: z.string(),
      hook: z.string().max(70).describe("The scroll-stopping first line (up to 70 characters)."),
      scenes: z.array(z.object({ text: z.string().max(60).describe("Words on screen (up to 60 characters)."), say: z.string().max(220).describe("What the voice says (up to 220 characters).") })).min(2).max(6),
      cta: z.string().max(60).optional().describe("The last screen's call to action, like Link in bio."),
      caption: z.string().max(600).optional().describe("The post caption to use when sharing."),
      hashtags: z.array(z.string().max(40)).max(10).optional(),
      voice: z.string().optional().describe("A voice ID from the list above."),
    },
    annotations: WRITE,
  }, run((a) => {
    const s = storeOf(account, a.store_id);
    const j = faceless.start(s, { product_id: a.product_id, voice: a.voice, script: { hook: a.hook, scenes: a.scenes, cta: a.cta, caption: a.caption, hashtags: a.hashtags } });
    return json({ video_id: j.id, status: j.status, note: "The video is being made. Call get_video in a minute or two." });
  }));

  server.registerTool("get_video", { title: "Get video", description: "The status of a faceless video, with watch and download links once it's done.", inputSchema: { video_id: z.string(), store_id: z.string().optional() }, annotations: READ },
    run(({ video_id, store_id }) => { const j = faceless.job(storeOf(account, store_id), video_id); return json({ video_id: j.id, status: j.status, seconds: j.seconds, watch_url: j.url, download_url: j.download_url, error: j.error || undefined }); }));

  return server;
}

/* ---------- routes ---------- */
const cors = (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Expose-Headers", "WWW-Authenticate, Mcp-Session-Id");
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, Mcp-Protocol-Version, Mcp-Session-Id");
    res.setHeader("Access-Control-Max-Age", "86400");
    return res.status(204).end();
  }
  next();
};
const oauthError = (res, status, error, description) => res.status(status).set("Cache-Control", "no-store").json({ error, error_description: description });
const pageHeaders = (res) => res.set({ "Cache-Control": "no-store", "X-Frame-Options": "DENY", "Content-Security-Policy": "frame-ancestors 'none'; form-action 'self' https: http://localhost:* http://127.0.0.1:*", "Referrer-Policy": "no-referrer" });
const hostOf = (u) => { try { return new URL(u).host; } catch { return ""; } };
const redirectWith = (uri, params) => { const u = new URL(uri); for (const [k, v] of Object.entries(params)) if (v != null) u.searchParams.set(k, v); return u.href; };
const sameResource = (r) => r == null || r === "" || r.replace(/\/$/, "") === RESOURCE;

export function mountConnector(app, deps) {
  const protectedResource = { resource: RESOURCE, authorization_servers: [ISSUER], scopes_supported: [SCOPE], bearer_methods_supported: ["header"], resource_name: "Snapfront", resource_documentation: `${ISSUER}/connect-ai` };
  const authServer = {
    issuer: ISSUER, authorization_endpoint: `${ISSUER}/oauth/authorize`, token_endpoint: `${ISSUER}/oauth/token`, registration_endpoint: `${ISSUER}/oauth/register`,
    revocation_endpoint: `${ISSUER}/oauth/revoke`, response_types_supported: ["code"], response_modes_supported: ["query"], grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"], token_endpoint_auth_methods_supported: ["none", "client_secret_post", "client_secret_basic"], revocation_endpoint_auth_methods_supported: ["none", "client_secret_post", "client_secret_basic"],
    scopes_supported: [SCOPE, "offline_access"], client_id_metadata_document_supported: true, authorization_response_iss_parameter_supported: true, service_documentation: `${ISSUER}/connect-ai`,
  };
  for (const p of ["/.well-known/oauth-protected-resource", "/.well-known/oauth-protected-resource/mcp"]) app.get(p, cors, (_req, res) => res.set("Cache-Control", "public, max-age=3600").json(protectedResource));
  for (const p of ["/.well-known/oauth-authorization-server", "/.well-known/oauth-authorization-server/mcp", "/.well-known/openid-configuration"]) app.get(p, cors, (_req, res) => res.set("Cache-Control", "public, max-age=3600").json(authServer));
  for (const p of ["/.well-known/oauth-protected-resource", "/.well-known/oauth-authorization-server", "/oauth/token", "/oauth/register", "/oauth/revoke", "/mcp"]) app.options(p, cors);

  /* Dynamic client registration (RFC 7591). Public clients get no secret; others get one. */
  app.post("/oauth/register", cors, limit("register", 20, 60 * 60e3), (req, res) => {
    const b = req.body && typeof req.body === "object" ? req.body : {};
    const uris = Array.isArray(b.redirect_uris) ? b.redirect_uris : [];
    if (!uris.length || uris.length > 10 || !uris.every(validRedirect)) return oauthError(res, 400, "invalid_redirect_uri", "Give 1 to 10 redirect URIs, each https (or http on localhost).");
    const method = b.token_endpoint_auth_method || "client_secret_basic";
    if (!["none", "client_secret_post", "client_secret_basic"].includes(method)) return oauthError(res, 400, "invalid_client_metadata", "Unsupported token_endpoint_auth_method.");
    const grants = b.grant_types || ["authorization_code"];
    if (!Array.isArray(grants) || !grants.includes("authorization_code") || grants.some((g) => !["authorization_code", "refresh_token"].includes(g))) return oauthError(res, 400, "invalid_client_metadata", "Only authorization_code and refresh_token are supported.");
    if (b.response_types && (!Array.isArray(b.response_types) || b.response_types.some((r) => r !== "code"))) return oauthError(res, 400, "invalid_client_metadata", "Only the code response type is supported.");
    sweep();
    const client_id = `sfc_${random(18)}`, secret = method === "none" ? null : random(32);
    const name = String(b.client_name || hostOf(uris[0]) || "AI assistant").replace(/[\u0000-\u001f]/g, "").slice(0, 100);
    db.prepare("INSERT INTO oauth_clients (client_id, secret_hash, name, redirect_uris, auth_method) VALUES (?,?,?,?,?)").run(client_id, secret ? sha(secret) : null, name, JSON.stringify(uris), method);
    res.status(201).set("Cache-Control", "no-store").json({ client_id, ...(secret ? { client_secret: secret, client_secret_expires_at: 0 } : {}), client_id_issued_at: now(), client_name: name,
      redirect_uris: uris, token_endpoint_auth_method: method, grant_types: ["authorization_code", "refresh_token"], response_types: ["code"], scope: SCOPE });
  });

  /* The sign-in and consent pages. Nothing is redirected until the client and redirect URI check out. */
  const pendingFor = (rid) => {
    const r = db.prepare("SELECT * FROM oauth_requests WHERE id = ?").get(String(rid || ""));
    return r && r.expires_at >= now() ? r : null;
  };
  const expired = (res) => pageHeaders(res).status(400).send(connectPage({ step: "error", message: "This sign-in link has expired. Go back to your AI assistant and connect Snapfront again." }));

  app.get("/oauth/authorize", limit("authorize", 60, 60e3), async (req, res) => {
    const q = req.query;
    const client = await findClient(q.client_id);
    if (!client) return pageHeaders(res).status(400).send(connectPage({ step: "error", message: "This app isn't registered with Snapfront. Remove the connector in your AI assistant and add it again." }));
    const redirect = typeof q.redirect_uri === "string" ? q.redirect_uri : (client.redirect_uris.length === 1 ? client.redirect_uris[0] : "");
    if (!redirect || !redirectAllowed(client.redirect_uris, redirect)) return pageHeaders(res).status(400).send(connectPage({ step: "error", message: "The return address for this app doesn't match what it registered, so Snapfront won't send you there." }));
    const back = (error, description) => res.redirect(302, redirectWith(redirect, { error, error_description: description, state: q.state, iss: ISSUER }));
    if (q.response_type !== "code") return back("unsupported_response_type", "Only response_type=code is supported.");
    if (typeof q.code_challenge !== "string" || !/^[A-Za-z0-9_-]{43,128}$/.test(q.code_challenge) || q.code_challenge_method !== "S256") return back("invalid_request", "PKCE with S256 is required.");
    if (!sameResource(q.resource)) return back("invalid_target", `The resource must be ${RESOURCE}.`);
    sweep();
    const id = random(24);
    db.prepare("INSERT INTO oauth_requests (id, client_id, client_name, redirect_uri, state, code_challenge, scope, resource, expires_at) VALUES (?,?,?,?,?,?,?,?,?)")
      .run(id, client.client_id, client.name, redirect, typeof q.state === "string" ? q.state.slice(0, 500) : null, q.code_challenge, SCOPE, RESOURCE, now() + REQUEST_TTL);
    pageHeaders(res).send(connectPage({ step: "email", rid: id, app: client.name, site: hostOf(redirect) }));
  });

  const form = express.urlencoded({ extended: false, limit: "8kb" });
  app.post("/oauth/authorize/email", limit("authorize-email", 20, 60e3), form, async (req, res) => {
    const r = pendingFor(req.body?.rid);
    if (!r) return expired(res);
    const email = String(req.body?.email || "").trim().toLowerCase().slice(0, 200);
    const page = (extra) => pageHeaders(res).send(connectPage({ rid: r.id, app: r.client_name, site: hostOf(r.redirect_uri), ...extra }));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return page({ step: "email", error: "Enter the email you use for Snapfront." });
    if (limited(`connect-email:${email}`, 10, 60 * 60e3)) return page({ step: "email", error: "Too many codes requested for this email. Wait a little and try again." });
    const account = db.prepare("SELECT id FROM accounts WHERE email = ?").get(email);
    const review = config.reviewLogins.get(email);
    const code = review || String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
    db.prepare("UPDATE oauth_requests SET email = ?, code_hash = ?, attempts = 0, account_id = NULL, consent_token = NULL WHERE id = ?").run(email, codeHash(r.id, email, code), r.id);
    if (account && !review) {
      try { await auth.emailCode(email, code); }
      catch (e) { return page({ step: "email", error: e.status && e.status < 500 ? e.message : "We couldn't send the email. Try again." }); }
    }
    // Same answer whether or not the email has an account, so the page can't be used to look up members.
    page({ step: "code", email });
  });

  app.post("/oauth/authorize/code", limit("authorize-code", 30, 60e3), form, (req, res) => {
    const r = pendingFor(req.body?.rid);
    if (!r || !r.email) return expired(res);
    const page = (extra) => pageHeaders(res).send(connectPage({ rid: r.id, app: r.client_name, site: hostOf(r.redirect_uri), email: r.email, ...extra }));
    if (r.attempts >= 5) return page({ step: "email", error: "Too many wrong codes. Ask for a new one." });
    const code = String(req.body?.code || "").replace(/\D/g, "");
    const account = db.prepare("SELECT id FROM accounts WHERE email = ?").get(r.email);
    if (!account || !r.code_hash || !same(r.code_hash, codeHash(r.id, r.email, code))) {
      db.prepare("UPDATE oauth_requests SET attempts = attempts + 1 WHERE id = ?").run(r.id);
      return page({ step: "code", error: "That code isn't right. Check the email and try again." });
    }
    const consent = random(24);
    db.prepare("UPDATE oauth_requests SET account_id = ?, consent_token = ?, code_hash = NULL WHERE id = ?").run(account.id, consent, r.id);
    const stores = plans.storesOf(account.id).map((s) => s.store_name);
    page({ step: "consent", consent, stores });
  });

  app.post("/oauth/authorize/decision", limit("authorize-decision", 30, 60e3), form, (req, res) => {
    const r = pendingFor(req.body?.rid);
    if (!r || !r.account_id || !r.consent_token || !same(r.consent_token, String(req.body?.consent || ""))) return expired(res);
    db.prepare("DELETE FROM oauth_requests WHERE id = ?").run(r.id);
    if (req.body?.decision !== "allow") return res.redirect(302, redirectWith(r.redirect_uri, { error: "access_denied", error_description: "The seller didn't allow access.", state: r.state, iss: ISSUER }));
    const code = random(32);
    db.prepare("INSERT INTO oauth_codes (code_hash, client_id, client_name, redirect_uri, code_challenge, account_id, scope, resource, expires_at) VALUES (?,?,?,?,?,?,?,?,?)")
      .run(sha(code), r.client_id, r.client_name, r.redirect_uri, r.code_challenge, r.account_id, r.scope, r.resource, now() + CODE_TTL);
    res.redirect(302, redirectWith(r.redirect_uri, { code, state: r.state, iss: ISSUER }));
  });

  /* Token endpoint: form-encoded (RFC 6749), JSON accepted too. */
  const tokenBody = express.urlencoded({ extended: false, limit: "16kb" });
  async function clientFromRequest(req, res) {
    let id = req.body?.client_id, secret = req.body?.client_secret;
    const basic = /^Basic\s+(.+)$/i.exec(req.get("authorization") || "");
    if (basic) {
      const raw = Buffer.from(basic[1], "base64").toString("utf8"), i = raw.indexOf(":");
      try { id = decodeURIComponent(i < 0 ? raw : raw.slice(0, i)); secret = i < 0 ? "" : decodeURIComponent(raw.slice(i + 1)); } catch { id = ""; }
    }
    const client = await findClient(id);
    if (!client) { oauthError(res, 401, "invalid_client", "Unknown client."); return null; }
    // A client that was given a secret must always send it; public clients rely on PKCE.
    if (client.secret_hash ? !secret || !same(client.secret_hash, sha(secret)) : Boolean(secret)) { oauthError(res, 401, "invalid_client", "The client credentials are wrong."); return null; }
    return client;
  }
  app.post("/oauth/token", cors, limit("token", 120, 60e3), tokenBody, async (req, res) => {
    const b = req.body || {};
    const client = await clientFromRequest(req, res);
    if (!client) return;
    sweep();
    if (b.grant_type === "authorization_code") {
      const row = db.prepare("SELECT * FROM oauth_codes WHERE code_hash = ?").get(sha(b.code || ""));
      if (row) db.prepare("DELETE FROM oauth_codes WHERE code_hash = ?").run(row.code_hash);   // one use only
      if (!row || row.expires_at < now() || row.client_id !== client.client_id) return oauthError(res, 400, "invalid_grant", "The code is invalid or has expired.");
      if (b.redirect_uri !== undefined && b.redirect_uri !== row.redirect_uri) return oauthError(res, 400, "invalid_grant", "redirect_uri doesn't match.");
      const verifier = String(b.code_verifier || "");
      if (!/^[A-Za-z0-9._~-]{43,128}$/.test(verifier) || !same(crypto.createHash("sha256").update(verifier).digest("base64url"), row.code_challenge)) return oauthError(res, 400, "invalid_grant", "The PKCE code_verifier doesn't match.");
      if (!sameResource(b.resource)) return oauthError(res, 400, "invalid_target", `The resource must be ${RESOURCE}.`);
      const grant = newId("ocg");
      db.transaction(() => {
        // Reconnecting the same app replaces its old connection instead of piling up duplicates.
        db.prepare("DELETE FROM oauth_grants WHERE account_id = ? AND client_id = ?").run(row.account_id, row.client_id);
        db.prepare("INSERT INTO oauth_grants (id, account_id, client_id, client_name, redirect_host, scope) VALUES (?,?,?,?,?,?)").run(grant, row.account_id, row.client_id, row.client_name, hostOf(row.redirect_uri), row.scope);
      })();
      return res.set("Cache-Control", "no-store").json(issueTokens(grant));
    }
    if (b.grant_type === "refresh_token") {
      const g = db.prepare("SELECT * FROM oauth_grants WHERE refresh_hash = ?").get(sha(b.refresh_token || ""));
      if (!g || g.refresh_expires < now() || g.client_id !== client.client_id || !plans.getAccount(g.account_id)) return oauthError(res, 400, "invalid_grant", "The refresh token is invalid or has expired.");
      return res.set("Cache-Control", "no-store").json(issueTokens(g.id));   // rotates the refresh token
    }
    oauthError(res, 400, "unsupported_grant_type", "Use authorization_code or refresh_token.");
  });

  /* Revocation (RFC 7009): always 200. A refresh token ends the whole connection. */
  app.post("/oauth/revoke", cors, limit("revoke", 60, 60e3), tokenBody, async (req, res) => {
    const client = await clientFromRequest(req, res);
    if (!client) return;
    const h = sha(req.body?.token || "");
    const t = db.prepare("SELECT t.grant_id, g.client_id FROM oauth_tokens t JOIN oauth_grants g ON g.id = t.grant_id WHERE t.token_hash = ?").get(h);
    if (t && t.client_id === client.client_id) db.prepare("DELETE FROM oauth_tokens WHERE token_hash = ?").run(h);
    db.prepare("DELETE FROM oauth_grants WHERE refresh_hash = ? AND client_id = ?").run(h, client.client_id);
    res.status(200).end();
  });

  /* The MCP endpoint (Streamable HTTP, stateless: a fresh server per request). */
  const challenge = (res, error) => res.status(401)
    .set("WWW-Authenticate", `Bearer resource_metadata="${ISSUER}/.well-known/oauth-protected-resource", scope="${SCOPE}"${error ? `, error="${error}"` : ""}`)
    .json({ jsonrpc: "2.0", error: { code: -32001, message: "Sign in to Snapfront to use this connector." }, id: null });
  app.post("/mcp", cors, async (req, res) => {
    const token = (/^Bearer\s+(.+)$/i.exec(req.get("authorization") || "") || [])[1];
    const who = accountForAccessToken(token);
    if (!who) return challenge(res, token ? "invalid_token" : null);
    if (limited(`mcp:${who.grantId}`, 120, 60e3)) return res.status(429).json({ jsonrpc: "2.0", error: { code: -32000, message: "Too many requests. Wait a minute." }, id: null });
    const server = buildServer(who.account, deps);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    res.on("close", () => { transport.close().catch(() => {}); server.close().catch(() => {}); });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (e) {
      console.error("[connector] mcp", e);
      if (!res.headersSent) res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "Snapfront had a problem. Try again." }, id: null });
    }
  });
  for (const m of ["get", "delete"]) app[m]("/mcp", cors, (_req, res) => res.status(405).set("Allow", "POST").json({ jsonrpc: "2.0", error: { code: -32000, message: "Use POST." }, id: null }));
}

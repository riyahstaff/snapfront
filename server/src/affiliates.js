// Affiliate program: people share a store link with ?ref=CODE, Snapfront counts their clicks and
// the orders that follow (within the store's cookie window), and works out what they've earned.
// Sellers pay affiliates themselves (PayPal, Venmo, bank) and mark payouts here; refunds reduce
// commission automatically. Affiliates see their own numbers on a private page.
import crypto from "node:crypto";
import { config } from "./config.js";
import { db, newId } from "./db.js";
import { httpError } from "./claude.js";
import * as plans from "./plans.js";
import { storeUrl } from "./urls.js";
import { registerExport, csv } from "./business.js";
import { sendEmail } from "./growth.js";
import { cleanEmail } from "./audience.js";

const addCol = (t, name, def) => { if (!db.prepare(`PRAGMA table_info(${t})`).all().some((c) => c.name === name)) db.exec(`ALTER TABLE ${t} ADD COLUMN ${name} ${def}`); };
addCol("sellers", "aff_enabled", "INTEGER NOT NULL DEFAULT 0");
addCol("sellers", "aff_rate", "INTEGER NOT NULL DEFAULT 10");          // percent of the order, before shipping and tax
addCol("sellers", "aff_cookie_days", "INTEGER NOT NULL DEFAULT 30");
addCol("sellers", "aff_auto_approve", "INTEGER NOT NULL DEFAULT 1");
addCol("sellers", "aff_blurb", "TEXT NOT NULL DEFAULT ''");
addCol("orders", "affiliate_id", "TEXT");
addCol("orders", "commission_cents", "INTEGER");
db.exec(`
CREATE TABLE IF NOT EXISTS affiliates (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  rate INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','pending','paused')),
  token TEXT NOT NULL UNIQUE,
  about TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (seller_id, email),
  UNIQUE (seller_id, code)
);
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  affiliate_id TEXT NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  visitor TEXT NOT NULL,
  PRIMARY KEY (affiliate_id, day, visitor)
);
CREATE TABLE IF NOT EXISTS affiliate_payouts (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  affiliate_id TEXT NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS orders_affiliate ON orders (affiliate_id);
`);

const line = (s, n) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);
const dollars = (c) => Math.round(c || 0) / 100;
const planOf = (seller) => (seller.account_id ? plans.effectivePlan(plans.getAccount(seller.account_id)) : "pro");
const isPro = (seller) => planOf(seller) === "pro";
const sellerById = (id) => db.prepare("SELECT * FROM sellers WHERE id = ?").get(id);
export const normCode = (c) => String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);

/** Is the program running for buyers (switched on, and the store is on Pro)? */
export const programLive = (seller) => Boolean(seller?.aff_enabled) && isPro(seller);

/* ---------- money: commission earned (less refunds), paid out, still owed ---------- */
// Commission shrinks in step with any refund on the order.
const EARNED = `CASE WHEN o.total_cents > 0 THEN o.commission_cents * MAX(0, o.total_cents - COALESCE(o.refunded_cents, 0)) / o.total_cents ELSE 0 END`;
function statsFor(sellerId, affiliateId = null) {
  const filter = affiliateId ? "AND a.id = ?" : "";
  const args = affiliateId ? [sellerId, affiliateId] : [sellerId];
  const rows = db.prepare(`SELECT a.*,
      (SELECT COUNT(*) FROM affiliate_clicks c WHERE c.affiliate_id = a.id) AS clicks,
      (SELECT COUNT(*) FROM orders o WHERE o.affiliate_id = a.id AND o.status IN ('paid','fulfilled')) AS orders,
      (SELECT COALESCE(SUM(o.subtotal_cents - o.discount_cents), 0) FROM orders o WHERE o.affiliate_id = a.id AND o.status IN ('paid','fulfilled')) AS revenue,
      (SELECT COALESCE(SUM(${EARNED}), 0) FROM orders o WHERE o.affiliate_id = a.id AND o.status IN ('paid','fulfilled')) AS earned,
      (SELECT COALESCE(SUM(p.amount_cents), 0) FROM affiliate_payouts p WHERE p.affiliate_id = a.id) AS paid
    FROM affiliates a WHERE a.seller_id = ? ${filter} ORDER BY a.created_at DESC, a.rowid DESC`).all(...args);
  return rows;
}
const linkFor = (seller, a) => storeUrl(seller.store_slug, `/?ref=${a.code}`);
const portalUrl = (seller, a) => storeUrl(seller.store_slug, `/affiliate?t=${a.token}`);
const publicAffiliate = (seller, r) => ({
  id: r.id, name: r.name, email: r.email, code: r.code, rate: r.rate ?? seller.aff_rate, custom_rate: r.rate != null, status: r.status, about: r.about,
  created_at: r.created_at, link: linkFor(seller, r), portal_url: portalUrl(seller, r),
  clicks: r.clicks, orders: r.orders, revenue: dollars(r.revenue), earned: dollars(r.earned), paid: dollars(r.paid), owed: dollars(Math.max(0, Math.round(r.earned) - r.paid)),
});

/* ---------- the seller's side ---------- */
export function overview(seller) {
  seller = sellerById(seller.id);
  const list = statsFor(seller.id).map((r) => publicAffiliate(seller, r));
  const sum = (k) => Math.round(list.reduce((t, a) => t + a[k] * 100, 0)) / 100;
  return {
    pro: isPro(seller),
    settings: { enabled: Boolean(seller.aff_enabled), rate: seller.aff_rate, cookie_days: seller.aff_cookie_days, auto_approve: Boolean(seller.aff_auto_approve), blurb: seller.aff_blurb },
    join_url: storeUrl(seller.store_slug, "/affiliates"),
    totals: { affiliates: list.filter((a) => a.status === "active").length, pending: list.filter((a) => a.status === "pending").length, clicks: list.reduce((t, a) => t + a.clicks, 0),
      orders: list.reduce((t, a) => t + a.orders, 0), revenue: sum("revenue"), earned: sum("earned"), paid: sum("paid"), owed: sum("owed") },
    affiliates: list,
  };
}
export function updateSettings(seller, b = {}) {
  if (b.enabled && !isPro(seller)) throw httpError(402, "The affiliate program comes with Pro.", { upgrade: "pro" });
  const set = {};
  if (b.enabled !== undefined) set.aff_enabled = b.enabled ? 1 : 0;
  if (b.rate !== undefined) {
    const r = Math.round(Number(b.rate));
    if (!(r >= 1 && r <= 90)) throw httpError(400, "Set a commission between 1% and 90%.");
    set.aff_rate = r;
  }
  if (b.cookie_days !== undefined) {
    const d = Math.round(Number(b.cookie_days));
    if (!(d >= 1 && d <= 365)) throw httpError(400, "Pick between 1 and 365 days.");
    set.aff_cookie_days = d;
  }
  if (b.auto_approve !== undefined) set.aff_auto_approve = b.auto_approve ? 1 : 0;
  if (b.blurb !== undefined) set.aff_blurb = String(b.blurb || "").replace(/\r\n?/g, "\n").trim().slice(0, 600);
  const keys = Object.keys(set);
  if (keys.length) db.prepare(`UPDATE sellers SET ${keys.map((k) => `${k} = ?`).join(", ")} WHERE id = ?`).run(...keys.map((k) => set[k]), seller.id);
  return overview(seller);
}
function uniqueCode(seller, wanted, name) {
  let base = normCode(wanted) || normCode(String(name || "").split(" ")[0]) || "PARTNER";
  if (base.length < 3) base = `${base}PAL`.slice(0, 16);
  if (wanted && normCode(wanted).length >= 3) {
    if (db.prepare("SELECT 1 FROM affiliates WHERE seller_id = ? AND code = ?").get(seller.id, base)) throw httpError(409, `The code ${base} is taken. Try another.`);
    return base;
  }
  for (let i = 0; i < 50; i++) {
    const c = i ? `${base.slice(0, 13)}${10 + Math.floor(Math.random() * 990)}` : base;
    if (!db.prepare("SELECT 1 FROM affiliates WHERE seller_id = ? AND code = ?").get(seller.id, c)) return c;
  }
  return `${base.slice(0, 8)}${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}
function insert(seller, { name, email, code, rate = null, status, about = "" }) {
  const e = cleanEmail(email);
  if (!e) throw httpError(400, "Enter a valid email address.");
  const n = line(name, 80);
  if (!n) throw httpError(400, "Enter their name.");
  if (db.prepare("SELECT 1 FROM affiliates WHERE seller_id = ? AND email = ?").get(seller.id, e)) throw httpError(409, "That email is already an affiliate here.");
  if (db.prepare("SELECT COUNT(*) AS n FROM affiliates WHERE seller_id = ?").get(seller.id).n >= 1000) throw httpError(429, "This store has 1,000 affiliates, the most it can have.");
  const id = newId("aff");
  db.prepare("INSERT INTO affiliates (id, seller_id, name, email, code, rate, status, token, about) VALUES (?,?,?,?,?,?,?,?,?)")
    .run(id, seller.id, n, e, uniqueCode(seller, code, n), rate, status, crypto.randomBytes(24).toString("base64url"), line(about, 300));
  return db.prepare("SELECT * FROM affiliates WHERE id = ?").get(id);
}
const rateOrNull = (v) => {
  if (v === undefined || v === null || v === "") return null;
  const r = Math.round(Number(v));
  if (!(r >= 1 && r <= 90)) throw httpError(400, "Set a commission between 1% and 90%.");
  return r;
};
export function addAffiliate(seller, b = {}) {
  if (!isPro(seller)) throw httpError(402, "The affiliate program comes with Pro.", { upgrade: "pro" });
  const a = insert(seller, { name: b.name, email: b.email, code: b.code, rate: rateOrNull(b.rate), status: "active" });
  if (b.notify !== false) welcomeEmail(sellerById(seller.id), a).catch(() => {});
  return publicAffiliate(seller, statsFor(seller.id, a.id)[0]);
}
export function updateAffiliate(seller, id, b = {}) {
  const a = db.prepare("SELECT * FROM affiliates WHERE id = ? AND seller_id = ?").get(String(id), seller.id);
  if (!a) throw httpError(404, "That affiliate doesn't exist.");
  if (b.status !== undefined) {
    if (!["active", "paused"].includes(b.status)) throw httpError(400, "Set the affiliate to active or paused.");
    db.prepare("UPDATE affiliates SET status = ? WHERE id = ?").run(b.status, a.id);
    if (a.status === "pending" && b.status === "active") welcomeEmail(sellerById(seller.id), a).catch(() => {});
  }
  if (b.rate !== undefined) db.prepare("UPDATE affiliates SET rate = ? WHERE id = ?").run(rateOrNull(b.rate), a.id);
  if (b.name !== undefined && line(b.name, 80)) db.prepare("UPDATE affiliates SET name = ? WHERE id = ?").run(line(b.name, 80), a.id);
  if (b.code !== undefined && normCode(b.code) !== a.code) {
    const c = normCode(b.code);
    if (c.length < 3) throw httpError(400, "Codes need at least 3 letters or numbers.");
    if (db.prepare("SELECT 1 FROM affiliates WHERE seller_id = ? AND code = ?").get(seller.id, c)) throw httpError(409, `The code ${c} is taken.`);
    db.prepare("UPDATE affiliates SET code = ? WHERE id = ?").run(c, a.id);
  }
  return publicAffiliate(sellerById(seller.id), statsFor(seller.id, a.id)[0]);
}
export function deleteAffiliate(seller, id) {
  const a = db.prepare("SELECT * FROM affiliates WHERE id = ? AND seller_id = ?").get(String(id), seller.id);
  if (!a) throw httpError(404, "That affiliate doesn't exist.");
  const owed = Math.round(statsFor(seller.id, a.id)[0].earned) - statsFor(seller.id, a.id)[0].paid;
  if (owed > 0) throw httpError(409, `You still owe ${a.name} $${(owed / 100).toFixed(2)}. Pay and mark it paid, or pause them instead.`);
  db.prepare("DELETE FROM affiliates WHERE id = ?").run(a.id);
}
export function payouts(seller, id) {
  return db.prepare("SELECT id, amount_cents, note, created_at FROM affiliate_payouts WHERE seller_id = ? AND affiliate_id = ? ORDER BY created_at DESC").all(seller.id, String(id))
    .map((p) => ({ id: p.id, amount: dollars(p.amount_cents), note: p.note, created_at: p.created_at }));
}
export function addPayout(seller, id, b = {}) {
  const a = db.prepare("SELECT * FROM affiliates WHERE id = ? AND seller_id = ?").get(String(id), seller.id);
  if (!a) throw httpError(404, "That affiliate doesn't exist.");
  const amount = Math.round(Number(b.amount) * 100);
  if (!(amount > 0) || amount > 10_000_000) throw httpError(400, "Enter the amount you paid, like 25.00.");
  db.prepare("INSERT INTO affiliate_payouts (id, seller_id, affiliate_id, amount_cents, note) VALUES (?,?,?,?,?)").run(newId("apo"), seller.id, a.id, amount, line(b.note, 120));
  return publicAffiliate(seller, statsFor(seller.id, a.id)[0]);
}
export function referredOrders(seller, id) {
  return db.prepare(`SELECT o.id, o.paid_at, o.subtotal_cents - o.discount_cents AS base, o.total_cents, o.refunded_cents, o.commission_cents, ${EARNED} AS earned
    FROM orders o WHERE o.seller_id = ? AND o.affiliate_id = ? AND o.status IN ('paid','fulfilled') ORDER BY o.paid_at DESC LIMIT 200`).all(seller.id, String(id))
    .map((o) => ({ id: o.id, paid_at: o.paid_at, amount: dollars(o.base), commission: dollars(o.earned), refunded: (o.refunded_cents || 0) > 0 }));
}
registerExport("affiliates", (seller) => {
  const list = statsFor(seller.id).map((r) => publicAffiliate(seller, r));
  return { name: `affiliates_${new Date().toISOString().slice(0, 10)}.csv`, body: csv(["Name", "Email", "Code", "Status", "Commission %", "Clicks", "Orders", "Sales", "Earned", "Paid", "Owed"],
    list.map((a) => [a.name, a.email, a.code, a.status, a.rate, a.clicks, a.orders, a.revenue.toFixed(2), a.earned.toFixed(2), a.paid.toFixed(2), a.owed.toFixed(2)])) };
});

/* ---------- the public side: joining, the affiliate's own page ---------- */
async function welcomeEmail(seller, a) {
  if (a.status !== "active" && !(a.status === "pending")) return false;
  const link = linkFor(seller, a), portal = portalUrl(seller, a);
  return sendEmail({ to: a.email, subject: `You're an affiliate for ${seller.store_name}`,
    html: `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#16152E"><p style="font-size:20px;font-weight:700">${seller.store_name.replace(/[<>&]/g, "")}</p>
<p>Hi ${a.name.replace(/[<>&]/g, "")}, you're in! Share your link and earn ${a.rate ?? seller.aff_rate}% of every order it brings in.</p>
<p style="padding:14px;background:#F3F3F1;border-radius:10px;font-weight:600;word-break:break-all">${link}</p>
<p>See your clicks, sales and earnings any time on your affiliate page:</p><p><a href="${portal}">${portal}</a></p>
<p style="color:#777;font-size:12px;margin-top:32px">Keep this email: the page link is private to you.</p></div>`,
    text: `You're an affiliate for ${seller.store_name}. Your link: ${link}\nYour stats: ${portal}`, replyTo: cleanEmail(plans.getAccount(seller.account_id)?.email) || undefined });
}
async function pendingEmail(seller, a) {
  return sendEmail({ to: a.email, subject: `Thanks for applying to ${seller.store_name}'s affiliate program`,
    html: `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#16152E"><p>Hi ${a.name.replace(/[<>&]/g, "")}, thanks for applying! ${seller.store_name.replace(/[<>&]/g, "")} will review your application and you'll get your link by email once you're approved.</p></div>`,
    text: `Thanks for applying to ${seller.store_name}'s affiliate program. You'll get your link by email once you're approved.` });
}
export async function join(seller, b = {}) {
  if (!programLive(seller)) throw httpError(404, "This store doesn't have an affiliate program right now.");
  if (b.website) return { status: "pending" };   // hidden field: a bot filled it
  const existing = cleanEmail(b.email) && db.prepare("SELECT * FROM affiliates WHERE seller_id = ? AND email = ?").get(seller.id, cleanEmail(b.email));
  if (existing) {   // resend their link rather than revealing anything on the page
    if (existing.status === "active") await welcomeEmail(seller, existing).catch(() => false);
    return { status: existing.status === "active" ? "active" : "pending" };
  }
  const a = insert(seller, { name: b.name, email: b.email, status: seller.aff_auto_approve ? "active" : "pending", about: b.about });
  if (a.status === "active") await welcomeEmail(seller, a).catch(() => false); else await pendingEmail(seller, a).catch(() => false);
  return { status: a.status };
}
export function portal(seller, token) {
  const a = token && db.prepare("SELECT * FROM affiliates WHERE token = ? AND seller_id = ?").get(String(token).slice(0, 64), seller.id);
  if (!a) return null;
  const s = publicAffiliate(seller, statsFor(seller.id, a.id)[0]);
  return { ...s, store_name: seller.store_name, recent: referredOrders(seller, a.id).slice(0, 20).map(({ id, ...o }) => o), payouts: payouts(seller, a.id) };
}

/* ---------- tracking ---------- */
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|curl|wget|python|headless|lighthouse/i;
/** A visit with ?ref=CODE: count one click per visitor per day. Returns the code when it's a real, active affiliate. */
export function recordClick(req, seller) {
  const code = normCode(req.query?.ref);
  if (!code || !programLive(seller)) return null;
  const a = db.prepare("SELECT id FROM affiliates WHERE seller_id = ? AND code = ? AND status = 'active'").get(seller.id, code);
  if (!a) return null;
  if (!BOT.test(req.get?.("user-agent") || "")) {
    const day = new Date().toISOString().slice(0, 10);
    const visitor = crypto.createHmac("sha256", config.downloadSecret).update(`aff|${req.ip}|${req.get?.("user-agent") || ""}|${day}`).digest("hex").slice(0, 16);
    db.prepare("INSERT OR IGNORE INTO affiliate_clicks (affiliate_id, day, visitor) VALUES (?,?,?)").run(a.id, day, visitor);
  }
  return code;
}
/** Which affiliate (if any) gets credit for a checkout. */
export function attribute(seller, ref) {
  const code = normCode(ref?.code ?? ref);
  if (!code || !programLive(seller)) return null;
  // The browser keeps the code for the store's cookie window; an older one doesn't count.
  const at = Number(ref?.at);
  if (at && Date.now() - at > seller.aff_cookie_days * 864e5) return null;
  return db.prepare("SELECT id FROM affiliates WHERE seller_id = ? AND code = ? AND status = 'active'").get(seller.id, code)?.id || null;
}
/** After payment: work out the commission (no commission when affiliates buy through their own link). */
export function credit(order) {
  if (!order?.affiliate_id || order.commission_cents != null) return;
  const a = db.prepare("SELECT * FROM affiliates WHERE id = ?").get(order.affiliate_id);
  const seller = sellerById(order.seller_id);
  let cents = 0;
  if (a && seller && a.status === "active" && (order.email || "").toLowerCase() !== a.email) {
    cents = Math.round(((order.subtotal_cents - (order.discount_cents || 0)) * (a.rate ?? seller.aff_rate)) / 100);
  }
  db.prepare("UPDATE orders SET commission_cents = ? WHERE id = ?").run(Math.max(0, cents), order.id);
}

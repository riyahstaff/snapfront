// Tools that bring sellers more sales: Google and Meta product feeds, buyer reviews, store analytics,
// a link-in-bio page, QR codes, and abandoned-checkout reminders.
import crypto from "node:crypto";
import QRCode from "qrcode";
import { config } from "./config.js";
import { db, newId, rowToProduct } from "./db.js";
import { httpError } from "./claude.js";
import * as plans from "./plans.js";
import { storeUrl, storeOrigin } from "./urls.js";

const addCol = (t, name, def) => { if (!db.prepare(`PRAGMA table_info(${t})`).all().some((c) => c.name === name)) db.exec(`ALTER TABLE ${t} ADD COLUMN ${name} ${def}`); };
addCol("sellers", "links", "TEXT NOT NULL DEFAULT '[]'");              // link-in-bio buttons [{label, url}]
addCol("sellers", "abandoned_emails", "INTEGER NOT NULL DEFAULT 1");   // remind buyers who leave checkout (Pro)
addCol("orders", "review_requested_at", "TEXT");
addCol("orders", "recovery_sent_at", "TEXT");
db.exec(`CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  order_id TEXT NOT NULL,
  name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published','hidden')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (order_id, product_id)
)`);
db.exec(`CREATE TABLE IF NOT EXISTS store_visits (
  seller_id TEXT NOT NULL,
  day TEXT NOT NULL,
  product_id TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL,
  visitor TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (seller_id, day, product_id, source, visitor)
)`);

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const isPro = (sellerOrAccount) => plans.effectivePlan(sellerOrAccount.plan ? sellerOrAccount : plans.getAccount(sellerOrAccount.account_id)) === "pro";
const liveProducts = (seller) => db.prepare("SELECT * FROM products WHERE seller_id = ? AND status = 'live' ORDER BY created_at DESC").all(seller.id).map(rowToProduct);

/* ---------- product feeds: Google Merchant Center and Meta (Instagram / Facebook shops) ---------- */
const priceFrom = (p) => Math.min(p.price_cents, ...(p.variants || []).map((v) => v.price_cents ?? p.price_cents));
const plain = (s, n) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n);
function feedItems(seller) {
  return liveProducts(seller).filter((p) => p.image_url && p.price_cents >= 50).map((p) => ({
    id: p.id, title: plain(p.title, 150), description: plain(p.description || p.tagline || p.title, 5000), link: storeUrl(seller.store_slug, `/${p.slug}`),
    image: p.image_url, availability: p.in_stock ? "in stock" : "out of stock", price: `${(priceFrom(p) / 100).toFixed(2)} USD`, brand: plain(seller.store_name, 70),
    category: plain(p.category, 750),
  }));
}
export function googleFeed(seller) {
  const items = feedItems(seller).map((i) => `<item><g:id>${esc(i.id)}</g:id><g:title>${esc(i.title)}</g:title><g:description>${esc(i.description)}</g:description>
<g:link>${esc(i.link)}</g:link><g:image_link>${esc(i.image)}</g:image_link><g:availability>${i.availability}</g:availability><g:price>${i.price}</g:price>
<g:brand>${esc(i.brand)}</g:brand><g:condition>new</g:condition><g:identifier_exists>no</g:identifier_exists>${i.category ? `<g:product_type>${esc(i.category)}</g:product_type>` : ""}</item>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel><title>${esc(seller.store_name)}</title><link>${esc(storeUrl(seller.store_slug))}</link><description>${esc(seller.tagline || seller.store_name)}</description>\n${items}\n</channel></rss>`;
}
const csv = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
export function metaFeed(seller) {
  const head = ["id", "title", "description", "availability", "condition", "price", "link", "image_link", "brand"];
  return [head.join(","), ...feedItems(seller).map((i) => [i.id, i.title, i.description, i.availability, "new", i.price, i.link, i.image, i.brand].map(csv).join(","))].join("\n");
}
export const feedUrls = (seller) => ({ google: storeUrl(seller.store_slug, "/feeds/google.xml"), meta: storeUrl(seller.store_slug, "/feeds/meta.csv") });

/* ---------- link in bio ---------- */
export function cleanLinks(list) {
  if (!Array.isArray(list)) throw httpError(400, "Links must be a list.");
  return list.slice(0, 8).map((l) => {
    const label = plain(l?.label, 40);
    let url = String(l?.url || "").trim();
    if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
    try { const u = new URL(url); if (!/^https?:$/.test(u.protocol) || !u.hostname.includes(".")) throw 0; url = u.href; }
    catch { throw httpError(400, `“${label || url}” isn't a web address.`); }
    if (!label) throw httpError(400, "Give every link a name.");
    return { label, url };
  });
}
export const linksOf = (seller) => { try { return JSON.parse(seller.links || "[]"); } catch { return []; } };
export const linksUrl = (seller) => storeUrl(seller.store_slug, "/links");

export async function qrPng(url, { dark = "#16152E", light = "#FFFFFF" } = {}) {
  return QRCode.toBuffer(url, { type: "png", width: 1024, margin: 2, errorCorrectionLevel: "M", color: { dark, light } });
}

/* ---------- analytics ---------- */
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|curl|wget|python|headless|lighthouse/i;
export function sourceOf(req) {
  const utm = String(req.query?.utm_source || "").toLowerCase();
  const ref = (() => { try { return new URL(req.get("referer") || "").hostname.replace(/^www\./, ""); } catch { return ""; } })();
  const s = utm || ref;
  if (!s) return "direct";
  for (const [k, re] of [["instagram", /instagram|^ig$/], ["tiktok", /tiktok/], ["facebook", /facebook|fb\.|^fb$|^m\.facebook/], ["google", /google/], ["pinterest", /pinterest|pin\.it/],
    ["youtube", /youtube|youtu\.be/], ["x", /^t\.co$|twitter|^x\.com$/], ["snapchat", /snapchat/], ["email", /mail/]]) if (re.test(s)) return k;
  if (config.storeDomain && s.endsWith(config.storeDomain)) return "direct";
  return s.slice(0, 40);
}
/** Count a page view (people only; previews and bots skipped). */
export function recordVisit(req, seller, productId = "") {
  try {
    if (req.method !== "GET" || req.query?.theme || req.query?.preview || BOT.test(req.get("user-agent") || "")) return;
    const day = new Date().toISOString().slice(0, 10);
    const visitor = crypto.createHmac("sha256", config.downloadSecret).update(`${req.ip}|${req.get("user-agent") || ""}|${day}`).digest("hex").slice(0, 16);
    db.prepare(`INSERT INTO store_visits (seller_id, day, product_id, source, visitor) VALUES (?,?,?,?,?)
      ON CONFLICT(seller_id, day, product_id, source, visitor) DO UPDATE SET views = views + 1`).run(seller.id, day, productId || "", sourceOf(req), visitor);
  } catch (e) { console.warn("[visits]", e.message); }
}
export function insights(seller, days = 30) {
  days = [7, 30, 90].includes(Number(days)) ? Number(days) : 30;
  const since = new Date(Date.now() - (days - 1) * 86400e3).toISOString().slice(0, 10);
  const q = (sql, ...a) => db.prepare(sql).all(seller.id, since, ...a);
  const totals = db.prepare("SELECT COUNT(DISTINCT visitor || day) AS visitors, COALESCE(SUM(views),0) AS views FROM store_visits WHERE seller_id = ? AND day >= ?").get(seller.id, since);
  const orders = db.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(total_cents),0) AS cents FROM orders WHERE seller_id = ? AND status IN ('paid','fulfilled') AND date(paid_at) >= ?").get(seller.id, since);
  const byDay = new Map(q("SELECT day, COUNT(DISTINCT visitor) AS visitors FROM store_visits WHERE seller_id = ? AND day >= ? GROUP BY day").map((r) => [r.day, r.visitors]));
  const ordersByDay = new Map(q("SELECT date(paid_at) AS day, COUNT(*) AS n, SUM(total_cents) AS cents FROM orders WHERE seller_id = ? AND status IN ('paid','fulfilled') AND date(paid_at) >= ? GROUP BY date(paid_at)").map((r) => [r.day, r]));
  const daily = Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.parse(`${since}T00:00:00Z`) + i * 86400e3).toISOString().slice(0, 10);
    return { day: d, visitors: byDay.get(d) || 0, orders: ordersByDay.get(d)?.n || 0, sales: (ordersByDay.get(d)?.cents || 0) / 100 };
  });
  const titles = new Map(db.prepare("SELECT id, title FROM products WHERE seller_id = ?").all(seller.id).map((p) => [p.id, p.title]));
  const sold = new Map();
  for (const o of db.prepare("SELECT items FROM orders WHERE seller_id = ? AND status IN ('paid','fulfilled') AND date(paid_at) >= ?").all(seller.id, since))
    for (const l of JSON.parse(o.items)) sold.set(l.product_id, (sold.get(l.product_id) || 0) + l.qty);
  const top = q("SELECT product_id, COUNT(DISTINCT visitor || day) AS visitors FROM store_visits WHERE seller_id = ? AND day >= ? AND product_id != '' GROUP BY product_id ORDER BY visitors DESC LIMIT 8")
    .filter((r) => titles.has(r.product_id)).map((r) => ({ id: r.product_id, title: titles.get(r.product_id), visitors: r.visitors, sold: sold.get(r.product_id) || 0 }));
  const sources = q("SELECT source, COUNT(DISTINCT visitor || day) AS visitors FROM store_visits WHERE seller_id = ? AND day >= ? GROUP BY source ORDER BY visitors DESC LIMIT 8");
  return {
    days, visitors: totals.visitors, views: totals.views, orders: orders.n, sales: orders.cents / 100,
    conversion: totals.visitors ? Math.round((orders.n / totals.visitors) * 1000) / 10 : 0, daily, top_products: top, sources,
  };
}

/* ---------- reviews ---------- */
const reviewSig = (orderId) => crypto.createHmac("sha256", config.downloadSecret).update(`review:${orderId}`).digest("base64url").slice(0, 22);
export const reviewToken = (orderId) => `${orderId}.${reviewSig(orderId)}`;
export function orderForReview(token) {
  const [orderId, sig] = String(token || "").split(".");
  if (!orderId || !sig || sig.length !== 22 || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(reviewSig(orderId)))) throw httpError(404, "That review link isn't valid.");
  const o = db.prepare("SELECT * FROM orders WHERE id = ? AND status IN ('paid','fulfilled')").get(orderId);
  if (!o) throw httpError(404, "That order isn't ready for a review yet.");
  return o;
}
export const reviewUrl = (seller, orderId) => storeUrl(seller.store_slug, `/review?t=${reviewToken(orderId)}`);
/** Products in the order and whether each is reviewed. */
export function reviewable(order) {
  const done = new Set(db.prepare("SELECT product_id FROM reviews WHERE order_id = ?").all(order.id).map((r) => r.product_id));
  const seen = new Set();
  return JSON.parse(order.items).filter((l) => !seen.has(l.product_id) && seen.add(l.product_id))
    .map((l) => ({ product_id: l.product_id, title: l.title, reviewed: done.has(l.product_id) }));
}
export function addReview(order, b) {
  const item = reviewable(order).find((i) => i.product_id === b.product_id);
  if (!item) throw httpError(400, "That product isn't in this order.");
  if (item.reviewed) throw httpError(409, "You've already reviewed this one. Thank you!");
  const rating = Math.round(Number(b.rating));
  if (!(rating >= 1 && rating <= 5)) throw httpError(400, "Pick 1 to 5 stars.");
  const name = plain(b.name, 40) || "Verified buyer";
  db.prepare("INSERT INTO reviews (id, seller_id, product_id, order_id, name, rating, body) VALUES (?,?,?,?,?,?,?)")
    .run(newId("rev"), order.seller_id, item.product_id, order.id, name, rating, plain(b.body, 1000));
}
export function reviewsFor(productId, limit = 10) {
  const stats = db.prepare("SELECT COUNT(*) AS count, AVG(rating) AS avg FROM reviews WHERE product_id = ? AND status = 'published'").get(productId);
  const list = db.prepare("SELECT name, rating, body, created_at FROM reviews WHERE product_id = ? AND status = 'published' ORDER BY created_at DESC LIMIT ?").all(productId, limit);
  return { count: stats.count, avg: stats.count ? Math.round(stats.avg * 10) / 10 : null, list };
}
export function ratingsBySeller(sellerId) {
  return new Map(db.prepare("SELECT product_id, COUNT(*) AS count, AVG(rating) AS avg FROM reviews WHERE seller_id = ? AND status = 'published' GROUP BY product_id").all(sellerId)
    .map((r) => [r.product_id, { count: r.count, avg: Math.round(r.avg * 10) / 10 }]));
}
export const sellerReviews = (seller) => db.prepare(`SELECT r.id, r.product_id, p.title AS product_title, r.name, r.rating, r.body, r.status, r.created_at
  FROM reviews r LEFT JOIN products p ON p.id = r.product_id WHERE r.seller_id = ? ORDER BY r.created_at DESC LIMIT 200`).all(seller.id);
export function setReviewStatus(seller, id, status) {
  if (!["published", "hidden"].includes(status)) throw httpError(400, "Show or hide the review.");
  const r = db.prepare("UPDATE reviews SET status = ? WHERE id = ? AND seller_id = ?").run(status, String(id || ""), seller.id);
  if (!r.changes) throw httpError(404, "That review doesn't exist.");
}

/* ---------- email: review requests and checkout reminders ---------- */
export async function sendEmail({ to, subject, html, text, replyTo }) {
  if (!config.resendKey || !to) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${config.resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: config.emailFrom, to, subject, html, text, ...(replyTo ? { reply_to: replyTo } : {}) }),
  });
  if (!res.ok) console.warn("[email]", res.status, (await res.text()).slice(0, 200));
  return res.ok;
}
const button = (href, label) => `<p style="margin:28px 0"><a href="${esc(href)}" style="background:#16152E;color:#fff;padding:14px 26px;border-radius:999px;text-decoration:none;font-weight:600">${esc(label)}</a></p>`;
const shell = (store, inner) => `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#16152E"><p style="font-size:20px;font-weight:700">${esc(store)}</p>${inner}<p style="color:#777;font-size:12px;margin-top:32px">Sent by ${esc(store)} with Snapfront.</p></div>`;

/** Ask buyers for a review a few days after they buy (Launch and Pro stores). Runs on a timer. */
export async function sendReviewRequests() {
  if (!config.resendKey) return 0;
  const due = db.prepare(`SELECT o.*, s.store_name, s.store_slug, s.account_id FROM orders o JOIN sellers s ON s.id = o.seller_id
    WHERE o.status IN ('paid','fulfilled') AND o.email IS NOT NULL AND o.review_requested_at IS NULL
      AND o.paid_at <= datetime('now', CASE WHEN o.items LIKE '%"kind":"physical"%' THEN '-7 days' ELSE '-2 days' END)
      AND o.paid_at >= datetime('now', '-30 days') LIMIT 50`).all();
  let sent = 0;
  for (const o of due) {
    db.prepare("UPDATE orders SET review_requested_at = datetime('now') WHERE id = ?").run(o.id);
    if (plans.effectivePlan(plans.getAccount(o.account_id)) === "free") continue;
    const link = reviewUrl(o, o.id);
    const ok = await sendEmail({ to: o.email, subject: `How was your order from ${o.store_name}?`,
      html: shell(o.store_name, `<p>Thanks again for your order. Would you leave a quick review? It takes a minute and helps a small shop a lot.</p>${button(link, "Write a review")}`),
      text: `Thanks for your order from ${o.store_name}. Leave a quick review: ${link}` }).catch(() => false);
    if (ok) sent++;
  }
  return sent;
}

/** Checkout reminder settings for a new Stripe session (Pro stores with the reminder on, and email set up). */
export function recoveryParams(seller) {
  if (!config.resendKey || !seller.abandoned_emails || !isPro(seller)) return {};
  return { after_expiration: { recovery: { enabled: true } }, consent_collection: { promotions: "auto" }, expires_at: Math.floor(Date.now() / 1000) + 3 * 3600 };
}
/** A checkout expired: if the buyer agreed to emails, send them back to it once. */
export async function sendRecovery(orderId, session) {
  const url = session.after_expiration?.recovery?.url, email = session.customer_details?.email;
  if (!url || !email || session.consent?.promotions !== "opt_in") return false;
  const o = db.prepare("SELECT o.*, s.store_name FROM orders o JOIN sellers s ON s.id = o.seller_id WHERE o.id = ?").get(orderId);
  if (!o || o.recovery_sent_at) return false;
  db.prepare("UPDATE orders SET recovery_sent_at = datetime('now') WHERE id = ?").run(o.id);
  const items = JSON.parse(o.items).map((l) => l.title).slice(0, 3).join(", ");
  return sendEmail({ to: email, subject: `You left something at ${o.store_name}`,
    html: shell(o.store_name, `<p>Your cart is still waiting: ${esc(items)}.</p><p>Pick up where you left off any time in the next 30 days.</p>${button(url, "Finish checking out")}`),
    text: `Your cart at ${o.store_name} is still waiting (${items}). Finish checking out: ${url}` });
}

export const storeLinks = (seller) => ({ store: storeUrl(seller.store_slug), links: linksUrl(seller), feeds: feedUrls(seller), origin: storeOrigin(seller.store_slug) });

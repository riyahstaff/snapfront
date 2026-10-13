// Email list and email marketing: the sign-up box on every store, an opt-in at checkout, the
// subscriber list, broadcasts, and three automatic emails (welcome, after a purchase, win-back).
// Emails go out through Resend's batch API from a queue in the database, so a big send survives a
// restart and never blocks a request. Every marketing email carries the seller's mailing address
// and a one-click unsubscribe link (CAN-SPAM, and Gmail/Yahoo bulk-sender rules).
import crypto from "node:crypto";
import { config } from "./config.js";
import { db, newId, rowToProduct } from "./db.js";
import { httpError } from "./claude.js";
import * as plans from "./plans.js";
import { storeUrl } from "./urls.js";
import { themeOf } from "./themes.js";
import { registerExport, csv } from "./business.js";

const addCol = (t, name, def) => { if (!db.prepare(`PRAGMA table_info(${t})`).all().some((c) => c.name === name)) db.exec(`ALTER TABLE ${t} ADD COLUMN ${name} ${def}`); };
addCol("sellers", "signup_enabled", "INTEGER NOT NULL DEFAULT 1");     // the sign-up box on the storefront
addCol("sellers", "signup_title", "TEXT NOT NULL DEFAULT ''");
addCol("sellers", "signup_text", "TEXT NOT NULL DEFAULT ''");
addCol("sellers", "signup_offer_code", "TEXT NOT NULL DEFAULT ''");    // a discount code shown to new sign-ups
addCol("sellers", "mail_address", "TEXT NOT NULL DEFAULT ''");         // postal address printed in every email (required by law)
addCol("sellers", "mail_from_name", "TEXT NOT NULL DEFAULT ''");
db.exec(`
CREATE TABLE IF NOT EXISTS subscribers (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'form',
  status TEXT NOT NULL DEFAULT 'subscribed' CHECK (status IN ('subscribed','unsubscribed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  unsubscribed_at TEXT,
  UNIQUE (seller_id, email)
);
CREATE TABLE IF NOT EXISTS email_campaigns (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  subject TEXT NOT NULL DEFAULT '',
  preheader TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  cta_label TEXT NOT NULL DEFAULT '',
  cta_url TEXT NOT NULL DEFAULT '',
  product_id TEXT,
  discount_code TEXT NOT NULL DEFAULT '',
  audience TEXT NOT NULL DEFAULT 'all',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','sending','sent')),
  send_at TEXT,
  recipients INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  sent_at TEXT
);
CREATE INDEX IF NOT EXISTS email_campaigns_seller ON email_campaigns (seller_id, created_at);
CREATE TABLE IF NOT EXISTS email_sends (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  campaign_id TEXT,
  flow TEXT,
  ref TEXT NOT NULL DEFAULT '',
  subscriber_id TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','failed','skipped')),
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  send_after TEXT NOT NULL DEFAULT (datetime('now')),
  sent_at TEXT,
  opened_at TEXT,
  clicked_at TEXT,
  unsubscribed_at TEXT
);
CREATE INDEX IF NOT EXISTS email_sends_queue ON email_sends (status, send_after);
CREATE INDEX IF NOT EXISTS email_sends_campaign ON email_sends (campaign_id);
CREATE INDEX IF NOT EXISTS email_sends_seller ON email_sends (seller_id, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS email_sends_flow_once ON email_sends (flow, subscriber_id, ref) WHERE flow IS NOT NULL;
CREATE TABLE IF NOT EXISTS email_flows (
  seller_id TEXT NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 0,
  subject TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  cta_label TEXT NOT NULL DEFAULT '',
  discount_code TEXT NOT NULL DEFAULT '',
  delay_days INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (seller_id, kind)
);
`);

/* ---------- plans: broadcasts on Launch and Pro, automatic emails on Pro ---------- */
const CAP_DEFAULTS = { free: 0, launch: 500, pro: 5000 };
let capOverrides = {};
try { capOverrides = JSON.parse(process.env.EMAIL_CAPS || "{}"); } catch { /* keep defaults */ }
const CAPS = { ...CAP_DEFAULTS, ...capOverrides };
const planOf = (seller) => (seller.account_id ? plans.effectivePlan(plans.getAccount(seller.account_id)) : "launch");
const monthStart = () => `${new Date().toISOString().slice(0, 7)}-01 00:00:00`;
function usedThisMonth(seller) {
  const ids = seller.account_id ? plans.storesOf(seller.account_id).map((s) => s.id) : [seller.id];
  return db.prepare(`SELECT COUNT(*) AS n FROM email_sends WHERE seller_id IN (${ids.map(() => "?").join(",")}) AND status IN ('queued','sent') AND created_at >= ?`)
    .get(...ids, monthStart()).n;
}
function allowance(seller) {
  const plan = planOf(seller), cap = CAPS[plan] ?? 0, used = usedThisMonth(seller);
  return { plan, cap, used, left: Math.max(0, cap - used), broadcasts: cap > 0, automations: plan === "pro" };
}
function requireBroadcasts(seller) {
  if (!allowance(seller).broadcasts) throw httpError(402, "Email broadcasts come with Launch and Pro.", { upgrade: "launch" });
}
function requireAddress(seller) {
  if (String(seller.mail_address || "").trim().length < 10) throw httpError(400, "Add your mailing address in Email settings first. The law requires it in every marketing email.");
}

/* ---------- helpers ---------- */
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const line = (s, n) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);
const block = (s, n) => String(s ?? "").replace(/\r\n?/g, "\n").replace(/\u0000/g, "").trim().slice(0, n);
const EMAIL = /^[^\s@<>,;"()[\]\\]+@[^\s@<>,;"()[\]\\]+\.[a-z]{2,}$/i;
export function cleanEmail(raw) {
  const e = String(raw || "").trim().toLowerCase();
  return e.length <= 254 && EMAIL.test(e) ? e : null;
}
const sig = (s, n = 22) => crypto.createHmac("sha256", config.downloadSecret).update(s).digest("base64url").slice(0, n);
const sameSig = (a, b) => String(a || "").length === b.length && crypto.timingSafeEqual(Buffer.from(String(a)), Buffer.from(b));
function webUrl(raw) {
  let u = String(raw || "").trim();
  if (!u) return "";
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  try { const x = new URL(u); if (!/^https?:$/.test(x.protocol) || !x.hostname.includes(".")) throw 0; return x.href; }
  catch { throw httpError(400, "The button link isn't a web address."); }
}
const sellerById = (id) => db.prepare("SELECT * FROM sellers WHERE id = ?").get(id);
function activeCode(seller, code) {
  code = String(code || "").trim().toUpperCase();
  if (!code) return "";
  const d = db.prepare("SELECT code FROM discounts WHERE seller_id = ? AND code = ? AND active = 1 AND (expires_at IS NULL OR expires_at > datetime('now')) AND (max_uses IS NULL OR uses < max_uses)").get(seller.id, code);
  return d?.code || "";
}
function checkCode(seller, code) {
  code = String(code || "").trim().toUpperCase();
  if (code && !db.prepare("SELECT 1 FROM discounts WHERE seller_id = ? AND code = ?").get(seller.id, code)) throw httpError(400, `You don't have a discount code called ${code}. Make it in Discount codes first.`);
  return code;
}

/* ---------- the sign-up box and settings ---------- */
export const SIGNUP_DEFAULTS = { title: "Get first dibs on new drops", text: "New products and subscriber-only offers, straight to your inbox. No spam." };
/** What the storefront shows in the sign-up box (null when the seller turned it off). */
export function signupBox(seller) {
  if (!seller?.id || !seller.signup_enabled) return null;
  return { title: seller.signup_title || SIGNUP_DEFAULTS.title, text: seller.signup_text || SIGNUP_DEFAULTS.text, offer: Boolean(activeCode(seller, seller.signup_offer_code)) };
}
const counts = (seller) => db.prepare(`SELECT COUNT(*) FILTER (WHERE status = 'subscribed') AS subscribed, COUNT(*) FILTER (WHERE status = 'unsubscribed') AS unsubscribed,
  COUNT(*) FILTER (WHERE status = 'subscribed' AND created_at >= datetime('now','-30 days')) AS new_30d FROM subscribers WHERE seller_id = ?`).get(seller.id);
export function overview(seller) {
  const a = allowance(seller);
  return {
    signup: { enabled: Boolean(seller.signup_enabled), title: seller.signup_title, text: seller.signup_text, offer_code: seller.signup_offer_code, defaults: SIGNUP_DEFAULTS },
    mail_address: seller.mail_address, from_name: seller.mail_from_name || seller.store_name,
    plan: a.plan, monthly_limit: a.cap, used_this_month: a.used, can_broadcast: a.broadcasts, can_automate: a.automations,
    counts: counts(seller), sending_ready: Boolean(config.resendKey),
  };
}
export function updateSettings(seller, b = {}) {
  const set = {};
  if (b.signup_enabled !== undefined) set.signup_enabled = b.signup_enabled ? 1 : 0;
  if (b.signup_title !== undefined) set.signup_title = line(b.signup_title, 60);
  if (b.signup_text !== undefined) set.signup_text = line(b.signup_text, 160);
  if (b.signup_offer_code !== undefined) set.signup_offer_code = checkCode(seller, b.signup_offer_code);
  if (b.mail_address !== undefined) {
    const a = line(b.mail_address, 200);
    if (a && a.length < 10) throw httpError(400, "Enter a full mailing address: street or PO box, city, state and ZIP.");
    set.mail_address = a;
  }
  if (b.from_name !== undefined) set.mail_from_name = line(b.from_name, 60).replace(/["<>]/g, "");
  const keys = Object.keys(set);
  if (keys.length) db.prepare(`UPDATE sellers SET ${keys.map((k) => `${k} = ?`).join(", ")} WHERE id = ?`).run(...keys.map((k) => set[k]), seller.id);
  return overview(sellerById(seller.id));
}

/* ---------- subscribers ---------- */
/** Add someone to a store's list. People who unsubscribed come back only by signing up again themselves. */
export function subscribe(seller, { email, name = "", source = "form" }) {
  const e = cleanEmail(email);
  if (!e) throw httpError(400, "Enter a valid email address.");
  const cur = db.prepare("SELECT * FROM subscribers WHERE seller_id = ? AND email = ?").get(seller.id, e);
  const optIn = source === "form" || source === "checkout";
  if (cur) {
    if (cur.status === "unsubscribed" && optIn) {
      db.prepare("UPDATE subscribers SET status = 'subscribed', unsubscribed_at = NULL, source = ? WHERE id = ?").run(source, cur.id);
      return { id: cur.id, created: true };
    }
    if (name && !cur.name) db.prepare("UPDATE subscribers SET name = ? WHERE id = ?").run(line(name, 80), cur.id);
    return { id: cur.id, created: false, status: cur.status };
  }
  const id = newId("sub");
  db.prepare("INSERT INTO subscribers (id, seller_id, email, name, source) VALUES (?,?,?,?,?)").run(id, seller.id, e, line(name, 80), source);
  return { id, created: true };
}
/** The storefront form. Returns the welcome discount code when the seller set one. */
export function signupFromStore(seller, b = {}) {
  if (!seller?.signup_enabled) throw httpError(404, "This store isn't collecting emails right now.");
  if (b.website) return { ok: true };   // a bot filled the hidden field
  const r = subscribe(seller, { email: b.email, name: b.name, source: "form" });
  if (r.created) queueWelcome(seller, r.id);
  const code = activeCode(seller, seller.signup_offer_code);
  return { ok: true, offer_code: code || null };
}
/** A buyer ticked "Email me new products and offers" at checkout. */
export function fromCheckout(order, session) {
  const field = (session?.custom_fields || []).find((f) => f.key === "news");
  const yes = field?.dropdown?.value === "yes" || session?.consent?.promotions === "opt_in";
  if (!yes || !order?.email) return null;
  const seller = sellerById(order.seller_id);
  if (!seller) return null;
  const r = subscribe(seller, { email: order.email, name: order.customer_name || "", source: "checkout" });
  if (r.created) queueWelcome(seller, r.id);
  return r;
}
/** Checkout settings that ask buyers to join the list. */
export function checkoutParams(seller) {
  if (!seller.signup_enabled) return {};
  return { custom_fields: [{ key: "news", label: { type: "custom", custom: "Email me new products and offers" }, type: "dropdown", optional: true,
    dropdown: { options: [{ label: "Yes, sign me up", value: "yes" }, { label: "No thanks", value: "no" }] } }] };
}

const BUYERS = `SELECT lower(email) AS email, COUNT(*) AS orders, SUM(total_cents - COALESCE(tax_cents,0)) AS spent, MAX(paid_at) AS last_order
  FROM orders WHERE seller_id = ? AND status IN ('paid','fulfilled') AND email IS NOT NULL GROUP BY lower(email)`;
export function listSubscribers(seller, q = {}) {
  const where = ["s.seller_id = ?"], args = [seller.id];
  if (["subscribed", "unsubscribed"].includes(q.status)) { where.push("s.status = ?"); args.push(q.status); }
  if (q.q) { where.push("(s.email LIKE ? OR s.name LIKE ?)"); args.push(`%${line(q.q, 80)}%`, `%${line(q.q, 80)}%`); }
  if (q.source) { where.push("s.source = ?"); args.push(String(q.source)); }
  const page = Math.max(0, Number(q.page) || 0), size = 50;
  const total = db.prepare(`SELECT COUNT(*) AS n FROM subscribers s WHERE ${where.join(" AND ")}`).get(...args).n;
  const rows = db.prepare(`SELECT s.*, b.orders, b.spent, b.last_order FROM subscribers s LEFT JOIN (${BUYERS}) b ON b.email = s.email
    WHERE ${where.join(" AND ")} ORDER BY s.created_at DESC, s.rowid DESC LIMIT ? OFFSET ?`).all(seller.id, ...args, size, page * size);
  return {
    total, page, page_size: size, counts: counts(seller),
    subscribers: rows.map((r) => ({ id: r.id, email: r.email, name: r.name, source: r.source, status: r.status, created_at: r.created_at,
      orders: r.orders || 0, spent: (r.spent || 0) / 100, last_order: r.last_order || null })),
  };
}
export function addSubscribers(seller, b = {}) {
  if (!b.consent) throw httpError(400, "Only add people who asked to hear from you. Tick the box to confirm.");
  const list = String(b.emails || "").split(/[\s,;]+/).filter(Boolean);
  if (!list.length) throw httpError(400, "Paste at least one email address.");
  if (list.length > 2000) throw httpError(400, "Add up to 2,000 addresses at a time.");
  let added = 0, skipped = 0, invalid = 0;
  db.transaction(() => {
    for (const raw of list) {
      if (!cleanEmail(raw)) { invalid++; continue; }
      const r = subscribe(seller, { email: raw, source: "import" });
      if (r.created) added++; else skipped++;
    }
  })();
  return { added, skipped, invalid };
}
export function updateSubscriber(seller, id, b = {}) {
  const s = db.prepare("SELECT * FROM subscribers WHERE id = ? AND seller_id = ?").get(String(id), seller.id);
  if (!s) throw httpError(404, "That subscriber isn't on your list.");
  if (b.status === "unsubscribed" && s.status !== "unsubscribed") db.prepare("UPDATE subscribers SET status = 'unsubscribed', unsubscribed_at = datetime('now') WHERE id = ?").run(s.id);
  if (b.status === "subscribed" && s.status !== "subscribed") throw httpError(400, "People who unsubscribed can only rejoin by signing up again themselves.");
  if (b.name !== undefined) db.prepare("UPDATE subscribers SET name = ? WHERE id = ?").run(line(b.name, 80), s.id);
  const r = db.prepare("SELECT * FROM subscribers WHERE id = ?").get(s.id);
  return { id: r.id, email: r.email, name: r.name, source: r.source, status: r.status, created_at: r.created_at };
}
export function deleteSubscriber(seller, id) {
  if (!db.prepare("DELETE FROM subscribers WHERE id = ? AND seller_id = ?").run(String(id), seller.id).changes) throw httpError(404, "That subscriber isn't on your list.");
  db.prepare("DELETE FROM email_sends WHERE subscriber_id = ? AND status = 'queued'").run(String(id));
}
registerExport("subscribers", (seller) => {
  const rows = db.prepare(`SELECT s.*, b.orders, b.spent FROM subscribers s LEFT JOIN (${BUYERS}) b ON b.email = s.email WHERE s.seller_id = ? ORDER BY s.created_at DESC`).all(seller.id, seller.id);
  return { name: `subscribers_${new Date().toISOString().slice(0, 10)}.csv`, body: csv(["Email", "Name", "Status", "Joined", "Source", "Orders", "Spent"],
    rows.map((r) => [r.email, r.name, r.status, r.created_at, r.source, r.orders || 0, ((r.spent || 0) / 100).toFixed(2)])) };
});

/* ---------- audiences ---------- */
export const AUDIENCES = [
  { id: "all", label: "Everyone on your list" },
  { id: "buyers", label: "Subscribers who bought" },
  { id: "non_buyers", label: "Subscribers who haven't bought yet" },
];
function audienceList(seller, audience) {
  const base = `SELECT s.id, s.email FROM subscribers s LEFT JOIN (${BUYERS}) b ON b.email = s.email WHERE s.seller_id = ? AND s.status = 'subscribed'`;
  if (audience === "buyers") return db.prepare(`${base} AND b.orders > 0`).all(seller.id, seller.id);
  if (audience === "non_buyers") return db.prepare(`${base} AND b.orders IS NULL`).all(seller.id, seller.id);
  if (String(audience).startsWith("tag:")) {
    const tag = String(audience).slice(4);
    return db.prepare(`${base} AND EXISTS (SELECT 1 FROM customer_notes n, json_each(n.tags) t WHERE n.seller_id = s.seller_id AND lower(n.email) = s.email AND t.value = ?)`).all(seller.id, seller.id, tag);
  }
  return db.prepare(base).all(seller.id, seller.id);
}
export function audiences(seller) {
  const tags = db.prepare("SELECT DISTINCT t.value AS tag FROM customer_notes n, json_each(n.tags) t WHERE n.seller_id = ? ORDER BY 1").all(seller.id).map((r) => r.tag);
  return [...AUDIENCES, ...tags.map((t) => ({ id: `tag:${t}`, label: `Customers tagged ${t}` }))].map((a) => ({ ...a, count: audienceList(seller, a.id).length }));
}

/* ---------- broadcasts ---------- */
function campaignRow(seller, id) {
  const c = db.prepare("SELECT * FROM email_campaigns WHERE id = ? AND seller_id = ?").get(String(id), seller.id);
  if (!c) throw httpError(404, "That email doesn't exist.");
  return c;
}
function stats(c) {
  const s = db.prepare(`SELECT COUNT(*) FILTER (WHERE status = 'sent') AS sent, COUNT(*) FILTER (WHERE status = 'failed') AS failed,
    COUNT(*) FILTER (WHERE status = 'queued') AS queued, COUNT(opened_at) AS opened, COUNT(clicked_at) AS clicked, COUNT(unsubscribed_at) AS unsubscribed
    FROM email_sends WHERE campaign_id = ?`).get(c.id);
  const rate = (n) => (s.sent ? Math.round((n / s.sent) * 1000) / 10 : 0);
  return { ...s, open_rate: rate(s.opened), click_rate: rate(s.clicked) };
}
const publicCampaign = (c) => ({
  id: c.id, subject: c.subject, preheader: c.preheader, body: c.body, cta_label: c.cta_label, cta_url: c.cta_url, product_id: c.product_id,
  discount_code: c.discount_code, audience: c.audience, status: c.status, send_at: c.send_at, recipients: c.recipients,
  created_at: c.created_at, updated_at: c.updated_at, sent_at: c.sent_at, stats: c.status === "draft" ? null : stats(c),
});
export function listCampaigns(seller) {
  return { campaigns: db.prepare("SELECT * FROM email_campaigns WHERE seller_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 100").all(seller.id).map(publicCampaign), audiences: audiences(seller) };
}
export const getCampaign = (seller, id) => publicCampaign(campaignRow(seller, id));
function campaignFields(seller, b) {
  const out = {};
  if (b.subject !== undefined) out.subject = line(b.subject, 150);
  if (b.preheader !== undefined) out.preheader = line(b.preheader, 150);
  if (b.body !== undefined) out.body = block(b.body, 10000);
  if (b.cta_label !== undefined) out.cta_label = line(b.cta_label, 40);
  if (b.cta_url !== undefined) out.cta_url = webUrl(b.cta_url);
  if (b.product_id !== undefined) {
    const pid = b.product_id ? String(b.product_id) : null;
    if (pid && !db.prepare("SELECT 1 FROM products WHERE id = ? AND seller_id = ?").get(pid, seller.id)) throw httpError(400, "That product isn't in this store.");
    out.product_id = pid;
  }
  if (b.discount_code !== undefined) out.discount_code = checkCode(seller, b.discount_code);
  if (b.audience !== undefined) {
    const a = String(b.audience);
    if (!["all", "buyers", "non_buyers"].includes(a) && !a.startsWith("tag:")) throw httpError(400, "Choose who gets this email.");
    out.audience = a.slice(0, 40);
  }
  return out;
}
export function createCampaign(seller, b = {}) {
  requireBroadcasts(seller);
  if (db.prepare("SELECT COUNT(*) AS n FROM email_campaigns WHERE seller_id = ? AND status = 'draft'").get(seller.id).n >= 50) throw httpError(429, "You have 50 drafts. Send or delete some first.");
  const id = newId("cmp");
  db.prepare("INSERT INTO email_campaigns (id, seller_id) VALUES (?,?)").run(id, seller.id);
  return updateCampaign(seller, id, b);
}
export function updateCampaign(seller, id, b = {}) {
  const c = campaignRow(seller, id);
  if (c.status !== "draft") throw httpError(409, "This email has already gone out. Duplicate it to send again.");
  const f = campaignFields(seller, b);
  const keys = Object.keys(f);
  if (keys.length) db.prepare(`UPDATE email_campaigns SET ${keys.map((k) => `${k} = ?`).join(", ")}, updated_at = datetime('now') WHERE id = ?`).run(...keys.map((k) => f[k]), c.id);
  return getCampaign(seller, c.id);
}
export function duplicateCampaign(seller, id) {
  const c = campaignRow(seller, id);
  return createCampaign(seller, { subject: c.subject, preheader: c.preheader, body: c.body, cta_label: c.cta_label, cta_url: c.cta_url, product_id: c.product_id, discount_code: c.discount_code, audience: c.audience });
}
export function deleteCampaign(seller, id) {
  const c = campaignRow(seller, id);
  if (c.status === "sending" || c.status === "sent") throw httpError(409, "Sent emails stay in your history.");
  db.prepare("DELETE FROM email_sends WHERE campaign_id = ? AND status = 'queued'").run(c.id);
  db.prepare("DELETE FROM email_campaigns WHERE id = ?").run(c.id);
}
function assertReady(seller, c) {
  if (!c.subject) throw httpError(400, "Add a subject line.");
  if (!c.body && !c.product_id) throw httpError(400, "Write the email, or pick a product to feature.");
  if (c.cta_label && !c.cta_url && !c.product_id) throw httpError(400, "Add a link for the button.");
}
/** Send to the seller (or an address they choose) to check how it looks. Doesn't count toward the list. */
export async function testCampaign(seller, account, id, to) {
  requireBroadcasts(seller);
  const c = campaignRow(seller, id);
  assertReady(seller, c);
  const email = cleanEmail(to || account?.email);
  if (!email) throw httpError(400, "Enter the address to send the test to.");
  if (!config.resendKey && !transport) throw httpError(503, "Email sending isn't set up on the server yet.");
  const msg = message(seller, contentOfCampaign(seller, c), { email, name: "" }, null);
  msg.subject = `[Test] ${msg.subject}`;
  const out = await sendBatch([msg]);
  if (out.errors?.length) throw httpError(400, `The test didn't send: ${out.errors[0].message}`);
  return { sent_to: email };
}
export function sendCampaign(seller, id, b = {}) {
  requireBroadcasts(seller);
  requireAddress(seller);
  const c = campaignRow(seller, id);
  if (c.status !== "draft") throw httpError(409, "This email has already been sent or scheduled.");
  assertReady(seller, c);
  let sendAt = null;
  if (b.send_at) {
    const t = new Date(b.send_at);
    if (isNaN(t)) throw httpError(400, "Pick a valid time to send.");
    if (t.getTime() > Date.now() + 60_000) {
      if (t.getTime() > Date.now() + 90 * 864e5) throw httpError(400, "Schedule within the next 90 days.");
      sendAt = t.toISOString().replace("T", " ").slice(0, 19);
    }
  }
  const people = audienceList(seller, c.audience);
  if (!people.length) throw httpError(400, "No one is in that audience yet.");
  const a = allowance(seller);
  if (people.length > a.left) {
    throw httpError(402, `This would send ${people.length.toLocaleString()} emails and you have ${a.left.toLocaleString()} left this month (${a.cap.toLocaleString()} on ${a.plan === "pro" ? "Pro" : "Launch"}).`,
      a.plan === "pro" ? {} : { upgrade: "pro" });
  }
  const after = sendAt || db.prepare("SELECT datetime('now') AS t").get().t;
  db.transaction(() => {
    const ins = db.prepare("INSERT INTO email_sends (id, seller_id, campaign_id, subscriber_id, email, send_after) VALUES (?,?,?,?,?,?)");
    for (const p of people) ins.run(newId("snd"), seller.id, c.id, p.id, p.email, after);
    db.prepare("UPDATE email_campaigns SET status = ?, send_at = ?, recipients = ?, updated_at = datetime('now') WHERE id = ?").run(sendAt ? "scheduled" : "sending", after, people.length, c.id);
  })();
  kick();
  return getCampaign(seller, c.id);
}
export function cancelCampaign(seller, id) {
  const c = campaignRow(seller, id);
  if (c.status !== "scheduled") throw httpError(409, "Only a scheduled email can be canceled.");
  db.transaction(() => {
    db.prepare("DELETE FROM email_sends WHERE campaign_id = ? AND status = 'queued'").run(c.id);
    db.prepare("UPDATE email_campaigns SET status = 'draft', send_at = NULL, recipients = 0 WHERE id = ?").run(c.id);
  })();
  return getCampaign(seller, c.id);
}

/* ---------- automatic emails ---------- */
export const FLOW_DEFAULTS = {
  welcome: { name: "Welcome", when: "Right after someone joins your list", delay_days: 0, subject: "Welcome to {store}",
    body: "Hi {name},\n\nThanks for joining the {store} list! You'll be the first to hear about new products and subscriber-only offers.", cta_label: "Shop now" },
  after_purchase: { name: "After a purchase", when: "Days after a subscriber's order", delay_days: 10, subject: "Thanks again from {store}",
    body: "Hi {name},\n\nWe hope you're loving your order. Here's what's new in the shop since you visited.", cta_label: "See what's new" },
  winback: { name: "Win-back", when: "When a buyer hasn't ordered for a while", delay_days: 60, subject: "We miss you at {store}",
    body: "Hi {name},\n\nIt's been a while! We've added new things we think you'll like. Come take a look.", cta_label: "Come back and shop" },
};
const FLOW_KINDS = Object.keys(FLOW_DEFAULTS);
function flowRow(seller, kind) {
  const r = db.prepare("SELECT * FROM email_flows WHERE seller_id = ? AND kind = ?").get(seller.id, kind);
  const d = FLOW_DEFAULTS[kind];
  return { kind, enabled: Boolean(r?.enabled), subject: r?.subject || d.subject, body: r?.body || d.body, cta_label: r?.cta_label || d.cta_label,
    discount_code: r ? r.discount_code : kind === "welcome" ? seller.signup_offer_code || "" : "", delay_days: r ? r.delay_days : d.delay_days };
}
export function flows(seller) {
  return { can_automate: allowance(seller).automations, flows: FLOW_KINDS.map((k) => {
    const f = flowRow(seller, k);
    const s = db.prepare(`SELECT COUNT(*) FILTER (WHERE status = 'sent') AS sent, COUNT(opened_at) AS opened, COUNT(clicked_at) AS clicked FROM email_sends WHERE seller_id = ? AND flow = ?`).get(seller.id, k);
    return { ...f, name: FLOW_DEFAULTS[k].name, when: FLOW_DEFAULTS[k].when, stats: s };
  }) };
}
export function updateFlow(seller, kind, b = {}) {
  if (!FLOW_KINDS.includes(kind)) throw httpError(404, "That automatic email doesn't exist.");
  if (b.enabled && !allowance(seller).automations) throw httpError(402, "Automatic emails come with Pro.", { upgrade: "pro" });
  if (b.enabled) requireAddress(seller);
  const f = { ...flowRow(seller, kind) };
  if (b.enabled !== undefined) f.enabled = Boolean(b.enabled);
  if (b.subject !== undefined) f.subject = line(b.subject, 150) || FLOW_DEFAULTS[kind].subject;
  if (b.body !== undefined) f.body = block(b.body, 5000) || FLOW_DEFAULTS[kind].body;
  if (b.cta_label !== undefined) f.cta_label = line(b.cta_label, 40);
  if (b.discount_code !== undefined) f.discount_code = checkCode(seller, b.discount_code);
  if (b.delay_days !== undefined) {
    const d = Math.round(Number(b.delay_days));
    const [min, max] = kind === "welcome" ? [0, 7] : kind === "after_purchase" ? [1, 60] : [14, 365];
    if (!(d >= min && d <= max)) throw httpError(400, `Pick between ${min} and ${max} days.`);
    f.delay_days = d;
  }
  db.prepare(`INSERT INTO email_flows (seller_id, kind, enabled, subject, body, cta_label, discount_code, delay_days) VALUES (?,?,?,?,?,?,?,?)
    ON CONFLICT(seller_id, kind) DO UPDATE SET enabled=excluded.enabled, subject=excluded.subject, body=excluded.body, cta_label=excluded.cta_label,
    discount_code=excluded.discount_code, delay_days=excluded.delay_days, updated_at=datetime('now')`)
    .run(seller.id, kind, f.enabled ? 1 : 0, f.subject, f.body, f.cta_label, f.discount_code, f.delay_days);
  return flows(seller).flows.find((x) => x.kind === kind);
}
function flowLive(seller, kind) {
  const f = flowRow(seller, kind);
  if (!f.enabled || !allowance(seller).automations || String(seller.mail_address || "").trim().length < 10) return null;
  return allowance(seller).left > 0 ? f : null;
}
function queueFlow(seller, kind, subscriberId, email, ref, after) {
  return db.prepare("INSERT OR IGNORE INTO email_sends (id, seller_id, flow, ref, subscriber_id, email, send_after) VALUES (?,?,?,?,?,?,?)")
    .run(newId("snd"), seller.id, kind, ref, subscriberId, email, after).changes;
}
function queueWelcome(seller, subscriberId) {
  const f = flowLive(seller, "welcome");
  if (!f) return;
  const s = db.prepare("SELECT email FROM subscribers WHERE id = ?").get(subscriberId);
  const after = db.prepare("SELECT datetime('now', ?) AS t").get(`+${f.delay_days} days`).t;
  if (queueFlow(seller, "welcome", subscriberId, s.email, "", after)) kick();
}
/** Queue the after-purchase and win-back emails that are due. Runs on a timer. */
export function runFlows() {
  let queued = 0;
  const sellers = db.prepare("SELECT DISTINCT s.* FROM sellers s JOIN email_flows f ON f.seller_id = s.id WHERE f.enabled = 1 AND f.kind IN ('after_purchase','winback')").all();
  for (const seller of sellers) {
    const ap = flowLive(seller, "after_purchase");
    if (ap) {
      const due = db.prepare(`SELECT o.id AS order_id, s.id AS sub_id, s.email FROM orders o JOIN subscribers s ON s.seller_id = o.seller_id AND s.email = lower(o.email)
        WHERE o.seller_id = ? AND o.status IN ('paid','fulfilled') AND s.status = 'subscribed'
          AND o.paid_at <= datetime('now', ?) AND o.paid_at >= datetime('now', ?) LIMIT 500`).all(seller.id, `-${ap.delay_days} days`, `-${ap.delay_days + 7} days`);
      for (const d of due) queued += queueFlow(seller, "after_purchase", d.sub_id, d.email, d.order_id, db.prepare("SELECT datetime('now') AS t").get().t);
    }
    const wb = flowLive(seller, "winback");
    if (wb) {
      // One win-back per quiet spell: keyed on the buyer's latest order, so a new order starts a new spell.
      const due = db.prepare(`SELECT s.id AS sub_id, s.email, (SELECT o.id FROM orders o WHERE o.seller_id = s.seller_id AND lower(o.email) = s.email AND o.status IN ('paid','fulfilled') ORDER BY o.paid_at DESC LIMIT 1) AS last_id,
          (SELECT MAX(o.paid_at) FROM orders o WHERE o.seller_id = s.seller_id AND lower(o.email) = s.email AND o.status IN ('paid','fulfilled')) AS last_at
        FROM subscribers s WHERE s.seller_id = ? AND s.status = 'subscribed'`).all(seller.id)
        .filter((r) => r.last_id && Date.parse(`${String(r.last_at).replace(" ", "T")}Z`) <= Date.now() - wb.delay_days * 864e5);
      for (const d of due.slice(0, 500)) queued += queueFlow(seller, "winback", d.sub_id, d.email, d.last_id, db.prepare("SELECT datetime('now') AS t").get().t);
    }
  }
  if (queued) kick();
  return queued;
}

/* ---------- building an email ---------- */
function contentOfCampaign(seller, c) {
  const p = c.product_id ? db.prepare("SELECT * FROM products WHERE id = ? AND seller_id = ?").get(c.product_id, seller.id) : null;
  return { subject: c.subject, preheader: c.preheader, body: c.body, cta_label: c.cta_label, cta_url: c.cta_url, product: p ? rowToProduct(p) : null,
    discount_code: activeCode(seller, c.discount_code), campaign: c.id };
}
function contentOfFlow(seller, kind, ref) {
  const f = flowRow(seller, kind);
  let product = null;
  if (kind === "after_purchase" && ref) {
    // Suggest something they didn't buy.
    const bought = new Set(((() => { try { return JSON.parse(db.prepare("SELECT items FROM orders WHERE id = ?").get(ref)?.items || "[]"); } catch { return []; } })()).map((l) => l.product_id));
    const p = db.prepare("SELECT * FROM products WHERE seller_id = ? AND status = 'live' ORDER BY created_at DESC LIMIT 20").all(seller.id).find((x) => !bought.has(x.id) && x.image_file);
    product = p ? rowToProduct(p) : null;
  }
  return { subject: f.subject, preheader: "", body: f.body, cta_label: f.cta_label, cta_url: "", product, discount_code: activeCode(seller, f.discount_code), campaign: `flow_${kind}` };
}
const fill = (s, seller, who) => String(s || "").replace(/\{store\}/g, seller.store_name).replace(/\{name\}/g, (who.name || "").split(" ")[0] || "there");
const money = (cents) => `$${(cents / 100).toFixed(2).replace(/\.00$/, "")}`;
function withUtm(url, campaign) {
  try { const u = new URL(url); if (!u.searchParams.has("utm_source")) { u.searchParams.set("utm_source", "email"); u.searchParams.set("utm_campaign", campaign); } return u.href; } catch { return url; }
}
export const clickUrl = (sendId, url) => `${config.publicUrl}/e/c/${sendId}?u=${encodeURIComponent(url)}&s=${sig(`c:${sendId}:${url}`, 16)}`;
export const unsubscribeUrl = (subscriberId, sendId = "x") => `${config.publicUrl}/u/${subscriberId}.${sendId}.${sig(`u:${subscriberId}:${sendId}`)}`;
function fromAddress(seller) {
  const addr = (/<([^>]+)>/.exec(config.emailFrom)?.[1] || config.emailFrom).trim();
  const name = line(seller.mail_from_name || seller.store_name, 60).replace(/["<>\\]/g, "");
  return `"${name}" <${addr}>`;
}
function replyTo(seller) {
  const a = seller.account_id ? plans.getAccount(seller.account_id) : null;
  return cleanEmail(a?.email) || undefined;
}
/** One email, ready for Resend. `send` is the queue row (null for a test). */
function message(seller, content, who, send) {
  const t = themeOf(seller.theme);
  const accent = /^#[0-9a-f]{6}$/i.test(t.c.accent) ? t.c.accent : "#16152E";
  const onAccent = /^#[0-9a-f]{6}$/i.test(t.c.onAccent) ? t.c.onAccent : "#FFFFFF";
  const track = (url) => (send ? clickUrl(send.id, withUtm(url, content.campaign)) : withUtm(url, content.campaign));
  const shop = storeUrl(seller.store_slug);
  const unsub = send ? unsubscribeUrl(send.subscriber_id, send.id) : unsubscribeUrl("preview");
  const subject = fill(content.subject, seller, who);
  const paras = fill(content.body, seller, who).split(/\n\s*\n/).filter((x) => x.trim());
  const p = content.product;
  const productUrl = p ? storeUrl(seller.store_slug, `/${p.slug}`) : null;
  const ctaUrl = content.cta_url || productUrl || shop;
  const btn = (href, label) => `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0"><tr><td style="background:${accent};border-radius:999px"><a href="${esc(track(href))}" style="display:inline-block;padding:14px 28px;color:${onAccent};font-weight:700;text-decoration:none;font-size:16px">${esc(label)}</a></td></tr></table>`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;background:#F3F3F1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1A1A1A">
${content.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(fill(content.preheader, seller, who))}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F3F1"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:16px">
<tr><td style="padding:28px 32px 8px"><a href="${esc(track(shop))}" style="color:#1A1A1A;text-decoration:none;font-size:20px;font-weight:800">${esc(seller.store_name)}</a></td></tr>
<tr><td style="padding:8px 32px 8px;font-size:16px;line-height:1.6">${paras.map((x) => `<p style="margin:0 0 16px">${esc(x).replace(/\n/g, "<br>")}</p>`).join("")}
${p ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 8px;border:1px solid #E7E7E3;border-radius:14px;overflow:hidden">
${p.image_url ? `<tr><td><a href="${esc(track(productUrl))}"><img src="${esc(p.image_url)}" alt="${esc(p.title)}" width="496" style="display:block;width:100%;height:auto;border:0"></a></td></tr>` : ""}
<tr><td style="padding:16px 18px"><div style="font-size:18px;font-weight:700">${esc(p.title)}</div><div style="color:#555;margin-top:4px">${money(p.price_cents)}</div></td></tr></table>` : ""}
${content.discount_code ? `<div style="margin:20px 0;padding:16px;border:2px dashed ${accent};border-radius:12px;text-align:center"><div style="font-size:13px;color:#555">Use this code at checkout</div><div style="font-size:24px;font-weight:800;letter-spacing:2px;margin-top:4px">${esc(content.discount_code)}</div></div>` : ""}
${content.cta_label ? btn(ctaUrl, content.cta_label) : ""}</td></tr>
<tr><td style="padding:20px 32px 28px;border-top:1px solid #EEE;font-size:12px;line-height:1.6;color:#777">You're getting this because you joined the ${esc(seller.store_name)} email list.<br>${esc(seller.mail_address || "")}<br><a href="${esc(unsub)}" style="color:#777">Unsubscribe</a></td></tr>
</table></td></tr></table>${send ? `<img src="${config.publicUrl}/e/o/${send.id}.gif" width="1" height="1" alt="" style="display:block;border:0">` : ""}</body></html>`;
  const text = [seller.store_name, "", ...paras, p ? `${p.title} (${money(p.price_cents)}): ${productUrl}` : "", content.discount_code ? `Use code ${content.discount_code} at checkout.` : "",
    content.cta_label ? `${content.cta_label}: ${withUtm(ctaUrl, content.campaign)}` : "", "", `You're getting this because you joined the ${seller.store_name} email list.`, seller.mail_address || "", `Unsubscribe: ${unsub}`]
    .filter((x, i, a) => x !== "" || a[i - 1] !== "").join("\n");
  return { from: fromAddress(seller), to: [who.email], subject, html, text, reply_to: replyTo(seller),
    headers: { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } };
}
/** What a draft looks like, for the app's preview. */
export function previewCampaign(seller, id) {
  const c = campaignRow(seller, id);
  return { subject: fill(c.subject, seller, { name: "Sam" }), html: message(seller, contentOfCampaign(seller, c), { email: "you@example.com", name: "Sam" }, null).html };
}

/* ---------- sending ---------- */
let transport = null;
/** Tests replace Resend with a stand-in. */
export function setEmailTransport(fn) { transport = fn; }
async function sendBatch(messages) {
  if (transport) return (await transport(messages)) || {};
  if (!config.resendKey) throw Object.assign(new Error("Email sending isn't set up."), { status: 503 });
  const res = await fetch("https://api.resend.com/emails/batch", {
    method: "POST", headers: { Authorization: `Bearer ${config.resendKey}`, "Content-Type": "application/json", "x-batch-validation": "permissive" },
    body: JSON.stringify(messages.map(({ reply_to, ...m }) => (reply_to ? { ...m, reply_to } : m))),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(body?.message || `Resend ${res.status}`), { status: res.status });
  return { errors: Array.isArray(body?.errors) ? body.errors : [] };
}
let busy = false, worker = null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function kick() { if (worker) setImmediate(() => processQueue().catch((e) => console.error("[email] queue", e.message))); }
/** Send what's due, 100 emails per call to Resend. */
export async function processQueue(max = 2000) {
  if (busy) return 0;
  busy = true;
  try {
    db.prepare("UPDATE email_campaigns SET status = 'sending' WHERE status = 'scheduled' AND send_at <= datetime('now')").run();
    let done = 0;
    while (done < max) {
      const rows = db.prepare("SELECT * FROM email_sends WHERE status = 'queued' AND send_after <= datetime('now') ORDER BY send_after, rowid LIMIT 100").all();
      if (!rows.length) break;
      const sellers = new Map(), contents = new Map(), msgs = [], sending = [];
      for (const r of rows) {
        const seller = sellers.get(r.seller_id) || sellerById(r.seller_id);
        sellers.set(r.seller_id, seller);
        const sub = db.prepare("SELECT * FROM subscribers WHERE id = ?").get(r.subscriber_id);
        const c = r.campaign_id ? db.prepare("SELECT * FROM email_campaigns WHERE id = ?").get(r.campaign_id) : null;
        if (!seller || !sub || sub.status !== "subscribed" || (r.campaign_id && !c) || String(seller.mail_address || "").trim().length < 10) {
          db.prepare("UPDATE email_sends SET status = 'skipped' WHERE id = ?").run(r.id);
          continue;
        }
        const key = r.campaign_id || `${r.seller_id}:${r.flow}:${r.flow === "after_purchase" ? r.ref : ""}`;
        if (!contents.has(key)) contents.set(key, c ? contentOfCampaign(seller, c) : contentOfFlow(seller, r.flow, r.ref));
        msgs.push(message(seller, contents.get(key), sub, r));
        sending.push(r);
      }
      done += rows.length;
      if (!msgs.length) continue;
      let out;
      try { out = await sendBatch(msgs); }
      catch (e) {
        if (e.status === 429 || !e.status || e.status >= 500) { console.warn("[email] will retry:", e.message); break; }   // try again on the next tick
        const mark = db.prepare("UPDATE email_sends SET status = 'failed', error = ? WHERE id = ?");
        for (const r of sending) mark.run(String(e.message).slice(0, 200), r.id);
        continue;
      }
      const failed = new Map((out.errors || []).map((x) => [Number(x.index), String(x.message || "Rejected").slice(0, 200)]));
      db.transaction(() => sending.forEach((r, i) => {
        if (failed.has(i)) db.prepare("UPDATE email_sends SET status = 'failed', error = ? WHERE id = ?").run(failed.get(i), r.id);
        else db.prepare("UPDATE email_sends SET status = 'sent', sent_at = datetime('now') WHERE id = ?").run(r.id);
      }))();
      if (!transport) await sleep(600);   // stay under Resend's request rate
    }
    db.prepare(`UPDATE email_campaigns SET status = 'sent', sent_at = COALESCE(sent_at, datetime('now')) WHERE status = 'sending'
      AND NOT EXISTS (SELECT 1 FROM email_sends WHERE campaign_id = email_campaigns.id AND status = 'queued')`).run();
    return done;
  } finally { busy = false; }
}
export function startWorker() {
  if (worker) return;
  worker = setInterval(() => { try { runFlows(); } catch (e) { console.error("[email] flows", e.message); } processQueue().catch((e) => console.error("[email] queue", e.message)); }, 60_000);
  worker.unref?.();
  kick();
}

/* ---------- opens, clicks and unsubscribes ---------- */
export const PIXEL = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");
export function recordOpen(sendId) {
  db.prepare("UPDATE email_sends SET opened_at = datetime('now') WHERE id = ? AND opened_at IS NULL").run(String(sendId).slice(0, 40));
}
/** The real address behind a tracked link, or null if the link was tampered with. */
export function recordClick(sendId, url, s) {
  if (!/^https?:\/\//i.test(String(url || "")) || !sameSig(s, sig(`c:${sendId}:${url}`, 16))) return null;
  db.prepare("UPDATE email_sends SET clicked_at = COALESCE(clicked_at, datetime('now')), opened_at = COALESCE(opened_at, datetime('now')) WHERE id = ?").run(String(sendId));
  return url;
}
export function unsubscribeTarget(token) {
  const [subId, sendId, s] = String(token || "").split(".");
  if (!subId || !sendId || !sameSig(s, sig(`u:${subId}:${sendId}`))) return null;
  const sub = db.prepare("SELECT * FROM subscribers WHERE id = ?").get(subId);
  if (!sub) return null;
  return { sub, sendId, seller: sellerById(sub.seller_id) };
}
export function unsubscribe(token) {
  const t = unsubscribeTarget(token);
  if (!t) return null;
  if (t.sub.status !== "unsubscribed") {
    db.prepare("UPDATE subscribers SET status = 'unsubscribed', unsubscribed_at = datetime('now') WHERE id = ?").run(t.sub.id);
    db.prepare("UPDATE email_sends SET unsubscribed_at = datetime('now') WHERE id = ? AND subscriber_id = ?").run(t.sendId, t.sub.id);
    db.prepare("UPDATE email_sends SET status = 'skipped' WHERE subscriber_id = ? AND status = 'queued'").run(t.sub.id);
  }
  return t;
}

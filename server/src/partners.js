// Snapfront Partners: anyone with a Snapfront account can share their own link
// (snapfront.app/r/CODE) and earn when someone they sent buys Snapfront: 40% (PARTNER_RATE) of
// every payment: a Lifetime purchase, and every paid month of Monthly or year of Yearly.
//
// How a sale is credited: the link sets a cookie on .snapfront.app; the website (app.snapfront.app)
// reads it and tells the server, which remembers the referring partner on the new account (first
// partner wins, for PARTNER_WINDOW_DAYS). Amounts come only from what Stripe or Google Play report.
// All sales are final, so a commission is paid when Snapfront is paid: held until the money
// settles (a few days for Stripe, ~45 days for Google Play's monthly payout), re-checked for a
// refund or chargeback, then paid: automatically by Stripe transfer to the partner's connected
// account (one transfer per commission, never twice), or by hand (PayPal) from the admin page.
import crypto from "node:crypto";
import { config } from "./config.js";
import { db, newId } from "./db.js";
import { httpError } from "./claude.js";
import * as plans from "./plans.js";
import * as webbilling from "./webbilling.js";
import * as playbilling from "./playbilling.js";
import { stripeClient } from "./payments.js";
import { sendEmail } from "./growth.js";
import { cleanEmail } from "./audience.js";

const num = (env, fallback, min, max) => { const v = Number(process.env[env]); return Number.isFinite(v) && v >= min && v <= max ? v : fallback; };
export const RATE = () => num("PARTNER_RATE", 40, 1, 90);                          // % of every payment
const share = (cents) => Math.round(cents * RATE() / 100);
/** What a partner earns on one paid month of Monthly at today's price. */
export const MONTHLY_CENTS = () => share(webbilling.PLANS.pro.cents);
// Held until Snapfront has the money: Stripe pays out in about 2 business days; Google Play pays
// developers monthly, about 15 days after the month ends.
const HOLD = { stripe: () => num("PARTNER_HOLD_DAYS_STRIPE", 4, 0, 120), play: () => num("PARTNER_HOLD_DAYS_PLAY", 45, 0, 120) };
const holdFor = (source) => (String(source).startsWith("play") ? HOLD.play() : HOLD.stripe());
export const HOLD_DAYS = () => HOLD.stripe();
export const WINDOW_DAYS = () => num("PARTNER_WINDOW_DAYS", 60, 1, 365);
const autoPayouts = () => String(process.env.PARTNER_AUTO_PAYOUTS || "true").toLowerCase() !== "false";

const addCol = (t, name, def) => { if (!db.prepare(`PRAGMA table_info(${t})`).all().some((c) => c.name === name)) db.exec(`ALTER TABLE ${t} ADD COLUMN ${name} ${def}`); };
addCol("accounts", "referred_by", "TEXT");     // the partner's account id
addCol("accounts", "referred_at", "TEXT");
addCol("sellers", "partner_card", "INTEGER NOT NULL DEFAULT 0");   // show the Snapfront membership card on this store's link-in-bio page
db.exec(`
CREATE TABLE IF NOT EXISTS partners (
  account_id TEXT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  paypal_email TEXT,
  agreed_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS partner_clicks (
  code TEXT NOT NULL,
  day TEXT NOT NULL,
  visitor TEXT NOT NULL,
  PRIMARY KEY (code, day, visitor)
);
CREATE TABLE IF NOT EXISTS partner_commissions (
  id TEXT PRIMARY KEY,
  partner_id TEXT NOT NULL,
  buyer_account TEXT NOT NULL,
  source TEXT NOT NULL,
  ref TEXT NOT NULL,
  plan TEXT NOT NULL,
  sale_cents INTEGER NOT NULL,
  commission_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','void')),
  available_at TEXT NOT NULL,
  paid_at TEXT,
  payout_ref TEXT,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (source, ref)
);
CREATE INDEX IF NOT EXISTS partner_commissions_partner ON partner_commissions (partner_id, created_at);
`);

const dollars = (c) => Math.round(c || 0) / 100;
const money = (c) => `$${(c / 100).toFixed(2)}`;
export const normCode = (c) => String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);
const partnerByCode = (code) => (code ? db.prepare("SELECT * FROM partners WHERE code = ? AND status = 'active'").get(normCode(code)) : null);
export const shareLink = (code) => `${config.publicUrl}/r/${code}`;
/** The partner's own copy of the membership sales page (snapfront.app/join/CODE). */
export const salesLink = (code) => `${config.publicUrl}/join/${code}`;
const homeUrl = () => config.publicUrl;

/* ---------- joining and the partner's own page ---------- */
export const TERMS = [
  "Say you earn a commission whenever you share your link (for example “#ad” or “I earn from this link”). The FTC requires it.",
  "Don't promise income. Talk about what Snapfront does, not what someone will earn.",
  "No spam, fake reviews, paid ads on the word “Snapfront”, or posing as Snapfront.",
  "You can't earn on your own purchase or a purchase by someone in your household.",
  "You're paid once Snapfront is paid: a few days after a website sale, or about 45 days after a Google Play sale. Chargebacks and fraudulent sales don't earn.",
  "Snapfront can change the rate or end the program with notice, and can withhold commissions earned against these rules.",
];
function uniqueCode(base) {
  base = normCode(base).slice(0, 14) || "SNAP";
  if (base.length < 3) base = `${base}SNAP`;
  for (let i = 0; i < 50; i++) {
    const c = i ? `${base}${10 + Math.floor(Math.random() * 990)}` : base;
    if (!db.prepare("SELECT 1 FROM partners WHERE code = ?").get(c)) return c;
  }
  return `${base.slice(0, 8)}${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}
export function join(account, b = {}) {
  if (!b.agree) throw httpError(400, "Read and accept the partner rules to join.");
  if (!account.email) throw httpError(400, "Sign in with your email first (Settings), so we can reach you about payouts.");
  if (db.prepare("SELECT 1 FROM partners WHERE account_id = ?").get(account.id)) return view(account);
  const store = plans.storesOf(account.id)[0];
  const named = store?.store_name && !/^my snapfront store/i.test(store.store_name) ? store.store_name : null;
  const code = uniqueCode(b.code || named || account.email.split("@")[0]);
  db.prepare("INSERT INTO partners (account_id, code, paypal_email) VALUES (?,?,?)").run(account.id, code, cleanEmail(b.paypal_email) || null);
  return view(account);
}
export function update(account, b = {}) {
  const p = db.prepare("SELECT * FROM partners WHERE account_id = ?").get(account.id);
  if (!p) throw httpError(404, "Join the partner program first.");
  if (b.paypal_email !== undefined) {
    const e = b.paypal_email ? cleanEmail(b.paypal_email) : null;
    if (b.paypal_email && !e) throw httpError(400, "Enter the email address of your PayPal account.");
    db.prepare("UPDATE partners SET paypal_email = ? WHERE account_id = ?").run(e, account.id);
  }
  if (b.code !== undefined && normCode(b.code) !== p.code) {
    const c = normCode(b.code);
    if (c.length < 3) throw httpError(400, "Your code needs at least 3 letters or numbers.");
    if (db.prepare("SELECT 1 FROM partners WHERE code = ?").get(c)) throw httpError(409, `${c} is taken. Try another.`);
    // Old links keep working: clicks are counted by code, so keep the old code's clicks with the partner.
    db.prepare("UPDATE partner_clicks SET code = ? WHERE code = ?").run(c, p.code);
    db.prepare("UPDATE partners SET code = ? WHERE account_id = ?").run(c, account.id);
  }
  return view(account);
}
function payoutMethod(accountId, paypal) {
  const store = db.prepare("SELECT stripe_account_id FROM sellers WHERE account_id = ? AND stripe_account_id IS NOT NULL AND stripe_ready = 1 ORDER BY created_at LIMIT 1").get(accountId);
  if (store && autoPayouts()) return { method: "stripe", detail: "Paid automatically to the Stripe account connected to your store." };
  if (paypal) return { method: "paypal", detail: `Paid by PayPal to ${paypal}.` };
  return { method: "none", detail: "Connect Stripe on your store, or add a PayPal email, so we can pay you." };
}
/**
 * Turn the Snapfront membership card on or off on this store's link-in-bio page. The card sends
 * visitors to the partner's sales page, so only an active partner can show it.
 */
export function setBioCard(account, seller, on) {
  const p = db.prepare("SELECT * FROM partners WHERE account_id = ?").get(account.id);
  if (on && !p) throw httpError(404, "Join the partner program first.");
  if (on && p.status !== "active") throw httpError(403, "Your partner link is paused, so the card can't be shown.");
  if (!seller || seller.account_id !== account.id) throw httpError(404, "Pick one of your stores.");
  db.prepare("UPDATE sellers SET partner_card = ? WHERE id = ?").run(on ? 1 : 0, seller.id);
  return view(account, { ...seller, partner_card: on ? 1 : 0 });
}
/** What the store's link-in-bio page shows for the membership card, or null when it's off. */
export function bioCard(seller) {
  if (!seller?.partner_card || !seller.account_id) return null;
  const p = db.prepare("SELECT * FROM partners WHERE account_id = ? AND status = 'active'").get(seller.account_id);
  if (!p) return null;
  const long = webbilling.longPlan();
  return { code: p.code, url: salesLink(p.code), lifetime: dollars(webbilling.PLANS.lifetime.cents), monthly: dollars(webbilling.PLANS.pro.cents), long_plan: long, long_price: dollars(webbilling.PLANS[long].cents) };
}

export function view(account, seller = null) {
  const p = db.prepare("SELECT * FROM partners WHERE account_id = ?").get(account.id);
  const long = webbilling.longPlan();
  const program = { rate: RATE(), monthly_per_month: dollars(MONTHLY_CENTS()), monthly_price: dollars(webbilling.PLANS.pro.cents), hold_days: HOLD_DAYS(), play_hold_days: HOLD.play(), window_days: WINDOW_DAYS(), lifetime_price: dollars(webbilling.PLANS.lifetime.cents),
    per_sale: dollars(share(webbilling.PLANS[long].cents)), long_plan: long, yearly_price: dollars(webbilling.PLANS.yearly.cents), yearly_per_year: dollars(share(webbilling.PLANS.yearly.cents)), terms: TERMS };
  if (!p) return { joined: false, program, has_email: Boolean(account.email) };
  const sum = (status) => db.prepare("SELECT COALESCE(SUM(commission_cents),0) AS c FROM partner_commissions WHERE partner_id = ? AND status = ?").get(account.id, status).c;
  const commissions = db.prepare("SELECT * FROM partner_commissions WHERE partner_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 100").all(account.id);
  return {
    joined: true, program, code: p.code, status: p.status, link: shareLink(p.code), home_link: `${homeUrl()}/?via=${p.code}`,
    sales_link: salesLink(p.code), bio_card: seller ? { on: Boolean(seller.partner_card), store_name: seller.store_name } : null,
    stats: {
      clicks: db.prepare("SELECT COUNT(*) AS n FROM partner_clicks WHERE code = ?").get(p.code).n,
      signups: db.prepare("SELECT COUNT(*) AS n FROM accounts WHERE referred_by = ?").get(account.id).n,
      sales: commissions.filter((x) => x.status !== "void").length,
      pending: dollars(sum("pending")), ready: dollars(sum("approved")), paid: dollars(sum("paid")),
    },
    payout: { ...payoutMethod(account.id, p.paypal_email), paypal_email: p.paypal_email },
    commissions: commissions.map((x) => ({ id: x.id, created_at: x.created_at, plan: x.plan, sale: dollars(x.sale_cents), commission: dollars(x.commission_cents),
      status: x.status, available_at: x.available_at, paid_at: x.paid_at, note: x.note })),
  };
}

/* ---------- clicks and referrals ---------- */
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|curl|wget|python|headless|lighthouse/i;
/** A visit through a partner link: count it and remember the code in a cookie the website can read. */
export function recordClick(req, res, code) {
  const p = partnerByCode(code);
  if (!p) return null;
  if (!BOT.test(req.get("user-agent") || "")) {
    const day = new Date().toISOString().slice(0, 10);
    const visitor = crypto.createHmac("sha256", config.downloadSecret).update(`partner|${req.ip}|${req.get("user-agent") || ""}|${day}`).digest("hex").slice(0, 16);
    db.prepare("INSERT OR IGNORE INTO partner_clicks (code, day, visitor) VALUES (?,?,?)").run(p.code, day, visitor);
  }
  // First partner wins: don't replace a code the visitor already has.
  if (!/(?:^|;\s*)sf_via=/.test(req.get("cookie") || "")) {
    res.cookie("sf_via", `${p.code}.${Date.now()}`, { maxAge: WINDOW_DAYS() * 864e5, sameSite: "lax", secure: config.publicUrl.startsWith("https://"), path: "/",
      ...(config.storeDomain ? { domain: `.${config.storeDomain}` } : {}) });
  }
  return p.code;
}
/**
 * The website says this account arrived through a partner link. The first partner is kept;
 * paying customers, the partner themselves, and stale links are ignored.
 */
export function claim(account, raw) {
  const [codePart, atPart] = String(raw || "").split(".");
  const p = partnerByCode(codePart);
  if (!p) return { claimed: false };
  const at = Number(atPart);
  if (at && Date.now() - at > WINDOW_DAYS() * 864e5) return { claimed: false };
  if (p.account_id === account.id || account.referred_by) return { claimed: false };
  const partnerEmail = plans.getAccount(p.account_id)?.email;
  if (partnerEmail && account.email && partnerEmail.toLowerCase() === account.email.toLowerCase()) return { claimed: false };
  if (webbilling.hasLifetime(account.id)) return { claimed: false };
  db.prepare("UPDATE accounts SET referred_by = ?, referred_at = datetime('now') WHERE id = ? AND referred_by IS NULL").run(p.account_id, account.id);
  return { claimed: true };
}

/* ---------- commissions ---------- */
const sameEmail = (a, b) => Boolean(a && b && String(a).trim().toLowerCase() === String(b).trim().toLowerCase());
/** The partner who gets credit for this buyer's purchase, or null. */
function partnerFor(buyer, { recurring = false } = {}) {
  if (!buyer?.referred_by) return null;
  const partner = db.prepare("SELECT * FROM partners WHERE account_id = ? AND status = 'active'").get(buyer.referred_by);
  if (!partner || partner.account_id === buyer.id) return null;
  // A later month of a subscription the partner already earned on keeps earning; anything new
  // must start within the referral window.
  const earnedBefore = recurring && db.prepare("SELECT 1 FROM partner_commissions WHERE partner_id = ? AND buyer_account = ? AND status != 'void' LIMIT 1").get(partner.account_id, buyer.id);
  if (!earnedBefore && buyer.referred_at && Date.parse(`${String(buyer.referred_at).replace(" ", "T")}Z`) < Date.now() - WINDOW_DAYS() * 864e5) return null;
  return partner;
}
function record(partner, buyer, e, sale, commission) {
  if (!(commission > 0) || !(sale > 0) || commission > sale) return;
  const available = db.prepare("SELECT datetime('now', ?) AS t").get(`+${holdFor(e.source)} days`).t;
  const inserted = db.prepare("INSERT OR IGNORE INTO partner_commissions (id, partner_id, buyer_account, source, ref, plan, sale_cents, commission_cents, available_at) VALUES (?,?,?,?,?,?,?,?,?)")
    .run(newId("pcm"), partner.account_id, buyer.id, e.source, String(e.ref), e.plan, sale, commission, available).changes;
  if (!inserted) return;
  const to = plans.getAccount(partner.account_id)?.email;
  const what = e.plan === "lifetime" ? "Snapfront Lifetime" : "a month of Snapfront";
  if (to) sendEmail({ to, subject: `You earned ${money(commission)} with Snapfront`,
    html: `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#16152E"><p style="font-size:20px;font-weight:700">Nice work!</p><p>Someone you sent paid for ${what}. You earned <b>${money(commission)}</b>.</p><p>It's paid on ${available.slice(0, 10)}, once Snapfront has the money. See it in Earn with Snapfront.</p></div>`,
    text: `Someone you sent paid for ${what}. You earned ${money(commission)}, paid on ${available.slice(0, 10)}.` }).catch(() => {});
}
/** Lifetime bought (or refunded/charged back). */
function onPurchase(e) {
  const existing = db.prepare("SELECT * FROM partner_commissions WHERE source = ? AND ref = ?").get(e.source, String(e.ref));
  if (e.status === "ended") {
    if (!existing) return;
    if (existing.status === "paid") db.prepare("UPDATE partner_commissions SET note = 'Refunded or charged back after it was paid' WHERE id = ?").run(existing.id);
    else db.prepare("UPDATE partner_commissions SET status = 'void', note = 'Refunded or charged back' WHERE id = ?").run(existing.id);
    return;
  }
  if (e.status !== "active" || existing || e.plan !== "lifetime" || e.test) return;
  const buyer = plans.getAccount(e.account_id);
  const partner = partnerFor(buyer);
  if (!partner) return;
  // No earning on your own purchase, even from a second account.
  const partnerEmail = plans.getAccount(partner.account_id)?.email;
  if (sameEmail(partnerEmail, e.email) || sameEmail(partnerEmail, buyer.email)) return;
  const sale = Math.round(Number(e.amount_cents)) || webbilling.PLANS.lifetime.cents;
  record(partner, buyer, e, sale, share(sale));
}
/** A paid month of Monthly or year of Yearly: the same share of what was paid. */
function onMonth(e) {
  if (e.test) return;
  const buyer = plans.getAccount(e.account_id);
  const partner = partnerFor(buyer, { recurring: true });
  if (!partner) return;
  const partnerEmail = plans.getAccount(partner.account_id)?.email;
  if (sameEmail(partnerEmail, e.email) || sameEmail(partnerEmail, buyer.email)) return;
  const sale = Math.round(Number(e.amount_cents)) || 0;
  record(partner, buyer, e, sale, share(sale));
}
webbilling.onPurchaseChange(onPurchase);
playbilling.onPurchaseChange(onPurchase);
webbilling.onInvoicePaid(onMonth);
playbilling.onInvoicePaid(onMonth);

let transfers = {
  create: (params, opts) => stripeClient().transfers.create(params, opts),
  list: (params) => stripeClient().transfers.list(params),
};
/** Tests swap in a stand-in for Stripe transfers. */
export function setTransfers(t) { transfers = t; }

/** Is the purchase behind this commission still paid for (no refund or chargeback)? Asks Stripe/Google again. */
async function stillPaid(c) {
  if (c.source === "stripe") {
    const row = db.prepare("SELECT * FROM stripe_plan_purchases WHERE session_id = ?").get(c.ref);
    if (!row) return false;
    await webbilling.refreshAccount(row.account_id).catch(() => {});
    return db.prepare("SELECT status FROM stripe_plan_purchases WHERE session_id = ?").get(c.ref)?.status === "active";
  }
  if (c.source === "play") {
    const row = db.prepare("SELECT * FROM play_purchases WHERE token = ?").get(c.ref);
    if (!row) return false;
    await playbilling.refreshAccount(row.account_id).catch(() => {});
    return db.prepare("SELECT status FROM play_purchases WHERE token = ?").get(c.ref)?.status === "active";
  }
  return true;   // a month already paid (stripe_invoice / play_order): all sales final
}

let sweeping = false;
/** Release commissions once Snapfront has been paid, then pay what's ready. Safe to run any time. */
export async function sweep() {
  if (sweeping) return 0;
  sweeping = true;
  try {
    const due = db.prepare("SELECT * FROM partner_commissions WHERE status = 'pending' AND available_at <= datetime('now') LIMIT 500").all();
    for (const c of due) {
      let ok;
      try { ok = await stillPaid(c); } catch { continue; }   // couldn't check: try again next time
      db.prepare("UPDATE partner_commissions SET status = ?, note = ? WHERE id = ? AND status = 'pending'").run(ok ? "approved" : "void", ok ? "" : "Refunded or charged back", c.id);
    }
    if (!autoPayouts()) return 0;
    let paid = 0;
    const ready = db.prepare(`SELECT c.* FROM partner_commissions c JOIN partners p ON p.account_id = c.partner_id
      WHERE c.status = 'approved' AND p.status = 'active' ORDER BY c.created_at LIMIT 500`).all();
    for (const c of ready) {
      const dest = db.prepare("SELECT stripe_account_id FROM sellers WHERE account_id = ? AND stripe_account_id IS NOT NULL AND stripe_ready = 1 ORDER BY created_at LIMIT 1").get(c.partner_id)?.stripe_account_id;
      if (!dest) continue;
      try {
        // One transfer per commission, grouped under the commission id: if a previous run sent it
        // but crashed before saving, Stripe already has it and we record that instead of paying again.
        const found = (await transfers.list({ transfer_group: c.id, limit: 1 }))?.data?.[0];
        const t = found || await transfers.create({ amount: c.commission_cents, currency: "usd", destination: dest, transfer_group: c.id,
          description: `Snapfront partner commission ${c.id}`, metadata: { snapfront_partner: c.partner_id, snapfront_commission: c.id } }, { idempotencyKey: `partner-commission-${c.id}` });
        db.prepare("UPDATE partner_commissions SET status = 'paid', paid_at = datetime('now'), payout_ref = ? WHERE id = ? AND status = 'approved'").run(t.id, c.id);
        paid++;
      } catch (e) { console.warn("[partners] transfer", c.id, e.message); }
    }
    return paid;
  } finally { sweeping = false; }
}

/* ---------- Snapfront's own view (admin) ---------- */
export function adminSummary() {
  const rows = db.prepare(`SELECT p.account_id, p.code, p.status, p.paypal_email, a.email,
      (SELECT COUNT(*) FROM partner_clicks k WHERE k.code = p.code) AS clicks,
      (SELECT COUNT(*) FROM accounts r WHERE r.referred_by = p.account_id) AS signups,
      (SELECT COUNT(*) FROM partner_commissions c WHERE c.partner_id = p.account_id AND c.status != 'void') AS sales,
      (SELECT COALESCE(SUM(sale_cents),0) FROM partner_commissions c WHERE c.partner_id = p.account_id AND c.status != 'void') AS revenue,
      (SELECT COALESCE(SUM(commission_cents),0) FROM partner_commissions c WHERE c.partner_id = p.account_id AND c.status = 'pending') AS pending,
      (SELECT COALESCE(SUM(commission_cents),0) FROM partner_commissions c WHERE c.partner_id = p.account_id AND c.status = 'approved') AS ready,
      (SELECT COALESCE(SUM(commission_cents),0) FROM partner_commissions c WHERE c.partner_id = p.account_id AND c.status = 'paid') AS paid
    FROM partners p JOIN accounts a ON a.id = p.account_id ORDER BY revenue DESC, p.created_at`).all();
  return { rate: RATE(), auto_payouts: autoPayouts(), partners: rows.map((r) => ({ ...r, revenue: dollars(r.revenue), pending: dollars(r.pending), ready: dollars(r.ready), paid: dollars(r.paid),
    payout: payoutMethod(r.account_id, r.paypal_email).method })) };
}
/** Snapfront paid a partner by hand (PayPal): mark everything ready as paid. */
export function markPaid(partnerId, note = "") {
  const r = db.prepare("UPDATE partner_commissions SET status = 'paid', paid_at = datetime('now'), payout_ref = ? WHERE partner_id = ? AND status = 'approved'").run(String(note || "manual").slice(0, 120), String(partnerId));
  if (!r.changes) throw httpError(404, "Nothing is ready to pay for that partner.");
  return { marked: r.changes };
}
export function setStatus(partnerId, status) {
  if (!["active", "suspended"].includes(status)) throw httpError(400, "Status must be active or suspended.");
  if (!db.prepare("UPDATE partners SET status = ? WHERE account_id = ?").run(status, String(partnerId)).changes) throw httpError(404, "No such partner.");
  return { ok: true };
}

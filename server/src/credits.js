// Snapfront credits: the currency for premium AI generation (avatar videos and talking avatars),
// bought in packs on the website, like Higgsfield or OpenArt. Plans (Lifetime / Monthly) cover the
// everyday tools; credits pay for the expensive video models, so heavy users pay for what they use.
//
// How it works:
// - Every change is a row in credit_ledger; the balance is their sum. Nothing is ever edited.
// - A generation spends its credits when it starts (ref = the job id) and gets them back if it fails
//   (one refund per job, never twice).
// - Packs are paid with Stripe Checkout on Snapfront's own Stripe account. The server checks the
//   payment with Stripe itself (on return from checkout and in a background sweep) and adds the
//   credits once per payment. A later refund or chargeback takes the pack's credits back.
// - Credits don't expire. All sales are final, but a failed generation always refunds its credits.
// - On phones, packs are only sold on the website (app stores require their own billing for
//   in-app digital purchases), so the native app shows the balance and points to snapfront.app.
import { config } from "./config.js";
import { db, newId } from "./db.js";
import { httpError } from "./claude.js";
import { stripeClient } from "./payments.js";

db.exec(`
CREATE TABLE IF NOT EXISTS credit_ledger (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  delta INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('purchase','spend','refund','grant','reversal')),
  ref TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (kind, ref)
);
CREATE INDEX IF NOT EXISTS credit_ledger_account ON credit_ledger (account_id, created_at);
CREATE TABLE IF NOT EXISTS stripe_plan_customers (account_id TEXT PRIMARY KEY, customer_id TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS credit_purchases (
  session_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  pack TEXT NOT NULL,
  credits INTEGER NOT NULL,
  cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','ended','reversed')),
  payment_intent TEXT,
  checked_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

/* ---------- packs and prices ---------- */
// Override with CREDIT_PACKS='[{"id":"starter","credits":300,"cents":1500}, ...]'.
const DEFAULT_PACKS = [
  { id: "starter", name: "Starter", credits: 300, cents: 1500 },
  { id: "creator", name: "Creator", credits: 800, cents: 3500 },
  { id: "studio", name: "Studio", credits: 2000, cents: 7900 },
  { id: "agency", name: "Agency", credits: 5500, cents: 19900, badge: "Best value" },
];
/** Bonus credits added to every pack at no extra cost (CREDIT_BONUS, default 100; 0 turns it off). */
export const BONUS = () => { const v = Number(process.env.CREDIT_BONUS); return Number.isInteger(v) && v >= 0 && v <= 100000 ? v : 100; };
const withBonus = (p) => ({ ...p, bonus: BONUS(), total: p.credits + BONUS() });
export function packs() {
  try {
    const custom = JSON.parse(process.env.CREDIT_PACKS || "null");
    if (Array.isArray(custom) && custom.length) {
      return custom.filter((p) => p && /^[a-z0-9-]{2,20}$/.test(p.id) && Number.isInteger(p.credits) && p.credits > 0 && Number.isInteger(p.cents) && p.cents >= 100)
        .map((p) => withBonus({ id: p.id, name: String(p.name || p.id).slice(0, 30), credits: p.credits, cents: p.cents, badge: p.badge ? String(p.badge).slice(0, 20) : undefined }));
    }
  } catch { /* fall back to the defaults */ }
  return DEFAULT_PACKS.map(withBonus);
}
const num = (env, fallback, min, max) => { const v = Number(process.env[env]); return Number.isFinite(v) && v >= min && v <= max ? v : fallback; };
/** What one credit is worth to us at list price, and the margin over the AI provider's cost. */
const CREDIT_VALUE = () => num("CREDIT_VALUE_USD", 0.04, 0.001, 10);
const MARKUP = () => num("CREDIT_MARKUP", 2.5, 1, 20);
/** Credits for something that costs `usd` at the provider, rounded up to a multiple of 5. */
/** Credits per US dollar of provider cost, before rounding (so the app can price things the same way). */
export const perDollar = () => MARKUP() / CREDIT_VALUE();
export const creditsFor = (usd) => Math.max(5, Math.ceil((usd * MARKUP()) / CREDIT_VALUE() / 5) * 5);

export const enabled = () => Boolean(config.stripeKey);
const webAppUrl = () => (config.storeDomain ? `https://app.${config.storeDomain}` : `${config.publicUrl}/app`);
const money = (cents) => `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;
export const NO_REFUNDS = "All sales are final. Credits don't expire, and failed generations always get their credits back.";

/* ---------- the owner ---------- */
/** OWNER_EMAILS accounts (Snapfront's own, for running and testing it) make videos without spending credits. */
export const isOwner = (account) => Boolean(account?.email && (config.ownerEmails || []).includes(String(account.email).trim().toLowerCase()));

/* ---------- the balance ---------- */
export const balance = (accountId) => db.prepare("SELECT COALESCE(SUM(delta),0) AS b FROM credit_ledger WHERE account_id = ?").get(accountId).b;
const insert = (accountId, delta, kind, ref, note = "") =>
  db.prepare("INSERT OR IGNORE INTO credit_ledger (id, account_id, delta, kind, ref, note) VALUES (?,?,?,?,?,?)").run(newId("crd"), accountId, delta, kind, String(ref), String(note).slice(0, 200)).changes > 0;

/**
 * Spend credits for a job (ref = its id). Throws 402 with what's needed when the balance is short.
 * Checked and written in one transaction so two jobs can't spend the same credits.
 */
export const spend = db.transaction((account, amount, ref, note = "") => {
  amount = Math.round(amount);
  if (!(amount > 0)) throw httpError(400, "Nothing to charge.");
  // The owner isn't charged; the zero line keeps a record of what was made.
  if (isOwner(account)) { insert(account.id, 0, "spend", ref, `${note} (owner, free)`.trim()); return balance(account.id); }
  const have = balance(account.id);
  if (have < amount) throw httpError(402, `This needs ${amount} credits and you have ${have}. Top up your credits to make it.`, { credits: { need: amount, balance: have } });
  if (!insert(account.id, -amount, "spend", ref, note)) throw httpError(409, "This was already charged.");
  return balance(account.id);
});
/** Give back a job's credits (once). */
export function refund(ref, note = "Didn't work, so the credits came back") {
  const s = db.prepare("SELECT * FROM credit_ledger WHERE kind = 'spend' AND ref = ?").get(String(ref));
  if (!s || !s.delta) return false;   // nothing was charged (the owner's free videos)
  return insert(s.account_id, -s.delta, "refund", ref, note);
}
/** Give back part of a job's credits (once), e.g. a premium voice that fell back to the free one. */
export function refundPart(ref, amount, note) {
  const s = db.prepare("SELECT * FROM credit_ledger WHERE kind = 'spend' AND ref = ?").get(String(ref));
  amount = Math.round(amount);
  if (!s || !s.delta || !(amount > 0) || amount > -s.delta) return false;
  return insert(s.account_id, amount, "refund", `${ref}:part`, note);
}
/** Snapfront adds (or removes) credits by hand: promos, support, testers. */
export function grant(accountId, amount, note = "") {
  amount = Math.round(Number(amount));
  if (!Number.isInteger(amount) || amount === 0 || Math.abs(amount) > 1_000_000) throw httpError(400, "Give a whole number of credits.");
  if (!db.prepare("SELECT 1 FROM accounts WHERE id = ?").get(String(accountId))) throw httpError(404, "No such account.");
  insert(String(accountId), amount, "grant", newId("grant"), note || (amount > 0 ? "Added by Snapfront" : "Removed by Snapfront"));
  return { balance: balance(String(accountId)) };
}

export function view(account) {
  const history = db.prepare("SELECT * FROM credit_ledger WHERE account_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 50").all(account.id)
    .map((r) => ({ id: r.id, delta: r.delta, kind: r.kind, note: r.note, created_at: r.created_at }));
  return {
    enabled: enabled(), balance: balance(account.id), terms: NO_REFUNDS, free: isOwner(account),
    packs: packs().map((p) => ({ ...p, price: money(p.cents), per_credit: `${(p.cents / p.total).toFixed(1)}¢` })),
    history,
  };
}

/* ---------- buying packs ---------- */
async function customerFor(account) {
  const known = db.prepare("SELECT customer_id FROM stripe_plan_customers WHERE account_id = ?").get(account.id)?.customer_id;
  if (known) return known;
  const c = await stripeClient().customers.create({ email: account.email || undefined, metadata: { snapfront_account: account.id } });
  db.prepare("INSERT OR REPLACE INTO stripe_plan_customers (account_id, customer_id) VALUES (?, ?)").run(account.id, c.id);
  return c.id;
}
export async function startCheckout(account, packId) {
  if (!enabled()) throw httpError(503, "Credits can't be bought right now. Try again soon.");
  const p = packs().find((x) => x.id === packId);
  if (!p) throw httpError(400, "Pick a credit pack.");
  if (!account.email) throw httpError(400, "Add your email first (Settings), so your credits are safe if you change phones.");
  const session = await stripeClient().checkout.sessions.create({
    mode: "payment",
    customer: await customerFor(account),
    client_reference_id: account.id,
    line_items: [{ quantity: 1, price_data: { currency: "usd", unit_amount: p.cents, product_data: { name: `${p.total.toLocaleString("en-US")} Snapfront credits${p.bonus ? ` (${p.credits.toLocaleString("en-US")} + ${p.bonus} bonus)` : ""}`, description: "For AI avatar videos and talking avatars. Credits don't expire." } } }],
    metadata: { snapfront_credits: p.id, snapfront_account: account.id, credits: String(p.total) },
    payment_intent_data: { metadata: { snapfront_credits: p.id, snapfront_account: account.id } },
    success_url: `${webAppUrl()}/credits?checkout=done&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${webAppUrl()}/credits?checkout=canceled`,
    custom_text: { submit: { message: NO_REFUNDS } },
  });
  db.prepare("INSERT INTO credit_purchases (session_id, account_id, pack, credits, cents) VALUES (?,?,?,?,?)").run(session.id, account.id, p.id, p.total, p.cents);
  return { url: session.url };
}

/** Ask Stripe about one pack purchase; add the credits once it's paid, take them back if refunded. */
async function check(row) {
  const s = stripeClient();
  const session = await s.checkout.sessions.retrieve(row.session_id);
  // Only a checkout we opened for this account counts.
  if (session.metadata?.snapfront_account !== row.account_id || session.metadata?.snapfront_credits !== row.pack) return "ended";
  if (session.status === "expired") return "ended";
  if (session.status !== "complete" || session.payment_status !== "paid") return "pending";
  const piId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  if (piId) {
    const pi = await s.paymentIntents.retrieve(piId, { expand: ["latest_charge"] });
    const ch = pi.latest_charge && typeof pi.latest_charge === "object" ? pi.latest_charge : null;
    db.prepare("UPDATE credit_purchases SET payment_intent = ? WHERE session_id = ?").run(piId, row.session_id);
    if (ch && (ch.refunded || ch.disputed)) return "reversed";
  }
  return "paid";
}
function apply(row, status) {
  db.prepare("UPDATE credit_purchases SET status = ?, checked_at = datetime('now') WHERE session_id = ?").run(status, row.session_id);
  if (status === "paid" || status === "reversed") insert(row.account_id, row.credits, "purchase", row.session_id, `${row.credits.toLocaleString("en-US")} credits (${money(row.cents)})`);
  // Refunded or charged back: the pack's credits go back (the balance can go below zero, which just blocks spending).
  if (status === "reversed") insert(row.account_id, -row.credits, "reversal", row.session_id, "Payment refunded or disputed");
}
/** Back from Stripe: check that payment and add the credits. */
export async function confirm(account, sessionId) {
  const row = db.prepare("SELECT * FROM credit_purchases WHERE session_id = ?").get(String(sessionId || ""));
  if (!row) throw httpError(404, "We couldn't find that payment. Your credits will show up in a minute.");
  if (row.account_id !== account.id) throw httpError(409, "That payment belongs to another Snapfront account.");
  const before = balance(account.id);
  apply(row, await check(row));
  return { ...view(account), added: balance(account.id) - before };
}
/** Background check: unfinished checkouts, and recent purchases for refunds or chargebacks. */
export async function sweep() {
  if (!enabled()) return 0;
  const due = db.prepare(`SELECT * FROM credit_purchases WHERE
      (status = 'pending' AND checked_at < datetime('now', '-5 minutes') AND created_at > datetime('now', '-2 days'))
      OR (status = 'paid' AND created_at > datetime('now', '-120 days') AND checked_at < datetime('now', '-1 day'))
    LIMIT 200`).all();
  for (const row of due) {
    try { apply(row, await check(row)); }
    catch (e) { if (e.statusCode === 404 || e.code === "resource_missing") apply(row, "ended"); else console.warn("[credits] sweep", row.session_id, e.message); }
  }
  db.prepare("UPDATE credit_purchases SET status = 'ended' WHERE status = 'pending' AND created_at < datetime('now', '-2 days')").run();
  return due.length;
}

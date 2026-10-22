// Plans bought on the website (app.snapfront.app) go through Stripe Checkout on Snapfront's own
// Stripe account. Google Play purchases (playbilling.js) and Stripe purchases both count: the
// account gets the best plan from either. The server checks Stripe itself (on return from
// checkout, when the app syncs, and in a background sweep), so nothing from the browser is trusted.
import { config } from "./config.js";
import { db } from "./db.js";
import { httpError } from "./claude.js";
import { stripeClient } from "./payments.js";
import * as playbilling from "./playbilling.js";

// What's on sale: everything in Snapfront (the "pro" plan), bought three ways. Lifetime (one
// payment) is for the first LIFETIME_LIMIT members (500): once that many Lifetime memberships are
// sold, Lifetime is no longer offered and Yearly takes its place. Monthly is always offered.
// Launch ($29 once) is no longer sold; people who bought it keep it.
const cents = (env, fallback) => (Number.isInteger(Number(process.env[env])) && Number(process.env[env]) >= 100 ? Number(process.env[env]) : fallback);
export const PLANS = {
  lifetime: { name: "Snapfront Lifetime", cents: cents("LIFETIME_PRICE_CENTS", 49900), mode: "payment", grants: "pro", description: "Everything in Snapfront, for life. One payment, no monthly bill. For the first 500 members." },
  pro: { name: "Snapfront Pro", cents: cents("PRO_PRICE_CENTS", 9900), mode: "subscription", interval: "month", grants: "pro", description: "Everything in Snapfront, billed monthly. Cancel any time." },
  yearly: { name: "Snapfront Yearly", cents: cents("YEARLY_PRICE_CENTS", 49900), mode: "subscription", interval: "year", grants: "pro", description: "Everything in Snapfront, billed once a year. Cancel any time." },
};
/**
 * Ways to pay for Lifetime at Stripe Checkout, shown as badges on the home page. Only methods Stripe
 * reports as available on Snapfront's account (Settings > Payment methods); checkout shows each one
 * only to buyers it applies to. Affirm is switched on but not available yet, so it isn't listed.
 */
export const PAY_OPTIONS = [
  { id: "klarna", name: "Klarna", later: true }, { id: "afterpay", name: "Afterpay", later: true },
  { id: "cashapp", name: "Cash App Pay" }, { id: "apple_pay", name: "Apple Pay" }, { id: "amazon_pay", name: "Amazon Pay" },
  { id: "link", name: "Link" }, { id: "card", name: "All major cards" }, { id: "crypto", name: "USDC" },
];
/** How many Lifetime memberships are sold before Lifetime closes (LIFETIME_LIMIT, default 500). */
export const LIFETIME_LIMIT = () => {
  const raw = String(process.env.LIFETIME_LIMIT ?? "").trim(), n = Number(raw);
  return raw && Number.isInteger(n) && n >= 0 ? n : 500;
};
const LEGACY = { launch: { grants: "launch" } };
export const enabled = () => Boolean(config.stripeKey);
const webAppUrl = () => (config.storeDomain ? `https://app.${config.storeDomain}` : `${config.publicUrl}/app`);
const money = (cents) => `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;

db.exec(`CREATE TABLE IF NOT EXISTS stripe_plan_purchases (
  session_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  plan TEXT NOT NULL,                     -- lifetime | pro (launch: no longer sold)
  kind TEXT NOT NULL,                     -- once | sub
  status TEXT NOT NULL DEFAULT 'pending', -- pending | active | ended
  subscription_id TEXT,
  payment_intent TEXT,
  expires_at TEXT,
  checked_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`);
db.exec("CREATE TABLE IF NOT EXISTS stripe_plan_customers (account_id TEXT PRIMARY KEY, customer_id TEXT NOT NULL)");
// The account that opened the checkout (Stripe's metadata names it), kept when a purchase moves to another account.
if (!db.prepare("PRAGMA table_info(stripe_plan_purchases)").all().some((c) => c.name === "buyer_account")) db.exec("ALTER TABLE stripe_plan_purchases ADD COLUMN buyer_account TEXT");
if (!db.prepare("PRAGMA table_info(stripe_plan_purchases)").all().some((c) => c.name === "amount_cents")) db.exec("ALTER TABLE stripe_plan_purchases ADD COLUMN amount_cents INTEGER");
if (!db.prepare("PRAGMA table_info(stripe_plan_purchases)").all().some((c) => c.name === "email")) db.exec("ALTER TABLE stripe_plan_purchases ADD COLUMN email TEXT");

// Other parts of Snapfront (partner commissions) hear when a purchase starts or stops counting.
const listeners = [];
export const onPurchaseChange = (fn) => listeners.push(fn);
// ...and about every paid month of a subscription (partners earn on each).
const invoiceListeners = [];
export const onInvoicePaid = (fn) => invoiceListeners.push(fn);
/** All sales are final: shown on Stripe's checkout page above the Pay button. */
export const NO_REFUNDS = "All sales are final. Snapfront plans are non-refundable.";

/** Where the website sends people to get the Android app (set PLAY_STORE_URL to override). */
export const androidUrl = () => process.env.PLAY_STORE_URL || `https://play.google.com/store/apps/details?id=${config.playPackage || "com.sidebanc.snapfront"}`;

/** "$499 for life or $99 a month" (later "$499 a year or $99 a month"), for upgrade messages. */
export const priceLine = () => (lifetimeOpen() ? `${money(PLANS.lifetime.cents)} for life or ${money(PLANS.pro.cents)} a month` : `${money(PLANS.yearly.cents)} a year or ${money(PLANS.pro.cents)} a month`);
/** Prices shown on the website's plan screen: Lifetime (with spots left) or Yearly, and Monthly. */
export const offers = () => [
  lifetimeOpen() ? { plan: "lifetime", price: money(PLANS.lifetime.cents), sku: "lifetime", left: lifetimeLeft(), limit: LIFETIME_LIMIT() }
    : { plan: "yearly", price: money(PLANS.yearly.cents), sku: "yearly" },
  { plan: "pro", price: money(PLANS.pro.cents), sku: "pro" },
];

export function planFromPurchases(accountId, now = Date.now()) {
  const rows = db.prepare("SELECT * FROM stripe_plan_purchases WHERE account_id = ? AND status = 'active'").all(accountId);
  if (rows.some((r) => r.kind === "sub" && (!r.expires_at || Date.parse(r.expires_at) > now))) return "pro";
  if (rows.some((r) => r.kind === "once" && (PLANS[r.plan] || LEGACY[r.plan])?.grants === "pro")) return "pro";
  if (rows.some((r) => r.kind === "once")) return "launch";
  return "free";
}
playbilling.addPlanSource(planFromPurchases);
/** Has this account bought Lifetime (on the website or in the app)? */
/** Lifetime memberships that count toward the limit: paid and not refunded, website or Google Play. */
export function lifetimeSold() {
  const web = db.prepare("SELECT COUNT(DISTINCT account_id) AS n FROM stripe_plan_purchases WHERE plan = 'lifetime' AND status = 'active'").get().n;
  let play = 0;
  try { play = db.prepare("SELECT COUNT(DISTINCT account_id) AS n FROM play_purchases WHERE product_id = 'snapfront_lifetime' AND status = 'active'").get().n; } catch { /* no Play table yet */ }
  return web + play;
}
export const lifetimeLeft = () => Math.max(0, LIFETIME_LIMIT() - lifetimeSold());
export const lifetimeOpen = () => lifetimeLeft() > 0;
/** The long-term plan on sale right now: Lifetime while spots are left, then Yearly. */
export const longPlan = () => (lifetimeOpen() ? "lifetime" : "yearly");
export const hasLifetime = (accountId) => Boolean(db.prepare("SELECT 1 FROM stripe_plan_purchases WHERE account_id = ? AND plan = 'lifetime' AND status = 'active'").get(accountId)) || playbilling.hasLifetime(accountId);

export async function customerFor(account) {
  const known = db.prepare("SELECT customer_id FROM stripe_plan_customers WHERE account_id = ?").get(account.id)?.customer_id;
  if (known) return known;
  const c = await stripeClient().customers.create({ email: account.email || undefined, metadata: { snapfront_account: account.id } });
  db.prepare("INSERT OR REPLACE INTO stripe_plan_customers (account_id, customer_id) VALUES (?, ?)").run(account.id, c.id);
  return c.id;
}

/** Open Stripe Checkout for a plan. Returns the page to send the browser to. */
export async function startCheckout(account, plan, { ref = null } = {}) {
  if (plan === "launch") plan = "lifetime";   // old links
  const p = PLANS[plan];
  if (!p) throw httpError(400, "Pick a membership: Lifetime, Yearly or Monthly.");
  if (hasLifetime(account.id)) throw httpError(409, "You already have Snapfront Lifetime.");
  if (plan === "lifetime" && !lifetimeOpen()) throw httpError(409, `All ${LIFETIME_LIMIT()} founding Lifetime memberships are taken. Choose Yearly or Monthly.`, { offers: offers() });
  if (plan === "yearly" && lifetimeOpen()) throw httpError(409, "Yearly opens once the founding Lifetime memberships are gone. Choose Lifetime or Monthly.", { offers: offers() });
  // Subscribers can still switch to Lifetime (their subscription is then stopped).
  if (p.mode === "subscription" && playbilling.bestPlan(account.id) === "pro") throw httpError(409, "You already have Snapfront Pro. To change how you pay, open Manage subscription.");
  const s = stripeClient();
  const price_data = { currency: "usd", unit_amount: p.cents, product_data: { name: p.name, description: p.description },
    ...(p.mode === "subscription" ? { recurring: { interval: p.interval } } : {}) };
  const session = await s.checkout.sessions.create({
    mode: p.mode,
    customer: await customerFor(account),
    client_reference_id: account.id,
    line_items: [{ price_data, quantity: 1 }],
    metadata: { snapfront_plan: plan, snapfront_account: account.id, ...(ref ? { snapfront_partner: ref } : {}) },
    ...(p.mode === "subscription" ? { subscription_data: { metadata: { snapfront_plan: plan, snapfront_account: account.id } } } : {}),
    success_url: `${webAppUrl()}/plans?checkout=done&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${webAppUrl()}/plans?checkout=canceled`,
    allow_promotion_codes: true,
    custom_text: { submit: { message: NO_REFUNDS } },
  });
  db.prepare("INSERT INTO stripe_plan_purchases (session_id, account_id, plan, kind, buyer_account, amount_cents) VALUES (?,?,?,?,?,?)")
    .run(session.id, account.id, plan, p.mode === "subscription" ? "sub" : "once", account.id, p.cents);
  return { url: session.url };
}

const subStatus = (sub) => (["active", "trialing", "past_due"].includes(sub.status) ? "active" : ["incomplete"].includes(sub.status) ? "pending" : "ended");
const periodEnd = (sub) => {
  const end = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end;
  return end ? new Date(end * 1000).toISOString() : null;
};

/** Ask Stripe about one checkout and store what it says. */
async function inspect(row) {
  const s = stripeClient();
  const session = await s.checkout.sessions.retrieve(row.session_id);
  if (session.metadata?.snapfront_account !== (row.buyer_account || row.account_id)) return { ...row, status: "ended" };
  row = { ...row, email: session.customer_details?.email || session.customer_email || null };
  if (session.status === "expired") return { ...row, status: "ended" };
  if (session.status !== "complete") return { ...row, status: "pending" };
  if (row.kind === "sub") {
    const subId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
    if (!subId) return { ...row, status: "pending" };
    const sub = await s.subscriptions.retrieve(subId);
    // Each paid month (partners earn a fixed amount per month the subscriber pays).
    const invoices = s.invoices?.list ? ((await s.invoices.list({ subscription: subId, status: "paid", limit: 24 }).catch(() => ({ data: [] }))).data || []) : [];
    return { ...row, subscription_id: subId, status: subStatus(sub), expires_at: periodEnd(sub),
      invoices: invoices.filter((i) => i.id && i.status === "paid" && i.amount_paid > 0).map((i) => ({ id: i.id, amount_paid: i.amount_paid })) };
  }
  if (session.payment_status !== "paid") return { ...row, status: "pending" };
  const piId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  let status = "active";
  if (piId) {
    const pi = await s.paymentIntents.retrieve(piId, { expand: ["latest_charge"] });
    // Refunded or disputed (chargeback): the purchase no longer counts.
    if (pi.latest_charge && typeof pi.latest_charge === "object" && (pi.latest_charge.refunded || pi.latest_charge.disputed)) status = "ended";
  }
  return { ...row, payment_intent: piId || null, status, amount_cents: session.amount_total ?? row.amount_cents };
}
function save(r) {
  const before = db.prepare("SELECT status FROM stripe_plan_purchases WHERE session_id = ?").get(r.session_id)?.status;
  db.prepare("UPDATE stripe_plan_purchases SET status = ?, subscription_id = ?, payment_intent = ?, expires_at = ?, amount_cents = COALESCE(?, amount_cents), email = COALESCE(?, email), checked_at = datetime('now') WHERE session_id = ?")
    .run(r.status, r.subscription_id ?? null, r.payment_intent ?? null, r.expires_at ?? null, r.amount_cents ?? null, r.email ?? null, r.session_id);
  if (before !== r.status) {
    const row = db.prepare("SELECT * FROM stripe_plan_purchases WHERE session_id = ?").get(r.session_id);
    for (const fn of listeners) { try { fn({ source: "stripe", ref: row.session_id, account_id: row.account_id, plan: row.plan, status: row.status, amount_cents: row.amount_cents, email: row.email }); } catch (e) { console.warn("[webbilling] listener", e.message); } }
  }
  if (r.status === "active" && Array.isArray(r.invoices)) {
    const row = db.prepare("SELECT account_id, email FROM stripe_plan_purchases WHERE session_id = ?").get(r.session_id);
    for (const inv of r.invoices) for (const fn of invoiceListeners) {
      try { fn({ source: "stripe_invoice", ref: inv.id, account_id: row.account_id, plan: "pro", amount_cents: inv.amount_paid, email: row.email }); } catch (e) { console.warn("[webbilling] invoice listener", e.message); }
    }
  }
}
/** After Lifetime is bought, stop any monthly web subscription at the end of the paid month. */
async function endMonthlyAfterLifetime(accountId) {
  if (!hasLifetime(accountId)) return;
  for (const r of db.prepare("SELECT * FROM stripe_plan_purchases WHERE account_id = ? AND kind = 'sub' AND status = 'active' AND subscription_id IS NOT NULL").all(accountId)) {
    await stripeClient().subscriptions.update(r.subscription_id, { cancel_at_period_end: true }).catch((e) => console.warn("[webbilling] end monthly", e.message));
  }
}

/** The browser came back from Stripe: check that checkout and unlock the plan. Returns the plan
 * and the email typed at checkout (offered as the email to save the purchase to). */
export async function confirm(account, sessionId) {
  const row = db.prepare("SELECT * FROM stripe_plan_purchases WHERE session_id = ?").get(String(sessionId || ""));
  if (!row) throw httpError(404, "We couldn't find that payment. Tap Check my purchases in a minute.");
  if (row.account_id !== account.id) throw httpError(409, "This payment belongs to another Snapfront account. Sign in with your email to get it back.");
  const checked = await inspect(row);
  save(checked);
  if (checked.status === "active" && row.plan === "lifetime") await endMonthlyAfterLifetime(account.id);
  return { plan: playbilling.applyPlan(account.id), email: checked.email || null };
}

/**
 * Someone paid on the website, then signed in with an email that already has a Snapfront account
 * (proved with an emailed code): their website purchases move to that account with them.
 */
export function transferPurchases(fromAccountId, toAccountId) {
  if (fromAccountId === toAccountId) return 0;
  const moved = db.prepare("UPDATE stripe_plan_purchases SET buyer_account = COALESCE(buyer_account, account_id), account_id = ? WHERE account_id = ?").run(toAccountId, fromAccountId).changes;
  if (!moved) return 0;
  const had = db.prepare("SELECT 1 FROM stripe_plan_customers WHERE account_id = ?").get(toAccountId);
  if (!had) db.prepare("UPDATE stripe_plan_customers SET account_id = ? WHERE account_id = ?").run(toAccountId, fromAccountId);
  playbilling.applyPlan(fromAccountId);
  playbilling.applyPlan(toAccountId);
  return moved;
}

/** Re-check this account's Stripe plans (skipping ones checked in the last few minutes). */
export async function refreshAccount(accountId, { olderThanMinutes = 0 } = {}) {
  if (!enabled()) return;
  const rows = db.prepare("SELECT * FROM stripe_plan_purchases WHERE account_id = ? AND status != 'ended' AND checked_at <= datetime('now', ?)")
    .all(accountId, `-${olderThanMinutes} minutes`);
  for (const r of rows) {
    try { save(await inspect(r)); }
    catch (e) { if (e.statusCode === 404 || e.code === "resource_missing") save({ ...r, status: "ended" }); else console.warn("[webbilling]", r.session_id, e.message); }
  }
  // Checkouts nobody finished are dropped after a day.
  db.prepare("UPDATE stripe_plan_purchases SET status = 'ended' WHERE account_id = ? AND status = 'pending' AND created_at < datetime('now', '-1 day')").run(accountId);
  return playbilling.applyPlan(accountId);
}

/** Background check: renewals, cancellations and refunds. */
export async function sweep() {
  if (!enabled()) return 0;
  const due = db.prepare(`SELECT DISTINCT account_id FROM stripe_plan_purchases WHERE
      (status = 'pending' AND checked_at < datetime('now', '-10 minutes'))
      OR (kind = 'sub' AND status = 'active' AND (expires_at IS NULL OR julianday(expires_at) < julianday('now', '+1 hour')) AND checked_at < datetime('now', '-30 minutes'))
      OR (status = 'active' AND checked_at < datetime('now', '-7 days'))`).all();
  for (const { account_id } of due) await refreshAccount(account_id).catch((e) => console.warn("[webbilling] sweep", account_id, e.message));
  return due.length;
}

/** Stripe's page for changing the card or canceling Pro. */
export async function portal(account) {
  const customer = db.prepare("SELECT customer_id FROM stripe_plan_customers WHERE account_id = ?").get(account.id)?.customer_id;
  if (!customer) throw httpError(404, "There's no web subscription on this account. If you bought Pro on your phone, manage it in Google Play.");
  const s = await stripeClient().billingPortal.sessions.create({ customer, return_url: `${webAppUrl()}/plans` });
  return { url: s.url };
}

/** When an account is deleted, stop any web subscription so it isn't billed again. */
export async function cancelAll(accountId) {
  if (!enabled()) return;
  for (const r of db.prepare("SELECT subscription_id FROM stripe_plan_purchases WHERE account_id = ? AND kind = 'sub' AND subscription_id IS NOT NULL AND status != 'ended'").all(accountId)) {
    await stripeClient().subscriptions.cancel(r.subscription_id).catch((e) => console.warn("[webbilling] cancel", e.message));
  }
  db.prepare("DELETE FROM stripe_plan_purchases WHERE account_id = ?").run(accountId);
  db.prepare("DELETE FROM stripe_plan_customers WHERE account_id = ?").run(accountId);
}

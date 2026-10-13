// Plans bought on the website (app.snapfront.app) go through Stripe Checkout on Snapfront's own
// Stripe account. Google Play purchases (playbilling.js) and Stripe purchases both count: the
// account gets the best plan from either. The server checks Stripe itself (on return from
// checkout, when the app syncs, and in a background sweep), so nothing from the browser is trusted.
import { config } from "./config.js";
import { db } from "./db.js";
import { httpError } from "./claude.js";
import { stripeClient } from "./payments.js";
import * as playbilling from "./playbilling.js";

export const PLANS = {
  launch: { name: "Snapfront Launch", cents: 2900, mode: "payment", description: "Put your store live and take orders. One payment, yours for good." },
  pro: { name: "Snapfront Pro", cents: 1499, mode: "subscription", description: "Up to 10 live stores, bigger AI allowances and the store assistant." },
};
export const enabled = () => Boolean(config.stripeKey);
const webAppUrl = () => (config.storeDomain ? `https://app.${config.storeDomain}` : `${config.publicUrl}/app`);
const money = (cents) => `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;

db.exec(`CREATE TABLE IF NOT EXISTS stripe_plan_purchases (
  session_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  plan TEXT NOT NULL,                     -- launch | pro
  kind TEXT NOT NULL,                     -- once | sub
  status TEXT NOT NULL DEFAULT 'pending', -- pending | active | ended
  subscription_id TEXT,
  payment_intent TEXT,
  expires_at TEXT,
  checked_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`);
db.exec("CREATE TABLE IF NOT EXISTS stripe_plan_customers (account_id TEXT PRIMARY KEY, customer_id TEXT NOT NULL)");

/** Prices shown on the website's plan screen. */
export const offers = () => Object.entries(PLANS).map(([plan, p]) => ({ plan, price: money(p.cents), sku: plan }));

export function planFromPurchases(accountId, now = Date.now()) {
  const rows = db.prepare("SELECT * FROM stripe_plan_purchases WHERE account_id = ? AND status = 'active'").all(accountId);
  if (rows.some((r) => r.kind === "sub" && (!r.expires_at || Date.parse(r.expires_at) > now))) return "pro";
  if (rows.some((r) => r.kind === "once")) return "launch";
  return "free";
}
playbilling.addPlanSource(planFromPurchases);

async function customerFor(account) {
  const known = db.prepare("SELECT customer_id FROM stripe_plan_customers WHERE account_id = ?").get(account.id)?.customer_id;
  if (known) return known;
  const c = await stripeClient().customers.create({ email: account.email || undefined, metadata: { snapfront_account: account.id } });
  db.prepare("INSERT OR REPLACE INTO stripe_plan_customers (account_id, customer_id) VALUES (?, ?)").run(account.id, c.id);
  return c.id;
}

/** Open Stripe Checkout for a plan. Returns the page to send the browser to. */
export async function startCheckout(account, plan) {
  const p = PLANS[plan];
  if (!p) throw httpError(400, "Pick Launch or Pro.");
  const current = playbilling.bestPlan(account.id);
  if (current === "pro" || current === plan) throw httpError(409, `You already have ${current === "pro" ? "Pro" : "Launch"}.`);
  const s = stripeClient();
  const price_data = { currency: "usd", unit_amount: p.cents, product_data: { name: p.name, description: p.description },
    ...(p.mode === "subscription" ? { recurring: { interval: "month" } } : {}) };
  const session = await s.checkout.sessions.create({
    mode: p.mode,
    customer: await customerFor(account),
    client_reference_id: account.id,
    line_items: [{ price_data, quantity: 1 }],
    metadata: { snapfront_plan: plan, snapfront_account: account.id },
    ...(p.mode === "subscription" ? { subscription_data: { metadata: { snapfront_plan: plan, snapfront_account: account.id } } } : {}),
    success_url: `${webAppUrl()}/plans?checkout=done&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${webAppUrl()}/plans?checkout=canceled`,
    allow_promotion_codes: true,
  });
  db.prepare("INSERT INTO stripe_plan_purchases (session_id, account_id, plan, kind) VALUES (?,?,?,?)")
    .run(session.id, account.id, plan, p.mode === "subscription" ? "sub" : "once");
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
  if (session.metadata?.snapfront_account !== row.account_id) return { ...row, status: "ended" };
  if (session.status === "expired") return { ...row, status: "ended" };
  if (session.status !== "complete") return { ...row, status: "pending" };
  if (row.kind === "sub") {
    const subId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
    if (!subId) return { ...row, status: "pending" };
    const sub = await s.subscriptions.retrieve(subId);
    return { ...row, subscription_id: subId, status: subStatus(sub), expires_at: periodEnd(sub) };
  }
  if (session.payment_status !== "paid") return { ...row, status: "pending" };
  const piId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  let status = "active";
  if (piId) {
    const pi = await s.paymentIntents.retrieve(piId, { expand: ["latest_charge"] });
    if (pi.latest_charge && typeof pi.latest_charge === "object" && pi.latest_charge.refunded) status = "ended";
  }
  return { ...row, payment_intent: piId || null, status };
}
function save(r) {
  db.prepare("UPDATE stripe_plan_purchases SET status = ?, subscription_id = ?, payment_intent = ?, expires_at = ?, checked_at = datetime('now') WHERE session_id = ?")
    .run(r.status, r.subscription_id ?? null, r.payment_intent ?? null, r.expires_at ?? null, r.session_id);
}

/** The browser came back from Stripe: check that checkout and unlock the plan. */
export async function confirm(account, sessionId) {
  const row = db.prepare("SELECT * FROM stripe_plan_purchases WHERE session_id = ?").get(String(sessionId || ""));
  if (!row) throw httpError(404, "We couldn't find that payment. Tap Restore purchases in a minute.");
  if (row.account_id !== account.id) throw httpError(409, "This payment belongs to another Snapfront account. Sign in with your email to get it back.");
  save(await inspect(row));
  return playbilling.applyPlan(account.id);
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

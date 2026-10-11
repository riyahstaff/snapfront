// Pricing: Free (try it), Launch ($29 once: one live store), Pro ($14.99/month: up to 10 stores,
// bigger AI allowances and the store assistant). Purchases happen in the app through Google Play /
// the App Store via RevenueCat; the server only trusts what RevenueCat reports.
import crypto from "node:crypto";
import { config } from "./config.js";
import { db, newId, hashToken, slugify, uniqueSlug } from "./db.js";
import { httpError } from "./claude.js";

const DEFAULTS = {
  free:   { name: "Free",   liveStores: 0,  stores: 1,  photo: 3,   product: 1,  agent: 0 },
  launch: { name: "Launch", liveStores: 1,  stores: 1,  photo: 30,  product: 5,  agent: 0 },
  pro:    { name: "Pro",    liveStores: 10, stores: 10, photo: 300, product: 50, agent: 40 },
};
// Allowances can be tuned without a code change: PLAN_LIMITS='{"pro":{"agent":60}}'
let overrides = {};
try { overrides = JSON.parse(process.env.PLAN_LIMITS || "{}"); } catch { console.warn("[plans] PLAN_LIMITS is not valid JSON; using defaults"); }
export const PLANS = Object.fromEntries(Object.entries(DEFAULTS).map(([k, v]) => [k, { ...v, ...(overrides[k] || {}) }]));
const RANK = { free: 0, launch: 1, pro: 2 };
export const KIND_LABEL = { photo: "AI product pages", product: "AI digital products", agent: "store assistant requests" };

/* ---------- accounts and sessions ---------- */
export const getAccount = (id) => db.prepare("SELECT * FROM accounts WHERE id = ?").get(id);
export const accountForToken = (token) => {
  const s = token && db.prepare("SELECT account_id FROM sessions WHERE token_hash = ?").get(hashToken(token));
  return s ? getAccount(s.account_id) : null;
};
export const storesOf = (accountId) => db.prepare("SELECT * FROM sellers WHERE account_id = ? ORDER BY created_at, rowid").all(accountId);

export function newSession(accountId) {
  const token = crypto.randomBytes(32).toString("base64url");
  db.prepare("INSERT INTO sessions (token_hash, account_id) VALUES (?,?)").run(hashToken(token), accountId);
  return token;
}

/** A store row. The legacy per-store token column just needs a unique value now that sessions hold tokens. */
export function insertStore(accountId, name) {
  const id = newId("sel");
  const slug = uniqueSlug("sellers", "store_slug", slugify(name, 40));
  // A person's stores share their Stripe account, so a new store can take payments straight away.
  const sibling = db.prepare("SELECT stripe_account_id, stripe_ready FROM sellers WHERE account_id = ? AND stripe_account_id IS NOT NULL ORDER BY stripe_ready DESC LIMIT 1").get(accountId);
  db.prepare("INSERT INTO sellers (id, token_hash, store_name, store_slug, account_id, stripe_account_id, stripe_ready) VALUES (?,?,?,?,?,?,?)")
    .run(id, `store_${crypto.randomBytes(16).toString("hex")}`, name, slug, accountId, sibling?.stripe_account_id || null, sibling?.stripe_ready || 0);
  return db.prepare("SELECT * FROM sellers WHERE id = ?").get(id);
}

export function createAccountWithStore(name) {
  const accountId = `acc_${crypto.randomBytes(9).toString("base64url")}`;
  db.prepare("INSERT INTO accounts (id) VALUES (?)").run(accountId);
  const token = newSession(accountId);
  const store = insertStore(accountId, name);
  return { token, account: getAccount(accountId), store };
}

export function createStore(account, name) {
  const plan = PLANS[effectivePlan(account)];
  const count = storesOf(account.id).length;
  if (count >= plan.stores) {
    throw httpError(402, effectivePlan(account) === "pro" ? `Pro includes up to ${plan.stores} stores.` : "Upgrade to Pro to run up to 10 stores.", { upgrade: "pro" });
  }
  return insertStore(account.id, String(name || "").trim().slice(0, 80) || `Store ${count + 1}`);
}

/* ---------- plan and limits ---------- */
export function effectivePlan(account) {
  const a = account?.plan || "free", c = account?.comp_plan || "free";
  return RANK[c] > RANK[a] ? c : a;
}
const period = (plan) => (plan === "free" ? "trial" : new Date().toISOString().slice(0, 7));
const used = (accountId, p, kind) => db.prepare("SELECT count FROM usage WHERE account_id = ? AND period = ? AND kind = ?").get(accountId, p, kind)?.count || 0;

/** Throws a 402 the app turns into an upgrade prompt when the allowance is used up. */
export function assertAllowance(account, kind) {
  const planId = effectivePlan(account);
  const limit = PLANS[planId][kind];
  if (kind === "agent" && !limit) throw httpError(402, "The store assistant comes with Pro.", { upgrade: "pro" });
  if (used(account.id, period(planId), kind) >= limit) {
    const upgrade = planId === "free" ? "launch" : planId === "launch" ? "pro" : null;
    const msg = planId === "free"
      ? `You've used your free ${KIND_LABEL[kind]}. Get Launch to keep creating and go live.`
      : planId === "launch" ? `You've used this month's ${KIND_LABEL[kind]}. Pro gives you far more.`
      : `You've used this month's ${KIND_LABEL[kind]}. They reset on the 1st.`;
    throw httpError(402, msg, { upgrade });
  }
}
export function recordUsage(account, kind) {
  db.prepare("INSERT INTO usage (account_id, period, kind, count) VALUES (?,?,?,1) ON CONFLICT(account_id, period, kind) DO UPDATE SET count = count + 1")
    .run(account.id, period(effectivePlan(account)), kind);
}
/** Check, run, and count only if the work succeeded. */
export async function withAllowance(account, kind, fn) {
  assertAllowance(account, kind);
  const out = await fn();
  recordUsage(account, kind);
  return out;
}

/** Can this store take orders? Stores beyond the plan's live allowance (oldest first) can't. */
export function storeCanSell(store) {
  if (!store.account_id) return true;
  const account = getAccount(store.account_id);
  const plan = PLANS[effectivePlan(account)];
  const index = storesOf(store.account_id).findIndex((s) => s.id === store.id);
  return index >= 0 && index < plan.liveStores;
}
export function assertCanPublish(store) {
  if (storeCanSell(store)) return;
  const planId = effectivePlan(getAccount(store.account_id));
  throw httpError(402, planId === "free" ? "Get Launch ($29, one time) to publish your store and start selling." : "Your plan covers fewer live stores. Upgrade to Pro to sell from up to 10 stores.",
    { upgrade: planId === "free" ? "launch" : "pro" });
}

export function publicAccount(account, currentStoreId) {
  const planId = effectivePlan(account);
  const p = period(planId);
  const stores = storesOf(account.id);
  const plan = PLANS[planId];
  return {
    id: account.id, email: account.email, plan: planId, plan_name: plan.name,
    limits: plan, period: p,
    usage: Object.fromEntries(["photo", "product", "agent"].map((k) => [k, used(account.id, p, k)])),
    stores: stores.map((s, i) => ({ id: s.id, store_name: s.store_name, store_slug: s.store_slug, live_allowed: i < plan.liveStores, current: s.id === currentStoreId })),
    can_add_store: stores.length < plan.stores,
  };
}

/* ---------- RevenueCat ---------- */
// Entitlement identifiers configured in RevenueCat: "launch" (one-time) and "pro" (subscription).
export function planFromEntitlements(entitlements = {}, now = Date.now()) {
  const active = (e) => e && (!e.expires_date || new Date(e.expires_date).getTime() > now);
  return active(entitlements.pro) ? "pro" : active(entitlements.launch) ? "launch" : "free";
}

let fetchImpl = (...a) => fetch(...a);
export function setRevenueCatFetch(f) { fetchImpl = f; }   // used by tests

/** Ask RevenueCat what this account has paid for, and store it. */
export async function syncPlan(account) {
  if (!config.revenuecatSecretKey) return account;
  const res = await fetchImpl(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(account.id)}`, {
    headers: { Authorization: `Bearer ${config.revenuecatSecretKey}`, Accept: "application/json" },
  });
  if (!res.ok) throw httpError(502, "Couldn't check your purchases just now. Try again in a minute.");
  const body = await res.json();
  const plan = planFromEntitlements(body?.subscriber?.entitlements);
  db.prepare("UPDATE accounts SET plan = ?, plan_synced_at = datetime('now') WHERE id = ?").run(plan, account.id);
  return getAccount(account.id);
}

/** Account ids a RevenueCat webhook event refers to (purchases, renewals, expirations, transfers). */
export function accountIdsInEvent(event) {
  const ids = new Set([event?.app_user_id, event?.original_app_user_id, ...(event?.aliases || []), ...(event?.transferred_from || []), ...(event?.transferred_to || [])]);
  return [...ids].filter((id) => typeof id === "string" && id.startsWith("acc_") && getAccount(id));
}

// Pricing: Free (try it) and Pro: everything, bought once for life ($299, "Lifetime") or monthly ($69).
// Launch ($29 once: one live store) is no longer sold; people who bought it keep it. Pro: up to 10 stores,
// bigger AI allowances and the store assistant). Purchases happen in the Android app through Google
// Play Billing (playbilling.js) or on the website through Stripe Checkout (webbilling.js); the server checks both itself.
import crypto from "node:crypto";
import { config } from "./config.js";
import { db, newId, hashToken, slugify, uniqueSlug } from "./db.js";
import { httpError } from "./claude.js";
import * as suppliers from "./suppliers.js";
import * as playbilling from "./playbilling.js";
import * as webbilling from "./webbilling.js";
import { freeSlug } from "./urls.js";

const DEFAULTS = {
  free:   { name: "Free",   liveStores: 0,  stores: 1,  photo: 3,   product: 1,  agent: 0,  research: 3,   studio: 10,  post: 5,   scene: 2,   video: 0 },
  launch: { name: "Launch", liveStores: 1,  stores: 1,  photo: 30,  product: 5,  agent: 0,  research: 30,  studio: 100, post: 60,  scene: 20,  video: 0 },
  pro:    { name: "Pro",    liveStores: 10, stores: 10, photo: 300, product: 50, agent: 40, research: 300, studio: 500, post: 300, scene: 100, video: 10 },
};
// Allowances can be tuned without a code change: PLAN_LIMITS='{"pro":{"agent":60}}'
let overrides = {};
try { overrides = JSON.parse(process.env.PLAN_LIMITS || "{}"); } catch { console.warn("[plans] PLAN_LIMITS is not valid JSON; using defaults"); }
export const PLANS = Object.fromEntries(Object.entries(DEFAULTS).map(([k, v]) => [k, { ...v, ...(overrides[k] || {}) }]));
const RANK = { free: 0, launch: 1, pro: 2 };
export const KIND_LABEL = { photo: "AI product pages", product: "AI digital products", agent: "store assistant requests", research: "price checks", studio: "photo studio edits",
  post: "AI marketing posts", scene: "AI lifestyle photos", video: "AI video clips" };

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
  const slug = freeSlug(name);
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
  if (kind === "video" && !limit) throw httpError(402, "AI video clips come with Pro: 10 a month.", { upgrade: "pro" });
  if (used(account.id, period(planId), kind) >= limit) {
    const upgrade = planId === "pro" ? null : "pro";
    const msg = planId === "free"
      ? `You've used your free ${KIND_LABEL[kind]}. Get Snapfront Pro (${webbilling.priceLine()}) to keep creating and go live.`
      : planId === "launch" ? `You've used this month's ${KIND_LABEL[kind]}. Pro gives you far more.`
      : `You've used this month's ${KIND_LABEL[kind]}. They reset on the 1st.`;
    throw httpError(402, msg, { upgrade });
  }
}
export function recordUsage(account, kind) {
  db.prepare("INSERT INTO usage (account_id, period, kind, count) VALUES (?,?,?,1) ON CONFLICT(account_id, period, kind) DO UPDATE SET count = count + 1")
    .run(account.id, period(effectivePlan(account)), kind);
}
/** Give one back (a job that failed after it was counted). */
export function refundUsage(account, kind) {
  if (!account) return;
  db.prepare("UPDATE usage SET count = MAX(count - 1, 0) WHERE account_id = ? AND period = ? AND kind = ?").run(account.id, period(effectivePlan(account)), kind);
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
  throw httpError(402, planId === "free" ? `Get Snapfront Pro (${webbilling.priceLine()}) to publish your store and start selling.` : "Your plan covers fewer live stores. Upgrade to Pro to sell from up to 10 stores.",
    { upgrade: "pro" });
}

export function publicAccount(account, currentStoreId) {
  const planId = effectivePlan(account);
  const p = period(planId);
  const stores = storesOf(account.id);
  const plan = PLANS[planId];
  return {
    id: account.id, email: account.email, plan: planId, plan_name: webbilling.hasLifetime(account.id) ? "Pro Lifetime" : plan.name, lifetime: webbilling.hasLifetime(account.id),
    limits: plan, period: p,
    usage: Object.fromEntries(["photo", "product", "agent", "research", "studio", "post", "scene", "video"].map((k) => [k, used(account.id, p, k)])),
    stores: stores.map((s, i) => ({ id: s.id, store_name: s.store_name, store_slug: s.store_slug, live_allowed: i < plan.liveStores, current: s.id === currentStoreId })),
    can_add_store: stores.length < plan.stores,
    suppliers: suppliers.status(account.id),
  };
}

/* ---------- purchases ---------- */
/** Look again at what this account bought with Google Play, and store the plan it adds up to. */
export async function syncPlan(account) {
  if (playbilling.enabled()) await playbilling.refreshAccount(account.id, { olderThanMinutes: 10 });
  if (webbilling.enabled()) await webbilling.refreshAccount(account.id, { olderThanMinutes: 10 });
  return getAccount(account.id);
}

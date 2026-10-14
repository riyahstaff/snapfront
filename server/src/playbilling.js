// Snapfront's own plans, sold in the Android app through Google Play Billing.
//   snapfront_lifetime  one-time product, $299: everything (the Pro plan) for good
//   snapfront_pro       subscription, base plan "pro-monthly-69" at $69 a month: the Pro plan while it's paid up
//   snapfront_launch    one-time product, $29 (no longer sold; buyers keep the Launch plan)
//   snapfront_pro / "monthly" base plan at $14.99 (no longer sold; existing subscribers keep it)
// The phone sends each purchase token here; we ask Google about it with our service account,
// acknowledge it (Google refunds purchases that aren't acknowledged within 3 days), remember it,
// and set the account's plan from what Google says. The server never trusts the phone's word.
import crypto from "node:crypto";
import { config } from "./config.js";
import { db } from "./db.js";
import { httpError } from "./claude.js";

export const LAUNCH = "snapfront_launch";
export const PRO = "snapfront_pro";
export const LIFETIME = "snapfront_lifetime";
export const PRO_BASE_PLAN = "pro-monthly-69";
export const OLD_PRO_BASE_PLAN = "monthly";
export const PLAY_PRICES = { lifetime: process.env.PLAY_LIFETIME_PRICE || "299.00", pro: process.env.PLAY_PRO_PRICE || "69.00" };
const ONCE = new Set([LAUNCH, LIFETIME]);
// Partner commissions hear when a Play purchase starts or stops counting.
const listeners = [];
export const onPurchaseChange = (fn) => listeners.push(fn);
const invoiceListeners = [];
export const onInvoicePaid = (fn) => invoiceListeners.push(fn);
/** A paid month of the subscription: Google gives each renewal its own order id (GPA.…..0, ..1, …). */
function notifyMonth(token) {
  const r = db.prepare("SELECT * FROM play_purchases WHERE token = ?").get(token);
  if (!r || r.kind !== "sub" || r.status !== "active" || !r.order_id || r.test) return;
  for (const fn of invoiceListeners) {
    try { fn({ source: "play_order", ref: r.order_id, account_id: r.account_id, plan: "pro", amount_cents: Math.round(Number(PLAY_PRICES.pro) * 100) }); } catch (e) { console.warn("[play] month listener", e.message); }
  }
}
function notify(token, before) {
  const r = db.prepare("SELECT * FROM play_purchases WHERE token = ?").get(token);
  if (!r || r.status === before) return;
  for (const fn of listeners) {
    try { fn({ source: "play", ref: token, account_id: r.account_id, test: Boolean(r.test), plan: r.product_id === LIFETIME ? "lifetime" : r.product_id === PRO ? "pro" : "launch", status: r.status,
      amount_cents: r.product_id === LIFETIME ? Math.round(Number(PLAY_PRICES.lifetime) * 100) : null }); } catch (e) { console.warn("[play] listener", e.message); }
  }
}
const API = "https://androidpublisher.googleapis.com/androidpublisher/v3/applications";

db.exec(`CREATE TABLE IF NOT EXISTS play_purchases (
  token TEXT PRIMARY KEY,                 -- Google's purchase token
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  kind TEXT NOT NULL,                     -- once | sub
  status TEXT NOT NULL,                   -- active | ended | pending
  expires_at TEXT,                        -- subscriptions: paid up until
  order_id TEXT,
  test INTEGER NOT NULL DEFAULT 0,
  checked_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`);

let fetchImpl = (...a) => fetch(...a);
export function setPlayFetch(f) { fetchImpl = f; token = null; }   // tests

/* ---------- signing in to Google as the service account ---------- */
function serviceAccount() {
  if (!config.googlePlayServiceAccount) return null;
  try {
    const sa = JSON.parse(config.googlePlayServiceAccount);
    return sa.client_email && sa.private_key ? sa : null;
  } catch { return null; }
}
export const enabled = () => Boolean(serviceAccount());

let token = null;
async function accessToken() {
  if (token && token.expires > Date.now() + 60_000) return token.value;
  const sa = serviceAccount();
  if (!sa) throw httpError(503, "Purchases aren't switched on yet. Try again soon.");
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/androidpublisher", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 })}`;
  const sig = crypto.sign("RSA-SHA256", Buffer.from(unsigned), sa.private_key).toString("base64url");
  const res = await fetchImpl("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${sig}` }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.access_token) { console.error("[play] sign-in", res.status, JSON.stringify(body).slice(0, 300)); throw httpError(502, "Couldn't reach Google Play. Try again in a minute."); }
  token = { value: body.access_token, expires: Date.now() + (body.expires_in || 3600) * 1000 };
  return token.value;
}

/** Call the Play Developer API. Returns { status, body }. */
export async function play(method, path, body) {
  const res = await fetchImpl(`${API}/${config.playPackage}${path}`, {
    method, headers: { Authorization: `Bearer ${await accessToken()}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20_000),
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text.slice(0, 300) }; }
  return { status: res.status, body: json };
}

/* ---------- checking a purchase ---------- */
const SUB_OK = new Set(["SUBSCRIPTION_STATE_ACTIVE", "SUBSCRIPTION_STATE_IN_GRACE_PERIOD", "SUBSCRIPTION_STATE_CANCELED"]);   // canceled = won't renew, still paid up

/** Ask Google about one purchase and acknowledge it. Returns the row to store. */
async function inspect(productId, purchaseToken) {
  const t = encodeURIComponent(purchaseToken);
  if (ONCE.has(productId)) {
    const r = await play("GET", `/purchases/products/${productId}/tokens/${t}`);
    if (r.status === 404 || r.status === 400) throw httpError(400, "Google Play doesn't recognise that purchase.");
    if (r.status !== 200) { console.error("[play] product", r.status, JSON.stringify(r.body).slice(0, 300)); throw httpError(502, "Couldn't check your purchase with Google Play. Try again in a minute."); }
    const p = r.body;
    const status = p.purchaseState === 0 ? "active" : p.purchaseState === 2 ? "pending" : "ended";
    if (status === "active" && p.acknowledgementState === 0) {
      const a = await play("POST", `/purchases/products/${productId}/tokens/${t}:acknowledge`, {});
      if (a.status >= 300) console.warn("[play] acknowledge", productId, a.status, JSON.stringify(a.body).slice(0, 200));
    }
    return { product_id: productId, kind: "once", status, expires_at: null, order_id: p.orderId || null, test: p.purchaseType === 0 ? 1 : 0, owner: p.obfuscatedExternalAccountId || null };
  }
  if (productId === PRO) {
    const r = await play("GET", `/purchases/subscriptionsv2/tokens/${t}`);
    if (r.status === 404 || r.status === 400) throw httpError(400, "Google Play doesn't recognise that purchase.");
    if (r.status !== 200) { console.error("[play] subscription", r.status, JSON.stringify(r.body).slice(0, 300)); throw httpError(502, "Couldn't check your purchase with Google Play. Try again in a minute."); }
    const s = r.body;
    const line = (s.lineItems || []).find((l) => l.productId === PRO) || (s.lineItems || [])[0] || {};
    const expires = line.expiryTime ? new Date(line.expiryTime) : null;
    const paidUp = SUB_OK.has(s.subscriptionState) && expires && expires.getTime() > Date.now();
    const status = paidUp ? "active" : s.subscriptionState === "SUBSCRIPTION_STATE_PENDING" ? "pending" : "ended";
    if (paidUp && s.acknowledgementState === "ACKNOWLEDGEMENT_STATE_PENDING") {
      const a = await play("POST", `/purchases/subscriptions/${PRO}/tokens/${t}:acknowledge`, {});
      if (a.status >= 300) console.warn("[play] acknowledge pro", a.status, JSON.stringify(a.body).slice(0, 200));
    }
    return { product_id: PRO, kind: "sub", status, expires_at: expires ? expires.toISOString() : null, order_id: s.latestOrderId || line.latestSuccessfulOrderId || null,
      test: s.testPurchase ? 1 : 0, owner: s.externalAccountIdentifiers?.obfuscatedExternalAccountId || null };
  }
  throw httpError(400, "That isn't a Snapfront plan.");
}

/** The plan an account's purchases add up to. */
export function planFromPurchases(accountId, now = Date.now()) {
  const rows = db.prepare("SELECT * FROM play_purchases WHERE account_id = ? AND status = 'active'").all(accountId);
  if (rows.some((r) => r.kind === "sub" && r.expires_at && Date.parse(r.expires_at) > now)) return "pro";
  if (rows.some((r) => r.kind === "once" && r.product_id === LIFETIME)) return "pro";
  if (rows.some((r) => r.kind === "once")) return "launch";
  return "free";
}
export const hasLifetime = (accountId) => Boolean(db.prepare("SELECT 1 FROM play_purchases WHERE account_id = ? AND product_id = ? AND status = 'active'").get(accountId, LIFETIME));
// Other places a plan can be bought (the website's Stripe checkout) register here; the best plan wins.
const RANK = { free: 0, launch: 1, pro: 2 };
const planSources = [planFromPurchases];
export const addPlanSource = (fn) => { if (!planSources.includes(fn)) planSources.push(fn); };
export const bestPlan = (accountId) => planSources.map((f) => f(accountId)).reduce((a, b) => (RANK[b] > RANK[a] ? b : a), "free");
export function applyPlan(accountId) {
  const plan = bestPlan(accountId);
  db.prepare("UPDATE accounts SET plan = ?, plan_synced_at = datetime('now') WHERE id = ?").run(plan, accountId);
  return plan;
}

/**
 * The app bought something (or is restoring): check it with Google and give the account its plan.
 * A purchase belongs to the Snapfront account the app named when buying, so a token can't be
 * passed around to unlock other accounts.
 */
export async function recordPurchase(account, { productId, purchaseToken }) {
  const tok = String(purchaseToken || "");
  if (!tok || tok.length > 4096) throw httpError(400, "That purchase didn't come through. Try again.");
  const existing = db.prepare("SELECT account_id FROM play_purchases WHERE token = ?").get(tok);
  const row = await inspect(String(productId || ""), tok);
  const owner = row.owner || existing?.account_id;
  if ((owner && owner !== account.id) || (existing && existing.account_id !== account.id)) {
    throw httpError(409, "This purchase belongs to another Snapfront account. Sign in with your email in Settings to get it back.");
  }
  const before = db.prepare("SELECT status FROM play_purchases WHERE token = ?").get(tok)?.status;
  db.prepare(`INSERT INTO play_purchases (token, account_id, product_id, kind, status, expires_at, order_id, test) VALUES (?,?,?,?,?,?,?,?)
    ON CONFLICT(token) DO UPDATE SET status = excluded.status, expires_at = excluded.expires_at, order_id = COALESCE(excluded.order_id, order_id), checked_at = datetime('now')`)
    .run(tok, account.id, row.product_id, row.kind, row.status, row.expires_at, row.order_id, row.test);
  notify(tok, before);
  notifyMonth(tok);
  return { plan: applyPlan(account.id), status: row.status };
}

/** Look again at what an account bought (renewals, cancellations, refunds). */
export async function refreshAccount(accountId, { olderThanMinutes = 0 } = {}) {
  for (const r of db.prepare("SELECT * FROM play_purchases WHERE account_id = ? AND checked_at <= datetime('now', ?)").all(accountId, `-${olderThanMinutes} minutes`)) {
    try {
      const row = await inspect(r.product_id, r.token);
      db.prepare("UPDATE play_purchases SET status = ?, expires_at = ?, order_id = COALESCE(?, order_id), checked_at = datetime('now') WHERE token = ?").run(row.status, row.expires_at, row.order_id, r.token);
    } catch (e) {
      if (e.status === 400) db.prepare("UPDATE play_purchases SET status = 'ended', checked_at = datetime('now') WHERE token = ?").run(r.token);
      else throw e;
    }
    notify(r.token, r.status);
    notifyMonth(r.token);
  }
  return applyPlan(accountId);
}

/**
 * Background check: subscriptions whose paid-up date has passed (did it renew?) and, once a week,
 * everything else (refunds). Accounts on Pro drop back when Google says the subscription ended.
 */
export async function sweep() {
  if (!enabled()) return 0;
  const due = db.prepare(`SELECT DISTINCT account_id FROM play_purchases WHERE
      (kind = 'sub' AND status IN ('active','pending') AND (expires_at IS NULL OR julianday(expires_at) < julianday('now', '+1 hour')) AND checked_at < datetime('now', '-30 minutes'))
      OR (status IN ('active','pending') AND checked_at < datetime('now', '-7 days'))`).all();
  for (const { account_id } of due) await refreshAccount(account_id).catch((e) => console.warn("[play] sweep", account_id, e.message));
  return due.length;
}

/* ---------- creating the two plans in Play Console (run once) ---------- */
const usd = (dollars) => { const [u, c = "0"] = String(dollars).split("."); return { currencyCode: "USD", units: u, nanos: Number(c.padEnd(2, "0").slice(0, 2)) * 10_000_000 }; };

/** Prices for every country Google sells in, from one US price (Google's own conversion). */
async function prices(dollars) {
  const r = await play("POST", "/pricing:convertRegionPrices", { price: usd(dollars) });
  if (r.status !== 200) {
    // Google can refuse the conversion (e.g. before the payments profile is set up): sell in the US only.
    console.warn("[play] convertRegionPrices", r.status, JSON.stringify(r.body).slice(0, 200));
    return { regions: [{ regionCode: "US", price: usd(dollars) }], other: null, version: null, usOnly: true };
  }
  const regions = Object.values(r.body.convertedRegionPrices || {});
  const us = regions.find((x) => x.regionCode === "US");
  if (us) us.price = usd(dollars);     // keep the US price exactly as set
  return { regions, other: r.body.convertedOtherRegionsPrice, version: r.body.regionVersion?.version };
}

export async function createProducts(opts = {}) {
  const log = [];
  try { await makeProducts(opts, log); } catch (e) { log.push(["error", 0, e.message]); }
  return log;
}
async function makeProducts({ lifetimePrice = PLAY_PRICES.lifetime, proPrice = PLAY_PRICES.pro } = {}, log) {
  // Lifetime: a one-time product with one "buy" purchase option.
  const lp = await prices(lifetimePrice);
  if (lp.usOnly) log.push(["prices", 0, "Google refused the currency conversion, so these are US-only for now"]);
  const once = {
    packageName: config.playPackage, productId: LIFETIME,
    listings: [{ languageCode: "en-US", title: "Snapfront Lifetime", description: "Everything in Snapfront, for life. One payment, no monthly bill." }],
    taxAndComplianceSettings: {},
    purchaseOptions: [{
      purchaseOptionId: "buy", buyOption: { legacyCompatible: true },
      regionalPricingAndAvailabilityConfigs: lp.regions.map((x) => ({ regionCode: x.regionCode, price: x.price, availability: "AVAILABLE" })),
      ...(lp.other ? { newRegionsConfig: { usdPrice: lp.other.usdPrice, eurPrice: lp.other.eurPrice, availability: "AVAILABLE" } } : {}),
    }],
  };
  // Google documents this one path in lower case (get and activate use oneTimeProducts).
  let r = await play("PATCH", `/onetimeproducts/${LIFETIME}?allowMissing=true&updateMask=listings,purchaseOptions&regionsVersion.version=${encodeURIComponent(lp.version || "2022/02")}`, once);
  log.push(["lifetime product", r.status, r.status >= 300 ? r.body : "ok"]);
  if (r.status < 300) {
    r = await play("POST", `/oneTimeProducts/${LIFETIME}/purchaseOptions:batchUpdateStates`, { requests: [{ activatePurchaseOptionRequest: { packageName: config.playPackage, productId: LIFETIME, purchaseOptionId: "buy" } }] });
    log.push(["lifetime activate", r.status, r.status >= 300 ? r.body : "ok"]);
  }
  // Pro: a new $69 monthly base plan on the existing subscription (old subscribers keep theirs).
  const pp = await prices(proPrice);
  const existing = await play("GET", `/subscriptions/${PRO}`);
  const existing0 = existing.status === 200;   // a new subscription can make its only base plan legacy compatible
  const basePlan = {
    basePlanId: PRO_BASE_PLAN,
    // Only one base plan may be "legacy compatible" (the old $14.99 one is); the app buys with offer tokens.
    autoRenewingBasePlanType: { billingPeriodDuration: "P1M", gracePeriodDuration: "P7D", resubscribeState: "RESUBSCRIBE_STATE_ACTIVE", legacyCompatible: !existing0 },
    regionalConfigs: pp.regions.map((x) => ({ regionCode: x.regionCode, price: x.price, newSubscriberAvailability: true })),
    ...(pp.other ? { otherRegionsConfig: { usdPrice: pp.other.usdPrice, eurPrice: pp.other.eurPrice, newSubscriberAvailability: true } } : {}),
  };
  const listings = [{ languageCode: "en-US", title: "Snapfront Pro", description: "Everything in Snapfront, billed monthly: stores, AI products, email marketing, affiliates and more.",
    benefits: ["Up to 10 live stores", "Email marketing and affiliates", "AI product pages, photos and video"] }];
  const version = encodeURIComponent(pp.version || "2022/02");
  if (existing.status === 200) {
    const plans = (existing.body.basePlans || []).filter((b) => b.basePlanId !== PRO_BASE_PLAN);
    r = await play("PATCH", `/subscriptions/${PRO}?updateMask=basePlans,listings&regionsVersion.version=${version}`, { packageName: config.playPackage, productId: PRO, listings, basePlans: [...plans, basePlan] });
  } else {
    r = await play("POST", `/subscriptions?productId=${PRO}&regionsVersion.version=${version}`, { packageName: config.playPackage, productId: PRO, listings, basePlans: [basePlan] });
  }
  log.push(["pro subscription", r.status, r.status >= 300 ? r.body : "ok"]);
  if (r.status < 300) {
    r = await play("POST", `/subscriptions/${PRO}/basePlans/${PRO_BASE_PLAN}:activate`, {});
    log.push(["pro activate", r.status, r.status >= 300 ? r.body : "ok"]);
  }
  return log;
}
/** Stop selling the old $29 Launch and $14.99 Pro in older app versions (people who have them keep them). */
export async function retireOldProducts() {
  const log = [];
  let r = await play("POST", `/subscriptions/${PRO}/basePlans/${OLD_PRO_BASE_PLAN}:deactivate`, {});
  log.push(["old pro base plan", r.status, r.status >= 300 ? r.body : "ok"]);
  r = await play("POST", `/oneTimeProducts/${LAUNCH}/purchaseOptions:batchUpdateStates`, { requests: [{ deactivatePurchaseOptionRequest: { packageName: config.playPackage, productId: LAUNCH, purchaseOptionId: "buy" } }] });
  log.push(["launch", r.status, r.status >= 300 ? r.body : "ok"]);
  return log;
}

/**
 * Make sure both plans exist and are on sale. Runs in the background until it succeeds, because a new
 * service account can take a day or so before Google lets it create products.
 */
let productsReady = false;
export async function ensureProducts() {
  if (productsReady || !enabled()) return productsReady;
  const sub = await play("GET", `/subscriptions/${PRO}`);
  const once = await play("GET", `/oneTimeProducts/${LIFETIME}`);
  const subActive = sub.status === 200 && (sub.body.basePlans || []).some((b) => b.basePlanId === PRO_BASE_PLAN && b.state === "ACTIVE");
  const onceActive = once.status === 200 && (once.body.purchaseOptions || []).some((o) => o.state === "ACTIVE");
  if (subActive && onceActive) { productsReady = true; console.log("[play] Lifetime and Pro are on sale"); return true; }
  const log = await createProducts();
  const failed = log.filter((l) => l[1] >= 300 || l[0] === "error");
  if (failed.length) console.warn("[play] products not ready yet:", JSON.stringify(failed).slice(0, 400));
  else { productsReady = true; console.log("[play] created Lifetime and Pro:", JSON.stringify(log).slice(0, 300)); }
  return productsReady;
}

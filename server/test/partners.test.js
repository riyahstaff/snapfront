// Snapfront Partners: people share snapfront.app/r/CODE and earn when someone they sent buys
// Snapfront: 40% of Lifetime and $19 for each paid month of Monthly (website or Google Play).
// Paid once Snapfront has the money, re-checked for refunds and chargebacks, never paid twice.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-partners-"));
const { privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
Object.assign(process.env, {
  DATA_DIR: tmp, PUBLIC_URL: "https://snapfront.test", STORE_DOMAIN: "snapfront.test", STRIPE_SECRET_KEY: "sk_test_fake", ADMIN_TOKEN: "admin_secret",
  GOOGLE_PLAY_SERVICE_ACCOUNT: JSON.stringify({ client_email: "b@x.iam.gserviceaccount.com", private_key: privateKey.export({ type: "pkcs8", format: "pem" }) }),
});

const { app } = await import("../src/index.js");
const pay = await import("../src/payments.js");
const { db } = await import("../src/db.js");
const partners = await import("../src/partners.js");
const playbilling = await import("../src/playbilling.js");

const sessions = new Map(), intents = new Map(), transfers = [], invoices = new Map();
pay.setStripeClient({
  customers: { async create() { return { id: `cus_${sessions.size}` }; } },
  checkout: { sessions: {
    async create(p) { const id = `cs_${sessions.size + 1}`; const s = { id, url: `https://checkout.stripe.com/${id}`, status: "open", ...p }; sessions.set(id, s); return s; },
    async retrieve(id) { return sessions.get(id); },
  } },
  paymentIntents: { async retrieve(id) { return intents.get(id); } },
  subscriptions: { async retrieve(id) { return { id, status: "active", current_period_end: Math.floor(Date.now() / 1000) + 864e3 }; }, async update() { return {}; } },
  invoices: { async list({ subscription }) { return { data: invoices.get(subscription) || [] }; } },
});
let crashAfterTransfer = false;
partners.setTransfers({
  async list({ transfer_group }) { return { data: transfers.filter(([p]) => p.transfer_group === transfer_group).map(([, , t]) => t) }; },
  async create(p, o) { const t = { id: `tr_${transfers.length + 1}` }; transfers.push([p, o, t]); if (crashAfterTransfer) { crashAfterTransfer = false; throw new Error("network dropped after Stripe made the transfer"); } return t; },
});
const playTokens = new Map();
playbilling.setPlayFetch(async (url, opts = {}) => {
  const reply = (status, body) => ({ ok: status < 300, status, json: async () => body, text: async () => JSON.stringify(body) });
  if (url.includes("oauth2")) return reply(200, { access_token: "t", expires_in: 3600 });
  const sub = url.match(/subscriptionsv2\/tokens\/([^:]+)$/);
  if (sub) {
    const p = playTokens.get(decodeURIComponent(sub[1]));
    return p ? reply(200, { subscriptionState: "SUBSCRIPTION_STATE_ACTIVE", acknowledgementState: "ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED", latestOrderId: p.order,
      lineItems: [{ productId: "snapfront_pro", expiryTime: new Date(Date.now() + 30 * 864e5).toISOString() }], externalAccountIdentifiers: { obfuscatedExternalAccountId: p.owner } }) : reply(404, {});
  }
  const m = url.match(/products\/snapfront_lifetime\/tokens\/([^:]+)(:acknowledge)?$/);
  if (!m) return reply(404, {});
  if (m[2]) return reply(204, {});
  const p = playTokens.get(decodeURIComponent(m[1]));
  return p ? reply(200, { purchaseState: 0, acknowledgementState: 1, orderId: "GPA.9", obfuscatedExternalAccountId: p.owner }) : reply(404, {});
});

let server, base;
before(async () => { server = app.listen(0); await new Promise((r) => server.once("listening", r)); base = `http://127.0.0.1:${server.address().port}`; });
after(() => { server.close(); fs.rmSync(tmp, { recursive: true, force: true }); });
async function call(token, method, url, body, headers = {}) {
  const r = await fetch(base + url, { method, redirect: "manual", headers: { "Content-Type": "application/json", Host: "snapfront.test", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
  const text = await r.text();
  return { status: r.status, headers: r.headers, json: () => JSON.parse(text), text };
}
async function newAccount(email) {
  const r = (await call(null, "POST", "/api/sellers", {})).json();
  if (email) db.prepare("UPDATE accounts SET email = ? WHERE id = ?").run(email, r.account.id);
  return r;
}
async function buyLifetime(who, ref, amount = 29900, email = null) {
  const r = await call(who.token, "POST", "/api/billing/web/checkout", { plan: "lifetime", ...(ref ? { ref } : {}) });
  assert.equal(r.status, 200, r.text);
  const s = [...sessions.values()].at(-1);
  Object.assign(s, { status: "complete", payment_status: "paid", payment_intent: `pi_${s.id}`, amount_total: amount, ...(email ? { customer_details: { email } } : {}) });
  intents.set(`pi_${s.id}`, { id: `pi_${s.id}`, latest_charge: { refunded: false } });
  await call(who.token, "POST", "/api/billing/web/confirm", { session_id: s.id });
  return s;
}

let partner, code;
test("anyone with an email can join and get a share link; clicks are counted and remembered", async () => {
  partner = await newAccount();
  assert.equal((await call(partner.token, "POST", "/api/partners/join", { agree: true })).status, 400);   // no email yet
  db.prepare("UPDATE accounts SET email = 'maya@example.com' WHERE id = ?").run(partner.account.id);
  assert.equal((await call(partner.token, "POST", "/api/partners/join", {})).status, 400);               // must accept the rules
  const v = (await call(partner.token, "POST", "/api/partners/join", { agree: true, code: "maya!" })).json();
  assert.equal(v.joined, true);
  code = v.code;
  assert.equal(code, "MAYA");
  assert.equal(v.link, "https://snapfront.test/r/MAYA");
  assert.equal(v.program.rate, 40);
  assert.equal(v.program.per_sale, 119.6);
  assert.equal(v.program.monthly_per_month, 19);

  const click = await call(null, "GET", "/r/maya", null, { "User-Agent": "Mozilla/5.0" });
  assert.equal(click.status, 302);
  assert.match(click.headers.get("set-cookie"), /^sf_via=MAYA\.\d+; Max-Age=\d+; Domain=\.snapfront\.test; Path=\/;.*Secure; SameSite=Lax/);
  await call(null, "GET", "/?via=MAYA", null, { "User-Agent": "Mozilla/5.0" });       // same visitor, same day
  await call(null, "GET", "/r/MAYA", null, { "User-Agent": "facebookexternalhit/1.1" }); // link preview bot
  // A visitor who already came through a partner keeps the first one.
  const again = await call(null, "GET", "/r/MAYA", null, { "User-Agent": "Mozilla/5.0", Cookie: "sf_via=OTHER.1" });
  assert.equal(again.headers.get("set-cookie"), null);
  assert.equal((await call(partner.token, "GET", "/api/partners/me")).json().stats.clicks, 1);
});

test("a Lifetime sale through the link earns 40%, paid once Snapfront has the money, to the partner's Stripe", async () => {
  const buyer = await newAccount("ava@example.com");
  // The partner can't refer themselves; a stale link doesn't count.
  assert.equal((await call(partner.token, "POST", "/api/partners/claim", { code: "MAYA" })).json().claimed, false);
  assert.equal((await call(buyer.token, "POST", "/api/partners/claim", { code: `MAYA.${Date.now() - 90 * 864e5}` })).json().claimed, false);
  assert.equal((await call(buyer.token, "POST", "/api/partners/claim", { code: `MAYA.${Date.now()}` })).json().claimed, true);
  await buyLifetime(buyer);

  let me = (await call(partner.token, "GET", "/api/partners/me")).json();
  assert.equal(me.stats.signups, 1);
  assert.equal(me.stats.sales, 1);
  assert.equal(me.stats.pending, 119.6);
  // Held until the money settles: a few days for a website sale.
  const held = db.prepare("SELECT julianday(available_at) - julianday('now') AS d FROM partner_commissions").get().d;
  assert.ok(held > 3.9 && held < 4.1, String(held));
  assert.equal(me.payout.method, "none");   // no Stripe or PayPal yet

  // Nothing is released before the refund window ends.
  assert.equal(await partners.sweep(), 0);
  db.prepare("UPDATE partner_commissions SET available_at = datetime('now', '-1 minute')").run();
  // The partner connects Stripe on their store: paid automatically.
  db.prepare("UPDATE sellers SET stripe_account_id = 'acct_maya', stripe_ready = 1 WHERE account_id = ?").run(partner.account.id);
  // The network drops right after Stripe makes the transfer: the next run finds it instead of paying again.
  crashAfterTransfer = true;
  assert.equal(await partners.sweep(), 0);
  assert.equal(transfers.length, 1);
  assert.equal(await partners.sweep(), 1);
  assert.equal(transfers.length, 1, "never paid twice");
  assert.deepEqual([transfers[0][0].amount, transfers[0][0].destination], [11960, "acct_maya"]);
  assert.match(transfers[0][1].idempotencyKey, /^partner-commission-pcm_/);
  me = (await call(partner.token, "GET", "/api/partners/me")).json();
  assert.deepEqual([me.stats.pending, me.stats.ready, me.stats.paid], [0, 0, 119.6]);
  assert.equal(await partners.sweep(), 0);
  assert.equal(transfers.length, 1);
});

test("refunds and chargebacks earn nothing; PayPal partners are paid by hand from the admin page", async () => {
  const lee = await newAccount("lee@example.com");
  const v = (await call(lee.token, "POST", "/api/partners/join", { agree: true, paypal_email: "lee-pay@example.com" })).json();
  assert.equal(v.payout.method, "paypal");

  const b1 = await newAccount("b1@example.com");
  const s1 = await buyLifetime(b1, `${v.code}.${Date.now()}`);   // the code can also come with the checkout
  const b2 = await newAccount("b2@example.com");
  await buyLifetime(b2, v.code);
  assert.equal((await call(lee.token, "GET", "/api/partners/me")).json().stats.pending, 239.2);

  // One is charged back before Snapfront is paid: re-checked with Stripe when it comes due, so it never earns.
  intents.get(s1.payment_intent).latest_charge.disputed = true;
  db.prepare("UPDATE partner_commissions SET available_at = datetime('now', '-1 minute')").run();
  await partners.sweep();
  const me = (await call(lee.token, "GET", "/api/partners/me")).json();
  assert.deepEqual([me.stats.ready, me.stats.paid], [119.6, 0]);
  assert.deepEqual(me.commissions.map((c) => c.status).sort(), ["approved", "void"]);

  // Snapfront's admin sees what's owed and marks the PayPal payment.
  assert.equal((await call(null, "GET", "/api/admin/partners")).status, 401);
  const admin = (await call("admin_secret", "GET", "/api/admin/partners")).json();
  const row = admin.partners.find((p) => p.code === v.code);
  assert.deepEqual([row.ready, row.payout, row.paypal_email], [119.6, "paypal", "lee-pay@example.com"]);
  assert.equal((await call("admin_secret", "POST", `/api/admin/partners/${row.account_id}/paid`, { note: "PP-123" })).json().marked, 1);
  assert.equal((await call(lee.token, "GET", "/api/partners/me")).json().stats.paid, 119.6);
  assert.match((await call(null, "GET", "/admin/partners")).text, /Snapfront Partners/);
});

test("Google Play: Lifetime earns 40% (held until Google pays Snapfront); each paid month of Monthly earns $19", async () => {
  const buyer = await newAccount("phone@example.com");
  await call(buyer.token, "POST", "/api/partners/claim", { code: "MAYA" });
  playTokens.set("tok-life", { owner: buyer.account.id });
  const me = (await call(buyer.token, "POST", "/api/billing/google", { product_id: "snapfront_lifetime", purchase_token: "tok-life" })).json();
  assert.equal(me.account.plan, "pro");
  const c = db.prepare("SELECT *, julianday(available_at) - julianday('now') AS d FROM partner_commissions WHERE source = 'play'").get();
  assert.deepEqual([c.partner_id, c.sale_cents, c.commission_cents], [partner.account.id, 29900, 11960]);
  assert.ok(c.d > 44 && c.d < 46);

  // Monthly in the app: $19 for each order Google reports (each renewal has its own order id).
  const subber = await newAccount("sub@example.com");
  await call(subber.token, "POST", "/api/partners/claim", { code: "MAYA" });
  playTokens.set("tok-sub", { owner: subber.account.id, order: "GPA.11-22" });
  await call(subber.token, "POST", "/api/billing/google", { product_id: "snapfront_pro", purchase_token: "tok-sub" });
  playTokens.get("tok-sub").order = "GPA.11-22..0";
  await playbilling.refreshAccount(subber.account.id);
  await playbilling.refreshAccount(subber.account.id);
  assert.deepEqual(db.prepare("SELECT ref, commission_cents FROM partner_commissions WHERE buyer_account = ? ORDER BY ref").all(subber.account.id),
    [{ ref: "GPA.11-22", commission_cents: 1900 }, { ref: "GPA.11-22..0", commission_cents: 1900 }]);

  // Monthly on the website: $19 for every paid month, for as long as they pay.
  const monthly = await newAccount("m@example.com");
  await call(monthly.token, "POST", "/api/partners/claim", { code: "MAYA" });
  await call(monthly.token, "POST", "/api/billing/web/checkout", { plan: "pro" });
  const s = [...sessions.values()].at(-1);
  Object.assign(s, { status: "complete", payment_status: "paid", subscription: "sub_m" });
  invoices.set("sub_m", [{ id: "in_1", status: "paid", amount_paid: 6900 }]);
  assert.equal((await call(monthly.token, "POST", "/api/billing/web/confirm", { session_id: s.id })).json().account.plan, "pro");
  const months = () => db.prepare("SELECT ref, commission_cents FROM partner_commissions WHERE buyer_account = ? ORDER BY ref").all(monthly.account.id);
  assert.deepEqual(months(), [{ ref: "in_1", commission_cents: 1900 }]);
  // Month two is paid long after the referral window; it still earns. Checking again never doubles it.
  db.prepare("UPDATE accounts SET referred_at = datetime('now', '-200 days') WHERE id = ?").run(monthly.account.id);
  invoices.set("sub_m", [{ id: "in_2", status: "paid", amount_paid: 6900 }, { id: "in_1", status: "paid", amount_paid: 6900 }, { id: "in_0", status: "paid", amount_paid: 0 }]);
  db.prepare("UPDATE stripe_plan_purchases SET checked_at = datetime('now', '-1 hour')").run();
  await call(monthly.token, "POST", "/api/billing/sync");
  await call(monthly.token, "POST", "/api/billing/sync");
  assert.deepEqual(months(), [{ ref: "in_1", commission_cents: 1900 }, { ref: "in_2", commission_cents: 1900 }]);
  // A month discounted below $19 never pays out more than was paid.
  invoices.set("sub_m", [{ id: "in_3", status: "paid", amount_paid: 1000 }]);
  db.prepare("UPDATE stripe_plan_purchases SET checked_at = datetime('now', '-1 hour')").run();
  await call(monthly.token, "POST", "/api/billing/sync");
  assert.equal(months().find((m) => m.ref === "in_3").commission_cents, 1000);
});

test("no earning on your own purchase, from a suspended partner, or after the referral window", async () => {
  // A second account that pays with the partner's own email.
  const alt = await newAccount();
  await call(alt.token, "POST", "/api/partners/claim", { code: "MAYA" });
  await buyLifetime(alt, null, 29900, "MAYA@example.com");
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM partner_commissions WHERE buyer_account = ?").get(alt.account.id).n, 0);
  // Too late: referred 90 days before buying.
  const late = await newAccount("late@example.com");
  await call(late.token, "POST", "/api/partners/claim", { code: "MAYA" });
  db.prepare("UPDATE accounts SET referred_at = datetime('now', '-90 days') WHERE id = ?").run(late.account.id);
  await buyLifetime(late);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM partner_commissions WHERE buyer_account = ?").get(late.account.id).n, 0);
  // A discount code at checkout: 40% of what was actually paid.
  const promo = await newAccount("promo@example.com");
  await call(promo.token, "POST", "/api/partners/claim", { code: "MAYA" });
  await buyLifetime(promo, null, 19900);
  assert.equal(db.prepare("SELECT commission_cents FROM partner_commissions WHERE buyer_account = ?").get(promo.account.id).commission_cents, 7960);
  // Suspended: no new commissions and nothing paid out.
  assert.equal((await call("admin_secret", "POST", `/api/admin/partners/${partner.account.id}/status`, { status: "suspended" })).status, 200);
  const later = await newAccount("later@example.com");
  await call(later.token, "POST", "/api/partners/claim", { code: "MAYA" });
  assert.equal(db.prepare("SELECT referred_by FROM accounts WHERE id = ?").get(later.account.id).referred_by, null);
  db.prepare("UPDATE partner_commissions SET available_at = datetime('now', '-1 minute') WHERE status = 'pending'").run();
  const before = transfers.length;
  await partners.sweep();
  assert.equal(transfers.length, before);
  // Checkout says all sales are final.
  assert.match([...sessions.values()].at(-1).custom_text.submit.message, /All sales are final/);
});

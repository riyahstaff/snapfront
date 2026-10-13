// Snapfront Partners: people share snapfront.app/r/CODE and earn a commission when someone they
// sent buys Snapfront Lifetime (website or Google Play). Held for refunds, then paid.
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

const sessions = new Map(), intents = new Map(), transfers = [];
pay.setStripeClient({
  customers: { async create() { return { id: `cus_${sessions.size}` }; } },
  checkout: { sessions: {
    async create(p) { const id = `cs_${sessions.size + 1}`; const s = { id, url: `https://checkout.stripe.com/${id}`, status: "open", ...p }; sessions.set(id, s); return s; },
    async retrieve(id) { return sessions.get(id); },
  } },
  paymentIntents: { async retrieve(id) { return intents.get(id); } },
  subscriptions: { async retrieve(id) { return { id, status: "active", current_period_end: Math.floor(Date.now() / 1000) + 864e3 }; }, async update() { return {}; } },
});
partners.setTransfer(async (p, o) => { transfers.push([p, o]); return { id: `tr_${transfers.length}` }; });
const playTokens = new Map();
playbilling.setPlayFetch(async (url, opts = {}) => {
  const reply = (status, body) => ({ ok: status < 300, status, json: async () => body, text: async () => JSON.stringify(body) });
  if (url.includes("oauth2")) return reply(200, { access_token: "t", expires_in: 3600 });
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
async function buyLifetime(who, ref) {
  const r = await call(who.token, "POST", "/api/billing/web/checkout", { plan: "lifetime", ...(ref ? { ref } : {}) });
  assert.equal(r.status, 200, r.text);
  const s = [...sessions.values()].at(-1);
  Object.assign(s, { status: "complete", payment_status: "paid", payment_intent: `pi_${s.id}`, amount_total: 29900 });
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
  assert.equal(v.program.rate, 50);
  assert.equal(v.program.per_sale, 149.5);

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

test("a Lifetime sale through the link earns 50%, held for refunds, then paid to the partner's Stripe", async () => {
  const buyer = await newAccount("ava@example.com");
  // The partner can't refer themselves; a stale link doesn't count.
  assert.equal((await call(partner.token, "POST", "/api/partners/claim", { code: "MAYA" })).json().claimed, false);
  assert.equal((await call(buyer.token, "POST", "/api/partners/claim", { code: `MAYA.${Date.now() - 90 * 864e5}` })).json().claimed, false);
  assert.equal((await call(buyer.token, "POST", "/api/partners/claim", { code: `MAYA.${Date.now()}` })).json().claimed, true);
  await buyLifetime(buyer);

  let me = (await call(partner.token, "GET", "/api/partners/me")).json();
  assert.equal(me.stats.signups, 1);
  assert.equal(me.stats.sales, 1);
  assert.equal(me.stats.pending, 149.5);
  assert.equal(me.payout.method, "none");   // no Stripe or PayPal yet

  // Nothing is released before the refund window ends.
  assert.equal(await partners.sweep(), 0);
  db.prepare("UPDATE partner_commissions SET available_at = datetime('now', '-1 minute')").run();
  // The partner connects Stripe on their store: paid automatically.
  db.prepare("UPDATE sellers SET stripe_account_id = 'acct_maya', stripe_ready = 1 WHERE account_id = ?").run(partner.account.id);
  assert.equal(await partners.sweep(), 1);
  assert.deepEqual([transfers[0][0].amount, transfers[0][0].destination], [14950, "acct_maya"]);
  assert.ok(transfers[0][1].idempotencyKey);
  me = (await call(partner.token, "GET", "/api/partners/me")).json();
  assert.deepEqual([me.stats.pending, me.stats.ready, me.stats.paid], [0, 0, 149.5]);
  assert.equal(await partners.sweep(), 0);   // never paid twice
});

test("refunded sales earn nothing; PayPal partners are paid by hand from the admin page", async () => {
  const lee = await newAccount("lee@example.com");
  const v = (await call(lee.token, "POST", "/api/partners/join", { agree: true, paypal_email: "lee-pay@example.com" })).json();
  assert.equal(v.payout.method, "paypal");

  const b1 = await newAccount("b1@example.com");
  const s1 = await buyLifetime(b1, `${v.code}.${Date.now()}`);   // the code can also come with the checkout
  const b2 = await newAccount("b2@example.com");
  await buyLifetime(b2, v.code);
  assert.equal((await call(lee.token, "GET", "/api/partners/me")).json().stats.pending, 299);

  // One is refunded: the next check voids its commission.
  intents.get(s1.payment_intent).latest_charge.refunded = true;
  db.prepare("UPDATE stripe_plan_purchases SET checked_at = datetime('now', '-1 hour')").run();
  await call(b1.token, "POST", "/api/billing/sync");
  db.prepare("UPDATE partner_commissions SET available_at = datetime('now', '-1 minute')").run();
  await partners.sweep();
  const me = (await call(lee.token, "GET", "/api/partners/me")).json();
  assert.deepEqual([me.stats.ready, me.stats.paid], [149.5, 0]);
  assert.deepEqual(me.commissions.map((c) => c.status).sort(), ["approved", "void"]);

  // Snapfront's admin sees what's owed and marks the PayPal payment.
  assert.equal((await call(null, "GET", "/api/admin/partners")).status, 401);
  const admin = (await call("admin_secret", "GET", "/api/admin/partners")).json();
  const row = admin.partners.find((p) => p.code === v.code);
  assert.deepEqual([row.ready, row.payout, row.paypal_email], [149.5, "paypal", "lee-pay@example.com"]);
  assert.equal((await call("admin_secret", "POST", `/api/admin/partners/${row.account_id}/paid`, { note: "PP-123" })).json().marked, 1);
  assert.equal((await call(lee.token, "GET", "/api/partners/me")).json().stats.paid, 149.5);
  assert.match((await call(null, "GET", "/admin/partners")).text, /Snapfront Partners/);
});

test("Lifetime bought in the Android app counts too; monthly plans don't earn by default", async () => {
  const buyer = await newAccount("phone@example.com");
  await call(buyer.token, "POST", "/api/partners/claim", { code: "MAYA" });
  playTokens.set("tok-life", { owner: buyer.account.id });
  const me = (await call(buyer.token, "POST", "/api/billing/google", { product_id: "snapfront_lifetime", purchase_token: "tok-life" })).json();
  assert.equal(me.account.plan, "pro");
  const c = db.prepare("SELECT * FROM partner_commissions WHERE source = 'play'").get();
  assert.deepEqual([c.partner_id, c.sale_cents, c.commission_cents], [partner.account.id, 29900, 14950]);

  const monthly = await newAccount("m@example.com");
  await call(monthly.token, "POST", "/api/partners/claim", { code: "MAYA" });
  await call(monthly.token, "POST", "/api/billing/web/checkout", { plan: "pro" });
  const s = [...sessions.values()].at(-1);
  Object.assign(s, { status: "complete", payment_status: "paid", subscription: "sub_m" });
  assert.equal((await call(monthly.token, "POST", "/api/billing/web/confirm", { session_id: s.id })).json().account.plan, "pro");
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM partner_commissions WHERE buyer_account = ?").get(monthly.account.id).n, 0);
});

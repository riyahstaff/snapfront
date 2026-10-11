// Pricing: free trial limits, Launch and Pro allowances, store limits, purchases via RevenueCat,
// and email sign-in that carries stores and purchases to a new phone.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-plans-"));
process.env.DATA_DIR = tmp;
process.env.PUBLIC_URL = "http://localhost";
process.env.STRIPE_SECRET_KEY = "";
process.env.REVENUECAT_SECRET_KEY = "sk_test_rc";
process.env.REVENUECAT_WEBHOOK_AUTH = "Bearer hook-secret";
process.env.SNAPFRONT_FAKE_AI = JSON.stringify({
  title: "Mug", tagline: "A mug.", description: "One.\n\nTwo.", bullets: ["12 oz"], suggested_price: 18, category: "Home", tags: ["mug"],
  faq: [], alt_text: "A mug", seo_description: "A mug.", content: { chapters: [{ heading: "Start", paragraphs: ["Go."], tip: "Tip." }] },
});

const { app } = await import("../src/index.js");
const plans = await import("../src/plans.js");
const auth = await import("../src/auth.js");
const { db } = await import("../src/db.js");

// RevenueCat stand-in: entitlements per app user id
const entitlements = new Map();
plans.setRevenueCatFetch(async (url, opts) => {
  assert.equal(opts.headers.Authorization, "Bearer sk_test_rc");
  const id = decodeURIComponent(url.split("/subscribers/")[1]);
  return { ok: true, json: async () => ({ subscriber: { entitlements: entitlements.get(id) || {} } }) };
});
const sent = [];
auth.setEmailSender(async (to, code) => { sent.push({ to, code }); });

let server, base;
before(async () => { server = app.listen(0); await new Promise((r) => server.once("listening", r)); base = `http://127.0.0.1:${server.address().port}`; });
after(() => { server.close(); fs.rmSync(tmp, { recursive: true, force: true }); });
const call = (token, method, url, body, headers = {}) => fetch(base + url, {
  method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
  body: body ? JSON.stringify(body) : undefined,
});
const json = async (r, status) => { const j = r.status === 204 ? null : await r.json(); assert.equal(r.status, status, JSON.stringify(j)); return j; };
const PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC".padEnd(200, "A");
const photo = (t) => call(t, "POST", "/api/ai/product-from-photo", { imageBase64: PNG, mediaType: "image/png" });

let A; // { token, account }
test("free plan: a taste of the AI, one store, no publishing", async () => {
  A = await json(await call(null, "POST", "/api/sellers", { store_name: "Mugs" }), 201);
  assert.equal(A.account.plan, "free");
  assert.equal(A.account.limits.photo, 3);

  for (let i = 0; i < 3; i++) await json(await photo(A.token), 200);
  const over = await json(await photo(A.token), 402);
  assert.equal(over.upgrade, "launch");

  const me = await json(await call(A.token, "GET", "/api/me"), 200);
  assert.equal(me.account.usage.photo, 3);
  assert.equal(me.account.period, "trial");

  const more = await json(await call(A.token, "POST", "/api/stores", { store_name: "Second" }), 402);
  assert.equal(more.upgrade, "pro");

  const p = await json(await call(A.token, "POST", "/api/products", { title: "Mug", price: 18 }), 201);
  assert.equal((await json(await call(A.token, "POST", `/api/products/${p.id}/publish`), 402)).upgrade, "launch");
  // Stripe setup starts after upgrading
  assert.equal((await json(await call(A.token, "POST", "/api/stripe/onboard"), 402)).upgrade, "launch");
});

test("buying Launch through RevenueCat unlocks publishing and resets to monthly allowances", async () => {
  entitlements.set(A.account.id, { launch: { expires_date: null } });
  const me = await json(await call(A.token, "POST", "/api/billing/sync"), 200);
  assert.equal(me.account.plan, "launch");
  assert.equal(me.account.usage.photo, 0, "monthly allowance starts fresh");
  assert.match(me.account.period, /^\d{4}-\d{2}$/);
  assert.equal(me.account.stores[0].live_allowed, true);
  await json(await photo(A.token), 200);
  // Launch still means one store
  assert.equal((await json(await call(A.token, "POST", "/api/stores", {}), 402)).upgrade, "pro");
  // The assistant is Pro only
  assert.equal((await json(await call(A.token, "POST", "/api/agent/runs", { messages: [{ role: "user", content: "hi" }] }), 402)).upgrade, "pro");
});

test("Pro: up to 10 stores, picked per request; extra stores stop selling if Pro lapses", async () => {
  // The webhook (with its shared secret) is how renewals and upgrades arrive
  await json(await call(null, "POST", "/api/revenuecat/webhook", { event: { type: "INITIAL_PURCHASE", app_user_id: A.account.id } }), 401);
  entitlements.set(A.account.id, { launch: { expires_date: null }, pro: { expires_date: new Date(Date.now() + 864e5).toISOString() } });
  await json(await call(null, "POST", "/api/revenuecat/webhook", { event: { type: "INITIAL_PURCHASE", app_user_id: A.account.id } }, { Authorization: "Bearer hook-secret" }), 200);
  let me = await json(await call(A.token, "GET", "/api/me"), 200);
  assert.equal(me.account.plan, "pro");

  const ids = [me.id];
  for (let i = 2; i <= 10; i++) ids.push((await json(await call(A.token, "POST", "/api/stores", { store_name: `Shop ${i}` }), 201)).id);
  await json(await call(A.token, "POST", "/api/stores", {}), 402);

  // X-Store picks which store a request works on
  const s5 = await json(await call(A.token, "GET", "/api/me", null, { "X-Store": ids[4] }), 200);
  assert.equal(s5.store_name, "Shop 5");
  await json(await call(A.token, "POST", "/api/products", { title: "Shop 5 thing", price: 5 }, { "X-Store": ids[4] }), 201);
  assert.equal((await json(await call(A.token, "GET", "/api/products", null, { "X-Store": ids[4] }), 200)).length, 1);
  assert.equal((await json(await call(A.token, "GET", "/api/products"), 200)).length, 1, "first store keeps its own products");

  // Pro expires: back to Launch, only the first store may sell
  entitlements.set(A.account.id, { launch: { expires_date: null }, pro: { expires_date: new Date(Date.now() - 1000).toISOString() } });
  await json(await call(null, "POST", "/api/revenuecat/webhook", { event: { type: "EXPIRATION", app_user_id: A.account.id } }, { Authorization: "Bearer hook-secret" }), 200);
  me = await json(await call(A.token, "GET", "/api/me"), 200);
  assert.equal(me.account.plan, "launch");
  assert.deepEqual(me.account.stores.map((s) => s.live_allowed), [true, ...Array(9).fill(false)]);
  const s5row = db.prepare("SELECT * FROM sellers WHERE id = ?").get(ids[4]);
  assert.equal(plans.storeCanSell(s5row), false);

  await json(await call(A.token, "DELETE", `/api/stores/${ids[9]}`), 204);
  assert.equal((await json(await call(A.token, "GET", "/api/me"), 200)).account.stores.length, 9);
});

test("comp plans beat purchases, and allowances are enforced inside the agent too", async () => {
  const B = await json(await call(null, "POST", "/api/sellers", { store_name: "Comped" }), 201);
  db.prepare("UPDATE accounts SET comp_plan = 'pro' WHERE id = ?").run(B.account.id);
  const me = await json(await call(B.token, "POST", "/api/billing/sync"), 200);  // RevenueCat says nothing was bought
  assert.equal(me.account.plan, "pro");
  db.prepare("INSERT INTO usage (account_id, period, kind, count) VALUES (?,?,?,?)").run(B.account.id, new Date().toISOString().slice(0, 7), "product", 50);
  await assert.rejects(() => plans.withAllowance(plans.getAccount(B.account.id), "product", async () => "x"), (e) => e.status === 402);
});

test("email sign-in links an email, then carries the account to a new phone", async () => {
  // Phone 1 links its email
  await json(await call(A.token, "POST", "/api/auth/email/start", { email: "Seller@Example.com" }), 200);
  assert.equal(sent.at(-1).to, "seller@example.com");
  await json(await call(A.token, "POST", "/api/auth/email/verify", { email: "seller@example.com", code: "000000" === sent.at(-1).code ? "111111" : "000000" }), 400);
  const linked = await json(await call(A.token, "POST", "/api/auth/email/verify", { email: "seller@example.com", code: sent.at(-1).code }), 200);
  assert.equal(linked.status, "linked");

  // Phone 2 starts fresh, then signs in with the same email
  const P2 = await json(await call(null, "POST", "/api/sellers", {}), 201);
  await json(await call(P2.token, "POST", "/api/auth/email/start", { email: "seller@example.com" }), 200);
  const sw = await json(await call(P2.token, "POST", "/api/auth/email/verify", { email: "seller@example.com", code: sent.at(-1).code }), 200);
  assert.equal(sw.status, "switched");
  const me = await json(await call(sw.token, "GET", "/api/me"), 200);
  assert.equal(me.account.id, A.account.id);
  assert.equal(me.account.stores.length, 9);
  // The empty starter account from phone 2 is cleaned up
  assert.equal(plans.getAccount(P2.account.id), undefined);
  // Codes can't be reused
  await json(await call(sw.token, "POST", "/api/auth/email/verify", { email: "seller@example.com", code: sent.at(-1).code }), 400);
});

test("deleting the account removes every store", async () => {
  await json(await call(A.token, "DELETE", "/api/me"), 204);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM sellers WHERE account_id = ?").get(A.account.id).n, 0);
  await json(await call(A.token, "GET", "/api/me"), 401);
});

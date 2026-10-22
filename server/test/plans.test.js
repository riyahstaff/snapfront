// Pricing: free trial limits, Launch and Pro allowances, store limits, purchases checked with Google Play,
// and email sign-in that carries stores and purchases to a new phone.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-plans-"));
process.env.ADMIN_TOKEN = "admin_test_secret";
process.env.DATA_DIR = tmp;
process.env.PUBLIC_URL = "http://localhost";
process.env.STRIPE_SECRET_KEY = "";
const { privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
process.env.GOOGLE_PLAY_SERVICE_ACCOUNT = Buffer.from(JSON.stringify({ client_email: "billing@snapfront.iam.gserviceaccount.com",
  private_key: privateKey.export({ type: "pkcs8", format: "pem" }) })).toString("base64");   // base64 form, as it may be pasted
process.env.SNAPFRONT_FAKE_AI = JSON.stringify({
  title: "Mug", tagline: "A mug.", description: "One.\n\nTwo.", bullets: ["12 oz"], suggested_price: 18, category: "Home", tags: ["mug"],
  faq: [], alt_text: "A mug", seo_description: "A mug.", content: { chapters: [{ heading: "Start", paragraphs: ["Go."], tip: "Tip." }] },
});

const { app } = await import("../src/index.js");
const plans = await import("../src/plans.js");
const auth = await import("../src/auth.js");
const { db } = await import("../src/db.js");

const playbilling = await import("../src/playbilling.js");

// Google Play stand-in: purchase tokens and what Google says about each.
const purchases = new Map();   // token -> { kind: "once" | "sub", ...fields }
const acks = [];
playbilling.setPlayFetch(async (url, opts = {}) => {
  const reply = (status, body) => ({ ok: status < 300, status, json: async () => body, text: async () => JSON.stringify(body) });
  if (url === "https://oauth2.googleapis.com/token") {
    const jwt = new URLSearchParams(opts.body).get("assertion");
    assert.equal(JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString()).iss, "billing@snapfront.iam.gserviceaccount.com");
    return reply(200, { access_token: "ya29.test", expires_in: 3600 });
  }
  assert.equal(opts.headers.Authorization, "Bearer ya29.test");
  const m = url.match(/applications\/com\.sidebanc\.snapfront\/purchases\/(products\/snapfront_launch|subscriptionsv2|subscriptions\/snapfront_pro)\/tokens\/([^:]+)(:acknowledge)?$/);
  if (!m) return reply(404, { error: "unexpected " + url });
  const tok = decodeURIComponent(m[2]), p = purchases.get(tok);
  if (m[3]) { acks.push(tok); if (p) p.ack = true; return reply(204, {}); }
  if (!p) return reply(404, { error: { message: "not found" } });
  if (p.kind === "once") return reply(200, { purchaseState: p.state ?? 0, acknowledgementState: p.ack ? 1 : 0, orderId: "GPA.1", obfuscatedExternalAccountId: p.owner });
  return reply(200, { subscriptionState: p.state || "SUBSCRIPTION_STATE_ACTIVE", acknowledgementState: p.ack ? "ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED" : "ACKNOWLEDGEMENT_STATE_PENDING",
    lineItems: [{ productId: "snapfront_pro", expiryTime: p.expiry }], externalAccountIdentifiers: { obfuscatedExternalAccountId: p.owner } });
});
const buy = (t, product_id, purchase_token) => call(t, "POST", "/api/billing/google", { product_id, purchase_token });
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
  assert.equal(over.upgrade, "pro");

  const me = await json(await call(A.token, "GET", "/api/me"), 200);
  assert.equal(me.account.usage.photo, 3);
  assert.equal(me.account.period, "trial");

  const more = await json(await call(A.token, "POST", "/api/stores", { store_name: "Second" }), 402);
  assert.equal(more.upgrade, "pro");

  const p = await json(await call(A.token, "POST", "/api/products", { title: "Mug", price: 18 }), 201);
  assert.equal((await json(await call(A.token, "POST", `/api/products/${p.id}/publish`), 402)).upgrade, "pro");
  // Stripe setup starts after upgrading
  assert.equal((await json(await call(A.token, "POST", "/api/stripe/onboard"), 402)).upgrade, "pro");
});

test("buying Launch through Google Play unlocks publishing and resets to monthly allowances", async () => {
  // A token Google doesn't know, and one bought for a different Snapfront account, unlock nothing.
  await json(await buy(A.token, "snapfront_launch", "tok-unknown"), 400);
  purchases.set("tok-someone-else", { kind: "once", owner: "acc_other" });
  await json(await buy(A.token, "snapfront_launch", "tok-someone-else"), 409);
  await json(await buy(A.token, "snapfront_gold", "tok-launch"), 400);

  purchases.set("tok-launch", { kind: "once", owner: A.account.id });
  const me = await json(await buy(A.token, "snapfront_launch", "tok-launch"), 200);
  assert.equal(me.account.plan, "launch");
  assert.ok(acks.includes("tok-launch"), "the server acknowledges the purchase so Google doesn't refund it");
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
  purchases.set("tok-pro", { kind: "sub", owner: A.account.id, expiry: new Date(Date.now() + 30 * 864e5).toISOString() });
  let me = await json(await buy(A.token, "snapfront_pro", "tok-pro"), 200);
  assert.equal(me.account.plan, "pro");
  assert.ok(acks.includes("tok-pro"));

  const ids = [me.id];
  for (let i = 2; i <= 10; i++) ids.push((await json(await call(A.token, "POST", "/api/stores", { store_name: `Shop ${i}` }), 201)).id);
  await json(await call(A.token, "POST", "/api/stores", {}), 402);

  // X-Store picks which store a request works on
  const s5 = await json(await call(A.token, "GET", "/api/me", null, { "X-Store": ids[4] }), 200);
  assert.equal(s5.store_name, "Shop 5");
  await json(await call(A.token, "POST", "/api/products", { title: "Shop 5 thing", price: 5 }, { "X-Store": ids[4] }), 201);
  assert.equal((await json(await call(A.token, "GET", "/api/products", null, { "X-Store": ids[4] }), 200)).length, 1);
  assert.equal((await json(await call(A.token, "GET", "/api/products"), 200)).length, 1, "first store keeps its own products");

  // Pro isn't renewed: the background check notices once its paid-up date passes; back to Launch,
  // and only the first store may sell
  purchases.get("tok-pro").state = "SUBSCRIPTION_STATE_EXPIRED";
  purchases.get("tok-pro").expiry = new Date(Date.now() - 1000).toISOString();
  db.prepare("UPDATE play_purchases SET expires_at = ?, checked_at = datetime('now', '-1 hour') WHERE token = 'tok-pro'").run(new Date(Date.now() - 1000).toISOString());
  assert.equal(await playbilling.sweep(), 1);
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
  const me = await json(await call(B.token, "POST", "/api/billing/sync"), 200);  // nothing bought on Google Play
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

test("owner tool: grant a free plan by store address; refused without the admin token", async () => {
  const c = await json(await call(null, "POST", "/api/sellers", { store_name: "Comped" }), 201);
  const slug = c.seller.store_slug;
  assert.equal((await call(null, "POST", "/api/admin/comp", { store_slug: slug, plan: "pro" })).status, 401);
  assert.equal((await call("wrong", "POST", "/api/admin/comp", { store_slug: slug, plan: "pro" })).status, 401);
  const r = await json(await call("admin_test_secret", "POST", "/api/admin/comp", { store_slug: slug, plan: "pro" }), 200);
  assert.equal(r.plan, "pro");
  assert.equal((await json(await call(c.token, "GET", "/api/me"), 200)).account.plan, "pro");
  assert.equal((await json(await call("admin_test_secret", "POST", "/api/admin/comp", { store_slug: slug, plan: "none" }), 200)).plan, "free");
  assert.equal((await call("admin_test_secret", "POST", "/api/admin/comp", { store_slug: "no-such-store", plan: "pro" })).status, 404);
});

test("an account can be deleted from the web with an emailed code", async () => {
  const C = await json(await call(null, "POST", "/api/sellers", { store_name: "Web Delete" }), 201);
  db.prepare("UPDATE accounts SET email = 'leaving@example.com' WHERE id = ?").run(C.account.id);
  const codes = [];
  auth.setDeleteSender(async (to, code) => { codes.push({ to, code }); });
  const form = (body) => fetch(`${base}/delete-account`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(body) });
  assert.match(await (await fetch(`${base}/delete-account`)).text(), /Delete my account/);
  // An unknown email gets the same answer and no email.
  assert.match(await (await form({ step: "start", email: "nobody@example.com" })).text(), /Check your email/);
  assert.equal(codes.length, 0);
  assert.match(await (await form({ step: "start", email: "Leaving@Example.com" })).text(), /Check your email/);
  assert.equal(codes.at(-1).to, "leaving@example.com");
  const bad = await form({ step: "confirm", email: "leaving@example.com", code: codes.at(-1).code === "000000" ? "111111" : "000000" });
  assert.equal(bad.status, 400);
  assert.ok(plans.getAccount(C.account.id), "a wrong code deletes nothing");
  const ok = await form({ step: "confirm", email: "leaving@example.com", code: codes.at(-1).code });
  assert.match(await ok.text(), /Your account is deleted/);
  assert.equal(plans.getAccount(C.account.id), undefined);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM sellers WHERE account_id = ?").get(C.account.id).n, 0);
});

test("an unknown device token gets a 401 the app can recognise and recover from", async () => {
  for (const token of ["not-a-real-token", ""]) {
    const r = await call(token, "POST", "/api/auth/email/start", { email: "someone@example.com" });
    assert.equal(r.status, 401);
    assert.equal((await r.json()).code, "session_unknown");
  }
});

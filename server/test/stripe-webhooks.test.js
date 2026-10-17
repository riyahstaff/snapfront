// Stripe webhooks with real signatures: Snapfront's own endpoint and the Connect endpoint (sellers'
// stores) each have their own signing secret, and both are accepted. A safety net finishes paid
// orders and seller connections that a missed webhook left behind.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-webhooks-"));
Object.assign(process.env, { DATA_DIR: tmp, PUBLIC_URL: "https://hooks.test", STRIPE_SECRET_KEY: "sk_test_fake", STRIPE_WEBHOOK_SECRET: "whsec_platform_secret, whsec_connect_secret" });

const { app, reconcileStripe } = await import("../src/index.js");
const pay = await import("../src/payments.js");
const { db } = await import("../src/db.js");
const Stripe = (await import("stripe")).default;
const real = new Stripe("sk_test_fake");

const sessions = new Map();
const accounts = new Map();
pay.setStripeClient({
  webhooks: real.webhooks,   // real signature checks
  checkout: { sessions: { async retrieve(id) { return sessions.get(id); } } },
  accounts: { async retrieve(id) { return accounts.get(id) || { id, charges_enabled: false }; } },
});

let server, base, seller;
before(async () => { server = app.listen(0); await new Promise((r) => server.once("listening", r)); base = `http://127.0.0.1:${server.address().port}`; });
after(() => { server.close(); fs.rmSync(tmp, { recursive: true, force: true }); });
const send = (event, secret) => {
  const payload = JSON.stringify(event);
  const header = real.webhooks.generateTestHeaderString({ payload, secret });
  return fetch(`${base}/api/stripe/webhook`, { method: "POST", headers: { "Content-Type": "application/json", "stripe-signature": header }, body: payload });
};

test("set up a store with a connected Stripe account", async () => {
  const r = await (await fetch(`${base}/api/sellers`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ store_name: "Hook Shop" }) })).json();
  seller = r.seller;
  db.prepare("UPDATE sellers SET stripe_account_id = 'acct_seller1', stripe_ready = 0 WHERE id = ?").run(seller.id);
});

test("events signed with either endpoint's secret are accepted; others are refused", async () => {
  const event = { id: "evt_1", type: "account.updated", data: { object: { id: "acct_seller1", charges_enabled: true } } };
  assert.equal((await send(event, "whsec_connect_secret")).status, 200);
  assert.equal(db.prepare("SELECT stripe_ready FROM sellers WHERE id = ?").get(seller.id).stripe_ready, 1);
  assert.equal((await send({ ...event, id: "evt_2" }, "whsec_platform_secret")).status, 200);
  assert.equal((await send({ ...event, id: "evt_3" }, "whsec_someone_else")).status, 400);
  const unsigned = await fetch(`${base}/api/stripe/webhook`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(event) });
  assert.equal(unsigned.status, 400);
});

test("the safety net finishes a paid order and a seller connection that a missed webhook left behind", async () => {
  db.prepare("UPDATE sellers SET stripe_ready = 0 WHERE id = ?").run(seller.id);
  accounts.set("acct_seller1", { id: "acct_seller1", charges_enabled: true });
  const items = JSON.stringify([{ product_id: "p1", title: "Mug", qty: 1, price_cents: 2000, kind: "physical" }]);
  for (const [id, cs] of [["ord_paid", "cs_paid"], ["ord_gone", "cs_gone"], ["ord_wait", "cs_wait"]])
    db.prepare("INSERT INTO orders (id, seller_id, status, items, subtotal_cents, total_cents, checkout_session_id) VALUES (?,?,?,?,?,?,?)").run(id, seller.id, "pending", items, 2000, 2000, cs);
  sessions.set("cs_paid", { id: "cs_paid", status: "complete", payment_status: "paid", metadata: { snapfront_order: "ord_paid" }, customer_details: { email: "buyer@example.com" },
    amount_subtotal: 2000, amount_total: 2000, total_details: { amount_discount: 0, amount_shipping: 0, amount_tax: 0 } });
  sessions.set("cs_gone", { id: "cs_gone", status: "expired", payment_status: "unpaid" });
  sessions.set("cs_wait", { id: "cs_wait", status: "open", payment_status: "unpaid" });
  const r = await reconcileStripe();
  assert.deepEqual(r, { orders: 1, sellers: 1 });
  const status = (id) => db.prepare("SELECT status FROM orders WHERE id = ?").get(id).status;
  assert.deepEqual([status("ord_paid"), status("ord_gone"), status("ord_wait")], ["paid", "canceled", "pending"]);
  assert.equal(db.prepare("SELECT email FROM orders WHERE id = 'ord_paid'").get().email, "buyer@example.com");
  assert.equal(db.prepare("SELECT stripe_ready FROM sellers WHERE id = ?").get(seller.id).stripe_ready, 1);
  // Running it again changes nothing.
  assert.deepEqual(await reconcileStripe(), { orders: 0, sellers: 0 });
});

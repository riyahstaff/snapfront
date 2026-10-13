// Sales & profit: profit and loss from real Stripe fees, refunds, item costs and expenses; the sales
// list; customers with tags; CSV exports through signed links; the Stripe balance.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-biz-"));
process.env.DATA_DIR = tmp;
process.env.PUBLIC_URL = "http://localhost";
process.env.STRIPE_SECRET_KEY = "sk_test_fake";
process.env.GOOGLE_PLAY_SERVICE_ACCOUNT = "";

const { app } = await import("../src/index.js");
const { db } = await import("../src/db.js");
const business = await import("../src/business.js");

// Stripe stand-in for the seller's connected account.
const sessions = new Map();
const accountsAsked = [];
business.setBusinessStripe(() => ({
  checkout: { sessions: { async retrieve(id, params, opts) { accountsAsked.push(opts?.stripeAccount); return sessions.get(id); } } },
  balance: { async retrieve(_p, opts) { accountsAsked.push(opts.stripeAccount); return { available: [{ currency: "usd", amount: 12345 }], pending: [{ currency: "usd", amount: 6789 }] }; } },
  payouts: { async list() { return { data: [{ id: "po_1", amount: 50000, status: "paid", arrival_date: 1760000000 }] }; } },
}));

let server, base, token, seller;
before(async () => {
  server = app.listen(0); await new Promise((r) => server.once("listening", r)); base = `http://127.0.0.1:${server.address().port}`;
  const r = await (await fetch(`${base}/api/sellers`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })).json();
  token = r.token; seller = r.seller;
  db.prepare("UPDATE sellers SET stripe_account_id = 'acct_seller' WHERE id = ?").run(seller.id);
});
after(() => { server.close(); fs.rmSync(tmp, { recursive: true, force: true }); });
const call = async (method, url, body) => {
  const res = await fetch(base + url, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  return { status: res.status, json: () => JSON.parse(text), text };
};

const today = new Date().toISOString().slice(0, 10);
const daysAgo = (n) => new Date(Date.now() - n * 864e5).toISOString().replace("T", " ").slice(0, 19);
function product(id, title, price, cost) {
  db.prepare("INSERT INTO products (id, seller_id, slug, title, kind, price_cents, status, cost_cents) VALUES (?,?,?,?, 'physical', ?, 'live', ?)").run(id, seller.id, id, title, price, cost);
}
function order(id, { email, name, items, shipping = 0, tax = 0, discount = 0, paidDaysAgo = 1, fee = null, refunded = 0 }) {
  const subtotal = items.reduce((s, l) => s + l.unit_cents * l.qty, 0);
  db.prepare(`INSERT INTO orders (id, seller_id, status, items, subtotal_cents, discount_cents, shipping_cents, tax_cents, total_cents, email, customer_name, checkout_session_id, paid_at)
    VALUES (?,?,'paid',?,?,?,?,?,?,?,?,?,?)`).run(id, seller.id, JSON.stringify(items), subtotal, discount, shipping, tax, subtotal - discount + shipping + tax, email, name, `cs_${id}`, daysAgo(paidDaysAgo));
  sessions.set(`cs_${id}`, { id: `cs_${id}`, payment_intent: { latest_charge: { amount: subtotal - discount + shipping + tax, amount_refunded: refunded, balance_transaction: { fee } } } });
  business.snapshotCost(id);
}

test("profit and loss uses Stripe's real fees, refunds, item costs and expenses", async () => {
  product("prd_mug", "Moon Mug", 2400, 800);
  product("prd_print", "Moon Print", 1500, null);   // no cost entered
  order("ord_a", { email: "Ava@Example.com", name: "Ava Lee", items: [{ product_id: "prd_mug", title: "Moon Mug", qty: 2, unit_cents: 2400 }], shipping: 500, tax: 400, fee: 187 });
  order("ord_b", { email: "ava@example.com", name: "Ava Lee", items: [{ product_id: "prd_print", title: "Moon Print", qty: 1, unit_cents: 1500 }], fee: 74, paidDaysAgo: 3 });
  order("ord_c", { email: "ben@example.com", name: "Ben Ortiz", items: [{ product_id: "prd_mug", title: "Moon Mug", qty: 1, unit_cents: 2400 }], fee: 100, refunded: 2400, paidDaysAgo: 2 });
  order("ord_old", { email: "old@example.com", name: "Old Buyer", items: [{ product_id: "prd_mug", title: "Moon Mug", qty: 1, unit_cents: 2400 }], fee: 100, paidDaysAgo: 60 });
  // Item cost is fixed at payment: a later cost change doesn't rewrite past orders.
  db.prepare("UPDATE products SET cost_cents = 1000 WHERE id = 'prd_mug'").run();
  assert.equal((await call("POST", "/api/business/expenses", { label: "Instagram ads", amount: 20, category: "ads", day: today })).status, 201);

  const s = (await call("GET", "/api/business/summary?range=30")).json();
  // Revenue: (4800 + 500) + 1500 + 2400 = 9200. Refunds 2400. Fees 187+74+100 = 361. Costs 1600 + 0 + 800 = 2400. Expenses 2000.
  assert.equal(s.pnl.revenue, 92);
  assert.equal(s.pnl.tax_collected, 4);
  assert.equal(s.pnl.refunds, 24);
  assert.equal(s.pnl.stripe_fees, 3.61);
  assert.equal(s.pnl.product_costs, 24);
  assert.equal(s.pnl.expenses, 20);
  assert.equal(s.pnl.net_profit, 92 - 24 - 3.61 - 24 - 20);
  assert.equal(s.totals.orders, 3);
  assert.equal(s.totals.customers, 2);
  assert.equal(s.totals.returning_customers, 0);
  assert.equal(s.missing_costs, 1);
  const mug = s.products.find((p) => p.id === "prd_mug");
  assert.equal(mug.units, 3);
  assert.ok(s.series.points.length >= 30 && s.series.bucket === "day");
  assert.equal(s.series.points.reduce((t, p) => t + p.orders, 0), 3);

  const all = (await call("GET", "/api/business/summary?range=all")).json();
  assert.equal(all.totals.orders, 4);
});

test("Stripe fees and refunds are read from the seller's own Stripe account", async () => {
  order("ord_sync", { email: "cy@example.com", name: "Cy", items: [{ product_id: "prd_mug", title: "Moon Mug", qty: 1, unit_cents: 2400 }] });
  db.prepare("UPDATE orders SET fee_cents = NULL, money_synced_at = NULL WHERE id = 'ord_sync'").run();
  sessions.get("cs_ord_sync").payment_intent.latest_charge = { amount: 2400, amount_refunded: 1000, balance_transaction: { fee: 99 } };
  accountsAsked.length = 0;
  assert.ok(await business.syncDue(seller.id) >= 1);
  assert.ok(accountsAsked.every((a) => a === "acct_seller"));
  const o = db.prepare("SELECT fee_cents, refunded_cents FROM orders WHERE id = 'ord_sync'").get();
  assert.deepEqual(o, { fee_cents: 99, refunded_cents: 1000 });
  const sales = (await call("GET", "/api/business/sales?range=30&q=cy@")).json();
  assert.equal(sales.total, 1);
  assert.equal(sales.orders[0].status, "partly refunded");
  assert.equal(sales.orders[0].fee, 0.99);
});

test("sales list searches and filters; customers group by email with tags and notes", async () => {
  const refunded = (await call("GET", "/api/business/sales?range=30&status=refunded")).json();
  assert.deepEqual(refunded.orders.map((o) => o.id).sort(), ["ord_c", "ord_sync"]);
  assert.equal((await call("GET", "/api/business/sales?range=30&q=moon%20print")).json().orders[0].id, "ord_b");

  const c = (await call("GET", "/api/business/customers?sort=spent")).json();
  const ava = c.customers.find((x) => x.email === "ava@example.com");
  assert.equal(ava.orders, 2);
  assert.equal(ava.spent, 53 + 15);          // tax isn't the seller's money
  assert.equal(ava.repeat, true);
  assert.equal(c.stats.repeat, 1);
  const tagged = (await call("PATCH", "/api/business/customers/ava%40example.com", { tags: ["VIP", " VIP ", "wholesale"], note: "Loves mugs" })).json();
  assert.deepEqual(tagged.tags, ["VIP", "wholesale"]);
  assert.equal(tagged.orders_list.length, 2);
  assert.deepEqual((await call("GET", "/api/business/customers?tag=VIP")).json().customers.map((x) => x.email), ["ava@example.com"]);
  assert.equal((await call("PATCH", "/api/business/customers/nobody%40example.com", { tags: ["x"] })).status, 404);
});

test("CSV exports download through short-lived signed links, safely escaped", async () => {
  db.prepare("UPDATE orders SET customer_name = '=HYPERLINK(\"evil\")' WHERE id = 'ord_old'").run();
  const { url } = (await call("POST", "/api/business/export", { kind: "sales", range: "all" })).json();
  const res = await fetch(url.replace("http://localhost", base));
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-disposition"), /attachment; filename="?sales_all_time_to_/);
  const body = await res.text();
  assert.match(body, /^Date,Order,Customer,Email,Items,Total/);
  assert.match(body, /"'=HYPERLINK\(""evil""\)"/);      // formulas neutralised
  assert.equal(body.trim().split("\r\n").length, 1 + 5);
  const cust = await (await fetch((await call("POST", "/api/business/export", { kind: "customers" })).json().url.replace("http://localhost", base))).text();
  assert.match(cust, /ava@example.com,2,68,/);
  const bad = new URL(url); bad.searchParams.set("s", "sel_other");
  assert.equal((await fetch(bad.toString().replace("http://localhost", base))).status, 403);
});

test("expenses can be listed and removed; the Stripe balance and payouts come from the seller's account", async () => {
  const list = (await call("GET", "/api/business/expenses?range=30")).json();
  assert.equal(list.expenses.length, 1);
  assert.equal((await call("POST", "/api/business/expenses", { label: "", amount: 5 })).status, 400);
  assert.equal((await call("DELETE", `/api/business/expenses/${list.expenses[0].id}`)).status, 204);
  assert.equal((await call("GET", "/api/business/expenses")).json().expenses.length, 0);

  const b = (await call("GET", "/api/business/balance")).json();
  assert.deepEqual([b.available, b.pending, b.payouts[0].amount], [123.45, 67.89, 500]);

  // Sellers can enter their own cost per item.
  assert.equal((await call("PATCH", "/api/products/prd_print", { cost: 3.25 })).json().cost, 3.25);
  assert.equal((await call("PATCH", "/api/products/prd_print", { cost: -1 })).status, 400);
});

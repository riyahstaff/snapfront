// Cart, variants, stock, discount codes, shipping, tax and the checkout → webhook → order flow,
// with a recording stand-in for Stripe.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-commerce-"));
process.env.DATA_DIR = tmp;
process.env.PUBLIC_URL = "https://shop.example";
process.env.STRIPE_SECRET_KEY = "sk_test_fake";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_fake";
process.env.PLATFORM_FEE_PERCENT = "5";

const { app } = await import("../src/index.js");
const pay = await import("../src/payments.js");
const { db } = await import("../src/db.js");

const calls = [];
const sessions = new Map();
pay.setStripeClient({
  coupons: { async create(p, o) { calls.push(["coupon", p, o]); return { id: "co_1" }; } },
  checkout: { sessions: {
    async create(p, o) { const id = `cs_test_${sessions.size + 1}`; sessions.set(id, { p, o }); calls.push(["session", p, o]); return { id, url: `https://checkout.stripe.com/c/${id}` }; },
    async retrieve(id) { return { id, payment_status: "unpaid" }; },
  } },
  accounts: { async retrieve() { return { charges_enabled: true }; } },
  webhooks: { constructEvent(raw) { return JSON.parse(raw.toString()); } },
});

let server, base, token, slug;
before(async () => { server = app.listen(0); await new Promise((r) => server.once("listening", r)); base = `http://127.0.0.1:${server.address().port}`; });
after(() => { server.close(); fs.rmSync(tmp, { recursive: true, force: true }); });
const call = (method, url, body, auth = true) => fetch(base + url, {
  method, headers: { "Content-Type": "application/json", ...(auth && token ? { Authorization: `Bearer ${token}` } : {}) },
  body: body ? JSON.stringify(body) : undefined,
});
const json = async (r, status) => { const j = r.status === 204 ? null : await r.json(); assert.equal(r.status, status, JSON.stringify(j)); return j; };

let tee, guide;
test("seller sets up variants, stock, shipping, tax and a code", async () => {
  const reg = await json(await call("POST", "/api/sellers", { store_name: "Loop Studio" }), 201);
  token = reg.token; slug = reg.seller.store_slug;
  db.prepare("UPDATE sellers SET stripe_account_id='acct_123', stripe_ready=1 WHERE id=?").run(reg.seller.id);

  tee = await json(await call("POST", "/api/products", { title: "Loop Tee", kind: "physical", price: 30, option_name: "Size",
    variants: [{ name: "S", inventory: 2 }, { name: "M", inventory: 0 }, { name: "XL", price: 34 }] }), 201);
  assert.equal(tee.variants.length, 3);
  assert.equal(tee.variants[2].price, 34);
  assert.equal(tee.in_stock, true);
  await json(await call("POST", `/api/products/${tee.id}/publish`), 200);

  guide = await json(await call("POST", "/api/products", { title: "Loop Guide", kind: "digital", price: 10, delivery_url: "https://files.example/guide.pdf" }), 201);
  await json(await call("POST", `/api/products/${guide.id}/publish`), 200);

  const me = await json(await call("PATCH", "/api/me", { shipping_flat: 5, free_shipping_over: 100, ship_countries: ["us", "CA", "nope"], tax_enabled: true }), 200);
  assert.equal(me.shipping_flat, 5);
  assert.deepEqual(me.ship_countries, ["US", "CA"]);
  assert.equal(me.tax_enabled, true);

  const d = await json(await call("POST", "/api/discounts", { code: "save 10!", kind: "percent", percent: 10 }), 201);
  assert.equal(d.code, "SAVE10");
  await json(await call("POST", "/api/discounts", { code: "SAVE10", kind: "amount", amount: 5 }), 409);

  // Keeping a variant's id keeps it; leaving one out removes it
  const edited = await json(await call("PATCH", `/api/products/${tee.id}`, { variants: [{ id: tee.variants[0].id, name: "S", inventory: 2 }, { id: tee.variants[1].id, name: "M", inventory: 0 }, { id: tee.variants[2].id, name: "XL", price: 34 }] }), 200);
  assert.deepEqual(edited.variants.map((v) => v.id), tee.variants.map((v) => v.id));

  const page = await (await fetch(`${base}/s/${slug}/${tee.slug}`)).text();
  assert.match(page, /name="variant"/);
  assert.match(page, /M \(sold out\)/);
  assert.match(page, /Add to cart/);
  assert.equal((await fetch(`${base}/s/${slug}/cart`)).status, 200);
});

test("quote prices the cart server-side and enforces stock and codes", async () => {
  const [S, M, XL] = tee.variants;
  let q = await json(await call("POST", `/s/${slug}/cart/quote`, { items: [{ product_id: tee.id, variant_id: XL.id, qty: 2 }, { product_id: guide.id, qty: 5 }], code: "save10" }, false), 200);
  assert.equal(q.subtotal, 78);          // 2 × 34 + 1 × 10 (digital is always qty 1)
  assert.equal(q.discount, 7.8);
  assert.equal(q.shipping, 5);
  assert.equal(q.total_before_tax, 75.2);
  assert.ok(q.tax_note);

  await json(await call("POST", `/s/${slug}/cart/quote`, { items: [{ product_id: tee.id, variant_id: M.id, qty: 1 }] }, false), 409);
  await json(await call("POST", `/s/${slug}/cart/quote`, { items: [{ product_id: tee.id, variant_id: S.id, qty: 3 }] }, false), 409);
  await json(await call("POST", `/s/${slug}/cart/quote`, { items: [{ product_id: tee.id, qty: 1 }] }, false), 400); // must pick a size
  await json(await call("POST", `/s/${slug}/cart/quote`, { items: [{ product_id: guide.id }], code: "NOPE" }, false), 400);

  q = await json(await call("POST", `/s/${slug}/cart/quote`, { items: [{ product_id: tee.id, variant_id: XL.id, qty: 3 }] }, false), 200);
  assert.equal(q.shipping, 0);           // $102 is over the free-shipping line
});

test("checkout creates a Stripe session; the webhook marks the order paid and updates stock and code uses", async () => {
  const [S] = tee.variants;
  const r = await json(await call("POST", `/s/${slug}/checkout`, { items: [{ product_id: tee.id, variant_id: S.id, qty: 2 }, { product_id: guide.id }], code: "SAVE10" }, false), 200);
  assert.match(r.url, /^https:\/\/checkout\.stripe\.com\//);

  const [, params, opts] = calls.find((c) => c[0] === "session");
  assert.equal(opts.stripeAccount, "acct_123");
  assert.equal(params.line_items.length, 2);
  assert.equal(params.line_items[0].price_data.unit_amount, 3000);
  assert.equal(params.line_items[0].quantity, 2);
  assert.equal(params.line_items[0].price_data.product_data.tax_code, "txcd_99999999");
  assert.equal(params.line_items[1].price_data.product_data.tax_code, "txcd_10302000");
  assert.deepEqual(params.automatic_tax, { enabled: true });
  assert.deepEqual(params.shipping_address_collection.allowed_countries, ["US", "CA"]);
  assert.equal(params.shipping_options[0].shipping_rate_data.fixed_amount.amount, 500);
  assert.deepEqual(params.discounts, [{ coupon: "co_1" }]);
  assert.equal(calls.find((c) => c[0] === "coupon")[1].amount_off, 700); // 10% of $70
  assert.equal(params.payment_intent_data.application_fee_amount, 315); // 5% of $63
  assert.match(params.success_url, /\/thanks\?o=ord_.+&session_id=\{CHECKOUT_SESSION_ID\}/);

  // Pending orders aren't shown to the seller
  assert.equal((await json(await call("GET", "/api/orders"), 200)).length, 0);

  const event = { type: "checkout.session.completed", account: "acct_123", data: { object: {
    object: "checkout.session", id: "cs_test_1", payment_status: "paid", metadata: { snapfront_order: r.order_id },
    customer_details: { email: "buyer@example.com", name: "Bea Buyer" },
    collected_information: { shipping_details: { name: "Bea Buyer", address: { line1: "1 Main St", city: "Austin", country: "US" } } },
    amount_subtotal: 7000, amount_total: 6830, total_details: { amount_discount: 700, amount_shipping: 500, amount_tax: 30 },
  } } };
  for (let i = 0; i < 2; i++) { // delivered twice: must only count once
    const w = await fetch(`${base}/api/stripe/webhook`, { method: "POST", headers: { "Content-Type": "application/json", "stripe-signature": "t=1" }, body: JSON.stringify(event) });
    assert.equal(w.status, 200);
  }

  const orders = await json(await call("GET", "/api/orders"), 200);
  assert.equal(orders.length, 1);
  const o = orders[0];
  assert.equal(o.status, "paid");
  assert.equal(o.total, 68.3);
  assert.equal(o.tax, 0.3);
  assert.equal(o.email, "buyer@example.com");
  assert.equal(o.shipping_address.city, "Austin");
  assert.equal(o.items.length, 2);

  const products = await json(await call("GET", "/api/products"), 200);
  assert.equal(products.find((p) => p.id === tee.id).variants[0].inventory, 0); // 2 - 2
  assert.equal((await json(await call("GET", "/api/discounts"), 200))[0].uses, 1);

  const thanks = await (await fetch(`${base}/thanks?o=${o.id}`)).text();
  assert.match(thanks, /Thank you!/);
  assert.match(thanks, /Download Loop Guide/);
  const dl = thanks.match(/href="https:\/\/shop\.example(\/d\/[^"]+)"/)[1];
  const d = await fetch(base + dl, { redirect: "manual" });
  assert.equal(d.status, 302);
  assert.equal(d.headers.get("location"), "https://files.example/guide.pdf");

  const f = await json(await call("POST", `/api/orders/${o.id}/fulfill`), 200);
  assert.equal(f.status, "fulfilled");
  await json(await call("POST", `/api/orders/${o.id}/fulfill`), 409);

  // S is now sold out
  await json(await call("POST", `/s/${slug}/cart/quote`, { items: [{ product_id: tee.id, variant_id: S.id, qty: 1 }] }, false), 409);
});

test("a failed bank payment cancels the pending order", async () => {
  const XL = tee.variants[2];
  const r = await json(await call("POST", `/s/${slug}/checkout`, { items: [{ product_id: tee.id, variant_id: XL.id, qty: 1 }] }, false), 200);
  await fetch(`${base}/api/stripe/webhook`, { method: "POST", headers: { "Content-Type": "application/json", "stripe-signature": "t=1" },
    body: JSON.stringify({ type: "checkout.session.async_payment_failed", data: { object: { object: "checkout.session", id: "cs_x", metadata: { snapfront_order: r.order_id } } } }) });
  const page = await (await fetch(`${base}/thanks?o=${r.order_id}`)).text();
  assert.match(page, /Payment didn't go through/);
});

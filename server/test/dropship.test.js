// Dropshipping with CJ: browse, import (AI copy + market price), connect the seller's CJ key,
// paid orders go to CJ, tracking comes back. CJ, SerpApi, Stripe and the image CDN are stand-ins.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-dropship-"));
process.env.DATA_DIR = tmp;
process.env.PUBLIC_URL = "https://shop.example";
process.env.STRIPE_SECRET_KEY = "sk_test_fake";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_fake";
process.env.SERPAPI_KEY = "serp_test";
process.env.CJ_API_KEY = "CJ_PLATFORM_KEY_123";
process.env.SNAPFRONT_FAKE_AI = JSON.stringify({
  title: "Cloud Soft Pet Bed", tagline: "A calm place to curl up", description: "Plush and round.\n\nMachine washable.",
  bullets: ["Raised rim", "Non-slip base"], suggested_price: 40, category: "Pet beds", tags: ["pets"], faq: [{ q: "Washable?", a: "Yes." }],
  alt_text: "Round grey pet bed", seo_description: "Plush round pet bed",
});

const { app } = await import("../src/index.js");
const cj = await import("../src/cj.js");
const dropship = await import("../src/dropship.js");
const research = await import("../src/research.js");
const pay = await import("../src/payments.js");
const { db } = await import("../src/db.js");

/* ---------- fake CJ ---------- */
const cjCalls = [];
const ok = (data) => ({ ok: true, status: 200, json: async () => ({ code: 200, result: true, message: "Success", data }) });
let orderStatus = "UNPAID", track = null;
cj.setCjFetch(async (url, init) => {
  const u = new URL(url);
  const p = u.pathname.replace("/api2.0/v1", "");
  const body = init?.body ? JSON.parse(init.body) : null;
  cjCalls.push({ path: p, query: Object.fromEntries(u.searchParams), body, token: init.headers["CJ-Access-Token"] });
  if (p === "/authentication/getAccessToken") {
    if (body.apiKey === "bad-key-000000") return { ok: true, status: 200, json: async () => ({ code: 1601000, result: false, message: "User not find", data: null }) };
    return ok({ accessToken: `tok-${body.apiKey}`, accessTokenExpiryDate: "2027-04-01T00:00:00+08:00", refreshToken: "r", refreshTokenExpiryDate: "2027-04-01T00:00:00+08:00" });
  }
  if (p === "/product/listV2") return ok({ totalRecords: 1, totalPages: 1, content: [{ productList: [{ id: "PID-1", nameEn: "Plush Round Pet Bed Donut", bigImage: "https://cf.cjdropshipping.com/bed.jpg", sellPrice: "7.20 -- 9.80", sku: "CJBED" }] }] });
  if (p === "/product/query") return ok({
    pid: "PID-1", productNameEn: "Plush Round Pet Bed Donut", productSku: "CJBED", bigImage: "https://cf.cjdropshipping.com/bed.jpg",
    productImageSet: ["https://cf.cjdropshipping.com/bed.jpg", "https://cf.cjdropshipping.com/bed2.jpg"], productKeyEn: "Size",
    description: "<p>Soft <b>plush</b> bed</p><script>x</script>", sellPrice: "7.20-9.80",
    variants: [
      { vid: "VID-S", variantKey: "S", variantSku: "CJBED-S", variantSellPrice: 7.2 },
      { vid: "VID-L", variantKey: "L", variantSku: "CJBED-L", variantSellPrice: 9.8 },
    ],
  });
  if (p === "/logistic/freightCalculate") return ok(body.startCountryCode === "CN" ? [
    { logisticName: "CJPacket Ordinary", logisticPrice: 4.1, logisticAging: "7-12" },
    { logisticName: "USPS+", logisticPrice: 6.5, logisticAging: "5-8" },
  ] : []);
  if (p === "/shopping/order/createOrderV2") return ok({ orderId: "CJ-ORDER-9", orderNumber: body.orderNumber, orderStatus: "CREATED" });
  if (p === "/shopping/order/getOrderDetail") return ok({ orderId: "CJ-ORDER-9", orderStatus, trackNumber: track, logisticName: "CJPacket Ordinary" });
  throw new Error(`unexpected CJ call ${p}`);
});
// CJ's CDN really does label JPEG files as image/png; the server must go by the bytes.
const JPEG = new Uint8Array(500).fill(7); JPEG.set([0xff, 0xd8, 0xff, 0xe0]);
dropship.setImageFetch(async () => ({ ok: true, headers: new Headers({ "content-type": "image/png" }), arrayBuffer: async () => JPEG.buffer }));
research.setLensFetch(async () => ({ ok: true, json: async () => ({ visual_matches: [
  { title: "Donut pet bed", link: "https://www.amazon.com/dp/1", source: "Amazon.com", price: { extracted_value: 32.99, currency: "$" } },
  { title: "Calming dog bed", link: "https://www.walmart.com/ip/2", source: "Walmart", price: { extracted_value: 29.88, currency: "$" } },
  { title: "Renewed calming bed", link: "https://www.walmart.com/ip/3", source: "Walmart", price: { extracted_value: 12, currency: "$" } },
] }) }));
pay.setStripeClient({
  checkout: { sessions: { async create(p) { return { id: "cs_test_ds", url: "https://checkout.stripe.com/c/x", p }; } } },
  accounts: { async retrieve() { return { charges_enabled: true }; } },
  webhooks: { constructEvent(raw) { return JSON.parse(raw.toString()); } },
});

let server, base, token, account;
before(async () => { server = app.listen(0); await new Promise((r) => server.once("listening", r)); base = `http://127.0.0.1:${server.address().port}`; });
after(() => { server.close(); fs.rmSync(tmp, { recursive: true, force: true }); });
const call = (method, url, body) => fetch(base + url, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: body ? JSON.stringify(body) : undefined });
const json = async (r, status) => { const j = r.status === 204 ? null : await r.json(); assert.equal(r.status, status, JSON.stringify(j)); return j; };

test("image type comes from the file, not the label", async () => {
  const { sniffImage } = await import("../src/claude.js");
  assert.equal(sniffImage(Buffer.from(JPEG)), "image/jpeg");
  assert.equal(sniffImage(Buffer.from(JPEG).toString("base64")), "image/jpeg");
  assert.equal(sniffImage(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0])), "image/png");
  assert.equal(sniffImage(Buffer.from("hello")), null);
});

test("research: refurbished listings don't set the price", () => {
  const m = research.parseLens({ visual_matches: [
    { title: "AirPods Pro Refurbished", link: "https://bestbuy.com/a", source: "Best Buy", price: { extracted_value: 165, currency: "$" } },
    { title: "AirPods Pro 2", link: "https://target.com/b", source: "Target", price: { extracted_value: 249, currency: "$" } },
  ] });
  const { summary } = research.suggest(m, 50);
  assert.equal(summary.lowest_major, 249);
  assert.equal(summary.used_skipped, 1);
});

let product;
test("search and preview use Snapfront's CJ key, one token, with shipping to the US", async () => {
  const reg = await json(await call("POST", "/api/sellers", { store_name: "Paw Place" }), 201);
  token = reg.token; account = reg.account;
  db.prepare("UPDATE sellers SET stripe_account_id='acct_9', stripe_ready=1 WHERE id=?").run(reg.seller.id);
  db.prepare("UPDATE accounts SET plan = 'launch' WHERE id = ?").run(account.id);

  const s = await json(await call("GET", "/api/catalog/search?q=pet%20bed"), 200);
  assert.equal(s.products.length, 1);
  assert.deepEqual(s.products[0], { pid: "PID-1", title: "Plush Round Pet Bed Donut", image: "https://cf.cjdropshipping.com/bed.jpg", cost: 7.2, sku: "CJBED" });
  const listCall = cjCalls.find((c) => c.path === "/product/listV2");
  assert.equal(listCall.query.keyWord, "pet bed");
  assert.equal(listCall.token, "tok-CJ_PLATFORM_KEY_123");

  const d = await json(await call("GET", "/api/catalog/products/PID-1"), 200);
  assert.equal(d.description, "Soft plush bed");
  assert.equal(d.variants.length, 2);
  assert.equal(d.images.length, 2);
  assert.equal(d.shipping.name, "CJPacket Ordinary");
  assert.equal(d.landed_cost, 11.3); // 7.20 + 4.10
  // Cached: a second search doesn't hit CJ again, and only one token was ever fetched
  const before = cjCalls.length;
  await json(await call("GET", "/api/catalog/search?q=pet%20bed"), 200);
  assert.equal(cjCalls.length, before);
  assert.equal(cjCalls.filter((c) => c.path === "/authentication/getAccessToken").length, 1);
});

test("import makes a draft listing with options, CJ ids, costs and a market-checked price", async () => {
  const r = await json(await call("POST", "/api/catalog/products/PID-1/import", {}), 201);
  product = r.product;
  assert.equal(product.title, "Cloud Soft Pet Bed");
  assert.equal(product.status, "draft");
  assert.equal(product.source, "cj");
  assert.equal(product.cost, 7.2);
  assert.match(product.image_url, /^https:\/\/shop\.example\/img\/.+\.jpg$/);
  // Lowest new big-retailer price $29.88 (the renewed $12 one is ignored) -> 5% under = $27.99
  assert.equal(r.pricing.price, 27.99);
  assert.equal(r.pricing.landed_cost, 11.3);
  assert.equal(r.pricing.profit, 16.69);
  assert.equal(product.option_name, "Size");
  assert.deepEqual(product.variants.map((v) => [v.name, v.sku]), [["S", "CJBED-S"], ["L", "CJBED-L"]]);
  assert.equal(product.variants[0].price, 27.99);
  assert.ok(product.variants[1].price > 27.99);   // the bigger size costs more
  const vids = db.prepare("SELECT source_vid, cost_cents FROM product_variants WHERE product_id = ? ORDER BY position").all(product.id);
  assert.deepEqual(vids, [{ source_vid: "VID-S", cost_cents: 720 }, { source_vid: "VID-L", cost_cents: 980 }]);
  const me = await json(await call("GET", "/api/me"), 200);
  assert.equal(me.account.usage.photo, 1);
  assert.equal(me.account.usage.research, 1);

  // A set price skips the market check
  const r2 = await json(await call("POST", "/api/catalog/products/PID-1/import", { price: 35, vids: ["VID-L"] }), 201);
  assert.equal(r2.product.price, 35);
  assert.equal(r2.product.variants.length, 0);   // a single option is sold as a plain product
  assert.equal(db.prepare("SELECT source_vid FROM products WHERE id = ?").get(r2.product.id).source_vid, "VID-L");
  assert.equal(r2.market, null);
});

test("seller connects their CJ key; a paid order waits for it, then goes to CJ and tracking comes back", async () => {
  assert.equal((await json(await call("PUT", "/api/suppliers/cj", { api_key: "bad-key-000000" }), 400)).error.includes("API key"), true);

  await json(await call("POST", `/api/products/${product.id}/publish`), 200);
  const slug = (await json(await call("GET", "/api/me"), 200)).store_slug;
  const L = product.variants[1];
  const co = await (await fetch(`${base}/s/${slug}/checkout`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: [{ product_id: product.id, variant_id: L.id, qty: 2 }] }) })).json();
  const event = { type: "checkout.session.completed", data: { object: {
    object: "checkout.session", id: "cs_test_ds", payment_status: "paid", metadata: { snapfront_order: co.order_id },
    customer_details: { email: "b@example.com", name: "Bo Buyer", phone: "+15125550100" },
    collected_information: { shipping_details: { name: "Bo Buyer", address: { line1: "9 Elm St", city: "Austin", state: "TX", postal_code: "78701", country: "US" } } },
    amount_subtotal: 6000, amount_total: 6500, total_details: { amount_discount: 0, amount_shipping: 500, amount_tax: 0 },
  } } };
  await fetch(`${base}/api/stripe/webhook`, { method: "POST", headers: { "Content-Type": "application/json", "stripe-signature": "t=1" }, body: JSON.stringify(event) });
  await new Promise((r) => setTimeout(r, 50));
  let o = (await json(await call("GET", "/api/orders"), 200))[0];
  assert.equal(o.status, "paid");
  assert.equal(o.supplier.status, "needs_key");

  const sup = await json(await call("PUT", "/api/suppliers/cj", { api_key: "SELLER_CJ_KEY_456", auto_pay: false }), 200);
  assert.deepEqual(sup, { cj: { connected: true, auto_pay: false } });
  assert.equal(db.prepare("SELECT cj_key_enc FROM accounts WHERE id = ?").get(account.id).cj_key_enc.includes("SELLER"), false); // stored encrypted
  await new Promise((r) => setTimeout(r, 50));

  const sent = cjCalls.find((c) => c.path === "/shopping/order/createOrderV2");
  assert.equal(sent.token, "tok-SELLER_CJ_KEY_456");
  assert.equal(sent.body.orderNumber, co.order_id);
  assert.equal(sent.body.shippingCountry, "United States");
  assert.equal(sent.body.shippingProvince, "TX");
  assert.equal(sent.body.shippingPhone, "+15125550100");
  assert.equal(sent.body.logisticName, "CJPacket Ordinary");
  assert.equal(sent.body.fromCountryCode, "CN");
  assert.equal(sent.body.payType, 3);
  assert.deepEqual(sent.body.products.map((p) => [p.vid, p.quantity]), [["VID-L", 2]]);

  o = (await json(await call("GET", "/api/orders"), 200))[0];
  assert.deepEqual(o.supplier, { name: "CJdropshipping", status: "awaiting_payment", order_id: "CJ-ORDER-9", error: null });

  // Sending again does nothing; refreshing picks up tracking and fulfils the order
  orderStatus = "SHIPPED"; track = "CJPKL123";
  o = await json(await call("POST", `/api/orders/${o.id}/supplier`), 200);
  assert.equal(cjCalls.filter((c) => c.path === "/shopping/order/createOrderV2").length, 1);
  assert.equal(o.status, "fulfilled");
  assert.equal(o.supplier.status, "shipped");
  assert.equal(o.tracking.number, "CJPKL123");
  assert.match(o.tracking.url, /17track/);

  const me = await json(await call("GET", "/api/me"), 200);
  assert.deepEqual(me.account.suppliers, { cj: { connected: true, auto_pay: false } });
  assert.deepEqual(await json(await call("DELETE", "/api/suppliers/cj"), 200), { cj: { connected: false, auto_pay: false } });
});

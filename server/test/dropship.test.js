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
const printful = await import("../src/printful.js");
const aliexpress = await import("../src/aliexpress.js");
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
let sessionN = 0;
pay.setStripeClient({
  checkout: { sessions: { async create(p) { sessionN += 1; return { id: sessionN === 1 ? "cs_test_ds" : `cs_test_ds_${sessionN}`, url: "https://checkout.stripe.com/c/x", p }; } } },
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
  assert.equal(r2.pricing.basis, "the price you set");
  assert.equal(r2.pricing.warning, null);   // $35 vs $13.90 landed is a healthy margin
  const thin = await json(await call("POST", "/api/catalog/products/PID-1/import", { price: 12, vids: ["VID-S"] }), 201);
  assert.match(thin.pricing.warning, /only \$0\.70 per sale/);
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
  assert.equal(sup.cj.connected, true);
  assert.equal(sup.cj.auto_pay, false);
  assert.equal(sup.printful.connected, false);
  assert.equal(db.prepare("SELECT creds_enc FROM supplier_accounts WHERE account_id = ? AND supplier = 'cj'").get(account.id).creds_enc.includes("SELLER"), false); // stored encrypted
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

  assert.deepEqual(o.fulfillments.map((f) => [f.supplier, f.status, f.tracking?.number]), [["cj", "shipped", "CJPKL123"]]);

  const me = await json(await call("GET", "/api/me"), 200);
  assert.equal(me.account.suppliers.cj.connected, true);
  assert.equal((await json(await call("DELETE", "/api/suppliers/cj"), 200)).cj.connected, false);
});


/* ---------- Printful and AliExpress, each with the seller's own credentials ---------- */
const pfCalls = [];
let pfStatus = "draft";
printful.setPrintfulFetch(async (url, init) => {
  const u = new URL(url);
  const body = init?.body ? JSON.parse(init.body) : null;
  pfCalls.push({ method: init.method, path: u.pathname, query: Object.fromEntries(u.searchParams), body, auth: init.headers.Authorization, store: init.headers["X-PF-Store-Id"] });
  const res = (code, result) => ({ ok: code < 300, status: code, json: async () => ({ code, result }) });
  if (init.headers.Authorization !== "Bearer pf_seller_token_abcdefghijklmnop") return { ok: false, status: 401, json: async () => ({ code: 401, result: "Unauthorized", error: { reason: "Unauthorized", message: "Malformed token" } }) };
  if (u.pathname === "/stores") return res(200, [{ id: 77, name: "Paw Prints", type: "native" }]);
  if (u.pathname === "/store/products") return res(200, [{ id: 501, name: "Paw Print Tee", thumbnail_url: "https://files.cdn.printful.com/tee.png" }, { id: 502, name: "Cat Mug", thumbnail_url: "https://files.cdn.printful.com/mug.png" }]);
  if (u.pathname === "/store/products/501") return res(200, {
    sync_product: { id: 501, name: "Paw Print Tee", thumbnail_url: "https://files.cdn.printful.com/tee.png" },
    sync_variants: [
      { id: 9001, name: "Paw Print Tee / Black / M", variant_id: 4012, retail_price: "29.00", sku: "PPT-BM", files: [{ type: "preview", preview_url: "https://files.cdn.printful.com/tee-bm.png" }] },
      { id: 9002, name: "Paw Print Tee / Black / XL", variant_id: 4014, retail_price: "31.00", sku: "PPT-BXL", files: [] },
    ],
  });
  if (u.pathname === "/products/variant/4012") return res(200, { variant: { id: 4012, price: "12.95" } });
  if (u.pathname === "/products/variant/4014") return res(200, { variant: { id: 4014, price: "14.95" } });
  if (u.pathname === "/shipping/rates") return res(200, [{ id: "STANDARD", name: "Flat Rate", rate: "4.75", minDeliveryDays: 4, maxDeliveryDays: 8 }]);
  if (u.pathname === "/orders" && init.method === "POST") return res(200, { id: 123456, status: u.searchParams.get("confirm") === "true" ? "pending" : "draft" });
  if (u.pathname === "/orders/123456") return res(200, { id: 123456, status: pfStatus, shipments: pfStatus === "fulfilled" ? [{ carrier: "USPS", tracking_number: "9400PF", tracking_url: "https://track.example/9400PF" }] : [] });
  throw new Error(`unexpected Printful call ${u.pathname}`);
});

const aeCalls = [];
let aeLogistics = "NO_LOGISTICS";
aliexpress.setAliExpressFetch(async (url) => {
  const u = new URL(url);
  const q = Object.fromEntries(u.searchParams);
  aeCalls.push({ path: u.pathname, q });
  const ok = (j) => ({ ok: true, status: 200, json: async () => j });
  // Every call must carry a valid signature made with the seller's App Secret
  const apiPath = u.pathname.startsWith("/rest") ? u.pathname.slice(5) : "";
  if (q.sign !== aliexpress.sign("ae_seller_secret_0123456789abcdef", q, apiPath)) return ok({ error_response: { code: "IncompleteSignature", msg: "bad sign" } });
  if (u.pathname === "/rest/auth/token/create") return ok({ code: "0", access_token: "ae_access", refresh_token: "ae_refresh", expires_in: 86400, refresh_expires_in: 172800, account: "seller@example.com" });
  if (q.session !== "ae_access") return ok({ error_response: { code: "27", msg: "Invalid session" } });
  if (q.method === "aliexpress.ds.product.get") return ok({ aliexpress_ds_product_get_response: { result: {
    ae_item_base_info_dto: { product_id: 1005001234567890, subject: "LED Desk Lamp Foldable", detail: "<p>Bright <b>LED</b> lamp</p>" },
    ae_multimedia_info_dto: { image_urls: "https://ae01.alicdn.com/kf/lamp1.jpg;https://ae01.alicdn.com/kf/lamp2.jpg" },
    ae_item_sku_info_dtos: { ae_item_sku_info_d_t_o: [
      { sku_id: "12000001", sku_attr: "14:193#White", offer_sale_price: "6.20", sku_available_stock: 50, ae_sku_property_dtos: { ae_sku_property_d_t_o: [{ sku_property_name: "Color", sku_property_value: "White", property_value_definition_name: "White" }] } },
      { sku_id: "12000002", sku_attr: "14:175#Black", offer_sale_price: "6.80", sku_available_stock: 0, ae_sku_property_dtos: { ae_sku_property_d_t_o: [{ sku_property_name: "Color", sku_property_value: "Black" }] } },
    ] },
  } } });
  if (q.method === "aliexpress.logistics.buyer.freight.calculate") return ok({ aliexpress_logistics_buyer_freight_calculate_response: { result: { success: true,
    aeop_freight_calculate_result_for_buyer_d_t_o_list: { aeop_freight_calculate_result_for_buyer_dto: [
      { service_name: "CAINIAO_STANDARD", freight: { amount: 2.5, currency_code: "USD" }, estimated_delivery_time: "10-15" },
      { service_name: "AE_STANDARD", freight: { amount: 1.99, currency_code: "USD" }, estimated_delivery_time: "15-25" },
    ] } } } });
  if (q.method === "aliexpress.ds.order.create") return ok({ aliexpress_ds_order_create_response: { result: { is_success: true, order_list: { number: [8100000001] } } } });
  if (q.method === "aliexpress.trade.ds.order.get") return ok({ aliexpress_trade_ds_order_get_response: { result: {
    order_status: aeLogistics === "SELLER_SEND_GOODS" ? "WAIT_BUYER_ACCEPT_GOODS" : "PLACE_ORDER_SUCCESS", logistics_status: aeLogistics,
    logistics_info_list: aeLogistics === "SELLER_SEND_GOODS" ? { ae_order_logistics_info: [{ logistics_no: "LP00AE", logistics_service: "AE_STANDARD" }] } : {},
  } } });
  throw new Error(`unexpected AliExpress call ${q.method || u.pathname}`);
});

let tee, lamp;
test("Printful: the seller's own token lists their designs; import uses their Printful price", async () => {
  assert.equal((await json(await call("GET", "/api/catalog/search?source=printful"), 409)).connect, "printful");
  assert.match((await json(await call("PUT", "/api/suppliers/printful", { token: "not_the_right_token_000000" }), 400)).error, /Printful didn't accept/);
  const sup = await json(await call("PUT", "/api/suppliers/printful", { token: "pf_seller_token_abcdefghijklmnop", auto_pay: false }), 200);
  assert.equal(sup.printful.connected, true);
  assert.equal(sup.printful.store_name, "Paw Prints");

  const list = await json(await call("GET", "/api/catalog/search?source=printful&q=tee"), 200);
  assert.deepEqual(list.products.map((p) => p.title), ["Paw Print Tee"]);
  const d = await json(await call("GET", "/api/catalog/products/501?source=printful"), 200);
  assert.deepEqual(d.variants.map((v) => [v.name, v.cost]), [["Black / M", 12.95], ["Black / XL", 14.95]]);
  assert.equal(d.landed_cost, 17.7);   // 12.95 + 4.75 shipping
  assert.equal(d.supplier_name, "Printful");

  const before = aeCalls.length;
  const r = await json(await call("POST", "/api/catalog/products/501/import?source=printful", {}), 201);
  tee = r.product;
  assert.equal(r.pricing.price, 29);
  assert.equal(r.pricing.basis, "your price in Printful");
  assert.equal(r.market, null);   // their own design: no Amazon comparison
  assert.equal(tee.source, "printful");
  assert.deepEqual(db.prepare("SELECT source_vid FROM product_variants WHERE product_id = ? ORDER BY position").all(tee.id).map((v) => v.source_vid), ["9001", "9002"]);
  assert.equal(aeCalls.length, before);
});

test("AliExpress: App Key and Secret, then authorize; import by product link", async () => {
  assert.match((await json(await call("PUT", "/api/suppliers/aliexpress", { app_key: "abc", app_secret: "x" }), 400)).error, /App Key/);
  const sup = await json(await call("PUT", "/api/suppliers/aliexpress", { app_key: "512345", app_secret: "ae_seller_secret_0123456789abcdef" }), 200);
  assert.equal(sup.aliexpress.connected, false);
  assert.equal(sup.aliexpress.pending_authorization, true);
  assert.equal(sup.aliexpress.callback_url, "https://shop.example/suppliers/aliexpress/callback");
  const auth = new URL(sup.authorize_url);
  assert.equal(auth.origin + auth.pathname, "https://api-sg.aliexpress.com/oauth/authorize");
  assert.equal(auth.searchParams.get("client_id"), "512345");
  assert.equal(auth.searchParams.get("redirect_uri"), "https://shop.example/suppliers/aliexpress/callback");

  // Searching before authorizing asks them to finish connecting
  assert.equal((await call("GET", "/api/catalog/search?source=aliexpress&q=1005001234567890")).status, 409);

  // A forged or stale state is refused; the real one connects
  assert.equal((await fetch(`${base}/suppliers/aliexpress/callback?code=abc&state=bogus`)).status, 400);
  const cb = await fetch(`${base}/suppliers/aliexpress/callback?code=the_code&state=${auth.searchParams.get("state")}`);
  assert.equal(cb.status, 200);
  assert.match(await cb.text(), /AliExpress is connected/);
  const tokenCall = aeCalls.find((c) => c.path === "/rest/auth/token/create");
  assert.equal(tokenCall.q.code, "the_code");
  const st = await json(await call("GET", "/api/suppliers"), 200);
  assert.equal(st.aliexpress.connected, true);
  assert.equal(st.aliexpress.account_name, "seller@example.com");

  assert.match((await json(await call("GET", "/api/catalog/search?source=aliexpress&q=lamp"), 400)).error, /product link/);
  const s = await json(await call("GET", `/api/catalog/search?source=aliexpress&q=${encodeURIComponent("https://www.aliexpress.us/item/1005001234567890.html?spm=a2g0o")}`), 200);
  assert.deepEqual(s.products.map((p) => [p.pid, p.title, p.cost]), [["1005001234567890", "LED Desk Lamp Foldable", 6.2]]);
  const d = await json(await call("GET", "/api/catalog/products/1005001234567890?source=aliexpress"), 200);
  assert.equal(d.variants.length, 1);   // the out-of-stock colour is left out
  assert.equal(d.shipping.name, "AE_STANDARD");
  assert.equal(d.landed_cost, 8.19);
  assert.equal(d.description, "Bright LED lamp");

  const r = await json(await call("POST", "/api/catalog/products/1005001234567890/import?source=aliexpress", { price: 24.99 }), 201);
  lamp = r.product;
  assert.equal(lamp.source, "aliexpress");
  assert.deepEqual(db.prepare("SELECT source_vid, source_meta FROM products WHERE id = ?").get(lamp.id), { source_vid: "12000001", source_meta: "14:193#White" });
});

test("one order with Printful and AliExpress items goes to both, and is fulfilled when both have shipped", async () => {
  await json(await call("POST", `/api/products/${tee.id}/publish`), 200);
  await json(await call("POST", `/api/products/${lamp.id}/publish`), 200);
  const slug = (await json(await call("GET", "/api/me"), 200)).store_slug;
  const co = await (await fetch(`${base}/s/${slug}/checkout`, { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: [{ product_id: tee.id, variant_id: tee.variants[1].id, qty: 1 }, { product_id: lamp.id, qty: 2 }] }) })).json();
  assert.ok(co.order_id, JSON.stringify(co));
  const event = { type: "checkout.session.completed", data: { object: {
    object: "checkout.session", id: "cs_test_ds_2", payment_status: "paid", metadata: { snapfront_order: co.order_id },
    customer_details: { email: "c@example.com", name: "Cy Buyer", phone: "+14155550123" },
    collected_information: { shipping_details: { name: "Cy Buyer", address: { line1: "1 Bay St", line2: "Apt 4", city: "San Francisco", state: "CA", postal_code: "94105", country: "US" } } },
    amount_subtotal: 8098, amount_total: 8598, total_details: { amount_discount: 0, amount_shipping: 500, amount_tax: 0 },
  } } };
  await fetch(`${base}/api/stripe/webhook`, { method: "POST", headers: { "Content-Type": "application/json", "stripe-signature": "t=1" }, body: JSON.stringify(event) });
  await new Promise((r) => setTimeout(r, 80));

  const pfOrder = pfCalls.find((c) => c.path === "/orders" && c.method === "POST");
  assert.equal(pfOrder.query.confirm, "false");
  assert.equal(pfOrder.body.external_id, co.order_id.replace(/[^\w-]/g, ""));
  assert.deepEqual(pfOrder.body.items, [{ sync_variant_id: 9002, quantity: 1, retail_price: tee.variants[1].price.toFixed(2) }]);
  assert.equal(pfOrder.body.recipient.state_code, "CA");
  assert.equal(pfOrder.body.recipient.address2, "Apt 4");

  const aeOrder = aeCalls.find((c) => c.q.method === "aliexpress.ds.order.create");
  const placed = JSON.parse(aeOrder.q.param_place_order_request4_open_api_d_t_o);
  assert.equal(placed.out_order_id, co.order_id);
  assert.equal(placed.logistics_address.province, "California");
  assert.equal(placed.logistics_address.mobile_no, "4155550123");
  assert.equal(placed.logistics_address.phone_country, "+1");
  assert.deepEqual(placed.product_items.map((i) => [i.product_id, i.product_count, i.sku_attr, i.logistics_service_name]), [[1005001234567890, 2, "14:193#White", "AE_STANDARD"]]);
  assert.equal(JSON.parse(aeOrder.q.ds_extend_request).payment.try_to_pay, "false");

  let o = (await json(await call("GET", "/api/orders"), 200)).find((x) => x.id === co.order_id);
  assert.deepEqual(o.fulfillments.map((f) => [f.supplier, f.status, f.order_id]).sort(), [["aliexpress", "awaiting_payment", "8100000001"], ["printful", "awaiting_payment", "123456"]]);

  // Printful ships first: not fulfilled yet. Then AliExpress ships: fulfilled.
  pfStatus = "fulfilled";
  o = await json(await call("POST", `/api/orders/${co.order_id}/supplier`), 200);
  assert.equal(o.status, "paid");
  assert.equal(o.fulfillments.find((f) => f.supplier === "printful").tracking.url, "https://track.example/9400PF");
  aeLogistics = "SELLER_SEND_GOODS";
  o = await json(await call("POST", `/api/orders/${co.order_id}/supplier`), 200);
  assert.equal(o.status, "fulfilled");
  assert.deepEqual(o.fulfillments.map((f) => [f.supplier, f.status, f.tracking?.number]).sort(), [["aliexpress", "shipped", "LP00AE"], ["printful", "shipped", "9400PF"]]);
  // The buyer's page shows tracking
  assert.match(await (await fetch(`${base}/thanks?o=${co.order_id}`)).text(), /9400PF|LP00AE/);
});

test("AliExpress request signing matches the Open Platform rules", () => {
  const params = { app_key: "512345", timestamp: "1700000000000", sign_method: "sha256", method: "aliexpress.ds.product.get", product_id: "1" };
  const crypto = globalThis.process.getBuiltinModule("node:crypto");
  const base = "app_key512345methodaliexpress.ds.product.getproduct_id1sign_methodsha256timestamp1700000000000";
  assert.equal(aliexpress.sign("secret", params), crypto.createHmac("sha256", "secret").update(base).digest("hex").toUpperCase());
  const restBase = "/auth/token/createapp_key512345codeXsign_methodsha256timestamp1";
  assert.equal(aliexpress.sign("secret", { app_key: "512345", code: "X", sign_method: "sha256", timestamp: "1" }, "/auth/token/create"),
    crypto.createHmac("sha256", "secret").update(restBase).digest("hex").toUpperCase());
});

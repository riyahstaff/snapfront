// Store addresses: <slug>.<STORE_DOMAIN> serves the store at its root, names become addresses,
// old addresses redirect, and the main domain shows the Snapfront home page.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-addr-"));
process.env.DATA_DIR = tmp;
process.env.PUBLIC_URL = "https://shopdomain.test";
process.env.STORE_DOMAIN = "shopdomain.test";
process.env.STRIPE_SECRET_KEY = "sk_test_fake";

const { app } = await import("../src/index.js");
const pay = await import("../src/payments.js");
const { db } = await import("../src/db.js");

let lastSession = null;
pay.setStripeClient({ checkout: { sessions: { async create(p) { lastSession = p; return { id: `cs_addr_${Date.now()}`, url: "https://checkout.stripe.com/c/a" }; } } } });

let server, port;
before(async () => { server = app.listen(0); await new Promise((r) => server.once("listening", r)); port = server.address().port; });
after(() => { server.close(); fs.rmSync(tmp, { recursive: true, force: true }); });

/** A request as if it came to `host` (fetch can't set Host). */
function req(host, method, url, { body, token } = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const r = http.request({ host: "127.0.0.1", port, method, path: url, headers: { Host: host, ...(data ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) } }, (res) => {
      let text = ""; res.on("data", (c) => (text += c)); res.on("end", () => resolve({ status: res.statusCode, location: res.headers.location, text, json: () => JSON.parse(text) }));
    });
    r.on("error", reject); if (data) r.write(data); r.end();
  });
}
const api = (method, url, token, body) => req("shopdomain.test", method, url, { token, body });

let a, b;
test("a store's address follows its name until the seller picks one", async () => {
  a = (await api("POST", "/api/sellers", null, {})).json();
  assert.equal(a.seller.store_slug, "my-snapfront-store");
  let me = (await api("PATCH", "/api/me", a.token, { store_name: "Paw Place" })).json();
  assert.equal(me.store_slug, "paw-place");
  assert.equal(me.store_url, "https://paw-place.shopdomain.test");
  assert.equal(me.store_domain, "shopdomain.test");

  b = (await api("POST", "/api/sellers", null, {})).json();
  assert.equal(b.seller.store_slug, "my-snapfront-store-2");
  me = (await api("PATCH", "/api/me", b.token, { store_name: "Paw Place" })).json();
  assert.equal(me.store_slug, "paw-place-2");   // the name is taken, so the address gets a number

  // Picking an address: taken, reserved and too short are refused with a reason
  let r = await api("PATCH", "/api/me", b.token, { store_slug: "paw-place" });
  assert.equal(r.status, 409); assert.match(r.json().error, /paw-place\.shopdomain\.test is taken/);
  r = await api("PATCH", "/api/me", b.token, { store_slug: "admin" });
  assert.equal(r.status, 409); assert.match(r.json().error, /reserved/);
  assert.equal((await api("PATCH", "/api/me", b.token, { store_slug: "x" })).status, 400);
  me = (await api("PATCH", "/api/me", b.token, { store_slug: "Barkery.shopdomain.test" })).json();
  assert.equal(me.store_slug, "barkery");

  // Once the seller has a real address, renaming doesn't move it
  me = (await api("PATCH", "/api/me", a.token, { store_name: "Paw Place Co" })).json();
  assert.equal(me.store_slug, "paw-place");
});

test("the store's own address serves it at the root, with links that stay there", async () => {
  const p = (await api("POST", "/api/products", a.token, { title: "Cozy Pet Bed", kind: "physical", price: 30 })).json();
  db.prepare("UPDATE products SET status = 'live' WHERE id = ?").run(p.id);
  assert.equal(p.page_url, "https://paw-place.shopdomain.test/cozy-pet-bed");

  let r = await req("paw-place.shopdomain.test", "GET", "/");
  assert.equal(r.status, 200);
  assert.match(r.text, /Paw Place Co/);
  assert.match(r.text, /href="\/cozy-pet-bed"/);
  assert.match(r.text, /href="\/cart"/);
  assert.match(r.text, /rel="canonical" href="https:\/\/paw-place\.shopdomain\.test"/);
  assert.equal((await req("paw-place.shopdomain.test", "GET", "/cozy-pet-bed")).status, 200);
  r = await req("paw-place.shopdomain.test", "GET", "/cart");
  assert.equal(r.status, 200);
  assert.match(r.text, /var S=""/);
  r = await req("paw-place.shopdomain.test", "POST", "/cart/quote", { body: { items: [{ product_id: p.id, qty: 2 }] } });
  assert.equal(r.status, 200);
  assert.equal(r.json().subtotal, 60);
  assert.equal((await req("paw-place.shopdomain.test", "GET", "/no-such-thing")).status, 404);

  // Checkout sends the buyer back to the store's own address (where their cart lives)
  db.prepare("UPDATE sellers SET stripe_account_id = 'acct_x', stripe_ready = 1 WHERE store_slug = 'paw-place'").run();
  db.prepare("UPDATE accounts SET plan = 'launch' WHERE id = ?").run(a.account.id);
  r = await req("paw-place.shopdomain.test", "POST", "/checkout", { body: { items: [{ product_id: p.id, qty: 1 }] } });
  assert.equal(r.status, 200, r.text);
  assert.match(lastSession.success_url, /^https:\/\/paw-place\.shopdomain\.test\/thanks\?o=ord_/);
  assert.equal(lastSession.cancel_url, "https://paw-place.shopdomain.test/cart");

  // The app's API and images work on any address
  assert.equal((await req("paw-place.shopdomain.test", "GET", "/api/me", { token: a.token })).status, 200);
});

test("old and long-form addresses redirect to the store's address", async () => {
  // /s/<slug> links shared earlier
  let r = await req("shopdomain.test", "GET", "/s/paw-place/cozy-pet-bed?ref=ig");
  assert.equal(r.status, 301);
  assert.equal(r.location, "https://paw-place.shopdomain.test/cozy-pet-bed?ref=ig");
  // The address a store had before it moved
  r = await req("my-snapfront-store-2.shopdomain.test", "GET", "/");
  assert.equal(r.status, 301);
  assert.equal(r.location, "https://barkery.shopdomain.test");
  r = await req("shopdomain.test", "GET", "/s/paw-place-2");
  assert.equal(r.location, "https://barkery.shopdomain.test");
  // An /s/ link opened on a store address
  r = await req("paw-place.shopdomain.test", "GET", "/s/paw-place/cart");
  assert.equal(r.status, 301);
  assert.equal(r.location, "/cart");
  // No store at all
  r = await req("nobody-here.shopdomain.test", "GET", "/");
  assert.equal(r.status, 404);
  assert.match(r.text, /no store here/i);
});

test("the main domain shows the Snapfront home page; www goes to it", async () => {
  const r = await req("shopdomain.test", "GET", "/");
  assert.equal(r.status, 200);
  assert.match(r.text, /Snap a photo/);
  assert.match(r.text, /0% fees/);
  const w = await req("www.shopdomain.test", "GET", "/terms");
  assert.equal(w.status, 301);
  assert.equal(w.location, "https://shopdomain.test/terms");
});

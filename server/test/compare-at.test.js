// The optional original price: shown crossed out with "Save N%" on the store, never charged, and
// refused unless it's higher than the price.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-compare-"));
process.env.DATA_DIR = tmp;
process.env.PUBLIC_URL = "https://shop.example";
process.env.STRIPE_SECRET_KEY = "";

const { app } = await import("../src/index.js");
const { db } = await import("../src/db.js");

let server, base, token, slug;
before(async () => {
  server = app.listen(0); await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
  const reg = await (await call("POST", "/api/sellers", { store_name: "Sale Shelf" })).json();
  token = reg.token; slug = reg.seller.store_slug;
  db.prepare("UPDATE sellers SET stripe_account_id='acct_1', stripe_ready=1 WHERE id=?").run(reg.seller.id);
  db.prepare("UPDATE accounts SET plan = 'launch' WHERE id = ?").run(reg.account.id);
});
after(() => { server.close(); fs.rmSync(tmp, { recursive: true, force: true }); });
function call(method, url, body) {
  return fetch(base + url, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
}
const page = async (url) => (await fetch(base + url)).text();

let guide;
test("an original price above the price is saved; anything else is refused before saving", async () => {
  let r = await call("POST", "/api/products", { title: "Meal Prep Guide", kind: "digital", price: 12, compare_at: 20, delivery_url: "https://files.example/guide.pdf" });
  assert.equal(r.status, 201, await r.clone().text());
  guide = await r.json();
  assert.equal(guide.compare_at, 20);

  r = await call("POST", "/api/products", { title: "Bad Sale", kind: "digital", price: 12, compare_at: 10 });
  assert.equal(r.status, 400);
  assert.match((await r.json()).error, /higher than the price/);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM products WHERE title = 'Bad Sale'").get().n, 0, "nothing was created");

  // Raising the price to the original price in the same edit is refused, and the price is left as it was.
  r = await call("PATCH", `/api/products/${guide.id}`, { price: 25, compare_at: 20 });
  assert.equal(r.status, 400);
  assert.equal(db.prepare("SELECT price_cents FROM products WHERE id = ?").get(guide.id).price_cents, 1200);

  for (const bad of ["abc", -5, 0, 2e9]) assert.equal((await call("PATCH", `/api/products/${guide.id}`, { compare_at: bad })).status, 400, String(bad));
  assert.equal(db.prepare("SELECT compare_at_cents FROM products WHERE id = ?").get(guide.id).compare_at_cents, 2000);
});

test("the store shows it crossed out with the saving, and checkout still charges the price", async () => {
  assert.equal((await call("POST", `/api/products/${guide.id}/publish`)).status, 200);
  const home = await page(`/s/${slug}`);
  assert.match(home, /<s class="pwas"><span class="vh">Original price <\/span>\$20\.00<\/s> <span class="psave">Save 40%<\/span>/);
  const pd = await page(`/s/${slug}/${guide.slug}`);
  assert.match(pd, /<span id="price">\$12\.00<\/span><span id="was">/);
  assert.match(pd, /Save 40%/);
  assert.match(pd, /"price":"12\.00"/, "search engines see the real price");
  assert.match(pd, /"unit":1200/, "the cart adds the real price");
  assert.match(pd, /\.pwas\{/, "the page carries the sale styles");
});

test("every theme gets the sale styles, and pages without a sale are unchanged", async () => {
  const { THEMES } = await import("../src/themes.js");
  const render = await import("../src/render.js");
  const base = { id: "", slug: "x", title: "Thing", price_cents: 1200, currency: "usd", variants: [], in_stock: true, status: "live", kind: "digital", bullets: [], tags: [], faq: [] };
  for (const t of [THEMES[0], THEMES[THEMES.length - 1]]) {
    const store = { store_name: "S", store_slug: "s", _base: "/s/s", theme: t.id, stripe_ready: true };
    const sale = render.storePage(store, [{ ...base, compare_at_cents: 2000 }]);
    assert.match(sale, /\.psave\{/, t.id);
    assert.match(sale, /Save 40%/, t.id);
    const plain = render.storePage(store, [base]);
    assert.doesNotMatch(plain, /\.psave\{|class="pwas"/, t.id);
    assert.doesNotMatch(render.productPage(store, base, undefined, [base]), /function was|id="was"/, t.id);
  }
});

test("a price at or above the original hides it; blank clears it", async () => {
  // A later price change that passes the original doesn't show a fake saving.
  db.prepare("UPDATE products SET price_cents = 2500 WHERE id = ?").run(guide.id);
  assert.doesNotMatch(await page(`/s/${slug}`), /class="pwas"/);
  db.prepare("UPDATE products SET price_cents = 1995, compare_at_cents = 2000 WHERE id = ?").run(guide.id);
  const home = await page(`/s/${slug}`);
  assert.match(home, /class="pwas"/);
  assert.doesNotMatch(home, /Save 0%/, "under 1% shows no saving label");
  db.prepare("UPDATE products SET price_cents = 1200 WHERE id = ?").run(guide.id);
  const r = await call("PATCH", `/api/products/${guide.id}`, { compare_at: "" });
  assert.equal(r.status, 200);
  assert.equal((await r.json()).compare_at, null);
  assert.doesNotMatch(await page(`/s/${slug}/${guide.slug}`), /id="was"|class="pwas"/);
});

test("with options, the original price follows the chosen option's price", async () => {
  const r = await call("POST", "/api/products", { title: "Tee", kind: "physical", price: 30, compare_at: 40, option_name: "Size",
    variants: [{ name: "S" }, { name: "XL", price: 45 }] });
  assert.equal(r.status, 201, await r.clone().text());
  const tee = await r.json();
  assert.equal((await call("POST", `/api/products/${tee.id}/publish`)).status, 200);
  const pd = await page(`/s/${slug}/${tee.slug}`);
  assert.match(pd, /<span id="was">/);
  assert.match(pd, /,c=4000,/);
  assert.match(pd, /function was\(u\)/);
});

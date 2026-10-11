// Price check: Google Lens results (via SerpApi) turned into retailer prices and a suggested price.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-research-"));
process.env.DATA_DIR = tmp;
process.env.PUBLIC_URL = "https://shop.example";
process.env.SERPAPI_KEY = "serp_test";

const { app } = await import("../src/index.js");
const research = await import("../src/research.js");
const { db } = await import("../src/db.js");

const LENS = {
  visual_matches: [
    { title: "Pet Hair Remover Roller", link: "https://www.amazon.com/dp/B0X", source: "Amazon.com", price: { value: "$24.99*", extracted_value: 24.99, currency: "$" }, thumbnail: "https://t/1.jpg", in_stock: true },
    { title: "Reusable Lint Roller", link: "https://www.walmart.com/ip/123", source: "Walmart", price: { value: "$19.97", extracted_value: 19.97, currency: "$" } },
    { title: "Lint roller", link: "https://www.aliexpress.us/item/9", source: "AliExpress", price: { value: "$4.10", extracted_value: 4.1, currency: "$" } },
    { title: "Roller", link: "https://shop.example.co.uk/x", source: "UK shop", price: { value: "£12", extracted_value: 12, currency: "£" } },
    { title: "No price", link: "https://blog.example/x", source: "Blog" },
    { title: "Duplicate", link: "https://www.walmart.com/ip/123", source: "Walmart", price: { extracted_value: 19.97, currency: "$" } },
  ],
};

let calls = [];
research.setLensFetch(async (url) => { calls.push(new URL(url)); return { ok: true, json: async () => LENS }; });

let server, base;
before(async () => { server = app.listen(0); await new Promise((r) => server.once("listening", r)); base = `http://127.0.0.1:${server.address().port}`; });
after(() => { server.close(); fs.rmSync(tmp, { recursive: true, force: true }); });

test("parses Lens results into US-priced offers, big retailers first", () => {
  const m = research.parseLens(LENS);
  assert.deepEqual(m.map((x) => x.store), ["walmart", "amazon", "aliexpress"]);
  assert.equal(m[0].price, 19.97);
  assert.equal(m[1].store_name, "Amazon");
});

test("suggests a price under the big retailers, protecting the margin", () => {
  const m = research.parseLens(LENS);
  const { summary, suggestion } = research.suggest(m, 6);
  assert.equal(summary.lowest_major, 19.97);
  assert.equal(summary.by_store.amazon.price, 24.99);
  assert.equal(suggestion.price, 17.99);           // ~5% under $19.97, retail-style
  assert.equal(suggestion.profit, 11.99);
  assert.equal(suggestion.margin_percent, 67);
  // When cost is too high to undercut, keep a 30% margin and warn
  const tight = research.suggest(m, 18).suggestion;
  assert.ok(tight.price >= 18 * 1.3);
  assert.match(tight.warning, /hard to compete/);
  // No matches: no suggestion
  assert.equal(research.suggest([], 5).suggestion, null);
});

test("the endpoint searches with a public image link and counts toward the plan", async () => {
  const reg = await (await fetch(`${base}/api/sellers`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })).json();
  const call = (body) => fetch(`${base}/api/research/price-check`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${reg.token}` }, body: JSON.stringify(body) });
  const PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC".padEnd(200, "A");

  let r = await call({ imageBase64: PNG, mediaType: "image/png", cost: 6 });
  assert.equal(r.status, 200);
  const out = await r.json();
  assert.match(out.image_url, /^https:\/\/shop\.example\/img\/.+\.png$/);
  assert.equal(out.matches.length, 3);
  assert.equal(out.suggestion.price, 17.99);
  const q = calls.at(-1);
  assert.equal(q.searchParams.get("engine"), "google_lens");
  assert.equal(q.searchParams.get("type"), "all");
  assert.equal(q.searchParams.get("url"), out.image_url);

  assert.equal((await call({ image_url: "https://cf.cjdropshipping.com/a.jpg" })).status, 200);
  assert.equal((await call({ image_url: "http://insecure/a.jpg" })).status, 400);
  // Free plan: 3 price checks in total
  assert.equal((await call({ image_url: "https://cf.cjdropshipping.com/b.jpg" })).status, 200);
  const over = await call({ image_url: "https://cf.cjdropshipping.com/c.jpg" });
  assert.equal(over.status, 402);
  assert.equal((await over.json()).upgrade, "launch");
  assert.equal(db.prepare("SELECT count FROM usage WHERE account_id = ? AND kind = 'research'").get(reg.account.id).count, 3);
});

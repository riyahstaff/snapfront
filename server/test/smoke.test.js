// End-to-end smoke test of the API with the AI call faked and Stripe unconfigured.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-"));
process.env.DATA_DIR = tmp;
process.env.PUBLIC_URL = "http://localhost";
process.env.STRIPE_SECRET_KEY = "";
process.env.SNAPFRONT_FAKE_AI = JSON.stringify({
  title: "Fig & Cedar Soy Candle", tagline: "Slow-burning and cosy.", description: "Para one.\n\nPara two.",
  bullets: ["8 oz jar", "45 hour burn"], suggested_price: 28, category: "Home fragrance", tags: ["candle", "#cosy"],
  faq: [{ q: "Shipping?", a: "2 days." }], alt_text: "A candle", seo_description: "A candle.",
  content: { chapters: [{ heading: "Start here", paragraphs: ["Plan your week on Sunday."], tip: "Batch-cook rice." }] },
});

const { app } = await import("../src/index.js");
let server, base, token;
before(async () => { server = app.listen(0); await new Promise((r) => server.once("listening", r)); base = `http://127.0.0.1:${server.address().port}`; });
after(() => { server.close(); fs.rmSync(tmp, { recursive: true, force: true }); });

const call = (method, url, body) => fetch(base + url, {
  method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  body: body ? JSON.stringify(body) : undefined,
});
// 1x1 PNG
const PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC".padEnd(200, "A");

test("register, photo → draft, save, storefront", async () => {
  let r = await call("POST", "/api/sellers", { store_name: "Wick & Co" });
  assert.equal(r.status, 201);
  const reg = await r.json(); token = reg.token;
  assert.equal(reg.seller.store_slug, "wick-co");

  r = await call("GET", "/api/me"); assert.equal(r.status, 200);

  r = await call("POST", "/api/ai/product-from-photo", { imageBase64: PNG, mediaType: "image/png", kind: "physical" });
  assert.equal(r.status, 200);
  const draft = await r.json();
  assert.equal(draft.title, "Fig & Cedar Soy Candle");
  assert.equal(draft.price, 28);
  assert.deepEqual(draft.tags, ["candle", "cosy"]);
  assert.ok(fs.existsSync(path.join(tmp, "images", draft.image_file)));

  r = await call("POST", "/api/products", draft); assert.equal(r.status, 201);
  const prod = await r.json();
  assert.equal(prod.price_cents, 2800);
  assert.equal(prod.status, "draft");

  // Draft is hidden publicly but previewable
  assert.equal((await fetch(`${base}/s/wick-co/${prod.slug}`)).status, 404);
  const prev = await fetch(`${base}/s/wick-co/${prod.slug}?preview=1`);
  assert.equal(prev.status, 200);
  const html = await prev.text();
  assert.match(html, /Fig &amp; Cedar Soy Candle/);
  assert.match(html, /application\/ld\+json/);

  // Publishing without Stripe is refused with a clear message
  r = await call("POST", `/api/products/${prod.id}/publish`);
  assert.equal(r.status, 409);
  assert.match((await r.json()).error, /Connect Stripe/);

  r = await call("PATCH", `/api/products/${prod.id}`, { price: 24.5 });
  assert.equal((await r.json()).price_cents, 2450);

  assert.equal((await fetch(`${base}/s/wick-co`)).status, 200);
});

test("generate a digital product with cover + PDF", async () => {
  const r = await call("POST", "/api/ai/generate", { type: "guide", niche: "budget meal prep for busy parents", color: "forest" });
  assert.equal(r.status, 201);
  const p = await r.json();
  assert.equal(p.kind, "digital");
  assert.ok(p.has_delivery);
  const files = fs.readdirSync(path.join(tmp, "files"));
  assert.equal(files.length, 1);
  const pdf = fs.readFileSync(path.join(tmp, "files", files[0]));
  assert.equal(pdf.subarray(0, 4).toString(), "%PDF");
  const png = fs.readFileSync(path.join(tmp, "images", p.image_url.split("/").pop()));
  assert.equal(png.subarray(1, 4).toString(), "PNG");
  fs.copyFileSync(path.join(tmp, "files", files[0]), path.join(os.tmpdir(), "snapfront-sample-generated.pdf"));
  fs.copyFileSync(path.join(tmp, "images", p.image_url.split("/").pop()), path.join(os.tmpdir(), "snapfront-sample-cover.png"));
});

test("auth and validation errors are clear", async () => {
  const saved = token; token = "nope";
  let r = await call("GET", "/api/products"); assert.equal(r.status, 401);
  token = saved;
  r = await call("POST", "/api/ai/product-from-photo", { imageBase64: PNG, mediaType: "image/tiff" });
  assert.equal(r.status, 400);
  r = await call("POST", "/api/products", { title: "x", delivery_url: "http://insecure" });
  assert.equal(r.status, 400);
});

test("download tokens are signed and expire", async () => {
  const pay = await import("../src/payments.js");
  const t = pay.downloadToken("prd_x", "cs_1");
  assert.equal(pay.readDownloadToken(t).p, "prd_x");
  assert.equal(pay.readDownloadToken(t.slice(0, -2) + "xx"), null);
  assert.equal(pay.readDownloadToken(pay.downloadToken("prd_x", "cs_1", -1)), null);
});

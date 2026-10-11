// Marketing posts, AI media (stand-in Runpod), feeds, link-in-bio, QR, reviews, insights, checkout reminders, supplier directory.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-growth-"));
process.env.DATA_DIR = tmp;
process.env.PUBLIC_URL = "https://grow.test";
process.env.STORE_DOMAIN = "grow.test";
process.env.RUNPOD_API_KEY = "rp_test";
process.env.SNAPFRONT_FAKE_AI = JSON.stringify({ headline: "Glow in two minutes", subline: "Vitamin C serum in rosehip oil", bullets: ["Brightens dull skin", "No fillers", "Glass bottle"], cta: "Shop now", caption: "Meet your new morning step. Link in bio.", hashtags: ["skincare", "#glow", "vitamin c"] });

const { app } = await import("../src/index.js");
const { db } = await import("../src/db.js");
const sharp = (await import("sharp")).default;
const aimedia = await import("../src/aimedia.js");
const marketing = await import("../src/marketing.js");
const fonts = await import("../src/fonts.js");
const growth = await import("../src/growth.js");

// No network in tests: fonts fall back to the bundled ones, the cut-out is a plain shape, Runpod is faked.
fonts.setFontFetch(async () => { throw new Error("offline"); });
marketing.setCutout(async () => ({ png: await sharp({ create: { width: 300, height: 400, channels: 4, background: { r: 120, g: 60, b: 20, alpha: 1 } } }).png().toBuffer(), width: 300, height: 400, coverage: 0.3 }));
const rp = [];
let rpStatus = "COMPLETED";
aimedia.setRunpodFetch(async (url, init = {}) => {
  rp.push({ url, method: init.method || "GET", body: init.body ? JSON.parse(init.body) : null, auth: init.headers?.Authorization });
  const ok = (j) => ({ ok: true, status: 200, json: async () => j });
  if (url.endsWith("/run")) return ok({ id: "rp1", status: "IN_QUEUE" });
  if (url.includes("/status/")) return ok(rpStatus === "COMPLETED" ? { id: "rp1", status: "COMPLETED", output: url.includes("wan") ? { video_url: "https://video.runpod.ai/x/out.mp4", cost: 0.3 } : { image_url: "https://image.runpod.ai/x/out.jpg", cost: 0.02 } } : { id: "rp1", status: rpStatus });
  if (url.startsWith("https://video.runpod.ai") || url.startsWith("https://image.runpod.ai")) return { ok: true, status: 200, arrayBuffer: async () => new Uint8Array(Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(3000, 1)])).buffer };
  throw new Error(`unexpected ${url}`);
});

let server, base, token, me, product;
before(async () => { server = app.listen(0); await new Promise((r) => server.once("listening", r)); base = `http://127.0.0.1:${server.address().port}`; });
after(() => { server.close(); fs.rmSync(tmp, { recursive: true, force: true }); });
const call = async (method, url, body, headers = {}) => {
  const r = await fetch(base + url, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
  const type = r.headers.get("content-type") || "";
  return { status: r.status, type, body: type.includes("json") ? await r.json() : Buffer.from(await r.arrayBuffer()) };
};
const host = (h) => ({ Host: h });
/** A storefront request with a Host header (fetch can't set one). Returns { status, text }. */
function page(pathname, { headers = {}, method = "GET", body } = {}) {
  return new Promise((resolve, reject) => {
    const r = http.request({ host: "127.0.0.1", port: server.address().port, method, path: pathname, headers: { Host: "glow-lab.grow.test", ...headers } }, (res) => {
      let text = ""; res.on("data", (c) => (text += c)); res.on("end", () => resolve({ status: res.statusCode, text, headers: res.headers }));
    });
    r.on("error", reject); if (body) r.write(body); r.end();
  });
}

test("supplier directory is public and complete", async () => {
  const d = (await call("GET", "/api/sources")).body;
  assert.ok(d.groups.length >= 5);
  const all = d.groups.flatMap((g) => g.suppliers);
  assert.ok(all.length >= 25);
  for (const s of all) { assert.match(s.url, /^https:\/\//); assert.ok(s.name && s.sells && s.shipsFrom && s.cost); }
  assert.deepEqual(all.filter((s) => s.connect).map((s) => s.connect).sort(), ["aliexpress", "cj", "printful"]);
});

test("set up a store with a live product and a photo", async () => {
  const s = (await call("POST", "/api/sellers", { store_name: "Glow Lab" })).body;
  token = s.token;
  me = (await call("PATCH", "/api/me", { store_name: "Glow Lab", tagline: "Simple skincare", theme: "bloom" })).body;
  const photo = await sharp({ create: { width: 800, height: 800, channels: 3, background: "#d9c7b5" } }).jpeg().toBuffer();
  fs.writeFileSync(path.join(tmp, "images", "serum.jpg"), photo);
  product = (await call("POST", "/api/products", { title: "Glow Serum", tagline: "Vitamin C", price: 46, kind: "physical", image_file: "serum.jpg", category: "Serums", description: "Bright skin." })).body;
  db.prepare("UPDATE products SET status = 'live' WHERE id = ?").run(product.id);
});

test("marketing: AI caption, then an image, a carousel and a reel in the store's colours", async () => {
  const copy = (await call("POST", "/api/marketing/copy", { product_id: product.id, platform: "instagram" })).body;
  assert.equal(copy.headline, "Glow in two minutes");
  assert.deepEqual(copy.hashtags, ["skincare", "glow", "vitaminc"]);
  assert.equal(copy.link, "glow-lab.grow.test/glow-serum");
  const lists = (await call("GET", "/api/marketing")).body;
  assert.equal(lists.templates.length, 6);

  for (const template of ["spotlight", "split", "frame", "drop", "offer", "minimal"]) {
    const r = await call("POST", "/api/marketing/render", { product_id: product.id, kind: "image", template, format: "post", copy, offer: "20% off" });
    assert.equal(r.status, 200, `${template}: ${JSON.stringify(r.body)}`);
    const f = r.body.files[0];
    const meta = await sharp(path.join(tmp, "media", f.file)).metadata();
    assert.deepEqual([meta.width, meta.height], [1080, 1350], template);
    const img = await fetch(`${base}${new URL(f.url).pathname}`);
    assert.equal(img.headers.get("content-type"), "image/jpeg");
  }
  const story = await call("POST", "/api/marketing/render", { product_id: product.id, kind: "carousel", template: "split", format: "story", copy });
  assert.equal(story.body.files.length, 3);
  const reel = await call("POST", "/api/marketing/render", { product_id: product.id, kind: "reel", template: "spotlight", copy });
  assert.equal(reel.status, 200, JSON.stringify(reel.body));
  assert.match(reel.body.files[0].file, /\.mp4$/);
  const mp4 = fs.readFileSync(path.join(tmp, "media", reel.body.files[0].file));
  assert.equal(mp4.subarray(4, 8).toString(), "ftyp");
  assert.equal((await call("POST", "/api/marketing/render", { product_id: product.id, template: "nope" })).status, 400);
});

test("AI media: lifestyle photo on Runpod, saved here and marked as AI; video needs Pro", async () => {
  const s = (await call("POST", "/api/ai-media", { kind: "scene", image_file: "serum.jpg", preset: "mirror" })).body;
  assert.equal(s.status, "running");
  const sent = rp.find((r) => r.url.endsWith("qwen-image-edit-2511/run"));
  assert.equal(sent.auth, "Bearer rp_test");
  assert.deepEqual(sent.body.input.images, ["https://grow.test/img/serum.jpg"]);
  assert.match(sent.body.input.prompt, /bathroom mirror.*exactly as it is/);
  const done = (await call("GET", `/api/ai-media/${s.id}`)).body;
  assert.equal(done.status, "done");
  assert.match(done.image_file, /\.jpg$/);
  assert.ok(aimedia.isAiImage(done.image_file));

  // Used as the product photo, the storefront says it was made with AI.
  await call("PATCH", `/api/products/${product.id}`, { image_file: done.image_file });
  assert.match((await page("/glow-serum")).text, /Photo created with AI/);
  await call("PATCH", `/api/products/${product.id}`, { image_file: "serum.jpg" });

  let v = await call("POST", "/api/ai-media", { kind: "video", image_file: "serum.jpg", preset: "push" });
  assert.equal(v.status, 402); assert.equal(v.body.upgrade, "pro");
  db.prepare("UPDATE accounts SET plan = 'pro' WHERE id = ?").run(me.account.id);
  v = await call("POST", "/api/ai-media", { kind: "video", image_file: "serum.jpg", preset: "push" });
  assert.equal(v.status, 201);
  assert.equal(rp.at(-1).body.input.size, "720*1280");
  rpStatus = "FAILED";
  const failed = (await call("GET", `/api/ai-media/${v.body.id}`)).body;
  assert.equal(failed.status, "failed");
  rpStatus = "COMPLETED";
  assert.equal((await call("GET", "/api/me")).body.account.usage.video, 0, "a failed clip is refunded");
  assert.equal((await call("POST", "/api/ai-media", { kind: "scene", image_file: "serum.jpg", preset: "moon" })).status, 400);
});

test("feeds, link in bio and QR code", async () => {
  const google = (await page("/feeds/google.xml")).text;
  assert.match(google, /<g:id>prd_[\w-]+<\/g:id><g:title>Glow Serum<\/g:title>/);
  assert.match(google, /<g:price>46\.00 USD<\/g:price>/);
  assert.match(google, /<g:link>https:\/\/glow-lab\.grow\.test\/glow-serum<\/g:link>/);
  const meta = (await page("/feeds/meta.csv")).text;
  assert.match(meta.split("\n")[0], /^id,title,description,availability,condition,price,link,image_link,brand$/);

  assert.equal((await call("PATCH", "/api/me", { links: [{ label: "Instagram", url: "javascript:alert(1)" }] })).status, 400);
  const m = (await call("PATCH", "/api/me", { links: [{ label: "Instagram", url: "instagram.com/glowlab" }] })).body;
  assert.deepEqual(m.links, [{ label: "Instagram", url: "https://instagram.com/glowlab" }]);
  assert.equal(m.links_url, "https://glow-lab.grow.test/links");
  const links = (await page("/links")).text;
  assert.match(links, /Shop the store/); assert.match(links, /Glow Serum/); assert.match(links, /href="https:\/\/instagram\.com\/glowlab"/);
  const qr = await call("GET", "/api/qr?target=links");
  assert.equal(qr.type, "image/png");
  assert.equal(qr.body.subarray(1, 4).toString(), "PNG");
  assert.equal((await fetch(`${base}/qr.png?url=${encodeURIComponent("https://glow-lab.grow.test/links")}`)).headers.get("content-type"), "image/png");
  assert.equal((await fetch(`${base}/qr.png?url=${encodeURIComponent("https://evil.example.com/")}`)).status, 400);
});

test("reviews: buyer leaves one from the order link; it shows on the product with stars; seller can hide it", async () => {
  const orderId = "ord_review1";
  db.prepare("INSERT INTO orders (id, seller_id, status, items, subtotal_cents, total_cents, email, paid_at) VALUES (?,?,?,?,?,?,?, datetime('now'))")
    .run(orderId, me.id, "paid", JSON.stringify([{ product_id: product.id, title: "Glow Serum", qty: 1, unit_cents: 4600, kind: "physical" }]), 4600, 4600, "buyer@example.com");
  const t = growth.reviewToken(orderId);
  assert.equal((await page(`/review?t=${orderId}.bad`)).status, 404);
  const form = (await page(`/review?t=${t}`)).text;
  assert.match(form, /How was your order\?/);
  const form1 = new URLSearchParams({ t, product_id: product.id, rating: "5", body: "My skin is glowing.", name: "Ana" }).toString();
  const post = await page("/review", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "Content-Length": Buffer.byteLength(form1) }, body: form1 });
  assert.equal(post.status, 303);
  const form2 = new URLSearchParams({ t, product_id: product.id, rating: "4" }).toString();
  const again = await page("/review", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "Content-Length": Buffer.byteLength(form2) }, body: form2 });
  assert.equal(again.status, 409);
  const pp = (await page("/glow-serum")).text;
  assert.match(pp, /My skin is glowing\./); assert.match(pp, /"aggregateRating":\{"@type":"AggregateRating","ratingValue":5,"reviewCount":1\}/);
  const list = (await call("GET", "/api/reviews")).body;
  assert.equal(list[0].name, "Ana");
  await call("PATCH", `/api/reviews/${list[0].id}`, { status: "hidden" });
  assert.doesNotMatch((await page("/glow-serum")).text, /My skin is glowing/);
});

test("insights count visitors by source (Pro), skipping bots and previews", async () => {
  const visit = (p, h = {}) => page(p, { headers: { "User-Agent": "Mozilla/5.0 iPhone", ...h } });
  await visit("/?utm_source=instagram");
  await visit("/glow-serum", { Referer: "https://www.tiktok.com/@glowlab" });
  await visit("/glow-serum", { "User-Agent": "facebookexternalhit/1.1" });
  await visit("/?theme=noir");
  const i = (await call("GET", "/api/insights?days=7")).body;
  assert.ok(i.visitors >= 1);
  const src = Object.fromEntries(i.sources.map((s) => [s.source, s.visitors]));
  assert.equal(src.instagram, 1); assert.equal(src.tiktok, 1); assert.equal(src.facebook, undefined);
  assert.equal(i.top_products[0].title, "Glow Serum");
  assert.equal(i.daily.length, 7);
  assert.equal(i.orders, 1);
  db.prepare("UPDATE accounts SET plan = 'launch' WHERE id = ?").run(me.account.id);
  assert.equal((await call("GET", "/api/insights")).status, 402);
});

test("checkout reminders: Pro stores with email set up ask Stripe for a recovery link", async () => {
  const seller = db.prepare("SELECT * FROM sellers WHERE id = ?").get(me.id);
  assert.deepEqual(growth.recoveryParams(seller), {}, "no email service, no reminders");
});

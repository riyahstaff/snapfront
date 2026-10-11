// Photo studio (with a stand-in Photoroom), photo labels, and swapping a product's photo.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-studio-"));
process.env.DATA_DIR = tmp;
process.env.PUBLIC_URL = "https://studio.test";
process.env.PHOTOROOM_API_KEY = "sandbox_test";

const { app } = await import("../src/index.js");
const studio = await import("../src/studio.js");
const sharp = (await import("sharp")).default;
// Stand-in for the cut-out model: a 300x200 red "product" on transparent.
let cutouts = 0;
studio.setCutout(async () => {
  cutouts++;
  const png = await sharp({ create: { width: 300, height: 200, channels: 4, background: { r: 200, g: 30, b: 40, alpha: 1 } } }).png().toBuffer();
  return { png, width: 300, height: 200, coverage: 0.4 };
});
const { db } = await import("../src/db.js");

const calls = [];
let fail = null;
studio.setStudioFetch(async (url, init) => {
  const fields = {};
  for (const [k, v] of init.body.entries()) fields[k] = typeof v === "string" ? v : `<file ${v.type} ${v.size}>`;
  calls.push({ url, headers: init.headers, fields });
  if (fail) return { ok: false, status: fail, json: async () => ({ error: { message: "nope" } }) };
  return { ok: true, status: 200, arrayBuffer: async () => new Uint8Array(Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(2000, 7)])).buffer };
});

let server, base;
before(async () => { server = app.listen(0); await new Promise((r) => server.once("listening", r)); base = `http://127.0.0.1:${server.address().port}`; });
after(() => { server.close(); fs.rmSync(tmp, { recursive: true, force: true }); });

let token;
const call = async (method, url, body) => {
  const r = await fetch(base + url, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, body: await r.json().catch(() => null) };
};
const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(400, 1)]).toString("base64");

const imageOf = async (file) => sharp(fs.readFileSync(path.join(tmp, "images", file))).raw().toBuffer({ resolveWithObject: true });
const px = (img, x, y) => { const i = (y * img.info.width + x) * img.info.channels; return [...img.data.subarray(i, i + 3)]; };

test("presets list colours and scenes, all made on our own server", async () => {
  token = (await call("POST", "/api/sellers", { store_name: "Shoe Closet" })).body.token;
  const p = (await call("GET", "/api/studio")).body;
  assert.equal(p.enabled, true);
  assert.equal(p.custom, true, "describing your own needs the Photoroom key, which this test sets");
  assert.ok(p.colors.some((c) => c.id === "white"));
  for (const id of ["match", "beach", "wood", "granite", "marble", "concrete", "linen", "studio", "arch", "pink", "stone"]) {
    assert.ok(p.scenes.some((s) => s.id === id), id);
    if (id !== "match") assert.ok(fs.existsSync(new URL(`../assets/studio/${id}.jpg`, import.meta.url)), `${id}.jpg`);
  }
});

let original, white;
test("a clean colour: product centred on the colour with a shadow under it, no outside service", async () => {
  const r = await call("POST", "/api/studio", { imageBase64: jpeg, style: { color: "white" } });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  ({ image_file: white, source_file: original } = r.body);
  assert.match(r.body.image_url, /^https:\/\/studio\.test\/img\/[\w-]+\.jpg$/);
  assert.equal(calls.length, 0);
  const img = await imageOf(white);
  assert.equal(img.info.width, 1600); assert.equal(img.info.height, 1600);
  const [r0, g0, b0] = px(img, 800, 800);              // the red product sits in the middle
  assert.ok(r0 > 150 && g0 < 80 && b0 < 80, `centre ${[r0, g0, b0]}`);
  const corner = px(img, 40, 40);                       // background stays near white
  assert.ok(corner.every((v) => v > 200), `corner ${corner}`);
  const under = px(img, 800, 800 + Math.round((0.72 * 1600 / 300) * 200 / 2) + 6);   // just below the product: shadow
  assert.ok(under[0] < corner[0] - 10, `shadow ${under} vs ${corner}`);
});

test("scenes use our background photos; matching colour follows the product", async () => {
  let r = await call("POST", "/api/studio", { image_file: original, style: { scene: "beach" } });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const beach = await imageOf(r.body.image_file);
  const sky = px(beach, 800, 60);
  assert.ok(!(sky[0] > 240 && sky[1] > 240 && sky[2] > 240), "beach photo behind, not blank");
  r = await call("POST", "/api/studio", { image_file: original, style: { scene: "match" } });
  const match = await imageOf(r.body.image_file);
  const [mr, mg, mb] = px(match, 30, 30);
  assert.ok(mr > mg && mr > mb && mr > 180, `a soft red-ish backdrop for a red product: ${[mr, mg, mb]}`);
  assert.equal(calls.length, 0);
});

test("describing your own background goes to Photoroom; bad choices are refused before any charge", async () => {
  const r = await call("POST", "/api/studio", { image_file: original, style: { prompt: "on a granite countertop" } });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const c = calls.at(-1);
  assert.equal(c.url, "https://image-api.photoroom.com/v2/edit");
  assert.equal(c.headers["x-api-key"], "sandbox_test");
  assert.equal(c.fields["background.prompt"], "on a granite countertop, professional product photography");
  assert.match(c.fields.imageFile, /<file image\/jpeg/);
  const n = cutouts, m = calls.length;
  assert.equal((await call("POST", "/api/studio", { image_file: original, style: { scene: "moon" } })).status, 400);
  assert.equal((await call("POST", "/api/studio", { image_file: original, style: { color: "#zzz" } })).status, 400);
  assert.equal((await call("POST", "/api/studio", { image_file: "../../etc/passwd", style: { color: "white" } })).status, 400);
  assert.equal((await call("POST", "/api/studio", { image_file: "missing.jpg", style: { color: "white" } })).status, 404);
  assert.equal(cutouts, n); assert.equal(calls.length, m);
  assert.equal((await call("GET", "/api/me")).body.account.usage.studio, 4);
});

test("the allowance runs out, and failures don't use one up", async () => {
  const me = (await call("GET", "/api/me")).body;
  db.prepare("UPDATE usage SET count = 10 WHERE account_id = ? AND kind = 'studio'").run(me.account.id);
  let r = await call("POST", "/api/studio", { image_file: original, style: { color: "sage" } });
  assert.equal(r.status, 402);
  assert.equal(r.body.upgrade, "launch");
  db.prepare("UPDATE accounts SET plan = 'launch' WHERE id = ?").run(me.account.id);
  fail = 400;
  r = await call("POST", "/api/studio", { image_file: original, style: { prompt: "on the moon" } });
  assert.equal(r.status, 400);
  assert.match(r.body.error, /Couldn't find a product/);
  fail = null;
  assert.equal((await call("GET", "/api/me")).body.account.usage.studio, 0);
});

test("a product takes the new photo and a label; the storefront shows the label", async () => {
  const p = (await call("POST", "/api/products", { title: "Court Sneaker", price: 80, image_file: original, kind: "physical" })).body;
  let r = await call("PATCH", `/api/products/${p.id}`, { image_file: white, label: "  New   arrival  " });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.image_file, white);
  assert.equal(r.body.label, "New arrival");
  assert.equal((await call("PATCH", `/api/products/${p.id}`, { image_file: "missing.jpg" })).status, 400);
  const me = (await call("GET", "/api/me")).body;
  db.prepare("UPDATE products SET status = 'live' WHERE id = ?").run(p.id);
  const html = await (await fetch(`${base}/s/${me.store_slug}`)).text();
  assert.match(html, /<span class="tag">New arrival<\/span>/);
  assert.ok(html.includes(white));
});

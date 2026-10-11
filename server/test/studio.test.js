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

test("presets list colours and scenes", async () => {
  token = (await call("POST", "/api/sellers", { store_name: "Shoe Closet" })).body.token;
  const p = (await call("GET", "/api/studio")).body;
  assert.equal(p.enabled, true);
  assert.ok(p.colors.some((c) => c.id === "white"));
  assert.deepEqual(["beach", "wood", "granite", "marble"].every((id) => p.scenes.some((s) => s.id === id)), true);
  assert.equal(p.scenes[0].prompt, undefined, "prompts stay on the server");
});

let original, white;
test("a clean colour background keeps the product and adds a shadow", async () => {
  const r = await call("POST", "/api/studio", { imageBase64: jpeg, style: { color: "white" } });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  ({ image_file: white, source_file: original } = r.body);
  assert.match(r.body.image_url, /^https:\/\/studio\.test\/img\/[\w-]+\.jpg$/);
  assert.ok(fs.existsSync(path.join(tmp, "images", white)) || fs.readdirSync(tmp, { recursive: true }).some((f) => String(f).endsWith(white)));
  const c = calls.at(-1);
  assert.equal(c.url, "https://image-api.photoroom.com/v2/edit");
  assert.equal(c.headers["x-api-key"], "sandbox_test");
  assert.equal(c.fields["background.color"], "FFFFFF");
  assert.equal(c.fields["shadow.mode"], "ai.auto-with-overrides");
  assert.equal(c.fields["outputSize"], "1600x1600");
  assert.match(c.fields.imageFile, /<file image\/jpeg/);
  assert.equal(c.fields["background.prompt"], undefined);
});

test("scenes and custom backgrounds use an AI prompt; bad choices are refused before any charge", async () => {
  let r = await call("POST", "/api/studio", { image_file: original, style: { scene: "beach" } });
  assert.equal(r.status, 200);
  assert.match(calls.at(-1).fields["background.prompt"], /beach sand/);
  assert.equal(calls.at(-1).headers["pr-ai-background-model-version"], "background-studio-beta-2025-03-17");
  assert.equal((await call("POST", "/api/studio", { image_file: "../../etc/passwd", style: { color: "white" } })).status, 400);
  r = await call("POST", "/api/studio", { image_file: original, style: { prompt: "on a granite countertop" } });
  assert.match(calls.at(-1).fields["background.prompt"], /^on a granite countertop, professional product photography$/);
  const n = calls.length;
  assert.equal((await call("POST", "/api/studio", { image_file: original, style: { scene: "moon" } })).status, 400);
  assert.equal((await call("POST", "/api/studio", { image_file: original, style: { color: "#zzz" } })).status, 400);
  assert.equal(calls.length, n);
});

test("the free plan's studio edits run out; Photoroom errors don't use one up", async () => {
  // Free plan: 3 edits, all used above.
  let r = await call("POST", "/api/studio", { image_file: original, style: { color: "sage" } });
  assert.equal(r.status, 402);
  assert.equal(r.body.upgrade, "launch");
  const me = (await call("GET", "/api/me")).body;
  db.prepare("UPDATE accounts SET plan = 'launch' WHERE id = ?").run(me.account.id);
  fail = 400;
  r = await call("POST", "/api/studio", { image_file: original, style: { color: "sage" } });
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

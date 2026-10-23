import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-builder-"));
process.env.DATA_DIR = tmp;
process.env.PUBLIC_URL = "http://127.0.0.1:8080";
const { app } = await import("../src/index.js");
const { db } = await import("../src/db.js");
let server, origin;
before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});
after(() => { server.close(); db.close(); fs.rmSync(tmp, { recursive: true, force: true }); });

async function req(method, route, token, body) {
  const res = await fetch(origin + route, {
    method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { /* HTML preview */ }
  return { status: res.status, json, text, headers: res.headers };
}
const signup = async (name) => (await req("POST", "/api/sellers", null, { store_name: name })).json;
const image = Buffer.concat([Buffer.from("89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4890000000D49444154789C63000100000500010D0A2DB40000000049454E44AE426082", "hex"), Buffer.alloc(200)]).toString("base64");

test("older design drafts cannot replace a chosen store name with the onboarding placeholder", async () => {
  const seller = await signup("Tavi and Friends");
  const changed = await req("PATCH", "/api/me", seller.token, { store_name: "My Snapfront Store", theme: "noir" });
  assert.equal(changed.status, 200);
  assert.equal(changed.json.store_name, "Tavi and Friends");
  assert.equal(changed.json.theme, "noir");
  const page = await req("GET", `/s/${changed.json.store_slug}`);
  assert.equal(page.status, 200);
  assert.match(page.text, /class="brand"[^>]*>Tavi and Friends<\/a>/);
  assert.match(page.text, /© \d{4} Snapfront/);
  assert.doesNotMatch(page.text, /My Snapfront Store/);
  const renamed = await req("PATCH", "/api/me", seller.token, { store_name: "Tavi's New Store" });
  assert.equal(renamed.json.store_name, "Tavi's New Store");
});

 test("staged cover and draft preview do not mutate the live storefront", async () => {
  const seller = await signup("Draft boutique");
  const staged = await req("POST", "/api/storefront/photo", seller.token, { imageBase64: image, mediaType: "image/png" });
  assert.equal(staged.status, 201);
  const me = await req("GET", "/api/me", seller.token);
  assert.equal(me.json.banner_url, null);
  assert.equal(me.json.hero_motion, "still");
  const premium = (await req("GET", "/api/themes")).json.themes.find((t) => t.collection === "premium");
  const patch = { theme: premium.id, banner_file: staged.json.image_file, hero_title: "A considered collection", hero_subtitle: "The seller's own words", hero_motion: "drift", hero_cta: "Browse the edit", about: "Our own store story." };
  const preview = await req("POST", "/api/storefront/preview", seller.token, patch);
  assert.equal(preview.status, 200);
  const html = await req("GET", new URL(preview.json.url).pathname);
  assert.equal(html.status, 200);
  assert.equal(html.headers.get("cache-control"), "no-store");
  assert.match(html.headers.get("x-robots-tag"), /noindex/);
  assert.match(html.text, /Private draft preview/);
  assert.doesNotMatch(html.text, /u\.searchParams\.set\("theme"/);
  assert.match(html.text, /A considered collection/);
  assert.match(html.text, /Browse the edit/);
  assert.ok(html.text.includes(staged.json.image_url));
  const unchanged = (await req("GET", "/api/me", seller.token)).json;
  assert.equal(unchanged.theme, "classic");
  assert.equal(unchanged.hero_title, "");
  assert.equal(unchanged.banner_url, null);
  const applied = await req("PATCH", "/api/me", seller.token, patch);
  assert.equal(applied.status, 200);
  assert.equal(applied.json.theme, premium.id);
  assert.equal(applied.json.hero_title, patch.hero_title);
  assert.equal(applied.json.banner_url, staged.json.image_url);
  assert.equal(applied.json.hero_motion, "drift");
  assert.equal((await req("DELETE", `/api/storefront/photo/${staged.json.image_file}`, seller.token)).status, 409);
  assert.equal(applied.json.stripe_connected, false);
  assert.equal((await req("GET", "/api/products", seller.token)).json.length, 0);
});

test("cross-store photos and invalid settings fail before any partial update", async () => {
  const a = await signup("Photo owner");
  const b = await signup("Other boutique");
  const staged = (await req("POST", "/api/storefront/photo", a.token, { imageBase64: image })).json;
  const rejected = await req("PATCH", "/api/me", b.token, { store_name: "Do not save", banner_file: staged.image_file });
  assert.equal(rejected.status, 400);
  assert.equal((await req("GET", "/api/me", b.token)).json.store_name, "Other boutique");
  assert.equal((await req("POST", "/api/storefront/preview", b.token, { banner_file: staged.image_file })).status, 400);
  assert.equal((await req("PATCH", "/api/me", b.token, { store_name: "Invalid motion", hero_motion: "spin" })).status, 400);
  assert.equal((await req("PATCH", "/api/me", b.token, { store_name: "Invalid theme", theme: "missing" })).status, 400);
  assert.equal((await req("GET", "/api/me", b.token)).json.store_name, "Other boutique");
  assert.equal((await req("POST", "/api/storefront/photo", b.token, { imageBase64: Buffer.alloc(150).toString("base64"), mediaType: "image/jpeg" })).status, 400);
  assert.equal((await req("POST", "/api/storefront/photo", null, { imageBase64: image })).status, 401);
  assert.equal((await req("GET", "/storefront-preview/invalid")).status, 410);
  assert.equal((await req("DELETE", `/api/storefront/photo/${staged.image_file}`, b.token)).status, 404);
  const preview = (await req("POST", "/api/storefront/preview", a.token, { banner_file: staged.image_file })).json;
  assert.equal((await req("DELETE", `/api/storefront/photo/${staged.image_file}`, a.token)).status, 204);
  assert.equal((await req("GET", new URL(preview.url).pathname)).status, 410);
  assert.equal((await req("PATCH", "/api/me", a.token, { banner_file: staged.image_file })).status, 400);
});

test("hero text is bounded, removable, and escaped in rendered HTML", async () => {
  const seller = await signup("Editable words");
  const changed = await req("PATCH", "/api/me", seller.token, { theme: "p-womenswear", hero_title: "x".repeat(180), hero_subtitle: "s".repeat(400), hero_eyebrow: "e".repeat(90), hero_cta: "b".repeat(90) });
  assert.equal(changed.json.hero_title.length, 100);
  assert.equal(changed.json.hero_subtitle.length, 220);
  assert.equal(changed.json.hero_eyebrow.length, 48);
  assert.equal(changed.json.hero_cta.length, 32);
  await req("PATCH", "/api/me", seller.token, { hero_title: "<script>bad()</script>", hero_cta: "<Buy>" });
  const page = await req("GET", `/s/${changed.json.store_slug}`);
  assert.match(page.text, /&lt;script&gt;bad\(\)&lt;\/script&gt;/);
  assert.doesNotMatch(page.text, /<script>bad\(\)<\/script>/);
  const cleared = await req("PATCH", "/api/me", seller.token, { hero_title: "", hero_subtitle: "", hero_eyebrow: "", hero_cta: "", banner_file: null });
  assert.equal(cleared.json.hero_title, "");
  assert.equal(cleared.json.banner_url, null);
});

test("AI returns editable suggestions without saving and counts only successful output", async () => {
  const seller = await signup("Copy boutique");
  const suggestion = { hero_title: "An edit of your favorites", hero_subtitle: "Browse the collection.", hero_eyebrow: "THE EDIT", hero_cta: "Shop the edit", tagline: "Your everyday collection", about: "Find pieces in our collection.", announcement: "" };
  process.env.SNAPFRONT_FAKE_AI = JSON.stringify(suggestion);
  const out = await req("POST", "/api/storefront/copy", seller.token, { notes: "We sell illustrated stationery", tone: "warm" });
  assert.equal(out.status, 200);
  assert.deepEqual(out.json, suggestion);
  const unchanged = (await req("GET", "/api/me", seller.token)).json;
  assert.equal(unchanged.hero_title, "");
  assert.equal(unchanged.account.usage.photo, 1);
  process.env.SNAPFRONT_FAKE_AI = JSON.stringify({ hero_title: "Incomplete" });
  assert.equal((await req("POST", "/api/storefront/copy", seller.token, { notes: "We sell illustrated stationery" })).status, 502);
  assert.equal((await req("GET", "/api/me", seller.token)).json.account.usage.photo, 1);
  delete process.env.SNAPFRONT_FAKE_AI;
  assert.equal((await req("POST", "/api/storefront/copy", seller.token, {})).status, 400);
  assert.equal((await req("POST", "/api/storefront/copy", null, { notes: "Stationery" })).status, 401);
});

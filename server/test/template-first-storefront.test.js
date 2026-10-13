import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-template-first-"));
process.env.DATA_DIR = tmp;
process.env.PUBLIC_URL = "http://127.0.0.1:8080";
const { app } = await import("../src/index.js");
const { db } = await import("../src/db.js");
const { THEMES } = await import("../src/themes.js");
const { materializeTemplatePreview } = await import("../src/template-preview.js");

let server, origin;
before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});
after(() => { server.close(); db.close(); fs.rmSync(tmp, { recursive: true, force: true }); });

async function request(method, route, token, body) {
  const response = await fetch(origin + route, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let json; try { json = JSON.parse(text); } catch { /* expected only for HTML routes */ }
  return { status: response.status, json, text, headers: response.headers };
}
const signup = async (name) => (await request("POST", "/api/sellers", null, { store_name: name })).json;
const png = Buffer.concat([
  Buffer.from("89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4890000000D49444154789C63000100000500010D0A2DB40000000049454E44AE426082", "hex"),
  Buffer.alloc(220),
]).toString("base64");
const stage = async (token) => (await request("POST", "/api/storefront/photo", token, { imageBase64: png, mediaType: "image/png" })).json;

let seller, primary, support;
test("template mode is private, renderer-backed, sample-labelled and commerce-free", async () => {
  seller = await signup("Template first");
  const result = await request("POST", "/api/storefront/template-preview", seller.token, { mode: "template", theme: "classic" });
  assert.equal(result.status, 200);
  assert.equal(result.headers.get("cache-control"), "no-store, max-age=0");
  assert.deepEqual(result.json.theme, { id: "classic", name: "Classic" });
  assert.equal(result.json.mode, "template");
  assert.equal(result.json.sample_products, 3);
  assert.deepEqual(result.json.photo_slots, [{ index: 0, label: "Main photo", image_url: "http://127.0.0.1:8080/theme-assets/candles-hero.webp", sample: true }]);
  assert.match(result.json.html, /Example design/);
  assert.match(result.json.html, /data-sf-photo="0"/);
  assert.match(result.json.html, /data-sf-words/);
  assert.match(result.json.html, /Content-Security-Policy/);
  assert.equal((result.json.html.match(/<script\b/gi) || []).length, 1);
  assert.doesNotMatch(result.json.html, /sfCart|\/checkout|<form\b|<a\b[^>]*\shref=/i);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM products WHERE seller_id=?").get(seller.seller.id).n, 0);
});

test("ordered owned main/media1/media2 slots persist, keep duplicate intent, and replace exact preview copy", async () => {
  primary = await stage(seller.token);
  support = await stage(seller.token);
  const applied = await request("PATCH", "/api/me", seller.token, {
    theme: "p-handbags",
    banner_file: primary.image_file,
    design_photos: [support.image_file, support.image_file],
    hero_title: "Exact headline replacement",
    hero_subtitle: "Exact supporting replacement",
    hero_eyebrow: "EXACT EYEBROW",
    hero_cta: "Exact action",
  });
  assert.equal(applied.status, 200);
  assert.equal(applied.json.banner_file, primary.image_file);
  assert.deepEqual(applied.json.design_photos, [
    { image_file: support.image_file, image_url: support.image_url },
    { image_file: support.image_file, image_url: support.image_url },
  ]);
  const result = await request("POST", "/api/storefront/template-preview", seller.token, { mode: "template", theme: "p-handbags", banner_file: primary.image_file, design_photos: [support.image_file, support.image_file], hero_title: "Exact headline replacement", hero_subtitle: "Exact supporting replacement", hero_eyebrow: "EXACT EYEBROW", hero_cta: "Exact action" });
  assert.equal(result.status, 200);
  assert.equal(result.json.sample_products, 3);
  assert.deepEqual(result.json.photo_slots.map(({ index, image_url, sample }) => ({ index, image_url, sample })), [
    { index: 0, image_url: primary.image_url, sample: false },
    { index: 1, image_url: support.image_url, sample: false },
    { index: 2, image_url: support.image_url, sample: false },
  ]);
  for (const slot of [0, 1, 2]) assert.match(result.json.html, new RegExp(`data-sf-photo="${slot}"`));
  for (const words of ["Exact headline replacement", "Exact supporting replacement", "EXACT EYEBROW", "Exact action"]) assert.match(result.json.html, new RegExp(words));
  assert.equal((await request("DELETE", `/api/storefront/photo/${primary.image_file}`, seller.token)).status, 409);
  assert.equal((await request("DELETE", `/api/storefront/photo/${support.image_file}`, seller.token)).status, 409);
});

test("final mode only renders real live content and does not create sample inventory", async () => {
  const blank = await signup("Final blank");
  const blankFinal = await request("POST", "/api/storefront/template-preview", blank.token, { mode: "final", theme: "p-candles" });
  assert.equal(blankFinal.status, 200);
  assert.equal(blankFinal.json.sample_products, 0);
  assert.deepEqual(blankFinal.json.photo_slots, [{ index: 0, label: "Main photo", image_url: null, sample: false }]);
  assert.match(blankFinal.json.html, /<div class="theme-empty-media" data-sf-photo="0"/);
  assert.doesNotMatch(blankFinal.json.html, /Example design|Illustrative theme demo|candles-hero\.webp/);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM products WHERE seller_id=?").get(blank.seller.id).n, 0);

  const draft = await request("POST", "/api/products", seller.token, { title: "Draft must not be final", price: 12, image_file: primary.image_file });
  assert.equal(draft.status, 201);
  const final = await request("POST", "/api/storefront/template-preview", seller.token, { mode: "final", theme: "p-handbags" });
  assert.equal(final.status, 200);
  assert.equal(final.json.sample_products, 0);
  assert.doesNotMatch(final.json.html, /Draft must not be final|Sample preview/);
  assert.equal((await request("DELETE", `/api/storefront/photo/${primary.image_file}`, seller.token)).status, 409);
});

test("template samples fill only missing multi-photo positions while final mode exposes exact null gaps", async () => {
  const onlyMain = await signup("Ordered template gaps");
  const main = await stage(onlyMain.token);
  const template = await request("POST", "/api/storefront/template-preview", onlyMain.token, {
    mode: "template", theme: "p-handbags", banner_file: main.image_file,
  });
  assert.equal(template.status, 200);
  assert.deepEqual(template.json.photo_slots.map(({ index, image_url, sample }) => ({ index, image_url, sample })), [
    { index: 0, image_url: main.image_url, sample: false },
    { index: 1, image_url: "http://127.0.0.1:8080/theme-assets/handbags-hero.webp", sample: true },
    { index: 2, image_url: "http://127.0.0.1:8080/theme-assets/handbags-hero.webp", sample: true },
  ]);
  assert.match(template.json.html, /Example design/);

  const final = await request("POST", "/api/storefront/template-preview", onlyMain.token, {
    mode: "final", theme: "p-handbags", banner_file: main.image_file,
  });
  assert.equal(final.status, 200);
  assert.deepEqual(final.json.photo_slots.map(({ index, image_url, sample }) => ({ index, image_url, sample })), [
    { index: 0, image_url: main.image_url, sample: false },
    { index: 1, image_url: null, sample: false },
    { index: 2, image_url: null, sample: false },
  ]);
  for (const slot of [0, 1, 2]) assert.match(final.json.html, new RegExp(`data-sf-photo="${slot}"`));
  assert.doesNotMatch(final.json.html, /Example design|handbags-hero\.webp/);
});

test("ordered auxiliary gaps and intentional duplicate ownership stay at their exact renderer indexes", async () => {
  const ordered = await signup("Exact ordered media");
  const photo = await stage(ordered.token);
  const gap = await request("POST", "/api/storefront/template-preview", ordered.token, {
    mode: "final", theme: "p-handbags", banner_file: photo.image_file, design_photos: [null, photo.image_file],
  });
  assert.equal(gap.status, 200);
  assert.deepEqual(gap.json.photo_slots.map(({ index, image_url, sample }) => ({ index, image_url, sample })), [
    { index: 0, image_url: photo.image_url, sample: false },
    { index: 1, image_url: null, sample: false },
    { index: 2, image_url: photo.image_url, sample: false },
  ]);

  const repeated = await request("POST", "/api/storefront/template-preview", ordered.token, {
    mode: "template", theme: "p-handbags", banner_file: photo.image_file, design_photos: [photo.image_file, photo.image_file],
  });
  assert.equal(repeated.status, 200);
  assert.deepEqual(repeated.json.photo_slots.map(({ index, image_url, sample }) => ({ index, image_url, sample })), [
    { index: 0, image_url: photo.image_url, sample: false },
    { index: 1, image_url: photo.image_url, sample: false },
    { index: 2, image_url: photo.image_url, sample: false },
  ]);
});

test("renderer-used slots stay theme-specific and live product fallback is reported as real", () => {
  const sellerForRender = { store_name: "Renderer slots", store_slug: "renderer-slots", theme: "p-handbags", stripe_ready: false };
  const mainOnly = { banner_file: "main.webp" };
  for (const theme of ["p-furniture", "p-jewelry"]) {
    for (const mode of ["template", "final"]) {
      const preview = materializeTemplatePreview({ seller: sellerForRender, patch: { ...mainOnly, theme }, products: [], mode });
      assert.deepEqual(preview.photo_slots.map((slot) => slot.index), [0], `${theme} ${mode}`);
      assert.match(preview.html, /data-sf-photo="0"/, `${theme} ${mode}`);
      assert.doesNotMatch(preview.html, /data-sf-photo="[12]"/, `${theme} ${mode}`);
    }
  }

  const liveFallback = materializeTemplatePreview({
    seller: sellerForRender,
    patch: { theme: "p-handbags" },
    products: [{ id: "live-1", slug: "live-piece", title: "Live piece", image_url: "https://img.test/live-piece.webp", alt_text: "Live piece", price_cents: 1200, currency: "usd", variants: [], in_stock: true, status: "live", kind: "physical", category: "", bullets: [], tags: [], faq: [] }],
    mode: "final",
  });
  assert.deepEqual(liveFallback.photo_slots.map(({ index, image_url, sample }) => ({ index, image_url, sample })), [
    { index: 0, image_url: "https://img.test/live-piece.webp", sample: false },
    { index: 1, image_url: null, sample: false },
    { index: 2, image_url: null, sample: false },
  ]);
  assert.doesNotMatch(liveFallback.html, /Example design/);
});

test("foreign, traversal, URL and demo-asset photo references are rejected without partial updates", async () => {
  const other = await signup("Foreign source");
  const foreign = await stage(other.token);
  const before = (await request("GET", "/api/me", seller.token)).json;
  for (const body of [
    { design_photos: [foreign.image_file] },
    { design_photos: ["../../candles-hero.webp"] },
    { design_photos: ["https://example.test/photo.webp"] },
    { banner_file: "candles-hero.webp" },
  ]) assert.equal((await request("PATCH", "/api/me", seller.token, body)).status, 400);
  const after = (await request("GET", "/api/me", seller.token)).json;
  assert.equal(after.store_name, before.store_name);
  assert.deepEqual(after.design_photos, before.design_photos);
  assert.equal((await request("POST", "/api/storefront/template-preview", seller.token, { mode: "template", design_photos: [foreign.image_file] })).status, 400);
});

test("one deterministic renderer loop accepts every registered theme without public demo leakage", async () => {
  for (const theme of THEMES) {
    const preview = await request("POST", "/api/storefront/template-preview", seller.token, { mode: "template", theme: theme.id, banner_file: primary.image_file, design_photos: [support.image_file, support.image_file] });
    assert.equal(preview.status, 200, theme.id);
    assert.equal(preview.json.theme.id, theme.id, theme.id);
    assert.match(preview.json.html, /^<!doctype html>/i, theme.id);
    assert.doesNotMatch(preview.json.html, /<a\b[^>]*\shref=/i, theme.id);
    const used = [...new Set([...preview.json.html.matchAll(/\bdata-sf-photo="([0-2])"/g)].map((match) => Number(match[1])))].sort();
    assert.deepEqual(preview.json.photo_slots.map((slot) => slot.index), used, theme.id);
  }
});

// Revisioned digital-design compatibility is verified over a local HTTP listener only.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-premium-digital-api-"));
process.env.DATA_DIR = tmp;
process.env.PUBLIC_URL = "http://premium-digital.test";
process.env.STRIPE_SECRET_KEY = "";
process.env.SNAPFRONT_FAKE_AI = JSON.stringify({
  title: "A Complete Meal Prep Guide", tagline: "A practical seven-day routine", description: "Full description.",
  bullets: ["Plan"], suggested_price: 12, category: "Meal planning", tags: ["mealprep"], faq: [],
  content: { chapters: [{ heading: "Start with one meal", paragraphs: ["Keep this complete generated paragraph in the editable document."], tip: "Begin small." }] },
});

const { app } = await import("../src/index.js");
const { db } = await import("../src/db.js");
const { documentHash } = await import("../src/digital-document.js");

let server;
let base;
let owner;

const call = (token, method, url, body) => fetch(base + url, {
  method,
  headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  body: body === undefined ? undefined : JSON.stringify(body),
});
const json = async (response, status) => {
  const value = response.status === 204 ? null : await response.json();
  assert.equal(response.status, status, JSON.stringify(value));
  return value;
};

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  owner = await json(await call(null, "POST", "/api/sellers", { store_name: "Premium Revision Studio" }), 201);
});

after(() => {
  server.close();
  fs.rmSync(tmp, { recursive: true, force: true });
});

test("catalog and static assets keep unversioned legacy picker bytes separate from premium revision 2", async () => {
  const original = await json(await call(null, "GET", "/api/digital-designs"), 200);
  assert.equal(original.version, 1);
  assert.equal(original.templates.length, 50);
  assert.equal(original.templates.find((template) => template.id === "guide-01").design_revision, 1);
  assert.equal(original.templates.find((template) => template.id === "guide-01").preview_url, "/digital-design-assets/guide-01.png");

  const premium = await json(await call(null, "GET", "/api/digital-designs?revision=2"), 200);
  assert.equal(premium.version, 2);
  assert.equal(premium.templates.length, 50);
  assert.equal(premium.templates.find((template) => template.id === "guide-01").design_revision, 2);
  assert.equal(premium.templates.find((template) => template.id === "guide-01").preview_url, "/digital-design-assets/v2/guide-01.png");
  await json(await call(null, "GET", "/api/digital-designs?revision=wat"), 400);

  const v2Asset = await fetch(`${base}/digital-design-assets/v2/guide-01.png`);
  assert.equal(v2Asset.status, 200);
  assert.match(v2Asset.headers.get("cache-control") || "", /immutable/);
  const v1Asset = await fetch(`${base}/digital-design-assets/guide-01.png`);
  assert.equal(v1Asset.status, 200);
  assert.doesNotMatch(v1Asset.headers.get("cache-control") || "", /immutable/);
  assert.equal((await fetch(`${base}/digital-design-assets/v2/not-a-template.png`)).status, 404);
});

test("draft and generated source select a revision explicitly while absent clients stay on revision 1", async () => {
  const absent = await json(await call(owner.token, "POST", "/api/digital-designs/create", {
    template_id: "guide-01", title: "Original offline-picker draft",
  }), 201);
  // Revision 1 is intentionally represented by an absent source field for compatibility with
  // existing saved documents. The selected template is still the frozen revision-1 registry.
  assert.equal(absent.design.document.design_revision, undefined);

  const premium = await json(await call(owner.token, "POST", "/api/digital-designs/create", {
    template_id: "guide-01", title: "Premium native draft", design_revision: 2,
  }), 201);
  assert.equal(premium.design.document.design_revision, 2);

  const generated = await json(await call(owner.token, "POST", "/api/ai/generate", {
    type: "guide", niche: "meal prep for busy people", template_id: "guide-01", design_revision: 2,
  }), 201);
  const generatedSource = await json(await call(owner.token, "GET", `/api/products/${generated.id}/digital-design`), 200);
  assert.equal(generatedSource.document.design_revision, 2);
  assert.equal(generatedSource.document.pages[0].blocks.find((block) => block.kind === "paragraph").text, "Keep this complete generated paragraph in the editable document.");
  assert.equal(generated.has_delivery, true);
});

test("a stored pre-revision source is returned byte-for-byte in shape and exports under its original hash", async () => {
  const original = await json(await call(owner.token, "POST", "/api/digital-designs/create", {
    template_id: "checklist-01", title: "Pre-revision source",
  }), 201);
  const legacyDocument = structuredClone(original.design.document);
  delete legacyDocument.design_revision;
  delete legacyDocument.show_artwork;
  const legacyProduct = await json(await call(owner.token, "POST", "/api/products", {
    title: "Stored old source", kind: "digital", price: 8,
  }), 201);
  db.prepare(`INSERT INTO digital_designs (product_id, seller_id, source_available, document_json, revision, legacy_message)
    VALUES (?,?,?,?,0,NULL)`).run(legacyProduct.id, owner.seller.id, 1, JSON.stringify(legacyDocument));

  const returned = await json(await call(owner.token, "GET", `/api/products/${legacyProduct.id}/digital-design`), 200);
  assert.equal(Object.hasOwn(returned.document, "design_revision"), false);
  assert.deepEqual(returned.document, legacyDocument);

  const expectedHash = documentHash(legacyDocument);
  const exported = await json(await call(owner.token, "POST", `/api/products/${legacyProduct.id}/digital-design/export`, { revision: 0 }), 200);
  assert.equal(exported.document_hash, expectedHash);
  assert.equal(db.prepare("SELECT document_json FROM digital_designs WHERE product_id=?").get(legacyProduct.id).document_json, JSON.stringify(legacyDocument));
});

// Editable digital-design API: use an isolated database and the existing fake-AI hook only.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-digital-designs-"));
process.env.DATA_DIR = tmp;
process.env.PUBLIC_URL = "http://digital.test";
process.env.STRIPE_SECRET_KEY = "";
process.env.SNAPFRONT_FAKE_AI = JSON.stringify({
  title: "A Complete Meal Prep Guide", tagline: "A practical seven-day routine", description: "First paragraph.\n\nSecond paragraph.",
  bullets: ["Plan", "Shop", "Prep", "Repeat", "Review"], suggested_price: 12, category: "Meal planning", tags: ["mealprep"],
  faq: [{ q: "Format?", a: "PDF." }],
  content: { chapters: [{ heading: "Start with one meal", paragraphs: ["Keep this full generated paragraph in the editable document."], tip: "Begin small." }] },
});

const { app } = await import("../src/index.js");
const { db } = await import("../src/db.js");
const commerce = await import("../src/commerce.js");

let server;
let base;
let alice;
let bea;
const call = (token, method, url, body, storeId = null) => fetch(base + url, {
  method,
  headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(storeId ? { "X-Store": storeId } : {}) },
  body: body === undefined ? undefined : JSON.stringify(body),
});
const json = async (response, status) => {
  const value = response.status === 204 ? null : await response.json();
  assert.equal(response.status, status, JSON.stringify(value));
  return value;
};
const signup = async (name) => json(await call(null, "POST", "/api/sellers", { store_name: name }), 201);

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  alice = await signup("Alice Studio");
  bea = await signup("Bea Studio");
});
after(() => {
  server.close();
  fs.rmSync(tmp, { recursive: true, force: true });
});

test("catalog, draft saving, legacy honesty, ownership and optimistic conflicts", async () => {
  const catalog = await json(await call(null, "GET", "/api/digital-designs"), 200);
  assert.equal(catalog.version, 1);
  assert.equal(catalog.templates.length, 50);
  assert.equal(catalog.templates.find((template) => template.id === "guide-01").preview_url, "/digital-design-assets/guide-01.png");

  const made = await json(await call(alice.token, "POST", "/api/digital-designs/create", {
    template_id: "guide-01", title: "Alice's Editable Guide", subtitle: "A source draft", brand: "Alice Studio",
  }), 201);
  assert.equal(made.product.status, "draft");
  assert.equal(made.product.kind, "digital");
  assert.equal(made.design.source_available, true);
  assert.equal(made.design.revision, 0);
  assert.match(made.product.description, /Illustrative editable template content/);

  await json(await call(bea.token, "GET", `/api/products/${made.product.id}/digital-design`), 404);
  const physical = await json(await call(alice.token, "POST", "/api/products", { title: "Physical notebook", kind: "physical", price: 8 }), 201);
  await json(await call(alice.token, "GET", `/api/products/${physical.id}/digital-design`), 400);

  const changed = structuredClone(made.design.document);
  changed.title = "Alice's reviewed source title";
  const saved = await json(await call(alice.token, "PUT", `/api/products/${made.product.id}/digital-design`, { document: changed, revision: 0 }), 200);
  assert.equal(saved.revision, 1);
  assert.equal(saved.document.title, changed.title);
  const conflict = await json(await call(alice.token, "PUT", `/api/products/${made.product.id}/digital-design`, { document: changed, revision: 0 }), 409);
  assert.match(conflict.error, /changed/i);

  // A staged seller-owned image remains protected while a saved digital source references it.
  const image = Buffer.concat([
    Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC", "base64"),
    Buffer.alloc(160),
  ]).toString("base64");
  const staged = await json(await call(alice.token, "POST", "/api/storefront/photo", { imageBase64: image, mediaType: "image/png" }), 201);
  const withImage = structuredClone(saved.document);
  withImage.pages[0].blocks.push({ id: "owned-image", kind: "image", image_file: staged.image_file, image_fit: "cover" });
  await json(await call(alice.token, "PUT", `/api/products/${made.product.id}/digital-design`, { document: withImage, revision: saved.revision }), 200);
  await json(await call(alice.token, "DELETE", `/api/storefront/photo/${staged.image_file}`), 409);

  const legacy = await json(await call(alice.token, "POST", "/api/products", {
    title: "Old attached PDF", kind: "digital", price: 9, delivery_url: "https://files.example/old.pdf",
  }), 201);
  const oldDesign = await json(await call(alice.token, "GET", `/api/products/${legacy.id}/digital-design`), 200);
  assert.equal(oldDesign.source_available, false);
  assert.match(oldDesign.legacy_message, /no editable source/i);
  await json(await call(alice.token, "PUT", `/api/products/${legacy.id}/digital-design`, { document: changed, revision: 0 }), 409);
  const rebuilt = await json(await call(alice.token, "PUT", `/api/products/${legacy.id}/digital-design`, { document: changed, revision: 0, rebuild_legacy: true }), 200);
  assert.equal(rebuilt.source_available, true);
  assert.equal(rebuilt.revision, 1);
  assert.equal((await json(await call(alice.token, "GET", `/api/products/${legacy.id}`), 200)).has_delivery, true);
  assert.equal((await fetch(`${base}/digital-design-assets/guide-01.png`)).status, 200);
  assert.equal((await fetch(`${base}/digital-design-assets/not-a-template.png`)).status, 404);
});

test("preview/export uses local source, attach is reviewed, and paid orders keep an old snapshot", async () => {
  const made = await json(await call(alice.token, "POST", "/api/digital-designs/create", { template_id: "checklist-01", title: "Snapshot checklist" }), 201);
  const preview = await json(await call(alice.token, "POST", `/api/products/${made.product.id}/digital-design/preview`, { document: made.design.document }), 200);
  assert.ok(preview.page_count >= 2); // cover plus at least one source page
  assert.ok(preview.pages[0].svg.includes("<svg"));

  const first = await json(await call(alice.token, "POST", `/api/products/${made.product.id}/digital-design/export`, { revision: 0 }), 200);
  assert.equal(first.revision, 0);
  const privatePdf = await fetch(first.pdf_url.replace("http://digital.test", base));
  assert.equal(privatePdf.status, 200);
  assert.equal((await privatePdf.arrayBuffer()).byteLength > 500, true);
  assert.equal((await fetch(`${base}/files/${first.id}.pdf`)).status, 404); // no static export/files bypass
  const privateCover = await fetch(first.cover_url.replace("http://digital.test", base));
  assert.equal(privateCover.status, 200);
  assert.equal(privateCover.headers.get("content-type"), "image/png");

  const attached = await json(await call(alice.token, "POST", `/api/products/${made.product.id}/digital-design/attach`, { export_id: first.id, revision: 0, acknowledge_live: false }), 200);
  assert.equal(attached.product.has_delivery, true);
  const initialFile = db.prepare("SELECT delivery_file FROM products WHERE id=?").get(made.product.id).delivery_file;
  assert.match(initialFile, /^dexp_.+\.pdf$/);
  const initialBytes = fs.readFileSync(path.join(tmp, "files", initialFile));

  const orderId = "ord_digital_snapshot";
  db.prepare("INSERT INTO orders (id, seller_id, status, items) VALUES (?,?,?,?)").run(orderId, alice.seller.id, "paid", JSON.stringify([
    { product_id: made.product.id, kind: "digital", title: "Snapshot checklist", qty: 1, unit_cents: 1000 },
  ]));
  const nextDocument = structuredClone(attached.design.document);
  nextDocument.pages[0].blocks[0].text = "A newly reviewed replacement checklist";
  const saved = await json(await call(alice.token, "PUT", `/api/products/${made.product.id}/digital-design`, { document: nextDocument, revision: 0 }), 200);
  const second = await json(await call(alice.token, "POST", `/api/products/${made.product.id}/digital-design/export`, { revision: saved.revision }), 200);

  // A live listing needs an explicit reviewed-payload acknowledgement; reusing the same export
  // after confirmation must not create a second cover/file attachment.
  db.prepare("UPDATE products SET status='live' WHERE id=?").run(made.product.id);
  await json(await call(alice.token, "POST", `/api/products/${made.product.id}/digital-design/attach`, { export_id: second.id, revision: saved.revision, acknowledge_live: false }), 409);
  const replacement = await json(await call(alice.token, "POST", `/api/products/${made.product.id}/digital-design/attach`, { export_id: second.id, revision: saved.revision, acknowledge_live: true }), 200);
  assert.notEqual(db.prepare("SELECT delivery_file FROM products WHERE id=?").get(made.product.id).delivery_file, initialFile);
  const snapshot = db.prepare("SELECT * FROM digital_order_downloads WHERE order_id=? AND product_id=?").get(orderId, made.product.id);
  assert.equal(snapshot.delivery_file, initialFile);
  await json(await call(alice.token, "POST", `/api/products/${made.product.id}/digital-design/attach`, { export_id: second.id, revision: saved.revision, acknowledge_live: true }), 200);

  const order = db.prepare("SELECT * FROM orders WHERE id=?").get(orderId);
  const download = commerce.downloadsFor(order)[0].url.replace("http://digital.test", base);
  const delivered = await fetch(download);
  assert.equal(delivered.status, 200);
  assert.deepEqual(Buffer.from(await delivered.arrayBuffer()), initialBytes);
  assert.equal(replacement.design.export.id, second.id);
});

test("legacy AI generation retains a full editable source without a template-selected behavior change", async () => {
  const generated = await json(await call(alice.token, "POST", "/api/ai/generate", { type: "guide", niche: "meal prep for busy people" }), 201);
  assert.equal(generated.kind, "digital");
  assert.equal(generated.has_delivery, true);
  const design = await json(await call(alice.token, "GET", `/api/products/${generated.id}/digital-design`), 200);
  assert.equal(design.source_available, true);
  assert.equal(design.document.pages[0].blocks.find((block) => block.kind === "paragraph").text, "Keep this full generated paragraph in the editable document.");
});


test("private exports reject stale or foreign attachments and account deletion removes saved private artifacts", async () => {
  const owner = await signup("Disposable Studio");
  const made = await json(await call(owner.token, "POST", "/api/digital-designs/create", { template_id: "quotes-03" }), 201);
  const exported = await json(await call(owner.token, "POST", `/api/products/${made.product.id}/digital-design/export`, { revision: 0 }), 200);
  await json(await call(bea.token, "POST", `/api/products/${made.product.id}/digital-design/attach`, { export_id: exported.id, revision: 0 }), 404);
  const changed = structuredClone(made.design.document); changed.title = "A newer source title";
  await json(await call(owner.token, "PUT", `/api/products/${made.product.id}/digital-design`, { document: changed, revision: 0 }), 200);
  await json(await call(owner.token, "POST", `/api/products/${made.product.id}/digital-design/attach`, { export_id: exported.id, revision: 0 }), 409);
  const row = db.prepare("SELECT * FROM digital_design_exports WHERE id=?").get(exported.id);
  assert.ok(fs.existsSync(path.join(tmp, "files", row.pdf_file)));
  assert.ok(fs.existsSync(path.join(tmp, "files", row.cover_file)));
  await json(await call(owner.token, "DELETE", "/api/me"), 204);
  assert.equal(fs.existsSync(path.join(tmp, "files", row.pdf_file)), false);
  assert.equal(fs.existsSync(path.join(tmp, "files", row.cover_file)), false);
  assert.equal(db.prepare("SELECT 1 FROM digital_design_exports WHERE id=?").get(exported.id), undefined);
  assert.equal((await fetch(exported.pdf_url.replace("http://digital.test", base))).status, 404);
});

test("shared cleanup protects a saved design picture without granting another seller access", async () => {
  const media = await import("../src/media-ownership.js");
  const owner = alice.seller.id;
  const row = db.prepare("SELECT document_json FROM digital_designs WHERE seller_id=? AND document_json LIKE '%owned-image%' LIMIT 1").get(owner);
  assert.ok(row);
  const source = JSON.parse(row.document_json);
  const file = source.pages.flatMap((page) => page.blocks).find((block) => block.kind === "image").image_file;
  assert.equal(media.sellerImageIsInUse(owner, file), true);
  assert.equal(media.ownsSellerImage(bea.seller.id, file), false);
});


test("repeat and concurrent exports reuse the same unchanged private revision", async () => {
  const made = await json(await call(alice.token, "POST", "/api/digital-designs/create", { template_id: "hooks-05" }), 201);
  const responses = await Promise.all([1, 2].map(() => call(alice.token, "POST", `/api/products/${made.product.id}/digital-design/export`, { revision: 0 })));
  const exports = await Promise.all(responses.map((response) => json(response, 200)));
  assert.equal(exports[0].id, exports[1].id);
  const repeated = await json(await call(alice.token, "POST", `/api/products/${made.product.id}/digital-design/export`, { revision: 0 }), 200);
  assert.equal(repeated.id, exports[0].id);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM digital_design_exports WHERE product_id=?").get(made.product.id).n, 1);
});

test("an explicitly invalid store never creates a digital product in the default store", async () => {
  const before = db.prepare("SELECT COUNT(*) AS n FROM products WHERE seller_id=?").get(alice.seller.id).n;
  await json(await call(alice.token, "POST", "/api/digital-designs/create", { template_id: "planner-01" }, "deleted-or-foreign-store"), 404);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM products WHERE seller_id=?").get(alice.seller.id).n, before);
});

test("deleting a design product preserves its attached cover reused by another listing", async () => {
  const made = await json(await call(alice.token, "POST", "/api/digital-designs/create", { template_id: "guide-03" }), 201);
  const exported = await json(await call(alice.token, "POST", `/api/products/${made.product.id}/digital-design/export`, { revision: 0 }), 200);
  await json(await call(alice.token, "POST", `/api/products/${made.product.id}/digital-design/attach`, { export_id: exported.id, revision: 0 }), 200);
  const cover = db.prepare("SELECT image_file FROM products WHERE id=?").get(made.product.id).image_file;
  const other = await json(await call(alice.token, "POST", "/api/products", { title: "Reuse cover safely", kind: "physical", price: 9, image_file: cover }), 201);
  await json(await call(alice.token, "DELETE", `/api/products/${made.product.id}`), 204);
  assert.equal(db.prepare("SELECT image_file FROM products WHERE id=?").get(other.id).image_file, cover);
  assert.ok(fs.existsSync(path.join(tmp, "images", cover)));
});

test("generic delivery-link edits preserve old paid buyers and pending checkouts pin the original file", async () => {
  const product = await json(await call(alice.token, "POST", "/api/products", { title: "Pinned old PDF", kind: "digital", price: 12, delivery_url: "https://files.example/original.pdf" }), 201);
  const orderId = "ord_generic_paid_snapshot";
  db.prepare("INSERT INTO orders (id,seller_id,status,items) VALUES (?,?,?,?)").run(orderId, alice.seller.id, "paid", JSON.stringify([{ product_id: product.id, kind: "digital", title: product.title, qty: 1 }]));
  await json(await call(alice.token, "PATCH", `/api/products/${product.id}`, { delivery_url: "https://files.example/replacement.pdf" }), 200);
  assert.equal(commerce.downloadFor(orderId, product.id).delivery_url, "https://files.example/original.pdf");
  db.prepare("UPDATE sellers SET stripe_account_id='acct_fixture',stripe_ready=1 WHERE id=?").run(alice.seller.id);
  db.prepare("UPDATE accounts SET plan='pro' WHERE id=(SELECT account_id FROM sellers WHERE id=?)").run(alice.seller.id);
  db.prepare("UPDATE products SET status='live' WHERE id=?").run(product.id);
  const seller = db.prepare("SELECT * FROM sellers WHERE id=?").get(alice.seller.id);
  const payments = await import("../src/payments.js");
  payments.setStripeClient({ checkout: { sessions: { create: async () => ({ id: "cs_local_fixture", url: "https://example.invalid/local-checkout" }) } } });
  const checkout = await commerce.startCheckout(seller, [{ product_id: product.id, qty: 1 }]);
  assert.equal(commerce.downloadFor(checkout.order_id, product.id), null);
  await json(await call(alice.token, "PATCH", `/api/products/${product.id}`, { delivery_url: "https://files.example/third.pdf" }), 200);
  const pending = db.prepare("SELECT * FROM orders WHERE id=?").get(checkout.order_id);
  commerce.finalizeOrder(checkout.order_id, { id: pending.checkout_session_id, payment_status: "paid" });
  assert.equal(commerce.downloadFor(checkout.order_id, product.id).delivery_url, "https://files.example/replacement.pdf");
});

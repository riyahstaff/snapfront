import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-image-assistant-"));
process.env.DATA_DIR = tmp;
process.env.PUBLIC_URL = "https://image-assistant.test";
process.env.RUNPOD_API_KEY = "test_runpod_key";

const sourceJpeg = await sharp({ create: { width: 620, height: 900, channels: 3, background: "#b43c3c" } })
  .composite([{ input: Buffer.from(`<svg width="620" height="900" xmlns="http://www.w3.org/2000/svg"><text x="80" y="380" font-family="serif" font-size="78" fill="white">ORIGINAL</text><text x="160" y="470" font-family="serif" font-size="58" fill="white">COVER</text></svg>`) }])
  .jpeg().toBuffer();
const providerJpeg = await sharp({ create: { width: 1280, height: 1280, channels: 3, background: "#1e6688" } }).jpeg().toBuffer();

const { app } = await import("../src/index.js");
const imageAssistant = await import("../src/image-assistant.js");
const { db } = await import("../src/db.js");
const { config } = await import("../src/config.js");

const providerCalls = [];
const installDefaultProvider = () => imageAssistant.setImageAssistantFetch(async (url, init = {}) => {
  providerCalls.push({ url, method: init.method || "GET", input: init.body ? JSON.parse(init.body).input : null });
  if (url.endsWith("/qwen-image-t2i/run")) return Response.json({ id: "art-run-1" });
  if (url.endsWith("/qwen-image-edit-2511/run")) return Response.json({ id: "edit-run-1" });
  if (url.includes("/status/art-run-1")) return Response.json({ status: "COMPLETED", output: { image_url: "https://cdn.runpod.ai/rendered.jpg" } });
  if (url.includes("/status/edit-run-1")) return Response.json({ status: "IN_QUEUE" });
  if (url === "https://cdn.runpod.ai/rendered.jpg") return new Response(providerJpeg, { status: 200, headers: { "content-type": "image/jpeg", "content-length": String(providerJpeg.length) } });
  throw new Error(`unexpected provider URL ${url}`);
});
installDefaultProvider();

let server, base, alice, bea;
const call = async (token, method, url, body, store = null) => {
  const response = await fetch(base + url, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(store ? { "X-Store": store } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, body: await response.json().catch(() => null) };
};
const signup = async (name) => {
  const out = await call(null, "POST", "/api/sellers", { store_name: name });
  assert.equal(out.status, 201, JSON.stringify(out.body));
  return out.body;
};
const redCoverBounds = ({ data, info }) => {
  let left = info.width, top = info.height, right = -1, bottom = -1, count = 0;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    const offset = (y * info.width + x) * info.channels;
    const [r, g, b] = data.subarray(offset, offset + 3);
    if (r > 110 && r > g * 1.35 && r > b * 1.35) {
      left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y); count++;
    }
  }
  assert.ok(count > 10_000, "the distinctive source-cover red pixels must be present in the render");
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
};
const meanRgbDifference = (a, b) => {
  let total = 0;
  for (let i = 0; i < a.data.length; i += a.info.channels) {
    total += Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i + 1] - b.data[i + 1]) + Math.abs(a.data[i + 2] - b.data[i + 2]);
  }
  return total / (a.info.width * a.info.height * 3);
};

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  alice = await signup("Alice images");
  bea = await signup("Bea images");
});
after(() => {
  imageAssistant.stopWorker();
  server.close();
  fs.rmSync(tmp, { recursive: true, force: true });
});

test("a global image scan processes four distinct oldest running jobs rather than re-claiming one", async () => {
  const seen = [];
  imageAssistant.setImageAssistantFetch(async (url) => {
    seen.push(url);
    if (url.includes("/status/fair-")) return Response.json({ status: "IN_QUEUE" });
    throw new Error(`unexpected provider URL ${url}`);
  });
  try {
    for (let i = 1; i <= 5; i++) {
      db.prepare(`INSERT INTO image_assistant_jobs
        (id,seller_id,account_id,context,operation,status,prompt,aspect,slot,input_json,request_hash,idempotency_key,provider_job_id,usage_kind,usage_period)
        VALUES (?,?,?,?,?,'running',?,?,?,?,?,?,?,?,?)`).run(
        `iaj_fair_${i}`, alice.seller.id, alice.account.id, "storefront", "storefront-art", "fairness", "square", 0,
        JSON.stringify({ prompt: "fairness" }), `fair-hash-${i}`, `fair-key-${i}`, `fair-${i}`, "scene", "trial"
      );
    }
    const claimed = await imageAssistant.poll();
    assert.deepEqual(claimed, ["iaj_fair_1", "iaj_fair_2", "iaj_fair_3", "iaj_fair_4"]);
    assert.deepEqual(seen.map((url) => url.match(/fair-\d+/)?.[0]), ["fair-1", "fair-2", "fair-3", "fair-4"]);
  } finally {
    db.prepare("DELETE FROM image_assistant_jobs WHERE id LIKE 'iaj_fair_%'").run();
    installDefaultProvider();
  }
});

test("image assistant binds sources, charges atomically, polls a mocked provider, and renders a sharp local mockup", async () => {
  const staged = await call(alice.token, "POST", "/api/storefront/photo", { imageBase64: sourceJpeg.toString("base64"), mediaType: "image/jpeg" });
  assert.equal(staged.status, 201, JSON.stringify(staged.body));
  const foreign = await call(bea.token, "POST", "/api/storefront/photo", { imageBase64: sourceJpeg.toString("base64"), mediaType: "image/jpeg" });
  assert.equal(foreign.status, 201);
  const digital = await call(alice.token, "POST", "/api/products", { title: "A saved digital guide", kind: "digital", price: 12, image_file: staged.body.image_file });
  assert.equal(digital.status, 201, JSON.stringify(digital.body));
  const physical = await call(alice.token, "POST", "/api/products", { title: "Printed guide", kind: "physical", price: 12, image_file: staged.body.image_file });
  assert.equal(physical.status, 201);

  const before = (await call(alice.token, "GET", "/api/me")).body.account.usage;
  const badTraversal = await call(alice.token, "POST", "/api/image-assistant/jobs", { operation: "digital-edit", prompt: "Improve this cover", aspect: "square", image_file: "../../etc/passwd", idempotency_key: "bad-traversal-0001" });
  assert.equal(badTraversal.status, 400);
  const badForeign = await call(alice.token, "POST", "/api/image-assistant/jobs", { operation: "storefront-edit", prompt: "Improve this photo", aspect: "square", slot: 0, image_file: foreign.body.image_file, idempotency_key: "bad-foreign-00001" });
  assert.equal(badForeign.status, 404);
  const badPhysical = await call(alice.token, "POST", "/api/image-assistant/jobs", { operation: "digital-mockup", prompt: "An elegant reader", aspect: "portrait", image_file: staged.body.image_file, product_id: physical.body.id, preset: "chrome", idempotency_key: "bad-physical-0001" });
  assert.equal(badPhysical.status, 400);
  assert.deepEqual((await call(alice.token, "GET", "/api/me")).body.account.usage, before, "invalid sources never consume an allowance");

  const artBody = { operation: "storefront-art", prompt: "A cobalt abstract paper texture", aspect: "square", slot: 1, idempotency_key: "art-idempotency-001" };
  const started = await call(alice.token, "POST", "/api/image-assistant/jobs", artBody);
  assert.equal(started.status, 201, JSON.stringify(started.body));
  assert.equal(started.body.status, "running");
  const privateJob = await call(bea.token, "GET", `/api/image-assistant/jobs/${started.body.id}`);
  assert.equal(privateJob.status, 404, "a job ID from another store never reveals status or output");
  const repeated = await call(alice.token, "POST", "/api/image-assistant/jobs", artBody);
  assert.equal(repeated.status, 201);
  assert.equal(repeated.body.id, started.body.id, "same exact request returns the durable job");
  const changed = await call(alice.token, "POST", "/api/image-assistant/jobs", { ...artBody, prompt: "A different request" });
  assert.equal(changed.status, 409);
  assert.equal((await call(alice.token, "GET", "/api/me")).body.account.usage.scene, before.scene + 1, "exact idempotency records once");

  const completed = await call(alice.token, "GET", `/api/image-assistant/jobs/${started.body.id}`);
  assert.equal(completed.status, 200, JSON.stringify(completed.body));
  assert.equal(completed.body.status, "done");
  assert.match(completed.body.image_url, /^https:\/\/image-assistant\.test\/img\//);
  assert.ok(!JSON.stringify(completed.body).includes("runpod_key"));
  assert.ok(db.prepare("SELECT 1 FROM seller_media WHERE seller_id=? AND image_file=?").get(alice.seller.id, completed.body.image_file));

  const usageBeforePromptRejection = (await call(alice.token, "GET", "/api/me")).body.account.usage;
  const tooLong = await call(alice.token, "POST", "/api/image-assistant/jobs", {
    operation: "storefront-art", prompt: "x".repeat(1201), aspect: "square", slot: 2, idempotency_key: "too-long-prompt-001",
  });
  assert.equal(tooLong.status, 400);
  assert.deepEqual((await call(alice.token, "GET", "/api/me")).body.account.usage, usageBeforePromptRejection, "prompt rejection occurs before allowance use");

  const productCount = db.prepare("SELECT count(*) AS count FROM products WHERE seller_id=?").get(alice.seller.id).count;
  const contextualArt = await call(alice.token, "POST", "/api/image-assistant/jobs", {
    operation: "digital-art", prompt: "A cobalt companion artwork", aspect: "square", product_id: digital.body.id, idempotency_key: "digital-art-context-01",
  });
  assert.equal(contextualArt.status, 201, JSON.stringify(contextualArt.body));
  assert.equal(contextualArt.body.product_id, digital.body.id);
  assert.equal(contextualArt.body.source_file, null);
  assert.equal(db.prepare("SELECT count(*) AS count FROM products WHERE seller_id=?").get(alice.seller.id).count, productCount, "artwork context never manufactures inventory");
  const physicalArt = await call(alice.token, "POST", "/api/image-assistant/jobs", {
    operation: "digital-art", prompt: "A physical context must fail", aspect: "square", product_id: physical.body.id, idempotency_key: "digital-art-physical-01",
  });
  assert.equal(physicalArt.status, 400);
  const foreignArt = await call(bea.token, "POST", "/api/image-assistant/jobs", {
    operation: "digital-art", prompt: "Foreign context must fail", aspect: "square", product_id: digital.body.id, idempotency_key: "digital-art-foreign-01",
  });
  assert.equal(foreignArt.status, 404);

  const mockup = await call(alice.token, "POST", "/api/image-assistant/jobs", {
    operation: "digital-mockup", prompt: "Polished premium presentation", aspect: "portrait", image_file: staged.body.image_file,
    product_id: digital.body.id, preset: "midnight", idempotency_key: "mockup-idempotency-01",
  });
  assert.equal(mockup.status, 201, JSON.stringify(mockup.body));
  assert.equal(mockup.body.status, "done");
  const mockupPath = path.join(tmp, "images", mockup.body.image_file);
  const rendered = await sharp(mockupPath).metadata();
  assert.equal(rendered.width, 1440); assert.equal(rendered.height, 1800); assert.equal(rendered.format, "jpeg");
  const sourcePixels = await sharp(sourceJpeg).raw().toBuffer({ resolveWithObject: true });
  const resultPixels = await sharp(mockupPath).raw().toBuffer({ resolveWithObject: true });
  const bounds = redCoverBounds(resultPixels);
  assert.ok(Math.abs(bounds.width / bounds.height - sourcePixels.info.width / sourcePixels.info.height) < .025, "the display opening follows the actual portrait cover ratio without pillar boxes");
  const recoveredCover = await sharp(mockupPath).extract(bounds).resize(sourcePixels.info.width, sourcePixels.info.height, { fit: "fill" }).raw().toBuffer({ resolveWithObject: true });
  assert.ok(meanRgbDifference(sourcePixels, recoveredCover) < 16, "the deterministic mockup retains the actual source-cover pixels, not rewritten AI artwork");
  assert.equal(db.prepare("SELECT image_file FROM products WHERE id=?").get(digital.body.id).image_file, staged.body.image_file, "generation never silently updates a product");
  assert.equal(db.prepare("SELECT 1 FROM ai_images WHERE file=?").get(mockup.body.image_file), undefined, "deterministic mockups are not labelled AI images");

  // Simulate the seller's explicit Apply action. A later mockup must use this first job's original
  // cover, not put a second presentation frame around the current listing frame.
  db.prepare("UPDATE products SET image_file=? WHERE id=?").run(mockup.body.image_file, digital.body.id);
  const remockup = await call(alice.token, "POST", "/api/image-assistant/jobs", {
    operation: "digital-mockup", prompt: "A second premium presentation", aspect: "square", image_file: mockup.body.image_file,
    product_id: digital.body.id, preset: "chrome", idempotency_key: "mockup-canonical-source-01",
  });
  assert.equal(remockup.status, 201, JSON.stringify(remockup.body));
  assert.equal(remockup.body.source_file, staged.body.image_file, "a same-product result resolves to its recorded original cover");
  assert.deepEqual(await sharp(path.join(tmp, "images", remockup.body.image_file)).metadata().then(({ width, height }) => ({ width, height })), { width: 1600, height: 1600 }, "the requested square output canvas is honored");
  assert.equal(db.prepare("SELECT 1 FROM ai_images WHERE file=?").get(remockup.body.image_file), undefined);
  const wideMockup = await call(alice.token, "POST", "/api/image-assistant/jobs", {
    operation: "digital-mockup", prompt: "A wide editorial presentation", aspect: "wide", image_file: mockup.body.image_file,
    product_id: digital.body.id, preset: "editorial", idempotency_key: "mockup-wide-output-01",
  });
  assert.equal(wideMockup.status, 201, JSON.stringify(wideMockup.body));
  assert.deepEqual(await sharp(path.join(tmp, "images", wideMockup.body.image_file)).metadata().then(({ width, height }) => ({ width, height })), { width: 1800, height: 1266 }, "the requested wide output canvas is honored around the portrait paper");
  assert.equal(db.prepare("SELECT 1 FROM ai_images WHERE file=?").get(wideMockup.body.image_file), undefined);

  const options = await call(alice.token, "GET", "/api/image-assistant?context=digital");
  assert.equal(options.status, 200);
  assert.deepEqual(options.body.mockups.map((p) => p.id), ["chrome", "editorial", "midnight"]);
  assert.ok(options.body.allowance.ai.limit >= options.body.allowance.ai.remaining);
  const previousKey = config.runpodKey;
  config.runpodKey = "";
  const unconfigured = await call(alice.token, "GET", "/api/image-assistant?context=digital");
  config.runpodKey = previousKey;
  assert.equal(unconfigured.body.provider, null);
  assert.equal(unconfigured.body.enabled, true, "digital mockups remain available without a provider");
  assert.match(unconfigured.body.setup_required, /mockups remain available/i);
  assert.ok(providerCalls.some((call) => call.url.endsWith("/qwen-image-t2i/run") && call.input.enable_safety_checker === true));
});

test("prompt, provider, refund, and deletion safety fences are durable and private", async () => {
  const cora = await signup("Cora image safety");
  const calls = [];
  let runCount = 0;
  imageAssistant.setImageAssistantFetch(async (url, init = {}) => {
    calls.push({ url, body: init.body });
    if (url.endsWith("/qwen-image-t2i/run")) return Response.json({ id: `safety-${++runCount}` });
    if (url.includes("/status/safety-1")) return Response.json({ status: "FAILED", error: "provider internals must not leak" });
    if (url.includes("/status/safety-2")) return Response.json({ status: "COMPLETED", output: { image_url: "https://evil.example/unsafe.jpg" } });
    if (url.includes("/status/safety-3")) return Response.json({ status: "COMPLETED", output: { image_url: "https://cdn.runpod.ai/safety-redirect.jpg" } });
    if (url === "https://cdn.runpod.ai/safety-redirect.jpg") return new Response(null, { status: 302, headers: { location: "https://evil.example/redirected.jpg" } });
    throw new Error(`unexpected provider URL ${url}`);
  });
  const count = (period) => db.prepare("SELECT count FROM usage WHERE account_id=? AND period=? AND kind='scene'").get(cora.account.id, period)?.count || 0;
  try {
    const acceptedPrompt = "p".repeat(1200);
    const originalPeriodJob = await call(cora.token, "POST", "/api/image-assistant/jobs", {
      operation: "storefront-art", prompt: acceptedPrompt, aspect: "square", slot: 0, idempotency_key: "original-period-refund-01",
    });
    assert.equal(originalPeriodJob.status, 201, JSON.stringify(originalPeriodJob.body));
    assert.equal(originalPeriodJob.body.prompt.length, 1200, "the full client-supported prompt is retained");
    assert.ok(JSON.parse(calls.at(-1).body).input.prompt.startsWith(acceptedPrompt), "provider receives the complete accepted prompt");

    // Simulate a job charged in a past period while the account now has unrelated current-period use.
    db.transaction(() => {
      db.prepare("UPDATE image_assistant_jobs SET usage_period='2001-01' WHERE id=?").run(originalPeriodJob.body.id);
      db.prepare("UPDATE usage SET count=0 WHERE account_id=? AND period='trial' AND kind='scene'").run(cora.account.id);
      db.prepare("INSERT INTO usage (account_id,period,kind,count) VALUES (?,'2001-01','scene',1) ON CONFLICT(account_id,period,kind) DO UPDATE SET count=1").run(cora.account.id);
      db.prepare("INSERT INTO usage (account_id,period,kind,count) VALUES (?,'trial','scene',7) ON CONFLICT(account_id,period,kind) DO UPDATE SET count=7").run(cora.account.id);
    })();
    const failedOriginal = await call(cora.token, "GET", `/api/image-assistant/jobs/${originalPeriodJob.body.id}`);
    assert.equal(failedOriginal.body.status, "failed");
    assert.match(failedOriginal.body.error, /could not make this image/i);
    assert.equal(count("2001-01"), 0, "only the original charged period is refunded");
    assert.equal(count("trial"), 7, "a later period is never decremented by an old job failure");
    await call(cora.token, "GET", `/api/image-assistant/jobs/${originalPeriodJob.body.id}`);
    assert.equal(count("2001-01"), 0, "repeat reads cannot refund the same job twice");
    db.prepare("UPDATE usage SET count=0 WHERE account_id=? AND period='trial' AND kind='scene'").run(cora.account.id);

    const unsafe = await call(cora.token, "POST", "/api/image-assistant/jobs", {
      operation: "storefront-art", prompt: "Unsafe result URL", aspect: "square", slot: 1, idempotency_key: "unsafe-output-url-001",
    });
    const unsafeDone = await call(cora.token, "GET", `/api/image-assistant/jobs/${unsafe.body.id}`);
    assert.equal(unsafeDone.body.status, "failed");
    assert.equal(count("trial"), 0, "unsafe provider output is refunded");
    assert.ok(!calls.some((entry) => entry.url.startsWith("https://evil.example")), "the server never fetches an unsafe output URL");

    const redirected = await call(cora.token, "POST", "/api/image-assistant/jobs", {
      operation: "storefront-art", prompt: "Unsafe redirect", aspect: "square", slot: 1, idempotency_key: "unsafe-redirect-url-001",
    });
    const redirectedDone = await call(cora.token, "GET", `/api/image-assistant/jobs/${redirected.body.id}`);
    assert.equal(redirectedDone.body.status, "failed");
    assert.equal(count("trial"), 0, "redirect rejection also returns the exact charge");
    assert.ok(calls.some((entry) => entry.url === "https://cdn.runpod.ai/safety-redirect.jpg"));
    assert.ok(!calls.some((entry) => entry.url === "https://evil.example/redirected.jpg"), "unsafe redirects are rejected before a second fetch");

    const ambiguous = await call(cora.token, "POST", "/api/image-assistant/jobs", {
      operation: "storefront-art", prompt: "Ambiguous crash fence", aspect: "square", slot: 2, idempotency_key: "ambiguous-submit-fence-01",
    });
    const callsBeforeRecovery = runCount;
    // This is the durable state left if a process dies after Runpod accepted /run but before its ID
    // is committed. Recovery must fail/refund rather than issue a second /run call.
    db.prepare("UPDATE image_assistant_jobs SET provider_job_id=NULL, submission_started=1, lease_owner=NULL, lease_until=NULL, status='running' WHERE id=?").run(ambiguous.body.id);
    await imageAssistant.poll(ambiguous.body.id);
    const ambiguousRow = db.prepare("SELECT status,refunded,error FROM image_assistant_jobs WHERE id=?").get(ambiguous.body.id);
    assert.deepEqual({ status: ambiguousRow.status, refunded: ambiguousRow.refunded }, { status: "failed", refunded: 1 });
    assert.equal(runCount, callsBeforeRecovery, "stale ambiguous submission is never blindly re-submitted");
    assert.match(ambiguousRow.error, /could not confirm/i);
    assert.equal(count("trial"), 0);

    const doomed = await signup("Deleted image owner");
    const doomedJob = await call(doomed.token, "POST", "/api/image-assistant/jobs", {
      operation: "storefront-art", prompt: "Delete before poll", aspect: "square", slot: 0, idempotency_key: "owner-deletion-privacy-01",
    });
    const callsBeforeDeletionPoll = calls.length;
    db.prepare("DELETE FROM sellers WHERE id=?").run(doomed.seller.id);
    assert.deepEqual(await imageAssistant.poll(doomedJob.body.id), []);
    assert.equal(db.prepare("SELECT 1 FROM image_assistant_jobs WHERE id=?").get(doomedJob.body.id), undefined, "seller deletion cascades private job history");
    assert.equal(calls.length, callsBeforeDeletionPoll, "a deleted owner is never polled or downloaded for");
  } finally {
    installDefaultProvider();
  }
});

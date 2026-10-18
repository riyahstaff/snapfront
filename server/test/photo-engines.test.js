// Premium photo AIs (Google's Nano Banana Pro and Nano Banana 2) for AI lifestyle photos: paid with
// credits instead of the plan's allowance, checked on their own endpoint, refunded when they fail.
// Also: the new video models (Sora 2, Wan 2.6) are offered with their prices and endpoints.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-engines-"));
Object.assign(process.env, { DATA_DIR: tmp, PUBLIC_URL: "https://eng.test", STORE_DOMAIN: "eng.test", RUNPOD_API_KEY: "rp_test" });
delete process.env.CREDIT_MARKUP; delete process.env.CREDIT_VALUE_USD;
const { app } = await import("../src/index.js");
const { db } = await import("../src/db.js");
const plans = await import("../src/plans.js");
const aimedia = await import("../src/aimedia.js");
const credits = await import("../src/credits.js");
const videos = await import("../src/avatar-videos.js");
const sharp = (await import("sharp")).default;

const rp = [];
let outcome = "COMPLETED";
const jpeg = await sharp({ create: { width: 64, height: 80, channels: 3, background: "#a0a0a0" } }).jpeg().toBuffer();
const png = await sharp({ create: { width: 64, height: 80, channels: 3, background: "#a0a0a0" } }).png().toBuffer();
aimedia.setRunpodFetch(async (url, init = {}) => {
  rp.push({ url, body: init.body ? JSON.parse(init.body) : null });
  const ok = (j) => ({ ok: true, status: 200, json: async () => j });
  if (url.endsWith("/run")) return ok({ id: `rp${rp.length}`, status: "IN_QUEUE" });
  if (url.includes("/status/")) return ok(outcome === "COMPLETED" ? { status: "COMPLETED", output: { image_url: "https://image.runpod.ai/out.png", cost: 0.13 } } : { status: outcome, error: "nope" });
  const b = url.endsWith(".png") ? png : jpeg;
  return { ok: true, status: 200, arrayBuffer: async () => b.buffer.slice(b.byteOffset, b.byteOffset + b.length) };
});

let server, base, token, acct;
before(async () => { server = app.listen(0); await new Promise((r) => server.once("listening", r)); base = `http://127.0.0.1:${server.address().port}`; });
after(() => { server.close(); fs.rmSync(tmp, { recursive: true, force: true }); });
const call = async (method, url, body) => {
  const r = await fetch(base + url, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body == null ? undefined : JSON.stringify(body) });
  return { status: r.status, body: await r.json().catch(() => null) };
};

test("set up a store with a product photo", async () => {
  const s = (await call("POST", "/api/sellers", { store_name: "Engine Shop" })).body;
  token = s.token; acct = plans.accountForToken(token);
  const seller = plans.storesOf(acct.id)[0];
  fs.writeFileSync(path.join(tmp, "images", "mug.jpg"), jpeg);
  db.prepare("INSERT INTO seller_media (image_file,seller_id) VALUES (?,?)").run("mug.jpg", seller.id);
});

test("the photo AIs are listed with their price", async () => {
  const p = (await call("GET", "/api/ai-media")).body;
  assert.deepEqual(p.engines.map((e) => e.id), ["standard", "nano-banana-pro", "nano-banana-2"]);
  assert.equal(p.engines[0].credits, 0);
  assert.ok(p.engines[1].credits > 0 && p.engines[2].credits > 0);
});

test("a Nano Banana photo is paid with credits, runs and is checked on its own endpoint, and doesn't use the allowance", async () => {
  const price = (await call("GET", "/api/ai-media")).body.engines.find((e) => e.id === "nano-banana-2").credits;
  const short = await call("POST", "/api/ai-media", { kind: "scene", image_file: "mug.jpg", preset: "cafe", engine: "nano-banana-2" });
  assert.equal(short.status, 402);
  credits.grant(acct.id, 100, "test");
  const usedBefore = db.prepare("SELECT COALESCE(SUM(count),0) AS n FROM usage WHERE account_id = ?").get(acct.id).n;
  const job = await call("POST", "/api/ai-media", { kind: "scene", image_file: "mug.jpg", preset: "cafe", engine: "nano-banana-2" });
  assert.equal(job.status, 201, JSON.stringify(job.body));
  const run = rp.find((r) => r.url.endsWith("google-nano-banana-2-edit/run"));
  assert.deepEqual(run.body.input.images, ["https://eng.test/img/mug.jpg"]);
  assert.equal(run.body.input.resolution, "2k");
  assert.match(run.body.input.prompt, /café table/);
  assert.equal(credits.balance(acct.id), 100 - price);
  assert.equal(db.prepare("SELECT COALESCE(SUM(count),0) AS n FROM usage WHERE account_id = ?").get(acct.id).n, usedBefore);
  const done = (await call("GET", `/api/ai-media/${job.body.id}`)).body;
  assert.equal(done.status, "done");
  assert.ok(rp.some((r) => r.url.includes("google-nano-banana-2-edit/status/")));
  assert.ok(aimedia.isAiImage(done.image_file));
  // The model sent a PNG; it's saved as a real JPEG.
  const meta = await sharp(path.join(tmp, "images", done.image_file)).metadata();
  assert.equal(meta.format, "jpeg");
});

test("a failed premium photo gives the credits back; a failed standard one gives the allowance back", async () => {
  outcome = "FAILED";
  const before = credits.balance(acct.id);
  const job = (await call("POST", "/api/ai-media", { kind: "scene", image_file: "mug.jpg", preset: "cafe", engine: "nano-banana-pro" })).body;
  assert.ok(rp.some((r) => r.url.endsWith("nano-banana-pro-edit/run")));
  assert.ok(credits.balance(acct.id) < before);
  const failed = (await call("GET", `/api/ai-media/${job.id}`)).body;
  assert.equal(failed.status, "failed");
  assert.equal(credits.balance(acct.id), before);
  const usedBefore = db.prepare("SELECT COALESCE(SUM(count),0) AS n FROM usage WHERE account_id = ?").get(acct.id).n;
  const std = (await call("POST", "/api/ai-media", { kind: "scene", image_file: "mug.jpg", preset: "cafe" })).body;
  assert.ok(rp.some((r) => r.url.endsWith("qwen-image-edit-2511/run")));
  await call("GET", `/api/ai-media/${std.id}`);
  assert.equal(db.prepare("SELECT COALESCE(SUM(count),0) AS n FROM usage WHERE account_id = ?").get(acct.id).n, usedBefore);
  assert.equal(credits.balance(acct.id), before);
  assert.equal((await call("POST", "/api/ai-media", { kind: "scene", image_file: "mug.jpg", preset: "cafe", engine: "midjourney" })).status, 400);
  outcome = "COMPLETED";
});

test("Sora 2 and Wan 2.6 are offered, priced per second, on their Runpod endpoints", () => {
  const sora2 = videos.MODELS.find((m) => m.id === "sora2"), wan = videos.MODELS.find((m) => m.id === "wan");
  assert.equal(sora2.endpoint(), "sora-2-i2v");
  assert.equal(wan.endpoint(), "wan-2-6-i2v");
  assert.deepEqual(wan.durations, [5, 10, 15]);
  assert.equal(wan.input({ image: "i", prompt: "p", duration: 10, resolution: "1080p" }).resolution, "1080p");
  assert.equal(wan.input({ image: "i", prompt: "p", duration: 5, resolution: "720p" }).size, undefined);
  assert.ok(videos.priceOf(wan, 5, "720p") < videos.priceOf(videos.MODELS.find((m) => m.id === "seedance"), 5, "720p"));
  assert.deepEqual(sora2.input({ image: "i", prompt: "p", duration: 8, resolution: "720p" }), { prompt: "p", image: "i", duration: 8 });
});

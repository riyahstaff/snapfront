import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-eleven-images-"));
Object.assign(process.env, { DATA_DIR: tmp, PUBLIC_URL: "https://images.test", STORE_DOMAIN: "images.test", RUNPOD_API_KEY: "rp_test", ELEVENLABS_API_KEY: "el_test", ELEVENLABS_IMAGE_BACKUP: "true", ELEVENLABS_IMAGE_DAILY_LIMIT: "100" });
const { app } = await import("../src/index.js");
const { db } = await import("../src/db.js");
const plans = await import("../src/plans.js");
const credits = await import("../src/credits.js");
const media = await import("../src/aimedia.js");
const avatars = await import("../src/avatars.js");
const assistant = await import("../src/image-assistant.js");
const eleven = await import("../src/eleven-image.js");
const jpeg = await sharp({ create: { width: 512, height: 640, channels: 3, background: "#a58272" } }).jpeg().toBuffer();
let upstream = 402, outcome = "completed", remaining = 400000, ambiguous = false;
const primaryCalls = [], imageCalls = [];
const provider = async (url, init = {}) => {
  primaryCalls.push(url);
  if (url.startsWith("https://cdn.elevenlabs.io/")) return new Response(jpeg);
  if (url.endsWith("/run") || url.endsWith("/runsync")) return Response.json(upstream === 200 ? { id: "primary-job", status: "IN_QUEUE" } : { error: "rejected" }, { status: upstream });
  throw new Error(`Unexpected Runpod poll: ${url}`);
};
media.setRunpodFetch(provider);
assistant.setImageAssistantFetch(provider);
assistant.setArtPollMs(1);
eleven.setImageFetch(async (url, init = {}) => {
  if (url.endsWith("/user/subscription")) return Response.json({ tier: "pro", character_limit: remaining, character_count: 0 });
  if (url.includes("/flows/image?")) return Response.json({ generations: [] });
  if (init.method === "POST") {
    imageCalls.push(JSON.parse(init.body));
    if (ambiguous) throw new Error("timeout after possible acceptance");
    return Response.json({ id: `image-${imageCalls.length}`, status: "pending" });
  }
  return Response.json({ status: outcome, content_url: "https://cdn.elevenlabs.io/test.jpg", content_mime_type: "image/jpeg" });
});
avatars.setPhotoScreen(async () => ({ people: 1, face_visible: true, photo: true, adult: true, nudity: false }));
avatars.setBlendPlanner(async () => ({ subject: "woman", skin_tone: "warm golden brown" }));
let server, base, token, account, seller, product;
const call = async (method, route, body) => {
  const r = await fetch(base + route, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: r.status, body: await r.json().catch(() => null) };
};
const used = () => db.prepare("SELECT COALESCE(SUM(count),0) n FROM usage WHERE account_id=?").get(account.id).n;
before(async () => {
  server = app.listen(0); await new Promise((resolve) => server.once("listening", resolve)); base = `http://127.0.0.1:${server.address().port}`;
  const s = await call("POST", "/api/sellers", { store_name: "Backup Images" });
  token = s.body.token; account = plans.accountForToken(token); seller = plans.storesOf(account.id)[0];
  db.prepare("UPDATE accounts SET plan='pro' WHERE id=?").run(account.id); account = plans.accountForToken(token);
  fs.writeFileSync(path.join(tmp, "images", "product.jpg"), jpeg);
  db.prepare("INSERT INTO seller_media (image_file,seller_id) VALUES (?,?)").run("product.jpg", seller.id);
  product = (await call("POST", "/api/products", { title: "Test mug", kind: "physical", price: 12, image_file: "product.jpg" })).body;
});
after(() => { server.close(); fs.rmSync(tmp, { recursive: true, force: true }); });

test("new portraits fall back and retain one allowance charge", async () => {
  const before = used();
  const made = await call("POST", "/api/avatars", { style: "illustrated", look: "lavender jacket" });
  assert.equal(made.status, 201, JSON.stringify(made.body));
  assert.equal(imageCalls.at(-1).aspect_ratio, "4:5");
  assert.match(imageCalls.at(-1).prompt, /lavender jacket/);
  assert.equal(used(), before + 1);
  process.env.ELEVENLABS_IMAGE_BACKUP = "false"; // Existing jobs still finish when new submissions are disabled.
  const done = await avatars.avatar(seller, made.body.id);
  process.env.ELEVENLABS_IMAGE_BACKUP = "true";
  assert.equal(done.status, "done");
  assert.ok(media.isAiImage(done.image_url.split("/").pop()));
  assert.equal(used(), before + 1);
});

test("blends preserve both photos, prompt and ratio; outfits and composites also fall back", async () => {
  const stage = () => avatars.stagePhoto(account, seller, { imageBase64: jpeg.toString("base64"), mediaType: "image/jpeg" });
  const a = await stage(), b = await stage();
  const made = await avatars.blend(account, seller, { photos: [a.id, b.id], consent: true, look: "denim jacket" });
  assert.equal(imageCalls.at(-1).images.length, 2);
  assert.equal(imageCalls.at(-1).images[0].type, "inline_base64");
  assert.equal(imageCalls.at(-1).resolution, "2K");
  assert.match(imageCalls.at(-1).prompt, /denim jacket/);
  assert.match(imageCalls.at(-1).prompt, /Never split or halve/);
  const done = await avatars.avatar(seller, made.id);
  assert.equal(done.status, "done");
  const outfit = await avatars.restyle(account, seller, done.id, { look: "a green sweater" });
  assert.equal(imageCalls.at(-1).images.length, 1);
  assert.equal((await avatars.avatar(seller, outfit.id)).status, "done");
  const shot = await avatars.shoot(account, seller, { avatar_id: done.id, product_id: product.id, pose: "present" });
  assert.equal(imageCalls.at(-1).images.length, 2);
  assert.equal((await avatars.shot(seller, shot.id)).status, "done");
});

test("failed backup blend refunds once without sending a second paid generation", async () => {
  const stage = () => avatars.stagePhoto(account, seller, { imageBase64: jpeg.toString("base64"), mediaType: "image/jpeg" });
  const a = await stage(), b = await stage();
  const before = used();
  const made = await avatars.blend(account, seller, { photos: [a.id, b.id], consent: true });
  const submitted = imageCalls.length;
  outcome = "failed";
  assert.equal((await avatars.avatar(seller, made.id)).status, "failed");
  await avatars.avatar(seller, made.id);
  assert.equal(imageCalls.length, submitted);
  assert.equal(used(), before);
  outcome = "completed";
});

test("lifestyle photo fallback retains the premium price and uses the reference", async () => {
  credits.grant(account.id, 100, "image-test");
  const before = credits.balance(account.id);
  const made = await media.start(account, seller, { kind: "scene", image_file: "product.jpg", preset: "cafe", engine: "nano-banana-pro" });
  assert.equal(imageCalls.at(-1).images.length, 1);
  assert.equal(imageCalls.at(-1).resolution, "2K");
  assert.equal(credits.balance(account.id), before - media.photoEnginePrice(media.PHOTO_ENGINES[1]));
  await media.poll(made.id);
  assert.equal(db.prepare("SELECT status FROM media_jobs WHERE id=?").get(made.id).status, "done");
});

test("Mira artwork and the separate image assistant use fallback, keep idempotency and do not auto-resubmit failures", async () => {
  const bytes = await assistant.generateArtwork("Roses beside a river", { aspect: "portrait" });
  assert.equal((await sharp(bytes).metadata()).format, "jpeg");
  const body = { operation: "storefront-art", prompt: "River and roses", aspect: "wide", slot: 1, idempotency_key: "backup-art-test-001" };
  const made = await call("POST", "/api/image-assistant/jobs", body);
  assert.equal(made.status, 201, JSON.stringify(made.body));
  const n = imageCalls.length;
  const again = await call("POST", "/api/image-assistant/jobs", body);
  assert.equal(again.body.id, made.body.id);
  assert.equal(imageCalls.length, n);
  assert.equal((await call("GET", `/api/image-assistant/jobs/${made.body.id}`)).body.status, "done");
  const before = used();
  const failed = await call("POST", "/api/image-assistant/jobs", { ...body, idempotency_key: "backup-art-test-002" });
  outcome = "failed";
  const attempts = imageCalls.length;
  assert.equal((await call("GET", `/api/image-assistant/jobs/${failed.body.id}`)).body.status, "failed");
  assert.equal(imageCalls.length, attempts);
  assert.equal(used(), before);
  outcome = "completed";
});

test("only explicit balance rejections on image endpoints switch providers", async () => {
  const before = imageCalls.length;
  for (const status of [401, 403, 429, 500]) {
    upstream = status;
    await assert.rejects(media.runpod("qwen-image-t2i/run", { input: { prompt: "a rose" } }));
  }
  upstream = 200;
  assert.equal((await media.runpod("qwen-image-t2i/run", { input: { prompt: "a rose" } })).id, "primary-job");
  upstream = 402;
  for (const ep of ["wan-2-2-i2v-720", "unknown-custom"]) await assert.rejects(media.runpod(`${ep}/run`, { input: { prompt: "a rose" } }));
  assert.equal(imageCalls.length, before);
  process.env.ELEVENLABS_IMAGE_BACKUP = "false";
  await assert.rejects(media.runpod("qwen-image-t2i/run", { input: { prompt: "a rose" } }));
  process.env.ELEVENLABS_IMAGE_BACKUP = "true";
  await assert.rejects(eleven.submit({ prompt: "a rose", images: ["https://foreign.test/private.png"] }), /Upload/);
  assert.equal(imageCalls.length, before);
});

test("reserve, daily cap, uncertain POST and existing legacy jobs are handled safely", async () => {
  const before = imageCalls.length;
  remaining = 49999;
  await assert.rejects(eleven.submit("a rose"), /low on credits/);
  remaining = 400000;
  process.env.ELEVENLABS_IMAGE_DAILY_LIMIT = "0";
  await assert.rejects(eleven.submit("a rose"), /today's limit/);
  process.env.ELEVENLABS_IMAGE_DAILY_LIMIT = "100";
  assert.equal(imageCalls.length, before);
  ambiguous = true;
  await assert.rejects(eleven.submit("a rose"), (e) => e.transient === false);
  ambiguous = false;
  assert.equal(imageCalls.length, before + 1);
  assert.equal(db.prepare("SELECT status FROM image_backups ORDER BY rowid DESC LIMIT 1").get().status, "failed");
  db.prepare("INSERT INTO image_backups (job_id,generation_id,status) VALUES ('avatar:legacy','legacy-id','running')").run();
  const legacy = await media.runpod("qwen-image-t2i/status/eleven-image%3Alegacy-id");
  assert.equal(legacy.status, "COMPLETED");
  assert.equal((await eleven.check()).ready, true);
  assert.equal(primaryCalls.some((url) => url.includes("/status/eleven-image")), false);
});

// Faceless avatars (stand-in Runpod): create an original character, put it in a shot with a
// product, then use that shot for a post and a story in Marketing.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-avatars-"));
Object.assign(process.env, { DATA_DIR: tmp, PUBLIC_URL: "https://avatars.test", STORE_DOMAIN: "avatars.test", RUNPOD_API_KEY: "rp_test" });

const { app } = await import("../src/index.js");
const { db } = await import("../src/db.js");
const sharp = (await import("sharp")).default;
const aimedia = await import("../src/aimedia.js");
const marketing = await import("../src/marketing.js");
const fonts = await import("../src/fonts.js");
const avatars = await import("../src/avatars.js");

fonts.setFontFetch(async () => { throw new Error("offline"); });
marketing.setCutout(async () => ({ png: await sharp({ create: { width: 300, height: 400, channels: 4, background: { r: 120, g: 60, b: 20, alpha: 1 } } }).png().toBuffer(), width: 300, height: 400, coverage: 0.3 }));
const rp = [];
let status = "IN_PROGRESS";
const jpeg = await sharp({ create: { width: 512, height: 640, channels: 3, background: "#8a93a3" } }).jpeg().toBuffer();
aimedia.setRunpodFetch(async (url, init = {}) => {
  rp.push({ url, body: init.body ? JSON.parse(init.body) : null });
  const ok = (j) => ({ ok: true, status: 200, json: async () => j });
  if (url.endsWith("/run")) return ok({ id: `rp${rp.length}`, status: "IN_QUEUE" });
  if (url.includes("/status/")) return ok(status === "COMPLETED" ? { status, output: { image_url: "https://image.runpod.ai/x/out.jpg", cost: 0.02 } } : { status });
  if (url.startsWith("https://image.runpod.ai")) return { ok: true, status: 200, arrayBuffer: async () => new Uint8Array(jpeg).buffer };
  throw new Error(`unexpected ${url}`);
});

let server, base, token, me, product;
before(async () => { server = app.listen(0); await new Promise((r) => server.once("listening", r)); base = `http://127.0.0.1:${server.address().port}`; });
after(() => { server.close(); fs.rmSync(tmp, { recursive: true, force: true }); });
const call = async (method, url, body, t = token) => {
  const r = await fetch(base + url, { method, headers: { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const text = await r.text();
  return { status: r.status, body: text ? JSON.parse(text) : null };
};

test("set up a store with a product photo", async () => {
  const s = (await call("POST", "/api/sellers", { store_name: "Glow Lab" }, null)).body;
  token = s.token;
  me = (await call("PATCH", "/api/me", { store_name: "Glow Lab" })).body;
  fs.writeFileSync(path.join(tmp, "images", "serum.jpg"), await sharp({ create: { width: 800, height: 800, channels: 3, background: "#d9c7b5" } }).jpeg().toBuffer());
  db.prepare("INSERT INTO seller_media (image_file,seller_id) VALUES (?,?)").run("serum.jpg", me.id);
  product = (await call("POST", "/api/products", { title: "Glow Serum", tagline: "Vitamin C", price: 46, kind: "physical", image_file: "serum.jpg", description: "Bright skin." })).body;
  assert.ok(product.id);
  db.prepare("UPDATE accounts SET plan = 'pro' WHERE id = (SELECT account_id FROM sellers WHERE id = ?)").run(me.id);
});

test("avatars are original characters: a real person's likeness is refused", async () => {
  assert.equal(avatars.asksForLikeness("curly hair, oversized cream hoodie, looks like a cozy barista"), false);
  assert.equal(avatars.asksForLikeness("looks like Zendaya in a red dress"), true);
  assert.equal(avatars.asksForLikeness("a celebrity lookalike"), true);
  assert.equal(avatars.asksForLikeness("use my face"), true);
  const r = await call("POST", "/api/avatars", { style: "silhouette", look: "styled exactly like Rihanna" });
  assert.equal(r.status, 400);
  assert.match(r.body.error, /original characters/);
  assert.equal((await call("POST", "/api/avatars", { style: "superhero" })).status, 400);
  assert.equal(rp.length, 0);   // nothing was sent to the AI
});

let avatar;
test("create an avatar: one text-to-image job, counted once, saved as the store's AI photo", async () => {
  const r = await call("POST", "/api/avatars", { style: "chrome", name: "Nova", look: "lilac hoodie, silver sneakers, calm and confident" });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  avatar = r.body;
  assert.equal(avatar.status, "running");
  assert.equal(avatar.name, "Nova");
  const job = rp.at(-1);
  assert.match(job.url, /qwen-image-t2i\/run$/);
  assert.match(job.body.input.prompt, /mirrored|reflective chrome visor/);
  assert.match(job.body.input.prompt, /lilac hoodie/);
  assert.match(job.body.input.prompt, /must not resemble any real person/);
  assert.equal(job.body.input.enable_safety_checker, true);
  // Shots wait until the avatar is ready.
  assert.equal((await call("POST", "/api/avatar-shots", { avatar_id: avatar.id, product_id: product.id, pose: "present" })).status, 409);

  status = "COMPLETED";
  const done = (await call("GET", `/api/avatars/${avatar.id}`)).body;
  assert.equal(done.status, "done");
  assert.match(done.image_url, /^https:\/\/avatars\.test\/img\/[\w-]+\.jpg$/);
  const file = done.image_url.split("/").pop();
  assert.ok(aimedia.isAiImage(file));
  assert.ok(fs.existsSync(path.join(tmp, "images", file)));
  avatar = done;
});

let shot;
test("put the avatar in a shot with a product, then make a post and a story from it", async () => {
  status = "IN_PROGRESS";
  const bad = await call("POST", "/api/avatar-shots", { avatar_id: avatar.id, product_id: product.id });
  assert.equal(bad.status, 400);                                     // no pose or description
  const r = await call("POST", "/api/avatar-shots", { avatar_id: avatar.id, product_id: product.id, pose: "unbox" });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const job = rp.at(-1);
  assert.match(job.url, /qwen-image-edit-2511\/run$/);
  assert.deepEqual(job.body.input.images, [avatar.image_url, "https://avatars.test/img/serum.jpg"]);
  assert.match(job.body.input.prompt, /unboxing the product/);
  assert.match(job.body.input.prompt, /no human face is ever visible/);   // the chrome style's rule rides along
  assert.equal(job.body.input.size, "1024*1280");

  status = "COMPLETED";
  shot = (await call("GET", `/api/avatar-shots/${r.body.id}`)).body;
  assert.equal(shot.status, "done");
  assert.ok(shot.image_url);

  // Marketing accepts the shot as the photo for a feed post and a story.
  for (const format of ["post", "story"]) {
    const post = await call("POST", "/api/marketing/render", { product_id: product.id, kind: "image", template: "spotlight", format, image_url: shot.image_url, copy: { headline: "Meet Nova", cta: "Shop now" } });
    assert.equal(post.status, 200, JSON.stringify(post.body));
    assert.equal(post.body.files.length, 1);
  }
  const list = (await call("GET", "/api/avatars")).body;
  assert.equal(list.avatars.length, 1);
  assert.equal(list.shots.length, 1);
  assert.ok(list.styles.some((s) => s.id === "hands"));
  assert.ok(list.poses.some((p) => p.id === "present"));
});

test("other stores can't use or see someone's avatar", async () => {
  const other = (await call("POST", "/api/sellers", { store_name: "Other" }, null)).body;
  assert.equal((await call("GET", `/api/avatars/${avatar.id}`, null, other.token)).status, 404);
  assert.equal((await call("POST", "/api/avatar-shots", { avatar_id: avatar.id, product_id: product.id, pose: "present" }, other.token)).status, 404);
  assert.equal((await call("GET", `/api/avatar-shots/${shot.id}`, null, other.token)).status, 404);
  assert.equal((await call("DELETE", `/api/avatars/${avatar.id}`, null, other.token)).status, 404);
});

test("a failed avatar gives the allowance back", async () => {
  const used = () => db.prepare("SELECT COALESCE(SUM(count),0) AS n FROM usage WHERE account_id = ? AND kind = 'scene'").get(db.prepare("SELECT account_id FROM sellers WHERE id = ?").get(me.id).account_id).n;
  const before = used();
  status = "IN_PROGRESS";
  const a = (await call("POST", "/api/avatars", { style: "mascot", look: "a round mint-green cloud with tiny arms" })).body;
  assert.equal(used(), before + 1);
  status = "FAILED";
  const failed = (await call("GET", `/api/avatars/${a.id}`)).body;
  assert.equal(failed.status, "failed");
  assert.match(failed.error, /couldn't make this avatar/);
  assert.equal(used(), before);
});

test("deleting an avatar removes it and its shots", async () => {
  assert.equal((await call("DELETE", `/api/avatars/${avatar.id}`)).status, 204);
  const list = (await call("GET", "/api/avatars")).body;
  assert.ok(!list.avatars.some((a) => a.id === avatar.id));
  assert.equal(list.shots.length, 0);
});

/* ---------- avatars from real photos: "Use my photo" and "Blend" ---------- */
let screenReply = { people: 1, face_visible: true, photo: true, adult: true, nudity: false };
const screened = [];
avatars.setPhotoScreen(async (buf) => { screened.push(buf); return screenReply; });
const face = async (color = "#c99a7a") => (await sharp({ create: { width: 900, height: 1200, channels: 3, background: color } })
  .withExif({ IFD0: { Copyright: "secret-location-test" } }).jpeg().toBuffer()).toString("base64");
const staged = () => db.prepare("SELECT COUNT(*) AS n FROM avatar_photos").get().n;

test("uploaded photos are checked first: not an adult, more than one person or nudity is refused", async () => {
  const before = staged();
  for (const [reply, msg] of [
    [{ people: 1, face_visible: true, photo: true, adult: false, nudity: false }, /adults \(18 or older\)/],
    [{ people: 2, face_visible: true, photo: true, adult: true, nudity: false }, /just one person/],
    [{ people: 1, face_visible: true, photo: true, adult: true, nudity: true }, /can't use this photo/],
    [{ people: 1, face_visible: true, photo: false, adult: true, nudity: false }, /real photo/],
    [{ people: 0, face_visible: false, photo: true, adult: true, nudity: false }, /see a face/],
    [{ people: 1, face_visible: true, photo: true, nudity: false }, /adults/],          // unsure counts as no
  ]) {
    screenReply = reply;
    const r = await call("POST", "/api/avatar-photos", { imageBase64: await face(), mediaType: "image/jpeg" });
    assert.equal(r.status, 422, JSON.stringify(r.body));
    assert.match(r.body.error, msg);
  }
  assert.equal(staged(), before);   // nothing kept
  assert.equal((await call("POST", "/api/avatar-photos", { imageBase64: Buffer.from("not a photo at all, just some text that is long enough to pass the size check ok ok ok ok").toString("base64") })).status, 400);
  screenReply = { people: 1, face_visible: true, photo: true, adult: true, nudity: false };
});

let mine;
test("use my photo: a checked photo, saved without its metadata, becomes the avatar at once and for free", async () => {
  const calls = rp.length;
  const up = await call("POST", "/api/avatar-photos", { imageBase64: await face(), mediaType: "image/jpeg" });
  assert.equal(up.status, 201, JSON.stringify(up.body));
  const file = up.body.image_url.split("/").pop();
  const meta = await sharp(path.join(tmp, "images", file)).metadata();
  assert.equal(meta.exif, undefined);                          // location/device data gone
  assert.ok(Math.max(meta.width, meta.height) <= 1536);
  const noConsent = await call("POST", "/api/avatars", { source: "photo", photo: up.body.id });
  assert.equal(noConsent.status, 400);
  assert.match(noConsent.body.error, /agreed/);
  const r = await call("POST", "/api/avatars", { source: "photo", photo: up.body.id, consent: true, name: "Torrey" });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  mine = r.body;
  assert.equal(mine.status, "done");
  assert.equal(mine.source, "photo");
  assert.equal(mine.style, "photo");
  assert.equal(mine.ai_generated, false);
  assert.equal(mine.image_url, up.body.image_url);
  assert.equal(rp.length, calls);                               // no AI step
  assert.equal(db.prepare("SELECT consent_at FROM avatars WHERE id = ?").get(mine.id).consent_at != null, true);
  // A staged photo is used once.
  assert.equal((await call("POST", "/api/avatars", { source: "photo", photo: up.body.id, consent: true })).status, 404);
  // The new options show up, and the photo styles aren't in the style picker.
  const list = (await call("GET", "/api/avatars")).body;
  assert.equal(list.from_photos, true);
  assert.ok(list.mixes.some((m) => m.id === "even"));
  assert.ok(!list.styles.some((s) => s.id === "photo" || s.id === "blend"));
});

test("a photo avatar keeps the real person in shots, and can talk", async () => {
  status = "IN_PROGRESS";
  const r = await call("POST", "/api/avatar-shots", { avatar_id: mine.id, product_id: product.id, pose: "present" });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const prompt = rp.at(-1).body.input.prompt;
  assert.match(prompt, /exact person from image 1/);
  assert.match(prompt, /same face, hair, skin tone/);
  assert.doesNotMatch(prompt, /must not resemble any real person/);
  const v = (await call("GET", "/api/avatar-videos")).body;
  assert.ok(v.talk.styles.includes("photo") && v.talk.styles.includes("blend"));
});

test("blend two photos: two checked photos and consent, one AI job, sources deleted when it's done", async () => {
  const a = (await call("POST", "/api/avatar-photos", { imageBase64: await face("#a07050"), mediaType: "image/jpeg" })).body;
  const b = (await call("POST", "/api/avatar-photos", { imageBase64: await face("#e0b090"), mediaType: "image/jpeg" })).body;
  const files = [a, b].map((x) => path.join(tmp, "images", x.image_url.split("/").pop()));
  assert.equal((await call("POST", "/api/avatars", { source: "blend", photos: [a.id, b.id] })).status, 400);              // no consent
  assert.equal((await call("POST", "/api/avatars", { source: "blend", photos: [a.id, a.id], consent: true })).status, 400); // same photo twice
  assert.equal((await call("POST", "/api/avatars", { source: "blend", photos: [a.id, b.id], consent: true, look: "styled like Beyonce" })).status, 400);
  status = "IN_PROGRESS";
  const r = await call("POST", "/api/avatars", { source: "blend", photos: [a.id, b.id], mix: "1", consent: true, look: "denim jacket" });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  assert.equal(r.body.status, "running");
  assert.equal(r.body.source, "blend");
  const job = rp.at(-1);
  assert.match(job.url, /qwen-image-edit-2511\/run$/);
  assert.deepEqual(job.body.input.images, [a.image_url, b.image_url]);
  assert.match(job.body.input.prompt, /one new adult person/);
  assert.match(job.body.input.prompt, /mostly like the person in image 1/);
  assert.match(job.body.input.prompt, /denim jacket/);
  assert.ok(files.every((f) => fs.existsSync(f)));             // kept while the AI works
  status = "COMPLETED";
  const done = (await call("GET", `/api/avatars/${r.body.id}`)).body;
  assert.equal(done.status, "done");
  const jobId = `rp${rp.indexOf(job) + 1}`;
  assert.ok(rp.some((x) => x.url.endsWith(`qwen-image-edit-2511/status/${jobId}`)));   // checked on the editor, where it runs
  assert.ok(!rp.some((x) => x.url.endsWith(`qwen-image-t2i/status/${jobId}`)));
  assert.equal(done.ai_generated, true);
  assert.ok(files.every((f) => !fs.existsSync(f)));            // then deleted
});

test("a failed blend deletes its photos and gives the allowance back; other stores can't use my photos", async () => {
  const a = (await call("POST", "/api/avatar-photos", { imageBase64: await face("#906040") })).body;
  const b = (await call("POST", "/api/avatar-photos", { imageBase64: await face("#d0a080") })).body;
  const other = (await call("POST", "/api/sellers", { store_name: "Someone Else" }, null)).body;
  assert.equal((await call("POST", "/api/avatars", { source: "photo", photo: a.id, consent: true }, other.token)).status, 404);
  status = "IN_PROGRESS";
  const r = (await call("POST", "/api/avatars", { source: "blend", photos: [a.id, b.id], consent: true })).body;
  status = "FAILED";
  const failed = (await call("GET", `/api/avatars/${r.id}`)).body;
  assert.equal(failed.status, "failed");
  assert.match(failed.error, /couldn't blend/);
  for (const x of [a, b]) assert.ok(!fs.existsSync(path.join(tmp, "images", x.image_url.split("/").pop())));
});

test("unused uploads go after a day; deleting a photo avatar deletes the photo", async () => {
  const p = (await call("POST", "/api/avatar-photos", { imageBase64: await face() })).body;
  const file = path.join(tmp, "images", p.image_url.split("/").pop());
  db.prepare("UPDATE avatar_photos SET created_at = datetime('now', '-25 hours') WHERE id = ?").run(p.id);
  await avatars.poll();
  assert.ok(!fs.existsSync(file));
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM avatar_photos WHERE id = ?").get(p.id).n, 0);
  const photoFile = path.join(tmp, "images", mine.image_url.split("/").pop());
  assert.ok(fs.existsSync(photoFile));
  assert.equal((await call("DELETE", `/api/avatars/${mine.id}`)).status, 204);
  assert.ok(!fs.existsSync(photoFile));
});

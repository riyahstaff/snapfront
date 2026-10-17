// Credits (packs bought with a stand-in Stripe) and avatar videos / talking avatars (stand-in Runpod).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-credits-"));
Object.assign(process.env, { DATA_DIR: tmp, PUBLIC_URL: "https://cv.test", STORE_DOMAIN: "cv.test", STRIPE_SECRET_KEY: "sk_test_fake", RUNPOD_API_KEY: "rp_test", ADMIN_TOKEN: "admin_secret", OWNER_EMAILS: "boss@snapfront.test" });
delete process.env.CREDIT_PACKS; delete process.env.CREDIT_MARKUP; delete process.env.CREDIT_VALUE_USD;

const { app } = await import("../src/index.js");
const { db } = await import("../src/db.js");
const sharp = (await import("sharp")).default;
const pay = await import("../src/payments.js");
const aimedia = await import("../src/aimedia.js");
const narrated = await import("../src/narrated.js");
const credits = await import("../src/credits.js");
const videos = await import("../src/avatar-videos.js");

/* ---------- stand-ins ---------- */
const sessions = new Map(), intents = new Map();
pay.setStripeClient({
  customers: { async create() { return { id: `cus_${sessions.size}` }; } },
  checkout: { sessions: {
    async create(p) { const id = `cs_${sessions.size + 1}`; const s = { id, url: `https://checkout.stripe.com/${id}`, status: "open", ...p }; sessions.set(id, s); return s; },
    async retrieve(id) { return sessions.get(id); },
  } },
  paymentIntents: { async retrieve(id) { return intents.get(id); } },
});
narrated.setVoiceEngine(async () => ({ audio: new Float32Array(2400), sampling_rate: 24000 }));
// A real little video with music, so the voiceover mix runs for real.
const ffmpegPath = (await import("ffmpeg-static")).default;
const sampleMp4 = path.join(tmp, "sample.mp4");
execFileSync(ffmpegPath, ["-y", "-loglevel", "error", "-f", "lavfi", "-i", "color=c=gray:s=180x320:d=2", "-f", "lavfi", "-i", "sine=f=220:d=2", "-shortest", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", sampleMp4]);
const probe = (file) => { try { execFileSync(ffmpegPath, ["-hide_banner", "-i", file], { stdio: "pipe" }); return ""; } catch (e) { return String(e.stderr); } };
const rp = [];
let status = "IN_PROGRESS";
const jpeg = await sharp({ create: { width: 400, height: 500, channels: 3, background: "#8a93a3" } }).jpeg().toBuffer();
aimedia.setRunpodFetch(async (url, init = {}) => {
  rp.push({ url, body: init.body ? JSON.parse(init.body) : null });
  const ok = (j) => ({ ok: true, status: 200, json: async () => j });
  if (url.endsWith("/run")) return ok({ id: `rp${rp.length}`, status: "IN_QUEUE" });
  if (url.includes("/status/")) return ok(status === "COMPLETED" ? { status, output: { video_url: "https://video.runpod.ai/x/out.mp4", cost: 0.5 } } : { status });
  if (url.startsWith("https://video.runpod.ai")) { const b = fs.readFileSync(sampleMp4); return { ok: true, status: 200, arrayBuffer: async () => b.buffer.slice(b.byteOffset, b.byteOffset + b.length) }; }
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
const accountId = () => db.prepare("SELECT account_id FROM sellers WHERE id = ?").get(me.id).account_id;
async function pay4(packId, { refunded = false } = {}) {
  const r = await call("POST", "/api/credits/checkout", { pack: packId });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const s = [...sessions.values()].at(-1);
  Object.assign(s, { status: "complete", payment_status: "paid", payment_intent: `pi_${s.id}` });
  intents.set(`pi_${s.id}`, { id: `pi_${s.id}`, latest_charge: { refunded, disputed: false } });
  return s;
}

test("set up a store, a product and a talking-capable avatar with a photo", async () => {
  const s = (await call("POST", "/api/sellers", { store_name: "Glow Lab" }, null)).body;
  token = s.token;
  me = (await call("PATCH", "/api/me", { store_name: "Glow Lab" })).body;
  fs.writeFileSync(path.join(tmp, "images", "serum.jpg"), jpeg);
  db.prepare("INSERT INTO seller_media (image_file,seller_id) VALUES (?,?)").run("serum.jpg", me.id);
  product = (await call("POST", "/api/products", { title: "Glow Serum", price: 46, kind: "physical", image_file: "serum.jpg", description: "Bright skin." })).body;
  for (const f of ["nova.jpg", "nova-shot.jpg", "visor.jpg", "visor-shot.jpg"]) fs.writeFileSync(path.join(tmp, "images", f), jpeg);
  db.prepare("INSERT INTO avatars (id, seller_id, account_id, name, style, status, image_file) VALUES (?,?,?,?,?,?,?)").run("avt_nova", me.id, accountId(), "Nova", "soft3d", "done", "nova.jpg");
  db.prepare("INSERT INTO avatars (id, seller_id, account_id, name, style, status, image_file) VALUES (?,?,?,?,?,?,?)").run("avt_visor", me.id, accountId(), "Visor", "chrome", "done", "visor.jpg");
  db.prepare("INSERT INTO avatar_shots (id, seller_id, account_id, avatar_id, product_id, pose, prompt, status, image_file) VALUES (?,?,?,?,?,?,?,?,?)").run("shot_nova", me.id, accountId(), "avt_nova", product.id, "present", "x", "done", "nova-shot.jpg");
  db.prepare("INSERT INTO avatar_shots (id, seller_id, account_id, avatar_id, product_id, pose, prompt, status, image_file) VALUES (?,?,?,?,?,?,?,?,?)").run("shot_visor", me.id, accountId(), "avt_visor", product.id, "present", "x", "done", "visor-shot.jpg");
});

test("prices: credits follow the provider's cost with the markup, rounded to 5", () => {
  const by = Object.fromEntries(videos.MODELS.map((m) => [m.id, m]));
  assert.equal(by.kling, undefined);   // retired: Runpod's Kling O1 needs a reference video now
  assert.equal(videos.priceOf(by.vidu, 5, "720p"), 50);
  assert.equal(videos.priceOf(by.vidu, 10, "1080p"), 95);
  assert.equal(videos.priceOf(by.seedance, 5, "720p"), 115);
  assert.equal(videos.priceOf(by.seedance, 5, "1080p"), 285);
  assert.equal(videos.priceOf(by.sora, 4, "720p"), 75);
  assert.equal(videos.priceOf(by.sora, 12, "1080p"), 375);
  assert.equal(videos.talkPrice("720p"), 35);
  assert.equal(videos.talkPrice("480p"), 20);
});

test("no credits, no video: the app is told what's needed", async () => {
  const r = await call("POST", "/api/avatar-videos", { shot_id: "shot_nova", model: "vidu", duration: 5, motion: "showcase" });
  assert.equal(r.status, 402);
  assert.deepEqual(r.body.credits, { need: 50, balance: 0 });
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM avatar_videos").get().n, 0);
  assert.equal(rp.length, 0);
});

test("buying a pack: needs an email, then credits land once (on return and in the sweep)", async () => {
  assert.equal((await call("POST", "/api/credits/checkout", { pack: "creator" })).status, 400);   // no email yet
  db.prepare("UPDATE accounts SET email = 'jo@example.com' WHERE id = ?").run(accountId());
  assert.equal((await call("POST", "/api/credits/checkout", { pack: "nope" })).status, 400);
  const s = await pay4("creator");
  assert.equal(s.mode, "payment");
  assert.equal(s.line_items[0].price_data.unit_amount, 3500);
  assert.equal(s.line_items[0].price_data.product_data.name, "900 Snapfront credits (800 + 100 bonus)");   // every pack gets +100
  assert.equal(s.metadata.snapfront_credits, "creator");
  assert.match(s.success_url, /\/credits\?checkout=done&session_id=\{CHECKOUT_SESSION_ID\}$/);
  const done = (await call("POST", "/api/credits/confirm", { session_id: s.id })).body;
  assert.equal(done.added, 900);
  assert.equal(done.balance, 900);
  assert.deepEqual(done.packs.map((p) => [p.id, p.total]), [["starter", 400], ["creator", 900], ["studio", 2100], ["agency", 5600]]);
  // Coming back twice, or the sweep, never adds them again.
  assert.equal((await call("POST", "/api/credits/confirm", { session_id: s.id })).body.balance, 900);
  db.prepare("UPDATE credit_purchases SET checked_at = datetime('now','-2 days')").run();
  await credits.sweep();
  assert.equal(credits.balance(accountId()), 900);
  // Someone else's payment can't be claimed.
  const other = (await call("POST", "/api/sellers", { store_name: "Other" }, null)).body;
  assert.equal((await call("POST", "/api/credits/confirm", { session_id: s.id }, other.token)).status, 409);
});

test("a refunded or charged-back pack takes its credits back", async () => {
  const s = await pay4("starter");
  await call("POST", "/api/credits/confirm", { session_id: s.id });
  assert.equal(credits.balance(accountId()), 1300);
  intents.get(`pi_${s.id}`).latest_charge.disputed = true;
  db.prepare("UPDATE credit_purchases SET checked_at = datetime('now','-2 days') WHERE session_id = ?").run(s.id);
  await credits.sweep();
  assert.equal(credits.balance(accountId()), 900);
  const kinds = (await call("GET", "/api/credits")).body.history.map((h) => h.kind);
  assert.ok(kinds.includes("reversal"));
});

let kling;   // the first video made (Vidu with a voiceover)
test("Vidu Q3 with a voiceover: our voice is mixed over the model's music, and the model is told nobody speaks", async () => {
  status = "IN_PROGRESS";
  assert.equal((await call("POST", "/api/avatar-videos", { shot_id: "shot_nova", model: "vidu", duration: 5, motion: "unbox", voiceover: "x".repeat(76) })).status, 201);   // trimmed to 75
  const trimmed = db.prepare("SELECT script FROM avatar_videos ORDER BY rowid DESC LIMIT 1").get().script;
  assert.equal(trimmed.length, 75);
  db.prepare("DELETE FROM avatar_videos WHERE script = ?").run(trimmed);
  db.prepare("DELETE FROM credit_ledger WHERE kind = 'spend' AND note LIKE 'Vidu%'").run();
  const r = await call("POST", "/api/avatar-videos", { shot_id: "shot_nova", model: "vidu", duration: 10, resolution: "1080p", motion: "unbox", voiceover: "Plan your whole week in two minutes. Link in bio.", voice: "bf_emma" });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  kling = r.body;
  assert.equal(kling.credits, 95);
  assert.equal(kling.voiceover, true);
  const job = rp.at(-1);
  assert.match(job.url, /vidu-q3-i2v\/run$/);
  assert.deepEqual({ image: job.body.input.image, duration: job.body.input.duration, resolution: job.body.input.resolution, generate_audio: job.body.input.generate_audio, bgm: job.body.input.bgm },
    { image: "https://cv.test/img/nova-shot.jpg", duration: 10, resolution: "1080p", generate_audio: true, bgm: true });
  assert.match(job.body.input.prompt, /opens the packaging/);
  assert.match(job.body.input.prompt, /Nobody speaks/);
  assert.equal(credits.balance(accountId()), 805);

  status = "COMPLETED";
  let v = (await call("GET", `/api/avatar-videos/${kling.id}`)).body;
  for (let i = 0; i < 100 && v.status !== "done"; i++) { await new Promise((s) => setTimeout(s, 100)); v = (await call("GET", `/api/avatar-videos/${kling.id}`)).body; }
  assert.equal(v.status, "done");
  assert.equal(v.note, null);
  assert.match(v.url, /^https:\/\/cv\.test\/media\/[\w-]+\.mp4$/);
  const file = path.join(tmp, "media", v.url.split("/").pop());
  assert.match(probe(file), /Audio: aac/);
  assert.equal(db.prepare("SELECT raw_file FROM avatar_videos WHERE id = ?").get(kling.id).raw_file && fs.existsSync(path.join(tmp, "media", db.prepare("SELECT raw_file FROM avatar_videos WHERE id = ?").get(kling.id).raw_file)), false);   // the version without the voice is cleaned up
  assert.equal(credits.balance(accountId()), 805);   // finishing doesn't charge again
});

test("Seedance 2.5 (sound on, 1080p) and Sora 2 Pro send the right inputs", async () => {
  status = "IN_PROGRESS";
  const sd = await call("POST", "/api/avatar-videos", { shot_id: "shot_nova", model: "seedance", duration: 5, resolution: "1080p", motion: "walk" });
  assert.equal(sd.status, 201, JSON.stringify(sd.body));
  let job = rp.at(-1);
  assert.match(job.url, /16jsvx5ncmm24x\/run$/);
  assert.deepEqual({ image: job.body.input.image, aspect_ratio: job.body.input.aspect_ratio, resolution: job.body.input.resolution, generate_audio: job.body.input.generate_audio },
    { image: "https://cv.test/img/nova-shot.jpg", aspect_ratio: "9:16", resolution: "1080p", generate_audio: true });
  assert.equal(sd.body.credits, 285);
  const so = await call("POST", "/api/avatar-videos", { shot_id: "shot_nova", model: "sora", duration: 8, prompt: "he smiles and holds the phone up to the camera" });
  assert.equal(so.status, 201, JSON.stringify(so.body));
  job = rp.at(-1);
  assert.match(job.url, /sora-2-pro-i2v\/run$/);
  assert.deepEqual({ duration: job.body.input.duration, size: job.body.input.size }, { duration: 8, size: "720p" });
  assert.match(job.body.input.prompt, /holds the phone up/);
  assert.match(job.body.input.prompt, /Nobody speaks: no dialogue, no voices/);
  assert.equal(credits.balance(accountId()), 805 - 285 - 150);
  // Bad choices are refused before anything is charged.
  assert.equal((await call("POST", "/api/avatar-videos", { shot_id: "shot_nova", model: "vidu", duration: 7, motion: "walk" })).status, 400);
  assert.equal((await call("POST", "/api/avatar-videos", { shot_id: "shot_nova", model: "sora", duration: 4, resolution: "4k", motion: "walk" })).status, 400);
  assert.equal((await call("POST", "/api/avatar-videos", { avatar_id: "avt_nova", model: "vidu", duration: 5, motion: "walk" })).status, 400);   // needs a product photo
  // Three in progress is the limit.
  assert.equal((await call("POST", "/api/avatar-videos", { shot_id: "shot_nova", model: "vidu", duration: 5, motion: "walk" })).status, 201);
  assert.equal((await call("POST", "/api/avatar-videos", { shot_id: "shot_nova", model: "vidu", duration: 5, motion: "walk" })).status, 429);
});

test("a failed video gives its credits back, exactly once", async () => {
  const before = credits.balance(accountId());
  status = "FAILED";
  await videos.poll();
  const list = (await call("GET", "/api/avatar-videos")).body;
  const failed = list.videos.filter((v) => v.status === "failed");
  assert.equal(failed.length, 3);
  assert.match(failed[0].error, /credits are back/);
  assert.equal(credits.balance(accountId()), before + 285 + 150 + 50);
  await videos.poll();
  assert.equal(credits.balance(accountId()), before + 285 + 150 + 50);
  assert.equal(list.balance, credits.balance(accountId()));
});

test("talking avatar: Snapfront's voice reads the script, InfiniteTalk lip-syncs it", async () => {
  status = "IN_PROGRESS";
  const before = credits.balance(accountId());
  // Faceless styles can't lip-sync.
  const visor = await call("POST", "/api/avatar-videos", { kind: "talk", shot_id: "shot_visor", script: "Hi, meet my favorite serum." });
  assert.equal(visor.status, 400);
  assert.match(visor.body.error, /faceless by design/);
  const r = await call("POST", "/api/avatar-videos", { kind: "talk", avatar_id: "avt_nova", script: "Hi! This is the serum I use every single morning.", voice: "bf_emma", resolution: "720p" });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  assert.equal(r.body.credits, 35);
  assert.equal(credits.balance(accountId()), before - 35);
  for (let i = 0; i < 50 && !rp.at(-1).url.includes("infinitetalk"); i++) await new Promise((s) => setTimeout(s, 20));
  const job = rp.at(-1);
  assert.match(job.url, /infinitetalk\/run$/);
  assert.equal(job.body.input.image, "https://cv.test/img/nova.jpg");
  assert.match(job.body.input.audio, /^https:\/\/cv\.test\/media\/[\w-]+\.wav$/);
  assert.equal(job.body.input.size, "720p");
  const wavFile = job.body.input.audio.split("/").pop();
  const served = await fetch(`${base}/media/${wavFile}`);
  assert.equal(served.status, 200);
  status = "COMPLETED";
  const done = (await call("GET", `/api/avatar-videos/${r.body.id}`)).body;
  assert.equal(done.status, "done");
  assert.equal(done.script, "Hi! This is the serum I use every single morning.");
  assert.ok(!fs.existsSync(path.join(tmp, "media", wavFile)));   // the voice file is cleaned up
});

test("videos are private to the store; admins can grant credits", async () => {
  const other = (await call("POST", "/api/sellers", { store_name: "Third" }, null)).body;
  assert.equal((await call("GET", `/api/avatar-videos/${kling.id}`, null, other.token)).status, 404);
  assert.equal((await call("POST", "/api/avatar-videos", { shot_id: "shot_nova", model: "vidu", duration: 5, motion: "walk" }, other.token)).status, 404);
  assert.equal((await call("POST", `/api/admin/credits/${other.account.id}`, { amount: 100, note: "Tester" }, "wrong")).status, 401);
  const g = await call("POST", `/api/admin/credits/${other.account.id}`, { amount: 100, note: "Tester" }, "admin_secret");
  assert.equal(g.body.balance, 100);
  assert.equal((await call("DELETE", `/api/avatar-videos/${kling.id}`)).status, 204);
});

test("the owner (OWNER_EMAILS) makes videos without spending credits; others still pay", async () => {
  const boss = (await call("POST", "/api/sellers", { store_name: "Boss" }, null)).body;
  db.prepare("UPDATE accounts SET email = 'Boss@Snapfront.test' WHERE id = ?").run(boss.account.id);
  const bossSeller = db.prepare("SELECT id FROM sellers WHERE account_id = ?").get(boss.account.id).id;
  db.prepare("INSERT INTO avatars (id, seller_id, account_id, name, style, status, image_file) VALUES (?,?,?,?,?,?,?)").run("avt_boss", bossSeller, boss.account.id, "Boss", "soft3d", "done", "nova.jpg");
  db.prepare("INSERT INTO avatar_shots (id, seller_id, account_id, avatar_id, pose, prompt, status, image_file) VALUES (?,?,?,?,?,?,?,?)").run("shot_boss", bossSeller, boss.account.id, "avt_boss", "present", "x", "done", "nova-shot.jpg");
  const opts = (await call("GET", "/api/avatar-videos", null, boss.token)).body;
  assert.equal(opts.free, true);
  assert.equal(opts.balance, 0);
  status = "IN_PROGRESS";
  const r = await call("POST", "/api/avatar-videos", { shot_id: "shot_boss", model: "seedance", duration: 10, resolution: "1080p", motion: "walk" }, boss.token);
  assert.equal(r.status, 201, JSON.stringify(r.body));
  assert.equal(credits.balance(boss.account.id), 0);
  const line = (await call("GET", "/api/credits", null, boss.token)).body;
  assert.equal(line.free, true);
  assert.equal(line.history[0].delta, 0);
  assert.match(line.history[0].note, /owner, free/);
  // A failure doesn't hand the owner credits they never paid.
  status = "FAILED";
  await videos.poll();
  assert.equal(credits.balance(boss.account.id), 0);
  // Everyone else still needs credits.
  assert.equal((await call("GET", "/api/avatar-videos")).body.free, false);
});

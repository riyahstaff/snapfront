// Snapfront Academy (lessons, members-only video links, progress), today's post idea, the community
// links, the UGC creator kit (portfolio page, uploads, scripts, deals) and faceless videos.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-content-"));
Object.assign(process.env, {
  DATA_DIR: tmp, PUBLIC_URL: "https://snapfront.test", STORE_DOMAIN: "", ADMIN_TOKEN: "admin_secret", GOOGLE_PLAY_SERVICE_ACCOUNT: "",
  SNAPFRONT_FAKE_AI: JSON.stringify({
    hook: "POV: your desk finally looks good", film: ["Open on the lamp", "Switch it on", "Show the glow"], on_screen: "Desk glow-up", caption: "Link in bio", hashtags: ["desk", "setup"], cta: "Link in bio",
    hooks: ["I didn't expect this", "Watch this", "Okay wow"], scenes: [{ shot: "Lamp close up", line: "This lamp changed my desk.", text: "Desk glow-up", say: "This lamp changed my whole desk." }, { shot: "Switch on", line: "One tap.", text: "One tap", say: "One tap and it glows." }, { text: "Link in bio", say: "Grab yours from the link in my bio." }],
    tips: ["Film near a window"],
  }),
});

const { app } = await import("../src/index.js");
const { db } = await import("../src/db.js");
const narrated = await import("../src/narrated.js");
const academy = await import("../src/academy.js");
const faceless = await import("../src/faceless.js");
const { dirs } = await import("../src/config.js");
// A stand-in voice: half a second of quiet per piece, so tests don't download the model.
narrated.setVoiceEngine(async () => ({ audio: new Float32Array(12000), sampling_rate: 24000 }));

let server, base, A, slug;
before(async () => {
  server = app.listen(0); await new Promise((r) => server.once("listening", r)); base = `http://127.0.0.1:${server.address().port}`;
  A = await (await fetch(`${base}/api/sellers`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ store_name: "Glow Desk" }) })).json();
  slug = A.seller.store_slug;
});
after(() => { server.close(); fs.rmSync(tmp, { recursive: true, force: true }); });
async function call(token, method, url, body, headers = {}) {
  const raw = Buffer.isBuffer(body);
  const r = await fetch(base + url, { method, headers: { ...(raw ? {} : { "Content-Type": "application/json" }), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers }, body: raw ? body : body ? JSON.stringify(body) : undefined });
  const text = await r.text();
  return { status: r.status, json: () => JSON.parse(text), text };
}
const pro = () => db.prepare("UPDATE accounts SET plan = 'pro' WHERE id = ?").run(A.account.id);
const free = () => db.prepare("UPDATE accounts SET plan = 'free' WHERE id = ?").run(A.account.id);

test("Academy: the first module is free, the rest is for members; video links are signed and expire", async () => {
  const c = (await call(A.token, "GET", "/api/academy")).json();
  assert.equal(c.member, false);
  assert.ok(c.total >= 15);
  assert.ok(c.modules[0].lessons.every((l) => !l.locked));
  assert.ok(c.modules[1].lessons.every((l) => l.locked));
  assert.ok(c.modules.some((m) => m.lessons.some((l) => l.id === "tiktok-live")) && c.modules.some((m) => m.lessons.some((l) => l.id === "top-10")));
  assert.equal((await call(A.token, "GET", "/api/academy/tiktok-live")).status, 402);

  // Build one lesson's video with the (stand-in) open-source voice.
  assert.equal(await academy.buildMissing({ only: ["welcome"] }), 1);
  const l = (await call(A.token, "GET", "/api/academy/welcome")).json();
  assert.equal(l.video_status, "ready");
  assert.match(l.video, /^https:\/\/snapfront\.test\/academy-media\/welcome\.mp4\?e=\d+&s=/);
  assert.ok(l.guide.length >= 3 && l.transcript.includes("Welcome to Snapfront Academy"));
  const local = l.video.replace("https://snapfront.test", base);
  const v = await fetch(local);
  assert.equal(v.status, 200);
  assert.equal(v.headers.get("content-type"), "video/mp4");
  const u = new URL(local); u.searchParams.set("s", "forged");
  assert.equal((await fetch(u)).status, 403);
  u.searchParams.set("e", "1");
  assert.equal((await fetch(u)).status, 403);
  // Nothing to rebuild unless the lesson changes.
  assert.equal(await academy.buildMissing({ only: ["welcome"] }), 0);

  const after1 = (await call(A.token, "POST", "/api/academy/welcome/done", {})).json();
  assert.equal(after1.done, 1);
  pro();
  assert.equal((await call(A.token, "GET", "/api/academy/tiktok-live")).status, 200);
  assert.equal((await call(A.token, "GET", "/api/academy/nope")).status, 404);
});

test("today's post idea is written for the store, kept for the day, with up to 3 fresh ideas", async () => {
  const d = (await call(A.token, "GET", "/api/daily-prompt")).json();
  assert.equal(d.hook, "POV: your desk finally looks good");
  assert.ok(d.film.length && d.kind_name);
  assert.equal(d.more_left, 2);
  assert.deepEqual((await call(A.token, "GET", "/api/daily-prompt")).json(), d);   // same idea all day
  assert.equal((await call(A.token, "GET", "/api/daily-prompt?fresh=1")).json().more_left, 1);
  assert.equal((await call(A.token, "GET", "/api/daily-prompt?fresh=1")).json().more_left, 0);
  assert.equal((await call(A.token, "GET", "/api/daily-prompt?fresh=1")).status, 429);
});

test("community links are set by Snapfront's owner; the Discord invite is for members", async () => {
  assert.equal((await call(null, "PUT", "/api/admin/settings", { discord_url: "https://discord.gg/abc" })).status, 401);
  assert.equal((await call("admin_secret", "PUT", "/api/admin/settings", { discord_url: "javascript:alert(1)" })).status, 400);
  const s = (await call("admin_secret", "PUT", "/api/admin/settings", { discord_url: "https://discord.gg/snapfront", whop_url: "https://whop.com/snapfront", live_schedule: "Thursdays at 8 PM Eastern" })).json();
  assert.equal(s.discord_url, "https://discord.gg/snapfront");
  assert.equal((await call(A.token, "GET", "/api/community")).json().discord, "https://discord.gg/snapfront");
  free();
  const c = (await call(A.token, "GET", "/api/community")).json();
  assert.deepEqual([c.discord, c.has_discord, c.whop], [null, true, "https://whop.com/snapfront"]);
  pro();
});

test("UGC kit: portfolio page with uploaded videos, rates and contact; scripts; deal tracker", async () => {
  const k = (await call(A.token, "GET", "/api/ugc")).json();
  assert.ok(k.platforms.creators.some((p) => p.name === "Insense"));
  assert.equal(k.profile.enabled, false);
  assert.equal((await fetch(`${base}/s/${slug}/ugc`)).status, 404);

  // Upload a real (tiny) video; it's re-encoded and gets a poster. Junk is refused.
  const clip = path.join(tmp, "clip.mov");
  execFileSync((await import("ffmpeg-static")).default, ["-y", "-f", "lavfi", "-i", "color=c=red:s=320x568:d=1", "-c:v", "libx264", "-pix_fmt", "yuv420p", clip], { stdio: "ignore" });
  assert.equal((await call(A.token, "POST", "/api/ugc/videos?title=Unboxing", Buffer.from("<script>alert(1)</script>".repeat(100)), { "Content-Type": "video/mp4" })).status, 400);
  // A playlist pretending to be a video (it would make ffmpeg read files off the server) is refused.
  const evil = Buffer.from("#EXTM3U\n#EXT-X-MEDIA-SEQUENCE:0\n#EXTINF:10.0,\nconcat:file:///etc/passwd\n#EXT-X-ENDLIST\n".padEnd(2000, " "));
  assert.equal((await call(A.token, "POST", "/api/ugc/videos", evil, { "Content-Type": "video/mp4" })).status, 400);
  const up = await call(A.token, "POST", "/api/ugc/videos?title=Unboxing", fs.readFileSync(clip), { "Content-Type": "video/quicktime" });
  assert.equal(up.status, 201, up.text);
  const item = up.json().items[0];
  assert.match(item.file, /^[\w-]+\.mp4$/);
  assert.ok(fs.existsSync(path.join(dirs.media, item.file)));

  await call(A.token, "PUT", "/api/ugc/profile", { email: "nope" }).then((r) => assert.equal(r.status, 400));
  const p = (await call(A.token, "PUT", "/api/ugc/profile", { enabled: true, name: "Ava <b>Creates</b>", headline: "Cozy home UGC", niches: "home, decor", email: "ava@example.com",
    rates: [{ label: "1 video", price: 150 }], items: [{ id: item.id, title: "Unboxing a lamp" }, { url: "tiktok.com/@ava/video/1", title: "My TikTok" }] })).json();
  assert.equal(p.items.length, 2);
  const page = await (await fetch(`${base}/s/${slug}/ugc`)).text();
  assert.match(page, /Ava &lt;b&gt;Creates&lt;\/b&gt;/);   // escaped
  assert.match(page, /<video src="https:\/\/snapfront\.test\/media\/[\w-]+\.mp4"/);
  assert.match(page, /\$150/);
  assert.match(page, /mailto:ava@example\.com/);
  free();
  assert.equal((await call(A.token, "PUT", "/api/ugc/profile", { enabled: true })).status, 402);
  pro();

  const sc = (await call(A.token, "POST", "/api/ugc/script", { brand: "Lumo", product: "Desk lamp", style: "unboxing", seconds: 30 })).json();
  assert.equal(sc.hooks.length, 3);
  assert.ok(sc.scenes.length >= 2);

  const d1 = (await call(A.token, "POST", "/api/ugc/deals", { brand: "Lumo", amount: 150, status: "booked", due: "2026-11-01" })).json();
  await call(A.token, "POST", "/api/ugc/deals", { brand: "Nook", amount: 300, status: "pitched" });
  assert.equal((await call(A.token, "POST", "/api/ugc/deals", { brand: "" })).status, 400);
  await call(A.token, "PATCH", `/api/ugc/deals/${d1.id}`, { status: "paid" });
  const t = (await call(A.token, "GET", "/api/ugc")).json().totals;
  assert.deepEqual([t.paid, t.pipeline], [150, 300]);
  // Another account can't touch it.
  const B = await (await fetch(`${base}/api/sellers`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })).json();
  assert.equal((await call(B.token, "PATCH", `/api/ugc/deals/${d1.id}`, { status: "lost" })).status, 404);
});

test("faceless video: AI script for a product, edited, then narrated over the product photo", async () => {
  // A product with a real photo.
  const img = path.join(dirs.images, "lamp.png");
  fs.mkdirSync(dirs.images, { recursive: true });
  execFileSync((await import("ffmpeg-static")).default, ["-y", "-f", "lavfi", "-i", "color=c=orange:s=800x800:d=1", "-frames:v", "1", img], { stdio: "ignore" });
  const pr = (await call(A.token, "POST", "/api/products", { title: "Glow Lamp", price: 39 })).json();
  db.prepare("UPDATE products SET image_file = 'lamp.png', status = 'live' WHERE id = ?").run(pr.id);

  assert.equal((await call(A.token, "POST", "/api/faceless/script", { product_id: "prd_other" })).status, 404);
  const s = (await call(A.token, "POST", "/api/faceless/script", { product_id: pr.id, style: "pov" })).json();
  assert.equal(s.scenes.length, 3);
  s.scenes[1].text = "Edited by me";
  assert.equal((await call(A.token, "POST", "/api/faceless/videos", { product_id: pr.id, script: { scenes: [{ text: "x" }] } })).status, 400);
  const j = (await call(A.token, "POST", "/api/faceless/videos", { product_id: pr.id, voice: "bm_george", script: s })).json();
  assert.equal(j.status, "queued");
  assert.equal(await faceless.work(), 1);
  const done = (await call(A.token, "GET", `/api/faceless/videos/${j.id}`)).json();
  assert.equal(done.status, "done", JSON.stringify(done));
  assert.match(done.url, /\/media\/[\w-]+\.mp4$/);
  const probe = execFileSync((await import("ffmpeg-static")).default.replace(/ffmpeg$/, "ffmpeg"), ["-i", path.join(dirs.media, path.basename(done.url)), "-f", "null", "-"], { stdio: ["ignore", "ignore", "pipe"] });
  assert.ok(probe !== undefined);
  assert.equal((await call(A.token, "GET", "/api/faceless")).json().jobs[0].id, j.id);
  assert.equal((await call(A.token, "DELETE", `/api/faceless/videos/${j.id}`)).status, 204);
});

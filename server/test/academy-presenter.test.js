// Academy lessons taught by an avatar (stand-in voice and talking head): only the owner (or the studio
// token) can set the presenter and upload screen demos; a lesson that opts in is rebuilt with the
// avatar on every slide and the phone recording on demo slides; others keep their plain video.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-presenter-"));
const STUDIO = "studio_token_for_tests_0123456789";
Object.assign(process.env, { DATA_DIR: tmp, PUBLIC_URL: "https://presenter.test", STORE_DOMAIN: "presenter.test", OWNER_EMAILS: "owner@example.com", ACADEMY_STUDIO_TOKEN: STUDIO, ACADEMY_AUTOBUILD: "false", RUNPOD_API_KEY: "rp_test" });

const { app } = await import("../src/index.js");
const { db } = await import("../src/db.js");
const academy = await import("../src/academy.js");
const presenter = await import("../src/academy-presenter.js");
const plans = await import("../src/plans.js");
const sharp = (await import("sharp")).default;
const ffmpegPath = (await import("ffmpeg-static")).default;
const probe = (file) => { try { execFileSync(ffmpegPath, ["-hide_banner", "-i", file], { stdio: "pipe" }); return ""; } catch (e) { return String(e.stderr); } };
const seconds = (file) => { const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(probe(file)); return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : 0; };

// Stand-ins: a short tone per slide for the voice, a still clip of the avatar for the talking head.
const heads = [], voices = [];
presenter.setStandIns({
  voice: async (text, voice, out) => { voices.push({ text, voice }); execFileSync(ffmpegPath, ["-y", "-loglevel", "error", "-f", "lavfi", "-i", "sine=f=330:d=1.2", "-ar", "24000", "-ac", "1", "-c:a", "pcm_s16le", out]); },
  talkingHead: async ({ image, out }) => { heads.push(image); execFileSync(ffmpegPath, ["-y", "-loglevel", "error", "-loop", "1", "-t", "1", "-i", path.join(tmp, "images", image), "-vf", "scale=480:600,fps=25", "-c:v", "libx264", "-pix_fmt", "yuv420p", out]); },
});

let server, base, owner, other, avatarId;
before(async () => { server = app.listen(0); await new Promise((r) => server.once("listening", r)); base = `http://127.0.0.1:${server.address().port}`; });
after(() => { server.close(); fs.rmSync(tmp, { recursive: true, force: true }); });
const call = async (method, url, body, t, type = "application/json") => {
  const r = await fetch(base + url, { method, headers: { "Content-Type": type, ...(t ? { Authorization: `Bearer ${t}` } : {}) }, body: body == null ? undefined : type === "application/json" ? JSON.stringify(body) : body });
  const text = await r.text();
  let json = null; try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { status: r.status, body: json };
};

test("set up the owner's avatar and another store", async () => {
  owner = (await call("POST", "/api/sellers", { store_name: "Snapfront HQ" })).body;
  other = (await call("POST", "/api/sellers", { store_name: "Someone" })).body;
  const ownerSeller = db.prepare("SELECT * FROM sellers WHERE account_id = ?").get(plans.accountForToken(owner.token).id);
  db.prepare("UPDATE accounts SET email = 'owner@example.com' WHERE id = ?").run(ownerSeller.account_id);
  fs.writeFileSync(path.join(tmp, "images", "coach.jpg"), await sharp({ create: { width: 480, height: 600, channels: 3, background: "#b48a6a" } }).jpeg().toBuffer());
  fs.writeFileSync(path.join(tmp, "images", "chrome.jpg"), await sharp({ create: { width: 480, height: 600, channels: 3, background: "#888888" } }).jpeg().toBuffer());
  avatarId = "avt_coach";
  db.prepare("INSERT INTO avatars (id, seller_id, account_id, name, style, source, status, image_file) VALUES (?,?,?,?,?,?,?,?)").run(avatarId, ownerSeller.id, ownerSeller.account_id, "Coach", "blend", "blend", "done", "coach.jpg");
  db.prepare("INSERT INTO avatars (id, seller_id, account_id, name, style, status, image_file) VALUES (?,?,?,?,?,?,?)").run("avt_visor", ownerSeller.id, ownerSeller.account_id, "Visor", "chrome", "done", "chrome.jpg");
});

test("only the owner or the studio token can see and set the presenter", async () => {
  assert.equal((await call("GET", "/api/academy-presenter", null, other.token)).status, 403);
  assert.equal((await call("GET", "/api/academy-presenter", null, "wrong-token-wrong-token-wrong")).status, 401);
  const v = (await call("GET", "/api/academy-presenter", null, owner.token)).body;
  assert.equal(v.active, false);
  assert.equal(v.building, null);                                         // an object with the step while building, else null
  assert.deepEqual(v.avatars.map((a) => a.id), [avatarId]);              // faceless avatars can't present
  assert.ok(v.screens.some((s) => s.lesson === "partner" && s.slide === 3 && !s.recorded));
  assert.equal((await call("PUT", "/api/academy-presenter", { avatar_id: "avt_visor" }, owner.token)).status, 400);
  assert.equal((await call("PUT", "/api/academy-presenter", { lessons: ["nope"] }, owner.token)).status, 400);
  assert.equal((await call("PUT", "/api/academy-presenter", { voice: "el:nope" }, owner.token)).status, 400);
  const set = await call("PUT", "/api/academy-presenter", { avatar_id: avatarId, voice: "af_bella", lessons: [] }, STUDIO);
  assert.equal(set.status, 200, JSON.stringify(set.body));
  assert.deepEqual(set.body.presenter, { avatar_id: avatarId, voice: "af_bella", lessons: [] });
});

test("screen demos are uploaded with the studio token, as H.264 MP4s, only for demo slides", async () => {
  const clip = path.join(tmp, "clip.mp4");
  execFileSync(ffmpegPath, ["-y", "-loglevel", "error", "-f", "lavfi", "-i", "color=c=#223344:s=300x650:d=2", "-c:v", "libx264", "-pix_fmt", "yuv420p", clip]);
  const bytes = fs.readFileSync(clip);
  assert.equal((await call("PUT", "/api/academy-presenter/screens/partner/3", bytes, other.token, "video/mp4")).status, 403);
  assert.equal((await call("PUT", "/api/academy-presenter/screens/partner/1", bytes, STUDIO, "video/mp4")).status, 400);   // no demo on that slide
  assert.equal((await call("PUT", "/api/academy-presenter/screens/partner/3", Buffer.alloc(5000, 7), STUDIO, "video/mp4")).status, 400);
  assert.equal((await call("PUT", "/api/academy-presenter/screens/nope/0", bytes, STUDIO, "video/mp4")).status, 404);
  const ok = await call("PUT", "/api/academy-presenter/screens/partner/3", bytes, STUDIO, "video/mp4");
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  assert.ok((await call("GET", "/api/academy-presenter", null, STUDIO)).body.screens.find((s) => s.lesson === "partner" && s.slide === 3).recorded);
});

test("a lesson that opts in is rebuilt with the avatar on every slide and the phone demo; others are untouched", async () => {
  // Turning it on for one lesson builds only that lesson.
  const set = await call("PUT", "/api/academy-presenter", { lessons: ["partner"] }, owner.token);
  assert.equal(set.status, 200);
  await academy.buildMissing({ only: ["partner"] });
  const lessonFiles = fs.readdirSync(path.join(tmp, "academy")).filter((f) => f.startsWith("partner-") && f.endsWith(".mp4"));
  assert.equal(lessonFiles.length, 1);
  const file = path.join(tmp, "academy", lessonFiles[0]);
  assert.match(lessonFiles[0], /^partner-p[0-9a-f]+\.mp4$/);
  const info = probe(file);
  assert.match(info, /Video: h264.*1280x720/);
  assert.match(info, /Audio: aac/);
  const partner = (await import("../src/academy-content.js")).LESSONS.find((l) => l.id === "partner");
  assert.equal(heads.length, partner.slides.length);                    // one talking head per slide
  assert.ok(heads.every((h) => h === "coach.jpg"));
  assert.ok(voices.every((v) => v.voice === "af_bella"));
  assert.ok(Math.abs(seconds(file) - partner.slides.length * (1.2 + 0.45)) < 1.5, `length ${seconds(file)}`);
  const meta = JSON.parse(fs.readFileSync(`${file}.json`, "utf8"));
  assert.equal(meta.presenter, true);
  // The app is told the lesson is taught by the avatar, with a working link.
  db.prepare("UPDATE accounts SET plan = 'pro' WHERE email = 'owner@example.com'").run();
  const l = (await call("GET", "/api/academy/partner", null, owner.token)).body;
  assert.equal(l.presenter, true);
  assert.equal(l.video_status, "ready");
  const signed = new URL(l.video);
  assert.equal((await fetch(`${base}${signed.pathname}${signed.search}`)).status, 200);
  // The owner's status has a preview link to the finished video.
  const st = (await call("GET", "/api/academy-presenter", null, STUDIO)).body;
  assert.deepEqual(st.presenter_lessons.map((x) => [x.id, x.ready, Boolean(x.video)]), [["partner", true, true]]);
  // Another lesson isn't affected.
  assert.equal((await call("GET", "/api/academy/welcome", null, owner.token)).body.presenter, false);

  // Rebuilding with nothing changed pays for nothing new (talking heads are cached).
  const before = heads.length;
  await academy.buildMissing({ only: ["partner"] });
  assert.equal(heads.length, before);

  // A new screen recording makes a new version; the old video stays up until it's ready.
  const clip = path.join(tmp, "clip2.mp4");
  execFileSync(ffmpegPath, ["-y", "-loglevel", "error", "-f", "lavfi", "-i", "color=c=#334455:s=300x650:d=3", "-c:v", "libx264", "-pix_fmt", "yuv420p", clip]);
  await new Promise((r) => setTimeout(r, 20));
  assert.equal((await call("PUT", "/api/academy-presenter/screens/partner/3", fs.readFileSync(clip), STUDIO, "video/mp4")).status, 200);
  const during = (await call("GET", "/api/academy/partner", null, owner.token)).body;
  assert.equal(during.video_status, "ready");                           // still the previous video
  await academy.buildMissing({ only: ["partner"] });
  assert.equal(heads.length, before);                                   // same words: no new talking heads
  const now = fs.readdirSync(path.join(tmp, "academy")).filter((f) => f.startsWith("partner-") && f.endsWith(".mp4"));
  assert.equal(now.length, 1);
  assert.notEqual(now[0], lessonFiles[0]);
});

test("voice library: search, add a voice to the account, use it (owner only), hear a sample", async () => {
  const eleven = await import("../src/elevenlabs.js");
  process.env.ELEVENLABS_API_KEY = "el_test_key";
  const seen = [];
  eleven.setElevenFetch(async (url, init = {}) => {
    seen.push({ url, method: init.method || "GET", body: init.body });
    const ok = (j) => ({ ok: true, status: 200, json: async () => j, text: async () => JSON.stringify(j) });
    if (url.includes("/v1/shared-voices")) return ok({ voices: [{ voice_id: "LibVoice12345", public_owner_id: "owner123456", name: "Velvet", accent: "african-american", gender: "female", age: "young", descriptive: "seductive", use_case: "narrative_story", cloned_by_count: 900, description: "Smooth and warm", preview_url: "https://x/p.mp3" }] });
    if (url.includes("/v1/voices/add/owner123456/LibVoice12345")) return ok({ voice_id: "AddedVoice123" });
    if (url.includes("/v2/voices?page_size=100")) return ok({ voices: [{ voice_id: "AddedVoice123", name: "Velvet", category: "professional", labels: { accent: "african-american", gender: "female" } }] });
    if (url.includes("/v2/voices")) return ok({ voices: [] });
    throw new Error(`unexpected ${url}`);
  });
  assert.equal((await call("GET", "/api/academy-presenter/voice-library?search=sultry", null, other.token)).status, 403);
  const lib = await call("GET", "/api/academy-presenter/voice-library?search=sultry&gender=female&accent=african-american", null, STUDIO);
  assert.equal(lib.status, 200, JSON.stringify(lib.body));
  assert.equal(lib.body.voices[0].name, "Velvet");
  const q = new URL(seen.find((x) => x.url.includes("shared-voices")).url).searchParams;
  assert.deepEqual([q.get("search"), q.get("gender"), q.get("accent")], ["sultry", "female", "african-american"]);
  const added = await call("POST", "/api/academy-presenter/voices", { public_owner_id: "owner123456", voice_id: "LibVoice12345", name: "Velvet" }, STUDIO);
  assert.deepEqual([added.status, added.body.id], [201, "el:AddedVoice123"]);
  // The added voice shows for the owner and can be chosen for the presenter (it isn't sold to sellers).
  const v = (await call("GET", "/api/academy-presenter", null, STUDIO)).body;
  assert.ok(v.voices.some((x) => x.id === "el:AddedVoice123" && x.added));
  assert.equal((await eleven.isOnSale("el:AddedVoice123")), false);
  assert.equal((await call("PUT", "/api/academy-presenter", { voice: "el:AddedVoice123" }, STUDIO)).status, 200);
  const sample = await call("POST", "/api/academy-presenter/voice-sample", { voice: "el:AddedVoice123", text: "Hi there" }, STUDIO);
  assert.equal(sample.status, 200, JSON.stringify(sample.body));
  assert.match(sample.body.url, /^https:\/\/presenter\.test\/media\/[\w-]+\.wav$/);
  assert.equal((await call("POST", "/api/academy-presenter/voice-sample", { voice: "el:Unknown12345" }, STUDIO)).status, 400);
  await call("PUT", "/api/academy-presenter", { voice: "af_bella" }, STUDIO);
  delete process.env.ELEVENLABS_API_KEY;
});

test("the studio token can give the owner's avatar a new outfit; not someone else's avatar", async () => {
  const aimedia = await import("../src/aimedia.js");
  const runs = [];
  aimedia.setRunpodFetch(async (url, init = {}) => { runs.push({ url, body: init.body ? JSON.parse(init.body) : null }); return { ok: true, status: 200, json: async () => ({ id: "rpo1", status: "IN_QUEUE" }) }; });
  db.prepare("UPDATE accounts SET plan = 'pro' WHERE email = 'owner@example.com'").run();
  const r = await call("POST", "/api/academy-presenter/outfit", { avatar_id: avatarId, look: "a tailored emerald wrap dress" }, STUDIO);
  assert.equal(r.status, 201, JSON.stringify(r.body));
  assert.match(runs.at(-1).url, /nano-banana-pro-edit\/run$/);
  assert.match(runs.at(-1).body.input.prompt, /tailored emerald wrap dress/);
  const otherSeller = db.prepare("SELECT * FROM sellers WHERE account_id = ?").get(plans.accountForToken(other.token).id);
  db.prepare("INSERT INTO avatars (id, seller_id, account_id, name, style, status, image_file) VALUES ('avt_theirs',?,?,?,?,?,?)").run(otherSeller.id, otherSeller.account_id, "Theirs", "soft3d", "done", "coach.jpg");
  assert.equal((await call("POST", "/api/academy-presenter/outfit", { avatar_id: "avt_theirs", look: "a red dress" }, STUDIO)).status, 404);
});

test("the presenter slide pictures leave room for the avatar and the phone", () => {
  const partner = academy.presenterSlideSvg;
  const l = { id: "x", module: "income", title: "A lesson", summary: "Short summary", slides: [{ heading: "Title", points: [], say: "" }, { heading: "Get paid", points: ["Scroll down", "Tap Save"], say: "" }] };
  const slide = partner(l, l.slides[1], 1, "slide"), screen = partner(l, l.slides[1], 1, "screen");
  assert.match(slide, new RegExp(`x="${presenter.LAYOUT.slide.head.x - 6}"`));
  assert.match(screen, new RegExp(`x="${presenter.LAYOUT.screen.phone.x}"`));
  assert.match(screen, /Get paid/);
});

test("the studio can run Runpod jobs for site artwork, on known models only", async () => {
  const aimedia = await import("../src/aimedia.js");
  const seen = [];
  aimedia.setRunpodFetch(async (url, opts) => { seen.push({ url, body: opts?.body ? JSON.parse(opts.body) : null }); return new Response(JSON.stringify({ id: "job-123456", status: "IN_QUEUE" }), { status: 200 }); });
  const r = await call("POST", "/api/studio/runpod/qwen-image-t2i/run", { input: { prompt: "a mug" } }, STUDIO);
  assert.equal(r.status, 200);
  assert.equal(r.body.id, "job-123456");
  assert.match(seen[0].url, /\/qwen-image-t2i\/run$/);
  assert.deepEqual(seen[0].body, { input: { prompt: "a mug" } });
  assert.equal((await call("GET", "/api/studio/runpod/vidu-q3-i2v/status/job-123456", null, STUDIO)).status, 200);
  assert.match(seen[1].url, /\/vidu-q3-i2v\/status\/job-123456$/);
  assert.equal((await call("POST", "/api/studio/runpod/some-other-endpoint/run", { input: {} }, STUDIO)).status, 404);
  assert.equal((await call("GET", "/api/studio/runpod/vidu-q3-i2v/status/..%2Fx", null, STUDIO)).status, 400);
  assert.equal((await call("POST", "/api/studio/runpod/qwen-image-t2i/run", { input: {} }, other.token)).status, 403);
  assert.equal(seen.length, 2);
});

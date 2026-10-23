import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-video-backup-"));
Object.assign(process.env, { DATA_DIR: tmp, PUBLIC_URL: "https://backup.test", RUNPOD_API_KEY: "rp_test",
  ELEVENLABS_API_KEY: "eleven_test_secret", ELEVENLABS_VIDEO_BACKUP: "true", ELEVENLABS_VIDEO_DAILY_LIMIT: "100",
  STRIPE_SECRET_KEY: "", OWNER_EMAILS: "" });
const { app } = await import("../src/index.js");
const { db } = await import("../src/db.js");
const aimedia = await import("../src/aimedia.js");
const video = await import("../src/eleven-video.js");
const avatars = await import("../src/avatar-videos.js");
const credits = await import("../src/credits.js");
const plans = await import("../src/plans.js");
const narrated = await import("../src/narrated.js");
const sharp = (await import("sharp")).default;
const ffmpeg = (await import("ffmpeg-static")).default;
const sample = path.join(tmp, "sample.mp4");
execFileSync(ffmpeg, ["-y", "-loglevel", "error", "-f", "lavfi", "-i", "color=c=blue:s=180x320:d=6", "-f", "lavfi", "-i", "sine=f=220:d=6", "-shortest", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", sample]);
narrated.setVoiceEngine(async () => ({ audio: new Float32Array(24000), sampling_rate: 24000 }));
aimedia.onOutOfCredit(null);
let rpStatus = 402, result = "completed", remaining = 300_000, elevenStatus = 200;
const rpCalls = [], elCalls = [];
const json = (data, status = 200) => ({ ok: status < 400, status, json: async () => data });
aimedia.setRunpodFetch(async (url) => {
  rpCalls.push(url);
  if (url === "https://output.test/clip.mp4") return { ok: true, arrayBuffer: async () => fs.readFileSync(sample) };
  if (url.endsWith("/run")) return json({ id: "rp-ok" }, rpStatus);
  if (url.includes("/status/")) return json({ status: "COMPLETED", output: { video_url: "https://output.test/clip.mp4" } });
  throw new Error("Unexpected Runpod request");
});
video.setVideoFetch(async (url, init) => {
  elCalls.push({ url, body: init.body ? JSON.parse(init.body) : null });
  assert.equal(init.headers["xi-api-key"], "eleven_test_secret");
  if (url.endsWith("/user/subscription")) return json({ tier: "pro", character_limit: remaining, character_count: 0 });
  if (url.endsWith("/flows/video?page_size=1")) return json({ generations: [] }, elevenStatus);
  if (init.method === "POST") return json({ id: `el-${elCalls.length}`, status: "pending" }, elevenStatus);
  return json({ status: result, content_url: "https://output.test/clip.mp4", content_mime_type: "video/mp4" });
});
let server, seller, account;
before(async () => {
  server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  const r = await fetch(`http://127.0.0.1:${server.address().port}/api/sellers`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  const data = await r.json();
  db.prepare("UPDATE accounts SET plan='pro' WHERE id=?").run(data.account.id);
  account = plans.getAccount(data.account.id);
  seller = db.prepare("SELECT * FROM sellers WHERE account_id=?").get(account.id);
  credits.grant(account.id, 10000, "test");
  await sharp({ create: { width: 180, height: 320, channels: 3, background: "red" } }).jpeg().toFile(path.join(tmp, "images", "avatar.jpg"));
  db.prepare("INSERT INTO seller_media(image_file,seller_id) VALUES (?,?)").run("avatar.jpg", seller.id);
  db.prepare("INSERT INTO avatars(id,seller_id,account_id,name,style,status,image_file) VALUES (?,?,?,?,?,?,?)").run("av-test", seller.id, account.id, "Nova", "soft3d", "done", "avatar.jpg");
  db.prepare("INSERT INTO avatar_shots(id,seller_id,account_id,avatar_id,pose,prompt,status,image_file) VALUES (?,?,?,?,?,?,?,?)").run("shot-test", seller.id, account.id, "av-test", "present", "test", "done", "avatar.jpg");
});
after(() => { server?.close(); fs.rmSync(tmp, { recursive: true, force: true }); });
const motion = (options = {}) => avatars.start(account, seller, { kind: "motion", shot_id: "shot-test", model: "vidu", duration: 5, motion: "showcase", sound: false, ...options });
const readyPoll = (id) => db.prepare("UPDATE video_backups SET next_poll=0 WHERE job_id=?").run(id);
const spendCount = (id) => db.prepare("SELECT COUNT(*) AS n FROM credit_ledger WHERE ref=? AND kind='spend'").get(id).n;

test("Pro access check creates no paid generation", async () => {
  const n = elCalls.filter((x) => x.body).length;
  assert.deepEqual(await video.check(), { enabled: true, ready: true, tier: "pro", remainingCredits: 300000 });
  assert.equal(elCalls.filter((x) => x.body).length, n);
});
test("Runpod 402 switches a motion job once, keeps one charge, and downloads a quiet five-second result", async () => {
  const balance = credits.balance(account.id);
  const job = await motion();
  assert.equal(job.status, "running");
  assert.equal(job.model_name, "Veo 3.1 Fast (backup)");
  assert.equal(spendCount(job.id), 1);
  assert.equal(credits.balance(account.id), balance - job.credits);
  const body = elCalls.findLast((x) => x.body).body;
  assert.equal(body.model_id, "veo-3.1-fast-generate-001");
  assert.equal(body.duration_secs, 6);
  assert.equal(body.generate_audio, false);
  assert.equal(body.start_frame.type, "inline_base64");
  assert.equal(body.aspect_ratio, "9:16");
  readyPoll(job.id);
  const n = rpCalls.length;
  await Promise.all([avatars.poll(job.id), avatars.poll(job.id)]);
  const row = db.prepare("SELECT * FROM avatar_videos WHERE id=?").get(job.id);
  assert.equal(row.status, "done");
  assert.equal(rpCalls.slice(n).filter((x) => x.includes("/status/")).length, 0);
  let probe;
  try { execFileSync(ffmpeg, ["-hide_banner", "-i", path.join(tmp, "media", row.file)], { stdio: "pipe" }); }
  catch (e) { probe = String(e.stderr); }
  assert.match(probe, /Duration: 00:00:05\.00/);
  assert.doesNotMatch(probe, /Audio:/);
  assert.equal(credits.balance(account.id), balance - job.credits);
  assert.doesNotMatch(JSON.stringify(job), /eleven_test_secret|content_base64/);
});
test("an accepted job resumes without sending either provider another submission", async () => {
  const r = db.prepare("SELECT job_id,generation_id FROM video_backups WHERE generation_id IS NOT NULL LIMIT 1").get();
  const n = elCalls.length;
  assert.deepEqual(await video.submit(r.job_id, () => { throw new Error("must not submit again"); }, {}), { id: r.generation_id });
  assert.equal(elCalls.length, n);
});
test("failed backup gives the single charge back exactly once", async () => {
  const balance = credits.balance(account.id);
  const job = await motion();
  result = "failed";
  readyPoll(job.id);
  await Promise.all([avatars.poll(job.id), avatars.poll(job.id)]);
  await avatars.poll(job.id);
  assert.equal(credits.balance(account.id), balance);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM credit_ledger WHERE ref=? AND kind='refund'").get(job.id).n, 1);
  result = "completed";
});
test("normal Runpod success and non-balance failures never contact ElevenLabs", async () => {
  const n = elCalls.length;
  rpStatus = 200;
  const job = await motion();
  await avatars.poll(job.id);
  assert.equal(video.backupFor(job.id), undefined);
  for (const status of [401, 403, 429, 500]) {
    rpStatus = status;
    const balance = credits.balance(account.id);
    await assert.rejects(motion());
    assert.equal(credits.balance(account.id), balance);
  }
  assert.equal(elCalls.length, n);
  rpStatus = 402;
});
test("unsupported longer clips and disabled fallback refund without any ElevenLabs request", async () => {
  const n = elCalls.length, balance = credits.balance(account.id);
  await assert.rejects(motion({ duration: 10 }), /4, 5 or 8 second/);
  process.env.ELEVENLABS_VIDEO_BACKUP = "false";
  await assert.rejects(motion(), /paused/);
  process.env.ELEVENLABS_VIDEO_BACKUP = "true";
  assert.equal(elCalls.length, n);
  assert.equal(credits.balance(account.id), balance);
});
test("credit reserve, daily limit, and denied generation restore user credits", async () => {
  const balance = credits.balance(account.id);
  remaining = 50_000;
  const n = elCalls.filter((x) => x.body).length;
  await assert.rejects(motion(), /low on credits/);
  assert.equal(elCalls.filter((x) => x.body).length, n);
  remaining = 300_000;
  process.env.ELEVENLABS_VIDEO_DAILY_LIMIT = "0";
  await assert.rejects(motion(), /backup limit/);
  process.env.ELEVENLABS_VIDEO_DAILY_LIMIT = "100";
  elevenStatus = 403;
  await assert.rejects(motion(), /unavailable/);
  elevenStatus = 200;
  assert.equal(credits.balance(account.id), balance);
});
test("product clips keep one plan allowance and recover it once on failure", async () => {
  const used = () => db.prepare("SELECT COALESCE(SUM(count),0) AS n FROM usage WHERE account_id=? AND kind='video'").get(account.id).n;
  const n = used();
  const job = await aimedia.start(account, seller, { kind: "video", image_file: "avatar.jpg", preset: "push" });
  assert.equal(used(), n + 1);
  result = "failed";
  readyPoll(job.id);
  await Promise.all([aimedia.poll(job.id), aimedia.poll(job.id)]);
  await aimedia.poll(job.id);
  assert.equal(used(), n);
  result = "completed";
});
test("talking avatars send the existing voice audio to Aurora and retain one charge", async () => {
  const job = await avatars.start(account, seller, { kind: "talk", avatar_id: "av-test", script: "Welcome to my lovely store.", voice: "af_heart" });
  for (let i = 0; i < 100; i++) {
    if (db.prepare("SELECT status FROM avatar_videos WHERE id=?").get(job.id).status !== "queued") break;
    await new Promise((r) => setTimeout(r, 10));
  }
  const body = elCalls.findLast((x) => x.body).body;
  assert.equal(body.model_id, "creatify-aurora");
  assert.equal(body.audio.type, "inline_base64");
  assert.equal(body.audio.mime_type, "audio/wav");
  assert.equal(body.resolution, "480p");
  assert.equal(spendCount(job.id), 1);
  readyPoll(job.id);
  await avatars.poll(job.id);
  assert.equal(db.prepare("SELECT status FROM avatar_videos WHERE id=?").get(job.id).status, "done");
});
test("polling is throttled durably even when the client repeatedly refreshes", async () => {
  const job = await motion({ model: "sora", duration: 4, resolution: "1080p" });
  assert.equal(elCalls.findLast((x) => x.body).body.duration_secs, 8);
  const n = elCalls.length;
  await video.poll(job.id);
  await video.poll(job.id);
  assert.equal(elCalls.length, n);
  readyPoll(job.id);
  await Promise.all([video.poll(job.id), video.poll(job.id)]);
  assert.equal(elCalls.length, n + 1);
});

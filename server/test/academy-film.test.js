// Academy films: a lesson that names a film plays the uploaded MP4 instead of its narrated slides, unless the
// owner's avatar teaches it: then her version plays. Only the owner (or the studio token) can upload a film,
// only for a film a lesson names, and only a real MP4.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-film-"));
const STUDIO = "s".repeat(32);
Object.assign(process.env, { DATA_DIR: tmp, PUBLIC_URL: "https://film.test", OWNER_EMAILS: "owner@example.com", ACADEMY_STUDIO_TOKEN: STUDIO, ACADEMY_AUTOBUILD: "false", STRIPE_SECRET_KEY: "" });
const { app } = await import("../src/index.js");
const { db } = await import("../src/db.js");
const academy = await import("../src/academy.js");
let base, server;
before(async () => { server = app.listen(0); await new Promise((r) => server.once("listening", r)); base = `http://127.0.0.1:${server.address().port}`; });
after(() => { server?.close(); fs.rmSync(tmp, { recursive: true, force: true }); });

const mp4 = () => { const b = Buffer.alloc(200000, 1); b.write("\0\0\0\x18ftypisom", 0, "latin1"); return b; };
const put = (name, body, token, q = "") => fetch(`${base}/api/academy/films/${name}${q}`, { method: "PUT", headers: { "Content-Type": "video/mp4", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body });

test("only the owner can upload a film, only for a lesson's film, only an MP4", async () => {
  const member = await (await fetch(`${base}/api/sellers`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })).json();
  assert.equal((await put("ugc-income", mp4())).status, 401);
  assert.equal((await put("ugc-income", mp4(), member.token)).status, 403);
  assert.equal((await put("not-a-film", mp4(), STUDIO)).status, 404);
  assert.equal((await put("ugc-income", Buffer.alloc(200000, 7), STUDIO)).status, 400, "not an MP4");
  assert.equal((await put("..%2Fescape", mp4(), STUDIO)).status, 404);
  const ok = await put("ugc-income", mp4(), STUDIO, "?seconds=318.4");
  assert.equal(ok.status, 200);
  const body = await ok.json();
  assert.deepEqual([body.film, body.seconds, body.lessons], ["ugc-income", 318, ["ugc"]]);
  assert.ok(fs.existsSync(path.join(tmp, "academy", "films", "ugc-income.mp4")));
});

test("the UGC lesson plays the film, and the builder doesn't make slides for it", async () => {
  const s = await (await fetch(`${base}/api/sellers`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })).json();
  db.prepare("UPDATE accounts SET plan = 'pro' WHERE id = ?").run(s.account.id);
  const l = await (await fetch(`${base}/api/academy/ugc`, { headers: { Authorization: `Bearer ${s.token}` } })).json();
  assert.equal(l.video_status, "ready");
  const file = await fetch(l.video.replace("https://film.test", base));
  assert.equal(file.status, 200);
  assert.equal(Number(file.headers.get("content-length")), mp4().length);
  const cat = await (await fetch(`${base}/api/academy`, { headers: { Authorization: `Bearer ${s.token}` } })).json();
  assert.equal(cat.modules.flatMap((m) => m.lessons).find((x) => x.id === "ugc").minutes, 5);
  assert.deepEqual(academy.FILMS().find((f) => f.lesson === "ugc"), { lesson: "ugc", film: "ugc-income", ready: true });
  assert.deepEqual(academy.FILMS().find((f) => f.lesson === "youtube-shorts"), { lesson: "youtube-shorts", film: "youtube-shorts", ready: false }, "not uploaded yet");
  const list = await fetch(`${base}/api/academy-films`, { headers: { Authorization: `Bearer ${STUDIO}` } });
  assert.deepEqual((await list.json()).films, academy.FILMS());
  assert.equal((await fetch(`${base}/api/academy-films`, { headers: { Authorization: `Bearer ${s.token}` } })).status, 403);
});

test("when the owner's avatar teaches the lesson, her version plays instead of the film, and the builder makes it", async () => {
  const owner = await (await fetch(`${base}/api/sellers`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })).json();
  db.prepare("UPDATE accounts SET email = 'owner@example.com', plan = 'pro' WHERE id = ?").run(owner.account.id);
  const sellerId = db.prepare("SELECT id FROM sellers WHERE account_id = ?").get(owner.account.id).id;
  fs.mkdirSync(path.join(tmp, "images"), { recursive: true });
  fs.writeFileSync(path.join(tmp, "images", "teacher.jpg"), Buffer.alloc(2000, 9));
  db.prepare("INSERT INTO avatars (id, seller_id, account_id, name, style, status, image_file) VALUES ('avt_teacher', ?, ?, 'Nia', 'blend', 'done', 'teacher.jpg')").run(sellerId, owner.account.id);
  db.prepare("INSERT INTO app_settings (key, value) VALUES ('academy_presenter', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
    .run(JSON.stringify({ avatar_id: "avt_teacher", voice: "af_heart", lessons: ["ugc"] }));
  const watch = async () => {
    const l = await (await fetch(`${base}/api/academy/ugc`, { headers: { Authorization: `Bearer ${owner.token}` } })).json();
    return Number((await fetch(l.video.replace("https://film.test", base))).headers.get("content-length"));
  };
  assert.equal(await watch(), mp4().length, "the film fills in until she has a version");
  // Her earlier version (an older hash) plays while her current one is made.
  fs.writeFileSync(path.join(tmp, "academy", "ugc-p0123456789a.mp4"), Buffer.alloc(150000, 2));
  assert.equal(await watch(), 150000);
  // The builder doesn't skip the lesson because of the film: her version is still made.
  const ugc = { id: "ugc", ...(await import("../src/academy-content.js")).LESSONS.find((x) => x.id === "ugc") };
  assert.equal(academy.needsBuild(ugc), true);
  // Not taught by her: the film stands in and nothing is made.
  db.prepare("UPDATE app_settings SET value = ? WHERE key = 'academy_presenter'").run(JSON.stringify({ avatar_id: "avt_teacher", voice: "af_heart", lessons: ["welcome"] }));
  assert.equal(academy.needsBuild(ugc), false);
  assert.equal(await watch(), mp4().length);
});

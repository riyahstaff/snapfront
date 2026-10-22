// Bringing the Academy presenter back from the other host: only the presenter setting, the owner's
// avatars and the Academy files are added; nothing this server already has is replaced; films and
// other members' avatars stay out; file times are kept so lessons aren't made again. Owner only.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import express from "express";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-restore-"));
process.env.DATA_DIR = path.join(tmp, "live");
process.env.STRIPE_SECRET_KEY = "";
process.env.OWNER_EMAILS = "owner@example.com";
const TOKEN = "r".repeat(20) + "0123456789abcdef";

const { config } = await import("../src/config.js");
const { app } = await import("../src/index.js");
const { db } = await import("../src/db.js");
const restoreMod = await import("../src/academy-restore.js");
const presenter = await import("../src/academy-presenter.js");
const { default: Database } = await import("better-sqlite3");

let base, server, other, otherBase, ownerToken, memberToken, acct, seller;
const OLD = new Date("2026-10-18T12:00:00Z");
const otherDir = path.join(tmp, "other");
const put = (rel, bytes) => { const f = path.join(otherDir, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, bytes); fs.utimesSync(f, OLD, OLD); };

before(async () => {
  server = app.listen(0); await new Promise((r) => server.once("listening", r)); base = `http://127.0.0.1:${server.address().port}`;
  // This server: the owner's account and store (as copied when the hosts switched), and a member.
  const s = await (await fetch(`${base}/api/sellers`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" })).json();
  ownerToken = s.token;
  seller = db.prepare("SELECT id, account_id FROM sellers ORDER BY rowid DESC LIMIT 1").get();
  acct = seller.account_id;
  db.prepare("UPDATE accounts SET email = 'owner@example.com' WHERE id = ?").run(acct);
  memberToken = (await (await fetch(`${base}/api/sellers`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" })).json()).token;
  // A cached head this server already has, with different bytes: it must be kept.
  fs.mkdirSync(path.join(config.dataDir, "academy", "heads"), { recursive: true });
  fs.writeFileSync(path.join(config.dataDir, "academy", "heads", "h-shared.mp4"), "mine");

  // The other host: its database and files.
  const dbFile = path.join(tmp, "other.db");
  const o = new Database(dbFile);
  o.exec(`CREATE TABLE accounts (id TEXT PRIMARY KEY, email TEXT); CREATE TABLE sellers (id TEXT PRIMARY KEY, account_id TEXT);
    CREATE TABLE app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT);
    CREATE TABLE avatars (id TEXT PRIMARY KEY, seller_id TEXT, account_id TEXT, name TEXT, style TEXT, look TEXT, status TEXT, image_file TEXT, source TEXT, created_at TEXT, updated_at TEXT, not_here TEXT);`);
  o.prepare("INSERT INTO accounts VALUES (?, 'owner@example.com'), ('acc_member', 'member@example.com')").run(acct);
  const av = o.prepare("INSERT INTO avatars (id, seller_id, account_id, name, style, look, status, image_file, source, created_at, updated_at, not_here) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)");
  av.run("av_teacher", seller.id, acct, "Nia", "photo", "", "done", "av-teacher.jpg", "photo", "2026-10-15 10:00:00", "2026-10-15 10:00:00", "x");
  av.run("av_second", seller.id, acct, "Leo", "soft3d", "", "done", "av-second.jpg", "ai", "2026-10-16 10:00:00", "2026-10-16 10:00:00", "x");
  av.run("av_member", "sel_member", "acc_member", "Theirs", "soft3d", "", "done", "av-member.jpg", "ai", "2026-10-16 10:00:00", "2026-10-16 10:00:00", "x");
  o.prepare("INSERT INTO app_settings (key, value) VALUES ('academy_presenter', ?)").run(JSON.stringify({ avatar_id: "av_teacher", voice: "el:abc", lessons: "all", per_lesson: { email: { avatar_id: "av_second", voice: "af_heart" } } }));
  o.close();
  for (const f of ["av-teacher.jpg", "av-second.jpg", "av-member.jpg"]) put(`images/${f}`, Buffer.alloc(3000, 1));
  put("images/someone-else.jpg", Buffer.alloc(3000, 2));
  put("academy/welcome-pabc1234567.mp4", Buffer.alloc(9000, 3));
  put("academy/welcome-pabc1234567.mp4.json", "{\"seconds\":60}");
  put("academy/heads/h-shared.mp4", "theirs");
  put("academy/heads/h-new.mp4", Buffer.alloc(4000, 4));
  put("academy/screens/welcome-3.mp4", Buffer.alloc(5000, 5));
  put("academy/films/ugc.mp4", Buffer.alloc(5000, 6));

  const fake = express();
  fake.use((req, res, next) => (req.get("authorization") === `Bearer ${TOKEN}` ? next() : res.status(401).end()));
  fake.get("/api/backup/db", (_q, res) => res.type("application/gzip").send(zlib.gzipSync(fs.readFileSync(dbFile))));
  fake.get("/api/backup/manifest", (_q, res) => {
    const files = [];
    const walk = (d, rel) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const r = `${rel}/${e.name}`; if (e.isDirectory()) walk(path.join(d, e.name), r); else { const st = fs.statSync(path.join(d, e.name)); files.push({ p: r, s: st.size, m: Math.round(st.mtimeMs) }); } } };
    for (const top of ["images", "academy"]) walk(path.join(otherDir, top), top);
    res.json({ files });
  });
  fake.get("/api/backup/file", (q, res) => res.send(fs.readFileSync(path.join(otherDir, String(q.query.p)))));
  other = fake.listen(0); await new Promise((r) => other.once("listening", r)); otherBase = `http://127.0.0.1:${other.address().port}`;
});
after(() => { server?.close(); other?.close(); fs.rmSync(tmp, { recursive: true, force: true }); });

const call = (method, url, token, body) => fetch(`${base}${url}`, { method, headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: body ? JSON.stringify(body) : undefined });

test("only the owner can start or see the restore", async () => {
  assert.equal((await call("POST", "/api/admin/restore-academy", memberToken)).status, 403);
  assert.equal((await call("GET", "/api/admin/restore-academy", memberToken)).status, 403);
  assert.equal((await fetch(`${base}/api/admin/restore-academy`, { method: "POST" })).status, 401);
});

test("brings back the presenter, the owner's avatars and the Academy files, and nothing else", async () => {
  const live = config.dataDir;
  const r = await restoreMod.restore(db, { primaryUrl: otherBase, token: TOKEN });
  assert.equal(r.settings, "restored");
  assert.equal(r.avatars_added, 2);
  assert.equal(r.files_failed, 0);
  assert.equal(presenter.settings().avatar_id, "av_teacher");
  assert.equal(presenter.settings().per_lesson.email.avatar_id, "av_second");
  // Only the owner's avatars, under this server's owner account and store.
  const rows = db.prepare("SELECT id, account_id, seller_id, name FROM avatars WHERE id LIKE 'av_%' ORDER BY id").all();
  assert.deepEqual(rows.map((a) => a.id), ["av_second", "av_teacher"]);
  assert.ok(rows.every((a) => a.account_id === acct && a.seller_id === seller.id));
  assert.deepEqual(presenter.ownerAvatars().map((a) => a.id).sort(), ["av_second", "av_teacher"]);
  assert.equal(presenter.presenter("welcome").avatar.id, "av_teacher");
  assert.equal(presenter.presenter("email").avatar.id, "av_second");
  // The files: lesson videos, heads and recordings with their original times; no films, no other photos.
  const lesson = path.join(live, "academy", "welcome-pabc1234567.mp4");
  assert.equal(fs.statSync(lesson).size, 9000);
  assert.equal(Math.round(fs.statSync(lesson).mtimeMs), OLD.getTime());
  assert.ok(fs.existsSync(path.join(live, "academy", "screens", "welcome-3.mp4")));
  assert.equal(Math.round(fs.statSync(path.join(live, "academy", "screens", "welcome-3.mp4")).mtimeMs), OLD.getTime());
  assert.ok(fs.existsSync(path.join(live, "academy", "heads", "h-new.mp4")));
  assert.equal(fs.readFileSync(path.join(live, "academy", "heads", "h-shared.mp4"), "utf8"), "mine", "a file this server has is never replaced");
  assert.ok(!fs.existsSync(path.join(live, "academy", "films", "ugc.mp4")), "films stay as they are");
  assert.ok(fs.existsSync(path.join(live, "images", "av-teacher.jpg")));
  assert.ok(!fs.existsSync(path.join(live, "images", "av-member.jpg")) && !fs.existsSync(path.join(live, "images", "someone-else.jpg")));
});

test("running it again changes nothing, and a presenter set here is kept", async () => {
  db.prepare("UPDATE app_settings SET value = ? WHERE key = 'academy_presenter'").run(JSON.stringify({ avatar_id: "av_second", voice: "af_heart", lessons: ["welcome"] }));
  const r = await restoreMod.restore(db, { primaryUrl: otherBase, token: TOKEN });
  assert.equal(r.avatars_added, 0);
  assert.equal(r.avatars_already_here, 2);
  assert.equal(r.files_copied, 0);
  assert.match(r.settings, /kept/);
  assert.equal(presenter.settings().avatar_id, "av_second");
});

test("a wrong key or a server with no presenter is reported, not half done", async () => {
  await assert.rejects(restoreMod.restore(db, { primaryUrl: otherBase, token: "w".repeat(40) }), /401/);
  const s = await (await call("POST", "/api/admin/restore-academy", ownerToken)).json();
  assert.equal(s.running, true);
  for (let i = 0; i < 100 && restoreMod.status().running; i++) await new Promise((r) => setTimeout(r, 20));
  // PRIMARY_URL and BACKUP_TOKEN aren't set in this test: the owner sees why.
  const done = await (await call("GET", "/api/admin/restore-academy", ownerToken)).json();
  assert.equal(done.running, false);
  assert.match(done.error, /PRIMARY_URL|BACKUP_TOKEN/);
});

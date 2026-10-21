// The backup copy: the main server's backup routes are locked behind BACKUP_TOKEN, refuse paths
// outside the data folders and block guessing; a copy pulls a checked database and the files,
// restores the database, and while in standby answers every page with the notice only.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-backup-"));
process.env.DATA_DIR = path.join(tmp, "primary");
process.env.STRIPE_SECRET_KEY = "";
const TOKEN = "t".repeat(20) + "0123456789abcdef";

const { config } = await import("../src/config.js");
const backup = await import("../src/backup.js");
const { app } = await import("../src/index.js");
const { db } = await import("../src/db.js");
let base, server;
before(async () => { server = app.listen(0); await new Promise((r) => server.once("listening", r)); base = `http://127.0.0.1:${server.address().port}`; });
after(() => { server?.close(); fs.rmSync(tmp, { recursive: true, force: true }); config.backupToken = ""; config.standby = false; });

const get = (p, token) => fetch(`${base}${p}`, token ? { headers: { authorization: `Bearer ${token}` } } : {});

test("the backup routes don't exist without a long BACKUP_TOKEN", async () => {
  config.backupToken = "";
  assert.equal((await get("/api/backup/manifest", "anything")).status, 404);
  config.backupToken = "short";
  assert.equal((await get("/api/backup/manifest", "short")).status, 404);
});

test("safeRel only allows files inside the data folders", () => {
  const d = config.dataDir;
  assert.ok(backup.safeRel("images/a.jpg", d));
  assert.ok(backup.safeRel("files/x/y.pdf", d));
  for (const bad of ["../snapfront.db", "snapfront.db", "images/../snapfront.db", "/etc/passwd", "models/m.onnx", "images", "images/", "images/.hidden", "images/a.part", "images\\..\\x", "images/a\0b", "standby/primary.db", "tmp-backup/s.db"]) {
    assert.equal(backup.safeRel(bad, d), null, bad);
  }
});

test("a copy pulls the database and files, checks them and restores the database", async () => {
  config.backupToken = TOKEN;
  db.prepare("INSERT INTO sellers (id, token_hash, store_name, store_slug) VALUES ('bk-seller', 'bk-hash', 'Backup Shop', 'backup-shop')").run();
  fs.mkdirSync(path.join(config.dataDir, "images", "s1"), { recursive: true });
  fs.writeFileSync(path.join(config.dataDir, "images", "s1", "photo.jpg"), Buffer.alloc(5000, 7));
  fs.mkdirSync(path.join(config.dataDir, "files"), { recursive: true });
  fs.writeFileSync(path.join(config.dataDir, "files", "guide.pdf"), "pdf bytes");
  fs.writeFileSync(path.join(config.dataDir, "files", "half.part"), "unfinished");

  const list = await (await get("/api/backup/manifest", TOKEN)).json();
  const paths = list.files.map((f) => f.p);
  assert.ok(paths.includes("images/s1/photo.jpg") && paths.includes("files/guide.pdf"));
  assert.ok(!paths.some((p) => p.endsWith(".part") || p.includes("snapfront.db")), "no partial files or the database in the list");

  const raw = await get("/api/backup/db", TOKEN);
  assert.equal(raw.status, 200);
  assert.match(raw.headers.get("cache-control"), /no-store/);
  assert.ok(zlib.gunzipSync(Buffer.from(await raw.arrayBuffer())).subarray(0, 15).toString() === "SQLite format 3");
  for (let i = 0; i < 50 && fs.readdirSync(path.join(config.dataDir, "tmp-backup")).length; i += 1) await new Promise((r) => setTimeout(r, 20));
  assert.equal(fs.readdirSync(path.join(config.dataDir, "tmp-backup")).length, 0, "the snapshot file is removed");

  const copy = path.join(tmp, "copy");
  const opts = { dataDir: copy, primaryUrl: base, token: TOKEN };
  assert.ok(await backup.pullDb(opts) > 0);
  const r1 = await backup.syncFiles(opts);
  assert.equal(r1.failed, 0);
  assert.ok(r1.copied >= 2);
  assert.deepEqual(fs.readFileSync(path.join(copy, "images", "s1", "photo.jpg")), Buffer.alloc(5000, 7));
  assert.equal(fs.readFileSync(path.join(copy, "files", "guide.pdf"), "utf8"), "pdf bytes");
  const r2 = await backup.syncFiles(opts);
  assert.equal(r2.copied, 0, "unchanged files aren't copied again");

  assert.equal(backup.restoreDb(opts), true);
  const { default: Database } = await import("better-sqlite3");
  const restored = new Database(path.join(copy, "snapfront.db"), { readonly: true });
  assert.equal(restored.prepare("SELECT store_name FROM sellers WHERE id = 'bk-seller'").get().store_name, "Backup Shop");
  restored.close();
  const st = backup.standbyStatus(copy);
  assert.ok(st.database_copied_at && st.database_loaded_at && st.files_synced_at);
  assert.equal(st.last_problem, null);
});

test("a failed pull keeps the last good copy", async () => {
  const copy = path.join(tmp, "copy");
  const before = fs.statSync(path.join(copy, "standby", "primary.db")).size;
  await assert.rejects(backup.pullDb({ dataDir: copy, primaryUrl: base, token: "w".repeat(40) }), /401/);
  assert.equal(fs.statSync(path.join(copy, "standby", "primary.db")).size, before);
  assert.ok(!fs.existsSync(path.join(copy, "standby", "primary.db.part")));
  assert.match(backup.standbyStatus(copy).last_problem, /401/);
});

test("file route refuses paths outside the data folders", async () => {
  config.backupToken = TOKEN;
  for (const p of ["../snapfront.db", "snapfront.db", "images/../snapfront.db", "%2Fetc%2Fpasswd"]) {
    assert.equal((await get(`/api/backup/file?p=${p}`, TOKEN)).status, 400, p);
  }
  assert.equal((await get("/api/backup/file?p=images/nope.jpg", TOKEN)).status, 404);
});

test("wrong tokens are refused, then the address is blocked", async () => {
  config.backupToken = TOKEN;
  let last;
  for (let i = 0; i < 12; i += 1) last = (await get("/api/backup/manifest", "x".repeat(40))).status;
  assert.equal(last, 429);
  assert.equal((await get("/api/backup/manifest")).status, 429, "blocked even with no token");
});

test("in standby, every page is the notice and nothing reaches the app", async () => {
  config.standby = true;
  try {
    const health = await get("/health");
    assert.equal(health.status, 200);
    const home = await get("/");
    assert.equal(home.status, 503);
    assert.match(await home.text(), /backup copy/);
    assert.match(home.headers.get("x-robots-tag"), /noindex/);
    const hook = await fetch(`${base}/api/stripe/webhook`, { method: "POST", body: "{}", headers: { "content-type": "application/json" } });
    assert.equal(hook.status, 503, "webhooks never run on the copy");
    assert.equal((await fetch(`${base}/api/sellers`, { method: "POST", body: "{}", headers: { "content-type": "application/json" } })).status, 503);
    const status = await (await get("/standby")).json();
    assert.equal(status.standby, true);
    assert.equal((await get("/api/backup/manifest", TOKEN)).status, 503, "a copy doesn't serve its data");
  } finally { config.standby = false; }
});

// A backup copy of Snapfront on a second host (docs/backup-host.md).
//
// The main server lets the copy read its data: a consistent snapshot of the database, a list of
// the stored files (photos, downloads, videos, lesson videos) and each file. Every request needs
// BACKUP_TOKEN; wrong tokens are counted per address and blocked after 10 in an hour.
//
// The copy (STANDBY=true) pulls the database when it starts (standby-boot.js) and the files right
// after, then every STANDBY_SYNC_HOURS it fetches new files and restarts, which loads a fresh
// database. Until it's switched on (STANDBY=false) it answers every page with a short notice, so it
// never sends emails, posts, charges or anything else twice.
//
// This file must not import db.js: standby-boot.js uses it before the database is opened.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { config } from "./config.js";

/** Folders under DATA_DIR that hold data people made (models, fonts and caches are rebuilt). */
export const SYNC_DIRS = ["images", "files", "media", "academy"];
const MIN_TOKEN = 32;
const DB_FILE = "snapfront.db";
export const tokenOk = (token = config.backupToken) => String(token || "").length >= MIN_TOKEN;
const standbyDir = (dataDir) => path.join(dataDir, "standby");
const statePath = (dataDir) => path.join(standbyDir(dataDir), "state.json");
const skipName = (name) => name.startsWith(".") || /\.(part|tmp|restore)$/.test(name);

/** A path from the list, checked: inside one of SYNC_DIRS, no "..", no hidden or partial files. */
export function safeRel(rel, dataDir = config.dataDir) {
  if (typeof rel !== "string" || !rel || rel.length > 500 || /[\0\\]/.test(rel) || rel.startsWith("/")) return null;
  const parts = rel.split("/");
  if (!SYNC_DIRS.includes(parts[0]) || parts.length < 2 || parts.some((p) => !p || p === "." || p === ".." || skipName(p))) return null;
  const root = path.join(dataDir, parts[0]);
  const full = path.resolve(dataDir, rel);
  return full.startsWith(root + path.sep) ? full : null;
}

const sha = (s) => crypto.createHash("sha256").update(String(s || "")).digest();
const sameToken = (given, real) => tokenOk(real) && crypto.timingSafeEqual(sha(given), sha(real));

/* ---------------- the main server's side ---------------- */

/** Every stored file under SYNC_DIRS: path, size and modified time (ms). */
export function manifest(dataDir = config.dataDir) {
  const files = [];
  const walk = (dir, rel) => {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (skipName(e.name)) continue;
      const r = `${rel}/${e.name}`;
      if (e.isDirectory()) walk(path.join(dir, e.name), r);
      else if (e.isFile()) {
        try { const st = fs.statSync(path.join(dir, e.name)); files.push({ p: r, s: st.size, m: Math.round(st.mtimeMs) }); } catch { /* removed meanwhile */ }
      }
    }
  };
  for (const d of SYNC_DIRS) walk(path.join(dataDir, d), d);
  return files;
}

/**
 * The routes the copy reads from. They answer 404 unless BACKUP_TOKEN is set (32+ characters) and
 * this server isn't itself a copy. `db` is the open better-sqlite3 database.
 */
export function mountBackupRoutes(app, db) {
  const fails = new Map();   // address -> { n, until }
  let snapshotting = false;
  const guard = (req, res, next) => {
    if (config.standby || !tokenOk()) return res.status(404).end();
    const now = Date.now();
    for (const [ip, f] of fails) if (f.until < now) fails.delete(ip);
    const f = fails.get(req.ip);
    if (f && f.n >= 10) return res.status(429).set("Retry-After", "3600").end();
    const token = String(req.get("authorization") || "").replace(/^Bearer\s+/i, "");
    if (!sameToken(token, config.backupToken)) {
      const e = f || { n: 0, until: now + 3600e3 };
      e.n += 1; fails.set(req.ip, e);
      console.warn("[backup] refused a request with a wrong token from", req.ip);
      return res.status(401).end();
    }
    res.set("Cache-Control", "no-store");
    next();
  };

  // The whole database, copied safely while the server keeps running, gzipped.
  app.get("/api/backup/db", guard, async (_req, res) => {
    if (snapshotting) return res.status(429).set("Retry-After", "60").end();
    snapshotting = true;
    const dir = path.join(config.dataDir, "tmp-backup");
    const file = path.join(dir, `snapshot-${process.pid}-${Date.now()}.db`);
    const done = () => { snapshotting = false; fs.rmSync(file, { force: true }); };
    try {
      fs.mkdirSync(dir, { recursive: true });
      await db.backup(file);
      res.status(200).type("application/gzip").set("Content-Disposition", "attachment; filename=snapfront.db.gz");
      await pipeline(fs.createReadStream(file), zlib.createGzip({ level: 6 }), res);
      console.log("[backup] database copy sent");
    } catch (e) {
      console.error("[backup] database copy", e.message);
      if (!res.headersSent) res.status(500).end(); else res.destroy();
    } finally { done(); }
  });

  app.get("/api/backup/manifest", guard, (_req, res) => {
    const body = zlib.gzipSync(JSON.stringify({ files: manifest() }));
    res.status(200).type("application/json").set("Content-Encoding", "gzip").send(body);
  });

  app.get("/api/backup/file", guard, (req, res) => {
    const full = safeRel(req.query.p);
    if (!full) return res.status(400).end();
    let st;
    try { st = fs.lstatSync(full); } catch { return res.status(404).end(); }
    if (!st.isFile()) return res.status(404).end();
    res.status(200).type("application/octet-stream").set("Content-Length", String(st.size));
    fs.createReadStream(full).on("error", () => res.destroy()).pipe(res);
  });
}

/* ---------------- the copy's side ---------------- */

export function readState(dataDir = config.dataDir) {
  try { return JSON.parse(fs.readFileSync(statePath(dataDir), "utf8")); } catch { return {}; }
}
function writeState(dataDir, patch) {
  fs.mkdirSync(standbyDir(dataDir), { recursive: true });
  const next = { ...readState(dataDir), ...patch };
  fs.writeFileSync(statePath(dataDir) + ".tmp", JSON.stringify(next, null, 2));
  fs.renameSync(statePath(dataDir) + ".tmp", statePath(dataDir));
  return next;
}

async function fromPrimary(route, { primaryUrl, token, timeoutMs }) {
  if (!/^https?:\/\//.test(primaryUrl || "")) throw new Error("PRIMARY_URL isn't set");
  if (!tokenOk(token)) throw new Error("BACKUP_TOKEN isn't set (32+ characters)");
  const res = await fetch(`${primaryUrl}${route}`, { headers: { authorization: `Bearer ${token}` }, redirect: "error", signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`${route} answered ${res.status}`);
  return res;
}

/** Fetch a database copy from the main server, check it, and keep it as standby/primary.db. */
export async function pullDb({ dataDir = config.dataDir, primaryUrl = config.primaryUrl, token = config.backupToken, timeoutMs = 180e3 } = {}) {
  const dir = standbyDir(dataDir);
  fs.mkdirSync(dir, { recursive: true });
  const part = path.join(dir, "primary.db.part");
  try {
    const res = await fromPrimary("/api/backup/db", { primaryUrl, token, timeoutMs });
    await pipeline(Readable.fromWeb(res.body), zlib.createGunzip(), fs.createWriteStream(part));
    const { default: Database } = await import("better-sqlite3");
    const check = new Database(part, { readonly: true, fileMustExist: true });
    try {
      if (check.pragma("quick_check", { simple: true }) !== "ok") throw new Error("the database copy is damaged");
      if (!check.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='sellers'").get()) throw new Error("the database copy has no stores table");
    } finally { check.close(); }
    fs.renameSync(part, path.join(dir, "primary.db"));
    const bytes = fs.statSync(path.join(dir, "primary.db")).size;
    writeState(dataDir, { db_copied_at: new Date().toISOString(), db_bytes: bytes, db_error: null });
    return bytes;
  } catch (e) {
    fs.rmSync(part, { force: true });
    writeState(dataDir, { db_error: `${new Date().toISOString()} ${e.message}` });
    throw e;
  }
}

/** On a copy: put the last database copy in place. Run only before the database is opened. */
export function restoreDb({ dataDir = config.dataDir } = {}) {
  const snap = path.join(standbyDir(dataDir), "primary.db");
  if (!fs.existsSync(snap)) return false;
  const live = path.join(dataDir, DB_FILE);
  fs.copyFileSync(snap, `${live}.restore`);
  for (const s of ["-wal", "-shm"]) fs.rmSync(live + s, { force: true });
  fs.renameSync(`${live}.restore`, live);
  writeState(dataDir, { db_restored_at: new Date().toISOString() });
  return true;
}

/** Fetch every file that's new or changed on the main server. Files it no longer has are kept. */
export async function syncFiles({ dataDir = config.dataDir, primaryUrl = config.primaryUrl, token = config.backupToken, parallel = 4 } = {}) {
  const res = await fromPrimary("/api/backup/manifest", { primaryUrl, token, timeoutMs: 120e3 });
  const { files } = await res.json();
  if (!Array.isArray(files)) throw new Error("the file list was empty");
  let copied = 0, failed = 0, bytes = 0;
  const todo = files.filter((f) => {
    const full = safeRel(f?.p, dataDir);
    if (!full || !Number.isFinite(f.s) || !Number.isFinite(f.m)) { failed += 1; return false; }
    try { const st = fs.statSync(full); return !(st.size === f.s && Math.abs(st.mtimeMs - f.m) < 2000); } catch { return true; }
  });
  const one = async (f) => {
    const full = safeRel(f.p, dataDir);
    const part = `${full}.part`;
    try {
      fs.mkdirSync(path.dirname(full), { recursive: true });
      const r = await fromPrimary(`/api/backup/file?p=${encodeURIComponent(f.p)}`, { primaryUrl, token, timeoutMs: 15 * 60e3 });
      await pipeline(Readable.fromWeb(r.body), fs.createWriteStream(part));
      if (fs.statSync(part).size !== f.s) throw new Error("size changed while copying");
      fs.utimesSync(part, new Date(f.m), new Date(f.m));
      fs.renameSync(part, full);
      copied += 1; bytes += f.s;
    } catch (e) {
      fs.rmSync(part, { force: true });
      failed += 1;
      if (failed <= 5) console.warn("[standby] file", f.p, e.message);
    }
  };
  const queue = todo.slice();
  await Promise.all(Array.from({ length: Math.max(1, parallel) }, async () => { while (queue.length) await one(queue.shift()); }));
  writeState(dataDir, { files_synced_at: new Date().toISOString(), files_total: files.length, files_copied: copied, files_failed: failed, files_bytes_copied: bytes });
  return { total: files.length, copied, failed, bytes };
}

/** On a copy: fetch the files now, then every few hours fetch them again and restart for a fresh database. */
export function startStandbyWorker() {
  if (!config.standby) return false;
  if (!config.primaryUrl || !tokenOk()) { console.error("[standby] set PRIMARY_URL and BACKUP_TOKEN so this copy can keep up with the main server"); return false; }
  const run = () => syncFiles().then((r) => console.log(`[standby] files: ${r.copied} copied, ${r.failed} failed, ${r.total} in all`));
  setTimeout(() => run().catch((e) => console.error("[standby] files", e.message)), 30e3).unref();
  setInterval(async () => {
    await run().catch((e) => console.error("[standby] files", e.message));
    console.log("[standby] restarting to load the latest database copy");
    process.exit(0);   // the host starts it again; standby-boot.js pulls the database first
  }, config.standbySyncHours * 3600e3);
  return true;
}

/** What /standby shows: when the copy last caught up. No data from the stores. */
export function standbyStatus(dataDir = config.dataDir) {
  const s = readState(dataDir);
  return {
    standby: true,
    database_copied_at: s.db_copied_at || null,
    database_loaded_at: s.db_restored_at || null,
    files_synced_at: s.files_synced_at || null,
    files: s.files_total ?? null,
    last_problem: s.db_error || (s.files_failed ? `${s.files_failed} files couldn't be copied last time` : null),
  };
}

export const STANDBY_PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Snapfront backup</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;font:16px/1.5 system-ui,sans-serif;background:#0d1117;color:#e6edf3;padding:0 16px}main{max-width:440px;text-align:center}a{color:#ffb454}</style></head>
<body><main><h1>This is Snapfront's backup copy</h1><p>It only takes over if the main server goes down. Snapfront itself is at <a href="https://snapfront.app">snapfront.app</a>.</p></main></body></html>`;

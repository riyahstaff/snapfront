// Bring the Academy presenter back from the other host (PRIMARY_URL, read with BACKUP_TOKEN).
//
// When the live server moved hosts, the Academy's avatar lessons stayed behind on the old one: the
// presenter setting, the owner's avatars and their photos, the finished avatar lesson videos, the
// cached voices and talking heads, and the app screen recordings. This copies only those, and
// leaves everything else on this server as it is (orders, members, stores, newer changes):
//   - the presenter setting is written only if this server has none (or `force`);
//   - an avatar is added only if this server doesn't have it (same id), under the same owner account,
//     or this server's account with the same owner email;
//   - files are added only if they're missing here; a file this server already has is never replaced.
//     Films (academy/films) stay as they are here: they're uploaded to the live server.
// Files keep their original times, so the restored lessons match exactly and aren't made again.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { config } from "./config.js";
import { fromPrimary, safeRel } from "./backup.js";

const KEY = "academy_presenter";
const ownerEmail = (email) => Boolean(email && (config.ownerEmails || []).includes(String(email).trim().toLowerCase()));
const avatarIdsIn = (s) => new Set([s?.avatar_id, ...Object.values(s?.per_lesson || {}).map((x) => x?.avatar_id)].filter(Boolean));

let state = { running: false, done: null, error: null, step: null };
export const status = () => ({ ...state });

/** Start the restore in the background (it can take a few minutes for the videos). */
export function start(db, opts = {}) {
  if (state.running) return status();
  state = { running: true, done: null, error: null, step: "starting", started_at: new Date().toISOString() };
  restore(db, opts)
    .then((r) => { state = { ...state, running: false, done: r, step: null, finished_at: new Date().toISOString() }; console.log("[academy-restore]", JSON.stringify(r)); })
    .catch((e) => { state = { ...state, running: false, error: e.message, step: null, finished_at: new Date().toISOString() }; console.error("[academy-restore]", e.message); });
  return status();
}

export async function restore(db, { dataDir = config.dataDir, primaryUrl = config.primaryUrl, token = config.backupToken, force = false } = {}) {
  const from = { primaryUrl, token };
  // 1. The other host's database, to read from (never loaded as this server's database).
  state.step = "copying the other server's database";
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "academy-restore-"));
  const file = path.join(tmp, "other.db");
  const { default: Database } = await import("better-sqlite3");
  let src;
  try {
    const res = await fromPrimary("/api/backup/db", { ...from, timeoutMs: 300e3 });
    await pipeline(Readable.fromWeb(res.body), zlib.createGunzip(), fs.createWriteStream(file));
    src = new Database(file, { readonly: true, fileMustExist: true });
    if (src.pragma("quick_check", { simple: true }) !== "ok") throw new Error("the other server's database copy is damaged");

    const hasTable = (d, t) => Boolean(d.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(t));
    const theirs = hasTable(src, "app_settings") ? JSON.parse(src.prepare("SELECT value FROM app_settings WHERE key = ?").get(KEY)?.value || "null") : null;
    if (!theirs) throw new Error("The other server has no Academy presenter to bring back.");

    // 2. The avatars: the ones teaching lessons, and every other avatar of the owner's accounts.
    state.step = "adding the avatars";
    const srcAccounts = new Map(src.prepare("SELECT id, email FROM accounts").all().map((a) => [a.id, a]));
    const srcOwners = new Set([...srcAccounts.values()].filter((a) => ownerEmail(a.email)).map((a) => a.id));
    const teaching = avatarIdsIn(theirs);
    const avatars = src.prepare("SELECT * FROM avatars WHERE status = 'done' AND image_file IS NOT NULL").all().filter((a) => teaching.has(a.id) || srcOwners.has(a.account_id));
    const cols = new Set(db.prepare("PRAGMA table_info(avatars)").all().map((c) => c.name));
    const localAccount = db.prepare("SELECT id, email FROM accounts WHERE id = ?");
    const localByEmail = db.prepare("SELECT id FROM accounts WHERE lower(email) = lower(?) ORDER BY created_at, rowid LIMIT 1");
    const localSeller = db.prepare("SELECT id FROM sellers WHERE id = ? AND account_id = ?");
    const firstSeller = db.prepare("SELECT id FROM sellers WHERE account_id = ? ORDER BY created_at, rowid LIMIT 1");
    const haveAvatar = db.prepare("SELECT 1 FROM avatars WHERE id = ?");
    const added = [], kept = [], skipped = [];
    const images = new Set();
    db.transaction(() => {
      for (const a of avatars) {
        images.add(`images/${a.image_file}`);
        if (haveAvatar.get(a.id)) { kept.push(a.id); continue; }
        // The same account here, or this server's account with the owner's email.
        let account = localAccount.get(a.account_id);
        if (!account) { const email = srcAccounts.get(a.account_id)?.email; const m = email && localByEmail.get(email); account = m ? localAccount.get(m.id) : null; }
        if (!account || !ownerEmail(account.email)) { skipped.push(a.id); continue; }
        const seller = localSeller.get(a.seller_id, account.id) || firstSeller.get(account.id);
        if (!seller) { skipped.push(a.id); continue; }
        const row = Object.fromEntries(Object.entries({ ...a, account_id: account.id, seller_id: seller.id }).filter(([k]) => cols.has(k)));
        const keys = Object.keys(row);
        db.prepare(`INSERT INTO avatars (${keys.join(",")}) VALUES (${keys.map(() => "?").join(",")})`).run(...keys.map((k) => row[k]));
        added.push(a.id);
      }
      // 3. The presenter setting, pointing at avatars this server now has.
      const mine = JSON.parse(db.prepare("SELECT value FROM app_settings WHERE key = ?").get(KEY)?.value || "null");
      if (!mine || force) {
        db.prepare("INSERT INTO app_settings (key, value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')").run(KEY, JSON.stringify(theirs));
        state.settings = "restored";
      } else state.settings = "kept (this server already has one)";
    })();

    // 4. The files: the avatars' photos and the Academy's videos, voices, talking heads and recordings.
    state.step = "copying the lesson videos";
    const list = await (await fromPrimary("/api/backup/manifest", { ...from, timeoutMs: 120e3 })).json();
    const wanted = (list.files || []).filter((f) => typeof f?.p === "string" && Number.isFinite(f.s) && Number.isFinite(f.m)
      && ((f.p.startsWith("academy/") && !f.p.startsWith("academy/films/")) || images.has(f.p)));
    let copied = 0, present = 0, failed = 0, bytes = 0;
    for (const f of wanted) {
      const full = safeRel(f.p, dataDir);
      if (!full) { failed++; continue; }
      if (fs.existsSync(full)) { present++; continue; }   // never replace a file this server has
      const part = `${full}.part`;
      try {
        fs.mkdirSync(path.dirname(full), { recursive: true });
        const r = await fromPrimary(`/api/backup/file?p=${encodeURIComponent(f.p)}`, { ...from, timeoutMs: 15 * 60e3 });
        await pipeline(Readable.fromWeb(r.body), fs.createWriteStream(part));
        if (fs.statSync(part).size !== f.s) throw new Error("size changed while copying");
        fs.utimesSync(part, new Date(f.m), new Date(f.m));
        fs.renameSync(part, full);
        fs.utimesSync(full, new Date(f.m), new Date(f.m));
        copied++; bytes += f.s;
        state.step = `copying the lesson videos (${copied + present}/${wanted.length})`;
      } catch (e) {
        failed++;
        fs.rmSync(part, { force: true });
        console.error("[academy-restore]", f.p, e.message);
      }
    }
    return { settings: state.settings, avatars_added: added.length, avatars_already_here: kept.length, avatars_skipped: skipped.length,
      files_copied: copied, files_already_here: present, files_failed: failed, megabytes: Math.round(bytes / 1e5) / 10 };
  } finally {
    try { src?.close(); } catch { /* closed */ }
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

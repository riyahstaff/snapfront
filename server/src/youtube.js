// YouTube Shorts: post a member's finished Snapfront videos (faceless videos and avatar videos) to
// their own YouTube channel, through Zernio (zernio.com, a social posting API that Google has already
// approved for YouTube uploads). A paid add-on for members: $24.99 a month (YOUTUBE_ADDON_CENTS),
// billed by Stripe on the same customer as the membership. Off until ZERNIO_API_KEY is set.
//
// Each Snapfront account gets its own Zernio profile (externalId = the account id), and that profile
// holds one YouTube channel, connected by the member through Zernio's Google sign-in. Which channel is
// connected is always read back from Zernio, never taken from the browser.
//
// Videos are sent by their public address on snapfront.app (/media/<random name>.mp4). YouTube treats a
// vertical video of 3 minutes or less as a Short. Members can also upload a video of their own (an MP4,
// MOV or WebM of up to 3 minutes), which is checked and saved as an MP4. Avatar videos are always labelled as AI-made
// (YouTube's "altered or synthetic content"); for faceless videos the member decides.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import ffmpegPath from "ffmpeg-static";
import { config, dirs } from "./config.js";
import { db, newId } from "./db.js";
import { askJson, httpError } from "./claude.js";
import * as plans from "./plans.js";
import * as credits from "./credits.js";
import * as webbilling from "./webbilling.js";
import { stripeClient } from "./payments.js";

const API = () => String(process.env.ZERNIO_API_URL || "https://zernio.com/api/v1").replace(/\/+$/, "");
const KEY = () => String(process.env.ZERNIO_API_KEY || "").trim();
export const enabled = () => Boolean(KEY());
const cents = () => { const n = Number(process.env.YOUTUBE_ADDON_CENTS); return Number.isInteger(n) && n >= 100 ? n : 2499; };
export const ADDON = () => ({ name: "Snapfront YouTube Shorts", cents: cents(), description: "Post your Snapfront videos straight to your YouTube channel as Shorts. Billed monthly. Cancel any time." });
const money = (c) => `$${(c / 100).toFixed(2)}`;
const webAppUrl = () => (config.storeDomain ? `https://app.${config.storeDomain}` : `${config.publicUrl}/app`);
const DAILY_POSTS = 20;

db.exec(`
CREATE TABLE IF NOT EXISTS youtube_subs (
  session_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',   -- pending | active | ended
  subscription_id TEXT,
  expires_at TEXT,
  checked_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS youtube_links (
  account_id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  zernio_account_id TEXT,
  username TEXT,
  connected_at TEXT
);
CREATE TABLE IF NOT EXISTS youtube_posts (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  source TEXT NOT NULL,
  source_id TEXT NOT NULL,
  title TEXT NOT NULL,
  zernio_post_id TEXT,
  status TEXT NOT NULL DEFAULT 'sending',   -- sending | scheduled | published | failed
  url TEXT,
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS youtube_posts_account ON youtube_posts (account_id, created_at);
CREATE TABLE IF NOT EXISTS youtube_uploads (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  file TEXT NOT NULL,
  title TEXT NOT NULL,
  seconds REAL NOT NULL,
  width INTEGER,
  height INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS youtube_uploads_account ON youtube_uploads (account_id, created_at);
`);

/* ---------- Zernio ---------- */
let zernioImpl = null;
/** Tests replace the network call: fn(method, route, body) → JSON. */
export const setZernio = (fn) => { zernioImpl = fn; };
async function zernio(method, route, body) {
  if (zernioImpl) return zernioImpl(method, route, body);
  if (!enabled()) throw httpError(503, "YouTube posting isn't switched on yet.");
  let res;
  try {
    res = await fetch(`${API()}${route}`, { method, headers: { Authorization: `Bearer ${KEY()}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(45_000) });
  } catch { throw httpError(502, "Couldn't reach YouTube posting. Try again in a minute."); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.warn("[youtube] zernio", method, route.split("?")[0], res.status, String(data?.error || data?.message || "").slice(0, 200));
    if (res.status === 402) throw httpError(503, "YouTube posting is at its limit right now. Snapfront has been told; try again later.");
    throw httpError(res.status >= 500 ? 502 : 400, data?.message || data?.error || "YouTube posting said no. Try again.");
  }
  return data;
}
const listOf = (d, key) => (Array.isArray(d) ? d : Array.isArray(d?.[key]) ? d[key] : Array.isArray(d?.data) ? d.data : []);
const idOf = (x) => x?._id || x?.id || null;

/* ---------- the add-on subscription ---------- */
const isMember = (account) => plans.effectivePlan(account) === "pro" || webbilling.hasLifetime(account.id);
export function hasAddon(account, now = Date.now()) {
  if (credits.isOwner(account)) return true;   // the owner runs Snapfront's own channel
  return db.prepare("SELECT expires_at FROM youtube_subs WHERE account_id = ? AND status = 'active'").all(account.id)
    .some((r) => !r.expires_at || Date.parse(r.expires_at) > now);
}
export async function startCheckout(account) {
  if (!webbilling.enabled()) throw httpError(503, "Payments aren't set up yet.");
  if (!isMember(account)) throw httpError(402, "YouTube posting is an add-on for Snapfront members. Become a member first.", { upgrade: "pro" });
  if (hasAddon(account)) throw httpError(409, "You already have YouTube posting.");
  const a = ADDON();
  const session = await stripeClient().checkout.sessions.create({
    mode: "subscription",
    customer: await webbilling.customerFor(account),
    client_reference_id: account.id,
    line_items: [{ quantity: 1, price_data: { currency: "usd", unit_amount: a.cents, recurring: { interval: "month" }, product_data: { name: a.name, description: a.description } } }],
    metadata: { snapfront_addon: "youtube", snapfront_account: account.id },
    subscription_data: { metadata: { snapfront_addon: "youtube", snapfront_account: account.id } },
    success_url: `${webAppUrl()}/youtube?checkout=done&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${webAppUrl()}/youtube?checkout=canceled`,
    allow_promotion_codes: true,
    custom_text: { submit: { message: webbilling.NO_REFUNDS } },
  });
  db.prepare("INSERT INTO youtube_subs (session_id, account_id) VALUES (?,?)").run(session.id, account.id);
  return { url: session.url };
}
const subStatus = (sub) => (["active", "trialing", "past_due"].includes(sub?.status) ? "active" : sub?.status === "incomplete" ? "pending" : "ended");
const periodEnd = (sub) => { const e = sub?.current_period_end ?? sub?.items?.data?.[0]?.current_period_end; return e ? new Date(e * 1000).toISOString() : null; };
async function inspect(row) {
  const s = stripeClient();
  const session = await s.checkout.sessions.retrieve(row.session_id);
  if (session.metadata?.snapfront_account !== row.account_id || session.metadata?.snapfront_addon !== "youtube") return { ...row, status: "ended" };
  if (session.status === "expired") return { ...row, status: "ended" };
  const subId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
  if (session.status !== "complete" || !subId) return { ...row, status: "pending" };
  const sub = await s.subscriptions.retrieve(subId);
  return { ...row, subscription_id: subId, status: subStatus(sub), expires_at: periodEnd(sub) };
}
const save = (r) => db.prepare("UPDATE youtube_subs SET status = ?, subscription_id = ?, expires_at = ?, checked_at = datetime('now') WHERE session_id = ?").run(r.status, r.subscription_id ?? null, r.expires_at ?? null, r.session_id);
/** Back from Stripe: check that checkout with Stripe itself. */
export async function confirm(account, sessionId) {
  const row = db.prepare("SELECT * FROM youtube_subs WHERE session_id = ?").get(String(sessionId || ""));
  if (!row || row.account_id !== account.id) throw httpError(404, "We couldn't find that payment. Try again in a minute.");
  save(await inspect(row));
  return hasAddon(account);
}
/** Background check: renewals, cancellations; unfinished checkouts are dropped after a day. */
export async function sweep() {
  try { pruneUploads(); } catch (e) { console.warn("[youtube] prune uploads", e.message); }
  if (!webbilling.enabled()) return 0;
  const due = db.prepare(`SELECT * FROM youtube_subs WHERE (status = 'pending' AND checked_at < datetime('now','-10 minutes') AND created_at > datetime('now','-1 day'))
    OR (status = 'active' AND (expires_at IS NULL OR julianday(expires_at) < julianday('now','+1 hour')) AND checked_at < datetime('now','-30 minutes'))`).all();
  for (const r of due) { try { save(await inspect(r)); } catch (e) { console.warn("[youtube] sweep", e.message); } }
  db.prepare("UPDATE youtube_subs SET status = 'ended' WHERE status = 'pending' AND created_at < datetime('now','-1 day')").run();
  return due.length;
}
/** When an account is deleted: stop the add-on so it isn't billed again. */
export async function cancelAll(accountId) {
  for (const r of db.prepare("SELECT subscription_id FROM youtube_subs WHERE account_id = ? AND subscription_id IS NOT NULL AND status != 'ended'").all(accountId)) {
    await stripeClient().subscriptions.cancel(r.subscription_id).catch((e) => console.warn("[youtube] cancel", e.message));
  }
  db.prepare("DELETE FROM youtube_subs WHERE account_id = ?").run(accountId);
  db.prepare("DELETE FROM youtube_links WHERE account_id = ?").run(accountId);
  db.prepare("DELETE FROM youtube_posts WHERE account_id = ?").run(accountId);
  for (const u of db.prepare("SELECT id FROM youtube_uploads WHERE account_id = ?").all(accountId)) removeUpload({ id: accountId }, u.id);
}

/* ---------- connecting the channel ---------- */
const needAddon = (account) => { if (!hasAddon(account)) throw httpError(402, `YouTube posting is an add-on (${money(cents())} a month). Subscribe to switch it on.`, { upgrade: "youtube" }); };
async function profileFor(account) {
  const known = db.prepare("SELECT profile_id FROM youtube_links WHERE account_id = ?").get(account.id)?.profile_id;
  if (known) return known;
  const found = listOf(await zernio("GET", `/profiles?externalId=${encodeURIComponent(account.id)}`), "profiles")[0];
  const id = idOf(found) || idOf((await zernio("POST", "/profiles", { name: `Snapfront ${account.id}`, externalId: account.id, description: "A Snapfront member's YouTube channel" }))?.profile);
  if (!id) throw httpError(502, "Couldn't set up YouTube posting. Try again.");
  db.prepare("INSERT INTO youtube_links (account_id, profile_id) VALUES (?,?) ON CONFLICT(account_id) DO UPDATE SET profile_id = excluded.profile_id").run(account.id, id);
  return id;
}
/** Where to send the member to connect their channel (Google's sign-in, through Zernio). */
export async function connectUrl(account) {
  needAddon(account);
  const profileId = await profileFor(account);
  const back = `${webAppUrl()}/youtube?connected=1`;
  const d = await zernio("GET", `/connect/youtube?profileId=${encodeURIComponent(profileId)}&scopes=posting&redirect_url=${encodeURIComponent(back)}`);
  if (!/^https:\/\//.test(d?.authUrl || "")) throw httpError(502, "Couldn't start connecting YouTube. Try again.");
  return { url: d.authUrl };
}
const ZERNIO_ID = /^[a-f0-9]{24}$/i;
const profileOf = (a) => (typeof a?.profileId === "string" ? a.profileId : idOf(a?.profileId));
/** What Zernio last listed per account, as counts only: shown to Snapfront's owner to diagnose a failed connect. */
const seenBy = new Map();
/** Read the connected channel back from Zernio (after the member returns from connecting).
 *  `hint` is the accountId Zernio put on the return link; it is only a hint, so the account is
 *  still read from Zernio and must belong to this member's own profile. */
export async function sync(account, hint) {
  const link = db.prepare("SELECT * FROM youtube_links WHERE account_id = ?").get(account.id);
  if (!link) return null;
  const mine = (a) => a?.platform === "youtube" && profileOf(a) === link.profile_id;
  // includeOverLimit: Zernio leaves accounts on over-limit profiles out of the list otherwise.
  let accounts = listOf(await zernio("GET", `/accounts?profileId=${encodeURIComponent(link.profile_id)}&platform=youtube&includeOverLimit=true`), "accounts");
  // This list is already filtered to the member's profile, so an account without a profileId still counts.
  const listedMine = (a) => a?.platform === "youtube" && (!a.profileId || mine(a));
  let yt = (ZERNIO_ID.test(hint || "") && accounts.find((a) => idOf(a) === hint && listedMine(a))) || accounts.find(listedMine);
  if (!yt && ZERNIO_ID.test(hint || "")) {
    accounts = listOf(await zernio("GET", `/accounts?search=${encodeURIComponent(hint)}&includeOverLimit=true`), "accounts");
    yt = accounts.find((a) => idOf(a) === hint && mine(a));
  }
  seenBy.set(account.id, { listed: accounts.length, youtube: accounts.filter((a) => a?.platform === "youtube").length, onThisProfile: accounts.filter((a) => profileOf(a) === link.profile_id).length, active: accounts.filter((a) => a?.isActive !== false).length, hint: Boolean(hint) });
  db.prepare("UPDATE youtube_links SET zernio_account_id = ?, username = ?, connected_at = CASE WHEN ? IS NULL THEN NULL ELSE COALESCE(connected_at, datetime('now')) END WHERE account_id = ?")
    .run(idOf(yt), yt ? String(yt.displayName || yt.username || yt.name || "Your channel").slice(0, 80) : null, idOf(yt), account.id);
  return yt ? { username: db.prepare("SELECT username FROM youtube_links WHERE account_id = ?").get(account.id).username } : null;
}
export const diagnostic = (accountId) => seenBy.get(accountId) ?? null;
export async function disconnect(account) {
  const link = db.prepare("SELECT * FROM youtube_links WHERE account_id = ?").get(account.id);
  if (link?.zernio_account_id) await zernio("DELETE", `/accounts/${encodeURIComponent(link.zernio_account_id)}`).catch((e) => console.warn("[youtube] disconnect", e.message));
  db.prepare("UPDATE youtube_links SET zernio_account_id = NULL, username = NULL, connected_at = NULL WHERE account_id = ?").run(account.id);
  return { connected: null };
}

/* ---------- the member's own videos (uploads) ---------- */
export const UPLOAD_MAX_BYTES = 300 * 1024 * 1024;   // a 3-minute 1080p phone video is usually well under this
const UPLOAD_MAX_SECONDS = 180;
const UPLOADS_KEPT = 12;                              // the newest 12 per account; older ones are removed
const UPLOADS_PER_DAY = 20;
const UPLOAD_DAYS = 30;                               // uploads are removed after 30 days
const UPLOAD_TYPES = /^(video\/(mp4|quicktime|webm|x-m4v)|application\/octet-stream)$/i;

function ffmpeg(args, timeout) {
  return new Promise((resolve, reject) => {
    const p = spawn(ffmpegPath, args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => { err = (err + d).slice(-6000); });
    const t = setTimeout(() => { p.kill("SIGKILL"); reject(new Error("ffmpeg took too long")); }, timeout);
    p.on("close", (code) => { clearTimeout(t); resolve({ code, err }); });
    p.on("error", (e) => { clearTimeout(t); reject(e); });
  });
}
/** Length, picture size (as shown, after any phone rotation) and whether there's a picture at all. */
export function readProbe(err) {
  const dur = /Duration: (\d+):(\d+):([\d.]+)/.exec(err);
  const seconds = dur ? Number(dur[1]) * 3600 + Number(dur[2]) * 60 + Number(dur[3]) : 0;
  const video = /Stream #\S+.*Video: [^\n]*?(\d{2,5})x(\d{2,5})/.exec(err);
  let width = video ? Number(video[1]) : 0, height = video ? Number(video[2]) : 0;
  const rot = /rotation of (-?[\d.]+) degrees|rotate\s*:\s*(-?\d+)/.exec(err);
  if (rot && Math.abs(Math.round(Number(rot[1] ?? rot[2]))) % 180 === 90) [width, height] = [height, width];
  const vcodec = (/Stream #\S+.*Video: (\w+)/.exec(err) || [])[1] || null;
  const acodec = (/Stream #\S+.*Audio: (\w+)/.exec(err) || [])[1] || null;
  return { seconds, width, height, hasVideo: Boolean(video), vcodec, acodec };
}
/* Uploads arrive in pieces of up to 8 MB (start → chunks in order → finish), so no proxy size limit or
 * slow connection gets in the way, and nothing large is held in memory. Unfinished uploads are dropped after an hour. */
export const CHUNK_BYTES = 8 * 1024 * 1024;
const pending = new Map();   // upload id → { account, part, bytes, size, name, started }
function dropStale() {
  for (const [id, u] of pending) if (Date.now() - u.started > 3600_000) { fs.rmSync(u.part, { force: true }); pending.delete(id); }
}
export function startUpload(account, b = {}) {
  needAddon(account);
  dropStale();
  const size = Number(b.size), type = String(b.type || "").split(";")[0].trim();
  if (type && !UPLOAD_TYPES.test(type)) throw httpError(415, "Upload an MP4, MOV or WebM video.");
  if (!Number.isInteger(size) || size <= 0) throw httpError(400, "Pick a video to upload.");
  if (size > UPLOAD_MAX_BYTES) throw httpError(413, "That video is too big. Upload one under 300 MB.");
  if (db.prepare("SELECT COUNT(*) AS n FROM youtube_uploads WHERE account_id = ? AND created_at >= datetime('now','-1 day')").get(account.id).n >= UPLOADS_PER_DAY)
    throw httpError(429, `That's ${UPLOADS_PER_DAY} uploads today. Upload more tomorrow.`);
  if ([...pending.values()].filter((u) => u.account === account.id).length >= 2) throw httpError(429, "Wait for your other upload to finish.");
  fs.mkdirSync(dirs.media, { recursive: true });
  const id = `ytu-${crypto.randomBytes(12).toString("hex")}`;
  const part = path.join(dirs.media, `${id}.part`);
  fs.writeFileSync(part, Buffer.alloc(0), { flag: "wx" });
  pending.set(id, { account: account.id, part, bytes: 0, size, name: String(b.name || ""), started: Date.now() });
  return { upload_id: id, chunk_bytes: CHUNK_BYTES };
}
const pendingFor = (account, id) => {
  const u = pending.get(String(id));
  if (!u || u.account !== account.id) throw httpError(404, "That upload has expired. Start it again.");
  return u;
};
export function appendChunk(account, id, offset, chunk) {
  const u = pendingFor(account, id);
  if (!Buffer.isBuffer(chunk) || !chunk.length || chunk.length > CHUNK_BYTES) throw httpError(400, "That piece of the video didn't arrive. Try again.");
  if (Number(offset) !== u.bytes) return { received: u.bytes };   // a repeated piece: tell the app where to carry on
  if (u.bytes + chunk.length > u.size) throw httpError(400, "That video is bigger than expected. Start the upload again.");
  fs.appendFileSync(u.part, chunk);
  u.bytes += chunk.length;
  return { received: u.bytes };
}
/** All pieces are in: check the video and keep it as an MP4. */
export async function finishUpload(account, id) {
  const u = pendingFor(account, id);
  if (u.bytes !== u.size) throw httpError(400, "The upload isn't complete yet. Try again.");
  pending.delete(String(id));
  const raw = u.part, out = path.join(dirs.media, `${id}.mp4`);
  try {
    const probe = readProbe((await ffmpeg(["-hide_banner", "-i", raw], 60_000)).err);
    if (!probe.hasVideo || !probe.seconds) throw httpError(400, "That file isn't a video we can read. Upload an MP4, MOV or WebM.");
    if (probe.seconds > UPLOAD_MAX_SECONDS + 0.5) throw httpError(400, `That video is ${Math.round(probe.seconds)} seconds long. YouTube Shorts are 3 minutes or less, so trim it first.`);
    // Repackage without re-encoding when it's already H.264/HEVC with AAC/MP3 sound (most phones); otherwise convert.
    const copyable = ["h264", "hevc"].includes(probe.vcodec) && (!probe.acodec || ["aac", "mp3"].includes(probe.acodec));
    let r = copyable ? await ffmpeg(["-y", "-hide_banner", "-loglevel", "error", "-i", raw, "-map", "0:v:0", "-map", "0:a:0?", "-c", "copy", "-movflags", "+faststart", "-f", "mp4", out], 120_000) : { code: 1 };
    if (r.code !== 0) {
      fs.rmSync(out, { force: true });
      r = await ffmpeg(["-y", "-hide_banner", "-loglevel", "error", "-i", raw, "-map", "0:v:0", "-map", "0:a:0?", "-c:v", "libx264", "-preset", "veryfast", "-crf", "21", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", "-f", "mp4", out], 600_000);
      if (r.code !== 0) throw httpError(400, "That video couldn't be converted. Export it as an MP4 and try again.");
    }
    const title = line(u.name.replace(/\.[a-z0-9]{2,4}$/i, "").replace(/[_-]+/g, " "), 100) || "My video";
    db.prepare("INSERT INTO youtube_uploads (id, account_id, file, title, seconds, width, height) VALUES (?,?,?,?,?,?,?)")
      .run(id, account.id, `${id}.mp4`, title, Math.round(probe.seconds * 10) / 10, probe.width || null, probe.height || null);
    for (const old of db.prepare("SELECT id FROM youtube_uploads WHERE account_id = ? ORDER BY created_at DESC, rowid DESC LIMIT -1 OFFSET ?").all(account.id, UPLOADS_KEPT)) removeUpload(account, old.id);
    return uploadView(db.prepare("SELECT * FROM youtube_uploads WHERE id = ?").get(id));
  } catch (e) {
    fs.rmSync(out, { force: true });
    throw e;
  } finally {
    fs.rmSync(raw, { force: true });
  }
}
const uploadView = (u) => ({ source: "upload", id: u.id, title: u.title, description: "#Shorts", seconds: u.seconds, created_at: u.created_at, ai: false,
  vertical: !(u.width && u.height) || u.height >= u.width, url: `${config.publicUrl}/media/${u.file}` });
export function removeUpload(account, id) {
  const u = db.prepare("SELECT * FROM youtube_uploads WHERE id = ? AND account_id = ?").get(String(id), account.id);
  if (!u) throw httpError(404, "That video is already gone.");
  if (/^ytu-[a-f0-9]{24}\.mp4$/.test(u.file)) fs.rmSync(path.join(dirs.media, u.file), { force: true });
  db.prepare("DELETE FROM youtube_uploads WHERE id = ?").run(u.id);
  return { ok: true };
}
/** Uploads older than 30 days (and those of deleted accounts) are removed. */
function pruneUploads() {
  for (const u of db.prepare("SELECT id, account_id FROM youtube_uploads WHERE created_at < datetime('now', ?)").all(`-${UPLOAD_DAYS} days`)) {
    try { removeUpload({ id: u.account_id }, u.id); } catch { /* already gone */ }
  }
}

/* ---------- the videos and posting ---------- */
/** The member's finished videos that can go to YouTube, newest first. */
export function videos(seller, account) {
  const faceless = db.prepare("SELECT id, file, seconds, created_at, script FROM faceless_jobs WHERE seller_id = ? AND status = 'done' AND file IS NOT NULL ORDER BY created_at DESC LIMIT 30").all(seller.id)
    .map((v) => {
      let sc = {}; try { sc = JSON.parse(v.script) || {}; } catch { /* old rows */ }
      const tags = (sc.hashtags || []).map((h) => `#${h}`).join(" ");
      return { source: "faceless", id: v.id, title: String(sc.hook || sc.scenes?.[0]?.text || "Faceless video").slice(0, 100), description: [sc.caption, tags, "#Shorts"].filter(Boolean).join("\n\n").slice(0, 5000),
        seconds: v.seconds, created_at: v.created_at, ai: false, file: v.file };
    });
  const avatar = db.prepare("SELECT id, file, duration, created_at, prompt FROM avatar_videos WHERE seller_id = ? AND status = 'done' AND file IS NOT NULL ORDER BY created_at DESC LIMIT 30").all(seller.id)
    .map((v) => ({ source: "avatar", id: v.id, title: String(v.prompt || "Avatar video").slice(0, 100), description: "#Shorts", seconds: v.duration, created_at: v.created_at, ai: true, file: v.file }));
  const made = [...faceless, ...avatar].map(({ file, ...v }) => ({ ...v, url: `${config.publicUrl}/media/${file}` }));
  const uploads = account ? db.prepare("SELECT * FROM youtube_uploads WHERE account_id = ? ORDER BY created_at DESC LIMIT ?").all(account.id, UPLOADS_KEPT).map(uploadView) : [];
  return [...uploads, ...made].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
}
// YouTube refuses "<" and ">" in titles and descriptions.
const line = (s, n) => String(s ?? "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, n);
const VISIBILITY = ["public", "unlisted", "private"];
function fileFor(account, seller, source, id) {
  const row = source === "faceless" ? db.prepare("SELECT file FROM faceless_jobs WHERE id = ? AND seller_id = ? AND status = 'done'").get(String(id), seller.id)
    : source === "avatar" ? db.prepare("SELECT file FROM avatar_videos WHERE id = ? AND seller_id = ? AND status = 'done'").get(String(id), seller.id)
    : source === "upload" ? db.prepare("SELECT file FROM youtube_uploads WHERE id = ? AND account_id = ?").get(String(id), account.id) : null;
  if (!row?.file || !/^[\w-]+\.mp4$/.test(row.file)) throw httpError(404, "Pick one of your finished videos.");
  return row.file;
}
const videoFor = (account, seller, source, id) => `${config.publicUrl}/media/${fileFor(account, seller, source, id)}`;

/* ---------- AI title and description ---------- */
/** Four frames from across the video, small JPEGs, so the AI can see what it shows. */
async function framesOf(file) {
  const full = path.join(dirs.media, file);
  const { seconds } = readProbe((await ffmpeg(["-hide_banner", "-i", full], 30_000)).err);
  const out = [];
  for (const share of [0.08, 0.35, 0.62, 0.9]) {
    const jpg = path.join(dirs.media, `frame-${crypto.randomBytes(8).toString("hex")}.jpg`);
    try {
      const r = await ffmpeg(["-y", "-hide_banner", "-loglevel", "error", "-ss", (Math.max(0, seconds * share)).toFixed(2), "-i", full, "-frames:v", "1", "-vf", "scale=512:512:force_original_aspect_ratio=decrease", "-q:v", "5", jpg], 30_000);
      if (r.code === 0 && fs.existsSync(jpg)) out.push(fs.readFileSync(jpg).toString("base64"));
    } finally { fs.rmSync(jpg, { force: true }); }
  }
  return { frames: out, seconds };
}
let describeImpl = null;
/** Tests replace the AI call: fn(content) → JSON. */
export const setDescriber = (fn) => { describeImpl = fn; };
/** Write a YouTube Shorts title, description and hashtags for one of the member's videos, from what it shows. */
export async function describe(account, seller, b = {}) {
  needAddon(account);
  const source = ["avatar", "faceless", "upload"].includes(b.source) ? b.source : null;
  if (!source) throw httpError(400, "Pick one of your videos.");
  const file = fileFor(account, seller, source, b.id);
  const known = videos(seller, account).find((v) => v.source === source && v.id === String(b.id));
  const notes = String(b.notes ?? "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 600);
  const { frames, seconds } = await framesOf(file);
  const prompt = `You write titles and descriptions for YouTube Shorts that get found in YouTube search and get watched.
Write them for this ${Math.round(seconds) || ""}-second vertical video${frames.length ? ", shown in the frames above (taken from the start, middle and end)" : ""}.
${source === "avatar" ? "It was made with an AI avatar.\n" : ""}What we know about it:
- Made by: ${line(seller.store_name, 80) || "a Snapfront creator"}${seller.tagline ? ` (${line(seller.tagline, 120)})` : ""}
- Working title: ${line(known?.title, 100) || "(none)"}
${known?.description && known.description !== "#Shorts" ? `- Notes from when it was made: ${line(known.description, 600)}\n` : ""}${notes ? `- What the creator says it's about: ${notes}\n` : ""}
How to write it:
- Title: 40 to 70 characters, at most 100. Lead with what a viewer would search for or a curiosity hook. Plain words, at most one emoji, no clickbait that the video doesn't deliver, no ALL CAPS.
- Description: 2 to 4 short lines. The first line restates the main keyword naturally. Then what the viewer gets, then one call to action (follow, comment, or the link in the channel).
- Hashtags: 3 to 5, relevant and specific, always including #Shorts.
- Only say what the frames, the title or the notes support. Don't invent prices, discounts, results, income, health claims or guarantees.
- Never use the characters < or >.

Return this JSON object:
{"title": string, "description": string (the lines, separated by newlines, without hashtags), "hashtags": [strings starting with #], "alt_titles": [2 other title options]}`;
  const content = [...frames.map((data) => ({ type: "image", source: { type: "base64", media_type: "image/jpeg", data } })), { type: "text", text: prompt }];
  return plans.withAllowance(account, "post", async () => {
    const out = (describeImpl ? await describeImpl(content) : await askJson(content, 1200)) || {};
    const tags = [...new Set([...(Array.isArray(out.hashtags) ? out.hashtags : []), "#Shorts"].map((t) => `#${String(t).replace(/^#+/, "").replace(/[^\p{L}\p{N}_]/gu, "")}`).filter((t) => t.length > 1))].slice(0, 6);
    const title = line(out.title, 100);
    if (title.length < 3) throw httpError(502, "The AI's answer came back empty. Try again.");
    const text = String(out.description ?? "").replace(/\r/g, "").replace(/[<>]/g, "").split("\n").map((l) => l.trim()).filter(Boolean).join("\n").slice(0, 4000);
    return { title, description: [text, tags.join(" ")].filter(Boolean).join("\n\n").slice(0, 5000), alt_titles: (Array.isArray(out.alt_titles) ? out.alt_titles : []).map((t) => line(t, 100)).filter((t) => t.length >= 3).slice(0, 2) };
  });
}
const publicPost = (p) => ({ id: p.id, source: p.source, source_id: p.source_id, title: p.title, status: p.status, url: p.url, error: p.error, created_at: p.created_at });
function applyZernio(postId, zpost) {
  const plat = (zpost?.platforms || []).find((x) => x?.platform === "youtube") || zpost?.platforms?.[0] || {};
  const raw = String(plat.status || zpost?.status || "").toLowerCase();
  const status = raw === "published" ? "published" : ["failed", "error", "cancelled"].includes(raw) ? "failed" : raw === "scheduled" ? "scheduled" : "sending";
  const url = /^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(plat.platformPostUrl || "") ? plat.platformPostUrl : null;
  db.prepare("UPDATE youtube_posts SET zernio_post_id = COALESCE(?, zernio_post_id), status = ?, url = COALESCE(?, url), error = ?, updated_at = datetime('now') WHERE id = ?")
    .run(idOf(zpost), status, url, status === "failed" ? line(plat.error || plat.errorMessage || zpost?.error || "YouTube didn't accept this video.", 300) : null, postId);
}
/** Send one of the member's videos to their channel now. */
export async function post(account, seller, b = {}) {
  needAddon(account);
  const link = db.prepare("SELECT * FROM youtube_links WHERE account_id = ?").get(account.id);
  if (!link?.zernio_account_id) throw httpError(409, "Connect your YouTube channel first.");
  if (db.prepare("SELECT COUNT(*) AS n FROM youtube_posts WHERE account_id = ? AND created_at >= datetime('now','-1 day')").get(account.id).n >= DAILY_POSTS) throw httpError(429, `That's ${DAILY_POSTS} videos to YouTube today. Post more tomorrow.`);
  const source = ["avatar", "faceless", "upload"].includes(b.source) ? b.source : null;
  if (!source) throw httpError(400, "Pick one of your videos.");
  const url = videoFor(account, seller, source, b.id);
  const title = line(b.title, 100);
  if (title.length < 3) throw httpError(400, "Give the video a title (up to 100 characters).");
  const description = String(b.description ?? "").replace(/\r/g, "").replace(/[<>]/g, "").trim().slice(0, 5000);
  const visibility = VISIBILITY.includes(b.visibility) ? b.visibility : "public";
  // YouTube asks creators to label realistic AI-made people and voices. Avatar videos always are.
  const ai = source === "avatar" ? true : Boolean(b.ai);
  const id = newId("ytp");
  db.prepare("INSERT INTO youtube_posts (id, account_id, seller_id, source, source_id, title) VALUES (?,?,?,?,?,?)").run(id, account.id, seller.id, source, String(b.id), title);
  try {
    const d = await zernio("POST", "/posts", {
      content: description || title, mediaItems: [{ type: "video", url }],
      platforms: [{ platform: "youtube", accountId: link.zernio_account_id, platformSpecificData: { title, visibility, madeForKids: Boolean(b.made_for_kids), containsSyntheticMedia: ai } }],
      publishNow: true,
    });
    applyZernio(id, d?.post || d);
  } catch (e) {
    db.prepare("UPDATE youtube_posts SET status = 'failed', error = ?, updated_at = datetime('now') WHERE id = ?").run(line(e.message, 300), id);
    throw e;
  }
  return publicPost(db.prepare("SELECT * FROM youtube_posts WHERE id = ?").get(id));
}
/** Check on posts YouTube is still processing. */
async function refreshPosts(accountId) {
  for (const p of db.prepare("SELECT * FROM youtube_posts WHERE account_id = ? AND status IN ('sending','scheduled') AND zernio_post_id IS NOT NULL AND updated_at < datetime('now','-20 seconds') LIMIT 5").all(accountId)) {
    try { const d = await zernio("GET", `/posts/${encodeURIComponent(p.zernio_post_id)}`); applyZernio(p.id, d?.post || d); } catch { /* try again next time */ }
  }
}

/** Everything the YouTube screen shows. */
export async function status(account, seller) {
  const link = db.prepare("SELECT * FROM youtube_links WHERE account_id = ?").get(account.id);
  if (enabled() && link) await refreshPosts(account.id);
  return {
    enabled: enabled(), price: money(cents()), member: isMember(account), subscribed: hasAddon(account), owner: credits.isOwner(account),
    connected: link?.zernio_account_id ? { username: link.username || "Your channel" } : null,
    videos: videos(seller, account),
    posts: db.prepare("SELECT * FROM youtube_posts WHERE account_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 20").all(account.id).map(publicPost),
  };
}

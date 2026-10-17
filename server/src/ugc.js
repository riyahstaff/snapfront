// UGC creator kit: a public portfolio page (videos, rates, contact), AI-written UGC scripts for a
// brand's product, a brand-deal tracker, and where to find paid UGC work. Stores that need UGC for
// their own products get marketplace links too (Snapfront's affiliate links when set by the owner).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import ffmpegPath from "ffmpeg-static";
import { config, dirs } from "./config.js";
import { db, newId } from "./db.js";
import { askJson, httpError } from "./claude.js";
import * as plans from "./plans.js";
import * as community from "./community.js";
import { storeUrl } from "./urls.js";
import { cleanEmail } from "./audience.js";

db.exec(`
CREATE TABLE IF NOT EXISTS ugc_profiles (
  seller_id TEXT PRIMARY KEY REFERENCES sellers(id) ON DELETE CASCADE,
  enabled INTEGER NOT NULL DEFAULT 0,
  body TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS ugc_deals (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  contact TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pitched' CHECK (status IN ('pitched','talking','booked','delivered','paid','lost')),
  amount_cents INTEGER NOT NULL DEFAULT 0,
  due TEXT,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS ugc_deals_seller ON ugc_deals (seller_id, created_at);
`);

const line = (s, n) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);
const MAX_ITEMS = 12;

/* ---------- where the paid work is ---------- */
export function platforms() {
  const s = community.all();
  // Snapfront's referral links (set by the owner) are marked, and the screen says Snapfront may earn a fee.
  const via = (link, plain) => (link ? { url: link, referral: true } : { url: plain, referral: false });
  const insense = (extra) => ({ name: "Insense", ...via(s.insense_url, "https://insense.pro/"), ...extra });
  const joinbrands = (extra) => ({ name: "JoinBrands", ...via(s.joinbrands_url, "https://joinbrands.com/"), ...extra });
  const out = {
    creators: [
      insense({ pay: "About $100 to $500 a video", fee: "Paid by the brand through the platform", what: "Brands post UGC and creator-ad briefs; strong demand from online brands." }),
      joinbrands({ pay: "About $25 to $200 a video", fee: "20% fee on paid jobs", what: "Low barrier to start, quick approvals, lots of small jobs." }),
      { name: "Billo", url: "https://billo.app/", pay: "About $60 to $200 a video", fee: "Built into the job price", what: "Mobile-first; no portfolio needed to begin." },
      { name: "Trend", url: "https://www.trend.io/", pay: "About $75 to $400 a video", fee: "Built into the job price", what: "Fixed-price gigs from direct-to-consumer brands." },
      { name: "Collabstr", url: "https://collabstr.com/", pay: "You set your own prices", fee: "15% on completed orders", what: "A public profile brands can find and book." },
      { name: "Whop Content Rewards", url: "https://whop.com/", pay: "Paid per 1,000 views (often about $1)", fee: "10% on view-based payouts", what: "Clip and post content for campaigns; good for faceless creators." },
    ],
    // For stores that want UGC for their own products.
    stores: [
      insense({ what: "Hire vetted creators for UGC videos and creator ads." }),
      joinbrands({ what: "Post a job and get UGC videos from creators fast." }),
    ],
    note: "Pay ranges are typical figures reported by creators and review sites; each job lists its own rate.",
  };
  const referrals = [...out.creators, ...out.stores].some((p) => p.referral);
  return { ...out, disclosure: referrals ? "Links marked \"Referral link\" are Snapfront referral links: Snapfront may earn a fee if you sign up through them, at no cost to you." : null };
}

/* ---------- the portfolio page ---------- */
const defaults = (seller) => ({ name: seller.store_name, headline: "UGC videos that make people stop scrolling", bio: "", niches: [], email: "",
  rates: [{ label: "1 UGC video (up to 60 seconds)", price: 150 }, { label: "3-video bundle", price: 400 }, { label: "Paid ad usage rights (30 days)", price: 100 }],
  socials: { tiktok: "", instagram: "", youtube: "" }, items: [] });
export function profile(seller) {
  const row = db.prepare("SELECT * FROM ugc_profiles WHERE seller_id = ?").get(seller.id);
  const body = { ...defaults(seller), ...(row ? JSON.parse(row.body) : {}) };
  return { enabled: Boolean(row?.enabled), ...body, page_url: storeUrl(seller.store_slug, "/ugc") };
}
function save(seller, enabled, body) {
  const { enabled: _e, page_url: _p, ...rest } = body;
  db.prepare("INSERT INTO ugc_profiles (seller_id, enabled, body) VALUES (?,?,?) ON CONFLICT(seller_id) DO UPDATE SET enabled = excluded.enabled, body = excluded.body, updated_at = datetime('now')")
    .run(seller.id, enabled ? 1 : 0, JSON.stringify(rest));
  return profile(seller);
}
function webUrl(raw) {
  let u = String(raw || "").trim();
  if (!u) return "";
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  try { const x = new URL(u); if (!/^https?:$/.test(x.protocol) || !x.hostname.includes(".")) throw 0; return x.href; } catch { throw httpError(400, `“${line(raw, 60)}” isn't a web address.`); }
}
export function updateProfile(seller, b = {}) {
  const cur = profile(seller);
  const next = { ...cur };
  if (b.name !== undefined) next.name = line(b.name, 60);
  if (b.headline !== undefined) next.headline = line(b.headline, 100);
  if (b.bio !== undefined) next.bio = String(b.bio || "").replace(/\r\n?/g, "\n").trim().slice(0, 800);
  if (b.niches !== undefined) next.niches = (Array.isArray(b.niches) ? b.niches : String(b.niches || "").split(",")).map((x) => line(x, 30)).filter(Boolean).slice(0, 8);
  if (b.email !== undefined) {
    const e = b.email ? cleanEmail(b.email) : "";
    if (b.email && !e) throw httpError(400, "Enter a valid email for brands to reach you.");
    next.email = e;
  }
  if (b.rates !== undefined) {
    if (!Array.isArray(b.rates)) throw httpError(400, "Rates must be a list.");
    next.rates = b.rates.slice(0, 8).map((r) => ({ label: line(r?.label, 60), price: Math.round(Number(r?.price)) })).filter((r) => r.label && r.price >= 0 && r.price <= 100000);
  }
  if (b.socials !== undefined) next.socials = Object.fromEntries(["tiktok", "instagram", "youtube"].map((k) => [k, b.socials?.[k] ? webUrl(b.socials[k]) : ""]));
  if (b.items !== undefined) {
    // Only reorders/removes items and adds links; uploaded videos are added through addVideo.
    if (!Array.isArray(b.items)) throw httpError(400, "Items must be a list.");
    const byId = new Map(cur.items.map((i) => [i.id, i]));
    next.items = b.items.slice(0, MAX_ITEMS).map((i) => {
      if (i?.id && byId.has(i.id)) return { ...byId.get(i.id), title: line(i.title ?? byId.get(i.id).title, 80) };
      if (i?.url) return { id: newId("ugi"), kind: "link", url: webUrl(i.url), title: line(i.title, 80) };
      return null;
    }).filter(Boolean);
    for (const old of cur.items) if (old.kind === "video" && !next.items.some((x) => x.id === old.id)) removeFiles(old);
  }
  const enabled = b.enabled !== undefined ? Boolean(b.enabled) : cur.enabled;
  if (enabled && seller.account_id && plans.effectivePlan(plans.getAccount(seller.account_id)) === "free") throw httpError(402, "Publishing your UGC page comes with Snapfront Pro.", { upgrade: "pro" });
  return save(seller, enabled, next);
}
function removeFiles(item) {
  for (const f of [item.file, item.poster]) if (f && /^[\w-]+\.(mp4|jpg)$/.test(f)) fs.rm(path.join(dirs.media, f), { force: true }, () => {});
}
function run(args, timeout = 300_000) {
  return new Promise((resolve, reject) => {
    const p = spawn(ffmpegPath, args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => { err = (err + d).slice(-1500); });
    const t = setTimeout(() => { p.kill("SIGKILL"); reject(httpError(400, "That video took too long to process. Try a shorter one.")); }, timeout);
    p.on("close", (code) => { clearTimeout(t); code === 0 ? resolve() : reject(httpError(400, "That file isn't a video we can use. Upload an MP4 or MOV.")); });
    p.on("error", () => { clearTimeout(t); reject(httpError(500, "Video processing isn't available right now.")); });
  });
}
/**
 * An uploaded video for the portfolio. Re-encoded to a standard MP4 (at most 3 minutes, 1080 wide),
 * which also guarantees we only ever serve real video, plus a poster image.
 */
const uploads = new Map();
export async function addVideo(seller, buf, title = "") {
  const now = Date.now(), recent = (uploads.get(seller.id) || []).filter((t) => now - t < 3600e3);
  if (recent.length >= 20) throw httpError(429, "That's a lot of uploads this hour. Try again later.");
  recent.push(now); uploads.set(seller.id, recent);
  const cur = profile(seller);
  if (cur.items.length >= MAX_ITEMS) throw httpError(400, `Your page holds up to ${MAX_ITEMS} videos. Remove one first.`);
  if (!buf || buf.length < 1000) throw httpError(400, "The video didn't come through. Try again.");
  fs.mkdirSync(dirs.media, { recursive: true });
  const tmp = path.join(dirs.media, `.ugc-${crypto.randomUUID()}`);
  const base = crypto.randomUUID();
  const file = `${base}.mp4`, poster = `${base}.jpg`;
  fs.writeFileSync(tmp, buf);
  try {
    // Only real video containers, read from this one file: a crafted playlist (HLS, concat) can't make ffmpeg read other files.
    await run(["-y", "-protocol_whitelist", "file", "-format_whitelist", "mov,mp4,m4a,3gp,3g2,mj2,matroska,webm,avi", "-i", tmp, "-t", "180", "-map", "0:v:0", "-map", "0:a:0?", "-vf", "scale='min(1080,iw)':-2", "-c:v", "libx264", "-preset", "veryfast", "-crf", "24",
      "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", path.join(dirs.media, file)]);
    await run(["-y", "-ss", "0.5", "-i", path.join(dirs.media, file), "-frames:v", "1", "-vf", "scale='min(720,iw)':-2", path.join(dirs.media, poster)]).catch(() => {});
  } catch (e) { fs.rmSync(path.join(dirs.media, file), { force: true }); throw e; }
  finally { fs.rmSync(tmp, { force: true }); }
  const item = { id: newId("ugi"), kind: "video", file, poster: fs.existsSync(path.join(dirs.media, poster)) ? poster : null, title: line(title, 80) };
  return save(seller, cur.enabled, { ...cur, items: [...cur.items, item] });
}
export const mediaUrl = (f) => (f ? `${config.publicUrl}/media/${f}` : null);
/** What the public page shows (null when the creator hasn't published it). */
export function publicPage(seller) {
  const p = profile(seller);
  if (!p.enabled) return null;
  return { ...p, items: p.items.map((i) => (i.kind === "video" ? { ...i, src: mediaUrl(i.file), poster_src: mediaUrl(i.poster) } : i)) };
}

/* ---------- scripts ---------- */
export async function script(account, b = {}) {
  const brand = line(b.brand, 80), product = line(b.product, 200);
  if (!product) throw httpError(400, "Say what product the video is for.");
  const style = ["testimonial", "unboxing", "problem-solution", "how-to", "before-after", "day-in-my-life"].includes(b.style) ? b.style : "testimonial";
  const seconds = [15, 30, 60].includes(Number(b.seconds)) ? Number(b.seconds) : 30;
  return plans.withAllowance(account, "post", async () => {
    const out = await askJson([{ type: "text", text: `Write a UGC video script a creator will film on their phone for a brand.
Brand: ${brand || "the brand"}. Product: ${product}. ${b.points ? `Key points from the brief: ${line(b.points, 500)}.` : ""}
Style: ${style}. Length: about ${seconds} seconds. Audience: TikTok and Instagram Reels; it may run as a paid ad.
Rules: natural first-person voice, no claims the brief doesn't support (no medical or income claims), hook in the first 2 seconds, works with the sound off.
Return JSON: {"hooks": [3 alternative opening lines, each max 70 chars], "scenes": [4-7 objects {"shot": string (what the camera shows, max 90 chars), "line": string (what the creator says, max 140 chars), "text": string (on-screen text, max 40 chars)}], "cta": string (max 60 chars), "tips": [3 short filming tips]}` }], 2500);
    return {
      style, seconds,
      hooks: (Array.isArray(out.hooks) ? out.hooks : []).map((x) => line(x, 90)).filter(Boolean).slice(0, 3),
      scenes: (Array.isArray(out.scenes) ? out.scenes : []).map((s) => ({ shot: line(s?.shot, 110), line: line(s?.line, 180), text: line(s?.text, 60) })).filter((s) => s.shot || s.line).slice(0, 7),
      cta: line(out.cta, 80), tips: (Array.isArray(out.tips) ? out.tips : []).map((x) => line(x, 120)).filter(Boolean).slice(0, 3),
    };
  });
}

/* ---------- brand deals ---------- */
const STATUSES = ["pitched", "talking", "booked", "delivered", "paid", "lost"];
const publicDeal = (d) => ({ id: d.id, brand: d.brand, contact: d.contact, status: d.status, amount: d.amount_cents / 100, due: d.due, note: d.note, created_at: d.created_at, updated_at: d.updated_at });
export function deals(seller) {
  const list = db.prepare("SELECT * FROM ugc_deals WHERE seller_id = ? ORDER BY CASE status WHEN 'paid' THEN 2 WHEN 'lost' THEN 3 ELSE 1 END, COALESCE(due, created_at)").all(seller.id).map(publicDeal);
  const sum = (f) => Math.round(list.filter(f).reduce((t, d) => t + d.amount * 100, 0)) / 100;
  return { deals: list, totals: { paid: sum((d) => d.status === "paid"), owed: sum((d) => d.status === "delivered"), booked: sum((d) => d.status === "booked"), pipeline: sum((d) => ["pitched", "talking"].includes(d.status)) } };
}
function dealFields(b, partial) {
  const f = {};
  if (b.brand !== undefined || !partial) { f.brand = line(b.brand, 80); if (!f.brand) throw httpError(400, "Add the brand's name."); }
  if (b.contact !== undefined) f.contact = line(b.contact, 120);
  if (b.status !== undefined) { if (!STATUSES.includes(b.status)) throw httpError(400, "Pick a status."); f.status = b.status; }
  if (b.amount !== undefined) { const a = Math.round(Number(b.amount || 0) * 100); if (!(a >= 0 && a <= 10_000_000)) throw httpError(400, "Enter the amount, like 150."); f.amount_cents = a; }
  if (b.due !== undefined) { if (b.due && !/^\d{4}-\d{2}-\d{2}$/.test(String(b.due))) throw httpError(400, "Use a date like 2026-11-01."); f.due = b.due || null; }
  if (b.note !== undefined) f.note = String(b.note || "").slice(0, 1000);
  return f;
}
export function addDeal(seller, b = {}) {
  if (db.prepare("SELECT COUNT(*) AS n FROM ugc_deals WHERE seller_id = ?").get(seller.id).n >= 500) throw httpError(429, "That's 500 deals. Remove some old ones first.");
  const f = dealFields(b, false);
  const id = newId("deal");
  db.prepare("INSERT INTO ugc_deals (id, seller_id, brand) VALUES (?,?,?)").run(id, seller.id, f.brand);
  return updateDeal(seller, id, b);
}
export function updateDeal(seller, id, b = {}) {
  const d = db.prepare("SELECT * FROM ugc_deals WHERE id = ? AND seller_id = ?").get(String(id), seller.id);
  if (!d) throw httpError(404, "That deal doesn't exist.");
  const f = dealFields(b, true);
  const keys = Object.keys(f);
  if (keys.length) db.prepare(`UPDATE ugc_deals SET ${keys.map((k) => `${k} = ?`).join(", ")}, updated_at = datetime('now') WHERE id = ?`).run(...keys.map((k) => f[k]), d.id);
  return publicDeal(db.prepare("SELECT * FROM ugc_deals WHERE id = ?").get(d.id));
}
export function deleteDeal(seller, id) {
  if (!db.prepare("DELETE FROM ugc_deals WHERE id = ? AND seller_id = ?").run(String(id), seller.id).changes) throw httpError(404, "That deal doesn't exist.");
}

// Faceless videos: a short vertical video for TikTok, Reels and Shorts with no one on camera. The
// AI writes a script for one of the seller's products; the seller can edit it; then an open-source
// voice (Kokoro) reads it over the product photos, with big captions and a closing call to action.
// Videos are made one at a time in the background; the app checks back for the finished file.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import { config, dirs } from "./config.js";
import { db, newId, rowToProduct } from "./db.js";
import { askJson, httpError } from "./claude.js";
import * as plans from "./plans.js";
import { storeUrl } from "./urls.js";
import { makeVideo, pngFromSvg, FONT_FILES, VOICES } from "./narrated.js";
import { wrap, familyOf, measure } from "./fonts.js";

db.exec(`CREATE TABLE IF NOT EXISTS faceless_jobs (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  product_id TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','working','done','failed')),
  script TEXT NOT NULL,
  voice TEXT NOT NULL,
  file TEXT,
  seconds INTEGER,
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`);
// A restart mid-video: start it again.
db.prepare("UPDATE faceless_jobs SET status = 'queued' WHERE status = 'working'").run();

export const STYLES = [
  { id: "reasons", name: "3 reasons to love it", how: "A listicle: three specific reasons, one per scene." },
  { id: "problem", name: "Problem, then solution", how: "Open on a relatable problem, then show how the product solves it." },
  { id: "pov", name: "POV", how: "A 'POV: you just found...' story told in second person." },
  { id: "howto", name: "How to use it", how: "A quick step-by-step of using the product." },
  { id: "gift", name: "Gift idea", how: "Pitch it as the perfect gift for a specific person." },
];
const line = (s, n) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);
const productOf = (seller, id) => {
  const r = id && db.prepare("SELECT * FROM products WHERE id = ? AND seller_id = ?").get(String(id), seller.id);
  if (!r) throw httpError(404, "Pick one of your products.");
  return rowToProduct(r);
};
function cleanScript(s) {
  const scenes = (Array.isArray(s?.scenes) ? s.scenes : []).map((x) => ({ text: line(x?.text, 60), say: line(x?.say, 220) })).filter((x) => x.text || x.say).slice(0, 6);
  if (scenes.length < 2) throw httpError(400, "A video needs at least 2 scenes, each with words on screen or a line to say.");
  return { hook: line(s?.hook, 70), scenes, cta: line(s?.cta, 60) || "Link in bio", caption: String(s?.caption || "").trim().slice(0, 600), hashtags: (Array.isArray(s?.hashtags) ? s.hashtags : []).map((h) => String(h).replace(/[^\p{L}\p{N}_]/gu, "")).filter(Boolean).slice(0, 10) };
}

/** AI script for a product in a style (editable before the video is made). */
export async function writeScript(account, seller, b = {}) {
  const p = productOf(seller, b.product_id);
  const style = STYLES.find((s) => s.id === b.style) || STYLES[0];
  return plans.withAllowance(account, "post", async () => {
    const out = await askJson([{ type: "text", text: `Write a faceless short video script (TikTok, Reels, Shorts; about 20-35 seconds) that sells this product. No one appears on camera: product photos, on-screen text and a voiceover.
Store: ${seller.store_name}. Product: ${p.title}. ${line(p.tagline, 150)} Details: ${line((p.bullets || []).join("; "), 400)} ${line(p.description, 500)} Price: $${(p.price_cents / 100).toFixed(2)}.
Style: ${style.name}. ${style.how}
Rules: specific to this product; no made-up claims, reviews, numbers or awards; the first scene is a scroll-stopping hook; spoken lines sound natural read aloud (write numbers as words); the last line tells people the link is in the bio.
Return JSON: {"hook": string (max 60 chars), "scenes": [4-5 objects {"text": string (on-screen words, max 45 chars), "say": string (voiceover, max 160 chars)}], "cta": string (max 40 chars), "caption": string (max 300 chars), "hashtags": [5-8 strings without #]}` }], 900);
    return { product_id: p.id, style: style.id, ...cleanScript(out) };
  });
}

/* ---------- drawing ---------- */
const VW = 1080, VH = 1920;
const FAM = { display: familyOf(FONT_FILES.display), bold: familyOf(FONT_FILES.bold) };
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
function captionSvg(text, { big = false, sub = "" } = {}) {
  const size = big ? 92 : 78;
  const lines = wrap(FONT_FILES.display, text, size, VW - 160, 4);
  const lh = size * 1.12, block = lines.length * lh;
  const top = big ? VH / 2 - block / 2 : VH * 0.62 - block / 2;
  // Each line sits on its own dark rounded box, like native captions, so it reads on any photo.
  const t = lines.map((l, i) => {
    const w = measure(FONT_FILES.display, l, size, -1 / size) + 56, y = top + i * lh;
    return `<rect x="${(VW - w) / 2}" y="${y + size * 0.12}" width="${w}" height="${lh}" rx="22" fill="#0B0D10" fill-opacity="0.72"/>`
      + `<text x="${VW / 2}" y="${y + size}" text-anchor="middle" font-family="${FAM.display}" font-size="${size}" fill="#FFFFFF" letter-spacing="-1">${esc(l)}</text>`;
  }).join("");
  const s = sub ? `<text x="${VW / 2}" y="${top + block + size + 70}" text-anchor="middle" font-family="${FAM.bold}" font-size="44" fill="#FFFFFF" fill-opacity="0.9">${esc(sub)}</text>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${VW}" height="${VH}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.05"/><stop offset="0.45" stop-color="#000" stop-opacity="0.25"/><stop offset="1" stop-color="#000" stop-opacity="0.72"/></linearGradient></defs>
<rect width="${VW}" height="${VH}" fill="url(#g)"/>${t}${s}</svg>`;
}
const POSITIONS = ["attention", "centre", "north", "south", "entropy"];
async function background(photo, i) {
  if (photo) {
    try {
      return await sharp(photo).rotate().resize(VW, VH, { fit: "cover", position: POSITIONS[i % POSITIONS.length] }).modulate({ brightness: 0.92 }).png().toBuffer();
    } catch { /* fall through to a plain background */ }
  }
  return sharp({ create: { width: VW, height: VH, channels: 3, background: i % 2 ? "#1B1F26" : "#101318" } }).png().toBuffer();
}
export async function slide(photo, i, text, opts) {
  const bg = await background(photo, i);
  return sharp(bg).composite([{ input: pngFromSvg(captionSvg(text, opts)), top: 0, left: 0 }]).png().toBuffer();
}

/* ---------- jobs ---------- */
const publicJob = (j) => ({ id: j.id, status: j.status, product_id: j.product_id, seconds: j.seconds, error: j.error, created_at: j.created_at,
  url: j.file ? `${config.publicUrl}/media/${j.file}` : null, download_url: j.file ? `${config.publicUrl}/media/${j.file}?download=1` : null, script: JSON.parse(j.script) });
export function jobs(seller) {
  return { voices: VOICES, styles: STYLES.map(({ id, name }) => ({ id, name })), jobs: db.prepare("SELECT * FROM faceless_jobs WHERE seller_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 30").all(seller.id).map(publicJob) };
}
export function job(seller, id) {
  const j = db.prepare("SELECT * FROM faceless_jobs WHERE id = ? AND seller_id = ?").get(String(id), seller.id);
  if (!j) throw httpError(404, "That video doesn't exist.");
  return publicJob(j);
}
export function start(seller, b = {}) {
  const p = productOf(seller, b.product_id);
  const script = cleanScript(b.script);
  const voice = VOICES.some((v) => v.id === b.voice) ? b.voice : "af_heart";
  if (db.prepare("SELECT COUNT(*) AS n FROM faceless_jobs WHERE seller_id = ? AND created_at >= datetime('now','-1 day')").get(seller.id).n >= 20) throw httpError(429, "That's 20 videos today. Make more tomorrow.");
  if (db.prepare("SELECT COUNT(*) AS n FROM faceless_jobs WHERE seller_id = ? AND status IN ('queued','working')").get(seller.id).n >= 3) throw httpError(429, "Three videos are already being made. Wait for one to finish.");
  const id = newId("fvid");
  db.prepare("INSERT INTO faceless_jobs (id, seller_id, product_id, script, voice) VALUES (?,?,?,?,?)").run(id, seller.id, p.id, JSON.stringify(script), voice);
  kick();
  return job(seller, id);
}
export function remove(seller, id) {
  const j = db.prepare("SELECT * FROM faceless_jobs WHERE id = ? AND seller_id = ?").get(String(id), seller.id);
  if (!j) throw httpError(404, "That video doesn't exist.");
  if (j.status === "working") throw httpError(409, "This video is being made. Delete it when it's done.");
  if (j.file) fs.rm(path.join(dirs.media, j.file), { force: true }, () => {});
  db.prepare("DELETE FROM faceless_jobs WHERE id = ?").run(j.id);
}

async function make(j) {
  const seller = db.prepare("SELECT * FROM sellers WHERE id = ?").get(j.seller_id);
  const s = JSON.parse(j.script);
  const p = j.product_id ? db.prepare("SELECT * FROM products WHERE id = ? AND seller_id = ?").get(j.product_id, j.seller_id) : null;
  // Photos: the product's own, then the store's cover and other products, so scenes look different.
  const files = [p?.image_file, seller.banner_file, ...db.prepare("SELECT image_file FROM products WHERE seller_id = ? AND image_file IS NOT NULL AND id != ? ORDER BY created_at DESC LIMIT 3").all(j.seller_id, j.product_id || "").map((r) => r.image_file)]
    .filter((f) => f && /^[\w-]+\.(jpg|jpeg|png|webp|gif)$/.test(f)).map((f) => path.join(dirs.images, f)).filter((f) => fs.existsSync(f));
  const photoFor = (i) => (files.length ? files[i === 0 || files.length === 1 ? 0 : (i % files.length)] : null);
  const slides = [];
  for (let i = 0; i < s.scenes.length; i++) {
    const sc = s.scenes[i];
    slides.push({ png: await slide(photoFor(i), i, sc.text || s.hook, { big: i === 0 }), say: sc.say || null, seconds: sc.say ? undefined : 2.5 });
  }
  const domain = storeUrl(seller.store_slug).replace(/^https?:\/\//, "").replace(/\/$/, "");
  slides.push({ png: await slide(photoFor(0), s.scenes.length, s.cta, { big: true, sub: domain }), seconds: 2.8 });
  fs.mkdirSync(dirs.media, { recursive: true });
  const file = `${crypto.randomUUID()}.mp4`;
  const { seconds } = await makeVideo(slides, { out: path.join(dirs.media, file), width: VW, height: VH, voice: j.voice, kenBurns: true, workDir: dirs.media });
  return { file, seconds };
}
let busy = false, started = false;
function kick() { if (started) setImmediate(() => work().catch((e) => console.error("[faceless]", e.message))); }
/** Make queued videos, one at a time. */
export async function work() {
  if (busy) return 0;
  busy = true;
  let n = 0;
  try {
    for (;;) {
      const j = db.prepare("SELECT * FROM faceless_jobs WHERE status = 'queued' ORDER BY created_at, rowid LIMIT 1").get();
      if (!j) break;
      db.prepare("UPDATE faceless_jobs SET status = 'working', updated_at = datetime('now') WHERE id = ?").run(j.id);
      try {
        const out = await make(j);
        db.prepare("UPDATE faceless_jobs SET status = 'done', file = ?, seconds = ?, updated_at = datetime('now') WHERE id = ?").run(out.file, out.seconds, j.id);
      } catch (e) {
        console.error("[faceless]", j.id, e.message);
        db.prepare("UPDATE faceless_jobs SET status = 'failed', error = ?, updated_at = datetime('now') WHERE id = ?").run("The video couldn't be made. Try again.", j.id);
      }
      n++;
    }
  } finally { busy = false; }
  return n;
}
export function startWorker() { started = true; kick(); }

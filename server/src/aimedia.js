// AI media on Runpod's public endpoints (https://docs.runpod.io/public-endpoints):
//   video  Wan 2.2 image-to-video: a product photo becomes a 5-second clip (about $0.30 each)
//   scene  Qwen Image Edit 2511: the product placed in a lifestyle photo, people included (about $0.02 each)
// Jobs run in the background; results are copied to our storage because Runpod's links expire after 7 days.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { config, dirs } from "./config.js";
import { ownsSellerImage as sellerOwnsImage } from "./media-ownership.js";
import { db, newId } from "./db.js";
import { httpError, sniffImage } from "./claude.js";
import sharp from "sharp";
import * as plans from "./plans.js";
import * as credits from "./credits.js";
import * as elevenVideo from "./eleven-video.js";

const API = "https://api.runpod.ai/v2";
const EP = { video: "wan-2-2-i2v-720", scene: "qwen-image-edit-2511" };
let fetchImpl = (...a) => fetch(...a);
export function setRunpodFetch(f) { fetchImpl = f; }   // tests
export const enabled = () => Boolean(config.runpodKey);

db.exec(`CREATE TABLE IF NOT EXISTS media_jobs (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  kind TEXT NOT NULL,                 -- video | scene
  status TEXT NOT NULL DEFAULT 'queued', -- queued | running | done | failed
  runpod_id TEXT,
  input TEXT NOT NULL,
  result TEXT,
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`);
// Which Runpod endpoint a job ran on (AI photos can use a premium engine).
if (!db.prepare("PRAGMA table_info(media_jobs)").all().some((c) => c.name === "endpoint")) db.exec("ALTER TABLE media_jobs ADD COLUMN endpoint TEXT");
// Photos made by AI, so the storefront can say so when one is used as a product photo.
db.exec("CREATE TABLE IF NOT EXISTS ai_images (file TEXT PRIMARY KEY, created_at TEXT NOT NULL DEFAULT (datetime('now')))");
export const markAi = (file) => db.prepare("INSERT OR IGNORE INTO ai_images (file) VALUES (?)").run(file);
export const isAiImage = (file) => Boolean(file && db.prepare("SELECT 1 FROM ai_images WHERE file = ?").get(file));

export const MOTIONS = [
  { id: "push", name: "Slow push-in", prompt: "slow cinematic camera push-in toward the product, shallow depth of field, a soft light sweep glides across it" },
  { id: "orbit", name: "Orbit", prompt: "smooth slow camera orbit around the product, soft studio lighting, subtle reflections" },
  { id: "sparkle", name: "Sparkle", prompt: "soft light rays and tiny glowing sparkles drift around the product, dreamy and premium" },
  { id: "alive", name: "Scene comes alive", prompt: "the scene gently comes alive: leaves sway, light flickers, fabric moves in a light breeze" },
];
export const SCENES = [
  { id: "mirror", name: "Mirror routine", prompt: "a young woman standing at a bright bathroom mirror using this product as part of her morning beauty routine" },
  { id: "hand", name: "In hand outdoors", prompt: "a hand holding this product outdoors on a sunny day, background softly blurred" },
  { id: "wear", name: "Being worn", prompt: "a model wearing or using this product in a natural street-style photo" },
  { id: "cafe", name: "Café table", prompt: "this product on a café table next to a latte, warm window light" },
  { id: "unbox", name: "Unboxing", prompt: "hands unboxing this product on a cozy bed with linen sheets" },
  { id: "flatlay", name: "Styled flat lay", prompt: "a styled top-down flat lay of this product with a few complementary props on a neutral surface" },
  { id: "gym", name: "At the gym", prompt: "this product in use at a modern gym, energetic natural light" },
  { id: "kitchen", name: "Kitchen counter", prompt: "this product on a bright kitchen counter in the morning" },
];
const KEEP = "Use the product from the image exactly as it is: keep its shape, colors, logo, label and any text unchanged and clearly visible. Photorealistic, natural light, realistic hands and skin, shot on a modern phone camera. No added text, captions or watermarks.";
// Engines for AI lifestyle photos. Standard is included with the plan; Google's Nano Banana models
// are sharper with people, hands and small print, and use credits (failed photos refund them).
const ep = (env, dflt) => String(process.env[env] || dflt).trim();
export const PHOTO_ENGINES = [
  { id: "standard", name: "Standard", blurb: "Included with your plan. Fast and good for most products.", usd: 0 },
  { id: "nano-banana-pro", name: "Nano Banana Pro", blurb: "Google's best image model: the most lifelike people, hands and labels.", usd: 0.14,
    endpoint: () => ep("RUNPOD_EP_NANO_PRO", "nano-banana-pro-edit"),
    input: (image, prompt) => ({ images: [image], prompt, resolution: "2k", aspect_ratio: "4:5", output_format: "jpeg", enable_safety_checker: true }) },
  { id: "nano-banana-2", name: "Nano Banana 2", blurb: "Google's newest model: fast, sharp and natural.", usd: 0.13,
    endpoint: () => ep("RUNPOD_EP_NANO_2", "google-nano-banana-2-edit"),
    input: (image, prompt) => ({ images: [image], prompt, resolution: "2k", aspect_ratio: "4:5", output_format: "jpeg" }) },
];
export const photoEnginePrice = (e) => (e.usd ? credits.creditsFor(e.usd) : 0);
export const presets = () => ({ enabled: enabled(), motions: MOTIONS.map(({ id, name }) => ({ id, name })), scenes: SCENES.map(({ id, name }) => ({ id, name })),
  engines: PHOTO_ENGINES.map((e) => ({ id: e.id, name: e.name, blurb: e.blurb, credits: photoEnginePrice(e) })) });

/** What the owner sees when Runpod is out of money. */
export const OWNER_EMPTY = "Runpod is out of money. Initial AI avatar portraits can use the configured ElevenLabs image backup. Product-photo edits, avatar/product composites and photo blends still require Runpod funds. Add funds at runpod.io (Billing).";
let onEmpty = null, lastEmptyAlert = 0;
/** Called (at most every 6 hours) when Runpod says the balance is empty. */
export function onOutOfCredit(fn) { onEmpty = fn; lastEmptyAlert = 0; }
/** The message to show: the owner's clear one when Runpod is out of money, else the error's own. */
export const messageFor = (e, account) => (e?.runpod?.status === 402 && credits.isOwner(account) ? OWNER_EMPTY : e?.message);
async function rp(pathname, body) {
  if (!enabled()) throw httpError(503, "AI video isn't switched on yet.");
  let res;
  try {
    res = await fetchImpl(`${API}/${pathname}`, {
      method: body ? "POST" : "GET", signal: AbortSignal.timeout(60_000),
      headers: { Authorization: `Bearer ${config.runpodKey.trim()}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined,
    });
  } catch { throw httpError(502, "The AI studio didn't answer. Try again in a moment."); }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 || res.status === 403) { console.error("[runpod] key rejected"); throw httpError(503, "The AI studio isn't set up correctly. We're on it."); }
  // Runpod's account is out of money: every AI photo and video fails until it's topped up. Members get a
  // calm message (nothing they can do), the owner a clear one (see OWNER_EMPTY) and an email.
  if (res.status === 402) {
    console.error("[runpod] insufficient balance");
    const e = httpError(503, "AI photos and videos are paused for a little while. Try again soon.");
    e.runpod = { status: 402, error: "insufficient balance" };
    if (onEmpty && Date.now() - lastEmptyAlert > 6 * 3600e3) { lastEmptyAlert = Date.now(); Promise.resolve().then(onEmpty).catch(() => {}); }
    throw e;
  }
  if (!res.ok) {
    console.warn("[runpod]", pathname, res.status, JSON.stringify(data).slice(0, 300));
    const e = httpError(502, "The AI studio had a problem. Try again.");
    e.runpod = { status: res.status, error: String(data?.error || data?.message || JSON.stringify(data)).slice(0, 300) };   // owner-only routes show this
    throw e;
  }
  return data;
}

/** Runpod calls and result downloads for other AI tools (faceless avatars), sharing the key, errors and test stand-in. */
export const runpod = (pathname, body) => rp(pathname, body);
export const download = (url, ms = 120_000) => fetchImpl(url, { signal: AbortSignal.timeout(ms) });

/** Whether the key works (logged at startup). */
export async function check() {
  const k = config.runpodKey;
  console.log(`[runpod] key from ${process.env.RUNPOD_API_KEY ? "RUNPOD_API_KEY" : "SNAPFRONT_KEY"}: ${k.length} characters, ${k.startsWith("rpa_") ? "starts like a Runpod key" : "does not start with rpa_"}${/\s/.test(k) ? ", contains spaces" : ""}`);
  const r = await fetchImpl(`${API}/${EP.scene}/status/snapfront-key-check`, { headers: { Authorization: `Bearer ${k.trim()}` }, signal: AbortSignal.timeout(15_000) });
  if (r.status === 401 || r.status === 403) console.warn(`[runpod] key rejected (${r.status}): ${(await r.text()).slice(0, 200)}`);
  return r.status === 401 || r.status === 403 ? r.status : 200;
}

const publicImage = (seller, file) => {
  if (!/^[\w-]+\.(jpg|jpeg|png|webp)$/.test(String(file || "")) || !fs.existsSync(path.join(dirs.images, file))) throw httpError(400, "Choose a product photo first.");
  if (!sellerOwnsImage(seller.id, file)) throw httpError(403, "Choose a photo that belongs to this store.");
  return `${config.publicUrl}/img/${file}`;
};
const kindOf = (k) => (k === "video" ? "video" : "scene");

/**
 * The file link in a finished Runpod job. Runpod has changed this shape before
 * (output.video_url / output.image_url, a bare string, a list, output.result...), so look
 * for the named fields first, then any http(s) link anywhere in the output.
 */
export function resultUrl(output, kind) {
  if (!output) return null;
  if (typeof output === "string") {
    if (/^https?:\/\//.test(output)) return output;
    try { return resultUrl(JSON.parse(output), kind); } catch { return null; }
  }
  const named = kind === "video" ? ["video_url", "video", "url", "result"] : ["image_url", "image", "url", "result"];
  for (const k of named) {
    const v = output[k];
    if (typeof v === "string" && /^https?:\/\//.test(v)) return v;
  }
  const seen = [];
  const walk = (v) => {
    if (typeof v === "string") { if (/^https?:\/\//.test(v)) seen.push(v); return; }
    if (v && typeof v === "object") for (const x of Array.isArray(v) ? v : Object.values(v)) walk(x);
  };
  walk(output);
  const want = kind === "video" ? /\.(mp4|webm|mov)(\?|$)/i : /\.(jpe?g|png|webp)(\?|$)/i;
  return seen.find((u) => want.test(u)) || seen[0] || null;
}

/** Start an AI video or scene. Counts against the plan when it starts; refunded if it fails. */
export async function start(account, seller, { kind, image_file, preset, prompt, engine }) {
  kind = kindOf(kind);
  const list = kind === "video" ? MOTIONS : SCENES;
  const p = preset ? list.find((m) => m.id === preset) : null;
  if (preset && !p) throw httpError(400, "That option isn't available.");
  const custom = String(prompt || "").replace(/\s+/g, " ").trim().slice(0, 300);
  if (!p && custom.length < 3) throw httpError(400, kind === "video" ? "Pick a motion or describe one." : "Pick a scene or describe one.");
  const image = publicImage(seller, image_file);
  const eng = kind === "scene" ? PHOTO_ENGINES.find((e) => e.id === (engine || "standard")) : PHOTO_ENGINES[0];
  if (!eng) throw httpError(400, "That photo engine isn't available.");
  const premium = Boolean(eng.usd);
  if (!premium) plans.assertAllowance(account, kind);   // premium engines are paid with credits instead
  const input = kind === "video"
    ? { image, prompt: `${p ? p.prompt : custom}. The product itself stays exactly the same: same shape, colors, logo and label. No text.`, negative_prompt: "text, watermark, distorted product, extra limbs, blurry", size: "720*1280", duration: 5, seed: -1,
        // Runpod's endpoint rejects the job unless these are all sent (their docs call them optional).
        num_inference_steps: 30, guidance: 5, flow_shift: 5, enable_prompt_optimization: false, enable_safety_checker: true }
    : premium ? eng.input(image, `Create a photorealistic lifestyle photo for an online store: ${p ? p.prompt : custom}. ${KEEP}`)
    : { images: [image], prompt: `Create a photorealistic lifestyle photo for an online store: ${p ? p.prompt : custom}. ${KEEP}`, size: "1024*1280", output_format: "jpeg", seed: -1 };
  const endpoint = premium ? eng.endpoint() : EP[kind];
  const id = newId("job");
  if (premium) credits.spend(account, photoEnginePrice(eng), id, `${eng.name} photo`);
  db.prepare("INSERT INTO media_jobs (id, seller_id, account_id, kind, input, endpoint) VALUES (?,?,?,?,?,?)").run(id, seller.id, account.id, kind, JSON.stringify({ ...input, preset: p?.id || null, engine: eng.id }), endpoint);
  if (!premium) plans.recordUsage(account, kind);
  try {
    const primary = () => rp(`${endpoint}/run`, { input });
    const r = kind === "video" ? await elevenVideo.submit(id, primary, {
      kind: "motion", imageFile: image_file, prompt: input.prompt, duration: 5, resolution: "720p", sound: false,
    }) : await primary();
    db.prepare("UPDATE media_jobs SET status='running', runpod_id=?, updated_at=datetime('now') WHERE id=?").run(r.id, id);
  } catch (e) { fail(id, e.message); throw e; }
  return view(db.prepare("SELECT * FROM media_jobs WHERE id = ?").get(id));
}

function fail(id, message) {
  const job = db.prepare("SELECT * FROM media_jobs WHERE id = ?").get(id);
  if (!job || job.status === "failed" || job.status === "done") return;
  db.prepare("UPDATE media_jobs SET status='failed', error=?, updated_at=datetime('now') WHERE id=?").run(String(message).slice(0, 300), id);
  // Premium photos were paid with credits; standard ones used the plan's allowance.
  if (!credits.refund(id) && !db.prepare("SELECT 1 FROM credit_ledger WHERE ref = ?").get(id)) plans.refundUsage(plans.getAccount(job.account_id), job.kind);
}

/** Check running jobs; copy finished files to our storage. Called on a timer and when the app asks. */
const polling = new Set();
export async function poll(id = null) {
  const jobs = id ? db.prepare("SELECT * FROM media_jobs WHERE id = ? AND status = 'running'").all(id)
    : db.prepare("SELECT * FROM media_jobs WHERE status = 'running' ORDER BY created_at LIMIT 20").all();
  for (const job of jobs) {
    if (polling.has(job.id)) continue;
    polling.add(job.id);
    try {
      const backup = elevenVideo.backupFor(job.id);
      const r = backup ? await elevenVideo.poll(job.id) : await rp(`${job.endpoint || EP[job.kind]}/status/${job.runpod_id}`);
      if (r.status === "COMPLETED") {
        const url = resultUrl(r.output, job.kind);
        if (!url) {
          console.warn("[runpod] job", job.id, "finished without a file link:", JSON.stringify(r).slice(0, 600));
          fail(job.id, "The AI finished but didn't send the file back. Try again.");
          continue;
        }
        const res = await fetchImpl(url, { signal: AbortSignal.timeout(120_000) });
        if (!res.ok) throw new Error(`download ${res.status}`);
        let buf = Buffer.from(await res.arrayBuffer());
        // Some models send PNG; photos here are saved as JPEG.
        if (job.kind !== "video" && sniffImage(buf) !== "image/jpeg") buf = await sharp(buf).flatten({ background: "#ffffff" }).jpeg({ quality: 92 }).toBuffer();
        let result;
        if (job.kind === "video") {
          const name = `${crypto.randomUUID()}.mp4`;
          fs.writeFileSync(path.join(dirs.media, name), buf);
          if (backup) await elevenVideo.finishMotion(path.join(dirs.media, name), 5, false);
          result = { file: name, url: `${config.publicUrl}/media/${name}` };
        } else {
          const name = `${crypto.randomUUID()}.jpg`;
          fs.writeFileSync(path.join(dirs.images, name), buf);
          db.prepare("INSERT OR IGNORE INTO ai_images (file) VALUES (?)").run(name);
          db.prepare("INSERT OR IGNORE INTO seller_media (image_file,seller_id) VALUES (?,?)").run(name, job.seller_id);
          result = { image_file: name, url: `${config.publicUrl}/img/${name}` };
        }
        db.prepare("UPDATE media_jobs SET status='done', result=?, updated_at=datetime('now') WHERE id=?").run(JSON.stringify({ ...result, cost: r.output?.cost ?? null }), job.id);
        if (backup) elevenVideo.completed(job.id);
      } else if (["FAILED", "CANCELLED", "TIMED_OUT"].includes(r.status)) {
        console.warn("[runpod] job", job.id, r.status, JSON.stringify(r.error || r.output || "").slice(0, 600));
        fail(job.id, "The AI couldn't make this one. Try a different photo or option.");
      } else if (Date.now() - Date.parse(`${job.created_at}Z`) > 20 * 60_000) {
        fail(job.id, "This took too long. Try again.");
      }
    } catch (e) {
      console.warn("[runpod] poll", job.id, e.message);
      if (Date.now() - Date.parse(`${job.created_at}Z`) > 20 * 60_000) fail(job.id, "This took too long. Try again.");
    } finally { polling.delete(job.id); }
  }
}

export const view = (j) => ({
  id: j.id, kind: j.kind, status: j.status, error: j.status === "failed" ? j.error : null, created_at: j.created_at,
  ...(j.result ? (({ cost, ...r }) => r)(JSON.parse(j.result)) : {}),
});
export const jobsFor = (seller) => db.prepare("SELECT * FROM media_jobs WHERE seller_id = ? ORDER BY created_at DESC LIMIT 30").all(seller.id).map(view);
export function jobFor(seller, id) {
  const j = db.prepare("SELECT * FROM media_jobs WHERE id = ? AND seller_id = ?").get(String(id || ""), seller.id);
  if (!j) throw httpError(404, "That isn't one of your AI creations.");
  return j;
}

/** One-off edit that waits for the result: the photo studio's "describe your own background". */
export async function editNow(imageFile, prompt) {
  // This internal helper is only called by studio.restyle after the authenticated route has
  // validated seller ownership of the source. It intentionally cannot be reached as an API.
  if (!/^[\w-]+\.(jpg|jpeg|png|webp)$/.test(String(imageFile || "")) || !fs.existsSync(path.join(dirs.images, imageFile))) throw httpError(400, "Choose a product photo first.");
  const image = `${config.publicUrl}/img/${imageFile}`;
  const r = await rp(`${EP.scene}/runsync`, { input: { images: [image], prompt: `Place this exact product ${prompt}. Professional product photography. ${KEEP}`, size: "1280*1280", output_format: "jpeg", seed: -1 } });
  let out = r;
  for (let i = 0; i < 30 && out.status !== "COMPLETED" && !["FAILED", "CANCELLED", "TIMED_OUT"].includes(out.status); i++) {
    await new Promise((s) => setTimeout(s, 2000));
    out = await rp(`${EP.scene}/status/${r.id}`);
  }
  const url = out.status === "COMPLETED" ? resultUrl(out.output, "scene") : null;
  if (!url) {
    console.warn("[runpod] edit", r.id, out.status, JSON.stringify(out.error || out.output || "").slice(0, 600));
    throw httpError(502, "The AI couldn't make that background. Try different words.");
  }
  const res = await fetchImpl(url, { signal: AbortSignal.timeout(60_000) });
  return Buffer.from(await res.arrayBuffer());
}

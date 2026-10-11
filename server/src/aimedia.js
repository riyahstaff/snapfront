// AI media on Runpod's public endpoints (https://docs.runpod.io/public-endpoints):
//   video  Wan 2.2 image-to-video: a product photo becomes a 5-second clip (about $0.30 each)
//   scene  Qwen Image Edit 2511: the product placed in a lifestyle photo, people included (about $0.02 each)
// Jobs run in the background; results are copied to our storage because Runpod's links expire after 7 days.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { config, dirs } from "./config.js";
import { db, newId } from "./db.js";
import { httpError } from "./claude.js";
import * as plans from "./plans.js";

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
export const presets = () => ({ enabled: enabled(), motions: MOTIONS.map(({ id, name }) => ({ id, name })), scenes: SCENES.map(({ id, name }) => ({ id, name })) });

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
  if (!res.ok) { console.warn("[runpod]", pathname, res.status, JSON.stringify(data).slice(0, 300)); throw httpError(502, "The AI studio had a problem. Try again."); }
  return data;
}

/** Whether the key works (logged at startup). */
export async function check() {
  const k = config.runpodKey;
  console.log(`[runpod] key from ${process.env.RUNPOD_API_KEY ? "RUNPOD_API_KEY" : "SNAPFRONT_KEY"}: ${k.length} characters, ${k.startsWith("rpa_") ? "starts like a Runpod key" : "does not start with rpa_"}${/\s/.test(k) ? ", contains spaces" : ""}`);
  const r = await fetchImpl(`${API}/${EP.scene}/status/snapfront-key-check`, { headers: { Authorization: `Bearer ${k.trim()}` }, signal: AbortSignal.timeout(15_000) });
  if (r.status === 401 || r.status === 403) console.warn(`[runpod] key rejected (${r.status}): ${(await r.text()).slice(0, 200)}`);
  return r.status === 401 || r.status === 403 ? r.status : 200;
}

const publicImage = (file) => {
  if (!/^[\w-]+\.(jpg|jpeg|png|webp)$/.test(String(file || "")) || !fs.existsSync(path.join(dirs.images, file))) throw httpError(400, "Choose a product photo first.");
  return `${config.publicUrl}/img/${file}`;
};
const kindOf = (k) => (k === "video" ? "video" : "scene");

/** Start an AI video or scene. Counts against the plan when it starts; refunded if it fails. */
export async function start(account, seller, { kind, image_file, preset, prompt }) {
  kind = kindOf(kind);
  const list = kind === "video" ? MOTIONS : SCENES;
  const p = preset ? list.find((m) => m.id === preset) : null;
  if (preset && !p) throw httpError(400, "That option isn't available.");
  const custom = String(prompt || "").replace(/\s+/g, " ").trim().slice(0, 300);
  if (!p && custom.length < 3) throw httpError(400, kind === "video" ? "Pick a motion or describe one." : "Pick a scene or describe one.");
  const image = publicImage(image_file);
  plans.assertAllowance(account, kind);
  const input = kind === "video"
    ? { image, prompt: `${p ? p.prompt : custom}. The product itself stays exactly the same: same shape, colors, logo and label. No text.`, negative_prompt: "text, watermark, distorted product, extra limbs, blurry", size: "720*1280", duration: 5, seed: -1 }
    : { images: [image], prompt: `Create a photorealistic lifestyle photo for an online store: ${p ? p.prompt : custom}. ${KEEP}`, size: "1024*1280", output_format: "jpeg", seed: -1 };
  const id = newId("job");
  db.prepare("INSERT INTO media_jobs (id, seller_id, account_id, kind, input) VALUES (?,?,?,?,?)").run(id, seller.id, account.id, kind, JSON.stringify({ ...input, preset: p?.id || null }));
  plans.recordUsage(account, kind);
  try {
    const r = await rp(`${EP[kind]}/run`, { input });
    db.prepare("UPDATE media_jobs SET status='running', runpod_id=?, updated_at=datetime('now') WHERE id=?").run(r.id, id);
  } catch (e) { fail(id, e.message); throw e; }
  return view(db.prepare("SELECT * FROM media_jobs WHERE id = ?").get(id));
}

function fail(id, message) {
  const job = db.prepare("SELECT * FROM media_jobs WHERE id = ?").get(id);
  if (!job || job.status === "failed") return;
  db.prepare("UPDATE media_jobs SET status='failed', error=?, updated_at=datetime('now') WHERE id=?").run(String(message).slice(0, 300), id);
  plans.refundUsage(plans.getAccount(job.account_id), job.kind);
}

/** Check running jobs; copy finished files to our storage. Called on a timer and when the app asks. */
export async function poll(id = null) {
  const jobs = id ? db.prepare("SELECT * FROM media_jobs WHERE id = ? AND status = 'running'").all(id)
    : db.prepare("SELECT * FROM media_jobs WHERE status = 'running' ORDER BY created_at LIMIT 20").all();
  for (const job of jobs) {
    try {
      const r = await rp(`${EP[job.kind]}/status/${job.runpod_id}`);
      if (r.status === "COMPLETED") {
        const url = r.output?.video_url || r.output?.image_url;
        if (!url) { fail(job.id, "No file came back."); continue; }
        const res = await fetchImpl(url, { signal: AbortSignal.timeout(120_000) });
        if (!res.ok) throw new Error(`download ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        let result;
        if (job.kind === "video") {
          const name = `${crypto.randomUUID()}.mp4`;
          fs.writeFileSync(path.join(dirs.media, name), buf);
          result = { file: name, url: `${config.publicUrl}/media/${name}` };
        } else {
          const name = `${crypto.randomUUID()}.jpg`;
          fs.writeFileSync(path.join(dirs.images, name), buf);
          db.prepare("INSERT OR IGNORE INTO ai_images (file) VALUES (?)").run(name);
          result = { image_file: name, url: `${config.publicUrl}/img/${name}` };
        }
        db.prepare("UPDATE media_jobs SET status='done', result=?, updated_at=datetime('now') WHERE id=?").run(JSON.stringify({ ...result, cost: r.output?.cost ?? null }), job.id);
      } else if (["FAILED", "CANCELLED", "TIMED_OUT"].includes(r.status)) {
        console.warn("[runpod] job", job.id, r.status, JSON.stringify(r.error || "").slice(0, 200));
        fail(job.id, "The AI couldn't make this one. Try a different photo or option.");
      } else if (Date.now() - Date.parse(`${job.created_at}Z`) > 20 * 60_000) {
        fail(job.id, "This took too long. Try again.");
      }
    } catch (e) {
      console.warn("[runpod] poll", job.id, e.message);
      if (Date.now() - Date.parse(`${job.created_at}Z`) > 20 * 60_000) fail(job.id, "This took too long. Try again.");
    }
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
  const image = publicImage(imageFile);
  const r = await rp(`${EP.scene}/runsync`, { input: { images: [image], prompt: `Place this exact product ${prompt}. Professional product photography. ${KEEP}`, size: "1280*1280", output_format: "jpeg", seed: -1 } });
  let out = r;
  for (let i = 0; i < 30 && out.status !== "COMPLETED" && !["FAILED", "CANCELLED", "TIMED_OUT"].includes(out.status); i++) {
    await new Promise((s) => setTimeout(s, 2000));
    out = await rp(`${EP.scene}/status/${r.id}`);
  }
  if (out.status !== "COMPLETED" || !out.output?.image_url) throw httpError(502, "The AI couldn't make that background. Try different words.");
  const res = await fetchImpl(out.output.image_url, { signal: AbortSignal.timeout(60_000) });
  return Buffer.from(await res.arrayBuffer());
}

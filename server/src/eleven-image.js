// Image fallback shared by avatars, photo studios and Mira. Only switch after an explicit
// Runpod balance rejection; never resubmit a request whose acceptance is uncertain.
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { db } from "./db.js";
import { config, dirs } from "./config.js";
import { httpError } from "./claude.js";

const API = "https://api.elevenlabs.io/v1";
const PREFIX = "eleven-image:";
const key = () => String(process.env.ELEVENLABS_API_KEY || "").trim();
export const enabled = () => process.env.ELEVENLABS_IMAGE_BACKUP === "true" && Boolean(key());
export const isBackup = (id) => String(id || "").startsWith(PREFIX);
let fetchImpl = (...args) => fetch(...args);
export function setImageFetch(f) { fetchImpl = f; }

// Preserve the schema and generation IDs from the original portrait-only integration.
db.exec(`CREATE TABLE IF NOT EXISTS image_backups (
  job_id TEXT PRIMARY KEY, generation_id TEXT, status TEXT NOT NULL DEFAULT 'submitting',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`);
for (const [name, type] of Object.entries({ next_poll: "INTEGER NOT NULL DEFAULT 0", output_url: "TEXT", output_until: "INTEGER NOT NULL DEFAULT 0" })) {
  if (!db.prepare("PRAGMA table_info(image_backups)").all().some((c) => c.name === name)) db.exec(`ALTER TABLE image_backups ADD COLUMN ${name} ${type}`);
}
const setting = (name, fallback) => {
  const n = Number(process.env[name] ?? fallback);
  return Number.isSafeInteger(n) && n >= 0 ? n : fallback;
};
async function request(route, body) {
  let response;
  try {
    response = await fetchImpl(`${API}${route}`, {
      method: body ? "POST" : "GET", headers: { "xi-api-key": key(), "Content-Type": "application/json" },
      signal: AbortSignal.timeout(60_000), ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    const e = httpError(503, "The backup image studio didn't answer. Please try again later.");
    e.transient = !body; // A POST may already have been billed. Never automatically resubmit it.
    throw e;
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.warn(`[eleven-image] request ${response.status}`);
    const e = httpError(503, [401, 403].includes(response.status)
      ? "The backup image studio needs Image & Video API permission. Please check its API key settings."
      : "The backup image studio is unavailable. Please try again later.");
    e.elevenStatus = response.status;
    e.transient = !body && (response.status >= 500 || response.status === 429);
    throw e;
  }
  return data;
}
export async function check() {
  if (!key()) return { enabled: enabled(), ready: false, reason: "missing_key" };
  try {
    await request("/flows/image?page_size=1");
    const s = await request("/user/subscription");
    return { enabled: enabled(), ready: true, tier: s.tier, remainingCredits: Math.max(0, Number(s.character_limit) - Number(s.character_count)) };
  } catch (e) { return { enabled: enabled(), ready: false, status: e.elevenStatus || null }; }
}

async function reference(value) {
  let bytes;
  const data = /^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(value || ""));
  if (data) {
    if (data[1].length > 35 * 1024 * 1024) throw httpError(400, "The reference photo is too large.");
    bytes = Buffer.from(data[1], "base64");
  } else {
    let url;
    try { url = new URL(value); } catch { throw httpError(400, "Upload the reference photo to your store first."); }
    const file = /^\/img\/([\w-]+\.(?:jpg|jpeg|png|webp|gif))$/.exec(url.pathname)?.[1];
    // Callers already enforce ownership. Never fetch caller-supplied remote URLs.
    if (url.origin !== new URL(config.publicUrl).origin || url.username || url.password || !file) throw httpError(400, "Upload the reference photo to your store first.");
    const local = path.join(dirs.images, file);
    if (!fs.existsSync(local)) throw httpError(400, "The reference photo is missing. Upload it again.");
    if (fs.statSync(local).size > 25 * 1024 * 1024) throw httpError(400, "The reference photo is too large.");
    bytes = fs.readFileSync(local);
  }
  if (bytes.length > 25 * 1024 * 1024) throw httpError(400, "The reference photo is too large.");
  const image = await sharp(bytes, { limitInputPixels: 30_000_000 }).rotate()
    .resize({ width: 2048, height: 2048, fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#ffffff" }).jpeg({ quality: 92 }).toBuffer();
  return { type: "inline_base64", mime_type: "image/jpeg", content_base64: image.toString("base64") };
}
const ratios = ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"];
function aspect(input) {
  if (ratios.includes(input.aspect_ratio) || input.aspect_ratio === "auto") return input.aspect_ratio;
  const [w, h] = String(input.size || "").split("*").map(Number);
  if (!(w > 0 && h > 0)) return "1:1";
  return ratios.reduce((best, ratio) => {
    const distance = (r) => { const [a, b] = r.split(":").map(Number); return Math.abs(Math.log((a / b) / (w / h))); };
    return distance(ratio) < distance(best) ? ratio : best;
  }, "1:1");
}

/** Retains a string-prompt entry point for older callers; new callers pass complete image inputs. */
export async function submit(input) {
  if (!enabled()) throw httpError(503, "The backup image studio isn't enabled.");
  if (typeof input === "string") input = { prompt: input, aspect_ratio: "4:5", resolution: "2K" };
  const prompt = String(input?.prompt || "").trim();
  if (!prompt || prompt.length > 16000) throw httpError(400, "Provide an image description under 16,000 characters.");
  const sources = input.images ?? (input.image ? [input.image] : []);
  if (!Array.isArray(sources) || sources.length > 10) throw httpError(400, "Use up to 10 reference images.");
  const images = [];
  for (const source of sources) images.push(await reference(source));
  const model = String(process.env.ELEVENLABS_IMAGE_MODEL || "gemini-3-pro-image").trim();
  if (!["gemini-3-pro-image", "gemini-3.1-flash-image"].includes(model)) throw httpError(503, "Configure a supported Gemini model for the image backup.");
  const s = await request("/user/subscription");
  const remaining = Number(s.character_limit) - Number(s.character_count);
  if (!Number.isFinite(remaining) || remaining <= setting("ELEVENLABS_IMAGE_CREDIT_RESERVE", setting("ELEVENLABS_VIDEO_CREDIT_RESERVE", 50000))) {
    throw httpError(503, "The backup image studio is low on credits. Please try again later.");
  }
  const jobId = `image:${randomUUID()}`;
  db.transaction(() => {
    const used = db.prepare("SELECT COUNT(*) AS n FROM image_backups WHERE created_at >= date('now')").get().n;
    if (used >= setting("ELEVENLABS_IMAGE_DAILY_LIMIT", 10)) throw httpError(503, "The backup image studio has reached today's limit. Please try again later.");
    db.prepare("INSERT INTO image_backups (job_id,status) VALUES (?,'submitting')").run(jobId);
  })();
  try {
    const result = await request("/flows/image", {
      model_id: model, prompt: prompt + (input.negative_prompt ? `\nAvoid: ${String(input.negative_prompt).slice(0, 2000)}` : ""),
      aspect_ratio: aspect(input), resolution: ["2K", "4K"].includes(String(input.resolution).toUpperCase()) ? String(input.resolution).toUpperCase() : "1K",
      ...(images.length ? { images } : {}),
    });
    if (typeof result.id !== "string" || !result.id) throw httpError(502, "The backup image studio didn't return a generation ID.");
    db.prepare("UPDATE image_backups SET generation_id=?,status='running' WHERE job_id=?").run(result.id, jobId);
    console.log(`[eleven-image] backup started ${jobId} ${model} references=${images.length}`);
    return { id: `${PREFIX}${result.id}`, status: "IN_QUEUE" };
  } catch (e) {
    db.prepare("UPDATE image_backups SET status='failed' WHERE job_id=?").run(jobId);
    throw e;
  }
}

/** Poll existing generations even when new backups are disabled. Never resubmit an accepted job. */
export async function poll(generationId) {
  const row = db.prepare("SELECT * FROM image_backups WHERE generation_id=?").get(generationId);
  if (!row) throw httpError(404, "The backup image request is missing.");
  if (row.status === "failed") return { status: "FAILED" };
  const now = Date.now();
  if (row.output_url && row.output_until > now) return { status: "COMPLETED", output: { image_url: row.output_url } };
  if (!db.prepare("UPDATE image_backups SET next_poll=? WHERE job_id=? AND next_poll<=?").run(now + 4000, row.job_id, now).changes) return { status: "IN_PROGRESS" };
  const result = await request(`/flows/image/${encodeURIComponent(generationId)}`);
  if (result.status === "completed") {
    let url;
    try { url = new URL(result.content_url); } catch { throw httpError(502, "The backup image result is missing."); }
    if (url.protocol !== "https:" || url.username || url.password || !String(result.content_mime_type || "").startsWith("image/")) throw httpError(502, "The backup image result was invalid.");
    db.prepare("UPDATE image_backups SET status='completed',output_url=?,output_until=? WHERE job_id=?").run(url.href, now + 45 * 60000, row.job_id);
    return { status: "COMPLETED", output: { image_url: url.href } };
  }
  if (result.status === "failed") {
    db.prepare("UPDATE image_backups SET status='failed' WHERE job_id=?").run(row.job_id);
    return { status: "FAILED", error: "The backup image studio could not complete this image." };
  }
  return { status: "IN_PROGRESS" };
}
const imageEndpoint = (endpoint) => ["qwen-image-t2i", "qwen-image-edit-2511", "nano-banana-pro-edit", "google-nano-banana-2-edit", "seedream-v4-edit", "seedream-v4-t2i",
  ...["RUNPOD_EP_NANO_PRO", "RUNPOD_EP_NANO_2", "RUNPOD_EP_BLEND", "RUNPOD_EP_BLEND_BACKUP"].map((name) => process.env[name]?.trim()).filter(Boolean)].includes(endpoint);
export async function route(pathname, body, primary) {
  const [endpoint, action, encodedId] = pathname.split("/");
  const id = encodedId ? decodeURIComponent(encodedId) : "";
  if (!body && action === "status" && isBackup(id)) return poll(id.slice(PREFIX.length));
  try { return await primary(); }
  catch (e) {
    if ((e?.runpod?.status ?? e?.providerStatus) !== 402 || !enabled() || !body || !["run", "runsync"].includes(action) || !imageEndpoint(endpoint)) throw e;
    return submit(body.input);
  }
}

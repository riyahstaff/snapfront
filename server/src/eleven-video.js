// ElevenLabs is a secondary video provider, only after Runpod explicitly rejects a
// NEW submission for insufficient funds. Never retry an ambiguous submission.
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import ffmpegPath from "ffmpeg-static";
import sharp from "sharp";
import { db } from "./db.js";
import { dirs } from "./config.js";
import { httpError } from "./claude.js";

const API = "https://api.elevenlabs.io/v1";
const key = () => String(process.env.ELEVENLABS_API_KEY || "").trim();
export const enabled = () => process.env.ELEVENLABS_VIDEO_BACKUP === "true" && Boolean(key());
let fetchImpl = (...args) => fetch(...args);
export function setVideoFetch(f) { fetchImpl = f; }
db.exec(`CREATE TABLE IF NOT EXISTS video_backups (
  job_id TEXT PRIMARY KEY, generation_id TEXT, model TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitting', next_poll INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`);
export const backupFor = (id) => db.prepare("SELECT * FROM video_backups WHERE job_id=?").get(id);
const setting = (name, fallback) => {
  const n = Number(process.env[name] ?? fallback);
  return Number.isSafeInteger(n) && n >= 0 ? n : fallback;
};
async function request(route, body) {
  let r;
  try {
    r = await fetchImpl(`${API}${route}`, { method: body ? "POST" : "GET",
      headers: { "xi-api-key": key(), "Content-Type": "application/json" },
      signal: AbortSignal.timeout(60_000), ...(body ? { body: JSON.stringify(body) } : {}) });
  } catch { throw httpError(503, "The backup video studio didn't answer. Please try again later."); }
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    // Never log keys, references, scripts, or raw upstream responses.
    console.warn(`[eleven-video] request ${r.status}`);
    const e = httpError(503, "The backup video studio is unavailable. Please try again later.");
    e.providerStatus = r.status;
    throw e;
  }
  return data;
}

/** Non-billable check; suitable for server startup. Does not create any media. */
export async function check() {
  if (!key()) return { enabled: enabled(), ready: false, reason: "missing_key" };
  try {
    await request("/flows/video?page_size=1");
    const s = await request("/user/subscription");
    return { enabled: enabled(), ready: true, tier: s.tier,
      remainingCredits: Math.max(0, Number(s.character_limit) - Number(s.character_count)) };
  } catch (e) { return { enabled: enabled(), ready: false, status: e.providerStatus || null }; }
}

async function imageReference(file) {
  if (!/^[\w-]+\.(jpg|jpeg|png|webp)$/i.test(file || "")) throw httpError(400, "Choose an avatar or product image first.");
  // Callers already verify ownership. Read locally; never fetch caller-supplied URLs.
  const b = await sharp(path.join(dirs.images, file)).rotate().resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 92 }).toBuffer();
  return { type: "inline_base64", mime_type: "image/jpeg", content_base64: b.toString("base64") };
}
function audioReference(file) {
  if (!/^[\w-]+\.wav$/.test(file || "")) throw httpError(400, "The voice audio is missing.");
  const p = path.join(dirs.media, file);
  if (fs.statSync(p).size > 25 * 1024 * 1024) throw httpError(400, "The voice audio is too long.");
  return { type: "inline_base64", mime_type: "audio/wav", content_base64: fs.readFileSync(p).toString("base64") };
}

/** Retains the caller's single credit/allowance reservation and durable job ID. */
export async function submit(jobId, primary, options) {
  const existing = backupFor(jobId);
  if (existing?.generation_id) return { id: existing.generation_id };
  if (existing) throw httpError(409, "This backup submission cannot be safely retried. Please start a new video.");
  try { return await primary(); }
  catch (e) {
    if (e?.runpod?.status !== 402 || !enabled()) throw e;
    if (options.kind !== "talk" && ![4, 5, 8].includes(options.duration)) {
      throw httpError(503, "Longer motion videos are temporarily unavailable. Choose a 4, 5 or 8 second clip, or try again later.");
    }
  }
  const model = options.kind === "talk" ? "creatify-aurora" : "veo-3.1-fast-generate-001";
  // Reserve a daily slot synchronously before any await. Count uncertain/failed
  // attempts too, so retries cannot bypass the owner's spend guard.
  db.transaction(() => {
    if (backupFor(jobId)) throw httpError(409, "This backup video has already been submitted.");
    const used = db.prepare("SELECT COUNT(*) AS n FROM video_backups WHERE created_at >= date('now')").get().n;
    if (used >= setting("ELEVENLABS_VIDEO_DAILY_LIMIT", 10)) throw httpError(503, "The video studio has reached today's backup limit. Please try again later.");
    db.prepare("INSERT INTO video_backups (job_id,model) VALUES (?,?)").run(jobId, model);
  })();
  try {
    const s = await request("/user/subscription");
    const remaining = Number(s.character_limit) - Number(s.character_count);
    if (!Number.isFinite(remaining) || remaining <= setting("ELEVENLABS_VIDEO_CREDIT_RESERVE", 50_000)) {
      throw httpError(503, "The backup video studio is low on credits. Please try again later.");
    }
    const image = await imageReference(options.imageFile);
    const body = options.kind === "talk"
      ? { model_id: model, image, audio: audioReference(options.audioFile), resolution: "480p" }
      : { model_id: model, prompt: options.prompt, start_frame: image,
          // Veo supports 4/6/8s; 1080p uses 8s. Trim the result to the requested length.
          duration_secs: options.resolution === "1080p" ? 8 : (options.duration === 5 ? 6 : options.duration),
          resolution: options.resolution === "1080p" ? "1080p" : "720p", aspect_ratio: "9:16",
          generate_audio: Boolean(options.sound), enhance_prompt: false };
    const r = await request("/flows/video", body);
    if (typeof r.id !== "string" || !r.id) throw httpError(502, "The backup video studio didn't return a job number.");
    db.prepare("UPDATE video_backups SET generation_id=?,status='running',next_poll=? WHERE job_id=?").run(r.id, Date.now() + 10_000, jobId);
    console.log(`[eleven-video] backup started ${jobId} ${model}`);
    return { id: r.id };
  } catch (e) {
    db.prepare("UPDATE video_backups SET status='failed' WHERE job_id=?").run(jobId);
    throw e;
  }
}

/** Normalize only for the existing collectors; never resubmit while polling. */
export async function poll(jobId) {
  const row = backupFor(jobId);
  if (!row?.generation_id) throw new Error("Backup generation is missing");
  const now = Date.now();
  const claimed = db.prepare("UPDATE video_backups SET next_poll=? WHERE job_id=? AND next_poll<=?").run(now + 15_000, jobId, now);
  if (!claimed.changes) return { status: "IN_PROGRESS" };
  const r = await request(`/flows/video/${encodeURIComponent(row.generation_id)}`);
  if (r.status === "completed") return { status: "COMPLETED", output: { video_url: r.content_url } };
  if (r.status === "failed") {
    db.prepare("UPDATE video_backups SET status='failed' WHERE job_id=?").run(jobId);
    return { status: "FAILED" };
  }
  return { status: "IN_PROGRESS" };
}
export function completed(jobId) { db.prepare("UPDATE video_backups SET status='completed' WHERE job_id=?").run(jobId); }

/** Keep the selected length and audio preference, including after switching models. */
export async function finishMotion(file, duration, sound) {
  if (![4, 5, 8].includes(duration)) throw new Error("Unsupported backup duration");
  const temp = `${file}.trim.mp4`;
  try {
    await new Promise((resolve, reject) => {
      const args = ["-y", "-loglevel", "error", "-i", file, "-t", String(duration), "-map", "0:v:0",
        ...(sound ? ["-map", "0:a?", "-c:a", "aac"] : ["-an"]),
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", "-movflags", "+faststart", temp];
      const p = spawn(ffmpegPath, args, { stdio: "ignore" });
      const timer = setTimeout(() => { p.kill("SIGKILL"); reject(new Error("Backup trim timed out")); }, 180_000);
      p.on("error", (e) => { clearTimeout(timer); reject(e); });
      p.on("close", (code) => { clearTimeout(timer); code === 0 ? resolve() : reject(new Error("Backup trim failed")); });
    });
    fs.renameSync(temp, file);
  } finally { fs.rmSync(temp, { force: true }); }
}

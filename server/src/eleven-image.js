// ElevenLabs Image & Video API image-generation fallback.
// This is used only after Runpod explicitly returns HTTP 402 for an avatar portrait.
// It intentionally does not retry ambiguous submissions and has a daily spend guard.
import { randomUUID } from "node:crypto";
import { db } from "./db.js";
import { httpError } from "./claude.js";

const API = "https://api.elevenlabs.io/v1";
const key = () => String(process.env.ELEVENLABS_API_KEY || "").trim();
export const enabled = () => process.env.ELEVENLABS_IMAGE_BACKUP === "true" && Boolean(key());
let fetchImpl = (...args) => fetch(...args);
export function setImageFetch(f) { fetchImpl = f; }

db.exec(`CREATE TABLE IF NOT EXISTS image_backups (
  job_id TEXT PRIMARY KEY,
  generation_id TEXT,
  status TEXT NOT NULL DEFAULT 'submitting',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`);

const setting = (name, fallback) => {
  const n = Number(process.env[name] ?? fallback);
  return Number.isSafeInteger(n) && n >= 0 ? n : fallback;
};

async function request(route, body) {
  let response;
  try {
    response = await fetchImpl(`${API}${route}`, {
      method: body ? "POST" : "GET",
      headers: { "xi-api-key": key(), "Content-Type": "application/json" },
      signal: AbortSignal.timeout(60_000),
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw httpError(503, "The backup image studio didn't answer. Please try again later.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    // Never log keys, prompts, or raw upstream responses.
    console.warn(`[eleven-image] request ${response.status}`);
    const e = httpError(503, "The backup image studio is unavailable. Check its plan and API permissions.");
    e.providerStatus = response.status;
    throw e;
  }
  return data;
}

/** Submit one image. Once a row exists, an uncertain attempt is never submitted again. */
export async function submit(prompt) {
  if (!enabled()) throw httpError(503, "The backup image studio isn't enabled.");
  const jobId = `avatar:${randomUUID()}`;
  db.transaction(() => {
    const used = db.prepare("SELECT COUNT(*) AS n FROM image_backups WHERE created_at >= date('now')").get().n;
    if (used >= setting("ELEVENLABS_IMAGE_DAILY_LIMIT", 10)) {
      throw httpError(503, "The backup image studio has reached today's limit. Please try again later.");
    }
    db.prepare("INSERT INTO image_backups (job_id,status) VALUES (?,'submitting')").run(jobId);
  })();
  try {
    const result = await request("/flows/image", {
      model_id: String(process.env.ELEVENLABS_IMAGE_MODEL || "gemini-3-pro-image").trim(),
      prompt: String(prompt || "").slice(0, 4000),
      aspect_ratio: "4:5",
      resolution: "2K",
    });
    if (typeof result.id !== "string" || !result.id) throw httpError(502, "The backup image studio didn't return a generation ID.");
    db.prepare("UPDATE image_backups SET generation_id=?,status='running' WHERE job_id=?").run(result.id, jobId);
    return { id: `eleven-image:${result.id}` };
  } catch (e) {
    db.prepare("UPDATE image_backups SET status='failed' WHERE job_id=?").run(jobId);
    throw e;
  }
}

/** Return Runpod-compatible statuses so existing avatar image storage/ownership code is reused. */
export async function poll(generationId) {
  const result = await request(`/flows/image/${encodeURIComponent(generationId)}`);
  if (result.status === "completed" && result.content_url) {
    db.prepare("UPDATE image_backups SET status='completed' WHERE generation_id=?").run(generationId);
    return { status: "COMPLETED", output: { image_url: result.content_url } };
  }
  if (result.status === "failed") {
    db.prepare("UPDATE image_backups SET status='failed' WHERE generation_id=?").run(generationId);
    return { status: "FAILED", error: result.error_message || result.failure_reason || "Image generation failed" };
  }
  if (["pending", "generating"].includes(result.status)) return { status: "IN_PROGRESS" };
  return { status: "IN_PROGRESS" };
}

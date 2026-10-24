// Comfy Router discovery adapter. Read-only, zero generation cost.
// No paid generation is submitted by this module; integrate per-model inputs
// only after selecting a canonical model from the live catalog and its schema.
// Docs: https://docs.comfy.org/development/comfy-router/quickstart
import { httpError } from "./claude.js";
const API = "https://api.comfy.org";
const apiKey = () => String(process.env.COMFY_API_KEY || "").trim();
export const configured = () => Boolean(apiKey());
export const generationEnabled = () => configured() && process.env.COMFY_ROUTER_ENABLED === "true";
let fetchImpl = (...args) => fetch(...args);
export function setComfyFetch(fn) { fetchImpl = fn; }

// API keys never leave the server or appear in error logs.
async function get(path) {
  if (!configured()) throw new Error("COMFY_API_KEY is not configured.");
  const res = await fetchImpl(`${API}${path}`, {
    headers: { "X-API-Key": apiKey() },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    console.warn("[comfy-router] catalog request failed", res.status);
    throw new Error(res.status === 401 || res.status === 403
      ? "Comfy API credentials were rejected."
      : "Comfy model catalog is unavailable.");
  }
  return res.json();
}

/** Zero-generation catalog read, for admin-side comparison of model IDs. */
export async function listModels({ limit = 50, cursor } = {}) {
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 50));
  const query = new URLSearchParams({ limit: String(safeLimit) });
  if (cursor) query.set("cursor", String(cursor));
  return get(`/v2/models?${query}`);
}

/** Read per-model contract before sending any billable image/video request. */
export async function modelSchema(modelId) {
  if (!/^[a-z0-9]+(?:[._-][a-z0-9]+)*\/[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(String(modelId))) {
    throw new Error("A canonical Comfy Router model ID is required.");
  }
  return get(`/v2/models/${modelId}/openapi.json`);
}

// First paid path: a 5s product photo clip using Wan 2.6. Owner-only while piloting.
// Contract: https://docs.comfy.org/development/comfy-router/models/wan/wan2-6-i2v/code
export const VIDEO_MODEL = "wan/wan2.6-i2v";
const VIDEO_ROUTE = "/v2/models/wan/wan2.6-i2v";
const IDENT = /^[a-f0-9-]{36}$/i;
const REQUEST_ID = /^[a-zA-Z0-9_-]{6,150}$/;

export async function submitProductVideo({ image, prompt, idempotencyKey }) {
  if (!generationEnabled()) throw httpError(503, "Comfy video is not enabled.");
  if (!IDENT.test(String(idempotencyKey || ""))) throw httpError(500, "Missing durable submission identity.");
  let u;
  try { u = new URL(image); } catch { throw httpError(400, "Comfy needs a public image URL."); }
  if (u.protocol !== "https:" || !u.hostname || u.username || u.password)
    throw httpError(400, "Comfy needs a public HTTPS image.");
  const cleanPrompt = String(prompt || "").trim().slice(0, 1500);
  if (cleanPrompt.length < 3) throw httpError(400, "A video prompt is required.");
  let res;
  try {
    res = await fetchImpl(`${API}${VIDEO_ROUTE}/requests`, {
      method: "POST",
      headers: { "X-API-Key": apiKey(), "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
      body: JSON.stringify({ input: { prompt: cleanPrompt, img_url: image },
        parameters: { duration: 5, resolution: "720P" } }),
      signal: AbortSignal.timeout(45_000),
    });
  } catch {
    // Unknown submission outcome. Caller must not make a second paid attempt automatically.
    throw httpError(503, "Comfy submission status is uncertain. Do not retry automatically.");
  }
  if (res.status === 402) throw httpError(503, "Comfy has no credits. Add funds in the Comfy Developer Platform.");
  if (res.status === 401 || res.status === 403) throw httpError(503, "Comfy rejected the API key or account access.");
  if (!res.ok) {
    console.warn("[comfy-router] video submit rejected", res.status);
    throw httpError(502, "Comfy could not accept this video request.");
  }
  const data = await res.json().catch(() => ({}));
  if (res.status !== 201 || !REQUEST_ID.test(String(data.request_id || "")))
    throw httpError(502, "Comfy accepted a request but did not return a usable job ID.");
  return { requestId: data.request_id };
}

async function videoRead(path) {
  const response = await fetchImpl(`${API}${VIDEO_ROUTE}/requests/${path}`, {
    headers: { "X-API-Key": apiKey() }, signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok && response.status !== 202) {
    console.warn("[comfy-router] video poll failed", response.status);
    throw httpError(502, "Comfy video status could not be read.");
  }
  return { status: response.status, data: await response.json().catch(() => ({})) };
}

export async function pollProductVideo(requestId) {
  // Already accepted jobs must remain collectible when new paid submissions are switched off.
  if (!configured()) throw httpError(503, "Comfy API key is unavailable for polling.");
  if (!REQUEST_ID.test(String(requestId || ""))) throw httpError(400, "Invalid Comfy request ID.");
  const { data } = await videoRead(`${encodeURIComponent(requestId)}/status`);
  if (data.status === "IN_QUEUE" || data.status === "IN_PROGRESS") return { status: "IN_PROGRESS" };
  if (data.status !== "COMPLETED") throw httpError(502, "Unknown Comfy generation status.");
  if (data.error_type) return { status: "FAILED" };
  const result = await videoRead(encodeURIComponent(requestId));
  if (result.status === 202) return { status: "IN_PROGRESS" };
  // Wan's native response nests its video URL in output.video_url.
  const videoUrl = result.data?.output?.video_url;
  if (typeof videoUrl !== "string" || !videoUrl.startsWith("https://"))
    return { status: "FAILED" };
  return { status: "COMPLETED", output: { video_url: videoUrl } };
}

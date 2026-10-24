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

// Supported product-image-to-video providers. Inputs and outputs are model-specific.
// Only the owner sees these until actual Comfy charges and Snapfront customer pricing
// have been validated. Prices are never inferred from the vendor's model name.
// https://docs.comfy.org/development/comfy-router/models/
export const VIDEO_MODEL = "wan/wan2.6-i2v";
export const VIDEO_MODELS = Object.freeze([
  { id: VIDEO_MODEL, name: "Wan 2.6", note: "Reliable product-image motion" },
  { id: "wan/wan2.7-i2v", name: "Wan 2.7", note: "Updated image-to-video model" },
  { id: "minimax/minimax-h3", name: "MiniMax H3", note: "Video with generated audio" },
  { id: "byteplus/dreamina-seedance-2-5-260628", name: "Seedance 2.5", note: "Product animation" },
  { id: "kling/kling-video-o1", name: "Kling Video O1", note: "Cinematic image-to-video" },
]);
const allowed = new Set(VIDEO_MODELS.map((x) => x.id));
export function assertVideoModel(id) {
  if (typeof id !== "string" || !allowed.has(id)) throw httpError(400, "This video model is not supported.");
  return id;
}
const IDENT = /^[a-f0-9-]{36}$/i;
const REQUEST_ID = /^[a-zA-Z0-9_-]{6,150}$/;
const routeFor = (modelId) => "/v2/models/" + assertVideoModel(modelId);

export function videoBody({ modelId = VIDEO_MODEL, image, prompt }) {
  assertVideoModel(modelId);
  const cleanPrompt = String(prompt || "").trim().slice(0, 1500);
  if (cleanPrompt.length < 3) throw httpError(400, "A video prompt is required.");
  let u;
  try { u = new URL(image); } catch { throw httpError(400, "A public product image is required."); }
  if (u.protocol !== "https:" || !u.hostname || u.username || u.password)
    throw httpError(400, "The product image must have a public HTTPS link.");
  switch (modelId) {
    case "wan/wan2.6-i2v":
      return { input: { prompt: cleanPrompt, img_url: image }, parameters: { duration: 5, resolution: "720P" } };
    case "wan/wan2.7-i2v":
      return { input: { prompt: cleanPrompt, media: [{ type: "first_frame", url: image }] }, parameters: { duration: 5, resolution: "720P" } };
    case "minimax/minimax-h3":
      return { content: [{ type: "text", text: cleanPrompt }, { type: "image_url", role: "first_frame", image_url: { url: image } }],
        duration: 5, resolution: "768P" };
    case "byteplus/dreamina-seedance-2-5-260628":
      return { content: [{ type: "text", text: cleanPrompt }, { type: "image_url", role: "first_frame", image_url: { url: image } }],
        duration: 5, ratio: "adaptive", resolution: "720p", generate_audio: false, output_format: "mp4" };
    case "kling/kling-video-o1":
      return { prompt: cleanPrompt, image_list: [{ type: "first_frame", image_url: image }], duration: "5", mode: "std" };
  }
}
function outputVideoUrl(modelId, result) {
  switch (modelId) {
    case "wan/wan2.6-i2v":
    case "wan/wan2.7-i2v":
      return result?.output?.video_url;
    case "minimax/minimax-h3":
      return result?.task?.content?.url;
    case "byteplus/dreamina-seedance-2-5-260628":
      return result?.content?.video_url;
    case "kling/kling-video-o1":
      return result?.data?.task_result?.videos?.find((x) => x?.url && x?.type !== "image")?.url;
  }
}
function providerFailed(modelId, result) {
  if (modelId === "minimax/minimax-h3") return result?.task?.status === "failed";
  if (modelId === "byteplus/dreamina-seedance-2-5-260628") return ["failed", "expired", "cancelled"].includes(result?.status);
  if (modelId === "kling/kling-video-o1") return result?.data?.task_status === "failed" || (result?.code != null && result.code !== 0);
  return Boolean(result?.error_type);
}
export async function submitProductVideo({ image, prompt, idempotencyKey, modelId = VIDEO_MODEL }) {
  if (!generationEnabled()) throw httpError(503, "Comfy video is not enabled.");
  if (!IDENT.test(String(idempotencyKey || ""))) throw httpError(500, "Missing durable submission identity.");
  const body = videoBody({ modelId, image, prompt });
  let res;
  try {
    res = await fetchImpl(API + routeFor(modelId) + "/requests", {
      method: "POST",
      headers: { "X-API-Key": apiKey(), "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(45_000),
    });
  } catch {
    // A lost response does not mean the provider rejected the job. Never pay twice.
    throw httpError(503, "Comfy submission status is uncertain. Do not retry automatically.");
  }
  if (res.status === 402) throw httpError(503, "Comfy has no credits. Add funds in the Developer Platform.");
  if (res.status === 401 || res.status === 403) throw httpError(503, "Comfy rejected the configured API key.");
  if (!res.ok) {
    console.warn("[comfy-router] video submit rejected", modelId, res.status);
    throw httpError(502, "The video provider did not accept this generation.");
  }
  const data = await res.json().catch(() => ({}));
  if (res.status !== 201 || !REQUEST_ID.test(String(data.request_id || "")))
    throw httpError(502, "Comfy returned no usable job ID. Check provider history before retrying.");
  return { requestId: data.request_id };
}
async function videoRead(modelId, suffix) {
  const res = await fetchImpl(API + routeFor(modelId) + "/requests/" + suffix, {
    headers: { "X-API-Key": apiKey() }, signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok && res.status !== 202) {
    console.warn("[comfy-router] video poll failed", modelId, res.status);
    throw httpError(502, "The video provider's status could not be read.");
  }
  return { status: res.status, data: await res.json().catch(() => ({})) };
}
export async function pollProductVideo(requestId, modelId = VIDEO_MODEL) {
  // Existing accepted jobs remain collectible when new submissions are disabled.
  if (!configured()) throw httpError(503, "Comfy API key is unavailable for polling.");
  assertVideoModel(modelId);
  if (!REQUEST_ID.test(String(requestId || ""))) throw httpError(400, "Invalid Comfy job ID.");
  const suffix = encodeURIComponent(requestId);
  const { data } = await videoRead(modelId, suffix + "/status");
  if (data.status === "IN_QUEUE" || data.status === "IN_PROGRESS") return { status: "IN_PROGRESS" };
  if (data.status !== "COMPLETED") throw httpError(502, "Unknown provider generation status.");
  if (data.error_type) return { status: "FAILED" };
  const result = await videoRead(modelId, suffix);
  if (result.status === 202) return { status: "IN_PROGRESS" };
  if (result.data?.error_type || providerFailed(modelId, result.data)) return { status: "FAILED" };
  const videoUrl = outputVideoUrl(modelId, result.data);
  if (typeof videoUrl !== "string" || !/^https:\/\//.test(videoUrl)) return { status: "FAILED" };
  return { status: "COMPLETED", output: { video_url: videoUrl } };
}

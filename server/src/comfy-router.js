// Comfy Router discovery adapter. Read-only, zero generation cost.
// No paid generation is submitted by this module; integrate per-model inputs
// only after selecting a canonical model from the live catalog and its schema.
// Docs: https://docs.comfy.org/development/comfy-router/quickstart
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

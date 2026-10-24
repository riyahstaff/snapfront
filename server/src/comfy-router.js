// Optional Comfy Router provider for owner-controlled Snapfront product video tests.
// https://docs.comfy.org/development/comfy-router/quickstart
// Never runs unless COMFY_ROUTER_ENABLED=true and a Comfy key exists.
import { httpError } from "./claude.js";

const BASE = "https://api.comfy.org/v2/models";
export const VIDEO_MODEL = "byteplus/dreamina-seedance-2-5-260628";
const key = () => String(process.env.COMFY_API_KEY || "").trim();
export const configured = () => Boolean(key());
export const enabled = () => process.env.COMFY_ROUTER_ENABLED === "true" && configured();
let fetchImpl = (...args) => fetch(...args);
export function setComfyFetch(fn) { fetchImpl = fn; }

function assertEnabled() {
  if (!enabled()) throw httpError(503, "Comfy video is not enabled yet.");
}
async function request(path, { method = "GET", body, idempotencyKey } = {}) {
  assertEnabled();
  let res;
  try {
    res = await fetchImpl(`${BASE}/${path}`, {
      method,
      headers: {
        "X-API-Key": key(),
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(45_000),
    });
  } catch {
    // Do not make another paid submission with a fresh idempotency key after a timeout.
    throw httpError(503, "The Comfy video studio could not be reached. Check the generation status before retrying.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const category = String(res.headers?.get?.("X-Comfy-Error-Type") || "");
    const status = res.status;
    if (status === 402 || category === "insufficient_credits") {
      const e = httpError(503, "Comfy is out of credits. Add funds in the Comfy Developer Platform before making another video.");
      e.comfyStatus = 402;
      throw e;
    }
    if ([401, 403].includes(status)) throw httpError(503, "Comfy rejected the API credentials. Check COMFY_API_KEY on the server.");
    if (status === 429) throw httpError(503, "Comfy is busy. Try again after its concurrency limit resets.");
    // The provider response and submitted prompts may contain sensitive material.
    console.warn("[comfy-router] request unsuccessful", status, category);
    throw httpError(502, "Comfy could not create this video. Try again later.");
  }
  return { data, status: res.status };
}

/** Queued API: returns a durable request ID immediately, never blocks the user's web request. */
export async function submitProductVideo({ image, prompt, idempotencyKey }) {
  if (!/^https:\/\//.test(String(image || ""))) throw httpError(400, "Comfy needs a public HTTPS product image.");
  if (typeof idempotencyKey !== "string" || !/^[a-f0-9-]{36}$/i.test(idempotencyKey)) throw httpError(500, "Comfy request identity is missing.");
  const { data } = await request(`${VIDEO_MODEL}/requests`, {
    method: "POST", idempotencyKey,
    body: {
      content: [
        { type: "text", text: String(prompt || "").slice(0, 2000) },
        { type: "image_url", image_url: { url: image }, role: "first_frame" },
      ],
      duration: 5,
      resolution: "720p",
    },
  });
  if (typeof data.request_id !== "string" || !data.request_id) throw httpError(502, "Comfy did not return a request ID.");
  return { id: data.request_id };
}

/** Poll the accepted request without submitting or charging for a second generation. */
export async function pollProductVideo(requestId) {
  if (typeof requestId !== "string" || !/^[\w-]{6,150}$/.test(requestId)) throw httpError(400, "Invalid Comfy request ID.");
  const route = `${VIDEO_MODEL}/requests/${encodeURIComponent(requestId)}`;
  const { data } = await request(`${route}/status`);
  if (data.status !== "COMPLETED") return { status: "IN_PROGRESS" };
  if (data.error_type) return { status: "FAILED", error: data.error_type };
  const response = await request(route);
  if (response.status === 202) return { status: "IN_PROGRESS" };
  return { status: "COMPLETED", output: response.data };
}

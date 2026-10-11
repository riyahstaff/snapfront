// Photo studio: put a product photo on a new background (a clean colour, or an AI scene like a beach
// or a wood table) with Photoroom. Photoroom cuts the product out and keeps its pixels as they are, so
// the listing still shows the real item; only what's behind it changes. https://docs.photoroom.com
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { config, dirs } from "./config.js";
import { httpError } from "./claude.js";
import { writeFileSafe } from "./artwork.js";

const API = "https://image-api.photoroom.com/v2/edit";
let fetchImpl = (...a) => fetch(...a);
export function setStudioFetch(f) { fetchImpl = f; }   // used by tests

/** Clean studio colours: about $0.02 a photo. */
export const COLORS = [
  { id: "white", name: "White", hex: "FFFFFF" },
  { id: "ivory", name: "Ivory", hex: "F6F1E8" },
  { id: "grey", name: "Soft grey", hex: "E9EAEC" },
  { id: "blush", name: "Blush", hex: "F6DDE0" },
  { id: "sage", name: "Sage", hex: "DDE6D8" },
  { id: "sky", name: "Sky", hex: "DCEAF5" },
  { id: "sand", name: "Sand", hex: "EADBC5" },
  { id: "black", name: "Black", hex: "141414" },
];
/** AI scenes: about $0.10 a photo. Prompts describe only the setting; the product stays the same. */
export const SCENES = [
  { id: "match", name: "Matching colour", prompt: "seamless studio backdrop in a soft color that complements the product, gentle gradient, professional product photography lighting" },
  { id: "beach", name: "Beach", prompt: "on smooth golden beach sand, soft ocean and sky blurred in the background, warm natural sunlight" },
  { id: "wood", name: "Wood table", prompt: "on a warm oak wood table with visible natural wood grain, softly blurred cozy interior behind, natural window light" },
  { id: "granite", name: "Granite counter", prompt: "on a polished speckled granite countertop, softly blurred modern kitchen behind, bright even light" },
  { id: "marble", name: "Marble", prompt: "on a white Carrara marble surface with soft grey veining, minimal bright background, soft daylight" },
  { id: "concrete", name: "Concrete", prompt: "on a smooth raw concrete surface against a light concrete wall, minimal modern, soft directional light" },
  { id: "linen", name: "Linen", prompt: "on a softly creased natural linen cloth, warm neutral tones, gentle morning light" },
  { id: "podium", name: "Studio podium", prompt: "standing on a round pastel pedestal podium in a minimal studio with soft colored backdrop, premium product photography" },
  { id: "nature", name: "Moss and stone", prompt: "on a mossy stone in a lush green forest, soft dappled sunlight, shallow depth of field" },
  { id: "bathroom", name: "Bathroom shelf", prompt: "on a clean white bathroom shelf with eucalyptus leaves and a folded towel, bright spa-like light" },
  { id: "street", name: "City street", prompt: "on a city sidewalk at golden hour, blurred urban street and buildings behind, cinematic light" },
];

export const enabled = () => Boolean(config.photoroomKey);
export const presets = () => ({ enabled: enabled(), colors: COLORS, scenes: SCENES.map(({ id, name }) => ({ id, name })) });

const HEX = /^[0-9A-Fa-f]{6}$/;
/** The Photoroom fields for a style: { color: "white" | "#AABBCC" } or { scene: "beach" } or { prompt: "on a ..." }. */
export function fieldsFor(style = {}) {
  if (style.color) {
    const preset = COLORS.find((c) => c.id === style.color);
    const hex = preset ? preset.hex : String(style.color).replace(/^#/, "");
    if (!HEX.test(hex)) throw httpError(400, "Pick one of the colours, or a colour like #F2E8DC.");
    return { kind: "color", label: preset?.name || `#${hex.toUpperCase()}`, fields: { "background.color": hex.toUpperCase(), "shadow.mode": "ai.auto-with-overrides" } };
  }
  const scene = style.scene && SCENES.find((s) => s.id === style.scene);
  if (style.scene && !scene) throw httpError(400, "That background isn't available.");
  const prompt = scene ? scene.prompt : String(style.prompt || "").replace(/\s+/g, " ").trim().slice(0, 300);
  if (!prompt || prompt.length < 3) throw httpError(400, "Describe the background you want, like “on a marble counter”.");
  return { kind: "scene", label: scene?.name || prompt, fields: { "background.prompt": scene ? prompt : `${prompt}, professional product photography` } };
}

/** Path of a photo in the images folder, or a friendly error. */
export function sourcePath(imageFile) {
  if (!/^[\w-]+\.(jpg|jpeg|png|webp|gif)$/.test(String(imageFile || ""))) throw httpError(400, "Choose a product photo first.");
  const src = path.join(dirs.images, imageFile);
  if (!fs.existsSync(src)) throw httpError(404, "That photo is no longer available. Add it again.");
  return src;
}

/** Make a new photo from an image in the images folder; returns the new file's name. The original is kept. */
export async function restyle(imageFile, style) {
  if (!enabled()) throw httpError(503, "The photo studio isn't switched on yet.");
  const src = sourcePath(imageFile);
  const { fields, kind } = fieldsFor(style);

  const form = new FormData();
  const ext = path.extname(imageFile).slice(1).replace("jpg", "jpeg");
  form.append("imageFile", new Blob([fs.readFileSync(src)], { type: `image/${ext}` }), imageFile);
  for (const [k, v] of Object.entries({ ...fields, padding: kind === "color" ? "0.12" : "0.1", outputSize: "1600x1600", "export.format": "jpeg" })) form.append(k, v);
  const headers = { "x-api-key": config.photoroomKey, "pr-ai-shadows-model-version": "2026-04-15" };
  if (kind === "scene") headers["pr-ai-background-model-version"] = "background-studio-beta-2025-03-17";

  let res;
  try { res = await fetchImpl(API, { method: "POST", headers, body: form, signal: AbortSignal.timeout(90_000) }); }
  catch { throw httpError(502, "The photo studio didn't answer. Try again in a moment."); }
  if (!res.ok) {
    let detail = "";
    try { detail = (await res.json())?.error?.message || ""; } catch { /* not JSON */ }
    console.warn("[studio] photoroom", res.status, detail);
    if (res.status === 402 || res.status === 403) throw httpError(503, "The photo studio is out of credit. Try again later.");
    if (res.status === 400) throw httpError(400, "Couldn't find a product in that photo. Try a clearer shot of the item on its own.");
    throw httpError(502, "The photo studio had a problem. Try again.");
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 500) throw httpError(502, "The photo studio sent back an empty picture. Try again.");
  return writeFileSafe(dirs.images, `${crypto.randomUUID()}.jpg`, buf);
}

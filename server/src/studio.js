// Photo studio: put a product photo on a new background. Runs on our own server for free:
// the open-source cut-out model (cutout.js) lifts the product off its old background, then we place
// it on a clean colour or a real photo scene with a soft shadow. The product's pixels are kept as they
// are, so listings still show the real item. If PHOTOROOM_API_KEY is set, sellers can also describe a
// background in words ("on a brick wall") and Photoroom's AI paints it.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { config, dirs } from "./config.js";
import { askJson, httpError } from "./claude.js";
import { db } from "./db.js";
import { writeFileSafe } from "./artwork.js";
import { cutout as realCutout } from "./cutout.js";
import { editNow, markAi } from "./aimedia.js";

let cutout = realCutout;
export function setCutout(f) { cutout = f; }   // used by tests

const OUT = 1600;
const ASSETS = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "assets", "studio");

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
/**
 * Scenes are real photos (assets/studio, see CREDITS.md). `at` is where the product's base sits and
 * the box it fits in, as fractions of the 1600px square; `shadow` is how dark its shadow is.
 * `flat` is the same surface seen from straight above, for photos taken looking down on the product
 * (a flat lay): a texture file, or a plain colour where the scene is a pedestal.
 */
const TABLE = { cx: 0.5, base: 0.86, w: 0.62, h: 0.6, shadow: 0.34 };
export const SCENES = [
  { id: "match", name: "Matching colour" },
  { id: "beach", name: "Beach", at: { cx: 0.5, base: 0.84, w: 0.62, h: 0.58, shadow: 0.36 }, flat: { tex: "beach-top", surface: "the sand", shadow: 0.42 } },
  { id: "wood", name: "Wood table", at: { cx: 0.5, base: 0.89, w: 0.66, h: 0.6, shadow: 0.42 }, flat: { tex: "wood-top", surface: "the wood", shadow: 0.42 } },
  { id: "granite", name: "Granite counter", at: TABLE, flat: { tex: "granite-top", surface: "the granite", shadow: 0.45 } },
  { id: "marble", name: "Marble", at: TABLE, flat: { tex: "marble-top", surface: "the marble", shadow: 0.34 } },
  { id: "concrete", name: "Concrete", at: TABLE, flat: { tex: "concrete-top", surface: "the concrete", shadow: 0.42 } },
  { id: "linen", name: "Linen", at: { ...TABLE, shadow: 0.3 }, flat: { tex: "linen-top", surface: "the linen", shadow: 0.36 } },
  { id: "studio", name: "White studio", at: { cx: 0.5, base: 0.8, w: 0.66, h: 0.62, shadow: 0.24 }, flat: { hex: "F4F3F1", surface: "a white backdrop", shadow: 0.26 } },
  { id: "arch", name: "Arch pedestal", at: { cx: 0.5, base: 0.775, w: 0.36, h: 0.5, shadow: 0.3 }, flat: { hex: "EADFD2", surface: "a warm beige backdrop", shadow: 0.3 } },
  { id: "pink", name: "Pink pedestal", at: { cx: 0.52, base: 0.815, w: 0.4, h: 0.55, shadow: 0.36 }, flat: { hex: "F2CFD4", surface: "a pink backdrop", shadow: 0.32 } },
  { id: "stone", name: "Stone pedestal", at: { cx: 0.5, base: 0.59, w: 0.27, h: 0.38, shadow: 0.45 }, flat: { tex: "concrete-top", surface: "stone", shadow: 0.42 } },
];

const customEnabled = () => Boolean(config.runpodKey || config.photoroomKey);
export const enabled = () => true;
export const presets = () => ({ enabled: true, custom: customEnabled(), colors: COLORS, scenes: SCENES.map(({ id, name }) => ({ id, name })) });

const HEX = /^[0-9A-Fa-f]{6}$/;
/** Check a style before spending anything: { color: "white" | "#AABBCC" } | { scene: "beach" } | { prompt: "on a ..." }. */
export function fieldsFor(style = {}) {
  if (style.color) {
    const preset = COLORS.find((c) => c.id === style.color);
    const hex = preset ? preset.hex : String(style.color).replace(/^#/, "");
    if (!HEX.test(hex)) throw httpError(400, "Pick one of the colours, or a colour like #F2E8DC.");
    return { kind: "color", hex: hex.toUpperCase() };
  }
  if (style.scene) {
    const scene = SCENES.find((s) => s.id === style.scene);
    if (!scene) throw httpError(400, "That background isn't available.");
    return { kind: scene.id === "match" ? "match" : "scene", scene };
  }
  const prompt = String(style.prompt || "").replace(/\s+/g, " ").trim().slice(0, 300);
  if (!prompt || prompt.length < 3) throw httpError(400, "Describe the background you want, like “on a marble counter”.");
  if (!customEnabled()) throw httpError(400, "Describing your own background isn't available yet. Pick a colour or a scene.");
  return { kind: "prompt", prompt };
}

/** Path of a photo in the images folder, or a friendly error. */
export function sourcePath(imageFile) {
  if (!/^[\w-]+\.(jpg|jpeg|png|webp|gif)$/.test(String(imageFile || ""))) throw httpError(400, "Choose a product photo first.");
  const src = path.join(dirs.images, imageFile);
  if (!fs.existsSync(src)) throw httpError(404, "That photo is no longer available. Add it again.");
  return src;
}

/**
 * Make a new photo from one in the images folder. The original is kept.
 * Returns { file, notice }: notice tells the seller about anything we adjusted for (or null).
 */
export async function restyle(imageFile, style) {
  const src = sourcePath(imageFile);
  const f = fieldsFor(style);
  let jpeg, notice = null;
  if (f.kind !== "prompt") {
    const [prod, seen] = await Promise.all([cutout(src), look(src)]);
    const out = await compose(prod, f, seen);
    jpeg = out.jpeg; notice = out.notice;
  } else if (config.runpodKey) jpeg = await sharp(await editNow(path.basename(src), f.prompt)).jpeg({ quality: 88 }).toBuffer();
  else jpeg = await photoroom(src, f.prompt);
  const file = writeFileSafe(dirs.images, `${crypto.randomUUID()}.jpg`, jpeg);
  if (f.kind === "prompt") markAi(file);
  return { file, notice };
}

/* ---------- how the photo was taken ---------- */
db.exec(`CREATE TABLE IF NOT EXISTS photo_looks (
  image_file TEXT PRIMARY KEY,
  view TEXT NOT NULL,     -- top (looking down on it) | side
  cut TEXT NOT NULL,      -- JSON list of photo edges the product runs off
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`);
const SIDES = ["top", "bottom", "left", "right"];
let lookImpl = askLook;
export function setLook(f) { lookImpl = f; }   // tests

/**
 * Was the photo taken looking down on the product, and does the product run off any edge of it?
 * A product shot from above has to lie flat on the new surface; standing it up looks pasted on.
 * One small, cheap AI look per photo, remembered. If it can't answer we assume a normal side view.
 */
export async function look(src) {
  const key = path.basename(src);
  const row = db.prepare("SELECT view, cut FROM photo_looks WHERE image_file = ?").get(key);
  if (row) return { view: row.view, cut: JSON.parse(row.cut) };
  let seen = { view: "side", cut: [] };
  try {
    const out = await Promise.race([lookImpl(src), new Promise((_, no) => setTimeout(() => no(new Error("look timed out")), 20_000).unref?.())]);
    seen = { view: out?.view === "top" ? "top" : "side", cut: [...new Set((Array.isArray(out?.cut) ? out.cut : []).filter((c) => SIDES.includes(c)))] };
    console.log("[studio] look", key, seen.view, seen.cut.join(",") || "-");
    db.prepare("INSERT OR REPLACE INTO photo_looks (image_file, view, cut) VALUES (?, ?, ?)").run(key, seen.view, JSON.stringify(seen.cut));
  } catch (e) { console.warn("[studio] look", e.message); }
  return seen;
}

async function askLook(src) {
  if (!config.anthropicKey && !process.env.SNAPFRONT_FAKE_AI) return null;
  const small = await sharp(src).rotate().resize(640, 640, { fit: "inside" }).jpeg({ quality: 80 }).toBuffer();
  return askJson([
    { type: "image", source: { type: "base64", media_type: "image/jpeg", data: small.toString("base64") } },
    { type: "text", text: `This is a seller's photo of a product. We will cut the product out and put it on a new background, so we need to know how the photo was taken.
1. view: Is the product lying on a surface (floor, table, bed, carpet) with the camera above it looking down, so we see its top and the surface fills the background? Then "top". This includes overhead shots that are a little tilted. If instead the camera is roughly at the product's height and we see it standing or sitting with a wall, sky or backdrop behind it, answer "side".
2. cut: Which edges of the photo cut through the main product, so part of it is missing from the picture? Any of "top", "bottom", "left", "right". Use [] if the whole product is inside the photo.
Call submit with {"view": "top" or "side", "cut": [ ... ]}.` },
  ], 800);
}

/* ---------- composing ---------- */
const svg = (s) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${OUT}" height="${OUT}">${s}</svg>`);
function backdrop(hex) {
  const dark = parseInt(hex.slice(0, 2), 16) + parseInt(hex.slice(2, 4), 16) + parseInt(hex.slice(4, 6), 16) < 200;
  return svg(`<defs><radialGradient id="g" cx="50%" cy="40%" r="78%"><stop offset="0" stop-color="#fff" stop-opacity="${dark ? 0.08 : 0.4}"/><stop offset="1" stop-color="#000" stop-opacity="${dark ? 0.25 : 0.07}"/></radialGradient></defs>
<rect width="100%" height="100%" fill="#${hex}"/><rect width="100%" height="100%" fill="url(#g)"/>`);
}

/** A soft colour from the product itself: same hue, much lighter and calmer. */
async function matchingHex(prod) {
  const { data } = await sharp(prod.png).resize(64, 64, { fit: "inside" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < data.length; i += 4) if (data[i + 3] > 200) { r += data[i]; g += data[i + 1]; b += data[i + 2]; n++; }
  if (!n) return "EDEBE8";
  [r, g, b] = [r / n / 255, g / n / 255, b / n / 255];
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  let h = 0;
  if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
  const S2 = Math.min(0.42, s * 0.55), L2 = 0.87;
  const C = (1 - Math.abs(2 * L2 - 1)) * S2, X = C * (1 - Math.abs((h % 2) - 1)), m = L2 - C / 2;
  const [R, G, B] = h < 1 ? [C, X, 0] : h < 2 ? [X, C, 0] : h < 3 ? [0, C, X] : h < 4 ? [0, X, C] : h < 5 ? [X, 0, C] : [C, 0, X];
  return [R, G, B].map((v) => Math.round((v + m) * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
}

/**
 * Put the cut-out product on the background. `seen` says how the photo was taken (see look()):
 * - side view: the product stands on the surface, with a cast shadow and a contact shadow;
 * - top view: the surface is seen from above too, and the product lies on it with a soft drop shadow;
 * - cut off: the sides the photo cut through stay at the picture's edge, so it reads as a close-up
 *   instead of a product that ends in mid-air (or looks stuck in the sand).
 * Returns { jpeg, notice }.
 */
export async function compose(prod, f, seen = { view: "side", cut: [] }) {
  const cut = new Set([...(prod.cut || []), ...(seen.cut || [])]);
  const flat = seen.view === "top" || cut.size > 0;
  let bg, at, surface = null;
  if (f.kind === "scene" && flat) {
    const fl = f.scene.flat;
    bg = fl.tex ? await sharp(path.join(ASSETS, `${fl.tex}.jpg`)).resize(OUT, OUT).toBuffer() : await sharp(backdrop(fl.hex)).png().toBuffer();
    at = { shadow: fl.shadow };
    surface = fl.surface;
  } else if (f.kind === "scene") {
    bg = await sharp(path.join(ASSETS, `${f.scene.id}.jpg`)).resize(OUT, OUT).toBuffer();
    at = f.scene.at;
  } else {
    const hex = f.kind === "match" ? await matchingHex(prod) : f.hex;
    bg = await sharp(backdrop(hex)).png().toBuffer();
    at = { cx: 0.5, base: null, w: 0.72, h: 0.66, shadow: hex === "141414" ? 0.5 : 0.22 };
  }
  const layers = flat ? await lieFlat(prod, at, cut) : await standUp(prod, at);
  const jpeg = await sharp(bg).composite(layers).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
  let notice = null;
  if (cut.size) notice = "Part of your product runs off the edge of your photo, so we kept that side at the edge of the new one. For the best result, use a photo with the whole product in it and a little space around it.";
  else if (seen.view === "top" && f.kind === "scene") notice = `Your photo looks down on the product, so we laid it flat on ${surface} to match.`;
  return { jpeg, notice };
}

const blank = () => sharp({ create: { width: OUT, height: OUT, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } });
/** The product's outline as a black shape, `opacity` dark. */
async function silhouette(product, w, h, opacity) {
  const { data: a } = await sharp(product).extractChannel(3).raw().toBuffer({ resolveWithObject: true });
  const sil = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) sil[i * 4 + 3] = Math.round(a[i] * opacity);
  return sil;
}

/** Side view: standing on the surface. */
async function standUp(prod, at) {
  const scale = Math.min((at.w * OUT) / prod.width, (at.h * OUT) / prod.height);
  const w = Math.max(1, Math.round(prod.width * scale)), h = Math.max(1, Math.round(prod.height * scale));
  const cx = at.cx * OUT, baseY = at.base != null ? at.base * OUT : Math.round((OUT + h) / 2 + OUT * 0.02);
  const left = Math.round(cx - w / 2), top = Math.round(baseY - h);
  const product = await sharp(prod.png).resize(w, h).png().toBuffer();
  // Cast shadow: the product's outline squashed flat onto the surface and blurred.
  const sil = await silhouette(product, w, h, at.shadow);
  const sh = Math.max(4, Math.round(h * 0.14));
  const squashed = await sharp(sil, { raw: { width: w, height: h, channels: 4 } }).resize(w, sh, { fit: "fill" }).png().toBuffer();
  const castTop = Math.max(0, Math.min(OUT - sh, Math.round(baseY - sh * 0.55)));
  const cast = await blank().composite([{ input: squashed, left: Math.max(0, Math.min(OUT - w, left)), top: castTop }]).png().toBuffer()
    .then((b) => sharp(b).blur(Math.max(6, w * 0.035)).png().toBuffer());
  // Contact shadow: a tight dark line where it touches the surface.
  const rx = w * 0.4, ry = Math.max(5, w * 0.022);
  const contact = svg(`<defs><filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${Math.max(3, ry * 0.7).toFixed(1)}"/></filter></defs>
<ellipse cx="${cx}" cy="${baseY - 2}" rx="${rx}" ry="${ry}" fill="#000" fill-opacity="${Math.min(0.6, at.shadow + 0.1)}" filter="url(#b)"/>`);
  return [{ input: cast }, { input: contact }, { input: product, left, top }];
}

/** Top view (or a cut-off product): lying on the surface, seen from above, light from the top left. */
async function lieFlat(prod, at, cut) {
  // Room to fill: a bit more when the product carries on past the edge (it reads as a close-up).
  const box = cut.size ? 0.8 : 0.7;
  let scale = Math.min((box * OUT) / prod.width, (box * OUT) / prod.height);
  if (cut.has("top") && cut.has("bottom")) scale = OUT / prod.height;
  if (cut.has("left") && cut.has("right")) scale = Math.max(scale, OUT / prod.width);
  scale = Math.min(scale, (1.6 * OUT) / Math.max(prod.width, prod.height));
  const w = Math.max(1, Math.round(prod.width * scale)), h = Math.max(1, Math.round(prod.height * scale));
  let left = Math.round((OUT - w) / 2), top = Math.round((OUT - h) / 2);
  if (cut.has("left")) left = 0; else if (cut.has("right")) left = OUT - w;
  if (cut.has("top")) top = 0; else if (cut.has("bottom")) top = OUT - h;
  const product = await sharp(prod.png).resize(w, h).png().toBuffer();
  const sil = await silhouette(product, w, h, 1);
  // Shadows are drawn on a bigger canvas so they can fall past the picture's edge without wrapping.
  const pad = Math.round(OUT * 0.1), big = OUT + 2 * pad;
  const shadow = async (dx, dy, blur, opacity) => {
    const shape = await sharp(sil, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
    const x = left + pad + dx, y = top + pad + dy;
    const ox = Math.max(0, -x), oy = Math.max(0, -y);
    const cw = Math.min(w - ox, big - Math.max(0, x)), ch = Math.min(h - oy, big - Math.max(0, y));
    if (cw <= 0 || ch <= 0) return null;
    const piece = await sharp(shape).extract({ left: ox, top: oy, width: cw, height: ch }).png().toBuffer();
    const layer = await sharp({ create: { width: big, height: big, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: piece, left: Math.max(0, x), top: Math.max(0, y) }]).png().toBuffer();
    const { data } = await sharp(layer).blur(blur).extract({ left: pad, top: pad, width: OUT, height: OUT }).raw().toBuffer({ resolveWithObject: true });
    for (let i = 3; i < data.length; i += 4) data[i] = Math.round(data[i] * opacity);
    return { input: await sharp(data, { raw: { width: OUT, height: OUT, channels: 4 } }).png().toBuffer() };
  };
  const size = Math.max(w, h);
  const soft = await shadow(Math.round(size * 0.025), Math.round(size * 0.04), Math.max(8, size * 0.03), at.shadow);
  const tight = await shadow(Math.round(size * 0.006), Math.round(size * 0.01), Math.max(2, size * 0.006), Math.min(0.55, at.shadow + 0.12));
  return [soft, tight, { input: product, left, top }].filter(Boolean);
}

/* ---------- optional: a background described in words, painted by Photoroom ---------- */
const API = "https://image-api.photoroom.com/v2/edit";
let fetchImpl = (...a) => fetch(...a);
export function setStudioFetch(f) { fetchImpl = f; }   // used by tests

async function photoroom(src, prompt) {
  const form = new FormData();
  const ext = path.extname(src).slice(1).replace("jpg", "jpeg");
  form.append("imageFile", new Blob([fs.readFileSync(src)], { type: `image/${ext}` }), path.basename(src));
  for (const [k, v] of Object.entries({ "background.prompt": `${prompt}, professional product photography`, padding: "0.1", outputSize: "1600x1600", "export.format": "jpeg" })) form.append(k, v);
  const headers = { "x-api-key": config.photoroomKey, "pr-ai-background-model-version": "background-studio-beta-2025-03-17" };
  let res;
  try { res = await fetchImpl(API, { method: "POST", headers, body: form, signal: AbortSignal.timeout(90_000) }); }
  catch { throw httpError(502, "The photo studio didn't answer. Try again in a moment."); }
  if (!res.ok) {
    let detail = "";
    try { detail = (await res.json())?.error?.message || ""; } catch { /* not JSON */ }
    console.warn("[studio] photoroom", res.status, detail);
    if (res.status === 402 || res.status === 403) throw httpError(503, "Describing your own background is paused right now. Pick a colour or a scene.");
    if (res.status === 400) throw httpError(400, "Couldn't find a product in that photo. Try a clearer shot of the item on its own.");
    throw httpError(502, "The photo studio had a problem. Try again.");
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 500) throw httpError(502, "The photo studio sent back an empty picture. Try again.");
  return buf;
}

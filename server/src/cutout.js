// Cut the product out of a photo, on our own server, with the open-source ISNet model
// (DIS, Apache-2.0; the ONNX export published by rembg, MIT). No per-photo fees.
// The model (~180 MB) is downloaded once to the data volume and loaded on first use.
import fs from "node:fs";
import path from "node:path";
import ort from "onnxruntime-node";
import sharp from "sharp";
import { config } from "./config.js";
import { httpError } from "./claude.js";

const MODEL_URL = process.env.CUTOUT_MODEL_URL || "https://github.com/danielgatis/rembg/releases/download/v0.0.0/isnet-general-use.onnx";
const MODEL_BYTES = 178_648_008;
const S = 1024;                       // the model's input size
const IDLE_MS = 15 * 60_000;          // free the model's memory after 15 quiet minutes

const modelPath = () => path.join(config.dataDir, "models", "isnet-general-use.onnx");
let downloading = null, session = null, loading = null, idleTimer = null, queue = Promise.resolve();

/** Download the model once (in the background at startup, or on first use). */
export function ensureModel() {
  const file = modelPath();
  if (fs.existsSync(file) && fs.statSync(file).size === MODEL_BYTES) return Promise.resolve(file);
  downloading ||= (async () => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const res = await fetch(MODEL_URL, { redirect: "follow", signal: AbortSignal.timeout(10 * 60_000) });
    if (!res.ok) throw new Error(`model download failed: ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length !== MODEL_BYTES) throw new Error(`model download incomplete: ${buf.length} bytes`);
    fs.writeFileSync(`${file}.part`, buf);
    fs.renameSync(`${file}.part`, file);
    console.log("[cutout] model ready");
    return file;
  })().finally(() => { downloading = null; });
  return downloading;
}

async function getSession() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => { session?.release?.(); session = null; }, IDLE_MS);
  idleTimer.unref?.();
  if (session) return session;
  loading ||= (async () => {
    const file = await ensureModel().catch((e) => { console.warn("[cutout]", e.message); throw httpError(503, "The photo studio is warming up. Try again in a minute."); });
    session = await ort.InferenceSession.create(file, { graphOptimizationLevel: "all" });
    return session;
  })().finally(() => { loading = null; });
  return loading;
}

/** One photo at a time keeps memory steady. */
const serial = (fn) => { const run = queue.then(fn, fn); queue = run.catch(() => {}); return run; };

/** The product on a transparent background, trimmed to its edges: { png, width, height, coverage }. */
export function cutout(input) {
  return serial(async () => {
    const s = await getSession();
    const base = sharp(input).rotate().removeAlpha();
    const { data: rgb, info } = await base.clone().raw().toBuffer({ resolveWithObject: true });
    const { data: small } = await base.clone().resize(S, S, { fit: "fill" }).raw().toBuffer({ resolveWithObject: true });
    const x = new Float32Array(3 * S * S);
    for (let i = 0; i < S * S; i++) for (let c = 0; c < 3; c++) x[c * S * S + i] = small[i * 3 + c] / 255 - 0.5;
    const out = await s.run({ [s.inputNames[0]]: new ort.Tensor("float32", x, [1, 3, S, S]) });
    const p = out[s.outputNames[0]].data;
    let mi = Infinity, ma = -Infinity;
    for (let i = 0; i < S * S; i++) { if (p[i] < mi) mi = p[i]; if (p[i] > ma) ma = p[i]; }
    // Normalise, then firm up the edge so none of the old background bleeds through.
    const m = Buffer.alloc(S * S);
    for (let i = 0; i < S * S; i++) { const v = (p[i] - mi) / (ma - mi || 1); m[i] = Math.max(0, Math.min(255, Math.round(((v - 0.1) / 0.8) * 255))); }
    const { data: alpha } = await sharp(m, { raw: { width: S, height: S, channels: 1 } })
      .resize(info.width, info.height, { fit: "fill" }).extractChannel(0).raw().toBuffer({ resolveWithObject: true });
    const W = info.width, H = info.height, n = W * H;
    // Pull the edge in by a pixel or two so a rim of the old background doesn't show.
    const r = Math.max(1, Math.round(Math.min(W, H) / 700));
    const a = erode(alpha, W, H, r);
    // The old background's colour, to take back out of half-transparent edge pixels.
    let br = 0, bg = 0, bb = 0, bn = 0;
    for (let i = 0; i < n; i += 7) if (alpha[i] < 8) { br += rgb[i * 3]; bg += rgb[i * 3 + 1]; bb += rgb[i * 3 + 2]; bn++; }
    if (bn) { br /= bn; bg /= bn; bb /= bn; }
    const rgba = Buffer.alloc(n * 4);
    let covered = 0;
    for (let i = 0; i < n; i++) {
      const al = a[i], k = al / 255;
      let R = rgb[i * 3], G = rgb[i * 3 + 1], B = rgb[i * 3 + 2];
      if (bn && al > 20 && al < 245) {            // colour = (seen - (1 - alpha) * background) / alpha
        R = clamp((R - (1 - k) * br) / k); G = clamp((G - (1 - k) * bg) / k); B = clamp((B - (1 - k) * bb) / k);
      }
      rgba[i * 4] = R; rgba[i * 4 + 1] = G; rgba[i * 4 + 2] = B; rgba[i * 4 + 3] = al;
      if (al > 128) covered++;
    }
    const coverage = covered / n;
    if (coverage < 0.004) throw httpError(400, "Couldn't find a product in that photo. Try a clearer shot of the item on its own.");
    const trimmed = await sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
      .trim({ threshold: 8 }).png().toBuffer({ resolveWithObject: true });
    return { png: trimmed.data, width: trimmed.info.width, height: trimmed.info.height, coverage };
  });
}

const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : Math.round(v));
/** Minimum filter over a (2r+1) square, done as two 1-D passes. */
function erode(src, W, H, r) {
  const tmp = Buffer.alloc(W * H), out = Buffer.alloc(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let m = 255; for (let d = -r; d <= r; d++) { const xx = x + d; if (xx >= 0 && xx < W) { const v = src[y * W + xx]; if (v < m) m = v; } }
    tmp[y * W + x] = m;
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let m = 255; for (let d = -r; d <= r; d++) { const yy = y + d; if (yy >= 0 && yy < H) { const v = tmp[yy * W + x]; if (v < m) m = v; } }
    out[y * W + x] = m;
  }
  return out;
}

// Separate storefront/digital image assistant. Jobs are durable, owner-bound, and never apply
// an output to a listing: the client must explicitly choose a completed result.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import { config, dirs } from "./config.js";
import { db, newId } from "./db.js";
import { httpError } from "./claude.js";
import { ownsSellerImage } from "./media-ownership.js";
import * as plans from "./plans.js";

const API = "https://api.runpod.ai/v2";
const ENDPOINT = { edit: "qwen-image-edit-2511", art: "qwen-image-t2i" };
const IMAGE_FILE = /^[\w-]+\.(?:jpg|jpeg|png|webp|gif)$/;
const OPS = new Set(["storefront-edit", "storefront-art", "digital-art", "digital-edit", "digital-mockup"]);
const ASPECTS = new Map([["wide", "1536*1080"], ["portrait", "1280*1536"], ["square", "1280*1280"]]);
const MOCKUPS = [
  { id: "chrome", name: "Chrome reader" },
  { id: "editorial", name: "Editorial print" },
  { id: "midnight", name: "Midnight tablet" },
];
const MAX_DOWNLOAD = 20 * 1024 * 1024;
const MAX_PIXELS = 30_000_000;
const LEASE_MS = 90_000;
const TIMEOUT_MS = 20 * 60_000;
let fetchImpl = (...args) => fetch(...args);
let timer = null;
let workerScan = null;

// Keep request inputs rather than a lossy derived prompt so an idempotency key cannot be re-used
// to point a finished result at a different slot, product, source, or operation.
db.exec(`CREATE TABLE IF NOT EXISTS image_assistant_jobs (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  context TEXT NOT NULL CHECK (context IN ('storefront','digital')),
  operation TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','done','failed')),
  prompt TEXT NOT NULL,
  aspect TEXT NOT NULL,
  slot INTEGER,
  product_id TEXT,
  source_file TEXT,
  preset TEXT,
  input_json TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  provider_job_id TEXT,
  result_file TEXT,
  error TEXT,
  usage_kind TEXT NOT NULL,
  usage_period TEXT NOT NULL,
  usage_recorded INTEGER NOT NULL DEFAULT 0,
  refunded INTEGER NOT NULL DEFAULT 0,
  lease_owner TEXT,
  lease_until INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (seller_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS image_assistant_jobs_owner ON image_assistant_jobs (seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS image_assistant_jobs_due ON image_assistant_jobs (status, lease_until, created_at);`);
// A call can reach Runpod just before a process dies. Persist this fence before the external call
// so a later worker reports the ambiguous request honestly instead of submitting it a second time.
if (!db.prepare("PRAGMA table_info(image_assistant_jobs)").all().some((column) => column.name === "submission_started")) {
  db.exec("ALTER TABLE image_assistant_jobs ADD COLUMN submission_started INTEGER NOT NULL DEFAULT 0");
}
// A failed or rejected image is resubmitted automatically a couple of times before the seller sees an error.
if (!db.prepare("PRAGMA table_info(image_assistant_jobs)").all().some((column) => column.name === "retries")) {
  db.exec("ALTER TABLE image_assistant_jobs ADD COLUMN retries INTEGER NOT NULL DEFAULT 0");
}
let MAX_RETRIES = 2;
/** Test-only: how many automatic resubmits a failed image gets. */
export function setImageRetries(n) { MAX_RETRIES = Number.isInteger(n) && n >= 0 ? n : 2; }
// aimedia owns this historical marker too. IF NOT EXISTS means either module may boot first.
db.exec("CREATE TABLE IF NOT EXISTS ai_images (file TEXT PRIMARY KEY, created_at TEXT NOT NULL DEFAULT (datetime('now')))");

export function setImageAssistantFetch(fn) { fetchImpl = fn || ((...args) => fetch(...args)); }
// Kept alongside aimedia's test hook so isolated server tests never need a live AI request.
export const setRunpodFetch = setImageAssistantFetch;
export const providerEnabled = () => Boolean(config.runpodKey && String(config.runpodKey).trim());

const clean = (v, max = 500) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
function cleanPrompt(value) {
  const prompt = String(value ?? "").replace(/\s+/g, " ").trim();
  // The client accepts up to 1,200 characters. Never silently make an idempotent request mean
  // something different from what the seller reviewed.
  if (prompt.length > 1200) throw httpError(400, "Keep the image description to 1,200 characters or fewer.");
  return prompt;
}
const currentPeriod = (account) => plans.effectivePlan(account) === "free" ? "trial" : new Date().toISOString().slice(0, 7);
const createdMs = (value) => Date.parse(`${String(value).replace(/Z$/, "")}Z`);
const imageUrl = (file) => `${config.publicUrl}/img/${file}`;
const safeError = (message = "The image studio couldn't complete this image. Try again.") => clean(message, 240) || "The image studio couldn't complete this image. Try again.";

function quota(account, kind) {
  const planId = plans.effectivePlan(account);
  const limit = Number(plans.PLANS[planId]?.[kind] || 0);
  const period = currentPeriod(account);
  const used = db.prepare("SELECT count FROM usage WHERE account_id=? AND period=? AND kind=?").get(account.id, period, kind)?.count || 0;
  return { remaining: Math.max(0, limit - used), limit, period, planId };
}

function chargeInTransaction(account, kind) {
  const q = quota(account, kind);
  if (q.remaining <= 0) {
    const upgrade = q.planId === "pro" ? null : "pro";
    throw httpError(402, q.planId === "free" ? "You've used your free image studio allowance. Get Snapfront Pro to keep creating." : "You've used this month's image studio allowance. It resets on the 1st.", { upgrade });
  }
  db.prepare(`INSERT INTO usage (account_id,period,kind,count) VALUES (?,?,?,1)
    ON CONFLICT(account_id,period,kind) DO UPDATE SET count=count+1`).run(account.id, q.period, kind);
  return q.period;
}

function ensureContext(body) {
  const operation = String(body?.operation || "");
  const context = operation.startsWith("storefront-") ? "storefront" : operation.startsWith("digital-") ? "digital" : null;
  if (!OPS.has(operation) || !context) throw httpError(400, "Choose an available image operation.");
  const aspect = String(body?.aspect || "");
  if (!ASPECTS.has(aspect)) throw httpError(400, "Choose wide, portrait, or square.");
  if (context === "storefront" && ![0, 1, 2].includes(body?.slot)) throw httpError(400, "Choose the storefront photo slot this result will be reviewed for.");
  if (context === "digital" && body?.slot != null) throw httpError(400, "Digital image jobs do not use a storefront slot.");
  return { operation, context, aspect, slot: context === "storefront" ? body.slot : null };
}

const MAX_MOCKUP_SOURCE_HOPS = 8;
function canonicalMockupSource(sellerId, productId, file) {
  let source = file;
  const seen = new Set();
  for (let hop = 0; hop < MAX_MOCKUP_SOURCE_HOPS; hop++) {
    if (seen.has(source)) throw httpError(400, "This mockup source has an invalid history.");
    seen.add(source);
    // Only a completed job for this seller and this product can link a rendered frame back to its
    // original cover. A result from another listing or store is never an interchangeable source.
    const prior = db.prepare(`SELECT source_file FROM image_assistant_jobs
      WHERE seller_id=? AND product_id=? AND operation='digital-mockup' AND status='done'
        AND result_file=? AND source_file IS NOT NULL ORDER BY created_at DESC, id DESC LIMIT 1`).get(sellerId, productId, source);
    if (!prior) return source;
    if (!IMAGE_FILE.test(String(prior.source_file || ""))) throw httpError(400, "This mockup source has an invalid history.");
    source = prior.source_file;
  }
  throw httpError(400, "This mockup source has too many nested frames. Choose the original cover.");
}

function validMockupCover(sellerId, productId, file) {
  const currentCover = db.prepare(`SELECT 1 FROM products p LEFT JOIN digital_design_exports e
    ON e.product_id=p.id AND e.seller_id=p.seller_id
    WHERE p.id=? AND p.seller_id=? AND p.kind='digital'
      AND (p.image_file=? OR e.cover_file=? OR e.attached_cover_file=?) LIMIT 1`)
    .get(productId, sellerId, file, file, file);
  if (currentCover) return true;
  // A seller may explicitly use a mockup as a listing image. Keep its recorded original cover
  // usable for the next mockup, but only where it belongs to this exact seller/product history.
  return Boolean(db.prepare(`SELECT 1 FROM image_assistant_jobs
    WHERE seller_id=? AND product_id=? AND operation='digital-mockup' AND status='done'
      AND source_file=? LIMIT 1`).get(sellerId, productId, file));
}

function checkSource(seller, operation, sourceFile, productId) {
  const needs = operation.endsWith("-edit") || operation === "digital-mockup";
  if (!needs) {
    if (sourceFile != null && sourceFile !== "") throw httpError(400, "This artwork operation does not accept a source photo.");
    if (productId == null || productId === "") return { sourceFile: null, productId: null };
    if (operation !== "digital-art") throw httpError(400, "Artwork is not tied to an inventory product.");
    const product = db.prepare("SELECT * FROM products WHERE id=? AND seller_id=?").get(String(productId), seller.id);
    if (!product) throw httpError(404, "That product does not belong to this store.");
    if (product.kind !== "digital") throw httpError(400, "Digital artwork can only use a saved digital product context.");
    // This is context for review only: digital-art never creates or changes inventory.
    return { sourceFile: null, productId: product.id };
  }
  if (!IMAGE_FILE.test(String(sourceFile || ""))) throw httpError(400, "Choose a saved image from this store first.");
  if (!fs.existsSync(path.join(dirs.images, sourceFile))) {
    throw httpError(404, "That image does not belong to this store.");
  }
  let product = null;
  if (productId != null && productId !== "") {
    product = db.prepare("SELECT * FROM products WHERE id=? AND seller_id=?").get(String(productId), seller.id);
    if (!product) throw httpError(404, "That product does not belong to this store.");
  }
  if (operation === "digital-mockup") {
    if (product && product.kind !== "digital") throw httpError(400, "Mockups are only available for saved digital products.");
    // A current listing can intentionally point at a prior mockup result. Resolve that local,
    // same-product result before rendering so deterministic frames are never framed again.
    if (!product) product = db.prepare(`SELECT p.* FROM image_assistant_jobs j JOIN products p
      ON p.id=j.product_id AND p.seller_id=j.seller_id WHERE j.seller_id=?
        AND j.operation='digital-mockup' AND j.status='done' AND j.result_file=? AND p.kind='digital'
      ORDER BY j.created_at DESC, j.id DESC LIMIT 1`).get(seller.id, sourceFile);
    if (!product) product = db.prepare(`SELECT p.* FROM products p LEFT JOIN digital_design_exports e
      ON e.product_id=p.id AND e.seller_id=p.seller_id WHERE p.seller_id=? AND p.kind='digital'
      AND (p.image_file=? OR e.cover_file=? OR e.attached_cover_file=?) LIMIT 1`).get(seller.id, sourceFile, sourceFile, sourceFile);
    if (!product) throw httpError(400, "Choose a genuine saved digital product cover.");
    sourceFile = canonicalMockupSource(seller.id, product.id, sourceFile);
    if (!fs.existsSync(path.join(dirs.images, sourceFile)) || !validMockupCover(seller.id, product.id, sourceFile)) {
      throw httpError(400, "Choose the saved cover for this digital product. Mockups cannot use a physical-product or unrelated image.");
    }
  } else if (!ownsSellerImage(seller.id, sourceFile)) {
    throw httpError(404, "That image does not belong to this store.");
  }
  if (product && product.kind === "physical" && operation === "digital-edit") {
    throw httpError(400, "Digital editing is only available for a digital product source.");
  }
  return { sourceFile, productId: product?.id || null };
}

function canonicalRequest(body, seller) {
  const basic = ensureContext(body);
  const prompt = cleanPrompt(body?.prompt);
  if (prompt.length < 3) throw httpError(400, "Describe the image you want in a few words.");
  const preset = body?.preset == null ? null : clean(body.preset, 40);
  if (basic.operation === "digital-mockup" && !MOCKUPS.some((p) => p.id === preset)) throw httpError(400, "Choose chrome, editorial, or midnight for the mockup.");
  if (basic.operation !== "digital-mockup" && preset) throw httpError(400, "That preset is not available for this operation.");
  const source = checkSource(seller, basic.operation, body?.image_file, body?.product_id);
  const idempotencyKey = clean(body?.idempotency_key, 160);
  if (!idempotencyKey) throw httpError(400, "An idempotency key is required.");
  const data = { ...basic, prompt, preset, source_file: source.sourceFile, product_id: source.productId };
  return { ...data, idempotencyKey, hash: crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex") };
}

function providerInput(job) {
  const parsed = JSON.parse(job.input_json);
  const source = parsed.source_file ? imageUrl(parsed.source_file) : null;
  const preserve = "Treat the source product or cover as reference material. Preserve its actual pixels, composition, title, author text, logo, and design as faithfully as the model allows; do not invent replacement lettering. This is an instruction, not a guarantee.";
  if (job.operation.endsWith("-art")) return {
    endpoint: ENDPOINT.art,
    input: { prompt: `${parsed.prompt}. Create original artwork only; do not manufacture inventory or imply a physical product.`, negative_prompt: "watermark, logo, unreadable text, distorted text, copied trademark", size: ASPECTS.get(job.aspect), seed: -1, enable_safety_checker: true },
  };
  return {
    endpoint: ENDPOINT.edit,
    input: { images: [source], prompt: `${parsed.prompt}. ${preserve}`, size: ASPECTS.get(job.aspect), output_format: "jpeg", seed: -1 },
  };
}

async function runpod(pathname, body) {
  if (!providerEnabled()) throw httpError(503, "AI image generation is not set up yet. Deterministic mockups are still available.");
  let res;
  const what = pathname.replace(/\/status\/.*/, "/status");
  try {
    res = await fetchImpl(`${API}/${pathname}`, { method: body ? "POST" : "GET", signal: AbortSignal.timeout(60_000), headers: { Authorization: `Bearer ${String(config.runpodKey).trim()}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  } catch (cause) {
    console.warn("[image-assistant] runpod", what, "no answer:", cause?.name || cause?.message || "network");
    const e = httpError(502, "The AI image service did not answer. Try again in a moment.");
    e.transient = true;
    throw e;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.warn("[image-assistant] runpod", what, res.status, JSON.stringify(data).slice(0, 300));
    if (res.status === 401 || res.status === 403) throw httpError(503, "AI image generation is not set up yet. Deterministic mockups are still available.");
    const e = httpError(502, "The AI image service could not complete this image. Try again.");
    e.providerStatus = res.status;
    e.transient = res.status >= 500 || res.status === 429;
    throw e;
  }
  return data;
}

function outputUrl(output) {
  if (!output) return null;
  if (typeof output === "string") return /^https:\/\//i.test(output) ? output : null;
  for (const key of ["image_url", "image", "url", "result"]) if (typeof output[key] === "string" && /^https:\/\//i.test(output[key])) return output[key];
  for (const value of Object.values(output)) {
    if (typeof value === "string" && /^https:\/\//i.test(value) && /\.(?:jpe?g|png|webp)(?:\?|$)/i.test(value)) return value;
    if (value && typeof value === "object") { const nested = outputUrl(value); if (nested) return nested; }
  }
  return null;
}

export function allowedProviderUrl(value) {
  let url;
  try { url = new URL(value); } catch { return null; }
  const host = url.hostname.toLowerCase();
  // Runpod's own hosts, plus the public cloud storage Runpod delivers finished images from: Amazon
  // CloudFront since Oct 2026, and S3 / Google Cloud Storage / Cloudflare R2 in case it moves again.
  // All are public delivery hosts, never internal addresses; redirects are checked the same way.
  const runpodHost = host === "runpod.ai" || host.endsWith(".runpod.ai") || host.endsWith(".runpod.net") || host.endsWith(".runpod.io");
  const storageHost = /^[a-z0-9]+\.cloudfront\.net$/.test(host)
    || /^([a-z0-9.-]+\.)?s3([.-][a-z0-9-]+)*\.amazonaws\.com$/.test(host)
    || host === "storage.googleapis.com"
    || /^[a-z0-9-]+\.r2\.(cloudflarestorage\.com|dev)$/.test(host) || /^[a-z0-9]+\.[a-z0-9-]+\.r2\.cloudflarestorage\.com$/.test(host);
  if (url.protocol !== "https:" || !(runpodHost || storageHost)) {
    // Only the host, never the (often signed) link itself.
    console.warn("[image-assistant] result link host not allowed:", url.protocol, host);
    return null;
  }
  return url;
}

async function boundedDownload(url) {
  let target = allowedProviderUrl(url);
  if (!target) throw httpError(502, "The AI image result was unavailable.");
  for (let hop = 0; hop < 4; hop++) {
    let res;
    try { res = await fetchImpl(target.href, { redirect: "manual", signal: AbortSignal.timeout(120_000) }); }
    catch { const e = httpError(502, "The AI image result could not be downloaded."); e.transient = true; throw e; }
    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const next = res.headers?.get?.("location");
      target = next && allowedProviderUrl(new URL(next, target).href);
      if (!target) throw httpError(502, "The AI image result was unavailable.");
      continue;
    }
    if (!res.ok) {
      console.warn("[image-assistant] download", target.hostname, res.status);
      const e = httpError(502, "The AI image result could not be downloaded.");
      e.transient = res.status >= 500 || res.status === 429;
      throw e;
    }
    const declared = Number(res.headers?.get?.("content-length") || 0);
    if (declared && (!Number.isFinite(declared) || declared > MAX_DOWNLOAD)) throw httpError(413, "The AI image result was too large.");
    if (!res.body?.getReader) {
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > MAX_DOWNLOAD) throw httpError(413, "The AI image result was too large.");
      return buf;
    }
    const reader = res.body.getReader(), chunks = [];
    let total = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_DOWNLOAD) { await reader.cancel().catch(() => {}); throw httpError(413, "The AI image result was too large."); }
      chunks.push(Buffer.from(value));
    }
    return Buffer.concat(chunks, total);
  }
  throw httpError(502, "The AI image result redirected too many times.");
}

async function safeJpeg(bytes) {
  let meta;
  try { meta = await sharp(bytes, { limitInputPixels: MAX_PIXELS }).metadata(); } catch { throw httpError(502, "The AI image result was not a valid image."); }
  if (!meta.width || !meta.height || meta.width * meta.height > MAX_PIXELS || !["jpeg", "png", "webp"].includes(meta.format)) throw httpError(502, "The AI image result was not a valid image.");
  return sharp(bytes, { limitInputPixels: MAX_PIXELS }).rotate().jpeg({ quality: 91, mozjpeg: true }).toBuffer();
}

function mockupCanvas(aspect) {
  if (aspect === "wide") return { width: 1800, height: 1266 };
  if (aspect === "square") return { width: 1600, height: 1600 };
  // Native digital mockup flows request portrait; this is intentionally a portrait master.
  return { width: 1440, height: 1800 };
}

function mockupLayout(preset, width, height, sourceAspect) {
  // A digital cover is normally portrait. Keep the source aspect rather than placing it in a
  // landscape tablet screen, so it is all actual cover pixels with no artificial pillar boxes.
  const aspect = Math.max(.32, Math.min(1.8, Number(sourceAspect) || .7));
  const maxScreenWidth = width * (preset === "editorial" ? .58 : .52);
  const maxScreenHeight = height * (preset === "editorial" ? .70 : .68);
  const screenHeight = Math.round(Math.min(maxScreenHeight, maxScreenWidth / aspect));
  const screenWidth = Math.round(screenHeight * aspect);
  const side = Math.max(24, Math.round(Math.min(width, height) * .026));
  const top = preset === "editorial" ? side : Math.round(side * 1.35);
  const bottom = preset === "chrome" ? Math.round(side * 2.25) : Math.round(side * 1.5);
  const deviceWidth = screenWidth + side * 2;
  const deviceHeight = screenHeight + top + bottom;
  const deviceX = Math.round((width - deviceWidth) / 2);
  const deviceY = Math.round((height - deviceHeight) / 2 - height * .015);
  return {
    deviceX, deviceY, deviceWidth, deviceHeight, screenWidth, screenHeight,
    screenX: deviceX + side, screenY: deviceY + top, side, top, bottom,
  };
}

function mockupSvg(preset, width, height, layout) {
  const bg = preset === "midnight" ? "#080c18" : preset === "editorial" ? "#e8e1d6" : "#e7edf0";
  const grid = preset === "midnight" ? "#1c2840" : "#ced8dc";
  const { deviceX, deviceY, deviceWidth, deviceHeight, screenX, screenY, screenWidth, screenHeight, side, top, bottom } = layout;
  const radius = preset === "editorial" ? 5 : Math.round(Math.min(deviceWidth, deviceHeight) * .065);
  const shadow = preset === "midnight" ? ".62" : ".32";
  const device = preset === "midnight" ? "#111a2c" : preset === "chrome" ? "#e5ebed" : "#fcfaf5";
  const stroke = preset === "midnight" ? "#5b6d90" : preset === "chrome" ? "#aeb9bc" : "#c9bfb2";
  const deviceFrame = preset === "editorial"
    ? `<g filter="url(#paperShadow)"><rect x="${deviceX + side * .55}" y="${deviceY + side * .9}" width="${deviceWidth}" height="${deviceHeight}" rx="${radius}" fill="#d4c9b9"/><rect x="${deviceX + side * .28}" y="${deviceY + side * .45}" width="${deviceWidth}" height="${deviceHeight}" rx="${radius}" fill="#eee7dc"/></g><rect x="${deviceX}" y="${deviceY}" width="${deviceWidth}" height="${deviceHeight}" rx="${radius}" fill="${device}" stroke="${stroke}" stroke-width="5"/>`
    : `<rect x="${deviceX}" y="${deviceY}" width="${deviceWidth}" height="${deviceHeight}" rx="${radius}" fill="${device}" stroke="${stroke}" stroke-width="7"/>`;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs><linearGradient id="g" x2="0" y2="1"><stop stop-color="${bg}"/><stop offset="1" stop-color="${preset === "midnight" ? "#10192b" : "#cbd3d1"}"/></linearGradient><filter id="s" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="34"/></filter><filter id="paperShadow" x="-30%" y="-30%" width="180%" height="180%"><feGaussianBlur stdDeviation="17"/></filter></defs>
    <rect width="100%" height="100%" fill="url(#g)"/><g opacity=".28" stroke="${grid}" stroke-width="2"><path d="M0 ${height * .18}H${width}M0 ${height * .82}H${width}M${width * .18} 0V${height}M${width * .82} 0V${height}"/></g>
    <ellipse cx="${width / 2}" cy="${deviceY + deviceHeight + height * .055}" rx="${deviceWidth * .54}" ry="${Math.max(22, height * .038)}" fill="#000" opacity="${shadow}" filter="url(#s)"/>
    ${deviceFrame}
    <rect x="${screenX}" y="${screenY}" width="${screenWidth}" height="${screenHeight}" rx="${preset === "editorial" ? 1 : Math.max(2, Math.round(side * .12))}" fill="${preset === "midnight" ? "#070b14" : "#fff"}"/>
    ${preset === "chrome" ? `<circle cx="${deviceX + deviceWidth / 2}" cy="${deviceY + deviceHeight - bottom / 2}" r="${Math.max(5, Math.round(side * .18))}" fill="#a9b2b4"/>` : ""}
    ${preset === "midnight" ? `<rect x="${deviceX + deviceWidth / 2 - side * .55}" y="${deviceY + top * .42}" width="${side * 1.1}" height="${Math.max(4, Math.round(side * .12))}" rx="3" fill="#647797"/>` : ""}
  </svg>`);
}

async function renderMockup(job) {
  const input = JSON.parse(job.input_json);
  const sourceFile = canonicalMockupSource(job.seller_id, job.product_id, input.source_file);
  const source = path.join(dirs.images, sourceFile);
  if (!fs.existsSync(source) || !validMockupCover(job.seller_id, job.product_id, sourceFile)) {
    throw httpError(409, "The saved digital cover is no longer available.");
  }
  const preset = input.preset;
  const image = sharp(source, { limitInputPixels: MAX_PIXELS }).rotate();
  const meta = await image.metadata();
  if (!meta.width || !meta.height) throw httpError(409, "The saved digital cover is no longer available.");
  const { width, height } = mockupCanvas(job.aspect);
  const layout = mockupLayout(preset, width, height, meta.width / meta.height);
  // The cover is composited as its own pixels at its own aspect ratio; SVG supplies only local frame
  // and depth treatment, never rewritten cover lettering or generated imagery.
  const cover = await image.resize(layout.screenWidth, layout.screenHeight, { fit: "fill" }).jpeg({ quality: 96, mozjpeg: true }).toBuffer();
  return sharp(mockupSvg(preset, width, height, layout)).composite([{ input: cover, left: layout.screenX, top: layout.screenY }]).jpeg({ quality: 93, mozjpeg: true }).toBuffer();
}

function ownerStillExists(job) {
  return Boolean(db.prepare("SELECT 1 FROM sellers WHERE id=? AND account_id=?").get(job.seller_id, job.account_id));
}

function finish(job, file) {
  if (!ownerStillExists(job)) return false;
  return db.transaction(() => {
    // A stale worker must never turn an already-failed/refunded job back into a completed image.
    const changed = db.prepare(`UPDATE image_assistant_jobs
      SET status='done', result_file=?, error=NULL, lease_owner=NULL, lease_until=NULL, updated_at=datetime('now')
      WHERE id=? AND lease_owner=? AND status IN ('queued','running') AND refunded=0`).run(file, job.id, job.lease_owner).changes;
    if (!changed) return false;
    db.prepare("INSERT OR IGNORE INTO seller_media (image_file,seller_id) VALUES (?,?)").run(file, job.seller_id);
    // Local deterministic presentation frames are not AI outputs and must not contaminate ai_images.
    if (job.operation !== "digital-mockup") db.prepare("INSERT OR IGNORE INTO ai_images (file) VALUES (?)").run(file);
    return true;
  })();
}

function fail(job, message) {
  if (!job?.lease_owner) return false;
  return db.transaction(() => {
    const current = db.prepare("SELECT * FROM image_assistant_jobs WHERE id=?").get(job.id);
    if (!current || current.lease_owner !== job.lease_owner || !["queued", "running"].includes(current.status) || current.refunded) return false;
    const changed = db.prepare(`UPDATE image_assistant_jobs
      SET status='failed', error=?, lease_owner=NULL, lease_until=NULL, updated_at=datetime('now')
      WHERE id=? AND lease_owner=? AND status IN ('queued','running') AND refunded=0`).run(safeError(message), job.id, job.lease_owner).changes;
    if (!changed) return false;
    if (current.usage_recorded) {
      const refunded = db.prepare("UPDATE image_assistant_jobs SET refunded=1 WHERE id=? AND status='failed' AND refunded=0").run(job.id).changes;
      // Refund the job's recorded period, not whatever period the account is in when a worker fails.
      if (refunded) db.prepare("UPDATE usage SET count=MAX(count-1,0) WHERE account_id=? AND period=? AND kind=?").run(current.account_id, current.usage_period, current.usage_kind);
    }
    return true;
  })();
}

/** Send this image to the AI service again (a new request), up to MAX_RETRIES times. False once used up. */
function retryLater(job, why) {
  const changed = db.prepare(`UPDATE image_assistant_jobs SET provider_job_id=NULL, submission_started=0, retries=retries+1, status='running', updated_at=datetime('now')
    WHERE id=? AND lease_owner=? AND status IN ('queued','running') AND refunded=0 AND retries < ?`).run(job.id, job.lease_owner, MAX_RETRIES).changes;
  if (changed) console.warn("[image-assistant] job", job.id, "retrying after", why);
  return Boolean(changed);
}

function claim(id = null, excluded = []) {
  const now = Date.now(), worker = `ias_${crypto.randomUUID()}`;
  return db.transaction(() => {
    let row;
    if (id) {
      row = db.prepare("SELECT * FROM image_assistant_jobs WHERE id=? AND status IN ('queued','running') AND refunded=0 AND (lease_until IS NULL OR lease_until < ?)").get(id, now);
    } else {
      const skipped = excluded.length ? ` AND id NOT IN (${excluded.map(() => "?").join(",")})` : "";
      row = db.prepare(`SELECT * FROM image_assistant_jobs WHERE status IN ('queued','running') AND refunded=0
        AND (lease_until IS NULL OR lease_until < ?)${skipped} ORDER BY created_at ASC, id ASC LIMIT 1`).get(now, ...excluded);
    }
    if (!row) return null;
    const changed = db.prepare("UPDATE image_assistant_jobs SET lease_owner=?, lease_until=?, updated_at=datetime('now') WHERE id=? AND status IN ('queued','running') AND refunded=0 AND (lease_until IS NULL OR lease_until < ?)").run(worker, now + LEASE_MS, row.id, now).changes;
    return changed ? { ...row, lease_owner: worker, lease_until: now + LEASE_MS } : null;
  })();
}

function renewLease(job) {
  const until = Date.now() + LEASE_MS;
  return Boolean(db.prepare(`UPDATE image_assistant_jobs SET lease_until=?, updated_at=datetime('now')
    WHERE id=? AND lease_owner=? AND status IN ('queued','running') AND refunded=0`).run(until, job.id, job.lease_owner).changes);
}

function release(job) {
  db.prepare("UPDATE image_assistant_jobs SET lease_owner=NULL, lease_until=NULL, updated_at=datetime('now') WHERE id=? AND lease_owner=?").run(job.id, job.lease_owner);
}

async function process(job) {
  let leaseActive = true;
  // Downloads are permitted to take up to 120 seconds, longer than one lease. Keep ownership
  // alive while any provider request, status check, render, or bounded download is in progress.
  const heartbeat = setInterval(() => { if (!renewLease(job)) leaseActive = false; }, 30_000);
  heartbeat.unref?.();
  try {
    if (!leaseActive || !ownerStillExists(job)) return;
    if (Date.now() - createdMs(job.created_at) > TIMEOUT_MS) return fail(job, "This image took too long. Try again.");
    if (job.operation === "digital-mockup") {
      const jpeg = await renderMockup(job);
      if (!leaseActive || !ownerStillExists(job)) return;
      const file = `${crypto.randomUUID()}.jpg`;
      fs.writeFileSync(path.join(dirs.images, file), jpeg, { flag: "wx" });
      if (!finish(job, file)) fs.rmSync(path.join(dirs.images, file), { force: true });
      return;
    }
    if (!job.provider_job_id) {
      if (job.submission_started) {
        return fail(job, "We could not confirm this image request after a restart. Your image allowance was restored; please start a new image.");
      }
      const fenced = db.prepare(`UPDATE image_assistant_jobs SET submission_started=1, status='running', updated_at=datetime('now')
        WHERE id=? AND lease_owner=? AND status IN ('queued','running') AND refunded=0 AND provider_job_id IS NULL AND submission_started=0`).run(job.id, job.lease_owner).changes;
      if (!fenced || !leaseActive) return;
      const { endpoint, input } = providerInput(job);
      let started;
      try { started = await runpod(`${endpoint}/run`, { input }); }
      catch (error) {
        // Runpod answered with a temporary error, so no image was started: send it again shortly.
        if (error?.providerStatus && error.transient && retryLater(job, `submit ${error.providerStatus}`)) return;
        throw error;
      }
      if (!started?.id) throw httpError(502, "The AI image service did not start this image.");
      if (!leaseActive) return;
      db.prepare(`UPDATE image_assistant_jobs SET status='running', provider_job_id=?, updated_at=datetime('now')
        WHERE id=? AND lease_owner=? AND status IN ('queued','running') AND refunded=0 AND provider_job_id IS NULL`).run(String(started.id), job.id, job.lease_owner);
      return;
    }
    const endpoint = job.operation.endsWith("-art") ? ENDPOINT.art : ENDPOINT.edit;
    let result;
    try { result = await runpod(`${endpoint}/status/${encodeURIComponent(job.provider_job_id)}`); }
    catch (error) {
      // A hiccup while checking doesn't mean the image failed: look again on the next pass (the
      // 20-minute limit above still applies).
      if (error?.transient) return;
      throw error;
    }
    if (!leaseActive) return;
    if (["FAILED", "CANCELLED", "TIMED_OUT"].includes(result.status)) {
      console.warn("[image-assistant] job", job.id, endpoint, result.status, JSON.stringify(result.error || result.output || "").slice(0, 400));
      if (retryLater(job, result.status)) return;
      return fail(job, "The AI image service could not make this image. Try different wording or a clearer source.");
    }
    if (result.status !== "COMPLETED") return;
    const url = outputUrl(result.output);
    if (!url) {
      console.warn("[image-assistant] job", job.id, "finished without an image link:", JSON.stringify(result.output ?? null).slice(0, 400));
      if (retryLater(job, "no image link")) return;
      return fail(job, "The AI image service finished without an image. Try again.");
    }
    // Check the job/account and source binding again immediately before retaining provider bytes.
    if (!ownerStillExists(job) || !leaseActive) return;
    const bytes = await safeJpeg(await boundedDownload(url));
    if (!ownerStillExists(job) || !leaseActive) return;
    const file = `${crypto.randomUUID()}.jpg`;
    fs.writeFileSync(path.join(dirs.images, file), bytes, { flag: "wx" });
    if (!finish(job, file)) fs.rmSync(path.join(dirs.images, file), { force: true });
  } catch (error) {
    console.warn("[image-assistant] job", job.id, job.operation, error?.status || "", error?.message || "failed");
    // A download that hit a temporary problem is tried again on the next pass.
    if (error?.transient && job.provider_job_id) return;
    fail(job, error?.status === 413 ? "The AI image result was too large." : "The AI image service could not complete this image. Try again.");
  } finally {
    clearInterval(heartbeat);
    release(job);
  }
}

export async function poll(id = null) {
  const jobs = [];
  const max = id ? 1 : 4;
  for (let i = 0; i < max; i++) {
    // Do not repeatedly re-claim the oldest still-running provider job in one scan.
    const job = claim(id, jobs);
    if (!job) break;
    jobs.push(job.id);
    await process(job);
    if (id) break;
  }
  return jobs;
}

function view(row) {
  if (!row) return null;
  return {
    id: row.id, context: row.context, operation: row.operation, status: row.status,
    prompt: row.prompt, aspect: row.aspect, slot: row.slot == null ? null : Number(row.slot),
    product_id: row.product_id || null, source_file: row.source_file || null,
    ...(row.result_file ? { image_file: row.result_file, image_url: imageUrl(row.result_file) } : {}),
    error: row.status === "failed" ? safeError(row.error) : null, created_at: row.created_at,
  };
}

function ownedJob(seller, id) {
  const row = db.prepare("SELECT * FROM image_assistant_jobs WHERE id=? AND seller_id=?").get(String(id || ""), seller.id);
  if (!row) throw httpError(404, "That image job does not belong to this store.");
  return row;
}

export function options(account, seller, context) {
  if (!["storefront", "digital"].includes(context)) throw httpError(400, "Choose storefront or digital image studio.");
  const ai = quota(account, "scene"), mockup = quota(account, "studio");
  const provider = providerEnabled() ? "runpod" : null;
  const mockups = context === "digital" ? MOCKUPS : [];
  return {
    // A studio route remains available for its job history and setup state; clients gate AI UI on
    // provider and can still expose deterministic digital mockups when provider is null.
    enabled: true, provider,
    setup_required: provider ? null : mockups.length
      ? "AI image generation is not configured; deterministic digital mockups remain available."
      : "AI image generation is not configured.",
    jobs: db.prepare("SELECT * FROM image_assistant_jobs WHERE seller_id=? AND context=? ORDER BY created_at DESC LIMIT 50").all(seller.id, context).map(view),
    mockups,
    allowance: { ai: { remaining: ai.remaining, limit: ai.limit }, mockup: { remaining: mockup.remaining, limit: mockup.limit } },
  };
}

export async function start(account, seller, body) {
  const input = canonicalRequest(body, seller);
  const existing = db.prepare("SELECT * FROM image_assistant_jobs WHERE seller_id=? AND idempotency_key=?").get(seller.id, input.idempotencyKey);
  if (existing) {
    if (existing.request_hash !== input.hash) throw httpError(409, "That idempotency key was already used for a different image request.");
    return view(existing);
  }
  if (input.operation !== "digital-mockup" && !providerEnabled()) throw httpError(503, "AI image generation is not set up yet. Deterministic mockups are still available.");
  const id = newId("iaj");
  const kind = input.operation === "digital-mockup" ? "studio" : "scene";
  const inserted = db.transaction(() => {
    const again = db.prepare("SELECT * FROM image_assistant_jobs WHERE seller_id=? AND idempotency_key=?").get(seller.id, input.idempotencyKey);
    if (again) return again;
    const usagePeriod = chargeInTransaction(account, kind);
    db.prepare(`INSERT INTO image_assistant_jobs (id,seller_id,account_id,context,operation,prompt,aspect,slot,product_id,source_file,preset,input_json,request_hash,idempotency_key,usage_kind,usage_period,usage_recorded)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)`).run(id, seller.id, account.id, input.context, input.operation, input.prompt, input.aspect, input.slot, input.product_id, input.source_file, input.preset, JSON.stringify(input), input.hash, input.idempotencyKey, kind, usagePeriod);
    return db.prepare("SELECT * FROM image_assistant_jobs WHERE id=?").get(id);
  })();
  // A concurrent same-key caller sees the exact first job; an unrelated internal constraint is not
  // converted into a provider error or a second allowance charge.
  if (inserted.id !== id) {
    if (inserted.request_hash !== input.hash) throw httpError(409, "That idempotency key was already used for a different image request.");
    return view(inserted);
  }
  await poll(id);
  return view(db.prepare("SELECT * FROM image_assistant_jobs WHERE id=?").get(id));
}

export async function get(account, seller, id) {
  let row = ownedJob(seller, id);
  if (row.account_id !== account.id) throw httpError(404, "That image job does not belong to this account.");
  if (["queued", "running"].includes(row.status)) await poll(row.id);
  row = ownedJob(seller, id);
  return view(row);
}

export function startWorker() {
  if (timer) return false;
  timer = setInterval(() => {
    if (workerScan) return;
    workerScan = poll().catch((error) => console.error("[image-assistant] poll", error?.message || "failed")).finally(() => { workerScan = null; });
  }, 8_000);
  timer.unref?.();
  return true;
}
export function stopWorker() { if (timer) clearInterval(timer); timer = null; }

export function routes(app, { auth, wrap }) {
  app.get("/api/image-assistant", auth, (req, res) => res.json(options(req.account, req.seller, String(req.query.context || ""))));
  app.post("/api/image-assistant/jobs", auth, wrap(async (req, res) => res.status(201).json(await start(req.account, req.seller, req.body || {}))));
  app.get("/api/image-assistant/jobs/:id", auth, wrap(async (req, res) => res.json(await get(req.account, req.seller, req.params.id))));
}

// Faceless avatars: an original AI character that fronts a seller's posts and stories, so they
// never have to be on camera. Two steps, both on Runpod's public endpoints:
//   1. Create the avatar (Qwen Image, text to image) from a style and a short description.
//   2. Put it in a shot with one of the seller's products (Qwen Image Edit 2511, avatar + product
//      photo in, one 4:5 photo out). Shots are owned store photos, so Marketing can turn them into
//      posts, stories, carousels and reels with the usual designs.
// Characters made from a description are always original: descriptions that ask for a real or famous
// person's likeness are refused, and every prompt tells the model not to resemble anyone. Results are
// marked as AI images, like the other AI photos, so the store can say so.
//
// Two avatars come from real photos instead, and both need the seller to confirm consent:
//   - "Your photo": the seller's own photo becomes the avatar (no AI step, so it's free).
//   - "Blend": two photos of two adults become one new, believable person. Claude first studies both
//     photos and writes one consistent description of the new person (a single skin tone, face, eyes,
//     hair), then Nano Banana Pro makes the portrait from both photos plus that description. If it
//     refuses or fails, Seedream 4 tries once with the same instructions.
// Every uploaded photo is checked by Claude first: exactly one real person, clearly an adult, no
// nudity. Photos are re-saved without their metadata (no location), photos staged but never used
// are deleted after a day, and a blend's two source photos are deleted as soon as it's finished.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { config, dirs } from "./config.js";
import { db, newId, rowToProduct } from "./db.js";
import { httpError, askJson, sniffImage } from "./claude.js";
import sharp from "sharp";
import * as plans from "./plans.js";
import * as aimedia from "./aimedia.js";
import * as credits from "./credits.js";
import { ownsSellerImage } from "./media-ownership.js";

const T2I = "qwen-image-t2i", EDIT = "qwen-image-edit-2511";
const KIND = "scene";   // avatars and shots use the "AI lifestyle photos" allowance
const MAX_AVATARS = 12;

db.exec(`
CREATE TABLE IF NOT EXISTS avatars (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  name TEXT NOT NULL,
  style TEXT NOT NULL,
  look TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','done','failed')),
  runpod_id TEXT,
  image_file TEXT,
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS avatars_seller ON avatars (seller_id, created_at);
CREATE TABLE IF NOT EXISTS avatar_shots (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  avatar_id TEXT NOT NULL REFERENCES avatars(id) ON DELETE CASCADE,
  product_id TEXT,
  pose TEXT NOT NULL,
  prompt TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','done','failed')),
  runpod_id TEXT,
  image_file TEXT,
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS avatar_shots_seller ON avatar_shots (seller_id, created_at);
CREATE TABLE IF NOT EXISTS avatar_photos (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  image_file TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS avatar_photos_seller ON avatar_photos (seller_id, created_at);
`);
// Where an avatar came from: "ai" (a described character), "photo" (the seller's photo) or "blend".
for (const [col, def] of [["source", "TEXT NOT NULL DEFAULT 'ai'"], ["consent_at", "TEXT"], ["src_files", "TEXT"], ["engine", "TEXT"], ["gen_prompt", "TEXT"], ["ref_files", "TEXT"]]) {
  if (!db.prepare("PRAGMA table_info(avatars)").all().some((c) => c.name === col)) db.exec(`ALTER TABLE avatars ADD COLUMN ${col} ${def}`);
}
// A shot made with a premium photo engine records the endpoint it ran on (paid with credits).
if (!db.prepare("PRAGMA table_info(avatar_shots)").all().some((c) => c.name === "engine")) {
  db.exec("ALTER TABLE avatar_shots ADD COLUMN engine TEXT");
}

/* ---------- what sellers can pick ---------- */
// "keep" is repeated in every shot so the avatar stays faceless in the way the seller chose.
export const STYLES = [
  { id: "chrome", name: "Chrome host", blurb: "A sleek humanoid with a smooth mirrored visor. No face at all.",
    prompt: "a sleek original humanoid character with a smooth reflective chrome visor where the face would be (no eyes, nose or mouth visible), polished metal and matte graphite body, modern stylish outfit, premium 3D render, soft studio lighting",
    keep: "The character keeps its smooth mirrored visor: no human face is ever visible." },
  { id: "soft3d", name: "Soft 3D character", blurb: "A friendly animated-movie style character.",
    prompt: "a friendly original stylized 3D animated character with simplified features and expressive body language, soft matte materials, warm cinematic studio lighting",
    keep: "Keep the same stylized 3D animated look; it must not look like a photo of a real person." },
  { id: "illustrated", name: "Illustrated", blurb: "A clean, flat editorial illustration.",
    prompt: "an original character drawn as a clean modern flat editorial illustration with bold shapes, limited color palette and simple linework",
    keep: "Keep the same flat illustration style; it must not look like a photo." },
  { id: "silhouette", name: "From behind", blurb: "A real-looking person whose face is never shown.",
    prompt: "a stylish person photographed from behind or in soft backlit silhouette so the face is completely hidden, photorealistic, natural light, shot on a modern phone camera",
    keep: "The person's face stays completely hidden: seen from behind, cropped above the shoulders, or in silhouette." },
  { id: "hands", name: "Hands only", blurb: "POV style: just hands and sleeves, like most faceless creators.",
    prompt: "a first-person point of view showing only a person's hands and forearms with distinctive sleeves and accessories, photorealistic, natural window light",
    keep: "Only the hands and forearms are visible, with the same sleeves, skin tone and accessories. No face." },
  { id: "mascot", name: "Mascot", blurb: "A cute original creature for playful brands.",
    prompt: "a cute original creature mascot with a simple memorable silhouette and a friendly personality, polished 3D render, soft colorful studio lighting",
    keep: "Keep the same mascot design and colors." },
  // Avatars from real photos. Not offered as styles to pick: they come from "Use my photo" and "Blend".
  { id: "photo", name: "Your photo", hidden: true, real: true,
    keep: "Keep this exact person: the same face, hair, skin tone and build as in the reference, photorealistic." },
  { id: "blend", name: "Blend", hidden: true, real: true,
    keep: "Keep this exact person: the same face, hair, skin tone and build as in the reference, photorealistic." },
];
export const POSES = [
  { id: "present", name: "Showing it off", prompt: "holding the product up toward the viewer and presenting it proudly" },
  { id: "unbox", name: "Unboxing", prompt: "unboxing the product at a cozy, tidy desk, opened packaging beside it" },
  { id: "point", name: "Pointing at it", prompt: "standing beside the product and pointing at it with excited body language" },
  { id: "desk", name: "Working with it", prompt: "sitting at a bright desk next to a laptop, using or holding the product" },
  { id: "outdoor", name: "Out and about", prompt: "walking outdoors in warm golden-hour light, carrying the product" },
  { id: "flatlay", name: "Styled flat lay", prompt: "reaching into a styled top-down flat lay that features the product with a few complementary props" },
];
const ORIGINAL = "An original character created for this brand: it must not resemble any real person, celebrity or existing copyrighted character, and has no logos.";
const NO_TEXT = "No added text, captions, logos or watermarks.";
// A description can shape the avatar but can't ask for a real person's likeness.
const LIKENESS_WORDS = /\b(resembl\w*|lookalike|look-alike|deep\s*fakes?|celebrit(y|ies)|famous|same\s+face\s+as|my\s+face|my\s+photo|real\s+person)\b/i;
// "looks like a barista" is fine; "looks like Taylor Swift" names someone.
const LIKENESS_NAMED = /\b(?:[Ll]ook(?:s|ing)?|[Ss]tyled|[Dd]ressed)\s+(?:just\s+|exactly\s+)?(?:like|as)\s+[A-Z][a-z]+/;
export const asksForLikeness = (text) => LIKENESS_WORDS.test(text) || LIKENESS_NAMED.test(text);

const clean = (s, n) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);
export const presets = () => ({
  enabled: aimedia.enabled(), max_avatars: MAX_AVATARS,
  engines: aimedia.presets().engines,   // photo engines for posts and stories (premium ones use credits)
  styles: STYLES.filter((s) => !s.hidden).map(({ id, name, blurb }) => ({ id, name, blurb })),
  // Avatars from real photos need the photo check (Claude) as well as the image AI.
  from_photos: aimedia.enabled() && (Boolean(config.anthropicKey) || Boolean(screenImpl)),
  mixes: MIXES.map(({ id, name }) => ({ id, name })),
  poses: POSES.map(({ id, name }) => ({ id, name })),
});

/* ---------- making an avatar ---------- */
function avatarPrompt(style, look) {
  return `Character design portrait of ${style.prompt}. ${look ? `Look: ${look}. ` : ""}Half-body, centered, facing the viewer, plain soft gradient background, consistent design that can be reused in many photos. ${ORIGINAL} ${NO_TEXT}`;
}
export async function create(account, seller, b = {}) {
  const style = STYLES.find((s) => s.id === b.style);
  if (!style) throw httpError(400, "Pick a style for your avatar.");
  const name = clean(b.name, 30) || style.name;
  const look = clean(b.look, 200);
  if (asksForLikeness(`${name} ${look}`)) throw httpError(400, "Avatars are original characters. Describe the look you want (hair, outfit, colors, vibe) without basing it on a real person.");
  if (db.prepare("SELECT COUNT(*) AS n FROM avatars WHERE seller_id = ? AND status != 'failed'").get(seller.id).n >= MAX_AVATARS) throw httpError(400, `You can keep up to ${MAX_AVATARS} avatars. Delete one to make another.`);
  if (!aimedia.enabled()) throw httpError(503, "AI avatars aren't switched on yet.");
  plans.assertAllowance(account, KIND);
  const id = newId("avt");
  db.prepare("INSERT INTO avatars (id, seller_id, account_id, name, style, look) VALUES (?,?,?,?,?,?)").run(id, seller.id, account.id, name, style.id, look);
  plans.recordUsage(account, KIND);
  try {
    const r = await aimedia.runpod(`${T2I}/run`, { input: { prompt: avatarPrompt(style, look), negative_prompt: "text, watermark, logo, celebrity, real person likeness, extra limbs, distorted hands, blurry", size: "1024*1280", seed: -1, enable_safety_checker: true } });
    db.prepare("UPDATE avatars SET status='running', runpod_id=?, updated_at=datetime('now') WHERE id=?").run(r.id, id);
  } catch (e) { fail("avatars", id, e.message); throw e; }
  return avatarView(getAvatar(seller, id));
}

/* ---------- avatars from real photos ---------- */
const STAGED_KEEP_HOURS = 24, MAX_STAGED = 10;
const CONSENT = { photo: "Confirm this is you, or that the person agreed to be your avatar.", blend: "Confirm both people are adults who agreed to have their photos blended." };
export const MIXES = [
  { id: "even", name: "Even mix", prompt: "about half from each of them" },
  { id: "1", name: "More like photo 1", prompt: "about 70% like the person in image 1 and 30% like the person in image 2" },
  { id: "2", name: "More like photo 2", prompt: "about 70% like the person in image 2 and 30% like the person in image 1" },
];
// Who makes the blend: the best multi-photo model first, a second model if it refuses or fails.
const ep = (env, fallback) => (process.env[env] || fallback).trim();
const BLENDERS = [
  { id: () => ep("RUNPOD_EP_BLEND", "nano-banana-pro-edit"),
    input: (images, prompt) => ({ prompt, images, resolution: "2k", aspect_ratio: "4:5", output_format: "jpeg", enable_safety_checker: true }) },
  { id: () => ep("RUNPOD_EP_BLEND_BACKUP", "seedream-v4-edit"),
    input: (images, prompt) => ({ prompt, images, size: "1024*1280", enable_safety_checker: true }) },
];
const SCREEN_PROMPT = `You check photos that people upload to make an AI avatar of a person for their online store. Do not say who anyone is. Answer with this JSON object:
{"people": the number of real people visible in the photo,
 "face_visible": true if one person's face is clearly visible, in focus and not tiny,
 "photo": true if this is a real photograph of a person (not a drawing, cartoon, 3D render, or a picture of a screen, poster or magazine),
 "adult": true only if every person visible clearly appears to be an adult, 18 or older. If anyone might be under 18, or you can't tell, answer false,
 "nudity": true if anyone is nude or partly nude, or the photo is sexual}`;
let screenImpl = null;
/** Tests: replace the photo check. */
export function setPhotoScreen(f) { screenImpl = f; }
async function screenPhoto(buf) {
  if (screenImpl) return screenImpl(buf);
  return askJson([{ type: "image", source: { type: "base64", media_type: "image/jpeg", data: buf.toString("base64") } }, { type: "text", text: SCREEN_PROMPT }], 300);
}
/** Why a photo can't be used, or null if it's fine. Fails closed: anything unclear is refused. */
function photoProblem(r) {
  if (!r || typeof r !== "object") return "We couldn't check that photo. Try again.";
  if (r.nudity !== false) return "We can't use this photo. Choose a different one.";
  if (r.adult !== true) return "Avatars can only be made from photos of adults (18 or older).";
  if (r.photo !== true) return "Use a real photo of a person, not a drawing or a picture of a screen.";
  if (Number(r.people) > 1) return "Use a photo with just one person in it.";
  if (Number(r.people) < 1 || r.face_visible !== true) return "We couldn't see a face clearly. Use a bright photo facing the camera.";
  return null;
}
/** Upload a photo of a person for "Use my photo" or "Blend". Checked first; saved without metadata. */
export async function stagePhoto(account, seller, b = {}) {
  if (!config.anthropicKey && !screenImpl) throw httpError(503, "Photo avatars aren't switched on yet.");
  const raw = Buffer.from(String(b.imageBase64 || ""), "base64");
  if (raw.length < 100 || !sniffImage(raw)) throw httpError(400, "Use a JPG, PNG or WebP photo.");
  if (raw.length > 12 * 1024 * 1024) throw httpError(413, "That photo is too big. Choose a smaller one.");
  let buf;
  // Upright, at most 1536 px, re-encoded: this also drops the photo's metadata (location, device).
  try { buf = await sharp(raw).rotate().resize(1536, 1536, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 90 }).toBuffer(); }
  catch { throw httpError(400, "We couldn't open that photo. Try another one."); }
  const problem = photoProblem(await screenPhoto(buf));
  if (problem) throw httpError(422, problem);
  const old = db.prepare("SELECT * FROM avatar_photos WHERE seller_id = ? ORDER BY created_at DESC, rowid DESC").all(seller.id).slice(MAX_STAGED - 1);
  for (const p of old) dropPhoto(p);
  const id = newId("aph");
  const file = `${crypto.randomUUID()}.jpg`;
  fs.writeFileSync(path.join(dirs.images, file), buf);
  db.prepare("INSERT INTO avatar_photos (id, seller_id, image_file) VALUES (?,?,?)").run(id, seller.id, file);
  return { id, image_url: img(file) };
}
function dropPhoto(p, keepFile = false) {
  db.prepare("DELETE FROM avatar_photos WHERE id = ?").run(p.id);
  if (!keepFile) fs.rmSync(path.join(dirs.images, p.image_file), { force: true });
}
function stagedPhoto(seller, id) {
  const p = db.prepare("SELECT * FROM avatar_photos WHERE id = ? AND seller_id = ?").get(String(id || ""), seller.id);
  if (!p || !fs.existsSync(path.join(dirs.images, p.image_file))) throw httpError(404, "Upload the photo again.");
  return p;
}
function roomForAvatar(seller) {
  if (db.prepare("SELECT COUNT(*) AS n FROM avatars WHERE seller_id = ? AND status != 'failed'").get(seller.id).n >= MAX_AVATARS) throw httpError(400, `You can keep up to ${MAX_AVATARS} avatars. Delete one to make another.`);
}
/** "Use my photo": the photo itself becomes the avatar. No AI step, so it's ready at once and free. */
export function fromPhoto(account, seller, b = {}) {
  if (b.consent !== true) throw httpError(400, CONSENT.photo);
  const photo = stagedPhoto(seller, b.photo);
  const name = clean(b.name, 30) || "Me";
  roomForAvatar(seller);
  const id = newId("avt");
  db.prepare("INSERT INTO avatars (id, seller_id, account_id, name, style, source, status, image_file, consent_at) VALUES (?,?,?,?,?,?,?,?,datetime('now'))")
    .run(id, seller.id, account.id, name, "photo", "photo", "done", photo.image_file);
  db.prepare("INSERT OR IGNORE INTO seller_media (image_file, seller_id) VALUES (?,?)").run(photo.image_file, seller.id);
  dropPhoto(photo, true);
  return avatarView(getAvatar(seller, id));
}
/* ---------- blends: plan the new face with Claude, then make it ---------- */
// Image models asked to "mix" two faces tend to paste half of each (a split face, two skin tones).
// So Claude first decides what the one new person looks like, feature by feature, with a single
// skin tone, and the image model is given that exact description along with both photos.
const PLAN_PROMPT = (mix) => `Photo 1 and photo 2 show two different adults. An image AI will create ONE new, believable person who is a natural blend of both, ${mix.prompt}. Decide what that one new person looks like, so the image AI draws a single consistent face instead of pasting the two together. Judge each person's true skin color, not shadows, filters or lighting. Do not name or identify anyone.
Answer with this JSON object (each value one short phrase):
{"subject": "woman", "man" or "person",
 "skin_tone": ONE specific, even skin tone for the new person, between the two people's tones according to the mix (for example "warm light golden-brown with neutral undertones"),
 "face": face shape, cheekbones, jawline and chin,
 "eyes": eye shape, size and color, and eyebrows,
 "nose": nose shape,
 "lips": lip shape and fullness,
 "hair": hair color, texture, length and style,
 "age": apparent adult age range, like "late 20s",
 "extras": makeup and any jewelry worth keeping, or ""}`;
let plannerImpl = null;
/** Tests: replace Claude's blend plan. */
export function setBlendPlanner(f) { plannerImpl = f; }
async function planBlend(files, mix) {
  const content = files.map((f) => ({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: fs.readFileSync(path.join(dirs.images, f)).toString("base64") } }));
  content.push({ type: "text", text: PLAN_PROMPT(mix) });
  try {
    const r = plannerImpl ? await plannerImpl(content) : await askJson(content, 700);
    const out = {};
    for (const k of ["subject", "skin_tone", "face", "eyes", "nose", "lips", "hair", "age", "extras"]) out[k] = clean(r?.[k], 160);
    if (!["woman", "man", "person"].includes(out.subject)) out.subject = "person";
    return out.skin_tone ? out : null;
  } catch (e) { console.warn("[avatars] blend plan", e.message); return null; }
}
function blendPrompt(mix, look, plan) {
  const who = plan?.subject || "person";
  const looks = plan ? [
    `Skin: ${plan.skin_tone}, one even, uniform tone across the whole face, neck, shoulders and arms.`,
    plan.face && `Face: ${plan.face}.`, plan.eyes && `Eyes: ${plan.eyes}.`, plan.nose && `Nose: ${plan.nose}.`, plan.lips && `Lips: ${plan.lips}.`,
    plan.hair && `Hair: ${plan.hair}.`, plan.age && `Apparent age: ${plan.age}.`, plan.extras && `Also: ${plan.extras}.`,
  ].filter(Boolean).join(" ") : "Skin: one even, uniform tone across the whole face, neck, shoulders and arms, in between the two people's skin tones.";
  return `Create a brand-new photorealistic portrait photo of one adult ${who}. This ${who} is a natural blend of the two people in the reference images, ${mix.prompt}: like a sibling who shares features of both, but clearly their own person and not a copy of either. `
    + `${looks} ${look ? `Styling: ${look}. ` : ""}`
    + "Head and shoulders to half-body, centered, facing the camera with a relaxed, natural expression. Soft, even studio light from the front so both sides of the face match. Plain light background, sharp focus, true-to-life skin texture. "
    + `Never split or halve the face: no two-tone skin, no seam or color change down the middle, no mirroring, no collage, no two faces side by side. One person only. ${NO_TEXT}`;
}
async function submitBlend(id, step) {
  const row = db.prepare("SELECT * FROM avatars WHERE id = ?").get(id);
  const engine = BLENDERS[step];
  // A blend sends its two uploaded photos (deleted afterwards); a new outfit sends the avatar it starts from (kept).
  const images = JSON.parse(row.src_files || row.ref_files).map(img);
  const r = await aimedia.runpod(`${engine.id()}/run`, { input: engine.input(images, row.gen_prompt) });
  db.prepare("UPDATE avatars SET status='running', runpod_id=?, engine=?, updated_at=datetime('now') WHERE id=?").run(r.id, engine.id(), id);
}
/** "Blend": two photos of two adults become one new person. Uses the AI photo allowance, like other avatars. */
export async function blend(account, seller, b = {}) {
  if (b.consent !== true) throw httpError(400, CONSENT.blend);
  const ids = Array.isArray(b.photos) ? b.photos.map(String) : [];
  if (ids.length !== 2 || ids[0] === ids[1]) throw httpError(400, "Add two different photos to blend.");
  const [p1, p2] = ids.map((x) => stagedPhoto(seller, x));
  const mix = MIXES.find((m) => m.id === (b.mix || "even"));
  if (!mix) throw httpError(400, "Pick how to mix the two photos.");
  const name = clean(b.name, 30) || "Blend";
  const look = clean(b.look, 200);
  if (asksForLikeness(`${name} ${look}`)) throw httpError(400, "Describe the styling (outfit, hair, background) without naming a real person.");
  roomForAvatar(seller);
  if (!aimedia.enabled()) throw httpError(503, "AI avatars aren't switched on yet.");
  plans.assertAllowance(account, KIND);
  const id = newId("avt");
  db.prepare("INSERT INTO avatars (id, seller_id, account_id, name, style, look, source, consent_at, src_files) VALUES (?,?,?,?,?,?,?,datetime('now'),?)")
    .run(id, seller.id, account.id, name, "blend", look, "blend", JSON.stringify([p1.image_file, p2.image_file]));
  dropPhoto(p1, true); dropPhoto(p2, true);   // the files now belong to this job and go when it ends
  plans.recordUsage(account, KIND);
  try {
    const plan = await planBlend([p1.image_file, p2.image_file], mix);
    db.prepare("UPDATE avatars SET gen_prompt = ? WHERE id = ?").run(blendPrompt(mix, look, plan), id);
    await submitBlend(id, 0);
  } catch (e) { fail("avatars", id, e.message); throw e; }
  return avatarView(getAvatar(seller, id));
}
/* ---------- a new outfit for an avatar ---------- */
function outfitPrompt(style, look) {
  if (style.real) {
    return "Image 1 shows a person. Create a new photo of the exact same person: the same face, facial features, skin tone, hair and body, unchanged and instantly recognisable. "
      + `Change only the clothing: they are now wearing ${look}. The clothing is fully visible and covers the torso. `
      + `Same framing as image 1 (head and shoulders to half-body), centered, facing the camera with a relaxed, natural expression. Soft, even studio light, plain light background, photorealistic, sharp focus. One person only. ${NO_TEXT}`;
  }
  return `Image 1 shows a brand character. Create a new image of the exact same character (same design, face, colors and proportions), now wearing ${look}. ${style.keep} `
    + `Half-body, centered, facing the viewer, plain soft gradient background, same art style as image 1. ${ORIGINAL} ${NO_TEXT}`;
}
/**
 * The same avatar in different clothes, as a new avatar (the original stays). Uses the AI photo
 * allowance like other avatars. Real-person avatars keep their face; characters keep their design.
 */
export async function restyle(account, seller, id, b = {}) {
  const from = getAvatar(seller, id);
  if (from.status !== "done" || !from.image_file || !fs.existsSync(path.join(dirs.images, from.image_file))) throw httpError(409, "This avatar isn't ready yet.");
  const look = clean(b.look, 240);
  if (look.length < 3) throw httpError(400, "Describe the outfit, like \"a fitted cream blazer over a black top\".");
  if (asksForLikeness(look)) throw httpError(400, "Describe the clothes without naming a real person.");
  const style = STYLES.find((s) => s.id === from.style) || STYLES[0];
  if (style.id === "hands" || style.id === "silhouette") throw httpError(400, "This style shows no outfit to change. Make a new avatar instead.");
  roomForAvatar(seller);
  if (!aimedia.enabled()) throw httpError(503, "AI avatars aren't switched on yet.");
  plans.assertAllowance(account, KIND);
  const newId_ = newId("avt");
  const name = clean(b.name, 30) || `${from.name.replace(/\s*\(new look\)$/i, "").slice(0, 19)} (new look)`;
  db.prepare("INSERT INTO avatars (id, seller_id, account_id, name, style, look, source, consent_at, ref_files, gen_prompt) VALUES (?,?,?,?,?,?,?,?,?,?)")
    .run(newId_, seller.id, account.id, name, from.style, look, from.source || "ai", from.consent_at, JSON.stringify([from.image_file]), outfitPrompt(style, look));
  plans.recordUsage(account, KIND);
  try { await submitBlend(newId_, 0); } catch (e) { fail("avatars", newId_, e.message); throw e; }
  return avatarView(getAvatar(seller, newId_));
}

/** Delete a blend's two source photos once it's finished either way. */
function dropSources(id) {
  const row = db.prepare("SELECT src_files FROM avatars WHERE id = ?").get(id);
  if (!row?.src_files) return;
  for (const f of JSON.parse(row.src_files)) fs.rmSync(path.join(dirs.images, f), { force: true });
  db.prepare("UPDATE avatars SET src_files = NULL WHERE id = ?").run(id);
}

/* ---------- putting an avatar in a post or story photo ---------- */
function shotPrompt(style, pose, custom) {
  const action = pose ? pose.prompt : custom;
  const who = style.real
    ? "Image 1 shows a person. Image 2 shows a product. Create one new photo of the exact person from image 1 (same face, hair, skin tone and build)"
    : "Image 1 shows a brand character. Image 2 shows a product. Create one new photo of the exact character from image 1 (same design, outfit, colors and proportions)";
  return `${who} ${action}, with the exact product from image 2. `
    + `Keep the product exactly as it is: same shape, colors, logo, label and any text. ${style.keep} `
    + `Vertical social media composition with some calm space near the top for a headline. ${style.real ? "" : `${ORIGINAL} `}${NO_TEXT}`;
}
export async function shoot(account, seller, b = {}) {
  const avatar = getAvatar(seller, b.avatar_id);
  if (avatar.status !== "done" || !avatar.image_file) throw httpError(409, "This avatar isn't ready yet.");
  const style = STYLES.find((s) => s.id === avatar.style) || STYLES[0];
  const row = b.product_id && db.prepare("SELECT * FROM products WHERE id = ? AND seller_id = ?").get(String(b.product_id), seller.id);
  if (!row) throw httpError(404, "Pick one of your products.");
  const product = rowToProduct(row);
  if (!row.image_file || !ownsSellerImage(seller.id, row.image_file) || !fs.existsSync(path.join(dirs.images, row.image_file))) throw httpError(400, "This product needs a photo first.");
  const pose = b.pose ? POSES.find((p) => p.id === b.pose) : null;
  if (b.pose && !pose) throw httpError(400, "That pose isn't available.");
  const custom = clean(b.prompt, 200);
  if (!pose && custom.length < 3) throw httpError(400, "Pick a pose or describe the shot.");
  if (asksForLikeness(custom)) throw httpError(400, "Describe the scene, not a real person.");
  if (!aimedia.enabled()) throw httpError(503, "AI avatars aren't switched on yet.");
  const eng = aimedia.PHOTO_ENGINES.find((e) => e.id === (b.engine || "standard"));
  if (!eng) throw httpError(400, "That photo engine isn't available.");
  const premium = Boolean(eng.usd);
  if (!premium) plans.assertAllowance(account, KIND);   // premium engines are paid with credits instead
  const prompt = shotPrompt(style, pose, custom);
  const id = newId("shot");
  if (premium) credits.spend(account, aimedia.photoEnginePrice(eng), id, `${eng.name} avatar photo`);
  db.prepare("INSERT INTO avatar_shots (id, seller_id, account_id, avatar_id, product_id, pose, prompt, engine) VALUES (?,?,?,?,?,?,?,?)")
    .run(id, seller.id, account.id, avatar.id, product.id, pose?.id || "custom", prompt, premium ? eng.endpoint() : null);
  if (!premium) plans.recordUsage(account, KIND);
  try {
    const images = [`${config.publicUrl}/img/${avatar.image_file}`, `${config.publicUrl}/img/${row.image_file}`];
    const r = premium ? await aimedia.runpod(`${eng.endpoint()}/run`, { input: { ...eng.input(images[0], prompt), images } })
      : await aimedia.runpod(`${EDIT}/run`, { input: { images, prompt, size: "1024*1280", output_format: "jpeg", seed: -1 } });
    db.prepare("UPDATE avatar_shots SET status='running', runpod_id=?, updated_at=datetime('now') WHERE id=?").run(r.id, id);
  } catch (e) { fail("avatar_shots", id, e.message); throw e; }
  return shotView(db.prepare("SELECT * FROM avatar_shots WHERE id = ?").get(id));
}

/* ---------- background checks ---------- */
const TABLES = { avatars: T2I, avatar_shots: EDIT };
function fail(table, id, message) {
  const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
  if (!row || row.status === "failed") return;
  db.prepare(`UPDATE ${table} SET status='failed', error=?, updated_at=datetime('now') WHERE id=?`).run(String(message).slice(0, 300), id);
  // Shots on a premium engine were paid with credits; everything else used the plan's allowance.
  if (table === "avatar_shots" && row.engine) credits.refund(id);
  else plans.refundUsage(plans.getAccount(row.account_id), KIND);
  if (table === "avatars") dropSources(id);
}
const tooOld = (row) => Date.now() - Date.parse(`${String(row.created_at).replace(" ", "T")}Z`) > 15 * 60_000;
/** Check running avatars and shots; save finished images as the store's own (AI-marked) photos. */
export async function poll({ table = null, id = null } = {}) {
  // Photos uploaded for an avatar but never used go after a day.
  if (!id) for (const p of db.prepare(`SELECT * FROM avatar_photos WHERE created_at < datetime('now', '-${STAGED_KEEP_HOURS} hours')`).all()) dropPhoto(p);
  for (const [t, endpoint] of Object.entries(TABLES)) {
    if (table && t !== table) continue;
    const rows = id ? db.prepare(`SELECT * FROM ${t} WHERE id = ? AND status = 'running'`).all(id)
      : db.prepare(`SELECT * FROM ${t} WHERE status = 'running' ORDER BY created_at LIMIT 20`).all();
    for (const row of rows) {
      try {
        // A blend is made by the photo editor, not text-to-image, so it's checked there.
        // Blends run on the photo models (older ones on Qwen Image Edit), not text-to-image.
        // New outfits run on the photo models too (they record which one).
        const blending = t === "avatars" && (row.source === "blend" || Boolean(row.engine));
        const r = await aimedia.runpod(`${row.engine ? row.engine : blending ? EDIT : endpoint}/status/${row.runpod_id}`);
        if (r.status === "COMPLETED") {
          const url = aimedia.resultUrl(r.output, "scene");
          if (!url) { console.warn("[avatars]", row.id, "finished without an image:", JSON.stringify(r).slice(0, 400)); fail(t, row.id, "The AI finished but didn't send the image back. Try again."); continue; }
          const res = await aimedia.download(url);
          if (!res.ok) throw new Error(`download ${res.status}`);
          const name = `${crypto.randomUUID()}.jpg`;
          let bytes = Buffer.from(await res.arrayBuffer());
          // Some models send PNG; files here are saved as JPEG.
          if (sniffImage(bytes) !== "image/jpeg") bytes = await sharp(bytes).flatten({ background: "#ffffff" }).jpeg({ quality: 92 }).toBuffer();
          fs.writeFileSync(path.join(dirs.images, name), bytes);
          aimedia.markAi(name);
          db.prepare("INSERT OR IGNORE INTO seller_media (image_file, seller_id) VALUES (?,?)").run(name, row.seller_id);
          db.prepare(`UPDATE ${t} SET status='done', image_file=?, updated_at=datetime('now') WHERE id=? AND status='running'`).run(name, row.id);
          if (t === "avatars") dropSources(row.id);
        } else if (["FAILED", "CANCELLED", "TIMED_OUT"].includes(r.status)) {
          console.warn("[avatars]", row.id, r.status, JSON.stringify(r.error || r.output || "").slice(0, 400));
          // A blend the first model refused or failed gets one more try on the backup model.
          const step = blending ? BLENDERS.findIndex((b) => b.id() === row.engine) : -1;
          if (step >= 0 && step + 1 < BLENDERS.length && (row.src_files || row.ref_files) && row.gen_prompt) {
            try { await submitBlend(row.id, step + 1); continue; } catch (e) { console.warn("[avatars] blend backup", row.id, e.message); }
          }
          fail(t, row.id, t === "avatars" ? (row.ref_files ? "The AI couldn't change the outfit. Try describing it differently." : row.source === "blend" ? "The AI couldn't blend these photos. Try two clear, front-facing photos." : "The AI couldn't make this avatar. Try a different description.") : "The AI couldn't make this shot. Try another pose or product photo.");
        } else if (tooOld(row)) fail(t, row.id, "This took too long. Try again.");
      } catch (e) {
        console.warn("[avatars] poll", row.id, e.message);
        if (tooOld(row)) fail(t, row.id, "This took too long. Try again.");
      }
    }
  }
}

/* ---------- reading and deleting ---------- */
const img = (file) => (file ? `${config.publicUrl}/img/${file}` : null);
function getAvatar(seller, id) {
  const a = db.prepare("SELECT * FROM avatars WHERE id = ? AND seller_id = ?").get(String(id || ""), seller.id);
  if (!a) throw httpError(404, "That isn't one of your avatars.");
  return a;
}
const avatarView = (a) => ({ id: a.id, name: a.name, style: a.style, source: a.source || "ai", look: a.look, status: a.status, error: a.status === "failed" ? a.error : null, image_url: img(a.image_file), created_at: a.created_at, ai_generated: a.source !== "photo" });
const shotView = (s) => ({ id: s.id, avatar_id: s.avatar_id, product_id: s.product_id, pose: s.pose, status: s.status, error: s.status === "failed" ? s.error : null, image_url: img(s.image_file), created_at: s.created_at, ai_generated: true });

export function overview(seller) {
  return {
    ...presets(),
    avatars: db.prepare("SELECT * FROM avatars WHERE seller_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 30").all(seller.id).map(avatarView),
    shots: db.prepare("SELECT * FROM avatar_shots WHERE seller_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 40").all(seller.id).map(shotView),
  };
}
export async function avatar(seller, id) {
  getAvatar(seller, id);
  await poll({ table: "avatars", id: String(id) }).catch(() => {});
  return avatarView(getAvatar(seller, id));
}
export async function shot(seller, id) {
  const find = () => db.prepare("SELECT * FROM avatar_shots WHERE id = ? AND seller_id = ?").get(String(id || ""), seller.id);
  if (!find()) throw httpError(404, "That isn't one of your avatar shots.");
  await poll({ table: "avatar_shots", id: String(id) }).catch(() => {});
  return shotView(find());
}
/** Delete an avatar and its shots. Photos already used in posts or products stay where they are. */
/** Whether Snapfront's Academy lessons are taught by this avatar (it can't be deleted while they are). */
function teachesAcademy(id) {
  try {
    const s = JSON.parse(db.prepare("SELECT value FROM app_settings WHERE key = 'academy_presenter'").get()?.value || "null");
    return Boolean(s && (s.avatar_id === id || Object.values(s.per_lesson || {}).some((x) => x?.avatar_id === id)));
  } catch { return false; }
}
export function remove(seller, id) {
  const a = getAvatar(seller, id);
  if (teachesAcademy(a.id)) throw httpError(409, "This avatar teaches Academy lessons. Choose another presenter for those lessons first (Academy, Lesson presenter), then delete it.");
  dropSources(a.id);
  // A seller's own photo is theirs: deleting the avatar deletes the photo too.
  if (a.source === "photo" && a.image_file) {
    db.prepare("DELETE FROM seller_media WHERE image_file = ? AND seller_id = ?").run(a.image_file, seller.id);
    fs.rmSync(path.join(dirs.images, a.image_file), { force: true });
  }
  db.prepare("DELETE FROM avatar_shots WHERE avatar_id = ? AND seller_id = ?").run(String(id), seller.id);
  db.prepare("DELETE FROM avatars WHERE id = ? AND seller_id = ?").run(String(id), seller.id);
}

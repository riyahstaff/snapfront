// Faceless avatars: an original AI character that fronts a seller's posts and stories, so they
// never have to be on camera. Two steps, both on Runpod's public endpoints:
//   1. Create the avatar (Qwen Image, text to image) from a style and a short description.
//   2. Put it in a shot with one of the seller's products (Qwen Image Edit 2511, avatar + product
//      photo in, one 4:5 photo out). Shots are owned store photos, so Marketing can turn them into
//      posts, stories, carousels and reels with the usual designs.
// Avatars are always original characters: descriptions that ask for a real or famous person's
// likeness are refused, and every prompt tells the model not to resemble anyone. Results are marked
// as AI images, like the other AI photos, so the store can say so.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { config, dirs } from "./config.js";
import { db, newId, rowToProduct } from "./db.js";
import { httpError } from "./claude.js";
import * as plans from "./plans.js";
import * as aimedia from "./aimedia.js";
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
`);

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
const LIKENESS_NAMED = /\b(?:[Ll]ook(?:s|ing)?|[Ss]tyled)\s+(?:just\s+|exactly\s+)?(?:like|as)\s+[A-Z][a-z]+/;
export const asksForLikeness = (text) => LIKENESS_WORDS.test(text) || LIKENESS_NAMED.test(text);

const clean = (s, n) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);
export const presets = () => ({
  enabled: aimedia.enabled(), max_avatars: MAX_AVATARS,
  styles: STYLES.map(({ id, name, blurb }) => ({ id, name, blurb })),
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

/* ---------- putting an avatar in a post or story photo ---------- */
function shotPrompt(style, pose, custom) {
  const action = pose ? pose.prompt : custom;
  return `Image 1 shows a brand character. Image 2 shows a product. Create one new photo of the exact character from image 1 (same design, outfit, colors and proportions) ${action}, with the exact product from image 2. `
    + `Keep the product exactly as it is: same shape, colors, logo, label and any text. ${style.keep} `
    + `Vertical social media composition with some calm space near the top for a headline. ${ORIGINAL} ${NO_TEXT}`;
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
  plans.assertAllowance(account, KIND);
  const prompt = shotPrompt(style, pose, custom);
  const id = newId("shot");
  db.prepare("INSERT INTO avatar_shots (id, seller_id, account_id, avatar_id, product_id, pose, prompt) VALUES (?,?,?,?,?,?,?)")
    .run(id, seller.id, account.id, avatar.id, product.id, pose?.id || "custom", prompt);
  plans.recordUsage(account, KIND);
  try {
    const images = [`${config.publicUrl}/img/${avatar.image_file}`, `${config.publicUrl}/img/${row.image_file}`];
    const r = await aimedia.runpod(`${EDIT}/run`, { input: { images, prompt, size: "1024*1280", output_format: "jpeg", seed: -1 } });
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
  plans.refundUsage(plans.getAccount(row.account_id), KIND);
}
const tooOld = (row) => Date.now() - Date.parse(`${String(row.created_at).replace(" ", "T")}Z`) > 15 * 60_000;
/** Check running avatars and shots; save finished images as the store's own (AI-marked) photos. */
export async function poll({ table = null, id = null } = {}) {
  for (const [t, endpoint] of Object.entries(TABLES)) {
    if (table && t !== table) continue;
    const rows = id ? db.prepare(`SELECT * FROM ${t} WHERE id = ? AND status = 'running'`).all(id)
      : db.prepare(`SELECT * FROM ${t} WHERE status = 'running' ORDER BY created_at LIMIT 20`).all();
    for (const row of rows) {
      try {
        const r = await aimedia.runpod(`${endpoint}/status/${row.runpod_id}`);
        if (r.status === "COMPLETED") {
          const url = aimedia.resultUrl(r.output, "scene");
          if (!url) { console.warn("[avatars]", row.id, "finished without an image:", JSON.stringify(r).slice(0, 400)); fail(t, row.id, "The AI finished but didn't send the image back. Try again."); continue; }
          const res = await aimedia.download(url);
          if (!res.ok) throw new Error(`download ${res.status}`);
          const name = `${crypto.randomUUID()}.jpg`;
          fs.writeFileSync(path.join(dirs.images, name), Buffer.from(await res.arrayBuffer()));
          aimedia.markAi(name);
          db.prepare("INSERT OR IGNORE INTO seller_media (image_file, seller_id) VALUES (?,?)").run(name, row.seller_id);
          db.prepare(`UPDATE ${t} SET status='done', image_file=?, updated_at=datetime('now') WHERE id=? AND status='running'`).run(name, row.id);
        } else if (["FAILED", "CANCELLED", "TIMED_OUT"].includes(r.status)) {
          console.warn("[avatars]", row.id, r.status, JSON.stringify(r.error || r.output || "").slice(0, 400));
          fail(t, row.id, t === "avatars" ? "The AI couldn't make this avatar. Try a different description." : "The AI couldn't make this shot. Try another pose or product photo.");
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
const avatarView = (a) => ({ id: a.id, name: a.name, style: a.style, look: a.look, status: a.status, error: a.status === "failed" ? a.error : null, image_url: img(a.image_file), created_at: a.created_at, ai_generated: true });
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
export function remove(seller, id) {
  getAvatar(seller, id);
  db.prepare("DELETE FROM avatar_shots WHERE avatar_id = ? AND seller_id = ?").run(String(id), seller.id);
  db.prepare("DELETE FROM avatars WHERE id = ? AND seller_id = ?").run(String(id), seller.id);
}

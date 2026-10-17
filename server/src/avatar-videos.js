// Avatar videos, paid with credits: a finished avatar photo (the avatar with a product) becomes a
// short vertical video, or the avatar talks, lip-synced to a script read by Snapfront's own voice.
// The best video models on Runpod's public endpoints:
//   Vidu Q3 (image-to-video):     smooth motion that keeps the photo's look, optional music. Fast and affordable.
//   Seedance 2.5 (image-to-video): highest quality, optional sound and music. 9:16, 720p or 1080p.
//   Sora 2 Pro (image-to-video):   OpenAI's model, with sound and dialogue. Follows the photo's shape.
//   InfiniteTalk (talking avatar): the avatar speaks a script read by Kokoro (free, on our server).
// Wan 2.6 is left out: Runpod lists only horizontal sizes for it. Kling is left out: Runpod's Kling O1
// now requires a reference video and its image-to-video Kling was retired.
// Words come only from our own voiceover (Kokoro, mixed in with ffmpeg after the video is made); the
// models are told nobody speaks, because their own invented speech comes out as gibberish.
// Prices come from the provider's per-second (or per-video) cost, turned into credits by
// credits.creditsFor. Credits are spent when a video starts and refunded if it fails.
// Endpoint ids can be changed without a code change: RUNPOD_EP_KLING, _SEEDANCE, _SORA, _TALK.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { config, dirs } from "./config.js";
import { db, newId } from "./db.js";
import { httpError } from "./claude.js";
import * as aimedia from "./aimedia.js";
import * as credits from "./credits.js";
import { STYLES, asksForLikeness } from "./avatars.js";
import { spawn } from "node:child_process";
import ffmpegPath from "ffmpeg-static";
import { speak, wav, VOICES } from "./narrated.js";
import * as elevenlabs from "./elevenlabs.js";

db.exec(`
CREATE TABLE IF NOT EXISTS avatar_videos (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  avatar_id TEXT REFERENCES avatars(id) ON DELETE SET NULL,
  shot_id TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('motion','talk')),
  model TEXT NOT NULL,
  duration INTEGER,
  resolution TEXT NOT NULL,
  sound INTEGER NOT NULL DEFAULT 0,
  prompt TEXT NOT NULL,
  script TEXT,
  voice TEXT,
  credits INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','done','failed')),
  runpod_id TEXT,
  audio_file TEXT,
  file TEXT,
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS avatar_videos_seller ON avatar_videos (seller_id, created_at);
`);
// Motion videos with a voiceover: "ai" while the model works, then "voice" while our voice is mixed in.
for (const [col, def] of [["stage", "TEXT NOT NULL DEFAULT 'ai'"], ["raw_file", "TEXT"], ["note", "TEXT"], ["voice_credits", "INTEGER NOT NULL DEFAULT 0"]]) {
  if (!db.prepare("PRAGMA table_info(avatar_videos)").all().some((c) => c.name === col)) db.exec(`ALTER TABLE avatar_videos ADD COLUMN ${col} ${def}`);
}

const ep = (env, fallback) => (process.env[env] || fallback).trim();
const NO_TEXT = "No on-screen text, captions, subtitles, logos or watermarks.";
export const MODELS = [
  { id: "vidu", name: "Vidu Q3", badge: "Fast and affordable", blurb: "Smooth, natural motion that keeps your photo's look, with optional background music. Up to 1080p.",
    endpoint: () => ep("RUNPOD_EP_VIDU", "vidu-q3-i2v"), durations: [5, 10], resolutions: ["720p", "1080p"], sound: "optional", usd: (d) => 0.15 * d,
    input: ({ image, prompt, duration, resolution, sound }) => ({ prompt, image, duration, resolution, movement_amplitude: "auto", generate_audio: sound, bgm: sound, seed: -1 }) },
  { id: "seedance", name: "Seedance 2.5", badge: "Best quality", blurb: "The most cinematic motion, with sound and music made for the clip. Up to 1080p.",
    endpoint: () => ep("RUNPOD_EP_SEEDANCE", "16jsvx5ncmm24x"), durations: [5, 10], resolutions: ["720p", "1080p"], sound: "optional", usd: (d, r) => (r === "1080p" ? 0.9 : 0.36) * d,
    input: ({ image, prompt, duration, resolution, sound }) => ({ prompt, image, duration, resolution, aspect_ratio: "9:16", generate_audio: sound, seed: -1 }) },
  { id: "sora", name: "Sora 2 Pro", badge: "Most lifelike", blurb: "OpenAI's top model. The most natural acting, with ambient sound. Keeps your photo's framing.",
    endpoint: () => ep("RUNPOD_EP_SORA", "sora-2-pro-i2v"), durations: [4, 8, 12], resolutions: ["720p", "1080p"], sound: "always", usd: (d, r) => (r === "1080p" ? 0.5 : 0.3) * d,
    input: ({ image, prompt, duration, resolution }) => ({ prompt, image, duration, size: resolution }) },
];
// Retired models still name their old videos.
const OLD_NAMES = { kling: "Kling O1" };
/** About how many characters of voiceover fit a video of this length (Kokoro speaks ~15 a second). */
export const voiceoverChars = (seconds) => Math.max(40, Math.floor(seconds * 15));
export const TALK = { id: "talk", name: "InfiniteTalk", endpoint: () => ep("RUNPOD_EP_TALK", "infinitetalk"), resolutions: ["480p", "720p"], usd: (r) => (r === "720p" ? 0.5 : 0.25), max_chars: 450 };
// Styles with a face that can lip-sync. The others are faceless by design.
const TALKING_STYLES = new Set(["soft3d", "illustrated", "mascot"]);
export const MOTIONS = [
  { id: "showcase", name: "Show it off", prompt: "the character slowly turns the product toward the camera to show it off, then gives a confident nod" },
  { id: "unbox", name: "Unboxing", prompt: "the character opens the packaging and lifts the product out with a delighted reaction" },
  { id: "walk", name: "Walk-in", prompt: "the character walks toward the camera holding the product with a natural, confident stride" },
  { id: "demo", name: "Using it", prompt: "the character uses the product naturally, showing how it works" },
  { id: "react", name: "Reaction", prompt: "the character looks at the product, then back at the camera with an excited, genuine reaction" },
];

export const priceOf = (model, duration, resolution) => credits.creditsFor(model.usd(duration, resolution));
export const talkPrice = (resolution) => credits.creditsFor(TALK.usd(resolution));
const MAX_RUNNING = 3;
const clean = (s, n) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);
const img = (file) => `${config.publicUrl}/img/${file}`;

const freeVoices = () => VOICES.map(({ id, name, accent }) => ({ id, name, accent, premium: false }));
export async function options(account) {
  const premium = elevenlabs.enabled() ? await elevenlabs.voices() : [];
  const voices = [...freeVoices(), ...premium];
  return {
    enabled: aimedia.enabled(),
    balance: credits.balance(account.id),
    free: credits.isOwner(account),
    models: MODELS.map((m) => ({ id: m.id, name: m.name, badge: m.badge, blurb: m.blurb, durations: m.durations, resolutions: m.resolutions, sound: m.sound,
      prices: Object.fromEntries(m.durations.flatMap((d) => m.resolutions.map((r) => [`${d}|${r}`, priceOf(m, d, r)]))) })),
    talk: { resolutions: TALK.resolutions, prices: Object.fromEntries(TALK.resolutions.map((r) => [r, talkPrice(r)])), max_chars: TALK.max_chars,
      styles: [...TALKING_STYLES], voices },
    motions: MOTIONS.map(({ id, name }) => ({ id, name })),
    voiceover: { chars_per_second: 15, voices },
    // Premium (ElevenLabs) voices cost extra: this many credits for a given script length.
    premium_voice: premium.length ? { name: "ElevenLabs", per_1k_chars: elevenlabs.ratePer1k(), min: 5, step: 5 } : null,
  };
}
/** Check a chosen voice: a free one, or a premium voice that's on sale. Returns { voice, extra }. */
async function pickVoice(id, text) {
  if (elevenlabs.isPremium(id)) {
    if (!(await elevenlabs.isOnSale(id))) throw httpError(400, "That premium voice isn't available. Pick another voice.");
    return { voice: id, extra: elevenlabs.priceFor(text.length) };
  }
  return { voice: VOICES.some((v) => v.id === id) ? id : "af_heart", extra: 0 };
}

/* ---------- starting a video ---------- */
function source(seller, b) {
  // A motion video starts from a finished avatar photo (avatar + product). A talking video can also
  // start from the avatar's own portrait.
  if (b.shot_id) {
    const shot = db.prepare("SELECT * FROM avatar_shots WHERE id = ? AND seller_id = ?").get(String(b.shot_id), seller.id);
    if (!shot) throw httpError(404, "That isn't one of your avatar photos.");
    if (shot.status !== "done" || !shot.image_file) throw httpError(409, "That photo isn't ready yet.");
    const avatar = db.prepare("SELECT * FROM avatars WHERE id = ? AND seller_id = ?").get(shot.avatar_id, seller.id);
    if (!avatar) throw httpError(404, "That photo's avatar was deleted.");
    const product = shot.product_id ? db.prepare("SELECT image_file FROM products WHERE id = ? AND seller_id = ?").get(shot.product_id, seller.id) : null;
    return { shot, avatar, image: shot.image_file, product: product?.image_file || null };
  }
  if (b.avatar_id) {
    const avatar = db.prepare("SELECT * FROM avatars WHERE id = ? AND seller_id = ?").get(String(b.avatar_id), seller.id);
    if (!avatar) throw httpError(404, "That isn't one of your avatars.");
    if (avatar.status !== "done" || !avatar.image_file) throw httpError(409, "This avatar isn't ready yet.");
    return { shot: null, avatar, image: avatar.image_file, product: null };
  }
  throw httpError(400, "Pick one of your avatar photos.");
}
function busy(seller) {
  if (db.prepare("SELECT COUNT(*) AS n FROM avatar_videos WHERE seller_id = ? AND status IN ('queued','running')").get(seller.id).n >= MAX_RUNNING)
    throw httpError(429, `You have ${MAX_RUNNING} videos in progress. Wait for one to finish.`);
}

export async function start(account, seller, b = {}) {
  if (!aimedia.enabled()) throw httpError(503, "AI video isn't switched on yet.");
  return b.kind === "talk" ? startTalk(account, seller, b) : startMotion(account, seller, b);
}

async function startMotion(account, seller, b) {
  const model = MODELS.find((m) => m.id === b.model);
  if (!model) throw httpError(400, "Pick a video model.");
  const duration = Number(b.duration) || model.durations[0];
  if (!model.durations.includes(duration)) throw httpError(400, `${model.name} makes ${model.durations.join(", ")} second videos.`);
  const resolution = b.resolution || model.resolutions[0];
  if (!model.resolutions.includes(resolution)) throw httpError(400, `${model.name} makes ${model.resolutions.join(" or ")} videos.`);
  const src = source(seller, b);
  if (!src.shot) throw httpError(400, "Make a photo of your avatar with a product first, then turn it into a video.");
  const motion = b.motion ? MOTIONS.find((m) => m.id === b.motion) : null;
  if (b.motion && !motion) throw httpError(400, "That motion isn't available.");
  const custom = clean(b.prompt, 300);
  if (!motion && custom.length < 3) throw httpError(400, "Pick a motion or describe what happens.");
  if (asksForLikeness(custom)) throw httpError(400, "Describe what happens, not a real person.");
  const voiceover = clean(b.voiceover, voiceoverChars(duration));
  if (voiceover && voiceover.length < 4) throw httpError(400, "Write a little more for the voiceover, or leave it empty.");
  if (asksForLikeness(voiceover)) throw httpError(400, "Write the voiceover in your own words, not as a real person.");
  const { voice, extra } = voiceover ? await pickVoice(b.voice, voiceover) : { voice: null, extra: 0 };
  busy(seller);
  const style = STYLES.find((s) => s.id === src.avatar.style) || STYLES[0];
  const sound = model.sound === "always" ? true : model.sound === "optional" ? b.sound !== false : false;
  const prompt = `${motion ? motion.prompt : custom}. Keep the character exactly as in the reference image (same design, outfit and colors) and the product exactly as it is (same shape, colors, label and text). ${style.keep} `
    + `Smooth, natural motion for a vertical social media video. Nobody speaks: no dialogue, no voices, no narration, no singing. `
    + `${sound ? "Only background music and natural ambient sound. " : ""}${NO_TEXT}`;
  const price = priceOf(model, duration, resolution) + extra;
  const id = newId("vid");
  db.prepare(`INSERT INTO avatar_videos (id, seller_id, account_id, avatar_id, shot_id, kind, model, duration, resolution, sound, prompt, script, voice, credits, voice_credits)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(id, seller.id, account.id, src.avatar.id, src.shot.id, "motion", model.id, duration, resolution, sound ? 1 : 0, prompt, voiceover || null, voice, price, extra);
  try { credits.spend(account, price, id, `${model.name} video, ${duration}s ${resolution}${extra ? " + premium voice" : ""}`); }
  catch (e) { db.prepare("DELETE FROM avatar_videos WHERE id = ?").run(id); throw e; }
  const images = [img(src.image), img(src.avatar.image_file), ...(src.product ? [img(src.product)] : [])];
  try {
    const r = await aimedia.runpod(`${model.endpoint()}/run`, { input: model.input({ image: img(src.image), images, prompt, duration, resolution, sound }) });
    db.prepare("UPDATE avatar_videos SET status='running', runpod_id=?, updated_at=datetime('now') WHERE id=?").run(r.id, id);
  } catch (e) { fail(id, e.message); throw e; }
  return view(get(seller, id));
}

async function startTalk(account, seller, b) {
  const resolution = b.resolution || "720p";
  if (!TALK.resolutions.includes(resolution)) throw httpError(400, "Pick 480p or 720p.");
  const src = source(seller, b);
  if (!TALKING_STYLES.has(src.avatar.style)) throw httpError(400, "This avatar is faceless by design, so it can't lip-sync. Talking works with Soft 3D, Illustrated and Mascot avatars.");
  const script = clean(b.script, TALK.max_chars);
  if (script.length < 8) throw httpError(400, "Write what your avatar should say.");
  if (asksForLikeness(script)) throw httpError(400, "Write the script in your avatar's own voice, not as a real person.");
  const { voice, extra } = await pickVoice(b.voice, script);
  busy(seller);
  const price = talkPrice(resolution) + extra;
  const id = newId("vid");
  const prompt = "The character speaks naturally to the camera with lively expressions and small, natural gestures, matching the voice. Keep the character exactly as in the image. " + NO_TEXT;
  db.prepare(`INSERT INTO avatar_videos (id, seller_id, account_id, avatar_id, shot_id, kind, model, resolution, sound, prompt, script, voice, credits, voice_credits)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(id, seller.id, account.id, src.avatar.id, src.shot?.id || null, "talk", "talk", resolution, 1, prompt, script, voice, price, extra);
  try { credits.spend(account, price, id, `Talking avatar, ${resolution}${extra ? " + premium voice" : ""}`); }
  catch (e) { db.prepare("DELETE FROM avatar_videos WHERE id = ?").run(id); throw e; }
  kick();
  return view(get(seller, id));
}

/* ---------- the voice, then the talking video (one at a time; the voice is CPU-bound) ---------- */
let working = false;
export function kick() {
  if (working) return;
  working = true;
  (async () => {
    try {
      for (;;) {
        const talk = db.prepare("SELECT * FROM avatar_videos WHERE kind = 'talk' AND status = 'queued' AND runpod_id IS NULL ORDER BY created_at LIMIT 1").get();
        if (talk) { await voiceAndSubmit(talk); continue; }
        const mix = db.prepare("SELECT * FROM avatar_videos WHERE kind = 'motion' AND status = 'running' AND stage = 'voice' ORDER BY updated_at LIMIT 1").get();
        if (mix) { await addVoiceover(mix); continue; }
        break;
      }
    } finally { working = false; }
  })().catch((e) => console.warn("[avatar-videos] voice worker", e.message));
}

/* ---------- the voice: premium (ElevenLabs) or free (Kokoro), written as a WAV ---------- */
/**
 * Read `row.script` into `outPath`. A premium voice that fails falls back to the free voice; its
 * extra credits come back and the video says so. Returns the voice length in seconds.
 */
async function makeVoice(row, outPath) {
  if (elevenlabs.isPremium(row.voice)) {
    try { return await elevenlabs.speakToWav(row.script, row.voice, outPath); }
    catch (e) {
      console.warn("[avatar-videos] premium voice", row.id, e.message);
      if (row.voice_credits) credits.refundPart(row.id, row.voice_credits, "Premium voice unavailable, so the free voice was used");
      db.prepare("UPDATE avatar_videos SET note = ? WHERE id = ?").run("The premium voice was unavailable, so Snapfront's free voice read it and the extra credits came back.", row.id);
    }
  }
  const spoken = await speak(row.script, elevenlabs.isPremium(row.voice) ? "af_heart" : (row.voice || "af_heart"));
  fs.writeFileSync(outPath, wav(spoken));
  return spoken.samples.length / spoken.rate;
}

/* ---------- voiceovers: our voice over the model's video ---------- */
function ffmpeg(args, timeout = 180_000) {
  return new Promise((resolve, reject) => {
    const p = spawn(ffmpegPath, args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => { err = (err + d).slice(-4000); });
    const t = setTimeout(() => { p.kill("SIGKILL"); reject(new Error("ffmpeg took too long")); }, timeout);
    p.on("close", (code) => { clearTimeout(t); resolve({ code, err }); });
    p.on("error", (e) => { clearTimeout(t); reject(e); });
  });
}
/** Mix a spoken voiceover into a video: the video's own music drops to a quarter, and the last frame holds if the voice runs longer. */
export async function mixVoiceover(videoPath, voicePath, voiceSeconds, outPath) {
  const probe = await ffmpeg(["-hide_banner", "-i", videoPath]);
  const hasAudio = /Stream #\S+.*Audio:/.test(probe.err);
  const dur = /Duration: (\d+):(\d+):([\d.]+)/.exec(probe.err);
  const videoSeconds = dur ? Number(dur[1]) * 3600 + Number(dur[2]) * 60 + Number(dur[3]) : 0;
  const hold = Math.max(0, voiceSeconds + 0.4 - videoSeconds);
  const v = hold > 0 ? `[0:v]tpad=stop_mode=clone:stop_duration=${hold.toFixed(2)}[v]` : "[0:v]null[v]";
  const a = hasAudio
    ? "[0:a]volume=0.25[m];[1:a]adelay=300|300,volume=1.0[s];[m][s]amix=inputs=2:duration=longest:normalize=0[a]"
    : "[1:a]adelay=300|300[a]";
  const r = await ffmpeg(["-y", "-hide_banner", "-loglevel", "error", "-i", videoPath, "-i", voicePath, "-filter_complex", `${v};${a}`,
    "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", outPath]);
  if (r.code !== 0) throw new Error(`mix failed: ${r.err.slice(-300)}`);
}
async function addVoiceover(row) {
  const raw = path.join(dirs.media, row.raw_file);
  const voicePath = path.join(dirs.media, `${crypto.randomUUID()}.wav`);
  const out = `${crypto.randomUUID()}.mp4`;
  try {
    const seconds = await makeVoice(row, voicePath);
    await mixVoiceover(raw, voicePath, seconds, path.join(dirs.media, out));
    db.prepare("UPDATE avatar_videos SET status='done', stage='done', file=?, updated_at=datetime('now') WHERE id=? AND status='running'").run(out, row.id);
    fs.rmSync(raw, { force: true });
  } catch (e) {
    // The video itself is fine: deliver it without the voiceover rather than lose it.
    console.warn("[avatar-videos] voiceover", row.id, e.message);
    if (row.voice_credits && elevenlabs.isPremium(row.voice)) credits.refundPart(row.id, row.voice_credits, "Voiceover couldn't be added");
    db.prepare("UPDATE avatar_videos SET status='done', stage='done', file=raw_file, note=?, updated_at=datetime('now') WHERE id=? AND status='running'")
      .run("The voiceover couldn't be added, so this is the video without it.", row.id);
  } finally { fs.rmSync(voicePath, { force: true }); }
}
async function voiceAndSubmit(row) {
  try {
    const name = `${crypto.randomUUID()}.wav`;
    await makeVoice(row, path.join(dirs.media, name));
    const src = row.shot_id ? db.prepare("SELECT image_file FROM avatar_shots WHERE id = ?").get(row.shot_id)?.image_file
      : db.prepare("SELECT image_file FROM avatars WHERE id = ?").get(row.avatar_id)?.image_file;
    if (!src) throw new Error("The avatar photo is gone.");
    const r = await aimedia.runpod(`${TALK.endpoint()}/run`, { input: { prompt: row.prompt, image: img(src), audio: `${config.publicUrl}/media/${name}`, size: row.resolution, enable_safety_checker: true } });
    db.prepare("UPDATE avatar_videos SET status='running', runpod_id=?, audio_file=?, updated_at=datetime('now') WHERE id=?").run(r.id, name, row.id);
  } catch (e) {
    console.warn("[avatar-videos] talk", row.id, e.message);
    fail(row.id, "We couldn't make the voice or start the video. Try again.");
  }
}

/* ---------- checking on videos ---------- */
function fail(id, message) {
  const row = db.prepare("SELECT * FROM avatar_videos WHERE id = ?").get(id);
  if (!row || row.status === "failed" || row.status === "done") return;
  db.prepare("UPDATE avatar_videos SET status='failed', error=?, updated_at=datetime('now') WHERE id=?").run(String(message).slice(0, 300), id);
  credits.refund(id);
}
const endpointOf = (row) => (row.kind === "talk" ? TALK.endpoint() : MODELS.find((m) => m.id === row.model)?.endpoint());
const minutesOld = (row) => (Date.now() - Date.parse(`${String(row.created_at).replace(" ", "T")}Z`)) / 60_000;
export async function poll(id = null) {
  // A motion video that never reached the AI (the server stopped mid-start): give the credits back.
  if (!id) for (const r of db.prepare("SELECT id FROM avatar_videos WHERE kind = 'motion' AND status = 'queued' AND runpod_id IS NULL AND created_at < datetime('now', '-10 minutes')").all()) fail(r.id, "This didn't start. Your credits are back.");
  const rows = id ? db.prepare("SELECT * FROM avatar_videos WHERE id = ? AND status = 'running' AND stage = 'ai'").all(id)
    : db.prepare("SELECT * FROM avatar_videos WHERE status = 'running' AND stage = 'ai' ORDER BY created_at LIMIT 20").all();
  for (const row of rows) {
    try {
      const endpoint = endpointOf(row);
      if (!endpoint) { fail(row.id, "This video model was retired. Your credits are back."); continue; }
      const r = await aimedia.runpod(`${endpoint}/status/${row.runpod_id}`);
      if (r.status === "COMPLETED") {
        const url = aimedia.resultUrl(r.output, "video");
        if (!url) { console.warn("[avatar-videos]", row.id, "no video link:", JSON.stringify(r).slice(0, 400)); fail(row.id, "The AI finished but didn't send the video back. Your credits are back."); continue; }
        const res = await aimedia.download(url, 180_000);
        if (!res.ok) throw new Error(`download ${res.status}`);
        const name = `${crypto.randomUUID()}.mp4`;
        fs.writeFileSync(path.join(dirs.media, name), Buffer.from(await res.arrayBuffer()));
        if (row.kind === "motion" && row.script) {
          db.prepare("UPDATE avatar_videos SET stage='voice', raw_file=?, updated_at=datetime('now') WHERE id=? AND status='running'").run(name, row.id);
          kick();
        } else {
          db.prepare("UPDATE avatar_videos SET status='done', stage='done', file=?, updated_at=datetime('now') WHERE id=? AND status='running'").run(name, row.id);
        }
        if (row.audio_file) fs.rmSync(path.join(dirs.media, row.audio_file), { force: true });
      } else if (["FAILED", "CANCELLED", "TIMED_OUT"].includes(r.status)) {
        console.warn("[avatar-videos]", row.id, r.status, JSON.stringify(r.error || r.output || "").slice(0, 400));
        fail(row.id, "The AI couldn't make this video. Your credits are back. Try another motion or photo.");
      } else if (minutesOld(row) > 40) fail(row.id, "This took too long. Your credits are back.");
    } catch (e) {
      console.warn("[avatar-videos] poll", row.id, e.message);
      if (minutesOld(row) > 40) fail(row.id, "This took too long. Your credits are back.");
    }
  }
}

/* ---------- reading and deleting ---------- */
function get(seller, id) {
  const v = db.prepare("SELECT * FROM avatar_videos WHERE id = ? AND seller_id = ?").get(String(id || ""), seller.id);
  if (!v) throw httpError(404, "That isn't one of your avatar videos.");
  return v;
}
const nameOf = (row) => (row.kind === "talk" ? TALK.name : MODELS.find((m) => m.id === row.model)?.name || OLD_NAMES[row.model] || row.model);
export const view = (v) => ({ id: v.id, kind: v.kind, model: v.model, model_name: nameOf(v), avatar_id: v.avatar_id, shot_id: v.shot_id, duration: v.duration, resolution: v.resolution,
  sound: Boolean(v.sound), script: v.script, voiceover: v.kind === "motion" && Boolean(v.script), premium_voice: elevenlabs.isPremium(v.voice), credits: v.credits, status: v.status,
  stage: v.status === "running" && v.stage === "voice" ? "voice" : null, error: v.status === "failed" ? v.error : null, note: v.note || null,
  url: v.file ? `${config.publicUrl}/media/${v.file}` : null, created_at: v.created_at, ai_generated: true });
export async function list(account, seller) {
  return { ...(await options(account)), videos: db.prepare("SELECT * FROM avatar_videos WHERE seller_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 40").all(seller.id).map(view) };
}
export async function one(seller, id) {
  get(seller, id);
  await poll(String(id)).catch(() => {});
  return view(get(seller, id));
}
export function remove(seller, id) {
  const v = get(seller, id);
  if (v.status === "queued" || v.status === "running") throw httpError(409, "Wait for this video to finish first.");
  db.prepare("DELETE FROM avatar_videos WHERE id = ?").run(v.id);
  if (v.file) fs.rmSync(path.join(dirs.media, v.file), { force: true });
}

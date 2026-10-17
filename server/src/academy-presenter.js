// Academy lessons taught by an avatar. The owner picks one of their own avatars (and a voice); each
// slide of a lesson is then read in that voice, the avatar lip-syncs it (InfiniteTalk on Runpod), and
// the slide is shown next to her. Slides that walk through the app show a phone screen recording of
// the real Snapfront app doing the step instead (tap, scroll, type), recorded with demo data by
// tools/academy-screens and uploaded here.
//
// Talking-head clips and voices are cached by their words, voice and avatar, so rebuilding a lesson
// only pays for slides that changed. Lessons opt in ("lessons": a list of ids, or "all"), so the owner
// can try one lesson before paying for all of them. Until a new video is ready the old one stays up.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import ffmpegPath from "ffmpeg-static";
import { config, dirs } from "./config.js";
import { db } from "./db.js";
import { httpError } from "./claude.js";
import * as aimedia from "./aimedia.js";
import * as credits from "./credits.js";
import * as elevenlabs from "./elevenlabs.js";
import { speak, wav, VOICES, pngFromSvg } from "./narrated.js";
import { TALK } from "./avatar-videos.js";
import { LESSONS } from "./academy-content.js";

db.exec("CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT (datetime('now')))");
const KEY = "academy_presenter";
// Avatars that can lip-sync (the faceless styles can't).
const TALKERS = new Set(["soft3d", "illustrated", "mascot", "photo", "blend"]);
export const W = 1280, H = 720;
// Where things sit on screen. The slide pictures leave room for these.
export const LAYOUT = {
  slide: { head: { x: 872, y: 150, w: 344, h: 430 } },
  screen: { phone: { x: 70, y: 30, w: 306, h: 660 }, head: { x: 944, y: 178, w: 288, h: 360 } },
};

/* ---------- settings ---------- */
export function settings() {
  try { return JSON.parse(db.prepare("SELECT value FROM app_settings WHERE key = ?").get(KEY)?.value || "null"); } catch { return null; }
}
const ownerAccountIds = () => db.prepare("SELECT id, email FROM accounts WHERE email IS NOT NULL").all().filter((a) => credits.isOwner(a)).map((a) => a.id);
/** The owner's avatars that can talk. */
export function ownerAvatars() {
  const ids = ownerAccountIds();
  if (!ids.length) return [];
  return db.prepare(`SELECT * FROM avatars WHERE account_id IN (${ids.map(() => "?").join(",")}) AND status = 'done' AND image_file IS NOT NULL ORDER BY created_at DESC`).all(...ids)
    .filter((a) => TALKERS.has(a.style) && fs.existsSync(path.join(dirs.images, a.image_file)));
}
/** The presenter avatar, if one is set and still exists. */
export function presenter() {
  const s = settings();
  if (!s?.avatar_id) return null;
  const avatar = ownerAvatars().find((a) => a.id === s.avatar_id);
  return avatar ? { avatar, voice: s.voice || "af_heart", lessons: s.lessons ?? [] } : null;
}
export function appliesTo(lessonId) {
  const p = presenter();
  return Boolean(p && (p.lessons === "all" || (Array.isArray(p.lessons) && p.lessons.includes(lessonId))));
}
async function voiceOk(id) {
  // The owner can use any voice in Snapfront's ElevenLabs account, including ones added from the library.
  if (elevenlabs.isPremium(id)) return (await elevenlabs.isOnSale(id)) || (await elevenlabs.accountVoices()).some((v) => v.id === id);
  return VOICES.some((v) => v.id === id);
}
export async function setSettings(b = {}) {
  const cur = settings() || {};
  const next = { ...cur };
  if (b.avatar_id !== undefined) {
    if (b.avatar_id && !ownerAvatars().some((a) => a.id === b.avatar_id)) throw httpError(400, "Pick one of your avatars that has a face (Soft 3D, Illustrated, Mascot, your photo or a blend).");
    next.avatar_id = b.avatar_id || null;
  }
  if (b.voice !== undefined) {
    if (!(await voiceOk(String(b.voice)))) throw httpError(400, "That voice isn't available.");
    next.voice = String(b.voice);
  }
  if (b.lessons !== undefined) {
    if (b.lessons === "all") next.lessons = "all";
    else if (Array.isArray(b.lessons)) {
      const ids = [...new Set(b.lessons.map(String))];
      if (ids.some((id) => !LESSONS.some((l) => l.id === id))) throw httpError(400, "One of those lessons doesn't exist.");
      next.lessons = ids;
    } else throw httpError(400, "lessons is a list of lesson ids, or \"all\".");
  }
  db.prepare("INSERT INTO app_settings (key, value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')").run(KEY, JSON.stringify(next));
  return next;
}

/* ---------- screen recordings (uploaded by tools/academy-screens) ---------- */
const root = () => path.join(config.dataDir, "academy");
const screensDir = () => path.join(root(), "screens");
const screenPath = (lessonId, n) => path.join(screensDir(), `${lessonId}-${n}.mp4`);
export function screenFile(lessonId, n) { const f = screenPath(lessonId, n); return fs.existsSync(f) ? f : null; }
/** Changes when a recording is replaced, so the lesson is rebuilt. */
export function screenVersion(lessonId, n) { const f = screenFile(lessonId, n); if (!f) return null; const st = fs.statSync(f); return `${st.size}-${Math.round(st.mtimeMs)}`; }
export async function saveScreen(lessonId, n, buf) {
  const l = LESSONS.find((x) => x.id === lessonId);
  const i = Number(n);
  if (!l || !Number.isInteger(i) || !l.slides[i]) throw httpError(404, "That lesson slide doesn't exist.");
  if (!l.slides[i].screen) throw httpError(400, "That slide doesn't have a screen demo.");
  if (!Buffer.isBuffer(buf) || buf.length < 1000) throw httpError(400, "Send the recording as an MP4 file.");
  if (buf.length > 80 * 1024 * 1024) throw httpError(413, "That recording is too big.");
  fs.mkdirSync(screensDir(), { recursive: true });
  const tmp = `${screenPath(lessonId, i)}.part`;
  fs.writeFileSync(tmp, buf);
  const probe = await ffmpeg(["-hide_banner", "-i", tmp]).catch(() => ({ err: "" }));
  if (!/Video: h264/.test(probe.err)) { fs.rmSync(tmp, { force: true }); throw httpError(400, "The recording must be an H.264 MP4."); }
  fs.renameSync(tmp, screenPath(lessonId, i));
  return { lesson: lessonId, slide: i, version: screenVersion(lessonId, i) };
}
/** Slides that have a screen demo, and whether it's recorded. */
export function screenList() {
  return LESSONS.flatMap((l) => l.slides.map((s, i) => (s.screen ? { lesson: l.id, slide: i, heading: s.heading, recorded: Boolean(screenFile(l.id, i)) } : null)).filter(Boolean));
}

/* ---------- ffmpeg ---------- */
function ffmpeg(args, timeout = 300_000) {
  return new Promise((resolve, reject) => {
    const p = spawn(ffmpegPath, args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => { err = (err + d).slice(-6000); });
    const t = setTimeout(() => { p.kill("SIGKILL"); reject(new Error("ffmpeg took too long")); }, timeout);
    p.on("close", (code) => { clearTimeout(t); resolve({ code, err }); });
    p.on("error", (e) => { clearTimeout(t); reject(e); });
  });
}
async function must(args, timeout) {
  const r = await ffmpeg(args, timeout);
  if (r.code !== 0) throw new Error(`ffmpeg failed: ${r.err.slice(-500)}`);
  return r;
}
const maskCache = new Map();
/** A white rounded rectangle on black, for cutting video into a rounded window. */
function maskPng(w, h, r) {
  const k = `${w}x${h}r${r}`;
  if (!maskCache.has(k)) {
    const file = path.join(root(), `mask-${k}.png`);
    if (!fs.existsSync(file)) { fs.mkdirSync(root(), { recursive: true }); fs.writeFileSync(file, pngFromSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#000"/><rect width="${w}" height="${h}" rx="${r}" fill="#fff"/></svg>`)); }
    maskCache.set(k, file);
  }
  return maskCache.get(k);
}

/* ---------- the voice and the talking head (cached) ---------- */
const headsDir = () => path.join(root(), "heads");
const hash = (...parts) => crypto.createHash("sha256").update(JSON.stringify(parts)).digest("hex").slice(0, 16);
let runpodImpl = null, voiceImpl = null;
/** Tests: stand-ins for the voice and the talking-head model. */
export function setStandIns({ voice, talkingHead } = {}) { voiceImpl = voice || null; runpodImpl = talkingHead || null; }
async function voiceWav(text, voice) {
  fs.mkdirSync(headsDir(), { recursive: true });
  const file = path.join(headsDir(), `v-${hash(text, voice)}.wav`);
  if (!fs.existsSync(file)) {
    const tmp = `${file}.part.wav`;
    if (voiceImpl) await voiceImpl(text, voice, tmp);
    else if (elevenlabs.isPremium(voice) && elevenlabs.enabled()) {
      try { await elevenlabs.speakToWav(text, voice, tmp); }
      catch (e) { console.warn("[academy] premium voice failed, using the free voice:", e.message); fs.writeFileSync(tmp, wav(await speak(text, "af_heart"))); }
    } else fs.writeFileSync(tmp, wav(await speak(text, elevenlabs.isPremium(voice) ? "af_heart" : voice)));
    fs.renameSync(tmp, file);
  }
  const bytes = fs.statSync(file).size - 44;
  return { file, seconds: Math.max(0.5, bytes / 2 / 24000) };
}
async function talkingHead(avatar, voice, text) {
  const file = path.join(headsDir(), `h-${hash(text, voice, avatar.image_file)}.mp4`);
  if (fs.existsSync(file)) return file;
  const { file: wavFile } = await voiceWav(text, voice);
  if (runpodImpl) { await runpodImpl({ image: avatar.image_file, audio: wavFile, out: file }); return file; }
  // InfiniteTalk fetches the voice from a public link, so it's served from media for the job's length.
  const pub = `${crypto.randomUUID()}.wav`;
  fs.copyFileSync(wavFile, path.join(dirs.media, pub));
  try {
    const r = await aimedia.runpod(`${TALK.endpoint()}/run`, { input: {
      prompt: "The person teaches an online lesson, speaking naturally and warmly to the camera with lively expressions and small natural hand gestures. Keep the person exactly as in the image.",
      image: `${config.publicUrl}/img/${avatar.image_file}`, audio: `${config.publicUrl}/media/${pub}`, size: "480p", enable_safety_checker: true } });
    const started = Date.now();
    for (;;) {
      await new Promise((ok) => setTimeout(ok, 8000));
      const st = await aimedia.runpod(`${TALK.endpoint()}/status/${r.id}`);
      if (st.status === "COMPLETED") {
        const url = aimedia.resultUrl(st.output, "video");
        if (!url) throw new Error("the talking head finished without a video");
        const res = await aimedia.download(url, 180_000);
        if (!res.ok) throw new Error(`download ${res.status}`);
        fs.writeFileSync(`${file}.part`, Buffer.from(await res.arrayBuffer()));
        fs.renameSync(`${file}.part`, file);
        return file;
      }
      if (["FAILED", "CANCELLED", "TIMED_OUT"].includes(st.status)) throw new Error(`talking head ${st.status}: ${JSON.stringify(st.error || st.output || "").slice(0, 200)}`);
      if (Date.now() - started > 25 * 60_000) throw new Error("the talking head took too long");
    }
  } finally { fs.rmSync(path.join(dirs.media, pub), { force: true }); }
}

/* ---------- putting a slide together ---------- */
const FPS = 30;
/**
 * One slide: the background picture, the screen recording (if any) in the phone, the avatar in her
 * window, and the voice. The recording and the avatar hold their last frame if the voice runs longer.
 */
async function composeSlide({ png, screen, head, voice, seconds, out }) {
  const T = (seconds + 0.45).toFixed(2);
  const L = screen ? LAYOUT.screen : LAYOUT.slide;
  const bg = `${out}.bg.png`;
  fs.writeFileSync(bg, png);
  const hd = L.head;
  const inputs = ["-loop", "1", "-framerate", String(FPS), "-t", T, "-i", bg, "-i", head, "-i", voice, "-loop", "1", "-framerate", String(FPS), "-t", T, "-i", maskPng(hd.w, hd.h, 26)];
  const fit = (w, h) => `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},fps=${FPS},tpad=stop_mode=clone:stop_duration=${T},trim=duration=${T},setpts=PTS-STARTPTS,format=rgba`;
  let f = `[1:v]${fit(hd.w, hd.h)}[hv];[3:v]format=gray[hm];[hv][hm]alphamerge[h];[0:v]scale=${W}:${H},format=rgba[b0];`;
  let base = "b0";
  if (screen) {
    const ph = L.phone, sw = ph.w - 16, sh = ph.h - 16;
    inputs.push("-i", screen, "-loop", "1", "-framerate", String(FPS), "-t", T, "-i", maskPng(sw, sh, 30));
    f += `[4:v]${fit(sw, sh)}[sv];[5:v]format=gray[sm];[sv][sm]alphamerge[s];[b0][s]overlay=${ph.x + 8}:${ph.y + 8}[b1];`;
    base = "b1";
  }
  f += `[${base}][h]overlay=${hd.x}:${hd.y},format=yuv420p[v];[2:a]aresample=24000,aformat=channel_layouts=mono,apad,atrim=duration=${T}[a]`;
  try {
    await must(["-y", "-hide_banner", "-loglevel", "error", ...inputs, "-filter_complex", f, "-map", "[v]", "-map", "[a]", "-t", T, "-r", String(FPS),
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "22", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "96k", "-ar", "24000", "-ac", "1", "-movflags", "+faststart", out], 600_000);
  } finally { fs.rmSync(bg, { force: true }); }
  return Number(T);
}

/* ---------- a whole lesson ---------- */
export const progress = { lesson: null, step: null };
/** What the lesson's video depends on, so it's rebuilt when any of it changes. */
export function versionOf(l) {
  const p = presenter();
  return hash("presenter-v1", p?.avatar.image_file, p?.voice, l.slides.map((s, i) => [s.heading, s.points, s.say, s.screen ? screenVersion(l.id, i) : null]));
}
/**
 * Build a lesson taught by the presenter. `svgFor(l, slide, index, layout)` draws the slide picture
 * with room for the avatar (layout "slide") or for the phone and the avatar (layout "screen").
 */
export async function buildLesson(l, { svgFor, out }) {
  const p = presenter();
  if (!p) throw new Error("no presenter set");
  const work = fs.mkdtempSync(path.join(root(), `.p-${l.id}-`));
  try {
    progress.lesson = l.id;
    // Voices first (Kokoro runs one at a time anyway), then the talking heads, three at a time.
    for (let i = 0; i < l.slides.length; i++) { progress.step = `voice ${i + 1}/${l.slides.length}`; await voiceWav(l.slides[i].say, p.voice); }
    const heads = new Array(l.slides.length);
    let next = 0, done = 0;
    await Promise.all(Array.from({ length: Math.min(3, l.slides.length) }, async () => {
      while (next < l.slides.length) {
        const i = next++;
        heads[i] = await talkingHead(p.avatar, p.voice, l.slides[i].say);
        progress.step = `avatar ${++done}/${l.slides.length}`;
      }
    }));
    const list = [];
    let total = 0;
    for (let i = 0; i < l.slides.length; i++) {
      progress.step = `slide ${i + 1}/${l.slides.length}`;
      const s = l.slides[i];
      const screen = s.screen ? screenFile(l.id, i) : null;
      const { file: voice, seconds } = await voiceWav(s.say, p.voice);
      const seg = path.join(work, `seg${i}.mp4`);
      total += await composeSlide({ png: pngFromSvg(svgFor(l, s, i, screen ? "screen" : "slide")), screen, head: heads[i], voice, seconds, out: seg });
      list.push(`file '${seg.replace(/'/g, "'\\''")}'`);
    }
    fs.writeFileSync(path.join(work, "list.txt"), list.join("\n"));
    await must(["-y", "-hide_banner", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", path.join(work, "list.txt"), "-c", "copy", "-movflags", "+faststart", `${out}.part.mp4`]);
    fs.renameSync(`${out}.part.mp4`, out);
    return { seconds: Math.round(total) };
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
    progress.lesson = null; progress.step = null;
  }
}

/* ---------- choosing her look and her voice ---------- */
/** A short sample of a voice, as a link the owner can play (kept for two hours). */
export async function voiceSample(voice, text) {
  if (!(await voiceOk(String(voice)))) throw httpError(400, "That voice isn't available.");
  const words = String(text || "Hi, I'm your Snapfront coach. In this lesson I'll show you exactly where everything is, so you can set it up in two minutes.").replace(/\s+/g, " ").trim().slice(0, 300);
  const file = `${crypto.randomUUID()}.wav`;
  const out = path.join(dirs.media, file);
  if (voiceImpl) await voiceImpl(words, voice, out);
  else if (elevenlabs.isPremium(voice)) await elevenlabs.speakToWav(words, voice, out);
  else fs.writeFileSync(out, wav(await speak(words, voice)));
  setTimeout(() => fs.rmSync(out, { force: true }), 2 * 3600e3).unref();
  return { voice, url: `${config.publicUrl}/media/${file}` };
}
export async function searchVoices(q) {
  if (!elevenlabs.enabled()) throw httpError(503, "Add ELEVENLABS_API_KEY to search the voice library.");
  try { return { voices: await elevenlabs.searchLibrary(q) }; } catch (e) { throw httpError(502, `The voice library didn't answer: ${e.message}`); }
}
export async function addVoice(b = {}) {
  if (!elevenlabs.enabled()) throw httpError(503, "Add ELEVENLABS_API_KEY to add voices.");
  try { return { id: await elevenlabs.addFromLibrary(b.public_owner_id, b.voice_id, b.name) }; } catch (e) { throw httpError(400, `Couldn't add that voice: ${e.message}`); }
}
/** The owner's avatar row and store, for changing its outfit. */
export function ownerAvatar(id) {
  const a = ownerAvatars().find((x) => x.id === id) || db.prepare("SELECT * FROM avatars WHERE id = ?").get(String(id || ""));
  if (!a || !ownerAccountIds().includes(a.account_id)) throw httpError(404, "That isn't one of your avatars.");
  return { avatar: a, seller: db.prepare("SELECT * FROM sellers WHERE id = ?").get(a.seller_id), account: db.prepare("SELECT * FROM accounts WHERE id = ?").get(a.account_id) };
}

/* ---------- what the owner sees ---------- */
const img = (f) => `${config.publicUrl}/img/${f}`;
export async function view(status = {}) {
  const s = settings() || {};
  // Stock voices plus any voice the owner added to the ElevenLabs account (shown only to the owner).
  const stock = elevenlabs.enabled() ? await elevenlabs.voices() : [];
  const added = elevenlabs.enabled() ? (await elevenlabs.accountVoices()).filter((v) => !stock.some((x) => x.id === v.id)) : [];
  const premium = [...added.map(({ id, name, accent, gender }) => ({ id, name, accent, gender, premium: true, added: true })), ...stock];
  return {
    presenter: s.avatar_id ? { avatar_id: s.avatar_id, voice: s.voice || "af_heart", lessons: s.lessons ?? [] } : null,
    active: Boolean(presenter()),
    avatars: ownerAvatars().map((a) => ({ id: a.id, name: a.name, style: a.style, source: a.source || "ai", image_url: img(a.image_file) })),
    voices: [...VOICES.map(({ id, name, accent }) => ({ id, name, accent, premium: false })), ...premium],
    lessons: LESSONS.map((l) => ({ id: l.id, title: l.title, slides: l.slides.length })),
    screens: screenList(),
    cost_per_slide_usd: TALK.usd("480p"),
    ...status,
    // Which lesson is being made and how far along (the build status only says yes or no).
    building: progress.lesson ? { ...progress } : null,
  };
}

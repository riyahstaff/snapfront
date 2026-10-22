// Makes the UGC film's raw material through Snapfront's owner-only studio routes (same as tools/promo).
// Only "ai" scenes get stills and clips; every scene gets a voice.
//   node make.mjs stills [key …]    first frames (Seedream, 16:9) → out/stills/<key>.jpg
//   node make.mjs animate [key …]   clips from those frames (Vidu/Seedance) → out/raw/<key>.mp4
//   node make.mjs voice [key …]     Cecily's line for each scene (ElevenLabs) → out/voice/<key>.wav
//                                   (a scene's own `voice` wins, e.g. each presenter in the real-people Shorts)
//   node make.mjs talk [key …]      talking clips: a still saying a voiced line (InfiniteTalk) → out/raw/<key>.mp4
//                                   (run voice first: the line's audio link lasts two hours)
//   node make.mjs sheet             contact sheet of the stills → out/sheet.jpg
// Then `python3 edit.py` cuts everything into the finished video.
// Needs STUDIO_TOKEN. API defaults to https://snapfront.app.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { SCENES, LOOK, OUT } from "./film.mjs";

const here = path.dirname(new URL(import.meta.url).pathname);
const API = process.env.API || "https://snapfront.app";
const TOKEN = process.env.STUDIO_TOKEN || process.env.ACADEMY_STUDIO_TOKEN;
const VOICE = process.env.VOICE || "el:NQMJRVvPew6HsaebYnZj";   // Cecily, the Academy narrator
const STATE = path.join(OUT, "state.json");
const state = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, "utf8")) : {};
const save = () => fs.writeFileSync(STATE, JSON.stringify(state, null, 2));
for (const d of ["stills", "raw", "voice"]) fs.mkdirSync(path.join(OUT, d), { recursive: true });

const VIDEO = {
  vidu: { ep: "vidu-q3-i2v", input: (image, prompt, duration) => ({ prompt, image, duration, resolution: "1080p", movement_amplitude: "auto", generate_audio: false, bgm: false, seed: -1 }) },
  seedance: { ep: "16jsvx5ncmm24x", input: (image, prompt, duration) => ({ prompt, image, duration, resolution: "1080p", aspect_ratio: "16:9", generate_audio: false, seed: -1 }) },
};

async function call(method, url, body) {
  const r = await fetch(API + url, { method, headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${r.status} ${j.error || JSON.stringify(j).slice(0, 200)}`);
  return j;
}
const firstUrl = (o) => { if (typeof o === "string") return /^https?:\/\//.test(o) ? o : null; if (o && typeof o === "object") for (const v of Object.values(o)) { const u = firstUrl(v); if (u) return u; } return null; };
async function run(ep, input, label) {
  const { id } = await call("POST", `/api/studio/runpod/${ep}/run`, { input });
  for (let i = 0; i < 360; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const s = await call("GET", `/api/studio/runpod/${ep}/status/${id}`);
    if (s.status === "COMPLETED") { const u = firstUrl(s.output); if (!u) throw new Error(`no result url: ${JSON.stringify(s.output).slice(0, 200)}`); return u; }
    if (["FAILED", "CANCELLED", "TIMED_OUT"].includes(s.status)) throw new Error(`${label}: ${s.status} ${JSON.stringify(s.error || s.output || "").slice(0, 300)}`);
  }
  throw new Error(`${label}: still running after 30 minutes`);
}
async function download(url, file) { const r = await fetch(url); if (!r.ok) throw new Error(`download ${r.status}`); fs.writeFileSync(file, Buffer.from(await r.arrayBuffer())); }
const keep = (file) => { if (fs.existsSync(file)) fs.renameSync(file, file.replace(/(\.\w+)$/, `.${Date.now()}$1`)); };
// "asset" scenes are pictures and clips the demo store uses (made like "ai" scenes, never shown on their own).
const pick = (keys, ai = false) => (keys.length ? SCENES.filter((s) => keys.includes(s.key)) : SCENES).filter((s) => !ai || s.type === "ai" || s.type === "asset");

async function still(s) {
  if (!s.still) return;
  // `from`: an edit of other scenes' pictures (e.g. the avatar holding the product), not a new picture.
  const images = (s.from || []).map((k) => { const u = state[k]?.still_url; if (!u) throw new Error(`${s.key}: make ${k} first`); return u; });
  const url = images.length
    ? await run("seedream-v4-edit", { prompt: s.still, images, size: s.size || "1024*1280", enable_safety_checker: true }, s.key)
    : await run("seedream-v4-t2i", { prompt: `${s.still} ${s.look ?? LOOK}`, size: s.size || "2560*1440", seed: -1, enable_safety_checker: true }, s.key);
  const file = path.join(OUT, "stills", `${s.key}.jpg`); keep(file);
  await download(url, file);
  state[s.key] = { ...state[s.key], still_url: url }; save();
  console.log("still", s.key);
}
async function animate(s) {
  const image = state[s.still_of || s.key]?.still_url; if (!image) throw new Error(`${s.key}: make the still first`);
  const m = VIDEO[process.env.MODEL || s.model];
  const prompt = `${s.motion}. Smooth, cinematic, mesmerising motion with vivid colour; keep people, faces and objects consistent with the first frame. No text appears.`;
  const url = await run(m.ep, m.input(image, prompt, s.duration), s.key);
  const file = path.join(OUT, "raw", `${s.key}.mp4`); keep(file);
  await download(url, file);
  state[s.key] = { ...state[s.key], video_url: url }; save();
  console.log("video", s.key);
}
async function talk(s) {
  const image = state[s.still_of]?.still_url; if (!image) throw new Error(`${s.key}: make ${s.still_of} first`);
  const line = state[s.talk.line];
  if (!line?.voice_url || Date.now() - line.voice_at > 100 * 60e3) throw new Error(`${s.key}: voice ${s.talk.line} first (its audio link has expired)`);
  const url = await run("infinitetalk", { prompt: s.talk.prompt, image, audio: line.voice_url, size: "720p", enable_safety_checker: true }, s.key);
  const file = path.join(OUT, "raw", `${s.key}.mp4`); keep(file);
  await download(url, file);
  state[s.key] = { ...state[s.key], video_url: url }; save();
  console.log("talk", s.key);
}
async function voice(s) {
  const parts = Array.isArray(s.say) ? s.say : [s.say];
  const files = [];
  for (const [i, text] of parts.entries()) {
    if (text.length > 300) throw new Error(`${s.key}: part ${i} is ${text.length} characters (300 at most)`);
    const { url } = await call("POST", "/api/academy-presenter/voice-sample", { voice: s.voice || VOICE, text });
    const f = path.join(OUT, "voice", `${s.key}.${i}.wav`); await download(url, f); files.push(f);
    // The public link (kept two hours on the server) is what a talking clip lip-syncs to.
    if (parts.length === 1) { state[s.key] = { ...state[s.key], voice_url: url, voice_at: Date.now() }; save(); }
  }
  const file = path.join(OUT, "voice", `${s.key}.wav`); keep(file);
  if (files.length === 1) fs.renameSync(files[0], file);
  else {
    // Read back to back with a short breath between parts.
    const ins = files.flatMap((f) => ["-i", f]);
    const fc = files.map((_, i) => `[${i}:a]aresample=48000,aformat=channel_layouts=mono,apad=pad_dur=0.3[p${i}]`).join(";") + ";" + files.map((_, i) => `[p${i}]`).join("") + `concat=n=${files.length}:v=0:a=1[a]`;
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...ins, "-filter_complex", fc, "-map", "[a]", file]);
    for (const f of files) fs.rmSync(f);
  }
  console.log("voice", s.key);
}
function sheet() {
  const files = SCENES.filter((s) => s.type === "ai").map((s) => path.join(OUT, "stills", `${s.key}.jpg`)).filter((f) => fs.existsSync(f));
  const inputs = files.flatMap((f) => ["-i", f]);
  const n = files.length, cols = 2, rows = Math.ceil(n / cols);
  const scaled = files.map((_, i) => `[${i}:v]scale=800:450[s${i}]`).join(";");
  const layout = files.map((_, i) => `${(i % cols) * 800}_${Math.floor(i / cols) * 450}`).join("|");
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...inputs, "-filter_complex", `${scaled};${files.map((_, i) => `[s${i}]`).join("")}xstack=inputs=${n}:layout=${layout}:fill=black[o]`, "-map", "[o]", "-frames:v", "1", "-s", `${cols * 800}x${rows * 450}`, path.join(OUT, "sheet.jpg")], { stdio: "inherit" });
  console.log("sheet", path.join(OUT, "sheet.jpg"));
}

const [cmd, ...keys] = process.argv.slice(2);
if (cmd === "sheet") sheet();
else {
  const job = { stills: still, animate, voice, talk }[cmd];
  if (!job) { console.error("usage: node make.mjs stills|animate|voice|talk|sheet [key …]"); process.exit(1); }
  if (!TOKEN) { console.error("Set STUDIO_TOKEN"); process.exit(1); }
  const list = pick(keys, cmd !== "voice").filter((s) => ({ voice: s.say, animate: s.motion, talk: s.talk, stills: s.still }[cmd]));
  const results = await Promise.allSettled(list.map((s) => job(s)));
  results.forEach((r, i) => { if (r.status === "rejected") console.error("FAILED", list[i].key, r.reason.message); });
  process.exit(results.some((r) => r.status === "rejected") ? 1 : 0);
}

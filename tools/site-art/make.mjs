// Makes the home page's tool-card animations through Snapfront's owner-only studio routes (Runpod).
//   node make.mjs stills [key …]    first frames (text-to-image), saved to out/stills/<key>.jpg
//   node make.mjs animate [key …]   5-second clips from those frames, saved to out/raw/<key>.mp4
//   node make.mjs finish [key …]    looping 640×480 WebM + MP4 and a WebP poster in server/assets/site/tools/
//   node make.mjs drift [key …]     stand-in: a slow push-in on the still (until a clip is made)
//   node make.mjs sheet             a contact sheet of the stills (out/sheet.jpg)
// Needs ACADEMY_STUDIO_TOKEN (or STUDIO_TOKEN). API defaults to https://snapfront.app.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { CARDS, LOOK } from "./concepts.mjs";

const here = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(here, "out");
const FINAL = path.resolve(here, "../../server/assets/site/tools");
const API = process.env.API || "https://snapfront.app";
const TOKEN = process.env.STUDIO_TOKEN || process.env.ACADEMY_STUDIO_TOKEN;
const STATE = path.join(OUT, "state.json");
const state = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, "utf8")) : {};
const save = () => fs.writeFileSync(STATE, JSON.stringify(state, null, 2));
for (const d of ["stills", "raw"]) fs.mkdirSync(path.join(OUT, d), { recursive: true });

const VIDEO = {
  vidu: { ep: "vidu-q3-i2v", input: (image, prompt) => ({ prompt, image, duration: 5, resolution: "720p", movement_amplitude: "auto", generate_audio: false, bgm: false, seed: -1 }) },
  seedance: { ep: "16jsvx5ncmm24x", input: (image, prompt) => ({ prompt, image, duration: 5, resolution: "720p", aspect_ratio: "4:3", generate_audio: false, seed: -1 }) },
};
const NEGATIVE = "watermark, logo, brand name, garbled text, misspelled words, extra fingers, distorted hands, deformed faces, blurry, low quality, cartoon";

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

const pick = (keys) => (keys.length ? CARDS.filter((c) => keys.includes(c.key)) : CARDS);
const ff = (...a) => execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...a], { stdio: "inherit" });

async function still(c) {
  // Seedream 4 is the most photographic; Qwen Image is the backup and is very good with short on-screen words.
  const engine = c.still_engine || process.env.STILL_ENGINE || "seedream";
  const url = engine === "qwen"
    ? await run("qwen-image-t2i", { prompt: `${c.still} ${LOOK}`, negative_prompt: NEGATIVE, size: "1280*960", seed: -1, enable_safety_checker: true }, c.key)
    : await run("seedream-v4-t2i", { prompt: `${c.still} ${LOOK}`, size: "2048*1536", seed: -1, enable_safety_checker: true }, c.key);
  const file = path.join(OUT, "stills", `${c.key}.jpg`);
  if (process.env.KEEP_OLD && fs.existsSync(file)) fs.renameSync(file, file.replace(/\.jpg$/, `.${Date.now()}.jpg`));
  await download(url, file);
  state[c.key] = { ...state[c.key], still_url: url, still_at: new Date().toISOString() }; save();
  console.log("still", c.key);
}
async function animate(c) {
  const image = state[c.key]?.still_url; if (!image) throw new Error(`${c.key}: make the still first`);
  const m = VIDEO[c.model];
  const url = await run(m.ep, m.input(image, `${c.motion}. Smooth, cinematic, natural motion; keep the people, faces and objects consistent with the first frame.`), c.key);
  await download(url, path.join(OUT, "raw", `${c.key}.mp4`));
  state[c.key] = { ...state[c.key], video_url: url, video_at: new Date().toISOString() }; save();
  console.log("video", c.key);
}
// Stand-in until a clip can be made: a slow push-in on the still frame (no Runpod cost).
function drift(c) {
  const img = path.join(OUT, "stills", `${c.key}.jpg`); if (!fs.existsSync(img)) throw new Error(`${c.key}: no still`);
  ff("-loop", "1", "-i", img, "-vf", "scale=2560:1920,zoompan=z='min(zoom+0.0007,1.09)':d=125:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1280x960:fps=25,format=yuv420p", "-t", "5", "-c:v", "libx264", "-crf", "18", path.join(OUT, "raw", `${c.key}.mp4`));
  state[c.key] = { ...state[c.key], video_url: null, stand_in: true }; save();
  console.log("drift", c.key);
}
function finish(c) {
  const raw = path.join(OUT, "raw", `${c.key}.mp4`); if (!fs.existsSync(raw)) throw new Error(`${c.key}: no clip yet`);
  fs.mkdirSync(FINAL, { recursive: true });
  const d = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", raw]).toString());
  const X = 0.6;   // the clip's last X seconds fade into its first X, so the loop has no jump
  const loop = `[0:v]fps=24,scale=640:480:force_original_aspect_ratio=increase,crop=640:480,setsar=1,split[a][b];[a]trim=0:${X},setpts=PTS-STARTPTS[head];[b]trim=${X},setpts=PTS-STARTPTS[body];[body][head]xfade=transition=fade:duration=${X}:offset=${(d - 2 * X).toFixed(2)},format=yuv420p[v]`;
  // WebM (VP9) for Chrome, Firefox and Edge; H.264 MP4 for Safari and anything else.
  ff("-i", raw, "-filter_complex", loop, "-map", "[v]", "-an", "-c:v", "libvpx-vp9", "-crf", "38", "-b:v", "0", "-row-mt", "1", "-deadline", "good", "-cpu-used", "2", path.join(FINAL, `${c.key}.webm`));
  ff("-i", raw, "-filter_complex", loop, "-map", "[v]", "-an", "-c:v", "libx264", "-profile:v", "main", "-crf", "27", "-preset", "slow", "-movflags", "+faststart", path.join(FINAL, `${c.key}.mp4`));
  ff("-ss", "0.7", "-i", raw, "-frames:v", "1", "-vf", "scale=640:480:force_original_aspect_ratio=increase,crop=640:480", "-quality", "78", path.join(FINAL, `${c.key}.webp`));
  const kb = (ext) => Math.round(fs.statSync(path.join(FINAL, `${c.key}.${ext}`)).size / 1024);
  console.log("finished", c.key, `webm ${kb("webm")}KB, mp4 ${kb("mp4")}KB`);
}
function sheet() {
  const files = CARDS.map((c) => path.join(OUT, "stills", `${c.key}.jpg`)).filter((f) => fs.existsSync(f));
  const args = files.flatMap((f) => ["-i", f]);
  const cols = 4, n = files.length;
  const labels = files.map((f, i) => `[${i}:v]scale=480:360,drawtext=text='${path.basename(f, ".jpg")}':x=10:y=10:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.6[v${i}]`).join(";");
  const layout = files.map((_, i) => `${(i % cols) * 480}_${Math.floor(i / cols) * 360}`).join("|");
  ff(...args, "-filter_complex", `${labels};${files.map((_, i) => `[v${i}]`).join("")}xstack=inputs=${n}:layout=${layout}:fill=black[o]`, "-map", "[o]", "-frames:v", "1", "-q:v", "4", path.join(OUT, "sheet.jpg"));
  console.log("sheet", path.join(OUT, "sheet.jpg"));
}

const [cmd, ...keys] = process.argv.slice(2);
if (!["finish", "sheet", "drift"].includes(cmd) && !TOKEN) throw new Error("Set ACADEMY_STUDIO_TOKEN");
const jobs = { stills: still, animate, finish: async (c) => finish(c), drift: async (c) => drift(c) }[cmd];
if (cmd === "sheet") sheet();
else if (!jobs) console.log("usage: node make.mjs stills|animate|finish|sheet [key …]");
else {
  const list = pick(keys), errors = [];
  // A few at a time: Runpod queues the rest anyway, and it keeps the log readable.
  for (let i = 0; i < list.length; i += 5) await Promise.all(list.slice(i, i + 5).map((c) => jobs(c).catch((e) => { errors.push(`${c.key}: ${e.message}`); console.error("FAILED", c.key, e.message); })));
  if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
}

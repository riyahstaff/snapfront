// Narrated videos made only with open-source tools: Kokoro-82M (Apache-2.0) speaks the script,
// slides are drawn as SVG (resvg) and ffmpeg joins them. Used for Snapfront Academy lessons and
// for sellers' faceless videos. No paid AI service, no per-video cost.
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import ffmpegPath from "ffmpeg-static";
import { Resvg } from "@resvg/resvg-js";
import { config } from "./config.js";

/* ---------- the voice ---------- */
export const VOICES = [
  { id: "af_heart", name: "Hannah", accent: "American" }, { id: "af_bella", name: "Bella", accent: "American" }, { id: "af_nicole", name: "Nicole (soft)", accent: "American" },
  { id: "am_michael", name: "Michael", accent: "American" }, { id: "am_fenrir", name: "Fenn", accent: "American" }, { id: "am_puck", name: "Puck", accent: "American" },
  { id: "bf_emma", name: "Emma", accent: "British" }, { id: "bm_george", name: "George", accent: "British" },
];
const VOICE_IDS = new Set(VOICES.map((v) => v.id));
/** Tests swap in a stand-in that returns { audio: Float32Array, sampling_rate }. */
let override = null;
export function setVoiceEngine(fn) { override = fn; }
// The voice runs in its own process (voice-worker.js): its ONNX runtime can't share a process with
// the photo cut-out model's. One process, started on first use, reused until it goes idle.
let worker = null, seq = 0;
const pending = new Map();
function voiceProcess() {
  if (worker && worker.exitCode === null && !worker.killed) return worker;
  const w = spawn(process.execPath, [path.resolve(new URL("./voice-worker.js", import.meta.url).pathname), path.join(config.dataDir, "models")], { stdio: ["pipe", "pipe", "pipe"] });
  let buf = "";
  w.stdout.on("data", (d) => {
    buf += d;
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const lineText = buf.slice(0, i); buf = buf.slice(i + 1);
      let msg; try { msg = JSON.parse(lineText); } catch { continue; }
      const p = pending.get(msg.id);
      if (p) { pending.delete(msg.id); p(msg); }
    }
  });
  w.stderr.on("data", () => {});   // the model library is chatty
  w.on("exit", () => { for (const [id, p] of pending) { pending.delete(id); p({ id, error: "The voice stopped. Try again." }); } if (worker === w) worker = null; });
  worker = w;
  return w;
}
async function generate(text, voice) {
  if (override) return override(text, voice);
  const id = ++seq;
  const out = path.join(config.dataDir, "tmp-voice", `${process.pid}-${id}.f32`);
  const reply = await new Promise((resolve) => {
    pending.set(id, resolve);
    voiceProcess().stdin.write(`${JSON.stringify({ id, text, voice, out })}\n`);
    setTimeout(() => { if (pending.has(id)) { pending.delete(id); resolve({ error: "The voice took too long." }); } }, 5 * 60e3);
  });
  if (reply.error) { fs.rmSync(out, { force: true }); throw new Error(reply.error); }
  const b = fs.readFileSync(out);
  fs.rmSync(out, { force: true });
  return { audio: new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)), sampling_rate: reply.rate };
}
// One voice job at a time: the model is CPU-bound and shared.
let queue = Promise.resolve();
const serial = (fn) => { const run = queue.then(fn, fn); queue = run.catch(() => {}); return run; };

/** Split a script into pieces the model handles well (a sentence or two each). */
export function chunks(text, max = 260) {
  const sentences = String(text || "").replace(/\s+/g, " ").trim().match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g) || [];
  const out = [];
  let cur = "";
  for (const s of sentences.map((x) => x.trim()).filter(Boolean)) {
    if ((cur + " " + s).trim().length > max && cur) { out.push(cur); cur = s; } else cur = `${cur} ${s}`.trim();
  }
  if (cur) out.push(cur);
  return out;
}
/** Speak `text`; returns { samples: Float32Array, rate }. Short pauses between sentences. */
export function speak(text, voice = "af_heart") {
  if (!VOICE_IDS.has(voice)) voice = "af_heart";
  return serial(async () => {
    const parts = [];
    let rate = 24000;
    for (const c of chunks(text)) {
      const a = await generate(c, voice);
      rate = a.sampling_rate;
      parts.push(a.audio instanceof Float32Array ? a.audio : Float32Array.from(a.audio));
      parts.push(new Float32Array(Math.round(rate * 0.22)));
    }
    const total = parts.reduce((t, p) => t + p.length, 0);
    const samples = new Float32Array(total);
    let o = 0;
    for (const p of parts) { samples.set(p, o); o += p.length; }
    return { samples, rate };
  });
}
export function wav({ samples, rate }) {
  const b = Buffer.alloc(44 + samples.length * 2);
  b.write("RIFF", 0); b.writeUInt32LE(36 + samples.length * 2, 4); b.write("WAVE", 8); b.write("fmt ", 12);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(rate, 24); b.writeUInt32LE(rate * 2, 28);
  b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write("data", 36); b.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(samples[i] * 32767))), 44 + i * 2);
  return b;
}

/* ---------- the video ---------- */
function run(cmd, args, timeout = 300_000) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => { err = (err + d).slice(-2000); });
    const t = setTimeout(() => { p.kill("SIGKILL"); reject(new Error("video took too long")); }, timeout);
    p.on("close", (code) => { clearTimeout(t); code === 0 ? resolve() : reject(new Error(`ffmpeg failed: ${err.slice(-400)}`)); });
    p.on("error", (e) => { clearTimeout(t); reject(e); });
  });
}
export const FONT_FILES = (() => {
  const dir = path.resolve(new URL("../assets/fonts/", import.meta.url).pathname);
  return { display: path.join(dir, "BricolageGrotesque-ExtraBold.ttf"), body: path.join(dir, "DMSans-Regular.ttf"), bold: path.join(dir, "DMSans-Bold.ttf") };
})();
export const pngFromSvg = (svg) => new Resvg(svg, { fitTo: { mode: "original" }, font: { fontFiles: Object.values(FONT_FILES), loadSystemFonts: false, defaultFontFamily: "DM Sans" } }).render().asPng();

/**
 * Slides with narration → one MP4. Each slide is { png (Buffer), say (text) } or { png, seconds }.
 * Returns { file, seconds }. `kenBurns` adds a slow zoom (for photos).
 */
export async function makeVideo(slides, { out, width, height, voice = "af_heart", kenBurns = false, workDir } = {}) {
  const dir = fs.mkdtempSync(path.join(workDir || path.dirname(out), ".nv-"));
  try {
    const list = [];
    let total = 0;
    for (let i = 0; i < slides.length; i++) {
      const s = slides[i];
      const img = path.join(dir, `s${i}.png`);
      fs.writeFileSync(img, s.png);
      let seconds = s.seconds || 3, audio = null;
      if (s.say) {
        const spoken = await speak(s.say, voice);
        audio = path.join(dir, `a${i}.wav`);
        fs.writeFileSync(audio, wav(spoken));
        seconds = spoken.samples.length / spoken.rate + 0.5;
      }
      const seg = path.join(dir, `seg${i}.mp4`);
      const fps = 30, frames = Math.ceil(seconds * fps);
      const vf = kenBurns
        ? `scale=${Math.round(width * 1.12)}:${Math.round(height * 1.12)},zoompan=z='min(zoom+0.0006,1.1)':d=${frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${width}x${height}:fps=${fps},setsar=1,format=yuv420p`
        : `scale=${width}:${height},setsar=1,format=yuv420p`;
      await run(ffmpegPath, ["-y", "-loop", "1", "-framerate", String(fps), "-t", seconds.toFixed(2), "-i", img,
        ...(audio ? ["-i", audio] : ["-f", "lavfi", "-t", seconds.toFixed(2), "-i", "anullsrc=r=24000:cl=mono"]),
        "-vf", vf, "-r", String(fps), "-c:v", "libx264", "-preset", "veryfast", "-tune", "stillimage", "-crf", "24",
        "-c:a", "aac", "-b:a", "96k", "-ar", "24000", "-ac", "1", "-t", seconds.toFixed(2), "-shortest", "-movflags", "+faststart", seg]);
      list.push(`file '${seg.replace(/'/g, "'\\''")}'`);
      total += seconds;
    }
    const listFile = path.join(dir, "list.txt");
    fs.writeFileSync(listFile, list.join("\n"));
    const tmp = `${out}.part.mp4`;
    await run(ffmpegPath, ["-y", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", "-movflags", "+faststart", tmp]);
    fs.renameSync(tmp, out);
    return { file: out, seconds: Math.round(total) };
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

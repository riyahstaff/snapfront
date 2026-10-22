// Cuts the promo Shorts (scenes-promo.mjs) into vertical 1080×1920 videos:
//   opener: Juniper's clip, full screen, with a caption pill and an "AI presenter" label
//   beats:  the app recording in a phone frame, a headline above it and a caption pill below
//   end:    the Snapfront end card
// Cecily's voice runs over a quiet music bed that ducks under her.
//   node shorts.mjs [key …]   →  out-promo/final/<key>.mp4
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { SHORTS, END } from "./scenes-promo.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const OUT = path.join(here, "out-promo"), WORK = path.join(OUT, "edit"), FINAL = path.join(OUT, "final");
for (const d of [WORK, FINAL]) fs.mkdirSync(d, { recursive: true });
const { chromium } = createRequire(path.join(root, "tools/academy-screens/package.json"))("playwright-core");
const W = 1080, H = 1920, FPS = 30, PRE = 0.25, POST = 0.5, XF = 0.3;
const PHONE = { w: 700, h: Math.round(700 * 932 / 430), x: Math.round((1080 - 700) / 2), y: 330 };
const ff = (...a) => { const r = spawnSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", ...a.map(String)], { maxBuffer: 1 << 26 }); if (r.status !== 0) throw new Error(String(r.stderr).slice(-800)); };
const dur = (f) => Number(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).stdout.toString());

/* ---------- graphics (Figtree, drawn in a browser) ---------- */
const FONTS = path.join(root, "mobile/node_modules/@expo-google-fonts/figtree");
const font = (w, f) => `@font-face{font-family:F;font-weight:${w};src:url(data:font/ttf;base64,${fs.readFileSync(path.join(FONTS, f)).toString("base64")})}`;
const b64 = (f) => fs.readFileSync(f).toString("base64");
const MARK = b64(path.join(root, "mobile/assets/brand-mark.png"));
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const CSS = font(800, "800ExtraBold/Figtree_800ExtraBold.ttf") + font(700, "700Bold/Figtree_700Bold.ttf") + font(500, "500Medium/Figtree_500Medium.ttf") + `
*{margin:0;box-sizing:border-box}html,body{width:${W}px;height:${H}px;overflow:hidden;font-family:F;color:#fff;background:transparent}
.bg{position:absolute;inset:0;background:#0B0D12;overflow:hidden}
.blob{position:absolute;border-radius:50%;filter:blur(110px)}
.head{position:absolute;left:60px;right:60px;top:92px;height:210px;display:flex;align-items:center;justify-content:center;text-align:center;font:800 84px/1.02 F;letter-spacing:-2.5px;text-shadow:0 6px 30px rgba(0,0,0,.45)}
.frame{position:absolute;left:${PHONE.x - 14}px;top:${PHONE.y - 14}px;width:${PHONE.w + 28}px;height:${PHONE.h + 28}px;border-radius:66px;border:14px solid #161a21;box-shadow:0 0 0 3px #2c323c,0 40px 120px rgba(0,0,0,.6),0 0 140px rgba(255,122,89,.22)}
.cap{position:absolute;left:0;right:0;bottom:118px;display:flex;justify-content:center}
.cap span{display:inline-block;max-width:960px;text-align:center;padding:20px 46px 26px;border-radius:999px;font:800 58px/1.08 F;letter-spacing:-1px;background:linear-gradient(100deg,var(--g));box-shadow:0 18px 60px rgba(0,0,0,.5);text-shadow:0 3px 12px rgba(0,0,0,.3)}
.big span{font-size:74px;padding:24px 54px 30px}
.tag{position:absolute;left:44px;top:56px;font:700 32px F;padding:12px 24px;border-radius:999px;background:rgba(10,12,16,.62);border:2px solid rgba(255,255,255,.25)}
.bug{position:absolute;right:44px;top:52px;display:flex;align-items:center;gap:12px;font:800 40px F;text-shadow:0 2px 12px rgba(0,0,0,.6)}.bug img{width:50px;height:50px}
.end{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:44px;text-align:center}
.end .logo{display:flex;align-items:center;gap:26px}.end .logo img{width:150px;height:150px}.end .logo b{font:800 132px/1 F;letter-spacing:-4px}
.end .url{font:800 76px F;background:linear-gradient(100deg,#FFB347,#FF7A59 45%,#C77DFF);-webkit-background-clip:text;background-clip:text;color:transparent}
.end .pill{font:800 54px/1 F;color:#1a0d05;padding:24px 50px 28px;border-radius:999px;background:#fff;box-shadow:0 0 0 8px rgba(255,255,255,.15),0 0 90px rgba(255,140,60,.6)}
.end .face{width:300px;height:300px;border-radius:50%;background-size:cover;background-position:center 20%;box-shadow:0 0 0 8px rgba(255,255,255,.12)}
.end small{font:500 30px F;color:#AEB4BF}
`;
const BLOBS = (seed) => {
  const c = [["#FF7A59", -260, -200], ["#9B8CFF", 520, 520], ["#2EC4B6", -200, 1300], ["#FF5FA2", 600, 1500]];
  return c.map(([col, x, y], i) => `<div class="blob" style="width:${900 - i * 60}px;height:${900 - i * 60}px;left:${x + ((seed * 37 + i * 53) % 120)}px;top:${y}px;background:${col};opacity:${i === 2 ? 0.28 : 0.45}"></div>`).join("");
};
const GRADS = ["#FF7A59,#FF3CAC", "#FFB347,#FF7A59", "#9B8CFF,#5B6CFF", "#2EC4B6,#2B86C5", "#FF8A00,#FF2D95"];
const BUG = `<div class="bug"><img src="data:image/png;base64,${MARK}">snapfront</div>`;

async function draw(page, html, file) {
  await page.setContent(`<style>${CSS}</style>${html}`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: file, omitBackground: true });
  return file;
}

/* ---------- one Short ---------- */
async function make(page, s, n) {
  const g = (i) => GRADS[(n + i) % GRADS.length];
  const parts = [], voices = [];
  let t = 0;
  const add = (file, len, voice) => { parts.push({ file, len, start: t }); if (voice) voices.push({ voice, at: t + PRE }); t += len - XF; };
  const enc = ["-c:v", "libx264", "-crf", "16", "-preset", "fast", "-r", FPS, "-pix_fmt", "yuv420p", "-an"];

  // Opener: Juniper full screen.
  const v0 = path.join(OUT, "voice", `${s.key}-0.wav`);
  const len0 = Math.max(3.2, PRE + dur(v0) + POST);
  const ov0 = await draw(page, `<div class="tag">AI presenter</div>${BUG}<div class="cap big"><span style="--g:${g(0)}">${esc(s.opener.caption)}</span></div>`, path.join(WORK, `${s.key}-o0.png`));
  const clip = path.join(OUT, "raw", `${s.key}-clip.mp4`);
  const slow = Math.max(1, (len0 + 0.1) / dur(clip));
  const o0 = path.join(WORK, `${s.key}-0.mp4`);
  ff("-i", clip, "-i", ov0, "-filter_complex", `[0:v]setpts=${slow.toFixed(4)}*PTS,scale=${W}:${H}:force_original_aspect_ratio=increase:flags=lanczos,crop=${W}:${H},fps=${FPS},trim=duration=${len0.toFixed(3)},setpts=PTS-STARTPTS[v];[v][1:v]overlay=0:0:shortest=0,trim=duration=${len0.toFixed(3)}[o]`, "-map", "[o]", ...enc, o0);
  add(o0, len0, v0);

  // Beats: the app in a phone.
  const mask = path.join(WORK, "phone-mask.png");
  if (!fs.existsSync(mask)) {
    const r = spawnSync("python3", ["-c", `from PIL import Image, ImageDraw; m=Image.new('L',(${PHONE.w},${PHONE.h}),0); ImageDraw.Draw(m).rounded_rectangle([0,0,${PHONE.w - 1},${PHONE.h - 1}],52,fill=255); m.save('${mask}')`]);
    if (r.status !== 0) throw new Error(String(r.stderr));
  }
  for (const [i, b] of s.beats.entries()) {
    const v = path.join(OUT, "voice", `${s.key}-${i + 1}.wav`);
    const len = PRE + dur(v) + POST;
    const bg = await draw(page, `<div class="bg">${BLOBS(n * 3 + i)}</div><div class="frame"></div>`, path.join(WORK, `${s.key}-b${i + 1}.png`));
    const top = await draw(page, `${BUG}<div class="head">${esc(b.headline)}</div><div class="cap"><span style="--g:${g(i + 1)}">${esc(b.caption)}</span></div>`, path.join(WORK, `${s.key}-t${i + 1}.png`));
    const rec = path.join(OUT, b.rec.startsWith("../") ? `${b.rec}.mp4` : `screens/${b.rec}.mp4`);
    const from = b.from || 0;
    const out = path.join(WORK, `${s.key}-${i + 1}.mp4`);
    // The recording holds its last frame if the line runs longer than it.
    ff("-i", bg, "-ss", from, "-i", rec, "-i", mask, "-i", top, "-filter_complex",
      `[0:v]loop=-1:1,fps=${FPS},format=rgba[b];` +
      `[1:v]crop=430:932:0:0,scale=${PHONE.w}:${PHONE.h}:flags=lanczos,fps=${FPS},tpad=stop_mode=clone:stop_duration=${len.toFixed(2)},format=rgba[r];` +
      `[2:v]format=gray,loop=-1:1,fps=${FPS}[m];[r][m]alphamerge[rm];` +
      `[b][rm]overlay=${PHONE.x}:${PHONE.y}[x];[x][3:v]overlay=0:0,trim=duration=${len.toFixed(3)},setpts=PTS-STARTPTS[o]`, "-map", "[o]", ...enc, out);
    add(out, len, v);
  }

  // End card.
  const ve = path.join(OUT, "voice", "end.wav");
  const lenE = PRE + dur(ve) + 1.6;
  const face = b64(path.join(OUT, "stills", `${s.key}-still.jpg`));
  const endPng = await draw(page, `<div class="bg">${BLOBS(n + 7)}</div><div class="end"><div class="face" style="background-image:url(data:image/jpeg;base64,${face})"></div>
    <div class="logo"><img src="data:image/png;base64,${MARK}"><b>snapfront</b></div><div class="url">snapfront.app</div><div class="pill">Start free</div><small>Juniper is an AI presenter. App shown with demo data.</small></div>`, path.join(WORK, `${s.key}-end.png`));
  const oe = path.join(WORK, `${s.key}-end.mp4`);
  ff("-loop", 1, "-framerate", FPS, "-t", lenE.toFixed(3), "-i", endPng, "-vf", `format=yuv420p,zoompan=z='1+0.0006*on':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${W}x${H}:fps=${FPS}`, ...enc, oe);
  add(oe, lenE, ve);
  const total = parts.at(-1).start + parts.at(-1).len;

  // Picture: crossfades between the parts.
  const ins = parts.flatMap((p) => ["-i", p.file]);
  let chain = "", prev = "[0:v]";
  for (let i = 1; i < parts.length; i++) { chain += `${prev}[${i}:v]xfade=transition=fade:duration=${XF}:offset=${parts[i].start.toFixed(3)}[x${i}];`; prev = `[x${i}]`; }
  // Sound: Cecily over the music bed (a different stretch of it for each Short), ducked under her voice.
  const music = path.join(here, "out", "music.wav");
  const aIns = ["-ss", 12 + n * 37, "-i", music, ...voices.flatMap((v) => ["-i", v.voice])];
  const a0 = parts.length;
  const vo = voices.map((v, i) => `[${a0 + 1 + i}:a]aresample=48000,aformat=channel_layouts=stereo,adelay=${Math.round(v.at * 1000)}|${Math.round(v.at * 1000)}[v${i}]`).join(";");
  const fc = `${chain.replace(/;$/, "")};${vo};${voices.map((_, i) => `[v${i}]`).join("")}amix=inputs=${voices.length}:normalize=0,asplit=2[voice][key];` +
    `[${a0}:a]aresample=48000,volume=0.13,afade=t=out:st=${(total - 1.2).toFixed(2)}:d=1.2[mus];[mus][key]sidechaincompress=threshold=0.02:ratio=8:attack=30:release=450:makeup=1[duck];` +
    `[voice][duck]amix=inputs=2:normalize=0,atrim=duration=${total.toFixed(3)},loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[a]`;
  const final = path.join(FINAL, `snapfront-short-${s.key}.mp4`);
  ff(...ins, ...aIns, "-filter_complex", fc, "-map", prev, "-map", "[a]", "-t", total.toFixed(3), "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-profile:v", "high", "-pix_fmt", "yuv420p", "-r", FPS, "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", final);
  console.log(`${path.basename(final)}  ${total.toFixed(1)}s`);
}

const only = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: W, height: H } });
for (const [n, s] of SHORTS.entries()) if (!only.length || only.includes(s.key)) await make(page, s, n);
await browser.close();

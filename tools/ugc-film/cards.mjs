// Draws the UGC film's graphics in Figtree, frame by frame, so text stays sharp:
//   - the timing of every scene (from Cecily's voice files)        → out/timing.json
//   - "card" scenes: animated lesson cards                          → out/cards/<key>.mp4
//   - "screen" scenes: a phone frame with the headline beside it    → out/cards/<key>.mp4 (+ slot in timing.json)
//   - "loop" scenes: two framed loops with the headline              → out/cards/<key>.mp4 (+ slots)
//   - caption pills for "ai" scenes, the end card and corner mark     → out/overlays/*.png
// Run after `node make.mjs voice`:  node cards.mjs [key …]
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { SCENES as ALL, OUT, META } from "./film.mjs";
const SCENES = ALL.filter((s) => s.type !== "asset");

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const { chromium } = createRequire(path.join(root, "tools/academy-screens/package.json"))("playwright-core");
const W = 1920, H = 1080, FPS = 30;
export const PRE = 0.45, POST = 1.3, XF = 0.5, END_HOLD = 5.5;
const ONLY = process.argv.slice(2);

/* ---------- timing ---------- */
const dur = (f) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString());
const spoken = (s) => (Array.isArray(s.say) ? s.say.join(" ") : s.say);
/** When Cecily reaches a phrase: its share of the line's characters, applied to the voice length. */
function atPhrase(s, phrase, vdur) {
  const text = spoken(s), i = text.toLowerCase().indexOf(String(phrase).toLowerCase());
  if (i < 0) throw new Error(`${s.key}: "${phrase}" isn't in the line`);
  return PRE + vdur * (i / text.length);
}
let t = 0;
const timing = SCENES.map((s) => {
  const vdur = dur(path.join(OUT, "voice", `${s.key}.wav`));
  const len = PRE + vdur + (s.end ? END_HOLD : POST);
  const row = { key: s.key, type: s.type, start: t, vstart: t + PRE, vdur, len, say: spoken(s), end: !!s.end,
    captions: (s.captions || []).map(([text, at]) => ({ text, at: atPhrase(s, at, vdur) })),
    reveals: s.card?.at ? s.card.at.map((a) => atPhrase(s, a, vdur)) : [] };
  t += len - XF;
  return row;
});
const total = timing.at(-1).start + timing.at(-1).len;

/* ---------- look ---------- */
const FONTS = path.join(root, "mobile/node_modules/@expo-google-fonts/figtree");
const font = (w, f) => `@font-face{font-family:F;font-weight:${w};src:url(data:font/ttf;base64,${fs.readFileSync(path.join(FONTS, f)).toString("base64")})}`;
const MARK = fs.readFileSync(path.join(root, "mobile/assets/brand-mark.png")).toString("base64");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const CSS = font(800, "800ExtraBold/Figtree_800ExtraBold.ttf") + font(700, "700Bold/Figtree_700Bold.ttf") + font(500, "500Medium/Figtree_500Medium.ttf") + `
*{box-sizing:border-box}html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden;font-family:F;color:#F5F6F8}
.bg{position:absolute;inset:0;background:#0B0D12;overflow:hidden}
.blob{position:absolute;border-radius:50%;filter:blur(90px);opacity:.55}
.b1{width:900px;height:900px;left:-200px;top:-260px;background:#FF7A59;animation:d1 14s ease-in-out infinite alternate}
.b2{width:800px;height:800px;right:-180px;top:120px;background:#9B8CFF;animation:d2 16s ease-in-out infinite alternate}
.b3{width:700px;height:700px;left:520px;bottom:-420px;background:#2EC4B6;opacity:.35;animation:d3 18s ease-in-out infinite alternate}
@keyframes d1{to{transform:translate(160px,120px) scale(1.1)}}@keyframes d2{to{transform:translate(-140px,-90px) scale(.95)}}@keyframes d3{to{transform:translate(-120px,-60px) scale(1.15)}}
.grain{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 40%,transparent 40%,rgba(0,0,0,.55))}
.wrap{position:absolute;inset:0;padding:90px 150px;display:flex;flex-direction:column;justify-content:center;align-items:flex-start}
.wrap>.tiles,.wrap>.flow{align-self:stretch}
.eyebrow{font:800 26px F;letter-spacing:.04em;color:#FFB347;margin:0 0 18px}
h1{font:800 92px/1.02 F;letter-spacing:-.035em;margin:0 0 54px;max-width:1400px;opacity:0;animation:up .7s cubic-bezier(.2,.8,.2,1) .15s forwards}
.item{opacity:0;animation:up .65s cubic-bezier(.2,.8,.2,1) forwards}
@keyframes up{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:none}}
@keyframes pop{0%{opacity:0;transform:scale(.85)}60%{opacity:1;transform:scale(1.03)}100%{opacity:1;transform:none}}
.grad{background:linear-gradient(100deg,#FFB347,#FF7A59 45%,#9B8CFF);-webkit-background-clip:text;background-clip:text;color:transparent}
.tiles{display:grid;grid-template-columns:repeat(5,1fr);gap:26px}
.tile{height:400px;border-radius:30px;padding:34px;background:rgba(20,23,28,.78);border:2px solid rgba(255,255,255,.08);display:flex;flex-direction:column;justify-content:space-between;backdrop-filter:blur(10px)}
.tile .n{font:800 76px F}.tile b{font:800 40px/1.1 F}
.quotes{display:grid;gap:26px;max-width:1500px}
.q{font:700 58px/1.15 F;padding:30px 46px;border-radius:28px;background:rgba(20,23,28,.8);border-left:10px solid #FF7A59;width:fit-content}
.q:nth-child(2){border-color:#FFB347}.q:nth-child(3){border-color:#9B8CFF}
.foot{margin-top:46px;font:800 52px F;opacity:0;animation:pop .7s ease forwards;display:inline-block;padding:20px 40px;border-radius:999px;background:linear-gradient(100deg,#FFB347,#FF7A59 50%,#9B8CFF);color:#1a0d05}
.foot.soft{background:none;color:#ADB4BF;font:500 34px F;padding:0}
.flow{display:flex;align-items:stretch;gap:0;margin-top:30px}
.st{flex:1;display:flex;flex-direction:column;align-items:center;text-align:center;gap:26px;position:relative}
.st .dot{width:130px;height:130px;border-radius:50%;display:grid;place-items:center;font:800 56px F;color:#1a0d05;background:linear-gradient(140deg,#FFB347,#FF7A59);box-shadow:0 0 60px rgba(255,122,89,.45)}
.st:nth-child(3) .dot{background:linear-gradient(140deg,#FF7A59,#9B8CFF)}.st:nth-child(4) .dot,.st:nth-child(5) .dot{background:linear-gradient(140deg,#9B8CFF,#2EC4B6)}
.st b{font:800 44px/1.1 F;max-width:300px}
.line{position:absolute;top:65px;left:calc(50% + 70px);width:calc(100% - 140px);height:6px;border-radius:6px;background:linear-gradient(90deg,#FF7A59,#9B8CFF);transform-origin:left;transform:scaleX(0);animation:grow .6s ease forwards}
@keyframes grow{to{transform:scaleX(1)}}
.rules{display:grid;gap:24px;max-width:1500px}
.rule{display:flex;align-items:center;gap:30px;font:700 52px/1.15 F;padding:26px 40px;border-radius:26px;background:rgba(20,23,28,.8)}
.rule i{flex-shrink:0;width:76px;height:76px;border-radius:22px;display:grid;place-items:center;font:800 44px F;font-style:normal}
.ok{background:#16352c;color:#92e7c6}.no{background:#3b1a1a;color:#ffb0a3}
.rates{display:grid;gap:0;max-width:1450px;border-radius:30px;overflow:hidden;background:rgba(20,23,28,.82);border:2px solid rgba(255,255,255,.08)}
.wrap>.rates{align-self:stretch;max-width:1560px}
.row{display:flex;justify-content:space-between;align-items:center;gap:60px;padding:34px 50px;font:700 50px F;border-top:2px solid rgba(255,255,255,.06)}
.row:first-child{border-top:0}.row span:last-child{font:800 54px F}
.note{display:grid;gap:26px}
.note .item{font:700 56px/1.15 F;display:flex;gap:28px;align-items:center}
.note .item:first-child{font:800 74px F}.note .item i{width:22px;height:22px;border-radius:50%;background:linear-gradient(140deg,#FFB347,#FF7A59);flex-shrink:0}
.side{position:absolute;left:1000px;top:0;bottom:0;width:780px;display:flex;flex-direction:column;justify-content:center;gap:34px}
.side .item{font:800 72px/1.05 F;letter-spacing:-.03em;overflow-wrap:anywhere}
.side .item:not(:last-child){color:#c9ced8}
.phone{position:absolute;border-radius:64px;background:#05070a;box-shadow:0 0 0 4px #2b313b,0 50px 140px rgba(0,0,0,.65),0 0 120px rgba(255,122,89,.18)}
.slot{position:absolute;border-radius:28px;background:#11141a;box-shadow:0 30px 90px rgba(0,0,0,.6),0 0 0 3px rgba(255,255,255,.08)}
.cap{display:inline-block;padding:18px 44px 24px;border-radius:999px;font:800 80px/1.05 F;letter-spacing:-1.5px;color:#fff;background:linear-gradient(100deg,var(--g));box-shadow:0 18px 60px rgba(0,0,0,.45);text-shadow:0 3px 12px rgba(0,0,0,.35);white-space:nowrap;margin:80px 100px}
.logo{display:inline-flex;align-items:center;gap:26px;margin:70px}.logo img{width:132px;height:132px}.logo span{font:800 124px/1 F;letter-spacing:-3px;color:#fff}
.tag{display:inline-block;font:700 58px/1.1 F;color:#fff;text-shadow:0 4px 24px rgba(0,0,0,.6);margin:50px}
.cta{display:inline-block;margin:110px;padding:26px 64px 30px;border-radius:999px;background:#fff;color:#11151B;font:800 62px/1 F;box-shadow:0 0 0 6px rgba(255,255,255,.18),0 0 90px rgba(255,140,60,.75)}
.bug{display:inline-flex;align-items:center;gap:12px;margin:24px;opacity:.92}.bug img{width:44px;height:44px}.bug span{font:800 38px/1 F;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.6)}
`;
const BG = `<div class="bg"><div class="blob b1"></div><div class="blob b2"></div><div class="blob b3"></div><div class="grain"></div></div>`;
const delay = (sec, start) => `animation-delay:${Math.max(0, sec - start).toFixed(2)}s`;
const PHONE = { x: 300, y: 70, w: 432, h: 936 };   // the recording fills this slot (ratio of the recordings, 860×1864)
const LOOPS = [{ x: 150, y: 250, w: 520, h: 520 }, { x: 710, y: 250, w: 520, h: 520 }];

function body(s, row) {
  const c = s.card || {}, at = (i) => row.reveals[i] ?? row.vstart, st = row.start;
  const head = (title, eyebrow = META.eyebrow) => `<p class="eyebrow">${eyebrow}</p><h1>${esc(title)}</h1>`;
  if (s.type === "screen" || s.type === "loop") {
    const caps = row.captions.map((cp) => `<div class="item" style="${delay(cp.at, st)}">${esc(cp.text)}</div>`).join("");
    const frame = s.type === "screen"
      ? `<div class="phone" style="left:${PHONE.x - 18}px;top:${PHONE.y - 18}px;width:${PHONE.w + 36}px;height:${PHONE.h + 36}px"></div>`
      : LOOPS.map((b) => `<div class="slot" style="left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px"></div>`).join("");
    return `${BG}${frame}<div class="side" style="${s.type === "loop" ? "left:1300px;width:560px" : ""}"><p class="eyebrow" style="margin:0">${esc(META.eyebrow)}</p>${caps}</div>`;
  }
  if (c.kind === "tiles") return `${BG}<div class="wrap">${head(c.title)}<div class="tiles">${c.items.map((x, i) => `<div class="tile item" style="${delay(at(i), st)}"><span class="n grad">${i + 1}</span><b>${esc(x)}</b></div>`).join("")}</div></div>`;
  if (c.kind === "quotes") return `${BG}<div class="wrap">${head(c.title)}<div class="quotes">${c.items.map((x, i) => `<div class="q item" style="${delay(at(i), st)}">${esc(x)}</div>`).join("")}</div><div class="foot" style="${delay(at(3), st)}">${esc(c.foot)}</div></div>`;
  if (c.kind === "steps") return `${BG}<div class="wrap">${head(c.title)}<div class="flow">${c.items.map((x, i) => `<div class="st item" style="${delay(at(i), st)}"><div class="dot">${i + 1}</div><b>${esc(x)}</b>${i < c.items.length - 1 ? `<div class="line" style="${delay(at(i + 1) - 0.3, st)}"></div>` : ""}</div>`).join("")}</div><div class="foot" style="${delay(at(5), st)};margin-top:70px">${esc(c.foot)}</div></div>`;
  if (c.kind === "rules") { const ok = (i) => (c.marks ? c.marks[i] === "ok" : i === 0 || i === 3); return `${BG}<div class="wrap">${head(c.title)}<div class="rules">${c.items.map((x, i) => `<div class="rule item" style="${delay(at(i), st)}"><i class="${ok(i) ? "ok" : "no"}">${ok(i) ? "✓" : "✕"}</i>${esc(x)}</div>`).join("")}</div></div>`; }
  if (c.kind === "rates") return `${BG}<div class="wrap">${head(c.title)}<div class="rates">${c.rows.map(([a, b], i) => `<div class="row item" style="${delay(at(i), st)}"><span>${esc(a)}</span><span class="grad">${esc(b)}</span></div>`).join("")}</div><div class="foot soft" style="${delay(at(0) + 0.6, st)}">${esc(c.foot)}</div></div>`;
  if (c.kind === "note") return `${BG}<div class="wrap">${head(c.title, c.eyebrow || "ANOTHER WAY TO EARN")}<div class="note">${c.items.map((x, i) => `<div class="item" style="${delay(at(i), st)}">${i ? "<i></i>" : ""}<span class="${i ? "" : "grad"}">${esc(x)}</span></div>`).join("")}</div><div class="foot soft" style="${delay(at(3), st)}">${esc(c.foot)}</div></div>`;
  throw new Error(`${s.key}: unknown card`);
}

async function renderScene(page, s, row) {
  await page.setContent(`<style>${CSS}</style>${body(s, row)}`);
  await page.evaluate(() => document.fonts.ready);
  const frames = Math.ceil(row.len * FPS);
  const out = path.join(OUT, "cards", `${s.key}.mp4`);
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-", "-c:v", "libx264", "-crf", "16", "-preset", "medium", "-pix_fmt", "yuv420p", "-r", String(FPS), out], { stdio: ["pipe", "inherit", "inherit"] });
  for (let f = 0; f < frames; f++) {
    // Every animation is paused and set to this frame's time, so frames are exact and evenly spaced.
    await page.evaluate((ms) => { for (const a of document.getAnimations()) { a.pause(); a.currentTime = ms; } }, (f / FPS) * 1000);
    const jpg = await page.screenshot({ type: "jpeg", quality: 92 });
    if (!ff.stdin.write(jpg)) await new Promise((r) => ff.stdin.once("drain", r));
  }
  ff.stdin.end();
  await new Promise((ok, bad) => ff.on("close", (code) => (code ? bad(new Error(`ffmpeg ${code}`)) : ok())));
  console.log("card", s.key, `${row.len.toFixed(1)}s`);
}

async function shot(page, html, name) {
  await page.setContent(`<style>${CSS}html,body{background:transparent;width:auto;height:auto}</style><div id=w style="display:inline-block">${html}</div>`);
  await page.evaluate(() => document.fonts.ready);
  await page.locator("#w").screenshot({ path: path.join(OUT, "overlays", `${name}.png`), omitBackground: true });
}
const GRADS = ["#FF7A59,#FF3CAC", "#FFB347,#FF7A59", "#9B8CFF,#5B6CFF", "#2EC4B6,#2B86C5", "#FF8A00,#FF2D95", "#7F00FF,#E100FF"];

fs.mkdirSync(path.join(OUT, "cards"), { recursive: true });
fs.mkdirSync(path.join(OUT, "overlays"), { recursive: true });
fs.writeFileSync(path.join(OUT, "timing.json"), JSON.stringify({ total, fps: FPS, PRE, POST, XF, phone: PHONE, loops: LOOPS, meta: META, scenes: timing }, null, 1));
console.log(`total ${total.toFixed(1)}s`);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: W, height: H } });
let n = 0;
for (const [i, s] of SCENES.entries()) {
  if (s.type === "ai") for (const [k, cp] of (timing[i].captions).entries()) { const g = GRADS[n++ % GRADS.length]; await shot(page, `<div class=cap style='--g:${g}'>${esc(cp.text)}</div>`, `cap-${s.key}-${k}`); }
}
await shot(page, `<div class=logo><img src='data:image/png;base64,${MARK}'><span>snapfront</span></div>`, "end-logo");
await shot(page, `<div class=tag>${esc(META.tag)}</div>`, "end-tag");
await shot(page, "<div style='width:1300px;height:900px;background:radial-gradient(closest-side,rgba(0,0,0,.82),rgba(0,0,0,.55) 55%,rgba(0,0,0,0))'></div>", "end-shade");
await shot(page, `<div class=cta>${esc(META.cta)} &rarr;</div>`, "end-cta");
await shot(page, `<div class=bug><img src='data:image/png;base64,${MARK}'><span>snapfront</span></div>`, "bug");
for (const [i, s] of SCENES.entries()) {
  if (!["card", "screen", "loop"].includes(s.type) || (ONLY.length && !ONLY.includes(s.key))) continue;
  await renderScene(page, s, timing[i]);
}
await browser.close();

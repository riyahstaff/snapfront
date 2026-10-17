// Records the app demos shown in Academy lessons taught by the avatar, and uploads them.
//
// It runs a private copy of the Snapfront server with a demo store ("Glow Lab", example data only,
// never real users), opens the web app in a phone-sized browser, plays each slide's `screen` steps
// from server/src/academy-content.js (tap, scroll, highlight, type) with a visible tap and highlight,
// and saves each as an H.264 MP4. With --upload it sends them to the live server, which puts them in
// the lesson videos.
//
//   cd tools/academy-screens && npm install
//   node record.mjs                       # record every demo into ./out
//   node record.mjs --lesson partner      # one lesson
//   ACADEMY_STUDIO_TOKEN=... node record.mjs --lesson partner --upload
//
// ACADEMY_API (default https://snapfront.app) is where recordings are uploaded.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { chromium } from "playwright-core";

const here = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(here, "../../server");
const arg = (name) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : null; };
const flag = (name) => process.argv.includes(`--${name}`);
const ONLY_LESSON = arg("lesson"), ONLY_SLIDE = arg("slide") != null ? Number(arg("slide")) : null;
const OUT = path.resolve(arg("out") || path.join(here, "out"));
const UPLOAD = flag("upload");
const API = (process.env.ACADEMY_API || "https://snapfront.app").replace(/\/$/, "");
const TOKEN = String(process.env.ACADEMY_STUDIO_TOKEN || "").trim();
if (UPLOAD && TOKEN.length < 24) { console.error("Set ACADEMY_STUDIO_TOKEN to upload."); process.exit(1); }

/* ---------- a private server with demo data ---------- */
const PORT = 18000 + Math.floor(Math.random() * 1000);
const data = fs.mkdtempSync(path.join(os.tmpdir(), "academy-screens-"));
Object.assign(process.env, {
  // Links in the app read snapfront.app, like the real thing; those requests are answered locally too.
  DATA_DIR: data, PORT: String(PORT), PUBLIC_URL: "https://snapfront.app", STORE_DOMAIN: "sf.localhost",
  ACADEMY_AUTOBUILD: "false", ADMIN_TOKEN: "", ANTHROPIC_API_KEY: "", RUNPOD_API_KEY: "", ELEVENLABS_API_KEY: "", STRIPE_SECRET_KEY: "", OWNER_EMAILS: "",
});
const { app } = await import(path.join(serverDir, "src/index.js"));
const { db } = await import(path.join(serverDir, "src/db.js"));
const partners = await import(path.join(serverDir, "src/partners.js"));
const plans = await import(path.join(serverDir, "src/plans.js"));
const { LESSONS } = await import(path.join(serverDir, "src/academy-content.js"));
const serverRequire = createRequire(path.join(serverDir, "package.json"));
const sharp = serverRequire("sharp");
const ffmpegPath = serverRequire("ffmpeg-static");
const server = app.listen(PORT);
await new Promise((ok) => server.once("listening", ok));
const local = `http://127.0.0.1:${PORT}`;

async function api(method, url, body, token) {
  const r = await fetch(local + url, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const text = await r.text();
  if (!r.ok) throw new Error(`${method} ${url} ${r.status} ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}
/** The demo store: a Pro member with a few products, signed in with an example email, already a partner. */
async function demoStore() {
  const s = await api("POST", "/api/sellers", { store_name: "Glow Lab" });
  const me = await api("PATCH", "/api/me", { store_name: "Glow Lab" }, s.token);
  db.prepare("UPDATE accounts SET plan = 'pro', email = 'demo@example.com' WHERE id = (SELECT account_id FROM sellers WHERE id = ?)").run(me.id);
  const products = [["Glow Serum", "#E9D6C4", 46], ["Silk Sleep Mask", "#CFC6E6", 28], ["Daily SPF Mist", "#F2E2B8", 32]];
  for (const [title, color, price] of products) {
    const file = `${title.toLowerCase().replace(/\W+/g, "-")}.jpg`;
    fs.writeFileSync(path.join(data, "images", file), await sharp({ create: { width: 900, height: 900, channels: 3, background: color } }).jpeg().toBuffer());
    db.prepare("INSERT INTO seller_media (image_file, seller_id) VALUES (?,?)").run(file, me.id);
    await api("POST", "/api/products", { title, tagline: "Loved by our customers", price, kind: "physical", image_file: file, description: "A demo product." }, s.token);
  }
  const account = plans.accountForToken(s.token);
  partners.join(account, { agree: true, code: "GLOWLAB" });
  // A few link clicks so the stats aren't empty. No sales: lessons don't show made-up earnings.
  for (let i = 0; i < 12; i++) db.prepare("INSERT OR IGNORE INTO partner_clicks (code, day, visitor) VALUES (?,?,?)").run("GLOWLAB", new Date(Date.now() - (i % 5) * 864e5).toISOString().slice(0, 10), `v${i}`);
  return s.token;
}

/* ---------- the browser ---------- */
// The web app talks to https://snapfront.app; those calls are answered by the private server instead.
async function routeApi(context) {
  const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS" };
  await context.route(/^https:\/\/snapfront\.app\//, async (route) => {
    const req = route.request();
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
    const url = req.url().replace(/^https:\/\/snapfront\.app/, local);
    const headers = { ...req.headers() };
    delete headers.host; delete headers.origin;
    const res = await fetch(url, { method: req.method(), headers, body: ["GET", "HEAD"].includes(req.method()) ? undefined : req.postDataBuffer() });
    const body = Buffer.from(await res.arrayBuffer());
    const h = Object.fromEntries([...res.headers.entries()].filter(([k]) => !["content-encoding", "content-length", "transfer-encoding"].includes(k)));
    return route.fulfill({ status: res.status, headers: { ...h, ...cors }, body });
  });
}
// A visible finger tap and a highlight ring, so viewers can follow along.
const HELPERS = `
window.__sfCard = (el) => { let n = el; for (let i = 0; i < 7 && n && n.parentElement; i++) { const cs = getComputedStyle(n); if (parseFloat(cs.borderTopWidth) > 0 && parseFloat(cs.borderTopLeftRadius) >= 8 && n.getBoundingClientRect().width > 200) return n; n = n.parentElement; } return el; };
window.__sfRing = (r, ms) => { const d = document.createElement('div'); Object.assign(d.style, { position: 'fixed', left: (r.x - 6) + 'px', top: (r.y - 6) + 'px', width: (r.width + 12) + 'px', height: (r.height + 12) + 'px', border: '3px solid #8AB4FF', borderRadius: '16px', boxShadow: '0 0 0 9999px rgba(0,0,0,0.38), 0 0 24px rgba(138,180,255,0.6)', pointerEvents: 'none', zIndex: 2147483646, opacity: '0', transition: 'opacity .25s' }); document.body.appendChild(d); requestAnimationFrame(() => { d.style.opacity = '1'; }); setTimeout(() => { d.style.opacity = '0'; setTimeout(() => d.remove(), 300); }, ms); };
window.__sfTap = (x, y) => { const d = document.createElement('div'); Object.assign(d.style, { position: 'fixed', left: (x - 26) + 'px', top: (y - 26) + 'px', width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(255,255,255,0.35)', border: '3px solid rgba(255,255,255,0.95)', boxShadow: '0 0 0 8px rgba(138,180,255,0.35)', pointerEvents: 'none', zIndex: 2147483647, transform: 'scale(1.25)', transition: 'transform .25s ease-out, opacity .45s ease-in .35s' }); document.body.appendChild(d); requestAnimationFrame(() => { d.style.transform = 'scale(0.8)'; d.style.opacity = '0'; }); setTimeout(() => d.remove(), 900); };
window.__sfScroll = (el) => { let p = el.parentElement; while (p && !(p.scrollHeight > p.clientHeight + 4 && /(auto|scroll)/.test(getComputedStyle(p).overflowY))) p = p.parentElement; const box = el.getBoundingClientRect(); const top = p ? p.getBoundingClientRect().top : 0; (p || document.scrollingElement).scrollBy({ top: box.top - top - 96, behavior: 'smooth' }); };
`;
const find = (page, target) => (typeof target === "string" ? page.getByText(target, { exact: true }).first() : page.getByLabel(target.label, { exact: true }).first());
async function runStep(page, [kind, target]) {
  if (kind === "wait") return page.waitForTimeout(Number(target) * 1000);
  if (kind === "type") return page.keyboard.type(String(target), { delay: 85 });
  const el = find(page, target);
  await el.waitFor({ state: "visible", timeout: 15000 });
  if (kind === "scroll") { await el.evaluate((n) => window.__sfScroll(n)); return page.waitForTimeout(900); }
  if (kind === "highlight") {
    const box = await el.evaluate((n) => { const c = window.__sfCard(n); c.scrollIntoView({ block: "nearest", behavior: "smooth" }); const r = c.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
    await page.waitForTimeout(250);
    await page.evaluate(([r]) => window.__sfRing(r, 1500), [box]);
    return page.waitForTimeout(400);
  }
  if (kind === "tap") {
    await el.scrollIntoViewIfNeeded();
    const b = await el.boundingBox();
    await page.evaluate(([r]) => window.__sfRing(r, 700), [{ x: b.x, y: b.y, width: b.width, height: b.height }]);
    await page.waitForTimeout(450);
    await page.evaluate(([x, y]) => window.__sfTap(x, y), [b.x + b.width / 2, b.y + b.height / 2]);
    await page.waitForTimeout(150);
    return el.click();
  }
  throw new Error(`unknown step ${kind}`);
}

async function record(browser, token, lesson, i, screen) {
  const dir = fs.mkdtempSync(path.join(data, "rec-"));
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, recordVideo: { dir, size: { width: 390, height: 844 } }, colorScheme: "dark" });
  await routeApi(context);
  await context.addInitScript(`try { localStorage.setItem('snapfront.token', ${JSON.stringify(token)}); } catch (e) {}\n${HELPERS}`);
  const page = await context.newPage();
  const t0 = Date.now();
  await page.goto(`http://app.sf.localhost:${PORT}${screen.route}`, { waitUntil: "networkidle" });
  await find(page, screen.ready).waitFor({ state: "visible", timeout: 30000 });
  await page.waitForTimeout(1200);
  // The recording runs a little behind the page, so start it slightly later than "ready".
  const start = (Date.now() - t0) / 1000 + 0.5;
  for (const step of screen.steps) await runStep(page, step);
  const video = page.video();
  await context.close();
  const webm = await video.path();
  const out = path.join(OUT, `${lesson}-${i}.mp4`);
  const r = spawnSync(ffmpegPath, ["-y", "-hide_banner", "-loglevel", "error", "-ss", start.toFixed(2), "-i", webm, "-vf", "scale=600:1298:flags=lanczos,setsar=1,fps=30", "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p", "-an", "-movflags", "+faststart", out]);
  if (r.status !== 0) throw new Error(`convert failed: ${String(r.stderr).slice(-300)}`);
  fs.rmSync(dir, { recursive: true, force: true });
  return out;
}

let failed = 0;
try {
  fs.mkdirSync(OUT, { recursive: true });
  const token = await demoStore();
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium" });
  for (const l of LESSONS.filter((x) => !ONLY_LESSON || x.id === ONLY_LESSON)) {
    for (const [i, s] of l.slides.entries()) {
      if (!s.screen || (ONLY_SLIDE != null && i !== ONLY_SLIDE)) continue;
      try {
        const file = await record(browser, token, l.id, i, s.screen);
        console.log(`recorded ${l.id} slide ${i}: ${path.relative(process.cwd(), file)}`);
        if (UPLOAD) {
          const r = await fetch(`${API}/api/academy-presenter/screens/${l.id}/${i}`, { method: "PUT", headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "video/mp4" }, body: fs.readFileSync(file) });
          if (!r.ok) throw new Error(`upload ${r.status} ${(await r.text()).slice(0, 200)}`);
          console.log(`  uploaded to ${API}`);
        }
      } catch (e) { failed++; console.error(`FAILED ${l.id} slide ${i}: ${e.message}`); }
    }
  }
  await browser.close();
} finally {
  server.close();
  fs.rmSync(data, { recursive: true, force: true });
}
process.exit(failed ? 1 : 0);

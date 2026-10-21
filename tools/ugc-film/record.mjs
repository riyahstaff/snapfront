// Records the UGC film's app scenes: the real Snapfront web app in a phone-sized browser, with a
// private copy of the server and a demo store ("Glow Lab", example data only, never real users).
// Same approach as tools/academy-screens. The Scripts tab shows a script the live Scripts tool really
// wrote for this demo (demo-script.json), because the private server has no AI key.
//
//   node record.mjs                 record every "screen" scene into out/screens/<key>.mp4
//   node record.mjs --only scripts  one scene
//   node record.mjs --dump /ugc     print what a page shows
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { SCENES } from "./scenes.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const serverDir = path.join(root, "server");
const arg = (name) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : null; };
const OUT = path.join(here, "out", "screens");
const PORT = 18000 + Math.floor(Math.random() * 1000);
const data = fs.mkdtempSync(path.join(os.tmpdir(), "ugc-film-"));
Object.assign(process.env, {
  DATA_DIR: data, PORT: String(PORT), PUBLIC_URL: "https://snapfront.app", STORE_DOMAIN: "sf.localhost",
  ACADEMY_AUTOBUILD: "false", ADMIN_TOKEN: "", ANTHROPIC_API_KEY: "", RUNPOD_API_KEY: "demo-only-never-called", ELEVENLABS_API_KEY: "", STRIPE_SECRET_KEY: "", OWNER_EMAILS: "",
});
const { app } = await import(path.join(serverDir, "src/index.js"));
const { db } = await import(path.join(serverDir, "src/db.js"));
const serverRequire = createRequire(path.join(serverDir, "package.json"));
const sharp = serverRequire("sharp");
const ffmpegPath = serverRequire("ffmpeg-static");
const { chromium } = createRequire(path.join(root, "tools/academy-screens/package.json"))("playwright-core");
const server = app.listen(PORT);
await new Promise((ok) => server.once("listening", ok));
const local = `http://127.0.0.1:${PORT}`;

async function api(method, url, body, token, type = "application/json") {
  const r = await fetch(local + url, { method, headers: { "Content-Type": type, ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body == null ? undefined : type === "application/json" ? JSON.stringify(body) : body });
  const text = await r.text();
  if (!r.ok) throw new Error(`${method} ${url} ${r.status} ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}
const ff = (...a) => { const r = spawnSync(ffmpegPath, ["-y", "-hide_banner", "-loglevel", "error", ...a]); if (r.status !== 0) throw new Error(String(r.stderr).slice(-400)); };

/** Glow Lab: a Pro member with three products and a published UGC page (sample videos, rates, a few deals). */
async function demoStore() {
  const s = await api("POST", "/api/sellers", { store_name: "Glow Lab" });
  const me = await api("PATCH", "/api/me", { store_name: "Glow Lab", store_slug: "glow-lab" }, s.token);
  db.prepare("UPDATE accounts SET plan = 'pro', email = 'demo@example.com' WHERE id = (SELECT account_id FROM sellers WHERE id = ?)").run(me.id);
  for (const [title, color, price] of [["Glow Serum", "#E9D6C4", 46], ["Silk Sleep Mask", "#CFC6E6", 28], ["Daily SPF Mist", "#F2E2B8", 32]]) {
    const file = `${title.toLowerCase().replace(/\W+/g, "-")}.jpg`;
    fs.writeFileSync(path.join(data, "images", file), await sharp({ create: { width: 900, height: 900, channels: 3, background: color } }).jpeg().toBuffer());
    db.prepare("INSERT INTO seller_media (image_file, seller_id) VALUES (?,?)").run(file, me.id);
    await api("POST", "/api/products", { title, tagline: "Loved by our customers", price, kind: "physical", image_file: file, description: "A demo product." }, s.token);
  }
  // Sample portfolio videos: vertical cuts of the web app's own tool animations.
  for (const loop of ["ugc", "faceless", "avatars"]) {
    const v = path.join(data, `${loop}-916.mp4`);
    ff("-i", path.join(serverDir, "assets/site/tools", `${loop}.mp4`), "-vf", "crop=ih*9/16:ih,scale=540:960", "-an", "-c:v", "libx264", "-crf", "24", "-preset", "veryfast", "-movflags", "+faststart", v);
    await api("POST", "/api/ugc/videos?title=" + encodeURIComponent({ ugc: "Serum testimonial (sample)", faceless: "Hook-first demo (sample)", avatars: "AI avatar walkthrough (sample)" }[loop]), fs.readFileSync(v), s.token, "video/mp4");
  }
  await api("PUT", "/api/ugc/profile", {
    enabled: true, name: "Maya Brooks", headline: "UGC videos for skincare and wellness brands",
    niches: ["skincare", "wellness", "home"], bio: "I make short, honest videos that feel like a friend's recommendation. Testimonials, demos and unboxings, filmed vertical and delivered in five days.",
    email: "maya@example.com", socials: { tiktok: "https://www.tiktok.com/@example", instagram: "https://www.instagram.com/example" },
    rates: [{ label: "One video (15 to 30 seconds)", price: 125 }, { label: "Three videos", price: 330 }, { label: "Paid ad usage, 3 months", price: 60 }, { label: "Raw clips", price: 50 }],
  }, s.token);
  for (const [brand, amount, status] of [["Bloom Tea", 150, "pitched"], ["Lumen Candles", 330, "talking"], ["Northside Coffee", 125, "booked"]]) {
    const d = await api("POST", "/api/ugc/deals", { brand, amount, status: "pitched" }, s.token);
    if (status !== "pitched") await api("PATCH", `/api/ugc/deals/${d.id}`, { status }, s.token).catch(() => {});
  }
  return s.token;
}

/* ---------- the browser (as in tools/academy-screens) ---------- */
const demoScript = fs.readFileSync(path.join(here, "demo-script.json"), "utf8");
async function routeApi(context) {
  const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS" };
  await context.route(/^https:\/\/snapfront\.app\//, async (route) => {
    const req = route.request();
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
    if (req.method() === "POST" && /\/api\/ugc\/script$/.test(req.url())) { await new Promise((r) => setTimeout(r, 1400)); return route.fulfill({ status: 200, headers: { ...cors, "content-type": "application/json" }, body: demoScript }); }
    const url = req.url().replace(/^https:\/\/snapfront\.app/, local);
    const headers = { ...req.headers() }; delete headers.host; delete headers.origin;
    const res = await fetch(url, { method: req.method(), headers, body: ["GET", "HEAD"].includes(req.method()) ? undefined : req.postDataBuffer() });
    let body = Buffer.from(await res.arrayBuffer());
    if (/json/.test(res.headers.get("content-type") || "")) body = Buffer.from(body.toString("utf8").replace(/http:\/\/([a-z0-9-]+\.)?sf\.localhost(:\d+)?/g, "https://$1snapfront.app").replace(/sf\.localhost(:\d+)?/g, "snapfront.app"));
    const h = Object.fromEntries([...res.headers.entries()].filter(([k]) => !["content-encoding", "content-length", "transfer-encoding"].includes(k)));
    return route.fulfill({ status: res.status, headers: { ...h, ...cors }, body });
  });
}
const helpers = fs.readFileSync(path.join(root, "tools/academy-screens/record.mjs"), "utf8").match(/const HELPERS = `([\s\S]*?)`;/)[1];
const find = (page, t) => (typeof t === "string" ? page.getByText(t, { exact: true }).first() : page.getByLabel(t.label, { exact: true }).first());
async function step(page, [kind, target]) {
  if (kind === "wait") return page.waitForTimeout(Number(target) * 1000);
  if (kind === "type") return page.keyboard.type(String(target), { delay: 70 });
  const el = find(page, target);
  await el.waitFor({ state: "visible", timeout: 15000 });
  if (kind === "scroll") { await el.evaluate((n) => window.__sfScroll(n)); return page.waitForTimeout(900); }
  if (kind === "highlight") {
    const box = await el.evaluate((n) => { const c = window.__sfCard(n); c.scrollIntoView({ block: "nearest", behavior: "smooth" }); const r = c.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
    await page.waitForTimeout(250); await page.evaluate(([r]) => window.__sfRing(r, 1500), [box]); return page.waitForTimeout(400);
  }
  if (kind === "tap") {
    await el.scrollIntoViewIfNeeded(); const b = await el.boundingBox();
    await page.evaluate(([r]) => window.__sfRing(r, 700), [{ x: b.x, y: b.y, width: b.width, height: b.height }]); await page.waitForTimeout(450);
    await page.evaluate(([x, y]) => window.__sfTap(x, y), [b.x + b.width / 2, b.y + b.height / 2]); await page.waitForTimeout(150);
    return el.click();
  }
  throw new Error(`unknown step ${kind}`);
}
const V = { width: 430, height: 932 };
const urlFor = (screen) => (screen.store ? `http://glow-lab.sf.localhost:${PORT}${screen.route}` : `http://app.sf.localhost:${PORT}${screen.route}`);
async function record(browser, token, s) {
  const dir = fs.mkdtempSync(path.join(data, "rec-"));
  const context = await browser.newContext({ viewport: V, deviceScaleFactor: 2, recordVideo: { dir, size: { width: V.width * 2, height: V.height * 2 } }, colorScheme: "dark" });
  await routeApi(context);
  await context.addInitScript(`try { localStorage.setItem('snapfront.token', ${JSON.stringify(token)}); } catch (e) {}\n${helpers}`);
  const page = await context.newPage();
  const t0 = Date.now();
  await page.goto(urlFor(s.screen), { waitUntil: "networkidle" });
  await find(page, s.screen.ready).waitFor({ state: "visible", timeout: 30000 });
  await page.waitForTimeout(1200);
  const start = (Date.now() - t0) / 1000 + 0.5;
  for (const st of s.screen.steps) await step(page, st);
  const video = page.video(); await context.close();
  const out = path.join(OUT, `${s.key}.mp4`);
  ff("-ss", start.toFixed(2), "-i", await video.path(), "-vf", "scale=860:1864:flags=lanczos,setsar=1,fps=30", "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-an", "-movflags", "+faststart", out);
  fs.rmSync(dir, { recursive: true, force: true });
  return out;
}

let failed = 0;
try {
  fs.mkdirSync(OUT, { recursive: true });
  const token = await demoStore();
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium" });
  if (arg("dump")) {
    const context = await browser.newContext({ viewport: V, colorScheme: "dark" });
    await routeApi(context);
    await context.addInitScript(`try { localStorage.setItem('snapfront.token', ${JSON.stringify(token)}); } catch (e) {}`);
    for (const r of arg("dump").split(",")) {
      const page = await context.newPage();
      await page.goto(r.startsWith("store:") ? urlFor({ store: true, route: r.slice(6) }) : urlFor({ route: r }), { waitUntil: "networkidle" }).catch(() => {});
      await page.waitForTimeout(2500);
      console.log(`\n===== ${r}\n${(await page.evaluate(() => document.body.innerText)).replace(/\n{2,}/g, "\n").slice(0, 5000)}`);
      await page.screenshot({ path: path.join(OUT, `dump-${r.replace(/\W+/g, "_")}.png`) });
      await page.close();
    }
  } else {
    for (const s of SCENES.filter((x) => x.type === "screen" && (!arg("only") || arg("only").split(",").includes(x.key)))) {
      try { console.log("recorded", path.relative(here, await record(browser, token, s))); }
      catch (e) { failed++; console.error(`FAILED ${s.key}: ${e.message}`); }
    }
  }
  await browser.close();
} finally {
  server.close();
  fs.rmSync(data, { recursive: true, force: true });
}
process.exit(failed ? 1 : 0);

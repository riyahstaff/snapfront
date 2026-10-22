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
import { SCENES, OUT as FILM_OUT, FILM } from "./film.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const serverDir = path.join(root, "server");
const arg = (name) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : null; };
const OUT = path.join(FILM_OUT, "screens");
const PORT = 18000 + Math.floor(Math.random() * 1000);
const data = fs.mkdtempSync(path.join(os.tmpdir(), "ugc-film-"));
Object.assign(process.env, {
  DATA_DIR: data, PORT: String(PORT), PUBLIC_URL: "https://snapfront.app", STORE_DOMAIN: "sf.localhost",
  ACADEMY_AUTOBUILD: "false", ADMIN_TOKEN: "", ANTHROPIC_API_KEY: "", RUNPOD_API_KEY: "demo-only-never-called", ELEVENLABS_API_KEY: "", STRIPE_SECRET_KEY: "", OWNER_EMAILS: "",
  ZERNIO_API_KEY: "demo-only-never-called",
});
const { app } = await import(path.join(serverDir, "src/index.js"));
const { db } = await import(path.join(serverDir, "src/db.js"));
const { config } = await import(path.join(serverDir, "src/config.js"));
const youtube = await import(path.join(serverDir, "src/youtube.js"));
const credits = await import(path.join(serverDir, "src/credits.js"));
const serverRequire = createRequire(path.join(serverDir, "package.json"));
const sharp = serverRequire("sharp");
const ffmpegPath = serverRequire("ffmpeg-static");
const { chromium } = createRequire(path.join(root, "tools/academy-screens/package.json"))("playwright-core");
const server = app.listen(PORT);
await new Promise((ok) => server.once("listening", ok));
const local = `http://127.0.0.1:${PORT}`;

async function api(method, url, body, token, type = "application/json") {
  const opts = { method, headers: { "Content-Type": type, ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body == null ? undefined : type === "application/json" ? JSON.stringify(body) : body };
  // A reused local connection is sometimes reset: try once more.
  const r = await fetch(local + url, opts).catch(() => new Promise((ok) => setTimeout(ok, 300)).then(() => fetch(local + url, opts)));
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
  const productPhoto = path.join(here, "out-shorts", "stills", "product.jpg");   // the shorts film's real-looking product photo
  for (const [title, color, price] of [["Glow Serum", "#E9D6C4", 46], ["Silk Sleep Mask", "#CFC6E6", 28], ["Daily SPF Mist", "#F2E2B8", 32]]) {
    const file = `${title.toLowerCase().replace(/\W+/g, "-")}.jpg`;
    // Real-looking product photos when the films have made them (out-shorts, out-promo stills).
    const photo = { "Glow Serum": productPhoto, "Daily SPF Mist": path.join(here, "out-promo", "stills", "mist.jpg"), "Silk Sleep Mask": path.join(here, "out-promo", "stills", "mask.jpg") }[title];
    fs.writeFileSync(path.join(data, "images", file), ["shorts", "promo", "real"].includes(FILM) && photo && fs.existsSync(photo)
      ? await sharp(photo).resize(1200, 1200).jpeg({ quality: 90 }).toBuffer()
      : await sharp({ create: { width: 900, height: 900, channels: 3, background: color } }).jpeg().toBuffer());
    db.prepare("INSERT INTO seller_media (image_file, seller_id) VALUES (?,?)").run(file, me.id);
    await api("POST", "/api/products", { title, tagline: "Simple daily skincare", price, kind: "physical", image_file: file, description: "A demo product." }, s.token);
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
  if (FILM === "shorts") await shortsDemo(s.token, me);
  if (FILM === "promo") await careDemo(s.token, me);
  if (FILM === "real") await realDemo(s.token, me);
  return s.token;
}

/** The video flow: an avatar, its photo with the Glow Serum, the finished video, and a connected YouTube channel. */
const ids = {};
async function shortsDemo(token, me) {
  const acct = db.prepare("SELECT account_id FROM sellers WHERE id = ?").get(me.id).account_id;
  const product = db.prepare("SELECT id FROM products WHERE seller_id = ? AND title = 'Glow Serum'").get(me.id).id;
  const copy = (from, dir, name) => { fs.mkdirSync(path.join(data, dir), { recursive: true }); fs.copyFileSync(path.join(FILM_OUT, from), path.join(data, dir, name)); return name; };
  const avatarImg = copy("stills/avatar.jpg", "images", "demo-avatar-juniper.jpg");
  const shotImg = copy("stills/shot.jpg", "images", "demo-shot-juniper-serum.jpg");
  const clip = path.join(data, "media", "demo-avatar-video.mp4");
  fs.mkdirSync(path.dirname(clip), { recursive: true });
  // VP9 (in MP4): the recording browser (Chromium) can't play H.264.
  ff("-i", path.join(FILM_OUT, "raw", "clip.mp4"), "-an", "-vf", "scale=720:-2", "-c:v", "libvpx-vp9", "-b:v", "2M", "-deadline", "realtime", "-cpu-used", "8", "-pix_fmt", "yuv420p", "-movflags", "+faststart", clip);
  db.prepare("INSERT INTO avatars (id, seller_id, account_id, name, style, look, status, image_file, source) VALUES ('av_demo_juniper', ?, ?, 'Juniper', 'soft3d', 'copper bob, freckles, mustard sweater', 'done', ?, 'ai')").run(me.id, acct, avatarImg);
  db.prepare("INSERT INTO avatar_shots (id, seller_id, account_id, avatar_id, product_id, pose, prompt, status, image_file) VALUES ('sh_demo_serum', ?, ?, 'av_demo_juniper', ?, 'present', 'holding the product up toward the viewer', 'done', ?)").run(me.id, acct, product, shotImg);
  db.prepare("INSERT INTO avatar_videos (id, seller_id, account_id, avatar_id, shot_id, kind, model, duration, resolution, prompt, credits, status, file) VALUES ('avv_demo_serum', ?, ?, 'av_demo_juniper', 'sh_demo_serum', 'motion', 'vidu', 6, '1080p', 'Show it off', 30, 'done', 'demo-avatar-video.mp4')").run(me.id, acct);
  credits.grant(acct, 120, "Demo credits");
  db.prepare("INSERT INTO youtube_subs (session_id, account_id, status, expires_at) VALUES ('cs_demo_yt', ?, 'active', datetime('now','+30 days'))").run(acct);
  db.prepare("INSERT INTO youtube_links (account_id, profile_id, zernio_account_id, username, connected_at) VALUES (?, 'demo-profile', 'demo-account', 'Glow Lab', datetime('now'))").run(acct);
  // No real posting or AI: Zernio and the writer answer with what the live ones returned for this video.
  youtube.setZernio(async (method, route) => {
    if (method === "POST" && route === "/posts") return { post: { _id: "demo_post", status: "published", platforms: [{ platform: "youtube", status: "published", platformPostUrl: "https://www.youtube.com/shorts/demo" }] } };
    return {};
  });
  const written = JSON.parse(fs.readFileSync(path.join(here, "demo-describe.json"), "utf8"));
  youtube.setDescriber(async () => { await new Promise((r) => setTimeout(r, 700)); return written; });
  Object.assign(ids, { product, video: "avv_demo_serum" });
}

/** SnapCare fixing a buyer's download: a paid digital order, and the assistant's answers (scripted:
 *  the private server has no AI key). The tools it calls are the real ones. */
async function careDemo(token, me) {
  // A finished-looking store for the Shorts: products published, and the Bloom (beauty) look.
  db.prepare("UPDATE products SET status = 'live' WHERE seller_id = ?").run(me.id);
  db.prepare("UPDATE sellers SET theme = 'bloom' WHERE id = ?").run(me.id);
  const snapcare = await import(path.join(serverDir, "src/snapcare.js"));
  snapcare.setMailer(async () => true);
  db.prepare("INSERT INTO products (id, seller_id, slug, title, tagline, price_cents, kind, status) VALUES ('p_demo_planner', ?, 'glow-routine-planner', 'Glow Routine Planner', 'A 30-day skincare planner', 1200, 'digital', 'live')").run(me.id);
  db.prepare("INSERT INTO orders (id, seller_id, status, items, subtotal_cents, total_cents, email, paid_at) VALUES ('ord_7Q2K', ?, 'paid', ?, 1200, 1200, 'jordan@example.com', datetime('now','-2 hours'))")
    .run(me.id, JSON.stringify([{ kind: "digital", title: "Glow Routine Planner", product_id: "p_demo_planner", quantity: 1 }]));
  let turn = 0;
  snapcare.setReplier(async ({ messages }) => {
    turn++;
    if (turn === 1) return { stop_reason: "tool_use", content: [{ type: "tool_use", id: "c1", name: "recent_activity", input: { kind: "orders" } }] };
    if (turn === 2) return { stop_reason: "tool_use", content: [{ type: "tool_use", id: "c2", name: "order_download_links", input: { order_id: "ord_7Q2K" } }] };
    if (turn === 3) {
      let link = "";
      try { link = JSON.parse(messages.at(-1).content[0].content).links[0].url; } catch { /* shown without a link */ }
      await new Promise((r) => setTimeout(r, 900));
      return { stop_reason: "end_turn", content: [{ type: "text", text: `I found it: order ord_7Q2K from jordan@example.com, paid 2 hours ago, for **Glow Routine Planner**.\n\nHere's a fresh download link, good for 7 days:\n${link}\n\nSend it to your buyer, or I can resend their order email now.` }] };
    }
    if (turn === 4) return { stop_reason: "tool_use", content: [{ type: "tool_use", id: "c3", name: "create_ticket", input: { kind: "help", summary: "Wants payouts checked", details: "Member asked the team to check their Stripe payouts." } }] };
    await new Promise((r) => setTimeout(r, 900));
    return { stop_reason: "end_turn", content: [{ type: "text", text: "Payouts are handled in your Stripe account, so I've passed this to the Snapfront team. They'll reply by email and right here in this chat." }] };
  });
}

/** The real-people Shorts: a live Bloom store, a finished faceless video, an email list with a sent
 *  email and the welcome email on, and a partner account. The AI answers are prepared (demo-real.json):
 *  the private server has no AI key, so each AI request gets its prepared answer (see FAKE_AI). */
const realFakes = fs.existsSync(path.join(here, "demo-real.json")) ? JSON.parse(fs.readFileSync(path.join(here, "demo-real.json"), "utf8")) : {};
async function realDemo(token, me) {
  db.prepare("UPDATE products SET status = 'live' WHERE seller_id = ?").run(me.id);
  db.prepare("UPDATE sellers SET theme = 'bloom', signup_enabled = 1, mail_address = '100 Example Street, Austin, TX 78701' WHERE id = ?").run(me.id);
  const serum = db.prepare("SELECT id FROM products WHERE seller_id = ? AND title = 'Glow Serum'").get(me.id).id;
  // A finished faceless video for Glow Serum, drawn with the app's own slide maker (VP9: Chromium can't play H.264).
  const faceless = await import(path.join(serverDir, "src/faceless.js"));
  const f = realFakes.faceless;
  const photos = ["glow-serum.jpg", "daily-spf-mist.jpg", "silk-sleep-mask.jpg"].map((x) => path.join(data, "images", x));
  const frames = [];
  for (const [i, sc] of f.scenes.slice(0, 4).entries()) {
    const png = path.join(data, `fl-${i}.png`);
    fs.writeFileSync(png, await faceless.slide(photos[i === 0 ? 0 : i % photos.length], i, sc.text, { big: i === 0 }));
    frames.push(png);
  }
  fs.mkdirSync(path.join(data, "media"), { recursive: true });
  const clip = path.join(data, "media", "demo-faceless.mp4");
  const ins = frames.flatMap((p) => ["-i", p]);   // one picture each; zoompan makes 66 frames (2.2 s) from it
  const fc = frames.map((_, i) => `[${i}:v]scale=720:1280,zoompan=z='1+0.0012*on':d=66:s=720x1280:fps=30,setsar=1[v${i}]`).join(";") + ";" + frames.map((_, i) => `[v${i}]`).join("") + `concat=n=${frames.length}:v=1:a=0[o]`;
  ff(...ins, "-filter_complex", fc, "-map", "[o]", "-c:v", "libvpx-vp9", "-b:v", "2M", "-deadline", "realtime", "-cpu-used", "8", "-pix_fmt", "yuv420p", "-movflags", "+faststart", clip);
  db.prepare("INSERT INTO faceless_jobs (id, seller_id, product_id, status, script, voice, file, seconds, created_at) VALUES ('fvid_demo', ?, ?, 'done', ?, 'af_heart', 'demo-faceless.mp4', 24, datetime('now','-1 day'))")
    .run(me.id, serum, JSON.stringify({ hook: f.hook, scenes: f.scenes, cta: f.cta, caption: f.caption, hashtags: f.hashtags }));
  // The email list: people who signed up in the store or opted in at checkout (example addresses).
  const names = ["Ava", "Ben", "Chloe", "Dev", "Elena", "Femi", "Grace", "Hugo", "Isla", "Jon", "Kemi", "Leo", "Maya", "Nina", "Omar", "Pia", "Quinn", "Rosa", "Sam", "Tara", "Uma", "Vic", "Wren", "Yara", "Zane"];
  const sub = db.prepare("INSERT INTO subscribers (id, seller_id, email, name, source, created_at) VALUES (?,?,?,?,?, datetime('now', ?))");
  names.forEach((n, i) => sub.run(`sub_demo_${i}`, me.id, `${n.toLowerCase()}@example.com`, n, i % 3 === 0 ? "checkout" : "form", `-${i * 26 + 3} hours`));
  db.prepare("INSERT INTO email_campaigns (id, seller_id, subject, preheader, body, cta_label, audience, status, recipients, created_at, send_at) VALUES ('cmp_demo', ?, 'The Glow Serum is back in stock', 'Your skin will thank you', 'Hi {name},\n\nGood news: the Glow Serum is back.', 'Shop now', 'all', 'sent', 22, datetime('now','-3 days'), datetime('now','-3 days'))").run(me.id);
  try { db.prepare("UPDATE email_campaigns SET sent_at = datetime('now','-3 days') WHERE id = 'cmp_demo'").run(); } catch { /* older schema */ }
  const send = db.prepare("INSERT INTO email_sends (id, seller_id, campaign_id, subscriber_id, email, status, sent_at, opened_at, clicked_at) VALUES (?,?, 'cmp_demo', ?, ?, 'sent', datetime('now','-3 days'), ?, ?)");
  names.slice(0, 22).forEach((n, i) => send.run(`snd_demo_${i}`, me.id, `sub_demo_${i}`, `${n.toLowerCase()}@example.com`, i % 2 === 0 || i % 5 === 1 ? "2026-10-19 10:00:00" : null, i % 4 === 0 ? "2026-10-19 10:05:00" : null));
  await api("PUT", "/api/email/flows/welcome", { enabled: true }, token);
  // The partner program: joined, with a link.
  await api("POST", "/api/partners/join", { agree: true }, token).catch((e) => console.error("partner join:", e.message));
  Object.assign(ids, { product: serum });
}

/* ---------- the browser (as in tools/academy-screens) ---------- */
const demoScript = fs.readFileSync(path.join(here, "demo-script.json"), "utf8");
const FAKE_AI = [[/\/api\/ai\/product-from-photo$/, "photo"], [/\/api\/marketing\/copy$/, "copy"], [/\/api\/faceless\/script$/, "faceless"]];
async function routeApi(context) {
  const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS" };
  await context.route(/^https:\/\/snapfront\.app\//, async (route) => {
    const req = route.request();
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
    if (req.method() === "POST" && /\/api\/ugc\/script$/.test(req.url())) { await new Promise((r) => setTimeout(r, 1400)); return route.fulfill({ status: 200, headers: { ...cors, "content-type": "application/json" }, body: demoScript }); }
    // Prepared AI answers: the server runs its real route (saving the photo, checking the product, cleaning
    // the answer) with the app's test hook handing askJson the prepared JSON.
    const fake = req.method() === "POST" && FAKE_AI.find(([re]) => re.test(req.url()));
    if (fake) { await new Promise((r) => setTimeout(r, 1600)); process.env.SNAPFRONT_FAKE_AI = JSON.stringify(realFakes[fake[1]]); }
    // Graphics print the store's address: draw them with the live one (glow-lab.snapfront.app), not the test server's.
    const live = /\/api\/marketing\/render$/.test(req.url());
    if (live) config.storeDomain = "snapfront.app";
    const url = req.url().replace(/^https:\/\/snapfront\.app/, local);
    const headers = { ...req.headers() }; delete headers.host; delete headers.origin;
    const res = await fetch(url, { method: req.method(), headers, body: ["GET", "HEAD"].includes(req.method()) ? undefined : req.postDataBuffer() })
      .finally(() => { if (fake) delete process.env.SNAPFRONT_FAKE_AI; if (live) config.storeDomain = "sf.localhost"; });
    let body = Buffer.from(await res.arrayBuffer());
    if (/json/.test(res.headers.get("content-type") || "")) body = Buffer.from(body.toString("utf8").replace(/http:\/\/([a-z0-9-]+\.)?sf\.localhost(:\d+)?/g, "https://$1snapfront.app").replace(/sf\.localhost(:\d+)?/g, "snapfront.app"));
    const h = Object.fromEntries([...res.headers.entries()].filter(([k]) => !["content-encoding", "content-length", "transfer-encoding"].includes(k)));
    return route.fulfill({ status: res.status, headers: { ...h, ...cors }, body });
  });
}
const helpers = fs.readFileSync(path.join(root, "tools/academy-screens/record.mjs"), "utf8").match(/const HELPERS = `([\s\S]*?)`;/)[1];
const find = (page, t) => (typeof t === "string" ? page.getByText(t, { exact: true }).first() : page.getByLabel(t.label, { exact: true }).first());
const marks = {};
async function step(page, [kind, target]) {
  if (kind === "wait") return page.waitForTimeout(Number(target) * 1000);
  if (kind === "mark") { marks[target] = Date.now(); return; }
  // Start the page's videos (muted, so the browser allows it).
  if (kind === "play") return page.evaluate(() => { for (const v of document.querySelectorAll("video")) { v.muted = true; v.loop = true; v.play().catch(() => {}); } });
  // Tap the photo frame, pick "Choose from library" and hand the file picker the demo photo.
  if (kind === "photo") {
    await step(page, ["tap", target]);
    await page.waitForTimeout(700);
    const [chooser] = await Promise.all([page.waitForEvent("filechooser", { timeout: 15000 }), step(page, ["tap", "Choose from library"])])
      .catch(async (e) => { await page.screenshot({ path: path.join(OUT, "photo-step-failed.png") }); throw e; });
    return chooser.setFiles(path.join(FILM_OUT, "stills", "candle.jpg"));
  }
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
// Routes can name the demo's product and video: /product/{product}, ?id={video}.
const fill = (route) => route.replace(/\{(\w+)\}/g, (_, k) => encodeURIComponent(ids[k] ?? ""));
const urlFor = (screen) => (screen.store ? `http://glow-lab.sf.localhost:${PORT}${fill(screen.route)}` : `http://app.sf.localhost:${PORT}${fill(screen.route)}`);
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
  for (const k of Object.keys(marks)) delete marks[k];
  for (const st of s.screen.steps) await step(page, st);
  // Where each marked moment falls in the finished recording (a beat's `from` can name one).
  fs.writeFileSync(path.join(OUT, `${s.key}.marks.json`), JSON.stringify(Object.fromEntries(Object.entries(marks).map(([k, t]) => [k, Math.max(0, (t - t0) / 1000 - start)]))));
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

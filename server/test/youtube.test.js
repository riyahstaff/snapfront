// YouTube Shorts add-on: members pay $24.99 a month through Stripe, connect their own channel through
// Zernio, and post their finished videos. The channel is read back from Zernio, videos must be the
// member's own, and avatar videos are always labelled as AI-made.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-yt-"));
Object.assign(process.env, { DATA_DIR: tmp, PUBLIC_URL: "https://yt.test", STORE_DOMAIN: "yt.test", STRIPE_SECRET_KEY: "sk_test_fake", ZERNIO_API_KEY: "zk_test", OWNER_EMAILS: "" });
const { app } = await import("../src/index.js");
const pay = await import("../src/payments.js");
const youtube = await import("../src/youtube.js");
const { db } = await import("../src/db.js");

const sessions = new Map(), subs = new Map();
pay.setStripeClient({
  customers: { async create(p) { return { id: `cus_${Math.random().toString(36).slice(2, 8)}`, ...p }; } },
  checkout: { sessions: {
    async create(p) { const id = `cs_yt_${sessions.size + 1}`; const s = { id, url: `https://checkout.stripe.com/c/${id}`, status: "open", ...p }; sessions.set(id, s); return s; },
    async retrieve(id) { return sessions.get(id); },
  } },
  subscriptions: { async retrieve(id) { return subs.get(id); }, async cancel(id) { subs.get(id).status = "canceled"; return subs.get(id); } },
  billingPortal: { sessions: { async create() { return { url: "https://billing.stripe.com/p/x" }; } } },
});
const calls = [];
const zState = { accounts: [] };
const zernioMock = async (method, route, body) => {
  calls.push({ method, route, body });
  if (method === "GET" && route.startsWith("/profiles")) return { profiles: [] };
  if (method === "POST" && route === "/profiles") return { profile: { _id: "prof_1", externalId: body.externalId } };
  if (method === "GET" && route.startsWith("/connect/youtube")) return { authUrl: "https://accounts.google.com/o/oauth2/auth?x=1", state: "s" };
  if (method === "GET" && route.startsWith("/accounts")) return { accounts: zState.accounts };
  if (method === "POST" && route === "/posts") return { post: { _id: "zp_1", status: "published", platforms: [{ platform: "youtube", status: "published", platformPostUrl: "https://www.youtube.com/watch?v=abc123" }] } };
  if (method === "DELETE") return {};
  throw new Error(`unexpected ${method} ${route}`);
};
youtube.setZernio(zernioMock);

let base, server;
before(async () => { server = app.listen(0); await new Promise((r) => server.once("listening", r)); base = `http://127.0.0.1:${server.address().port}`; });
after(() => { server?.close(); fs.rmSync(tmp, { recursive: true, force: true }); });
const call = async (token, method, url, body) => { const r = await fetch(base + url, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined }); const text = await r.text(); return { status: r.status, json: text ? JSON.parse(text) : null }; };
async function member(pro = true) {
  const s = (await call(null, "POST", "/api/sellers", {})).json;
  if (pro) db.prepare("UPDATE accounts SET plan = 'pro', email = ? WHERE id = ?").run(`${s.account.id}@example.com`, s.account.id);
  return s;
}

let m;
test("the add-on needs a membership and a Stripe subscription at $24.99 a month", async () => {
  const free = await member(false);
  assert.equal((await call(free.token, "POST", "/api/youtube/checkout")).status, 402);
  m = await member();
  let st = (await call(m.token, "GET", "/api/youtube")).json;
  assert.deepEqual([st.enabled, st.price, st.subscribed, st.connected], [true, "$24.99", false, null]);
  assert.equal((await call(m.token, "POST", "/api/youtube/connect")).status, 402, "no channel before paying");
  const co = (await call(m.token, "POST", "/api/youtube/checkout")).json;
  const s = [...sessions.values()].at(-1);
  assert.equal(co.url, s.url);
  assert.equal(s.mode, "subscription");
  assert.equal(s.line_items[0].price_data.unit_amount, 2499);
  assert.deepEqual(s.line_items[0].price_data.recurring, { interval: "month" });
  assert.equal(s.metadata.snapfront_addon, "youtube");
  Object.assign(s, { status: "complete", subscription: "sub_yt" });
  subs.set("sub_yt", { id: "sub_yt", status: "active", current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400 });
  st = (await call(m.token, "POST", "/api/youtube/confirm", { session_id: s.id })).json;
  assert.equal(st.subscribed, true);
  assert.equal((await call(m.token, "POST", "/api/youtube/checkout")).status, 409, "no second subscription");
});

test("someone else's checkout can't switch it on", async () => {
  const other = await member();
  const s = [...sessions.values()].at(-1);
  assert.equal((await call(other.token, "POST", "/api/youtube/confirm", { session_id: s.id })).status, 404);
  assert.equal((await call(other.token, "GET", "/api/youtube")).json.subscribed, false);
});

test("connecting makes one Zernio profile per account and reads the channel back from Zernio", async () => {
  const r = (await call(m.token, "POST", "/api/youtube/connect")).json;
  assert.match(r.url, /^https:\/\/accounts\.google\.com\//);
  const prof = calls.find((c) => c.method === "POST" && c.route === "/profiles");
  assert.equal(prof.body.externalId, m.account.id);
  const conn = calls.find((c) => c.route.startsWith("/connect/youtube"));
  assert.match(conn.route, /profileId=prof_1/);
  assert.match(decodeURIComponent(conn.route), /redirect_url=https:\/\/app\.yt\.test\/youtube\?connected=1/);
  // Before the member finishes on Google, nothing is connected; after, Zernio says which channel.
  assert.equal((await call(m.token, "POST", "/api/youtube/sync")).json.connected, null);
  zState.accounts = [{ _id: "zacc_1", platform: "youtube", displayName: "Glow Lab TV", profileId: "prof_1" }, { _id: "zacc_x", platform: "tiktok" }];
  assert.deepEqual((await call(m.token, "POST", "/api/youtube/sync")).json.connected, { username: "Glow Lab TV" });
  assert.match(calls.findLast((c) => c.route.startsWith("/accounts")).route, /includeOverLimit=true/);
});

test("the account id on Zernio's return link is only a hint: another profile's channel is never taken", async () => {
  const before = zState.accounts;
  // The profile-filtered list misses it; the hint finds an account, but it belongs to someone else's profile.
  zState.accounts = [];
  const search = { _id: "aaaaaaaaaaaaaaaaaaaaaaaa", platform: "youtube", displayName: "Someone Else", profileId: { _id: "prof_other" } };
  youtube.setZernio(async (method, route, body) => {
    calls.push({ method, route, body });
    if (route.startsWith("/accounts?search=")) return { accounts: [search] };
    if (route.startsWith("/accounts")) return { accounts: zState.accounts };
    throw new Error(`unexpected ${method} ${route}`);
  });
  assert.equal((await call(m.token, "POST", "/api/youtube/sync", { account_id: search._id })).json.connected, null);
  // The same hint on the member's own profile is accepted.
  search.profileId = { _id: "prof_1" };
  assert.deepEqual((await call(m.token, "POST", "/api/youtube/sync", { account_id: search._id })).json.connected, { username: "Someone Else" });
  zState.accounts = before;
  youtube.setZernio(zernioMock);
  await call(m.token, "POST", "/api/youtube/sync");
});

test("posting sends only the member's own finished videos, and avatar videos are labelled as AI", async () => {
  db.prepare("INSERT INTO faceless_jobs (id, seller_id, status, script, voice, file, seconds) VALUES ('fv1', ?, 'done', ?, 'af_heart', 'fv1-abc.mp4', 24)").run(m.seller.id, JSON.stringify({ hook: "3 reasons to love it", scenes: [], caption: "My serum", hashtags: ["skincare"] }));
  db.prepare("INSERT INTO avatar_videos (id, seller_id, account_id, kind, model, resolution, prompt, credits, status, file) VALUES ('avv1', ?, ?, 'talk', 'm', '720*1280', 'Presenting the serum', 0, 'done', 'avv1-xyz.mp4')").run(m.seller.id, m.account.id);
  const st = (await call(m.token, "GET", "/api/youtube")).json;
  assert.deepEqual(st.videos.map((v) => [v.source, v.id]).sort(), [["avatar", "avv1"], ["faceless", "fv1"]]);
  assert.match(st.videos.find((v) => v.id === "fv1").description, /#skincare[\s\S]*#Shorts/);

  const stranger = await member();
  assert.equal((await call(stranger.token, "POST", "/api/youtube/posts", { source: "faceless", id: "fv1", title: "Mine now" })).status, 402);
  assert.equal((await call(m.token, "POST", "/api/youtube/posts", { source: "faceless", id: "nope", title: "Missing" })).status, 404);
  assert.equal((await call(m.token, "POST", "/api/youtube/posts", { source: "faceless", id: "fv1", title: "x" })).status, 400, "needs a real title");

  const p = await call(m.token, "POST", "/api/youtube/posts", { source: "avatar", id: "avv1", title: "Meet the serum", description: "#Shorts", visibility: "unlisted", ai: false });
  assert.equal(p.status, 201);
  assert.deepEqual([p.json.status, p.json.url], ["published", "https://www.youtube.com/watch?v=abc123"]);
  const sent = calls.findLast((c) => c.route === "/posts").body;
  assert.equal(sent.mediaItems[0].url, "https://yt.test/media/avv1-xyz.mp4");
  assert.deepEqual(sent.platforms[0], { platform: "youtube", accountId: "zacc_1", platformSpecificData: { title: "Meet the serum", visibility: "unlisted", madeForKids: false, containsSyntheticMedia: true } });
  assert.equal(sent.publishNow, true);
  assert.equal((await call(m.token, "GET", "/api/youtube")).json.posts[0].url, "https://www.youtube.com/watch?v=abc123");
});

const ffmpegPath = (await import("ffmpeg-static")).default;
const { spawnSync } = await import("node:child_process");
function makeVideo(name, seconds, size, ext = "mp4") {
  const file = path.join(tmp, `${name}.${ext}`);
  const r = spawnSync(ffmpegPath, ["-y", "-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", `testsrc=size=${size}:rate=5`, "-t", String(seconds),
    ...(ext === "webm" ? ["-c:v", "libvpx-vp9", "-b:v", "50k"] : ["-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p"]), file]);
  assert.equal(r.status, 0, String(r.stderr));
  return fs.readFileSync(file);
}
const putChunk = (token, id, offset, buf) => fetch(`${base}/api/youtube/uploads/${id}/chunk?offset=${offset}`, { method: "PUT", headers: { "Content-Type": "application/octet-stream", Authorization: `Bearer ${token}` }, body: buf });
async function upload(token, buf, name, type = "video/mp4") {
  const st = await call(token, "POST", "/api/youtube/uploads", { name, size: buf.length, type });
  if (st.status !== 201) return st;
  const half = Math.ceil(buf.length / 2);
  assert.equal((await putChunk(token, st.json.upload_id, 0, buf.subarray(0, half))).status, 200);
  assert.equal((await (await putChunk(token, st.json.upload_id, 0, buf.subarray(0, half))).json()).received, half, "a repeated piece is ignored");
  assert.equal((await putChunk(token, st.json.upload_id, half, buf.subarray(half))).status, 200);
  return call(token, "POST", `/api/youtube/uploads/${st.json.upload_id}/finish`);
}

test("members can upload a video of their own in pieces and post it", async () => {
  const vid = makeVideo("snapfront-promo", 2, "180x320");
  const r = await upload(m.token, vid, "snapfront_promo.mp4");
  assert.equal(r.status, 201, JSON.stringify(r.json));
  assert.deepEqual([r.json.source, r.json.title, r.json.vertical], ["upload", "snapfront promo", true]);
  assert.match(r.json.url, /^https:\/\/yt\.test\/media\/ytu-[a-f0-9]{24}\.mp4$/);
  const file = path.join(tmp, "media", r.json.url.split("/").pop());
  assert.ok(fs.existsSync(file));
  assert.equal(fs.readdirSync(path.join(tmp, "media")).filter((f) => f.endsWith(".part")).length, 0, "no leftovers");
  assert.ok((await call(m.token, "GET", "/api/youtube")).json.videos.some((v) => v.source === "upload" && v.id === r.json.id));
  const p = await call(m.token, "POST", "/api/youtube/posts", { source: "upload", id: r.json.id, title: "What Snapfront does", visibility: "unlisted" });
  assert.equal(p.status, 201, JSON.stringify(p.json));
  assert.equal(calls.findLast((c) => c.route === "/posts").body.mediaItems[0].url, r.json.url);
  // Someone else can neither post it nor delete it.
  const other = await member();
  db.prepare("INSERT INTO youtube_subs (session_id, account_id, status) VALUES ('cs_other', ?, 'active')").run(other.account.id);
  db.prepare("INSERT INTO youtube_links (account_id, profile_id, zernio_account_id) VALUES (?, 'prof_o', 'zacc_o')").run(other.account.id);
  assert.equal((await call(other.token, "POST", "/api/youtube/posts", { source: "upload", id: r.json.id, title: "Not mine" })).status, 404);
  assert.equal((await call(other.token, "DELETE", `/api/youtube/uploads/${r.json.id}`)).status, 404);
  assert.equal((await call(m.token, "DELETE", `/api/youtube/uploads/${r.json.id}`)).status, 200);
  assert.ok(!fs.existsSync(file));
});

test("uploads are checked: other people's uploads, sizes, non-videos and videos over 3 minutes", async () => {
  const vid = makeVideo("short", 1, "180x320");
  const st = (await call(m.token, "POST", "/api/youtube/uploads", { name: "a.mp4", size: vid.length, type: "video/mp4" })).json;
  const stranger = await member();
  db.prepare("INSERT INTO youtube_subs (session_id, account_id, status) VALUES ('cs_str', ?, 'active')").run(stranger.account.id);
  assert.equal((await putChunk(stranger.token, st.upload_id, 0, vid)).status, 404, "not their upload");
  assert.equal((await call(stranger.token, "POST", `/api/youtube/uploads/${st.upload_id}/finish`)).status, 404);
  assert.equal((await call(m.token, "POST", `/api/youtube/uploads/${st.upload_id}/finish`)).status, 400, "not complete yet");
  assert.equal((await call(m.token, "POST", "/api/youtube/uploads", { name: "big.mp4", size: 301 * 1024 * 1024 })).status, 413);
  assert.equal((await call(m.token, "POST", "/api/youtube/uploads", { name: "x.pdf", size: 10, type: "application/pdf" })).status, 415);
  const free = await member(false);
  assert.equal((await call(free.token, "POST", "/api/youtube/uploads", { name: "a.mp4", size: 10 })).status, 402);
  const junk = Buffer.from("this is not a video at all".repeat(40));
  assert.equal((await upload(m.token, junk, "fake.mp4")).status, 400);
  const long = makeVideo("long", 182, "64x112");
  const r = await upload(m.token, long, "long.mp4");
  assert.equal(r.status, 400);
  assert.match(r.json.error, /3 minutes or less/);
  // A WebM is converted to MP4; a wide video is flagged as not vertical.
  const w = await upload(m.token, makeVideo("wide", 1, "320x180", "webm"), "wide.webm", "video/webm");
  assert.equal(w.status, 201, JSON.stringify(w.json));
  assert.equal(w.json.vertical, false);
  assert.match(w.json.url, /\.mp4$/);
  const wfile = path.join(tmp, "media", w.json.url.split("/").pop());
  assert.match(spawnSync(ffmpegPath, ["-hide_banner", "-i", wfile]).stderr.toString(), /Video: h264/, "converted to H.264");
});

test("AI writes the title and description from frames of the member's own video", async () => {
  const r = await upload(m.token, makeVideo("candle", 3, "180x320"), "candle_demo.mp4");
  assert.equal(r.status, 201);
  let seen = null;
  youtube.setDescriber(async (content) => { seen = content; return { title: "How I <pour> soy candles at home", description: "Soy candles, start to finish.\nFollow for more.", hashtags: ["candles", "#SoyCandle", "#Shorts"], alt_titles: ["Pouring candles", "x"] }; });
  const d = await call(m.token, "POST", "/api/youtube/describe", { source: "upload", id: r.json.id, notes: "my lavender candle, 8 oz" });
  assert.equal(d.status, 200, JSON.stringify(d.json));
  assert.equal(seen.filter((c) => c.type === "image").length, 4, "four frames from the video");
  assert.ok(seen.every((c) => c.type !== "image" || (c.source.media_type === "image/jpeg" && c.source.data.length > 100)));
  assert.match(seen.at(-1).text, /my lavender candle, 8 oz/);
  assert.doesNotMatch(seen.at(-1).text, /AI avatar presenting/, "an upload isn't described as an avatar video");
  assert.equal(d.json.title, "How I pour soy candles at home", "no angle brackets");
  assert.match(d.json.description, /^Soy candles, start to finish\.\nFollow for more\.\n\n#candles #SoyCandle #Shorts$/);
  assert.deepEqual(d.json.alt_titles, ["Pouring candles"]);
  assert.equal(fs.readdirSync(path.join(tmp, "media")).filter((f) => f.startsWith("frame-")).length, 0, "frames are cleaned up");
  // For an avatar video, the writer is told the avatar never claims personal use or results.
  assert.equal((await call(m.token, "POST", "/api/youtube/describe", { source: "avatar", id: "avv1" })).status, 200);
  assert.match(seen.at(-1).text, /never write as if the presenter \(or anyone\) personally uses it/);
  // Only for the member's own videos, and only with the add-on.
  const stranger = await member();
  db.prepare("INSERT INTO youtube_subs (session_id, account_id, status) VALUES ('cs_desc', ?, 'active')").run(stranger.account.id);
  assert.equal((await call(stranger.token, "POST", "/api/youtube/describe", { source: "upload", id: r.json.id })).status, 404);
  const free = await member(false);
  assert.equal((await call(free.token, "POST", "/api/youtube/describe", { source: "upload", id: r.json.id })).status, 402);
  youtube.setDescriber(null);
});

test("phone rotation is read when deciding whether a video is vertical", () => {
  const probe = youtube.readProbe("  Duration: 00:00:12.50, start\n  Stream #0:0[0x1](und): Video: h264 (High), yuv420p, 1920x1080, 30 fps\n    Side data:\n      displaymatrix: rotation of -90.00 degrees\n");
  assert.deepEqual(probe, { seconds: 12.5, width: 1080, height: 1920, hasVideo: true, vcodec: "h264", acodec: null });
});

test("disconnecting forgets the channel; deleting the account stops the add-on", async () => {
  assert.equal((await call(m.token, "DELETE", "/api/youtube/connection")).json.connected, null);
  assert.equal((await call(m.token, "POST", "/api/youtube/posts", { source: "faceless", id: "fv1", title: "After disconnect" })).status, 409);
  await youtube.cancelAll(m.account.id);
  assert.equal(subs.get("sub_yt").status, "canceled");
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM youtube_subs WHERE account_id = ?").get(m.account.id).n, 0);
});

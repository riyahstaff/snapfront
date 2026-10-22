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
youtube.setZernio(async (method, route, body) => {
  calls.push({ method, route, body });
  if (method === "GET" && route.startsWith("/profiles")) return { profiles: [] };
  if (method === "POST" && route === "/profiles") return { profile: { _id: "prof_1", externalId: body.externalId } };
  if (method === "GET" && route.startsWith("/connect/youtube")) return { authUrl: "https://accounts.google.com/o/oauth2/auth?x=1", state: "s" };
  if (method === "GET" && route.startsWith("/accounts")) return { accounts: zState.accounts };
  if (method === "POST" && route === "/posts") return { post: { _id: "zp_1", status: "published", platforms: [{ platform: "youtube", status: "published", platformPostUrl: "https://www.youtube.com/watch?v=abc123" }] } };
  if (method === "DELETE") return {};
  throw new Error(`unexpected ${method} ${route}`);
});

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

test("disconnecting forgets the channel; deleting the account stops the add-on", async () => {
  assert.equal((await call(m.token, "DELETE", "/api/youtube/connection")).json.connected, null);
  assert.equal((await call(m.token, "POST", "/api/youtube/posts", { source: "faceless", id: "fv1", title: "After disconnect" })).status, 409);
  await youtube.cancelAll(m.account.id);
  assert.equal(subs.get("sub_yt").status, "canceled");
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM youtube_subs WHERE account_id = ?").get(m.account.id).n, 0);
});

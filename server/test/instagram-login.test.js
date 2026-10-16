// "Connect with Instagram" (Business Login for Instagram): sellers sign in with Instagram itself,
// with no Facebook Page. Posting, AutoDM replies and token renewal then go through
// graph.instagram.com with that account's own token.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-iglogin-"));
process.env.DATA_DIR = tmp;
process.env.PUBLIC_URL = "https://ig.test";
process.env.META_APP_ID = "123456";
process.env.META_APP_SECRET = "meta-app-secret";
process.env.META_LOGIN_CONFIG_ID = "";                 // only the Instagram login is set up here
process.env.INSTAGRAM_APP_ID = "998877";
process.env.INSTAGRAM_APP_SECRET = "instagram-app-secret";
process.env.META_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 9).toString("base64");
process.env.META_GRAPH_VERSION = "v26.0";
process.env.META_PUBLISHING_ENABLED = "true";
process.env.META_AUTODM_ENABLED = "true";
process.env.META_WEBHOOK_VERIFY_TOKEN = "verify";

const { app } = await import("../src/index.js");
const { db } = await import("../src/db.js");
const social = await import("../src/social.js");
const autodm = await import("../src/autodm.js");
const sharp = (await import("sharp")).default;

const IG_ID = "17841400000000001";
const calls = [];
let handler = null;
social.setMetaTransport(async (request) => {
  const u = new URL(request.url);
  const entry = { method: request.method, host: u.host, path: u.pathname.replace(/^\/v26\.0\//, "/"), headers: { ...request.headers }, form: request.form ? { ...request.form } : undefined, body: request.body };
  calls.push(entry);
  if (!handler) throw new Error(`unexpected ${request.method} ${request.url}`);
  return handler(entry);
});

let server, base, token, seller;
before(async () => {
  server = app.listen(0); await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
  const created = await (await fetch(`${base}/api/sellers`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ store_name: "Gram Shop" }) })).json();
  token = created.token;
  seller = db.prepare("SELECT * FROM sellers WHERE id = ?").get(created.seller?.id ?? created.store?.id ?? db.prepare("SELECT id FROM sellers ORDER BY rowid DESC LIMIT 1").get().id);
  db.prepare("UPDATE accounts SET comp_plan = 'pro' WHERE id = ?").run(seller.account_id);   // AutoDM is a Pro feature
});
after(() => { server.close(); fs.rmSync(tmp, { recursive: true, force: true }); });
const call = async (method, url, body, headers = {}) => {
  const r = await fetch(base + url, { method, redirect: "manual", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await r.text();
  let json = null; try { json = JSON.parse(text); } catch { /* html or empty */ }
  return { status: r.status, body: json, location: r.headers.get("location") };
};
const stateOf = (url) => new URL(url).searchParams.get("state");

// Meta's answers for a successful Instagram sign-in.
function signInGraph({ permissions = ["instagram_business_basic", "instagram_business_content_publish", "instagram_business_manage_messages", "instagram_business_manage_comments"] } = {}) {
  return (c) => {
    if (c.host === "api.instagram.com" && c.path === "/oauth/access_token") {
      assert.equal(c.method, "POST");
      assert.deepEqual(c.form, { client_id: "998877", client_secret: "instagram-app-secret", grant_type: "authorization_code", redirect_uri: "https://ig.test/social/instagram/callback", code: "the-code" });
      return { access_token: "short-token", user_id: "555", permissions };   // the flat shape Meta often returns
    }
    if (c.host === "graph.instagram.com" && c.path === "/access_token") {
      assert.deepEqual(c.form, { grant_type: "ig_exchange_token", client_secret: "instagram-app-secret", access_token: "short-token" });
      return { access_token: "long-token", token_type: "bearer", expires_in: 5183944 };
    }
    if (c.host === "graph.instagram.com" && c.path === "/me") {
      assert.equal(c.form.access_token, "long-token");
      assert.equal(c.headers.Authorization, undefined, "Instagram calls carry the token as a parameter");
      return { user_id: IG_ID, username: "snapfrontapp", account_type: "BUSINESS", id: "555" };
    }
    if (c.host === "graph.instagram.com" && c.path === "/me/subscribed_apps") {
      assert.equal(c.form.subscribed_fields, "comments,messages");
      return { success: true };
    }
    throw new Error(`unexpected ${c.method} ${c.host}${c.path}`);
  };
}

test("the Instagram button: only Instagram sign-in is offered when Facebook Login isn't set up", async () => {
  const accounts = await call("GET", "/api/social/accounts");
  assert.deepEqual(accounts.body.logins, { instagram: true, facebook: false });
  const fb = await call("POST", "/api/social/authorize", {});
  assert.equal(fb.status, 503, "Facebook Pages can't start without its login configuration");
  const r = await call("POST", "/api/social/authorize", { provider: "instagram" });
  assert.equal(r.status, 200);
  const u = new URL(r.body.url);
  assert.equal(u.origin + u.pathname, "https://www.instagram.com/oauth/authorize");
  assert.equal(u.searchParams.get("client_id"), "998877");
  assert.equal(u.searchParams.get("redirect_uri"), "https://ig.test/social/instagram/callback");
  assert.equal(u.searchParams.get("response_type"), "code");
  assert.equal(u.searchParams.get("enable_fb_login"), "false");
  assert.equal(u.searchParams.get("scope"), "instagram_business_basic,instagram_business_content_publish,instagram_business_manage_messages,instagram_business_manage_comments");
  assert.ok(stateOf(r.body.url).length > 30);
  assert.equal(r.body.redirect_url, "https://ig.test/social/meta/done", "a website connection comes back to the web page");
  const phone = await call("POST", "/api/social/authorize", { provider: "instagram" }, { "X-Snapfront-App": "android" });
  assert.equal(phone.body.redirect_url, "snapfront://marketing");
});

test("signing in saves the Instagram account (token encrypted), switches on its comments and messages, and a link works once", async () => {
  const start = await call("POST", "/api/social/authorize", { provider: "instagram" }, { "X-Snapfront-App": "android" });
  const state = stateOf(start.body.url);
  calls.length = 0; handler = signInGraph();
  // Instagram adds "#_" to the code; it isn't part of it.
  const back = await call("GET", `/social/instagram/callback?state=${encodeURIComponent(state)}&code=${encodeURIComponent("the-code#_")}`);
  assert.equal(back.status, 303);
  assert.equal(back.location, "snapfront://marketing?social=connected");
  await new Promise((r) => setTimeout(r, 50));   // webhook subscription runs just after the redirect
  assert.ok(calls.some((c) => c.path === "/me/subscribed_apps"), "AutoDM starts receiving comments and messages");

  const row = db.prepare("SELECT * FROM social_connections WHERE seller_id = ? AND platform = 'instagram'").get(seller.id);
  assert.equal(row.remote_id, IG_ID);
  assert.equal(row.auth, "instagram");
  assert.equal(row.page_id, null);
  assert.equal(row.meta_user_id, "555");
  assert.doesNotMatch(row.access_token_enc, /long-token/);
  const days = (Date.parse(row.token_expires_at) - Date.now()) / 86400_000;
  assert.ok(days > 59 && days < 61, `60-day token, got ${days}`);

  const accounts = await call("GET", "/api/social/accounts");
  assert.deepEqual(accounts.body.accounts.map(({ platform, name, status, via }) => ({ platform, name, status, via })),
    [{ platform: "instagram", name: "Instagram @snapfrontapp", status: "connected", via: "instagram" }]);

  // The same link can't be used again.
  calls.length = 0;
  const replay = await call("GET", `/social/instagram/callback?state=${encodeURIComponent(state)}&code=the-code`);
  assert.equal(replay.location, "snapfront://marketing?social=error");
  assert.equal(calls.length, 0, "an expired link never reaches Instagram");
  handler = null;
});

test("declined posting permission or a cancelled sign-in saves nothing", async () => {
  db.prepare("DELETE FROM social_connections WHERE seller_id = ?").run(seller.id);
  const start = await call("POST", "/api/social/authorize", { provider: "instagram" });
  handler = signInGraph({ permissions: "instagram_business_basic" });
  const r = await call("GET", `/social/instagram/callback?state=${encodeURIComponent(stateOf(start.body.url))}&code=the-code`);
  assert.equal(r.location, "/social/meta/done?social=error");
  const cancel = await call("POST", "/api/social/authorize", { provider: "instagram" });
  const c = await call("GET", `/social/instagram/callback?state=${encodeURIComponent(stateOf(cancel.body.url))}&error=access_denied&error_reason=user_denied`);
  assert.equal(c.location, "/social/meta/done?social=error");
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM social_connections WHERE seller_id = ?").get(seller.id).n, 0);
  // Connect again for the tests below.
  const again = await call("POST", "/api/social/authorize", { provider: "instagram" });
  handler = signInGraph();
  assert.equal((await call("GET", `/social/instagram/callback?state=${encodeURIComponent(stateOf(again.body.url))}&code=the-code`)).location, "/social/meta/done?social=connected");
  await new Promise((r2) => setTimeout(r2, 50));
  handler = null;
});

test("a post to an Instagram-login account goes through graph.instagram.com with the account's own token", async () => {
  const file = "iglogin-post.jpg";
  fs.writeFileSync(path.join(tmp, "media", file), await sharp({ create: { width: 1080, height: 1350, channels: 3, background: "#335577" } }).jpeg().toBuffer());
  const { render_id } = await social.registerRender(seller, { kind: "image", files: [{ file }] }, "post");
  const connection = db.prepare("SELECT id FROM social_connections WHERE seller_id = ? AND platform = 'instagram'").get(seller.id);
  const queued = await call("POST", "/api/social/posts", { render_id, caption: "New drop", account_ids: [connection.id], idempotency_key: `k-${crypto.randomBytes(6).toString("hex")}` });
  assert.equal(queued.status, 201, JSON.stringify(queued.body));
  const postId = queued.body.posts[0].id;
  calls.length = 0;
  let status = "FINISHED";
  handler = (c) => {
    assert.equal(c.host, "graph.instagram.com", `${c.method} ${c.path} must use the Instagram host`);
    assert.equal(c.form?.access_token, "long-token");
    assert.equal(c.headers.Authorization, undefined);
    if (c.path === `/${IG_ID}/content_publishing_limit`) return { data: [{ quota_usage: 0, config: { quota_total: 100 } }] };
    if (c.path === `/${IG_ID}/media`) { assert.equal(c.form.caption, "New drop"); assert.match(c.form.image_url, /^https:\/\/ig\.test\/media\/iglogin-post\.jpg$/); return { id: "container-1" }; }
    if (c.path === "/container-1") return { status_code: status };
    if (c.path === `/${IG_ID}/media_publish`) { assert.equal(c.form.creation_id, "container-1"); return { id: "media-1" }; }
    if (c.path === "/media-1") return { permalink: "https://www.instagram.com/p/abc/" };
    throw new Error(`unexpected ${c.method} ${c.path}`);
  };
  await social.processDue();
  db.prepare("UPDATE social_publish_jobs SET run_at = ? WHERE post_id = ?").run(new Date(Date.now() - 1000).toISOString(), postId);
  await social.processDue();
  const post = db.prepare("SELECT * FROM social_posts WHERE id = ?").get(postId);
  assert.equal(post.status, "published", post.error || "");
  assert.equal(post.remote_post_id, "media-1");
  assert.equal(post.permalink, "https://www.instagram.com/p/abc/");
  handler = null;
});

test("AutoDM replies by DM and to comments from an Instagram-login account", async () => {
  const rule = autodm.createRule(seller, { keywords: ["link"], reply: "Here you go", link_url: "https://shop.example/x", comment_reply: "Sent you a DM" });
  assert.ok(rule.id);
  calls.length = 0;
  handler = (c) => {
    assert.equal(c.host, "graph.instagram.com");
    if (c.path === `/${IG_ID}/messages`) {
      assert.equal(c.headers.Authorization, "Bearer long-token");
      assert.equal(c.headers["content-type"], "application/json");
      return { recipient_id: "x", message_id: "m" };
    }
    if (c.path === "/comment-9/replies") { assert.equal(c.form.access_token, "long-token"); assert.equal(c.form.message, "Sent you a DM"); return { id: "r" }; }
    throw new Error(`unexpected ${c.method} ${c.path}`);
  };
  const payload = { object: "instagram", entry: [{ id: IG_ID, time: 1,
    messaging: [{ sender: { id: "fan-1" }, recipient: { id: IG_ID }, message: { mid: "mid-1", text: "LINK please" } }],
    changes: [{ field: "comments", value: { id: "comment-9", text: "link?", from: { id: "fan-2", username: "fan2" }, media: { id: "media-1" } } }] }] };
  // The delivery is signed with the Instagram app secret (Instagram-login apps), and accepted.
  const raw = JSON.stringify(payload);
  const sig = `sha256=${crypto.createHmac("sha256", "instagram-app-secret").update(raw).digest("hex")}`;
  assert.equal(autodm.signatureValid(Buffer.from(raw), sig), true);
  assert.equal(autodm.signatureValid(Buffer.from(raw), `sha256=${"0".repeat(64)}`), false);
  const r = await fetch(`${base}/api/meta/webhook`, { method: "POST", headers: { "Content-Type": "application/json", "X-Hub-Signature-256": sig }, body: raw });
  assert.equal(r.status, 200);
  await new Promise((done) => setTimeout(done, 100));
  const dms = calls.filter((c) => c.path === `/${IG_ID}/messages`).map((c) => JSON.parse(c.body));
  assert.deepEqual(dms.map((d) => d.recipient).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))), [{ comment_id: "comment-9" }, { id: "fan-1" }]);
  assert.match(dms[0].message.text, /^Here you go\n\nhttps:\/\/shop\.example\/x\?utm_source=instagram$/);
  assert.equal(calls.filter((c) => c.path === "/comment-9/replies").length, 1);
  const status = autodm.status(seller);
  assert.equal(status.blocker, null);
  assert.equal(status.stats.sent, 2);
  handler = null;
});

test("tokens are renewed before their 60 days run out; a revoked one asks the seller to reconnect", async () => {
  const row = db.prepare("SELECT * FROM social_connections WHERE seller_id = ? AND auth = 'instagram'").get(seller.id);
  const soon = new Date(Date.now() + 10 * 86400_000).toISOString(), old = new Date(Date.now() - 3 * 86400_000).toISOString();
  db.prepare("UPDATE social_connections SET token_expires_at = ?, user_token_expires_at = ?, updated_at = ? WHERE id = ?").run(soon, soon, old, row.id);
  calls.length = 0;
  handler = (c) => {
    assert.equal(c.host, "graph.instagram.com");
    assert.equal(c.path, "/refresh_access_token");
    assert.deepEqual(c.form, { grant_type: "ig_refresh_token", access_token: "long-token" });
    return { access_token: "renewed-token", token_type: "bearer", expires_in: 5183944 };
  };
  assert.equal(await social.refreshInstagramTokens(), 1);
  const after1 = db.prepare("SELECT * FROM social_connections WHERE id = ?").get(row.id);
  assert.ok(Date.parse(after1.token_expires_at) > Date.now() + 59 * 86400_000);
  assert.equal(after1.status, "connected");
  // A fresh token isn't touched again.
  assert.equal(await social.refreshInstagramTokens(), 0);

  db.prepare("UPDATE social_connections SET token_expires_at = ?, updated_at = ? WHERE id = ?").run(soon, old, row.id);
  handler = () => { const e = new Error("Meta request failed"); e.status = 400; e.body = { error: { code: 190 } }; throw e; };
  assert.equal(await social.refreshInstagramTokens(), 0);
  assert.equal(db.prepare("SELECT status FROM social_connections WHERE id = ?").get(row.id).status, "reconnect_required");
  db.prepare("UPDATE social_connections SET status = 'connected' WHERE id = ?").run(row.id);
  handler = null;
});

test("each destination gets a small copy of its profile picture, only from Meta's own image hosts", async () => {
  const row = () => db.prepare("SELECT * FROM social_connections WHERE seller_id = ? AND auth = 'instagram'").get(seller.id);
  db.prepare("UPDATE social_connections SET picture_file = NULL, picture_checked_at = NULL WHERE id = ?").run(row().id);
  let pictureUrl = "https://evil.example.com/me.jpg";
  const fetched = [];
  social.setPictureFetch(async (url) => { fetched.push(url); return sharp({ create: { width: 320, height: 320, channels: 3, background: "#aa3366" } }).png().toBuffer(); });
  handler = (c) => {
    assert.equal(c.host, "graph.instagram.com");
    assert.equal(c.path, "/me");
    assert.equal(c.form.fields, "profile_picture_url");
    return { profile_picture_url: pictureUrl };
  };
  assert.equal(await social.refreshPictures({ sellerId: seller.id }), 0, "a picture from any other host is ignored");
  assert.deepEqual(fetched, []);
  pictureUrl = "https://scontent-iad3-1.cdninstagram.com/v/t51/abc.jpg?stp=1";
  assert.equal(await social.refreshPictures({ sellerId: seller.id }), 1);
  const file = row().picture_file;
  assert.match(file, /^avatar-[0-9a-f]{24}\.jpg$/);
  const meta = await sharp(path.join(tmp, "images", file)).metadata();
  assert.deepEqual([meta.format, meta.width, meta.height], ["jpeg", 160, 160]);
  const accounts = await call("GET", "/api/social/accounts");
  assert.equal(accounts.body.accounts[0].picture_url, `https://ig.test/img/${file}`);
  // Checked this week: not fetched again until next week.
  fetched.length = 0;
  assert.equal(await social.refreshPictures(), 0);
  assert.deepEqual(fetched, []);
  social.setPictureFetch(null);
  handler = null;
});

test("Instagram's signed data-deletion request removes the Instagram-login connection", async () => {
  const picture = db.prepare("SELECT picture_file FROM social_connections WHERE seller_id = ?").get(seller.id).picture_file;
  assert.ok(fs.existsSync(path.join(tmp, "images", picture)));
  const data = Buffer.from(JSON.stringify({ algorithm: "HMAC-SHA256", user_id: "555" })).toString("base64url");
  const forged = `${crypto.createHmac("sha256", "wrong").update(data).digest("base64url")}.${data}`;
  assert.throws(() => social.dataDeletion(forged), (e) => e.status === 400);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM social_connections WHERE seller_id = ?").get(seller.id).n, 1);
  const signed = `${crypto.createHmac("sha256", "instagram-app-secret").update(data).digest("base64url")}.${data}`;
  const r = social.dataDeletion(signed);
  assert.match(r.url, /^https:\/\/ig\.test\/social\/meta\/data-deletion\//);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM social_connections WHERE seller_id = ?").get(seller.id).n, 0);
  await new Promise((r) => setTimeout(r, 50));
  assert.equal(fs.existsSync(path.join(tmp, "images", picture)), false, "its saved picture is removed too");
});

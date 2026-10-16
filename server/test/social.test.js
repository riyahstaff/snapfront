import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-social-"));
process.env.DATA_DIR = tmp;
process.env.PUBLIC_URL = "https://social.test";
process.env.META_APP_ID = "123456";
process.env.META_APP_SECRET = "meta-test-app-secret";
process.env.META_LOGIN_CONFIG_ID = "business-login-config";
process.env.META_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
process.env.META_GRAPH_VERSION = "v26.0";
process.env.META_PUBLISHING_ENABLED = "true";

const { app } = await import("../src/index.js");
const { db } = await import("../src/db.js");
const social = await import("../src/social.js");
const sharp = (await import("sharp")).default;

const graphCalls = [];
let metaHandler;
const endpointOf = (request) => new URL(request.url).pathname.replace(/^\/v26\.0\//, "");
function installMeta(handler) {
  graphCalls.length = 0;
  metaHandler = handler;
}
social.setPictureFetch(false);   // profile pictures are tested in instagram-login.test.js
social.setMetaTransport(async (request) => {
  const endpoint = endpointOf(request);
  graphCalls.push({
    method: request.method,
    endpoint,
    url: request.url,
    headers: { ...request.headers },
    form: request.form ? { ...request.form } : undefined,
    body: request.body,
  });
  if (!metaHandler) throw new Error(`unexpected mocked Meta endpoint ${request.method} ${endpoint}`);
  return metaHandler(request, endpoint);
});

const grantedPermissions = ["pages_show_list", "pages_read_engagement", "pages_manage_posts", "instagram_basic", "instagram_content_publish"];
function oauthGraph(request, endpoint) {
  if (endpoint === "oauth/access_token") {
    if (request.form?.grant_type === "fb_exchange_token") {
      assert.equal(request.form.fb_exchange_token, "short-lived-code-token");
      assert.equal(request.form.client_secret, process.env.META_APP_SECRET);
      return { access_token: "long-lived-user-token" };
    }
    assert.ok(request.form?.code, "the first OAuth exchange must carry a code");
    assert.equal(request.form.redirect_uri, "https://social.test/social/meta/callback");
    return { access_token: "short-lived-code-token" };
  }
  if (endpoint === "debug_token") {
    const token = request.form?.input_token;
    assert.equal(request.form?.access_token, "123456|meta-test-app-secret");
    const expiry = Math.floor(Date.now() / 1000) + 60 * 60;
    if (token === "long-lived-user-token") return { data: { is_valid: true, app_id: "123456", user_id: "meta-user-1", expires_at: expiry, data_access_expires_at: expiry + 3600 } };
    if (token === "page-token-1") return { data: { is_valid: true, app_id: "123456", expires_at: expiry + 7200, data_access_expires_at: expiry + 10800 } };
    if (token === "page-token-2") return { data: { is_valid: true, app_id: "123456", expires_at: expiry + 14400, data_access_expires_at: expiry + 18000 } };
    throw new Error(`unexpected token debug for ${token}`);
  }
  if (endpoint === "me/permissions") {
    assert.equal(request.headers.Authorization, "Bearer long-lived-user-token");
    return { data: grantedPermissions.map((permission) => ({ permission, status: "granted" })) };
  }
  if (endpoint === "me/accounts") {
    assert.equal(request.headers.Authorization, "Bearer long-lived-user-token");
    assert.match(request.form?.fields || "", /tasks/);
    if (request.form?.after == null) {
      return {
        data: [
          { id: "page-no-publish", name: "No publish access", access_token: "should-not-be-debugged", tasks: ["ANALYZE"] },
          { id: "page-1", name: "First Page", access_token: "page-token-1", tasks: ["CREATE_CONTENT"], instagram_business_account: { id: "ig-1" } },
        ],
        paging: { cursors: { after: "page-two" } },
      };
    }
    assert.equal(request.form?.after, "page-two");
    return {
      data: [{ id: "page-2", name: "Second Page", access_token: "page-token-2", tasks: ["MANAGE"], instagram_business_account: { id: "ig-2" } }],
      paging: { cursors: { after: "page-two" } },
    };
  }
  if ((endpoint === "ig-1" || endpoint === "ig-2") && request.method === "GET") {
    assert.equal(request.headers.Authorization, "Bearer long-lived-user-token");
    assert.equal(request.form?.fields, "username");
    return { username: endpoint === "ig-1" ? "first_shop" : "second_shop" };
  }
  throw new Error(`unexpected mocked Meta endpoint ${request.method} ${endpoint}`);
}
installMeta(oauthGraph);

let server;
let base;
let seller;
let sellerToken;
let otherSeller;
let otherToken;
let facebookId;
let instagramId;
let imageRender;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => {
  server.close();
  social.setMetaTransport(null);
  fs.rmSync(tmp, { recursive: true, force: true });
});

async function call(method, url, body, { bearer = sellerToken, headers = {}, redirect } = {}) {
  const response = await fetch(base + url, {
    method,
    redirect,
    headers: { "Content-Type": "application/json", ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const type = response.headers.get("content-type") || "";
  return { status: response.status, headers: response.headers, body: type.includes("json") ? await response.json() : await response.text() };
}
async function beginAuthorization(token = sellerToken) {
  // The phone app's connection flow (the website's lands on /social/meta/done instead).
  const auth = await call("POST", "/api/social/authorize", {}, { bearer: token, headers: { "X-Snapfront-App": "android" } });
  assert.equal(auth.status, 200, JSON.stringify(auth.body));
  return new URL(auth.body.url);
}
async function finishAuthorization(token = sellerToken) {
  const login = await beginAuthorization(token);
  const callback = await call("GET", `/social/meta/callback?state=${encodeURIComponent(login.searchParams.get("state"))}&code=code-from-meta`, undefined, { bearer: null, redirect: "manual" });
  assert.equal(callback.status, 303);
  assert.equal(callback.headers.get("location"), "snapfront://marketing?social=connected");
  return login;
}
const rowFor = (postId) => db.prepare("SELECT * FROM social_posts WHERE id=?").get(postId);
const jobFor = (postId) => db.prepare("SELECT * FROM social_publish_jobs WHERE post_id=?").get(postId);
function forceDue(postId) {
  db.prepare("UPDATE social_publish_jobs SET run_at=? WHERE post_id=?").run(new Date(Date.now() - 1000).toISOString(), postId);
}
async function createJpeg(file, width = 1080, height = 1350) {
  fs.writeFileSync(path.join(tmp, "media", file), await sharp({ create: { width, height, channels: 3, background: "#445566" } }).jpeg().toBuffer());
}
async function registerImage(file, width = 1080, height = 1350) {
  await createJpeg(file, width, height);
  return (await social.registerRender(seller, { kind: "image", files: [{ file }] }, "post")).render_id;
}
async function registerCarousel(prefix) {
  const first = `${prefix}-1.jpg`, second = `${prefix}-2.jpg`;
  await createJpeg(first);
  await createJpeg(second);
  return (await social.registerRender(seller, { kind: "carousel", files: [{ file: first }, { file: second }] }, "post")).render_id;
}
async function registerReel(file) {
  const bytes = Buffer.alloc(160, 0);
  bytes.write("ftyp", 4, "ascii");
  bytes.write("isom", 8, "ascii");
  fs.writeFileSync(path.join(tmp, "media", file), bytes);
  return (await social.registerRender(seller, { kind: "reel", files: [{ file }] }, "story")).render_id;
}
async function queue({ renderId = imageRender, accountIds, caption = "Reviewed caption", key, publishAt } = {}) {
  const result = await call("POST", "/api/social/posts", {
    render_id: renderId,
    caption,
    account_ids: accountIds,
    idempotency_key: key || `key-${crypto.randomBytes(9).toString("hex")}`,
    ...(publishAt === undefined ? {} : { publish_at: publishAt }),
  });
  assert.equal(result.status, 201, JSON.stringify(result.body));
  return result.body.posts;
}
function signedRequest(userId = "meta-user-1") {
  const data = Buffer.from(JSON.stringify({ algorithm: "HMAC-SHA256", user_id: userId })).toString("base64url");
  const signature = crypto.createHmac("sha256", process.env.META_APP_SECRET).update(data).digest("base64url");
  return `${signature}.${data}`;
}
const count = (table, where = "", params = []) => db.prepare(`SELECT COUNT(*) AS n FROM ${table}${where}`).get(...params).n;

// The callback has no client-controlled redirect. This covers both user and Page token validation,
// task filtering, discovery pagination, and the extra username lookup when Page discovery omits it.
test("OAuth exchanges a long-lived user token, validates every Page token, and stores only encrypted metadata", async () => {
  const created = await call("POST", "/api/sellers", { store_name: "Social Store" }, { bearer: null });
  assert.equal(created.status, 201);
  seller = created.body.seller;
  sellerToken = created.body.token;
  const initial = await call("GET", "/api/social/accounts");
  assert.deepEqual(initial.body, { enabled: true, setup_required: null, logins: { instagram: false, facebook: true }, accounts: [] });

  graphCalls.length = 0;
  const login = await finishAuthorization();
  const state = login.searchParams.get("state");
  assert.equal(login.origin, "https://www.facebook.com");
  assert.equal(login.pathname, "/v26.0/dialog/oauth");
  assert.equal(login.searchParams.get("redirect_uri"), "https://social.test/social/meta/callback");
  assert.equal(login.searchParams.get("response_type"), "code");
  assert.equal(login.searchParams.get("config_id"), "business-login-config");
  assert.equal(login.searchParams.get("display"), "page");
  assert.ok(state);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM social_oauth_states").get().n, 0, "success consumes the one-use state");

  const exchanges = graphCalls.filter((entry) => entry.endpoint === "oauth/access_token");
  assert.equal(exchanges.length, 2);
  assert.equal(exchanges[1].form.grant_type, "fb_exchange_token");
  const debugged = graphCalls.filter((entry) => entry.endpoint === "debug_token").map((entry) => entry.form.input_token).sort();
  assert.deepEqual(debugged, ["long-lived-user-token", "page-token-1", "page-token-2"]);
  assert.equal(graphCalls.filter((entry) => entry.endpoint === "me/accounts").length, 2, "cursor pagination stops on a repeated cursor");
  assert.equal(graphCalls.some((entry) => entry.form?.input_token === "should-not-be-debugged"), false, "Page task filtering happens before token inspection");
  assert.equal(graphCalls.filter((entry) => entry.endpoint === "ig-1" || entry.endpoint === "ig-2").length, 2);

  const connected = await call("GET", "/api/social/accounts");
  assert.equal(connected.body.accounts.length, 4);
  assert.deepEqual(connected.body.accounts.map((item) => item.platform).sort(), ["facebook", "facebook", "instagram", "instagram"]);
  assert.equal(JSON.stringify(connected.body).includes("page-token"), false);
  assert.equal(JSON.stringify(connected.body).includes("long-lived-user-token"), false);
  assert.match(connected.body.accounts.find((item) => item.platform === "instagram" && /first_shop/.test(item.name)).name, /@first_shop/);

  const stored = db.prepare("SELECT * FROM social_connections WHERE seller_id=? AND platform='facebook' AND remote_id='page-1'").get(seller.id);
  assert.ok(stored.access_token_enc.startsWith("v1."));
  assert.ok(stored.user_access_token_enc.startsWith("v1."));
  assert.equal(stored.access_token_enc.includes("page-token-1"), false);
  assert.equal(stored.user_access_token_enc.includes("long-lived-user-token"), false);
  assert.ok(stored.token_expires_at && stored.data_access_expires_at && stored.user_token_expires_at && stored.user_data_access_expires_at);
  facebookId = stored.id;
  instagramId = db.prepare("SELECT id FROM social_connections WHERE seller_id=? AND platform='instagram' AND remote_id='ig-1'").get(seller.id).id;

  const replay = await call("GET", `/social/meta/callback?state=${encodeURIComponent(state)}&code=replay`, undefined, { bearer: null, redirect: "manual" });
  assert.equal(replay.status, 303);
  assert.equal(replay.headers.get("location"), "snapfront://marketing?social=error");

  const denied = await beginAuthorization();
  const deniedState = denied.searchParams.get("state");
  const deniedResult = await call("GET", `/social/meta/callback?state=${encodeURIComponent(deniedState)}&error=access_denied`, undefined, { bearer: null, redirect: "manual" });
  assert.equal(deniedResult.headers.get("location"), "snapfront://marketing?social=error");
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM social_oauth_states WHERE state_hash=?").get(crypto.createHash("sha256").update(deniedState).digest("hex")).n, 0);
  const deniedReplay = await call("GET", `/social/meta/callback?state=${encodeURIComponent(deniedState)}&code=not-allowed`, undefined, { bearer: null, redirect: "manual" });
  assert.equal(deniedReplay.headers.get("location"), "snapfront://marketing?social=error");

  const malformed = await beginAuthorization();
  const malformedState = malformed.searchParams.get("state");
  const malformedResult = await call("GET", `/social/meta/callback?state=${encodeURIComponent(malformedState)}`, undefined, { bearer: null, redirect: "manual" });
  assert.equal(malformedResult.headers.get("location"), "snapfront://marketing?social=error");
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM social_oauth_states WHERE state_hash=?").get(crypto.createHash("sha256").update(malformedState).digest("hex")).n, 0);
});

test("caption and schedule validation freeze exact reviewed data; idempotency survives elapsed schedule time and store boundaries", async () => {
  imageRender = await registerImage("owned-image.jpg");
  const future = new Date(Date.now() + 90_000).toISOString();
  const payload = { render_id: imageRender, caption: "  Exact reviewed caption\n#seller  ", account_ids: [facebookId], idempotency_key: "scheduled-request-0001", publish_at: future };
  const queued = await call("POST", "/api/social/posts", payload);
  assert.equal(queued.status, 201, JSON.stringify(queued.body));
  const scheduledPost = queued.body.posts[0];
  assert.equal(scheduledPost.caption, "Exact reviewed caption\n#seller");
  assert.equal(scheduledPost.publish_at, future);
  assert.equal(rowFor(scheduledPost.id).caption, "Exact reviewed caption\n#seller");

  const realNow = Date.now;
  Date.now = () => new Date(future).getTime() + 10_000;
  try {
    const same = await call("POST", "/api/social/posts", payload);
    assert.equal(same.status, 201);
    assert.equal(same.body.posts[0].id, scheduledPost.id, "an owned request is returned before its now-past schedule is revalidated");
  } finally {
    Date.now = realNow;
  }
  const changed = await call("POST", "/api/social/posts", { ...payload, caption: "Changed after review" });
  assert.equal(changed.status, 409);
  assert.equal((await call("POST", "/api/social/posts", { ...payload, idempotency_key: "bad-caption-00001", caption: "  \t " })).status, 400);
  assert.equal((await call("POST", "/api/social/posts", { ...payload, idempotency_key: "bad-null-000001", caption: "bad\u0000caption" })).status, 400);
  assert.equal((await call("POST", "/api/social/posts", { ...payload, idempotency_key: "bad-date-000001", publish_at: "2030-01-01T09:30" })).status, 400, "timezone-free schedules are rejected");
  assert.equal((await call("POST", "/api/social/posts", { ...payload, idempotency_key: "past-date-00001", publish_at: new Date(Date.now() - 1000).toISOString() })).status, 400);
  assert.equal((await call("POST", "/api/social/posts", { ...payload, idempotency_key: "bad-calendar-0001", publish_at: "2027-02-30T09:30:00Z" })).status, 400);
  const credential = db.prepare("SELECT user_token_expires_at FROM social_connections WHERE id=?").get(instagramId);
  db.prepare("UPDATE social_connections SET user_token_expires_at=? WHERE id=?").run(new Date(Date.now() - 1000).toISOString(), instagramId);
  assert.equal((await call("GET", "/api/social/accounts")).body.accounts.find((account) => account.id === instagramId).status, "reconnect_required");
  assert.equal((await call("POST", "/api/social/posts", { ...payload, idempotency_key: "expired-user-0001", account_ids: [instagramId] })).status, 409);
  db.prepare("UPDATE social_connections SET user_token_expires_at=?,status='connected' WHERE id=?").run(credential.user_token_expires_at, instagramId);

  // The second seller never shares the primary seller's auth or selected connection IDs.
  const otherCreated = await call("POST", "/api/sellers", { store_name: "Other Store" }, { bearer: null });
  otherSeller = otherCreated.body.seller;
  otherToken = otherCreated.body.token;
  assert.deepEqual((await call("GET", "/api/social/accounts", undefined, { bearer: otherToken })).body.accounts, []);
  const foreignRender = await call("POST", "/api/social/posts", { render_id: imageRender, caption: "Foreign", account_ids: [facebookId], idempotency_key: "foreign-render-0001" }, { bearer: otherToken });
  assert.equal(foreignRender.status, 404);
  assert.equal((await call("DELETE", `/api/social/accounts/${facebookId}`, undefined, { bearer: otherToken })).status, 404);
  assert.equal((await call("POST", `/api/social/posts/${scheduledPost.id}/cancel`, {}, { bearer: otherToken })).status, 404);
  const canceled = await call("POST", `/api/social/posts/${scheduledPost.id}/cancel`, {});
  assert.equal(canceled.status, 200);
  assert.equal(rowFor(scheduledPost.id).status, "canceled");
  assert.equal((await call("POST", `/api/social/posts/${scheduledPost.id}/cancel`, {})).status, 409);
});

test("Facebook uses Page tokens for image/carousel final publishing and a long-lived user token only for the resumable video upload", async () => {
  const carouselRender = await registerCarousel("facebook-carousel");
  const reelRender = await registerReel("facebook-reel.mp4");
  const [imagePost] = await queue({ accountIds: [facebookId], caption: "Facebook image" });
  const [carouselPost] = await queue({ renderId: carouselRender, accountIds: [facebookId], caption: "Facebook carousel" });
  const [videoPost] = await queue({ renderId: reelRender, accountIds: [facebookId], caption: "Facebook video" });
  const uploads = [];
  installMeta((request, endpoint) => {
    if (endpoint === "page-1/photos" && request.method === "POST") {
      assert.equal(request.headers.Authorization, "Bearer page-token-1");
      uploads.push(request.form);
      if (request.form.published === "false") return { id: `child-${uploads.filter((form) => form.published === "false").length}` };
      return { post_id: "facebook-image-post" };
    }
    if (endpoint === "page-1/feed" && request.method === "POST") {
      assert.equal(request.headers.Authorization, "Bearer page-token-1");
      return { id: "facebook-carousel-post" };
    }
    if (endpoint === "123456/uploads" && request.method === "POST") {
      assert.equal(request.headers.Authorization, "Bearer long-lived-user-token");
      assert.equal(request.form.file_type, "video/mp4");
      return { id: "upload-session-1" };
    }
    if (endpoint === "upload-session-1" && request.method === "POST") {
      assert.equal(request.headers.Authorization, "OAuth long-lived-user-token");
      assert.equal(request.headers.file_offset, "0");
      assert.ok(Buffer.isBuffer(request.body));
      return { h: "uploaded-video-handle" };
    }
    if (endpoint === "page-1/videos" && request.method === "POST") {
      assert.equal(new URL(request.url).host, "graph-video.facebook.com");
      assert.equal(request.headers.Authorization, "Bearer page-token-1");
      assert.deepEqual(request.form, { description: "Facebook video", fbuploader_video_file_chunk: "uploaded-video-handle" });
      return { id: "facebook-video-post" };
    }
    throw new Error(`unexpected mocked Meta endpoint ${request.method} ${endpoint}`);
  });
  assert.equal(await social.processDue(10), 3);
  assert.equal(rowFor(imagePost.id).status, "published");
  assert.equal(rowFor(carouselPost.id).status, "published");
  assert.equal(rowFor(videoPost.id).status, "published");

  const unpublished = uploads.filter((form) => form.published === "false");
  assert.equal(unpublished.length, 2, "each carousel photo is uploaded unpublished");
  assert.ok(unpublished.every((form) => form.url.startsWith("https://social.test/media/")));
  const feed = graphCalls.find((entry) => entry.endpoint === "page-1/feed");
  assert.equal(feed.form.message, "Facebook carousel");
  assert.deepEqual(JSON.parse(feed.form["attached_media[0]"]), { media_fbid: "child-1" });
  assert.deepEqual(JSON.parse(feed.form["attached_media[1]"]), { media_fbid: "child-2" });
  assert.equal(graphCalls.filter((entry) => entry.endpoint === "page-1/feed").length, 1, "a carousel creates one feed post, not independent photo posts");
});

test("Instagram checks authoritative quota before creation and again before final publish, rejects incomplete quota data, resets failed containers, bounds polls, and stores a permalink", async () => {
  let quotaResponses = [];
  let statusResponses = [];
  let containerNumber = 0;
  const createdContainers = [];
  let captionConfigurationIssue = false;
  installMeta((request, endpoint) => {
    if (endpoint === "ig-1/content_publishing_limit") {
      assert.equal(request.headers.Authorization, "Bearer long-lived-user-token");
      assert.equal(request.form.fields, "quota_usage,config");
      return quotaResponses.shift() || { data: [{ quota_usage: 0, config: { quota_total: 25 } }] };
    }
    if (endpoint === "ig-1/media" && request.method === "POST") {
      const id = `container-${++containerNumber}`;
      createdContainers.push(id);
      return { id };
    }
    if (/^container-\d+$/.test(endpoint) && request.method === "GET") return { status_code: statusResponses.shift() || "IN_PROGRESS" };
    if (endpoint === "ig-1/media_publish" && request.method === "POST") return { id: "ig-published-1", ...(captionConfigurationIssue ? { config_issue: "CAPTION_NOT_ATTACHED" } : {}) };
    if (endpoint === "ig-published-1" && request.method === "GET") return { permalink: "https://www.instagram.com/p/ig-published-1/" };
    throw new Error(`unexpected mocked Meta endpoint ${request.method} ${endpoint}`);
  });

  // A full quota puts the job aside before any container exists. When the container later finishes,
  // the second check can independently put it aside without sending media_publish.
  quotaResponses = [
    { data: [{ quota_usage: 25, config: { quota_total: 25 } }] },
    { data: [{ quota_usage: 0, config: { quota_total: 25 } }] },
    { data: [{ quota_usage: 25, config: { quota_total: 25 } }] },
  ];
  const [quotaPost] = await queue({ accountIds: [instagramId], caption: "Quota check" });
  await social.processDue();
  assert.equal(rowFor(quotaPost.id).status, "queued");
  assert.equal(createdContainers.length, 0);
  forceDue(quotaPost.id);
  await social.processDue();
  assert.equal(createdContainers.length, 1);
  forceDue(quotaPost.id);
  statusResponses.push("FINISHED");
  await social.processDue();
  assert.equal(rowFor(quotaPost.id).status, "queued");
  assert.equal(graphCalls.filter((entry) => entry.endpoint === "ig-1/media_publish").length, 0);
  assert.equal(jobFor(quotaPost.id).safe_retries, 2, "both the initial full quota and final full recheck are rate-backed off safely");

  quotaResponses = [{ data: [{ quota_usage: 1, config: {} }] }];
  const [unknownQuota] = await queue({ accountIds: [instagramId], caption: "Unknown quota" });
  await social.processDue();
  assert.equal(rowFor(unknownQuota.id).status, "failed");
  assert.equal(rowFor(unknownQuota.id).retryable, 1);
  assert.equal(jobFor(unknownQuota.id).remote_ids_json, "{}", "incomplete quota data never creates a container");

  quotaResponses = [];
  const [resetPost] = await queue({ accountIds: [instagramId], caption: "Reset failed container" });
  await social.processDue();
  assert.equal(JSON.parse(jobFor(resetPost.id).remote_ids_json).container, "container-2");
  forceDue(resetPost.id);
  statusResponses.push("ERROR");
  await social.processDue();
  assert.deepEqual(JSON.parse(jobFor(resetPost.id).remote_ids_json), {});
  assert.equal(jobFor(resetPost.id).stage, "start");
  assert.equal(jobFor(resetPost.id).safe_retries, 1);
  forceDue(resetPost.id);
  await social.processDue();
  assert.equal(JSON.parse(jobFor(resetPost.id).remote_ids_json).container, "container-3", "an invalid container is retried from a new container");

  const [pollPost] = await queue({ accountIds: [instagramId], caption: "Bounded polling" });
  await social.processDue();
  for (let i = 0; i < 5; i++) {
    forceDue(pollPost.id);
    statusResponses.push("IN_PROGRESS");
    await social.processDue();
  }
  assert.equal(rowFor(pollPost.id).status, "failed");
  assert.equal(rowFor(pollPost.id).retryable, 1);
  assert.equal(jobFor(pollPost.id).poll_count, 4, "the fifth unready status is the bounded failure rather than another poll");

  const [publishedPost] = await queue({ accountIds: [instagramId], caption: "Published permalink" });
  await social.processDue();
  forceDue(publishedPost.id);
  statusResponses.push("FINISHED");
  await social.processDue();
  assert.equal(rowFor(publishedPost.id).status, "published");
  assert.equal(rowFor(publishedPost.id).permalink, "https://www.instagram.com/p/ig-published-1/");

  captionConfigurationIssue = true;
  const [warningPost] = await queue({ accountIds: [instagramId], caption: "Published with a Meta warning" });
  await social.processDue();
  forceDue(warningPost.id);
  statusResponses.push("FINISHED");
  await social.processDue();
  assert.equal(rowFor(warningPost.id).status, "published");
  assert.equal(rowFor(warningPost.id).retryable, 0);
  assert.match(rowFor(warningPost.id).error, /caption may not be attached/i);
  assert.equal((await call("POST", `/api/social/posts/${warningPost.id}/retry`, {})).status, 409, "a known published warning must never issue a second public publish");
});

test("definitive expired tokens reconnect without retry, ambiguous final publish is uncertain and never replayed, and safe expired leases resume", async () => {
  // Use defaultTransport only here so a non-2xx response becomes the implementation's private
  // GraphFailure class rather than a lookalike thrown by a test transport.
  const [expiredPost] = await queue({ accountIds: [facebookId], caption: "Expired token" });
  const realFetch = globalThis.fetch;
  social.setMetaTransport(null);
  globalThis.fetch = async (url) => {
    assert.match(String(url), /graph\.facebook\.com\/v26\.0\/page-1\/photos/);
    return { ok: false, status: 400, json: async () => ({ error: { code: 190 } }) };
  };
  try {
    await social.processDue();
  } finally {
    globalThis.fetch = realFetch;
    social.setMetaTransport(async (request) => {
      const endpoint = endpointOf(request);
      graphCalls.push({ method: request.method, endpoint, url: request.url, headers: { ...request.headers }, form: request.form ? { ...request.form } : undefined, body: request.body });
      return metaHandler(request, endpoint);
    });
  }
  assert.equal(rowFor(expiredPost.id).status, "failed");
  assert.equal(rowFor(expiredPost.id).retryable, 0);
  assert.equal(db.prepare("SELECT status FROM social_connections WHERE id=?").get(facebookId).status, "reconnect_required");
  db.prepare("UPDATE social_connections SET status='connected' WHERE id=?").run(facebookId);

  let finalCalls = 0;
  installMeta((request, endpoint) => {
    if (endpoint === "page-1/photos" && request.method === "POST") {
      finalCalls++;
      assert.equal(request.headers.Authorization, "Bearer page-token-1");
      throw Object.assign(new Error("network dropped after send"), { ambiguous: true });
    }
    throw new Error(`unexpected mocked Meta endpoint ${request.method} ${endpoint}`);
  });
  const [uncertainPost] = await queue({ accountIds: [facebookId], caption: "Uncertain final publish" });
  await social.processDue();
  assert.equal(rowFor(uncertainPost.id).status, "uncertain");
  assert.equal(rowFor(uncertainPost.id).retryable, 0);
  assert.equal((await call("POST", `/api/social/posts/${uncertainPost.id}/retry`, {})).status, 409);
  await social.processDue();
  assert.equal(finalCalls, 1, "the worker never retries an ambiguous externally visible publish");

  installMeta((request, endpoint) => {
    if (endpoint === "safe-container" && request.method === "GET") return { status_code: "IN_PROGRESS" };
    throw new Error(`unexpected mocked Meta endpoint ${request.method} ${endpoint}`);
  });
  const [safePost] = await queue({ accountIds: [instagramId], caption: "Safe lease recovery" });
  const [boundaryPost] = await queue({ accountIds: [facebookId], caption: "Final boundary recovery" });
  const expiredLease = new Date(Date.now() - 1000).toISOString();
  const later = new Date(Date.now() + 60 * 60_000).toISOString();
  db.prepare("UPDATE social_posts SET status='processing' WHERE id IN (?,?)").run(safePost.id, boundaryPost.id);
  db.prepare("UPDATE social_publish_jobs SET status='processing', lease_owner='dead-worker', lease_until=?, run_at=?, stage='poll', remote_ids_json=? WHERE post_id=?")
    .run(expiredLease, later, JSON.stringify({ container: "safe-container" }), safePost.id);
  db.prepare("UPDATE social_publish_jobs SET status='processing', lease_owner='dead-worker', lease_until=?, run_at=?, stage='facebook_publish', remote_ids_json=? WHERE post_id=?")
    .run(expiredLease, later, JSON.stringify({ publish_started: true }), boundaryPost.id);
  await social.processDue();
  assert.equal(rowFor(safePost.id).status, "queued");
  assert.deepEqual(JSON.parse(jobFor(safePost.id).remote_ids_json), { container: "safe-container" });
  assert.equal(rowFor(boundaryPost.id).status, "uncertain");
  assert.equal(jobFor(boundaryPost.id).status, "uncertain");
});

test("malformed signed callbacks retain data, while disconnect and deletion during an external await revoke the lease before a result can persist", async () => {
  const before = { connections: count("social_connections", " WHERE seller_id=?", [seller.id]), posts: count("social_posts", " WHERE seller_id=?", [seller.id]) };
  const invalid = await fetch(base + "/social/meta/data-deletion", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ signed_request: "not-a-valid-signed-request" }),
  });
  assert.equal(invalid.status, 400);
  assert.deepEqual({ connections: count("social_connections", " WHERE seller_id=?", [seller.id]), posts: count("social_posts", " WHERE seller_id=?", [seller.id]) }, before, "bad signatures cannot delete retained data");

  const [disconnectPost] = await queue({ accountIds: [facebookId], caption: "Disconnect during request" });
  installMeta((request, endpoint) => {
    if (endpoint === "page-1/photos" && request.method === "POST") {
      social.disconnect(seller, facebookId);
      return { post_id: "should-not-persist" };
    }
    throw new Error(`unexpected mocked Meta endpoint ${request.method} ${endpoint}`);
  });
  await social.processDue();
  assert.equal(db.prepare("SELECT 1 FROM social_connections WHERE id=?").get(facebookId), undefined);
  assert.equal(db.prepare("SELECT 1 FROM social_posts WHERE id=?").get(disconnectPost.id), undefined, "connection cascade removes work while the request is outstanding");

  installMeta(oauthGraph);
  await finishAuthorization();
  facebookId = db.prepare("SELECT id FROM social_connections WHERE seller_id=? AND platform='facebook' AND remote_id='page-1'").get(seller.id).id;
  const [deletePost] = await queue({ accountIds: [facebookId], caption: "Deletion during request" });
  installMeta((request, endpoint) => {
    if (endpoint === "page-1/photos" && request.method === "POST") {
      const confirmation = social.dataDeletion(signedRequest());
      assert.match(confirmation.url, /^https:\/\/social\.test\/social\/meta\/data-deletion\/delete_/);
      return { post_id: "should-not-persist" };
    }
    throw new Error(`unexpected mocked Meta endpoint ${request.method} ${endpoint}`);
  });
  await social.processDue();
  assert.equal(db.prepare("SELECT 1 FROM social_connections WHERE seller_id=?").get(seller.id), undefined);
  assert.equal(db.prepare("SELECT 1 FROM social_posts WHERE id=?").get(deletePost.id), undefined);
  assert.equal((await call("GET", "/api/social/accounts")).body.accounts.length, 0);
  assert.deepEqual((await call("GET", "/api/social/posts")).body.posts, []);
});

test("account deletion purges marketing media and owned photos; foreign image filenames cannot become another store's product", async () => {
  const photo = "private-photo.jpg";
  fs.writeFileSync(path.join(tmp, "images", photo), await sharp({ create: { width: 800, height: 800, channels: 3, background: "#334455" } }).jpeg().toBuffer());
  db.prepare("INSERT INTO seller_media (image_file,seller_id) VALUES (?,?)").run(photo, seller.id);
  const foreign = await call("POST", "/api/products", { title: "Borrowed", price: 20, image_file: photo }, { bearer: otherToken });
  assert.equal(foreign.status, 400);
  const owned = await call("POST", "/api/products", { title: "Owned photo", price: 20, image_file: photo });
  assert.equal(owned.status, 201);
  const { ownsSellerImage } = await import("../src/media-ownership.js");
  assert.equal(ownsSellerImage(seller.id, photo), true);
  assert.equal(ownsSellerImage(otherSeller.id, photo), false);
  installMeta(oauthGraph);
  await finishAuthorization();
  const destination = (await call("GET", "/api/social/accounts")).body.accounts.find((account) => account.platform === "facebook");
  await queue({ accountIds: [destination.id], caption: "Remove me with account", publishAt: new Date(Date.now() + 86400_000).toISOString() });
  const media = db.prepare("SELECT files_json FROM social_renders WHERE seller_id=?").all(seller.id).flatMap((row) => JSON.parse(row.files_json).map((file) => file.file));
  assert.ok(media.length > 0);
  const deleted = await call("DELETE", "/api/me");
  assert.equal(deleted.status, 204);
  assert.equal(count("social_connections", " WHERE seller_id=?", [seller.id]), 0);
  assert.equal(count("social_posts", " WHERE seller_id=?", [seller.id]), 0);
  assert.equal(count("social_renders", " WHERE seller_id=?", [seller.id]), 0);
  for (const file of media) assert.equal(fs.existsSync(path.join(tmp, "media", file)), false);
  assert.equal((await fetch(`${base}/media/${media[0]}`)).status, 404);
});

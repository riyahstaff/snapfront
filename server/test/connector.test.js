// The Claude/ChatGPT connector: OAuth sign-in (discovery, registration, PKCE, one-time codes,
// rotating refresh tokens, disconnecting), the MCP tools, and the safety checks around them.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { PassThrough } from "node:stream";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-connector-"));
process.env.DATA_DIR = tmp;
process.env.PUBLIC_URL = "http://127.0.0.1:0";   // replaced below once the port is known
process.env.STRIPE_SECRET_KEY = "";

let base, server;
const { config } = await import("../src/config.js");
const { app } = await import("../src/index.js");
const { db } = await import("../src/db.js");
const auth = await import("../src/auth.js");
const connector = await import("../src/connector.js");
const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
const { StreamableHTTPClientTransport } = await import("@modelcontextprotocol/sdk/client/streamableHttp.js");
const sharp = (await import("sharp")).default;

let sent = [];
auth.setEmailSender(async (to, code) => { sent.push({ to, code }); });
const REDIRECT = "https://claude.ai/api/mcp/auth_callback";
let sellerToken, account, storeId, otherStoreId;

before(async () => {
  server = app.listen(0); await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
  // The server reads its public address at startup; the test speaks to it at the real port.
  const reg = await (await fetch(`${base}/api/sellers`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ store_name: "Candle Corner" }) })).json();
  sellerToken = reg.token; storeId = reg.seller.id; account = reg.account;
  db.prepare("UPDATE accounts SET email = 'maker@example.com' WHERE id = ?").run(account.id);
  const other = await (await fetch(`${base}/api/sellers`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ store_name: "Someone Else" }) })).json();
  otherStoreId = other.seller.id;
  db.prepare("UPDATE accounts SET email = 'other@example.com' WHERE id = ?").run(other.account.id);
});
after(() => { server.close(); fs.rmSync(tmp, { recursive: true, force: true }); });

const form = (body) => new URLSearchParams(body).toString();
const post = (url, body, headers = {}) => fetch(base + url, { method: "POST", redirect: "manual", headers: { "Content-Type": "application/x-www-form-urlencoded", ...headers }, body: form(body) });
const field = (html, name) => (new RegExp(`name="${name}" value="([^"]*)"`).exec(html) || [])[1];
const pkce = () => { const verifier = crypto.randomBytes(32).toString("base64url"); return { verifier, challenge: crypto.createHash("sha256").update(verifier).digest("base64url") }; };

async function register(extra = {}) {
  const r = await fetch(`${base}/oauth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ client_name: "Claude", redirect_uris: [REDIRECT], token_endpoint_auth_method: "none", ...extra }) });
  return { status: r.status, body: await r.json() };
}
/** Walks the sign-in screens like a person would and returns the code from the final redirect. */
async function signIn(clientId, { email = "maker@example.com", challenge, state = "st-1", decision = "allow", redirect = REDIRECT } = {}) {
  const q = new URLSearchParams({ response_type: "code", client_id: clientId, redirect_uri: redirect, state, code_challenge: challenge, code_challenge_method: "S256", resource: connector.RESOURCE });
  const page1 = await fetch(`${base}/oauth/authorize?${q}`);
  assert.equal(page1.status, 200);
  assert.equal(page1.headers.get("x-frame-options"), "DENY");
  const rid = field(await page1.text(), "rid");
  sent = [];
  const page2 = await (await post("/oauth/authorize/email", { rid, email })).text();
  assert.match(page2, /Enter your code/);
  const code = sent[0]?.code;
  const page3 = await (await post("/oauth/authorize/code", { rid, code: code || "000000" })).text();
  assert.match(page3, /Allow Claude to work on your store\?/);
  const res = await post("/oauth/authorize/decision", { rid, consent: field(page3, "consent"), decision });
  assert.equal(res.status, 302);
  return new URL(res.headers.get("location"));
}
async function tokens(clientId, extra) {
  const r = await post("/oauth/token", { client_id: clientId, ...extra });
  return { status: r.status, body: await r.json(), cache: r.headers.get("cache-control") };
}
async function connect(accessToken) {
  const client = new Client({ name: "test", version: "1.0.0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(`${base}/mcp`), { requestInit: { headers: { Authorization: `Bearer ${accessToken}` } } }));
  return client;
}
const result = (r) => { assert.ok(!r.isError, r.content?.[0]?.text); return JSON.parse(r.content[0].text); };

test("discovery: the MCP endpoint asks for sign-in and points to Snapfront's sign-in metadata", async () => {
  const r = await fetch(`${base}/mcp`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} }) });
  assert.equal(r.status, 401);
  assert.match(r.headers.get("www-authenticate"), /^Bearer resource_metadata="[^"]+\/\.well-known\/oauth-protected-resource"/);
  const pr = await (await fetch(`${base}/.well-known/oauth-protected-resource/mcp`)).json();
  assert.equal(pr.resource, connector.RESOURCE);
  assert.deepEqual(pr.authorization_servers, [connector.ISSUER]);
  const as = await (await fetch(`${base}/.well-known/oauth-authorization-server`)).json();
  assert.deepEqual(as.code_challenge_methods_supported, ["S256"]);
  assert.equal(as.client_id_metadata_document_supported, true);
  assert.ok(as.token_endpoint_auth_methods_supported.includes("none"));
  assert.ok(as.scopes_supported.includes("offline_access"));
  assert.equal((await fetch(`${base}/mcp`)).status, 405);
  // A token that isn't ours is refused the same way.
  const bad = await fetch(`${base}/mcp`, { method: "POST", headers: { Authorization: "Bearer nope", "Content-Type": "application/json" }, body: "{}" });
  assert.equal(bad.status, 401);
  assert.match(bad.headers.get("www-authenticate"), /error="invalid_token"/);
});

test("registration only accepts safe redirect addresses", async () => {
  assert.equal((await register({ redirect_uris: ["http://evil.example/cb"] })).status, 400);
  assert.equal((await register({ redirect_uris: ["javascript:alert(1)"] })).status, 400);
  assert.equal((await register({ redirect_uris: [] })).status, 400);
  assert.equal((await register({ grant_types: ["client_credentials"] })).status, 400);
  const ok = await register();
  assert.equal(ok.status, 201);
  assert.match(ok.body.client_id, /^sfc_/);
  assert.equal(ok.body.client_secret, undefined, "public clients get no secret");
  const conf = await register({ token_endpoint_auth_method: "client_secret_post" });
  assert.ok(conf.body.client_secret);
  assert.equal((await register({ redirect_uris: ["http://localhost/callback"] })).status, 201, "Claude Code's loopback redirect");
});

test("the sign-in screens refuse a wrong return address and require PKCE", async () => {
  const { body } = await register();
  const bad = await fetch(`${base}/oauth/authorize?${new URLSearchParams({ response_type: "code", client_id: body.client_id, redirect_uri: "https://evil.example/cb", code_challenge: pkce().challenge, code_challenge_method: "S256" })}`, { redirect: "manual" });
  assert.equal(bad.status, 400, "never redirects to an address the app didn't register");
  assert.match(await bad.text(), /return address/);
  const unknown = await fetch(`${base}/oauth/authorize?client_id=sfc_missing&redirect_uri=${encodeURIComponent(REDIRECT)}`, { redirect: "manual" });
  assert.equal(unknown.status, 400);
  const noPkce = await fetch(`${base}/oauth/authorize?${new URLSearchParams({ response_type: "code", client_id: body.client_id, redirect_uri: REDIRECT, state: "x" })}`, { redirect: "manual" });
  assert.equal(noPkce.status, 302);
  const loc = new URL(noPkce.headers.get("location"));
  assert.equal(loc.searchParams.get("error"), "invalid_request");
  assert.equal(loc.searchParams.get("state"), "x");
});

let clientId, current;
test("a seller signs in with an emailed code, allows access, and the app gets tokens once", async () => {
  ({ body: { client_id: clientId } } = await register());
  const { verifier, challenge } = pkce();
  const back = await signIn(clientId, { challenge });
  assert.equal(back.origin + back.pathname, REDIRECT);
  assert.equal(back.searchParams.get("state"), "st-1");
  assert.equal(back.searchParams.get("iss"), connector.ISSUER);
  const code = back.searchParams.get("code");
  assert.ok(code);
  // The wrong PKCE verifier doesn't work, and the code is then used up.
  const wrong = await tokens(clientId, { grant_type: "authorization_code", code, redirect_uri: REDIRECT, code_verifier: pkce().verifier });
  assert.equal(wrong.status, 400);
  assert.equal(wrong.body.error, "invalid_grant");
  const again = await tokens(clientId, { grant_type: "authorization_code", code, redirect_uri: REDIRECT, code_verifier: verifier });
  assert.equal(again.status, 400, "a code works once, even after a failed try");

  const fresh = await signIn(clientId, { challenge });
  const ok = await tokens(clientId, { grant_type: "authorization_code", code: fresh.searchParams.get("code"), redirect_uri: REDIRECT, code_verifier: verifier, resource: connector.RESOURCE });
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  assert.equal(ok.cache, "no-store");
  assert.equal(ok.body.token_type, "Bearer");
  assert.ok(ok.body.access_token && ok.body.refresh_token);
  current = ok.body;
  assert.ok(!JSON.stringify(db.prepare("SELECT * FROM oauth_tokens").all()).includes(current.access_token), "only hashes are stored");
});

test("a wrong code is limited, and cancel returns access_denied", async () => {
  const { challenge } = pkce();
  const q = new URLSearchParams({ response_type: "code", client_id: clientId, redirect_uri: REDIRECT, code_challenge: challenge, code_challenge_method: "S256" });
  const rid = field(await (await fetch(`${base}/oauth/authorize?${q}`)).text(), "rid");
  await post("/oauth/authorize/email", { rid, email: "maker@example.com" });
  for (let i = 0; i < 5; i++) assert.match(await (await post("/oauth/authorize/code", { rid, code: "000000" })).text(), /isn(&#39;|')t right/);
  assert.match(await (await post("/oauth/authorize/code", { rid, code: sent.at(-1).code })).text(), /Too many wrong codes/);
  // An email with no account sees the same screen and gets no email.
  sent = [];
  const rid2 = field(await (await fetch(`${base}/oauth/authorize?${q}`)).text(), "rid");
  assert.match(await (await post("/oauth/authorize/email", { rid: rid2, email: "nobody@example.com" })).text(), /Enter your code/);
  assert.equal(sent.length, 0);
  // Cancel.
  const denied = await signIn(clientId, { challenge, decision: "deny" });
  assert.equal(denied.searchParams.get("error"), "access_denied");
  // The decision can't be forged without the token shown to the signed-in browser.
  const rid3 = field(await (await fetch(`${base}/oauth/authorize?${q}`)).text(), "rid");
  assert.equal((await post("/oauth/authorize/decision", { rid: rid3, consent: "guess", decision: "allow" })).status, 400);
});

test("the tools work on the seller's own store and refuse anyone else's", async () => {
  const mcp = await connect(current.access_token);
  const names = (await mcp.listTools()).tools.map((t) => t.name).sort();
  assert.deepEqual(names, ["check_store", "create_draft_product", "get_product", "get_store", "get_video", "list_store_looks", "list_stores", "make_faceless_video", "preview_store_design", "update_product", "update_store_design", "use_picture_from_link"]);
  const tools = Object.fromEntries((await mcp.listTools()).tools.map((t) => [t.name, t]));
  assert.equal(tools.get_store.annotations.readOnlyHint, true);
  assert.equal(tools.update_store_design.annotations.readOnlyHint, false);

  const stores = result(await mcp.callTool({ name: "list_stores", arguments: {} }));
  assert.deepEqual(stores.stores.map((s) => s.name), ["Candle Corner"]);
  const refused = await mcp.callTool({ name: "get_store", arguments: { store_id: otherStoreId } });
  assert.ok(refused.isError);
  assert.match(refused.content[0].text, /isn't in this Snapfront account/);

  const check = result(await mcp.callTool({ name: "check_store", arguments: {} }));
  assert.ok(check.issues.some((i) => /Payments aren't set up/.test(i.problem)));

  const looks = result(await mcp.callTool({ name: "list_store_looks", arguments: {} })).looks;
  assert.ok(looks.length > 20);
  const preview = result(await mcp.callTool({ name: "preview_store_design", arguments: { theme_id: looks[3].theme_id, hero_title: "Hand-poured soy candles" } }));
  assert.match(preview.preview_url, /\/storefront-preview\//);
  assert.equal(db.prepare("SELECT hero_title FROM sellers WHERE id = ?").get(storeId).hero_title || "", "", "a preview changes nothing");
  assert.equal((await fetch(preview.preview_url.replace(/^.*\/storefront-preview/, `${base}/storefront-preview`))).status, 200);

  const updated = result(await mcp.callTool({ name: "update_store_design", arguments: { theme_id: looks[3].theme_id, hero_title: "Hand-poured soy candles", announcement: "Free shipping over $50" } }));
  assert.equal(updated.look.hero_title, "Hand-poured soy candles");
  assert.equal(db.prepare("SELECT theme FROM sellers WHERE id = ?").get(storeId).theme, looks[3].theme_id);
  assert.ok((await mcp.callTool({ name: "update_store_design", arguments: { theme_id: "not-a-look" } })).isError);

  const draft = result(await mcp.callTool({ name: "create_draft_product", arguments: { kind: "physical", title: "Cedar Candle", price: 24, original_price: 30, description: "A slow-burning soy candle.", bullets: ["50-hour burn", "Cotton wick", "Hand poured"] } }));
  assert.equal(draft.status, "draft");
  assert.equal(draft.original_price, 30);
  const badSale = await mcp.callTool({ name: "update_product", arguments: { product_id: draft.product_id, original_price: 10 } });
  assert.ok(badSale.isError);
  assert.match(badSale.content[0].text, /higher than the price/);
  const edited = result(await mcp.callTool({ name: "update_product", arguments: { product_id: draft.product_id, price: 20, original_price: null } }));
  assert.equal(edited.price, 20);
  assert.equal(edited.original_price, null);
  const full = result(await mcp.callTool({ name: "get_product", arguments: { product_id: draft.product_id } }));
  assert.deepEqual(full.bullets, ["50-hour burn", "Cotton wick", "Hand poured"]);
  // Another store's product can't be reached, even by ID.
  const theirs = db.prepare("INSERT INTO products (id, seller_id, slug, title, price_cents) VALUES ('prd_theirs', ?, 'theirs', 'Theirs', 500) RETURNING id").get(otherStoreId).id;
  assert.ok((await mcp.callTool({ name: "get_product", arguments: { product_id: theirs } })).isError);
  assert.ok((await mcp.callTool({ name: "update_product", arguments: { product_id: theirs, price: 1 } })).isError);
  assert.equal(db.prepare("SELECT price_cents FROM products WHERE id = 'prd_theirs'").get().price_cents, 500);

  const video = result(await mcp.callTool({ name: "make_faceless_video", arguments: { product_id: draft.product_id, hook: "Your new favourite candle", scenes: [{ text: "50 hours", say: "It burns for fifty hours." }, { text: "Hand poured", say: "Every one is poured by hand." }], voice: "af_bella" } }));
  assert.equal(video.status, "queued");
  const status = result(await mcp.callTool({ name: "get_video", arguments: { video_id: video.video_id } }));
  assert.equal(status.video_id, video.video_id);
  await mcp.close();
});

test("a picture from a link becomes a product or cover photo; private addresses are refused", async () => {
  const jpg = await sharp({ create: { width: 800, height: 800, channels: 3, background: "#c97" } }).jpeg().toBuffer();
  connector.setImageGet((url, opts, cb) => {
    const res = new PassThrough();
    res.statusCode = url.hostname === "images.example" ? 200 : 404; res.headers = {};
    setImmediate(() => { cb(res); res.end(res.statusCode === 200 ? jpg : ""); });
    const req = new PassThrough(); req.destroy = () => {}; return req;
  });
  try {
    const mcp = await connect(current.access_token);
    const product = db.prepare("SELECT id FROM products WHERE seller_id = ? LIMIT 1").get(storeId).id;
    const r = result(await mcp.callTool({ name: "use_picture_from_link", arguments: { image_url: "https://images.example/avatar.jpg", use_as: "product_photo", product_id: product } }));
    assert.equal(r.has_photo, true);
    const cover = result(await mcp.callTool({ name: "use_picture_from_link", arguments: { image_url: "https://images.example/cover.jpg", use_as: "cover_photo" } }));
    assert.equal(cover.used_as, "cover_photo");
    assert.ok(db.prepare("SELECT banner_file FROM sellers WHERE id = ?").get(storeId).banner_file);
    for (const link of ["http://images.example/a.jpg", "https://127.0.0.1/a.jpg", "https://images.example:8443/a.jpg"]) {
      const bad = await mcp.callTool({ name: "use_picture_from_link", arguments: { image_url: link, use_as: "cover_photo" } });
      assert.ok(bad.isError, link);
    }
    await mcp.close();
  } finally { connector.setImageGet(null); }
  // The real downloader refuses names that resolve to private addresses.
  await assert.rejects(connector.fetchPublicImage("https://localhost/a.jpg"), /private address|couldn't reach/);
});

test("refresh tokens rotate, and disconnecting in Settings ends access", async () => {
  const r1 = await tokens(clientId, { grant_type: "refresh_token", refresh_token: current.refresh_token });
  assert.equal(r1.status, 200);
  const reuse = await tokens(clientId, { grant_type: "refresh_token", refresh_token: current.refresh_token });
  assert.equal(reuse.status, 400, "an old refresh token stops working once it's used");
  assert.equal(reuse.body.error, "invalid_grant");
  const otherClient = (await register()).body.client_id;
  assert.equal((await tokens(otherClient, { grant_type: "refresh_token", refresh_token: r1.body.refresh_token })).status, 400, "refresh tokens belong to one app");
  current = r1.body;

  const apps = await (await fetch(`${base}/api/connected-apps`, { headers: { Authorization: `Bearer ${sellerToken}` } })).json();
  assert.equal(apps.apps.length, 1);
  assert.equal(apps.apps[0].name, "Claude");
  assert.equal(apps.apps[0].site, "claude.ai");
  assert.match(apps.connector_url, /\/mcp$/);
  assert.equal((await fetch(`${base}/api/connected-apps/${apps.apps[0].id}`, { method: "DELETE", headers: { Authorization: `Bearer ${sellerToken}` } })).status, 204);
  const after = await fetch(`${base}/mcp`, { method: "POST", headers: { Authorization: `Bearer ${current.access_token}`, "Content-Type": "application/json", Accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }) });
  assert.equal(after.status, 401);
  assert.equal((await tokens(clientId, { grant_type: "refresh_token", refresh_token: current.refresh_token })).status, 400);
});

test("a client with a secret must send it", async () => {
  const conf = (await register({ token_endpoint_auth_method: "client_secret_post" })).body;
  const { verifier, challenge } = pkce();
  const code = (await signIn(conf.client_id, { challenge })).searchParams.get("code");
  assert.equal((await tokens(conf.client_id, { grant_type: "authorization_code", code, redirect_uri: REDIRECT, code_verifier: verifier })).status, 401);
  const code2 = (await signIn(conf.client_id, { challenge })).searchParams.get("code");
  const basic = Buffer.from(`${conf.client_id}:${conf.client_secret}`).toString("base64");
  const r = await post("/oauth/token", { grant_type: "authorization_code", code: code2, redirect_uri: REDIRECT, code_verifier: verifier }, { Authorization: `Basic ${basic}` });
  assert.equal(r.status, 200);
});

test("Claude's published identity (client ID metadata document) works from allowed sites only", async () => {
  const docUrl = "https://claude.ai/oauth/mcp-client-metadata";
  connector.setCimdFetch(async (url) => new Response(JSON.stringify({ client_id: url, client_name: "Claude", redirect_uris: [REDIRECT], token_endpoint_auth_method: "none" }), { status: 200 }));
  try {
    const { verifier, challenge } = pkce();
    const code = (await signIn(docUrl, { challenge })).searchParams.get("code");
    const t = await tokens(docUrl, { grant_type: "authorization_code", code, redirect_uri: REDIRECT, code_verifier: verifier });
    assert.equal(t.status, 200);
    const q = new URLSearchParams({ response_type: "code", client_id: "https://evil.example/client.json", redirect_uri: REDIRECT, code_challenge: challenge, code_challenge_method: "S256" });
    assert.equal((await fetch(`${base}/oauth/authorize?${q}`)).status, 400, "documents from other sites aren't fetched");
  } finally { connector.setCimdFetch(null); }
});

test("the guide and tools pages are up and link to each other", async () => {
  const guide = await (await fetch(`${base}/connect-ai`)).text();
  assert.match(guide, /Use Snapfront with Claude or ChatGPT/);
  assert.ok(guide.includes(`${config.publicUrl}/mcp`));
  assert.match(guide, /Add custom connector/);
  assert.match(guide, /Developer mode/);
  for (const k of ["claude", "chatgpt"]) {
    assert.ok(guide.includes(`src="/site/tutorials/connect-${k}.mp4"`), k);
    const v = await fetch(`${base}/site/tutorials/connect-${k}.mp4`, { headers: { Range: "bytes=0-1023" } });
    assert.equal(v.status, 206, "videos stream (range requests)");
    assert.match(v.headers.get("content-type"), /video\/mp4/);
    assert.equal((await fetch(`${base}/site/tutorials/connect-${k}.jpg`)).status, 200);
  }
  const tools = await (await fetch(`${base}/tools`)).text();
  assert.match(tools, /Tools that work with Snapfront/);
  assert.match(tools, /https:\/\/www\.eromify\.com\/mcp/);
  assert.match(tools, /href="\/connect-ai#claude"/);
});

// Ask Vierra: the ElevenLabs agent is set up from the live help page and prices, kept in step, and
// visitors get one-time tokens only from Snapfront's own pages, within limits. ElevenLabs is faked.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-vierra-"));
process.env.DATA_DIR = tmp;
process.env.STRIPE_SECRET_KEY = "";
process.env.ELEVENLABS_API_KEY = "test-eleven-key";
process.env.PUBLIC_URL = "https://snapfront.test";

const vierra = await import("../src/vierra.js");
const { SECTIONS } = await import("../src/help-page.js");
const { app } = await import("../src/index.js");
const { db } = await import("../src/db.js");

// A fake ElevenLabs that records every call.
const calls = [];
let agentCount = 0, docCount = 0, patch404 = false;
vierra.setVierraFetch(async (url, init = {}) => {
  const u = new URL(url), body = init.body ? JSON.parse(init.body) : null;
  calls.push({ method: init.method, path: u.pathname, query: Object.fromEntries(u.searchParams), body, key: init.headers?.["xi-api-key"] });
  const json = (status, data) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
  if (u.pathname === "/v1/convai/knowledge-base/text") return json(200, { id: `doc_${++docCount}`, name: body.name });
  if (u.pathname === "/v1/convai/agents/create") return json(200, { agent_id: `agent_${++agentCount}` });
  if (init.method === "PATCH" && u.pathname.startsWith("/v1/convai/agents/")) return patch404 ? json(404, { detail: "not found" }) : json(200, {});
  if (init.method === "DELETE") return json(200, {});
  if (u.pathname === "/v1/convai/conversation/token") return json(200, { token: "tok_live_123" });
  if (u.pathname === "/v1/convai/conversation/get-signed-url") return json(200, { signed_url: "wss://api.elevenlabs.io/v1/convai/conversation?agent_id=x&conversation_signature=sig" });
  if (u.pathname === "/v1/shared-voices") return json(200, { voices: [{ voice_id: "v0iceAAAAAAAAAAAAAAA", public_owner_id: "ownerAAAAAAAAAAAAAAAAAAAA", name: "Test", gender: "female", accent: "african-american" }] });
  if (u.pathname.startsWith("/v1/voices/add/")) return json(200, { voice_id: "addedVoiceAAAAAAAAAA" });
  return json(404, { detail: "unknown" });
});

let base, server;
before(async () => { server = app.listen(0); await new Promise((r) => server.once("listening", r)); base = `http://127.0.0.1:${server.address().port}`; });
after(() => { server?.close(); fs.rmSync(tmp, { recursive: true, force: true }); });

test("her knowledge is the live help page, the app's pages and today's prices", () => {
  const k = vierra.knowledgeText();
  for (const s of SECTIONS) for (const it of s.items) assert.ok(k.includes(`Q: ${it.q}`), it.q);
  assert.match(k, /\$299 once for life/);
  assert.match(k, /\$69 a month/);
  assert.match(k, /app\.snapfront\.app\/settings/);
  assert.match(k, /GLOSSARY/);
  assert.match(k, /support@snapfront\.app/);
});

test("the app page list matches the web app's search list", () => {
  const src = fs.readFileSync(new URL("../../mobile/src/web/site-search.tsx", import.meta.url), "utf8");
  const routes = [...src.matchAll(/\["[^"]+", "(\/[a-z-]+)"/g)].map((m) => m[1]);
  assert.deepEqual(vierra.APP_PAGES.map((p) => p[1]).sort(), [...new Set(routes)].sort());
});

test("her instructions: answer from the guide, add an ease-of-use tip, sound natural", () => {
  const p = vierra.SYSTEM_PROMPT;
  assert.match(p, /Vierra/);
  assert.match(p, /always add one ease-of-use suggestion/);
  assert.match(p, /Only state facts that are in that document/);
  assert.match(p, /Never promise income/);
  assert.match(p, /no markdown/);
  assert.match(p, /support@snapfront\.app/);
});

test("the agent is created once with auth, the voice, the knowledge and typed chats allowed", async () => {
  calls.length = 0;
  const id = await vierra.syncAgent();
  assert.equal(id, "agent_1");
  const doc = calls.find((c) => c.path === "/v1/convai/knowledge-base/text");
  assert.ok(doc.body.text.includes("SNAPFRONT HELP AND SITE GUIDE"));
  const create = calls.find((c) => c.path === "/v1/convai/agents/create").body;
  const cc = create.conversation_config;
  assert.equal(cc.agent.prompt.knowledge_base[0].id, "doc_1");
  assert.equal(cc.agent.prompt.knowledge_base[0].usage_mode, "prompt");
  assert.equal(cc.agent.prompt.prompt, vierra.SYSTEM_PROMPT);
  assert.equal(cc.agent.first_message, vierra.FIRST_MESSAGE);
  assert.ok(cc.tts.voice_id);
  assert.equal(create.platform_settings.auth.enable_auth, true, "only signed sessions");
  assert.equal(create.platform_settings.overrides.conversation_config_override.conversation.text_only, true);
  assert.equal(create.platform_settings.privacy.record_voice, false);
  assert.ok(calls.every((c) => c.key === "test-eleven-key"));

  calls.length = 0;
  assert.equal(await vierra.syncAgent(), "agent_1");
  assert.equal(calls.length, 0, "nothing changed, nothing sent");

  await vierra.syncAgent({ force: true });
  assert.ok(calls.some((c) => c.method === "PATCH" && c.path === "/v1/convai/agents/agent_1"));

  // Deleted in the ElevenLabs dashboard: made again.
  patch404 = true; calls.length = 0;
  assert.equal(await vierra.syncAgent({ force: true }), "agent_2");
  patch404 = false;
});

test("choosing a voice adds it to the account and updates the agent", async () => {
  calls.length = 0;
  const r = await vierra.chooseVoice({ voice_id: "v0iceAAAAAAAAAAAAAAA", public_owner_id: "ownerAAAAAAAAAAAAAAAAAAAA", name: "Test" });
  assert.equal(r.voice_id, "addedVoiceAAAAAAAAAA");
  assert.ok(calls.some((c) => c.path === "/v1/voices/add/ownerAAAAAAAAAAAAAAAAAAAA/v0iceAAAAAAAAAAAAAAA"));
  const patch = calls.find((c) => c.method === "PATCH");
  assert.equal(patch.body.conversation_config.tts.voice_id, "addedVoiceAAAAAAAAAA");
  await assert.rejects(() => vierra.chooseVoice({ voice_id: "../../x", public_owner_id: "y" }), /voice search/);
});

test("visitors get a voice token or a typed-chat link, only from Snapfront's pages", async () => {
  const post = (body, origin) => fetch(`${base}/api/vierra/session`, { method: "POST", headers: { "Content-Type": "application/json", ...(origin ? { Origin: origin } : {}) }, body: JSON.stringify(body) });
  const voice = await post({ mode: "voice" }, "https://snapfront.test");
  assert.equal(voice.status, 200);
  assert.equal(voice.headers.get("cache-control"), "no-store");
  assert.deepEqual(await voice.json(), { mode: "voice", conversation_token: "tok_live_123" });
  const text = await (await post({ mode: "text" }, "https://snapfront.test")).json();
  assert.equal(text.mode, "text");
  assert.match(text.signed_url, /^wss:\/\//);
  assert.equal((await post({ mode: "voice" }, "https://evil.example")).status, 403);
  assert.equal((await post({ mode: "voice" })).status, 403, "no Origin, no token");
  const body = await (await post({ mode: "voice" }, "https://snapfront.test")).text();
  assert.doesNotMatch(body, /test-eleven-key/);
  // 12 an hour per visitor (3 used above).
  let last;
  for (let i = 0; i < 10; i++) last = await post({ mode: "voice" }, "https://snapfront.test");
  assert.equal(last.status, 429);
});

test("ElevenLabs errors don't leak details to visitors", async () => {
  db.prepare("DELETE FROM vierra_state").run();
  vierra.setVierraFetch(async () => new Response(JSON.stringify({ detail: { message: "secret upstream detail" } }), { status: 401 }));
  await assert.rejects(() => vierra.session("voice"), (e) => e.status === 503 && !/secret/.test(e.message) && !e.extra);
  assert.match(vierra.status().last_error.detail, /secret upstream detail/, "the owner can still see it");
});

test("owner tools need the owner's sign-in", async () => {
  for (const [m, p] of [["GET", "/api/admin/owner/vierra"], ["GET", "/api/admin/owner/vierra/voices"], ["POST", "/api/admin/owner/vierra/voice"], ["POST", "/api/admin/owner/vierra/sync"], ["POST", "/api/admin/owner/vierra/ask"]]) {
    const r = await fetch(`${base}${p}`, { method: m });
    assert.equal(r.status, 401, `${m} ${p}`);
  }
  const reg = await (await fetch(`${base}/api/sellers`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })).json();
  const r = await fetch(`${base}/api/admin/owner/vierra`, { headers: { Authorization: `Bearer ${reg.token}` } });
  assert.equal(r.status, 403, "a normal seller can't");
});

test("the home and help pages carry the widget, and the SDK is served compressed and cached", async () => {
  for (const p of ["/", "/help"]) {
    const html = await (await fetch(`${base}${p}`)).text();
    const m = html.match(/<script src="(\/site\/vierra\/vierra\.js\?v=[a-f0-9]+)" data-sdk="(\/site\/vierra\/elevenlabs-client-[0-9.]+\.js)" defer><\/script>/);
    assert.ok(m, `${p} has the widget`);
    assert.equal((await fetch(`${base}${m[1]}`)).status, 200);
    const sdk = await fetch(`${base}${m[2]}`, { headers: { "Accept-Encoding": "br" } });
    assert.equal(sdk.status, 200);
    assert.equal(sdk.headers.get("content-encoding"), "br");
    assert.match(sdk.headers.get("cache-control"), /immutable/);
  }
  const help = await (await fetch(`${base}/help`)).text();
  assert.match(help, /data-open-vierra/);
  const widget = fs.readFileSync(new URL("../assets/site/vierra/vierra.js", import.meta.url), "utf8");
  assert.doesNotMatch(widget, /xi-api-key|ELEVENLABS/);
  assert.match(widget, /Ask Vierra/);
  assert.match(widget, /prefers-reduced-motion/);
  const sdkFile = fs.readFileSync(new URL("../assets/vierra/elevenlabs-client.min.js", import.meta.url));
  assert.ok(zlib.brotliCompressSync(sdkFile).length < 200_000);
});

test("the web app's page gets Vierra hidden, for its Home screen to show", async () => {
  const { withVierra, vierraTag } = await import("../src/vierra-widget.js");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vierra-app-"));
  const file = path.join(dir, "index.html");
  fs.writeFileSync(file, "<!doctype html><html><body><div id=\"root\"></div></body></html>");
  const html = withVierra(file);
  assert.match(html, /<script src="\/site\/vierra\/vierra\.js\?v=[0-9a-f]{10}" data-sdk="[^"]+" data-hidden defer><\/script><\/body>/);
  assert.equal((html.match(/vierra\.js/g) || []).length, 1);
  assert.doesNotMatch(vierraTag(), /data-hidden/, "the website's pages show her straight away");
  fs.rmSync(dir, { recursive: true, force: true });
});

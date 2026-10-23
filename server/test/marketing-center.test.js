import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-owner-marketing-"));
Object.assign(process.env, { DATA_DIR: tmp, PUBLIC_URL: "https://marketing.test", OWNER_EMAILS: "owner@example.test", META_APP_ID: "12345", META_APP_SECRET: "mock-secret", META_LOGIN_CONFIG_ID: "mock-config", META_TOKEN_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString("base64"), META_PUBLISHING_ENABLED: "true", MARKETING_CENTER_DAILY_AI_LIMIT: "3" });
const { app } = await import("../src/index.js");
const { db } = await import("../src/db.js");
const mc = await import("../src/marketing-center.js");
const social = await import("../src/social.js");
const plans = await import("../src/plans.js");
const sharp = (await import("sharp")).default;
let server, base, owner, other;
const root = "/api/admin/owner/marketing";
async function call(method, url, body, token = owner?.token) {
 const r = await fetch(base + url, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
 return { status: r.status, headers: r.headers, body: (r.headers.get("content-type") || "").includes("json") ? await r.json() : await r.text() };
}
const camp = () => mc.createCampaign(owner.account, owner.store, { title: "First product", audience: "Busy parents", goal: "Explore a digital store", brief: "Keep it practical" });
const article = (c) => mc.createDraft(owner.account, owner.store, c.id, { kind: "blog", title: "A <script>safe</script> guide", description: "A useful guide", body: 'Useful steps, without promises. '.repeat(12) + '\n\n<script>alert("x")</script>' });
before(async () => {
 server = app.listen(0); await new Promise((r) => server.once("listening", r)); base = `http://127.0.0.1:${server.address().port}`;
 owner = plans.createAccountWithStore("Owner store"); other = plans.createAccountWithStore("Other store");
 db.prepare("UPDATE accounts SET email='owner@example.test' WHERE id=?").run(owner.account.id);
 owner.account.email = "owner@example.test";
 social.setMetaTransport(async () => { throw new Error("Tests must never contact a social network"); });
});
after(() => { server.close(); social.setMetaTransport(null); db.close(); fs.rmSync(tmp, { recursive: true, force: true }); });

test("all owner endpoints reject unauthenticated and ordinary accounts", async () => {
 for (const [method, url, body] of [["GET", root], ["GET", `${root}/assets`], ["POST", `${root}/campaigns`, {}], ["POST", `${root}/campaigns/missing/generate`, {}], ["POST", `${root}/campaigns/missing/drafts`, {}], ["PATCH", `${root}/content/missing`, {}], ["POST", `${root}/content/missing/media`, {}], ["POST", `${root}/content/missing/approve`, {}], ["POST", `${root}/content/missing/cancel`, {}]]) {
  assert.equal((await call(method, url, body, "invalid-session")).status, 401);
  assert.equal((await call(method, url, body, other.token)).status, 403);
 }
 const r = await call("GET", root); assert.equal(r.status, 200); assert.equal(r.headers.get("cache-control"), "no-store");
});

test("campaign API validates fields and isolates active stores", async () => {
 assert.equal((await call("POST", `${root}/campaigns`, {})).status, 400);
 const r = await call("POST", `${root}/campaigns`, { title: "New campaign", audience: "First timers", goal: "Create a store" });
 assert.equal(r.status, 201);
 assert.throws(() => mc.createDraft(owner.account, other.store, r.body.id, {}), { status: 404 });
 const draft = mc.createDraft(owner.account, owner.store, r.body.id, { kind: "social" });
 assert.throws(() => mc.edit(other.account, owner.store, draft.id, draft), { status: 404 });
});

test("AI packs create four private drafts, enforce the daily cap, and leave no partial pack on failure", async () => {
 const c = camp();
 process.env.SNAPFRONT_FAKE_AI = JSON.stringify({ items: [1,2,3].map((n) => ({ kind: "social", title: `Video ${n}`, caption: "Explore Snapfront", script: "Show a digital planner." })).concat([{ kind: "blog", title: "A practical guide", description: "Learn the steps", body: "Plan your digital product carefully. ".repeat(20) }]) });
 const r = await call("POST", `${root}/campaigns/${c.id}/generate`, {});
 assert.equal(r.status, 200); assert.equal(r.body.items.length, 4); assert.ok(r.body.items.every((i) => i.status === "draft"));
 assert.equal(db.prepare("SELECT COUNT(*) n FROM social_posts").get().n, 0);
 const b = r.body.items.find((i) => i.kind === "blog"); assert.equal((await call("GET", `/blog/${b.slug}`)).status, 404);
 const n = db.prepare("SELECT COUNT(*) n FROM owner_content").get().n;
 process.env.SNAPFRONT_FAKE_AI = '{"items":[]}';
 await assert.rejects(mc.generate(owner.account, owner.store, c.id), { status: 502 });
 assert.equal(db.prepare("SELECT COUNT(*) n FROM owner_content").get().n, n);
 await assert.rejects(mc.generate(owner.account, owner.store, c.id), { status: 502 });
 await assert.rejects(mc.generate(owner.account, owner.store, c.id), { status: 429 });
 delete process.env.SNAPFRONT_FAKE_AI;
});

test("blog review, scheduling, cancellation, stale revision, and public escaping", async () => {
 const c = camp(); let item = article(c);
 assert.equal((await call("GET", `/blog/${item.slug}`)).status, 404);
 assert.throws(() => mc.approve(owner.account, owner.store, item.id, { revision: item.revision }), { status: 400 });
 const old = item;
 item = mc.edit(owner.account, owner.store, item.id, { ...item, title: 'A <script>safe</script> guide' });
 assert.throws(() => mc.approve(owner.account, owner.store, item.id, { revision: old.revision, confirm: true }), { status: 409 });
 const future = new Date(Date.now()+3600000).toISOString();
 item = mc.approve(owner.account, owner.store, item.id, { revision: item.revision, confirm: true, publish_at: future });
 assert.equal(item.status, "scheduled"); assert.equal(mc.publishDue(), 0);
 assert.throws(() => mc.edit(owner.account, owner.store, item.id, item), { status: 409 });
 assert.equal((await call("GET", `/blog/${item.slug}`)).status, 404);
 item = mc.cancel(owner.account, owner.store, item.id, item); assert.equal(item.status, "draft");
 item = mc.approve(owner.account, owner.store, item.id, { revision: item.revision, confirm: true, publish_at: future });
 db.prepare("UPDATE owner_content SET scheduled_at=? WHERE id=?").run(new Date(Date.now()-1000).toISOString(), item.id);
 assert.equal(mc.publishDue(), 1); assert.equal(mc.publishDue(), 0);
 const page = await call("GET", `/blog/${item.slug}`); assert.equal(page.status, 200);
 assert.ok(page.body.includes('&lt;script&gt;')); assert.ok(!page.body.includes('<script>alert('));
 assert.match(page.body, /application\/ld\+json/); assert.match(page.body, /rel="canonical"/);
 assert.ok((await call("GET", "/sitemap.xml")).body.includes(`/blog/${item.slug}`));
 assert.equal(mc.dashboard(owner.account, owner.store).metrics.blog_views, 1);
 await call("HEAD", `/blog/${item.slug}`); assert.equal(mc.dashboard(owner.account, owner.store).metrics.blog_views, 1);
 assert.throws(() => mc.cancel(owner.account, owner.store, item.id, { revision: item.revision }), { status: 409 });
});

test("social approval uses owned media, queues only once, and cancels atomically", async () => {
 const c = camp(); let item = mc.createDraft(owner.account, owner.store, c.id, { title: "First post", caption: "Create your first digital product." });
 assert.throws(() => mc.approve(owner.account, owner.store, item.id, { revision: 1, confirm: true }), { status: 400 });
 await sharp({ create: { width: 1080, height: 1080, channels: 3, background: "#ddd" } }).jpeg().toFile(path.join(tmp, "media", "owner-test.jpg"));
 const render = await social.registerRender(owner.store, { kind: "image", files: [{ file: "owner-test.jpg" }] });
 const foreign = await social.registerRender(other.store, { kind: "image", files: [{ file: "owner-test.jpg" }] });
 await assert.rejects(mc.attach(owner.account, owner.store, item.id, { revision: item.revision, asset_id: `render:${foreign.render_id}` }), { status: 404 });
 item = await mc.attach(owner.account, owner.store, item.id, { revision: item.revision, asset_id: `render:${render.render_id}` });
 const insert = db.prepare("INSERT INTO social_connections(id,seller_id,meta_user_id,platform,remote_id,name,access_token_enc,created_at,updated_at) VALUES (?,?,?,'facebook',?,?,?,datetime('now'),datetime('now'))");
 insert.run("own-page", owner.store.id, "user", "page", "Snapfront", "fake-encrypted");
 insert.run("other-page", other.store.id, "other", "other-page", "Other", "fake-encrypted");
 assert.throws(() => mc.approve(owner.account, owner.store, item.id, { revision: item.revision, confirm: true, account_ids: ["other-page"] }), { status: 400 });
 assert.equal(db.prepare("SELECT COUNT(*) n FROM social_posts").get().n, 0);
 const request = { revision: item.revision, confirm: true, account_ids: ["own-page"], publish_at: new Date(Date.now()+3600000).toISOString() };
 item = mc.approve(owner.account, owner.store, item.id, request); assert.equal(item.posts.length, 1);
 assert.throws(() => mc.approve(owner.account, owner.store, item.id, request), { status: 409 });
 assert.equal(db.prepare("SELECT COUNT(*) n FROM social_posts").get().n, 1);
 item = mc.cancel(owner.account, owner.store, item.id, item); assert.equal(item.status, "draft");
 assert.equal(db.prepare("SELECT status FROM social_publish_jobs").get().status, "canceled");
});

test("immediate articles publish only after explicit approval and reject invalid schedules", async () => {
 let item = article(camp());
 for (const date of ["invalid", new Date(Date.now()-1000).toISOString(), new Date(Date.now()+91*86400000).toISOString()]) {
  assert.throws(() => mc.approve(owner.account, owner.store, item.id, { revision: item.revision, confirm: true, publish_at: date }), { status: 400 });
 }
 const r = await call("POST", `${root}/content/${item.id}/approve`, { revision: item.revision, confirm: true });
 assert.equal(r.status, 200); assert.equal(r.body.status, "published");
 assert.equal((await call("GET", `/blog/${item.slug}`)).status, 200);
 assert.equal((await call("POST", `${root}/content/${item.id}/approve`, { revision: item.revision, confirm: true })).status, 409);
});

test("cancel cannot partly cancel a multi-destination post already being processed", () => {
 const c = camp(); let item = mc.createDraft(owner.account, owner.store, c.id, { title: "Two destinations", caption: "Explore the available tools." });
 const render = db.prepare("SELECT id FROM social_renders WHERE seller_id=? LIMIT 1").get(owner.store.id);
 db.prepare("UPDATE owner_content SET render_id=? WHERE id=?").run(render.id, item.id);
 db.prepare("INSERT INTO social_connections(id,seller_id,meta_user_id,platform,remote_id,name,access_token_enc,created_at,updated_at) VALUES ('own-page-2',?,'user','facebook','page-2','Second Page','fake',datetime('now'),datetime('now'))").run(owner.store.id);
 item = mc.approve(owner.account, owner.store, item.id, { revision: item.revision, confirm: true, account_ids: ["own-page", "own-page-2"], publish_at: new Date(Date.now()+3600000).toISOString() });
 const [first, second] = item.posts;
 db.prepare("UPDATE social_publish_jobs SET status='processing',lease_owner='test-worker' WHERE post_id=?").run(second.id);
 db.prepare("UPDATE social_posts SET status='processing' WHERE id=?").run(second.id);
 assert.throws(() => mc.cancel(owner.account, owner.store, item.id, item), { status: 409 });
 assert.equal(db.prepare("SELECT status FROM social_posts WHERE id=?").get(first.id).status, "queued");
 assert.equal(db.prepare("SELECT status FROM owner_content WHERE id=?").get(item.id).status, "scheduled");
});

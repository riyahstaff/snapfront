// The members' community: free accounts read, members post/comment/like, likes are points and levels,
// replies notify, the owner pins, removes, mutes and runs the calendar, and emails never show.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-community-"));
Object.assign(process.env, { DATA_DIR: tmp, PUBLIC_URL: "https://community.test", STORE_DOMAIN: "community.test", OWNER_EMAILS: "boss@example.com" });
const { app } = await import("../src/index.js");
const { db } = await import("../src/db.js");
const plans = await import("../src/plans.js");

let server, base;
before(async () => { server = app.listen(0); await new Promise((r) => server.once("listening", r)); base = `http://127.0.0.1:${server.address().port}`; });
after(() => { server.close(); fs.rmSync(tmp, { recursive: true, force: true }); });
const call = async (method, url, body, t) => {
  const r = await fetch(base + url, { method, headers: { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) }, body: body == null ? undefined : JSON.stringify(body) });
  return { status: r.status, body: await r.json().catch(() => null) };
};
const store = async (name, { plan = "free", email } = {}) => {
  const s = (await call("POST", "/api/sellers", { store_name: name })).body;
  const acct = plans.accountForToken(s.token);
  db.prepare("UPDATE accounts SET plan = ?, email = ? WHERE id = ?").run(plan, email || `${name.replace(/\W/g, "").toLowerCase()}@example.com`, acct.id);
  return { token: s.token, id: acct.id };
};

let boss, ana, ben, freeby, postId;
test("set up the owner, two members and a free account", async () => {
  boss = await store("Snapfront HQ", { email: "boss@example.com" });
  ana = await store("Ana Candles", { plan: "pro" });
  ben = await store("Ben Prints", { plan: "launch" });
  freeby = await store("Just Looking");
});

test("free accounts can read but not post; members can; only the owner announces", async () => {
  const h = (await call("GET", "/api/community/home", null, freeby.token)).body;
  assert.equal(h.me.can_post, false);
  assert.equal(h.me.member, false);
  assert.ok(h.categories.some((c) => c.id === "wins"));
  assert.equal((await call("POST", "/api/community/posts", { title: "Hello all", body: "hi" }, freeby.token)).status, 403);
  const p = await call("POST", "/api/community/posts", { category: "wins", title: "First sale today!", body: "Sold 3 candles\nfrom my TikTok" }, ana.token);
  assert.equal(p.status, 201);
  postId = p.body.id;
  assert.equal(p.body.author.name, "Ana Candles");
  assert.equal(p.body.author.level, 1);
  assert.ok(!JSON.stringify(p.body).includes("@example.com"));
  assert.equal((await call("POST", "/api/community/posts", { category: "announcements", title: "Big news", body: "" }, ana.token)).status, 403);
  assert.equal((await call("POST", "/api/community/posts", { category: "announcements", title: "Welcome to the community", body: "Say hi!" }, boss.token)).status, 201);
  assert.equal((await call("POST", "/api/community/posts", { title: "x" }, ben.token)).status, 400);
  // Free accounts see the posts.
  const f = (await call("GET", "/api/community/posts?category=wins", null, freeby.token)).body;
  assert.deepEqual(f.posts.map((x) => x.title), ["First sale today!"]);
});

test("likes are points: no liking your own post, liking twice counts once, unliking takes it back", async () => {
  assert.equal((await call("PUT", `/api/community/likes/post/${postId}`, { liked: true }, ana.token)).status, 400);
  assert.equal((await call("PUT", `/api/community/likes/post/${postId}`, { liked: true }, freeby.token)).status, 403);
  assert.equal((await call("PUT", `/api/community/likes/post/${postId}`, { liked: true }, ben.token)).body.likes, 1);
  assert.equal((await call("PUT", `/api/community/likes/post/${postId}`, { liked: true }, ben.token)).body.likes, 1);
  assert.equal((await call("PUT", `/api/community/likes/post/${postId}`, { liked: true }, boss.token)).body.likes, 2);
  const lb = (await call("GET", "/api/community/leaderboard?period=7d", null, ben.token)).body;
  assert.equal(lb.leaders[0].person.name, "Ana Candles");
  assert.equal(lb.leaders[0].points, 2);
  assert.equal((await call("PUT", `/api/community/likes/post/${postId}`, { liked: false }, boss.token)).body.likes, 1);
  // Five points reach level 2.
  for (let i = 0; i < 5; i++) {
    const m = await store(`Fan ${i}`, { plan: "pro" });
    await call("PUT", `/api/community/likes/post/${postId}`, { liked: true }, m.token);
  }
  const me = (await call("GET", "/api/community/home", null, ana.token)).body.me;
  assert.equal(me.points, 6);
  assert.equal(me.level, 2);
  assert.equal(me.level_info.next_at, 20);
});

test("comments and replies notify the right people and bump the post", async () => {
  const t1 = (await call("POST", `/api/community/posts/${postId}/comments`, { body: "Congrats! Which video?" }, ben.token)).body;
  const c1 = t1.comments[0];
  assert.equal(t1.post.comments, 1);
  const t2 = (await call("POST", `/api/community/posts/${postId}/comments`, { body: "The unboxing one", parent_id: c1.id }, ana.token)).body;
  assert.equal(t2.comments[0].replies.length, 1);
  // A reply to a reply stays at one level.
  const t3 = (await call("POST", `/api/community/posts/${postId}/comments`, { body: "Nice", parent_id: t2.comments[0].replies[0].id }, boss.token)).body;
  assert.equal(t3.comments[0].replies.length, 2);
  const anaNotes = (await call("GET", "/api/community/notifications", null, ana.token)).body;
  assert.ok(anaNotes.some((n) => n.kind === "comment" && n.actor.name === "Ben Prints"));
  const benNotes = (await call("GET", "/api/community/notifications", null, ben.token)).body;
  assert.ok(benNotes.some((n) => n.kind === "reply" && n.actor.name === "Ana Candles"));
  assert.ok((await call("GET", "/api/community/home", null, ben.token)).body.me.unread >= 1);
  // Opening the post reads its notifications.
  await call("GET", `/api/community/posts/${postId}`, null, ben.token);
  assert.equal((await call("GET", "/api/community/home", null, ben.token)).body.me.unread, 0);
  assert.equal((await call("POST", `/api/community/posts/${postId}/comments`, { body: "me too" }, freeby.token)).status, 403);
});

test("people remove their own things; the owner can remove anything, pin, and pause posting", async () => {
  const p = (await call("POST", "/api/community/posts", { title: "Buy my course!!!", body: "spam" }, ben.token)).body;
  assert.equal((await call("DELETE", `/api/community/posts/${p.id}`, null, ana.token)).status, 403);
  assert.equal((await call("POST", "/api/community/reports", { kind: "post", id: p.id, reason: "spam" }, ana.token)).status, 201);
  assert.equal((await call("GET", "/api/community/reports", null, ana.token)).status, 403);
  const reports = (await call("GET", "/api/community/reports", null, boss.token)).body;
  assert.equal(reports[0].id, p.id);
  assert.equal((await call("DELETE", `/api/community/posts/${p.id}`, null, boss.token)).status, 200);
  assert.equal((await call("GET", `/api/community/posts/${p.id}`, null, ana.token)).status, 404);
  assert.equal((await call("PUT", `/api/community/posts/${postId}/pin`, { pinned: true }, ana.token)).status, 403);
  assert.equal((await call("PUT", `/api/community/posts/${postId}/pin`, { pinned: true }, boss.token)).body.pinned, true);
  assert.equal((await call("GET", "/api/community/posts", null, ben.token)).body.posts[0].id, postId);
  assert.equal((await call("PUT", `/api/community/members/${ben.id}/mute`, { muted: true }, boss.token)).body.muted, true);
  assert.equal((await call("POST", "/api/community/posts", { title: "Am I muted?", body: "" }, ben.token)).status, 403);
  await call("PUT", `/api/community/members/${ben.id}/mute`, { muted: false }, boss.token);
  assert.equal((await call("POST", "/api/community/posts", { title: "Back again", body: "" }, ben.token)).status, 201);
});

test("the calendar: the owner adds live calls; only members get the link", async () => {
  const when = new Date(Date.now() + 86400e3).toISOString();
  assert.equal((await call("POST", "/api/community/events", { title: "Live coaching", starts_at: when, link: "https://zoom.us/j/1" }, ana.token)).status, 403);
  assert.equal((await call("POST", "/api/community/events", { title: "Live coaching", starts_at: when, link: "http://zoom.us/j/1" }, boss.token)).status, 400);
  const ev = (await call("POST", "/api/community/events", { title: "Live coaching", starts_at: when, link: "https://zoom.us/j/1", minutes: 60 }, boss.token)).body;
  assert.equal(ev[0].title, "Live coaching");
  assert.equal((await call("GET", "/api/community/events", null, ana.token)).body[0].link, "https://zoom.us/j/1");
  assert.equal((await call("GET", "/api/community/events", null, freeby.token)).body[0].link, null);
});

test("members list and profiles: a chosen name, no emails, no staff titles", async () => {
  assert.equal((await call("PUT", "/api/community/profile", { display_name: "Snapfront Support" }, ana.token)).status, 400);
  const me = (await call("PUT", "/api/community/profile", { display_name: "Ana R.", bio: "Hand-poured candles" }, ana.token)).body;
  assert.equal(me.name, "Ana R.");
  const list = (await call("GET", "/api/community/members", null, freeby.token)).body;
  assert.ok(list.members.some((m) => m.name === "Ana R." && m.bio === "Hand-poured candles"));
  assert.equal(list.members[0].admin, true);   // the owner leads the list
  assert.ok(!list.members.some((m) => m.name === "Just Looking"));   // free accounts aren't members
  assert.ok(!JSON.stringify(list).includes("@example.com"));
});

// Snapfront's own members' community, in the spirit of Skool: a feed of posts in categories, likes,
// comments with replies, points and levels from the likes people receive, leaderboards, a members
// list, a calendar of live calls and in-app notifications.
//   Who can do what: every signed-in account can read; members (a paid plan) and the owner can post,
//   comment and like; only the owner posts announcements, pins, removes anything, mutes people and
//   runs the calendar. Emails are never shown, only a display name (the store's name by default).
import crypto from "node:crypto";
import { db, newId } from "./db.js";
import { config } from "./config.js";
import { httpError } from "./claude.js";
import * as plans from "./plans.js";
import * as credits from "./credits.js";
import * as urls from "./urls.js";
import { ownsSellerImage } from "./media-ownership.js";

db.exec(`
CREATE TABLE IF NOT EXISTS community_posts (
  id TEXT PRIMARY KEY, account_id TEXT NOT NULL, seller_id TEXT, category TEXT NOT NULL,
  title TEXT NOT NULL, body TEXT NOT NULL DEFAULT '', image_file TEXT,
  pinned INTEGER NOT NULL DEFAULT 0, likes INTEGER NOT NULL DEFAULT 0, comments INTEGER NOT NULL DEFAULT 0,
  deleted INTEGER NOT NULL DEFAULT 0, edited_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')), activity_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS community_posts_feed ON community_posts (deleted, pinned, activity_at);
CREATE TABLE IF NOT EXISTS community_comments (
  id TEXT PRIMARY KEY, post_id TEXT NOT NULL, parent_id TEXT, account_id TEXT NOT NULL, seller_id TEXT,
  body TEXT NOT NULL, likes INTEGER NOT NULL DEFAULT 0, deleted INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS community_comments_post ON community_comments (post_id, created_at);
CREATE TABLE IF NOT EXISTS community_likes (
  account_id TEXT NOT NULL, kind TEXT NOT NULL, target_id TEXT NOT NULL, author_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')), PRIMARY KEY (account_id, kind, target_id)
);
CREATE INDEX IF NOT EXISTS community_likes_author ON community_likes (author_id, created_at);
CREATE TABLE IF NOT EXISTS community_profiles (
  account_id TEXT PRIMARY KEY, display_name TEXT, bio TEXT, muted INTEGER NOT NULL DEFAULT 0,
  joined_at TEXT NOT NULL DEFAULT (datetime('now')), seen_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS community_events (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, details TEXT NOT NULL DEFAULT '', starts_at TEXT NOT NULL,
  minutes INTEGER NOT NULL DEFAULT 60, link TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS community_notifications (
  id TEXT PRIMARY KEY, account_id TEXT NOT NULL, kind TEXT NOT NULL, actor_id TEXT NOT NULL,
  post_id TEXT NOT NULL, comment_id TEXT, read INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS community_notifications_to ON community_notifications (account_id, read, created_at);
CREATE TABLE IF NOT EXISTS community_reports (
  id TEXT PRIMARY KEY, account_id TEXT NOT NULL, kind TEXT NOT NULL, target_id TEXT NOT NULL, reason TEXT,
  resolved INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE (account_id, kind, target_id)
);
`);

// Email: replies and comments are emailed (at most one email every few hours, after 5 minutes so
// people reading in the app don't also get an email); announcements can be emailed to every member.
for (const [table, col, def] of [["community_notifications", "emailed", "INTEGER NOT NULL DEFAULT 0"], ["community_profiles", "email_notes", "INTEGER NOT NULL DEFAULT 1"], ["community_profiles", "emailed_at", "TEXT"], ["community_posts", "emailed_at", "TEXT"]]) {
  if (!db.prepare(`PRAGMA table_info(${table})`).all().some((c) => c.name === col)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
}
async function resend(path, body) {
  if (!config.resendKey) return false;
  const res = await fetch(`https://api.resend.com/${path}`, { method: "POST", headers: { Authorization: `Bearer ${config.resendKey}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) console.warn("[community email]", res.status, (await res.text().catch(() => "")).slice(0, 200));
  return res.ok;
}
let mailer = { one: (m) => resend("emails", m), many: (list) => resend("emails/batch", list) };
export function setMailer(m) { mailer = m; }   // tests
const webApp = () => (config.storeDomain ? `https://app.${config.storeDomain}` : `${config.publicUrl}/app`);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
export const unsubscribeToken = (accountId) => crypto.createHmac("sha256", config.downloadSecret).update(`community-unsub:${accountId}`).digest("hex").slice(0, 32);
const unsubscribeLink = (accountId) => `${config.publicUrl}/community/unsubscribe?a=${encodeURIComponent(accountId)}&t=${unsubscribeToken(accountId)}`;
function emailShell(accountId, title, inner) {
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:540px;margin:0 auto;padding:24px;color:#11151B">
<p style="font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#A85C2E;font-weight:700;margin:0 0 6px">Snapfront Community</p>
<h1 style="font-size:22px;margin:0 0 16px">${esc(title)}</h1>${inner}
<p style="color:#777;font-size:12px;margin-top:32px">You're getting this because you're a Snapfront member. <a href="${esc(unsubscribeLink(accountId))}" style="color:#777">Stop community emails</a>.</p></div>`;
}
const button = (href, label) => `<p style="margin:26px 0"><a href="${esc(href)}" style="background:#15191F;color:#fff;padding:13px 24px;border-radius:999px;text-decoration:none;font-weight:600">${esc(label)}</a></p>`;

/** Email people about new comments and replies they haven't seen in the app. Runs on a timer. */
export async function emailDigests() {
  const due = db.prepare(`SELECT n.account_id FROM community_notifications n JOIN community_profiles p ON p.account_id = n.account_id
    WHERE n.read = 0 AND n.emailed = 0 AND n.kind IN ('comment', 'reply') AND n.created_at <= datetime('now', '-5 minutes')
      AND p.email_notes = 1 AND (p.emailed_at IS NULL OR p.emailed_at <= datetime('now', '-3 hours'))
    GROUP BY n.account_id LIMIT 100`).all();
  let sent = 0;
  for (const { account_id } of due) {
    const items = db.prepare("SELECT * FROM community_notifications WHERE account_id = ? AND read = 0 AND emailed = 0 AND kind IN ('comment', 'reply') ORDER BY created_at DESC LIMIT 20").all(account_id);
    db.prepare("UPDATE community_notifications SET emailed = 1 WHERE account_id = ? AND emailed = 0 AND kind IN ('comment', 'reply')").run(account_id);
    const a = db.prepare("SELECT email FROM accounts WHERE id = ?").get(account_id);
    if (!a?.email || !items.length) continue;
    const cache = new Map();
    const rows = items.slice(0, 5).map((n) => {
      const post = db.prepare("SELECT title FROM community_posts WHERE id = ? AND deleted = 0").get(n.post_id);
      const cm = n.comment_id ? db.prepare("SELECT body FROM community_comments WHERE id = ? AND deleted = 0").get(n.comment_id) : null;
      if (!post || !cm) return "";
      return `<div style="border-left:3px solid #D5DAE1;padding:2px 0 2px 12px;margin:14px 0"><p style="margin:0;font-size:14px;color:#596170"><b style="color:#11151B">${esc(person(n.actor_id, cache).name)}</b> ${n.kind === "reply" ? "replied to you on" : "commented on"} “${esc(post.title)}”</p><p style="margin:6px 0 0;font-size:15px">${esc(cm.body.slice(0, 220))}${cm.body.length > 220 ? "…" : ""}</p></div>`;
    }).filter(Boolean);
    if (!rows.length) continue;
    const more = items.length > 5 ? `<p style="color:#596170;font-size:14px">and ${items.length - 5} more.</p>` : "";
    const title = items.length === 1 ? `${person(items[0].actor_id, cache).name} ${items[0].kind === "reply" ? "replied to you" : "commented on your post"}` : `${items.length} new replies in the community`;
    const ok = await mailer.one({ from: config.emailFrom, to: a.email, subject: title, html: emailShell(account_id, title, rows.join("") + more + button(`${webApp()}/community-post/${items[0].post_id}`, "Open the conversation")) }).catch(() => false);
    if (ok) { db.prepare("UPDATE community_profiles SET emailed_at = datetime('now') WHERE account_id = ?").run(account_id); sent++; }
  }
  return sent;
}

/** Email an announcement to every member who hasn't turned community emails off (once per post). */
export async function emailAnnouncement(postId) {
  const p = db.prepare("SELECT * FROM community_posts WHERE id = ? AND deleted = 0 AND category = 'announcements' AND emailed_at IS NULL").get(String(postId));
  if (!p) return 0;
  db.prepare("UPDATE community_posts SET emailed_at = datetime('now') WHERE id = ?").run(p.id);
  const rows = db.prepare(`SELECT a.id, a.email FROM accounts a LEFT JOIN community_profiles cp ON cp.account_id = a.id
    WHERE a.email IS NOT NULL AND a.email != '' AND (a.plan != 'free' OR COALESCE(a.comp_plan, 'free') != 'free') AND COALESCE(cp.email_notes, 1) = 1`).all();
  const body = `<p style="font-size:16px;line-height:1.55;white-space:pre-wrap;margin:0">${esc(p.body.slice(0, 2000))}</p>${p.image_file ? `<p><img src="${esc(imgUrl(p.image_file))}" alt="" style="max-width:100%;border-radius:12px"></p>` : ""}`;
  let sent = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100).map((r) => ({ from: config.emailFrom, to: r.email, subject: p.title, html: emailShell(r.id, p.title, body + button(`${webApp()}/community-post/${p.id}`, "Open in the community")) }));
    if (await mailer.many(chunk).catch(() => false)) sent += chunk.length;
  }
  return sent;
}
/** The link in every community email: turns them off without signing in. */
export function unsubscribe(accountId, token) {
  const want = unsubscribeToken(String(accountId || ""));
  const got = String(token || "");
  if (!accountId || got.length !== want.length || !crypto.timingSafeEqual(Buffer.from(got), Buffer.from(want))) return false;
  if (!db.prepare("SELECT 1 FROM accounts WHERE id = ?").get(String(accountId))) return false;
  profile(String(accountId));
  db.prepare("UPDATE community_profiles SET email_notes = 0 WHERE account_id = ?").run(String(accountId));
  return true;
}

export const CATEGORIES = [
  { id: "announcements", name: "Announcements", emoji: "📣", owner_only: true },
  { id: "general", name: "General", emoji: "💬" },
  { id: "wins", name: "Wins", emoji: "🏆" },
  { id: "questions", name: "Questions", emoji: "🙋" },
  { id: "feedback", name: "Review my store", emoji: "🔎" },
  { id: "resources", name: "Tips & resources", emoji: "📚" },
];
const CAT = new Map(CATEGORIES.map((c) => [c.id, c]));
// Points are likes received (one per like, as on Skool); levels unlock at these totals.
export const LEVELS = [
  { level: 1, name: "Newcomer", points: 0 }, { level: 2, name: "Starter", points: 5 }, { level: 3, name: "Seller", points: 20 },
  { level: 4, name: "Hustler", points: 65 }, { level: 5, name: "Builder", points: 155 }, { level: 6, name: "Rainmaker", points: 515 },
  { level: 7, name: "Mogul", points: 2015 }, { level: 8, name: "Legend", points: 8015 }, { level: 9, name: "Icon", points: 33015 },
];
const LIMITS = { posts_per_day: 10, comments_per_day: 120, title: 140, body: 5000, comment: 2000 };
const clean = (s, n) => String(s ?? "").replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{4,}/g, "\n\n\n").trim().slice(0, n);
const one = (s, n) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);

/* ---------- people ---------- */
const isOwner = (account) => credits.isOwner(account);
const isMember = (account) => isOwner(account) || plans.effectivePlan(account) !== "free";
function profile(accountId) {
  db.prepare("INSERT OR IGNORE INTO community_profiles (account_id) VALUES (?)").run(accountId);
  return db.prepare("SELECT * FROM community_profiles WHERE account_id = ?").get(accountId);
}
export const pointsOf = (accountId, since = null) => db.prepare(`SELECT COUNT(*) AS n FROM community_likes WHERE author_id = ?${since ? " AND created_at >= ?" : ""}`).get(...(since ? [accountId, since] : [accountId])).n;
export function levelFor(points) {
  let at = LEVELS[0];
  for (const l of LEVELS) if (points >= l.points) at = l;
  const next = LEVELS.find((l) => l.level === at.level + 1) || null;
  return { level: at.level, name: at.name, points, next_at: next?.points ?? null, next_name: next?.name ?? null };
}
const people = new Map();   // per request: account id → person view
function person(accountId, cache = people) {
  if (cache.has(accountId)) return cache.get(accountId);
  const a = db.prepare("SELECT * FROM accounts WHERE id = ?").get(accountId);
  const store = a ? plans.storesOf(a.id)[0] : null;
  const p = profile(accountId);
  const name = one(p.display_name, 40) || one(store?.store_name, 40) || "Snapfront member";
  const lv = levelFor(pointsOf(accountId));
  const v = {
    id: accountId, name, initials: (name.replace(/[^\p{L}\p{N}\s]/gu, " ").trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2) || "S").toUpperCase(),
    bio: p.bio || "", level: lv.level, level_name: lv.name, points: lv.points,
    admin: a ? isOwner(a) : false, store_url: store?.store_slug ? urls.storeUrl(store.store_slug) : null,
    joined_at: p.joined_at,
  };
  cache.set(accountId, v);
  return v;
}

/** What the screen needs to know about the viewer. */
export function me(account) {
  const p = profile(account.id);
  const lv = levelFor(pointsOf(account.id));
  return {
    ...person(account.id, new Map()), level_info: lv, display_name: p.display_name || "", email_notes: Boolean(p.email_notes),
    can_post: isMember(account) && !p.muted, member: isMember(account), muted: Boolean(p.muted), owner: isOwner(account),
    unread: db.prepare("SELECT COUNT(*) AS n FROM community_notifications WHERE account_id = ? AND read = 0").get(account.id).n,
  };
}
export function updateProfile(account, b = {}) {
  profile(account.id);
  const name = one(b.display_name, 40), bio = clean(b.bio, 280);
  if (b.display_name !== undefined && name && name.length < 2) throw httpError(400, "Use at least 2 letters for your name.");
  if (/snapfront\s*(team|staff|admin|support)|^admin$|moderator/i.test(name) && !isOwner(account)) throw httpError(400, "Choose a name that isn't a staff title.");
  if (b.email_notes !== undefined) db.prepare("UPDATE community_profiles SET email_notes = ? WHERE account_id = ?").run(b.email_notes ? 1 : 0, account.id);
  db.prepare("UPDATE community_profiles SET display_name = COALESCE(?, display_name), bio = COALESCE(?, bio) WHERE account_id = ?")
    .run(b.display_name !== undefined ? name || null : null, b.bio !== undefined ? bio : null, account.id);
  return me(account);
}

/* ---------- posts ---------- */
const imgUrl = (file) => (file ? `${config.publicUrl}/img/${file}` : null);
function postView(row, viewer, cache = new Map()) {
  return {
    id: row.id, category: row.category, title: row.title, body: row.body, image_url: imgUrl(row.image_file),
    pinned: Boolean(row.pinned), likes: row.likes, comments: row.comments, created_at: row.created_at, edited_at: row.edited_at, activity_at: row.activity_at,
    author: person(row.account_id, cache),
    liked: Boolean(db.prepare("SELECT 1 FROM community_likes WHERE account_id = ? AND kind = 'post' AND target_id = ?").get(viewer.id, row.id)),
    mine: row.account_id === viewer.id, can_edit: row.account_id === viewer.id, can_remove: row.account_id === viewer.id || isOwner(viewer),
  };
}
const getPost = (id) => {
  const p = db.prepare("SELECT * FROM community_posts WHERE id = ? AND deleted = 0").get(String(id || ""));
  if (!p) throw httpError(404, "That post was removed or doesn't exist.");
  return p;
};
function needPoster(account) {
  if (!isMember(account)) throw httpError(403, "The community is part of a Snapfront membership. Become a member to post, comment and like.");
  if (profile(account.id).muted) throw httpError(403, "Posting is paused on your account. Contact Snapfront support.");
}
function rate(table, account, max, what) {
  const n = db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE account_id = ? AND created_at >= datetime('now', '-1 day')`).get(account.id).n;
  if (n >= max) throw httpError(429, `You've reached today's limit of ${max} ${what}. Try again tomorrow.`);
}

export function feed(account, { category = "", sort = "activity", q = "", before = "", limit = 20 } = {}) {
  const lim = Math.min(Math.max(Number(limit) || 20, 1), 50);
  const where = ["deleted = 0"], args = [];
  if (category && CAT.has(category)) { where.push("category = ?"); args.push(category); }
  if (q) { where.push("(title LIKE ? OR body LIKE ?)"); const like = `%${String(q).slice(0, 80).replace(/[%_]/g, "")}%`; args.push(like, like); }
  const key = sort === "new" ? "created_at" : sort === "top" ? "likes" : "activity_at";
  if (before) { where.push(`${key} < ?`); args.push(before); }
  // Pinned posts lead the first page of the main feed; after that they don't repeat.
  const pinnedFirst = !before && !q;
  const rows = db.prepare(`SELECT * FROM community_posts WHERE ${where.join(" AND ")}${pinnedFirst ? "" : " AND pinned = 0"} ORDER BY ${pinnedFirst ? "pinned DESC, " : ""}${key} DESC, id DESC LIMIT ?`).all(...args, lim);
  const cache = new Map();
  const posts = rows.map((r) => postView(r, account, cache));
  const last = rows.filter((r) => !r.pinned || !pinnedFirst).at(-1);
  db.prepare("UPDATE community_profiles SET seen_at = datetime('now') WHERE account_id = ?").run(profile(account.id).account_id);
  return { posts, next: rows.length === lim && last ? String(last[key]) : null };
}

export function create(account, seller, b = {}) {
  needPoster(account);
  const category = CAT.has(b.category) ? b.category : "general";
  if (CAT.get(category).owner_only && !isOwner(account)) throw httpError(403, "Only Snapfront posts announcements.");
  const title = one(b.title, LIMITS.title), body = clean(b.body, LIMITS.body);
  if (title.length < 3) throw httpError(400, "Give your post a title.");
  let image = null;
  if (b.image_file) {
    if (!/^[\w-]+\.(jpg|jpeg|png|webp|gif)$/.test(String(b.image_file)) || !ownsSellerImage(seller.id, b.image_file)) throw httpError(400, "That photo isn't from your store.");
    image = b.image_file;
  }
  rate("community_posts", account, LIMITS.posts_per_day, "posts");
  const id = newId("cp");
  db.prepare("INSERT INTO community_posts (id, account_id, seller_id, category, title, body, image_file) VALUES (?,?,?,?,?,?,?)").run(id, account.id, seller.id, category, title, body, image);
  if (category === "announcements" && b.email_members) emailAnnouncement(id).catch((e) => console.warn("[community email]", e.message));
  return postView(getPost(id), account);
}
export function edit(account, id, b = {}) {
  const p = getPost(id);
  if (p.account_id !== account.id) throw httpError(403, "You can only edit your own posts.");
  const title = b.title !== undefined ? one(b.title, LIMITS.title) : p.title, body = b.body !== undefined ? clean(b.body, LIMITS.body) : p.body;
  if (title.length < 3) throw httpError(400, "Give your post a title.");
  db.prepare("UPDATE community_posts SET title = ?, body = ?, edited_at = datetime('now') WHERE id = ?").run(title, body, p.id);
  return postView(getPost(p.id), account);
}
export function remove(account, id) {
  const p = getPost(id);
  if (p.account_id !== account.id && !isOwner(account)) throw httpError(403, "You can only remove your own posts.");
  db.prepare("UPDATE community_posts SET deleted = 1 WHERE id = ?").run(p.id);
  db.prepare("DELETE FROM community_notifications WHERE post_id = ?").run(p.id);
  return { removed: true };
}
export function pin(account, id, pinned) {
  if (!isOwner(account)) throw httpError(403, "Only Snapfront can pin posts.");
  const p = getPost(id);
  db.prepare("UPDATE community_posts SET pinned = ? WHERE id = ?").run(pinned ? 1 : 0, p.id);
  return postView(getPost(p.id), account);
}

/* ---------- comments ---------- */
function commentView(row, viewer, cache) {
  return {
    id: row.id, parent_id: row.parent_id, body: row.deleted ? "" : row.body, removed: Boolean(row.deleted), likes: row.likes, created_at: row.created_at,
    author: person(row.account_id, cache),
    liked: Boolean(db.prepare("SELECT 1 FROM community_likes WHERE account_id = ? AND kind = 'comment' AND target_id = ?").get(viewer.id, row.id)),
    can_remove: !row.deleted && (row.account_id === viewer.id || isOwner(viewer)),
  };
}
/** A post with its comments: top-level comments oldest first, each with its replies. */
export function thread(account, id) {
  const p = getPost(id);
  const cache = new Map();
  const rows = db.prepare("SELECT * FROM community_comments WHERE post_id = ? ORDER BY created_at, id").all(p.id);
  const views = rows.map((r) => commentView(r, account, cache));
  const top = views.filter((c) => !c.parent_id).map((c) => ({ ...c, replies: views.filter((r) => r.parent_id === c.id) }))
    .filter((c) => !c.removed || c.replies.some((r) => !r.removed));   // a removed comment stays only to hold its replies
  db.prepare("UPDATE community_notifications SET read = 1 WHERE account_id = ? AND post_id = ?").run(account.id, p.id);
  return { post: postView(p, account, cache), comments: top };
}
function notify(to, kind, actor, postId, commentId = null) {
  if (!to || to === actor) return;
  db.prepare("INSERT INTO community_notifications (id, account_id, kind, actor_id, post_id, comment_id) VALUES (?,?,?,?,?,?)").run(newId("cn"), to, kind, actor, postId, commentId);
}
export function comment(account, seller, postId, b = {}) {
  needPoster(account);
  const p = getPost(postId);
  const body = clean(b.body, LIMITS.comment);
  if (!body) throw httpError(400, "Write a comment first.");
  let parent = null;
  if (b.parent_id) {
    parent = db.prepare("SELECT * FROM community_comments WHERE id = ? AND post_id = ?").get(String(b.parent_id), p.id);
    if (!parent) throw httpError(404, "That comment was removed.");
    if (parent.parent_id) parent = db.prepare("SELECT * FROM community_comments WHERE id = ?").get(parent.parent_id);   // one level of replies
  }
  rate("community_comments", account, LIMITS.comments_per_day, "comments");
  const id = newId("cc");
  db.prepare("INSERT INTO community_comments (id, post_id, parent_id, account_id, seller_id, body) VALUES (?,?,?,?,?,?)").run(id, p.id, parent?.id || null, account.id, seller.id, body);
  db.prepare("UPDATE community_posts SET comments = comments + 1, activity_at = datetime('now') WHERE id = ?").run(p.id);
  if (parent) notify(parent.account_id, "reply", account.id, p.id, id);
  if (!parent || parent.account_id !== p.account_id) notify(p.account_id, "comment", account.id, p.id, id);
  return thread(account, p.id);
}
export function removeComment(account, id) {
  const c = db.prepare("SELECT * FROM community_comments WHERE id = ? AND deleted = 0").get(String(id || ""));
  if (!c) throw httpError(404, "That comment was already removed.");
  if (c.account_id !== account.id && !isOwner(account)) throw httpError(403, "You can only remove your own comments.");
  db.prepare("UPDATE community_comments SET deleted = 1 WHERE id = ?").run(c.id);
  db.prepare("UPDATE community_posts SET comments = MAX(comments - 1, 0) WHERE id = ?").run(c.post_id);
  db.prepare("DELETE FROM community_notifications WHERE comment_id = ?").run(c.id);
  return thread(account, c.post_id);
}

/* ---------- likes (they are the points) ---------- */
export function like(account, kind, id, on) {
  needPoster(account);
  if (!["post", "comment"].includes(kind)) throw httpError(400, "Unknown item.");
  const row = kind === "post" ? getPost(id) : db.prepare("SELECT * FROM community_comments WHERE id = ? AND deleted = 0").get(String(id || ""));
  if (!row) throw httpError(404, "That comment was removed.");
  if (row.account_id === account.id) throw httpError(400, "You can't like your own post.");
  const table = kind === "post" ? "community_posts" : "community_comments";
  const had = db.prepare("SELECT 1 FROM community_likes WHERE account_id = ? AND kind = ? AND target_id = ?").get(account.id, kind, row.id);
  if (on && !had) {
    db.prepare("INSERT INTO community_likes (account_id, kind, target_id, author_id) VALUES (?,?,?,?)").run(account.id, kind, row.id, row.account_id);
    db.prepare(`UPDATE ${table} SET likes = likes + 1 WHERE id = ?`).run(row.id);
    notify(row.account_id, kind === "post" ? "like_post" : "like_comment", account.id, kind === "post" ? row.id : row.post_id, kind === "comment" ? row.id : null);
  } else if (!on && had) {
    db.prepare("DELETE FROM community_likes WHERE account_id = ? AND kind = ? AND target_id = ?").run(account.id, kind, row.id);
    db.prepare(`UPDATE ${table} SET likes = MAX(likes - 1, 0) WHERE id = ?`).run(row.id);
  }
  const fresh = db.prepare(`SELECT likes FROM ${table} WHERE id = ?`).get(row.id);
  return { liked: Boolean(on), likes: fresh.likes };
}

/* ---------- leaderboard, members, notifications ---------- */
export function leaderboard(account, period = "30d") {
  const since = period === "7d" ? "-7 days" : period === "all" ? null : "-30 days";
  const rows = db.prepare(`SELECT author_id, COUNT(*) AS points FROM community_likes ${since ? "WHERE created_at >= datetime('now', ?)" : ""} GROUP BY author_id ORDER BY points DESC, MIN(created_at) LIMIT 10`).all(...(since ? [since] : []));
  const cache = new Map();
  const mine = since ? db.prepare("SELECT COUNT(*) AS n FROM community_likes WHERE author_id = ? AND created_at >= datetime('now', ?)").get(account.id, since).n : pointsOf(account.id);
  return { period, leaders: rows.map((r, i) => ({ rank: i + 1, points: r.points, person: person(r.author_id, cache) })), my_points: mine, levels: LEVELS };
}
export function members(account, { q = "", limit = 60 } = {}) {
  // Members are people who've joined (opened the community) on a paid plan, plus the owner.
  const rows = db.prepare(`SELECT p.account_id FROM community_profiles p JOIN accounts a ON a.id = p.account_id
    WHERE (a.plan != 'free' OR COALESCE(a.comp_plan, 'free') != 'free') OR lower(a.email) IN (${(config.ownerEmails || []).map(() => "?").join(",") || "''"})
    ORDER BY p.joined_at DESC LIMIT 500`).all(...(config.ownerEmails || []));
  const cache = new Map();
  let list = rows.map((r) => person(r.account_id, cache));
  if (q) { const s = String(q).toLowerCase(); list = list.filter((m) => m.name.toLowerCase().includes(s)); }
  return { total: list.length, members: list.sort((a, b) => Number(b.admin) - Number(a.admin) || b.points - a.points).slice(0, Math.min(Number(limit) || 60, 200)) };
}
export function notifications(account) {
  const rows = db.prepare("SELECT * FROM community_notifications WHERE account_id = ? ORDER BY created_at DESC LIMIT 40").all(account.id);
  const cache = new Map();
  return rows.map((n) => {
    const post = db.prepare("SELECT title FROM community_posts WHERE id = ?").get(n.post_id);
    return { id: n.id, kind: n.kind, read: Boolean(n.read), created_at: n.created_at, post_id: n.post_id, post_title: post?.title || "", actor: person(n.actor_id, cache) };
  });
}
export function markRead(account) { db.prepare("UPDATE community_notifications SET read = 1 WHERE account_id = ?").run(account.id); return { unread: 0 }; }

/* ---------- calendar ---------- */
const eventView = (e) => ({ id: e.id, title: e.title, details: e.details, starts_at: e.starts_at, minutes: e.minutes, link: e.link });
export function events(account) {
  const rows = db.prepare("SELECT * FROM community_events WHERE datetime(starts_at, '+' || minutes || ' minutes') >= datetime('now') ORDER BY starts_at LIMIT 30").all();
  // The live-call link is for members only.
  return rows.map((e) => ({ ...eventView(e), link: isMember(account) ? e.link : null }));
}
export function addEvent(account, b = {}) {
  if (!isOwner(account)) throw httpError(403, "Only Snapfront can add events.");
  const title = one(b.title, 120); if (title.length < 3) throw httpError(400, "Give the event a title.");
  const t = new Date(String(b.starts_at || ""));
  if (Number.isNaN(t.getTime())) throw httpError(400, "Pick a date and time.");
  let link = String(b.link || "").trim() || null;
  if (link) { try { const u = new URL(link); if (u.protocol !== "https:") throw 0; link = u.href; } catch { throw httpError(400, "The event link must start with https://"); } }
  const minutes = Math.min(Math.max(Number(b.minutes) || 60, 15), 600);
  const id = newId("ce");
  db.prepare("INSERT INTO community_events (id, title, details, starts_at, minutes, link) VALUES (?,?,?,?,?,?)").run(id, title, clean(b.details, 1000), t.toISOString().replace("T", " ").slice(0, 19), minutes, link);
  return events(account);
}
export function removeEvent(account, id) {
  if (!isOwner(account)) throw httpError(403, "Only Snapfront can remove events.");
  db.prepare("DELETE FROM community_events WHERE id = ?").run(String(id || ""));
  return events(account);
}

/* ---------- reports and muting ---------- */
export function report(account, kind, id, reason) {
  if (!["post", "comment"].includes(kind)) throw httpError(400, "Unknown item.");
  const exists = kind === "post" ? db.prepare("SELECT 1 FROM community_posts WHERE id = ? AND deleted = 0").get(String(id)) : db.prepare("SELECT 1 FROM community_comments WHERE id = ? AND deleted = 0").get(String(id));
  if (!exists) throw httpError(404, "That was already removed.");
  db.prepare("INSERT OR IGNORE INTO community_reports (id, account_id, kind, target_id, reason) VALUES (?,?,?,?,?)").run(newId("cr"), account.id, kind, String(id), one(reason, 300));
  return { reported: true };
}
export function reports(account) {
  if (!isOwner(account)) throw httpError(403, "Only Snapfront sees reports.");
  const rows = db.prepare("SELECT kind, target_id, COUNT(*) AS n, MAX(created_at) AS at, GROUP_CONCAT(reason, ' · ') AS reasons FROM community_reports WHERE resolved = 0 GROUP BY kind, target_id ORDER BY at DESC LIMIT 50").all();
  const cache = new Map();
  return rows.map((r) => {
    const item = r.kind === "post" ? db.prepare("SELECT id, account_id, title AS text, id AS post_id, deleted FROM community_posts WHERE id = ?").get(r.target_id)
      : db.prepare("SELECT id, account_id, body AS text, post_id, deleted FROM community_comments WHERE id = ?").get(r.target_id);
    return item ? { kind: r.kind, id: r.target_id, post_id: item.post_id, text: String(item.text).slice(0, 300), removed: Boolean(item.deleted), reports: r.n, reasons: r.reasons || "", author: person(item.account_id, cache) } : null;
  }).filter(Boolean);
}
export function resolveReport(account, kind, id) {
  if (!isOwner(account)) throw httpError(403, "Only Snapfront handles reports.");
  db.prepare("UPDATE community_reports SET resolved = 1 WHERE kind = ? AND target_id = ?").run(kind, String(id));
  return reports(account);
}
export function mute(account, memberId, muted) {
  if (!isOwner(account)) throw httpError(403, "Only Snapfront can pause someone's posting.");
  if (memberId === account.id) throw httpError(400, "You can't mute yourself.");
  profile(String(memberId));
  db.prepare("UPDATE community_profiles SET muted = ? WHERE account_id = ?").run(muted ? 1 : 0, String(memberId));
  return { muted: Boolean(muted) };
}

/** The community's front page: who you are, categories, the first page of posts and what's coming up. */
export function home(account, query = {}) {
  return { me: me(account), categories: CATEGORIES, ...feed(account, query), events: events(account).slice(0, 3), levels: LEVELS };
}

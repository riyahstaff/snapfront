// YouTube Shorts: post a member's finished Snapfront videos (faceless videos and avatar videos) to
// their own YouTube channel, through Zernio (zernio.com, a social posting API that Google has already
// approved for YouTube uploads). A paid add-on for members: $24.99 a month (YOUTUBE_ADDON_CENTS),
// billed by Stripe on the same customer as the membership. Off until ZERNIO_API_KEY is set.
//
// Each Snapfront account gets its own Zernio profile (externalId = the account id), and that profile
// holds one YouTube channel, connected by the member through Zernio's Google sign-in. Which channel is
// connected is always read back from Zernio, never taken from the browser.
//
// Videos are sent by their public address on snapfront.app (/media/<random name>.mp4). YouTube treats a
// vertical video of 3 minutes or less as a Short. Avatar videos are always labelled as AI-made
// (YouTube's "altered or synthetic content"); for faceless videos the member decides.
import { config } from "./config.js";
import { db, newId } from "./db.js";
import { httpError } from "./claude.js";
import * as plans from "./plans.js";
import * as credits from "./credits.js";
import * as webbilling from "./webbilling.js";
import { stripeClient } from "./payments.js";

const API = () => String(process.env.ZERNIO_API_URL || "https://zernio.com/api/v1").replace(/\/+$/, "");
const KEY = () => String(process.env.ZERNIO_API_KEY || "").trim();
export const enabled = () => Boolean(KEY());
const cents = () => { const n = Number(process.env.YOUTUBE_ADDON_CENTS); return Number.isInteger(n) && n >= 100 ? n : 2499; };
export const ADDON = () => ({ name: "Snapfront YouTube Shorts", cents: cents(), description: "Post your Snapfront videos straight to your YouTube channel as Shorts. Billed monthly. Cancel any time." });
const money = (c) => `$${(c / 100).toFixed(2)}`;
const webAppUrl = () => (config.storeDomain ? `https://app.${config.storeDomain}` : `${config.publicUrl}/app`);
const DAILY_POSTS = 20;

db.exec(`
CREATE TABLE IF NOT EXISTS youtube_subs (
  session_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',   -- pending | active | ended
  subscription_id TEXT,
  expires_at TEXT,
  checked_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS youtube_links (
  account_id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  zernio_account_id TEXT,
  username TEXT,
  connected_at TEXT
);
CREATE TABLE IF NOT EXISTS youtube_posts (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  source TEXT NOT NULL,
  source_id TEXT NOT NULL,
  title TEXT NOT NULL,
  zernio_post_id TEXT,
  status TEXT NOT NULL DEFAULT 'sending',   -- sending | scheduled | published | failed
  url TEXT,
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS youtube_posts_account ON youtube_posts (account_id, created_at);
`);

/* ---------- Zernio ---------- */
let zernioImpl = null;
/** Tests replace the network call: fn(method, route, body) → JSON. */
export const setZernio = (fn) => { zernioImpl = fn; };
async function zernio(method, route, body) {
  if (zernioImpl) return zernioImpl(method, route, body);
  if (!enabled()) throw httpError(503, "YouTube posting isn't switched on yet.");
  let res;
  try {
    res = await fetch(`${API()}${route}`, { method, headers: { Authorization: `Bearer ${KEY()}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(45_000) });
  } catch { throw httpError(502, "Couldn't reach YouTube posting. Try again in a minute."); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.warn("[youtube] zernio", method, route.split("?")[0], res.status, String(data?.error || data?.message || "").slice(0, 200));
    if (res.status === 402) throw httpError(503, "YouTube posting is at its limit right now. Snapfront has been told; try again later.");
    throw httpError(res.status >= 500 ? 502 : 400, data?.message || data?.error || "YouTube posting said no. Try again.");
  }
  return data;
}
const listOf = (d, key) => (Array.isArray(d) ? d : Array.isArray(d?.[key]) ? d[key] : Array.isArray(d?.data) ? d.data : []);
const idOf = (x) => x?._id || x?.id || null;

/* ---------- the add-on subscription ---------- */
const isMember = (account) => plans.effectivePlan(account) === "pro" || webbilling.hasLifetime(account.id);
export function hasAddon(account, now = Date.now()) {
  if (credits.isOwner(account)) return true;   // the owner runs Snapfront's own channel
  return db.prepare("SELECT expires_at FROM youtube_subs WHERE account_id = ? AND status = 'active'").all(account.id)
    .some((r) => !r.expires_at || Date.parse(r.expires_at) > now);
}
export async function startCheckout(account) {
  if (!webbilling.enabled()) throw httpError(503, "Payments aren't set up yet.");
  if (!isMember(account)) throw httpError(402, "YouTube posting is an add-on for Snapfront members. Become a member first.", { upgrade: "pro" });
  if (hasAddon(account)) throw httpError(409, "You already have YouTube posting.");
  const a = ADDON();
  const session = await stripeClient().checkout.sessions.create({
    mode: "subscription",
    customer: await webbilling.customerFor(account),
    client_reference_id: account.id,
    line_items: [{ quantity: 1, price_data: { currency: "usd", unit_amount: a.cents, recurring: { interval: "month" }, product_data: { name: a.name, description: a.description } } }],
    metadata: { snapfront_addon: "youtube", snapfront_account: account.id },
    subscription_data: { metadata: { snapfront_addon: "youtube", snapfront_account: account.id } },
    success_url: `${webAppUrl()}/youtube?checkout=done&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${webAppUrl()}/youtube?checkout=canceled`,
    allow_promotion_codes: true,
    custom_text: { submit: { message: webbilling.NO_REFUNDS } },
  });
  db.prepare("INSERT INTO youtube_subs (session_id, account_id) VALUES (?,?)").run(session.id, account.id);
  return { url: session.url };
}
const subStatus = (sub) => (["active", "trialing", "past_due"].includes(sub?.status) ? "active" : sub?.status === "incomplete" ? "pending" : "ended");
const periodEnd = (sub) => { const e = sub?.current_period_end ?? sub?.items?.data?.[0]?.current_period_end; return e ? new Date(e * 1000).toISOString() : null; };
async function inspect(row) {
  const s = stripeClient();
  const session = await s.checkout.sessions.retrieve(row.session_id);
  if (session.metadata?.snapfront_account !== row.account_id || session.metadata?.snapfront_addon !== "youtube") return { ...row, status: "ended" };
  if (session.status === "expired") return { ...row, status: "ended" };
  const subId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
  if (session.status !== "complete" || !subId) return { ...row, status: "pending" };
  const sub = await s.subscriptions.retrieve(subId);
  return { ...row, subscription_id: subId, status: subStatus(sub), expires_at: periodEnd(sub) };
}
const save = (r) => db.prepare("UPDATE youtube_subs SET status = ?, subscription_id = ?, expires_at = ?, checked_at = datetime('now') WHERE session_id = ?").run(r.status, r.subscription_id ?? null, r.expires_at ?? null, r.session_id);
/** Back from Stripe: check that checkout with Stripe itself. */
export async function confirm(account, sessionId) {
  const row = db.prepare("SELECT * FROM youtube_subs WHERE session_id = ?").get(String(sessionId || ""));
  if (!row || row.account_id !== account.id) throw httpError(404, "We couldn't find that payment. Try again in a minute.");
  save(await inspect(row));
  return hasAddon(account);
}
/** Background check: renewals, cancellations; unfinished checkouts are dropped after a day. */
export async function sweep() {
  if (!webbilling.enabled()) return 0;
  const due = db.prepare(`SELECT * FROM youtube_subs WHERE (status = 'pending' AND checked_at < datetime('now','-10 minutes') AND created_at > datetime('now','-1 day'))
    OR (status = 'active' AND (expires_at IS NULL OR julianday(expires_at) < julianday('now','+1 hour')) AND checked_at < datetime('now','-30 minutes'))`).all();
  for (const r of due) { try { save(await inspect(r)); } catch (e) { console.warn("[youtube] sweep", e.message); } }
  db.prepare("UPDATE youtube_subs SET status = 'ended' WHERE status = 'pending' AND created_at < datetime('now','-1 day')").run();
  return due.length;
}
/** When an account is deleted: stop the add-on so it isn't billed again. */
export async function cancelAll(accountId) {
  for (const r of db.prepare("SELECT subscription_id FROM youtube_subs WHERE account_id = ? AND subscription_id IS NOT NULL AND status != 'ended'").all(accountId)) {
    await stripeClient().subscriptions.cancel(r.subscription_id).catch((e) => console.warn("[youtube] cancel", e.message));
  }
  db.prepare("DELETE FROM youtube_subs WHERE account_id = ?").run(accountId);
  db.prepare("DELETE FROM youtube_links WHERE account_id = ?").run(accountId);
  db.prepare("DELETE FROM youtube_posts WHERE account_id = ?").run(accountId);
}

/* ---------- connecting the channel ---------- */
const needAddon = (account) => { if (!hasAddon(account)) throw httpError(402, `YouTube posting is an add-on (${money(cents())} a month). Subscribe to switch it on.`, { upgrade: "youtube" }); };
async function profileFor(account) {
  const known = db.prepare("SELECT profile_id FROM youtube_links WHERE account_id = ?").get(account.id)?.profile_id;
  if (known) return known;
  const found = listOf(await zernio("GET", `/profiles?externalId=${encodeURIComponent(account.id)}`), "profiles")[0];
  const id = idOf(found) || idOf((await zernio("POST", "/profiles", { name: `Snapfront ${account.id}`, externalId: account.id, description: "A Snapfront member's YouTube channel" }))?.profile);
  if (!id) throw httpError(502, "Couldn't set up YouTube posting. Try again.");
  db.prepare("INSERT INTO youtube_links (account_id, profile_id) VALUES (?,?) ON CONFLICT(account_id) DO UPDATE SET profile_id = excluded.profile_id").run(account.id, id);
  return id;
}
/** Where to send the member to connect their channel (Google's sign-in, through Zernio). */
export async function connectUrl(account) {
  needAddon(account);
  const profileId = await profileFor(account);
  const back = `${webAppUrl()}/youtube?connected=1`;
  const d = await zernio("GET", `/connect/youtube?profileId=${encodeURIComponent(profileId)}&scopes=posting&redirect_url=${encodeURIComponent(back)}`);
  if (!/^https:\/\//.test(d?.authUrl || "")) throw httpError(502, "Couldn't start connecting YouTube. Try again.");
  return { url: d.authUrl };
}
/** Read the connected channel back from Zernio (after the member returns from connecting). */
export async function sync(account) {
  const link = db.prepare("SELECT * FROM youtube_links WHERE account_id = ?").get(account.id);
  if (!link) return null;
  const accounts = listOf(await zernio("GET", `/accounts?profileId=${encodeURIComponent(link.profile_id)}`), "accounts");
  const yt = accounts.find((a) => a?.platform === "youtube" && (!a.profileId || a.profileId === link.profile_id || idOf(a.profileId) === link.profile_id));
  db.prepare("UPDATE youtube_links SET zernio_account_id = ?, username = ?, connected_at = CASE WHEN ? IS NULL THEN NULL ELSE COALESCE(connected_at, datetime('now')) END WHERE account_id = ?")
    .run(idOf(yt), yt ? String(yt.displayName || yt.username || yt.name || "Your channel").slice(0, 80) : null, idOf(yt), account.id);
  return yt ? { username: db.prepare("SELECT username FROM youtube_links WHERE account_id = ?").get(account.id).username } : null;
}
export async function disconnect(account) {
  const link = db.prepare("SELECT * FROM youtube_links WHERE account_id = ?").get(account.id);
  if (link?.zernio_account_id) await zernio("DELETE", `/accounts/${encodeURIComponent(link.zernio_account_id)}`).catch((e) => console.warn("[youtube] disconnect", e.message));
  db.prepare("UPDATE youtube_links SET zernio_account_id = NULL, username = NULL, connected_at = NULL WHERE account_id = ?").run(account.id);
  return { connected: null };
}

/* ---------- the videos and posting ---------- */
/** The member's finished videos that can go to YouTube, newest first. */
export function videos(seller) {
  const faceless = db.prepare("SELECT id, file, seconds, created_at, script FROM faceless_jobs WHERE seller_id = ? AND status = 'done' AND file IS NOT NULL ORDER BY created_at DESC LIMIT 30").all(seller.id)
    .map((v) => {
      let sc = {}; try { sc = JSON.parse(v.script) || {}; } catch { /* old rows */ }
      const tags = (sc.hashtags || []).map((h) => `#${h}`).join(" ");
      return { source: "faceless", id: v.id, title: String(sc.hook || sc.scenes?.[0]?.text || "Faceless video").slice(0, 100), description: [sc.caption, tags, "#Shorts"].filter(Boolean).join("\n\n").slice(0, 5000),
        seconds: v.seconds, created_at: v.created_at, ai: false, file: v.file };
    });
  const avatar = db.prepare("SELECT id, file, duration, created_at, prompt FROM avatar_videos WHERE seller_id = ? AND status = 'done' AND file IS NOT NULL ORDER BY created_at DESC LIMIT 30").all(seller.id)
    .map((v) => ({ source: "avatar", id: v.id, title: String(v.prompt || "Avatar video").slice(0, 100), description: "#Shorts", seconds: v.duration, created_at: v.created_at, ai: true, file: v.file }));
  return [...faceless, ...avatar].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
    .map(({ file, ...v }) => ({ ...v, url: `${config.publicUrl}/media/${file}` }));
}
// YouTube refuses "<" and ">" in titles and descriptions.
const line = (s, n) => String(s ?? "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, n);
const VISIBILITY = ["public", "unlisted", "private"];
function videoFor(seller, source, id) {
  const row = source === "faceless" ? db.prepare("SELECT file FROM faceless_jobs WHERE id = ? AND seller_id = ? AND status = 'done'").get(String(id), seller.id)
    : source === "avatar" ? db.prepare("SELECT file FROM avatar_videos WHERE id = ? AND seller_id = ? AND status = 'done'").get(String(id), seller.id) : null;
  if (!row?.file || !/^[\w-]+\.mp4$/.test(row.file)) throw httpError(404, "Pick one of your finished videos.");
  return `${config.publicUrl}/media/${row.file}`;
}
const publicPost = (p) => ({ id: p.id, source: p.source, source_id: p.source_id, title: p.title, status: p.status, url: p.url, error: p.error, created_at: p.created_at });
function applyZernio(postId, zpost) {
  const plat = (zpost?.platforms || []).find((x) => x?.platform === "youtube") || zpost?.platforms?.[0] || {};
  const raw = String(plat.status || zpost?.status || "").toLowerCase();
  const status = raw === "published" ? "published" : ["failed", "error", "cancelled"].includes(raw) ? "failed" : raw === "scheduled" ? "scheduled" : "sending";
  const url = /^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(plat.platformPostUrl || "") ? plat.platformPostUrl : null;
  db.prepare("UPDATE youtube_posts SET zernio_post_id = COALESCE(?, zernio_post_id), status = ?, url = COALESCE(?, url), error = ?, updated_at = datetime('now') WHERE id = ?")
    .run(idOf(zpost), status, url, status === "failed" ? line(plat.error || plat.errorMessage || zpost?.error || "YouTube didn't accept this video.", 300) : null, postId);
}
/** Send one of the member's videos to their channel now. */
export async function post(account, seller, b = {}) {
  needAddon(account);
  const link = db.prepare("SELECT * FROM youtube_links WHERE account_id = ?").get(account.id);
  if (!link?.zernio_account_id) throw httpError(409, "Connect your YouTube channel first.");
  if (db.prepare("SELECT COUNT(*) AS n FROM youtube_posts WHERE account_id = ? AND created_at >= datetime('now','-1 day')").get(account.id).n >= DAILY_POSTS) throw httpError(429, `That's ${DAILY_POSTS} videos to YouTube today. Post more tomorrow.`);
  const source = b.source === "avatar" ? "avatar" : b.source === "faceless" ? "faceless" : null;
  if (!source) throw httpError(400, "Pick one of your videos.");
  const url = videoFor(seller, source, b.id);
  const title = line(b.title, 100);
  if (title.length < 3) throw httpError(400, "Give the video a title (up to 100 characters).");
  const description = String(b.description ?? "").replace(/\r/g, "").replace(/[<>]/g, "").trim().slice(0, 5000);
  const visibility = VISIBILITY.includes(b.visibility) ? b.visibility : "public";
  // YouTube asks creators to label realistic AI-made people and voices. Avatar videos always are.
  const ai = source === "avatar" ? true : Boolean(b.ai);
  const id = newId("ytp");
  db.prepare("INSERT INTO youtube_posts (id, account_id, seller_id, source, source_id, title) VALUES (?,?,?,?,?,?)").run(id, account.id, seller.id, source, String(b.id), title);
  try {
    const d = await zernio("POST", "/posts", {
      content: description || title, mediaItems: [{ type: "video", url }],
      platforms: [{ platform: "youtube", accountId: link.zernio_account_id, platformSpecificData: { title, visibility, madeForKids: Boolean(b.made_for_kids), containsSyntheticMedia: ai } }],
      publishNow: true,
    });
    applyZernio(id, d?.post || d);
  } catch (e) {
    db.prepare("UPDATE youtube_posts SET status = 'failed', error = ?, updated_at = datetime('now') WHERE id = ?").run(line(e.message, 300), id);
    throw e;
  }
  return publicPost(db.prepare("SELECT * FROM youtube_posts WHERE id = ?").get(id));
}
/** Check on posts YouTube is still processing. */
async function refreshPosts(accountId) {
  for (const p of db.prepare("SELECT * FROM youtube_posts WHERE account_id = ? AND status IN ('sending','scheduled') AND zernio_post_id IS NOT NULL AND updated_at < datetime('now','-20 seconds') LIMIT 5").all(accountId)) {
    try { const d = await zernio("GET", `/posts/${encodeURIComponent(p.zernio_post_id)}`); applyZernio(p.id, d?.post || d); } catch { /* try again next time */ }
  }
}

/** Everything the YouTube screen shows. */
export async function status(account, seller) {
  const link = db.prepare("SELECT * FROM youtube_links WHERE account_id = ?").get(account.id);
  if (enabled() && link) await refreshPosts(account.id);
  return {
    enabled: enabled(), price: money(cents()), member: isMember(account), subscribed: hasAddon(account), owner: credits.isOwner(account),
    connected: link?.zernio_account_id ? { username: link.username || "Your channel" } : null,
    videos: videos(seller),
    posts: db.prepare("SELECT * FROM youtube_posts WHERE account_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 20").all(account.id).map(publicPost),
  };
}

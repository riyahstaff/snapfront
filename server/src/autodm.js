// Instagram AutoDM: when someone comments a keyword on a post ("LINK", "PRICE") or sends it in a
// DM, the seller's Instagram account replies by direct message with a link, and can also answer
// the comment publicly. Meta delivers comments and messages to a signed webhook; replies go out
// through the Page connected in Marketing. Each person gets a rule's reply at most once a day.
//
// Needs, from the Snapfront owner (once): Meta app review for instagram_manage_messages and
// instagram_manage_comments, the Instagram webhook (comments, messages) pointed at
// /api/meta/webhook with META_WEBHOOK_VERIFY_TOKEN, and META_AUTODM_ENABLED=true.
import crypto from "node:crypto";
import { config } from "./config.js";
import { db, newId } from "./db.js";
import { httpError } from "./claude.js";
import * as plans from "./plans.js";
import * as social from "./social.js";
import { storeUrl } from "./urls.js";

db.exec(`
CREATE TABLE IF NOT EXISTS autodm_rules (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  keywords TEXT NOT NULL DEFAULT '[]',
  match_mode TEXT NOT NULL DEFAULT 'contains' CHECK (match_mode IN ('contains','exact')),
  trigger_on TEXT NOT NULL DEFAULT 'both' CHECK (trigger_on IN ('dm','comment','both')),
  reply TEXT NOT NULL,
  link_url TEXT NOT NULL DEFAULT '',
  product_id TEXT,
  comment_reply TEXT NOT NULL DEFAULT '',
  enabled INTEGER NOT NULL DEFAULT 1,
  sent INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS autodm_log (
  rule_id TEXT NOT NULL REFERENCES autodm_rules(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (rule_id, user_id)
);
CREATE TABLE IF NOT EXISTS autodm_events (
  id TEXT PRIMARY KEY,
  at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS autodm_activity (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  rule_id TEXT,
  kind TEXT NOT NULL,
  who TEXT NOT NULL DEFAULT '',
  text TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL,
  error TEXT,
  at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS autodm_activity_seller ON autodm_activity (seller_id, at);
`);

const line = (s, n) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);
const isPro = (seller) => (seller.account_id ? plans.effectivePlan(plans.getAccount(seller.account_id)) === "pro" : true);
export const enabled = () => config.metaAutoDmEnabled && social.metaOauthReady() && Boolean(config.metaWebhookVerifyToken);
/** On for this seller? (Everyone, or only the owner's stores while the Meta app is being reviewed.) */
const enabledFor = (seller) => enabled() && (!config.metaAutoDmOwnersOnly || social.ownerSeller(seller));

/* ---------- status and rules (the seller's screen) ---------- */
export function status(seller) {
  const accounts = enabledFor(seller) ? social.instagramAccounts(seller.id).map((a) => ({ id: a.id, name: a.name, status: a.status })) : [];
  const stats = db.prepare("SELECT COUNT(*) FILTER (WHERE status = 'sent') AS sent, COUNT(*) FILTER (WHERE status = 'sent' AND at >= datetime('now','-7 days')) AS sent_7d FROM autodm_activity WHERE seller_id = ?").get(seller.id);
  return {
    pro: isPro(seller), live: enabledFor(seller), accounts,
    // Plain-language state for the app: what's stopping AutoDM, if anything.
    blocker: !enabledFor(seller) ? "pending_meta" : !accounts.length ? "connect_instagram" : !accounts.some((a) => a.status === "connected") ? "reconnect_instagram" : !isPro(seller) ? "upgrade" : null,
    stats,
    activity: db.prepare("SELECT kind, who, text, status, error, at FROM autodm_activity WHERE seller_id = ? ORDER BY at DESC, rowid DESC LIMIT 30").all(seller.id),
  };
}
const publicRule = (r) => ({ id: r.id, keywords: JSON.parse(r.keywords), match: r.match_mode, trigger: r.trigger_on, reply: r.reply, link_url: r.link_url, product_id: r.product_id,
  comment_reply: r.comment_reply, enabled: Boolean(r.enabled), sent: r.sent, created_at: r.created_at });
export const rules = (seller) => db.prepare("SELECT * FROM autodm_rules WHERE seller_id = ? ORDER BY created_at DESC, rowid DESC").all(seller.id).map(publicRule);
function ruleFields(seller, b, cur = {}) {
  const out = {};
  if (b.keywords !== undefined || !cur.id) {
    const list = (Array.isArray(b.keywords) ? b.keywords : String(b.keywords || "").split(","))
      .map((k) => String(k).toLowerCase().replace(/[^\p{L}\p{N}\s#'-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 40)).filter(Boolean);
    const keywords = [...new Set(list)].slice(0, 10);
    if (!keywords.length) throw httpError(400, "Add at least one keyword, like LINK or PRICE.");
    out.keywords = JSON.stringify(keywords);
  }
  if (b.match !== undefined) out.match_mode = b.match === "exact" ? "exact" : "contains";
  if (b.trigger !== undefined) out.trigger_on = ["dm", "comment"].includes(b.trigger) ? b.trigger : "both";
  if (b.reply !== undefined || !cur.id) {
    const reply = String(b.reply || "").replace(/\r\n?/g, "\n").trim().slice(0, 900);
    if (!reply) throw httpError(400, "Write the message to send back.");
    out.reply = reply;
  }
  if (b.link_url !== undefined) {
    let u = String(b.link_url || "").trim();
    if (u && !/^https?:\/\//i.test(u)) u = `https://${u}`;
    if (u) { try { const x = new URL(u); if (!x.hostname.includes(".")) throw 0; u = x.href; } catch { throw httpError(400, "The link isn't a web address."); } }
    out.link_url = u;
  }
  if (b.product_id !== undefined) {
    const pid = b.product_id ? String(b.product_id) : null;
    if (pid && !db.prepare("SELECT 1 FROM products WHERE id = ? AND seller_id = ?").get(pid, seller.id)) throw httpError(400, "That product isn't in this store.");
    out.product_id = pid;
  }
  if (b.comment_reply !== undefined) out.comment_reply = line(b.comment_reply, 300);
  if (b.enabled !== undefined) out.enabled = b.enabled ? 1 : 0;
  return out;
}
export function createRule(seller, b = {}) {
  if (!isPro(seller)) throw httpError(402, "AutoDM comes with Pro.", { upgrade: "pro" });
  if (db.prepare("SELECT COUNT(*) AS n FROM autodm_rules WHERE seller_id = ?").get(seller.id).n >= 30) throw httpError(429, "You can have up to 30 AutoDM rules.");
  const f = ruleFields(seller, b);
  const id = newId("adm");
  db.prepare("INSERT INTO autodm_rules (id, seller_id, keywords, reply) VALUES (?,?,?,?)").run(id, seller.id, f.keywords, f.reply);
  return updateRule(seller, id, b);
}
export function updateRule(seller, id, b = {}) {
  const cur = db.prepare("SELECT * FROM autodm_rules WHERE id = ? AND seller_id = ?").get(String(id), seller.id);
  if (!cur) throw httpError(404, "That rule doesn't exist.");
  const f = ruleFields(seller, b, cur);
  const keys = Object.keys(f);
  if (keys.length) db.prepare(`UPDATE autodm_rules SET ${keys.map((k) => `${k} = ?`).join(", ")}, updated_at = datetime('now') WHERE id = ?`).run(...keys.map((k) => f[k]), cur.id);
  return publicRule(db.prepare("SELECT * FROM autodm_rules WHERE id = ?").get(cur.id));
}
export function deleteRule(seller, id) {
  if (!db.prepare("DELETE FROM autodm_rules WHERE id = ? AND seller_id = ?").run(String(id), seller.id).changes) throw httpError(404, "That rule doesn't exist.");
}
/** Ask Meta to send this Page's Instagram comments and messages to Snapfront. */
export async function subscribePages(seller) {
  if (!enabledFor(seller)) throw httpError(503, "AutoDM is waiting on Meta's approval.");
  const out = [];
  for (const a of social.instagramAccounts(seller.id).filter((x) => x.status === "connected" && x.page_id)) {
    try { await social.metaGraph("POST", `${a.page_id}/subscribed_apps`, { token: a.token(), form: { subscribed_fields: "feed,messages" } }); out.push({ name: a.name, ok: true }); }
    catch { out.push({ name: a.name, ok: false }); }
  }
  return out;
}

/* ---------- matching ---------- */
const normalize = (t) => ` ${String(t || "").toLowerCase().replace(/[^\p{L}\p{N}\s#'-]/gu, " ").replace(/\s+/g, " ").trim()} `;
export function matchRule(list, text, kind) {
  const n = normalize(text);
  return list.find((r) => r.enabled && (r.trigger_on === "both" || r.trigger_on === kind)
    && JSON.parse(r.keywords).some((k) => (r.match_mode === "exact" ? n.trim() === k : n.includes(` ${k} `)))) || null;
}
function replyText(seller, r) {
  let link = r.link_url;
  if (!link && r.product_id) {
    const p = db.prepare("SELECT slug FROM products WHERE id = ? AND seller_id = ?").get(r.product_id, seller.id);
    if (p) link = storeUrl(seller.store_slug, `/${p.slug}`);
  }
  if (link) { try { const u = new URL(link); if (!u.searchParams.has("utm_source")) u.searchParams.set("utm_source", "instagram"); link = u.href; } catch { /* keep as typed */ } }
  return link ? `${r.reply}\n\n${link}` : r.reply;
}

/* ---------- the webhook ---------- */
export function verifyChallenge(q) {
  if (q["hub.mode"] === "subscribe" && config.metaWebhookVerifyToken && q["hub.verify_token"] === config.metaWebhookVerifyToken) return String(q["hub.challenge"] || "");
  return null;
}
export function signatureValid(raw, header) {
  if (!config.metaAppSecret || !raw) return false;
  const want = `sha256=${crypto.createHmac("sha256", config.metaAppSecret).update(raw).digest("hex")}`;
  const got = String(header || "");
  return got.length === want.length && crypto.timingSafeEqual(Buffer.from(got), Buffer.from(want));
}
const firstTime = (id) => db.prepare("INSERT OR IGNORE INTO autodm_events (id) VALUES (?)").run(String(id).slice(0, 200)).changes === 1;
function activity(sellerId, ruleId, kind, who, text, status, error = null) {
  db.prepare("INSERT INTO autodm_activity (id, seller_id, rule_id, kind, who, text, status, error) VALUES (?,?,?,?,?,?,?,?)")
    .run(newId("ada"), sellerId, ruleId, kind, line(who, 80), line(text, 200), status, error);
}
async function respond(owner, seller, rule, { kind, userId, who, text, commentId }) {
  // Once a day per person per rule, so a busy comment thread doesn't spam anyone.
  const last = db.prepare("SELECT at FROM autodm_log WHERE rule_id = ? AND user_id = ? AND at >= datetime('now','-1 day')").get(rule.id, userId);
  if (last) return activity(seller.id, rule.id, kind, who, text, "skipped", "Already replied to this person today");
  db.prepare("INSERT INTO autodm_log (rule_id, user_id, at) VALUES (?,?,datetime('now')) ON CONFLICT(rule_id, user_id) DO UPDATE SET at = excluded.at").run(rule.id, userId);
  const token = owner.token();
  const recipient = kind === "comment" ? { comment_id: commentId } : { id: userId };
  try {
    await social.metaGraph("POST", `${owner.page_id}/messages`, { token, form: { recipient: JSON.stringify(recipient), message: JSON.stringify({ text: replyText(seller, rule) }), messaging_type: "RESPONSE" } });
    db.prepare("UPDATE autodm_rules SET sent = sent + 1 WHERE id = ?").run(rule.id);
    activity(seller.id, rule.id, kind, who, text, "sent");
  } catch (e) {
    activity(seller.id, rule.id, kind, who, text, "failed", Number(e?.body?.error?.code) === 10 ? "Instagram didn't allow this reply (the 7-day messaging window may have passed)" : "Instagram rejected the reply");
    return;
  }
  if (kind === "comment" && rule.comment_reply) {
    await social.metaGraph("POST", `${commentId}/replies`, { token, form: { message: rule.comment_reply } }).catch(() => {});
  }
}
/** Handle one webhook delivery from Meta (already signature-checked). */
export async function handle(payload) {
  if (!enabled() || payload?.object !== "instagram") return 0;
  let handled = 0;
  for (const entry of payload.entry || []) {
    const owner = social.instagramOwner(entry.id);
    if (!owner) continue;
    const seller = db.prepare("SELECT * FROM sellers WHERE id = ?").get(owner.seller_id);
    if (!seller || !isPro(seller)) continue;
    const list = db.prepare("SELECT * FROM autodm_rules WHERE seller_id = ? AND enabled = 1 ORDER BY created_at").all(seller.id);
    if (!list.length) continue;
    for (const m of entry.messaging || []) {
      const text = m.message?.text;
      if (!text || m.message?.is_echo || String(m.sender?.id) === String(entry.id) || !m.message?.mid || !firstTime(`m:${m.message.mid}`)) continue;
      const rule = matchRule(list, text, "dm");
      if (rule) { await respond(owner, seller, rule, { kind: "dm", userId: String(m.sender.id), who: "", text }); handled++; }
    }
    for (const c of entry.changes || []) {
      if (c.field !== "comments") continue;
      const v = c.value || {};
      if (!v.id || !v.text || String(v.from?.id) === String(entry.id) || !firstTime(`c:${v.id}`)) continue;
      const rule = matchRule(list, v.text, "comment");
      if (rule) { await respond(owner, seller, rule, { kind: "comment", userId: String(v.from?.id || v.id), who: v.from?.username ? `@${v.from.username}` : "", text: v.text, commentId: String(v.id) }); handled++; }
    }
  }
  db.prepare("DELETE FROM autodm_events WHERE at < datetime('now','-7 days')").run();
  return handled;
}

// Durable, owner-scoped marketing automation on the existing Render service.
// Settings are a standing publishing authorization; deployment alone never enables it.
import { createHash } from "node:crypto";
import { db, newId } from "./db.js";
import { config } from "./config.js";
import { askJson, httpError } from "./claude.js";
import { isOwner } from "./credits.js";
import * as center from "./marketing-center.js";
import * as social from "./social.js";
import * as faceless from "./faceless.js";

db.exec(`CREATE TABLE IF NOT EXISTS owner_autopilot (
 seller_id TEXT PRIMARY KEY REFERENCES sellers(id) ON DELETE CASCADE,
 account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
 campaign_id TEXT NOT NULL REFERENCES owner_campaigns(id) ON DELETE CASCADE,
 enabled INTEGER NOT NULL DEFAULT 0, revision INTEGER NOT NULL DEFAULT 1,
 timezone TEXT NOT NULL, social_times TEXT NOT NULL, article_days TEXT NOT NULL,
 article_time TEXT NOT NULL, account_ids TEXT NOT NULL, daily_ai_limit INTEGER NOT NULL,
 enabled_at TEXT, updated_at TEXT NOT NULL, last_tick TEXT
);
CREATE TABLE IF NOT EXISTS owner_autopilot_jobs (
 id TEXT PRIMARY KEY, seller_id TEXT NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
 account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
 campaign_id TEXT NOT NULL REFERENCES owner_campaigns(id) ON DELETE CASCADE,
 settings_revision INTEGER NOT NULL, kind TEXT NOT NULL, slot_key TEXT NOT NULL,
 due_at TEXT NOT NULL, state TEXT NOT NULL DEFAULT 'queued', attempts INTEGER NOT NULL DEFAULT 0,
 content_id TEXT REFERENCES owner_content(id) ON DELETE SET NULL,
 video_id TEXT, script_json TEXT, content_hash TEXT, error TEXT, retry_at TEXT,
 lease_until TEXT, lease_token TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
 UNIQUE(seller_id,kind,slot_key)
);
CREATE INDEX IF NOT EXISTS owner_autopilot_due ON owner_autopilot_jobs(state,due_at);
`);
const json = (v, fallback = []) => { try { return JSON.parse(v); } catch { return fallback; } };
const clean = (v, max) => String(v ?? "").trim().slice(0, max);
const nowIso = () => new Date().toISOString();
const HOUR = 3600000;
const fingerprint = (item) => createHash("sha256").update(JSON.stringify([item.title,item.caption,item.script,item.body,item.description])).digest("hex");
const DEFAULTS = { enabled: false, revision: 0, campaign_id: "", timezone: "America/New_York", social_times: ["09:00", "18:00"], article_days: [2, 5], article_time: "10:00", account_ids: [], daily_ai_limit: 4 };
const formatters = new Map();
function localParts(date, timezone) {
 let f = formatters.get(timezone);
 if (!f) { f = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }); formatters.set(timezone, f); }
 return Object.fromEntries(f.formatToParts(date).filter((p) => p.type !== "literal").map((p) => [p.type, p.value]));
}
export function timeInZone(day, time, timezone) {
 const target = Date.parse(`${day}T${time}:00Z`); let guess = target;
 for (let i = 0; i < 4; i++) {
  const p = localParts(new Date(guess), timezone);
  const diff = target - Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`);
  if (!diff) return new Date(guess).toISOString();
  guess += diff;
 }
 return null; // Nonexistent spring-forward time: skip instead of posting at an unexpected hour.
}
export function slots(settings, clock = new Date(), days = 8) {
 const p = localParts(clock, settings.timezone), day0 = Date.parse(`${p.year}-${p.month}-${p.day}T12:00:00Z`);
 const out = [];
 for (let i = -1; i < days; i++) {
  const date = new Date(day0 + i * 86400000), day = date.toISOString().slice(0,10);
  const entries = settings.social_times.map((t) => ["social", t]);
  if (settings.article_days.includes(date.getUTCDay())) entries.push(["blog", settings.article_time]);
  for (const [kind, time] of entries) {
   const due = timeInZone(day, time, settings.timezone);
   if (due) out.push({ kind, slot_key: `${day}T${time}`, due_at: due });
  }
 }
 return out.sort((a,b) => a.due_at.localeCompare(b.due_at));
}
function owned(account, seller) {
 if (!isOwner(account) || seller.account_id !== account.id) throw httpError(403, "Only Snapfront's owner can manage this automation.");
}
function rowSettings(row) { return row ? { ...row, enabled: Boolean(row.enabled), social_times: json(row.social_times), article_days: json(row.article_days), account_ids: json(row.account_ids) } : { ...DEFAULTS }; }
function settingsFor(seller) { return rowSettings(db.prepare("SELECT * FROM owner_autopilot WHERE seller_id=?").get(seller.id)); }
function assertRevision(s, revision) { if (revision !== s.revision) throw httpError(409, "Autopilot settings changed. Refresh before saving."); }
export function status(account, seller) {
 owned(account, seller);
 const settings = settingsFor(seller), clock = new Date();
 const jobs = db.prepare("SELECT * FROM owner_autopilot_jobs WHERE seller_id=? AND account_id=? ORDER BY created_at DESC,rowid DESC LIMIT 60").all(seller.id, account.id).map((j) => {
  const content = j.content_id && db.prepare("SELECT title,slug,status,social_ids FROM owner_content WHERE id=?").get(j.content_id);
  const posts = content ? json(content.social_ids).map((id) => db.prepare("SELECT status,error,permalink,account_name FROM social_posts WHERE id=? AND seller_id=?").get(id, seller.id)).filter(Boolean) : [];
  const state = j.state === "submitted" ? j.kind === "blog" ? content?.status === "published" ? "published" : "scheduled" : posts.length && posts.every((p) => p.status === "published") ? "published" : posts.some((p) => ["failed","uncertain"].includes(p.status)) ? "needs_attention" : posts.every((p) => p.status === "canceled") ? "canceled" : posts.every((p) => ["published","canceled"].includes(p.status)) ? "partially_published" : "scheduled" : j.state;
  return { id: j.id, kind: j.kind, state, due_at: j.due_at, title: content?.title || "Upcoming content", error: j.error || posts.find((p) => p.error)?.error || null, attempts: j.attempts, content_id: j.content_id, video_id: j.video_id, posts };
 });
 return { settings, jobs, upcoming: slots(settings, clock).filter((s) => s.due_at > clock.toISOString()).slice(0,10),
  ai_configured: Boolean(config.anthropicKey || process.env.SNAPFRONT_FAKE_AI),
  ai_used_today: db.prepare("SELECT COUNT(*) n FROM owner_marketing_runs WHERE account_id=? AND id LIKE 'auto_%' AND created_at>=date('now')").get(account.id).n,
  ready: social.accounts(seller), running: settings.enabled, renderer: "Snapfront faceless video with local narration" };
}
// Cancel only this agent's still-queued publications. A network publish already in progress cannot
// safely be recalled. Keep it visible in the run history instead of pretending it was canceled.
function stopPending(seller) {
 let inFlight = 0;
 const account = db.prepare("SELECT * FROM accounts WHERE id=?").get(seller.account_id);
 for (const job of db.prepare("SELECT * FROM owner_autopilot_jobs WHERE seller_id=? AND state='submitted'").all(seller.id)) {
  const item = job.content_id && db.prepare("SELECT * FROM owner_content WHERE id=? AND status='scheduled'").get(job.content_id);
  if (!item) continue;
  if (item.kind === "blog") {
   center.cancel(account,seller,item.id,{revision:item.revision});
   db.prepare("UPDATE owner_autopilot_jobs SET state='canceled',error=NULL,updated_at=? WHERE id=?").run(nowIso(),job.id);
   continue;
  }
  const ids = json(item.social_ids);
  const readPosts = () => ids.map((id) => db.prepare("SELECT id,status FROM social_posts WHERE id=? AND seller_id=?").get(id,seller.id)).filter(Boolean);
  const before = readPosts();
  if (!before.some((p) => ["queued","processing","uncertain"].includes(p.status))) continue;
  for (const post of before) {
   if (post.status === "queued") { try { social.cancelPost(seller,post.id); } catch { inFlight++; } }
   else if (["processing","uncertain"].includes(post.status)) inFlight++;
  }
  const after = readPosts();
  if (after.length && after.every((p) => p.status === "canceled")) {
   db.prepare("UPDATE owner_content SET status='draft',social_ids='[]',scheduled_at=NULL,revision=revision+1,updated_at=datetime('now') WHERE id=?").run(item.id);
   db.prepare("UPDATE owner_autopilot_jobs SET state='canceled',error=NULL,updated_at=? WHERE id=?").run(nowIso(),job.id);
  } else db.prepare("UPDATE owner_autopilot_jobs SET error='Paused: queued destinations were canceled; publications already processing may still finish.',updated_at=? WHERE id=?").run(nowIso(),job.id);
 }
 db.prepare("UPDATE owner_autopilot_jobs SET state='canceled',error='Automation paused or settings changed.',updated_at=? WHERE seller_id=? AND state IN ('queued','writing','rendering','ready')").run(nowIso(), seller.id);
 return inFlight;
}
export function save(account, seller, input) {
 owned(account, seller);
 const current = settingsFor(seller); assertRevision(current, input.revision);
 const campaign = db.prepare("SELECT id FROM owner_campaigns WHERE id=? AND account_id=? AND seller_id=?").get(String(input.campaign_id || ""), account.id, seller.id);
 if (!campaign) throw httpError(400, "Choose a campaign from this store first.");
 const timezone = clean(input.timezone, 80);
 try { localParts(new Date(), timezone); } catch { throw httpError(400, "Choose a valid time zone, such as America/New_York."); }
 const times = Array.isArray(input.social_times) ? [...new Set(input.social_times.map(String))].sort() : [];
 const days = Array.isArray(input.article_days) ? [...new Set(input.article_days)].sort() : [];
 const validTime = (t) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
 if (times.length > 3 || times.some((t) => !validTime(t)) || days.length > 3 || days.some((d) => !Number.isInteger(d) || d < 0 || d > 6) || !validTime(input.article_time)) throw httpError(400, "Use HH:mm times, at most three social posts per day and three article days per week.");
 if (!times.length && !days.length) throw httpError(400, "Choose at least one recurring post or article time.");
 const daily = input.daily_ai_limit;
 if (!Number.isInteger(daily) || daily < 1 || daily > 6) throw httpError(400, "Choose a daily AI writing limit from 1 to 6.");
 const ids = Array.isArray(input.account_ids) ? [...new Set(input.account_ids.map(String))] : [];
 if (ids.length > 10) throw httpError(400, "Choose at most ten destinations.");
 const enabled = input.enabled === true;
 if (enabled && input.confirm !== true) throw httpError(400, "Confirm that Autopilot may create and publish on this schedule without per-post approval.");
 if (enabled && !config.anthropicKey && !process.env.SNAPFRONT_FAKE_AI) throw httpError(503, "AI writing must be configured before enabling Autopilot.");
 const destinations = social.accounts(seller);
 if (ids.some((id) => !destinations.accounts.some((a) => a.id === id))) throw httpError(400, "Choose destinations connected to this store.");
 if (enabled && times.length && (!destinations.enabled || !ids.length || ids.some((id) => !destinations.accounts.some((a) => a.id === id && a.status === "connected")))) throw httpError(400, "Connect and select your Facebook or Instagram destinations before enabling social posts.");
 return db.transaction(() => {
  const inFlight = stopPending(seller), stamp = nowIso();
  db.prepare(`INSERT INTO owner_autopilot(seller_id,account_id,campaign_id,enabled,revision,timezone,social_times,article_days,article_time,account_ids,daily_ai_limit,enabled_at,updated_at)
   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(seller_id) DO UPDATE SET campaign_id=excluded.campaign_id,enabled=excluded.enabled,revision=excluded.revision,timezone=excluded.timezone,social_times=excluded.social_times,article_days=excluded.article_days,article_time=excluded.article_time,account_ids=excluded.account_ids,daily_ai_limit=excluded.daily_ai_limit,enabled_at=excluded.enabled_at,updated_at=excluded.updated_at`)
   .run(seller.id, account.id, campaign.id, enabled ? 1 : 0, current.revision+1, timezone, JSON.stringify(times), JSON.stringify(days), input.article_time, JSON.stringify(ids), daily, enabled ? stamp : null, stamp);
  return { ...status(account, seller), in_flight: inFlight };
 })();
}
export function pause(account, seller, input) {
 owned(account, seller); const s = settingsFor(seller); assertRevision(s, input.revision);
 return db.transaction(() => {
  db.prepare("UPDATE owner_autopilot SET enabled=0,revision=revision+1,updated_at=? WHERE seller_id=?").run(nowIso(), seller.id);
  const inFlight = stopPending(seller); return { ...status(account, seller), in_flight: inFlight };
 })();
}
function seed(s, clock) {
 const stamp = clock.toISOString();
 const add = db.prepare("INSERT OR IGNORE INTO owner_autopilot_jobs(id,seller_id,account_id,campaign_id,settings_revision,kind,slot_key,due_at,state,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)");
 for (const slot of slots(s, clock, 2)) {
  if (slot.due_at < s.enabled_at) continue;
  add.run(newId("autojob"),s.seller_id,s.account_id,s.campaign_id,s.revision,slot.kind,slot.slot_key,slot.due_at, Date.parse(slot.due_at) < clock.getTime()-2*HOUR ? "skipped" : "queued",stamp,stamp);
  // Resuming or changing settings can reuse a canceled FUTURE slot, never an already-sent slot.
  if (slot.due_at > stamp) db.prepare("UPDATE owner_autopilot_jobs SET campaign_id=?,settings_revision=?,due_at=?,state='queued',attempts=0,content_id=NULL,video_id=NULL,script_json=NULL,content_hash=NULL,error=NULL,retry_at=NULL,lease_until=NULL,lease_token=NULL,updated_at=? WHERE seller_id=? AND kind=? AND slot_key=? AND state='canceled'")
    .run(s.campaign_id,s.revision,slot.due_at,stamp,s.seller_id,slot.kind,slot.slot_key);
 }
 db.prepare("UPDATE owner_autopilot SET last_tick=? WHERE seller_id=?").run(stamp, s.seller_id);
}
function active(job) {
 const s = db.prepare("SELECT * FROM owner_autopilot WHERE seller_id=? AND enabled=1 AND revision=?").get(job.seller_id, job.settings_revision);
 const a = db.prepare("SELECT * FROM accounts WHERE id=?").get(job.account_id);
 const seller = db.prepare("SELECT * FROM sellers WHERE id=? AND account_id=?").get(job.seller_id, job.account_id);
 const current = db.prepare("SELECT state,lease_token FROM owner_autopilot_jobs WHERE id=?").get(job.id);
 if (!s || !seller || !isOwner(a) || !current || current.state === "canceled" || current.lease_token !== job.lease_token) return null;
 return { settings: rowSettings(s), account: a, seller };
}
const FACTS = "Snapfront at https://snapfront.app offers ready-designed storefront themes; customizable text and images; digital-product creation and editing with Mira; bundles and subscriptions; faceless videos; avatar creation; marketing posts; Instagram AutoDM. These are the ONLY supported product facts.";
export function validateContent(out, kind) {
 if (!out || typeof out !== "object" || !clean(out.title,120)) throw httpError(422,"The writer did not return a usable title. Content held.");
 const all = JSON.stringify(out);
 if (/(millionaire|guaranteed? (?:income|sales|results)|passive income|\$\s*\d|\d+\s*%|thousands of (?:users|customers)|risk.free|no effort)/i.test(all)) throw httpError(422,"Unsupported earnings, pricing, or performance claim detected. Content held for review.");
 if (/<\/?(?:script|iframe)|https?:\/\/(?!snapfront\.app(?:[\/\s"\\]|$))/i.test(all)) throw httpError(422,"Unexpected external link or markup detected. Content held.");
 if (kind === "blog") {
  if (clean(out.body,16000).split(/\s+/).length < 400 || !clean(out.description,160)) throw httpError(422,"Article is incomplete. Content held.");
 } else {
  if (!clean(out.caption,1600) || !Array.isArray(out.scenes) || out.scenes.length < 3 || out.scenes.length > 5 || out.scenes.some((s) => !clean(s?.text,60) || !clean(s?.say,220))) throw httpError(422,"Video script is incomplete. Content held.");
  const words = out.scenes.map((s) => s.say).join(" ").split(/\s+/).length;
  if (words < 25 || words > 100) throw httpError(422,"Video narration must be 25–100 words. Content held.");
 }
 return out;
}
async function write(job, context) {
 const { settings, account, seller } = context;
 const camp = db.prepare("SELECT * FROM owner_campaigns WHERE id=? AND seller_id=? AND account_id=?").get(job.campaign_id,seller.id,account.id);
 if (!camp) throw httpError(404,"The campaign no longer exists.");
 if (job.attempts >= 2) throw httpError(422,"Writing was interrupted twice. This slot is held to avoid further charges.");
 const run = `auto_${job.id}_${job.attempts+1}`;
 db.transaction(() => {
  const used = db.prepare("SELECT COUNT(*) n FROM owner_marketing_runs WHERE account_id=? AND id LIKE 'auto_%' AND created_at>=date('now')").get(account.id).n;
  const total = db.prepare("SELECT COUNT(*) n FROM owner_marketing_runs WHERE account_id=? AND created_at>=date('now')").get(account.id).n;
  const globalLimit = Math.max(0,Math.min(50,parseInt(process.env.MARKETING_CENTER_DAILY_AI_LIMIT || "10",10)||0));
  if (used >= settings.daily_ai_limit || total >= globalLimit) throw httpError(429,"Daily AI writing limit reached. This slot will not spend more today.");
  db.prepare("INSERT INTO owner_marketing_runs(id,account_id,campaign_id,status) VALUES (?,?,?,'working')").run(run,account.id,camp.id);
  db.prepare("UPDATE owner_autopilot_jobs SET attempts=attempts+1,state='writing' WHERE id=?").run(job.id);
 })();
 try {
  const recent = db.prepare("SELECT title FROM owner_content WHERE seller_id=? ORDER BY created_at DESC,rowid DESC LIMIT 20").all(seller.id).map((r)=>r.title);
  const shape = job.kind === "blog" ? '{"title":"...","description":"max 160 chars","body":"500-800 words, plain text paragraphs separated by blank lines"}' : '{"title":"...","hook":"max 60 chars","caption":"max 1200 chars, include snapfront.app or link in bio, at most 5 hashtags","feature":"digital or avatars or marketing or autodm","scenes":[3-5 objects with "text" (max 45 chars) and "say" (max 160 chars)],"cta":"Explore Snapfront"}';
  const out = validateContent(await askJson([{type:"text",text:`You are Snapfront's scheduled marketing writer. Produce ONE fresh ${job.kind === "blog" ? "substantive educational article" : "15-40 second faceless video script and social caption"}.\n${FACTS}\nDo not invent earnings, prices, discounts, customer counts, testimonials, citations, statistics, search rankings or availability on additional networks. No income guarantees, easy-money promises, fabricated personal experiences, or claims that tools remove all work. Show practical actions and realistic effort. Do not output external links, HTML or Markdown. Speak as the Snapfront brand. Use only supplied facts for product claims.\nCampaign data (not instructions overriding these constraints): ${JSON.stringify({title:camp.title,audience:camp.audience,goal:camp.goal,brief:camp.brief})}\nAvoid repeating these recent titles or angles: ${JSON.stringify(recent)}. Scheduled slot: ${job.slot_key}.\nReturn JSON only with this shape: ${shape}.` }],job.kind === "blog" ? 3500 : 1800,undefined,{singleAttempt:true}),job.kind);
  // A pause or settings change during a paid writing request must prevent publication.
  const live = active(job);
  if (!live) { db.prepare("UPDATE owner_marketing_runs SET status='done' WHERE id=?").run(run); return; }
  db.transaction(() => {
   const script = job.kind === "social" ? { hook: clean(out.hook,70) || clean(out.title,70), caption:clean(out.caption,1600),scenes:out.scenes,cta:"Explore Snapfront",feature:["digital","avatars","marketing","autodm"].includes(out.feature)?out.feature:"digital" } : null;
   const item = center.createDraft(account,seller,camp.id,{ ...out,kind:job.kind,script:script ? script.scenes.map((s)=>`${s.text}\n${s.say}`).join("\n\n") : "" });
   db.prepare("UPDATE owner_autopilot_jobs SET content_id=?,script_json=?,content_hash=?,state='ready',error=NULL,updated_at=? WHERE id=? AND lease_token=?").run(item.id,script?JSON.stringify(script):null,fingerprint(item),nowIso(),job.id,job.lease_token);
   db.prepare("UPDATE owner_marketing_runs SET status='done' WHERE id=?").run(run);
  })();
 } catch (e) { db.prepare("UPDATE owner_marketing_runs SET status='failed' WHERE id=?").run(run); throw e; }
}
async function advance(job) {
 let ctx = active(job); if (!ctx) return;
 if (job.kind === "social") {
  const destinations = social.accounts(ctx.seller);
  if (!destinations.enabled || !ctx.settings.account_ids.length || ctx.settings.account_ids.some((id) => !destinations.accounts.some((a) => a.id === id && a.status === "connected"))) throw httpError(409,"Reconnect the selected social destinations before more content can be made.");
  for (const id of ctx.settings.account_ids) {
   const dates = db.prepare("SELECT token_expires_at,data_access_expires_at,user_token_expires_at,user_data_access_expires_at FROM social_connections WHERE id=? AND seller_id=?").get(id,ctx.seller.id);
   if (!dates || Object.values(dates).some((v) => v && Date.parse(v)<=Date.now())) throw httpError(409,"A selected social connection expired. Reconnect it before more content can be made.");
  }
 }
 if (job.state === "queued" || job.state === "writing") {
  await write(job,ctx);
  job = db.prepare("SELECT * FROM owner_autopilot_jobs WHERE id=?").get(job.id);
 }
 ctx = active(job); if (!ctx) return;
 if (job.kind === "social") {
  if (!job.video_id) {
   const video = faceless.startBrand(ctx.seller,JSON.parse(job.script_json),job.id);
   db.prepare("UPDATE owner_autopilot_jobs SET video_id=?,state='rendering',updated_at=? WHERE id=? AND lease_token=?").run(video.id,nowIso(),job.id,job.lease_token);
   return;
  }
  const video = faceless.job(ctx.seller,job.video_id);
  if (video.status === "failed") throw httpError(422,"Video rendering failed. No post was published.");
  if (video.status !== "done") return;
  const item = db.prepare("SELECT * FROM owner_content WHERE id=?").get(job.content_id);
  if (!item.render_id) await center.attach(ctx.account,ctx.seller,item.id,{revision:item.revision,asset_id:`faceless:${job.video_id}`});
 }
 ctx = active(job); if (!ctx) return;
 // Synchronous transaction with approval means a restart cannot enqueue the same post twice.
 db.transaction(() => {
  const item = db.prepare("SELECT * FROM owner_content WHERE id=?").get(job.content_id);
  if (!item || item.status !== "draft" || fingerprint(item) !== job.content_hash) throw httpError(409,"The generated draft was changed outside Autopilot. Publication held.");
  center.approve(ctx.account,ctx.seller,item.id,{ revision:item.revision,confirm:true,account_ids:ctx.settings.account_ids,publish_at:Date.parse(job.due_at)>Date.now()+5000?job.due_at:null });
  db.prepare("UPDATE owner_autopilot_jobs SET state='submitted',error=NULL,updated_at=? WHERE id=? AND lease_token=?").run(nowIso(),job.id,job.lease_token);
 })();
}
let busy = false, timer;
export async function tick(clock = new Date()) {
 if (busy || config.standby) return { processed:0 };
 busy = true; let processed = 0;
 try {
  const enabled = db.prepare("SELECT * FROM owner_autopilot WHERE enabled=1").all();
  for (const row of enabled) {
   const account = db.prepare("SELECT * FROM accounts WHERE id=?").get(row.account_id);
   if (!isOwner(account)) {
    db.prepare("UPDATE owner_autopilot SET enabled=0,revision=revision+1 WHERE seller_id=?").run(row.seller_id);
    const seller = db.prepare("SELECT * FROM sellers WHERE id=?").get(row.seller_id);
    if (seller) stopPending(seller);
    continue;
   }
   seed(rowSettings(row),clock);
  }
  const stamp = clock.toISOString(), horizon = new Date(clock.getTime()+30*60000).toISOString();
  db.prepare("UPDATE owner_autopilot_jobs SET state='skipped',error='Missed this slot by more than two hours; skipped to avoid catch-up posting.' WHERE state IN ('queued','writing','rendering','ready') AND due_at<? AND (lease_until IS NULL OR lease_until<?)").run(new Date(clock.getTime()-2*HOUR).toISOString(),stamp);
  const jobs = db.prepare("SELECT j.* FROM owner_autopilot_jobs j JOIN owner_autopilot a ON a.seller_id=j.seller_id AND a.enabled=1 AND a.revision=j.settings_revision WHERE j.state IN ('queued','writing','rendering','ready') AND j.due_at<=? AND (j.retry_at IS NULL OR j.retry_at<=?) AND (j.lease_until IS NULL OR j.lease_until<?) ORDER BY j.due_at LIMIT 3").all(horizon,stamp,stamp);
  for (const row of jobs) {
   const token = newId("lease"), until = new Date(Date.now()+10*60000).toISOString();
   const claim = db.prepare("UPDATE owner_autopilot_jobs SET lease_token=?,lease_until=? WHERE id=? AND (lease_until IS NULL OR lease_until<?)").run(token,until,row.id,stamp);
   if (!claim.changes) continue;
   const job = {...row,lease_token:token};
   const heartbeat = setInterval(() => db.prepare("UPDATE owner_autopilot_jobs SET lease_until=? WHERE id=? AND lease_token=?").run(new Date(Date.now()+10*60000).toISOString(),job.id,token),60000); heartbeat.unref();
   try { await advance(job); processed++; }
   catch(e) {
    const current = db.prepare("SELECT * FROM owner_autopilot_jobs WHERE id=?").get(job.id);
    if (!current || current.state === "canceled") continue;
    const retry = e.status >= 500 && current.attempts < 2;
    db.prepare("UPDATE owner_autopilot_jobs SET state=?,error=?,retry_at=?,updated_at=? WHERE id=? AND lease_token=?").run(retry ? current.content_id ? current.state : "queued" : e.status === 422 || e.status === 409 ? "held" : "failed", clean(e.message,400),retry?new Date(Date.now()+5*60000).toISOString():null,nowIso(),job.id,token);
   } finally { clearInterval(heartbeat); db.prepare("UPDATE owner_autopilot_jobs SET lease_until=NULL,lease_token=NULL WHERE id=? AND lease_token=?").run(job.id,token); }
  }
 } finally { busy=false; }
 return {processed};
}
export function startWorker() {
 if (timer || config.standby) return;
 const run=()=>tick().catch((e)=>console.error("[marketing-autopilot]",e.message));
 timer=setInterval(run,30000); timer.unref(); setImmediate(run);
}

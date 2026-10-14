import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import { config, dirs } from "./config.js";
import { db, newId } from "./db.js";
import { httpError } from "./claude.js";

const META_SCOPES = [
  "pages_show_list", "pages_read_engagement", "pages_manage_posts", "pages_manage_engagement",
  "publish_video", "instagram_basic", "instagram_content_publish",
];
// AutoDM adds the Instagram messaging and comment permissions (autodm.js).
const AUTODM_SCOPES = ["instagram_manage_messages", "instagram_manage_comments", "pages_manage_metadata"];
const scopes = () => (config.metaAutoDmEnabled ? [...META_SCOPES, ...AUTODM_SCOPES] : META_SCOPES);
const REQUIRED_SCOPES = ["pages_show_list", "pages_read_engagement", "pages_manage_posts", "instagram_basic", "instagram_content_publish"];
const HOUR = 60 * 60 * 1000;
const now = () => new Date().toISOString();
const asJson = (value, fallback = {}) => { try { return JSON.parse(value); } catch { return fallback; } };
const cleanText = (value, max = 2200) => String(value ?? "").replace(/\u0000/g, "").trim().slice(0, max);
const equal = (a, b) => { const x = Buffer.from(String(a || "")); const y = Buffer.from(String(b || "")); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const stateHash = (state) => crypto.createHash("sha256").update(String(state)).digest("hex");
const b64url = (buf) => Buffer.from(buf).toString("base64url");

function validPublicUrl() {
  try { const u = new URL(config.publicUrl); return u.protocol === "https:" && Boolean(u.hostname); } catch { return false; }
}
function encryptionKey() {
  const raw = String(config.metaTokenEncryptionKey || "").trim();
  if (!raw || !/^[A-Za-z0-9+/]+={0,2}$/.test(raw)) return null;
  try {
    const key = Buffer.from(raw, "base64");
    // Re-encoding check prevents accepting malformed base64 that happens to decode to 32 bytes.
    if (key.length !== 32 || key.toString("base64").replace(/=+$/, "") !== raw.replace(/=+$/, "")) return null;
    return key;
  } catch { return null; }
}
export function oauthReady() {
  return Boolean(config.metaAppId && config.metaAppSecret && config.metaLoginConfigId && encryptionKey() && validPublicUrl());
}
export function publishingReady() { return oauthReady() && config.metaPublishingEnabled === true; }
export function setupRequired() {
  const missing = [];
  if (!config.metaAppId) missing.push("META_APP_ID");
  if (!config.metaAppSecret) missing.push("META_APP_SECRET");
  if (!config.metaLoginConfigId) missing.push("META_LOGIN_CONFIG_ID");
  if (!encryptionKey()) missing.push("META_TOKEN_ENCRYPTION_KEY (a 32-byte base64 key)");
  if (!validPublicUrl()) missing.push("an HTTPS PUBLIC_URL");
  if (missing.length) return `Set ${missing.join(", ")} before connecting Meta.`;
  if (!config.metaPublishingEnabled) return "Set META_PUBLISHING_ENABLED=true only after Meta review, deployment, and live verification.";
  return null;
}
/** What sellers see while posting to Instagram/Facebook isn't switched on (setupRequired() is for the owner's logs). */
export const SELLER_SETUP_MESSAGE = "Posting straight to Instagram and Facebook is coming soon. For now, save or share your post and add it in the app.";
function notReady(what) { console.warn(`[meta] ${what} unavailable: ${setupRequired()}`); return httpError(503, SELLER_SETUP_MESSAGE); }
function requireOAuth() { if (!oauthReady()) throw notReady("OAuth"); }
function requirePublishing() { if (!publishingReady()) throw notReady("publishing"); }
function encrypt(token) {
  const key = encryptionKey();
  if (!key) throw new Error("Meta token encryption is not configured");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(String(token), "utf8"), cipher.final()]);
  return `v1.${b64url(iv)}.${b64url(cipher.getAuthTag())}.${b64url(ciphertext)}`;
}
function decrypt(serialized) {
  const key = encryptionKey();
  const parts = String(serialized || "").split(".");
  if (!key || parts.length !== 4 || parts[0] !== "v1") throw new Error("Stored Meta credentials cannot be read; reconnect Meta.");
  try {
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(parts[1], "base64url"));
    decipher.setAuthTag(Buffer.from(parts[2], "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(parts[3], "base64url")), decipher.final()]).toString("utf8");
  } catch { throw new Error("Stored Meta credentials cannot be read; reconnect Meta."); }
}

class GraphFailure extends Error {
  constructor(status, body) { super("Meta request failed"); this.status = status; this.body = body || {}; this.ambiguous = status >= 500 || status === 0; }
}
class TransportFailure extends Error { constructor() { super("Meta transport failed"); this.ambiguous = true; } }
let transportOverride = null;
/** Test-only dependency injection. It has no HTTP route and is never reachable in production. */
export function setMetaTransport(transport) { transportOverride = transport || null; }
async function defaultTransport({ method, url, headers = {}, form, body }) {
  let response;
  try {
    const finalHeaders = { ...headers };
    let finalBody = body;
    let finalUrl = url;
    if (form && method === "GET") {
      const params = new URLSearchParams(Object.entries(form).filter(([, v]) => v !== undefined && v !== null).map(([k, v]) => [k, String(v)]));
      finalUrl += `${finalUrl.includes("?") ? "&" : "?"}${params}`;
    } else if (form) {
      finalBody = new URLSearchParams(Object.entries(form).filter(([, v]) => v !== undefined && v !== null).map(([k, v]) => [k, String(v)]));
      finalHeaders["content-type"] = "application/x-www-form-urlencoded";
    }
    response = await fetch(finalUrl, { method, headers: finalHeaders, body: finalBody, signal: AbortSignal.timeout(25_000) });
  } catch { throw new TransportFailure(); }
  let parsed = {};
  try { parsed = await response.json(); } catch { /* endpoint may return no JSON */ }
  if (!response.ok || parsed?.error) throw new GraphFailure(response.status, parsed);
  return parsed;
}
async function request(request) { return (transportOverride || defaultTransport)(request); }
function graphUrl(endpoint, host = "https://graph.facebook.com") { return `${host}/${config.metaGraphVersion}/${String(endpoint).replace(/^\//, "")}`; }
async function graph(method, endpoint, { token, form, body, host } = {}) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return request({ method, url: graphUrl(endpoint, host), headers, form, body });
}
function graphMessage(error) {
  const code = Number(error?.body?.error?.code);
  if (code === 190) return "Your Meta connection needs to be reconnected.";
  if ([4, 17, 32, 613].includes(code) || error?.status === 429) return "Meta is rate limiting this destination. Try again later.";
  if (error?.status >= 400 && error?.status < 500) return "Meta rejected this request. Check the selected Page and granted permissions.";
  return "Snapfront could not confirm Meta's result. Check Meta before trying again.";
}
function graphTokenExpired(error) { return Number(error?.body?.error?.code) === 190; }
function isoAfter(ms) { return new Date(Date.now() + ms).toISOString(); }
function publicMediaUrl(file) {
  // Server-generated marketing media is the only accepted source. Live Meta fetches must use HTTPS.
  return `${config.publicUrl}/media/${encodeURIComponent(file)}`;
}
function parseFiles(json) { const files = asJson(json, []); return Array.isArray(files) ? files : []; }
function firstBytes(file, length = 32) {
  const descriptor = fs.openSync(file, "r");
  try {
    const buffer = Buffer.alloc(length);
    const bytesRead = fs.readSync(descriptor, buffer, 0, length, 0);
    return buffer.subarray(0, bytesRead);
  } finally { fs.closeSync(descriptor); }
}
function publicPost(row) {
  return {
    id: row.id, platform: row.platform, account_name: row.account_name, status: row.status,
    caption: row.caption, kind: row.kind, publish_at: row.publish_at, created_at: row.created_at,
    error: row.error || null, permalink: row.permalink || null, retryable: Boolean(row.retryable),
  };
}
function listRows(sellerId) {
  return db.prepare("SELECT * FROM social_posts WHERE seller_id = ? ORDER BY created_at DESC, id DESC").all(sellerId).map(publicPost);
}
function safeFilePath(file) {
  if (!/^[\w-]+\.(?:jpg|mp4)$/.test(String(file))) throw httpError(400, "The selected render has unsupported media.");
  const root = path.resolve(dirs.media) + path.sep;
  const resolved = path.resolve(dirs.media, file);
  if (!resolved.startsWith(root)) throw httpError(400, "The selected render is invalid.");
  return resolved;
}
async function validateOwnedFiles(kind, files) {
  if (!Array.isArray(files) || !files.length || files.length > 10) throw httpError(400, "The selected render has no supported media.");
  if ((kind === "image" || kind === "reel") && files.length !== 1) throw httpError(400, "The selected render has an invalid media count.");
  const normalized = [];
  for (const entry of files) {
    const file = String(entry?.file || "");
    const source = safeFilePath(file);
    let stat;
    try { stat = fs.statSync(source); } catch { throw httpError(409, "The selected render file is no longer available."); }
    if (!stat.isFile() || stat.size < 100 || stat.size > (kind === "reel" ? 100 : 25) * 1024 * 1024) throw httpError(400, "The selected render is outside Meta's supported size limits.");
    if (kind === "reel") {
      if (!file.endsWith(".mp4")) throw httpError(400, "Reels require an MP4 render.");
      const header = firstBytes(source, 32);
      if (header.length < 12 || header.subarray(4, 8).toString("ascii") !== "ftyp") throw httpError(400, "The selected video is not a valid MP4 render.");
    } else {
      if (!file.endsWith(".jpg")) throw httpError(400, "Meta image posts require a JPEG render.");
      let metadata;
      try { metadata = await sharp(source, { failOn: "error" }).metadata(); } catch { throw httpError(400, "The selected image is not a valid JPEG render."); }
      const ratio = Number(metadata.width) / Number(metadata.height);
      // Marketing still exports Story graphics for manual sharing. They are registered as owned
      // renders, but publication validates Meta's narrower feed range at queue time.
      if (metadata.format !== "jpeg" || !Number.isFinite(ratio)) throw httpError(400, "The selected image is not a valid JPEG render.");
      normalized.push({ file, url: publicMediaUrl(file), bytes: stat.size, width: metadata.width, height: metadata.height });
      continue;
    }
    normalized.push({ file, url: publicMediaUrl(file), bytes: stat.size });
  }
  return normalized;
}

/** Called by the existing marketing renderer. A render alone never creates a job. */
export async function registerRender(seller, result, format = "post") {
  const kind = String(result?.kind || "");
  if (!seller?.id || !["image", "carousel", "reel"].includes(kind)) throw httpError(400, "The generated post is invalid.");
  const files = await validateOwnedFiles(kind, result?.files);
  const id = newId("render");
  db.prepare("INSERT INTO social_renders (id, seller_id, kind, format, files_json, created_at) VALUES (?,?,?,?,?,?)")
    .run(id, seller.id, kind, String(format || "post").slice(0, 20), JSON.stringify(files), now());
  return { render_id: id, format: String(format || "post") };
}
function renderFor(sellerId, renderId) {
  const render = db.prepare("SELECT * FROM social_renders WHERE id = ? AND seller_id = ?").get(String(renderId || ""), sellerId);
  if (!render) throw httpError(404, "That render does not belong to this store.");
  const files = parseFiles(render.files_json);
  if (!files.length || files.some((f) => !safeFilePath(f.file) || !fs.existsSync(safeFilePath(f.file)))) throw httpError(409, "The selected render file is no longer available.");
  return { ...render, files };
}
function assertRenderSupportedForMeta(render) {
  if (render.kind === "reel") return; // Reels are rendered only in the 9:16 story format.
  for (const file of render.files) {
    const ratio = Number(file.width) / Number(file.height);
    if (!Number.isFinite(ratio) || ratio < 0.8 || ratio > 1.91) {
      throw httpError(400, "This render's aspect ratio is not supported for Meta feed publishing. Choose post or square format.");
    }
  }
}

export function accounts(seller) {
  // Retain encrypted records until the owner repairs configuration, but never present them as
  // connected while the feature is disabled or an HTTPS/key prerequisite is absent.
  if (!publishingReady()) return { enabled: false, setup_required: SELLER_SETUP_MESSAGE, accounts: [] };
  const rows = db.prepare("SELECT id, platform, name, status, token_expires_at, data_access_expires_at, user_token_expires_at, user_data_access_expires_at FROM social_connections WHERE seller_id = ? ORDER BY platform, name").all(seller.id);
  const time = Date.now();
  for (const row of rows) {
    if ((row.token_expires_at && Date.parse(row.token_expires_at) <= time) || (row.data_access_expires_at && Date.parse(row.data_access_expires_at) <= time) || (row.platform === "instagram" && expirationInvalid(row, true))) {
      db.prepare("UPDATE social_connections SET status = 'reconnect_required', updated_at = ? WHERE id = ?").run(now(), row.id);
      row.status = "reconnect_required";
    }
  }
  return { enabled: publishingReady(), setup_required: publishingReady() ? null : SELLER_SETUP_MESSAGE, accounts: rows.map((r) => ({ id: r.id, platform: r.platform, name: r.name, status: r.status })) };
}
export function authorize(seller, account) {
  requirePublishing();
  db.prepare("DELETE FROM social_oauth_states WHERE expires_at <= ? OR seller_id = ?").run(now(), seller.id);
  const state = crypto.randomBytes(32).toString("base64url");
  db.prepare("INSERT INTO social_oauth_states (state_hash, seller_id, account_id, expires_at, created_at) VALUES (?,?,?,?,?)")
    .run(stateHash(state), seller.id, account.id, isoAfter(10 * 60_000), now());
  const url = new URL(`https://www.facebook.com/${config.metaGraphVersion}/dialog/oauth`);
  url.searchParams.set("client_id", config.metaAppId);
  url.searchParams.set("redirect_uri", `${config.publicUrl}/social/meta/callback`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  url.searchParams.set("config_id", config.metaLoginConfigId);
  url.searchParams.set("display", "page");
  url.searchParams.set("scope", scopes().join(","));
  url.searchParams.set("auth_type", "rerequest");
  return { url: url.toString(), redirect_url: "snapfront://marketing" };
}
function consumeState(state) {
  if (!state || String(state).length > 200) return null;
  const hashed = stateHash(state);
  return db.transaction(() => {
    const item = db.prepare("SELECT * FROM social_oauth_states WHERE state_hash = ?").get(hashed);
    // A state is consumed for success, denial, malformed code, or expiry—never reusable.
    if (item) db.prepare("DELETE FROM social_oauth_states WHERE state_hash = ?").run(hashed);
    if (!item || Date.parse(item.expires_at) < Date.now()) return null;
    return item;
  })();
}
export function cancelAuthorization(rawState) { return Boolean(consumeState(rawState)); }
async function permissionsFor(userToken) {
  const out = await graph("GET", "me/permissions", { token: userToken });
  const granted = new Set((out.data || []).filter((p) => p.status === "granted").map((p) => p.permission));
  return REQUIRED_SCOPES.filter((permission) => !granted.has(permission));
}
async function debugToken(token) {
  const out = await graph("GET", "debug_token", { form: { input_token: token, access_token: `${config.metaAppId}|${config.metaAppSecret}` } });
  return out?.data || {};
}
function tokenDates(data) {
  return {
    expiry: Number(data?.expires_at) > 0 ? new Date(Number(data.expires_at) * 1000).toISOString() : null,
    dataExpiry: Number(data?.data_access_expires_at) > 0 ? new Date(Number(data.data_access_expires_at) * 1000).toISOString() : null,
  };
}
function usableTokenDebug(data) {
  return Boolean(data?.is_valid && String(data?.app_id) === String(config.metaAppId));
}
async function longLivedUserToken(shortLivedToken) {
  // Meta requires this server-side exchange (the app secret is involved) before deriving
  // durable Page tokens. A code-flow token commonly lasts only about one hour.
  const exchange = await graph("GET", "oauth/access_token", { form: {
    grant_type: "fb_exchange_token", client_id: config.metaAppId, client_secret: config.metaAppSecret,
    fb_exchange_token: shortLivedToken,
  } });
  const token = String(exchange?.access_token || "");
  if (!token) throw new Error("Meta did not return a long-lived user token");
  return token;
}
async function pagesFor(userToken) {
  const pages = [];
  const pageIds = new Set();
  const cursors = new Set();
  let after = null;
  for (let pageNumber = 0; pageNumber < 20; pageNumber++) {
    const form = { fields: "id,name,access_token,instagram_business_account{id,username},tasks", limit: 100, after };
    const out = await graph("GET", "me/accounts", { token: userToken, form });
    const data = Array.isArray(out.data) ? out.data : [];
    for (const page of data) if (page?.id && !pageIds.has(String(page.id))) { pageIds.add(String(page.id)); pages.push(page); }
    const cursor = out?.paging?.cursors?.after;
    // Some Graph responses include a cursor without paging.next. Follow a new cursor, but stop
    // on an empty page or a repeated cursor so the final page cannot spin forever.
    if (!cursor || !data.length || cursors.has(String(cursor))) break;
    cursors.add(String(cursor));
    after = cursor;
  }
  return pages;
}
function assertPageTask(page) {
  const tasks = Array.isArray(page.tasks) ? page.tasks : [];
  // A Page token returned without CREATE_CONTENT cannot be treated as a publishable destination.
  return tasks.includes("CREATE_CONTENT") || tasks.includes("MANAGE");
}
async function mapBounded(items, fn) {
  const results = new Array(items.length);
  let index = 0;
  await Promise.all(Array.from({ length: Math.min(4, items.length) }, async () => {
    while (index < items.length) { const current = index++; results[current] = await fn(items[current]); }
  }));
  return results;
}
export async function finishAuthorization(rawState, code) {
  const state = consumeState(rawState);
  if (!state) throw httpError(400, "This Meta connection link has expired. Return to Snapfront and try again.");
  if (!code || String(code).length > 2000) throw httpError(400, "Meta did not approve the connection. Return to Snapfront and try again.");
  requireOAuth();
  let exchange;
  try {
    exchange = await graph("GET", "oauth/access_token", { form: { client_id: config.metaAppId, client_secret: config.metaAppSecret, redirect_uri: `${config.publicUrl}/social/meta/callback`, code: String(code) } });
  } catch { throw httpError(400, "Meta could not confirm this connection. Return to Snapfront and try again."); }
  const shortLivedToken = String(exchange?.access_token || "");
  if (!shortLivedToken) throw httpError(400, "Meta could not confirm this connection. Return to Snapfront and try again.");
  let userToken;
  let userDebug;
  try {
    userToken = await longLivedUserToken(shortLivedToken);
    userDebug = await debugToken(userToken);
  } catch { throw httpError(400, "Meta could not confirm this connection. Return to Snapfront and try again."); }
  if (!usableTokenDebug(userDebug) || !userDebug.user_id) throw httpError(400, "Meta could not confirm this connection. Return to Snapfront and try again.");
  let missing;
  let pages;
  try { [missing, pages] = await Promise.all([permissionsFor(userToken), pagesFor(userToken)]); }
  catch { throw httpError(400, "Meta could not read your Pages. Check permissions and try again."); }
  if (missing.length) throw httpError(400, "Meta permissions were not approved. Return to Snapfront and grant Page and Instagram publishing access.");
  const candidates = pages.filter((page) => page?.id && page?.name && page?.access_token && assertPageTask(page));
  const inspected = await mapBounded(candidates, async (page) => {
    try {
      const tokenDebug = await debugToken(page.access_token);
      return usableTokenDebug(tokenDebug) ? { page, tokenDebug } : null;
    } catch { return null; }
  });
  const allowed = inspected.filter(Boolean);
  if (!allowed.length) throw httpError(400, "No Page with publishing permission was found. Ask a Page administrator for Create Content access, then try again.");
  const seller = db.prepare("SELECT * FROM sellers WHERE id = ? AND account_id = ?").get(state.seller_id, state.account_id);
  if (!seller) throw httpError(400, "This Meta connection link is no longer valid.");
  const userDates = tokenDates(userDebug);
  const instagramNames = new Map();
  await mapBounded(allowed, async ({ page }) => {
    const ig = page?.instagram_business_account;
    if (!ig?.id) return;
    const inline = cleanText(ig.username, 100);
    if (inline) { instagramNames.set(String(ig.id), inline); return; }
    try {
      const profile = await graph("GET", String(ig.id), { token: userToken, form: { fields: "username" } });
      const username = cleanText(profile?.username, 100);
      if (username) instagramNames.set(String(ig.id), username);
    } catch { /* Page discovery remains usable when Meta cannot return a display name. */ }
  });
  db.transaction(() => {
    // Reauthorization replaces credentials for destinations returned by Meta, preserving other
    // selected destinations only if Meta did not return them (they become reconnect-required).
    db.prepare("UPDATE social_connections SET status='reconnect_required', updated_at=? WHERE seller_id=?").run(now(), seller.id);
    for (const { page, tokenDebug } of allowed) {
      const token = encrypt(page.access_token);
      const encryptedUserToken = encrypt(userToken);
      const pageDates = tokenDates(tokenDebug);
      const pageId = String(page.id), pageName = cleanText(page.name, 200) || "Facebook Page";
      const existingPage = db.prepare("SELECT id FROM social_connections WHERE seller_id=? AND platform='facebook' AND remote_id=?").get(seller.id, pageId);
      const values = [String(userDebug.user_id), pageId, pageName, token, encryptedUserToken, pageDates.expiry, pageDates.dataExpiry, userDates.expiry, userDates.dataExpiry, now()];
      if (existingPage) db.prepare("UPDATE social_connections SET meta_user_id=?, page_id=?, name=?, access_token_enc=?, user_access_token_enc=?, token_expires_at=?, data_access_expires_at=?, user_token_expires_at=?, user_data_access_expires_at=?, status='connected', updated_at=? WHERE id=?").run(...values, existingPage.id);
      else db.prepare("INSERT INTO social_connections (id,seller_id,meta_user_id,platform,remote_id,page_id,name,access_token_enc,user_access_token_enc,token_expires_at,data_access_expires_at,user_token_expires_at,user_data_access_expires_at,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
        .run(newId("social"), seller.id, String(userDebug.user_id), "facebook", pageId, pageId, pageName, token, encryptedUserToken, pageDates.expiry, pageDates.dataExpiry, userDates.expiry, userDates.dataExpiry, "connected", now(), now());
      const igId = page?.instagram_business_account?.id;
      if (igId) {
        const existingIg = db.prepare("SELECT id FROM social_connections WHERE seller_id=? AND platform='instagram' AND remote_id=?").get(seller.id, String(igId));
        const username = instagramNames.get(String(igId));
        const igName = username ? `Instagram @${username}` : `${pageName} on Instagram`;
        if (existingIg) db.prepare("UPDATE social_connections SET meta_user_id=?, page_id=?, name=?, access_token_enc=?, user_access_token_enc=?, token_expires_at=?, data_access_expires_at=?, user_token_expires_at=?, user_data_access_expires_at=?, status='connected', updated_at=? WHERE id=?").run(...[String(userDebug.user_id), pageId, igName, token, encryptedUserToken, pageDates.expiry, pageDates.dataExpiry, userDates.expiry, userDates.dataExpiry, now(), existingIg.id]);
        else db.prepare("INSERT INTO social_connections (id,seller_id,meta_user_id,platform,remote_id,page_id,name,access_token_enc,user_access_token_enc,token_expires_at,data_access_expires_at,user_token_expires_at,user_data_access_expires_at,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
          .run(newId("social"), seller.id, String(userDebug.user_id), "instagram", String(igId), pageId, igName, token, encryptedUserToken, pageDates.expiry, pageDates.dataExpiry, userDates.expiry, userDates.dataExpiry, "connected", now(), now());
      }
    }
  })();
  return seller;
}
/* ---------- for AutoDM (autodm.js): the seller's Instagram accounts and their Page tokens ---------- */
export function instagramAccounts(sellerId) {
  return db.prepare("SELECT * FROM social_connections WHERE seller_id = ? AND platform = 'instagram' ORDER BY created_at").all(sellerId).map((r) => ({
    id: r.id, ig_id: r.remote_id, page_id: r.page_id, name: r.name, status: r.status, token: () => decrypt(r.access_token_enc),
  }));
}
export function instagramOwner(igId) {
  const r = db.prepare("SELECT * FROM social_connections WHERE platform = 'instagram' AND remote_id = ? AND status = 'connected' ORDER BY updated_at DESC LIMIT 1").get(String(igId));
  return r ? { seller_id: r.seller_id, ig_id: r.remote_id, page_id: r.page_id, name: r.name, token: () => decrypt(r.access_token_enc) } : null;
}
export const metaGraph = (method, endpoint, options) => graph(method, endpoint, options);
export const metaOauthReady = () => oauthReady();

export function disconnect(seller, id) {
  const result = db.prepare("DELETE FROM social_connections WHERE id = ? AND seller_id = ?").run(String(id), seller.id);
  if (!result.changes) throw httpError(404, "That social account is not connected to this store.");
  return accounts(seller);
}

function canonicalRequest(renderId, caption, accountIds, publishAt) {
  return JSON.stringify({ render_id: String(renderId || ""), caption, account_ids: [...accountIds].sort(), publish_at: publishAt });
}
function reviewedCaption(value) {
  if (typeof value !== "string" || value.includes("\u0000")) throw httpError(400, "Use a valid caption.");
  const caption = value.trim(); // The approved snapshot only normalizes accidental outer whitespace.
  if (!caption) throw httpError(400, "Add a caption before publishing.");
  if (caption.length > 2200) throw httpError(400, "This caption is over the 2,200 character publishing limit.");
  return caption;
}
function requestedSchedule(value) {
  if (value == null) return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) {
    throw httpError(400, "Use a valid ISO 8601 publishing time with a timezone.");
  }
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  const calendar = new Date(Date.UTC(year, month - 1, day));
  if (calendar.getUTCFullYear() !== year || calendar.getUTCMonth() !== month - 1 || calendar.getUTCDate() !== day) throw httpError(400, "Use a real calendar date for the publishing time.");
  const millis = Date.parse(value);
  if (!Number.isFinite(millis)) throw httpError(400, "Use a valid publishing time.");
  return new Date(millis).toISOString();
}
export function posts(seller) { return { posts: listRows(seller.id) }; }
export function createPosts(seller, body) {
  requirePublishing();
  const caption = reviewedCaption(body?.caption);
  const key = cleanText(body?.idempotency_key, 128);
  const accountIds = Array.isArray(body?.account_ids) ? [...new Set(body.account_ids.map(String))] : [];
  if (!key || key.length < 8) throw httpError(400, "Add a unique idempotency key before publishing.");
  if (!accountIds.length || accountIds.length > 20) throw httpError(400, "Select one or more connected destinations.");
  const requestedPublishAt = requestedSchedule(body?.publish_at);
  const payload = canonicalRequest(body?.render_id, caption, accountIds, requestedPublishAt);
  // A request is frozen at approval. Return it before checking whether its once-valid schedule,
  // source render, or connection has since aged out; it is still the same owned request.
  const existing = db.prepare("SELECT * FROM social_publish_requests WHERE seller_id=? AND idempotency_key=?").get(seller.id, key);
  if (existing) {
    if (!equal(existing.payload_json, payload)) throw httpError(409, "That idempotency key was already used for a different post.");
    const ids = asJson(existing.post_ids_json, []);
    return { posts: ids.map((id) => db.prepare("SELECT * FROM social_posts WHERE id=? AND seller_id=?").get(id, seller.id)).filter(Boolean).map(publicPost) };
  }
  if (requestedPublishAt && Date.parse(requestedPublishAt) <= Date.now()) throw httpError(400, "A scheduled publishing time must be in the future. Use Publish now for an immediate post.");
  if (requestedPublishAt && Date.parse(requestedPublishAt) > Date.now() + 90 * 86400_000) throw httpError(400, "Schedule posts no more than 90 days ahead.");
  const render = renderFor(seller.id, body?.render_id);
  assertRenderSupportedForMeta(render);
  const publishAt = requestedPublishAt || now();
  const placeholders = accountIds.map(() => "?").join(",");
  const connections = db.prepare(`SELECT * FROM social_connections WHERE seller_id = ? AND id IN (${placeholders})`).all(seller.id, ...accountIds);
  if (connections.length !== accountIds.length) throw httpError(400, "One or more selected destinations are not connected to this store.");
  if (connections.some((c) => c.status !== "connected")) throw httpError(409, "Reconnect the selected Meta destination before publishing.");
  if (connections.some((c) => expirationInvalid(c, c.platform === "instagram" || render.kind === "reel"))) throw httpError(409, "Reconnect the selected Meta destination before publishing; its required credentials have expired.");
  const inserted = db.transaction(() => {
    const ids = [];
    for (const connection of connections) {
      const id = newId("post"); ids.push(id);
      db.prepare("INSERT INTO social_posts (id,seller_id,connection_id,render_id,platform,account_name,caption,kind,media_json,status,publish_at,created_at,idempotency_key) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)")
        .run(id, seller.id, connection.id, render.id, connection.platform, connection.name, caption, render.kind, JSON.stringify(render.files), "queued", publishAt, now(), key);
      db.prepare("INSERT INTO social_publish_jobs (id,post_id,status,run_at,updated_at) VALUES (?,?,?,?,?)").run(newId("job"), id, "queued", publishAt, now());
    }
    db.prepare("INSERT INTO social_publish_requests (seller_id,idempotency_key,payload_json,post_ids_json,created_at) VALUES (?,?,?,?,?)").run(seller.id, key, payload, JSON.stringify(ids), now());
    return ids;
  })();
  return { posts: inserted.map((id) => publicPost(db.prepare("SELECT * FROM social_posts WHERE id=?").get(id))) };
}
export function cancelPost(seller, id) {
  db.transaction(() => {
    const post = db.prepare("SELECT * FROM social_posts WHERE id=? AND seller_id=?").get(String(id), seller.id);
    if (!post) throw httpError(404, "That marketing post was not found.");
    const changed = db.prepare(`UPDATE social_posts SET status='canceled', error=NULL, retryable=0 WHERE id=? AND status='queued'
      AND EXISTS (SELECT 1 FROM social_publish_jobs WHERE post_id=? AND status='queued' AND lease_owner IS NULL)`).run(post.id, post.id);
    if (changed.changes !== 1) throw httpError(409, "Only a queued post can be canceled before processing.");
    db.prepare("UPDATE social_publish_jobs SET status='canceled', updated_at=? WHERE post_id=? AND status='queued'").run(now(), post.id);
  })();
  return posts(seller);
}
export function retryPost(seller, id) {
  const post = db.prepare("SELECT * FROM social_posts WHERE id=? AND seller_id=?").get(String(id), seller.id);
  if (!post) throw httpError(404, "That marketing post was not found.");
  if (post.status === "uncertain") throw httpError(409, "This post may already be public. Check Meta before creating a new post.");
  if (post.status !== "failed" || !post.retryable) throw httpError(409, "This post cannot be retried safely.");
  const job = db.prepare("SELECT safe_retries FROM social_publish_jobs WHERE post_id=?").get(post.id);
  if (!job || job.safe_retries >= 5) throw httpError(409, "This post reached its safe retry limit. Review Meta and create a new post if needed.");
  db.transaction(() => {
    db.prepare("UPDATE social_posts SET status='queued', error=NULL, retryable=0, publish_at=? WHERE id=?").run(now(), post.id);
    db.prepare("UPDATE social_publish_jobs SET status='queued', run_at=?, lease_owner=NULL, lease_until=NULL, safe_retries=safe_retries+1, updated_at=? WHERE post_id=?").run(now(), now(), post.id);
  })();
  return posts(seller);
}

const LEASE_MS = 2 * 60_000;
const SAFE_RETRY_LIMIT = 5;
class LeaseLost extends Error { constructor() { super("Social publish lease is no longer owned"); } }
function updateOwnedJob(job, workerId, patch) {
  const fields = Object.keys(patch);
  if (!fields.length) return false;
  const result = db.prepare(`UPDATE social_publish_jobs SET ${fields.map((field) => `${field}=?`).join(", ")}, updated_at=? WHERE id=? AND status='processing' AND lease_owner=?`)
    .run(...fields.map((field) => patch[field]), now(), job.id, workerId);
  return result.changes === 1;
}
function heartbeat(job, workerId) {
  // The conditional update is the final check immediately before every Graph call. It ensures a
  // disconnected/deleted/taken-over job cannot use an old worker's credentials.
  const result = db.prepare(`UPDATE social_publish_jobs SET lease_until=?, updated_at=?
    WHERE id=? AND status='processing' AND lease_owner=? AND lease_until>? AND EXISTS (
      SELECT 1 FROM social_posts p JOIN social_connections c ON c.id=p.connection_id
      WHERE p.id=social_publish_jobs.post_id AND p.status='processing' AND c.status='connected'
    )`).run(isoAfter(LEASE_MS), now(), job.id, workerId, now());
  return result.changes === 1;
}
function requireLease(job, workerId) { if (!heartbeat(job, workerId)) throw new LeaseLost(); }
async function graphWithLease(job, workerId, method, endpoint, options) {
  requireLease(job, workerId);
  const response = await graph(method, endpoint, options);
  requireLease(job, workerId);
  return response;
}
async function requestWithLease(job, workerId, options) {
  requireLease(job, workerId);
  const response = await request(options);
  requireLease(job, workerId);
  return response;
}
function complete(job, post, workerId, { permalink = null, remotePostId = null, warning = null } = {}) {
  return db.transaction(() => {
    const claimed = db.prepare("SELECT 1 FROM social_publish_jobs WHERE id=? AND status='processing' AND lease_owner=?").get(job.id, workerId);
    if (!claimed) return false;
    db.prepare("UPDATE social_posts SET status='published', permalink=?, remote_post_id=?, error=?, retryable=0 WHERE id=? AND status='processing'").run(permalink, remotePostId, warning, post.id);
    db.prepare("UPDATE social_publish_jobs SET status='published', lease_owner=NULL, lease_until=NULL, stage='done', updated_at=? WHERE id=? AND lease_owner=?").run(now(), job.id, workerId);
    return true;
  })();
}
function fail(job, post, workerId, error, retryable = false) {
  const message = graphMessage(error);
  return db.transaction(() => {
    const claimed = db.prepare("SELECT 1 FROM social_publish_jobs WHERE id=? AND status='processing' AND lease_owner=?").get(job.id, workerId);
    if (!claimed) return false;
    db.prepare("UPDATE social_posts SET status='failed', error=?, retryable=? WHERE id=? AND status='processing'").run(message, retryable ? 1 : 0, post.id);
    db.prepare("UPDATE social_publish_jobs SET status='failed', lease_owner=NULL, lease_until=NULL, updated_at=? WHERE id=? AND lease_owner=?").run(now(), job.id, workerId);
    if (graphTokenExpired(error)) db.prepare("UPDATE social_connections SET status='reconnect_required', updated_at=? WHERE id=?").run(now(), post.connection_id);
    return true;
  })();
}
function uncertain(job, post, workerId) {
  return db.transaction(() => {
    const claimed = db.prepare("SELECT 1 FROM social_publish_jobs WHERE id=? AND status='processing' AND lease_owner=?").get(job.id, workerId);
    if (!claimed) return false;
    db.prepare("UPDATE social_posts SET status='uncertain', error=?, retryable=0 WHERE id=? AND status='processing'").run("Snapfront could not confirm whether Meta published this post. Check the destination before creating another post.", post.id);
    db.prepare("UPDATE social_publish_jobs SET status='uncertain', lease_owner=NULL, lease_until=NULL, updated_at=? WHERE id=? AND lease_owner=?").run(now(), job.id, workerId);
    return true;
  })();
}
function waiting(job, post, workerId, at, { stage, remoteIds, pollCount, safeRetries } = {}) {
  const patch = { status: "queued", run_at: at, lease_owner: null, lease_until: null };
  if (stage) patch.stage = stage;
  if (remoteIds !== undefined) patch.remote_ids_json = JSON.stringify(remoteIds);
  if (pollCount !== undefined) patch.poll_count = pollCount;
  if (safeRetries !== undefined) patch.safe_retries = safeRetries;
  return db.transaction(() => {
    const claimed = db.prepare("SELECT 1 FROM social_publish_jobs WHERE id=? AND status='processing' AND lease_owner=?").get(job.id, workerId);
    if (!claimed) return false;
    db.prepare("UPDATE social_posts SET status='queued', error=NULL, retryable=0 WHERE id=? AND status='processing'").run(post.id);
    const fields = Object.keys(patch);
    db.prepare(`UPDATE social_publish_jobs SET ${fields.map((field) => `${field}=?`).join(", ")}, updated_at=? WHERE id=? AND lease_owner=?`).run(...fields.map((field) => patch[field]), now(), job.id, workerId);
    return true;
  })();
}
function loadWork(jobId) {
  return db.prepare("SELECT j.*, p.*, j.id AS job_id, p.id AS post_id, j.status AS job_status, p.status AS post_status, c.access_token_enc, c.user_access_token_enc, c.remote_id AS account_remote_id, c.status AS connection_status, c.token_expires_at, c.data_access_expires_at, c.user_token_expires_at, c.user_data_access_expires_at FROM social_publish_jobs j JOIN social_posts p ON p.id=j.post_id JOIN social_connections c ON c.id=p.connection_id WHERE j.id=?").get(jobId);
}
function expirationInvalid(connection, requireUserToken = false) {
  const expired = (value) => value && Date.parse(value) <= Date.now();
  return Boolean(expired(connection.token_expires_at) || expired(connection.data_access_expires_at) || (requireUserToken && (expired(connection.user_token_expires_at) || expired(connection.user_data_access_expires_at))));
}
function isPublicBoundary(job) {
  const ids = asJson(job.remote_ids_json, {});
  return ids.publish_started === true || job.stage === "publish" || job.stage === "facebook_publish";
}
function rateLimited(error) { return error?.status === 429 || [4, 17, 32, 613].includes(Number(error?.body?.error?.code)); }
function definitiveGraph4xx(error) { return error instanceof GraphFailure && error.status >= 400 && error.status < 500 && !rateLimited(error); }
function backoffRate(job, post, workerId, ids) {
  if (job.safe_retries >= SAFE_RETRY_LIMIT) return fail(job, post, workerId, new GraphFailure(429, {}), true);
  return waiting(job, post, workerId, isoAfter(HOUR), { stage: job.stage || "start", remoteIds: ids, pollCount: job.poll_count, safeRetries: job.safe_retries + 1 });
}
function handleFailure(job, post, workerId, error, ids, publicBoundary = false) {
  if (error instanceof LeaseLost) return false;
  if (error instanceof GraphFailure && error.status >= 400 && error.status < 500) {
    // A definitive Graph rejection acknowledges no new public post. Retain safe upload handles,
    // but clear the uncertain boundary before any retry or rate-limit waiting.
    ids.publish_started = false;
    const stage = ids.container ? "poll" : ids.video_handle ? "facebook_video_ready" : ids.photos ? "facebook_photos" : "start";
    if (!updateOwnedJob(job, workerId, { remote_ids_json: JSON.stringify(ids), stage })) return false;
    job.stage = stage;
  }
  if (rateLimited(error)) return backoffRate(job, post, workerId, ids);
  if (definitiveGraph4xx(error)) return fail(job, post, workerId, error, false);
  // A timeout, 5xx, malformed response, or transport loss is uncertain only after the public
  // publish request was persisted. Container and upload work can be safely retried by the owner.
  if (publicBoundary && error?.ambiguous) return uncertain(job, post, workerId);
  return fail(job, post, workerId, error, true);
}
async function checkInstagramQuota(job, post, connection, userToken, workerId, ids) {
  const limit = await graphWithLease(job, workerId, "GET", `${connection.account_remote_id}/content_publishing_limit`, { token: userToken, form: { fields: "quota_usage,config" } });
  const row = Array.isArray(limit?.data) ? limit.data[0] : null;
  const usage = Number(row?.quota_usage);
  const total = Number(row?.config?.quota_total);
  // Do not guess an outdated fixed quota. Meta's returned config is authoritative and an
  // incomplete response is a known-safe pre-publication failure.
  if (!Number.isFinite(usage) || usage < 0 || !Number.isFinite(total) || total <= 0) throw new GraphFailure(502, {});
  if (usage >= total) { backoffRate(job, post, workerId, ids); return false; }
  return true;
}
async function lookupInstagramPermalink(post, connection, userToken, mediaId) {
  // Publishing is already committed. Lookup is best-effort and can never roll back public success.
  try {
    if (!db.prepare("SELECT 1 FROM social_connections WHERE id=? AND status='connected'").get(post.connection_id)) return;
    const media = await graph("GET", mediaId, { token: userToken, form: { fields: "permalink" } });
    if (media?.permalink) db.prepare("UPDATE social_posts SET permalink=? WHERE id=? AND connection_id=? AND status='published'").run(String(media.permalink), post.id, post.connection_id);
  } catch { /* An unavailable permalink endpoint does not change an acknowledged publication. */ }
}
async function instagram(job, post, connection, userToken, workerId) {
  const ids = asJson(job.remote_ids_json, {});
  const files = parseFiles(post.media_json);
  try {
    if (!ids.container) {
      if (!await checkInstagramQuota(job, post, connection, userToken, workerId, ids)) return;
      if (post.kind === "carousel") {
        const children = Array.isArray(ids.children) ? ids.children : [];
        for (let i = children.length; i < files.length; i++) {
          const response = await graphWithLease(job, workerId, "POST", `${connection.account_remote_id}/media`, { token: userToken, form: { image_url: files[i].url, is_carousel_item: "true" } });
          if (!response?.id) throw new GraphFailure(502, {});
          children.push(String(response.id)); ids.children = children;
          if (!updateOwnedJob(job, workerId, { remote_ids_json: JSON.stringify(ids), stage: "container" })) throw new LeaseLost();
        }
        const response = await graphWithLease(job, workerId, "POST", `${connection.account_remote_id}/media`, { token: userToken, form: { media_type: "CAROUSEL", children: children.join(","), caption: post.caption } });
        if (!response?.id) throw new GraphFailure(502, {}); ids.container = String(response.id);
      } else {
        const form = post.kind === "reel" ? { media_type: "REELS", video_url: files[0].url, caption: post.caption } : { image_url: files[0].url, caption: post.caption };
        const response = await graphWithLease(job, workerId, "POST", `${connection.account_remote_id}/media`, { token: userToken, form });
        if (!response?.id) throw new GraphFailure(502, {}); ids.container = String(response.id);
      }
      waiting(job, post, workerId, isoAfter(60_000), { stage: "poll", remoteIds: ids, pollCount: 0 }); return;
    }
    const status = await graphWithLease(job, workerId, "GET", `${ids.container}`, { token: userToken, form: { fields: "status_code" } });
    const code = String(status?.status_code || "").toUpperCase();
    if (code === "PUBLISHED") { complete(job, post, workerId); return; }
    if (code === "EXPIRED" || code === "ERROR") {
      if (job.safe_retries >= SAFE_RETRY_LIMIT) { fail(job, post, workerId, new GraphFailure(400, { error: { code: 100 } }), false); return; }
      waiting(job, post, workerId, isoAfter(60_000), { stage: "start", remoteIds: {}, pollCount: 0, safeRetries: job.safe_retries + 1 }); return;
    }
    if (code !== "FINISHED") {
      if (job.poll_count >= 4) { fail(job, post, workerId, new GraphFailure(400, { error: { code: 100 } }), true); return; }
      waiting(job, post, workerId, isoAfter(60_000), { stage: "poll", remoteIds: ids, pollCount: job.poll_count + 1 }); return;
    }
    // Recheck immediately before media_publish: another destination/app publication can consume
    // the quota while the container is processing.
    if (!await checkInstagramQuota(job, post, connection, userToken, workerId, ids)) return;
    ids.publish_started = true;
    if (!updateOwnedJob(job, workerId, { remote_ids_json: JSON.stringify(ids), stage: "publish" })) throw new LeaseLost();
    const published = await graphWithLease(job, workerId, "POST", `${connection.account_remote_id}/media_publish`, { token: userToken, form: { creation_id: ids.container } });
    if (!published?.id) throw new GraphFailure(502, {});
    const warning = published.config_issue ? "Meta published the media but reported a configuration issue; the caption may not be attached. Check and edit the post directly in Instagram. Snapfront will not republish it." : null;
    if (complete(job, post, workerId, { remotePostId: String(published.id), warning })) await lookupInstagramPermalink(post, connection, userToken, String(published.id));
  } catch (error) { handleFailure(job, post, workerId, error, ids, ids.publish_started === true); }
}
async function facebookVideo(job, post, connection, pageToken, userToken, ids, files, workerId) {
  const source = safeFilePath(files[0].file);
  if (!ids.upload_session) {
    const created = await graphWithLease(job, workerId, "POST", `${config.metaAppId}/uploads`, { token: userToken, form: { file_name: files[0].file, file_length: fs.statSync(source).size, file_type: "video/mp4" } });
    if (!created?.id) throw new GraphFailure(502, {});
    ids.upload_session = String(created.id);
    if (!updateOwnedJob(job, workerId, { remote_ids_json: JSON.stringify(ids), stage: "facebook_upload" })) throw new LeaseLost();
  }
  if (!ids.video_handle) {
    // Resumable uploads require the long-lived User token in this OAuth header; final Page video
    // publication below intentionally uses the independently stored Page token.
    const uploaded = await requestWithLease(job, workerId, { method: "POST", url: graphUrl(ids.upload_session), headers: { Authorization: `OAuth ${userToken}`, file_offset: "0" }, body: fs.readFileSync(source) });
    if (!uploaded?.h) throw new GraphFailure(502, {});
    ids.video_handle = String(uploaded.h);
    if (!updateOwnedJob(job, workerId, { remote_ids_json: JSON.stringify(ids), stage: "facebook_video_ready" })) throw new LeaseLost();
  }
  ids.publish_started = true;
  if (!updateOwnedJob(job, workerId, { remote_ids_json: JSON.stringify(ids), stage: "facebook_publish" })) throw new LeaseLost();
  const published = await graphWithLease(job, workerId, "POST", `${connection.account_remote_id}/videos`, { token: pageToken, host: "https://graph-video.facebook.com", form: { description: post.caption, fbuploader_video_file_chunk: ids.video_handle } });
  if (!published?.id) throw new GraphFailure(502, {});
  complete(job, post, workerId, { permalink: `https://www.facebook.com/${published.id}`, remotePostId: String(published.id) });
}
async function facebook(job, post, connection, pageToken, userToken, workerId) {
  const ids = asJson(job.remote_ids_json, {});
  const files = parseFiles(post.media_json);
  try {
    if (post.kind === "reel") { await facebookVideo(job, post, connection, pageToken, userToken, ids, files, workerId); return; }
    if (post.kind === "carousel") {
      const photoIds = Array.isArray(ids.photos) ? ids.photos : [];
      for (let i = photoIds.length; i < files.length; i++) {
        const uploaded = await graphWithLease(job, workerId, "POST", `${connection.account_remote_id}/photos`, { token: pageToken, form: { url: files[i].url, published: "false" } });
        if (!uploaded?.id) throw new GraphFailure(502, {});
        photoIds.push(String(uploaded.id)); ids.photos = photoIds;
        if (!updateOwnedJob(job, workerId, { remote_ids_json: JSON.stringify(ids), stage: "facebook_photos" })) throw new LeaseLost();
      }
      ids.publish_started = true;
      if (!updateOwnedJob(job, workerId, { remote_ids_json: JSON.stringify(ids), stage: "facebook_publish" })) throw new LeaseLost();
      const attached = Object.fromEntries(photoIds.map((id, index) => [`attached_media[${index}]`, JSON.stringify({ media_fbid: id })]));
      const published = await graphWithLease(job, workerId, "POST", `${connection.account_remote_id}/feed`, { token: pageToken, form: { message: post.caption, ...attached } });
      if (!published?.id) throw new GraphFailure(502, {});
      complete(job, post, workerId, { permalink: `https://www.facebook.com/${published.id}`, remotePostId: String(published.id) });
      return;
    }
    ids.publish_started = true;
    if (!updateOwnedJob(job, workerId, { remote_ids_json: JSON.stringify(ids), stage: "facebook_publish" })) throw new LeaseLost();
    const published = await graphWithLease(job, workerId, "POST", `${connection.account_remote_id}/photos`, { token: pageToken, form: { url: files[0].url, caption: post.caption } });
    const publishedId = published?.post_id || published?.id;
    if (!publishedId) throw new GraphFailure(502, {});
    complete(job, post, workerId, { permalink: published.post_id ? `https://www.facebook.com/${published.post_id}` : null, remotePostId: String(publishedId) });
  } catch (error) { handleFailure(job, post, workerId, error, ids, ids.publish_started === true); }
}
async function processClaim(jobId, workerId) {
  const work = loadWork(jobId);
  if (!work || work.job_status !== "processing" || work.lease_owner !== workerId) return;
  const job = { ...work, id: work.job_id, status: work.job_status };
  const post = { ...work, id: work.post_id, status: work.post_status };
  const connection = work;
  const needsUserToken = post.platform === "instagram" || post.kind === "reel";
  if (connection.connection_status !== "connected" || expirationInvalid(connection, needsUserToken)) {
    fail(job, post, workerId, new GraphFailure(400, { error: { code: 190 } }), false); return;
  }
  let pageToken;
  let userToken = null;
  try {
    pageToken = decrypt(connection.access_token_enc);
    if (needsUserToken) userToken = decrypt(connection.user_access_token_enc);
  } catch { fail(job, post, workerId, new GraphFailure(400, { error: { code: 190 } }), false); return; }
  if (post.platform === "instagram") await instagram(job, post, connection, userToken, workerId);
  else await facebook(job, post, connection, pageToken, userToken, workerId);
}
function recoverExpiredClaims() {
  const jobs = db.prepare("SELECT j.*, p.id AS post_id FROM social_publish_jobs j JOIN social_posts p ON p.id=j.post_id WHERE j.status='processing' AND j.lease_until < ?").all(now());
  if (!jobs.length) return;
  db.transaction(() => {
    for (const job of jobs) {
      if (isPublicBoundary(job)) {
        db.prepare("UPDATE social_posts SET status='uncertain', error=?, retryable=0 WHERE id=? AND status='processing'").run("Snapfront stopped while confirming Meta's result. Check the destination before creating another post.", job.post_id);
        db.prepare("UPDATE social_publish_jobs SET status='uncertain', lease_owner=NULL, lease_until=NULL, updated_at=? WHERE id=? AND status='processing'").run(now(), job.id);
      } else {
        // Upload/container/poll steps have no public side effect. Preserve their remote handles
        // and resume rather than turning every harmless lease expiry into an uncertain post.
        db.prepare("UPDATE social_posts SET status='queued', error=NULL, retryable=0 WHERE id=? AND status='processing'").run(job.post_id);
        db.prepare("UPDATE social_publish_jobs SET status='queued', run_at=?, lease_owner=NULL, lease_until=NULL, updated_at=? WHERE id=? AND status='processing'").run(now(), now(), job.id);
      }
    }
  })();
}
export async function processDue(limit = 4) {
  if (!publishingReady()) return 0;
  recoverExpiredClaims();
  const workerId = crypto.randomBytes(12).toString("hex");
  let count = 0;
  for (let i = 0; i < Math.max(1, Math.min(limit, 20)); i++) {
    const job = db.prepare(`UPDATE social_publish_jobs SET status='processing', lease_owner=?, lease_until=?, attempts=attempts+1, updated_at=?
      WHERE id = (SELECT j.id FROM social_publish_jobs j JOIN social_posts p ON p.id=j.post_id
        WHERE j.status='queued' AND p.status='queued' AND j.run_at <= ? AND (j.lease_until IS NULL OR j.lease_until < ?) ORDER BY j.run_at ASC LIMIT 1)
      AND status='queued' RETURNING id, post_id`).get(workerId, isoAfter(LEASE_MS), now(), now(), now());
    if (!job) break;
    db.prepare("UPDATE social_posts SET status='processing', error=NULL, retryable=0 WHERE id=? AND status='queued'").run(job.post_id);
    try { await processClaim(job.id, workerId); }
    catch (error) {
      if (!(error instanceof LeaseLost)) {
        const work = loadWork(job.id);
        if (work && work.lease_owner === workerId) {
          const activeJob = { ...work, id: work.job_id, status: work.job_status };
          const activePost = { ...work, id: work.post_id, status: work.post_status };
          if (isPublicBoundary(activeJob)) uncertain(activeJob, activePost, workerId);
          else fail(activeJob, activePost, workerId, new GraphFailure(500, {}), true);
        }
      }
    }
    count++;
  }
  return count;
}
let workerTimer = null;
let workerBusy = false;
export function startWorker() {
  if (!publishingReady() || workerTimer) return false;
  const tick = async () => { if (workerBusy) return; workerBusy = true; try { await processDue(); } catch { /* persisted jobs retain recovery state */ } finally { workerBusy = false; } };
  setTimeout(tick, 1_000).unref();
  workerTimer = setInterval(tick, 30_000); workerTimer.unref();
  return true;
}
export function stopWorkerForTests() { if (workerTimer) clearInterval(workerTimer); workerTimer = null; }

function signedPayload(signedRequest) {
  const [encodedSig, payload] = String(signedRequest || "").split(".");
  if (!encodedSig || !payload || !config.metaAppSecret) return null;
  try {
    const provided = Buffer.from(encodedSig, "base64url");
    const expected = crypto.createHmac("sha256", config.metaAppSecret).update(payload).digest();
    if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (data?.algorithm !== "HMAC-SHA256" || !data?.user_id) return null;
    return data;
  } catch { return null; }
}
function deleteMetaUser(metaUserId) {
  db.transaction(() => {
    const destinations = db.prepare("SELECT id,seller_id FROM social_connections WHERE meta_user_id=?").all(String(metaUserId));
    const sellers = [...new Set(destinations.map((row) => row.seller_id))];
    // Remove any request snapshot containing this person's destination metadata or caption,
    // including a multi-destination request. Other people's actual post rows remain untouched.
    for (const row of destinations) {
      const requests = db.prepare("SELECT idempotency_key,payload_json FROM social_publish_requests WHERE seller_id=?").all(row.seller_id);
      for (const request of requests) {
        const payload = asJson(request.payload_json, {});
        if (Array.isArray(payload.account_ids) && payload.account_ids.includes(row.id)) db.prepare("DELETE FROM social_publish_requests WHERE seller_id=? AND idempotency_key=?").run(row.seller_id, request.idempotency_key);
      }
    }
    db.prepare("DELETE FROM social_connections WHERE meta_user_id=?").run(String(metaUserId));
    for (const seller of sellers) db.prepare("DELETE FROM social_oauth_states WHERE seller_id=?").run(seller);
  })();
}
export function deauthorize(signedRequest) {
  const payload = signedPayload(signedRequest);
  if (!payload) throw httpError(400, "Invalid Meta callback signature.");
  deleteMetaUser(payload.user_id);
}
export function dataDeletion(signedRequest) {
  const payload = signedPayload(signedRequest);
  if (!payload) throw httpError(400, "Invalid Meta callback signature.");
  deleteMetaUser(payload.user_id);
  const id = newId("delete");
  db.prepare("INSERT INTO social_deletion_requests (id,created_at,completed_at) VALUES (?,?,?)").run(id, now(), now());
  return { url: `${config.publicUrl}/social/meta/data-deletion/${id}`, confirmation_code: id };
}
export function deletionStatus(id) {
  return db.prepare("SELECT id, completed_at FROM social_deletion_requests WHERE id=?").get(String(id));
}

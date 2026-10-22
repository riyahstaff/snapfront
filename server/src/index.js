import express from "express";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { config, dirs } from "./config.js";
import { ownsSellerImage as sellerOwnsImage, sellerImageIsInUse, sellerImageIsStored } from "./media-ownership.js";
import { designPhotoFiles } from "./storefront-media.js";
import { db, newId, hashToken, slugify, uniqueSlug, rowToProduct } from "./db.js";
import { productFromPhoto, httpError, PRODUCT_TYPES, sniffImage } from "./claude.js";
import { writeFileSafe } from "./artwork.js";
import * as store from "./store.js";
import * as storeOffers from "./store-offers.js";
import * as memberships from "./store-subscriptions.js";
import { miraProposal } from "./mira.js";
import * as agent from "./agent.js";
import * as pay from "./payments.js";
import * as commerce from "./commerce.js";
import * as plans from "./plans.js";
import * as research from "./research.js";
import * as auth2 from "./auth.js";
import * as suppliers from "./suppliers.js";
import * as dropship from "./dropship.js";
import * as urls from "./urls.js";
import * as domains from "./domains.js";
import { landingPage } from "./landing.js";
import { salesPage } from "./sales-page.js";
import { THEME_IDS, publicThemes } from "./themes.js";
import * as connector from "./connector.js";
import * as sitePages from "./site-pages.js";
import * as promptLibrary from "./prompt-library.js";
import * as helpPage from "./help-page.js";
import * as vierra from "./vierra.js";
import { withVierra } from "./vierra-widget.js";
import * as studio from "./studio.js";
import { ensureModel as ensureCutoutModel } from "./cutout.js";
import * as supplierDirectory from "./supplier-directory.js";
import * as marketing from "./marketing.js";
import * as aimedia from "./aimedia.js";
import * as growth from "./growth.js";
import * as playbilling from "./playbilling.js";
import * as webbilling from "./webbilling.js";
import * as business from "./business.js";
import * as audience from "./audience.js";
import * as affiliates from "./affiliates.js";
import * as pixels from "./pixels.js";
import * as autodm from "./autodm.js";
import * as partners from "./partners.js";
import * as academy from "./academy.js";
import * as academyPresenter from "./academy-presenter.js";
import * as daily from "./daily.js";
import * as community from "./community.js";
import * as feed from "./community-feed.js";
import * as startPlan from "./start-plan.js";
import { promoFiles } from "./promo-video.js";
import * as ugc from "./ugc.js";
import * as faceless from "./faceless.js";
import * as avatars from "./avatars.js";
import * as credits from "./credits.js";
import * as avatarVideos from "./avatar-videos.js";
import * as social from "./social.js";
import * as digitalDesigns from "./digital-designs.js";
import * as digitalIdeas from "./digital-ideas.js";
import * as imageAssistant from "./image-assistant.js";
import * as backup from "./backup.js";
import * as youtube from "./youtube.js";
import { suggestStorefrontCopy } from "./storefront-copy.js";
import { storePage, productPage, cartPage, orderPage, notePage, taxSetupPage, linksPage, reviewPage, affiliateJoinPage, affiliatePortalPage, ugcPage, esc } from "./render.js";
import { themeGalleryPage, themeDemoPage, themeDemoProduct, themeDemoCart } from "./theme-gallery.js";
import { materializeTemplatePreview } from "./template-preview.js";

export const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

/* ---------- backup copy on a second host (docs/backup-host.md) ---------- */
// A copy (STANDBY=true) shows only a notice, so nothing is sent, posted or charged twice.
app.use((req, res, next) => {
  if (!config.standby) return next();
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  if (req.path === "/health") return next();
  if (req.path === "/standby") return res.set("Cache-Control", "no-store").json(backup.standbyStatus());
  res.status(503).set({ "Retry-After": "3600", "Cache-Control": "no-store" }).type("html").send(backup.STANDBY_PAGE);
});
backup.mountBackupRoutes(app, db);

/* ---------- store addresses: <slug>.snapfront.app serves that store's pages at its root ---------- */
const SHARED_PATHS = /^\/(api|img|media|d|thanks|membership|stripe|suppliers|social|health|privacy|terms|builds|themes|theme-assets|theme-demo|storefront-preview|digital-design-assets|digital-design-exports)(\/|$)/;
const sameSecret = (a, b) => { const x = Buffer.from(String(a || "")), y = Buffer.from(String(b || "")); return x.length === y.length && crypto.timingSafeEqual(x, y); };
/* ---------- the web version of the app: app.snapfront.app (built from mobile/ with `npm run build:web`) ---------- */
export const WEBAPP_DIR = path.resolve(new URL("../webapp/", import.meta.url).pathname);
const webappIndex = () => path.join(WEBAPP_DIR, "index.html");
const isWebAppHost = (req) => Boolean(config.storeDomain) && String(req.hostname || "").toLowerCase() === `app.${config.storeDomain}`;
const webappStatic = express.static(WEBAPP_DIR, {
  index: false, fallthrough: true,
  setHeaders: (res, file) => res.setHeader("Cache-Control", /[\\/]_expo[\\/]static[\\/]|[\\/]assets[\\/]/.test(file) ? "public, max-age=31536000, immutable" : "no-cache"),
});
function serveWebApp(req, res, next) {
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  webappStatic(req, res, () => {
    if (!fs.existsSync(webappIndex())) return res.status(503).send("The Snapfront web app is being updated. Try again in a minute.");
    res.setHeader("Cache-Control", "no-cache");
    res.type("html").send(withVierra(webappIndex()));
  });
}
// The web app (app.snapfront.app) calls the API, photos and files on snapfront.app.
app.use((req, res, next) => {
  const origin = req.get("origin");
  if (!config.storeDomain || origin !== `https://app.${config.storeDomain}`) return next();
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Store");
    res.setHeader("Access-Control-Max-Age", "86400");
    return res.status(204).end();
  }
  next();
});
app.use((req, res, next) => {
  if (!isWebAppHost(req)) return next();
  // The API, photos and files are shared with the phone app; everything else is the web app.
  if (/^\/(api|img|media|d|health|builds|digital-design-assets|digital-design-exports|storefront-preview|theme-assets|site)(\/|$)/.test(req.path)) return next();
  serveWebApp(req, res, next);
});
// Without a store domain (local runs), the web app lives at /app.
app.use("/app", (req, res, next) => (config.storeDomain ? next() : serveWebApp(req, res, next)));

app.use((req, res, next) => {
  if (!config.storeDomain || isWebAppHost(req)) return next();
  // A seller's own domain, forwarded by our Cloudflare Worker (see domains.js).
  const edgeHost = req.get("x-snapfront-host");
  if (edgeHost && sameSecret(req.get("x-snapfront-edge"), domains.edgeSecret())) {
    const s = urls.sellerForDomain(edgeHost);
    if (!s) return res.status(404).send("This domain isn't connected to a Snapfront store.");
    if (s.custom_domain_status !== "active") db.prepare("UPDATE sellers SET custom_domain_status = 'active' WHERE id = ?").run(s.id);
    req.storeHost = s.store_slug;
    req.customHost = s.custom_domain;
    if (SHARED_PATHS.test(req.path)) return next();
    if (req.path.startsWith("/s/")) return req.method === "GET" ? res.redirect(301, req.originalUrl.replace(/^\/s\/[^/?]+/, "") || "/") : next();
    req.url = `/s/${s.store_slug}${req.url === "/" ? "" : req.url}`;
    return next();
  }
  const host = String(req.hostname || "").toLowerCase();
  if (host === `www.${config.storeDomain}`) return res.redirect(301, `https://${config.storeDomain}${req.originalUrl}`);
  const sub = urls.hostStoreSlug(host);
  if (!sub) return next();
  req.storeHost = sub;
  if (SHARED_PATHS.test(req.path)) return next();
  if (req.path.startsWith("/s/")) {   // an old-style link opened on a store address
    return req.method === "GET" ? res.redirect(301, req.originalUrl.replace(/^\/s\/[^/?]+/, "") || "/") : next();
  }
  req.url = `/s/${sub}${req.url === "/" ? "" : req.url}`;
  next();
});

/* ---------- Stripe webhook needs the raw body, so it is mounted before the JSON parser ---------- */
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  let event;
  try { event = pay.verifyWebhook(req.body, req.get("stripe-signature")); }
  catch (e) { console.error("[webhook] rejected:", e.message); return res.status(400).send(`Webhook error: ${e.message}`); }
  try {
    const obj = event.data.object;
    await memberships.handleEvent(event);
    // Only the checkout session we opened for an order can change it: a session with a copied
    // order id in its metadata (from any other Stripe account) is ignored.
    let orderId = obj.object === "checkout.session" ? obj.metadata?.snapfront_order : null;
    if (orderId) {
      const o = db.prepare("SELECT o.checkout_session_id,s.stripe_account_id FROM orders o JOIN sellers s ON s.id=o.seller_id WHERE o.id = ?").get(String(orderId));
      if (!o || o.checkout_session_id !== obj.id || (event.account && event.account !== o.stripe_account_id)) { console.warn("[webhook] session doesn't match order", orderId, obj.id); orderId = null; }
    }
    if (orderId && (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded")) {
      await completeOrder(orderId, obj);
    }
    if (orderId && (event.type === "checkout.session.async_payment_failed" || event.type === "checkout.session.expired")) {
      db.prepare("UPDATE orders SET status='canceled' WHERE id=? AND status='pending'").run(orderId);
      if (event.type === "checkout.session.expired") await growth.sendRecovery(orderId, obj).catch((e) => console.warn("[recovery]", e.message));
    }
    if (event.type === "account.updated") {
      const a = event.data.object;
      db.prepare("UPDATE sellers SET stripe_ready = ? WHERE stripe_account_id = ?").run(a.charges_enabled ? 1 : 0, a.id);
    }
  } catch (e) { console.error("[webhook]", e); return res.status(500).json({ error: "Webhook processing failed; retry." }); }
  res.json({ received: true });
});

/* ---------- Instagram AutoDM: Meta's webhook (signed with the app secret, so it needs the raw body) ---------- */
app.get("/api/meta/webhook", (req, res) => {
  const challenge = autodm.verifyChallenge({ "hub.mode": req.query["hub.mode"] ?? req.query.hub?.mode, "hub.verify_token": req.query["hub.verify_token"] ?? req.query.hub?.verify_token, "hub.challenge": req.query["hub.challenge"] ?? req.query.hub?.challenge });
  if (challenge == null) return res.status(403).end();
  res.type("text/plain").send(challenge);
});
app.post("/api/meta/webhook", express.raw({ type: "*/*", limit: "1mb" }), (req, res) => {
  if (!autodm.signatureValid(req.body, req.get("x-hub-signature-256"))) return res.status(401).end();
  let payload;
  try { payload = JSON.parse(Buffer.from(req.body).toString("utf8")); } catch { return res.status(400).end(); }
  res.status(200).send("EVENT_RECEIVED");   // answer Meta at once; replies go out after
  autodm.handle(payload).catch((e) => console.error("[autodm]", e.message));
});

app.use(express.json({ limit: "12mb" }));

/* ---------- the Claude/ChatGPT connector (MCP at /mcp, with its OAuth sign-in) and its guide pages ---------- */
connector.mountConnector(app, {
  createPreview: (seller, patch) => createStorefrontPreview(seller, patch),
  saveImage: (base64, mediaType, sellerId) => saveImage(base64, mediaType, sellerId),
  addCoverPhoto: (seller, file) => {
    if (db.prepare("SELECT COUNT(*) AS n FROM storefront_photos WHERE seller_id = ?").get(seller.id).n >= 100) throw httpError(429, "This store has reached its saved cover limit.");
    db.prepare("INSERT INTO storefront_photos (image_file, seller_id) VALUES (?,?)").run(file, seller.id);
  },
});
app.get("/connect-ai", (_req, res) => res.set("Cache-Control", "no-cache").send(sitePages.connectAiPage()));
app.get("/tools", (_req, res) => res.set("Cache-Control", "no-cache").send(sitePages.toolsPage()));
// The prompt library is a members' bonus inside the app; the old public address leads there.
app.get("/prompts", (_req, res) => res.redirect(302, `${sitePages.webAppUrl()}/prompts`));
app.get("/help", (req, res) => {
  const page = helpPage.helpPage((body) => sitePages.helpShell(body, { css: helpPage.HELP_CSS }));
  res.set("Cache-Control", "public, max-age=300");
  promptLibrary.sendCompressed(req, res, page);
});
app.get(["/faq", "/support"], (_req, res) => res.redirect(301, "/help"));
/* ---------- search engines: robots.txt and the sitemap of the public website pages ---------- */
app.get("/robots.txt", (_req, res) => res.type("text/plain").set("Cache-Control", "public, max-age=3600").send(
  `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /d/\nDisallow: /builds/\nDisallow: /mcp\nDisallow: /oauth/\nDisallow: /storefront-preview\n\nSitemap: ${config.publicUrl}/sitemap.xml\n`));
app.get("/sitemap.xml", (_req, res) => {
  const pages = [["/", "weekly", "1.0"], ["/join", "weekly", "0.9"], ["/themes", "weekly", "0.8"], ["/help", "weekly", "0.8"], ["/connect-ai", "monthly", "0.7"], ["/tools", "monthly", "0.6"], ["/privacy", "yearly", "0.2"], ["/terms", "yearly", "0.2"]];
  const day = new Date().toISOString().slice(0, 10);
  res.type("application/xml").set("Cache-Control", "public, max-age=3600").send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(([p, f, pr]) => `<url><loc>${config.publicUrl}${p}</loc><lastmod>${day}</lastmod><changefreq>${f}</changefreq><priority>${pr}</priority></url>`).join("\n")}\n</urlset>\n`);
});
// The library for the app's "Bonus: 1k Prompts" screen (signed-in app users only).
app.get("/api/prompts", auth, (req, res) => {
  const page = promptLibrary.promptsJson();
  res.set("Cache-Control", "private, max-age=300");
  promptLibrary.sendCompressed(req, res, page, "application/json; charset=utf-8");
});

/* ---------- helpers ---------- */
/** Mark an order paid (once) and send the confirmation email. Safe to call from both the webhook and /thanks. */
/**
 * Safety net for missed webhooks (an outage, a wrong signing secret): finish orders that Stripe says
 * are paid but are still pending here, cancel expired ones, and mark sellers whose Stripe account can
 * now take payments. Runs every 15 minutes and once at start-up.
 */
export async function reconcileStripe() {
  if (!config.stripeKey) return { orders: 0, sellers: 0 };
  let orders = 0, sellers = 0;
  const pending = db.prepare(`SELECT o.id, o.checkout_session_id, s.stripe_account_id FROM orders o JOIN sellers s ON s.id = o.seller_id
    WHERE o.status = 'pending' AND o.checkout_session_id IS NOT NULL AND s.stripe_account_id IS NOT NULL AND o.created_at > datetime('now', '-4 days')
    ORDER BY o.created_at DESC LIMIT 100`).all();
  for (const o of pending) {
    try {
      const session = await pay.getSession(o.stripe_account_id, o.checkout_session_id);
      if (session?.payment_status === "paid") { await completeOrder(o.id, session); orders++; console.log("[reconcile] completed paid order", o.id); }
      else if (session?.status === "expired") db.prepare("UPDATE orders SET status='canceled' WHERE id=? AND status='pending'").run(o.id);
    } catch (e) { console.warn("[reconcile] order", o.id, e.message); }
  }
  for (const s of db.prepare("SELECT id, stripe_account_id FROM sellers WHERE stripe_account_id IS NOT NULL AND stripe_ready = 0 LIMIT 100").all()) {
    try {
      const a = await pay.getAccount(s.stripe_account_id);
      if (a?.charges_enabled) { db.prepare("UPDATE sellers SET stripe_ready = 1 WHERE id = ?").run(s.id); sellers++; console.log("[reconcile] seller can take payments", s.id); }
    } catch (e) { console.warn("[reconcile] seller", s.id, e.message); }
  }
  await memberships.reconcile();
  return { orders, sellers };
}
async function completeOrder(orderId, session) {
  const before = db.prepare("SELECT status FROM orders WHERE id = ?").get(orderId);
  const pendingOrder = db.prepare("SELECT * FROM orders WHERE id=?").get(orderId);
  if (pendingOrder) await memberships.registerCheckout(pendingOrder, session);
  const order = commerce.finalizeOrder(orderId, session);
  if (order && ["paid", "fulfilled"].includes(order.status)) {
    business.snapshotCost(order.id);
    affiliates.credit(order);
    setTimeout(() => business.syncDue(order.seller_id, 5).catch(() => {}), 30_000).unref?.();   // Stripe's fee settles a moment later
  }
  if (order && before?.status === "pending" && order.status === "paid") {
    const seller = db.prepare("SELECT * FROM sellers WHERE id = ?").get(order.seller_id);
    await pay.emailOrder(order.email, {
      storeName: seller.store_name, orderUrl: `${urls.storeOrigin(seller.store_slug)}/thanks?o=${order.id}`, downloads: commerce.downloadsFor(order),
    }).catch(() => false);
    try { audience.fromCheckout(order, session); } catch (e) { console.warn("[email] checkout opt-in", e.message); }
    // Dropshipped items go to the supplier straight away.
    dropship.sendOrder(order.id).catch((e) => console.error("[supplier] send", order.id, e.message));
  }
  return order;
}

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function auth(req, _res, next) {
  const token = (req.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const account = plans.accountForToken(token);
  if (!account) return next(httpError(401, "Sign in again: this device isn't recognised."));
  const stores = plans.storesOf(account.id);
  // The app says which of the person's stores it is working on; default to their first store.
  const wanted = req.get("x-store");
  const seller = wanted !== undefined ? stores.find((s) => s.id === wanted) : stores[0];
  if (wanted !== undefined && !seller) return next(httpError(404, "That store is no longer available in this account. Select your store again."));
  if (!seller) return next(httpError(404, "This account has no store yet."));
  req.account = account;
  req.seller = seller;
  next();
}

const hits = new Map(); // naive per-seller rate limit for AI calls
function aiLimit(req, _res, next) {
  const now = Date.now(), win = 60 * 60 * 1000, max = 40;
  const list = (hits.get(req.account.id) || []).filter((t) => now - t < win);
  if (list.length >= max) return next(httpError(429, "You've hit the hourly AI limit. Try again in a little while."));
  list.push(now); hits.set(req.account.id, list); next();
}

const IMAGE_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
function saveImage(base64, mediaType, sellerId = null) {
  const buf = Buffer.from(String(base64 || ""), "base64");
  const ext = IMAGE_TYPES[sniffImage(buf) || mediaType];
  if (!ext) throw httpError(400, "Use a JPG, PNG, WebP or GIF photo.");
  if (buf.length < 100) throw httpError(400, "The photo didn't come through. Try again.");
  if (buf.length > 8 * 1024 * 1024) throw httpError(413, "That photo is over 8 MB. Choose a smaller one.");
  const file = writeFileSafe(dirs.images, `${crypto.randomUUID()}.${ext}`, buf);
  if (sellerId) db.prepare("INSERT OR IGNORE INTO seller_media (image_file,seller_id) VALUES (?,?)").run(file, sellerId);
  return file;
}
function assertSellerImage(seller, imageFile) {
  if (!/^[\w-]+\.(jpg|jpeg|png|webp|gif)$/.test(String(imageFile || ""))) throw httpError(400, "Invalid image reference.");
  if (!sellerOwnsImage(seller.id, imageFile) || !fs.existsSync(path.join(dirs.images, imageFile))) throw httpError(404, "That image does not belong to this store.");
  return imageFile;
}

const clampStr = store.clampStr, strList = store.strList, faqList = store.faqList;

/* ---------- account ---------- */
app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/", (req, res) => {
  if (typeof req.query.via === "string") partners.recordClick(req, res, req.query.via);
  res.send(landingPage());
});
// Snapfront Partners: short share links (snapfront.app/r/CODE) land on the home page with the code remembered.
app.get("/r/:code", (req, res) => {
  partners.recordClick(req, res, req.params.code);
  res.redirect(302, "/");
});
// The membership sales page (a link-in-bio style offer). /join/CODE is a partner's own copy: the
// visit is counted, the code is remembered for checkout, and the page discloses the commission.
app.get("/join", (_req, res) => res.send(salesPage()));
app.get("/join/:code", (req, res) => {
  const code = partners.recordClick(req, res, req.params.code);
  if (!code) return res.redirect(302, "/join");
  res.send(salesPage({ code }));
});
// The home page's images (brand mark and chrome art).
// Vierra's browser SDK (ElevenLabs @elevenlabs/client, pinned): big, so it's sent compressed and only
// loaded when someone opens Vierra. The file name carries the version, so it can be cached for good.
const VIERRA_SDK = path.resolve(new URL("../assets/vierra/elevenlabs-client.min.js", import.meta.url).pathname);
let vierraSdk = null;
app.get("/site/vierra/elevenlabs-client-:version.js", (req, res) => {
  if (!vierraSdk) {
    const js = fs.readFileSync(VIERRA_SDK);
    vierraSdk = { html: js, gzip: zlib.gzipSync(js, { level: 9 }), br: zlib.brotliCompressSync(js) };
  }
  res.set("Cache-Control", "public, max-age=31536000, immutable");
  promptLibrary.sendCompressed(req, res, vierraSdk, "application/javascript; charset=utf-8");
});
app.use("/site", express.static(path.resolve(new URL("../assets/site/", import.meta.url).pathname), { maxAge: "30d", fallthrough: false }));

/* ---------- fixed Meta callbacks: no client-controlled redirects or secret-bearing pages ---------- */
const metaReturn = (state) => `snapfront://marketing?social=${state === "connected" ? "connected" : "error"}`;
app.get("/social/meta/callback", wrap(async (req, res) => {
  // Website connections come back to a web page (a browser can't open the app's snapfront:// link).
  const web = social.stateClient(req.query.state) === "web";
  const back = (state) => (web ? `/social/meta/done?social=${state === "connected" ? "connected" : "error"}` : metaReturn(state));
  // Denial and malformed callbacks consume a valid state as well, preventing replay.
  if (req.query.error || !req.query.code) {
    social.cancelAuthorization(req.query.state);
    return res.redirect(303, back("error"));
  }
  try {
    const seller = await social.finishAuthorization(req.query.state, req.query.code);
    social.refreshPictures({ sellerId: seller.id }).catch(() => {});   // profile pictures for the Destinations list
    return res.redirect(303, back("connected"));
  } catch (e) {
    // Do not expose OAuth codes, Graph responses, tokens, or configuration details in the browser.
    console.warn("[meta] OAuth callback was not completed", e.status || 500);
    return res.redirect(303, back("error"));
  }
}));
// "Connect with Instagram": Instagram sends the person back here.
app.get("/social/instagram/callback", wrap(async (req, res) => {
  const web = social.stateClient(req.query.state) === "web";
  const back = (state) => (web ? `/social/meta/done?social=${state === "connected" ? "connected" : "error"}` : metaReturn(state));
  if (req.query.error || !req.query.code) {
    social.cancelAuthorization(req.query.state, "instagram");
    return res.redirect(303, back("error"));
  }
  try {
    const seller = await social.finishInstagramAuthorization(req.query.state, req.query.code);
    autodm.subscribeQuietly(seller).catch(() => {});   // comments and messages start reaching AutoDM
    social.refreshPictures({ sellerId: seller.id }).catch(() => {});
    return res.redirect(303, back("connected"));
  } catch (e) {
    console.warn("[instagram] OAuth callback was not completed", e.status || 500, e.status && e.status < 500 ? e.message : "");
    return res.redirect(303, back("error"));
  }
}));
// The website's Facebook or Instagram window lands here: it says how it went and closes itself.
app.get("/social/meta/done", (req, res) => {
  const ok = req.query.social === "connected";
  const back = config.storeDomain ? `https://app.${config.storeDomain}/marketing` : `${config.publicUrl}/app/marketing`;
  res.set("Cache-Control", "no-store").type("html").send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${ok ? "Connected" : "Not connected"} | Snapfront</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#090B0E;color:#F5F6F8;font:17px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:420px;padding:32px 24px;text-align:center}h1{font-size:28px;margin:0 0 10px}p{color:#ADB4BF;margin:0 0 24px}a{display:inline-block;padding:12px 22px;border-radius:999px;background:#E5E9F0;color:#11151B;font-weight:700;text-decoration:none}</style></head>
<body><main><h1>${ok ? "Connected" : "That didn’t connect"}</h1><p>${ok ? "Your account is now connected to Snapfront. This window will close." : "Nothing was changed. Close this window and try Connect again in Snapfront."}</p><a href="${back}">Back to Snapfront</a></main>
<script>setTimeout(function(){try{window.close()}catch(e){}},${ok ? 1200 : 4000})</script></body></html>`);
});
app.post("/social/meta/deauthorize", express.urlencoded({ extended: false, limit: "16kb" }), (req, res) => {
  social.deauthorize(req.body?.signed_request);
  res.status(200).json({});
});
app.post("/social/meta/data-deletion", express.urlencoded({ extended: false, limit: "16kb" }), (req, res) => {
  res.status(200).json(social.dataDeletion(req.body?.signed_request));
});
app.get("/social/meta/data-deletion/:id", (req, res) => {
  const record = social.deletionStatus(req.params.id);
  if (!record) return res.status(404).type("text/plain").send("Deletion request not found.");
  res.type("html").send(`<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>Data deletion status</title><p>Snapfront completed this Meta data deletion request on ${esc(record.completed_at)}.</p>`);
});

const signups = new Map();
function signupLimit(req, _res, next) {
  const now = Date.now(), list = (signups.get(req.ip) || []).filter((t) => now - t < 60 * 60e3);
  // Generous enough for a family or office on one Wi-Fi, or a phone carrier sharing addresses.
  if (list.length >= 20) return next(httpError(429, "Too many new stores from this network. Try again in an hour."));
  list.push(now); signups.set(req.ip, list);
  if (signups.size > 20000) signups.clear();
  next();
}
app.post("/api/sellers", signupLimit, (req, res) => {
  const { token, account, store: seller } = plans.createAccountWithStore(clampStr(req.body?.store_name || "My Snapfront Store", 80));
  res.status(201).json({ token, seller: store.publicSeller(seller), account: plans.publicAccount(account, seller.id) });
});

const me = (req) => ({ ...store.publicSeller(plans.storesOf(req.account.id).find((s) => s.id === req.seller.id)), account: plans.publicAccount(plans.getAccount(req.account.id), req.seller.id) });
const storefrontPreviews = new Map();
/** A private 30-minute preview of a store with a design patch applied; the live store is untouched. */
function createStorefrontPreview(seller, patch) {
  const now = Date.now();
  for (const [token, entry] of storefrontPreviews) if (entry.expires < now) storefrontPreviews.delete(token);
  if (storefrontPreviews.size >= 1000) throw httpError(429, "Previews are busy right now. Try again shortly.");
  // Keep at most five temporary snapshots per store, without touching live data.
  const own = [...storefrontPreviews.entries()].filter(([, entry]) => entry.sellerId === seller.id);
  for (const [token] of own.slice(0, Math.max(0, own.length - 4))) storefrontPreviews.delete(token);
  const token = crypto.randomBytes(24).toString("base64url");
  storefrontPreviews.set(token, { sellerId: seller.id, patch, expires: now + 30 * 60e3 });
  return `${config.publicUrl}/storefront-preview/${token}`;
}
app.post("/api/storefront/preview", auth, (req, res) => {
  const url = createStorefrontPreview(req.seller, store.storefrontPatch(req.seller, req.body || {}));
  res.set("Cache-Control", "no-store").json({ url, expires_in: 1800 });
});
app.get("/storefront-preview/:token", (req, res) => {
  res.set("Cache-Control", "no-store").set("Referrer-Policy", "no-referrer").set("X-Robots-Tag", "noindex, nofollow");
  const entry = storefrontPreviews.get(req.params.token);
  if (!entry || entry.expires < Date.now()) return res.status(410).send("This preview has expired. Open a new preview from Storefront setup.");
  const seller = db.prepare("SELECT * FROM sellers WHERE id = ?").get(entry.sellerId);
  if (!seller) return res.status(410).send("This store preview is no longer available.");
  const snapshot = { ...seller, ...entry.patch, _draftPreview: true, _theme: entry.patch.theme || seller.theme, _base: `/s/${seller.store_slug}` };
  res.send(storePage(snapshot, store.listProducts(seller).filter((p) => p.status === "live"), config.publicUrl));
});
app.post("/api/storefront/template-preview", auth, (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const mode = body.mode;
  if (mode !== "template" && mode !== "final") throw httpError(400, "mode must be template or final.");
  // storefrontPatch is an allow-list. Request-only/internal flags never reach the renderer.
  const patch = store.storefrontPatch(req.seller, body);
  const preview = materializeTemplatePreview({ seller: req.seller, patch, products: store.listProducts(req.seller), mode });
  res.set({ "Cache-Control": "no-store, max-age=0", Pragma: "no-cache", "X-Content-Type-Options": "nosniff" }).json(preview);
});
// Upload without applying. Each staged cover belongs to exactly one seller.
app.post("/api/storefront/photo", auth, (req, res) => {
  const count = db.prepare("SELECT COUNT(*) AS n FROM storefront_photos WHERE seller_id = ?").get(req.seller.id).n;
  if (count >= 100) throw httpError(429, "This store has reached its saved cover limit. Use an existing cover for now.");
  if (!sniffImage(req.body?.imageBase64)) throw httpError(400, "Use a JPG, PNG, WebP or GIF photo.");
  const file = saveImage(req.body?.imageBase64, req.body?.mediaType || "image/jpeg", req.seller.id);
  db.prepare("INSERT INTO storefront_photos (image_file, seller_id) VALUES (?,?)").run(file, req.seller.id);
  res.status(201).json({ image_file: file, image_url: `${config.publicUrl}/img/${file}` });
});
app.delete("/api/storefront/photo/:file", auth, (req, res) => {
  const file = req.params.file;
  if (!/^[\w-]+\.(jpg|png|webp|gif)$/.test(file)) throw httpError(400, "Invalid cover reference.");
  const row = db.prepare("SELECT 1 FROM storefront_photos WHERE seller_id = ? AND image_file = ?").get(req.seller.id, file);
  if (!row) throw httpError(404, "This staged cover does not belong to your store.");
  if (sellerImageIsInUse(req.seller.id, file) || digitalDesigns.imageReferencedByAnyDesign(req.seller.id, file)) {
    throw httpError(409, "This photo is still used by a product, storefront slot, or editable digital design.");
  }
  db.prepare("DELETE FROM storefront_photos WHERE seller_id = ? AND image_file = ?").run(req.seller.id, file);
  if (!sellerImageIsInUse(req.seller.id, file) && !digitalDesigns.imageReferencedByAnyDesign(req.seller.id, file)) fs.rmSync(path.join(dirs.images, file), { force: true });
  for (const [token, entry] of storefrontPreviews) if (entry.sellerId === req.seller.id && entry.patch.banner_file === file) storefrontPreviews.delete(token);
  res.status(204).end();
});
app.post("/api/storefront/copy", auth, aiLimit, wrap(async (req, res) => {
  const result = await plans.withAllowance(req.account, "photo", () => suggestStorefrontCopy(req.seller, store.listProducts(req.seller), req.body || {}));
  res.json(result);
}));
// Storefront cover photo: the big picture at the top of the store.
app.put("/api/me/banner", auth, (req, res) => {
  const file = saveImage(req.body?.imageBase64, req.body?.mediaType || "image/jpeg", req.seller.id);
  const old = req.seller.banner_file;
  db.prepare("UPDATE sellers SET banner_file = ? WHERE id = ?").run(file, req.seller.id);
  if (old && !sellerImageIsStored(req.seller.id, old) && !digitalDesigns.imageReferencedByAnyDesign(req.seller.id, old)) fs.rm(path.join(dirs.images, old), { force: true }, () => {});
  res.json(me(req));
});
app.delete("/api/me/banner", auth, (req, res) => {
  const old = req.seller.banner_file;
  db.prepare("UPDATE sellers SET banner_file = NULL WHERE id = ?").run(req.seller.id);
  if (old && !sellerImageIsStored(req.seller.id, old) && !digitalDesigns.imageReferencedByAnyDesign(req.seller.id, old)) fs.rm(path.join(dirs.images, old), { force: true }, () => {});
  res.json(me(req));
});
// Free directory of places to source products (everyone, no sign-in).
app.get("/api/sources", (_req, res) => res.json(supplierDirectory.directory()));
app.get("/api/themes", (req, res) => res.json({ themes: publicThemes() }));
app.get("/api/me", auth, (req, res) => res.json(me(req)));
// AI assistants connected through the Claude/ChatGPT connector, with a way to disconnect each.
app.get("/api/connected-apps", auth, (req, res) => res.json({ apps: connector.connectedApps(req.account.id), connector_url: sitePages.MCP_URL(), guide_url: `${config.publicUrl}/connect-ai` }));

/* ---------- Ask Vierra: the voice guide on the home and help pages ---------- */
// Only Snapfront's own pages may start a conversation (a browser sends Origin on these requests).
const vierraOrigins = () => new Set([config.publicUrl, ...(config.storeDomain ? [`https://${config.storeDomain}`, `https://www.${config.storeDomain}`, `https://app.${config.storeDomain}`] : [])].map((u) => u.replace(/\/$/, "")));
const vierraHits = new Map();
function vierraLimited(ip) {
  const now = Date.now(), list = (vierraHits.get(ip) || []).filter((t) => now - t < 24 * 3600e3);
  if (list.filter((t) => now - t < 3600e3).length >= 12 || list.length >= 40) return true;
  list.push(now); vierraHits.set(ip, list);
  if (vierraHits.size > 20000) vierraHits.clear();
  return false;
}
app.post("/api/vierra/session", wrap(async (req, res) => {
  res.set("Cache-Control", "no-store");
  const origin = String(req.get("origin") || "");
  if (!vierraOrigins().has(origin)) throw httpError(403, "Vierra only works on snapfront.app.");
  if (vierraLimited(req.ip)) throw httpError(429, "You've talked with Vierra a lot today. Take a break and try again later, or check the Help page.");
  const mode = req.body?.mode === "text" ? "text" : "voice";
  res.json(await vierra.session(mode));
}));
function ownerOnly(req, res, next) {
  auth(req, res, (err) => (err ? next(err) : credits.isOwner(req.account) ? next() : next(httpError(403, "Only Snapfront's owner can do that."))));
}
app.get("/api/admin/owner/vierra", ownerOnly, (_req, res) => res.json(vierra.status()));
app.get("/api/admin/owner/vierra/voices", ownerOnly, wrap(async (req, res) => res.json({ voices: await vierra.searchVoices(req.query || {}) })));
app.post("/api/admin/owner/vierra/voice", ownerOnly, wrap(async (req, res) => res.json(await vierra.chooseVoice(req.body || {}))));
app.post("/api/admin/owner/vierra/sync", ownerOnly, wrap(async (_req, res) => res.json({ agent_id: await vierra.syncAgent({ force: true }), ...vierra.status() })));
app.post("/api/admin/owner/vierra/ask", ownerOnly, wrap(async (req, res) => res.json(await vierra.ask(req.body?.text))));

app.delete("/api/connected-apps/:id", auth, (req, res) => { connector.disconnectApp(req.account.id, req.params.id); res.status(204).end(); });
app.patch("/api/me", auth, wrap(async (req, res) => { await store.updateStoreChecked(req.seller, req.body || {}); res.json(me(req)); }));

/** Things kept per store outside the cascading tables: visit counts and AI photos/clips. */
function purgeStores(sellerIds) {
  for (const id of sellerIds) {
    const seller = db.prepare("SELECT banner_file, design_photos FROM sellers WHERE id = ?").get(id);
    const covers = db.prepare("SELECT image_file FROM storefront_photos WHERE seller_id = ?").all(id).map((p) => p.image_file);
    const designExports = db.prepare("SELECT pdf_file, cover_file, attached_cover_file FROM digital_design_exports WHERE seller_id=?").all(id);
    covers.push(...designExports.map((row) => row.attached_cover_file).filter(Boolean));
    const privateFiles = designExports.flatMap((row) => [row.pdf_file, row.cover_file]).filter(Boolean);
    privateFiles.push(...db.prepare(`SELECT d.delivery_file FROM digital_order_downloads d
      JOIN orders o ON o.id=d.order_id WHERE o.seller_id=?`).all(id).map((row) => row.delivery_file).filter(Boolean));
    for (const file of new Set(privateFiles)) {
      if (/^[\w-]+\.(pdf|png)$/.test(file)) fs.rmSync(path.join(dirs.files, file), { force: true });
    }
    covers.push(...db.prepare("SELECT image_file FROM seller_media WHERE seller_id=?").all(id).map((row) => row.image_file));
    covers.push(...db.prepare("SELECT picture_file FROM social_connections WHERE seller_id=? AND picture_file IS NOT NULL").all(id).map((row) => row.picture_file));
    if (seller?.banner_file) covers.push(seller.banner_file);
    covers.push(...designPhotoFiles(seller?.design_photos).filter(Boolean));
    for (const file of new Set(covers)) {
      if (/^[\w-]+\.(jpg|png|webp|gif)$/.test(file)) fs.rm(path.join(dirs.images, file), { force: true }, () => {});
    }
    for (const j of db.prepare("SELECT result FROM media_jobs WHERE seller_id = ? AND result IS NOT NULL").all(id)) {
      try {
        const r = JSON.parse(j.result);
        if (r.file && /^[\w-]+\.\w+$/.test(r.file)) fs.rm(path.join(dirs.media, r.file), { force: true }, () => {});
        if (r.image_file && /^[\w-]+\.\w+$/.test(r.image_file)) fs.rm(path.join(dirs.images, r.image_file), { force: true }, () => {});
      } catch { /* unreadable result: nothing to remove */ }
    }
    // image_assistant_jobs records both an original source and a copied, durable result. They are
    // protected by media-ownership during ordinary product/staged-photo cleanup, but all become
    // orphaned when the entire store is deleted.
    for (const j of db.prepare("SELECT source_file, result_file FROM image_assistant_jobs WHERE seller_id=?").all(id)) {
      for (const file of [j.source_file, j.result_file]) {
        if (/^[\w-]+\.(jpg|jpeg|png|webp|gif)$/.test(String(file || ""))) fs.rm(path.join(dirs.images, file), { force: true }, () => {});
      }
    }
    const registered = db.prepare("SELECT files_json AS files FROM social_renders WHERE seller_id=? UNION ALL SELECT media_json AS files FROM social_posts WHERE seller_id=?").all(id, id);
    for (const row of registered) {
      let files; try { files = JSON.parse(row.files); } catch { continue; }
      for (const file of Array.isArray(files) ? files : []) {
        if (/^[\w-]+\.(jpg|mp4)$/.test(String(file?.file || ""))) fs.rmSync(path.join(dirs.media, file.file), { force: true });
      }
    }
    // Remove child posts first: the render foreign key is RESTRICT to protect active snapshots,
    // so a store/account cascade must not reach its render before its queued jobs are removed.
    db.prepare("DELETE FROM social_posts WHERE seller_id=?").run(id);
    db.prepare("DELETE FROM media_jobs WHERE seller_id = ?").run(id);
    db.prepare("DELETE FROM ai_images WHERE file IN (SELECT result_file FROM image_assistant_jobs WHERE seller_id=?)").run(id);
    db.prepare("DELETE FROM image_assistant_jobs WHERE seller_id = ?").run(id);
    db.prepare("DELETE FROM store_visits WHERE seller_id = ?").run(id);
  }
}
const removeFiles = (rows) => { for (const r of rows) for (const [dir, f] of [[dirs.images, r.image_file], [dirs.files, r.delivery_file]]) if (f) fs.rm(path.join(dir, f), { force: true }, () => {}); };
// App Store guideline 5.1.1(v): apps that create accounts must let people delete them in-app.
// This deletes the whole account: every store, product and photo.
function deleteAccount(accountId) {
  const rows = db.prepare("SELECT p.image_file, p.delivery_file FROM products p JOIN sellers s ON s.id = p.seller_id WHERE s.account_id = ?").all(accountId);
  const stores = plans.storesOf(accountId);
  for (const st of stores) if (st.custom_domain_id) domains.removeDomain(st).catch(() => {});
  webbilling.cancelAll(accountId).catch((e) => console.warn("[webbilling] cancel on delete", e.message));
  youtube.cancelAll(accountId).catch((e) => console.warn("[youtube] cancel on delete", e.message));
  purgeStores(stores.map((st) => st.id));
  db.prepare("DELETE FROM accounts WHERE id = ?").run(accountId);
  removeFiles(rows);
}
app.delete("/api/me", auth, (req, res) => { deleteAccount(req.account.id); res.status(204).end(); });

/* ---------- deleting an account from the web (the link Google Play shows on the store listing) ---------- */
const deletionPage = (body) => `<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>Delete your Snapfront account</title>
<style>body{font:16px/1.6 system-ui;max-width:640px;margin:0 auto;padding:32px 16px;color:#16152E}h1{font-size:28px;line-height:1.2}
label{display:block;font-weight:600;margin-top:16px}input{font:inherit;width:100%;box-sizing:border-box;padding:12px;border:1px solid #C9CBDA;border-radius:10px;margin-top:6px}
button{font:inherit;font-weight:600;margin-top:16px;padding:12px 18px;border:0;border-radius:10px;background:#B3261E;color:#fff;cursor:pointer}
.box{background:#F4F5FA;border-radius:12px;padding:16px 20px;margin:20px 0}.err{color:#B3261E;font-weight:600}.muted{color:#5D5F78}</style><body>${body}</body>`;
const deletionInfo = `<h1>Delete your Snapfront account</h1>
<p>Deleting your account removes it for good, along with every store on it. It can't be undone.</p>
<h2>In the app (fastest)</h2>
<ol><li>Open Snapfront and go to <strong>Settings</strong>.</li><li>Tap <strong>Delete my account</strong>, then confirm.</li></ol>
<h2>On this page</h2>
<p>If you signed in to Snapfront with an email address, enter it below. We'll email you a 6-digit code to confirm it's you.</p>`;
const retention = `<div class=box><strong>What's deleted:</strong> your account, your stores, products, product photos, digital product files, AI photos and videos, marketing posts, discount codes, reviews on your stores, visit statistics and saved supplier connections. Your store's web address stops working.<br><br>
<strong>What's kept:</strong> nothing on Snapfront's servers. Payments and payouts stay in your own Stripe account, which you manage at stripe.com, and plan purchases stay in your Google Play order history, as those companies require. Copies in server backups are overwritten within 90 days.</div>
<p class=muted>Didn't sign in with an email, or can't open the app? Email <a href="mailto:support@snapfront.app">support@snapfront.app</a> with your store's web address and we'll delete it within 7 days.</p>`;
const esc2 = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
app.get("/delete-account", (_req, res) => res.send(deletionPage(`${deletionInfo}
<form method=post action="/delete-account"><input type=hidden name=step value=start><label for=e>Email address</label><input id=e name=email type=email required autocomplete=email><button>Email me a code</button></form>${retention}`)));
app.get("/delete-data", (_req, res) => res.send(deletionPage(`<h1>Delete some of your Snapfront data</h1>
<p>You can delete parts of your data in the Snapfront app and keep your account. Each deletion is permanent.</p>
<h2>In the app</h2>
<ul>
<li><strong>A product</strong> (its text, photos and any download file): My store, tap the product, then <strong>Delete product</strong>.</li>
<li><strong>A whole store</strong> (its products, orders, reviews, visit statistics, and AI photos and videos): Settings, then <strong>Delete this store only</strong>. You need at least two stores; with one, delete your account instead.</li>
<li><strong>Your store's cover photo</strong>: My store, Store look, then <strong>Remove</strong>.</li>
<li><strong>A connected supplier</strong> (CJdropshipping, AliExpress or Printful, and the saved key or sign-in for it): Settings, Suppliers, then <strong>Disconnect</strong>.</li>
<li><strong>A custom domain</strong>: Settings, Your own domain, then <strong>Remove domain</strong>.</li>
</ul>
<h2>By email</h2>
<p>To have anything else deleted, such as your email address or a buyer's order details, email <a href="mailto:support@snapfront.app">support@snapfront.app</a> from the address on your account, or with your store's web address, and say what to delete. We do it within 7 days and reply when it's done.</p>
<div class=box><strong>What's kept:</strong> everything you don't delete stays in your account. Payments and payouts stay in your own Stripe account, and plan purchases stay in your Google Play order history, as those companies require. Copies in server backups are overwritten within 90 days.</div>
<p class=muted>To delete your whole account instead, see <a href="/delete-account">Delete your Snapfront account</a>.</p>`)));
app.post("/delete-account", buyerLimit, express.urlencoded({ extended: false, limit: "4kb" }), wrap(async (req, res) => {
  const email = String(req.body?.email || "").trim().slice(0, 200);
  const codeForm = (msg = "") => `<h1>Check your email</h1><p>If a Snapfront account uses <strong>${esc2(email)}</strong>, we've sent it a 6-digit code. It works for 10 minutes.</p>${msg}
<form method=post action="/delete-account"><input type=hidden name=step value=confirm><input type=hidden name=email value="${esc2(email)}"><label for=c>Code</label><input id=c name=code inputmode=numeric autocomplete=one-time-code required><button>Delete my account for good</button></form>${retention}`;
  try {
    if (req.body?.step === "confirm") {
      const accountId = auth2.confirmDeletion(email, req.body?.code);
      deleteAccount(accountId);
      return res.send(deletionPage(`<h1>Your account is deleted</h1><p>Your Snapfront account and all of its stores have been removed. You can uninstall the app.</p>${retention}`));
    }
    await auth2.startDeletion(email);
    res.send(deletionPage(codeForm()));
  } catch (e) {
    const msg = `<p class=err>${esc2(e.status ? e.message : "Something went wrong. Try again.")}</p>`;
    res.status(e.status || 500).send(deletionPage(req.body?.step === "confirm" ? codeForm(msg) : `${deletionInfo}${msg}
<form method=post action="/delete-account"><input type=hidden name=step value=start><label for=e>Email address</label><input id=e name=email type=email required value="${esc2(email)}"><button>Email me a code</button></form>${retention}`));
  }
}));

/* ---------- a store's own domain (Pro) ---------- */
app.get("/api/domain", auth, (req, res) => res.json(domains.view(req.seller)));
app.put("/api/domain", auth, wrap(async (req, res) => {
  if (plans.effectivePlan(req.account) !== "pro") throw httpError(402, "Using your own domain comes with Pro.", { upgrade: "pro" });
  res.json(await domains.addDomain(req.seller, req.body?.domain));
}));
app.post("/api/domain/refresh", auth, wrap(async (req, res) => res.json(await domains.refreshDomain(req.seller))));
app.delete("/api/domain", auth, wrap(async (req, res) => res.json(await domains.removeDomain(req.seller))));

/* ---------- stores (Pro runs up to 10) ---------- */
app.post("/api/stores", auth, (req, res) => {
  const s = plans.createStore(req.account, clampStr(req.body?.store_name, 80));
  res.status(201).json({ ...store.publicSeller(s), account: plans.publicAccount(plans.getAccount(req.account.id), s.id) });
});
app.delete("/api/stores/:id", auth, (req, res) => {
  const stores = plans.storesOf(req.account.id);
  const target = stores.find((s) => s.id === req.params.id);
  if (!target) throw httpError(404, "That store doesn't exist.");
  if (stores.length === 1) throw httpError(409, "This is your only store. To remove everything, delete your account in Settings.");
  const rows = db.prepare("SELECT image_file, delivery_file FROM products WHERE seller_id = ?").all(target.id);
  if (target.custom_domain_id) domains.removeDomain(target).catch(() => {});
  purgeStores([target.id]);
  db.prepare("DELETE FROM sellers WHERE id = ?").run(target.id);
  removeFiles(rows);
  res.status(204).end();
});

/* ---------- plans and purchases ---------- */
app.get("/api/plans", (_req, res) => res.json(plans.PLANS));

/* ---------- owner tools (ADMIN_TOKEN): give a store's account a free plan, e.g. for testers and app reviewers ---------- */
function adminOnly(req, _res, next) {
  const t = (req.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!config.adminToken || !sameSecret(t, config.adminToken)) return next(httpError(401, "Unauthorized"));
  next();
}
app.post("/api/admin/comp", adminOnly, (req, res) => {
  const { store_slug, email, plan } = req.body || {};
  if (!["launch", "pro", null, "none"].includes(plan ?? null)) throw httpError(400, "plan must be launch, pro or none");
  const acc = store_slug ? db.prepare("SELECT a.* FROM accounts a JOIN sellers s ON s.account_id = a.id WHERE s.store_slug = ?").get(String(store_slug))
    : email ? db.prepare("SELECT * FROM accounts WHERE email = ?").get(String(email).toLowerCase()) : null;
  if (!acc) throw httpError(404, "No account with that store address or email.");
  db.prepare("UPDATE accounts SET comp_plan = ? WHERE id = ?").run(plan === "none" ? null : plan, acc.id);
  const a = plans.getAccount(acc.id);
  res.json({ account: acc.id, plan: plans.effectivePlan(a), comp_plan: a.comp_plan, stores: plans.storesOf(acc.id).map((s) => s.store_slug) });
});
// Owner tools for Google Play: check the service account works, and create the two plans in Play.
app.get("/api/admin/play", adminOnly, wrap(async (_req, res) => {
  if (!playbilling.enabled()) return res.json({ enabled: false });
  const subs = await playbilling.play("GET", "/subscriptions");
  const launch = await playbilling.play("GET", `/oneTimeProducts/${playbilling.LAUNCH}`);
  const pro = await playbilling.play("GET", `/subscriptions/${playbilling.PRO}`);
  res.json({ enabled: true, subscriptions: subs.status, launch: { status: launch.status, body: launch.body }, pro: { status: pro.status, body: pro.body } });
}));
app.post("/api/admin/support-email", adminOnly, wrap(async (req, res) => {
  const to = String(req.body?.to || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(to)) throw httpError(400, "to must be an email address");
  res.json(await domains.setupSupportEmail(to, String(req.body?.local || "support").replace(/[^\w.-]/g, "") || "support"));
}));
app.post("/api/admin/play/products", adminOnly, wrap(async (req, res) => res.json({ log: await playbilling.createProducts(req.body || {}) })));
// App builds for the owner to upload to Play Console (too big to send by chat): a private link
// with a random id, kept 7 days.
const BUILDS = path.join(config.dataDir, "builds");
app.post("/api/admin/builds", adminOnly, express.raw({ type: "application/octet-stream", limit: "250mb" }), (req, res) => {
  const name = String(req.query.name || "snapfront.aab").replace(/[^\w.-]/g, "").slice(0, 80) || "snapfront.aab";
  if (!Buffer.isBuffer(req.body) || req.body.length < 1000) throw httpError(400, "Send the file as application/octet-stream.");
  const id = crypto.randomBytes(18).toString("base64url");
  fs.mkdirSync(path.join(BUILDS, id), { recursive: true });
  fs.writeFileSync(path.join(BUILDS, id, name), req.body);
  res.status(201).json({ url: `${config.publicUrl}/builds/${id}/${name}`, bytes: req.body.length });
});
app.get("/builds/:id/:name", (req, res) => {
  const { id, name } = req.params;
  if (!/^[\w-]{20,40}$/.test(id) || !/^[\w.-]+$/.test(name)) return res.status(404).end();
  const file = path.join(BUILDS, id, name);
  let st;
  try { st = fs.statSync(file); } catch { return res.status(404).send("This download link has expired."); }
  if (Date.now() - st.mtimeMs > 7 * 864e5) { fs.rm(path.join(BUILDS, id), { recursive: true, force: true }, () => {}); return res.status(410).send("This download link has expired."); }
  res.download(file, name);
});
// The app calls this when it opens and after a restore; a background check catches renewals and expiries.
app.post("/api/billing/sync", auth, wrap(async (req, res) => {
  req.account = await plans.syncPlan(req.account);
  res.json(me(req));
}));
// Plans bought on the website, through Stripe Checkout on Snapfront's own Stripe account.
app.get("/api/billing/web/offers", auth, (_req, res) => res.json({ enabled: webbilling.enabled(), offers: webbilling.enabled() ? webbilling.offers() : [], android_url: webbilling.androidUrl() }));
app.post("/api/billing/web/checkout", auth, wrap(async (req, res) => {
  if (req.body?.ref) { partners.claim(req.account, String(req.body.ref)); req.account = plans.getAccount(req.account.id); }
  res.json(await webbilling.startCheckout(req.account, String(req.body?.plan || "")));
}));
/* ---------- Snapfront Partners (affiliates who sell Snapfront) ---------- */
app.get("/api/partners/me", auth, (req, res) => res.json(partners.view(req.account, req.seller)));
app.post("/api/partners/join", auth, (req, res) => { partners.join(req.account, req.body || {}); res.status(201).json(partners.view(req.account, req.seller)); });
app.patch("/api/partners/me", auth, (req, res) => { partners.update(req.account, req.body || {}); res.json(partners.view(req.account, req.seller)); });
// The Snapfront membership card on this store's link-in-bio page (sends visitors to the partner's /join page).
app.put("/api/partners/bio-card", auth, (req, res) => res.json(partners.setBioCard(req.account, req.seller, Boolean(req.body?.on))));
app.post("/api/partners/claim", auth, (req, res) => res.json(partners.claim(req.account, String(req.body?.code || ""))));
app.get("/api/admin/partners", adminOnly, (_req, res) => res.json(partners.adminSummary()));
// Feature usage for the owner: row counts per table (and per status/kind where a table has one),
// with when each was first and last used. Counts only; no customer data leaves the server.
/* ---------- the owner's own avatars, for Snapfront's own tutorials and ads (admin token; owner accounts only) ---------- */
// Lets the owner's tools find an avatar the owner made in the app, give it a new look (which faces the
// camera) and make talking videos with it, charged to the owner's own account. Customers' accounts
// are never reachable here: every request is checked against OWNER_EMAILS.
const ownerAccounts = () => config.ownerEmails.length ? db.prepare(`SELECT * FROM accounts WHERE lower(email) IN (${config.ownerEmails.map(() => "?").join(",")})`).all(...config.ownerEmails) : [];
function ownerAvatar(id) {
  const a = db.prepare("SELECT * FROM avatars WHERE id = ?").get(String(id || ""));
  const account = a && ownerAccounts().find((x) => x.id === a.account_id);
  if (!account) throw httpError(404, "That isn't one of the owner's avatars.");
  return { account, seller: db.prepare("SELECT * FROM sellers WHERE id = ?").get(a.seller_id), avatar: a };
}
app.get("/api/admin/owner/avatars", adminOnly, (_req, res) => {
  const accounts = ownerAccounts();
  res.json({ avatars: accounts.flatMap((acc) => db.prepare("SELECT a.*, s.store_name FROM avatars a JOIN sellers s ON s.id = a.seller_id WHERE a.account_id = ? ORDER BY a.created_at DESC, a.rowid DESC").all(acc.id)
    .map((a) => ({ id: a.id, store: a.store_name, account: acc.email, account_id: acc.id, name: a.name, style: a.style, source: a.source || "ai", look: a.look, status: a.status, created_at: a.created_at, image_url: a.image_file ? `${config.publicUrl}/img/${a.image_file}` : null }))),
    credits: Object.fromEntries(accounts.map((acc) => [acc.email, credits.balance(acc.id)])) });
});
app.post("/api/admin/owner/avatars/:id/restyle", adminOnly, wrap(async (req, res) => {
  const o = ownerAvatar(req.params.id);
  res.status(201).json(await avatars.restyle(o.account, o.seller, o.avatar.id, req.body || {}));
}));
app.post("/api/admin/owner/avatars/:id/face-camera", adminOnly, wrap(async (req, res) => {
  const o = ownerAvatar(req.params.id);
  res.status(201).json(await avatars.turnToCamera(o.account, o.seller, o.avatar.id, req.body || {}));
}));
app.get("/api/admin/owner/avatars/:id/raw", adminOnly, wrap(async (req, res) => { const o = ownerAvatar(req.params.id); res.json(await avatars.rawStatus(o.seller, o.avatar.id)); }));
app.get("/api/admin/owner/avatars/:id", adminOnly, wrap(async (req, res) => { const o = ownerAvatar(req.params.id); res.json(await avatars.avatar(o.seller, o.avatar.id)); }));
app.post("/api/admin/owner/avatars/:id/talk", adminOnly, wrap(async (req, res) => {
  const o = ownerAvatar(req.params.id);
  res.status(201).json(await avatarVideos.start(o.account, o.seller, { ...(req.body || {}), kind: "talk", avatar_id: o.avatar.id }));
}));
app.get("/api/admin/owner/avatars/:id/videos/:vid", adminOnly, wrap(async (req, res) => { const o = ownerAvatar(req.params.id); res.json(await avatarVideos.one(o.seller, req.params.vid)); }));
app.get("/api/admin/usage", adminOnly, (_req, res) => {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map((t) => t.name);
  const q = (name) => `"${name.replace(/"/g, '""')}"`;
  const out = {};
  for (const name of tables) {
    const cols = db.prepare(`PRAGMA table_info(${q(name)})`).all().map((c) => c.name);
    const row = { rows: db.prepare(`SELECT COUNT(*) AS n FROM ${q(name)}`).get().n };
    const at = ["created_at", "at", "updated_at"].find((c) => cols.includes(c));
    if (at && row.rows) Object.assign(row, db.prepare(`SELECT MIN(${q(at)}) AS first, MAX(${q(at)}) AS last FROM ${q(name)}`).get());
    for (const c of ["status", "kind", "operation", "platform", "type", "context", "auth"].filter((c) => cols.includes(c))) {
      row[`by_${c}`] = Object.fromEntries(db.prepare(`SELECT ${q(c)} AS k, COUNT(*) AS n FROM ${q(name)} GROUP BY ${q(c)} ORDER BY n DESC LIMIT 15`).all().map((r) => [String(r.k), r.n]));
    }
    out[name] = row;
  }
  res.json({ generated_at: new Date().toISOString(), tables: out });
});
app.post("/api/admin/partners/:id/paid", adminOnly, (req, res) => res.json(partners.markPaid(req.params.id, req.body?.note)));
app.post("/api/admin/partners/:id/status", adminOnly, (req, res) => res.json(partners.setStatus(req.params.id, req.body?.status)));
app.post("/api/admin/partners/sweep", adminOnly, wrap(async (_req, res) => res.json({ paid: await partners.sweep() })));
// A small page for Snapfront's owner: partners, what they sold, and PayPal payouts to mark paid.
app.get("/admin/partners", (_req, res) => {
  res.set({ "Cache-Control": "no-store", "X-Robots-Tag": "noindex" }).type("html").send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Partners · Snapfront admin</title>
<style>body{margin:0;background:#0E1013;color:#EEF0F3;font:15px/1.5 system-ui,-apple-system,Segoe UI,sans-serif;padding:24px}h1{font-size:24px;margin:0 0 16px}table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}th,td{text-align:left;padding:10px 8px;border-bottom:1px solid #2A2F37;vertical-align:top}th{color:#9AA3AF;font-weight:500}input,button{font:inherit;border-radius:10px;border:1px solid #363C46;background:#171A1F;color:#EEF0F3;padding:8px 12px}button{background:#E5E9F0;color:#11151B;border:0;font-weight:700;cursor:pointer}.wrap{overflow-x:auto}.muted{color:#9AA3AF}#out{margin-top:16px}</style></head>
<body><h1>Snapfront Partners</h1><form id="f"><input id="t" type="password" placeholder="Admin token" autocomplete="off"> <button>Load</button></form><div id="out"></div>
<script>
const $=(s)=>document.querySelector(s),money=(n)=>"$"+Number(n).toFixed(2);
let tok=sessionStorage.getItem("sf_admin")||"";$("#t").value=tok;
async function api(m,u,b){const r=await fetch(u,{method:m,headers:{Authorization:"Bearer "+tok,"Content-Type":"application/json"},body:b?JSON.stringify(b):undefined});const j=await r.json();if(!r.ok)throw new Error(j.error||r.status);return j}
function cell(t){const td=document.createElement("td");td.textContent=t;return td}
async function load(){const o=$("#out");o.textContent="Loading…";try{const d=await api("GET","/api/admin/partners");o.textContent="";
const p=document.createElement("p");p.className="muted";p.textContent="Commission "+d.rate+"% of Lifetime. Automatic Stripe payouts: "+(d.auto_payouts?"on":"off")+". Pay PayPal partners their Ready amount, then mark it paid.";o.appendChild(p);
const w=document.createElement("div");w.className="wrap";const t=document.createElement("table");t.innerHTML="<thead><tr><th>Partner</th><th>Code</th><th>Clicks</th><th>Sign-ups</th><th>Sales</th><th>Revenue</th><th>Held</th><th>Ready</th><th>Paid</th><th>Pays by</th><th></th></tr></thead>";const b=document.createElement("tbody");
d.partners.forEach((x)=>{const tr=document.createElement("tr");[x.email+(x.status!=="active"?" (suspended)":""),x.code,x.clicks,x.signups,x.sales,money(x.revenue),money(x.pending),money(x.ready),money(x.paid),x.payout==="paypal"?"PayPal "+x.paypal_email:x.payout].forEach((v)=>tr.appendChild(cell(String(v))));
const td=document.createElement("td");if(x.ready>0&&x.payout!=="stripe"){const btn=document.createElement("button");btn.textContent="Mark "+money(x.ready)+" paid";btn.onclick=async()=>{const note=prompt("Payment note (e.g. PayPal transaction id)")||"PayPal";try{await api("POST","/api/admin/partners/"+x.account_id+"/paid",{note});load()}catch(e){alert(e.message)}};td.appendChild(btn)}tr.appendChild(td);b.appendChild(tr)});
t.appendChild(b);w.appendChild(t);o.appendChild(w);if(!d.partners.length)o.appendChild(Object.assign(document.createElement("p"),{textContent:"No partners yet.",className:"muted"}))}catch(e){o.textContent=e.message}}
$("#f").onsubmit=(e)=>{e.preventDefault();tok=$("#t").value.trim();sessionStorage.setItem("sf_admin",tok);load()};if(tok)load();
</script></body></html>`);
});
app.post("/api/admin/play/retire-old", adminOnly, wrap(async (_req, res) => res.json({ log: await playbilling.retireOldProducts() })));
// After the phone app without buying is live: stop selling memberships through Google Play.
app.post("/api/admin/play/stop-sales", adminOnly, wrap(async (_req, res) => res.json({ log: await playbilling.stopSales() })));
app.post("/api/billing/web/confirm", auth, wrap(async (req, res) => {
  const { email } = await webbilling.confirm(req.account, req.body?.session_id);
  req.account = plans.getAccount(req.account.id);
  res.json({ ...me(req), checkout_email: email });
}));
app.post("/api/billing/web/portal", auth, wrap(async (req, res) => res.json(await webbilling.portal(req.account))));
// The app bought a plan (or is restoring one): check it with Google Play and unlock it.
app.post("/api/billing/google", auth, wrap(async (req, res) => {
  await playbilling.recordPurchase(req.account, { productId: req.body?.product_id, purchaseToken: req.body?.purchase_token });
  req.account = plans.getAccount(req.account.id);
  res.json(me(req));
}));

/* ---------- email sign-in, so purchases and stores follow the person to a new phone ---------- */
app.post("/api/auth/email/start", auth, wrap(async (req, res) => res.json(await auth2.startEmailLogin(req.account, req.body?.email))));
// Signing out ends this device's session only; other phones and browsers stay signed in.
app.post("/api/auth/logout", (req, res) => {
  const token = (req.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (token) db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
  res.status(204).end();
});
app.post("/api/auth/email/verify", auth, (req, res) => res.json(auth2.verifyEmailLogin(req.account, req.body?.email, req.body?.code)));

/* ---------- AI ---------- */
app.post("/api/ai/product-from-photo", auth, aiLimit, wrap(async (req, res) => {
  const { imageBase64, mediaType = "image/jpeg", kind = "physical", hint, price, tone } = req.body || {};
  plans.assertAllowance(req.account, "photo");
  const image_file = saveImage(imageBase64, mediaType, req.seller.id);
  const r = await productFromPhoto({ imageBase64, mediaType, kind, hint: clampStr(hint, 300), price: price ? Number(price) : null, tone: clampStr(tone, 40) });
  res.json({
    image_file, image_url: `${config.publicUrl}/img/${image_file}`, kind: kind === "digital" ? "digital" : "physical",
    title: clampStr(r.title, 120), tagline: clampStr(r.tagline, 160), description: clampStr(r.description, 3000),
    bullets: strList(r.bullets, 6), tags: strList(r.tags, 6, 30).map((t) => t.replace(/^#/, "")), faq: faqList(r.faq),
    category: clampStr(r.category, 60), price: price ? Number(price) : Number(r.suggested_price) || 0,
    alt_text: clampStr(r.alt_text, 200), seo_description: clampStr(r.seo_description, 160),
  });
  plans.recordUsage(req.account, "photo");
}));

app.post("/api/ai/generate", auth, aiLimit, wrap(async (req, res) => {
  res.status(201).json(await plans.withAllowance(req.account, "product", () => store.generateProduct(req.seller, req.body || {})));
}));

/* ---------- photo studio: a new background for a product photo ---------- */
app.get("/api/studio", auth, (_req, res) => res.json(studio.presets()));
app.post("/api/studio", auth, aiLimit, wrap(async (req, res) => {
  const { imageBase64, mediaType = "image/jpeg", image_file, style } = req.body || {};
  studio.fieldsFor(style);   // check the choice before using an allowance
  plans.assertAllowance(req.account, "studio");
  const source = imageBase64 ? saveImage(imageBase64, mediaType, req.seller.id) : assertSellerImage(req.seller, image_file);
  studio.sourcePath(source);
  const { file, notice } = await plans.withAllowance(req.account, "studio", () => studio.restyle(source, style));
  db.prepare("INSERT OR IGNORE INTO seller_media (image_file,seller_id) VALUES (?,?)").run(file, req.seller.id);
  res.json({ image_file: file, image_url: `${config.publicUrl}/img/${file}`, source_file: source, notice });
}));

/* ---------- marketing: posts, carousels, reels, AI video and AI lifestyle photos ---------- */
const ownProduct = (req, id) => rowToProduct(store.productRow(req.seller, id));
app.get("/api/marketing", auth, (_req, res) => res.json({ templates: marketing.TEMPLATES, formats: Object.keys(marketing.FORMATS), ai: aimedia.presets() }));
app.post("/api/marketing/copy", auth, aiLimit, wrap(async (req, res) => {
  const b = req.body || {};
  const product = ownProduct(req, b.product_id);
  res.json(await plans.withAllowance(req.account, "post", () => marketing.writeCopy(req.seller, product, { platform: b.platform, tone: clampStr(b.tone, 60), offer: clampStr(b.offer, 60) })));
}));
app.post("/api/marketing/render", auth, aiLimit, wrap(async (req, res) => {
  const b = req.body || {};
  const rendered = await marketing.renderPost(req.seller, ownProduct(req, b.product_id), { kind: b.kind, template: b.template, format: b.format, copy: b.copy, offer: b.offer, image_url: b.image_url });
  const owned = await social.registerRender(req.seller, rendered, b.format || "post");
  res.json({ ...rendered, ...owned });
}));
// Seller-owned Meta destinations and durable marketing publishing. The auth middleware resolves
// both the account and its X-Store seller before any social data is read or changed.
app.get("/api/social/accounts", auth, (req, res) => res.json(social.accounts(req.seller)));
// The phone app sends X-Snapfront-App; anything else is the website, which gets a web page back.
app.post("/api/social/authorize", auth, (req, res) => res.json(social.authorize(req.seller, req.account, {
  web: !req.get("x-snapfront-app"), provider: req.body?.provider === "instagram" ? "instagram" : "facebook",
})));
app.delete("/api/social/accounts/:id", auth, (req, res) => res.json(social.disconnect(req.seller, req.params.id)));
app.get("/api/social/posts", auth, (req, res) => res.json(social.posts(req.seller)));
app.post("/api/social/posts", auth, (req, res) => res.status(201).json(social.createPosts(req.seller, req.body || {})));
app.post("/api/social/posts/:id/cancel", auth, (req, res) => res.json(social.cancelPost(req.seller, req.params.id)));
app.post("/api/social/posts/:id/retry", auth, (req, res) => res.json(social.retryPost(req.seller, req.params.id)));
app.get("/api/ai-media", auth, (req, res) => res.json({ ...aimedia.presets(), jobs: aimedia.jobsFor(req.seller) }));
app.post("/api/ai-media", auth, aiLimit, wrap(async (req, res) => res.status(201).json(await aimedia.start(req.account, req.seller, req.body || {}))));
app.get("/api/ai-media/:id", auth, wrap(async (req, res) => {
  aimedia.jobFor(req.seller, req.params.id);
  await aimedia.poll(req.params.id).catch(() => {});
  res.json(aimedia.view(aimedia.jobFor(req.seller, req.params.id)));
}));

/* ---------- growth: insights, reviews, QR codes ---------- */
app.get("/api/insights", auth, (req, res) => {
  if (plans.effectivePlan(req.account) !== "pro") throw httpError(402, "Store insights come with Pro.", { upgrade: "pro" });
  res.json(growth.insights(req.seller, req.query.days));
});
/* ---------- Sales & profit: each seller's back office ---------- */
const freshMoney = (seller) => Promise.race([business.syncDue(seller.id, 15).catch(() => 0), new Promise((r) => setTimeout(r, 4000))]);
app.get("/api/business/summary", auth, wrap(async (req, res) => { await freshMoney(req.seller); res.json(business.summary(req.seller, req.query)); }));
app.get("/api/business/sales", auth, (req, res) => res.json(business.sales(req.seller, req.query)));
app.get("/api/business/customers", auth, (req, res) => res.json(business.customers(req.seller, req.query)));
app.get("/api/business/customers/:email", auth, (req, res) => res.json(business.customer(req.seller, req.params.email)));
app.patch("/api/business/customers/:email", auth, (req, res) => res.json(business.updateCustomer(req.seller, req.params.email, req.body || {})));
app.get("/api/business/expenses", auth, (req, res) => res.json(business.listExpenses(req.seller, req.query)));
app.post("/api/business/expenses", auth, (req, res) => res.status(201).json(business.addExpense(req.seller, req.body || {})));
app.delete("/api/business/expenses/:id", auth, (req, res) => { business.deleteExpense(req.seller, req.params.id); res.status(204).end(); });
app.get("/api/business/balance", auth, wrap(async (req, res) => res.json(await business.balance(req.seller).catch((e) => {
  console.warn("[business] balance", e.message);
  return { connected: Boolean(req.seller.stripe_account_id), error: "Stripe didn't answer. Try again in a minute." };
}))));
app.post("/api/business/export", auth, (req, res) => res.json(business.exportLink(req.seller, String(req.body?.kind || ""), req.body || {})));
// Signed download link (opens in a browser or the phone's share sheet without the sign-in header).
app.get("/api/business/export", (req, res) => {
  try {
    const f = business.exportFile(req.query);
    res.set("Cache-Control", "no-store").attachment(f.name).type("text/csv").send(f.body);
  } catch (e) { res.status(e.status || 500).type("text/plain").send(e.message); }
});
/* ---------- email list and email marketing ---------- */
app.get("/api/email", auth, (req, res) => res.json(audience.overview(req.seller)));
app.put("/api/email/settings", auth, (req, res) => res.json(audience.updateSettings(req.seller, req.body || {})));
app.get("/api/email/subscribers", auth, (req, res) => res.json(audience.listSubscribers(req.seller, req.query)));
app.post("/api/email/subscribers", auth, (req, res) => res.status(201).json(audience.addSubscribers(req.seller, req.body || {})));
app.patch("/api/email/subscribers/:id", auth, (req, res) => res.json(audience.updateSubscriber(req.seller, req.params.id, req.body || {})));
app.delete("/api/email/subscribers/:id", auth, (req, res) => { audience.deleteSubscriber(req.seller, req.params.id); res.status(204).end(); });
app.get("/api/email/campaigns", auth, (req, res) => res.json(audience.listCampaigns(req.seller)));
app.post("/api/email/campaigns", auth, (req, res) => res.status(201).json(audience.createCampaign(req.seller, req.body || {})));
app.get("/api/email/campaigns/:id", auth, (req, res) => res.json(audience.getCampaign(req.seller, req.params.id)));
app.patch("/api/email/campaigns/:id", auth, (req, res) => res.json(audience.updateCampaign(req.seller, req.params.id, req.body || {})));
app.delete("/api/email/campaigns/:id", auth, (req, res) => { audience.deleteCampaign(req.seller, req.params.id); res.status(204).end(); });
app.get("/api/email/campaigns/:id/preview", auth, (req, res) => res.json(audience.previewCampaign(req.seller, req.params.id)));
app.post("/api/email/campaigns/:id/test", auth, wrap(async (req, res) => res.json(await audience.testCampaign(req.seller, req.account, req.params.id, req.body?.to))));
app.post("/api/email/campaigns/:id/send", auth, (req, res) => res.json(audience.sendCampaign(req.seller, req.params.id, req.body || {})));
app.post("/api/email/campaigns/:id/cancel", auth, (req, res) => res.json(audience.cancelCampaign(req.seller, req.params.id)));
app.post("/api/email/campaigns/:id/duplicate", auth, (req, res) => res.status(201).json(audience.duplicateCampaign(req.seller, req.params.id)));
app.get("/api/email/flows", auth, (req, res) => res.json(audience.flows(req.seller)));
app.put("/api/email/flows/:kind", auth, (req, res) => res.json(audience.updateFlow(req.seller, req.params.kind, req.body || {})));

/* ---------- affiliate program ---------- */
app.get("/api/affiliates", auth, (req, res) => res.json(affiliates.overview(req.seller)));
app.put("/api/affiliates/settings", auth, (req, res) => res.json(affiliates.updateSettings(req.seller, req.body || {})));
app.post("/api/affiliates", auth, (req, res) => res.status(201).json(affiliates.addAffiliate(req.seller, req.body || {})));
app.get("/api/affiliates/:id", auth, (req, res) => {
  const a = affiliates.overview(req.seller).affiliates.find((x) => x.id === req.params.id);
  if (!a) throw httpError(404, "That affiliate doesn't exist.");
  res.json({ affiliate: a, orders: affiliates.referredOrders(req.seller, a.id), payouts: affiliates.payouts(req.seller, a.id) });
});
app.patch("/api/affiliates/:id", auth, (req, res) => res.json(affiliates.updateAffiliate(req.seller, req.params.id, req.body || {})));
app.delete("/api/affiliates/:id", auth, (req, res) => { affiliates.deleteAffiliate(req.seller, req.params.id); res.status(204).end(); });
app.post("/api/affiliates/:id/payouts", auth, (req, res) => res.status(201).json(affiliates.addPayout(req.seller, req.params.id, req.body || {})));

/* ---------- ad pixels ---------- */
app.get("/api/pixels", auth, (req, res) => res.json(pixels.view(req.seller)));
app.put("/api/pixels", auth, (req, res) => res.json(pixels.update(req.seller, req.body || {})));

/* ---------- Instagram AutoDM ---------- */
app.get("/api/autodm", auth, (req, res) => res.json({ ...autodm.status(req.seller), rules: autodm.rules(req.seller) }));
app.post("/api/autodm/rules", auth, (req, res) => res.status(201).json(autodm.createRule(req.seller, req.body || {})));
app.patch("/api/autodm/rules/:id", auth, (req, res) => res.json(autodm.updateRule(req.seller, req.params.id, req.body || {})));
app.delete("/api/autodm/rules/:id", auth, (req, res) => { autodm.deleteRule(req.seller, req.params.id); res.status(204).end(); });
app.post("/api/autodm/connect", auth, wrap(async (req, res) => res.json({ pages: await autodm.subscribePages(req.seller) })));

/* ---------- Snapfront Academy, today's post idea and the community ---------- */
app.get("/api/academy", auth, (req, res) => res.json(academy.catalog(req.account)));
app.get("/api/academy/:id", auth, (req, res) => res.json(academy.lesson(req.account, req.params.id)));
app.post("/api/academy/:id/done", auth, (req, res) => res.json(academy.setDone(req.account, req.params.id, req.body?.done !== false)));
app.get("/academy-media/:file", (req, res) => {
  const file = academy.videoFile(req.params.file, req.query.e, req.query.s);
  if (!file) return res.status(403).send("This video link has expired. Open the lesson again.");
  res.set("Cache-Control", "private, max-age=3600").type("video/mp4").sendFile(file);
});
app.get("/api/admin/academy", adminOnly, (_req, res) => res.json(academy.buildStatus()));
// A finished film for a lesson (tools/ugc-film): owner only, MP4, up to 400 MB.
app.put("/api/academy/films/:name", (req, res, next) => ownerOrStudio(req, res, next), express.raw({ type: ["video/mp4", "application/octet-stream"], limit: "400mb" }),
  (req, res) => res.json(academy.saveFilm(req.params.name, req.body, req.query.seconds)));
app.get("/api/academy-films", (req, res, next) => ownerOrStudio(req, res, next), (_req, res) => res.json({ films: academy.FILMS() }));
/* ---------- Academy lessons taught by an avatar: the owner (or ACADEMY_STUDIO_TOKEN, for the screen recorder) ---------- */
function ownerOrStudio(req, res, next) {
  const t = (req.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const studio = String(process.env.ACADEMY_STUDIO_TOKEN || "").trim();
  if (studio.length >= 24 && t && sameSecret(t, studio)) return next();
  auth(req, res, (err) => (err ? next(err) : credits.isOwner(req.account) ? next() : next(httpError(403, "Only Snapfront's owner can change the Academy presenter."))));
}
app.get("/api/academy-presenter", ownerOrStudio, wrap(async (_req, res) => res.json(await academyPresenter.view(academy.buildStatus()))));
app.put("/api/academy-presenter", ownerOrStudio, wrap(async (req, res) => {
  await academyPresenter.setSettings(req.body || {});
  academy.buildPresenterLessons();
  res.json(await academyPresenter.view(academy.buildStatus()));
}));
app.post("/api/academy-presenter/build", ownerOrStudio, wrap(async (_req, res) => {
  academy.buildPresenterLessons();
  res.json(await academyPresenter.view(academy.buildStatus()));
}));
app.get("/api/academy-presenter/voice-library", ownerOrStudio, wrap(async (req, res) => res.json(await academyPresenter.searchVoices(req.query || {}))));
app.post("/api/academy-presenter/voices", ownerOrStudio, wrap(async (req, res) => res.status(201).json(await academyPresenter.addVoice(req.body || {}))));
app.post("/api/academy-presenter/voice-sample", ownerOrStudio, wrap(async (req, res) => res.json(await academyPresenter.voiceSample(req.body?.voice, req.body?.text))));
// A new outfit for one of the owner's avatars (a new avatar; the original stays).
app.post("/api/academy-presenter/outfit", ownerOrStudio, wrap(async (req, res) => {
  const { seller, account } = academyPresenter.ownerAvatar(req.body?.avatar_id);
  res.status(201).json(await avatars.restyle(account, seller, req.body.avatar_id, req.body || {}));
}));
app.put("/api/academy-presenter/screens/:lesson/:slide", ownerOrStudio, express.raw({ type: ["video/*", "application/octet-stream"], limit: "80mb" }),
  wrap(async (req, res) => res.json(await academyPresenter.saveScreen(req.params.lesson, req.params.slide, req.body))));
/* ---------- Studio: Runpod jobs for Snapfront's own site artwork (the home page's tool cards). Owner or studio token only. ---------- */
const STUDIO_EPS = () => new Set(["qwen-image-t2i", "qwen-image-edit-2511", "nano-banana-pro-edit", "google-nano-banana-2-edit", "seedream-v4-edit", "seedream-v4-t2i",
  ...avatarVideos.MODELS.map((m) => m.endpoint())]);
const studioEp = (req) => { if (!STUDIO_EPS().has(req.params.ep)) throw httpError(404, "Unknown studio model."); return req.params.ep; };
app.post("/api/studio/runpod/:ep/run", ownerOrStudio, wrap(async (req, res) => res.json(await aimedia.runpod(`${studioEp(req)}/run`, { input: req.body?.input || {} }))));
app.get("/api/studio/runpod/:ep/status/:id", ownerOrStudio, wrap(async (req, res) => {
  if (!/^[\w-]{6,80}$/.test(req.params.id)) throw httpError(400, "Bad job id.");
  res.json(await aimedia.runpod(`${studioEp(req)}/status/${req.params.id}`));
}));
app.post("/api/admin/academy/build", adminOnly, (req, res) => { academy.buildMissing({ voice: req.body?.voice }).catch((e) => console.error("[academy]", e.message)); res.json(academy.buildStatus()); });
app.get("/api/daily-prompt", auth, wrap(async (req, res) => res.json(await daily.today(req.seller, { fresh: req.query.fresh === "1" }))));
app.get("/api/community", auth, (req, res) => res.json(community.view(req.account)));
/* ---------- the members' community (Skool-style): feed, comments, likes/points, leaderboard, members, calendar ---------- */
/* ---------- "Start here": a short quiz becomes a personal plan (visitors can preview before signing up) ---------- */
app.get("/api/promo", (_req, res) => res.set("Cache-Control", "public, max-age=300").json({ promo: promoFiles() }));
app.get("/api/start-plan/questions", (_req, res) => res.json({ questions: startPlan.QUESTIONS }));
app.post("/api/start-plan/preview", (req, res) => res.json(startPlan.buildPlan(req.body?.answers || {})));
app.get("/api/start-plan", auth, (req, res) => res.json({ questions: startPlan.QUESTIONS, plan: startPlan.get(req.account) }));
app.post("/api/start-plan", auth, (req, res) => res.json({ plan: startPlan.save(req.account, req.body?.answers || {}) }));
app.put("/api/start-plan/steps/:id", auth, (req, res) => res.json({ plan: startPlan.setDone(req.account, req.params.id, req.body?.done !== false) }));
app.delete("/api/start-plan", auth, (req, res) => res.json({ plan: startPlan.reset(req.account) }));
app.get("/community/unsubscribe", (req, res) => {
  const ok = feed.unsubscribe(req.query.a, req.query.t);
  res.status(ok ? 200 : 400).type("html").send(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:system-ui,sans-serif;max-width:480px;margin:60px auto;padding:0 20px;color:#11151B"><h1 style="font-size:22px">${ok ? "Community emails are off" : "That link didn't work"}</h1><p>${ok ? "You won't get emails about replies or announcements. You can turn them back on in the Community, under Members, Your profile." : "Open the Community in Snapfront and change it under Members, Your profile."}</p></body>`);
});
app.get("/api/community/home", auth, (req, res) => res.json({ ...feed.home(req.account, req.query), links: community.view(req.account) }));
app.get("/api/community/posts", auth, (req, res) => res.json(feed.feed(req.account, req.query)));
app.post("/api/community/posts", auth, (req, res) => res.status(201).json(feed.create(req.account, req.seller, req.body || {})));
app.get("/api/community/posts/:id", auth, (req, res) => res.json(feed.thread(req.account, req.params.id)));
app.patch("/api/community/posts/:id", auth, (req, res) => res.json(feed.edit(req.account, req.params.id, req.body || {})));
app.delete("/api/community/posts/:id", auth, (req, res) => res.json(feed.remove(req.account, req.params.id)));
app.put("/api/community/posts/:id/pin", auth, (req, res) => res.json(feed.pin(req.account, req.params.id, Boolean(req.body?.pinned))));
app.post("/api/community/posts/:id/comments", auth, (req, res) => res.status(201).json(feed.comment(req.account, req.seller, req.params.id, req.body || {})));
app.delete("/api/community/comments/:id", auth, (req, res) => res.json(feed.removeComment(req.account, req.params.id)));
app.put("/api/community/likes/:kind/:id", auth, (req, res) => res.json(feed.like(req.account, req.params.kind, req.params.id, req.body?.liked !== false)));
app.post("/api/community/reports", auth, (req, res) => res.status(201).json(feed.report(req.account, req.body?.kind, req.body?.id, req.body?.reason)));
app.get("/api/community/reports", auth, (req, res) => res.json(feed.reports(req.account)));
app.put("/api/community/reports/:kind/:id", auth, (req, res) => res.json(feed.resolveReport(req.account, req.params.kind, req.params.id)));
app.put("/api/community/members/:id/mute", auth, (req, res) => res.json(feed.mute(req.account, req.params.id, Boolean(req.body?.muted))));
app.get("/api/community/leaderboard", auth, (req, res) => res.json(feed.leaderboard(req.account, req.query.period)));
app.get("/api/community/members", auth, (req, res) => res.json(feed.members(req.account, req.query)));
app.get("/api/community/notifications", auth, (req, res) => res.json(feed.notifications(req.account)));
app.post("/api/community/notifications/read", auth, (req, res) => res.json(feed.markRead(req.account)));
app.get("/api/community/events", auth, (req, res) => res.json(feed.events(req.account)));
app.post("/api/community/events", auth, (req, res) => res.status(201).json(feed.addEvent(req.account, req.body || {})));
app.delete("/api/community/events/:id", auth, (req, res) => res.json(feed.removeEvent(req.account, req.params.id)));
app.put("/api/community/profile", auth, (req, res) => res.json(feed.updateProfile(req.account, req.body || {})));
app.post("/api/community/photos", auth, (req, res) => {
  if (!sniffImage(req.body?.imageBase64)) throw httpError(400, "Use a JPG, PNG, WebP or GIF photo.");
  const file = saveImage(req.body?.imageBase64, req.body?.mediaType || "image/jpeg", req.seller.id);
  res.status(201).json({ image_file: file, image_url: `${config.publicUrl}/img/${file}` });
});
app.get("/api/admin/settings", adminOnly, (_req, res) => res.json({ settings: community.all(), help: community.SETTINGS }));
app.put("/api/admin/settings", adminOnly, (req, res) => res.json(community.update(req.body || {})));

/* ---------- UGC creator kit ---------- */
app.get("/api/ugc", auth, (req, res) => res.json({ profile: ugc.profile(req.seller), platforms: ugc.platforms(), ...ugc.deals(req.seller) }));
app.put("/api/ugc/profile", auth, (req, res) => res.json(ugc.updateProfile(req.seller, req.body || {})));
app.post("/api/ugc/videos", auth, express.raw({ type: ["video/*", "application/octet-stream"], limit: "150mb" }), wrap(async (req, res) => {
  if (!Buffer.isBuffer(req.body)) throw httpError(400, "Upload the video file itself.");
  res.status(201).json(await ugc.addVideo(req.seller, req.body, String(req.query.title || "")));
}));
app.post("/api/ugc/script", auth, aiLimit, wrap(async (req, res) => res.json(await ugc.script(req.account, req.body || {}))));
app.post("/api/ugc/deals", auth, (req, res) => res.status(201).json(ugc.addDeal(req.seller, req.body || {})));
app.patch("/api/ugc/deals/:id", auth, (req, res) => res.json(ugc.updateDeal(req.seller, req.params.id, req.body || {})));
app.delete("/api/ugc/deals/:id", auth, (req, res) => { ugc.deleteDeal(req.seller, req.params.id); res.status(204).end(); });

/* ---------- faceless videos ---------- */
/* ---------- YouTube Shorts add-on (Zernio): post finished videos to the member's own channel ---------- */
app.get("/api/youtube", auth, wrap(async (req, res) => res.json(await youtube.status(req.account, req.seller))));
app.post("/api/youtube/checkout", auth, wrap(async (req, res) => res.json(await youtube.startCheckout(req.account))));
app.post("/api/youtube/confirm", auth, wrap(async (req, res) => { await youtube.confirm(req.account, req.body?.session_id); res.json(await youtube.status(req.account, req.seller)); }));
app.post("/api/youtube/connect", auth, wrap(async (req, res) => res.json(await youtube.connectUrl(req.account))));
app.post("/api/youtube/sync", auth, wrap(async (req, res) => { await youtube.sync(req.account); res.json(await youtube.status(req.account, req.seller)); }));
app.delete("/api/youtube/connection", auth, wrap(async (req, res) => { await youtube.disconnect(req.account); res.json(await youtube.status(req.account, req.seller)); }));
app.post("/api/youtube/posts", auth, wrap(async (req, res) => res.status(201).json(await youtube.post(req.account, req.seller, req.body || {}))));
app.get("/api/faceless", auth, (req, res) => res.json(faceless.jobs(req.seller)));
app.post("/api/faceless/script", auth, aiLimit, wrap(async (req, res) => res.json(await faceless.writeScript(req.account, req.seller, req.body || {}))));
app.post("/api/faceless/videos", auth, (req, res) => res.status(201).json(faceless.start(req.seller, req.body || {})));
app.get("/api/faceless/videos/:id", auth, (req, res) => res.json(faceless.job(req.seller, req.params.id)));
app.delete("/api/faceless/videos/:id", auth, (req, res) => { faceless.remove(req.seller, req.params.id); res.status(204).end(); });
/* ---------- avatars for posts and stories: original AI characters, your own photo, or a blend ---------- */
app.get("/api/avatars", auth, (req, res) => res.json(avatars.overview(req.seller)));
app.post("/api/avatars", auth, aiLimit, wrap(async (req, res) => {
  const b = req.body || {};
  const made = b.source === "photo" ? avatars.fromPhoto(req.account, req.seller, b) : b.source === "blend" ? await avatars.blend(req.account, req.seller, b) : await avatars.create(req.account, req.seller, b);
  res.status(201).json(made);
}));
// A photo of a person for "Use my photo" or "Blend": checked (one adult, no nudity) and staged for a day.
app.post("/api/avatar-photos", auth, aiLimit, wrap(async (req, res) => res.status(201).json(await avatars.stagePhoto(req.account, req.seller, req.body || {}))));
app.get("/api/avatars/:id", auth, wrap(async (req, res) => res.json(await avatars.avatar(req.seller, req.params.id))));
app.delete("/api/avatars/:id", auth, (req, res) => { avatars.remove(req.seller, req.params.id); res.status(204).end(); });
app.post("/api/avatars/:id/outfit", auth, aiLimit, wrap(async (req, res) => res.status(201).json(await avatars.restyle(req.account, req.seller, req.params.id, req.body || {}))));
app.post("/api/avatar-shots", auth, aiLimit, wrap(async (req, res) => res.status(201).json(await avatars.shoot(req.account, req.seller, req.body || {}))));
app.get("/api/avatar-shots/:id", auth, wrap(async (req, res) => res.json(await avatars.shot(req.seller, req.params.id))));
/* ---------- avatar videos and talking avatars, paid with credits ---------- */
app.get("/api/avatar-videos", auth, wrap(async (req, res) => res.json(await avatarVideos.list(req.account, req.seller))));
app.post("/api/avatar-videos", auth, aiLimit, wrap(async (req, res) => res.status(201).json(await avatarVideos.start(req.account, req.seller, req.body || {}))));
app.get("/api/avatar-videos/:id", auth, wrap(async (req, res) => res.json(await avatarVideos.one(req.seller, req.params.id))));
app.delete("/api/avatar-videos/:id", auth, (req, res) => { avatarVideos.remove(req.seller, req.params.id); res.status(204).end(); });
/* ---------- credits: packs bought on the website with Stripe ---------- */
app.get("/api/credits", auth, (req, res) => res.json(credits.view(req.account)));
app.post("/api/credits/checkout", auth, wrap(async (req, res) => res.json(await credits.startCheckout(plans.getAccount(req.account.id), String(req.body?.pack || "")))));
app.post("/api/credits/confirm", auth, wrap(async (req, res) => res.json(await credits.confirm(req.account, req.body?.session_id))));
app.post("/api/admin/credits/:account", adminOnly, (req, res) => res.json(credits.grant(req.params.account, req.body?.amount, req.body?.note)));

/* ---------- email opens, clicks and unsubscribes (links in sent emails) ---------- */
app.get("/e/o/:file", (req, res) => {
  audience.recordOpen(String(req.params.file).replace(/\.gif$/, ""));
  res.set({ "Content-Type": "image/gif", "Cache-Control": "no-store" }).send(audience.PIXEL);
});
app.get("/e/c/:id", (req, res) => {
  const url = audience.recordClick(req.params.id, String(req.query.u || ""), String(req.query.s || ""));
  if (!url) return res.status(400).send("This link isn't valid.");
  res.redirect(302, url);
});
const unsubPage = (title, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)}</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#F3F3F1;color:#1A1A1A;font:16px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;padding:16px}main{max-width:440px;background:#fff;border-radius:18px;padding:32px}h1{font-size:24px;margin:0 0 8px}button{margin-top:16px;height:48px;padding:0 24px;border:0;border-radius:999px;background:#1A1A1A;color:#fff;font:inherit;font-weight:700;cursor:pointer}p{margin:0 0 8px;color:#444}</style></head><body><main>${body}</main></body></html>`;
app.get("/u/:token", (req, res) => {
  const t = audience.unsubscribeTarget(req.params.token);
  res.set("Cache-Control", "no-store");
  if (!t) return res.status(404).send(unsubPage("Unsubscribe", "<h1>This link isn't valid</h1><p>It may have been copied incompletely.</p>"));
  if (t.sub.status === "unsubscribed") return res.send(unsubPage("Unsubscribed", `<h1>You're unsubscribed</h1><p>${esc(t.sub.email)} won't get marketing emails from ${esc(t.seller?.store_name || "this store")}.</p>`));
  // A button rather than unsubscribing on open: email scanners open links on their own.
  res.send(unsubPage("Unsubscribe", `<h1>Unsubscribe from ${esc(t.seller?.store_name || "this store")}?</h1><p>${esc(t.sub.email)} will stop getting news and offers. Order receipts still arrive.</p>
<form method="post"><button type="submit">Unsubscribe</button></form>`));
});
app.post("/u/:token", express.urlencoded({ extended: false, limit: "2kb" }), (req, res) => {
  const t = audience.unsubscribe(req.params.token);
  if (!t) return res.status(404).send(unsubPage("Unsubscribe", "<h1>This link isn't valid</h1>"));
  res.send(unsubPage("Unsubscribed", `<h1>You're unsubscribed</h1><p>${esc(t.sub.email)} won't get marketing emails from ${esc(t.seller?.store_name || "this store")}. Changed your mind? Sign up again on the store.</p>`));
});

app.get("/api/reviews", auth, (req, res) => res.json(growth.sellerReviews(req.seller)));
app.patch("/api/reviews/:id", auth, (req, res) => { growth.setReviewStatus(req.seller, req.params.id, req.body?.status); res.json(growth.sellerReviews(req.seller)); });
app.get("/api/qr", auth, wrap(async (req, res) => {
  const target = String(req.query.target || "store");
  let url = target === "links" ? growth.linksUrl(req.seller) : urls.storeUrl(req.seller.store_slug);
  if (target === "product") url = store.withPage(req.seller, store.productRow(req.seller, req.query.id)).page_url;
  res.type("png").set("Cache-Control", "no-store").send(await growth.qrPng(`${url}${url.includes("?") ? "&" : "?"}utm_source=qr`));
}));

/* ---------- price check: the same item at Amazon, Walmart, Target... from a photo ---------- */
app.post("/api/research/price-check", auth, aiLimit, wrap(async (req, res) => {
  const { imageBase64, mediaType = "image/jpeg", image_file, image_url, cost } = req.body || {};
  plans.assertAllowance(req.account, "research");
  let url;
  if (imageBase64) url = `${config.publicUrl}/img/${saveImage(imageBase64, mediaType, req.seller.id)}`;
  else if (image_file && /^[\w-]+\.(jpg|png|webp|gif)$/.test(image_file)) url = `${config.publicUrl}/img/${image_file}`;
  else if (image_url && /^https:\/\//.test(image_url)) url = String(image_url).slice(0, 1000);
  else throw httpError(400, "Add a photo or screenshot of the product.");
  const out = await research.priceCheck(url, cost);
  plans.recordUsage(req.account, "research");
  res.json({ image_url: url, ...out });
}));

/* ---------- dropshipping: suppliers the seller connects with their own account ---------- */
// ?source=cj|printful|aliexpress (CJ when left out, which is what the first Find-tab build sends).
const sourceOf = (req) => suppliers.adapterFor(req.query.source || req.body?.source || "cj").id;
app.get("/api/catalog/search", auth, wrap(async (req, res) => res.json(await dropship.search(req.account, sourceOf(req), { q: req.query.q, page: req.query.page }))));
app.get("/api/catalog/products/:pid", auth, wrap(async (req, res) => res.json(await dropship.preview(req.account, sourceOf(req), req.params.pid))));
app.post("/api/catalog/products/:pid/import", auth, aiLimit, wrap(async (req, res) => {
  const b = req.body || {};
  const out = await dropship.importProduct(req.account, req.seller, sourceOf(req), req.params.pid, {
    price: b.price, vids: Array.isArray(b.vids) ? b.vids.map(String).slice(0, 100) : undefined, priceCheck: b.price_check !== false,
  });
  res.status(201).json(out);
}));
app.get("/api/suppliers", auth, (req, res) => res.json(suppliers.status(req.account.id)));
app.put("/api/suppliers/:source", auth, wrap(async (req, res) => res.json(await dropship.connect(req.account, suppliers.adapterFor(req.params.source).id, req.body || {}))));
app.patch("/api/suppliers/:source", auth, (req, res) => res.json(suppliers.setAutoPay(req.account.id, suppliers.adapterFor(req.params.source).id, req.body?.auto_pay === true)));
app.delete("/api/suppliers/:source", auth, (req, res) => res.json(suppliers.disconnect(req.account.id, suppliers.adapterFor(req.params.source).id)));
app.post("/api/suppliers/:source/authorize", auth, (req, res) => res.json({ url: suppliers.authorizeUrl(req.account.id, suppliers.adapterFor(req.params.source).id) }));

// The seller lands here after approving Snapfront on AliExpress.
app.get("/suppliers/:source/callback", wrap(async (req, res) => {
  const page = (title, body) => notePage({ store_slug: "", store_name: "Snapfront", tagline: "" }, title,
    `${body}<p><a class="buy" href="snapfront://settings">Back to Snapfront</a></p>`);
  if (req.query.error || !req.query.code) return res.status(400).send(page("Not connected", "<h1>Not connected</h1><p>AliExpress didn't approve the connection. Go back to Snapfront and tap Authorize again.</p>"));
  try {
    const s = await suppliers.finishAuthorization(req.query.state, req.query.code);
    dropship.resendWaiting(s.accountId, s.supplier);
    res.send(page("Connected", "<h1>AliExpress is connected</h1><p>Go back to Snapfront. You can now add AliExpress products, and orders for them go to your AliExpress account.</p>"));
  } catch (e) {
    console.error("[aliexpress] authorize", e.message);
    res.status(e.status || 500).send(page("Not connected", `<h1>Not connected</h1><p>${esc(e.message)}</p>`));
  }
}));

app.get("/api/product-types", (_req, res) => res.json(Object.entries(PRODUCT_TYPES).map(([id, t]) => ({ id, name: t.name, sub: t.sub, price: t.price }))));

/* ---------- Fable store agent ---------- */
app.post("/api/agent/runs", auth, aiLimit, (req, res) => {
  plans.assertAllowance(req.account, "agent");
  const run = agent.startRun(req.seller, req.body?.messages, req.account);
  plans.recordUsage(req.account, "agent");
  res.status(202).json({ id: run.id, status: run.status });
});
app.get("/api/agent/runs/:id", auth, (req, res) => res.json(agent.getRun(req.seller, req.params.id, Number(req.query.after) || 0)));

/* ---------- separate storefront and digital image studios ---------- */
// Completion deliberately only creates seller-owned media. Applying any result to a storefront
// slot, listing, or editable document remains an explicit client action.
imageAssistant.routes(app, { auth, wrap });

app.post("/api/store-offers", auth, (req,res) => res.status(201).json(storeOffers.saveOffer(req.seller,req.body || {})));
app.put("/api/store-offers/:id", auth, (req,res) => res.json(storeOffers.saveOffer(req.seller,req.body || {},req.params.id)));
app.get("/api/store-subscriptions", auth, (req,res) => res.json(memberships.list(req.seller)));
app.post("/api/storefront/mira", auth, aiLimit, wrap(async (req,res) => {
  res.json(await plans.withAllowance(req.account,"agent",() => miraProposal(req.seller,req.body || {})));
}));
app.get("/membership/manage", wrap(async (req,res) => {
  res.set({"Cache-Control":"no-store","Referrer-Policy":"no-referrer","X-Robots-Tag":"noindex"});
  res.redirect(303,await memberships.portal(req.query.t));
}));
/* ---------- products ---------- */
// The template catalogue is intentionally public so native can browse it before a seller starts a
// draft. Thumbnail files are packaged assets only; the route accepts no filesystem path.
const DIGITAL_DESIGN_ASSETS_V1 = path.resolve(new URL("../assets/digital-designs-v1/", import.meta.url).pathname);
const DIGITAL_DESIGN_ASSETS_V2 = path.resolve(new URL("../assets/digital-designs/", import.meta.url).pathname);
const digitalTemplateIdsV1 = new Set(digitalDesigns.catalog(1).templates.map((template) => template.id));
const digitalTemplateIdsV2 = new Set(digitalDesigns.catalog(2).templates.map((template) => template.id));
app.get("/api/digital-designs", (req, res, next) => {
  const requested = req.query.revision;
  if (requested !== undefined && requested !== "1" && requested !== "2") return next(httpError(400, "revision must be 1 or 2."));
  // Installed native builds did not revision-check their bundled picker thumbnails. Keep an
  // unversioned request honest about those frozen v1 bytes; the revision-2 picker opts in with
  // ?revision=2. digitalDesigns.catalog() itself remains premium-by-default for new callers.
  res.json(digitalDesigns.catalog(requested === undefined ? 1 : Number(requested)));
});
app.get("/digital-design-assets/v2/:id.png", (req, res) => {
  if (!digitalTemplateIdsV2.has(req.params.id)) return res.status(404).end();
  res.set("Cache-Control", "public, max-age=31536000, immutable");
  res.sendFile(path.join(DIGITAL_DESIGN_ASSETS_V2, `${req.params.id}.png`), (err) => err && !res.headersSent && res.status(404).end());
});
app.get("/digital-design-assets/:id.png", (req, res) => {
  if (!digitalTemplateIdsV1.has(req.params.id)) return res.status(404).end();
  // The bytes are frozen v1 copies, but this unversioned historical path is not a new immutable
  // cache contract. Premium assets alone receive an immutable versioned URL.
  res.set("Cache-Control", "public, max-age=86400");
  res.sendFile(path.join(DIGITAL_DESIGN_ASSETS_V1, `${req.params.id}.png`), (err) => err && !res.headersSent && res.status(404).end());
});
// A signed expiring token is a narrow owner-private export capability. It is not listed by any
// public storefront page and the underlying files never live below a static route.
app.get("/digital-design-exports/:token", (req, res, next) => {
  try {
    const file = digitalDesigns.privateExportFile(req.params.token);
    res.set({ "Cache-Control": "private, no-store", Pragma: "no-cache", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex, nofollow", "X-Content-Type-Options": "nosniff" });
    if (file.kind === "pdf") return res.download(file.path, file.name);
    return res.type("png").sendFile(file.path);
  } catch (error) { next(error); }
});
app.get("/api/digital-ideas", (_req, res) => res.json(digitalIdeas.ideaCatalog));
app.post("/api/digital-ideas/start", auth, (req, res) => res.status(201).json(digitalIdeas.startIdea(req.seller, req.body || {})));
app.get("/api/products/:id/digital-idea", auth, (req, res) => res.json(digitalIdeas.productIdea(req.seller, req.params.id)));
app.post("/api/products/:id/digital-designer", auth, aiLimit, wrap(async (req, res) => {
  res.json(await plans.withAllowance(req.account, "agent", () => digitalIdeas.designerProposal(req.seller, req.params.id, req.body || {})));
}));
app.post("/api/digital-designs/create", auth, wrap(async (req, res) => res.status(201).json(await digitalDesigns.createDraft(req.seller, req.body || {}))));
app.get("/api/products/:id/digital-design", auth, (req, res) => res.json(digitalDesigns.getDesign(req.seller, req.params.id)));
app.put("/api/products/:id/digital-design", auth, wrap(async (req, res) => res.json(await digitalDesigns.saveDesign(req.seller, req.params.id, req.body || {}))));
app.post("/api/products/:id/digital-design/preview", auth, wrap(async (req, res) => res.json(await digitalDesigns.previewDesign(req.seller, req.params.id, req.body || {}))));
app.post("/api/products/:id/digital-design/export", auth, wrap(async (req, res) => res.json(await digitalDesigns.exportDesign(req.seller, req.params.id, req.body || {}))));
app.post("/api/products/:id/digital-design/attach", auth, wrap(async (req, res) => res.json(await digitalDesigns.attachExport(req.seller, req.params.id, req.body || {}))));
app.get("/api/products", auth, (req, res) => res.json(store.listProducts(req.seller)));
app.get("/api/products/:id", auth, (req, res) => res.json(store.withPage(req.seller, store.productRow(req.seller, req.params.id))));
app.post("/api/products", auth, (req, res) => res.status(201).json(store.createProduct(req.seller, req.body || {})));
app.patch("/api/products/:id", auth, (req, res) => res.json(store.updateProduct(req.seller, req.params.id, req.body || {})));
app.delete("/api/products/:id", auth, (req, res) => { store.deleteProduct(req.seller, req.params.id); res.status(204).end(); });
app.post("/api/products/:id/publish", auth, wrap(async (req, res) => res.json(await store.publishProduct(req.seller, req.params.id))));

/* ---------- orders and discount codes ---------- */
app.get("/api/orders", auth, (req, res) => res.json(commerce.listOrders(req.seller)));
// Send to the suppliers (or retry), then refresh tracking.
app.post("/api/orders/:id/supplier", auth, wrap(async (req, res) => {
  const o = db.prepare("SELECT * FROM orders WHERE id = ? AND seller_id = ?").get(String(req.params.id), req.seller.id);
  if (!o) throw httpError(404, "That order doesn't exist.");
  await dropship.refreshOrder(o.id);
  res.json(commerce.publicOrder(db.prepare("SELECT * FROM orders WHERE id = ?").get(o.id)));
}));
app.post("/api/orders/:id/fulfill", auth, (req, res) => res.json(commerce.setOrderStatus(req.seller, req.params.id, "fulfilled")));
app.get("/api/discounts", auth, (req, res) => res.json(commerce.listDiscounts(req.seller)));
app.post("/api/discounts", auth, (req, res) => res.status(201).json(commerce.createDiscount(req.seller, req.body || {})));
app.patch("/api/discounts/:id", auth, (req, res) => res.json(commerce.updateDiscount(req.seller, req.params.id, req.body || {})));
app.delete("/api/discounts/:id", auth, (req, res) => { commerce.deleteDiscount(req.seller, req.params.id); res.status(204).end(); });

/* ---------- Stripe Connect ---------- */
app.post("/api/stripe/onboard", auth, wrap(async (req, res) => {
  // Payments come with a paid plan, so Stripe setup starts after the upgrade.
  if (plans.effectivePlan(req.account) === "free" && !req.seller.stripe_account_id) {
    throw httpError(402, `Get Snapfront Pro (${webbilling.priceLine()}) to take payments, then connect Stripe.`, { upgrade: "pro" });
  }
  const { accountId, url } = await pay.onboardingLink(req.seller);
  // One Stripe account per person: every store on the account gets paid into it.
  db.prepare("UPDATE sellers SET stripe_account_id = ? WHERE id = ? OR (account_id = ? AND stripe_account_id IS NULL)").run(accountId, req.seller.id, req.account.id);
  res.json({ url });
}));
app.get("/api/stripe/status", auth, wrap(async (req, res) => {
  const ready = await pay.accountReady(req.seller.stripe_account_id);
  if (req.seller.stripe_account_id) db.prepare("UPDATE sellers SET stripe_ready = ? WHERE stripe_account_id = ?").run(ready ? 1 : 0, req.seller.stripe_account_id);
  res.json({ connected: Boolean(req.seller.stripe_account_id), ready });
}));
app.post("/api/stripe/dashboard", auth, wrap(async (req, res) => {
  if (!req.seller.stripe_account_id) throw httpError(409, "Connect Stripe first.");
  res.json({ url: await pay.dashboardLink(req.seller.stripe_account_id) });
}));
/* Sales tax setup in the app: Stripe's embedded tax components on a page we host (sellers can also use their Stripe Dashboard). */
app.post("/api/stripe/tax-setup", auth, (req, res) => {
  if (!req.seller.stripe_account_id) throw httpError(409, "Connect Stripe first.");
  if (!config.stripePublishableKey) throw httpError(503, "Tax setup isn't configured. Set STRIPE_PUBLISHABLE_KEY on the server.");
  res.json({ url: `${config.publicUrl}/stripe/tax?t=${pay.taxSetupToken(req.seller.id)}` });
});
app.get("/api/stripe/tax", auth, wrap(async (req, res) => {
  if (!req.seller.stripe_account_id) return res.json({ active: false, missing: [], registrations: [] });
  res.json(await pay.taxStatus(req.seller.stripe_account_id));
}));
const taxSeller = (t) => { const id = pay.readTaxSetupToken(t); return id && db.prepare("SELECT * FROM sellers WHERE id = ?").get(id); };
app.post("/stripe/tax/session", wrap(async (req, res) => {
  const seller = taxSeller(req.body?.t);
  if (!seller?.stripe_account_id) throw httpError(401, "This link has expired. Open tax setup from the app again.");
  res.json({ client_secret: await pay.taxAccountSession(seller.stripe_account_id) });
}));
app.get("/stripe/tax", (req, res) => {
  const seller = taxSeller(req.query.t);
  if (!seller) return res.status(410).send(notePage({ store_slug: "", store_name: "Snapfront", tagline: "" }, "Link expired", "<h1>This link has expired</h1><p>Open Store settings in the Snapfront app and tap Set up sales tax again.</p>"));
  res.send(taxSetupPage(seller, String(req.query.t), config.stripePublishableKey));
});
const stripeDone = (msg) => (_req, res) => res.send(`<!doctype html><meta name=viewport content="width=device-width"><body style="font:18px system-ui;padding:40px;text-align:center"><h1>${msg}</h1><p>You can close this window and return to Snapfront.</p></body>`);
app.get("/stripe/return", stripeDone("Stripe setup saved"));
app.get("/stripe/refresh", stripeDone("That link expired"));

/* ---------- public storefront ---------- */
const THEME_ASSETS = path.resolve(new URL("../assets/themes/", import.meta.url).pathname);
app.get("/theme-assets/:file", (req, res) => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*-(hero|preview)\.webp$/.test(req.params.file)) return res.status(404).end();
  res.set("Cache-Control", "public, max-age=3600");
  res.sendFile(path.join(THEME_ASSETS, req.params.file), (err) => err && !res.headersSent && res.status(404).end());
});
app.get("/themes", (_req, res) => res.set("Cache-Control", "no-cache").send(themeGalleryPage()));
app.get("/theme-demo/:id", (req, res) => {
  const html = themeDemoPage(req.params.id, { category: typeof req.query.c === "string" ? req.query.c.slice(0, 60) : null, motion: req.query.motion });
  if (!html) return res.status(404).send("That theme isn't available.");
  res.set("X-Robots-Tag", "noindex, nofollow").set("Cache-Control", "no-cache").send(html);
});
app.get("/theme-demo/:id/cart", (req, res) => {
  const html = themeDemoCart(req.params.id);
  if (!html) return res.status(404).end();
  res.set("X-Robots-Tag", "noindex, nofollow").send(html);
});
app.get("/theme-demo/:id/:product", (req, res) => {
  const html = themeDemoProduct(req.params.id, req.params.product);
  if (!html) return res.status(404).end();
  res.set("X-Robots-Tag", "noindex, nofollow").send(html);
});
app.get("/img/:file", (req, res) => {
  if (!/^[\w-]+\.(jpg|png|webp|gif)$/.test(req.params.file)) return res.status(404).end();
  res.set("Cache-Control", "public, max-age=31536000, immutable");
  res.sendFile(path.join(dirs.images, req.params.file), (err) => err && !res.headersSent && res.status(404).end());
});
// QR codes for our own store addresses only (used by the app to show and save them).
app.get("/qr.png", wrap(async (req, res) => {
  let u;
  try { u = new URL(String(req.query.url || "")); } catch { return res.status(400).end(); }
  const ours = u.protocol === "https:" && ((config.storeDomain && (u.hostname === config.storeDomain || u.hostname.endsWith(`.${config.storeDomain}`))) || urls.sellerForDomain(u.hostname));
  if (!ours) return res.status(400).end();
  res.type("png").set("Cache-Control", "public, max-age=86400").send(await growth.qrPng(u.href));
}));
app.get("/media/:file", (req, res) => {
  if (!/^[\w-]+\.(jpg|png|mp4|wav)$/.test(req.params.file)) return res.status(404).end();
  res.set("Cache-Control", "public, max-age=31536000, immutable");
  if (req.query.download) res.attachment(req.params.file);
  res.sendFile(path.join(dirs.media, req.params.file), (err) => err && !res.headersSent && res.status(404).end());
});
const storeBySlug = (slug) => db.prepare("SELECT * FROM sellers WHERE store_slug = ?").get(slug);
/** Links inside a store page start at "" on its own address and at /s/<slug> anywhere else. */
const view = (req, store) => ({ ...store, _base: req.storeHost === store.store_slug ? "" : `/s/${store.store_slug}`,
  // ?theme=<id> previews another look (the app's theme picker); it never changes what buyers see.
  _theme: THEME_IDS.has(req.query.theme) && req.query.theme !== store.theme ? req.query.theme : undefined });
const noStore = (res) => res.status(404).send(notePage({ store_slug: "", store_name: "Snapfront", tagline: "", _base: "" }, "Store not found",
  `<h1>There’s no store here</h1><p>Check the address, or <a href="https://${esc(config.storeDomain || new URL(config.publicUrl).host)}">make your own with Snapfront</a>.</p>`));

// Page views of a store: send old addresses (and /s/<slug> links once stores have their own address) to the current one.
app.get(["/s/:store", "/s/:store/*rest"], (req, res, next) => {
  const store = storeBySlug(req.params.store);
  const rest = req.params.rest ? `/${[].concat(req.params.rest).join("/")}` : "";
  const qs = req.originalUrl.includes("?") ? req.originalUrl.slice(req.originalUrl.indexOf("?")) : "";
  if (!store) {
    const moved = urls.redirectFor(req.params.store);
    return moved ? res.redirect(301, urls.storeUrl(moved.store_slug, rest) + qs) : noStore(res);
  }
  // One address per store: its own domain when it has one, else <slug>.snapfront.app.
  const here = req.customHost || (req.storeHost === store.store_slug ? `${store.store_slug}.${config.storeDomain}` : null);
  if (config.storeDomain && here !== new URL(urls.storeUrl(store.store_slug)).host) return res.redirect(301, urls.storeUrl(store.store_slug, rest) + qs);
  next();
});
app.get("/s/:store", (req, res) => {
  const store = storeBySlug(req.params.store);
  const rows = db.prepare("SELECT * FROM products WHERE seller_id = ? AND status = 'live' ORDER BY created_at DESC").all(store.id);
  growth.recordVisit(req, store, "");
  affiliates.recordClick(req, store);
  res.send(storePage(view(req, store), rows.map(rowToProduct), config.publicUrl, { category: typeof req.query.c === "string" ? req.query.c.slice(0, 60) : null }));
});
app.get("/s/:store/cart", (req, res) => {
  const store = storeBySlug(req.params.store);
  res.send(cartPage({ ...view(req, store), _hasSubscriptions: Boolean(db.prepare("SELECT 1 FROM products WHERE seller_id=? AND billing_interval IS NOT NULL LIMIT 1").get(store.id)) }, config.publicUrl));
});
// Buyers' carts live in their browser; the server prices them from the database every time.
const buyerHits = new Map();
function buyerLimit(req, _res, next) {
  const now = Date.now(), key = req.ip, list = (buyerHits.get(key) || []).filter((t) => now - t < 60_000);
  if (list.length >= 30) return next(httpError(429, "Too many tries. Wait a minute and try again."));
  list.push(now); buyerHits.set(key, list);
  if (buyerHits.size > 5000) buyerHits.clear();
  next();
}
app.post("/s/:store/cart/quote", buyerLimit, (req, res) => {
  const store = storeBySlug(req.params.store);
  if (!store) throw httpError(404, "Store not found");
  res.json(commerce.quote(store, req.body?.items, req.body?.code));
});
app.post("/s/:store/checkout", buyerLimit, wrap(async (req, res) => {
  const store = storeBySlug(req.params.store);
  if (!store) throw httpError(404, "Store not found");
  res.json(await commerce.startCheckout(store, req.body?.items, req.body?.code, req.body?.ref));
}));
app.get("/s/:store/feeds/:file", (req, res) => {
  const store = storeBySlug(req.params.store);
  if (req.params.file === "google.xml") return res.type("application/xml").set("Cache-Control", "public, max-age=900").send(growth.googleFeed(store));
  if (req.params.file === "meta.csv") return res.type("text/csv").set("Cache-Control", "public, max-age=900").send(growth.metaFeed(store));
  res.status(404).end();
});
app.get("/s/:store/links", (req, res) => {
  const store = storeBySlug(req.params.store);
  growth.recordVisit(req, store, "");
  affiliates.recordClick(req, store);
  const rows = db.prepare("SELECT * FROM products WHERE seller_id = ? AND status = 'live' ORDER BY created_at DESC LIMIT 4").all(store.id);
  res.send(linksPage(view(req, store), rows.map(rowToProduct), growth.linksOf(store), partners.bioCard(store)));
});
app.get("/s/:store/review", (req, res) => {
  const store = storeBySlug(req.params.store);
  let order;
  try { order = growth.orderForReview(req.query.t); } catch (e) { return res.status(404).send(notePage(view(req, store), "Review", `<h1>${esc(e.message)}</h1>`)); }
  if (order.seller_id !== store.id) return res.status(404).send(notePage(view(req, store), "Review", "<h1>That review link isn't valid.</h1>"));
  res.send(reviewPage(view(req, store), String(req.query.t), growth.reviewable(order), req.query.done === "1"));
});
app.post("/s/:store/review", buyerLimit, express.urlencoded({ extended: false, limit: "20kb" }), (req, res) => {
  const store = storeBySlug(req.params.store);
  if (!store) throw httpError(404, "Store not found");
  const order = growth.orderForReview(req.body?.t);
  if (order.seller_id !== store.id) throw httpError(404, "That review link isn't valid.");
  growth.addReview(order, req.body || {});
  res.redirect(303, `${view(req, store)._base}/review?t=${encodeURIComponent(req.body.t)}&done=1`);
});
// Email sign-up box on the storefront.
const subscribeHits = new Map();
app.post("/s/:store/subscribe", buyerLimit, (req, res) => {
  const store = storeBySlug(req.params.store);
  if (!store) throw httpError(404, "Store not found");
  const now = Date.now(), list = (subscribeHits.get(req.ip) || []).filter((t) => now - t < 3600e3);
  if (list.length >= 10) throw httpError(429, "Too many sign-ups from this network. Try again later.");
  list.push(now); subscribeHits.set(req.ip, list);
  if (subscribeHits.size > 20000) subscribeHits.clear();
  res.json(audience.signupFromStore(store, req.body || {}));
});
// A creator's UGC portfolio page.
app.get("/s/:store/ugc", (req, res) => {
  const store = storeBySlug(req.params.store);
  const page = ugc.publicPage(store);
  if (!page) return res.status(404).send(notePage(view(req, store), "UGC", `<h1>This page isn't published yet</h1><p><a href="${esc(view(req, store)._base || "/")}">Shop ${esc(store.store_name)}</a></p>`));
  res.send(ugcPage(view(req, store), page));
});
// Affiliate program: the public join page and each affiliate's own stats page.
app.get("/s/:store/affiliates", (req, res) => {
  const store = storeBySlug(req.params.store);
  if (!affiliates.programLive(store)) return res.status(404).send(notePage(view(req, store), "Affiliates", `<h1>No affiliate program here</h1><p><a href="${esc(view(req, store)._base || "/")}">Shop ${esc(store.store_name)}</a></p>`));
  res.send(affiliateJoinPage(view(req, store), { rate: store.aff_rate, blurb: store.aff_blurb }));
});
app.post("/s/:store/affiliates", buyerLimit, express.urlencoded({ extended: false, limit: "8kb" }), wrap(async (req, res) => {
  const store = storeBySlug(req.params.store);
  if (!store) throw httpError(404, "Store not found");
  try {
    const r = await affiliates.join(store, req.body || {});
    res.send(affiliateJoinPage(view(req, store), { state: r.status, rate: store.aff_rate, blurb: store.aff_blurb }));
  } catch (e) {
    if (e.status === 404) throw e;
    res.status(e.status || 400).send(affiliateJoinPage(view(req, store), { error: e.message, rate: store.aff_rate, blurb: store.aff_blurb }));
  }
}));
app.get("/s/:store/affiliate", (req, res) => {
  const store = storeBySlug(req.params.store);
  const a = affiliates.portal(store, req.query.t);
  res.set("Cache-Control", "no-store").set("X-Robots-Tag", "noindex").set("Referrer-Policy", "no-referrer");
  if (!a) return res.status(404).send(notePage(view(req, store), "Affiliate", "<h1>This affiliate link isn't valid</h1><p>Use the link in your welcome email.</p>"));
  res.send(affiliatePortalPage(view(req, store), a));
});
app.get("/s/:store/:product", (req, res) => {
  const store = storeBySlug(req.params.store);
  const row = store && db.prepare("SELECT * FROM products WHERE seller_id = ? AND slug = ?").get(store.id, req.params.product);
  if (!row || (row.status !== "live" && req.query.preview !== "1")) return res.status(404).send(notePage(view(req, store), "Not found", `<h1>That product isn’t here</h1><p><a href="${esc(view(req, store)._base || "/")}">See everything in ${esc(store.store_name)}</a></p>`));
  const others = db.prepare("SELECT * FROM products WHERE seller_id = ? AND status = 'live' AND id != ? ORDER BY created_at DESC LIMIT 24").all(store.id, row.id).map(rowToProduct);
  growth.recordVisit(req, store, row.id);
  affiliates.recordClick(req, store);
  res.send(productPage(view(req, store), rowToProduct(row), config.publicUrl, others));
});
app.get("/thanks", wrap(async (req, res) => {
  let order = db.prepare("SELECT * FROM orders WHERE id = ?").get(String(req.query.o || ""));
  if (!order) return res.status(404).send("Order not found");
  const store = db.prepare("SELECT * FROM sellers WHERE id = ?").get(order.seller_id);
  // The webhook can arrive after the buyer lands here, so check Stripe directly while the order is pending.
  if (order.status === "pending" && order.checkout_session_id && store.stripe_account_id) {
    const session = await pay.getSession(store.stripe_account_id, order.checkout_session_id)
      .catch((e) => { console.error("[thanks] could not read checkout session", order.id, e.type, e.message); return null; });
    if (session && session.payment_status !== "paid") console.log("[thanks] session not paid yet", order.id, session.status, session.payment_status);
    if (session?.payment_status === "paid") order = await completeOrder(order.id, session);
  }
  await memberships.refreshOrder(order);
  res.set({"Cache-Control":"no-store","Referrer-Policy":"no-referrer","X-Robots-Tag":"noindex"});
  res.send(orderPage(view(req, store), { ...commerce.publicOrder(order), _reviewToken: ["paid", "fulfilled"].includes(order.status) ? growth.reviewToken(order.id) : null }, commerce.downloadsFor(order)));
}));
app.get("/d/:token", wrap(async (req, res) => {
  const t = pay.readDownloadToken(req.params.token);
  if (!t?.p) return res.status(410).send("This download link has expired. Open your order confirmation page for a fresh one.");
  const order = db.prepare("SELECT * FROM orders WHERE id=?").get(t.s);
  if (order) await memberships.refreshOrder(order);
  const delivery = commerce.downloadFor(t.s, t.p);
  if (!delivery) return res.status(410).send("This download is no longer available. Open your order confirmation page for a fresh link.");
  if (delivery.delivery_url) return res.redirect(delivery.delivery_url);
  if (!delivery.delivery_file || !/^[\w-]+\.pdf$/.test(delivery.delivery_file)) return res.status(404).send("The seller hasn't attached a file yet.");
  res.download(path.join(dirs.files, delivery.delivery_file), /^[\w.-]+$/.test(delivery.filename) ? delivery.filename : "download.pdf");
}));

/* ---------- legal pages the app stores require (edit before launch) ---------- */
const legal = (title, body) => (_req, res) => res.send(`<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>${title} · Snapfront</title>
<body style="font:16px/1.6 system-ui;max-width:720px;margin:0 auto;padding:32px 16px;color:#16152E"><h1>${title}</h1>${body}<p style="color:#5D5F78">Last updated ${new Date().toISOString().slice(0, 10)}</p></body>`);
app.get("/privacy", legal("Privacy policy", `
<p>Snapfront lets you build an online store from photos and sell through your own Stripe account. This policy explains what we collect and who we share it with.</p>
<h2>What we collect from sellers</h2><ul>
<li>Store details you enter: store name, tagline, about text, links, product text, prices and settings.</li>
<li>Photos you upload, and pictures and videos you make in the app (photo studio, posts, AI photos and clips).</li>
<li>A random device token that signs you in. If you choose to sign in with email, your email address.</li>
<li>Your plan and purchase status from Google Play or the App Store. We never see your card.</li>
<li>If you connect a supplier (CJdropshipping, AliExpress or Printful), the key or sign-in token for that account, stored encrypted, so we can place orders there for you.</li></ul>
<h2>Optional Meta publishing</h2><p>If you choose to connect Facebook or Instagram, Snapfront receives the access tokens, Page and professional Instagram identifiers, and display names Meta returns for your selected destinations. Tokens are encrypted at rest and are not shown in the app. We use them only to show your connected destinations and carry out a post that you have reviewed and explicitly approved.</p>
<p>For an approved publish or schedule request, we keep the selected destination, exact approved caption, owned media-file snapshot, requested schedule, processing status and any returned post identifier or permalink. We send the caption and media URL to Meta only when the queue reaches that seller-approved destination. Generating a graphic or caption alone does not publish it.</p>
<h2>Optional image tools</h2><p>When you create a Storefront Photo Agent or Digital Photo Studio image, we keep your prompt, chosen source-file reference, store photo spot or digital product, requested shape, processing status, returned image and allowance record so you can resume the same request. Source pictures and prompts are sent to Runpod only for an image request you start. A completed image is not inserted into your storefront or digital pages automatically; you review and choose whether to use it. Digital presentation frames use your real cover on our server without an AI image-generation request. Refreshing a storefront preview does not generate an image.</p>
<h2>What we collect about your buyers</h2><ul>
<li>Order records: what was bought, amounts, and the buyer's name, email, shipping address and phone number, so digital downloads can be delivered and physical orders shipped.</li>
<li>Reviews buyers choose to leave: their name, star rating and comment.</li>
<li>Store visit counts for your insights. We count visits with a code that changes every day and don't store visitors' IP addresses or build profiles of them.</li></ul>
<p>Card details are entered on Stripe's checkout page and never reach Snapfront.</p>
<h2>How we use it</h2><p>To write your product pages and marketing posts, edit your photos, host your storefront, take payments, send order and review emails, and fulfil dropshipped orders. We don't sell data or use it for advertising.</p>
<h2>Who we share it with</h2><ul>
<li>Anthropic (Claude): photos and text, to write product pages, posts and answers.</li>
<li>Runpod: prompts and selected source pictures, when you choose to make or edit storefront or digital artwork, lifestyle photos or video clips.</li>
<li>Stripe: payments, seller identity checks and sales tax.</li>
<li>Google Play and the App Store: plan purchases.</li>
<li>Resend: sending sign-in codes, order confirmations, review requests and checkout reminders.</li>
<li>ElevenLabs: when you talk or type to Vierra, the voice guide on our website, your voice and messages go to ElevenLabs to understand you and to make her replies. Recordings of your voice aren't kept, and conversation transcripts are deleted after 30 days.</li>
<li>CJdropshipping, AliExpress and Printful: the buyer's name, address and phone number for orders of their products.</li>
<li>SerpApi (Google Lens): product photos, to compare prices at other stores.</li>
<li>Cloudflare and Railway: hosting, including stores on their own domains.</li>
<li>Meta: the seller-approved caption and owned media URL needed to publish to the Page or Instagram account the seller selected.</li></ul>
<h2>Deleting your data</h2><p>You can disconnect a Meta destination in Marketing at any time. This removes its stored token and its associated queued and publishing history from Snapfront; it does not delete content already published by Meta. Meta's signed deauthorization and data-deletion requests remove matching connected tokens and related social request snapshots. In the app, open Settings and tap "Delete my account". This removes your account, every store, product and photo from our servers. Order records your buyers need (for example, download links) are removed with the store. You can also email us to ask for deletion.</p>
<h2>Children</h2><p>Snapfront is for adults running a business and isn't meant for children under 13.</p>
<h2>Contact</h2><p><a href="mailto:support@snapfront.app">support@snapfront.app</a></p>`));
app.get("/terms", legal("Terms of use", `
<p>By using Snapfront you agree to sell only products you have the right to sell, to describe them honestly, and to follow Stripe's terms and restricted-business list. You're responsible for fulfilling orders, taxes and refunds. Snapfront may remove listings that break these rules. Snapfront doesn't take a fee on your sales; Stripe's own processing fees apply.</p>
<h2>Plans and payments</h2><p>Snapfront Lifetime is a one-time payment, offered to the first 500 members. Snapfront Monthly renews every month and Snapfront Yearly every year until you cancel, and you keep it until the end of the period you've paid for. Memberships are bought on snapfront.app (through Stripe); the Snapfront Android app is included free for members, who sign in with the same email. Plans bought earlier through Google Play keep working and are managed in Google Play. <strong>All sales are final: Snapfront plans are non-refundable</strong>, except where the law requires otherwise or where Google Play's own refund policy applies to a Google Play purchase.</p>
<h2>Snapfront Partners</h2><p>Partners earn 40% of every membership payment from customers they refer (a Lifetime purchase, and every paid month of Monthly or year of Yearly), under the rules shown in Earn with Snapfront. Commissions are paid after Snapfront receives the payment. Partners must disclose that they earn a commission, may not make income claims, and may not earn on their own purchases. Snapfront may withhold commissions earned against these rules, on fraudulent or charged-back sales, and may change the program with notice.</p>
<h2>Contact</h2><p><a href="mailto:support@snapfront.app">support@snapfront.app</a></p>`));

/* ---------- research list shown in the app's "What's selling" tab ---------- */
app.get("/api/trends", (_req, res) => res.json(store.TRENDS));

/* ---------- errors ---------- */
app.use((err, req, res, _next) => {
  const status = err.status || err.statusCode || (err.type === "StripeInvalidRequestError" ? 400 : 500);
  if (status >= 500) console.error(err);
  let message = status >= 500 && !err.status ? "Something went wrong on our side. Try again." : err.message;
  // Memberships are sold on the website only: the phone app's "needs Pro" messages name no prices.
  if (status === 402 && req.get("x-snapfront-app")) message = plans.appWording(message);
  res.status(status).json({ error: message, ...(err.extra || {}) });
});

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  app.listen(config.port, () => console.log(`Snapfront API on ${config.publicUrl} (port ${config.port})${config.standby ? ", as the backup copy" : ""}`));
  if (config.standby) backup.startStandbyWorker();
  else startBackgroundWork();
}

/** Everything the live server does on its own: queues, sweeps, syncs. Never on a backup copy. */
function startBackgroundWork() {
  // The durable SQLite queue is deliberately started only by the real server process, never by
  // imported test apps. Disabled or incomplete Meta configuration starts no worker at all.
  if (social.startWorker()) console.log("[meta] seller publishing worker started");
  // Bring Vierra's knowledge up to date with this deploy (quietly; visitors' sessions retry it too).
  if (vierra.enabled()) setTimeout(() => vierra.syncAgent().then((id) => console.log("[vierra] agent ready", id)).catch((e) => console.warn("[vierra] sync", e.message)), 10_000);
  if (imageAssistant.startWorker()) console.log("[image-assistant] durable image worker started");
  // AI video and lifestyle photos: check the Runpod key, then collect finished jobs.
  if (aimedia.enabled()) {
    aimedia.check().then((st) => console.log(`[runpod] key ${st === 200 ? "ok" : `check returned ${st}`}`)).catch((e) => console.error("[runpod] check", e.message));
    setInterval(() => aimedia.poll().catch((e) => console.error("[runpod] poll", e.message)), 8_000).unref();
    setInterval(() => avatars.poll().catch((e) => console.error("[avatars] poll", e.message)), 8_000).unref();
    setInterval(() => avatarVideos.poll().catch((e) => console.error("[avatar-videos] poll", e.message)), 10_000).unref();
    avatarVideos.kick();
  }
  // Email broadcasts and automatic emails go out from a queue.
  audience.startWorker();
  // Faceless videos are made one at a time in the background.
  faceless.startWorker();
  // Academy lesson videos: make any that are missing (open-source voice; a few minutes each).
  if (String(process.env.ACADEMY_AUTOBUILD || "true") !== "false") setTimeout(() => academy.buildMissing().catch((e) => console.error("[academy]", e.message)), 90e3).unref();
  // Ask buyers for reviews a few days after they buy.
  setInterval(() => growth.sendReviewRequests().catch((e) => console.error("[reviews] email", e.message)), 60 * 60e3).unref();
  // Photo studio: fetch the cut-out model in the background so the first seller doesn't wait for it.
  ensureCutoutModel().catch((e) => console.error("[cutout] model", e.message));
  // Google Play subscriptions: notice renewals, cancellations and refunds.
  setInterval(() => playbilling.sweep().catch((e) => console.error("[play] sweep", e.message)), 30 * 60e3).unref();
  // Sales & profit: Stripe fees and refunds for each order.
  setInterval(() => business.syncDue().catch((e) => console.error("[business] sync", e.message)), 20 * 60e3).unref();
  // Snapfront Partners: release commissions after the refund window and pay them.
  setInterval(() => partners.sweep().catch((e) => console.error("[partners] sweep", e.message)), 6 * 3600e3).unref();
  // Website plans (Stripe): notice renewals, cancellations and refunds.
  setInterval(() => webbilling.sweep().catch((e) => console.error("[webbilling] sweep", e.message)), 30 * 60e3).unref();
  setInterval(() => credits.sweep().catch((e) => console.error("[credits] sweep", e.message)), 10 * 60e3).unref();
  setInterval(() => youtube.sweep().catch((e) => console.error("[youtube] sweep", e.message)), 30 * 60e3).unref();
  setTimeout(() => reconcileStripe().catch((e) => console.error("[reconcile]", e.message)), 45e3).unref();
  setInterval(() => reconcileStripe().catch((e) => console.error("[reconcile]", e.message)), 15 * 60e3).unref();
  setInterval(() => feed.emailDigests().catch((e) => console.error("[community email]", e.message)), 10 * 60e3).unref();
  // Create the Lifetime and Pro products in Play (retries hourly until Google allows it).
  const products = () => playbilling.ensureProducts().catch((e) => console.error("[play] products", e.message));
  setTimeout(products, 15e3).unref();
  setInterval(products, 60 * 60e3).unref();
  // Pick up tracking numbers for orders at CJ.
  setInterval(() => dropship.syncDue().catch((e) => console.error("[supplier] sync", e.message)), 30 * 60e3).unref();
  // Sellers' own domains: set up Cloudflare once, then switch domains on as their DNS goes live.
  if (domains.enabled()) {
    domains.ensureEdge().catch(async (e) => {
      console.error("[domains] setup", e.message);
      const access = await domains.checkAccess().catch((x) => ({ zone: x.message }));
      console.error("[domains] token access", JSON.stringify(access));
    });
    setInterval(() => domains.refreshPending().catch((e) => console.error("[domains] refresh", e.message)), 10 * 60e3).unref();
  }
}

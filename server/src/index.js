import express from "express";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { config, dirs } from "./config.js";
import { db, newId, hashToken, slugify, uniqueSlug, rowToProduct } from "./db.js";
import { productFromPhoto, httpError, PRODUCT_TYPES, sniffImage } from "./claude.js";
import { writeFileSafe } from "./artwork.js";
import * as store from "./store.js";
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
import { THEME_IDS, publicThemes } from "./themes.js";
import * as studio from "./studio.js";
import { ensureModel as ensureCutoutModel } from "./cutout.js";
import * as supplierDirectory from "./supplier-directory.js";
import * as marketing from "./marketing.js";
import * as aimedia from "./aimedia.js";
import * as growth from "./growth.js";
import * as playbilling from "./playbilling.js";
import { storePage, productPage, cartPage, orderPage, notePage, taxSetupPage, linksPage, reviewPage, esc } from "./render.js";

export const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

/* ---------- store addresses: <slug>.snapfront.app serves that store's pages at its root ---------- */
const SHARED_PATHS = /^\/(api|img|d|thanks|stripe|suppliers|health|privacy|terms|builds)(\/|$)/;
const sameSecret = (a, b) => { const x = Buffer.from(String(a || "")), y = Buffer.from(String(b || "")); return x.length === y.length && crypto.timingSafeEqual(x, y); };
app.use((req, res, next) => {
  if (!config.storeDomain) return next();
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
    // Only the checkout session we opened for an order can change it: a session with a copied
    // order id in its metadata (from any other Stripe account) is ignored.
    let orderId = obj.object === "checkout.session" ? obj.metadata?.snapfront_order : null;
    if (orderId) {
      const o = db.prepare("SELECT checkout_session_id FROM orders WHERE id = ?").get(String(orderId));
      if (!o || o.checkout_session_id !== obj.id) { console.warn("[webhook] session doesn't match order", orderId, obj.id); orderId = null; }
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
  } catch (e) { console.error("[webhook]", e); }
  res.json({ received: true });
});

app.use(express.json({ limit: "12mb" }));

/* ---------- helpers ---------- */
/** Mark an order paid (once) and send the confirmation email. Safe to call from both the webhook and /thanks. */
async function completeOrder(orderId, session) {
  const before = db.prepare("SELECT status FROM orders WHERE id = ?").get(orderId);
  const order = commerce.finalizeOrder(orderId, session);
  if (order && before?.status === "pending" && order.status === "paid") {
    const seller = db.prepare("SELECT * FROM sellers WHERE id = ?").get(order.seller_id);
    await pay.emailOrder(order.email, {
      storeName: seller.store_name, orderUrl: `${urls.storeOrigin(seller.store_slug)}/thanks?o=${order.id}`, downloads: commerce.downloadsFor(order),
    }).catch(() => false);
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
  const seller = (wanted && stores.find((s) => s.id === wanted)) || stores[0];
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
function saveImage(base64, mediaType) {
  const buf = Buffer.from(String(base64 || ""), "base64");
  const ext = IMAGE_TYPES[sniffImage(buf) || mediaType];
  if (!ext) throw httpError(400, "Use a JPG, PNG, WebP or GIF photo.");
  if (buf.length < 100) throw httpError(400, "The photo didn't come through. Try again.");
  if (buf.length > 8 * 1024 * 1024) throw httpError(413, "That photo is over 8 MB. Choose a smaller one.");
  return writeFileSafe(dirs.images, `${crypto.randomUUID()}.${ext}`, buf);
}

const clampStr = store.clampStr, strList = store.strList, faqList = store.faqList;

/* ---------- account ---------- */
app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/", (_req, res) => res.send(landingPage()));

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
// Storefront cover photo: the big picture at the top of the store.
app.put("/api/me/banner", auth, (req, res) => {
  const file = saveImage(req.body?.imageBase64, req.body?.mediaType || "image/jpeg");
  const old = req.seller.banner_file;
  db.prepare("UPDATE sellers SET banner_file = ? WHERE id = ?").run(file, req.seller.id);
  if (old) fs.rm(path.join(dirs.images, old), { force: true }, () => {});
  res.json(me(req));
});
app.delete("/api/me/banner", auth, (req, res) => {
  if (req.seller.banner_file) fs.rm(path.join(dirs.images, req.seller.banner_file), { force: true }, () => {});
  db.prepare("UPDATE sellers SET banner_file = NULL WHERE id = ?").run(req.seller.id);
  res.json(me(req));
});
// Free directory of places to source products (everyone, no sign-in).
app.get("/api/sources", (_req, res) => res.json(supplierDirectory.directory()));
app.get("/api/themes", (req, res) => res.json({ themes: publicThemes() }));
app.get("/api/me", auth, (req, res) => res.json(me(req)));
app.patch("/api/me", auth, wrap(async (req, res) => { await store.updateStoreChecked(req.seller, req.body || {}); res.json(me(req)); }));

/** Things kept per store outside the cascading tables: visit counts and AI photos/clips. */
function purgeStores(sellerIds) {
  for (const id of sellerIds) {
    for (const j of db.prepare("SELECT result FROM media_jobs WHERE seller_id = ? AND result IS NOT NULL").all(id)) {
      try {
        const r = JSON.parse(j.result);
        if (r.file && /^[\w-]+\.\w+$/.test(r.file)) fs.rm(path.join(dirs.media, r.file), { force: true }, () => {});
        if (r.image_file && /^[\w-]+\.\w+$/.test(r.image_file)) fs.rm(path.join(dirs.images, r.image_file), { force: true }, () => {});
      } catch { /* unreadable result: nothing to remove */ }
    }
    db.prepare("DELETE FROM media_jobs WHERE seller_id = ?").run(id);
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
<p class=muted>Didn't sign in with an email, or can't open the app? Email <a href="mailto:torrey@troosec.com">torrey@troosec.com</a> with your store's web address and we'll delete it within 7 days.</p>`;
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
<p>To have anything else deleted, such as your email address or a buyer's order details, email <a href="mailto:torrey@troosec.com">torrey@troosec.com</a> from the address on your account, or with your store's web address, and say what to delete. We do it within 7 days and reply when it's done.</p>
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
// The app bought a plan (or is restoring one): check it with Google Play and unlock it.
app.post("/api/billing/google", auth, wrap(async (req, res) => {
  await playbilling.recordPurchase(req.account, { productId: req.body?.product_id, purchaseToken: req.body?.purchase_token });
  req.account = plans.getAccount(req.account.id);
  res.json(me(req));
}));

/* ---------- email sign-in, so purchases and stores follow the person to a new phone ---------- */
app.post("/api/auth/email/start", auth, wrap(async (req, res) => res.json(await auth2.startEmailLogin(req.account, req.body?.email))));
app.post("/api/auth/email/verify", auth, (req, res) => res.json(auth2.verifyEmailLogin(req.account, req.body?.email, req.body?.code)));

/* ---------- AI ---------- */
app.post("/api/ai/product-from-photo", auth, aiLimit, wrap(async (req, res) => {
  const { imageBase64, mediaType = "image/jpeg", kind = "physical", hint, price, tone } = req.body || {};
  plans.assertAllowance(req.account, "photo");
  const image_file = saveImage(imageBase64, mediaType);
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
  const source = imageBase64 ? saveImage(imageBase64, mediaType) : image_file;
  studio.sourcePath(source);
  const { file, notice } = await plans.withAllowance(req.account, "studio", () => studio.restyle(source, style));
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
  res.json(await marketing.renderPost(req.seller, ownProduct(req, b.product_id), { kind: b.kind, template: b.template, format: b.format, copy: b.copy, offer: b.offer, image_url: b.image_url }));
}));
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
  if (imageBase64) url = `${config.publicUrl}/img/${saveImage(imageBase64, mediaType)}`;
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

/* ---------- products ---------- */
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
    throw httpError(402, "Get Launch ($29, one time) to take payments, then connect Stripe.", { upgrade: "launch" });
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
  if (!/^[\w-]+\.(jpg|png|mp4)$/.test(req.params.file)) return res.status(404).end();
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
  res.send(storePage(view(req, store), rows.map(rowToProduct), config.publicUrl, { category: typeof req.query.c === "string" ? req.query.c.slice(0, 60) : null }));
});
app.get("/s/:store/cart", (req, res) => {
  const store = storeBySlug(req.params.store);
  res.send(cartPage(view(req, store), config.publicUrl));
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
  res.json(await commerce.startCheckout(store, req.body?.items, req.body?.code));
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
  const rows = db.prepare("SELECT * FROM products WHERE seller_id = ? AND status = 'live' ORDER BY created_at DESC LIMIT 4").all(store.id);
  res.send(linksPage(view(req, store), rows.map(rowToProduct), growth.linksOf(store)));
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
app.get("/s/:store/:product", (req, res) => {
  const store = storeBySlug(req.params.store);
  const row = store && db.prepare("SELECT * FROM products WHERE seller_id = ? AND slug = ?").get(store.id, req.params.product);
  if (!row || (row.status !== "live" && req.query.preview !== "1")) return res.status(404).send(notePage(view(req, store), "Not found", `<h1>That product isn’t here</h1><p><a href="${esc(view(req, store)._base || "/")}">See everything in ${esc(store.store_name)}</a></p>`));
  const others = db.prepare("SELECT * FROM products WHERE seller_id = ? AND status = 'live' AND id != ? ORDER BY created_at DESC LIMIT 24").all(store.id, row.id).map(rowToProduct);
  growth.recordVisit(req, store, row.id);
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
  res.send(orderPage(view(req, store), { ...commerce.publicOrder(order), _reviewToken: ["paid", "fulfilled"].includes(order.status) ? growth.reviewToken(order.id) : null }, commerce.downloadsFor(order)));
}));
app.get("/d/:token", (req, res) => {
  const t = pay.readDownloadToken(req.params.token);
  if (!t?.p) return res.status(410).send("This download link has expired. Open your order confirmation page for a fresh one.");
  const row = db.prepare("SELECT * FROM products WHERE id = ?").get(t.p);
  if (!row) return res.status(404).send("Product not found");
  if (row.delivery_url) return res.redirect(row.delivery_url);
  if (!row.delivery_file) return res.status(404).send("The seller hasn't attached a file yet.");
  res.download(path.join(dirs.files, row.delivery_file), `${row.slug}.pdf`);
});

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
<h2>What we collect about your buyers</h2><ul>
<li>Order records: what was bought, amounts, and the buyer's name, email, shipping address and phone number, so digital downloads can be delivered and physical orders shipped.</li>
<li>Reviews buyers choose to leave: their name, star rating and comment.</li>
<li>Store visit counts for your insights. We count visits with a code that changes every day and don't store visitors' IP addresses or build profiles of them.</li></ul>
<p>Card details are entered on Stripe's checkout page and never reach Snapfront.</p>
<h2>How we use it</h2><p>To write your product pages and marketing posts, edit your photos, host your storefront, take payments, send order and review emails, and fulfil dropshipped orders. We don't sell data or use it for advertising.</p>
<h2>Who we share it with</h2><ul>
<li>Anthropic (Claude): photos and text, to write product pages, posts and answers.</li>
<li>Runpod: product photos, when you make AI lifestyle photos or video clips.</li>
<li>Stripe: payments, seller identity checks and sales tax.</li>
<li>Google Play and the App Store: plan purchases.</li>
<li>Resend: sending sign-in codes, order confirmations, review requests and checkout reminders.</li>
<li>CJdropshipping, AliExpress and Printful: the buyer's name, address and phone number for orders of their products.</li>
<li>SerpApi (Google Lens): product photos, to compare prices at other stores.</li>
<li>Cloudflare and Railway: hosting, including stores on their own domains.</li></ul>
<h2>Deleting your data</h2><p>In the app, open Settings and tap "Delete my account". This removes your account, every store, product and photo from our servers. Order records your buyers need (for example, download links) are removed with the store. You can also email us to ask for deletion.</p>
<h2>Children</h2><p>Snapfront is for adults running a business and isn't meant for children under 13.</p>
<h2>Contact</h2><p><a href="mailto:torrey@troosec.com">torrey@troosec.com</a></p>`));
app.get("/terms", legal("Terms of use", `
<p>By using Snapfront you agree to sell only products you have the right to sell, to describe them honestly, and to follow Stripe's terms and restricted-business list. You're responsible for fulfilling orders, taxes and refunds. Snapfront may remove listings that break these rules. Snapfront doesn't take a fee on your sales; Stripe's own processing fees apply, and paid plans are billed through Google Play or the App Store.</p>
<h2>Contact</h2><p><a href="mailto:torrey@troosec.com">torrey@troosec.com</a></p>`));

/* ---------- research list shown in the app's "What's selling" tab ---------- */
app.get("/api/trends", (_req, res) => res.json(store.TRENDS));

/* ---------- errors ---------- */
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || (err.type === "StripeInvalidRequestError" ? 400 : 500);
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 && !err.status ? "Something went wrong on our side. Try again." : err.message, ...(err.extra || {}) });
});

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  app.listen(config.port, () => console.log(`Snapfront API on ${config.publicUrl} (port ${config.port})`));
  // AI video and lifestyle photos: check the Runpod key, then collect finished jobs.
  if (aimedia.enabled()) {
    aimedia.check().then((st) => console.log(`[runpod] key ${st === 200 ? "ok" : `check returned ${st}`}`)).catch((e) => console.error("[runpod] check", e.message));
    setInterval(() => aimedia.poll().catch((e) => console.error("[runpod] poll", e.message)), 8_000).unref();
  }
  // Ask buyers for reviews a few days after they buy.
  setInterval(() => growth.sendReviewRequests().catch((e) => console.error("[reviews] email", e.message)), 60 * 60e3).unref();
  // Photo studio: fetch the cut-out model in the background so the first seller doesn't wait for it.
  ensureCutoutModel().catch((e) => console.error("[cutout] model", e.message));
  // Google Play subscriptions: notice renewals, cancellations and refunds.
  setInterval(() => playbilling.sweep().catch((e) => console.error("[play] sweep", e.message)), 30 * 60e3).unref();
  // Create the Launch and Pro products in Play (retries hourly until Google allows it).
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

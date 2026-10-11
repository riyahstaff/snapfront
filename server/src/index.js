import express from "express";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { config, dirs } from "./config.js";
import { db, newId, hashToken, slugify, uniqueSlug, rowToProduct } from "./db.js";
import { productFromPhoto, httpError, PRODUCT_TYPES } from "./claude.js";
import { writeFileSafe } from "./artwork.js";
import * as store from "./store.js";
import * as agent from "./agent.js";
import * as pay from "./payments.js";
import * as commerce from "./commerce.js";
import * as plans from "./plans.js";
import * as research from "./research.js";
import * as auth2 from "./auth.js";
import * as cj from "./cj.js";
import * as dropship from "./dropship.js";
import { storePage, productPage, cartPage, orderPage, notePage, taxSetupPage } from "./render.js";

export const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

/* ---------- Stripe webhook needs the raw body, so it is mounted before the JSON parser ---------- */
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  let event;
  try { event = pay.verifyWebhook(req.body, req.get("stripe-signature")); }
  catch (e) { console.error("[webhook] rejected:", e.message); return res.status(400).send(`Webhook error: ${e.message}`); }
  try {
    const obj = event.data.object;
    const orderId = obj.object === "checkout.session" ? obj.metadata?.snapfront_order : null;
    if (orderId && (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded")) {
      await completeOrder(orderId, obj);
    }
    if (orderId && (event.type === "checkout.session.async_payment_failed" || event.type === "checkout.session.expired")) {
      db.prepare("UPDATE orders SET status='canceled' WHERE id=? AND status='pending'").run(orderId);
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
      storeName: seller.store_name, orderUrl: `${config.publicUrl}/thanks?o=${order.id}`, downloads: commerce.downloadsFor(order),
    }).catch(() => false);
    // Dropshipped items go to the supplier straight away.
    dropship.sendOrder(order.id).catch((e) => console.error("[cj] send", order.id, e.message));
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
  const ext = IMAGE_TYPES[mediaType];
  if (!ext) throw httpError(400, "Use a JPG, PNG, WebP or GIF photo.");
  const buf = Buffer.from(String(base64 || ""), "base64");
  if (buf.length < 100) throw httpError(400, "The photo didn't come through. Try again.");
  if (buf.length > 8 * 1024 * 1024) throw httpError(413, "That photo is over 8 MB. Choose a smaller one.");
  return writeFileSafe(dirs.images, `${crypto.randomUUID()}.${ext}`, buf);
}

const clampStr = store.clampStr, strList = store.strList, faqList = store.faqList;

/* ---------- account ---------- */
app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/api/sellers", (req, res) => {
  const { token, account, store: seller } = plans.createAccountWithStore(clampStr(req.body?.store_name || "My Snapfront Store", 80));
  res.status(201).json({ token, seller: store.publicSeller(seller), account: plans.publicAccount(account, seller.id) });
});

const me = (req) => ({ ...store.publicSeller(plans.storesOf(req.account.id).find((s) => s.id === req.seller.id)), account: plans.publicAccount(plans.getAccount(req.account.id), req.seller.id) });
app.get("/api/me", auth, (req, res) => res.json(me(req)));
app.patch("/api/me", auth, wrap(async (req, res) => { await store.updateStoreChecked(req.seller, req.body || {}); res.json(me(req)); }));

const removeFiles = (rows) => { for (const r of rows) for (const [dir, f] of [[dirs.images, r.image_file], [dirs.files, r.delivery_file]]) if (f) fs.rm(path.join(dir, f), { force: true }, () => {}); };
// App Store guideline 5.1.1(v): apps that create accounts must let people delete them in-app.
// This deletes the whole account: every store, product and photo.
app.delete("/api/me", auth, (req, res) => {
  const rows = db.prepare("SELECT p.image_file, p.delivery_file FROM products p JOIN sellers s ON s.id = p.seller_id WHERE s.account_id = ?").all(req.account.id);
  db.prepare("DELETE FROM accounts WHERE id = ?").run(req.account.id);
  removeFiles(rows);
  res.status(204).end();
});

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
  db.prepare("DELETE FROM sellers WHERE id = ?").run(target.id);
  removeFiles(rows);
  res.status(204).end();
});

/* ---------- plans and purchases ---------- */
app.get("/api/plans", (_req, res) => res.json(plans.PLANS));
// The app calls this right after a purchase or restore; the webhook below catches renewals and expiries.
app.post("/api/billing/sync", auth, wrap(async (req, res) => {
  req.account = await plans.syncPlan(req.account);
  res.json(me(req));
}));
app.post("/api/revenuecat/webhook", wrap(async (req, res) => {
  if (!config.revenuecatWebhookAuth || req.get("authorization") !== config.revenuecatWebhookAuth) throw httpError(401, "Unauthorized");
  for (const id of plans.accountIdsInEvent(req.body?.event)) await plans.syncPlan(plans.getAccount(id)).catch((e) => console.error("[revenuecat]", id, e.message));
  res.json({ received: true });
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

/* ---------- dropshipping: CJdropshipping catalog and the seller's CJ account ---------- */
app.get("/api/catalog/search", auth, wrap(async (req, res) => res.json(await cj.search({ q: req.query.q, page: req.query.page, categoryId: req.query.category }))));
app.get("/api/catalog/products/:pid", auth, wrap(async (req, res) => res.json(await dropship.preview(req.params.pid))));
app.post("/api/catalog/products/:pid/import", auth, aiLimit, wrap(async (req, res) => {
  const b = req.body || {};
  const out = await dropship.importProduct(req.account, req.seller, req.params.pid, {
    price: b.price, vids: Array.isArray(b.vids) ? b.vids.map(String).slice(0, 100) : undefined, priceCheck: b.price_check !== false,
  });
  res.status(201).json(out);
}));
app.get("/api/suppliers", auth, (req, res) => res.json(dropship.supplierStatus(req.account)));
app.put("/api/suppliers/cj", auth, wrap(async (req, res) => res.json(await dropship.connect(req.account, req.body?.api_key, req.body?.auto_pay === true))));
app.patch("/api/suppliers/cj", auth, (req, res) => res.json(dropship.setAutoPay(req.account, req.body?.auto_pay === true)));
app.delete("/api/suppliers/cj", auth, (req, res) => res.json(dropship.disconnect(req.account)));

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
// Send to CJ (or retry), or refresh tracking if it's already there.
app.post("/api/orders/:id/supplier", auth, wrap(async (req, res) => {
  const o = db.prepare("SELECT * FROM orders WHERE id = ? AND seller_id = ?").get(String(req.params.id), req.seller.id);
  if (!o) throw httpError(404, "That order doesn't exist.");
  if (o.supplier_order_id) await dropship.syncOrder(o.id);
  else await dropship.sendOrder(o.id);
  res.json(commerce.publicOrder(db.prepare("SELECT * FROM orders WHERE id = ?").get(o.id)));
}));
app.post("/api/orders/:id/fulfill", auth, (req, res) => res.json(commerce.setOrderStatus(req.seller, req.params.id, "fulfilled")));
app.get("/api/discounts", auth, (req, res) => res.json(commerce.listDiscounts(req.seller)));
app.post("/api/discounts", auth, (req, res) => res.status(201).json(commerce.createDiscount(req.seller, req.body || {})));
app.patch("/api/discounts/:id", auth, (req, res) => res.json(commerce.updateDiscount(req.seller, req.params.id, req.body || {})));
app.delete("/api/discounts/:id", auth, (req, res) => { commerce.deleteDiscount(req.seller, req.params.id); res.status(204).end(); });

/* ---------- Stripe Connect ---------- */
app.post("/api/stripe/onboard", auth, wrap(async (req, res) => {
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
const storeBySlug = (slug) => db.prepare("SELECT * FROM sellers WHERE store_slug = ?").get(slug);
app.get("/s/:store", (req, res) => {
  const store = storeBySlug(req.params.store);
  if (!store) return res.status(404).send("Store not found");
  const rows = db.prepare("SELECT * FROM products WHERE seller_id = ? AND status = 'live' ORDER BY created_at DESC").all(store.id);
  res.send(storePage(store, rows.map(rowToProduct), config.publicUrl));
});
app.get("/s/:store/cart", (req, res) => {
  const store = storeBySlug(req.params.store);
  if (!store) return res.status(404).send("Store not found");
  res.send(cartPage(store, config.publicUrl));
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
app.get("/s/:store/:product", (req, res) => {
  const store = storeBySlug(req.params.store);
  const row = store && db.prepare("SELECT * FROM products WHERE seller_id = ? AND slug = ?").get(store.id, req.params.product);
  if (!row || (row.status !== "live" && req.query.preview !== "1")) return res.status(404).send("Product not found");
  res.send(productPage(store, rowToProduct(row), config.publicUrl));
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
  res.send(orderPage(store, commerce.publicOrder(order), commerce.downloadsFor(order)));
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
<p>Snapfront lets you create product pages and sell through your own Stripe account. This policy explains what we collect.</p>
<h2>What we collect</h2><ul><li>Store details you enter: store name, tagline, product text and prices.</li>
<li>Photos you choose to upload, used to write your product page and shown on your storefront.</li>
<li>A random device token that identifies your store. We do not collect your name, contacts or location.</li>
<li>Order records for your sales: what was bought, amounts, the buyer's name, email and shipping address, so we can deliver digital downloads and you can ship physical orders.</li></ul>
<h2>How we use it</h2><p>To generate product pages (photos and text are sent to Anthropic's Claude API for this purpose only), to host your storefront, and to process sales through Stripe. We don't sell your data or use it for advertising.</p>
<h2>Third parties</h2><p>Anthropic (AI writing), Stripe (payments and seller verification), and our hosting provider.</p>
<h2>Deleting your data</h2><p>Open Store settings in the app and tap "Delete my store". This removes your store, products and photos from our servers.</p>
<h2>Contact</h2><p><a href="mailto:torrey@troosec.com">torrey@troosec.com</a></p>`));
app.get("/terms", legal("Terms of use", `
<p>By using Snapfront you agree to sell only products you have the right to sell, to describe them honestly, and to follow Stripe's terms and restricted-business list. You're responsible for fulfilling orders, taxes and refunds. Snapfront may remove listings that break these rules. Snapfront keeps a platform fee shown in the app on each sale.</p>
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
  // Pick up tracking numbers for orders at CJ.
  setInterval(() => dropship.syncDue().catch((e) => console.error("[cj] sync", e.message)), 30 * 60e3).unref();
}

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
  }
  return order;
}

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function auth(req, _res, next) {
  const token = (req.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const seller = token && db.prepare("SELECT * FROM sellers WHERE token_hash = ?").get(hashToken(token));
  if (!seller) return next(httpError(401, "Sign in again: this device isn't recognised."));
  req.seller = seller;
  next();
}

const hits = new Map(); // naive per-seller rate limit for AI calls
function aiLimit(req, _res, next) {
  const now = Date.now(), win = 60 * 60 * 1000, max = 40;
  const list = (hits.get(req.seller.id) || []).filter((t) => now - t < win);
  if (list.length >= max) return next(httpError(429, "You've hit the hourly AI limit. Try again in a little while."));
  list.push(now); hits.set(req.seller.id, list); next();
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

app.post("/api/sellers", wrap(async (req, res) => {
  const token = crypto.randomBytes(32).toString("base64url");
  const name = clampStr(req.body?.store_name || "My Snapfront Store", 80);
  const id = newId("sel");
  const slug = uniqueSlug("sellers", "store_slug", slugify(name, 40));
  db.prepare("INSERT INTO sellers (id, token_hash, store_name, store_slug) VALUES (?,?,?,?)").run(id, hashToken(token), name, slug);
  res.status(201).json({ token, seller: store.publicSeller(db.prepare("SELECT * FROM sellers WHERE id = ?").get(id)) });
}));

app.get("/api/me", auth, (req, res) => res.json(store.publicSeller(req.seller)));
app.patch("/api/me", auth, wrap(async (req, res) => res.json(await store.updateStoreChecked(req.seller, req.body || {}))));

// App Store guideline 5.1.1(v): apps that create accounts must let people delete them in-app.
app.delete("/api/me", auth, (req, res) => {
  const rows = db.prepare("SELECT image_file, delivery_file FROM products WHERE seller_id = ?").all(req.seller.id);
  db.prepare("DELETE FROM sellers WHERE id = ?").run(req.seller.id);
  for (const r of rows) for (const [dir, f] of [[dirs.images, r.image_file], [dirs.files, r.delivery_file]]) if (f) fs.rm(path.join(dir, f), { force: true }, () => {});
  res.status(204).end();
});

/* ---------- AI ---------- */
app.post("/api/ai/product-from-photo", auth, aiLimit, wrap(async (req, res) => {
  const { imageBase64, mediaType = "image/jpeg", kind = "physical", hint, price, tone } = req.body || {};
  const image_file = saveImage(imageBase64, mediaType);
  const r = await productFromPhoto({ imageBase64, mediaType, kind, hint: clampStr(hint, 300), price: price ? Number(price) : null, tone: clampStr(tone, 40) });
  res.json({
    image_file, image_url: `${config.publicUrl}/img/${image_file}`, kind: kind === "digital" ? "digital" : "physical",
    title: clampStr(r.title, 120), tagline: clampStr(r.tagline, 160), description: clampStr(r.description, 3000),
    bullets: strList(r.bullets, 6), tags: strList(r.tags, 6, 30).map((t) => t.replace(/^#/, "")), faq: faqList(r.faq),
    category: clampStr(r.category, 60), price: price ? Number(price) : Number(r.suggested_price) || 0,
    alt_text: clampStr(r.alt_text, 200), seo_description: clampStr(r.seo_description, 160),
  });
}));

app.post("/api/ai/generate", auth, aiLimit, wrap(async (req, res) => {
  res.status(201).json(await store.generateProduct(req.seller, req.body || {}));
}));

app.get("/api/product-types", (_req, res) => res.json(Object.entries(PRODUCT_TYPES).map(([id, t]) => ({ id, name: t.name, sub: t.sub, price: t.price }))));

/* ---------- Fable store agent ---------- */
app.post("/api/agent/runs", auth, aiLimit, (req, res) => {
  const run = agent.startRun(req.seller, req.body?.messages);
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
app.post("/api/orders/:id/fulfill", auth, (req, res) => res.json(commerce.setOrderStatus(req.seller, req.params.id, "fulfilled")));
app.get("/api/discounts", auth, (req, res) => res.json(commerce.listDiscounts(req.seller)));
app.post("/api/discounts", auth, (req, res) => res.status(201).json(commerce.createDiscount(req.seller, req.body || {})));
app.patch("/api/discounts/:id", auth, (req, res) => res.json(commerce.updateDiscount(req.seller, req.params.id, req.body || {})));
app.delete("/api/discounts/:id", auth, (req, res) => { commerce.deleteDiscount(req.seller, req.params.id); res.status(204).end(); });

/* ---------- Stripe Connect ---------- */
app.post("/api/stripe/onboard", auth, wrap(async (req, res) => {
  const { accountId, url } = await pay.onboardingLink(req.seller);
  db.prepare("UPDATE sellers SET stripe_account_id = ? WHERE id = ?").run(accountId, req.seller.id);
  res.json({ url });
}));
app.get("/api/stripe/status", auth, wrap(async (req, res) => {
  const ready = await pay.accountReady(req.seller.stripe_account_id);
  db.prepare("UPDATE sellers SET stripe_ready = ? WHERE id = ?").run(ready ? 1 : 0, req.seller.id);
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
<li>Order records from Stripe for your sales: buyer email and amount, so we can deliver digital downloads.</li></ul>
<h2>How we use it</h2><p>To generate product pages (photos and text are sent to Anthropic's Claude API for this purpose only), to host your storefront, and to process sales through Stripe. We don't sell your data or use it for advertising.</p>
<h2>Third parties</h2><p>Anthropic (AI writing), Stripe (payments and seller verification), and our hosting provider.</p>
<h2>Deleting your data</h2><p>Open Store settings in the app and tap "Delete my store". This removes your store, products and photos from our servers.</p>
<h2>Contact</h2><p>REPLACE_WITH_SUPPORT_EMAIL</p>`));
app.get("/terms", legal("Terms of use", `
<p>By using Snapfront you agree to sell only products you have the right to sell, to describe them honestly, and to follow Stripe's terms and restricted-business list. You're responsible for fulfilling orders, taxes and refunds. Snapfront may remove listings that break these rules. Snapfront keeps a platform fee shown in the app on each sale.</p>
<h2>Contact</h2><p>REPLACE_WITH_SUPPORT_EMAIL</p>`));

/* ---------- research list shown in the app's "What's selling" tab ---------- */
app.get("/api/trends", (_req, res) => res.json(store.TRENDS));

/* ---------- errors ---------- */
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || (err.type === "StripeInvalidRequestError" ? 400 : 500);
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 && !err.status ? "Something went wrong on our side. Try again." : err.message });
});

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  app.listen(config.port, () => console.log(`Snapfront API on ${config.publicUrl} (port ${config.port})`));
}

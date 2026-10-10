import express from "express";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { config, dirs } from "./config.js";
import { db, newId, hashToken, slugify, uniqueSlug, rowToProduct } from "./db.js";
import { productFromPhoto, generateDigitalProduct, httpError, PRODUCT_TYPES } from "./claude.js";
import { renderCover, renderProductPdf, COVER_COLORS, writeFileSafe } from "./artwork.js";
import * as pay from "./payments.js";
import { storePage, productPage, notePage, esc, money } from "./render.js";

export const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

/* ---------- Stripe webhook needs the raw body, so it is mounted before the JSON parser ---------- */
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  let event;
  try { event = pay.verifyWebhook(req.body, req.get("stripe-signature")); }
  catch (e) { return res.status(400).send(`Webhook error: ${e.message}`); }
  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const s = event.data.object;
      const productId = s.metadata?.snapfront_product;
      const row = productId && db.prepare("SELECT * FROM products WHERE id = ?").get(productId);
      if (row && s.payment_status === "paid") {
        const inserted = db.prepare("INSERT OR IGNORE INTO orders (id, product_id, checkout_session_id, email, amount_cents) VALUES (?,?,?,?,?)")
          .run(newId("ord"), row.id, s.id, s.customer_details?.email || null, s.amount_total ?? null);
        if (inserted.changes && row.kind === "digital") {
          const seller = db.prepare("SELECT * FROM sellers WHERE id = ?").get(row.seller_id);
          const url = `${config.publicUrl}/d/${pay.downloadToken(row.id, s.id)}`;
          await pay.emailDownload(s.customer_details?.email, row, url, seller.store_name).catch(() => false);
        }
      }
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

const clampStr = (v, n) => String(v ?? "").slice(0, n);
const strList = (v, n, len = 200) => (Array.isArray(v) ? v : []).map((x) => clampStr(x, len)).filter(Boolean).slice(0, n);
const faqList = (v) => (Array.isArray(v) ? v : []).filter((f) => f && f.q).slice(0, 6).map((f) => ({ q: clampStr(f.q, 200), a: clampStr(f.a, 800) }));
const cents = (v) => Math.max(0, Math.round(Number(v || 0) * 100));
const productOf = (seller, id) => {
  const row = db.prepare("SELECT * FROM products WHERE id = ? AND seller_id = ?").get(id, seller.id);
  if (!row) throw httpError(404, "That product doesn't exist.");
  return row;
};

/* ---------- account ---------- */
app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/api/sellers", wrap(async (req, res) => {
  const token = crypto.randomBytes(32).toString("base64url");
  const name = clampStr(req.body?.store_name || "My Snapfront Store", 80);
  const id = newId("sel");
  const slug = uniqueSlug("sellers", "store_slug", slugify(name, 40));
  db.prepare("INSERT INTO sellers (id, token_hash, store_name, store_slug) VALUES (?,?,?,?)").run(id, hashToken(token), name, slug);
  res.status(201).json({ token, seller: publicSeller(db.prepare("SELECT * FROM sellers WHERE id = ?").get(id)) });
}));

const publicSeller = (s) => ({ id: s.id, store_name: s.store_name, store_slug: s.store_slug, tagline: s.tagline,
  store_url: `${config.publicUrl}/s/${s.store_slug}`, stripe_connected: Boolean(s.stripe_account_id), stripe_ready: Boolean(s.stripe_ready) });

app.get("/api/me", auth, (req, res) => res.json(publicSeller(req.seller)));
app.patch("/api/me", auth, wrap(async (req, res) => {
  const name = req.body.store_name != null ? clampStr(req.body.store_name, 80).trim() : req.seller.store_name;
  const tagline = req.body.tagline != null ? clampStr(req.body.tagline, 160) : req.seller.tagline;
  let slug = req.seller.store_slug;
  if (req.body.store_slug) slug = uniqueSlug("sellers", "store_slug", slugify(req.body.store_slug, 40));
  db.prepare("UPDATE sellers SET store_name = ?, tagline = ?, store_slug = ? WHERE id = ?").run(name || req.seller.store_name, tagline, slug, req.seller.id);
  res.json(publicSeller(db.prepare("SELECT * FROM sellers WHERE id = ?").get(req.seller.id)));
}));

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
  const { type = "guide", niche, color = "cobalt", price } = req.body || {};
  if (!niche || String(niche).trim().length < 4) throw httpError(400, "Describe who the product is for, in a few words.");
  const r = await generateDigitalProduct({ type, niche: clampStr(niche, 200) });
  const hex = COVER_COLORS[color] || COVER_COLORS.cobalt;
  const cover = renderCover({ title: r.title, tagline: r.tagline, type, color: hex });
  const image_file = writeFileSafe(dirs.images, `${crypto.randomUUID()}.png`, cover);
  const pdf = await renderProductPdf({ ...r, type, storeName: req.seller.store_name }, cover, hex);
  const delivery_file = writeFileSafe(dirs.files, `${crypto.randomUUID()}.pdf`, pdf);
  const id = insertProduct(req.seller, {
    title: r.title, tagline: r.tagline, description: r.description, bullets: r.bullets, faq: r.faq, tags: r.tags,
    category: r.category || PRODUCT_TYPES[type].name, kind: "digital", price: price || r.suggested_price || PRODUCT_TYPES[type].price,
    image_file, alt_text: `Cover of ${r.title}`, seo_description: r.tagline,
  }, delivery_file);
  res.status(201).json(rowToProduct(db.prepare("SELECT * FROM products WHERE id = ?").get(id)));
}));

app.get("/api/product-types", (_req, res) => res.json(Object.entries(PRODUCT_TYPES).map(([id, t]) => ({ id, name: t.name, sub: t.sub, price: t.price }))));

/* ---------- products ---------- */
function insertProduct(seller, b, deliveryFile = null) {
  const id = newId("prd");
  const slug = uniqueSlug("products", "slug", slugify(b.title), seller.id);
  if (b.image_file && !/^[\w-]+\.(jpg|png|webp|gif)$/.test(b.image_file)) throw httpError(400, "Invalid image reference.");
  db.prepare(`INSERT INTO products (id, seller_id, slug, title, tagline, description, bullets, faq, tags, category, kind, price_cents, image_file, alt_text, seo_description, delivery_file, delivery_url)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    id, seller.id, slug, clampStr(b.title, 120) || "Untitled product", clampStr(b.tagline, 160), clampStr(b.description, 3000),
    JSON.stringify(strList(b.bullets, 6)), JSON.stringify(faqList(b.faq)), JSON.stringify(strList(b.tags, 6, 30)),
    clampStr(b.category, 60), b.kind === "digital" ? "digital" : "physical", cents(b.price), b.image_file || null,
    clampStr(b.alt_text, 200), clampStr(b.seo_description, 160), deliveryFile, b.delivery_url ? clampStr(b.delivery_url, 500) : null);
  return id;
}

app.get("/api/products", auth, (req, res) => {
  const rows = db.prepare("SELECT * FROM products WHERE seller_id = ? ORDER BY created_at DESC").all(req.seller.id);
  res.json(rows.map((r) => ({ ...rowToProduct(r), page_url: `${config.publicUrl}/s/${req.seller.store_slug}/${r.slug}` })));
});
app.get("/api/products/:id", auth, (req, res) => {
  const r = productOf(req.seller, req.params.id);
  res.json({ ...rowToProduct(r), page_url: `${config.publicUrl}/s/${req.seller.store_slug}/${r.slug}` });
});
app.post("/api/products", auth, wrap(async (req, res) => {
  const b = req.body || {};
  if (b.delivery_url && !/^https:\/\//.test(b.delivery_url)) throw httpError(400, "The download link must start with https://");
  const id = insertProduct(req.seller, b);
  res.status(201).json(rowToProduct(db.prepare("SELECT * FROM products WHERE id = ?").get(id)));
}));
app.patch("/api/products/:id", auth, wrap(async (req, res) => {
  const row = productOf(req.seller, req.params.id), b = req.body || {};
  const priceChanged = b.price != null && cents(b.price) !== row.price_cents;
  const next = {
    title: b.title != null ? clampStr(b.title, 120) : row.title, tagline: b.tagline != null ? clampStr(b.tagline, 160) : row.tagline,
    description: b.description != null ? clampStr(b.description, 3000) : row.description, category: b.category != null ? clampStr(b.category, 60) : row.category,
    price_cents: b.price != null ? cents(b.price) : row.price_cents, delivery_url: b.delivery_url !== undefined ? (b.delivery_url ? clampStr(b.delivery_url, 500) : null) : row.delivery_url,
  };
  db.prepare("UPDATE products SET title=?, tagline=?, description=?, category=?, price_cents=?, delivery_url=? WHERE id=?")
    .run(next.title, next.tagline, next.description, next.category, next.price_cents, next.delivery_url, row.id);
  // A new price needs a new Stripe price + Payment Link; take the product back to draft.
  if (priceChanged && row.status === "live") db.prepare("UPDATE products SET status='draft', payment_link_url=NULL WHERE id=?").run(row.id);
  res.json(rowToProduct(db.prepare("SELECT * FROM products WHERE id = ?").get(row.id)));
}));
app.delete("/api/products/:id", auth, (req, res) => {
  const row = productOf(req.seller, req.params.id);
  db.prepare("DELETE FROM products WHERE id = ?").run(row.id);
  for (const [dir, f] of [[dirs.images, row.image_file], [dirs.files, row.delivery_file]]) if (f) fs.rm(path.join(dir, f), { force: true }, () => {});
  res.status(204).end();
});

app.post("/api/products/:id/publish", auth, wrap(async (req, res) => {
  const row = productOf(req.seller, req.params.id);
  if (!req.seller.stripe_account_id) throw httpError(409, "Connect Stripe first so you can get paid.");
  if (!req.seller.stripe_ready) {
    const ready = await pay.accountReady(req.seller.stripe_account_id);
    db.prepare("UPDATE sellers SET stripe_ready = ? WHERE id = ?").run(ready ? 1 : 0, req.seller.id);
    if (!ready) throw httpError(409, "Finish setting up your Stripe account to start selling.");
  }
  if (row.price_cents < 50) throw httpError(400, "Set a price of at least $0.50.");
  if (row.kind === "digital" && !row.delivery_file && !row.delivery_url) throw httpError(400, "Add the file buyers will download before publishing.");
  const s = await pay.publishToStripe(req.seller, rowToProduct(row));
  db.prepare("UPDATE products SET status='live', stripe_product_id=?, stripe_price_id=?, payment_link_url=? WHERE id=?")
    .run(s.stripe_product_id, s.stripe_price_id, s.payment_link_url, row.id);
  res.json({ ...rowToProduct(db.prepare("SELECT * FROM products WHERE id = ?").get(row.id)), page_url: `${config.publicUrl}/s/${req.seller.store_slug}/${row.slug}` });
}));

app.get("/api/orders", auth, (req, res) => {
  res.json(db.prepare(`SELECT o.id, o.email, o.amount_cents, o.created_at, p.title FROM orders o JOIN products p ON p.id = o.product_id
    WHERE p.seller_id = ? ORDER BY o.created_at DESC LIMIT 200`).all(req.seller.id));
});

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
app.get("/s/:store/:product", (req, res) => {
  const store = storeBySlug(req.params.store);
  const row = store && db.prepare("SELECT * FROM products WHERE seller_id = ? AND slug = ?").get(store.id, req.params.product);
  if (!row || (row.status !== "live" && req.query.preview !== "1")) return res.status(404).send("Product not found");
  res.send(productPage(store, rowToProduct(row), config.publicUrl));
});
app.get("/thanks", wrap(async (req, res) => {
  const row = db.prepare("SELECT * FROM products WHERE id = ?").get(String(req.query.p || ""));
  if (!row) return res.status(404).send("Order not found");
  const store = db.prepare("SELECT * FROM sellers WHERE id = ?").get(row.seller_id);
  const session = await pay.paidSession(store.stripe_account_id, String(req.query.session_id || "")).catch(() => null);
  if (!session) return res.send(notePage(store, "Payment pending", `<h1>Almost there</h1><p>We haven't received your payment yet. If you were charged, refresh this page in a minute.</p>`));
  db.prepare("INSERT OR IGNORE INTO orders (id, product_id, checkout_session_id, email, amount_cents) VALUES (?,?,?,?,?)")
    .run(newId("ord"), row.id, session.id, session.customer_details?.email || null, session.amount_total ?? null);
  const dl = row.kind === "digital" ? `<a class="buy" href="/d/${pay.downloadToken(row.id, session.id)}">Download ${esc(row.title)}</a><p class="fine">This link works for 7 days. Bookmark this page to download again.</p>` : `<p>We'll email you when your order ships.</p>`;
  res.send(notePage(store, "Thank you", `<h1>Thank you!</h1><p>Your order for <strong>${esc(row.title)}</strong> (${money(session.amount_total ?? row.price_cents, row.currency)}) is confirmed.</p>${dl}`));
}));
app.get("/d/:token", (req, res) => {
  const t = pay.readDownloadToken(req.params.token);
  if (!t) return res.status(410).send("This download link has expired. Open your order confirmation page for a fresh one.");
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
app.get("/api/trends", (_req, res) => res.json([
  { name: "Digital planners", why: "Hyperlinked PDF planners for GoodNotes and Notability. Peak season runs October to January.", where: "Etsy, TikTok, Pinterest" },
  { name: "Printable wall art", why: "Minimalist and motivational prints, one of the highest-volume digital categories on Etsy.", where: "Etsy, Pinterest" },
  { name: "Content & hook templates", why: "Hooks, scripts and content calendars for creators and small shops.", where: "TikTok, Instagram" },
  { name: "Spreadsheet templates", why: "Budget, savings and small-business trackers for Excel and Google Sheets.", where: "Etsy, TikTok" },
  { name: "Digital stickers", why: "Transparent PNG sticker packs for iPad planners.", where: "Etsy, Instagram" },
  { name: "Canva templates", why: "Social posts, business cards and branding kits edited in Canva.", where: "Etsy, Instagram" },
  { name: "E-books & mini guides", why: "Short, specific how-to guides tied to a creator's niche.", where: "Instagram, TikTok" },
]));

/* ---------- errors ---------- */
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || (err.type === "StripeInvalidRequestError" ? 400 : 500);
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 && !err.status ? "Something went wrong on our side. Try again." : err.message });
});

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  app.listen(config.port, () => console.log(`Snapfront API on ${config.publicUrl} (port ${config.port})`));
}

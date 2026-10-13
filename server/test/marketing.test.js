// Growth tools sellers use to bring buyers back: the email sign-up box and checkout opt-in, email
// broadcasts and automatic emails, the affiliate program, ad pixels and Instagram AutoDM.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-marketing-"));
const KEY = crypto.randomBytes(32);
Object.assign(process.env, {
  DATA_DIR: tmp, PUBLIC_URL: "https://shop.example", STORE_DOMAIN: "", STRIPE_SECRET_KEY: "sk_test_fake", STRIPE_WEBHOOK_SECRET: "whsec_fake", GOOGLE_PLAY_SERVICE_ACCOUNT: "",
  EMAIL_CAPS: JSON.stringify({ launch: 2 }),
  META_APP_ID: "123", META_APP_SECRET: "app-secret", META_LOGIN_CONFIG_ID: "cfg", META_TOKEN_ENCRYPTION_KEY: KEY.toString("base64"),
  META_AUTODM_ENABLED: "true", META_WEBHOOK_VERIFY_TOKEN: "verify-me",
});

const { app } = await import("../src/index.js");
const pay = await import("../src/payments.js");
const { db } = await import("../src/db.js");
const audience = await import("../src/audience.js");
const social = await import("../src/social.js");

// Stripe stand-in.
const sessions = [];
pay.setStripeClient({
  checkout: { sessions: {
    async create(p, o) { const id = `cs_${sessions.length + 1}`; sessions.push({ id, p, o }); return { id, url: `https://checkout.stripe.com/c/${id}` }; },
    async retrieve() { throw new Error("not used"); },
  } },
  coupons: { async create() { return { id: "co_1" }; } },
  webhooks: { constructEvent(raw) { return JSON.parse(raw.toString()); } },
});
// Resend stand-in.
const outbox = [];
audience.setEmailTransport(async (msgs) => { outbox.push(...msgs); return { errors: [] }; });
// Meta stand-in.
const graphCalls = [];
social.setMetaTransport(async (req) => { graphCalls.push(req); return { id: "ok", success: true }; });

let server, base, token, seller, account, slug, mug;
before(async () => {
  server = app.listen(0); await new Promise((r) => server.once("listening", r)); base = `http://127.0.0.1:${server.address().port}`;
  const r = await (await fetch(`${base}/api/sellers`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ store_name: "Moon Goods" }) })).json();
  token = r.token; seller = r.seller; account = r.account; slug = seller.store_slug;
  db.prepare("UPDATE sellers SET stripe_account_id = 'acct_1', stripe_ready = 1 WHERE id = ?").run(seller.id);
  db.prepare("UPDATE accounts SET plan = 'pro', email = 'owner@moon.example' WHERE id = ?").run(account.id);
  mug = await (await call("POST", "/api/products", { title: "Moon Mug", kind: "physical", price: 25 })).json();
  await call("POST", `/api/products/${mug.id}/publish`);
  await call("POST", "/api/discounts", { code: "WELCOME10", kind: "percent", percent: 10 });
});
after(() => { server.close(); fs.rmSync(tmp, { recursive: true, force: true }); });
function call(method, url, body, headers = {}) {
  return fetch(base + url, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...headers }, body: body ? JSON.stringify(body) : undefined });
}
const json = async (r, status) => { const j = r.status === 204 ? null : await r.json(); assert.equal(r.status, status, JSON.stringify(j)); return j; };
const page = async (url) => (await fetch(base + url)).text();
async function pay_(orderItems, { ref = null, email, news = "no" } = {}) {
  const { order_id } = await json(await fetch(`${base}/s/${slug}/checkout`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: orderItems, ref }) }), 200);
  const s = sessions.at(-1);
  const session = { id: s.id, object: "checkout.session", payment_status: "paid", metadata: { snapfront_order: order_id }, customer_details: { email, name: "Buyer" },
    amount_subtotal: 2500, amount_total: 2500, total_details: { amount_discount: 0, amount_shipping: 0, amount_tax: 0 },
    custom_fields: [{ key: "news", dropdown: { value: news } }] };
  await json(await fetch(`${base}/api/stripe/webhook`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "checkout.session.completed", data: { object: session } }) }), 200);
  return db.prepare("SELECT * FROM orders WHERE id = ?").get(order_id);
}
const subscribe = (body) => fetch(`${base}/s/${slug}/subscribe`, { method: "POST", headers: { "Content-Type": "application/json", "X-Forwarded-For": `10.0.0.${Math.floor(Math.random() * 250)}` }, body: JSON.stringify(body) });

test("every store has an email sign-up box that can hand out a welcome code", async () => {
  const html = await page(`/s/${slug}`);
  assert.match(html, /id="sfn-form"/);
  assert.match(html, /Get first dibs on new drops/);
  await json(await call("PUT", "/api/email/settings", { signup_offer_code: "nope" }), 400);
  await json(await call("PUT", "/api/email/settings", { signup_title: "Join the Moon Club", signup_offer_code: "welcome10" }), 200);
  assert.match(await page(`/s/${slug}/moon-mug`), /Join the Moon Club[\s\S]*Get my code/);

  assert.deepEqual(await json(await subscribe({ email: "Ava@Example.com" }), 200), { ok: true, offer_code: "WELCOME10" });
  await json(await subscribe({ email: "not an email" }), 400);
  await json(await subscribe({ email: "bot@example.com", website: "spam.example" }), 200);   // honeypot: silently ignored
  const list = await json(await call("GET", "/api/email/subscribers"), 200);
  assert.deepEqual(list.subscribers.map((s) => [s.email, s.source]), [["ava@example.com", "form"]]);

  // Pasting a list needs the seller to confirm consent; unsubscribed people aren't re-added.
  await json(await call("POST", "/api/email/subscribers", { emails: "a@x.example" }), 400);
  assert.deepEqual(await json(await call("POST", "/api/email/subscribers", { emails: "ben@example.com, ava@example.com\nnope", consent: true }), 201), { added: 1, skipped: 1, invalid: 1 });

  await json(await call("PUT", "/api/email/settings", { signup_enabled: false }), 200);
  assert.doesNotMatch(await page(`/s/${slug}`), /id="sfn-form"/);
  await json(await subscribe({ email: "late@example.com" }), 404);
  await json(await call("PUT", "/api/email/settings", { signup_enabled: true }), 200);
  // Theme previews don't show it.
  assert.doesNotMatch(await page(`/s/${slug}?theme=noir`), /id="sfn-form"/);
});

test("buyers can join the list at checkout, and affiliate links earn commission", async () => {
  await json(await call("PUT", "/api/affiliates/settings", { enabled: true, rate: 20, cookie_days: 30 }), 200);
  const maya = await json(await call("POST", "/api/affiliates", { name: "Maya Fern", email: "maya@example.com", code: "maya" }), 201);
  assert.equal(maya.code, "MAYA");
  assert.match(maya.link, /\?ref=MAYA$/);
  await json(await call("POST", "/api/affiliates", { name: "Other", email: "o@example.com", code: "MAYA" }), 409);

  // A click on the link is counted once per visitor per day, and the store page remembers the code.
  const html = await page(`/s/${slug}?ref=maya`);
  await page(`/s/${slug}?ref=maya`);
  assert.match(html, /sf_ref_/);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM affiliate_clicks").get().n, 1);

  const order = await pay_([{ product_id: mug.id, qty: 1 }], { ref: { code: "MAYA", at: Date.now() }, email: "cara@example.com", news: "yes" });
  assert.equal(sessions.at(-1).p.custom_fields[0].key, "news");
  assert.equal(order.status, "paid");
  assert.equal(order.affiliate_id, maya.id);
  assert.equal(order.commission_cents, 500);   // 20% of $25
  const cara = db.prepare("SELECT * FROM subscribers WHERE email = 'cara@example.com'").get();
  assert.equal(cara.source, "checkout");

  // An expired link, or an affiliate buying through their own link, earns nothing.
  const old = await pay_([{ product_id: mug.id, qty: 1 }], { ref: { code: "MAYA", at: Date.now() - 40 * 864e5 }, email: "dan@example.com" });
  assert.equal(old.affiliate_id, null);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM subscribers WHERE email = 'dan@example.com'").get().n, 0);   // said no
  const self = await pay_([{ product_id: mug.id, qty: 1 }], { ref: { code: "MAYA", at: Date.now() }, email: "Maya@Example.com" });
  assert.equal(self.commission_cents, 0);

  // A half refund halves the commission; payouts reduce what's owed.
  db.prepare("UPDATE orders SET refunded_cents = 1250 WHERE id = ?").run(order.id);
  let a = (await json(await call("GET", "/api/affiliates"), 200)).affiliates.find((x) => x.id === maya.id);
  assert.deepEqual([a.clicks, a.orders, a.earned, a.owed], [1, 2, 2.5, 2.5]);
  await json(await call("DELETE", `/api/affiliates/${maya.id}`), 409);   // still owed money
  a = await json(await call("POST", `/api/affiliates/${maya.id}/payouts`, { amount: 2.5, note: "PayPal" }), 201);
  assert.equal(a.owed, 0);

  // Maya's private page; a wrong token shows nothing.
  const t = new URL(maya.portal_url).searchParams.get("t");
  const portal = await page(`/s/${slug}/affiliate?t=${t}`);
  assert.match(portal, /Hi Maya[\s\S]*\?ref=MAYA[\s\S]*Paid to you/);
  assert.equal((await fetch(`${base}/s/${slug}/affiliate?t=wrong`)).status, 404);

  // Anyone can apply on the join page; with auto-approve they're active straight away.
  assert.match(await page(`/s/${slug}/affiliates`), /Earn 20% sharing Moon Goods/);
  const joined = await (await fetch(`${base}/s/${slug}/affiliates`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "name=Lee+Park&email=lee%40example.com" })).text();
  assert.match(joined, /You're in!/);
  assert.equal(db.prepare("SELECT status FROM affiliates WHERE email = 'lee@example.com'").get().status, "active");

  // Off Pro, the program stops for buyers.
  db.prepare("UPDATE accounts SET plan = 'launch' WHERE id = ?").run(account.id);
  assert.equal((await fetch(`${base}/s/${slug}/affiliates`)).status, 404);
  db.prepare("UPDATE accounts SET plan = 'pro' WHERE id = ?").run(account.id);
});

test("broadcasts go to the chosen audience with unsubscribe, tracking and the seller's address", async () => {
  const draft = await json(await call("POST", "/api/email/campaigns", { subject: "New moon mugs, {name}", body: "Hi {name},\n\nFresh mugs just landed.", cta_label: "Shop mugs", product_id: mug.id, discount_code: "WELCOME10", audience: "buyers" }), 201);
  await json(await call("POST", `/api/email/campaigns/${draft.id}/send`), 400);   // no mailing address yet
  await json(await call("PUT", "/api/email/settings", { mail_address: "12 Orbit Lane, Austin, TX 78701", from_name: "Moon Goods Studio" }), 200);
  assert.match((await json(await call("GET", `/api/email/campaigns/${draft.id}/preview`), 200)).html, /12 Orbit Lane/);

  outbox.length = 0;
  await json(await call("POST", `/api/email/campaigns/${draft.id}/test`, { to: "me@moon.example" }), 200);
  assert.equal(outbox[0].subject, "[Test] New moon mugs, there");

  const sent = await json(await call("POST", `/api/email/campaigns/${draft.id}/send`), 200);
  assert.equal(sent.recipients, 1);   // only cara bought and subscribed
  assert.equal(sent.status, "sending");
  outbox.length = 0;
  await audience.processQueue();
  assert.equal(outbox.length, 1);
  const m = outbox[0];
  assert.deepEqual(m.to, ["cara@example.com"]);
  assert.equal(m.subject, "New moon mugs, Buyer");
  assert.match(m.from, /^"Moon Goods Studio" </);
  assert.equal(m.reply_to, "owner@moon.example");
  assert.match(m.headers["List-Unsubscribe"], /^<https:\/\/shop\.example\/u\//);
  assert.equal(m.headers["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click");
  assert.match(m.html, /12 Orbit Lane[\s\S]*Unsubscribe/);
  assert.match(m.html, /WELCOME10/);
  assert.match(m.text, /utm_source=email/);
  assert.equal((await json(await call("GET", `/api/email/campaigns/${draft.id}`), 200)).status, "sent");
  await json(await call("PATCH", `/api/email/campaigns/${draft.id}`, { subject: "x" }), 409);

  // Opens and clicks; tampered links are refused.
  const sendId = /\/e\/o\/([^".]+)\.gif/.exec(m.html)[1];
  assert.equal((await fetch(`${base}/e/o/${sendId}.gif`)).headers.get("content-type"), "image/gif");
  const link = /href="(https:\/\/shop\.example\/e\/c\/[^"]+)"/.exec(m.html)[1].replace(/&amp;/g, "&").replace("https://shop.example", base);
  const click = await fetch(link, { redirect: "manual" });
  assert.equal(click.status, 302);
  assert.match(click.headers.get("location"), /^https:\/\/shop\.example\/s\//);
  const evil = new URL(link); evil.searchParams.set("u", "https://evil.example");
  assert.equal((await fetch(evil, { redirect: "manual" })).status, 400);

  // Unsubscribing takes a button press (scanners open links), or one-click from the inbox.
  const unsub = /<(https:\/\/shop\.example\/u\/[^>]+)>/.exec(m.headers["List-Unsubscribe"])[1].replace("https://shop.example", base);
  assert.match(await (await fetch(unsub)).text(), /<form method="post">/);
  assert.equal(db.prepare("SELECT status FROM subscribers WHERE email = 'cara@example.com'").get().status, "subscribed");
  await fetch(unsub, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "List-Unsubscribe=One-Click" });
  assert.equal(db.prepare("SELECT status FROM subscribers WHERE email = 'cara@example.com'").get().status, "unsubscribed");
  const stats = (await json(await call("GET", `/api/email/campaigns/${draft.id}`), 200)).stats;
  assert.deepEqual([stats.sent, stats.opened, stats.clicked, stats.unsubscribed, stats.open_rate], [1, 1, 1, 1, 100]);
  assert.equal((await fetch(unsub.replace(/\.[^.]+$/, ".forged"))).status, 404);

  // Launch has a smaller monthly allowance.
  db.prepare("UPDATE accounts SET plan = 'launch' WHERE id = ?").run(account.id);
  const big = await json(await call("POST", "/api/email/campaigns", { subject: "Hello", body: "Hi", audience: "all" }), 201);
  const refused = await json(await call("POST", `/api/email/campaigns/${big.id}/send`), 402);
  assert.match(refused.error, /left this month/);
  db.prepare("UPDATE accounts SET plan = 'free' WHERE id = ?").run(account.id);
  await json(await call("POST", "/api/email/campaigns", { subject: "x" }), 402);
  db.prepare("UPDATE accounts SET plan = 'pro' WHERE id = ?").run(account.id);

  // Scheduled sends can be canceled back to a draft.
  const later = await json(await call("POST", `/api/email/campaigns/${big.id}/send`, { send_at: new Date(Date.now() + 864e5).toISOString() }), 200);
  assert.equal(later.status, "scheduled");
  assert.equal((await json(await call("POST", `/api/email/campaigns/${big.id}/cancel`), 200)).status, "draft");
});

test("automatic emails: welcome, after a purchase and win-back, each sent once", async () => {
  await json(await call("PUT", "/api/email/flows/welcome", { enabled: true }), 200);
  outbox.length = 0;
  await json(await subscribe({ email: "fresh@example.com" }), 200);
  await audience.processQueue();
  assert.deepEqual(outbox.map((x) => [x.to[0], x.subject]), [["fresh@example.com", "Welcome to Moon Goods"]]);
  assert.match(outbox[0].html, /WELCOME10/);   // the sign-up offer code rides along

  await json(await call("PUT", "/api/email/flows/after_purchase", { enabled: true, delay_days: 10 }), 200);
  await json(await call("PUT", "/api/email/flows/winback", { enabled: true, delay_days: 61 }), 200);
  await json(await call("PUT", "/api/email/flows/winback", { delay_days: 5 }), 400);
  // Ava (subscribed) bought 11 days ago; Ben (subscribed) last bought 70 days ago.
  const o1 = await pay_([{ product_id: mug.id, qty: 1 }], { email: "ava@example.com" });
  const o2 = await pay_([{ product_id: mug.id, qty: 1 }], { email: "ben@example.com" });
  db.prepare("UPDATE orders SET paid_at = datetime('now','-11 days') WHERE id = ?").run(o1.id);
  db.prepare("UPDATE orders SET paid_at = datetime('now','-70 days') WHERE id = ?").run(o2.id);
  assert.equal(audience.runFlows(), 2);
  assert.equal(audience.runFlows(), 0);   // never twice
  outbox.length = 0;
  await audience.processQueue();
  assert.deepEqual(outbox.map((x) => [x.to[0], x.subject]).sort(), [["ava@example.com", "Thanks again from Moon Goods"], ["ben@example.com", "We miss you at Moon Goods"]]);
  const flows = await json(await call("GET", "/api/email/flows"), 200);
  assert.deepEqual(flows.flows.map((f) => [f.kind, f.stats.sent]), [["welcome", 1], ["after_purchase", 1], ["winback", 1]]);

  // Pro only.
  db.prepare("UPDATE accounts SET plan = 'launch' WHERE id = ?").run(account.id);
  await json(await call("PUT", "/api/email/flows/welcome", { enabled: true }), 402);
  db.prepare("UPDATE accounts SET plan = 'pro' WHERE id = ?").run(account.id);

  // Subscribers export through a signed link.
  const { url } = await json(await call("POST", "/api/business/export", { kind: "subscribers" }), 200);
  const csv = await (await fetch(url.replace("https://shop.example", base))).text();
  assert.match(csv, /^Email,Name,Status,Joined,Source,Orders,Spent/);
  assert.match(csv, /cara@example.com,Buyer,unsubscribed/);
});

test("ad pixels load on real store pages and report shopping events", async () => {
  await json(await call("PUT", "/api/pixels", { meta_pixel_id: "abc" }), 400);
  await json(await call("PUT", "/api/pixels", { ga4_id: "UA-123" }), 400);
  const v = await json(await call("PUT", "/api/pixels", { meta_pixel_id: "1234 5678 9012 345", tiktok_pixel_id: "c1abc2def3ghi4jkl5", ga4_id: "g-ab12cd34", pinterest_tag_id: "2612345678901" }), 200);
  assert.deepEqual(v.pixels.map((p) => p.id), ["123456789012345", "C1ABC2DEF3GHI4JKL5", "G-AB12CD34", "2612345678901"]);
  const store = await page(`/s/${slug}`);
  assert.match(store, /fbq\('init',"123456789012345"\)/);
  assert.match(store, /ttq\.load\("C1ABC2DEF3GHI4JKL5"\)/);
  assert.match(store, /gtag\('config',"G-AB12CD34"\)/);
  assert.match(store, /pintrk\('load',"2612345678901"\)/);
  assert.match(store, /window\.sfTrack=/);
  assert.match(await page(`/s/${slug}/moon-mug`), /sfTrack\("view",\{"id":"prd_/);
  assert.match(await page(`/s/${slug}/cart`), /sfTrack\("checkout"/);
  assert.doesNotMatch(await page(`/s/${slug}?theme=noir`), /fbq\('init'/);   // previews never fire pixels
  db.prepare("UPDATE accounts SET plan = 'free' WHERE id = ?").run(account.id);
  await json(await call("PUT", "/api/pixels", { meta_pixel_id: "123456789012345" }), 402);
  await json(await call("PUT", "/api/pixels", { meta_pixel_id: "" }), 200);   // clearing is always allowed
  db.prepare("UPDATE accounts SET plan = 'pro' WHERE id = ?").run(account.id);
});

function encrypt(token) {
  const iv = crypto.randomBytes(12), c = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const ct = Buffer.concat([c.update(token, "utf8"), c.final()]);
  return `v1.${iv.toString("base64url")}.${c.getAuthTag().toString("base64url")}.${ct.toString("base64url")}`;
}
const signed = (body) => ({ "Content-Type": "application/json", "X-Hub-Signature-256": `sha256=${crypto.createHmac("sha256", "app-secret").update(body).digest("hex")}` });
async function deliver(payload) {
  const body = JSON.stringify(payload);
  const before = db.prepare("SELECT COUNT(*) AS n FROM autodm_activity").get().n;
  const r = await fetch(`${base}/api/meta/webhook`, { method: "POST", headers: signed(body), body });
  assert.equal(r.status, 200);
  for (let i = 0; i < 50 && db.prepare("SELECT COUNT(*) AS n FROM autodm_activity").get().n === before; i++) await new Promise((x) => setTimeout(x, 20));
}

test("AutoDM replies to keyword comments and DMs on Instagram, once a day per person", async () => {
  // Meta checks the webhook first.
  assert.equal(await (await fetch(`${base}/api/meta/webhook?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=42`)).text(), "42");
  assert.equal((await fetch(`${base}/api/meta/webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=42`)).status, 403);
  assert.equal((await fetch(`${base}/api/meta/webhook`, { method: "POST", headers: { "Content-Type": "application/json", "X-Hub-Signature-256": "sha256=00" }, body: "{}" })).status, 401);

  let st = await json(await call("GET", "/api/autodm"), 200);
  assert.equal(st.blocker, "connect_instagram");
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO social_connections (id, seller_id, meta_user_id, platform, remote_id, page_id, name, access_token_enc, status, created_at, updated_at)
    VALUES ('social_ig', ?, 'u1', 'instagram', 'ig_77', 'page_9', 'Instagram @moongoods', ?, 'connected', ?, ?)`).run(seller.id, encrypt("page-token"), now, now);
  st = await json(await call("GET", "/api/autodm"), 200);
  assert.equal(st.blocker, null);

  await json(await call("POST", "/api/autodm/rules", { keywords: "", reply: "x" }), 400);
  const rule = await json(await call("POST", "/api/autodm/rules", { keywords: "Link, PRICE", reply: "Here's the mug!", product_id: mug.id, comment_reply: "Sent you a DM 💌" }), 201);
  assert.deepEqual(rule.keywords, ["link", "price"]);

  graphCalls.length = 0;
  const comment = (id, text, from = "user_5") => ({ object: "instagram", entry: [{ id: "ig_77", time: 1, changes: [{ field: "comments", value: { id, text, from: { id: from, username: "fan" }, media: { id: "m1" } } }] }] });
  await deliver(comment("c1", "Love it! LINK please"));
  const dm = graphCalls.find((c) => c.url.endsWith("/page_9/messages"));
  assert.equal(dm.headers.Authorization, "Bearer page-token");
  assert.deepEqual(JSON.parse(dm.form.recipient), { comment_id: "c1" });
  assert.match(JSON.parse(dm.form.message).text, /^Here's the mug!\n\nhttps:\/\/shop\.example\/s\/[^/]+\/moon-mug\?utm_source=instagram$/);
  assert.equal(graphCalls.find((c) => c.url.endsWith("/c1/replies")).form.message, "Sent you a DM 💌");

  // The same person again today: skipped. Words that merely contain the keyword don't match.
  graphCalls.length = 0;
  await deliver(comment("c2", "link?"));
  assert.equal(graphCalls.length, 0);
  await deliver({ object: "instagram", entry: [{ id: "ig_77", messaging: [{ sender: { id: "user_8" }, recipient: { id: "ig_77" }, message: { mid: "mid1", text: "what's the price" } }] }] });
  assert.deepEqual(JSON.parse(graphCalls.at(-1).form.recipient), { id: "user_8" });
  graphCalls.length = 0;
  await deliver({ object: "instagram", entry: [{ id: "ig_77", messaging: [{ sender: { id: "ig_77" }, recipient: { id: "user_8" }, message: { mid: "mid2", text: "price", is_echo: true } }] }] });
  await deliver(comment("c3", "linkedin is great", "user_9"));
  await new Promise((x) => setTimeout(x, 60));
  assert.equal(graphCalls.length, 0);

  st = await json(await call("GET", "/api/autodm"), 200);
  assert.equal(st.rules[0].sent, 2);
  assert.deepEqual(st.activity.map((a) => a.status).sort(), ["sent", "sent", "skipped"]);
});

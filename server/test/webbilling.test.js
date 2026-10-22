// The website: app.<STORE_DOMAIN> serves the web app (with the API on the same address), and plans
// bought there go through Stripe Checkout. The server only trusts what Stripe itself reports.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-web-"));
process.env.DATA_DIR = tmp;
process.env.PUBLIC_URL = "https://shopdomain.test";
process.env.STORE_DOMAIN = "shopdomain.test";
process.env.STRIPE_SECRET_KEY = "sk_test_fake";
process.env.GOOGLE_PLAY_SERVICE_ACCOUNT = "";

const { app, WEBAPP_DIR } = await import("../src/index.js");
const pay = await import("../src/payments.js");
const { db } = await import("../src/db.js");

// A stand-in web build, unless a real one is present.
const madeBuild = !fs.existsSync(path.join(WEBAPP_DIR, "index.html"));
if (madeBuild) {
  fs.mkdirSync(path.join(WEBAPP_DIR, "_expo/static/js/web"), { recursive: true });
  fs.writeFileSync(path.join(WEBAPP_DIR, "index.html"), "<!doctype html><title>Snapfront</title><div id=root></div>");
  fs.writeFileSync(path.join(WEBAPP_DIR, "_expo/static/js/web/entry-test.js"), "console.log(1)");
}

// Stripe stand-in: checkout sessions, subscriptions, payments and the billing portal.
const sessions = new Map(), subs = new Map(), intents = new Map();
let created = [], customers = 0, canceled = [], updated = [];
pay.setStripeClient({
  customers: { async create(p) { customers++; return { id: `cus_${customers}`, ...p }; } },
  checkout: { sessions: {
    async create(p) { const id = `cs_plan_${sessions.size + 1}`; const s = { id, url: `https://checkout.stripe.com/c/${id}`, status: "open", payment_status: "unpaid", ...p }; sessions.set(id, s); created.push(s); return s; },
    async retrieve(id) { const s = sessions.get(id); if (!s) { const e = new Error("No such session"); e.statusCode = 404; throw e; } return s; },
  } },
  subscriptions: {
    async retrieve(id) { return subs.get(id); },
    async cancel(id) { canceled.push(id); subs.get(id).status = "canceled"; return subs.get(id); },
    async update(id, p) { updated.push([id, p]); return { ...subs.get(id), ...p }; },
  },
  paymentIntents: { async retrieve(id) { return intents.get(id); } },
  billingPortal: { sessions: { async create(p) { return { url: `https://billing.stripe.com/p/${p.customer}` }; } } },
});

let server, port;
before(async () => { server = app.listen(0); await new Promise((r) => server.once("listening", r)); port = server.address().port; });
after(() => {
  server.close();
  if (madeBuild) fs.rmSync(WEBAPP_DIR, { recursive: true, force: true });
  fs.rmSync(tmp, { recursive: true, force: true });
});

function req(host, method, url, { body, token } = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const r = http.request({ host: "127.0.0.1", port, method, path: url, headers: { Host: host, ...(data ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) } }, (res) => {
      let text = ""; res.on("data", (c) => (text += c)); res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, text, json: () => JSON.parse(text) }));
    });
    r.on("error", reject); if (data) r.write(data); r.end();
  });
}
const web = (method, url, token, body) => req("app.shopdomain.test", method, url, { token, body });

test("app.<domain> serves the web app on every page, and the API on the same address", async () => {
  for (const url of ["/", "/plans", "/product/abc", "/settings?x=1"]) {
    const r = await web("GET", url);
    assert.equal(r.status, 200, url);
    assert.match(r.text, /<div id=("root"|root)/i, url);
    assert.equal(r.headers["cache-control"], "no-cache");
  }
  const js = fs.readdirSync(path.join(WEBAPP_DIR, "_expo/static/js/web"))[0];
  const asset = await web("GET", `/_expo/static/js/web/${js}`);
  assert.equal(asset.status, 200);
  assert.match(asset.headers["cache-control"], /immutable/);
  // The API works from the web app's own address, and "app" never turns into a store.
  const signup = await web("POST", "/api/sellers", null, {});
  assert.equal(signup.status, 201);
  assert.ok(signup.json().token);
  assert.equal((await web("GET", "/api/me", signup.json().token)).status, 200);
  assert.equal((await web("POST", "/")).status, 404);
});

test("buying Lifetime on the website: Stripe Checkout, then Pro unlocks for good only once Stripe says it's paid", async () => {
  const { token, seller } = (await web("POST", "/api/sellers", null, {})).json();
  const offers = (await web("GET", "/api/billing/web/offers", token)).json();
  assert.equal(offers.enabled, true);
  assert.deepEqual(offers.offers.map((o) => [o.plan, o.price]), [["lifetime", "$499"], ["pro", "$99"]]);

  const r = (await web("POST", "/api/billing/web/checkout", token, { plan: "lifetime" })).json();
  assert.match(r.url, /^https:\/\/checkout\.stripe\.com\//);
  const s = created.at(-1);
  assert.equal(s.mode, "payment");
  assert.equal(s.line_items[0].price_data.unit_amount, 49900);
  assert.equal(s.metadata.snapfront_plan, "lifetime");
  assert.match(s.success_url, /^https:\/\/app\.shopdomain\.test\/plans\?checkout=done&session_id=\{CHECKOUT_SESSION_ID\}$/);

  // Back from Stripe before paying: still free.
  let me = (await web("POST", "/api/billing/web/confirm", token, { session_id: s.id })).json();
  assert.equal(me.account.plan, "free");
  // Paid: Pro, for good.
  Object.assign(s, { status: "complete", payment_status: "paid", payment_intent: "pi_1" });
  intents.set("pi_1", { id: "pi_1", latest_charge: { refunded: false } });
  me = (await web("POST", "/api/billing/web/confirm", token, { session_id: s.id })).json();
  assert.equal(me.account.plan, "pro");
  assert.equal((await web("POST", "/api/billing/web/checkout", token, { plan: "pro" })).status, 409);   // already has everything

  // Someone else can't claim this checkout.
  const other = (await web("POST", "/api/sellers", null, {})).json();
  assert.equal((await web("POST", "/api/billing/web/confirm", other.token, { session_id: s.id })).status, 409);
  assert.equal((await web("GET", "/api/me", other.token)).json().account.plan, "free");

  // Refunded: back to free on the next sync.
  intents.get("pi_1").latest_charge.refunded = true;
  db.prepare("UPDATE stripe_plan_purchases SET checked_at = datetime('now', '-1 hour')").run();
  me = (await web("POST", "/api/billing/sync", token)).json();
  assert.equal(me.account.plan, "free");
  assert.ok(seller.id);
});

test("Pro on the website follows the Stripe subscription, and deleting the account cancels it", async () => {
  const { token } = (await web("POST", "/api/sellers", null, {})).json();
  (await web("POST", "/api/billing/web/checkout", token, { plan: "pro" })).json();
  const s = created.at(-1);
  assert.equal(s.mode, "subscription");
  assert.deepEqual(s.line_items[0].price_data.recurring, { interval: "month" });
  assert.equal(s.line_items[0].price_data.unit_amount, 9900);

  const end = Math.floor(Date.now() / 1000) + 30 * 864e2;
  subs.set("sub_1", { id: "sub_1", status: "active", items: { data: [{ current_period_end: end }] } });
  Object.assign(s, { status: "complete", payment_status: "paid", subscription: "sub_1" });
  let me = (await web("POST", "/api/billing/web/confirm", token, { session_id: s.id })).json();
  assert.equal(me.account.plan, "pro");
  assert.equal((await web("POST", "/api/billing/web/checkout", token, { plan: "pro" })).status, 409);   // already has Pro

  const portal = (await web("POST", "/api/billing/web/portal", token)).json();
  assert.match(portal.url, /^https:\/\/billing\.stripe\.com\/p\/cus_/);

  // Canceled in Stripe: drops back to free on the next check.
  subs.get("sub_1").status = "canceled";
  db.prepare("UPDATE stripe_plan_purchases SET checked_at = datetime('now', '-1 hour')").run();
  me = (await web("POST", "/api/billing/sync", token)).json();
  assert.equal(me.account.plan, "free");

  // Active again (resubscribed), then the account is deleted: the subscription is canceled.
  subs.set("sub_2", { id: "sub_2", status: "active", current_period_end: end });
  (await web("POST", "/api/billing/web/checkout", token, { plan: "pro" })).json();
  Object.assign(created.at(-1), { status: "complete", payment_status: "paid", subscription: "sub_2" });
  me = (await web("POST", "/api/billing/web/confirm", token, { session_id: created.at(-1).id })).json();
  assert.equal(me.account.plan, "pro");
  assert.equal((await web("DELETE", "/api/me", token)).status, 204);
  await new Promise((r) => setTimeout(r, 50));
  assert.ok(canceled.includes("sub_2"));
});

test("a bad plan or a made-up checkout is refused", async () => {
  const { token } = (await web("POST", "/api/sellers", null, {})).json();
  assert.equal((await web("POST", "/api/billing/web/checkout", token, { plan: "gold" })).status, 400);
  assert.equal((await web("POST", "/api/billing/web/confirm", token, { session_id: "cs_made_up" })).status, 404);
  assert.equal((await web("POST", "/api/billing/web/portal", token)).status, 404);
});

test("the web app may call the API from its own address; other sites may not", async () => {
  const pre = await new Promise((resolve, reject) => {
    const r = http.request({ host: "127.0.0.1", port, method: "OPTIONS", path: "/api/me", headers: { Host: "shopdomain.test", Origin: "https://app.shopdomain.test", "Access-Control-Request-Headers": "authorization,x-store" } }, (res) => { res.resume(); res.on("end", () => resolve(res)); });
    r.on("error", reject); r.end();
  });
  assert.equal(pre.statusCode, 204);
  assert.equal(pre.headers["access-control-allow-origin"], "https://app.shopdomain.test");
  assert.match(pre.headers["access-control-allow-headers"], /Authorization/);
  const other = await new Promise((resolve, reject) => {
    const r = http.request({ host: "127.0.0.1", port, method: "GET", path: "/health", headers: { Host: "shopdomain.test", Origin: "https://evil.example" } }, (res) => { res.resume(); res.on("end", () => resolve(res)); });
    r.on("error", reject); r.end();
  });
  assert.equal(other.headers["access-control-allow-origin"], undefined);
});

test("paying on the website, then signing in with an email that already has an account, moves the plan there", async () => {
  const auth = await import("../src/auth.js");
  const sent = [];
  auth.setEmailSender(async (to, code) => { sent.push({ to, code }); });

  // The person's existing account (say, from the phone app), with their email on it.
  const phone = (await web("POST", "/api/sellers", null, {})).json();
  await web("POST", "/api/auth/email/start", phone.token, { email: "maya@example.com" });
  assert.equal((await web("POST", "/api/auth/email/verify", phone.token, { email: "maya@example.com", code: sent.at(-1).code })).json().status, "linked");

  // A fresh browser buys Launch on the website.
  const browser = (await web("POST", "/api/sellers", null, {})).json();
  const offers = (await web("GET", "/api/billing/web/offers", browser.token)).json();
  assert.equal(offers.android_url, "https://play.google.com/store/apps/details?id=com.sidebanc.snapfront");
  (await web("POST", "/api/billing/web/checkout", browser.token, { plan: "lifetime" })).json();
  const s = created.at(-1);
  Object.assign(s, { status: "complete", payment_status: "paid", payment_intent: "pi_maya", customer_details: { email: "maya@example.com" } });
  intents.set("pi_maya", { id: "pi_maya", latest_charge: { refunded: false } });
  const confirmed = (await web("POST", "/api/billing/web/confirm", browser.token, { session_id: s.id })).json();
  assert.equal(confirmed.account.plan, "pro");
  assert.equal(confirmed.checkout_email, "maya@example.com");

  // Saving the purchase to that email (with the emailed code) signs the browser in to her account, plan included.
  await web("POST", "/api/auth/email/start", browser.token, { email: "maya@example.com" });
  const v = (await web("POST", "/api/auth/email/verify", browser.token, { email: "maya@example.com", code: sent.at(-1).code })).json();
  assert.equal(v.status, "switched");
  assert.equal((await web("GET", "/api/me", v.token)).json().account.plan, "pro");
  assert.equal((await web("GET", "/api/me", phone.token)).json().account.plan, "pro");   // the phone sees it too
  // Later checks with Stripe still recognise the moved purchase (Stripe names the account that paid).
  db.prepare("UPDATE stripe_plan_purchases SET checked_at = datetime('now', '-1 hour')").run();
  assert.equal((await web("POST", "/api/billing/sync", v.token)).json().account.plan, "pro");
});

test("monthly subscribers can switch to Lifetime; the monthly plan then stops at the end of the month", async () => {
  const { token } = (await web("POST", "/api/sellers", null, {})).json();
  (await web("POST", "/api/billing/web/checkout", token, { plan: "pro" })).json();
  const end = Math.floor(Date.now() / 1000) + 30 * 864e2;
  subs.set("sub_9", { id: "sub_9", status: "active", current_period_end: end });
  Object.assign(created.at(-1), { status: "complete", payment_status: "paid", subscription: "sub_9" });
  assert.equal((await web("POST", "/api/billing/web/confirm", token, { session_id: created.at(-1).id })).json().account.plan, "pro");
  // Old "Get Launch" links now open Lifetime.
  assert.equal((await web("POST", "/api/billing/web/checkout", token, { plan: "launch" })).status, 200);
  const s = created.at(-1);
  assert.equal(s.metadata.snapfront_plan, "lifetime");
  Object.assign(s, { status: "complete", payment_status: "paid", payment_intent: "pi_9" });
  intents.set("pi_9", { id: "pi_9", latest_charge: { refunded: false } });
  await web("POST", "/api/billing/web/confirm", token, { session_id: s.id });
  assert.deepEqual(updated.at(-1), ["sub_9", { cancel_at_period_end: true }]);
  // Even when the monthly plan ends, Lifetime keeps Pro.
  subs.get("sub_9").status = "canceled";
  db.prepare("UPDATE stripe_plan_purchases SET checked_at = datetime('now', '-1 hour')").run();
  assert.equal((await web("POST", "/api/billing/sync", token)).json().account.plan, "pro");
});

test("Lifetime is for the first LIFETIME_LIMIT members, then Yearly ($499 a year) takes its place", async () => {
  const sold = () => db.prepare("SELECT COUNT(DISTINCT account_id) AS n FROM stripe_plan_purchases WHERE plan = 'lifetime' AND status = 'active'").get().n;
  const buyer = (await web("POST", "/api/sellers", null, {})).json();
  let offers = (await web("GET", "/api/billing/web/offers", buyer.token)).json().offers;
  assert.equal(offers[0].plan, "lifetime");
  assert.equal(offers[0].limit, 500);
  assert.equal(offers[0].left, 500 - sold());
  // Before the spots are gone, Yearly can't be bought.
  assert.equal((await web("POST", "/api/billing/web/checkout", buyer.token, { plan: "yearly" })).status, 409);

  process.env.LIFETIME_LIMIT = String(sold());   // every founding spot taken
  try {
    offers = (await web("GET", "/api/billing/web/offers", buyer.token)).json().offers;
    assert.deepEqual(offers.map((o) => [o.plan, o.price]), [["yearly", "$499"], ["pro", "$99"]]);
    const closed = await web("POST", "/api/billing/web/checkout", buyer.token, { plan: "lifetime" });
    assert.equal(closed.status, 409);
    assert.match(closed.json().error, /founding Lifetime memberships are taken/);
    const r = await web("POST", "/api/billing/web/checkout", buyer.token, { plan: "yearly" });
    assert.equal(r.status, 200);
    const s = created.at(-1);
    assert.equal(s.mode, "subscription");
    assert.equal(s.line_items[0].price_data.unit_amount, 49900);
    assert.deepEqual(s.line_items[0].price_data.recurring, { interval: "year" });
    assert.equal(s.allow_promotion_codes, true);
    // The home page and the sales page follow.
    const home = (await req("shopdomain.test", "GET", "/")).text;
    assert.match(home, /plans\?buy=yearly">Join for \$499 a year</);
    assert.doesNotMatch(home, /FOUNDING 500/);
    assert.doesNotMatch(home, /Pay your way at checkout/, "pay-later badges are for the one-time Lifetime price only");
    assert.match((await req("shopdomain.test", "GET", "/join")).text, /Get Yearly for \$499/);
  } finally { delete process.env.LIFETIME_LIMIT; }
  const home = (await req("shopdomain.test", "GET", "/")).text;
  assert.match(home, /FOUNDING 500/);
  assert.match(home, /founding spots left/);
  assert.match(home, /Pay your way at checkout/);
  for (const name of ["Klarna", "Afterpay", "Cash App Pay", "Apple Pay"]) assert.ok(home.includes(`>${name}</li>`), name);
  assert.doesNotMatch(home, />Affirm</, "Affirm isn't available on the Stripe account yet");
  assert.match(home, /4 payments of \$124\.75 with Klarna or Afterpay, if you're approved/);
});

test("search engines get robots.txt, a sitemap, canonical links and structured data", async () => {
  const robots = await req("shopdomain.test", "GET", "/robots.txt");
  assert.match(robots.text, /Disallow: \/api\//);
  assert.match(robots.text, /Sitemap: https:\/\/shopdomain\.test\/sitemap\.xml/);
  const map = (await req("shopdomain.test", "GET", "/sitemap.xml")).text;
  for (const p of ["/", "/join", "/themes", "/help", "/connect-ai"]) assert.ok(map.includes(`<loc>https://shopdomain.test${p}</loc>`), p);
  const home = (await req("shopdomain.test", "GET", "/")).text;
  assert.match(home, /<link rel="canonical" href="https:\/\/shopdomain\.test\/">/);
  assert.match(home, /twitter:card/);
  const ld = JSON.parse(home.match(/<script type="application\/ld\+json">(.*?)<\/script>/)[1]);
  const types = ld["@graph"].map((g) => g["@type"]);
  assert.deepEqual(types, ["Organization", "WebSite", "SoftwareApplication", "VideoObject"]);
  assert.equal(ld["@graph"][2].offers[0].price, "499.00");
  assert.doesNotMatch(home, /Concept artwork/);
  assert.ok((home.match(/<video class="loop"/g) || []).length >= 9, "the cards have their animations");
  const help = (await req("shopdomain.test", "GET", "/help")).text;
  const faq = JSON.parse(help.match(/<script type="application\/ld\+json">(.*?)<\/script>/)[1]);
  assert.equal(faq["@type"], "FAQPage");
  assert.ok(faq.mainEntity.length > 40);
  assert.match(help, /<link rel="canonical" href="https:\/\/shopdomain\.test\/help">/);
});

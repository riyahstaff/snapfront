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
let created = [], customers = 0, canceled = [];
pay.setStripeClient({
  customers: { async create(p) { customers++; return { id: `cus_${customers}`, ...p }; } },
  checkout: { sessions: {
    async create(p) { const id = `cs_plan_${sessions.size + 1}`; const s = { id, url: `https://checkout.stripe.com/c/${id}`, status: "open", payment_status: "unpaid", ...p }; sessions.set(id, s); created.push(s); return s; },
    async retrieve(id) { const s = sessions.get(id); if (!s) { const e = new Error("No such session"); e.statusCode = 404; throw e; } return s; },
  } },
  subscriptions: {
    async retrieve(id) { return subs.get(id); },
    async cancel(id) { canceled.push(id); subs.get(id).status = "canceled"; return subs.get(id); },
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

test("buying Launch on the website: Stripe Checkout, then the plan unlocks only once Stripe says it's paid", async () => {
  const { token, seller } = (await web("POST", "/api/sellers", null, {})).json();
  const offers = (await web("GET", "/api/billing/web/offers", token)).json();
  assert.equal(offers.enabled, true);
  assert.deepEqual(offers.offers.map((o) => [o.plan, o.price]), [["launch", "$29"], ["pro", "$14.99"]]);

  const r = (await web("POST", "/api/billing/web/checkout", token, { plan: "launch" })).json();
  assert.match(r.url, /^https:\/\/checkout\.stripe\.com\//);
  const s = created.at(-1);
  assert.equal(s.mode, "payment");
  assert.equal(s.line_items[0].price_data.unit_amount, 2900);
  assert.equal(s.metadata.snapfront_plan, "launch");
  assert.match(s.success_url, /^https:\/\/app\.shopdomain\.test\/plans\?checkout=done&session_id=\{CHECKOUT_SESSION_ID\}$/);

  // Back from Stripe before paying: still free.
  let me = (await web("POST", "/api/billing/web/confirm", token, { session_id: s.id })).json();
  assert.equal(me.account.plan, "free");
  // Paid: Launch.
  Object.assign(s, { status: "complete", payment_status: "paid", payment_intent: "pi_1" });
  intents.set("pi_1", { id: "pi_1", latest_charge: { refunded: false } });
  me = (await web("POST", "/api/billing/web/confirm", token, { session_id: s.id })).json();
  assert.equal(me.account.plan, "launch");

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
  assert.equal(s.line_items[0].price_data.unit_amount, 1499);

  const end = Math.floor(Date.now() / 1000) + 30 * 864e2;
  subs.set("sub_1", { id: "sub_1", status: "active", items: { data: [{ current_period_end: end }] } });
  Object.assign(s, { status: "complete", payment_status: "paid", subscription: "sub_1" });
  let me = (await web("POST", "/api/billing/web/confirm", token, { session_id: s.id })).json();
  assert.equal(me.account.plan, "pro");
  assert.equal((await web("POST", "/api/billing/web/checkout", token, { plan: "launch" })).status, 409);   // already has Pro

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

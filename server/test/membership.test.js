// Membership starts on the website: the home page leads to joining (free try is a quiet link), the
// phone app sells nothing (its "needs Pro" messages name no prices), and Google Play sales can be
// switched off for good once the app without buying is live.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-membership-"));
process.env.ADMIN_TOKEN = "admin_test_secret";
process.env.DATA_DIR = tmp;
process.env.PUBLIC_URL = "https://shopdomain.test";
process.env.STORE_DOMAIN = "shopdomain.test";
process.env.STRIPE_SECRET_KEY = "";
const { privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
process.env.GOOGLE_PLAY_SERVICE_ACCOUNT = Buffer.from(JSON.stringify({ client_email: "billing@snapfront.iam.gserviceaccount.com",
  private_key: privateKey.export({ type: "pkcs8", format: "pem" }) })).toString("base64");

const { app } = await import("../src/index.js");
const plans = await import("../src/plans.js");
const playbilling = await import("../src/playbilling.js");

const calls = [];
playbilling.setPlayFetch(async (url, opts = {}) => {
  const reply = (status, body) => ({ ok: status < 300, status, json: async () => body, text: async () => JSON.stringify(body) });
  if (url === "https://oauth2.googleapis.com/token") return reply(200, { access_token: "ya29.test", expires_in: 3600 });
  calls.push([opts.method || "GET", url.replace(/^.*\/applications\/com\.sidebanc\.snapfront/, ""), opts.body ? JSON.parse(opts.body) : null]);
  return reply(200, {});
});

let server, base;
before(async () => { server = app.listen(0); await new Promise((r) => server.once("listening", r)); base = `http://127.0.0.1:${server.address().port}`; });
after(() => { server.close(); fs.rmSync(tmp, { recursive: true, force: true }); });
const call = (method, url, { token, body, headers = {} } = {}) => fetch(base + url, {
  method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
  body: body === undefined ? undefined : JSON.stringify(body),
});

test("the home page leads to becoming a member; trying it free is a quiet link", async () => {
  const html = await (await call("GET", "/")).text();
  assert.match(html, /href="#pricing">Become a member</);
  assert.match(html, /href="https:\/\/app\.shopdomain\.test\/sign-in">Sign in</);
  assert.match(html, /href="https:\/\/app\.shopdomain\.test\/plans\?buy=lifetime">Join for \$299</);
  assert.match(html, /href="https:\/\/app\.shopdomain\.test\/plans\?buy=pro">Join for \$69 a month</);
  assert.match(html, /class="quiet-link">Try the creative tools free/);
  assert.doesNotMatch(html, /<h3>Free<\/h3>|\$0</, "no free plan card");
});

test("the phone app's 'needs Pro' messages name no prices; the website's do", async () => {
  const { token } = await (await call("POST", "/api/sellers", { body: {} })).json();
  const web = await call("POST", "/api/stripe/onboard", { token });
  assert.equal(web.status, 402);
  assert.match((await web.json()).error, /\$299 for life or \$69 a month/);
  const phone = await call("POST", "/api/stripe/onboard", { token, headers: { "X-Snapfront-App": "android" } });
  assert.equal(phone.status, 402);
  const body = await phone.json();
  assert.equal(body.error, "Taking payments comes with Snapfront Pro.");
  assert.equal(body.upgrade, "pro");

  // Every 402 the server can send reads cleanly in the app, without a price or "get"/"upgrade".
  const line = `(${(await import("../src/webbilling.js")).priceLine()})`;
  for (const m of [
    `You've used your free AI product pages. Get Snapfront Pro ${line} to keep creating and go live.`,
    `Get Snapfront Pro ${line} to publish your store and start selling.`,
    "Upgrade to Pro to run up to 10 stores.",
    "Your plan covers fewer live stores. Upgrade to Pro to sell from up to 10 stores.",
    "You've used your free image studio allowance. Get Snapfront Pro to keep creating.",
    "You've used this month's AI product pages. Pro gives you far more.",
  ]) {
    const out = plans.appWording(m);
    assert.doesNotMatch(out, /\$|\bGet\b|Upgrade/, out);
    assert.ok(out.length > 20, out);
  }
  assert.equal(plans.appWording("AutoDM comes with Pro."), "AutoDM comes with Pro.");
});

test("Google Play sales can be switched off: both memberships stop selling and stay off", async () => {
  assert.equal(playbilling.salesStopped(), false);
  assert.equal((await call("POST", "/api/admin/play/stop-sales")).status, 401);
  const r = await call("POST", "/api/admin/play/stop-sales", { headers: { Authorization: "Bearer admin_test_secret" } });
  assert.equal(r.status, 200);
  const paths = calls.map((c) => c[1]);
  assert.ok(paths.includes("/subscriptions/snapfront_pro/basePlans/pro-monthly-69:deactivate"));
  assert.ok(paths.includes("/subscriptions/snapfront_pro/basePlans/monthly:deactivate"));
  const once = calls.filter((c) => c[1].endsWith("/purchaseOptions:batchUpdateStates")).map((c) => c[2].requests[0].deactivatePurchaseOptionRequest.productId);
  assert.deepEqual(once.sort(), ["snapfront_launch", "snapfront_lifetime"]);
  assert.equal(playbilling.salesStopped(), true);
  // Startup no longer puts them back on sale.
  calls.length = 0;
  assert.equal(await playbilling.ensureProducts(), false);
  assert.equal(calls.length, 0);
});

test("owner emails always have full access, even on a brand-new account", async () => {
  const { config } = await import("../src/config.js");
  const auth = await import("../src/auth.js");
  config.ownerEmails = ["owner@example.com"];
  let code = null;
  auth.setEmailSender(async (_to, c) => { code = c; });
  const { token } = await (await call("POST", "/api/sellers", { body: {} })).json();
  assert.equal((await (await call("GET", "/api/me", { token })).json()).account.plan, "free");
  assert.equal((await call("POST", "/api/auth/email/start", { token, body: { email: "Owner@Example.com" } })).status, 200);
  assert.equal((await call("POST", "/api/auth/email/verify", { token, body: { email: "owner@example.com", code } })).status, 200);
  const me = await (await call("GET", "/api/me", { token })).json();
  assert.equal(me.account.plan, "pro");
  // Someone else stays on the free plan.
  const other = (await (await call("POST", "/api/sellers", { body: {} })).json()).token;
  await call("POST", "/api/auth/email/start", { token: other, body: { email: "someone@example.com" } });
  await call("POST", "/api/auth/email/verify", { token: other, body: { email: "someone@example.com", code } });
  assert.equal((await (await call("GET", "/api/me", { token: other })).json()).account.plan, "free");
  config.ownerEmails = [];
});

test("a reviewer's login works with its fixed code and sends no email; nobody else's does", async () => {
  const { config } = await import("../src/config.js");
  const auth = await import("../src/auth.js");
  config.reviewLogins = new Map([["reviewer@example.com", "482913"]]);
  config.ownerEmails = ["reviewer@example.com"];
  const sent = [];
  auth.setEmailSender(async (to, c) => { sent.push([to, c]); });
  const { token } = await (await call("POST", "/api/sellers", { body: {} })).json();
  assert.equal((await call("POST", "/api/auth/email/start", { token, body: { email: "Reviewer@Example.com" } })).status, 200);
  assert.deepEqual(sent, [], "no email for the review login");
  assert.equal((await call("POST", "/api/auth/email/verify", { token, body: { email: "reviewer@example.com", code: "111111" } })).status, 400);
  assert.equal((await call("POST", "/api/auth/email/verify", { token, body: { email: "reviewer@example.com", code: "482913" } })).status, 200);
  assert.equal((await (await call("GET", "/api/me", { token })).json()).account.plan, "pro", "the reviewer sees the full membership");
  // The fixed code means nothing for any other email, which gets a normal emailed code.
  const other = (await (await call("POST", "/api/sellers", { body: {} })).json()).token;
  await call("POST", "/api/auth/email/start", { token: other, body: { email: "someone-else@example.com" } });
  assert.equal(sent.length, 1);
  assert.notEqual(sent[0][1], "482913");
  assert.equal((await call("POST", "/api/auth/email/verify", { token: other, body: { email: "someone-else@example.com", code: "482913" } })).status, 400);
  // Wrong guesses are still limited.
  const third = (await (await call("POST", "/api/sellers", { body: {} })).json()).token;
  await call("POST", "/api/auth/email/start", { token: third, body: { email: "reviewer@example.com" } });
  for (let i = 0; i < 5; i++) await call("POST", "/api/auth/email/verify", { token: third, body: { email: "reviewer@example.com", code: "000000" } });
  assert.equal((await call("POST", "/api/auth/email/verify", { token: third, body: { email: "reviewer@example.com", code: "482913" } })).status, 429);
  config.reviewLogins = new Map(); config.ownerEmails = [];
});

test("the owner's usage report counts each feature's records and needs the admin token", async () => {
  assert.equal((await call("GET", "/api/admin/usage")).status, 401);
  const r = await call("GET", "/api/admin/usage", { headers: { Authorization: "Bearer admin_test_secret" } });
  assert.equal(r.status, 200);
  const { tables } = await r.json();
  assert.ok(tables.accounts.rows >= 1);
  assert.ok(tables.sellers.first, "first and last use come from created_at");
  assert.equal(typeof tables.products.rows, "number");
  assert.ok(!JSON.stringify(tables).includes("@example.com"), "no customer data, only counts");
});

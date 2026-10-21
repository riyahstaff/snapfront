// The Snapfront membership sales page (snapfront.app/join and /join/CODE) and the membership
// card a partner can add to their own link-in-bio page.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-membership-page-"));
Object.assign(process.env, { DATA_DIR: tmp, PUBLIC_URL: "https://snapfront.test", STORE_DOMAIN: "snapfront.test", STRIPE_SECRET_KEY: "sk_test_fake" });
delete process.env.PLAN_PAY_LATER;

const { app } = await import("../src/index.js");
const { db } = await import("../src/db.js");
const salesPage = await import("../src/sales-page.js");

let server, base;
before(async () => { server = app.listen(0); await new Promise((r) => server.once("listening", r)); base = `http://127.0.0.1:${server.address().port}`; });
after(() => { server.close(); fs.rmSync(tmp, { recursive: true, force: true }); delete process.env.PLAN_PAY_LATER; });
async function call(token, method, url, body, headers = {}) {
  const r = await fetch(base + url, { method, redirect: "manual", headers: { "Content-Type": "application/json", Host: "snapfront.test", "User-Agent": "Mozilla/5.0", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
  const text = await r.text();
  return { status: r.status, headers: r.headers, json: () => JSON.parse(text), text };
}
/** A page on a store's own address (fetch can't set the Host header, so use http directly). */
function storePage(host, pathname) {
  return new Promise((resolve, reject) => {
    const r = http.request({ host: "127.0.0.1", port: server.address().port, method: "GET", path: pathname, headers: { Host: host, "User-Agent": "Mozilla/5.0" } }, (res) => {
      let text = ""; res.setEncoding("utf8"); res.on("data", (d) => { text += d; }); res.on("end", () => resolve({ status: res.statusCode, text }));
    });
    r.on("error", reject); r.end();
  });
}
const visible = (html) => html.replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ");

test("/join sells the membership with live prices and no income claims", async () => {
  const r = await call(null, "GET", "/join");
  assert.equal(r.status, 200);
  const text = visible(r.text);
  assert.match(text, /Skip the course\./);
  assert.match(text, /\$499/);
  assert.match(text, /\$99/);
  assert.match(text, /500 Lifetime spots left/);
  assert.match(r.text, /https:\/\/app\.snapfront\.test\/plans\?buy=lifetime"/);
  assert.match(r.text, /https:\/\/app\.snapfront\.test\/plans\?buy=pro"/);
  assert.match(text, /All sales are final/);
  // The built-in community is a selling point, without naming a price for anyone else's product.
  assert.match(text, /A private community\.\s*No extra subscription\./);
  assert.match(text, /Leaderboard &amp; levels/);
  assert.doesNotMatch(text, /Skool[^.]*\$\d/);
  // No partner on the plain page, and no promises of income or fake "was" prices.
  assert.doesNotMatch(text, /earns a commission if you join/);
  assert.doesNotMatch(text, /\$\d[\d,]*k?\s*(a|per)\s*month(s)?\s*(just|from)|\$[\d,]+\s*by|already made/i);
  assert.doesNotMatch(r.text, /<s>|line-through|\$997/);
  // Pay in 4 is only mentioned when it's switched on.
  assert.doesNotMatch(text, /Klarna|Afterpay/);
});

test("pay-later wording appears only when PLAN_PAY_LATER is set, with the real split", async () => {
  process.env.PLAN_PAY_LATER = "klarna, afterpay, nonsense";
  const later = salesPage.payLater();
  assert.deepEqual(later.providers, ["Klarna", "Afterpay"]);
  assert.equal(later.per, "$124.75");
  const text = visible((await call(null, "GET", "/join")).text);
  assert.match(text, /4 payments of \$124\.75 with Klarna or Afterpay/);
  delete process.env.PLAN_PAY_LATER;
});

let partner, code, slug;
test("/join/CODE counts the click, remembers the partner for checkout and discloses the commission", async () => {
  partner = (await call(null, "POST", "/api/sellers", {})).json();
  db.prepare("UPDATE accounts SET email = 'jo@example.com' WHERE id = ?").run(partner.account.id);
  const v = (await call(partner.token, "POST", "/api/partners/join", { agree: true, code: "jo" })).json();
  code = v.code;
  assert.equal(v.sales_link, `https://snapfront.test/join/${code}`);
  assert.deepEqual(v.bio_card, { on: false, store_name: v.bio_card.store_name });

  const r = await call(null, "GET", `/join/${code.toLowerCase()}`);
  assert.equal(r.status, 200);
  assert.match(r.headers.get("set-cookie"), new RegExp(`^sf_via=${code}\\.\\d+;`));
  assert.match(visible(r.text), new RegExp(`Shared by\\s+${code}\\s*, a Snapfront partner who earns a commission`));
  assert.match(r.text, new RegExp(`plans\\?buy=lifetime&amp;via=${code}"`));
  assert.match(r.text, /<meta name="robots" content="noindex">/);
  assert.equal((await call(partner.token, "GET", "/api/partners/me")).json().stats.clicks, 1);

  // An unknown or suspended code falls back to the plain page.
  const bad = await call(null, "GET", "/join/NOPE123");
  assert.equal(bad.status, 302);
  assert.equal(bad.headers.get("location"), "/join");
});

test("partners can put a membership card on their link-in-bio page; it always discloses the commission", async () => {
  const me = (await call(partner.token, "GET", "/api/me")).json();
  slug = me.seller?.store_slug ?? me.store_slug;
  assert.ok(slug, JSON.stringify(me).slice(0, 300));
  // A store's pages live on its own address (slug.snapfront.test).
  const links = () => storePage(`${slug}.snapfront.test`, "/links");
  let page = await links();
  assert.equal(page.status, 200);
  assert.doesNotMatch(page.text, /Snapfront membership/);

  const on = (await call(partner.token, "PUT", "/api/partners/bio-card", { on: true })).json();
  assert.equal(on.bio_card.on, true);
  page = await links();
  assert.match(page.text, new RegExp(`href="https://snapfront\\.test/join/${code}"`));
  assert.match(visible(page.text), /Snapfront membership/);
  assert.match(visible(page.text), /I earn a commission if you join/);
  assert.match(visible(page.text), /\$499 for life · or \$99\/month/);

  // Suspended partners lose the card at once, and can't switch it back on.
  db.prepare("UPDATE partners SET status = 'suspended' WHERE account_id = ?").run(partner.account.id);
  assert.doesNotMatch((await links()).text, /Snapfront membership/);
  assert.equal((await call(partner.token, "PUT", "/api/partners/bio-card", { on: true })).status, 403);
  db.prepare("UPDATE partners SET status = 'active' WHERE account_id = ?").run(partner.account.id);

  const off = (await call(partner.token, "PUT", "/api/partners/bio-card", { on: false })).json();
  assert.equal(off.bio_card.on, false);
  assert.doesNotMatch((await links()).text, /Snapfront membership/);
});

test("someone who isn't a partner can't turn the card on", async () => {
  const other = (await call(null, "POST", "/api/sellers", {})).json();
  assert.equal((await call(other.token, "PUT", "/api/partners/bio-card", { on: true })).status, 404);
  assert.equal((await call(other.token, "GET", "/api/partners/me")).json().joined, false);
});

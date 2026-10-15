// While the Meta app is in Development mode, posting and AutoDM can be on for the owner's own
// accounts only (META_PUBLISHING_ENABLED=owners, META_AUTODM_ENABLED=owners).
import { test } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-meta-owners-"));
process.env.PUBLIC_URL = "https://shopdomain.test";
process.env.META_APP_ID = "123";
process.env.META_APP_SECRET = "secret";
process.env.META_LOGIN_CONFIG_ID = "456";
process.env.META_TOKEN_ENCRYPTION_KEY = crypto.randomBytes(32).toString("base64");
process.env.META_WEBHOOK_VERIFY_TOKEN = "verify";
process.env.META_PUBLISHING_ENABLED = "owners";
process.env.META_AUTODM_ENABLED = "owners";
process.env.OWNER_EMAILS = "owner@example.com";

const { db } = await import("../src/db.js");
const plans = await import("../src/plans.js");
const social = await import("../src/social.js");
const autodm = await import("../src/autodm.js");

function seller(email) {
  const { account, store } = plans.createAccountWithStore("Shop");
  if (email) db.prepare("UPDATE accounts SET email = ? WHERE id = ?").run(email, account.id);
  return db.prepare("SELECT * FROM sellers WHERE id = ?").get(store.id);
}

test("owners-only: the owner can connect and post; other members see 'coming soon'", () => {
  const owner = seller("owner@example.com"), member = seller("member@example.com");
  assert.equal(social.publishingFor(owner), true);
  assert.equal(social.publishingFor(member), false);
  assert.equal(social.accounts(owner).enabled, true);
  assert.deepEqual(social.accounts(member), { enabled: false, setup_required: social.SELLER_SETUP_MESSAGE, accounts: [] });
  assert.match(social.authorize(owner, plans.getAccount(owner.account_id)).url, /facebook\.com\/v[\d.]+\/dialog\/oauth/);
  assert.throws(() => social.authorize(member, plans.getAccount(member.account_id)), (e) => e.status === 503);
  assert.equal(autodm.status(owner).blocker, "connect_instagram");
  assert.equal(autodm.status(member).blocker, "pending_meta");
});

test("a connection started on the website comes back to a web page; the app's comes back to the app", async () => {
  const owner = db.prepare("SELECT s.* FROM sellers s JOIN accounts a ON a.id = s.account_id WHERE a.email = 'owner@example.com'").get();
  const acct = plans.getAccount(owner.account_id);
  const web = social.authorize(owner, acct, { web: true });
  assert.equal(web.redirect_url, "https://shopdomain.test/social/meta/done");
  const webState = new URL(web.url).searchParams.get("state");
  assert.equal(social.stateClient(webState), "web");
  const app = social.authorize(owner, acct);
  assert.equal(app.redirect_url, "snapfront://marketing");
  assert.equal(social.stateClient(new URL(app.url).searchParams.get("state")), "app");

  const { app: server } = await import("../src/index.js");
  const s = server.listen(0); await new Promise((r) => s.once("listening", r));
  const base = `http://127.0.0.1:${s.address().port}`;
  try {
    const app2 = social.authorize(owner, acct, { web: true });
    const st = new URL(app2.url).searchParams.get("state");
    const r = await fetch(`${base}/social/meta/callback?state=${encodeURIComponent(st)}&error=access_denied`, { redirect: "manual" });
    assert.equal(r.status, 303);
    assert.equal(r.headers.get("location"), "/social/meta/done?social=error");
    const done = await (await fetch(`${base}/social/meta/done?social=connected`)).text();
    assert.match(done, /<h1>Connected<\/h1>/);
    assert.match(done, /window\.close\(\)/);
  } finally { s.close(); }
});

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

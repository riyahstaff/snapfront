import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-social-config-"));
process.env.DATA_DIR = tmp;
process.env.PUBLIC_URL = "http://not-https.test";
process.env.META_APP_ID = "disabled-app";
process.env.META_APP_SECRET = "disabled-secret";
process.env.META_LOGIN_CONFIG_ID = "disabled-config";
process.env.META_TOKEN_ENCRYPTION_KEY = Buffer.alloc(31, 9).toString("base64");
process.env.META_PUBLISHING_ENABLED = "false";

const { app } = await import("../src/index.js");
const social = await import("../src/social.js");

let server;
let base;
before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => {
  server.close();
  social.setMetaTransport(null);
  fs.rmSync(tmp, { recursive: true, force: true });
});
async function request(method, url, body, token) {
  const response = await fetch(base + url, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

test("disabled publishing, malformed encryption material, and non-HTTPS public URLs are hard guards", async () => {
  let graphTouched = false;
  social.setMetaTransport(async () => { graphTouched = true; throw new Error("Meta must not be reached while configuration is disabled"); });
  assert.equal(social.oauthReady(), false);
  assert.equal(social.publishingReady(), false);
  assert.match(social.setupRequired(), /META_TOKEN_ENCRYPTION_KEY/);
  assert.match(social.setupRequired(), /HTTPS PUBLIC_URL/);

  const created = await request("POST", "/api/sellers", { store_name: "Disabled social" });
  assert.equal(created.status, 201);
  const accounts = await request("GET", "/api/social/accounts", undefined, created.body.token);
  assert.deepEqual(accounts.body, {
    enabled: false,
    setup_required: social.setupRequired(),
    accounts: [],
  });
  const authorize = await request("POST", "/api/social/authorize", {}, created.body.token);
  assert.equal(authorize.status, 503);
  assert.match(authorize.body.error, /META_TOKEN_ENCRYPTION_KEY/);
  assert.equal(graphTouched, false);
});

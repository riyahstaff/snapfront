// When Runpod's balance runs out: members see a calm "paused" message, the owner sees what to do,
// and the owner gets one email (not one per failed request).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-rpempty-"));
Object.assign(process.env, { DATA_DIR: tmp, PUBLIC_URL: "https://rp.test", RUNPOD_API_KEY: "rp_test", OWNER_EMAILS: "owner@example.com", STRIPE_SECRET_KEY: "" });
const { app } = await import("../src/index.js");
const { db } = await import("../src/db.js");
const aimedia = await import("../src/aimedia.js");
const snapcare = await import("../src/snapcare.js");

const mails = [];
snapcare.setMailer(async (to, subject) => { mails.push({ to, subject }); return true; });
aimedia.setRunpodFetch(async () => ({ ok: false, status: 402, json: async () => ({ status: 402, title: "Insufficient Balance", detail: "insufficient balance" }) }));
let server, base;
before(async () => { server = app.listen(0); await new Promise((r) => server.once("listening", r)); base = `http://127.0.0.1:${server.address().port}`; });
after(() => { server.close(); fs.rmSync(tmp, { recursive: true, force: true }); });
async function member(email) {
  const s = await (await fetch(`${base}/api/sellers`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" })).json();
  db.prepare("UPDATE accounts SET plan = 'pro', email = ? WHERE id = ?").run(email, s.account.id);
  return s.token;
}
const make = (token) => fetch(`${base}/api/avatars`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify({ style: "soft3d", name: "Nova", look: "lilac hoodie" }) });

test("out of Runpod money: calm words for members, clear ones for the owner, one email", async () => {
  aimedia.onOutOfCredit(() => snapcare.notifyOwners("Snapfront: Runpod is out of money", "Add funds."));
  const m = await make(await member("member@example.com"));
  assert.equal(m.status, 503);
  const mb = await m.json();
  assert.match(mb.error, /paused for a little while/);
  assert.equal(mb.runpod, undefined, "members never see Runpod's details");
  const o = await make(await member("owner@example.com"));
  assert.equal(o.status, 503);
  assert.equal((await o.json()).error, aimedia.OWNER_EMPTY);
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(mails.length, 1, "one email, not one per request");
  assert.deepEqual(mails[0].to, ["owner@example.com"]);
  assert.match(mails[0].subject, /Runpod is out of money/);
});

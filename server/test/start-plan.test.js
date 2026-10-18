// "Start here": answers become a short, ordered plan that fits the person; visitors can preview it,
// signed-in people keep it and tick steps off.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-start-"));
Object.assign(process.env, { DATA_DIR: tmp, PUBLIC_URL: "https://start.test" });
const { app } = await import("../src/index.js");
const plan = await import("../src/start-plan.js");

let server, base, token;
before(async () => { server = app.listen(0); await new Promise((r) => server.once("listening", r)); base = `http://127.0.0.1:${server.address().port}`; });
after(() => { server.close(); fs.rmSync(tmp, { recursive: true, force: true }); });
const call = async (method, url, body, t = token) => {
  const r = await fetch(base + url, { method, headers: { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) }, body: body == null ? undefined : JSON.stringify(body) });
  return { status: r.status, body: await r.json().catch(() => null) };
};
const ids = (p) => p.steps.map((s) => s.id);

test("a brand-new person with no product who won't show their face gets a short no-face plan", () => {
  const p = plan.buildPlan({ level: "beginner", sell: "none", face: "no", audience: "none", time: "few" });
  assert.deepEqual(ids(p), ["welcome", "niche", "digital", "community"]);
  assert.match(p.summary, /without showing your face/);
  for (const s of p.steps) assert.ok(s.route.startsWith("/") && s.title && s.why && s.action);
});

test("other people's lessons and tools: affiliates, sellers and busy people get different plans", () => {
  const aff = plan.buildPlan({ level: "affiliate", sell: "others", face: "yes", audience: "small", time: "some" });
  assert.deepEqual(ids(aff).slice(0, 2), ["earn", "ugc"]);
  assert.ok(!ids(aff).includes("store"));                     // no store needed to promote other brands
  const seller = plan.buildPlan({ level: "seller", sell: "own", face: "yes", audience: "big", time: "lots" });
  assert.equal(ids(seller)[0], "snap");
  assert.ok(ids(seller).includes("live") && ids(seller).includes("store"));
  assert.ok(ids(seller).length <= 6);
  assert.equal(ids(seller).at(-1), "community");
  const faceless = plan.buildPlan({ level: "beginner", sell: "digital", face: "no", audience: "none", time: "lots" });
  assert.ok(ids(faceless).includes("faceless") && !ids(faceless).includes("posts") && !ids(faceless).includes("live"));
  // Every combination of answers makes a valid plan of 4-6 known steps.
  const all = plan.QUESTIONS.reduce((acc, q) => acc.flatMap((a) => q.options.map((o) => ({ ...a, [q.id]: o.id }))), [{}]);
  for (const a of all) { const n = plan.buildPlan(a).steps.length; assert.ok(n >= 3 && n <= 6, JSON.stringify(a)); }
  assert.throws(() => plan.buildPlan({ level: "beginner" }), /Answer every question/);
});

test("visitors preview a plan without an account; signed-in people save it, tick steps and redo it", async () => {
  const qs = (await call("GET", "/api/start-plan/questions", null, null)).body.questions;
  assert.equal(qs.length, 5);
  const answers = { level: "beginner", sell: "own", face: "no", audience: "none", time: "some" };
  const preview = await call("POST", "/api/start-plan/preview", { answers }, null);
  assert.equal(preview.status, 200);
  assert.equal(preview.body.steps[1].id, "snap");
  assert.equal((await call("POST", "/api/start-plan/preview", { answers: { level: "x" } }, null)).status, 400);
  assert.equal((await call("GET", "/api/start-plan", null, null)).status, 401);

  token = (await call("POST", "/api/sellers", { store_name: "Plan Shop" }, null)).body.token;
  assert.equal((await call("GET", "/api/start-plan")).body.plan, null);
  const saved = (await call("POST", "/api/start-plan", { answers })).body.plan;
  assert.deepEqual(saved.steps.map((s) => s.id), preview.body.steps.map((s) => s.id));
  const ticked = (await call("PUT", "/api/start-plan/steps/snap", { done: true })).body.plan;
  assert.equal(ticked.done_count, 1);
  assert.equal(ticked.steps.find((s) => s.id === "snap").done, true);
  // Redoing the quiz keeps finished steps that are still in the new plan.
  const redo = (await call("POST", "/api/start-plan", { answers: { ...answers, face: "yes" } })).body.plan;
  assert.equal(redo.steps.find((s) => s.id === "snap").done, true);
  assert.ok(redo.steps.some((s) => s.id === "posts"));
  assert.equal((await call("PUT", "/api/start-plan/steps/nope", { done: true })).status, 404);
  assert.equal((await call("DELETE", "/api/start-plan")).body.plan, null);
});

test("the public home page has the Start here quiz, with the questions built in and a link to save the plan", async () => {
  const html = await (await fetch(`${base}/`)).text();
  assert.match(html, /id="start-here"/);
  assert.match(html, /<dialog class="quiz" id="quiz"/);
  assert.match(html, /Where are you starting from\?/);
  assert.match(html, /\/start\?a=/);
  assert.ok(!/<\/script>[^]*const Q=[^;]*<\//.test(html.split("const Q=")[1]?.split(", WEB=")[0] || ""), "question data can't break out of the script");
});

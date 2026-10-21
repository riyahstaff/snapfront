// The home page shows the AI team (Vierra, the Claude/ChatGPT connector, Bonus: 1k Prompts) and
// lists them in both membership plans.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-landing-"));
process.env.DATA_DIR = tmp;
process.env.STRIPE_SECRET_KEY = "";
process.env.ELEVENLABS_API_KEY = "test-eleven-key";
const { app } = await import("../src/index.js");
let base, server;
before(async () => { server = app.listen(0); await new Promise((r) => server.once("listening", r)); base = `http://127.0.0.1:${server.address().port}`; });
after(() => { server?.close(); fs.rmSync(tmp, { recursive: true, force: true }); });

test("the home page introduces the AI team with working links", async () => {
  const html = await (await fetch(`${base}/`)).text();
  assert.match(html, /<section id="ai-team"/);
  assert.match(html, /href="#ai-team">AI team</);
  assert.match(html, /data-open-vierra>Talk to Vierra</);
  assert.match(html, /href="\/connect-ai">See how to connect/);
  assert.match(html, /Bonus: 1k Prompts, one tap away/);
  assert.match(html, /vierra\.js\?v=/, "Vierra's widget is on the page, so the button opens her");
  assert.equal((html.match(/Bonus: 1,000 prompts for Claude and ChatGPT/g) || []).length, 2, "both plans list the bonus");
  assert.ok(html.indexOf('id="ai-team"') < html.indexOf('id="pricing"'));
});

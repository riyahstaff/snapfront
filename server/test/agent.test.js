// The Fable agent loop, end to end over HTTP, with a scripted stand-in for the Claude API.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-agent-"));
process.env.DATA_DIR = tmp;
process.env.PUBLIC_URL = "http://localhost";
process.env.STRIPE_SECRET_KEY = "";

const { app } = await import("../src/index.js");
const agent = await import("../src/agent.js");
const { TOOL_DEFS } = agent;

// Scripted model: turn 1 checks the store and creates a listing, turn 2 tries to publish it, turn 3 answers.
const seen = [];
let createdId = null;
agent.setAgentClient({
  messages: {
    async create(params) {
      seen.push(structuredClone(params)); // the loop keeps appending to the same array
      const turn = seen.length;
      if (turn === 1) return { stop_reason: "tool_use", content: [
        { type: "thinking", thinking: "plan", signature: "sig" },
        { type: "text", text: "On it." },
        { type: "tool_use", id: "t1", name: "get_store", input: {} },
        { type: "tool_use", id: "t2", name: "create_product_listing", input: {
          title: "Dog Lover Gift Guide", tagline: "Twelve gifts dogs and owners love.", description: "One.\n\nTwo.",
          bullets: ["12 picks", "Printable"], tags: ["dogs", "#gifts"], faq: [{ q: "Format?", a: "PDF" }],
          category: "Gift guide", kind: "digital", price: 9, delivery_url: "https://example.com/file.pdf" } },
      ] };
      if (turn === 2) {
        const created = JSON.parse(params.messages.at(-1).content.find((b) => b.tool_use_id === "t2").content);
        createdId = created.id;
        return { stop_reason: "tool_use", content: [{ type: "tool_use", id: "t3", name: "publish_product", input: { id: created.id } }] };
      }
      return { stop_reason: "end_turn", content: [{ type: "text", text: "I made Dog Lover Gift Guide ($9.00) as a draft. Connect Stripe to publish it." }] };
    },
  },
});

let server, base, token;
before(async () => { server = app.listen(0); await new Promise((r) => server.once("listening", r)); base = `http://127.0.0.1:${server.address().port}`; });
after(() => { server.close(); fs.rmSync(tmp, { recursive: true, force: true }); });
const call = (method, url, body) => fetch(base + url, {
  method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  body: body ? JSON.stringify(body) : undefined,
});

test("tool definitions are valid for the Messages API", () => {
  for (const t of TOOL_DEFS) {
    assert.match(t.name, /^[a-zA-Z0-9_-]{1,128}$/);
    assert.ok(t.description.length > 40, t.name);
    assert.equal(t.input_schema.type, "object");
  }
});

test("a run plans, uses tools, reports progress and answers", async () => {
  token = (await (await call("POST", "/api/sellers", { store_name: "Pup Shop" })).json()).token;
  const start = await call("POST", "/api/agent/runs", { messages: [{ role: "user", content: "Make a dog gift guide and put it on sale for $9" }] });
  assert.equal(start.status, 202);
  const { id } = await start.json();

  let run;
  for (let i = 0; i < 50; i++) {
    run = await (await call("GET", `/api/agent/runs/${id}`)).json();
    if (run.status !== "running") break;
    await new Promise((r) => setTimeout(r, 20));
  }
  assert.equal(run.status, "done");
  assert.match(run.reply, /Dog Lover Gift Guide/);

  const kinds = run.events.map((e) => e.type);
  assert.ok(kinds.includes("step"));
  assert.ok(kinds.includes("product"));
  assert.ok(kinds.includes("step_failed"), "publishing without Stripe should fail visibly");

  // model was given the full assistant content back (thinking block included) and the tool errors flagged
  assert.equal(seen[1].messages[1].content[0].type, "thinking");
  const publishResult = seen[2].messages.at(-1).content[0];
  assert.equal(publishResult.is_error, true);
  assert.match(publishResult.content, /Connect Stripe/);
  assert.equal(seen[0].model, "claude-fable-5-1");

  // the product really exists as a draft in the store
  const products = await (await call("GET", "/api/products")).json();
  assert.equal(products.length, 1);
  assert.equal(products[0].id, createdId);
  assert.equal(products[0].status, "draft");
  assert.deepEqual(products[0].tags, ["dogs", "gifts"]);
});

test("bad requests are refused clearly", async () => {
  let r = await call("POST", "/api/agent/runs", { messages: [] });
  assert.equal(r.status, 400);
  r = await call("GET", "/api/agent/runs/nope");
  assert.equal(r.status, 404);
});

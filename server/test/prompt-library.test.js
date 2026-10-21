// The prompt library (/prompts): the prompt files parse cleanly, every prompt is a full prompt, the
// Snapfront tools they name exist, and the page and JSON are served (compressed) with the prompts escaped.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-prompts-"));
process.env.DATA_DIR = tmp;
process.env.STRIPE_SECRET_KEY = "";

const lib = await import("../src/prompt-library.js");
const { app } = await import("../src/index.js");
let base, server;
before(async () => { server = app.listen(0); await new Promise((r) => server.once("listening", r)); base = `http://127.0.0.1:${server.address().port}`; });
after(() => { server?.close(); fs.rmSync(tmp, { recursive: true, force: true }); });

test("the library has at least 500 full prompts in named categories", () => {
  const { categories, prompts } = lib.loadPrompts();
  assert.ok(prompts.length >= 500, `${prompts.length} prompts`);
  assert.equal(new Set(prompts.map((p) => p.id)).size, prompts.length, "IDs are unique");
  assert.equal(categories.reduce((n, c) => n + c.count, 0), prompts.length);
  for (const c of categories) assert.ok(c.blurb, `${c.name} has a blurb`);
  for (const p of prompts) {
    assert.ok(p.prompt.length >= 350, `${p.id} is a full prompt`);
    assert.equal((p.prompt.match(/\[/g) || []).length, (p.prompt.match(/\]/g) || []).length, `${p.id} brackets match`);
    assert.doesNotMatch(p.prompt, /[<>]/, `${p.id} has no markup`);
  }
  assert.ok(prompts.filter((p) => p.snapfront).length >= 200, "plenty use the Snapfront connector");
});

test("every Snapfront tool a prompt names is a real connector tool", () => {
  const src = fs.readFileSync(new URL("../src/connector.js", import.meta.url), "utf8");
  const tools = new Set([...src.matchAll(/registerTool\("([a-z_]+)"/g)].map((m) => m[1]));
  assert.ok(tools.size >= 10);
  const named = new Set(lib.loadPrompts().prompts.flatMap((p) => [...p.prompt.matchAll(/\b[a-z]+(?:_[a-z]+)+\b/g)].map((m) => m[0])));
  for (const t of named) assert.ok(tools.has(t), `${t} is a connector tool`);
});

test("malformed prompt files are refused with a clear reason", () => {
  const dir = fs.mkdtempSync(path.join(tmp, "bad-"));
  const write = (s) => { for (const f of fs.readdirSync(dir)) fs.rmSync(path.join(dir, f)); fs.writeFileSync(path.join(dir, "a.txt"), s); };
  const long = "Do the thing. ".repeat(30);
  write(`# category: Test\n\n## Short one\nToo short.\n`);
  assert.throws(() => lib.loadPrompts(dir), /too short/);
  write(`# category: Test\n\n## Same\n${long}\n## Same\n${long}\n`);
  assert.throws(() => lib.loadPrompts(dir), /two prompts are called/);
  write(`## No category\n${long}\n`);
  assert.throws(() => lib.loadPrompts(dir), /before any "# category:"/);
  write(`# category: Test\nstray text\n## Fine\n${long}\n`);
  assert.throws(() => lib.loadPrompts(dir), /text outside a prompt/);
  write(`# category: Test\n# blurb: One line\n\n## Fine one\n${long}\n`);
  const ok = lib.loadPrompts(dir);
  assert.equal(ok.prompts[0].id, "fine-one");
  assert.equal(ok.categories[0].blurb, "One line");
});

test("groups, @for lines and connector: off", () => {
  const dir = fs.mkdtempSync(path.join(tmp, "groups-"));
  const long = "Package this as a Snapfront digital download and plan the launch. ".repeat(7);
  fs.writeFileSync(path.join(dir, "01.txt"), `# category: Shop\n# blurb: B\n\n## Mine\n${long}\n`);
  fs.writeFileSync(path.join(dir, "02.txt"), `# category: Shop\n# group: Ebooks and guides\n# connector: off\n# source: chapter 2\n\n## Theirs\n@for: solo sellers\n${long}\n## Theirs with a tool\n@for: shops\n${long} Then use get_store.\n`);
  const { prompts } = lib.loadPrompts(dir);
  const [mine, theirs, tool] = prompts;
  assert.equal(mine.group, ""); assert.equal(mine.for, ""); assert.equal(mine.snapfront, true);
  assert.equal(theirs.group, "Ebooks and guides"); assert.equal(theirs.for, "solo sellers");
  assert.equal(theirs.snapfront, false, "mentions Snapfront but doesn't use the connector");
  assert.ok(!theirs.prompt.startsWith("@for"), "the @for line isn't part of the prompt");
  assert.equal(tool.snapfront, true, "naming a connector tool still counts");
  fs.writeFileSync(path.join(dir, "03.txt"), `# category: Shop\n# connector: maybe\n`);
  assert.throws(() => lib.loadPrompts(dir), /can only be "off"/);
});

test("the full set: 1,000 prompts, and every imported plan says who it's for", () => {
  const { prompts, categories } = lib.loadPrompts();
  assert.ok(prompts.length >= 1000, `${prompts.length} prompts`);
  const grouped = prompts.filter((p) => p.group);
  assert.ok(grouped.length >= 500);
  for (const p of grouped) assert.ok(p.for, `${p.id} has a buyer`);
  assert.ok(categories.length <= 14, "the category filter stays short");
  assert.doesNotMatch(prompts.map((p) => p.prompt).join("\n"), /\bAct as a (AI|RPA|instructional)\b/);
});

test("files with the same category merge, and IDs come from titles", () => {
  const dir = fs.mkdtempSync(path.join(tmp, "merge-"));
  const long = "Use Snapfront to check my store. ".repeat(12);
  fs.writeFileSync(path.join(dir, "01.txt"), `# category: Store & shop\n# blurb: First\n\n## Café prices!\n${long}\n`);
  fs.writeFileSync(path.join(dir, "02.txt"), `# category: Store & shop\n# blurb: Ignored\n\n## Second\n${long}\n`);
  const { categories, prompts } = lib.loadPrompts(dir);
  assert.equal(categories.length, 1);
  assert.equal(categories[0].id, "store-and-shop");
  assert.equal(categories[0].blurb, "First");
  assert.deepEqual(prompts.map((p) => p.id), ["cafe-prices", "second"]);
  assert.ok(prompts.every((p) => p.snapfront));
});

test("the old /prompts address leads to the library in the app", async () => {
  const r = await fetch(`${base}/prompts`, { redirect: "manual" });
  assert.equal(r.status, 302);
  assert.match(r.headers.get("location"), /\/prompts$/);
  assert.notEqual(r.headers.get("location"), "/prompts");
});

test("/api/prompts is for signed-in app users and returns the library as compressed JSON", async () => {
  assert.equal((await fetch(`${base}/api/prompts`)).status, 401, "no token, no library");
  const reg = await (await fetch(`${base}/api/sellers`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ store_name: "Prompt Shop" }) })).json();
  const res = await fetch(`${base}/api/prompts`, { headers: { Authorization: `Bearer ${reg.token}`, "Accept-Encoding": "br" } });
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type"), /application\/json/);
  assert.equal(res.headers.get("content-encoding"), "br");
  assert.match(res.headers.get("cache-control"), /private/);
  const body = await res.json();
  assert.equal(body.count, body.prompts.length);
  assert.ok(body.count >= 1000);
  assert.deepEqual(Object.keys(body.prompts[0]).sort(), ["category", "for", "group", "id", "prompt", "snapfront", "title"]);
});

test("the site points members to Bonus: 1k Prompts in the app", async () => {
  const tools = await (await fetch(`${base}/tools`)).text();
  assert.doesNotMatch(tools, /<a href="\/prompts"/);
  assert.match(tools, /\/prompts">Bonus: 1k Prompts</);
  const guide = await (await fetch(`${base}/connect-ai`)).text();
  assert.match(guide, /\/prompts">Bonus: 1k Prompts</);
  const help = await (await fetch(`${base}/help`)).text();
  assert.match(help, /Bonus: 1k Prompts/);
});

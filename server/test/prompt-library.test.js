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

test("/prompts serves every prompt with copy buttons, highlighted blanks and compression", async () => {
  const { prompts, categories } = lib.library();
  const res = await fetch(`${base}/prompts`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type"), /text\/html/);
  const html = await res.text();
  assert.ok(html.includes(`<h1>${prompts.length} prompts for Claude and ChatGPT</h1>`));
  for (const p of prompts) assert.ok(html.includes(`id="${p.id}"`), p.id);
  for (const c of categories) assert.ok(html.includes(`data-cat="${c.id}"`), c.id);
  assert.equal((html.match(/class="btn copy"/g) || []).length, prompts.length);
  assert.match(html, /<mark>\[[A-Z]/);
  assert.equal((html.match(/<script>/g) || []).length, 1, "only the page's own script");
  assert.match(html, /href="\/connect-ai"/);
  assert.match(html, /aria-current="page">Prompts</);

  const gz = await fetch(`${base}/prompts`, { headers: { "Accept-Encoding": "gzip" } });
  assert.equal(gz.headers.get("content-encoding"), "gzip");
  assert.match(gz.headers.get("vary"), /Accept-Encoding/);
  const page = lib.promptsPage(() => "");   // cached: the same page the server sent
  assert.equal(zlib.gunzipSync(page.gzip).toString(), html);
  assert.ok(page.br.length < page.html.length / 3, "compressed well");
});

test("/api/prompts returns the library as JSON", async () => {
  const res = await fetch(`${base}/api/prompts`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type"), /application\/json/);
  const body = await res.json();
  assert.equal(body.count, body.prompts.length);
  assert.ok(body.count >= 500);
  assert.deepEqual(Object.keys(body.prompts[0]).sort(), ["category", "id", "prompt", "snapfront", "title"]);
});

test("the site menu and the connector guide link to the library", async () => {
  const tools = await (await fetch(`${base}/tools`)).text();
  assert.match(tools, /<a href="\/prompts">Prompts<\/a>/);
  assert.match(tools, /Browse the prompt library/);
  const guide = await (await fetch(`${base}/connect-ai`)).text();
  assert.match(guide, /href="\/prompts">prompt library</);
});

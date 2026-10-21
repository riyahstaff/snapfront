// The help centre (/help): every answer links to a page that exists, IDs are unique, and the page,
// its redirects and its search box are served.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-help-"));
process.env.DATA_DIR = tmp;
process.env.STRIPE_SECRET_KEY = "";

const help = await import("../src/help-page.js");
const { app } = await import("../src/index.js");
let base, server;
before(async () => { server = app.listen(0); await new Promise((r) => server.once("listening", r)); base = `http://127.0.0.1:${server.address().port}`; });
after(() => { server?.close(); fs.rmSync(tmp, { recursive: true, force: true }); });

const APP = path.resolve(new URL("../../mobile/src/app/", import.meta.url).pathname);
/** Is `route` (like "/settings" or "/") a screen in the app? */
function appRouteExists(route) {
  const name = route.replace(/^\//, "").split(/[?#]/)[0];
  if (!name) return fs.existsSync(path.join(APP, "(tabs)", "index.tsx")) || fs.existsSync(path.join(APP, "index.tsx"));
  return [path.join(APP, `${name}.tsx`), path.join(APP, "(tabs)", `${name}.tsx`), path.join(APP, name, "index.tsx")].some((f) => fs.existsSync(f));
}

test("every 'Where' link points to a real app screen, and every answer is substantial", () => {
  let n = 0;
  for (const s of help.SECTIONS) {
    assert.ok(s.items.length >= 3, `${s.name} has answers`);
    for (const it of s.items) {
      n++;
      assert.ok(it.a.length >= 120, `"${it.q}" has a full answer`);
      assert.ok(it.q.endsWith("?"), `"${it.q}" is a question`);
      if (it.where && it.where[2] !== "site") assert.ok(appRouteExists(it.where[1]), `${it.where[1]} is an app screen ("${it.q}")`);
    }
  }
  assert.ok(n >= 50, `${n} answers`);
  assert.ok(help.GLOSSARY.length >= 30);
  const ids = help.SECTIONS.flatMap((s) => s.items.map((it) => help.qid(it.q)));
  assert.equal(new Set(ids).size, ids.length, "question IDs are unique");
});

test("/help is served with every question, the glossary and site links that work", async () => {
  const res = await fetch(`${base}/help`);
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.match(html, /<h1>Help and FAQ<\/h1>/);
  for (const s of help.SECTIONS) {
    assert.ok(html.includes(`id="${s.id}"`), s.id);
    for (const it of s.items) assert.ok(html.includes(`id="${help.qid(it.q)}"`), it.q);
  }
  assert.ok(html.includes('id="glossary"') && html.includes("<dt"), "glossary");
  assert.match(html, /aria-current="page">Help</);
  assert.equal((html.match(/<script>/g) || []).length, 1);
  // Links to site pages from answers resolve.
  for (const href of new Set([...html.matchAll(/href="(\/[a-z-]+)"/g)].map((m) => m[1]))) {
    const r = await fetch(`${base}${href}`, { redirect: "manual" });
    assert.ok(r.status === 200 || r.status === 301 || r.status === 302, `${href} → ${r.status}`);
  }
  const gz = await fetch(`${base}/help`, { headers: { "Accept-Encoding": "br" } });
  assert.equal(gz.headers.get("content-encoding"), "br");
});

test("/faq and /support redirect to /help, and the site links to it", async () => {
  for (const p of ["/faq", "/support"]) {
    const r = await fetch(`${base}${p}`, { redirect: "manual" });
    assert.equal(r.status, 301);
    assert.equal(r.headers.get("location"), "/help");
  }
  const tools = await (await fetch(`${base}/tools`)).text();
  assert.match(tools, /<a href="\/help">Help<\/a>/);
});

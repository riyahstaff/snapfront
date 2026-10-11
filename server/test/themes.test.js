// Storefront looks: every theme renders, sellers pick one, ?theme= previews without changing the store.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-themes-"));
process.env.DATA_DIR = tmp;
process.env.PUBLIC_URL = "https://themes.test";
process.env.STORE_DOMAIN = "themes.test";

const { app } = await import("../src/index.js");
const { THEMES, themeCss, fontsUrl, bodyClass } = await import("../src/themes.js");
const { storePage, productPage, cartPage } = await import("../src/render.js");

let server, port;
before(async () => { server = app.listen(0); await new Promise((r) => server.once("listening", r)); port = server.address().port; });
after(() => { server.close(); fs.rmSync(tmp, { recursive: true, force: true }); });

function req(host, method, url, { body, token } = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const r = http.request({ host: "127.0.0.1", port, method, path: url, headers: { Host: host, ...(data ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) } }, (res) => {
      let text = ""; res.on("data", (c) => (text += c)); res.on("end", () => resolve({ status: res.statusCode, text, json: () => JSON.parse(text) }));
    });
    r.on("error", reject); if (data) r.write(data); r.end();
  });
}

test("there are 20 distinct, complete themes", () => {
  assert.equal(THEMES.length, 20);
  assert.equal(new Set(THEMES.map((t) => t.id)).size, 20);
  assert.equal(new Set(THEMES.map((t) => `${t.fonts.display[0]}|${t.c.bg}|${t.c.accent}`)).size, 20);
  const hex = /^#[0-9A-F]{6}$/i;
  for (const t of THEMES) {
    for (const k of ["bg", "surface", "ink", "muted", "line", "accent", "onAccent", "badge", "onBadge"]) assert.match(t.c[k], hex, `${t.id}.${k}`);
    assert.match(fontsUrl(t), /^https:\/\/fonts\.googleapis\.com\/css2\?family=/);
    assert.match(themeCss(t), /--accent:#/);
    assert.match(bodyClass(t), new RegExp(`th-${t.id} hd-\\w+ cd-\\w+`));
    assert.ok(["overlay", "split", "collage", "editorial", "type", "spotlight"].includes(t.hero), t.id);
  }
});

test("every theme renders the store, product and cart pages", () => {
  const p = { id: "p1", slug: "mug", title: "Mug", image_url: "", price_cents: 1200, currency: "usd", variants: [], in_stock: true, status: "live", kind: "physical",
    tagline: "", category: "", bullets: [], tags: [], faq: [], description: "" };
  for (const t of THEMES) {
    const store = { store_name: "Fern & Co", store_slug: "fern", tagline: "Plants", theme: t.id, _base: "", stripe_ready: true };
    for (const html of [storePage(store, [p]), productPage(store, p), cartPage(store)]) {
      assert.match(html, new RegExp(`<body class="th-${t.id} `));
      assert.match(html, new RegExp(`family=${t.fonts.display[0].replace(/ /g, "\\+")}`));
      assert.match(html, /Fern &amp; Co/);
    }
  }
});

test("sellers choose a look; buyers see it; ?theme= previews another without saving", async () => {
  const list = (await req("themes.test", "GET", "/api/themes")).json().themes;
  assert.equal(list.length, 20);
  assert.deepEqual(Object.keys(list[1]).sort(), ["colors", "dark", "fonts", "for", "id", "name", "shape", "vibe"]);
  assert.equal(new Set(list.map((t) => t.shape.hero)).size, 6);

  const s = (await req("themes.test", "POST", "/api/sellers", { body: { store_name: "Fern Shop" } })).json();
  let me = (await req("themes.test", "PATCH", "/api/me", { token: s.token, body: { store_name: "Fern Shop" } })).json();
  assert.equal(me.theme, "classic");
  const host = new URL(me.store_url).host;
  assert.match((await req(host, "GET", "/")).text, /<body class="th-classic /);

  assert.equal((await req("themes.test", "PATCH", "/api/me", { token: s.token, body: { theme: "comic-sans" } })).status, 400);
  me = (await req("themes.test", "PATCH", "/api/me", { token: s.token, body: { theme: "noir" } })).json();
  assert.equal(me.theme, "noir");
  let r = await req(host, "GET", "/");
  assert.match(r.text, /<body class="th-noir /);
  assert.doesNotMatch(r.text, /Previewing/);

  r = await req(host, "GET", "/?theme=volt");
  assert.match(r.text, /<body class="th-volt /);
  assert.match(r.text, /Previewing the Volt look/);
  assert.match(r.text, /<meta name="robots" content="noindex">/);
  assert.match((await req(host, "GET", "/cart?theme=volt")).text, /<body class="th-volt /);
  assert.match((await req(host, "GET", "/?theme=nope")).text, /<body class="th-noir /);
  assert.equal((await req("themes.test", "GET", "/api/me", { token: s.token })).json().theme, "noir");
});

test("cover photo, announcement, about, categories and related products show on the storefront", async () => {
  const s = (await req("themes.test", "POST", "/api/sellers", { body: { store_name: "Lark Goods" } })).json();
  let me = (await req("themes.test", "PATCH", "/api/me", { token: s.token, body: { store_name: "Lark Goods", tagline: "Things for slow mornings", about: "Two of us, one kiln.", announcement: "  Holiday orders ship by Dec 18  ", theme: "grove" } })).json();
  assert.equal(me.announcement, "Holiday orders ship by Dec 18");
  assert.equal(me.about, "Two of us, one kiln.");
  const png = Buffer.from("89504E470D0A1A0A0000000D4948445200000001000000010806000000" + "1F15C4890000000D49444154789C6300010000050001" + "0D0A2DB40000000049454E44AE426082", "hex");
  me = (await req("themes.test", "PUT", "/api/me/banner", { token: s.token, body: { imageBase64: Buffer.concat([png, Buffer.alloc(200)]).toString("base64"), mediaType: "image/png" } })).json();
  assert.match(me.banner_url, /^https:\/\/themes\.test\/img\/[\w-]+\.png$/);
  const { db } = await import("../src/db.js");
  const ins = db.prepare("INSERT INTO products (id, seller_id, slug, title, category, price_cents, status) VALUES (?,?,?,?,?,?, 'live')");
  ins.run("prd_a", s.seller?.id ?? me.id, "mug", "Mug", "Kitchen", 3200);
  ins.run("prd_b", me.id, "bowl", "Bowl", "Kitchen", 2800);
  ins.run("prd_c", me.id, "candle", "Candle", "Home", 2600);
  const host = new URL(me.store_url).host;
  let html = (await req(host, "GET", "/")).text;
  assert.match(html, /<div class="ann">Holiday orders ship by Dec 18<\/div>/);
  assert.match(html, /class="hero h-ov /);
  assert.ok(html.includes(me.banner_url));
  assert.match(html, /<h1>Things for slow mornings<\/h1>/);
  assert.match(html, /id="about"[\s\S]*Two of us, one kiln\./);
  assert.match(html, /Shop by category/);
  assert.match(html, /Free shipping/);
  html = (await req(host, "GET", "/?c=Home")).text;
  assert.match(html, /<h1>Home<\/h1><p>1 product<\/p>/);
  assert.match(html, /Candle/); assert.doesNotMatch(html, /href="\/mug"/);
  html = (await req(host, "GET", "/mug")).text;
  assert.match(html, /You may also like/);
  assert.match(html, /href="\/bowl"/);
  me = (await req("themes.test", "DELETE", "/api/me/banner", { token: s.token })).json();
  assert.equal(me.banner_url, null);
});

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-category-catalog-"));
process.env.DATA_DIR = tmp;
process.env.PUBLIC_URL = "https://category.test";
process.env.STORE_DOMAIN = "category.test";
const { app } = await import("../src/index.js");
const { db } = await import("../src/db.js");
const { THEMES, publicThemes } = await import("../src/themes.js");
const { CATEGORY_MODULES, CATEGORY_REGISTRY } = await import("../src/premium-themes.js");
const { storePage, productPage, cartPage } = await import("../src/render.js");
const { themeDemoPage, themeDemoProduct } = await import("../src/theme-gallery.js");
let server;
before(async () => { server = app.listen(0); await new Promise((resolve) => server.once("listening", resolve)); });
after(() => { server.close(); fs.rmSync(tmp, { recursive: true, force: true }); });
function request(url, host = "category.test", method = "GET") {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: "127.0.0.1", port: server.address().port, method, path: url, headers: { host } }, (res) => {
      let text = ""; res.setEncoding("utf8"); res.on("data", (chunk) => { text += chunk; });
      res.on("end", () => resolve({ status: res.statusCode, text, headers: res.headers }));
    });
    req.on("error", reject); req.end();
  });
}
const classicIds = ["classic", "atelier", "noir", "citrus", "bloom", "studio", "grove", "arcade", "market", "coastal", "velvet", "kraft", "candy", "editorial", "street", "sahara", "orbit", "sorbet", "heritage", "volt"];
const p = { id: "", slug: "real-piece", title: 'Real <product> & "piece"', image_url: "https://seller.test/real-photo.jpg", alt_text: "Real product photo", price_cents: 4321, currency: "usd", variants: [], in_stock: true, status: "live", kind: "physical", tagline: "", category: "Real category", bullets: [], tags: [], faq: [], description: "Real product description" };
const store = { store_name: 'My <store> & "name"', store_slug: "real-store", _base: "/s/real-store", stripe_ready: true, tagline: "Real seller tagline", about: "The real seller story.", hero_title: 'Editable <headline> & "words"', hero_subtitle: "Only my actual words", hero_motion: "pan" };

test("catalog contains unchanged original IDs and exactly 85 complete category modules", () => {
  assert.equal(THEMES.length, 105);
  assert.equal(new Set(THEMES.map((t) => t.id)).size, 105);
  assert.deepEqual(THEMES.slice(0, 20).map((t) => t.id), classicIds);
  assert.equal(CATEGORY_MODULES.length, 85);
  assert.equal(CATEGORY_REGISTRY.size, 85);
  assert.equal(new Set(CATEGORY_MODULES.map((m) => m.theme.family)).size, 85);
  for (const module of CATEGORY_MODULES) {
    assert.equal(typeof module.hero, "function", module.theme.id);
    assert.equal(typeof module.discovery, "function", module.theme.id);
    assert.ok(module.css.includes(`.th-${module.theme.id}`), `${module.theme.id} scoped CSS`);
    assert.ok(module.theme.copy.title && module.theme.copy.eyebrow && module.theme.copy.cta, module.theme.id);
    const file = path.resolve(new URL(`../assets/themes/${module.theme.id.slice(2)}-hero.webp`, import.meta.url).pathname);
    assert.ok(fs.existsSync(file) && fs.statSync(file).size > 1000, `${module.theme.id} demo hero exists`);
    // Thumbnail completeness is checked by the release asset audit after browser rendering.
    assert.equal(module.theme.preview, `/theme-assets/${module.theme.id.slice(2)}-preview.webp`);
  }
});

test("every new theme renders seller data, not concept screenshots or generated demo inventory", () => {
  for (const t of THEMES.slice(20)) {
    const current = { ...store, theme: t.id };
    const html = storePage(current, [p, { ...p, slug: "second-piece", title: "Second real product", image_url: "https://seller.test/second.jpg", category: "Second category" }]);
    assert.match(html, /Editable &lt;headline&gt; &amp; &quot;words&quot;/, t.id);
    assert.match(html, /Only my actual words/, t.id);
    assert.match(html, /\$43\.21/, t.id);
    assert.match(html, /data-hero-motion="pan"/, t.id);
    assert.match(html, /data-hero-motion-control/, t.id);
    assert.doesNotMatch(html, /src="[^\"]*theme-assets\//, `${t.id} demo assets not in seller HTML`);
    assert.doesNotMatch(html, /<headline>|<product>|<store>/, t.id);
    assert.equal((html.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1, `${t.id} one h1`);
    assert.doesNotMatch(html, /<form[^>]*[\s\S]*?(?:vehicle|fitment|configure)/i, `${t.id} no fake configurator`);
    assert.match(productPage(current, p), /id="add"/, `${t.id} real cart functionality`);
    assert.match(cartPage(current), /cart\/quote/, `${t.id} existing checkout path`);
  }
});

test("all new themes support empty/no-photo stores with no motion controls and no undefined URLs", () => {
  for (const t of THEMES.slice(20)) {
    const html = storePage({ ...store, theme: t.id, hero_motion: "pan" }, []);
    assert.match(html, /Editable &lt;headline&gt;/, t.id);
    assert.doesNotMatch(html, /<button[^>]*data-hero-motion-control/, t.id);
    assert.doesNotMatch(html, /src="(?:undefined|null|)"/, t.id);
    assert.match(html, /New products are on the way/, t.id);
    assert.equal((html.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1, t.id);
  }
});

test("public theme metadata links to real render previews and demo product pages cannot buy", () => {
  for (const t of publicThemes().filter((theme) => theme.collection === "premium")) {
    assert.match(t.preview_url, /^https:\/\/category\.test\/theme-assets\/.+-preview\.webp$/);
    assert.equal(t.demo_url, `https://category.test/theme-demo/${t.id}`);
    const html = themeDemoPage(t.id);
    assert.match(html, /Illustrative .* theme demo/);
    assert.match(html, /name="robots" content="noindex"/);
    const productHtml = themeDemoProduct(t.id, "example-1");
    assert.match(productHtml, /Available soon/);
    assert.doesNotMatch(productHtml, /id="add"|id="now"/);
  }
});

test("gallery and demo routes never write store data and work on seller subdomains", async () => {
  const beforeCounts = ["accounts", "sellers", "products", "orders"].map((table) => db.prepare(`SELECT COUNT(*) n FROM ${table}`).get().n);
  const gallery = await request("/themes");
  assert.equal(gallery.status, 200);
  assert.match(gallery.text, /105 editable storefront themes/);
  for (const host of ["category.test", "any-store.category.test"]) {
    const demo = await request(`/theme-demo/${THEMES[20].id}`, host);
    assert.equal(demo.status, 200);
    assert.match(demo.text, /Illustrative .* theme demo/);
    assert.equal((await request(`/theme-demo/${THEMES[20].id}/cart`, host)).status, 200);
    assert.equal((await request(`/theme-demo/${THEMES[20].id}/checkout`, host, "POST")).status, 404);
    assert.equal((await request(`/theme-assets/${THEMES[20].id.slice(2)}-hero.webp`, host)).status, 200);
  }
  assert.equal((await request("/theme-demo/not-a-theme")).status, 404);
  assert.equal((await request("/theme-assets/../../config.js")).status, 404);
  assert.deepEqual(["accounts", "sellers", "products", "orders"].map((table) => db.prepare(`SELECT COUNT(*) n FROM ${table}`).get().n), beforeCounts);
});

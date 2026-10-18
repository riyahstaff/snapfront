const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

/** Transpile the actual native modules; mock only SecureStore, never the behavior under test. */
function loadNativeModules(storage = {}, transport = global.fetch) {
  const memory = new Map();
  const cache = new Map();
  const secureStore = {
    getItemAsync: async (key) => memory.get(key) ?? null,
    setItemAsync: async (key, value) => { memory.set(key, value); },
    deleteItemAsync: async (key) => { memory.delete(key); }, ...storage,
  };
  function load(name) {
    if (name === "expo-secure-store") return secureStore;
    if (name === "expo-constants") return { default: { expoConfig: { extra: { apiUrl: "https://test.snapfront.invalid" } } } };
    if (name === "react") return { useSyncExternalStore: () => null };
    if (cache.has(name)) return cache.get(name);
    const filename = path.join(__dirname, "../src/lib", `${name}.ts`);
    const source = fs.readFileSync(filename, "utf8");
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const module = { exports: {} };
    cache.set(name, module.exports);
    vm.runInThisContext(`(function(require,module,exports,fetch){${code}\n})`, { filename })(
      (id) => load(id.startsWith("./") ? id.slice(2) : id), module, module.exports, transport,
    );
    cache.set(name, module.exports);
    return module.exports;
  }
  return { ...load("theme-catalog"), ...load("storefront-draft"), ...load("storefront-setup"), ...load("storefront-suggestions"), ...load("account-store"), ...load("api"), memory };
}

async function catalog() {
  // Metadata comes from the actual server registry, with no database or HTTP traffic.
  const { publicThemes } = await import("../../server/src/themes.js");
  return publicThemes();
}
const seller = (id = "store-a") => ({ id, theme: "classic", store_name: "My shop", hero_motion: "still", hero_title: "", hero_subtitle: "", hero_eyebrow: "", hero_cta: "", tagline: "Real seller tagline", about: "Real story.", announcement: "", stripe_ready: false,
  account: { stores: [{ id, live_allowed: false }] } });

test("all 130 real themes are searchable and paginated in the native picker", async () => {
  const m = loadNativeModules(), themes = await catalog();
  const result = m.browseThemes(themes, m.EMPTY_THEME_BROWSE);
  assert.equal(result.matches.length, 130); assert.equal(result.pages, 11); assert.equal(result.visible.length, 12);
  assert.equal(m.browseThemes(themes, { ...m.EMPTY_THEME_BROWSE, collection: "classic" }).matches.length, 20);
  assert.equal(m.browseThemes(themes, { ...m.EMPTY_THEME_BROWSE, collection: "premium" }).matches.length, 110);
  const ids = Array.from({ length: result.pages }, (_, page) => m.browseThemes(themes, { ...m.EMPTY_THEME_BROWSE, page }).visible.map((theme) => theme.id)).flat();
  assert.equal(new Set(ids).size, 130);
  assert.equal(m.browseThemes(themes, { ...m.EMPTY_THEME_BROWSE, page: 10 }).visible.length, 10);
});
test("multi-word searches ignore order, punctuation, accents and case", () => {
  const m = loadNativeModules();
  const theme = { id: "p-ceramics", name: "Café / Atelier", for: "Handmade ceramics", category: "Home", vibe: "Quiet warm", family: "Tableware", group: "home" };
  assert.deepEqual(m.browseThemes([theme], { ...m.EMPTY_THEME_BROWSE, query: "  WARM café CERAMICS " }).matches, [theme]);
  assert.deepEqual(m.browseThemes([theme], { ...m.EMPTY_THEME_BROWSE, query: "tableware atelier" }).matches, [theme]);
});
test("search and group filters intersect and never mutate themes or draft selection", async () => {
  const m = loadNativeModules(), themes = await catalog();
  const snapshot = JSON.stringify(themes);
  const draft = m.newStorefrontDraft({ theme: "classic" });
  const result = m.browseThemes(themes, { ...draft.browse, query: "skincare", group: "beauty" });
  assert.ok(result.matches.length > 0); assert.ok(result.matches.every((theme) => theme.group === "beauty"));
  assert.equal(m.browseThemes(themes, { ...draft.browse, query: "skincare", group: "technology" }).matches.length, 0);
  assert.equal(JSON.stringify(themes), snapshot); assert.equal(draft.theme, "classic");
});
test("pagination clamps stale or invalid pages and empty catalogs", async () => {
  const m = loadNativeModules(), themes = await catalog();
  assert.equal(m.browseThemes(themes, { ...m.EMPTY_THEME_BROWSE, page: 999 }).page, 10);
  assert.equal(m.browseThemes(themes, { ...m.EMPTY_THEME_BROWSE, page: -1 }).page, 0);
  assert.equal(m.browseThemes([], { ...m.EMPTY_THEME_BROWSE, page: 8 }).page, 0);
  assert.equal(m.browseThemes(themes, { ...m.EMPTY_THEME_BROWSE, query: "no-such-theme", page: 8 }).visible.length, 0);
});
test("wizard preserves current classic and premium themes instead of silently upgrading", async () => {
  const m = loadNativeModules(), themes = await catalog();
  assert.equal(m.restoreStorefrontDraft(seller(), themes, null).draft.theme, "classic");
  const s = { ...seller(), theme: "p-skincare" };
  assert.equal(m.restoreStorefrontDraft(s, themes, null).draft.theme, "p-skincare");
});
test("retired theme reconciliation keeps staged photo, text, browse state and progress", async () => {
  const m = loadNativeModules(), themes = await catalog();
  const saved = m.newStorefrontDraft({ theme: "retired", banner_file: "owned.png", banner_url: "https://example.com/img/owned.png", hero_title: "My title", step: 3, max_step: 5, browse: { query: "warm", group: "home", collection: "premium", page: 2 } });
  const result = m.restoreStorefrontDraft(seller(), themes, saved);
  assert.equal(result.replaced, true); assert.equal(result.draft.theme, "classic");
  assert.equal(result.draft.banner_file, "owned.png"); assert.equal(result.draft.hero_title, "My title");
  assert.equal(result.draft.max_step, 5); assert.deepEqual(result.draft.browse, saved.browse);
});
test("legacy v1 drafts get compatible browse and progress defaults", () => {
  const m = loadNativeModules();
  const restored = m.newStorefrontDraft({ version: 1, step: 4, category: "All", theme: "classic" });
  assert.equal(restored.max_step, 4); assert.equal(restored.browse.query, ""); assert.equal(restored.browse.collection, "all");
});
test("drafts normalize untrusted values and never store image bytes", () => {
  const m = loadNativeModules();
  const draft = m.newStorefrontDraft({ step: 99, max_step: -2, banner_file: "../../secret", banner_url: "javascript:bad", hero_motion: "spin", tone: "unknown", imageBase64: "PHOTO_BYTES", hero_title: "x".repeat(180), browse: { query: "x".repeat(200), group: "unknown", collection: "unknown", page: -1 } });
  assert.equal(draft.step, 5); assert.equal(draft.max_step, 5); assert.equal(draft.banner_file, null); assert.equal(draft.banner_url, null);
  assert.equal(draft.hero_motion, "still"); assert.equal(draft.tone, "considered"); assert.equal(draft.hero_title.length, 100);
  assert.equal(draft.browse.query.length, 120); assert.equal(draft.browse.group, "all");
  assert.ok(!JSON.stringify(draft).includes("PHOTO_BYTES"));
});
test("saved browse state and progress resume separately for each store", async () => {
  const m = loadNativeModules();
  await m.saveStorefrontDraft("store-a", m.newStorefrontDraft({ theme: "classic", step: 4, browse: { ...m.EMPTY_THEME_BROWSE, query: "candles", page: 2 } }));
  await m.saveStorefrontDraft("store-b", m.newStorefrontDraft({ theme: "p-skincare", step: 2 }));
  assert.equal((await m.loadStorefrontDraft("store-a")).browse.query, "candles");
  assert.equal((await m.loadStorefrontDraft("store-a")).step, 4);
  assert.equal((await m.loadStorefrontDraft("store-b")).theme, "p-skincare");
  await m.clearStorefrontDraft("store-a");
  assert.equal(await m.loadStorefrontDraft("store-a"), null); assert.ok(await m.loadStorefrontDraft("store-b"));
});
test("draft writes and clear execute in call order despite asynchronous native storage", async () => {
  const calls = [], memory = new Map();
  const m = loadNativeModules({ setItemAsync: async (key, value) => { await new Promise((resolve) => setTimeout(resolve, JSON.parse(value).step === 1 ? 20 : 0)); memory.set(key, value); calls.push(JSON.parse(value).step); },
    deleteItemAsync: async (key) => { memory.delete(key); calls.push("clear"); }, getItemAsync: async (key) => memory.get(key) ?? null });
  const a = m.saveStorefrontDraft("a", m.newStorefrontDraft({ step: 1 }));
  const b = m.saveStorefrontDraft("a", m.newStorefrontDraft({ step: 4 }));
  // A read queued after a write must observe the new draft.
  assert.equal((await m.loadStorefrontDraft("a")).step, 4);
  await Promise.all([a, b, m.clearStorefrontDraft("a")]);
  assert.deepEqual(calls, [1, 4, "clear"]); assert.equal(await m.loadStorefrontDraft("a"), null);
});
test("one native write failure does not block a subsequent save", async () => {
  let fail = true;
  const m = loadNativeModules({ setItemAsync: async (key, value) => { if (fail) { fail = false; throw new Error("storage failed"); } m.memory.set(key, value); } });
  await assert.rejects(m.saveStorefrontDraft("a", m.newStorefrontDraft({ step: 1 })));
  await m.saveStorefrontDraft("a", m.newStorefrontDraft({ step: 3 }));
  assert.equal((await m.loadStorefrontDraft("a")).step, 3);
});
test("corrupt and unsupported persisted drafts are ignored safely", async () => {
  const m = loadNativeModules();
  m.memory.set("snapfront.storefront-draft.a", "{bad"); assert.equal(await m.loadStorefrontDraft("a"), null);
  m.memory.set("snapfront.storefront-draft.a", JSON.stringify({ version: 99 })); assert.equal(await m.loadStorefrontDraft("a"), null);
});
test("review payload is identical for preview/apply and contains no billing or product changes", () => {
  const m = loadNativeModules();
  const draft = m.newStorefrontDraft({ theme: "p-skincare", banner_file: "owned.png", hero_title: "  Reviewed title  ", about: "Our actual story", notes: "Private AI notes" });
  const before = JSON.stringify(draft);
  const preview = m.storefrontPatchBody(draft, seller()), apply = m.storefrontPatchBody(draft, seller());
  assert.deepEqual(preview, apply); assert.equal(preview.hero_title, "Reviewed title"); assert.equal(preview.store_name, "My shop");
  assert.equal(preview.banner_file, "owned.png"); assert.equal(JSON.stringify(draft), before);
  for (const field of ["notes", "account", "stripe_ready", "products", "status", "price", "store_slug", "banner_url"]) assert.ok(!(field in preview));
});
test("clearing a staged cover does not remove the applied public cover", () => {
  const m = loadNativeModules();
  const patch = m.storefrontPatchBody(m.newStorefrontDraft({ banner_file: null }), seller());
  assert.ok(!Object.hasOwn(patch, "banner_file"));
});
test("readiness reflects the current store's plan, Stripe and real live product states", () => {
  const m = loadNativeModules();
  const products = [{ status: "draft" }, { status: "live" }];
  const s = { ...seller(), stripe_ready: true, account: { stores: [{ id: "other", live_allowed: true }, { id: "store-a", live_allowed: false }] } };
  assert.equal(m.storefrontReadiness(s, products).canTakeOrders, false);
  s.account.stores[1].live_allowed = true;
  assert.equal(m.storefrontReadiness(s, products).canTakeOrders, true);
  assert.equal(m.storefrontReadiness(s, []).canTakeOrders, false);
  assert.equal(m.storefrontReadiness(s, products).draftProducts, 1);
});


test("late photo results merge into the initiating store without overwriting newer wording", async () => {
  const m = loadNativeModules();
  const captured = m.newStorefrontDraft({ theme: "classic", about: "Old story" });
  const newer = m.saveStorefrontDraft("a", m.newStorefrontDraft({ ...captured, about: "Updated story", step: 4 }));
  const merged = m.mergeStorefrontDraft("a", { banner_file: "late.png", banner_url: "https://example.com/late.png" }, captured);
  await Promise.all([newer, merged]);
  const result = await m.loadStorefrontDraft("a");
  assert.equal(result.about, "Updated story"); assert.equal(result.step, 4); assert.equal(result.banner_file, "late.png");
  assert.equal(await m.loadStorefrontDraft("b"), null);
});

test("completed AI suggestions remain store-specific and never enter editable draft automatically", async () => {
  const m = loadNativeModules();
  const suggestions = { hero_title: "Suggested", hero_subtitle: "Suggested sub", hero_eyebrow: "EDIT", hero_cta: "Shop", tagline: "Suggested tagline", about: "Suggested about", announcement: "" };
  await m.saveStorefrontDraft("a", m.newStorefrontDraft({ hero_title: "Manual title" }));
  await m.saveStorefrontSuggestions("a", suggestions);
  assert.deepEqual(await m.loadStorefrontSuggestions("a"), suggestions);
  assert.equal(await m.loadStorefrontSuggestions("b"), null);
  assert.equal((await m.loadStorefrontDraft("a")).hero_title, "Manual title");
  await m.clearStorefrontSuggestions("a"); assert.equal(await m.loadStorefrontSuggestions("a"), null);
});

test("AI results remain available in memory if native persistence rejects the payload", async () => {
  const m = loadNativeModules({ setItemAsync: async () => { throw new Error("Native storage unavailable"); } });
  const suggestions = { hero_title: "Retained", hero_subtitle: "", hero_eyebrow: "", hero_cta: "Shop", tagline: "", about: "", announcement: "" };
  await assert.rejects(m.saveStorefrontSuggestions("a", suggestions));
  assert.equal((await m.loadStorefrontSuggestions("a")).hero_title, "Retained");
});

const tick = () => new Promise((resolve) => setImmediate(resolve));
const response = (data) => ({ ok: true, status: 200, json: async () => data });

test("store-bound operations retain X-Store even when the active selection changes during token lookup", async () => {
  const calls = [];
  const m = loadNativeModules({ getItemAsync: async (key) => key === "snapfront.token" ? "test-token" : null }, async (url, init) => { calls.push({ url, init }); return response({}); });
  await m.api.switchStore("b");
  await m.api.updateStore({ theme: "classic" }, "a");
  await m.api.stageStorefrontPhoto("photo", "image/png", "a");
  await m.api.storefrontCopy({ notes: "Real products" }, "a");
  await m.api.previewStorefront({ theme: "classic" }, "a");
  await m.api.discardStorefrontPhoto("owned.png", "a");
  assert.equal(calls.length, 5); assert.ok(calls.every(({ init }) => init.headers["X-Store"] === "a"));
});

test("late account refresh cannot restore a previous store after switching", async () => {
  const pending = [];
  const m = loadNativeModules({ getItemAsync: async (key) => key === "snapfront.token" ? "test-token" : null }, async () => new Promise((resolve) => pending.push(resolve)));
  m.account.set(seller("a"));
  const old = m.account.refresh(); await tick();
  await m.api.switchStore("b");
  const current = m.account.refresh(); await tick();
  pending[1](response(seller("b"))); await current;
  pending[0](response(seller("a"))); await old;
  assert.equal(m.account.get().id, "b");
});

test("older overlapping refreshes and post-clear responses cannot replace newer account data", async () => {
  const pending = [];
  const m = loadNativeModules({ getItemAsync: async (key) => key === "snapfront.token" ? "test-token" : null }, async () => new Promise((resolve) => pending.push(resolve)));
  const first = m.account.refresh(); await tick();
  const second = m.account.refresh(); await tick();
  pending[1](response({ ...seller(), store_name: "New name" })); await second;
  pending[0](response({ ...seller(), store_name: "Old name" })); await first;
  assert.equal(m.account.get().store_name, "New name");
  const third = m.account.refresh(); await tick(); m.account.clear();
  pending[2](response(seller())); await third; assert.equal(m.account.get(), null);
});

test("concurrent cold-start home and root requests create exactly one seller token", async () => {
  const calls = [];
  const m = loadNativeModules({}, async (url, init) => {
    calls.push({ url, init });
    if (url.endsWith("/api/sellers")) { await tick(); return response({ token: "single-device-token" }); }
    if (url.endsWith("/api/themes")) return response({ themes: [] });
    return response(seller());
  });
  await Promise.all([m.api.me(), m.api.themes(), m.account.refresh()]);
  assert.equal(calls.filter(({ url }) => url.endsWith("/api/sellers")).length, 1);
  assert.equal(m.memory.get("snapfront.token"), "single-device-token");
  assert.ok(calls.filter(({ url }) => url.endsWith("/api/me")).every(({ init }) => init.headers.Authorization === "Bearer single-device-token"));
  assert.equal(calls.find(({ url }) => url.endsWith("/api/themes")).init, undefined);
});

test("a failed cold-start token bootstrap can retry without a stuck initialization promise", async () => {
  let creates = 0;
  const m = loadNativeModules({}, async (url) => {
    if (url.endsWith("/api/sellers")) {
      creates++;
      if (creates === 1) throw new Error("Offline");
      return response({ token: "retry-device-token" });
    }
    return response(seller());
  });
  const failed = await Promise.allSettled([m.api.me(), m.account.refresh()]);
  assert.ok(failed.every((result) => result.status === "rejected")); assert.equal(creates, 1);
  await Promise.all([m.api.me(), m.account.refresh()]); assert.equal(creates, 2);
  assert.equal(m.memory.get("snapfront.token"), "retry-device-token");
});

test("public catalog is available without touching native storage or creating a seller", async () => {
  const calls = [];
  const m = loadNativeModules({ getItemAsync: async () => { throw new Error("Storage unavailable"); } }, async (url, init) => {
    calls.push({ url, init });
    assert.ok(url.endsWith("/api/themes"));
    return response({ themes: [{ id: "p-jewelry" }] });
  });
  assert.deepEqual(await m.api.themes(), [{ id: "p-jewelry" }]);
  assert.equal(calls.length, 1); assert.equal(calls[0].init, undefined);
  assert.equal(m.memory.size, 0);
});

test("public catalog failures and malformed responses produce retryable readable errors", async () => {
  for (const transport of [async () => { throw new Error("Offline"); }, async () => ({ ok: false, status: 503 }), async () => response({ notThemes: [] })]) {
    const m = loadNativeModules({}, transport);
    await assert.rejects(m.api.themes(), /themes|catalog/i);
    assert.equal(m.memory.size, 0);
  }
});

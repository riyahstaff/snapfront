const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const filename = path.resolve(__dirname, "../src/lib/home-carousel.ts");
const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const moduleState = { exports: {} };
vm.runInThisContext(`(function(module,exports){${compiled}\n})`, { filename })(moduleState, moduleState.exports);
const m = moduleState.exports;
const enabled = { focused: true, active: true, visible: true, paused: false, reduceMotion: false, screenReader: false, count: 4 };

test("theme carousel is static while preference is unknown, reading, paused, offscreen, blurred or backgrounded", () => {
  assert.equal(m.allowsThemeRotation(enabled), true);
  for (const changed of [{ focused: false }, { active: false }, { visible: false }, { paused: true }, { reduceMotion: null }, { reduceMotion: true }, { screenReader: null }, { screenReader: true }, { count: 1 }, { count: 0 }]) assert.equal(m.allowsThemeRotation({ ...enabled, ...changed }), false);
});
test("carousel owns exactly one five-second timer and releases it for every disabled state", () => {
  const live = new Map(); let starts = 0, ticks = 0;
  const clock = { setInterval(fn, ms) { assert.equal(ms, 5000); const id = ++starts; live.set(id, fn); return id; }, clearInterval(id) { live.delete(id); } };
  const controller = m.createThemeRotation(() => { ticks++; }, clock);
  controller.update({ ...enabled, reduceMotion: null }); assert.equal(live.size, 0);
  controller.update(enabled); controller.update(enabled); assert.equal(starts, 1); assert.equal(live.size, 1);
  [...live.values()][0](); assert.equal(ticks, 1);
  for (const changed of [{ paused: true }, { visible: false }, { focused: false }, { active: false }, { reduceMotion: true }, { screenReader: true }]) {
    controller.update(enabled); assert.equal(live.size, 1);
    controller.update({ ...enabled, ...changed }); assert.equal(live.size, 0);
  }
  controller.update(enabled); controller.stop(); controller.stop(); assert.equal(live.size, 0);
});
test("carousel wraps deterministically without selecting or mutating a theme", () => {
  assert.equal(m.nextThemeIndex(0, 4), 1); assert.equal(m.nextThemeIndex(3, 4), 0);
  assert.equal(m.nextThemeIndex(0, 4, -1), 3); assert.equal(m.nextThemeIndex(5, 0), 0);
  assert.equal(m.nextThemeIndex(NaN, 4), 1); assert.equal(m.nextThemeIndex(9, 1), 0);
});
test("carousel pauses outside the actual scroll viewport and handles tall accessibility content", () => {
  assert.equal(m.carouselInViewport(500, 300, 0, 400), false);
  assert.equal(m.carouselInViewport(500, 300, 350, 400), true);
  assert.equal(m.carouselInViewport(500, 300, 700, 400), false);
  assert.equal(m.carouselInViewport(500, 700, 500, 400), true);
  assert.equal(m.carouselInViewport(0, 0, 0, 400), false);
  assert.equal(m.carouselInViewport(0, 300, 0, 0), false);
});
test("new users go directly to photos; saved or established stores keep Continue", () => {
  assert.deepEqual(m.homePrimaryAction(null, false, false), { label: "Snap a product", route: "/snap", returning: false });
  assert.equal(m.homePrimaryAction(null, null, false).route, "/snap", "Default device signup is not returning activity");
  for (const input of [[3, false, false], [null, true, false], [null, false, true]]) assert.deepEqual(m.homePrimaryAction(...input), { label: "Continue my storefront", route: "/storefront-setup", returning: true });
});
test("Home places the primary action before artwork and carousel taps only filter the catalog", () => {
  const home = fs.readFileSync(path.resolve(__dirname, "../src/components/home-dashboard.tsx"), "utf8");
  assert.ok(home.indexOf('"Opening your workspace…"') < home.indexOf("<ChromeHero />"));
  assert.ok(home.includes("loading={determining}"));
  const carousel = fs.readFileSync(path.resolve(__dirname, "../src/components/theme-carousel.tsx"), "utf8");
  assert.ok(carousel.includes('pathname: "/looks", params: { query: theme.name }'));
  assert.ok(!carousel.includes("api.updateStore")); assert.ok(carousel.includes("onScrollBeginDrag={stopForInteraction}"));
  const picker = fs.readFileSync(path.resolve(__dirname, "../src/app/looks.tsx"), "utf8");
  assert.ok(picker.includes("query: initialQuery")); assert.ok(!picker.includes("id: initialQuery"));
});

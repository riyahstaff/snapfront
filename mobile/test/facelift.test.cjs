const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
function moduleUnderTest(name, mocks = {}) {
  const filename = path.join(root, "src/lib", `${name}.ts`);
  const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  vm.runInThisContext(`(function(require,module,exports){${output}\n})`, { filename })((id) => { if (id in mocks) return mocks[id]; throw new Error(`Unexpected dependency ${id}`); }, module, module.exports);
  return module.exports;
}
function mockAnimations() {
  const jobs = [];
  class Value { constructor(value) { this.value = value; } setValue(value) { this.value = value; } }
  function job(kind, config) {
    const result = { kind, config, starts: 0, stops: 0, start() { this.starts++; }, stop() { this.stops++; } };
    jobs.push(result); return result;
  }
  return { jobs, Animated: { Value, timing: (_, config) => job("timing", config), sequence: (config) => job("sequence", config), loop: (config) => job("loop", config) }, Easing: { out: (x) => x, inOut: (x) => x, cubic: "cubic", ease: "ease" } };
}
const enabled = { focused: true, active: true, reduceMotion: false, paused: false };
test("chrome motion is static while preference is unknown, reduced, paused, blurred or backgrounded", () => {
  const m = moduleUnderTest("chrome-motion", { "react-native": mockAnimations() });
  assert.equal(m.allowsChromeMotion(enabled), true);
  for (const change of [{ focused: false }, { active: false }, { reduceMotion: true }, { reduceMotion: null }, { paused: true }]) assert.equal(m.allowsChromeMotion({ ...enabled, ...change }), false);
});
test("native chrome motion starts once, uses native nonblocking transforms and stops completely", () => {
  const animations = mockAnimations(), m = moduleUnderTest("chrome-motion", { "react-native": animations });
  const controller = m.createChromeMotion();
  controller.update({ ...enabled, reduceMotion: null }); assert.equal(animations.jobs.length, 0); assert.equal(controller.entrance.value, 1);
  controller.update(enabled); const count = animations.jobs.length;
  assert.equal(animations.jobs.filter((job) => job.kind === "loop").length, 1);
  assert.ok(animations.jobs.filter((job) => job.kind === "timing").every((job) => job.config.useNativeDriver && job.config.isInteraction === false));
  controller.update(enabled); assert.equal(animations.jobs.length, count);
  controller.update({ ...enabled, paused: true });
  assert.equal(animations.jobs.find((job) => job.kind === "loop").stops, 1); assert.equal(controller.entrance.value, 1); assert.equal(controller.drift.value, 0);
  controller.update(enabled);
  assert.equal(animations.jobs.filter((job) => job.kind === "timing" && job.config.duration === 650).length, 1, "Do not replay entrance on resume");
  controller.stop(); assert.equal(controller.drift.value, 0);
});
test("blur, background and Reduce Motion transitions stop loops rather than accumulating them", () => {
  const animations = mockAnimations(), m = moduleUnderTest("chrome-motion", { "react-native": animations });
  const controller = m.createChromeMotion();
  for (const change of [{ active: false }, { focused: false }, { reduceMotion: true }]) {
    controller.update(enabled);
    const loop = animations.jobs.filter((job) => job.kind === "loop").at(-1);
    controller.update({ ...enabled, ...change }); assert.equal(loop.stops, 1);
  }
  controller.stop(); assert.equal(controller.entrance.value, 1);
});
test("home discovery uses only the actual catalog, is bounded and never changes selection or metadata", async () => {
  const m = moduleUnderTest("home-discovery");
  const { publicThemes } = await import("../../server/src/themes.js");
  const themes = publicThemes(), before = JSON.stringify(themes), result = m.featuredThemes(themes);
  assert.ok(result.length > 0 && result.length <= 4);
  assert.equal(new Set(result.map((theme) => theme.id)).size, result.length);
  assert.ok(result.every((theme) => themes.includes(theme))); assert.equal(JSON.stringify(themes), before);
  assert.deepEqual(m.featuredThemes([]), []);
  assert.equal(m.featuredThemes([themes[0]]).length, 1);
});
test("chrome text and semantic colors have accessible contrast against operational surfaces", () => {
  const { chrome } = moduleUnderTest("theme");
  function luminance(hex) { const channels = hex.slice(1).match(/../g).map((x) => parseInt(x, 16) / 255).map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return channels[0]*0.2126+channels[1]*0.7152+channels[2]*0.0722; }
  function ratio(a, b) { const x=luminance(a), y=luminance(b); return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05); }
  for (const foreground of ["ink", "muted", "brand", "good", "bad"]) for (const background of ["bg", "surface", "sunk"]) assert.ok(ratio(chrome[foreground], chrome[background]) >= 4.5, `${foreground}/${background}`);
  assert.ok(ratio(chrome.accent, chrome.onAccent) >= 4.5); assert.ok(ratio(chrome.flash, chrome.onFlash) >= 4.5);
});
test("native app identity, permissions and canonical backend remain unchanged after branding", () => {
  const { expo } = JSON.parse(fs.readFileSync(path.join(root, "app.json"), "utf8"));
  assert.equal(expo.ios.bundleIdentifier, "com.sidebanc.snapfront"); assert.equal(expo.android.package, "com.sidebanc.snapfront");
  assert.equal(expo.extra.eas.projectId, "d9ef2157-0771-455a-b3c4-867036f70222"); assert.equal(expo.extra.apiUrl, "https://snapfront.app");
  assert.equal(expo.userInterfaceStyle, "dark"); assert.ok(expo.plugins.includes("expo-system-ui"));
  assert.ok(expo.android.blockedPermissions.includes("android.permission.READ_MEDIA_IMAGES"));
  const picker = expo.plugins.find((plugin) => Array.isArray(plugin) && plugin[0] === "expo-image-picker"); assert.equal(picker[1].microphonePermission, false);
  for (const image of [expo.icon, expo.web.favicon, ...Object.entries(expo.android.adaptiveIcon).filter(([key]) => key.endsWith("Image")).map(([, value]) => value)]) assert.ok(fs.existsSync(path.join(root, image)));
});
test("photo creation and all existing routes stay reachable after the home facelift", () => {
  const photo = fs.readFileSync(path.join(root, "src/components/photo-composer.tsx"), "utf8");
  assert.ok(photo.includes("api.productFromPhoto")); assert.ok(photo.includes('router.push("/draft")')); assert.ok(photo.includes("priceCheckPhoto.set(photo)"));
  const wizard = fs.readFileSync(path.join(root, "src/app/storefront-setup.tsx"), "utf8");
  assert.ok(wizard.includes('leaveForProduct("/snap")')); assert.ok(fs.existsSync(path.join(root, "src/app/snap.tsx")));
  const tabs = fs.readFileSync(path.join(root, "src/app/(tabs)/_layout.tsx"), "utf8");
  for (const route of ["index", "find", "assistant", "create", "store", "trends"]) assert.ok(tabs.includes(`name="${route}"`));
  const dashboard = fs.readFileSync(path.join(root, "src/components/home-dashboard.tsx"), "utf8");
  for (const route of ["/snap", "/studio", "/assistant", "/find", "/storefront-setup", "/looks", "/orders"]) assert.ok(dashboard.includes(`"${route}"`));
});

test("My Store and Marketing photo shortcuts point directly to the relocated composer", () => {
  const store = fs.readFileSync(path.join(root, "src/app/(tabs)/store.tsx"), "utf8");
  const marketing = fs.readFileSync(path.join(root, "src/app/marketing.tsx"), "utf8");
  assert.ok(store.includes('text: "Snap or upload a photo", onPress: () => router.navigate("/snap")'));
  assert.ok(marketing.includes('label="Snap a product" onPress={() => router.navigate("/snap")}'));
});

test("store setup uses the actual template preview and keeps native photo/text controls separate from arbitrary imagery", () => {
  const wizard = fs.readFileSync(path.join(root, "src/app/storefront-setup.tsx"), "utf8");
  assert.ok(!wizard.includes('coverUrl ? c.onAccent'));
  assert.ok(wizard.includes('<TemplatePreview renderRevision={previewRecord?.revision ?? 0} preview={previewData}'));
  assert.ok(wizard.includes('<PhotoSwapPanel slot={photoSlot}'));
  assert.ok(wizard.includes('finalPreviewReady || missingPhotos.length || sampleWords.length'));
  assert.ok(wizard.includes('Finish: save my store design'));
});

test("web membership checkout has no seller navigation, including for signed-in users", () => {
  const nav = fs.readFileSync(path.join(root, "src/web/web-nav.tsx"), "utf8");
  const isolated = nav.match(/if \(path === "\/plans"\) \{[\s\S]*?\n  \}\n\n  return \(/)?.[0] || "";
  assert.ok(isolated, "Plans must have a dedicated navigation-free header before the normal menu");
  assert.ok(isolated.includes('require("../../assets/brand-mark.png")'), "Keep the actual Snapfront logo");
  assert.ok(isolated.includes("Secure membership"), "Show only a noninteractive checkout status");
  for (const link of ["<NavLink", "menu.map", "onPress=", "Open menu", "My store", "Digital products"]) {
    assert.ok(!isolated.includes(link), `Membership header must not render: ${link}`);
  }
  assert.ok(nav.indexOf('if (path === "/plans")') < nav.indexOf("signedIn ? NAV"), "Hide navigation regardless of membership status");
});

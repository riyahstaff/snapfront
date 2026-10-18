const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function load(name, mocks = {}) {
  const filename = path.join(root, 'src/lib', name + '.ts');
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename })((id) => {
    if (id in mocks) return mocks[id];
    if (id.endsWith('.webp')) { assert.ok(fs.existsSync(path.resolve(path.dirname(filename), id))); return id; }
    if (id === './bundled-theme-previews') return load('bundled-theme-previews');
    throw new Error('Unexpected dependency: ' + id);
  }, module, module.exports);
  return module.exports;
}
test('every premium ID has its own genuine renderer thumbnail shipped with the app', async () => {
  const { PREMIUM_THEMES } = await import('../../server/src/premium-themes.js');
  const { bundledThemePreview } = load('bundled-theme-previews');
  assert.equal(PREMIUM_THEMES.length, 85);
  const seen = new Set();
  for (const theme of PREMIUM_THEMES) {
    const asset = bundledThemePreview(theme.id);
    assert.ok(asset, theme.id); assert.ok(!seen.has(asset), theme.id); seen.add(asset);
    const mobile = path.join(root, 'assets/theme-previews', path.basename(asset));
    const server = path.join(root, '../server/assets/themes', path.basename(theme.preview));
    assert.deepEqual(fs.readFileSync(mobile), fs.readFileSync(server), theme.id + ' must be the actual renderer snapshot');
  }
  const { THEMES } = await import('../../server/src/themes.js');
  for (const theme of THEMES.filter(t => t.collection !== 'premium')) {
    const source = bundledThemePreview(theme.id);
    assert.ok(source, theme.id);
    const bytes = fs.readFileSync(path.join(root, 'assets/theme-previews', path.basename(source)));
    assert.ok(bytes.length > 100); assert.equal(bytes.toString('ascii', 0, 4), 'RIFF'); assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
  }
  assert.equal(fs.readdirSync(path.join(root, 'assets/theme-previews')).filter(n => n.endsWith('.webp')).length, 105);
  assert.equal(bundledThemePreview('p-future'), null);
  assert.equal(bundledThemePreview('__proto__'), null);
});
test('known premium cards use bundled assets even when the network URL is absent or unavailable', () => {
  const m = load('theme-preview-source');
  const theme = { id: 'p-jewelry', preview_url: 'https://snapfront.app/theme-assets/jewelry-preview.webp' };
  const sources = m.themePreviewSources(theme);
  assert.equal(sources.length, 2); assert.equal(sources[0].key, 'local:p-jewelry');
  assert.equal(m.availableThemePreview(theme, []).key, sources[0].key);
  assert.equal(m.availableThemePreview({ id: 'p-jewelry' }, []).key, sources[0].key);
  assert.equal(m.availableThemePreview(theme, [sources[0].key]).key, sources[1].key);
  assert.equal(m.availableThemePreview(theme, sources.map(x => x.key)), null);
});
test('future catalog cards can use HTTPS, unsafe URLs are rejected and recycled failures do not affect other themes', () => {
  const m = load('theme-preview-source');
  for (const url of ['http://example.com/image', 'file:///secret', 'javascript:evil']) assert.deepEqual(m.themePreviewSources({ id: 'p-future', preview_url: url }), []);
  const theme = { id: 'p-future', preview_url: 'https://example.com/image.webp' };
  assert.deepEqual(m.availableThemePreview(theme, ['local:p-jewelry']).source, { uri: theme.preview_url });
  assert.ok(m.availableThemePreview({ id: 'p-audio' }, ['local:p-jewelry']));
});
test('release identity uses real installed native values and handles browser/development previews honestly', () => {
  const m = load('release-info', { 'expo-application': { nativeApplicationVersion: '1.0.1', nativeBuildVersion: '22', applicationId: 'com.sidebanc.snapfront' } });
  assert.equal(m.installedRelease().label, 'Snapfront 1.0.1 · Build 22');
  assert.equal(m.installedRelease().packageId, 'com.sidebanc.snapfront');
  const web = load('release-info', { 'expo-application': { nativeApplicationVersion: null, nativeBuildVersion: null, applicationId: null } });
  assert.match(web.installedRelease().label, /Development preview/);
  assert.equal(web.installedRelease().build, null);
});
test('Home and Settings display build identity; correction keeps the actual chrome Home and carousel', () => {
  const home = fs.readFileSync(path.join(root, 'src/components/home-dashboard.tsx'), 'utf8');
  const settings = fs.readFileSync(path.join(root, 'src/app/settings.tsx'), 'utf8');
  const preview = fs.readFileSync(path.join(root, 'src/components/theme-preview.tsx'), 'utf8');
  assert.ok(home.includes('<ReleaseInfo />')); assert.ok(settings.includes('<ReleaseInfo detailed />'));
  assert.ok(home.includes('Beautifully built.')); assert.ok(home.includes('<ThemeCarousel'));
  assert.ok(preview.includes('availableThemePreview')); assert.ok(preview.includes('Retry image')); assert.ok(preview.includes('event.stopPropagation()'));
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'app.json'))).expo.version, '1.4.0');
});

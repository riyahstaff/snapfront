const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function load(file, mocks = {}) {
  const filename = path.join(root, 'src/lib', file + '.ts');
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename })((id) => {
    if (id in mocks) return mocks[id];
    if (id.endsWith('.png')) { const target = path.resolve(path.dirname(filename), id); assert.ok(fs.existsSync(target), target); return target; }
    throw new Error('Unexpected runtime dependency: ' + id);
  }, module, module.exports);
  return module.exports;
}
test('the whole 50-design library can be browsed from packaged metadata without seller or network calls', async () => {
  const { DIGITAL_DESIGNS, DIGITAL_FORMATS, DIGITAL_DESIGN_VERSION } = load('digital-design-catalog');
  const { publicDigitalCatalog } = await import('../../server/src/digital-catalog.js');
  assert.equal(DIGITAL_DESIGN_VERSION, 2); assert.equal(DIGITAL_DESIGNS.length, 50);
  assert.equal(new Set(DIGITAL_DESIGNS.map(x => x.id)).size, 50);
  for (const format of DIGITAL_FORMATS) assert.equal(DIGITAL_DESIGNS.filter(x => x.format === format.id).length, 10);
  assert.deepEqual(DIGITAL_DESIGNS, publicDigitalCatalog().templates);
  for (const item of DIGITAL_DESIGNS) { assert.ok(item.sample.title); assert.ok(item.palette.paper); assert.ok(item.description); }
});
test('every original design has a unique real rendered local thumbnail identical to its server cover', () => {
  const { DIGITAL_DESIGNS } = load('digital-design-catalog');
  const { DIGITAL_DESIGN_THUMBNAILS } = load('digital-design-thumbnails');
  const dir = path.join(root, 'assets/digital-designs');
  assert.equal(fs.readdirSync(dir).filter(x => x.endsWith('.png')).length, 50);
  const paths = new Set();
  for (const item of DIGITAL_DESIGNS) {
    const file = DIGITAL_DESIGN_THUMBNAILS[item.id];
    assert.ok(file, item.id); assert.ok(!paths.has(file)); paths.add(file);
    const bytes = fs.readFileSync(file);
    assert.equal(bytes.subarray(1, 4).toString('ascii'), 'PNG'); assert.ok(bytes.length > 500);
    assert.deepEqual(bytes, fs.readFileSync(path.join(root, '../server/assets/digital-designs', path.basename(file))));
  }
  assert.equal(Object.hasOwn(DIGITAL_DESIGN_THUMBNAILS, '__proto__'), false);
  assert.equal(Object.hasOwn(DIGITAL_DESIGN_THUMBNAILS, 'missing-template'), false);
});
test('the studio release keeps silver branding, original product camera and existing storefront flows', () => {
  const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8')).expo;
  assert.equal(app.version, '1.5.4'); assert.equal(app.android.package, 'com.sidebanc.snapfront');
  assert.equal(app.owner, 'snapfront'); assert.equal(app.icon, './assets/icon.png');
  assert.ok(fs.readFileSync(path.join(root, 'src/components/home-dashboard.tsx'), 'utf8').includes('<ThemeCarousel'));
  assert.ok(fs.existsSync(path.join(root, 'src/app/snap.tsx')));
  assert.ok(fs.readFileSync(path.join(root, 'src/app/storefront-setup.tsx'), 'utf8').includes('TemplatePreview'));
});

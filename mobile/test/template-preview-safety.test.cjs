const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');

function loadComponent(name, mocks = {}) {
  const cache = new Map();
  function load(id, folder = 'components') {
    if (id in mocks) return mocks[id];
    const key = `${folder}:${id}`; if (cache.has(key)) return cache.get(key);
    const filename = path.join(root, 'src', folder, `${id}.ts`);
    const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    const mod = { exports: {} }; cache.set(key, mod.exports);
    vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename })((request) => {
      if (request in mocks) return mocks[request];
      if (request.startsWith('@/lib/')) return load(request.slice('@/lib/'.length), 'lib');
      if (request.startsWith('./')) return load(request.slice(2), folder);
      throw new Error(`Unexpected dependency ${request}`);
    }, mod, mod.exports);
    cache.set(key, mod.exports); return mod.exports;
  }
  return load(name);
}
const fakeDraft = { banner_file: 'main.jpg', banner_url: 'https://cdn.example/main.jpg', photo_files: ['d1.jpg', null], photo_urls: ['https://cdn.example/d1.jpg', null] };

test('inline preview blocks unsafe executable/navigation markup and accepts only bounded exact photo bridge messages', () => {
  const m = loadComponent('template-preview-bridge', { '@/lib/api': {} });
  const html = m.buildTemplatePreviewDocument('<script>alert(1)</script><a href="https://bad.example" target="_blank">bad</a><img src="javascript:bad" onerror="bad()"><button data-photo-slot="2">photo</button>', 'native');
  assert.ok(!html.includes('alert(1)')); assert.ok(!html.includes('target=')); assert.ok(!html.includes('javascript:bad')); assert.ok(html.includes('Content-Security-Policy'));
  assert.deepEqual(m.previewBridgeMessage('{"type":"photo","index":2}'), { type: 'photo', index: 2 });
  assert.equal(m.previewBridgeMessage('{"type":"photo","index":3}'), null); assert.equal(m.previewBridgeMessage('x'.repeat(513)), null);
  assert.equal(m.isAllowedPreviewNavigation('about:blank#slot'), true); assert.equal(m.isAllowedPreviewNavigation('https://shop.example'), false);
});

test('Studio safeguards require real owned references and isolate late results by initiating store, slot and revision', () => {
  const m = loadComponent('photo-swap-safeguards', { '@/lib/api': {}, '@/lib/storefront-draft': {}, '@/lib/template-setup': { templatePhotoForSlot: () => null } });
  assert.equal(m.ownedPhoto({ image_file: 'photo.jpg', image_url: 'data:image/png;base64,AAA' }, 'x', 'product'), null);
  const source = m.ownedPhoto({ image_file: 'photo.jpg', image_url: 'https://cdn.example/photo.jpg' }, 'My product', 'product');
  assert.ok(source);
  const result = m.retainStudioResult('store-a', 1, 7, source, { image_file: 'made.webp', image_url: 'https://cdn.example/made.webp', source_file: 'photo.jpg' });
  assert.equal(result.storeId, 'store-a'); assert.ok(m.studioResultFor('store-a', 1, 7));
  assert.equal(m.studioResultFor('store-b', 1, 7), null); assert.equal(m.studioResultFor('store-a', 2, 7), null); assert.equal(m.studioResultFor('store-a', 1, 8), null);
  assert.equal(m.retainStudioResult('store-a', 1, 7, source, { image_file: 'made.webp', image_url: 'https://cdn.example/made.webp', source_file: 'other.jpg' }), null);
});

test('template preview and Studio API calls keep the initiating owner and only send the documented request bodies', async () => {
  const calls = [];
  const filename = path.join(root, 'src/lib/api.ts');
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const mod = { exports: {} };
  const secure = { getItemAsync: async (key) => key === 'snapfront.token' ? 'token' : null, setItemAsync: async () => {}, deleteItemAsync: async () => {} };
  vm.runInThisContext(`(function(require,module,exports,fetch){${code}\n})`, { filename })((id) => {
    if (id === 'expo-secure-store') return secure;
    if (id === 'expo-constants') return { default: { expoConfig: { extra: { apiUrl: 'https://test.invalid' } } } };
    throw new Error(`Unexpected dependency ${id}`);
  }, mod, mod.exports, async (url, init) => { calls.push({ url, init }); return { ok: true, status: 200, json: async () => ({ html: '', photo_slots: [], sample_products: 0, mode: 'template', theme: { id: 'p-one', name: 'One' } }) }; });
  await mod.exports.api.templatePreview({ theme: 'p-one', design_photos: [null, 'detail.jpg'] }, 'template', 'store-a');
  await mod.exports.api.studio({ image_file: 'owned.jpg', style: { scene: 'linen' } }, 'store-a');
  assert.ok(calls[0].url.endsWith('/api/storefront/template-preview'));
  assert.deepEqual(JSON.parse(calls[0].init.body), { theme: 'p-one', design_photos: [null, 'detail.jpg'], mode: 'template' });
  assert.ok(calls[1].url.endsWith('/api/studio'));
  assert.equal(calls[0].init.headers['X-Store'], 'store-a'); assert.equal(calls[1].init.headers['X-Store'], 'store-a');
});

test('actual renderer body classes, trusted typefaces and server photo-slot attributes survive into the native editing document', () => {
  const m = loadComponent('template-preview-bridge', { '@/lib/api': {} });
  const html = m.buildTemplatePreviewDocument('<html><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif"><link href="https://evil.example/a.css"><style>.premium .hero{display:grid}</style></head><body class="premium theme-jewelry"><img data-sf-photo="1" src="https://cdn.example/main.jpg"></body></html>', 'native');
  assert.ok(html.includes('<body class="premium theme-jewelry">'));
  assert.ok(html.includes('https://fonts.googleapis.com/css2?family=Instrument+Serif'));
  assert.ok(!html.includes('evil.example'));
  assert.ok(html.includes("node.getAttribute('data-sf-photo')"));
  const wizard = fs.readFileSync(path.join(root, 'src/app/storefront-setup.tsx'), 'utf8');
  assert.ok(wizard.includes('patch({ sample_fields: [] }, false)'));
  assert.ok(wizard.includes('previewRecord?.patch === previewPatch'));
  assert.ok(wizard.includes('missingPhotos.length || sampleWords.length || saveState !== "saved"'));
  const looks = fs.readFileSync(path.join(root, 'src/app/looks.tsx'), 'utf8');
  assert.ok(looks.includes('label="Customize this design"'));
  assert.ok(looks.includes('params: { theme: chosen.id }'));
  const product = fs.readFileSync(path.join(root, 'src/app/product/[id].tsx'), 'utf8');
  assert.ok(product.includes('Continue customizing my storefront'));
  assert.ok(product.includes('router.navigate("/storefront-setup")'));
});

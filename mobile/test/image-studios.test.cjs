const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function load(relative, mocks = {}) {
  const filename = path.join(root, relative);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(compiled, { module, exports: module.exports, require: (name) => { if (!(name in mocks)) throw Error(`Unexpected ${name}`); return mocks[name]; }, URL, Date, Math, Map, console }, { filename });
  return module.exports;
}
const requestCalls = [];
const images = load('src/lib/image-assistant.ts', { '@/lib/api': { imageRequest: (...args) => { requestCalls.push(args); return Promise.resolve({ id: 'job-one' }); } } });
const preview = load('src/components/template-preview-bridge.ts');
const done = { id: 'one', context: 'digital', operation: 'digital-art', status: 'done', prompt: 'An elegant illustration', aspect: 'portrait', slot: null, product_id: 'product-a', source_file: null, image_file: 'generated-one.jpg', image_url: 'https://snapfront.app/img/generated-one.jpg', error: null, created_at: '2026-10-13' };

test('Refresh changes only unsigned owned picture URLs, leaves signed/external/data/font URLs alone and retains isolated frame safety', () => {
  const html = '<html><head><link href="https://fonts.googleapis.com/css2?family=Figtree" rel="stylesheet"></head><body class="premium-theme"><img src="https://snapfront.app/img/my-picture.jpg"><img src="https://snapfront.app/theme-assets/theme.webp"><img src="https://other.example/img/external.jpg"><img src="data:image/png;base64,AA=="><img src="https://snapfront.app/img/private.jpg?signature=signed"><script>alert(1)</script></body></html>';
  const changed = preview.refreshTemplateImages(html, 7, 'https://snapfront.app');
  assert.ok(changed.includes('my-picture.jpg?sf_preview=7'));
  assert.ok(changed.includes('theme.webp?sf_preview=7'));
  assert.ok(changed.includes('https://other.example/img/external.jpg"'));
  assert.ok(changed.includes('private.jpg?signature=signed"'));
  assert.ok(changed.includes('data:image/png;base64,AA=='));
  assert.equal(preview.refreshTemplateImages(html, 0, 'https://snapfront.app'), html);
  const frame = preview.buildTemplatePreviewDocument(changed, 'native');
  assert.ok(frame.includes('premium-theme')); assert.ok(!frame.includes('alert(1)'));
  assert.ok(frame.includes("connect-src 'none'")); assert.ok(frame.includes('fonts.googleapis.com'));
  assert.equal(preview.isAllowedPreviewNavigation('https://snapfront.app'), false);
});

test('image start and resume carry exact initiating store and prompt, without new request keys on status reads', async () => {
  requestCalls.length = 0;
  const input = { operation: 'storefront-edit', prompt: 'Keep the exact product. Add cinematic silver reflections and soft light.', image_file: 'my-picture.jpg', aspect: 'wide', slot: 0, idempotency_key: 'one-explicit-request' };
  await images.imageAssistant.start(input, 'store-a');
  await images.imageAssistant.job('one/job', 'store-a');
  await images.imageAssistant.options('storefront', 'store-a');
  assert.equal(requestCalls[0][0], 'POST'); assert.equal(requestCalls[0][2], input); assert.equal(requestCalls[0][3], 'store-a');
  assert.deepEqual([...requestCalls[1]], ['GET', '/api/image-assistant/jobs/one%2Fjob', undefined, 'store-a']);
  assert.deepEqual([...requestCalls[2]], ['GET', '/api/image-assistant?context=storefront', undefined, 'store-a']);
});

test('terminal history cannot regress to running after an older status read', () => {
  assert.equal(images.usableImageJob(done), true);
  assert.equal(images.usableImageJob({ ...done, image_file: '../file.jpg' }), false);
  assert.equal(images.usableImageJob({ ...done, image_url: 'javascript:alert(1)' }), false);
  const original = [done];
  assert.equal(images.mergeImageJob(original, { ...done, status: 'running', image_file: undefined }), original);
  assert.equal(images.imageJobRunning({ ...done, status: 'queued' }), true);
  assert.equal(images.jobsForStorefrontSlot([{ ...done, context: 'storefront', slot: 1 }, { ...done, context: 'digital', slot: 1 }], 1).length, 1);
});

test('digital artwork returns to one explicit owner, product, page and block; it does not attach a PDF', () => {
  const selected = { storeId: 'a', productId: 'p', pageId: 'page', blockId: 'block', image_file: 'generated-one.jpg', image_url: done.image_url };
  images.rememberDigitalArtwork(selected);
  assert.equal(images.consumeDigitalArtwork('b', 'p'), null);
  assert.equal(images.consumeDigitalArtwork('a', 'other'), null);
  assert.deepEqual({ ...images.consumeDigitalArtwork('a', 'p') }, selected);
  assert.equal(images.consumeDigitalArtwork('a', 'p'), null);
  assert.throws(() => images.rememberDigitalArtwork({ ...selected, blockId: '' }), /same digital page/);
});

test('actual native Refresh remounts identical HTML and actual page studio handoff waits for private save', () => {
  const native = fs.readFileSync(path.join(root, 'src/components/template-preview.native.tsx'), 'utf8');
  const web = fs.readFileSync(path.join(root, 'src/components/template-preview.web.tsx'), 'utf8');
  const wizard = fs.readFileSync(path.join(root, 'src/app/storefront-setup.tsx'), 'utf8');
  const editor = fs.readFileSync(path.join(root, 'src/app/digital-editor.tsx'), 'utf8');
  const studio = fs.readFileSync(path.join(root, 'src/app/digital-photo-studio.tsx'), 'utf8');
  assert.ok(native.includes('key={renderRevision}')); assert.ok(web.includes('key={renderRevision}'));
  assert.ok(native.includes('onRenderProcessGone')); assert.ok(native.includes('Refreshing…'));
  assert.ok(wizard.includes('revision: request')); assert.ok(wizard.includes('This refresh used no AI credits'));
  assert.ok(editor.indexOf('const saved = await saveDraft();') < editor.indexOf('pathname: "/digital-photo-studio"'));
  assert.ok(editor.includes('block.kind !== "image"')); assert.ok(editor.includes('consumeDigitalArtwork'));
  assert.ok(studio.includes('Recover the same request')); assert.ok(studio.includes('candidate.product_id !== started.productId'));
  assert.ok(studio.includes('{ image_file: candidate.image_file }, started.storeId'));
  assert.ok(!studio.includes('delivery_file:'));
});

function apiFixture(mode) {
  const filename = path.join(root, 'src/lib/api.ts');
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const module = { exports: {} }; const timers = []; const cleared = []; const calls = [];
  const secure = { getItemAsync: () => mode === 'auth' ? new Promise(() => {}) : Promise.resolve('fixture-token-only'), setItemAsync: () => Promise.resolve(), deleteItemAsync: () => Promise.resolve() };
  vm.runInNewContext(compiled + "\nexports.__selectStoreForTest = setStore;", { module, exports: module.exports, require: (name) => name === 'expo-constants' ? { default: { expoConfig: { extra: { apiUrl: 'https://fixture.invalid' } } } } : name === 'expo-secure-store' ? secure : (() => { throw Error(name); })(), URL, AbortController, console,
    fetch: async (url, options) => { calls.push({ url, options }); if (mode === 'headers') return new Promise(() => {}); return { ok: true, status: 200, json: () => new Promise(() => {}) }; },
    setTimeout: (fn, delay) => { timers.push({ fn, delay }); return timers.length; }, clearTimeout: (id) => cleared.push(id),
  }, { filename });
  return { api: module.exports.api, selectStore: module.exports.__selectStoreForTest, timers, cleared, calls };
}
for (const mode of ['auth', 'headers', 'body']) {
  test(`Refresh timeout covers a stalled ${mode} phase and releases its timer`, async () => {
    const fixture = apiFixture(mode);
    const pending = fixture.api.templatePreview({ theme: 'p-candles' }, 'template', 'original-store');
    const rejection = assert.rejects(pending, (error) => error.status === 0 && /draft is safe/.test(error.message));
    await new Promise(setImmediate);
    assert.equal(fixture.timers.length, 1); assert.ok(fixture.timers[0].delay > 0);
    fixture.timers[0].fn(); await rejection;
    assert.equal(fixture.cleared.length, 1);
    assert.equal(fixture.calls.length, mode === 'auth' ? 0 : 1);
    if (fixture.calls.length) {
      assert.equal(fixture.calls[0].options.headers['X-Store'], 'original-store');
      assert.equal(fixture.calls[0].options.signal.aborted, true);
    }
  });
}

test('image ownership sees the newly selected store before an asynchronous account refresh', async () => {
  const fixture = apiFixture('headers');
  assert.equal(fixture.api.selectedStore(), null);
  const revision = fixture.api.storeRevision();
  const persistence = fixture.selectStore('newly-selected-store');
  assert.equal(fixture.api.selectedStore(), 'newly-selected-store');
  assert.equal(fixture.api.storeRevision(), revision + 1);
  assert.equal(fixture.calls.length, 0);
  await persistence;
});

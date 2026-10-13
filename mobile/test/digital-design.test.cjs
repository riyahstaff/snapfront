const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const cache = new Map();
function loadLib(file) {
  if (cache.has(file)) return cache.get(file);
  const filename = path.join(root, 'src/lib', file + '.ts');
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  cache.set(file, module.exports);
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename })((id) => {
    if (id === './digital-design') return loadLib('digital-design');
    throw new Error('Unexpected runtime dependency: ' + id);
  }, module, module.exports);
  cache.set(file, module.exports);
  return module.exports;
}

const document = {
  schema_version: 1,
  format: 'guide',
  template_id: 'guide-01',
  title: 'Original title', subtitle: 'Original subtitle', brand: 'Original brand', eyebrow: 'START',
  palette: { paper: '#FFFFFF', ink: '#111111', accent: '#222222', muted: '#333333', soft: '#444444' },
  fonts: { heading: 'sans', body: 'sans' },
  pages: [{ id: 'page_one', title: 'Original page', kind: 'content', blocks: [{ id: 'block_one', kind: 'paragraph', text: 'Every authored word stays.' }] }],
};

test('a visual template replacement keeps every authored source page and word', () => {
  const { applyDigitalTemplateStyle } = loadLib('digital-editor-session');
  const styled = applyDigitalTemplateStyle(document, {
    id: 'quotes-07', format: 'quotes',
    palette: { paper: '#FAFAFA', ink: '#000000', accent: '#AB12CD', muted: '#666666', soft: '#EEEEEE' },
    fonts: { heading: 'display', body: 'serif' },
  });
  assert.equal(styled.template_id, 'quotes-07');
  assert.equal(styled.format, 'quotes');
  assert.equal(styled.palette.accent, '#AB12CD');
  assert.equal(styled.fonts.heading, 'display');
  assert.deepEqual(styled.pages, document.pages);
  assert.equal(styled.title, document.title);
  assert.equal(styled.pages[0].blocks[0].text, 'Every authored word stays.');
  assert.notEqual(styled.pages, document.pages);
});

test('session undo is bounded and attaching requires the exact saved reviewed export', () => {
  const { DIGITAL_UNDO_LIMIT, appendDigitalUndo, isCurrentDigitalExport } = loadLib('digital-editor-session');
  let history = [];
  for (let index = 0; index < DIGITAL_UNDO_LIMIT + 4; index++) {
    history = appendDigitalUndo(history, { ...document, title: `Version ${index}` });
  }
  assert.equal(history.length, DIGITAL_UNDO_LIMIT);
  assert.equal(history[0].title, 'Version 4');
  const exportRecord = { id: 'export_safe', revision: 7, document_hash: 'same-hash', page_count: 2, pdf_url: 'https://private/pdf', cover_url: 'https://private/cover', created_at: 'now' };
  assert.equal(isCurrentDigitalExport({ export: exportRecord, revision: 7, savedGeneration: 3, draftGeneration: 3, previewHash: 'same-hash' }), true);
  assert.equal(isCurrentDigitalExport({ export: exportRecord, revision: 7, savedGeneration: 3, draftGeneration: 4, previewHash: 'same-hash' }), false);
  assert.equal(isCurrentDigitalExport({ export: exportRecord, revision: 7, savedGeneration: 3, draftGeneration: 3, previewHash: 'old-hash' }), false);
});

test('save errors preserve conflict, backend-unavailable, and offline boundaries', () => {
  const { digitalSaveError } = loadLib('digital-editor-session');
  assert.match(digitalSaveError({ status: 409 }), /not saved/i);
  assert.match(digitalSaveError({ status: 404 }), /not active/i);
  assert.match(digitalSaveError({ status: 0 }), /offline/i);
});

test('editor route requires an explicit owner and freezes attach to a reviewed revision', () => {
  const route = fs.readFileSync(path.join(root, 'src/app/digital-editor.tsx'), 'utf8');
  assert.match(route, /if \(!productId \|\| !routeStoreId\)/);
  assert.match(route, /sameDigitalSession\(started/);
  assert.match(route, /rebuild_legacy/);
  assert.match(route, /candidate\.id !== exported\?\.id/);
  assert.match(route, /new URL\(url\)\.protocol === "https:"/);
  assert.match(route, /api\.previewDigitalDesign/);
});

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
  const filename = path.join(root, 'src/lib', `${file}.ts`);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  cache.set(file, module.exports);
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename })((id) => {
    if (id === './digital-design') return loadLib('digital-design');
    throw new Error(`Unexpected runtime dependency: ${id}`);
  }, module, module.exports);
  cache.set(file, module.exports);
  return module.exports;
}

function loadComponent(file) {
  const filename = path.join(root, 'src/components', `${file}.ts`);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename })(() => {
    throw new Error('Preview bridge must not import runtime dependencies.');
  }, module, module.exports);
  return module.exports;
}

const palette = { paper: '#FFFFFF', ink: '#101010', accent: '#6543AA', muted: '#555555', soft: '#EEEEEE' };
const summary = (id, design_revision) => ({
  id,
  name: `Design ${id}`,
  format: 'guide',
  ...(design_revision === undefined ? {} : { design_revision }),
  description: 'A refined editable design.',
  tags: ['editorial'],
  palette,
  fonts: { heading: 'display', body: 'sans' },
  sample: { title: 'A title', subtitle: 'A subtitle', brand: 'YOUR BRAND', eyebrow: 'EDITION ONE' },
  preview_url: `/digital-design-assets/${id}.png`,
});

const legacyDocument = {
  schema_version: 1,
  format: 'guide',
  template_id: 'guide-01',
  title: 'Original title',
  subtitle: 'Original subtitle',
  brand: 'Original brand',
  eyebrow: 'START',
  palette,
  fonts: { heading: 'sans', body: 'sans' },
  pages: [{ id: 'page_one', title: 'Original page', kind: 'content', blocks: [{ id: 'block_one', kind: 'paragraph', text: 'Every authored word stays.' }] }],
};

test('new and explicitly switched designs use revision two without upgrading an existing legacy source', () => {
  const { cloneDigitalDocument, digitalDesignRevision, newDigitalDocument } = loadLib('digital-design');
  const { applyDigitalTemplateStyle } = loadLib('digital-editor-session');

  const created = newDigitalDocument(summary('guide-02', 2));
  assert.equal(created.design_revision, 2);
  assert.equal(created.show_artwork, true);
  assert.equal(newDigitalDocument('guide-03').design_revision, 2, 'new-source fallback is premium revision two');

  const restoredLegacy = cloneDigitalDocument(legacyDocument);
  assert.equal(restoredLegacy.design_revision, undefined);
  assert.equal(restoredLegacy.show_artwork, undefined);
  assert.equal(digitalDesignRevision(restoredLegacy), 1, 'missing revision remains legacy until a selection');

  const styled = applyDigitalTemplateStyle(legacyDocument, summary('guide-04', 2));
  assert.equal(styled.design_revision, 2);
  assert.equal(styled.show_artwork, true);
  assert.equal(styled.template_id, 'guide-04');
  assert.deepEqual(styled.pages, legacyDocument.pages);
  assert.equal(styled.pages[0].blocks[0].text, 'Every authored word stays.');
  assert.equal(styled.title, legacyDocument.title);
});

test('remote catalog metadata is used only when it matches the packaged artwork revision', () => {
  const { mergeDigitalTemplateSummaries } = loadLib('digital-design');
  const bundledV1 = summary('guide-01', 1);
  const bundledV2 = summary('guide-02', 2);
  const remoteV2ForV1 = { ...summary('guide-01', 2), name: 'Remote V2' };
  const remoteV1ForV2 = { ...summary('guide-02', 1), name: 'Remote V1' };
  const remoteV2ForV2 = { ...summary('guide-02', 2), name: 'Remote Matching V2' };

  assert.equal(mergeDigitalTemplateSummaries([bundledV1], [remoteV2ForV1])[0], bundledV1);
  assert.equal(mergeDigitalTemplateSummaries([bundledV2], [remoteV1ForV2])[0], bundledV2);
  assert.equal(mergeDigitalTemplateSummaries([bundledV2], [remoteV2ForV2])[0], remoteV2ForV2);
});

test('the constrained native SVG bridge retains premium gradients, clip paths, and owned data images', () => {
  const { buildDigitalPreviewDocument, sanitizeDigitalSvg } = loadComponent('digital-preview-bridge');
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="chrome"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#333"/></linearGradient><clipPath id="coverClip"><rect width="90" height="90"/></clipPath></defs><image href="data:image/png;base64,aGVsbG8=" width="90" height="90" clip-path="url(#coverClip)"/><rect width="100" height="100" fill="url(#chrome)" clip-path="url(#coverClip)"/></svg>';
  const safe = sanitizeDigitalSvg(svg);
  assert.ok(safe);
  assert.match(safe, /linearGradient id="chrome"/);
  assert.match(safe, /clipPath id="coverClip"/);
  assert.match(safe, /data:image\/png;base64,aGVsbG8=/);
  assert.match(safe, /url\(#coverClip\)/);

  const nativeDocument = buildDigitalPreviewDocument(svg, 'native');
  assert.ok(nativeDocument);
  assert.match(nativeDocument, /img-src data:/);
  assert.match(nativeDocument, /font-src data:/);
  assert.match(nativeDocument, /ReactNativeWebView/);

  const noExternalImage = sanitizeDigitalSvg('<svg><image href="https://example.com/not-allowed.png"/></svg>');
  assert.ok(noExternalImage);
  assert.doesNotMatch(noExternalImage, /https:\/\//);
});

test('the native UI routes the selected revision, preserves whole-cover previews, and exposes the artwork toggle', () => {
  const picker = fs.readFileSync(path.join(root, 'src/components/digital-design-picker.tsx'), 'utf8');
  const controls = fs.readFileSync(path.join(root, 'src/components/digital-document-controls.tsx'), 'utf8');
  const designs = fs.readFileSync(path.join(root, 'src/app/digital-designs.tsx'), 'utf8');
  const create = fs.readFileSync(path.join(root, 'src/app/(tabs)/create.tsx'), 'utf8');
  const api = fs.readFileSync(path.join(root, 'src/lib/api.ts'), 'utf8');

  assert.match(picker, /mergeDigitalTemplateSummaries\(DIGITAL_DESIGNS, remoteTemplates\)/);
  assert.match(picker, /Premium collection/);
  assert.match(picker, /50 signature designs/);
  assert.match(picker, /contentFit="contain"/);
  assert.match(controls, /Show original artwork/);
  assert.match(controls, /Title and text always stay editable/);
  assert.match(designs, /design_revision: digitalDesignRevision\(selected, 2\)/);
  assert.match(designs, /design_revision: String\(digitalDesignRevision\(selected, 2\)\)/);
  assert.match(create, /design_revision: templateDesignRevision \?\? 2/);
  assert.match(api, /\/api\/digital-designs\?revision=2/);
});

test('explicit revision-one summaries never send premium-only artwork source', () => {
  const { newDigitalDocument, validateDigitalDocument } = loadLib('digital-design');
  const { applyDigitalTemplateStyle } = loadLib('digital-editor-session');
  const original = newDigitalDocument(summary('guide-01', 1));
  assert.equal(original.design_revision, 1);
  assert.equal(original.show_artwork, undefined);
  assert.equal(validateDigitalDocument(original), null);
  const premium = newDigitalDocument(summary('guide-02', 2));
  const restored = applyDigitalTemplateStyle(premium, summary('guide-01',1));
  assert.equal(restored.show_artwork, undefined);
  assert.deepEqual(restored.pages, premium.pages);
  assert.equal(validateDigitalDocument(restored), null);
  assert.match(validateDigitalDocument({...restored,show_artwork:true}),/premium designs only/);
});

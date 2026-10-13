const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');

function modules(storage = {}) {
  const memory = new Map(); const cache = new Map();
  const secure = { getItemAsync: async key => memory.get(key) ?? null, setItemAsync: async (key, value) => memory.set(key, value), deleteItemAsync: async key => memory.delete(key), ...storage };
  function load(name) {
    if (name === 'expo-secure-store') return secure;
    if (cache.has(name)) return cache.get(name);
    const filename = path.join(root, 'src/lib', `${name}.ts`);
    const source = fs.readFileSync(filename, 'utf8');
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const mod = { exports: {} }; cache.set(name, mod.exports);
    vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename })((id) => load(id.startsWith('./') ? id.slice(2) : id), mod, mod.exports);
    cache.set(name, mod.exports); return mod.exports;
  }
  return { ...load('storefront-draft'), ...load('template-setup'), memory };
}
const theme = (id, copy = {}) => ({ id, name: id === 'p-one' ? 'One' : 'Two', copy, colors: {}, fonts: {}, shape: {} });
const photo = (file, url = `https://cdn.example/${file}`) => ({ image_file: file, image_url: url });

test('theme seed labels only blank/sample copy and preserves manual words, name and notes across switches', () => {
  const m = modules();
  let draft = m.newStorefrontDraft({ store_name: 'Real shop', notes: 'Only real details', tagline: 'My handmade goods', hero_title: 'Edited title' });
  draft = m.seedThemeDraft(draft, theme('p-one', { title: 'First sample', subtitle: 'First sub', cta: 'Browse' }));
  assert.equal(draft.hero_title, 'Edited title'); assert.equal(draft.tagline, 'My handmade goods');
  assert.ok(draft.sample_fields.includes('hero_subtitle')); assert.ok(!draft.sample_fields.includes('hero_title'));
  const switched = m.seedThemeDraft(draft, theme('p-two', { title: 'Second sample', subtitle: 'Second sub', cta: 'Discover' }));
  assert.equal(switched.hero_title, 'Edited title'); assert.equal(switched.hero_subtitle, 'Second sub');
  assert.equal(switched.store_name, 'Real shop'); assert.equal(switched.notes, 'Only real details'); assert.equal(switched.template_theme, 'p-two');
  const classic = m.seedThemeDraft(m.newStorefrontDraft(), { ...theme('classic'), collection: 'classic' });
  assert.equal(classic.hero_title, ''); assert.equal(classic.hero_subtitle, '');
  assert.ok(classic.sample_fields.includes('tagline')); assert.ok(classic.sample_fields.includes('about'));
});

test('manual template edits unmark only touched samples and review clear changes only explicit choices', () => {
  const m = modules();
  const seeded = m.seedThemeDraft(m.newStorefrontDraft(), theme('p-one', { title: 'Sample headline', subtitle: 'Sample sub' }));
  const edited = m.editTemplateDraft(seeded, { hero_title: 'My honest headline' });
  assert.ok(!edited.sample_fields.includes('hero_title')); assert.ok(edited.sample_fields.includes('hero_subtitle'));
  const reviewed = m.clearSampleCopy(edited, ['hero_subtitle']);
  assert.equal(reviewed.hero_title, 'My honest headline'); assert.equal(reviewed.hero_subtitle, ''); assert.ok(!reviewed.sample_fields.includes('hero_subtitle'));
});

test('template photo patch has a main photo and exactly two nullable auxiliary slots without local bytes', () => {
  const m = modules();
  const draft = m.newStorefrontDraft({ banner_file: 'main.webp', banner_url: 'https://cdn.example/main.webp', photo_files: ['one.jpg', 'two.png', 'not-kept.gif'], photo_urls: ['https://cdn.example/one.jpg', 'https://cdn.example/two.png', 'data:image/ignored'], imageBase64: 'never' });
  assert.deepEqual(m.templatePhotoPatch(draft), { banner_file: 'main.webp', design_photos: ['one.jpg', 'two.png'] });
  assert.equal(draft.photo_files.length, 2); assert.ok(!JSON.stringify(draft).includes('never'));
});

test('late per-slot photo upload merges the initiating store newest draft and leaves text and other slots intact', async () => {
  const m = modules();
  const captured = m.newStorefrontDraft({ hero_title: 'Old', photo_files: ['old-detail.jpg', null], photo_urls: ['https://cdn.example/old-detail.jpg', null] });
  await m.saveStorefrontDraft('a', captured);
  const newer = m.saveStorefrontDraft('a', m.editTemplateDraft(captured, { hero_title: 'Newest words', photo_files: ['new-detail.jpg', null], photo_urls: ['https://cdn.example/new-detail.jpg', null] }));
  const late = m.mergeStorefrontPhoto('a', 2, photo('late.png'), captured);
  await Promise.all([newer, late]);
  const result = await m.loadStorefrontDraft('a');
  assert.equal(result.hero_title, 'Newest words'); assert.deepEqual(result.photo_files, ['new-detail.jpg', 'late.png']); assert.deepEqual(result.photo_urls, ['https://cdn.example/new-detail.jpg', 'https://cdn.example/late.png']);
  assert.equal(await m.loadStorefrontDraft('b'), null);
});

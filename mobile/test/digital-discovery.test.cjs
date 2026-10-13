const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

test('the 50-design library is a full primary Create action, separate from storefront themes', () => {
  const source = fs.readFileSync(path.join(root, 'src/app/(tabs)/create.tsx'), 'utf8');
  assert.ok(source.includes('"Browse 50 editable designs"} variant={templateId ? "secondary" : "primary"}'));
  assert.ok(source.includes('router.push("/digital-designs")'));
  assert.ok(source.includes('10 e-book designs · 10 checklists · 10 content packs · 10 quote prints · 10 planners'));
});

test('the digital Studio shortcut supplies the editor required id and initiating storeId', () => {
  const source = fs.readFileSync(path.join(root, 'src/app/digital-photo-studio.tsx'), 'utf8');
  const editor = fs.readFileSync(path.join(root, 'src/app/digital-editor.tsx'), 'utf8');
  assert.ok(source.includes('const started = beginSession();\n        if (!started) return;\n        router.push({ pathname: "/digital-editor", params: { id: started.productId, storeId: started.storeId } });'));
  assert.ok(editor.includes('const productId = firstParam(params.id)'));
  assert.ok(editor.includes('const routeStoreId = firstParam(params.storeId)'));
  assert.ok(!source.includes('params: { productId: ownedProduct.id }'));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { digitalTemplates, DIGITAL_FORMATS, publicDigitalCatalog, templateById, validateTemplate, fontPaths } from '../src/digital-catalog.js';

function luminance(hex) {
  const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(x => x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
  return rgb.reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
}
function contrast(a, b) { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }

test('exactly 50 original digital designs cover all five generated content formats', () => {
  assert.equal(digitalTemplates.length, 50);
  assert.equal(new Set(digitalTemplates.map(t => t.id)).size, 50);
  assert.equal(new Set(digitalTemplates.map(t => t.name)).size, 50);
  for (const format of DIGITAL_FORMATS) assert.equal(digitalTemplates.filter(t => t.format === format.id).length, 10);
  assert.equal(new Set(digitalTemplates.map(t => JSON.stringify(t.cover.shapes))).size, 50);
  assert.ok(new Set(digitalTemplates.map(t => JSON.stringify(t.cover.title))).size >= 30);
  assert.ok(new Set(digitalTemplates.map(t => t.interior.headerStyle)).size >= 4);
});
test('every cover preserves separated editable fields, legible contrast and trusted finite geometry', () => {
  for (const t of digitalTemplates) {
    assert.equal(validateTemplate(t), t);
    assert.ok(contrast(t.palette[t.cover.background], t.palette[t.cover.textColor]) >= 4.5, t.id);
    for (const a of ['eyebrow', 'title', 'subtitle', 'brand']) for (const b of ['eyebrow', 'title', 'subtitle', 'brand']) {
      if (a >= b) continue;
      const x = t.cover[a], y = t.cover[b];
      const overlap = Math.min(x.x + x.w, y.x + y.w) > Math.max(x.x, y.x) + 0.00001 && Math.min(x.y + x.h, y.y + y.h) > Math.max(x.y, y.y) + 0.00001;
      assert.equal(overlap, false, `${t.id}: ${a}/${b}`);
    }
    assert.equal(JSON.stringify(t).includes('https://'), false, t.id);
  }
});
test('public digital catalog contains only safe metadata and known actual-image paths', () => {
  const c = publicDigitalCatalog();
  assert.equal(c.version, 1); assert.equal(c.templates.length, 50);
  for (const t of c.templates) {
    assert.equal(t.preview_url, `/digital-design-assets/${t.id}.png`);
    assert.equal(t.cover, undefined); assert.equal(templateById(t.id).name, t.name);
  }
  assert.throws(() => templateById('__proto__'), /50 Snapfront/);
  assert.throws(() => templateById('../secret'), /50 Snapfront/);
});
test('digital font paths are bundled real files, so exports never need network typefaces', () => {
  for (const p of Object.values(fontPaths)) assert.ok(fs.statSync(p).size > 10_000, p);
});
test('catalog rejects unsafe geometry and arbitrary CSS color/image resources', () => {
  for (const mutate of [
    t => { t.cover.title.x = 0.9; },
    t => { t.palette.ink = 'url(https://evil)'; },
    t => { t.cover.shapes[0].fill = 'javascript:evil'; },
    t => { t.interior.bodySize = Infinity; },
    t => { t.cover.shapes.push({ kind: 'script', x: 0, y: 0, w: 1, h: 1, fill: 'ink' }); },
  ]) { const t = structuredClone(digitalTemplates[0]); mutate(t); assert.throws(() => validateTemplate(t)); }
});

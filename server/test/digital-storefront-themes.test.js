import test from 'node:test';
import assert from 'node:assert/strict';
import { THEMES } from '../src/themes.js';
import { CATEGORY_REGISTRY } from '../src/premium-themes.js';
import { themeDemoFixture, themeDemoPage } from '../src/theme-gallery.js';
import { storePage } from '../src/render.js';
const digital = THEMES.filter(t => t.group === 'digital');
test('25 digital themes use digital demo inventory and respect explicit still mode', () => {
  assert.equal(digital.length, 25);
  for (const t of digital) {
    assert.ok(themeDemoFixture(t.id).products.every(p => p.kind === 'digital'));
    assert.match(themeDemoPage(t.id), /data-hero-motion="(?:pan|drift)"/);
    assert.doesNotMatch(themeDemoPage(t.id, {motion:'still'}), /<section[^>]+data-hero-motion=/);
  }
});
test('digital themes preserve seller fields, suppress illustrative photos and support reduced motion', () => {
  for (const t of digital) {
    const html = storePage({store_name:'My own brand',store_slug:'mine',theme:t.id,hero_title:'My <title>',hero_subtitle:'My subtitle',hero_eyebrow:'My topic',hero_cta:'My button',hero_motion:'still'}, []);
    for(const text of ['My &lt;title&gt;', 'My subtitle','My topic','My button']) assert.ok(html.includes(text),t.id);
    assert.doesNotMatch(html, /src="[^\"]*theme-assets\//);
    assert.doesNotMatch(html, /<button[^>]*data-hero-motion-control/);
    const css = CATEGORY_REGISTRY.get(t.id).css;
    assert.match(css,/prefers-reduced-motion:reduce/);
    assert.match(css,/is-motion-paused/);
  }
});

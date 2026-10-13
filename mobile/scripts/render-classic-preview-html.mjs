// Actual storefront renderer, no seller/AI/payment records or requests.
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
process.env.DATA_DIR = mkdtempSync(path.join(tmpdir(), 'snapfront-classic-preview-'));
process.env.PUBLIC_URL = 'http://127.0.0.1:8093';
process.env.META_PUBLISHING_ENABLED = 'false';
const { THEMES } = await import('../../server/src/themes.js');
const { themeDemoFixture } = await import('../../server/src/theme-gallery.js');
const { storePage } = await import('../../server/src/render.js');
const output = process.argv[2];
if (!output) throw new Error('Specify a temporary HTML output directory');
mkdirSync(output, { recursive: true });
const classic = THEMES.filter(t => t.collection !== 'premium');
for (const theme of classic) {
  const { store, products } = themeDemoFixture(theme.id);
  // Same clearly labeled sample photograph across classic palettes: never seller inventory.
  store.banner_file = 'classic-sample.webp';
  for (const product of products) product.image_url = 'http://127.0.0.1:8093/assets/camera-test.webp';
  const html = storePage(store, products, process.env.PUBLIC_URL);
  writeFileSync(path.join(output, `${theme.id}.html`), html);
}
writeFileSync(path.join(output, 'ids.json'), JSON.stringify(classic.map(t => t.id)));
console.log(`Rendered ${classic.length} classic fixture pages, isolated DATA_DIR ${process.env.DATA_DIR}`);

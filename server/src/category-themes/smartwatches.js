import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-smartwatches',
  name: 'PULSE / FIELD',
  for: 'People who wear their day in motion',
  vibe: 'Dawn-run signal fields, cool mineral surfaces, and an alert graphic rhythm',
  category: 'Smartwatches and wearable technology',
  group: 'technology',
  display: 'Space Grotesk',
  body: 'DM Sans',
  displayWeight: 700,
  tracking: '-.055em',
  colors: {
    bg: '#E9EEE7',
    surface: '#F7F8F2',
    ink: '#10292D',
    muted: '#617375',
    line: '#B7C8C2',
    accent: '#FF5D43',
    onAccent: '#FFFFFF',
    panel: '#10292D',
    onPanel: '#F5FAEE',
    foot: '#0A1D20',
    onFoot: '#DCE8DD',
    bar: '#C9ED68',
    onBar: '#10292D',
    badge: '#FFCC4A',
    onBadge: '#10292D',
  },
  header: 'stack',
  hero: 'collage',
  card: 'bold',
  ratio: '1/1',
  rCard: 22,
  rBtn: 999,
  motion: 'drift',
  copy: {
    eyebrow: 'Wearable rhythm',
    collection: 'The signal shelf',
    cta: 'Browse the collection',
    title: 'Keep your day in motion.',
    subtitle: 'A considered edit of wearable tools for the pace you set.',
  },
});

const itemCount = (count) => `${Number(count) || 0} ${Number(count) === 1 ? 'item' : 'items'}`;
const pad = (index) => String(index + 1).padStart(2, '0');

function categoryLanes(ctx, categories) {
  return categories.map((category, index) => `<a class="smartwatches-lane" href="${ctx.categoryLink(category.name)}">
    <span class="smartwatches-lane-index">${pad(index)}</span>
    <span class="smartwatches-lane-line" aria-hidden="true"><i></i></span>
    <span class="smartwatches-lane-copy"><strong>${ctx.esc(category.name)}</strong><small>${ctx.esc(itemCount(category.count))}</small></span>
    <span class="smartwatches-lane-arrow" aria-hidden="true">↗</span>
  </a>`).join('');
}

function productSignals(ctx, products) {
  return products.map((product, index) => `<a class="smartwatches-product-signal" href="${ctx.productLink(product)}">
    <span class="smartwatches-signal-index">${pad(index)}</span>
    <span class="smartwatches-signal-copy"><strong>${ctx.esc(product.title)}</strong><small>${ctx.esc(ctx.money(product.price_cents ?? 0, product.currency || 'usd'))}</small></span>
    <span class="smartwatches-signal-arrow" aria-hidden="true">↗</span>
  </a>`).join('');
}

export function hero(ctx) {
  return `<section class="hero category-hero smartwatches-orbit-hero${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="smartwatches-orbit-stage">
      <div class="smartwatches-field-grid" aria-hidden="true"></div>
      <p class="smartwatches-stage-stamp" aria-hidden="true">01 / PULSE FIELD</p>
      <div class="smartwatches-copy-zone">
        ${ctx.copy('smartwatches-hero-copy')}
        <p class="smartwatches-aftercopy">Set the cadence. Take the long way.</p>
      </div>
      <div class="smartwatches-orbit-disc" aria-hidden="true">
        <div class="smartwatches-orbit-track"><i></i><i></i><i></i><i></i></div>
      </div>
      <div class="smartwatches-media-aperture">
        ${ctx.media(0, { priority: true, lazy: false, decorative: true })}
        <span class="smartwatches-aperture-glow" aria-hidden="true"></span>
      </div>
      <div class="smartwatches-pace-note" aria-hidden="true"><span>MOVE</span><i></i><span>PAUSE</span><i></i><span>REPEAT</span></div>
      <p class="smartwatches-side-note" aria-hidden="true">Wearable<br>time, open.</p>
      <div class="smartwatches-motion-control">${ctx.controls}</div>
    </div>
  </section>`;
}

export function discovery(ctx) {
  const categories = Array.isArray(ctx.cats) ? ctx.cats.filter((category) => category && category.name).slice(0, 4) : [];
  const products = Array.isArray(ctx.products) ? ctx.products.slice(0, 4) : [];

  if (categories.length >= 2) {
    return `<section class="theme-discovery smartwatches-discovery smartwatches-lane-map" aria-labelledby="smartwatches-discovery-title">
      <div class="smartwatches-discovery-heading">
        <p class="eyebrow">${ctx.esc(ctx.t.copy.collection)}</p>
        <h2 id="smartwatches-discovery-title">Find your<br>frequency.</h2>
        <p>Follow a live collection path from ${ctx.esc(ctx.store.store_name)}.</p>
      </div>
      <div class="smartwatches-lane-map-board">
        <p class="smartwatches-board-label" aria-hidden="true">Select a route</p>
        <div class="smartwatches-lanes">${categoryLanes(ctx, categories)}</div>
      </div>
    </section>`;
  }

  if (products.length >= 2) {
    return `<section class="theme-discovery smartwatches-discovery smartwatches-signal-board" aria-labelledby="smartwatches-discovery-title">
      <div class="smartwatches-discovery-heading">
        <p class="eyebrow">${ctx.esc(ctx.t.copy.collection)}</p>
        <h2 id="smartwatches-discovery-title">Start with<br>what is live.</h2>
        <p>Available pieces from ${ctx.esc(ctx.store.store_name)}.</p>
      </div>
      <div class="smartwatches-product-signals">${productSignals(ctx, products)}</div>
    </section>`;
  }

  return '';
}

export const css = `
.th-p-smartwatches {
  --sw-ink: #10292d;
  --sw-pale: #e9eee7;
  --sw-paper: #f7f8f2;
  --sw-line: #b7c8c2;
  --sw-mint: #c9ed68;
  --sw-coral: #ff5d43;
  --sw-sun: #ffcc4a;
  background: var(--sw-pale);
  color: var(--sw-ink);
}

.th-p-smartwatches .site-header,
.th-p-smartwatches .store-header {
  border-color: var(--sw-line);
  background: var(--sw-pale);
}

.th-p-smartwatches .category-hero.smartwatches-orbit-hero {
  margin: 0;
  padding: clamp(10px, 1.4vw, 22px);
  background: var(--sw-pale);
  color: var(--sw-ink);
}

.th-p-smartwatches .smartwatches-orbit-stage {
  position: relative;
  isolation: isolate;
  min-height: clamp(590px, 61vw, 830px);
  max-width: 1650px;
  margin: 0 auto;
  overflow: hidden;
  border: 1px solid var(--sw-ink);
  background: var(--sw-pale);
}

.th-p-smartwatches .smartwatches-field-grid {
  position: absolute;
  z-index: -2;
  inset: 0;
  opacity: .73;
  background-image:
    linear-gradient(90deg, transparent 49.8%, #93aaa052 50%, transparent 50.2%),
    linear-gradient(#93aaa033 1px, transparent 1px),
    linear-gradient(90deg, #93aaa033 1px, transparent 1px);
  background-position: center, center, center;
  background-size: auto, 100% 72px, 72px 100%;
}

.th-p-smartwatches .smartwatches-stage-stamp {
  position: absolute;
  top: clamp(18px, 2.2vw, 35px);
  left: clamp(18px, 2.3vw, 39px);
  z-index: 4;
  margin: 0;
  color: var(--sw-ink);
  font: 700 9px/1 var(--body);
  letter-spacing: .16em;
}

.th-p-smartwatches .smartwatches-copy-zone {
  position: relative;
  z-index: 3;
  width: min(48%, 580px);
  padding: clamp(86px, 12vw, 184px) 20px 46px clamp(28px, 7vw, 122px);
}

.th-p-smartwatches .smartwatches-hero-copy {
  max-width: 34rem;
}

.th-p-smartwatches .smartwatches-hero-copy .eyebrow,
.th-p-smartwatches .smartwatches-discovery-heading .eyebrow {
  margin: 0 0 15px;
  color: var(--sw-coral);
  font: 700 10px/1.2 var(--body);
  letter-spacing: .19em;
  text-transform: uppercase;
}

.th-p-smartwatches .smartwatches-hero-copy h1 {
  max-width: 8.8ch;
  margin: 0;
  color: var(--sw-ink);
  font: var(--dw) clamp(55px, 7.2vw, 118px)/.84 var(--display);
  letter-spacing: var(--dt);
  overflow-wrap: anywhere;
  text-wrap: balance;
}

.th-p-smartwatches .smartwatches-hero-copy h1.long {
  max-width: 12ch;
  font-size: clamp(43px, 5.25vw, 82px);
  line-height: .91;
}

.th-p-smartwatches .smartwatches-hero-copy .sub {
  max-width: 33ch;
  margin: 25px 0 0;
  color: #3e5759;
  font: 400 clamp(14px, 1.15vw, 17px)/1.55 var(--body);
}

.th-p-smartwatches .smartwatches-hero-copy .ctas {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 28px;
}

.th-p-smartwatches .smartwatches-hero-copy .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  padding: 0 20px;
  border: 1px solid var(--sw-ink);
  border-radius: 999px;
  background: var(--sw-ink);
  color: #f7f8f2;
  font: 700 11px/1 var(--body);
  letter-spacing: .05em;
  text-decoration: none;
  transition: color .2s ease, background-color .2s ease, border-color .2s ease;
}

.th-p-smartwatches .smartwatches-hero-copy .btn:hover {
  border-color: var(--sw-coral);
  background: var(--sw-coral);
  color: #ffffff;
}

.th-p-smartwatches .smartwatches-hero-copy .btn.ghost {
  background: transparent;
  color: var(--sw-ink);
}

.th-p-smartwatches .smartwatches-hero-copy .btn.ghost:hover {
  border-color: var(--sw-mint);
  background: var(--sw-mint);
}

.th-p-smartwatches .smartwatches-aftercopy {
  max-width: 24ch;
  margin: clamp(55px, 11vw, 158px) 0 0;
  color: var(--sw-ink);
  font: 700 10px/1.45 var(--body);
  letter-spacing: .13em;
  text-transform: uppercase;
}

.th-p-smartwatches .smartwatches-orbit-disc {
  position: absolute;
  z-index: -1;
  top: 50%;
  left: 58.6%;
  width: min(72vw, 1010px);
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  border: clamp(20px, 3.8vw, 62px) solid var(--sw-mint);
  border-radius: 50%;
  background: #b7c8c2;
  box-shadow: 0 0 0 1px var(--sw-ink), inset 0 0 0 1px var(--sw-ink);
}

.th-p-smartwatches .smartwatches-orbit-track {
  position: absolute;
  inset: clamp(28px, 5vw, 82px);
  border: 1px dashed #274a4c;
  border-radius: 50%;
}

.th-p-smartwatches .smartwatches-orbit-track i {
  position: absolute;
  width: 9px;
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--sw-coral);
}

.th-p-smartwatches .smartwatches-orbit-track i:nth-child(1) { top: -5px; left: 50%; }
.th-p-smartwatches .smartwatches-orbit-track i:nth-child(2) { top: 50%; right: -5px; background: var(--sw-ink); }
.th-p-smartwatches .smartwatches-orbit-track i:nth-child(3) { bottom: -5px; left: 50%; background: var(--sw-sun); }
.th-p-smartwatches .smartwatches-orbit-track i:nth-child(4) { top: 50%; left: -5px; background: var(--sw-ink); }

.th-p-smartwatches .smartwatches-media-aperture {
  position: absolute;
  z-index: 1;
  top: 50%;
  left: 58.6%;
  width: min(50vw, 720px);
  aspect-ratio: 1;
  overflow: hidden;
  transform: translate(-50%, -50%);
  border: 1px solid var(--sw-ink);
  border-radius: 50%;
  background: #38565a;
  box-shadow: 12px 14px 0 var(--sw-ink);
}

.th-p-smartwatches .smartwatches-media-aperture .hero-media,
.th-p-smartwatches .smartwatches-media-aperture .theme-empty-media {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
  object-fit: cover;
}

.th-p-smartwatches .smartwatches-media-aperture .hero-media {
  object-position: 67% center;
  filter: saturate(.84) contrast(1.05);
}

.th-p-smartwatches .smartwatches-media-aperture .theme-empty-media {
  background:
    radial-gradient(circle at 66% 34%, #cedf8c 0 5%, transparent 5.4%),
    radial-gradient(circle at 56% 58%, #253e43 0 17%, #5a7b78 17.4% 28%, transparent 28.4%),
    linear-gradient(145deg, #8db2a9, #385e62 52%, #132e35);
  color: #f7f8f2;
}

.th-p-smartwatches .smartwatches-aperture-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(135deg, #d8f2b052 0%, transparent 37%, #10292d3d 100%);
}

.th-p-smartwatches .smartwatches-pace-note {
  position: absolute;
  z-index: 2;
  right: clamp(19px, 3.4vw, 55px);
  bottom: clamp(20px, 3.6vw, 56px);
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--sw-ink);
  font: 700 9px/1 var(--body);
  letter-spacing: .14em;
}

.th-p-smartwatches .smartwatches-pace-note i {
  display: block;
  width: 19px;
  height: 1px;
  background: currentColor;
}

.th-p-smartwatches .smartwatches-side-note {
  position: absolute;
  z-index: 2;
  top: 20%;
  right: clamp(17px, 3.2vw, 52px);
  margin: 0;
  color: var(--sw-ink);
  font: 700 clamp(10px, 1vw, 14px)/1.3 var(--body);
  letter-spacing: .13em;
  text-align: right;
  text-transform: uppercase;
}

.th-p-smartwatches .smartwatches-motion-control {
  position: absolute;
  z-index: 4;
  right: clamp(16px, 2vw, 30px);
  top: clamp(16px, 2vw, 28px);
}

.th-p-smartwatches .smartwatches-motion-control .motion-toggle {
  position: static;
  inset: auto;
  min-height: 44px;
  border: 1px solid var(--sw-ink);
  border-radius: 999px;
  padding: 0 13px;
  background: #e9eee7e6;
  color: var(--sw-ink);
  font: 700 9px/1 var(--body);
  letter-spacing: .09em;
  text-transform: uppercase;
}

.th-p-smartwatches .smartwatches-motion-control .motion-toggle:hover {
  border-color: var(--sw-coral);
  background: var(--sw-coral);
  color: #ffffff;
}

.th-p-smartwatches .smartwatches-orbit-hero.has-hero-motion[data-hero-motion="drift"] .smartwatches-media-aperture .hero-media {
  animation: smartwatches-drift 15s ease-in-out infinite alternate;
}

@keyframes smartwatches-drift {
  from { transform: scale(1.02) translate3d(-.8%, -.6%, 0); }
  to { transform: scale(1.08) translate3d(.8%, .7%, 0); }
}

.th-p-smartwatches .theme-discovery.smartwatches-discovery {
  display: grid;
  grid-template-columns: minmax(220px, .9fr) minmax(0, 1.7fr);
  gap: clamp(36px, 7vw, 128px);
  max-width: 1650px;
  margin: 0 auto;
  padding: clamp(65px, 9vw, 142px) clamp(24px, 7vw, 122px);
  background: var(--sw-paper);
}

.th-p-smartwatches .smartwatches-discovery-heading {
  align-self: start;
  max-width: 330px;
}

.th-p-smartwatches .smartwatches-discovery-heading h2 {
  max-width: 9ch;
  margin: 0;
  color: var(--sw-ink);
  font: var(--dw) clamp(39px, 4.2vw, 68px)/.88 var(--display);
  letter-spacing: var(--dt);
  overflow-wrap: anywhere;
  text-wrap: balance;
}

.th-p-smartwatches .smartwatches-discovery-heading > p:last-child {
  max-width: 28ch;
  margin: 24px 0 0;
  color: var(--muted);
  font: 400 14px/1.55 var(--body);
}

.th-p-smartwatches .smartwatches-lane-map-board,
.th-p-smartwatches .smartwatches-product-signals {
  position: relative;
  border-top: 1px solid var(--sw-ink);
}

.th-p-smartwatches .smartwatches-board-label {
  margin: 14px 0 clamp(23px, 3vw, 44px);
  color: var(--sw-coral);
  font: 700 9px/1.2 var(--body);
  letter-spacing: .18em;
  text-transform: uppercase;
}

.th-p-smartwatches .smartwatches-lanes {
  display: grid;
  gap: 2px;
}

.th-p-smartwatches .smartwatches-lane {
  display: grid;
  grid-template-columns: 42px minmax(35px, .42fr) minmax(0, 1fr) 24px;
  gap: 12px;
  align-items: center;
  min-height: 87px;
  padding: 10px 12px;
  border: 1px solid var(--sw-ink);
  background: #f7f8f2;
  color: var(--sw-ink);
  text-decoration: none;
  transition: background-color .2s ease, color .2s ease, transform .2s ease;
}

.th-p-smartwatches .smartwatches-lane:hover {
  background: var(--sw-mint);
  transform: translateX(5px);
}

.th-p-smartwatches .smartwatches-lane-index,
.th-p-smartwatches .smartwatches-signal-index {
  font: 700 10px/1 var(--body);
  letter-spacing: .1em;
}

.th-p-smartwatches .smartwatches-lane-line {
  position: relative;
  display: block;
  height: 1px;
  background: var(--sw-ink);
}

.th-p-smartwatches .smartwatches-lane-line::before,
.th-p-smartwatches .smartwatches-lane-line i {
  position: absolute;
  top: 50%;
  width: 8px;
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--sw-coral);
  content: '';
}

.th-p-smartwatches .smartwatches-lane-line::before { left: 0; transform: translateY(-50%); }
.th-p-smartwatches .smartwatches-lane-line i { right: 0; transform: translateY(-50%); background: var(--sw-ink); }

.th-p-smartwatches .smartwatches-lane-copy {
  display: grid;
  gap: 5px;
  min-width: 0;
}

.th-p-smartwatches .smartwatches-lane-copy strong,
.th-p-smartwatches .smartwatches-signal-copy strong {
  overflow-wrap: anywhere;
  font: var(--dw) clamp(18px, 1.8vw, 28px)/1 var(--display);
  letter-spacing: var(--dt);
}

.th-p-smartwatches .smartwatches-lane-copy small,
.th-p-smartwatches .smartwatches-signal-copy small {
  color: var(--muted);
  font: 700 9px/1.2 var(--body);
  letter-spacing: .11em;
  text-transform: uppercase;
}

.th-p-smartwatches .smartwatches-lane-arrow,
.th-p-smartwatches .smartwatches-signal-arrow {
  color: var(--sw-coral);
  font: 400 25px/1 var(--body);
}

.th-p-smartwatches .smartwatches-product-signals {
  display: grid;
}

.th-p-smartwatches .smartwatches-product-signal {
  display: grid;
  grid-template-columns: 45px minmax(0, 1fr) 26px;
  gap: 12px;
  align-items: center;
  min-height: 92px;
  border-bottom: 1px solid var(--sw-line);
  color: var(--sw-ink);
  text-decoration: none;
  transition: background-color .2s ease, padding-left .2s ease;
}

.th-p-smartwatches .smartwatches-product-signal:hover {
  padding-left: 12px;
  background: #dbe8c0;
}

.th-p-smartwatches .smartwatches-signal-copy {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.th-p-smartwatches #shop {
  padding-top: clamp(52px, 7vw, 100px);
  background: var(--sw-pale);
}

.th-p-smartwatches #shop > :is(h2, .section-title) {
  color: var(--sw-ink);
  font-family: var(--display);
  letter-spacing: var(--dt);
}

.th-p-smartwatches #shop :is(.product-card, .card) {
  overflow: hidden;
  border: 1px solid var(--sw-ink);
  border-radius: 22px;
  background: var(--sw-paper);
  box-shadow: 5px 5px 0 var(--sw-ink);
}

.th-p-smartwatches #shop :is(.product-card, .card) img {
  filter: saturate(.9) contrast(1.03);
}

.th-p-smartwatches :is(.smartwatches-hero-copy .btn, .smartwatches-lane, .smartwatches-product-signal, .smartwatches-motion-control .motion-toggle):focus-visible {
  outline: 3px solid var(--sw-coral);
  outline-offset: 3px;
}

@media (max-width: 900px) {
  .th-p-smartwatches .smartwatches-orbit-stage { min-height: 720px; }
  .th-p-smartwatches .smartwatches-copy-zone { width: min(54%, 500px); padding-left: 48px; }
  .th-p-smartwatches .smartwatches-orbit-disc { left: 65%; width: min(82vw, 760px); }
  .th-p-smartwatches .smartwatches-media-aperture { left: 65%; width: min(59vw, 520px); }
  .th-p-smartwatches .smartwatches-side-note { top: auto; right: 28px; bottom: 117px; }
  .th-p-smartwatches .theme-discovery.smartwatches-discovery { grid-template-columns: 1fr; gap: 42px; }
  .th-p-smartwatches .smartwatches-discovery-heading { max-width: 590px; }
}

@media (max-width: 620px) {
  .th-p-smartwatches .category-hero.smartwatches-orbit-hero { padding: 0; }
  .th-p-smartwatches .smartwatches-orbit-stage { min-height: 750px; border-right: 0; border-left: 0; }
  .th-p-smartwatches .smartwatches-stage-stamp { top: 22px; left: 18px; font-size: 8px; }
  .th-p-smartwatches .smartwatches-copy-zone { position: absolute; right: 0; bottom: 0; left: 0; width: auto; padding: 172px 20px 25px; background: linear-gradient(0deg, #e9eee7 65%, #e9eee700); }
  .th-p-smartwatches .smartwatches-hero-copy { max-width: 25rem; }
  .th-p-smartwatches .smartwatches-hero-copy h1,
  .th-p-smartwatches .smartwatches-hero-copy h1.long { max-width: 10.5ch; font-size: clamp(46px, 14.5vw, 66px); line-height: .86; }
  .th-p-smartwatches .smartwatches-hero-copy .sub { margin-top: 18px; }
  .th-p-smartwatches .smartwatches-hero-copy .ctas { margin-top: 21px; }
  .th-p-smartwatches .smartwatches-hero-copy .btn { flex: 1 1 150px; padding: 0 14px; }
  .th-p-smartwatches .smartwatches-aftercopy { display: none; }
  .th-p-smartwatches .smartwatches-orbit-disc { top: 32%; left: 55%; width: min(122vw, 530px); border-width: 25px; }
  .th-p-smartwatches .smartwatches-media-aperture { top: 32%; left: 55%; width: min(87vw, 366px); box-shadow: 7px 8px 0 var(--sw-ink); }
  .th-p-smartwatches .smartwatches-media-aperture .hero-media { object-position: 68% center; }
  .th-p-smartwatches .smartwatches-pace-note { right: 18px; bottom: auto; top: 48%; gap: 6px; font-size: 8px; }
  .th-p-smartwatches .smartwatches-pace-note i { width: 12px; }
  .th-p-smartwatches .smartwatches-side-note { display: none; }
  .th-p-smartwatches .smartwatches-motion-control { top: 14px; right: 13px; }
  .th-p-smartwatches .smartwatches-motion-control .motion-toggle { padding: 0 11px; font-size: 8px; }
  .th-p-smartwatches .theme-discovery.smartwatches-discovery { gap: 34px; padding: 62px 18px 72px; }
  .th-p-smartwatches .smartwatches-discovery-heading h2 { font-size: clamp(38px, 11vw, 51px); }
  .th-p-smartwatches .smartwatches-lane { grid-template-columns: 30px minmax(24px, .35fr) minmax(0, 1fr) 18px; gap: 8px; min-height: 82px; padding: 10px 8px; }
  .th-p-smartwatches .smartwatches-lane-copy strong { font-size: 20px; }
  .th-p-smartwatches .smartwatches-lane-copy small { font-size: 8px; }
  .th-p-smartwatches .smartwatches-product-signal { grid-template-columns: 34px minmax(0, 1fr) 20px; min-height: 84px; gap: 8px; }
  .th-p-smartwatches .smartwatches-signal-copy strong { font-size: 19px; }
  .th-p-smartwatches #shop :is(.product-card, .card) { border-radius: 16px; box-shadow: 3px 3px 0 var(--sw-ink); }
}

@media (prefers-reduced-motion: reduce) {
  .th-p-smartwatches .smartwatches-orbit-hero.has-hero-motion .smartwatches-media-aperture .hero-media { animation: none; }
  .th-p-smartwatches :is(.smartwatches-hero-copy .btn, .smartwatches-lane, .smartwatches-product-signal) { transition: none; }
}
`;

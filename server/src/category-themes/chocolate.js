import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-chocolate',
  name: 'Temper & Bloom',
  for: 'people who linger over fine chocolate and small rituals of sweetness',
  vibe: 'cacao-dark, paper-warm, tactile, and quietly theatrical',
  category: 'Chocolate and cacao confections',
  group: 'lifestyle',
  display: 'Cormorant Garamond',
  body: 'Manrope',
  displayWeight: 600,
  tracking: '-.055em',
  colors: {
    bg: '#E8DDCA',
    surface: '#FFF9EE',
    ink: '#26140F',
    muted: '#776359',
    line: '#CDBAA3',
    accent: '#9F3F2E',
    onAccent: '#FFF8ED',
    panel: '#2B1712',
    onPanel: '#F6E6D0',
    foot: '#1D0E0B',
    onFoot: '#F4E5D1',
    bar: '#F8EFDF',
    onBar: '#26140F',
    badge: '#D8A65D',
    onBadge: '#26140F',
  },
  header: 'stack',
  hero: 'collage',
  card: 'boxed',
  ratio: '4/5',
  rCard: 0,
  rBtn: 999,
  motion: 'pan',
  copy: {
    eyebrow: 'The cacao counter',
    collection: 'The current shelf',
    cta: 'Browse the counter',
    title: 'Chocolate, kept curious.',
    subtitle: 'A considered collection for slow breaks, bright bites, and every generous in-between.',
  },
});

const selectedCategories = (ctx) => (Array.isArray(ctx.cats) ? ctx.cats : [])
  .filter((category) => category?.name)
  .slice(0, 4);

const selectedProducts = (ctx) => (Array.isArray(ctx.products) ? ctx.products : [])
  .filter(Boolean)
  .slice(0, 3);

const countLabel = (count, fallback = 'Available now') => {
  const amount = Number(count);
  if (!Number.isFinite(amount)) return fallback;
  return `${amount} ${amount === 1 ? 'piece' : 'pieces'}`;
};

const categoryImage = (ctx, category) => {
  const image = typeof category?.image === 'string' ? category.image : category?.image?.url;
  if (image) {
    return `<div class="chocolate-shelf-image"><img src="${ctx.esc(image)}" alt="" loading="lazy" decoding="async"></div>`;
  }
  return `<div class="chocolate-shelf-image chocolate-shelf-placeholder" aria-hidden="true"><i></i><b></b><span></span></div>`;
};

const archiveIndex = (ctx, categories) => {
  if (!categories.length) {
    return `<a class="chocolate-index-link chocolate-index-all" href="#shop"><span class="chocolate-index-no">01</span><span>Explore the counter</span><b aria-hidden="true">↗</b></a>`;
  }

  return categories.map((category, index) => `
    <a class="chocolate-index-link" href="${ctx.esc(ctx.categoryLink(category.name))}">
      <span class="chocolate-index-no">${String(index + 1).padStart(2, '0')}</span>
      <span class="chocolate-index-name">${ctx.esc(category.name)}</span>
      <b aria-hidden="true">↗</b>
    </a>`).join('');
};

export function hero(ctx) {
  const categories = selectedCategories(ctx).slice(0, 3);
  return `
    <section class="hero category-hero chocolate-archive-hero${ctx.heroClass || ''}"${ctx.heroAttrs || ''}>
      <div class="chocolate-archive-shell">
        <aside class="chocolate-spine" aria-label="Chocolate collection introduction">
          <span class="chocolate-spine-top">CACAO / COUNTER</span>
          <span class="chocolate-spine-rule" aria-hidden="true"></span>
          <span class="chocolate-spine-bottom">01 — ${ctx.esc(ctx.t.copy?.collection || 'CURRENT SHELF')}</span>
        </aside>
        <figure class="chocolate-hero-image">
          ${ctx.media(0, { priority: true, lazy: false, decorative: false })}
          <div class="chocolate-image-wash" aria-hidden="true"></div>
          <div class="chocolate-temper-mark" aria-hidden="true"><i></i><i></i><i></i></div>
          <figcaption><span aria-hidden="true"></span>Made for the moment in hand.</figcaption>
        </figure>
        <div class="chocolate-copy-sheet">
          <div class="chocolate-sheet-cap" aria-hidden="true"><span>OPEN / SLOWLY</span><i></i></div>
          ${ctx.copy('chocolate-copy')}
          <div class="chocolate-sheet-corner" aria-hidden="true"></div>
        </div>
        <nav class="chocolate-archive-index" aria-label="Browse chocolate collections">
          <div class="chocolate-index-head"><p>Open a shelf</p><span>Index</span></div>
          <div class="chocolate-index-list">${archiveIndex(ctx, categories)}</div>
          <a class="chocolate-index-shop" href="#shop">All available pieces <b aria-hidden="true">→</b></a>
        </nav>
      </div>
      ${ctx.controls || ''}
    </section>`;
}

export function discovery(ctx) {
  const categories = selectedCategories(ctx);
  const products = selectedProducts(ctx);

  if (categories.length >= 2) {
    const cards = categories.map((category, index) => `
      <a class="chocolate-shelf-card" href="${ctx.esc(ctx.categoryLink(category.name))}">
        <div class="chocolate-shelf-meta"><span>${String(index + 1).padStart(2, '0')} / ${String(categories.length).padStart(2, '0')}</span><b aria-hidden="true">↗</b></div>
        ${categoryImage(ctx, category)}
        <div class="chocolate-shelf-details">
          <p>${ctx.esc(countLabel(category.count))}</p>
          <h3>${ctx.esc(category.name)}</h3>
          <span>Open this shelf</span>
        </div>
      </a>`).join('');

    return `
      <section class="theme-discovery chocolate-discovery" aria-labelledby="chocolate-discovery-title">
        <div class="chocolate-discovery-intro">
          <p class="chocolate-kicker">The tasting library</p>
          <h2 id="chocolate-discovery-title">Choose a shelf.<br><em>Stay awhile.</em></h2>
          <p>Begin wherever the counter feels most inviting, then explore what is currently waiting there.</p>
          <a class="chocolate-all-link" href="#shop">View every available piece <span aria-hidden="true">→</span></a>
        </div>
        <div class="chocolate-shelf-grid">${cards}</div>
      </section>`;
  }

  if (products.length) {
    return `
      <section class="theme-discovery chocolate-product-edit" aria-labelledby="chocolate-product-edit-title">
        <div class="chocolate-discovery-intro">
          <p class="chocolate-kicker">From the counter</p>
          <h2 id="chocolate-product-edit-title">A few pieces<br>to begin with.</h2>
          <p>Take a closer look at what is available in this collection now.</p>
          <a class="chocolate-all-link" href="#shop">View every available piece <span aria-hidden="true">→</span></a>
        </div>
        <div class="chocolate-product-row">${products.map((product) => ctx.productCard(product)).join('')}</div>
      </section>`;
  }

  return '';
}

export const css = `
.th-p-chocolate {
  --chocolate-paper: #FFF9EE;
  --chocolate-cream: #E8DDCA;
  --chocolate-ink: #26140F;
  --chocolate-char: #2B1712;
  --chocolate-deep: #1D0E0B;
  --chocolate-cocoa: #674033;
  --chocolate-clay: #9F3F2E;
  --chocolate-gold: #D8A65D;
  --chocolate-line: #CDBAA3;
  --chocolate-muted: #776359;
  background: var(--chocolate-cream);
  color: var(--chocolate-ink);
  overflow-x: clip;
}

.th-p-chocolate :is(.site-header, .store-header) {
  background: color-mix(in srgb, var(--chocolate-paper) 94%, transparent);
  border-color: color-mix(in srgb, var(--chocolate-ink) 16%, transparent);
}

.th-p-chocolate :is(.site-header, .store-header) a {
  color: var(--chocolate-ink);
}

.th-p-chocolate .chocolate-archive-hero {
  position: relative;
  isolation: isolate;
  min-height: clamp(42rem, 57vw, 55rem);
  overflow: hidden;
  background:
    radial-gradient(ellipse at 9% 90%, rgba(216, 166, 93, .13), transparent 30%),
    linear-gradient(138deg, #341d17 0%, #24120e 46%, #170a08 100%);
  color: var(--chocolate-paper);
}

.th-p-chocolate .chocolate-archive-hero::before {
  position: absolute;
  z-index: -1;
  top: -20rem;
  right: -17rem;
  width: 46rem;
  aspect-ratio: 1;
  border: 1px solid rgba(216, 166, 93, .24);
  border-radius: 50%;
  box-shadow: 0 0 0 4.3rem rgba(216, 166, 93, .035), 0 0 0 8.6rem rgba(216, 166, 93, .025);
  content: '';
}

.th-p-chocolate .chocolate-archive-shell {
  display: grid;
  grid-template-columns: minmax(5.5rem, .42fr) minmax(22rem, 1.18fr) minmax(18rem, .75fr);
  grid-template-rows: minmax(17rem, .85fr) minmax(20rem, 1.05fr);
  min-height: inherit;
}

.th-p-chocolate .chocolate-spine {
  position: relative;
  z-index: 2;
  display: flex;
  grid-row: 1 / -1;
  min-width: 0;
  flex-direction: column;
  justify-content: space-between;
  padding: clamp(1.3rem, 3vw, 3.2rem) clamp(.85rem, 2vw, 1.9rem);
  border-right: 1px solid rgba(255, 249, 238, .15);
  background: linear-gradient(180deg, rgba(76, 42, 31, .98), rgba(31, 14, 11, .98));
}

.th-p-chocolate .chocolate-spine::after {
  position: absolute;
  right: -1px;
  bottom: 0;
  width: 1px;
  height: 42%;
  background: var(--chocolate-gold);
  content: '';
}

.th-p-chocolate .chocolate-spine-top,
.th-p-chocolate .chocolate-spine-bottom {
  color: rgba(255, 244, 228, .78);
  font: 700 .54rem/1.35 var(--font-body, 'Manrope', sans-serif);
  letter-spacing: .17em;
  text-transform: uppercase;
  writing-mode: vertical-rl;
}

.th-p-chocolate .chocolate-spine-bottom {
  color: var(--chocolate-gold);
  direction: rtl;
}

.th-p-chocolate .chocolate-spine-rule {
  display: block;
  width: 1px;
  height: clamp(3.5rem, 7vw, 6.5rem);
  margin-left: .2rem;
  background: linear-gradient(var(--chocolate-gold), transparent);
}

.th-p-chocolate .chocolate-hero-image {
  position: relative;
  grid-row: 1 / -1;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  background: #775B48;
}

.th-p-chocolate .chocolate-hero-image::before {
  position: absolute;
  z-index: 2;
  inset: 0;
  border: 1px solid rgba(255, 248, 237, .2);
  box-shadow: inset 0 0 0 clamp(1rem, 2vw, 2.1rem) rgba(35, 18, 13, .1);
  content: '';
  pointer-events: none;
}

.th-p-chocolate .chocolate-hero-image .hero-media,
.th-p-chocolate .chocolate-hero-image .theme-empty-media {
  display: block;
  width: 100%;
  height: 100%;
  min-height: inherit;
  object-fit: cover;
  object-position: 58% center;
}

.th-p-chocolate .chocolate-hero-image .theme-empty-media {
  position: relative;
  background:
    radial-gradient(ellipse at 57% 52%, rgba(255, 231, 182, .45) 0 3%, transparent 3.6%),
    radial-gradient(ellipse at 44% 65%, #44231c 0 13%, transparent 13.4%),
    radial-gradient(ellipse at 64% 31%, #6b3027 0 10%, transparent 10.4%),
    linear-gradient(136deg, #a47b5b, #4b2a21 60%, #21100d);
}

.th-p-chocolate .chocolate-image-wash {
  position: absolute;
  z-index: 1;
  inset: 0;
  background: linear-gradient(0deg, rgba(25, 11, 8, .47), transparent 42%), linear-gradient(90deg, rgba(42, 20, 14, .2), transparent 48%);
  pointer-events: none;
}

.th-p-chocolate .chocolate-temper-mark {
  position: absolute;
  z-index: 2;
  top: clamp(1.1rem, 2.2vw, 2.25rem);
  right: clamp(1.1rem, 2.4vw, 2.5rem);
  display: grid;
  width: clamp(4.6rem, 8vw, 7.1rem);
  aspect-ratio: 1;
  place-items: center;
  border: 1px solid rgba(255, 246, 230, .62);
  border-radius: 50%;
  box-shadow: inset 0 0 0 .36rem rgba(48, 25, 18, .22);
}

.th-p-chocolate .chocolate-temper-mark::before,
.th-p-chocolate .chocolate-temper-mark::after,
.th-p-chocolate .chocolate-temper-mark i {
  position: absolute;
  display: block;
  width: 51%;
  height: 1px;
  background: rgba(255, 246, 230, .78);
  content: '';
}

.th-p-chocolate .chocolate-temper-mark::before { transform: rotate(0deg); }
.th-p-chocolate .chocolate-temper-mark::after { transform: rotate(60deg); }
.th-p-chocolate .chocolate-temper-mark i { transform: rotate(120deg); }
.th-p-chocolate .chocolate-temper-mark i:nth-child(2) { width: 1px; height: 51%; transform: none; }
.th-p-chocolate .chocolate-temper-mark i:nth-child(3) { display: none; }

.th-p-chocolate .chocolate-hero-image figcaption {
  position: absolute;
  z-index: 3;
  right: clamp(1.1rem, 2.4vw, 2.5rem);
  bottom: clamp(1.25rem, 2.8vw, 2.65rem);
  display: flex;
  align-items: center;
  gap: .58rem;
  max-width: 17rem;
  margin: 0;
  color: rgba(255, 248, 237, .9);
  font: 700 .54rem/1.35 var(--font-body, 'Manrope', sans-serif);
  letter-spacing: .15em;
  text-align: right;
  text-transform: uppercase;
}

.th-p-chocolate .chocolate-hero-image figcaption span {
  display: block;
  width: 1.55rem;
  height: 1px;
  flex: 0 0 auto;
  background: var(--chocolate-gold);
}

.th-p-chocolate .chocolate-copy-sheet {
  position: relative;
  z-index: 3;
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
  padding: clamp(2.2rem, 4.7vw, 5.15rem) clamp(1.5rem, 3.75vw, 4rem);
  background: var(--chocolate-paper);
  color: var(--chocolate-ink);
}

.th-p-chocolate .chocolate-copy-sheet::before {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: .42rem;
  background: repeating-linear-gradient(90deg, var(--chocolate-clay) 0 13%, var(--chocolate-gold) 13% 15%, transparent 15% 20%);
  content: '';
}

.th-p-chocolate .chocolate-sheet-cap {
  display: flex;
  align-items: center;
  gap: .65rem;
  margin-bottom: clamp(1.15rem, 2.2vw, 2.25rem);
  color: var(--chocolate-clay);
}

.th-p-chocolate .chocolate-sheet-cap span {
  font: 800 .52rem/1 var(--font-body, 'Manrope', sans-serif);
  letter-spacing: .17em;
}

.th-p-chocolate .chocolate-sheet-cap i {
  display: block;
  width: 1.7rem;
  height: 1px;
  background: currentColor;
}

.th-p-chocolate .chocolate-copy {
  max-width: 28rem;
}

.th-p-chocolate .chocolate-copy .eyebrow,
.th-p-chocolate .chocolate-kicker {
  margin: 0 0 1rem;
  color: var(--chocolate-clay);
  font: 800 .57rem/1.35 var(--font-body, 'Manrope', sans-serif);
  letter-spacing: .19em;
  text-transform: uppercase;
}

.th-p-chocolate .chocolate-copy h1 {
  max-width: 9ch;
  margin: 0;
  color: var(--chocolate-ink);
  font: 600 clamp(3.1rem, 5.2vw, 6.2rem)/.82 var(--font-display, 'Cormorant Garamond', Georgia, serif);
  letter-spacing: -.075em;
  overflow-wrap: anywhere;
}

.th-p-chocolate .chocolate-copy h1.long {
  max-width: 12ch;
  font-size: clamp(2.45rem, 4.2vw, 4.9rem);
  line-height: .9;
}

.th-p-chocolate .chocolate-copy .sub {
  max-width: 31ch;
  margin: 1.35rem 0 0;
  color: #654D43;
  font: 600 clamp(.72rem, .88vw, .84rem)/1.7 var(--font-body, 'Manrope', sans-serif);
}

.th-p-chocolate .chocolate-copy .ctas {
  display: flex;
  flex-wrap: wrap;
  gap: .65rem;
  margin-top: 1.75rem;
}

.th-p-chocolate .chocolate-copy .btn {
  display: inline-flex;
  min-height: 2.8rem;
  align-items: center;
  justify-content: center;
  padding: .72rem 1.1rem;
  border: 1px solid var(--chocolate-ink);
  border-radius: 999px;
  background: var(--chocolate-ink);
  color: var(--chocolate-paper);
  font: 800 .57rem/1 var(--font-body, 'Manrope', sans-serif);
  letter-spacing: .13em;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-chocolate .chocolate-copy .btn.ghost {
  background: transparent;
  color: var(--chocolate-ink);
}

.th-p-chocolate .chocolate-copy .btn:hover,
.th-p-chocolate .chocolate-copy .btn:focus-visible {
  border-color: var(--chocolate-clay);
  background: var(--chocolate-clay);
  color: var(--chocolate-paper);
}

.th-p-chocolate .chocolate-sheet-corner {
  position: absolute;
  right: 0;
  bottom: 0;
  width: clamp(3.7rem, 7vw, 7rem);
  aspect-ratio: 1;
  background: linear-gradient(135deg, transparent 49%, var(--chocolate-gold) 50%);
  pointer-events: none;
}

.th-p-chocolate .chocolate-archive-index {
  position: relative;
  display: flex;
  min-width: 0;
  flex-direction: column;
  padding: clamp(1.25rem, 2.9vw, 3.15rem) clamp(1.25rem, 3.4vw, 3.45rem) clamp(1.35rem, 3vw, 3rem);
  border-top: 1px solid rgba(255, 243, 227, .16);
  background: linear-gradient(145deg, #4B2A21, #2A1511 68%);
  color: var(--chocolate-paper);
}

.th-p-chocolate .chocolate-archive-index::after {
  position: absolute;
  top: 0;
  right: 0;
  width: clamp(3rem, 5vw, 5.5rem);
  height: 1px;
  background: var(--chocolate-gold);
  content: '';
}

.th-p-chocolate .chocolate-index-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: .85rem;
  border-bottom: 1px solid rgba(255, 242, 226, .16);
}

.th-p-chocolate .chocolate-index-head :is(p, span) {
  margin: 0;
  color: var(--chocolate-gold);
  font: 800 .54rem/1.2 var(--font-body, 'Manrope', sans-serif);
  letter-spacing: .16em;
  text-transform: uppercase;
}

.th-p-chocolate .chocolate-index-head span {
  color: rgba(255, 241, 219, .55);
}

.th-p-chocolate .chocolate-index-list {
  display: grid;
  gap: 0;
  margin: auto 0 0;
}

.th-p-chocolate .chocolate-index-link {
  display: grid;
  min-width: 0;
  min-height: 2.75rem;
  grid-template-columns: 1.75rem minmax(0, 1fr) auto;
  align-items: center;
  gap: .45rem;
  border-bottom: 1px solid rgba(255, 242, 226, .16);
  color: var(--chocolate-paper);
  font: 700 .68rem/1.25 var(--font-body, 'Manrope', sans-serif);
  text-decoration: none;
}

.th-p-chocolate .chocolate-index-link:hover,
.th-p-chocolate .chocolate-index-link:focus-visible {
  color: var(--chocolate-gold);
}

.th-p-chocolate .chocolate-index-no {
  color: var(--chocolate-gold);
  font: 800 .51rem/1 var(--font-body, 'Manrope', sans-serif);
  letter-spacing: .1em;
}

.th-p-chocolate .chocolate-index-name {
  overflow-wrap: anywhere;
}

.th-p-chocolate .chocolate-index-link b,
.th-p-chocolate .chocolate-index-shop b {
  color: var(--chocolate-gold);
  font: 400 1.05rem/1 var(--font-display, Georgia, serif);
}

.th-p-chocolate .chocolate-index-shop {
  display: flex;
  min-height: 2.75rem;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1rem;
  color: rgba(255, 245, 230, .85);
  font: 800 .54rem/1.2 var(--font-body, 'Manrope', sans-serif);
  letter-spacing: .14em;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-chocolate .chocolate-index-shop:hover,
.th-p-chocolate .chocolate-index-shop:focus-visible {
  color: var(--chocolate-gold);
}

.th-p-chocolate .chocolate-archive-hero > .motion-toggle {
  position: absolute;
  z-index: 5;
  bottom: 1rem;
  left: calc(clamp(5.5rem, .42fr, 7.5rem) + clamp(.85rem, 2vw, 1.9rem));
  min-height: 2.75rem;
  padding: .55rem .85rem;
  border: 1px solid rgba(255, 248, 237, .5);
  border-radius: 999px;
  background: rgba(30, 14, 11, .82);
  color: var(--chocolate-paper);
  font: 800 .53rem/1 var(--font-body, 'Manrope', sans-serif);
  letter-spacing: .12em;
  text-transform: uppercase;
}

.th-p-chocolate .chocolate-discovery {
  display: grid;
  grid-template-columns: minmax(16rem, .64fr) minmax(0, 1.7fr);
  gap: clamp(1.75rem, 4.6vw, 5.4rem);
  align-items: start;
  padding: clamp(3.25rem, 7vw, 7.75rem) clamp(1.25rem, 5.4vw, 6.7rem);
  background:
    linear-gradient(90deg, rgba(214, 180, 136, .13) 1px, transparent 1px),
    linear-gradient(rgba(214, 180, 136, .13) 1px, transparent 1px),
    var(--chocolate-cream);
  background-size: 2.2rem 2.2rem;
}

.th-p-chocolate .chocolate-discovery-intro {
  min-width: 0;
  padding-top: .25rem;
}

.th-p-chocolate .chocolate-discovery-intro h2 {
  max-width: 10ch;
  margin: 0;
  color: var(--chocolate-ink);
  font: 600 clamp(2.75rem, 4.6vw, 5.6rem)/.84 var(--font-display, 'Cormorant Garamond', Georgia, serif);
  letter-spacing: -.075em;
  overflow-wrap: anywhere;
}

.th-p-chocolate .chocolate-discovery-intro h2 em {
  color: var(--chocolate-clay);
  font-style: italic;
}

.th-p-chocolate .chocolate-discovery-intro > p:not(.chocolate-kicker) {
  max-width: 31ch;
  margin: 1.5rem 0 0;
  color: var(--chocolate-muted);
  font: 600 .78rem/1.72 var(--font-body, 'Manrope', sans-serif);
}

.th-p-chocolate .chocolate-all-link {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  gap: .7rem;
  margin-top: 1.8rem;
  border-bottom: 1px solid var(--chocolate-ink);
  color: var(--chocolate-ink);
  font: 800 .57rem/1 var(--font-body, 'Manrope', sans-serif);
  letter-spacing: .13em;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-chocolate .chocolate-all-link span {
  color: var(--chocolate-clay);
  font: 400 1.12rem/1 var(--font-display, Georgia, serif);
}

.th-p-chocolate .chocolate-all-link:hover,
.th-p-chocolate .chocolate-all-link:focus-visible {
  color: var(--chocolate-clay);
  border-color: var(--chocolate-clay);
}

.th-p-chocolate .chocolate-shelf-grid {
  display: grid;
  min-width: 0;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border-top: 1px solid var(--chocolate-line);
  border-left: 1px solid var(--chocolate-line);
  background: var(--chocolate-paper);
}

.th-p-chocolate .chocolate-shelf-card {
  display: flex;
  min-width: 0;
  min-height: 100%;
  flex-direction: column;
  border-right: 1px solid var(--chocolate-line);
  border-bottom: 1px solid var(--chocolate-line);
  background: rgba(255, 249, 238, .91);
  color: var(--chocolate-ink);
  text-decoration: none;
}

.th-p-chocolate .chocolate-shelf-card:nth-child(even) {
  background: #F4E8D6;
}

.th-p-chocolate .chocolate-shelf-meta {
  display: flex;
  min-height: 2.75rem;
  align-items: center;
  justify-content: space-between;
  gap: .75rem;
  padding: 0 .82rem;
  color: var(--chocolate-clay);
  font: 800 .52rem/1 var(--font-body, 'Manrope', sans-serif);
  letter-spacing: .15em;
}

.th-p-chocolate .chocolate-shelf-meta b {
  color: var(--chocolate-gold);
  font: 400 1.08rem/1 var(--font-display, Georgia, serif);
}

.th-p-chocolate .chocolate-shelf-image {
  position: relative;
  min-height: clamp(8.8rem, 14vw, 13.25rem);
  overflow: hidden;
  background: linear-gradient(140deg, #C79E6E, #6C4437 57%, #2C1713);
}

.th-p-chocolate .chocolate-shelf-image img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.th-p-chocolate .chocolate-shelf-placeholder {
  isolation: isolate;
  background:
    radial-gradient(circle at 29% 60%, #E7BA7B 0 8%, transparent 8.5%),
    radial-gradient(circle at 67% 39%, #4C251D 0 14%, transparent 14.5%),
    linear-gradient(135deg, #E2C396, #98654A 53%, #331914);
}

.th-p-chocolate .chocolate-shelf-placeholder::before,
.th-p-chocolate .chocolate-shelf-placeholder::after,
.th-p-chocolate .chocolate-shelf-placeholder i,
.th-p-chocolate .chocolate-shelf-placeholder b,
.th-p-chocolate .chocolate-shelf-placeholder span {
  position: absolute;
  display: block;
  content: '';
}

.th-p-chocolate .chocolate-shelf-placeholder::before {
  top: 20%;
  left: 18%;
  width: 55%;
  height: 24%;
  border: 1px solid rgba(255, 240, 207, .7);
  transform: rotate(-18deg);
}

.th-p-chocolate .chocolate-shelf-placeholder::after {
  right: 13%;
  bottom: 18%;
  width: 39%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: #3A1B16;
  box-shadow: inset .5rem .3rem 0 rgba(166, 101, 70, .65);
}

.th-p-chocolate .chocolate-shelf-placeholder i {
  bottom: 18%;
  left: 12%;
  width: 45%;
  height: 1px;
  background: rgba(255, 241, 207, .72);
  transform: rotate(28deg);
}

.th-p-chocolate .chocolate-shelf-placeholder b {
  top: 15%;
  right: 19%;
  width: .55rem;
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--chocolate-gold);
}

.th-p-chocolate .chocolate-shelf-placeholder span {
  right: 29%;
  bottom: 37%;
  width: .32rem;
  aspect-ratio: 1;
  border-radius: 50%;
  background: rgba(255, 240, 207, .9);
}

.th-p-chocolate .chocolate-shelf-details {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  align-items: flex-start;
  padding: 1rem .85rem 1.2rem;
}

.th-p-chocolate .chocolate-shelf-details p {
  margin: 0;
  color: var(--chocolate-clay);
  font: 800 .52rem/1.25 var(--font-body, 'Manrope', sans-serif);
  letter-spacing: .14em;
  text-transform: uppercase;
}

.th-p-chocolate .chocolate-shelf-details h3 {
  margin: .6rem 0 1.25rem;
  color: var(--chocolate-ink);
  font: 600 clamp(1.28rem, 1.8vw, 2rem)/.95 var(--font-display, 'Cormorant Garamond', Georgia, serif);
  letter-spacing: -.05em;
  overflow-wrap: anywhere;
}

.th-p-chocolate .chocolate-shelf-details > span {
  margin-top: auto;
  color: var(--chocolate-muted);
  font: 800 .52rem/1.2 var(--font-body, 'Manrope', sans-serif);
  letter-spacing: .13em;
  text-transform: uppercase;
}

.th-p-chocolate .chocolate-shelf-card:hover .chocolate-shelf-details h3,
.th-p-chocolate .chocolate-shelf-card:focus-visible .chocolate-shelf-details h3 {
  color: var(--chocolate-clay);
}

.th-p-chocolate .chocolate-product-edit {
  align-items: start;
}

.th-p-chocolate .chocolate-product-row {
  display: grid;
  min-width: 0;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.th-p-chocolate .chocolate-product-row .product-card,
.th-p-chocolate #shop .product-card {
  border-color: var(--chocolate-line);
  border-radius: 0;
  background: var(--chocolate-paper);
}

.th-p-chocolate .chocolate-product-row .product-card img,
.th-p-chocolate #shop .product-card img {
  border-radius: 0;
}

.th-p-chocolate #shop {
  padding-top: clamp(3.4rem, 6vw, 6.2rem);
}

.th-p-chocolate #shop :is(.section-title, h2) {
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-weight: 600;
  letter-spacing: -.055em;
}

.th-p-chocolate :is(.chocolate-copy .btn, .chocolate-index-link, .chocolate-index-shop, .chocolate-shelf-card, .chocolate-all-link, .chocolate-archive-hero > .motion-toggle):focus-visible {
  outline: 3px solid var(--chocolate-gold);
  outline-offset: 3px;
}

@media (max-width: 1080px) {
  .th-p-chocolate .chocolate-archive-shell {
    grid-template-columns: 5.25rem minmax(19rem, 1.16fr) minmax(16rem, .78fr);
  }

  .th-p-chocolate .chocolate-spine {
    padding-right: .82rem;
    padding-left: .82rem;
  }

  .th-p-chocolate .chocolate-copy-sheet {
    padding-right: 1.5rem;
    padding-left: 1.5rem;
  }

  .th-p-chocolate .chocolate-copy h1 {
    font-size: clamp(2.85rem, 5.1vw, 4.7rem);
  }

  .th-p-chocolate .chocolate-archive-index {
    padding-right: 1.3rem;
    padding-left: 1.3rem;
  }

  .th-p-chocolate .chocolate-discovery {
    grid-template-columns: minmax(14rem, .62fr) minmax(0, 1.65fr);
    gap: 2.25rem;
    padding-right: 2rem;
    padding-left: 2rem;
  }

  .th-p-chocolate .chocolate-shelf-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .th-p-chocolate .chocolate-archive-hero {
    min-height: 0;
  }

  .th-p-chocolate .chocolate-archive-shell {
    display: flex;
    min-height: 0;
    flex-direction: column;
  }

  .th-p-chocolate .chocolate-spine {
    display: grid;
    min-height: 3.5rem;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    padding: 0 1.2rem;
    border-right: 0;
    border-bottom: 1px solid rgba(255, 249, 238, .15);
  }

  .th-p-chocolate .chocolate-spine::after {
    right: auto;
    bottom: -1px;
    left: 0;
    width: 32%;
    height: 1px;
  }

  .th-p-chocolate .chocolate-spine-top,
  .th-p-chocolate .chocolate-spine-bottom {
    font-size: .5rem;
    line-height: 1.2;
    letter-spacing: .12em;
    writing-mode: horizontal-tb;
  }

  .th-p-chocolate .chocolate-spine-bottom {
    text-align: right;
  }

  .th-p-chocolate .chocolate-spine-rule {
    width: 2.1rem;
    height: 1px;
    margin: 0;
    background: linear-gradient(90deg, var(--chocolate-gold), transparent);
  }

  .th-p-chocolate .chocolate-hero-image {
    min-height: 18.5rem;
    aspect-ratio: 16 / 10;
  }

  .th-p-chocolate .chocolate-hero-image .hero-media,
  .th-p-chocolate .chocolate-hero-image .theme-empty-media {
    min-height: 0;
    object-position: 58% center;
  }

  .th-p-chocolate .chocolate-temper-mark {
    width: 4.35rem;
  }

  .th-p-chocolate .chocolate-copy-sheet {
    min-height: 0;
    padding: 2.35rem 1.25rem 2.85rem;
  }

  .th-p-chocolate .chocolate-copy h1 {
    max-width: 10ch;
    font-size: clamp(3.15rem, 13.2vw, 4.65rem);
  }

  .th-p-chocolate .chocolate-copy h1.long {
    font-size: clamp(2.35rem, 10.2vw, 3.75rem);
  }

  .th-p-chocolate .chocolate-copy .sub {
    max-width: 38ch;
  }

  .th-p-chocolate .chocolate-archive-index {
    padding: 1.2rem 1.25rem 1.35rem;
  }

  .th-p-chocolate .chocolate-index-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 .85rem;
    margin-top: .4rem;
  }

  .th-p-chocolate .chocolate-index-link {
    grid-template-columns: 1.45rem minmax(0, 1fr) auto;
    font-size: .63rem;
  }

  .th-p-chocolate .chocolate-archive-hero > .motion-toggle {
    right: 1rem;
    bottom: auto;
    left: auto;
    top: 4.35rem;
  }

  .th-p-chocolate .chocolate-discovery {
    display: block;
    padding: 3.35rem 1.25rem 4rem;
    background-size: 1.9rem 1.9rem;
  }

  .th-p-chocolate .chocolate-discovery-intro h2 {
    max-width: 11ch;
    font-size: clamp(2.85rem, 12vw, 4.3rem);
  }

  .th-p-chocolate .chocolate-shelf-grid {
    margin-top: 2.4rem;
  }

  .th-p-chocolate .chocolate-shelf-image {
    min-height: 9.5rem;
  }

  .th-p-chocolate .chocolate-product-row {
    grid-template-columns: 1fr;
    gap: .85rem;
    margin-top: 2.3rem;
  }
}

@media (max-width: 430px) {
  .th-p-chocolate .chocolate-hero-image figcaption {
    max-width: 13rem;
    font-size: .48rem;
  }

  .th-p-chocolate .chocolate-index-list {
    grid-template-columns: 1fr;
  }

  .th-p-chocolate .chocolate-shelf-grid {
    grid-template-columns: 1fr 1fr;
  }

  .th-p-chocolate .chocolate-shelf-details {
    padding-right: .7rem;
    padding-left: .7rem;
  }

  .th-p-chocolate .chocolate-shelf-details h3 {
    font-size: 1.45rem;
  }
}
`;

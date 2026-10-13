import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-minimal-wallets',
  name: 'FOLD STANDARD',
  for: 'people refining the small things they carry every day',
  vibe: 'a pocket-object archive in paper, graphite, and warm leather',
  category: 'Minimal wallets and card holders',
  group: 'fashion',
  display: 'Bodoni Moda',
  body: 'Manrope',
  displayWeight: 600,
  tracking: '-.045em',
  colors: {
    bg: '#E8E9E1',
    surface: '#F5F5EF',
    ink: '#18201D',
    muted: '#5E6862',
    line: '#B9BDB1',
    accent: '#596C35',
    onAccent: '#F7F7F0',
    panel: '#1C2723',
    onPanel: '#EEF0E8',
    foot: '#111815',
    onFoot: '#E7EAE0',
    bar: '#DDE0D5',
    onBar: '#18201D',
    badge: '#C8D96A',
    onBadge: '#172019',
  },
  header: 'stack',
  hero: 'editorial',
  card: 'boxed',
  ratio: '4/5',
  rCard: 2,
  rBtn: 0,
  motion: 'pan',
  collection: 'premium',
  family: 'minimal-wallets',
  demoPhoto: '/assets/themes/minimal-wallets-hero.webp',
  copy: {
    eyebrow: 'Pocket objects',
    collection: 'The carry index',
    cta: 'See the selection',
    title: 'Less, carried well.',
    subtitle: 'A quieter place for the pieces you reach for.',
  },
});

const itemNumber = (index) => String(index + 1).padStart(2, '0');
const countLabel = (count) => `${count} ${Number(count) === 1 ? 'piece' : 'pieces'}`;

export function hero(ctx) {
  const photoCount = Array.isArray(ctx.pics) ? ctx.pics.length : 0;
  const hasDetail = photoCount > 1;

  return `
    <section class="hero category-hero mw-pocket-hero${ctx.heroClass}"${ctx.heroAttrs}>
      <div class="mw-pocket-stage ${hasDetail ? 'has-detail' : 'no-detail'}">
        <p class="mw-hero-note"><span>Carry study</span><b>01</b></p>
        <figure class="mw-primary-pocket mw-media-frame">
          ${ctx.media(0, { priority: true, lazy: false, decorative: false })}
          <figcaption>Everyday objects, kept in close view.</figcaption>
        </figure>
        <div class="mw-copy-pocket">
          <span class="mw-copy-rule" aria-hidden="true"></span>
          ${ctx.copy('mw-hero-copy')}
        </div>
        ${hasDetail ? `
          <figure class="mw-detail-pocket mw-media-frame" aria-label="Collection detail">
            ${ctx.media(1, { lazy: true, decorative: true })}
            <figcaption>In the fold</figcaption>
          </figure>
        ` : `
          <div class="mw-detail-pocket mw-paper-pocket" aria-hidden="true">
            <span></span><span></span><span></span>
          </div>
        `}
        <div class="mw-edge-pocket" aria-hidden="true"><span>Keep only what matters</span></div>
      </div>
      <div class="mw-motion-controls">${ctx.controls}</div>
    </section>
  `;
}

export function discovery(ctx) {
  const cats = Array.isArray(ctx.cats) ? ctx.cats.filter((cat) => cat && cat.name) : [];
  const products = Array.isArray(ctx.products) ? ctx.products : [];

  if (cats.length >= 2) {
    return `
      <section class="mw-index-discovery" aria-labelledby="mw-index-title">
        <div class="mw-index-intro">
          <p class="mw-kicker">${ctx.esc(ctx.t.copy.collection)}</p>
          <h2 id="mw-index-title">Choose the pocket<br>you want to keep clear.</h2>
          <p>Open a live collection by the way this store has arranged what is currently available.</p>
        </div>
        <div class="mw-category-index">
          ${cats.slice(0, 5).map((category, index) => {
            const count = Number(category.count) || 0;
            const visual = category.image
              ? `<img src="${ctx.esc(category.image)}" alt="${ctx.esc(category.name)}" loading="lazy">`
              : '<span class="mw-category-placeholder" aria-hidden="true"></span>';
            return `
              <a class="mw-category-slip" href="${ctx.categoryLink(category.name)}">
                <span class="mw-category-number">${itemNumber(index)}</span>
                <span class="mw-category-visual">${visual}</span>
                <span class="mw-category-copy">
                  <strong>${ctx.esc(category.name)}</strong>
                  <small>${ctx.esc(countLabel(count))}</small>
                </span>
                <span class="mw-category-arrow" aria-hidden="true">↗</span>
              </a>
            `;
          }).join('')}
        </div>
      </section>
    `;
  }

  if (products.length > 0) {
    return `
      <section class="mw-index-discovery mw-product-index" aria-labelledby="mw-index-title">
        <div class="mw-index-intro">
          <p class="mw-kicker">${ctx.esc(ctx.t.copy.collection)}</p>
          <h2 id="mw-index-title">What is here,<br>kept close.</h2>
          <p>Start with a live selection, then browse the full collection below.</p>
        </div>
        <div class="mw-product-ledger">
          ${products.slice(0, 4).map((product, index) => `
            <a href="${ctx.productLink(product)}">
              <span class="mw-product-number">${itemNumber(index)}</span>
              <span class="mw-product-name"><strong>${ctx.esc(product.title)}</strong><small>${ctx.esc(ctx.money(product.price_cents ?? 0, product.currency || 'usd'))}</small></span>
              <span class="mw-product-arrow" aria-hidden="true">↗</span>
            </a>
          `).join('')}
        </div>
      </section>
    `;
  }

  return '';
}

export const css = `
.th-p-minimal-wallets {
  --mw-paper: #e8e9e1;
  --mw-surface: #f5f5ef;
  --mw-ink: #18201d;
  --mw-muted: #5e6862;
  --mw-line: #b9bdb1;
  --mw-moss: #596c35;
  --mw-dark: #1c2723;
  --mw-lime: #c8d96a;
  background: var(--mw-paper);
  color: var(--mw-ink);
}

.th-p-minimal-wallets .site-header,
.th-p-minimal-wallets .store-header {
  background: rgba(245, 245, 239, .95);
  border-bottom-color: var(--mw-line);
}

.th-p-minimal-wallets .site-header a,
.th-p-minimal-wallets .store-header a {
  color: var(--mw-ink);
}

.th-p-minimal-wallets .category-hero.mw-pocket-hero {
  position: relative;
  overflow: hidden;
  background: var(--mw-dark);
  color: var(--mw-surface);
}

.th-p-minimal-wallets .mw-pocket-stage {
  display: grid;
  grid-template-columns: minmax(165px, .42fr) minmax(390px, 1.52fr) minmax(190px, .56fr);
  grid-template-rows: minmax(160px, .56fr) minmax(300px, 1.18fr) minmax(145px, .46fr);
  min-height: clamp(620px, 57vw, 790px);
  padding: clamp(16px, 2.3vw, 36px);
  isolation: isolate;
}

.th-p-minimal-wallets .mw-hero-note {
  display: flex;
  grid-column: 1;
  grid-row: 1;
  align-items: flex-start;
  justify-content: space-between;
  min-width: 0;
  margin: 0;
  padding: 4px clamp(12px, 1.8vw, 28px) 0 0;
  color: rgba(238, 240, 232, .72);
  font: 700 clamp(9px, .68vw, 11px)/1.35 var(--body, 'Manrope', sans-serif);
  letter-spacing: .16em;
  text-transform: uppercase;
}

.th-p-minimal-wallets .mw-hero-note b {
  color: var(--mw-lime);
  font-weight: 800;
}

.th-p-minimal-wallets .mw-media-frame {
  position: relative;
  overflow: hidden;
  margin: 0;
}

.th-p-minimal-wallets .mw-media-frame .hero-media,
.th-p-minimal-wallets .mw-media-frame .theme-empty-media {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 100%;
  object-fit: cover;
}

.th-p-minimal-wallets .mw-primary-pocket {
  grid-column: 2 / 4;
  grid-row: 1 / 3;
  min-height: 0;
  background: #9e8568;
  border: 1px solid rgba(245, 245, 239, .68);
}

.th-p-minimal-wallets .mw-primary-pocket .hero-media {
  object-position: 57% center;
  filter: saturate(.76) contrast(1.04);
}

.th-p-minimal-wallets .mw-primary-pocket .theme-empty-media {
  background:
    linear-gradient(148deg, transparent 0 44%, rgba(245, 245, 239, .16) 44.2% 44.8%, transparent 45% 100%),
    radial-gradient(ellipse at 65% 53%, #84745f 0 14%, transparent 14.5%),
    linear-gradient(122deg, #28312c, #6f674f 55%, #a78b6c);
  color: #eef0e8;
}

.th-p-minimal-wallets .mw-primary-pocket::after {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(17, 24, 21, .3), transparent 36%, rgba(17, 24, 21, .06));
  content: '';
  pointer-events: none;
}

.th-p-minimal-wallets .mw-primary-pocket figcaption {
  position: absolute;
  z-index: 1;
  top: clamp(14px, 2vw, 28px);
  right: clamp(14px, 2vw, 28px);
  max-width: 13ch;
  margin: 0;
  color: rgba(245, 245, 239, .9);
  font: 700 9px/1.5 var(--body, 'Manrope', sans-serif);
  letter-spacing: .13em;
  text-align: right;
  text-transform: uppercase;
}

.th-p-minimal-wallets .mw-copy-pocket {
  position: relative;
  z-index: 2;
  display: flex;
  grid-column: 1 / 3;
  grid-row: 2 / 4;
  flex-direction: column;
  justify-content: flex-end;
  min-width: 0;
  padding: clamp(30px, 5vw, 72px) clamp(24px, 5.5vw, 78px) clamp(28px, 4vw, 55px) clamp(24px, 4vw, 60px);
  border: 1px solid var(--mw-line);
  background: var(--mw-surface);
  color: var(--mw-ink);
  box-shadow: 13px 15px 0 rgba(14, 21, 18, .2);
}

.th-p-minimal-wallets .mw-copy-pocket::before {
  position: absolute;
  top: 0;
  right: 0;
  width: clamp(70px, 15%, 132px);
  height: clamp(70px, 15%, 132px);
  border-bottom: 1px solid var(--mw-line);
  border-left: 1px solid var(--mw-line);
  background: var(--mw-paper);
  content: '';
}

.th-p-minimal-wallets .mw-copy-rule {
  position: absolute;
  top: clamp(23px, 3vw, 42px);
  left: clamp(24px, 4vw, 60px);
  width: clamp(34px, 4.3vw, 70px);
  height: 5px;
  background: var(--mw-lime);
}

.th-p-minimal-wallets .mw-hero-copy {
  position: relative;
  z-index: 1;
  max-width: 37rem;
}

.th-p-minimal-wallets .mw-hero-copy .eyebrow,
.th-p-minimal-wallets .mw-kicker {
  margin: 0 0 1rem;
  color: var(--mw-moss);
  font: 800 clamp(9px, .72vw, 11px)/1.3 var(--body, 'Manrope', sans-serif);
  letter-spacing: .18em;
  text-transform: uppercase;
}

.th-p-minimal-wallets .mw-hero-copy h1 {
  max-width: 10ch;
  margin: 0;
  color: var(--mw-ink);
  font-family: var(--display, 'Bodoni Moda', Georgia, serif);
  font-size: clamp(3.45rem, 6.7vw, 7.85rem);
  font-weight: 600;
  letter-spacing: -.07em;
  line-height: .78;
  overflow-wrap: anywhere;
  text-wrap: balance;
}

.th-p-minimal-wallets .mw-hero-copy h1.long {
  max-width: 13ch;
  font-size: clamp(2.7rem, 4.7vw, 5.7rem);
  line-height: .87;
}

.th-p-minimal-wallets .mw-hero-copy .sub {
  max-width: 29rem;
  margin: clamp(18px, 2.2vw, 28px) 0 0;
  color: var(--mw-muted);
  font: 500 clamp(13px, 1.1vw, 16px)/1.55 var(--body, 'Manrope', sans-serif);
  overflow-wrap: anywhere;
}

.th-p-minimal-wallets .mw-hero-copy :is(.ctas, .hero-ctas) {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: clamp(20px, 2.6vw, 34px);
}

.th-p-minimal-wallets .mw-hero-copy :is(.btn, a) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 18px;
  border: 1px solid var(--mw-ink);
  border-radius: 0;
  background: var(--mw-ink);
  color: var(--mw-surface);
  font: 800 10px/1 var(--body, 'Manrope', sans-serif);
  letter-spacing: .12em;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-minimal-wallets .mw-hero-copy :is(.btn, a):hover,
.th-p-minimal-wallets .mw-hero-copy :is(.btn, a):focus-visible {
  background: var(--mw-lime);
  border-color: var(--mw-lime);
  color: var(--mw-ink);
}

.th-p-minimal-wallets .mw-detail-pocket {
  z-index: 3;
  grid-column: 3;
  grid-row: 3;
  min-height: 0;
  border: 1px solid rgba(245, 245, 239, .55);
  background: #6a705c;
}

.th-p-minimal-wallets .mw-detail-pocket .hero-media {
  filter: grayscale(.16) saturate(.7) contrast(1.08);
}

.th-p-minimal-wallets .mw-detail-pocket figcaption {
  position: absolute;
  right: 10px;
  bottom: 9px;
  margin: 0;
  color: #f5f5ef;
  font: 800 8px/1 var(--body, 'Manrope', sans-serif);
  letter-spacing: .15em;
  text-transform: uppercase;
}

.th-p-minimal-wallets .mw-paper-pocket {
  display: grid;
  align-content: center;
  gap: 11px;
  padding: clamp(17px, 2vw, 27px);
  background: #d9ddd0;
}

.th-p-minimal-wallets .mw-paper-pocket span {
  display: block;
  height: 1px;
  background: var(--mw-moss);
}

.th-p-minimal-wallets .mw-paper-pocket span:nth-child(2) {
  width: 72%;
}

.th-p-minimal-wallets .mw-paper-pocket span:nth-child(3) {
  width: 43%;
  background: var(--mw-lime);
}

.th-p-minimal-wallets .mw-edge-pocket {
  display: flex;
  grid-column: 1;
  grid-row: 3;
  align-items: flex-end;
  min-width: 0;
  padding: 0 clamp(12px, 1.8vw, 28px) 3px 0;
  border-bottom: 1px solid rgba(238, 240, 232, .48);
}

.th-p-minimal-wallets .mw-edge-pocket span {
  max-width: 11ch;
  color: rgba(238, 240, 232, .72);
  font: 700 9px/1.5 var(--body, 'Manrope', sans-serif);
  letter-spacing: .13em;
  text-transform: uppercase;
}

.th-p-minimal-wallets .mw-motion-controls {
  position: absolute;
  z-index: 5;
  right: clamp(16px, 2.3vw, 36px);
  bottom: clamp(16px, 2.3vw, 36px);
}

.th-p-minimal-wallets .mw-motion-controls button,
.th-p-minimal-wallets .mw-pocket-hero .motion-toggle {
  min-width: 44px;
  min-height: 44px;
  border: 1px solid rgba(245, 245, 239, .7);
  border-radius: 0;
  background: rgba(28, 39, 35, .76);
  color: #f5f5ef;
  font: 800 9px/1 var(--body, 'Manrope', sans-serif);
  letter-spacing: .1em;
  text-transform: uppercase;
}

.th-p-minimal-wallets .mw-motion-controls button:hover,
.th-p-minimal-wallets .mw-pocket-hero .motion-toggle:hover {
  background: var(--mw-lime);
  border-color: var(--mw-lime);
  color: var(--mw-ink);
}

.th-p-minimal-wallets .mw-index-discovery {
  display: grid;
  grid-template-columns: minmax(230px, .8fr) minmax(0, 1.7fr);
  gap: clamp(35px, 7vw, 120px);
  align-items: start;
  padding: clamp(58px, 8vw, 126px) clamp(20px, 5.8vw, 100px);
  border-bottom: 1px solid var(--mw-line);
  background: var(--mw-paper);
}

.th-p-minimal-wallets .mw-index-intro {
  max-width: 26rem;
}

.th-p-minimal-wallets .mw-index-intro h2 {
  margin: 0;
  color: var(--mw-ink);
  font: 600 clamp(2.75rem, 4.45vw, 5.5rem)/.84 var(--display, 'Bodoni Moda', Georgia, serif);
  letter-spacing: -.065em;
  overflow-wrap: anywhere;
  text-wrap: balance;
}

.th-p-minimal-wallets .mw-index-intro > p:not(.mw-kicker) {
  max-width: 30ch;
  margin: 1.5rem 0 0;
  color: var(--mw-muted);
  font: 500 14px/1.6 var(--body, 'Manrope', sans-serif);
}

.th-p-minimal-wallets .mw-category-index {
  display: grid;
  border-top: 1px solid var(--mw-ink);
}

.th-p-minimal-wallets .mw-category-slip {
  display: grid;
  grid-template-columns: 38px minmax(82px, 120px) minmax(0, 1fr) 30px;
  gap: clamp(11px, 1.8vw, 25px);
  align-items: center;
  min-height: 117px;
  padding: 10px 0;
  border-bottom: 1px solid var(--mw-line);
  color: var(--mw-ink);
  text-decoration: none;
}

.th-p-minimal-wallets .mw-category-slip:hover,
.th-p-minimal-wallets .mw-category-slip:focus-visible {
  color: var(--mw-moss);
}

.th-p-minimal-wallets .mw-category-number,
.th-p-minimal-wallets .mw-product-number {
  color: var(--mw-moss);
  font: 800 10px/1 var(--body, 'Manrope', sans-serif);
  letter-spacing: .14em;
}

.th-p-minimal-wallets .mw-category-visual {
  position: relative;
  display: block;
  height: 95px;
  overflow: hidden;
  background: #c6cabc;
}

.th-p-minimal-wallets .mw-category-visual img,
.th-p-minimal-wallets .mw-category-placeholder {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.th-p-minimal-wallets .mw-category-placeholder {
  background:
    linear-gradient(146deg, transparent 0 40%, rgba(245, 245, 239, .56) 40.5% 42%, transparent 42.5%),
    linear-gradient(120deg, #33423b, #93a080 52%, #d3d7c7 52%);
}

.th-p-minimal-wallets .mw-category-copy {
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
}

.th-p-minimal-wallets .mw-category-copy strong {
  font: 600 clamp(1.3rem, 1.85vw, 2rem)/.96 var(--display, 'Bodoni Moda', Georgia, serif);
  letter-spacing: -.045em;
  overflow-wrap: anywhere;
}

.th-p-minimal-wallets .mw-category-copy small {
  color: var(--mw-muted);
  font: 800 9px/1.25 var(--body, 'Manrope', sans-serif);
  letter-spacing: .13em;
  text-transform: uppercase;
}

.th-p-minimal-wallets .mw-category-arrow,
.th-p-minimal-wallets .mw-product-arrow {
  justify-self: end;
  color: var(--mw-moss);
  font: 600 25px/.9 var(--display, 'Bodoni Moda', Georgia, serif);
}

.th-p-minimal-wallets .mw-product-index {
  align-items: center;
}

.th-p-minimal-wallets .mw-product-ledger {
  border-top: 1px solid var(--mw-ink);
}

.th-p-minimal-wallets .mw-product-ledger a {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) 30px;
  gap: 16px;
  align-items: center;
  min-height: 97px;
  border-bottom: 1px solid var(--mw-line);
  color: var(--mw-ink);
  text-decoration: none;
}

.th-p-minimal-wallets .mw-product-ledger a:hover,
.th-p-minimal-wallets .mw-product-ledger a:focus-visible {
  color: var(--mw-moss);
}

.th-p-minimal-wallets .mw-product-name {
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
}

.th-p-minimal-wallets .mw-product-name strong {
  font: 600 clamp(1.3rem, 1.8vw, 2rem)/.96 var(--display, 'Bodoni Moda', Georgia, serif);
  letter-spacing: -.045em;
  overflow-wrap: anywhere;
}

.th-p-minimal-wallets .mw-product-name small {
  color: var(--mw-muted);
  font: 800 9px/1.3 var(--body, 'Manrope', sans-serif);
  letter-spacing: .13em;
  text-transform: uppercase;
}

.th-p-minimal-wallets #shop,
.th-p-minimal-wallets .shop-section {
  padding: clamp(58px, 8vw, 116px) clamp(20px, 5.8vw, 100px);
  background: var(--mw-surface);
}

.th-p-minimal-wallets #shop > :is(h2, .section-title),
.th-p-minimal-wallets .shop-section > :is(h2, .section-title) {
  max-width: 12ch;
  color: var(--mw-ink);
  font-family: var(--display, 'Bodoni Moda', Georgia, serif);
  font-weight: 600;
  letter-spacing: -.055em;
  line-height: .88;
  overflow-wrap: anywhere;
}

.th-p-minimal-wallets .product-grid {
  gap: clamp(15px, 2.5vw, 34px);
}

.th-p-minimal-wallets .product-card {
  border: 1px solid var(--mw-line);
  border-radius: 2px;
  background: var(--mw-surface);
  box-shadow: none;
}

.th-p-minimal-wallets .product-card img {
  mix-blend-mode: multiply;
}

.th-p-minimal-wallets .product-card :is(h3, .product-title) {
  color: var(--mw-ink);
  font-family: var(--display, 'Bodoni Moda', Georgia, serif);
  letter-spacing: -.035em;
}

@media (max-width: 920px) {
  .th-p-minimal-wallets .mw-pocket-stage {
    grid-template-columns: minmax(125px, .34fr) minmax(345px, 1.36fr) minmax(145px, .42fr);
    grid-template-rows: minmax(145px, .5fr) minmax(310px, 1.2fr) minmax(130px, .4fr);
  }

  .th-p-minimal-wallets .mw-copy-pocket {
    padding-right: clamp(22px, 4vw, 44px);
    padding-left: clamp(22px, 3.4vw, 38px);
  }

  .th-p-minimal-wallets .mw-index-discovery {
    grid-template-columns: minmax(210px, .75fr) minmax(0, 1.45fr);
    gap: clamp(30px, 5vw, 60px);
  }
}

@media (max-width: 680px) {
  .th-p-minimal-wallets .mw-pocket-stage {
    grid-template-columns: minmax(0, 1fr) minmax(0, .72fr);
    grid-template-rows: auto minmax(290px, 67vw) auto minmax(104px, 24vw);
    min-height: 0;
    padding: 14px;
  }

  .th-p-minimal-wallets .mw-hero-note {
    grid-column: 1 / -1;
    grid-row: 1;
    min-height: 26px;
    padding: 0 0 12px;
  }

  .th-p-minimal-wallets .mw-primary-pocket {
    grid-column: 1 / -1;
    grid-row: 2;
  }

  .th-p-minimal-wallets .mw-primary-pocket figcaption {
    max-width: 16ch;
    font-size: 8px;
  }

  .th-p-minimal-wallets .mw-copy-pocket {
    grid-column: 1 / 2;
    grid-row: 3 / 5;
    margin-top: -1px;
    padding: 55px 22px 28px;
    box-shadow: 8px 10px 0 rgba(14, 21, 18, .2);
  }

  .th-p-minimal-wallets .mw-copy-pocket::before {
    width: 72px;
    height: 72px;
  }

  .th-p-minimal-wallets .mw-copy-rule {
    top: 23px;
    left: 22px;
    width: 37px;
    height: 4px;
  }

  .th-p-minimal-wallets .mw-hero-copy h1 {
    max-width: 11ch;
    font-size: clamp(3.1rem, 14.2vw, 5.6rem);
    line-height: .8;
  }

  .th-p-minimal-wallets .mw-hero-copy h1.long {
    font-size: clamp(2.5rem, 10vw, 4rem);
  }

  .th-p-minimal-wallets .mw-hero-copy .sub {
    margin-top: 17px;
    font-size: 13px;
  }

  .th-p-minimal-wallets .mw-hero-copy :is(.ctas, .hero-ctas) {
    margin-top: 21px;
  }

  .th-p-minimal-wallets .mw-hero-copy :is(.btn, a) {
    width: 100%;
  }

  .th-p-minimal-wallets .mw-detail-pocket {
    grid-column: 2;
    grid-row: 4;
    margin-top: -1px;
    border-left: 0;
  }

  .th-p-minimal-wallets .mw-edge-pocket {
    display: none;
  }

  .th-p-minimal-wallets .mw-motion-controls {
    right: 22px;
    bottom: auto;
    top: 54px;
  }

  .th-p-minimal-wallets .mw-index-discovery {
    grid-template-columns: 1fr;
    gap: 38px;
    padding: 58px 20px 68px;
  }

  .th-p-minimal-wallets .mw-index-intro {
    max-width: 34rem;
  }

  .th-p-minimal-wallets .mw-index-intro h2 {
    font-size: clamp(2.85rem, 11.3vw, 4.7rem);
  }

  .th-p-minimal-wallets .mw-category-slip {
    grid-template-columns: 30px 77px minmax(0, 1fr) 22px;
    gap: 10px;
    min-height: 95px;
  }

  .th-p-minimal-wallets .mw-category-visual {
    height: 76px;
  }

  .th-p-minimal-wallets .mw-category-copy strong,
  .th-p-minimal-wallets .mw-product-name strong {
    font-size: 1.45rem;
  }

  .th-p-minimal-wallets .mw-product-ledger a {
    grid-template-columns: 30px minmax(0, 1fr) 22px;
    gap: 10px;
    min-height: 86px;
  }

  .th-p-minimal-wallets #shop,
  .th-p-minimal-wallets .shop-section {
    padding: 58px 20px 68px;
  }
}

@media (max-width: 390px) {
  .th-p-minimal-wallets .mw-pocket-stage {
    grid-template-rows: auto minmax(260px, 68vw) auto minmax(92px, 23vw);
  }

  .th-p-minimal-wallets .mw-copy-pocket {
    padding-right: 18px;
    padding-bottom: 23px;
    padding-left: 18px;
  }

  .th-p-minimal-wallets .mw-copy-rule {
    left: 18px;
  }

  .th-p-minimal-wallets .mw-hero-copy h1 {
    font-size: 3rem;
  }

  .th-p-minimal-wallets .mw-hero-copy .sub {
    font-size: 12px;
  }

  .th-p-minimal-wallets .mw-category-slip {
    grid-template-columns: 25px 64px minmax(0, 1fr) 18px;
    gap: 8px;
  }

  .th-p-minimal-wallets .mw-category-visual {
    height: 67px;
  }

  .th-p-minimal-wallets .mw-category-copy small,
  .th-p-minimal-wallets .mw-product-name small {
    font-size: 8px;
    letter-spacing: .09em;
  }
}

@media (prefers-reduced-motion: reduce) {
  .th-p-minimal-wallets .mw-media-frame .hero-media {
    transform: none !important;
  }
}
`;

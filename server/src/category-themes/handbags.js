import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-handbags',
  name: 'Morrow & Vale',
  for: 'considered carry pieces and silk accents',
  vibe: 'sun-warmed leather, tactile silk, and quiet editorial restraint',
  category: 'Leather handbags and silk accessories',
  group: 'fashion',
  display: 'Cormorant Garamond',
  body: 'DM Sans',
  displayWeight: 500,
  tracking: '-.045em',
  colors: {
    bg: '#F6F0E7',
    surface: '#FBF8F2',
    ink: '#27170F',
    muted: '#705D51',
    line: '#D9CABC',
    accent: '#6B2E1F',
    onAccent: '#FFF8ED',
    panel: '#3A1C12',
    onPanel: '#F8EBDD',
    foot: '#24140F',
    onFoot: '#F7ECE1',
    bar: '#EFE3D3',
    onBar: '#2D1A12',
    badge: '#B35A3C',
    onBadge: '#FFF8ED',
  },
  header: 'split',
  hero: 'collage',
  card: 'minimal',
  ratio: '3/4',
  rCard: 0,
  rBtn: 0,
  motion: 'pan',
  collection: 'premium',
  family: 'handbags',
  demoPhoto: '/assets/themes/handbags-hero.webp',
  copy: {
    eyebrow: 'The late-sun edit',
    collection: 'New arrivals',
    cta: 'Shop the collection',
    title: 'Carry the afterglow',
    subtitle: 'Leather, silk, and the longer light of what comes next.',
  },
});

export function hero(ctx) {
  const photoCount = Array.isArray(ctx.pics) ? ctx.pics.length : 0;
  const hasDetail = photoCount > 1;
  const hasSilk = photoCount > 2;
  const gridState = [
    'hb-hero-grid',
    hasDetail ? 'has-detail' : 'no-detail',
    hasSilk ? 'has-silk' : 'no-silk',
    !hasDetail && !hasSilk ? 'is-solo' : '',
  ].filter(Boolean).join(' ');

  return `
    <section class="hero category-hero hb-afterglow-hero${ctx.heroClass}"${ctx.heroAttrs}>
      <div class="${gridState}">
        ${hasDetail ? `
          <aside class="hb-detail-frame hb-media-frame" aria-label="Collection detail">
            ${ctx.media(1, { lazy: true, decorative: true })}
            <p class="hb-detail-note">Objects for a brighter tomorrow</p>
          </aside>
        ` : ''}
        <figure class="hb-main-frame hb-media-frame">
          ${ctx.media(0, { priority: true, lazy: false, decorative: false })}
          <figcaption class="hb-main-caption">A quieter kind of luxury travels further</figcaption>
        </figure>
        <div class="hb-story-frame">
          ${hasSilk ? `
            <figure class="hb-silk-frame hb-media-frame" aria-hidden="true">
              ${ctx.media(2, { lazy: true, decorative: true })}
            </figure>
          ` : '<span class="hb-silk-fold" aria-hidden="true"></span>'}
          <div class="hb-copy-layer">
            ${ctx.copy('hb-copy')}
          </div>
        </div>
      </div>
      <div class="hb-motion-controls">${ctx.controls}</div>
    </section>
  `;
}

export function discovery(ctx) {
  const cats = Array.isArray(ctx.cats) ? ctx.cats.filter((cat) => cat && cat.name) : [];
  const products = Array.isArray(ctx.products) ? ctx.products : [];

  if (cats.length >= 2) {
    const categoryCards = cats.slice(0, 4).map((cat, index) => {
      const count = Number(cat.count) || 0;
      const visual = cat.image
        ? `<img src="${ctx.esc(cat.image)}" alt="${ctx.esc(cat.name)}" loading="lazy">`
        : `<span class="hb-category-fallback hb-category-fallback-${(index % 4) + 1}" aria-hidden="true"></span>`;

      return `
        <a class="hb-category-card" href="${ctx.categoryLink(cat.name)}">
          <span class="hb-category-visual">${visual}</span>
          <span class="hb-category-meta">
            <b>${ctx.esc(cat.name)}</b>
            <small>${ctx.esc(String(count))} ${count === 1 ? 'item' : 'items'}</small>
          </span>
          <span class="hb-category-arrow" aria-hidden="true">↗</span>
        </a>
      `;
    }).join('');

    return `
      <section class="hb-discovery" aria-labelledby="hb-discovery-title">
        <div class="hb-discovery-intro">
          <p class="hb-kicker">The carry edit</p>
          <h2 id="hb-discovery-title">Chosen to go<br>further.</h2>
          <p>Explore the pieces already present in this collection, arranged by the way you carry them.</p>
        </div>
        <div class="hb-category-rail">${categoryCards}</div>
      </section>
    `;
  }

  if (products.length > 0) {
    return `
      <section class="hb-discovery hb-discovery-single" aria-labelledby="hb-discovery-title">
        <div class="hb-discovery-intro">
          <p class="hb-kicker">The carry edit</p>
          <h2 id="hb-discovery-title">A piece worth<br>keeping close.</h2>
          <p>Begin with a current selection, then browse the full collection below.</p>
        </div>
        <div class="hb-single-product">${ctx.productCard(products[0])}</div>
      </section>
    `;
  }

  return '';
}

export const css = `
.th-p-handbags {
  --hb-cream: #f6f0e7;
  --hb-paper: #fbf8f2;
  --hb-ink: #27170f;
  --hb-cocoa: #3a1c12;
  --hb-rust: #6b2e1f;
  --hb-clay: #b35a3c;
  --hb-line: #d9cabc;
  --hb-muted: #705d51;
  background: var(--hb-cream);
  color: var(--hb-ink);
}

.th-p-handbags .site-header,
.th-p-handbags .store-header {
  background: rgba(251, 248, 242, .94);
  border-bottom-color: var(--hb-line);
}

.th-p-handbags .hb-afterglow-hero {
  position: relative;
  background: var(--hb-cream);
  color: var(--hb-ink);
  overflow: hidden;
}

.th-p-handbags .hb-hero-grid {
  display: grid;
  grid-template-columns: minmax(180px, .8fr) minmax(340px, 1.36fr) minmax(360px, 1.08fr);
  min-height: clamp(570px, 53vw, 760px);
}

.th-p-handbags .hb-hero-grid.no-detail {
  grid-template-columns: minmax(0, 1.28fr) minmax(360px, .92fr);
}

.th-p-handbags .hb-hero-grid.no-silk .hb-story-frame {
  background: var(--hb-paper);
}

.th-p-handbags .hb-hero-grid.is-solo {
  grid-template-columns: minmax(0, 1.24fr) minmax(340px, .96fr);
}

.th-p-handbags .hb-media-frame {
  position: relative;
  overflow: hidden;
  margin: 0;
}

.th-p-handbags .hb-media-frame .hero-media,
.th-p-handbags .hb-media-frame .theme-empty-media {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 100%;
  object-fit: cover;
}

.th-p-handbags .hb-main-frame {
  min-height: clamp(570px, 53vw, 760px);
  background: #a66540;
}

.th-p-handbags .hb-main-frame::after {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(180deg, rgba(36, 16, 8, .08) 30%, rgba(36, 16, 8, .42) 100%);
  content: '';
  pointer-events: none;
}

.th-p-handbags .hb-main-caption,
.th-p-handbags .hb-detail-note {
  position: absolute;
  z-index: 2;
  max-width: 13ch;
  margin: 0;
  color: #fff8ed;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .61rem;
  font-weight: 600;
  letter-spacing: .25em;
  line-height: 1.65;
  text-transform: uppercase;
}

.th-p-handbags .hb-main-caption {
  top: 24%;
  left: 8%;
}

.th-p-handbags .hb-detail-frame {
  min-height: clamp(570px, 53vw, 760px);
  background: var(--hb-cocoa);
}

.th-p-handbags .hb-detail-frame .hero-media {
  filter: saturate(.8) contrast(1.06);
}

.th-p-handbags .hb-detail-frame::after {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(145deg, rgba(12, 5, 3, .42), rgba(12, 5, 3, .02) 55%, rgba(12, 5, 3, .58));
  content: '';
  pointer-events: none;
}

.th-p-handbags .hb-detail-note {
  right: 12%;
  bottom: 7%;
  left: 12%;
}

.th-p-handbags .hb-story-frame {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 0;
  overflow: hidden;
  background: #eee2d2;
}

.th-p-handbags .hb-silk-frame {
  position: absolute;
  top: 0;
  right: 0;
  width: 59%;
  height: 42%;
  background: var(--hb-rust);
}

.th-p-handbags .hb-silk-frame::after {
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, rgba(107, 46, 31, .06), rgba(107, 46, 31, .58));
  content: '';
  pointer-events: none;
}

.th-p-handbags .hb-silk-fold {
  position: absolute;
  top: -9%;
  right: -13%;
  width: 56%;
  height: 44%;
  border-radius: 43% 7% 57% 10%;
  background: linear-gradient(132deg, #a9482e 0%, #6b2e1f 52%, #e5c8a9 54%, #7a251d 72%, #38100e 100%);
  box-shadow: -28px 25px 0 rgba(129, 54, 34, .2), -48px 54px 0 rgba(92, 33, 24, .16);
  opacity: .9;
  transform: rotate(13deg);
}

.th-p-handbags .hb-copy-layer {
  position: relative;
  z-index: 2;
  width: min(100%, 34rem);
  padding: clamp(5.5rem, 13vw, 12.5rem) clamp(2rem, 5vw, 5.4rem) clamp(3.25rem, 7vw, 6.5rem);
}

.th-p-handbags .hb-copy-layer .txt {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.th-p-handbags .hb-copy-layer .eyebrow,
.th-p-handbags .hb-kicker {
  margin: 0 0 1.1rem;
  color: var(--hb-rust);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .62rem;
  font-weight: 700;
  letter-spacing: .25em;
  line-height: 1.4;
  text-transform: uppercase;
}

.th-p-handbags .hb-copy-layer .eyebrow::after {
  display: block;
  width: 2.4rem;
  height: 1px;
  margin-top: 1.15rem;
  background: currentColor;
  content: '';
}

.th-p-handbags .hb-copy-layer h1 {
  max-width: 9ch;
  margin: 0;
  color: var(--hb-ink);
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: clamp(3.7rem, 6.2vw, 6.85rem);
  font-weight: 500;
  letter-spacing: -.065em;
  line-height: .82;
  overflow-wrap: anywhere;
}

.th-p-handbags .hb-copy-layer .sub {
  max-width: 25rem;
  margin: 1.7rem 0 0;
  color: var(--hb-muted);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: clamp(.9rem, 1.18vw, 1.04rem);
  line-height: 1.45;
}

.th-p-handbags .hb-copy-layer .ctas,
.th-p-handbags .hb-copy-layer .hero-ctas {
  display: flex;
  flex-wrap: wrap;
  gap: .75rem;
  margin-top: 2rem;
}

.th-p-handbags .hb-copy-layer a,
.th-p-handbags .hb-copy-layer .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: .83rem 1.3rem;
  border: 1px solid var(--hb-rust);
  border-radius: 0;
  background: var(--hb-rust);
  color: #fff8ed;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .65rem;
  font-weight: 700;
  letter-spacing: .17em;
  line-height: 1;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-handbags .hb-copy-layer a:hover,
.th-p-handbags .hb-copy-layer a:focus-visible,
.th-p-handbags .hb-copy-layer .btn:hover,
.th-p-handbags .hb-copy-layer .btn:focus-visible {
  background: transparent;
  color: var(--hb-rust);
}

.th-p-handbags .hb-motion-controls {
  position: absolute;
  right: clamp(1rem, 2vw, 2rem);
  bottom: 1rem;
  z-index: 4;
}

.th-p-handbags .hb-motion-controls button {
  min-width: 44px;
  min-height: 44px;
  border: 1px solid rgba(255, 248, 237, .7);
  border-radius: 50%;
  background: rgba(39, 23, 15, .58);
  color: #fff8ed;
}

.th-p-handbags .hb-discovery {
  display: grid;
  grid-template-columns: minmax(220px, .75fr) minmax(0, 2.25fr);
  gap: clamp(2rem, 5vw, 6rem);
  align-items: end;
  padding: clamp(4rem, 8vw, 8rem) clamp(1.25rem, 6vw, 8rem);
  background: var(--hb-paper);
  border-bottom: 1px solid var(--hb-line);
}

.th-p-handbags .hb-discovery-intro {
  max-width: 21rem;
}

.th-p-handbags .hb-discovery-intro h2 {
  margin: 0;
  color: var(--hb-ink);
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: clamp(2.75rem, 4.2vw, 5rem);
  font-weight: 500;
  letter-spacing: -.06em;
  line-height: .88;
  overflow-wrap: anywhere;
}

.th-p-handbags .hb-discovery-intro > p:not(.hb-kicker) {
  margin: 1.4rem 0 0;
  color: var(--hb-muted);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .92rem;
  line-height: 1.55;
}

.th-p-handbags .hb-category-rail {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border-top: 1px solid var(--hb-line);
}

.th-p-handbags .hb-category-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 17rem;
  padding: 1rem 1rem 1.2rem;
  border-right: 1px solid var(--hb-line);
  color: var(--hb-ink);
  text-decoration: none;
}

.th-p-handbags .hb-category-card:first-child {
  border-left: 1px solid var(--hb-line);
}

.th-p-handbags .hb-category-visual {
  display: block;
  position: relative;
  flex: 1;
  min-height: 10rem;
  overflow: hidden;
  background: #ead9c9;
}

.th-p-handbags .hb-category-visual img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.th-p-handbags .hb-category-fallback {
  display: block;
  width: 100%;
  height: 100%;
}

.th-p-handbags .hb-category-fallback-1 {
  background: radial-gradient(circle at 52% 42%, #d2ad85 0 11%, transparent 11.4%), linear-gradient(135deg, #352016, #7d4934 58%, #e9d2ba);
}

.th-p-handbags .hb-category-fallback-2 {
  background: linear-gradient(150deg, #d7b798 0 47%, #e9ddd0 47% 58%, #7f2d20 58% 100%);
}

.th-p-handbags .hb-category-fallback-3 {
  background: radial-gradient(ellipse at 50% 47%, #c9956d 0 22%, transparent 22.5%), linear-gradient(165deg, #f1e7da, #98705a);
}

.th-p-handbags .hb-category-fallback-4 {
  background: linear-gradient(45deg, #441a14 0 20%, #b85435 20% 43%, #f0d8bd 43% 66%, #63271e 66% 100%);
}

.th-p-handbags .hb-category-meta {
  display: flex;
  flex-direction: column;
  gap: .32rem;
  padding-top: .9rem;
}

.th-p-handbags .hb-category-meta b {
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: 1.16rem;
  font-weight: 600;
  line-height: 1.05;
  overflow-wrap: anywhere;
}

.th-p-handbags .hb-category-meta small {
  color: var(--hb-muted);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .62rem;
  font-weight: 700;
  letter-spacing: .14em;
  text-transform: uppercase;
}

.th-p-handbags .hb-category-arrow {
  position: absolute;
  right: 1rem;
  bottom: 1rem;
  color: var(--hb-rust);
  font-size: 1.2rem;
}

.th-p-handbags .hb-category-card:hover .hb-category-visual,
.th-p-handbags .hb-category-card:focus-visible .hb-category-visual {
  outline: 1px solid var(--hb-rust);
  outline-offset: 4px;
}

.th-p-handbags .hb-discovery-single {
  align-items: center;
}

.th-p-handbags .hb-single-product {
  width: min(100%, 22rem);
  justify-self: start;
}

.th-p-handbags #shop,
.th-p-handbags .shop-section {
  padding: clamp(4rem, 7vw, 7rem) clamp(1.25rem, 6vw, 8rem);
  background: var(--hb-cream);
}

.th-p-handbags #shop > h2,
.th-p-handbags .shop-section > h2 {
  max-width: 12ch;
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: clamp(2.7rem, 4vw, 4.75rem);
  font-weight: 500;
  letter-spacing: -.055em;
  line-height: .9;
}

.th-p-handbags .product-grid {
  gap: clamp(1rem, 2.2vw, 2rem);
}

.th-p-handbags .product-card {
  border-color: var(--hb-line);
  border-radius: 0;
  box-shadow: none;
}

.th-p-handbags .product-card img {
  mix-blend-mode: multiply;
}

@media (max-width: 980px) {
  .th-p-handbags .hb-hero-grid,
  .th-p-handbags .hb-hero-grid.no-detail,
  .th-p-handbags .hb-hero-grid.is-solo {
    grid-template-columns: minmax(0, 1.08fr) minmax(300px, .92fr);
  }

  .th-p-handbags .hb-detail-frame {
    display: none;
  }

  .th-p-handbags .hb-hero-grid.has-silk .hb-story-frame {
    min-height: clamp(570px, 53vw, 760px);
  }

  .th-p-handbags .hb-silk-frame {
    width: 70%;
    height: 34%;
  }

  .th-p-handbags .hb-discovery {
    grid-template-columns: minmax(190px, .7fr) minmax(0, 2.3fr);
    gap: 2.5rem;
  }

  .th-p-handbags .hb-category-rail {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .th-p-handbags .hb-category-card:nth-child(3) {
    border-left: 1px solid var(--hb-line);
  }

  .th-p-handbags .hb-category-card:nth-child(-n+2) {
    border-bottom: 1px solid var(--hb-line);
  }
}

@media (max-width: 680px) {
  .th-p-handbags .hb-afterglow-hero {
    overflow: visible;
  }

  .th-p-handbags .hb-hero-grid,
  .th-p-handbags .hb-hero-grid.no-detail,
  .th-p-handbags .hb-hero-grid.is-solo {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .th-p-handbags .hb-main-frame {
    min-height: min(132vw, 36rem);
  }

  .th-p-handbags .hb-main-caption {
    top: auto;
    right: 1.25rem;
    bottom: 1.5rem;
    left: 1.25rem;
    max-width: 17ch;
  }

  .th-p-handbags .hb-story-frame,
  .th-p-handbags .hb-hero-grid.has-silk .hb-story-frame {
    min-height: 0;
  }

  .th-p-handbags .hb-silk-frame {
    width: 54%;
    height: 38%;
  }

  .th-p-handbags .hb-copy-layer {
    width: 100%;
    min-height: 30rem;
    padding: 7.1rem 1.4rem 4.25rem;
  }

  .th-p-handbags .hb-copy-layer h1 {
    max-width: 11ch;
    font-size: clamp(3.7rem, 16vw, 5rem);
  }

  .th-p-handbags .hb-copy-layer .sub {
    max-width: 29rem;
  }

  .th-p-handbags .hb-motion-controls {
    top: calc(min(132vw, 36rem) - 3.75rem);
    right: 1rem;
    bottom: auto;
  }

  .th-p-handbags .hb-discovery {
    display: block;
    padding: 4rem 1.1rem;
  }

  .th-p-handbags .hb-discovery-intro {
    max-width: 28rem;
  }

  .th-p-handbags .hb-category-rail {
    margin-top: 2.25rem;
  }

  .th-p-handbags .hb-category-card {
    min-height: 14rem;
    padding: .7rem .7rem 1rem;
  }

  .th-p-handbags .hb-category-visual {
    min-height: 7.5rem;
  }

  .th-p-handbags .hb-category-meta b {
    font-size: 1.05rem;
  }

  .th-p-handbags .hb-single-product {
    width: min(100%, 21rem);
    margin-top: 2.25rem;
  }

  .th-p-handbags #shop,
  .th-p-handbags .shop-section {
    padding: 4.2rem 1.1rem;
  }
}

@media (max-width: 390px) {
  .th-p-handbags .hb-copy-layer {
    min-height: 31rem;
    padding-right: 1.1rem;
    padding-left: 1.1rem;
  }

  .th-p-handbags .hb-copy-layer h1 {
    font-size: 3.55rem;
  }

  .th-p-handbags .hb-category-card {
    min-height: 12.6rem;
  }

  .th-p-handbags .hb-category-meta small {
    font-size: .56rem;
    letter-spacing: .1em;
  }
}

@media (prefers-reduced-motion: reduce) {
  .th-p-handbags .hb-media-frame .hero-media {
    transform: none !important;
  }
}
`;

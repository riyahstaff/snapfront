import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-swimwear',
  name: 'SOLLINE',
  for: 'sun-seeking swimwear and poolside layers',
  vibe: 'sun-struck pool geometry, deep water, and coral knit',
  category: 'Resort swimwear and poolside separates',
  group: 'fashion',
  display: 'DM Serif Display',
  body: 'Manrope',
  displayWeight: 400,
  tracking: '-.055em',
  colors: {
    bg: '#F5EEDF',
    surface: '#FFF9EE',
    ink: '#1B3442',
    muted: '#5F7073',
    line: '#D7CBB7',
    accent: '#C9503D',
    onAccent: '#FFF8EE',
    panel: '#123A4A',
    onPanel: '#EAF8F2',
    foot: '#0B2935',
    onFoot: '#F4EBDD',
    bar: '#F9F3E9',
    onBar: '#1B3442',
    badge: '#E6C969',
    onBadge: '#16343F',
  },
  header: 'stack',
  hero: 'spotlight',
  card: 'bold',
  ratio: '4/5',
  rCard: 16,
  rBtn: 999,
  motion: 'pan',
  collection: 'premium',
  family: 'swimwear',
  demoPhoto: '/assets/themes/swimwear-hero.webp',
  copy: {
    eyebrow: 'Pool studies',
    collection: 'The waterline edit',
    cta: 'Shop the collection',
    title: 'Find your blue hour.',
    subtitle: 'A sunward collection for the long, bright pause.',
  },
});

const imageForCategory = (ctx, category, index) => {
  const image = typeof category?.image === 'string' ? category.image : category?.image?.url;
  return image
    ? `<img src="${ctx.esc(image)}" alt="${ctx.esc(category.name)}" loading="lazy" decoding="async">`
    : `<span class="sw-category-fallback sw-category-fallback-${(index % 4) + 1}" aria-hidden="true"></span>`;
};

export function hero(ctx) {
  const photoCount = Array.isArray(ctx.pics) ? ctx.pics.length : 0;
  const hasReflection = photoCount > 1;

  return `
    <section class="hero category-hero sw-hero${ctx.heroClass}"${ctx.heroAttrs}>
      <div class="sw-hero-stage ${hasReflection ? 'has-reflection' : 'no-reflection'}">
        <div class="sw-hero-legend" aria-hidden="true">
          <span>Sun</span><i></i><span>Water</span><i></i><span>Skin</span>
        </div>
        <figure class="sw-primary-media sw-media-frame">
          ${ctx.media(0, { priority: true, lazy: false, decorative: false })}
          <figcaption><span>01</span> A place to meet the light.</figcaption>
        </figure>
        <div class="sw-copy-raft">
          <span class="sw-raft-knot" aria-hidden="true"></span>
          ${ctx.copy('sw-copy')}
        </div>
        ${hasReflection ? `
          <figure class="sw-reflection-media sw-media-frame" aria-label="Collection detail">
            ${ctx.media(1, { lazy: true, decorative: true })}
            <span class="sw-reflection-label" aria-hidden="true">Further out</span>
          </figure>
        ` : `
          <div class="sw-reflection-swatch" aria-hidden="true">
            <span></span><i></i><b></b>
          </div>
        `}
        <a class="sw-hero-current" href="#shop"><span>Make your entrance</span><b aria-hidden="true">↓</b></a>
      </div>
      <div class="sw-motion-controls">${ctx.controls}</div>
    </section>
  `;
}

export function discovery(ctx) {
  const categories = Array.isArray(ctx.cats) ? ctx.cats.filter((category) => category?.name).slice(0, 4) : [];
  const products = Array.isArray(ctx.products) ? ctx.products.filter(Boolean).slice(0, 3) : [];

  if (categories.length >= 2) {
    const cards = categories.map((category, index) => {
      const count = Number.isFinite(Number(category.count)) ? Number(category.count) : 0;
      return `
        <a class="sw-current-card" href="${ctx.esc(ctx.categoryLink(category.name))}">
          <span class="sw-current-number">${String(index + 1).padStart(2, '0')}</span>
          <span class="sw-current-visual">${imageForCategory(ctx, category, index)}</span>
          <span class="sw-current-copy">
            <b>${ctx.esc(category.name)}</b>
            <small>${ctx.esc(String(count))} ${count === 1 ? 'piece' : 'pieces'} in the current</small>
          </span>
          <span class="sw-current-arrow" aria-hidden="true">↗</span>
        </a>
      `;
    }).join('');

    return `
      <section class="theme-discovery sw-discovery" aria-labelledby="sw-discovery-title">
        <div class="sw-discovery-heading">
          <p class="sw-kicker">Choose your current</p>
          <h2 id="sw-discovery-title">Start at the<br><em>waterline.</em></h2>
          <p>Move through the live collection by the categories already in this store.</p>
          <a class="sw-all-link" href="#shop">See everything <span aria-hidden="true">↓</span></a>
        </div>
        <div class="sw-current-list">${cards}</div>
      </section>
    `;
  }

  if (products.length) {
    return `
      <section class="theme-discovery sw-discovery sw-product-discovery" aria-labelledby="sw-discovery-title">
        <div class="sw-discovery-heading">
          <p class="sw-kicker">The waterline edit</p>
          <h2 id="sw-discovery-title">A little farther<br><em>out.</em></h2>
          <p>Begin with the swim pieces available in this collection today.</p>
          <a class="sw-all-link" href="#shop">See everything <span aria-hidden="true">↓</span></a>
        </div>
        <div class="sw-product-notes">${products.map((product) => ctx.productCard(product)).join('')}</div>
      </section>
    `;
  }

  return '';
}

export const css = `
.th-p-swimwear {
  --sw-sand: #f5eedf;
  --sw-paper: #fff9ee;
  --sw-ink: #1b3442;
  --sw-muted: #5f7073;
  --sw-line: #d7cbb7;
  --sw-coral: #c9503d;
  --sw-aqua: #123a4a;
  --sw-deep: #0b2935;
  --sw-sun: #e6c969;
  background: var(--sw-sand);
  color: var(--sw-ink);
}

.th-p-swimwear .site-header,
.th-p-swimwear .store-header {
  background: color-mix(in srgb, var(--sw-paper) 93%, transparent);
  border-color: var(--sw-line);
}

.th-p-swimwear .site-header a,
.th-p-swimwear .store-header a {
  color: var(--sw-ink);
}

.th-p-swimwear .sw-hero {
  position: relative;
  overflow: hidden;
  background: var(--sw-aqua);
  color: var(--sw-paper);
}

.th-p-swimwear .sw-hero-stage {
  position: relative;
  display: grid;
  grid-template-columns: minmax(15rem, .66fr) minmax(0, 1.72fr) minmax(12.5rem, .49fr);
  grid-template-rows: minmax(4.3rem, .13fr) minmax(25rem, .87fr);
  min-height: clamp(38rem, 54vw, 49rem);
  overflow: hidden;
  isolation: isolate;
}

.th-p-swimwear .sw-hero-stage::before {
  position: absolute;
  z-index: -1;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background:
    linear-gradient(90deg, var(--sw-aqua) 0 20%, transparent 20% 79%, rgba(11, 41, 53, .95) 79%),
    linear-gradient(135deg, #18556a, var(--sw-aqua));
  content: '';
}

.th-p-swimwear .sw-hero-legend {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: .7rem;
  min-width: 0;
  padding: 1.1rem clamp(1.25rem, 3vw, 3.2rem);
  border-bottom: 1px solid rgba(234, 248, 242, .25);
  color: rgba(234, 248, 242, .82);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .6rem;
  font-weight: 700;
  letter-spacing: .23em;
  line-height: 1;
  text-transform: uppercase;
}

.th-p-swimwear .sw-hero-legend i {
  width: .32rem;
  height: .32rem;
  border-radius: 50%;
  background: var(--sw-sun);
}

.th-p-swimwear .sw-media-frame {
  position: relative;
  overflow: hidden;
  margin: 0;
}

.th-p-swimwear .sw-media-frame .hero-media,
.th-p-swimwear .sw-media-frame .theme-empty-media {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 100%;
  object-fit: cover;
}

.th-p-swimwear .sw-primary-media {
  grid-column: 2;
  grid-row: 2;
  min-height: clamp(30rem, 47vw, 44.7rem);
  background: #17617b;
}

.th-p-swimwear .sw-primary-media .hero-media {
  object-position: 62% center;
}

.th-p-swimwear .sw-primary-media .theme-empty-media {
  background:
    radial-gradient(circle at 69% 63%, rgba(255, 249, 238, .52) 0 3%, transparent 3.2%),
    linear-gradient(145deg, #187590 0 46%, #2da0ae 46% 59%, #d48b61 59% 100%);
  color: var(--sw-paper);
}

.th-p-swimwear .sw-primary-media::after {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(11, 41, 53, .1), transparent 40%, rgba(11, 41, 53, .38));
  content: '';
  pointer-events: none;
}

.th-p-swimwear .sw-primary-media figcaption {
  position: absolute;
  z-index: 2;
  right: 1.2rem;
  bottom: 1.2rem;
  display: flex;
  align-items: baseline;
  gap: .65rem;
  max-width: 20ch;
  margin: 0;
  color: var(--sw-paper);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .63rem;
  font-weight: 600;
  letter-spacing: .08em;
  line-height: 1.45;
  text-transform: uppercase;
}

.th-p-swimwear .sw-primary-media figcaption span {
  color: var(--sw-sun);
  font-size: .9rem;
  font-weight: 800;
}

.th-p-swimwear .sw-copy-raft {
  z-index: 2;
  grid-column: 1 / 3;
  grid-row: 2;
  align-self: end;
  width: min(42rem, 76%);
  min-width: 0;
  margin-bottom: clamp(1.1rem, 2.2vw, 2.2rem);
  padding: clamp(1.6rem, 3vw, 3.2rem) clamp(1.35rem, 3.2vw, 3.6rem) clamp(1.75rem, 3.2vw, 3.4rem);
  background: var(--sw-paper);
  color: var(--sw-ink);
  box-shadow: 1rem 1rem 0 rgba(11, 41, 53, .22);
}

.th-p-swimwear .sw-copy-raft::after {
  position: absolute;
  top: 0;
  right: 0;
  width: 28%;
  height: .38rem;
  background: var(--sw-coral);
  content: '';
}

.th-p-swimwear .sw-raft-knot {
  position: absolute;
  top: -1.05rem;
  left: clamp(1.35rem, 3.2vw, 3.6rem);
  width: 2.1rem;
  height: 2.1rem;
  border: .45rem solid var(--sw-paper);
  border-radius: 50%;
  background: var(--sw-sun);
}

.th-p-swimwear .sw-copy {
  position: relative;
}

.th-p-swimwear .sw-copy .eyebrow,
.th-p-swimwear .sw-kicker {
  margin: 0 0 .95rem;
  color: var(--sw-coral);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .62rem;
  font-weight: 800;
  letter-spacing: .19em;
  line-height: 1.3;
  text-transform: uppercase;
}

.th-p-swimwear .sw-copy h1 {
  max-width: 11ch;
  margin: 0;
  color: var(--sw-ink);
  font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
  font-size: clamp(3.7rem, 7vw, 7.4rem);
  font-weight: 400;
  letter-spacing: -.07em;
  line-height: .79;
  overflow-wrap: anywhere;
}

.th-p-swimwear .sw-copy h1.long {
  max-width: 15ch;
  font-size: clamp(3.15rem, 5.5vw, 5.7rem);
  line-height: .86;
}

.th-p-swimwear .sw-copy .sub {
  max-width: 31rem;
  margin: 1.25rem 0 0;
  color: var(--sw-muted);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: clamp(.88rem, 1.1vw, 1rem);
  font-weight: 500;
  line-height: 1.55;
}

.th-p-swimwear .sw-copy .ctas,
.th-p-swimwear .sw-copy .hero-ctas {
  display: flex;
  flex-wrap: wrap;
  gap: .65rem;
  margin-top: 1.55rem;
}

.th-p-swimwear .sw-copy .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  padding: .85rem 1.2rem;
  border: 1px solid var(--sw-ink);
  border-radius: 999px;
  background: var(--sw-ink);
  color: var(--sw-paper);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .63rem;
  font-weight: 800;
  letter-spacing: .13em;
  line-height: 1;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-swimwear .sw-copy .btn.ghost {
  background: transparent;
  color: var(--sw-ink);
}

.th-p-swimwear .sw-copy .btn:hover,
.th-p-swimwear .sw-copy .btn:focus-visible {
  border-color: var(--sw-coral);
  background: var(--sw-coral);
  color: var(--sw-paper);
}

.th-p-swimwear .sw-reflection-media,
.th-p-swimwear .sw-reflection-swatch {
  grid-column: 3;
  grid-row: 2;
  min-height: 100%;
  background: var(--sw-deep);
}

.th-p-swimwear .sw-reflection-media .hero-media {
  filter: saturate(.88) contrast(1.04);
}

.th-p-swimwear .sw-reflection-media::after {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(11, 41, 53, .18), rgba(11, 41, 53, .76));
  content: '';
  pointer-events: none;
}

.th-p-swimwear .sw-reflection-label {
  position: absolute;
  z-index: 1;
  right: .85rem;
  bottom: 1.15rem;
  left: .85rem;
  color: var(--sw-paper);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .58rem;
  font-weight: 800;
  letter-spacing: .18em;
  line-height: 1.4;
  text-transform: uppercase;
  writing-mode: vertical-rl;
}

.th-p-swimwear .sw-reflection-swatch {
  display: grid;
  grid-template-rows: 1.3fr .55fr .9fr;
  gap: .6rem;
  padding: .9rem;
  background: var(--sw-deep);
}

.th-p-swimwear .sw-reflection-swatch span,
.th-p-swimwear .sw-reflection-swatch i,
.th-p-swimwear .sw-reflection-swatch b {
  display: block;
}

.th-p-swimwear .sw-reflection-swatch span {
  border-radius: 999px 999px 0 0;
  background: linear-gradient(155deg, #e8d9bf 0 27%, #c9503d 28% 52%, #f5eedf 53% 100%);
}

.th-p-swimwear .sw-reflection-swatch i {
  border-radius: 50%;
  background: var(--sw-sun);
}

.th-p-swimwear .sw-reflection-swatch b {
  border-radius: 0 0 999px 999px;
  background: repeating-linear-gradient(136deg, #196780 0 3px, #0e4254 3px 11px);
}

.th-p-swimwear .sw-hero-current {
  z-index: 3;
  grid-column: 1;
  grid-row: 2;
  align-self: start;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .9rem;
  min-height: 48px;
  margin: 1.2rem clamp(1.25rem, 3vw, 3.2rem) 0;
  padding: .5rem 0;
  border-top: 1px solid rgba(234, 248, 242, .42);
  border-bottom: 1px solid rgba(234, 248, 242, .42);
  color: var(--sw-paper);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .62rem;
  font-weight: 700;
  letter-spacing: .12em;
  line-height: 1.25;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-swimwear .sw-hero-current b {
  color: var(--sw-sun);
  font-size: 1.15rem;
  line-height: 1;
}

.th-p-swimwear .sw-hero-current:hover,
.th-p-swimwear .sw-hero-current:focus-visible {
  color: var(--sw-sun);
}

.th-p-swimwear .sw-motion-controls {
  position: absolute;
  z-index: 4;
  top: 1rem;
  right: clamp(1rem, 2.2vw, 2rem);
}

.th-p-swimwear .sw-motion-controls .motion-toggle {
  min-height: 44px;
  padding: 0 .85rem;
  border: 1px solid rgba(234, 248, 242, .55);
  border-radius: 999px;
  background: rgba(11, 41, 53, .75);
  color: var(--sw-paper);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .58rem;
  font-weight: 800;
  letter-spacing: .1em;
  text-transform: uppercase;
}

.th-p-swimwear .sw-discovery {
  display: grid;
  grid-template-columns: minmax(15rem, .7fr) minmax(0, 1.7fr);
  gap: clamp(2rem, 5vw, 6rem);
  padding: clamp(4rem, 8vw, 8.3rem) clamp(1.25rem, 6.5vw, 8rem);
  background: var(--sw-sand);
  border-bottom: 1px solid var(--sw-line);
}

.th-p-swimwear .sw-discovery-heading {
  max-width: 24rem;
}

.th-p-swimwear .sw-discovery-heading h2 {
  margin: 0;
  color: var(--sw-ink);
  font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
  font-size: clamp(3rem, 4.6vw, 5.4rem);
  font-weight: 400;
  letter-spacing: -.065em;
  line-height: .83;
  overflow-wrap: anywhere;
}

.th-p-swimwear .sw-discovery-heading h2 em {
  color: var(--sw-coral);
  font-style: italic;
}

.th-p-swimwear .sw-discovery-heading > p:not(.sw-kicker) {
  max-width: 28ch;
  margin: 1.35rem 0 0;
  color: var(--sw-muted);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .92rem;
  font-weight: 500;
  line-height: 1.58;
}

.th-p-swimwear .sw-all-link {
  display: inline-flex;
  align-items: center;
  gap: .6rem;
  min-height: 44px;
  margin-top: 1.75rem;
  border-bottom: 1px solid var(--sw-ink);
  color: var(--sw-ink);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .62rem;
  font-weight: 800;
  letter-spacing: .13em;
  line-height: 1;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-swimwear .sw-all-link span {
  color: var(--sw-coral);
  font-size: 1.2rem;
}

.th-p-swimwear .sw-current-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  align-self: stretch;
  background: var(--sw-line);
  border: 1px solid var(--sw-line);
}

.th-p-swimwear .sw-current-card {
  position: relative;
  display: grid;
  grid-template-columns: 2.7rem minmax(0, 1fr) auto;
  grid-template-rows: minmax(8rem, 1fr) auto;
  gap: .85rem;
  min-width: 0;
  min-height: 14.5rem;
  padding: .9rem;
  background: var(--sw-paper);
  color: var(--sw-ink);
  text-decoration: none;
}

.th-p-swimwear .sw-current-number {
  grid-column: 1;
  grid-row: 1;
  align-self: start;
  color: var(--sw-coral);
  font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
  font-size: 1.45rem;
  line-height: 1;
}

.th-p-swimwear .sw-current-visual {
  position: relative;
  grid-column: 2 / 4;
  grid-row: 1;
  display: block;
  min-height: 8.5rem;
  overflow: hidden;
  background: #dce9dd;
}

.th-p-swimwear .sw-current-visual img,
.th-p-swimwear .sw-category-fallback {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.th-p-swimwear .sw-category-fallback-1 {
  background: linear-gradient(145deg, #2e9db2 0 48%, #f1d6ae 48% 66%, #c9503d 66% 100%);
}

.th-p-swimwear .sw-category-fallback-2 {
  background: radial-gradient(circle at 62% 38%, #e6c969 0 16%, transparent 16.5%), linear-gradient(125deg, #1c5f72, #62b8bd 58%, #f5eedf 58%);
}

.th-p-swimwear .sw-category-fallback-3 {
  background: linear-gradient(154deg, #f5eedf 0 29%, #c9503d 29% 55%, #163f50 55% 100%);
}

.th-p-swimwear .sw-category-fallback-4 {
  background: repeating-linear-gradient(136deg, #0d4053 0 10px, #27869a 10px 18px, #f5eedf 18px 24px);
}

.th-p-swimwear .sw-current-copy {
  grid-column: 1 / 3;
  grid-row: 2;
  display: flex;
  flex-direction: column;
  gap: .28rem;
  min-width: 0;
}

.th-p-swimwear .sw-current-copy b {
  font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
  font-size: clamp(1.25rem, 1.8vw, 1.7rem);
  font-weight: 400;
  letter-spacing: -.035em;
  line-height: .95;
  overflow-wrap: anywhere;
}

.th-p-swimwear .sw-current-copy small {
  color: var(--sw-muted);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .57rem;
  font-weight: 800;
  letter-spacing: .09em;
  line-height: 1.35;
  text-transform: uppercase;
}

.th-p-swimwear .sw-current-arrow {
  grid-column: 3;
  grid-row: 2;
  align-self: end;
  color: var(--sw-coral);
  font-size: 1.3rem;
  line-height: 1;
}

.th-p-swimwear .sw-current-card:hover .sw-current-visual,
.th-p-swimwear .sw-current-card:focus-visible .sw-current-visual {
  outline: 2px solid var(--sw-coral);
  outline-offset: 4px;
}

.th-p-swimwear .sw-product-discovery {
  align-items: center;
}

.th-p-swimwear .sw-product-notes {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(.8rem, 1.6vw, 1.4rem);
}

.th-p-swimwear .sw-product-notes .product-card {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--sw-line);
  border-radius: 0;
  background: var(--sw-paper);
  box-shadow: none;
}

.th-p-swimwear .sw-product-notes .product-card img {
  aspect-ratio: 4 / 5;
  border-radius: 0;
  object-fit: cover;
}

.th-p-swimwear #shop,
.th-p-swimwear .shop-section {
  padding: clamp(4rem, 7vw, 7rem) clamp(1.25rem, 6.5vw, 8rem);
  background: var(--sw-paper);
}

.th-p-swimwear #shop .section-title,
.th-p-swimwear #shop > h2,
.th-p-swimwear .shop-section > h2 {
  max-width: 12ch;
  color: var(--sw-ink);
  font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
  font-size: clamp(3rem, 4.5vw, 5.5rem);
  font-weight: 400;
  letter-spacing: -.06em;
  line-height: .84;
  overflow-wrap: anywhere;
}

.th-p-swimwear .product-grid {
  gap: clamp(1rem, 2vw, 2rem);
}

.th-p-swimwear #shop .product-card,
.th-p-swimwear .shop-section .product-card {
  overflow: hidden;
  border-color: var(--sw-line);
  border-radius: 0;
  background: var(--sw-paper);
  box-shadow: none;
}

.th-p-swimwear #shop .product-card img,
.th-p-swimwear .shop-section .product-card img {
  border-radius: 0;
}

.th-p-swimwear .sw-copy .btn:focus-visible,
.th-p-swimwear .sw-hero-current:focus-visible,
.th-p-swimwear .sw-all-link:focus-visible,
.th-p-swimwear .sw-current-card:focus-visible {
  outline: 3px solid var(--sw-sun);
  outline-offset: 4px;
}

@media (max-width: 980px) {
  .th-p-swimwear .sw-hero-stage {
    grid-template-columns: minmax(13.5rem, .58fr) minmax(0, 1.42fr) minmax(9rem, .38fr);
  }

  .th-p-swimwear .sw-copy-raft {
    width: min(37rem, 84%);
  }

  .th-p-swimwear .sw-copy h1 {
    font-size: clamp(3.45rem, 7.6vw, 5.85rem);
  }

  .th-p-swimwear .sw-discovery {
    grid-template-columns: minmax(13rem, .58fr) minmax(0, 1.42fr);
    gap: 2.5rem;
  }

  .th-p-swimwear .sw-current-card {
    grid-template-columns: 2.25rem minmax(0, 1fr) auto;
    padding: .75rem;
  }

  .th-p-swimwear .sw-product-notes {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .th-p-swimwear .sw-hero-stage {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: 3.7rem minmax(28rem, 1fr) auto;
    min-height: 0;
    overflow: visible;
  }

  .th-p-swimwear .sw-hero-stage::before {
    background: var(--sw-aqua);
  }

  .th-p-swimwear .sw-hero-legend {
    grid-column: 1;
    grid-row: 1;
    padding: 1rem 1.15rem;
  }

  .th-p-swimwear .sw-primary-media {
    grid-column: 1;
    grid-row: 2;
    min-height: min(132vw, 35rem);
  }

  .th-p-swimwear .sw-primary-media .hero-media {
    object-position: 63% center;
  }

  .th-p-swimwear .sw-primary-media figcaption {
    right: 1rem;
    bottom: 1rem;
  }

  .th-p-swimwear .sw-copy-raft {
    grid-column: 1;
    grid-row: 3;
    width: calc(100% - 2.3rem);
    margin: -4.8rem 0 1.15rem 1.15rem;
    padding: 1.75rem 1.25rem 1.55rem;
    box-shadow: .55rem .55rem 0 rgba(11, 41, 53, .22);
  }

  .th-p-swimwear .sw-copy h1 {
    max-width: 12ch;
    font-size: clamp(3.3rem, 14vw, 5rem);
  }

  .th-p-swimwear .sw-copy h1.long {
    font-size: clamp(2.7rem, 10vw, 4rem);
  }

  .th-p-swimwear .sw-copy .sub {
    max-width: 34rem;
    margin-top: 1rem;
  }

  .th-p-swimwear .sw-copy .ctas,
  .th-p-swimwear .sw-copy .hero-ctas {
    margin-top: 1.25rem;
  }

  .th-p-swimwear .sw-copy .btn {
    flex: 1 1 9rem;
    padding-right: .85rem;
    padding-left: .85rem;
  }

  .th-p-swimwear .sw-reflection-media,
  .th-p-swimwear .sw-reflection-swatch {
    display: none;
  }

  .th-p-swimwear .sw-hero-current {
    z-index: 3;
    grid-column: 1;
    grid-row: 2;
    align-self: start;
    width: auto;
    margin: 1rem 1.15rem 0;
  }

  .th-p-swimwear .sw-motion-controls {
    top: 4.1rem;
    right: 1rem;
  }

  .th-p-swimwear .sw-discovery {
    display: block;
    padding: 4rem 1.15rem;
  }

  .th-p-swimwear .sw-discovery-heading {
    max-width: 31rem;
  }

  .th-p-swimwear .sw-discovery-heading h2 {
    font-size: clamp(3rem, 13vw, 4.8rem);
  }

  .th-p-swimwear .sw-discovery-heading > p:not(.sw-kicker) {
    max-width: 34ch;
  }

  .th-p-swimwear .sw-current-list,
  .th-p-swimwear .sw-product-notes {
    margin-top: 2.35rem;
  }

  .th-p-swimwear .sw-current-card {
    min-height: 12rem;
  }
}

@media (max-width: 430px) {
  .th-p-swimwear .sw-hero-legend {
    gap: .45rem;
    font-size: .54rem;
    letter-spacing: .16em;
  }

  .th-p-swimwear .sw-hero-legend i {
    width: .24rem;
    height: .24rem;
  }

  .th-p-swimwear .sw-primary-media {
    min-height: min(136vw, 33rem);
  }

  .th-p-swimwear .sw-copy-raft {
    width: calc(100% - 2rem);
    margin-left: 1rem;
    padding-right: 1.05rem;
    padding-left: 1.05rem;
  }

  .th-p-swimwear .sw-copy h1 {
    font-size: clamp(3rem, 14.2vw, 4.55rem);
  }

  .th-p-swimwear .sw-copy .btn {
    flex-basis: 100%;
  }

  .th-p-swimwear .sw-hero-current {
    margin-right: 1rem;
    margin-left: 1rem;
  }

  .th-p-swimwear .sw-discovery {
    padding-right: 1rem;
    padding-left: 1rem;
  }

  .th-p-swimwear .sw-current-list {
    grid-template-columns: 1fr;
  }

  .th-p-swimwear .sw-current-card {
    grid-template-rows: minmax(7.2rem, 1fr) auto;
    min-height: 11.1rem;
  }

  .th-p-swimwear .sw-current-visual {
    min-height: 7.2rem;
  }

  .th-p-swimwear .sw-product-notes {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: .75rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .th-p-swimwear .sw-media-frame .hero-media {
    transform: none !important;
  }
}
`;

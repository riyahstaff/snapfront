import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-sneakers',
  name: 'STRIDEFORM',
  for: 'Momentum-minded runners',
  vibe: 'Trackside precision with an acid-lime surge',
  category: 'Performance sneakers / running footwear',
  group: 'fashion',
  display: 'Archivo Black',
  body: 'IBM Plex Mono',
  displayWeight: 400,
  tracking: '-.055em',
  colors: {
    bg: '#F1F0EA',
    surface: '#FFFFFF',
    ink: '#0B0C0A',
    muted: '#65645E',
    line: '#D5D3C9',
    accent: '#C9F53B',
    onAccent: '#0B0C0A',
    panel: '#B14432',
    onPanel: '#FFFFFF',
    foot: '#10110F',
    onFoot: '#F6F6EF',
    bar: '#EFEEE7',
    onBar: '#0B0C0A',
    badge: '#C9F53B',
    onBadge: '#0B0C0A',
  },
  header: 'split',
  hero: 'type',
  card: 'bold',
  ratio: '4/5',
  rCard: 0,
  rBtn: 0,
  motion: 'pan',
  copy: {
    eyebrow: 'Performance footwear',
    collection: 'Fast ground / live selection',
    cta: 'Shop performance',
    title: 'Find your fast ground.',
    subtitle: 'A sharper stride starts with the ground ahead.',
  },
  collection: 'premium',
  family: 'sneakers',
  demoPhoto: '/assets/themes/sneakers-hero.webp',
});

export function hero(ctx) {
  return `
    <section class="hero category-hero sneakers-hero${ctx.heroClass}"${ctx.heroAttrs}>
      <div class="sneakers-hero__word" aria-hidden="true">GROUND</div>
      <div class="sneakers-hero__media">
        ${ctx.media(0, { priority: true, lazy: false, decorative: false })}
      </div>
      <div class="sneakers-hero__wash" aria-hidden="true"></div>
      <div class="sneakers-hero__copy-wrap">
        ${ctx.copy('sneakers-hero__copy')}
      </div>
      ${ctx.controls}
    </section>
  `;
}

export function discovery(ctx) {
  const categories = (Array.isArray(ctx.cats) ? ctx.cats : [])
    .filter((category) => category && category.name)
    .slice(0, 3);
  const products = Array.isArray(ctx.products) ? ctx.products : [];
  const safe = (value) => ctx.esc(String(value ?? ''));

  if (categories.length >= 2) {
    const lanes = categories.map((category, index) => {
      const count = Number.isFinite(Number(category.count)) ? Number(category.count) : 0;
      const countLabel = `${count} ${count === 1 ? 'item' : 'items'}`;
      const laneNumber = String(index + 1).padStart(2, '0');

      return `
        <a class="sneakers-lane" href="${ctx.categoryLink(category.name)}">
          <span class="sneakers-lane__number">${laneNumber}</span>
          <span class="sneakers-lane__name">${safe(category.name)}</span>
          <span class="sneakers-lane__count">${safe(countLabel)}</span>
          <span class="sneakers-lane__arrow" aria-hidden="true">→</span>
        </a>
      `;
    }).join('');

    return `
      <section class="sneakers-discovery" aria-labelledby="sneakers-discovery-title">
        <div class="sneakers-discovery__intro">
          <p class="eyebrow">Choose your running ground</p>
          <h2 id="sneakers-discovery-title">Every route starts with a surface.</h2>
          <p class="sneakers-discovery__note">Browse the live collection by the categories available in this store.</p>
        </div>
        <div class="sneakers-lanes">
          ${lanes}
        </div>
      </section>
    `;
  }

  if (!products.length) return '';

  const cards = products.slice(0, 2).map((product) => ctx.productCard(product)).join('');
  return `
    <section class="sneakers-discovery sneakers-discovery--compact" aria-labelledby="sneakers-discovery-title">
      <div class="sneakers-discovery__intro">
        <p class="eyebrow">Current selection</p>
        <h2 id="sneakers-discovery-title">Move into the live collection.</h2>
        <p class="sneakers-discovery__note">A focused edit from the products currently available in this store.</p>
      </div>
      <div class="sneakers-discovery__products">
        ${cards}
      </div>
    </section>
  `;
}

export const css = `
.th-p-sneakers {
  --sneakers-ink: #0B0C0A;
  --sneakers-bone: #F1F0EA;
  --sneakers-paper: #FFFFFF;
  --sneakers-line: #D5D3C9;
  --sneakers-muted: #65645E;
  --sneakers-red: #B14432;
  --sneakers-lime: #C9F53B;
  background: var(--sneakers-bone);
  color: var(--sneakers-ink);
  overflow-x: clip;
}

.th-p-sneakers > header,
.th-p-sneakers .site-header,
.th-p-sneakers .store-header {
  background: rgba(241, 240, 234, .96);
  border-bottom: 1px solid var(--sneakers-line);
}

.th-p-sneakers .sneakers-hero {
  position: relative;
  isolation: isolate;
  display: grid;
  grid-template-columns: minmax(1.25rem, 1fr) minmax(0, 88rem) minmax(1.25rem, 1fr);
  align-items: end;
  min-height: clamp(38rem, 52vw, 53rem);
  overflow: hidden;
  background: var(--sneakers-bone);
}

.th-p-sneakers .sneakers-hero__word {
  position: absolute;
  z-index: 0;
  top: -.18em;
  left: 50%;
  width: max-content;
  margin: 0;
  color: var(--sneakers-ink);
  font-family: 'Archivo Black', sans-serif;
  font-size: clamp(9.25rem, 22.1vw, 25.5rem);
  font-weight: 400;
  letter-spacing: -.09em;
  line-height: .77;
  pointer-events: none;
  transform: translateX(-53%);
  white-space: nowrap;
}

.th-p-sneakers .sneakers-hero__media {
  position: absolute;
  z-index: 1;
  top: clamp(7.35rem, 11vw, 10.7rem);
  right: 0;
  bottom: 0;
  left: 0;
  overflow: hidden;
  background:
    linear-gradient(110deg, #D8D6CC 0%, #EFEEE7 41%, #B14432 42%, #6F251A 100%);
}

.th-p-sneakers .sneakers-hero__media .hero-media,
.th-p-sneakers .sneakers-hero__media .theme-empty-media {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.th-p-sneakers .sneakers-hero__media .theme-empty-media {
  min-height: 100%;
  background:
    linear-gradient(120deg, rgba(241, 240, 234, .96) 0 42%, rgba(241, 240, 234, .3) 55%, transparent 69%),
    repeating-linear-gradient(169deg, #9D3A2B 0 9px, #BA5843 9px 18px, #F1F0EA 18px 21px);
}

.th-p-sneakers .sneakers-hero__wash {
  position: absolute;
  z-index: 2;
  top: clamp(7.35rem, 11vw, 10.7rem);
  right: 0;
  bottom: 0;
  left: 0;
  pointer-events: none;
  background: linear-gradient(90deg, rgba(241, 240, 234, .98) 0%, rgba(241, 240, 234, .88) 22%, rgba(241, 240, 234, .24) 45%, rgba(11, 12, 10, .08) 100%);
}

.th-p-sneakers .sneakers-hero__copy-wrap {
  position: relative;
  z-index: 3;
  grid-column: 2;
  width: min(100%, 29rem);
  padding: clamp(1.75rem, 3.9vw, 4.25rem) 0 clamp(2rem, 5.6vw, 5.6rem);
}

.th-p-sneakers .sneakers-hero__copy {
  max-width: 100%;
}

.th-p-sneakers .sneakers-hero__copy .eyebrow,
.th-p-sneakers .sneakers-discovery .eyebrow {
  margin: 0 0 .9rem;
  color: var(--sneakers-ink);
  font-family: 'IBM Plex Mono', monospace;
  font-size: .68rem;
  font-weight: 700;
  letter-spacing: .15em;
  line-height: 1.35;
  text-transform: uppercase;
}

.th-p-sneakers .sneakers-hero__copy h1 {
  max-width: 11ch;
  margin: 0;
  color: var(--sneakers-ink);
  font-family: 'Archivo Black', sans-serif;
  font-size: clamp(3.2rem, 5.6vw, 6.35rem);
  font-weight: 400;
  letter-spacing: -.065em;
  line-height: .88;
  overflow-wrap: anywhere;
}

.th-p-sneakers .sneakers-hero__copy .sub {
  max-width: 31ch;
  margin: 1.25rem 0 0;
  color: var(--sneakers-ink);
  font-family: 'IBM Plex Mono', monospace;
  font-size: clamp(.78rem, 1vw, .95rem);
  line-height: 1.55;
  overflow-wrap: anywhere;
}

.th-p-sneakers .sneakers-hero__copy a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 3rem;
  margin-top: 1.5rem;
  padding: .72rem 1.05rem;
  color: var(--sneakers-ink);
  background: var(--sneakers-lime);
  border: 1px solid var(--sneakers-ink);
  font-family: 'IBM Plex Mono', monospace;
  font-size: .7rem;
  font-weight: 700;
  letter-spacing: .08em;
  line-height: 1.1;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-sneakers .sneakers-hero__copy a:hover,
.th-p-sneakers .sneakers-hero__copy a:focus-visible {
  color: var(--sneakers-lime);
  background: var(--sneakers-ink);
}

.th-p-sneakers .sneakers-hero button {
  min-width: 3rem;
  min-height: 3rem;
  border-radius: 0;
}

.th-p-sneakers .sneakers-discovery {
  display: grid;
  grid-template-columns: minmax(16rem, .88fr) minmax(0, 1.72fr);
  gap: clamp(1.5rem, 4vw, 5.25rem);
  align-items: stretch;
  padding: clamp(2.75rem, 6vw, 6.5rem) clamp(1.25rem, 5vw, 6rem);
  background: var(--sneakers-paper);
  border-top: 1px solid var(--sneakers-ink);
  border-bottom: 1px solid var(--sneakers-ink);
}

.th-p-sneakers .sneakers-discovery__intro {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
}

.th-p-sneakers .sneakers-discovery__intro h2 {
  max-width: 11ch;
  margin: 0;
  color: var(--sneakers-ink);
  font-family: 'Archivo Black', sans-serif;
  font-size: clamp(2.2rem, 4.1vw, 4.8rem);
  font-weight: 400;
  letter-spacing: -.06em;
  line-height: .91;
  overflow-wrap: anywhere;
}

.th-p-sneakers .sneakers-discovery__note {
  max-width: 31ch;
  margin: 1.4rem 0 0;
  color: var(--sneakers-muted);
  font-family: 'IBM Plex Mono', monospace;
  font-size: .74rem;
  line-height: 1.6;
}

.th-p-sneakers .sneakers-lanes {
  display: grid;
  min-width: 0;
  border-top: 1px solid var(--sneakers-ink);
}

.th-p-sneakers .sneakers-lane {
  position: relative;
  display: grid;
  grid-template-columns: minmax(3rem, .48fr) minmax(0, 1.45fr) minmax(4.5rem, .68fr) 2.75rem;
  gap: .75rem;
  align-items: center;
  min-height: 7.6rem;
  padding: 1.1rem clamp(.85rem, 2.3vw, 1.65rem);
  color: var(--sneakers-paper);
  background: var(--sneakers-red);
  border-bottom: 1px solid var(--sneakers-ink);
  font-family: 'IBM Plex Mono', monospace;
  text-decoration: none;
}

.th-p-sneakers .sneakers-lane:nth-child(2) {
  color: var(--sneakers-ink);
  background: var(--sneakers-lime);
}

.th-p-sneakers .sneakers-lane:nth-child(3) {
  color: var(--sneakers-paper);
  background:
    repeating-linear-gradient(132deg, #151613 0 8px, #282A25 8px 16px, #C9F53B 16px 18px);
}

.th-p-sneakers .sneakers-lane:hover,
.th-p-sneakers .sneakers-lane:focus-visible {
  z-index: 1;
  outline: 3px solid var(--sneakers-ink);
  outline-offset: -3px;
  filter: contrast(1.06);
}

.th-p-sneakers .sneakers-lane__number {
  font-family: 'Archivo Black', sans-serif;
  font-size: clamp(2.25rem, 4vw, 4.6rem);
  letter-spacing: -.06em;
  line-height: .8;
}

.th-p-sneakers .sneakers-lane__name {
  min-width: 0;
  font-size: clamp(.96rem, 1.55vw, 1.45rem);
  font-weight: 700;
  letter-spacing: .02em;
  line-height: 1.05;
  overflow-wrap: anywhere;
  text-transform: uppercase;
}

.th-p-sneakers .sneakers-lane__count {
  font-size: .66rem;
  font-weight: 700;
  letter-spacing: .08em;
  line-height: 1.35;
  text-transform: uppercase;
}

.th-p-sneakers .sneakers-lane__arrow {
  justify-self: end;
  font-size: 1.75rem;
  line-height: 1;
}

.th-p-sneakers .sneakers-discovery--compact {
  grid-template-columns: minmax(15rem, .72fr) minmax(0, 1.28fr);
}

.th-p-sneakers .sneakers-discovery__products {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  align-self: start;
  background: var(--sneakers-ink);
  border: 1px solid var(--sneakers-ink);
}

.th-p-sneakers .sneakers-discovery__products > * {
  min-width: 0;
  background: var(--sneakers-paper);
}

.th-p-sneakers #shop {
  padding-top: clamp(3.25rem, 7vw, 7.5rem);
  background: var(--sneakers-bone);
}

.th-p-sneakers #shop h2 {
  font-family: 'Archivo Black', sans-serif;
  font-weight: 400;
  letter-spacing: -.05em;
}

.th-p-sneakers #shop .product-card {
  border-radius: 0;
}

.th-p-sneakers #shop .product-card a:focus-visible,
.th-p-sneakers .sneakers-discovery__products a:focus-visible {
  outline: 3px solid var(--sneakers-ink);
  outline-offset: 3px;
}

@media (max-width: 760px) {
  .th-p-sneakers .sneakers-hero {
    grid-template-columns: minmax(1rem, 1fr) minmax(0, 1fr) minmax(1rem, 1fr);
    min-height: 42rem;
  }

  .th-p-sneakers .sneakers-hero__word {
    top: -.05em;
    font-size: clamp(6.5rem, 27vw, 10.5rem);
    transform: translateX(-51%);
  }

  .th-p-sneakers .sneakers-hero__media,
  .th-p-sneakers .sneakers-hero__wash {
    top: 7.4rem;
  }

  .th-p-sneakers .sneakers-hero__wash {
    background: linear-gradient(180deg, rgba(241, 240, 234, .42) 0%, rgba(241, 240, 234, .08) 27%, rgba(241, 240, 234, .96) 65%, var(--sneakers-bone) 100%);
  }

  .th-p-sneakers .sneakers-hero__copy-wrap {
    grid-column: 2;
    width: 100%;
    padding: 13.25rem 0 2rem;
  }

  .th-p-sneakers .sneakers-hero__copy h1 {
    max-width: 10ch;
    font-size: clamp(3rem, 13vw, 4.6rem);
  }

  .th-p-sneakers .sneakers-hero__copy .sub {
    max-width: 34ch;
  }

  .th-p-sneakers .sneakers-discovery,
  .th-p-sneakers .sneakers-discovery--compact {
    grid-template-columns: 1fr;
    gap: 2.25rem;
    padding: 3.25rem 1rem;
  }

  .th-p-sneakers .sneakers-discovery__intro h2 {
    max-width: 13ch;
  }

  .th-p-sneakers .sneakers-lane {
    grid-template-columns: 3.25rem minmax(0, 1fr) 2.75rem;
    min-height: 5.75rem;
    gap: .55rem;
  }

  .th-p-sneakers .sneakers-lane__number {
    font-size: 2.7rem;
  }

  .th-p-sneakers .sneakers-lane__count {
    grid-column: 2;
    margin-top: -.35rem;
  }

  .th-p-sneakers .sneakers-lane__arrow {
    grid-column: 3;
    grid-row: 1 / span 2;
  }

  .th-p-sneakers .sneakers-discovery__products {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 390px) {
  .th-p-sneakers .sneakers-hero {
    min-height: 43.5rem;
  }

  .th-p-sneakers .sneakers-hero__copy-wrap {
    padding-top: 12.5rem;
  }

  .th-p-sneakers .sneakers-lane {
    grid-template-columns: 2.8rem minmax(0, 1fr) 2.25rem;
    padding-right: .75rem;
    padding-left: .75rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .th-p-sneakers .sneakers-hero .hero-media {
    animation: none !important;
    transform: none !important;
  }
}
`;

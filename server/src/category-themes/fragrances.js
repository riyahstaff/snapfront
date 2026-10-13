import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-fragrances',
  name: 'RUNE & RESIN',
  for: 'fragrance collectors who browse by atmosphere and afterimage',
  vibe: 'a low-lit perfume archive, smoked glass, citrus peel, and lacquered midnight',
  category: 'Fragrance and perfumery',
  group: 'beauty',
  display: 'Bodoni Moda',
  body: 'Manrope',
  displayWeight: 500,
  tracking: '-.045em',
  colors: {
    bg: '#F5F0E7',
    surface: '#FFF9F0',
    ink: '#24151D',
    muted: '#77666B',
    line: '#D7C7C1',
    accent: '#7C2949',
    onAccent: '#FFF8F1',
    panel: '#2B1723',
    onPanel: '#F9EBDD',
    foot: '#190E16',
    onFoot: '#F7EADA',
    bar: '#EEE2D9',
    onBar: '#28151E',
    badge: '#E8C68D',
    onBadge: '#301822'
  },
  header: 'stack',
  hero: 'editorial',
  card: 'boxed',
  ratio: '4/5',
  rCard: 0,
  rBtn: 999,
  motion: 'pan',
  copy: {
    eyebrow: 'The olfactive index',
    collection: 'Browse by atmosphere',
    cta: 'Enter the collection',
    title: 'Leave a longer trace.',
    subtitle: 'A close edit of scents for the spaces between arrival and memory.'
  }
});

const itemCount = (value) => {
  const count = Number(value) || 0;
  return `${count} ${count === 1 ? 'piece' : 'pieces'}`;
};

const entryNumber = (index) => String(index + 1).padStart(2, '0');

export function hero(ctx) {
  return `
    <section class="hero category-hero fragrances-index-hero${ctx.heroClass}"${ctx.heroAttrs}>
      <div class="fragrances-hero-media">
        ${ctx.media(0, { priority: true, lazy: false, decorative: false })}
      </div>
      <div class="fragrances-hero-ink" aria-hidden="true"></div>
      <div class="fragrances-hero-score" aria-hidden="true">
        <span></span><span></span><span></span>
      </div>
      <p class="fragrances-hero-serial" aria-hidden="true"><span>01</span> / Scent in three measures</p>
      <div class="fragrances-hero-copy-panel">
        ${ctx.copy('fragrances-hero-copy')}
      </div>
      <div class="fragrances-hero-afterimage" aria-hidden="true">
        <span>open</span><span>rest</span><span>remain</span>
      </div>
      <p class="fragrances-hero-caption" aria-hidden="true">A study in what lingers.</p>
      ${ctx.controls}
    </section>
  `;
}

export function discovery(ctx) {
  const categories = (ctx.cats || []).filter((category) => category && category.name).slice(0, 5);
  const products = (ctx.products || []).slice(0, 3);

  if (categories.length >= 2) {
    return `
      <section class="fragrances-discovery fragrances-ledger" aria-labelledby="fragrances-ledger-title">
        <div class="fragrances-ledger-intro">
          <p class="fragrances-kicker">${ctx.esc(ctx.t.copy.collection)}</p>
          <h2 id="fragrances-ledger-title">Follow the note<br>that stays with you.</h2>
          <p>Each open collection is an invitation to choose the atmosphere you want to carry.</p>
        </div>
        <ol class="fragrances-ledger-list">
          ${categories.map((category, index) => `
            <li>
              <a class="fragrances-ledger-entry" href="${ctx.categoryLink(category.name)}">
                <span class="fragrances-ledger-number">${entryNumber(index)}</span>
                <span class="fragrances-ledger-trace" aria-hidden="true"><i></i></span>
                <span class="fragrances-ledger-name">${ctx.esc(category.name)}</span>
                <span class="fragrances-ledger-count">${ctx.esc(itemCount(category.count))}</span>
                <span class="fragrances-ledger-arrow" aria-hidden="true">↗</span>
              </a>
            </li>
          `).join('')}
        </ol>
      </section>
    `;
  }

  if (products.length) {
    return `
      <section class="fragrances-discovery fragrances-current-edit" aria-labelledby="fragrances-current-edit-title">
        <div class="fragrances-current-edit-intro">
          <p class="fragrances-kicker">The current edit</p>
          <h2 id="fragrances-current-edit-title">Begin with the bottles in the room.</h2>
        </div>
        <div class="fragrances-current-edit-grid">
          ${products.map((product) => ctx.productCard(product)).join('')}
        </div>
      </section>
    `;
  }

  return '';
}

export const css = `
.th-p-fragrances {
  --fragrances-paper: #f5f0e7;
  --fragrances-cream: #fff9f0;
  --fragrances-ink: #24151d;
  --fragrances-wine: #7c2949;
  --fragrances-blush: #dcbeb7;
  --fragrances-peel: #e8c68d;
  --fragrances-line: #d7c7c1;
  --fragrances-muted: #77666b;
  --fragrances-night: #2b1723;
  --fragrances-void: #190e16;
  background: var(--fragrances-paper);
  color: var(--fragrances-ink);
  overflow-x: clip;
}

.th-p-fragrances .category-hero.fragrances-index-hero {
  position: relative;
  isolation: isolate;
  min-height: clamp(39rem, 56vw, 52rem);
  overflow: hidden;
  background: var(--fragrances-void);
  color: #fff8ef;
}

.th-p-fragrances .fragrances-hero-media {
  position: absolute;
  inset: 0;
  z-index: -4;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 72% 50%, rgba(156, 86, 68, .5) 0 9%, transparent 30%),
    linear-gradient(122deg, #210d18 0%, #4a1d2b 49%, #160b12 100%);
}

.th-p-fragrances .fragrances-hero-media .hero-media,
.th-p-fragrances .fragrances-hero-media .theme-empty-media {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
  object-fit: cover;
  object-position: 62% center;
}

.th-p-fragrances .fragrances-hero-media .theme-empty-media {
  background:
    radial-gradient(ellipse at 73% 50%, rgba(238, 190, 100, .9) 0 4%, rgba(114, 37, 57, .74) 4.5% 15%, transparent 33%),
    radial-gradient(circle at 56% 68%, rgba(255, 243, 206, .5) 0 3%, transparent 3.5%),
    linear-gradient(120deg, #210d18 0%, #522033 56%, #170b14 100%);
}

.th-p-fragrances .fragrances-hero-ink {
  position: absolute;
  inset: 0;
  z-index: -3;
  pointer-events: none;
  background:
    linear-gradient(90deg, rgba(20, 8, 15, .92) 0%, rgba(26, 9, 18, .72) 25%, rgba(31, 10, 21, .15) 60%, rgba(19, 8, 15, .3) 100%),
    linear-gradient(0deg, rgba(14, 5, 11, .61) 0%, transparent 38%, rgba(13, 4, 10, .08) 100%);
}

.th-p-fragrances .fragrances-hero-score {
  position: absolute;
  inset: clamp(5.5rem, 8.2vw, 8rem) clamp(1.25rem, 4.8vw, 5.6rem) clamp(3rem, 5vw, 4.75rem);
  z-index: -1;
  display: grid;
  grid-template-rows: 1fr 1fr 1fr;
  pointer-events: none;
}

.th-p-fragrances .fragrances-hero-score span {
  border-top: 1px solid rgba(255, 241, 226, .23);
}

.th-p-fragrances .fragrances-hero-score span:last-child {
  border-bottom: 1px solid rgba(255, 241, 226, .23);
}

.th-p-fragrances .fragrances-hero-serial {
  position: absolute;
  top: clamp(5.5rem, 8.2vw, 8rem);
  right: clamp(1.25rem, 4.8vw, 5.6rem);
  z-index: 2;
  display: flex;
  align-items: center;
  gap: .65rem;
  margin: 0;
  color: rgba(255, 238, 220, .78);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .61rem;
  font-weight: 700;
  letter-spacing: .17em;
  line-height: 1.4;
  text-transform: uppercase;
}

.th-p-fragrances .fragrances-hero-serial span {
  color: var(--fragrances-peel);
}

.th-p-fragrances .fragrances-hero-copy-panel {
  display: flex;
  min-height: clamp(39rem, 56vw, 52rem);
  padding: clamp(10.5rem, 18vw, 14.8rem) clamp(1.25rem, 5.2vw, 6rem) clamp(4.5rem, 7vw, 6.8rem);
  align-items: center;
}

.th-p-fragrances .fragrances-hero-copy {
  position: relative;
  z-index: 1;
  max-width: min(39rem, 59vw);
}

.th-p-fragrances .fragrances-hero-copy .eyebrow,
.th-p-fragrances .fragrances-kicker {
  margin: 0 0 1rem;
  color: var(--fragrances-peel);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .63rem;
  font-weight: 800;
  letter-spacing: .22em;
  line-height: 1.4;
  text-transform: uppercase;
}

.th-p-fragrances .fragrances-hero-copy h1 {
  max-width: 9.5ch;
  margin: 0;
  color: #fff8ef;
  font-family: var(--font-display, 'Bodoni Moda', Georgia, serif);
  font-size: clamp(4.3rem, 8vw, 8.9rem);
  font-weight: 500;
  letter-spacing: -.07em;
  line-height: .78;
  overflow-wrap: anywhere;
  text-wrap: balance;
}

.th-p-fragrances .fragrances-hero-copy h1.long {
  max-width: 12.2ch;
  font-size: clamp(3.55rem, 6.2vw, 7rem);
  line-height: .86;
}

.th-p-fragrances .fragrances-hero-copy .sub {
  max-width: 31rem;
  margin: 1.65rem 0 0;
  color: rgba(255, 241, 227, .82);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: clamp(.84rem, 1.1vw, 1rem);
  font-weight: 500;
  letter-spacing: .025em;
  line-height: 1.66;
}

.th-p-fragrances .fragrances-hero-copy .ctas {
  display: flex;
  flex-wrap: wrap;
  gap: .75rem;
  margin-top: 2rem;
}

.th-p-fragrances .fragrances-hero-copy .ctas a {
  display: inline-flex;
  min-width: 11.5rem;
  min-height: 3rem;
  padding: .75rem 1.3rem;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 248, 239, .84);
  border-radius: 999px;
  background: #fff8ef;
  color: #31101f;
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .66rem;
  font-weight: 800;
  letter-spacing: .13em;
  line-height: 1.2;
  text-align: center;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-fragrances .fragrances-hero-copy .ctas a:hover,
.th-p-fragrances .fragrances-hero-copy .ctas a:focus-visible {
  border-color: var(--fragrances-peel);
  background: var(--fragrances-peel);
  color: #2e1320;
  outline: none;
}

.th-p-fragrances .fragrances-hero-afterimage {
  position: absolute;
  right: clamp(1.25rem, 4.8vw, 5.6rem);
  bottom: clamp(4.5rem, 7vw, 6.8rem);
  z-index: 2;
  display: grid;
  gap: .45rem;
  width: min(12rem, 20vw);
  pointer-events: none;
}

.th-p-fragrances .fragrances-hero-afterimage span {
  display: flex;
  min-height: 1.6rem;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 237, 216, .48);
  color: rgba(255, 244, 229, .83);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .6rem;
  font-weight: 700;
  letter-spacing: .19em;
  line-height: 1.2;
  text-transform: uppercase;
}

.th-p-fragrances .fragrances-hero-afterimage span::after {
  color: var(--fragrances-peel);
  content: '—';
}

.th-p-fragrances .fragrances-hero-caption {
  position: absolute;
  bottom: clamp(1.45rem, 2.5vw, 2.5rem);
  left: clamp(1.25rem, 5.2vw, 6rem);
  z-index: 2;
  margin: 0;
  color: rgba(255, 244, 229, .61);
  font-family: var(--font-display, 'Bodoni Moda', Georgia, serif);
  font-size: clamp(.9rem, 1.15vw, 1.1rem);
  font-style: italic;
  letter-spacing: -.01em;
  line-height: 1.2;
}

.th-p-fragrances .fragrances-index-hero .hero-motion-controls,
.th-p-fragrances .fragrances-index-hero .hero-controls,
.th-p-fragrances .fragrances-index-hero .motion-toggle {
  position: absolute;
  right: clamp(1.25rem, 4.8vw, 5.6rem);
  bottom: clamp(1.1rem, 2.2vw, 2.15rem);
  z-index: 3;
}

.th-p-fragrances .fragrances-index-hero .hero-motion-controls button,
.th-p-fragrances .fragrances-index-hero .hero-controls button,
.th-p-fragrances .fragrances-index-hero .motion-toggle {
  display: inline-flex;
  min-width: 2.75rem;
  min-height: 2.75rem;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 245, 232, .68);
  border-radius: 50%;
  background: rgba(24, 8, 17, .42);
  color: #fff8ef;
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .6rem;
  font-weight: 800;
  letter-spacing: .08em;
}

.th-p-fragrances .fragrances-index-hero .hero-motion-controls button:hover,
.th-p-fragrances .fragrances-index-hero .hero-motion-controls button:focus-visible,
.th-p-fragrances .fragrances-index-hero .hero-controls button:hover,
.th-p-fragrances .fragrances-index-hero .hero-controls button:focus-visible,
.th-p-fragrances .fragrances-index-hero .motion-toggle:hover,
.th-p-fragrances .fragrances-index-hero .motion-toggle:focus-visible {
  border-color: var(--fragrances-peel);
  background: var(--fragrances-peel);
  color: #2e1320;
  outline: none;
}

.th-p-fragrances .fragrances-index-hero.has-hero-motion .fragrances-hero-media .hero-media {
  animation: p-fragrances-hero-pan 19s ease-in-out infinite alternate;
}

.th-p-fragrances .fragrances-discovery {
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid var(--fragrances-line);
  background: var(--fragrances-paper);
}

.th-p-fragrances .fragrances-ledger {
  display: grid;
  grid-template-columns: minmax(15rem, .86fr) minmax(0, 2.14fr);
  gap: clamp(2rem, 7vw, 8rem);
  padding: clamp(4.5rem, 8vw, 8.8rem) clamp(1.25rem, 5.2vw, 6rem) clamp(4.5rem, 7vw, 7.4rem);
}

.th-p-fragrances .fragrances-ledger::before {
  position: absolute;
  top: -10rem;
  right: -7rem;
  width: min(35vw, 33rem);
  aspect-ratio: 1;
  border: 1px solid rgba(124, 41, 73, .15);
  border-radius: 50%;
  box-shadow: 0 0 0 2.5rem rgba(124, 41, 73, .03), 0 0 0 5.2rem rgba(124, 41, 73, .025);
  content: '';
  pointer-events: none;
}

.th-p-fragrances .fragrances-ledger-intro {
  position: relative;
  z-index: 1;
  align-self: start;
  max-width: 22rem;
}

.th-p-fragrances .fragrances-kicker {
  color: var(--fragrances-wine);
}

.th-p-fragrances .fragrances-ledger-intro h2,
.th-p-fragrances .fragrances-current-edit-intro h2 {
  margin: 0;
  color: var(--fragrances-ink);
  font-family: var(--font-display, 'Bodoni Moda', Georgia, serif);
  font-size: clamp(2.65rem, 4.1vw, 5.1rem);
  font-weight: 500;
  letter-spacing: -.065em;
  line-height: .84;
  overflow-wrap: anywhere;
  text-wrap: balance;
}

.th-p-fragrances .fragrances-ledger-intro > p:not(.fragrances-kicker) {
  max-width: 22rem;
  margin: 1.55rem 0 0;
  color: var(--fragrances-muted);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .89rem;
  font-weight: 500;
  line-height: 1.68;
}

.th-p-fragrances .fragrances-ledger-list {
  position: relative;
  z-index: 1;
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--fragrances-ink);
}

.th-p-fragrances .fragrances-ledger-list li {
  margin: 0;
  padding: 0;
  border-bottom: 1px solid var(--fragrances-line);
}

.th-p-fragrances .fragrances-ledger-entry {
  display: grid;
  min-height: clamp(5.9rem, 8.4vw, 8rem);
  grid-template-columns: 2.7rem minmax(2.4rem, .48fr) minmax(0, 2fr) minmax(5rem, .65fr) 1.35rem;
  align-items: center;
  gap: clamp(.7rem, 1.6vw, 1.55rem);
  color: var(--fragrances-ink);
  text-decoration: none;
}

.th-p-fragrances .fragrances-ledger-entry:hover,
.th-p-fragrances .fragrances-ledger-entry:focus-visible {
  color: var(--fragrances-wine);
  outline: none;
}

.th-p-fragrances .fragrances-ledger-number,
.th-p-fragrances .fragrances-ledger-count {
  color: var(--fragrances-muted);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .6rem;
  font-weight: 800;
  letter-spacing: .15em;
  line-height: 1.3;
  text-transform: uppercase;
}

.th-p-fragrances .fragrances-ledger-trace {
  display: flex;
  width: 100%;
  height: 1.45rem;
  align-items: center;
  border-left: 1px solid var(--fragrances-wine);
}

.th-p-fragrances .fragrances-ledger-trace i {
  display: block;
  width: 68%;
  height: 1px;
  background: var(--fragrances-wine);
}

.th-p-fragrances .fragrances-ledger-list li:nth-child(2) .fragrances-ledger-trace i {
  width: 44%;
}

.th-p-fragrances .fragrances-ledger-list li:nth-child(3) .fragrances-ledger-trace i {
  width: 82%;
}

.th-p-fragrances .fragrances-ledger-list li:nth-child(4) .fragrances-ledger-trace i {
  width: 57%;
}

.th-p-fragrances .fragrances-ledger-list li:nth-child(5) .fragrances-ledger-trace i {
  width: 34%;
}

.th-p-fragrances .fragrances-ledger-name {
  max-width: 17ch;
  font-family: var(--font-display, 'Bodoni Moda', Georgia, serif);
  font-size: clamp(1.5rem, 2.35vw, 2.8rem);
  font-weight: 500;
  letter-spacing: -.052em;
  line-height: .9;
  overflow-wrap: anywhere;
}

.th-p-fragrances .fragrances-ledger-count {
  justify-self: start;
  font-size: .61rem;
  line-height: 1.45;
}

.th-p-fragrances .fragrances-ledger-arrow {
  justify-self: end;
  color: var(--fragrances-wine);
  font-family: var(--font-display, 'Bodoni Moda', Georgia, serif);
  font-size: 1.65rem;
  font-weight: 500;
  line-height: 1;
}

.th-p-fragrances .fragrances-current-edit {
  padding: clamp(4rem, 7vw, 7.5rem) clamp(1.25rem, 5.2vw, 6rem) clamp(4.6rem, 7vw, 7rem);
}

.th-p-fragrances .fragrances-current-edit-intro {
  display: flex;
  max-width: 52rem;
  flex-direction: column;
  align-items: flex-start;
}

.th-p-fragrances .fragrances-current-edit-intro h2 {
  max-width: 11ch;
}

.th-p-fragrances .fragrances-current-edit-grid {
  display: grid;
  margin-top: clamp(2.2rem, 4vw, 4rem);
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  border: 1px solid var(--fragrances-line);
  background: var(--fragrances-line);
}

.th-p-fragrances .fragrances-current-edit-grid > * {
  min-width: 0;
  background: var(--fragrances-cream);
}

.th-p-fragrances #shop {
  padding: clamp(4.5rem, 7vw, 7.7rem) clamp(1.25rem, 5.2vw, 6rem);
  background: var(--fragrances-cream);
}

.th-p-fragrances #shop > :is(h2, .section-title) {
  max-width: 11ch;
  color: var(--fragrances-ink);
  font-family: var(--font-display, 'Bodoni Moda', Georgia, serif);
  font-size: clamp(2.7rem, 4.5vw, 5.4rem);
  font-weight: 500;
  letter-spacing: -.065em;
  line-height: .85;
  overflow-wrap: anywhere;
}

.th-p-fragrances #shop > :is(p, .section-subtitle) {
  color: var(--fragrances-muted);
  font-family: var(--font-body, 'Manrope', sans-serif);
}

.th-p-fragrances .products,
.th-p-fragrances .product-grid {
  gap: 1px;
}

.th-p-fragrances :is(.product-card, .card) {
  border-color: var(--fragrances-line);
  border-radius: 0;
  background: var(--fragrances-cream);
}

.th-p-fragrances :is(.product-card, .card) :is(h3, .product-title) {
  font-family: var(--font-display, 'Bodoni Moda', Georgia, serif);
  font-weight: 500;
  letter-spacing: -.035em;
}

.th-p-fragrances a:focus-visible {
  outline: 2px solid var(--fragrances-wine);
  outline-offset: 4px;
}

@keyframes p-fragrances-hero-pan {
  from { transform: scale(1.015) translate3d(0, 0, 0); }
  to { transform: scale(1.07) translate3d(-.65%, -.42%, 0); }
}

@media (max-width: 860px) {
  .th-p-fragrances .fragrances-hero-copy {
    max-width: min(38rem, 69vw);
  }

  .th-p-fragrances .fragrances-hero-afterimage {
    width: min(10rem, 22vw);
  }

  .th-p-fragrances .fragrances-ledger {
    grid-template-columns: 1fr;
    gap: 3.2rem;
  }

  .th-p-fragrances .fragrances-ledger-intro {
    max-width: 31rem;
  }

  .th-p-fragrances .fragrances-ledger-intro > p:not(.fragrances-kicker) {
    max-width: 30rem;
  }
}

@media (max-width: 620px) {
  .th-p-fragrances .category-hero.fragrances-index-hero {
    min-height: 43.5rem;
  }

  .th-p-fragrances .fragrances-hero-media {
    inset: 0 0 35% 0;
  }

  .th-p-fragrances .fragrances-hero-media .hero-media {
    object-position: 67% center;
  }

  .th-p-fragrances .fragrances-hero-ink {
    background:
      linear-gradient(0deg, rgba(22, 7, 16, .98) 0%, rgba(27, 8, 18, .91) 35%, rgba(30, 10, 21, .13) 71%, rgba(17, 5, 13, .14) 100%),
      linear-gradient(90deg, rgba(20, 8, 15, .32), rgba(20, 8, 15, .05));
  }

  .th-p-fragrances .fragrances-hero-score {
    inset: 4.95rem 1.2rem 1.25rem;
  }

  .th-p-fragrances .fragrances-hero-serial {
    top: 5.1rem;
    right: 1.25rem;
    font-size: .53rem;
  }

  .th-p-fragrances .fragrances-hero-copy-panel {
    min-height: 43.5rem;
    padding: 20rem 1.25rem 5rem;
    align-items: flex-end;
  }

  .th-p-fragrances .fragrances-hero-copy {
    max-width: 100%;
  }

  .th-p-fragrances .fragrances-hero-copy h1 {
    max-width: 10ch;
    font-size: clamp(3.65rem, 15.2vw, 5.2rem);
    line-height: .8;
  }

  .th-p-fragrances .fragrances-hero-copy h1.long {
    max-width: 12ch;
    font-size: clamp(3rem, 12vw, 4rem);
  }

  .th-p-fragrances .fragrances-hero-copy .sub {
    max-width: 31rem;
    margin-top: 1.15rem;
    font-size: .79rem;
    line-height: 1.58;
  }

  .th-p-fragrances .fragrances-hero-copy .ctas {
    margin-top: 1.35rem;
  }

  .th-p-fragrances .fragrances-hero-copy .ctas a {
    width: 100%;
  }

  .th-p-fragrances .fragrances-hero-afterimage {
    display: none;
  }

  .th-p-fragrances .fragrances-hero-caption {
    bottom: 1.55rem;
    left: 1.25rem;
    font-size: .87rem;
  }

  .th-p-fragrances .fragrances-index-hero .hero-motion-controls,
  .th-p-fragrances .fragrances-index-hero .hero-controls,
  .th-p-fragrances .fragrances-index-hero .motion-toggle {
    top: 1rem;
    right: 1rem;
    bottom: auto;
  }

  .th-p-fragrances .fragrances-ledger {
    gap: 2.4rem;
    padding: 4.1rem 1.25rem 4.6rem;
  }

  .th-p-fragrances .fragrances-ledger::before {
    top: -5rem;
    right: -10rem;
    width: 27rem;
  }

  .th-p-fragrances .fragrances-ledger-intro h2,
  .th-p-fragrances .fragrances-current-edit-intro h2 {
    font-size: clamp(2.75rem, 12vw, 4.15rem);
  }

  .th-p-fragrances .fragrances-ledger-intro > p:not(.fragrances-kicker) {
    margin-top: 1.15rem;
    font-size: .83rem;
  }

  .th-p-fragrances .fragrances-ledger-entry {
    min-height: 5.7rem;
    grid-template-columns: 2rem 2.4rem minmax(0, 1fr) 1.1rem;
    gap: .55rem;
  }

  .th-p-fragrances .fragrances-ledger-trace {
    height: 1rem;
  }

  .th-p-fragrances .fragrances-ledger-name {
    font-size: clamp(1.42rem, 6.8vw, 2.05rem);
  }

  .th-p-fragrances .fragrances-ledger-count {
    display: none;
  }

  .th-p-fragrances .fragrances-current-edit {
    padding: 4rem 1.25rem 4.7rem;
  }

  .th-p-fragrances .fragrances-current-edit-grid {
    grid-template-columns: 1fr;
  }

  .th-p-fragrances #shop {
    padding: 4rem 1.25rem 4.8rem;
  }
}

@media (max-width: 390px) {
  .th-p-fragrances .category-hero.fragrances-index-hero,
  .th-p-fragrances .fragrances-hero-copy-panel {
    min-height: 42.5rem;
  }

  .th-p-fragrances .fragrances-hero-media {
    inset: 0 0 38% 0;
  }

  .th-p-fragrances .fragrances-hero-copy-panel {
    padding-top: 18rem;
  }

  .th-p-fragrances .fragrances-hero-copy h1 {
    font-size: clamp(3.4rem, 14.8vw, 4.25rem);
  }

  .th-p-fragrances .fragrances-ledger-entry {
    grid-template-columns: 1.7rem 2.15rem minmax(0, 1fr) 1rem;
    gap: .42rem;
  }

  .th-p-fragrances .fragrances-ledger-number {
    font-size: .52rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .th-p-fragrances .fragrances-index-hero.has-hero-motion .fragrances-hero-media .hero-media {
    animation: none;
    transform: none;
  }
}
`;

import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-lighting',
  name: 'Veyra Studio',
  for: 'architectural lighting and sculptural fixtures',
  vibe: 'midnight architectural volume, warm ivory glass, and a pool of amber light',
  category: 'Designer lighting',
  group: 'home',
  display: 'Cormorant Garamond',
  body: 'Manrope',
  displayWeight: 500,
  tracking: '-.045em',
  colors: {
    bg: '#F4F0E8',
    surface: '#FFFCF5',
    ink: '#151A20',
    muted: '#726C62',
    line: '#D9D0C2',
    accent: '#B88B43',
    onAccent: '#151A20',
    panel: '#1A2029',
    onPanel: '#F7F0E5',
    foot: '#11161D',
    onFoot: '#F7F0E5',
    bar: '#F8F3EA',
    onBar: '#151A20',
    badge: '#E8D9B9',
    onBadge: '#151A20'
  },
  header: 'split',
  hero: 'spotlight',
  card: 'minimal',
  ratio: '4/5',
  rCard: 0,
  rBtn: 0,
  motion: 'pan',
  copy: {
    eyebrow: 'Spaces, shaped by light',
    collection: 'Fixture studies',
    cta: 'Explore the collection',
    title: 'Light, held in form.',
    subtitle: 'A quiet edit of sculptural lighting for the rooms you inhabit.'
  }
});

export function hero(ctx) {
  const categories = (ctx.cats || []).filter((category) => category && category.name).slice(0, 4);
  const rail = categories.length
    ? `
      <nav class="lighting-rail" aria-label="Browse lighting categories">
        <p class="lighting-rail-label">Fixture index</p>
        <div class="lighting-rail-list">
          ${categories.map((category, index) => `
            <a href="${ctx.categoryLink(category.name)}">
              <span class="lighting-rail-number">0${index + 1}</span>
              <span>${ctx.esc(category.name)}</span>
            </a>
          `).join('')}
        </div>
      </nav>
    `
    : '<div class="lighting-rail lighting-rail-blank" aria-hidden="true"></div>';

  return `
    <section class="hero category-hero lighting-hero${ctx.heroClass}"${ctx.heroAttrs}>
      <div class="lighting-hero-shell">
        ${rail}
        <figure class="lighting-stage">
          ${ctx.media(0, { priority: true, lazy: false, decorative: true })}
          <figcaption>Spaces, shaped by light.</figcaption>
        </figure>
        <div class="lighting-copy-panel">
          <div class="lighting-copy-rule" aria-hidden="true"></div>
          ${ctx.copy('lighting-copy')}
          <p class="lighting-copy-note">An edit for rooms that ask you to linger.</p>
        </div>
      </div>
      <div class="lighting-motion-control">${ctx.controls}</div>
    </section>
  `;
}

export function discovery(ctx) {
  const categories = (ctx.cats || []).filter((category) => category && category.name).slice(0, 4);
  const products = (ctx.products || []).slice(0, 3);

  if (categories.length >= 2) {
    const fixtures = categories.map((category, index) => {
      const count = Number(category.count) || 0;
      const label = count === 1 ? 'piece' : 'pieces';
      const hasPhoto = index < 2 && Boolean(ctx.pics && ctx.pics[index + 1]);
      const visual = hasPhoto
        ? `<div class="lighting-specimen">${ctx.media(index + 1, { lazy: true, decorative: true })}</div>`
        : `<div class="lighting-specimen lighting-specimen-still lighting-specimen-still-${index + 1}" aria-hidden="true"><span></span></div>`;

      return `
        <article class="lighting-category-card">
          ${visual}
          <div class="lighting-category-copy">
            <p class="lighting-category-count">${ctx.esc(String(count))} ${label}</p>
            <h3><a href="${ctx.categoryLink(category.name)}">${ctx.esc(category.name)}</a></h3>
            <a class="lighting-category-link" href="${ctx.categoryLink(category.name)}">Explore <span aria-hidden="true">→</span></a>
          </div>
        </article>
      `;
    }).join('');

    return `
      <section class="lighting-discovery" aria-labelledby="lighting-discovery-title">
        <div class="lighting-fixture-strip">
          <div class="lighting-discovery-intro">
            <p class="lighting-section-kicker">Light, by room</p>
            <h2 id="lighting-discovery-title">Shop by light.</h2>
            <p>Begin with the kind of fixture your space is asking for.</p>
          </div>
          ${fixtures}
        </div>
      </section>
    `;
  }

  if (products.length) {
    return `
      <section class="lighting-discovery lighting-product-edit" aria-labelledby="lighting-product-edit-title">
        <div class="lighting-discovery-intro">
          <p class="lighting-section-kicker">The current edit</p>
          <h2 id="lighting-product-edit-title">A light to begin with.</h2>
          <p>Explore the pieces currently available in this collection.</p>
        </div>
        <div class="lighting-product-grid">
          ${products.map((product) => ctx.productCard(product)).join('')}
        </div>
      </section>
    `;
  }

  return '';
}

export const css = `
.th-p-lighting {
  --lighting-night: #151a20;
  --lighting-slate: #252d38;
  --lighting-ivory: #f8f3ea;
  --lighting-paper: #fffdf8;
  --lighting-brass: #b88b43;
  --lighting-umber: #3a2a20;
  --lighting-mist: #d9d0c2;
  --lighting-muted: #726c62;
  background: var(--lighting-ivory);
  color: var(--lighting-night);
  overflow-x: clip;
}

.th-p-lighting .store-header,
.th-p-lighting .site-header {
  background: var(--lighting-paper);
  border-color: var(--lighting-mist);
}

.th-p-lighting .store-header a,
.th-p-lighting .site-header a {
  letter-spacing: .055em;
}

.th-p-lighting .category-hero {
  position: relative;
  isolation: isolate;
  min-height: clamp(39rem, 56vw, 50.5rem);
  background: var(--lighting-night);
  color: var(--lighting-ivory);
  overflow: hidden;
}

.th-p-lighting .lighting-hero-shell {
  display: grid;
  grid-template-columns: clamp(10.5rem, 17vw, 17rem) minmax(0, 1fr) minmax(18.5rem, 29vw);
  min-height: inherit;
}

.th-p-lighting .lighting-rail {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2rem;
  padding: clamp(2rem, 4vw, 4.75rem) clamp(1.25rem, 3.2vw, 3.5rem);
  background: linear-gradient(90deg, #10151ce8, #151a20ce);
  border-right: 1px solid #fff1;
}

.th-p-lighting .lighting-rail-label,
.th-p-lighting .lighting-section-kicker,
.th-p-lighting .lighting-category-count {
  margin: 0;
  color: var(--lighting-brass);
  font: 700 .61rem/1.25 var(--body);
  letter-spacing: .18em;
  text-transform: uppercase;
}

.th-p-lighting .lighting-rail-list {
  display: grid;
  gap: .35rem;
}

.th-p-lighting .lighting-rail a {
  position: relative;
  display: grid;
  grid-template-columns: 1.7rem minmax(0, 1fr);
  align-items: center;
  gap: .3rem;
  min-height: 2.8rem;
  color: #f7f0e6;
  font: 500 clamp(.78rem, 1vw, .95rem)/1.25 var(--body);
  letter-spacing: .01em;
  text-decoration: none;
  transition: color 180ms ease, padding 180ms ease;
}

.th-p-lighting .lighting-rail a::before {
  position: absolute;
  top: 50%;
  left: -.9rem;
  width: 0;
  height: 1px;
  background: var(--lighting-brass);
  content: '';
  transform: translateY(-50%);
  transition: width 180ms ease;
}

.th-p-lighting .lighting-rail a:hover,
.th-p-lighting .lighting-rail a:focus-visible {
  color: #ffffff;
  padding-left: .4rem;
}

.th-p-lighting .lighting-rail a:hover::before,
.th-p-lighting .lighting-rail a:focus-visible::before {
  width: .9rem;
}

.th-p-lighting .lighting-rail-number {
  color: #e7d7bb99;
  font-size: .62rem;
  letter-spacing: .12em;
}

.th-p-lighting .lighting-rail-blank {
  min-height: 100%;
}

.th-p-lighting .lighting-stage {
  position: relative;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  background: var(--lighting-slate);
}

.th-p-lighting .lighting-stage::after {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(90deg, #10182055 0%, transparent 34%, transparent 68%, #10182044 100%);
  content: '';
  pointer-events: none;
}

.th-p-lighting .lighting-stage .hero-media,
.th-p-lighting .lighting-stage .theme-empty-media {
  display: block;
  width: 100%;
  height: 100%;
  min-height: inherit;
  object-fit: cover;
  object-position: 42% center;
}

.th-p-lighting .lighting-stage .theme-empty-media {
  position: relative;
  z-index: 0;
  background:
    radial-gradient(circle at 48% 42%, #f3ce85 0 3%, #a9743d22 11%, transparent 29%),
    linear-gradient(120deg, #0f151b, #303a47 52%, #1a1f25);
  color: #f7eddf;
}

.th-p-lighting .lighting-stage figcaption {
  position: absolute;
  bottom: clamp(1.35rem, 3vw, 3rem);
  left: clamp(1.35rem, 3vw, 3rem);
  z-index: 2;
  margin: 0;
  max-width: 10ch;
  color: #f8f0e3b8;
  font: 700 .58rem/1.45 var(--body);
  letter-spacing: .19em;
  text-transform: uppercase;
}

.th-p-lighting .lighting-copy-panel {
  position: relative;
  z-index: 3;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  padding: clamp(2.5rem, 5vw, 5.75rem) clamp(1.75rem, 4vw, 5rem);
  background:
    linear-gradient(90deg, #261c17e8, #1b1817f2 70%, #2e211ad9),
    var(--lighting-umber);
}

.th-p-lighting .lighting-copy-panel::before {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 1px;
  background: #e5c47f55;
  content: '';
}

.th-p-lighting .lighting-copy-rule {
  width: 2.5rem;
  height: 1px;
  margin-bottom: 1.7rem;
  background: var(--lighting-brass);
}

.th-p-lighting .lighting-copy {
  position: relative;
  z-index: 1;
  max-width: 23rem;
}

.th-p-lighting .lighting-copy .eyebrow {
  margin: 0 0 1.1rem;
  color: #e7d6b5;
  font: 700 .62rem/1.45 var(--body);
  letter-spacing: .19em;
  text-transform: uppercase;
}

.th-p-lighting .lighting-copy h1 {
  margin: 0;
  max-width: 10ch;
  color: #fff8ec;
  font: 500 clamp(3.4rem, 6vw, 6.75rem)/.84 var(--display);
  letter-spacing: -.058em;
  overflow-wrap: anywhere;
}

.th-p-lighting .lighting-copy h1.long {
  font-size: clamp(2.65rem, 4.8vw, 5.2rem);
  line-height: .92;
}

.th-p-lighting .lighting-copy .sub {
  margin: 1.8rem 0 0;
  max-width: 27ch;
  color: #f2e8d9bb;
  font: 500 .78rem/1.7 var(--body);
  letter-spacing: .04em;
  overflow-wrap: anywhere;
}

.th-p-lighting .lighting-copy .ctas {
  display: flex;
  flex-wrap: wrap;
  gap: .65rem;
  margin-top: 2rem;
}

.th-p-lighting .lighting-copy .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.8rem;
  padding: .65rem 1.15rem;
  border: 1px solid #e6d5b866;
  border-radius: 0;
  background: transparent;
  color: #fff8ec;
  font: 700 .63rem/1 var(--body);
  letter-spacing: .14em;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-lighting .lighting-copy .btn:first-child {
  border-color: var(--lighting-brass);
  background: var(--lighting-brass);
  color: var(--lighting-night);
}

.th-p-lighting .lighting-copy .btn:hover,
.th-p-lighting .lighting-copy .btn:focus-visible {
  border-color: #fff8ec;
  background: #fff8ec;
  color: var(--lighting-night);
}

.th-p-lighting .lighting-copy-note {
  position: relative;
  z-index: 1;
  margin: 2.1rem 0 0;
  max-width: 20ch;
  color: #f7efdf8a;
  font: 500 .65rem/1.55 var(--body);
  letter-spacing: .08em;
}

.th-p-lighting .lighting-motion-control {
  position: absolute;
  right: clamp(1rem, 2vw, 2rem);
  bottom: clamp(1rem, 2vw, 2rem);
  z-index: 6;
}

.th-p-lighting .lighting-motion-control:empty {
  display: none;
}

.th-p-lighting .lighting-motion-control .motion-toggle {
  min-height: 2.75rem;
  padding: .55rem .8rem;
  border: 1px solid #fff4;
  border-radius: 0;
  background: #10151cab;
  color: #fff8ec;
  font: 700 .58rem/1 var(--body);
  letter-spacing: .12em;
  text-transform: uppercase;
}

.th-p-lighting .lighting-discovery {
  padding: clamp(2.5rem, 5vw, 5.5rem) clamp(1.25rem, 3.7vw, 4.5rem);
  background: var(--lighting-paper);
}

.th-p-lighting .lighting-fixture-strip {
  display: grid;
  grid-template-columns: minmax(12.5rem, 1.25fr) repeat(4, minmax(0, 1fr));
  border-top: 1px solid var(--lighting-mist);
  border-bottom: 1px solid var(--lighting-mist);
}

.th-p-lighting .lighting-discovery-intro {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  padding: clamp(1.6rem, 3vw, 3rem) clamp(1.1rem, 2.7vw, 3rem) clamp(1.8rem, 3vw, 3.25rem) 0;
}

.th-p-lighting .lighting-discovery-intro h2 {
  margin: .8rem 0 0;
  max-width: 7ch;
  color: var(--lighting-night);
  font: 500 clamp(2.45rem, 4vw, 4.5rem)/.9 var(--display);
  letter-spacing: -.055em;
}

.th-p-lighting .lighting-discovery-intro > p:last-child {
  margin: 1.2rem 0 0;
  max-width: 25ch;
  color: var(--lighting-muted);
  font: 500 .76rem/1.65 var(--body);
}

.th-p-lighting .lighting-category-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border-left: 1px solid var(--lighting-mist);
}

.th-p-lighting .lighting-specimen {
  position: relative;
  min-height: clamp(9.5rem, 15vw, 14.5rem);
  overflow: hidden;
  background: linear-gradient(135deg, #f5efe4, #e7dccb);
}

.th-p-lighting .lighting-specimen .hero-media {
  display: block;
  width: 100%;
  height: 100%;
  min-height: inherit;
  object-fit: cover;
}

.th-p-lighting .lighting-specimen-still {
  display: grid;
  place-items: center;
  isolation: isolate;
  background:
    radial-gradient(ellipse at 50% 75%, #d59b4277 0 9%, transparent 25%),
    linear-gradient(145deg, #f8f2e8, #e5d8c5);
}

.th-p-lighting .lighting-specimen-still::before,
.th-p-lighting .lighting-specimen-still::after,
.th-p-lighting .lighting-specimen-still span {
  position: absolute;
  display: block;
  content: '';
}

.th-p-lighting .lighting-specimen-still::before {
  top: 0;
  left: 50%;
  width: 2px;
  height: 34%;
  background: #4a3a29;
  transform: translateX(-50%);
}

.th-p-lighting .lighting-specimen-still::after {
  top: 29%;
  left: 50%;
  width: 42%;
  aspect-ratio: 1.5;
  border: 1px solid #a8733b;
  border-radius: 50% 50% 46% 46%;
  background: repeating-radial-gradient(ellipse at center, #fff4d4 0 6%, #c7944b 6.5% 8%, #f2d694 8.5% 11%);
  box-shadow: 0 1.1rem 1.2rem #5f371f22;
  transform: translateX(-50%);
}

.th-p-lighting .lighting-specimen-still span {
  z-index: -1;
  bottom: 17%;
  left: 50%;
  width: 56%;
  height: 1px;
  background: #9c8062;
  transform: translateX(-50%);
}

.th-p-lighting .lighting-specimen-still-4::after {
  width: 18%;
  aspect-ratio: .68;
  border-radius: 50% 50% 8% 8%;
}

.th-p-lighting .lighting-specimen-still-3::after {
  width: 44%;
  aspect-ratio: 1;
  border-radius: 16% 56% 20% 48%;
  transform: translateX(-50%) rotate(19deg);
}

.th-p-lighting .lighting-category-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: flex-start;
  padding: 1.25rem 1rem 1.5rem;
}

.th-p-lighting .lighting-category-copy h3 {
  margin: .55rem 0 .75rem;
  font: 500 clamp(1.35rem, 2vw, 2.05rem)/1 var(--display);
  letter-spacing: -.035em;
  overflow-wrap: anywhere;
}

.th-p-lighting .lighting-category-copy h3 a {
  color: var(--lighting-night);
  text-decoration: none;
}

.th-p-lighting .lighting-category-link {
  display: inline-flex;
  align-items: center;
  gap: .7rem;
  min-height: 2.75rem;
  margin-top: auto;
  color: var(--lighting-night);
  font: 700 .58rem/1 var(--body);
  letter-spacing: .15em;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-lighting .lighting-category-link span {
  color: var(--lighting-brass);
  font-size: 1rem;
  transition: transform 180ms ease;
}

.th-p-lighting .lighting-category-link:hover span,
.th-p-lighting .lighting-category-link:focus-visible span {
  transform: translateX(.3rem);
}

.th-p-lighting .lighting-product-edit {
  display: grid;
  grid-template-columns: minmax(13rem, .85fr) minmax(0, 2.3fr);
  gap: clamp(1.5rem, 4vw, 4.5rem);
  align-items: start;
}

.th-p-lighting .lighting-product-edit .lighting-discovery-intro {
  padding: 0;
}

.th-p-lighting .lighting-product-grid,
.th-p-lighting .lighting-product-edit .product-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  min-width: 0;
}

.th-p-lighting .lighting-product-edit .product-card {
  border-color: var(--lighting-mist);
  border-radius: 0;
  background: var(--lighting-paper);
}

.th-p-lighting .lighting-product-edit .product-card img {
  border-radius: 0;
}

.th-p-lighting :is(.lighting-rail a, .lighting-copy .btn, .lighting-category-link, .lighting-category-copy h3 a):focus-visible {
  outline: 2px solid var(--lighting-brass);
  outline-offset: 3px;
}

@media (max-width: 1060px) {
  .th-p-lighting .lighting-hero-shell {
    grid-template-columns: 10.5rem minmax(0, 1fr) minmax(16.5rem, 31vw);
  }

  .th-p-lighting .lighting-copy-panel {
    padding-inline: 1.8rem;
  }

  .th-p-lighting .lighting-copy h1 {
    font-size: clamp(3.2rem, 6.1vw, 5.25rem);
  }

  .th-p-lighting .lighting-fixture-strip {
    grid-template-columns: minmax(11rem, 1.15fr) repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .th-p-lighting .category-hero {
    min-height: 0;
  }

  .th-p-lighting .lighting-hero-shell {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .th-p-lighting .lighting-copy-panel {
    order: 1;
    min-height: 0;
    padding: 2.7rem 1.35rem 2.35rem;
    background: linear-gradient(135deg, #251b17, #171b21 78%);
  }

  .th-p-lighting .lighting-copy-rule {
    margin-bottom: 1.25rem;
  }

  .th-p-lighting .lighting-copy h1 {
    max-width: 12ch;
    font-size: clamp(3rem, 13vw, 4.65rem);
  }

  .th-p-lighting .lighting-copy h1.long {
    font-size: clamp(2.35rem, 10vw, 3.6rem);
  }

  .th-p-lighting .lighting-copy .sub {
    max-width: 38ch;
    font-size: .75rem;
  }

  .th-p-lighting .lighting-copy-note {
    margin-top: 1.4rem;
  }

  .th-p-lighting .lighting-stage {
    order: 2;
    min-height: 17rem;
    aspect-ratio: 16 / 10;
  }

  .th-p-lighting .lighting-stage .hero-media,
  .th-p-lighting .lighting-stage .theme-empty-media {
    min-height: 0;
    object-position: 43% center;
  }

  .th-p-lighting .lighting-stage figcaption {
    bottom: 1.25rem;
    left: 1.25rem;
  }

  .th-p-lighting .lighting-rail {
    order: 3;
    gap: .7rem;
    padding: .9rem 1.15rem 1rem;
    border-top: 1px solid #fff2;
    border-right: 0;
    background: var(--lighting-night);
  }

  .th-p-lighting .lighting-rail-label {
    font-size: .56rem;
  }

  .th-p-lighting .lighting-rail-list {
    display: flex;
    gap: .35rem;
    overflow-x: auto;
    scrollbar-width: thin;
  }

  .th-p-lighting .lighting-rail a {
    display: flex;
    flex: 0 0 auto;
    gap: .4rem;
    min-height: 2.75rem;
    padding: .55rem .72rem;
    border: 1px solid #fff2;
    font-size: .71rem;
  }

  .th-p-lighting .lighting-rail a::before {
    display: none;
  }

  .th-p-lighting .lighting-rail a:hover,
  .th-p-lighting .lighting-rail a:focus-visible {
    padding-left: .72rem;
  }

  .th-p-lighting .lighting-rail-blank {
    display: none;
  }

  .th-p-lighting .lighting-motion-control {
    right: 1rem;
    bottom: 4.7rem;
  }

  .th-p-lighting .lighting-discovery {
    padding: 2.8rem 1.15rem;
  }

  .th-p-lighting .lighting-fixture-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    border-left: 1px solid var(--lighting-mist);
  }

  .th-p-lighting .lighting-discovery-intro {
    grid-column: 1 / -1;
    padding: 1.4rem 1.15rem 1.75rem;
    border-right: 1px solid var(--lighting-mist);
  }

  .th-p-lighting .lighting-discovery-intro h2 {
    max-width: none;
    font-size: clamp(2.55rem, 11vw, 4rem);
  }

  .th-p-lighting .lighting-category-card:nth-of-type(odd) {
    border-left: 0;
  }

  .th-p-lighting .lighting-specimen {
    min-height: 10.5rem;
  }

  .th-p-lighting .lighting-category-copy {
    padding: 1rem .85rem 1.2rem;
  }

  .th-p-lighting .lighting-category-copy h3 {
    font-size: 1.5rem;
  }

  .th-p-lighting .lighting-product-edit {
    display: block;
  }

  .th-p-lighting .lighting-product-edit .lighting-discovery-intro {
    margin-bottom: 1.5rem;
  }

  .th-p-lighting .lighting-product-grid,
  .th-p-lighting .lighting-product-edit .product-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 390px) {
  .th-p-lighting .lighting-copy-panel {
    padding-inline: 1.1rem;
  }

  .th-p-lighting .lighting-copy h1 {
    font-size: 2.9rem;
  }

  .th-p-lighting .lighting-copy .ctas {
    gap: .45rem;
  }

  .th-p-lighting .lighting-copy .btn {
    flex: 1 1 auto;
    padding-inline: .75rem;
  }

  .th-p-lighting .lighting-category-copy h3 {
    font-size: 1.28rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .th-p-lighting .has-hero-motion .hero-media,
  .th-p-lighting .lighting-rail a,
  .th-p-lighting .lighting-category-link span {
    animation: none !important;
    transition: none !important;
  }
}
`;

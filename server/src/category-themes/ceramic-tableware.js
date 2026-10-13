import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-ceramic-tableware',
  name: 'Rim & Ember',
  for: 'people gathering a table one considered piece at a time',
  vibe: 'sunlit, earthen, and quietly sculptural',
  category: 'Handcrafted ceramic tableware',
  group: 'home',
  display: 'DM Serif Display',
  body: 'Manrope',
  displayWeight: 400,
  tracking: '-.045em',
  colors: {
    bg: '#F4EFE5',
    surface: '#FFFDF8',
    ink: '#2F302A',
    muted: '#6D6B62',
    line: '#D6CEC1',
    accent: '#A74E35',
    onAccent: '#FFF9F0',
    panel: '#D7DBCA',
    onPanel: '#2F302A',
    foot: '#343B35',
    onFoot: '#FAF5EC',
    bar: '#F8F3EA',
    onBar: '#2F302A',
    badge: '#E0B990',
    onBadge: '#2F302A',
  },
  header: 'stack',
  hero: 'editorial',
  card: 'minimal',
  ratio: '4/3',
  rCard: 20,
  rBtn: 0,
  motion: 'pan',
  copy: {
    eyebrow: 'THE EVERYDAY TABLE, MADE PERSONAL',
    collection: 'The table edit',
    cta: 'Explore tableware',
    title: 'Set the table in your own light.',
    subtitle: 'Ceramic pieces for unhurried meals, open shelves, and the space between.',
  },
});

const collectionCount = (count) => {
  const numeric = Number(count);
  if (!Number.isFinite(numeric)) return 'Browse collection';
  return `${numeric} ${numeric === 1 ? 'piece' : 'pieces'}`;
};

const categoryImage = (ctx, category) => {
  const image = typeof category?.image === 'string' ? category.image : category?.image?.url;
  if (!image) {
    return '<span class="ceramic-category-blank" aria-hidden="true"><i></i><i></i></span>';
  }
  return `<span class="ceramic-category-media"><img src="${ctx.esc(image)}" alt="" loading="lazy" decoding="async"></span>`;
};

export function hero(ctx) {
  return `
    <section class="hero category-hero ceramic-rim-hero${ctx.heroClass || ''}"${ctx.heroAttrs || ''}>
      <div class="ceramic-hero-titleband">
        ${ctx.copy('ceramic-hero-copy')}
      </div>
      <div class="ceramic-hero-shelf" aria-hidden="true"><span></span><span></span><span></span></div>
      <div class="ceramic-hero-media">
        ${ctx.media(0, { priority: true, lazy: false, decorative: false })}
      </div>
      <div class="ceramic-hero-rings" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="ceramic-hero-note" aria-hidden="true"><span>01</span><b></b><span>TABLE STUDY</span></div>
      ${ctx.controls || ''}
    </section>`;
}

export function discovery(ctx) {
  const categories = Array.isArray(ctx.cats) ? ctx.cats.filter((category) => category?.name) : [];
  const products = Array.isArray(ctx.products) ? ctx.products.filter(Boolean) : [];

  if (categories.length >= 2) {
    const cards = categories.slice(0, 4).map((category, index) => `
      <a class="ceramic-category-card ceramic-category-card-${index + 1}" href="${ctx.esc(ctx.categoryLink(category.name))}">
        <span class="ceramic-category-top"><small>${String(index + 1).padStart(2, '0')}</small><small>${ctx.esc(collectionCount(category.count))}</small></span>
        <strong>${ctx.esc(category.name)}</strong>
        ${categoryImage(ctx, category)}
        <span class="ceramic-category-arrow" aria-hidden="true">↗</span>
      </a>`).join('');

    return `
      <section class="theme-discovery ceramic-setting-index" aria-labelledby="ceramic-discovery-title">
        <div class="ceramic-discovery-intro">
          <p>SETTINGS, NOT RULES</p>
          <h2 id="ceramic-discovery-title">Begin with<br><em>one good piece.</em></h2>
          <a href="#shop">See every piece <span aria-hidden="true">→</span></a>
        </div>
        <div class="ceramic-category-ledger">${cards}</div>
      </section>`;
  }

  if (products.length) {
    return `
      <section class="theme-discovery ceramic-setting-index ceramic-product-index" aria-labelledby="ceramic-discovery-title">
        <div class="ceramic-discovery-intro">
          <p>THE TABLE EDIT</p>
          <h2 id="ceramic-discovery-title">Pieces waiting<br><em>for their place.</em></h2>
          <a href="#shop">See every piece <span aria-hidden="true">→</span></a>
        </div>
        <div class="ceramic-product-ledger">${products.slice(0, 3).map((product) => ctx.productCard(product)).join('')}</div>
      </section>`;
  }

  return '';
}

export const css = `
.th-p-ceramic-tableware {
  --ceramic-paper: #F4EFE5;
  --ceramic-porcelain: #FFFDF8;
  --ceramic-ink: #2F302A;
  --ceramic-muted: #6D6B62;
  --ceramic-line: #D6CEC1;
  --ceramic-clay: #A74E35;
  --ceramic-sage: #D7DBCA;
  background: var(--ceramic-paper);
  color: var(--ceramic-ink);
}

.th-p-ceramic-tableware .site-header,
.th-p-ceramic-tableware .store-header {
  background: color-mix(in srgb, var(--ceramic-porcelain) 91%, transparent);
  border-color: color-mix(in srgb, var(--ceramic-ink) 12%, transparent);
}

.th-p-ceramic-tableware .ceramic-rim-hero {
  box-sizing: border-box;
  display: grid;
  grid-template-columns: minmax(1.2rem, 1fr) minmax(0, 72rem) minmax(1.2rem, 1fr);
  grid-template-rows: auto minmax(21rem, 37vw) auto;
  isolation: isolate;
  min-height: min(54rem, 100svh);
  overflow: hidden;
  padding: clamp(4.2rem, 7vw, 6.8rem) 0 clamp(2rem, 4vw, 3.75rem);
  position: relative;
}

.th-p-ceramic-tableware .ceramic-hero-titleband {
  grid-column: 2;
  grid-row: 1;
  justify-self: center;
  max-width: 61rem;
  padding: 0 clamp(.5rem, 5vw, 4rem) clamp(2rem, 4.5vw, 3.7rem);
  position: relative;
  text-align: center;
  z-index: 3;
}

.th-p-ceramic-tableware .ceramic-hero-copy .eyebrow,
.th-p-ceramic-tableware .ceramic-discovery-intro > p,
.th-p-ceramic-tableware .ceramic-category-top {
  color: var(--ceramic-muted);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .64rem;
  font-weight: 700;
  letter-spacing: .19em;
  line-height: 1.35;
  text-transform: uppercase;
}

.th-p-ceramic-tableware .ceramic-hero-copy .eyebrow {
  margin: 0 0 1rem;
}

.th-p-ceramic-tableware .ceramic-hero-copy h1 {
  margin: 0 auto;
  max-width: 13ch;
  color: var(--ceramic-ink);
  font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
  font-size: clamp(3.1rem, 6.5vw, 7.25rem);
  font-weight: 400;
  letter-spacing: -.065em;
  line-height: .84;
  overflow-wrap: anywhere;
}

.th-p-ceramic-tableware .ceramic-hero-copy .sub {
  margin: clamp(1.1rem, 2vw, 1.6rem) auto 0;
  max-width: 43ch;
  color: var(--ceramic-muted);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: clamp(.89rem, 1.2vw, 1.02rem);
  line-height: 1.55;
}

.th-p-ceramic-tableware .ceramic-hero-copy .ctas {
  display: flex;
  flex-wrap: wrap;
  gap: .7rem;
  justify-content: center;
  margin-top: clamp(1.35rem, 2.5vw, 2rem);
}

.th-p-ceramic-tableware .ceramic-hero-copy .btn {
  align-items: center;
  border: 1px solid var(--ceramic-ink);
  color: var(--ceramic-ink);
  display: inline-flex;
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .68rem;
  font-weight: 700;
  justify-content: center;
  letter-spacing: .13em;
  min-height: 46px;
  padding: 0 1.35rem;
  text-decoration: none;
  text-transform: uppercase;
  transition: background-color .2s ease, color .2s ease;
}

.th-p-ceramic-tableware .ceramic-hero-copy .btn:first-child {
  background: var(--ceramic-ink);
  color: var(--ceramic-porcelain);
}

.th-p-ceramic-tableware .ceramic-hero-copy .btn:hover {
  background: var(--ceramic-clay);
  border-color: var(--ceramic-clay);
  color: var(--ceramic-porcelain);
}

.th-p-ceramic-tableware .ceramic-hero-shelf {
  align-items: end;
  display: flex;
  gap: clamp(1rem, 4vw, 4rem);
  grid-column: 2;
  grid-row: 2;
  height: 100%;
  justify-content: center;
  margin: 0 clamp(1rem, 5vw, 4rem);
  pointer-events: none;
  position: relative;
  z-index: 2;
}

.th-p-ceramic-tableware .ceramic-hero-shelf::after {
  background: var(--ceramic-porcelain);
  bottom: 0;
  box-shadow: 0 -1px 0 var(--ceramic-line), 0 15px 25px rgba(64, 49, 38, .09);
  content: '';
  height: 16%;
  left: -4%;
  position: absolute;
  right: -4%;
}

.th-p-ceramic-tableware .ceramic-hero-shelf span {
  background: var(--ceramic-sage);
  border: 1px solid rgba(47, 48, 42, .1);
  border-bottom: 0;
  border-radius: 50% 50% 0 0 / 16% 16% 0 0;
  display: block;
  height: 46%;
  position: relative;
  width: clamp(3.2rem, 7vw, 6.75rem);
  z-index: 1;
}

.th-p-ceramic-tableware .ceramic-hero-shelf span:nth-child(2) {
  background: #E8C9A7;
  height: 71%;
  width: clamp(4.7rem, 10vw, 9.2rem);
}

.th-p-ceramic-tableware .ceramic-hero-shelf span:nth-child(3) {
  background: #B56E59;
  height: 38%;
}

.th-p-ceramic-tableware .ceramic-hero-media {
  background: #CDBA9F;
  clip-path: polygon(0 9%, 13% 0, 87% 0, 100% 9%, 100% 100%, 0 100%);
  grid-column: 1 / -1;
  grid-row: 2;
  overflow: hidden;
  position: relative;
  z-index: -1;
}

.th-p-ceramic-tableware .ceramic-hero-media::after {
  background: linear-gradient(180deg, rgba(255, 253, 248, .32), transparent 29%, rgba(47, 48, 42, .1));
  content: '';
  inset: 0;
  pointer-events: none;
  position: absolute;
}

.th-p-ceramic-tableware .ceramic-hero-media .hero-media,
.th-p-ceramic-tableware .ceramic-hero-media .theme-empty-media {
  display: block;
  height: 100%;
  object-fit: cover;
  object-position: center 65%;
  width: 100%;
}

.th-p-ceramic-tableware .ceramic-hero-media .theme-empty-media {
  background:
    radial-gradient(ellipse at 69% 66%, rgba(169, 77, 53, .76) 0 9%, transparent 9.5%),
    radial-gradient(ellipse at 49% 58%, rgba(215, 219, 202, .94) 0 17%, transparent 17.5%),
    linear-gradient(116deg, #EDE5D8 0%, #C8B596 100%);
}

.th-p-ceramic-tableware .ceramic-hero-rings {
  grid-column: 2;
  grid-row: 2;
  inset: auto 0 7%;
  margin: 0 auto;
  max-width: 67rem;
  pointer-events: none;
  position: absolute;
  width: calc(100% - clamp(2.5rem, 9vw, 8rem));
  z-index: 1;
}

.th-p-ceramic-tableware .ceramic-hero-rings i {
  border: 1px solid rgba(255, 253, 248, .7);
  border-radius: 50%;
  display: block;
  left: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
}

.th-p-ceramic-tableware .ceramic-hero-rings i:first-child { height: min(26vw, 22rem); width: min(53vw, 44rem); }
.th-p-ceramic-tableware .ceramic-hero-rings i:nth-child(2) { height: min(17vw, 14rem); width: min(34vw, 28rem); }
.th-p-ceramic-tableware .ceramic-hero-rings i:nth-child(3) { height: min(8vw, 7rem); width: min(16vw, 13rem); }

.th-p-ceramic-tableware .ceramic-hero-note {
  align-items: center;
  color: var(--ceramic-porcelain);
  display: flex;
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .57rem;
  font-weight: 700;
  gap: .65rem;
  grid-column: 2;
  grid-row: 2;
  justify-self: end;
  letter-spacing: .16em;
  margin: 0 clamp(.75rem, 2.5vw, 2.5rem) clamp(1.1rem, 3vw, 2rem) 0;
  position: relative;
  writing-mode: vertical-rl;
  z-index: 3;
}

.th-p-ceramic-tableware .ceramic-hero-note b {
  background: currentColor;
  display: block;
  height: clamp(2rem, 5vw, 4rem);
  width: 1px;
}

.th-p-ceramic-tableware .ceramic-rim-hero .motion-toggle {
  background: rgba(47, 48, 42, .76);
  border: 1px solid rgba(255, 253, 248, .68);
  bottom: 1rem;
  color: var(--ceramic-porcelain);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .61rem;
  font-weight: 700;
  left: clamp(1rem, 3vw, 2.5rem);
  letter-spacing: .11em;
  min-height: 44px;
  padding: 0 .85rem;
  position: absolute;
  text-transform: uppercase;
  z-index: 4;
}

.th-p-ceramic-tableware .ceramic-setting-index {
  border-bottom: 1px solid var(--ceramic-line);
  display: grid;
  grid-template-columns: minmax(14rem, .74fr) minmax(0, 1.26fr);
  padding: clamp(3rem, 7vw, 7rem) clamp(1.25rem, 6vw, 6rem);
}

.th-p-ceramic-tableware .ceramic-discovery-intro {
  align-self: start;
  padding: 0 clamp(1.5rem, 4vw, 4.5rem) 2rem 0;
  position: sticky;
  top: 1.5rem;
}

.th-p-ceramic-tableware .ceramic-discovery-intro > p {
  margin: 0 0 1.1rem;
}

.th-p-ceramic-tableware .ceramic-discovery-intro h2 {
  color: var(--ceramic-ink);
  font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
  font-size: clamp(2.7rem, 4.4vw, 5.1rem);
  font-weight: 400;
  letter-spacing: -.06em;
  line-height: .87;
  margin: 0;
  overflow-wrap: anywhere;
}

.th-p-ceramic-tableware .ceramic-discovery-intro h2 em {
  color: var(--ceramic-clay);
  font-style: italic;
}

.th-p-ceramic-tableware .ceramic-discovery-intro a {
  align-items: center;
  border-bottom: 1px solid currentColor;
  color: var(--ceramic-ink);
  display: inline-flex;
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .65rem;
  font-weight: 700;
  gap: .75rem;
  letter-spacing: .14em;
  margin-top: 2rem;
  min-height: 44px;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-ceramic-tableware .ceramic-discovery-intro a span {
  font-size: 1.05rem;
  line-height: 1;
}

.th-p-ceramic-tableware .ceramic-category-ledger {
  border-top: 1px solid var(--ceramic-line);
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.th-p-ceramic-tableware .ceramic-category-card {
  align-content: start;
  border-bottom: 1px solid var(--ceramic-line);
  color: var(--ceramic-ink);
  display: grid;
  grid-template-rows: auto auto minmax(8rem, 13vw);
  min-height: 20rem;
  min-width: 0;
  padding: 1rem;
  position: relative;
  text-decoration: none;
  transition: background-color .2s ease, color .2s ease;
}

.th-p-ceramic-tableware .ceramic-category-card:nth-child(odd) {
  border-right: 1px solid var(--ceramic-line);
}

.th-p-ceramic-tableware .ceramic-category-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: clamp(1.7rem, 4vw, 4rem);
}

.th-p-ceramic-tableware .ceramic-category-top small {
  font: inherit;
}

.th-p-ceramic-tableware .ceramic-category-card > strong {
  font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
  font-size: clamp(1.65rem, 2.6vw, 2.8rem);
  font-weight: 400;
  letter-spacing: -.05em;
  line-height: .93;
  max-width: 10ch;
  overflow-wrap: anywhere;
}

.th-p-ceramic-tableware .ceramic-category-media,
.th-p-ceramic-tableware .ceramic-category-blank {
  align-self: end;
  background: var(--ceramic-sage);
  display: block;
  height: 100%;
  margin-top: 1.5rem;
  overflow: hidden;
  position: relative;
}

.th-p-ceramic-tableware .ceramic-category-media img {
  display: block;
  height: 100%;
  object-fit: cover;
  transition: transform .4s ease;
  width: 100%;
}

.th-p-ceramic-tableware .ceramic-category-blank {
  background:
    radial-gradient(ellipse at 52% 55%, transparent 0 24%, rgba(47, 48, 42, .32) 24.5% 25%, transparent 25.5%),
    linear-gradient(135deg, #E8E2D6, #D7DBCA);
}

.th-p-ceramic-tableware .ceramic-category-blank i {
  border: 1px solid rgba(47, 48, 42, .24);
  border-radius: 50%;
  display: block;
  height: 35%;
  left: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 48%;
}

.th-p-ceramic-tableware .ceramic-category-blank i:nth-child(2) {
  height: 19%;
  width: 26%;
}

.th-p-ceramic-tableware .ceramic-category-arrow {
  align-items: center;
  background: var(--ceramic-porcelain);
  border: 1px solid var(--ceramic-line);
  border-radius: 50%;
  bottom: 1.55rem;
  display: flex;
  font-family: Georgia, serif;
  font-size: 1.5rem;
  height: 2.8rem;
  justify-content: center;
  position: absolute;
  right: 1.55rem;
  transition: background-color .2s ease, color .2s ease;
  width: 2.8rem;
}

.th-p-ceramic-tableware .ceramic-category-card:hover {
  background: var(--ceramic-ink);
  color: var(--ceramic-porcelain);
}

.th-p-ceramic-tableware .ceramic-category-card:hover .ceramic-category-media img {
  transform: scale(1.045);
}

.th-p-ceramic-tableware .ceramic-category-card:hover .ceramic-category-arrow {
  background: var(--ceramic-clay);
  border-color: var(--ceramic-clay);
  color: var(--ceramic-porcelain);
}

.th-p-ceramic-tableware .ceramic-product-ledger {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.th-p-ceramic-tableware .ceramic-product-ledger .product-card {
  background: transparent;
  border: 1px solid var(--ceramic-line);
  border-radius: 0;
  min-width: 0;
}

.th-p-ceramic-tableware .ceramic-product-ledger .product-card img {
  aspect-ratio: 1 / 1;
  border-radius: 0;
  object-fit: cover;
}

.th-p-ceramic-tableware #shop {
  padding-top: clamp(3rem, 6vw, 6rem);
}

.th-p-ceramic-tableware #shop .section-title,
.th-p-ceramic-tableware #shop h2 {
  font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
  font-weight: 400;
  letter-spacing: -.045em;
}

.th-p-ceramic-tableware #shop .product-card,
.th-p-ceramic-tableware #shop .product-card img {
  border-radius: 0;
}

.th-p-ceramic-tableware .ceramic-hero-copy .btn:focus-visible,
.th-p-ceramic-tableware .ceramic-discovery-intro a:focus-visible,
.th-p-ceramic-tableware .ceramic-category-card:focus-visible {
  outline: 3px solid var(--ceramic-clay);
  outline-offset: 4px;
}

@media (max-width: 760px) {
  .th-p-ceramic-tableware .ceramic-rim-hero {
    grid-template-columns: 1rem minmax(0, 1fr) 1rem;
    grid-template-rows: auto minmax(19rem, 83vw) auto;
    min-height: 0;
    padding-top: 4.7rem;
  }

  .th-p-ceramic-tableware .ceramic-hero-titleband {
    padding: 0 .65rem 1.8rem;
  }

  .th-p-ceramic-tableware .ceramic-hero-copy h1 {
    font-size: clamp(3.2rem, 12.9vw, 4.7rem);
    max-width: 11ch;
  }

  .th-p-ceramic-tableware .ceramic-hero-copy .sub {
    max-width: 33ch;
  }

  .th-p-ceramic-tableware .ceramic-hero-shelf {
    gap: 1.6rem;
    margin: 0 2rem;
  }

  .th-p-ceramic-tableware .ceramic-hero-media {
    clip-path: polygon(0 6%, 11% 0, 89% 0, 100% 6%, 100% 100%, 0 100%);
  }

  .th-p-ceramic-tableware .ceramic-hero-rings {
    bottom: 12%;
    width: calc(100% - 3.5rem);
  }

  .th-p-ceramic-tableware .ceramic-hero-rings i:first-child { height: 42vw; width: 82vw; }
  .th-p-ceramic-tableware .ceramic-hero-rings i:nth-child(2) { height: 27vw; width: 53vw; }
  .th-p-ceramic-tableware .ceramic-hero-rings i:nth-child(3) { height: 13vw; width: 26vw; }

  .th-p-ceramic-tableware .ceramic-hero-note {
    font-size: .5rem;
    margin-bottom: 1.1rem;
  }

  .th-p-ceramic-tableware .ceramic-setting-index {
    display: block;
    padding: 3.5rem 1.25rem;
  }

  .th-p-ceramic-tableware .ceramic-discovery-intro {
    padding: 0 0 2.4rem;
    position: static;
  }

  .th-p-ceramic-tableware .ceramic-discovery-intro h2 {
    font-size: clamp(2.85rem, 12vw, 4.2rem);
  }

  .th-p-ceramic-tableware .ceramic-category-card {
    min-height: 17.8rem;
  }

  .th-p-ceramic-tableware .ceramic-category-card > strong {
    font-size: clamp(1.55rem, 7.5vw, 2.3rem);
  }

  .th-p-ceramic-tableware .ceramic-product-ledger {
    grid-template-columns: minmax(0, 1fr);
  }

  .th-p-ceramic-tableware .ceramic-product-ledger .product-card:not(:first-child) {
    display: none;
  }
}

@media (max-width: 390px) {
  .th-p-ceramic-tableware .ceramic-hero-copy .ctas {
    align-items: stretch;
    flex-direction: column;
  }

  .th-p-ceramic-tableware .ceramic-hero-copy .btn {
    width: 100%;
  }

  .th-p-ceramic-tableware .ceramic-category-ledger {
    grid-template-columns: minmax(0, 1fr);
  }

  .th-p-ceramic-tableware .ceramic-category-card:nth-child(odd) {
    border-right: 0;
  }

  .th-p-ceramic-tableware .ceramic-category-card {
    min-height: 16rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .th-p-ceramic-tableware .ceramic-category-media img,
  .th-p-ceramic-tableware .ceramic-category-card,
  .th-p-ceramic-tableware .ceramic-category-arrow,
  .th-p-ceramic-tableware .ceramic-hero-copy .btn {
    transition: none;
  }
}
`;

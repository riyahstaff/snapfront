import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-tea',
  name: 'Moss & Kettle',
  for: 'people who turn a cup of tea into a deliberate pause',
  vibe: 'misted garden quiet, fired clay, and the slow geometry of a pour',
  category: 'Loose-leaf tea and tea ritual',
  group: 'lifestyle',
  display: 'Cormorant Garamond',
  body: 'Manrope',
  displayWeight: 500,
  tracking: '-.055em',
  colors: {
    bg: '#E7E5D7',
    surface: '#F7F4EA',
    ink: '#1D2F28',
    muted: '#647067',
    line: '#C8CBBB',
    accent: '#B66C42',
    onAccent: '#FFF9EF',
    panel: '#203A31',
    onPanel: '#EEF0DF',
    foot: '#172820',
    onFoot: '#E9E8D8',
    bar: '#DADBCD',
    onBar: '#1D2F28',
    badge: '#D7A46F',
    onBadge: '#203027',
  },
  header: 'stack',
  hero: 'collage',
  card: 'boxed',
  ratio: '4/5',
  rCard: 0,
  rBtn: 999,
  motion: 'drift',
  copy: {
    eyebrow: 'The leaf, given time',
    collection: 'The leaf library',
    cta: 'Pour something new',
    title: 'Let the day steep.',
    subtitle: 'Loose leaves and quiet tools for making space around a cup.',
  },
});

const countLabel = (count) => {
  const value = Number(count);
  if (!Number.isFinite(value)) return 'View collection';
  return `${value} ${value === 1 ? 'piece' : 'pieces'}`;
};

const categoryImage = (category) => {
  if (typeof category?.image === 'string') return category.image;
  if (typeof category?.image?.url === 'string') return category.image.url;
  return '';
};

const productImage = (product) => {
  if (typeof product?.image_url === 'string') return product.image_url;
  if (typeof product?.image?.url === 'string') return product.image.url;
  if (typeof product?.image === 'string') return product.image;
  return '';
};

const categoryInitial = (category) => String(category?.name || 'T').trim().charAt(0).toUpperCase() || 'T';

const leafIndex = (ctx, categories) => {
  if (!categories.length) {
    return `<a class="tea-index-all" href="#shop"><span>01</span><b>Browse the shelves</b><i aria-hidden="true">↘</i></a>`;
  }

  return categories.map((category, index) => `
    <a class="tea-index-link" href="${ctx.esc(ctx.categoryLink(category.name))}">
      <span>${String(index + 1).padStart(2, '0')}</span>
      <b>${ctx.esc(category.name)}</b>
      <small>${ctx.esc(countLabel(category.count))}</small>
      <i aria-hidden="true">↘</i>
    </a>`).join('');
};

const categoryShelf = (ctx, category, index) => {
  const image = categoryImage(category);
  const media = image
    ? `<span class="tea-shelf-media"><img src="${ctx.esc(image)}" alt="" loading="lazy" decoding="async"></span>`
    : `<span class="tea-shelf-media tea-shelf-empty" aria-hidden="true"><i>${ctx.esc(categoryInitial(category))}</i></span>`;

  return `
    <a class="tea-shelf-entry" href="${ctx.esc(ctx.categoryLink(category.name))}">
      <span class="tea-shelf-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
      ${media}
      <span class="tea-shelf-wording"><strong>${ctx.esc(category.name)}</strong><small>${ctx.esc(countLabel(category.count))}</small></span>
      <span class="tea-shelf-arrow" aria-hidden="true">↗</span>
    </a>`;
};

const productEntry = (ctx, product, index) => {
  const image = productImage(product);
  const alt = product?.alt_text || product?.title || 'Tea product';
  const price = Number.isFinite(Number(product?.price_cents))
    ? `<small class="tea-product-price">${ctx.esc(ctx.money(Number(product.price_cents), product.currency || 'usd', product?.billing_interval))}</small>`
    : '';
  const category = product?.category
    ? `<em>${ctx.esc(product.category)}</em>`
    : '';
  const media = image
    ? `<span class="tea-product-media"><img src="${ctx.esc(image)}" alt="${ctx.esc(alt)}" loading="lazy" decoding="async"></span>`
    : `<span class="tea-product-media tea-product-empty" aria-hidden="true"><i>${String(product?.title || 'T').trim().charAt(0).toUpperCase() || 'T'}</i></span>`;

  return `
    <a class="tea-product-entry" href="${ctx.esc(ctx.productLink(product))}">
      <span class="tea-product-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
      ${media}
      <span class="tea-product-wording"><strong>${ctx.esc(product?.title || 'Untitled product')}</strong>${category}${price}</span>
      <span class="tea-product-arrow" aria-hidden="true">↗</span>
    </a>`;
};

export function hero(ctx) {
  const categories = (Array.isArray(ctx.cats) ? ctx.cats : [])
    .filter((category) => category?.name)
    .slice(0, 3);

  return `
    <section class="hero category-hero tea-leaf-hero${ctx.heroClass || ''}"${ctx.heroAttrs || ''}>
      <p class="tea-garden-marker" aria-hidden="true"><span>FIELD NOTE</span><i></i><b>01</b></p>
      <div class="tea-hero-media-frame">
        ${ctx.media(0, { priority: true, lazy: false, decorative: false })}
      </div>
      <div class="tea-paper-pavilion">
        <div class="tea-pavilion-cap" aria-hidden="true"><span>THE POURING ROOM</span><i></i><b>∞</b></div>
        ${ctx.copy('tea-copy')}
        <p class="tea-pavilion-verse">A little room<br>inside the day.</p>
      </div>
      <aside class="tea-leaf-index" aria-label="Browse tea collections">
        <p class="tea-index-title">Leaf index</p>
        <div class="tea-index-list">${leafIndex(ctx, categories)}</div>
      </aside>
      ${ctx.controls || ''}
    </section>`;
}

export function discovery(ctx) {
  const categories = (Array.isArray(ctx.cats) ? ctx.cats : [])
    .filter((category) => category?.name)
    .slice(0, 4);
  const products = (Array.isArray(ctx.products) ? ctx.products : [])
    .filter((product) => product?.title)
    .slice(0, 4);

  if (categories.length >= 2) {
    return `
      <section class="theme-discovery tea-library" aria-labelledby="tea-library-title">
        <div class="tea-library-heading">
          <div class="tea-library-insignia" aria-hidden="true"><span></span><i></i><span></span></div>
          <p>${ctx.esc(ctx.t.copy?.collection || 'The leaf library')}</p>
          <h2 id="tea-library-title">Begin with the leaves that call to you.</h2>
          <a href="#shop">Open the full shelf <span aria-hidden="true">↘</span></a>
        </div>
        <div class="tea-shelf" role="list">${categories.map((category, index) => categoryShelf(ctx, category, index)).join('')}</div>
      </section>`;
  }

  if (products.length) {
    return `
      <section class="theme-discovery tea-library tea-product-library" aria-labelledby="tea-library-title">
        <div class="tea-library-heading">
          <div class="tea-library-insignia" aria-hidden="true"><span></span><i></i><span></span></div>
          <p>${ctx.esc(ctx.t.copy?.collection || 'From the tea table')}</p>
          <h2 id="tea-library-title">A few leaves for the next quiet moment.</h2>
          <a href="#shop">See everything <span aria-hidden="true">↘</span></a>
        </div>
        <div class="tea-product-ledger" role="list">${products.map((product, index) => productEntry(ctx, product, index)).join('')}</div>
      </section>`;
  }

  return '';
}

export const css = `
.th-p-tea {
  --tea-paper: #E7E5D7;
  --tea-surface: #F7F4EA;
  --tea-ink: #1D2F28;
  --tea-moss: #203A31;
  --tea-night: #172820;
  --tea-muted: #647067;
  --tea-line: #C8CBBB;
  --tea-clay: #B66C42;
  --tea-sand: #D7A46F;
  background: var(--tea-paper);
  color: var(--tea-ink);
}

.th-p-tea .hd,
.th-p-tea .site-header,
.th-p-tea .store-header {
  background: color-mix(in srgb, var(--tea-paper) 94%, transparent);
  border-bottom-color: color-mix(in srgb, var(--tea-ink) 15%, transparent);
  box-shadow: none;
}

.th-p-tea .hd .brand,
.th-p-tea .site-header .brand,
.th-p-tea .store-header .brand {
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-weight: 600;
  letter-spacing: .045em;
}

.th-p-tea .hd a,
.th-p-tea .site-header a,
.th-p-tea .store-header a {
  color: var(--tea-ink);
}

.th-p-tea .tea-leaf-hero {
  background: var(--tea-moss);
  box-sizing: border-box;
  color: var(--tea-surface);
  display: grid;
  grid-template-columns: minmax(2.8rem, .32fr) minmax(0, 1.18fr) minmax(12rem, .5fr);
  min-height: clamp(39rem, 50vw, 49.5rem);
  overflow: hidden;
  padding: clamp(1.1rem, 2.7vw, 2.75rem) clamp(1rem, 3.6vw, 4.5rem) clamp(3rem, 5vw, 5.2rem);
  position: relative;
}

.th-p-tea .tea-leaf-hero::before {
  border: 1px solid rgba(238, 240, 223, .24);
  content: '';
  inset: clamp(1.1rem, 2.7vw, 2.75rem) clamp(1rem, 3.6vw, 4.5rem);
  pointer-events: none;
  position: absolute;
  z-index: 3;
}

.th-p-tea .tea-garden-marker {
  align-items: center;
  color: rgba(238, 240, 223, .68);
  display: flex;
  flex-direction: column;
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .53rem;
  font-weight: 700;
  gap: .7rem;
  grid-column: 1;
  grid-row: 1;
  letter-spacing: .18em;
  margin: 1.2rem 0 0;
  position: relative;
  text-transform: uppercase;
  writing-mode: vertical-rl;
  z-index: 4;
}

.th-p-tea .tea-garden-marker i {
  background: rgba(238, 240, 223, .48);
  height: clamp(4.5rem, 10vw, 8.25rem);
  width: 1px;
}

.th-p-tea .tea-garden-marker b {
  color: var(--tea-sand);
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: 0;
}

.th-p-tea .tea-hero-media-frame {
  background: linear-gradient(135deg, #426052, #7C5C45);
  grid-column: 2 / -1;
  grid-row: 1;
  min-height: clamp(34rem, 45vw, 44rem);
  overflow: hidden;
  position: relative;
}

.th-p-tea .tea-hero-media-frame::after {
  background: linear-gradient(90deg, rgba(16, 34, 27, .34), transparent 42%), linear-gradient(0deg, rgba(16, 34, 27, .2), transparent 42%);
  content: '';
  inset: 0;
  pointer-events: none;
  position: absolute;
}

.th-p-tea .tea-hero-media-frame .hero-media,
.th-p-tea .tea-hero-media-frame .theme-empty-media {
  display: block;
  height: 100%;
  object-fit: cover;
  object-position: 63% center;
  width: 100%;
}

.th-p-tea .tea-hero-media-frame .theme-empty-media {
  background: radial-gradient(ellipse at 66% 48%, rgba(220, 187, 124, .65) 0 5%, transparent 5.5%), radial-gradient(ellipse at 72% 56%, #93A48B 0 12%, transparent 12.6%), linear-gradient(105deg, #1C332B, #6B7963 49%, #A7774E 100%);
  color: var(--tea-surface);
}

.th-p-tea .tea-paper-pavilion {
  align-self: end;
  background: var(--tea-surface);
  box-sizing: border-box;
  color: var(--tea-ink);
  grid-column: 1 / span 2;
  grid-row: 1;
  margin: 0 0 clamp(-2.2rem, -2vw, -1.2rem) clamp(-.2rem, -1vw, -.7rem);
  max-width: min(39rem, 92%);
  padding: clamp(1.35rem, 3vw, 3.1rem) clamp(1.25rem, 4vw, 4rem) clamp(1.35rem, 2.9vw, 2.85rem);
  position: relative;
  z-index: 5;
}

.th-p-tea .tea-paper-pavilion::before {
  border-left: 1px solid var(--tea-clay);
  content: '';
  height: clamp(4rem, 8vw, 7rem);
  left: .75rem;
  position: absolute;
  top: clamp(1.2rem, 2.5vw, 2.6rem);
}

.th-p-tea .tea-pavilion-cap {
  align-items: center;
  color: var(--tea-clay);
  display: flex;
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .56rem;
  font-weight: 800;
  gap: .65rem;
  letter-spacing: .16em;
  margin: 0 0 clamp(1.8rem, 4.2vw, 4.2rem);
  padding-left: clamp(.65rem, 1.15vw, 1.15rem);
  text-transform: uppercase;
}

.th-p-tea .tea-pavilion-cap i {
  background: color-mix(in srgb, var(--tea-ink) 30%, transparent);
  height: 1px;
  width: clamp(2rem, 5vw, 4.75rem);
}

.th-p-tea .tea-pavilion-cap b {
  color: var(--tea-moss);
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: 1.3rem;
  font-weight: 500;
  letter-spacing: 0;
  line-height: .5;
}

.th-p-tea .tea-copy {
  max-width: 30rem;
  padding-left: clamp(.65rem, 1.15vw, 1.15rem);
}

.th-p-tea .tea-copy .eyebrow {
  color: var(--tea-clay);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .58rem;
  font-weight: 800;
  letter-spacing: .16em;
  line-height: 1.4;
  margin: 0 0 .85rem;
  text-transform: uppercase;
}

.th-p-tea .tea-copy h1 {
  color: var(--tea-ink);
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: clamp(3.75rem, 6.5vw, 7.2rem);
  font-weight: 500;
  letter-spacing: -.075em;
  line-height: .76;
  margin: 0;
  max-width: 8.7ch;
  overflow-wrap: anywhere;
}

.th-p-tea .tea-copy h1.long {
  font-size: clamp(3rem, 5.25vw, 5.7rem);
  line-height: .82;
  max-width: 12ch;
}

.th-p-tea .tea-copy .sub {
  color: color-mix(in srgb, var(--tea-ink) 76%, transparent);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: clamp(.87rem, 1.13vw, 1rem);
  line-height: 1.6;
  margin: 1.3rem 0 0;
  max-width: 29rem;
  overflow-wrap: anywhere;
}

.th-p-tea .tea-copy .ctas {
  display: flex;
  flex-wrap: wrap;
  gap: .75rem;
  margin-top: 1.5rem;
}

.th-p-tea .tea-copy .ctas a {
  align-items: center;
  background: var(--tea-clay);
  border: 1px solid var(--tea-clay);
  border-radius: 999px;
  color: #FFF9EF;
  display: inline-flex;
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .66rem;
  font-weight: 800;
  justify-content: center;
  letter-spacing: .1em;
  min-height: 2.9rem;
  padding: 0 1.3rem;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-tea .tea-copy .ctas a:hover,
.th-p-tea .tea-copy .ctas a:focus-visible {
  background: var(--tea-moss);
  border-color: var(--tea-moss);
}

.th-p-tea .tea-pavilion-verse {
  bottom: clamp(1rem, 2vw, 2rem);
  color: color-mix(in srgb, var(--tea-ink) 48%, transparent);
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: clamp(1rem, 1.55vw, 1.35rem);
  font-style: italic;
  letter-spacing: -.02em;
  line-height: .9;
  margin: 0;
  position: absolute;
  right: clamp(1.1rem, 3vw, 3.2rem);
  text-align: right;
}

.th-p-tea .tea-leaf-index {
  align-self: start;
  background: rgba(23, 40, 32, .9);
  box-sizing: border-box;
  color: var(--tea-surface);
  grid-column: 3;
  grid-row: 1;
  margin: clamp(1.1rem, 2.4vw, 2.5rem) clamp(1.1rem, 2.4vw, 2.5rem) 0 0;
  min-width: 0;
  padding: 1.2rem 1rem 1rem;
  position: relative;
  z-index: 4;
}

.th-p-tea .tea-index-title {
  color: var(--tea-sand);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .55rem;
  font-weight: 800;
  letter-spacing: .16em;
  margin: 0 0 .7rem;
  text-transform: uppercase;
}

.th-p-tea .tea-index-list {
  border-top: 1px solid rgba(238, 240, 223, .25);
}

.th-p-tea .tea-index-link,
.th-p-tea .tea-index-all {
  align-items: center;
  border-bottom: 1px solid rgba(238, 240, 223, .2);
  color: var(--tea-surface);
  display: grid;
  gap: .15rem .45rem;
  grid-template-columns: auto minmax(0, 1fr) auto;
  min-height: 3.9rem;
  padding: .35rem 0;
  text-decoration: none;
}

.th-p-tea .tea-index-link > span,
.th-p-tea .tea-index-all > span {
  align-self: start;
  color: var(--tea-sand);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .5rem;
  font-weight: 800;
  letter-spacing: .1em;
  padding-top: .35rem;
}

.th-p-tea .tea-index-link b,
.th-p-tea .tea-index-all b {
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: 1.18rem;
  font-weight: 500;
  letter-spacing: -.035em;
  line-height: .9;
  min-width: 0;
  overflow-wrap: anywhere;
}

.th-p-tea .tea-index-link small {
  color: rgba(238, 240, 223, .66);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .51rem;
  grid-column: 2;
  letter-spacing: .07em;
  line-height: 1.2;
  text-transform: uppercase;
}

.th-p-tea .tea-index-link i,
.th-p-tea .tea-index-all i {
  color: var(--tea-sand);
  font-size: .95rem;
  font-style: normal;
  grid-column: 3;
  grid-row: 1 / span 2;
}

.th-p-tea .tea-index-all {
  grid-template-columns: auto minmax(0, 1fr) auto;
}

.th-p-tea .tea-leaf-hero .hero-motion-controls {
  bottom: 1.45rem;
  position: absolute;
  right: clamp(1.55rem, 4.5vw, 5.5rem);
  z-index: 7;
}

.th-p-tea .tea-leaf-hero .hero-motion-controls button,
.th-p-tea .tea-leaf-hero .motion-toggle {
  background: rgba(23, 40, 32, .84);
  border: 1px solid rgba(238, 240, 223, .62);
  border-radius: 999px;
  color: var(--tea-surface);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .6rem;
  font-weight: 800;
  letter-spacing: .08em;
  min-height: 2.75rem;
  padding: 0 .95rem;
  text-transform: uppercase;
}

.th-p-tea .tea-leaf-hero.has-hero-motion .tea-hero-media-frame .hero-media {
  animation: tea-drift 18s ease-in-out infinite alternate;
}

@keyframes tea-drift {
  from { transform: scale(1.025) translate3d(-.5%, .25%, 0); }
  to { transform: scale(1.09) translate3d(1%, -.65%, 0); }
}

.th-p-tea .tea-library {
  background: var(--tea-paper);
  box-sizing: border-box;
  display: grid;
  gap: clamp(2.4rem, 6vw, 7rem);
  grid-template-columns: minmax(14rem, .66fr) minmax(0, 1.34fr);
  padding: clamp(3.75rem, 8vw, 8rem) clamp(1.25rem, 6vw, 7rem) clamp(4rem, 7vw, 7.3rem);
}

.th-p-tea .tea-library-heading {
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.th-p-tea .tea-library-insignia {
  align-items: center;
  display: flex;
  gap: .55rem;
  height: 1rem;
  margin-bottom: 1.15rem;
}

.th-p-tea .tea-library-insignia span {
  background: var(--tea-clay);
  display: block;
  height: 1px;
  width: 2.2rem;
}

.th-p-tea .tea-library-insignia i {
  border: 1px solid var(--tea-clay);
  display: block;
  height: .4rem;
  transform: rotate(45deg);
  width: .4rem;
}

.th-p-tea .tea-library-heading > p {
  color: var(--tea-clay);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .6rem;
  font-weight: 800;
  letter-spacing: .16em;
  margin: 0 0 .8rem;
  text-transform: uppercase;
}

.th-p-tea .tea-library-heading h2 {
  color: var(--tea-ink);
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: clamp(3rem, 4.25vw, 5.2rem);
  font-weight: 500;
  letter-spacing: -.065em;
  line-height: .82;
  margin: 0;
  max-width: 9.5ch;
  overflow-wrap: anywhere;
}

.th-p-tea .tea-library-heading > a {
  align-items: center;
  border-bottom: 1px solid currentColor;
  color: var(--tea-ink);
  display: inline-flex;
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .64rem;
  font-weight: 800;
  gap: .5rem;
  letter-spacing: .1em;
  margin-top: 1.65rem;
  min-height: 2.75rem;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-tea .tea-library-heading > a span {
  color: var(--tea-clay);
  font-size: 1rem;
}

.th-p-tea .tea-shelf {
  border-top: 1px solid var(--tea-line);
  display: grid;
}

.th-p-tea .tea-shelf-entry {
  align-items: stretch;
  border-bottom: 1px solid var(--tea-line);
  color: var(--tea-ink);
  display: grid;
  gap: clamp(.75rem, 1.6vw, 1.65rem);
  grid-template-columns: 2.5rem minmax(5.8rem, 8.5rem) minmax(0, 1fr) 2.75rem;
  min-height: 8.5rem;
  text-decoration: none;
}

.th-p-tea .tea-shelf-number {
  align-items: flex-start;
  color: var(--tea-clay);
  display: flex;
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .55rem;
  font-weight: 800;
  justify-content: center;
  letter-spacing: .12em;
  padding-top: 1.2rem;
}

.th-p-tea .tea-shelf-media {
  background: #B8BBA6;
  display: block;
  min-height: 8.5rem;
  overflow: hidden;
  position: relative;
}

.th-p-tea .tea-shelf-media img {
  display: block;
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.th-p-tea .tea-shelf-empty {
  align-items: center;
  background: linear-gradient(135deg, #315346, #92A080);
  display: flex;
  justify-content: center;
}

.th-p-tea .tea-shelf-empty::before,
.th-p-tea .tea-shelf-empty::after {
  border: 1px solid rgba(247, 244, 234, .62);
  content: '';
  height: 33%;
  position: absolute;
  transform: rotate(45deg);
  width: 33%;
}

.th-p-tea .tea-shelf-empty::after {
  height: 52%;
  width: 52%;
}

.th-p-tea .tea-shelf-empty i {
  color: var(--tea-surface);
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: 2.3rem;
  font-style: normal;
  position: relative;
  z-index: 1;
}

.th-p-tea .tea-shelf-wording {
  align-self: center;
  display: flex;
  flex-direction: column;
  gap: .45rem;
  min-width: 0;
}

.th-p-tea .tea-shelf-wording strong {
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: clamp(1.7rem, 2.7vw, 3rem);
  font-weight: 500;
  letter-spacing: -.052em;
  line-height: .85;
  overflow-wrap: anywhere;
}

.th-p-tea .tea-shelf-wording small {
  color: var(--tea-muted);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .58rem;
  font-weight: 700;
  letter-spacing: .11em;
  text-transform: uppercase;
}

.th-p-tea .tea-shelf-arrow {
  align-items: center;
  color: var(--tea-clay);
  display: flex;
  font-size: 1.4rem;
  justify-content: center;
}

.th-p-tea .tea-product-library {
  grid-template-columns: minmax(14rem, .66fr) minmax(0, 1.34fr);
}

.th-p-tea .tea-product-ledger {
  border-top: 1px solid var(--tea-line);
  display: grid;
}

.th-p-tea .tea-product-entry {
  align-items: stretch;
  border-bottom: 1px solid var(--tea-line);
  color: var(--tea-ink);
  display: grid;
  gap: clamp(.75rem, 1.6vw, 1.65rem);
  grid-template-columns: 2.5rem minmax(5.8rem, 8.5rem) minmax(0, 1fr) 2.75rem;
  min-height: 8.5rem;
  text-decoration: none;
}

.th-p-tea .tea-product-number {
  align-items: flex-start;
  color: var(--tea-clay);
  display: flex;
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .55rem;
  font-weight: 800;
  justify-content: center;
  letter-spacing: .12em;
  padding-top: 1.2rem;
}

.th-p-tea .tea-product-media {
  background: #B8BBA6;
  display: block;
  min-height: 8.5rem;
  overflow: hidden;
  position: relative;
}

.th-p-tea .tea-product-media img {
  display: block;
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.th-p-tea .tea-product-empty {
  align-items: center;
  background: linear-gradient(135deg, #315346, #92A080);
  display: flex;
  justify-content: center;
}

.th-p-tea .tea-product-empty i {
  border: 1px solid rgba(247, 244, 234, .7);
  color: var(--tea-surface);
  display: grid;
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: 2.3rem;
  font-style: normal;
  height: 46%;
  place-items: center;
  transform: rotate(45deg);
  width: 46%;
}

.th-p-tea .tea-product-empty i::first-letter {
  transform: rotate(-45deg);
}

.th-p-tea .tea-product-wording {
  align-self: center;
  display: flex;
  flex-direction: column;
  gap: .35rem;
  min-width: 0;
}

.th-p-tea .tea-product-wording strong {
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: clamp(1.65rem, 2.45vw, 2.75rem);
  font-weight: 500;
  letter-spacing: -.05em;
  line-height: .88;
  overflow-wrap: anywhere;
}

.th-p-tea .tea-product-wording em {
  color: var(--tea-muted);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .56rem;
  font-style: normal;
  font-weight: 700;
  letter-spacing: .11em;
  text-transform: uppercase;
}

.th-p-tea .tea-product-price {
  color: var(--tea-clay);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .7rem;
  font-weight: 800;
  letter-spacing: .03em;
}

.th-p-tea .tea-product-arrow {
  align-items: center;
  color: var(--tea-clay);
  display: flex;
  font-size: 1.4rem;
  justify-content: center;
}

.th-p-tea #shop {
  background: var(--tea-surface);
  padding-bottom: clamp(4rem, 7vw, 7rem);
  padding-top: clamp(3.75rem, 6vw, 6rem);
}

.th-p-tea #shop .section-title,
.th-p-tea #shop .sec-h h2,
.th-p-tea #shop h2 {
  color: var(--tea-ink);
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-weight: 500;
  letter-spacing: -.05em;
}

.th-p-tea #shop .product-card,
.th-p-tea #shop .pc {
  background: var(--tea-paper);
  border: 1px solid var(--tea-line);
  border-radius: 0;
  box-shadow: none;
}

.th-p-tea #shop .product-card img,
.th-p-tea #shop .pc img,
.th-p-tea #shop .product-card .im,
.th-p-tea #shop .pc .im {
  border-radius: 0;
}

.th-p-tea #shop .chip {
  border-color: var(--tea-line);
  border-radius: 999px;
  color: var(--tea-ink);
  min-height: 2.75rem;
}

.th-p-tea #shop .chip.on,
.th-p-tea #shop .chip:hover {
  background: var(--tea-moss);
  border-color: var(--tea-moss);
  color: var(--tea-surface);
}

.th-p-tea .tea-copy .ctas a:focus-visible,
.th-p-tea .tea-index-link:focus-visible,
.th-p-tea .tea-index-all:focus-visible,
.th-p-tea .tea-library a:focus-visible {
  outline: 2px solid var(--tea-clay);
  outline-offset: 4px;
}

@media (max-width: 920px) {
  .th-p-tea .tea-leaf-hero {
    grid-template-columns: minmax(2.4rem, .22fr) minmax(0, 1fr) minmax(10.5rem, .42fr);
    min-height: 42rem;
  }

  .th-p-tea .tea-paper-pavilion {
    max-width: min(35rem, 92%);
  }

  .th-p-tea .tea-copy h1 {
    font-size: clamp(3.5rem, 7.6vw, 5.8rem);
  }

  .th-p-tea .tea-pavilion-verse {
    display: none;
  }

  .th-p-tea .tea-index-link b,
  .th-p-tea .tea-index-all b {
    font-size: 1.05rem;
  }

  .th-p-tea .tea-library {
    gap: clamp(2rem, 5vw, 4rem);
  }
}

@media (max-width: 680px) {
  .th-p-tea .tea-leaf-hero {
    display: flex;
    flex-direction: column;
    min-height: 0;
    padding: 1rem 1rem 3.8rem;
  }

  .th-p-tea .tea-leaf-hero::before {
    inset: 1rem;
  }

  .th-p-tea .tea-garden-marker {
    align-items: center;
    flex-direction: row;
    gap: .55rem;
    margin: .7rem 0 .65rem .65rem;
    order: 0;
    writing-mode: horizontal-tb;
  }

  .th-p-tea .tea-garden-marker i {
    height: 1px;
    width: 3.5rem;
  }

  .th-p-tea .tea-hero-media-frame {
    min-height: min(112vw, 34rem);
    order: 1;
  }

  .th-p-tea .tea-hero-media-frame .hero-media,
  .th-p-tea .tea-hero-media-frame .theme-empty-media {
    object-position: 63% center;
  }

  .th-p-tea .tea-paper-pavilion {
    align-self: stretch;
    margin: -5.25rem .7rem 0 0;
    max-width: none;
    order: 2;
    padding: 1.35rem 1.25rem 1.4rem;
  }

  .th-p-tea .tea-paper-pavilion::before {
    height: 3.7rem;
    left: .68rem;
    top: 1.15rem;
  }

  .th-p-tea .tea-pavilion-cap {
    font-size: .5rem;
    margin-bottom: 1.7rem;
  }

  .th-p-tea .tea-copy h1 {
    font-size: clamp(3.45rem, 15vw, 5rem);
    max-width: 9.5ch;
  }

  .th-p-tea .tea-copy h1.long {
    font-size: clamp(2.85rem, 12vw, 4.25rem);
  }

  .th-p-tea .tea-copy .sub {
    font-size: .9rem;
    margin-top: 1.05rem;
  }

  .th-p-tea .tea-copy .ctas a {
    flex: 1 1 11rem;
  }

  .th-p-tea .tea-leaf-index {
    align-self: stretch;
    margin: 0 .7rem 0 0;
    order: 3;
    padding: 1rem 1rem .65rem;
  }

  .th-p-tea .tea-index-list {
    display: grid;
  }

  .th-p-tea .tea-index-link,
  .th-p-tea .tea-index-all {
    min-height: 3.35rem;
  }

  .th-p-tea .tea-leaf-hero .hero-motion-controls {
    bottom: .25rem;
    right: 1.6rem;
  }

  .th-p-tea .tea-library,
  .th-p-tea .tea-product-library {
    display: block;
    padding: 3.8rem 1.25rem 4.2rem;
  }

  .th-p-tea .tea-library-heading {
    margin-bottom: 2.5rem;
  }

  .th-p-tea .tea-library-heading h2 {
    font-size: clamp(3rem, 12.5vw, 4.3rem);
    max-width: 10.5ch;
  }

  .th-p-tea .tea-shelf-entry,
  .th-p-tea .tea-product-entry {
    gap: .75rem;
    grid-template-columns: 1.75rem 5.5rem minmax(0, 1fr) 2rem;
    min-height: 6.6rem;
  }

  .th-p-tea .tea-shelf-media,
  .th-p-tea .tea-product-media {
    min-height: 6.6rem;
  }

  .th-p-tea .tea-shelf-number,
  .th-p-tea .tea-product-number {
    font-size: .49rem;
    padding-top: .95rem;
  }

  .th-p-tea .tea-shelf-wording strong,
  .th-p-tea .tea-product-wording strong {
    font-size: clamp(1.6rem, 7vw, 2.2rem);
  }
}

@media (max-width: 400px) {
  .th-p-tea .tea-leaf-hero {
    padding-right: .75rem;
    padding-left: .75rem;
  }

  .th-p-tea .tea-leaf-hero::before {
    inset: .75rem;
  }

  .th-p-tea .tea-paper-pavilion,
  .th-p-tea .tea-leaf-index {
    margin-right: .45rem;
  }

  .th-p-tea .tea-copy h1 {
    font-size: clamp(3.2rem, 14vw, 4.25rem);
  }

  .th-p-tea .tea-library,
  .th-p-tea .tea-product-library {
    padding-right: 1rem;
    padding-left: 1rem;
  }

  .th-p-tea .tea-shelf-entry,
  .th-p-tea .tea-product-entry {
    grid-template-columns: 1.4rem 4.7rem minmax(0, 1fr) 1.5rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .th-p-tea .tea-leaf-hero.has-hero-motion .tea-hero-media-frame .hero-media {
    animation: none;
    transform: none;
  }
}
`;

import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-books',
  name: 'Marginalia House',
  for: 'readers building a shelf with feeling and intention',
  vibe: 'after-hours library light, linen paper, and a quietly cinematic reading room',
  category: 'Independent books and reading editions',
  group: 'lifestyle',
  display: 'Cormorant Garamond',
  body: 'Manrope',
  displayWeight: 600,
  tracking: '-.045em',
  colors: {
    bg: '#EAE3D6',
    surface: '#F8F4EC',
    ink: '#192A31',
    muted: '#6F716B',
    line: '#C9BBA8',
    accent: '#A44B36',
    onAccent: '#FFF8EE',
    panel: '#19343A',
    onPanel: '#F4E9D7',
    foot: '#15272D',
    onFoot: '#F8F0E3',
    bar: '#E0D5C3',
    onBar: '#192A31',
    badge: '#D7B36E',
    onBadge: '#192A31',
  },
  header: 'center',
  hero: 'editorial',
  card: 'minimal',
  ratio: '3/4',
  rCard: 0,
  rBtn: 0,
  motion: 'drift',
  copy: {
    eyebrow: 'An independent reading room',
    collection: 'The open shelf',
    cta: 'Browse the shelf',
    title: 'Books for the part that stays awake.',
    subtitle: 'A considered shelf of stories, ideas, and beautiful objects to return to.',
  },
  collection: 'premium',
  family: 'books',
  demoPhoto: '/assets/themes/books-hero.webp',
});

const labelCount = (count) => {
  const value = Number(count);
  if (!Number.isFinite(value)) return 'Browse shelf';
  return `${value} ${value === 1 ? 'title' : 'titles'}`;
};

const mediaUrl = (value) => {
  if (typeof value === 'string') return value;
  if (typeof value?.url === 'string') return value.url;
  return '';
};

const categoryVisual = (ctx, category) => {
  const url = mediaUrl(category?.image);
  if (url) {
    return `<img src="${ctx.esc(url)}" alt="" loading="lazy" decoding="async">`;
  }

  const initial = String(category?.name || 'M').trim().charAt(0).toUpperCase() || 'M';
  return `<span class="books-empty-cover" aria-hidden="true"><i>${ctx.esc(initial)}</i><b></b></span>`;
};

const productVisual = (ctx, product) => {
  const url = mediaUrl(product?.image_url || product?.image);
  if (url) {
    return `<img src="${ctx.esc(url)}" alt="${ctx.esc(product.alt_text || product.title || '')}" loading="lazy" decoding="async">`;
  }

  return '<span class="books-empty-product" aria-hidden="true"><i></i><i></i><i></i></span>';
};

const shelfLinks = (ctx, categories) => {
  if (!categories.length) {
    return `<a class="books-shelf-all" href="#shop"><span>01</span><b>See what is on the shelf</b><i aria-hidden="true">→</i></a>`;
  }

  return categories.map((category, index) => `
    <a class="books-shelf-link" href="${ctx.esc(ctx.categoryLink(category.name))}">
      <span>${String(index + 1).padStart(2, '0')}</span>
      <b>${ctx.esc(category.name)}</b>
      <small>${ctx.esc(labelCount(category.count))}</small>
      <i aria-hidden="true">→</i>
    </a>`).join('');
};

export function hero(ctx) {
  const categories = (Array.isArray(ctx.cats) ? ctx.cats : [])
    .filter((category) => category?.name)
    .slice(0, 3);

  return `
    <section class="hero category-hero books-chapter-hero${ctx.heroClass || ''}"${ctx.heroAttrs || ''}>
      <div class="books-running-head" aria-hidden="true">
        <span>Marginalia House</span><i></i><span>Volume one</span>
      </div>
      <div class="books-chapter-grid">
        <div class="books-title-page">
          <span class="books-chapter-number" aria-hidden="true">01</span>
          ${ctx.copy('books-copy')}
          <p class="books-title-page-note">A shelf is a private map, made one book at a time.</p>
        </div>
        <div class="books-folio-media">
          ${ctx.media(0, { priority: true, lazy: false, decorative: false })}
          <span class="books-folio-mark" aria-hidden="true">M</span>
          <span class="books-folio-caption" aria-hidden="true">Reading room / after light</span>
        </div>
        <aside class="books-shelf-index" aria-label="Browse book collections">
          <p class="books-index-kicker">Choose a shelf</p>
          <div class="books-shelf-links">${shelfLinks(ctx, categories)}</div>
          <a class="books-index-all" href="#shop">Browse all books <span aria-hidden="true">↗</span></a>
          <p class="books-index-colophon">Read slowly.<br>Keep what moves you.</p>
        </aside>
      </div>
      ${ctx.controls || ''}
    </section>`;
}

export function discovery(ctx) {
  const categories = (Array.isArray(ctx.cats) ? ctx.cats : [])
    .filter((category) => category?.name)
    .slice(0, 4);
  const products = (Array.isArray(ctx.products) ? ctx.products : [])
    .filter((product) => product?.title)
    .slice(0, 3);

  if (categories.length >= 2) {
    return `
      <section class="theme-discovery books-discovery" aria-labelledby="books-discovery-title">
        <div class="books-discovery-heading">
          <p class="books-discovery-kicker">${ctx.esc(ctx.t.copy?.collection || 'The open shelf')}</p>
          <h2 id="books-discovery-title">Follow the thought that brought you here.</h2>
          <p>Begin with a collection, then let the next title find its place.</p>
        </div>
        <div class="books-catalogue-grid">
          ${categories.map((category, index) => `
            <a class="books-catalogue-card" href="${ctx.esc(ctx.categoryLink(category.name))}">
              <span class="books-catalogue-number">${String(index + 1).padStart(2, '0')}</span>
              <span class="books-catalogue-image">${categoryVisual(ctx, category)}</span>
              <span class="books-catalogue-copy">
                <small>Collection</small>
                <strong>${ctx.esc(category.name)}</strong>
                <em>${ctx.esc(labelCount(category.count))}</em>
              </span>
              <span class="books-catalogue-arrow" aria-hidden="true">↗</span>
            </a>`).join('')}
        </div>
        <a class="books-discovery-all" href="#shop">See the full shelf <span aria-hidden="true">→</span></a>
      </section>`;
  }

  if (products.length) {
    return `
      <section class="theme-discovery books-discovery books-product-discovery" aria-labelledby="books-discovery-title">
        <div class="books-discovery-heading">
          <p class="books-discovery-kicker">${ctx.esc(ctx.t.copy?.collection || 'The open shelf')}</p>
          <h2 id="books-discovery-title">A few stories, waiting in the margin.</h2>
          <p>Browse the titles currently on this shelf.</p>
        </div>
        <div class="books-product-ledger">
          ${products.map((product, index) => {
            const price = Number.isFinite(Number(product.price_cents))
              ? `<em>${ctx.esc(ctx.money(Number(product.price_cents), product.currency || 'usd', product?.billing_interval))}</em>`
              : '';
            const category = product.category ? `<small>${ctx.esc(product.category)}</small>` : '';
            return `
              <a class="books-product-entry" href="${ctx.esc(ctx.productLink(product))}">
                <span class="books-product-number">${String(index + 1).padStart(2, '0')}</span>
                <span class="books-product-image">${productVisual(ctx, product)}</span>
                <span class="books-product-copy"><b>${ctx.esc(product.title)}</b>${category}${price}</span>
                <span class="books-product-arrow" aria-hidden="true">↗</span>
              </a>`;
          }).join('')}
        </div>
        <a class="books-discovery-all" href="#shop">See the full shelf <span aria-hidden="true">→</span></a>
      </section>`;
  }

  return '';
}

export const css = `
.th-p-books {
  --books-paper: #EAE3D6;
  --books-cream: #F8F4EC;
  --books-ink: #192A31;
  --books-muted: #6F716B;
  --books-line: #C9BBA8;
  --books-rust: #A44B36;
  --books-gold: #D7B36E;
  --books-night: #19343A;
  background: var(--books-paper);
  color: var(--books-ink);
}

.th-p-books .hd,
.th-p-books .site-header,
.th-p-books .store-header {
  background: color-mix(in srgb, var(--books-cream) 94%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--books-ink) 16%, transparent);
  box-shadow: none;
}

.th-p-books .hd .brand,
.th-p-books .site-header .brand,
.th-p-books .store-header .brand {
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-weight: 600;
  letter-spacing: .055em;
}

.th-p-books .books-chapter-hero {
  background: var(--books-paper);
  box-sizing: border-box;
  color: var(--books-ink);
  isolation: isolate;
  min-height: clamp(39rem, 54vw, 49rem);
  overflow: hidden;
  padding: clamp(1rem, 1.75vw, 1.8rem) clamp(1rem, 3.7vw, 4.8rem) clamp(1.75rem, 3.5vw, 3.8rem);
  position: relative;
}

.th-p-books .books-running-head {
  align-items: center;
  border-bottom: 1px solid var(--books-line);
  color: var(--books-muted);
  display: flex;
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .6rem;
  font-weight: 700;
  gap: .75rem;
  justify-content: space-between;
  letter-spacing: .18em;
  margin: 0 auto;
  max-width: 92rem;
  padding: 0 0 .75rem;
  text-transform: uppercase;
}

.th-p-books .books-running-head i {
  background: var(--books-rust);
  display: block;
  height: .35rem;
  transform: rotate(45deg);
  width: .35rem;
}

.th-p-books .books-chapter-grid {
  display: grid;
  gap: clamp(1rem, 2.4vw, 2.8rem);
  grid-template-columns: minmax(13rem, .95fr) minmax(17rem, 1.35fr) minmax(13rem, .75fr);
  margin: 0 auto;
  max-width: 92rem;
  min-height: clamp(34rem, 47vw, 43rem);
  padding-top: clamp(1.35rem, 2.6vw, 2.7rem);
}

.th-p-books .books-title-page {
  align-self: stretch;
  border-right: 1px solid var(--books-line);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: clamp(.2rem, 1vw, .85rem) clamp(1rem, 2.2vw, 2.8rem) 1.1rem 0;
  position: relative;
}

.th-p-books .books-chapter-number {
  color: var(--books-rust);
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: clamp(4.75rem, 8vw, 8.5rem);
  font-weight: 500;
  letter-spacing: -.09em;
  line-height: .62;
  margin: 0 0 clamp(2rem, 4vw, 4.5rem);
}

.th-p-books .books-copy .eyebrow,
.th-p-books .books-discovery-kicker,
.th-p-books .books-index-kicker,
.th-p-books .books-catalogue-copy small {
  color: var(--books-rust);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .58rem;
  font-weight: 800;
  letter-spacing: .19em;
  line-height: 1.35;
  margin: 0 0 .85rem;
  text-transform: uppercase;
}

.th-p-books .books-copy h1 {
  color: var(--books-ink);
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: clamp(3.5rem, 5.45vw, 6.6rem);
  font-weight: 600;
  letter-spacing: -.072em;
  line-height: .79;
  margin: 0;
  max-width: 8.5ch;
  overflow-wrap: anywhere;
}

.th-p-books .books-copy h1.long {
  font-size: clamp(3rem, 4.6vw, 5.65rem);
  line-height: .84;
  max-width: 11ch;
}

.th-p-books .books-copy .sub {
  color: var(--books-muted);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: clamp(.85rem, 1.05vw, 1rem);
  line-height: 1.58;
  margin: 1.45rem 0 0;
  max-width: 28rem;
  overflow-wrap: anywhere;
}

.th-p-books .books-copy .ctas {
  display: flex;
  flex-wrap: wrap;
  gap: .7rem;
  margin-top: 1.45rem;
}

.th-p-books .books-copy .ctas a {
  align-items: center;
  background: var(--books-rust);
  border: 1px solid var(--books-rust);
  color: var(--books-cream);
  display: inline-flex;
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .65rem;
  font-weight: 800;
  justify-content: center;
  letter-spacing: .08em;
  min-height: 2.8rem;
  padding: 0 1.15rem;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-books .books-copy .ctas a:hover,
.th-p-books .books-copy .ctas a:focus-visible {
  background: var(--books-night);
  border-color: var(--books-night);
}

.th-p-books .books-title-page-note {
  border-top: 1px solid var(--books-line);
  color: var(--books-muted);
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: 1.1rem;
  font-style: italic;
  line-height: 1.08;
  margin: auto 0 0;
  max-width: 12ch;
  padding-top: .9rem;
}

.th-p-books .books-folio-media {
  align-self: center;
  aspect-ratio: 4 / 5;
  background: #34515A;
  box-shadow: 14px 14px 0 color-mix(in srgb, var(--books-rust) 82%, transparent);
  max-height: clamp(31rem, 43vw, 39rem);
  overflow: hidden;
  position: relative;
  width: 100%;
}

.th-p-books .books-folio-media .hero-media,
.th-p-books .books-folio-media .theme-empty-media {
  display: block;
  height: 100%;
  max-width: none;
  object-fit: cover;
  object-position: 61% center;
  width: 100%;
}

.th-p-books .books-folio-media .theme-empty-media {
  background:
    linear-gradient(137deg, transparent 46%, rgba(248, 244, 236, .35) 46.4% 47.5%, transparent 48%),
    radial-gradient(ellipse at 66% 38%, #D9AD70 0 10%, transparent 10.4%),
    linear-gradient(150deg, #203C45 0 44%, #7E392E 44% 55%, #D7B36E 55% 65%, #E9DFCF 65% 100%);
  color: var(--books-cream);
}

.th-p-books .books-folio-media::after {
  background: linear-gradient(180deg, rgba(18, 31, 35, .02), rgba(18, 31, 35, .4));
  content: '';
  inset: 0;
  pointer-events: none;
  position: absolute;
}

.th-p-books .books-folio-mark {
  align-items: center;
  border: 1px solid rgba(248, 244, 236, .75);
  bottom: 1rem;
  color: var(--books-cream);
  display: inline-flex;
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: 1.5rem;
  height: 2.3rem;
  justify-content: center;
  left: 1rem;
  position: absolute;
  width: 2.3rem;
  z-index: 1;
}

.th-p-books .books-folio-caption {
  bottom: 1.3rem;
  color: rgba(248, 244, 236, .85);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .52rem;
  font-weight: 700;
  letter-spacing: .15em;
  position: absolute;
  right: 1rem;
  text-transform: uppercase;
  writing-mode: vertical-rl;
  z-index: 1;
}

.th-p-books .books-shelf-index {
  border-left: 1px solid var(--books-line);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: clamp(.4rem, 1vw, 1rem) 0 clamp(.7rem, 1.25vw, 1.25rem) clamp(1rem, 2vw, 2.15rem);
}

.th-p-books .books-index-kicker {
  margin-bottom: 1rem;
}

.th-p-books .books-shelf-links {
  border-top: 1px solid var(--books-line);
}

.th-p-books .books-shelf-link,
.th-p-books .books-shelf-all {
  align-items: center;
  border-bottom: 1px solid var(--books-line);
  color: var(--books-ink);
  display: grid;
  gap: .25rem .65rem;
  grid-template-columns: auto minmax(0, 1fr) auto;
  min-height: 4.6rem;
  padding: .45rem 0;
  text-decoration: none;
}

.th-p-books .books-shelf-link > span,
.th-p-books .books-shelf-all > span {
  color: var(--books-rust);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .52rem;
  font-weight: 800;
  grid-row: span 2;
  letter-spacing: .12em;
}

.th-p-books .books-shelf-link b,
.th-p-books .books-shelf-all b {
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: 1.38rem;
  font-weight: 600;
  letter-spacing: -.03em;
  line-height: .9;
  min-width: 0;
  overflow-wrap: anywhere;
}

.th-p-books .books-shelf-link small {
  color: var(--books-muted);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .52rem;
  font-weight: 700;
  grid-column: 2;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.th-p-books .books-shelf-link i,
.th-p-books .books-shelf-all i {
  align-self: center;
  color: var(--books-rust);
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: 1.25rem;
  font-style: normal;
  grid-column: 3;
  grid-row: 1 / span 2;
}

.th-p-books .books-shelf-all {
  grid-template-columns: auto minmax(0, 1fr) auto;
}

.th-p-books .books-index-all,
.th-p-books .books-discovery-all {
  align-items: center;
  border-bottom: 1px solid currentColor;
  color: var(--books-rust);
  display: inline-flex;
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .6rem;
  font-weight: 800;
  gap: .55rem;
  letter-spacing: .1em;
  min-height: 2.75rem;
  text-decoration: none;
  text-transform: uppercase;
  width: max-content;
}

.th-p-books .books-index-all {
  margin-top: 1.1rem;
}

.th-p-books .books-index-colophon {
  color: var(--books-muted);
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: 1.05rem;
  font-style: italic;
  line-height: 1.02;
  margin: auto 0 0;
  padding-top: 1rem;
}

.th-p-books .books-chapter-hero .hero-motion-controls {
  bottom: 1.35rem;
  position: absolute;
  right: clamp(1rem, 3.7vw, 4.8rem);
  z-index: 3;
}

.th-p-books .books-chapter-hero .hero-motion-controls button {
  background: var(--books-night);
  border: 1px solid rgba(248, 244, 236, .7);
  border-radius: 0;
  color: var(--books-cream);
  min-height: 2.75rem;
}

.th-p-books .books-chapter-hero.has-hero-motion .books-folio-media .hero-media {
  animation: books-page-drift 18s ease-in-out infinite alternate;
}

@keyframes books-page-drift {
  from { transform: scale(1.025) translate3d(-.55%, .15%, 0); }
  to { transform: scale(1.085) translate3d(.75%, -.6%, 0); }
}

.th-p-books .books-discovery {
  background: var(--books-cream);
  box-sizing: border-box;
  padding: clamp(3.75rem, 7.5vw, 7.5rem) clamp(1rem, 4.7vw, 5rem) clamp(3.5rem, 6.2vw, 6.4rem);
}

.th-p-books .books-discovery-heading {
  border-bottom: 1px solid var(--books-line);
  display: grid;
  gap: 1rem clamp(1rem, 4vw, 5rem);
  grid-template-columns: minmax(0, 1.25fr) minmax(13rem, .55fr);
  margin: 0 auto clamp(2rem, 4vw, 4rem);
  max-width: 92rem;
  padding-bottom: clamp(1.5rem, 3vw, 3rem);
}

.th-p-books .books-discovery-kicker {
  grid-column: 1 / -1;
  margin-bottom: 0;
}

.th-p-books .books-discovery-heading h2 {
  color: var(--books-ink);
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: clamp(3rem, 5.7vw, 6.3rem);
  font-weight: 600;
  grid-column: 1;
  letter-spacing: -.072em;
  line-height: .79;
  margin: 0;
  max-width: 9.8ch;
  overflow-wrap: anywhere;
}

.th-p-books .books-discovery-heading > p:last-child {
  align-self: end;
  color: var(--books-muted);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .93rem;
  grid-column: 2;
  line-height: 1.6;
  margin: 0;
  max-width: 24rem;
}

.th-p-books .books-catalogue-grid {
  border-left: 1px solid var(--books-line);
  border-top: 1px solid var(--books-line);
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0 auto;
  max-width: 92rem;
}

.th-p-books .books-catalogue-card {
  color: var(--books-ink);
  display: grid;
  grid-template-columns: 2.6rem minmax(5.7rem, .62fr) minmax(0, 1fr) 2.7rem;
  min-height: clamp(11.5rem, 18vw, 16rem);
  min-width: 0;
  position: relative;
  text-decoration: none;
}

.th-p-books .books-catalogue-card:nth-child(odd) {
  background: #F2EBDC;
}

.th-p-books .books-catalogue-card:nth-child(even) {
  background: #E8DFD0;
}

.th-p-books .books-catalogue-card:nth-child(4n + 1),
.th-p-books .books-catalogue-card:nth-child(4n + 2) {
  border-bottom: 1px solid var(--books-line);
}

.th-p-books .books-catalogue-card:nth-child(odd) {
  border-right: 1px solid var(--books-line);
}

.th-p-books .books-catalogue-number {
  align-items: start;
  border-right: 1px solid var(--books-line);
  color: var(--books-rust);
  display: flex;
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .57rem;
  font-weight: 800;
  justify-content: center;
  letter-spacing: .12em;
  padding-top: 1rem;
}

.th-p-books .books-catalogue-image {
  align-self: stretch;
  margin: clamp(.8rem, 1.35vw, 1.35rem) 0;
  overflow: hidden;
  position: relative;
}

.th-p-books .books-catalogue-image img {
  display: block;
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.th-p-books .books-empty-cover {
  align-items: center;
  background: linear-gradient(155deg, #A54E37, #71332B 55%, #1C3941 56%);
  color: var(--books-cream);
  display: flex;
  height: 100%;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

.th-p-books .books-empty-cover::before,
.th-p-books .books-empty-cover::after {
  border: 1px solid rgba(248, 244, 236, .55);
  content: '';
  height: 72%;
  position: absolute;
  width: 68%;
}

.th-p-books .books-empty-cover::after {
  transform: rotate(45deg);
}

.th-p-books .books-empty-cover i {
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: clamp(3rem, 5vw, 4.8rem);
  font-style: normal;
  position: relative;
  z-index: 1;
}

.th-p-books .books-empty-cover b {
  background: var(--books-gold);
  bottom: 0;
  height: .7rem;
  position: absolute;
  right: 0;
  width: 45%;
}

.th-p-books .books-catalogue-copy {
  align-items: flex-start;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: clamp(1rem, 1.8vw, 1.75rem) .85rem;
}

.th-p-books .books-catalogue-copy small {
  color: var(--books-muted);
  font-size: .5rem;
  margin-bottom: auto;
}

.th-p-books .books-catalogue-copy strong {
  color: var(--books-ink);
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: clamp(1.65rem, 2.45vw, 2.8rem);
  font-weight: 600;
  letter-spacing: -.05em;
  line-height: .85;
  overflow-wrap: anywhere;
}

.th-p-books .books-catalogue-copy em {
  color: var(--books-rust);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .56rem;
  font-style: normal;
  font-weight: 800;
  letter-spacing: .08em;
  margin-top: .8rem;
  text-transform: uppercase;
}

.th-p-books .books-catalogue-arrow {
  align-items: flex-end;
  border-left: 1px solid var(--books-line);
  color: var(--books-rust);
  display: flex;
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: 1.4rem;
  justify-content: center;
  padding-bottom: 1rem;
}

.th-p-books .books-discovery-all {
  color: var(--books-ink);
  margin: clamp(1.5rem, 3vw, 2.75rem) auto 0;
}

.th-p-books .books-product-ledger {
  border-top: 1px solid var(--books-line);
  margin: 0 auto;
  max-width: 92rem;
}

.th-p-books .books-product-entry {
  align-items: stretch;
  border-bottom: 1px solid var(--books-line);
  color: var(--books-ink);
  display: grid;
  gap: clamp(.8rem, 1.7vw, 1.75rem);
  grid-template-columns: 2.7rem minmax(7rem, 11rem) minmax(0, 1fr) 2.8rem;
  min-height: 9.5rem;
  text-decoration: none;
}

.th-p-books .books-product-number {
  align-items: center;
  border-right: 1px solid var(--books-line);
  color: var(--books-rust);
  display: flex;
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .57rem;
  font-weight: 800;
  justify-content: center;
  letter-spacing: .12em;
}

.th-p-books .books-product-image {
  background: #D8CAB5;
  margin: .9rem 0;
  overflow: hidden;
  position: relative;
}

.th-p-books .books-product-image img {
  display: block;
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.th-p-books .books-empty-product {
  align-items: center;
  background: linear-gradient(135deg, #1E3B42, #52716D);
  display: flex;
  gap: .35rem;
  height: 100%;
  justify-content: center;
}

.th-p-books .books-empty-product i {
  background: var(--books-cream);
  display: block;
  height: 56%;
  transform: skewY(-11deg);
  width: .6rem;
}

.th-p-books .books-empty-product i:nth-child(2) {
  background: var(--books-rust);
  height: 72%;
}

.th-p-books .books-empty-product i:nth-child(3) {
  background: var(--books-gold);
  height: 43%;
}

.th-p-books .books-product-copy {
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  padding: 1rem 0;
}

.th-p-books .books-product-copy b {
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: clamp(1.55rem, 2.5vw, 2.55rem);
  font-weight: 600;
  letter-spacing: -.04em;
  line-height: .9;
  overflow-wrap: anywhere;
}

.th-p-books .books-product-copy small {
  color: var(--books-muted);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .56rem;
  font-weight: 800;
  letter-spacing: .1em;
  margin-top: .5rem;
  text-transform: uppercase;
}

.th-p-books .books-product-copy em {
  color: var(--books-rust);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .75rem;
  font-style: normal;
  font-weight: 800;
  margin-top: .55rem;
}

.th-p-books .books-product-arrow {
  align-items: center;
  border-left: 1px solid var(--books-line);
  color: var(--books-rust);
  display: flex;
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: 1.5rem;
  justify-content: center;
}

.th-p-books #shop {
  background: var(--books-paper);
  padding-top: clamp(3.5rem, 6vw, 6.25rem);
}

.th-p-books #shop .sec-h h2,
.th-p-books #shop .section-title,
.th-p-books #shop h2 {
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-weight: 600;
  letter-spacing: -.045em;
}

.th-p-books #shop .chip {
  border-radius: 0;
}

.th-p-books #shop .chip.on,
.th-p-books #shop .chip:hover {
  background: var(--books-rust);
  border-color: var(--books-rust);
  color: var(--books-cream);
}

.th-p-books #shop .pc,
.th-p-books #shop .product-card {
  border: 1px solid var(--books-line);
  border-radius: 0;
  box-shadow: none;
}

.th-p-books #shop .pc .im,
.th-p-books #shop .product-card img {
  border-radius: 0;
}

.th-p-books .books-copy .ctas a:focus-visible,
.th-p-books .books-shelf-index a:focus-visible,
.th-p-books .books-discovery a:focus-visible {
  outline: 2px solid var(--books-rust);
  outline-offset: 4px;
}

@media (max-width: 980px) {
  .th-p-books .books-chapter-grid {
    gap: 1.3rem;
    grid-template-columns: minmax(13rem, .93fr) minmax(16rem, 1.2fr) minmax(11.2rem, .7fr);
  }

  .th-p-books .books-title-page {
    padding-right: 1.25rem;
  }

  .th-p-books .books-copy h1 {
    font-size: clamp(3.25rem, 5.65vw, 5rem);
  }

  .th-p-books .books-folio-media {
    box-shadow: 10px 10px 0 color-mix(in srgb, var(--books-rust) 82%, transparent);
  }

  .th-p-books .books-shelf-index {
    padding-left: 1rem;
  }

  .th-p-books .books-shelf-link b,
  .th-p-books .books-shelf-all b {
    font-size: 1.2rem;
  }
}

@media (max-width: 720px) {
  .th-p-books .books-chapter-hero {
    min-height: 0;
    padding: 1rem 1rem 4.4rem;
  }

  .th-p-books .books-running-head {
    font-size: .53rem;
  }

  .th-p-books .books-chapter-grid {
    display: grid;
    gap: 1.6rem;
    grid-template-columns: 1fr;
    min-height: 0;
    padding-top: 1.4rem;
  }

  .th-p-books .books-title-page {
    border-bottom: 1px solid var(--books-line);
    border-right: 0;
    display: grid;
    gap: .75rem 1.2rem;
    grid-template-columns: 4.1rem minmax(0, 1fr);
    padding: 0 0 1.55rem;
  }

  .th-p-books .books-chapter-number {
    font-size: 5.4rem;
    grid-column: 1;
    grid-row: 1;
    margin: .4rem 0 0;
  }

  .th-p-books .books-copy {
    grid-column: 2;
    grid-row: 1;
  }

  .th-p-books .books-copy h1 {
    font-size: clamp(3.15rem, 13.6vw, 5rem);
    max-width: 10.5ch;
  }

  .th-p-books .books-copy h1.long {
    font-size: clamp(2.75rem, 11.2vw, 4.25rem);
  }

  .th-p-books .books-copy .sub {
    font-size: .88rem;
  }

  .th-p-books .books-copy .ctas a {
    flex: 1 1 11rem;
  }

  .th-p-books .books-title-page-note {
    grid-column: 1 / -1;
    margin: .45rem 0 0;
    max-width: 20rem;
  }

  .th-p-books .books-folio-media {
    aspect-ratio: 5 / 4;
    box-shadow: 8px 8px 0 color-mix(in srgb, var(--books-rust) 82%, transparent);
    max-height: none;
  }

  .th-p-books .books-folio-media .hero-media,
  .th-p-books .books-folio-media .theme-empty-media {
    object-position: 61% center;
  }

  .th-p-books .books-shelf-index {
    border-left: 0;
    border-top: 1px solid var(--books-line);
    display: grid;
    gap: 1rem;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    padding: 1.25rem 0 0;
  }

  .th-p-books .books-index-kicker {
    grid-column: 1 / -1;
    margin: 0;
  }

  .th-p-books .books-shelf-links {
    grid-column: 1 / -1;
  }

  .th-p-books .books-index-all {
    align-self: end;
    margin: 0;
  }

  .th-p-books .books-index-colophon {
    align-self: end;
    margin: 0;
    padding: 0;
    text-align: right;
  }

  .th-p-books .books-chapter-hero .hero-motion-controls {
    bottom: 1rem;
    right: 1rem;
  }

  .th-p-books .books-discovery {
    padding: 3.5rem 1rem 3.75rem;
  }

  .th-p-books .books-discovery-heading {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 2rem;
    padding-bottom: 1.7rem;
  }

  .th-p-books .books-discovery-heading h2 {
    font-size: clamp(3rem, 13.1vw, 4.9rem);
    max-width: 10.5ch;
  }

  .th-p-books .books-discovery-heading > p:last-child {
    font-size: .89rem;
    max-width: 31rem;
  }

  .th-p-books .books-catalogue-grid {
    grid-template-columns: 1fr;
  }

  .th-p-books .books-catalogue-card,
  .th-p-books .books-catalogue-card:nth-child(odd) {
    border-bottom: 1px solid var(--books-line);
    border-right: 0;
    grid-template-columns: 2.3rem minmax(5.5rem, 8rem) minmax(0, 1fr) 2.5rem;
    min-height: 10.5rem;
  }

  .th-p-books .books-catalogue-card:nth-last-child(1) {
    border-bottom: 0;
  }

  .th-p-books .books-catalogue-copy strong {
    font-size: clamp(1.75rem, 7.5vw, 2.5rem);
  }

  .th-p-books .books-product-entry {
    grid-template-columns: 2.2rem minmax(5.6rem, 7.8rem) minmax(0, 1fr) 2.4rem;
    min-height: 8.4rem;
  }
}

@media (max-width: 420px) {
  .th-p-books .books-chapter-hero {
    padding-right: .85rem;
    padding-left: .85rem;
  }

  .th-p-books .books-running-head {
    gap: .45rem;
    letter-spacing: .12em;
  }

  .th-p-books .books-title-page {
    gap: .6rem .8rem;
    grid-template-columns: 3.25rem minmax(0, 1fr);
  }

  .th-p-books .books-chapter-number {
    font-size: 4.45rem;
  }

  .th-p-books .books-copy h1 {
    font-size: clamp(2.8rem, 13.3vw, 3.8rem);
  }

  .th-p-books .books-copy .ctas {
    gap: .55rem;
  }

  .th-p-books .books-copy .ctas a {
    flex-basis: 100%;
  }

  .th-p-books .books-shelf-link,
  .th-p-books .books-shelf-all {
    min-height: 4.2rem;
  }

  .th-p-books .books-shelf-link b,
  .th-p-books .books-shelf-all b {
    font-size: 1.1rem;
  }

  .th-p-books .books-index-colophon {
    font-size: .93rem;
  }

  .th-p-books .books-discovery {
    padding-right: .85rem;
    padding-left: .85rem;
  }

  .th-p-books .books-catalogue-card,
  .th-p-books .books-catalogue-card:nth-child(odd) {
    grid-template-columns: 2rem minmax(5rem, 6.5rem) minmax(0, 1fr) 2.15rem;
    min-height: 9.6rem;
  }

  .th-p-books .books-catalogue-copy {
    padding-right: .55rem;
    padding-left: .65rem;
  }

  .th-p-books .books-catalogue-copy strong {
    font-size: 1.65rem;
  }

  .th-p-books .books-product-entry {
    gap: .55rem;
    grid-template-columns: 1.85rem 5.45rem minmax(0, 1fr) 2rem;
    min-height: 7.7rem;
  }

  .th-p-books .books-product-copy b {
    font-size: 1.48rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .th-p-books .books-chapter-hero.has-hero-motion .books-folio-media .hero-media {
    animation: none;
    transform: none;
  }
}
`;

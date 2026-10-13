import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-coffee',
  name: 'Rill & Rook',
  for: 'people who make a little more room for their coffee ritual',
  vibe: 'sun-warmed, grounded, and quietly deliberate',
  category: 'Specialty coffee and brewing',
  group: 'lifestyle',
  display: 'DM Serif Display',
  body: 'DM Sans',
  displayWeight: 400,
  tracking: '-.045em',
  colors: {
    bg: '#F1E8DC',
    surface: '#FFF9F0',
    ink: '#221A14',
    muted: '#76675B',
    line: '#D9C8B6',
    accent: '#A85632',
    onAccent: '#FFF9F0',
    panel: '#211D17',
    onPanel: '#F5E8D7',
    foot: '#211D17',
    onFoot: '#F5E8D7',
    bar: '#F8F0E5',
    onBar: '#221A14',
    badge: '#C98552',
    onBadge: '#221A14',
  },
  header: 'split',
  hero: 'editorial',
  card: 'minimal',
  ratio: '4/5',
  rCard: 0,
  rBtn: 0,
  motion: 'pan',
  copy: {
    eyebrow: 'Coffee for a slower world',
    collection: 'The morning edit',
    cta: 'Shop the collection',
    title: 'Coffee, in its own time.',
    subtitle: 'Thoughtful coffee and brewing pieces for the rituals you return to.',
  },
});

const itemCount = (count) => {
  const value = Number(count);
  if (!Number.isFinite(value)) return 'Explore collection';
  return `${value} ${value === 1 ? 'item' : 'items'}`;
};

const getImage = (category) => {
  if (typeof category?.image === 'string') return category.image;
  if (typeof category?.image?.url === 'string') return category.image.url;
  return '';
};

const initial = (value) => String(value || 'R').trim().charAt(0).toUpperCase() || 'R';

const railItems = (ctx, categories) => {
  if (!categories.length) {
    return `<a class="coffee-rail-all" href="#shop"><span>Explore what is available</span><b aria-hidden="true">→</b></a>`;
  }

  return categories.map((category, index) => `
    <a class="coffee-rail-link" href="${ctx.esc(ctx.categoryLink(category.name))}">
      <span class="coffee-rail-number">${String(index + 1).padStart(2, '0')}</span>
      <span class="coffee-rail-label">${ctx.esc(category.name)}</span>
      <span class="coffee-rail-count">${ctx.esc(itemCount(category.count))}</span>
      <b aria-hidden="true">→</b>
    </a>`).join('');
};

export function hero(ctx) {
  const categories = (Array.isArray(ctx.cats) ? ctx.cats : [])
    .filter((category) => category?.name)
    .slice(0, 3);

  return `
    <section class="hero category-hero coffee-time-hero${ctx.heroClass || ''}"${ctx.heroAttrs || ''}>
      <div class="coffee-photo-stage">
        <div class="coffee-hero-media">
          ${ctx.media(0, { priority: true, lazy: false, decorative: false })}
        </div>
        <div class="coffee-hero-veil" aria-hidden="true"></div>
        ${ctx.copy('coffee-copy')}
      </div>
      <aside class="coffee-taste-rail" aria-label="Browse coffee collections">
        <div class="coffee-rail-intro">
          <p>Find your<br><em>morning.</em></p>
          <span>AVAILABLE NOW</span>
        </div>
        <p class="coffee-rail-note">Start with the collections that fit the way you like to brew.</p>
        <div class="coffee-rail-list">${railItems(ctx, categories)}</div>
        <a class="coffee-rail-shop" href="#shop">Shop all coffee <span aria-hidden="true">→</span></a>
        <p class="coffee-rail-signoff">One quiet ritual<br>at a time.</p>
      </aside>
      ${ctx.controls || ''}
    </section>`;
}

export function discovery(ctx) {
  const categories = (Array.isArray(ctx.cats) ? ctx.cats : [])
    .filter((category) => category?.name)
    .slice(0, 3);
  const products = (Array.isArray(ctx.products) ? ctx.products : [])
    .filter(Boolean)
    .slice(0, 3);

  if (categories.length >= 2) {
    const cards = categories.map((category, index) => {
      const image = getImage(category);
      const media = image
        ? `<div class="coffee-discovery-media"><img src="${ctx.esc(image)}" alt="" loading="lazy" decoding="async"></div>`
        : `<div class="coffee-discovery-media coffee-discovery-placeholder" aria-hidden="true"><span>${ctx.esc(initial(category.name))}</span></div>`;
      return `
        <a class="coffee-collection-card" href="${ctx.esc(ctx.categoryLink(category.name))}">
          ${media}
          <div class="coffee-collection-copy">
            <span class="coffee-collection-index">${String(index + 1).padStart(2, '0')} / ${String(categories.length).padStart(2, '0')}</span>
            <h2>${ctx.esc(category.name)}</h2>
            <p>${ctx.esc(itemCount(category.count))}</p>
            <span class="coffee-collection-link">Explore <b aria-hidden="true">→</b></span>
          </div>
        </a>`;
    }).join('');

    return `
      <section class="theme-discovery coffee-discovery" aria-labelledby="coffee-discovery-title">
        <div class="coffee-discovery-heading">
          <div>
            <p class="coffee-kicker">A BREW FOR THE MOMENT</p>
            <h2 id="coffee-discovery-title">Choose your morning.</h2>
          </div>
          <div class="coffee-discovery-aside">
            <p>Begin with a collection, then make the ritual your own.</p>
            <a href="#shop">See everything <span aria-hidden="true">→</span></a>
          </div>
        </div>
        <div class="coffee-collection-grid">${cards}</div>
      </section>`;
  }

  if (products.length) {
    return `
      <section class="theme-discovery coffee-discovery coffee-product-discovery" aria-labelledby="coffee-discovery-title">
        <div class="coffee-discovery-heading">
          <div>
            <p class="coffee-kicker">FROM THE COUNTER</p>
            <h2 id="coffee-discovery-title">Ready when you are.</h2>
          </div>
          <a class="coffee-plain-shop" href="#shop">Shop all <span aria-hidden="true">→</span></a>
        </div>
        <div class="coffee-product-row">${products.map((product) => ctx.productCard(product)).join('')}</div>
      </section>`;
  }

  return '';
}

export const css = `
.th-p-coffee {
  --coffee-paper: #F1E8DC;
  --coffee-cream: #FFF9F0;
  --coffee-ink: #221A14;
  --coffee-muted: #76675B;
  --coffee-line: #D9C8B6;
  --coffee-rust: #A85632;
  --coffee-char: #211D17;
  background: var(--coffee-paper);
  color: var(--coffee-ink);
}

.th-p-coffee .site-header,
.th-p-coffee .store-header {
  background: color-mix(in srgb, var(--coffee-cream) 92%, transparent);
  border-color: color-mix(in srgb, var(--coffee-ink) 14%, transparent);
}

.th-p-coffee .site-header a,
.th-p-coffee .store-header a {
  color: var(--coffee-ink);
}

.th-p-coffee .coffee-time-hero {
  background: var(--coffee-char);
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(16.75rem, 20vw, 21.5rem);
  isolation: isolate;
  min-height: clamp(37.5rem, 47vw, 46rem);
  overflow: hidden;
  position: relative;
}

.th-p-coffee .coffee-photo-stage {
  min-width: 0;
  overflow: hidden;
  position: relative;
}

.th-p-coffee .coffee-hero-media {
  background: #B48B66;
  inset: 0;
  overflow: hidden;
  position: absolute;
}

.th-p-coffee .coffee-hero-media .hero-media,
.th-p-coffee .coffee-hero-media .theme-empty-media {
  display: block;
  height: 100%;
  object-fit: cover;
  object-position: 62% center;
  width: 100%;
}

.th-p-coffee .coffee-hero-media .theme-empty-media {
  background:
    radial-gradient(circle at 68% 50%, #573620 0 10%, transparent 10.3%),
    radial-gradient(circle at 74% 76%, #D3AE7B 0 8%, transparent 8.3%),
    linear-gradient(115deg, #E4C89D 0%, #D7A36A 48%, #6A402A 100%);
  color: var(--coffee-char);
}

.th-p-coffee .coffee-hero-veil {
  background: linear-gradient(90deg, rgba(255, 249, 240, .95) 0%, rgba(255, 249, 240, .84) 30%, rgba(255, 249, 240, .3) 54%, rgba(42, 22, 13, .06) 76%, rgba(42, 22, 13, .15) 100%);
  inset: 0;
  pointer-events: none;
  position: absolute;
}

.th-p-coffee .coffee-copy {
  align-self: center;
  box-sizing: border-box;
  color: var(--coffee-ink);
  max-width: min(41rem, 65%);
  padding: clamp(5.7rem, 9vw, 9rem) clamp(2rem, 6.2vw, 7rem) clamp(4rem, 8vw, 7.75rem);
  position: relative;
  z-index: 1;
}

.th-p-coffee .coffee-copy .eyebrow,
.th-p-coffee .coffee-kicker,
.th-p-coffee .coffee-rail-intro > span,
.th-p-coffee .coffee-collection-index {
  color: var(--coffee-rust);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .62rem;
  font-weight: 700;
  letter-spacing: .22em;
  line-height: 1.3;
  margin: 0 0 1rem;
  text-transform: uppercase;
}

.th-p-coffee .coffee-copy h1 {
  color: var(--coffee-ink);
  font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
  font-size: clamp(3.65rem, 6.2vw, 7rem);
  font-weight: 400;
  letter-spacing: -.065em;
  line-height: .86;
  margin: 0;
  max-width: 9.5ch;
  overflow-wrap: anywhere;
}

.th-p-coffee .coffee-copy h1.long {
  font-size: clamp(3.25rem, 5.2vw, 5.8rem);
  max-width: 12.25ch;
}

.th-p-coffee .coffee-copy .sub {
  color: color-mix(in srgb, var(--coffee-ink) 78%, transparent);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: clamp(.95rem, 1.25vw, 1.1rem);
  line-height: 1.55;
  margin: 1.45rem 0 0;
  max-width: 28rem;
  overflow-wrap: anywhere;
}

.th-p-coffee .coffee-copy .ctas {
  display: flex;
  flex-wrap: wrap;
  gap: .75rem;
  margin-top: 1.75rem;
}

.th-p-coffee .coffee-copy .ctas a {
  align-items: center;
  background: var(--coffee-rust);
  border: 1px solid var(--coffee-rust);
  color: var(--coffee-cream);
  display: inline-flex;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .72rem;
  font-weight: 700;
  justify-content: center;
  letter-spacing: .065em;
  min-height: 2.9rem;
  padding: 0 1.35rem;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-coffee .coffee-copy .ctas a:hover,
.th-p-coffee .coffee-copy .ctas a:focus-visible {
  background: var(--coffee-char);
  border-color: var(--coffee-char);
}

.th-p-coffee .coffee-taste-rail {
  background: var(--coffee-char);
  box-sizing: border-box;
  color: var(--coffee-cream);
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: clamp(2rem, 3.25vw, 3.5rem) clamp(1.35rem, 2.35vw, 2.65rem) clamp(1.75rem, 2.6vw, 2.75rem);
  position: relative;
  z-index: 2;
}

.th-p-coffee .coffee-rail-intro {
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.th-p-coffee .coffee-rail-intro p {
  color: var(--coffee-cream);
  font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
  font-size: clamp(2.2rem, 3.25vw, 3.45rem);
  font-weight: 400;
  letter-spacing: -.055em;
  line-height: .87;
  margin: 0;
}

.th-p-coffee .coffee-rail-intro em {
  font-style: italic;
}

.th-p-coffee .coffee-rail-intro > span {
  color: #D9A071;
  font-size: .55rem;
  margin: 0;
}

.th-p-coffee .coffee-rail-note {
  border-bottom: 1px solid rgba(245, 232, 215, .28);
  color: rgba(245, 232, 215, .73);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .8rem;
  line-height: 1.5;
  margin: 1.45rem 0 0;
  padding-bottom: 1.35rem;
}

.th-p-coffee .coffee-rail-list {
  display: grid;
  margin-top: .35rem;
}

.th-p-coffee .coffee-rail-link,
.th-p-coffee .coffee-rail-all {
  align-items: center;
  border-bottom: 1px solid rgba(245, 232, 215, .2);
  color: var(--coffee-cream);
  display: grid;
  gap: .4rem .6rem;
  grid-template-columns: auto minmax(0, 1fr) auto;
  min-height: 4.25rem;
  text-decoration: none;
}

.th-p-coffee .coffee-rail-number {
  color: #D9A071;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .55rem;
  font-weight: 700;
  grid-row: span 2;
  letter-spacing: .12em;
}

.th-p-coffee .coffee-rail-label {
  align-self: end;
  font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
  font-size: 1.2rem;
  letter-spacing: -.03em;
  line-height: .95;
  min-width: 0;
  overflow-wrap: anywhere;
}

.th-p-coffee .coffee-rail-count {
  align-self: start;
  color: rgba(245, 232, 215, .62);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .56rem;
  grid-column: 2;
  letter-spacing: .09em;
  text-transform: uppercase;
}

.th-p-coffee .coffee-rail-link b,
.th-p-coffee .coffee-rail-all b {
  font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
  font-size: 1.25rem;
  font-weight: 400;
  grid-column: 3;
  grid-row: 1 / span 2;
}

.th-p-coffee .coffee-rail-all {
  grid-template-columns: minmax(0, 1fr) auto;
  padding: .5rem 0;
}

.th-p-coffee .coffee-rail-all span {
  font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
  font-size: 1.15rem;
  line-height: 1;
}

.th-p-coffee .coffee-rail-all b {
  grid-column: 2;
  grid-row: auto;
}

.th-p-coffee .coffee-rail-shop,
.th-p-coffee .coffee-discovery-aside a,
.th-p-coffee .coffee-plain-shop {
  align-items: center;
  border-bottom: 1px solid currentColor;
  color: inherit;
  display: inline-flex;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .66rem;
  font-weight: 700;
  gap: .55rem;
  letter-spacing: .1em;
  min-height: 2.75rem;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-coffee .coffee-rail-shop {
  align-self: flex-start;
  color: #E0A576;
  margin-top: 1.3rem;
}

.th-p-coffee .coffee-rail-signoff {
  color: rgba(245, 232, 215, .5);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .55rem;
  font-weight: 700;
  letter-spacing: .2em;
  line-height: 1.5;
  margin: auto 0 0;
  padding-top: 2rem;
  text-transform: uppercase;
}

.th-p-coffee .coffee-time-hero .hero-motion-controls {
  bottom: 1.2rem;
  left: auto;
  position: absolute;
  right: calc(clamp(16.75rem, 20vw, 21.5rem) + 1.2rem);
  z-index: 3;
}

.th-p-coffee .coffee-discovery {
  background: var(--coffee-paper);
  box-sizing: border-box;
  padding: clamp(3.25rem, 6vw, 6.2rem) clamp(1.25rem, 4.4vw, 5rem) clamp(3.5rem, 6vw, 6rem);
}

.th-p-coffee .coffee-discovery-heading {
  align-items: end;
  display: flex;
  gap: 2rem;
  justify-content: space-between;
  margin: 0 auto clamp(2rem, 3.4vw, 3.7rem);
  max-width: 95rem;
}

.th-p-coffee .coffee-kicker {
  color: var(--coffee-rust);
  font-size: .59rem;
  margin-bottom: .75rem;
}

.th-p-coffee .coffee-discovery-heading h2 {
  color: var(--coffee-ink);
  font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
  font-size: clamp(3rem, 5.2vw, 6.1rem);
  font-weight: 400;
  letter-spacing: -.065em;
  line-height: .84;
  margin: 0;
  max-width: 8.5ch;
  overflow-wrap: anywhere;
}

.th-p-coffee .coffee-discovery-aside {
  padding-bottom: .25rem;
  width: min(100%, 18.5rem);
}

.th-p-coffee .coffee-discovery-aside p {
  color: var(--coffee-muted);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .94rem;
  line-height: 1.55;
  margin: 0 0 .75rem;
}

.th-p-coffee .coffee-discovery-aside a,
.th-p-coffee .coffee-plain-shop {
  color: var(--coffee-ink);
}

.th-p-coffee .coffee-collection-grid {
  border-top: 1px solid var(--coffee-line);
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0 auto;
  max-width: 95rem;
}

.th-p-coffee .coffee-collection-card {
  color: var(--coffee-ink);
  display: grid;
  grid-template-columns: minmax(7rem, .84fr) minmax(0, 1.16fr);
  min-width: 0;
  padding: clamp(1rem, 1.75vw, 1.75rem) clamp(.6rem, 1.3vw, 1.3rem) 0 0;
  text-decoration: none;
}

.th-p-coffee .coffee-collection-card + .coffee-collection-card {
  border-left: 1px solid var(--coffee-line);
  padding-left: clamp(.75rem, 1.5vw, 1.55rem);
}

.th-p-coffee .coffee-discovery-media {
  aspect-ratio: 4 / 5;
  background: #D7BEA2;
  overflow: hidden;
  position: relative;
}

.th-p-coffee .coffee-discovery-media img {
  display: block;
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.th-p-coffee .coffee-discovery-placeholder {
  align-items: center;
  background:
    linear-gradient(30deg, transparent 47%, rgba(255, 249, 240, .35) 47.5% 49.5%, transparent 50%),
    linear-gradient(145deg, #B8744D, #E6C699 64%, #5E3929);
  display: flex;
  justify-content: center;
}

.th-p-coffee .coffee-discovery-placeholder span {
  border: 1px solid rgba(255, 249, 240, .55);
  color: rgba(255, 249, 240, .82);
  font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
  font-size: clamp(4rem, 6vw, 6.5rem);
  height: 54%;
  line-height: .82;
  padding-top: .15em;
  text-align: center;
  width: 54%;
}

.th-p-coffee .coffee-collection-copy {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: .15rem 0 1.1rem clamp(.85rem, 1.5vw, 1.6rem);
}

.th-p-coffee .coffee-collection-index {
  color: var(--coffee-rust);
  font-size: .54rem;
  margin-bottom: auto;
}

.th-p-coffee .coffee-collection-copy h2 {
  color: var(--coffee-ink);
  font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
  font-size: clamp(1.55rem, 2.2vw, 2.5rem);
  font-weight: 400;
  letter-spacing: -.05em;
  line-height: .9;
  margin: 1.2rem 0 0;
  overflow-wrap: anywhere;
}

.th-p-coffee .coffee-collection-copy p {
  color: var(--coffee-muted);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .68rem;
  letter-spacing: .06em;
  line-height: 1.35;
  margin: .7rem 0 0;
  text-transform: uppercase;
}

.th-p-coffee .coffee-collection-link {
  align-items: center;
  border-bottom: 1px solid var(--coffee-ink);
  display: inline-flex;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .62rem;
  font-weight: 700;
  gap: .5rem;
  letter-spacing: .1em;
  margin-top: 1.2rem;
  min-height: 2.75rem;
  text-transform: uppercase;
  width: max-content;
}

.th-p-coffee .coffee-collection-link b {
  font-size: 1rem;
  font-weight: 400;
}

.th-p-coffee .coffee-product-discovery {
  padding-bottom: clamp(3rem, 5.5vw, 5.5rem);
}

.th-p-coffee .coffee-product-row {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0 auto;
  max-width: 95rem;
}

.th-p-coffee #shop {
  background: var(--coffee-cream);
}

.th-p-coffee #shop .section-title,
.th-p-coffee #shop h2 {
  font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
  font-weight: 400;
  letter-spacing: -.045em;
}

.th-p-coffee #shop .product-card,
.th-p-coffee #shop .product-card img {
  border-radius: 0;
}

.th-p-coffee .coffee-copy .ctas a:focus-visible,
.th-p-coffee .coffee-taste-rail a:focus-visible,
.th-p-coffee .coffee-discovery a:focus-visible {
  outline: 2px solid var(--coffee-rust);
  outline-offset: 4px;
}

@media (max-width: 980px) {
  .th-p-coffee .coffee-time-hero {
    grid-template-columns: minmax(0, 1fr) 16.5rem;
  }

  .th-p-coffee .coffee-copy {
    max-width: 76%;
    padding-left: clamp(1.75rem, 5vw, 4rem);
  }

  .th-p-coffee .coffee-copy h1 {
    font-size: clamp(3.35rem, 6.8vw, 5.7rem);
  }

  .th-p-coffee .coffee-time-hero .hero-motion-controls {
    right: 17.8rem;
  }

  .th-p-coffee .coffee-taste-rail {
    padding-right: 1.35rem;
    padding-left: 1.35rem;
  }

  .th-p-coffee .coffee-discovery-heading {
    align-items: start;
  }

  .th-p-coffee .coffee-collection-card {
    grid-template-columns: 1fr;
    padding-right: .8rem;
  }

  .th-p-coffee .coffee-collection-copy {
    min-height: 13rem;
    padding-left: 0;
    padding-top: 1rem;
  }

  .th-p-coffee .coffee-discovery-media {
    aspect-ratio: 1 / 1;
  }
}

@media (max-width: 700px) {
  .th-p-coffee .coffee-time-hero {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .th-p-coffee .coffee-photo-stage {
    display: flex;
    min-height: clamp(31rem, 135vw, 38rem);
  }

  .th-p-coffee .coffee-hero-media .hero-media,
  .th-p-coffee .coffee-hero-media .theme-empty-media {
    object-position: 63% center;
  }

  .th-p-coffee .coffee-hero-veil {
    background: linear-gradient(0deg, rgba(255, 249, 240, .98) 0%, rgba(255, 249, 240, .83) 23%, rgba(255, 249, 240, .2) 62%, rgba(255, 249, 240, .05) 100%);
  }

  .th-p-coffee .coffee-copy {
    align-self: end;
    max-width: none;
    padding: 5.5rem 1.25rem 1.6rem;
    width: 100%;
  }

  .th-p-coffee .coffee-copy h1 {
    font-size: clamp(3.35rem, 14.5vw, 5.1rem);
    max-width: 10ch;
  }

  .th-p-coffee .coffee-copy h1.long {
    font-size: clamp(2.85rem, 12vw, 4.3rem);
  }

  .th-p-coffee .coffee-copy .sub {
    margin-top: 1rem;
    max-width: 32rem;
  }

  .th-p-coffee .coffee-copy .ctas {
    margin-top: 1.25rem;
  }

  .th-p-coffee .coffee-copy .ctas a {
    flex: 1 1 11rem;
  }

  .th-p-coffee .coffee-taste-rail {
    display: grid;
    gap: 1rem 1.25rem;
    grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr);
    padding: 1.4rem 1.25rem 1.5rem;
  }

  .th-p-coffee .coffee-rail-intro {
    gap: .7rem;
  }

  .th-p-coffee .coffee-rail-intro p {
    font-size: clamp(2rem, 10vw, 2.8rem);
  }

  .th-p-coffee .coffee-rail-note {
    align-self: end;
    border-bottom: 0;
    margin: 0;
    padding: 0;
  }

  .th-p-coffee .coffee-rail-list {
    grid-column: 1 / -1;
    margin: 0;
  }

  .th-p-coffee .coffee-rail-link,
  .th-p-coffee .coffee-rail-all {
    min-height: 3.65rem;
  }

  .th-p-coffee .coffee-rail-shop {
    grid-column: 1;
    margin: 0;
  }

  .th-p-coffee .coffee-rail-signoff {
    align-self: end;
    grid-column: 2;
    margin: 0;
    padding: 0;
    text-align: right;
  }

  .th-p-coffee .coffee-time-hero .hero-motion-controls {
    bottom: auto;
    right: 1rem;
    top: calc(clamp(31rem, 135vw, 38rem) - 3.3rem);
  }

  .th-p-coffee .coffee-discovery {
    padding: 3.2rem 1.25rem 3.5rem;
  }

  .th-p-coffee .coffee-discovery-heading {
    align-items: start;
    flex-direction: column;
    gap: 1.25rem;
    margin-bottom: 2rem;
  }

  .th-p-coffee .coffee-discovery-heading h2 {
    font-size: clamp(3.1rem, 14vw, 5rem);
  }

  .th-p-coffee .coffee-discovery-aside {
    width: min(100%, 28rem);
  }

  .th-p-coffee .coffee-collection-grid {
    grid-template-columns: 1fr;
  }

  .th-p-coffee .coffee-collection-card,
  .th-p-coffee .coffee-collection-card + .coffee-collection-card {
    border-bottom: 1px solid var(--coffee-line);
    border-left: 0;
    grid-template-columns: 8.25rem minmax(0, 1fr);
    padding: 1rem 0;
  }

  .th-p-coffee .coffee-collection-copy {
    min-height: 0;
    padding: .15rem 0 .2rem 1rem;
  }

  .th-p-coffee .coffee-discovery-media {
    aspect-ratio: 4 / 5;
  }

  .th-p-coffee .coffee-collection-copy h2 {
    margin-top: .95rem;
  }

  .th-p-coffee .coffee-collection-link {
    margin-top: .75rem;
  }

  .th-p-coffee .coffee-product-row {
    gap: .85rem;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 420px) {
  .th-p-coffee .coffee-photo-stage {
    min-height: 31rem;
  }

  .th-p-coffee .coffee-copy {
    padding-right: 1rem;
    padding-left: 1rem;
  }

  .th-p-coffee .coffee-taste-rail {
    gap: .9rem 1rem;
    padding-right: 1rem;
    padding-left: 1rem;
  }

  .th-p-coffee .coffee-rail-note {
    font-size: .75rem;
  }

  .th-p-coffee .coffee-rail-signoff {
    font-size: .5rem;
  }

  .th-p-coffee .coffee-time-hero .hero-motion-controls {
    top: calc(31rem - 3.3rem);
  }

  .th-p-coffee .coffee-discovery {
    padding-right: 1rem;
    padding-left: 1rem;
  }

  .th-p-coffee .coffee-collection-card,
  .th-p-coffee .coffee-collection-card + .coffee-collection-card {
    grid-template-columns: 6.65rem minmax(0, 1fr);
  }

  .th-p-coffee .coffee-collection-copy h2 {
    font-size: 1.7rem;
  }

  .th-p-coffee .coffee-product-row {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .th-p-coffee .coffee-hero-media .hero-media {
    transform: none;
  }
}
`;

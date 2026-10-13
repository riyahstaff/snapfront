import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-kitchenware',
  name: 'Hearth & Kiln',
  for: 'home cooks who make time for the table',
  vibe: 'sunlit, tactile, and patiently made',
  category: 'Cookware for slow, shared meals',
  group: 'home',
  display: 'Cormorant Garamond',
  body: 'DM Sans',
  displayWeight: 500,
  tracking: '-.045em',
  colors: {
    bg: '#F4EBDD',
    surface: '#FFF9EF',
    ink: '#17392D',
    muted: '#6E7065',
    line: '#D7CDBB',
    accent: '#1D4939',
    onAccent: '#FFF9EF',
    panel: '#E6A480',
    onPanel: '#17392D',
    foot: '#16382C',
    onFoot: '#F7EEDF',
    bar: '#F8F0E3',
    onBar: '#17392D',
    badge: '#DFA176',
    onBadge: '#17392D',
  },
  header: 'center',
  hero: 'overlay',
  card: 'boxed',
  ratio: '4/3',
  rCard: 0,
  rBtn: 999,
  motion: 'pan',
  copy: {
    eyebrow: 'SLOWER MEALS · A BRIGHTER TABLE',
    collection: 'Cook with feeling',
    cta: 'Shop cookware',
    title: 'Good things take a simmer.',
    subtitle: 'Thoughtful pieces for everyday rituals at the stove and around the table.',
  },
});

const itemCount = (count) => {
  const value = Number(count);
  if (!Number.isFinite(value)) return 'Explore collection';
  return `${value} ${value === 1 ? 'item' : 'items'}`;
};

const categoryInitial = (name) => String(name || 'K').trim().charAt(0).toUpperCase() || 'K';

export function hero(ctx) {
  const products = Array.isArray(ctx.products) ? ctx.products : [];
  const cats = Array.isArray(ctx.cats) ? ctx.cats : [];
  const pics = Array.isArray(ctx.pics) ? ctx.pics : [];
  const featureProduct = products.find((product) => product && (product.name || product.title));
  const featureCategory = cats.find((category) => category && category.name);
  const hasFeaturePhoto = Boolean(pics[1] && pics[1].url);

  let feature = '';
  if (featureProduct) {
    const itemName = featureProduct.name || featureProduct.title;
    feature = `
      <aside class="kitchenware-recipe-card" aria-label="Featured item">
        ${hasFeaturePhoto ? `<div class="kitchenware-feature-media">${ctx.media(1, { lazy: true, decorative: true })}</div>` : ''}
        <div class="kitchenware-feature-copy">
          <p class="kitchenware-card-kicker">Featured from the shop</p>
          <h2>${ctx.esc(itemName)}</h2>
          <a href="${ctx.esc(ctx.productLink(featureProduct))}">View item <span aria-hidden="true">→</span></a>
        </div>
      </aside>`;
  } else if (featureCategory) {
    feature = `
      <aside class="kitchenware-recipe-card kitchenware-category-feature" aria-label="Featured collection">
        <div class="kitchenware-feature-copy">
          <p class="kitchenware-card-kicker">From the kitchen</p>
          <h2>${ctx.esc(featureCategory.name)}</h2>
          <p class="kitchenware-feature-count">${ctx.esc(itemCount(featureCategory.count))}</p>
          <a href="${ctx.esc(ctx.categoryLink(featureCategory.name))}">Explore collection <span aria-hidden="true">→</span></a>
        </div>
      </aside>`;
  }

  return `
    <section class="hero category-hero kitchenware-hearth-hero${ctx.heroClass || ''}"${ctx.heroAttrs || ''}>
      <div class="kitchenware-hero-photo">
        ${ctx.media(0, { priority: true, lazy: false, decorative: false })}
      </div>
      <div class="kitchenware-hero-wash" aria-hidden="true"></div>
      <div class="kitchenware-hero-stage">
        ${ctx.copy('kitchenware-copy')}
        ${feature}
      </div>
      ${ctx.controls || ''}
    </section>`;
}

export function discovery(ctx) {
  const cats = Array.isArray(ctx.cats) ? ctx.cats.filter((category) => category && category.name) : [];
  const products = Array.isArray(ctx.products) ? ctx.products : [];

  if (cats.length >= 2) {
    const cards = cats.slice(0, 3).map((category, index) => {
      const categoryImage = category.image
        ? `<div class="kitchenware-category-image"><img src="${ctx.esc(category.image)}" alt="" loading="lazy"></div>`
        : `<div class="kitchenware-category-image kitchenware-category-empty" aria-hidden="true"><span>${ctx.esc(categoryInitial(category.name))}</span></div>`;
      return `
        <a class="kitchenware-category-card kitchenware-category-card-${index + 1}" href="${ctx.esc(ctx.categoryLink(category.name))}">
          ${categoryImage}
          <span class="kitchenware-category-scrim" aria-hidden="true"></span>
          <span class="kitchenware-category-content">
            <span class="kitchenware-category-count">${ctx.esc(itemCount(category.count))}</span>
            <strong>${ctx.esc(category.name)}</strong>
            <span class="kitchenware-category-link">Shop collection <b aria-hidden="true">→</b></span>
          </span>
        </a>`;
    }).join('');

    return `
      <section class="kitchenware-discovery" aria-labelledby="kitchenware-discovery-title">
        <div class="kitchenware-discovery-head">
          <div>
            <p class="kitchenware-discovery-kicker">GOOD MATERIALS · GREAT MEALS</p>
            <h2 id="kitchenware-discovery-title">Make room for what you make.</h2>
          </div>
          <p>Find the pieces that meet you at the stove, the sink, and the table.</p>
        </div>
        <div class="kitchenware-category-grid">${cards}</div>
      </section>`;
  }

  if (products.length >= 2) {
    return `
      <section class="kitchenware-discovery kitchenware-product-discovery" aria-labelledby="kitchenware-discovery-title">
        <div class="kitchenware-discovery-head">
          <div>
            <p class="kitchenware-discovery-kicker">FROM THE KITCHEN</p>
            <h2 id="kitchenware-discovery-title">Made for the long way around.</h2>
          </div>
          <a class="kitchenware-inline-shop-link" href="#shop">Shop all <span aria-hidden="true">→</span></a>
        </div>
        <div class="kitchenware-product-preview">${products.slice(0, 2).map((product) => ctx.productCard(product)).join('')}</div>
      </section>`;
  }

  return '';
}

export const css = `
.th-p-kitchenware {
  --kitchen-cream: #F4EBDD;
  --kitchen-paper: #FFF9EF;
  --kitchen-ink: #17392D;
  --kitchen-green: #1D4939;
  --kitchen-clay: #C97752;
  --kitchen-line: #D7CDBB;
  background: var(--kitchen-cream);
  color: var(--kitchen-ink);
}

.th-p-kitchenware .site-header {
  background: color-mix(in srgb, var(--kitchen-paper) 88%, transparent);
  border-color: color-mix(in srgb, var(--kitchen-green) 14%, transparent);
}

.th-p-kitchenware .kitchenware-hearth-hero {
  isolation: isolate;
  min-height: clamp(38rem, 48vw, 46rem);
  overflow: hidden;
  position: relative;
  background: #D8C5AD;
}

.th-p-kitchenware .kitchenware-hero-photo,
.th-p-kitchenware .kitchenware-feature-media {
  overflow: hidden;
  position: relative;
}

.th-p-kitchenware .kitchenware-hero-photo {
  inset: 0;
  position: absolute;
  z-index: -3;
}

.th-p-kitchenware .kitchenware-hero-photo .hero-media,
.th-p-kitchenware .kitchenware-hero-photo .theme-empty-media,
.th-p-kitchenware .kitchenware-feature-media .hero-media,
.th-p-kitchenware .kitchenware-feature-media .theme-empty-media {
  display: block;
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.th-p-kitchenware .kitchenware-hero-photo .theme-empty-media {
  background:
    linear-gradient(110deg, rgba(255, 249, 239, .88), rgba(245, 232, 209, .35)),
    radial-gradient(circle at 78% 60%, #56735C 0 12%, transparent 12.5%),
    #D8C5AD;
}

.th-p-kitchenware .kitchenware-hero-wash {
  background: linear-gradient(90deg, rgba(255, 249, 239, .95) 0%, rgba(255, 249, 239, .79) 27%, rgba(255, 249, 239, .24) 53%, rgba(23, 57, 45, .05) 100%);
  inset: 0;
  pointer-events: none;
  position: absolute;
  z-index: -2;
}

.th-p-kitchenware .kitchenware-hero-stage {
  align-items: end;
  box-sizing: border-box;
  display: grid;
  gap: clamp(1.5rem, 3vw, 4rem);
  grid-template-columns: minmax(16rem, .87fr) minmax(15rem, .5fr);
  margin: 0 auto;
  max-width: 92rem;
  min-height: inherit;
  padding: clamp(7.25rem, 10vw, 9.25rem) clamp(1.25rem, 4vw, 4.5rem) clamp(2rem, 4vw, 4rem);
  position: relative;
  z-index: 1;
}

.th-p-kitchenware .kitchenware-copy {
  align-self: start;
  grid-column: 1;
  max-width: 36rem;
}

.th-p-kitchenware .kitchenware-copy .eyebrow,
.th-p-kitchenware .kitchenware-discovery-kicker,
.th-p-kitchenware .kitchenware-card-kicker,
.th-p-kitchenware .kitchenware-category-count {
  color: var(--kitchen-green);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .66rem;
  font-weight: 700;
  letter-spacing: .19em;
  line-height: 1.35;
  margin: 0 0 .9rem;
  text-transform: uppercase;
}

.th-p-kitchenware .kitchenware-copy h1 {
  color: var(--kitchen-ink);
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: clamp(3.55rem, 6.25vw, 6.6rem);
  font-weight: 500;
  letter-spacing: -.065em;
  line-height: .84;
  margin: 0;
  max-width: 9.3ch;
  overflow-wrap: anywhere;
}

.th-p-kitchenware .kitchenware-copy .sub {
  color: color-mix(in srgb, var(--kitchen-ink) 82%, white);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: clamp(.95rem, 1.3vw, 1.08rem);
  line-height: 1.5;
  margin: 1.35rem 0 0;
  max-width: 31rem;
  overflow-wrap: anywhere;
}

.th-p-kitchenware .kitchenware-copy .ctas {
  display: flex;
  flex-wrap: wrap;
  gap: .75rem;
  margin-top: 1.55rem;
}

.th-p-kitchenware .kitchenware-copy .ctas a,
.th-p-kitchenware .kitchenware-recipe-card a,
.th-p-kitchenware .kitchenware-inline-shop-link {
  align-items: center;
  color: var(--kitchen-paper);
  display: inline-flex;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .78rem;
  font-weight: 700;
  justify-content: center;
  letter-spacing: .04em;
  min-height: 2.75rem;
  text-decoration: none;
}

.th-p-kitchenware .kitchenware-copy .ctas a {
  background: var(--kitchen-green);
  border: 1px solid var(--kitchen-green);
  border-radius: 999px;
  padding: 0 1.35rem;
}

.th-p-kitchenware .kitchenware-copy .ctas a:hover,
.th-p-kitchenware .kitchenware-copy .ctas a:focus-visible {
  background: var(--kitchen-ink);
  border-color: var(--kitchen-ink);
}

.th-p-kitchenware .kitchenware-recipe-card {
  align-items: stretch;
  align-self: end;
  background: rgba(255, 249, 239, .96);
  box-shadow: 0 1rem 3rem rgba(26, 44, 34, .16);
  display: flex;
  grid-column: 2;
  justify-self: end;
  max-width: 23.5rem;
  min-width: 0;
  width: 100%;
}

.th-p-kitchenware .kitchenware-feature-media {
  flex: 0 0 7.5rem;
  min-height: 10.25rem;
}

.th-p-kitchenware .kitchenware-feature-media .hero-media {
  transform: scale(1.05);
}

.th-p-kitchenware .kitchenware-feature-copy {
  box-sizing: border-box;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  padding: 1.25rem 1.35rem 1.2rem;
}

.th-p-kitchenware .kitchenware-recipe-card h2 {
  color: var(--kitchen-ink);
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: clamp(1.65rem, 2.2vw, 2.15rem);
  font-weight: 500;
  letter-spacing: -.04em;
  line-height: .94;
  margin: 0;
  overflow-wrap: anywhere;
}

.th-p-kitchenware .kitchenware-card-kicker {
  color: var(--kitchen-clay);
  font-size: .57rem;
  letter-spacing: .16em;
  margin-bottom: .65rem;
}

.th-p-kitchenware .kitchenware-feature-count {
  color: var(--kitchen-ink);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .78rem;
  margin: .6rem 0 0;
}

.th-p-kitchenware .kitchenware-recipe-card a {
  align-self: flex-start;
  border-bottom: 1px solid currentColor;
  color: var(--kitchen-ink);
  font-size: .72rem;
  justify-content: flex-start;
  margin-top: 1rem;
  min-height: 2rem;
}

.th-p-kitchenware .kitchenware-recipe-card a:hover,
.th-p-kitchenware .kitchenware-recipe-card a:focus-visible {
  color: var(--kitchen-clay);
}

.th-p-kitchenware .hero .hero-motion-controls {
  bottom: 1.25rem;
  left: auto;
  position: absolute;
  right: 1.25rem;
  z-index: 4;
}

.th-p-kitchenware .kitchenware-discovery {
  background: var(--kitchen-green);
  box-sizing: border-box;
  color: var(--kitchen-paper);
  padding: clamp(3rem, 6vw, 5.5rem) clamp(1.25rem, 4vw, 4.5rem) clamp(3.5rem, 6vw, 6rem);
}

.th-p-kitchenware .kitchenware-discovery-head {
  align-items: end;
  display: flex;
  gap: 2rem;
  justify-content: space-between;
  margin: 0 auto clamp(1.8rem, 3vw, 3rem);
  max-width: 92rem;
}

.th-p-kitchenware .kitchenware-discovery-kicker {
  color: #DFA176;
  margin-bottom: .7rem;
}

.th-p-kitchenware .kitchenware-discovery h2 {
  color: var(--kitchen-paper);
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: clamp(2.65rem, 4.7vw, 5.15rem);
  font-weight: 500;
  letter-spacing: -.06em;
  line-height: .87;
  margin: 0;
  max-width: 8.8ch;
  overflow-wrap: anywhere;
}

.th-p-kitchenware .kitchenware-discovery-head > p {
  color: rgba(255, 249, 239, .76);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .94rem;
  line-height: 1.55;
  margin: 0 0 .2rem;
  max-width: 18rem;
}

.th-p-kitchenware .kitchenware-category-grid {
  display: grid;
  gap: clamp(.85rem, 1.5vw, 1.5rem);
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0 auto;
  max-width: 92rem;
}

.th-p-kitchenware .kitchenware-category-card {
  background: #486A55;
  color: var(--kitchen-paper);
  display: flex;
  min-height: clamp(18rem, 27vw, 23.5rem);
  overflow: hidden;
  position: relative;
  text-decoration: none;
}

.th-p-kitchenware .kitchenware-category-card-1 {
  background: #B56945;
}

.th-p-kitchenware .kitchenware-category-card-2 {
  background: #A49C87;
}

.th-p-kitchenware .kitchenware-category-image {
  inset: 0;
  overflow: hidden;
  position: absolute;
}

.th-p-kitchenware .kitchenware-category-image img {
  display: block;
  height: 100%;
  object-fit: cover;
  transition: transform .45s ease;
  width: 100%;
}

.th-p-kitchenware .kitchenware-category-empty {
  align-items: center;
  background:
    radial-gradient(circle at 73% 30%, rgba(255, 249, 239, .28) 0 8%, transparent 8.2%),
    linear-gradient(135deg, rgba(255, 249, 239, .12), transparent 50%);
  display: flex;
  justify-content: center;
}

.th-p-kitchenware .kitchenware-category-empty span {
  color: rgba(255, 249, 239, .48);
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: 9rem;
  font-weight: 500;
  line-height: 1;
}

.th-p-kitchenware .kitchenware-category-scrim {
  background: linear-gradient(0deg, rgba(12, 33, 24, .68), rgba(12, 33, 24, .04) 70%);
  inset: 0;
  pointer-events: none;
  position: absolute;
}

.th-p-kitchenware .kitchenware-category-content {
  align-items: flex-start;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: end;
  min-width: 0;
  padding: 1.35rem;
  position: relative;
  width: 100%;
  z-index: 1;
}

.th-p-kitchenware .kitchenware-category-count {
  color: rgba(255, 249, 239, .76);
  font-size: .58rem;
  letter-spacing: .16em;
  margin-bottom: .5rem;
}

.th-p-kitchenware .kitchenware-category-content strong {
  color: var(--kitchen-paper);
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: clamp(2rem, 3.2vw, 3.2rem);
  font-weight: 500;
  letter-spacing: -.055em;
  line-height: .9;
  overflow-wrap: anywhere;
}

.th-p-kitchenware .kitchenware-category-link {
  align-items: center;
  border-bottom: 1px solid rgba(255, 249, 239, .8);
  display: inline-flex;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .7rem;
  font-weight: 700;
  gap: .45rem;
  letter-spacing: .04em;
  margin-top: 1rem;
  min-height: 2.25rem;
}

.th-p-kitchenware .kitchenware-category-card:hover .kitchenware-category-image img,
.th-p-kitchenware .kitchenware-category-card:focus-visible .kitchenware-category-image img {
  transform: scale(1.045);
}

.th-p-kitchenware .kitchenware-category-card:focus-visible,
.th-p-kitchenware .kitchenware-copy .ctas a:focus-visible,
.th-p-kitchenware .kitchenware-recipe-card a:focus-visible,
.th-p-kitchenware .kitchenware-inline-shop-link:focus-visible {
  outline: 2px solid var(--kitchen-paper);
  outline-offset: 4px;
}

.th-p-kitchenware .kitchenware-product-discovery {
  padding-bottom: clamp(3rem, 6vw, 5.5rem);
}

.th-p-kitchenware .kitchenware-inline-shop-link {
  align-self: end;
  border-bottom: 1px solid rgba(255, 249, 239, .8);
  color: var(--kitchen-paper);
  gap: .5rem;
  min-height: 2.25rem;
}

.th-p-kitchenware .kitchenware-product-preview {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0 auto;
  max-width: 92rem;
}

.th-p-kitchenware #shop {
  background: var(--kitchen-paper);
}

@media (max-width: 780px) {
  .th-p-kitchenware .kitchenware-hearth-hero {
    min-height: 0;
  }

  .th-p-kitchenware .kitchenware-hero-photo {
    height: clamp(20rem, 98vw, 30rem);
    inset: auto;
    position: relative;
  }

  .th-p-kitchenware .kitchenware-hero-photo .hero-media,
  .th-p-kitchenware .kitchenware-hero-photo .theme-empty-media {
    object-position: 68% center;
  }

  .th-p-kitchenware .kitchenware-hero-wash {
    background: linear-gradient(0deg, var(--kitchen-paper) 0%, rgba(255, 249, 239, .1) 44%, transparent 72%);
    bottom: auto;
    height: clamp(20rem, 98vw, 30rem);
  }

  .th-p-kitchenware .kitchenware-hero-stage {
    background: var(--kitchen-paper);
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
    min-height: 0;
    padding: 1.25rem 1.25rem 2rem;
  }

  .th-p-kitchenware .kitchenware-copy {
    max-width: none;
  }

  .th-p-kitchenware .kitchenware-copy h1 {
    font-size: clamp(3.25rem, 13.5vw, 4.75rem);
    max-width: 10ch;
  }

  .th-p-kitchenware .kitchenware-recipe-card {
    align-self: stretch;
    max-width: none;
  }

  .th-p-kitchenware .kitchenware-feature-media {
    flex-basis: 36%;
    min-height: 9rem;
  }

  .th-p-kitchenware .hero .hero-motion-controls {
    bottom: auto;
    right: 1rem;
    top: calc(clamp(20rem, 98vw, 30rem) - 3.3rem);
  }

  .th-p-kitchenware .kitchenware-discovery-head {
    align-items: start;
    flex-direction: column;
    gap: 1.25rem;
  }

  .th-p-kitchenware .kitchenware-discovery-head > p {
    max-width: 28rem;
  }

  .th-p-kitchenware .kitchenware-category-grid {
    grid-template-columns: 1fr;
  }

  .th-p-kitchenware .kitchenware-category-card {
    min-height: 17rem;
  }

  .th-p-kitchenware .kitchenware-product-preview {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .th-p-kitchenware .kitchenware-category-image img {
    transition: none;
  }
}
`;

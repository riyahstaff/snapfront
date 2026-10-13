import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-baking-tools',
  name: 'Second Rise Supply',
  for: 'home bakers who notice every detail',
  vibe: 'warm, measured, and tactile',
  category: 'Baking tools & pastry equipment',
  group: 'lifestyle',
  display: 'DM Serif Display',
  body: 'Manrope',
  displayWeight: 400,
  tracking: '-.045em',
  colors: {
    bg: '#F7F1E6',
    surface: '#FFF9F0',
    ink: '#3C251D',
    muted: '#7D675B',
    line: '#D8C9B5',
    accent: '#B7422B',
    onAccent: '#FFF9F0',
    panel: '#DDA466',
    onPanel: '#3C251D',
    foot: '#3C251D',
    onFoot: '#F8F0E3',
    bar: '#FDF8F1',
    onBar: '#3C251D',
    badge: '#EBCF9D',
    onBadge: '#3C251D',
  },
  header: 'stack',
  hero: 'editorial',
  card: 'boxed',
  ratio: '4/5',
  rCard: 8,
  rBtn: 2,
  motion: 'pan',
  copy: {
    eyebrow: 'TOOLS FOR THE DOUGH-LIT HOUR',
    collection: 'The working bench',
    cta: 'Shop the bench',
    title: 'Make room for the rise.',
    subtitle: 'A considered collection for flour, heat, and the pleasure of making.',
  },
});

const itemCount = (count) => {
  const value = Number(count);
  if (!Number.isFinite(value)) return 'Explore collection';
  return `${value} ${value === 1 ? 'item' : 'items'}`;
};

const categoryInitial = (name) => String(name || 'B').trim().charAt(0).toUpperCase() || 'B';

function heroFeature(ctx) {
  const products = Array.isArray(ctx.products) ? ctx.products : [];
  const cats = Array.isArray(ctx.cats) ? ctx.cats : [];
  const product = products.find((entry) => entry && (entry.name || entry.title));
  const category = cats.find((entry) => entry && entry.name);

  if (product) {
    const name = product.name || product.title;
    return `
      <aside class="baking-tools-tool-slip" aria-label="Featured item from the shop">
        <p>On the bench</p>
        <strong>${ctx.esc(name)}</strong>
        <a href="${ctx.esc(ctx.productLink(product))}">View item <span aria-hidden="true">↗</span></a>
      </aside>`;
  }

  if (category) {
    return `
      <aside class="baking-tools-tool-slip" aria-label="Featured collection">
        <p>Browse the bench</p>
        <strong>${ctx.esc(category.name)}</strong>
        <a href="${ctx.esc(ctx.categoryLink(category.name))}">${ctx.esc(itemCount(category.count))} <span aria-hidden="true">↗</span></a>
      </aside>`;
  }

  return `
    <aside class="baking-tools-tool-slip baking-tools-tool-slip-empty" aria-label="Store introduction">
      <p>A little room for the hands that make.</p>
    </aside>`;
}

export function hero(ctx) {
  return `
    <section class="hero category-hero baking-tools-proofshelf${ctx.heroClass || ''}"${ctx.heroAttrs || ''}>
      <div class="baking-tools-hero-board">
        <div class="baking-tools-hero-media">
          ${ctx.media(0, { priority: true, lazy: false, decorative: false })}
        </div>
        <span class="baking-tools-board-line baking-tools-board-line-one" aria-hidden="true"></span>
        <span class="baking-tools-board-line baking-tools-board-line-two" aria-hidden="true"></span>
      </div>
      <div class="baking-tools-hero-stage">
        <div class="baking-tools-copy-wrap">${ctx.copy('baking-tools-copy')}</div>
        ${heroFeature(ctx)}
      </div>
      ${ctx.controls || ''}
    </section>`;
}

export function discovery(ctx) {
  const cats = Array.isArray(ctx.cats) ? ctx.cats.filter((category) => category && category.name) : [];
  const products = Array.isArray(ctx.products) ? ctx.products.filter(Boolean) : [];

  if (cats.length >= 2) {
    const collectionCards = cats.slice(0, 4).map((category, index) => {
      const image = category.image
        ? `<div class="baking-tools-category-media"><img src="${ctx.esc(category.image)}" alt="" loading="lazy" decoding="async"></div>`
        : `<div class="baking-tools-category-media baking-tools-category-media-empty" aria-hidden="true"><span>${ctx.esc(categoryInitial(category.name))}</span></div>`;
      const number = String(index + 1).padStart(2, '0');
      return `
        <a class="baking-tools-category-card" href="${ctx.esc(ctx.categoryLink(category.name))}">
          <span class="baking-tools-category-number">${number}</span>
          ${image}
          <span class="baking-tools-category-copy">
            <strong>${ctx.esc(category.name)}</strong>
            <small>${ctx.esc(itemCount(category.count))}</small>
            <span class="baking-tools-category-link">Open collection <b aria-hidden="true">→</b></span>
          </span>
        </a>`;
    }).join('');

    return `
      <section class="theme-discovery baking-tools-discovery" aria-labelledby="baking-tools-discovery-title">
        <div class="baking-tools-discovery-head">
          <p>THE COLLECTION INDEX</p>
          <h2 id="baking-tools-discovery-title">Set a place for your next bake.</h2>
          <span aria-hidden="true" class="baking-tools-rule"></span>
        </div>
        <div class="baking-tools-category-cards">${collectionCards}</div>
      </section>`;
  }

  if (products.length >= 2) {
    return `
      <section class="theme-discovery baking-tools-discovery baking-tools-product-discovery" aria-labelledby="baking-tools-discovery-title">
        <div class="baking-tools-discovery-head">
          <p>FROM THE BENCH</p>
          <h2 id="baking-tools-discovery-title">A few things to start with.</h2>
          <a class="baking-tools-all-link" href="#shop">Shop all <span aria-hidden="true">→</span></a>
        </div>
        <div class="baking-tools-product-preview">${products.slice(0, 2).map((product) => ctx.productCard(product)).join('')}</div>
      </section>`;
  }

  return '';
}

export const css = `
.th-p-baking-tools {
  --baking-paper: #F7F1E6;
  --baking-surface: #FFF9F0;
  --baking-ink: #3C251D;
  --baking-muted: #7D675B;
  --baking-line: #D8C9B5;
  --baking-red: #B7422B;
  --baking-biscuit: #EBCF9D;
  background: var(--baking-paper);
  color: var(--baking-ink);
}

.th-p-baking-tools .site-header {
  background: color-mix(in srgb, var(--baking-surface) 94%, transparent);
  border-color: color-mix(in srgb, var(--baking-ink) 13%, transparent);
}

.th-p-baking-tools .baking-tools-proofshelf {
  background:
    radial-gradient(circle at 6% 57%, rgba(183, 66, 43, .08) 0 10%, transparent 10.3%),
    linear-gradient(90deg, #EBDCC6 0 1px, transparent 1px) 0 0 / 10.5rem 100%,
    var(--baking-paper);
  box-sizing: border-box;
  isolation: isolate;
  min-height: clamp(39rem, 50vw, 52rem);
  overflow: hidden;
  padding: clamp(5.75rem, 9vw, 8.5rem) clamp(1rem, 4.25vw, 4.5rem) clamp(2.5rem, 5.5vw, 5.5rem);
  position: relative;
}

.th-p-baking-tools .baking-tools-hero-board {
  background: #B48767;
  box-shadow: 0 1.2rem 3.5rem rgba(60, 37, 29, .19);
  height: clamp(20rem, 30vw, 31rem);
  margin: 0 auto;
  max-width: 88rem;
  overflow: hidden;
  position: relative;
  transform: rotate(-.45deg);
}

.th-p-baking-tools .baking-tools-hero-media {
  height: 100%;
  overflow: hidden;
  position: relative;
}

.th-p-baking-tools .baking-tools-hero-media .hero-media,
.th-p-baking-tools .baking-tools-hero-media .theme-empty-media {
  display: block;
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.th-p-baking-tools .baking-tools-hero-media .theme-empty-media {
  background:
    linear-gradient(135deg, rgba(255, 249, 240, .68), transparent 47%),
    radial-gradient(ellipse at 68% 52%, #8E513F 0 13%, transparent 13.4%),
    linear-gradient(110deg, #C89B74, #6B3F31);
  color: rgba(255, 249, 240, .84);
}

.th-p-baking-tools .baking-tools-board-line {
  background: rgba(255, 249, 240, .75);
  display: block;
  height: 1px;
  left: 0;
  pointer-events: none;
  position: absolute;
  right: 0;
  z-index: 1;
}

.th-p-baking-tools .baking-tools-board-line-one {
  top: 1.2rem;
}

.th-p-baking-tools .baking-tools-board-line-two {
  bottom: 1.2rem;
}

.th-p-baking-tools .baking-tools-hero-stage {
  align-items: end;
  box-sizing: border-box;
  display: grid;
  gap: clamp(1rem, 3.5vw, 4.25rem);
  grid-template-columns: minmax(0, 1fr) minmax(15rem, 22rem);
  margin: clamp(-4.35rem, -4vw, -2.75rem) auto 0;
  max-width: 79rem;
  position: relative;
  z-index: 2;
}

.th-p-baking-tools .baking-tools-copy-wrap {
  background: var(--baking-surface);
  box-shadow: .8rem .8rem 0 var(--baking-biscuit);
  box-sizing: border-box;
  min-width: 0;
  padding: clamp(1.6rem, 3.6vw, 3.4rem) clamp(1.35rem, 4.8vw, 5rem) clamp(1.7rem, 3.4vw, 3rem);
}

.th-p-baking-tools .baking-tools-copy .eyebrow,
.th-p-baking-tools .baking-tools-discovery-head > p,
.th-p-baking-tools .baking-tools-tool-slip > p,
.th-p-baking-tools .baking-tools-category-number {
  color: var(--baking-red);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .63rem;
  font-weight: 800;
  letter-spacing: .18em;
  line-height: 1.35;
  margin: 0 0 .85rem;
  text-transform: uppercase;
}

.th-p-baking-tools .baking-tools-copy h1 {
  color: var(--baking-ink);
  font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
  font-size: clamp(3.3rem, 6.7vw, 7.45rem);
  font-weight: 400;
  letter-spacing: -.065em;
  line-height: .8;
  margin: 0;
  max-width: 8.8ch;
  overflow-wrap: anywhere;
}

.th-p-baking-tools .baking-tools-copy h1.long {
  font-size: clamp(2.65rem, 5.5vw, 5.6rem);
  line-height: .87;
  max-width: 12ch;
}

.th-p-baking-tools .baking-tools-copy .sub {
  color: color-mix(in srgb, var(--baking-ink) 78%, var(--baking-surface));
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: clamp(.92rem, 1.2vw, 1.06rem);
  line-height: 1.55;
  margin: 1.25rem 0 0;
  max-width: 35rem;
  overflow-wrap: anywhere;
}

.th-p-baking-tools .baking-tools-copy .ctas {
  display: flex;
  flex-wrap: wrap;
  gap: .65rem;
  margin-top: 1.45rem;
}

.th-p-baking-tools .baking-tools-copy .ctas .btn,
.th-p-baking-tools .baking-tools-tool-slip a,
.th-p-baking-tools .baking-tools-all-link {
  align-items: center;
  box-sizing: border-box;
  display: inline-flex;
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .72rem;
  font-weight: 800;
  gap: .5rem;
  letter-spacing: .055em;
  line-height: 1.25;
  min-height: 2.75rem;
  text-decoration: none;
}

.th-p-baking-tools .baking-tools-copy .ctas .btn {
  background: var(--baking-red);
  border: 1px solid var(--baking-red);
  color: var(--baking-surface);
  padding: 0 1.1rem;
}

.th-p-baking-tools .baking-tools-copy .ctas .btn.ghost {
  background: transparent;
  border-color: var(--baking-ink);
  color: var(--baking-ink);
}

.th-p-baking-tools .baking-tools-copy .ctas .btn:hover,
.th-p-baking-tools .baking-tools-copy .ctas .btn:focus-visible {
  background: var(--baking-ink);
  border-color: var(--baking-ink);
  color: var(--baking-surface);
}

.th-p-baking-tools .baking-tools-tool-slip {
  align-self: end;
  background: var(--baking-ink);
  box-shadow: -.65rem .65rem 0 var(--baking-red);
  box-sizing: border-box;
  color: var(--baking-surface);
  min-width: 0;
  padding: 1.25rem 1.35rem 1.35rem;
  transform: rotate(1.45deg);
}

.th-p-baking-tools .baking-tools-tool-slip > p {
  color: var(--baking-biscuit);
  font-size: .57rem;
  margin-bottom: .72rem;
}

.th-p-baking-tools .baking-tools-tool-slip strong {
  display: block;
  font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
  font-size: clamp(1.65rem, 2.7vw, 2.35rem);
  font-weight: 400;
  letter-spacing: -.04em;
  line-height: .92;
  overflow-wrap: anywhere;
}

.th-p-baking-tools .baking-tools-tool-slip a {
  border-bottom: 1px solid currentColor;
  color: var(--baking-surface);
  margin-top: 1rem;
  min-height: 2.35rem;
}

.th-p-baking-tools .baking-tools-tool-slip a:hover,
.th-p-baking-tools .baking-tools-tool-slip a:focus-visible {
  color: var(--baking-biscuit);
}

.th-p-baking-tools .baking-tools-tool-slip-empty {
  min-height: 8.25rem;
}

.th-p-baking-tools .baking-tools-tool-slip-empty > p {
  color: var(--baking-surface);
  font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
  font-size: 1.65rem;
  font-weight: 400;
  letter-spacing: -.04em;
  line-height: 1;
  margin: 0;
  text-transform: none;
}

.th-p-baking-tools .baking-tools-proofshelf .motion-toggle {
  bottom: 1rem;
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .68rem;
  left: 1rem;
  letter-spacing: .04em;
  min-height: 2.75rem;
  padding: 0 .8rem;
  position: absolute;
}

.th-p-baking-tools .baking-tools-discovery {
  background: var(--baking-ink);
  box-sizing: border-box;
  color: var(--baking-surface);
  padding: clamp(3.25rem, 7vw, 7rem) clamp(1rem, 4.25vw, 4.5rem) clamp(4rem, 7vw, 6.25rem);
}

.th-p-baking-tools .baking-tools-discovery-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  margin: 0 auto clamp(2rem, 4.5vw, 4.25rem);
  max-width: 88rem;
  position: relative;
}

.th-p-baking-tools .baking-tools-discovery-head > p {
  color: var(--baking-biscuit);
  grid-column: 1 / -1;
  margin-bottom: .8rem;
}

.th-p-baking-tools .baking-tools-discovery h2 {
  color: var(--baking-surface);
  font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
  font-size: clamp(2.8rem, 5.3vw, 6.1rem);
  font-weight: 400;
  letter-spacing: -.06em;
  line-height: .84;
  margin: 0;
  max-width: 10ch;
  overflow-wrap: anywhere;
}

.th-p-baking-tools .baking-tools-rule {
  align-self: end;
  background: var(--baking-red);
  display: block;
  height: .65rem;
  margin: 0 0 .5rem 1rem;
  width: clamp(4rem, 13vw, 12rem);
}

.th-p-baking-tools .baking-tools-category-cards {
  align-items: end;
  display: grid;
  gap: clamp(.8rem, 1.5vw, 1.5rem);
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin: 0 auto;
  max-width: 88rem;
}

.th-p-baking-tools .baking-tools-category-card {
  background: #6E4437;
  color: var(--baking-surface);
  display: flex;
  flex-direction: column;
  min-height: clamp(20rem, 31vw, 29rem);
  overflow: hidden;
  position: relative;
  text-decoration: none;
}

.th-p-baking-tools .baking-tools-category-card:nth-child(2) {
  margin-bottom: clamp(1rem, 3vw, 3rem);
}

.th-p-baking-tools .baking-tools-category-card:nth-child(3) {
  margin-bottom: clamp(.4rem, 1.5vw, 1.5rem);
}

.th-p-baking-tools .baking-tools-category-card:nth-child(4) {
  margin-bottom: clamp(1.8rem, 4vw, 4rem);
}

.th-p-baking-tools .baking-tools-category-number {
  color: var(--baking-biscuit);
  left: 1.15rem;
  margin: 0;
  position: absolute;
  top: 1rem;
  z-index: 2;
}

.th-p-baking-tools .baking-tools-category-media {
  background: #A66D55;
  height: 55%;
  min-height: 10rem;
  overflow: hidden;
  position: relative;
}

.th-p-baking-tools .baking-tools-category-media img {
  display: block;
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.th-p-baking-tools .baking-tools-category-media-empty {
  align-items: center;
  background:
    linear-gradient(145deg, rgba(255, 249, 240, .14), transparent 55%),
    linear-gradient(135deg, #C68862, #7B4639);
  display: flex;
  justify-content: center;
}

.th-p-baking-tools .baking-tools-category-media-empty span {
  color: rgba(255, 249, 240, .62);
  font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
  font-size: clamp(5.5rem, 10vw, 9rem);
  font-weight: 400;
  line-height: 1;
}

.th-p-baking-tools .baking-tools-category-copy {
  box-sizing: border-box;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  padding: 1.15rem 1.15rem 1.25rem;
}

.th-p-baking-tools .baking-tools-category-copy strong {
  color: var(--baking-surface);
  font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
  font-size: clamp(1.8rem, 2.6vw, 2.7rem);
  font-weight: 400;
  letter-spacing: -.045em;
  line-height: .9;
  overflow-wrap: anywhere;
}

.th-p-baking-tools .baking-tools-category-copy small {
  color: rgba(255, 249, 240, .7);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .68rem;
  font-weight: 700;
  letter-spacing: .05em;
  margin-top: .7rem;
}

.th-p-baking-tools .baking-tools-category-link {
  align-items: center;
  border-bottom: 1px solid rgba(255, 249, 240, .72);
  color: var(--baking-surface);
  display: inline-flex;
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .64rem;
  font-weight: 800;
  gap: .4rem;
  letter-spacing: .05em;
  margin-top: auto;
  min-height: 2.75rem;
  padding-top: .7rem;
}

.th-p-baking-tools .baking-tools-category-card:hover,
.th-p-baking-tools .baking-tools-category-card:focus-visible {
  background: #834332;
}

.th-p-baking-tools .baking-tools-all-link {
  align-self: end;
  border-bottom: 1px solid var(--baking-biscuit);
  color: var(--baking-surface);
  margin-left: 1rem;
  min-height: 2.75rem;
}

.th-p-baking-tools .baking-tools-all-link:hover,
.th-p-baking-tools .baking-tools-all-link:focus-visible {
  color: var(--baking-biscuit);
}

.th-p-baking-tools .baking-tools-product-preview {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0 auto;
  max-width: 62rem;
}

.th-p-baking-tools #shop {
  background: var(--baking-surface);
}

.th-p-baking-tools .baking-tools-copy .ctas .btn:focus-visible,
.th-p-baking-tools .baking-tools-tool-slip a:focus-visible,
.th-p-baking-tools .baking-tools-category-card:focus-visible,
.th-p-baking-tools .baking-tools-all-link:focus-visible {
  outline: 2px solid var(--baking-red);
  outline-offset: 4px;
}

@media (max-width: 780px) {
  .th-p-baking-tools .baking-tools-proofshelf {
    min-height: 0;
    padding: 4.75rem 1rem 2.6rem;
  }

  .th-p-baking-tools .baking-tools-hero-board {
    height: clamp(16.5rem, 76vw, 25rem);
    transform: none;
  }

  .th-p-baking-tools .baking-tools-hero-media .hero-media,
  .th-p-baking-tools .baking-tools-hero-media .theme-empty-media {
    object-position: 56% center;
  }

  .th-p-baking-tools .baking-tools-hero-stage {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    margin-top: -1.7rem;
  }

  .th-p-baking-tools .baking-tools-copy-wrap {
    box-shadow: .45rem .45rem 0 var(--baking-biscuit);
    padding: 1.65rem 1.2rem 1.8rem;
    width: calc(100% - .45rem);
  }

  .th-p-baking-tools .baking-tools-copy h1 {
    font-size: clamp(3.25rem, 14.5vw, 4.85rem);
    max-width: 9.5ch;
  }

  .th-p-baking-tools .baking-tools-copy h1.long {
    font-size: clamp(2.45rem, 11vw, 3.85rem);
  }

  .th-p-baking-tools .baking-tools-tool-slip {
    align-self: stretch;
    margin-right: .7rem;
    min-height: 0;
    padding: 1.15rem 1.2rem 1.2rem;
    width: calc(100% - .7rem);
  }

  .th-p-baking-tools .baking-tools-proofshelf .motion-toggle {
    bottom: auto;
    left: auto;
    right: 1.3rem;
    top: calc(4.75rem + clamp(16.5rem, 76vw, 25rem) - 3.35rem);
  }

  .th-p-baking-tools .baking-tools-discovery {
    padding: 3.25rem 1rem 3.75rem;
  }

  .th-p-baking-tools .baking-tools-discovery-head {
    grid-template-columns: 1fr;
    margin-bottom: 2rem;
  }

  .th-p-baking-tools .baking-tools-rule {
    margin: 1.6rem 0 0;
    width: 6rem;
  }

  .th-p-baking-tools .baking-tools-category-cards {
    align-items: stretch;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .th-p-baking-tools .baking-tools-category-card,
  .th-p-baking-tools .baking-tools-category-card:nth-child(2),
  .th-p-baking-tools .baking-tools-category-card:nth-child(3),
  .th-p-baking-tools .baking-tools-category-card:nth-child(4) {
    margin-bottom: 0;
    min-height: 19rem;
  }

  .th-p-baking-tools .baking-tools-category-media {
    height: 48%;
  }

  .th-p-baking-tools .baking-tools-category-copy {
    padding: 1rem;
  }

  .th-p-baking-tools .baking-tools-category-copy strong {
    font-size: clamp(1.65rem, 7vw, 2.2rem);
  }

  .th-p-baking-tools .baking-tools-all-link {
    align-self: start;
    margin: 1.4rem 0 0;
    width: max-content;
  }

  .th-p-baking-tools .baking-tools-product-preview {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 430px) {
  .th-p-baking-tools .baking-tools-proofshelf {
    background-size: 7rem 100%;
  }

  .th-p-baking-tools .baking-tools-category-cards {
    grid-template-columns: 1fr;
  }

  .th-p-baking-tools .baking-tools-category-card,
  .th-p-baking-tools .baking-tools-category-card:nth-child(2),
  .th-p-baking-tools .baking-tools-category-card:nth-child(3),
  .th-p-baking-tools .baking-tools-category-card:nth-child(4) {
    min-height: 16rem;
  }

  .th-p-baking-tools .baking-tools-category-media {
    height: 52%;
  }

  .th-p-baking-tools .baking-tools-category-copy {
    min-height: 8rem;
  }
}
`;

import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-small-kitchen-appliances',
  name: 'Counterform Studio',
  for: 'home cooks composing a more useful countertop',
  vibe: 'sun-warmed, engineered, and quietly optimistic',
  category: 'Small kitchen appliances for everyday rituals',
  group: 'home',
  display: 'DM Serif Display',
  body: 'Manrope',
  displayWeight: 400,
  tracking: '-.052em',
  colors: {
    bg: '#F1E6D6',
    surface: '#FFF9F1',
    ink: '#3C2018',
    muted: '#836B5A',
    line: '#D9C2AE',
    accent: '#D8562D',
    onAccent: '#FFF8F0',
    panel: '#315C58',
    onPanel: '#F8EEE1',
    foot: '#3C2018',
    onFoot: '#F9EEDF',
    bar: '#E6D4BF',
    onBar: '#3C2018',
    badge: '#E8B267',
    onBadge: '#3C2018',
  },
  header: 'stack',
  hero: 'collage',
  card: 'minimal',
  ratio: '4/5',
  rCard: 18,
  rBtn: 999,
  motion: 'pan',
  copy: {
    eyebrow: 'COUNTERTOP / CURRENT',
    collection: 'The countertop edit',
    cta: 'Explore the edit',
    title: 'Set the day in motion.',
    subtitle: 'Small appliances with a place in the rhythm of the kitchen.',
  },
});

const itemCount = (count) => {
  const value = Number(count);
  if (!Number.isFinite(value)) return 'Explore collection';
  return `${value} ${value === 1 ? 'item' : 'items'}`;
};

const categoryImage = (category) => {
  if (typeof category?.image === 'string') return category.image;
  if (typeof category?.image?.url === 'string') return category.image.url;
  return '';
};

const categoryInitial = (name) => String(name || 'C').trim().charAt(0).toUpperCase() || 'C';

const currentRail = (ctx, categories) => {
  if (!categories.length) {
    return `<a class="counterform-rail-all" href="#shop"><span>Browse what is in the shop</span><b aria-hidden="true">↘</b></a>`;
  }

  return categories.map((category, index) => `
    <a class="counterform-rail-node" href="${ctx.esc(ctx.categoryLink(category.name))}">
      <span class="counterform-node-index">${String(index + 1).padStart(2, '0')}</span>
      <span class="counterform-node-name">${ctx.esc(category.name)}</span>
      <span class="counterform-node-count">${ctx.esc(itemCount(category.count))}</span>
      <b aria-hidden="true">↗</b>
    </a>`).join('');
};

export function hero(ctx) {
  const categories = (Array.isArray(ctx.cats) ? ctx.cats : [])
    .filter((category) => category?.name)
    .slice(0, 3);

  return `
    <section class="hero category-hero counterform-current-hero${ctx.heroClass || ''}"${ctx.heroAttrs || ''}>
      <div class="counterform-hero-canvas">
        <div class="counterform-hero-media">
          ${ctx.media(0, { priority: true, lazy: false, decorative: false })}
        </div>
        <div class="counterform-sun-disc" aria-hidden="true"></div>
        <div class="counterform-image-edge" aria-hidden="true"></div>
      </div>
      <div class="counterform-title-dock">
        <span class="counterform-dock-tab">A BETTER COUNTER</span>
        ${ctx.copy('counterform-copy')}
      </div>
      <aside class="counterform-current-rail" aria-label="Browse appliance collections">
        <div class="counterform-rail-top">
          <span class="counterform-pulse" aria-hidden="true"></span>
          <p>THE CURRENT<br><em>IS ON.</em></p>
        </div>
        <nav class="counterform-rail-list" aria-label="Available appliance collections">${currentRail(ctx, categories)}</nav>
      </aside>
      ${ctx.controls || ''}
    </section>`;
}

export function discovery(ctx) {
  const categories = (Array.isArray(ctx.cats) ? ctx.cats : [])
    .filter((category) => category?.name)
    .slice(0, 4);
  const products = (Array.isArray(ctx.products) ? ctx.products : []).filter(Boolean).slice(0, 3);

  if (categories.length >= 2) {
    const stations = categories.map((category, index) => {
      const image = categoryImage(category);
      const visual = image
        ? `<div class="counterform-station-media"><img src="${ctx.esc(image)}" alt="" loading="lazy" decoding="async"></div>`
        : `<div class="counterform-station-media counterform-station-empty" aria-hidden="true"><span>${ctx.esc(categoryInitial(category.name))}</span></div>`;
      return `
        <a class="counterform-station counterform-station-${index + 1}" href="${ctx.esc(ctx.categoryLink(category.name))}">
          <span class="counterform-station-number">${String(index + 1).padStart(2, '0')}</span>
          ${visual}
          <span class="counterform-station-copy">
            <span class="counterform-station-count">${ctx.esc(itemCount(category.count))}</span>
            <strong>${ctx.esc(category.name)}</strong>
            <span class="counterform-station-link">Open collection <b aria-hidden="true">↗</b></span>
          </span>
        </a>`;
    }).join('');

    return `
      <section class="theme-discovery counterform-discovery" aria-labelledby="counterform-discovery-title">
        <div class="counterform-discovery-lede">
          <p class="counterform-section-kicker">CHOOSE YOUR STATION</p>
          <h2 id="counterform-discovery-title">Every ritual starts with a signal.</h2>
          <p>Move through the available collections, then find the pieces that earn their place on the counter.</p>
          <a class="counterform-discovery-shop" href="#shop">View everything <span aria-hidden="true">↘</span></a>
        </div>
        <div class="counterform-station-line" aria-hidden="true"><span></span></div>
        <div class="counterform-stations">${stations}</div>
      </section>`;
  }

  if (products.length) {
    return `
      <section class="theme-discovery counterform-discovery counterform-product-discovery" aria-labelledby="counterform-discovery-title">
        <div class="counterform-discovery-lede">
          <p class="counterform-section-kicker">ON THE COUNTER</p>
          <h2 id="counterform-discovery-title">Ready for the next good thing.</h2>
          <p>Start with what is in the shop today.</p>
          <a class="counterform-discovery-shop" href="#shop">View everything <span aria-hidden="true">↘</span></a>
        </div>
        <div class="counterform-product-preview">${products.map((product) => ctx.productCard(product)).join('')}</div>
      </section>`;
  }

  return '';
}

export const css = `
.th-p-small-kitchen-appliances {
  --counterform-cream: #FFF9F1;
  --counterform-paper: #F1E6D6;
  --counterform-ink: #3C2018;
  --counterform-clay: #D8562D;
  --counterform-sage: #315C58;
  --counterform-sand: #D9C2AE;
  background: var(--counterform-paper);
  color: var(--counterform-ink);
}
.th-p-small-kitchen-appliances .site-header {
  background: color-mix(in srgb, var(--counterform-cream) 90%, transparent);
  border-color: color-mix(in srgb, var(--counterform-ink) 13%, transparent);
}
.th-p-small-kitchen-appliances .counterform-current-hero {
  background: var(--counterform-ink);
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(17rem, 24.5rem);
  isolation: isolate;
  min-height: clamp(43rem, 58vw, 51rem);
  overflow: hidden;
  position: relative;
}
.th-p-small-kitchen-appliances .counterform-hero-canvas {
  background: #C88769;
  min-height: inherit;
  overflow: hidden;
  position: relative;
}
.th-p-small-kitchen-appliances .counterform-hero-media {
  inset: 0;
  overflow: hidden;
  position: absolute;
}
.th-p-small-kitchen-appliances .counterform-hero-media .hero-media,
.th-p-small-kitchen-appliances .counterform-hero-media .theme-empty-media {
  display: block;
  height: 100%;
  object-fit: cover;
  width: 100%;
}
.th-p-small-kitchen-appliances .counterform-hero-media .theme-empty-media {
  background:
    radial-gradient(circle at 62% 61%, #E6B475 0 10%, transparent 10.5%),
    radial-gradient(circle at 39% 50%, #EFE3D2 0 14%, transparent 14.5%),
    linear-gradient(133deg, #9C4D37, #D98D68 49%, #6B392C);
  color: #FFF8F0;
}
.th-p-small-kitchen-appliances .counterform-hero-media::after {
  background: linear-gradient(180deg, rgba(60, 32, 24, .03) 18%, rgba(60, 32, 24, .42) 100%);
  content: '';
  inset: 0;
  pointer-events: none;
  position: absolute;
}
.th-p-small-kitchen-appliances .counterform-sun-disc {
  background: #EAB064;
  border-radius: 50%;
  height: clamp(11rem, 20vw, 20rem);
  left: clamp(1rem, 7vw, 7.5rem);
  mix-blend-mode: screen;
  opacity: .37;
  position: absolute;
  top: clamp(4.5rem, 10vw, 8.5rem);
  width: clamp(11rem, 20vw, 20rem);
  z-index: 1;
}
.th-p-small-kitchen-appliances .counterform-image-edge {
  border: 1px solid rgba(255, 249, 241, .58);
  border-bottom: 0;
  height: min(58%, 27rem);
  left: clamp(1rem, 4vw, 4rem);
  pointer-events: none;
  position: absolute;
  top: clamp(4.75rem, 8vw, 7rem);
  width: min(42%, 26rem);
  z-index: 2;
}
.th-p-small-kitchen-appliances .counterform-title-dock {
  align-self: end;
  background: var(--counterform-cream);
  box-sizing: border-box;
  color: var(--counterform-ink);
  margin: 0 0 clamp(1rem, 2vw, 2rem) clamp(1rem, 4vw, 4rem);
  max-width: min(42rem, calc(100% - 2rem));
  padding: clamp(1.25rem, 2.4vw, 2.4rem) clamp(1.25rem, 3vw, 3.25rem) clamp(1.4rem, 3vw, 2.7rem);
  position: absolute;
  z-index: 3;
}
.th-p-small-kitchen-appliances .counterform-title-dock::before {
  background: var(--counterform-clay);
  content: '';
  height: .5rem;
  left: 0;
  position: absolute;
  top: 0;
  width: clamp(5rem, 19%, 8.5rem);
}
.th-p-small-kitchen-appliances .counterform-dock-tab,
.th-p-small-kitchen-appliances .counterform-copy .eyebrow,
.th-p-small-kitchen-appliances .counterform-section-kicker,
.th-p-small-kitchen-appliances .counterform-station-count,
.th-p-small-kitchen-appliances .counterform-node-index,
.th-p-small-kitchen-appliances .counterform-node-count {
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .65rem;
  font-weight: 800;
  letter-spacing: .16em;
  line-height: 1.35;
  text-transform: uppercase;
}
.th-p-small-kitchen-appliances .counterform-dock-tab {
  color: var(--counterform-clay);
  display: block;
  margin-bottom: .95rem;
}
.th-p-small-kitchen-appliances .counterform-copy .eyebrow {
  color: var(--counterform-sage);
  margin: 0 0 .72rem;
}
.th-p-small-kitchen-appliances .counterform-copy h1 {
  color: var(--counterform-ink);
  font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
  font-size: clamp(3rem, 6vw, 6.5rem);
  font-weight: 400;
  letter-spacing: -.06em;
  line-height: .84;
  margin: 0;
  max-width: 9.8ch;
  overflow-wrap: anywhere;
}
.th-p-small-kitchen-appliances .counterform-copy h1.long {
  font-size: clamp(2.75rem, 4.75vw, 5rem);
  line-height: .89;
  max-width: 13ch;
}
.th-p-small-kitchen-appliances .counterform-copy .sub {
  color: color-mix(in srgb, var(--counterform-ink) 76%, white);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: clamp(.91rem, 1.3vw, 1.06rem);
  line-height: 1.55;
  margin: 1.05rem 0 0;
  max-width: 31rem;
  overflow-wrap: anywhere;
}
.th-p-small-kitchen-appliances .counterform-copy .ctas {
  display: flex;
  flex-wrap: wrap;
  gap: .65rem;
  margin-top: 1.3rem;
}
.th-p-small-kitchen-appliances .counterform-copy .ctas .btn,
.th-p-small-kitchen-appliances .counterform-discovery-shop {
  align-items: center;
  background: var(--counterform-ink);
  border: 1px solid var(--counterform-ink);
  border-radius: 999px;
  box-sizing: border-box;
  color: var(--counterform-cream);
  display: inline-flex;
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .72rem;
  font-weight: 800;
  justify-content: center;
  letter-spacing: .08em;
  min-height: 44px;
  padding: .75rem 1.15rem;
  text-decoration: none;
  text-transform: uppercase;
}
.th-p-small-kitchen-appliances .counterform-copy .ctas .btn.ghost {
  background: transparent;
  color: var(--counterform-ink);
}
.th-p-small-kitchen-appliances .counterform-current-rail {
  background: var(--counterform-ink);
  box-sizing: border-box;
  color: var(--counterform-cream);
  display: flex;
  flex-direction: column;
  min-height: inherit;
  padding: clamp(6.2rem, 9vw, 8.25rem) clamp(1.25rem, 3vw, 2.75rem) clamp(1.25rem, 3.4vw, 3rem);
  position: relative;
  z-index: 4;
}
.th-p-small-kitchen-appliances .counterform-current-rail::before {
  background: var(--counterform-clay);
  content: '';
  height: 100%;
  left: 0;
  position: absolute;
  top: 0;
  width: .5rem;
}
.th-p-small-kitchen-appliances .counterform-rail-top {
  align-items: flex-start;
  display: flex;
  gap: .65rem;
}
.th-p-small-kitchen-appliances .counterform-pulse {
  background: var(--counterform-clay);
  border-radius: 50%;
  box-shadow: 0 0 0 .34rem rgba(216, 86, 45, .2);
  display: block;
  height: .42rem;
  margin-top: .55rem;
  width: .42rem;
}
.th-p-small-kitchen-appliances .counterform-rail-top p {
  font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
  font-size: clamp(1.45rem, 2.2vw, 2.1rem);
  letter-spacing: -.045em;
  line-height: .92;
  margin: 0;
}
.th-p-small-kitchen-appliances .counterform-rail-top em {
  color: var(--counterform-sand);
  font-style: italic;
}
.th-p-small-kitchen-appliances .counterform-rail-list {
  border-top: 1px solid rgba(255, 249, 241, .25);
  display: grid;
  margin-top: auto;
}
.th-p-small-kitchen-appliances .counterform-rail-node,
.th-p-small-kitchen-appliances .counterform-rail-all {
  align-items: center;
  border-bottom: 1px solid rgba(255, 249, 241, .25);
  color: var(--counterform-cream);
  display: grid;
  gap: .55rem;
  grid-template-columns: 1.7rem minmax(0, 1fr) auto;
  min-height: 4.75rem;
  padding: .55rem 0;
  text-decoration: none;
}
.th-p-small-kitchen-appliances .counterform-rail-node b,
.th-p-small-kitchen-appliances .counterform-rail-all b {
  color: var(--counterform-clay);
  font-size: 1.05rem;
  font-weight: 400;
  grid-column: 3;
  grid-row: 1 / span 2;
}
.th-p-small-kitchen-appliances .counterform-node-index,
.th-p-small-kitchen-appliances .counterform-node-count {
  color: var(--counterform-sand);
  font-size: .56rem;
}
.th-p-small-kitchen-appliances .counterform-node-name {
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .83rem;
  font-weight: 700;
  grid-column: 2;
  line-height: 1.3;
  overflow-wrap: anywhere;
}
.th-p-small-kitchen-appliances .counterform-node-count {
  grid-column: 2;
}
.th-p-small-kitchen-appliances .counterform-rail-all {
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .77rem;
  font-weight: 700;
  grid-template-columns: minmax(0, 1fr) auto;
  letter-spacing: .02em;
  line-height: 1.4;
}
.th-p-small-kitchen-appliances .counterform-rail-all b {
  grid-column: 2;
  grid-row: auto;
}
.th-p-small-kitchen-appliances .counterform-current-hero .motion-toggle {
  background: var(--counterform-cream);
  border: 1px solid var(--counterform-ink);
  bottom: 1.1rem;
  color: var(--counterform-ink);
  left: clamp(1rem, 4vw, 4rem);
  position: absolute;
}
.th-p-small-kitchen-appliances .counterform-discovery {
  background: var(--counterform-cream);
  box-sizing: border-box;
  display: grid;
  gap: clamp(2rem, 5vw, 6rem);
  grid-template-columns: minmax(15rem, .62fr) minmax(0, 1.38fr);
  overflow: hidden;
  padding: clamp(4.5rem, 9vw, 8.25rem) clamp(1.25rem, 5vw, 6rem);
  position: relative;
}
.th-p-small-kitchen-appliances .counterform-discovery::before {
  color: color-mix(in srgb, var(--counterform-clay) 15%, transparent);
  content: '01';
  font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
  font-size: clamp(13rem, 24vw, 24rem);
  left: -1.1rem;
  line-height: .75;
  pointer-events: none;
  position: absolute;
  top: 1.8rem;
}
.th-p-small-kitchen-appliances .counterform-discovery-lede {
  align-self: start;
  max-width: 25rem;
  position: relative;
  z-index: 1;
}
.th-p-small-kitchen-appliances .counterform-section-kicker {
  color: var(--counterform-clay);
  margin: 0 0 1rem;
}
.th-p-small-kitchen-appliances .counterform-discovery h2 {
  color: var(--counterform-ink);
  font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
  font-size: clamp(2.55rem, 4.4vw, 4.9rem);
  font-weight: 400;
  letter-spacing: -.055em;
  line-height: .88;
  margin: 0;
  overflow-wrap: anywhere;
}
.th-p-small-kitchen-appliances .counterform-discovery-lede > p:not(.counterform-section-kicker) {
  color: var(--counterform-muted, #836B5A);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .95rem;
  line-height: 1.62;
  margin: 1.3rem 0 0;
  max-width: 25rem;
}
.th-p-small-kitchen-appliances .counterform-discovery-shop {
  background: transparent;
  color: var(--counterform-ink);
  margin-top: 1.55rem;
}
.th-p-small-kitchen-appliances .counterform-discovery-shop span {
  color: var(--counterform-clay);
  font-size: 1.05rem;
  margin-left: .3rem;
}
.th-p-small-kitchen-appliances .counterform-station-line {
  background: color-mix(in srgb, var(--counterform-ink) 20%, transparent);
  height: 1px;
  left: max(1.25rem, 5vw);
  position: absolute;
  right: max(1.25rem, 5vw);
  top: clamp(12rem, 23vw, 18rem);
}
.th-p-small-kitchen-appliances .counterform-station-line span {
  background: var(--counterform-clay);
  display: block;
  height: 100%;
  width: 15%;
}
.th-p-small-kitchen-appliances .counterform-stations {
  align-items: start;
  display: grid;
  gap: clamp(.85rem, 2vw, 1.75rem);
  grid-template-columns: repeat(2, minmax(0, 1fr));
  padding-top: clamp(4.2rem, 8vw, 6.6rem);
  position: relative;
  z-index: 1;
}
.th-p-small-kitchen-appliances .counterform-station {
  color: var(--counterform-ink);
  display: block;
  min-height: 20rem;
  overflow: hidden;
  padding-top: 2rem;
  position: relative;
  text-decoration: none;
}
.th-p-small-kitchen-appliances .counterform-station:nth-child(even) {
  margin-top: clamp(2rem, 8vw, 6.75rem);
}
.th-p-small-kitchen-appliances .counterform-station-number {
  color: var(--counterform-clay);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .67rem;
  font-weight: 800;
  left: 0;
  letter-spacing: .14em;
  position: absolute;
  top: 0;
}
.th-p-small-kitchen-appliances .counterform-station-media {
  aspect-ratio: 1 / 1.13;
  background: #DDB59C;
  overflow: hidden;
  position: relative;
}
.th-p-small-kitchen-appliances .counterform-station-media img {
  display: block;
  height: 100%;
  object-fit: cover;
  width: 100%;
}
.th-p-small-kitchen-appliances .counterform-station-empty {
  align-items: center;
  background:
    radial-gradient(circle at 67% 34%, #F4D39B 0 13%, transparent 13.5%),
    linear-gradient(135deg, #C27052, #E6C5AC);
  color: var(--counterform-cream);
  display: flex;
  justify-content: center;
}
.th-p-small-kitchen-appliances .counterform-station-empty span {
  border: 1px solid currentColor;
  border-radius: 50%;
  display: grid;
  font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
  font-size: clamp(2.4rem, 6vw, 5rem);
  height: 42%;
  place-items: center;
  width: 42%;
}
.th-p-small-kitchen-appliances .counterform-station-copy {
  background: var(--counterform-cream);
  display: block;
  margin: -1.6rem .7rem 0 0;
  min-height: 7.7rem;
  padding: 1.15rem 1rem 1rem 0;
  position: relative;
}
.th-p-small-kitchen-appliances .counterform-station-count {
  color: var(--counterform-clay);
  display: block;
  font-size: .57rem;
  margin-bottom: .52rem;
}
.th-p-small-kitchen-appliances .counterform-station-copy strong {
  display: block;
  font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
  font-size: clamp(1.35rem, 2vw, 2rem);
  font-weight: 400;
  letter-spacing: -.04em;
  line-height: .98;
  overflow-wrap: anywhere;
}
.th-p-small-kitchen-appliances .counterform-station-link {
  color: var(--counterform-sage);
  display: block;
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .61rem;
  font-weight: 800;
  letter-spacing: .1em;
  margin-top: .9rem;
  text-transform: uppercase;
}
.th-p-small-kitchen-appliances .counterform-station-link b {
  color: var(--counterform-clay);
  font-size: .9rem;
  font-weight: 400;
  margin-left: .2rem;
}
.th-p-small-kitchen-appliances .counterform-product-discovery {
  display: block;
}
.th-p-small-kitchen-appliances .counterform-product-preview {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: clamp(2rem, 5vw, 4rem);
  position: relative;
  z-index: 1;
}
.th-p-small-kitchen-appliances .counterform-product-preview .product-card {
  background: transparent;
  border-color: color-mix(in srgb, var(--counterform-ink) 15%, transparent);
  border-radius: 0;
}
.th-p-small-kitchen-appliances #shop {
  background: var(--counterform-paper);
  color: var(--counterform-ink);
}
.th-p-small-kitchen-appliances #shop .product-card {
  border-color: color-mix(in srgb, var(--counterform-ink) 17%, transparent);
  border-radius: 0;
}
.th-p-small-kitchen-appliances #shop .product-card img {
  background: var(--counterform-cream);
}
@media (max-width: 760px) {
  .th-p-small-kitchen-appliances .counterform-current-hero {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  .th-p-small-kitchen-appliances .counterform-hero-canvas {
    min-height: clamp(25rem, 110vw, 33rem);
  }
  .th-p-small-kitchen-appliances .counterform-hero-media .hero-media {
    object-position: 56% center;
  }
  .th-p-small-kitchen-appliances .counterform-image-edge {
    height: 46%;
    left: 1rem;
    top: 4rem;
    width: 46%;
  }
  .th-p-small-kitchen-appliances .counterform-sun-disc {
    left: 1.2rem;
    top: 4.75rem;
  }
  .th-p-small-kitchen-appliances .counterform-title-dock {
    margin: -3.4rem 1rem 0;
    max-width: none;
    position: relative;
  }
  .th-p-small-kitchen-appliances .counterform-copy h1 {
    font-size: clamp(3.2rem, 15.5vw, 5rem);
  }
  .th-p-small-kitchen-appliances .counterform-current-rail {
    min-height: 0;
    padding: 1.5rem 1rem 1.2rem 1.5rem;
  }
  .th-p-small-kitchen-appliances .counterform-current-rail::before {
    height: .45rem;
    width: 100%;
  }
  .th-p-small-kitchen-appliances .counterform-rail-top {
    margin-bottom: 1.5rem;
  }
  .th-p-small-kitchen-appliances .counterform-rail-list {
    margin-top: 0;
  }
  .th-p-small-kitchen-appliances .counterform-rail-node,
  .th-p-small-kitchen-appliances .counterform-rail-all {
    min-height: 4.1rem;
  }
  .th-p-small-kitchen-appliances .counterform-current-hero .motion-toggle {
    bottom: auto;
    left: auto;
    right: 1rem;
    top: clamp(17rem, 66vw, 22rem);
  }
  .th-p-small-kitchen-appliances .counterform-discovery {
    display: block;
    padding: 4.5rem 1rem 4rem;
  }
  .th-p-small-kitchen-appliances .counterform-discovery::before {
    font-size: 11.5rem;
    left: -.55rem;
    top: 1.15rem;
  }
  .th-p-small-kitchen-appliances .counterform-discovery-lede {
    max-width: 31rem;
  }
  .th-p-small-kitchen-appliances .counterform-discovery h2 {
    font-size: clamp(2.65rem, 13vw, 4.2rem);
    max-width: 10ch;
  }
  .th-p-small-kitchen-appliances .counterform-station-line {
    display: none;
  }
  .th-p-small-kitchen-appliances .counterform-stations {
    gap: .85rem;
    margin-top: 2.4rem;
    padding-top: 0;
  }
  .th-p-small-kitchen-appliances .counterform-station {
    min-height: 0;
    padding-top: 1.7rem;
  }
  .th-p-small-kitchen-appliances .counterform-station:nth-child(even) {
    margin-top: 3rem;
  }
  .th-p-small-kitchen-appliances .counterform-station-copy {
    margin-top: -1.25rem;
    min-height: 7rem;
    padding-top: .95rem;
  }
  .th-p-small-kitchen-appliances .counterform-product-preview {
    grid-template-columns: minmax(0, 1fr);
  }
}
@media (max-width: 420px) {
  .th-p-small-kitchen-appliances .counterform-title-dock {
    padding: 1.15rem 1rem 1.3rem;
  }
  .th-p-small-kitchen-appliances .counterform-copy .ctas {
    align-items: stretch;
    flex-direction: column;
  }
  .th-p-small-kitchen-appliances .counterform-copy .ctas .btn {
    width: 100%;
  }
  .th-p-small-kitchen-appliances .counterform-station-copy strong {
    font-size: 1.35rem;
  }
  .th-p-small-kitchen-appliances .counterform-station-link {
    font-size: .55rem;
  }
}
`;

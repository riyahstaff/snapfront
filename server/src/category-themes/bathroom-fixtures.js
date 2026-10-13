import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-bathroom-fixtures',
  name: 'Naro Bathworks',
  for: 'architectural bathroom fixtures and restorative room elements',
  vibe: 'monolithic stone, shadowed waterlines, and quiet brushed metal',
  category: 'Bathroom fixtures',
  group: 'home',
  display: 'DM Serif Display',
  body: 'Manrope',
  displayWeight: 400,
  tracking: '-.055em',
  colors: {
    bg: '#E7E1D7',
    surface: '#F7F3EC',
    ink: '#15201E',
    muted: '#68706C',
    line: '#C9C3B8',
    accent: '#7A5141',
    onAccent: '#FFF9F2',
    panel: '#16201E',
    onPanel: '#F2EBE0',
    foot: '#111917',
    onFoot: '#EEE7DB',
    bar: '#F4F0E8',
    onBar: '#15201E',
    badge: '#D8C7B5',
    onBadge: '#15201E'
  },
  header: 'center',
  hero: 'editorial',
  card: 'bold',
  ratio: '5/4',
  rCard: 2,
  rBtn: 999,
  motion: 'pan',
  copy: {
    eyebrow: 'The bathing room, considered',
    collection: 'The room edit',
    cta: 'Explore fixtures',
    title: 'Rooms, run in water.',
    subtitle: 'A composed starting point for the spaces where every day begins.'
  }
});

const usableCategories = (ctx, limit = 4) => (ctx.cats || [])
  .filter((category) => category && category.name)
  .slice(0, limit);

const categoryCount = (category) => {
  const count = Number(category.count) || 0;
  return `${count} ${count === 1 ? 'piece' : 'pieces'}`;
};

export function hero(ctx) {
  const categories = usableCategories(ctx, 3);
  const categoryDock = categories.length
    ? `<nav class="bath-hero-dock" aria-label="Browse bathroom fixture categories">
        <p class="bath-dock-label">Browse the room</p>
        <div class="bath-dock-links">
          ${categories.map((category, index) => `<a href="${ctx.esc(ctx.categoryLink(category.name))}"><span class="bath-dock-number">0${index + 1}</span><span>${ctx.esc(category.name)}</span></a>`).join('')}
        </div>
      </nav>`
    : '';

  return `<section class="hero category-hero bath-hero${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="bath-hero-canvas">
      <figure class="bath-portal">
        ${ctx.media(0, { priority: true, lazy: false, decorative: true })}
        <figcaption>Threshold to the bathing room</figcaption>
      </figure>
      <div class="bath-waterline" aria-hidden="true"><span></span></div>
      <div class="bath-copy-ledge">
        <p class="bath-ledge-index" aria-hidden="true">01 / room study</p>
        ${ctx.copy('bath-copy')}
      </div>
      ${categoryDock}
      <div class="bath-hero-motion">${ctx.controls}</div>
    </div>
  </section>`;
}

export function discovery(ctx) {
  const categories = usableCategories(ctx);
  const products = (ctx.products || []).slice(0, 3);

  if (categories.length >= 2) {
    const chapters = categories.map((category, index) => {
      const hasPhoto = index < 2 && Boolean(ctx.pics && ctx.pics[index + 1]);
      const visual = hasPhoto
        ? `<figure class="bath-chapter-media">${ctx.media(index + 1, { lazy: true, decorative: true })}<span aria-hidden="true"></span></figure>`
        : `<div class="bath-chapter-media bath-chapter-slate" aria-hidden="true"><span></span></div>`;

      return `<a class="bath-chapter" href="${ctx.esc(ctx.categoryLink(category.name))}">
        <div class="bath-chapter-top"><span class="bath-chapter-no">0${index + 1}</span><span class="bath-chapter-arrow" aria-hidden="true">↗</span></div>
        ${visual}
        <div class="bath-chapter-copy"><h3>${ctx.esc(category.name)}</h3><p>${ctx.esc(categoryCount(category))}</p></div>
      </a>`;
    }).join('');

    return `<section class="theme-discovery bath-discovery" aria-labelledby="bath-discovery-title">
      <div class="bath-discovery-heading">
        <p class="bath-kicker">A room begins here</p>
        <h2 id="bath-discovery-title">Follow the line<br>to your fixture.</h2>
        <p>Browse the parts of the room that are ready to take shape.</p>
        <a class="bath-all-link" href="#shop">View all pieces <span aria-hidden="true">↓</span></a>
      </div>
      <div class="bath-chapter-line" aria-hidden="true"><span></span><i></i><i></i><i></i><i></i></div>
      <div class="bath-chapters">${chapters}</div>
    </section>`;
  }

  if (products.length) {
    return `<section class="theme-discovery bath-discovery bath-product-edit" aria-labelledby="bath-product-edit-title">
      <div class="bath-discovery-heading">
        <p class="bath-kicker">The room edit</p>
        <h2 id="bath-product-edit-title">A quiet place<br>to begin.</h2>
        <p>Explore the pieces currently available for your bathroom.</p>
        <a class="bath-all-link" href="#shop">View all pieces <span aria-hidden="true">↓</span></a>
      </div>
      <div class="bath-product-grid">${products.map((product) => ctx.productCard(product)).join('')}</div>
    </section>`;
  }

  return '';
}

export const css = `
.th-p-bathroom-fixtures {
  --bath-ink: #15201e;
  --bath-deep: #16201e;
  --bath-bone: #f7f3ec;
  --bath-stone: #e7e1d7;
  --bath-line: #c9c3b8;
  --bath-clay: #7a5141;
  --bath-moss: #728178;
  --bath-fog: #d9d2c7;
  background: var(--bath-stone);
  color: var(--bath-ink);
  overflow-x: clip;
}

.th-p-bathroom-fixtures .store-header,
.th-p-bathroom-fixtures .site-header {
  background: var(--bath-bone);
  border-color: var(--bath-line);
}

.th-p-bathroom-fixtures .store-header a,
.th-p-bathroom-fixtures .site-header a {
  color: var(--bath-ink);
  font-weight: 700;
  letter-spacing: .09em;
}

.th-p-bathroom-fixtures .bath-hero {
  position: relative;
  padding: clamp(.85rem, 1.8vw, 1.8rem);
  background: var(--bath-stone);
}

.th-p-bathroom-fixtures .bath-hero-canvas {
  position: relative;
  min-height: clamp(40rem, 61vw, 51rem);
  isolation: isolate;
  overflow: hidden;
  background: var(--bath-deep);
}

.th-p-bathroom-fixtures .bath-portal {
  position: absolute;
  inset: 0;
  z-index: 0;
  margin: 0;
  overflow: hidden;
  background: #4a4b45;
}

.th-p-bathroom-fixtures .bath-portal::before {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(90deg, #101817bd 0%, #10181782 21%, #10181718 52%, #10181733 100%), linear-gradient(0deg, #1018178f 0%, transparent 27%);
  content: '';
  pointer-events: none;
}

.th-p-bathroom-fixtures .bath-portal .hero-media,
.th-p-bathroom-fixtures .bath-portal .theme-empty-media {
  display: block;
  width: 100%;
  height: 100%;
  min-height: inherit;
  object-fit: cover;
  object-position: 61% center;
}

.th-p-bathroom-fixtures .bath-portal .theme-empty-media {
  background: radial-gradient(ellipse at 72% 62%, #cfc2ae 0 8%, transparent 8.4%), radial-gradient(ellipse at 72% 62%, transparent 0 12%, #8c8171 12.3% 12.9%, transparent 13.3%), linear-gradient(113deg, #19221f 0 27%, #625e52 27.3% 53%, #c5bcab 53.4% 100%);
  color: #f7f3ec;
}

.th-p-bathroom-fixtures .bath-portal figcaption {
  position: absolute;
  right: clamp(1.1rem, 2.6vw, 2.8rem);
  bottom: clamp(1.2rem, 2.7vw, 2.8rem);
  z-index: 2;
  margin: 0;
  color: #f8f2e7c9;
  font: 700 .58rem/1.25 var(--body);
  letter-spacing: .2em;
  text-transform: uppercase;
  writing-mode: vertical-rl;
}

.th-p-bathroom-fixtures .bath-waterline {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 2;
  height: clamp(6.5rem, 15vw, 11rem);
  border-top: 1px solid #f7f3ec80;
  background: linear-gradient(90deg, #17221ede 0 33%, #17221ebd 33% 100%);
  pointer-events: none;
}

.th-p-bathroom-fixtures .bath-waterline::before,
.th-p-bathroom-fixtures .bath-waterline::after,
.th-p-bathroom-fixtures .bath-waterline span {
  position: absolute;
  content: '';
}

.th-p-bathroom-fixtures .bath-waterline::before {
  top: 35%;
  left: 0;
  width: 100%;
  border-top: 1px solid #f7f3ec33;
}

.th-p-bathroom-fixtures .bath-waterline::after {
  top: 35%;
  left: 33%;
  height: 65%;
  border-left: 1px solid #f7f3ec33;
}

.th-p-bathroom-fixtures .bath-waterline span {
  bottom: 14%;
  left: 8%;
  width: min(21rem, 25vw);
  height: 1px;
  background: var(--bath-clay);
}

.th-p-bathroom-fixtures .bath-copy-ledge {
  position: absolute;
  top: clamp(1.35rem, 4vw, 4.5rem);
  left: clamp(1.25rem, 5vw, 5rem);
  z-index: 4;
  width: min(31.5rem, calc(100% - 2.5rem));
  padding: clamp(1.45rem, 3.6vw, 3.5rem) clamp(1.3rem, 3.8vw, 3.8rem) clamp(1.65rem, 4vw, 3.8rem);
  border-top: 1px solid #f7f3ec80;
  background: #16201ee8;
  color: var(--bath-bone);
  box-shadow: 0 1.2rem 3.5rem #00000028;
}

.th-p-bathroom-fixtures .bath-copy-ledge::after {
  position: absolute;
  right: 1.05rem;
  bottom: 1.05rem;
  width: 1.05rem;
  height: 1.05rem;
  border-right: 1px solid #f7f3ec66;
  border-bottom: 1px solid #f7f3ec66;
  content: '';
}

.th-p-bathroom-fixtures .bath-ledge-index,
.th-p-bathroom-fixtures .bath-kicker,
.th-p-bathroom-fixtures .bath-dock-label {
  margin: 0;
  color: #d7c2ae;
  font: 700 .59rem/1.3 var(--body);
  letter-spacing: .2em;
  text-transform: uppercase;
}

.th-p-bathroom-fixtures .bath-ledge-index {
  margin-bottom: clamp(1.35rem, 2.2vw, 2.2rem);
}

.th-p-bathroom-fixtures .bath-copy {
  max-width: 28rem;
}

.th-p-bathroom-fixtures .bath-copy .eyebrow {
  margin: 0 0 .9rem;
  color: #e7ddd0;
  font: 700 .62rem/1.35 var(--body);
  letter-spacing: .18em;
  text-transform: uppercase;
}

.th-p-bathroom-fixtures .bath-copy h1 {
  margin: 0;
  color: var(--bath-bone);
  font: 400 clamp(3.45rem, 6.15vw, 6.9rem)/.82 var(--display);
  letter-spacing: -.065em;
  overflow-wrap: anywhere;
}

.th-p-bathroom-fixtures .bath-copy h1.long {
  font-size: clamp(2.65rem, 4.7vw, 5.25rem);
  line-height: .9;
}

.th-p-bathroom-fixtures .bath-copy .sub {
  max-width: 29ch;
  margin: 1.55rem 0 0;
  color: #e8e1d5d9;
  font: 500 .77rem/1.65 var(--body);
  letter-spacing: .018em;
  overflow-wrap: anywhere;
}

.th-p-bathroom-fixtures .bath-copy .ctas {
  display: flex;
  flex-wrap: wrap;
  gap: .6rem;
  margin-top: 1.8rem;
}

.th-p-bathroom-fixtures .bath-copy .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.8rem;
  padding: .62rem 1rem;
  border: 1px solid #f7f3ec66;
  border-radius: 999px;
  background: transparent;
  color: var(--bath-bone);
  font: 700 .61rem/1 var(--body);
  letter-spacing: .12em;
  text-align: center;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-bathroom-fixtures .bath-copy .btn:first-child {
  border-color: var(--bath-bone);
  background: var(--bath-bone);
  color: var(--bath-ink);
}

.th-p-bathroom-fixtures .bath-copy .btn:hover,
.th-p-bathroom-fixtures .bath-copy .btn:focus-visible {
  border-color: #d7c2ae;
  background: #d7c2ae;
  color: var(--bath-ink);
}

.th-p-bathroom-fixtures .bath-hero-dock {
  position: absolute;
  right: clamp(1.1rem, 3vw, 3.25rem);
  bottom: clamp(1rem, 2.3vw, 2.4rem);
  z-index: 4;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: clamp(1.2rem, 3vw, 3.6rem);
  width: min(52rem, 57%);
  color: var(--bath-bone);
}

.th-p-bathroom-fixtures .bath-dock-label {
  max-width: 8ch;
  color: #e8dfd3ae;
}

.th-p-bathroom-fixtures .bath-dock-links {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: .2rem;
}

.th-p-bathroom-fixtures .bath-dock-links a {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: .65rem;
  min-width: 0;
  min-height: 3.9rem;
  padding: .15rem .55rem .15rem 0;
  border-right: 1px solid #f7f3ec44;
  color: var(--bath-bone);
  font: 600 clamp(.62rem, .8vw, .72rem)/1.25 var(--body);
  letter-spacing: .035em;
  overflow-wrap: anywhere;
  text-decoration: none;
}

.th-p-bathroom-fixtures .bath-dock-links a:last-child {
  border-right: 0;
}

.th-p-bathroom-fixtures .bath-dock-links a:hover,
.th-p-bathroom-fixtures .bath-dock-links a:focus-visible {
  color: #d7c2ae;
}

.th-p-bathroom-fixtures .bath-dock-number {
  color: #d7c2ae;
  font-size: .57rem;
  letter-spacing: .14em;
}

.th-p-bathroom-fixtures .bath-hero-motion {
  position: absolute;
  top: clamp(1rem, 2vw, 2rem);
  right: clamp(1rem, 2vw, 2rem);
  z-index: 6;
}

.th-p-bathroom-fixtures .bath-hero-motion:empty {
  display: none;
}

.th-p-bathroom-fixtures .bath-hero-motion .motion-toggle {
  position: static;
  inset: auto;
  min-height: 2.75rem;
  padding: .55rem .8rem;
  border: 1px solid #f7f3ec66;
  border-radius: 999px;
  background: #16201ec9;
  color: var(--bath-bone);
  font: 700 .58rem/1 var(--body);
  letter-spacing: .11em;
  text-transform: uppercase;
}

.th-p-bathroom-fixtures .bath-discovery {
  position: relative;
  padding: clamp(3.2rem, 6vw, 6.5rem) clamp(1.25rem, 4.5vw, 5.5rem) clamp(3rem, 5.4vw, 5.7rem);
  background: var(--bath-bone);
}

.th-p-bathroom-fixtures .bath-discovery-heading {
  position: relative;
  z-index: 2;
  width: min(31rem, 38%);
  padding-bottom: clamp(1.5rem, 3vw, 3rem);
}

.th-p-bathroom-fixtures .bath-kicker {
  color: var(--bath-clay);
}

.th-p-bathroom-fixtures .bath-discovery-heading h2 {
  margin: 1rem 0 0;
  color: var(--bath-ink);
  font: 400 clamp(2.7rem, 5vw, 5.25rem)/.86 var(--display);
  letter-spacing: -.06em;
  overflow-wrap: anywhere;
}

.th-p-bathroom-fixtures .bath-discovery-heading > p:last-of-type {
  max-width: 27ch;
  margin: 1.55rem 0 0;
  color: var(--muted);
  font: 500 .78rem/1.65 var(--body);
}

.th-p-bathroom-fixtures .bath-all-link {
  display: inline-flex;
  align-items: center;
  gap: .7rem;
  min-height: 2.75rem;
  margin-top: 1.55rem;
  border-bottom: 1px solid var(--bath-ink);
  color: var(--bath-ink);
  font: 700 .61rem/1 var(--body);
  letter-spacing: .14em;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-bathroom-fixtures .bath-all-link span {
  color: var(--bath-clay);
  font-size: 1rem;
}

.th-p-bathroom-fixtures .bath-chapter-line {
  position: absolute;
  top: clamp(7.5rem, 15.5vw, 15.3rem);
  right: clamp(1.25rem, 4.5vw, 5.5rem);
  left: calc(38% + 1rem);
  display: flex;
  align-items: center;
  height: 1px;
  background: var(--bath-line);
}

.th-p-bathroom-fixtures .bath-chapter-line span {
  width: 1.9rem;
  height: 1.9rem;
  border: 1px solid var(--bath-clay);
  border-radius: 50%;
  background: var(--bath-bone);
  transform: translateX(-1px);
}

.th-p-bathroom-fixtures .bath-chapter-line i {
  position: relative;
  display: block;
  flex: 1;
  height: 1px;
  background: transparent;
}

.th-p-bathroom-fixtures .bath-chapter-line i::after {
  position: absolute;
  top: 50%;
  right: 0;
  width: .35rem;
  height: .35rem;
  border-radius: 50%;
  background: var(--bath-clay);
  content: '';
  transform: translateY(-50%);
}

.th-p-bathroom-fixtures .bath-chapters {
  display: grid;
  grid-template-columns: minmax(0, 38%) repeat(4, minmax(0, 1fr));
  align-items: end;
}

.th-p-bathroom-fixtures .bath-chapter {
  display: grid;
  grid-template-rows: auto minmax(8rem, 14vw) auto;
  min-width: 0;
  padding: clamp(1.25rem, 2.5vw, 2.3rem) clamp(.7rem, 1.5vw, 1.4rem) 0;
  border-left: 1px solid var(--bath-line);
  color: var(--bath-ink);
  text-decoration: none;
}

.th-p-bathroom-fixtures .bath-chapter:first-child {
  grid-column: 2;
}

.th-p-bathroom-fixtures .bath-chapter-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 2.35rem;
  padding-bottom: .8rem;
}

.th-p-bathroom-fixtures .bath-chapter-no {
  color: var(--bath-clay);
  font: 700 .6rem/1 var(--body);
  letter-spacing: .13em;
}

.th-p-bathroom-fixtures .bath-chapter-arrow {
  color: var(--bath-ink);
  font: 400 1.3rem/1 var(--display);
}

.th-p-bathroom-fixtures .bath-chapter-media {
  position: relative;
  margin: 0;
  overflow: hidden;
  background: var(--bath-fog);
}

.th-p-bathroom-fixtures .bath-chapter-media .hero-media {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.th-p-bathroom-fixtures .bath-chapter-media > span {
  position: absolute;
  inset: 0;
  border: 1px solid #ffffff2e;
  background: linear-gradient(0deg, #16201e45, transparent 60%);
  pointer-events: none;
}

.th-p-bathroom-fixtures .bath-chapter-slate {
  display: grid;
  place-items: center;
  background: linear-gradient(130deg, #d7cec0, #eee9e0 51%, #bfb5a7);
}

.th-p-bathroom-fixtures .bath-chapter-slate span {
  width: 48%;
  aspect-ratio: 1.15;
  border: 1px solid #7a514166;
  border-radius: 50% 50% 46% 46%;
  box-shadow: inset 0 -1.6rem 0 #f7f3ec70;
}

.th-p-bathroom-fixtures .bath-chapter-copy {
  min-height: 5.8rem;
  padding: .9rem 0 1.35rem;
}

.th-p-bathroom-fixtures .bath-chapter-copy h3 {
  margin: 0;
  color: var(--bath-ink);
  font: 400 clamp(1.35rem, 2vw, 2.15rem)/.96 var(--display);
  letter-spacing: -.045em;
  overflow-wrap: anywhere;
}

.th-p-bathroom-fixtures .bath-chapter-copy p {
  margin: .6rem 0 0;
  color: var(--muted);
  font: 700 .57rem/1.3 var(--body);
  letter-spacing: .12em;
  text-transform: uppercase;
}

.th-p-bathroom-fixtures .bath-chapter:hover .bath-chapter-arrow,
.th-p-bathroom-fixtures .bath-chapter:focus-visible .bath-chapter-arrow {
  color: var(--bath-clay);
}

.th-p-bathroom-fixtures .bath-product-edit {
  display: grid;
  grid-template-columns: minmax(14rem, .85fr) minmax(0, 2.15fr);
  gap: clamp(1.5rem, 4vw, 4.5rem);
  align-items: start;
}

.th-p-bathroom-fixtures .bath-product-edit .bath-discovery-heading {
  width: auto;
  padding-bottom: 0;
}

.th-p-bathroom-fixtures .bath-product-grid,
.th-p-bathroom-fixtures .bath-product-edit .product-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  min-width: 0;
}

.th-p-bathroom-fixtures .bath-product-edit .product-card,
.th-p-bathroom-fixtures #shop .product-card {
  border-color: var(--bath-line);
  border-radius: 2px;
  background: transparent;
}

.th-p-bathroom-fixtures .bath-product-edit .product-card img,
.th-p-bathroom-fixtures #shop .product-card img {
  border-radius: 0;
}

.th-p-bathroom-fixtures #shop {
  padding-top: clamp(2.7rem, 5vw, 5.5rem);
  background: var(--bath-stone);
}

.th-p-bathroom-fixtures #shop .section-title,
.th-p-bathroom-fixtures #shop h2 {
  font-family: var(--display);
  font-weight: 400;
  letter-spacing: -.05em;
}

.th-p-bathroom-fixtures :is(.bath-copy .btn, .bath-dock-links a, .bath-all-link, .bath-chapter):focus-visible {
  outline: 2px solid var(--bath-clay);
  outline-offset: 4px;
}

@media (max-width: 980px) {
  .th-p-bathroom-fixtures .bath-copy-ledge {
    width: min(28rem, 47%);
  }

  .th-p-bathroom-fixtures .bath-copy h1 {
    font-size: clamp(3.2rem, 6.4vw, 5.4rem);
  }

  .th-p-bathroom-fixtures .bath-hero-dock {
    width: 61%;
    gap: 1.2rem;
  }

  .th-p-bathroom-fixtures .bath-chapters {
    grid-template-columns: minmax(0, 30%) repeat(4, minmax(0, 1fr));
  }

  .th-p-bathroom-fixtures .bath-chapter-line {
    left: calc(30% + 1rem);
  }

  .th-p-bathroom-fixtures .bath-discovery-heading {
    width: min(25rem, 30%);
  }
}

@media (max-width: 720px) {
  .th-p-bathroom-fixtures .bath-hero {
    padding: 0;
  }

  .th-p-bathroom-fixtures .bath-hero-canvas {
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: visible;
  }

  .th-p-bathroom-fixtures .bath-portal {
    position: relative;
    order: 1;
    height: clamp(22rem, 100vw, 31rem);
    min-height: clamp(22rem, 100vw, 31rem);
  }

  .th-p-bathroom-fixtures .bath-portal::before {
    background: linear-gradient(0deg, #10181786, transparent 54%);
  }

  .th-p-bathroom-fixtures .bath-portal .hero-media,
  .th-p-bathroom-fixtures .bath-portal .theme-empty-media {
    min-height: 0;
    object-position: 64% center;
  }

  .th-p-bathroom-fixtures .bath-portal figcaption {
    right: 1rem;
    bottom: 1.1rem;
  }

  .th-p-bathroom-fixtures .bath-copy-ledge {
    position: relative;
    top: auto;
    left: auto;
    order: 2;
    width: auto;
    padding: 2.1rem 1.25rem 2rem;
    border-top: 0;
    box-shadow: none;
  }

  .th-p-bathroom-fixtures .bath-ledge-index {
    margin-bottom: 1.2rem;
  }

  .th-p-bathroom-fixtures .bath-copy h1 {
    max-width: 11ch;
    font-size: clamp(3.2rem, 13.5vw, 5rem);
  }

  .th-p-bathroom-fixtures .bath-copy h1.long {
    font-size: clamp(2.6rem, 10.8vw, 4rem);
  }

  .th-p-bathroom-fixtures .bath-copy .sub {
    max-width: 38ch;
  }

  .th-p-bathroom-fixtures .bath-copy .btn {
    flex: 1 1 9.5rem;
  }

  .th-p-bathroom-fixtures .bath-waterline {
    position: relative;
    order: 3;
    height: 3.35rem;
  }

  .th-p-bathroom-fixtures .bath-waterline::before {
    top: 50%;
  }

  .th-p-bathroom-fixtures .bath-waterline::after {
    display: none;
  }

  .th-p-bathroom-fixtures .bath-waterline span {
    bottom: .85rem;
    left: 1.25rem;
    width: 31%;
  }

  .th-p-bathroom-fixtures .bath-hero-dock {
    position: relative;
    right: auto;
    bottom: auto;
    order: 4;
    grid-template-columns: 1fr;
    gap: .7rem;
    width: auto;
    padding: 1.2rem 1.25rem 1.4rem;
    background: #16201e;
  }

  .th-p-bathroom-fixtures .bath-dock-label {
    max-width: none;
  }

  .th-p-bathroom-fixtures .bath-dock-links {
    display: flex;
    gap: 0;
    overflow-x: auto;
    scrollbar-width: thin;
  }

  .th-p-bathroom-fixtures .bath-dock-links a {
    flex: 0 0 min(8.5rem, 42vw);
    min-height: 3.6rem;
    padding-right: .7rem;
  }

  .th-p-bathroom-fixtures .bath-hero-motion {
    top: 1rem;
    right: 1rem;
  }

  .th-p-bathroom-fixtures .bath-discovery {
    padding: 3.25rem 1.15rem 2.8rem;
  }

  .th-p-bathroom-fixtures .bath-discovery-heading {
    width: auto;
    padding-bottom: 1.8rem;
  }

  .th-p-bathroom-fixtures .bath-discovery-heading h2 {
    font-size: clamp(2.75rem, 12vw, 4.4rem);
  }

  .th-p-bathroom-fixtures .bath-discovery-heading > p:last-of-type {
    max-width: 34ch;
  }

  .th-p-bathroom-fixtures .bath-chapter-line {
    display: none;
  }

  .th-p-bathroom-fixtures .bath-chapters {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    border-top: 1px solid var(--bath-line);
  }

  .th-p-bathroom-fixtures .bath-chapter {
    grid-template-rows: auto minmax(8rem, 36vw) auto;
    padding: 1rem .75rem 0;
    border-bottom: 1px solid var(--bath-line);
  }

  .th-p-bathroom-fixtures .bath-chapter:first-child {
    grid-column: auto;
  }

  .th-p-bathroom-fixtures .bath-chapter:nth-child(odd) {
    border-left: 0;
  }

  .th-p-bathroom-fixtures .bath-chapter-copy {
    min-height: 5.1rem;
    padding-bottom: 1.1rem;
  }

  .th-p-bathroom-fixtures .bath-chapter-copy h3 {
    font-size: clamp(1.35rem, 6.4vw, 2rem);
  }

  .th-p-bathroom-fixtures .bath-product-edit {
    display: block;
  }

  .th-p-bathroom-fixtures .bath-product-edit .bath-discovery-heading {
    margin-bottom: 1.6rem;
  }

  .th-p-bathroom-fixtures .bath-product-grid,
  .th-p-bathroom-fixtures .bath-product-edit .product-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 390px) {
  .th-p-bathroom-fixtures .bath-copy-ledge {
    padding-right: 1.1rem;
    padding-left: 1.1rem;
  }

  .th-p-bathroom-fixtures .bath-copy h1 {
    font-size: 3.15rem;
  }

  .th-p-bathroom-fixtures .bath-copy .ctas {
    gap: .45rem;
  }

  .th-p-bathroom-fixtures .bath-copy .btn {
    flex-basis: 100%;
  }

  .th-p-bathroom-fixtures .bath-chapter {
    padding-right: .58rem;
    padding-left: .58rem;
  }

  .th-p-bathroom-fixtures .bath-chapter-copy h3 {
    font-size: 1.34rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .th-p-bathroom-fixtures .has-hero-motion .hero-media,
  .th-p-bathroom-fixtures .bath-copy .btn,
  .th-p-bathroom-fixtures .bath-dock-links a,
  .th-p-bathroom-fixtures .bath-chapter-arrow {
    animation: none !important;
    transition: none !important;
  }
}
`;

import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-wall-art',
  name: 'Contour House',
  for: 'Framed wall art and original print editions',
  vibe: 'A considered gallery wall in mineral tones, oak, and ink',
  category: 'Framed wall art and original prints',
  group: 'home',
  display: 'DM Serif Display',
  body: 'DM Sans',
  displayWeight: 400,
  tracking: '-.035em',
  colors: {
    bg: '#E8E4DA',
    surface: '#F8F6F0',
    ink: '#22231F',
    muted: '#6F7068',
    line: '#C9C4B8',
    accent: '#B34E35',
    onAccent: '#FFFDF8',
    panel: '#303832',
    onPanel: '#F7F3E9',
    foot: '#22231F',
    onFoot: '#F7F3E9',
    bar: '#E1DBCD',
    onBar: '#22231F',
    badge: '#D7B998',
    onBadge: '#22231F',
  },
  header: 'center',
  hero: 'editorial',
  card: 'boxed',
  ratio: '4/5',
  rCard: 0,
  rBtn: 0,
  motion: 'pan',
  copy: {
    eyebrow: 'A collected point of view',
    collection: 'The hanging plan',
    cta: 'View the works',
    title: 'Make a wall your own.',
    subtitle: 'Framed pieces for rooms with something to say.',
  },
});

const categoryCount = (category) => {
  const count = Number(category.count) || 0;
  return `${count} ${count === 1 ? 'work' : 'works'}`;
};

const categoryCard = (ctx, category, index) => {
  const image = category.image
    ? `<img src="${ctx.esc(category.image)}" alt="" loading="lazy" decoding="async">`
    : `<span class="wall-art-placeholder wall-art-placeholder-${(index % 5) + 1}" aria-hidden="true"><i></i><b></b></span>`;

  return `<a class="wall-art-category-card wall-art-category-card-${index + 1}" href="${ctx.esc(ctx.categoryLink(category.name))}">
    <span class="wall-art-category-media">${image}</span>
    <span class="wall-art-category-caption">
      <span class="wall-art-card-number">${String(index + 1).padStart(2, '0')}</span>
      <span class="wall-art-category-name"><b>${ctx.esc(category.name)}</b><small>${ctx.esc(categoryCount(category))}</small></span>
      <span class="wall-art-card-arrow" aria-hidden="true">↗</span>
    </span>
  </a>`;
};

export function hero(ctx) {
  return `<section class="hero category-hero wall-art-hero${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="wall-art-hero-shell">
      <p class="wall-art-folio" aria-hidden="true"><span>Contour</span><span>House</span></p>
      <p class="wall-art-hero-index" aria-hidden="true">Wall study / 01</p>
      <figure class="wall-art-hero-frame">
        ${ctx.media(0, { priority: true, lazy: false, decorative: true })}
        <figcaption>Room for a point of view</figcaption>
      </figure>
      <div class="wall-art-copy-paper">
        <span class="wall-art-paper-mark" aria-hidden="true"></span>
        ${ctx.copy('wall-art-copy')}
      </div>
      <p class="wall-art-scale-note" aria-hidden="true">Collected<br>at home</p>
    </div>
    ${ctx.controls}
  </section>`;
}

export function discovery(ctx) {
  const categories = (ctx.cats || []).filter((category) => category && category.name).slice(0, 5);
  const products = (ctx.products || []).slice(0, 3);

  if (categories.length >= 2) {
    return `<section class="wall-art-discovery" aria-labelledby="wall-art-discovery-title">
      <div class="wall-art-discovery-intro">
        <p class="wall-art-kicker">The hanging plan</p>
        <h2 id="wall-art-discovery-title">Start with a wall.</h2>
        <p>Browse the available collection by the kind of composition that feels right for your room.</p>
        <a class="wall-art-view-all" href="#shop">View all available works <span aria-hidden="true">→</span></a>
      </div>
      <div class="wall-art-salon" aria-label="Browse wall art collections">
        ${categories.map((category, index) => categoryCard(ctx, category, index)).join('')}
      </div>
    </section>`;
  }

  if (products.length) {
    return `<section class="wall-art-discovery wall-art-edition-shelf" aria-labelledby="wall-art-edition-shelf-title">
      <div class="wall-art-discovery-intro">
        <p class="wall-art-kicker">The current edit</p>
        <h2 id="wall-art-edition-shelf-title">Begin with a piece.</h2>
        <p>Explore the works currently available from this collection.</p>
        <a class="wall-art-view-all" href="#shop">See all available works <span aria-hidden="true">→</span></a>
      </div>
      <div class="wall-art-product-shelf">${products.map((product) => ctx.productCard(product)).join('')}</div>
    </section>`;
  }

  return '';
}

export const css = `
.th-p-wall-art {
  --wall-art-paper: #F8F6F0;
  --wall-art-plaster: #E8E4DA;
  --wall-art-ink: #22231F;
  --wall-art-soft-ink: #6F7068;
  --wall-art-rule: #C9C4B8;
  --wall-art-oxide: #B34E35;
  --wall-art-moss: #303832;
  background: var(--wall-art-plaster);
  color: var(--wall-art-ink);
  overflow-x: clip;
}

.th-p-wall-art .hd {
  background: color-mix(in srgb, var(--wall-art-paper) 92%, transparent);
  border-bottom: 1px solid var(--wall-art-rule);
}

.th-p-wall-art .brand {
  color: var(--wall-art-ink);
  font: 400 calc(27px * var(--ts))/1 var(--display);
  letter-spacing: .02em;
}

.th-p-wall-art .nav {
  gap: clamp(16px, 2.6vw, 38px);
}

.th-p-wall-art .nav a {
  color: var(--wall-art-ink);
  font-size: 11px;
  letter-spacing: .12em;
  text-transform: uppercase;
}

.th-p-wall-art .nav a[aria-current],
.th-p-wall-art .nav a:hover {
  color: var(--wall-art-oxide);
}

.th-p-wall-art .cart {
  width: 52px;
  border-left: 1px solid var(--wall-art-rule);
  border-radius: 0;
  color: var(--wall-art-ink);
}

.th-p-wall-art .wall-art-hero {
  position: relative;
  isolation: isolate;
  min-height: clamp(39rem, 61vw, 52rem);
  overflow: hidden;
  background:
    linear-gradient(90deg, #d4cec1 0 1px, transparent 1px) 0 0 / clamp(5rem, 9vw, 10rem) 100%,
    var(--wall-art-plaster);
  border-bottom: 1px solid var(--wall-art-rule);
}

.th-p-wall-art .wall-art-hero-shell {
  position: relative;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-template-rows: minmax(2.75rem, .6fr) minmax(28rem, 1fr) minmax(3rem, .6fr);
  min-height: inherit;
  max-width: 1680px;
  margin: 0 auto;
  padding: 0 clamp(1.2rem, 4vw, 4.8rem);
}

.th-p-wall-art .wall-art-folio {
  position: absolute;
  top: clamp(1.4rem, 3.4vw, 3.6rem);
  left: clamp(1.2rem, 4vw, 4.8rem);
  z-index: 3;
  display: grid;
  gap: .04em;
  margin: 0;
  color: var(--wall-art-ink);
  font: 400 clamp(1.1rem, 1.8vw, 1.65rem)/.78 var(--display);
  letter-spacing: -.035em;
}

.th-p-wall-art .wall-art-folio span:last-child {
  padding-left: .78rem;
}

.th-p-wall-art .wall-art-hero-index,
.th-p-wall-art .wall-art-scale-note {
  position: absolute;
  z-index: 3;
  margin: 0;
  color: var(--wall-art-soft-ink);
  font: 700 9px/1.45 var(--body);
  letter-spacing: .19em;
  text-transform: uppercase;
}

.th-p-wall-art .wall-art-hero-index {
  top: clamp(1.8rem, 4vw, 4.1rem);
  right: clamp(1.2rem, 4vw, 4.8rem);
}

.th-p-wall-art .wall-art-scale-note {
  right: clamp(1.2rem, 4vw, 4.8rem);
  bottom: clamp(1.5rem, 3.8vw, 3.8rem);
  text-align: right;
}

.th-p-wall-art .wall-art-hero-frame {
  position: relative;
  z-index: 1;
  grid-column: 2 / 11;
  grid-row: 2;
  min-width: 0;
  min-height: 0;
  margin: 0;
  padding: clamp(.55rem, 1.15vw, 1.15rem);
  overflow: hidden;
  background: #ECE7DB;
  box-shadow: 0 1.2rem 2.8rem #34302725;
}

.th-p-wall-art .wall-art-hero-frame::before {
  position: absolute;
  inset: 0;
  z-index: 1;
  border: 1px solid #FFFFFF9B;
  content: '';
  pointer-events: none;
}

.th-p-wall-art .wall-art-hero-frame .hero-media,
.th-p-wall-art .wall-art-hero-frame .theme-empty-media {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 100%;
  object-fit: cover;
  object-position: center;
}

.th-p-wall-art .wall-art-hero-frame .theme-empty-media {
  position: relative;
  display: grid;
  place-items: center;
  background:
    linear-gradient(118deg, transparent 0 21%, #24303C 21% 34%, transparent 34% 47%, #B34E35 47% 61%, transparent 61%),
    radial-gradient(circle at 70% 35%, #F2E7D3 0 11%, transparent 11.5%),
    #B8AD9B;
  color: #F8F6F0;
}

.th-p-wall-art .wall-art-hero-frame .theme-empty-media span {
  max-width: 16ch;
  color: #F8F6F0;
  font: 400 clamp(1.7rem, 3vw, 3.4rem)/.9 var(--display);
}

.th-p-wall-art .wall-art-hero-frame figcaption {
  position: absolute;
  bottom: clamp(1rem, 2.2vw, 2rem);
  left: clamp(1rem, 2.2vw, 2rem);
  z-index: 2;
  margin: 0;
  color: #F9F7F0;
  font: 700 9px/1.4 var(--body);
  letter-spacing: .19em;
  text-shadow: 0 1px 14px #0008;
  text-transform: uppercase;
}

.th-p-wall-art .wall-art-copy-paper {
  position: relative;
  z-index: 4;
  display: flex;
  grid-column: 8 / 13;
  grid-row: 2;
  align-self: end;
  justify-self: end;
  width: min(100%, 31rem);
  min-width: 0;
  padding: clamp(1.6rem, 3.4vw, 3.7rem) clamp(1.4rem, 3vw, 3.3rem);
  background: var(--wall-art-paper);
  box-shadow: 0 .85rem 2rem #34302720;
  transform: translate(clamp(1rem, 3.5vw, 4rem), clamp(1.2rem, 3vw, 3rem));
}

.th-p-wall-art .wall-art-paper-mark {
  position: absolute;
  top: 0;
  left: 0;
  width: 4.1rem;
  height: .3rem;
  background: var(--wall-art-oxide);
}

.th-p-wall-art .wall-art-copy {
  max-width: 100%;
}

.th-p-wall-art .wall-art-copy .eyebrow,
.th-p-wall-art .wall-art-kicker {
  margin: 0;
  color: var(--wall-art-oxide);
  font: 700 9px/1.4 var(--body);
  letter-spacing: .19em;
  text-transform: uppercase;
}

.th-p-wall-art .wall-art-copy h1 {
  max-width: 10ch;
  margin: .9rem 0 0;
  color: var(--wall-art-ink);
  font: 400 clamp(3rem, 5.45vw, 6.3rem)/.84 var(--display);
  letter-spacing: -.055em;
  overflow-wrap: anywhere;
}

.th-p-wall-art .wall-art-copy h1.long {
  max-width: 14ch;
  font-size: clamp(2.45rem, 4vw, 4.55rem);
  line-height: .91;
}

.th-p-wall-art .wall-art-copy .sub {
  max-width: 30ch;
  margin: 1.15rem 0 0;
  color: var(--wall-art-soft-ink);
  font: 500 clamp(.74rem, 1vw, .85rem)/1.65 var(--body);
  letter-spacing: .015em;
  overflow-wrap: anywhere;
}

.th-p-wall-art .wall-art-copy .ctas {
  display: flex;
  flex-wrap: wrap;
  gap: .55rem;
  margin-top: 1.55rem;
}

.th-p-wall-art .wall-art-copy .btn,
.th-p-wall-art .wall-art-view-all {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  border-radius: 0;
  font: 700 10px/1 var(--body);
  letter-spacing: .12em;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-wall-art .wall-art-copy .btn {
  padding: .75rem 1rem;
  border: 1px solid var(--wall-art-ink);
  background: var(--wall-art-ink);
  color: var(--wall-art-paper);
}

.th-p-wall-art .wall-art-copy .btn.ghost {
  border-color: var(--wall-art-rule);
  background: transparent;
  color: var(--wall-art-ink);
}

.th-p-wall-art .wall-art-copy .btn:hover,
.th-p-wall-art .wall-art-copy .btn:focus-visible {
  border-color: var(--wall-art-oxide);
  background: var(--wall-art-oxide);
  color: #FFFDF8;
}

.th-p-wall-art .wall-art-hero > .motion-toggle {
  position: absolute;
  right: clamp(1rem, 2.5vw, 2.5rem);
  bottom: clamp(1rem, 2.2vw, 2rem);
  z-index: 6;
  min-height: 44px;
  padding: .55rem .8rem;
  border: 1px solid var(--wall-art-rule);
  border-radius: 0;
  background: #F8F6F0D9;
  color: var(--wall-art-ink);
  font: 700 9px/1 var(--body);
  letter-spacing: .12em;
  text-transform: uppercase;
}

.th-p-wall-art .wall-art-discovery {
  display: grid;
  grid-template-columns: minmax(13rem, .86fr) minmax(0, 2.35fr);
  gap: clamp(2rem, 5vw, 6.8rem);
  align-items: start;
  max-width: 1680px;
  margin: 0 auto;
  padding: clamp(4rem, 8vw, 8rem) clamp(1.2rem, 4vw, 4.8rem);
  background: var(--wall-art-paper);
}

.th-p-wall-art .wall-art-discovery-intro {
  position: sticky;
  top: 1.5rem;
  min-width: 0;
  padding: .2rem 0 1.4rem;
}

.th-p-wall-art .wall-art-discovery-intro h2 {
  max-width: 8ch;
  margin: .8rem 0 0;
  color: var(--wall-art-ink);
  font: 400 clamp(3rem, 4.65vw, 5.7rem)/.84 var(--display);
  letter-spacing: -.055em;
  overflow-wrap: anywhere;
}

.th-p-wall-art .wall-art-discovery-intro > p:last-of-type {
  max-width: 28ch;
  margin: 1.25rem 0 0;
  color: var(--wall-art-soft-ink);
  font: 500 .8rem/1.72 var(--body);
}

.th-p-wall-art .wall-art-view-all {
  justify-content: flex-start;
  gap: .7rem;
  margin-top: 1.8rem;
  padding-right: .2rem;
  border-bottom: 1px solid var(--wall-art-ink);
  color: var(--wall-art-ink);
}

.th-p-wall-art .wall-art-view-all span {
  color: var(--wall-art-oxide);
  font-size: 1.2rem;
}

.th-p-wall-art .wall-art-salon {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-auto-rows: clamp(1.65rem, 3.2vw, 3.45rem);
  gap: clamp(.65rem, 1.3vw, 1.25rem);
  min-width: 0;
}

.th-p-wall-art .wall-art-category-card {
  position: relative;
  display: flex;
  min-width: 0;
  overflow: hidden;
  background: #E4DED2;
  color: var(--wall-art-ink);
  text-decoration: none;
}

.th-p-wall-art .wall-art-category-card-1 { grid-column: 1 / 6; grid-row: 1 / 9; }
.th-p-wall-art .wall-art-category-card-2 { grid-column: 6 / 10; grid-row: 2 / 8; }
.th-p-wall-art .wall-art-category-card-3 { grid-column: 10 / 13; grid-row: 1 / 7; }
.th-p-wall-art .wall-art-category-card-4 { grid-column: 1 / 5; grid-row: 9 / 15; }
.th-p-wall-art .wall-art-category-card-5 { grid-column: 5 / 11; grid-row: 8 / 15; }

.th-p-wall-art .wall-art-category-media {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #D7D0C4;
}

.th-p-wall-art .wall-art-category-media::after {
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, #1719149C 0%, #17191412 57%, transparent 100%);
  content: '';
  pointer-events: none;
}

.th-p-wall-art .wall-art-category-media img,
.th-p-wall-art .wall-art-placeholder {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.th-p-wall-art .wall-art-placeholder {
  position: relative;
  overflow: hidden;
  background: #C5B9A6;
}

.th-p-wall-art .wall-art-placeholder::before,
.th-p-wall-art .wall-art-placeholder::after,
.th-p-wall-art .wall-art-placeholder i,
.th-p-wall-art .wall-art-placeholder b {
  position: absolute;
  display: block;
  content: '';
}

.th-p-wall-art .wall-art-placeholder::before {
  top: 13%;
  left: 18%;
  width: 54%;
  height: 66%;
  border: clamp(.3rem, .6vw, .65rem) solid #EEE9DF;
  background: #36403B;
  box-shadow: .4rem .5rem 0 #2A2D2A33;
}

.th-p-wall-art .wall-art-placeholder::after {
  right: 5%;
  bottom: 14%;
  width: 39%;
  aspect-ratio: 1;
  background: #B34E35;
  clip-path: polygon(50% 0, 100% 54%, 63% 100%, 0 72%, 12% 23%);
}

.th-p-wall-art .wall-art-placeholder i {
  top: 28%;
  left: 28%;
  width: 35%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: #D7B998;
}

.th-p-wall-art .wall-art-placeholder b {
  bottom: 23%;
  left: 26%;
  width: 42%;
  height: 8%;
  background: #F8F6F0;
  transform: rotate(-19deg);
}

.th-p-wall-art .wall-art-placeholder-2 { background: #B4B8AC; }
.th-p-wall-art .wall-art-placeholder-2::before { background: #B34E35; transform: rotate(-8deg); }
.th-p-wall-art .wall-art-placeholder-2::after { background: #24303C; }
.th-p-wall-art .wall-art-placeholder-3 { background: #D5C8B8; }
.th-p-wall-art .wall-art-placeholder-3::before { top: 18%; left: 27%; background: #24303C; transform: rotate(12deg); }
.th-p-wall-art .wall-art-placeholder-3::after { right: 18%; bottom: 9%; background: #E6DFCE; }
.th-p-wall-art .wall-art-placeholder-4 { background: #9CA49A; }
.th-p-wall-art .wall-art-placeholder-4::before { left: 10%; width: 67%; background: #F1E6D5; }
.th-p-wall-art .wall-art-placeholder-4::after { background: #B34E35; transform: rotate(18deg); }
.th-p-wall-art .wall-art-placeholder-5 { background: #C6B8A4; }
.th-p-wall-art .wall-art-placeholder-5::before { top: 9%; left: 26%; height: 76%; background: #2E3934; }
.th-p-wall-art .wall-art-placeholder-5::after { right: 9%; bottom: 9%; background: #D7B998; }

.th-p-wall-art .wall-art-category-caption {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-self: flex-end;
  width: 100%;
  min-height: 5.3rem;
  padding: .85rem clamp(.75rem, 1.35vw, 1.35rem);
  color: #FFFDF8;
}

.th-p-wall-art .wall-art-card-number {
  padding-right: .7rem;
  color: #FFFDF899;
  font: 700 9px/1.35 var(--body);
  letter-spacing: .15em;
}

.th-p-wall-art .wall-art-category-name {
  display: grid;
  align-content: end;
  min-width: 0;
  gap: .22rem;
}

.th-p-wall-art .wall-art-category-name b {
  font: 400 clamp(1.2rem, 1.7vw, 1.85rem)/.95 var(--display);
  letter-spacing: -.03em;
  overflow-wrap: anywhere;
}

.th-p-wall-art .wall-art-category-name small {
  color: #FFFDF8C7;
  font: 600 9px/1.3 var(--body);
  letter-spacing: .1em;
  text-transform: uppercase;
}

.th-p-wall-art .wall-art-card-arrow {
  align-self: end;
  padding-left: .55rem;
  color: #FFFDF8;
  font-size: 1.35rem;
  line-height: .9;
}

.th-p-wall-art .wall-art-category-card:focus-visible {
  outline: 3px solid var(--wall-art-oxide);
  outline-offset: 4px;
}

.th-p-wall-art .wall-art-edition-shelf {
  grid-template-columns: minmax(13rem, .86fr) minmax(0, 2.35fr);
}

.th-p-wall-art .wall-art-product-shelf {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(.85rem, 1.6vw, 1.5rem);
  min-width: 0;
}

.th-p-wall-art .wall-art-product-shelf .pc {
  gap: .8rem;
  color: var(--wall-art-ink);
}

.th-p-wall-art .wall-art-product-shelf .pc .im {
  overflow: hidden;
  border: 1px solid var(--wall-art-rule);
  border-radius: 0;
  background: #E4DED2;
}

.th-p-wall-art .wall-art-product-shelf .pc .bd {
  padding: 0 .15rem;
}

.th-p-wall-art .wall-art-product-shelf .pc h3 {
  font: 400 clamp(1.2rem, 1.6vw, 1.7rem)/1 var(--display);
  letter-spacing: -.025em;
}

.th-p-wall-art #shop {
  padding-top: clamp(3.8rem, 6vw, 7rem);
  background: var(--wall-art-plaster);
}

.th-p-wall-art #shop .sec-h {
  align-items: end;
  padding-bottom: clamp(1.25rem, 2vw, 2rem);
  border-bottom: 1px solid var(--wall-art-rule);
}

.th-p-wall-art #shop .sec-h h2 {
  color: var(--wall-art-ink);
  font: 400 clamp(2.8rem, 4.7vw, 5.5rem)/.86 var(--display);
  letter-spacing: -.055em;
}

.th-p-wall-art #shop .chips {
  gap: .45rem;
}

.th-p-wall-art #shop .chip {
  min-height: 38px;
  padding: .55rem .75rem;
  border: 1px solid var(--wall-art-rule);
  border-radius: 0;
  background: transparent;
  color: var(--wall-art-ink);
  font-size: 10px;
  letter-spacing: .07em;
}

.th-p-wall-art #shop .chip[aria-current],
.th-p-wall-art #shop .chip:hover {
  border-color: var(--wall-art-ink);
  background: var(--wall-art-ink);
  color: var(--wall-art-paper);
}

.th-p-wall-art #shop .grid {
  gap: clamp(2.5rem, 4vw, 4.6rem) clamp(1rem, 1.8vw, 1.75rem);
}

.th-p-wall-art #shop .pc {
  gap: .8rem;
}

.th-p-wall-art #shop .pc .im {
  overflow: hidden;
  border: 1px solid var(--wall-art-rule);
  border-radius: 0;
  background: #DDD5C7;
}

.th-p-wall-art #shop .pc .bd {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: .3rem .8rem;
  padding: 0 .15rem;
}

.th-p-wall-art #shop .pc h3 {
  color: var(--wall-art-ink);
  font: 400 clamp(1.22rem, 1.6vw, 1.75rem)/1 var(--display);
  letter-spacing: -.025em;
}

.th-p-wall-art #shop .pc .pr {
  color: var(--wall-art-soft-ink);
  font-size: 12px;
  white-space: nowrap;
}

.th-p-wall-art #shop .pc .tag {
  top: 0;
  left: 0;
  border-radius: 0;
  background: var(--wall-art-oxide);
  color: #FFFDF8;
}

.th-p-wall-art #shop .pc .go {
  border-radius: 0;
  background: var(--wall-art-ink);
  color: var(--wall-art-paper);
}

@media (max-width: 920px) {
  .th-p-wall-art .wall-art-copy-paper {
    grid-column: 7 / 13;
    transform: translate(1.2rem, 1.7rem);
  }

  .th-p-wall-art .wall-art-hero-frame {
    grid-column: 2 / 12;
  }

  .th-p-wall-art .wall-art-discovery {
    grid-template-columns: minmax(11.5rem, .8fr) minmax(0, 2fr);
    gap: 2.4rem;
  }

  .th-p-wall-art .wall-art-salon {
    grid-auto-rows: clamp(1.55rem, 4.2vw, 2.7rem);
  }
}

@media (max-width: 700px) {
  .th-p-wall-art .brand {
    font-size: calc(23px * var(--ts));
  }

  .th-p-wall-art .wall-art-hero {
    min-height: 0;
  }

  .th-p-wall-art .wall-art-hero-shell {
    display: flex;
    flex-direction: column;
    min-height: 0;
    padding: 0;
  }

  .th-p-wall-art .wall-art-folio {
    top: 1.15rem;
    left: 1.15rem;
  }

  .th-p-wall-art .wall-art-hero-index {
    top: 1.3rem;
    right: 1.15rem;
  }

  .th-p-wall-art .wall-art-hero-frame {
    order: 1;
    width: calc(100% - 2.3rem);
    min-height: clamp(19rem, 82vw, 29rem);
    margin: 4.8rem 1.15rem 0;
    padding: .55rem;
  }

  .th-p-wall-art .wall-art-hero-frame figcaption {
    bottom: 1.15rem;
    left: 1.15rem;
  }

  .th-p-wall-art .wall-art-copy-paper {
    order: 2;
    width: calc(100% - 2.3rem);
    margin: -1.2rem 1.15rem 2.25rem;
    padding: 2rem 1.3rem 1.6rem;
    transform: none;
  }

  .th-p-wall-art .wall-art-copy h1 {
    max-width: 12ch;
    font-size: clamp(3.25rem, 14vw, 4.75rem);
  }

  .th-p-wall-art .wall-art-copy h1.long {
    font-size: clamp(2.5rem, 11vw, 3.65rem);
  }

  .th-p-wall-art .wall-art-scale-note {
    display: none;
  }

  .th-p-wall-art .wall-art-hero > .motion-toggle {
    right: 1.7rem;
    bottom: auto;
    top: 5.55rem;
  }

  .th-p-wall-art .wall-art-discovery {
    display: block;
    padding: 3.5rem 1.15rem 4rem;
  }

  .th-p-wall-art .wall-art-discovery-intro {
    position: static;
    padding: 0;
  }

  .th-p-wall-art .wall-art-discovery-intro h2 {
    max-width: 10ch;
    font-size: clamp(3rem, 13vw, 4.35rem);
  }

  .th-p-wall-art .wall-art-view-all {
    margin-top: 1.25rem;
  }

  .th-p-wall-art .wall-art-salon {
    margin-top: 2.5rem;
    grid-auto-rows: clamp(1.7rem, 8vw, 2.45rem);
    gap: .65rem;
  }

  .th-p-wall-art .wall-art-category-card-1 { grid-column: 1 / 8; grid-row: 1 / 8; }
  .th-p-wall-art .wall-art-category-card-2 { grid-column: 8 / 13; grid-row: 2 / 7; }
  .th-p-wall-art .wall-art-category-card-3 { grid-column: 1 / 6; grid-row: 8 / 13; }
  .th-p-wall-art .wall-art-category-card-4 { grid-column: 6 / 13; grid-row: 7 / 14; }
  .th-p-wall-art .wall-art-category-card-5 { grid-column: 1 / 13; grid-row: 14 / 20; }

  .th-p-wall-art .wall-art-category-caption {
    min-height: 4.7rem;
    padding: .7rem .75rem;
  }

  .th-p-wall-art .wall-art-category-name b {
    font-size: clamp(1.08rem, 4.8vw, 1.5rem);
  }

  .th-p-wall-art .wall-art-edition-shelf {
    display: block;
  }

  .th-p-wall-art .wall-art-product-shelf {
    margin-top: 2rem;
  }

  .th-p-wall-art #shop .sec-h {
    align-items: start;
    flex-direction: column;
  }
}

@media (max-width: 430px) {
  .th-p-wall-art .cart {
    width: 46px;
  }

  .th-p-wall-art .wall-art-folio {
    font-size: 1.05rem;
  }

  .th-p-wall-art .wall-art-hero-index {
    font-size: 8px;
  }

  .th-p-wall-art .wall-art-hero-frame {
    min-height: clamp(18rem, 91vw, 25rem);
  }

  .th-p-wall-art .wall-art-copy-paper {
    margin-bottom: 1.6rem;
  }

  .th-p-wall-art .wall-art-copy .ctas {
    gap: .45rem;
  }

  .th-p-wall-art .wall-art-copy .btn {
    flex: 1 1 auto;
    padding-inline: .65rem;
  }

  .th-p-wall-art .wall-art-discovery-intro > p:last-of-type {
    max-width: 34ch;
  }

  .th-p-wall-art .wall-art-salon {
    grid-auto-rows: clamp(1.5rem, 9.8vw, 2.25rem);
  }

  .th-p-wall-art .wall-art-card-number,
  .th-p-wall-art .wall-art-category-name small {
    font-size: 8px;
  }

  .th-p-wall-art .wall-art-product-shelf {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .th-p-wall-art #shop .chips {
    width: 100%;
    overflow-x: auto;
    flex-wrap: nowrap;
    scrollbar-width: none;
  }

  .th-p-wall-art #shop .chip {
    flex: 0 0 auto;
    min-height: 44px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .th-p-wall-art .wall-art-category-card,
  .th-p-wall-art .wall-art-copy .btn,
  .th-p-wall-art .wall-art-view-all {
    transition: none;
  }
}
`;

import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-fishing-equipment',
  name: 'Current & Cane',
  for: 'Fly anglers assembling considered river-day kits',
  vibe: 'Dawn river water, weathered cedar, quiet field notes, and tactile tackle detail',
  category: 'Fly fishing and freshwater angling equipment',
  group: 'outdoor',
  display: 'DM Serif Display',
  body: 'Manrope',
  displayWeight: 400,
  tracking: '-.04em',
  colors: {
    bg: '#E8E3D7',
    surface: '#F7F4EC',
    ink: '#142D2A',
    muted: '#61736D',
    line: '#C9C9BC',
    accent: '#C86E3A',
    onAccent: '#FFF9F0',
    panel: '#20443E',
    onPanel: '#F1EEE3',
    foot: '#102723',
    onFoot: '#F4F0E6',
    bar: '#173A35',
    onBar: '#F5F1E7',
    badge: '#D9A764',
    onBadge: '#17302C',
  },
  header: 'split',
  hero: 'editorial',
  card: 'minimal',
  ratio: '4/5',
  rCard: 2,
  rBtn: 999,
  motion: 'drift',
  copy: {
    eyebrow: 'River daybook',
    collection: 'Set the deck',
    cta: 'Browse the tackle table',
    title: 'Find the quiet water.',
    subtitle: 'Thoughtful tackle for the hours before the river wakes.',
  },
});

const list = (value) => Array.isArray(value) ? value : [];
const countLabel = (count) => {
  const safeCount = Number(count) || 0;
  return `${safeCount} ${safeCount === 1 ? 'piece' : 'pieces'}`;
};

function currentIndex(ctx, categories) {
  if (categories.length < 2) return '';
  return `<nav class="tide-current-index" aria-label="Shop fishing categories">
    ${categories.map((category, index) => `<a href="${ctx.esc(ctx.categoryLink(category.name))}">
      <span class="tide-current-index__number">${String(index + 1).padStart(2, '0')}</span>
      <span class="tide-current-index__name">${ctx.esc(category.name)}</span>
      <small>${ctx.esc(countLabel(category.count))}</small>
      <i aria-hidden="true">↗</i>
    </a>`).join('')}
  </nav>`;
}

export function hero(ctx) {
  const categories = list(ctx.cats).filter((category) => category?.name).slice(0, 3);
  const index = currentIndex(ctx, categories);
  const indexed = index ? ' tide-hero--indexed' : '';

  return `<section class="hero category-hero tide-hero${indexed}${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="tide-hero__photo">${ctx.media(0, { priority: true, lazy: false })}</div>
    <div class="tide-hero__veil" aria-hidden="true"></div>
    <div class="tide-hero__arc" aria-hidden="true"><span></span><i></i><b></b></div>
    <p class="tide-hero__margin" aria-hidden="true"><span>River daybook</span><span>Rig / line / water</span></p>
    <div class="tide-hero__ledger">${ctx.copy('tide-hero__copy')}</div>
    ${index}
    ${ctx.controls}
  </section>`;
}

function bankVisual(ctx, category, index) {
  if (category.image) {
    return `<div class="tide-bank-card__media"><img src="${ctx.esc(category.image)}" alt="" loading="lazy" decoding="async"></div>`;
  }
  return `<div class="tide-bank-card__media tide-bank-card__empty" aria-hidden="true"><span>${String(index + 1).padStart(2, '0')}</span><i></i><b></b></div>`;
}

function bankCards(ctx, categories) {
  return `<div class="tide-bank-cards tide-bank-cards--${categories.length}">
    ${categories.map((category, index) => `<a class="tide-bank-card" href="${ctx.esc(ctx.categoryLink(category.name))}">
      ${bankVisual(ctx, category, index)}
      <span class="tide-bank-card__wash" aria-hidden="true"></span>
      <span class="tide-bank-card__copy">
        <small>Water ${String(index + 1).padStart(2, '0')}</small>
        <b>${ctx.esc(category.name)}</b>
        <em>${ctx.esc(countLabel(category.count))}<i aria-hidden="true">→</i></em>
      </span>
    </a>`).join('')}
  </div>`;
}

function hookCard(ctx, product, index) {
  const title = product?.title || 'Untitled product';
  const cents = Number(product?.price_cents);
  const price = Number.isFinite(cents) ? ctx.money(cents, product?.currency || 'usd') : '';
  const image = product?.image_url
    ? `<div class="tide-hook-card__media"><img src="${ctx.esc(product.image_url)}" alt="${ctx.esc(product.alt_text || title)}" loading="lazy" decoding="async"></div>`
    : `<div class="tide-hook-card__media tide-hook-card__empty" aria-hidden="true"><span></span><i></i></div>`;

  return `<a class="tide-hook-card" href="${ctx.esc(ctx.productLink(product))}">
    <span class="tide-hook-card__number">${String(index + 1).padStart(2, '0')}</span>
    ${image}
    <span class="tide-hook-card__copy"><b>${ctx.esc(title)}</b>${price ? `<em>${ctx.esc(price)}</em>` : ''}</span>
    <span class="tide-hook-card__go" aria-hidden="true">↗</span>
  </a>`;
}

export function discovery(ctx) {
  const categories = list(ctx.cats).filter((category) => category?.name).slice(0, 3);
  if (categories.length >= 2) {
    return `<section class="theme-discovery tide-bank" aria-labelledby="tide-bank-title">
      <div class="tide-bank__head">
        <p class="tide-bank__kicker">The water index</p>
        <div><h2 id="tide-bank-title">Choose a place to begin.</h2><p>Follow the part of the day you are building toward, then explore the available tackle.</p></div>
      </div>
      ${bankCards(ctx, categories)}
    </section>`;
  }

  const products = list(ctx.products).slice(0, 3);
  if (!products.length) return '';
  return `<section class="theme-discovery tide-bank tide-bank--products" aria-labelledby="tide-bank-title">
    <div class="tide-bank__head">
      <p class="tide-bank__kicker">At the tying table</p>
      <div><h2 id="tide-bank-title">A few good places to start.</h2><p>Explore the pieces currently in this collection.</p></div>
    </div>
    <div class="tide-hook-cards">${products.map((product, index) => hookCard(ctx, product, index)).join('')}</div>
  </section>`;
}

export const css = `
.th-p-fishing-equipment {
  --tide-ink: #142D2A;
  --tide-deep: #102723;
  --tide-water: #20443E;
  --tide-paper: #F7F4EC;
  --tide-silt: #E8E3D7;
  --tide-copper: #C86E3A;
  --tide-gold: #D9A764;
  background: var(--tide-silt);
  color: var(--tide-ink);
}
.th-p-fishing-equipment .hd {
  background: var(--tide-water);
  border-bottom: 1px solid #EDE8DB33;
}
.th-p-fishing-equipment .hd :is(.brand, .nav a, .cart) { color: #F5F1E7; }
.th-p-fishing-equipment .hd .cart { border-color: #F5F1E74D; }
.th-p-fishing-equipment .hd .nav a:hover,
.th-p-fishing-equipment .hd .cart:hover { color: #D9A764; }
.th-p-fishing-equipment .tide-hero {
  position: relative;
  isolation: isolate;
  min-height: clamp(610px, 49vw, 770px);
  overflow: hidden;
  display: flex;
  align-items: flex-end;
  background: var(--tide-deep);
  color: #F7F4EC;
}
.th-p-fishing-equipment .tide-hero__photo {
  position: absolute;
  z-index: -4;
  inset: 0;
  overflow: hidden;
  background: #16312D;
}
.th-p-fishing-equipment .tide-hero__photo .hero-media,
.th-p-fishing-equipment .tide-hero__photo .theme-empty-media {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 100%;
  object-fit: cover;
  object-position: center 54%;
}
.th-p-fishing-equipment .tide-hero__photo .theme-empty-media {
  background:
    radial-gradient(ellipse at 72% 20%, #AAC1B655 0 7%, transparent 36%),
    linear-gradient(145deg, #0F2928 0%, #315C54 48%, #152E2B 100%);
  color: #EDE8DB;
}
.th-p-fishing-equipment .tide-hero__veil {
  position: absolute;
  z-index: -3;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(90deg, #09201DE8 0%, #102722BD 36%, #12302B4A 65%, #0C211C6E 100%), linear-gradient(0deg, #081B18C2 0%, transparent 53%);
}
.th-p-fishing-equipment .tide-hero__arc {
  position: absolute;
  z-index: -1;
  top: -20%;
  right: -4%;
  width: min(61vw, 900px);
  aspect-ratio: 1;
  border: 1px solid #F6F1E73D;
  border-radius: 50%;
  pointer-events: none;
}
.th-p-fishing-equipment .tide-hero__arc::before,
.th-p-fishing-equipment .tide-hero__arc::after,
.th-p-fishing-equipment .tide-hero__arc span,
.th-p-fishing-equipment .tide-hero__arc i,
.th-p-fishing-equipment .tide-hero__arc b {
  position: absolute;
  display: block;
  box-sizing: border-box;
  content: '';
  border: 1px solid #F6F1E72E;
  border-radius: 50%;
}
.th-p-fishing-equipment .tide-hero__arc::before { width: 61%; height: 61%; top: 19.5%; left: 19.5%; }
.th-p-fishing-equipment .tide-hero__arc::after { width: 32%; height: 32%; top: 34%; left: 34%; }
.th-p-fishing-equipment .tide-hero__arc span { width: 8px; height: 8px; top: 27%; left: 15%; background: var(--tide-gold); border-color: var(--tide-gold); }
.th-p-fishing-equipment .tide-hero__arc i { width: 7px; height: 7px; right: 21%; bottom: 26%; background: var(--tide-copper); border-color: var(--tide-copper); }
.th-p-fishing-equipment .tide-hero__arc b { width: 5px; height: 5px; left: 50%; bottom: 12%; background: #F7F4EC; border-color: #F7F4EC; }
.th-p-fishing-equipment .tide-hero__margin {
  position: absolute;
  z-index: 2;
  top: clamp(28px, 4.8vw, 70px);
  left: clamp(22px, 4.5vw, 78px);
  display: grid;
  gap: 7px;
  margin: 0;
  color: #F5F1E7C7;
  font: 700 9px/1.2 var(--body);
  letter-spacing: .19em;
  text-transform: uppercase;
}
.th-p-fishing-equipment .tide-hero__margin::before {
  width: 30px;
  height: 1px;
  margin-bottom: 6px;
  content: '';
  background: var(--tide-gold);
}
.th-p-fishing-equipment .tide-hero__ledger {
  position: relative;
  z-index: 2;
  width: min(565px, 43vw);
  margin: 0 0 clamp(42px, 5vw, 82px) clamp(22px, 11.4vw, 178px);
  padding: clamp(26px, 3.3vw, 53px) clamp(25px, 3.8vw, 63px) clamp(28px, 3.7vw, 56px);
  border: 1px solid #F6F1E77A;
  border-left: 3px solid var(--tide-gold);
  background: #163732E8;
  box-shadow: 0 22px 52px #00130E55;
  backdrop-filter: blur(5px);
}
.th-p-fishing-equipment .tide-hero--indexed .tide-hero__ledger { margin-bottom: clamp(112px, 12vw, 158px); }
.th-p-fishing-equipment .tide-hero__copy .eyebrow {
  margin: 0 0 15px;
  color: var(--tide-gold);
  font: 700 10px/1.2 var(--body);
  letter-spacing: .2em;
  text-transform: uppercase;
}
.th-p-fishing-equipment .tide-hero__copy h1 {
  max-width: 11ch;
  margin: 0;
  color: #F7F4EC;
  font: 400 clamp(55px, 6.9vw, 108px)/.83 var(--display);
  letter-spacing: -.055em;
  overflow-wrap: anywhere;
  text-wrap: balance;
}
.th-p-fishing-equipment .tide-hero__copy h1.long { font-size: clamp(42px, 4.7vw, 76px); line-height: .9; }
.th-p-fishing-equipment .tide-hero__copy .sub {
  max-width: 37ch;
  margin: 21px 0 0;
  color: #EDE8DBD9;
  font: 500 clamp(14px, 1.15vw, 17px)/1.55 var(--body);
}
.th-p-fishing-equipment .tide-hero__copy .ctas {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 27px;
}
.th-p-fishing-equipment .tide-hero__copy .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  padding: 11px 18px;
  border: 1px solid var(--tide-gold);
  border-radius: 999px;
  background: var(--tide-gold);
  color: #17302C;
  font: 700 10px/1.1 var(--body);
  letter-spacing: .12em;
  text-align: center;
  text-decoration: none;
  text-transform: uppercase;
}
.th-p-fishing-equipment .tide-hero__copy .btn:hover { border-color: #F3C47E; background: #F3C47E; }
.th-p-fishing-equipment .tide-hero__copy .btn.ghost { border-color: #F6F1E780; background: transparent; color: #F7F4EC; }
.th-p-fishing-equipment .tide-hero__copy .btn.ghost:hover { border-color: #F7F4EC; background: #F7F4EC; color: #17302C; }
.th-p-fishing-equipment .tide-current-index {
  position: absolute;
  z-index: 3;
  right: 0;
  bottom: 0;
  left: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  overflow: hidden;
  border-top: 1px solid #F6F1E752;
  background: #0C2722DB;
  backdrop-filter: blur(5px);
}
.th-p-fishing-equipment .tide-current-index a {
  min-width: 0;
  min-height: 86px;
  display: grid;
  grid-template-columns: 27px minmax(0, 1fr) auto;
  grid-template-areas: 'number name arrow' 'number meta arrow';
  column-gap: 10px;
  align-content: center;
  padding: 13px clamp(18px, 3.4vw, 62px);
  border-right: 1px solid #F6F1E735;
  color: #F7F4EC;
  text-decoration: none;
}
.th-p-fishing-equipment .tide-current-index a:last-child { border-right: 0; }
.th-p-fishing-equipment .tide-current-index a:hover { background: #31554D; }
.th-p-fishing-equipment .tide-current-index__number { grid-area: number; align-self: start; padding-top: 3px; color: var(--tide-gold); font: 700 9px/1 var(--body); letter-spacing: .12em; }
.th-p-fishing-equipment .tide-current-index__name { grid-area: name; min-width: 0; font: 400 clamp(21px, 2.4vw, 33px)/.95 var(--display); letter-spacing: -.025em; overflow-wrap: anywhere; }
.th-p-fishing-equipment .tide-current-index small { grid-area: meta; margin-top: 5px; color: #DCE7E0AD; font: 700 9px/1.2 var(--body); letter-spacing: .14em; text-transform: uppercase; }
.th-p-fishing-equipment .tide-current-index i { grid-area: arrow; align-self: center; color: var(--tide-gold); font: 400 22px/1 var(--display); font-style: normal; }
.th-p-fishing-equipment .tide-hero .motion-toggle {
  position: absolute;
  z-index: 4;
  top: clamp(25px, 4vw, 59px);
  right: clamp(16px, 2.6vw, 42px);
  min-width: 44px;
  min-height: 44px;
  padding: 8px 11px;
  border: 1px solid #F6F1E76B;
  border-radius: 999px;
  background: #0F2C27C7;
  color: #F7F4EC;
  font: 700 9px/1 var(--body);
  letter-spacing: .11em;
  text-transform: uppercase;
}
.th-p-fishing-equipment .tide-hero .motion-toggle:hover { border-color: var(--tide-gold); background: #21483F; }
.th-p-fishing-equipment .tide-bank {
  width: min(100% - 48px, 1360px);
  margin: 0 auto;
  padding: clamp(56px, 7vw, 112px) 0 clamp(50px, 6vw, 94px);
}
.th-p-fishing-equipment .tide-bank__head {
  display: grid;
  grid-template-columns: minmax(125px, .72fr) minmax(0, 2.35fr);
  gap: clamp(20px, 4vw, 72px);
  align-items: start;
  margin-bottom: clamp(26px, 3.8vw, 52px);
  padding-bottom: 21px;
  border-bottom: 1px solid #6A837A7A;
}
.th-p-fishing-equipment .tide-bank__kicker {
  margin: 7px 0 0;
  color: var(--tide-copper);
  font: 700 10px/1.25 var(--body);
  letter-spacing: .18em;
  text-transform: uppercase;
}
.th-p-fishing-equipment .tide-bank__head > div { display: flex; align-items: flex-end; justify-content: space-between; gap: clamp(26px, 6vw, 100px); }
.th-p-fishing-equipment .tide-bank h2 {
  max-width: 11ch;
  margin: 0;
  color: var(--tide-ink);
  font: 400 clamp(44px, 5.5vw, 82px)/.86 var(--display);
  letter-spacing: -.052em;
  overflow-wrap: anywhere;
  text-wrap: balance;
}
.th-p-fishing-equipment .tide-bank__head > div > p {
  flex: 0 1 31ch;
  margin: 0 0 3px;
  color: var(--muted);
  font: 500 14px/1.55 var(--body);
}
.th-p-fishing-equipment .tide-bank-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 13px;
}
.th-p-fishing-equipment .tide-bank-cards--2 { grid-template-columns: repeat(2, minmax(0, 1fr)); max-width: 910px; }
.th-p-fishing-equipment .tide-bank-card {
  position: relative;
  isolation: isolate;
  min-width: 0;
  min-height: clamp(330px, 31vw, 458px);
  overflow: hidden;
  background: var(--tide-water);
  color: #F7F4EC;
  text-decoration: none;
}
.th-p-fishing-equipment .tide-bank-card__media {
  position: absolute;
  z-index: -3;
  inset: 0;
  overflow: hidden;
  background: #31584E;
}
.th-p-fishing-equipment .tide-bank-card__media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.th-p-fishing-equipment .tide-bank-card__empty {
  background: linear-gradient(142deg, #637C6F 0%, #26493F 55%, #16322D 100%);
}
.th-p-fishing-equipment .tide-bank-card__empty::before,
.th-p-fishing-equipment .tide-bank-card__empty::after,
.th-p-fishing-equipment .tide-bank-card__empty i,
.th-p-fishing-equipment .tide-bank-card__empty b {
  position: absolute;
  display: block;
  box-sizing: border-box;
  content: '';
  border: 1px solid #F5F1E75C;
  border-radius: 50%;
}
.th-p-fishing-equipment .tide-bank-card__empty::before { width: 142%; height: 58%; left: -24%; bottom: -21%; }
.th-p-fishing-equipment .tide-bank-card__empty::after { width: 94%; height: 39%; right: -35%; top: 17%; }
.th-p-fishing-equipment .tide-bank-card__empty i { width: 66%; height: 28%; left: 13%; top: 40%; }
.th-p-fishing-equipment .tide-bank-card__empty b { width: 27%; height: 12%; left: 45%; top: 21%; background: #D9A7647A; border-color: #D9A764; }
.th-p-fishing-equipment .tide-bank-card__empty span { position: absolute; top: 15px; right: 18px; color: #F5F1E799; font: 400 42px/1 var(--display); }
.th-p-fishing-equipment .tide-bank-card__wash { position: absolute; z-index: -2; inset: 0; background: linear-gradient(0deg, #0A211DDD 0%, #102C2672 51%, transparent 76%); }
.th-p-fishing-equipment .tide-bank-card__copy { position: absolute; right: 24px; bottom: 22px; left: 24px; display: grid; gap: 7px; }
.th-p-fishing-equipment .tide-bank-card__copy small { color: var(--tide-gold); font: 700 9px/1 var(--body); letter-spacing: .17em; text-transform: uppercase; }
.th-p-fishing-equipment .tide-bank-card__copy b { font: 400 clamp(31px, 3vw, 47px)/.89 var(--display); letter-spacing: -.035em; overflow-wrap: anywhere; }
.th-p-fishing-equipment .tide-bank-card__copy em { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-top: 13px; color: #F7F4ECC7; font: 700 9px/1.2 var(--body); font-style: normal; letter-spacing: .14em; text-transform: uppercase; }
.th-p-fishing-equipment .tide-bank-card__copy em i { color: var(--tide-gold); font: 400 22px/.7 var(--display); font-style: normal; }
.th-p-fishing-equipment .tide-hook-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  border: 1px solid #BEC5BA;
  background: #BEC5BA;
}
.th-p-fishing-equipment .tide-hook-card {
  position: relative;
  min-width: 0;
  display: grid;
  grid-template-rows: auto auto;
  padding: clamp(15px, 2vw, 28px);
  background: var(--tide-paper);
  color: var(--tide-ink);
  text-decoration: none;
}
.th-p-fishing-equipment .tide-hook-card:hover { background: #EDF0E7; }
.th-p-fishing-equipment .tide-hook-card__number { position: absolute; z-index: 2; top: clamp(23px, 3.2vw, 43px); left: clamp(23px, 3.2vw, 43px); width: 28px; height: 28px; display: grid; place-items: center; border: 1px solid #14352F6B; border-radius: 50%; background: #F7F4ECD9; color: var(--tide-ink); font: 700 9px/1 var(--body); letter-spacing: .05em; }
.th-p-fishing-equipment .tide-hook-card__media { position: relative; min-height: 0; aspect-ratio: 1.18 / 1; overflow: hidden; background: #DDE2D8; }
.th-p-fishing-equipment .tide-hook-card__media img { display: block; width: 100%; height: 100%; object-fit: contain; }
.th-p-fishing-equipment .tide-hook-card__empty { background: linear-gradient(145deg, #DCE2D5, #EFF1EA); }
.th-p-fishing-equipment .tide-hook-card__empty span,
.th-p-fishing-equipment .tide-hook-card__empty i { position: absolute; display: block; box-sizing: border-box; border: 1px solid #5C766D80; border-radius: 50%; }
.th-p-fishing-equipment .tide-hook-card__empty span { width: 58%; height: 58%; top: 21%; left: 21%; }
.th-p-fishing-equipment .tide-hook-card__empty i { width: 30%; height: 30%; top: 35%; left: 35%; }
.th-p-fishing-equipment .tide-hook-card__copy { min-width: 0; display: grid; gap: 8px; padding: 17px 38px 3px 0; }
.th-p-fishing-equipment .tide-hook-card__copy b { font: 600 clamp(18px, 1.8vw, 25px)/1.03 var(--body); letter-spacing: -.03em; overflow-wrap: anywhere; }
.th-p-fishing-equipment .tide-hook-card__copy em { color: var(--tide-copper); font: 700 10px/1.2 var(--body); font-style: normal; letter-spacing: .09em; }
.th-p-fishing-equipment .tide-hook-card__go { position: absolute; right: clamp(17px, 2vw, 29px); bottom: clamp(19px, 2vw, 29px); color: var(--tide-copper); font: 400 27px/1 var(--display); }
.th-p-fishing-equipment #shop { padding-top: clamp(50px, 6vw, 90px); background: var(--tide-paper); }
.th-p-fishing-equipment #shop .sec-h { padding-bottom: 20px; border-bottom: 1px solid #C9C9BC; }
.th-p-fishing-equipment #shop .sec-h h2 { color: var(--tide-ink); font: 400 clamp(40px, 4.7vw, 70px)/.9 var(--display); letter-spacing: -.045em; }
.th-p-fishing-equipment #shop .chips { gap: 8px; }
.th-p-fishing-equipment #shop .chip { min-height: 44px; border-radius: 999px; font: 700 10px/1 var(--body); letter-spacing: .09em; }
.th-p-fishing-equipment #shop .grid { gap: 28px 16px; }
.th-p-fishing-equipment #shop .pc { border-radius: 2px; background: transparent; box-shadow: none; }
.th-p-fishing-equipment #shop .pc .im { border-radius: 2px; background: #E2E4DA; }
.th-p-fishing-equipment #shop .pc .bd h3 { font-family: var(--body); font-weight: 600; letter-spacing: -.03em; }
.th-p-fishing-equipment #shop .pc .pr { color: var(--tide-copper); font-weight: 700; }
.th-p-fishing-equipment .ft { background: var(--tide-deep); color: #F4F0E6; }
.th-p-fishing-equipment .ft :is(a, p, span, h4) { color: #F4F0E6; }
.th-p-fishing-equipment .tide-hero.has-hero-motion[data-hero-motion="pan"] .tide-hero__photo .hero-media { animation: fishing-equipment-pan 17s ease-in-out infinite alternate; }
.th-p-fishing-equipment .tide-hero.has-hero-motion[data-hero-motion="drift"] .tide-hero__photo .hero-media { animation: fishing-equipment-drift 14s ease-in-out infinite alternate; }
@keyframes fishing-equipment-pan {
  from { transform: scale(1.04) translate3d(-1.2%, 0, 0); }
  to { transform: scale(1.1) translate3d(1.3%, -1%, 0); }
}
@keyframes fishing-equipment-drift {
  from { transform: scale(1.035) translate3d(0, 0, 0); }
  to { transform: scale(1.075) translate3d(-.9%, -1.2%, 0); }
}
@media (max-width: 860px) {
  .th-p-fishing-equipment .tide-hero { min-height: 660px; }
  .th-p-fishing-equipment .tide-hero__ledger { width: min(565px, 61vw); margin-left: 8vw; }
  .th-p-fishing-equipment .tide-hero__arc { width: 76vw; right: -18%; }
  .th-p-fishing-equipment .tide-current-index a { padding-right: 22px; padding-left: 22px; }
  .th-p-fishing-equipment .tide-bank { width: min(100% - 40px, 1360px); }
  .th-p-fishing-equipment .tide-bank__head { grid-template-columns: 1fr; gap: 14px; }
  .th-p-fishing-equipment .tide-bank__kicker { margin-top: 0; }
  .th-p-fishing-equipment .tide-bank-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .th-p-fishing-equipment .tide-bank-cards--3 .tide-bank-card:first-child { grid-column: 1 / -1; min-height: 410px; }
  .th-p-fishing-equipment .tide-hook-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 600px) {
  .th-p-fishing-equipment .hd { background: var(--tide-water); }
  .th-p-fishing-equipment .tide-hero { min-height: 0; display: flex; flex-direction: column; align-items: stretch; overflow: hidden; background: var(--tide-deep); }
  .th-p-fishing-equipment .tide-hero__photo { position: relative; z-index: 0; height: clamp(280px, 75vw, 370px); overflow: hidden; }
  .th-p-fishing-equipment .tide-hero__photo .hero-media { object-position: center 48%; }
  .th-p-fishing-equipment .tide-hero__veil { z-index: 1; top: 0; bottom: auto; height: clamp(280px, 75vw, 370px); background: linear-gradient(0deg, #10272399, transparent 57%); }
  .th-p-fishing-equipment .tide-hero__arc { z-index: 2; top: 9px; right: -20%; width: 85vw; }
  .th-p-fishing-equipment .tide-hero__margin { z-index: 3; top: 25px; left: 20px; font-size: 8px; }
  .th-p-fishing-equipment .tide-hero__ledger,
  .th-p-fishing-equipment .tide-hero--indexed .tide-hero__ledger { width: 100%; margin: 0; padding: 31px 20px 32px; border: 0; border-bottom: 3px solid var(--tide-gold); background: var(--tide-water); box-shadow: none; backdrop-filter: none; }
  .th-p-fishing-equipment .tide-hero__copy h1 { max-width: 11ch; font-size: clamp(52px, 16vw, 73px); }
  .th-p-fishing-equipment .tide-hero__copy h1.long { font-size: clamp(38px, 12vw, 56px); }
  .th-p-fishing-equipment .tide-hero__copy .sub { margin-top: 17px; font-size: 14px; }
  .th-p-fishing-equipment .tide-hero__copy .ctas { margin-top: 22px; }
  .th-p-fishing-equipment .tide-hero__copy .btn { flex: 1 1 170px; min-height: 46px; }
  .th-p-fishing-equipment .tide-current-index { position: relative; grid-template-columns: 1fr; order: 5; border-top: 0; background: #0C2722; backdrop-filter: none; }
  .th-p-fishing-equipment .tide-current-index a { min-height: 64px; padding: 11px 20px; border-right: 0; border-bottom: 1px solid #F6F1E735; }
  .th-p-fishing-equipment .tide-current-index a:last-child { border-bottom: 0; }
  .th-p-fishing-equipment .tide-current-index__name { font-size: 25px; }
  .th-p-fishing-equipment .tide-hero .motion-toggle { z-index: 4; top: clamp(220px, 59vw, 310px); right: 13px; bottom: auto; transform: none; }
  .th-p-fishing-equipment .tide-bank { width: min(100% - 32px, 540px); padding-top: 48px; }
  .th-p-fishing-equipment .tide-bank__head { margin-bottom: 27px; padding-bottom: 17px; }
  .th-p-fishing-equipment .tide-bank__head > div { display: grid; gap: 15px; }
  .th-p-fishing-equipment .tide-bank h2 { font-size: clamp(42px, 13vw, 58px); }
  .th-p-fishing-equipment .tide-bank__head > div > p { font-size: 14px; }
  .th-p-fishing-equipment .tide-bank-cards,
  .th-p-fishing-equipment .tide-bank-cards--2 { grid-template-columns: 1fr; max-width: none; }
  .th-p-fishing-equipment .tide-bank-cards--3 .tide-bank-card:first-child { grid-column: auto; min-height: 330px; }
  .th-p-fishing-equipment .tide-bank-card { min-height: 330px; }
  .th-p-fishing-equipment .tide-hook-cards { grid-template-columns: 1fr; }
  .th-p-fishing-equipment .tide-hook-card { padding: 15px; }
  .th-p-fishing-equipment .tide-hook-card__media { aspect-ratio: 1.42 / 1; }
}
@media (max-width: 390px) {
  .th-p-fishing-equipment .tide-hero__copy .ctas { display: grid; grid-template-columns: 1fr; }
  .th-p-fishing-equipment .tide-hero__copy .btn { width: 100%; }
  .th-p-fishing-equipment .tide-current-index a { grid-template-columns: 24px minmax(0, 1fr) auto; }
  .th-p-fishing-equipment .tide-bank-card__copy { right: 19px; bottom: 19px; left: 19px; }
}
@media (prefers-reduced-motion: reduce) {
  .th-p-fishing-equipment .tide-hero.has-hero-motion .tide-hero__photo .hero-media { animation: none; transform: none; }
}
`;

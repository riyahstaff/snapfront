import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-desk-furniture',
  name: 'Draftline Workroom',
  for: 'Desk furniture and considered workspaces',
  vibe: 'Draft-board geometry, mineral blue, and warmly grained timber',
  category: 'Desk furniture',
  group: 'home',
  display: 'DM Serif Display',
  body: 'Manrope',
  displayWeight: 400,
  tracking: '-.035em',
  colors: {
    bg: '#E9ECE8',
    surface: '#F7F6F0',
    ink: '#172A34',
    muted: '#63727A',
    line: '#BEC7C4',
    accent: '#C65C36',
    onAccent: '#FFFFFF',
    panel: '#C6D6D2',
    onPanel: '#172A34',
    foot: '#172A34',
    onFoot: '#F7F6F0',
    bar: '#172A34',
    onBar: '#F7F6F0',
    badge: '#E9B26A',
    onBadge: '#172A34',
  },
  header: 'stack',
  hero: 'editorial',
  card: 'boxed',
  ratio: '5/4',
  rCard: 12,
  rBtn: 0,
  motion: 'pan',
  copy: {
    eyebrow: 'The considered workroom',
    collection: 'The workroom index',
    cta: 'View all pieces',
    title: 'Make room for the work.',
    subtitle: 'Desks, seating, and storage that keep a day in motion.',
  },
  collection: 'premium',
  family: 'desk-furniture',
  demo: '/assets/themes/desk-furniture-hero.webp',
});

const safeProducts = (ctx) => (Array.isArray(ctx.products) ? ctx.products : []).filter(Boolean);
const safeCategories = (ctx) => (Array.isArray(ctx.cats) ? ctx.cats : []).filter(Boolean);

const productIndex = (ctx) => {
  const products = safeProducts(ctx).slice(0, 3);
  if (!products.length) {
    return `<a class="desk-index-fallback" href="#shop"><span>Available pieces</span><b aria-hidden="true">↗</b></a>`;
  }

  return products.map((product, index) => {
    const title = product.title || 'Available piece';
    return `<a class="desk-index-link" href="${ctx.esc(ctx.productLink(product))}">
      <span class="desk-index-number">${String(index + 1).padStart(2, '0')}</span>
      <span class="desk-index-title">${ctx.esc(title)}</span>
      <b aria-hidden="true">↗</b>
    </a>`;
  }).join('');
};

const categoryTile = (ctx, category, index) => {
  const count = Number(category.count) || 0;
  const countLabel = `${count} ${count === 1 ? 'piece' : 'pieces'}`;
  const picture = category.image
    ? `<img src="${ctx.esc(category.image)}" alt="" loading="lazy" decoding="async">`
    : '<span class="desk-category-empty" aria-hidden="true"></span>';

  return `<a class="desk-category-tile desk-category-tile-${(index % 4) + 1}" href="${ctx.esc(ctx.categoryLink(category.name))}">
    <span class="desk-category-art">${picture}</span>
    <span class="desk-category-meta"><i>${String(index + 1).padStart(2, '0')}</i><small>${ctx.esc(countLabel)}</small></span>
    <span class="desk-category-name">${ctx.esc(category.name)}</span>
    <span class="desk-category-arrow" aria-hidden="true">↗</span>
  </a>`;
};

const productTile = (ctx, product, index) => {
  const title = product.title || 'Available piece';
  const hasPrice = product.price_cents !== undefined && product.price_cents !== null && product.price_cents !== ''
    && Number.isFinite(Number(product.price_cents));
  const price = hasPrice ? ctx.money(Number(product.price_cents), product.currency || 'usd', product?.billing_interval) : '';
  const picture = product.image_url
    ? `<img src="${ctx.esc(product.image_url)}" alt="${ctx.esc(product.alt_text || title)}" loading="lazy" decoding="async">`
    : '<span class="desk-product-empty" aria-hidden="true"></span>';

  return `<a class="desk-product-tile" href="${ctx.esc(ctx.productLink(product))}">
    <span class="desk-product-art">${picture}<i>0${index + 1}</i></span>
    <span class="desk-product-copy"><strong>${ctx.esc(title)}</strong>${product.category ? `<em>${ctx.esc(product.category)}</em>` : ''}${price ? `<small>${ctx.esc(price)}</small>` : ''}</span>
    <b class="desk-product-arrow" aria-hidden="true">↗</b>
  </a>`;
};

export function hero(ctx) {
  return `<section class="hero category-hero desk-hero${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="desk-hero-ruler" aria-hidden="true"><span>01</span><i></i><span>STUDIO</span></div>
    <div class="desk-copy-field">${ctx.copy('desk-copy')}</div>
    <div class="desk-image-field">
      <span class="desk-image-corner desk-image-corner-a" aria-hidden="true"></span>
      <div class="desk-hero-media">${ctx.media(0, { priority: true, lazy: false })}</div>
      <p class="desk-image-caption">A place to begin the day</p>
      <span class="desk-image-corner desk-image-corner-b" aria-hidden="true"></span>
    </div>
    <aside class="desk-piece-index" aria-label="Featured pieces">
      <div class="desk-piece-index-head"><span>In this workroom</span><b>↘</b></div>
      <div class="desk-piece-index-list">${productIndex(ctx)}</div>
    </aside>
    <p class="desk-hero-word" aria-hidden="true">WORK</p>
    ${ctx.controls}
  </section>`;
}

export function discovery(ctx) {
  const categories = safeCategories(ctx);
  const products = safeProducts(ctx);

  if (categories.length >= 2) {
    return `<section class="desk-discovery" aria-labelledby="desk-discovery-title">
      <div class="desk-discovery-intro">
        <p class="desk-kicker">${ctx.esc(ctx.t.copy.collection)}</p>
        <h2 id="desk-discovery-title">Build your workday<br>from the ground up.</h2>
        <p>Start with the pieces available in this shop, then let the room take its shape.</p>
        <a href="#shop" class="desk-all-link">View every piece <span aria-hidden="true">↘</span></a>
      </div>
      <div class="desk-category-board">${categories.slice(0, 4).map((category, index) => categoryTile(ctx, category, index)).join('')}</div>
    </section>`;
  }

  if (products.length) {
    return `<section class="desk-discovery desk-discovery-products" aria-labelledby="desk-discovery-title">
      <div class="desk-discovery-intro">
        <p class="desk-kicker">Available now</p>
        <h2 id="desk-discovery-title">Begin with a solid surface.</h2>
        <a href="#shop" class="desk-all-link">View every piece <span aria-hidden="true">↘</span></a>
      </div>
      <div class="desk-product-board">${products.slice(0, 3).map((product, index) => productTile(ctx, product, index)).join('')}</div>
    </section>`;
  }

  return '';
}

export const css = `
.th-p-desk-furniture {
  background: #E9ECE8;
  color: #172A34;
}

.th-p-desk-furniture .hd {
  background: color-mix(in srgb, #E9ECE8 93%, transparent);
  border-bottom-color: #BEC7C4;
}

.th-p-desk-furniture .brand {
  color: #172A34;
  font-family: var(--body);
  font-size: calc(15px * var(--ts));
  font-weight: 800;
  letter-spacing: .12em;
  text-transform: uppercase;
}

.th-p-desk-furniture .nav {
  gap: clamp(15px, 2.2vw, 35px);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .09em;
  text-transform: uppercase;
}

.th-p-desk-furniture .nav a {
  background-image: linear-gradient(#C65C36, #C65C36);
  background-size: 0 2px;
  background-position: left calc(100% - 1px);
}

.th-p-desk-furniture .nav a:hover,
.th-p-desk-furniture .nav a[aria-current] {
  background-size: 100% 2px;
}

.th-p-desk-furniture .cart {
  width: 52px;
  border: 1px solid #172A34;
  border-radius: 0;
  background: #172A34;
  color: #F7F6F0;
}

.th-p-desk-furniture .desk-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(300px, .75fr) minmax(430px, 1.28fr) minmax(230px, .47fr);
  min-height: min(760px, calc(100vh - 76px));
  overflow: hidden;
  border-bottom: 1px solid #BEC7C4;
  background: #E9ECE8;
}

.th-p-desk-furniture .desk-hero-ruler {
  position: absolute;
  z-index: 4;
  top: 0;
  left: clamp(20px, 3.4vw, 58px);
  display: flex;
  align-items: center;
  gap: 12px;
  height: 42px;
  color: #63727A;
  font: 800 9px/1 var(--body);
  letter-spacing: .16em;
}

.th-p-desk-furniture .desk-hero-ruler i {
  display: block;
  width: clamp(50px, 7vw, 104px);
  height: 1px;
  background: #63727A;
}

.th-p-desk-furniture .desk-copy-field {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: flex-end;
  min-width: 0;
  padding: clamp(102px, 15vh, 160px) clamp(20px, 4.1vw, 72px) clamp(52px, 9.4vh, 106px);
  border-right: 1px solid #BEC7C4;
}

.th-p-desk-furniture .desk-copy {
  display: grid;
  justify-items: start;
  width: min(100%, 470px);
  color: #172A34;
}

.th-p-desk-furniture .desk-copy .eyebrow,
.th-p-desk-furniture .desk-kicker {
  margin: 0 0 14px;
  color: #C65C36;
  font: 800 10px/1.2 var(--body);
  letter-spacing: .16em;
  text-transform: uppercase;
}

.th-p-desk-furniture .desk-copy h1 {
  max-width: 9ch;
  margin: 0;
  font-family: var(--display);
  font-size: clamp(56px, 6.2vw, 100px);
  font-weight: 400;
  letter-spacing: var(--dt);
  line-height: .86;
  overflow-wrap: anywhere;
  text-wrap: balance;
}

.th-p-desk-furniture .desk-copy h1.long {
  max-width: 13ch;
  font-size: clamp(43px, 4.8vw, 74px);
  line-height: .92;
}

.th-p-desk-furniture .desk-copy .sub {
  max-width: 31ch;
  margin: 22px 0 0;
  color: #42545D;
  font-size: clamp(14px, 1.15vw, 17px);
  line-height: 1.55;
}

.th-p-desk-furniture .desk-copy .ctas {
  margin-top: 29px;
}

.th-p-desk-furniture .desk-copy .btn {
  min-height: 46px;
  border-radius: 0;
  background: #C65C36;
  box-shadow: none;
  color: #FFFFFF;
  font-family: var(--body);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.th-p-desk-furniture .desk-copy .btn:hover {
  background: #172A34;
  color: #FFFFFF;
  transform: none;
}

.th-p-desk-furniture .desk-copy .btn.ghost {
  border-color: #172A34;
  background: transparent;
  color: #172A34;
}

.th-p-desk-furniture .desk-copy .btn.ghost:hover {
  background: #172A34;
  color: #F7F6F0;
}

.th-p-desk-furniture .desk-image-field {
  position: relative;
  min-width: 0;
  margin: clamp(38px, 5.2vw, 74px) clamp(20px, 3.2vw, 54px) clamp(40px, 5.4vw, 76px) clamp(20px, 3.2vw, 54px);
  overflow: hidden;
  background: #C6D6D2;
}

.th-p-desk-furniture .desk-hero-media {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.th-p-desk-furniture .desk-hero-media .hero-media,
.th-p-desk-furniture .desk-hero-media .theme-empty-media {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.th-p-desk-furniture .desk-hero-media .theme-empty-media {
  background:
    linear-gradient(135deg, transparent 0 49%, rgba(23,42,52,.13) 49% 50%, transparent 50%),
    linear-gradient(0deg, #9AAEAB 0 30%, #D5DDD6 30% 31%, #B88861 31% 53%, #C6D6D2 53%);
}

.th-p-desk-furniture .desk-image-field::after {
  position: absolute;
  inset: 0;
  pointer-events: none;
  content: '';
  background: linear-gradient(180deg, rgba(23,42,52,.04), transparent 25%, rgba(23,42,52,.16));
}

.th-p-desk-furniture .desk-image-caption {
  position: absolute;
  z-index: 2;
  bottom: 16px;
  left: 18px;
  margin: 0;
  color: #FFFFFF;
  font: 800 9px/1.35 var(--body);
  letter-spacing: .14em;
  text-shadow: 0 1px 10px rgba(0,0,0,.32);
  text-transform: uppercase;
}

.th-p-desk-furniture .desk-image-corner {
  position: absolute;
  z-index: 3;
  width: 25px;
  height: 25px;
  pointer-events: none;
}

.th-p-desk-furniture .desk-image-corner-a {
  top: 10px;
  left: 10px;
  border-top: 1px solid rgba(255,255,255,.8);
  border-left: 1px solid rgba(255,255,255,.8);
}

.th-p-desk-furniture .desk-image-corner-b {
  right: 10px;
  bottom: 10px;
  border-right: 1px solid rgba(255,255,255,.8);
  border-bottom: 1px solid rgba(255,255,255,.8);
}

.th-p-desk-furniture .desk-piece-index {
  position: relative;
  z-index: 2;
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: flex-end;
  padding: clamp(70px, 11vh, 118px) clamp(20px, 2.8vw, 48px) clamp(48px, 7vh, 82px) 0;
}

.th-p-desk-furniture .desk-piece-index-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 0 13px;
  border-bottom: 1px solid #BEC7C4;
  color: #63727A;
  font: 800 9px/1.2 var(--body);
  letter-spacing: .13em;
  text-transform: uppercase;
}

.th-p-desk-furniture .desk-piece-index-head b {
  color: #C65C36;
  font-size: 16px;
}

.th-p-desk-furniture .desk-piece-index-list {
  display: grid;
}

.th-p-desk-furniture .desk-index-link,
.th-p-desk-furniture .desk-index-fallback {
  display: grid;
  grid-template-columns: 25px minmax(0, 1fr) 15px;
  align-items: center;
  gap: 8px;
  min-height: 62px;
  border-bottom: 1px solid #BEC7C4;
  color: #172A34;
  text-decoration: none;
}

.th-p-desk-furniture .desk-index-number {
  color: #C65C36;
  font: 800 9px/1 var(--body);
  letter-spacing: .08em;
}

.th-p-desk-furniture .desk-index-title,
.th-p-desk-furniture .desk-index-fallback span {
  overflow-wrap: anywhere;
  font: 400 clamp(15px, 1.3vw, 19px)/1.05 var(--display);
  letter-spacing: var(--dt);
}

.th-p-desk-furniture .desk-index-link b,
.th-p-desk-furniture .desk-index-fallback b {
  color: #C65C36;
  font-size: 15px;
  transition: transform .2s ease;
}

.th-p-desk-furniture .desk-index-link:hover b,
.th-p-desk-furniture .desk-index-link:focus-visible b,
.th-p-desk-furniture .desk-index-fallback:hover b,
.th-p-desk-furniture .desk-index-fallback:focus-visible b {
  transform: translate(2px, -2px);
}

.th-p-desk-furniture .desk-hero-word {
  position: absolute;
  z-index: 1;
  top: 36px;
  right: -11px;
  margin: 0;
  color: rgba(23,42,52,.07);
  font: 800 clamp(70px, 11.4vw, 184px)/.7 var(--body);
  letter-spacing: -.1em;
  pointer-events: none;
  writing-mode: vertical-rl;
}

.th-p-desk-furniture .motion-toggle {
  right: clamp(20px, 2.8vw, 48px);
  bottom: 18px;
  border-color: #BEC7C4;
  border-radius: 0;
  background: #F7F6F0;
  color: #172A34;
}

.th-p-desk-furniture .desk-discovery {
  display: grid;
  grid-template-columns: minmax(270px, .85fr) minmax(0, 1.65fr);
  gap: clamp(32px, 6vw, 112px);
  padding: clamp(62px, 9vw, 132px) clamp(20px, 4.5vw, 78px);
  background: #F7F6F0;
}

.th-p-desk-furniture .desk-discovery-intro {
  align-self: start;
  position: sticky;
  top: 110px;
  max-width: 410px;
}

.th-p-desk-furniture .desk-discovery-intro h2 {
  max-width: 9.7ch;
  margin: 0;
  font: 400 clamp(42px, 4.4vw, 68px)/.94 var(--display);
  letter-spacing: var(--dt);
  overflow-wrap: anywhere;
}

.th-p-desk-furniture .desk-discovery-intro > p:not(.desk-kicker) {
  max-width: 32ch;
  margin: 19px 0 0;
  color: #63727A;
  font-size: 14px;
  line-height: 1.6;
}

.th-p-desk-furniture .desk-all-link {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 38px;
  min-height: 44px;
  margin-top: 29px;
  padding-bottom: 5px;
  border-bottom: 1px solid #172A34;
  color: #172A34;
  font: 800 10px/1.2 var(--body);
  letter-spacing: .1em;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-desk-furniture .desk-all-link span {
  color: #C65C36;
  font-size: 18px;
  transition: transform .2s ease;
}

.th-p-desk-furniture .desk-all-link:hover span,
.th-p-desk-furniture .desk-all-link:focus-visible span {
  transform: translate(2px, 2px);
}

.th-p-desk-furniture .desk-category-board {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-self: start;
  border-top: 1px solid #BEC7C4;
  border-left: 1px solid #BEC7C4;
}

.th-p-desk-furniture .desk-category-tile {
  position: relative;
  display: grid;
  grid-template-rows: minmax(170px, 23vw) auto auto;
  min-width: 0;
  padding: 0 0 22px;
  border-right: 1px solid #BEC7C4;
  border-bottom: 1px solid #BEC7C4;
  color: #172A34;
  text-decoration: none;
}

.th-p-desk-furniture .desk-category-art {
  position: relative;
  display: block;
  overflow: hidden;
  background: #C6D6D2;
}

.th-p-desk-furniture .desk-category-art img,
.th-p-desk-furniture .desk-category-empty {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.th-p-desk-furniture .desk-category-art img {
  transition: transform .7s cubic-bezier(.2,.7,.2,1);
}

.th-p-desk-furniture .desk-category-tile:hover .desk-category-art img,
.th-p-desk-furniture .desk-category-tile:focus-visible .desk-category-art img {
  transform: scale(1.045);
}

.th-p-desk-furniture .desk-category-empty {
  background: linear-gradient(135deg, transparent 0 46%, rgba(23,42,52,.1) 46% 47%, transparent 47%), linear-gradient(115deg, #B4C9C5 0 52%, #D6AC7D 52% 73%, #AFC0C0 73%);
}

.th-p-desk-furniture .desk-category-tile-2 .desk-category-empty {
  background: linear-gradient(140deg, #D8D9C7 0 44%, #45616C 44% 45%, #D3B091 45% 71%, #B7C4BD 71%);
}

.th-p-desk-furniture .desk-category-tile-3 .desk-category-empty {
  background: linear-gradient(45deg, #B4C9C5 0 47%, #F0E5D5 47% 48%, #BF7654 48% 69%, #C6D6D2 69%);
}

.th-p-desk-furniture .desk-category-tile-4 .desk-category-empty {
  background: linear-gradient(145deg, #D3B091 0 38%, #172A34 38% 39%, #D8D9C7 39% 72%, #9BB6B4 72%);
}

.th-p-desk-furniture .desk-category-meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin: 16px 19px 0;
  color: #63727A;
}

.th-p-desk-furniture .desk-category-meta i {
  color: #C65C36;
  font: 800 9px/1 var(--body);
  font-style: normal;
  letter-spacing: .1em;
}

.th-p-desk-furniture .desk-category-meta small {
  font: 700 9px/1.2 var(--body);
  letter-spacing: .09em;
  text-transform: uppercase;
}

.th-p-desk-furniture .desk-category-name {
  display: block;
  min-width: 0;
  margin: 14px 42px 0 19px;
  font: 400 clamp(25px, 2.8vw, 42px)/.93 var(--display);
  letter-spacing: var(--dt);
  overflow-wrap: anywhere;
}

.th-p-desk-furniture .desk-category-arrow {
  position: absolute;
  right: 18px;
  bottom: 22px;
  color: #C65C36;
  font-size: 20px;
  transition: transform .2s ease;
}

.th-p-desk-furniture .desk-category-tile:hover .desk-category-arrow,
.th-p-desk-furniture .desk-category-tile:focus-visible .desk-category-arrow {
  transform: translate(2px, -2px);
}

.th-p-desk-furniture .desk-discovery-products {
  align-items: start;
}

.th-p-desk-furniture .desk-product-board {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  background: #BEC7C4;
  border: 1px solid #BEC7C4;
}

.th-p-desk-furniture .desk-product-tile {
  position: relative;
  display: grid;
  min-width: 0;
  background: #F7F6F0;
  color: #172A34;
  text-decoration: none;
}

.th-p-desk-furniture .desk-product-art {
  position: relative;
  display: block;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  background: #C6D6D2;
}

.th-p-desk-furniture .desk-product-art img,
.th-p-desk-furniture .desk-product-empty {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.th-p-desk-furniture .desk-product-empty {
  background: linear-gradient(135deg, #C6D6D2, #E7D4BA 52%, #7A9493 52%);
}

.th-p-desk-furniture .desk-product-art i {
  position: absolute;
  top: 13px;
  left: 13px;
  display: grid;
  width: 25px;
  height: 25px;
  place-items: center;
  background: #F7F6F0;
  color: #C65C36;
  font: 800 8px/1 var(--body);
  font-style: normal;
}

.th-p-desk-furniture .desk-product-copy {
  display: grid;
  gap: 5px;
  min-width: 0;
  padding: 17px 16px 20px;
}

.th-p-desk-furniture .desk-product-copy strong {
  overflow-wrap: anywhere;
  font: 400 clamp(20px, 2vw, 29px)/.98 var(--display);
  letter-spacing: var(--dt);
}

.th-p-desk-furniture .desk-product-copy em,
.th-p-desk-furniture .desk-product-copy small {
  color: #63727A;
  font: 700 10px/1.4 var(--body);
  font-style: normal;
  letter-spacing: .05em;
}

.th-p-desk-furniture .desk-product-copy small {
  color: #C65C36;
}

.th-p-desk-furniture .desk-product-arrow {
  position: absolute;
  right: 15px;
  bottom: 18px;
  color: #C65C36;
  font-size: 18px;
}

.th-p-desk-furniture #shop {
  padding-top: clamp(54px, 7vw, 102px);
  background: #E9ECE8;
}

.th-p-desk-furniture #shop .sec-h {
  align-items: flex-end;
  padding-bottom: clamp(18px, 2.1vw, 30px);
  border-bottom: 1px solid #BEC7C4;
}

.th-p-desk-furniture #shop .sec-h h2 {
  font: 400 clamp(38px, 4.1vw, 62px)/.92 var(--display);
  letter-spacing: var(--dt);
}

.th-p-desk-furniture #shop .chips {
  gap: 7px;
}

.th-p-desk-furniture #shop .chip {
  min-height: 38px;
  border: 1px solid #BEC7C4;
  border-radius: 0;
  background: transparent;
  color: #172A34;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .07em;
  text-transform: uppercase;
}

.th-p-desk-furniture #shop .chip[aria-current],
.th-p-desk-furniture #shop .chip:hover {
  border-color: #172A34;
  background: #172A34;
  color: #F7F6F0;
}

.th-p-desk-furniture #shop .grid {
  gap: clamp(30px, 4vw, 62px) clamp(14px, 2.4vw, 38px);
}

.th-p-desk-furniture #shop .pc {
  gap: 13px;
}

.th-p-desk-furniture #shop .pc .im {
  overflow: hidden;
  border: 1px solid #BEC7C4;
  border-radius: 0;
  background: #C6D6D2;
}

.th-p-desk-furniture #shop .pc .bd {
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 5px 12px;
  padding: 0 2px;
}

.th-p-desk-furniture #shop .pc h3 {
  font: 400 clamp(19px, 1.7vw, 25px)/1.03 var(--display);
  letter-spacing: var(--dt);
}

.th-p-desk-furniture #shop .pc .pr {
  color: #C65C36;
  font: 800 11px/1.2 var(--body);
  white-space: nowrap;
}

.th-p-desk-furniture #shop .pc .tag {
  top: 0;
  left: 0;
  border-radius: 0;
  background: #172A34;
  color: #F7F6F0;
  font-size: 9px;
}

.th-p-desk-furniture #shop .pc .go {
  border-radius: 0;
  background: #C65C36;
  color: #FFFFFF;
}

@media (max-width: 1080px) {
  .th-p-desk-furniture .desk-hero {
    grid-template-columns: minmax(270px, .74fr) minmax(380px, 1.22fr) minmax(190px, .48fr);
  }

  .th-p-desk-furniture .desk-piece-index {
    padding-right: 20px;
  }

  .th-p-desk-furniture .desk-category-tile {
    grid-template-rows: minmax(160px, 25vw) auto auto;
  }
}

@media (max-width: 820px) {
  .th-p-desk-furniture .brand {
    font-size: calc(13px * var(--ts));
  }

  .th-p-desk-furniture .desk-hero {
    grid-template-columns: minmax(0, 1fr) minmax(190px, .56fr);
    min-height: 0;
  }

  .th-p-desk-furniture .desk-copy-field {
    min-height: 500px;
    padding-top: 100px;
    padding-bottom: 64px;
  }

  .th-p-desk-furniture .desk-image-field {
    min-height: 500px;
    margin-left: 0;
  }

  .th-p-desk-furniture .desk-piece-index {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: minmax(170px, .62fr) minmax(0, 1.38fr);
    gap: 20px;
    padding: 24px 20px 28px;
    border-top: 1px solid #BEC7C4;
  }

  .th-p-desk-furniture .desk-piece-index-head {
    align-self: start;
  }

  .th-p-desk-furniture .desk-piece-index-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .th-p-desk-furniture .desk-index-link,
  .th-p-desk-furniture .desk-index-fallback {
    grid-template-columns: 19px minmax(0, 1fr) 12px;
    min-height: 50px;
    padding-left: 9px;
  }

  .th-p-desk-furniture .desk-index-link:first-child,
  .th-p-desk-furniture .desk-index-fallback {
    border-top: 1px solid #BEC7C4;
  }

  .th-p-desk-furniture .desk-hero-word {
    right: 0;
  }

  .th-p-desk-furniture .desk-discovery {
    grid-template-columns: 1fr;
    gap: 36px;
  }

  .th-p-desk-furniture .desk-discovery-intro {
    position: static;
    max-width: 560px;
  }

  .th-p-desk-furniture .desk-category-tile {
    grid-template-rows: minmax(180px, 38vw) auto auto;
  }
}

@media (max-width: 560px) {
  .th-p-desk-furniture .cart {
    width: 46px;
  }

  .th-p-desk-furniture .desk-hero {
    display: flex;
    flex-direction: column;
  }

  .th-p-desk-furniture .desk-hero-ruler {
    left: 20px;
  }

  .th-p-desk-furniture .desk-copy-field {
    min-height: 0;
    padding: 96px 20px 38px;
    border-right: 0;
  }

  .th-p-desk-furniture .desk-copy h1 {
    max-width: 11ch;
    font-size: clamp(52px, 15.1vw, 70px);
  }

  .th-p-desk-furniture .desk-copy h1.long {
    font-size: clamp(40px, 11vw, 54px);
  }

  .th-p-desk-furniture .desk-copy .sub {
    margin-top: 17px;
    font-size: 14px;
  }

  .th-p-desk-furniture .desk-copy .ctas {
    width: 100%;
    margin-top: 23px;
  }

  .th-p-desk-furniture .desk-copy .btn {
    min-height: 44px;
    padding-inline: 14px;
    font-size: 10px;
  }

  .th-p-desk-furniture .desk-image-field {
    min-height: clamp(315px, 90vw, 435px);
    margin: 0 20px 20px;
  }

  .th-p-desk-furniture .desk-image-caption {
    bottom: 12px;
    left: 13px;
    max-width: 22ch;
  }

  .th-p-desk-furniture .desk-piece-index {
    display: block;
    padding: 24px 20px 26px;
  }

  .th-p-desk-furniture .desk-piece-index-list {
    display: block;
    margin-top: 12px;
  }

  .th-p-desk-furniture .desk-index-link,
  .th-p-desk-furniture .desk-index-fallback {
    min-height: 53px;
    padding: 0;
  }

  .th-p-desk-furniture .desk-index-title,
  .th-p-desk-furniture .desk-index-fallback span {
    font-size: 17px;
  }

  .th-p-desk-furniture .desk-hero-word {
    top: 194px;
    right: 2px;
    font-size: 73px;
  }

  .th-p-desk-furniture .motion-toggle {
    right: 31px;
    bottom: 41px;
  }

  .th-p-desk-furniture .desk-discovery {
    gap: 29px;
    padding: 56px 20px 62px;
  }

  .th-p-desk-furniture .desk-discovery-intro h2 {
    max-width: 11ch;
    font-size: clamp(40px, 11.2vw, 53px);
  }

  .th-p-desk-furniture .desk-category-board {
    grid-template-columns: 1fr;
  }

  .th-p-desk-furniture .desk-category-tile {
    grid-template-columns: minmax(0, 1fr) minmax(128px, .55fr);
    grid-template-rows: auto auto;
    min-height: 180px;
    padding: 0;
  }

  .th-p-desk-furniture .desk-category-art {
    grid-column: 2;
    grid-row: 1 / 3;
  }

  .th-p-desk-furniture .desk-category-meta {
    margin: 18px 15px 0;
  }

  .th-p-desk-furniture .desk-category-name {
    align-self: end;
    margin: 13px 42px 19px 15px;
    font-size: 31px;
  }

  .th-p-desk-furniture .desk-category-arrow {
    right: 14px;
    bottom: 16px;
  }

  .th-p-desk-furniture .desk-product-board {
    grid-template-columns: 1fr;
  }

  .th-p-desk-furniture .desk-product-tile {
    grid-template-columns: 122px minmax(0, 1fr);
    min-height: 146px;
  }

  .th-p-desk-furniture .desk-product-art {
    grid-row: 1;
    aspect-ratio: auto;
  }

  .th-p-desk-furniture .desk-product-copy {
    align-content: center;
    padding: 16px 40px 16px 15px;
  }

  .th-p-desk-furniture .desk-product-arrow {
    right: 14px;
    bottom: 17px;
  }

  .th-p-desk-furniture #shop .sec-h {
    align-items: flex-start;
    flex-direction: column;
  }

  .th-p-desk-furniture #shop .chips {
    width: 100%;
    overflow-x: auto;
    flex-wrap: nowrap;
    scrollbar-width: none;
  }

  .th-p-desk-furniture #shop .chip {
    flex: 0 0 auto;
    min-height: 44px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .th-p-desk-furniture .desk-index-link b,
  .th-p-desk-furniture .desk-index-fallback b,
  .th-p-desk-furniture .desk-all-link span,
  .th-p-desk-furniture .desk-category-art img,
  .th-p-desk-furniture .desk-category-arrow {
    transition: none;
  }
}
`;

import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-silk-scarves',
  name: 'ORIEL SILK HOUSE',
  for: 'expressive silk scarves and small finishing gestures',
  vibe: 'A print atelier in afternoon light: folded color, quiet mineral surfaces, and a sense of movement',
  category: 'Silk scarves and printed neckwear',
  group: 'fashion',
  display: 'Bodoni Moda',
  body: 'Manrope',
  displayWeight: 500,
  tracking: '-.045em',
  colors: {
    bg: '#F3EFE7',
    surface: '#FCF9F2',
    ink: '#2C2532',
    muted: '#756B70',
    line: '#D7CDC3',
    accent: '#9D3F43',
    onAccent: '#FFF9F2',
    panel: '#362F49',
    onPanel: '#FFF8ED',
    foot: '#24202D',
    onFoot: '#F5EEE4',
    bar: '#E6DDD5',
    onBar: '#302934',
    badge: '#DFA347',
    onBadge: '#2A1D1B',
  },
  header: 'center',
  hero: 'editorial',
  card: 'boxed',
  ratio: '4/5',
  rCard: 2,
  rBtn: 999,
  motion: 'drift',
  collection: 'premium',
  family: 'silk-scarves',
  demoPhoto: '/assets/themes/silk-scarves-hero.webp',
  copy: {
    eyebrow: 'The print room',
    collection: 'The silk index',
    cta: 'See the collection',
    title: 'A turn of color.',
    subtitle: 'Printed pieces for the gestures that make an outfit feel entirely your own.',
  },
});

const safeCategories = (ctx) => (Array.isArray(ctx.cats) ? ctx.cats : [])
  .filter((category) => category && category.name)
  .slice(0, 4);

const safeProducts = (ctx) => (Array.isArray(ctx.products) ? ctx.products : [])
  .filter((product) => product && product.title)
  .slice(0, 4);

const countCopy = (count) => `${Number(count) || 0} ${Number(count) === 1 ? 'piece' : 'pieces'}`;

export function hero(ctx) {
  return `<section class="hero category-hero scarf-ribbon-hero${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="scarf-hero-sheet">
      <p class="scarf-hero-edition" aria-hidden="true">ORIEL<br>PRINT ROOM</p>
      <span class="scarf-hero-rule scarf-hero-rule-top" aria-hidden="true"></span>
      <figure class="scarf-hero-photo">
        ${ctx.media(0, { priority: true, lazy: false, decorative: false })}
      </figure>
      <span class="scarf-hero-ribbon scarf-hero-ribbon-one" aria-hidden="true"></span>
      <span class="scarf-hero-ribbon scarf-hero-ribbon-two" aria-hidden="true"></span>
      <div class="scarf-hero-copy-card">
        <span class="scarf-copy-stitch" aria-hidden="true"></span>
        ${ctx.copy('scarf-hero-copy')}
      </div>
      <p class="scarf-hero-margin-note">Fold it into the day.</p>
      <div class="scarf-hero-controls">${ctx.controls}</div>
    </div>
  </section>`;
}

export function discovery(ctx) {
  const cats = safeCategories(ctx);
  const products = safeProducts(ctx);

  if (cats.length >= 2) {
    const ribbons = cats.map((category, index) => {
      const hasImage = Boolean(category.image);
      const visual = hasImage
        ? `<img src="${ctx.esc(category.image)}" alt="${ctx.esc(category.name)}" loading="lazy">`
        : `<span class="scarf-index-fallback scarf-index-fallback-${(index % 4) + 1}" aria-hidden="true"></span>`;

      return `<a class="scarf-index-ribbon scarf-index-ribbon-${(index % 4) + 1}" href="${ctx.categoryLink(category.name)}">
        <span class="scarf-index-order">0${index + 1}</span>
        <span class="scarf-index-visual">${visual}</span>
        <span class="scarf-index-copy">
          <strong>${ctx.esc(category.name)}</strong>
          <small>${ctx.esc(countCopy(category.count))}</small>
        </span>
        <span class="scarf-index-arrow" aria-hidden="true">↗</span>
      </a>`;
    }).join('');

    return `<section class="theme-discovery scarf-index" aria-labelledby="scarf-index-title">
      <div class="scarf-index-intro">
        <p class="scarf-index-kicker">${ctx.esc(ctx.t.copy.collection)}</p>
        <h2 id="scarf-index-title">Follow the<br>fold.</h2>
        <p>Browse the live edit by collection, then take the pieces in your own direction.</p>
      </div>
      <div class="scarf-index-ribbons">${ribbons}</div>
    </section>`;
  }

  if (!products.length) return '';

  const lines = products.map((product, index) => `<a class="scarf-piece-line" href="${ctx.productLink(product)}">
    <span class="scarf-piece-number">0${index + 1}</span>
    <strong>${ctx.esc(product.title)}</strong>
    <em>${ctx.esc(ctx.money(product.price_cents ?? 0, product.currency || 'usd'))}</em>
    <span aria-hidden="true">↗</span>
  </a>`).join('');

  return `<section class="theme-discovery scarf-index scarf-piece-edit" aria-labelledby="scarf-index-title">
    <div class="scarf-index-intro">
      <p class="scarf-index-kicker">${ctx.esc(ctx.t.copy.collection)}</p>
      <h2 id="scarf-index-title">The pieces<br>on the table.</h2>
      <p>Start with what is available now, then browse the full edit below.</p>
    </div>
    <div class="scarf-piece-ledger">${lines}</div>
  </section>`;
}

export const css = `
.th-p-silk-scarves {
  --scarf-paper: #f3efe7;
  --scarf-surface: #fcf9f2;
  --scarf-ink: #2c2532;
  --scarf-muted: #756b70;
  --scarf-line: #d7cdc3;
  --scarf-plum: #362f49;
  --scarf-red: #9d3f43;
  --scarf-gold: #dfa347;
  background: var(--scarf-paper);
  color: var(--scarf-ink);
}

.th-p-silk-scarves .site-header,
.th-p-silk-scarves .store-header {
  background: rgba(252, 249, 242, .93);
  border-bottom-color: var(--scarf-line);
}

.th-p-silk-scarves .category-hero.scarf-ribbon-hero {
  margin: 0;
  overflow: hidden;
  background: var(--scarf-paper);
  color: var(--scarf-ink);
}

.th-p-silk-scarves .scarf-hero-sheet {
  position: relative;
  display: grid;
  grid-template-columns: minmax(24px, 1fr) minmax(0, 1.55fr) minmax(300px, .85fr) minmax(24px, 1fr);
  grid-template-rows: minmax(38px, 6vw) minmax(510px, 49vw) minmax(42px, 6vw);
  min-height: clamp(590px, 60vw, 840px);
  overflow: hidden;
  background:
    linear-gradient(113deg, transparent 0 19%, rgba(157, 63, 67, .055) 19.15% 19.4%, transparent 19.55% 100%),
    var(--scarf-paper);
}

.th-p-silk-scarves .scarf-hero-sheet::before {
  position: absolute;
  top: -16%;
  right: -8%;
  width: 49%;
  height: 52%;
  border: 1px solid rgba(54, 47, 73, .12);
  border-radius: 54% 0 46% 0;
  content: '';
  pointer-events: none;
  transform: rotate(-15deg);
}

.th-p-silk-scarves .scarf-hero-edition {
  grid-column: 2;
  grid-row: 1;
  align-self: end;
  margin: 0 0 13px;
  color: var(--scarf-plum);
  font: 700 9px/1.42 var(--font-body, 'Manrope', sans-serif);
  letter-spacing: .22em;
}

.th-p-silk-scarves .scarf-hero-rule {
  position: relative;
  z-index: 2;
  grid-column: 2 / 4;
  grid-row: 1;
  align-self: end;
  height: 1px;
  margin-bottom: 13px;
  background: var(--scarf-line);
}

.th-p-silk-scarves .scarf-hero-photo {
  position: relative;
  z-index: 1;
  grid-column: 2 / 4;
  grid-row: 2;
  min-height: 0;
  margin: 0;
  overflow: hidden;
  background: #d8c9c1;
  clip-path: polygon(0 4%, 5% 0, 100% 0, 96% 96%, 91% 100%, 0 100%);
}

.th-p-silk-scarves .scarf-hero-photo::after {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(100deg, rgba(54, 47, 73, .12), transparent 36%, rgba(157, 63, 67, .06));
  content: '';
  pointer-events: none;
}

.th-p-silk-scarves .scarf-hero-photo .hero-media,
.th-p-silk-scarves .scarf-hero-photo .theme-empty-media {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
  object-fit: cover;
}

.th-p-silk-scarves .scarf-hero-photo .hero-media {
  object-position: 62% center;
}

.th-p-silk-scarves .scarf-hero-photo .theme-empty-media {
  background:
    radial-gradient(ellipse at 66% 33%, rgba(223, 163, 71, .76) 0 5%, transparent 5.4%),
    linear-gradient(123deg, transparent 0 31%, rgba(157, 63, 67, .82) 31.5% 45%, transparent 45.5%),
    linear-gradient(44deg, #342f49 0 28%, #ab4e4a 29% 43%, #e4b15c 44% 57%, #8d6a92 58% 72%, #ece0d7 73%);
}

.th-p-silk-scarves .scarf-hero-ribbon {
  position: absolute;
  z-index: 3;
  display: block;
  pointer-events: none;
}

.th-p-silk-scarves .scarf-hero-ribbon-one {
  right: -3.5vw;
  bottom: 9%;
  width: clamp(180px, 22vw, 365px);
  height: clamp(45px, 5.8vw, 94px);
  border: 1px solid rgba(54, 47, 73, .32);
  border-radius: 52% 9% 57% 11%;
  background: linear-gradient(100deg, #a7484a 0 18%, #f1c268 18.5% 37%, #3f3c60 37.5% 65%, #c88863 65.5% 100%);
  box-shadow: 0 11px 25px rgba(44, 37, 50, .15);
  transform: rotate(-13deg);
}

.th-p-silk-scarves .scarf-hero-ribbon-two {
  top: 26%;
  left: 5.5%;
  width: clamp(36px, 4vw, 68px);
  height: clamp(176px, 24vw, 365px);
  border-radius: 46% 54% 8% 50%;
  background: linear-gradient(180deg, #d9a85d 0 13%, #7e6087 13.5% 28%, #9d3f43 28.5% 54%, #2f304a 54.5% 74%, #e8ded1 74.5%);
  box-shadow: 8px 10px 21px rgba(44, 37, 50, .16);
  transform: rotate(12deg);
}

.th-p-silk-scarves .scarf-hero-copy-card {
  position: relative;
  z-index: 4;
  grid-column: 3 / 5;
  grid-row: 2;
  align-self: end;
  width: min(100%, 30rem);
  margin: 0 0 clamp(38px, 5vw, 90px) clamp(-52px, -4vw, -24px);
  padding: clamp(34px, 4.2vw, 66px) clamp(25px, 4vw, 64px) clamp(31px, 4vw, 58px);
  background: var(--scarf-surface);
  box-shadow: 17px 18px 0 rgba(54, 47, 73, .1);
}

.th-p-silk-scarves .scarf-copy-stitch {
  position: absolute;
  top: 13px;
  right: 13px;
  bottom: 13px;
  left: 13px;
  border: 1px dashed rgba(157, 63, 67, .35);
  pointer-events: none;
}

.th-p-silk-scarves .scarf-hero-copy-card .txt {
  position: relative;
  z-index: 1;
}

.th-p-silk-scarves .scarf-hero-copy-card .eyebrow,
.th-p-silk-scarves .scarf-index-kicker {
  margin: 0 0 15px;
  color: var(--scarf-red);
  font: 700 10px/1.3 var(--font-body, 'Manrope', sans-serif);
  letter-spacing: .2em;
  text-transform: uppercase;
}

.th-p-silk-scarves .scarf-hero-copy-card h1 {
  max-width: 8ch;
  margin: 0;
  color: var(--scarf-plum);
  font-family: var(--font-display, 'Bodoni Moda', Georgia, serif);
  font-size: clamp(53px, 6.5vw, 116px);
  font-weight: 500;
  letter-spacing: -.075em;
  line-height: .78;
  overflow-wrap: anywhere;
  text-wrap: balance;
}

.th-p-silk-scarves .scarf-hero-copy-card h1.long {
  max-width: 11ch;
  font-size: clamp(43px, 4.8vw, 84px);
  line-height: .86;
}

.th-p-silk-scarves .scarf-hero-copy-card .sub {
  max-width: 31rem;
  margin: 23px 0 0;
  color: var(--scarf-muted);
  font: 400 clamp(13px, 1.1vw, 16px)/1.6 var(--font-body, 'Manrope', sans-serif);
}

.th-p-silk-scarves .scarf-hero-copy-card .ctas,
.th-p-silk-scarves .scarf-hero-copy-card .hero-ctas {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 25px;
}

.th-p-silk-scarves .scarf-hero-copy-card .btn,
.th-p-silk-scarves .scarf-hero-copy-card a {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  padding: 0 18px;
  border: 1px solid var(--scarf-red);
  border-radius: 999px;
  background: var(--scarf-red);
  color: #fff9f2;
  font: 700 10px/1 var(--font-body, 'Manrope', sans-serif);
  letter-spacing: .12em;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-silk-scarves .scarf-hero-copy-card .btn.ghost {
  background: transparent;
  color: var(--scarf-red);
}

.th-p-silk-scarves .scarf-hero-copy-card :is(.btn, a):hover,
.th-p-silk-scarves .scarf-hero-copy-card :is(.btn, a):focus-visible {
  background: var(--scarf-plum);
  border-color: var(--scarf-plum);
  color: #fff9f2;
}

.th-p-silk-scarves .scarf-hero-margin-note {
  z-index: 2;
  grid-column: 2;
  grid-row: 3;
  align-self: start;
  margin: 15px 0 0;
  color: var(--scarf-muted);
  font: 600 9px/1.3 var(--font-body, 'Manrope', sans-serif);
  letter-spacing: .19em;
  text-transform: uppercase;
}

.th-p-silk-scarves .scarf-hero-controls {
  position: absolute;
  z-index: 5;
  right: clamp(22px, 4vw, 70px);
  bottom: clamp(20px, 2.5vw, 40px);
}

.th-p-silk-scarves .scarf-hero-controls .motion-toggle {
  min-width: 44px;
  min-height: 44px;
  border: 1px solid rgba(54, 47, 73, .45);
  border-radius: 50%;
  background: rgba(252, 249, 242, .82);
  color: var(--scarf-plum);
  font: 700 9px/1 var(--font-body, 'Manrope', sans-serif);
  letter-spacing: .11em;
  text-transform: uppercase;
}

.th-p-silk-scarves .scarf-hero-controls .motion-toggle:hover {
  background: var(--scarf-plum);
  color: #fff9f2;
}

.th-p-silk-scarves .scarf-index {
  display: grid;
  grid-template-columns: minmax(210px, .78fr) minmax(0, 2.22fr);
  gap: clamp(32px, 7vw, 124px);
  align-items: start;
  padding: clamp(60px, 9vw, 146px) clamp(22px, 7vw, 128px) clamp(57px, 8vw, 125px);
  border-bottom: 1px solid var(--scarf-line);
  background: var(--scarf-surface);
}

.th-p-silk-scarves .scarf-index-intro {
  max-width: 21rem;
  padding-top: 8px;
}

.th-p-silk-scarves .scarf-index-intro h2 {
  margin: 0;
  color: var(--scarf-plum);
  font: 500 clamp(45px, 4.75vw, 85px)/.79 var(--font-display, 'Bodoni Moda', Georgia, serif);
  letter-spacing: -.075em;
  overflow-wrap: anywhere;
}

.th-p-silk-scarves .scarf-index-intro > p:not(.scarf-index-kicker) {
  max-width: 26ch;
  margin: 25px 0 0;
  color: var(--scarf-muted);
  font: 400 14px/1.65 var(--font-body, 'Manrope', sans-serif);
}

.th-p-silk-scarves .scarf-index-ribbons {
  display: grid;
  gap: 12px;
  padding-top: 5px;
}

.th-p-silk-scarves .scarf-index-ribbon {
  position: relative;
  display: grid;
  grid-template-columns: 50px minmax(112px, 1.1fr) minmax(150px, 1.4fr) 28px;
  min-height: clamp(112px, 11vw, 162px);
  align-items: stretch;
  overflow: hidden;
  border: 1px solid var(--scarf-line);
  color: var(--scarf-ink);
  text-decoration: none;
}

.th-p-silk-scarves .scarf-index-ribbon::after {
  position: absolute;
  top: 0;
  right: -11%;
  bottom: 0;
  width: 28%;
  content: '';
  opacity: .45;
  transform: skewX(-19deg);
}

.th-p-silk-scarves .scarf-index-ribbon-1 { background: #ebe1d6; }
.th-p-silk-scarves .scarf-index-ribbon-1::after { background: #d69a53; }
.th-p-silk-scarves .scarf-index-ribbon-2 { background: #e5ddd9; }
.th-p-silk-scarves .scarf-index-ribbon-2::after { background: #94738c; }
.th-p-silk-scarves .scarf-index-ribbon-3 { background: #ebe3dc; }
.th-p-silk-scarves .scarf-index-ribbon-3::after { background: #ae5551; }
.th-p-silk-scarves .scarf-index-ribbon-4 { background: #e3e0d7; }
.th-p-silk-scarves .scarf-index-ribbon-4::after { background: #4d5471; }

.th-p-silk-scarves .scarf-index-order {
  z-index: 1;
  padding: 17px 0 0 15px;
  color: var(--scarf-red);
  font: 700 10px/1 var(--font-body, 'Manrope', sans-serif);
  letter-spacing: .13em;
}

.th-p-silk-scarves .scarf-index-visual {
  position: relative;
  z-index: 1;
  display: block;
  min-height: 100%;
  overflow: hidden;
  background: #d9c9c1;
}

.th-p-silk-scarves .scarf-index-visual img,
.th-p-silk-scarves .scarf-index-fallback {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.th-p-silk-scarves .scarf-index-fallback-1 { background: linear-gradient(120deg, #c19a6e 0 28%, #9d3f43 29% 55%, #f1d3a1 56% 72%, #403a58 73%); }
.th-p-silk-scarves .scarf-index-fallback-2 { background: radial-gradient(ellipse at 35% 36%, #f0c76f 0 13%, transparent 13.5%), linear-gradient(145deg, #3e405c, #956e8e 51%, #d56b52 52%); }
.th-p-silk-scarves .scarf-index-fallback-3 { background: linear-gradient(35deg, #a34446 0 22%, #eaded1 23% 39%, #d29d57 40% 58%, #755c78 59% 75%, #393650 76%); }
.th-p-silk-scarves .scarf-index-fallback-4 { background: repeating-linear-gradient(137deg, #3d405b 0 15px, #e1bd77 16px 28px, #a74a49 29px 43px, #f1e6d8 44px 58px); }

.th-p-silk-scarves .scarf-index-copy {
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  padding: 18px clamp(13px, 2.5vw, 37px);
}

.th-p-silk-scarves .scarf-index-copy strong {
  max-width: 15ch;
  font: 500 clamp(22px, 2.35vw, 38px)/.93 var(--font-display, 'Bodoni Moda', Georgia, serif);
  letter-spacing: -.05em;
  overflow-wrap: anywhere;
}

.th-p-silk-scarves .scarf-index-copy small {
  margin-top: 9px;
  color: var(--scarf-muted);
  font: 700 9px/1.2 var(--font-body, 'Manrope', sans-serif);
  letter-spacing: .13em;
  text-transform: uppercase;
}

.th-p-silk-scarves .scarf-index-arrow {
  z-index: 1;
  align-self: end;
  padding: 0 15px 16px 0;
  color: var(--scarf-red);
  font: 400 24px/1 var(--font-display, Georgia, serif);
}

.th-p-silk-scarves .scarf-index-ribbon:hover,
.th-p-silk-scarves .scarf-index-ribbon:focus-visible {
  outline: 2px solid var(--scarf-red);
  outline-offset: 3px;
}

.th-p-silk-scarves .scarf-piece-edit {
  align-items: center;
}

.th-p-silk-scarves .scarf-piece-ledger {
  width: 100%;
  border-top: 1px solid var(--scarf-line);
}

.th-p-silk-scarves .scarf-piece-line {
  display: grid;
  grid-template-columns: 50px minmax(0, 1fr) auto 25px;
  min-height: 78px;
  align-items: center;
  gap: 13px;
  border-bottom: 1px solid var(--scarf-line);
  color: var(--scarf-ink);
  text-decoration: none;
}

.th-p-silk-scarves .scarf-piece-line:hover,
.th-p-silk-scarves .scarf-piece-line:focus-visible {
  color: var(--scarf-red);
}

.th-p-silk-scarves .scarf-piece-number,
.th-p-silk-scarves .scarf-piece-line em {
  color: var(--scarf-muted);
  font: 700 9px/1 var(--font-body, 'Manrope', sans-serif);
  font-style: normal;
  letter-spacing: .12em;
}

.th-p-silk-scarves .scarf-piece-line strong {
  font: 500 clamp(20px, 2.1vw, 34px)/.95 var(--font-display, 'Bodoni Moda', Georgia, serif);
  letter-spacing: -.045em;
  overflow-wrap: anywhere;
}

.th-p-silk-scarves .scarf-piece-line > span:last-child {
  color: var(--scarf-red);
  font-size: 21px;
}

.th-p-silk-scarves #shop,
.th-p-silk-scarves .shop-section {
  padding: clamp(58px, 8vw, 128px) clamp(22px, 7vw, 128px);
  background: var(--scarf-paper);
}

.th-p-silk-scarves #shop > :is(h2, .section-title),
.th-p-silk-scarves .shop-section > :is(h2, .section-title) {
  max-width: 12ch;
  color: var(--scarf-plum);
  font-family: var(--font-display, 'Bodoni Moda', Georgia, serif);
  font-size: clamp(43px, 5vw, 80px);
  font-weight: 500;
  letter-spacing: -.065em;
  line-height: .82;
}

.th-p-silk-scarves .product-grid {
  gap: clamp(14px, 2.3vw, 32px);
}

.th-p-silk-scarves :is(.product-card, .card) {
  border-color: var(--scarf-line);
  border-radius: 2px;
  box-shadow: none;
}

.th-p-silk-scarves :is(.product-card, .card) img {
  mix-blend-mode: multiply;
}

@media (max-width: 860px) {
  .th-p-silk-scarves .scarf-hero-sheet {
    grid-template-columns: 28px minmax(0, 1.22fr) minmax(280px, .78fr) 28px;
  }

  .th-p-silk-scarves .scarf-index {
    grid-template-columns: 1fr;
    gap: 38px;
  }

  .th-p-silk-scarves .scarf-index-intro {
    max-width: 36rem;
  }
}

@media (max-width: 640px) {
  .th-p-silk-scarves .scarf-hero-sheet {
    display: block;
    min-height: 0;
    padding: 22px 18px 0;
  }

  .th-p-silk-scarves .scarf-hero-sheet::before,
  .th-p-silk-scarves .scarf-hero-ribbon-two {
    display: none;
  }

  .th-p-silk-scarves .scarf-hero-edition {
    margin: 0 0 10px;
  }

  .th-p-silk-scarves .scarf-hero-rule {
    display: block;
    margin-bottom: 18px;
  }

  .th-p-silk-scarves .scarf-hero-photo {
    min-height: min(125vw, 32rem);
    clip-path: polygon(0 3%, 5% 0, 100% 0, 95% 97%, 89% 100%, 0 100%);
  }

  .th-p-silk-scarves .scarf-hero-photo .hero-media {
    object-position: 67% center;
  }

  .th-p-silk-scarves .scarf-hero-ribbon-one {
    right: -32px;
    bottom: 44%;
    width: 150px;
    height: 43px;
  }

  .th-p-silk-scarves .scarf-hero-copy-card {
    width: auto;
    margin: -45px 16px 0 0;
    padding: 39px 24px 31px;
    box-shadow: 10px 11px 0 rgba(54, 47, 73, .1);
  }

  .th-p-silk-scarves .scarf-hero-copy-card h1 {
    max-width: 9ch;
    font-size: clamp(52px, 17vw, 70px);
  }

  .th-p-silk-scarves .scarf-hero-copy-card h1.long {
    max-width: 13ch;
    font-size: clamp(40px, 12.5vw, 53px);
  }

  .th-p-silk-scarves .scarf-hero-copy-card .sub {
    margin-top: 18px;
  }

  .th-p-silk-scarves .scarf-hero-copy-card .ctas,
  .th-p-silk-scarves .scarf-hero-copy-card .hero-ctas {
    margin-top: 22px;
  }

  .th-p-silk-scarves .scarf-hero-copy-card .btn,
  .th-p-silk-scarves .scarf-hero-copy-card a {
    flex: 1 1 145px;
    padding-inline: 13px;
  }

  .th-p-silk-scarves .scarf-hero-margin-note {
    margin: 19px 0 24px;
  }

  .th-p-silk-scarves .scarf-hero-controls {
    top: 49px;
    right: 28px;
    bottom: auto;
  }

  .th-p-silk-scarves .scarf-index {
    display: block;
    padding: 61px 18px 68px;
  }

  .th-p-silk-scarves .scarf-index-intro h2 {
    font-size: clamp(48px, 14vw, 65px);
  }

  .th-p-silk-scarves .scarf-index-ribbons,
  .th-p-silk-scarves .scarf-piece-ledger {
    margin-top: 37px;
  }

  .th-p-silk-scarves .scarf-index-ribbon {
    grid-template-columns: 33px minmax(74px, .82fr) minmax(0, 1.18fr) 20px;
    min-height: 116px;
    gap: 0;
  }

  .th-p-silk-scarves .scarf-index-order {
    padding: 13px 0 0 8px;
    font-size: 8px;
  }

  .th-p-silk-scarves .scarf-index-copy {
    padding: 13px 10px 13px 15px;
  }

  .th-p-silk-scarves .scarf-index-copy strong {
    font-size: clamp(21px, 6.8vw, 30px);
  }

  .th-p-silk-scarves .scarf-index-copy small {
    font-size: 8px;
  }

  .th-p-silk-scarves .scarf-index-arrow {
    padding: 0 8px 12px 0;
    font-size: 20px;
  }

  .th-p-silk-scarves .scarf-piece-line {
    grid-template-columns: 31px minmax(0, 1fr) 20px;
    gap: 8px;
    min-height: 75px;
  }

  .th-p-silk-scarves .scarf-piece-line em {
    display: none;
  }

  .th-p-silk-scarves #shop,
  .th-p-silk-scarves .shop-section {
    padding: 63px 18px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .th-p-silk-scarves .scarf-hero-photo .hero-media {
    transform: none !important;
  }

  .th-p-silk-scarves .scarf-index-ribbon .scarf-index-visual img {
    transition: none;
  }
}
`;

import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-garden-furniture',
  name: 'Verdant Assembly',
  for: 'Garden furniture for composed open-air rooms',
  vibe: 'Terrace light, cultivated shade, and long-table ease',
  category: 'Garden furniture',
  group: 'home',
  display: 'DM Serif Display',
  body: 'Manrope',
  displayWeight: 400,
  tracking: '-.035em',
  colors: {
    bg: '#F1F0E5',
    surface: '#FAF9F1',
    ink: '#1F392F',
    muted: '#68756A',
    line: '#C9D0BB',
    accent: '#AD5838',
    onAccent: '#FFFFFF',
    panel: '#DCE5CE',
    onPanel: '#19342A',
    foot: '#19342A',
    onFoot: '#F2F3E9',
    bar: '#B8C991',
    onBar: '#19342A',
    badge: '#EDBC76',
    onBadge: '#382C20',
  },
  header: 'center',
  hero: 'editorial',
  card: 'boxed',
  ratio: '4/3',
  rCard: 18,
  rBtn: 999,
  motion: 'drift',
  copy: {
    eyebrow: 'A garden, arranged',
    collection: 'Open-air edit',
    cta: 'Explore the garden',
    title: 'Outdoor rooms for long light',
    subtitle: 'Gathering pieces for the open hours of the day.',
  },
  collection: 'premium',
  family: 'garden-furniture',
  demoPhoto: '/assets/themes/garden-furniture-hero.webp',
});

const asArray = (value) => Array.isArray(value) ? value : [];
const countLabel = (count) => `${count} ${count === 1 ? 'piece' : 'pieces'}`;

const priceFor = (ctx, product) => {
  const amount = Number(product?.price_cents);
  return Number.isFinite(amount) ? ctx.money(amount, product.currency || 'usd', product?.billing_interval) : '';
};

const livePieceNotes = (ctx) => {
  const products = asArray(ctx.products).slice(0, 2);

  if (!products.length) {
    return `<div class="gf-live-note gf-live-note--empty">
      <p class="gf-live-note__number" aria-hidden="true">00</p>
      <p>Current pieces will gather here as they become available.</p>
      <a href="#shop">Browse the collection <span aria-hidden="true">→</span></a>
    </div>`;
  }

  return `<div class="gf-live-notes" aria-label="Featured live pieces">${products.map((product, index) => {
    const price = priceFor(ctx, product);
    const number = String(index + 1).padStart(2, '0');
    return `<a class="gf-live-note" href="${ctx.esc(ctx.productLink(product))}">
      <span class="gf-live-note__number" aria-hidden="true">${number}</span>
      <span class="gf-live-note__copy"><b>${ctx.esc(product.title || 'View piece')}</b>${price ? `<small>${ctx.esc(price)}</small>` : ''}</span>
      <span class="gf-live-note__arrow" aria-hidden="true">↗</span>
    </a>`;
  }).join('')}</div>`;
};

export function hero(ctx) {
  return `<section class="hero category-hero gf-hero${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="gf-hero-mast">
      <p class="gf-hero-mast__mark" aria-hidden="true">GARDEN<br>ROOMS</p>
      <p class="gf-hero-mast__index">Issue 01 · Open air</p>
      <div class="gf-hero-copy-slot">${ctx.copy('gf-hero-copy')}</div>
      <span class="gf-hero-mast__sun" aria-hidden="true"></span>
    </div>
    <div class="gf-hero-view">
      <div class="gf-hero-view__frame">
        ${ctx.media(0, { priority: true, lazy: false, decorative: false })}
      </div>
      <div class="gf-hero-view__caption"><span aria-hidden="true">✦</span> Make a place for the open hours.</div>
    </div>
    <aside class="gf-hero-ledger" aria-label="Live collection notes">
      <div class="gf-hero-ledger__top">
        <p>Garden notes</p>
        <span aria-hidden="true">01–02</span>
      </div>
      ${livePieceNotes(ctx)}
      <div class="gf-hero-ledger__foot">
        <span class="gf-hero-ledger__line" aria-hidden="true"></span>
        <p>Furniture for meals, shade, and staying outdoors a little longer.</p>
      </div>
    </aside>
    ${ctx.controls}
  </section>`;
}

export function discovery(ctx) {
  const categories = asArray(ctx.cats).filter((category) => category && category.name).slice(0, 4);
  const products = asArray(ctx.products);

  if (categories.length >= 2) {
    const routes = categories.map((category, index) => {
      const count = Number.isFinite(Number(category.count)) ? Number(category.count) : 0;
      const image = typeof category.image === 'string' && category.image.trim()
        ? `<img src="${ctx.esc(category.image)}" alt="" loading="lazy" decoding="async">`
        : '<span class="gf-zone__blank" aria-hidden="true"></span>';
      const number = String(index + 1).padStart(2, '0');

      return `<a class="gf-zone gf-zone--${index + 1}" href="${ctx.esc(ctx.categoryLink(category.name))}">
        <span class="gf-zone__media">${image}</span>
        <span class="gf-zone__body">
          <span class="gf-zone__count">${number} / ${ctx.esc(countLabel(count))}</span>
          <strong>${ctx.esc(category.name)}</strong>
          <span class="gf-zone__go" aria-hidden="true">Explore ↗</span>
        </span>
      </a>`;
    }).join('');

    return `<section class="gf-discovery" aria-labelledby="gf-discovery-title">
      <div class="gf-discovery__intro">
        <p class="gf-discovery__eyebrow">The outdoor plan</p>
        <h2 id="gf-discovery-title">Choose a corner of the garden.</h2>
        <p>Browse the live collections currently available in this store.</p>
        <a class="gf-discovery__all" href="#shop">See every piece <span aria-hidden="true">→</span></a>
      </div>
      <div class="gf-zones">${routes}</div>
    </section>`;
  }

  if (products.length) {
    const pieces = products.slice(0, 4).map((product, index) => {
      const price = priceFor(ctx, product);
      const number = String(index + 1).padStart(2, '0');
      return `<a class="gf-piece" href="${ctx.esc(ctx.productLink(product))}">
        <span class="gf-piece__number" aria-hidden="true">${number}</span>
        <strong>${ctx.esc(product.title || 'View piece')}</strong>
        ${product.category ? `<small>${ctx.esc(product.category)}</small>` : '<small>Available now</small>'}
        ${price ? `<em>${ctx.esc(price)}</em>` : ''}
        <span class="gf-piece__arrow" aria-hidden="true">↗</span>
      </a>`;
    }).join('');

    return `<section class="gf-discovery gf-discovery--pieces" aria-labelledby="gf-discovery-title">
      <div class="gf-discovery__intro">
        <p class="gf-discovery__eyebrow">The outdoor edit</p>
        <h2 id="gf-discovery-title">A place to begin outside.</h2>
        <p>A focused view of the live pieces currently available in this store.</p>
        <a class="gf-discovery__all" href="#shop">Browse all pieces <span aria-hidden="true">→</span></a>
      </div>
      <div class="gf-pieces" aria-label="Current pieces">${pieces}</div>
    </section>`;
  }

  return '';
}

export const css = `
.th-p-garden-furniture {
  --gf-ink: #1F392F;
  --gf-paper: #FAF9F1;
  --gf-ground: #F1F0E5;
  --gf-pale: #DCE5CE;
  --gf-leaf: #789064;
  --gf-rust: #AD5838;
  --gf-line: #C9D0BB;
  --gf-muted: #68756A;
  background: var(--gf-ground);
  color: var(--gf-ink);
  overflow-x: clip;
}

.th-p-garden-furniture .ann {
  border: 0;
  background: #19342A;
  color: #F2F3E9;
  font: 600 10px/1.25 var(--body);
  letter-spacing: .14em;
  text-transform: uppercase;
}

.th-p-garden-furniture .hd {
  border-bottom: 1px solid var(--gf-line);
  background: rgba(250, 249, 241, .96);
  color: var(--gf-ink);
}

.th-p-garden-furniture .hd .wrap {
  min-height: 72px;
}

.th-p-garden-furniture .hd .brand {
  font-family: var(--display);
  font-size: clamp(20px, 2vw, 29px);
  font-weight: 400;
  letter-spacing: -.035em;
}

.th-p-garden-furniture .hd .nav {
  gap: clamp(14px, 2vw, 31px);
}

.th-p-garden-furniture .hd .nav a,
.th-p-garden-furniture .hd .cart {
  font: 700 10px/1.2 var(--body);
  letter-spacing: .1em;
  text-transform: uppercase;
}

.th-p-garden-furniture .hd .cart {
  min-height: 44px;
  border: 1px solid var(--gf-ink);
  border-radius: 999px;
  background: transparent;
  color: var(--gf-ink);
}

.th-p-garden-furniture .gf-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(270px, 24vw, 390px);
  grid-template-rows: auto minmax(410px, 45vw, 600px);
  grid-template-areas:
    "mast mast"
    "view ledger";
  gap: 0;
  min-height: clamp(655px, calc(100vh - 72px), 780px);
  overflow: hidden;
  background: var(--gf-ground);
  border-bottom: 1px solid var(--gf-line);
}

.th-p-garden-furniture .gf-hero-mast {
  grid-area: mast;
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(160px, .28fr);
  align-items: end;
  min-height: clamp(266px, 25vw, 337px);
  padding: clamp(26px, 3.3vw, 50px) clamp(24px, 5.2vw, 84px) clamp(28px, 3.7vw, 54px);
  overflow: hidden;
  background: var(--gf-pale);
}

.th-p-garden-furniture .gf-hero-mast::before {
  position: absolute;
  top: -87%;
  right: 11%;
  width: clamp(270px, 32vw, 520px);
  aspect-ratio: 1;
  border: 1px solid rgba(31, 57, 47, .24);
  border-radius: 50%;
  content: "";
}

.th-p-garden-furniture .gf-hero-mast::after {
  position: absolute;
  top: 30px;
  right: clamp(22px, 4vw, 73px);
  width: clamp(88px, 11vw, 178px);
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--gf-rust);
  content: "";
}

.th-p-garden-furniture .gf-hero-mast__mark {
  position: absolute;
  z-index: 2;
  top: clamp(23px, 3vw, 45px);
  left: clamp(24px, 5.2vw, 84px);
  margin: 0;
  color: var(--gf-ink);
  font: 700 10px/1.05 var(--body);
  letter-spacing: .14em;
}

.th-p-garden-furniture .gf-hero-mast__index {
  position: absolute;
  z-index: 2;
  top: clamp(27px, 3.3vw, 49px);
  right: clamp(24px, 5.2vw, 84px);
  margin: 0;
  color: var(--gf-ink);
  font: 700 9px/1.2 var(--body);
  letter-spacing: .12em;
  text-transform: uppercase;
}

.th-p-garden-furniture .gf-hero-copy-slot {
  position: relative;
  z-index: 3;
  width: min(940px, 100%);
}

.th-p-garden-furniture .gf-hero-copy {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(190px, .42fr);
  column-gap: clamp(22px, 4vw, 76px);
  align-items: end;
  color: var(--gf-ink);
}

.th-p-garden-furniture .gf-hero-copy .eyebrow {
  grid-column: 1 / -1;
  margin: 0 0 10px;
  color: var(--gf-muted);
  font: 700 10px/1.2 var(--body);
  letter-spacing: .15em;
  text-transform: uppercase;
}

.th-p-garden-furniture .gf-hero-copy h1 {
  max-width: 13ch;
  margin: 0;
  font: 400 clamp(50px, 7.2vw, 106px)/.84 var(--display);
  letter-spacing: var(--dt);
  overflow-wrap: anywhere;
  text-wrap: balance;
}

.th-p-garden-furniture .gf-hero-copy h1.long {
  max-width: 17ch;
  font-size: clamp(42px, 5.3vw, 76px);
  line-height: .92;
}

.th-p-garden-furniture .gf-hero-copy .sub {
  margin: 0 0 18px;
  color: var(--gf-ink);
  font: 500 clamp(13px, 1.15vw, 16px)/1.56 var(--body);
  overflow-wrap: anywhere;
}

.th-p-garden-furniture .gf-hero-copy .ctas {
  display: flex;
  grid-column: 2;
  flex-wrap: wrap;
  gap: 8px;
}

.th-p-garden-furniture .gf-hero-copy .btn {
  min-height: 44px;
  padding: 11px 17px;
  border: 1px solid var(--gf-ink);
  border-radius: 999px;
  background: var(--gf-ink);
  box-shadow: none;
  color: var(--gf-paper);
  font: 700 10px/1.2 var(--body);
  letter-spacing: .09em;
  text-transform: uppercase;
}

.th-p-garden-furniture .gf-hero-copy .btn.ghost {
  background: transparent;
  color: var(--gf-ink);
}

.th-p-garden-furniture .gf-hero-mast__sun {
  position: absolute;
  z-index: 1;
  right: clamp(22px, 4vw, 73px);
  bottom: 16px;
  width: clamp(120px, 17vw, 228px);
  height: 1px;
  background: var(--gf-ink);
}

.th-p-garden-furniture .gf-hero-mast__sun::before,
.th-p-garden-furniture .gf-hero-mast__sun::after {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 1px;
  background: var(--gf-ink);
  content: "";
}

.th-p-garden-furniture .gf-hero-mast__sun::before { height: 41px; }
.th-p-garden-furniture .gf-hero-mast__sun::after { right: 28%; height: 22px; }

.th-p-garden-furniture .gf-hero-view {
  grid-area: view;
  position: relative;
  display: grid;
  min-width: 0;
  min-height: 0;
  padding: clamp(14px, 1.9vw, 30px) clamp(14px, 1.9vw, 30px) clamp(17px, 2.2vw, 33px) clamp(24px, 5.2vw, 84px);
  overflow: hidden;
  background: #B9C994;
}

.th-p-garden-furniture .gf-hero-view::before {
  position: absolute;
  z-index: 0;
  left: -11%;
  bottom: -43%;
  width: 63%;
  aspect-ratio: 1;
  border: 1px solid rgba(31, 57, 47, .35);
  border-radius: 50%;
  content: "";
}

.th-p-garden-furniture .gf-hero-view__frame {
  position: relative;
  z-index: 1;
  min-height: 0;
  overflow: hidden;
  border-radius: 180px 180px 0 0;
  background: #7E9270;
}

.th-p-garden-furniture .gf-hero-view__frame .hero-media,
.th-p-garden-furniture .gf-hero-view__frame .theme-empty-media {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 100%;
  object-fit: cover;
  object-position: center;
}

.th-p-garden-furniture .gf-hero-view__frame .theme-empty-media {
  background:
    radial-gradient(ellipse at 28% 55%, rgba(250,249,241,.78) 0 5%, transparent 5.3%),
    radial-gradient(ellipse at 68% 72%, rgba(32,68,55,.42) 0 16%, transparent 16.3%),
    linear-gradient(145deg, #D9D6B9 0 32%, #789064 32.4% 51%, #E2A46C 51.4% 69%, #386152 69.4% 100%);
  color: var(--gf-ink);
}

.th-p-garden-furniture .gf-hero-view__caption {
  position: absolute;
  z-index: 2;
  left: clamp(29px, 5.8vw, 96px);
  bottom: clamp(31px, 4vw, 54px);
  max-width: 25ch;
  color: #FFFFFF;
  font: 700 10px/1.45 var(--body);
  letter-spacing: .07em;
  text-transform: uppercase;
  text-shadow: 0 1px 14px rgba(0, 0, 0, .3);
}

.th-p-garden-furniture .gf-hero-view__caption span {
  margin-right: 8px;
  color: #EDBC76;
  font-size: 13px;
}

.th-p-garden-furniture .gf-hero-ledger {
  grid-area: ledger;
  display: flex;
  min-width: 0;
  flex-direction: column;
  padding: clamp(20px, 2.4vw, 36px) clamp(20px, 2.8vw, 45px) clamp(24px, 3vw, 42px);
  background: var(--gf-paper);
  color: var(--gf-ink);
}

.th-p-garden-furniture .gf-hero-ledger__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--gf-line);
}

.th-p-garden-furniture .gf-hero-ledger__top p,
.th-p-garden-furniture .gf-hero-ledger__top span {
  margin: 0;
  font: 700 10px/1.2 var(--body);
  letter-spacing: .11em;
  text-transform: uppercase;
}

.th-p-garden-furniture .gf-hero-ledger__top span { color: var(--gf-muted); }

.th-p-garden-furniture .gf-live-notes {
  display: grid;
  margin-top: clamp(18px, 2.2vw, 28px);
  border-top: 1px solid var(--gf-line);
}

.th-p-garden-furniture .gf-live-note {
  display: grid;
  grid-template-columns: 27px minmax(0, 1fr) 16px;
  align-items: center;
  gap: 10px;
  min-height: 72px;
  border-bottom: 1px solid var(--gf-line);
  color: inherit;
  text-decoration: none;
}

.th-p-garden-furniture .gf-live-note__number {
  color: var(--gf-rust);
  font: 700 10px/1 var(--body);
  letter-spacing: .06em;
}

.th-p-garden-furniture .gf-live-note__copy {
  display: grid;
  min-width: 0;
  gap: 5px;
}

.th-p-garden-furniture .gf-live-note__copy b {
  overflow-wrap: anywhere;
  font: 400 clamp(17px, 1.4vw, 21px)/1.06 var(--display);
  letter-spacing: var(--dt);
}

.th-p-garden-furniture .gf-live-note__copy small {
  color: var(--gf-muted);
  font: 700 10px/1.2 var(--body);
  letter-spacing: .05em;
}

.th-p-garden-furniture .gf-live-note__arrow {
  color: var(--gf-rust);
  font-size: 16px;
  text-align: right;
}

.th-p-garden-furniture .gf-live-note--empty {
  display: grid;
  align-content: center;
  flex: 1;
  gap: 14px;
  margin: 20px 0;
}

.th-p-garden-furniture .gf-live-note--empty p { margin: 0; }

.th-p-garden-furniture .gf-live-note--empty .gf-live-note__number {
  color: var(--gf-rust);
  font: 400 clamp(50px, 6vw, 76px)/.82 var(--display);
  letter-spacing: var(--dt);
}

.th-p-garden-furniture .gf-live-note--empty p:not(.gf-live-note__number) {
  max-width: 24ch;
  color: var(--gf-muted);
  font: 500 13px/1.55 var(--body);
}

.th-p-garden-furniture .gf-live-note--empty a {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  min-height: 44px;
  color: var(--gf-ink);
  font: 700 10px/1.2 var(--body);
  letter-spacing: .08em;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-garden-furniture .gf-hero-ledger__foot {
  display: grid;
  gap: 12px;
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid var(--gf-line);
}

.th-p-garden-furniture .gf-hero-ledger__line {
  display: block;
  width: 39px;
  height: 3px;
  border-radius: 999px;
  background: var(--gf-rust);
}

.th-p-garden-furniture .gf-hero-ledger__foot p {
  max-width: 25ch;
  margin: 0;
  color: var(--gf-muted);
  font: 500 12px/1.55 var(--body);
}

.th-p-garden-furniture .motion-toggle {
  right: clamp(18px, 2.3vw, 38px);
  bottom: clamp(18px, 2.2vw, 32px);
  min-height: 44px;
  border: 1px solid rgba(255, 255, 255, .68);
  border-radius: 999px;
  background: rgba(25, 52, 42, .74);
  color: #FFFFFF;
  font: 700 9px/1.2 var(--body);
  letter-spacing: .07em;
  text-transform: uppercase;
}

.th-p-garden-furniture .gf-discovery {
  display: grid;
  grid-template-columns: minmax(250px, .65fr) minmax(0, 1.35fr);
  gap: clamp(30px, 6vw, 106px);
  padding: clamp(64px, 8.5vw, 132px) clamp(20px, 5.2vw, 84px);
  background: var(--gf-ground);
}

.th-p-garden-furniture .gf-discovery__intro {
  align-self: start;
  max-width: 380px;
  padding-top: 10px;
}

.th-p-garden-furniture .gf-discovery__eyebrow {
  margin: 0 0 15px;
  color: var(--gf-rust);
  font: 700 10px/1.2 var(--body);
  letter-spacing: .15em;
  text-transform: uppercase;
}

.th-p-garden-furniture .gf-discovery h2 {
  margin: 0;
  color: var(--gf-ink);
  font: 400 clamp(41px, 4.7vw, 72px)/.9 var(--display);
  letter-spacing: var(--dt);
  overflow-wrap: anywhere;
  text-wrap: balance;
}

.th-p-garden-furniture .gf-discovery__intro > p:not(.gf-discovery__eyebrow) {
  max-width: 31ch;
  margin: 20px 0 0;
  color: var(--gf-muted);
  font: 500 14px/1.62 var(--body);
}

.th-p-garden-furniture .gf-discovery__all {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  min-height: 44px;
  margin-top: 26px;
  padding: 0 17px;
  border: 1px solid var(--gf-ink);
  border-radius: 999px;
  color: var(--gf-ink);
  font: 700 10px/1.2 var(--body);
  letter-spacing: .08em;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-garden-furniture .gf-zones {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(14px, 1.8vw, 26px);
  align-items: start;
}

.th-p-garden-furniture .gf-zone {
  display: grid;
  min-width: 0;
  overflow: hidden;
  border-radius: 150px 150px 18px 18px;
  background: var(--gf-paper);
  color: inherit;
  text-decoration: none;
}

.th-p-garden-furniture .gf-zone--2,
.th-p-garden-furniture .gf-zone--4 {
  margin-top: clamp(34px, 6vw, 104px);
}

.th-p-garden-furniture .gf-zone__media {
  position: relative;
  display: block;
  min-height: clamp(210px, 22vw, 350px);
  overflow: hidden;
  background: #B5C292;
}

.th-p-garden-furniture .gf-zone__media img,
.th-p-garden-furniture .gf-zone__blank {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 100%;
  object-fit: cover;
}

.th-p-garden-furniture .gf-zone__blank {
  background:
    radial-gradient(ellipse at 72% 23%, #F2D29C 0 11%, transparent 11.3%),
    linear-gradient(145deg, #82966E 0 43%, #D4B57D 43.4% 59%, #DCE5CE 59.4% 100%);
}

.th-p-garden-furniture .gf-zone__body {
  display: grid;
  gap: 8px;
  min-height: 151px;
  padding: clamp(18px, 2vw, 28px);
}

.th-p-garden-furniture .gf-zone__count {
  color: var(--gf-rust);
  font: 700 9px/1.2 var(--body);
  letter-spacing: .09em;
  text-transform: uppercase;
}

.th-p-garden-furniture .gf-zone__body strong {
  overflow-wrap: anywhere;
  font: 400 clamp(25px, 2.25vw, 37px)/.97 var(--display);
  letter-spacing: var(--dt);
}

.th-p-garden-furniture .gf-zone__go {
  margin-top: auto;
  color: var(--gf-muted);
  font: 700 9px/1.2 var(--body);
  letter-spacing: .08em;
  text-transform: uppercase;
}

.th-p-garden-furniture .gf-discovery--pieces {
  background: var(--gf-pale);
}

.th-p-garden-furniture .gf-pieces {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border-top: 1px solid var(--gf-line);
  border-left: 1px solid var(--gf-line);
  background: var(--gf-paper);
}

.th-p-garden-furniture .gf-piece {
  position: relative;
  display: grid;
  min-width: 0;
  min-height: 180px;
  align-content: end;
  gap: 6px;
  padding: clamp(19px, 2vw, 31px);
  border-right: 1px solid var(--gf-line);
  border-bottom: 1px solid var(--gf-line);
  color: var(--gf-ink);
  text-decoration: none;
}

.th-p-garden-furniture .gf-piece__number {
  position: absolute;
  top: 19px;
  left: 21px;
  color: var(--gf-rust);
  font: 700 9px/1 var(--body);
  letter-spacing: .1em;
}

.th-p-garden-furniture .gf-piece strong {
  max-width: 14ch;
  overflow-wrap: anywhere;
  font: 400 clamp(24px, 2vw, 33px)/.98 var(--display);
  letter-spacing: var(--dt);
}

.th-p-garden-furniture .gf-piece small {
  color: var(--gf-muted);
  font: 700 9px/1.3 var(--body);
  letter-spacing: .08em;
  text-transform: uppercase;
}

.th-p-garden-furniture .gf-piece em {
  color: var(--gf-rust);
  font: 700 11px/1.2 var(--body);
  font-style: normal;
}

.th-p-garden-furniture .gf-piece__arrow {
  position: absolute;
  top: 18px;
  right: 20px;
  color: var(--gf-rust);
  font-size: 18px;
}

.th-p-garden-furniture #shop {
  padding-top: clamp(55px, 7vw, 108px);
  background: var(--gf-paper);
}

.th-p-garden-furniture #shop .sec-h {
  align-items: end;
  padding-bottom: clamp(21px, 2.5vw, 35px);
  border-bottom: 1px solid var(--gf-line);
}

.th-p-garden-furniture #shop .sec-h h2 {
  font: 400 clamp(40px, 4.8vw, 72px)/.9 var(--display);
  letter-spacing: var(--dt);
}

.th-p-garden-furniture #shop .chips {
  gap: 7px;
}

.th-p-garden-furniture #shop .chip {
  min-height: 42px;
  padding: 9px 14px;
  border: 1px solid var(--gf-line);
  border-radius: 999px;
  background: transparent;
  color: var(--gf-ink);
  font: 700 10px/1.2 var(--body);
  letter-spacing: .05em;
}

.th-p-garden-furniture #shop .chip[aria-current] {
  border-color: var(--gf-ink);
  background: var(--gf-ink);
  color: var(--gf-paper);
}

.th-p-garden-furniture #shop .grid {
  gap: clamp(30px, 4vw, 64px) clamp(16px, 2.5vw, 40px);
}

.th-p-garden-furniture #shop .pc {
  gap: 13px;
}

.th-p-garden-furniture #shop .pc .im {
  overflow: hidden;
  border-radius: 120px 120px 16px 16px;
  background: var(--gf-pale);
}

.th-p-garden-furniture #shop .pc .bd {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 6px 14px;
  padding-inline: 3px;
}

.th-p-garden-furniture #shop .pc h3 {
  font: 400 clamp(20px, 1.7vw, 26px)/1.02 var(--display);
  letter-spacing: var(--dt);
}

.th-p-garden-furniture #shop .pc .pr {
  color: var(--gf-rust);
  font: 700 11px/1.2 var(--body);
  white-space: nowrap;
}

.th-p-garden-furniture #shop .pc .tag {
  top: 12px;
  left: 12px;
  border-radius: 999px;
  background: var(--gf-paper);
  color: var(--gf-ink);
}

.th-p-garden-furniture #shop .pc .go {
  border-radius: 999px;
  background: var(--gf-ink);
  color: var(--gf-paper);
}

.th-p-garden-furniture .ft {
  background: #19342A;
  color: #F2F3E9;
}

@media (max-width: 900px) {
  .th-p-garden-furniture .gf-hero {
    grid-template-columns: minmax(0, 1fr) 280px;
    grid-template-rows: auto minmax(430px, 61vw, 570px);
  }

  .th-p-garden-furniture .gf-hero-copy {
    grid-template-columns: minmax(0, 1fr) minmax(150px, .38fr);
  }

  .th-p-garden-furniture .gf-hero-copy h1 {
    font-size: clamp(49px, 7.7vw, 77px);
  }

  .th-p-garden-furniture .gf-discovery {
    gap: 40px;
  }

  .th-p-garden-furniture .gf-zone__media {
    min-height: 195px;
  }
}

@media (max-width: 720px) {
  .th-p-garden-furniture .hd .wrap {
    min-height: 64px;
  }

  .th-p-garden-furniture .hd .brand {
    font-size: 21px;
  }

  .th-p-garden-furniture .gf-hero {
    display: flex;
    min-height: 0;
    flex-direction: column;
  }

  .th-p-garden-furniture .gf-hero-mast {
    min-height: 394px;
    grid-template-columns: 1fr;
    padding: 25px 20px 26px;
  }

  .th-p-garden-furniture .gf-hero-mast::before {
    top: -35%;
    right: -8%;
    width: 340px;
  }

  .th-p-garden-furniture .gf-hero-mast::after {
    top: 54px;
    right: 23px;
    width: 94px;
  }

  .th-p-garden-furniture .gf-hero-mast__mark {
    top: 23px;
    left: 20px;
  }

  .th-p-garden-furniture .gf-hero-mast__index {
    top: 25px;
    right: 20px;
  }

  .th-p-garden-furniture .gf-hero-copy {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .th-p-garden-furniture .gf-hero-copy h1 {
    max-width: 10ch;
    font-size: clamp(51px, 15vw, 74px);
  }

  .th-p-garden-furniture .gf-hero-copy h1.long {
    max-width: 14ch;
    font-size: clamp(40px, 11vw, 59px);
  }

  .th-p-garden-furniture .gf-hero-copy .sub {
    max-width: 33ch;
    margin: 0;
    font-size: 13px;
  }

  .th-p-garden-furniture .gf-hero-copy .ctas {
    grid-column: auto;
  }

  .th-p-garden-furniture .gf-hero-view {
    min-height: clamp(350px, 100vw, 500px);
    padding: 14px 20px 18px;
  }

  .th-p-garden-furniture .gf-hero-view__frame {
    border-radius: 130px 130px 0 0;
  }

  .th-p-garden-furniture .gf-hero-view__caption {
    left: 35px;
    bottom: 31px;
  }

  .th-p-garden-furniture .gf-hero-ledger {
    min-height: 250px;
    padding: 24px 20px 23px;
  }

  .th-p-garden-furniture .gf-hero-ledger__foot {
    margin-top: 20px;
  }

  .th-p-garden-furniture .motion-toggle {
    top: auto;
    right: 20px;
    bottom: 270px;
  }

  .th-p-garden-furniture .gf-discovery {
    grid-template-columns: 1fr;
    gap: 31px;
    padding: 67px 20px 75px;
  }

  .th-p-garden-furniture .gf-discovery__intro {
    max-width: 480px;
  }

  .th-p-garden-furniture .gf-zones {
    gap: 14px;
  }

  .th-p-garden-furniture .gf-zone__media {
    min-height: 190px;
  }

  .th-p-garden-furniture .gf-zone__body {
    min-height: 140px;
    padding: 18px;
  }

  .th-p-garden-furniture #shop .sec-h {
    align-items: start;
    flex-direction: column;
  }
}

@media (max-width: 430px) {
  .th-p-garden-furniture .hd .cart {
    min-width: 44px;
    padding-inline: 10px;
  }

  .th-p-garden-furniture .gf-hero-mast {
    min-height: 391px;
  }

  .th-p-garden-furniture .gf-hero-copy h1 {
    font-size: clamp(47px, 14vw, 62px);
  }

  .th-p-garden-furniture .gf-hero-copy h1.long {
    font-size: clamp(37px, 10.5vw, 47px);
  }

  .th-p-garden-furniture .gf-hero-mast__sun {
    right: 20px;
    width: 116px;
  }

  .th-p-garden-furniture .gf-hero-view {
    min-height: 340px;
  }

  .th-p-garden-furniture .gf-hero-view__caption {
    max-width: 21ch;
    font-size: 9px;
  }

  .th-p-garden-furniture .gf-live-note {
    min-height: 66px;
  }

  .th-p-garden-furniture .gf-live-note__copy b {
    font-size: 18px;
  }

  .th-p-garden-furniture .motion-toggle {
    bottom: 267px;
    right: 16px;
  }

  .th-p-garden-furniture .gf-discovery h2 {
    font-size: 43px;
  }

  .th-p-garden-furniture .gf-zones {
    grid-template-columns: 1fr;
    gap: 19px;
  }

  .th-p-garden-furniture .gf-zone,
  .th-p-garden-furniture .gf-zone--2,
  .th-p-garden-furniture .gf-zone--4 {
    margin-top: 0;
    border-radius: 105px 105px 16px 16px;
  }

  .th-p-garden-furniture .gf-zone__media {
    min-height: 237px;
  }

  .th-p-garden-furniture .gf-zone__body {
    min-height: 130px;
  }

  .th-p-garden-furniture .gf-pieces {
    grid-template-columns: 1fr;
  }

  .th-p-garden-furniture .gf-piece {
    min-height: 150px;
  }

  .th-p-garden-furniture #shop .chips {
    width: 100%;
    flex-wrap: nowrap;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .th-p-garden-furniture #shop .chip {
    min-height: 44px;
    flex: 0 0 auto;
  }

  .th-p-garden-furniture #shop .pc .im {
    border-radius: 96px 96px 14px 14px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .th-p-garden-furniture .motion-toggle {
    display: none;
  }
}
`;

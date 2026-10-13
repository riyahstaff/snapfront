import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-kayaks',
  name: 'Current & Cedar',
  for: 'Paddlers choosing a kayak for unhurried water',
  vibe: 'A cedar-launch field journal in glacial green, weathered ink, and kiln orange.',
  category: 'Kayaks and paddlecraft',
  group: 'outdoor',
  display: 'DM Serif Display',
  body: 'Manrope',
  displayWeight: 400,
  tracking: '-.045em',
  colors: {
    bg: '#E8E3D5', surface: '#F4F0E6', ink: '#172D29', muted: '#61736B', line: '#B8C1B6',
    accent: '#C65E31', onAccent: '#FFF8EE', panel: '#173C38', onPanel: '#F0E9DC',
    foot: '#112A27', onFoot: '#F4F0E6', bar: '#1D4A45', onBar: '#F4F0E6',
    badge: '#D9A66A', onBadge: '#172D29',
  },
  header: 'stack',
  hero: 'spotlight',
  card: 'boxed',
  ratio: '4/5',
  rCard: 6,
  rBtn: 999,
  motion: 'drift',
  copy: {
    eyebrow: 'Paddlecraft for open water',
    collection: 'The launch ledger',
    cta: 'Browse the fleet',
    title: 'Make room for the water.',
    subtitle: 'A considered collection for the first quiet push from shore.',
  },
});

const countLabel = (count) => `${count} ${count === 1 ? 'available piece' : 'available pieces'}`;

function categoryImage(ctx, category) {
  if (category.image) {
    return `<img src="${ctx.esc(category.image)}" alt="" loading="lazy" decoding="async">`;
  }
  return `<div class="kayak-index-card__blank" aria-hidden="true"><span></span><i></i><b></b></div>`;
}

function categoryCard(ctx, category, index) {
  const count = Number(category.count) || 0;
  const number = String(index + 1).padStart(2, '0');
  return `<a class="kayak-index-card" href="${ctx.esc(ctx.categoryLink(category.name))}">
    <div class="kayak-index-card__media">${categoryImage(ctx, category)}</div>
    <div class="kayak-index-card__waterline" aria-hidden="true"><span></span></div>
    <div class="kayak-index-card__body">
      <span class="kayak-index-card__number">${number}</span>
      <h3>${ctx.esc(category.name)}</h3>
      <p>${ctx.esc(countLabel(count))}</p>
      <span class="kayak-index-card__open">Open collection <i aria-hidden="true">↗</i></span>
    </div>
  </a>`;
}

export function hero(ctx) {
  return `<section class="hero category-hero kayak-hero${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="kayak-hero__image">${ctx.media(0, { priority: true, lazy: false })}</div>
    <div class="kayak-hero__tint" aria-hidden="true"></div>
    <div class="kayak-hero__edge kayak-hero__edge--top" aria-hidden="true"><span></span><i></i></div>
    <p class="kayak-hero__margin-note" aria-hidden="true"><span>01</span><b>leave<br>shore</b></p>
    <div class="kayak-hero__copy-wrap">${ctx.copy('kayak-hero__copy')}</div>
    <div class="kayak-hero__launch-note" aria-hidden="true">
      <span>Current &amp; cedar</span>
      <i></i>
      <span>water is the way</span>
    </div>
    ${ctx.controls}
  </section>`;
}

export function discovery(ctx) {
  const categories = (ctx.cats || []).filter((category) => category?.name).slice(0, 4);
  if (categories.length >= 2) {
    return `<section class="theme-discovery kayak-discovery" aria-labelledby="kayak-ledger-title">
      <div class="kayak-discovery__top">
        <p class="kayak-discovery__folio">Fleet / ${String(categories.length).padStart(2, '0')}</p>
        <div class="kayak-discovery__intro">
          <p class="kayak-discovery__eyebrow">The launch ledger</p>
          <h2 id="kayak-ledger-title">Find a place to begin.</h2>
          <p>Browse the collections currently on the water, then follow the shape that draws you out.</p>
        </div>
      </div>
      <div class="kayak-discovery__water-rule" aria-hidden="true"><span></span><i></i><span></span></div>
      <div class="kayak-index">${categories.map((category, index) => categoryCard(ctx, category, index)).join('')}</div>
    </section>`;
  }

  const products = (ctx.products || []).slice(0, 3);
  if (products.length >= 2) {
    return `<section class="theme-discovery kayak-discovery kayak-discovery--products" aria-labelledby="kayak-ledger-title">
      <div class="kayak-discovery__top">
        <p class="kayak-discovery__folio">Fleet / Current</p>
        <div class="kayak-discovery__intro">
          <p class="kayak-discovery__eyebrow">The launch ledger</p>
          <h2 id="kayak-ledger-title">Ready at the shoreline.</h2>
          <p>Explore the pieces presently available from this store.</p>
        </div>
      </div>
      <div class="kayak-discovery__water-rule" aria-hidden="true"><span></span><i></i><span></span></div>
      <div class="kayak-current-products">${products.map((product) => ctx.productCard(product)).join('')}</div>
    </section>`;
  }

  return '';
}

export const css = `
.th-p-kayaks {
  --kayak-paper: #E8E3D5;
  --kayak-foam: #F4F0E6;
  --kayak-ink: #172D29;
  --kayak-water: #173C38;
  --kayak-orange: #C65E31;
  background: var(--kayak-paper);
  color: var(--kayak-ink);
}
.th-p-kayaks .ann {
  border: 0;
  background: var(--kayak-orange);
  color: #FFF8EE;
  font: 700 10px/1.2 var(--body);
  letter-spacing: .14em;
  text-transform: uppercase;
}
.th-p-kayaks .hd {
  background: var(--kayak-foam);
  border-bottom: 1px solid #172D2926;
}
.th-p-kayaks .hd .wrap { min-height: 68px; }
.th-p-kayaks .hd .brand {
  color: var(--kayak-ink);
  font: 400 clamp(24px, 2.2vw, 31px)/1 var(--display);
  letter-spacing: -.045em;
}
.th-p-kayaks .hd :is(.nav a, .cart) {
  color: var(--kayak-ink);
  font: 700 10px/1.2 var(--body);
  letter-spacing: .12em;
  text-transform: uppercase;
}
.th-p-kayaks .hd .nav a:hover,
.th-p-kayaks .hd .cart:hover { color: var(--kayak-orange); }
.th-p-kayaks .kayak-hero {
  position: relative;
  isolation: isolate;
  min-height: clamp(600px, 50vw, 790px);
  overflow: hidden;
  display: grid;
  align-items: end;
  background: var(--kayak-water);
  color: #FFF8EE;
}
.th-p-kayaks .kayak-hero__image {
  position: absolute;
  inset: 0;
  z-index: -3;
  overflow: hidden;
  background: #19423E;
}
.th-p-kayaks .kayak-hero__image .hero-media,
.th-p-kayaks .kayak-hero__image .theme-empty-media {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: block;
  object-fit: cover;
  object-position: center;
}
.th-p-kayaks .kayak-hero__image .theme-empty-media {
  display: grid;
  place-items: center;
  background:
    radial-gradient(ellipse at 68% 43%, #A6C9BF42 0 11%, transparent 35%),
    linear-gradient(145deg, #14332F 0%, #285D56 49%, #122B28 100%);
  color: #F4F0E6;
}
.th-p-kayaks .kayak-hero__tint {
  position: absolute;
  z-index: -2;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(90deg, #102A27E8 0%, #102A27B5 28%, #102A2740 61%, #102A2770 100%), linear-gradient(0deg, #102A27E8 0%, transparent 49%);
}
.th-p-kayaks .kayak-hero__edge {
  position: absolute;
  z-index: 1;
  right: clamp(20px, 3.5vw, 64px);
  left: clamp(20px, 3.5vw, 64px);
  height: 22px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #FFF8EEA6;
}
.th-p-kayaks .kayak-hero__edge::before,
.th-p-kayaks .kayak-hero__edge::after {
  height: 1px;
  flex: 1;
  content: '';
  background: #FFF8EE82;
}
.th-p-kayaks .kayak-hero__edge span { width: 7px; height: 7px; border: 1px solid currentColor; border-radius: 50%; }
.th-p-kayaks .kayak-hero__edge i { width: 34px; height: 1px; background: currentColor; }
.th-p-kayaks .kayak-hero__edge--top { top: clamp(24px, 3.5vw, 52px); }
.th-p-kayaks .kayak-hero__margin-note {
  position: absolute;
  z-index: 1;
  top: 50%;
  right: clamp(20px, 3.5vw, 64px);
  display: grid;
  grid-template-columns: auto auto;
  gap: 8px;
  align-items: start;
  margin: 0;
  color: #FFF8EED9;
  font: 700 9px/1.35 var(--body);
  letter-spacing: .17em;
  text-transform: uppercase;
  writing-mode: vertical-rl;
}
.th-p-kayaks .kayak-hero__margin-note span { color: #D9A66A; }
.th-p-kayaks .kayak-hero__margin-note b { font: inherit; font-weight: 700; }
.th-p-kayaks .kayak-hero__copy-wrap {
  position: relative;
  z-index: 2;
  width: min(100% - clamp(80px, 12vw, 190px), 1280px);
  margin: 0 auto;
  padding: clamp(140px, 16vw, 220px) 0 clamp(58px, 7vw, 106px);
}
.th-p-kayaks .kayak-hero__copy { max-width: min(630px, 76%); }
.th-p-kayaks .kayak-hero__copy .eyebrow {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 18px;
  color: #F2E6D1;
  font: 700 10px/1.25 var(--body);
  letter-spacing: .19em;
  text-transform: uppercase;
}
.th-p-kayaks .kayak-hero__copy .eyebrow::before {
  width: 27px;
  height: 1px;
  flex: 0 0 auto;
  content: '';
  background: #D9A66A;
}
.th-p-kayaks .kayak-hero__copy h1 {
  max-width: 8.7ch;
  margin: 0;
  color: #FFF8EE;
  font: 400 clamp(64px, 9.1vw, 142px)/.81 var(--display);
  letter-spacing: -.065em;
  text-wrap: balance;
}
.th-p-kayaks .kayak-hero__copy h1.long {
  max-width: 12ch;
  font-size: clamp(48px, 6.9vw, 104px);
  line-height: .86;
}
.th-p-kayaks .kayak-hero__copy .sub {
  max-width: 38ch;
  margin: 24px 0 0;
  color: #FFF8EED4;
  font: 500 clamp(13px, 1.2vw, 16px)/1.55 var(--body);
}
.th-p-kayaks .kayak-hero__copy .ctas {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 27px;
}
.th-p-kayaks .kayak-hero__copy .btn {
  min-height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  border: 1px solid #FFF8EE;
  border-radius: 999px;
  background: #FFF8EE;
  color: var(--kayak-ink);
  font: 800 10px/1 var(--body);
  letter-spacing: .12em;
  text-transform: uppercase;
}
.th-p-kayaks .kayak-hero__copy .btn.ghost { background: transparent; color: #FFF8EE; }
.th-p-kayaks .kayak-hero__copy .btn:hover { border-color: var(--kayak-orange); background: var(--kayak-orange); color: #FFF8EE; }
.th-p-kayaks .kayak-hero__launch-note {
  position: absolute;
  z-index: 1;
  right: clamp(20px, 3.5vw, 64px);
  bottom: clamp(28px, 4vw, 56px);
  display: flex;
  align-items: center;
  gap: 11px;
  color: #FFF8EED9;
  font: 700 9px/1.15 var(--body);
  letter-spacing: .16em;
  text-transform: uppercase;
}
.th-p-kayaks .kayak-hero__launch-note i { width: 22px; height: 1px; background: #D9A66A; }
.th-p-kayaks .kayak-hero .motion-toggle {
  position: absolute;
  z-index: 3;
  top: clamp(42px, 5.2vw, 82px);
  right: clamp(20px, 3.5vw, 64px);
  min-width: 44px;
  min-height: 44px;
  padding: 0 12px;
  border: 1px solid #FFF8EE7A;
  border-radius: 999px;
  background: #102A2799;
  color: #FFF8EE;
  font: 800 8px/1 var(--body);
  letter-spacing: .1em;
  text-transform: uppercase;
}
.th-p-kayaks .kayak-hero .motion-toggle:hover { border-color: var(--kayak-orange); background: var(--kayak-orange); }
.th-p-kayaks .kayak-discovery {
  position: relative;
  overflow: hidden;
  padding: clamp(58px, 7vw, 108px) max(24px, calc((100vw - 1360px) / 2)) clamp(64px, 8vw, 120px);
  background: var(--kayak-paper);
  color: var(--kayak-ink);
}
.th-p-kayaks .kayak-discovery::before {
  position: absolute;
  top: 17px;
  left: -10%;
  width: 120%;
  height: 52%;
  content: '';
  border-top: 1px solid #173C3819;
  border-bottom: 1px solid #173C380D;
  border-radius: 50%;
  pointer-events: none;
}
.th-p-kayaks .kayak-discovery__top {
  position: relative;
  display: grid;
  grid-template-columns: minmax(118px, .72fr) minmax(0, 2.1fr);
  gap: clamp(26px, 5vw, 86px);
  align-items: start;
}
.th-p-kayaks .kayak-discovery__folio {
  margin: 9px 0 0;
  color: var(--kayak-orange);
  font: 800 10px/1.2 var(--body);
  letter-spacing: .16em;
  text-transform: uppercase;
}
.th-p-kayaks .kayak-discovery__intro { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(170px, .65fr); column-gap: clamp(28px, 5vw, 86px); }
.th-p-kayaks .kayak-discovery__eyebrow {
  grid-column: 1 / -1;
  margin: 0 0 13px;
  color: var(--kayak-water);
  font: 800 10px/1.2 var(--body);
  letter-spacing: .18em;
  text-transform: uppercase;
}
.th-p-kayaks .kayak-discovery__intro h2 {
  max-width: 11ch;
  margin: 0;
  font: 400 clamp(47px, 5.8vw, 86px)/.88 var(--display);
  letter-spacing: -.055em;
  text-wrap: balance;
}
.th-p-kayaks .kayak-discovery__intro > p:last-child {
  align-self: end;
  max-width: 30ch;
  margin: 0 0 4px;
  color: var(--muted);
  font: 500 14px/1.55 var(--body);
}
.th-p-kayaks .kayak-discovery__water-rule {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: clamp(34px, 5vw, 70px) 0 24px;
  color: var(--kayak-water);
}
.th-p-kayaks .kayak-discovery__water-rule::before,
.th-p-kayaks .kayak-discovery__water-rule::after { height: 1px; flex: 1; content: ''; background: #173C3852; }
.th-p-kayaks .kayak-discovery__water-rule span { width: clamp(24px, 4vw, 50px); height: 1px; background: currentColor; }
.th-p-kayaks .kayak-discovery__water-rule i { width: 8px; height: 8px; border: 1px solid currentColor; border-radius: 50%; }
.th-p-kayaks .kayak-index {
  position: relative;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}
.th-p-kayaks .kayak-index-card {
  position: relative;
  min-width: 0;
  min-height: clamp(320px, 28vw, 438px);
  overflow: hidden;
  display: flex;
  align-items: flex-end;
  border: 1px solid #173C3831;
  border-radius: 6px;
  background: var(--kayak-water);
  color: #FFF8EE;
  text-decoration: none;
}
.th-p-kayaks .kayak-index-card__media {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #295A55;
}
.th-p-kayaks .kayak-index-card__media::after {
  position: absolute;
  inset: 0;
  content: '';
  background: linear-gradient(0deg, #102A27EF 0%, #102A277A 39%, #102A270C 71%);
}
.th-p-kayaks .kayak-index-card__media img,
.th-p-kayaks .kayak-index-card__blank {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}
.th-p-kayaks .kayak-index-card__blank {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #A0B9AC 0%, #47756D 49%, #173C38 100%);
}
.th-p-kayaks .kayak-index-card__blank::before,
.th-p-kayaks .kayak-index-card__blank::after,
.th-p-kayaks .kayak-index-card__blank :is(span, i, b) {
  position: absolute;
  display: block;
  content: '';
  border: 1px solid #FFF8EE66;
  border-radius: 50%;
}
.th-p-kayaks .kayak-index-card__blank::before { top: -12%; left: -28%; width: 130%; height: 58%; }
.th-p-kayaks .kayak-index-card__blank::after { right: -41%; bottom: 6%; width: 128%; height: 61%; }
.th-p-kayaks .kayak-index-card__blank span { top: 23%; left: 14%; width: 51%; height: 22%; }
.th-p-kayaks .kayak-index-card__blank i { top: 52%; left: 19%; width: 85%; height: 38%; }
.th-p-kayaks .kayak-index-card__blank b { top: 7%; left: 58%; width: 24%; height: 12%; }
.th-p-kayaks .kayak-index-card__waterline {
  position: absolute;
  z-index: 1;
  top: 20px;
  right: 18px;
  left: 18px;
  height: 1px;
  overflow: hidden;
  background: #FFF8EE80;
}
.th-p-kayaks .kayak-index-card__waterline span { display: block; width: 36%; height: 100%; background: #D9A66A; }
.th-p-kayaks .kayak-index-card__body { position: relative; z-index: 2; width: 100%; padding: 20px; }
.th-p-kayaks .kayak-index-card__number {
  display: block;
  margin-bottom: clamp(46px, 6vw, 82px);
  color: #D9A66A;
  font: 800 9px/1 var(--body);
  letter-spacing: .16em;
}
.th-p-kayaks .kayak-index-card h3 {
  margin: 0;
  color: #FFF8EE;
  font: 400 clamp(31px, 3vw, 48px)/.88 var(--display);
  letter-spacing: -.045em;
  overflow-wrap: anywhere;
}
.th-p-kayaks .kayak-index-card p {
  margin: 10px 0 0;
  color: #FFF8EECA;
  font: 700 9px/1.35 var(--body);
  letter-spacing: .13em;
  text-transform: uppercase;
}
.th-p-kayaks .kayak-index-card__open {
  display: block;
  margin-top: 20px;
  color: #FFF8EE;
  font: 800 10px/1.2 var(--body);
  letter-spacing: .1em;
  text-transform: uppercase;
}
.th-p-kayaks .kayak-index-card__open i { margin-left: 4px; color: #D9A66A; font: 400 17px/.8 var(--display); font-style: normal; }
.th-p-kayaks .kayak-index-card:hover .kayak-index-card__media img { transform: scale(1.04); }
.th-p-kayaks .kayak-index-card__media img { transition: transform .45s ease; }
.th-p-kayaks .kayak-current-products {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 1px solid #173C3845;
  border-left: 1px solid #173C3845;
}
.th-p-kayaks .kayak-current-products .pc {
  min-width: 0;
  padding: clamp(15px, 2.3vw, 29px);
  border: 0;
  border-right: 1px solid #173C3845;
  border-bottom: 1px solid #173C3845;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}
.th-p-kayaks .kayak-current-products .pc .im { border-radius: 0; background: #DDE0D6; }
.th-p-kayaks .kayak-current-products .pc .bd { padding-top: 16px; }
.th-p-kayaks .kayak-current-products .pc h3 { font-family: var(--display); font-weight: 400; letter-spacing: -.035em; }
.th-p-kayaks .kayak-current-products .pc .pr { color: var(--kayak-orange); font-weight: 800; }
.th-p-kayaks #shop { padding-top: clamp(54px, 7vw, 104px); background: var(--kayak-foam); }
.th-p-kayaks #shop .sec-h { padding-bottom: 19px; border-bottom: 1px solid #173C3834; }
.th-p-kayaks #shop .sec-h h2 { font: 400 clamp(41px, 5vw, 74px)/.9 var(--display); letter-spacing: -.05em; }
.th-p-kayaks #shop .chips { gap: 8px; }
.th-p-kayaks #shop .chip {
  min-height: 44px;
  border: 1px solid #173C383D;
  border-radius: 999px;
  color: var(--kayak-ink);
  background: transparent;
  font: 800 9px/1 var(--body);
  letter-spacing: .12em;
  text-transform: uppercase;
}
.th-p-kayaks #shop .chip:hover { border-color: var(--kayak-orange); background: var(--kayak-orange); color: #FFF8EE; }
.th-p-kayaks #shop .grid { gap: clamp(25px, 3vw, 42px) 15px; }
.th-p-kayaks #shop .pc { border-radius: 0; box-shadow: none; }
.th-p-kayaks #shop .pc .im { border-radius: 5px; background: #DDE0D6; }
.th-p-kayaks #shop .pc .bd h3 { font-family: var(--display); font-weight: 400; letter-spacing: -.025em; }
.th-p-kayaks #shop .pc .pr { color: var(--kayak-orange); font-weight: 800; }
.th-p-kayaks .ft { background: var(--kayak-ink); color: var(--kayak-foam); }
.th-p-kayaks .ft :is(a, p, span, h4) { color: var(--kayak-foam); }
.th-p-kayaks .ft .brand { font-family: var(--display); font-weight: 400; letter-spacing: -.04em; }
.th-p-kayaks .kayak-hero.has-hero-motion[data-hero-motion="pan"] .kayak-hero__image .hero-media { animation: kayaks-pan 17s ease-in-out infinite alternate; }
.th-p-kayaks .kayak-hero.has-hero-motion[data-hero-motion="drift"] .kayak-hero__image .hero-media { animation: kayaks-drift 15s ease-in-out infinite alternate; }
@keyframes kayaks-pan {
  from { transform: scale(1.035) translate3d(-1.1%, 0, 0); }
  to { transform: scale(1.09) translate3d(1%, -1.1%, 0); }
}
@keyframes kayaks-drift {
  from { transform: scale(1.04) translate3d(0, 0, 0); }
  to { transform: scale(1.08) translate3d(-.8%, -1.2%, 0); }
}
@media (max-width: 900px) {
  .th-p-kayaks .kayak-hero { min-height: 640px; }
  .th-p-kayaks .kayak-hero__copy-wrap { width: min(100% - 112px, 820px); }
  .th-p-kayaks .kayak-hero__copy { max-width: 74%; }
  .th-p-kayaks .kayak-discovery__intro { grid-template-columns: minmax(0, 1fr) minmax(150px, .55fr); }
  .th-p-kayaks .kayak-index { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .th-p-kayaks .kayak-index-card { min-height: 370px; }
}
@media (max-width: 620px) {
  .th-p-kayaks .hd .wrap { min-height: 60px; }
  .th-p-kayaks .hd .nav { display: none; }
  .th-p-kayaks .kayak-hero { min-height: 610px; }
  .th-p-kayaks .kayak-hero__image .hero-media { object-position: 57% center; }
  .th-p-kayaks .kayak-hero__tint { background: linear-gradient(0deg, #102A27F2 0%, #102A2795 44%, #102A2715 88%); }
  .th-p-kayaks .kayak-hero__edge { right: 18px; left: 18px; }
  .th-p-kayaks .kayak-hero__edge--top { top: 18px; }
  .th-p-kayaks .kayak-hero__margin-note { display: none; }
  .th-p-kayaks .kayak-hero__copy-wrap { width: min(100% - 40px, 490px); padding-top: 126px; padding-bottom: 95px; }
  .th-p-kayaks .kayak-hero__copy { max-width: 100%; }
  .th-p-kayaks .kayak-hero__copy h1,
  .th-p-kayaks .kayak-hero__copy h1.long { max-width: 8.8ch; font-size: clamp(54px, 16vw, 78px); line-height: .82; }
  .th-p-kayaks .kayak-hero__copy .sub { max-width: 31ch; margin-top: 18px; }
  .th-p-kayaks .kayak-hero__copy .ctas { margin-top: 22px; }
  .th-p-kayaks .kayak-hero__launch-note { right: 20px; bottom: 25px; gap: 8px; font-size: 8px; }
  .th-p-kayaks .kayak-hero .motion-toggle { top: 31px; right: 19px; min-width: 44px; padding: 0 9px; font-size: 8px; }
  .th-p-kayaks .kayak-discovery { padding-right: 20px; padding-left: 20px; }
  .th-p-kayaks .kayak-discovery__top { grid-template-columns: 1fr; gap: 16px; }
  .th-p-kayaks .kayak-discovery__folio { margin: 0; }
  .th-p-kayaks .kayak-discovery__intro { display: block; }
  .th-p-kayaks .kayak-discovery__eyebrow { margin-bottom: 10px; }
  .th-p-kayaks .kayak-discovery__intro h2 { max-width: 9.6ch; font-size: clamp(46px, 13vw, 63px); }
  .th-p-kayaks .kayak-discovery__intro > p:last-child { margin-top: 18px; }
  .th-p-kayaks .kayak-discovery__water-rule { margin-top: 33px; margin-bottom: 18px; }
  .th-p-kayaks .kayak-index { grid-template-columns: 1fr; }
  .th-p-kayaks .kayak-index-card { min-height: 330px; }
  .th-p-kayaks .kayak-index-card__number { margin-bottom: 45px; }
  .th-p-kayaks .kayak-current-products { grid-template-columns: 1fr; }
  .th-p-kayaks .kayak-current-products .pc { padding: 17px; }
  .th-p-kayaks #shop .sec-h h2 { font-size: 48px; }
}
@media (max-width: 390px) {
  .th-p-kayaks .kayak-hero__copy .ctas { display: grid; grid-template-columns: 1fr; }
  .th-p-kayaks .kayak-hero__copy .btn { width: 100%; }
  .th-p-kayaks .kayak-hero__launch-note span:last-child { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .th-p-kayaks .kayak-hero.has-hero-motion .kayak-hero__image .hero-media { animation: none; transform: none; }
  .th-p-kayaks .kayak-index-card__media img { transition: none; }
}
`;

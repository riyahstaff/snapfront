import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-portable-power-stations',
  name: 'NIGHT CURRENT',
  for: 'Portable power stations for off-grid departures and flexible camp setups',
  vibe: 'Blue-hour field ledger, graphite hardware, warm practical light, and calm directional wayfinding',
  category: 'Portable power stations',
  group: 'outdoor',
  display: 'Space Grotesk',
  body: 'DM Mono',
  displayWeight: 700,
  tracking: '-.065em',
  colors: {
    bg: '#E7E3D9',
    surface: '#F5F2EA',
    ink: '#18242B',
    muted: '#667076',
    line: '#B6BBB7',
    accent: '#E76432',
    onAccent: '#FFF8F0',
    panel: '#172A34',
    onPanel: '#F4F0E7',
    foot: '#101A20',
    onFoot: '#F2EEE4',
    bar: '#294658',
    onBar: '#F6F2E9',
    badge: '#F0BF67',
    onBadge: '#18242B',
  },
  header: 'split',
  hero: 'spotlight',
  card: 'boxed',
  ratio: '4/5',
  rCard: 0,
  rBtn: 0,
  motion: 'pan',
  copy: {
    eyebrow: 'Portable power for the open hours',
    collection: 'Choose a load path',
    cta: 'See power stations',
    title: 'Keep the quiet going.',
    subtitle: 'Portable power for the hours that happen beyond the outlet.',
  },
});

const countLabel = (count) => {
  const value = Number(count) || 0;
  return `${value} ${value === 1 ? 'item' : 'items'} available`;
};

function routeArt(ctx, category) {
  if (category.image) {
    return `<img src="${ctx.esc(category.image)}" alt="" loading="lazy" decoding="async">`;
  }
  return `<span class="pps-route__blank" aria-hidden="true"><i></i><i></i><i></i></span>`;
}

function routeCard(ctx, category, index) {
  const number = String(index + 1).padStart(2, '0');
  return `<a class="pps-route" href="${ctx.esc(ctx.categoryLink(category.name))}">
    <span class="pps-route__number">${number}</span>
    <span class="pps-route__art">${routeArt(ctx, category)}</span>
    <span class="pps-route__copy">
      <span class="pps-route__name">${ctx.esc(category.name)}</span>
      <span class="pps-route__count">${countLabel(category.count)}</span>
    </span>
    <span class="pps-route__arrow" aria-hidden="true">↗</span>
  </a>`;
}

export function hero(ctx) {
  return `<section class="hero category-hero pps-hero${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="pps-hero__scene">${ctx.media(0, { priority: true, lazy: false, decorative: true })}</div>
    <div class="pps-hero__shade" aria-hidden="true"></div>
    <div class="pps-hero__measure" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
    <div class="pps-hero__fieldmark" aria-hidden="true"><span>FIELD</span><b>01</b><span>AFTER</span><span>DARK</span></div>
    <p class="pps-hero__caption" aria-hidden="true"><span>Mobile energy</span><span>for the open hours</span></p>
    <div class="pps-hero__deck">${ctx.copy('pps-hero__copy')}</div>
    <div class="pps-hero__readout" aria-hidden="true"><span>${ctx.esc(ctx.t.copy.collection)}</span><b></b><span>Start where you are</span></div>
    <div class="pps-hero__motion">${ctx.controls}</div>
  </section>`;
}

export function discovery(ctx) {
  const categories = (ctx.cats || []).filter((category) => category?.name).slice(0, 4);
  const products = (ctx.products || []).slice(0, 3);

  if (categories.length >= 2) {
    return `<section class="theme-discovery pps-switchyard" aria-labelledby="pps-switchyard-title">
      <header class="pps-switchyard__head">
        <p class="pps-switchyard__eyebrow">${ctx.esc(ctx.t.copy.collection)}</p>
        <h2 id="pps-switchyard-title">Set out with a clearer current.</h2>
        <p class="pps-switchyard__note">Browse the live collection by the route that makes sense for today.</p>
      </header>
      <div class="pps-switchyard__rule" aria-hidden="true"><span></span><b></b><span></span></div>
      <div class="pps-route-list">${categories.map((category, index) => routeCard(ctx, category, index)).join('')}</div>
      <a class="pps-switchyard__all" href="#shop"><span>View every available station</span><b aria-hidden="true">→</b></a>
    </section>`;
  }

  if (products.length >= 2) {
    return `<section class="theme-discovery pps-shelf" aria-labelledby="pps-shelf-title">
      <header class="pps-shelf__head">
        <p>${ctx.esc(ctx.t.copy.collection)}</p>
        <h2 id="pps-shelf-title">Ready for the next turn.</h2>
        <a href="#shop">See all available items <span aria-hidden="true">→</span></a>
      </header>
      <div class="pps-shelf__products">${products.map((product) => ctx.productCard(product)).join('')}</div>
    </section>`;
  }

  return '';
}

export const css = `
.th-p-portable-power-stations {
  --pps-ash: #e7e3d9;
  --pps-paper: #f5f2ea;
  --pps-ink: #18242b;
  --pps-night: #101a20;
  --pps-slate: #294658;
  --pps-orange: #e76432;
  --pps-gold: #f0bf67;
  background: var(--pps-ash);
  color: var(--pps-ink);
}
.th-p-portable-power-stations .hd {
  border-bottom-color: #b6bbb755;
  background: #e7e3d9f2;
}
.th-p-portable-power-stations .hd :is(.brand, .nav a, .cart) { color: var(--pps-ink); }
.th-p-portable-power-stations .hd .nav a:hover { color: var(--pps-orange); }
.th-p-portable-power-stations .pps-hero {
  position: relative;
  isolation: isolate;
  min-height: clamp(650px, 62vw, 865px);
  overflow: hidden;
  display: grid;
  align-items: end;
  background: var(--pps-night);
  color: var(--pps-paper);
}
.th-p-portable-power-stations .pps-hero__scene {
  position: absolute;
  z-index: -4;
  inset: 0;
  overflow: hidden;
  background: linear-gradient(135deg, #132a39 0%, #65737a 50%, #2b3e49 100%);
}
.th-p-portable-power-stations .pps-hero__scene .hero-media {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
}
.th-p-portable-power-stations .pps-hero__scene .theme-empty-media {
  width: 100%;
  height: 100%;
  min-height: 100%;
  color: #f5f2ea;
  background:
    radial-gradient(circle at 81% 68%, #f0bf6750 0 2%, transparent 18%),
    linear-gradient(118deg, #0e1c28 0%, #2f5563 48%, #171f26 100%);
}
.th-p-portable-power-stations .pps-hero__shade {
  position: absolute;
  z-index: -3;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(180deg, #07131b70 0%, transparent 28%, #07131b12 48%, #08141ddd 100%),
    linear-gradient(90deg, #0a1922a8 0%, #0a19222b 42%, transparent 68%);
}
.th-p-portable-power-stations .pps-hero__measure {
  position: absolute;
  z-index: 1;
  top: 0;
  right: clamp(22px, 4.5vw, 74px);
  display: flex;
  align-items: flex-start;
  gap: clamp(7px, 1vw, 16px);
  height: clamp(180px, 25vw, 330px);
  pointer-events: none;
}
.th-p-portable-power-stations .pps-hero__measure i {
  display: block;
  width: 1px;
  background: #f5f2eaab;
}
.th-p-portable-power-stations .pps-hero__measure i:nth-child(1) { height: 18%; }
.th-p-portable-power-stations .pps-hero__measure i:nth-child(2) { height: 42%; }
.th-p-portable-power-stations .pps-hero__measure i:nth-child(3) { height: 71%; }
.th-p-portable-power-stations .pps-hero__measure i:nth-child(4) { height: 34%; }
.th-p-portable-power-stations .pps-hero__measure i:nth-child(5) { height: 88%; }
.th-p-portable-power-stations .pps-hero__fieldmark {
  position: absolute;
  z-index: 2;
  top: clamp(25px, 4vw, 58px);
  left: clamp(22px, 4.5vw, 74px);
  display: grid;
  grid-template-columns: auto auto;
  gap: 3px 8px;
  align-items: baseline;
  color: #f5f2ead9;
  font: 500 9px/1 var(--body);
  letter-spacing: .18em;
}
.th-p-portable-power-stations .pps-hero__fieldmark b {
  grid-row: span 2;
  grid-column: 2;
  color: var(--pps-gold);
  font: var(--dw) clamp(47px, 5.4vw, 80px)/.75 var(--display);
  letter-spacing: var(--dt);
}
.th-p-portable-power-stations .pps-hero__caption {
  position: absolute;
  z-index: 2;
  top: clamp(108px, 13vw, 192px);
  left: clamp(22px, 4.5vw, 74px);
  display: grid;
  gap: 4px;
  margin: 0;
  color: #f5f2eacc;
  font: 500 9px/1.3 var(--body);
  letter-spacing: .14em;
  text-transform: uppercase;
}
.th-p-portable-power-stations .pps-hero__caption::before {
  width: 25px;
  height: 1px;
  margin-bottom: 8px;
  content: '';
  background: var(--pps-gold);
}
.th-p-portable-power-stations .pps-hero__deck {
  position: relative;
  z-index: 2;
  width: min(100% - clamp(44px, 9vw, 148px), 1090px);
  margin: 0 auto clamp(75px, 8vw, 125px);
  padding: clamp(29px, 3.3vw, 52px) clamp(26px, 4.2vw, 70px) clamp(31px, 3.7vw, 57px);
  border: 1px solid #f5f2ea8c;
  border-bottom: 6px solid var(--pps-gold);
  color: var(--pps-ink);
  background: #f5f2eaf2;
  clip-path: polygon(0 0, 91% 0, 100% 17%, 100% 100%, 8% 100%, 0 83%);
}
.th-p-portable-power-stations .pps-hero__copy {
  display: grid;
  grid-template-columns: minmax(150px, .48fr) minmax(0, 1.52fr);
  column-gap: clamp(22px, 4vw, 72px);
  align-items: end;
}
.th-p-portable-power-stations .pps-hero__copy .eyebrow {
  grid-column: 1;
  align-self: start;
  max-width: 16ch;
  margin: 8px 0 0;
  color: var(--pps-orange);
  font: 500 10px/1.45 var(--body);
  letter-spacing: .14em;
  text-transform: uppercase;
}
.th-p-portable-power-stations .pps-hero__copy h1 {
  grid-column: 2;
  max-width: 12ch;
  margin: 0;
  color: var(--pps-ink);
  font: var(--dw) clamp(49px, 7.2vw, 112px)/.83 var(--display);
  letter-spacing: var(--dt);
  text-wrap: balance;
}
.th-p-portable-power-stations .pps-hero__copy h1.long {
  max-width: 15ch;
  font-size: clamp(41px, 5.2vw, 82px);
  line-height: .9;
}
.th-p-portable-power-stations .pps-hero__copy .sub {
  grid-column: 2;
  max-width: 50ch;
  margin: 20px 0 0;
  color: #3b4b51;
  font: 500 clamp(13px, 1.2vw, 16px)/1.58 var(--body);
}
.th-p-portable-power-stations .pps-hero__copy .ctas {
  grid-column: 2;
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 23px;
}
.th-p-portable-power-stations .pps-hero__copy .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  padding: 0 18px;
  border: 1px solid var(--pps-ink);
  border-radius: 0;
  color: var(--pps-paper);
  background: var(--pps-ink);
  font: 500 10px/1 var(--body);
  letter-spacing: .08em;
  text-decoration: none;
  text-transform: uppercase;
  transition: background-color .2s ease, border-color .2s ease, color .2s ease;
}
.th-p-portable-power-stations .pps-hero__copy .btn:hover {
  border-color: var(--pps-orange);
  color: #fff8f0;
  background: var(--pps-orange);
}
.th-p-portable-power-stations .pps-hero__copy .btn.ghost {
  color: var(--pps-ink);
  background: transparent;
}
.th-p-portable-power-stations .pps-hero__copy .btn.ghost:hover {
  border-color: var(--pps-ink);
  color: var(--pps-paper);
  background: var(--pps-ink);
}
.th-p-portable-power-stations .pps-hero__readout {
  position: absolute;
  z-index: 2;
  right: clamp(22px, 4.5vw, 74px);
  bottom: 22px;
  left: clamp(22px, 4.5vw, 74px);
  display: grid;
  grid-template-columns: auto minmax(25px, 1fr) auto;
  gap: 12px;
  align-items: center;
  color: #f5f2ead4;
  font: 500 9px/1.25 var(--body);
  letter-spacing: .14em;
  text-transform: uppercase;
}
.th-p-portable-power-stations .pps-hero__readout b { height: 1px; background: #f5f2ea78; }
.th-p-portable-power-stations .pps-hero__motion {
  position: absolute;
  z-index: 3;
  right: clamp(17px, 2vw, 32px);
  top: clamp(88px, 10vw, 142px);
}
.th-p-portable-power-stations .pps-hero__motion .motion-toggle {
  min-height: 44px;
  padding: 0 12px;
  border: 1px solid #f5f2ea8c;
  border-radius: 0;
  color: #f5f2ea;
  background: #152730b8;
  font: 500 9px/1 var(--body);
  letter-spacing: .11em;
  text-transform: uppercase;
}
.th-p-portable-power-stations .pps-hero__motion .motion-toggle:hover { color: var(--pps-ink); background: var(--pps-paper); }
.th-p-portable-power-stations .pps-hero.has-hero-motion[data-hero-motion="pan"] .pps-hero__scene .hero-media { animation: portable-power-stations-pan 18s ease-in-out infinite alternate; }
.th-p-portable-power-stations .pps-hero.has-hero-motion[data-hero-motion="drift"] .pps-hero__scene .hero-media { animation: portable-power-stations-drift 15s ease-in-out infinite alternate; }
@keyframes portable-power-stations-pan { from { transform: scale(1.025) translate3d(-.8%, 0, 0); } to { transform: scale(1.08) translate3d(1%, -.3%, 0); } }
@keyframes portable-power-stations-drift { from { transform: scale(1.035) translate3d(-.45%, -.3%, 0); } to { transform: scale(1.075) translate3d(.55%, .25%, 0); } }
.th-p-portable-power-stations .pps-switchyard,
.th-p-portable-power-stations .pps-shelf {
  width: min(100%, 1660px);
  margin: 0 auto;
  padding: clamp(66px, 9vw, 135px) clamp(22px, 6vw, 96px);
  background: var(--pps-ash);
}
.th-p-portable-power-stations .pps-switchyard__head {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(190px, .5fr);
  column-gap: clamp(35px, 8vw, 150px);
  align-items: end;
}
.th-p-portable-power-stations .pps-switchyard__eyebrow {
  grid-column: 1 / -1;
  margin: 0 0 17px;
  color: var(--pps-orange);
  font: 500 10px/1.2 var(--body);
  letter-spacing: .17em;
  text-transform: uppercase;
}
.th-p-portable-power-stations .pps-switchyard__head h2,
.th-p-portable-power-stations .pps-shelf__head h2 {
  max-width: 12ch;
  margin: 0;
  color: var(--pps-ink);
  font: var(--dw) clamp(41px, 5.4vw, 82px)/.9 var(--display);
  letter-spacing: var(--dt);
  text-wrap: balance;
}
.th-p-portable-power-stations .pps-switchyard__note {
  max-width: 31ch;
  margin: 0 0 4px;
  color: var(--muted);
  font: 500 14px/1.6 var(--body);
}
.th-p-portable-power-stations .pps-switchyard__rule {
  display: grid;
  grid-template-columns: 1fr 10px 1fr;
  gap: 9px;
  align-items: center;
  margin: clamp(35px, 5vw, 69px) 0 0;
}
.th-p-portable-power-stations .pps-switchyard__rule span { height: 1px; background: var(--pps-ink); }
.th-p-portable-power-stations .pps-switchyard__rule b { width: 10px; height: 10px; border-radius: 50%; background: var(--pps-orange); }
.th-p-portable-power-stations .pps-route-list { border-top: 1px solid #18242b; }
.th-p-portable-power-stations .pps-route {
  display: grid;
  grid-template-columns: minmax(38px, .38fr) minmax(112px, .82fr) minmax(0, 2.2fr) 36px;
  gap: clamp(14px, 2vw, 32px);
  align-items: center;
  min-height: clamp(132px, 12vw, 178px);
  padding: 13px 0;
  border-bottom: 1px solid #18242b55;
  color: var(--pps-ink);
  text-decoration: none;
  transition: background-color .2s ease, color .2s ease;
}
.th-p-portable-power-stations .pps-route:hover { color: var(--pps-paper); background: var(--pps-slate); }
.th-p-portable-power-stations .pps-route__number {
  padding-left: clamp(3px, .8vw, 12px);
  color: var(--pps-orange);
  font: 500 10px/1 var(--body);
  letter-spacing: .13em;
}
.th-p-portable-power-stations .pps-route:hover .pps-route__number { color: var(--pps-gold); }
.th-p-portable-power-stations .pps-route__art {
  position: relative;
  align-self: stretch;
  min-height: 102px;
  overflow: hidden;
  background: #c4cac3;
}
.th-p-portable-power-stations .pps-route__art img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(.78) contrast(1.03);
}
.th-p-portable-power-stations .pps-route__blank {
  display: flex;
  align-items: end;
  gap: 8%;
  width: 100%;
  height: 100%;
  padding: 18%;
  background: linear-gradient(145deg, #2b4a5b 0 43%, #e76432 43% 45%, #d9c892 45% 100%);
}
.th-p-portable-power-stations .pps-route__blank i { display: block; flex: 1; background: #f5f2eab8; }
.th-p-portable-power-stations .pps-route__blank i:nth-child(1) { height: 38%; }
.th-p-portable-power-stations .pps-route__blank i:nth-child(2) { height: 81%; }
.th-p-portable-power-stations .pps-route__blank i:nth-child(3) { height: 57%; }
.th-p-portable-power-stations .pps-route__copy { display: grid; gap: 9px; min-width: 0; }
.th-p-portable-power-stations .pps-route__name {
  overflow-wrap: anywhere;
  font: var(--dw) clamp(25px, 3.1vw, 48px)/.92 var(--display);
  letter-spacing: var(--dt);
}
.th-p-portable-power-stations .pps-route__count {
  color: var(--muted);
  font: 500 10px/1.35 var(--body);
  letter-spacing: .09em;
  text-transform: uppercase;
}
.th-p-portable-power-stations .pps-route:hover .pps-route__count { color: #f5f2eacc; }
.th-p-portable-power-stations .pps-route__arrow {
  display: grid;
  place-items: center;
  width: 35px;
  height: 35px;
  border: 1px solid currentColor;
  border-radius: 50%;
  font: 400 20px/1 var(--body);
}
.th-p-portable-power-stations .pps-switchyard__all {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  min-height: 60px;
  margin-top: 28px;
  padding: 0 3px;
  border-bottom: 1px solid var(--pps-ink);
  color: var(--pps-ink);
  font: 500 clamp(14px, 1.35vw, 18px)/1.2 var(--body);
  letter-spacing: .02em;
  text-decoration: none;
}
.th-p-portable-power-stations .pps-switchyard__all:hover { color: var(--pps-orange); border-bottom-color: var(--pps-orange); }
.th-p-portable-power-stations .pps-switchyard__all b { font: 400 27px/1 var(--body); }
.th-p-portable-power-stations .pps-shelf { background: var(--pps-paper); }
.th-p-portable-power-stations .pps-shelf__head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  column-gap: 30px;
  row-gap: 15px;
  align-items: end;
  padding-bottom: 29px;
  border-bottom: 1px solid #18242b55;
}
.th-p-portable-power-stations .pps-shelf__head p {
  grid-column: 1 / -1;
  margin: 0;
  color: var(--pps-orange);
  font: 500 10px/1.2 var(--body);
  letter-spacing: .16em;
  text-transform: uppercase;
}
.th-p-portable-power-stations .pps-shelf__head a {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  min-height: 44px;
  color: var(--pps-ink);
  font: 500 11px/1.3 var(--body);
  text-decoration: none;
}
.th-p-portable-power-stations .pps-shelf__head a:hover { color: var(--pps-orange); }
.th-p-portable-power-stations .pps-shelf__head a span { font-size: 19px; }
.th-p-portable-power-stations .pps-shelf__products {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(13px, 2vw, 28px);
  padding-top: clamp(27px, 4vw, 54px);
}
.th-p-portable-power-stations .pps-shelf__products :is(.pc, .product-card) {
  overflow: hidden;
  border: 1px solid #18242b42;
  border-radius: 0;
  background: #fbf9f2;
  box-shadow: none;
}
.th-p-portable-power-stations .pps-shelf__products :is(.pc, .product-card) .im { overflow: hidden; border-radius: 0; background: #dce0da; }
.th-p-portable-power-stations .pps-shelf__products :is(.pc, .product-card) .bd { padding: 17px; }
.th-p-portable-power-stations .pps-shelf__products :is(.pc, .product-card) .pr { color: var(--pps-orange); font-weight: 500; }
.th-p-portable-power-stations #shop { padding-top: clamp(60px, 8vw, 120px); background: var(--pps-paper); }
.th-p-portable-power-stations #shop .sec-h { padding-bottom: 22px; border-bottom: 1px solid #18242b55; }
.th-p-portable-power-stations #shop .sec-h h2 { font: var(--dw) clamp(39px, 4.7vw, 72px)/.9 var(--display); letter-spacing: var(--dt); }
.th-p-portable-power-stations #shop .chips { gap: 8px; }
.th-p-portable-power-stations #shop .chip {
  min-height: 44px;
  border-radius: 0;
  font: 500 10px/1 var(--body);
  letter-spacing: .07em;
  text-transform: uppercase;
}
.th-p-portable-power-stations #shop .grid { gap: 28px 16px; }
.th-p-portable-power-stations #shop .pc { border-top: 1px solid #18242b55; padding-top: 13px; }
.th-p-portable-power-stations #shop .pc .im { border-radius: 0; background: #dce0da; }
.th-p-portable-power-stations #shop .pc .bd h3 { font-family: var(--body); font-weight: 500; letter-spacing: -.03em; }
.th-p-portable-power-stations #shop .pc .pr { color: var(--pps-orange); font-weight: 500; }
.th-p-portable-power-stations .ft { color: var(--pps-paper); background: var(--pps-night); }
.th-p-portable-power-stations .ft :is(a, p, span) { color: var(--pps-paper); }
.th-p-portable-power-stations .ft h4 { color: var(--pps-gold); }
.th-p-portable-power-stations :is(.pps-hero__copy .btn, .pps-route, .pps-switchyard__all, .pps-shelf__head a):focus-visible { outline: 3px solid var(--pps-orange); outline-offset: 4px; }
@media (max-width: 820px) {
  .th-p-portable-power-stations .pps-hero { min-height: 760px; }
  .th-p-portable-power-stations .pps-hero__deck { width: min(100% - 44px, 700px); margin-bottom: 102px; }
  .th-p-portable-power-stations .pps-hero__copy { grid-template-columns: 1fr; gap: 14px; }
  .th-p-portable-power-stations .pps-hero__copy :is(.eyebrow, h1, .sub, .ctas) { grid-column: 1; }
  .th-p-portable-power-stations .pps-hero__copy .eyebrow { margin: 0; max-width: none; }
  .th-p-portable-power-stations .pps-hero__copy h1 { max-width: 12ch; }
  .th-p-portable-power-stations .pps-switchyard__head { grid-template-columns: 1fr; gap: 16px; }
  .th-p-portable-power-stations .pps-switchyard__note { margin: 0; }
  .th-p-portable-power-stations .pps-route { grid-template-columns: 42px minmax(102px, .7fr) minmax(0, 1.6fr) 36px; }
  .th-p-portable-power-stations .pps-shelf__products { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 560px) {
  .th-p-portable-power-stations .pps-hero { min-height: 740px; }
  .th-p-portable-power-stations .pps-hero__scene .hero-media { object-position: 63% center; }
  .th-p-portable-power-stations .pps-hero__shade { background: linear-gradient(180deg, #07131b6e 0%, transparent 26%, #08141bea 67%, #08141bf5 100%); }
  .th-p-portable-power-stations .pps-hero__measure { right: 20px; height: 165px; gap: 8px; }
  .th-p-portable-power-stations .pps-hero__fieldmark { top: 23px; left: 19px; }
  .th-p-portable-power-stations .pps-hero__caption { top: 104px; left: 19px; font-size: 8px; }
  .th-p-portable-power-stations .pps-hero__motion { top: 82px; right: 13px; }
  .th-p-portable-power-stations .pps-hero__motion .motion-toggle { min-width: 44px; padding: 0 9px; font-size: 8px; }
  .th-p-portable-power-stations .pps-hero__deck { width: calc(100% - 32px); margin-bottom: 89px; padding: 25px 20px 28px; clip-path: polygon(0 0, 91% 0, 100% 9%, 100% 100%, 5% 100%, 0 93%); }
  .th-p-portable-power-stations .pps-hero__copy h1,
  .th-p-portable-power-stations .pps-hero__copy h1.long { max-width: 12ch; font-size: clamp(43px, 12.3vw, 59px); line-height: .86; }
  .th-p-portable-power-stations .pps-hero__copy .sub { margin-top: 16px; font-size: 13px; }
  .th-p-portable-power-stations .pps-hero__copy .ctas { display: grid; grid-template-columns: 1fr; margin-top: 19px; }
  .th-p-portable-power-stations .pps-hero__copy .btn { width: 100%; }
  .th-p-portable-power-stations .pps-hero__readout { right: 18px; bottom: 18px; left: 18px; grid-template-columns: auto 1fr; font-size: 8px; }
  .th-p-portable-power-stations .pps-hero__readout span:last-child { display: none; }
  .th-p-portable-power-stations .pps-switchyard,
  .th-p-portable-power-stations .pps-shelf { padding: 61px 18px; }
  .th-p-portable-power-stations .pps-switchyard__head h2,
  .th-p-portable-power-stations .pps-shelf__head h2 { font-size: clamp(37px, 10.5vw, 51px); }
  .th-p-portable-power-stations .pps-switchyard__rule { margin-top: 31px; }
  .th-p-portable-power-stations .pps-route { grid-template-columns: 32px 80px minmax(0, 1fr) 31px; gap: 10px; min-height: 112px; }
  .th-p-portable-power-stations .pps-route__art { min-height: 84px; }
  .th-p-portable-power-stations .pps-route__name { font-size: clamp(20px, 6vw, 27px); }
  .th-p-portable-power-stations .pps-route__count { font-size: 8px; letter-spacing: .06em; }
  .th-p-portable-power-stations .pps-route__arrow { width: 29px; height: 29px; font-size: 16px; }
  .th-p-portable-power-stations .pps-shelf__head { grid-template-columns: 1fr; gap: 16px; }
  .th-p-portable-power-stations .pps-shelf__head a { justify-self: start; }
  .th-p-portable-power-stations .pps-shelf__products { grid-template-columns: 1fr; }
  .th-p-portable-power-stations #shop { padding-top: 62px; }
}
@media (prefers-reduced-motion: reduce) {
  .th-p-portable-power-stations .pps-hero.has-hero-motion .pps-hero__scene .hero-media { animation: none; transform: none; }
  .th-p-portable-power-stations :is(.pps-hero__copy .btn, .pps-route, .pps-switchyard__all) { transition: none; }
}
`;

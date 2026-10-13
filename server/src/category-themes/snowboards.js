import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-snowboards',
  name: 'DRIFT INDEX',
  for: 'Riders following a cleaner line through winter',
  vibe: 'Alpine editorial, cartographic carve lines, cold field notes and signal red',
  category: 'Snowboards and mountain riding gear',
  group: 'outdoor',
  display: 'Bebas Neue',
  body: 'Manrope',
  displayWeight: 400,
  tracking: '.015em',
  colors: {
    bg: '#F4F6F2', surface: '#FFFFFF', ink: '#102D34', muted: '#587078', line: '#C9D6D6',
    accent: '#E4472F', onAccent: '#FFFFFF', panel: '#12353B', onPanel: '#F3F7F5',
    foot: '#0A2025', onFoot: '#EAF2EE', bar: '#DCE8E8', onBar: '#102D34',
    badge: '#F0C84B', onBadge: '#102D34',
  },
  header: 'stack',
  hero: 'editorial',
  card: 'bold',
  ratio: '4/5',
  rCard: 0,
  rBtn: 999,
  motion: 'pan',
  copy: {
    eyebrow: 'A field guide to fresh lines',
    collection: 'Choose a line',
    cta: 'Shop the line',
    title: 'Make a turn worth keeping.',
    subtitle: 'Boards and winter layers for the days you follow the fall line.',
  },
});

const plurality = (count, singular, plural) => `${count} ${count === 1 ? singular : plural}`;

function categoryImage(ctx, category) {
  if (category.image) {
    return `<img src="${ctx.esc(category.image)}" alt="" loading="lazy" decoding="async">`;
  }
  return `<div class="snowboard-gate__empty" aria-hidden="true"><span></span><i></i><b></b></div>`;
}

function categoryGate(ctx, category, index) {
  const count = Number(category.count) || 0;
  const number = String(index + 1).padStart(2, '0');
  return `<a class="snowboard-gate snowboard-gate--${index + 1}" href="${ctx.esc(ctx.categoryLink(category.name))}">
    <div class="snowboard-gate__media">${categoryImage(ctx, category)}</div>
    <div class="snowboard-gate__veil" aria-hidden="true"></div>
    <div class="snowboard-gate__num" aria-hidden="true">${number}</div>
    <div class="snowboard-gate__content">
      <p>Open this gate</p>
      <h3>${ctx.esc(category.name)}</h3>
      <span>${plurality(count, 'piece in the line', 'pieces in the line')} <i aria-hidden="true">↗</i></span>
    </div>
  </a>`;
}

export function hero(ctx) {
  return `<section class="hero category-hero snowboard-hero${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="snowboard-hero__photo">${ctx.media(0, { priority: true, lazy: false })}</div>
    <div class="snowboard-hero__wash" aria-hidden="true"></div>
    <div class="snowboard-hero__contours" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
    <div class="snowboard-hero__marker snowboard-hero__marker--top" aria-hidden="true"><span>Index</span><b>01 / 04</b></div>
    <div class="snowboard-hero__marker snowboard-hero__marker--side" aria-hidden="true"><span>Fall line</span><b>North face</b></div>
    <div class="snowboard-hero__copy-wrap">${ctx.copy('snowboard-hero__copy')}</div>
    <div class="snowboard-hero__legend" aria-hidden="true">
      <span><i></i>Read the slope</span>
      <span><i></i>Set your edge</span>
      <span><i></i>Follow through</span>
    </div>
    ${ctx.controls}
  </section>`;
}

export function discovery(ctx) {
  const categories = (ctx.cats || []).filter((category) => category?.name).slice(0, 3);
  if (categories.length >= 2) {
    return `<section class="theme-discovery snowboard-discovery" aria-labelledby="snowboard-discovery-title">
      <div class="snowboard-discovery__head">
        <p class="snowboard-discovery__kicker">The terrain edit</p>
        <div>
          <h2 id="snowboard-discovery-title">Choose the shape of your day.</h2>
          <p>Begin with the collection that feels closest to your next turn.</p>
        </div>
        <span class="snowboard-discovery__coordinate" aria-hidden="true">46° / 12′ / 08″</span>
      </div>
      <div class="snowboard-discovery__gates">${categories.map((category, index) => categoryGate(ctx, category, index)).join('')}</div>
    </section>`;
  }

  const products = (ctx.products || []).slice(0, 3);
  if (products.length >= 2) {
    return `<section class="theme-discovery snowboard-discovery snowboard-discovery--products" aria-labelledby="snowboard-discovery-title">
      <div class="snowboard-discovery__head">
        <p class="snowboard-discovery__kicker">Current line</p>
        <div>
          <h2 id="snowboard-discovery-title">A few ways into the mountain.</h2>
          <p>Start with what is available now, then take the line from there.</p>
        </div>
        <span class="snowboard-discovery__coordinate" aria-hidden="true">Open / now</span>
      </div>
      <div class="snowboard-discovery__products">${products.map((product, index) => `<div class="snowboard-discovery__product snowboard-discovery__product--${index + 1}">${ctx.productCard(product)}</div>`).join('')}</div>
    </section>`;
  }

  return '';
}

export const css = `
.th-p-snowboards {
  --snow-ice: #f4f6f2;
  --snow-paper: #ffffff;
  --snow-ink: #102d34;
  --snow-pine: #12353b;
  --snow-signal: #e4472f;
  --snow-glow: #f0c84b;
}
.th-p-snowboards .hd {
  background: var(--snow-ice);
  border-bottom-color: #102d341c;
}
.th-p-snowboards .hd :is(.brand, .nav a, .cart) { color: var(--snow-ink); }
.th-p-snowboards .hd .nav a:hover { color: var(--snow-signal); }
.th-p-snowboards .snowboard-hero {
  position: relative;
  isolation: isolate;
  display: grid;
  align-items: end;
  min-height: clamp(620px, 57vw, 820px);
  overflow: hidden;
  color: #f8fbfa;
  background: var(--snow-pine);
}
.th-p-snowboards .snowboard-hero__photo {
  position: absolute;
  z-index: -3;
  top: 24px;
  right: clamp(18px, 3.6vw, 64px);
  bottom: 24px;
  left: clamp(18px, 3.6vw, 64px);
  overflow: hidden;
  clip-path: polygon(0 0, 100% 0, 100% 84%, 92% 100%, 0 100%, 7% 55%);
  background: #587078;
}
.th-p-snowboards .snowboard-hero__photo .hero-media {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}
.th-p-snowboards .snowboard-hero__photo .theme-empty-media {
  width: 100%;
  height: 100%;
  min-height: 100%;
  background:
    radial-gradient(ellipse at 86% 73%, #e4472f99 0 6%, transparent 6.4%),
    linear-gradient(145deg, #dce8e8 0%, #7d9aa1 42%, #12353b 43%, #102d34 100%);
}
.th-p-snowboards .snowboard-hero__wash {
  position: absolute;
  z-index: -2;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(90deg, #0a2025e8 0%, #102d3499 35%, #102d341f 70%, #102d345e 100%),
    linear-gradient(0deg, #0a2025cc 0%, transparent 48%, #0a202522 100%);
}
.th-p-snowboards .snowboard-hero__contours {
  position: absolute;
  z-index: -1;
  top: -27%;
  right: -16%;
  width: min(76vw, 1090px);
  aspect-ratio: 1;
  pointer-events: none;
  border: 1px solid #ffffff36;
  border-radius: 50%;
}
.th-p-snowboards .snowboard-hero__contours i {
  position: absolute;
  display: block;
  border: 1px solid #ffffff36;
  border-radius: 50%;
}
.th-p-snowboards .snowboard-hero__contours i:nth-child(1) { inset: 8%; }
.th-p-snowboards .snowboard-hero__contours i:nth-child(2) { inset: 18%; }
.th-p-snowboards .snowboard-hero__contours i:nth-child(3) { inset: 30%; }
.th-p-snowboards .snowboard-hero__contours i:nth-child(4) { inset: 43%; border-color: #f0c84ba3; }
.th-p-snowboards .snowboard-hero__marker {
  position: absolute;
  z-index: 1;
  display: flex;
  gap: 8px;
  color: #f8fbfab8;
  font: 700 9px/1.1 var(--body);
  letter-spacing: .16em;
  text-transform: uppercase;
}
.th-p-snowboards .snowboard-hero__marker span { color: #f0c84b; }
.th-p-snowboards .snowboard-hero__marker b { font-weight: 700; color: #f8fbfa; }
.th-p-snowboards .snowboard-hero__marker--top { top: 46px; left: clamp(38px, 6vw, 92px); }
.th-p-snowboards .snowboard-hero__marker--top::before {
  width: 36px;
  height: 1px;
  margin: 4px 2px 0 0;
  content: '';
  background: #f0c84b;
}
.th-p-snowboards .snowboard-hero__marker--side {
  right: -26px;
  bottom: 182px;
  transform: rotate(-90deg);
  transform-origin: center;
}
.th-p-snowboards .snowboard-hero__copy-wrap {
  width: min(100% - 132px, 1160px);
  margin: 0 auto;
  padding: 150px 0 138px;
}
.th-p-snowboards .snowboard-hero__copy { max-width: 770px; }
.th-p-snowboards .snowboard-hero__copy .eyebrow {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 17px;
  color: #f0c84b;
  font: 800 10px/1.25 var(--body);
  letter-spacing: .19em;
  text-transform: uppercase;
}
.th-p-snowboards .snowboard-hero__copy .eyebrow::before {
  width: 28px;
  height: 1px;
  content: '';
  background: currentColor;
}
.th-p-snowboards .snowboard-hero__copy h1 {
  max-width: 11ch;
  margin: 0;
  color: #ffffff;
  font: 400 clamp(64px, 9.4vw, 156px)/.76 var(--display);
  letter-spacing: .005em;
  overflow-wrap: anywhere;
  text-wrap: balance;
  text-transform: uppercase;
}
.th-p-snowboards .snowboard-hero__copy h1.long { max-width: 12ch; font-size: clamp(53px, 7.6vw, 122px); }
.th-p-snowboards .snowboard-hero__copy .sub {
  max-width: 50ch;
  margin: 27px 0 0;
  color: #f8fbfad9;
  font: 500 clamp(14px, 1.2vw, 17px)/1.55 var(--body);
}
.th-p-snowboards .snowboard-hero__copy .ctas { gap: 10px; margin-top: 29px; }
.th-p-snowboards .snowboard-hero__copy .btn {
  min-height: 46px;
  padding: 13px 21px;
  border: 1px solid var(--snow-signal);
  border-radius: 999px;
  color: #ffffff;
  background: var(--snow-signal);
  font: 800 10px/1 var(--body);
  letter-spacing: .13em;
  text-transform: uppercase;
}
.th-p-snowboards .snowboard-hero__copy .btn.ghost { border-color: #ffffffa8; background: #102d344d; }
.th-p-snowboards .snowboard-hero__copy .btn:hover { border-color: #f0c84b; color: var(--snow-ink); background: #f0c84b; }
.th-p-snowboards .snowboard-hero__legend {
  position: absolute;
  right: clamp(38px, 6vw, 92px);
  bottom: 46px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(12px, 2.6vw, 36px);
  width: min(42vw, 520px);
  padding-top: 12px;
  border-top: 1px solid #ffffff5c;
  color: #f8fbfad9;
  font: 800 8px/1.4 var(--body);
  letter-spacing: .14em;
  text-transform: uppercase;
}
.th-p-snowboards .snowboard-hero__legend span { display: flex; align-items: center; gap: 7px; min-width: 0; }
.th-p-snowboards .snowboard-hero__legend i { display: block; flex: 0 0 auto; width: 7px; height: 7px; border: 1px solid #f0c84b; border-radius: 50%; }
.th-p-snowboards .snowboard-hero .motion-toggle {
  position: absolute;
  z-index: 2;
  top: 35px;
  right: clamp(38px, 6vw, 92px);
  min-height: 44px;
  padding: 10px 13px;
  border: 1px solid #ffffff75;
  border-radius: 999px;
  color: #ffffff;
  background: #102d3475;
  font: 800 9px/1 var(--body);
  letter-spacing: .12em;
  text-transform: uppercase;
}
.th-p-snowboards .snowboard-discovery {
  padding: clamp(56px, 7vw, 112px) clamp(24px, 4vw, 64px) clamp(66px, 7vw, 118px);
  overflow: hidden;
  color: var(--snow-ink);
  background: var(--snow-ice);
}
.th-p-snowboards .snowboard-discovery__head {
  display: grid;
  grid-template-columns: minmax(130px, .65fr) minmax(0, 2fr) minmax(115px, .55fr);
  gap: clamp(24px, 4vw, 70px);
  align-items: start;
  width: min(100%, 1420px);
  margin: 0 auto;
  padding-bottom: 31px;
  border-bottom: 1px solid #102d3330;
}
.th-p-snowboards .snowboard-discovery__kicker {
  margin: 8px 0 0;
  color: var(--snow-signal);
  font: 800 10px/1.25 var(--body);
  letter-spacing: .18em;
  text-transform: uppercase;
}
.th-p-snowboards .snowboard-discovery__head h2 {
  max-width: 12ch;
  margin: 0;
  font: 400 clamp(50px, 5.5vw, 92px)/.81 var(--display);
  letter-spacing: .01em;
  overflow-wrap: anywhere;
  text-transform: uppercase;
}
.th-p-snowboards .snowboard-discovery__head div > p {
  max-width: 47ch;
  margin: 18px 0 0;
  color: var(--muted);
  font: 500 14px/1.55 var(--body);
}
.th-p-snowboards .snowboard-discovery__coordinate {
  justify-self: end;
  margin-top: 11px;
  color: var(--muted);
  font: 800 9px/1.25 var(--body);
  letter-spacing: .14em;
  text-align: right;
  text-transform: uppercase;
}
.th-p-snowboards .snowboard-discovery__gates {
  display: grid;
  grid-template-columns: 1.12fr .8fr 1.08fr;
  gap: 14px;
  align-items: end;
  width: min(100%, 1420px);
  margin: 0 auto;
  padding-top: 29px;
}
.th-p-snowboards .snowboard-gate {
  position: relative;
  isolation: isolate;
  display: block;
  min-height: clamp(365px, 38vw, 555px);
  overflow: hidden;
  color: #ffffff;
  background: var(--snow-pine);
  text-decoration: none;
}
.th-p-snowboards .snowboard-gate--2 { min-height: clamp(315px, 31vw, 465px); }
.th-p-snowboards .snowboard-gate--3 { min-height: clamp(340px, 35vw, 515px); }
.th-p-snowboards .snowboard-gate__media {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #587078;
}
.th-p-snowboards .snowboard-gate__media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.th-p-snowboards .snowboard-gate__empty {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(155deg, #dce8e8 0%, #8ba2a8 43%, #274d53 44%, #102d34 100%);
}
.th-p-snowboards .snowboard-gate__empty::before,
.th-p-snowboards .snowboard-gate__empty::after,
.th-p-snowboards .snowboard-gate__empty span,
.th-p-snowboards .snowboard-gate__empty i,
.th-p-snowboards .snowboard-gate__empty b {
  position: absolute;
  display: block;
  content: '';
  border: 1px solid #ffffff8c;
  border-radius: 50%;
}
.th-p-snowboards .snowboard-gate__empty::before { top: 19%; right: -35%; width: 126%; height: 42%; transform: rotate(-15deg); }
.th-p-snowboards .snowboard-gate__empty::after { bottom: 10%; left: -38%; width: 132%; height: 52%; transform: rotate(-15deg); }
.th-p-snowboards .snowboard-gate__empty span { top: 42%; left: 14%; width: 88%; height: 27%; transform: rotate(-15deg); }
.th-p-snowboards .snowboard-gate__empty i { top: 48%; left: 22%; width: 62%; height: 18%; transform: rotate(-15deg); }
.th-p-snowboards .snowboard-gate__empty b { top: 55%; left: 34%; width: 33%; height: 8%; transform: rotate(-15deg); border-color: #f0c84b; }
.th-p-snowboards .snowboard-gate__veil {
  position: absolute;
  z-index: 1;
  inset: 0;
  background: linear-gradient(0deg, #0a2025e8 0%, #102d3444 57%, #102d3408 100%);
}
.th-p-snowboards .snowboard-gate__num {
  position: absolute;
  z-index: 2;
  top: 21px;
  right: 22px;
  color: #ffffffc7;
  font: 400 37px/.8 var(--display);
  letter-spacing: .04em;
}
.th-p-snowboards .snowboard-gate__content {
  position: absolute;
  z-index: 2;
  right: 24px;
  bottom: 23px;
  left: 24px;
}
.th-p-snowboards .snowboard-gate__content p {
  margin: 0 0 15px;
  color: var(--snow-glow);
  font: 800 9px/1.25 var(--body);
  letter-spacing: .16em;
  text-transform: uppercase;
}
.th-p-snowboards .snowboard-gate__content h3 {
  max-width: 11ch;
  margin: 0;
  font: 400 clamp(37px, 3.6vw, 61px)/.8 var(--display);
  letter-spacing: .015em;
  overflow-wrap: anywhere;
  text-transform: uppercase;
}
.th-p-snowboards .snowboard-gate__content span {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 17px;
  color: #ffffffdc;
  font: 700 9px/1.3 var(--body);
  letter-spacing: .12em;
  text-transform: uppercase;
}
.th-p-snowboards .snowboard-gate__content i { color: var(--snow-glow); font-size: 14px; font-style: normal; }
.th-p-snowboards .snowboard-gate:hover .snowboard-gate__veil { background: linear-gradient(0deg, #0a2025e8 0%, #102d345c 70%, #102d341a 100%); }
.th-p-snowboards .snowboard-discovery--products .snowboard-discovery__products {
  display: grid;
  grid-template-columns: 1.12fr .8fr 1.08fr;
  gap: 14px;
  align-items: start;
  width: min(100%, 1420px);
  margin: 0 auto;
  padding-top: 29px;
}
.th-p-snowboards .snowboard-discovery--products .snowboard-discovery__product--2 { padding-top: clamp(20px, 5vw, 72px); }
.th-p-snowboards .snowboard-discovery--products .snowboard-discovery__product--3 { padding-top: clamp(8px, 2vw, 28px); }
.th-p-snowboards .snowboard-discovery--products .pc { border-top: 1px solid #102d3330; padding-top: 12px; }
.th-p-snowboards .snowboard-discovery--products .pc .im { border-radius: 0; background: #dce8e8; }
.th-p-snowboards .snowboard-discovery--products .pc .bd h3 { color: var(--snow-ink); font-family: var(--body); font-weight: 800; letter-spacing: -.025em; }
.th-p-snowboards .snowboard-discovery--products .pc .pr { color: var(--snow-signal); font-weight: 800; }
.th-p-snowboards #shop {
  padding-top: clamp(58px, 7vw, 108px);
  color: var(--snow-ink);
  background: var(--snow-paper);
}
.th-p-snowboards #shop .sec-h { padding-bottom: 20px; border-bottom: 1px solid #102d3330; }
.th-p-snowboards #shop .sec-h h2 {
  font: 400 clamp(50px, 5.5vw, 90px)/.8 var(--display);
  letter-spacing: .015em;
  text-transform: uppercase;
}
.th-p-snowboards #shop .chips { gap: 8px; }
.th-p-snowboards #shop .chip {
  min-height: 44px;
  border-color: #102d3330;
  border-radius: 999px;
  font: 800 10px/1 var(--body);
  letter-spacing: .11em;
  text-transform: uppercase;
}
.th-p-snowboards #shop .chip.on { color: #ffffff; border-color: var(--snow-pine); background: var(--snow-pine); }
.th-p-snowboards #shop .grid { gap: 32px 16px; }
.th-p-snowboards #shop .pc { border-top: 1px solid #102d3330; padding-top: 13px; }
.th-p-snowboards #shop .pc .im { border-radius: 0; background: #dce8e8; }
.th-p-snowboards #shop .pc .bd h3 { font-family: var(--body); font-weight: 800; letter-spacing: -.025em; }
.th-p-snowboards #shop .pc .pr { color: var(--snow-signal); font-weight: 800; }
.th-p-snowboards .ft { color: var(--snow-on-foot, #eaf2ee); background: var(--snow-ink); }
.th-p-snowboards .ft :is(a, p, span) { color: #eaf2ee; }
.th-p-snowboards .ft h4 { color: var(--snow-glow); }
.th-p-snowboards :is(.snowboard-hero__copy .btn, .snowboard-gate, .snowboard-hero .motion-toggle) { -webkit-tap-highlight-color: transparent; }
.th-p-snowboards :is(.snowboard-hero__copy .btn, .snowboard-gate, .snowboard-hero .motion-toggle):focus-visible { outline: 3px solid var(--snow-glow); outline-offset: 4px; }
@media (max-width: 800px) {
  .th-p-snowboards .snowboard-hero { min-height: 700px; }
  .th-p-snowboards .snowboard-hero__photo { top: 20px; right: 20px; bottom: 20px; left: 20px; clip-path: polygon(0 0, 100% 0, 100% 88%, 88% 100%, 0 100%, 9% 57%); }
  .th-p-snowboards .snowboard-hero__photo .hero-media { object-position: 62% center; }
  .th-p-snowboards .snowboard-hero__copy-wrap { width: min(100% - 80px, 700px); padding: 135px 0 137px; }
  .th-p-snowboards .snowboard-hero__copy h1 { font-size: clamp(66px, 13vw, 112px); }
  .th-p-snowboards .snowboard-hero__copy h1.long { font-size: clamp(54px, 10.5vw, 88px); }
  .th-p-snowboards .snowboard-hero__legend { right: 40px; bottom: 43px; width: min(56vw, 420px); }
  .th-p-snowboards .snowboard-hero__marker--top { left: 40px; }
  .th-p-snowboards .snowboard-hero .motion-toggle { right: 40px; }
  .th-p-snowboards .snowboard-discovery__head { grid-template-columns: minmax(105px, .55fr) minmax(0, 2fr); }
  .th-p-snowboards .snowboard-discovery__coordinate { display: none; }
}
@media (max-width: 560px) {
  .th-p-snowboards .snowboard-hero { min-height: 672px; }
  .th-p-snowboards .snowboard-hero__photo { top: 17px; right: 16px; bottom: 17px; left: 16px; clip-path: polygon(0 0, 100% 0, 100% 92%, 81% 100%, 0 100%, 8% 62%); }
  .th-p-snowboards .snowboard-hero__photo .hero-media { object-position: 65% center; }
  .th-p-snowboards .snowboard-hero__wash { background: linear-gradient(0deg, #0a2025e8 0%, #102d3487 50%, #102d3429 100%); }
  .th-p-snowboards .snowboard-hero__contours { top: -3%; right: -57%; width: 130vw; }
  .th-p-snowboards .snowboard-hero__marker { font-size: 8px; }
  .th-p-snowboards .snowboard-hero__marker--top { top: 35px; left: 28px; }
  .th-p-snowboards .snowboard-hero__marker--side { right: -43px; bottom: 168px; }
  .th-p-snowboards .snowboard-hero__copy-wrap { width: min(100% - 48px, 460px); padding: 110px 0 149px; }
  .th-p-snowboards .snowboard-hero__copy h1 { max-width: 10ch; font-size: clamp(60px, 16.5vw, 81px); }
  .th-p-snowboards .snowboard-hero__copy h1.long { font-size: clamp(46px, 12.5vw, 63px); }
  .th-p-snowboards .snowboard-hero__copy .sub { margin-top: 20px; font-size: 14px; }
  .th-p-snowboards .snowboard-hero__copy .ctas { display: grid; grid-template-columns: 1fr; margin-top: 24px; }
  .th-p-snowboards .snowboard-hero__copy .btn { display: grid; place-items: center; }
  .th-p-snowboards .snowboard-hero__legend { right: 24px; bottom: 27px; left: 24px; width: auto; gap: 8px; font-size: 7px; }
  .th-p-snowboards .snowboard-hero__legend span { gap: 4px; }
  .th-p-snowboards .snowboard-hero__legend i { width: 5px; height: 5px; }
  .th-p-snowboards .snowboard-hero .motion-toggle { top: 25px; right: 24px; min-width: 44px; padding-right: 8px; padding-left: 8px; font-size: 8px; }
  .th-p-snowboards .snowboard-discovery { padding: 51px 16px 64px; }
  .th-p-snowboards .snowboard-discovery__head { display: block; padding-bottom: 24px; }
  .th-p-snowboards .snowboard-discovery__kicker { margin: 0 0 14px; }
  .th-p-snowboards .snowboard-discovery__head h2 { max-width: 10ch; font-size: clamp(47px, 14vw, 64px); }
  .th-p-snowboards .snowboard-discovery__head div > p { margin-top: 15px; font-size: 13px; }
  .th-p-snowboards .snowboard-discovery__gates { grid-template-columns: 1fr; gap: 12px; padding-top: 21px; }
  .th-p-snowboards .snowboard-gate,
  .th-p-snowboards .snowboard-gate--2,
  .th-p-snowboards .snowboard-gate--3 { min-height: 365px; }
  .th-p-snowboards .snowboard-gate__content { right: 19px; bottom: 19px; left: 19px; }
  .th-p-snowboards .snowboard-gate__num { top: 18px; right: 19px; }
  .th-p-snowboards .snowboard-discovery--products .snowboard-discovery__products { grid-template-columns: 1fr; gap: 23px; padding-top: 21px; }
  .th-p-snowboards .snowboard-discovery--products .snowboard-discovery__product--2,
  .th-p-snowboards .snowboard-discovery--products .snowboard-discovery__product--3 { padding-top: 0; }
  .th-p-snowboards #shop { padding-top: 58px; }
  .th-p-snowboards #shop .sec-h h2 { font-size: 55px; }
}
`;

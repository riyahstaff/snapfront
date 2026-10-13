import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-climbing-equipment',
  name: 'CRUX / FIELD',
  for: 'Climbers building personal ascent systems',
  vibe: 'A tactile crag ledger: mineral stone, rope clay, bright hardware and calm field notes.',
  category: 'Rock climbing protection, rope and climbing gear',
  group: 'outdoor',
  display: 'Bodoni Moda',
  body: 'Manrope',
  displayWeight: 600,
  tracking: '-.045em',
  colors: {
    bg: '#E8E5DE', surface: '#F3F0E9', ink: '#1E2925', muted: '#69726A', line: '#B9BDB5',
    accent: '#B95735', onAccent: '#FFF8F0', panel: '#26342E', onPanel: '#F4F1E9',
    foot: '#18241F', onFoot: '#F4F1E9', bar: '#26342E', onBar: '#F4F1E9',
    badge: '#D9AB53', onBadge: '#1E2925',
  },
  header: 'stack',
  hero: 'collage',
  card: 'boxed',
  ratio: '4/5',
  rCard: 0,
  rBtn: 0,
  motion: 'drift',
  copy: {
    eyebrow: 'Field systems for the vertical day',
    collection: 'Build the system',
    cta: 'Explore the equipment',
    title: 'Make room for the way up.',
    subtitle: 'Thoughtful essentials for the ritual before the rock.',
  },
});

const productCount = (count) => {
  const value = Number(count) || 0;
  return `${value} ${value === 1 ? 'piece' : 'pieces'}`;
};

function categoryImage(ctx, category) {
  if (category.image) {
    return `<img src="${ctx.esc(category.image)}" alt="" loading="lazy" decoding="async">`;
  }
  return `<div class="climb-route-card__empty" aria-hidden="true"><span></span><i></i><b></b></div>`;
}

function routeCard(ctx, category, index) {
  const order = String(index + 1).padStart(2, '0');
  return `<a class="climb-route-card" href="${ctx.esc(ctx.categoryLink(category.name))}">
    <span class="climb-route-card__marker" aria-hidden="true"><i></i>${order}</span>
    <div class="climb-route-card__media">${categoryImage(ctx, category)}</div>
    <div class="climb-route-card__body">
      <p class="climb-route-card__kind">Equipment group</p>
      <h3>${ctx.esc(category.name)}</h3>
      <span class="climb-route-card__count">${ctx.esc(productCount(category.count))}</span>
      <span class="climb-route-card__link">View collection <i aria-hidden="true">↗</i></span>
    </div>
  </a>`;
}

export function hero(ctx) {
  return `<section class="hero category-hero climb-hero${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="climb-hero__register" aria-hidden="true">
      <span>Crux field</span><span>Rope / rock / rhythm</span><span>01</span>
    </div>
    <div class="climb-hero__frame">
      <div class="climb-hero__media">${ctx.media(0, { priority: true, lazy: false })}</div>
      <div class="climb-hero__shade" aria-hidden="true"></div>
      <span class="climb-hero__corner climb-hero__corner--top" aria-hidden="true"></span>
      <span class="climb-hero__corner climb-hero__corner--bottom" aria-hidden="true"></span>
    </div>
    <div class="climb-hero__copy-shell">${ctx.copy('climb-hero__copy')}</div>
    <div class="climb-hero__margin-note" aria-hidden="true">
      <span class="climb-hero__rule"></span>
      <p>Begin with what keeps the route in hand.</p>
    </div>
    <div class="climb-hero__elevation" aria-hidden="true"><span>0</span><i></i><span>m</span></div>
    ${ctx.controls}
  </section>`;
}

export function discovery(ctx) {
  const categories = (ctx.cats || []).filter((category) => category?.name).slice(0, 4);
  if (categories.length >= 2) {
    return `<section class="theme-discovery climb-discovery" aria-labelledby="climb-discovery-title">
      <div class="climb-discovery__head">
        <p class="climb-discovery__index">01 / Equipment index</p>
        <div class="climb-discovery__intro">
          <h2 id="climb-discovery-title">${ctx.esc(ctx.t.copy?.collection || 'Build the system')}</h2>
          <p>Choose the part of the day you are preparing for, then browse the pieces currently in that collection.</p>
        </div>
      </div>
      <div class="climb-discovery__routes">${categories.map((category, index) => routeCard(ctx, category, index)).join('')}</div>
    </section>`;
  }

  const products = (ctx.products || []).slice(0, 3);
  if (products.length >= 2) {
    return `<section class="theme-discovery climb-discovery climb-discovery--products" aria-labelledby="climb-discovery-title">
      <div class="climb-discovery__head">
        <p class="climb-discovery__index">01 / Current rack</p>
        <div class="climb-discovery__intro">
          <h2 id="climb-discovery-title">A practical starting point.</h2>
          <p>Explore the climbing pieces currently available from this store.</p>
        </div>
      </div>
      <div class="climb-discovery__products">${products.map((product) => ctx.productCard(product)).join('')}</div>
    </section>`;
  }

  return '';
}

export const css = `
.th-p-climbing-equipment {
  --climb-stone: #e8e5de;
  --climb-paper: #f3f0e9;
  --climb-ink: #1e2925;
  --climb-moss: #26342e;
  --climb-rope: #b95735;
  --climb-sun: #d9ab53;
  background: var(--climb-stone);
  color: var(--climb-ink);
}
.th-p-climbing-equipment .ann {
  border: 0;
  border-bottom: 1px solid #f4f1e933;
  background: var(--climb-moss);
  color: #f4f1e9;
  font: 700 9px/1.25 var(--body);
  letter-spacing: .16em;
  text-transform: uppercase;
}
.th-p-climbing-equipment .hd {
  border-bottom-color: #f4f1e933;
  background: var(--climb-moss);
}
.th-p-climbing-equipment .hd :is(.brand, .nav a, .cart) { color: #f4f1e9; }
.th-p-climbing-equipment .hd .brand {
  font-family: var(--body);
  font-size: 14px;
  font-weight: 800;
  letter-spacing: .12em;
}
.th-p-climbing-equipment .hd .nav a,
.th-p-climbing-equipment .hd .cart {
  font: 700 10px/1.2 var(--body);
  letter-spacing: .12em;
  text-transform: uppercase;
}
.th-p-climbing-equipment .hd :is(.nav a:hover, .cart:hover) { color: var(--climb-sun); }
.th-p-climbing-equipment .climb-hero {
  position: relative;
  isolation: isolate;
  min-height: clamp(645px, 58vw, 880px);
  display: grid;
  grid-template-columns: minmax(22px, .25fr) minmax(0, 1fr) minmax(0, 1.34fr) minmax(24px, .34fr);
  grid-template-rows: auto minmax(470px, 1fr) auto;
  overflow: hidden;
  padding: clamp(20px, 2.8vw, 46px) 0 clamp(25px, 3vw, 50px);
  background: var(--climb-paper);
  color: var(--climb-ink);
}
.th-p-climbing-equipment .climb-hero::before {
  position: absolute;
  z-index: -2;
  top: 0;
  right: 0;
  bottom: 0;
  width: 34%;
  content: '';
  background: var(--climb-moss);
}
.th-p-climbing-equipment .climb-hero__register {
  grid-column: 2 / 4;
  grid-row: 1;
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 20px;
  align-items: center;
  min-width: 0;
  padding: 0 0 clamp(15px, 2vw, 27px);
  border-bottom: 1px solid #1e292538;
  color: var(--climb-ink);
  font: 800 9px/1.25 var(--body);
  letter-spacing: .17em;
  text-transform: uppercase;
}
.th-p-climbing-equipment .climb-hero__register span { min-width: 0; overflow-wrap: anywhere; }
.th-p-climbing-equipment .climb-hero__register span:nth-child(2) { color: var(--climb-rope); text-align: center; }
.th-p-climbing-equipment .climb-hero__register span:last-child { color: var(--climb-ink); }
.th-p-climbing-equipment .climb-hero__frame {
  position: relative;
  z-index: -1;
  grid-column: 3 / 5;
  grid-row: 2 / 4;
  align-self: stretch;
  min-height: 0;
  margin-top: clamp(20px, 3.8vw, 67px);
  overflow: hidden;
  background: #34453e;
}
.th-p-climbing-equipment .climb-hero__media {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #34453e;
}
.th-p-climbing-equipment .climb-hero__media .hero-media,
.th-p-climbing-equipment .climb-hero__media .theme-empty-media {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: block;
  object-fit: cover;
  object-position: 66% center;
}
.th-p-climbing-equipment .climb-hero__media .theme-empty-media {
  display: grid;
  place-items: center;
  padding: 32px;
  background:
    radial-gradient(ellipse at 64% 90%, #b9573566 0 8%, transparent 8.5%),
    radial-gradient(ellipse at 52% 105%, transparent 0 23%, #d9ab5388 23.5% 24%, transparent 24.5%),
    linear-gradient(145deg, #22312c 0%, #5b665b 48%, #26342e 100%);
  color: #f4f1e9;
  text-align: center;
}
.th-p-climbing-equipment .climb-hero__shade {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(90deg, #26342e8a 0%, transparent 35%, #18241f23 100%), linear-gradient(0deg, #18241f75 0%, transparent 43%);
}
.th-p-climbing-equipment .climb-hero__corner {
  position: absolute;
  z-index: 1;
  width: 42px;
  height: 42px;
  pointer-events: none;
}
.th-p-climbing-equipment .climb-hero__corner--top { top: 15px; right: 15px; border-top: 1px solid #f4f1e9aa; border-right: 1px solid #f4f1e9aa; }
.th-p-climbing-equipment .climb-hero__corner--bottom { bottom: 15px; left: 15px; border-bottom: 1px solid #f4f1e9aa; border-left: 1px solid #f4f1e9aa; }
.th-p-climbing-equipment .climb-hero__copy-shell {
  z-index: 2;
  grid-column: 2 / 4;
  grid-row: 2;
  align-self: center;
  min-width: 0;
  padding: clamp(40px, 7vw, 104px) 0 clamp(40px, 4vw, 70px);
}
.th-p-climbing-equipment .climb-hero__copy { max-width: 790px; min-width: 0; }
.th-p-climbing-equipment .climb-hero__copy .eyebrow {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 17px;
  color: var(--climb-rope);
  font: 800 10px/1.3 var(--body);
  letter-spacing: .17em;
  text-transform: uppercase;
}
.th-p-climbing-equipment .climb-hero__copy .eyebrow::before { width: 28px; height: 1px; flex: 0 0 auto; content: ''; background: currentColor; }
.th-p-climbing-equipment .climb-hero__copy h1 {
  max-width: 9.5ch;
  margin: 0;
  color: var(--climb-ink);
  font: 600 clamp(58px, 8.2vw, 132px)/.78 var(--display);
  letter-spacing: -.065em;
  text-wrap: balance;
}
.th-p-climbing-equipment .climb-hero__copy h1.long { max-width: 13ch; font-size: clamp(45px, 6vw, 94px); line-height: .84; }
.th-p-climbing-equipment .climb-hero__copy .sub {
  max-width: 35ch;
  margin: clamp(21px, 2.6vw, 34px) 0 0;
  color: #334039;
  font: 500 clamp(13px, 1.2vw, 16px)/1.55 var(--body);
}
.th-p-climbing-equipment .climb-hero__copy .ctas { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 25px; }
.th-p-climbing-equipment .climb-hero__copy .btn {
  min-height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 19px;
  border: 1px solid var(--climb-ink);
  border-radius: 0;
  background: var(--climb-ink);
  color: #f4f1e9;
  font: 800 10px/1.1 var(--body);
  letter-spacing: .13em;
  text-align: center;
  text-transform: uppercase;
}
.th-p-climbing-equipment .climb-hero__copy .btn.ghost { background: #f3f0e9c7; color: var(--climb-ink); }
.th-p-climbing-equipment .climb-hero__copy .btn:hover { border-color: var(--climb-rope); background: var(--climb-rope); color: #fff8f0; }
.th-p-climbing-equipment .climb-hero__margin-note {
  z-index: 2;
  grid-column: 2;
  grid-row: 3;
  align-self: end;
  width: min(100%, 210px);
  padding-top: 16px;
  color: var(--climb-ink);
}
.th-p-climbing-equipment .climb-hero__rule { display: block; width: 34px; height: 3px; margin-bottom: 11px; background: var(--climb-sun); }
.th-p-climbing-equipment .climb-hero__margin-note p { margin: 0; font: 700 9px/1.5 var(--body); letter-spacing: .11em; text-transform: uppercase; }
.th-p-climbing-equipment .climb-hero__elevation {
  position: absolute;
  z-index: 2;
  top: 50%;
  right: clamp(9px, 1.4vw, 24px);
  display: flex;
  align-items: center;
  gap: 8px;
  color: #f4f1e9;
  font: 800 8px/1 var(--body);
  letter-spacing: .13em;
  transform: translateY(-50%) rotate(90deg);
}
.th-p-climbing-equipment .climb-hero__elevation i { width: 60px; height: 1px; background: #f4f1e9aa; }
.th-p-climbing-equipment .climb-hero .motion-toggle {
  position: absolute;
  z-index: 3;
  right: clamp(20px, 3vw, 50px);
  bottom: clamp(20px, 3vw, 50px);
  min-width: 44px;
  min-height: 44px;
  padding: 10px 12px;
  border: 1px solid #f4f1e980;
  border-radius: 0;
  background: #18241fbf;
  color: #f4f1e9;
  font: 800 9px/1 var(--body);
  letter-spacing: .1em;
  text-transform: uppercase;
}
.th-p-climbing-equipment .climb-hero .motion-toggle:hover { border-color: var(--climb-sun); background: var(--climb-sun); color: var(--climb-ink); }
.th-p-climbing-equipment .climb-discovery {
  overflow: hidden;
  padding: clamp(52px, 7vw, 110px) max(24px, calc((100% - 1380px) / 2)) clamp(55px, 7vw, 106px);
  background: var(--climb-stone);
  color: var(--climb-ink);
}
.th-p-climbing-equipment .climb-discovery__head {
  display: grid;
  grid-template-columns: minmax(150px, .72fr) minmax(0, 2.3fr);
  gap: clamp(24px, 5vw, 92px);
  align-items: start;
  padding-bottom: clamp(27px, 3vw, 44px);
  border-bottom: 1px solid #1e29253b;
}
.th-p-climbing-equipment .climb-discovery__index { margin: 8px 0 0; color: var(--climb-rope); font: 800 9px/1.3 var(--body); letter-spacing: .17em; text-transform: uppercase; }
.th-p-climbing-equipment .climb-discovery__intro { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(180px, .75fr); gap: clamp(22px, 4vw, 72px); align-items: end; }
.th-p-climbing-equipment .climb-discovery h2 {
  max-width: 11ch;
  margin: 0;
  color: var(--climb-ink);
  font: 600 clamp(44px, 5.3vw, 84px)/.84 var(--display);
  letter-spacing: -.055em;
  text-wrap: balance;
}
.th-p-climbing-equipment .climb-discovery__intro > p { max-width: 31ch; margin: 0 0 5px; color: var(--muted); font: 500 14px/1.55 var(--body); }
.th-p-climbing-equipment .climb-discovery__routes { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border-left: 1px solid #1e29253b; }
.th-p-climbing-equipment .climb-route-card {
  position: relative;
  min-width: 0;
  min-height: clamp(420px, 39vw, 570px);
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  overflow: hidden;
  border-right: 1px solid #1e29253b;
  border-bottom: 1px solid #1e29253b;
  background: var(--climb-paper);
  color: var(--climb-ink);
  text-decoration: none;
}
.th-p-climbing-equipment .climb-route-card__marker {
  position: absolute;
  z-index: 2;
  top: 17px;
  left: 17px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 22px;
  padding: 4px 7px;
  background: #f3f0e9e8;
  color: var(--climb-ink);
  font: 800 8px/1 var(--body);
  letter-spacing: .12em;
}
.th-p-climbing-equipment .climb-route-card__marker i { width: 6px; height: 6px; border-radius: 50%; background: var(--climb-rope); }
.th-p-climbing-equipment .climb-route-card__media { position: relative; min-height: 0; overflow: hidden; background: #cdd0c8; }
.th-p-climbing-equipment .climb-route-card__media img { width: 100%; height: 100%; display: block; object-fit: cover; }
.th-p-climbing-equipment .climb-route-card__empty {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(147deg, #b7bdb3 0%, #eaebe5 45%, #879087 100%);
}
.th-p-climbing-equipment .climb-route-card__empty::before,
.th-p-climbing-equipment .climb-route-card__empty::after,
.th-p-climbing-equipment .climb-route-card__empty span,
.th-p-climbing-equipment .climb-route-card__empty i,
.th-p-climbing-equipment .climb-route-card__empty b { position: absolute; display: block; content: ''; border: 1px solid #1e292555; border-radius: 50%; }
.th-p-climbing-equipment .climb-route-card__empty::before { width: 132%; height: 50%; top: 10%; left: -48%; }
.th-p-climbing-equipment .climb-route-card__empty::after { width: 105%; height: 39%; right: -40%; bottom: 2%; }
.th-p-climbing-equipment .climb-route-card__empty span { width: 58%; height: 22%; top: 44%; left: 20%; }
.th-p-climbing-equipment .climb-route-card__empty i { width: 31%; height: 12%; top: 24%; left: 10%; }
.th-p-climbing-equipment .climb-route-card__empty b { width: 22%; height: 9%; right: 17%; top: 62%; }
.th-p-climbing-equipment .climb-route-card__body { min-width: 0; padding: 20px 17px 18px; background: var(--climb-paper); }
.th-p-climbing-equipment .climb-route-card__kind { margin: 0 0 8px; color: var(--climb-rope); font: 800 8px/1.2 var(--body); letter-spacing: .14em; text-transform: uppercase; }
.th-p-climbing-equipment .climb-route-card h3 { margin: 0; color: inherit; font: 600 clamp(25px, 2.45vw, 40px)/.9 var(--display); letter-spacing: -.04em; overflow-wrap: anywhere; }
.th-p-climbing-equipment .climb-route-card__count { display: block; margin-top: 12px; color: var(--muted); font: 700 9px/1.25 var(--body); letter-spacing: .1em; text-transform: uppercase; }
.th-p-climbing-equipment .climb-route-card__link { display: inline-flex; gap: 6px; align-items: center; min-height: 44px; margin-top: 12px; color: var(--climb-ink); font: 800 9px/1.2 var(--body); letter-spacing: .12em; text-transform: uppercase; }
.th-p-climbing-equipment .climb-route-card__link i { color: var(--climb-rope); font-size: 15px; font-style: normal; }
.th-p-climbing-equipment .climb-route-card:hover { background: var(--climb-moss); color: #f4f1e9; }
.th-p-climbing-equipment .climb-route-card:hover .climb-route-card__body { background: var(--climb-moss); }
.th-p-climbing-equipment .climb-route-card:hover .climb-route-card__count { color: #f4f1e9b8; }
.th-p-climbing-equipment .climb-discovery--products .climb-discovery__products { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1px; padding-top: 24px; background: #1e29253b; }
.th-p-climbing-equipment .climb-discovery--products .pc { min-width: 0; border: 0; border-radius: 0; padding: clamp(15px, 2vw, 28px); background: var(--climb-paper); box-shadow: none; }
.th-p-climbing-equipment .climb-discovery--products .pc .im { border-radius: 0; background: #dfe1db; }
.th-p-climbing-equipment .climb-discovery--products .pc .bd h3 { color: var(--climb-ink); font-family: var(--display); font-weight: 600; letter-spacing: -.03em; }
.th-p-climbing-equipment .climb-discovery--products .pc .pr { color: var(--climb-rope); font-weight: 800; }
.th-p-climbing-equipment #shop { padding-top: clamp(54px, 7vw, 108px); background: var(--climb-paper); }
.th-p-climbing-equipment #shop .sec-h { padding-bottom: 22px; border-bottom: 1px solid #1e29253b; }
.th-p-climbing-equipment #shop .sec-h h2 { color: var(--climb-ink); font: 600 clamp(40px, 4.5vw, 72px)/.85 var(--display); letter-spacing: -.05em; }
.th-p-climbing-equipment #shop .chips { gap: 8px; }
.th-p-climbing-equipment #shop .chip { min-height: 44px; border-radius: 0; font: 800 9px/1 var(--body); letter-spacing: .11em; text-transform: uppercase; }
.th-p-climbing-equipment #shop .grid { gap: 1px; background: #1e29253b; }
.th-p-climbing-equipment #shop .pc { border: 0; border-radius: 0; padding: 16px; background: var(--climb-paper); box-shadow: none; }
.th-p-climbing-equipment #shop .pc .im { border-radius: 0; background: #dfe1db; }
.th-p-climbing-equipment #shop .pc .bd h3 { font-family: var(--body); font-weight: 800; letter-spacing: -.025em; }
.th-p-climbing-equipment #shop .pc .pr { color: var(--climb-rope); font-weight: 800; }
.th-p-climbing-equipment .ft { background: #18241f; color: #f4f1e9; }
.th-p-climbing-equipment .ft :is(a, p, span, h4) { color: #f4f1e9; }
.th-p-climbing-equipment .ft .brand { font-family: var(--body); font-weight: 800; letter-spacing: .12em; }
.th-p-climbing-equipment :is(.climb-hero__copy .btn, .climb-route-card, .climb-hero .motion-toggle) { -webkit-tap-highlight-color: transparent; }
.th-p-climbing-equipment :is(.climb-hero__copy .btn, .climb-route-card, .climb-hero .motion-toggle):focus-visible { outline: 3px solid var(--climb-sun); outline-offset: 4px; }
.th-p-climbing-equipment .climb-hero.has-hero-motion[data-hero-motion="pan"] .climb-hero__media .hero-media { animation: climbing-equipment-pan 18s ease-in-out infinite alternate; }
.th-p-climbing-equipment .climb-hero.has-hero-motion[data-hero-motion="drift"] .climb-hero__media .hero-media { animation: climbing-equipment-drift 15s ease-in-out infinite alternate; }
@keyframes climbing-equipment-pan {
  from { transform: scale(1.04) translate3d(-1%, 0, 0); }
  to { transform: scale(1.1) translate3d(1.2%, -1%, 0); }
}
@keyframes climbing-equipment-drift {
  from { transform: scale(1.035) translate3d(0, 0, 0); }
  to { transform: scale(1.085) translate3d(-1.15%, -1%, 0); }
}
@media (max-width: 860px) {
  .th-p-climbing-equipment .climb-hero { min-height: 705px; grid-template-columns: 28px minmax(0, 1.1fr) minmax(0, .9fr) 28px; }
  .th-p-climbing-equipment .climb-hero__copy h1 { font-size: clamp(56px, 9vw, 94px); }
  .th-p-climbing-equipment .climb-hero__margin-note { width: 180px; }
  .th-p-climbing-equipment .climb-discovery { padding-right: 28px; padding-left: 28px; }
  .th-p-climbing-equipment .climb-discovery__routes { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .th-p-climbing-equipment .climb-route-card { min-height: 450px; }
}
@media (max-width: 580px) {
  .th-p-climbing-equipment .hd .nav { display: none; }
  .th-p-climbing-equipment .climb-hero {
    min-height: 705px;
    display: flex;
    flex-direction: column;
    padding: 18px 18px 23px;
    background: var(--climb-paper);
  }
  .th-p-climbing-equipment .climb-hero::before { width: 44%; }
  .th-p-climbing-equipment .climb-hero__register { width: 100%; grid-template-columns: 1fr auto; gap: 8px; padding-bottom: 13px; }
  .th-p-climbing-equipment .climb-hero__register span:nth-child(2) { display: none; }
  .th-p-climbing-equipment .climb-hero__frame { position: absolute; z-index: -1; top: 70px; right: 0; bottom: 0; left: 31%; margin: 0; }
  .th-p-climbing-equipment .climb-hero__media .hero-media { object-position: 63% center; }
  .th-p-climbing-equipment .climb-hero__shade { background: linear-gradient(90deg, #f3f0e900 0%, #26342e26 42%, #18241f5c 100%), linear-gradient(0deg, #18241f83 0%, transparent 50%); }
  .th-p-climbing-equipment .climb-hero__copy-shell { width: min(100%, 390px); margin-top: auto; padding: 88px 0 86px; }
  .th-p-climbing-equipment .climb-hero__copy .eyebrow { max-width: 25ch; font-size: 9px; }
  .th-p-climbing-equipment .climb-hero__copy h1,
  .th-p-climbing-equipment .climb-hero__copy h1.long { max-width: 8.8ch; font-size: clamp(53px, 15vw, 72px); line-height: .8; }
  .th-p-climbing-equipment .climb-hero__copy .sub { max-width: 28ch; margin-top: 19px; font-size: 13px; }
  .th-p-climbing-equipment .climb-hero__copy .ctas { display: grid; width: min(100%, 250px); margin-top: 21px; }
  .th-p-climbing-equipment .climb-hero__copy .btn { width: 100%; }
  .th-p-climbing-equipment .climb-hero__margin-note { position: absolute; z-index: 2; bottom: 24px; left: 18px; width: min(44%, 150px); color: #f4f1e9; }
  .th-p-climbing-equipment .climb-hero__margin-note p { font-size: 8px; }
  .th-p-climbing-equipment .climb-hero__elevation { right: 4px; }
  .th-p-climbing-equipment .climb-hero .motion-toggle { right: 15px; bottom: 16px; padding: 9px; font-size: 8px; }
  .th-p-climbing-equipment .climb-discovery { padding: 47px 18px 54px; }
  .th-p-climbing-equipment .climb-discovery__head { grid-template-columns: 1fr; gap: 15px; padding-bottom: 28px; }
  .th-p-climbing-equipment .climb-discovery__index { margin-top: 0; }
  .th-p-climbing-equipment .climb-discovery__intro { grid-template-columns: 1fr; gap: 15px; }
  .th-p-climbing-equipment .climb-discovery h2 { font-size: clamp(42px, 13vw, 59px); }
  .th-p-climbing-equipment .climb-discovery__intro > p { max-width: 35ch; }
  .th-p-climbing-equipment .climb-discovery__routes { grid-template-columns: 1fr; }
  .th-p-climbing-equipment .climb-route-card { min-height: 405px; grid-template-columns: minmax(0, 1fr) minmax(145px, .85fr); grid-template-rows: 1fr; }
  .th-p-climbing-equipment .climb-route-card__media { grid-column: 2; grid-row: 1; }
  .th-p-climbing-equipment .climb-route-card__body { z-index: 1; grid-column: 1 / 3; grid-row: 1; align-self: end; width: min(78%, 275px); }
  .th-p-climbing-equipment .climb-route-card__marker { top: 13px; left: 13px; }
  .th-p-climbing-equipment .climb-route-card h3 { font-size: clamp(28px, 9vw, 38px); }
  .th-p-climbing-equipment .climb-discovery--products .climb-discovery__products { grid-template-columns: 1fr; }
  .th-p-climbing-equipment #shop { padding-top: 50px; }
  .th-p-climbing-equipment #shop .grid { gap: 1px; }
}
@media (prefers-reduced-motion: reduce) {
  .th-p-climbing-equipment .climb-hero.has-hero-motion .climb-hero__media .hero-media { animation: none; transform: none; }
}
`;

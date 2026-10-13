import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-surfboards',
  name: 'WATERLINE BOARDROOM',
  for: 'surfers choosing a board shape for their next line',
  vibe: 'Salt-worn field notes, dawn water, and quietly sculptural board culture.',
  category: 'Hand-shaped surfboards and wave-riding equipment',
  group: 'outdoor',
  display: 'DM Serif Display',
  body: 'Manrope',
  displayWeight: 400,
  tracking: '-.035em',
  colors: {
    bg: '#F1ECE1',
    surface: '#FFFDF8',
    ink: '#102B31',
    muted: '#5F7275',
    line: '#B7C4C1',
    accent: '#D86A45',
    onAccent: '#FFFFFF',
    panel: '#143D42',
    onPanel: '#F8F5EE',
    foot: '#0F2C31',
    onFoot: '#F8F5EE',
    bar: '#F5F1E7',
    onBar: '#102B31',
    badge: '#D86A45',
    onBadge: '#FFFFFF',
  },
  header: 'split',
  hero: 'editorial',
  card: 'minimal',
  ratio: '3/4',
  rCard: 20,
  rBtn: 999,
  motion: 'drift',
  copy: {
    eyebrow: 'Shaped for the first light',
    collection: 'Find your waterline',
    cta: 'Browse the board room',
    title: 'Hold the line a little longer.',
    subtitle: 'A considered collection for the sea in front of you.',
  },
});

const countLabel = (count) => {
  const safe = Number(count) || 0;
  return `${safe} ${safe === 1 ? 'piece' : 'pieces'}`;
};

function categoryImage(ctx, category) {
  if (category.image) {
    return `<img src="${ctx.esc(category.image)}" alt="" loading="lazy" decoding="async">`;
  }
  return '<div class="surf-shape-card__empty" aria-hidden="true"><i></i><b></b></div>';
}

function categoryCard(ctx, category, index) {
  return `<a class="surf-shape-card surf-shape-card--${index + 1}" href="${ctx.esc(ctx.categoryLink(category.name))}">
    <div class="surf-shape-card__media">${categoryImage(ctx, category)}</div>
    <div class="surf-shape-card__wash" aria-hidden="true"></div>
    <div class="surf-shape-card__blank" aria-hidden="true"></div>
    <div class="surf-shape-card__copy">
      <span class="surf-shape-card__number">${String(index + 1).padStart(2, '0')}</span>
      <span class="surf-shape-card__count">${ctx.esc(countLabel(category.count))} available</span>
      <h3>${ctx.esc(category.name)}</h3>
      <span class="surf-shape-card__link">View collection <i aria-hidden="true">↗</i></span>
    </div>
  </a>`;
}

export function hero(ctx) {
  const categoryCount = (ctx.cats || []).filter((category) => category?.name).length;
  const indexNote = categoryCount
    ? `${categoryCount} ${categoryCount === 1 ? 'active collection' : 'active collections'}`
    : 'Current board collection';

  return `<section class="hero category-hero surf-hero${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="surf-hero__stage">
      <div class="surf-hero__media">${ctx.media(0, { priority: true, lazy: false })}</div>
      <div class="surf-hero__haze" aria-hidden="true"></div>
      <p class="surf-hero__field-note" aria-hidden="true"><span>Salt</span><span>Sun</span><span>Shape</span></p>
      <div class="surf-hero__copy-wrap">${ctx.copy('surf-hero__copy')}</div>
      <div class="surf-hero__tide-index" aria-label="Board collection introduction">
        <span class="surf-hero__index-rule" aria-hidden="true"></span>
        <p><b>Board room</b><small>${ctx.esc(indexNote)}</small></p>
        <a href="#shop">See what is in the water <i aria-hidden="true">↘</i></a>
      </div>
      ${ctx.controls}
    </div>
  </section>`;
}

export function discovery(ctx) {
  const categories = (ctx.cats || []).filter((category) => category?.name).slice(0, 4);
  if (categories.length >= 2) {
    return `<section class="theme-discovery surf-discovery" aria-labelledby="surf-discovery-title">
      <div class="surf-discovery__head">
        <p class="surf-discovery__eyebrow">The shape archive</p>
        <div class="surf-discovery__heading">
          <h2 id="surf-discovery-title">Find the board that meets your water.</h2>
          <p>Follow the collections available now, then take the next line from there.</p>
        </div>
      </div>
      <div class="surf-shape-archive">${categories.map((category, index) => categoryCard(ctx, category, index)).join('')}</div>
    </section>`;
  }

  const products = (ctx.products || []).slice(0, 3);
  if (products.length >= 2) {
    return `<section class="theme-discovery surf-discovery surf-discovery--products" aria-labelledby="surf-discovery-title">
      <div class="surf-discovery__head">
        <p class="surf-discovery__eyebrow">From the board room</p>
        <div class="surf-discovery__heading">
          <h2 id="surf-discovery-title">A good place to start.</h2>
          <p>These are the boards currently available to explore.</p>
        </div>
      </div>
      <div class="surf-product-tide">${products.map((product) => ctx.productCard(product)).join('')}</div>
    </section>`;
  }

  return '';
}

export const css = `
.th-p-surfboards {
  --surf-sand: #F1ECE1;
  --surf-paper: #FFFDF8;
  --surf-ink: #102B31;
  --surf-deep: #143D42;
  --surf-foam: #F8F5EE;
  --surf-rust: #D86A45;
  background: var(--surf-sand);
  color: var(--surf-ink);
}
.th-p-surfboards .ann {
  border: 0;
  background: var(--surf-deep);
  color: var(--surf-foam);
  font: 700 10px/1.2 var(--body);
  letter-spacing: .15em;
  text-transform: uppercase;
}
.th-p-surfboards .hd {
  border-color: #102B311C;
  background: var(--surf-paper);
  color: var(--surf-ink);
}
.th-p-surfboards .hd .wrap { min-height: 68px; }
.th-p-surfboards .hd .brand {
  color: var(--surf-ink);
  font-family: var(--display);
  font-size: clamp(21px, 1.9vw, 29px);
  font-weight: 400;
  letter-spacing: -.04em;
}
.th-p-surfboards .hd :is(.nav a, .cart) {
  color: var(--surf-ink);
  font: 700 10px/1 var(--body);
  letter-spacing: .12em;
  text-transform: uppercase;
}
.th-p-surfboards .hd :is(.nav a, .cart):hover { color: var(--surf-rust); }
.th-p-surfboards .surf-hero {
  position: relative;
  overflow: hidden;
  background: var(--surf-deep);
  color: var(--surf-ink);
}
.th-p-surfboards .surf-hero__stage {
  position: relative;
  min-height: clamp(590px, 52vw, 780px);
  overflow: hidden;
  isolation: isolate;
}
.th-p-surfboards .surf-hero__media {
  position: absolute;
  inset: 0;
  z-index: -3;
  overflow: hidden;
  background: #8EAAB3;
}
.th-p-surfboards .surf-hero__media .hero-media,
.th-p-surfboards .surf-hero__media .theme-empty-media {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
  object-fit: cover;
  object-position: center center;
}
.th-p-surfboards .surf-hero__media .theme-empty-media {
  background:
    radial-gradient(ellipse 60% 42% at 70% 72%, #C96D4D66 0 6%, transparent 6.5%),
    linear-gradient(180deg, #AEC4CB 0%, #D7E0DC 47%, #8AA2A1 48%, #738E89 100%);
  color: var(--surf-paper);
}
.th-p-surfboards .surf-hero__haze {
  position: absolute;
  inset: 0;
  z-index: -2;
  pointer-events: none;
  background:
    linear-gradient(90deg, #F1ECE1F2 0%, #F1ECE1CB 31%, #F1ECE145 58%, #143D4214 100%),
    linear-gradient(0deg, #102B3157 0%, transparent 39%);
}
.th-p-surfboards .surf-hero__field-note {
  position: absolute;
  top: clamp(34px, 4.6vw, 70px);
  right: clamp(25px, 5vw, 76px);
  z-index: 1;
  display: grid;
  gap: 3px;
  margin: 0;
  color: #102B31B8;
  font: 700 9px/1.25 var(--body);
  letter-spacing: .22em;
  text-align: right;
  text-transform: uppercase;
}
.th-p-surfboards .surf-hero__field-note::after {
  width: 33px;
  height: 1px;
  margin: 13px 0 0 auto;
  content: '';
  background: var(--surf-rust);
}
.th-p-surfboards .surf-hero__copy-wrap {
  position: absolute;
  z-index: 1;
  left: clamp(22px, 7.1vw, 128px);
  bottom: clamp(76px, 10vw, 132px);
  width: min(610px, 48vw);
  padding: clamp(26px, 3vw, 46px) clamp(25px, 3.1vw, 48px) clamp(27px, 3.3vw, 49px);
  background: #F1ECE1E8;
  clip-path: polygon(0 0, 96% 7%, 100% 92%, 4% 100%);
}
.th-p-surfboards .surf-hero__copy { max-width: 510px; }
.th-p-surfboards .surf-hero__copy .eyebrow {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 17px;
  color: var(--surf-rust);
  font: 800 9px/1.2 var(--body);
  letter-spacing: .19em;
  text-transform: uppercase;
}
.th-p-surfboards .surf-hero__copy .eyebrow::before {
  width: 23px;
  height: 1px;
  content: '';
  background: currentColor;
}
.th-p-surfboards .surf-hero__copy h1 {
  max-width: 10.2ch;
  margin: 0;
  color: var(--surf-ink);
  font: 400 clamp(52px, 6.65vw, 101px)/.88 var(--display);
  letter-spacing: -.058em;
  overflow-wrap: anywhere;
  text-wrap: balance;
}
.th-p-surfboards .surf-hero__copy h1.long {
  max-width: 13ch;
  font-size: clamp(44px, 5vw, 76px);
  line-height: .92;
}
.th-p-surfboards .surf-hero__copy .sub {
  max-width: 36ch;
  margin: 19px 0 0;
  color: #27454A;
  font: 500 clamp(13px, 1.15vw, 16px)/1.5 var(--body);
}
.th-p-surfboards .surf-hero__copy .ctas {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 25px;
}
.th-p-surfboards .surf-hero__copy .btn {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 18px;
  border: 1px solid var(--surf-ink);
  border-radius: 999px;
  background: var(--surf-ink);
  color: var(--surf-foam);
  font: 800 10px/1 var(--body);
  letter-spacing: .11em;
  text-align: center;
  text-transform: uppercase;
}
.th-p-surfboards .surf-hero__copy .btn.ghost {
  background: transparent;
  color: var(--surf-ink);
}
.th-p-surfboards .surf-hero__copy .btn:hover {
  border-color: var(--surf-rust);
  background: var(--surf-rust);
  color: #FFFFFF;
}
.th-p-surfboards .surf-hero__tide-index {
  position: absolute;
  right: clamp(25px, 5vw, 76px);
  bottom: clamp(25px, 4vw, 58px);
  z-index: 1;
  width: min(290px, 29vw);
  color: #102B31;
}
.th-p-surfboards .surf-hero__index-rule {
  display: block;
  width: 100%;
  height: 1px;
  margin-bottom: 13px;
  background: #102B3159;
}
.th-p-surfboards .surf-hero__tide-index p {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin: 0;
}
.th-p-surfboards .surf-hero__tide-index b,
.th-p-surfboards .surf-hero__tide-index small {
  font: 800 9px/1.3 var(--body);
  letter-spacing: .16em;
  text-transform: uppercase;
}
.th-p-surfboards .surf-hero__tide-index small {
  color: #27454A;
  font-weight: 700;
  text-align: right;
}
.th-p-surfboards .surf-hero__tide-index a {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 44px;
  margin-top: 13px;
  padding: 10px 0;
  border-bottom: 1px solid #102B3159;
  color: inherit;
  font: 800 10px/1.2 var(--body);
  letter-spacing: .1em;
  text-decoration: none;
  text-transform: uppercase;
}
.th-p-surfboards .surf-hero__tide-index a:hover { color: var(--surf-rust); }
.th-p-surfboards .surf-hero__tide-index i {
  color: var(--surf-rust);
  font: 400 20px/.8 var(--display);
  font-style: normal;
}
.th-p-surfboards .surf-hero .motion-toggle {
  position: absolute;
  z-index: 3;
  top: clamp(30px, 4.2vw, 63px);
  left: clamp(22px, 7.1vw, 128px);
  min-height: 44px;
  padding: 9px 12px;
  border: 1px solid #102B3157;
  border-radius: 999px;
  background: #F1ECE1BF;
  color: var(--surf-ink);
  font: 800 8px/1 var(--body);
  letter-spacing: .12em;
  text-transform: uppercase;
}
.th-p-surfboards .surf-hero .motion-toggle:hover {
  border-color: var(--surf-rust);
  background: var(--surf-rust);
  color: #FFFFFF;
}
.th-p-surfboards .surf-discovery {
  padding: clamp(60px, 8vw, 126px) max(24px, calc((100vw - 1320px) / 2)) clamp(56px, 7vw, 110px);
  overflow: hidden;
  background: var(--surf-sand);
  color: var(--surf-ink);
}
.th-p-surfboards .surf-discovery__head {
  display: grid;
  grid-template-columns: minmax(150px, .75fr) minmax(0, 2.6fr);
  gap: clamp(26px, 5vw, 74px);
  align-items: start;
  max-width: 1320px;
  margin: 0 auto clamp(30px, 4vw, 58px);
  padding-bottom: 25px;
  border-bottom: 1px solid #102B3126;
}
.th-p-surfboards .surf-discovery__eyebrow {
  margin: 8px 0 0;
  color: var(--surf-rust);
  font: 800 10px/1.2 var(--body);
  letter-spacing: .17em;
  text-transform: uppercase;
}
.th-p-surfboards .surf-discovery__heading {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(180px, .72fr);
  gap: clamp(24px, 5vw, 74px);
  align-items: end;
}
.th-p-surfboards .surf-discovery__heading h2 {
  max-width: 12ch;
  margin: 0;
  color: var(--surf-ink);
  font: 400 clamp(45px, 5vw, 75px)/.91 var(--display);
  letter-spacing: -.052em;
  overflow-wrap: anywhere;
  text-wrap: balance;
}
.th-p-surfboards .surf-discovery__heading p {
  max-width: 31ch;
  margin: 0 0 3px;
  color: var(--surf-muted, #5F7275);
  font: 500 14px/1.55 var(--body);
}
.th-p-surfboards .surf-shape-archive {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: clamp(10px, 1.4vw, 20px);
  max-width: 1320px;
  margin: 0 auto;
}
.th-p-surfboards .surf-shape-card {
  position: relative;
  isolation: isolate;
  min-height: clamp(360px, 36vw, 520px);
  overflow: hidden;
  display: flex;
  align-items: flex-end;
  padding: clamp(18px, 2vw, 30px);
  border: 1px solid #102B312E;
  border-radius: 180px 180px 26px 26px;
  background: #8FA8A5;
  color: var(--surf-foam);
  text-decoration: none;
}
.th-p-surfboards .surf-shape-card--2 { transform: translateY(clamp(14px, 2.8vw, 40px)); }
.th-p-surfboards .surf-shape-card--3 { transform: translateY(clamp(32px, 5vw, 72px)); }
.th-p-surfboards .surf-shape-card--4 { transform: translateY(clamp(14px, 2.8vw, 40px)); }
.th-p-surfboards .surf-shape-card__media {
  position: absolute;
  inset: 0;
  z-index: -3;
  overflow: hidden;
  background: #7C9997;
}
.th-p-surfboards .surf-shape-card__media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.th-p-surfboards .surf-shape-card__empty {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(152deg, #B8C9C4 0%, #588184 55%, #153E43 100%);
}
.th-p-surfboards .surf-shape-card__empty::before,
.th-p-surfboards .surf-shape-card__empty::after,
.th-p-surfboards .surf-shape-card__empty i,
.th-p-surfboards .surf-shape-card__empty b {
  position: absolute;
  display: block;
  border: 1px solid #F8F5EE66;
  border-radius: 50%;
  content: '';
}
.th-p-surfboards .surf-shape-card__empty::before { width: 165%; height: 31%; top: 13%; left: -29%; transform: rotate(-20deg); }
.th-p-surfboards .surf-shape-card__empty::after { width: 138%; height: 28%; top: 44%; right: -52%; transform: rotate(18deg); }
.th-p-surfboards .surf-shape-card__empty i { width: 118%; height: 24%; bottom: 6%; left: -22%; transform: rotate(-13deg); }
.th-p-surfboards .surf-shape-card__empty b { width: 70%; height: 15%; top: 30%; left: 25%; transform: rotate(24deg); }
.th-p-surfboards .surf-shape-card__wash {
  position: absolute;
  inset: 0;
  z-index: -2;
  background: linear-gradient(0deg, #102B31EE 0%, #102B3178 42%, #102B310A 74%);
}
.th-p-surfboards .surf-shape-card__blank {
  position: absolute;
  z-index: -1;
  top: 17%;
  right: 27%;
  width: 45%;
  height: 57%;
  border: 1px solid #F8F5EE61;
  border-radius: 50% 50% 44% 44% / 12% 12% 19% 19%;
  opacity: .56;
}
.th-p-surfboards .surf-shape-card__copy {
  width: 100%;
  min-width: 0;
}
.th-p-surfboards .surf-shape-card__number,
.th-p-surfboards .surf-shape-card__count {
  display: block;
  color: #F8F5EEC9;
  font: 800 9px/1.2 var(--body);
  letter-spacing: .15em;
  text-transform: uppercase;
}
.th-p-surfboards .surf-shape-card__number { margin-bottom: 35px; color: #F8F5EE99; }
.th-p-surfboards .surf-shape-card__count { margin-bottom: 9px; }
.th-p-surfboards .surf-shape-card h3 {
  margin: 0;
  color: #FFFDF8;
  font: 400 clamp(31px, 3.05vw, 48px)/.91 var(--display);
  letter-spacing: -.045em;
  overflow-wrap: anywhere;
}
.th-p-surfboards .surf-shape-card__link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 9px;
  min-height: 44px;
  margin-top: 20px;
  padding-top: 11px;
  border-top: 1px solid #F8F5EE6B;
  color: #FFFDF8;
  font: 800 9px/1.1 var(--body);
  letter-spacing: .12em;
  text-transform: uppercase;
}
.th-p-surfboards .surf-shape-card__link i {
  color: #FFD8BD;
  font: 400 20px/.8 var(--display);
  font-style: normal;
}
.th-p-surfboards .surf-shape-card:hover { border-color: var(--surf-rust); }
.th-p-surfboards .surf-shape-card:hover .surf-shape-card__wash { background: linear-gradient(0deg, #143D42F2 0%, #143D427D 47%, #143D421F 100%); }
.th-p-surfboards .surf-discovery--products .surf-product-tide {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(12px, 2vw, 24px);
  max-width: 1320px;
  margin: 0 auto;
}
.th-p-surfboards .surf-discovery--products .pc {
  min-width: 0;
  padding-top: 12px;
  border-top: 1px solid #102B3138;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}
.th-p-surfboards .surf-discovery--products .pc .im {
  border-radius: 120px 120px 16px 16px;
  background: #D7DDD6;
}
.th-p-surfboards .surf-discovery--products .pc .bd h3 {
  font-family: var(--display);
  font-weight: 400;
  letter-spacing: -.03em;
}
.th-p-surfboards #shop {
  padding-top: clamp(58px, 7vw, 112px);
  background: var(--surf-paper);
}
.th-p-surfboards #shop .sec-h {
  padding-bottom: 21px;
  border-bottom: 1px solid #102B312B;
}
.th-p-surfboards #shop .sec-h h2 {
  color: var(--surf-ink);
  font-family: var(--display);
  font-weight: 400;
  letter-spacing: -.04em;
}
.th-p-surfboards #shop .chips { gap: 8px; }
.th-p-surfboards #shop .chip {
  min-height: 44px;
  border-radius: 999px;
  font: 800 10px/1 var(--body);
  letter-spacing: .1em;
  text-transform: uppercase;
}
.th-p-surfboards #shop .grid { gap: clamp(18px, 2vw, 28px); }
.th-p-surfboards #shop .pc {
  border-radius: 20px;
  background: var(--surf-sand);
  box-shadow: none;
}
.th-p-surfboards #shop .pc .im { border-radius: 19px 19px 0 0; background: #D9E1D9; }
.th-p-surfboards #shop .pc .bd h3 {
  font-family: var(--display);
  font-weight: 400;
  letter-spacing: -.025em;
}
.th-p-surfboards #shop .pc .pr { color: var(--surf-rust); font-weight: 800; }
.th-p-surfboards .ft { background: var(--surf-deep); color: var(--surf-foam); }
.th-p-surfboards .ft :is(a, p, span) { color: var(--surf-foam); }
.th-p-surfboards .ft h4 { color: #FFD8BD; }
.th-p-surfboards :is(.surf-hero__copy .btn, .surf-hero__tide-index a, .surf-shape-card, .surf-hero .motion-toggle) { -webkit-tap-highlight-color: transparent; }
.th-p-surfboards :is(.surf-hero__copy .btn, .surf-hero__tide-index a, .surf-shape-card, .surf-hero .motion-toggle):focus-visible { outline: 3px solid var(--surf-rust); outline-offset: 4px; }
.th-p-surfboards .surf-hero.has-hero-motion[data-hero-motion="pan"] .surf-hero__media .hero-media { animation: surfboards-pan 18s ease-in-out infinite alternate; }
.th-p-surfboards .surf-hero.has-hero-motion[data-hero-motion="drift"] .surf-hero__media .hero-media { animation: surfboards-drift 15s ease-in-out infinite alternate; }
@keyframes surfboards-pan {
  from { transform: scale(1.035) translate3d(-.8%, 0, 0); }
  to { transform: scale(1.095) translate3d(1.2%, -1%, 0); }
}
@keyframes surfboards-drift {
  from { transform: scale(1.035) translate3d(0, 0, 0); }
  to { transform: scale(1.075) translate3d(-1.2%, -.7%, 0); }
}
@media (max-width: 900px) {
  .th-p-surfboards .surf-hero__stage { min-height: 670px; }
  .th-p-surfboards .surf-hero__copy-wrap { width: min(560px, 64vw); }
  .th-p-surfboards .surf-hero__copy h1 { font-size: clamp(52px, 8.7vw, 80px); }
  .th-p-surfboards .surf-hero__tide-index { width: min(258px, 32vw); }
  .th-p-surfboards .surf-discovery__head { grid-template-columns: 1fr; gap: 15px; }
  .th-p-surfboards .surf-discovery__heading { grid-template-columns: minmax(0, 1.35fr) minmax(160px, .65fr); }
  .th-p-surfboards .surf-shape-archive { grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: 20px; }
  .th-p-surfboards .surf-shape-card { min-height: 430px; }
  .th-p-surfboards .surf-shape-card--2 { transform: translateY(18px); }
  .th-p-surfboards .surf-shape-card--3 { transform: none; }
  .th-p-surfboards .surf-shape-card--4 { transform: translateY(18px); }
}
@media (max-width: 600px) {
  .th-p-surfboards .hd .wrap { min-height: 60px; }
  .th-p-surfboards .hd .nav { display: none; }
  .th-p-surfboards .surf-hero__stage { min-height: 674px; }
  .th-p-surfboards .surf-hero__media .hero-media { object-position: 63% center; }
  .th-p-surfboards .surf-hero__haze { background: linear-gradient(0deg, #F1ECE1F2 0%, #F1ECE1A3 43%, #F1ECE10A 82%); }
  .th-p-surfboards .surf-hero__field-note { top: 26px; right: 21px; font-size: 8px; }
  .th-p-surfboards .surf-hero__copy-wrap { right: 18px; bottom: 102px; left: 18px; width: auto; padding: 26px 24px 28px; clip-path: polygon(0 0, 96% 3%, 100% 97%, 3% 100%); }
  .th-p-surfboards .surf-hero__copy h1,
  .th-p-surfboards .surf-hero__copy h1.long { max-width: 10.8ch; font-size: clamp(46px, 13vw, 63px); line-height: .9; }
  .th-p-surfboards .surf-hero__copy .sub { max-width: 29ch; margin-top: 15px; font-size: 13px; }
  .th-p-surfboards .surf-hero__copy .ctas { display: grid; grid-template-columns: 1fr; margin-top: 20px; }
  .th-p-surfboards .surf-hero__copy .btn { width: 100%; }
  .th-p-surfboards .surf-hero__tide-index { right: 20px; bottom: 18px; left: 20px; width: auto; }
  .th-p-surfboards .surf-hero__tide-index a { min-height: 44px; margin-top: 8px; }
  .th-p-surfboards .surf-hero .motion-toggle { top: 22px; left: 19px; min-width: 44px; padding-right: 9px; padding-left: 9px; font-size: 8px; }
  .th-p-surfboards .surf-discovery { padding: 53px 18px 52px; }
  .th-p-surfboards .surf-discovery__head { margin-bottom: 28px; padding-bottom: 20px; }
  .th-p-surfboards .surf-discovery__eyebrow { margin-top: 0; }
  .th-p-surfboards .surf-discovery__heading { display: grid; grid-template-columns: 1fr; gap: 15px; }
  .th-p-surfboards .surf-discovery__heading h2 { max-width: 12.2ch; font-size: clamp(39px, 11.2vw, 51px); }
  .th-p-surfboards .surf-discovery__heading p { font-size: 13px; }
  .th-p-surfboards .surf-shape-archive { grid-template-columns: 1fr; gap: 14px; }
  .th-p-surfboards .surf-shape-card { min-height: 344px; padding: 20px; border-radius: 138px 138px 20px 20px; }
  .th-p-surfboards .surf-shape-card--2,
  .th-p-surfboards .surf-shape-card--3,
  .th-p-surfboards .surf-shape-card--4 { transform: none; }
  .th-p-surfboards .surf-shape-card__number { margin-bottom: 25px; }
  .th-p-surfboards .surf-shape-card h3 { font-size: 38px; }
  .th-p-surfboards .surf-discovery--products .surf-product-tide { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  .th-p-surfboards .surf-hero.has-hero-motion .surf-hero__media .hero-media { animation: none; transform: none; }
}
`;

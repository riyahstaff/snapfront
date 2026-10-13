import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-camping',
  name: 'Morrow Fieldworks',
  for: 'Campers assembling alpine field kits',
  vibe: 'Cinematic blue-hour camp, field-map wayfinding, warm practical glow',
  category: 'Alpine camping equipment',
  group: 'outdoor',
  display: 'Cormorant Garamond',
  body: 'DM Sans',
  displayWeight: 500,
  tracking: '-.035em',
  colors: {
    bg: '#EEE9DD', surface: '#F7F3EA', ink: '#162015', muted: '#657063', line: '#C7C6B7',
    accent: '#C9753E', onAccent: '#FFF9F0', panel: '#213126', onPanel: '#F5F1E7',
    foot: '#111A12', onFoot: '#F6F1E6', bar: '#2A3A2C', onBar: '#F6F3EA',
    badge: '#E4B77C', onBadge: '#1B2118',
  },
  header: 'split',
  hero: 'overlay',
  card: 'minimal',
  ratio: '4/5',
  rCard: 0,
  rBtn: 0,
  motion: 'pan',
  copy: {
    eyebrow: 'Field equipment for long light',
    collection: 'Choose your ground',
    cta: 'Explore field kits',
    title: 'Leave the last light behind.',
    subtitle: 'Build a camp around the way you move through the outdoors.',
  },
});

const plural = (count, single, many) => `${count} ${count === 1 ? single : many}`;

function categoryVisual(ctx, category) {
  if (category.image) {
    return `<img src="${ctx.esc(category.image)}" alt="" loading="lazy" decoding="async">`;
  }
  return `<div class="camp-kit-card__empty" aria-hidden="true"><span></span><i></i><b></b></div>`;
}

function categoryCard(ctx, category, index) {
  const count = Number(category.count) || 0;
  return `<a class="camp-kit-card camp-kit-card--${index + 1}" href="${ctx.esc(ctx.categoryLink(category.name))}">
    <div class="camp-kit-card__media">${categoryVisual(ctx, category)}</div>
    <div class="camp-kit-card__shade" aria-hidden="true"></div>
    <div class="camp-kit-card__copy">
      <span class="camp-kit-card__index">0${index + 1}</span>
      <h3>${ctx.esc(category.name)}</h3>
      <p>${plural(count, 'piece to explore', 'pieces to explore')}</p>
      <span class="camp-kit-card__link">Explore the collection <i aria-hidden="true">→</i></span>
    </div>
  </a>`;
}

export function hero(ctx) {
  return `<section class="hero category-hero camp-hero${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="camp-hero__scene">${ctx.media(0, { priority: true, lazy: false })}</div>
    <div class="camp-hero__wash" aria-hidden="true"></div>
    <p class="camp-hero__field-note" aria-hidden="true"><span>Equipment</span><span>for a wilder</span><span>tomorrow</span></p>
    <div class="camp-hero__copy-wrap">${ctx.copy('camp-hero__copy')}</div>
    <div class="camp-hero__route" aria-label="Field route markers">
      <span><i aria-hidden="true"></i>Ridge line</span>
      <span><i aria-hidden="true"></i>Lake edge</span>
      <span><i aria-hidden="true"></i>Timber camp</span>
      <span><i aria-hidden="true"></i>Last light</span>
    </div>
    ${ctx.controls}
  </section>`;
}

export function discovery(ctx) {
  const categories = (ctx.cats || []).filter((category) => category?.name).slice(0, 3);
  if (categories.length >= 2) {
    return `<section class="theme-discovery camp-discovery" aria-labelledby="camp-discovery-title">
      <div class="camp-discovery__inner">
        <div class="camp-discovery__intro">
          <p class="camp-discovery__eyebrow">Field kits by terrain</p>
          <div class="camp-discovery__heading">
            <h2 id="camp-discovery-title">Choose your ground.</h2>
            <p>Start with the conditions in front of you, then follow the gear made for that route.</p>
          </div>
        </div>
        <div class="camp-discovery__cards">${categories.map((category, index) => categoryCard(ctx, category, index)).join('')}</div>
      </div>
    </section>`;
  }

  const products = (ctx.products || []).slice(0, 3);
  if (products.length >= 2) {
    return `<section class="theme-discovery camp-discovery camp-discovery--products" aria-labelledby="camp-discovery-title">
      <div class="camp-discovery__inner">
        <div class="camp-discovery__intro">
          <p class="camp-discovery__eyebrow">Start with the field</p>
          <div class="camp-discovery__heading">
            <h2 id="camp-discovery-title">A practical beginning.</h2>
            <p>Browse the pieces currently available, then make the camp your own.</p>
          </div>
        </div>
        <div class="camp-discovery__products">${products.map((product) => ctx.productCard(product)).join('')}</div>
      </div>
    </section>`;
  }

  return '';
}

export const css = `
.th-p-camping {
  --camp-cream: #eee9dd;
  --camp-ink: #162015;
  --camp-night: #111a12;
  --camp-copper: #c9753e;
}
.th-p-camping .hd {
  background: var(--camp-night);
  border-bottom-color: #ffffff24;
}
.th-p-camping .hd :is(.brand, .nav a, .cart) { color: #f6f1e6; }
.th-p-camping .hd .nav a:hover { color: #e4b77c; }
.th-p-camping .camp-hero {
  position: relative;
  isolation: isolate;
  min-height: clamp(580px, 48vw, 760px);
  overflow: hidden;
  display: grid;
  align-items: center;
  color: #f7f3ea;
  background: var(--camp-night);
}
.th-p-camping .camp-hero__scene {
  position: absolute;
  inset: 0;
  z-index: -3;
  overflow: hidden;
  background: #1a281e;
}
.th-p-camping .camp-hero__scene .hero-media {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center center;
}
.th-p-camping .camp-hero__scene .theme-empty-media {
  width: 100%;
  height: 100%;
  min-height: 100%;
  background:
    radial-gradient(circle at 77% 56%, #c9753e66 0 2%, transparent 19%),
    linear-gradient(145deg, #101a15 0%, #274034 45%, #131e19 100%);
  color: #f7f3ea;
}
.th-p-camping .camp-hero__wash {
  position: absolute;
  inset: 0;
  z-index: -2;
  pointer-events: none;
  background: linear-gradient(90deg, #07100de0 0%, #09130c8c 37%, #09130c20 67%, #07100d82 100%), linear-gradient(0deg, #06100bd9 0%, transparent 42%);
}
.th-p-camping .camp-hero__field-note {
  position: absolute;
  z-index: 1;
  top: clamp(92px, 9vw, 132px);
  left: clamp(22px, 3.2vw, 58px);
  display: grid;
  gap: 3px;
  margin: 0;
  color: #f7f3eacc;
  font: 600 9px/1.25 var(--body);
  letter-spacing: .2em;
  text-transform: uppercase;
}
.th-p-camping .camp-hero__field-note::after {
  content: '';
  width: 24px;
  height: 1px;
  margin-top: 15px;
  background: #f7f3eaaa;
}
.th-p-camping .camp-hero__copy-wrap {
  width: min(100% - 176px, 820px);
  margin: 0 auto;
  padding: 120px 0 142px;
  text-align: center;
}
.th-p-camping .camp-hero__copy { max-width: 820px; margin: 0 auto; }
.th-p-camping .camp-hero__copy .eyebrow {
  margin: 0 0 14px;
  color: #f7f3eacc;
  font: 600 10px/1.3 var(--body);
  letter-spacing: .24em;
  text-transform: uppercase;
}
.th-p-camping .camp-hero__copy h1 {
  max-width: 14ch;
  margin: 0 auto;
  color: #fffdf7;
  font: 500 clamp(50px, 5.5vw, 93px)/.91 var(--display);
  letter-spacing: -.045em;
  text-wrap: balance;
}
.th-p-camping .camp-hero__copy h1.long { font-size: clamp(42px, 4.4vw, 76px); }
.th-p-camping .camp-hero__copy .sub {
  max-width: 56ch;
  margin: 20px auto 0;
  color: #f7f3ead9;
  font: 400 clamp(14px, 1.25vw, 17px)/1.55 var(--body);
}
.th-p-camping .camp-hero__copy .ctas {
  justify-content: center;
  gap: 10px;
  margin-top: 28px;
}
.th-p-camping .camp-hero__copy .btn {
  min-height: 44px;
  padding: 13px 19px;
  border: 1px solid #f7f3ea;
  border-radius: 0;
  color: #182016;
  background: #f7f3ea;
  font: 700 10px/1.1 var(--body);
  letter-spacing: .14em;
  text-transform: uppercase;
}
.th-p-camping .camp-hero__copy .btn.ghost {
  color: #f7f3ea;
  background: transparent;
}
.th-p-camping .camp-hero__copy .btn:hover { background: var(--camp-copper); border-color: var(--camp-copper); color: #fff9f0; }
.th-p-camping .camp-hero__route {
  position: absolute;
  z-index: 1;
  right: clamp(22px, 3.2vw, 58px);
  bottom: 20px;
  left: clamp(22px, 3.2vw, 58px);
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  align-items: end;
  padding-top: 20px;
  border-top: 1px dashed #f7f3ea88;
  color: #f7f3ead9;
  font: 600 9px/1.25 var(--body);
  letter-spacing: .15em;
  text-transform: uppercase;
}
.th-p-camping .camp-hero__route span { position: relative; min-width: 0; padding-top: 10px; overflow-wrap: anywhere; }
.th-p-camping .camp-hero__route i {
  position: absolute;
  top: -25px;
  left: 0;
  width: 10px;
  height: 10px;
  border: 1px solid #f7f3ea;
  border-radius: 50%;
  background: #162015;
  box-shadow: 0 0 0 4px #16201580;
}
.th-p-camping .camp-hero .motion-toggle {
  position: absolute;
  z-index: 3;
  right: clamp(22px, 3.2vw, 58px);
  top: clamp(94px, 9vw, 132px);
  min-height: 44px;
  padding: 10px 12px;
  border: 1px solid #f7f3ea77;
  border-radius: 0;
  color: #f7f3ea;
  background: #101a14a8;
  font: 700 9px/1.1 var(--body);
  letter-spacing: .12em;
  text-transform: uppercase;
}
.th-p-camping .camp-discovery {
  padding: clamp(48px, 6vw, 92px) 0 clamp(56px, 7vw, 104px);
  background: var(--camp-cream);
  color: var(--camp-ink);
}
.th-p-camping .camp-discovery__inner { width: min(100% - 48px, 1440px); margin: 0 auto; }
.th-p-camping .camp-discovery__intro {
  display: grid;
  grid-template-columns: minmax(150px, .8fr) minmax(0, 2.2fr);
  gap: 28px;
  align-items: start;
  padding-bottom: 28px;
  border-bottom: 1px solid #16201533;
}
.th-p-camping .camp-discovery__eyebrow {
  margin: 8px 0 0;
  color: var(--muted);
  font: 700 10px/1.3 var(--body);
  letter-spacing: .18em;
  text-transform: uppercase;
}
.th-p-camping .camp-discovery__heading {
  display: flex;
  align-items: baseline;
  gap: clamp(24px, 5vw, 88px);
}
.th-p-camping .camp-discovery__heading h2 {
  flex: 1 1 auto;
  max-width: 13ch;
  margin: 0;
  font: 500 clamp(38px, 4vw, 64px)/.95 var(--display);
  letter-spacing: -.04em;
}
.th-p-camping .camp-discovery__heading p {
  flex: 0 1 30ch;
  margin: 0;
  color: var(--muted);
  font: 400 14px/1.55 var(--body);
}
.th-p-camping .camp-discovery__cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  padding-top: 26px;
}
.th-p-camping .camp-kit-card {
  position: relative;
  isolation: isolate;
  min-height: clamp(300px, 31vw, 466px);
  overflow: hidden;
  color: #fffdf7;
  background: #26382b;
  text-decoration: none;
}
.th-p-camping .camp-kit-card__media { position: absolute; inset: 0; overflow: hidden; background: #26382b; }
.th-p-camping .camp-kit-card__media img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  transition: transform .45s ease;
}
.th-p-camping .camp-kit-card:hover .camp-kit-card__media img { transform: scale(1.035); }
.th-p-camping .camp-kit-card__empty {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(145deg, #667056 0%, #283d33 46%, #1c2922 100%);
}
.th-p-camping .camp-kit-card__empty::before,
.th-p-camping .camp-kit-card__empty::after,
.th-p-camping .camp-kit-card__empty span,
.th-p-camping .camp-kit-card__empty i,
.th-p-camping .camp-kit-card__empty b { content: ''; position: absolute; display: block; border: 1px solid #f4e8cf55; border-radius: 50%; }
.th-p-camping .camp-kit-card__empty::before { width: 138%; height: 72%; left: -20%; bottom: -38%; }
.th-p-camping .camp-kit-card__empty::after { width: 88%; height: 47%; right: -28%; top: 13%; }
.th-p-camping .camp-kit-card__empty span { width: 44%; height: 24%; left: 11%; top: 34%; }
.th-p-camping .camp-kit-card__empty i { width: 65%; height: 35%; left: 24%; top: 53%; }
.th-p-camping .camp-kit-card__empty b { width: 24%; height: 13%; left: 44%; top: 17%; }
.th-p-camping .camp-kit-card__shade { position: absolute; inset: 0; z-index: 1; background: linear-gradient(0deg, #101811ee 0%, #10181162 44%, transparent 75%); }
.th-p-camping .camp-kit-card__copy { position: absolute; z-index: 2; right: 24px; bottom: 23px; left: 24px; }
.th-p-camping .camp-kit-card__index {
  display: block;
  margin-bottom: 46px;
  color: #fffdf7b8;
  font: 700 10px/1 var(--body);
  letter-spacing: .18em;
}
.th-p-camping .camp-kit-card h3 { margin: 0; font: 500 clamp(30px, 2.5vw, 43px)/.94 var(--display); letter-spacing: -.035em; overflow-wrap: anywhere; }
.th-p-camping .camp-kit-card p { margin: 9px 0 0; color: #fffdf7c7; font: 600 9px/1.35 var(--body); letter-spacing: .13em; text-transform: uppercase; }
.th-p-camping .camp-kit-card__link { display: block; margin-top: 22px; font: 700 10px/1.2 var(--body); letter-spacing: .13em; text-transform: uppercase; }
.th-p-camping .camp-kit-card__link i { padding-left: 6px; font-style: normal; }
.th-p-camping .camp-discovery--products .camp-discovery__products {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  padding-top: 26px;
}
.th-p-camping .camp-discovery--products .pc { border-top: 1px solid #16201533; padding-top: 13px; }
.th-p-camping #shop {
  padding-top: clamp(50px, 6vw, 92px);
  background: #f7f3ea;
}
.th-p-camping #shop .sec-h {
  padding-bottom: 20px;
  border-bottom: 1px solid #16201533;
}
.th-p-camping #shop .sec-h h2 {
  font: 500 clamp(36px, 4vw, 60px)/.95 var(--display);
  letter-spacing: -.04em;
}
.th-p-camping #shop .chips { gap: 7px; }
.th-p-camping #shop .chip { min-height: 44px; border-radius: 0; font: 700 10px/1 var(--body); letter-spacing: .11em; text-transform: uppercase; }
.th-p-camping #shop .grid { gap: 22px 14px; }
.th-p-camping #shop .pc { border-top: 1px solid #16201533; padding-top: 12px; }
.th-p-camping #shop .pc .im { border-radius: 0; background: #e2dfd2; }
.th-p-camping #shop .pc .bd h3 { font-family: var(--body); font-weight: 600; letter-spacing: -.02em; }
.th-p-camping #shop .pc .pr { color: var(--camp-copper); font-weight: 700; }
.th-p-camping .ft { background: var(--camp-night); color: #f6f1e6; }
.th-p-camping .ft :is(a, p, span) { color: #f6f1e6; }
.th-p-camping .ft h4 { color: #e4b77c; }
.th-p-camping :is(.camp-hero__copy .btn, .camp-kit-card, .camp-hero .motion-toggle) { -webkit-tap-highlight-color: transparent; }
.th-p-camping :is(.camp-hero__copy .btn, .camp-kit-card, .camp-hero .motion-toggle):focus-visible { outline: 3px solid #e4b77c; outline-offset: 4px; }
@media (max-width: 760px) {
  .th-p-camping .camp-hero { min-height: 660px; align-items: end; }
  .th-p-camping .camp-hero__scene .hero-media { object-position: 58% center; }
  .th-p-camping .camp-hero__wash { background: linear-gradient(0deg, #07100df0 0%, #07100d8a 49%, #07100d15 90%); }
  .th-p-camping .camp-hero__field-note { top: 82px; left: 22px; }
  .th-p-camping .camp-hero__copy-wrap { width: min(100% - 44px, 600px); padding: 122px 0 132px; }
  .th-p-camping .camp-hero__copy h1 { max-width: 12ch; font-size: clamp(48px, 13vw, 69px); }
  .th-p-camping .camp-hero__copy h1.long { font-size: clamp(38px, 10vw, 55px); }
  .th-p-camping .camp-hero__route { bottom: 18px; right: 22px; left: 22px; gap: 10px; font-size: 8px; }
  .th-p-camping .camp-hero .motion-toggle { top: 78px; right: 22px; }
  .th-p-camping .camp-discovery__inner { width: min(100% - 40px, 680px); }
  .th-p-camping .camp-discovery__intro { grid-template-columns: 1fr; gap: 13px; }
  .th-p-camping .camp-discovery__heading { display: grid; gap: 14px; }
  .th-p-camping .camp-discovery__heading p { max-width: 42ch; }
  .th-p-camping .camp-discovery__cards { grid-template-columns: 1fr; }
  .th-p-camping .camp-kit-card { min-height: 390px; }
  .th-p-camping .camp-discovery--products .camp-discovery__products { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 460px) {
  .th-p-camping .camp-hero { min-height: 630px; }
  .th-p-camping .camp-hero__field-note { font-size: 8px; }
  .th-p-camping .camp-hero__copy-wrap { width: min(100% - 36px, 500px); padding-top: 116px; padding-bottom: 135px; }
  .th-p-camping .camp-hero__copy .sub { margin-top: 16px; font-size: 14px; }
  .th-p-camping .camp-hero__copy .ctas { display: grid; grid-template-columns: 1fr; margin-top: 22px; }
  .th-p-camping .camp-hero__copy .btn { display: grid; place-items: center; }
  .th-p-camping .camp-hero__route { grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: 12px; padding-top: 15px; }
  .th-p-camping .camp-hero__route i { top: -20px; }
  .th-p-camping .camp-hero .motion-toggle { min-width: 44px; padding-right: 8px; padding-left: 8px; font-size: 8px; }
  .th-p-camping .camp-discovery { padding-top: 45px; }
  .th-p-camping .camp-discovery__inner { width: min(100% - 32px, 430px); }
  .th-p-camping .camp-discovery__heading h2 { font-size: 43px; }
  .th-p-camping .camp-kit-card { min-height: 330px; }
  .th-p-camping .camp-kit-card__copy { right: 19px; bottom: 19px; left: 19px; }
  .th-p-camping .camp-kit-card__index { margin-bottom: 33px; }
  .th-p-camping .camp-discovery--products .camp-discovery__products { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  .th-p-camping .camp-kit-card__media img { transition: none; }
}
`;

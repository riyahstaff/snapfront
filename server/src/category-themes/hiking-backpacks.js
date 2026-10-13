import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-hiking-backpacks',
  name: 'CAIRN CARRYWORKS',
  for: 'Hikers choosing a pack for the long way',
  vibe: 'Topographic field notes, granite light, and quietly technical trail utility',
  category: 'Hiking backpacks',
  group: 'outdoor',
  display: 'DM Serif Display',
  body: 'Space Grotesk',
  displayWeight: 400,
  tracking: '-.04em',
  colors: {
    bg: '#E8E2CF',
    surface: '#F6F2E8',
    ink: '#1C2B25',
    muted: '#647166',
    line: '#B9B8A8',
    accent: '#C85B35',
    onAccent: '#FFF9F0',
    panel: '#20392F',
    onPanel: '#F7F2E5',
    foot: '#13251F',
    onFoot: '#F5F0E4',
    bar: '#1D342B',
    onBar: '#F7F2E5',
    badge: '#D9B56E',
    onBadge: '#1A2B24',
  },
  header: 'stack',
  hero: 'spotlight',
  card: 'boxed',
  ratio: '4/5',
  rCard: 20,
  rBtn: 999,
  motion: 'pan',
  copy: {
    eyebrow: 'Trail systems, carried well',
    collection: 'The trail index',
    cta: 'Find your next carry',
    title: 'Carry the whole day.',
    subtitle: 'A considered field of packs for the ground ahead.',
  },
});

const countLabel = (count) => `${count} ${count === 1 ? 'piece' : 'pieces'} in the field`;

function categoryImage(ctx, category) {
  if (category.image) {
    return `<img src="${ctx.esc(category.image)}" alt="" loading="lazy" decoding="async">`;
  }
  return `<div class="pack-trail-card__empty" aria-hidden="true"><span></span><i></i><b></b></div>`;
}

function categoryCard(ctx, category, index) {
  const count = Number(category.count) || 0;
  const number = String(index + 1).padStart(2, '0');
  return `<a class="pack-trail-card" href="${ctx.esc(ctx.categoryLink(category.name))}">
    <div class="pack-trail-card__number" aria-hidden="true">${number}</div>
    <div class="pack-trail-card__media">${categoryImage(ctx, category)}</div>
    <div class="pack-trail-card__body">
      <p>${ctx.esc(countLabel(count))}</p>
      <h3>${ctx.esc(category.name)}</h3>
      <span>Open the trail <i aria-hidden="true">↗</i></span>
    </div>
  </a>`;
}

export function hero(ctx) {
  return `<section class="hero category-hero pack-hero${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="pack-hero__landscape">
      ${ctx.media(0, { priority: true, lazy: false })}
    </div>
    <div class="pack-hero__veil" aria-hidden="true"></div>
    <div class="pack-hero__contours" aria-hidden="true"><i></i><i></i><i></i></div>
    <p class="pack-hero__map-mark" aria-hidden="true"><span>Trail</span><span>systems</span><b></b></p>
    <div class="pack-hero__copy-deck">${ctx.copy('pack-hero__copy')}</div>
    <div class="pack-hero__route-key" aria-label="Trail notes">
      <span><i aria-hidden="true"></i>Start light</span>
      <span><i aria-hidden="true"></i>Keep moving</span>
      <span><i aria-hidden="true"></i>Stay out</span>
    </div>
    ${ctx.controls}
  </section>`;
}

export function discovery(ctx) {
  const categories = (ctx.cats || []).filter((category) => category?.name).slice(0, 3);
  if (categories.length >= 2) {
    return `<section class="theme-discovery pack-discovery" aria-labelledby="pack-discovery-title">
      <div class="pack-discovery__inner">
        <div class="pack-discovery__side">
          <p class="pack-discovery__kicker">The trail index</p>
          <span class="pack-discovery__line" aria-hidden="true"></span>
          <p class="pack-discovery__note">Begin with the kind of day you have in mind, then follow the packs currently in that part of the field.</p>
        </div>
        <div class="pack-discovery__main">
          <div class="pack-discovery__heading">
            <p>Route selection</p>
            <h2 id="pack-discovery-title">Begin where you want to go.</h2>
          </div>
          <div class="pack-discovery__cards">${categories.map((category, index) => categoryCard(ctx, category, index)).join('')}</div>
        </div>
      </div>
    </section>`;
  }

  const products = (ctx.products || []).slice(0, 3);
  if (products.length >= 2) {
    return `<section class="theme-discovery pack-discovery pack-discovery--products" aria-labelledby="pack-discovery-title">
      <div class="pack-discovery__inner">
        <div class="pack-discovery__side">
          <p class="pack-discovery__kicker">In the field now</p>
          <span class="pack-discovery__line" aria-hidden="true"></span>
          <p class="pack-discovery__note">A small current edit from the packs available in this store.</p>
        </div>
        <div class="pack-discovery__main">
          <div class="pack-discovery__heading">
            <p>Current carry</p>
            <h2 id="pack-discovery-title">Choose a place to begin.</h2>
          </div>
          <div class="pack-discovery__products">${products.map((product) => ctx.productCard(product)).join('')}</div>
        </div>
      </div>
    </section>`;
  }

  return '';
}

export const css = `
.th-p-hiking-backpacks {
  background: #E8E2CF;
  color: #1C2B25;
  --pack-paper: #E8E2CF;
  --pack-ink: #1C2B25;
  --pack-pine: #20392F;
  --pack-clay: #C85B35;
  --pack-gold: #D9B56E;
}
.th-p-hiking-backpacks .ann {
  border: 0;
  background: #1D342B;
  color: #F7F2E5;
  font: 600 9px/1.2 var(--body);
  letter-spacing: .17em;
  text-transform: uppercase;
}
.th-p-hiking-backpacks .hd {
  border-bottom: 1px solid #1C2B2526;
  background: #F6F2E8;
  color: #1C2B25;
}
.th-p-hiking-backpacks .hd .wrap { min-height: 68px; }
.th-p-hiking-backpacks .hd .brand {
  color: #1C2B25;
  font-family: var(--display);
  font-size: 27px;
  font-weight: 400;
  letter-spacing: -.035em;
}
.th-p-hiking-backpacks .hd :is(.nav a, .cart) {
  color: #1C2B25;
  font: 600 10px/1.2 var(--body);
  letter-spacing: .12em;
  text-transform: uppercase;
}
.th-p-hiking-backpacks .hd .nav a:hover,
.th-p-hiking-backpacks .hd .cart:hover { color: #C85B35; }
.th-p-hiking-backpacks .pack-hero {
  position: relative;
  isolation: isolate;
  min-height: clamp(610px, 50vw, 810px);
  overflow: hidden;
  display: grid;
  align-items: end;
  background: #2B4A3C;
  color: #FFF9F0;
}
.th-p-hiking-backpacks .pack-hero__landscape {
  position: absolute;
  z-index: -4;
  inset: 0;
  overflow: hidden;
  background: #2B4A3C;
}
.th-p-hiking-backpacks .pack-hero__landscape .hero-media,
.th-p-hiking-backpacks .pack-hero__landscape .theme-empty-media {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: block;
  object-fit: cover;
  object-position: center;
}
.th-p-hiking-backpacks .pack-hero__landscape .theme-empty-media {
  background:
    radial-gradient(circle at 72% 48%, #d9b56e55 0 8%, transparent 8.5%),
    linear-gradient(151deg, #5A7862 0%, #28463A 42%, #1A3027 100%);
  color: #F7F2E5;
}
.th-p-hiking-backpacks .pack-hero__veil {
  position: absolute;
  z-index: -3;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(180deg, #11231a22 0%, transparent 35%, #11231a30 53%, #102219ed 100%),
    linear-gradient(90deg, #102219b8 0%, #10221941 39%, transparent 72%);
}
.th-p-hiking-backpacks .pack-hero__contours {
  position: absolute;
  z-index: -2;
  top: -28vw;
  right: -13vw;
  width: min(70vw, 1020px);
  height: min(70vw, 1020px);
  overflow: hidden;
  pointer-events: none;
  opacity: .56;
}
.th-p-hiking-backpacks .pack-hero__contours :is(i, i::before, i::after) {
  position: absolute;
  display: block;
  border: 1px solid #F7F2E57a;
  border-radius: 48% 54% 43% 58%;
  content: '';
}
.th-p-hiking-backpacks .pack-hero__contours i { inset: 7%; transform: rotate(24deg); }
.th-p-hiking-backpacks .pack-hero__contours i::before { inset: 11%; transform: rotate(-19deg); }
.th-p-hiking-backpacks .pack-hero__contours i::after { inset: 16%; transform: rotate(32deg); }
.th-p-hiking-backpacks .pack-hero__contours i:nth-child(2) { inset: 24%; transform: rotate(-16deg); }
.th-p-hiking-backpacks .pack-hero__contours i:nth-child(2)::before { inset: 13%; transform: rotate(34deg); }
.th-p-hiking-backpacks .pack-hero__contours i:nth-child(2)::after { inset: 23%; transform: rotate(-32deg); }
.th-p-hiking-backpacks .pack-hero__contours i:nth-child(3) { inset: 42%; transform: rotate(21deg); }
.th-p-hiking-backpacks .pack-hero__contours i:nth-child(3)::before { inset: -64%; transform: rotate(-31deg); }
.th-p-hiking-backpacks .pack-hero__contours i:nth-child(3)::after { inset: -118%; transform: rotate(19deg); }
.th-p-hiking-backpacks .pack-hero__map-mark {
  position: absolute;
  top: clamp(27px, 4.1vw, 64px);
  left: clamp(22px, 4.7vw, 82px);
  z-index: 1;
  display: grid;
  gap: 2px;
  margin: 0;
  color: #FFF9F0;
  font: 600 9px/1.25 var(--body);
  letter-spacing: .2em;
  text-transform: uppercase;
}
.th-p-hiking-backpacks .pack-hero__map-mark b {
  width: 29px;
  height: 1px;
  display: block;
  margin-top: 13px;
  background: #D9B56E;
}
.th-p-hiking-backpacks .pack-hero__copy-deck {
  position: relative;
  z-index: 1;
  width: min(100% - clamp(44px, 9.4vw, 164px), 1200px);
  margin: 0 auto;
  padding: 164px 0 clamp(116px, 10vw, 168px);
}
.th-p-hiking-backpacks .pack-hero__copy { max-width: 920px; }
.th-p-hiking-backpacks .pack-hero__copy .eyebrow {
  display: flex;
  align-items: center;
  gap: 11px;
  margin: 0 0 18px;
  color: #FFF9F0dc;
  font: 600 10px/1.25 var(--body);
  letter-spacing: .19em;
  text-transform: uppercase;
}
.th-p-hiking-backpacks .pack-hero__copy .eyebrow::before {
  width: 31px;
  height: 1px;
  flex: 0 0 auto;
  content: '';
  background: #D9B56E;
}
.th-p-hiking-backpacks .pack-hero__copy h1 {
  max-width: 10ch;
  margin: 0;
  color: #FFF9F0;
  font: 400 clamp(58px, 8.4vw, 137px)/.82 var(--display);
  letter-spacing: -.058em;
  text-wrap: balance;
  overflow-wrap: anywhere;
}
.th-p-hiking-backpacks .pack-hero__copy h1.long {
  max-width: 14ch;
  font-size: clamp(48px, 6.4vw, 104px);
  line-height: .87;
}
.th-p-hiking-backpacks .pack-hero__copy .sub {
  max-width: 45ch;
  margin: 22px 0 0;
  color: #FFF9F0de;
  font: 400 clamp(14px, 1.25vw, 17px)/1.55 var(--body);
}
.th-p-hiking-backpacks .pack-hero__copy .ctas {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 28px;
}
.th-p-hiking-backpacks .pack-hero__copy .btn {
  min-height: 46px;
  padding: 0 21px;
  border: 1px solid #FFF9F0;
  border-radius: 999px;
  background: #FFF9F0;
  color: #193027;
  font: 700 10px/1 var(--body);
  letter-spacing: .12em;
  text-transform: uppercase;
}
.th-p-hiking-backpacks .pack-hero__copy .btn:hover {
  border-color: #D9B56E;
  background: #D9B56E;
  color: #1C2B25;
}
.th-p-hiking-backpacks .pack-hero__copy .btn.ghost {
  background: transparent;
  color: #FFF9F0;
}
.th-p-hiking-backpacks .pack-hero__copy .btn.ghost:hover { color: #1C2B25; }
.th-p-hiking-backpacks .pack-hero__route-key {
  position: absolute;
  z-index: 1;
  right: clamp(22px, 4.7vw, 82px);
  bottom: 27px;
  left: clamp(22px, 4.7vw, 82px);
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 13px;
  padding-top: 15px;
  border-top: 1px solid #FFF9F06b;
  color: #FFF9F0dd;
  font: 600 9px/1.35 var(--body);
  letter-spacing: .16em;
  text-transform: uppercase;
}
.th-p-hiking-backpacks .pack-hero__route-key span {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 9px;
  overflow-wrap: anywhere;
}
.th-p-hiking-backpacks .pack-hero__route-key i {
  width: 8px;
  height: 8px;
  flex: 0 0 auto;
  display: block;
  border-radius: 50%;
  background: #D9B56E;
  box-shadow: 0 0 0 4px #D9B56E3b;
}
.th-p-hiking-backpacks .pack-hero__route-key span:nth-child(2) i { background: #F6F2E8; box-shadow: 0 0 0 4px #F6F2E83b; }
.th-p-hiking-backpacks .pack-hero__route-key span:nth-child(3) i { background: #C85B35; box-shadow: 0 0 0 4px #C85B353b; }
.th-p-hiking-backpacks .pack-hero .motion-toggle {
  position: absolute;
  z-index: 3;
  top: clamp(20px, 3vw, 44px);
  right: clamp(20px, 3.6vw, 62px);
  min-width: 44px;
  min-height: 44px;
  padding: 0 12px;
  border: 1px solid #FFF9F073;
  border-radius: 999px;
  background: #17302580;
  color: #FFF9F0;
  font: 700 9px/1 var(--body);
  letter-spacing: .12em;
  text-transform: uppercase;
}
.th-p-hiking-backpacks .pack-hero .motion-toggle:hover { border-color: #D9B56E; background: #D9B56E; color: #1C2B25; }
.th-p-hiking-backpacks .pack-discovery {
  overflow: hidden;
  padding: clamp(58px, 7vw, 112px) 0 clamp(62px, 7.5vw, 124px);
  background: #E8E2CF;
  color: #1C2B25;
}
.th-p-hiking-backpacks .pack-discovery__inner {
  width: min(100% - 64px, 1420px);
  display: grid;
  grid-template-columns: minmax(175px, .7fr) minmax(0, 2.5fr);
  gap: clamp(36px, 7vw, 112px);
  margin: 0 auto;
}
.th-p-hiking-backpacks .pack-discovery__side { padding-top: 11px; }
.th-p-hiking-backpacks .pack-discovery__kicker,
.th-p-hiking-backpacks .pack-discovery__heading > p {
  margin: 0;
  color: #C85B35;
  font: 700 10px/1.25 var(--body);
  letter-spacing: .18em;
  text-transform: uppercase;
}
.th-p-hiking-backpacks .pack-discovery__line {
  width: 100%;
  height: 1px;
  display: block;
  margin: 20px 0 18px;
  background: #1C2B2540;
}
.th-p-hiking-backpacks .pack-discovery__note {
  max-width: 22ch;
  margin: 0;
  color: #647166;
  font: 400 13px/1.55 var(--body);
}
.th-p-hiking-backpacks .pack-discovery__heading {
  display: grid;
  grid-template-columns: minmax(120px, .55fr) minmax(0, 1.8fr);
  gap: 30px;
  align-items: start;
  padding-bottom: clamp(31px, 4vw, 52px);
  border-bottom: 1px solid #1C2B2540;
}
.th-p-hiking-backpacks .pack-discovery__heading > p { padding-top: 12px; }
.th-p-hiking-backpacks .pack-discovery h2 {
  max-width: 12ch;
  margin: 0;
  color: #1C2B25;
  font: 400 clamp(43px, 5.5vw, 82px)/.92 var(--display);
  letter-spacing: -.047em;
  text-wrap: balance;
}
.th-p-hiking-backpacks .pack-discovery__cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  padding-top: 18px;
}
.th-p-hiking-backpacks .pack-trail-card {
  position: relative;
  min-width: 0;
  display: grid;
  grid-template-rows: minmax(214px, 1fr) auto;
  overflow: hidden;
  border: 1px solid #1C2B2543;
  border-radius: 20px;
  background: #F6F2E8;
  color: #1C2B25;
  text-decoration: none;
}
.th-p-hiking-backpacks .pack-trail-card:hover { border-color: #C85B35; background: #FFF9F0; }
.th-p-hiking-backpacks .pack-trail-card__number {
  position: absolute;
  z-index: 2;
  top: 13px;
  left: 14px;
  width: 31px;
  height: 31px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #F6F2E8e8;
  color: #1C2B25;
  font: 700 9px/1 var(--body);
  letter-spacing: .08em;
}
.th-p-hiking-backpacks .pack-trail-card__media {
  position: relative;
  min-height: 0;
  overflow: hidden;
  background: #6D806B;
}
.th-p-hiking-backpacks .pack-trail-card__media img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}
.th-p-hiking-backpacks .pack-trail-card__empty {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 218px;
  overflow: hidden;
  background: linear-gradient(145deg, #77917A, #2A493C 70%);
}
.th-p-hiking-backpacks .pack-trail-card__empty :is(span, i, b) {
  position: absolute;
  display: block;
  border: 1px solid #F6F2E88a;
  border-radius: 50%;
}
.th-p-hiking-backpacks .pack-trail-card__empty span { width: 125%; height: 74%; bottom: -36%; left: -14%; }
.th-p-hiking-backpacks .pack-trail-card__empty i { width: 84%; height: 51%; top: 14%; right: -26%; }
.th-p-hiking-backpacks .pack-trail-card__empty b { width: 44%; height: 28%; top: 35%; left: 27%; }
.th-p-hiking-backpacks .pack-trail-card__body { padding: 17px 17px 18px; }
.th-p-hiking-backpacks .pack-trail-card__body p {
  margin: 0 0 22px;
  color: #647166;
  font: 700 9px/1.25 var(--body);
  letter-spacing: .13em;
  text-transform: uppercase;
}
.th-p-hiking-backpacks .pack-trail-card__body h3 {
  min-height: 2.1em;
  margin: 0;
  color: #1C2B25;
  font: 400 clamp(26px, 2.4vw, 39px)/.95 var(--display);
  letter-spacing: -.035em;
  overflow-wrap: anywhere;
}
.th-p-hiking-backpacks .pack-trail-card__body span {
  display: block;
  margin-top: 19px;
  color: #C85B35;
  font: 700 9px/1.25 var(--body);
  letter-spacing: .13em;
  text-transform: uppercase;
}
.th-p-hiking-backpacks .pack-trail-card__body i { padding-left: 4px; font-style: normal; }
.th-p-hiking-backpacks .pack-discovery--products .pack-discovery__products {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  padding-top: 18px;
}
.th-p-hiking-backpacks .pack-discovery--products .pc {
  min-width: 0;
  border: 1px solid #1C2B2543;
  border-radius: 20px;
  background: #F6F2E8;
  box-shadow: none;
}
.th-p-hiking-backpacks .pack-discovery--products .pc:hover { border-color: #C85B35; }
.th-p-hiking-backpacks .pack-discovery--products .pc .im {
  border-bottom: 1px solid #1C2B2543;
  border-radius: 19px 19px 0 0;
  background: #D8D5C8;
}
.th-p-hiking-backpacks .pack-discovery--products .pc .bd { padding: 15px 16px 17px; }
.th-p-hiking-backpacks .pack-discovery--products .pc h3 {
  font-family: var(--display);
  font-weight: 400;
  letter-spacing: -.025em;
}
.th-p-hiking-backpacks .pack-discovery--products .pc .pr { color: #C85B35; font-weight: 700; }
.th-p-hiking-backpacks #shop {
  padding-top: clamp(55px, 7vw, 104px);
  background: #F6F2E8;
}
.th-p-hiking-backpacks #shop .sec-h {
  padding-bottom: 22px;
  border-bottom: 1px solid #1C2B2540;
}
.th-p-hiking-backpacks #shop .sec-h h2 {
  color: #1C2B25;
  font: 400 clamp(42px, 5vw, 76px)/.92 var(--display);
  letter-spacing: -.045em;
}
.th-p-hiking-backpacks #shop .chips { gap: 8px; }
.th-p-hiking-backpacks #shop .chip {
  min-height: 44px;
  border: 1px solid #1C2B2540;
  border-radius: 999px;
  background: transparent;
  color: #1C2B25;
  font: 700 9px/1 var(--body);
  letter-spacing: .12em;
  text-transform: uppercase;
}
.th-p-hiking-backpacks #shop .chip:hover,
.th-p-hiking-backpacks #shop .chip.on { border-color: #1C2B25; background: #1C2B25; color: #F6F2E8; }
.th-p-hiking-backpacks #shop .grid { gap: 25px 16px; }
.th-p-hiking-backpacks #shop .pc {
  border: 1px solid #1C2B2543;
  border-radius: 20px;
  background: #FFF9F0;
  box-shadow: none;
}
.th-p-hiking-backpacks #shop .pc:hover { border-color: #C85B35; }
.th-p-hiking-backpacks #shop .pc .im { border-bottom: 1px solid #1C2B2543; border-radius: 19px 19px 0 0; background: #E1DED2; }
.th-p-hiking-backpacks #shop .pc .bd { padding: 15px 16px 17px; }
.th-p-hiking-backpacks #shop .pc .bd h3 { color: #1C2B25; font-family: var(--display); font-weight: 400; letter-spacing: -.025em; }
.th-p-hiking-backpacks #shop .pc .pr { color: #C85B35; font-weight: 700; }
.th-p-hiking-backpacks .ft { background: #13251F; color: #F5F0E4; }
.th-p-hiking-backpacks .ft :is(a, p, span, h4) { color: #F5F0E4; }
.th-p-hiking-backpacks .ft .brand { font-family: var(--display); font-weight: 400; letter-spacing: -.02em; }
.th-p-hiking-backpacks :is(.pack-hero__copy .btn, .pack-hero .motion-toggle, .pack-trail-card):focus-visible {
  outline: 3px solid #D9B56E;
  outline-offset: 4px;
}
.th-p-hiking-backpacks .pack-hero.has-hero-motion[data-hero-motion="pan"] .pack-hero__landscape .hero-media { animation: hiking-backpacks-pan 18s ease-in-out infinite alternate; }
.th-p-hiking-backpacks .pack-hero.has-hero-motion[data-hero-motion="drift"] .pack-hero__landscape .hero-media { animation: hiking-backpacks-drift 15s ease-in-out infinite alternate; }
@keyframes hiking-backpacks-pan {
  from { transform: scale(1.035) translate3d(-.9%, 0, 0); }
  to { transform: scale(1.09) translate3d(1.1%, -.8%, 0); }
}
@keyframes hiking-backpacks-drift {
  from { transform: scale(1.035) translate3d(0, 0, 0); }
  to { transform: scale(1.075) translate3d(-.8%, -1%, 0); }
}
@media (max-width: 850px) {
  .th-p-hiking-backpacks .pack-hero { min-height: 655px; }
  .th-p-hiking-backpacks .pack-hero__copy-deck { width: min(100% - 56px, 720px); padding-top: 180px; padding-bottom: 152px; }
  .th-p-hiking-backpacks .pack-hero__copy h1 { font-size: clamp(61px, 11vw, 103px); }
  .th-p-hiking-backpacks .pack-hero__contours { top: -10vw; right: -26vw; width: 730px; height: 730px; }
  .th-p-hiking-backpacks .pack-discovery__inner { width: min(100% - 48px, 760px); grid-template-columns: 1fr; gap: 25px; }
  .th-p-hiking-backpacks .pack-discovery__side { display: grid; grid-template-columns: auto 1fr minmax(180px, 270px); gap: 17px; align-items: center; padding: 0; }
  .th-p-hiking-backpacks .pack-discovery__line { margin: 0; }
  .th-p-hiking-backpacks .pack-discovery__note { max-width: none; }
  .th-p-hiking-backpacks .pack-trail-card { grid-template-rows: minmax(190px, 1fr) auto; }
}
@media (max-width: 580px) {
  .th-p-hiking-backpacks .hd .wrap { min-height: 60px; }
  .th-p-hiking-backpacks .hd .nav { display: none; }
  .th-p-hiking-backpacks .pack-hero { min-height: 650px; }
  .th-p-hiking-backpacks .pack-hero__landscape .hero-media { object-position: 61% center; }
  .th-p-hiking-backpacks .pack-hero__veil { background: linear-gradient(180deg, #10221938 0%, #1022190d 28%, #10221943 47%, #102219f2 100%), linear-gradient(90deg, #10221974 0%, transparent 77%); }
  .th-p-hiking-backpacks .pack-hero__map-mark { top: 25px; left: 20px; font-size: 8px; }
  .th-p-hiking-backpacks .pack-hero__copy-deck { width: min(100% - 40px, 460px); padding-top: 153px; padding-bottom: 168px; }
  .th-p-hiking-backpacks .pack-hero__copy .eyebrow { margin-bottom: 14px; font-size: 9px; }
  .th-p-hiking-backpacks .pack-hero__copy h1,
  .th-p-hiking-backpacks .pack-hero__copy h1.long { max-width: 9.5ch; font-size: clamp(55px, 16vw, 72px); line-height: .84; }
  .th-p-hiking-backpacks .pack-hero__copy .sub { margin-top: 17px; font-size: 14px; }
  .th-p-hiking-backpacks .pack-hero__copy .ctas { display: grid; grid-template-columns: 1fr; margin-top: 22px; }
  .th-p-hiking-backpacks .pack-hero__copy .btn { display: grid; place-items: center; min-height: 46px; }
  .th-p-hiking-backpacks .pack-hero__route-key { right: 20px; bottom: 20px; left: 20px; grid-template-columns: 1fr; gap: 8px; padding-top: 12px; font-size: 8px; }
  .th-p-hiking-backpacks .pack-hero .motion-toggle { top: 16px; right: 16px; padding: 0 9px; font-size: 8px; }
  .th-p-hiking-backpacks .pack-hero__contours { top: -58px; right: -228px; width: 530px; height: 530px; opacity: .45; }
  .th-p-hiking-backpacks .pack-discovery { padding: 52px 0 63px; }
  .th-p-hiking-backpacks .pack-discovery__inner { width: min(100% - 32px, 460px); gap: 23px; }
  .th-p-hiking-backpacks .pack-discovery__side { display: block; }
  .th-p-hiking-backpacks .pack-discovery__line { margin: 17px 0 14px; }
  .th-p-hiking-backpacks .pack-discovery__note { max-width: 29ch; }
  .th-p-hiking-backpacks .pack-discovery__heading { display: block; padding-bottom: 25px; }
  .th-p-hiking-backpacks .pack-discovery__heading > p { padding: 0 0 13px; }
  .th-p-hiking-backpacks .pack-discovery h2 { max-width: 10ch; font-size: clamp(43px, 13vw, 58px); }
  .th-p-hiking-backpacks .pack-discovery__cards { grid-template-columns: 1fr; gap: 12px; padding-top: 15px; }
  .th-p-hiking-backpacks .pack-trail-card { grid-template-columns: minmax(132px, .75fr) minmax(0, 1fr); grid-template-rows: 1fr; min-height: 199px; }
  .th-p-hiking-backpacks .pack-trail-card__media { grid-row: 1; }
  .th-p-hiking-backpacks .pack-trail-card__body { grid-column: 2; padding: 18px 16px; }
  .th-p-hiking-backpacks .pack-trail-card__body p { margin-bottom: 19px; font-size: 8px; }
  .th-p-hiking-backpacks .pack-trail-card__body h3 { min-height: 0; font-size: 31px; }
  .th-p-hiking-backpacks .pack-trail-card__body span { margin-top: 17px; font-size: 8px; }
  .th-p-hiking-backpacks .pack-trail-card__empty { min-height: 100%; }
  .th-p-hiking-backpacks .pack-discovery--products .pack-discovery__products { grid-template-columns: 1fr; gap: 12px; padding-top: 15px; }
  .th-p-hiking-backpacks .pack-discovery--products .pc { display: grid; grid-template-columns: 132px minmax(0, 1fr); }
  .th-p-hiking-backpacks .pack-discovery--products .pc .im { grid-row: 1; min-height: 132px; border-right: 1px solid #1C2B2543; border-bottom: 0; border-radius: 19px 0 0 19px; }
  .th-p-hiking-backpacks .pack-discovery--products .pc .bd { grid-column: 2; }
  .th-p-hiking-backpacks #shop .grid { gap: 17px 12px; }
}
@media (prefers-reduced-motion: reduce) {
  .th-p-hiking-backpacks .pack-hero.has-hero-motion .pack-hero__landscape .hero-media { animation: none; transform: none; }
}
`;

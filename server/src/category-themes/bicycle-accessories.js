import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-bicycle-accessories',
  name: 'CARRY / SIGNAL',
  for: 'city riders choosing practical bicycle accessories',
  vibe: 'A rain-slick field station for the essentials that keep a daily ride moving.',
  category: 'Bicycle accessories',
  group: 'outdoor',
  display: 'Archivo Narrow',
  body: 'Manrope',
  displayWeight: 600,
  tracking: '-.045em',
  colors: {
    bg: '#E7E2D8',
    surface: '#F5F2EA',
    ink: '#182120',
    muted: '#67706A',
    line: '#BFC1B5',
    accent: '#BD4D34',
    onAccent: '#FFFFFF',
    panel: '#26302D',
    onPanel: '#F5F2EA',
    foot: '#182120',
    onFoot: '#F5F2EA',
    bar: '#D5D9D0',
    onBar: '#182120',
    badge: '#E0B34C',
    onBadge: '#182120',
  },
  header: 'stack',
  hero: 'spotlight',
  card: 'boxed',
  ratio: '4/5',
  rCard: 14,
  rBtn: 999,
  motion: 'pan',
  copy: {
    eyebrow: 'Field station / daily ride',
    collection: 'Pack for the way out',
    cta: 'See the equipment',
    title: 'Take the useful things.',
    subtitle: 'Considered carry, visibility and small repairs for the ride that keeps going.',
  },
});

const countLabel = (count) => `${count} ${count === 1 ? 'item' : 'items'}`;

export function hero(ctx) {
  const stops = ctx.cats.slice(0, 4);
  const stopRail = stops.length
    ? `<nav class="bicycle-accessories-stop-rail bicycle-accessories-stop-rail-${stops.length}" aria-label="Shop bicycle accessories by category">${stops.map((cat, index) => `<a href="${ctx.categoryLink(cat.name)}"><span class="bicycle-accessories-stop-number">${String(index + 1).padStart(2, '0')}</span><span class="bicycle-accessories-stop-name">${ctx.esc(cat.name)}</span><span class="bicycle-accessories-stop-count">${ctx.esc(countLabel(cat.count))}</span></a>`).join('')}</nav>`
    : '';

  return `<section class="hero category-hero bicycle-accessories-hero${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="bicycle-accessories-hero-stage">
      <div class="bicycle-accessories-hero-media">${ctx.media(0, { priority: true, lazy: false })}</div>
      <div class="bicycle-accessories-route-markers" aria-hidden="true"><span></span><span></span><span></span></div>
      <div class="bicycle-accessories-field-stamp" aria-hidden="true"><span>Ride / daily</span><i></i><span>Carry / signal</span></div>
      ${ctx.copy('bicycle-accessories-copy')}
      ${ctx.controls}
    </div>
    ${stopRail}
  </section>`;
}

export function discovery(ctx) {
  if (!ctx.products.length) return '';

  const stops = ctx.cats.slice(0, 5);
  const categoryIndex = stops.length >= 2
    ? `<div class="bicycle-accessories-index" role="list">${stops.map((cat, index) => `<a class="bicycle-accessories-index-entry" role="listitem" href="${ctx.categoryLink(cat.name)}"><span class="bicycle-accessories-index-number">${String(index + 1).padStart(2, '0')}</span><span class="bicycle-accessories-index-name">${ctx.esc(cat.name)}</span><span class="bicycle-accessories-index-count">${ctx.esc(countLabel(cat.count))}</span><b aria-hidden="true">↗</b></a>`).join('')}</div>`
    : '';
  const products = ctx.products.slice(0, 3).map((product) => ctx.productCard(product)).join('');
  const label = stops.length >= 2 ? 'By what you carry' : 'From the current shelf';

  return `<section class="theme-discovery bicycle-accessories-discovery" aria-labelledby="bicycle-accessories-discovery-title">
    <div class="wrap">
      <div class="bicycle-accessories-discovery-lede">
        <div>
          <p class="bicycle-accessories-kicker">Equipment index</p>
          <h2 id="bicycle-accessories-discovery-title">${ctx.esc(ctx.t.copy?.collection || 'Pack for the way out')}</h2>
        </div>
        <p class="bicycle-accessories-discovery-note">A practical index drawn from the current collection.</p>
      </div>
      ${categoryIndex}
      <div class="bicycle-accessories-shelf-head"><p>${ctx.esc(label)}</p><a href="#shop">View all <span aria-hidden="true">→</span></a></div>
      <div class="bicycle-accessories-products">${products}</div>
    </div>
  </section>`;
}

export const css = `
.th-p-bicycle-accessories {
  background: #E7E2D8;
  color: #182120;
}
.th-p-bicycle-accessories .ann {
  border: 0;
  background: #26302D;
  color: #F5F2EA;
  font: 700 10px/1.2 var(--body);
  letter-spacing: .13em;
  text-transform: uppercase;
}
.th-p-bicycle-accessories .hd {
  border: 0;
  background: #D5D9D0;
  color: #182120;
}
.th-p-bicycle-accessories .hd .wrap {
  min-height: 66px;
}
.th-p-bicycle-accessories .hd .brand {
  color: #182120;
  font-family: var(--display);
  font-size: clamp(21px, 2vw, 28px);
  font-weight: 600;
  letter-spacing: .04em;
  text-transform: uppercase;
}
.th-p-bicycle-accessories .hd .nav a,
.th-p-bicycle-accessories .hd .cart {
  color: #182120;
  font: 700 10px/1.2 var(--body);
  letter-spacing: .1em;
  text-transform: uppercase;
}
.th-p-bicycle-accessories .hd .nav a:hover,
.th-p-bicycle-accessories .hd .cart:hover {
  color: #BD4D34;
}
.th-p-bicycle-accessories .bicycle-accessories-hero {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  background: #26302D;
  color: #F5F2EA;
}
.th-p-bicycle-accessories .bicycle-accessories-hero-stage {
  position: relative;
  min-height: clamp(650px, 55vw, 790px);
  display: grid;
  align-items: center;
  overflow: hidden;
  padding: clamp(88px, 10vw, 148px) max(28px, calc((100vw - 1290px) / 2)) clamp(80px, 9vw, 132px);
}
.th-p-bicycle-accessories .bicycle-accessories-hero-stage::before {
  position: absolute;
  z-index: 1;
  inset: 0;
  content: '';
  background:
    linear-gradient(90deg, rgba(24, 33, 32, .98) 0%, rgba(24, 33, 32, .78) 20%, rgba(24, 33, 32, .16) 54%, rgba(24, 33, 32, .38) 100%),
    linear-gradient(0deg, rgba(24, 33, 32, .94) 0%, rgba(24, 33, 32, .02) 49%);
  pointer-events: none;
}
.th-p-bicycle-accessories .bicycle-accessories-hero-stage::after {
  position: absolute;
  z-index: 2;
  top: 0;
  right: 8%;
  bottom: 0;
  width: 1px;
  content: '';
  background: rgba(245, 242, 234, .32);
  box-shadow: -41vw 0 0 rgba(245, 242, 234, .16), -66vw 0 0 rgba(245, 242, 234, .08);
  pointer-events: none;
}
.th-p-bicycle-accessories .bicycle-accessories-hero-media {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #56635D;
}
.th-p-bicycle-accessories .bicycle-accessories-hero-media .hero-media,
.th-p-bicycle-accessories .bicycle-accessories-hero-media .theme-empty-media {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: block;
  object-fit: cover;
  object-position: center;
}
.th-p-bicycle-accessories .bicycle-accessories-hero-media .theme-empty-media {
  display: grid;
  place-items: center;
  background: linear-gradient(124deg, #31433E 0%, #59665D 48%, #BD4D34 49%, #26302D 100%);
  color: #F5F2EA;
}
.th-p-bicycle-accessories .bicycle-accessories-route-markers {
  position: absolute;
  z-index: 3;
  top: 25px;
  left: max(28px, calc((100vw - 1290px) / 2));
  display: flex;
  gap: 8px;
}
.th-p-bicycle-accessories .bicycle-accessories-route-markers span {
  width: 31px;
  height: 5px;
  display: block;
  background: #E0B34C;
}
.th-p-bicycle-accessories .bicycle-accessories-route-markers span:nth-child(2) {
  background: #BD4D34;
}
.th-p-bicycle-accessories .bicycle-accessories-route-markers span:nth-child(3) {
  background: #F5F2EA;
}
.th-p-bicycle-accessories .bicycle-accessories-field-stamp {
  position: absolute;
  z-index: 3;
  right: max(11%, calc((100vw - 1290px) / 2));
  bottom: 36px;
  display: grid;
  justify-items: end;
  gap: 8px;
  color: rgba(245, 242, 234, .88);
  font: 700 9px/1.2 var(--body);
  letter-spacing: .15em;
  text-align: right;
  text-transform: uppercase;
}
.th-p-bicycle-accessories .bicycle-accessories-field-stamp i {
  width: 94px;
  height: 1px;
  display: block;
  background: #E0B34C;
}
.th-p-bicycle-accessories .bicycle-accessories-copy {
  position: relative;
  z-index: 4;
  width: min(700px, 64%);
  padding: clamp(24px, 3vw, 42px) 0 clamp(18px, 2vw, 27px);
  border-top: 1px solid rgba(245, 242, 234, .64);
}
.th-p-bicycle-accessories .bicycle-accessories-copy .eyebrow {
  margin: 0 0 18px;
  color: #E0B34C;
  font: 800 10px/1.25 var(--body);
  letter-spacing: .18em;
  text-transform: uppercase;
}
.th-p-bicycle-accessories .bicycle-accessories-copy h1 {
  max-width: 11ch;
  margin: 0;
  color: #F5F2EA;
  font-family: var(--display);
  font-size: clamp(64px, 9.4vw, 148px);
  font-weight: 600;
  letter-spacing: -.06em;
  line-height: .78;
  overflow-wrap: anywhere;
  text-transform: uppercase;
}
.th-p-bicycle-accessories .bicycle-accessories-copy h1.long {
  max-width: 12ch;
  font-size: clamp(46px, 6.8vw, 104px);
  line-height: .84;
}
.th-p-bicycle-accessories .bicycle-accessories-copy .sub {
  max-width: 39ch;
  margin: 25px 0 0;
  color: rgba(245, 242, 234, .88);
  font: 500 clamp(13px, 1.15vw, 16px)/1.5 var(--body);
  letter-spacing: .01em;
}
.th-p-bicycle-accessories .bicycle-accessories-copy .ctas {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 27px;
}
.th-p-bicycle-accessories .bicycle-accessories-copy .btn {
  min-height: 46px;
  padding: 0 21px;
  border: 1px solid #F5F2EA;
  border-radius: 999px;
  background: #F5F2EA;
  color: #182120;
  font: 800 10px/1 var(--body);
  letter-spacing: .11em;
  text-transform: uppercase;
}
.th-p-bicycle-accessories .bicycle-accessories-copy .btn:hover {
  border-color: #E0B34C;
  background: #E0B34C;
  color: #182120;
}
.th-p-bicycle-accessories .bicycle-accessories-copy .btn.ghost {
  background: rgba(24, 33, 32, .38);
  color: #F5F2EA;
}
.th-p-bicycle-accessories .bicycle-accessories-copy .btn.ghost:hover {
  border-color: #BD4D34;
  background: #BD4D34;
  color: #FFFFFF;
}
.th-p-bicycle-accessories .bicycle-accessories-hero .motion-toggle {
  position: absolute;
  z-index: 5;
  right: max(28px, calc((100vw - 1290px) / 2));
  top: 20px;
  min-width: 44px;
  min-height: 44px;
  padding: 0 11px;
  border: 1px solid rgba(245, 242, 234, .6);
  border-radius: 999px;
  background: rgba(24, 33, 32, .65);
  color: #F5F2EA;
  font: 800 9px/1 var(--body);
  letter-spacing: .1em;
  text-transform: uppercase;
}
.th-p-bicycle-accessories .bicycle-accessories-hero .motion-toggle:hover {
  border-color: #E0B34C;
  background: #E0B34C;
  color: #182120;
}
.th-p-bicycle-accessories .bicycle-accessories-stop-rail {
  position: relative;
  z-index: 6;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  background: #D5D9D0;
  color: #182120;
}
.th-p-bicycle-accessories .bicycle-accessories-stop-rail-1 {
  grid-template-columns: minmax(0, 1fr);
}
.th-p-bicycle-accessories .bicycle-accessories-stop-rail-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.th-p-bicycle-accessories .bicycle-accessories-stop-rail-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.th-p-bicycle-accessories .bicycle-accessories-stop-rail > a {
  min-width: 0;
  min-height: 91px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-areas: 'number name' 'number count';
  column-gap: 15px;
  align-content: center;
  padding: 17px clamp(18px, 3vw, 48px);
  border-right: 1px solid rgba(24, 33, 32, .22);
  color: inherit;
  text-decoration: none;
}
.th-p-bicycle-accessories .bicycle-accessories-stop-rail > a:hover {
  background: #E0B34C;
}
.th-p-bicycle-accessories .bicycle-accessories-stop-rail > a:last-child {
  border-right: 0;
}
.th-p-bicycle-accessories .bicycle-accessories-stop-number {
  grid-area: number;
  align-self: center;
  color: #BD4D34;
  font: 800 10px/1 var(--body);
  letter-spacing: .1em;
}
.th-p-bicycle-accessories .bicycle-accessories-stop-name {
  grid-area: name;
  min-width: 0;
  color: #182120;
  font: 600 clamp(24px, 2.25vw, 34px)/.9 var(--display);
  letter-spacing: -.025em;
  overflow-wrap: anywhere;
  text-transform: uppercase;
}
.th-p-bicycle-accessories .bicycle-accessories-stop-count {
  grid-area: count;
  margin-top: 7px;
  color: #53605A;
  font: 700 9px/1.2 var(--body);
  letter-spacing: .13em;
  text-transform: uppercase;
}
.th-p-bicycle-accessories .bicycle-accessories-discovery {
  overflow: hidden;
  padding: clamp(58px, 7.5vw, 112px) 0 clamp(46px, 6vw, 90px);
  background: #E7E2D8;
}
.th-p-bicycle-accessories .bicycle-accessories-discovery-lede {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 30px;
  margin-bottom: clamp(28px, 4vw, 54px);
}
.th-p-bicycle-accessories .bicycle-accessories-kicker {
  margin: 0 0 10px;
  color: #BD4D34;
  font: 800 10px/1.2 var(--body);
  letter-spacing: .17em;
  text-transform: uppercase;
}
.th-p-bicycle-accessories .bicycle-accessories-discovery h2 {
  max-width: 11ch;
  margin: 0;
  color: #182120;
  font: 600 clamp(48px, 6.3vw, 90px)/.82 var(--display);
  letter-spacing: -.05em;
  overflow-wrap: anywhere;
  text-transform: uppercase;
}
.th-p-bicycle-accessories .bicycle-accessories-discovery-note {
  max-width: 29ch;
  margin: 0 0 2px;
  color: #67706A;
  font: 600 11px/1.5 var(--body);
  letter-spacing: .045em;
}
.th-p-bicycle-accessories .bicycle-accessories-index {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border-top: 1px solid #182120;
  border-left: 1px solid #182120;
}
.th-p-bicycle-accessories .bicycle-accessories-index-entry {
  min-width: 0;
  min-height: 84px;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto 24px;
  gap: 12px;
  align-items: center;
  padding: 14px clamp(16px, 2.3vw, 33px);
  border-right: 1px solid #182120;
  border-bottom: 1px solid #182120;
  background: #F5F2EA;
  color: #182120;
  text-decoration: none;
}
.th-p-bicycle-accessories .bicycle-accessories-index-entry:hover {
  background: #26302D;
  color: #F5F2EA;
}
.th-p-bicycle-accessories .bicycle-accessories-index-number {
  color: #BD4D34;
  font: 800 10px/1 var(--body);
  letter-spacing: .1em;
}
.th-p-bicycle-accessories .bicycle-accessories-index-name {
  min-width: 0;
  font: 600 clamp(24px, 2.35vw, 35px)/.9 var(--display);
  letter-spacing: -.025em;
  overflow-wrap: anywhere;
  text-transform: uppercase;
}
.th-p-bicycle-accessories .bicycle-accessories-index-count {
  color: #67706A;
  font: 800 9px/1.2 var(--body);
  letter-spacing: .11em;
  text-align: right;
  text-transform: uppercase;
  white-space: nowrap;
}
.th-p-bicycle-accessories .bicycle-accessories-index-entry:hover .bicycle-accessories-index-count {
  color: rgba(245, 242, 234, .7);
}
.th-p-bicycle-accessories .bicycle-accessories-index-entry b {
  color: #BD4D34;
  font: 400 24px/.7 var(--display);
}
.th-p-bicycle-accessories .bicycle-accessories-shelf-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-top: clamp(43px, 6vw, 81px);
  padding-bottom: 14px;
  border-bottom: 1px solid #182120;
}
.th-p-bicycle-accessories .bicycle-accessories-shelf-head p,
.th-p-bicycle-accessories .bicycle-accessories-shelf-head a {
  margin: 0;
  color: #182120;
  font: 800 10px/1.2 var(--body);
  letter-spacing: .14em;
  text-decoration: none;
  text-transform: uppercase;
}
.th-p-bicycle-accessories .bicycle-accessories-shelf-head a {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #BD4D34;
}
.th-p-bicycle-accessories .bicycle-accessories-shelf-head a:hover {
  color: #182120;
}
.th-p-bicycle-accessories .bicycle-accessories-shelf-head a span {
  font-size: 18px;
}
.th-p-bicycle-accessories .bicycle-accessories-products {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  padding-top: 14px;
}
.th-p-bicycle-accessories .bicycle-accessories-products .pc {
  min-width: 0;
  border: 1px solid #BFC1B5;
  border-radius: 14px;
  background: #F5F2EA;
  box-shadow: none;
  color: #182120;
}
.th-p-bicycle-accessories .bicycle-accessories-products .pc:hover {
  border-color: #182120;
  background: #FFFFFF;
}
.th-p-bicycle-accessories .bicycle-accessories-products .pc .im {
  position: relative;
  min-height: 0;
  aspect-ratio: 1.14 / 1;
  overflow: hidden;
  border-radius: 13px 13px 0 0;
  background: #D5D9D0;
}
.th-p-bicycle-accessories .bicycle-accessories-products .pc .im img,
.th-p-bicycle-accessories .bicycle-accessories-products .pc .im .noimg {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
}
.th-p-bicycle-accessories .bicycle-accessories-products .pc .im .noimg {
  background: linear-gradient(135deg, #D5D9D0, #F5F2EA);
}
.th-p-bicycle-accessories .bicycle-accessories-products .pc .tag {
  top: 11px;
  left: 11px;
  border-radius: 999px;
  background: #26302D;
  color: #F5F2EA;
  font: 800 8px/1 var(--body);
  letter-spacing: .1em;
  text-transform: uppercase;
}
.th-p-bicycle-accessories .bicycle-accessories-products .pc .go {
  right: 12px;
  bottom: 12px;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border: 1px solid #182120;
  border-radius: 50%;
  background: #F5F2EA;
  color: transparent;
  font-size: 0;
}
.th-p-bicycle-accessories .bicycle-accessories-products .pc .go::after {
  content: '↗';
  color: #182120;
  font: 400 23px/.8 var(--display);
}
.th-p-bicycle-accessories .bicycle-accessories-products .pc .bd {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 14px;
  align-items: end;
  padding: 18px;
}
.th-p-bicycle-accessories .bicycle-accessories-products .pc h3 {
  margin: 0;
  color: inherit;
  font: 600 clamp(27px, 2.55vw, 38px)/.88 var(--display);
  letter-spacing: -.03em;
  overflow-wrap: anywhere;
  text-transform: uppercase;
}
.th-p-bicycle-accessories .bicycle-accessories-products .pc .pr {
  color: inherit;
  font: 800 10px/1.15 var(--body);
  letter-spacing: .07em;
  text-align: right;
}
.th-p-bicycle-accessories .bicycle-accessories-products .pc .rt {
  grid-column: 1 / -1;
  color: #BD4D34;
}
.th-p-bicycle-accessories .sec {
  background: #E7E2D8;
}
.th-p-bicycle-accessories .sec > .wrap > .sec-h {
  border-color: #BFC1B5;
}
.th-p-bicycle-accessories .sec > .wrap > .sec-h h2 {
  color: #182120;
  font-family: var(--display);
  font-weight: 600;
  letter-spacing: -.04em;
  text-transform: uppercase;
}
.th-p-bicycle-accessories .chips .chip {
  min-height: 44px;
  border-radius: 999px;
  font: 800 10px/1 var(--body);
  letter-spacing: .09em;
  text-transform: uppercase;
}
.th-p-bicycle-accessories .grid .pc {
  border-radius: 14px;
}
.th-p-bicycle-accessories .ft {
  background: #182120;
  color: #F5F2EA;
}
.th-p-bicycle-accessories .ft a,
.th-p-bicycle-accessories .ft h4 {
  color: #F5F2EA;
}
.th-p-bicycle-accessories .ft .brand {
  font-family: var(--display);
  font-weight: 600;
  letter-spacing: .05em;
  text-transform: uppercase;
}
.th-p-bicycle-accessories .bicycle-accessories-hero.has-hero-motion[data-hero-motion="pan"] .bicycle-accessories-hero-media .hero-media {
  animation: bicycle-accessories-pan 18s ease-in-out infinite alternate;
}
.th-p-bicycle-accessories .bicycle-accessories-hero.has-hero-motion[data-hero-motion="drift"] .bicycle-accessories-hero-media .hero-media {
  animation: bicycle-accessories-drift 15s ease-in-out infinite alternate;
}
@keyframes bicycle-accessories-pan {
  from { transform: scale(1.03) translate3d(-1.2%, 0, 0); }
  to { transform: scale(1.09) translate3d(1.2%, -1%, 0); }
}
@keyframes bicycle-accessories-drift {
  from { transform: scale(1.03) translate3d(0, 0, 0); }
  to { transform: scale(1.08) translate3d(-1.1%, -1%, 0); }
}
@media (max-width: 920px) {
  .th-p-bicycle-accessories .bicycle-accessories-hero-stage {
    min-height: 675px;
    padding: 112px 42px 100px;
  }
  .th-p-bicycle-accessories .bicycle-accessories-copy {
    width: min(670px, 76%);
  }
  .th-p-bicycle-accessories .bicycle-accessories-copy h1 {
    font-size: clamp(62px, 11.5vw, 110px);
  }
  .th-p-bicycle-accessories .bicycle-accessories-stop-rail {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .th-p-bicycle-accessories .bicycle-accessories-stop-rail-1 {
    grid-template-columns: minmax(0, 1fr);
  }
  .th-p-bicycle-accessories .bicycle-accessories-stop-rail > a:nth-child(2n) {
    border-right: 0;
  }
  .th-p-bicycle-accessories .bicycle-accessories-stop-rail > a:nth-child(-n + 2) {
    border-bottom: 1px solid rgba(24, 33, 32, .22);
  }
  .th-p-bicycle-accessories .bicycle-accessories-index-entry {
    grid-template-columns: 35px minmax(0, 1fr) auto;
  }
  .th-p-bicycle-accessories .bicycle-accessories-index-entry b {
    display: none;
  }
  .th-p-bicycle-accessories .bicycle-accessories-products .pc .bd {
    grid-template-columns: 1fr;
  }
  .th-p-bicycle-accessories .bicycle-accessories-products .pc .pr {
    text-align: left;
  }
}
@media (max-width: 560px) {
  .th-p-bicycle-accessories .hd .wrap {
    min-height: 59px;
  }
  .th-p-bicycle-accessories .hd .nav {
    display: none;
  }
  .th-p-bicycle-accessories .bicycle-accessories-hero-stage {
    min-height: 600px;
    align-items: end;
    padding: 100px 20px 84px;
  }
  .th-p-bicycle-accessories .bicycle-accessories-hero-stage::before {
    background:
      linear-gradient(90deg, rgba(24, 33, 32, .94) 0%, rgba(24, 33, 32, .47) 79%, rgba(24, 33, 32, .4) 100%),
      linear-gradient(0deg, rgba(24, 33, 32, .98) 0%, rgba(24, 33, 32, .06) 64%);
  }
  .th-p-bicycle-accessories .bicycle-accessories-hero-stage::after {
    right: 20px;
    box-shadow: -48vw 0 0 rgba(245, 242, 234, .11);
  }
  .th-p-bicycle-accessories .bicycle-accessories-hero-media .hero-media {
    object-position: 57% center;
  }
  .th-p-bicycle-accessories .bicycle-accessories-route-markers {
    top: 22px;
    left: 20px;
  }
  .th-p-bicycle-accessories .bicycle-accessories-route-markers span {
    width: 22px;
    height: 4px;
  }
  .th-p-bicycle-accessories .bicycle-accessories-field-stamp {
    display: none;
  }
  .th-p-bicycle-accessories .bicycle-accessories-copy {
    width: 100%;
    padding-top: 18px;
  }
  .th-p-bicycle-accessories .bicycle-accessories-copy .eyebrow {
    margin-bottom: 14px;
    font-size: 9px;
  }
  .th-p-bicycle-accessories .bicycle-accessories-copy h1,
  .th-p-bicycle-accessories .bicycle-accessories-copy h1.long {
    max-width: 10ch;
    font-size: clamp(53px, 16.8vw, 75px);
    line-height: .8;
  }
  .th-p-bicycle-accessories .bicycle-accessories-copy .sub {
    max-width: 31ch;
    margin-top: 19px;
    font-size: 13px;
  }
  .th-p-bicycle-accessories .bicycle-accessories-copy .ctas {
    margin-top: 21px;
  }
  .th-p-bicycle-accessories .bicycle-accessories-copy .btn {
    min-height: 44px;
    padding: 0 17px;
  }
  .th-p-bicycle-accessories .bicycle-accessories-hero .motion-toggle {
    top: 14px;
    right: 12px;
    padding: 0 9px;
    font-size: 8px;
  }
  .th-p-bicycle-accessories .bicycle-accessories-stop-rail {
    grid-template-columns: 1fr;
  }
  .th-p-bicycle-accessories .bicycle-accessories-stop-rail > a,
  .th-p-bicycle-accessories .bicycle-accessories-stop-rail > a:nth-child(2n) {
    min-height: 64px;
    padding: 11px 20px;
    border-right: 0;
    border-bottom: 1px solid rgba(24, 33, 32, .22);
  }
  .th-p-bicycle-accessories .bicycle-accessories-stop-rail > a:nth-child(n + 3) {
    display: none;
  }
  .th-p-bicycle-accessories .bicycle-accessories-stop-rail > a:last-child {
    border-bottom: 0;
  }
  .th-p-bicycle-accessories .bicycle-accessories-stop-name {
    font-size: 25px;
  }
  .th-p-bicycle-accessories .bicycle-accessories-stop-count {
    margin-top: 4px;
  }
  .th-p-bicycle-accessories .bicycle-accessories-discovery {
    padding: 51px 0 42px;
  }
  .th-p-bicycle-accessories .bicycle-accessories-discovery-lede {
    display: block;
    margin-bottom: 30px;
  }
  .th-p-bicycle-accessories .bicycle-accessories-discovery h2 {
    max-width: 10ch;
    font-size: 57px;
  }
  .th-p-bicycle-accessories .bicycle-accessories-discovery-note {
    margin-top: 18px;
  }
  .th-p-bicycle-accessories .bicycle-accessories-index {
    grid-template-columns: 1fr;
  }
  .th-p-bicycle-accessories .bicycle-accessories-index-entry {
    min-height: 70px;
    grid-template-columns: 31px minmax(0, 1fr) auto;
    gap: 9px;
    padding: 12px 14px;
  }
  .th-p-bicycle-accessories .bicycle-accessories-index-name {
    font-size: 27px;
  }
  .th-p-bicycle-accessories .bicycle-accessories-index-count {
    font-size: 8px;
  }
  .th-p-bicycle-accessories .bicycle-accessories-shelf-head {
    margin-top: 42px;
  }
  .th-p-bicycle-accessories .bicycle-accessories-products {
    grid-template-columns: 1fr;
  }
  .th-p-bicycle-accessories .bicycle-accessories-products .pc .bd {
    grid-template-columns: minmax(0, 1fr) auto;
    padding: 16px;
  }
  .th-p-bicycle-accessories .bicycle-accessories-products .pc .pr {
    text-align: right;
  }
  .th-p-bicycle-accessories .bicycle-accessories-products .pc h3 {
    font-size: 31px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .th-p-bicycle-accessories .bicycle-accessories-hero.has-hero-motion .bicycle-accessories-hero-media .hero-media {
    animation: none;
    transform: none;
  }
}
`;

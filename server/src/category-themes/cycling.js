import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-cycling',
  name: 'VELO NOCTURNE',
  for: 'performance cycling and bicycles',
  vibe: 'Nocturnal track precision with mechanical, race-line energy.',
  category: 'Performance bicycles and cycling gear',
  group: 'outdoor',
  display: 'Barlow Condensed',
  body: 'DM Sans',
  displayWeight: 700,
  tracking: '-.045em',
  colors: {
    bg: '#F4F3EF',
    surface: '#E8E6E1',
    ink: '#111214',
    muted: '#687078',
    line: '#C9C8C3',
    accent: '#E9513D',
    onAccent: '#FFFFFF',
    panel: '#111214',
    onPanel: '#F4F3EF',
    foot: '#101114',
    onFoot: '#F4F3EF',
    bar: '#101114',
    onBar: '#F4F3EF',
    badge: '#E9513D',
    onBadge: '#FFFFFF',
  },
  header: 'split',
  hero: 'editorial',
  card: 'bold',
  ratio: '4/5',
  rCard: 0,
  rBtn: 0,
  motion: 'pan',
  copy: {
    eyebrow: 'Precision culture',
    collection: 'Choose your machine',
    cta: 'Explore the line',
    title: 'Own the line after dark.',
    subtitle: 'Purposeful forms for the ride ahead.',
  },
});

const plural = (count, singular, many = `${singular}s`) => `${count} ${count === 1 ? singular : many}`;

export function hero(ctx) {
  const laneCats = ctx.cats.slice(0, 3);
  const lanes = laneCats.length > 1
    ? `<nav class="cycling-rail cycling-rail-${laneCats.length}" aria-label="Shop by cycling category">${laneCats.map((cat, index) => `<a href="${ctx.categoryLink(cat.name)}"><span class="cycling-rail-number">${String(index + 1).padStart(2, '0')}</span><span><b>${ctx.esc(cat.name)}</b><small>${ctx.esc(plural(cat.count, 'product'))}</small></span></a>`).join('')}<a class="cycling-rail-shop" href="#shop"><span>Explore the lineup</span><i aria-hidden="true">↗</i></a></nav>`
    : '';

  return `<section class="hero category-hero cycling-hero${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="cycling-stage">
      <div class="cycling-media">${ctx.media(0, { priority: true, lazy: false })}</div>
      <div class="cycling-grain" aria-hidden="true"></div>
      ${ctx.copy('cycling-copy')}
      <div class="cycling-annotation cycling-annotation-top" aria-hidden="true"><span></span>People<br>planet<br>progress</div>
      <div class="cycling-annotation cycling-annotation-bottom" aria-hidden="true"><span></span>Precision<br>culture<br>movement</div>
      ${ctx.controls}
    </div>
    ${lanes}
  </section>`;
}

export function discovery(ctx) {
  if (!ctx.products.length) return '';

  const cards = ctx.products.slice(0, 3).map((product) => ctx.productCard(product)).join('');
  const categoryNote = ctx.cats.length > 1
    ? `<p class="cycling-index-note">${ctx.esc(`${ctx.cats.length} active ${ctx.cats.length === 1 ? 'category' : 'categories'}`)}</p>`
    : '<p class="cycling-index-note">A current edit from the catalogue</p>';

  return `<section class="theme-discovery cycling-discovery" aria-labelledby="cycling-lineup-title">
    <div class="wrap">
      <div class="cycling-discovery-head">
        <div><p class="cycling-kicker">Current line</p><h2 id="cycling-lineup-title">${ctx.esc(ctx.t.copy?.collection || 'Choose your machine')}</h2></div>
        ${categoryNote}
      </div>
      <div class="cycling-products">${cards}</div>
    </div>
  </section>`;
}

export const css = `
.th-p-cycling {
  background: #F4F3EF;
  color: #111214;
}
.th-p-cycling .ann {
  background: #101114;
  color: #F4F3EF;
  border: 0;
  font: 600 10px/1.2 var(--body);
  letter-spacing: .13em;
  text-transform: uppercase;
}
.th-p-cycling .hd {
  background: #101114;
  color: #F4F3EF;
  border: 0;
}
.th-p-cycling .hd .wrap {
  min-height: 64px;
}
.th-p-cycling .hd .brand {
  color: #F4F3EF;
  font-family: var(--display);
  font-size: 24px;
  font-weight: 700;
  letter-spacing: .14em;
}
.th-p-cycling .hd .nav a,
.th-p-cycling .hd .cart {
  color: #F4F3EF;
  font-family: var(--body);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: .08em;
  text-transform: uppercase;
}
.th-p-cycling .hd .nav a:hover,
.th-p-cycling .hd .cart:hover {
  color: #E9513D;
}
.th-p-cycling .cycling-hero {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  background: #101114;
  color: #111214;
}
.th-p-cycling .cycling-stage {
  position: relative;
  min-height: clamp(540px, 43vw, 680px);
  display: flex;
  align-items: flex-end;
  padding: clamp(40px, 6vw, 94px) max(5vw, calc((100vw - 1320px) / 2));
  overflow: hidden;
}
.th-p-cycling .cycling-media {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #D9D8D4;
}
.th-p-cycling .cycling-media::after {
  position: absolute;
  inset: 0;
  z-index: 1;
  content: '';
  background: linear-gradient(90deg, rgba(244, 243, 239, .96) 0%, rgba(244, 243, 239, .72) 29%, rgba(244, 243, 239, .16) 58%, rgba(7, 9, 12, .14) 100%);
  pointer-events: none;
}
.th-p-cycling .cycling-media .hero-media,
.th-p-cycling .cycling-media .theme-empty-media {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: block;
  object-fit: cover;
  object-position: center;
}
.th-p-cycling .cycling-media .theme-empty-media {
  display: grid;
  place-items: center;
  background: linear-gradient(126deg, #D9D8D4 0%, #F4F3EF 47%, #686E72 100%);
  color: #111214;
}
.th-p-cycling .cycling-grain {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  opacity: .14;
  background-image: repeating-linear-gradient(110deg, transparent 0 10px, rgba(17, 18, 20, .16) 11px 12px, transparent 13px 26px);
  mix-blend-mode: multiply;
}
.th-p-cycling .cycling-copy {
  position: relative;
  z-index: 2;
  width: min(680px, 58%);
  padding-bottom: 4px;
}
.th-p-cycling .cycling-copy .eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 18px;
  color: #272A2D;
  font: 700 10px/1.2 var(--body);
  letter-spacing: .18em;
  text-transform: uppercase;
}
.th-p-cycling .cycling-copy .eyebrow::before {
  width: 28px;
  height: 2px;
  content: '';
  background: #E9513D;
}
.th-p-cycling .cycling-copy h1 {
  max-width: 7.5ch;
  margin: 0;
  color: #111214;
  font-family: var(--display);
  font-size: clamp(64px, 9.3vw, 158px);
  font-weight: 700;
  letter-spacing: -.06em;
  line-height: .78;
  text-transform: uppercase;
  text-wrap: balance;
}
.th-p-cycling .cycling-copy h1.long {
  font-size: clamp(52px, 6.9vw, 112px);
  line-height: .82;
}
.th-p-cycling .cycling-copy .sub {
  width: min(35ch, 100%);
  margin: 24px 0 0;
  color: #272A2D;
  font: 500 clamp(13px, 1.2vw, 16px)/1.45 var(--body);
  letter-spacing: .01em;
}
.th-p-cycling .cycling-copy .ctas {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 27px;
}
.th-p-cycling .cycling-copy .btn {
  min-height: 46px;
  padding: 0 21px;
  border: 1px solid #111214;
  border-radius: 0;
  background: #111214;
  color: #F4F3EF;
  font: 700 11px/1 var(--body);
  letter-spacing: .12em;
  text-transform: uppercase;
}
.th-p-cycling .cycling-copy .btn:hover {
  border-color: #E9513D;
  background: #E9513D;
  color: #FFFFFF;
}
.th-p-cycling .cycling-copy .btn.ghost {
  background: transparent;
  color: #111214;
}
.th-p-cycling .cycling-copy .btn.ghost:hover {
  color: #FFFFFF;
}
.th-p-cycling .cycling-annotation {
  position: absolute;
  z-index: 2;
  color: rgba(244, 243, 239, .88);
  font: 700 8px/1.55 var(--body);
  letter-spacing: .16em;
  text-transform: uppercase;
}
.th-p-cycling .cycling-annotation span {
  display: block;
  width: 2px;
  height: 18px;
  margin: 0 0 9px 7px;
  background: #E9513D;
  transform: skewX(-27deg);
}
.th-p-cycling .cycling-annotation-top {
  top: 19%;
  right: max(4.5vw, calc((100vw - 1320px) / 2));
}
.th-p-cycling .cycling-annotation-bottom {
  bottom: 10%;
  right: max(7vw, calc((100vw - 1320px) / 2 + 48px));
}
.th-p-cycling .cycling-hero .motion-toggle {
  position: absolute;
  z-index: 3;
  right: max(3vw, calc((100vw - 1320px) / 2));
  bottom: 24px;
  min-width: 44px;
  min-height: 44px;
  padding: 0 12px;
  border: 1px solid rgba(244, 243, 239, .48);
  border-radius: 0;
  background: rgba(16, 17, 20, .7);
  color: #F4F3EF;
  font: 700 9px/1 var(--body);
  letter-spacing: .1em;
  text-transform: uppercase;
}
.th-p-cycling .cycling-hero .motion-toggle:hover {
  background: #E9513D;
  border-color: #E9513D;
}
.th-p-cycling .cycling-rail {
  position: relative;
  z-index: 3;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr)) minmax(190px, .72fr);
  background: #101114;
  color: #F4F3EF;
}
.th-p-cycling .cycling-rail-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr)) minmax(190px, .72fr);
}
.th-p-cycling .cycling-rail > a {
  min-height: 88px;
  display: flex;
  align-items: center;
  gap: 25px;
  padding: 17px clamp(18px, 3.5vw, 56px);
  border-right: 1px solid rgba(244, 243, 239, .42);
  color: inherit;
  text-decoration: none;
}
.th-p-cycling .cycling-rail > a:hover {
  background: #262A2E;
}
.th-p-cycling .cycling-rail-number {
  color: #B3B6B4;
  font: 600 10px/1 var(--body);
  letter-spacing: .1em;
}
.th-p-cycling .cycling-rail b,
.th-p-cycling .cycling-rail small {
  display: block;
}
.th-p-cycling .cycling-rail b {
  color: #F4F3EF;
  font: 700 clamp(20px, 2.1vw, 30px)/.9 var(--display);
  letter-spacing: .08em;
  text-transform: uppercase;
  overflow-wrap: anywhere;
}
.th-p-cycling .cycling-rail small {
  margin-top: 6px;
  color: #B3B6B4;
  font: 600 9px/1.2 var(--body);
  letter-spacing: .15em;
  text-transform: uppercase;
}
.th-p-cycling .cycling-rail > .cycling-rail-shop {
  justify-content: space-between;
  gap: 15px;
  border: 0;
  background: #E9513D;
  color: #FFFFFF;
  font: 700 11px/1.2 var(--body);
  letter-spacing: .1em;
  text-transform: uppercase;
}
.th-p-cycling .cycling-rail > .cycling-rail-shop:hover {
  background: #F4F3EF;
  color: #111214;
}
.th-p-cycling .cycling-rail-shop i {
  font: 400 27px/.8 var(--display);
  font-style: normal;
}
.th-p-cycling .cycling-discovery {
  overflow: hidden;
  padding: clamp(52px, 6.8vw, 104px) 0 clamp(42px, 5vw, 78px);
  background: #F4F3EF;
}
.th-p-cycling .cycling-discovery-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: clamp(30px, 4vw, 54px);
  padding-bottom: 18px;
  border-bottom: 1px solid #C9C8C3;
}
.th-p-cycling .cycling-kicker {
  margin: 0 0 8px;
  color: #E9513D;
  font: 700 10px/1.2 var(--body);
  letter-spacing: .17em;
  text-transform: uppercase;
}
.th-p-cycling .cycling-discovery h2 {
  max-width: 15ch;
  margin: 0;
  color: #111214;
  font-family: var(--display);
  font-size: clamp(42px, 5.3vw, 78px);
  font-weight: 700;
  letter-spacing: -.05em;
  line-height: .82;
  text-transform: uppercase;
}
.th-p-cycling .cycling-index-note {
  max-width: 22ch;
  margin: 0 0 3px;
  color: #687078;
  font: 600 10px/1.45 var(--body);
  letter-spacing: .13em;
  text-align: right;
  text-transform: uppercase;
}
.th-p-cycling .cycling-products {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 1px solid #111214;
  border-left: 1px solid #111214;
}
.th-p-cycling .cycling-products .pc {
  min-width: 0;
  display: grid;
  grid-template-rows: auto auto;
  padding: clamp(15px, 2vw, 28px);
  border: 0;
  border-right: 1px solid #111214;
  border-bottom: 1px solid #111214;
  border-radius: 0;
  background: #F4F3EF;
  box-shadow: none;
  color: #111214;
  text-decoration: none;
  transition: background-color .2s ease, color .2s ease;
}
.th-p-cycling .cycling-products .pc:hover {
  background: #111214;
  color: #F4F3EF;
}
.th-p-cycling .cycling-products .pc .im {
  position: relative;
  min-height: 0;
  aspect-ratio: 1.42 / 1;
  overflow: hidden;
  border: 0;
  background: #E8E6E1;
}
.th-p-cycling .cycling-products .pc .im img,
.th-p-cycling .cycling-products .pc .im .noimg {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
}
.th-p-cycling .cycling-products .pc .im .noimg {
  background: linear-gradient(135deg, #DFDED9, #F4F3EF);
}
.th-p-cycling .cycling-products .pc .go {
  right: 11px;
  bottom: 11px;
  width: 35px;
  height: 35px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 1px solid #111214;
  border-radius: 50%;
  background: #F4F3EF;
  color: transparent;
  font-size: 0;
}
.th-p-cycling .cycling-products .pc .go::after {
  content: '↗';
  color: #111214;
  font: 400 22px/1 var(--display);
}
.th-p-cycling .cycling-products .pc .tag {
  top: 10px;
  left: 10px;
  border-radius: 0;
  background: #111214;
  color: #F4F3EF;
  font: 700 8px/1 var(--body);
  letter-spacing: .1em;
  text-transform: uppercase;
}
.th-p-cycling .cycling-products .pc .bd {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 14px;
  align-items: end;
  padding: 18px 0 0;
}
.th-p-cycling .cycling-products .pc h3 {
  margin: 0;
  color: inherit;
  font: 700 clamp(25px, 2.4vw, 37px)/.88 var(--display);
  letter-spacing: -.025em;
  text-transform: uppercase;
  overflow-wrap: anywhere;
}
.th-p-cycling .cycling-products .pc .pr {
  color: inherit;
  font: 700 10px/1.15 var(--body);
  letter-spacing: .08em;
  text-align: right;
}
.th-p-cycling .cycling-products .pc .rt {
  grid-column: 1 / -1;
  color: #E9513D;
}
.th-p-cycling .sec {
  background: #F4F3EF;
}
.th-p-cycling .sec > .wrap > .sec-h {
  border-color: #C9C8C3;
}
.th-p-cycling .sec > .wrap > .sec-h h2 {
  font-family: var(--display);
  font-weight: 700;
  letter-spacing: -.035em;
  text-transform: uppercase;
}
.th-p-cycling .chips .chip {
  min-height: 44px;
  border-radius: 0;
  font: 700 10px/1 var(--body);
  letter-spacing: .1em;
  text-transform: uppercase;
}
.th-p-cycling .grid .pc {
  border-radius: 0;
}
.th-p-cycling .ft {
  background: #101114;
  color: #F4F3EF;
}
.th-p-cycling .ft a,
.th-p-cycling .ft h4 {
  color: #F4F3EF;
}
.th-p-cycling .ft .brand {
  font-family: var(--display);
  font-weight: 700;
  letter-spacing: .12em;
}
.th-p-cycling .cycling-hero.has-hero-motion[data-hero-motion="pan"] .cycling-media .hero-media {
  animation: cycling-pan 18s ease-in-out infinite alternate;
}
.th-p-cycling .cycling-hero.has-hero-motion[data-hero-motion="drift"] .cycling-media .hero-media {
  animation: cycling-drift 15s ease-in-out infinite alternate;
}
@keyframes cycling-pan {
  from { transform: scale(1.04) translate3d(-1.2%, 0, 0); }
  to { transform: scale(1.1) translate3d(1.4%, -1%, 0); }
}
@keyframes cycling-drift {
  from { transform: scale(1.04) translate3d(0, 0, 0); }
  to { transform: scale(1.09) translate3d(-1.2%, -1%, 0); }
}
@media (max-width: 860px) {
  .th-p-cycling .cycling-stage {
    min-height: 600px;
    padding: 54px 28px 74px;
  }
  .th-p-cycling .cycling-copy {
    width: min(540px, 78%);
  }
  .th-p-cycling .cycling-copy h1 {
    font-size: clamp(62px, 12vw, 108px);
  }
  .th-p-cycling .cycling-annotation-top {
    top: 12%;
    right: 28px;
  }
  .th-p-cycling .cycling-annotation-bottom {
    right: 31px;
  }
  .th-p-cycling .cycling-rail {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .th-p-cycling .cycling-rail > a {
    min-height: 76px;
    padding: 14px 28px;
  }
  .th-p-cycling .cycling-rail > .cycling-rail-shop {
    border-top: 1px solid rgba(244, 243, 239, .42);
  }
  .th-p-cycling .cycling-products .pc .bd {
    grid-template-columns: 1fr;
  }
  .th-p-cycling .cycling-products .pc .pr {
    text-align: left;
  }
}
@media (max-width: 560px) {
  .th-p-cycling .hd .wrap {
    min-height: 58px;
  }
  .th-p-cycling .hd .nav {
    display: none;
  }
  .th-p-cycling .cycling-stage {
    min-height: 555px;
    padding: 36px 20px 84px;
    align-items: flex-end;
  }
  .th-p-cycling .cycling-media .hero-media {
    object-position: 61% center;
  }
  .th-p-cycling .cycling-media::after {
    background: linear-gradient(90deg, rgba(244, 243, 239, .97) 0%, rgba(244, 243, 239, .72) 54%, rgba(244, 243, 239, .16) 100%);
  }
  .th-p-cycling .cycling-copy {
    width: min(100%, 390px);
  }
  .th-p-cycling .cycling-copy .eyebrow {
    margin-bottom: 13px;
  }
  .th-p-cycling .cycling-copy h1,
  .th-p-cycling .cycling-copy h1.long {
    max-width: 7.4ch;
    font-size: clamp(54px, 17.5vw, 75px);
    line-height: .8;
  }
  .th-p-cycling .cycling-copy .sub {
    width: min(28ch, 80%);
    margin-top: 18px;
    font-size: 13px;
  }
  .th-p-cycling .cycling-copy .ctas {
    margin-top: 21px;
  }
  .th-p-cycling .cycling-copy .btn {
    min-height: 44px;
  }
  .th-p-cycling .cycling-annotation {
    display: none;
  }
  .th-p-cycling .cycling-hero .motion-toggle {
    right: 12px;
    bottom: 13px;
    padding: 0 9px;
    font-size: 8px;
  }
  .th-p-cycling .cycling-rail {
    grid-template-columns: 1fr;
  }
  .th-p-cycling .cycling-rail > a {
    min-height: 58px;
    gap: 17px;
    padding: 12px 20px;
    border-right: 0;
    border-bottom: 1px solid rgba(244, 243, 239, .25);
  }
  .th-p-cycling .cycling-rail > a:nth-child(n + 3) {
    display: none;
  }
  .th-p-cycling .cycling-rail > .cycling-rail-shop {
    min-height: 58px;
    display: flex;
    border: 0;
  }
  .th-p-cycling .cycling-rail b {
    font-size: 24px;
  }
  .th-p-cycling .cycling-discovery {
    padding: 50px 0 42px;
  }
  .th-p-cycling .cycling-discovery-head {
    display: block;
    margin-bottom: 28px;
  }
  .th-p-cycling .cycling-discovery h2 {
    max-width: 10ch;
    font-size: 52px;
  }
  .th-p-cycling .cycling-index-note {
    margin-top: 17px;
    text-align: left;
  }
  .th-p-cycling .cycling-products {
    grid-template-columns: 1fr;
  }
  .th-p-cycling .cycling-products .pc {
    padding: 17px;
  }
  .th-p-cycling .cycling-products .pc .bd {
    grid-template-columns: minmax(0, 1fr) auto;
    padding-top: 15px;
  }
  .th-p-cycling .cycling-products .pc .pr {
    text-align: right;
  }
  .th-p-cycling .cycling-products .pc h3 {
    font-size: 29px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .th-p-cycling .cycling-hero.has-hero-motion .cycling-media .hero-media {
    animation: none;
    transform: none;
  }
}
`;

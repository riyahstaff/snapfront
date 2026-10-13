import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-furniture',
  name: 'Serein Atelier',
  for: 'Architectural furniture and home goods',
  vibe: 'Sun-warmed stone, dark timber, and a composed room edit',
  category: 'Architectural furniture and home goods',
  group: 'home',
  display: 'Cormorant Garamond',
  body: 'DM Sans',
  displayWeight: 500,
  tracking: '-.015em',
  colors: {
    bg: '#F5F3EE',
    surface: '#FCFBF7',
    ink: '#29251F',
    muted: '#726A60',
    line: '#DED8CF',
    accent: '#5A4635',
    onAccent: '#FFFFFF',
    panel: '#E9E4DB',
    onPanel: '#29251F',
    foot: '#29251F',
    onFoot: '#F3EEE6',
    bar: '#5A4635',
    onBar: '#FFFFFF',
    badge: '#D8C7AC',
    onBadge: '#29251F',
  },
  header: 'split',
  hero: 'overlay',
  card: 'minimal',
  ratio: '4/3',
  rCard: 0,
  rBtn: 0,
  motion: 'pan',
  copy: {
    eyebrow: 'A room in repose',
    collection: 'Shop by room',
    cta: 'Explore the collection',
    title: 'Rooms shaped by the quiet of stone',
    subtitle: 'Soft forms, warm timber, and space to settle in.',
  },
  collection: 'premium',
  family: 'furniture',
  demo: '/assets/themes/furniture-hero.webp',
});

const productPins = (ctx) => ctx.products.slice(0, 3).map((product, index) => {
  const number = String(index + 1).padStart(2, '0');
  return `<a class="furniture-pin furniture-pin-${index + 1}" href="${ctx.esc(ctx.productLink(product))}" aria-label="View ${ctx.esc(product.title)}"><span>${number}</span></a>`;
}).join('');

const collectionRail = (ctx) => {
  if (!ctx.cats.length) {
    return `<aside class="furniture-rail furniture-rail-empty" aria-label="Collection overview">
      <p class="furniture-rail-kicker">Collection</p>
      <p class="furniture-rail-note">Explore the available pieces below.</p>
      <a class="furniture-rail-all" href="#shop">View all pieces <span aria-hidden="true">→</span></a>
    </aside>`;
  }

  return `<aside class="furniture-rail" aria-label="Browse collections">
    <p class="furniture-rail-kicker">Collections</p>
    <div class="furniture-rail-list">${ctx.cats.slice(0, 5).map((category, index) => {
      const count = Number(category.count) || 0;
      const countLabel = `${count} ${count === 1 ? 'piece' : 'pieces'}`;
      return `<a class="furniture-rail-link" href="${ctx.esc(ctx.categoryLink(category.name))}">
        <span class="furniture-rail-swatch furniture-rail-swatch-${(index % 5) + 1}" aria-hidden="true"></span>
        <span class="furniture-rail-copy"><b>${ctx.esc(category.name)}</b><small>${ctx.esc(countLabel)}</small></span>
        <span class="furniture-rail-arrow" aria-hidden="true">→</span>
      </a>`;
    }).join('')}</div>
    <a class="furniture-rail-all" href="#shop">View all pieces <span aria-hidden="true">→</span></a>
  </aside>`;
};

export function hero(ctx) {
  return `<section class="hero category-hero furniture-hero${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="furniture-stage">
      <div class="furniture-media">${ctx.media(0, { priority: true, lazy: false })}</div>
      <div class="furniture-shade" aria-hidden="true"></div>
      <div class="furniture-pins" aria-label="Featured pieces">${productPins(ctx)}</div>
      ${ctx.copy('furniture-copy')}
      <p class="furniture-hero-note" aria-hidden="true">A room, considered</p>
    </div>
    ${collectionRail(ctx)}
    ${ctx.controls}
  </section>`;
}

export function discovery(ctx) {
  if (ctx.cats.length < 2) return '';

  return `<section class="furniture-rooms" aria-labelledby="furniture-rooms-title">
    <div class="furniture-rooms-head">
      <div>
        <p class="furniture-section-kicker">The room edit</p>
        <h2 id="furniture-rooms-title">Shop by room</h2>
      </div>
      <a class="furniture-all-link" href="#shop">View all pieces <span aria-hidden="true">→</span></a>
    </div>
    <div class="furniture-room-grid">${ctx.cats.slice(0, 3).map((category, index) => {
      const count = Number(category.count) || 0;
      const countLabel = `${count} ${count === 1 ? 'piece' : 'pieces'}`;
      const media = category.image
        ? `<img src="${ctx.esc(category.image)}" alt="" loading="lazy">`
        : '<div class="furniture-room-empty" aria-hidden="true"></div>';
      return `<a class="furniture-room furniture-room-${index + 1}" href="${ctx.esc(ctx.categoryLink(category.name))}">
        <span class="furniture-room-copy"><span class="furniture-room-index">0${index + 1}</span><span><b>${ctx.esc(category.name)}</b><small>${ctx.esc(countLabel)}</small></span><i aria-hidden="true">→</i></span>
        <span class="furniture-room-media">${media}</span>
      </a>`;
    }).join('')}</div>
  </section>`;
}

export const css = `
.th-p-furniture {
  background: #F5F3EE;
  color: #29251F;
}

.th-p-furniture .hd {
  background: color-mix(in srgb, #F5F3EE 92%, transparent);
  border-bottom-color: #DED8CF;
}

.th-p-furniture .brand {
  font-size: calc(24px * var(--ts));
  font-weight: 500;
  letter-spacing: .16em;
}

.th-p-furniture .nav {
  gap: clamp(16px, 2.4vw, 38px);
  font-size: 13px;
}

.th-p-furniture .nav a {
  background-size: 0 1px;
  letter-spacing: .02em;
}

.th-p-furniture .nav a:hover,
.th-p-furniture .nav a[aria-current] {
  background-size: 100% 1px;
}

.th-p-furniture .cart {
  border-left: 1px solid #DED8CF;
  border-radius: 0;
  width: 52px;
}

.th-p-furniture .furniture-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(270px, 20vw, 340px);
  min-height: clamp(580px, calc(100vh - 104px), 790px);
  border-bottom: 1px solid #DED8CF;
  background: #E9E4DB;
  color: #FFFFFF;
  overflow: hidden;
}

.th-p-furniture .furniture-stage {
  position: relative;
  min-height: inherit;
  overflow: hidden;
  isolation: isolate;
  background: #A79B8C;
}

.th-p-furniture .furniture-media {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.th-p-furniture .furniture-media .hero-media,
.th-p-furniture .furniture-media .theme-empty-media {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.th-p-furniture .furniture-media .theme-empty-media {
  background:
    linear-gradient(110deg, transparent 0 45%, rgba(255,255,255,.15) 45% 46%, transparent 46% 100%),
    linear-gradient(145deg, #A79886 0%, #CBBEAD 42%, #877865 100%);
}

.th-p-furniture .furniture-shade {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: linear-gradient(90deg, rgba(27,22,17,.48) 0%, rgba(27,22,17,.16) 43%, rgba(27,22,17,.02) 70%), linear-gradient(0deg, rgba(20,16,12,.56) 0%, transparent 48%);
}

.th-p-furniture .furniture-copy {
  position: absolute;
  z-index: 3;
  left: clamp(20px, 4.2vw, 72px);
  bottom: clamp(44px, 7vw, 92px);
  width: min(620px, calc(100% - 44px));
  color: #FFFFFF;
  text-shadow: 0 2px 30px rgba(0, 0, 0, .26);
}

.th-p-furniture .furniture-copy .eyebrow {
  margin-bottom: 2px;
  font-size: 10px;
  letter-spacing: .2em;
}

.th-p-furniture .furniture-copy h1 {
  max-width: 12ch;
  font-size: clamp(46px, 5.2vw, 83px);
  line-height: .91;
  font-weight: 500;
  text-wrap: balance;
}

.th-p-furniture .furniture-copy h1.long {
  font-size: clamp(38px, 4.1vw, 64px);
  line-height: .98;
}

.th-p-furniture .furniture-copy .sub {
  max-width: 37ch;
  font-size: clamp(15px, 1.2vw, 18px);
  line-height: 1.5;
  opacity: .95;
}

.th-p-furniture .furniture-copy .btn {
  min-height: 46px;
  padding-inline: 20px;
  border: 1px solid rgba(255,255,255,.76);
  border-radius: 0;
  background: rgba(255,255,255,.08);
  color: #FFFFFF;
  box-shadow: none;
  font-family: var(--body);
  font-size: 13px;
  font-weight: 500;
}

.th-p-furniture .furniture-copy .btn:hover {
  background: #FFFFFF;
  color: #29251F;
  transform: none;
}

.th-p-furniture .furniture-copy .btn.ghost {
  border-color: transparent;
  color: #FFFFFF;
}

.th-p-furniture .furniture-copy .btn.ghost:hover {
  background: rgba(255,255,255,.12);
  color: #FFFFFF;
}

.th-p-furniture .furniture-pins {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}

.th-p-furniture .furniture-pin {
  position: absolute;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  color: #29251F;
  text-decoration: none;
  pointer-events: auto;
}

.th-p-furniture .furniture-pin span {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border: 1px solid rgba(41,37,31,.14);
  border-radius: 50%;
  background: rgba(250,248,242,.94);
  box-shadow: 0 5px 18px rgba(0,0,0,.16);
  font: 600 10px/1 var(--body);
  letter-spacing: .02em;
  transition: background .2s, color .2s, transform .2s;
}

.th-p-furniture .furniture-pin:hover span,
.th-p-furniture .furniture-pin:focus-visible span {
  background: #5A4635;
  color: #FFFFFF;
  transform: scale(1.1);
}

.th-p-furniture .furniture-pin-1 {
  left: 8%;
  top: 49%;
}

.th-p-furniture .furniture-pin-2 {
  left: 57%;
  top: 48%;
}

.th-p-furniture .furniture-pin-3 {
  right: 10%;
  top: 60%;
}

.th-p-furniture .furniture-hero-note {
  position: absolute;
  z-index: 2;
  right: clamp(20px, 3vw, 50px);
  bottom: 21px;
  max-width: 19ch;
  margin: 0;
  color: rgba(255,255,255,.82);
  font: 500 9px/1.5 var(--body);
  letter-spacing: .18em;
  text-align: right;
  text-transform: uppercase;
}

.th-p-furniture .furniture-rail {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: clamp(28px, 3.2vw, 54px) clamp(20px, 2.2vw, 38px) clamp(24px, 2.4vw, 40px);
  background: #F5F3EE;
  color: #29251F;
}

.th-p-furniture .furniture-rail-kicker,
.th-p-furniture .furniture-section-kicker {
  margin: 0;
  color: #726A60;
  font: 600 10px/1.2 var(--body);
  letter-spacing: .2em;
  text-transform: uppercase;
}

.th-p-furniture .furniture-rail-list {
  display: grid;
  gap: 0;
  margin-top: clamp(22px, 3vw, 38px);
  border-top: 1px solid #DED8CF;
}

.th-p-furniture .furniture-rail-link {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) 16px;
  align-items: center;
  gap: 11px;
  min-height: 68px;
  border-bottom: 1px solid #DED8CF;
  color: inherit;
  text-decoration: none;
}

.th-p-furniture .furniture-rail-swatch {
  display: block;
  width: 34px;
  aspect-ratio: 1;
  background: #CDBEAA;
}

.th-p-furniture .furniture-rail-swatch-1 { background: linear-gradient(135deg, #C6B59F, #E0D4C2); }
.th-p-furniture .furniture-rail-swatch-2 { background: linear-gradient(135deg, #796452, #B39478); }
.th-p-furniture .furniture-rail-swatch-3 { background: linear-gradient(135deg, #CBC7BD, #E4DED1); }
.th-p-furniture .furniture-rail-swatch-4 { background: linear-gradient(135deg, #695246, #9A7F65); }
.th-p-furniture .furniture-rail-swatch-5 { background: linear-gradient(135deg, #AF9E8A, #DED5C7); }

.th-p-furniture .furniture-rail-copy {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.th-p-furniture .furniture-rail-copy b {
  overflow-wrap: anywhere;
  font: 500 clamp(16px, 1.25vw, 19px)/1.15 var(--display);
  letter-spacing: var(--dt);
}

.th-p-furniture .furniture-rail-copy small {
  color: #726A60;
  font: 500 11px/1.3 var(--body);
}

.th-p-furniture .furniture-rail-arrow {
  color: #726A60;
  font-size: 17px;
  transition: transform .2s;
}

.th-p-furniture .furniture-rail-link:hover .furniture-rail-arrow {
  transform: translateX(3px);
}

.th-p-furniture .furniture-rail-all,
.th-p-furniture .furniture-all-link {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 44px;
  color: inherit;
  font: 600 12px/1.2 var(--body);
  letter-spacing: .04em;
  text-decoration: none;
}

.th-p-furniture .furniture-rail-all {
  margin-top: auto;
  padding-top: 21px;
  border-top: 1px solid #DED8CF;
}

.th-p-furniture .furniture-rail-all span,
.th-p-furniture .furniture-all-link span {
  font-size: 18px;
  transition: transform .2s;
}

.th-p-furniture .furniture-rail-all:hover span,
.th-p-furniture .furniture-all-link:hover span {
  transform: translateX(4px);
}

.th-p-furniture .furniture-rail-empty {
  align-items: flex-start;
  justify-content: flex-end;
  gap: 18px;
}

.th-p-furniture .furniture-rail-note {
  margin: 0;
  color: #726A60;
  font-size: 14px;
  line-height: 1.6;
}

.th-p-furniture .furniture-rooms {
  padding: clamp(52px, 6.2vw, 96px) clamp(16px, 4vw, 48px) clamp(60px, 7vw, 104px);
  background: #F5F3EE;
}

.th-p-furniture .furniture-rooms-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 20px;
  max-width: 1470px;
  margin: 0 auto clamp(24px, 3vw, 42px);
}

.th-p-furniture .furniture-rooms h2 {
  margin-top: 10px;
  font-size: clamp(36px, 4vw, 58px);
  font-weight: 500;
}

.th-p-furniture .furniture-all-link {
  border-bottom: 1px solid #29251F;
}

.th-p-furniture .furniture-room-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  max-width: 1470px;
  margin: 0 auto;
  border: 1px solid #DED8CF;
  background: #FCFBF7;
}

.th-p-furniture .furniture-room {
  display: grid;
  grid-template-columns: minmax(120px, .62fr) minmax(0, 1.38fr);
  min-width: 0;
  min-height: clamp(174px, 17vw, 250px);
  color: inherit;
  text-decoration: none;
}

.th-p-furniture .furniture-room + .furniture-room {
  border-left: 1px solid #DED8CF;
}

.th-p-furniture .furniture-room-copy {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 18px;
  padding: clamp(16px, 1.8vw, 28px) clamp(14px, 1.8vw, 28px);
}

.th-p-furniture .furniture-room-index {
  color: #726A60;
  font: 600 10px/1 var(--body);
  letter-spacing: .12em;
}

.th-p-furniture .furniture-room-copy > span:last-of-type {
  display: grid;
  align-content: end;
  gap: 7px;
}

.th-p-furniture .furniture-room-copy b {
  overflow-wrap: anywhere;
  font: 500 clamp(23px, 2.2vw, 34px)/.98 var(--display);
  letter-spacing: var(--dt);
}

.th-p-furniture .furniture-room-copy small {
  color: #726A60;
  font-size: 11px;
  line-height: 1.4;
}

.th-p-furniture .furniture-room-copy i {
  align-self: end;
  color: #726A60;
  font-size: 20px;
  font-style: normal;
  transition: transform .2s;
}

.th-p-furniture .furniture-room:hover .furniture-room-copy i {
  transform: translateX(4px);
}

.th-p-furniture .furniture-room-media {
  position: relative;
  overflow: hidden;
  background: #E9E4DB;
}

.th-p-furniture .furniture-room-media img,
.th-p-furniture .furniture-room-empty {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.th-p-furniture .furniture-room-media img {
  transition: transform .7s cubic-bezier(.2,.7,.2,1);
}

.th-p-furniture .furniture-room:hover .furniture-room-media img {
  transform: scale(1.045);
}

.th-p-furniture .furniture-room-empty {
  display: block;
  background: linear-gradient(130deg, #D5C8B7 0%, #ECE5D9 52%, #A3917B 52%, #B9AB99 100%);
}

.th-p-furniture #shop {
  padding-top: clamp(48px, 6vw, 94px);
  background: #FCFBF7;
}

.th-p-furniture #shop .sec-h {
  align-items: center;
  padding-bottom: clamp(18px, 2vw, 30px);
  border-bottom: 1px solid #DED8CF;
}

.th-p-furniture #shop .sec-h h2 {
  font-size: clamp(34px, 4vw, 56px);
  font-weight: 500;
}

.th-p-furniture #shop .chips {
  gap: 0;
  border: 1px solid #DED8CF;
  border-right: 0;
  border-bottom: 0;
}

.th-p-furniture #shop .chip {
  min-height: 36px;
  padding: 9px 12px;
  border: 0;
  border-right: 1px solid #DED8CF;
  border-bottom: 1px solid #DED8CF;
  border-radius: 0;
  background: #FCFBF7;
  color: #29251F;
  font-size: 11px;
}

.th-p-furniture #shop .chip[aria-current],
.th-p-furniture #shop .chip:hover {
  background: #29251F;
  color: #FFFFFF;
}

.th-p-furniture #shop .grid {
  gap: clamp(34px, 4vw, 64px) clamp(16px, 2.2vw, 34px);
}

.th-p-furniture #shop .pc {
  gap: 13px;
}

.th-p-furniture #shop .pc .im {
  border-radius: 0;
  background: #E9E4DB;
}

.th-p-furniture #shop .pc .bd {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 6px 14px;
  padding-inline: 2px;
}

.th-p-furniture #shop .pc h3 {
  font: 500 clamp(18px, 1.55vw, 22px)/1.1 var(--display);
  letter-spacing: var(--dt);
}

.th-p-furniture #shop .pc .pr {
  color: #726A60;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}

.th-p-furniture #shop .pc .tag {
  top: 0;
  left: 0;
  border-radius: 0;
  background: #29251F;
  color: #FFFFFF;
}

.th-p-furniture #shop .pc .go {
  border-radius: 0;
  background: #29251F;
  color: #FFFFFF;
}

.th-p-furniture .motion-toggle {
  right: clamp(20px, 21vw, 365px);
  bottom: 20px;
  border-color: rgba(255,255,255,.55);
  border-radius: 0;
  background: rgba(34,27,20,.38);
  color: #FFFFFF;
}

@media (max-width: 1080px) {
  .th-p-furniture .furniture-hero {
    grid-template-columns: minmax(0, 1fr) 280px;
  }

  .th-p-furniture .furniture-room {
    grid-template-columns: 1fr;
  }

  .th-p-furniture .furniture-room-copy {
    min-height: 130px;
  }

  .th-p-furniture .furniture-room-media {
    min-height: 146px;
  }
}

@media (max-width: 820px) {
  .th-p-furniture .brand {
    font-size: calc(20px * var(--ts));
    letter-spacing: .12em;
  }

  .th-p-furniture .furniture-hero {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .th-p-furniture .furniture-stage {
    min-height: clamp(470px, 125vw, 660px);
  }

  .th-p-furniture .furniture-copy {
    bottom: 62px;
  }

  .th-p-furniture .furniture-pin-1 {
    left: 7%;
    top: 44%;
  }

  .th-p-furniture .furniture-pin-2 {
    left: 57%;
    top: 42%;
  }

  .th-p-furniture .furniture-pin-3 {
    right: 8%;
    top: 57%;
  }

  .th-p-furniture .furniture-rail {
    padding: 26px 20px 22px;
  }

  .th-p-furniture .furniture-rail-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 16px;
    margin-top: 18px;
  }

  .th-p-furniture .furniture-rail-link {
    min-height: 62px;
  }

  .th-p-furniture .furniture-rail-all {
    margin-top: 20px;
  }

  .th-p-furniture .furniture-rooms {
    padding-inline: 16px;
  }

  .th-p-furniture .furniture-room-grid {
    grid-template-columns: 1fr;
  }

  .th-p-furniture .furniture-room {
    grid-template-columns: minmax(126px, .58fr) minmax(0, 1.42fr);
    min-height: 180px;
  }

  .th-p-furniture .furniture-room + .furniture-room {
    border-top: 1px solid #DED8CF;
    border-left: 0;
  }

  .th-p-furniture .furniture-room-copy {
    min-height: 0;
  }

  .th-p-furniture .furniture-room-media {
    min-height: 178px;
  }

  .th-p-furniture .motion-toggle {
    right: 16px;
    bottom: auto;
    top: 16px;
  }
}

@media (max-width: 520px) {
  .th-p-furniture .cart {
    width: 46px;
  }

  .th-p-furniture .furniture-stage {
    min-height: clamp(450px, 134vw, 570px);
  }

  .th-p-furniture .furniture-copy {
    left: 20px;
    bottom: 28px;
    width: calc(100% - 40px);
    gap: 14px;
  }

  .th-p-furniture .furniture-copy h1 {
    max-width: 11ch;
    font-size: clamp(42px, 12vw, 58px);
  }

  .th-p-furniture .furniture-copy h1.long {
    font-size: clamp(34px, 9vw, 46px);
  }

  .th-p-furniture .furniture-copy .sub {
    max-width: 31ch;
    font-size: 14px;
  }

  .th-p-furniture .furniture-copy .ctas {
    gap: 6px;
  }

  .th-p-furniture .furniture-copy .btn {
    min-height: 44px;
    padding-inline: 14px;
    font-size: 12px;
  }

  .th-p-furniture .furniture-hero-note {
    display: none;
  }

  .th-p-furniture .furniture-pin-1 {
    left: 5%;
    top: 42%;
  }

  .th-p-furniture .furniture-pin-2 {
    left: 54%;
    top: 40%;
  }

  .th-p-furniture .furniture-pin-3 {
    right: 4%;
    top: 57%;
  }

  .th-p-furniture .furniture-rail-list {
    grid-template-columns: 1fr;
  }

  .th-p-furniture .furniture-rail-link {
    grid-template-columns: 32px minmax(0, 1fr) 16px;
  }

  .th-p-furniture .furniture-rail-swatch {
    width: 32px;
  }

  .th-p-furniture .furniture-rooms-head {
    align-items: start;
    flex-direction: column;
    gap: 8px;
  }

  .th-p-furniture .furniture-rooms h2 {
    font-size: 38px;
  }

  .th-p-furniture .furniture-all-link {
    min-height: 44px;
  }

  .th-p-furniture .furniture-room {
    grid-template-columns: minmax(112px, .8fr) minmax(0, 1.2fr);
    min-height: 160px;
  }

  .th-p-furniture .furniture-room-copy {
    gap: 14px;
    padding: 16px 13px;
  }

  .th-p-furniture .furniture-room-copy b {
    font-size: 25px;
  }

  .th-p-furniture .furniture-room-media {
    min-height: 158px;
  }

  .th-p-furniture #shop .sec-h {
    align-items: start;
    flex-direction: column;
  }

  .th-p-furniture #shop .chips {
    width: 100%;
    overflow-x: auto;
    flex-wrap: nowrap;
    scrollbar-width: none;
  }

  .th-p-furniture #shop .chip {
    flex: 0 0 auto;
    min-height: 44px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .th-p-furniture .furniture-room-media img,
  .th-p-furniture .furniture-pin span,
  .th-p-furniture .furniture-rail-arrow,
  .th-p-furniture .furniture-rail-all span,
  .th-p-furniture .furniture-all-link span {
    transition: none;
  }
}
`;

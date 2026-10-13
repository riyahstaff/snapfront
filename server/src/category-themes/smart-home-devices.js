import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-smart-home-devices',
  name: 'LUMEN HOUSE',
  for: 'Smart-home devices for quietly connected rooms',
  vibe: 'Blue-hour domestic architecture, tactile controls, and an ambient glow',
  category: 'Smart home devices',
  group: 'home',
  display: 'DM Serif Display',
  body: 'Manrope',
  displayWeight: 400,
  tracking: '-.055em',
  colors: {
    bg: '#F1EEE6',
    surface: '#FBF9F3',
    ink: '#17252B',
    muted: '#69767A',
    line: '#CDD2C9',
    accent: '#D56B3C',
    onAccent: '#FFF9F2',
    panel: '#18323A',
    onPanel: '#F4F0E7',
    foot: '#12262D',
    onFoot: '#E7E9E0',
    bar: '#DDE3D7',
    onBar: '#17252B',
    badge: '#D9A85B',
    onBadge: '#17252B',
  },
  header: 'stack',
  hero: 'spotlight',
  card: 'boxed',
  ratio: '4/3',
  rCard: 3,
  rBtn: 999,
  motion: 'pan',
  copy: {
    eyebrow: 'A quieter kind of connected',
    collection: 'The room edit',
    cta: 'Shop the home',
    title: 'Let the room do its thing.',
    subtitle: 'Connected pieces for the spaces that hold your everyday.',
  },
});

const categoriesFor = (ctx) => (Array.isArray(ctx.cats) ? ctx.cats : [])
  .filter((category) => category && category.name)
  .slice(0, 4);

const productsFor = (ctx) => (Array.isArray(ctx.products) ? ctx.products : [])
  .filter(Boolean)
  .slice(0, 3);

const categoryImage = (category) => {
  if (typeof category?.image === 'string') return category.image;
  if (typeof category?.image?.url === 'string') return category.image.url;
  return '';
};

const countLabel = (count) => {
  const value = Number(count);
  if (!Number.isFinite(value) || value < 0) return '';
  return `${value} ${value === 1 ? 'piece' : 'pieces'}`;
};

const roomIndex = (ctx, categories) => {
  if (!categories.length) return '';
  return `<aside class="smart-home-room-index" aria-label="Room collections">
    <div class="smart-home-room-index-head"><span>Room index</span><span aria-hidden="true">↘</span></div>
    <nav class="smart-home-rooms" aria-label="Browse smart home collections">
      ${categories.slice(0, 3).map((category, index) => `
        <a href="${ctx.esc(ctx.categoryLink(category.name))}" class="smart-home-room-link">
          <span class="smart-home-room-index-number">${String(index + 1).padStart(2, '0')}</span>
          <span class="smart-home-room-label">${ctx.esc(category.name)}</span>
          <span class="smart-home-room-arrow" aria-hidden="true">↗</span>
        </a>`).join('')}
    </nav>
    <a class="smart-home-all-link" href="#shop">See what is in store <span aria-hidden="true">→</span></a>
  </aside>`;
};

export function hero(ctx) {
  const categories = categoriesFor(ctx);
  const longTitle = String(ctx.head || '').length > 54 ? ' smart-home-copy--long' : '';

  return `<section class="hero category-hero smart-home-hero${ctx.heroClass || ''}"${ctx.heroAttrs || ''}>
    <div class="smart-home-hero-shell">
      <div class="smart-home-image-frame">${ctx.media(0, { priority: true, lazy: false, decorative: true })}</div>
      <div class="smart-home-bluewash" aria-hidden="true"></div>
      <div class="smart-home-plan-lines" aria-hidden="true">
        <span class="smart-home-plan-line smart-home-plan-line--top"></span>
        <span class="smart-home-plan-line smart-home-plan-line--side"></span>
        <span class="smart-home-plan-orb smart-home-plan-orb--one"></span>
        <span class="smart-home-plan-orb smart-home-plan-orb--two"></span>
      </div>
      <div class="smart-home-copy-wrap">
        <p class="smart-home-signal">HOME / AFTER HOURS</p>
        ${ctx.copy(`smart-home-copy${longTitle}`)}
        <p class="smart-home-smallprint">Built around the way a room feels.</p>
      </div>
      ${roomIndex(ctx, categories)}
      <div class="smart-home-footnote" aria-hidden="true"><span>BLUE HOUR</span><i></i><span>DOMESTIC SYSTEMS</span></div>
    </div>
    ${ctx.controls || ''}
  </section>`;
}

const discoveryCard = (ctx, category, index, total) => {
  const image = categoryImage(category);
  const media = image
    ? `<img src="${ctx.esc(image)}" alt="" loading="lazy" decoding="async">`
    : `<span class="smart-home-category-empty" aria-hidden="true">${ctx.esc(String(category.name).trim().charAt(0).toUpperCase() || '•')}</span>`;
  const count = countLabel(category.count);

  return `<a class="smart-home-category-card smart-home-category-card--${index + 1}" href="${ctx.esc(ctx.categoryLink(category.name))}">
    <span class="smart-home-category-media">${media}</span>
    <span class="smart-home-category-meta">
      <span class="smart-home-category-sequence">${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span>
      <span class="smart-home-category-name">${ctx.esc(category.name)}</span>
      ${count ? `<span class="smart-home-category-count">${ctx.esc(count)}</span>` : ''}
    </span>
    <span class="smart-home-category-go" aria-hidden="true">↗</span>
  </a>`;
};

export function discovery(ctx) {
  const categories = categoriesFor(ctx);
  const products = productsFor(ctx);

  if (categories.length >= 2) {
    return `<section class="theme-discovery smart-home-discovery" aria-labelledby="smart-home-discovery-title">
      <div class="smart-home-discovery-orbit" aria-hidden="true"><span></span><i></i></div>
      <header class="smart-home-discovery-head">
        <div>
          <p class="smart-home-discovery-kicker">START WITH A ROOM</p>
          <h2 id="smart-home-discovery-title">Make the everyday<br><em>feel considered.</em></h2>
        </div>
        <div class="smart-home-discovery-note">
          <p>Follow the spaces that need a little more ease.</p>
          <a href="#shop">View the full collection <span aria-hidden="true">→</span></a>
        </div>
      </header>
      <div class="smart-home-category-grid">${categories.map((category, index) => discoveryCard(ctx, category, index, categories.length)).join('')}</div>
    </section>`;
  }

  if (!products.length) return '';

  return `<section class="theme-discovery smart-home-discovery smart-home-discovery--products" aria-labelledby="smart-home-discovery-title">
    <header class="smart-home-discovery-head">
      <div>
        <p class="smart-home-discovery-kicker">CURRENTLY IN THE HOUSE</p>
        <h2 id="smart-home-discovery-title">A quieter kind<br><em>of useful.</em></h2>
      </div>
      <a class="smart-home-discovery-all" href="#shop">Shop everything <span aria-hidden="true">→</span></a>
    </header>
    <div class="smart-home-product-row">${products.map((product) => ctx.productCard(product)).join('')}</div>
  </section>`;
}

export const css = `
.th-p-smart-home-devices {
  --smart-home-night: #172F37;
  --smart-home-deep: #10262D;
  --smart-home-paper: #F1EEE6;
  --smart-home-warm: #FFF9EF;
  --smart-home-rust: #D56B3C;
  --smart-home-sand: #D9A85B;
  --smart-home-mist: #DDE3D7;
  background: var(--smart-home-paper);
  color: var(--ink);
}

.th-p-smart-home-devices .hd {
  background: color-mix(in srgb, var(--smart-home-paper) 92%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
  box-shadow: none;
}

.th-p-smart-home-devices .brand {
  font-family: var(--body, 'Manrope', sans-serif);
  font-size: clamp(15px, 1.2vw, 18px);
  font-weight: 800;
  letter-spacing: .17em;
}

.th-p-smart-home-devices .nav {
  font-family: var(--body, 'Manrope', sans-serif);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .11em;
  text-transform: uppercase;
}

.th-p-smart-home-devices .cart {
  border-radius: 999px;
}

.th-p-smart-home-devices .nav a {
  background-image: linear-gradient(var(--smart-home-rust), var(--smart-home-rust));
}

.th-p-smart-home-devices .smart-home-hero {
  background: var(--smart-home-night);
  isolation: isolate;
  overflow: hidden;
  padding: clamp(10px, 1.25vw, 20px) clamp(10px, 1.5vw, 24px) clamp(38px, 5vw, 76px);
  position: relative;
}

.th-p-smart-home-devices .smart-home-hero-shell {
  isolation: isolate;
  margin: 0 auto;
  max-width: 1660px;
  min-height: clamp(560px, 52.5vw, 790px);
  overflow: hidden;
  position: relative;
}

.th-p-smart-home-devices .smart-home-image-frame {
  background: #617071;
  inset: 0;
  overflow: hidden;
  position: absolute;
}

.th-p-smart-home-devices .smart-home-image-frame .hero-media,
.th-p-smart-home-devices .smart-home-image-frame .theme-empty-media {
  display: block;
  height: 100%;
  object-fit: cover;
  object-position: center;
  width: 100%;
}

.th-p-smart-home-devices .smart-home-image-frame .theme-empty-media {
  align-items: center;
  background:
    radial-gradient(circle at 24% 44%, rgba(250,242,216,.78) 0 2.2%, transparent 2.5%),
    radial-gradient(circle at 72% 65%, rgba(236,174,102,.66) 0 1.1%, transparent 1.5%),
    linear-gradient(122deg, #C9C3B2 0%, #8B9288 42%, #314F57 72%, #1D3540 100%);
  color: var(--smart-home-warm);
  display: flex;
  font: 700 12px/1 var(--body, sans-serif);
  letter-spacing: .16em;
  text-transform: uppercase;
}

.th-p-smart-home-devices .smart-home-bluewash {
  background:
    linear-gradient(90deg, rgba(9,28,35,.92) 0%, rgba(14,38,45,.73) 25%, rgba(16,38,45,.18) 58%, rgba(9,24,31,.17) 100%),
    linear-gradient(0deg, rgba(7,24,30,.56) 0%, transparent 37%, rgba(7,24,30,.16) 100%);
  inset: 0;
  pointer-events: none;
  position: absolute;
  z-index: 1;
}

.th-p-smart-home-devices .smart-home-plan-lines {
  inset: 0;
  pointer-events: none;
  position: absolute;
  z-index: 2;
}

.th-p-smart-home-devices .smart-home-plan-line {
  border-color: rgba(244,240,231,.35);
  border-style: solid;
  display: block;
  position: absolute;
}

.th-p-smart-home-devices .smart-home-plan-line--top {
  border-width: 1px 0 0;
  left: 4.2%;
  top: 8.8%;
  width: min(35%, 470px);
}

.th-p-smart-home-devices .smart-home-plan-line--side {
  border-width: 0 0 0 1px;
  bottom: 17%;
  height: 51%;
  left: 4.2%;
}

.th-p-smart-home-devices .smart-home-plan-orb {
  background: var(--smart-home-sand);
  border: 5px solid rgba(23,47,55,.7);
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgba(255,249,239,.62), 0 0 28px rgba(217,168,91,.64);
  height: 9px;
  position: absolute;
  width: 9px;
}

.th-p-smart-home-devices .smart-home-plan-orb--one {
  left: calc(4.2% - 5px);
  top: calc(8.8% - 5px);
}

.th-p-smart-home-devices .smart-home-plan-orb--two {
  bottom: calc(17% - 5px);
  left: calc(4.2% - 5px);
}

.th-p-smart-home-devices .smart-home-copy-wrap {
  box-sizing: border-box;
  color: var(--smart-home-warm);
  left: clamp(31px, 6vw, 102px);
  max-width: min(40rem, 51%);
  padding-top: clamp(88px, 11vw, 166px);
  position: relative;
  z-index: 3;
}

.th-p-smart-home-devices .smart-home-signal,
.th-p-smart-home-devices .smart-home-copy .eyebrow {
  color: #F2C67B;
  font-family: var(--body, 'Manrope', sans-serif);
  font-size: clamp(9px, .7vw, 11px);
  font-weight: 800;
  letter-spacing: .2em;
  line-height: 1.3;
  margin: 0 0 clamp(13px, 1.4vw, 20px);
  text-transform: uppercase;
}

.th-p-smart-home-devices .smart-home-copy .eyebrow {
  color: rgba(255,249,239,.78);
  letter-spacing: .15em;
  margin-bottom: 14px;
}

.th-p-smart-home-devices .smart-home-copy h1 {
  color: var(--smart-home-warm);
  font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
  font-size: clamp(4rem, 7.2vw, 8.8rem);
  font-weight: 400;
  letter-spacing: -.065em;
  line-height: .86;
  margin: 0;
  max-width: 10ch;
  overflow-wrap: anywhere;
  text-wrap: balance;
}

.th-p-smart-home-devices .smart-home-copy--long h1 {
  font-size: clamp(3rem, 5.35vw, 6.9rem);
  line-height: .91;
}

.th-p-smart-home-devices .smart-home-copy .sub {
  color: rgba(255,249,239,.82);
  font-family: var(--body, 'Manrope', sans-serif);
  font-size: clamp(14px, 1.2vw, 17px);
  font-weight: 500;
  line-height: 1.65;
  margin: clamp(21px, 2.1vw, 30px) 0 0;
  max-width: 31rem;
  overflow-wrap: anywhere;
}

.th-p-smart-home-devices .smart-home-copy .ctas,
.th-p-smart-home-devices .smart-home-copy .cta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: clamp(24px, 2.8vw, 40px);
}

.th-p-smart-home-devices .smart-home-copy :is(.btn, .buy, a) {
  align-items: center;
  background: var(--smart-home-rust);
  border: 1px solid var(--smart-home-rust);
  border-radius: 999px;
  box-shadow: none;
  color: var(--smart-home-warm);
  display: inline-flex;
  font-family: var(--body, 'Manrope', sans-serif);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .1em;
  min-height: 47px;
  padding: 0 22px;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-smart-home-devices .smart-home-copy :is(.btn, .buy, a):hover {
  background: var(--smart-home-warm);
  border-color: var(--smart-home-warm);
  color: var(--smart-home-deep);
  transform: none;
}

.th-p-smart-home-devices .smart-home-smallprint {
  border-top: 1px solid rgba(255,249,239,.32);
  color: rgba(255,249,239,.68);
  font-family: var(--body, 'Manrope', sans-serif);
  font-size: 10px;
  letter-spacing: .11em;
  line-height: 1.45;
  margin: clamp(28px, 3vw, 43px) 0 0;
  padding-top: 12px;
  text-transform: uppercase;
  width: min(18rem, 100%);
}

.th-p-smart-home-devices .smart-home-room-index {
  backdrop-filter: blur(10px);
  background: rgba(247,243,232,.94);
  bottom: 0;
  color: var(--smart-home-deep);
  max-width: min(27.5%, 355px);
  min-width: 240px;
  padding: clamp(21px, 2vw, 32px) clamp(21px, 2.2vw, 38px) clamp(23px, 2.2vw, 35px);
  position: absolute;
  right: 0;
  z-index: 4;
}

.th-p-smart-home-devices .smart-home-room-index-head {
  align-items: center;
  border-bottom: 1px solid rgba(23,47,55,.18);
  color: var(--smart-home-rust);
  display: flex;
  font-family: var(--body, 'Manrope', sans-serif);
  font-size: 10px;
  font-weight: 800;
  justify-content: space-between;
  letter-spacing: .17em;
  padding-bottom: 12px;
  text-transform: uppercase;
}

.th-p-smart-home-devices .smart-home-rooms {
  display: grid;
  margin: 0;
}

.th-p-smart-home-devices .smart-home-room-link {
  align-items: baseline;
  border-bottom: 1px solid rgba(23,47,55,.13);
  color: var(--smart-home-deep);
  display: grid;
  gap: 8px;
  grid-template-columns: 24px minmax(0, 1fr) 16px;
  min-height: 51px;
  padding: 13px 0 10px;
  text-decoration: none;
}

.th-p-smart-home-devices .smart-home-room-link:hover {
  color: var(--smart-home-rust);
}

.th-p-smart-home-devices .smart-home-room-index-number {
  color: var(--smart-home-rust);
  font: 800 9px/1 var(--body, sans-serif);
  letter-spacing: .11em;
}

.th-p-smart-home-devices .smart-home-room-label {
  font-family: var(--body, 'Manrope', sans-serif);
  font-size: 12px;
  font-weight: 800;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.th-p-smart-home-devices .smart-home-room-arrow {
  color: var(--smart-home-rust);
  font-size: 13px;
}

.th-p-smart-home-devices .smart-home-all-link {
  align-items: center;
  color: var(--smart-home-deep);
  display: inline-flex;
  font-family: var(--body, 'Manrope', sans-serif);
  font-size: 10px;
  font-weight: 800;
  gap: 9px;
  letter-spacing: .1em;
  margin-top: 14px;
  min-height: 44px;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-smart-home-devices .smart-home-all-link span {
  color: var(--smart-home-rust);
  font-size: 15px;
}

.th-p-smart-home-devices .smart-home-all-link:hover {
  color: var(--smart-home-rust);
}

.th-p-smart-home-devices .smart-home-footnote {
  align-items: center;
  bottom: clamp(22px, 2.3vw, 38px);
  color: rgba(255,249,239,.8);
  display: flex;
  font: 800 9px/1 var(--body, sans-serif);
  gap: 10px;
  letter-spacing: .18em;
  position: absolute;
  right: clamp(270px, 31vw, 430px);
  text-transform: uppercase;
  z-index: 3;
}

.th-p-smart-home-devices .smart-home-footnote i {
  background: var(--smart-home-sand);
  border-radius: 50%;
  height: 6px;
  width: 6px;
}

.th-p-smart-home-devices .smart-home-discovery {
  background: var(--smart-home-paper);
  overflow: hidden;
  padding: clamp(68px, 9vw, 150px) clamp(18px, 5.6vw, 92px) clamp(72px, 9vw, 145px);
  position: relative;
}

.th-p-smart-home-devices .smart-home-discovery-orbit {
  border: 1px solid rgba(23,47,55,.13);
  border-radius: 50%;
  height: clamp(370px, 42vw, 700px);
  pointer-events: none;
  position: absolute;
  right: clamp(-320px, -13vw, -160px);
  top: clamp(-205px, -9vw, -95px);
  width: clamp(370px, 42vw, 700px);
}

.th-p-smart-home-devices .smart-home-discovery-orbit span {
  border: 1px solid rgba(213,107,60,.35);
  border-radius: 50%;
  inset: 12%;
  position: absolute;
}

.th-p-smart-home-devices .smart-home-discovery-orbit i {
  background: var(--smart-home-rust);
  border-radius: 50%;
  height: 10px;
  left: 9%;
  position: absolute;
  top: 46%;
  width: 10px;
}

.th-p-smart-home-devices .smart-home-discovery-head {
  align-items: end;
  display: flex;
  gap: 36px;
  justify-content: space-between;
  margin: 0 auto clamp(36px, 5vw, 72px);
  max-width: 1490px;
  position: relative;
  z-index: 1;
}

.th-p-smart-home-devices .smart-home-discovery-kicker {
  color: var(--smart-home-rust);
  font: 800 clamp(9px, .7vw, 11px)/1.3 var(--body, 'Manrope', sans-serif);
  letter-spacing: .18em;
  margin: 0 0 15px;
  text-transform: uppercase;
}

.th-p-smart-home-devices .smart-home-discovery h2 {
  color: var(--smart-home-deep);
  font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
  font-size: clamp(3.2rem, 5.5vw, 7rem);
  font-weight: 400;
  letter-spacing: -.06em;
  line-height: .89;
  margin: 0;
  overflow-wrap: anywhere;
}

.th-p-smart-home-devices .smart-home-discovery h2 em {
  color: var(--smart-home-rust);
  font-style: italic;
}

.th-p-smart-home-devices .smart-home-discovery-note {
  max-width: 260px;
  padding-bottom: 7px;
}

.th-p-smart-home-devices .smart-home-discovery-note p {
  color: var(--muted);
  font: 500 13px/1.6 var(--body, 'Manrope', sans-serif);
  margin: 0 0 17px;
}

.th-p-smart-home-devices .smart-home-discovery-note a,
.th-p-smart-home-devices .smart-home-discovery-all {
  align-items: center;
  color: var(--smart-home-deep);
  display: inline-flex;
  font: 800 10px/1.3 var(--body, 'Manrope', sans-serif);
  gap: 10px;
  letter-spacing: .12em;
  min-height: 44px;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-smart-home-devices .smart-home-discovery-note a span,
.th-p-smart-home-devices .smart-home-discovery-all span {
  color: var(--smart-home-rust);
  font-size: 15px;
}

.th-p-smart-home-devices .smart-home-discovery-note a:hover,
.th-p-smart-home-devices .smart-home-discovery-all:hover {
  color: var(--smart-home-rust);
}

.th-p-smart-home-devices .smart-home-category-grid {
  display: grid;
  gap: clamp(13px, 1.5vw, 24px);
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin: 0 auto;
  max-width: 1490px;
  position: relative;
  z-index: 1;
}

.th-p-smart-home-devices .smart-home-category-card {
  background: var(--smart-home-warm);
  color: var(--smart-home-deep);
  display: flex;
  flex-direction: column;
  min-height: clamp(340px, 31vw, 500px);
  overflow: hidden;
  position: relative;
  text-decoration: none;
}

.th-p-smart-home-devices .smart-home-category-card--2 {
  margin-top: clamp(25px, 5vw, 82px);
}

.th-p-smart-home-devices .smart-home-category-card--3 {
  margin-top: clamp(7px, 1.5vw, 22px);
}

.th-p-smart-home-devices .smart-home-category-card--4 {
  margin-top: clamp(43px, 7vw, 112px);
}

.th-p-smart-home-devices .smart-home-category-media {
  background: var(--smart-home-mist);
  display: block;
  flex: 1;
  min-height: 215px;
  overflow: hidden;
  position: relative;
}

.th-p-smart-home-devices .smart-home-category-media::after {
  background: linear-gradient(0deg, rgba(16,38,45,.22), transparent 48%);
  content: '';
  inset: 0;
  pointer-events: none;
  position: absolute;
}

.th-p-smart-home-devices .smart-home-category-media img {
  display: block;
  height: 100%;
  object-fit: cover;
  transition: transform .45s ease;
  width: 100%;
}

.th-p-smart-home-devices .smart-home-category-card:hover .smart-home-category-media img {
  transform: scale(1.045);
}

.th-p-smart-home-devices .smart-home-category-empty {
  align-items: center;
  background:
    radial-gradient(circle at 70% 30%, rgba(213,107,60,.35) 0 8%, transparent 8.5%),
    linear-gradient(135deg, #E0E4D9, #BFCFC8);
  color: var(--smart-home-deep);
  display: flex;
  font: 400 clamp(5rem, 8vw, 8rem)/1 var(--font-display, Georgia, serif);
  height: 100%;
  justify-content: center;
}

.th-p-smart-home-devices .smart-home-category-meta {
  display: grid;
  gap: 5px;
  min-height: 108px;
  padding: 19px 20px 22px;
}

.th-p-smart-home-devices .smart-home-category-sequence {
  color: var(--smart-home-rust);
  font: 800 9px/1.2 var(--body, 'Manrope', sans-serif);
  letter-spacing: .14em;
}

.th-p-smart-home-devices .smart-home-category-name {
  font: 800 clamp(13px, 1vw, 16px)/1.25 var(--body, 'Manrope', sans-serif);
  overflow-wrap: anywhere;
}

.th-p-smart-home-devices .smart-home-category-count {
  color: var(--muted);
  font: 600 10px/1.3 var(--body, 'Manrope', sans-serif);
  letter-spacing: .04em;
}

.th-p-smart-home-devices .smart-home-category-go {
  align-items: center;
  background: var(--smart-home-rust);
  border-radius: 50%;
  color: var(--smart-home-warm);
  display: flex;
  font-size: 15px;
  height: 36px;
  justify-content: center;
  position: absolute;
  right: 16px;
  top: 16px;
  width: 36px;
}

.th-p-smart-home-devices .smart-home-discovery--products {
  padding-bottom: clamp(64px, 8vw, 122px);
}

.th-p-smart-home-devices .smart-home-product-row {
  display: grid;
  gap: clamp(14px, 2vw, 28px);
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0 auto;
  max-width: 1490px;
  position: relative;
  z-index: 1;
}

.th-p-smart-home-devices .smart-home-product-row .product-card {
  border-radius: 3px;
}

@media (max-width: 920px) {
  .th-p-smart-home-devices .smart-home-hero-shell {
    min-height: 650px;
  }

  .th-p-smart-home-devices .smart-home-copy-wrap {
    max-width: min(38rem, 62%);
  }

  .th-p-smart-home-devices .smart-home-room-index {
    max-width: 37%;
    min-width: 220px;
  }

  .th-p-smart-home-devices .smart-home-footnote {
    display: none;
  }

  .th-p-smart-home-devices .smart-home-category-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .th-p-smart-home-devices .smart-home-category-card--2,
  .th-p-smart-home-devices .smart-home-category-card--4 {
    margin-top: clamp(25px, 7vw, 68px);
  }

  .th-p-smart-home-devices .smart-home-category-card--3 {
    margin-top: 0;
  }
}

@media (max-width: 640px) {
  .th-p-smart-home-devices .smart-home-hero {
    padding: 8px 8px 42px;
  }

  .th-p-smart-home-devices .smart-home-hero-shell {
    min-height: 710px;
  }

  .th-p-smart-home-devices .smart-home-image-frame .hero-media {
    object-position: 60% center;
  }

  .th-p-smart-home-devices .smart-home-bluewash {
    background: linear-gradient(0deg, rgba(9,28,35,.93) 0%, rgba(12,35,42,.65) 47%, rgba(9,24,31,.2) 100%);
  }

  .th-p-smart-home-devices .smart-home-plan-line--top {
    left: 7%;
    top: 5%;
    width: 52%;
  }

  .th-p-smart-home-devices .smart-home-plan-line--side {
    bottom: 39%;
    height: 56%;
    left: 7%;
  }

  .th-p-smart-home-devices .smart-home-plan-orb--one {
    left: calc(7% - 5px);
    top: calc(5% - 5px);
  }

  .th-p-smart-home-devices .smart-home-plan-orb--two {
    bottom: calc(39% - 5px);
    left: calc(7% - 5px);
  }

  .th-p-smart-home-devices .smart-home-copy-wrap {
    bottom: 192px;
    left: 27px;
    max-width: calc(100% - 48px);
    padding-top: 0;
    position: absolute;
  }

  .th-p-smart-home-devices .smart-home-copy h1 {
    font-size: clamp(3.7rem, 15vw, 5.35rem);
    max-width: 9ch;
  }

  .th-p-smart-home-devices .smart-home-copy--long h1 {
    font-size: clamp(2.75rem, 11vw, 4rem);
  }

  .th-p-smart-home-devices .smart-home-copy .sub {
    font-size: 13px;
    line-height: 1.5;
    max-width: 29rem;
  }

  .th-p-smart-home-devices .smart-home-copy .ctas,
  .th-p-smart-home-devices .smart-home-copy .cta-row {
    margin-top: 19px;
  }

  .th-p-smart-home-devices .smart-home-smallprint {
    display: none;
  }

  .th-p-smart-home-devices .smart-home-room-index {
    bottom: 0;
    box-sizing: border-box;
    max-width: none;
    min-width: 0;
    padding: 17px 22px 16px;
    width: 100%;
  }

  .th-p-smart-home-devices .smart-home-room-index-head {
    padding-bottom: 9px;
  }

  .th-p-smart-home-devices .smart-home-rooms {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .th-p-smart-home-devices .smart-home-room-link {
    gap: 3px;
    grid-template-columns: 1fr;
    min-height: 54px;
    padding: 10px 7px 8px 0;
  }

  .th-p-smart-home-devices .smart-home-room-arrow {
    display: none;
  }

  .th-p-smart-home-devices .smart-home-room-label {
    font-size: 10px;
  }

  .th-p-smart-home-devices .smart-home-all-link {
    margin-top: 6px;
    min-height: 36px;
  }

  .th-p-smart-home-devices .smart-home-discovery {
    padding: 65px 18px 80px;
  }

  .th-p-smart-home-devices .smart-home-discovery-head {
    align-items: start;
    flex-direction: column;
    gap: 19px;
    margin-bottom: 33px;
  }

  .th-p-smart-home-devices .smart-home-discovery h2 {
    font-size: clamp(3.25rem, 14.5vw, 4.7rem);
  }

  .th-p-smart-home-devices .smart-home-discovery-note {
    max-width: 270px;
  }

  .th-p-smart-home-devices .smart-home-category-grid {
    gap: 12px;
  }

  .th-p-smart-home-devices .smart-home-category-card {
    min-height: 300px;
  }

  .th-p-smart-home-devices .smart-home-category-card--2,
  .th-p-smart-home-devices .smart-home-category-card--4 {
    margin-top: 28px;
  }

  .th-p-smart-home-devices .smart-home-category-meta {
    min-height: 98px;
    padding: 15px 15px 18px;
  }

  .th-p-smart-home-devices .smart-home-category-name {
    font-size: 12px;
  }

  .th-p-smart-home-devices .smart-home-category-go {
    height: 32px;
    right: 11px;
    top: 11px;
    width: 32px;
  }

  .th-p-smart-home-devices .smart-home-product-row {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .th-p-smart-home-devices .smart-home-category-media img {
    transition: none;
  }
}
`;

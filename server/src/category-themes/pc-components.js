import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-pc-components',
  name: 'NODE / ARRAY',
  for: 'Desktop PC components, cooling, storage, and build hardware',
  vibe: 'A midnight component bench with blue signal traces, calibrated spacing, and tactile graphite hardware',
  category: 'Desktop PC components and build hardware',
  group: 'technology',
  display: 'Archivo',
  body: 'IBM Plex Mono',
  displayWeight: 700,
  tracking: '-.055em',
  colors: {
    bg: '#11151A',
    surface: '#182027',
    ink: '#E8EEF2',
    muted: '#93A0AA',
    line: '#35424D',
    accent: '#39A9FF',
    onAccent: '#06121C',
    panel: '#22303B',
    onPanel: '#E8EEF2',
    foot: '#081017',
    onFoot: '#C7D5DF',
    bar: '#DDF3FF',
    onBar: '#081017',
    badge: '#B2E2FF',
    onBadge: '#06121C',
  },
  header: 'stack',
  hero: 'collage',
  card: 'bold',
  ratio: '1/1',
  rCard: 4,
  rBtn: 2,
  motion: 'pan',
  copy: {
    eyebrow: 'Component field notes',
    collection: 'The build bench',
    cta: 'Browse components',
    title: 'Build from the signal up.',
    subtitle: 'The parts that turn a desk into a system worth returning to.',
  },
});

const itemCount = (ctx, count) => {
  const value = Number(count);
  if (!Number.isFinite(value)) return '';
  return `<small>${ctx.esc(value)} ${value === 1 ? 'item' : 'items'}</small>`;
};

const categoryDirectory = (ctx) => (ctx.cats || []).filter((cat) => cat?.name).slice(0, 4).map((cat, index) => `
  <a class="signalbay-hero__directory-link" href="${ctx.esc(ctx.categoryLink(cat.name))}">
    <span class="signalbay-hero__directory-index" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
    <span class="signalbay-hero__directory-name">${ctx.esc(cat.name)}</span>
    ${itemCount(ctx, cat.count)}
    <span class="signalbay-hero__directory-arrow" aria-hidden="true">↗</span>
  </a>
`).join('');

export function hero(ctx) {
  const directory = categoryDirectory(ctx);

  return `<section class="hero category-hero signalbay-hero${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="signalbay-hero__slab">
      <div class="signalbay-hero__picture">
        ${ctx.media(0, { priority: true, lazy: false, decorative: false })}
      </div>
      <div class="signalbay-hero__edge" aria-hidden="true"><span>BENCH / 01</span><i></i><i></i><i></i></div>
      <div class="signalbay-hero__reticle" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      <div class="signalbay-hero__copy-wrap">
        ${ctx.copy('signalbay-hero__copy')}
      </div>
      ${directory ? `<nav class="signalbay-hero__directory" aria-label="Browse component categories">
        <p>Signal paths</p>
        <div>${directory}</div>
      </nav>` : ''}
      <p class="signalbay-hero__caption" aria-hidden="true">Unboxed. Considered. Connected.</p>
    </div>
    ${ctx.controls}
  </section>`;
}

const categoryBay = (ctx, cat, index) => {
  const media = cat.image
    ? `<img src="${ctx.esc(cat.image)}" alt="" loading="lazy" decoding="async">`
    : '<span class="signalbay-bench__empty" aria-hidden="true"></span>';

  return `<a class="signalbay-bench__bay" href="${ctx.esc(ctx.categoryLink(cat.name))}">
    <span class="signalbay-bench__bay-index" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
    <span class="signalbay-bench__bay-media">${media}</span>
    <span class="signalbay-bench__bay-copy"><b>${ctx.esc(cat.name)}</b>${itemCount(ctx, cat.count)}</span>
    <span class="signalbay-bench__bay-arrow" aria-hidden="true">→</span>
  </a>`;
};

const productPart = (ctx, product, index) => {
  const title = product.title || product.name || 'Untitled product';
  const media = product.image_url
    ? `<img src="${ctx.esc(product.image_url)}" alt="${ctx.esc(product.alt_text || title)}" loading="lazy" decoding="async">`
    : '<span class="signalbay-bench__empty" aria-hidden="true"></span>';
  const category = product.category ? `<small>${ctx.esc(product.category)}</small>` : '';
  const price = product.price_cents != null
    ? `<em>${ctx.esc(ctx.money(product.price_cents, product.currency))}</em>`
    : '';

  return `<a class="signalbay-bench__part" href="${ctx.esc(ctx.productLink(product))}">
    <span class="signalbay-bench__part-index" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
    <span class="signalbay-bench__part-media">${media}</span>
    <span class="signalbay-bench__part-copy">${category}<b>${ctx.esc(title)}</b></span>
    ${price}
    <span class="signalbay-bench__part-arrow" aria-hidden="true">↗</span>
  </a>`;
};

export function discovery(ctx) {
  const categories = (ctx.cats || []).filter((cat) => cat?.name).slice(0, 4);

  if (categories.length >= 2) {
    return `<section class="theme-discovery signalbay-bench" aria-labelledby="signalbay-bench-title">
      <div class="signalbay-bench__heading">
        <div>
          <p class="signalbay-bench__kicker">Start at the bench</p>
          <h2 id="signalbay-bench-title">Find the part of the build.</h2>
        </div>
        <a class="signalbay-bench__all" href="#shop">See every component <span aria-hidden="true">→</span></a>
      </div>
      <div class="signalbay-bench__bays">${categories.map((cat, index) => categoryBay(ctx, cat, index)).join('')}</div>
    </section>`;
  }

  const products = (ctx.products || []).slice(0, 4);
  if (!products.length) return '';

  return `<section class="theme-discovery signalbay-bench signalbay-bench--parts" aria-labelledby="signalbay-parts-title">
    <div class="signalbay-bench__heading">
      <div>
        <p class="signalbay-bench__kicker">Current bench</p>
        <h2 id="signalbay-parts-title">A few parts to begin with.</h2>
      </div>
      <a class="signalbay-bench__all" href="#shop">See every component <span aria-hidden="true">→</span></a>
    </div>
    <div class="signalbay-bench__parts">${products.map((product, index) => productPart(ctx, product, index)).join('')}</div>
  </section>`;
}

export const css = `
.th-p-pc-components {
  --signalbay-blue: #39A9FF;
  --signalbay-deep: #11151A;
  --signalbay-slate: #182027;
  --signalbay-pale: #E8EEF2;
  --signalbay-line: #35424D;
  background: var(--signalbay-deep);
  color: var(--signalbay-pale);
  overflow-x: hidden;
}

.th-p-pc-components .hd {
  background: color-mix(in srgb, var(--signalbay-deep) 92%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--signalbay-pale) 16%, transparent);
  box-shadow: none;
}

.th-p-pc-components .hd .wrap {
  min-height: 76px;
}

.th-p-pc-components .brand {
  color: var(--signalbay-pale);
  font-family: var(--body);
  font-size: clamp(15px, 1.45vw, 20px);
  font-weight: 600;
  letter-spacing: .15em;
}

.th-p-pc-components .nav {
  gap: clamp(14px, 2.1vw, 30px);
  font-family: var(--body);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.th-p-pc-components .nav a {
  background-image: linear-gradient(var(--signalbay-blue), var(--signalbay-blue));
}

.th-p-pc-components .cart {
  border: 1px solid color-mix(in srgb, var(--signalbay-pale) 45%, transparent);
  border-radius: 2px;
  color: var(--signalbay-pale);
}

.th-p-pc-components .signalbay-hero {
  position: relative;
  overflow: hidden;
  padding: clamp(12px, 2vw, 28px);
  background:
    linear-gradient(90deg, transparent 0 49.8%, rgba(57, 169, 255, .055) 49.85% 50.15%, transparent 50.2%),
    linear-gradient(var(--signalbay-deep), #0C1116);
}

.th-p-pc-components .signalbay-hero__slab {
  position: relative;
  display: grid;
  grid-template-columns: clamp(42px, 5.8vw, 86px) minmax(0, 1fr) minmax(218px, 23vw, 352px);
  grid-template-rows: minmax(500px, clamp(510px, 54vw, 720px));
  width: min(100%, 1560px);
  margin: 0 auto;
  overflow: hidden;
  isolation: isolate;
  border: 1px solid color-mix(in srgb, var(--signalbay-pale) 24%, transparent);
  background: #17212A;
}

.th-p-pc-components .signalbay-hero__slab::before {
  position: absolute;
  z-index: 2;
  inset: 0;
  border: 8px solid color-mix(in srgb, var(--signalbay-deep) 38%, transparent);
  content: "";
  pointer-events: none;
}

.th-p-pc-components .signalbay-hero__picture {
  position: absolute;
  z-index: -2;
  inset: 0;
  overflow: hidden;
  background:
    linear-gradient(125deg, #0D151C, #263540 55%, #10161C);
}

.th-p-pc-components .signalbay-hero__picture::after {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(7, 13, 18, .8) 0%, rgba(7, 13, 18, .43) 39%, rgba(7, 13, 18, .14) 72%, rgba(7, 13, 18, .62) 100%),
    linear-gradient(0deg, rgba(7, 13, 18, .82) 0%, transparent 46%);
  content: "";
  pointer-events: none;
}

.th-p-pc-components .signalbay-hero__picture > .hero-media,
.th-p-pc-components .signalbay-hero__picture > .theme-empty-media {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
  object-fit: cover;
  object-position: center;
}

.th-p-pc-components .signalbay-hero__picture > .theme-empty-media {
  background:
    radial-gradient(circle at 69% 38%, rgba(57, 169, 255, .22) 0 2%, transparent 2.2%),
    linear-gradient(135deg, transparent 0 49.5%, rgba(232, 238, 242, .12) 49.6% 50.3%, transparent 50.4%),
    linear-gradient(45deg, transparent 0 49.5%, rgba(232, 238, 242, .12) 49.6% 50.3%, transparent 50.4%),
    #16212B;
}

.th-p-pc-components .signalbay-hero__edge {
  z-index: 3;
  display: grid;
  grid-column: 1;
  grid-row: 1;
  grid-template-rows: auto repeat(3, 1fr);
  gap: 18px;
  padding: clamp(16px, 2vw, 28px) 0 22px;
  border-right: 1px solid color-mix(in srgb, var(--signalbay-pale) 27%, transparent);
  background: color-mix(in srgb, #0B1117 78%, transparent);
}

.th-p-pc-components .signalbay-hero__edge span {
  justify-self: center;
  color: var(--signalbay-pale);
  font: 600 9px/1 var(--body);
  letter-spacing: .17em;
  text-transform: uppercase;
  writing-mode: vertical-rl;
}

.th-p-pc-components .signalbay-hero__edge i {
  align-self: end;
  justify-self: center;
  width: 1px;
  height: min(17vw, 170px);
  background: linear-gradient(var(--signalbay-blue), transparent);
}

.th-p-pc-components .signalbay-hero__reticle {
  position: absolute;
  z-index: 2;
  top: clamp(17px, 2vw, 30px);
  right: clamp(17px, 2vw, 30px);
  display: grid;
  grid-template-columns: repeat(2, 18px);
  grid-template-rows: repeat(2, 18px);
  gap: clamp(84px, 18vw, 260px) clamp(120px, 28vw, 420px);
  pointer-events: none;
}

.th-p-pc-components .signalbay-hero__reticle i {
  width: 18px;
  height: 18px;
  border-color: rgba(232, 238, 242, .68);
  border-style: solid;
  border-width: 0;
}

.th-p-pc-components .signalbay-hero__reticle i:nth-child(1) { border-top-width: 1px; border-left-width: 1px; }
.th-p-pc-components .signalbay-hero__reticle i:nth-child(2) { border-top-width: 1px; border-right-width: 1px; }
.th-p-pc-components .signalbay-hero__reticle i:nth-child(3) { border-bottom-width: 1px; border-left-width: 1px; }
.th-p-pc-components .signalbay-hero__reticle i:nth-child(4) { border-right-width: 1px; border-bottom-width: 1px; }

.th-p-pc-components .signalbay-hero__copy-wrap {
  z-index: 3;
  grid-column: 2;
  grid-row: 1;
  align-self: end;
  max-width: min(730px, 100%);
  padding: clamp(26px, 4vw, 64px) clamp(20px, 4.1vw, 68px) clamp(32px, 4.6vw, 76px);
}

.th-p-pc-components .signalbay-hero .txt {
  align-items: start;
  gap: clamp(11px, 1.6vw, 20px);
}

.th-p-pc-components .signalbay-hero .eyebrow {
  color: #B8E4FF;
  font: 600 10px/1.25 var(--body);
  letter-spacing: .15em;
  text-transform: uppercase;
}

.th-p-pc-components .signalbay-hero h1 {
  max-width: 10.5ch;
  color: #F3F8FB;
  font-size: clamp(47px, 6.4vw, 106px);
  font-weight: 700;
  letter-spacing: -.072em;
  line-height: .88;
  text-wrap: balance;
}

.th-p-pc-components .signalbay-hero h1.long {
  max-width: 13ch;
  font-size: clamp(38px, 4.9vw, 79px);
  line-height: .92;
}

.th-p-pc-components .signalbay-hero .sub {
  max-width: 47ch;
  color: #D2DDE4;
  font-size: clamp(13px, 1.1vw, 16px);
  line-height: 1.6;
}

.th-p-pc-components .signalbay-hero .ctas {
  gap: 10px;
  margin-top: 5px;
}

.th-p-pc-components .signalbay-hero .btn {
  min-height: 46px;
  padding-inline: 20px;
  border: 1px solid var(--signalbay-blue);
  border-radius: 2px;
  background: var(--signalbay-blue);
  color: #06121C;
  font: 600 11px/1 var(--body);
  letter-spacing: .08em;
  text-transform: uppercase;
}

.th-p-pc-components .signalbay-hero .btn.ghost {
  border-color: rgba(232, 238, 242, .65);
  background: rgba(8, 15, 21, .3);
  color: #F3F8FB;
}

.th-p-pc-components .signalbay-hero__directory {
  z-index: 3;
  grid-column: 3;
  grid-row: 1;
  align-self: end;
  margin: 0 clamp(15px, 2.2vw, 34px) clamp(26px, 4vw, 56px) 0;
  border-top: 1px solid rgba(232, 238, 242, .48);
  background: rgba(10, 17, 23, .56);
  backdrop-filter: blur(6px);
}

.th-p-pc-components .signalbay-hero__directory > p {
  margin: 0;
  padding: 13px 0 9px;
  color: #B8E4FF;
  font: 600 9px/1 var(--body);
  letter-spacing: .16em;
  text-transform: uppercase;
}

.th-p-pc-components .signalbay-hero__directory > div {
  display: grid;
}

.th-p-pc-components .signalbay-hero__directory-link {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr) auto 14px;
  gap: 8px;
  align-items: center;
  min-height: 44px;
  color: #F3F8FB;
  text-decoration: none;
  border-top: 1px solid rgba(232, 238, 242, .23);
}

.th-p-pc-components .signalbay-hero__directory-index {
  color: var(--signalbay-blue);
  font: 600 10px/1 var(--body);
}

.th-p-pc-components .signalbay-hero__directory-name {
  min-width: 0;
  overflow: hidden;
  font: 600 11px/1.15 var(--body);
  letter-spacing: .015em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.th-p-pc-components .signalbay-hero__directory-link small {
  color: #B8C7D0;
  font: 500 9px/1 var(--body);
  white-space: nowrap;
}

.th-p-pc-components .signalbay-hero__directory-arrow {
  color: var(--signalbay-blue);
  font-size: 15px;
}

.th-p-pc-components .signalbay-hero__caption {
  position: absolute;
  z-index: 2;
  right: clamp(18px, 3vw, 44px);
  bottom: 16px;
  margin: 0;
  color: rgba(232, 238, 242, .58);
  font: 500 9px/1.2 var(--body);
  letter-spacing: .1em;
  text-transform: uppercase;
}

.th-p-pc-components .signalbay-hero .motion-toggle {
  right: clamp(28px, 4.2vw, 66px);
  bottom: clamp(28px, 4.5vw, 68px);
  border: 1px solid rgba(232, 238, 242, .46);
  border-radius: 2px;
  background: rgba(8, 15, 21, .8);
  color: #F3F8FB;
  font: 600 10px/1 var(--body);
  letter-spacing: .06em;
}

.th-p-pc-components .signalbay-bench {
  width: min(100%, 1560px);
  margin: 0 auto;
  padding: clamp(54px, 7vw, 112px) clamp(16px, 3.7vw, 58px) clamp(65px, 8vw, 126px);
}

.th-p-pc-components .signalbay-bench__heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 28px;
  margin-bottom: clamp(24px, 3.5vw, 48px);
  padding-bottom: clamp(18px, 2vw, 30px);
  border-bottom: 1px solid var(--signalbay-line);
}

.th-p-pc-components .signalbay-bench__kicker {
  margin: 0 0 10px;
  color: var(--signalbay-blue);
  font: 600 10px/1.2 var(--body);
  letter-spacing: .16em;
  text-transform: uppercase;
}

.th-p-pc-components .signalbay-bench h2 {
  max-width: 13ch;
  color: var(--signalbay-pale);
  font-size: clamp(37px, 4.8vw, 72px);
  font-weight: 700;
  letter-spacing: -.065em;
  line-height: .91;
}

.th-p-pc-components .signalbay-bench__all {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 11px;
  min-height: 44px;
  color: var(--signalbay-pale);
  font: 600 10px/1.2 var(--body);
  letter-spacing: .1em;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-pc-components .signalbay-bench__all span {
  color: var(--signalbay-blue);
  font: 400 21px/1 var(--display);
}

.th-p-pc-components .signalbay-bench__bays {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1px;
  overflow: hidden;
  border: 1px solid var(--signalbay-line);
  border-radius: 4px;
  background: var(--signalbay-line);
}

.th-p-pc-components .signalbay-bench__bay {
  position: relative;
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-width: 0;
  min-height: clamp(300px, 30vw, 445px);
  padding: clamp(14px, 1.7vw, 25px);
  overflow: hidden;
  isolation: isolate;
  background: var(--signalbay-slate);
  color: var(--signalbay-pale);
  text-decoration: none;
}

.th-p-pc-components .signalbay-bench__bay::after {
  position: absolute;
  z-index: 1;
  inset: 0;
  background: linear-gradient(0deg, rgba(8, 15, 21, .83), transparent 58%);
  content: "";
  pointer-events: none;
}

.th-p-pc-components .signalbay-bench__bay-index {
  z-index: 2;
  width: max-content;
  padding: 6px 7px;
  border: 1px solid rgba(232, 238, 242, .45);
  color: #D8E9F5;
  font: 600 10px/1 var(--body);
}

.th-p-pc-components .signalbay-bench__bay-media {
  position: absolute;
  z-index: -1;
  inset: 0;
  overflow: hidden;
  background: #263540;
}

.th-p-pc-components .signalbay-bench__bay-media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.th-p-pc-components .signalbay-bench__empty {
  display: block;
  width: 100%;
  height: 100%;
  background:
    radial-gradient(circle at 68% 28%, rgba(57, 169, 255, .28) 0 3%, transparent 3.2%),
    repeating-linear-gradient(120deg, transparent 0 14px, rgba(232, 238, 242, .08) 14px 15px),
    linear-gradient(135deg, #1B2A35, #0D151B);
}

.th-p-pc-components .signalbay-bench__bay-copy {
  z-index: 2;
  display: grid;
  gap: 7px;
  align-self: end;
  min-width: 0;
  padding-top: 18px;
  border-top: 1px solid rgba(232, 238, 242, .47);
}

.th-p-pc-components .signalbay-bench__bay-copy b {
  overflow-wrap: anywhere;
  font: 700 clamp(19px, 1.75vw, 28px)/1.02 var(--display);
  letter-spacing: -.04em;
}

.th-p-pc-components .signalbay-bench__bay-copy small {
  color: #C1D0D9;
  font: 500 10px/1.2 var(--body);
  letter-spacing: .07em;
  text-transform: uppercase;
}

.th-p-pc-components .signalbay-bench__bay-arrow {
  position: absolute;
  z-index: 3;
  right: clamp(14px, 1.7vw, 25px);
  bottom: clamp(16px, 1.7vw, 25px);
  color: var(--signalbay-blue);
  font: 400 25px/1 var(--display);
}

.th-p-pc-components .signalbay-bench__parts {
  display: grid;
  border-top: 1px solid var(--signalbay-line);
}

.th-p-pc-components .signalbay-bench__part {
  display: grid;
  grid-template-columns: 44px 132px minmax(0, 1fr) auto 25px;
  gap: clamp(12px, 1.7vw, 26px);
  align-items: center;
  min-height: 132px;
  padding: 14px 4px;
  color: var(--signalbay-pale);
  text-decoration: none;
  border-bottom: 1px solid var(--signalbay-line);
}

.th-p-pc-components .signalbay-bench__part-index {
  color: var(--signalbay-blue);
  font: 600 11px/1 var(--body);
}

.th-p-pc-components .signalbay-bench__part-media {
  position: relative;
  display: block;
  height: 102px;
  overflow: hidden;
  background: #263540;
}

.th-p-pc-components .signalbay-bench__part-media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.th-p-pc-components .signalbay-bench__part-copy {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.th-p-pc-components .signalbay-bench__part-copy small {
  color: var(--muted);
  font: 500 10px/1.2 var(--body);
  letter-spacing: .08em;
  text-transform: uppercase;
}

.th-p-pc-components .signalbay-bench__part-copy b {
  overflow-wrap: anywhere;
  font: 700 clamp(17px, 1.5vw, 24px)/1.05 var(--display);
  letter-spacing: -.04em;
}

.th-p-pc-components .signalbay-bench__part em {
  color: #C4E8FF;
  font: 600 12px/1.2 var(--body);
  font-style: normal;
  white-space: nowrap;
}

.th-p-pc-components .signalbay-bench__part-arrow {
  color: var(--signalbay-blue);
  font-size: 19px;
}

.th-p-pc-components #shop {
  padding-top: clamp(50px, 6vw, 92px);
  border-top: 1px solid var(--signalbay-line);
  background: #0D1318;
}

.th-p-pc-components #shop .sec-h {
  align-items: end;
  margin-bottom: clamp(25px, 3vw, 42px);
}

.th-p-pc-components #shop .sec-h h2 {
  color: var(--signalbay-pale);
  font-size: clamp(35px, 4vw, 60px);
  font-weight: 700;
  letter-spacing: -.06em;
}

.th-p-pc-components #shop .chips {
  gap: 8px;
}

.th-p-pc-components #shop .chip {
  min-height: 44px;
  padding: 10px 13px;
  border: 1px solid var(--signalbay-line);
  border-radius: 2px;
  background: transparent;
  color: #C8D6DE;
  font: 600 10px/1 var(--body);
  letter-spacing: .07em;
  text-transform: uppercase;
}

.th-p-pc-components #shop .chip[aria-current] {
  border-color: var(--signalbay-blue);
  background: var(--signalbay-blue);
  color: #06121C;
}

.th-p-pc-components .grid {
  gap: clamp(30px, 4vw, 64px) clamp(14px, 2vw, 32px);
}

.th-p-pc-components .pc {
  gap: 13px;
}

.th-p-pc-components .pc .im {
  overflow: hidden;
  border: 1px solid var(--signalbay-line);
  border-radius: 4px;
  background:
    linear-gradient(135deg, rgba(57, 169, 255, .11), transparent 38%),
    #182027;
}

.th-p-pc-components .pc .im img {
  transition: none;
}

.th-p-pc-components .pc:hover .im img {
  transform: none;
}

.th-p-pc-components .pc .bd {
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 6px 14px;
}

.th-p-pc-components .pc h3 {
  color: var(--signalbay-pale);
  font: 600 15px/1.25 var(--body);
  letter-spacing: -.02em;
}

.th-p-pc-components .pc .pr {
  color: #C4E8FF;
  font: 600 13px/1.25 var(--body);
}

.th-p-pc-components .pc .ct {
  color: var(--muted);
  font: 500 10px/1.25 var(--body);
  letter-spacing: .06em;
  text-transform: uppercase;
}

.th-p-pc-components .pc .tag {
  border-radius: 2px;
  background: #B2E2FF;
  color: #06121C;
  font: 600 9px/1 var(--body);
  letter-spacing: .08em;
  text-transform: uppercase;
}

.th-p-pc-components .pc .go {
  border: 1px solid var(--signalbay-blue);
  border-radius: 2px;
  background: var(--signalbay-blue);
  color: #06121C;
  transition: none;
}

.th-p-pc-components .ft {
  border-top: 1px solid var(--signalbay-line);
}

@media (max-width: 940px) {
  .th-p-pc-components .signalbay-hero__slab {
    grid-template-columns: 56px minmax(0, 1fr) minmax(190px, 29vw, 250px);
    grid-template-rows: minmax(520px, 68vw);
  }

  .th-p-pc-components .signalbay-hero__copy-wrap {
    padding-left: clamp(20px, 3vw, 34px);
    padding-right: clamp(20px, 3vw, 34px);
  }

  .th-p-pc-components .signalbay-hero h1 {
    font-size: clamp(47px, 7.5vw, 72px);
  }

  .th-p-pc-components .signalbay-hero__caption {
    display: none;
  }

  .th-p-pc-components .signalbay-bench__bays {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .th-p-pc-components .signalbay-bench__bay {
    min-height: 360px;
  }
}

@media (max-width: 680px) {
  .th-p-pc-components .hd .wrap {
    min-height: 65px;
  }

  .th-p-pc-components .brand {
    font-size: 14px;
    letter-spacing: .12em;
  }

  .th-p-pc-components .signalbay-hero {
    padding: 10px;
  }

  .th-p-pc-components .signalbay-hero__slab {
    grid-template-columns: 40px minmax(0, 1fr);
    grid-template-rows: minmax(508px, auto) auto;
    overflow: visible;
  }

  .th-p-pc-components .signalbay-hero__slab::before {
    inset: 0;
    border-width: 5px;
  }

  .th-p-pc-components .signalbay-hero__picture {
    overflow: hidden;
  }

  .th-p-pc-components .signalbay-hero__picture > .hero-media {
    object-position: 61% center;
  }

  .th-p-pc-components .signalbay-hero__edge {
    grid-row: 1;
    gap: 12px;
    padding-top: 13px;
  }

  .th-p-pc-components .signalbay-hero__edge i {
    height: 100px;
  }

  .th-p-pc-components .signalbay-hero__reticle {
    top: 16px;
    right: 16px;
    gap: 72px 88px;
    transform: scale(.75);
    transform-origin: top right;
  }

  .th-p-pc-components .signalbay-hero__copy-wrap {
    grid-column: 2;
    grid-row: 1;
    padding: 26px 19px 30px;
  }

  .th-p-pc-components .signalbay-hero h1 {
    max-width: 10ch;
    font-size: clamp(42px, 13vw, 64px);
  }

  .th-p-pc-components .signalbay-hero h1.long {
    font-size: clamp(31px, 10.2vw, 48px);
  }

  .th-p-pc-components .signalbay-hero .sub {
    max-width: 34ch;
    font-size: 13px;
  }

  .th-p-pc-components .signalbay-hero .ctas {
    width: 100%;
  }

  .th-p-pc-components .signalbay-hero .btn {
    flex: 1 1 100%;
  }

  .th-p-pc-components .signalbay-hero__directory {
    grid-column: 1 / -1;
    grid-row: 2;
    width: 100%;
    margin: 0;
    padding: 0 15px 14px;
    border-top: 1px solid rgba(232, 238, 242, .3);
    background: #101820;
    backdrop-filter: none;
  }

  .th-p-pc-components .signalbay-hero__directory > p {
    padding-top: 14px;
  }

  .th-p-pc-components .signalbay-hero__directory > div {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 14px;
  }

  .th-p-pc-components .signalbay-hero__directory-link {
    grid-template-columns: 20px minmax(0, 1fr) 12px;
    gap: 5px;
  }

  .th-p-pc-components .signalbay-hero__directory-link small {
    display: none;
  }

  .th-p-pc-components .signalbay-hero .motion-toggle {
    right: 24px;
    bottom: 21px;
  }

  .th-p-pc-components .signalbay-bench {
    padding: 54px 16px 70px;
  }

  .th-p-pc-components .signalbay-bench__heading {
    align-items: start;
    flex-direction: column;
    gap: 15px;
  }

  .th-p-pc-components .signalbay-bench h2 {
    font-size: clamp(36px, 11vw, 52px);
  }

  .th-p-pc-components .signalbay-bench__bays {
    grid-template-columns: 1fr;
  }

  .th-p-pc-components .signalbay-bench__bay {
    min-height: 270px;
  }

  .th-p-pc-components .signalbay-bench__part {
    grid-template-columns: 30px 92px minmax(0, 1fr) 17px;
    gap: 10px;
    min-height: 112px;
  }

  .th-p-pc-components .signalbay-bench__part-media {
    height: 82px;
  }

  .th-p-pc-components .signalbay-bench__part em {
    grid-column: 3;
    margin-top: -6px;
  }

  .th-p-pc-components .signalbay-bench__part-arrow {
    grid-column: 4;
    grid-row: 1 / span 2;
  }

  .th-p-pc-components #shop .chips {
    flex-wrap: nowrap;
    overflow-x: auto;
  }

  .th-p-pc-components #shop .chip {
    flex: none;
  }
}

@media (max-width: 390px) {
  .th-p-pc-components .signalbay-hero h1 {
    font-size: 40px;
  }

  .th-p-pc-components .signalbay-hero__directory > div {
    grid-template-columns: 1fr;
  }

  .th-p-pc-components .signalbay-bench__part {
    grid-template-columns: 25px 76px minmax(0, 1fr) 15px;
  }

  .th-p-pc-components .signalbay-bench__part-media {
    height: 70px;
  }
}
`;

import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-decorative-vases',
  name: 'VOLUME / STILL',
  for: 'Sculptural decorative vases and tabletop objects',
  vibe: 'A sun-warmed studio folio with clay, amber glass, and deliberate negative space',
  category: 'Sculptural decorative vases',
  group: 'home',
  display: 'DM Serif Display',
  body: 'Manrope',
  displayWeight: 400,
  tracking: '-.045em',
  colors: {
    bg: '#EEE7DA',
    surface: '#FBF7F0',
    ink: '#2B211C',
    muted: '#77675B',
    line: '#D7C8B6',
    accent: '#9E3E2B',
    onAccent: '#FFF9F1',
    panel: '#3B2922',
    onPanel: '#F8EADD',
    foot: '#2B211C',
    onFoot: '#F7EBDD',
    bar: '#E5D3BE',
    onBar: '#2B211C',
    badge: '#D9A56C',
    onBadge: '#2B211C',
  },
  header: 'center',
  hero: 'editorial',
  card: 'boxed',
  ratio: '4/5',
  rCard: 2,
  rBtn: 999,
  motion: 'drift',
  copy: {
    eyebrow: 'A folio of forms',
    collection: 'The vessel index',
    cta: 'Browse the collection',
    title: 'Objects with a point of view.',
    subtitle: 'Sculptural vessels for the ledge, the table, and the considered pause.',
  },
  collection: 'premium',
  family: 'decorative-vases',
  demo: '/assets/themes/decorative-vases-hero.webp',
});

const categoriesFor = (ctx) => (ctx.cats || [])
  .filter((category) => category && category.name)
  .slice(0, 4);

const countLabel = (category) => {
  const count = Number(category.count) || 0;
  return `${count} ${count === 1 ? 'piece' : 'pieces'}`;
};

const browseRail = (ctx) => {
  const categories = categoriesFor(ctx);

  if (!categories.length) {
    return `<aside class="vases-browse-rail vases-browse-rail-empty" aria-label="Collection overview">
      <p class="vases-rail-kicker">Current edit</p>
      <p class="vases-rail-note">Explore the pieces currently gathered below.</p>
      <a class="vases-rail-link" href="#shop">View all pieces <span aria-hidden="true">↘</span></a>
    </aside>`;
  }

  return `<nav class="vases-browse-rail" aria-label="Browse vase categories">
    <p class="vases-rail-kicker">Vessel index</p>
    <div class="vases-rail-list">${categories.map((category, index) => `
      <a class="vases-rail-item" href="${ctx.esc(ctx.categoryLink(category.name))}">
        <span class="vases-rail-number">${String(index + 1).padStart(2, '0')}</span>
        <span class="vases-rail-name">${ctx.esc(category.name)}</span>
        <span class="vases-rail-count">${ctx.esc(countLabel(category))}</span>
      </a>`).join('')}</div>
    <a class="vases-rail-link" href="#shop">View all pieces <span aria-hidden="true">↘</span></a>
  </nav>`;
};

export function hero(ctx) {
  return `<section class="hero category-hero vases-hero${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="vases-hero-page">
      <div class="vases-hero-copy-slot">
        <p class="vases-folio-mark" aria-hidden="true">FORM / 01</p>
        ${ctx.copy('vases-hero-copy')}
      </div>
      <aside class="vases-hero-docket" aria-label="Collection note">
        <span class="vases-docket-rule" aria-hidden="true"></span>
        <p>Volume, silhouette, and a little room to breathe.</p>
        <span class="vases-docket-number" aria-hidden="true">EST. 01</span>
      </aside>
      <figure class="vases-hero-figure">
        ${ctx.media(0, { priority: true, lazy: false, decorative: true })}
        <figcaption><span>Object study</span><span>Open the collection below</span></figcaption>
      </figure>
      ${browseRail(ctx)}
    </div>
    ${ctx.controls}
  </section>`;
}

export function discovery(ctx) {
  const categories = categoriesFor(ctx);
  const products = (ctx.products || []).slice(0, 3);

  if (categories.length >= 2) {
    return `<section class="vases-discovery" aria-labelledby="vases-discovery-title">
      <div class="vases-discovery-head">
        <div>
          <p class="vases-section-kicker">Begin with a shape</p>
          <h2 id="vases-discovery-title">The shelf index.</h2>
        </div>
        <p>Browse the forms currently in this collection.</p>
      </div>
      <div class="vases-index-grid">${categories.map((category, index) => {
        const visual = category.image
          ? `<img src="${ctx.esc(category.image)}" alt="" loading="lazy">`
          : `<span class="vases-index-ghost vases-index-ghost-${index + 1}" aria-hidden="true"></span>`;
        return `<a class="vases-index-card vases-index-card-${index + 1}" href="${ctx.esc(ctx.categoryLink(category.name))}">
          <span class="vases-index-visual">${visual}</span>
          <span class="vases-index-copy">
            <span class="vases-index-meta">${String(index + 1).padStart(2, '0')} / ${ctx.esc(countLabel(category))}</span>
            <strong>${ctx.esc(category.name)}</strong>
            <span class="vases-index-arrow" aria-hidden="true">↗</span>
          </span>
        </a>`;
      }).join('')}</div>
    </section>`;
  }

  if (products.length) {
    return `<section class="vases-discovery vases-product-edit" aria-labelledby="vases-product-edit-title">
      <div class="vases-discovery-head">
        <div>
          <p class="vases-section-kicker">The current edit</p>
          <h2 id="vases-product-edit-title">Objects to place.</h2>
        </div>
        <p>Explore the pieces currently available in this collection.</p>
      </div>
      <div class="vases-product-row">${products.map((product) => ctx.productCard(product)).join('')}</div>
    </section>`;
  }

  return '';
}

export const css = `
.th-p-decorative-vases {
  --vases-paper: #eee7da;
  --vases-paper-light: #fbf7f0;
  --vases-ink: #2b211c;
  --vases-muted: #77675b;
  --vases-line: #d7c8b6;
  --vases-rust: #9e3e2b;
  --vases-clay: #d9a56c;
  --vases-night: #3b2922;
  background: var(--vases-paper);
  color: var(--vases-ink);
  overflow-x: clip;
}

.th-p-decorative-vases .hd {
  background: color-mix(in srgb, var(--vases-paper-light) 91%, transparent);
  border-bottom-color: var(--vases-line);
}

.th-p-decorative-vases .brand {
  font-family: var(--body);
  font-size: calc(17px * var(--ts));
  font-weight: 800;
  letter-spacing: .18em;
}

.th-p-decorative-vases .nav {
  gap: clamp(13px, 2.2vw, 32px);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
}

.th-p-decorative-vases .nav a {
  background-size: 0 1px;
}

.th-p-decorative-vases .nav a:hover,
.th-p-decorative-vases .nav a[aria-current] {
  background-size: 100% 1px;
}

.th-p-decorative-vases .cart {
  width: 50px;
  border: 1px solid var(--vases-ink);
  border-radius: 50%;
  background: transparent;
}

.th-p-decorative-vases .vases-hero {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  padding: clamp(16px, 2.8vw, 42px);
  background:
    radial-gradient(circle at 90% 2%, #ffffff88 0 2%, transparent 23%),
    var(--vases-paper);
}

.th-p-decorative-vases .vases-hero-page {
  display: grid;
  grid-template-columns: minmax(168px, .52fr) minmax(260px, .9fr) minmax(290px, 1.23fr) minmax(160px, .52fr);
  grid-template-rows: auto minmax(390px, 1fr) minmax(120px, auto);
  max-width: 1540px;
  min-height: clamp(600px, 70vw, 790px);
  margin: 0 auto;
}

.th-p-decorative-vases .vases-hero-copy-slot {
  position: relative;
  z-index: 3;
  grid-column: 1 / span 3;
  grid-row: 1;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: clamp(16px, 2.3vw, 38px);
  align-items: end;
  padding: clamp(22px, 3vw, 44px) clamp(22px, 3vw, 48px) clamp(26px, 3.2vw, 52px) 0;
}

.th-p-decorative-vases .vases-folio-mark {
  align-self: stretch;
  margin: 0;
  padding-right: clamp(12px, 1.5vw, 22px);
  border-right: 1px solid var(--vases-line);
  color: var(--vases-rust);
  font: 800 10px/1.2 var(--body);
  letter-spacing: .18em;
  writing-mode: vertical-rl;
}

.th-p-decorative-vases .vases-hero-copy {
  max-width: 760px;
}

.th-p-decorative-vases .vases-hero-copy .eyebrow,
.th-p-decorative-vases .vases-section-kicker,
.th-p-decorative-vases .vases-rail-kicker,
.th-p-decorative-vases .vases-index-meta {
  margin: 0;
  color: var(--vases-rust);
  font: 800 10px/1.3 var(--body);
  letter-spacing: .18em;
  text-transform: uppercase;
}

.th-p-decorative-vases .vases-hero-copy h1 {
  max-width: 14ch;
  margin: 10px 0 0;
  color: var(--vases-ink);
  font: 400 clamp(48px, 6.55vw, 100px)/.86 var(--display);
  letter-spacing: -.06em;
  overflow-wrap: anywhere;
  text-wrap: balance;
}

.th-p-decorative-vases .vases-hero-copy h1.long {
  font-size: clamp(39px, 5vw, 78px);
  line-height: .93;
}

.th-p-decorative-vases .vases-hero-copy .sub {
  max-width: 49ch;
  margin: 17px 0 0;
  color: var(--vases-muted);
  font: 600 clamp(12px, 1vw, 14px)/1.65 var(--body);
  letter-spacing: .015em;
  overflow-wrap: anywhere;
}

.th-p-decorative-vases .vases-hero-copy .ctas {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 22px;
}

.th-p-decorative-vases .vases-hero-copy .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  padding: 11px 18px;
  border: 1px solid var(--vases-ink);
  border-radius: 999px;
  background: var(--vases-ink);
  color: var(--vases-paper-light);
  box-shadow: none;
  font: 800 10px/1 var(--body);
  letter-spacing: .12em;
  text-transform: uppercase;
}

.th-p-decorative-vases .vases-hero-copy .btn:hover,
.th-p-decorative-vases .vases-hero-copy .btn:focus-visible {
  background: var(--vases-rust);
  border-color: var(--vases-rust);
  color: #ffffff;
  transform: none;
}

.th-p-decorative-vases .vases-hero-copy .btn.ghost {
  background: transparent;
  color: var(--vases-ink);
}

.th-p-decorative-vases .vases-hero-copy .btn.ghost:hover,
.th-p-decorative-vases .vases-hero-copy .btn.ghost:focus-visible {
  background: #ffffff;
  border-color: #ffffff;
  color: var(--vases-ink);
}

.th-p-decorative-vases .vases-hero-docket {
  position: relative;
  z-index: 3;
  grid-column: 4;
  grid-row: 1;
  display: flex;
  flex-direction: column;
  justify-content: end;
  align-items: flex-start;
  gap: 11px;
  min-width: 0;
  padding: clamp(22px, 3vw, 44px) 0 clamp(28px, 3.2vw, 52px) clamp(16px, 2vw, 32px);
  border-left: 1px solid var(--vases-line);
}

.th-p-decorative-vases .vases-docket-rule {
  display: block;
  width: 36px;
  height: 2px;
  background: var(--vases-rust);
}

.th-p-decorative-vases .vases-hero-docket p {
  max-width: 17ch;
  margin: 0;
  color: var(--vases-muted);
  font: 700 11px/1.55 var(--body);
  letter-spacing: .03em;
}

.th-p-decorative-vases .vases-docket-number {
  color: var(--vases-rust);
  font: 800 9px/1.2 var(--body);
  letter-spacing: .15em;
}

.th-p-decorative-vases .vases-hero-figure {
  position: relative;
  z-index: 1;
  grid-column: 2 / -1;
  grid-row: 2 / span 2;
  min-width: 0;
  min-height: 0;
  margin: 0;
  overflow: hidden;
  background: #9c6544;
  clip-path: polygon(0 7%, 94% 0, 100% 91%, 7% 100%);
}

.th-p-decorative-vases .vases-hero-figure::before {
  position: absolute;
  inset: 12px;
  z-index: 2;
  border: 1px solid #fff4;
  content: '';
  pointer-events: none;
}

.th-p-decorative-vases .vases-hero-figure .hero-media,
.th-p-decorative-vases .vases-hero-figure .theme-empty-media {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 100%;
  object-fit: cover;
  object-position: 56% center;
}

.th-p-decorative-vases .vases-hero-figure .theme-empty-media {
  background:
    radial-gradient(ellipse at 65% 48%, #f7e7cd 0 7%, #0000 7.5%),
    radial-gradient(ellipse at 48% 53%, #873929 0 7%, #0000 7.5%),
    radial-gradient(ellipse at 78% 50%, #c38b5e 0 8%, #0000 8.5%),
    linear-gradient(110deg, #402b24, #a85735 55%, #d5a06d);
}

.th-p-decorative-vases .vases-hero-figure figcaption {
  position: absolute;
  right: clamp(22px, 3vw, 44px);
  bottom: clamp(20px, 2.8vw, 42px);
  z-index: 3;
  display: grid;
  gap: 4px;
  margin: 0;
  color: #fff8ed;
  font: 800 9px/1.35 var(--body);
  letter-spacing: .16em;
  text-align: right;
  text-shadow: 0 2px 14px #2c1612aa;
  text-transform: uppercase;
}

.th-p-decorative-vases .vases-hero-figure figcaption span:last-child {
  color: #fff8edcc;
  font-size: 8px;
}

.th-p-decorative-vases .vases-browse-rail {
  position: relative;
  z-index: 4;
  grid-column: 1 / span 2;
  grid-row: 2 / span 2;
  align-self: end;
  display: flex;
  flex-direction: column;
  min-width: 0;
  margin: clamp(38px, 5vw, 78px) 0 0;
  padding: clamp(23px, 2.8vw, 38px) clamp(20px, 2.5vw, 34px);
  background: var(--vases-paper-light);
  border: 1px solid var(--vases-line);
  box-shadow: 12px 14px 0 #2b211c16;
}

.th-p-decorative-vases .vases-rail-list {
  display: grid;
  margin-top: 19px;
  border-top: 1px solid var(--vases-line);
}

.th-p-decorative-vases .vases-rail-item {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: baseline;
  min-height: 48px;
  padding: 9px 0;
  border-bottom: 1px solid var(--vases-line);
  color: var(--vases-ink);
  text-decoration: none;
}

.th-p-decorative-vases .vases-rail-number,
.th-p-decorative-vases .vases-rail-count {
  color: var(--vases-muted);
  font: 800 9px/1.2 var(--body);
  letter-spacing: .08em;
}

.th-p-decorative-vases .vases-rail-count {
  text-align: right;
  white-space: nowrap;
}

.th-p-decorative-vases .vases-rail-name {
  min-width: 0;
  overflow-wrap: anywhere;
  font: 400 clamp(18px, 1.6vw, 25px)/1 var(--display);
  letter-spacing: -.04em;
}

.th-p-decorative-vases .vases-rail-item:hover .vases-rail-name,
.th-p-decorative-vases .vases-rail-item:focus-visible .vases-rail-name {
  color: var(--vases-rust);
}

.th-p-decorative-vases .vases-rail-link {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 44px;
  margin-top: 15px;
  color: var(--vases-ink);
  font: 800 10px/1.1 var(--body);
  letter-spacing: .12em;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-decorative-vases .vases-rail-link span {
  color: var(--vases-rust);
  font-size: 19px;
  transition: transform 180ms ease;
}

.th-p-decorative-vases .vases-rail-link:hover span,
.th-p-decorative-vases .vases-rail-link:focus-visible span {
  transform: translate(3px, 3px);
}

.th-p-decorative-vases .vases-browse-rail-empty {
  justify-content: flex-end;
  min-height: 224px;
}

.th-p-decorative-vases .vases-rail-note {
  max-width: 22ch;
  margin: 20px 0 4px;
  color: var(--vases-muted);
  font: 600 12px/1.55 var(--body);
}

.th-p-decorative-vases .motion-toggle {
  position: absolute;
  z-index: 8;
  top: clamp(28px, 4.4vw, 68px);
  right: clamp(30px, 4.4vw, 68px);
  min-height: 44px;
  border: 1px solid #fff9ed88;
  border-radius: 999px;
  background: #2b211c96;
  color: #fff9ed;
  font: 800 9px/1 var(--body);
  letter-spacing: .12em;
  text-transform: uppercase;
}

.th-p-decorative-vases .vases-discovery {
  padding: clamp(66px, 8vw, 126px) clamp(16px, 4.2vw, 66px) clamp(70px, 8vw, 132px);
  background: var(--vases-paper-light);
}

.th-p-decorative-vases .vases-discovery-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(210px, .38fr);
  gap: 28px;
  align-items: end;
  max-width: 1450px;
  margin: 0 auto clamp(27px, 4vw, 56px);
  padding-bottom: clamp(18px, 2.3vw, 30px);
  border-bottom: 1px solid var(--vases-line);
}

.th-p-decorative-vases .vases-discovery-head h2 {
  max-width: 9ch;
  margin: 10px 0 0;
  color: var(--vases-ink);
  font: 400 clamp(43px, 5.2vw, 76px)/.88 var(--display);
  letter-spacing: -.055em;
}

.th-p-decorative-vases .vases-discovery-head > p {
  max-width: 30ch;
  margin: 0 0 4px;
  color: var(--vases-muted);
  font: 600 12px/1.65 var(--body);
}

.th-p-decorative-vases .vases-index-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  max-width: 1450px;
  margin: 0 auto;
  border-top: 1px solid var(--vases-line);
  border-left: 1px solid var(--vases-line);
}

.th-p-decorative-vases .vases-index-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: clamp(300px, 31vw, 460px);
  border-right: 1px solid var(--vases-line);
  border-bottom: 1px solid var(--vases-line);
  color: var(--vases-ink);
  text-decoration: none;
}

.th-p-decorative-vases .vases-index-visual {
  position: relative;
  display: grid;
  flex: 1;
  min-height: 205px;
  overflow: hidden;
  place-items: center;
  background: #e6d8c6;
}

.th-p-decorative-vases .vases-index-visual img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 500ms cubic-bezier(.2,.7,.2,1);
}

.th-p-decorative-vases .vases-index-card:hover .vases-index-visual img {
  transform: scale(1.045);
}

.th-p-decorative-vases .vases-index-ghost {
  display: block;
  width: 34%;
  aspect-ratio: .67;
  border: 1px solid #2b211c44;
  border-radius: 48% 48% 38% 38% / 25% 25% 58% 58%;
  background: linear-gradient(110deg, #fff8ec, #d09b72 70%);
  box-shadow: 20px 18px 0 #7a463022;
}

.th-p-decorative-vases .vases-index-ghost-2 {
  width: 28%;
  aspect-ratio: .52;
  border-radius: 44% 44% 23% 23% / 14% 14% 50% 50%;
  background: linear-gradient(120deg, #9f3e2c, #d47c4c);
}

.th-p-decorative-vases .vases-index-ghost-3 {
  width: 42%;
  aspect-ratio: 1.1;
  border-radius: 48% 52% 43% 57% / 46% 34% 66% 54%;
  background: linear-gradient(130deg, #7f7c54, #c4b477);
}

.th-p-decorative-vases .vases-index-ghost-4 {
  width: 31%;
  aspect-ratio: .82;
  border-radius: 43% 54% 48% 52% / 24% 27% 64% 67%;
  background: repeating-linear-gradient(90deg, #a66c4f 0 4px, #d29b72 4px 7px);
}

.th-p-decorative-vases .vases-index-copy {
  position: relative;
  display: grid;
  min-height: 117px;
  padding: 18px 18px 20px;
}

.th-p-decorative-vases .vases-index-copy strong {
  align-self: end;
  max-width: 12ch;
  overflow-wrap: anywhere;
  font: 400 clamp(23px, 2.25vw, 34px)/.96 var(--display);
  letter-spacing: -.045em;
}

.th-p-decorative-vases .vases-index-arrow {
  position: absolute;
  right: 17px;
  bottom: 18px;
  color: var(--vases-rust);
  font-size: 22px;
  transition: transform 180ms ease;
}

.th-p-decorative-vases .vases-index-card:hover .vases-index-arrow,
.th-p-decorative-vases .vases-index-card:focus-visible .vases-index-arrow {
  transform: translate(3px, -3px);
}

.th-p-decorative-vases .vases-product-edit .vases-discovery-head {
  margin-bottom: 33px;
}

.th-p-decorative-vases .vases-product-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(14px, 2vw, 30px);
  max-width: 1450px;
  margin: 0 auto;
}

.th-p-decorative-vases #shop {
  padding-top: clamp(58px, 7vw, 110px);
  background: var(--vases-paper);
}

.th-p-decorative-vases #shop .sec-h {
  align-items: end;
  padding-bottom: clamp(18px, 2vw, 29px);
  border-bottom: 1px solid var(--vases-line);
}

.th-p-decorative-vases #shop .sec-h h2 {
  font: 400 clamp(42px, 5vw, 72px)/.9 var(--display);
  letter-spacing: -.055em;
}

.th-p-decorative-vases #shop .chips {
  gap: 7px;
}

.th-p-decorative-vases #shop .chip {
  min-height: 40px;
  padding: 9px 14px;
  border: 1px solid var(--vases-line);
  border-radius: 999px;
  background: transparent;
  color: var(--vases-ink);
  font: 800 10px/1 var(--body);
  letter-spacing: .08em;
}

.th-p-decorative-vases #shop .chip[aria-current],
.th-p-decorative-vases #shop .chip:hover {
  border-color: var(--vases-ink);
  background: var(--vases-ink);
  color: var(--vases-paper-light);
}

.th-p-decorative-vases #shop .grid {
  gap: clamp(30px, 4vw, 62px) clamp(15px, 2.2vw, 34px);
}

.th-p-decorative-vases #shop .pc {
  gap: 13px;
}

.th-p-decorative-vases #shop .pc .im {
  overflow: hidden;
  border-radius: 2px;
  background: #e1d1bd;
}

.th-p-decorative-vases #shop .pc .bd {
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 5px 14px;
  padding: 0 2px;
}

.th-p-decorative-vases #shop .pc h3 {
  font: 400 clamp(19px, 1.65vw, 24px)/1 var(--display);
  letter-spacing: -.035em;
}

.th-p-decorative-vases #shop .pc .pr {
  color: var(--vases-muted);
  font: 800 11px/1.2 var(--body);
  white-space: nowrap;
}

.th-p-decorative-vases #shop .pc .tag {
  border-radius: 0 0 5px 0;
  background: var(--vases-rust);
  color: #fff9f1;
}

.th-p-decorative-vases #shop .pc .go {
  border-radius: 50%;
  background: var(--vases-ink);
  color: var(--vases-paper-light);
}

.th-p-decorative-vases :is(.vases-rail-item, .vases-rail-link, .vases-index-card, .vases-hero-copy .btn):focus-visible {
  outline: 2px solid var(--vases-rust);
  outline-offset: 3px;
}

@media (max-width: 960px) {
  .th-p-decorative-vases .vases-hero-page {
    grid-template-columns: minmax(170px, .56fr) minmax(0, 1fr) minmax(0, 1fr);
  }

  .th-p-decorative-vases .vases-hero-copy-slot {
    grid-column: 1 / span 2;
  }

  .th-p-decorative-vases .vases-hero-docket {
    grid-column: 3;
  }

  .th-p-decorative-vases .vases-hero-figure {
    grid-column: 2 / -1;
  }

  .th-p-decorative-vases .vases-browse-rail {
    grid-column: 1 / span 2;
  }

  .th-p-decorative-vases .vases-index-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .th-p-decorative-vases .vases-index-card {
    min-height: 370px;
  }
}

@media (max-width: 680px) {
  .th-p-decorative-vases .hd {
    background: var(--vases-paper-light);
  }

  .th-p-decorative-vases .brand {
    font-size: calc(14px * var(--ts));
    letter-spacing: .13em;
  }

  .th-p-decorative-vases .cart {
    width: 46px;
  }

  .th-p-decorative-vases .vases-hero {
    padding: 0;
  }

  .th-p-decorative-vases .vases-hero-page {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .th-p-decorative-vases .vases-hero-copy-slot {
    display: block;
    padding: 30px 20px 25px;
  }

  .th-p-decorative-vases .vases-folio-mark {
    display: block;
    margin-bottom: 14px;
    padding: 0 0 9px;
    border-right: 0;
    border-bottom: 1px solid var(--vases-line);
    writing-mode: horizontal-tb;
  }

  .th-p-decorative-vases .vases-hero-copy h1 {
    max-width: 12ch;
    font-size: clamp(46px, 13.2vw, 67px);
  }

  .th-p-decorative-vases .vases-hero-copy h1.long {
    font-size: clamp(37px, 10.2vw, 52px);
  }

  .th-p-decorative-vases .vases-hero-copy .sub {
    font-size: 12px;
  }

  .th-p-decorative-vases .vases-hero-copy .ctas {
    margin-top: 18px;
  }

  .th-p-decorative-vases .vases-hero-copy .btn {
    flex: 1 1 auto;
    min-width: 146px;
  }

  .th-p-decorative-vases .vases-hero-docket {
    order: 3;
    display: grid;
    grid-template-columns: 34px minmax(0, 1fr) auto;
    gap: 11px;
    align-items: center;
    padding: 15px 20px;
    border-top: 1px solid var(--vases-line);
    border-left: 0;
  }

  .th-p-decorative-vases .vases-hero-docket p {
    max-width: none;
    font-size: 10px;
  }

  .th-p-decorative-vases .vases-docket-rule {
    width: 28px;
  }

  .th-p-decorative-vases .vases-hero-figure {
    order: 2;
    min-height: 300px;
    aspect-ratio: 5 / 4;
    clip-path: polygon(0 4%, 100% 0, 100% 96%, 0 100%);
  }

  .th-p-decorative-vases .vases-hero-figure .hero-media,
  .th-p-decorative-vases .vases-hero-figure .theme-empty-media {
    object-position: 58% center;
  }

  .th-p-decorative-vases .vases-hero-figure figcaption {
    right: 20px;
    bottom: 20px;
  }

  .th-p-decorative-vases .vases-browse-rail {
    order: 4;
    margin: 0;
    padding: 20px;
    border-right: 0;
    border-bottom: 0;
    border-left: 0;
    box-shadow: none;
  }

  .th-p-decorative-vases .vases-rail-list {
    display: flex;
    gap: 7px;
    overflow-x: auto;
    padding-bottom: 2px;
    border-top: 0;
    scrollbar-width: none;
  }

  .th-p-decorative-vases .vases-rail-item {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    flex: 0 0 min(208px, 68vw);
    gap: 5px 9px;
    min-height: 78px;
    padding: 10px 11px;
    border: 1px solid var(--vases-line);
  }

  .th-p-decorative-vases .vases-rail-name {
    font-size: 20px;
  }

  .th-p-decorative-vases .vases-rail-count {
    grid-column: 2;
    text-align: left;
  }

  .th-p-decorative-vases .vases-rail-link {
    margin-top: 10px;
  }

  .th-p-decorative-vases .motion-toggle {
    top: auto;
    right: 14px;
    bottom: 14px;
  }

  .th-p-decorative-vases .vases-discovery {
    padding: 60px 16px 72px;
  }

  .th-p-decorative-vases .vases-discovery-head {
    display: block;
    margin-bottom: 27px;
  }

  .th-p-decorative-vases .vases-discovery-head h2 {
    max-width: 10ch;
    font-size: clamp(42px, 12vw, 62px);
  }

  .th-p-decorative-vases .vases-discovery-head > p {
    margin-top: 16px;
  }

  .th-p-decorative-vases .vases-index-card {
    min-height: 286px;
  }

  .th-p-decorative-vases .vases-index-visual {
    min-height: 176px;
  }

  .th-p-decorative-vases .vases-index-copy {
    min-height: 105px;
    padding: 14px;
  }

  .th-p-decorative-vases .vases-index-copy strong {
    font-size: 24px;
  }

  .th-p-decorative-vases .vases-index-arrow {
    right: 13px;
    bottom: 14px;
  }

  .th-p-decorative-vases .vases-product-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 22px 12px;
  }

  .th-p-decorative-vases #shop .sec-h {
    align-items: start;
    flex-direction: column;
  }

  .th-p-decorative-vases #shop .chips {
    width: 100%;
    overflow-x: auto;
    flex-wrap: nowrap;
    padding-bottom: 3px;
    scrollbar-width: none;
  }

  .th-p-decorative-vases #shop .chip {
    flex: 0 0 auto;
    min-height: 44px;
  }
}

@media (max-width: 390px) {
  .th-p-decorative-vases .vases-hero-copy-slot {
    padding-inline: 16px;
  }

  .th-p-decorative-vases .vases-hero-copy h1 {
    font-size: 45px;
  }

  .th-p-decorative-vases .vases-hero-copy h1.long {
    font-size: 35px;
  }

  .th-p-decorative-vases .vases-hero-copy .btn {
    min-width: 0;
    padding-inline: 12px;
    font-size: 9px;
  }

  .th-p-decorative-vases .vases-hero-figure {
    min-height: 278px;
  }

  .th-p-decorative-vases .vases-index-copy strong {
    font-size: 21px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .th-p-decorative-vases .has-hero-motion .hero-media,
  .th-p-decorative-vases .vases-index-visual img,
  .th-p-decorative-vases .vases-index-arrow,
  .th-p-decorative-vases .vases-rail-link span {
    animation: none !important;
    transition: none !important;
  }
}
`;

import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-watches',
  name: 'MERIDIAN HOUSE',
  for: 'Collectors drawn to mechanical detail and considered pace',
  vibe: 'Warm horology, quiet ceremony, and a close look at the work within',
  category: 'Mechanical watches and horology',
  group: 'fashion',
  display: 'Cormorant Garamond',
  body: 'DM Sans',
  displayWeight: 500,
  tracking: '-.035em',
  colors: {
    bg: '#F2EFE7',
    surface: '#FAF7F0',
    ink: '#241C18',
    muted: '#776C63',
    line: '#C9C0B4',
    accent: '#743D2F',
    onAccent: '#FFF9F1',
    panel: '#211814',
    onPanel: '#F8EEDA',
    foot: '#16110F',
    onFoot: '#F5ECDD',
    bar: '#E6E0D5',
    onBar: '#2B211B',
    badge: '#D8B678',
    onBadge: '#271A11',
  },
  header: 'split',
  hero: 'spotlight',
  card: 'minimal',
  ratio: '4/5',
  rCard: 0,
  rBtn: 0,
  motion: 'pan',
  copy: {
    eyebrow: 'The horology edit',
    collection: 'The current selection',
    cta: 'Explore watches',
    title: 'Time, held in light.',
    subtitle: 'A slower way to browse the pieces that keep your attention.',
  },
});

const itemNumber = (index) => String(index + 1).padStart(2, '0');
const countLabel = (count) => `${count} ${Number(count) === 1 ? 'piece' : 'pieces'}`;

export function hero(ctx) {
  return `<section class="hero category-hero watches-dial-hero${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="watches-hero-stage">
      <div class="watches-hero-frame">
        ${ctx.media(0, { priority: true, lazy: false })}
      </div>
      <div class="watches-hero-shade" aria-hidden="true"></div>
      <div class="watches-hero-grain" aria-hidden="true"></div>
      <div class="watches-hero-copy-wrap">
        ${ctx.copy('watches-hero-copy')}
        <p class="watches-hero-signoff">An object of attention.</p>
      </div>
      <aside class="watches-detail-rail" aria-label="A closer look">
        <p class="watches-rail-kicker">A closer look</p>
        <ol>
          <li><span>01</span><strong>Dial</strong><em>Where the day begins.</em></li>
          <li><span>02</span><strong>Case</strong><em>The line around the light.</em></li>
          <li><span>03</span><strong>Movement</strong><em>What carries the moment.</em></li>
        </ol>
      </aside>
      <p class="watches-atelier-mark">The atelier<br>in close view</p>
      ${ctx.controls}
    </div>
  </section>`;
}

export function discovery(ctx) {
  if (ctx.cats.length >= 2) {
    const categories = ctx.cats.slice(0, 4);
    return `<section class="theme-discovery watches-discovery" aria-labelledby="watches-discovery-title">
      <div class="watches-discovery-intro">
        <p class="eyebrow">${ctx.esc(ctx.t.copy.collection)}</p>
        <h2 id="watches-discovery-title">Choose the part<br>that holds your gaze.</h2>
        <p>Browse the live collections currently available from ${ctx.esc(ctx.store.store_name)}.</p>
      </div>
      <div class="watches-complication-rail">
        ${categories.map((category, index) => `<a class="watches-category" href="${ctx.categoryLink(category.name)}">
          <span class="watches-category-number">${itemNumber(index)}</span>
          <span class="watches-category-disc" aria-hidden="true"></span>
          <strong>${ctx.esc(category.name)}</strong>
          <span class="watches-category-count">${ctx.esc(countLabel(category.count))}</span>
          <span class="watches-category-arrow" aria-hidden="true">↗</span>
        </a>`).join('')}
      </div>
    </section>`;
  }

  if (!ctx.products.length) return '';

  const products = ctx.products.slice(0, 3);
  return `<section class="theme-discovery watches-discovery watches-ledger" aria-labelledby="watches-discovery-title">
    <div class="watches-discovery-intro">
      <p class="eyebrow">${ctx.esc(ctx.t.copy.collection)}</p>
      <h2 id="watches-discovery-title">Begin with the pieces<br>in the room.</h2>
    </div>
    <div class="watches-piece-ledger">
      ${products.map((product, index) => `<a href="${ctx.productLink(product)}">
        <span>${itemNumber(index)}</span>
        <strong>${ctx.esc(product.title)}</strong>
        <em>${ctx.esc(ctx.money(product.price_cents ?? 0, product.currency || 'usd'))}</em>
        <i aria-hidden="true">↗</i>
      </a>`).join('')}
    </div>
  </section>`;
}

export const css = `
.th-p-watches {
  --watch-paper: #f2efe7;
  --watch-ink: #241c18;
  --watch-wine: #743d2f;
  --watch-gold: #d8b678;
  --watch-dark: #211814;
  background: var(--watch-paper);
  color: var(--watch-ink);
}

.th-p-watches .category-hero.watches-dial-hero {
  margin: 0;
  background: var(--watch-dark);
  color: #fff9f1;
}

.th-p-watches .watches-hero-stage {
  position: relative;
  isolation: isolate;
  min-height: clamp(560px, 57vw, 790px);
  overflow: hidden;
  background: #211814;
}

.th-p-watches .watches-hero-frame {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.th-p-watches .watches-hero-frame .hero-media,
.th-p-watches .watches-hero-frame .theme-empty-media {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
  object-fit: cover;
}

.th-p-watches .watches-hero-frame .hero-media {
  object-position: 61% center;
}

.th-p-watches .watches-hero-frame .theme-empty-media {
  background:
    radial-gradient(circle at 67% 46%, #865241 0 2%, #3d211a 19%, transparent 35%),
    linear-gradient(118deg, #1a1210, #4c2b21 56%, #1b1411);
  color: #f7e9d4;
}

.th-p-watches .watches-hero-shade {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    linear-gradient(90deg, rgba(12, 9, 7, .84) 0%, rgba(17, 11, 8, .64) 27%, rgba(16, 10, 8, .13) 62%, rgba(17, 10, 7, .42) 100%),
    linear-gradient(0deg, rgba(10, 7, 6, .52), transparent 40%);
}

.th-p-watches .watches-hero-grain {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  opacity: .18;
  background-image: radial-gradient(rgba(255, 239, 207, .45) .55px, transparent .7px);
  background-size: 5px 5px;
  mix-blend-mode: soft-light;
}

.th-p-watches .watches-hero-copy-wrap {
  position: relative;
  z-index: 2;
  width: min(39rem, 48%);
  padding: clamp(42px, 7vw, 108px) 0 clamp(48px, 6vw, 86px) clamp(28px, 5.4vw, 104px);
}

.th-p-watches .watches-hero-copy {
  max-width: 31rem;
}

.th-p-watches .watches-hero-copy .eyebrow,
.th-p-watches .watches-discovery .eyebrow {
  margin: 0 0 18px;
  color: var(--watch-gold);
  font: 600 10px/1.2 var(--body);
  letter-spacing: .2em;
  text-transform: uppercase;
}

.th-p-watches .watches-hero-copy h1 {
  max-width: 8ch;
  margin: 0;
  color: #fff9f1;
  font-family: var(--display);
  font-size: clamp(54px, 6.2vw, 114px);
  font-weight: 500;
  letter-spacing: -.055em;
  line-height: .84;
  text-wrap: balance;
}

.th-p-watches .watches-hero-copy h1.long {
  max-width: 11ch;
  font-size: clamp(45px, 4.7vw, 84px);
  line-height: .91;
}

.th-p-watches .watches-hero-copy .sub {
  max-width: 30rem;
  margin: 27px 0 0;
  color: rgba(255, 248, 237, .82);
  font: 400 clamp(14px, 1.25vw, 17px)/1.55 var(--body);
}

.th-p-watches .watches-hero-copy .ctas {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 31px;
}

.th-p-watches .watches-hero-copy .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  border: 1px solid rgba(255, 249, 241, .78);
  border-radius: 0;
  padding: 0 20px;
  background: transparent;
  color: #fff9f1;
  font: 600 11px/1 var(--body);
  letter-spacing: .09em;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-watches .watches-hero-copy .btn:hover {
  background: #fff9f1;
  color: var(--watch-dark);
}

.th-p-watches .watches-hero-copy .btn.ghost {
  border-color: transparent;
  color: rgba(255, 249, 241, .8);
}

.th-p-watches .watches-hero-copy .btn.ghost:hover {
  background: transparent;
  color: #fff9f1;
  text-decoration: underline;
  text-underline-offset: 5px;
}

.th-p-watches .watches-hero-signoff {
  margin: clamp(68px, 12vw, 174px) 0 0;
  color: rgba(255, 249, 241, .62);
  font: 500 10px/1.35 var(--body);
  letter-spacing: .16em;
  text-transform: uppercase;
}

.th-p-watches .watches-detail-rail {
  position: absolute;
  z-index: 2;
  top: 0;
  right: 0;
  width: clamp(172px, 15.5vw, 260px);
  min-height: 100%;
  padding: clamp(28px, 4vw, 64px) clamp(20px, 2.6vw, 44px);
  border-left: 1px solid rgba(255, 248, 237, .34);
  background: rgba(23, 15, 11, .34);
  backdrop-filter: blur(3px);
}

.th-p-watches .watches-rail-kicker {
  margin: 0 0 clamp(42px, 6vw, 104px);
  color: var(--watch-gold);
  font: 600 9px/1.3 var(--body);
  letter-spacing: .2em;
  text-transform: uppercase;
}

.th-p-watches .watches-detail-rail ol {
  display: grid;
  gap: clamp(28px, 4vw, 66px);
  margin: 0;
  padding: 0;
  list-style: none;
}

.th-p-watches .watches-detail-rail li {
  display: grid;
  gap: 5px;
  padding-bottom: 17px;
  border-bottom: 1px solid rgba(255, 248, 237, .42);
}

.th-p-watches .watches-detail-rail li span {
  color: var(--watch-gold);
  font: 600 10px/1 var(--body);
  letter-spacing: .14em;
}

.th-p-watches .watches-detail-rail li strong {
  color: #fff8eb;
  font: 500 clamp(19px, 1.7vw, 27px)/.95 var(--display);
  letter-spacing: -.035em;
}

.th-p-watches .watches-detail-rail li em {
  color: rgba(255, 248, 237, .72);
  font: 400 11px/1.4 var(--body);
  font-style: normal;
}

.th-p-watches .watches-atelier-mark {
  position: absolute;
  z-index: 2;
  right: clamp(214px, 20.5vw, 340px);
  bottom: clamp(30px, 4vw, 62px);
  margin: 0;
  color: rgba(255, 248, 237, .76);
  font: 600 9px/1.45 var(--body);
  letter-spacing: .18em;
  text-transform: uppercase;
}

.th-p-watches .watches-dial-hero .motion-toggle {
  position: absolute;
  z-index: 3;
  right: clamp(206px, 20vw, 326px);
  bottom: clamp(28px, 3vw, 50px);
  min-height: 44px;
  border: 1px solid rgba(255, 248, 237, .44);
  border-radius: 0;
  padding: 0 12px;
  background: rgba(30, 19, 14, .35);
  color: #fff8eb;
  font: 600 9px/1 var(--body);
  letter-spacing: .13em;
  text-transform: uppercase;
}

.th-p-watches .watches-dial-hero .motion-toggle:hover {
  background: #fff8eb;
  color: var(--watch-dark);
}

.th-p-watches .watches-discovery {
  display: grid;
  grid-template-columns: minmax(210px, .72fr) minmax(0, 2.28fr);
  gap: clamp(28px, 5vw, 92px);
  padding: clamp(50px, 7vw, 118px) clamp(24px, 5vw, 104px);
  border-bottom: 1px solid var(--line);
  background: var(--watch-paper);
}

.th-p-watches .watches-discovery-intro {
  max-width: 300px;
}

.th-p-watches .watches-discovery .eyebrow {
  color: var(--watch-wine);
}

.th-p-watches .watches-discovery h2 {
  margin: 0;
  color: var(--watch-ink);
  font: 500 clamp(34px, 3.25vw, 61px)/.9 var(--display);
  letter-spacing: -.05em;
  text-wrap: balance;
}

.th-p-watches .watches-discovery-intro > p:not(.eyebrow) {
  max-width: 24ch;
  margin: 24px 0 0;
  color: var(--muted);
  font: 400 14px/1.55 var(--body);
}

.th-p-watches .watches-complication-rail {
  display: grid;
  grid-template-columns: repeat(4, minmax(130px, 1fr));
  border-top: 1px solid var(--line);
}

.th-p-watches .watches-category {
  position: relative;
  display: flex;
  min-height: 288px;
  flex-direction: column;
  align-items: flex-start;
  padding: 20px 18px 22px;
  border-right: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  color: var(--watch-ink);
  text-decoration: none;
}

.th-p-watches .watches-category:first-child {
  border-left: 1px solid var(--line);
}

.th-p-watches .watches-category:hover {
  background: #e9e1d5;
}

.th-p-watches .watches-category-number {
  color: var(--watch-wine);
  font: 600 10px/1 var(--body);
  letter-spacing: .15em;
}

.th-p-watches .watches-category-disc {
  width: clamp(74px, 7.7vw, 122px);
  aspect-ratio: 1;
  margin: auto 0 18px;
  border: 1px solid #a77b58;
  border-radius: 50%;
  background:
    radial-gradient(circle at center, transparent 0 22%, #d5b27d 22.5% 23.5%, transparent 24% 47%, #7a3d30 47.5% 49%, transparent 49.5%),
    repeating-conic-gradient(from -8deg, #80503c 0deg 2deg, transparent 2deg 11deg);
  box-shadow: inset 0 0 0 10px rgba(242, 239, 231, .52);
}

.th-p-watches .watches-category strong {
  max-width: 12ch;
  font: 500 clamp(20px, 1.7vw, 30px)/.95 var(--display);
  letter-spacing: -.035em;
}

.th-p-watches .watches-category-count {
  margin-top: 9px;
  color: var(--muted);
  font: 500 10px/1.2 var(--body);
  letter-spacing: .08em;
  text-transform: uppercase;
}

.th-p-watches .watches-category-arrow {
  position: absolute;
  right: 18px;
  bottom: 20px;
  color: var(--watch-wine);
  font: 400 22px/1 var(--display);
}

.th-p-watches .watches-ledger {
  align-items: start;
}

.th-p-watches .watches-piece-ledger {
  border-top: 1px solid var(--line);
}

.th-p-watches .watches-piece-ledger a {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto 30px;
  align-items: center;
  gap: 14px;
  min-height: 82px;
  border-bottom: 1px solid var(--line);
  color: var(--watch-ink);
  text-decoration: none;
}

.th-p-watches .watches-piece-ledger a:hover {
  color: var(--watch-wine);
}

.th-p-watches .watches-piece-ledger span,
.th-p-watches .watches-piece-ledger em {
  color: var(--muted);
  font: 600 10px/1 var(--body);
  font-style: normal;
  letter-spacing: .11em;
}

.th-p-watches .watches-piece-ledger strong {
  overflow-wrap: anywhere;
  font: 500 clamp(20px, 2vw, 31px)/1 var(--display);
  letter-spacing: -.035em;
}

.th-p-watches .watches-piece-ledger i {
  color: var(--watch-wine);
  font: 400 21px/1 var(--display);
  font-style: normal;
}

.th-p-watches #shop {
  padding-top: clamp(46px, 6vw, 88px);
  background: var(--watch-paper);
}

.th-p-watches #shop > :is(h2, .section-title) {
  color: var(--watch-ink);
  font-family: var(--display);
  letter-spacing: -.035em;
}

.th-p-watches #shop :is(.product-card, .card) {
  border-radius: 0;
}

@media (max-width: 900px) {
  .th-p-watches .watches-hero-copy-wrap {
    width: min(37rem, 59%);
  }

  .th-p-watches .watches-detail-rail {
    width: 184px;
    padding-right: 20px;
    padding-left: 20px;
  }

  .th-p-watches .watches-atelier-mark,
  .th-p-watches .watches-dial-hero .motion-toggle {
    right: 205px;
  }

  .th-p-watches .watches-discovery {
    grid-template-columns: 1fr;
    gap: 38px;
  }

  .th-p-watches .watches-discovery-intro {
    max-width: 570px;
  }
}

@media (max-width: 640px) {
  .th-p-watches .watches-hero-stage {
    min-height: 690px;
  }

  .th-p-watches .watches-hero-frame .hero-media {
    object-position: 63% center;
  }

  .th-p-watches .watches-hero-shade {
    background: linear-gradient(0deg, rgba(12, 8, 7, .83) 0%, rgba(14, 9, 7, .34) 63%, rgba(14, 9, 7, .23) 100%);
  }

  .th-p-watches .watches-hero-copy-wrap {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    width: auto;
    padding: 92px 24px 28px;
    background: linear-gradient(0deg, rgba(15, 9, 7, .96), rgba(15, 9, 7, 0));
  }

  .th-p-watches .watches-hero-copy h1 {
    max-width: 9ch;
    font-size: clamp(51px, 17vw, 74px);
  }

  .th-p-watches .watches-hero-copy h1.long {
    max-width: 13ch;
    font-size: clamp(39px, 12vw, 55px);
  }

  .th-p-watches .watches-hero-copy .sub {
    margin-top: 18px;
  }

  .th-p-watches .watches-hero-copy .ctas {
    margin-top: 23px;
  }

  .th-p-watches .watches-hero-copy .btn {
    flex: 1 1 155px;
    padding-inline: 14px;
  }

  .th-p-watches .watches-hero-signoff,
  .th-p-watches .watches-detail-rail,
  .th-p-watches .watches-atelier-mark {
    display: none;
  }

  .th-p-watches .watches-dial-hero .motion-toggle {
    top: 20px;
    right: 20px;
    bottom: auto;
  }

  .th-p-watches .watches-discovery {
    gap: 31px;
    padding: 48px 20px 58px;
  }

  .th-p-watches .watches-discovery h2 {
    font-size: clamp(39px, 11.5vw, 55px);
  }

  .th-p-watches .watches-discovery-intro > p:not(.eyebrow) {
    max-width: 33ch;
  }

  .th-p-watches .watches-complication-rail {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .th-p-watches .watches-category {
    min-height: 220px;
    padding: 17px 13px 18px;
  }

  .th-p-watches .watches-category:nth-child(odd) {
    border-left: 1px solid var(--line);
  }

  .th-p-watches .watches-category-disc {
    width: 70px;
  }

  .th-p-watches .watches-category strong {
    font-size: 24px;
  }

  .th-p-watches .watches-category-arrow {
    right: 13px;
    bottom: 16px;
  }

  .th-p-watches .watches-piece-ledger a {
    grid-template-columns: 28px minmax(0, 1fr) 20px;
    gap: 10px;
    min-height: 76px;
  }

  .th-p-watches .watches-piece-ledger em {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .th-p-watches .watches-hero-frame .hero-media {
    transform: none !important;
  }
}
`;

import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-haircare',
  name: 'RINSE / ROOM',
  for: 'haircare, treatment, and styling objects arranged around a personal routine',
  vibe: 'smoked glass, wet-look shine, chrome rails, and an after-hours washroom',
  category: 'Haircare ritual and styling',
  group: 'beauty',
  display: 'Bodoni Moda',
  body: 'Space Grotesk',
  displayWeight: 500,
  tracking: '-.055em',
  colors: {
    bg: '#F2E9DC',
    surface: '#FBF7EF',
    ink: '#24181D',
    muted: '#74646A',
    line: '#D3C2B8',
    accent: '#6B253E',
    onAccent: '#FFF8F0',
    panel: '#E3CFC0',
    onPanel: '#24181D',
    foot: '#24181D',
    onFoot: '#FFF7EB',
    bar: '#6B253E',
    onBar: '#FFF8F0',
    badge: '#E8B46B',
    onBadge: '#24181D',
  },
  header: 'center',
  hero: 'spotlight',
  card: 'boxed',
  ratio: '4/5',
  rCard: 0,
  rBtn: 999,
  motion: 'pan',
  copy: {
    eyebrow: 'A washroom study',
    collection: 'The strand edit',
    cta: 'See the edit',
    title: 'Make space for the good hair days.',
    subtitle: 'A considered mix of everyday hair ritual and finishing touch.'
  }
});

export function hero(ctx) {
  const storeName = ctx.esc(ctx.store?.store_name || ctx.t.name);

  return `
    <section class="hero category-hero p-haircare-hero${ctx.heroClass}"${ctx.heroAttrs}>
      <div class="p-haircare-photo-frame">
        ${ctx.media(0, { priority: true, lazy: false, decorative: false })}
        <div class="p-haircare-photo-gloss" aria-hidden="true"></div>
      </div>
      <div class="p-haircare-hero-ledger" aria-hidden="true">
        <span>Rinse</span><span>Set</span><span>Repeat</span>
      </div>
      <div class="p-haircare-comb-shadow" aria-hidden="true"></div>
      <div class="p-haircare-copy-stage">
        ${ctx.copy('p-haircare-copy')}
      </div>
      <div class="p-haircare-hero-stamp" aria-hidden="true">
        <span>01</span>
        <span>${storeName}</span>
      </div>
      ${ctx.controls}
    </section>
  `;
}

export function discovery(ctx) {
  const categories = (ctx.cats || []).filter((category) => category && category.name).slice(0, 4);
  const products = (ctx.products || []).slice(0, 3);

  if (categories.length >= 2) {
    const lanes = categories.map((category, index) => {
      const count = Number(category.count) || 0;
      const itemLabel = count === 1 ? 'piece' : 'pieces';
      const number = String(index + 1).padStart(2, '0');

      return `
        <a class="p-haircare-ritual-lane" href="${ctx.esc(ctx.categoryLink(category.name))}">
          <span class="p-haircare-lane-no" aria-hidden="true">${number}</span>
          <span class="p-haircare-lane-title">${ctx.esc(category.name)}</span>
          <span class="p-haircare-lane-count">${ctx.esc(String(count))} ${itemLabel}</span>
          <span class="p-haircare-lane-arrow" aria-hidden="true">↗</span>
        </a>
      `;
    }).join('');

    return `
      <section class="theme-discovery p-haircare-discovery" aria-labelledby="p-haircare-discovery-title">
        <div class="p-haircare-discovery-intro">
          <p class="p-haircare-kicker">Start by instinct</p>
          <h2 id="p-haircare-discovery-title">Find the shelf that feels like yours.</h2>
          <p>Follow a category into the current collection, one small ritual at a time.</p>
        </div>
        <div class="p-haircare-ritual-lanes">
          ${lanes}
        </div>
      </section>
    `;
  }

  if (!products.length) return '';

  const pieces = products.map((product, index) => {
    const title = product.title || product.name || '';
    const image = product.image_url
      ? `<img src="${ctx.esc(product.image_url)}" alt="${ctx.esc(product.alt_text || title)}" loading="lazy" decoding="async">`
      : '<i aria-hidden="true"></i>';
    const category = product.category ? `<small>${ctx.esc(product.category)}</small>` : '';
    const price = product.price_cents != null
      ? `<em>${ctx.esc(ctx.money(product.price_cents, product.currency))}</em>`
      : '';

    return `
      <a class="p-haircare-piece" href="${ctx.esc(ctx.productLink(product))}">
        <span class="p-haircare-piece-no" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
        <span class="p-haircare-piece-media">${image}</span>
        <span class="p-haircare-piece-copy"><b>${ctx.esc(title)}</b>${category}${price}</span>
      </a>
    `;
  }).join('');

  return `
    <section class="theme-discovery p-haircare-discovery p-haircare-discovery-pieces" aria-labelledby="p-haircare-pieces-title">
      <div class="p-haircare-discovery-intro">
        <p class="p-haircare-kicker">In the rotation</p>
        <h2 id="p-haircare-pieces-title">A few good places to begin.</h2>
      </div>
      <div class="p-haircare-pieces">${pieces}</div>
    </section>
  `;
}

export const css = `
.th-p-haircare {
  --p-haircare-chalk: #f2e9dc;
  --p-haircare-paper: #fbf7ef;
  --p-haircare-ink: #24181d;
  --p-haircare-wine: #6b253e;
  --p-haircare-blush: #e3cfc0;
  --p-haircare-line: #d3c2b8;
  --p-haircare-muted: #74646a;
  background: var(--p-haircare-chalk);
  color: var(--p-haircare-ink);
  overflow: hidden;
}

.th-p-haircare .hd {
  border-bottom-color: color-mix(in srgb, var(--p-haircare-ink) 18%, transparent);
  background: color-mix(in srgb, var(--p-haircare-chalk) 92%, transparent);
}

.th-p-haircare .hd .wrap {
  min-height: 4.8rem;
}

.th-p-haircare .brand {
  font-family: var(--display, 'Bodoni Moda', Georgia, serif);
  font-size: calc(1.55rem * var(--ts, 1));
  font-weight: 500;
  letter-spacing: .055em;
}

.th-p-haircare .nav {
  gap: clamp(.85rem, 2.4vw, 2.1rem);
  font-size: .67rem;
  font-weight: 600;
  letter-spacing: .15em;
  text-transform: uppercase;
}

.th-p-haircare .cart {
  width: 2.7rem;
  height: 2.7rem;
  border-color: var(--p-haircare-ink);
  border-radius: 50%;
}

.th-p-haircare .category-hero {
  position: relative;
  min-height: min(51rem, calc(100svh - 1rem));
  overflow: hidden;
  isolation: isolate;
  background:
    radial-gradient(circle at 88% 82%, rgba(232, 180, 107, .6) 0 2.5%, transparent 2.7%),
    linear-gradient(116deg, #5b2736 0%, #7b3a4a 38%, #e2c7b4 38.2%, #d5b9ab 100%);
}

.th-p-haircare .p-haircare-photo-frame {
  position: absolute;
  z-index: -3;
  top: clamp(1rem, 3.5vw, 3.5rem);
  right: clamp(1rem, 4.8vw, 5rem);
  bottom: clamp(1rem, 3.5vw, 3.5rem);
  left: clamp(7.4rem, 18vw, 19rem);
  overflow: hidden;
  background: #d3bdaf;
  box-shadow: 0 1.2rem 2.7rem rgba(40, 14, 23, .22);
  clip-path: polygon(5% 0, 100% 0, 94.5% 100%, 0 100%);
}

.th-p-haircare .p-haircare-photo-frame .hero-media,
.th-p-haircare .p-haircare-photo-frame .theme-empty-media {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.th-p-haircare .p-haircare-photo-frame .theme-empty-media {
  min-height: 100%;
  background:
    radial-gradient(ellipse 27% 13% at 64% 65%, rgba(65, 26, 38, .48) 0 28%, transparent 29%),
    repeating-radial-gradient(ellipse at 69% 56%, transparent 0 1.2rem, rgba(251, 247, 239, .4) 1.25rem 1.33rem, transparent 1.38rem 2.25rem),
    linear-gradient(125deg, #cfa997 0%, #ead9c8 47%, #74505d 48%, #3a1d29 100%);
}

.th-p-haircare .p-haircare-photo-gloss {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(111deg, rgba(255, 247, 238, .24) 0 2%, transparent 2.2% 42%, rgba(255, 247, 238, .14) 42.2% 43.4%, transparent 43.6% 100%),
    linear-gradient(180deg, rgba(24, 9, 15, .05), rgba(24, 9, 15, .24));
  pointer-events: none;
}

.th-p-haircare .p-haircare-hero-ledger {
  display: flex;
  position: absolute;
  z-index: 1;
  top: clamp(1.4rem, 3vw, 3rem);
  left: clamp(1.35rem, 4.3vw, 4.6rem);
  width: min(9.7rem, 12vw);
  flex-direction: column;
  gap: .8rem;
  color: #fff6ee;
  font-family: var(--body, 'Space Grotesk', sans-serif);
  font-size: .58rem;
  font-weight: 600;
  letter-spacing: .24em;
  line-height: 1.35;
  text-transform: uppercase;
}

.th-p-haircare .p-haircare-hero-ledger span {
  display: flex;
  align-items: center;
  gap: .55rem;
}

.th-p-haircare .p-haircare-hero-ledger span::before {
  width: 1.25rem;
  height: 1px;
  background: currentColor;
  content: '';
  opacity: .65;
}

.th-p-haircare .p-haircare-comb-shadow {
  position: absolute;
  z-index: -1;
  top: 11%;
  right: clamp(-2rem, 2vw, 2rem);
  width: clamp(5.3rem, 9vw, 8.4rem);
  height: 78%;
  border-left: 1px solid rgba(255, 247, 238, .44);
  border-right: 1px solid rgba(255, 247, 238, .22);
  background: repeating-linear-gradient(90deg, transparent 0 .73rem, rgba(255, 247, 238, .33) .76rem .83rem, transparent .86rem 1.48rem);
  opacity: .76;
  transform: rotate(7deg);
}

.th-p-haircare .p-haircare-copy-stage {
  position: absolute;
  z-index: 2;
  right: clamp(2.5rem, 16vw, 15.6rem);
  bottom: clamp(2rem, 7.1vw, 6.7rem);
  left: clamp(2.8rem, 12vw, 12.4rem);
  max-width: min(41rem, 60vw);
}

.th-p-haircare .p-haircare-copy {
  padding: clamp(1.35rem, 2.5vw, 2.35rem) clamp(1.45rem, 3.2vw, 3.15rem) clamp(1.6rem, 3vw, 2.7rem);
  border: 1px solid rgba(255, 248, 240, .6);
  background: rgba(251, 247, 239, .92);
  box-shadow: .85rem .85rem 0 rgba(67, 21, 37, .35);
}

.th-p-haircare .p-haircare-copy .eyebrow,
.th-p-haircare .p-haircare-kicker {
  margin: 0 0 .8rem;
  color: var(--p-haircare-wine);
  font-family: var(--body, 'Space Grotesk', sans-serif);
  font-size: .61rem;
  font-weight: 700;
  letter-spacing: .2em;
  line-height: 1.45;
  text-transform: uppercase;
}

.th-p-haircare .p-haircare-copy h1 {
  max-width: 12ch;
  margin: 0;
  color: var(--p-haircare-ink);
  font-family: var(--display, 'Bodoni Moda', Georgia, serif);
  font-size: calc(clamp(3.25rem, 6.1vw, 6.9rem) * var(--hero, 1));
  font-weight: 500;
  letter-spacing: -.07em;
  line-height: .83;
  overflow-wrap: anywhere;
  text-wrap: balance;
}

.th-p-haircare .p-haircare-copy h1.long {
  max-width: 18ch;
  font-size: calc(clamp(2.55rem, 4.8vw, 5.25rem) * min(var(--hero, 1), 1.1));
  line-height: .88;
}

.th-p-haircare .p-haircare-copy .sub {
  max-width: 39rem;
  margin: 1.15rem 0 0;
  color: #544149;
  font-family: var(--body, 'Space Grotesk', sans-serif);
  font-size: clamp(.78rem, .95vw, .95rem);
  letter-spacing: .015em;
  line-height: 1.58;
}

.th-p-haircare .p-haircare-copy .ctas {
  display: flex;
  margin-top: 1.45rem;
  flex-wrap: wrap;
  gap: .65rem;
}

.th-p-haircare .p-haircare-copy .btn {
  display: inline-flex;
  min-height: 2.8rem;
  padding: .72rem 1.15rem;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--p-haircare-wine);
  border-radius: 99rem;
  background: var(--p-haircare-wine);
  color: #fff8f0;
  font-family: var(--body, 'Space Grotesk', sans-serif);
  font-size: .63rem;
  font-weight: 700;
  letter-spacing: .14em;
  line-height: 1.2;
  text-align: center;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-haircare .p-haircare-copy .btn.ghost {
  background: transparent;
  color: var(--p-haircare-wine);
}

.th-p-haircare .p-haircare-copy .btn:hover,
.th-p-haircare .p-haircare-copy .btn:focus-visible {
  background: #3d1426;
  color: #fff8f0;
  outline: none;
}

.th-p-haircare .p-haircare-hero-stamp {
  display: grid;
  position: absolute;
  z-index: 1;
  right: clamp(1.4rem, 4.1vw, 4rem);
  bottom: clamp(1.5rem, 3.6vw, 3.4rem);
  width: min(10rem, 13vw);
  gap: .35rem;
  padding-top: .7rem;
  border-top: 1px solid rgba(255, 248, 240, .73);
  color: #fff8f0;
  font-family: var(--body, 'Space Grotesk', sans-serif);
  font-size: .56rem;
  font-weight: 600;
  letter-spacing: .16em;
  line-height: 1.45;
  text-transform: uppercase;
}

.th-p-haircare .p-haircare-hero-stamp span:last-child {
  overflow-wrap: anywhere;
}

.th-p-haircare .p-haircare-hero .motion-toggle {
  position: absolute;
  z-index: 3;
  top: clamp(1.15rem, 2.4vw, 2.4rem);
  right: clamp(1.15rem, 2.5vw, 2.5rem);
  min-width: 2.8rem;
  min-height: 2.8rem;
  border: 1px solid rgba(255, 248, 240, .72);
  border-radius: 50%;
  background: rgba(67, 21, 37, .62);
  color: #fff8f0;
  font-family: var(--body, 'Space Grotesk', sans-serif);
  font-size: .55rem;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.th-p-haircare .p-haircare-hero.has-hero-motion .p-haircare-photo-frame .hero-media {
  animation: p-haircare-reflection-pan 18s ease-in-out infinite alternate;
}

.th-p-haircare .p-haircare-discovery {
  display: grid;
  grid-template-columns: minmax(15rem, .9fr) minmax(0, 1.7fr);
  gap: clamp(2.5rem, 7vw, 8rem);
  padding: clamp(4rem, 8vw, 8rem) clamp(1.25rem, 5vw, 5.2rem) clamp(4.4rem, 7vw, 7rem);
  border-bottom: 1px solid var(--p-haircare-line);
  background:
    linear-gradient(90deg, rgba(107, 37, 62, .1) 0 1px, transparent 1px) 0 0 / 20% 100%,
    var(--p-haircare-chalk);
}

.th-p-haircare .p-haircare-discovery-intro {
  align-self: start;
  max-width: 23rem;
}

.th-p-haircare .p-haircare-discovery-intro h2 {
  max-width: 9ch;
  margin: 0;
  color: var(--p-haircare-ink);
  font-family: var(--display, 'Bodoni Moda', Georgia, serif);
  font-size: calc(clamp(2.5rem, 4.25vw, 4.7rem) * var(--ts, 1));
  font-weight: 500;
  letter-spacing: -.065em;
  line-height: .88;
  overflow-wrap: anywhere;
  text-wrap: balance;
}

.th-p-haircare .p-haircare-discovery-intro > p:last-child {
  max-width: 25rem;
  margin: 1.35rem 0 0;
  color: var(--p-haircare-muted);
  font-family: var(--body, 'Space Grotesk', sans-serif);
  font-size: .88rem;
  line-height: 1.65;
}

.th-p-haircare .p-haircare-ritual-lanes {
  align-self: center;
  border-top: 1px solid var(--p-haircare-ink);
}

.th-p-haircare .p-haircare-ritual-lane {
  display: grid;
  position: relative;
  min-height: 5.5rem;
  grid-template-columns: 3.4rem minmax(0, 1fr) auto 2rem;
  align-items: center;
  gap: clamp(.55rem, 1.4vw, 1.3rem);
  overflow: hidden;
  border-bottom: 1px solid var(--p-haircare-line);
  color: var(--p-haircare-ink);
  font-family: var(--body, 'Space Grotesk', sans-serif);
  text-decoration: none;
}

.th-p-haircare .p-haircare-ritual-lane::before {
  position: absolute;
  inset: auto 0 0;
  height: .45rem;
  background: var(--p-haircare-wine);
  content: '';
  transform: translateX(-101%);
  transition: transform .35s ease;
}

.th-p-haircare .p-haircare-ritual-lane:hover::before,
.th-p-haircare .p-haircare-ritual-lane:focus-visible::before {
  transform: translateX(0);
}

.th-p-haircare .p-haircare-lane-no {
  color: var(--p-haircare-wine);
  font-size: .61rem;
  font-weight: 700;
  letter-spacing: .15em;
}

.th-p-haircare .p-haircare-lane-title {
  min-width: 0;
  font-family: var(--display, 'Bodoni Moda', Georgia, serif);
  font-size: clamp(1.55rem, 2.35vw, 2.5rem);
  font-weight: 500;
  letter-spacing: -.045em;
  line-height: 1;
  overflow-wrap: anywhere;
}

.th-p-haircare .p-haircare-lane-count {
  color: var(--p-haircare-muted);
  font-size: .61rem;
  font-weight: 600;
  letter-spacing: .12em;
  line-height: 1.35;
  text-align: right;
  text-transform: uppercase;
}

.th-p-haircare .p-haircare-lane-arrow {
  color: var(--p-haircare-wine);
  font-family: var(--display, 'Bodoni Moda', Georgia, serif);
  font-size: 1.8rem;
  line-height: 1;
}

.th-p-haircare .p-haircare-discovery-pieces {
  align-items: start;
}

.th-p-haircare .p-haircare-pieces {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  background: var(--p-haircare-line);
}

.th-p-haircare .p-haircare-piece {
  display: grid;
  position: relative;
  min-width: 0;
  background: var(--p-haircare-paper);
  color: var(--p-haircare-ink);
  text-decoration: none;
}

.th-p-haircare .p-haircare-piece-no {
  position: absolute;
  z-index: 1;
  top: .75rem;
  left: .75rem;
  padding: .32rem .44rem;
  border: 1px solid rgba(36, 24, 29, .52);
  border-radius: 50%;
  background: rgba(251, 247, 239, .87);
  color: var(--p-haircare-wine);
  font-family: var(--body, 'Space Grotesk', sans-serif);
  font-size: .56rem;
  font-weight: 700;
  letter-spacing: .1em;
}

.th-p-haircare .p-haircare-piece-media {
  position: relative;
  display: grid;
  aspect-ratio: 1 / 1.02;
  place-items: center;
  overflow: hidden;
  background:
    linear-gradient(135deg, transparent 47%, rgba(107, 37, 62, .15) 47.3% 48.3%, transparent 48.6%),
    var(--p-haircare-blush);
}

.th-p-haircare .p-haircare-piece-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.th-p-haircare .p-haircare-piece-media i {
  display: block;
  width: 30%;
  height: 45%;
  border: 1px solid rgba(107, 37, 62, .54);
  border-radius: 45% 45% 15% 15%;
  background: rgba(251, 247, 239, .42);
  box-shadow: 1.6rem .75rem 0 -1.45rem rgba(107, 37, 62, .55);
}

.th-p-haircare .p-haircare-piece-copy {
  display: grid;
  min-height: 8.1rem;
  padding: 1rem .95rem 1.2rem;
  align-content: start;
  gap: .36rem;
}

.th-p-haircare .p-haircare-piece-copy b {
  font-family: var(--display, 'Bodoni Moda', Georgia, serif);
  font-size: clamp(1.2rem, 1.7vw, 1.7rem);
  font-weight: 500;
  letter-spacing: -.035em;
  line-height: 1;
  overflow-wrap: anywhere;
}

.th-p-haircare .p-haircare-piece-copy small,
.th-p-haircare .p-haircare-piece-copy em {
  color: var(--p-haircare-muted);
  font-family: var(--body, 'Space Grotesk', sans-serif);
  font-size: .64rem;
  font-style: normal;
  font-weight: 600;
  letter-spacing: .08em;
  line-height: 1.4;
  text-transform: uppercase;
}

.th-p-haircare .p-haircare-piece-copy em {
  margin-top: .35rem;
  color: var(--p-haircare-wine);
}

.th-p-haircare #shop {
  padding: clamp(4rem, 7vw, 7.3rem) clamp(1.25rem, 5vw, 5.2rem);
  background: var(--p-haircare-paper);
}

.th-p-haircare #shop > h2,
.th-p-haircare #shop .section-title {
  max-width: 11ch;
  color: var(--p-haircare-ink);
  font-family: var(--display, 'Bodoni Moda', Georgia, serif);
  font-size: calc(clamp(2.7rem, 4.8vw, 5rem) * var(--ts, 1));
  font-weight: 500;
  letter-spacing: -.065em;
  line-height: .88;
  overflow-wrap: anywhere;
}

.th-p-haircare .products,
.th-p-haircare .product-grid {
  gap: 1px;
  background: var(--p-haircare-line);
}

.th-p-haircare .product-card {
  border: 0;
  border-radius: 0;
  background: var(--p-haircare-paper);
}

.th-p-haircare .product-card a:focus-visible,
.th-p-haircare a:focus-visible {
  outline: 2px solid var(--p-haircare-wine);
  outline-offset: 3px;
}

@keyframes p-haircare-reflection-pan {
  from { transform: scale(1.01) translate3d(0, 0, 0); }
  to { transform: scale(1.065) translate3d(-.65%, -.35%, 0); }
}

@media (max-width: 760px) {
  .th-p-haircare .hd .wrap {
    min-height: 4.35rem;
  }

  .th-p-haircare .category-hero {
    min-height: 44.5rem;
    background: linear-gradient(157deg, #5b2736 0%, #7b3a4a 34%, #d7bba9 34.2%, #e4cdbd 100%);
  }

  .th-p-haircare .p-haircare-photo-frame {
    top: 0;
    right: 0;
    bottom: 35%;
    left: 10%;
    clip-path: polygon(0 0, 100% 0, 94% 100%, 0 100%);
  }

  .th-p-haircare .p-haircare-photo-frame .hero-media {
    object-position: 61% center;
  }

  .th-p-haircare .p-haircare-hero-ledger {
    top: 1.15rem;
    left: 1.2rem;
    width: 8.6rem;
    gap: .5rem;
    font-size: .5rem;
  }

  .th-p-haircare .p-haircare-comb-shadow {
    top: 6%;
    right: -2.7rem;
    width: 5.8rem;
    height: 45%;
  }

  .th-p-haircare .p-haircare-copy-stage {
    right: 1.2rem;
    bottom: 2.7rem;
    left: 1.2rem;
    max-width: none;
  }

  .th-p-haircare .p-haircare-copy {
    padding: 1.35rem 1.25rem 1.45rem;
    box-shadow: .55rem .55rem 0 rgba(67, 21, 37, .28);
  }

  .th-p-haircare .p-haircare-copy h1 {
    max-width: 12ch;
    font-size: calc(clamp(3.1rem, 13vw, 4.55rem) * var(--hero, 1));
  }

  .th-p-haircare .p-haircare-copy h1.long {
    max-width: 15ch;
    font-size: calc(clamp(2.45rem, 9.8vw, 3.45rem) * min(var(--hero, 1), 1.1));
  }

  .th-p-haircare .p-haircare-copy .sub {
    margin-top: .85rem;
    font-size: .76rem;
  }

  .th-p-haircare .p-haircare-copy .ctas {
    margin-top: 1.05rem;
  }

  .th-p-haircare .p-haircare-copy .btn {
    flex: 1 1 9rem;
  }

  .th-p-haircare .p-haircare-hero-stamp {
    display: none;
  }

  .th-p-haircare .p-haircare-hero .motion-toggle {
    top: auto;
    right: 1.2rem;
    bottom: calc(65% + .8rem);
    background: rgba(67, 21, 37, .72);
  }

  .th-p-haircare .p-haircare-discovery {
    display: block;
    padding: 3.8rem 1.2rem 4.2rem;
    background: var(--p-haircare-chalk);
  }

  .th-p-haircare .p-haircare-discovery-intro {
    max-width: 25rem;
  }

  .th-p-haircare .p-haircare-discovery-intro > p:last-child {
    margin-top: 1rem;
    font-size: .83rem;
  }

  .th-p-haircare .p-haircare-ritual-lanes,
  .th-p-haircare .p-haircare-pieces {
    margin-top: 2.5rem;
  }

  .th-p-haircare .p-haircare-ritual-lane {
    min-height: 4.75rem;
    grid-template-columns: 2.3rem minmax(0, 1fr) auto 1.45rem;
    gap: .45rem;
  }

  .th-p-haircare .p-haircare-lane-title {
    font-size: clamp(1.45rem, 7vw, 2rem);
  }

  .th-p-haircare .p-haircare-lane-count {
    max-width: 4.6rem;
    font-size: .53rem;
  }

  .th-p-haircare .p-haircare-pieces {
    grid-template-columns: 1fr;
    gap: 1px;
  }

  .th-p-haircare .p-haircare-piece {
    grid-template-columns: 8.3rem minmax(0, 1fr);
  }

  .th-p-haircare .p-haircare-piece-media {
    aspect-ratio: auto;
    min-height: 9rem;
  }

  .th-p-haircare .p-haircare-piece-copy {
    min-height: 0;
    padding: 1.1rem 1rem;
    align-content: center;
  }

  .th-p-haircare #shop {
    padding: 3.9rem 1.2rem;
  }
}

@media (max-width: 390px) {
  .th-p-haircare .category-hero {
    min-height: 43rem;
  }

  .th-p-haircare .p-haircare-photo-frame {
    bottom: 37%;
  }

  .th-p-haircare .p-haircare-copy h1 {
    font-size: calc(clamp(2.9rem, 12.8vw, 3.65rem) * var(--hero, 1));
  }

  .th-p-haircare .p-haircare-hero-ledger {
    display: none;
  }

  .th-p-haircare .p-haircare-hero .motion-toggle {
    bottom: calc(63% + .7rem);
  }

  .th-p-haircare .p-haircare-ritual-lane {
    grid-template-columns: 2rem minmax(0, 1fr) auto 1.2rem;
  }

  .th-p-haircare .p-haircare-lane-count {
    max-width: 3.9rem;
    font-size: .49rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .th-p-haircare .p-haircare-hero.has-hero-motion .p-haircare-photo-frame .hero-media {
    animation: none;
    transform: none;
  }
}
`;

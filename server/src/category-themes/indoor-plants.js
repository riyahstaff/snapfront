import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-indoor-plants',
  name: 'THE WINDOW GARDEN',
  for: 'indoor plants, planters, and living room-scale greenery',
  vibe: 'sun-warmed terracotta, leafy shadows, limewash walls, and a quiet conservatory pause',
  category: 'Indoor plants and planter collection',
  group: 'home',
  display: 'DM Serif Display',
  body: 'DM Sans',
  displayWeight: 400,
  tracking: '-.045em',
  colors: {
    bg: '#E9E3D4',
    surface: '#F8F5EC',
    ink: '#23392D',
    muted: '#687568',
    line: '#C9C8B4',
    accent: '#A94E2C',
    onAccent: '#FFF9EF',
    panel: '#315746',
    onPanel: '#F7F2E7',
    foot: '#20372C',
    onFoot: '#F4F0E5',
    bar: '#F7F3E9',
    onBar: '#23392D',
    badge: '#D8A56F',
    onBadge: '#23392D'
  },
  header: 'center',
  hero: 'editorial',
  card: 'pastel',
  ratio: '4/5',
  rCard: 20,
  rBtn: 999,
  motion: 'pan',
  copy: {
    eyebrow: 'A room for growing',
    collection: 'The window garden',
    cta: 'See what is growing',
    title: 'Bring the room to life.',
    subtitle: 'A green pause for shelves, corners, and every sunlit place in between.'
  }
});

export function hero(ctx) {
  const storeName = ctx.esc(ctx.store?.store_name || ctx.t.name);

  return `
    <section class="hero category-hero p-plant-hero${ctx.heroClass}"${ctx.heroAttrs}>
      <div class="p-plant-sunwash" aria-hidden="true"></div>
      <div class="p-plant-window-grid" aria-hidden="true"></div>
      <figure class="p-plant-atrium">
        ${ctx.media(0, { priority: true, lazy: false, decorative: true })}
        <figcaption>Keep a little green within reach.</figcaption>
      </figure>
      <div class="p-plant-floorline" aria-hidden="true"><span></span><span></span><span></span></div>
      <div class="p-plant-copy-nook">
        <p class="p-plant-store-mark"><span></span>${storeName}</p>
        ${ctx.copy('p-plant-copy')}
      </div>
      <p class="p-plant-window-note" aria-hidden="true">A living collection,<br>made for indoors.</p>
      <div class="p-plant-motion-control">${ctx.controls}</div>
    </section>
  `;
}

export function discovery(ctx) {
  const categories = (ctx.cats || []).filter((category) => category && category.name).slice(0, 5);
  const products = (ctx.products || []).slice(0, 3);

  if (categories.length >= 2) {
    const shelves = categories.map((category, index) => {
      const count = Number(category.count) || 0;
      const itemLabel = count === 1 ? 'item' : 'items';
      const number = String(index + 1).padStart(2, '0');

      return `
        <a class="p-plant-shelf" href="${ctx.esc(ctx.categoryLink(category.name))}">
          <span class="p-plant-shelf-no" aria-hidden="true">${number}</span>
          <span class="p-plant-shelf-arc" aria-hidden="true"><i></i></span>
          <span class="p-plant-shelf-copy">
            <b>${ctx.esc(category.name)}</b>
            <small>${ctx.esc(String(count))} ${itemLabel} in the collection</small>
          </span>
          <span class="p-plant-shelf-arrow" aria-hidden="true">↗</span>
        </a>
      `;
    }).join('');

    return `
      <section class="theme-discovery p-plant-discovery" aria-labelledby="p-plant-discovery-title">
        <div class="p-plant-discovery-intro">
          <p class="p-plant-kicker">The room index</p>
          <h2 id="p-plant-discovery-title">Find a place to begin.</h2>
          <p>Browse the current collection by the little green worlds taking shape in this store.</p>
        </div>
        <div class="p-plant-shelf-list">${shelves}</div>
      </section>
    `;
  }

  if (products.length) {
    return `
      <section class="theme-discovery p-plant-discovery p-plant-current-edit" aria-labelledby="p-plant-current-title">
        <div class="p-plant-discovery-intro">
          <p class="p-plant-kicker">The current edit</p>
          <h2 id="p-plant-current-title">A few things, ready to take root.</h2>
          <p>Explore the live collection and choose the piece that feels at home.</p>
        </div>
        <div class="p-plant-current-grid">${products.map((product) => ctx.productCard(product)).join('')}</div>
      </section>
    `;
  }

  return '';
}

export const css = `
.th-p-indoor-plants {
  --p-plant-paper: #f8f5ec;
  --p-plant-clay: #a94e2c;
  --p-plant-leaf: #23392d;
  --p-plant-moss: #315746;
  --p-plant-wash: #e9e3d4;
  --p-plant-stem: #687568;
  --p-plant-line: #c9c8b4;
  --p-plant-sun: #d8a56f;
  background: var(--p-plant-wash);
  color: var(--p-plant-leaf);
  overflow-x: clip;
}

.th-p-indoor-plants .hd {
  border-bottom: 1px solid color-mix(in srgb, var(--p-plant-leaf) 17%, transparent);
  background: color-mix(in srgb, var(--p-plant-paper) 91%, transparent);
}

.th-p-indoor-plants .hd .wrap {
  min-height: 4.75rem;
}

.th-p-indoor-plants .brand {
  color: var(--p-plant-leaf);
  font-family: var(--display, 'DM Serif Display', Georgia, serif);
  font-size: calc(1.45rem * var(--ts, 1));
  font-weight: 400;
  letter-spacing: .01em;
}

.th-p-indoor-plants .nav {
  gap: clamp(.75rem, 2.2vw, 2rem);
  color: var(--p-plant-leaf);
  font-family: var(--body, 'DM Sans', sans-serif);
  font-size: .64rem;
  font-weight: 700;
  letter-spacing: .13em;
  text-transform: uppercase;
}

.th-p-indoor-plants .cart {
  width: 2.65rem;
  height: 2.65rem;
  border-color: var(--p-plant-leaf);
  border-radius: 50%;
  color: var(--p-plant-leaf);
}

.th-p-indoor-plants .category-hero {
  position: relative;
  isolation: isolate;
  min-height: clamp(40rem, 54vw, 51.5rem);
  overflow: hidden;
  background:
    linear-gradient(90deg, transparent 0 49.8%, rgba(35, 57, 45, .08) 49.9% 50.1%, transparent 50.2%),
    var(--p-plant-wash);
}

.th-p-indoor-plants .p-plant-sunwash {
  position: absolute;
  top: clamp(-11rem, -10vw, -4rem);
  left: clamp(20%, 29vw, 38%);
  z-index: -3;
  width: clamp(22rem, 46vw, 48rem);
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle, #f8e2b9 0%, #f1d3a0 24%, rgba(241, 211, 160, .38) 47%, transparent 71%);
  opacity: .8;
}

.th-p-indoor-plants .p-plant-window-grid {
  position: absolute;
  z-index: -1;
  top: 0;
  right: clamp(2rem, 8vw, 10rem);
  width: min(51vw, 49rem);
  height: 49%;
  border-right: 1px solid rgba(35, 57, 45, .16);
  border-bottom: 1px solid rgba(35, 57, 45, .16);
  border-left: 1px solid rgba(35, 57, 45, .16);
  background:
    linear-gradient(90deg, transparent 33.2%, rgba(35, 57, 45, .15) 33.35% 33.65%, transparent 33.8% 66.2%, rgba(35, 57, 45, .15) 66.35% 66.65%, transparent 66.8%),
    linear-gradient(180deg, transparent 49.5%, rgba(35, 57, 45, .15) 49.7% 50.1%, transparent 50.3%);
}

.th-p-indoor-plants .p-plant-atrium {
  position: absolute;
  top: clamp(1.4rem, 4vw, 4.3rem);
  right: clamp(1rem, 6.7vw, 7.8rem);
  bottom: clamp(1.4rem, 4vw, 4rem);
  width: min(54vw, 50rem);
  margin: 0;
  overflow: hidden;
  border: 1px solid rgba(35, 57, 45, .45);
  border-radius: 50% 50% 2rem 2rem / 28% 28% 2rem 2rem;
  background: #d9d2be;
  box-shadow: 1.1rem 1.3rem 0 rgba(49, 87, 70, .12);
}

.th-p-indoor-plants .p-plant-atrium::before,
.th-p-indoor-plants .p-plant-atrium::after {
  position: absolute;
  z-index: 2;
  content: '';
  pointer-events: none;
}

.th-p-indoor-plants .p-plant-atrium::before {
  inset: 0;
  border: clamp(.35rem, .85vw, .75rem) solid rgba(248, 245, 236, .45);
  border-radius: inherit;
  background: linear-gradient(120deg, rgba(255, 252, 243, .3), transparent 30%, transparent 72%, rgba(35, 57, 45, .12));
}

.th-p-indoor-plants .p-plant-atrium::after {
  top: 0;
  bottom: 0;
  left: 32.5%;
  width: 1px;
  background: rgba(248, 245, 236, .45);
  box-shadow: 33.6vw 0 0 rgba(248, 245, 236, .42);
}

.th-p-indoor-plants .p-plant-atrium .hero-media,
.th-p-indoor-plants .p-plant-atrium .theme-empty-media {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 100%;
  object-fit: cover;
  object-position: 64% center;
}

.th-p-indoor-plants .p-plant-atrium .theme-empty-media {
  background:
    radial-gradient(ellipse 14% 24% at 73% 64%, #557b4b 0 27%, transparent 28%),
    radial-gradient(ellipse 10% 30% at 65% 43%, #315746 0 25%, transparent 26%),
    linear-gradient(116deg, #efe4ca 0 42%, #9e5939 42.2% 53%, #456a52 53.2% 64%, #e9e2d0 64.2%);
}

.th-p-indoor-plants .p-plant-atrium figcaption {
  position: absolute;
  z-index: 3;
  right: 1.25rem;
  bottom: 1.15rem;
  max-width: 14ch;
  margin: 0;
  color: #fff9ed;
  font-family: var(--body, 'DM Sans', sans-serif);
  font-size: .57rem;
  font-weight: 700;
  letter-spacing: .15em;
  line-height: 1.45;
  text-align: right;
  text-shadow: 0 1px 10px rgba(24, 45, 34, .6);
  text-transform: uppercase;
}

.th-p-indoor-plants .p-plant-floorline {
  position: absolute;
  z-index: -1;
  right: 0;
  bottom: clamp(2.15rem, 4vw, 4rem);
  left: 0;
  display: grid;
  grid-template-columns: .9fr 1.2fr .72fr;
  height: clamp(5rem, 11vw, 9rem);
  gap: 1px;
  border-top: 1px solid rgba(35, 57, 45, .17);
}

.th-p-indoor-plants .p-plant-floorline span {
  border-right: 1px solid rgba(35, 57, 45, .1);
  background: linear-gradient(147deg, rgba(255, 250, 239, .37), rgba(169, 78, 44, .08));
}

.th-p-indoor-plants .p-plant-copy-nook {
  position: absolute;
  z-index: 3;
  bottom: clamp(4.5rem, 10.5vw, 9rem);
  left: clamp(1.2rem, 8.8vw, 9.4rem);
  width: min(39vw, 32rem);
  min-width: min(26rem, 42vw);
}

.th-p-indoor-plants .p-plant-store-mark {
  display: flex;
  align-items: center;
  gap: .6rem;
  margin: 0 0 1.15rem;
  color: var(--p-plant-moss);
  font-family: var(--body, 'DM Sans', sans-serif);
  font-size: .59rem;
  font-weight: 700;
  letter-spacing: .16em;
  line-height: 1.3;
  text-transform: uppercase;
}

.th-p-indoor-plants .p-plant-store-mark span {
  width: 1.8rem;
  height: 1px;
  background: currentColor;
}

.th-p-indoor-plants .p-plant-copy {
  padding: clamp(1.5rem, 3.3vw, 3rem) clamp(1.45rem, 3.3vw, 3.1rem) clamp(1.6rem, 3.1vw, 2.8rem);
  border: 1px solid rgba(35, 57, 45, .25);
  border-radius: 1rem 1rem 3.8rem 1rem;
  background: rgba(248, 245, 236, .93);
  box-shadow: -.75rem .8rem 0 rgba(216, 165, 111, .42);
}

.th-p-indoor-plants .p-plant-copy .eyebrow,
.th-p-indoor-plants .p-plant-kicker {
  margin: 0 0 .85rem;
  color: var(--p-plant-clay);
  font-family: var(--body, 'DM Sans', sans-serif);
  font-size: .61rem;
  font-weight: 700;
  letter-spacing: .18em;
  line-height: 1.4;
  text-transform: uppercase;
}

.th-p-indoor-plants .p-plant-copy h1 {
  max-width: 10ch;
  margin: 0;
  color: var(--p-plant-leaf);
  font-family: var(--display, 'DM Serif Display', Georgia, serif);
  font-size: calc(clamp(3.4rem, 6.15vw, 6.95rem) * var(--hero, 1));
  font-weight: 400;
  letter-spacing: -.065em;
  line-height: .85;
  overflow-wrap: anywhere;
  text-wrap: balance;
}

.th-p-indoor-plants .p-plant-copy h1.long {
  max-width: 13ch;
  font-size: calc(clamp(2.5rem, 4.7vw, 5rem) * min(var(--hero, 1), 1.1));
  line-height: .91;
}

.th-p-indoor-plants .p-plant-copy .sub {
  max-width: 35rem;
  margin: 1.2rem 0 0;
  color: var(--p-plant-stem);
  font-family: var(--body, 'DM Sans', sans-serif);
  font-size: clamp(.77rem, .94vw, .94rem);
  font-weight: 500;
  letter-spacing: .01em;
  line-height: 1.62;
  overflow-wrap: anywhere;
}

.th-p-indoor-plants .p-plant-copy .ctas {
  display: flex;
  flex-wrap: wrap;
  gap: .55rem;
  margin-top: 1.45rem;
}

.th-p-indoor-plants .p-plant-copy .btn {
  display: inline-flex;
  min-height: 2.8rem;
  align-items: center;
  justify-content: center;
  padding: .7rem 1.1rem;
  border: 1px solid var(--p-plant-moss);
  border-radius: 999px;
  background: var(--p-plant-moss);
  color: #fff9ef;
  font-family: var(--body, 'DM Sans', sans-serif);
  font-size: .61rem;
  font-weight: 700;
  letter-spacing: .13em;
  line-height: 1.2;
  text-align: center;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-indoor-plants .p-plant-copy .btn.ghost {
  background: transparent;
  color: var(--p-plant-moss);
}

.th-p-indoor-plants .p-plant-copy .btn:hover,
.th-p-indoor-plants .p-plant-copy .btn:focus-visible {
  border-color: var(--p-plant-clay);
  background: var(--p-plant-clay);
  color: #fff9ef;
  outline: none;
}

.th-p-indoor-plants .p-plant-window-note {
  position: absolute;
  z-index: 2;
  top: clamp(2rem, 7.5vw, 7.4rem);
  left: clamp(1.25rem, 6.2vw, 6rem);
  margin: 0;
  color: color-mix(in srgb, var(--p-plant-moss) 76%, transparent);
  font-family: var(--display, 'DM Serif Display', Georgia, serif);
  font-size: clamp(.98rem, 1.6vw, 1.45rem);
  font-style: italic;
  letter-spacing: -.025em;
  line-height: 1.05;
}

.th-p-indoor-plants .p-plant-motion-control {
  position: absolute;
  z-index: 5;
  right: clamp(1.45rem, 7.3vw, 7.9rem);
  bottom: clamp(1.9rem, 5.5vw, 4.8rem);
}

.th-p-indoor-plants .p-plant-motion-control:empty {
  display: none;
}

.th-p-indoor-plants .p-plant-motion-control .motion-toggle {
  min-width: 2.75rem;
  min-height: 2.75rem;
  border: 1px solid rgba(248, 245, 236, .78);
  border-radius: 50%;
  background: rgba(35, 57, 45, .68);
  color: #fff9ef;
  font-family: var(--body, 'DM Sans', sans-serif);
  font-size: .56rem;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.th-p-indoor-plants .p-plant-hero.has-hero-motion .p-plant-atrium .hero-media {
  animation: p-indoor-plants-leaf-pan 20s ease-in-out infinite alternate;
}

.th-p-indoor-plants .p-plant-discovery {
  display: grid;
  grid-template-columns: minmax(14rem, .8fr) minmax(0, 1.55fr);
  gap: clamp(2rem, 8vw, 9rem);
  padding: clamp(4rem, 8vw, 7.8rem) clamp(1.25rem, 7vw, 7.5rem) clamp(4.2rem, 8vw, 7.7rem);
  background:
    radial-gradient(ellipse 18% 40% at 11% 15%, rgba(216, 165, 111, .2), transparent 73%),
    var(--p-plant-paper);
}

.th-p-indoor-plants .p-plant-discovery-intro {
  align-self: start;
  max-width: 24rem;
}

.th-p-indoor-plants .p-plant-discovery-intro h2 {
  max-width: 8ch;
  margin: 0;
  color: var(--p-plant-leaf);
  font-family: var(--display, 'DM Serif Display', Georgia, serif);
  font-size: calc(clamp(2.8rem, 4.5vw, 5.05rem) * var(--ts, 1));
  font-weight: 400;
  letter-spacing: -.065em;
  line-height: .88;
  overflow-wrap: anywhere;
  text-wrap: balance;
}

.th-p-indoor-plants .p-plant-discovery-intro > p:last-child {
  max-width: 28rem;
  margin: 1.3rem 0 0;
  color: var(--p-plant-stem);
  font-family: var(--body, 'DM Sans', sans-serif);
  font-size: .86rem;
  font-weight: 500;
  line-height: 1.68;
}

.th-p-indoor-plants .p-plant-shelf-list {
  display: grid;
  align-self: center;
  border-top: 1px solid var(--p-plant-leaf);
}

.th-p-indoor-plants .p-plant-shelf {
  position: relative;
  display: grid;
  min-height: clamp(5.7rem, 7vw, 7rem);
  grid-template-columns: 2.25rem clamp(3.8rem, 8vw, 7rem) minmax(0, 1fr) 2rem;
  align-items: center;
  gap: clamp(.6rem, 1.6vw, 1.45rem);
  overflow: hidden;
  border-bottom: 1px solid var(--p-plant-line);
  color: var(--p-plant-leaf);
  text-decoration: none;
}

.th-p-indoor-plants .p-plant-shelf::before {
  position: absolute;
  inset: auto 0 0;
  height: .35rem;
  background: var(--p-plant-clay);
  content: '';
  transform: translateX(-101%);
  transition: transform 220ms ease;
}

.th-p-indoor-plants .p-plant-shelf:hover::before,
.th-p-indoor-plants .p-plant-shelf:focus-visible::before {
  transform: translateX(0);
}

.th-p-indoor-plants .p-plant-shelf-no {
  color: var(--p-plant-clay);
  font-family: var(--body, 'DM Sans', sans-serif);
  font-size: .6rem;
  font-weight: 700;
  letter-spacing: .14em;
}

.th-p-indoor-plants .p-plant-shelf-arc {
  position: relative;
  display: block;
  width: clamp(3.7rem, 7vw, 5.9rem);
  aspect-ratio: 1;
  overflow: hidden;
  border: 1px solid rgba(49, 87, 70, .45);
  border-radius: 50% 50% 0 0;
  background: linear-gradient(145deg, #e8c994, #e9e4d7 52%, #8bad75 53%, #355d48);
}

.th-p-indoor-plants .p-plant-shelf-arc::before,
.th-p-indoor-plants .p-plant-shelf-arc::after,
.th-p-indoor-plants .p-plant-shelf-arc i {
  position: absolute;
  display: block;
  content: '';
}

.th-p-indoor-plants .p-plant-shelf-arc::before {
  right: 19%;
  bottom: 0;
  width: 21%;
  height: 72%;
  border-radius: 50% 50% 0 0;
  background: #315746;
  transform: rotate(19deg);
  transform-origin: bottom;
}

.th-p-indoor-plants .p-plant-shelf-arc::after {
  right: 37%;
  bottom: 0;
  width: 15%;
  height: 55%;
  border-radius: 50% 50% 0 0;
  background: #557b4b;
  transform: rotate(-22deg);
  transform-origin: bottom;
}

.th-p-indoor-plants .p-plant-shelf-arc i {
  bottom: -9%;
  left: 50%;
  width: 65%;
  height: 32%;
  border: 1px solid rgba(248, 245, 236, .55);
  border-radius: 50%;
  transform: translateX(-50%);
}

.th-p-indoor-plants .p-plant-shelf:nth-child(3n + 2) .p-plant-shelf-arc {
  background: linear-gradient(145deg, #eadfc5, #d5a16e 52%, #48705a 53%, #203e32);
}

.th-p-indoor-plants .p-plant-shelf:nth-child(3n) .p-plant-shelf-arc {
  background: linear-gradient(145deg, #f0ddae, #cedbbb 52%, #769066 53%, #41694f);
}

.th-p-indoor-plants .p-plant-shelf-copy {
  display: grid;
  min-width: 0;
  gap: .35rem;
}

.th-p-indoor-plants .p-plant-shelf-copy b {
  color: var(--p-plant-leaf);
  font-family: var(--display, 'DM Serif Display', Georgia, serif);
  font-size: clamp(1.5rem, 2.35vw, 2.5rem);
  font-weight: 400;
  letter-spacing: -.045em;
  line-height: .96;
  overflow-wrap: anywhere;
}

.th-p-indoor-plants .p-plant-shelf-copy small {
  color: var(--p-plant-stem);
  font-family: var(--body, 'DM Sans', sans-serif);
  font-size: .59rem;
  font-weight: 700;
  letter-spacing: .1em;
  line-height: 1.35;
  text-transform: uppercase;
}

.th-p-indoor-plants .p-plant-shelf-arrow {
  color: var(--p-plant-clay);
  font-family: var(--display, 'DM Serif Display', Georgia, serif);
  font-size: 1.8rem;
  line-height: 1;
  transition: transform 220ms ease;
}

.th-p-indoor-plants .p-plant-shelf:hover .p-plant-shelf-arrow,
.th-p-indoor-plants .p-plant-shelf:focus-visible .p-plant-shelf-arrow {
  transform: translate(.22rem, -.18rem);
}

.th-p-indoor-plants .p-plant-current-edit {
  align-items: start;
}

.th-p-indoor-plants .p-plant-current-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  min-width: 0;
}

.th-p-indoor-plants .p-plant-current-grid .product-card {
  overflow: hidden;
  border-color: var(--p-plant-line);
  border-radius: 1.3rem 1.3rem 3.2rem 1.3rem;
  background: #fffdf6;
}

.th-p-indoor-plants .p-plant-current-grid .product-card img {
  border-radius: 0;
}

.th-p-indoor-plants #shop {
  padding: clamp(4rem, 7vw, 7.4rem) clamp(1.25rem, 7vw, 7.5rem);
  background: var(--p-plant-wash);
}

.th-p-indoor-plants #shop > h2,
.th-p-indoor-plants #shop .section-title {
  max-width: 10ch;
  color: var(--p-plant-leaf);
  font-family: var(--display, 'DM Serif Display', Georgia, serif);
  font-size: calc(clamp(2.8rem, 4.8vw, 5.2rem) * var(--ts, 1));
  font-weight: 400;
  letter-spacing: -.065em;
  line-height: .88;
  overflow-wrap: anywhere;
}

.th-p-indoor-plants .products,
.th-p-indoor-plants .product-grid {
  gap: clamp(.8rem, 1.5vw, 1.35rem);
}

.th-p-indoor-plants .product-card {
  overflow: hidden;
  border-color: var(--p-plant-line);
  border-radius: 1.2rem 1.2rem 3rem 1.2rem;
  background: var(--p-plant-paper);
}

.th-p-indoor-plants .product-card img {
  border-radius: 0;
}

.th-p-indoor-plants .product-card a:focus-visible,
.th-p-indoor-plants a:focus-visible {
  outline: 2px solid var(--p-plant-clay);
  outline-offset: 3px;
}

@keyframes p-indoor-plants-leaf-pan {
  from { transform: scale(1.01) translate3d(0, 0, 0); }
  to { transform: scale(1.065) translate3d(-.7%, -.35%, 0); }
}

@media (max-width: 900px) {
  .th-p-indoor-plants .p-plant-copy-nook {
    left: clamp(1.2rem, 5vw, 3.25rem);
    width: min(45vw, 28rem);
    min-width: 0;
  }

  .th-p-indoor-plants .p-plant-window-note {
    left: 3rem;
  }

  .th-p-indoor-plants .p-plant-atrium {
    right: 2.3rem;
    width: 55vw;
  }

  .th-p-indoor-plants .p-plant-atrium::after {
    box-shadow: 35vw 0 0 rgba(248, 245, 236, .42);
  }
}

@media (max-width: 760px) {
  .th-p-indoor-plants .hd .wrap {
    min-height: 4.3rem;
  }

  .th-p-indoor-plants .category-hero {
    display: flex;
    min-height: 0;
    flex-direction: column;
    padding-top: 1.15rem;
  }

  .th-p-indoor-plants .p-plant-sunwash {
    top: -7.5rem;
    left: 12%;
    width: 26rem;
  }

  .th-p-indoor-plants .p-plant-window-grid {
    top: 0;
    right: 6%;
    width: 69%;
    height: 18rem;
  }

  .th-p-indoor-plants .p-plant-atrium {
    position: relative;
    top: auto;
    right: auto;
    bottom: auto;
    order: 1;
    width: calc(100% - 2.4rem);
    height: clamp(17rem, 67vw, 24rem);
    margin: 0 1.2rem;
    border-radius: 50% 50% 1.5rem 1.5rem / 23% 23% 1.5rem 1.5rem;
  }

  .th-p-indoor-plants .p-plant-atrium .hero-media,
  .th-p-indoor-plants .p-plant-atrium .theme-empty-media {
    object-position: 65% center;
  }

  .th-p-indoor-plants .p-plant-atrium::after {
    left: 32.5%;
    box-shadow: 60vw 0 0 rgba(248, 245, 236, .42);
  }

  .th-p-indoor-plants .p-plant-atrium figcaption {
    right: 1rem;
    bottom: .9rem;
    font-size: .51rem;
  }

  .th-p-indoor-plants .p-plant-floorline {
    position: relative;
    right: auto;
    bottom: auto;
    order: 2;
    height: 3.6rem;
    margin-top: -2.1rem;
  }

  .th-p-indoor-plants .p-plant-copy-nook {
    position: relative;
    bottom: auto;
    left: auto;
    order: 3;
    width: auto;
    min-width: 0;
    margin: -1.15rem 1.2rem 2.6rem;
  }

  .th-p-indoor-plants .p-plant-store-mark {
    margin: 0 0 .85rem .25rem;
    font-size: .54rem;
  }

  .th-p-indoor-plants .p-plant-copy {
    padding: 1.45rem 1.25rem 1.55rem;
    border-radius: .85rem .85rem 2.85rem .85rem;
    box-shadow: -.48rem .55rem 0 rgba(216, 165, 111, .38);
  }

  .th-p-indoor-plants .p-plant-copy h1 {
    max-width: 11ch;
    font-size: calc(clamp(3.1rem, 13.1vw, 4.6rem) * var(--hero, 1));
  }

  .th-p-indoor-plants .p-plant-copy h1.long {
    max-width: 15ch;
    font-size: calc(clamp(2.35rem, 10.3vw, 3.55rem) * min(var(--hero, 1), 1.1));
  }

  .th-p-indoor-plants .p-plant-copy .sub {
    margin-top: .85rem;
    font-size: .76rem;
  }

  .th-p-indoor-plants .p-plant-copy .ctas {
    margin-top: 1.05rem;
  }

  .th-p-indoor-plants .p-plant-copy .btn {
    flex: 1 1 10rem;
  }

  .th-p-indoor-plants .p-plant-window-note {
    top: 1.4rem;
    left: 1.8rem;
    font-size: .93rem;
  }

  .th-p-indoor-plants .p-plant-motion-control {
    top: auto;
    right: 1.85rem;
    bottom: auto;
    z-index: 6;
    transform: translateY(2.15rem);
  }

  .th-p-indoor-plants .p-plant-discovery {
    display: block;
    padding: 3.9rem 1.2rem 4.2rem;
  }

  .th-p-indoor-plants .p-plant-discovery-intro {
    max-width: 26rem;
  }

  .th-p-indoor-plants .p-plant-discovery-intro h2 {
    max-width: 9ch;
    font-size: clamp(2.7rem, 11.7vw, 4.2rem);
  }

  .th-p-indoor-plants .p-plant-discovery-intro > p:last-child {
    margin-top: 1rem;
    font-size: .82rem;
  }

  .th-p-indoor-plants .p-plant-shelf-list,
  .th-p-indoor-plants .p-plant-current-grid {
    margin-top: 2.55rem;
  }

  .th-p-indoor-plants .p-plant-shelf {
    min-height: 5.65rem;
    grid-template-columns: 1.75rem 4rem minmax(0, 1fr) 1.4rem;
    gap: .55rem;
  }

  .th-p-indoor-plants .p-plant-shelf-arc {
    width: 3.8rem;
  }

  .th-p-indoor-plants .p-plant-shelf-copy b {
    font-size: clamp(1.45rem, 7vw, 2rem);
  }

  .th-p-indoor-plants .p-plant-shelf-copy small {
    font-size: .52rem;
    letter-spacing: .075em;
  }

  .th-p-indoor-plants .p-plant-current-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .th-p-indoor-plants #shop {
    padding: 3.9rem 1.2rem;
  }
}

@media (max-width: 390px) {
  .th-p-indoor-plants .p-plant-atrium {
    width: calc(100% - 2rem);
    height: 16.75rem;
    margin-inline: 1rem;
  }

  .th-p-indoor-plants .p-plant-copy-nook {
    margin-right: 1rem;
    margin-left: 1rem;
  }

  .th-p-indoor-plants .p-plant-copy h1 {
    font-size: calc(clamp(2.85rem, 12.7vw, 3.7rem) * var(--hero, 1));
  }

  .th-p-indoor-plants .p-plant-store-mark {
    font-size: .5rem;
  }

  .th-p-indoor-plants .p-plant-motion-control {
    right: 1.55rem;
  }

  .th-p-indoor-plants .p-plant-shelf {
    grid-template-columns: 1.35rem 3.45rem minmax(0, 1fr) 1.1rem;
    gap: .38rem;
  }

  .th-p-indoor-plants .p-plant-shelf-arc {
    width: 3.25rem;
  }

  .th-p-indoor-plants .p-plant-shelf-copy b {
    font-size: 1.38rem;
  }

  .th-p-indoor-plants .p-plant-shelf-copy small {
    font-size: .48rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .th-p-indoor-plants .p-plant-hero.has-hero-motion .p-plant-atrium .hero-media {
    animation: none;
    transform: none;
  }

  .th-p-indoor-plants .p-plant-shelf::before,
  .th-p-indoor-plants .p-plant-shelf-arrow {
    transition: none;
  }
}
`;

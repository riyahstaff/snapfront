import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-activewear',
  name: 'PARALLEL / FORM',
  for: 'Motion-minded training wardrobes',
  vibe: 'Sunlit studio discipline, elastic geometry, and a calm athletic pulse.',
  category: 'Technical activewear and training apparel',
  group: 'fashion',
  display: 'Space Grotesk',
  body: 'Manrope',
  displayWeight: 700,
  tracking: '-.055em',
  colors: {
    bg: '#F7E9DE',
    surface: '#FFF9F3',
    ink: '#15263A',
    muted: '#79675F',
    line: '#D9B9A7',
    accent: '#EF654E',
    onAccent: '#FFFFFF',
    panel: '#15263A',
    onPanel: '#FFF4EA',
    foot: '#102033',
    onFoot: '#FFF4EA',
    bar: '#FCEDE1',
    onBar: '#15263A',
    badge: '#91D2D7',
    onBadge: '#15263A',
  },
  header: 'stack',
  hero: 'collage',
  card: 'minimal',
  ratio: '4/5',
  rCard: 20,
  rBtn: 999,
  motion: 'pan',
  copy: {
    eyebrow: 'Movement wardrobe',
    collection: 'The live rotation',
    cta: 'Shop the rotation',
    title: 'Find your steady vector.',
    subtitle: 'Pieces for a practice that moves with you.',
  },
  collection: 'premium',
  family: 'activewear',
  demoPhoto: '/assets/themes/activewear-hero.webp',
});

const itemLabel = (count) => `${count} ${count === 1 ? 'item' : 'items'}`;

export function hero(ctx) {
  return `
    <section class="hero category-hero activewear-hero${ctx.heroClass}"${ctx.heroAttrs}>
      <div class="activewear-hero__media">
        ${ctx.media(0, { priority: true, lazy: false, decorative: false })}
      </div>
      <div class="activewear-hero__tone" aria-hidden="true"></div>
      <div class="activewear-hero__trace" aria-hidden="true"><span></span><span></span><span></span></div>
      <p class="activewear-hero__signal" aria-hidden="true">PRACTICE / IN MOTION</p>
      <p class="activewear-hero__field-word" aria-hidden="true">PULSE</p>
      <div class="activewear-hero__copy-wrap">
        ${ctx.copy('activewear-hero__copy')}
      </div>
      <div class="activewear-hero__cadence" aria-hidden="true">
        <span>01</span><i></i><span>02</span><i></i><span>03</span>
      </div>
      ${ctx.controls}
    </section>
  `;
}

export function discovery(ctx) {
  const categories = (Array.isArray(ctx.cats) ? ctx.cats : [])
    .filter((category) => category && category.name)
    .slice(0, 3);
  const products = Array.isArray(ctx.products) ? ctx.products : [];
  const safe = (value) => ctx.esc(String(value ?? ''));

  if (categories.length >= 2) {
    const routes = categories.map((category, index) => {
      const count = Number.isFinite(Number(category.count)) ? Number(category.count) : 0;
      const image = typeof category.image === 'string' && category.image.trim()
        ? `<img class="activewear-route__image" src="${safe(category.image)}" alt="" loading="lazy" decoding="async">`
        : '<span class="activewear-route__blank" aria-hidden="true"></span>';
      const number = String(index + 1).padStart(2, '0');

      return `
        <a class="activewear-route" href="${ctx.categoryLink(category.name)}">
          <span class="activewear-route__media">${image}</span>
          <span class="activewear-route__meta"><b>${number}</b><small>${safe(itemLabel(count))}</small></span>
          <span class="activewear-route__name">${safe(category.name)}</span>
          <span class="activewear-route__arrow" aria-hidden="true">↗</span>
        </a>
      `;
    }).join('');

    return `
      <section class="activewear-discovery" aria-labelledby="activewear-discovery-title">
        <div class="activewear-discovery__lead">
          <p class="activewear-discovery__eyebrow">Choose a movement lane</p>
          <h2 id="activewear-discovery-title">Build a rotation with room to move.</h2>
          <p>Explore the categories currently available in this store.</p>
        </div>
        <div class="activewear-routes">${routes}</div>
      </section>
    `;
  }

  if (!products.length) return '';

  const cards = products.slice(0, 3).map((product) => ctx.productCard(product)).join('');
  return `
    <section class="activewear-discovery activewear-discovery--products" aria-labelledby="activewear-discovery-title">
      <div class="activewear-discovery__lead">
        <p class="activewear-discovery__eyebrow">Current rotation</p>
        <h2 id="activewear-discovery-title">Start with what is in motion now.</h2>
        <p>A focused edit from the live products currently available in this store.</p>
      </div>
      <div class="activewear-live-products">${cards}</div>
    </section>
  `;
}

export const css = `
.th-p-activewear {
  --activewear-ink: #15263A;
  --activewear-paper: #FFF9F3;
  --activewear-peach: #F7E9DE;
  --activewear-coral: #EF654E;
  --activewear-aqua: #91D2D7;
  --activewear-line: #D9B9A7;
  --activewear-muted: #79675F;
  background: var(--activewear-peach);
  color: var(--activewear-ink);
  overflow-x: clip;
}

.th-p-activewear .ann {
  border: 0;
  background: var(--activewear-ink);
  color: var(--activewear-paper);
  font: 700 .62rem/1.3 var(--body);
  letter-spacing: .14em;
  text-transform: uppercase;
}

.th-p-activewear .hd {
  border: 0;
  background: rgba(252, 237, 225, .96);
  color: var(--activewear-ink);
}

.th-p-activewear .hd .wrap {
  min-height: 4.25rem;
}

.th-p-activewear .hd .brand {
  font-family: var(--display);
  font-size: clamp(1rem, 1.8vw, 1.45rem);
  font-weight: 700;
  letter-spacing: -.055em;
}

.th-p-activewear .hd .nav a,
.th-p-activewear .hd .cart {
  font: 700 .66rem/1.2 var(--body);
  letter-spacing: .1em;
  text-transform: uppercase;
}

.th-p-activewear .hd .nav a:hover,
.th-p-activewear .hd .cart:hover {
  color: var(--activewear-coral);
}

.th-p-activewear .activewear-hero {
  position: relative;
  isolation: isolate;
  display: grid;
  grid-template-columns: minmax(1rem, 1fr) minmax(0, 82rem) minmax(1rem, 1fr);
  min-height: clamp(38rem, 53vw, 48rem);
  overflow: hidden;
  background: var(--activewear-peach);
}

.th-p-activewear .activewear-hero__media {
  position: absolute;
  inset: 0;
  z-index: -3;
  overflow: hidden;
  background:
    linear-gradient(135deg, #F8D9C7 0 31%, #F3AB91 31.2% 31.7%, #F7E9DE 32% 59%, #91D2D7 59.2% 60%, #F5C7B2 60.4% 100%);
}

.th-p-activewear .activewear-hero__media .hero-media,
.th-p-activewear .activewear-hero__media .theme-empty-media {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 100%;
  object-fit: cover;
  object-position: center;
}

.th-p-activewear .activewear-hero__media .theme-empty-media {
  color: var(--activewear-ink);
  background:
    radial-gradient(circle at 77% 68%, rgba(145, 210, 215, .72) 0 6%, transparent 6.4%),
    repeating-radial-gradient(ellipse at 72% 62%, transparent 0 3.9rem, rgba(239, 101, 78, .62) 4rem 4.16rem, transparent 4.25rem 7.4rem),
    linear-gradient(115deg, #F7E9DE, #F8D9C7);
}

.th-p-activewear .activewear-hero__tone {
  position: absolute;
  inset: 0;
  z-index: -2;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(21, 38, 58, .02) 0%, rgba(21, 38, 58, .02) 40%, rgba(21, 38, 58, .3) 100%),
    linear-gradient(90deg, rgba(255, 249, 243, .98) 0%, rgba(255, 249, 243, .74) 22%, rgba(255, 249, 243, .13) 58%, rgba(21, 38, 58, .08) 100%);
}

.th-p-activewear .activewear-hero__trace {
  position: absolute;
  z-index: -1;
  top: 0;
  right: max(1.5rem, calc((100vw - 82rem) / 2));
  bottom: 0;
  width: min(18vw, 15rem);
  display: flex;
  justify-content: space-between;
  pointer-events: none;
}

.th-p-activewear .activewear-hero__trace span {
  width: 1px;
  height: 100%;
  background: rgba(255, 249, 243, .45);
  transform: skewX(-17deg);
  transform-origin: top;
}

.th-p-activewear .activewear-hero__signal {
  position: absolute;
  z-index: 1;
  top: clamp(1.3rem, 3vw, 2.75rem);
  left: max(1.35rem, calc((100vw - 82rem) / 2));
  margin: 0;
  color: var(--activewear-ink);
  font: 800 clamp(.58rem, .72vw, .72rem)/1.2 var(--body);
  letter-spacing: .16em;
  text-transform: uppercase;
}

.th-p-activewear .activewear-hero__signal::before {
  display: inline-block;
  width: 2.5rem;
  height: .45rem;
  margin-right: .65rem;
  content: '';
  background: var(--activewear-coral);
  clip-path: polygon(0 0, 100% 0, 82% 100%, 0 100%);
}

.th-p-activewear .activewear-hero__field-word {
  position: absolute;
  z-index: -1;
  top: 8%;
  left: 50%;
  margin: 0;
  color: rgba(255, 249, 243, .54);
  font-family: var(--display);
  font-size: clamp(7rem, 19vw, 21rem);
  font-weight: 700;
  letter-spacing: -.11em;
  line-height: .72;
  pointer-events: none;
  transform: translateX(-47%) rotate(-7deg);
  white-space: nowrap;
}

.th-p-activewear .activewear-hero__copy-wrap {
  z-index: 1;
  grid-column: 2;
  align-self: end;
  width: min(100%, 47rem);
  margin: 0 0 clamp(4.7rem, 8vw, 7.8rem) clamp(0rem, 4vw, 4.6rem);
}

.th-p-activewear .activewear-hero__copy {
  max-width: 100%;
  padding: clamp(1.35rem, 2.25vw, 2.4rem) clamp(1.25rem, 2.8vw, 3rem) clamp(1.45rem, 2.7vw, 2.85rem);
  border-top: 1px solid rgba(21, 38, 58, .46);
  border-left: 1px solid rgba(21, 38, 58, .46);
  background: rgba(255, 249, 243, .76);
  box-shadow: 1.1rem 1.1rem 0 rgba(239, 101, 78, .92);
  backdrop-filter: blur(9px);
}

.th-p-activewear .activewear-hero__copy .eyebrow,
.th-p-activewear .activewear-discovery__eyebrow {
  margin: 0 0 .9rem;
  color: var(--activewear-coral);
  font: 800 clamp(.62rem, .8vw, .72rem)/1.25 var(--body);
  letter-spacing: .15em;
  text-transform: uppercase;
}

.th-p-activewear .activewear-hero__copy h1 {
  max-width: 11ch;
  margin: 0;
  color: var(--activewear-ink);
  font-family: var(--display);
  font-size: clamp(3.25rem, 6.4vw, 6.9rem);
  font-weight: 700;
  letter-spacing: -.075em;
  line-height: .83;
  overflow-wrap: anywhere;
  text-wrap: balance;
}

.th-p-activewear .activewear-hero__copy h1.long {
  max-width: 18ch;
  font-size: clamp(2.7rem, 5.1vw, 5.5rem);
  line-height: .88;
}

.th-p-activewear .activewear-hero__copy .sub {
  max-width: 35ch;
  margin: 1.15rem 0 0;
  color: var(--activewear-ink);
  font: 600 clamp(.82rem, 1.06vw, 1rem)/1.55 var(--body);
  overflow-wrap: anywhere;
}

.th-p-activewear .activewear-hero__copy .ctas {
  display: flex;
  flex-wrap: wrap;
  gap: .65rem;
  margin-top: 1.45rem;
}

.th-p-activewear .activewear-hero__copy .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.9rem;
  padding: .75rem 1.2rem;
  border: 1px solid var(--activewear-ink);
  border-radius: 999px;
  background: var(--activewear-ink);
  color: var(--activewear-paper);
  font: 800 .67rem/1 var(--body);
  letter-spacing: .1em;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-activewear .activewear-hero__copy .btn.ghost {
  background: transparent;
  color: var(--activewear-ink);
}

.th-p-activewear .activewear-hero__copy .btn:hover,
.th-p-activewear .activewear-hero__copy .btn:focus-visible {
  border-color: var(--activewear-coral);
  background: var(--activewear-coral);
  color: #FFFFFF;
}

.th-p-activewear .activewear-hero__cadence {
  position: absolute;
  z-index: 1;
  right: max(1.35rem, calc((100vw - 82rem) / 2));
  bottom: clamp(1.25rem, 2.4vw, 2.5rem);
  display: flex;
  align-items: center;
  gap: .65rem;
  color: var(--activewear-paper);
  font: 800 .65rem/1 var(--body);
  letter-spacing: .13em;
}

.th-p-activewear .activewear-hero__cadence i {
  display: block;
  width: clamp(1.35rem, 3vw, 3.2rem);
  height: 1px;
  background: currentColor;
}

.th-p-activewear .activewear-hero .motion-toggle {
  position: absolute;
  z-index: 2;
  top: clamp(1rem, 2.5vw, 2rem);
  right: max(1rem, calc((100vw - 82rem) / 2));
  min-width: 2.8rem;
  min-height: 2.8rem;
  padding: .5rem .8rem;
  border: 1px solid rgba(21, 38, 58, .5);
  border-radius: 999px;
  background: rgba(255, 249, 243, .75);
  color: var(--activewear-ink);
  font: 800 .58rem/1 var(--body);
  letter-spacing: .08em;
  text-transform: uppercase;
}

.th-p-activewear .activewear-hero .motion-toggle:hover,
.th-p-activewear .activewear-hero .motion-toggle:focus-visible {
  background: var(--activewear-coral);
  color: #FFFFFF;
}

.th-p-activewear .activewear-discovery {
  display: grid;
  grid-template-columns: minmax(13rem, .78fr) minmax(0, 1.62fr);
  gap: clamp(2rem, 5vw, 6rem);
  align-items: stretch;
  padding: clamp(3.5rem, 7vw, 7.7rem) max(1.25rem, calc((100vw - 82rem) / 2));
  background: var(--activewear-paper);
  border-top: 1px solid var(--activewear-ink);
  border-bottom: 1px solid var(--activewear-line);
}

.th-p-activewear .activewear-discovery__lead {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.th-p-activewear .activewear-discovery__lead h2 {
  max-width: 8.5ch;
  margin: 0;
  color: var(--activewear-ink);
  font-family: var(--display);
  font-size: clamp(2.6rem, 4.7vw, 5.3rem);
  font-weight: 700;
  letter-spacing: -.075em;
  line-height: .86;
  overflow-wrap: anywhere;
  text-wrap: balance;
}

.th-p-activewear .activewear-discovery__lead > p:last-child {
  max-width: 30ch;
  margin: 1.45rem 0 0;
  color: var(--activewear-muted);
  font: 600 .84rem/1.6 var(--body);
}

.th-p-activewear .activewear-routes {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: end;
  gap: clamp(.65rem, 1.2vw, 1.15rem);
  min-width: 0;
}

.th-p-activewear .activewear-route {
  position: relative;
  display: grid;
  grid-template-rows: 1fr auto auto;
  min-width: 0;
  min-height: clamp(20rem, 31vw, 28rem);
  overflow: hidden;
  border-radius: 9rem 9rem 1.1rem 1.1rem;
  background: var(--activewear-peach);
  color: var(--activewear-ink);
  text-decoration: none;
}

.th-p-activewear .activewear-route:nth-child(2) {
  border-radius: 1.1rem 1.1rem 9rem 9rem;
  background: var(--activewear-aqua);
}

.th-p-activewear .activewear-route:nth-child(3) {
  background: #F3B99F;
}

.th-p-activewear .activewear-route__media {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  background: linear-gradient(145deg, rgba(255, 249, 243, .75), rgba(239, 101, 78, .48));
}

.th-p-activewear .activewear-route__image,
.th-p-activewear .activewear-route__blank {
  display: block;
  width: 100%;
  height: 100%;
}

.th-p-activewear .activewear-route__image {
  object-fit: cover;
}

.th-p-activewear .activewear-route__blank {
  background:
    radial-gradient(circle at 70% 25%, rgba(255, 249, 243, .86) 0 12%, transparent 12.5%),
    linear-gradient(142deg, transparent 0 42%, rgba(21, 38, 58, .15) 42.5% 43%, transparent 43.5% 100%),
    linear-gradient(145deg, #F8D9C7, #EF654E);
}

.th-p-activewear .activewear-route__media::after {
  position: absolute;
  inset: 0;
  content: '';
  background: linear-gradient(180deg, rgba(21, 38, 58, .05) 20%, rgba(21, 38, 58, .84) 100%);
}

.th-p-activewear .activewear-route__meta,
.th-p-activewear .activewear-route__name,
.th-p-activewear .activewear-route__arrow {
  position: relative;
  z-index: 1;
}

.th-p-activewear .activewear-route__meta {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: .65rem;
  padding: 1.3rem 1.2rem 0;
  color: var(--activewear-paper);
}

.th-p-activewear .activewear-route__meta b {
  font: 700 clamp(2.3rem, 4vw, 4.6rem)/.72 var(--display);
  letter-spacing: -.08em;
}

.th-p-activewear .activewear-route__meta small {
  padding-bottom: .18rem;
  font: 800 .59rem/1.25 var(--body);
  letter-spacing: .1em;
  text-align: right;
  text-transform: uppercase;
}

.th-p-activewear .activewear-route__name {
  padding: .55rem 3.3rem 1.35rem 1.2rem;
  color: var(--activewear-paper);
  font: 700 clamp(1.35rem, 2vw, 2.1rem)/.92 var(--display);
  letter-spacing: -.06em;
  overflow-wrap: anywhere;
}

.th-p-activewear .activewear-route__arrow {
  position: absolute;
  right: 1.1rem;
  bottom: 1.15rem;
  display: grid;
  width: 2.65rem;
  height: 2.65rem;
  place-items: center;
  border: 1px solid rgba(255, 249, 243, .75);
  border-radius: 50%;
  color: var(--activewear-paper);
  font: 400 1.4rem/1 var(--display);
}

.th-p-activewear .activewear-route:hover,
.th-p-activewear .activewear-route:focus-visible {
  outline: 3px solid var(--activewear-coral);
  outline-offset: 4px;
}

.th-p-activewear .activewear-route:hover .activewear-route__arrow,
.th-p-activewear .activewear-route:focus-visible .activewear-route__arrow {
  border-color: var(--activewear-coral);
  background: var(--activewear-coral);
}

.th-p-activewear .activewear-discovery--products {
  grid-template-columns: minmax(13rem, .8fr) minmax(0, 1.5fr);
}

.th-p-activewear .activewear-live-products {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  align-self: center;
  overflow: hidden;
  border: 1px solid var(--activewear-ink);
  border-radius: 1.2rem;
  background: var(--activewear-ink);
}

.th-p-activewear .activewear-live-products > * {
  min-width: 0;
  background: var(--activewear-paper);
}

.th-p-activewear #shop {
  padding-top: clamp(3.5rem, 7vw, 7rem);
  background: var(--activewear-peach);
}

.th-p-activewear #shop .sec-h {
  border-color: var(--activewear-line);
}

.th-p-activewear #shop h2 {
  font-family: var(--display);
  font-weight: 700;
  letter-spacing: -.055em;
}

.th-p-activewear #shop .pc {
  overflow: hidden;
  border-radius: 1.15rem;
}

.th-p-activewear .activewear-hero.has-hero-motion[data-hero-motion="pan"] .activewear-hero__media .hero-media {
  animation: activewear-pan 18s ease-in-out infinite alternate;
}

.th-p-activewear .activewear-hero.has-hero-motion[data-hero-motion="drift"] .activewear-hero__media .hero-media {
  animation: activewear-drift 15s ease-in-out infinite alternate;
}

@keyframes activewear-pan {
  from { transform: scale(1.03) translate3d(-.8%, .4%, 0); }
  to { transform: scale(1.09) translate3d(1.4%, -1.1%, 0); }
}

@keyframes activewear-drift {
  from { transform: scale(1.03) translate3d(.8%, 0, 0); }
  to { transform: scale(1.08) translate3d(-1.2%, -1.2%, 0); }
}

@media (max-width: 820px) {
  .th-p-activewear .activewear-hero {
    grid-template-columns: 1rem minmax(0, 1fr) 1rem;
    min-height: 43rem;
  }

  .th-p-activewear .activewear-hero__tone {
    background:
      linear-gradient(180deg, rgba(255, 249, 243, .18) 0%, rgba(255, 249, 243, .03) 40%, rgba(255, 249, 243, .94) 72%, var(--activewear-paper) 100%),
      linear-gradient(90deg, rgba(255, 249, 243, .35), transparent 58%);
  }

  .th-p-activewear .activewear-hero__field-word {
    top: 12%;
    left: 49%;
    font-size: clamp(7.5rem, 23vw, 13rem);
  }

  .th-p-activewear .activewear-hero__copy-wrap {
    width: min(100%, 38rem);
    margin: 0 0 5.8rem 0;
  }

  .th-p-activewear .activewear-discovery,
  .th-p-activewear .activewear-discovery--products {
    grid-template-columns: 1fr;
    gap: 2.5rem;
    padding-right: 1.25rem;
    padding-left: 1.25rem;
  }

  .th-p-activewear .activewear-discovery__lead h2 {
    max-width: 12ch;
  }

  .th-p-activewear .activewear-routes {
    max-width: 48rem;
  }

  .th-p-activewear .activewear-live-products {
    max-width: 48rem;
  }
}

@media (max-width: 560px) {
  .th-p-activewear .hd .wrap {
    min-height: 3.8rem;
  }

  .th-p-activewear .hd .nav {
    display: none;
  }

  .th-p-activewear .activewear-hero {
    min-height: 43.5rem;
  }

  .th-p-activewear .activewear-hero__media .hero-media {
    object-position: 61% center;
  }

  .th-p-activewear .activewear-hero__trace {
    right: 1.45rem;
    width: 6rem;
  }

  .th-p-activewear .activewear-hero__signal {
    left: 1.15rem;
  }

  .th-p-activewear .activewear-hero__signal::before {
    width: 1.65rem;
  }

  .th-p-activewear .activewear-hero__field-word {
    top: 18%;
    left: 47%;
    font-size: clamp(7.2rem, 28vw, 9.7rem);
  }

  .th-p-activewear .activewear-hero__copy-wrap {
    align-self: end;
    width: 100%;
    margin-bottom: 4.9rem;
  }

  .th-p-activewear .activewear-hero__copy {
    padding: 1.25rem 1.15rem 1.35rem;
    box-shadow: .7rem .7rem 0 var(--activewear-coral);
  }

  .th-p-activewear .activewear-hero__copy h1 {
    max-width: 10ch;
    font-size: clamp(3rem, 13vw, 4.65rem);
  }

  .th-p-activewear .activewear-hero__copy h1.long {
    font-size: clamp(2.4rem, 10.5vw, 3.55rem);
  }

  .th-p-activewear .activewear-hero__copy .sub {
    font-size: .8rem;
  }

  .th-p-activewear .activewear-hero__cadence {
    right: 1.15rem;
    bottom: 1.2rem;
    gap: .4rem;
    font-size: .56rem;
  }

  .th-p-activewear .activewear-hero__cadence i {
    width: 1.3rem;
  }

  .th-p-activewear .activewear-hero .motion-toggle {
    top: 1rem;
    right: 1rem;
    min-width: 2.75rem;
    min-height: 2.75rem;
  }

  .th-p-activewear .activewear-discovery {
    padding-top: 3.7rem;
    padding-bottom: 4rem;
  }

  .th-p-activewear .activewear-discovery__lead h2 {
    max-width: 10.5ch;
    font-size: clamp(2.55rem, 12vw, 4rem);
  }

  .th-p-activewear .activewear-routes {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .th-p-activewear .activewear-route {
    min-height: 17.5rem;
    border-radius: 5.5rem 5.5rem .9rem .9rem;
  }

  .th-p-activewear .activewear-route:nth-child(2) {
    border-radius: .9rem .9rem 5.5rem 5.5rem;
  }

  .th-p-activewear .activewear-route:nth-child(3) {
    grid-column: 1 / -1;
    min-height: 15rem;
    border-radius: .9rem 5.5rem .9rem 5.5rem;
  }

  .th-p-activewear .activewear-route__meta {
    padding: 1rem .9rem 0;
  }

  .th-p-activewear .activewear-route__name {
    padding: .5rem 2.85rem 1rem .9rem;
    font-size: 1.35rem;
  }

  .th-p-activewear .activewear-route__arrow {
    right: .8rem;
    bottom: .8rem;
    width: 2.45rem;
    height: 2.45rem;
  }

  .th-p-activewear .activewear-live-products {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 380px) {
  .th-p-activewear .activewear-hero {
    min-height: 45rem;
  }

  .th-p-activewear .activewear-hero__copy h1 {
    font-size: 2.95rem;
  }

  .th-p-activewear .activewear-routes {
    grid-template-columns: 1fr;
  }

  .th-p-activewear .activewear-route,
  .th-p-activewear .activewear-route:nth-child(2),
  .th-p-activewear .activewear-route:nth-child(3) {
    grid-column: auto;
    min-height: 14.5rem;
    border-radius: 4.75rem 4.75rem .85rem .85rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .th-p-activewear .activewear-hero.has-hero-motion .activewear-hero__media .hero-media {
    animation: none !important;
    transform: none !important;
  }
}
`;

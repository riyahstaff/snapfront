import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-nail-polish',
  name: 'TINT THEORY',
  for: 'nail color collectors who choose polish as a small daily gesture',
  vibe: 'a lacquer color library in oxblood, warm coral, plum, and pearl',
  category: 'Nail polish and color lacquer',
  group: 'beauty',
  display: 'Bodoni Moda',
  body: 'DM Sans',
  displayWeight: 600,
  tracking: '-.055em',
  colors: {
    bg: '#F5E9E2',
    surface: '#FFF9F5',
    ink: '#331522',
    muted: '#805B64',
    line: '#DDBFC0',
    accent: '#9E2943',
    onAccent: '#FFF9F5',
    panel: '#4A1726',
    onPanel: '#FFF2E9',
    foot: '#2B101B',
    onFoot: '#FBEDE5',
    bar: '#EACFD0',
    onBar: '#331522',
    badge: '#F0AAA1',
    onBadge: '#4A1726',
  },
  header: 'center',
  hero: 'collage',
  card: 'pastel',
  ratio: '4/5',
  rCard: 2,
  rBtn: 999,
  motion: 'pan',
  collection: 'premium',
  family: 'nail-polish',
  demoPhoto: '/assets/themes/nail-polish-hero.webp',
  copy: {
    eyebrow: 'The colour practice',
    collection: 'The colour library',
    cta: 'Browse the colours',
    title: 'A little colour changes the whole gesture.',
    subtitle: 'An edit for hands that like to leave a considered impression.',
  },
});

const itemCount = (value) => {
  const count = Number(value) || 0;
  return `${count} ${count === 1 ? 'colour' : 'colours'}`;
};

export function hero(ctx) {
  const collection = ctx.t.copy?.collection || 'The colour library';

  return `
    <section class="hero category-hero nl-lacquer-hero${ctx.heroClass}"${ctx.heroAttrs}>
      <div class="nl-stage">
        <p class="nl-hero-register" aria-hidden="true"><span>01</span> / colour study</p>
        <figure class="nl-hero-photo">
          ${ctx.media(0, { priority: true, lazy: false, decorative: false })}
          <span class="nl-photo-wash" aria-hidden="true"></span>
        </figure>
        <div class="nl-palette-notes" aria-hidden="true">
          <span></span><span></span><span></span><span></span>
        </div>
        <article class="nl-copy-ticket">
          <p class="nl-ticket-collection"><i aria-hidden="true"></i>${ctx.esc(collection)}</p>
          ${ctx.copy('nl-hero-copy')}
          <p class="nl-ticket-note">A small collection of colour, ready for the next gesture.</p>
        </article>
        <p class="nl-side-mark" aria-hidden="true">Lacquer<br>Index</p>
      </div>
      <div class="nl-motion-controls">${ctx.controls}</div>
    </section>
  `;
}

export function discovery(ctx) {
  const categories = Array.isArray(ctx.cats) ? ctx.cats.filter((category) => category?.name).slice(0, 4) : [];
  const products = Array.isArray(ctx.products) ? ctx.products.slice(0, 3) : [];

  if (categories.length >= 2) {
    const cards = categories.map((category, index) => {
      const image = category.image
        ? `<img src="${ctx.esc(category.image)}" alt="${ctx.esc(category.name)}" loading="lazy" decoding="async">`
        : `<span class="nl-finish-fallback nl-finish-fallback-${index + 1}" aria-hidden="true"></span>`;
      return `
        <a class="nl-finish-card nl-finish-card-${index + 1}" href="${ctx.categoryLink(category.name)}">
          <span class="nl-finish-number">0${index + 1}</span>
          <span class="nl-finish-media">${image}</span>
          <span class="nl-finish-copy">
            <b>${ctx.esc(category.name)}</b>
            <small>${ctx.esc(itemCount(category.count))}</small>
          </span>
          <span class="nl-finish-arrow" aria-hidden="true">↗</span>
        </a>
      `;
    }).join('');

    return `
      <section class="theme-discovery nl-colour-library" aria-labelledby="nl-colour-library-title">
        <div class="nl-library-intro">
          <p class="nl-section-kicker">${ctx.esc(collectionTitle(ctx))}</p>
          <h2 id="nl-colour-library-title">Choose the colour story already on the shelf.</h2>
          <p>Start with a collection, then follow the shades that feel most like yours.</p>
          <a class="nl-library-all" href="#shop">View all colours <span aria-hidden="true">→</span></a>
        </div>
        <div class="nl-finish-deck">${cards}</div>
      </section>
    `;
  }

  if (products.length) {
    const cards = products.map((product, index) => `
      <div class="nl-current-card nl-current-card-${index + 1}">${ctx.productCard(product)}</div>
    `).join('');
    const count = products.length;

    return `
      <section class="theme-discovery nl-colour-library nl-current-edit" aria-labelledby="nl-current-edit-title">
        <div class="nl-library-intro">
          <p class="nl-section-kicker">The current edit</p>
          <h2 id="nl-current-edit-title">Colour, already waiting in the studio.</h2>
          <p>${ctx.esc(String(count))} ${count === 1 ? 'colour is' : 'colours are'} ready to explore.</p>
          <a class="nl-library-all" href="#shop">View all colours <span aria-hidden="true">→</span></a>
        </div>
        <div class="nl-current-grid">${cards}</div>
      </section>
    `;
  }

  return '';
}

function collectionTitle(ctx) {
  return ctx.t.copy?.collection || 'The colour library';
}

export const css = `
.th-p-nail-polish {
  --nl-paper: #f5e9e2;
  --nl-cream: #fff9f5;
  --nl-ink: #331522;
  --nl-wine: #4a1726;
  --nl-berry: #9e2943;
  --nl-coral: #efaaa1;
  --nl-rose: #eacfd0;
  --nl-line: #ddbfc0;
  --nl-muted: #805b64;
  --nl-plum: #522447;
  background: var(--nl-paper);
  color: var(--nl-ink);
  overflow-x: clip;
}

.th-p-nail-polish .hd,
.th-p-nail-polish .site-header,
.th-p-nail-polish .store-header {
  border-bottom-color: rgba(74, 23, 38, .18);
  background: color-mix(in srgb, var(--nl-paper) 93%, transparent);
}

.th-p-nail-polish .hd .wrap {
  max-width: none;
  padding-inline: clamp(1rem, 3.8vw, 4.5rem);
}

.th-p-nail-polish .brand {
  color: var(--nl-ink);
  font-family: var(--font-display, 'Bodoni Moda', Georgia, serif);
  font-size: calc(1.28rem * var(--ts, 1));
  font-weight: 600;
  letter-spacing: .02em;
}

.th-p-nail-polish .nav a,
.th-p-nail-polish .cart {
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .66rem;
  font-weight: 700;
  letter-spacing: .11em;
  text-transform: uppercase;
}

.th-p-nail-polish .cart {
  border: 1px solid var(--nl-line);
  border-radius: 999px;
}

.th-p-nail-polish .nl-lacquer-hero {
  position: relative;
  isolation: isolate;
  min-height: clamp(41.5rem, 57vw, 54rem);
  padding: clamp(1rem, 2.7vw, 2.5rem) clamp(1rem, 4.2vw, 5.4rem) clamp(1.5rem, 3.4vw, 3.2rem);
  overflow: hidden;
  background:
    radial-gradient(circle at 12% 78%, rgba(238, 170, 161, .4) 0 1.4%, transparent 1.5%),
    linear-gradient(128deg, #f8eee9 0%, #eed8d5 49%, #e0bfc1 100%);
}

.th-p-nail-polish .nl-stage {
  position: relative;
  width: min(100%, 96rem);
  min-height: clamp(38.8rem, 50vw, 47.8rem);
  margin: 0 auto;
}

.th-p-nail-polish .nl-hero-photo {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: clamp(14rem, 19vw, 21.5rem);
  margin: 0;
  overflow: hidden;
  background:
    radial-gradient(circle at 67% 61%, rgba(239, 170, 161, .86) 0 8%, transparent 8.5%),
    linear-gradient(112deg, #6c303a, #250d19 65%, #6e2b39);
  box-shadow: 0 1.5rem 4rem rgba(57, 18, 30, .2);
}

.th-p-nail-polish .nl-hero-photo .hero-media,
.th-p-nail-polish .nl-hero-photo .theme-empty-media {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 100%;
  object-fit: cover;
  object-position: 57% center;
}

.th-p-nail-polish .nl-hero-photo .theme-empty-media {
  background:
    radial-gradient(ellipse at 70% 58%, rgba(249, 238, 228, .96) 0 7%, transparent 7.6%),
    radial-gradient(ellipse at 57% 54%, rgba(239, 170, 161, .82) 0 10%, transparent 10.5%),
    linear-gradient(110deg, #762d3d, #280d1a 65%, #572038);
  color: rgba(255, 242, 235, .85);
}

.th-p-nail-polish .nl-photo-wash {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(46, 13, 25, .36), transparent 32%, rgba(38, 9, 20, .16));
  pointer-events: none;
}

.th-p-nail-polish .nl-hero-register {
  position: absolute;
  top: clamp(1.25rem, 2.8vw, 2.7rem);
  right: clamp(1.3rem, 3.1vw, 3rem);
  z-index: 2;
  display: flex;
  align-items: center;
  gap: .62rem;
  margin: 0;
  color: rgba(255, 240, 231, .78);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .58rem;
  font-weight: 700;
  letter-spacing: .17em;
  line-height: 1.4;
  text-shadow: 0 1px 1rem rgba(31, 6, 15, .5);
  text-transform: uppercase;
}

.th-p-nail-polish .nl-hero-register span {
  color: var(--nl-coral);
}

.th-p-nail-polish .nl-palette-notes {
  position: absolute;
  z-index: 2;
  top: clamp(5rem, 8vw, 7.3rem);
  right: clamp(1.3rem, 3.1vw, 3rem);
  display: grid;
  gap: .55rem;
  width: .7rem;
}

.th-p-nail-polish .nl-palette-notes span {
  display: block;
  width: .7rem;
  aspect-ratio: 1;
  border: 1px solid rgba(255, 244, 238, .55);
  border-radius: 50%;
  background: #7e1f39;
  box-shadow: 0 .18rem .7rem rgba(21, 4, 11, .24);
}

.th-p-nail-polish .nl-palette-notes span:nth-child(2) { background: #51203f; }
.th-p-nail-polish .nl-palette-notes span:nth-child(3) { background: #ec867c; }
.th-p-nail-polish .nl-palette-notes span:nth-child(4) { background: #f8e8dc; }

.th-p-nail-polish .nl-copy-ticket {
  position: absolute;
  z-index: 3;
  bottom: clamp(1.1rem, 3.9vw, 3.7rem);
  left: 0;
  width: min(49%, 35rem);
  min-width: 0;
  padding: clamp(2.1rem, 4vw, 4.1rem) clamp(1.45rem, 4.1vw, 4.1rem) clamp(1.9rem, 3.5vw, 3.3rem);
  border: 1px solid rgba(74, 23, 38, .25);
  background: var(--nl-cream);
  box-shadow: 0 1.3rem 3.6rem rgba(55, 16, 28, .13);
}

.th-p-nail-polish .nl-copy-ticket::before {
  position: absolute;
  top: .65rem;
  right: .65rem;
  bottom: .65rem;
  left: .65rem;
  border: 1px solid rgba(158, 41, 67, .22);
  content: '';
  pointer-events: none;
}

.th-p-nail-polish .nl-ticket-collection {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: .65rem;
  margin: 0;
  color: var(--nl-berry);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .59rem;
  font-weight: 700;
  letter-spacing: .17em;
  line-height: 1.4;
  text-transform: uppercase;
}

.th-p-nail-polish .nl-ticket-collection i {
  display: inline-block;
  width: 1.65rem;
  height: 1px;
  background: currentColor;
}

.th-p-nail-polish .nl-hero-copy {
  position: relative;
  z-index: 1;
  margin-top: clamp(1.8rem, 3.5vw, 3.3rem);
}

.th-p-nail-polish .nl-hero-copy .eyebrow {
  margin: 0 0 .8rem;
  color: var(--nl-muted);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .61rem;
  font-weight: 700;
  letter-spacing: .15em;
  line-height: 1.4;
  text-transform: uppercase;
}

.th-p-nail-polish .nl-hero-copy h1 {
  max-width: 9.7ch;
  margin: 0;
  color: var(--nl-ink);
  font-family: var(--font-display, 'Bodoni Moda', Georgia, serif);
  font-size: clamp(3.35rem, 5.6vw, 6.6rem);
  font-weight: 600;
  letter-spacing: -.07em;
  line-height: .79;
  overflow-wrap: anywhere;
  text-wrap: balance;
}

.th-p-nail-polish .nl-hero-copy h1.long {
  max-width: 13ch;
  font-size: clamp(2.65rem, 4.3vw, 5rem);
  line-height: .88;
}

.th-p-nail-polish .nl-hero-copy .sub {
  max-width: 31ch;
  margin: 1.3rem 0 0;
  color: var(--nl-muted);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: clamp(.8rem, .95vw, .95rem);
  letter-spacing: .01em;
  line-height: 1.6;
}

.th-p-nail-polish .nl-hero-copy .ctas {
  display: flex;
  flex-wrap: wrap;
  gap: .6rem;
  margin-top: 1.55rem;
}

.th-p-nail-polish .nl-hero-copy .btn {
  display: inline-flex;
  min-height: 44px;
  padding: .78rem 1.15rem;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--nl-berry);
  border-radius: 999px;
  background: var(--nl-berry);
  color: var(--nl-cream);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .61rem;
  font-weight: 700;
  letter-spacing: .13em;
  line-height: 1.2;
  text-align: center;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-nail-polish .nl-hero-copy .btn.ghost {
  background: transparent;
  color: var(--nl-berry);
}

.th-p-nail-polish .nl-hero-copy .btn:hover,
.th-p-nail-polish .nl-hero-copy .btn:focus-visible {
  border-color: var(--nl-ink);
  background: var(--nl-ink);
  color: var(--nl-cream);
  outline: none;
}

.th-p-nail-polish .nl-ticket-note {
  position: relative;
  z-index: 1;
  max-width: 23ch;
  margin: 1.4rem 0 0;
  color: var(--nl-muted);
  font-family: var(--font-display, 'Bodoni Moda', Georgia, serif);
  font-size: .92rem;
  font-style: italic;
  letter-spacing: -.02em;
  line-height: 1.3;
}

.th-p-nail-polish .nl-side-mark {
  position: absolute;
  right: calc(100% - clamp(1.8rem, 3.5vw, 3.45rem));
  bottom: clamp(1.2rem, 3.2vw, 3rem);
  width: 1em;
  margin: 0;
  color: var(--nl-muted);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .56rem;
  font-weight: 700;
  letter-spacing: .17em;
  line-height: 1.45;
  text-transform: uppercase;
  writing-mode: vertical-rl;
}

.th-p-nail-polish .nl-motion-controls {
  position: absolute;
  z-index: 5;
  right: clamp(1.65rem, 5.4vw, 6rem);
  bottom: clamp(1.5rem, 3.5vw, 3.4rem);
}

.th-p-nail-polish .nl-motion-controls .motion-toggle {
  min-width: 44px;
  min-height: 44px;
  border: 1px solid rgba(255, 245, 239, .75);
  border-radius: 999px;
  background: rgba(63, 15, 28, .66);
  color: var(--nl-cream);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .59rem;
  font-weight: 700;
  letter-spacing: .08em;
}

.th-p-nail-polish .nl-motion-controls .motion-toggle:hover,
.th-p-nail-polish .nl-motion-controls .motion-toggle:focus-visible {
  border-color: var(--nl-coral);
  background: var(--nl-coral);
  color: var(--nl-wine);
  outline: none;
}

.th-p-nail-polish .nl-lacquer-hero.has-hero-motion .nl-hero-photo .hero-media {
  animation: p-nail-polish-hero-pan 18s ease-in-out infinite alternate;
}

.th-p-nail-polish .nl-colour-library {
  display: grid;
  grid-template-columns: minmax(14rem, .82fr) minmax(0, 2.18fr);
  gap: clamp(2rem, 6vw, 7rem);
  padding: clamp(4.5rem, 8vw, 8.5rem) clamp(1.15rem, 5.3vw, 6.5rem) clamp(4.7rem, 8vw, 8.2rem);
  border-top: 1px solid var(--nl-line);
  border-bottom: 1px solid var(--nl-line);
  background:
    linear-gradient(90deg, transparent 0 9.25%, rgba(158, 41, 67, .075) 9.25% 9.35%, transparent 9.35% 100%),
    var(--nl-paper);
}

.th-p-nail-polish .nl-library-intro {
  align-self: center;
  max-width: 22rem;
}

.th-p-nail-polish .nl-section-kicker {
  display: flex;
  align-items: center;
  gap: .7rem;
  margin: 0 0 1.15rem;
  color: var(--nl-berry);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .6rem;
  font-weight: 700;
  letter-spacing: .17em;
  line-height: 1.4;
  text-transform: uppercase;
}

.th-p-nail-polish .nl-section-kicker::before {
  width: 1.8rem;
  height: 1px;
  background: currentColor;
  content: '';
}

.th-p-nail-polish .nl-library-intro h2 {
  max-width: 11ch;
  margin: 0;
  color: var(--nl-ink);
  font-family: var(--font-display, 'Bodoni Moda', Georgia, serif);
  font-size: clamp(2.75rem, 4.2vw, 5rem);
  font-weight: 600;
  letter-spacing: -.07em;
  line-height: .84;
  overflow-wrap: anywhere;
  text-wrap: balance;
}

.th-p-nail-polish .nl-library-intro > p:not(.nl-section-kicker) {
  max-width: 27ch;
  margin: 1.45rem 0 0;
  color: var(--nl-muted);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .91rem;
  line-height: 1.65;
}

.th-p-nail-polish .nl-library-all {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  gap: .7rem;
  margin-top: 1.55rem;
  border-bottom: 1px solid currentColor;
  color: var(--nl-ink);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .62rem;
  font-weight: 700;
  letter-spacing: .12em;
  line-height: 1;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-nail-polish .nl-library-all span {
  font-size: 1.15rem;
  line-height: 1;
}

.th-p-nail-polish .nl-library-all:hover,
.th-p-nail-polish .nl-library-all:focus-visible {
  color: var(--nl-berry);
  outline: none;
}

.th-p-nail-polish .nl-finish-deck {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: start;
  min-width: 0;
  padding-top: clamp(.7rem, 3.4vw, 3.4rem);
}

.th-p-nail-polish .nl-finish-card {
  position: relative;
  display: flex;
  min-width: 0;
  min-height: clamp(19rem, 30vw, 29rem);
  padding: clamp(.55rem, 1.2vw, 1rem);
  flex-direction: column;
  border-top: 1px solid var(--nl-line);
  border-right: 1px solid var(--nl-line);
  border-bottom: 1px solid var(--nl-line);
  background: rgba(255, 249, 245, .42);
  color: var(--nl-ink);
  text-decoration: none;
}

.th-p-nail-polish .nl-finish-card:first-child {
  border-left: 1px solid var(--nl-line);
}

.th-p-nail-polish .nl-finish-card:nth-child(2) {
  margin-top: clamp(1.4rem, 4vw, 3.6rem);
  margin-bottom: clamp(-1.4rem, -2.2vw, -2rem);
}

.th-p-nail-polish .nl-finish-card:nth-child(3) {
  margin-top: clamp(.45rem, 1.7vw, 1.55rem);
}

.th-p-nail-polish .nl-finish-card:nth-child(4) {
  margin-top: clamp(2.7rem, 6vw, 5.8rem);
  margin-bottom: clamp(-2.7rem, -3.8vw, -3.4rem);
}

.th-p-nail-polish .nl-finish-number {
  position: absolute;
  z-index: 2;
  top: clamp(1rem, 1.7vw, 1.4rem);
  left: clamp(1rem, 1.7vw, 1.4rem);
  color: var(--nl-cream);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .57rem;
  font-weight: 700;
  letter-spacing: .15em;
  text-shadow: 0 1px .7rem rgba(33, 8, 17, .44);
}

.th-p-nail-polish .nl-finish-media {
  position: relative;
  display: block;
  flex: 1;
  min-height: 12rem;
  overflow: hidden;
  background: var(--nl-rose);
}

.th-p-nail-polish .nl-finish-media::after {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(53, 16, 31, .19), transparent 42%, rgba(53, 16, 31, .08));
  content: '';
  pointer-events: none;
}

.th-p-nail-polish .nl-finish-media img,
.th-p-nail-polish .nl-finish-fallback {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.th-p-nail-polish .nl-finish-fallback-1 {
  background: radial-gradient(ellipse at 62% 60%, #f5b0a8 0 16%, transparent 16.6%), linear-gradient(140deg, #74303f, #eab1aa);
}

.th-p-nail-polish .nl-finish-fallback-2 {
  background: radial-gradient(ellipse at 43% 56%, #d67b86 0 20%, transparent 20.6%), linear-gradient(142deg, #f4d6ce, #592342);
}

.th-p-nail-polish .nl-finish-fallback-3 {
  background: radial-gradient(ellipse at 57% 55%, #fff1e7 0 16%, transparent 16.6%), linear-gradient(138deg, #542142, #eea59c);
}

.th-p-nail-polish .nl-finish-fallback-4 {
  background: radial-gradient(ellipse at 48% 53%, #9e2943 0 17%, transparent 17.6%), linear-gradient(142deg, #efd0cb, #7f3543);
}

.th-p-nail-polish .nl-finish-copy {
  display: flex;
  min-height: 7rem;
  padding: 1rem .25rem .2rem;
  flex-direction: column;
  align-items: flex-start;
}

.th-p-nail-polish .nl-finish-copy b {
  color: var(--nl-ink);
  font-family: var(--font-display, 'Bodoni Moda', Georgia, serif);
  font-size: clamp(1.08rem, 1.55vw, 1.58rem);
  font-weight: 600;
  letter-spacing: -.045em;
  line-height: .95;
  overflow-wrap: anywhere;
}

.th-p-nail-polish .nl-finish-copy small {
  margin-top: .58rem;
  color: var(--nl-muted);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .56rem;
  font-weight: 700;
  letter-spacing: .13em;
  line-height: 1.35;
  text-transform: uppercase;
}

.th-p-nail-polish .nl-finish-arrow {
  position: absolute;
  right: clamp(.9rem, 1.4vw, 1.25rem);
  bottom: clamp(.8rem, 1.3vw, 1.15rem);
  color: var(--nl-berry);
  font-family: var(--font-display, 'Bodoni Moda', Georgia, serif);
  font-size: 1.25rem;
  line-height: 1;
}

.th-p-nail-polish .nl-finish-card:hover,
.th-p-nail-polish .nl-finish-card:focus-visible {
  background: var(--nl-cream);
  outline: 2px solid var(--nl-berry);
  outline-offset: 4px;
}

.th-p-nail-polish .nl-current-edit {
  align-items: center;
}

.th-p-nail-polish .nl-current-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  min-width: 0;
  border-top: 1px solid var(--nl-line);
  border-left: 1px solid var(--nl-line);
}

.th-p-nail-polish .nl-current-card {
  min-width: 0;
  border-right: 1px solid var(--nl-line);
  border-bottom: 1px solid var(--nl-line);
}

.th-p-nail-polish .nl-current-card .pc,
.th-p-nail-polish .nl-current-card .product-card {
  height: 100%;
  border: 0;
  border-radius: 0;
  background: rgba(255, 249, 245, .46);
}

.th-p-nail-polish #shop,
.th-p-nail-polish .shop-section {
  padding: clamp(4.6rem, 8vw, 8rem) clamp(1.15rem, 5.3vw, 6.5rem);
  background: var(--nl-cream);
}

.th-p-nail-polish #shop .sec-h,
.th-p-nail-polish .shop-section > .sec-h {
  padding-bottom: 1.35rem;
  border-bottom: 1px solid var(--nl-line);
}

.th-p-nail-polish #shop h2,
.th-p-nail-polish .shop-section > h2,
.th-p-nail-polish .shop-section .sec-h h2 {
  max-width: 12ch;
  color: var(--nl-ink);
  font-family: var(--font-display, 'Bodoni Moda', Georgia, serif);
  font-size: clamp(2.9rem, 4.6vw, 5.55rem);
  font-weight: 600;
  letter-spacing: -.07em;
  line-height: .83;
  overflow-wrap: anywhere;
}

.th-p-nail-polish #shop .grid,
.th-p-nail-polish .shop-section .grid,
.th-p-nail-polish .product-grid,
.th-p-nail-polish .products {
  gap: 0;
  border-top: 1px solid var(--nl-line);
  border-left: 1px solid var(--nl-line);
}

.th-p-nail-polish #shop .pc,
.th-p-nail-polish .shop-section .pc,
.th-p-nail-polish .product-grid .pc,
.th-p-nail-polish .products .product-card {
  padding: clamp(.7rem, 1.55vw, 1.4rem);
  border-right: 1px solid var(--nl-line);
  border-bottom: 1px solid var(--nl-line);
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  color: var(--nl-ink);
}

.th-p-nail-polish #shop .pc .im,
.th-p-nail-polish .shop-section .pc .im,
.th-p-nail-polish .product-grid .pc .im {
  overflow: hidden;
  border-radius: 50% 50% 2rem 2rem / 17% 17% 1.1rem 1.1rem;
  background: var(--nl-rose);
}

.th-p-nail-polish #shop .pc .im img,
.th-p-nail-polish .shop-section .pc .im img,
.th-p-nail-polish .product-grid .pc .im img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.th-p-nail-polish #shop .pc .bd,
.th-p-nail-polish .shop-section .pc .bd,
.th-p-nail-polish .product-grid .pc .bd {
  padding-top: .95rem;
}

.th-p-nail-polish #shop .pc h3,
.th-p-nail-polish .shop-section .pc h3,
.th-p-nail-polish .product-grid .pc h3 {
  font-family: var(--font-display, 'Bodoni Moda', Georgia, serif);
  font-size: clamp(1.18rem, 1.58vw, 1.6rem);
  font-weight: 600;
  letter-spacing: -.045em;
  line-height: .98;
  overflow-wrap: anywhere;
}

.th-p-nail-polish #shop .pc .pr,
.th-p-nail-polish .shop-section .pc .pr,
.th-p-nail-polish .product-grid .pc .pr {
  color: var(--nl-muted);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .75rem;
}

.th-p-nail-polish a:focus-visible {
  outline: 2px solid var(--nl-berry);
  outline-offset: 4px;
}

@keyframes p-nail-polish-hero-pan {
  from { transform: scale(1.01) translate3d(0, 0, 0); }
  to { transform: scale(1.065) translate3d(-.55%, -.3%, 0); }
}

@media (max-width: 900px) {
  .th-p-nail-polish .nl-copy-ticket {
    width: min(53%, 32rem);
  }

  .th-p-nail-polish .nl-finish-deck {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1px;
    padding-top: 1.5rem;
    border: 1px solid var(--nl-line);
  }

  .th-p-nail-polish .nl-finish-card,
  .th-p-nail-polish .nl-finish-card:first-child {
    min-height: 20rem;
    margin: 0;
    border: 0;
    border-right: 1px solid var(--nl-line);
    border-bottom: 1px solid var(--nl-line);
  }

  .th-p-nail-polish .nl-finish-card:nth-child(2n) {
    border-right: 0;
  }

  .th-p-nail-polish .nl-finish-card:nth-last-child(-n + 2) {
    border-bottom: 0;
  }
}

@media (max-width: 700px) {
  .th-p-nail-polish .hd .wrap {
    padding-inline: 1rem;
  }

  .th-p-nail-polish .nl-lacquer-hero {
    min-height: 0;
    padding: 0 0 1.3rem;
  }

  .th-p-nail-polish .nl-stage {
    display: flex;
    min-height: 0;
    flex-direction: column;
  }

  .th-p-nail-polish .nl-hero-photo {
    position: relative;
    top: auto;
    right: auto;
    bottom: auto;
    left: auto;
    width: calc(100% - 1rem);
    height: auto;
    aspect-ratio: 4 / 5;
    margin-left: auto;
  }

  .th-p-nail-polish .nl-hero-photo .hero-media {
    object-position: 60% center;
  }

  .th-p-nail-polish .nl-hero-register {
    top: 1.3rem;
    right: 1.35rem;
  }

  .th-p-nail-polish .nl-palette-notes {
    top: 4.35rem;
    right: 1.35rem;
  }

  .th-p-nail-polish .nl-copy-ticket {
    position: relative;
    bottom: auto;
    left: auto;
    width: calc(100% - 2.3rem);
    margin: -4.6rem auto 0 1.15rem;
    padding: 2.15rem 1.4rem 2rem;
  }

  .th-p-nail-polish .nl-hero-copy {
    margin-top: 2rem;
  }

  .th-p-nail-polish .nl-hero-copy h1 {
    max-width: 10ch;
    font-size: clamp(3.15rem, 13.8vw, 4.65rem);
  }

  .th-p-nail-polish .nl-hero-copy h1.long {
    max-width: 13ch;
    font-size: clamp(2.55rem, 10.7vw, 3.65rem);
  }

  .th-p-nail-polish .nl-hero-copy .sub {
    max-width: 34ch;
    margin-top: 1.1rem;
    font-size: .79rem;
  }

  .th-p-nail-polish .nl-hero-copy .ctas {
    width: 100%;
    margin-top: 1.35rem;
  }

  .th-p-nail-polish .nl-hero-copy .btn {
    width: 100%;
  }

  .th-p-nail-polish .nl-ticket-note {
    margin-top: 1.15rem;
  }

  .th-p-nail-polish .nl-side-mark {
    display: none;
  }

  .th-p-nail-polish .nl-motion-controls {
    top: calc((100vw - 1rem) * 1.25 - 3.65rem);
    right: 1rem;
    bottom: auto;
  }

  .th-p-nail-polish .nl-colour-library {
    display: block;
    padding: 4.25rem 1.15rem 4.5rem;
    background: var(--nl-paper);
  }

  .th-p-nail-polish .nl-library-intro {
    max-width: 28rem;
  }

  .th-p-nail-polish .nl-library-intro h2 {
    max-width: 12ch;
    font-size: clamp(2.65rem, 11.7vw, 4.05rem);
  }

  .th-p-nail-polish .nl-current-grid,
  .th-p-nail-polish .nl-finish-deck {
    margin-top: 2.4rem;
  }

  .th-p-nail-polish .nl-current-grid {
    grid-template-columns: 1fr;
  }

  .th-p-nail-polish .nl-finish-card,
  .th-p-nail-polish .nl-finish-card:first-child {
    display: grid;
    min-height: 9.7rem;
    padding: .65rem;
    grid-template-columns: minmax(5.8rem, .75fr) minmax(0, 1.25fr);
    gap: .8rem;
    align-items: stretch;
    border-right: 0;
    border-bottom: 1px solid var(--nl-line);
  }

  .th-p-nail-polish .nl-finish-card:nth-last-child(-n + 2) {
    border-bottom: 1px solid var(--nl-line);
  }

  .th-p-nail-polish .nl-finish-card:last-child {
    border-bottom: 0;
  }

  .th-p-nail-polish .nl-finish-number {
    top: 1rem;
    left: 1rem;
  }

  .th-p-nail-polish .nl-finish-media {
    min-height: 8.2rem;
  }

  .th-p-nail-polish .nl-finish-copy {
    min-height: 0;
    padding: .55rem 2.1rem .5rem .1rem;
    justify-content: center;
  }

  .th-p-nail-polish .nl-finish-copy b {
    font-size: clamp(1.35rem, 6.7vw, 2rem);
  }

  .th-p-nail-polish .nl-finish-arrow {
    right: 1rem;
    bottom: 1rem;
  }

  .th-p-nail-polish #shop,
  .th-p-nail-polish .shop-section {
    padding: 4.25rem 1.15rem;
  }
}

@media (max-width: 390px) {
  .th-p-nail-polish .nl-hero-photo {
    width: calc(100% - .6rem);
  }

  .th-p-nail-polish .nl-copy-ticket {
    width: calc(100% - 1.6rem);
    margin-left: .8rem;
    padding: 2rem 1.15rem 1.75rem;
  }

  .th-p-nail-polish .nl-ticket-collection {
    font-size: .54rem;
    letter-spacing: .13em;
  }

  .th-p-nail-polish .nl-hero-copy h1 {
    font-size: clamp(2.95rem, 13.2vw, 3.8rem);
  }

  .th-p-nail-polish .nl-finish-card,
  .th-p-nail-polish .nl-finish-card:first-child {
    grid-template-columns: 5.2rem minmax(0, 1fr);
    gap: .65rem;
  }

  .th-p-nail-polish .nl-finish-media {
    min-height: 7.5rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .th-p-nail-polish .nl-lacquer-hero.has-hero-motion .nl-hero-photo .hero-media {
    animation: none;
    transform: none;
  }
}
`;

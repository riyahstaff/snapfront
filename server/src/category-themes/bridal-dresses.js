import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-bridal-dresses',
  name: 'The Vow Room',
  for: 'bridal dresses and occasion gowns chosen for a personal ceremony',
  vibe: 'sunlit conservatory glass, folded ivory paper, and quiet botanical romance',
  category: 'Bridal dresses and ceremony gowns',
  group: 'fashion',
  display: 'DM Serif Display',
  body: 'Manrope',
  displayWeight: 400,
  tracking: '-.035em',
  colors: {
    bg: '#F5F1E9',
    surface: '#FFFDF8',
    ink: '#263530',
    muted: '#68736C',
    line: '#D7D8CF',
    accent: '#52695F',
    onAccent: '#FFFDF8',
    panel: '#E7EAE1',
    onPanel: '#263530',
    foot: '#263530',
    onFoot: '#F7F3EB',
    bar: '#E1E6DA',
    onBar: '#263530',
    badge: '#BFCDAF',
    onBadge: '#263530',
  },
  header: 'center',
  hero: 'spotlight',
  card: 'minimal',
  ratio: '3/4',
  rCard: 2,
  rBtn: 999,
  motion: 'pan',
  collection: 'premium',
  family: 'bridal-dresses',
  demoPhoto: '/assets/themes/bridal-dresses-hero.webp',
  copy: {
    eyebrow: 'The ceremony edit',
    collection: 'The Vow Room',
    cta: 'See the dresses',
    title: 'A dress for the moment you remember',
    subtitle: 'A quieter way to find the piece that feels like your own.',
  },
});

export function hero(ctx) {
  const collection = ctx.t.copy?.collection || 'The Vow Room';

  return `
    <section class="hero category-hero bd-vow-hero${ctx.heroClass}"${ctx.heroAttrs}>
      <div class="bd-hero-shell">
        <span class="bd-orbit bd-orbit-one" aria-hidden="true"></span>
        <span class="bd-orbit bd-orbit-two" aria-hidden="true"></span>
        <div class="bd-hero-chapel">
          <figure class="bd-hero-image">
            ${ctx.media(0, { priority: true, lazy: false, decorative: false })}
          </figure>
          <p class="bd-image-note">The light before the room arrives</p>
        </div>
        <article class="bd-folio">
          <span class="bd-folio-topline"><i aria-hidden="true"></i>${ctx.esc(collection)}</span>
          <span class="bd-folio-mark" aria-hidden="true">I</span>
          ${ctx.copy('bd-copy')}
          <span class="bd-folio-seal" aria-hidden="true"><i></i></span>
        </article>
        <p class="bd-side-whisper" aria-hidden="true">A private collection of beginnings</p>
      </div>
      <div class="bd-motion-controls">${ctx.controls}</div>
    </section>
  `;
}

export function discovery(ctx) {
  const cats = Array.isArray(ctx.cats) ? ctx.cats.filter((cat) => cat?.name).slice(0, 3) : [];
  const products = Array.isArray(ctx.products) ? ctx.products : [];

  if (cats.length >= 2) {
    const categoryPages = cats.map((cat, index) => {
      const count = Number(cat.count) || 0;
      const visual = cat.image
        ? `<img src="${ctx.esc(cat.image)}" alt="${ctx.esc(cat.name)}" loading="lazy" decoding="async">`
        : `<span class="bd-category-fallback bd-category-fallback-${index + 1}" aria-hidden="true"></span>`;

      return `
        <a class="bd-category-page bd-category-page-${index + 1}" href="${ctx.categoryLink(cat.name)}">
          <span class="bd-page-number">0${index + 1}</span>
          <span class="bd-page-image">${visual}</span>
          <span class="bd-page-copy">
            <b>${ctx.esc(cat.name)}</b>
            <small>${ctx.esc(String(count))} ${count === 1 ? 'piece' : 'pieces'}</small>
          </span>
          <span class="bd-page-arrow" aria-hidden="true">↗</span>
        </a>
      `;
    }).join('');

    return `
      <section class="theme-discovery bd-dress-room" aria-labelledby="bd-dress-room-title">
        <div class="bd-room-intro">
          <p class="bd-room-kicker">Begin in the dress room</p>
          <h2 id="bd-dress-room-title">Follow the feeling, then find the dress.</h2>
          <p>Browse the collections currently gathered here, at your own pace.</p>
          <a class="bd-all-dresses" href="#shop">View all dresses <span aria-hidden="true">→</span></a>
        </div>
        <div class="bd-category-pages">${categoryPages}</div>
      </section>
    `;
  }

  if (products.length > 0) {
    const selected = products.slice(0, 2).map((product) => `<div class="bd-current-piece">${ctx.productCard(product)}</div>`).join('');
    const count = products.length;

    return `
      <section class="theme-discovery bd-dress-room bd-current-room" aria-labelledby="bd-dress-room-title">
        <div class="bd-room-intro">
          <p class="bd-room-kicker">The dress room</p>
          <h2 id="bd-dress-room-title">A beginning, already in view.</h2>
          <p>${ctx.esc(String(count))} ${count === 1 ? 'piece is' : 'pieces are'} currently gathered in this collection.</p>
          <a class="bd-all-dresses" href="#shop">View all dresses <span aria-hidden="true">→</span></a>
        </div>
        <div class="bd-current-pieces">${selected}</div>
      </section>
    `;
  }

  return '';
}

export const css = `
.th-p-bridal-dresses {
  --bd-paper: #f5f1e9;
  --bd-ivory: #fffdf8;
  --bd-ink: #263530;
  --bd-green: #52695f;
  --bd-moss: #bfcdae;
  --bd-line: #d7d8cf;
  --bd-muted: #68736c;
  --bd-wash: #e7eae1;
  background: var(--bd-paper);
  color: var(--bd-ink);
}

.th-p-bridal-dresses .hd,
.th-p-bridal-dresses .site-header,
.th-p-bridal-dresses .store-header {
  background: color-mix(in srgb, var(--bd-ivory) 92%, transparent);
  border-bottom-color: var(--bd-line);
}

.th-p-bridal-dresses .hd .wrap {
  max-width: none;
  padding-inline: clamp(1rem, 3vw, 3.75rem);
}

.th-p-bridal-dresses .brand {
  color: var(--bd-ink);
  font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
  font-size: calc(1.4rem * var(--ts, 1));
  font-weight: 400;
  letter-spacing: .025em;
}

.th-p-bridal-dresses .nav a {
  font-family: var(--font-body, Manrope, sans-serif);
  font-size: .72rem;
  letter-spacing: .07em;
  text-transform: uppercase;
}

.th-p-bridal-dresses .cart {
  border: 1px solid var(--bd-line);
  border-radius: 999px;
}

.th-p-bridal-dresses .bd-vow-hero {
  position: relative;
  overflow: hidden;
  min-height: clamp(41rem, 56vw, 52rem);
  padding: clamp(1.1rem, 2.4vw, 2.5rem) clamp(1rem, 3.2vw, 4.5rem) clamp(1.1rem, 2.4vw, 2.5rem);
  background: var(--bd-paper);
  isolation: isolate;
}

.th-p-bridal-dresses .bd-hero-shell {
  position: relative;
  width: min(100%, 92rem);
  min-height: clamp(38.8rem, 51vw, 47rem);
  margin: 0 auto;
}

.th-p-bridal-dresses .bd-orbit {
  position: absolute;
  z-index: -1;
  border: 1px solid color-mix(in srgb, var(--bd-green) 28%, transparent);
  border-radius: 50%;
  pointer-events: none;
}

.th-p-bridal-dresses .bd-orbit-one {
  top: -22%;
  right: -6%;
  width: clamp(35rem, 69vw, 67rem);
  height: clamp(35rem, 69vw, 67rem);
}

.th-p-bridal-dresses .bd-orbit-two {
  bottom: -43%;
  left: 16%;
  width: clamp(27rem, 47vw, 47rem);
  height: clamp(27rem, 47vw, 47rem);
  border-color: color-mix(in srgb, var(--bd-moss) 78%, transparent);
}

.th-p-bridal-dresses .bd-hero-chapel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: clamp(13rem, 22vw, 21rem);
  padding: .6rem;
  background: var(--bd-ivory);
  box-shadow: 0 1.2rem 3rem rgba(45, 61, 52, .08);
}

.th-p-bridal-dresses .bd-hero-chapel::before {
  position: absolute;
  inset: .6rem;
  border: 1px solid rgba(255, 253, 248, .72);
  content: '';
  pointer-events: none;
}

.th-p-bridal-dresses .bd-hero-image {
  position: relative;
  width: 100%;
  height: 100%;
  margin: 0;
  overflow: hidden;
  border-radius: clamp(10rem, 19vw, 17rem) clamp(10rem, 19vw, 17rem) .15rem .15rem;
  background: #c8d0c7;
}

.th-p-bridal-dresses .bd-hero-image .hero-media,
.th-p-bridal-dresses .bd-hero-image .theme-empty-media {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 100%;
  object-fit: cover;
}

.th-p-bridal-dresses .bd-hero-image .hero-media {
  object-position: 56% center;
}

.th-p-bridal-dresses .bd-hero-image .theme-empty-media {
  background: linear-gradient(145deg, #dbe1d8, #f8f3e9 56%, #adbcae);
  color: var(--bd-green);
}

.th-p-bridal-dresses .bd-hero-image::after {
  position: absolute;
  inset: 0;
  background: linear-gradient(102deg, rgba(29, 43, 36, .14), transparent 43%, rgba(29, 43, 36, .04));
  content: '';
  pointer-events: none;
}

.th-p-bridal-dresses .bd-image-note {
  position: absolute;
  z-index: 2;
  top: clamp(1.25rem, 2.8vw, 2.5rem);
  right: clamp(1.1rem, 2.6vw, 2.4rem);
  max-width: 11ch;
  margin: 0;
  color: var(--bd-ivory);
  font-family: var(--font-body, Manrope, sans-serif);
  font-size: .61rem;
  font-weight: 700;
  letter-spacing: .17em;
  line-height: 1.5;
  text-align: right;
  text-transform: uppercase;
}

.th-p-bridal-dresses .bd-folio {
  position: absolute;
  z-index: 3;
  bottom: clamp(1.4rem, 5.3vw, 4.7rem);
  left: 0;
  width: min(48.5%, 33rem);
  min-width: 0;
  padding: clamp(2.25rem, 4vw, 4rem) clamp(1.5rem, 4.1vw, 4rem) clamp(2.1rem, 3.7vw, 3.5rem);
  border: 1px solid var(--bd-line);
  background: var(--bd-ivory);
  box-shadow: 0 1.5rem 3.5rem rgba(38, 53, 48, .09);
}

.th-p-bridal-dresses .bd-folio::before {
  position: absolute;
  top: .8rem;
  right: .8rem;
  bottom: .8rem;
  left: .8rem;
  border: 1px solid color-mix(in srgb, var(--bd-moss) 62%, transparent);
  content: '';
  pointer-events: none;
}

.th-p-bridal-dresses .bd-folio-topline {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: .65rem;
  padding-right: 2rem;
  color: var(--bd-green);
  font-family: var(--font-body, Manrope, sans-serif);
  font-size: .61rem;
  font-weight: 800;
  letter-spacing: .17em;
  line-height: 1.4;
  text-transform: uppercase;
}

.th-p-bridal-dresses .bd-folio-topline i {
  display: inline-block;
  width: 1.8rem;
  height: 1px;
  background: currentColor;
}

.th-p-bridal-dresses .bd-folio-mark {
  position: absolute;
  z-index: 1;
  top: clamp(1.3rem, 2.5vw, 2.1rem);
  right: clamp(1.25rem, 2.9vw, 2.8rem);
  color: var(--bd-moss);
  font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
  font-size: clamp(2.7rem, 4.2vw, 4.3rem);
  line-height: .7;
}

.th-p-bridal-dresses .bd-vow-hero .bd-copy {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-top: clamp(2.2rem, 4.3vw, 4rem);
}

.th-p-bridal-dresses .bd-vow-hero .bd-copy .eyebrow {
  margin: 0 0 .9rem;
  color: var(--bd-muted);
  font-family: var(--font-body, Manrope, sans-serif);
  font-size: .62rem;
  font-weight: 700;
  letter-spacing: .14em;
  line-height: 1.4;
  text-transform: uppercase;
}

.th-p-bridal-dresses .bd-vow-hero .bd-copy h1 {
  max-width: 10ch;
  margin: 0;
  color: var(--bd-ink);
  font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
  font-size: clamp(3.35rem, 5.25vw, 5.7rem);
  font-weight: 400;
  letter-spacing: -.052em;
  line-height: .88;
  overflow-wrap: anywhere;
}

.th-p-bridal-dresses .bd-vow-hero .bd-copy h1.long {
  max-width: 14ch;
  font-size: clamp(2.8rem, 4.3vw, 4.65rem);
  line-height: .93;
}

.th-p-bridal-dresses .bd-vow-hero .bd-copy .sub {
  max-width: 31ch;
  margin: 1.25rem 0 0;
  color: var(--bd-muted);
  font-family: var(--font-body, Manrope, sans-serif);
  font-size: clamp(.84rem, 1.03vw, .98rem);
  line-height: 1.55;
}

.th-p-bridal-dresses .bd-vow-hero .ctas,
.th-p-bridal-dresses .bd-vow-hero .hero-ctas {
  display: flex;
  flex-wrap: wrap;
  gap: .65rem;
  margin-top: 1.55rem;
}

.th-p-bridal-dresses .bd-vow-hero .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: .78rem 1.2rem;
  border: 1px solid var(--bd-green);
  border-radius: 999px;
  background: var(--bd-green);
  color: var(--bd-ivory);
  font-family: var(--font-body, Manrope, sans-serif);
  font-size: .62rem;
  font-weight: 800;
  letter-spacing: .14em;
  line-height: 1;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-bridal-dresses .bd-vow-hero .btn.ghost {
  background: transparent;
  color: var(--bd-green);
}

.th-p-bridal-dresses .bd-vow-hero .btn:hover,
.th-p-bridal-dresses .bd-vow-hero .btn:focus-visible {
  background: var(--bd-ink);
  border-color: var(--bd-ink);
  color: var(--bd-ivory);
}

.th-p-bridal-dresses .bd-folio-seal {
  position: absolute;
  right: clamp(1.15rem, 2.7vw, 2.5rem);
  bottom: clamp(1.2rem, 2.6vw, 2.35rem);
  z-index: 1;
  display: grid;
  width: 1.65rem;
  height: 1.65rem;
  place-items: center;
  border: 1px solid var(--bd-moss);
  border-radius: 50%;
}

.th-p-bridal-dresses .bd-folio-seal i {
  display: block;
  width: .4rem;
  height: .4rem;
  border-radius: 50%;
  background: var(--bd-moss);
}

.th-p-bridal-dresses .bd-side-whisper {
  position: absolute;
  bottom: clamp(1.2rem, 3vw, 2.7rem);
  left: calc(100% - clamp(1.9rem, 3.4vw, 3.4rem));
  width: 1em;
  margin: 0;
  color: var(--bd-muted);
  font-family: var(--font-body, Manrope, sans-serif);
  font-size: .57rem;
  font-weight: 700;
  letter-spacing: .18em;
  line-height: 1.45;
  text-transform: uppercase;
  writing-mode: vertical-rl;
}

.th-p-bridal-dresses .bd-motion-controls {
  position: absolute;
  z-index: 4;
  right: clamp(1.6rem, 4.1vw, 5.4rem);
  bottom: clamp(1.65rem, 4vw, 3.45rem);
}

.th-p-bridal-dresses .bd-motion-controls .motion-toggle {
  min-width: 44px;
  min-height: 44px;
  border: 1px solid rgba(255, 253, 248, .75);
  border-radius: 999px;
  background: rgba(38, 53, 48, .7);
  color: var(--bd-ivory);
  font-family: var(--font-body, Manrope, sans-serif);
  font-size: .61rem;
  font-weight: 700;
}

.th-p-bridal-dresses .bd-dress-room {
  display: grid;
  grid-template-columns: minmax(14rem, .78fr) minmax(0, 2.22fr);
  gap: clamp(2rem, 5.5vw, 6.5rem);
  align-items: center;
  padding: clamp(4rem, 8vw, 8.5rem) clamp(1rem, 5.3vw, 7.2rem);
  border-top: 1px solid var(--bd-line);
  border-bottom: 1px solid var(--bd-line);
  background: var(--bd-ivory);
}

.th-p-bridal-dresses .bd-room-intro {
  max-width: 20rem;
}

.th-p-bridal-dresses .bd-room-kicker {
  display: flex;
  align-items: center;
  gap: .65rem;
  margin: 0 0 1rem;
  color: var(--bd-green);
  font-family: var(--font-body, Manrope, sans-serif);
  font-size: .61rem;
  font-weight: 800;
  letter-spacing: .17em;
  line-height: 1.4;
  text-transform: uppercase;
}

.th-p-bridal-dresses .bd-room-kicker::before {
  width: 1.8rem;
  height: 1px;
  background: currentColor;
  content: '';
}

.th-p-bridal-dresses .bd-room-intro h2 {
  max-width: 10ch;
  margin: 0;
  color: var(--bd-ink);
  font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
  font-size: clamp(2.8rem, 4.1vw, 5rem);
  font-weight: 400;
  letter-spacing: -.045em;
  line-height: .9;
  overflow-wrap: anywhere;
}

.th-p-bridal-dresses .bd-room-intro > p:not(.bd-room-kicker) {
  max-width: 29ch;
  margin: 1.35rem 0 0;
  color: var(--bd-muted);
  font-family: var(--font-body, Manrope, sans-serif);
  font-size: .91rem;
  line-height: 1.6;
}

.th-p-bridal-dresses .bd-all-dresses {
  display: inline-flex;
  align-items: center;
  gap: .8rem;
  min-height: 44px;
  margin-top: 1.7rem;
  border-bottom: 1px solid currentColor;
  color: var(--bd-ink);
  font-family: var(--font-body, Manrope, sans-serif);
  font-size: .64rem;
  font-weight: 800;
  letter-spacing: .13em;
  line-height: 1;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-bridal-dresses .bd-all-dresses span {
  font-size: 1.15rem;
  line-height: 1;
}

.th-p-bridal-dresses .bd-all-dresses:hover,
.th-p-bridal-dresses .bd-all-dresses:focus-visible {
  color: var(--bd-green);
}

.th-p-bridal-dresses .bd-category-pages {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: stretch;
  min-width: 0;
  border-left: 1px solid var(--bd-line);
}

.th-p-bridal-dresses .bd-category-page {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: clamp(20rem, 30vw, 27rem);
  padding: .75rem;
  border-top: 1px solid var(--bd-line);
  border-right: 1px solid var(--bd-line);
  border-bottom: 1px solid var(--bd-line);
  color: var(--bd-ink);
  text-decoration: none;
}

.th-p-bridal-dresses .bd-category-page-2 {
  margin-top: clamp(2rem, 6vw, 5.5rem);
  margin-bottom: clamp(-2rem, -3vw, -2.5rem);
}

.th-p-bridal-dresses .bd-category-page-3 {
  margin-top: clamp(.8rem, 2.8vw, 2.6rem);
}

.th-p-bridal-dresses .bd-page-number {
  position: absolute;
  z-index: 2;
  top: 1.35rem;
  left: 1.35rem;
  color: var(--bd-ivory);
  font-family: var(--font-body, Manrope, sans-serif);
  font-size: .6rem;
  font-weight: 800;
  letter-spacing: .14em;
}

.th-p-bridal-dresses .bd-page-image {
  position: relative;
  display: block;
  flex: 1;
  min-height: 13rem;
  overflow: hidden;
  background: var(--bd-wash);
}

.th-p-bridal-dresses .bd-page-image::after {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(30, 48, 39, .22), transparent 42%);
  content: '';
  pointer-events: none;
}

.th-p-bridal-dresses .bd-page-image img,
.th-p-bridal-dresses .bd-category-fallback {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.th-p-bridal-dresses .bd-category-fallback-1 {
  background: radial-gradient(ellipse at 56% 42%, #fcfaf3 0 13%, transparent 13.4%), linear-gradient(138deg, #c5d1c3 0 45%, #718274 45% 48%, #eef1e9 48% 100%);
}

.th-p-bridal-dresses .bd-category-fallback-2 {
  background: linear-gradient(33deg, #6e8175 0 28%, #e7ebdf 28% 58%, #a9bb9d 58% 100%);
}

.th-p-bridal-dresses .bd-category-fallback-3 {
  background: radial-gradient(circle at 53% 39%, #fffdf7 0 18%, transparent 18.4%), linear-gradient(145deg, #e1e6d8, #92a38e);
}

.th-p-bridal-dresses .bd-page-copy {
  display: flex;
  flex-direction: column;
  gap: .25rem;
  padding: 1rem .55rem .45rem;
}

.th-p-bridal-dresses .bd-page-copy b {
  font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
  font-size: clamp(1.2rem, 1.55vw, 1.55rem);
  font-weight: 400;
  letter-spacing: -.02em;
  line-height: 1;
  overflow-wrap: anywhere;
}

.th-p-bridal-dresses .bd-page-copy small {
  color: var(--bd-muted);
  font-family: var(--font-body, Manrope, sans-serif);
  font-size: .59rem;
  font-weight: 800;
  letter-spacing: .14em;
  line-height: 1.4;
  text-transform: uppercase;
}

.th-p-bridal-dresses .bd-page-arrow {
  position: absolute;
  right: 1.25rem;
  bottom: 1.15rem;
  color: var(--bd-green);
  font-size: 1.15rem;
}

.th-p-bridal-dresses .bd-category-page:hover .bd-page-image,
.th-p-bridal-dresses .bd-category-page:focus-visible .bd-page-image {
  outline: 1px solid var(--bd-green);
  outline-offset: 4px;
}

.th-p-bridal-dresses .bd-current-room {
  align-items: stretch;
}

.th-p-bridal-dresses .bd-current-pieces {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  min-width: 0;
  border-top: 1px solid var(--bd-line);
  border-left: 1px solid var(--bd-line);
}

.th-p-bridal-dresses .bd-current-piece {
  min-width: 0;
  border-right: 1px solid var(--bd-line);
  border-bottom: 1px solid var(--bd-line);
}

.th-p-bridal-dresses .bd-current-piece .pc {
  display: block;
  height: 100%;
  padding: .8rem;
  color: var(--bd-ink);
  text-decoration: none;
}

.th-p-bridal-dresses .bd-current-piece .pc .im {
  position: relative;
  overflow: hidden;
  aspect-ratio: 3 / 4;
  background: var(--bd-wash);
}

.th-p-bridal-dresses .bd-current-piece .pc .im img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.th-p-bridal-dresses .bd-current-piece .pc .bd {
  padding: .9rem .45rem .4rem;
}

.th-p-bridal-dresses .bd-current-piece .pc h3 {
  font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
  font-size: 1.35rem;
  font-weight: 400;
  line-height: 1.05;
  overflow-wrap: anywhere;
}

.th-p-bridal-dresses .bd-current-piece .pc .pr {
  color: var(--bd-muted);
  font-family: var(--font-body, Manrope, sans-serif);
}

.th-p-bridal-dresses #shop,
.th-p-bridal-dresses .shop-section {
  padding: clamp(4.5rem, 8vw, 8rem) clamp(1rem, 5.3vw, 7.2rem);
  background: var(--bd-paper);
}

.th-p-bridal-dresses #shop .sec-h,
.th-p-bridal-dresses .shop-section > .sec-h {
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--bd-line);
}

.th-p-bridal-dresses #shop h2,
.th-p-bridal-dresses .shop-section > h2,
.th-p-bridal-dresses .shop-section .sec-h h2 {
  max-width: 13ch;
  color: var(--bd-ink);
  font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
  font-size: clamp(2.9rem, 4.5vw, 5.4rem);
  font-weight: 400;
  letter-spacing: -.045em;
  line-height: .9;
}

.th-p-bridal-dresses #shop .grid,
.th-p-bridal-dresses .shop-section .grid,
.th-p-bridal-dresses .product-grid {
  gap: 0;
  border-top: 1px solid var(--bd-line);
  border-left: 1px solid var(--bd-line);
}

.th-p-bridal-dresses #shop .pc,
.th-p-bridal-dresses .shop-section .pc,
.th-p-bridal-dresses .product-grid .pc {
  padding: clamp(.75rem, 1.65vw, 1.45rem);
  border-right: 1px solid var(--bd-line);
  border-bottom: 1px solid var(--bd-line);
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  color: var(--bd-ink);
  text-decoration: none;
}

.th-p-bridal-dresses #shop .pc .im,
.th-p-bridal-dresses .shop-section .pc .im,
.th-p-bridal-dresses .product-grid .pc .im {
  overflow: hidden;
  border-radius: 9rem 9rem .1rem .1rem;
  background: var(--bd-wash);
}

.th-p-bridal-dresses #shop .pc .im img,
.th-p-bridal-dresses .shop-section .pc .im img,
.th-p-bridal-dresses .product-grid .pc .im img {
  transition: filter .2s ease;
}

.th-p-bridal-dresses #shop .pc:hover .im img,
.th-p-bridal-dresses .shop-section .pc:hover .im img,
.th-p-bridal-dresses .product-grid .pc:hover .im img {
  filter: brightness(.96) saturate(.9);
}

.th-p-bridal-dresses #shop .pc .bd,
.th-p-bridal-dresses .shop-section .pc .bd,
.th-p-bridal-dresses .product-grid .pc .bd {
  padding-top: .9rem;
}

.th-p-bridal-dresses #shop .pc h3,
.th-p-bridal-dresses .shop-section .pc h3,
.th-p-bridal-dresses .product-grid .pc h3 {
  font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
  font-size: clamp(1.18rem, 1.5vw, 1.55rem);
  font-weight: 400;
  letter-spacing: -.02em;
  line-height: 1.05;
  overflow-wrap: anywhere;
}

.th-p-bridal-dresses #shop .pc .pr,
.th-p-bridal-dresses .shop-section .pc .pr,
.th-p-bridal-dresses .product-grid .pc .pr {
  color: var(--bd-muted);
  font-family: var(--font-body, Manrope, sans-serif);
  font-size: .76rem;
}

@media (max-width: 980px) {
  .th-p-bridal-dresses .bd-vow-hero {
    min-height: 39rem;
  }

  .th-p-bridal-dresses .bd-hero-shell {
    min-height: 36.8rem;
  }

  .th-p-bridal-dresses .bd-hero-chapel {
    left: 14rem;
  }

  .th-p-bridal-dresses .bd-folio {
    width: min(51%, 30rem);
  }

  .th-p-bridal-dresses .bd-dress-room {
    grid-template-columns: minmax(12.5rem, .72fr) minmax(0, 2.28fr);
    gap: 2.2rem;
  }

  .th-p-bridal-dresses .bd-category-page {
    min-height: 19rem;
  }
}

@media (max-width: 700px) {
  .th-p-bridal-dresses .hd .wrap {
    padding-inline: 1rem;
  }

  .th-p-bridal-dresses .brand {
    font-size: calc(1.22rem * var(--ts, 1));
  }

  .th-p-bridal-dresses .bd-vow-hero {
    min-height: 0;
    padding: 0 0 1.25rem;
    overflow: hidden;
  }

  .th-p-bridal-dresses .bd-hero-shell {
    display: flex;
    flex-direction: column;
    min-height: 0;
    width: 100%;
  }

  .th-p-bridal-dresses .bd-orbit-one {
    top: 8rem;
    right: -17rem;
    width: 38rem;
    height: 38rem;
  }

  .th-p-bridal-dresses .bd-orbit-two {
    bottom: 7rem;
    left: -13rem;
    width: 29rem;
    height: 29rem;
  }

  .th-p-bridal-dresses .bd-hero-chapel {
    position: relative;
    top: auto;
    right: auto;
    bottom: auto;
    left: auto;
    width: calc(100% - 1.25rem);
    height: auto;
    aspect-ratio: 4 / 5;
    margin-left: auto;
    padding: .45rem;
  }

  .th-p-bridal-dresses .bd-hero-image {
    border-radius: 10rem 10rem .1rem .1rem;
  }

  .th-p-bridal-dresses .bd-hero-image .hero-media {
    object-position: 61% center;
  }

  .th-p-bridal-dresses .bd-image-note {
    top: 1.35rem;
    right: 1.35rem;
  }

  .th-p-bridal-dresses .bd-folio {
    position: relative;
    bottom: auto;
    left: auto;
    width: calc(100% - 2.5rem);
    margin: -5.3rem auto 0 1.25rem;
    padding: 2.35rem 1.45rem 2.25rem;
  }

  .th-p-bridal-dresses .bd-vow-hero .bd-copy {
    margin-top: 2.35rem;
  }

  .th-p-bridal-dresses .bd-vow-hero .bd-copy h1 {
    max-width: 11ch;
    font-size: clamp(3.25rem, 14.5vw, 4.75rem);
  }

  .th-p-bridal-dresses .bd-vow-hero .bd-copy h1.long {
    max-width: 14ch;
    font-size: clamp(2.55rem, 11.3vw, 3.8rem);
  }

  .th-p-bridal-dresses .bd-side-whisper {
    display: none;
  }

  .th-p-bridal-dresses .bd-motion-controls {
    right: 1.15rem;
    bottom: auto;
    top: calc((100vw - 1.25rem) * 1.25 - 3.8rem);
  }

  .th-p-bridal-dresses .bd-dress-room {
    display: block;
    padding: 4.25rem 1.15rem;
  }

  .th-p-bridal-dresses .bd-room-intro {
    max-width: 27rem;
  }

  .th-p-bridal-dresses .bd-room-intro h2 {
    max-width: 12ch;
    font-size: clamp(2.75rem, 11vw, 4rem);
  }

  .th-p-bridal-dresses .bd-category-pages {
    margin-top: 2.5rem;
  }

  .th-p-bridal-dresses .bd-category-page {
    min-height: 16.8rem;
    padding: .55rem;
  }

  .th-p-bridal-dresses .bd-category-page-2 {
    margin-top: 2.3rem;
    margin-bottom: -1.2rem;
  }

  .th-p-bridal-dresses .bd-category-page-3 {
    margin-top: .8rem;
  }

  .th-p-bridal-dresses .bd-page-image {
    min-height: 10rem;
  }

  .th-p-bridal-dresses .bd-page-copy {
    padding: .75rem .25rem .25rem;
  }

  .th-p-bridal-dresses .bd-page-copy b {
    font-size: 1.05rem;
  }

  .th-p-bridal-dresses .bd-page-copy small {
    font-size: .5rem;
    letter-spacing: .08em;
  }

  .th-p-bridal-dresses .bd-page-number {
    top: 1rem;
    left: 1rem;
  }

  .th-p-bridal-dresses .bd-page-arrow {
    right: .9rem;
    bottom: .75rem;
  }

  .th-p-bridal-dresses .bd-current-pieces {
    margin-top: 2.5rem;
  }

  .th-p-bridal-dresses #shop,
  .th-p-bridal-dresses .shop-section {
    padding: 4.4rem 1.15rem;
  }
}

@media (max-width: 390px) {
  .th-p-bridal-dresses .bd-hero-chapel {
    width: calc(100% - .8rem);
  }

  .th-p-bridal-dresses .bd-folio {
    width: calc(100% - 1.6rem);
    margin-left: .8rem;
  }

  .th-p-bridal-dresses .bd-folio-topline {
    font-size: .55rem;
    letter-spacing: .12em;
  }

  .th-p-bridal-dresses .bd-vow-hero .ctas,
  .th-p-bridal-dresses .bd-vow-hero .hero-ctas {
    width: 100%;
  }

  .th-p-bridal-dresses .bd-vow-hero .btn {
    flex: 1 1 100%;
  }

  .th-p-bridal-dresses .bd-category-page {
    min-height: 14.8rem;
  }

  .th-p-bridal-dresses .bd-page-image {
    min-height: 8.8rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .th-p-bridal-dresses .bd-hero-image .hero-media {
    transform: none !important;
  }
}
`;

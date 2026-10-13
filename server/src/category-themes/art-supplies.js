import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-art-supplies',
  name: 'Pigment & Paper',
  for: 'artists building a studio one vivid mark at a time',
  vibe: 'tactile, sunlit, and joyfully unfinished',
  category: 'Art supplies',
  group: 'lifestyle',
  display: 'Fraunces',
  body: 'DM Sans',
  displayWeight: 600,
  tracking: '-.055em',
  colors: {
    bg: '#F4EFE5',
    surface: '#FFFDF8',
    ink: '#172940',
    muted: '#6E7171',
    line: '#CFC5B2',
    accent: '#D94B2B',
    onAccent: '#FFFDF8',
    panel: '#173B62',
    onPanel: '#F8F1E2',
    foot: '#172940',
    onFoot: '#F8F1E2',
    bar: '#E8DFD0',
    onBar: '#172940',
    badge: '#E3B74E',
    onBadge: '#172940',
  },
  header: 'stack',
  hero: 'collage',
  card: 'boxed',
  ratio: '4/5',
  rCard: 0,
  rBtn: 2,
  motion: 'pan',
  copy: {
    eyebrow: 'The working studio',
    collection: 'The first mark',
    cta: 'Shop the studio',
    title: 'Color begins with a mark.',
    subtitle: 'Tools, pigment and surfaces for following the next bright idea.',
  },
});

const validCategories = (ctx) => (Array.isArray(ctx.cats) ? ctx.cats : [])
  .filter((category) => category?.name)
  .slice(0, 4);

const validProducts = (ctx) => (Array.isArray(ctx.products) ? ctx.products : [])
  .filter(Boolean)
  .slice(0, 3);

const imageUrl = (category) => {
  if (typeof category?.image === 'string') return category.image;
  if (typeof category?.image?.url === 'string') return category.image.url;
  return '';
};

const itemLabel = (count) => {
  const value = Number(count);
  if (!Number.isFinite(value)) return 'Explore collection';
  return `${value} ${value === 1 ? 'item' : 'items'}`;
};

const initial = (value) => String(value || 'A').trim().charAt(0).toUpperCase() || 'A';

const categoryTape = (ctx, categories) => {
  if (!categories.length) return '';
  return `
    <nav class="art-hero-tape" aria-label="Browse art supply collections">
      <span class="art-tape-label">Open drawers</span>
      <div class="art-tape-links">
        ${categories.slice(0, 3).map((category, index) => `
          <a href="${ctx.esc(ctx.categoryLink(category.name))}">
            <i aria-hidden="true">${String(index + 1).padStart(2, '0')}</i>
            <span>${ctx.esc(category.name)}</span>
            <b aria-hidden="true">↗</b>
          </a>`).join('')}
      </div>
    </nav>`;
};

export function hero(ctx) {
  const categories = validCategories(ctx);

  return `
    <section class="hero category-hero art-studio-hero${ctx.heroClass || ''}"${ctx.heroAttrs || ''}>
      <div class="art-pasteboard">
        <div class="art-hero-media" aria-label="Studio image">
          ${ctx.media(0, { priority: true, lazy: false, decorative: false })}
        </div>
        <div class="art-corner-mark" aria-hidden="true"><span></span><span></span></div>
        <div class="art-paper-note">
          <div class="art-note-number" aria-hidden="true">01</div>
          ${ctx.copy('art-copy')}
        </div>
        <p class="art-side-caption" aria-hidden="true">made to make<br>something of it</p>
        ${categoryTape(ctx, categories)}
      </div>
      ${ctx.controls || ''}
    </section>`;
}

export function discovery(ctx) {
  const categories = validCategories(ctx);
  const products = validProducts(ctx);

  if (categories.length >= 2) {
    const cards = categories.map((category, index) => {
      const mediaUrl = imageUrl(category);
      const media = mediaUrl
        ? `<div class="art-collection-media"><img src="${ctx.esc(mediaUrl)}" alt="" loading="lazy" decoding="async"></div>`
        : `<div class="art-collection-media art-collection-blank" aria-hidden="true"><span>${ctx.esc(initial(category.name))}</span></div>`;
      return `
        <li class="art-collection-entry">
          <a href="${ctx.esc(ctx.categoryLink(category.name))}">
            <span class="art-entry-order">${String(index + 1).padStart(2, '0')}</span>
            ${media}
            <span class="art-entry-copy">
              <span class="art-entry-name">${ctx.esc(category.name)}</span>
              <span class="art-entry-count">${ctx.esc(itemLabel(category.count))}</span>
            </span>
            <span class="art-entry-arrow" aria-hidden="true">↗</span>
          </a>
        </li>`;
    }).join('');

    return `
      <section class="theme-discovery art-drawer-discovery" aria-labelledby="art-discovery-title">
        <header class="art-discovery-head">
          <div>
            <p class="art-kicker">START WITH A SURFACE</p>
            <h2 id="art-discovery-title">Find the tools<br><em>that pull you in.</em></h2>
          </div>
          <div class="art-discovery-intro">
            <p>Each drawer opens a different way to get something moving.</p>
            <a href="#shop">View all supplies <span aria-hidden="true">→</span></a>
          </div>
        </header>
        <ol class="art-collection-index">${cards}</ol>
      </section>`;
  }

  if (products.length) {
    return `
      <section class="theme-discovery art-drawer-discovery art-product-discovery" aria-labelledby="art-discovery-title">
        <header class="art-discovery-head">
          <div>
            <p class="art-kicker">FROM THE STUDIO</p>
            <h2 id="art-discovery-title">Ready for<br><em>the next mark.</em></h2>
          </div>
          <div class="art-discovery-intro">
            <p>Browse what is currently on the studio table.</p>
            <a href="#shop">View all supplies <span aria-hidden="true">→</span></a>
          </div>
        </header>
        <div class="art-product-row">${products.map((product) => ctx.productCard(product)).join('')}</div>
      </section>`;
  }

  return '';
}

export const css = `
.th-p-art-supplies {
  --art-paper: #F4EFE5;
  --art-white: #FFFDF8;
  --art-ink: #172940;
  --art-muted: #6E7171;
  --art-line: #CFC5B2;
  --art-red: #D94B2B;
  --art-blue: #173B62;
  --art-yellow: #E3B74E;
  background: var(--art-paper);
  color: var(--art-ink);
}

.th-p-art-supplies .site-header,
.th-p-art-supplies .store-header {
  background: color-mix(in srgb, var(--art-paper) 94%, transparent);
  border-color: color-mix(in srgb, var(--art-ink) 13%, transparent);
}

.th-p-art-supplies .site-header a,
.th-p-art-supplies .store-header a {
  color: var(--art-ink);
}

.th-p-art-supplies .art-studio-hero {
  background:
    linear-gradient(105deg, transparent 0 47%, rgba(23, 59, 98, .045) 47.1% 47.55%, transparent 47.65%),
    var(--art-paper);
  box-sizing: border-box;
  min-height: clamp(40rem, 52vw, 54rem);
  overflow: hidden;
  padding: clamp(1rem, 2.2vw, 2.25rem) clamp(1rem, 3.4vw, 4.5rem) clamp(2.5rem, 4.4vw, 4.75rem);
  position: relative;
}

.th-p-art-supplies .art-pasteboard {
  height: min(46vw, 47rem);
  min-height: 37rem;
  position: relative;
}

.th-p-art-supplies .art-hero-media {
  background: #D6C3A4;
  clip-path: polygon(2.1% 0, 100% 2.8%, 97.5% 100%, 0 96.4%);
  height: 100%;
  margin: 0 clamp(1rem, 7vw, 8.5rem) 0 clamp(5rem, 13vw, 15rem);
  overflow: hidden;
  position: relative;
}

.th-p-art-supplies .art-hero-media::after {
  background: linear-gradient(110deg, rgba(23, 41, 64, .18), transparent 36%, transparent 74%, rgba(23, 41, 64, .22));
  content: '';
  inset: 0;
  pointer-events: none;
  position: absolute;
  z-index: 1;
}

.th-p-art-supplies .art-hero-media .hero-media,
.th-p-art-supplies .art-hero-media .theme-empty-media {
  display: block;
  height: 100%;
  object-fit: cover;
  object-position: 61% center;
  width: 100%;
}

.th-p-art-supplies .art-hero-media .theme-empty-media {
  background:
    linear-gradient(135deg, transparent 0 40%, rgba(255, 253, 248, .65) 40.5% 44%, transparent 44.5%),
    radial-gradient(ellipse at 75% 21%, #D94B2B 0 10%, transparent 10.5%),
    radial-gradient(ellipse at 57% 70%, #173B62 0 13%, transparent 13.5%),
    linear-gradient(117deg, #E3B74E, #F2E2C9 50%, #B1BBC4);
  color: var(--art-ink);
}

.th-p-art-supplies .art-paper-note {
  background: var(--art-white);
  bottom: clamp(-1rem, -1.8vw, -1.75rem);
  box-shadow: .6rem .6rem 0 var(--art-red), 0 .8rem 2rem rgba(23, 41, 64, .15);
  box-sizing: border-box;
  left: 0;
  max-width: min(36rem, 46%);
  min-width: 19rem;
  padding: clamp(1.75rem, 3vw, 3.15rem) clamp(1.4rem, 3vw, 3.25rem) clamp(1.75rem, 3.3vw, 3.4rem);
  position: absolute;
  transform: rotate(-1.15deg);
  z-index: 3;
}

.th-p-art-supplies .art-note-number {
  color: var(--art-red);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .62rem;
  font-weight: 700;
  letter-spacing: .2em;
  margin-bottom: clamp(2.25rem, 5vw, 5rem);
}

.th-p-art-supplies .art-copy .eyebrow,
.th-p-art-supplies .art-kicker,
.th-p-art-supplies .art-tape-label,
.th-p-art-supplies .art-entry-order {
  color: var(--art-red);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .61rem;
  font-weight: 700;
  letter-spacing: .16em;
  line-height: 1.35;
  margin: 0 0 .8rem;
  text-transform: uppercase;
}

.th-p-art-supplies .art-copy h1 {
  color: var(--art-ink);
  font-family: var(--font-display, 'Fraunces', Georgia, serif);
  font-size: clamp(3.25rem, 5.25vw, 6.7rem);
  font-weight: 600;
  letter-spacing: -.07em;
  line-height: .83;
  margin: 0;
  max-width: 8.9ch;
  overflow-wrap: anywhere;
}

.th-p-art-supplies .art-copy h1.long {
  font-size: clamp(2.75rem, 4.3vw, 5.25rem);
  line-height: .86;
  max-width: 10.5ch;
}

.th-p-art-supplies .art-copy .sub {
  color: color-mix(in srgb, var(--art-ink) 75%, transparent);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: clamp(.88rem, 1.1vw, 1rem);
  line-height: 1.5;
  margin: 1.3rem 0 0;
  max-width: 26rem;
  overflow-wrap: anywhere;
}

.th-p-art-supplies .art-copy .ctas {
  display: flex;
  flex-wrap: wrap;
  gap: .65rem;
  margin-top: 1.4rem;
}

.th-p-art-supplies .art-copy .ctas a {
  align-items: center;
  background: var(--art-red);
  border: 1px solid var(--art-red);
  color: var(--art-white);
  display: inline-flex;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .68rem;
  font-weight: 700;
  justify-content: center;
  letter-spacing: .09em;
  min-height: 2.85rem;
  padding: 0 1.2rem;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-art-supplies .art-copy .ctas .ghost {
  background: transparent;
  border-color: var(--art-ink);
  color: var(--art-ink);
}

.th-p-art-supplies .art-copy .ctas a:hover,
.th-p-art-supplies .art-copy .ctas a:focus-visible {
  background: var(--art-blue);
  border-color: var(--art-blue);
  color: var(--art-white);
}

.th-p-art-supplies .art-corner-mark {
  bottom: 19%;
  display: grid;
  gap: .35rem;
  position: absolute;
  right: clamp(1.25rem, 4.6vw, 5.5rem);
  transform: rotate(13deg);
  z-index: 2;
}

.th-p-art-supplies .art-corner-mark span {
  background: var(--art-yellow);
  display: block;
  height: clamp(2.5rem, 4vw, 4.6rem);
  width: clamp(1.6rem, 2.4vw, 2.75rem);
}

.th-p-art-supplies .art-corner-mark span:last-child {
  background: var(--art-red);
  margin-left: clamp(1rem, 2vw, 2rem);
}

.th-p-art-supplies .art-side-caption {
  bottom: 7%;
  color: var(--art-ink);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .56rem;
  font-weight: 700;
  left: clamp(1rem, 3vw, 3.75rem);
  letter-spacing: .16em;
  line-height: 1.5;
  margin: 0;
  position: absolute;
  text-transform: uppercase;
  transform: rotate(-90deg) translateX(-100%);
  transform-origin: left top;
  z-index: 2;
}

.th-p-art-supplies .art-hero-tape {
  align-items: end;
  bottom: 0;
  display: grid;
  gap: .55rem;
  position: absolute;
  right: clamp(2rem, 6.3vw, 7.5rem);
  transform: rotate(1.4deg);
  width: min(18rem, 24%);
  z-index: 3;
}

.th-p-art-supplies .art-tape-label {
  color: var(--art-white);
  margin: 0 0 .15rem;
}

.th-p-art-supplies .art-tape-links {
  background: var(--art-blue);
  box-shadow: .35rem .35rem 0 rgba(23, 41, 64, .25);
}

.th-p-art-supplies .art-tape-links a {
  align-items: center;
  border-bottom: 1px solid rgba(255, 253, 248, .27);
  color: var(--art-white);
  display: grid;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .72rem;
  font-weight: 600;
  gap: .55rem;
  grid-template-columns: auto minmax(0, 1fr) auto;
  letter-spacing: -.01em;
  line-height: 1.2;
  min-height: 3rem;
  padding: .45rem .65rem;
  text-decoration: none;
}

.th-p-art-supplies .art-tape-links a:last-child {
  border-bottom: 0;
}

.th-p-art-supplies .art-tape-links i {
  color: var(--art-yellow);
  font-size: .5rem;
  font-style: normal;
  letter-spacing: .08em;
}

.th-p-art-supplies .art-tape-links span {
  min-width: 0;
  overflow-wrap: anywhere;
}

.th-p-art-supplies .art-tape-links b {
  color: var(--art-yellow);
  font-size: 1rem;
  font-weight: 400;
}

.th-p-art-supplies .art-studio-hero .motion-toggle {
  bottom: 1.5rem;
  left: auto;
  position: absolute;
  right: clamp(1rem, 3.4vw, 4.5rem);
}

.th-p-art-supplies .art-drawer-discovery {
  background: var(--art-white);
  box-sizing: border-box;
  padding: clamp(4rem, 7vw, 7.75rem) clamp(1.25rem, 5vw, 6.5rem) clamp(4rem, 6vw, 6.5rem);
}

.th-p-art-supplies .art-discovery-head {
  align-items: end;
  display: flex;
  gap: 2rem;
  justify-content: space-between;
  margin: 0 auto clamp(2.35rem, 4.3vw, 4.6rem);
  max-width: 92rem;
}

.th-p-art-supplies .art-kicker {
  color: var(--art-red);
  margin-bottom: .85rem;
}

.th-p-art-supplies .art-discovery-head h2 {
  color: var(--art-ink);
  font-family: var(--font-display, 'Fraunces', Georgia, serif);
  font-size: clamp(3.2rem, 5.7vw, 7rem);
  font-weight: 600;
  letter-spacing: -.075em;
  line-height: .8;
  margin: 0;
  max-width: 9ch;
  overflow-wrap: anywhere;
}

.th-p-art-supplies .art-discovery-head h2 em {
  color: var(--art-red);
  font-style: italic;
}

.th-p-art-supplies .art-discovery-intro {
  max-width: 18rem;
  padding-bottom: .45rem;
}

.th-p-art-supplies .art-discovery-intro p {
  color: var(--art-muted);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .92rem;
  line-height: 1.55;
  margin: 0 0 1rem;
}

.th-p-art-supplies .art-discovery-intro a {
  align-items: center;
  border-bottom: 1px solid var(--art-ink);
  color: var(--art-ink);
  display: inline-flex;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .64rem;
  font-weight: 700;
  gap: .5rem;
  letter-spacing: .1em;
  min-height: 2.75rem;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-art-supplies .art-collection-index {
  border-top: 1px solid var(--art-line);
  list-style: none;
  margin: 0 auto;
  max-width: 92rem;
  padding: 0;
}

.th-p-art-supplies .art-collection-entry {
  border-bottom: 1px solid var(--art-line);
  margin: 0;
}

.th-p-art-supplies .art-collection-entry a {
  align-items: center;
  color: var(--art-ink);
  display: grid;
  gap: clamp(.85rem, 2vw, 2.1rem);
  grid-template-columns: 2.5rem clamp(5rem, 9vw, 8.5rem) minmax(0, 1fr) auto;
  min-height: clamp(7.25rem, 12vw, 10rem);
  padding: .75rem 0;
  text-decoration: none;
}

.th-p-art-supplies .art-entry-order {
  align-self: start;
  margin: 1rem 0 0;
}

.th-p-art-supplies .art-collection-media {
  aspect-ratio: 1 / 1;
  background: #D8CCB8;
  overflow: hidden;
  position: relative;
}

.th-p-art-supplies .art-collection-media img {
  display: block;
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.th-p-art-supplies .art-collection-blank {
  align-items: center;
  background:
    linear-gradient(125deg, transparent 0 43%, rgba(255, 253, 248, .56) 43.2% 51%, transparent 51.2%),
    linear-gradient(45deg, var(--art-yellow), #EEC6A7 54%, #9CB7C0);
  display: grid;
  place-items: center;
}

.th-p-art-supplies .art-collection-blank span {
  color: var(--art-blue);
  font-family: var(--font-display, 'Fraunces', Georgia, serif);
  font-size: clamp(3rem, 5vw, 5rem);
  font-weight: 600;
  line-height: 1;
}

.th-p-art-supplies .art-entry-copy {
  display: grid;
  gap: .4rem;
  min-width: 0;
}

.th-p-art-supplies .art-entry-name {
  font-family: var(--font-display, 'Fraunces', Georgia, serif);
  font-size: clamp(1.65rem, 3vw, 3.25rem);
  font-weight: 600;
  letter-spacing: -.055em;
  line-height: .94;
  overflow-wrap: anywhere;
}

.th-p-art-supplies .art-entry-count {
  color: var(--art-muted);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .64rem;
  font-weight: 700;
  letter-spacing: .12em;
  text-transform: uppercase;
}

.th-p-art-supplies .art-entry-arrow {
  color: var(--art-red);
  font-family: var(--font-display, 'Fraunces', Georgia, serif);
  font-size: clamp(1.6rem, 2.4vw, 2.5rem);
  font-weight: 400;
}

.th-p-art-supplies .art-product-row {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0 auto;
  max-width: 92rem;
}

.th-p-art-supplies #shop {
  background: var(--art-paper);
}

.th-p-art-supplies #shop .section-title,
.th-p-art-supplies #shop h2 {
  font-family: var(--font-display, 'Fraunces', Georgia, serif);
  font-weight: 600;
  letter-spacing: -.05em;
}

.th-p-art-supplies #shop .product-card,
.th-p-art-supplies #shop .product-card img {
  border-radius: 0;
}

.th-p-art-supplies .art-hero-tape a:focus-visible,
.th-p-art-supplies .art-copy .ctas a:focus-visible,
.th-p-art-supplies .art-drawer-discovery a:focus-visible {
  outline: 3px solid var(--art-yellow);
  outline-offset: 4px;
}

@media (max-width: 920px) {
  .th-p-art-supplies .art-studio-hero {
    min-height: clamp(41rem, 79vw, 47rem);
  }

  .th-p-art-supplies .art-pasteboard {
    height: min(65vw, 41rem);
    min-height: 35rem;
  }

  .th-p-art-supplies .art-hero-media {
    margin-left: clamp(3rem, 9vw, 7rem);
  }

  .th-p-art-supplies .art-paper-note {
    max-width: min(33rem, 53%);
  }

  .th-p-art-supplies .art-copy h1 {
    font-size: clamp(3rem, 6.4vw, 5.2rem);
  }

  .th-p-art-supplies .art-hero-tape {
    right: clamp(1.2rem, 4vw, 3.5rem);
    width: min(16rem, 28%);
  }
}

@media (max-width: 680px) {
  .th-p-art-supplies .art-studio-hero {
    min-height: 0;
    overflow: visible;
    padding: 0 0 3.4rem;
  }

  .th-p-art-supplies .art-pasteboard {
    display: flex;
    flex-direction: column;
    height: auto;
    min-height: 0;
  }

  .th-p-art-supplies .art-hero-media {
    clip-path: polygon(0 0, 100% 1.4%, 98% 100%, 0 96%);
    height: clamp(23rem, 106vw, 31rem);
    margin: 0;
  }

  .th-p-art-supplies .art-hero-media .hero-media,
  .th-p-art-supplies .art-hero-media .theme-empty-media {
    object-position: 66% center;
  }

  .th-p-art-supplies .art-paper-note {
    align-self: start;
    bottom: auto;
    left: auto;
    margin: -4.5rem 1.1rem 0;
    max-width: none;
    min-width: 0;
    order: 2;
    padding: 1.65rem 1.2rem 1.5rem;
    position: relative;
    width: calc(100% - 2.2rem);
  }

  .th-p-art-supplies .art-note-number {
    margin-bottom: 1.85rem;
  }

  .th-p-art-supplies .art-copy h1 {
    font-size: clamp(3rem, 14vw, 5rem);
    max-width: 9.5ch;
  }

  .th-p-art-supplies .art-copy h1.long {
    font-size: clamp(2.45rem, 11vw, 4rem);
    max-width: 12ch;
  }

  .th-p-art-supplies .art-copy .ctas a {
    flex: 1 1 11rem;
  }

  .th-p-art-supplies .art-hero-tape {
    bottom: auto;
    margin: 1.5rem 1.1rem 0 auto;
    order: 3;
    position: relative;
    right: auto;
    transform: rotate(1deg);
    width: min(18rem, calc(100% - 2.2rem));
  }

  .th-p-art-supplies .art-side-caption,
  .th-p-art-supplies .art-corner-mark {
    display: none;
  }

  .th-p-art-supplies .art-studio-hero .motion-toggle {
    bottom: auto;
    right: 1rem;
    top: clamp(19.8rem, 91vw, 27.8rem);
  }

  .th-p-art-supplies .art-drawer-discovery {
    padding: 3.75rem 1.1rem 4rem;
  }

  .th-p-art-supplies .art-discovery-head {
    align-items: start;
    flex-direction: column;
    gap: 1.25rem;
    margin-bottom: 2.25rem;
  }

  .th-p-art-supplies .art-discovery-head h2 {
    font-size: clamp(3.05rem, 14vw, 4.8rem);
    max-width: 9.25ch;
  }

  .th-p-art-supplies .art-discovery-intro {
    max-width: 24rem;
  }

  .th-p-art-supplies .art-collection-entry a {
    gap: .75rem;
    grid-template-columns: 1.7rem 5.2rem minmax(0, 1fr) auto;
    min-height: 6.8rem;
  }

  .th-p-art-supplies .art-entry-order {
    font-size: .5rem;
  }

  .th-p-art-supplies .art-entry-name {
    font-size: clamp(1.55rem, 7.5vw, 2.35rem);
  }

  .th-p-art-supplies .art-product-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 390px) {
  .th-p-art-supplies .art-paper-note {
    margin-right: .8rem;
    margin-left: .8rem;
    width: calc(100% - 1.6rem);
  }

  .th-p-art-supplies .art-hero-tape {
    margin-right: .8rem;
    width: calc(100% - 1.6rem);
  }

  .th-p-art-supplies .art-collection-entry a {
    grid-template-columns: 1.4rem 4.5rem minmax(0, 1fr) auto;
  }

  .th-p-art-supplies .art-entry-count {
    font-size: .57rem;
  }

  .th-p-art-supplies .art-product-row {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .th-p-art-supplies .art-hero-media .hero-media {
    transform: none;
  }
}
`;

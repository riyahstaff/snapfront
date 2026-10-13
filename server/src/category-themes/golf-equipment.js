import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-golf-equipment',
  name: 'Fairway Index',
  for: 'Golf equipment storefronts',
  vibe: 'Dawn coursebook: measured, tactile, quietly competitive',
  category: 'Golf equipment',
  group: 'outdoor',
  display: 'DM Serif Display',
  body: 'DM Sans',
  displayWeight: 400,
  tracking: '-.055em',
  colors: {
    bg: '#E9E2D2',
    surface: '#F7F3EA',
    ink: '#193D32',
    muted: '#657469',
    line: '#BFC1AE',
    accent: '#A84A36',
    onAccent: '#FFF9EF',
    panel: '#193D32',
    onPanel: '#F4EBD9',
    foot: '#112A23',
    onFoot: '#E9E2D2',
    bar: '#D3DDCE',
    onBar: '#193D32',
    badge: '#C7D4B5',
    onBadge: '#193D32',
  },
  header: 'stack',
  hero: 'spotlight',
  card: 'boxed',
  ratio: '4/5',
  rCard: 0,
  rBtn: 0,
  motion: 'pan',
  copy: {
    eyebrow: 'The fairway edit',
    collection: 'Opening line',
    cta: 'Play the edit',
    title: 'Find your cleanest line.',
    subtitle: 'A considered collection for the walk, the strike and the green.',
  },
});

const countLabel = (count) => `${count} ${count === 1 ? 'piece' : 'pieces'}`;

export function hero(ctx) {
  const itemCount = ctx.products.length;
  const inventoryNote = itemCount ? `${countLabel(itemCount)} in the current edit` : 'A considered course edit';
  const eyebrow = ctx.eyebrow ? `<p class="eyebrow">${ctx.esc(ctx.eyebrow)}</p>` : '';
  const subtitle = ctx.sub ? `<p class="sub">${ctx.esc(ctx.sub)}</p>` : '';

  return `
    <section class="hero category-hero p-golf-hero${ctx.heroClass}"${ctx.heroAttrs}>
      <div class="p-golf-horizon" aria-hidden="true"></div>
      <div class="p-golf-hero-frame">
        ${ctx.media(0, { priority: true, lazy: false, decorative: true })}
      </div>
      <div class="p-golf-hero-grain" aria-hidden="true"></div>
      <div class="p-golf-hero-spine" aria-hidden="true">
        <span class="p-golf-spine-mark">01</span>
        <i></i>
        <span class="p-golf-spine-mark">18</span>
      </div>
      <div class="p-golf-flag" aria-hidden="true"><i></i><b></b></div>
      <div class="p-golf-hero-copyboard">
        <div class="txt p-golf-copy">
          ${eyebrow}
          <h1>${ctx.esc(ctx.head)}</h1>
          ${subtitle}
          <div class="ctas"><a class="btn" href="#shop">${ctx.esc(ctx.ctaLabel)}</a></div>
        </div>
        <p class="p-golf-inventory-note">${ctx.esc(inventoryNote)}</p>
      </div>
      ${ctx.controls}
    </section>
  `;
}

export function discovery(ctx) {
  const cats = ctx.cats.filter((category) => category && category.name);
  const products = ctx.products.slice(0, 4);

  if (cats.length >= 2) {
    const courseCards = cats.slice(0, 4).map((category, index) => {
      const image = category.image
        ? `<img src="${ctx.esc(category.image)}" alt="" loading="lazy" decoding="async">`
        : `<span class="p-golf-category-fallback" aria-hidden="true"></span>`;
      const count = Number.isFinite(category.count) ? countLabel(category.count) : 'Explore the edit';
      const numeral = String(index + 1).padStart(2, '0');
      return `
        <a class="p-golf-course-card${index === 0 ? ' is-lead' : ''}" href="${ctx.categoryLink(category.name)}">
          <span class="p-golf-course-number">${numeral}</span>
          <span class="p-golf-course-image">${image}</span>
          <span class="p-golf-course-copy">
            <strong>${ctx.esc(category.name)}</strong>
            <small>${ctx.esc(count)}</small>
          </span>
          <span class="p-golf-course-arrow" aria-hidden="true">↗</span>
        </a>
      `;
    }).join('');

    return `
      <section class="theme-discovery p-golf-discovery" aria-labelledby="p-golf-discovery-title">
        <div class="p-golf-discovery-head">
          <p class="p-golf-section-kicker">Read the course</p>
          <h2 id="p-golf-discovery-title">Choose a starting line.</h2>
          <p>Move through the live collection by the part of the game you want to shape.</p>
        </div>
        <div class="p-golf-course-grid">${courseCards}</div>
      </section>
    `;
  }

  if (products.length) {
    return `
      <section class="theme-discovery p-golf-discovery p-golf-product-discovery" aria-labelledby="p-golf-product-title">
        <div class="p-golf-discovery-head">
          <p class="p-golf-section-kicker">The opening four</p>
          <h2 id="p-golf-product-title">A useful place to begin.</h2>
        </div>
        <div class="p-golf-product-row">${products.map((product) => ctx.productCard(product)).join('')}</div>
      </section>
    `;
  }

  return '';
}

export const css = `
.th-p-golf-equipment {
  --p-golf-paper: #E9E2D2;
  --p-golf-ivory: #F7F3EA;
  --p-golf-forest: #193D32;
  --p-golf-deep: #112A23;
  --p-golf-moss: #657469;
  --p-golf-line: #BFC1AE;
  --p-golf-flag-red: #A84A36;
  --p-golf-sage: #D3DDCE;
  background: var(--p-golf-paper);
  color: var(--p-golf-forest);
  overflow: hidden;
}

.th-p-golf-equipment .category-hero {
  position: relative;
  isolation: isolate;
  min-height: clamp(41rem, 59vw, 54rem);
  overflow: hidden;
  background: var(--p-golf-deep);
}

.th-p-golf-equipment .p-golf-horizon {
  position: absolute;
  inset: 0;
  z-index: -4;
  background:
    linear-gradient(90deg, rgba(17, 42, 35, .96) 0 9%, transparent 9% 91%, rgba(17, 42, 35, .78) 91% 100%),
    linear-gradient(180deg, #D7D9CB 0%, #F1EAD9 49%, #99AC93 49.2%, #314E41 100%);
}

.th-p-golf-equipment .p-golf-hero-frame {
  position: absolute;
  z-index: -3;
  top: clamp(2.5rem, 5vw, 5.2rem);
  right: clamp(1rem, 4.5vw, 5rem);
  bottom: clamp(9.5rem, 12vw, 12.8rem);
  left: clamp(1rem, 7.4vw, 8.6rem);
  overflow: hidden;
  clip-path: polygon(0 7%, 3.2% 0, 96.8% 0, 100% 7%, 100% 92%, 96.8% 100%, 3.2% 100%, 0 92%);
  background: #6D8372;
}

.th-p-golf-equipment .p-golf-hero-frame::after {
  position: absolute;
  inset: 0;
  content: '';
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(17, 42, 35, .02) 38%, rgba(17, 42, 35, .42) 100%),
    linear-gradient(90deg, rgba(17, 42, 35, .45) 0%, transparent 31%, transparent 65%, rgba(17, 42, 35, .18) 100%);
}

.th-p-golf-equipment .p-golf-hero-frame .hero-media,
.th-p-golf-equipment .p-golf-hero-frame .theme-empty-media {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 100%;
  object-fit: cover;
  object-position: center;
}

.th-p-golf-equipment .p-golf-hero-frame .theme-empty-media {
  background:
    radial-gradient(circle at 76% 57%, #EDE4CF 0 1.3%, transparent 1.5%),
    linear-gradient(164deg, transparent 0 44%, rgba(255, 255, 255, .22) 44.2% 44.5%, transparent 44.7%),
    linear-gradient(145deg, #E7DDC7 0 37%, #94A58A 37.3% 63%, #25483A 63.3% 100%);
}

.th-p-golf-equipment .p-golf-hero-frame .theme-empty-media span {
  display: none;
}

.th-p-golf-equipment .p-golf-hero-grain {
  position: absolute;
  z-index: -2;
  right: 4.8%;
  bottom: 7.5rem;
  width: clamp(11rem, 21vw, 21rem);
  aspect-ratio: 1;
  border: 1px solid rgba(247, 243, 234, .55);
  border-radius: 50%;
  box-shadow: 0 0 0 1.3rem rgba(247, 243, 234, .12), 0 0 0 2.6rem rgba(247, 243, 234, .06);
  opacity: .72;
}

.th-p-golf-equipment .p-golf-hero-spine {
  position: absolute;
  z-index: 1;
  top: clamp(5rem, 11vw, 10rem);
  bottom: clamp(12rem, 16vw, 14rem);
  left: clamp(1.4rem, 4.1vw, 4.9rem);
  display: flex;
  width: 1.75rem;
  align-items: center;
  flex-direction: column;
  justify-content: space-between;
  color: var(--p-golf-ivory);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .6rem;
  font-weight: 700;
  letter-spacing: .16em;
}

.th-p-golf-equipment .p-golf-hero-spine i {
  display: block;
  width: 1px;
  height: 100%;
  margin: .75rem 0;
  background: rgba(247, 243, 234, .8);
}

.th-p-golf-equipment .p-golf-spine-mark {
  writing-mode: vertical-rl;
}

.th-p-golf-equipment .p-golf-flag {
  position: absolute;
  z-index: 2;
  top: clamp(3rem, 6.3vw, 6rem);
  right: clamp(2rem, 9vw, 11rem);
  width: 6.3rem;
  height: 7.8rem;
  pointer-events: none;
}

.th-p-golf-equipment .p-golf-flag i {
  position: absolute;
  bottom: 0;
  left: 2.4rem;
  width: 1px;
  height: 100%;
  background: var(--p-golf-ivory);
}

.th-p-golf-equipment .p-golf-flag b {
  position: absolute;
  top: 0;
  left: 2.4rem;
  width: 3.7rem;
  height: 2.55rem;
  background: var(--p-golf-flag-red);
  clip-path: polygon(0 0, 100% 50%, 0 100%);
}

.th-p-golf-equipment .p-golf-hero-copyboard {
  position: absolute;
  z-index: 3;
  right: clamp(1rem, 4.5vw, 5rem);
  bottom: 0;
  left: clamp(1rem, 7.4vw, 8.6rem);
  display: grid;
  min-height: clamp(13.5rem, 18vw, 16rem);
  padding: clamp(1.5rem, 3vw, 3rem) clamp(1.5rem, 4.4vw, 4.7rem);
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 1.5rem 3rem;
  background: var(--p-golf-ivory);
  clip-path: polygon(0 0, 100% 0, 100% 87%, 97.5% 100%, 0 100%);
}

.th-p-golf-equipment .p-golf-copy {
  max-width: 54rem;
}

.th-p-golf-equipment .p-golf-copy .eyebrow,
.th-p-golf-equipment .p-golf-section-kicker {
  margin: 0 0 .8rem;
  color: var(--p-golf-flag-red);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .64rem;
  font-weight: 700;
  letter-spacing: .2em;
  line-height: 1.35;
  text-transform: uppercase;
}

.th-p-golf-equipment .p-golf-copy h1 {
  max-width: 18ch;
  margin: 0;
  color: var(--p-golf-forest);
  font-family: var(--display, 'DM Serif Display', serif);
  font-size: clamp(3rem, 6.7vw, 7.4rem);
  font-weight: 400;
  letter-spacing: var(--tracking, -.055em);
  line-height: .84;
  overflow-wrap: anywhere;
}

.th-p-golf-equipment .p-golf-copy .sub {
  max-width: 37rem;
  margin: 1.15rem 0 0;
  color: var(--p-golf-moss);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: clamp(.84rem, 1.05vw, 1rem);
  font-weight: 500;
  letter-spacing: .035em;
  line-height: 1.52;
  overflow-wrap: anywhere;
}

.th-p-golf-equipment .p-golf-copy .ctas {
  display: flex;
  margin-top: 1.4rem;
  flex-wrap: wrap;
  gap: .75rem;
}

.th-p-golf-equipment .p-golf-copy .ctas .btn {
  display: inline-flex;
  min-height: 3rem;
  padding: .78rem 1.2rem;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--p-golf-forest);
  background: var(--p-golf-forest);
  color: var(--p-golf-ivory);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .68rem;
  font-weight: 700;
  letter-spacing: .14em;
  line-height: 1.1;
  text-align: center;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-golf-equipment .p-golf-copy .ctas .btn:hover,
.th-p-golf-equipment .p-golf-copy .ctas .btn:focus-visible {
  background: var(--p-golf-flag-red);
  border-color: var(--p-golf-flag-red);
  color: var(--p-golf-ivory);
  outline: 2px solid var(--p-golf-flag-red);
  outline-offset: 3px;
}

.th-p-golf-equipment .p-golf-inventory-note {
  max-width: 12ch;
  margin: 0 0 .25rem;
  color: var(--p-golf-moss);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .68rem;
  font-weight: 700;
  letter-spacing: .13em;
  line-height: 1.45;
  text-transform: uppercase;
}

.th-p-golf-equipment .category-hero .motion-toggle {
  position: absolute;
  z-index: 4;
  top: 1rem;
  right: 1rem;
  min-width: 9rem;
  min-height: 2.75rem;
  padding: .65rem .9rem;
  border: 1px solid rgba(247, 243, 234, .72);
  background: rgba(17, 42, 35, .9);
  color: var(--p-golf-ivory);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .65rem;
  font-weight: 700;
  letter-spacing: .11em;
  text-transform: uppercase;
}

.th-p-golf-equipment .category-hero .motion-toggle:hover,
.th-p-golf-equipment .category-hero .motion-toggle:focus-visible {
  border-color: var(--p-golf-ivory);
  background: var(--p-golf-flag-red);
  outline: 2px solid var(--p-golf-ivory);
  outline-offset: 2px;
}

.th-p-golf-equipment .p-golf-discovery {
  position: relative;
  padding: clamp(4.5rem, 9vw, 8rem) clamp(1.15rem, 5vw, 6rem) clamp(5rem, 9vw, 8rem);
  background:
    linear-gradient(90deg, transparent 0 5%, rgba(25, 61, 50, .08) 5% calc(5% + 1px), transparent calc(5% + 1px) 95%, rgba(25, 61, 50, .08) 95% calc(95% + 1px), transparent calc(95% + 1px)),
    var(--p-golf-paper);
}

.th-p-golf-equipment .p-golf-discovery-head {
  display: grid;
  max-width: 75rem;
  margin: 0 auto clamp(2rem, 4vw, 3.75rem);
  grid-template-columns: minmax(0, 1.05fr) minmax(14rem, .58fr);
  column-gap: clamp(2rem, 6vw, 7rem);
  align-items: end;
}

.th-p-golf-equipment .p-golf-discovery-head .p-golf-section-kicker {
  grid-column: 1 / -1;
}

.th-p-golf-equipment .p-golf-discovery-head h2 {
  max-width: 13ch;
  margin: 0;
  color: var(--p-golf-forest);
  font-family: var(--display, 'DM Serif Display', serif);
  font-size: clamp(2.3rem, 4.25vw, 4.9rem);
  font-weight: 400;
  letter-spacing: var(--tracking, -.055em);
  line-height: .92;
  overflow-wrap: anywhere;
}

.th-p-golf-equipment .p-golf-discovery-head > p:last-child {
  max-width: 29rem;
  margin: 0 0 .25rem;
  color: var(--p-golf-moss);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .94rem;
  line-height: 1.65;
}

.th-p-golf-equipment .p-golf-course-grid {
  display: grid;
  max-width: 75rem;
  margin: 0 auto;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1px;
  background: var(--p-golf-line);
  border: 1px solid var(--p-golf-line);
}

.th-p-golf-equipment .p-golf-course-card {
  position: relative;
  display: grid;
  min-height: clamp(21rem, 29vw, 27rem);
  padding: 1.15rem;
  grid-template-rows: auto 1fr auto;
  overflow: hidden;
  background: var(--p-golf-ivory);
  color: var(--p-golf-forest);
  text-decoration: none;
}

.th-p-golf-equipment .p-golf-course-card.is-lead {
  grid-column: span 2;
}

.th-p-golf-equipment .p-golf-course-card::after {
  position: absolute;
  z-index: 1;
  right: 0;
  bottom: 0;
  left: 0;
  height: 55%;
  content: '';
  pointer-events: none;
  background: linear-gradient(180deg, transparent, rgba(17, 42, 35, .79));
}

.th-p-golf-equipment .p-golf-course-number {
  position: relative;
  z-index: 2;
  color: var(--p-golf-forest);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .67rem;
  font-weight: 700;
  letter-spacing: .18em;
}

.th-p-golf-equipment .p-golf-course-image,
.th-p-golf-equipment .p-golf-course-image img,
.th-p-golf-equipment .p-golf-category-fallback {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}

.th-p-golf-equipment .p-golf-course-image {
  overflow: hidden;
  background: #A4B398;
}

.th-p-golf-equipment .p-golf-course-image img {
  object-fit: cover;
  filter: saturate(.75) contrast(.95);
}

.th-p-golf-equipment .p-golf-category-fallback {
  background:
    radial-gradient(circle at 76% 24%, rgba(247, 243, 234, .75) 0 1.5%, transparent 1.7%),
    linear-gradient(155deg, #E7DDC7 0 42%, #94A58A 42.3% 67%, #25483A 67.3% 100%);
}

.th-p-golf-equipment .p-golf-course-copy {
  position: relative;
  z-index: 2;
  display: flex;
  align-self: end;
  padding-right: 2.5rem;
  flex-direction: column;
  gap: .35rem;
  color: var(--p-golf-ivory);
}

.th-p-golf-equipment .p-golf-course-copy strong {
  font-family: var(--display, 'DM Serif Display', serif);
  font-size: clamp(1.45rem, 2.25vw, 2.35rem);
  font-weight: 400;
  letter-spacing: -.035em;
  line-height: .98;
  overflow-wrap: anywhere;
}

.th-p-golf-equipment .p-golf-course-copy small {
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .64rem;
  font-weight: 700;
  letter-spacing: .14em;
  line-height: 1.4;
  text-transform: uppercase;
}

.th-p-golf-equipment .p-golf-course-arrow {
  position: absolute;
  z-index: 2;
  right: 1.1rem;
  bottom: 1.05rem;
  display: grid;
  width: 2.65rem;
  height: 2.65rem;
  place-items: center;
  border: 1px solid rgba(247, 243, 234, .8);
  color: var(--p-golf-ivory);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: 1.15rem;
  line-height: 1;
}

.th-p-golf-equipment .p-golf-course-card:hover .p-golf-course-image img,
.th-p-golf-equipment .p-golf-course-card:focus-visible .p-golf-course-image img {
  filter: saturate(.9) contrast(1.02);
}

.th-p-golf-equipment .p-golf-course-card:focus-visible {
  z-index: 3;
  outline: 3px solid var(--p-golf-flag-red);
  outline-offset: -3px;
}

.th-p-golf-equipment .p-golf-product-discovery .p-golf-discovery-head {
  grid-template-columns: 1fr;
}

.th-p-golf-equipment .p-golf-product-row {
  display: grid;
  max-width: 75rem;
  margin: 0 auto;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.th-p-golf-equipment .p-golf-product-row .product-card {
  min-width: 0;
  border: 1px solid var(--p-golf-line);
  background: var(--p-golf-ivory);
  border-radius: 0;
  box-shadow: none;
}

.th-p-golf-equipment .p-golf-product-row .product-card a {
  color: var(--p-golf-forest);
}

.th-p-golf-equipment .p-golf-product-row .product-card img {
  border-radius: 0;
}

.th-p-golf-equipment #shop {
  position: relative;
  padding-top: clamp(2.5rem, 4vw, 4.5rem);
}

.th-p-golf-equipment #shop::before {
  position: absolute;
  top: 0;
  right: 5%;
  left: 5%;
  height: 1px;
  content: '';
  background: var(--p-golf-line);
}

.th-p-golf-equipment #shop .section-title,
.th-p-golf-equipment #shop h2 {
  color: var(--p-golf-forest);
  font-family: var(--display, 'DM Serif Display', serif);
  letter-spacing: var(--tracking, -.055em);
}

@media (max-width: 760px) {
  .th-p-golf-equipment .category-hero {
    min-height: 39.5rem;
  }

  .th-p-golf-equipment .p-golf-hero-frame {
    top: 1.1rem;
    right: 1rem;
    bottom: 13.2rem;
    left: 1rem;
  }

  .th-p-golf-equipment .p-golf-hero-grain {
    right: 2.1rem;
    bottom: 14.5rem;
    width: 8.5rem;
  }

  .th-p-golf-equipment .p-golf-hero-spine {
    top: 2.5rem;
    bottom: 14.5rem;
    left: 1.45rem;
    font-size: .53rem;
  }

  .th-p-golf-equipment .p-golf-flag {
    top: 2.15rem;
    right: 1.6rem;
    transform: scale(.72);
    transform-origin: top right;
  }

  .th-p-golf-equipment .p-golf-hero-copyboard {
    right: 1rem;
    bottom: 0;
    left: 1rem;
    min-height: 14rem;
    padding: 1.45rem 1.3rem 1.25rem;
    grid-template-columns: 1fr;
    gap: .65rem;
  }

  .th-p-golf-equipment .p-golf-copy h1 {
    max-width: 13ch;
    font-size: clamp(2.65rem, 12.6vw, 4.8rem);
  }

  .th-p-golf-equipment .p-golf-copy .sub {
    margin-top: .8rem;
    font-size: .8rem;
    line-height: 1.48;
  }

  .th-p-golf-equipment .p-golf-copy .ctas {
    margin-top: 1rem;
  }

  .th-p-golf-equipment .p-golf-inventory-note {
    max-width: none;
    margin: 0;
    font-size: .57rem;
  }

  .th-p-golf-equipment .category-hero .motion-toggle {
    top: 1rem;
    right: 1rem;
    min-width: 8.5rem;
    width: auto;
    overflow: visible;
    color: var(--p-golf-ivory);
    white-space: normal;
  }

  .th-p-golf-equipment .p-golf-discovery {
    padding: 4.2rem 1rem 4.8rem;
    background: var(--p-golf-paper);
  }

  .th-p-golf-equipment .p-golf-discovery-head {
    margin-bottom: 2rem;
    grid-template-columns: 1fr;
    row-gap: 1rem;
  }

  .th-p-golf-equipment .p-golf-discovery-head h2 {
    max-width: 12ch;
    font-size: clamp(2.3rem, 11vw, 3.8rem);
  }

  .th-p-golf-equipment .p-golf-discovery-head > p:last-child {
    margin: 0;
    font-size: .88rem;
  }

  .th-p-golf-equipment .p-golf-course-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .th-p-golf-equipment .p-golf-course-card,
  .th-p-golf-equipment .p-golf-course-card.is-lead {
    min-height: 16.5rem;
    grid-column: span 1;
  }

  .th-p-golf-equipment .p-golf-course-card.is-lead {
    grid-column: span 2;
    min-height: 19rem;
  }

  .th-p-golf-equipment .p-golf-course-card {
    padding: .9rem;
  }

  .th-p-golf-equipment .p-golf-course-copy {
    padding-right: 0;
  }

  .th-p-golf-equipment .p-golf-course-copy strong {
    font-size: clamp(1.25rem, 6vw, 1.8rem);
  }

  .th-p-golf-equipment .p-golf-course-arrow {
    top: .9rem;
    right: .9rem;
    bottom: auto;
    width: 2.35rem;
    height: 2.35rem;
  }

  .th-p-golf-equipment .p-golf-product-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: .7rem;
  }

  .th-p-golf-equipment #shop {
    padding-top: 2.5rem;
  }
}

@media (max-width: 380px) {
  .th-p-golf-equipment .category-hero {
    min-height: 40.5rem;
  }

  .th-p-golf-equipment .p-golf-hero-copyboard {
    min-height: 15.2rem;
  }

  .th-p-golf-equipment .p-golf-copy h1 {
    font-size: 2.55rem;
  }

  .th-p-golf-equipment .p-golf-course-card,
  .th-p-golf-equipment .p-golf-course-card.is-lead {
    min-height: 15rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .th-p-golf-equipment .p-golf-hero-frame .hero-media {
    animation: none !important;
    transform: none !important;
  }
}
`;

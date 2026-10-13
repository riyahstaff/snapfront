import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-skincare',
  name: 'PELAGOIR',
  for: 'slow, ingredient-conscious skincare rituals',
  vibe: 'sun-warmed limestone, shallow water, and quiet apothecary forms',
  category: 'Marine botanical skincare',
  group: 'beauty',
  display: 'DM Serif Display',
  body: 'DM Sans',
  displayWeight: 400,
  tracking: '-.045em',
  colors: {
    bg: '#F4F0E7',
    surface: '#FEFCF6',
    ink: '#20251D',
    muted: '#6A6C61',
    line: '#D6D0C3',
    accent: '#31433A',
    onAccent: '#FAF7EF',
    panel: '#E8E3D7',
    onPanel: '#20251D',
    foot: '#26352E',
    onFoot: '#F7F3E9',
    bar: '#F9F6EE',
    onBar: '#20251D',
    badge: '#DCE4D5',
    onBadge: '#203128'
  },
  header: 'split',
  hero: 'editorial',
  card: 'minimal',
  ratio: '3/4',
  rCard: 2,
  rBtn: 0,
  motion: 'drift',
  copy: {
    eyebrow: 'The daily ritual',
    collection: 'Ritual essentials',
    cta: 'Discover the ritual',
    title: 'A slower kind of radiance.',
    subtitle: 'A quiet edit for the moments you keep for yourself.'
  }
});

export function hero(ctx) {
  return `
    <section class="hero category-hero p-skincare-mineral-hero${ctx.heroClass}"${ctx.heroAttrs}>
      <div class="p-skincare-hero-photo">
        ${ctx.media(0, { priority: true, lazy: false, decorative: false })}
      </div>
      <div class="p-skincare-hero-matte" aria-hidden="true"></div>
      <div class="p-skincare-hero-caustic" aria-hidden="true"></div>
      <div class="p-skincare-hero-copy-wrap">
        ${ctx.copy('p-skincare-copy')}
        <div class="p-skincare-hero-rule" aria-hidden="true"></div>
        <p class="p-skincare-hero-note">A considered pause for the skin.</p>
      </div>
      <div class="p-skincare-hero-index" aria-hidden="true">
        <span>01</span>
        <span>Ritual study</span>
      </div>
      ${ctx.controls}
    </section>
  `;
}

export function discovery(ctx) {
  const categories = (ctx.cats || []).filter((category) => category && category.name).slice(0, 3);
  const products = (ctx.products || []).slice(0, 3);

  if (categories.length >= 2) {
    const ritualCards = categories.map((category, index) => {
      const hasPhoto = index < 2 && Boolean(ctx.pics && ctx.pics[index + 1]);
      const visual = hasPhoto
        ? `<div class="p-skincare-ritual-media">${ctx.media(index + 1, { lazy: true, decorative: true })}</div>`
        : `<div class="p-skincare-ritual-still p-skincare-ritual-still-${index + 1}" aria-hidden="true"><span></span></div>`;
      const count = Number(category.count) || 0;
      const itemLabel = count === 1 ? 'piece' : 'pieces';

      return `
        <article class="p-skincare-ritual-card">
          <p class="p-skincare-ritual-number">0${index + 1}</p>
          ${visual}
          <div class="p-skincare-ritual-card-copy">
            <h3><a href="${ctx.categoryLink(category.name)}">${ctx.esc(category.name)}</a></h3>
            <p>${ctx.esc(String(count))} ${itemLabel} to explore</p>
            <a class="p-skincare-ritual-link" href="${ctx.categoryLink(category.name)}">Explore <span aria-hidden="true">→</span></a>
          </div>
        </article>
      `;
    }).join('');

    return `
      <section class="p-skincare-discovery" aria-labelledby="p-skincare-ritual-title">
        <div class="p-skincare-discovery-intro">
          <p class="p-skincare-section-kicker">The Pelagoir ritual</p>
          <h2 id="p-skincare-ritual-title">A few intentional steps.</h2>
          <p class="p-skincare-discovery-copy">Begin with the category that meets your everyday pace.</p>
        </div>
        <div class="p-skincare-ritual-grid">
          ${ritualCards}
        </div>
      </section>
    `;
  }

  if (products.length) {
    return `
      <section class="p-skincare-discovery p-skincare-product-edit" aria-labelledby="p-skincare-product-edit-title">
        <div class="p-skincare-discovery-intro">
          <p class="p-skincare-section-kicker">A considered edit</p>
          <h2 id="p-skincare-product-edit-title">Begin with what is here.</h2>
        </div>
        <div class="p-skincare-product-edit-grid">
          ${products.map((product) => ctx.productCard(product)).join('')}
        </div>
      </section>
    `;
  }

  return '';
}

export const css = `
.th-p-skincare {
  --p-skincare-stone: #f4f0e7;
  --p-skincare-chalk: #fdfaf2;
  --p-skincare-ink: #20251d;
  --p-skincare-moss: #31433a;
  --p-skincare-water: #cfd8cf;
  --p-skincare-line: #d6d0c3;
  --p-skincare-muted: #6a6c61;
  background: var(--p-skincare-stone);
  color: var(--p-skincare-ink);
  overflow: hidden;
}

.th-p-skincare .category-hero {
  position: relative;
  isolation: isolate;
  min-height: clamp(39rem, 56vw, 51.75rem);
  overflow: hidden;
  background: #c9c3b5;
}

.th-p-skincare .p-skincare-hero-photo {
  position: absolute;
  inset: 0;
  z-index: -3;
  overflow: hidden;
  background: linear-gradient(120deg, #b8afa0 0%, #847b6a 46%, #b9c7bf 100%);
}

.th-p-skincare .p-skincare-hero-photo .hero-media,
.th-p-skincare .p-skincare-hero-photo .theme-empty-media {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.th-p-skincare .p-skincare-hero-photo .theme-empty-media {
  background:
    radial-gradient(circle at 72% 59%, rgba(254, 252, 246, .56) 0 3%, transparent 3.4%),
    radial-gradient(ellipse at 72% 66%, rgba(185, 204, 199, .7) 0 15%, transparent 15.5%),
    linear-gradient(122deg, #d8d0c1 0%, #a79d8c 52%, #6e786e 100%);
}

.th-p-skincare .p-skincare-hero-matte {
  position: absolute;
  inset: 0 auto 0 0;
  z-index: -1;
  width: min(53vw, 52rem);
  background:
    radial-gradient(ellipse 65% 44% at 36% 12%, rgba(255, 253, 247, .34) 0 42%, transparent 43%),
    linear-gradient(90deg, rgba(253, 250, 243, .99) 0%, rgba(250, 247, 239, .96) 68%, rgba(250, 247, 239, .18) 100%);
  clip-path: polygon(0 0, 95% 0, 88% 18%, 96% 48%, 83% 76%, 96% 100%, 0 100%);
}

.th-p-skincare .p-skincare-hero-caustic {
  position: absolute;
  right: 1.5%;
  bottom: -14%;
  z-index: -1;
  width: min(58vw, 66rem);
  aspect-ratio: 1.8;
  border: 1px solid rgba(250, 247, 239, .45);
  border-radius: 50%;
  box-shadow:
    0 0 0 1.1rem rgba(250, 247, 239, .08),
    0 0 0 2.4rem rgba(250, 247, 239, .05),
    inset 1.7rem 1rem 4rem rgba(255, 255, 255, .18);
  opacity: .8;
  transform: rotate(-7deg);
}

.th-p-skincare .p-skincare-hero-copy-wrap {
  display: flex;
  position: relative;
  z-index: 1;
  width: min(44rem, 46vw);
  min-height: clamp(39rem, 56vw, 51.75rem);
  padding: clamp(8rem, 14vw, 13rem) clamp(1.5rem, 5.35vw, 5.4rem) clamp(3.5rem, 7vw, 5rem);
  flex-direction: column;
  justify-content: center;
}

.th-p-skincare .p-skincare-copy {
  max-width: 35rem;
}

.th-p-skincare .p-skincare-copy .eyebrow,
.th-p-skincare .p-skincare-section-kicker {
  margin: 0 0 1rem;
  color: var(--p-skincare-moss);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .62rem;
  font-weight: 700;
  letter-spacing: .22em;
  line-height: 1.45;
  text-transform: uppercase;
}

.th-p-skincare .p-skincare-copy h1 {
  max-width: 12ch;
  margin: 0;
  color: #181b17;
  font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
  font-size: clamp(3.6rem, 6.55vw, 7.4rem);
  font-weight: 400;
  letter-spacing: -.065em;
  line-height: .9;
  overflow-wrap: anywhere;
}

.th-p-skincare .p-skincare-copy .sub {
  max-width: 31rem;
  margin: 1.9rem 0 0;
  color: #45483f;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: clamp(.85rem, 1.02vw, 1rem);
  letter-spacing: .105em;
  line-height: 1.65;
  text-transform: uppercase;
}

.th-p-skincare .p-skincare-copy .ctas {
  display: flex;
  margin-top: 2.25rem;
  flex-wrap: wrap;
  gap: .7rem;
}

.th-p-skincare .p-skincare-copy .ctas a {
  display: inline-flex;
  min-height: 3rem;
  padding: .7rem 1.25rem;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--p-skincare-moss);
  background: var(--p-skincare-moss);
  color: #fcf9f1;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .68rem;
  font-weight: 700;
  letter-spacing: .16em;
  line-height: 1.2;
  text-align: center;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-skincare .p-skincare-copy .ctas a:hover,
.th-p-skincare .p-skincare-copy .ctas a:focus-visible {
  background: #fbf8ef;
  color: var(--p-skincare-moss);
  outline: none;
}

.th-p-skincare .p-skincare-hero-rule {
  width: 2.25rem;
  height: 1px;
  margin-top: 1.55rem;
  background: rgba(49, 67, 58, .65);
}

.th-p-skincare .p-skincare-hero-note {
  max-width: 15rem;
  margin: .72rem 0 0;
  color: #55594f;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .66rem;
  letter-spacing: .17em;
  line-height: 1.5;
  text-transform: uppercase;
}

.th-p-skincare .p-skincare-hero-index {
  display: flex;
  position: absolute;
  right: clamp(1.5rem, 4.5vw, 4.7rem);
  bottom: clamp(2rem, 3.7vw, 3.8rem);
  z-index: 1;
  min-width: 9rem;
  padding-top: .7rem;
  justify-content: space-between;
  border-top: 1px solid rgba(252, 249, 241, .7);
  color: #faf7ef;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .61rem;
  font-weight: 700;
  letter-spacing: .18em;
  text-shadow: 0 1px 12px rgba(20, 25, 20, .4);
  text-transform: uppercase;
}

.th-p-skincare .p-skincare-mineral-hero .hero-motion-controls,
.th-p-skincare .p-skincare-mineral-hero .hero-controls {
  position: absolute;
  right: clamp(1.5rem, 4.5vw, 4.7rem);
  bottom: clamp(5.6rem, 7.7vw, 7.2rem);
  z-index: 2;
}

.th-p-skincare .p-skincare-mineral-hero .hero-motion-controls button,
.th-p-skincare .p-skincare-mineral-hero .hero-controls button {
  min-width: 2.75rem;
  min-height: 2.75rem;
  border: 1px solid rgba(252, 249, 241, .72);
  border-radius: 50%;
  background: rgba(30, 37, 29, .35);
  color: #fffdf7;
}

.th-p-skincare .p-skincare-mineral-hero.has-hero-motion .p-skincare-hero-photo .hero-media {
  animation: p-skincare-water-drift 18s ease-in-out infinite alternate;
}

.th-p-skincare .p-skincare-discovery {
  display: grid;
  padding: clamp(4rem, 7vw, 7.8rem) clamp(1.25rem, 5vw, 5rem) clamp(4.5rem, 7vw, 7.2rem);
  grid-template-columns: minmax(14rem, .78fr) minmax(0, 2.22fr);
  gap: clamp(2rem, 5vw, 6rem);
  border-bottom: 1px solid var(--p-skincare-line);
  background:
    linear-gradient(90deg, rgba(255, 255, 255, .35) 0 1px, transparent 1px) 0 0 / 25% 100%,
    var(--p-skincare-stone);
}

.th-p-skincare .p-skincare-discovery-intro {
  align-self: start;
  max-width: 20rem;
}

.th-p-skincare .p-skincare-discovery-intro h2 {
  margin: 0;
  color: var(--p-skincare-ink);
  font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
  font-size: clamp(2.2rem, 3.4vw, 4rem);
  font-weight: 400;
  letter-spacing: -.052em;
  line-height: .97;
  overflow-wrap: anywhere;
}

.th-p-skincare .p-skincare-discovery-copy {
  max-width: 17rem;
  margin: 1.65rem 0 0;
  color: var(--p-skincare-muted);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .91rem;
  line-height: 1.65;
}

.th-p-skincare .p-skincare-ritual-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-left: 1px solid var(--p-skincare-line);
}

.th-p-skincare .p-skincare-ritual-card {
  display: flex;
  min-width: 0;
  padding: 0 clamp(1rem, 2vw, 2rem) .5rem;
  flex-direction: column;
  border-right: 1px solid var(--p-skincare-line);
}

.th-p-skincare .p-skincare-ritual-number {
  margin: 0 0 1.7rem;
  color: var(--p-skincare-moss);
  font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
  font-size: clamp(2rem, 2.3vw, 2.85rem);
  line-height: 1;
}

.th-p-skincare .p-skincare-ritual-media,
.th-p-skincare .p-skincare-ritual-still {
  position: relative;
  width: 100%;
  aspect-ratio: .93;
  overflow: hidden;
  background: #d7d2c7;
}

.th-p-skincare .p-skincare-ritual-media .hero-media,
.th-p-skincare .p-skincare-ritual-media .theme-empty-media {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.th-p-skincare .p-skincare-ritual-still {
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at 50% 56%, rgba(252, 250, 243, .97) 0 8%, rgba(219, 225, 217, .86) 8.5% 27%, transparent 27.5%),
    linear-gradient(135deg, #e6e1d7, #c8d0c5);
}

.th-p-skincare .p-skincare-ritual-still-1 {
  background:
    linear-gradient(22deg, transparent 42%, rgba(88, 103, 88, .4) 43% 48%, transparent 49%),
    radial-gradient(ellipse at 50% 62%, #f0ede3 0 16%, #d6ddd3 16.5% 31%, transparent 31.5%),
    #d7d2c7;
}

.th-p-skincare .p-skincare-ritual-still-2 {
  background:
    radial-gradient(circle at 40% 35%, rgba(255, 255, 255, .62) 0 2%, transparent 2.5%),
    radial-gradient(circle at 63% 55%, rgba(255, 255, 255, .55) 0 3.5%, transparent 4%),
    radial-gradient(ellipse at 50% 64%, #f7f3e9 0 17%, #d6ded4 17.5% 33%, transparent 33.5%),
    #d9d4c9;
}

.th-p-skincare .p-skincare-ritual-still-3 {
  background:
    linear-gradient(135deg, rgba(255, 255, 255, .42) 0 20%, transparent 20% 44%, rgba(255, 255, 255, .25) 44% 52%, transparent 52%),
    radial-gradient(ellipse at 50% 58%, #f4f1e7 0 19%, #cbd5c9 19.5% 36%, transparent 36.5%),
    #d0cec4;
}

.th-p-skincare .p-skincare-ritual-still span {
  width: 20%;
  height: 34%;
  border: 1px solid rgba(49, 67, 58, .42);
  border-radius: 45% 45% 17% 17%;
  background: rgba(250, 247, 239, .76);
  box-shadow: 0 .25rem 1.2rem rgba(57, 69, 57, .13);
}

.th-p-skincare .p-skincare-ritual-card-copy {
  display: flex;
  min-height: 12.8rem;
  padding-top: 1.4rem;
  flex-direction: column;
  align-items: flex-start;
}

.th-p-skincare .p-skincare-ritual-card h3 {
  margin: 0;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: clamp(.9rem, 1.1vw, 1.08rem);
  font-weight: 700;
  letter-spacing: .115em;
  line-height: 1.3;
  text-transform: uppercase;
}

.th-p-skincare .p-skincare-ritual-card h3 a {
  color: var(--p-skincare-ink);
  text-decoration: none;
}

.th-p-skincare .p-skincare-ritual-card h3 a:hover,
.th-p-skincare .p-skincare-ritual-card h3 a:focus-visible,
.th-p-skincare .p-skincare-ritual-link:hover,
.th-p-skincare .p-skincare-ritual-link:focus-visible {
  color: var(--p-skincare-moss);
  outline: none;
}

.th-p-skincare .p-skincare-ritual-card-copy > p {
  margin: .65rem 0 1.45rem;
  color: var(--p-skincare-muted);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .75rem;
  line-height: 1.5;
}

.th-p-skincare .p-skincare-ritual-link {
  display: inline-flex;
  min-height: 2.75rem;
  margin-top: auto;
  align-items: center;
  color: var(--p-skincare-ink);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: .67rem;
  font-weight: 700;
  letter-spacing: .16em;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-skincare .p-skincare-ritual-link span {
  margin-left: .55rem;
  font-size: 1.05rem;
}

.th-p-skincare .p-skincare-product-edit {
  display: block;
}

.th-p-skincare .p-skincare-product-edit-grid {
  display: grid;
  margin-top: 2.5rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  background: var(--p-skincare-line);
}

.th-p-skincare .p-skincare-product-edit-grid > * {
  min-width: 0;
  background: var(--p-skincare-chalk);
}

.th-p-skincare #shop {
  padding: clamp(3.7rem, 6vw, 6.5rem) clamp(1.25rem, 5vw, 5rem);
  background: var(--p-skincare-chalk);
}

.th-p-skincare #shop > h2,
.th-p-skincare #shop .section-title {
  max-width: 12ch;
  color: var(--p-skincare-ink);
  font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
  font-size: clamp(2.3rem, 4vw, 4.2rem);
  font-weight: 400;
  letter-spacing: -.05em;
  line-height: .95;
  overflow-wrap: anywhere;
}

.th-p-skincare .products,
.th-p-skincare .product-grid {
  gap: 1px;
}

.th-p-skincare .product-card {
  border-color: var(--p-skincare-line);
  border-radius: 0;
  background: var(--p-skincare-chalk);
}

.th-p-skincare .product-card a:focus-visible,
.th-p-skincare a:focus-visible {
  outline: 2px solid var(--p-skincare-moss);
  outline-offset: 3px;
}

@keyframes p-skincare-water-drift {
  from { transform: scale(1.01) translate3d(0, 0, 0); }
  to { transform: scale(1.065) translate3d(-.55%, -.45%, 0); }
}

@media (max-width: 760px) {
  .th-p-skincare .category-hero {
    min-height: 43rem;
  }

  .th-p-skincare .p-skincare-hero-photo {
    inset: 0 0 37% 0;
  }

  .th-p-skincare .p-skincare-hero-matte {
    inset: auto 0 0 0;
    width: 100%;
    height: 58%;
    background: linear-gradient(180deg, rgba(250, 247, 239, .2) 0%, rgba(250, 247, 239, .96) 19%, #faf7ef 100%);
    clip-path: none;
  }

  .th-p-skincare .p-skincare-hero-caustic {
    right: -24%;
    bottom: 29%;
    width: 120%;
  }

  .th-p-skincare .p-skincare-hero-copy-wrap {
    width: 100%;
    min-height: 43rem;
    padding: 20rem 1.35rem 3rem;
    justify-content: flex-end;
  }

  .th-p-skincare .p-skincare-copy h1 {
    max-width: 13ch;
    font-size: clamp(3.2rem, 14vw, 4.75rem);
  }

  .th-p-skincare .p-skincare-copy .sub {
    max-width: 30rem;
    margin-top: 1.15rem;
    font-size: .74rem;
    line-height: 1.55;
  }

  .th-p-skincare .p-skincare-copy .ctas {
    margin-top: 1.45rem;
  }

  .th-p-skincare .p-skincare-copy .ctas a {
    width: 100%;
  }

  .th-p-skincare .p-skincare-hero-rule,
  .th-p-skincare .p-skincare-hero-note,
  .th-p-skincare .p-skincare-hero-index {
    display: none;
  }

  .th-p-skincare .p-skincare-mineral-hero .hero-motion-controls,
  .th-p-skincare .p-skincare-mineral-hero .hero-controls {
    top: 1rem;
    right: 1rem;
    bottom: auto;
  }

  .th-p-skincare .p-skincare-discovery {
    display: block;
    padding: 3.75rem 1.25rem 4rem;
    background: var(--p-skincare-stone);
  }

  .th-p-skincare .p-skincare-discovery-intro {
    max-width: 27rem;
  }

  .th-p-skincare .p-skincare-discovery-copy {
    max-width: 22rem;
    margin-top: 1.1rem;
  }

  .th-p-skincare .p-skincare-ritual-grid {
    display: block;
    margin-top: 2.6rem;
    border-top: 1px solid var(--p-skincare-line);
    border-left: 0;
  }

  .th-p-skincare .p-skincare-ritual-card {
    display: grid;
    padding: 1.25rem 0;
    grid-template-columns: 2.4rem minmax(6.3rem, .78fr) minmax(0, 1.22fr);
    gap: .85rem;
    border-right: 0;
    border-bottom: 1px solid var(--p-skincare-line);
  }

  .th-p-skincare .p-skincare-ritual-number {
    margin: .15rem 0 0;
    font-size: 1.55rem;
  }

  .th-p-skincare .p-skincare-ritual-media,
  .th-p-skincare .p-skincare-ritual-still {
    align-self: start;
    aspect-ratio: 1;
  }

  .th-p-skincare .p-skincare-ritual-card-copy {
    min-height: 0;
    padding: .1rem 0 0;
  }

  .th-p-skincare .p-skincare-ritual-card h3 {
    font-size: .76rem;
  }

  .th-p-skincare .p-skincare-ritual-card-copy > p {
    margin: .45rem 0 .55rem;
    font-size: .7rem;
  }

  .th-p-skincare .p-skincare-ritual-link {
    min-height: 2.75rem;
  }

  .th-p-skincare .p-skincare-product-edit-grid {
    grid-template-columns: 1fr;
  }

  .th-p-skincare #shop {
    padding: 3.7rem 1.25rem;
  }
}

@media (max-width: 390px) {
  .th-p-skincare .category-hero,
  .th-p-skincare .p-skincare-hero-copy-wrap {
    min-height: 42rem;
  }

  .th-p-skincare .p-skincare-hero-photo {
    inset: 0 0 39% 0;
  }

  .th-p-skincare .p-skincare-hero-copy-wrap {
    padding-top: 18.2rem;
  }

  .th-p-skincare .p-skincare-copy h1 {
    font-size: clamp(3rem, 13.3vw, 3.7rem);
  }

  .th-p-skincare .p-skincare-ritual-card {
    grid-template-columns: 2.15rem 5.45rem minmax(0, 1fr);
    gap: .68rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .th-p-skincare .p-skincare-mineral-hero.has-hero-motion .p-skincare-hero-photo .hero-media {
    animation: none;
    transform: none;
  }
}
`;

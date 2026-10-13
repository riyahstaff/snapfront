import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-makeup-palettes',
  name: 'TINT / THEORY',
  for: 'color-curious makeup shoppers building tone-led palettes',
  vibe: 'a candlelit color atelier of pigment pans, folded paper, and lacquered wine tones',
  category: 'Makeup palettes',
  group: 'beauty',
  display: 'Cormorant Garamond',
  body: 'Manrope',
  displayWeight: 600,
  tracking: '-.055em',
  colors: {
    bg: '#F7EEE7',
    surface: '#FFF9F4',
    ink: '#321E25',
    muted: '#80676B',
    line: '#DECAC5',
    accent: '#8B263F',
    onAccent: '#FFF7F0',
    panel: '#E9B5A7',
    onPanel: '#321E25',
    foot: '#321E25',
    onFoot: '#FFF4EB',
    bar: '#FFF8F2',
    onBar: '#321E25',
    badge: '#F3D7A8',
    onBadge: '#4A2927'
  },
  header: 'center',
  hero: 'collage',
  card: 'pastel',
  ratio: '1/1',
  rCard: 22,
  rBtn: 0,
  motion: 'pan',
  copy: {
    eyebrow: 'A study in color',
    collection: 'The color edit',
    cta: 'Browse palettes',
    title: 'Color, kept close.',
    subtitle: 'A considered edit of tones made for layering, playing, and making your own.'
  }
});

export function hero(ctx) {
  return `
    <section class="hero category-hero p-makeup-palettes-atlas${ctx.heroClass}"${ctx.heroAttrs}>
      <div class="p-makeup-palettes-wash" aria-hidden="true"></div>
      <div class="p-makeup-palettes-orbit p-makeup-palettes-orbit-one" aria-hidden="true"><span></span></div>
      <div class="p-makeup-palettes-orbit p-makeup-palettes-orbit-two" aria-hidden="true"><span></span></div>
      <div class="p-makeup-palettes-hero-well">
        ${ctx.media(0, { priority: true, lazy: false, decorative: false })}
      </div>
      <div class="p-makeup-palettes-well-ring" aria-hidden="true"></div>
      <div class="p-makeup-palettes-hero-label" aria-hidden="true">
        <span>Palette atlas</span><b>01</b>
      </div>
      <div class="p-makeup-palettes-copy-sheet">
        <div class="p-makeup-palettes-sheet-tab" aria-hidden="true">Tone / texture / light</div>
        ${ctx.copy('p-makeup-palettes-copy')}
      </div>
      <p class="p-makeup-palettes-hero-margin" aria-hidden="true">Press, blend, repeat</p>
      ${ctx.controls}
    </section>
  `;
}

export function discovery(ctx) {
  const categories = (ctx.cats || []).filter((category) => category && category.name).slice(0, 3);
  const products = (ctx.products || []).slice(0, 3);

  if (categories.length >= 2) {
    const cards = categories.map((category, index) => {
      const hasPhoto = Boolean(ctx.pics && ctx.pics[index + 1]);
      const count = Number(category.count) || 0;
      const itemLabel = count === 1 ? 'palette' : 'palettes';
      const visual = hasPhoto
        ? `<div class="p-makeup-palettes-shade-media">${ctx.media(index + 1, { lazy: true, decorative: true })}</div>`
        : `<div class="p-makeup-palettes-shade-media p-makeup-palettes-shade-empty p-makeup-palettes-shade-empty-${index + 1}" aria-hidden="true"><i></i><i></i><i></i></div>`;

      return `
        <article class="p-makeup-palettes-shade-card">
          <a class="p-makeup-palettes-shade-link" href="${ctx.categoryLink(category.name)}">
            <span class="p-makeup-palettes-shade-index">0${index + 1}</span>
            ${visual}
            <span class="p-makeup-palettes-shade-copy">
              <strong>${ctx.esc(category.name)}</strong>
              <small>${ctx.esc(String(count))} ${itemLabel}</small>
              <em>Explore the edit <b aria-hidden="true">↗</b></em>
            </span>
          </a>
        </article>
      `;
    }).join('');

    return `
      <section class="p-makeup-palettes-discovery" aria-labelledby="p-makeup-palettes-discovery-title">
        <div class="p-makeup-palettes-discovery-intro">
          <p>Choose your color language</p>
          <h2 id="p-makeup-palettes-discovery-title">Start with the mood, not the mirror.</h2>
          <span aria-hidden="true"></span>
        </div>
        <div class="p-makeup-palettes-shade-list">${cards}</div>
      </section>
    `;
  }

  if (products.length) {
    return `
      <section class="p-makeup-palettes-discovery p-makeup-palettes-product-edit" aria-labelledby="p-makeup-palettes-product-edit-title">
        <div class="p-makeup-palettes-discovery-intro">
          <p>The color edit</p>
          <h2 id="p-makeup-palettes-product-edit-title">Begin with what is here.</h2>
        </div>
        <div class="p-makeup-palettes-product-edit-grid">${products.map((product) => ctx.productCard(product)).join('')}</div>
      </section>
    `;
  }

  return '';
}

export const css = `
.th-p-makeup-palettes {
  --p-makeup-palettes-paper: #f7eee7;
  --p-makeup-palettes-cream: #fff9f4;
  --p-makeup-palettes-ink: #321e25;
  --p-makeup-palettes-wine: #8b263f;
  --p-makeup-palettes-rose: #d77885;
  --p-makeup-palettes-apricot: #e2a064;
  --p-makeup-palettes-line: #decac5;
  --p-makeup-palettes-muted: #80676b;
  background: var(--p-makeup-palettes-paper);
  color: var(--p-makeup-palettes-ink);
  overflow: clip;
}

.th-p-makeup-palettes .category-hero {
  position: relative;
  isolation: isolate;
  min-height: clamp(42rem, 58vw, 56rem);
  overflow: hidden;
  background:
    radial-gradient(circle at 14% 14%, rgba(226, 160, 100, .5) 0 2.6%, transparent 2.72%),
    radial-gradient(circle at 10% 14%, rgba(255, 249, 244, .98) 0 9.4%, transparent 9.55%),
    linear-gradient(122deg, #f8eae0 0%, #f8eee7 49%, #d48778 100%);
}

.th-p-makeup-palettes .p-makeup-palettes-wash {
  position: absolute;
  inset: 0;
  z-index: -5;
  background:
    linear-gradient(90deg, rgba(255, 249, 244, .86) 0 1px, transparent 1px) 0 0 / 12.5% 100%,
    linear-gradient(0deg, rgba(255, 249, 244, .24) 0 1px, transparent 1px) 0 0 / 100% 25%,
    radial-gradient(ellipse 40% 72% at 93% 50%, rgba(103, 26, 48, .48), transparent 70%);
  opacity: .74;
}

.th-p-makeup-palettes .p-makeup-palettes-hero-well {
  position: absolute;
  top: clamp(2rem, 4vw, 4rem);
  left: 50%;
  z-index: -2;
  width: min(76vw, 71rem);
  height: min(48vw, 46rem);
  min-height: 33rem;
  overflow: hidden;
  border: 1px solid rgba(255, 249, 244, .66);
  border-radius: 47% 53% 49% 51% / 42% 41% 59% 58%;
  box-shadow: 0 2rem 4.7rem rgba(63, 17, 30, .2);
  transform: translateX(-35%) rotate(3deg);
  background: #b86261;
}

.th-p-makeup-palettes .p-makeup-palettes-hero-well::after {
  position: absolute;
  inset: 0;
  content: '';
  pointer-events: none;
  background:
    linear-gradient(105deg, rgba(255, 237, 219, .28), transparent 27% 66%, rgba(77, 13, 28, .2)),
    radial-gradient(circle at 60% 43%, transparent 0 52%, rgba(47, 12, 24, .25) 100%);
}

.th-p-makeup-palettes .p-makeup-palettes-hero-well .hero-media,
.th-p-makeup-palettes .p-makeup-palettes-hero-well .theme-empty-media {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.th-p-makeup-palettes .p-makeup-palettes-hero-well .theme-empty-media {
  background:
    radial-gradient(circle at 38% 50%, #ffd5a6 0 8%, #d97378 8.5% 16%, transparent 16.5%),
    radial-gradient(circle at 65% 40%, #f9e5d5 0 6%, #a43c55 6.5% 14%, transparent 14.5%),
    linear-gradient(132deg, #e7a66b, #a62d4b 58%, #4b1728);
}

.th-p-makeup-palettes .p-makeup-palettes-well-ring {
  position: absolute;
  top: clamp(1.1rem, 2.2vw, 2.5rem);
  left: 50%;
  z-index: -3;
  width: min(77.5vw, 72.4rem);
  height: min(49.5vw, 47.4rem);
  min-height: 34.4rem;
  border: 1px solid rgba(98, 27, 43, .33);
  border-radius: 47% 53% 49% 51% / 42% 41% 59% 58%;
  transform: translateX(-34.5%) rotate(3deg);
}

.th-p-makeup-palettes .p-makeup-palettes-orbit {
  position: absolute;
  z-index: -1;
  display: grid;
  place-items: center;
  border: 1px solid rgba(96, 26, 45, .28);
  border-radius: 50%;
  background: rgba(255, 249, 244, .42);
  box-shadow: 0 .8rem 2rem rgba(92, 24, 43, .12);
}

.th-p-makeup-palettes .p-makeup-palettes-orbit span {
  display: block;
  width: 37%;
  aspect-ratio: 1;
  border: 1px solid rgba(255, 249, 244, .68);
  border-radius: 50%;
  background: var(--p-makeup-palettes-wine);
  box-shadow: inset .4rem .35rem .8rem rgba(255, 211, 196, .24), 0 .3rem .8rem rgba(69, 11, 27, .13);
}

.th-p-makeup-palettes .p-makeup-palettes-orbit-one {
  top: 11%;
  right: 3.5%;
  width: clamp(7rem, 10vw, 10rem);
  aspect-ratio: 1;
  transform: rotate(18deg);
}

.th-p-makeup-palettes .p-makeup-palettes-orbit-two {
  bottom: 8%;
  left: 6%;
  width: clamp(5.7rem, 8vw, 8.2rem);
  aspect-ratio: 1;
  transform: rotate(-14deg);
}

.th-p-makeup-palettes .p-makeup-palettes-orbit-two span {
  width: 43%;
  background: var(--p-makeup-palettes-apricot);
}

.th-p-makeup-palettes .p-makeup-palettes-hero-label {
  display: flex;
  position: absolute;
  top: clamp(2rem, 4.2vw, 4.5rem);
  right: clamp(1.25rem, 5.4vw, 6.5rem);
  z-index: 1;
  align-items: center;
  gap: .85rem;
  color: #fff7f0;
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .61rem;
  font-weight: 700;
  letter-spacing: .17em;
  text-shadow: 0 1px 14px rgba(61, 11, 26, .36);
  text-transform: uppercase;
  transform: rotate(90deg) translateX(100%);
  transform-origin: 100% 0;
}

.th-p-makeup-palettes .p-makeup-palettes-hero-label b {
  display: grid;
  width: 1.85rem;
  aspect-ratio: 1;
  place-items: center;
  border: 1px solid rgba(255, 247, 240, .65);
  border-radius: 50%;
  font-size: .56rem;
}

.th-p-makeup-palettes .p-makeup-palettes-copy-sheet {
  position: absolute;
  bottom: clamp(2.1rem, 6vw, 6.2rem);
  left: clamp(1.25rem, 7.2vw, 8.2rem);
  z-index: 2;
  width: min(34rem, 39vw);
  padding: clamp(1.3rem, 2.6vw, 2.6rem);
  border: 1px solid rgba(82, 22, 39, .2);
  border-radius: .25rem 1.45rem .25rem .25rem;
  background: rgba(255, 249, 244, .96);
  box-shadow: .9rem 1.1rem 0 rgba(139, 38, 63, .18), 0 1.3rem 3.6rem rgba(70, 19, 33, .13);
}

.th-p-makeup-palettes .p-makeup-palettes-sheet-tab {
  position: absolute;
  top: -1.9rem;
  left: 0;
  padding: .5rem 1rem;
  border-radius: .22rem .22rem 0 0;
  background: var(--p-makeup-palettes-wine);
  color: #fff7f0;
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .56rem;
  font-weight: 700;
  letter-spacing: .16em;
  line-height: 1.25;
  text-transform: uppercase;
}

.th-p-makeup-palettes .p-makeup-palettes-copy .eyebrow,
.th-p-makeup-palettes .p-makeup-palettes-discovery-intro > p {
  margin: 0 0 .8rem;
  color: var(--p-makeup-palettes-wine);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .62rem;
  font-weight: 800;
  letter-spacing: .18em;
  line-height: 1.4;
  text-transform: uppercase;
}

.th-p-makeup-palettes .p-makeup-palettes-copy h1 {
  max-width: 11ch;
  margin: 0;
  color: var(--p-makeup-palettes-ink);
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: clamp(3.25rem, 5.3vw, 6.5rem);
  font-weight: 600;
  letter-spacing: -.07em;
  line-height: .82;
  overflow-wrap: anywhere;
}

.th-p-makeup-palettes .p-makeup-palettes-copy h1.long {
  max-width: 13ch;
  font-size: clamp(2.7rem, 4.1vw, 5.1rem);
  line-height: .87;
}

.th-p-makeup-palettes .p-makeup-palettes-copy .sub {
  max-width: 29rem;
  margin: 1.2rem 0 0;
  color: #60474c;
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: clamp(.78rem, .96vw, .94rem);
  line-height: 1.65;
}

.th-p-makeup-palettes .p-makeup-palettes-copy .ctas {
  display: flex;
  margin-top: 1.55rem;
  flex-wrap: wrap;
  gap: .65rem;
}

.th-p-makeup-palettes .p-makeup-palettes-copy .ctas a {
  display: inline-flex;
  min-height: 3rem;
  padding: .72rem 1.1rem;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--p-makeup-palettes-wine);
  border-radius: 0;
  background: var(--p-makeup-palettes-wine);
  color: #fff8f2;
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .62rem;
  font-weight: 800;
  letter-spacing: .14em;
  line-height: 1.25;
  text-align: center;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-makeup-palettes .p-makeup-palettes-copy .ctas a.ghost {
  border-color: rgba(82, 22, 39, .42);
  background: transparent;
  color: var(--p-makeup-palettes-wine);
}

.th-p-makeup-palettes .p-makeup-palettes-copy .ctas a:hover,
.th-p-makeup-palettes .p-makeup-palettes-copy .ctas a:focus-visible {
  background: #f1b8a1;
  color: var(--p-makeup-palettes-ink);
  outline: none;
}

.th-p-makeup-palettes .p-makeup-palettes-hero-margin {
  position: absolute;
  right: clamp(1.2rem, 5.3vw, 6rem);
  bottom: clamp(1.2rem, 3.6vw, 3.6rem);
  margin: 0;
  color: rgba(255, 247, 240, .91);
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: clamp(1.25rem, 1.7vw, 1.9rem);
  font-style: italic;
  letter-spacing: -.03em;
  text-shadow: 0 1px 12px rgba(54, 12, 23, .4);
  transform: rotate(-7deg);
}

.th-p-makeup-palettes .p-makeup-palettes-atlas > .motion-toggle {
  position: absolute;
  top: clamp(1rem, 2.1vw, 2rem);
  left: clamp(1rem, 2.6vw, 2.8rem);
  z-index: 4;
  min-width: 2.75rem;
  min-height: 2.75rem;
  border: 1px solid rgba(88, 22, 42, .36);
  border-radius: 50%;
  background: rgba(255, 249, 244, .76);
  color: var(--p-makeup-palettes-wine);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .57rem;
  font-weight: 800;
  letter-spacing: .06em;
  text-transform: uppercase;
}

.th-p-makeup-palettes .p-makeup-palettes-atlas.has-hero-motion .p-makeup-palettes-hero-well .hero-media {
  animation: p-makeup-palettes-pan 18s ease-in-out infinite alternate;
}

.th-p-makeup-palettes .p-makeup-palettes-discovery {
  display: grid;
  position: relative;
  padding: clamp(4.5rem, 8vw, 8.5rem) clamp(1.25rem, 6vw, 6.5rem);
  grid-template-columns: minmax(13rem, .88fr) minmax(0, 2.12fr);
  gap: clamp(2.3rem, 6vw, 7rem);
  overflow: hidden;
  border-top: 1px solid var(--p-makeup-palettes-line);
  border-bottom: 1px solid var(--p-makeup-palettes-line);
  background:
    radial-gradient(circle at 93% 85%, rgba(225, 160, 100, .22) 0 8%, transparent 8.2%),
    linear-gradient(90deg, rgba(139, 38, 63, .08) 0 1px, transparent 1px) 0 0 / 25% 100%,
    var(--p-makeup-palettes-paper);
}

.th-p-makeup-palettes .p-makeup-palettes-discovery-intro {
  align-self: start;
  max-width: 24rem;
}

.th-p-makeup-palettes .p-makeup-palettes-discovery-intro h2 {
  max-width: 9ch;
  margin: 0;
  color: var(--p-makeup-palettes-ink);
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: clamp(2.7rem, 4.35vw, 5.1rem);
  font-weight: 600;
  letter-spacing: -.065em;
  line-height: .86;
  overflow-wrap: anywhere;
}

.th-p-makeup-palettes .p-makeup-palettes-discovery-intro > span {
  display: block;
  width: 4.5rem;
  height: 1px;
  margin-top: 1.6rem;
  background: var(--p-makeup-palettes-wine);
}

.th-p-makeup-palettes .p-makeup-palettes-shade-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(.7rem, 1.35vw, 1.4rem);
  align-items: start;
}

.th-p-makeup-palettes .p-makeup-palettes-shade-card {
  min-width: 0;
}

.th-p-makeup-palettes .p-makeup-palettes-shade-card:nth-child(2) {
  margin-top: clamp(2rem, 6vw, 6.2rem);
}

.th-p-makeup-palettes .p-makeup-palettes-shade-card:nth-child(3) {
  margin-top: clamp(.8rem, 2.6vw, 2.8rem);
}

.th-p-makeup-palettes .p-makeup-palettes-shade-link {
  display: block;
  min-height: 44px;
  color: inherit;
  text-decoration: none;
}

.th-p-makeup-palettes .p-makeup-palettes-shade-index {
  display: block;
  margin-bottom: .65rem;
  color: var(--p-makeup-palettes-wine);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .59rem;
  font-weight: 800;
  letter-spacing: .15em;
}

.th-p-makeup-palettes .p-makeup-palettes-shade-media {
  position: relative;
  aspect-ratio: .78;
  overflow: hidden;
  border: 1px solid rgba(91, 25, 44, .18);
  border-radius: 50% 50% 1.25rem 1.25rem;
  background: #d6777e;
  box-shadow: .5rem .6rem 0 rgba(139, 38, 63, .11);
}

.th-p-makeup-palettes .p-makeup-palettes-shade-media .hero-media,
.th-p-makeup-palettes .p-makeup-palettes-shade-media .theme-empty-media {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.th-p-makeup-palettes .p-makeup-palettes-shade-media::after {
  position: absolute;
  inset: 0;
  content: '';
  pointer-events: none;
  background: linear-gradient(155deg, rgba(255, 244, 235, .24), transparent 42% 70%, rgba(81, 18, 34, .17));
}

.th-p-makeup-palettes .p-makeup-palettes-shade-empty {
  display: flex;
  padding: 18%;
  align-items: center;
  justify-content: center;
  gap: 9%;
  background: linear-gradient(145deg, #f6d4c0, #bf536b);
}

.th-p-makeup-palettes .p-makeup-palettes-shade-empty i {
  display: block;
  width: 29%;
  aspect-ratio: 1;
  border: 1px solid rgba(255, 248, 241, .72);
  border-radius: 50%;
  background: #8b263f;
  box-shadow: inset .2rem .15rem .45rem rgba(255, 222, 202, .28);
}

.th-p-makeup-palettes .p-makeup-palettes-shade-empty-2 {
  background: linear-gradient(145deg, #f3c584, #a13650);
}

.th-p-makeup-palettes .p-makeup-palettes-shade-empty-2 i:nth-child(2) {
  background: #e39b5c;
}

.th-p-makeup-palettes .p-makeup-palettes-shade-empty-3 {
  background: linear-gradient(145deg, #e7b2a6, #6e2540);
}

.th-p-makeup-palettes .p-makeup-palettes-shade-empty-3 i:nth-child(3) {
  background: #f7ded0;
}

.th-p-makeup-palettes .p-makeup-palettes-shade-copy {
  display: block;
  padding-top: 1rem;
}

.th-p-makeup-palettes .p-makeup-palettes-shade-copy strong,
.th-p-makeup-palettes .p-makeup-palettes-shade-copy small,
.th-p-makeup-palettes .p-makeup-palettes-shade-copy em {
  display: block;
}

.th-p-makeup-palettes .p-makeup-palettes-shade-copy strong {
  color: var(--p-makeup-palettes-ink);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: clamp(.76rem, 1vw, .94rem);
  font-weight: 800;
  letter-spacing: .055em;
  line-height: 1.35;
  overflow-wrap: anywhere;
  text-transform: uppercase;
}

.th-p-makeup-palettes .p-makeup-palettes-shade-copy small {
  margin-top: .35rem;
  color: var(--p-makeup-palettes-muted);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .68rem;
  line-height: 1.45;
}

.th-p-makeup-palettes .p-makeup-palettes-shade-copy em {
  min-height: 2.75rem;
  margin-top: .65rem;
  align-content: center;
  color: var(--p-makeup-palettes-wine);
  font-family: var(--font-body, 'Manrope', sans-serif);
  font-size: .58rem;
  font-style: normal;
  font-weight: 800;
  letter-spacing: .12em;
  line-height: 1.35;
  text-transform: uppercase;
}

.th-p-makeup-palettes .p-makeup-palettes-shade-copy em b {
  margin-left: .25rem;
  font-size: .85rem;
}

.th-p-makeup-palettes .p-makeup-palettes-shade-link:hover .p-makeup-palettes-shade-copy strong,
.th-p-makeup-palettes .p-makeup-palettes-shade-link:focus-visible .p-makeup-palettes-shade-copy strong,
.th-p-makeup-palettes .p-makeup-palettes-shade-link:hover .p-makeup-palettes-shade-copy em,
.th-p-makeup-palettes .p-makeup-palettes-shade-link:focus-visible .p-makeup-palettes-shade-copy em {
  color: #c14f68;
}

.th-p-makeup-palettes .p-makeup-palettes-product-edit {
  display: block;
}

.th-p-makeup-palettes .p-makeup-palettes-product-edit-grid {
  display: grid;
  margin-top: 2.8rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  background: var(--p-makeup-palettes-line);
}

.th-p-makeup-palettes .p-makeup-palettes-product-edit-grid > * {
  min-width: 0;
  background: var(--p-makeup-palettes-cream);
}

.th-p-makeup-palettes #shop {
  padding: clamp(4rem, 7vw, 7.2rem) clamp(1.25rem, 6vw, 6.5rem);
  background: var(--p-makeup-palettes-cream);
}

.th-p-makeup-palettes #shop > h2,
.th-p-makeup-palettes #shop .section-title {
  max-width: 10ch;
  color: var(--p-makeup-palettes-ink);
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: clamp(2.75rem, 4.5vw, 5.3rem);
  font-weight: 600;
  letter-spacing: -.06em;
  line-height: .86;
  overflow-wrap: anywhere;
}

.th-p-makeup-palettes .products,
.th-p-makeup-palettes .product-grid {
  gap: 1px;
}

.th-p-makeup-palettes .product-card {
  border-color: var(--p-makeup-palettes-line);
  border-radius: 0;
  background: var(--p-makeup-palettes-cream);
}

.th-p-makeup-palettes :is(a, button):focus-visible {
  outline: 3px solid var(--p-makeup-palettes-apricot);
  outline-offset: 4px;
}

@keyframes p-makeup-palettes-pan {
  from { transform: scale(1.015) translate3d(0, 0, 0); }
  to { transform: scale(1.065) translate3d(-1%, -.55%, 0); }
}

@media (max-width: 820px) {
  .th-p-makeup-palettes .category-hero {
    min-height: 47rem;
  }

  .th-p-makeup-palettes .p-makeup-palettes-hero-well {
    top: 2.2rem;
    left: 58%;
    width: 90vw;
    height: 33rem;
    min-height: 0;
    transform: translateX(-50%) rotate(2.5deg);
  }

  .th-p-makeup-palettes .p-makeup-palettes-well-ring {
    top: 1.6rem;
    left: 58%;
    width: 92vw;
    height: 34.2rem;
    min-height: 0;
    transform: translateX(-50%) rotate(2.5deg);
  }

  .th-p-makeup-palettes .p-makeup-palettes-copy-sheet {
    right: 1.35rem;
    bottom: 2.5rem;
    left: 1.35rem;
    width: auto;
  }

  .th-p-makeup-palettes .p-makeup-palettes-hero-label {
    top: 2rem;
    right: 1.25rem;
  }

  .th-p-makeup-palettes .p-makeup-palettes-orbit-one {
    top: 25rem;
    right: 4%;
  }

  .th-p-makeup-palettes .p-makeup-palettes-orbit-two {
    bottom: 22rem;
    left: 3%;
  }

  .th-p-makeup-palettes .p-makeup-palettes-hero-margin {
    right: 1.6rem;
    bottom: 20.8rem;
  }

  .th-p-makeup-palettes .p-makeup-palettes-discovery {
    display: block;
  }

  .th-p-makeup-palettes .p-makeup-palettes-shade-list {
    margin-top: 3rem;
  }
}

@media (max-width: 560px) {
  .th-p-makeup-palettes .category-hero {
    min-height: 44.5rem;
  }

  .th-p-makeup-palettes .p-makeup-palettes-hero-well {
    top: 3rem;
    left: 54%;
    width: 130vw;
    height: 27rem;
    border-radius: 47% 53% 49% 51% / 42% 41% 59% 58%;
  }

  .th-p-makeup-palettes .p-makeup-palettes-well-ring {
    top: 2.45rem;
    left: 54%;
    width: 133vw;
    height: 28rem;
  }

  .th-p-makeup-palettes .p-makeup-palettes-hero-well .hero-media {
    object-position: 55% center;
  }

  .th-p-makeup-palettes .p-makeup-palettes-copy-sheet {
    right: 1rem;
    bottom: 1.4rem;
    left: 1rem;
    padding: 1.35rem 1.2rem 1.25rem;
    box-shadow: .48rem .58rem 0 rgba(139, 38, 63, .16), 0 1rem 2.3rem rgba(70, 19, 33, .13);
  }

  .th-p-makeup-palettes .p-makeup-palettes-sheet-tab {
    top: -1.78rem;
    padding: .46rem .75rem;
    font-size: .51rem;
  }

  .th-p-makeup-palettes .p-makeup-palettes-copy h1 {
    max-width: 12ch;
    font-size: clamp(3.2rem, 14vw, 4.8rem);
  }

  .th-p-makeup-palettes .p-makeup-palettes-copy h1.long {
    font-size: clamp(2.4rem, 10.8vw, 3.75rem);
  }

  .th-p-makeup-palettes .p-makeup-palettes-copy .sub {
    margin-top: .9rem;
    font-size: .76rem;
    line-height: 1.55;
  }

  .th-p-makeup-palettes .p-makeup-palettes-copy .ctas {
    margin-top: 1.15rem;
  }

  .th-p-makeup-palettes .p-makeup-palettes-copy .ctas a {
    flex: 1 1 100%;
  }

  .th-p-makeup-palettes .p-makeup-palettes-orbit-one {
    top: 4rem;
    right: -1rem;
    width: 5.2rem;
  }

  .th-p-makeup-palettes .p-makeup-palettes-orbit-two {
    bottom: 17.5rem;
    left: -.9rem;
    width: 4.4rem;
  }

  .th-p-makeup-palettes .p-makeup-palettes-hero-label,
  .th-p-makeup-palettes .p-makeup-palettes-hero-margin {
    display: none;
  }

  .th-p-makeup-palettes .p-makeup-palettes-atlas > .motion-toggle {
    top: 1rem;
    left: 1rem;
  }

  .th-p-makeup-palettes .p-makeup-palettes-discovery {
    padding: 4rem 1.25rem 4.4rem;
    background: var(--p-makeup-palettes-paper);
  }

  .th-p-makeup-palettes .p-makeup-palettes-discovery-intro h2 {
    max-width: 11ch;
    font-size: clamp(2.8rem, 13vw, 4.4rem);
  }

  .th-p-makeup-palettes .p-makeup-palettes-shade-list {
    display: block;
    margin-top: 2.7rem;
  }

  .th-p-makeup-palettes .p-makeup-palettes-shade-card,
  .th-p-makeup-palettes .p-makeup-palettes-shade-card:nth-child(2),
  .th-p-makeup-palettes .p-makeup-palettes-shade-card:nth-child(3) {
    margin-top: 0;
  }

  .th-p-makeup-palettes .p-makeup-palettes-shade-card {
    border-bottom: 1px solid var(--p-makeup-palettes-line);
  }

  .th-p-makeup-palettes .p-makeup-palettes-shade-link {
    display: grid;
    padding: 1rem 0;
    grid-template-columns: 2.1rem 5.4rem minmax(0, 1fr);
    align-items: start;
    gap: .8rem;
  }

  .th-p-makeup-palettes .p-makeup-palettes-shade-index {
    margin: .1rem 0 0;
  }

  .th-p-makeup-palettes .p-makeup-palettes-shade-media {
    aspect-ratio: 1;
    border-radius: 50%;
    box-shadow: none;
  }

  .th-p-makeup-palettes .p-makeup-palettes-shade-copy {
    padding-top: .1rem;
  }

  .th-p-makeup-palettes .p-makeup-palettes-shade-copy strong {
    font-size: .73rem;
  }

  .th-p-makeup-palettes .p-makeup-palettes-shade-copy em {
    min-height: 2.5rem;
    margin-top: .3rem;
  }

  .th-p-makeup-palettes .p-makeup-palettes-product-edit-grid {
    grid-template-columns: 1fr;
  }

  .th-p-makeup-palettes #shop {
    padding: 3.8rem 1.25rem;
  }
}

@media (max-width: 380px) {
  .th-p-makeup-palettes .category-hero {
    min-height: 45rem;
  }

  .th-p-makeup-palettes .p-makeup-palettes-hero-well {
    width: 142vw;
    height: 25.5rem;
  }

  .th-p-makeup-palettes .p-makeup-palettes-well-ring {
    width: 145vw;
    height: 26.5rem;
  }

  .th-p-makeup-palettes .p-makeup-palettes-shade-link {
    grid-template-columns: 1.8rem 4.8rem minmax(0, 1fr);
    gap: .65rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .th-p-makeup-palettes .p-makeup-palettes-atlas.has-hero-motion .p-makeup-palettes-hero-well .hero-media {
    animation: none;
    transform: none;
  }
}
`; 

import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-bath-and-body',
  name: 'TIDELINE RITUALS',
  for: 'bath and body rituals arranged around a slower, water-level reset',
  vibe: 'mineral water, warm plaster, salt crystals, and a tide-marked bathing room',
  category: 'Bath and body rituals',
  group: 'beauty',
  display: 'Cormorant Garamond',
  body: 'Outfit',
  displayWeight: 500,
  tracking: '-.055em',
  colors: {
    bg: '#E9E3D5',
    surface: '#F8F3EA',
    ink: '#16383A',
    muted: '#617573',
    line: '#C8D0C6',
    accent: '#C66B4B',
    onAccent: '#FFF9F0',
    panel: '#174447',
    onPanel: '#F4F0E4',
    foot: '#0E3033',
    onFoot: '#F7F1E5',
    bar: '#DCE5E0',
    onBar: '#173A3D',
    badge: '#E5B483',
    onBadge: '#352517'
  },
  header: 'split',
  hero: 'spotlight',
  card: 'minimal',
  ratio: '4/5',
  rCard: 18,
  rBtn: 0,
  motion: 'drift',
  collection: 'premium',
  family: 'bath-and-body',
  copy: {
    eyebrow: 'A water-level reset',
    collection: 'Choose your pause',
    cta: 'Enter the bathhouse',
    title: 'Make room for a softer hour.',
    subtitle: 'An unhurried edit for the part of the day that belongs only to you.'
  }
});

const itemCount = (value) => {
  const count = Number(value) || 0;
  return `${count} ${count === 1 ? 'item' : 'items'}`;
};

const entryNumber = (index) => String(index + 1).padStart(2, '0');

export function hero(ctx) {
  return `
    <section class="hero category-hero bath-body-tide-hero${ctx.heroClass}"${ctx.heroAttrs}>
      <div class="bath-body-water-photo">
        ${ctx.media(0, { priority: true, lazy: false, decorative: false })}
      </div>
      <div class="bath-body-hero-wash" aria-hidden="true"></div>
      <div class="bath-body-hero-rings" aria-hidden="true"><span></span><span></span><span></span></div>
      <p class="bath-body-hero-coordinate" aria-hidden="true"><span>01</span> Waterline study</p>
      <div class="bath-body-hero-stage">
        <div class="bath-body-hero-card">
          <p class="bath-body-hero-card-tab" aria-hidden="true">Held at the edge of the day</p>
          ${ctx.copy('bath-body-hero-copy')}
          <p class="bath-body-hero-whisper" aria-hidden="true">Draw water. Let the room change.</p>
        </div>
      </div>
      <div class="bath-body-hero-marks" aria-hidden="true">
        <span>soak</span><span>soften</span><span>settle</span>
      </div>
      ${ctx.controls}
    </section>
  `;
}

export function discovery(ctx) {
  const categories = (ctx.cats || []).filter((category) => category && category.name).slice(0, 4);
  const products = (ctx.products || []).slice(0, 2);

  if (categories.length >= 2) {
    return `
      <section class="bath-body-discovery bath-body-waterboard" aria-labelledby="bath-body-waterboard-title">
        <div class="bath-body-waterboard-intro">
          <p class="bath-body-section-kicker">${ctx.esc(ctx.t.copy.collection)}</p>
          <h2 id="bath-body-waterboard-title">Begin where the water meets you.</h2>
          <p>Follow a collection into the kind of pause you need right now.</p>
          <span class="bath-body-waterboard-rule" aria-hidden="true"></span>
        </div>
        <ol class="bath-body-waterboard-list">
          ${categories.map((category, index) => `
            <li>
              <a class="bath-body-waterboard-entry" href="${ctx.categoryLink(category.name)}">
                <span class="bath-body-entry-number">${entryNumber(index)}</span>
                <span class="bath-body-entry-pool" aria-hidden="true"><i></i></span>
                <span class="bath-body-entry-copy">
                  <strong>${ctx.esc(category.name)}</strong>
                  <small>${ctx.esc(itemCount(category.count))} to explore</small>
                </span>
                <span class="bath-body-entry-arrow" aria-hidden="true">↗</span>
              </a>
            </li>
          `).join('')}
        </ol>
      </section>
    `;
  }

  if (products.length) {
    return `
      <section class="bath-body-discovery bath-body-present-edit" aria-labelledby="bath-body-present-edit-title">
        <div class="bath-body-present-edit-intro">
          <p class="bath-body-section-kicker">The room, as it is</p>
          <h2 id="bath-body-present-edit-title">Start with what is waiting.</h2>
        </div>
        <div class="bath-body-present-edit-grid">
          ${products.map((product) => ctx.productCard(product)).join('')}
        </div>
      </section>
    `;
  }

  return '';
}

export const css = `
.th-p-bath-and-body {
  --bath-body-plaster: #e9e3d5;
  --bath-body-paper: #f8f3ea;
  --bath-body-ink: #16383a;
  --bath-body-deep: #0e3033;
  --bath-body-tide: #174447;
  --bath-body-foam: #e9f0e9;
  --bath-body-clay: #c66b4b;
  --bath-body-salt: #e5b483;
  --bath-body-line: #c8d0c6;
  --bath-body-muted: #617573;
  background: var(--bath-body-plaster);
  color: var(--bath-body-ink);
  overflow-x: clip;
}

.th-p-bath-and-body :is(.site-header, .store-header) {
  background: color-mix(in srgb, var(--bath-body-paper) 88%, transparent);
  border-color: var(--bath-body-line);
}

.th-p-bath-and-body .category-hero.bath-body-tide-hero {
  position: relative;
  isolation: isolate;
  min-height: clamp(43rem, 58vw, 56rem);
  overflow: hidden;
  background: #769797;
  color: var(--bath-body-ink);
}

.th-p-bath-and-body .bath-body-water-photo {
  position: absolute;
  inset: 0;
  z-index: -4;
  overflow: hidden;
  background: linear-gradient(135deg, #a6c0bf 0%, #7b9b99 49%, #d7b58f 100%);
}

.th-p-bath-and-body .bath-body-water-photo .hero-media,
.th-p-bath-and-body .bath-body-water-photo .theme-empty-media {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
  object-fit: cover;
  object-position: center;
}

.th-p-bath-and-body .bath-body-water-photo .theme-empty-media {
  background:
    radial-gradient(ellipse at 72% 68%, rgba(241, 229, 202, .94) 0 6%, rgba(170, 183, 168, .5) 6.5% 20%, transparent 35%),
    radial-gradient(ellipse at 58% 30%, rgba(247, 244, 232, .68) 0 5%, transparent 21%),
    linear-gradient(135deg, #a7c0bf 0%, #789c9a 47%, #d0b293 100%);
}

.th-p-bath-and-body .bath-body-hero-wash {
  position: absolute;
  inset: 0;
  z-index: -3;
  pointer-events: none;
  background:
    linear-gradient(90deg, rgba(231, 238, 230, .62) 0%, rgba(231, 238, 230, .16) 48%, rgba(8, 37, 39, .19) 100%),
    linear-gradient(0deg, rgba(9, 39, 41, .35) 0%, transparent 38%, rgba(11, 48, 51, .14) 100%);
}

.th-p-bath-and-body .bath-body-hero-rings {
  position: absolute;
  top: 50%;
  right: clamp(-15rem, -9vw, -5rem);
  z-index: -2;
  width: min(62vw, 57rem);
  aspect-ratio: 1;
  transform: translateY(-50%);
  pointer-events: none;
}

.th-p-bath-and-body .bath-body-hero-rings span {
  position: absolute;
  inset: 0;
  border: 1px solid rgba(248, 243, 234, .6);
  border-radius: 50%;
  box-shadow: inset 0 0 4rem rgba(252, 249, 239, .08);
}

.th-p-bath-and-body .bath-body-hero-rings span:nth-child(2) {
  inset: 12%;
  border-color: rgba(248, 243, 234, .47);
}

.th-p-bath-and-body .bath-body-hero-rings span:nth-child(3) {
  inset: 28%;
  border-color: rgba(248, 243, 234, .36);
}

.th-p-bath-and-body .bath-body-hero-coordinate {
  position: absolute;
  top: clamp(5.8rem, 7vw, 7.4rem);
  right: clamp(1.3rem, 4.5vw, 5rem);
  z-index: 2;
  display: flex;
  gap: .65rem;
  margin: 0;
  color: rgba(247, 244, 233, .92);
  font-family: var(--font-body, 'Outfit', sans-serif);
  font-size: .62rem;
  font-weight: 600;
  letter-spacing: .18em;
  line-height: 1.3;
  text-shadow: 0 1px 14px rgba(5, 30, 31, .3);
  text-transform: uppercase;
}

.th-p-bath-and-body .bath-body-hero-coordinate span {
  color: var(--bath-body-salt);
}

.th-p-bath-and-body .bath-body-hero-stage {
  display: grid;
  min-height: clamp(43rem, 58vw, 56rem);
  padding: clamp(7.8rem, 12vw, 11rem) clamp(1.25rem, 5vw, 5.5rem) clamp(3.5rem, 5vw, 5rem);
  grid-template-columns: repeat(12, minmax(0, 1fr));
  align-items: center;
}

.th-p-bath-and-body .bath-body-hero-card {
  position: relative;
  grid-column: 2 / span 5;
  max-width: 34rem;
  padding: clamp(2rem, 4vw, 4.25rem) clamp(1.4rem, 3.8vw, 3.75rem) clamp(2.15rem, 4vw, 3.75rem);
  border: 1px solid rgba(248, 243, 234, .78);
  background: rgba(248, 243, 234, .88);
  box-shadow: 0 1.2rem 4rem rgba(14, 48, 51, .2);
  backdrop-filter: blur(7px);
}

.th-p-bath-and-body .bath-body-hero-card::before,
.th-p-bath-and-body .bath-body-hero-card::after {
  position: absolute;
  width: clamp(2.8rem, 6vw, 5.75rem);
  height: 1px;
  background: var(--bath-body-clay);
  content: '';
}

.th-p-bath-and-body .bath-body-hero-card::before {
  top: -1px;
  right: clamp(1.4rem, 3.8vw, 3.75rem);
}

.th-p-bath-and-body .bath-body-hero-card::after {
  bottom: -1px;
  left: clamp(1.4rem, 3.8vw, 3.75rem);
}

.th-p-bath-and-body .bath-body-hero-card-tab,
.th-p-bath-and-body .bath-body-section-kicker {
  margin: 0 0 1rem;
  color: var(--bath-body-clay);
  font-family: var(--font-body, 'Outfit', sans-serif);
  font-size: .62rem;
  font-weight: 700;
  letter-spacing: .2em;
  line-height: 1.4;
  text-transform: uppercase;
}

.th-p-bath-and-body .bath-body-hero-copy {
  max-width: 31rem;
}

.th-p-bath-and-body .bath-body-hero-copy .eyebrow {
  margin: 0 0 1rem;
  color: var(--bath-body-tide);
  font-family: var(--font-body, 'Outfit', sans-serif);
  font-size: .63rem;
  font-weight: 700;
  letter-spacing: .19em;
  line-height: 1.4;
  text-transform: uppercase;
}

.th-p-bath-and-body .bath-body-hero-copy h1 {
  max-width: 10ch;
  margin: 0;
  color: var(--bath-body-ink);
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: clamp(4rem, 6.8vw, 7.5rem);
  font-weight: 500;
  letter-spacing: -.07em;
  line-height: .77;
  overflow-wrap: anywhere;
  text-wrap: balance;
}

.th-p-bath-and-body .bath-body-hero-copy h1.long {
  max-width: 12ch;
  font-size: clamp(3.25rem, 5.4vw, 6rem);
  line-height: .84;
}

.th-p-bath-and-body .bath-body-hero-copy .sub {
  max-width: 28rem;
  margin: 1.5rem 0 0;
  color: #3d5555;
  font-family: var(--font-body, 'Outfit', sans-serif);
  font-size: clamp(.84rem, 1.06vw, 1rem);
  font-weight: 400;
  letter-spacing: .015em;
  line-height: 1.63;
}

.th-p-bath-and-body .bath-body-hero-copy .ctas {
  display: flex;
  flex-wrap: wrap;
  gap: .75rem;
  margin-top: 1.85rem;
}

.th-p-bath-and-body .bath-body-hero-copy .ctas a {
  display: inline-flex;
  min-height: 3rem;
  padding: .72rem 1.25rem;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--bath-body-tide);
  background: var(--bath-body-tide);
  color: #f9f5eb;
  font-family: var(--font-body, 'Outfit', sans-serif);
  font-size: .64rem;
  font-weight: 700;
  letter-spacing: .15em;
  line-height: 1.25;
  text-align: center;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-bath-and-body .bath-body-hero-copy .ctas a:hover,
.th-p-bath-and-body .bath-body-hero-copy .ctas a:focus-visible {
  border-color: var(--bath-body-clay);
  background: var(--bath-body-clay);
  color: var(--bath-body-paper);
  outline: none;
}

.th-p-bath-and-body .bath-body-hero-whisper {
  max-width: 18rem;
  margin: 1.55rem 0 0;
  color: var(--bath-body-muted);
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: 1.05rem;
  font-style: italic;
  line-height: 1.2;
}

.th-p-bath-and-body .bath-body-hero-marks {
  position: absolute;
  right: clamp(1.3rem, 4.5vw, 5rem);
  bottom: clamp(2rem, 4vw, 4.5rem);
  z-index: 2;
  display: grid;
  gap: .55rem;
  width: min(12rem, 18vw);
  pointer-events: none;
}

.th-p-bath-and-body .bath-body-hero-marks span {
  display: flex;
  min-height: 1.55rem;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(248, 243, 234, .68);
  color: rgba(248, 243, 234, .9);
  font-family: var(--font-body, 'Outfit', sans-serif);
  font-size: .59rem;
  font-weight: 600;
  letter-spacing: .18em;
  line-height: 1.2;
  text-shadow: 0 1px 10px rgba(7, 35, 36, .34);
  text-transform: uppercase;
}

.th-p-bath-and-body .bath-body-hero-marks span::after {
  color: var(--bath-body-salt);
  content: '—';
}

.th-p-bath-and-body .bath-body-tide-hero :is(.hero-motion-controls, .hero-controls, .motion-toggle) {
  position: absolute;
  right: clamp(1.3rem, 4.5vw, 5rem);
  bottom: clamp(7.6rem, 10vw, 9.2rem);
  z-index: 3;
}

.th-p-bath-and-body .bath-body-tide-hero :is(.hero-motion-controls button, .hero-controls button, .motion-toggle) {
  display: inline-flex;
  min-width: 2.75rem;
  min-height: 2.75rem;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(248, 243, 234, .76);
  border-radius: 50%;
  background: rgba(11, 47, 50, .38);
  color: var(--bath-body-paper);
  font-family: var(--font-body, 'Outfit', sans-serif);
  font-size: .58rem;
  font-weight: 700;
  letter-spacing: .08em;
}

.th-p-bath-and-body .bath-body-tide-hero :is(.hero-motion-controls button, .hero-controls button, .motion-toggle):hover,
.th-p-bath-and-body .bath-body-tide-hero :is(.hero-motion-controls button, .hero-controls button, .motion-toggle):focus-visible {
  border-color: var(--bath-body-salt);
  background: var(--bath-body-salt);
  color: var(--bath-body-deep);
  outline: none;
}

.th-p-bath-and-body .bath-body-tide-hero.has-hero-motion .bath-body-water-photo .hero-media {
  animation: p-bath-and-body-waterline-drift 18s ease-in-out infinite alternate;
}

.th-p-bath-and-body .bath-body-discovery {
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid var(--bath-body-line);
  background: var(--bath-body-plaster);
}

.th-p-bath-and-body .bath-body-waterboard {
  display: grid;
  padding: clamp(4.5rem, 8vw, 8.3rem) clamp(1.25rem, 5vw, 5.5rem) clamp(4.8rem, 7vw, 7.3rem);
  grid-template-columns: minmax(15rem, .9fr) minmax(0, 2.1fr);
  gap: clamp(2rem, 8vw, 9rem);
}

.th-p-bath-and-body .bath-body-waterboard::before {
  position: absolute;
  top: -19rem;
  left: -13rem;
  width: min(49vw, 46rem);
  aspect-ratio: 1;
  border: 1px solid rgba(23, 68, 71, .1);
  border-radius: 50%;
  box-shadow: 0 0 0 2.9rem rgba(23, 68, 71, .025), 0 0 0 7rem rgba(23, 68, 71, .018);
  content: '';
  pointer-events: none;
}

.th-p-bath-and-body .bath-body-waterboard-intro {
  position: relative;
  z-index: 1;
  align-self: start;
  max-width: 23rem;
}

.th-p-bath-and-body .bath-body-waterboard-intro h2,
.th-p-bath-and-body .bath-body-present-edit-intro h2 {
  max-width: 9.5ch;
  margin: 0;
  color: var(--bath-body-ink);
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: clamp(3rem, 4.5vw, 5.3rem);
  font-weight: 500;
  letter-spacing: -.067em;
  line-height: .82;
  overflow-wrap: anywhere;
  text-wrap: balance;
}

.th-p-bath-and-body .bath-body-waterboard-intro > p:not(.bath-body-section-kicker) {
  max-width: 20rem;
  margin: 1.55rem 0 0;
  color: var(--bath-body-muted);
  font-family: var(--font-body, 'Outfit', sans-serif);
  font-size: .91rem;
  line-height: 1.65;
}

.th-p-bath-and-body .bath-body-waterboard-rule {
  display: block;
  width: 4.5rem;
  height: 1px;
  margin-top: 2.4rem;
  background: var(--bath-body-clay);
}

.th-p-bath-and-body .bath-body-waterboard-list {
  position: relative;
  z-index: 1;
  display: grid;
  margin: 0;
  padding: 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  list-style: none;
  border-top: 1px solid var(--bath-body-ink);
  border-left: 1px solid var(--bath-body-line);
}

.th-p-bath-and-body .bath-body-waterboard-list li {
  min-width: 0;
  margin: 0;
  padding: 0;
  border-right: 1px solid var(--bath-body-line);
  border-bottom: 1px solid var(--bath-body-line);
}

.th-p-bath-and-body .bath-body-waterboard-entry {
  display: grid;
  min-height: clamp(13rem, 21vw, 18rem);
  padding: clamp(1.1rem, 2.3vw, 2rem);
  grid-template-columns: 1.8rem 1fr;
  grid-template-rows: auto 1fr auto;
  column-gap: .8rem;
  color: var(--bath-body-ink);
  text-decoration: none;
}

.th-p-bath-and-body .bath-body-waterboard-entry:hover,
.th-p-bath-and-body .bath-body-waterboard-entry:focus-visible {
  background: var(--bath-body-paper);
  color: var(--bath-body-tide);
  outline: none;
}

.th-p-bath-and-body .bath-body-entry-number {
  grid-column: 1;
  grid-row: 1;
  color: var(--bath-body-clay);
  font-family: var(--font-body, 'Outfit', sans-serif);
  font-size: .6rem;
  font-weight: 700;
  letter-spacing: .14em;
  line-height: 1.4;
}

.th-p-bath-and-body .bath-body-entry-pool {
  position: relative;
  grid-column: 2;
  grid-row: 1 / span 2;
  justify-self: end;
  width: clamp(4.5rem, 8vw, 7rem);
  aspect-ratio: 1;
  border: 1px solid rgba(23, 68, 71, .34);
  border-radius: 50%;
}

.th-p-bath-and-body .bath-body-entry-pool::before,
.th-p-bath-and-body .bath-body-entry-pool::after,
.th-p-bath-and-body .bath-body-entry-pool i {
  position: absolute;
  border: 1px solid rgba(23, 68, 71, .28);
  border-radius: 50%;
  content: '';
}

.th-p-bath-and-body .bath-body-entry-pool::before {
  inset: 16%;
}

.th-p-bath-and-body .bath-body-entry-pool::after {
  inset: 35%;
}

.th-p-bath-and-body .bath-body-entry-pool i {
  inset: 49%;
  border-color: var(--bath-body-clay);
  background: var(--bath-body-clay);
}

.th-p-bath-and-body .bath-body-waterboard-list li:nth-child(2n) .bath-body-entry-pool {
  border-color: rgba(198, 107, 75, .55);
}

.th-p-bath-and-body .bath-body-waterboard-list li:nth-child(3n) .bath-body-entry-pool i {
  background: var(--bath-body-tide);
  border-color: var(--bath-body-tide);
}

.th-p-bath-and-body .bath-body-entry-copy {
  display: block;
  grid-column: 1 / -1;
  grid-row: 3;
  margin-top: 1rem;
}

.th-p-bath-and-body .bath-body-entry-copy strong {
  display: block;
  max-width: 11ch;
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: clamp(2rem, 2.7vw, 3.3rem);
  font-weight: 500;
  letter-spacing: -.06em;
  line-height: .86;
  overflow-wrap: anywhere;
}

.th-p-bath-and-body .bath-body-entry-copy small {
  display: block;
  margin-top: .85rem;
  color: var(--bath-body-muted);
  font-family: var(--font-body, 'Outfit', sans-serif);
  font-size: .64rem;
  font-weight: 600;
  letter-spacing: .125em;
  line-height: 1.45;
  text-transform: uppercase;
}

.th-p-bath-and-body .bath-body-entry-arrow {
  grid-column: 2;
  grid-row: 3;
  align-self: end;
  justify-self: end;
  color: var(--bath-body-clay);
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: 1.55rem;
  line-height: 1;
}

.th-p-bath-and-body .bath-body-present-edit {
  padding: clamp(4.2rem, 7vw, 7.3rem) clamp(1.25rem, 5vw, 5.5rem) clamp(4.7rem, 7vw, 7.2rem);
}

.th-p-bath-and-body .bath-body-present-edit-intro {
  max-width: 31rem;
}

.th-p-bath-and-body .bath-body-present-edit-grid {
  display: grid;
  margin-top: clamp(2rem, 4vw, 3.6rem);
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  border: 1px solid var(--bath-body-line);
  background: var(--bath-body-line);
}

.th-p-bath-and-body .bath-body-present-edit-grid > * {
  min-width: 0;
  background: var(--bath-body-paper);
}

.th-p-bath-and-body #shop {
  padding: clamp(4.5rem, 7vw, 7.4rem) clamp(1.25rem, 5vw, 5.5rem);
  background: var(--bath-body-paper);
}

.th-p-bath-and-body #shop > :is(h2, .section-title) {
  max-width: 11ch;
  color: var(--bath-body-ink);
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: clamp(3rem, 4.6vw, 5.45rem);
  font-weight: 500;
  letter-spacing: -.067em;
  line-height: .83;
  overflow-wrap: anywhere;
}

.th-p-bath-and-body #shop > :is(p, .section-subtitle) {
  max-width: 34rem;
  color: var(--bath-body-muted);
  font-family: var(--font-body, 'Outfit', sans-serif);
}

.th-p-bath-and-body :is(.products, .product-grid) {
  gap: 1px;
}

.th-p-bath-and-body :is(.product-card, .card) {
  border-color: var(--bath-body-line);
  border-radius: 0;
  background: var(--bath-body-paper);
}

.th-p-bath-and-body :is(.product-card, .card) :is(h3, .product-title) {
  color: var(--bath-body-ink);
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-weight: 500;
  letter-spacing: -.035em;
}

.th-p-bath-and-body a:focus-visible {
  outline: 2px solid var(--bath-body-clay);
  outline-offset: 4px;
}

@keyframes p-bath-and-body-waterline-drift {
  from { transform: scale(1.012) translate3d(0, 0, 0); }
  to { transform: scale(1.065) translate3d(-.45%, -.6%, 0); }
}

@media (max-width: 900px) {
  .th-p-bath-and-body .bath-body-hero-card {
    grid-column: 1 / span 6;
  }

  .th-p-bath-and-body .bath-body-waterboard {
    grid-template-columns: minmax(15rem, .72fr) minmax(0, 1.5fr);
    gap: clamp(2rem, 5vw, 4rem);
  }
}

@media (max-width: 680px) {
  .th-p-bath-and-body .category-hero.bath-body-tide-hero {
    min-height: 45.5rem;
  }

  .th-p-bath-and-body .bath-body-water-photo {
    inset: 0 0 42% 0;
  }

  .th-p-bath-and-body .bath-body-water-photo .hero-media {
    object-position: 62% center;
  }

  .th-p-bath-and-body .bath-body-hero-wash {
    background:
      linear-gradient(0deg, rgba(234, 238, 229, .98) 0%, rgba(234, 238, 229, .92) 39%, rgba(234, 238, 229, .16) 72%, rgba(10, 45, 47, .16) 100%),
      linear-gradient(90deg, rgba(234, 238, 229, .1), rgba(234, 238, 229, .1));
  }

  .th-p-bath-and-body .bath-body-hero-rings {
    top: 23%;
    right: -20%;
    width: 86vw;
  }

  .th-p-bath-and-body .bath-body-hero-coordinate {
    top: 5.1rem;
    right: 1.25rem;
    font-size: .53rem;
  }

  .th-p-bath-and-body .bath-body-hero-stage {
    min-height: 45.5rem;
    padding: 21rem 1.25rem 2.2rem;
    display: block;
  }

  .th-p-bath-and-body .bath-body-hero-card {
    max-width: 100%;
    padding: 1.65rem 1.25rem 1.8rem;
    background: transparent;
    border-color: transparent;
    box-shadow: none;
    backdrop-filter: none;
  }

  .th-p-bath-and-body .bath-body-hero-card::before,
  .th-p-bath-and-body .bath-body-hero-card::after,
  .th-p-bath-and-body .bath-body-hero-card-tab {
    display: none;
  }

  .th-p-bath-and-body .bath-body-hero-copy h1 {
    max-width: 10.5ch;
    font-size: clamp(3.5rem, 15vw, 5.25rem);
    line-height: .78;
  }

  .th-p-bath-and-body .bath-body-hero-copy h1.long {
    max-width: 13ch;
    font-size: clamp(2.9rem, 12vw, 4rem);
    line-height: .85;
  }

  .th-p-bath-and-body .bath-body-hero-copy .sub {
    margin-top: 1.1rem;
    font-size: .8rem;
    line-height: 1.56;
  }

  .th-p-bath-and-body .bath-body-hero-copy .ctas {
    margin-top: 1.35rem;
  }

  .th-p-bath-and-body .bath-body-hero-copy .ctas a {
    width: 100%;
  }

  .th-p-bath-and-body .bath-body-hero-whisper,
  .th-p-bath-and-body .bath-body-hero-marks {
    display: none;
  }

  .th-p-bath-and-body .bath-body-tide-hero :is(.hero-motion-controls, .hero-controls, .motion-toggle) {
    top: 1rem;
    right: 1rem;
    bottom: auto;
  }

  .th-p-bath-and-body .bath-body-waterboard {
    display: block;
    padding: 4.15rem 1.25rem 4.5rem;
  }

  .th-p-bath-and-body .bath-body-waterboard-intro {
    max-width: 28rem;
  }

  .th-p-bath-and-body .bath-body-waterboard-intro h2,
  .th-p-bath-and-body .bath-body-present-edit-intro h2 {
    max-width: 10ch;
    font-size: clamp(3rem, 12.8vw, 4.5rem);
  }

  .th-p-bath-and-body .bath-body-waterboard-intro > p:not(.bath-body-section-kicker) {
    margin-top: 1.15rem;
    font-size: .84rem;
  }

  .th-p-bath-and-body .bath-body-waterboard-rule {
    margin-top: 1.75rem;
  }

  .th-p-bath-and-body .bath-body-waterboard-list {
    margin-top: 2.8rem;
    grid-template-columns: 1fr;
  }

  .th-p-bath-and-body .bath-body-waterboard-entry {
    min-height: 10.5rem;
    padding: 1.1rem;
    grid-template-columns: 1.7rem 1fr;
  }

  .th-p-bath-and-body .bath-body-entry-pool {
    width: 4.65rem;
  }

  .th-p-bath-and-body .bath-body-entry-copy strong {
    max-width: 14ch;
    font-size: clamp(2rem, 9vw, 2.9rem);
  }

  .th-p-bath-and-body .bath-body-entry-copy small {
    margin-top: .55rem;
    font-size: .59rem;
  }

  .th-p-bath-and-body .bath-body-present-edit {
    padding: 4rem 1.25rem 4.5rem;
  }

  .th-p-bath-and-body .bath-body-present-edit-grid {
    grid-template-columns: 1fr;
  }

  .th-p-bath-and-body #shop {
    padding: 4.1rem 1.25rem 4.7rem;
  }
}

@media (max-width: 390px) {
  .th-p-bath-and-body .category-hero.bath-body-tide-hero,
  .th-p-bath-and-body .bath-body-hero-stage {
    min-height: 43.8rem;
  }

  .th-p-bath-and-body .bath-body-water-photo {
    inset: 0 0 44% 0;
  }

  .th-p-bath-and-body .bath-body-hero-stage {
    padding-top: 19rem;
  }

  .th-p-bath-and-body .bath-body-hero-copy h1 {
    font-size: clamp(3.22rem, 14.5vw, 4.4rem);
  }

  .th-p-bath-and-body .bath-body-waterboard-entry {
    min-height: 9.8rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .th-p-bath-and-body .bath-body-tide-hero.has-hero-motion .bath-body-water-photo .hero-media {
    animation: none;
    transform: none;
  }
}
`;

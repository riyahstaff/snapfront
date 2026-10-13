import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-grooming-and-shaving',
  name: 'CINDER & STEEL',
  for: 'considered grooming and shaving rituals built around useful tools',
  vibe: 'a smoked-oak barber ledger, warm metal, quiet lather, and deliberate daily care',
  category: 'Grooming and shaving essentials',
  group: 'beauty',
  display: 'Cormorant Garamond',
  body: 'Space Grotesk',
  displayWeight: 600,
  tracking: '-.045em',
  colors: {
    bg: '#E9E2D5',
    surface: '#F7F2E9',
    ink: '#231E19',
    muted: '#756A5D',
    line: '#CBBEAD',
    accent: '#45513B',
    onAccent: '#FFFDF8',
    panel: '#312B24',
    onPanel: '#F7F0E5',
    foot: '#201B16',
    onFoot: '#F7F0E5',
    bar: '#EEE5D8',
    onBar: '#231E19',
    badge: '#D7C38C',
    onBadge: '#2A241A'
  },
  header: 'center',
  hero: 'type',
  card: 'bold',
  ratio: '4/5',
  rCard: 0,
  rBtn: 0,
  motion: 'pan',
  copy: {
    eyebrow: 'The daily register',
    collection: 'The tool index',
    cta: 'Browse the tools',
    title: 'Take your time with the close work.',
    subtitle: 'An exacting edit for the minutes that begin the day.'
  }
});

const entryNumber = (index) => String(index + 1).padStart(2, '0');

const entryCount = (value) => {
  const count = Number(value) || 0;
  return `${count} ${count === 1 ? 'piece' : 'pieces'}`;
};

export function hero(ctx) {
  return `
    <section class="hero category-hero p-grooming-ledger-hero${ctx.heroClass}"${ctx.heroAttrs}>
      <div class="p-grooming-hero-photo">
        ${ctx.media(0, { priority: true, lazy: false, decorative: false })}
      </div>
      <div class="p-grooming-hero-wash" aria-hidden="true"></div>
      <div class="p-grooming-hero-register-lines" aria-hidden="true"><i></i><i></i><i></i></div>
      <p class="p-grooming-hero-folio" aria-hidden="true"><span>Folio 01</span><span>Daily maintenance</span></p>
      <div class="p-grooming-hero-ledger">
        <div class="p-grooming-hero-ledger-mark" aria-hidden="true"><span>•</span><span>•</span><span>•</span></div>
        ${ctx.copy('p-grooming-hero-copy')}
        <p class="p-grooming-hero-caption">A small practice, precisely kept.</p>
      </div>
      <p class="p-grooming-hero-edition" aria-hidden="true">Tools / water / time</p>
      ${ctx.controls}
    </section>
  `;
}

export function discovery(ctx) {
  const categories = (ctx.cats || []).filter((category) => category && category.name).slice(0, 4);
  const products = (ctx.products || []).slice(0, 4);

  if (categories.length >= 2) {
    const entries = categories.map((category, index) => {
      const photoIndex = index + 1;
      const hasPhoto = Boolean(ctx.pics && ctx.pics[photoIndex]);
      const visual = hasPhoto
        ? `<div class="p-grooming-tool-media">${ctx.media(photoIndex, { lazy: true, decorative: true })}</div>`
        : `<div class="p-grooming-tool-still p-grooming-tool-still-${(index % 4) + 1}" aria-hidden="true"><span></span></div>`;

      return `
        <li class="p-grooming-tool-card">
          <a href="${ctx.categoryLink(category.name)}">
            <span class="p-grooming-tool-number">${entryNumber(index)}</span>
            ${visual}
            <span class="p-grooming-tool-meta">
              <span class="p-grooming-tool-name">${ctx.esc(category.name)}</span>
              <span class="p-grooming-tool-count">${ctx.esc(entryCount(category.count))}</span>
            </span>
            <span class="p-grooming-tool-arrow" aria-hidden="true">↗</span>
          </a>
        </li>
      `;
    }).join('');

    return `
      <section class="p-grooming-discovery p-grooming-tool-index" aria-labelledby="p-grooming-tool-index-title">
        <div class="p-grooming-index-heading">
          <p class="p-grooming-kicker">${ctx.esc(ctx.t.copy.collection)}</p>
          <h2 id="p-grooming-tool-index-title">Find the part<br>of the practice.</h2>
          <p>Choose an open collection and make the everyday ritual your own.</p>
        </div>
        <ol class="p-grooming-tool-list">
          ${entries}
        </ol>
      </section>
    `;
  }

  if (products.length) {
    return `
      <section class="p-grooming-discovery p-grooming-current-edit" aria-labelledby="p-grooming-current-edit-title">
        <div class="p-grooming-index-heading">
          <p class="p-grooming-kicker">The current edit</p>
          <h2 id="p-grooming-current-edit-title">The tools on the bench.</h2>
        </div>
        <div class="p-grooming-current-edit-grid">
          ${products.map((product) => ctx.productCard(product)).join('')}
        </div>
      </section>
    `;
  }

  return '';
}

export const css = `
.th-p-grooming-and-shaving {
  --p-grooming-paper: #e9e2d5;
  --p-grooming-cream: #f7f2e9;
  --p-grooming-ink: #231e19;
  --p-grooming-charcoal: #312b24;
  --p-grooming-moss: #45513b;
  --p-grooming-brass: #b59a61;
  --p-grooming-line: #cbbead;
  --p-grooming-muted: #756a5d;
  background: var(--p-grooming-paper);
  color: var(--p-grooming-ink);
  overflow-x: clip;
}

.th-p-grooming-and-shaving .hd,
.th-p-grooming-and-shaving .site-header,
.th-p-grooming-and-shaving .store-header {
  border-color: var(--p-grooming-line);
  background: var(--p-grooming-cream);
}

.th-p-grooming-and-shaving .hd a,
.th-p-grooming-and-shaving .site-header a,
.th-p-grooming-and-shaving .store-header a {
  color: var(--p-grooming-ink);
}

.th-p-grooming-and-shaving .category-hero.p-grooming-ledger-hero {
  position: relative;
  isolation: isolate;
  display: grid;
  min-height: clamp(42rem, 61vw, 56rem);
  overflow: hidden;
  place-items: center;
  background: #28221b;
  color: #fffaf0;
}

.th-p-grooming-and-shaving .p-grooming-hero-photo {
  position: absolute;
  inset: 0;
  z-index: -4;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 50% 48%, rgba(152, 125, 83, .46) 0 9%, transparent 35%),
    linear-gradient(112deg, #251e18, #514535 51%, #1e1b16);
}

.th-p-grooming-and-shaving .p-grooming-hero-photo .hero-media,
.th-p-grooming-and-shaving .p-grooming-hero-photo .theme-empty-media {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
  object-fit: cover;
  object-position: center;
}

.th-p-grooming-and-shaving .p-grooming-hero-photo .theme-empty-media {
  background:
    radial-gradient(ellipse at 16% 76%, #ada093 0 9%, transparent 9.5%),
    radial-gradient(ellipse at 81% 31%, #ece3d1 0 7%, #aa936d 7.5% 16%, transparent 16.5%),
    linear-gradient(122deg, #4f4132, #211c17 64%, #594a37);
}

.th-p-grooming-and-shaving .p-grooming-hero-wash {
  position: absolute;
  inset: 0;
  z-index: -3;
  pointer-events: none;
  background:
    linear-gradient(90deg, rgba(21, 18, 14, .54) 0%, rgba(28, 22, 16, .06) 35%, rgba(20, 17, 13, .13) 63%, rgba(19, 15, 11, .66) 100%),
    linear-gradient(0deg, rgba(18, 15, 11, .67) 0%, transparent 45%, rgba(16, 13, 10, .21) 100%);
}

.th-p-grooming-and-shaving .p-grooming-hero-register-lines {
  position: absolute;
  inset: clamp(5.5rem, 8vw, 7.8rem) clamp(1.25rem, 4.9vw, 5.5rem) clamp(2.7rem, 4.5vw, 4.2rem);
  z-index: -1;
  display: grid;
  grid-template-rows: 1fr 1fr 1fr;
  pointer-events: none;
}

.th-p-grooming-and-shaving .p-grooming-hero-register-lines i {
  display: block;
  border-top: 1px solid rgba(250, 238, 217, .25);
}

.th-p-grooming-and-shaving .p-grooming-hero-register-lines i:last-child {
  border-bottom: 1px solid rgba(250, 238, 217, .25);
}

.th-p-grooming-and-shaving .p-grooming-hero-folio {
  position: absolute;
  top: clamp(5.55rem, 8vw, 7.85rem);
  left: clamp(1.25rem, 4.9vw, 5.5rem);
  z-index: 1;
  display: flex;
  gap: .85rem;
  margin: 0;
  color: rgba(255, 246, 231, .86);
  font-family: var(--font-body, 'Space Grotesk', sans-serif);
  font-size: .61rem;
  font-weight: 600;
  letter-spacing: .18em;
  line-height: 1.4;
  text-transform: uppercase;
}

.th-p-grooming-and-shaving .p-grooming-hero-folio span + span {
  padding-left: .85rem;
  border-left: 1px solid rgba(255, 246, 231, .45);
}

.th-p-grooming-and-shaving .p-grooming-hero-ledger {
  position: relative;
  z-index: 1;
  width: min(43rem, calc(100% - 3rem));
  margin-top: 3rem;
  padding: clamp(2.4rem, 4.8vw, 4.8rem) clamp(1.3rem, 5.7vw, 5.8rem) clamp(2rem, 4vw, 3.5rem);
  border-top: 1px solid rgba(255, 245, 226, .8);
  border-bottom: 1px solid rgba(255, 245, 226, .8);
  background: linear-gradient(90deg, rgba(43, 35, 26, .7), rgba(44, 35, 26, .18), rgba(43, 35, 26, .7));
  text-align: center;
}

.th-p-grooming-and-shaving .p-grooming-hero-ledger::before,
.th-p-grooming-and-shaving .p-grooming-hero-ledger::after {
  position: absolute;
  top: -1px;
  bottom: -1px;
  width: 1px;
  background: rgba(255, 245, 226, .48);
  content: '';
}

.th-p-grooming-and-shaving .p-grooming-hero-ledger::before {
  left: 1rem;
}

.th-p-grooming-and-shaving .p-grooming-hero-ledger::after {
  right: 1rem;
}

.th-p-grooming-and-shaving .p-grooming-hero-ledger-mark {
  display: flex;
  margin-bottom: 1.2rem;
  justify-content: center;
  gap: .35rem;
  color: var(--p-grooming-brass);
  font-size: .72rem;
  line-height: 1;
}

.th-p-grooming-and-shaving .p-grooming-hero-copy {
  max-width: 36rem;
  margin: 0 auto;
}

.th-p-grooming-and-shaving .p-grooming-hero-copy .eyebrow,
.th-p-grooming-and-shaving .p-grooming-kicker {
  margin: 0 0 .95rem;
  color: var(--p-grooming-brass);
  font-family: var(--font-body, 'Space Grotesk', sans-serif);
  font-size: .62rem;
  font-weight: 700;
  letter-spacing: .22em;
  line-height: 1.45;
  text-transform: uppercase;
}

.th-p-grooming-and-shaving .p-grooming-hero-copy h1 {
  max-width: 14ch;
  margin: 0 auto;
  color: #fffaf0;
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: clamp(3.5rem, 7.4vw, 7.9rem);
  font-weight: 600;
  letter-spacing: -.075em;
  line-height: .8;
  overflow-wrap: anywhere;
  text-wrap: balance;
}

.th-p-grooming-and-shaving .p-grooming-hero-copy h1.long {
  max-width: 18ch;
  font-size: clamp(2.8rem, 5.4vw, 5.6rem);
  line-height: .89;
}

.th-p-grooming-and-shaving .p-grooming-hero-copy .sub {
  max-width: 35rem;
  margin: 1.5rem auto 0;
  color: rgba(255, 246, 231, .86);
  font-family: var(--font-body, 'Space Grotesk', sans-serif);
  font-size: clamp(.8rem, 1.15vw, .98rem);
  letter-spacing: .065em;
  line-height: 1.65;
  overflow-wrap: anywhere;
}

.th-p-grooming-and-shaving .p-grooming-hero-copy .ctas {
  display: flex;
  margin-top: 1.8rem;
  justify-content: center;
  flex-wrap: wrap;
  gap: .7rem;
}

.th-p-grooming-and-shaving .p-grooming-hero-copy .ctas a {
  display: inline-flex;
  min-height: 3rem;
  padding: .72rem 1.2rem;
  align-items: center;
  justify-content: center;
  border: 1px solid #fff8ea;
  background: #fff8ea;
  color: #332b20;
  font-family: var(--font-body, 'Space Grotesk', sans-serif);
  font-size: .67rem;
  font-weight: 700;
  letter-spacing: .16em;
  line-height: 1.2;
  text-align: center;
  text-decoration: none;
  text-transform: uppercase;
}

.th-p-grooming-and-shaving .p-grooming-hero-copy .ctas a.ghost {
  background: rgba(33, 27, 21, .35);
  color: #fff8ea;
}

.th-p-grooming-and-shaving .p-grooming-hero-copy .ctas a:hover,
.th-p-grooming-and-shaving .p-grooming-hero-copy .ctas a:focus-visible {
  border-color: var(--p-grooming-brass);
  background: var(--p-grooming-brass);
  color: #211b15;
  outline: none;
}

.th-p-grooming-and-shaving .p-grooming-hero-caption {
  margin: 1.5rem 0 0;
  color: rgba(255, 246, 231, .71);
  font-family: var(--font-body, 'Space Grotesk', sans-serif);
  font-size: .59rem;
  font-weight: 600;
  letter-spacing: .18em;
  line-height: 1.5;
  text-transform: uppercase;
}

.th-p-grooming-and-shaving .p-grooming-hero-edition {
  position: absolute;
  right: clamp(1.25rem, 4.9vw, 5.5rem);
  bottom: clamp(2.55rem, 4.5vw, 4.2rem);
  z-index: 1;
  margin: 0;
  color: rgba(255, 246, 231, .86);
  font-family: var(--font-body, 'Space Grotesk', sans-serif);
  font-size: .61rem;
  font-weight: 600;
  letter-spacing: .18em;
  line-height: 1.4;
  text-transform: uppercase;
}

.th-p-grooming-and-shaving .p-grooming-ledger-hero .motion-toggle,
.th-p-grooming-and-shaving .p-grooming-ledger-hero .hero-motion-controls button,
.th-p-grooming-and-shaving .p-grooming-ledger-hero .hero-controls button {
  position: absolute;
  right: clamp(1.25rem, 4.9vw, 5.5rem);
  bottom: clamp(4.8rem, 6.7vw, 6.1rem);
  z-index: 2;
  min-width: 2.75rem;
  min-height: 2.75rem;
  border: 1px solid rgba(255, 246, 231, .72);
  border-radius: 50%;
  background: rgba(32, 26, 20, .46);
  color: #fff8ea;
}

.th-p-grooming-and-shaving .p-grooming-ledger-hero.has-hero-motion .p-grooming-hero-photo .hero-media {
  animation: p-grooming-and-shaving-pan 18s ease-in-out infinite alternate;
}

.th-p-grooming-and-shaving .p-grooming-discovery {
  padding: clamp(4rem, 7.5vw, 8rem) clamp(1.25rem, 5vw, 5.5rem);
  background: var(--p-grooming-paper);
}

.th-p-grooming-and-shaving .p-grooming-tool-index {
  display: grid;
  grid-template-columns: minmax(14rem, .78fr) minmax(0, 2.2fr);
  gap: clamp(2.4rem, 6vw, 7rem);
  border-bottom: 1px solid var(--p-grooming-line);
}

.th-p-grooming-and-shaving .p-grooming-index-heading {
  align-self: start;
  max-width: 22rem;
}

.th-p-grooming-and-shaving .p-grooming-index-heading h2 {
  margin: 0;
  color: var(--p-grooming-ink);
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: clamp(2.6rem, 4.15vw, 4.8rem);
  font-weight: 600;
  letter-spacing: -.065em;
  line-height: .86;
  overflow-wrap: anywhere;
}

.th-p-grooming-and-shaving .p-grooming-index-heading > p:not(.p-grooming-kicker) {
  max-width: 18rem;
  margin: 1.55rem 0 0;
  color: var(--p-grooming-muted);
  font-family: var(--font-body, 'Space Grotesk', sans-serif);
  font-size: .88rem;
  line-height: 1.7;
}

.th-p-grooming-and-shaving .p-grooming-tool-list {
  display: grid;
  margin: 0;
  padding: 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border-top: 1px solid var(--p-grooming-line);
  border-left: 1px solid var(--p-grooming-line);
  list-style: none;
}

.th-p-grooming-and-shaving .p-grooming-tool-card {
  min-width: 0;
  border-right: 1px solid var(--p-grooming-line);
  border-bottom: 1px solid var(--p-grooming-line);
}

.th-p-grooming-and-shaving .p-grooming-tool-card a {
  position: relative;
  display: grid;
  min-height: 19rem;
  padding: clamp(1rem, 1.8vw, 1.75rem);
  grid-template-columns: 2.25rem minmax(0, 1fr);
  grid-template-rows: minmax(10rem, 1fr) auto;
  gap: 1.1rem;
  color: var(--p-grooming-ink);
  text-decoration: none;
}

.th-p-grooming-and-shaving .p-grooming-tool-card:nth-child(2) a,
.th-p-grooming-and-shaving .p-grooming-tool-card:nth-child(3) a {
  background: rgba(255, 252, 245, .3);
}

.th-p-grooming-and-shaving .p-grooming-tool-number {
  grid-row: 1 / span 2;
  color: var(--p-grooming-moss);
  font-family: var(--font-body, 'Space Grotesk', sans-serif);
  font-size: .63rem;
  font-weight: 700;
  letter-spacing: .12em;
  line-height: 1.2;
}

.th-p-grooming-and-shaving .p-grooming-tool-media,
.th-p-grooming-and-shaving .p-grooming-tool-still {
  position: relative;
  width: 100%;
  min-height: 10rem;
  overflow: hidden;
  background: #beb4a5;
}

.th-p-grooming-and-shaving .p-grooming-tool-media .hero-media,
.th-p-grooming-and-shaving .p-grooming-tool-media .theme-empty-media {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
  object-fit: cover;
}

.th-p-grooming-and-shaving .p-grooming-tool-still {
  display: grid;
  place-items: center;
  background:
    linear-gradient(35deg, transparent 42%, rgba(35, 30, 25, .2) 42.5% 46%, transparent 46.5%),
    linear-gradient(135deg, #d7cdbd, #968a78);
}

.th-p-grooming-and-shaving .p-grooming-tool-still::before {
  width: 20%;
  height: 59%;
  border: 1px solid rgba(47, 38, 28, .5);
  border-radius: 48% 48% 12% 12%;
  background: rgba(247, 242, 233, .65);
  box-shadow: 0 .8rem 1.5rem rgba(45, 37, 28, .15);
  content: '';
}

.th-p-grooming-and-shaving .p-grooming-tool-still span {
  position: absolute;
  width: 40%;
  height: 1px;
  background: rgba(47, 38, 28, .44);
  transform: rotate(-28deg);
}

.th-p-grooming-and-shaving .p-grooming-tool-still-2 {
  background:
    radial-gradient(circle at 50% 50%, transparent 0 22%, rgba(57, 74, 50, .58) 22.5% 23.5%, transparent 24% 32%, rgba(247, 242, 233, .7) 32.5% 33.5%, transparent 34%),
    linear-gradient(135deg, #e3dacb, #9ba693);
}

.th-p-grooming-and-shaving .p-grooming-tool-still-2::before {
  width: 39%;
  height: 39%;
  border-radius: 50%;
}

.th-p-grooming-and-shaving .p-grooming-tool-still-3 {
  background:
    linear-gradient(90deg, transparent 47%, rgba(255, 255, 255, .52) 47.5% 52.5%, transparent 53%),
    linear-gradient(135deg, #9b8b70, #e2d6c5);
}

.th-p-grooming-and-shaving .p-grooming-tool-still-3::before {
  width: 15%;
  height: 67%;
  border-radius: 50% 50% 18% 18%;
}

.th-p-grooming-and-shaving .p-grooming-tool-still-4 {
  background:
    radial-gradient(ellipse at 63% 54%, rgba(244, 236, 219, .94) 0 16%, rgba(49, 43, 35, .28) 16.5% 17.5%, transparent 18%),
    linear-gradient(135deg, #b1b39f, #dcd2c1);
}

.th-p-grooming-and-shaving .p-grooming-tool-still-4::before {
  width: 29%;
  height: 29%;
  border-radius: 50%;
}

.th-p-grooming-and-shaving .p-grooming-tool-meta {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-self: end;
}

.th-p-grooming-and-shaving .p-grooming-tool-name {
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: clamp(1.45rem, 2vw, 2.15rem);
  font-weight: 600;
  letter-spacing: -.045em;
  line-height: .95;
  overflow-wrap: anywhere;
}

.th-p-grooming-and-shaving .p-grooming-tool-count {
  margin-top: .65rem;
  color: var(--p-grooming-muted);
  font-family: var(--font-body, 'Space Grotesk', sans-serif);
  font-size: .64rem;
  font-weight: 600;
  letter-spacing: .14em;
  line-height: 1.4;
  text-transform: uppercase;
}

.th-p-grooming-and-shaving .p-grooming-tool-arrow {
  position: absolute;
  right: clamp(1rem, 1.8vw, 1.75rem);
  bottom: clamp(1rem, 1.8vw, 1.75rem);
  color: var(--p-grooming-moss);
  font-family: var(--font-body, 'Space Grotesk', sans-serif);
  font-size: 1.25rem;
  line-height: 1;
}

.th-p-grooming-and-shaving .p-grooming-tool-card a:hover,
.th-p-grooming-and-shaving .p-grooming-tool-card a:focus-visible {
  background: var(--p-grooming-charcoal);
  color: #fff8ea;
  outline: none;
}

.th-p-grooming-and-shaving .p-grooming-tool-card a:hover .p-grooming-tool-number,
.th-p-grooming-and-shaving .p-grooming-tool-card a:hover .p-grooming-tool-arrow,
.th-p-grooming-and-shaving .p-grooming-tool-card a:focus-visible .p-grooming-tool-number,
.th-p-grooming-and-shaving .p-grooming-tool-card a:focus-visible .p-grooming-tool-arrow {
  color: var(--p-grooming-brass);
}

.th-p-grooming-and-shaving .p-grooming-tool-card a:hover .p-grooming-tool-count,
.th-p-grooming-and-shaving .p-grooming-tool-card a:focus-visible .p-grooming-tool-count {
  color: rgba(255, 248, 234, .7);
}

.th-p-grooming-and-shaving .p-grooming-current-edit {
  border-bottom: 1px solid var(--p-grooming-line);
}

.th-p-grooming-and-shaving .p-grooming-current-edit-grid {
  display: grid;
  margin-top: 2.6rem;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1px;
  background: var(--p-grooming-line);
}

.th-p-grooming-and-shaving .p-grooming-current-edit-grid > * {
  min-width: 0;
  background: var(--p-grooming-cream);
}

.th-p-grooming-and-shaving #shop {
  padding: clamp(3.9rem, 6.5vw, 7.2rem) clamp(1.25rem, 5vw, 5.5rem);
  background: var(--p-grooming-cream);
}

.th-p-grooming-and-shaving #shop > h2,
.th-p-grooming-and-shaving #shop .section-title {
  max-width: 14ch;
  color: var(--p-grooming-ink);
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: clamp(2.65rem, 4.7vw, 5.2rem);
  font-weight: 600;
  letter-spacing: -.065em;
  line-height: .86;
  overflow-wrap: anywhere;
}

.th-p-grooming-and-shaving .products,
.th-p-grooming-and-shaving .product-grid {
  gap: 1px;
}

.th-p-grooming-and-shaving .product-card {
  border-color: var(--p-grooming-line);
  border-radius: 0;
  background: var(--p-grooming-cream);
}

.th-p-grooming-and-shaving .product-card a:focus-visible,
.th-p-grooming-and-shaving a:focus-visible {
  outline: 2px solid var(--p-grooming-moss);
  outline-offset: 3px;
}

@keyframes p-grooming-and-shaving-pan {
  from { transform: scale(1.01) translate3d(0, 0, 0); }
  to { transform: scale(1.06) translate3d(-.65%, -.45%, 0); }
}

@media (max-width: 760px) {
  .th-p-grooming-and-shaving .category-hero.p-grooming-ledger-hero {
    display: block;
    min-height: 46rem;
  }

  .th-p-grooming-and-shaving .p-grooming-hero-photo {
    inset: 0 0 38% 0;
  }

  .th-p-grooming-and-shaving .p-grooming-hero-wash {
    background:
      linear-gradient(0deg, rgba(26, 21, 16, .88) 0%, rgba(28, 22, 17, .28) 45%, rgba(23, 18, 14, .18) 100%),
      linear-gradient(90deg, rgba(19, 15, 11, .22), rgba(19, 15, 11, .22));
  }

  .th-p-grooming-and-shaving .p-grooming-hero-register-lines {
    inset: 1rem 1rem 1rem;
  }

  .th-p-grooming-and-shaving .p-grooming-hero-folio {
    top: 1.45rem;
    left: 1.25rem;
    font-size: .54rem;
  }

  .th-p-grooming-and-shaving .p-grooming-hero-ledger {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    width: auto;
    margin: 0;
    padding: 2rem 1.3rem 2.2rem;
    border-bottom: 0;
    background: linear-gradient(180deg, rgba(38, 31, 23, .08), rgba(38, 31, 23, .92) 20%, #2a241d 100%);
  }

  .th-p-grooming-and-shaving .p-grooming-hero-ledger::before,
  .th-p-grooming-and-shaving .p-grooming-hero-ledger::after {
    display: none;
  }

  .th-p-grooming-and-shaving .p-grooming-hero-ledger-mark {
    margin-bottom: .85rem;
  }

  .th-p-grooming-and-shaving .p-grooming-hero-copy h1 {
    max-width: 13ch;
    font-size: clamp(3.25rem, 14vw, 4.75rem);
  }

  .th-p-grooming-and-shaving .p-grooming-hero-copy h1.long {
    max-width: 18ch;
    font-size: clamp(2.25rem, 10vw, 3.5rem);
  }

  .th-p-grooming-and-shaving .p-grooming-hero-copy .sub {
    margin-top: 1.05rem;
    font-size: .74rem;
    line-height: 1.55;
  }

  .th-p-grooming-and-shaving .p-grooming-hero-copy .ctas {
    margin-top: 1.25rem;
  }

  .th-p-grooming-and-shaving .p-grooming-hero-copy .ctas a {
    width: 100%;
  }

  .th-p-grooming-and-shaving .p-grooming-hero-caption,
  .th-p-grooming-and-shaving .p-grooming-hero-edition {
    display: none;
  }

  .th-p-grooming-and-shaving .p-grooming-ledger-hero .motion-toggle,
  .th-p-grooming-and-shaving .p-grooming-ledger-hero .hero-motion-controls button,
  .th-p-grooming-and-shaving .p-grooming-ledger-hero .hero-controls button {
    top: 1rem;
    right: 1rem;
    bottom: auto;
  }

  .th-p-grooming-and-shaving .p-grooming-discovery {
    padding: 3.9rem 1.25rem 4.2rem;
  }

  .th-p-grooming-and-shaving .p-grooming-tool-index {
    display: block;
  }

  .th-p-grooming-and-shaving .p-grooming-index-heading {
    max-width: 27rem;
  }

  .th-p-grooming-and-shaving .p-grooming-index-heading h2 {
    font-size: clamp(2.7rem, 12vw, 4rem);
  }

  .th-p-grooming-and-shaving .p-grooming-index-heading > p:not(.p-grooming-kicker) {
    max-width: 24rem;
    margin-top: 1.1rem;
  }

  .th-p-grooming-and-shaving .p-grooming-tool-list {
    margin-top: 2.7rem;
    grid-template-columns: 1fr;
  }

  .th-p-grooming-and-shaving .p-grooming-tool-card a {
    min-height: 10.4rem;
    grid-template-columns: 2.2rem 6.4rem minmax(0, 1fr);
    grid-template-rows: 1fr;
    gap: .85rem;
  }

  .th-p-grooming-and-shaving .p-grooming-tool-number {
    grid-row: auto;
    padding-top: .1rem;
  }

  .th-p-grooming-and-shaving .p-grooming-tool-media,
  .th-p-grooming-and-shaving .p-grooming-tool-still {
    min-height: 0;
    aspect-ratio: 1;
  }

  .th-p-grooming-and-shaving .p-grooming-tool-meta {
    align-self: center;
    padding-right: 1.75rem;
  }

  .th-p-grooming-and-shaving .p-grooming-tool-name {
    font-size: clamp(1.55rem, 6.4vw, 2rem);
  }

  .th-p-grooming-and-shaving .p-grooming-tool-arrow {
    right: 1rem;
    bottom: 1rem;
  }

  .th-p-grooming-and-shaving .p-grooming-current-edit-grid {
    grid-template-columns: 1fr;
  }

  .th-p-grooming-and-shaving #shop {
    padding: 3.9rem 1.25rem;
  }
}

@media (max-width: 390px) {
  .th-p-grooming-and-shaving .category-hero.p-grooming-ledger-hero {
    min-height: 44rem;
  }

  .th-p-grooming-and-shaving .p-grooming-hero-folio {
    gap: .5rem;
    letter-spacing: .13em;
  }

  .th-p-grooming-and-shaving .p-grooming-hero-folio span + span {
    padding-left: .5rem;
  }

  .th-p-grooming-and-shaving .p-grooming-hero-copy h1 {
    font-size: clamp(3rem, 13.6vw, 3.75rem);
  }

  .th-p-grooming-and-shaving .p-grooming-tool-card a {
    padding: .9rem;
    grid-template-columns: 1.8rem 5.5rem minmax(0, 1fr);
    gap: .65rem;
  }

  .th-p-grooming-and-shaving .p-grooming-tool-name {
    font-size: 1.42rem;
  }

  .th-p-grooming-and-shaving .p-grooming-tool-count {
    font-size: .57rem;
    letter-spacing: .1em;
  }
}

@media (prefers-reduced-motion: reduce) {
  .th-p-grooming-and-shaving .p-grooming-ledger-hero.has-hero-motion .p-grooming-hero-photo .hero-media {
    animation: none;
    transform: none;
  }
}
`;

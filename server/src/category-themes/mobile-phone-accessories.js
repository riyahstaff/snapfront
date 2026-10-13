import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-mobile-phone-accessories',
  name: 'SIGNAL / SHELF',
  for: 'Cases, charging, cables, and pocket-ready phone accessories',
  vibe: 'A modular charge station with bright signal colors, precision labels, and a high-contrast hardware shelf',
  category: 'Mobile phone accessories',
  group: 'technology',
  display: 'Space Grotesk',
  body: 'IBM Plex Mono',
  displayWeight: 700,
  tracking: '-.055em',
  colors: {
    bg: '#F4F1EA',
    surface: '#FFFDF8',
    ink: '#101C38',
    muted: '#64718C',
    line: '#C7CDD6',
    accent: '#FF5A36',
    onAccent: '#FFFFFF',
    panel: '#142B68',
    onPanel: '#F7F5EF',
    foot: '#101C38',
    onFoot: '#F7F5EF',
    bar: '#163D98',
    onBar: '#FFFFFF',
    badge: '#D9F167',
    onBadge: '#101C38',
  },
  header: 'split',
  hero: 'collage',
  card: 'bold',
  ratio: '4/5',
  rCard: 14,
  rBtn: 999,
  motion: 'pan',
  copy: {
    eyebrow: 'Pocket hardware / live edit',
    collection: 'Signal Shelf',
    cta: 'Build your kit',
    title: 'Make room for the useful things.',
    subtitle: 'Cases, charging, cables, and everyday carry for the phone already in your hand.',
  },
});

const itemCount = (ctx, count) => {
  const numeric = Number(count);
  if (!Number.isFinite(numeric)) return '';
  return `<small>${ctx.esc(String(numeric))} ${numeric === 1 ? 'item' : 'items'}</small>`;
};

const station = (ctx, category, index) => `<a class="signal-dock__station" href="${ctx.categoryLink(category.name)}">
  <span class="signal-dock__index" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
  <span class="signal-dock__name"><b>${ctx.esc(category.name)}</b>${itemCount(ctx, category.count)}</span>
  <span class="signal-dock__arrow" aria-hidden="true">↗</span>
</a>`;

export function hero(ctx) {
  const collectionCount = ctx.cats.length;
  const productCount = ctx.products.length;
  const measure = collectionCount
    ? `${collectionCount} ${collectionCount === 1 ? 'collection' : 'collections'}`
    : productCount
      ? `${productCount} ${productCount === 1 ? 'piece' : 'pieces'}`
      : 'live edit';
  const routes = ctx.cats.slice(0, 3).map((category) => `<a href="${ctx.categoryLink(category.name)}">${ctx.esc(category.name)}</a>`).join('');
  const echo = ctx.pics[1]
    ? `<div class="pocket-signal__echo">${ctx.media(1, { lazy: true, decorative: true })}<span aria-hidden="true"></span></div>`
    : '';

  return `<section class="hero category-hero pocket-signal${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="pocket-signal__ruler" aria-hidden="true"><span>SIGNAL SHELF / PORTABLE HARDWARE</span><span>01—${ctx.esc(measure)}</span></div>
    <div class="pocket-signal__canvas">
      <div class="pocket-signal__primary">
        ${ctx.media(0, { priority: true, lazy: false })}
        <span class="pocket-signal__reticle pocket-signal__reticle--one" aria-hidden="true"></span>
        <span class="pocket-signal__reticle pocket-signal__reticle--two" aria-hidden="true"></span>
        <span class="pocket-signal__primary-label" aria-hidden="true">FIELD / CHARGE / CARRY</span>
      </div>
      <span class="pocket-signal__orb pocket-signal__orb--orange" aria-hidden="true"></span>
      <span class="pocket-signal__orb pocket-signal__orb--lime" aria-hidden="true"></span>
      ${echo}
      <div class="pocket-signal__copy-wrap">${ctx.copy('pocket-signal__copy')}</div>
      <div class="pocket-signal__counter"><strong>${ctx.esc(measure)}</strong><span>on the shelf</span></div>
    </div>
    <nav class="pocket-signal__routes" aria-label="Browse accessory collections">
      ${routes || '<a href="#shop">Browse the current shelf</a>'}
      <a class="pocket-signal__all" href="#shop">Shop all <span aria-hidden="true">↓</span></a>
    </nav>
    ${ctx.controls}
  </section>`;
}

export function discovery(ctx) {
  if (ctx.cats.length >= 2) {
    return `<section class="theme-discovery signal-dock" aria-labelledby="signal-dock-title">
      <div class="signal-dock__intro">
        <p class="signal-dock__eyebrow">Choose a dock</p>
        <h2 id="signal-dock-title">Find the piece that keeps pace.</h2>
        <p>Move through the live collections, then take the whole edit into your day.</p>
        <a class="signal-dock__all" href="#shop">View everything <span aria-hidden="true">↓</span></a>
      </div>
      <div class="signal-dock__rack">${ctx.cats.slice(0, 6).map((category, index) => station(ctx, category, index)).join('')}</div>
    </section>`;
  }

  if (!ctx.products.length) return '';

  return `<section class="theme-discovery signal-dock signal-dock--products" aria-labelledby="signal-dock-title">
    <div class="signal-dock__intro">
      <p class="signal-dock__eyebrow">Current shelf</p>
      <h2 id="signal-dock-title">A few good places to plug in.</h2>
      <a class="signal-dock__all" href="#shop">View everything <span aria-hidden="true">↓</span></a>
    </div>
    <div class="signal-dock__products">${ctx.products.slice(0, 2).map((product) => ctx.productCard(product)).join('')}</div>
  </section>`;
}

export const css = `
.th-p-mobile-phone-accessories{
  --signal-ink:#101C38;
  --signal-blue:#163D98;
  --signal-orange:#FF5A36;
  --signal-lime:#D9F167;
  --signal-paper:#F4F1EA;
  background:var(--signal-paper);
  color:var(--signal-ink);
}
.th-p-mobile-phone-accessories .hd{
  background:color-mix(in srgb,var(--bg) 92%,transparent);
  border-bottom:1px solid color-mix(in srgb,var(--ink) 17%,transparent);
  box-shadow:none;
}
.th-p-mobile-phone-accessories .brand{
  color:var(--signal-ink);
  font-family:var(--display);
  font-size:clamp(15px,1.45vw,21px);
  font-weight:700;
  letter-spacing:-.065em;
}
.th-p-mobile-phone-accessories .nav{
  gap:clamp(12px,1.8vw,28px);
  font:500 10px/1.2 var(--body);
  letter-spacing:.105em;
  text-transform:uppercase;
}
.th-p-mobile-phone-accessories .nav a{background-image:linear-gradient(var(--signal-orange),var(--signal-orange));}
.th-p-mobile-phone-accessories .cart{
  min-width:44px;
  border:1px solid var(--signal-ink);
  border-radius:50%;
  background:var(--signal-lime);
  color:var(--signal-ink);
}
.th-p-mobile-phone-accessories .pocket-signal{
  position:relative;
  overflow:hidden;
  padding:clamp(10px,1.55vw,22px) clamp(12px,2.4vw,42px) clamp(18px,2vw,31px);
  background:var(--signal-paper);
}
.th-p-mobile-phone-accessories .pocket-signal__ruler,
.th-p-mobile-phone-accessories .pocket-signal__routes{
  width:min(100%,1500px);
  margin-inline:auto;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:16px;
  color:var(--signal-ink);
  font:500 9px/1.2 var(--body);
  letter-spacing:.13em;
  text-transform:uppercase;
}
.th-p-mobile-phone-accessories .pocket-signal__ruler{
  min-height:36px;
  padding:0 2px 10px;
  border-bottom:1px solid color-mix(in srgb,var(--signal-ink) 24%,transparent);
}
.th-p-mobile-phone-accessories .pocket-signal__canvas{
  position:relative;
  isolation:isolate;
  display:grid;
  grid-template-columns:repeat(12,minmax(0,1fr));
  grid-template-rows:minmax(420px,1fr) auto;
  width:min(100%,1500px);
  min-height:clamp(510px,50vw,730px);
  margin-inline:auto;
  overflow:hidden;
  background:
    linear-gradient(90deg,transparent 0 16.66%,color-mix(in srgb,var(--signal-ink) 12%,transparent) 16.66% calc(16.66% + 1px),transparent calc(16.66% + 1px) 83.33%,color-mix(in srgb,var(--signal-ink) 12%,transparent) 83.33% calc(83.33% + 1px),transparent calc(83.33% + 1px)),
    linear-gradient(135deg,#E5E1D8 0 46%,#F4F1EA 46% 100%);
}
.th-p-mobile-phone-accessories .pocket-signal__canvas::before{
  position:absolute;
  z-index:-1;
  top:7%;
  left:10%;
  width:44%;
  aspect-ratio:1;
  border:1px solid color-mix(in srgb,var(--signal-ink) 22%,transparent);
  border-radius:50%;
  content:"";
}
.th-p-mobile-phone-accessories .pocket-signal__canvas::after{
  position:absolute;
  z-index:-1;
  right:-8%;
  bottom:-16%;
  width:47%;
  aspect-ratio:1;
  border:1px solid color-mix(in srgb,var(--signal-ink) 20%,transparent);
  border-radius:50%;
  content:"";
}
.th-p-mobile-phone-accessories .pocket-signal__primary{
  position:relative;
  z-index:1;
  grid-column:5 / -1;
  grid-row:1 / -1;
  min-height:0;
  overflow:hidden;
  background:var(--signal-blue);
  clip-path:polygon(16% 0,100% 0,100% 82%,86% 100%,0 100%,0 16%);
}
.th-p-mobile-phone-accessories .pocket-signal__primary > .hero-media,
.th-p-mobile-phone-accessories .pocket-signal__primary > .theme-empty-media{
  display:block;
  width:100%;
  height:100%;
}
.th-p-mobile-phone-accessories .pocket-signal__primary > .hero-media{
  object-fit:cover;
  object-position:center;
  filter:saturate(1.06) contrast(1.04);
}
.th-p-mobile-phone-accessories .pocket-signal__primary > .theme-empty-media{
  min-height:0;
  background:
    radial-gradient(circle at 28% 74%,#FF5A36 0 7%,transparent 7.3%),
    linear-gradient(135deg,#142B68 0 45%,#2753BB 45% 72%,#F4F1EA 72%);
  color:#FFFFFF;
}
.th-p-mobile-phone-accessories .pocket-signal__primary::after{
  position:absolute;
  inset:0;
  background:linear-gradient(110deg,rgba(16,28,56,.17),transparent 42%,rgba(16,28,56,.34));
  content:"";
  pointer-events:none;
}
.th-p-mobile-phone-accessories .pocket-signal__reticle{
  position:absolute;
  z-index:2;
  width:clamp(30px,3vw,46px);
  height:clamp(30px,3vw,46px);
  border:1px solid rgba(255,255,255,.8);
  border-radius:50%;
}
.th-p-mobile-phone-accessories .pocket-signal__reticle--one{top:11%;right:9%;}
.th-p-mobile-phone-accessories .pocket-signal__reticle--two{bottom:12%;left:16%;width:clamp(15px,1.4vw,22px);height:clamp(15px,1.4vw,22px);}
.th-p-mobile-phone-accessories .pocket-signal__primary-label{
  position:absolute;
  z-index:2;
  right:clamp(14px,2.1vw,30px);
  bottom:clamp(14px,2.1vw,30px);
  color:#FFFFFF;
  font:500 9px/1.2 var(--body);
  letter-spacing:.13em;
  text-transform:uppercase;
  writing-mode:vertical-rl;
}
.th-p-mobile-phone-accessories .pocket-signal__copy-wrap{
  z-index:3;
  grid-column:1 / 9;
  grid-row:1;
  align-self:end;
  margin:0 0 clamp(22px,4vw,62px) clamp(17px,3.5vw,58px);
  padding:clamp(18px,2.6vw,39px);
  background:var(--surface);
  box-shadow:clamp(9px,1.7vw,25px) clamp(9px,1.7vw,25px) 0 var(--signal-orange);
}
.th-p-mobile-phone-accessories .pocket-signal__copy .eyebrow{
  margin:0 0 13px;
  color:var(--signal-orange);
  font:600 10px/1.2 var(--body);
  letter-spacing:.14em;
  text-transform:uppercase;
}
.th-p-mobile-phone-accessories .pocket-signal__copy h1{
  max-width:10ch;
  margin:0;
  color:var(--signal-ink);
  font-family:var(--display);
  font-size:clamp(43px,6.5vw,105px);
  font-weight:700;
  letter-spacing:var(--tracking);
  line-height:.89;
  text-wrap:balance;
}
.th-p-mobile-phone-accessories .pocket-signal__copy h1.long{font-size:clamp(37px,5.2vw,78px);}
.th-p-mobile-phone-accessories .pocket-signal__copy .sub{
  max-width:43ch;
  margin:clamp(15px,1.9vw,25px) 0 0;
  color:var(--muted);
  font:500 clamp(12px,1.05vw,15px)/1.6 var(--body);
  letter-spacing:-.025em;
}
.th-p-mobile-phone-accessories .pocket-signal__copy .ctas{margin-top:clamp(20px,2.2vw,30px);}
.th-p-mobile-phone-accessories .pocket-signal__copy .btn,
.th-p-mobile-phone-accessories .signal-dock__all{
  min-height:44px;
  border-radius:999px;
  background:var(--signal-ink);
  color:#FFFFFF;
  font:600 10px/1 var(--body);
  letter-spacing:.07em;
  text-transform:uppercase;
}
.th-p-mobile-phone-accessories .pocket-signal__copy .btn.ghost{
  border-color:var(--signal-ink);
  background:transparent;
  color:var(--signal-ink);
}
.th-p-mobile-phone-accessories .pocket-signal__counter{
  z-index:3;
  grid-column:2 / 5;
  grid-row:2;
  align-self:start;
  justify-self:start;
  display:grid;
  gap:4px;
  margin:-1px 0 0 clamp(14px,2vw,31px);
  padding:13px 16px;
  background:var(--signal-lime);
  color:var(--signal-ink);
  transform:translateY(-1px);
}
.th-p-mobile-phone-accessories .pocket-signal__counter strong{
  font:700 clamp(15px,1.7vw,23px)/1 var(--display);
  letter-spacing:-.06em;
}
.th-p-mobile-phone-accessories .pocket-signal__counter span{
  font:500 8px/1.2 var(--body);
  letter-spacing:.11em;
  text-transform:uppercase;
}
.th-p-mobile-phone-accessories .pocket-signal__echo{
  position:relative;
  z-index:2;
  grid-column:3 / 5;
  grid-row:1;
  align-self:start;
  width:min(100%,195px);
  aspect-ratio:1 / 1.2;
  margin-top:clamp(18px,3.4vw,56px);
  overflow:hidden;
  border:7px solid var(--signal-paper);
  background:var(--signal-orange);
  transform:rotate(-5deg);
}
.th-p-mobile-phone-accessories .pocket-signal__echo > .hero-media,
.th-p-mobile-phone-accessories .pocket-signal__echo > .theme-empty-media{
  display:block;
  width:100%;
  height:100%;
}
.th-p-mobile-phone-accessories .pocket-signal__echo > .hero-media{object-fit:cover;}
.th-p-mobile-phone-accessories .pocket-signal__echo > .theme-empty-media{min-height:0;background:var(--signal-orange);}
.th-p-mobile-phone-accessories .pocket-signal__echo > span{
  position:absolute;
  inset:12px;
  border:1px solid rgba(255,255,255,.72);
  pointer-events:none;
}
.th-p-mobile-phone-accessories .pocket-signal__orb{
  position:absolute;
  z-index:2;
  border-radius:50%;
  pointer-events:none;
}
.th-p-mobile-phone-accessories .pocket-signal__orb--orange{
  top:15%;
  left:36%;
  width:clamp(22px,2.5vw,42px);
  aspect-ratio:1;
  background:var(--signal-orange);
}
.th-p-mobile-phone-accessories .pocket-signal__orb--lime{
  right:5%;
  bottom:10%;
  width:clamp(15px,1.8vw,29px);
  aspect-ratio:1;
  background:var(--signal-lime);
}
.th-p-mobile-phone-accessories .pocket-signal__routes{
  min-height:59px;
  padding:12px 2px 0;
  border-top:1px solid color-mix(in srgb,var(--signal-ink) 23%,transparent);
  justify-content:flex-start;
  flex-wrap:wrap;
}
.th-p-mobile-phone-accessories .pocket-signal__routes a{
  display:inline-flex;
  align-items:center;
  min-height:44px;
  color:var(--signal-ink);
  text-decoration:none;
}
.th-p-mobile-phone-accessories .pocket-signal__routes > a:not(.pocket-signal__all)::after{
  margin-inline:11px 0;
  color:var(--signal-orange);
  content:"/";
}
.th-p-mobile-phone-accessories .pocket-signal__routes .pocket-signal__all{
  margin-left:auto;
  padding-inline:15px;
  background:var(--signal-blue);
  color:#FFFFFF;
}
.th-p-mobile-phone-accessories .pocket-signal__all span{margin-left:9px;color:var(--signal-lime);}
.th-p-mobile-phone-accessories .pocket-signal .motion-toggle{
  position:absolute;
  z-index:5;
  right:clamp(18px,3.5vw,60px);
  bottom:86px;
  min-height:44px;
  border:1px solid var(--signal-ink);
  border-radius:999px;
  background:var(--signal-paper);
  color:var(--signal-ink);
  font:600 9px/1 var(--body);
  letter-spacing:.09em;
  text-transform:uppercase;
}
.th-p-mobile-phone-accessories .signal-dock{
  display:grid;
  grid-template-columns:minmax(240px,.85fr) minmax(0,1.65fr);
  gap:clamp(24px,5vw,85px);
  width:min(100%,1500px);
  margin:clamp(36px,7vw,105px) auto;
  padding:0 clamp(14px,2.4vw,42px);
}
.th-p-mobile-phone-accessories .signal-dock__intro{
  align-self:start;
  padding:clamp(17px,2.2vw,31px);
  border-top:7px solid var(--signal-orange);
  background:var(--surface);
}
.th-p-mobile-phone-accessories .signal-dock__eyebrow{
  margin:0 0 16px;
  color:var(--signal-orange);
  font:600 10px/1.2 var(--body);
  letter-spacing:.14em;
  text-transform:uppercase;
}
.th-p-mobile-phone-accessories .signal-dock__intro h2{
  max-width:10ch;
  margin:0;
  color:var(--signal-ink);
  font:700 clamp(31px,4vw,59px)/.92 var(--display);
  letter-spacing:-.06em;
  text-wrap:balance;
}
.th-p-mobile-phone-accessories .signal-dock__intro > p:not(.signal-dock__eyebrow){
  max-width:35ch;
  margin:18px 0 0;
  color:var(--muted);
  font:500 12px/1.65 var(--body);
}
.th-p-mobile-phone-accessories .signal-dock__all{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:8px;
  margin-top:25px;
  padding:0 18px;
  text-decoration:none;
}
.th-p-mobile-phone-accessories .signal-dock__all span{color:var(--signal-lime);}
.th-p-mobile-phone-accessories .signal-dock__rack{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  align-content:start;
  border-top:1px solid var(--signal-ink);
  border-left:1px solid var(--signal-ink);
}
.th-p-mobile-phone-accessories .signal-dock__station{
  position:relative;
  display:grid;
  grid-template-columns:auto minmax(0,1fr) auto;
  align-items:center;
  gap:14px;
  min-height:138px;
  padding:18px;
  border-right:1px solid var(--signal-ink);
  border-bottom:1px solid var(--signal-ink);
  background:var(--surface);
  color:var(--signal-ink);
  text-decoration:none;
}
.th-p-mobile-phone-accessories .signal-dock__station:nth-child(4n + 2),
.th-p-mobile-phone-accessories .signal-dock__station:nth-child(4n + 3){background:#DFE9FF;}
.th-p-mobile-phone-accessories .signal-dock__station:nth-child(3n){background:var(--signal-lime);}
.th-p-mobile-phone-accessories .signal-dock__index{
  align-self:start;
  color:var(--signal-orange);
  font:600 9px/1 var(--body);
  letter-spacing:.1em;
}
.th-p-mobile-phone-accessories .signal-dock__name{display:grid;gap:8px;min-width:0;}
.th-p-mobile-phone-accessories .signal-dock__name b{
  overflow-wrap:anywhere;
  font:700 clamp(17px,2.1vw,28px)/.95 var(--display);
  letter-spacing:-.06em;
}
.th-p-mobile-phone-accessories .signal-dock__name small{
  color:var(--muted);
  font:500 9px/1.2 var(--body);
  letter-spacing:.09em;
  text-transform:uppercase;
}
.th-p-mobile-phone-accessories .signal-dock__arrow{
  display:grid;
  width:36px;
  min-height:36px;
  place-items:center;
  border:1px solid currentColor;
  border-radius:50%;
  font-size:17px;
}
.th-p-mobile-phone-accessories .signal-dock--products{grid-template-columns:minmax(240px,.7fr) minmax(0,1.3fr);}
.th-p-mobile-phone-accessories .signal-dock__products{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:clamp(12px,1.8vw,25px);
}
.th-p-mobile-phone-accessories .signal-dock__products .product-card{
  overflow:hidden;
  border:1px solid var(--signal-ink);
  border-radius:0;
  background:var(--surface);
  box-shadow:7px 7px 0 var(--signal-blue);
}
.th-p-mobile-phone-accessories .signal-dock__products .product-card img{border-radius:0;}
.th-p-mobile-phone-accessories #shop,
.th-p-mobile-phone-accessories .shop-section{
  padding-top:clamp(32px,5vw,72px);
  border-top:1px solid color-mix(in srgb,var(--signal-ink) 33%,transparent);
  background:linear-gradient(180deg,#E5E1D8 0 17%,var(--signal-paper) 17% 100%);
}
.th-p-mobile-phone-accessories :is(#shop,.shop-section) :is(h2,.shop-title,.section-title){
  color:var(--signal-ink);
  font-family:var(--display);
  font-weight:700;
  letter-spacing:-.055em;
}
.th-p-mobile-phone-accessories :is(#shop,.shop-section) .product-grid{gap:clamp(14px,2vw,29px);}
.th-p-mobile-phone-accessories :is(#shop,.shop-section) .product-card{
  overflow:hidden;
  border:1px solid var(--signal-ink);
  border-radius:0;
  background:var(--surface);
  box-shadow:7px 7px 0 color-mix(in srgb,var(--signal-blue) 86%,transparent);
}
.th-p-mobile-phone-accessories :is(#shop,.shop-section) .product-card img{border-radius:0;}
.th-p-mobile-phone-accessories :is(#shop,.shop-section) .product-card :is(h3,.product-title){
  color:var(--signal-ink);
  font-family:var(--display);
  font-weight:700;
  letter-spacing:-.045em;
}
.th-p-mobile-phone-accessories :is(#shop,.shop-section) .product-card :is(.price,.product-price){color:var(--signal-orange);font-family:var(--body);font-weight:600;}
.th-p-mobile-phone-accessories :is(#shop,.shop-section) .filter,
.th-p-mobile-phone-accessories :is(#shop,.shop-section) select{
  min-height:44px;
  border-color:var(--signal-ink);
  border-radius:999px;
  background:var(--surface);
  color:var(--signal-ink);
}
.th-p-mobile-phone-accessories .ft{background:var(--signal-ink);color:var(--onFoot);}
.th-p-mobile-phone-accessories :is(.pocket-signal__routes a,.signal-dock__station,.signal-dock__all):focus-visible{outline:3px solid var(--signal-orange);outline-offset:4px;}
@media (max-width:760px){
  .th-p-mobile-phone-accessories .pocket-signal{padding-inline:10px;}
  .th-p-mobile-phone-accessories .pocket-signal__ruler{font-size:8px;}
  .th-p-mobile-phone-accessories .pocket-signal__ruler span:last-child{display:none;}
  .th-p-mobile-phone-accessories .pocket-signal__canvas{
    display:flex;
    flex-direction:column;
    min-height:0;
    overflow:visible;
    background:linear-gradient(135deg,#E5E1D8 0 51%,#F4F1EA 51% 100%);
  }
  .th-p-mobile-phone-accessories .pocket-signal__canvas::before{top:11%;left:58%;width:51%;}
  .th-p-mobile-phone-accessories .pocket-signal__canvas::after{display:none;}
  .th-p-mobile-phone-accessories .pocket-signal__primary{
    order:2;
    width:calc(100% - 23px);
    min-height:360px;
    margin:0 0 0 auto;
    clip-path:polygon(13% 0,100% 0,100% 87%,86% 100%,0 100%,0 13%);
  }
  .th-p-mobile-phone-accessories .pocket-signal__copy-wrap{
    order:1;
    width:calc(100% - 17px);
    margin:0 17px -1px 0;
    padding:23px 20px 26px;
    box-shadow:6px 6px 0 var(--signal-orange);
  }
  .th-p-mobile-phone-accessories .pocket-signal__copy h1{font-size:clamp(42px,12.6vw,59px);}
  .th-p-mobile-phone-accessories .pocket-signal__copy h1.long{font-size:clamp(34px,10.5vw,48px);}
  .th-p-mobile-phone-accessories .pocket-signal__echo{display:none;}
  .th-p-mobile-phone-accessories .pocket-signal__counter{
    order:3;
    align-self:flex-start;
    margin:-1px 0 0 12%;
  }
  .th-p-mobile-phone-accessories .pocket-signal__orb--orange{top:46%;left:6%;}
  .th-p-mobile-phone-accessories .pocket-signal__orb--lime{right:7%;bottom:16%;}
  .th-p-mobile-phone-accessories .pocket-signal__routes{gap:0;font-size:8px;}
  .th-p-mobile-phone-accessories .pocket-signal__routes > a:not(.pocket-signal__all){max-width:58%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .th-p-mobile-phone-accessories .pocket-signal__routes > a:not(.pocket-signal__all):nth-of-type(n + 3){display:none;}
  .th-p-mobile-phone-accessories .pocket-signal__routes .pocket-signal__all{padding-inline:13px;}
  .th-p-mobile-phone-accessories .pocket-signal .motion-toggle{right:21px;bottom:82px;}
  .th-p-mobile-phone-accessories .signal-dock,
  .th-p-mobile-phone-accessories .signal-dock--products{
    grid-template-columns:1fr;
    gap:25px;
    margin-block:45px;
    padding-inline:14px;
  }
  .th-p-mobile-phone-accessories .signal-dock__intro h2{max-width:13ch;}
  .th-p-mobile-phone-accessories .signal-dock__rack{grid-template-columns:1fr;}
  .th-p-mobile-phone-accessories .signal-dock__station{min-height:106px;}
  .th-p-mobile-phone-accessories .signal-dock__products{gap:15px;}
  .th-p-mobile-phone-accessories :is(#shop,.shop-section) .product-grid{gap:14px;}
}
@media (max-width:430px){
  .th-p-mobile-phone-accessories .nav{gap:10px;font-size:9px;}
  .th-p-mobile-phone-accessories .pocket-signal__ruler{letter-spacing:.08em;}
  .th-p-mobile-phone-accessories .pocket-signal__primary{min-height:315px;}
  .th-p-mobile-phone-accessories .pocket-signal__primary-label{font-size:8px;}
  .th-p-mobile-phone-accessories .pocket-signal__copy .sub{font-size:11px;}
  .th-p-mobile-phone-accessories .pocket-signal__copy .ctas{display:grid;grid-template-columns:1fr;gap:8px;}
  .th-p-mobile-phone-accessories .pocket-signal__copy .btn{justify-content:center;width:100%;}
  .th-p-mobile-phone-accessories .pocket-signal__routes > a:not(.pocket-signal__all){max-width:52%;}
  .th-p-mobile-phone-accessories .signal-dock__products{grid-template-columns:1fr;}
}
@media (prefers-reduced-motion:reduce){
  .th-p-mobile-phone-accessories .pocket-signal .hero-media{animation:none!important;transform:none!important;}
}
`;

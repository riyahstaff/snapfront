import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-fitness',
  name: 'FORM / FIELD',
  for: 'Strength training equipment',
  vibe: 'Architectural strength studio, quiet limestone, warm walnut, and field green',
  category: 'Strength training equipment',
  group: 'lifestyle',
  display: 'Archivo',
  body: 'Manrope',
  displayWeight: 800,
  tracking: '-.055em',
  colors: {
    bg: '#F4F2EB',
    surface: '#FFFEFA',
    ink: '#172019',
    muted: '#697168',
    line: '#D7D4C9',
    accent: '#D96B32',
    onAccent: '#FFFDF6',
    panel: '#E5E8DC',
    onPanel: '#172019',
    foot: '#18231C',
    onFoot: '#F3F1E9',
    bar: '#18231C',
    onBar: '#F4F2EB',
    badge: '#DCE7C4',
    onBadge: '#172019',
  },
  header: 'split',
  hero: 'overlay',
  card: 'minimal',
  ratio: '4/5',
  rCard: 0,
  rBtn: 0,
  motion: 'pan',
  copy: {
    eyebrow: 'Training equipment, thoughtfully placed',
    collection: 'Room setup edit',
    cta: 'Explore equipment',
    title: 'Strength, in its element.',
    subtitle: 'Thoughtful equipment for the space where you train.',
  },
});

const countLabel = (count) => `${count} ${count === 1 ? 'product' : 'products'}`;

const categoryVisual = (ctx, category, index) => {
  if (category.image) {
    return `<img src="${ctx.esc(category.image)}" alt="" loading="lazy" decoding="async">`;
  }
  return `<div class="fitness-card-empty" aria-hidden="true"><span>${String(index + 1).padStart(2, '0')}</span></div>`;
};

const categoryCard = (ctx, category, index) => {
  const count = Number(category.count) || 0;
  return `<a class="fitness-setup-card${index === 0 ? ' fitness-setup-featured' : ''}" href="${ctx.esc(ctx.categoryLink(category.name))}">
    <span class="fitness-card-number">${String(index + 1).padStart(2, '0')}</span>
    <span class="fitness-card-visual">${categoryVisual(ctx, category, index)}</span>
    <span class="fitness-card-copy"><b>${ctx.esc(category.name)}</b><small>${countLabel(count)}</small><em>View selection <i aria-hidden="true">→</i></em></span>
  </a>`;
};

const productCard = (ctx, product, index) => {
  const title = ctx.esc(product.title || 'Untitled product');
  const price = typeof product.price_cents === 'number' ? ctx.money(product.price_cents, product.currency) : '';
  const visual = product.image_url
    ? `<img src="${ctx.esc(product.image_url)}" alt="${ctx.esc(product.alt_text || product.title || '')}" loading="lazy" decoding="async">`
    : `<div class="fitness-card-empty" aria-hidden="true"><span>${String(index + 1).padStart(2, '0')}</span></div>`;
  return `<a class="fitness-setup-card${index === 0 ? ' fitness-setup-featured' : ''}" href="${ctx.esc(ctx.productLink(product))}">
    <span class="fitness-card-number">${String(index + 1).padStart(2, '0')}</span>
    <span class="fitness-card-visual">${visual}</span>
    <span class="fitness-card-copy"><b>${title}</b>${price ? `<small>${ctx.esc(price)}</small>` : ''}<em>View product <i aria-hidden="true">→</i></em></span>
  </a>`;
};

const categoryRail = (ctx, categories) => `<nav class="fitness-category-rail" aria-label="Shop equipment categories">${categories.map((category, index) => {
  const count = Number(category.count) || 0;
  return `<a href="${ctx.esc(ctx.categoryLink(category.name))}"><span>${String(index + 1).padStart(2, '0')}</span><b>${ctx.esc(category.name)}</b><small>${countLabel(count)}</small><i aria-hidden="true">↗</i></a>`;
}).join('')}</nav>`;

export function hero(ctx) {
  return `<section class="hero category-hero fitness-studio${ctx.heroClass}"${ctx.heroAttrs}>
  <div class="fitness-hero-media">${ctx.media(0, { priority: true, lazy: false })}</div>
  <aside class="fitness-stone-rail" aria-hidden="true"><span>IN ITS<br>ELEMENT</span></aside>
  <p class="fitness-studio-index" aria-hidden="true">PEOPLE<br>EQUIPMENT<br>SPACE<br>PROGRESS</p>
  ${ctx.copy('fitness-hero-copy')}
  ${ctx.controls}
</section>`;
}

export function discovery(ctx) {
  const categories = ctx.cats.slice(0, 3);
  const products = ctx.products.slice(0, 3);
  if (categories.length >= 2) {
    return `<section class="theme-discovery fitness-floor" aria-labelledby="fitness-floor-title">
  <div class="fitness-floor-layout">
    <div class="fitness-floor-intro">
      <p class="fitness-section-kicker">ROOM SETUP / CURRENT EDIT</p>
      <h2 id="fitness-floor-title">Build the room around your work.</h2>
      <p>Start with the current collection, then shape a training space one considered piece at a time.</p>
      ${categoryRail(ctx, categories)}
    </div>
    <div class="fitness-setup-grid">${categories.map((category, index) => categoryCard(ctx, category, index)).join('')}</div>
  </div>
</section>`;
  }
  if (!products.length) return '';
  return `<section class="theme-discovery fitness-floor fitness-floor-products" aria-labelledby="fitness-floor-title">
  <div class="fitness-floor-layout">
    <div class="fitness-floor-intro">
      <p class="fitness-section-kicker">CURRENT EQUIPMENT</p>
      <h2 id="fitness-floor-title">Make space for the work.</h2>
      <p>Explore the equipment currently available in this collection.</p>
    </div>
    <div class="fitness-setup-grid">${products.map((product, index) => productCard(ctx, product, index)).join('')}</div>
  </div>
</section>`;
}

export const css = `
.th-p-fitness{
  --fitness-ink:#172019;
  --fitness-dark:#18231C;
  --fitness-canvas:#F4F2EB;
  --fitness-limestone:#E8E4D8;
  --fitness-orange:#D96B32;
  background:var(--fitness-canvas);
}
.th-p-fitness .hd{
  position:relative;
  z-index:8;
  background:var(--fitness-dark);
  color:var(--onBar);
  border-bottom:1px solid #B8B8A933;
}
.th-p-fitness .hd :is(.brand,.nav a,.cart){color:var(--onBar)}
.th-p-fitness .hd .cart{border-color:#B8B8A955}
.th-p-fitness .category-hero.fitness-studio{
  position:relative;
  isolation:isolate;
  overflow:hidden;
  min-height:clamp(570px,52vw,760px);
  background:var(--fitness-dark);
  color:#FFFDF6;
}
.th-p-fitness .fitness-hero-media{
  position:absolute;
  inset:0;
  overflow:hidden;
  background:#263126;
}
.th-p-fitness .fitness-hero-media::after{
  content:"";
  position:absolute;
  inset:0;
  background:linear-gradient(180deg,#0A100C88 0%,#0A100C28 38%,#0A100C2B 62%,#0A100CB8 100%);
  pointer-events:none;
}
.th-p-fitness .fitness-hero-media .hero-media{
  display:block;
  width:100%;
  height:100%;
  object-fit:cover;
  object-position:center center;
}
.th-p-fitness .fitness-hero-media .theme-empty-media{
  min-height:clamp(570px,52vw,760px);
  height:100%;
  color:#E7E3D8;
  background:linear-gradient(125deg,#2E382D 0%,#172019 56%,#535244 100%);
}
.th-p-fitness .fitness-stone-rail{
  position:absolute;
  z-index:2;
  inset:0 auto 0 0;
  display:flex;
  align-items:flex-start;
  width:clamp(72px,10.7vw,170px);
  padding:clamp(70px,9.2vw,138px) clamp(13px,2.1vw,34px) 28px;
  background:linear-gradient(90deg,#E9E4D7F0 0%,#D9D3C0C9 72%,#D9D3C000 100%);
  color:#383B31;
  pointer-events:none;
}
.th-p-fitness .fitness-stone-rail span{
  font:500 clamp(14px,1.35vw,21px)/1.05 var(--display);
  letter-spacing:var(--tracking);
}
.th-p-fitness .fitness-studio-index{
  position:absolute;
  z-index:2;
  right:clamp(20px,7vw,112px);
  bottom:clamp(110px,13vw,190px);
  margin:0;
  color:#F7F3E9CC;
  font:700 clamp(9px,.8vw,12px)/1.8 var(--body);
  letter-spacing:.21em;
  text-align:left;
}
.th-p-fitness .fitness-hero-copy{
  position:relative;
  z-index:3;
  display:flex;
  flex-wrap:wrap;
  align-content:flex-start;
  min-height:clamp(570px,52vw,760px);
  padding:clamp(25px,3.6vw,57px) clamp(28px,5vw,80px) clamp(27px,3.6vw,56px) clamp(92px,14.5vw,230px);
}
.th-p-fitness .fitness-hero-copy .eyebrow{
  width:100%;
  max-width:28ch;
  margin:0;
  color:#FFFCF2;
  font:700 clamp(9px,.8vw,12px)/1.25 var(--body);
  letter-spacing:.16em;
  text-transform:uppercase;
}
.th-p-fitness .fitness-hero-copy h1{
  width:100%;
  max-width:100%;
  margin:clamp(14px,2.1vw,32px) 0 auto;
  color:#FFFDF5;
  font:800 clamp(66px,12.25vw,206px)/.76 var(--display);
  letter-spacing:-.075em;
  text-transform:uppercase;
  overflow-wrap:anywhere;
  text-shadow:0 3px 26px #1720193D;
}
.th-p-fitness .fitness-hero-copy h1.long{
  max-width:16ch;
  font-size:clamp(45px,7.9vw,130px);
  line-height:.82;
}
.th-p-fitness .fitness-hero-copy .sub{
  width:min(34ch,46%);
  margin:clamp(20px,4vw,63px) 0 0;
  color:#FFFDF5;
  font:500 clamp(14px,1.15vw,17px)/1.46 var(--body);
  text-shadow:0 2px 16px #172019AA;
}
.th-p-fitness .fitness-hero-copy .ctas{
  display:flex;
  flex-wrap:wrap;
  gap:10px;
  align-self:flex-end;
  margin:auto 0 0 auto;
}
.th-p-fitness .fitness-hero-copy .btn{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  min-height:48px;
  padding:12px 19px;
  border:1px solid var(--fitness-orange);
  border-radius:0;
  background:var(--fitness-orange);
  color:#FFFDF6;
  font:700 13px/1 var(--body);
  text-decoration:none;
}
.th-p-fitness .fitness-hero-copy .btn:hover{background:#EF7C3F;border-color:#EF7C3F}
.th-p-fitness .fitness-hero-copy .btn.ghost{border-color:#FFFDF699;background:#172019B8;color:#FFFDF6}
.th-p-fitness .fitness-hero-copy .btn.ghost:hover{background:#172019}
.th-p-fitness .fitness-studio .motion-toggle{
  position:absolute;
  z-index:5;
  right:clamp(18px,2.5vw,38px);
  bottom:clamp(17px,2.3vw,34px);
  min-height:44px;
  padding:9px 12px;
  border:1px solid #FFFDF673;
  border-radius:0;
  background:#172019D9;
  color:#FFFDF6;
  font:700 11px/1 var(--body);
  letter-spacing:.06em;
}
.th-p-fitness .fitness-floor{
  width:min(calc(100% - 72px),1400px);
  margin:0 auto;
  padding:clamp(46px,7vw,108px) 0 clamp(38px,6vw,88px);
}
.th-p-fitness .fitness-floor-layout{
  display:grid;
  grid-template-columns:minmax(225px,.65fr) minmax(0,1.55fr);
  gap:clamp(26px,4.25vw,72px);
  align-items:start;
}
.th-p-fitness .fitness-floor-intro{
  min-width:0;
  padding-top:8px;
}
.th-p-fitness .fitness-section-kicker{
  margin:0;
  color:#64715A;
  font:800 10px/1.2 var(--body);
  letter-spacing:.17em;
}
.th-p-fitness .fitness-floor-intro h2{
  max-width:8.8ch;
  margin:15px 0 20px;
  color:var(--fitness-ink);
  font:600 clamp(43px,5vw,76px)/.9 var(--display);
  letter-spacing:-.065em;
  overflow-wrap:anywhere;
}
.th-p-fitness .fitness-floor-intro > p:not(.fitness-section-kicker){
  max-width:30ch;
  margin:0;
  color:#5B645C;
  font:500 15px/1.52 var(--body);
}
.th-p-fitness .fitness-category-rail{
  display:grid;
  margin-top:29px;
  border-top:1px solid #BCBFB4;
}
.th-p-fitness .fitness-category-rail a{
  display:grid;
  grid-template-columns:28px minmax(0,1fr) auto;
  grid-template-areas:"number name arrow" "number meta arrow";
  column-gap:9px;
  align-items:center;
  min-height:64px;
  padding:8px 0;
  border-bottom:1px solid #BCBFB4;
  color:var(--fitness-ink);
  text-decoration:none;
}
.th-p-fitness .fitness-category-rail a:hover{color:var(--fitness-orange)}
.th-p-fitness .fitness-category-rail a > span{grid-area:number;color:#7A8178;font:700 10px/1 var(--body);letter-spacing:.1em}
.th-p-fitness .fitness-category-rail b{grid-area:name;min-width:0;font:700 14px/1.1 var(--body);overflow-wrap:anywhere}
.th-p-fitness .fitness-category-rail small{grid-area:meta;margin-top:4px;color:#6C756C;font:600 10px/1.1 var(--body)}
.th-p-fitness .fitness-category-rail i{grid-area:arrow;font:400 17px/1 var(--body);font-style:normal}
.th-p-fitness .fitness-setup-grid{
  display:grid;
  grid-template-columns:minmax(0,1.12fr) minmax(220px,.88fr);
  grid-auto-rows:minmax(176px,1fr);
  gap:clamp(10px,1.2vw,18px);
}
.th-p-fitness .fitness-setup-card{
  position:relative;
  display:grid;
  min-width:0;
  min-height:176px;
  overflow:hidden;
  background:#D9DDD2;
  color:#FFFDF6;
  text-decoration:none;
}
.th-p-fitness .fitness-setup-card:first-child{grid-row:span 2;min-height:clamp(370px,33vw,510px)}
.th-p-fitness .fitness-card-visual{
  position:absolute;
  inset:0;
  overflow:hidden;
  background:#CBD0C3;
}
.th-p-fitness .fitness-card-visual::after{
  content:"";
  position:absolute;
  inset:0;
  background:linear-gradient(180deg,#17201909 26%,#172019B8 100%);
  pointer-events:none;
}
.th-p-fitness .fitness-card-visual img{
  display:block;
  width:100%;
  height:100%;
  object-fit:cover;
}
.th-p-fitness .fitness-card-empty{
  display:grid;
  width:100%;
  height:100%;
  place-items:center;
  background:repeating-linear-gradient(135deg,#DDE0D4 0 10px,#D2D7CA 10px 20px);
  color:#768072;
  font:700 clamp(35px,4vw,58px)/1 var(--display);
}
.th-p-fitness .fitness-card-number{
  position:absolute;
  z-index:2;
  top:14px;
  left:15px;
  min-width:30px;
  padding:7px 6px;
  background:#F5F1E7E8;
  color:#3A453A;
  font:800 10px/1 var(--body);
  letter-spacing:.11em;
  text-align:center;
}
.th-p-fitness .fitness-card-copy{
  position:relative;
  z-index:2;
  display:grid;
  align-content:end;
  gap:5px;
  min-height:176px;
  padding:clamp(16px,2vw,27px);
  background:linear-gradient(180deg,#17201900 36%,#17201999 100%);
}
.th-p-fitness .fitness-card-copy b{
  max-width:16ch;
  color:#FFFDF6;
  font:700 clamp(24px,2.35vw,38px)/.9 var(--display);
  letter-spacing:-.045em;
  overflow-wrap:anywhere;
}
.th-p-fitness .fitness-card-copy small{color:#F7F3E9D9;font:600 11px/1.2 var(--body)}
.th-p-fitness .fitness-card-copy em{margin-top:8px;color:#FFFDF6;font:700 11px/1.2 var(--body);font-style:normal;letter-spacing:.04em}
.th-p-fitness .fitness-card-copy i{margin-left:6px;color:#F1A176;font-size:17px;font-style:normal;vertical-align:-1px}
.th-p-fitness .fitness-setup-featured .fitness-card-copy b{font-size:clamp(30px,3.5vw,53px)}
@media (max-width:900px){
  .th-p-fitness .category-hero.fitness-studio{min-height:650px}
  .th-p-fitness .fitness-hero-media .theme-empty-media{min-height:650px}
  .th-p-fitness .fitness-hero-copy{min-height:650px;padding-left:clamp(78px,13.5vw,122px)}
  .th-p-fitness .fitness-hero-copy h1{font-size:clamp(62px,11.8vw,118px)}
  .th-p-fitness .fitness-hero-copy h1.long{font-size:clamp(43px,7.8vw,76px)}
  .th-p-fitness .fitness-floor-layout{grid-template-columns:minmax(188px,.68fr) minmax(0,1.32fr);gap:28px}
  .th-p-fitness .fitness-setup-grid{grid-template-columns:1fr;grid-auto-rows:minmax(196px,1fr)}
  .th-p-fitness .fitness-setup-card:first-child{grid-row:auto;min-height:300px}
  .th-p-fitness .fitness-card-copy{min-height:196px}
}
@media (max-width:640px){
  .th-p-fitness .hd{background:var(--fitness-dark)}
  .th-p-fitness .category-hero.fitness-studio{min-height:0}
  .th-p-fitness .fitness-hero-media{inset:0 0 auto;height:100%;min-height:540px}
  .th-p-fitness .fitness-hero-media .theme-empty-media{min-height:540px}
  .th-p-fitness .fitness-stone-rail{width:62px;padding:70px 9px 20px;background:linear-gradient(90deg,#E9E4D7D9 0%,#D9D3C075 72%,#D9D3C000 100%)}
  .th-p-fitness .fitness-stone-rail span{font-size:12px}
  .th-p-fitness .fitness-studio-index{right:17px;bottom:119px;font-size:9px;line-height:1.65}
  .th-p-fitness .fitness-hero-copy{min-height:540px;padding:23px 18px 24px 78px}
  .th-p-fitness .fitness-hero-copy .eyebrow{max-width:23ch;font-size:9px}
  .th-p-fitness .fitness-hero-copy h1{margin-top:15px;font-size:clamp(55px,16.8vw,76px);line-height:.78}
  .th-p-fitness .fitness-hero-copy h1.long{max-width:11ch;font-size:clamp(38px,12vw,54px);line-height:.85}
  .th-p-fitness .fitness-hero-copy .sub{width:min(28ch,100%);margin-top:28px;font-size:14px}
  .th-p-fitness .fitness-hero-copy .ctas{width:100%;margin:16px 0 0;align-self:auto}
  .th-p-fitness .fitness-hero-copy .btn{width:100%;min-height:48px}
  .th-p-fitness .fitness-hero-copy .btn.ghost{display:none}
  .th-p-fitness .fitness-studio .motion-toggle{right:14px;bottom:17px}
  .th-p-fitness .fitness-floor{width:min(calc(100% - 32px),1400px);padding-top:46px}
  .th-p-fitness .fitness-floor-layout{grid-template-columns:1fr;gap:28px}
  .th-p-fitness .fitness-floor-intro{padding-top:0}
  .th-p-fitness .fitness-floor-intro h2{max-width:10ch;font-size:clamp(42px,13.2vw,59px)}
  .th-p-fitness .fitness-category-rail{margin-top:22px}
  .th-p-fitness .fitness-category-rail a{min-height:59px}
  .th-p-fitness .fitness-setup-grid{gap:12px}
  .th-p-fitness .fitness-setup-card:first-child{min-height:clamp(285px,86vw,365px)}
  .th-p-fitness .fitness-card-copy{min-height:174px;padding:17px}
  .th-p-fitness .fitness-card-copy b{font-size:clamp(24px,8vw,34px)}
  .th-p-fitness .fitness-setup-featured .fitness-card-copy b{font-size:clamp(30px,10vw,43px)}
}
@media (max-width:390px){
  .th-p-fitness .fitness-hero-copy{padding-left:68px;padding-right:14px}
  .th-p-fitness .fitness-stone-rail{width:55px;padding-left:7px}
  .th-p-fitness .fitness-hero-copy h1{font-size:clamp(50px,16vw,62px)}
  .th-p-fitness .fitness-hero-copy h1.long{font-size:clamp(34px,11vw,45px)}
  .th-p-fitness .fitness-category-rail a{grid-template-columns:23px minmax(0,1fr) auto;column-gap:6px}
}
`;

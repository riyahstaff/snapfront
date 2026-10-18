import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-garage',
  name: 'TORQUE / FIELD',
  for: 'Automotive tools and garage equipment',
  vibe: 'Working-bay photography, navy steel, workshop graphite, and signal amber',
  category: 'Automotive tools and garage equipment',
  group: 'outdoor',
  display: 'Barlow Condensed',
  body: 'Barlow',
  displayWeight: 800,
  tracking: '-.045em',
  colors: {
    bg: '#F4F5F3',
    surface: '#FFFFFF',
    ink: '#111A20',
    muted: '#647078',
    line: '#D6DCE0',
    accent: '#F0A525',
    onAccent: '#172029',
    panel: '#DCE4E7',
    onPanel: '#111A20',
    foot: '#0B151B',
    onFoot: '#E7ECEC',
    bar: '#10232C',
    onBar: '#F4F5F3',
    badge: '#F5C25B',
    onBadge: '#111A20',
  },
  header: 'split',
  hero: 'overlay',
  card: 'bold',
  ratio: '4/5',
  rCard: 0,
  rBtn: 4,
  motion: 'pan',
  copy: {
    eyebrow: 'Tools for real work',
    collection: 'Build your bay',
    cta: 'Shop the workshop',
    title: 'The work is the show.',
    subtitle: 'Tools and equipment for the jobs in front of you.',
  },
});

const countLabel = (count) => `${count} ${count === 1 ? 'product' : 'products'}`;

const categoryRail = (ctx, categories) => {
  if (!categories.length) {
    return '<p class="garage-rail-empty">The current collection is ready when you are.</p>';
  }
  return `<nav class="garage-task-nav" aria-label="Shop by category">${categories.map((category, index) => {
    const count = Number(category.count) || 0;
    return `<a href="${ctx.esc(ctx.categoryLink(category.name))}"><span class="garage-task-mark">${String(index + 1).padStart(2, '0')}</span><span class="garage-task-name">${ctx.esc(category.name)}</span><small>${countLabel(count)}</small><span class="garage-task-arrow" aria-hidden="true">→</span></a>`;
  }).join('')}</nav>`;
};

export function hero(ctx) {
  const categories = ctx.cats.slice(0, 4);
  return `<section class="hero category-hero garage-bay${ctx.heroClass}"${ctx.heroAttrs}>
  <aside class="garage-task-rail">
    <p class="garage-rail-kicker">WORKSTATION / 01</p>
    <h2>Choose the job.</h2>
    ${categoryRail(ctx, categories)}
    <p class="garage-rail-note">Good work starts with a clear bench.</p>
  </aside>
  <div class="garage-bay-media">${ctx.media(0, { priority: true, lazy: false })}</div>
  <div class="garage-command">${ctx.copy('garage-command-copy')}</div>
  ${ctx.controls}
</section>`;
}

const categoryCards = (ctx, categories) => `<div class="garage-build-grid">${categories.map((category, index) => {
  const count = Number(category.count) || 0;
  const visual = category.image
    ? `<div class="garage-build-media"><img src="${ctx.esc(category.image)}" alt="" loading="lazy" decoding="async"></div>`
    : `<div class="garage-build-media garage-build-empty" aria-hidden="true"><span>${String(index + 1).padStart(2, '0')}</span></div>`;
  return `<a class="garage-build-card" href="${ctx.esc(ctx.categoryLink(category.name))}">
    <span class="garage-build-index">${String(index + 1).padStart(2, '0')}</span>
    ${visual}
    <span class="garage-build-info"><b>${ctx.esc(category.name)}</b><small>${countLabel(count)}</small><em>View selection <span aria-hidden="true">→</span></em></span>
  </a>`;
}).join('')}</div>`;

const productCards = (ctx, products) => `<div class="garage-build-grid garage-product-grid">${products.map((product, index) => {
  const title = ctx.esc(product.title || 'Untitled product');
  const price = typeof product.price_cents === 'number' ? ctx.money(product.price_cents, product.currency, product?.billing_interval) : '';
  const visual = product.image_url
    ? `<div class="garage-build-media"><img src="${ctx.esc(product.image_url)}" alt="${ctx.esc(product.alt_text || product.title || '')}" loading="lazy" decoding="async"></div>`
    : `<div class="garage-build-media garage-build-empty" aria-hidden="true"><span>${String(index + 1).padStart(2, '0')}</span></div>`;
  return `<a class="garage-build-card" href="${ctx.esc(ctx.productLink(product))}">
    <span class="garage-build-index">${String(index + 1).padStart(2, '0')}</span>
    ${visual}
    <span class="garage-build-info"><b>${title}</b>${price ? `<small>${ctx.esc(price)}</small>` : ''}<em>View product <span aria-hidden="true">→</span></em></span>
  </a>`;
}).join('')}</div>`;

export function discovery(ctx) {
  const categories = ctx.cats.slice(0, 4);
  const products = ctx.products.slice(0, 4);
  if (categories.length >= 2) {
    return `<section class="theme-discovery garage-discovery" aria-labelledby="garage-build-title">
  <div class="garage-discovery-head">
    <div><p class="garage-section-kicker">BAY PLAN / CURRENT SELECTION</p><h2 id="garage-build-title">Build your bay.</h2></div>
    <p>Start with the work in front of you, then follow the parts of the shop that matter.</p>
  </div>
  ${categoryCards(ctx, categories)}
</section>`;
  }
  if (!products.length) return '';
  return `<section class="theme-discovery garage-discovery garage-discovery-products" aria-labelledby="garage-build-title">
  <div class="garage-discovery-head">
    <div><p class="garage-section-kicker">AT THE BENCH / CURRENT SELECTION</p><h2 id="garage-build-title">Ready for the work.</h2></div>
    <p>Explore the products currently in this collection.</p>
  </div>
  ${productCards(ctx, products)}
</section>`;
}

export const css = `
.th-p-garage{
  --garage-steel:#10232C;
  --garage-ink:#111A20;
  --garage-amber:#F0A525;
  --garage-cold:#DCE4E7;
  background:var(--bg);
}
.th-p-garage .hd{
  background:var(--garage-steel);
  color:var(--onBar);
  border-bottom:1px solid #9BAAB066;
}
.th-p-garage .hd :is(.brand,.nav a,.cart){color:var(--onBar)}
.th-p-garage .hd .cart{border-color:#9BAAB066}
.th-p-garage .category-hero.garage-bay{
  display:grid;
  grid-template-columns:minmax(186px,16.5vw) minmax(0,1fr);
  min-height:min(690px,calc(100svh - 82px));
  position:relative;
  overflow:hidden;
  isolation:isolate;
  background:var(--garage-steel);
  color:#F4F5F3;
}
.th-p-garage .garage-bay-media{
  min-width:0;
  min-height:560px;
  height:100%;
  overflow:hidden;
  position:relative;
  background:#1A252B;
}
.th-p-garage .garage-bay-media::after{
  content:"";
  position:absolute;
  inset:0;
  background:linear-gradient(90deg,#0912181A 0%,#09121800 42%,#07101477 100%);
  pointer-events:none;
}
.th-p-garage .garage-bay-media .hero-media{
  display:block;
  width:100%;
  height:100%;
  object-fit:cover;
  object-position:center;
}
.th-p-garage .garage-bay-media .theme-empty-media{
  min-height:560px;
  height:100%;
  color:#CDD8D9;
  background:linear-gradient(135deg,#263942,#101D24 72%);
}
.th-p-garage .garage-task-rail{
  position:relative;
  z-index:2;
  display:flex;
  flex-direction:column;
  min-width:0;
  padding:clamp(25px,4vw,64px) clamp(18px,2.15vw,34px) 24px;
  background:linear-gradient(180deg,#10232C 0%,#0B181E 100%);
  border-right:1px solid #8D9AA033;
}
.th-p-garage .garage-rail-kicker,
.th-p-garage .garage-section-kicker{
  margin:0;
  color:var(--garage-amber);
  font:700 11px/1.1 var(--body);
  letter-spacing:.145em;
}
.th-p-garage .garage-task-rail h2{
  max-width:8ch;
  margin:12px 0 26px;
  color:#F5F6F4;
  font:700 clamp(28px,3vw,44px)/.88 var(--display);
  letter-spacing:-.035em;
  text-transform:uppercase;
  overflow-wrap:anywhere;
}
.th-p-garage .garage-task-nav{
  display:grid;
  border-top:1px solid #9BAAB02B;
}
.th-p-garage .garage-task-nav a{
  display:grid;
  grid-template-columns:24px minmax(0,1fr) auto;
  grid-template-areas:"num name arrow" "num meta arrow";
  column-gap:8px;
  align-items:center;
  min-height:72px;
  padding:10px 0;
  border-bottom:1px solid #9BAAB02B;
  color:#E9EFEE;
  text-decoration:none;
}
.th-p-garage .garage-task-nav a:hover{color:var(--garage-amber)}
.th-p-garage .garage-task-mark{
  grid-area:num;
  align-self:start;
  padding-top:3px;
  color:#95A6AA;
  font:600 10px/1 var(--body);
  letter-spacing:.1em;
}
.th-p-garage .garage-task-name{
  grid-area:name;
  min-width:0;
  font:600 15px/1.05 var(--body);
  overflow-wrap:anywhere;
}
.th-p-garage .garage-task-nav small{
  grid-area:meta;
  margin-top:4px;
  color:#9AABAF;
  font:500 11px/1.15 var(--body);
}
.th-p-garage .garage-task-arrow{
  grid-area:arrow;
  color:var(--garage-amber);
  font:500 18px/1 var(--body);
}
.th-p-garage .garage-rail-empty{
  margin:0;
  padding:18px 0;
  border-top:1px solid #9BAAB02B;
  border-bottom:1px solid #9BAAB02B;
  color:#C9D3D4;
  font:500 14px/1.45 var(--body);
}
.th-p-garage .garage-rail-note{
  margin:auto 0 0;
  padding-top:26px;
  color:#A9B7B9;
  font:600 10px/1.35 var(--body);
  letter-spacing:.14em;
  text-transform:uppercase;
}
.th-p-garage .garage-command{
  position:absolute;
  z-index:3;
  right:clamp(24px,5.5vw,88px);
  top:50%;
  width:min(37vw,505px);
  transform:translateY(-50%);
  padding:clamp(26px,3.3vw,56px);
  color:var(--garage-ink);
  background:linear-gradient(135deg,#F5F7F5F2 0%,#DCE4E7E8 100%);
  border:1px solid #FFFFFF88;
  box-shadow:0 18px 54px #00000044;
  backdrop-filter:blur(8px);
}
.th-p-garage .garage-command .txt{min-width:0}
.th-p-garage .garage-command .eyebrow{
  margin:0 0 16px;
  color:#41545B;
  font:700 11px/1.1 var(--body);
  letter-spacing:.13em;
  text-transform:uppercase;
}
.th-p-garage .garage-command h1{
  max-width:10ch;
  margin:0;
  color:var(--garage-ink);
  font:800 clamp(47px,5.5vw,90px)/.82 var(--display);
  letter-spacing:-.058em;
  text-transform:uppercase;
  overflow-wrap:anywhere;
}
.th-p-garage .garage-command h1.long{font-size:clamp(38px,4.25vw,68px)}
.th-p-garage .garage-command .sub{
  max-width:30ch;
  margin:22px 0 0;
  color:#31434A;
  font:500 clamp(15px,1.35vw,19px)/1.42 var(--body);
}
.th-p-garage .garage-command .ctas{
  display:flex;
  flex-wrap:wrap;
  gap:10px;
  margin-top:25px;
}
.th-p-garage .garage-command .btn{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  min-height:46px;
  padding:10px 16px;
  border:1px solid var(--garage-amber);
  border-radius:4px;
  background:var(--garage-amber);
  color:#172029;
  font:700 14px/1 var(--body);
  text-decoration:none;
}
.th-p-garage .garage-command .btn:hover{background:#FFD071;border-color:#FFD071}
.th-p-garage .garage-command .btn.ghost{background:transparent;border-color:#61747A;color:var(--garage-ink)}
.th-p-garage .garage-command .btn.ghost:hover{background:#FFFFFF88}
.th-p-garage .garage-bay .motion-toggle{
  position:absolute;
  z-index:4;
  right:clamp(18px,2.5vw,38px);
  bottom:20px;
  min-height:44px;
  padding:9px 12px;
  border:1px solid #FFFFFF66;
  border-radius:4px;
  background:#0B151BCC;
  color:#F4F5F3;
  font:600 12px/1 var(--body);
}
.th-p-garage .garage-discovery{
  width:min(calc(100% - 48px),1320px);
  margin:0 auto;
  padding:clamp(38px,6vw,84px) 0 clamp(32px,5vw,70px);
}
.th-p-garage .garage-discovery-head{
  display:grid;
  grid-template-columns:minmax(0,1fr) minmax(210px,360px);
  gap:28px;
  align-items:end;
  margin-bottom:28px;
  padding-bottom:19px;
  border-bottom:2px solid var(--garage-ink);
}
.th-p-garage .garage-discovery-head h2{
  margin:8px 0 0;
  color:var(--garage-ink);
  font:800 clamp(42px,5vw,72px)/.84 var(--display);
  letter-spacing:-.05em;
  text-transform:uppercase;
  overflow-wrap:anywhere;
}
.th-p-garage .garage-discovery-head > p{
  max-width:36ch;
  margin:0;
  color:var(--muted);
  font:500 15px/1.45 var(--body);
}
.th-p-garage .garage-build-grid{
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  gap:1px;
  background:var(--line);
  border:1px solid var(--line);
}
.th-p-garage .garage-build-card{
  position:relative;
  display:flex;
  flex-direction:column;
  min-width:0;
  background:var(--surface);
  color:var(--garage-ink);
  text-decoration:none;
}
.th-p-garage .garage-build-card:hover{background:#F9FAF8}
.th-p-garage .garage-build-index{
  position:absolute;
  z-index:2;
  top:12px;
  left:14px;
  min-width:28px;
  padding:6px 5px;
  background:var(--garage-amber);
  color:#172029;
  font:800 12px/1 var(--body);
  letter-spacing:.04em;
  text-align:center;
}
.th-p-garage .garage-build-media{
  position:relative;
  aspect-ratio:1.28/1;
  overflow:hidden;
  background:#DCE3E5;
}
.th-p-garage .garage-build-media img{
  display:block;
  width:100%;
  height:100%;
  object-fit:cover;
}
.th-p-garage .garage-build-empty{
  display:grid;
  place-items:center;
  background:repeating-linear-gradient(135deg,#E5EAEB 0 8px,#D7E0E2 8px 16px);
  color:#738188;
  font:800 38px/1 var(--display);
}
.th-p-garage .garage-build-info{
  display:grid;
  gap:5px;
  min-height:145px;
  padding:18px 16px 17px;
}
.th-p-garage .garage-build-info b{
  font:700 clamp(18px,1.7vw,25px)/.96 var(--display);
  letter-spacing:-.025em;
  text-transform:uppercase;
  overflow-wrap:anywhere;
}
.th-p-garage .garage-build-info small{
  color:var(--muted);
  font:600 12px/1.2 var(--body);
}
.th-p-garage .garage-build-info em{
  align-self:end;
  color:#253940;
  font:700 12px/1.2 var(--body);
  font-style:normal;
}
.th-p-garage .garage-build-info em span{color:var(--garage-amber);font-size:16px}
.th-p-garage .garage-build-card:hover .garage-build-info em{color:#000}
@media (max-width:900px){
  .th-p-garage .category-hero.garage-bay{grid-template-columns:156px minmax(0,1fr);min-height:610px}
  .th-p-garage .garage-bay-media{min-height:610px}
  .th-p-garage .garage-task-rail{padding:28px 16px 20px}
  .th-p-garage .garage-task-rail h2{font-size:32px}
  .th-p-garage .garage-task-nav a{grid-template-columns:1fr;grid-template-areas:"name arrow" "meta meta";min-height:66px}
  .th-p-garage .garage-task-mark{display:none}
  .th-p-garage .garage-command{width:min(48vw,430px);right:26px}
  .th-p-garage .garage-build-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media (max-width:640px){
  .th-p-garage .hd{background:var(--garage-steel)}
  .th-p-garage .category-hero.garage-bay{display:flex;flex-direction:column;min-height:0}
  .th-p-garage .garage-bay-media{order:1;min-height:0;height:clamp(275px,75vw,360px)}
  .th-p-garage .garage-bay-media::after{background:linear-gradient(180deg,#0912180D 0%,#07101488 100%)}
  .th-p-garage .garage-task-rail{order:2;padding:18px 20px 16px;border-right:0;border-top:1px solid #9BAAB02B}
  .th-p-garage .garage-rail-kicker{font-size:10px}
  .th-p-garage .garage-task-rail h2{max-width:none;margin:8px 0 16px;font-size:34px}
  .th-p-garage .garage-task-nav{grid-template-columns:repeat(2,minmax(0,1fr));border-right:1px solid #9BAAB02B}
  .th-p-garage .garage-task-nav a{min-height:70px;padding:10px;border-right:1px solid #9BAAB02B}
  .th-p-garage .garage-task-nav a:nth-child(odd){border-left:0}
  .th-p-garage .garage-rail-note{display:none}
  .th-p-garage .garage-command{order:3;position:relative;top:auto;right:auto;width:100%;transform:none;padding:28px 20px 30px;background:#E5ECEDEB;box-shadow:none;border:0;border-bottom:4px solid var(--garage-amber)}
  .th-p-garage .garage-command h1{max-width:12ch;font-size:clamp(47px,14vw,68px)}
  .th-p-garage .garage-command h1.long{font-size:clamp(37px,11.5vw,53px)}
  .th-p-garage .garage-command .sub{margin-top:15px;font-size:16px}
  .th-p-garage .garage-command .ctas{margin-top:21px}
  .th-p-garage .garage-command .btn{width:100%;min-height:48px}
  .th-p-garage .garage-bay .motion-toggle{top:clamp(225px,59vw,310px);right:14px;bottom:auto}
  .th-p-garage .garage-discovery{width:min(calc(100% - 32px),1320px);padding-top:44px}
  .th-p-garage .garage-discovery-head{grid-template-columns:1fr;gap:15px;margin-bottom:18px}
  .th-p-garage .garage-discovery-head h2{font-size:clamp(41px,13vw,58px)}
  .th-p-garage .garage-discovery-head > p{font-size:14px}
  .th-p-garage .garage-build-grid{grid-template-columns:1fr 1fr}
  .th-p-garage .garage-build-info{min-height:126px;padding:14px 12px}
  .th-p-garage .garage-build-info b{font-size:20px}
}
@media (max-width:390px){
  .th-p-garage .garage-task-nav{grid-template-columns:1fr}
  .th-p-garage .garage-task-nav a{grid-template-columns:1fr auto;grid-template-areas:"name arrow" "meta meta";border-right:0}
  .th-p-garage .garage-build-grid{grid-template-columns:1fr}
  .th-p-garage .garage-build-media{aspect-ratio:1.55/1}
}
`;

import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-car-wheels',
  name: 'RADIUS / FORM',
  for: 'Performance car wheels and alloy rims',
  vibe: 'Circular studio gallery, midnight metal, mineral white, and copper glints',
  category: 'Performance car wheels and alloy rims',
  group: 'outdoor',
  display: 'Archivo Black',
  body: 'DM Sans',
  displayWeight: 400,
  tracking: '-.045em',
  colors: {
    bg: '#0B0F14',
    surface: '#151B22',
    ink: '#F4F2EA',
    muted: '#9FA8AD',
    line: '#39434B',
    accent: '#D57946',
    onAccent: '#131619',
    panel: '#E9E5DB',
    onPanel: '#182027',
    foot: '#070A0D',
    onFoot: '#DDE0DC',
    bar: '#0B0F14',
    onBar: '#F4F2EA',
    badge: '#D57946',
    onBadge: '#131619',
  },
  header: 'stack',
  hero: 'spotlight',
  card: 'boxed',
  ratio: '1/1',
  rCard: 16,
  rBtn: 999,
  motion: 'pan',
  copy: {
    eyebrow: 'THE WHEEL STUDY',
    collection: 'The current circle',
    cta: 'Explore the collection',
    title: 'Make the turn your own.',
    subtitle: 'A considered edit of wheels, held in form and finish.',
  },
});

const countLabel = (count, noun = 'item') => `${count} ${count === 1 ? noun : `${noun}s`}`;

const liveCategories = (ctx) => (Array.isArray(ctx.cats) ? ctx.cats : [])
  .filter((category) => category?.name)
  .slice(0, 3);

const liveProducts = (ctx) => (Array.isArray(ctx.products) ? ctx.products : []).slice(0, 3);

const categoryIndex = (ctx, categories) => {
  if (!categories.length) {
    return '<p class="wheels-index-empty">The current selection continues below.</p>';
  }

  return `<nav class="wheels-index-nav" aria-label="Browse live collections">${categories.map((category, index) => {
    const count = Number(category.count) || 0;
    return `<a href="${ctx.esc(ctx.categoryLink(category.name))}"><span class="wheels-index-number">${String(index + 1).padStart(2, '0')}</span><span>${ctx.esc(category.name)}</span><small>${ctx.esc(countLabel(count))}</small><i aria-hidden="true">↗</i></a>`;
  }).join('')}</nav>`;
};

export function hero(ctx) {
  const categories = liveCategories(ctx);
  return `<section class="hero category-hero wheels-observatory${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="wheels-hero-surface">
      <div class="wheels-hero-copy">${ctx.copy('wheels-copy')}</div>
      <div class="wheels-orbit" aria-label="Storefront image">
        <div class="wheels-orbit-media">${ctx.media(0, { priority: true, lazy: false })}</div>
        <span class="wheels-orbit-ring wheels-orbit-ring-one" aria-hidden="true"></span>
        <span class="wheels-orbit-ring wheels-orbit-ring-two" aria-hidden="true"></span>
      </div>
      <aside class="wheels-index">
        <p class="wheels-index-kicker">LIVE COLLECTIONS</p>
        ${categoryIndex(ctx, categories)}
      </aside>
      <p class="wheels-hero-note" aria-hidden="true">CURRENT / CIRCULAR / EDIT</p>
      ${ctx.controls}
    </div>
  </section>`;
}

const categoryTile = (ctx, category, index) => {
  const count = Number(category.count) || 0;
  const media = category.image
    ? `<div class="wheels-tile-media"><img src="${ctx.esc(category.image)}" alt="" loading="lazy" decoding="async"></div>`
    : `<div class="wheels-tile-media wheels-tile-empty" aria-hidden="true"><span></span></div>`;
  return `<a class="wheels-catalogue-tile" href="${ctx.esc(ctx.categoryLink(category.name))}">
    <span class="wheels-tile-number">${String(index + 1).padStart(2, '0')}</span>
    ${media}
    <span class="wheels-tile-copy"><small>${ctx.esc(countLabel(count))}</small><strong>${ctx.esc(category.name)}</strong><em>View collection <i aria-hidden="true">→</i></em></span>
  </a>`;
};

const productTile = (ctx, product, index) => {
  const title = ctx.esc(product.title || 'Untitled product');
  const price = typeof product.price_cents === 'number' ? ctx.money(product.price_cents, product.currency) : '';
  const image = product.image_url
    ? `<div class="wheels-tile-media"><img src="${ctx.esc(product.image_url)}" alt="${ctx.esc(product.alt_text || product.title || '')}" loading="lazy" decoding="async"></div>`
    : `<div class="wheels-tile-media wheels-tile-empty" aria-hidden="true"><span></span></div>`;
  return `<a class="wheels-catalogue-tile wheels-product-tile" href="${ctx.esc(ctx.productLink(product))}">
    <span class="wheels-tile-number">${String(index + 1).padStart(2, '0')}</span>
    ${image}
    <span class="wheels-tile-copy"><small>${price ? ctx.esc(price) : 'Current selection'}</small><strong>${title}</strong><em>View product <i aria-hidden="true">→</i></em></span>
  </a>`;
};

export function discovery(ctx) {
  const categories = liveCategories(ctx);
  const products = liveProducts(ctx);
  if (categories.length >= 2) {
    return `<section class="theme-discovery wheels-discovery" aria-labelledby="wheels-discovery-title">
      <div class="wheels-discovery-head">
        <p class="wheels-discovery-kicker">THE CIRCULAR INDEX</p>
        <div><h2 id="wheels-discovery-title">Enter by collection.</h2><p>Begin with a live collection, then follow the details that catch your eye.</p></div>
        <a class="wheels-all-link" href="#shop">View all <span aria-hidden="true">→</span></a>
      </div>
      <div class="wheels-catalogue-grid">${categories.map((category, index) => categoryTile(ctx, category, index)).join('')}</div>
    </section>`;
  }
  if (!products.length) return '';
  return `<section class="theme-discovery wheels-discovery" aria-labelledby="wheels-discovery-title">
    <div class="wheels-discovery-head">
      <p class="wheels-discovery-kicker">CURRENTLY IN THE CIRCLE</p>
      <div><h2 id="wheels-discovery-title">Start with what is here.</h2><p>Explore the live selection before the full collection below.</p></div>
      <a class="wheels-all-link" href="#shop">View all <span aria-hidden="true">→</span></a>
    </div>
    <div class="wheels-catalogue-grid">${products.map((product, index) => productTile(ctx, product, index)).join('')}</div>
  </section>`;
}

export const css = `
.th-p-car-wheels{
  --wheels-night:#0B0F14;
  --wheels-graphite:#151B22;
  --wheels-stone:#E9E5DB;
  --wheels-copper:#D57946;
  --wheels-steel:#9FA8AD;
  background:var(--bg);
  overflow-x:hidden;
}
.th-p-car-wheels :is(.site-header,.store-header,.hd){
  background:var(--wheels-night);
  border-bottom:1px solid #DDE0DC22;
}
.th-p-car-wheels .hd :is(.brand,.nav a,.cart){color:var(--onBar)}
.th-p-car-wheels .hd .cart{border-color:#DDE0DC44}
.th-p-car-wheels .wheels-observatory{
  position:relative;
  overflow:hidden;
  background:var(--wheels-night);
  color:var(--ink);
}
.th-p-car-wheels .wheels-hero-surface{
  position:relative;
  isolation:isolate;
  display:grid;
  grid-template-columns:minmax(220px,.9fr) minmax(360px,1.35fr) minmax(190px,.7fr);
  gap:clamp(22px,4vw,70px);
  align-items:center;
  min-height:clamp(650px,59vw,830px);
  max-width:1600px;
  margin:0 auto;
  padding:clamp(92px,9vw,142px) clamp(22px,5.2vw,84px) clamp(64px,7vw,108px);
}
.th-p-car-wheels .wheels-hero-surface::before{
  content:'';
  position:absolute;
  z-index:-2;
  width:min(84vw,1120px);
  aspect-ratio:1;
  top:50%;
  left:46%;
  border:1px solid #F4F2EA0B;
  border-radius:50%;
  box-shadow:0 0 0 70px #F4F2EA07,0 0 0 150px #F4F2EA05;
  transform:translate(-50%,-50%);
  pointer-events:none;
}
.th-p-car-wheels .wheels-hero-surface::after{
  content:'';
  position:absolute;
  z-index:-1;
  inset:auto 0 0;
  height:1px;
  background:linear-gradient(90deg,transparent,#DDE0DC46 18%,#DDE0DC46 82%,transparent);
}
.th-p-car-wheels .wheels-hero-copy{
  align-self:center;
  min-width:0;
  padding-bottom:clamp(0px,3vw,40px);
}
.th-p-car-wheels .wheels-copy .eyebrow,
.th-p-car-wheels .wheels-index-kicker,
.th-p-car-wheels .wheels-discovery-kicker{
  margin:0 0 16px;
  color:var(--wheels-copper);
  font:700 10px/1.2 var(--body);
  letter-spacing:.2em;
  text-transform:uppercase;
}
.th-p-car-wheels .wheels-copy h1{
  max-width:8ch;
  margin:0;
  color:#F4F2EA;
  font:400 clamp(48px,6.1vw,96px)/.86 var(--display);
  letter-spacing:var(--tracking);
  text-transform:uppercase;
  overflow-wrap:anywhere;
}
.th-p-car-wheels .wheels-copy h1.long{font-size:clamp(39px,4.65vw,72px);line-height:.92}
.th-p-car-wheels .wheels-copy .sub{
  max-width:30ch;
  margin:24px 0 0;
  color:#C6CDCC;
  font:500 clamp(14px,1.25vw,17px)/1.58 var(--body);
  overflow-wrap:anywhere;
}
.th-p-car-wheels .wheels-copy .ctas{
  display:flex;
  flex-wrap:wrap;
  gap:10px;
  margin-top:28px;
}
.th-p-car-wheels .wheels-copy .btn,
.th-p-car-wheels .wheels-all-link{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  min-height:46px;
  padding:11px 17px;
  border:1px solid var(--wheels-copper);
  border-radius:999px;
  background:var(--wheels-copper);
  color:#131619;
  font:700 11px/1.1 var(--body);
  letter-spacing:.08em;
  text-decoration:none;
  text-transform:uppercase;
  transition:background-color .18s ease,border-color .18s ease,color .18s ease;
}
.th-p-car-wheels .wheels-copy .btn:hover,
.th-p-car-wheels .wheels-all-link:hover{background:#F0A06F;border-color:#F0A06F;color:#131619}
.th-p-car-wheels .wheels-copy .btn.ghost{border-color:#DDE0DC77;background:transparent;color:#F4F2EA}
.th-p-car-wheels .wheels-copy .btn.ghost:hover{border-color:#F4F2EA;background:#F4F2EA;color:#131619}
.th-p-car-wheels .wheels-orbit{
  position:relative;
  z-index:1;
  width:min(100%,670px);
  aspect-ratio:1;
  justify-self:center;
  overflow:visible;
}
.th-p-car-wheels .wheels-orbit-media{
  position:relative;
  width:100%;
  height:100%;
  overflow:hidden;
  border:1px solid #F4F2EA33;
  border-radius:50%;
  background:#1B242C;
  box-shadow:0 28px 70px #0000005C;
}
.th-p-car-wheels .wheels-orbit-media::after{
  content:'';
  position:absolute;
  inset:0;
  background:radial-gradient(circle at 47% 48%,transparent 0 43%,#05080A22 60%,#05080A9E 100%);
  pointer-events:none;
}
.th-p-car-wheels .wheels-orbit-media .hero-media,
.th-p-car-wheels .wheels-orbit-media .theme-empty-media{
  display:block;
  width:100%;
  height:100%;
  object-fit:cover;
}
.th-p-car-wheels .wheels-orbit-media .hero-media{object-position:64% center}
.th-p-car-wheels .wheels-orbit-media .theme-empty-media{
  min-height:0;
  background:radial-gradient(circle at 50% 50%,#546069 0 5%,#242D34 5.4% 15%,#11171D 15.4% 29%,#303C42 29.5% 31%,#11171D 31.5% 52%,#080C10 52.5%);
  color:#DDE0DC;
}
.th-p-car-wheels .wheels-orbit-ring{
  position:absolute;
  z-index:-1;
  border:1px solid #DDE0DC3D;
  border-radius:50%;
  pointer-events:none;
}
.th-p-car-wheels .wheels-orbit-ring-one{inset:-16px}
.th-p-car-wheels .wheels-orbit-ring-two{inset:-45px;border-color:#D5794652}
.th-p-car-wheels .wheels-index{
  align-self:stretch;
  display:flex;
  flex-direction:column;
  justify-content:center;
  min-width:0;
  padding-left:clamp(0px,1vw,16px);
  border-left:1px solid #DDE0DC36;
}
.th-p-car-wheels .wheels-index-kicker{margin-bottom:14px;color:#C6CDCC}
.th-p-car-wheels .wheels-index-nav{
  display:grid;
  border-top:1px solid #DDE0DC29;
}
.th-p-car-wheels .wheels-index-nav a{
  display:grid;
  grid-template-columns:27px minmax(0,1fr) auto;
  grid-template-areas:'number name arrow' 'number count arrow';
  column-gap:10px;
  align-items:center;
  min-height:68px;
  padding:11px 0;
  border-bottom:1px solid #DDE0DC29;
  color:#F4F2EA;
  font:600 14px/1.1 var(--body);
  text-decoration:none;
}
.th-p-car-wheels .wheels-index-nav a:hover{color:var(--wheels-copper)}
.th-p-car-wheels .wheels-index-number{grid-area:number;color:var(--wheels-copper);font:700 10px/1 var(--body);letter-spacing:.1em}
.th-p-car-wheels .wheels-index-nav a > span:nth-child(2){grid-area:name;overflow-wrap:anywhere}
.th-p-car-wheels .wheels-index-nav small{grid-area:count;margin-top:3px;color:#9FA8AD;font:500 10px/1.2 var(--body)}
.th-p-car-wheels .wheels-index-nav i{grid-area:arrow;color:var(--wheels-copper);font:400 17px/1 var(--body);font-style:normal}
.th-p-car-wheels .wheels-index-empty{
  max-width:17ch;
  margin:0;
  padding:15px 0;
  border-top:1px solid #DDE0DC29;
  border-bottom:1px solid #DDE0DC29;
  color:#B8C0C0;
  font:500 14px/1.5 var(--body);
}
.th-p-car-wheels .wheels-hero-note{
  position:absolute;
  right:clamp(22px,5.2vw,84px);
  bottom:clamp(25px,3vw,48px);
  margin:0;
  color:#9FA8AD;
  font:700 9px/1 var(--body);
  letter-spacing:.23em;
}
.th-p-car-wheels .wheels-observatory .motion-toggle{
  position:absolute;
  right:clamp(22px,5.2vw,84px);
  top:clamp(27px,3.2vw,45px);
  min-height:44px;
  padding:9px 13px;
  border:1px solid #DDE0DC66;
  border-radius:999px;
  background:#0B0F14C7;
  color:#F4F2EA;
  font:700 10px/1 var(--body);
  letter-spacing:.08em;
}
.th-p-car-wheels .wheels-discovery{
  padding:clamp(48px,7vw,104px) clamp(20px,5.2vw,84px) clamp(58px,8vw,120px);
  background:var(--wheels-stone);
  color:var(--onPanel);
}
.th-p-car-wheels .wheels-discovery-head{
  display:grid;
  grid-template-columns:minmax(132px,.7fr) minmax(0,2fr) auto;
  gap:clamp(18px,3vw,52px);
  align-items:end;
  max-width:1440px;
  margin:0 auto clamp(30px,4vw,52px);
}
.th-p-car-wheels .wheels-discovery-kicker{align-self:start;margin-top:9px;color:#895031}
.th-p-car-wheels .wheels-discovery-head h2{
  max-width:10ch;
  margin:0;
  color:#182027;
  font:400 clamp(38px,5.3vw,78px)/.9 var(--display);
  letter-spacing:var(--tracking);
  text-transform:uppercase;
  overflow-wrap:anywhere;
}
.th-p-car-wheels .wheels-discovery-head div p{
  max-width:43ch;
  margin:17px 0 0;
  color:#536068;
  font:500 14px/1.55 var(--body);
}
.th-p-car-wheels .wheels-all-link{align-self:end;gap:14px;background:#182027;border-color:#182027;color:#F4F2EA;white-space:nowrap}
.th-p-car-wheels .wheels-all-link span{color:var(--wheels-copper);font-size:17px}
.th-p-car-wheels .wheels-catalogue-grid{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:clamp(14px,2vw,28px);
  max-width:1440px;
  margin:0 auto;
}
.th-p-car-wheels .wheels-catalogue-tile{
  position:relative;
  display:flex;
  flex-direction:column;
  min-width:0;
  min-height:100%;
  padding:clamp(18px,2vw,28px);
  overflow:hidden;
  border:1px solid #3B454B;
  border-radius:16px;
  background:#F0EDE4;
  color:#182027;
  text-decoration:none;
  transition:background-color .18s ease,border-color .18s ease,color .18s ease;
}
.th-p-car-wheels .wheels-catalogue-tile:hover{border-color:#182027;background:#182027;color:#F4F2EA}
.th-p-car-wheels .wheels-tile-number{
  position:absolute;
  z-index:2;
  top:clamp(18px,2vw,28px);
  left:clamp(18px,2vw,28px);
  display:grid;
  width:30px;
  height:30px;
  place-items:center;
  border:1px solid currentColor;
  border-radius:50%;
  font:700 10px/1 var(--body);
  letter-spacing:.08em;
}
.th-p-car-wheels .wheels-tile-media{
  position:relative;
  width:min(79%,300px);
  aspect-ratio:1;
  margin:4px auto clamp(18px,2vw,28px);
  overflow:hidden;
  border:1px solid #3B454B77;
  border-radius:50%;
  background:#C9D0D0;
  transition:border-color .18s ease;
}
.th-p-car-wheels .wheels-catalogue-tile:hover .wheels-tile-media{border-color:#F4F2EA77}
.th-p-car-wheels .wheels-tile-media img{
  display:block;
  width:100%;
  height:100%;
  object-fit:cover;
}
.th-p-car-wheels .wheels-tile-empty{
  background:radial-gradient(circle at 50% 50%,#E8E6DE 0 5%,#626E73 5.4% 14%,#202A30 14.5% 29%,#768287 29.5% 31%,#2D383D 31.5% 50%,#10161A 50.5%);
}
.th-p-car-wheels .wheels-tile-empty span{
  position:absolute;
  inset:24%;
  border:1px solid #DDE0DC55;
  border-radius:50%;
}
.th-p-car-wheels .wheels-tile-copy{display:grid;gap:7px;min-width:0;margin-top:auto}
.th-p-car-wheels .wheels-tile-copy small{color:#697277;font:700 10px/1.2 var(--body);letter-spacing:.13em;text-transform:uppercase}
.th-p-car-wheels .wheels-catalogue-tile:hover .wheels-tile-copy small{color:#C6CDCC}
.th-p-car-wheels .wheels-tile-copy strong{
  display:block;
  font:400 clamp(24px,2.7vw,43px)/.9 var(--display);
  letter-spacing:var(--tracking);
  text-transform:uppercase;
  overflow-wrap:anywhere;
}
.th-p-car-wheels .wheels-tile-copy em{margin-top:9px;color:#59666D;font:700 11px/1.2 var(--body);font-style:normal;letter-spacing:.03em}
.th-p-car-wheels .wheels-tile-copy em i{margin-left:5px;color:var(--wheels-copper);font-size:16px;font-style:normal}
.th-p-car-wheels .wheels-catalogue-tile:hover .wheels-tile-copy em{color:#E1E3DE}
.th-p-car-wheels .shop-section,
.th-p-car-wheels #shop{background:var(--bg);color:var(--ink)}
.th-p-car-wheels :is(.shop-section,.shop-section .section-heading,#shop .section-heading){border-color:var(--line)}
.th-p-car-wheels .product-card{border:1px solid var(--line);border-radius:16px;background:var(--surface)}
.th-p-car-wheels .product-card :is(.product-image,img){border-radius:15px 15px 0 0}
.th-p-car-wheels .product-card:hover{border-color:#DDE0DC77}
@media (max-width:980px){
  .th-p-car-wheels .wheels-hero-surface{grid-template-columns:minmax(0,1fr) minmax(245px,.82fr);gap:34px;min-height:710px}
  .th-p-car-wheels .wheels-index{grid-column:1/-1;display:block;padding:0;border-top:1px solid #DDE0DC36;border-left:0}
  .th-p-car-wheels .wheels-index-kicker{margin:18px 0 0}
  .th-p-car-wheels .wheels-index-nav{grid-template-columns:repeat(3,minmax(0,1fr));border-left:1px solid #DDE0DC29}
  .th-p-car-wheels .wheels-index-nav a{min-height:72px;padding:11px;border-right:1px solid #DDE0DC29}
  .th-p-car-wheels .wheels-index-empty{max-width:none;margin-top:15px}
  .th-p-car-wheels .wheels-discovery-head{grid-template-columns:minmax(0,1fr) auto}
  .th-p-car-wheels .wheels-discovery-kicker{grid-column:1/-1;margin:0}
}
@media (max-width:680px){
  .th-p-car-wheels .wheels-hero-surface{display:flex;flex-direction:column;align-items:stretch;min-height:0;padding:86px 20px 42px;gap:26px}
  .th-p-car-wheels .wheels-hero-surface::before{width:118vw;top:252px;left:50%;box-shadow:0 0 0 36px #F4F2EA07,0 0 0 80px #F4F2EA05}
  .th-p-car-wheels .wheels-hero-copy{order:2;padding:0}
  .th-p-car-wheels .wheels-copy h1{max-width:10ch;font-size:clamp(45px,13.8vw,68px)}
  .th-p-car-wheels .wheels-copy h1.long{font-size:clamp(36px,11vw,53px)}
  .th-p-car-wheels .wheels-copy .sub{margin-top:18px}
  .th-p-car-wheels .wheels-copy .ctas{margin-top:23px}
  .th-p-car-wheels .wheels-copy .btn{flex:1 1 155px;min-height:48px}
  .th-p-car-wheels .wheels-orbit{order:1;width:min(100%,390px);margin:0 auto}
  .th-p-car-wheels .wheels-orbit-ring-one{inset:-10px}
  .th-p-car-wheels .wheels-orbit-ring-two{inset:-28px}
  .th-p-car-wheels .wheels-index{order:3;margin-top:5px}
  .th-p-car-wheels .wheels-index-kicker{margin:16px 0 9px}
  .th-p-car-wheels .wheels-index-nav{grid-template-columns:1fr}
  .th-p-car-wheels .wheels-index-nav a{grid-template-columns:28px minmax(0,1fr) auto;min-height:58px;border-right:0}
  .th-p-car-wheels .wheels-hero-note{display:none}
  .th-p-car-wheels .wheels-observatory .motion-toggle{top:18px;right:20px}
  .th-p-car-wheels .wheels-discovery{padding:48px 20px 62px}
  .th-p-car-wheels .wheels-discovery-head{grid-template-columns:1fr;gap:18px;margin-bottom:28px}
  .th-p-car-wheels .wheels-discovery-head h2{font-size:clamp(38px,12.5vw,57px)}
  .th-p-car-wheels .wheels-discovery-head div p{margin-top:13px}
  .th-p-car-wheels .wheels-all-link{justify-self:start;min-height:48px}
  .th-p-car-wheels .wheels-catalogue-grid{grid-template-columns:1fr;gap:15px}
  .th-p-car-wheels .wheels-catalogue-tile{display:grid;grid-template-columns:minmax(120px,.72fr) minmax(0,1fr);gap:17px;align-items:center;min-height:194px;padding:18px}
  .th-p-car-wheels .wheels-tile-number{top:18px;left:18px}
  .th-p-car-wheels .wheels-tile-media{width:100%;margin:0}
  .th-p-car-wheels .wheels-tile-copy{margin:0;padding-top:30px}
  .th-p-car-wheels .wheels-tile-copy strong{font-size:clamp(26px,8.7vw,40px)}
}
@media (max-width:390px){
  .th-p-car-wheels .wheels-catalogue-tile{grid-template-columns:106px minmax(0,1fr);gap:13px}
  .th-p-car-wheels .wheels-tile-copy strong{font-size:25px}
}
@media (prefers-reduced-motion:reduce){
  .th-p-car-wheels :is(.wheels-copy .btn,.wheels-all-link,.wheels-catalogue-tile,.wheels-tile-media){transition:none}
}
`;

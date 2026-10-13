import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-car-care-products',
  name: 'LUSTRE / ROUTINE',
  for: 'Automotive detailing and car-care products',
  vibe: 'A lacquered finish lab: mineral ivory, midnight paint, copper glass, and the quiet precision of a detailing bay.',
  category: 'Automotive detailing and car-care products',
  group: 'outdoor',
  display: 'Archivo Narrow',
  body: 'DM Sans',
  displayWeight: 700,
  tracking: '-.055em',
  colors: {
    bg: '#F4F0E8',
    surface: '#FFFDF8',
    ink: '#17242C',
    muted: '#6A777C',
    line: '#D7D3C9',
    accent: '#C66A3C',
    onAccent: '#FFF9F0',
    panel: '#17242C',
    onPanel: '#F7F1E7',
    foot: '#0C151A',
    onFoot: '#F4F0E8',
    bar: '#F4F0E8',
    onBar: '#17242C',
    badge: '#D49A58',
    onBadge: '#17242C',
  },
  header: 'center',
  hero: 'editorial',
  card: 'boxed',
  ratio: '4/5',
  rCard: 18,
  rBtn: 999,
  motion: 'drift',
  copy: {
    eyebrow: 'The finish table',
    collection: 'Choose your ritual',
    cta: 'Shop the care shelf',
    title: 'Keep the glow in motion.',
    subtitle: 'Purposeful care for the surfaces you live with.',
  },
});

const plural = (count, singular) => `${count} ${count === 1 ? singular : `${singular}s`}`;

export function hero(ctx) {
  const categories = Array.isArray(ctx.cats) ? ctx.cats.filter((category) => category?.name) : [];
  const collectionNote = categories.length
    ? `${plural(categories.length, 'live collection')} / CURRENT EDIT`
    : 'CURRENT EDIT / SURFACE CARE';

  return `<section class="hero category-hero care-hero${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="care-hero-frame">
      <p class="care-hero-index" aria-hidden="true"><span>01</span><span>FINISH STUDY</span></p>
      <p class="care-hero-note" aria-hidden="true">${ctx.esc(collectionNote)}</p>
      <div class="care-hero-media">${ctx.media(0, { priority: true, lazy: false })}</div>
      <div class="care-hero-glaze" aria-hidden="true"></div>
      <div class="care-hero-copy-shell">${ctx.copy('care-main-copy')}</div>
      <div class="care-hero-swatch" aria-hidden="true"><i></i><i></i><i></i><span>PAINT / GLASS / TRIM</span></div>
      ${ctx.controls}
    </div>
  </section>`;
}

const categoryCard = (ctx, category, index) => {
  const count = Number(category.count) || 0;
  const image = category.image
    ? `<div class="care-category-image"><img src="${ctx.esc(category.image)}" alt="" loading="lazy" decoding="async"></div>`
    : `<div class="care-category-image care-category-empty" aria-hidden="true"><span>${String(index + 1).padStart(2, '0')}</span></div>`;

  return `<a class="care-category-card" href="${ctx.esc(ctx.categoryLink(category.name))}">
    <span class="care-category-no">${String(index + 1).padStart(2, '0')}</span>
    ${image}
    <span class="care-category-copy"><b>${ctx.esc(category.name)}</b><small>${ctx.esc(plural(count, 'item'))}</small><em>Browse collection <i aria-hidden="true">↗</i></em></span>
  </a>`;
};

export function discovery(ctx) {
  const categories = Array.isArray(ctx.cats) ? ctx.cats.filter((category) => category?.name).slice(0, 4) : [];
  const products = Array.isArray(ctx.products) ? ctx.products.slice(0, 4) : [];

  if (categories.length >= 2) {
    return `<section class="theme-discovery care-discovery" aria-labelledby="care-discovery-title">
      <div class="care-discovery-lede">
        <p class="care-kicker">CURRENT CARE SHELF</p>
        <div><h2 id="care-discovery-title">${ctx.esc(ctx.t.copy?.collection || 'Choose your ritual')}</h2><p>Start with a live collection, then find the details that make a surface feel considered.</p></div>
        <a class="care-all-link" href="#shop">View everything <span aria-hidden="true">→</span></a>
      </div>
      <div class="care-category-shelf">${categories.map((category, index) => categoryCard(ctx, category, index)).join('')}</div>
    </section>`;
  }

  if (!products.length) return '';

  return `<section class="theme-discovery care-discovery care-discovery-products" aria-labelledby="care-discovery-title">
    <div class="care-discovery-lede">
      <p class="care-kicker">CURRENT CARE SHELF</p>
      <div><h2 id="care-discovery-title">The current edit.</h2><p>Explore the products currently available in this collection.</p></div>
      <a class="care-all-link" href="#shop">View everything <span aria-hidden="true">→</span></a>
    </div>
    <div class="care-product-samples">${products.map((product) => ctx.productCard(product)).join('')}</div>
  </section>`;
}

export const css = `
.th-p-car-care-products{
  --care-ink:#17242C;
  --care-cream:#F4F0E8;
  --care-copper:#C66A3C;
  --care-amber:#D49A58;
  --care-line:#D7D3C9;
  background:var(--care-cream);
  color:var(--care-ink);
}
.th-p-car-care-products .hd,
.th-p-car-care-products .site-header,
.th-p-car-care-products .store-header{
  background:var(--care-cream);
  border-bottom:1px solid var(--care-line);
}
.th-p-car-care-products .hd .brand,
.th-p-car-care-products .site-header .brand,
.th-p-car-care-products .store-header .brand{
  color:var(--care-ink);
  font-family:var(--display);
  font-weight:700;
  letter-spacing:.055em;
}
.th-p-car-care-products .hd .nav a,
.th-p-car-care-products .hd .cart,
.th-p-car-care-products .site-header a,
.th-p-car-care-products .store-header a{color:var(--care-ink)}
.th-p-car-care-products .care-hero{
  overflow:hidden;
  background:var(--care-cream);
  color:var(--care-ink);
}
.th-p-car-care-products .care-hero-frame{
  position:relative;
  isolation:isolate;
  display:grid;
  grid-template-columns:minmax(22px,1fr) repeat(10,minmax(0,128px)) minmax(22px,1fr);
  grid-template-rows:clamp(74px,8vw,116px) minmax(390px,44vw) clamp(152px,17vw,242px);
  width:100%;
  max-width:1700px;
  margin:0 auto;
  padding:0 clamp(14px,2.2vw,38px);
}
.th-p-car-care-products .care-hero-media{
  position:relative;
  z-index:-2;
  grid-column:2 / -2;
  grid-row:1 / 3;
  overflow:hidden;
  border-radius:0 0 44px 44px;
  background:#27353B;
}
.th-p-car-care-products .care-hero-media::after{
  position:absolute;
  inset:0;
  content:'';
  pointer-events:none;
  background:linear-gradient(180deg,#0B121622 0%,transparent 38%,#0B121659 100%),linear-gradient(90deg,#0B121633 0%,transparent 30%,#0B12161F 100%);
}
.th-p-car-care-products .care-hero-media .hero-media,
.th-p-car-care-products .care-hero-media .theme-empty-media{
  display:block;
  width:100%;
  height:100%;
  object-fit:cover;
  object-position:center;
}
.th-p-car-care-products .care-hero-media .theme-empty-media{
  display:grid;
  place-items:center;
  background:radial-gradient(circle at 70% 42%,#42616D 0 4%,#22343B 4.4% 17%,transparent 17.4%),linear-gradient(132deg,#C0B5A7 0%,#56676B 47%,#18262D 100%);
  color:#F7F1E7;
}
.th-p-car-care-products .care-hero-media .theme-empty-media span{
  max-width:12ch;
  font:700 clamp(30px,5vw,64px)/.82 var(--display);
  letter-spacing:var(--tracking);
  text-align:center;
  text-transform:uppercase;
}
.th-p-car-care-products .care-hero-glaze{
  position:absolute;
  z-index:-1;
  inset:0 0 auto;
  height:clamp(520px,49vw,750px);
  pointer-events:none;
  background:linear-gradient(90deg,transparent 0 15%,#F4F0E809 15.1% 15.8%,transparent 15.9% 34%,#F4F0E80C 34.1% 34.55%,transparent 34.65% 67%,#F4F0E80D 67.1% 67.7%,transparent 67.8%);
  mix-blend-mode:screen;
}
.th-p-car-care-products .care-hero-index,
.th-p-car-care-products .care-hero-note{
  position:relative;
  z-index:2;
  align-self:center;
  margin:0;
  color:#F4F0E8;
  font:700 10px/1.2 var(--body);
  letter-spacing:.17em;
  text-transform:uppercase;
}
.th-p-car-care-products .care-hero-index{
  grid-column:2 / span 3;
  grid-row:1;
  display:flex;
  align-items:center;
  gap:13px;
}
.th-p-car-care-products .care-hero-index span:first-child{
  display:grid;
  width:30px;
  height:30px;
  place-items:center;
  border:1px solid #F4F0E873;
  border-radius:50%;
  color:var(--care-amber);
  letter-spacing:0;
}
.th-p-car-care-products .care-hero-note{
  grid-column:8 / -2;
  grid-row:1;
  text-align:right;
}
.th-p-car-care-products .care-hero-copy-shell{
  position:relative;
  z-index:2;
  grid-column:4 / 10;
  grid-row:2 / 4;
  align-self:end;
  min-width:0;
  padding:clamp(27px,4.2vw,62px) clamp(24px,5vw,78px) clamp(26px,3.3vw,49px);
  border:1px solid #D7D3C999;
  border-bottom:0;
  background:#FFFDF8F5;
  box-shadow:0 20px 50px #0C151A17;
  backdrop-filter:blur(9px);
}
.th-p-car-care-products .care-main-copy .eyebrow{
  display:flex;
  align-items:center;
  gap:10px;
  margin:0 0 15px;
  color:#8A4C2D;
  font:700 10px/1.2 var(--body);
  letter-spacing:.18em;
  text-transform:uppercase;
}
.th-p-car-care-products .care-main-copy .eyebrow::before{
  width:22px;
  height:1px;
  content:'';
  background:var(--care-copper);
}
.th-p-car-care-products .care-main-copy h1{
  max-width:10.5ch;
  margin:0;
  color:var(--care-ink);
  font:700 clamp(55px,7.3vw,119px)/.78 var(--display);
  letter-spacing:var(--tracking);
  text-transform:uppercase;
  overflow-wrap:anywhere;
}
.th-p-car-care-products .care-main-copy h1.long{
  max-width:13ch;
  font-size:clamp(45px,5.5vw,88px);
  line-height:.82;
}
.th-p-car-care-products .care-main-copy .sub{
  max-width:42ch;
  margin:21px 0 0;
  color:#3B4B51;
  font:500 clamp(14px,1.2vw,17px)/1.52 var(--body);
  overflow-wrap:anywhere;
}
.th-p-car-care-products .care-main-copy .ctas{
  display:flex;
  flex-wrap:wrap;
  gap:10px;
  margin-top:25px;
}
.th-p-car-care-products .care-main-copy .btn,
.th-p-car-care-products .care-all-link{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  min-height:46px;
  padding:0 19px;
  border:1px solid var(--care-ink);
  border-radius:999px;
  background:var(--care-ink);
  color:#FFFDF8;
  font:700 11px/1 var(--body);
  letter-spacing:.1em;
  text-decoration:none;
  text-transform:uppercase;
  transition:background-color .18s ease,border-color .18s ease,color .18s ease;
}
.th-p-car-care-products .care-main-copy .btn:hover,
.th-p-car-care-products .care-all-link:hover{
  border-color:var(--care-copper);
  background:var(--care-copper);
  color:#FFF9F0;
}
.th-p-car-care-products .care-main-copy .btn.ghost{
  background:transparent;
  color:var(--care-ink);
}
.th-p-car-care-products .care-main-copy .btn.ghost:hover{
  color:#FFF9F0;
}
.th-p-car-care-products .care-hero-swatch{
  grid-column:10 / -2;
  grid-row:3;
  align-self:end;
  display:flex;
  align-items:center;
  justify-content:flex-end;
  gap:7px;
  padding:0 0 28px 22px;
  color:#617074;
  font:700 8px/1.2 var(--body);
  letter-spacing:.14em;
  text-align:right;
  text-transform:uppercase;
}
.th-p-car-care-products .care-hero-swatch i{
  display:block;
  width:19px;
  height:19px;
  border-radius:50%;
  border:1px solid #FFFDF8;
  box-shadow:0 0 0 1px #D7D3C9;
}
.th-p-car-care-products .care-hero-swatch i:nth-child(1){background:#17242C}
.th-p-car-care-products .care-hero-swatch i:nth-child(2){background:#C66A3C}
.th-p-car-care-products .care-hero-swatch i:nth-child(3){background:#D49A58}
.th-p-car-care-products .care-hero-swatch span{margin-left:5px;max-width:15ch}
.th-p-car-care-products .care-hero .motion-toggle{
  position:absolute;
  z-index:4;
  right:clamp(30px,4.6vw,72px);
  top:clamp(20px,2.8vw,39px);
  min-height:44px;
  padding:0 13px;
  border:1px solid #F4F0E87A;
  border-radius:999px;
  background:#0C151A8C;
  color:#F4F0E8;
  font:700 9px/1 var(--body);
  letter-spacing:.12em;
  text-transform:uppercase;
}
.th-p-car-care-products .care-hero .motion-toggle:hover{background:var(--care-copper);border-color:var(--care-copper)}
.th-p-car-care-products .care-discovery{
  padding:clamp(55px,7.5vw,116px) clamp(20px,5.4vw,88px) clamp(56px,7.5vw,110px);
  background:var(--care-cream);
  color:var(--care-ink);
}
.th-p-car-care-products .care-discovery-lede{
  display:grid;
  grid-template-columns:minmax(110px,.6fr) minmax(0,2fr) auto;
  gap:clamp(20px,4vw,66px);
  align-items:end;
  max-width:1460px;
  margin:0 auto clamp(30px,4vw,54px);
}
.th-p-car-care-products .care-kicker{
  margin:0 0 5px;
  color:#A35A36;
  font:700 10px/1.2 var(--body);
  letter-spacing:.17em;
  text-transform:uppercase;
}
.th-p-car-care-products .care-discovery-lede h2{
  max-width:11ch;
  margin:0;
  font:700 clamp(47px,6.1vw,91px)/.78 var(--display);
  letter-spacing:var(--tracking);
  text-transform:uppercase;
  overflow-wrap:anywhere;
}
.th-p-car-care-products .care-discovery-lede div p{
  max-width:46ch;
  margin:16px 0 0;
  color:var(--muted);
  font:500 14px/1.55 var(--body);
}
.th-p-car-care-products .care-all-link{gap:13px;min-width:167px}
.th-p-car-care-products .care-all-link span{color:var(--care-amber);font-size:18px}
.th-p-car-care-products .care-category-shelf{
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  max-width:1460px;
  margin:0 auto;
  border-top:1px solid var(--care-ink);
  border-left:1px solid var(--care-ink);
}
.th-p-car-care-products .care-category-card{
  position:relative;
  display:flex;
  flex-direction:column;
  min-width:0;
  min-height:390px;
  border-right:1px solid var(--care-ink);
  border-bottom:1px solid var(--care-ink);
  background:#FFFDF8;
  color:var(--care-ink);
  text-decoration:none;
  transition:background-color .18s ease,color .18s ease;
}
.th-p-car-care-products .care-category-card:hover{background:var(--care-ink);color:#FFFDF8}
.th-p-car-care-products .care-category-no{
  position:absolute;
  z-index:2;
  top:15px;
  left:15px;
  display:grid;
  width:31px;
  height:31px;
  place-items:center;
  border-radius:50%;
  background:#FFFDF8E6;
  color:var(--care-ink);
  font:700 10px/1 var(--body);
  letter-spacing:.08em;
}
.th-p-car-care-products .care-category-image{
  position:relative;
  aspect-ratio:1.16/1;
  overflow:hidden;
  background:#D9D5CD;
}
.th-p-car-care-products .care-category-image::after{
  position:absolute;
  inset:auto 0 0;
  height:35%;
  content:'';
  background:linear-gradient(transparent,#17242C1C);
  pointer-events:none;
}
.th-p-car-care-products .care-category-image img{
  display:block;
  width:100%;
  height:100%;
  object-fit:cover;
  transition:transform .28s ease;
}
.th-p-car-care-products .care-category-card:hover .care-category-image img{transform:scale(1.045)}
.th-p-car-care-products .care-category-empty{
  display:grid;
  place-items:center;
  background:radial-gradient(circle at 50% 50%,#F5F0E6 0 14%,#D7D3C9 14.4% 31%,#B8C0BD 31.5% 32.2%,#E9E4DA 32.5% 100%);
  color:#6C7777;
}
.th-p-car-care-products .care-category-empty span{
  font:700 clamp(40px,5vw,76px)/1 var(--display);
  letter-spacing:var(--tracking);
}
.th-p-car-care-products .care-category-copy{
  display:grid;
  gap:7px;
  flex:1;
  padding:clamp(18px,2vw,29px) clamp(16px,2vw,27px) 23px;
}
.th-p-car-care-products .care-category-copy b{
  font:700 clamp(28px,2.8vw,44px)/.82 var(--display);
  letter-spacing:var(--tracking);
  text-transform:uppercase;
  overflow-wrap:anywhere;
}
.th-p-car-care-products .care-category-copy small{
  color:#718083;
  font:700 10px/1.2 var(--body);
  letter-spacing:.14em;
  text-transform:uppercase;
}
.th-p-car-care-products .care-category-card:hover .care-category-copy small{color:#BBC3C0}
.th-p-car-care-products .care-category-copy em{
  align-self:end;
  margin-top:15px;
  color:#9A542F;
  font:700 10px/1.2 var(--body);
  font-style:normal;
  letter-spacing:.1em;
  text-transform:uppercase;
}
.th-p-car-care-products .care-category-copy em i{
  margin-left:5px;
  font-size:16px;
  font-style:normal;
}
.th-p-car-care-products .care-product-samples{
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  max-width:1460px;
  margin:0 auto;
  gap:14px;
}
.th-p-car-care-products .care-product-samples .product-card,
.th-p-car-care-products .care-product-samples .pc{
  border:1px solid var(--care-ink);
  border-radius:0;
  box-shadow:none;
}
.th-p-car-care-products .care-product-samples .product-card img,
.th-p-car-care-products .care-product-samples .pc img{border-radius:0}
.th-p-car-care-products .shop-section,
.th-p-car-care-products .sec{background:#FFFDF8;color:var(--care-ink)}
.th-p-car-care-products .shop-section .section-heading,
.th-p-car-care-products .sec > .wrap > .sec-h{border-color:var(--care-line)}
.th-p-car-care-products .shop-section h2,
.th-p-car-care-products .sec > .wrap > .sec-h h2{
  font-family:var(--display);
  font-weight:700;
  letter-spacing:var(--tracking);
  text-transform:uppercase;
}
.th-p-car-care-products .chips .chip{
  min-height:44px;
  border-radius:999px;
  font:700 10px/1 var(--body);
  letter-spacing:.1em;
  text-transform:uppercase;
}
.th-p-car-care-products .grid .pc,
.th-p-car-care-products .product-card{border-radius:18px}
.th-p-car-care-products .grid .pc .im,
.th-p-car-care-products .product-card .product-image{border-radius:17px 17px 0 0}
.th-p-car-care-products .ft{background:var(--care-ink);color:#F4F0E8}
.th-p-car-care-products .ft a,
.th-p-car-care-products .ft h4{color:#F4F0E8}
.th-p-car-care-products .care-hero.has-hero-motion[data-hero-motion="pan"] .care-hero-media .hero-media{animation:car-care-products-pan 18s ease-in-out infinite alternate}
.th-p-car-care-products .care-hero.has-hero-motion[data-hero-motion="drift"] .care-hero-media .hero-media{animation:car-care-products-drift 16s ease-in-out infinite alternate}
@keyframes car-care-products-pan{
  from{transform:scale(1.035) translate3d(-1.1%,0,0)}
  to{transform:scale(1.09) translate3d(1.2%,-.8%,0)}
}
@keyframes car-care-products-drift{
  from{transform:scale(1.035) translate3d(0,0,0)}
  to{transform:scale(1.075) translate3d(-1.1%,-.7%,0)}
}
@media (max-width:960px){
  .th-p-car-care-products .care-hero-frame{grid-template-rows:78px minmax(375px,50vw) 205px}
  .th-p-car-care-products .care-hero-copy-shell{grid-column:3 / 11}
  .th-p-car-care-products .care-discovery-lede{grid-template-columns:minmax(0,1fr) auto;gap:22px}
  .th-p-car-care-products .care-kicker{grid-column:1/-1}
  .th-p-car-care-products .care-category-shelf{grid-template-columns:repeat(2,minmax(0,1fr))}
  .th-p-car-care-products .care-category-card{min-height:345px}
  .th-p-car-care-products .care-product-samples{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media (max-width:600px){
  .th-p-car-care-products .hd .nav{display:none}
  .th-p-car-care-products .care-hero-frame{
    grid-template-columns:20px repeat(6,minmax(0,1fr)) 20px;
    grid-template-rows:68px clamp(280px,76vw,350px) auto 66px;
    padding:0;
  }
  .th-p-car-care-products .care-hero-media{grid-column:2 / -2;grid-row:1 / 3;border-radius:0 0 27px 27px}
  .th-p-car-care-products .care-hero-index{grid-column:2 / span 4;grid-row:1;gap:9px;font-size:8px;letter-spacing:.13em}
  .th-p-car-care-products .care-hero-index span:first-child{width:26px;height:26px}
  .th-p-car-care-products .care-hero-note{display:none}
  .th-p-car-care-products .care-hero-media .hero-media{object-position:60% center}
  .th-p-car-care-products .care-hero-copy-shell{
    grid-column:2 / -2;
    grid-row:3;
    align-self:start;
    margin-top:-23px;
    padding:29px 21px 27px;
    border-bottom:1px solid #D7D3C999;
  }
  .th-p-car-care-products .care-main-copy h1,
  .th-p-car-care-products .care-main-copy h1.long{max-width:9.5ch;font-size:clamp(50px,15vw,69px);line-height:.8}
  .th-p-car-care-products .care-main-copy .eyebrow{margin-bottom:13px;font-size:9px}
  .th-p-car-care-products .care-main-copy .sub{margin-top:17px;font-size:14px}
  .th-p-car-care-products .care-main-copy .ctas{margin-top:22px}
  .th-p-car-care-products .care-main-copy .btn{flex:1 1 148px;min-height:48px;padding:0 14px}
  .th-p-car-care-products .care-hero-swatch{grid-column:2 / -2;grid-row:4;justify-content:flex-start;align-self:center;padding:0 21px;font-size:7px;text-align:left}
  .th-p-car-care-products .care-hero-swatch i{width:17px;height:17px}
  .th-p-car-care-products .care-hero .motion-toggle{top:76px;right:20px;min-height:44px;font-size:8px}
  .th-p-car-care-products .care-discovery{padding:54px 20px 62px}
  .th-p-car-care-products .care-discovery-lede{display:block;margin-bottom:29px}
  .th-p-car-care-products .care-kicker{margin-bottom:15px}
  .th-p-car-care-products .care-discovery-lede h2{max-width:10ch;font-size:clamp(45px,14vw,64px)}
  .th-p-car-care-products .care-discovery-lede div p{margin-top:14px;font-size:14px}
  .th-p-car-care-products .care-all-link{width:max-content;min-height:48px;margin-top:22px}
  .th-p-car-care-products .care-category-shelf{grid-template-columns:1fr}
  .th-p-car-care-products .care-category-card{display:grid;grid-template-columns:minmax(136px,.86fr) minmax(0,1fr);min-height:0}
  .th-p-car-care-products .care-category-image{grid-row:1;aspect-ratio:auto;min-height:178px}
  .th-p-car-care-products .care-category-copy{grid-column:2;grid-row:1;padding:21px 16px}
  .th-p-car-care-products .care-category-copy b{font-size:clamp(27px,9vw,39px)}
  .th-p-car-care-products .care-category-copy em{margin-top:12px}
  .th-p-car-care-products .care-category-no{top:11px;left:11px;width:27px;height:27px;font-size:9px}
  .th-p-car-care-products .care-product-samples{grid-template-columns:1fr;gap:13px}
}
@media (max-width:380px){
  .th-p-car-care-products .care-main-copy h1,
  .th-p-car-care-products .care-main-copy h1.long{font-size:clamp(45px,14.4vw,57px)}
  .th-p-car-care-products .care-category-card{grid-template-columns:122px minmax(0,1fr)}
}
@media (prefers-reduced-motion:reduce){
  .th-p-car-care-products .care-hero.has-hero-motion .care-hero-media .hero-media{animation:none;transform:none}
  .th-p-car-care-products .care-main-copy .btn,
  .th-p-car-care-products .care-all-link,
  .th-p-car-care-products .care-category-card,
  .th-p-car-care-products .care-category-image img{transition:none}
}
`; 

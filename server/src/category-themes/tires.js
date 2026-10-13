import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-tires',
  name: 'AXLE / FORM',
  for: 'Tires, wheels, and road-ready upgrades',
  vibe: 'Midnight road engineering',
  category: 'Off-road and all-season tires with wheels',
  group: 'outdoor',
  display: 'Barlow Condensed',
  body: 'Manrope',
  displayWeight: 800,
  tracking: '-.045em',
  colors: {
    bg: '#0A0D10',
    surface: '#11161A',
    ink: '#F1F0EA',
    muted: '#A5A9A7',
    line: '#374047',
    accent: '#F15A24',
    onAccent: '#101113',
    panel: '#E9E5DA',
    onPanel: '#161719',
    foot: '#07090B',
    onFoot: '#D8D9D2',
    bar: '#E9E5DA',
    onBar: '#101113',
    badge: '#F15A24',
    onBadge: '#101113',
  },
  header: 'split',
  hero: 'overlay',
  card: 'bold',
  ratio: '1/1',
  rCard: 0,
  rBtn: 0,
  motion: 'pan',
  copy: {
    eyebrow: 'ROAD / WEATHER / DISTANCE',
    collection: 'The road surface edit',
    cta: 'Browse the setup',
    title: 'Traction in its element.',
    subtitle: 'Tires and wheels for the long road.',
  },
});

export function hero(ctx) {
  return `<section class="hero category-hero tires-hero${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="tires-hero-stage">
      <div class="tires-hero-photo">${ctx.media(0, { priority: true, lazy: false })}</div>
      <div class="tires-hero-copy">${ctx.copy('tires-copy')}</div>
      <div class="tires-hero-index" aria-hidden="true"><span>01</span><span>ROAD SURFACE EDIT</span></div>
      <p class="tires-hero-note" aria-hidden="true">BUILT FOR THE NEXT MILE</p>
      ${ctx.controls}
    </div>
  </section>`;
}

export function discovery(ctx) {
  const categories = Array.isArray(ctx.cats) ? ctx.cats.filter((category) => category?.name).slice(0, 3) : [];
  const products = Array.isArray(ctx.products) ? ctx.products.slice(0, 3) : [];

  if (categories.length >= 2) {
    const lanes = categories.map((category, index) => {
      const count = Number(category.count) || 0;
      const countLabel = `${count} ${count === 1 ? 'item' : 'items'}`;
      return `<a class="tires-lane" href="${ctx.categoryLink(category.name)}">
        <span class="tires-lane-number">0${index + 1}</span>
        <span class="tires-wheel-mark" aria-hidden="true"><i></i></span>
        <span class="tires-lane-copy"><strong>${ctx.esc(category.name)}</strong><small>${ctx.esc(countLabel)}</small></span>
        <span class="tires-lane-arrow" aria-hidden="true">↗</span>
      </a>`;
    }).join('');

    return `<section class="theme-discovery tires-discovery" aria-label="Shop by collection">
      <div class="tires-discovery-head">
        <p class="tires-kicker">THE ROAD SURFACE EDIT</p>
        <div><h2>Choose your line.</h2><p>Start with a live collection, then make the road your own.</p></div>
        <a class="tires-all-link" href="#shop">View all <span aria-hidden="true">→</span></a>
      </div>
      <div class="tires-lanes">${lanes}</div>
    </section>`;
  }

  if (!products.length) return '';

  return `<section class="theme-discovery tires-discovery tires-discovery-products" aria-label="Featured products">
    <div class="tires-discovery-head">
      <p class="tires-kicker">CURRENTLY IN THE GARAGE</p>
      <div><h2>Start with what is here.</h2><p>Explore the current collection below.</p></div>
      <a class="tires-all-link" href="#shop">View all <span aria-hidden="true">→</span></a>
    </div>
    <div class="tires-live-products">${products.map((product) => ctx.productCard(product)).join('')}</div>
  </section>`;
}

export const css = `
.th-p-tires{
  --tires-orange:#F15A24;
  --tires-graphite:#0A0D10;
  --tires-ivory:#E9E5DA;
  --tires-steel:#7E898E;
  background:var(--bg);
}
.th-p-tires .site-header,
.th-p-tires .store-header{
  border-bottom:1px solid color-mix(in srgb,var(--line) 78%,transparent);
  background:var(--bar);
}
.th-p-tires .tires-hero{
  margin:0;
  color:var(--ink);
  background:var(--tires-graphite);
}
.th-p-tires .tires-hero-stage{
  position:relative;
  isolation:isolate;
  display:grid;
  align-items:end;
  min-height:clamp(590px,52vw,760px);
  padding:clamp(112px,11vw,164px) clamp(24px,6vw,96px) clamp(72px,8vw,120px);
  overflow:hidden;
}
.th-p-tires .tires-hero-photo{
  position:absolute;
  inset:0;
  z-index:-2;
  overflow:hidden;
  background:#0A0D10;
}
.th-p-tires .tires-hero-photo::after{
  content:'';
  position:absolute;
  inset:0;
  background:linear-gradient(90deg,#07090bd9 0%,#07090ba8 28%,#07090b3d 54%,#07090b24 100%),linear-gradient(0deg,#07090b85 0%,transparent 42%);
  pointer-events:none;
}
.th-p-tires .tires-hero-photo .hero-media,
.th-p-tires .tires-hero-photo .theme-empty-media{
  display:block;
  width:100%;
  height:100%;
  object-fit:cover;
}
.th-p-tires .tires-hero-photo .theme-empty-media{
  display:grid;
  place-items:center;
  background:radial-gradient(circle at 68% 44%,#31414b 0 4%,#11171c 4.3% 15%,#090c0f 15.4% 31%,transparent 31.4%),linear-gradient(135deg,#172028,#060809 62%);
  color:var(--muted);
}
.th-p-tires .tires-hero-photo .theme-empty-media span{
  max-width:14ch;
  font:700 clamp(28px,4vw,56px)/.92 var(--display);
  letter-spacing:var(--tracking);
  text-align:center;
  text-transform:uppercase;
}
.th-p-tires .tires-hero-copy{
  position:relative;
  z-index:1;
  width:min(100%,580px);
}
.th-p-tires .tires-copy .eyebrow,
.th-p-tires .tires-kicker{
  margin:0 0 17px;
  color:var(--tires-orange);
  font:700 11px/1.2 var(--body);
  letter-spacing:.22em;
  text-transform:uppercase;
}
.th-p-tires .tires-copy h1{
  max-width:10ch;
  margin:0;
  color:#F7F5ED;
  font:800 clamp(74px,10.5vw,168px)/.76 var(--display);
  letter-spacing:var(--tracking);
  text-transform:uppercase;
  overflow-wrap:anywhere;
}
.th-p-tires .tires-copy h1.long{
  font-size:clamp(58px,7vw,112px);
  line-height:.82;
}
.th-p-tires .tires-copy .sub{
  max-width:38ch;
  margin:26px 0 0;
  color:#E5E3DA;
  font:500 clamp(14px,1.2vw,17px)/1.55 var(--body);
  overflow-wrap:anywhere;
}
.th-p-tires .tires-copy .ctas{
  display:flex;
  flex-wrap:wrap;
  gap:12px;
  margin-top:30px;
}
.th-p-tires .tires-copy .btn,
.th-p-tires .tires-all-link{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  min-height:46px;
  padding:0 20px;
  border:1px solid var(--tires-orange);
  border-radius:0;
  background:var(--tires-orange);
  color:#101113;
  font:800 12px/1 var(--body);
  letter-spacing:.08em;
  text-decoration:none;
  text-transform:uppercase;
  transition:background-color .18s ease,color .18s ease,border-color .18s ease;
}
.th-p-tires .tires-copy .btn:hover,
.th-p-tires .tires-all-link:hover{
  border-color:#FF7A48;
  background:#FF7A48;
  color:#101113;
}
.th-p-tires .tires-copy .btn.ghost{
  border-color:#CED0C9;
  background:transparent;
  color:#F7F5ED;
}
.th-p-tires .tires-copy .btn.ghost:hover{
  border-color:#F7F5ED;
  background:#F7F5ED;
  color:#101113;
}
.th-p-tires .tires-hero-index{
  position:absolute;
  top:clamp(26px,3.5vw,52px);
  right:clamp(24px,4vw,64px);
  z-index:1;
  display:flex;
  align-items:center;
  gap:13px;
  color:#DFE2DB;
  font:700 10px/1 var(--body);
  letter-spacing:.18em;
}
.th-p-tires .tires-hero-index span:first-child{
  display:grid;
  width:28px;
  height:28px;
  place-items:center;
  border:1px solid #DFE2DB88;
  color:var(--tires-orange);
  letter-spacing:0;
}
.th-p-tires .tires-hero-note{
  position:absolute;
  right:clamp(24px,4vw,64px);
  bottom:clamp(31px,3.5vw,56px);
  z-index:1;
  margin:0;
  color:#E8E6DE;
  font:700 9px/1.2 var(--body);
  letter-spacing:.26em;
  text-align:right;
}
.th-p-tires .tires-hero .motion-toggle{
  position:absolute;
  right:clamp(24px,4vw,64px);
  bottom:clamp(72px,7vw,112px);
  z-index:2;
  min-height:44px;
  padding:0 13px;
  border:1px solid #D4D8D280;
  border-radius:0;
  background:#0A0D10b8;
  color:#F1F0EA;
  font:700 10px/1 var(--body);
  letter-spacing:.12em;
  text-transform:uppercase;
}
.th-p-tires .tires-discovery{
  padding:clamp(42px,6vw,88px) clamp(20px,6vw,96px) clamp(50px,7vw,104px);
  background:var(--panel);
  color:var(--onPanel);
}
.th-p-tires .tires-discovery-head{
  display:grid;
  grid-template-columns:minmax(132px,.72fr) minmax(0,2.4fr) auto;
  gap:28px;
  align-items:end;
  max-width:1480px;
  margin:0 auto 34px;
}
.th-p-tires .tires-discovery-head .tires-kicker{
  margin:0 0 5px;
  color:var(--tires-orange);
}
.th-p-tires .tires-discovery-head h2{
  max-width:9ch;
  margin:0;
  font:800 clamp(46px,6vw,88px)/.8 var(--display);
  letter-spacing:var(--tracking);
  text-transform:uppercase;
  overflow-wrap:anywhere;
}
.th-p-tires .tires-discovery-head div p{
  max-width:44ch;
  margin:15px 0 0;
  color:#555B5B;
  font:500 14px/1.55 var(--body);
}
.th-p-tires .tires-all-link{
  gap:15px;
  min-width:130px;
  border-color:#171A1C;
  background:#171A1C;
  color:#F2F0E8;
}
.th-p-tires .tires-all-link span{
  color:var(--tires-orange);
  font-size:18px;
}
.th-p-tires .tires-lanes{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  max-width:1480px;
  margin:0 auto;
  border-top:1px solid #1B1F21;
  border-left:1px solid #1B1F21;
}
.th-p-tires .tires-lane{
  position:relative;
  display:grid;
  grid-template-columns:auto minmax(82px,1fr) minmax(0,1.4fr) auto;
  gap:clamp(14px,2vw,28px);
  align-items:center;
  min-height:220px;
  padding:25px clamp(18px,2.3vw,38px);
  border-right:1px solid #1B1F21;
  border-bottom:1px solid #1B1F21;
  background:#E9E5DA;
  color:#171A1C;
  text-decoration:none;
  transition:background-color .18s ease,color .18s ease;
}
.th-p-tires .tires-lane::before{
  content:'';
  position:absolute;
  inset:0;
  background:repeating-linear-gradient(135deg,transparent 0 13px,#1B1F2108 13px 14px);
  opacity:0;
  transition:opacity .18s ease;
}
.th-p-tires .tires-lane:hover{
  background:#171A1C;
  color:#F1F0EA;
}
.th-p-tires .tires-lane:hover::before{opacity:1}
.th-p-tires .tires-lane > *{position:relative;z-index:1}
.th-p-tires .tires-lane-number{
  align-self:start;
  color:var(--tires-orange);
  font:800 12px/1 var(--body);
  letter-spacing:.12em;
}
.th-p-tires .tires-wheel-mark{
  position:relative;
  display:grid;
  width:clamp(72px,8vw,126px);
  aspect-ratio:1;
  place-items:center;
  border:clamp(8px,1vw,15px) solid currentColor;
  border-radius:50%;
}
.th-p-tires .tires-wheel-mark::before,
.th-p-tires .tires-wheel-mark::after,
.th-p-tires .tires-wheel-mark i{
  content:'';
  position:absolute;
  width:70%;
  height:1px;
  background:currentColor;
}
.th-p-tires .tires-wheel-mark::before{transform:rotate(60deg)}
.th-p-tires .tires-wheel-mark::after{transform:rotate(-60deg)}
.th-p-tires .tires-wheel-mark i{transform:rotate(0deg)}
.th-p-tires .tires-lane-copy{
  display:grid;
  gap:10px;
  min-width:0;
}
.th-p-tires .tires-lane-copy strong{
  font:800 clamp(29px,3.2vw,50px)/.82 var(--display);
  letter-spacing:var(--tracking);
  text-transform:uppercase;
  overflow-wrap:anywhere;
}
.th-p-tires .tires-lane-copy small{
  color:#626766;
  font:700 10px/1.2 var(--body);
  letter-spacing:.18em;
  text-transform:uppercase;
}
.th-p-tires .tires-lane:hover .tires-lane-copy small{color:#B9BEB8}
.th-p-tires .tires-lane-arrow{
  display:grid;
  width:38px;
  height:38px;
  place-items:center;
  border:1px solid currentColor;
  font-size:21px;
}
.th-p-tires .tires-live-products{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:18px;
  max-width:1480px;
  margin:0 auto;
}
.th-p-tires .tires-live-products .product-card{
  border:1px solid #1B1F21;
  border-radius:0;
  box-shadow:none;
}
.th-p-tires .tires-live-products .product-card img{border-radius:0}
.th-p-tires .shop-section{
  background:var(--bg);
  color:var(--ink);
}
.th-p-tires .shop-section .section-heading,
.th-p-tires #shop .section-heading{
  border-top:1px solid var(--line);
}
.th-p-tires .product-card{
  border-radius:0;
}
.th-p-tires .product-card .product-image,
.th-p-tires .product-card img{
  border-radius:0;
}
@media (max-width:900px){
  .th-p-tires .tires-discovery-head{grid-template-columns:1fr auto;gap:18px}
  .th-p-tires .tires-discovery-head .tires-kicker{grid-column:1/-1}
  .th-p-tires .tires-lanes{grid-template-columns:1fr}
  .th-p-tires .tires-lane{min-height:170px}
  .th-p-tires .tires-live-products{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media (max-width:600px){
  .th-p-tires .tires-hero-stage{
    min-height:630px;
    padding:132px 20px 78px;
  }
  .th-p-tires .tires-hero-photo .hero-media{object-position:58% center}
  .th-p-tires .tires-hero-photo::after{
    background:linear-gradient(90deg,#07090bd9 0%,#07090b9e 58%,#07090b46 100%),linear-gradient(0deg,#07090b92 0%,transparent 48%);
  }
  .th-p-tires .tires-copy h1{font-size:clamp(62px,20vw,90px);line-height:.78}
  .th-p-tires .tires-copy h1.long{font-size:clamp(48px,14.2vw,66px)}
  .th-p-tires .tires-copy .sub{margin-top:20px;font-size:14px}
  .th-p-tires .tires-copy .ctas{margin-top:25px;gap:9px}
  .th-p-tires .tires-copy .btn{flex:1 1 150px;min-height:48px;padding:0 13px}
  .th-p-tires .tires-hero-index{top:29px;right:20px;gap:9px;font-size:9px;letter-spacing:.13em}
  .th-p-tires .tires-hero-note{display:none}
  .th-p-tires .tires-hero .motion-toggle{top:74px;right:20px;bottom:auto;min-height:44px}
  .th-p-tires .tires-discovery{padding:44px 20px 56px}
  .th-p-tires .tires-discovery-head{grid-template-columns:1fr;gap:17px;margin-bottom:28px}
  .th-p-tires .tires-discovery-head h2{font-size:clamp(45px,15vw,65px)}
  .th-p-tires .tires-discovery-head div p{margin-top:12px}
  .th-p-tires .tires-all-link{width:max-content;min-height:48px}
  .th-p-tires .tires-lane{
    grid-template-columns:auto 72px minmax(0,1fr) auto;
    gap:12px;
    min-height:142px;
    padding:20px 16px;
  }
  .th-p-tires .tires-wheel-mark{width:62px;border-width:8px}
  .th-p-tires .tires-lane-copy strong{font-size:clamp(28px,10vw,43px)}
  .th-p-tires .tires-lane-arrow{width:34px;height:34px}
  .th-p-tires .tires-live-products{grid-template-columns:1fr;gap:14px}
}
@media (prefers-reduced-motion:reduce){
  .th-p-tires .tires-copy .btn,
  .th-p-tires .tires-all-link,
  .th-p-tires .tires-lane,
  .th-p-tires .tires-lane::before{transition:none}
}
`;

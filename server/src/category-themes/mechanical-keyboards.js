import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-mechanical-keyboards',
  name: 'THE SWITCHBOARD',
  for: 'Mechanical keyboards, keycaps, switches, and desktop build tools',
  vibe: 'An enthusiast workbench: graphite, warm keycap ivory, cobalt edges, and marked-up assembly sheets',
  category: 'Mechanical keyboards and custom desktop builds',
  group: 'technology',
  display: 'Bricolage Grotesque',
  body: 'IBM Plex Mono',
  displayWeight: 700,
  tracking: '-.055em',
  colors: {
    bg: '#EEE9DF',
    surface: '#F8F5EF',
    ink: '#1D1E20',
    muted: '#6F706D',
    line: '#C8C2B6',
    accent: '#D95635',
    onAccent: '#FFF8EF',
    panel: '#283C8F',
    onPanel: '#F7F1E6',
    foot: '#18191B',
    onFoot: '#F2EBDF',
    bar: '#1D1E20',
    onBar: '#F5EFE5',
    badge: '#DCE3FF',
    onBadge: '#1F327B',
  },
  header: 'stack',
  hero: 'spotlight',
  card: 'bold',
  ratio: '4/3',
  rCard: 8,
  rBtn: 2,
  motion: 'pan',
  copy: {
    eyebrow: 'The custom desk edit',
    collection: 'The workbench queue',
    cta: 'Browse the bench',
    title: 'Make every keypress yours.',
    subtitle: 'Thoughtful boards, parts, and desktop tools for a setup with a point of view.',
  },
});

const countLabel = (ctx, value) => {
  const count = Number(value);
  if (!Number.isFinite(count)) return '';
  return `<small>${ctx.esc(count)} ${count === 1 ? 'item' : 'items'}</small>`;
};

const productPrice = (ctx, product) => {
  const cents = Number(product?.price_cents);
  return Number.isFinite(cents) ? `<b>${ctx.money(cents, product.currency || 'usd')}</b>` : '';
};

const heroLane = (ctx, category, index) => `<a class="keys-hero__lane" href="${ctx.categoryLink(category.name)}">
  <span class="keys-hero__lane-num" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
  <span class="keys-hero__lane-name">${ctx.esc(category.name)}</span>
  ${countLabel(ctx, category.count)}
</a>`;

const productSpecimen = (ctx, product, index) => {
  const image = product.image_url
    ? `<img src="${ctx.esc(product.image_url)}" alt="${ctx.esc(product.alt_text || product.title)}" loading="lazy" decoding="async">`
    : '<span class="keys-specimen__empty" aria-hidden="true"><i></i><i></i><i></i></span>';
  const category = product.category ? `<em>${ctx.esc(product.category)}</em>` : '';

  return `<a class="keys-specimen" href="${ctx.productLink(product)}">
    <span class="keys-specimen__index" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
    <span class="keys-specimen__media">${image}</span>
    <span class="keys-specimen__copy"><strong>${ctx.esc(product.title)}</strong>${category}${productPrice(ctx, product)}</span>
    <span class="keys-specimen__go" aria-hidden="true">↗</span>
  </a>`;
};

const categorySpecimen = (ctx, category, index) => {
  const image = category.image
    ? `<img src="${ctx.esc(category.image)}" alt="" loading="lazy" decoding="async">`
    : '<span class="keys-category__empty" aria-hidden="true"><i></i><i></i><i></i></span>';

  return `<a class="keys-category" href="${ctx.categoryLink(category.name)}">
    <span class="keys-category__number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
    <span class="keys-category__media">${image}</span>
    <span class="keys-category__label"><strong>${ctx.esc(category.name)}</strong>${countLabel(ctx, category.count)}</span>
    <span class="keys-category__go" aria-hidden="true">→</span>
  </a>`;
};

export function hero(ctx) {
  const lanes = (ctx.cats || []).filter((category) => category?.name).slice(0, 4);
  const laneMarkup = lanes.map((category, index) => heroLane(ctx, category, index)).join('');

  return `<section class="hero category-hero keys-hero${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="keys-hero__topline" aria-hidden="true">
      <span>01 / DESK STUDY</span><i></i><span>MADE TO BE REWORKED</span>
    </div>
    <div class="keys-hero__intro">
      <div class="keys-hero__heading">${ctx.copy('keys-hero__copy')}</div>
      ${laneMarkup ? `<nav class="keys-hero__lanes" aria-label="Browse keyboard collections">
        <p>Browse the bench</p>${laneMarkup}
      </nav>` : ''}
    </div>
    <div class="keys-hero__bench">
      <span class="keys-hero__corner keys-hero__corner--tl" aria-hidden="true"></span>
      <span class="keys-hero__corner keys-hero__corner--br" aria-hidden="true"></span>
      <div class="keys-hero__photo">${ctx.media(0, { priority: true, lazy: false, decorative: true })}</div>
      <div class="keys-hero__calibration" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
      <p class="keys-hero__caption">A closer kind of desktop.</p>
    </div>
    ${ctx.controls}
  </section>`;
}

export function discovery(ctx) {
  const products = (ctx.products || []).filter((product) => product?.title).slice(0, 3);
  const categories = (ctx.cats || []).filter((category) => category?.name).slice(0, 3);

  if (products.length) {
    return `<section class="theme-discovery keys-discovery" aria-labelledby="keys-discovery-title">
      <div class="keys-discovery__head">
        <div>
          <p class="keys-discovery__eyebrow">${ctx.esc(ctx.t.copy?.collection || 'The workbench queue')}</p>
          <h2 id="keys-discovery-title">Choose the piece that starts the build.</h2>
        </div>
        <a class="keys-discovery__all" href="#shop">See the full selection <span aria-hidden="true">↘</span></a>
      </div>
      <div class="keys-discovery__products">${products.map((product, index) => productSpecimen(ctx, product, index)).join('')}</div>
    </section>`;
  }

  if (categories.length >= 2) {
    return `<section class="theme-discovery keys-discovery keys-discovery--categories" aria-labelledby="keys-discovery-title">
      <div class="keys-discovery__head">
        <div>
          <p class="keys-discovery__eyebrow">${ctx.esc(ctx.t.copy?.collection || 'The workbench queue')}</p>
          <h2 id="keys-discovery-title">Begin with the part that calls to you.</h2>
        </div>
        <a class="keys-discovery__all" href="#shop">See the full selection <span aria-hidden="true">↘</span></a>
      </div>
      <div class="keys-discovery__categories">${categories.map((category, index) => categorySpecimen(ctx, category, index)).join('')}</div>
    </section>`;
  }

  return '';
}

export const css = `
.th-p-mechanical-keyboards{
  background:var(--bg);
  color:var(--ink);
}

.th-p-mechanical-keyboards .hd{
  background:var(--bg);
  border-bottom:1px solid var(--ink);
  box-shadow:none;
}

.th-p-mechanical-keyboards .hd .wrap{
  min-height:74px;
}

.th-p-mechanical-keyboards .hd .brand{
  font-family:var(--body);
  font-size:clamp(14px,1.3vw,18px);
  font-weight:700;
  letter-spacing:.13em;
  text-transform:uppercase;
}

.th-p-mechanical-keyboards .hd .nav{
  gap:clamp(14px,2.2vw,32px);
}

.th-p-mechanical-keyboards .hd .nav a{
  font-family:var(--body);
  font-size:11px;
  letter-spacing:.07em;
  text-transform:uppercase;
}

.th-p-mechanical-keyboards .hd .cart{
  border:1px solid var(--ink);
  border-radius:2px;
}

.th-p-mechanical-keyboards .keys-hero{
  position:relative;
  isolation:isolate;
  overflow:hidden;
  padding:clamp(16px,2.4vw,34px) clamp(16px,4vw,64px) clamp(50px,6.5vw,100px);
  background:
    linear-gradient(90deg,transparent 0 calc(50% - .5px),rgba(29,30,32,.09) calc(50% - .5px) calc(50% + .5px),transparent calc(50% + .5px)),
    var(--bg);
}

.th-p-mechanical-keyboards .keys-hero::before{
  position:absolute;
  inset:0;
  z-index:-1;
  background:repeating-linear-gradient(90deg,transparent 0 calc(8.333% - 1px),rgba(29,30,32,.045) calc(8.333% - 1px) 8.333%);
  content:'';
  pointer-events:none;
}

.th-p-mechanical-keyboards .keys-hero__topline{
  display:flex;
  align-items:center;
  gap:12px;
  width:min(100%,1420px);
  margin:0 auto clamp(26px,3.6vw,54px);
  color:var(--muted);
  font:600 10px/1.2 var(--body);
  letter-spacing:.15em;
  text-transform:uppercase;
}

.th-p-mechanical-keyboards .keys-hero__topline i{
  display:block;
  flex:1;
  height:1px;
  background:var(--line);
}

.th-p-mechanical-keyboards .keys-hero__intro{
  display:grid;
  grid-template-columns:minmax(0,1fr) minmax(208px,290px);
  gap:clamp(28px,6vw,116px);
  align-items:end;
  width:min(100%,1200px);
  margin:0 auto clamp(30px,4.8vw,72px);
}

.th-p-mechanical-keyboards .keys-hero__heading{
  min-width:0;
}

.th-p-mechanical-keyboards .keys-hero__copy .txt{
  display:grid;
  justify-items:start;
  max-width:770px;
}

.th-p-mechanical-keyboards .keys-hero__copy .eyebrow{
  margin:0 0 14px;
  color:var(--accent);
  font:700 10px/1.2 var(--body);
  letter-spacing:.2em;
  text-transform:uppercase;
}

.th-p-mechanical-keyboards .keys-hero__copy h1{
  max-width:11ch;
  margin:0;
  color:var(--ink);
  font-family:var(--display);
  font-size:clamp(56px,7.1vw,114px);
  font-weight:var(--dw);
  letter-spacing:var(--dt);
  line-height:.86;
  text-wrap:balance;
}

.th-p-mechanical-keyboards .keys-hero__copy h1.long{
  max-width:15ch;
  font-size:clamp(42px,5.35vw,82px);
  line-height:.94;
}

.th-p-mechanical-keyboards .keys-hero__copy .sub{
  max-width:47ch;
  margin:23px 0 0;
  color:var(--muted);
  font-size:clamp(14px,1.15vw,17px);
  line-height:1.55;
}

.th-p-mechanical-keyboards .keys-hero__copy .ctas{
  display:flex;
  flex-wrap:wrap;
  gap:10px;
  margin-top:25px;
}

.th-p-mechanical-keyboards .keys-hero__copy .btn{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  min-height:46px;
  padding:12px 18px;
  border:1px solid var(--ink);
  border-radius:2px;
  background:var(--ink);
  color:var(--bg);
  font:700 11px/1 var(--body);
  letter-spacing:.075em;
  text-transform:uppercase;
}

.th-p-mechanical-keyboards .keys-hero__copy .btn.ghost{
  background:transparent;
  color:var(--ink);
}

.th-p-mechanical-keyboards .keys-hero__lanes{
  display:grid;
  gap:0;
  min-width:0;
  border-top:1px solid var(--ink);
}

.th-p-mechanical-keyboards .keys-hero__lanes p{
  margin:0;
  padding:0 0 12px;
  color:var(--muted);
  font:600 10px/1.2 var(--body);
  letter-spacing:.15em;
  text-transform:uppercase;
}

.th-p-mechanical-keyboards .keys-hero__lane{
  display:grid;
  grid-template-columns:28px minmax(0,1fr) auto;
  gap:10px;
  align-items:baseline;
  min-height:45px;
  padding:12px 0 9px;
  color:var(--ink);
  text-decoration:none;
  border-top:1px solid var(--line);
}

.th-p-mechanical-keyboards .keys-hero__lane-num{
  color:var(--accent);
  font:700 10px/1 var(--body);
  letter-spacing:.08em;
}

.th-p-mechanical-keyboards .keys-hero__lane-name{
  min-width:0;
  overflow-wrap:anywhere;
  font:700 13px/1.18 var(--body);
}

.th-p-mechanical-keyboards .keys-hero__lane small{
  color:var(--muted);
  font:600 10px/1.1 var(--body);
  white-space:nowrap;
}

.th-p-mechanical-keyboards .keys-hero__bench{
  position:relative;
  width:min(100%,1420px);
  min-height:300px;
  margin:0 auto;
  padding:clamp(12px,1.8vw,24px) clamp(12px,1.8vw,24px) clamp(35px,4.4vw,66px);
  overflow:hidden;
  background:var(--panel);
  clip-path:polygon(0 0,97.5% 0,100% 8%,100% 100%,2.5% 100%,0 92%);
}

.th-p-mechanical-keyboards .keys-hero__photo{
  position:relative;
  height:clamp(280px,39vw,560px);
  overflow:hidden;
  background:linear-gradient(145deg,#182348,#314AA4);
  border:1px solid rgba(247,241,230,.64);
}

.th-p-mechanical-keyboards .keys-hero__photo::after{
  position:absolute;
  inset:0;
  background:linear-gradient(180deg,rgba(18,20,25,.22),transparent 30%,transparent 66%,rgba(18,20,25,.54));
  content:'';
  pointer-events:none;
}

.th-p-mechanical-keyboards .keys-hero__photo .hero-media,
.th-p-mechanical-keyboards .keys-hero__photo .theme-empty-media{
  display:block;
  width:100%;
  height:100%;
  min-height:0;
  max-width:none;
  object-fit:cover;
  object-position:center;
}

.th-p-mechanical-keyboards .keys-hero__photo .theme-empty-media{
  background:
    radial-gradient(circle at 72% 38%,rgba(217,86,53,.9) 0 2%,transparent 2.4%),
    linear-gradient(135deg,rgba(255,255,255,.1) 0 1px,transparent 1px 31px),
    linear-gradient(45deg,rgba(255,255,255,.08) 0 1px,transparent 1px 31px),
    #1F2F70;
  color:var(--onPanel);
}

.th-p-mechanical-keyboards .keys-hero__corner{
  position:absolute;
  z-index:2;
  width:22px;
  height:22px;
  border-color:var(--onPanel);
  border-style:solid;
  opacity:.9;
  pointer-events:none;
}

.th-p-mechanical-keyboards .keys-hero__corner--tl{
  top:clamp(21px,2.8vw,38px);
  left:clamp(21px,2.8vw,38px);
  border-width:1px 0 0 1px;
}

.th-p-mechanical-keyboards .keys-hero__corner--br{
  right:clamp(21px,2.8vw,38px);
  bottom:clamp(54px,6.2vw,91px);
  border-width:0 1px 1px 0;
}

.th-p-mechanical-keyboards .keys-hero__calibration{
  position:absolute;
  z-index:2;
  right:clamp(28px,4vw,62px);
  bottom:clamp(17px,2vw,28px);
  display:flex;
  align-items:end;
  gap:4px;
  height:20px;
  pointer-events:none;
}

.th-p-mechanical-keyboards .keys-hero__calibration i{
  display:block;
  width:1px;
  height:8px;
  background:var(--onPanel);
}

.th-p-mechanical-keyboards .keys-hero__calibration i:nth-child(3n){
  height:17px;
}

.th-p-mechanical-keyboards .keys-hero__caption{
  position:absolute;
  left:clamp(28px,4vw,62px);
  bottom:clamp(14px,1.7vw,25px);
  z-index:2;
  margin:0;
  color:var(--onPanel);
  font:600 10px/1.2 var(--body);
  letter-spacing:.15em;
  text-transform:uppercase;
}

.th-p-mechanical-keyboards .keys-hero .motion-toggle{
  position:absolute;
  z-index:4;
  right:clamp(26px,5vw,74px);
  bottom:clamp(66px,8.7vw,126px);
  min-height:44px;
  border:1px solid var(--onPanel);
  border-radius:2px;
  background:rgba(29,30,32,.78);
  color:var(--onPanel);
  font:600 10px/1 var(--body);
  letter-spacing:.08em;
  text-transform:uppercase;
}

.th-p-mechanical-keyboards .keys-hero.has-hero-motion .keys-hero__photo .hero-media{
  animation:mechanical-keyboards-pan 18s ease-in-out infinite alternate;
}

.th-p-mechanical-keyboards .keys-hero.is-motion-paused .keys-hero__photo .hero-media{
  animation-play-state:paused;
}

@keyframes mechanical-keyboards-pan{
  0%{transform:scale(1.02) translate3d(-.65%,.2%,0)}
  100%{transform:scale(1.08) translate3d(1.15%,-.55%,0)}
}

.th-p-mechanical-keyboards .perks{
  background:#D7D2C8;
  border-block:1px solid var(--line);
}

.th-p-mechanical-keyboards .perks .wrap{
  gap:0;
}

.th-p-mechanical-keyboards .perks .perk{
  padding:19px clamp(12px,2.1vw,28px);
  border-inline-start:1px solid var(--line);
  color:var(--ink);
}

.th-p-mechanical-keyboards .perks .perk:first-child{
  border-inline-start:0;
}

.th-p-mechanical-keyboards .perks .perk svg{
  color:var(--accent);
}

.th-p-mechanical-keyboards .perks .perk b{
  font:700 12px/1.25 var(--body);
  letter-spacing:.04em;
  text-transform:uppercase;
}

.th-p-mechanical-keyboards .keys-discovery{
  position:relative;
  overflow:hidden;
  padding:clamp(62px,8vw,120px) clamp(16px,4vw,64px) clamp(56px,7.3vw,110px);
  background:var(--surface);
}

.th-p-mechanical-keyboards .keys-discovery::before{
  position:absolute;
  top:0;
  right:clamp(16px,4vw,64px);
  left:clamp(16px,4vw,64px);
  height:14px;
  background:repeating-linear-gradient(90deg,var(--ink) 0 1px,transparent 1px 11.111%);
  content:'';
  opacity:.25;
}

.th-p-mechanical-keyboards .keys-discovery__head{
  display:flex;
  align-items:end;
  justify-content:space-between;
  gap:24px;
  width:min(100%,1420px);
  margin:0 auto clamp(29px,4.4vw,66px);
  padding-bottom:clamp(22px,3vw,38px);
  border-bottom:1px solid var(--ink);
}

.th-p-mechanical-keyboards .keys-discovery__eyebrow{
  margin:0 0 12px;
  color:var(--accent);
  font:700 10px/1.2 var(--body);
  letter-spacing:.2em;
  text-transform:uppercase;
}

.th-p-mechanical-keyboards .keys-discovery h2{
  max-width:12ch;
  margin:0;
  color:var(--ink);
  font-family:var(--display);
  font-size:clamp(40px,4.8vw,72px);
  font-weight:var(--dw);
  letter-spacing:var(--dt);
  line-height:.92;
  text-wrap:balance;
}

.th-p-mechanical-keyboards .keys-discovery__all{
  display:inline-flex;
  flex:none;
  align-items:center;
  gap:12px;
  min-height:44px;
  color:var(--ink);
  font:700 11px/1.2 var(--body);
  letter-spacing:.075em;
  text-align:right;
  text-decoration:none;
  text-transform:uppercase;
}

.th-p-mechanical-keyboards .keys-discovery__all span{
  color:var(--accent);
  font-size:20px;
}

.th-p-mechanical-keyboards .keys-discovery__products{
  display:grid;
  grid-template-columns:repeat(12,minmax(0,1fr));
  gap:clamp(16px,2vw,30px);
  width:min(100%,1420px);
  margin:0 auto;
}

.th-p-mechanical-keyboards .keys-specimen{
  position:relative;
  display:grid;
  min-width:0;
  overflow:hidden;
  color:var(--ink);
  text-decoration:none;
  background:var(--bg);
  border:1px solid var(--line);
}

.th-p-mechanical-keyboards .keys-specimen:nth-child(1){
  grid-column:span 5;
  margin-top:clamp(0px,4vw,62px);
}

.th-p-mechanical-keyboards .keys-specimen:nth-child(2){
  grid-column:span 4;
}

.th-p-mechanical-keyboards .keys-specimen:nth-child(3){
  grid-column:span 3;
  margin-top:clamp(34px,8vw,124px);
}

.th-p-mechanical-keyboards .keys-specimen__index{
  position:absolute;
  top:14px;
  left:15px;
  z-index:2;
  display:grid;
  width:30px;
  height:30px;
  place-items:center;
  background:var(--accent);
  color:var(--onAccent);
  font:700 10px/1 var(--body);
  letter-spacing:.08em;
}

.th-p-mechanical-keyboards .keys-specimen__media{
  position:relative;
  display:block;
  overflow:hidden;
  background:#D8D4CE;
  aspect-ratio:1/1;
}

.th-p-mechanical-keyboards .keys-specimen:nth-child(1) .keys-specimen__media{
  aspect-ratio:1.25/1;
}

.th-p-mechanical-keyboards .keys-specimen__media img{
  display:block;
  width:100%;
  height:100%;
  object-fit:cover;
}

.th-p-mechanical-keyboards .keys-specimen__empty{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:8px;
  width:100%;
  height:100%;
  background:linear-gradient(135deg,#D7D4CC,#AEB9DE);
}

.th-p-mechanical-keyboards .keys-specimen__empty i{
  display:block;
  width:20%;
  aspect-ratio:1;
  border:1px solid var(--panel);
  background:rgba(248,245,239,.45);
  transform:rotate(45deg);
}

.th-p-mechanical-keyboards .keys-specimen__empty i:nth-child(2){
  background:var(--accent);
  border-color:var(--accent);
}

.th-p-mechanical-keyboards .keys-specimen__copy{
  display:grid;
  gap:5px;
  min-width:0;
  padding:16px 16px 18px;
  border-top:1px solid var(--line);
}

.th-p-mechanical-keyboards .keys-specimen__copy strong{
  overflow-wrap:anywhere;
  font:700 clamp(18px,1.7vw,26px)/1.02 var(--display);
  letter-spacing:-.045em;
}

.th-p-mechanical-keyboards .keys-specimen__copy em{
  color:var(--muted);
  font:600 10px/1.25 var(--body);
  font-style:normal;
  letter-spacing:.11em;
  text-transform:uppercase;
}

.th-p-mechanical-keyboards .keys-specimen__copy b{
  margin-top:4px;
  color:var(--accent);
  font:700 13px/1.2 var(--body);
}

.th-p-mechanical-keyboards .keys-specimen__go{
  position:absolute;
  right:13px;
  bottom:14px;
  color:var(--panel);
  font-size:20px;
}

.th-p-mechanical-keyboards .keys-discovery__categories{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:1px;
  width:min(100%,1420px);
  margin:0 auto;
  background:var(--line);
  border:1px solid var(--line);
}

.th-p-mechanical-keyboards .keys-category{
  position:relative;
  display:grid;
  grid-template-rows:minmax(180px,1fr) auto;
  min-height:355px;
  overflow:hidden;
  background:var(--bg);
  color:var(--ink);
  text-decoration:none;
}

.th-p-mechanical-keyboards .keys-category__number{
  position:absolute;
  z-index:2;
  top:16px;
  left:16px;
  color:var(--onPanel);
  font:700 10px/1 var(--body);
  letter-spacing:.14em;
}

.th-p-mechanical-keyboards .keys-category__media{
  position:relative;
  display:block;
  overflow:hidden;
  background:var(--panel);
}

.th-p-mechanical-keyboards .keys-category__media::after{
  position:absolute;
  inset:0;
  background:linear-gradient(0deg,rgba(23,25,31,.34),transparent 48%);
  content:'';
}

.th-p-mechanical-keyboards .keys-category__media img{
  display:block;
  width:100%;
  height:100%;
  object-fit:cover;
}

.th-p-mechanical-keyboards .keys-category__empty{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:10px;
  width:100%;
  height:100%;
  background:linear-gradient(135deg,#23356D,#4059B2);
}

.th-p-mechanical-keyboards .keys-category__empty i{
  display:block;
  width:28px;
  height:28px;
  border:1px solid var(--onPanel);
  transform:rotate(45deg);
}

.th-p-mechanical-keyboards .keys-category__empty i:nth-child(2){
  background:var(--accent);
  border-color:var(--accent);
}

.th-p-mechanical-keyboards .keys-category__label{
  display:grid;
  gap:6px;
  min-height:95px;
  padding:18px 58px 18px 18px;
}

.th-p-mechanical-keyboards .keys-category__label strong{
  overflow-wrap:anywhere;
  font:700 clamp(22px,2.2vw,34px)/.98 var(--display);
  letter-spacing:-.045em;
}

.th-p-mechanical-keyboards .keys-category__label small{
  color:var(--muted);
  font:600 10px/1.2 var(--body);
  letter-spacing:.1em;
  text-transform:uppercase;
}

.th-p-mechanical-keyboards .keys-category__go{
  position:absolute;
  right:18px;
  bottom:22px;
  display:grid;
  width:31px;
  height:31px;
  place-items:center;
  border:1px solid var(--ink);
  color:var(--ink);
}

.th-p-mechanical-keyboards #shop{
  padding-block:clamp(56px,7vw,104px);
  background:var(--bg);
  border-top:1px solid var(--ink);
}

.th-p-mechanical-keyboards #shop .sec-h{
  align-items:end;
  margin-bottom:clamp(23px,3.5vw,48px);
}

.th-p-mechanical-keyboards #shop .sec-h h2{
  max-width:13ch;
  font-family:var(--display);
  font-size:clamp(38px,4.5vw,66px);
  font-weight:var(--dw);
  letter-spacing:var(--dt);
  line-height:.92;
}

.th-p-mechanical-keyboards #shop .chips{
  gap:7px;
}

.th-p-mechanical-keyboards #shop .chip{
  min-height:44px;
  border:1px solid var(--ink);
  border-radius:2px;
  background:transparent;
  color:var(--ink);
  font:700 10px/1.1 var(--body);
  letter-spacing:.075em;
  text-transform:uppercase;
}

.th-p-mechanical-keyboards #shop .chip.on,
.th-p-mechanical-keyboards #shop .chip:hover{
  background:var(--panel);
  border-color:var(--panel);
  color:var(--onPanel);
}

.th-p-mechanical-keyboards #shop .grid{
  gap:clamp(26px,3.5vw,56px) clamp(14px,2vw,28px);
}

.th-p-mechanical-keyboards #shop .pc{
  gap:11px;
  min-width:0;
  padding:0;
  background:transparent;
  box-shadow:none;
}

.th-p-mechanical-keyboards #shop .pc .im{
  overflow:hidden;
  background:#D9D4CB;
  border:1px solid var(--line);
  border-radius:0;
}

.th-p-mechanical-keyboards #shop .pc .im img{
  display:block;
}

.th-p-mechanical-keyboards #shop .pc .bd{
  display:grid;
  grid-template-columns:minmax(0,1fr) auto;
  gap:6px 14px;
  padding:0 2px;
}

.th-p-mechanical-keyboards #shop .pc h3{
  font:700 16px/1.2 var(--body);
  letter-spacing:-.025em;
}

.th-p-mechanical-keyboards #shop .pc .pr{
  grid-column:2;
  grid-row:1;
  color:var(--accent);
  font:700 13px/1.2 var(--body);
  white-space:nowrap;
}

.th-p-mechanical-keyboards #shop .pc .ct{
  grid-column:1 / -1;
  color:var(--muted);
  font:600 10px/1.2 var(--body);
  letter-spacing:.09em;
  text-transform:uppercase;
}

.th-p-mechanical-keyboards #shop .pc .tag{
  top:11px;
  left:11px;
  border-radius:0;
  background:var(--accent);
  color:var(--onAccent);
  font:700 9px/1 var(--body);
  letter-spacing:.08em;
  text-transform:uppercase;
}

.th-p-mechanical-keyboards #shop .pc .go{
  right:10px;
  bottom:10px;
  border-radius:0;
  background:var(--panel);
  color:var(--onPanel);
}

.th-p-mechanical-keyboards .feat{
  background:#D6D1C7;
}

.th-p-mechanical-keyboards .feat .pic{
  position:relative;
  overflow:hidden;
  border:1px solid var(--line);
}

.th-p-mechanical-keyboards .feat .txt h2,
.th-p-mechanical-keyboards .story .txt h2{
  font-family:var(--display);
  font-weight:var(--dw);
  letter-spacing:var(--dt);
}

.th-p-mechanical-keyboards .ft{
  background:var(--foot);
  color:var(--onFoot);
}

.th-p-mechanical-keyboards .ft a{
  color:var(--onFoot);
}

@media (max-width:820px){
  .th-p-mechanical-keyboards .keys-hero{
    padding-inline:20px;
  }

  .th-p-mechanical-keyboards .keys-hero__intro{
    gap:32px;
  }

  .th-p-mechanical-keyboards .keys-hero__copy h1{
    font-size:clamp(52px,7.5vw,78px);
  }

  .th-p-mechanical-keyboards .keys-hero__bench{
    margin-inline:-4px;
  }

  .th-p-mechanical-keyboards .keys-specimen:nth-child(1){
    grid-column:span 6;
    margin-top:0;
  }

  .th-p-mechanical-keyboards .keys-specimen:nth-child(2){
    grid-column:span 6;
  }

  .th-p-mechanical-keyboards .keys-specimen:nth-child(3){
    grid-column:3 / span 8;
    margin-top:0;
  }
}

@media (max-width:620px){
  .th-p-mechanical-keyboards .hd .wrap{
    min-height:64px;
  }

  .th-p-mechanical-keyboards .hd .brand{
    font-size:13px;
    letter-spacing:.085em;
  }

  .th-p-mechanical-keyboards .keys-hero{
    padding:15px 16px 54px;
  }

  .th-p-mechanical-keyboards .keys-hero__topline{
    margin-bottom:31px;
    font-size:9px;
    letter-spacing:.09em;
  }

  .th-p-mechanical-keyboards .keys-hero__topline span:last-child{
    display:none;
  }

  .th-p-mechanical-keyboards .keys-hero__intro{
    grid-template-columns:1fr;
    gap:28px;
    margin-bottom:32px;
  }

  .th-p-mechanical-keyboards .keys-hero__copy h1{
    max-width:10.5ch;
    font-size:clamp(50px,13.3vw,65px);
  }

  .th-p-mechanical-keyboards .keys-hero__copy h1.long{
    font-size:clamp(39px,10vw,49px);
  }

  .th-p-mechanical-keyboards .keys-hero__copy .sub{
    margin-top:18px;
    font-size:14px;
  }

  .th-p-mechanical-keyboards .keys-hero__copy .ctas{
    width:100%;
    margin-top:21px;
  }

  .th-p-mechanical-keyboards .keys-hero__copy .btn{
    flex:1 1 168px;
  }

  .th-p-mechanical-keyboards .keys-hero__lanes{
    grid-template-columns:repeat(2,minmax(0,1fr));
    border-left:1px solid var(--line);
  }

  .th-p-mechanical-keyboards .keys-hero__lanes p{
    grid-column:1 / -1;
    padding-left:10px;
  }

  .th-p-mechanical-keyboards .keys-hero__lane{
    grid-template-columns:24px minmax(0,1fr);
    min-height:54px;
    padding:12px 9px 9px;
    border-right:1px solid var(--line);
  }

  .th-p-mechanical-keyboards .keys-hero__lane small{
    display:none;
  }

  .th-p-mechanical-keyboards .keys-hero__bench{
    min-height:0;
    margin-inline:0;
    padding:10px 10px 48px;
    clip-path:polygon(0 0,94% 0,100% 7%,100% 100%,6% 100%,0 92%);
  }

  .th-p-mechanical-keyboards .keys-hero__photo{
    height:auto;
    aspect-ratio:4/3;
  }

  .th-p-mechanical-keyboards .keys-hero__photo .hero-media{
    object-position:57% center;
  }

  .th-p-mechanical-keyboards .keys-hero__corner--tl{
    top:19px;
    left:19px;
  }

  .th-p-mechanical-keyboards .keys-hero__corner--br{
    right:19px;
    bottom:65px;
  }

  .th-p-mechanical-keyboards .keys-hero__caption{
    bottom:17px;
    left:24px;
    font-size:9px;
  }

  .th-p-mechanical-keyboards .keys-hero__calibration{
    right:24px;
    bottom:18px;
  }

  .th-p-mechanical-keyboards .keys-hero .motion-toggle{
    right:24px;
    bottom:83px;
  }

  .th-p-mechanical-keyboards .perks .wrap{
    display:block;
  }

  .th-p-mechanical-keyboards .perks .perk{
    border-top:1px solid var(--line);
    border-inline-start:0;
    padding:16px 0;
  }

  .th-p-mechanical-keyboards .perks .perk:first-child{
    border-top:0;
  }

  .th-p-mechanical-keyboards .keys-discovery{
    padding:63px 16px 60px;
  }

  .th-p-mechanical-keyboards .keys-discovery::before{
    right:16px;
    left:16px;
  }

  .th-p-mechanical-keyboards .keys-discovery__head{
    align-items:flex-start;
    flex-direction:column;
    gap:19px;
    margin-bottom:32px;
    padding-bottom:24px;
  }

  .th-p-mechanical-keyboards .keys-discovery h2{
    font-size:clamp(39px,11vw,54px);
  }

  .th-p-mechanical-keyboards .keys-discovery__all{
    text-align:left;
  }

  .th-p-mechanical-keyboards .keys-discovery__products{
    grid-template-columns:1fr;
    gap:16px;
  }

  .th-p-mechanical-keyboards .keys-specimen:nth-child(1),
  .th-p-mechanical-keyboards .keys-specimen:nth-child(2),
  .th-p-mechanical-keyboards .keys-specimen:nth-child(3){
    grid-column:auto;
    margin-top:0;
  }

  .th-p-mechanical-keyboards .keys-specimen{
    grid-template-columns:minmax(122px,39%) minmax(0,1fr);
    min-height:146px;
  }

  .th-p-mechanical-keyboards .keys-specimen__media,
  .th-p-mechanical-keyboards .keys-specimen:nth-child(1) .keys-specimen__media{
    grid-row:1;
    aspect-ratio:auto;
  }

  .th-p-mechanical-keyboards .keys-specimen__copy{
    align-content:center;
    padding:18px 47px 18px 15px;
    border-top:0;
    border-left:1px solid var(--line);
  }

  .th-p-mechanical-keyboards .keys-specimen__go{
    right:14px;
    bottom:14px;
  }

  .th-p-mechanical-keyboards .keys-discovery__categories{
    grid-template-columns:1fr;
  }

  .th-p-mechanical-keyboards .keys-category{
    grid-template-columns:minmax(126px,42%) minmax(0,1fr);
    grid-template-rows:1fr;
    min-height:182px;
  }

  .th-p-mechanical-keyboards .keys-category__media{
    grid-column:1;
  }

  .th-p-mechanical-keyboards .keys-category__label{
    align-content:end;
    min-height:0;
    padding:18px 52px 18px 17px;
  }

  .th-p-mechanical-keyboards .keys-category__number{
    top:13px;
    left:13px;
  }

  .th-p-mechanical-keyboards .keys-category__go{
    right:15px;
    bottom:17px;
  }

  .th-p-mechanical-keyboards #shop .sec-h{
    align-items:flex-start;
    flex-direction:column;
    gap:19px;
  }

  .th-p-mechanical-keyboards #shop .sec-h h2{
    font-size:43px;
  }

  .th-p-mechanical-keyboards #shop .chips{
    width:100%;
    overflow-x:auto;
    flex-wrap:nowrap;
    padding-bottom:3px;
  }

  .th-p-mechanical-keyboards #shop .chip{
    flex:none;
  }
}

@media (max-width:390px){
  .th-p-mechanical-keyboards .keys-hero__lanes{
    grid-template-columns:1fr;
  }

  .th-p-mechanical-keyboards .keys-hero__lane{
    grid-template-columns:25px minmax(0,1fr) auto;
  }

  .th-p-mechanical-keyboards .keys-hero__lane small{
    display:block;
  }

  .th-p-mechanical-keyboards .keys-hero__copy .btn{
    flex-basis:100%;
    width:100%;
  }
}

@media (prefers-reduced-motion:reduce){
  .th-p-mechanical-keyboards .keys-hero.has-hero-motion .keys-hero__photo .hero-media{
    animation:none;
    transform:scale(1.001);
  }
}
`;

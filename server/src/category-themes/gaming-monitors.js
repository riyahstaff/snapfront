import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-gaming-monitors',
  name: 'PHASE / ARRAY',
  for: 'Gaming monitors and display-focused setups',
  vibe: 'Nocturnal signal lab: spectral light, curved apertures, and disciplined display energy',
  category: 'Gaming monitors',
  group: 'technology',
  display: 'Space Grotesk',
  body: 'DM Sans',
  displayWeight: 700,
  tracking: '-.065em',
  colors: {
    bg: '#080914',
    surface: '#111326',
    ink: '#F2F5FF',
    muted: '#ABB3CA',
    line: '#2A2E4A',
    accent: '#62E9FF',
    onAccent: '#071018',
    panel: '#1A1530',
    onPanel: '#F7F2FF',
    foot: '#05060C',
    onFoot: '#BAC2D9',
    bar: '#101223',
    onBar: '#F2F5FF',
    badge: '#EE65CF',
    onBadge: '#1A0615',
  },
  header: 'stack',
  hero: 'spotlight',
  card: 'glass',
  ratio: '16/10',
  rCard: 12,
  rBtn: 999,
  motion: 'pan',
  copy: {
    eyebrow: 'The display field',
    collection: 'Signal studies',
    cta: 'Enter the array',
    title: 'See the signal before it moves.',
    subtitle: 'A focused edit of gaming monitors for the frame in front of you.',
  },
});

const cleanCategories = (ctx) => (ctx.cats || []).filter((category) => category?.name);

const countLabel = (ctx, count) => {
  const value = Number(count);
  if (!Number.isFinite(value)) return '';
  return `<small>${ctx.esc(value)} ${value === 1 ? 'display' : 'displays'}</small>`;
};

const productPrice = (ctx, product) => {
  const prices = [product.price_cents, ...(product.variants || []).map((variant) => variant.price_cents ?? product.price_cents)]
    .filter((value) => Number.isFinite(Number(value)))
    .map(Number);
  return prices.length ? ctx.money(Math.min(...prices), product.currency) : '';
};

const channelLink = (ctx, category, index) => `<a class="phase-hero__channel" href="${ctx.esc(ctx.categoryLink(category.name))}">
  <span class="phase-hero__channel-index" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
  <span class="phase-hero__channel-name">${ctx.esc(category.name)}</span>
  ${countLabel(ctx, category.count)}
  <span class="phase-hero__channel-arrow" aria-hidden="true">↗</span>
</a>`;

const categoryCard = (ctx, category, index) => {
  const image = category.image
    ? `<img src="${ctx.esc(category.image)}" alt="" loading="lazy" decoding="async">`
    : '<span class="phase-discovery__empty-image" aria-hidden="true"></span>';

  return `<a class="phase-discovery__card" href="${ctx.esc(ctx.categoryLink(category.name))}">
    <span class="phase-discovery__card-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
    <span class="phase-discovery__image">${image}</span>
    <span class="phase-discovery__label"><b>${ctx.esc(category.name)}</b>${countLabel(ctx, category.count)}<i aria-hidden="true">↗</i></span>
  </a>`;
};

const productLine = (ctx, product, index) => {
  const title = product.title || product.name || 'Available display';
  const price = productPrice(ctx, product);
  return `<a class="phase-discovery__product" href="${ctx.esc(ctx.productLink(product))}">
    <span class="phase-discovery__product-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
    <b>${ctx.esc(title)}</b>
    ${price ? `<small>${ctx.esc(price)}</small>` : ''}
    <i aria-hidden="true">↗</i>
  </a>`;
};

export function hero(ctx) {
  const categories = cleanCategories(ctx);
  const channels = categories.length
    ? `<nav class="phase-hero__channels" aria-label="Browse monitor collections">
      <p class="phase-hero__channels-label">Signal channels</p>
      <div>${categories.slice(0, 4).map((category, index) => channelLink(ctx, category, index)).join('')}</div>
    </nav>`
    : '';

  return `<section class="hero category-hero phase-hero${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="phase-hero__shell${channels ? ' has-channels' : ''}">
      <div class="phase-hero__ruler" aria-hidden="true"><span>R</span><span>G</span><span>B</span><i></i></div>
      <div class="phase-hero__caption" aria-hidden="true"><span>DISPLAY / ARRAY</span><span>FIELD NOTE 01</span></div>
      <div class="phase-hero__view">
        <div class="phase-hero__image">
          ${ctx.media(0, { priority: true, lazy: false, decorative: true })}
          <span class="phase-hero__scan phase-hero__scan--one" aria-hidden="true"></span>
          <span class="phase-hero__scan phase-hero__scan--two" aria-hidden="true"></span>
          <span class="phase-hero__grain" aria-hidden="true"></span>
        </div>
        <div class="phase-hero__copy-frame">${ctx.copy('phase-hero__copy')}</div>
        ${channels}
      </div>
      <p class="phase-hero__axis" aria-hidden="true"><span></span><b>0°</b><span></span><b>180°</b><span></span></p>
    </div>
    ${ctx.controls}
  </section>`;
}

export function discovery(ctx) {
  const categories = cleanCategories(ctx);
  const products = ctx.products || [];

  if (categories.length >= 2) {
    return `<section class="theme-discovery phase-discovery" aria-labelledby="phase-discovery-title">
      <div class="phase-discovery__head">
        <p class="phase-discovery__eyebrow">Refresh sequence</p>
        <div><h2 id="phase-discovery-title">Find the view that pulls you in.</h2><p>Browse the live collections your store has in the field.</p></div>
        <a class="phase-discovery__all" href="#shop">All displays <span aria-hidden="true">↓</span></a>
      </div>
      <div class="phase-discovery__cards">${categories.slice(0, 4).map((category, index) => categoryCard(ctx, category, index)).join('')}</div>
    </section>`;
  }

  if (!products.length) return '';

  return `<section class="theme-discovery phase-discovery phase-discovery--products" aria-labelledby="phase-discovery-title">
    <div class="phase-discovery__head">
      <p class="phase-discovery__eyebrow">Live signal</p>
      <div><h2 id="phase-discovery-title">Displays ready to enter the frame.</h2><p>Explore the current product edit.</p></div>
      <a class="phase-discovery__all" href="#shop">All displays <span aria-hidden="true">↓</span></a>
    </div>
    <div class="phase-discovery__products">${products.slice(0, 4).map((product, index) => productLine(ctx, product, index)).join('')}</div>
  </section>`;
}

export const css = `
.th-p-gaming-monitors{
  background:var(--bg);
  color:var(--ink);
}

.th-p-gaming-monitors .hd{
  background:rgba(8,9,20,.93);
  border-bottom:1px solid var(--line);
  box-shadow:none;
  backdrop-filter:blur(16px);
}

.th-p-gaming-monitors .hd .wrap{
  max-width:1540px;
}

.th-p-gaming-monitors .brand{
  font-family:var(--display);
  font-size:clamp(14px,1.15vw,18px);
  font-weight:700;
  letter-spacing:.12em;
}

.th-p-gaming-monitors .nav{
  gap:clamp(14px,2.1vw,30px);
}

.th-p-gaming-monitors .nav a{
  color:var(--muted);
  font-size:11px;
  font-weight:700;
  letter-spacing:.1em;
  text-transform:uppercase;
}

.th-p-gaming-monitors .nav a:hover{
  color:var(--accent);
}

.th-p-gaming-monitors .cart{
  border-color:#42486A;
  border-radius:999px;
}

.th-p-gaming-monitors .phase-hero{
  position:relative;
  overflow:hidden;
  isolation:isolate;
  padding:clamp(18px,2.5vw,42px) clamp(14px,3vw,48px) clamp(36px,4vw,64px);
  background:
    radial-gradient(circle at 64% 42%,rgba(96,51,171,.26),transparent 33%),
    linear-gradient(132deg,#070812 0%,#0C0B1D 54%,#070915 100%);
}

.th-p-gaming-monitors .phase-hero::before{
  position:absolute;
  z-index:-1;
  inset:0;
  background:repeating-linear-gradient(90deg,transparent 0 calc(8.333% - 1px),rgba(155,162,221,.055) calc(8.333% - 1px) 8.333%);
  content:"";
  pointer-events:none;
}

.th-p-gaming-monitors .phase-hero__shell{
  position:relative;
  width:min(100%,1530px);
  min-height:clamp(610px,51vw,780px);
  margin-inline:auto;
}

.th-p-gaming-monitors .phase-hero__caption{
  position:absolute;
  z-index:3;
  top:0;
  left:clamp(28px,4.6vw,76px);
  right:clamp(28px,4.6vw,76px);
  display:flex;
  justify-content:space-between;
  gap:16px;
  padding-bottom:12px;
  border-bottom:1px solid rgba(218,224,255,.23);
  color:#C0C8E6;
  font:700 10px/1.2 var(--body);
  letter-spacing:.16em;
  text-transform:uppercase;
}

.th-p-gaming-monitors .phase-hero__ruler{
  position:absolute;
  z-index:3;
  top:clamp(64px,6.2vw,95px);
  left:0;
  display:grid;
  gap:10px;
  align-content:start;
  width:30px;
  color:#8690B5;
  font:700 9px/1 var(--body);
  letter-spacing:.12em;
  text-align:center;
}

.th-p-gaming-monitors .phase-hero__ruler i{
  display:block;
  width:1px;
  height:clamp(350px,35vw,530px);
  margin:5px auto 0;
  background:linear-gradient(var(--accent),rgba(98,233,255,.08));
}

.th-p-gaming-monitors .phase-hero__view{
  position:absolute;
  inset:clamp(48px,5.3vw,82px) clamp(20px,3.8vw,62px) clamp(22px,2vw,36px) clamp(44px,5.4vw,88px);
  overflow:visible;
}

.th-p-gaming-monitors .phase-hero__image{
  position:absolute;
  inset:0 clamp(20px,3vw,54px) clamp(26px,3vw,48px) 0;
  overflow:hidden;
  background:radial-gradient(circle at 65% 34%,#35286A,transparent 42%),#13152A;
  clip-path:polygon(0 12%,15% 0,100% 0,100% 84%,87% 100%,0 100%);
}

.th-p-gaming-monitors .phase-hero__image::after{
  position:absolute;
  inset:0;
  background:linear-gradient(107deg,rgba(4,5,13,.5) 0%,rgba(4,5,13,.11) 40%,rgba(12,5,31,.19) 100%),linear-gradient(0deg,rgba(5,5,17,.54),transparent 42%);
  content:"";
  pointer-events:none;
}

.th-p-gaming-monitors .phase-hero__image > .hero-media,
.th-p-gaming-monitors .phase-hero__image > .theme-empty-media{
  display:block;
  width:100%;
  height:100%;
  min-height:0;
}

.th-p-gaming-monitors .phase-hero__image > .hero-media{
  object-fit:cover;
  object-position:center;
}

.th-p-gaming-monitors .phase-hero__image > .theme-empty-media{
  background:
    linear-gradient(120deg,transparent 0 48%,rgba(98,233,255,.36) 48.15% 48.4%,transparent 48.55%),
    radial-gradient(circle at 70% 33%,#5F2997,transparent 27%),
    #13152A;
}

.th-p-gaming-monitors .phase-hero__scan{
  position:absolute;
  z-index:2;
  display:block;
  height:1px;
  background:linear-gradient(90deg,transparent,rgba(176,255,255,.84),transparent);
  box-shadow:0 0 18px rgba(98,233,255,.55);
  pointer-events:none;
}

.th-p-gaming-monitors .phase-hero__scan--one{
  top:19%;
  left:31%;
  width:51%;
  rotate:-14deg;
}

.th-p-gaming-monitors .phase-hero__scan--two{
  right:8%;
  bottom:25%;
  width:38%;
  rotate:22deg;
}

.th-p-gaming-monitors .phase-hero__grain{
  position:absolute;
  z-index:2;
  inset:0;
  background:repeating-linear-gradient(0deg,rgba(255,255,255,.06) 0 1px,transparent 1px 5px);
  mix-blend-mode:soft-light;
  opacity:.22;
  pointer-events:none;
}

.th-p-gaming-monitors .phase-hero__copy-frame{
  position:absolute;
  z-index:4;
  bottom:0;
  left:0;
  width:min(57%,680px);
  padding:clamp(24px,3.3vw,54px) clamp(22px,3.3vw,54px) clamp(24px,3vw,46px);
  background:linear-gradient(135deg,rgba(14,14,34,.98),rgba(25,15,52,.95));
  border:1px solid rgba(176,185,238,.26);
  box-shadow:22px 22px 0 rgba(98,233,255,.1);
}

.th-p-gaming-monitors .phase-hero__copy{
  max-width:560px;
}

.th-p-gaming-monitors .phase-hero .txt{
  gap:clamp(10px,1.1vw,16px);
}

.th-p-gaming-monitors .phase-hero .eyebrow{
  color:var(--accent);
  font:700 10px/1.2 var(--body);
  letter-spacing:.17em;
  text-transform:uppercase;
}

.th-p-gaming-monitors .phase-hero h1{
  max-width:11.6ch;
  color:#F5F6FF;
  font:700 clamp(44px,5.3vw,88px)/.88 var(--display);
  letter-spacing:-.075em;
  text-wrap:balance;
}

.th-p-gaming-monitors .phase-hero h1.long{
  max-width:12ch;
  font-size:clamp(34px,4.3vw,69px);
  line-height:.93;
}

.th-p-gaming-monitors .phase-hero .sub{
  max-width:38ch;
  color:#C0C8E6;
  font-size:clamp(14px,1.08vw,17px);
  line-height:1.55;
}

.th-p-gaming-monitors .phase-hero .ctas{
  gap:10px;
  margin-top:6px;
}

.th-p-gaming-monitors .phase-hero .btn{
  min-height:46px;
  padding-inline:21px;
  border:1px solid var(--accent);
  border-radius:999px;
  background:var(--accent);
  color:var(--onAccent);
  font-size:11px;
  font-weight:800;
  letter-spacing:.09em;
  text-transform:uppercase;
}

.th-p-gaming-monitors .phase-hero .btn.ghost{
  border-color:rgba(225,232,255,.4);
  background:transparent;
  color:#F5F6FF;
}

.th-p-gaming-monitors .phase-hero .btn:hover{
  border-color:#F3B5E7;
  background:#F3B5E7;
  color:#1A0615;
}

.th-p-gaming-monitors .phase-hero__channels{
  position:absolute;
  z-index:4;
  top:clamp(20px,2vw,32px);
  right:0;
  width:min(27%,305px);
  min-width:205px;
  padding:clamp(14px,1.5vw,22px);
  background:rgba(9,10,23,.84);
  border:1px solid rgba(176,185,238,.25);
  backdrop-filter:blur(13px);
}

.th-p-gaming-monitors .phase-hero__channels-label{
  margin:0 0 12px;
  color:#AEB8DA;
  font:700 9px/1.2 var(--body);
  letter-spacing:.17em;
  text-transform:uppercase;
}

.th-p-gaming-monitors .phase-hero__channels > div{
  border-top:1px solid rgba(176,185,238,.2);
}

.th-p-gaming-monitors .phase-hero__channel{
  display:grid;
  grid-template-columns:25px minmax(0,1fr) auto;
  gap:6px;
  align-items:center;
  min-height:54px;
  color:#EDF0FF;
  text-decoration:none;
  border-bottom:1px solid rgba(176,185,238,.16);
}

.th-p-gaming-monitors .phase-hero__channel-index{
  color:var(--accent);
  font:700 9px/1 var(--body);
  letter-spacing:.08em;
}

.th-p-gaming-monitors .phase-hero__channel-name{
  min-width:0;
  font:700 12px/1.1 var(--body);
  letter-spacing:.01em;
  overflow-wrap:anywhere;
}

.th-p-gaming-monitors .phase-hero__channel small{
  grid-column:2;
  color:#99A4C7;
  font:600 10px/1 var(--body);
}

.th-p-gaming-monitors .phase-hero__channel-arrow{
  grid-column:3;
  grid-row:1 / span 2;
  color:#EE65CF;
  font-size:17px;
}

.th-p-gaming-monitors .phase-hero__channel:hover .phase-hero__channel-name{
  color:var(--accent);
}

.th-p-gaming-monitors .phase-hero__axis{
  position:absolute;
  right:clamp(24px,4vw,65px);
  bottom:0;
  left:clamp(45px,5.5vw,90px);
  display:flex;
  align-items:center;
  gap:8px;
  margin:0;
  color:#A4AED0;
  font:700 9px/1 var(--body);
  letter-spacing:.11em;
}

.th-p-gaming-monitors .phase-hero__axis span{
  display:block;
  flex:1;
  height:1px;
  background:linear-gradient(90deg,var(--accent),rgba(98,233,255,.08));
}

.th-p-gaming-monitors .phase-hero__axis b{
  font-weight:700;
}

.th-p-gaming-monitors .phase-hero .motion-toggle{
  position:absolute;
  right:clamp(28px,5.5vw,88px);
  bottom:clamp(58px,6vw,95px);
  min-height:44px;
  padding-inline:13px;
  border:1px solid rgba(230,237,255,.38);
  border-radius:999px;
  background:rgba(9,10,23,.82);
  color:#EEF2FF;
  font:700 10px/1 var(--body);
  letter-spacing:.08em;
  text-transform:uppercase;
}

.th-p-gaming-monitors .phase-hero.has-hero-motion[data-hero-motion="pan"] .phase-hero__image .hero-media{
  animation:gaming-monitors-pan 18s ease-in-out infinite alternate;
}

.th-p-gaming-monitors .phase-hero.has-hero-motion[data-hero-motion="drift"] .phase-hero__image .hero-media{
  animation:gaming-monitors-drift 13s ease-in-out infinite alternate;
}

.th-p-gaming-monitors .phase-discovery{
  position:relative;
  overflow:hidden;
  width:min(100%,1530px);
  margin-inline:auto;
  padding:clamp(62px,8vw,126px) clamp(16px,4vw,60px) clamp(70px,8vw,132px);
}

.th-p-gaming-monitors .phase-discovery::before{
  position:absolute;
  inset:0 0 0 36%;
  background:radial-gradient(circle at 35% 35%,rgba(126,48,177,.13),transparent 46%);
  content:"";
  pointer-events:none;
}

.th-p-gaming-monitors .phase-discovery__head{
  position:relative;
  z-index:1;
  display:grid;
  grid-template-columns:minmax(118px,.35fr) minmax(0,1.25fr) auto;
  gap:clamp(20px,4vw,64px);
  align-items:end;
  padding-bottom:clamp(25px,3vw,43px);
  border-bottom:1px solid var(--line);
}

.th-p-gaming-monitors .phase-discovery__eyebrow{
  margin:0;
  color:var(--accent);
  font:700 10px/1.3 var(--body);
  letter-spacing:.16em;
  text-transform:uppercase;
}

.th-p-gaming-monitors .phase-discovery h2{
  max-width:12ch;
  margin:0;
  font:700 clamp(37px,4.45vw,70px)/.9 var(--display);
  letter-spacing:-.07em;
  text-wrap:balance;
}

.th-p-gaming-monitors .phase-discovery__head div p{
  max-width:42ch;
  margin:17px 0 0;
  color:var(--muted);
  font-size:15px;
  line-height:1.58;
}

.th-p-gaming-monitors .phase-discovery__all{
  display:inline-flex;
  align-items:center;
  gap:12px;
  min-height:44px;
  color:var(--ink);
  font:700 11px/1.2 var(--body);
  letter-spacing:.1em;
  text-decoration:none;
  text-transform:uppercase;
  white-space:nowrap;
}

.th-p-gaming-monitors .phase-discovery__all span{
  color:var(--accent);
  font-size:20px;
}

.th-p-gaming-monitors .phase-discovery__cards{
  position:relative;
  z-index:1;
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  margin-top:clamp(25px,3.1vw,46px);
  border-top:1px solid var(--line);
  border-left:1px solid var(--line);
}

.th-p-gaming-monitors .phase-discovery__card{
  display:grid;
  grid-template-rows:auto minmax(140px,1fr) auto;
  min-width:0;
  min-height:clamp(310px,29vw,430px);
  padding:clamp(14px,1.7vw,25px);
  color:var(--ink);
  text-decoration:none;
  border-right:1px solid var(--line);
  border-bottom:1px solid var(--line);
}

.th-p-gaming-monitors .phase-discovery__card:nth-child(even){
  background:rgba(21,20,44,.45);
}

.th-p-gaming-monitors .phase-discovery__card-number{
  color:#909ABE;
  font:700 10px/1 var(--body);
  letter-spacing:.12em;
}

.th-p-gaming-monitors .phase-discovery__image{
  position:relative;
  display:block;
  align-self:center;
  width:100%;
  height:clamp(145px,16vw,225px);
  margin-block:18px;
  overflow:hidden;
  background:radial-gradient(circle at 65% 37%,#362860,transparent 41%),#14162A;
  clip-path:polygon(0 10%,13% 0,100% 0,100% 90%,87% 100%,0 100%);
}

.th-p-gaming-monitors .phase-discovery__image img{
  display:block;
  width:100%;
  height:100%;
  object-fit:cover;
}

.th-p-gaming-monitors .phase-discovery__empty-image{
  display:block;
  width:100%;
  height:100%;
  background:
    linear-gradient(136deg,transparent 0 49%,rgba(98,233,255,.58) 49.2% 49.7%,transparent 49.9%),
    repeating-linear-gradient(0deg,rgba(255,255,255,.07) 0 1px,transparent 1px 7px);
}

.th-p-gaming-monitors .phase-discovery__label{
  display:grid;
  grid-template-columns:minmax(0,1fr) auto;
  gap:5px 12px;
  min-height:57px;
  padding-top:14px;
  border-top:1px solid rgba(174,184,218,.23);
}

.th-p-gaming-monitors .phase-discovery__label b{
  min-width:0;
  font:700 clamp(17px,1.6vw,24px)/1.03 var(--display);
  letter-spacing:-.055em;
  overflow-wrap:anywhere;
}

.th-p-gaming-monitors .phase-discovery__label small{
  grid-column:1;
  color:var(--muted);
  font:600 10px/1.2 var(--body);
  letter-spacing:.02em;
}

.th-p-gaming-monitors .phase-discovery__label i{
  grid-column:2;
  grid-row:1 / span 2;
  align-self:center;
  color:#EE65CF;
  font-size:19px;
  font-style:normal;
}

.th-p-gaming-monitors .phase-discovery__card:hover{
  background:rgba(45,31,78,.62);
}

.th-p-gaming-monitors .phase-discovery__card:hover .phase-discovery__label b{
  color:var(--accent);
}

.th-p-gaming-monitors .phase-discovery__products{
  position:relative;
  z-index:1;
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  margin-top:clamp(25px,3.1vw,46px);
  border-top:1px solid var(--line);
  border-left:1px solid var(--line);
}

.th-p-gaming-monitors .phase-discovery__product{
  display:grid;
  grid-template-columns:38px minmax(0,1fr) auto 24px;
  gap:14px;
  align-items:center;
  min-height:96px;
  padding:18px 20px;
  color:var(--ink);
  text-decoration:none;
  border-right:1px solid var(--line);
  border-bottom:1px solid var(--line);
}

.th-p-gaming-monitors .phase-discovery__product-number{
  color:var(--accent);
  font:700 10px/1 var(--body);
  letter-spacing:.1em;
}

.th-p-gaming-monitors .phase-discovery__product b{
  min-width:0;
  font:700 clamp(17px,1.4vw,22px)/1.08 var(--display);
  letter-spacing:-.045em;
  overflow-wrap:anywhere;
}

.th-p-gaming-monitors .phase-discovery__product small{
  color:var(--muted);
  font:700 12px/1.2 var(--body);
  white-space:nowrap;
}

.th-p-gaming-monitors .phase-discovery__product i{
  color:#EE65CF;
  font-size:18px;
  font-style:normal;
}

.th-p-gaming-monitors .phase-discovery__product:hover{
  background:rgba(45,31,78,.62);
}

.th-p-gaming-monitors #shop{
  position:relative;
  padding-top:clamp(60px,7.7vw,118px);
  background:#0B0C19;
  border-top:1px solid var(--line);
}

.th-p-gaming-monitors #shop .sec-h{
  align-items:end;
  margin-bottom:clamp(24px,3vw,42px);
  padding-bottom:18px;
  border-bottom:1px solid var(--line);
}

.th-p-gaming-monitors #shop .sec-h h2{
  font:700 clamp(34px,4vw,63px)/.9 var(--display);
  letter-spacing:-.07em;
}

.th-p-gaming-monitors #shop .chips{
  gap:8px;
}

.th-p-gaming-monitors #shop .chip{
  min-height:44px;
  border-color:#343956;
  border-radius:999px;
  background:#111326;
  color:#B7C0DC;
  font-size:11px;
  font-weight:700;
  letter-spacing:.06em;
}

.th-p-gaming-monitors #shop .chip:hover,
.th-p-gaming-monitors #shop .chip[aria-current]{
  border-color:var(--accent);
  background:var(--accent);
  color:var(--onAccent);
}

.th-p-gaming-monitors #shop .grid{
  gap:clamp(18px,2.2vw,32px);
}

.th-p-gaming-monitors #shop .pc{
  gap:13px;
  padding:10px;
  background:#101224;
  border:1px solid #2B304C;
  border-radius:12px;
}

.th-p-gaming-monitors #shop .pc .im{
  background:radial-gradient(circle at 58% 34%,#2B2453,transparent 45%),#15172A;
  border-radius:7px;
}

.th-p-gaming-monitors #shop .pc .im img{
  transition:none;
}

.th-p-gaming-monitors #shop .pc:hover .im img{
  transform:none;
}

.th-p-gaming-monitors #shop .pc .bd{
  padding:4px 4px 8px;
}

.th-p-gaming-monitors #shop .pc h3{
  font-family:var(--display);
  letter-spacing:-.045em;
}

.th-p-gaming-monitors #shop .pc .pr{
  color:var(--accent);
  font-weight:800;
}

.th-p-gaming-monitors #shop .pc .ct{
  color:var(--muted);
}

.th-p-gaming-monitors #shop .pc .tag{
  border-radius:999px;
  background:#EE65CF;
  color:#1A0615;
  font-size:10px;
  font-weight:800;
  letter-spacing:.07em;
  text-transform:uppercase;
}

.th-p-gaming-monitors #shop .pc .go{
  border-radius:999px;
  background:var(--accent);
  color:var(--onAccent);
}

.th-p-gaming-monitors .perks{
  background:#111326;
  border-color:#2B304C;
}

.th-p-gaming-monitors .perks .perk{
  color:var(--ink);
}

.th-p-gaming-monitors .perks .perk svg{
  color:var(--accent);
}

.th-p-gaming-monitors .ft{
  border-top-color:#2B304C;
}

@keyframes gaming-monitors-pan{
  0%{transform:scale(1.03) translate3d(-.8%,.25%,0)}
  100%{transform:scale(1.09) translate3d(1.4%,-.65%,0)}
}

@keyframes gaming-monitors-drift{
  0%{transform:scale(1.03) translate3d(-.6%,-.45%,0)}
  100%{transform:scale(1.065) translate3d(.75%,.5%,0)}
}

@media (max-width:1030px){
  .th-p-gaming-monitors .phase-hero__shell{
    min-height:clamp(610px,66vw,700px);
  }

  .th-p-gaming-monitors .phase-hero__copy-frame{
    width:min(62%,590px);
  }

  .th-p-gaming-monitors .phase-hero__channels{
    width:25%;
    min-width:190px;
  }

  .th-p-gaming-monitors .phase-discovery__head{
    grid-template-columns:110px minmax(0,1fr);
  }

  .th-p-gaming-monitors .phase-discovery__all{
    grid-column:2;
    justify-self:start;
  }

  .th-p-gaming-monitors .phase-discovery__cards{
    grid-template-columns:repeat(2,minmax(0,1fr));
  }

  .th-p-gaming-monitors .phase-discovery__card{
    min-height:350px;
  }
}

@media (max-width:720px){
  .th-p-gaming-monitors .hd .nav{
    display:none;
  }

  .th-p-gaming-monitors .phase-hero{
    padding:14px 14px 30px;
  }

  .th-p-gaming-monitors .phase-hero__shell{
    min-height:0;
  }

  .th-p-gaming-monitors .phase-hero__caption{
    position:relative;
    top:auto;
    right:auto;
    left:auto;
    padding:0 2px 11px;
    font-size:9px;
  }

  .th-p-gaming-monitors .phase-hero__ruler{
    display:none;
  }

  .th-p-gaming-monitors .phase-hero__view{
    position:relative;
    inset:auto;
    display:flex;
    flex-direction:column;
    gap:0;
  }

  .th-p-gaming-monitors .phase-hero__image{
    position:relative;
    inset:auto;
    height:min(79vw,405px);
    clip-path:polygon(0 8%,10% 0,100% 0,100% 93%,92% 100%,0 100%);
  }

  .th-p-gaming-monitors .phase-hero__image > .hero-media{
    object-position:59% center;
  }

  .th-p-gaming-monitors .phase-hero__copy-frame{
    position:relative;
    bottom:auto;
    left:auto;
    width:auto;
    margin-top:-1px;
    padding:28px 22px 30px;
    box-shadow:13px 13px 0 rgba(98,233,255,.1);
  }

  .th-p-gaming-monitors .phase-hero h1{
    max-width:12.5ch;
    font-size:clamp(43px,12vw,65px);
  }

  .th-p-gaming-monitors .phase-hero h1.long{
    font-size:clamp(33px,9vw,51px);
  }

  .th-p-gaming-monitors .phase-hero__channels{
    position:relative;
    top:auto;
    right:auto;
    order:3;
    width:auto;
    min-width:0;
    margin-top:14px;
    padding:14px;
  }

  .th-p-gaming-monitors .phase-hero__channels > div{
    display:grid;
    grid-template-columns:repeat(2,minmax(0,1fr));
    column-gap:13px;
  }

  .th-p-gaming-monitors .phase-hero__channel{
    min-height:50px;
  }

  .th-p-gaming-monitors .phase-hero__axis{
    position:relative;
    right:auto;
    bottom:auto;
    left:auto;
    margin-top:22px;
  }

  .th-p-gaming-monitors .phase-hero .motion-toggle{
    right:28px;
    bottom:45px;
  }

  .th-p-gaming-monitors .phase-discovery{
    padding-inline:18px;
  }

  .th-p-gaming-monitors .phase-discovery__head{
    display:flex;
    flex-direction:column;
    align-items:flex-start;
    gap:16px;
  }

  .th-p-gaming-monitors .phase-discovery h2{
    font-size:clamp(37px,11vw,58px);
  }

  .th-p-gaming-monitors .phase-discovery__head div p{
    margin-top:13px;
  }

  .th-p-gaming-monitors .phase-discovery__all{
    margin-top:1px;
  }

  .th-p-gaming-monitors .phase-discovery__card{
    min-height:300px;
  }

  .th-p-gaming-monitors .phase-discovery__image{
    height:170px;
  }

  .th-p-gaming-monitors .phase-discovery__products{
    grid-template-columns:1fr;
  }

  .th-p-gaming-monitors #shop .sec-h{
    align-items:flex-start;
    gap:18px;
  }

  .th-p-gaming-monitors #shop .chips{
    overflow-x:auto;
    flex-wrap:nowrap;
  }

  .th-p-gaming-monitors #shop .chip{
    flex:none;
  }
}

@media (max-width:430px){
  .th-p-gaming-monitors .brand{
    font-size:13px;
    letter-spacing:.1em;
  }

  .th-p-gaming-monitors .phase-hero__caption{
    gap:8px;
    font-size:8px;
    letter-spacing:.11em;
  }

  .th-p-gaming-monitors .phase-hero__image{
    height:82vw;
  }

  .th-p-gaming-monitors .phase-hero__copy-frame{
    padding:25px 18px 27px;
  }

  .th-p-gaming-monitors .phase-hero .ctas{
    width:100%;
  }

  .th-p-gaming-monitors .phase-hero .btn{
    flex:1 1 100%;
    width:100%;
  }

  .th-p-gaming-monitors .phase-hero__channels > div{
    grid-template-columns:1fr;
  }

  .th-p-gaming-monitors .phase-hero__channel small{
    display:none;
  }

  .th-p-gaming-monitors .phase-hero__channel-arrow{
    grid-row:1;
  }

  .th-p-gaming-monitors .phase-hero .motion-toggle{
    right:24px;
    bottom:43px;
  }

  .th-p-gaming-monitors .phase-discovery__cards{
    grid-template-columns:1fr;
  }

  .th-p-gaming-monitors .phase-discovery__card{
    grid-template-columns:45px minmax(0,1fr);
    grid-template-rows:1fr auto;
    gap:0 12px;
    min-height:245px;
  }

  .th-p-gaming-monitors .phase-discovery__card-number{
    grid-column:1;
    grid-row:1;
  }

  .th-p-gaming-monitors .phase-discovery__image{
    grid-column:2;
    grid-row:1;
    align-self:stretch;
    height:auto;
    min-height:145px;
    margin:0;
  }

  .th-p-gaming-monitors .phase-discovery__label{
    grid-column:1 / -1;
    grid-row:2;
  }

  .th-p-gaming-monitors .phase-discovery__product{
    grid-template-columns:27px minmax(0,1fr) 20px;
    gap:10px;
    min-height:76px;
    padding:15px;
  }

  .th-p-gaming-monitors .phase-discovery__product small{
    display:none;
  }

  .th-p-gaming-monitors .phase-discovery__product i{
    grid-column:3;
  }
}

@media (prefers-reduced-motion:reduce){
  .th-p-gaming-monitors .phase-hero.has-hero-motion .phase-hero__image .hero-media{
    animation:none;
    transform:none;
  }
}
`;

import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-sunglasses',
  name: 'LUCENT HOUR',
  for: 'Sunglasses and sun-optics collections',
  vibe: 'Sun-struck optical still life, lacquered shadows, and warm observatory tones.',
  category: 'Sunglasses / sun optics',
  group: 'fashion',
  display: 'DM Serif Display',
  body: 'Manrope',
  displayWeight: 400,
  tracking: '-.045em',
  colors: {
    bg: '#F3E5D0',
    surface: '#E7C8A6',
    ink: '#220D12',
    muted: '#7E5C53',
    line: '#C99D79',
    accent: '#C04524',
    onAccent: '#FFF6EB',
    panel: '#321116',
    onPanel: '#FFE7C2',
    foot: '#220D12',
    onFoot: '#FFE8CB',
    bar: '#D35A31',
    onBar: '#FFF7ED',
    badge: '#FFD064',
    onBadge: '#291008',
  },
  header: 'stack',
  hero: 'spotlight',
  card: 'bold',
  ratio: '4/3',
  rCard: 28,
  rBtn: 999,
  motion: 'pan',
  copy: {
    eyebrow: 'The solar edit',
    collection: 'Find your bright side.',
    cta: 'View the collection',
    title: 'Shade the ordinary.',
    subtitle: 'Frames for the hours that stay in view.',
  },
});

const itemLabel = (count) => `${count} ${count === 1 ? 'item' : 'items'}`;

export function hero(ctx) {
  const heading = String(ctx.head || '');
  const eyebrow = ctx.eyebrow
    ? `<p class="sunglasses-kicker">${ctx.esc(ctx.eyebrow)}</p>`
    : '';
  const sub = ctx.sub
    ? `<p class="sunglasses-sub">${ctx.esc(ctx.sub)}</p>`
    : '';
  const longClass = heading.length > 44 ? ' is-long' : '';

  return `<section class="hero category-hero sunglasses-hero${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="sunglasses-stage">
      <div class="sunglasses-sunburst" aria-hidden="true"></div>
      <div class="sunglasses-orbit sunglasses-orbit-outer" aria-hidden="true"></div>
      <div class="sunglasses-lens">
        ${ctx.media(0, { priority: true, lazy: false, decorative: true })}
      </div>
      <div class="sunglasses-orbit sunglasses-orbit-inner" aria-hidden="true"></div>
      <div class="sunglasses-caption">
        ${eyebrow}
        <h1 class="sunglasses-title${longClass}">${ctx.esc(heading)}</h1>
        ${sub}
        ${ctx.ctas}
      </div>
      <div class="sunglasses-ray-index" aria-hidden="true"><span></span><span></span><span></span></div>
      ${ctx.controls}
    </div>
  </section>`;
}

export function discovery(ctx) {
  const categories = (Array.isArray(ctx.cats) ? ctx.cats : [])
    .filter((category) => category?.name)
    .slice(0, 4);
  const products = Array.isArray(ctx.products) ? ctx.products : [];
  const title = ctx.esc(ctx.t.copy?.collection || 'Find your bright side.');

  if (categories.length >= 2) {
    const cards = categories.map((category, index) => {
      const count = Number(category.count);
      const countLabel = Number.isFinite(count) && count >= 0
        ? `<span class="sunglasses-spectrum-count">${ctx.esc(itemLabel(count))}</span>`
        : '';
      const image = category.image
        ? `<img src="${ctx.esc(category.image)}" alt="${ctx.esc(category.name)}" loading="lazy" decoding="async">`
        : '<div class="theme-empty-media" aria-hidden="true"></div>';
      return `<a class="sunglasses-spectrum-card" href="${ctx.esc(ctx.categoryLink(category.name))}">
        <span class="sunglasses-spectrum-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
        <span class="sunglasses-spectrum-image">${image}</span>
        <span class="sunglasses-spectrum-label">${ctx.esc(category.name)}</span>
        ${countLabel}
      </a>`;
    }).join('');

    return `<section class="theme-discovery sunglasses-discovery" aria-labelledby="sunglasses-discovery-title">
      <div class="sunglasses-discovery-head">
        <div>
          <p class="sunglasses-discovery-kicker">Shop by direction</p>
          <h2 id="sunglasses-discovery-title">${title}</h2>
        </div>
        <p class="sunglasses-discovery-note">A small index of what is in view now.</p>
      </div>
      <div class="sunglasses-spectrum" aria-label="Shop by category">${cards}</div>
    </section>`;
  }

  if (!products.length) return '';

  return `<section class="theme-discovery sunglasses-discovery sunglasses-discovery-products" aria-labelledby="sunglasses-discovery-title">
    <div class="sunglasses-discovery-head">
      <div>
        <p class="sunglasses-discovery-kicker">The current view</p>
        <h2 id="sunglasses-discovery-title">${title}</h2>
      </div>
      <p class="sunglasses-discovery-note">A focused edit from the live catalogue.</p>
    </div>
    <div class="sunglasses-product-strip">${products.slice(0, 3).map((product) => ctx.productCard(product)).join('')}</div>
  </section>`;
}

export const css = `
.th-p-sunglasses{
  background:var(--bg);
  color:var(--ink);
}
.th-p-sunglasses .ann{
  border:0;
  background:var(--bar);
  color:var(--onBar);
  font:700 10px/1.25 var(--body);
  letter-spacing:.14em;
  text-transform:uppercase;
}
.th-p-sunglasses .hd{
  border-bottom:1px solid color-mix(in srgb,var(--line) 70%,transparent);
  background:color-mix(in srgb,var(--bg) 91%,#FFF8EF);
}
.th-p-sunglasses .hd .wrap{
  min-height:70px;
}
.th-p-sunglasses .hd .brand{
  color:var(--ink);
  font-family:var(--display);
  font-size:calc(28px * var(--ts));
  font-weight:400;
  letter-spacing:.08em;
}
.th-p-sunglasses .hd .nav a,
.th-p-sunglasses .hd .cart{
  color:var(--ink);
  font:700 10px/1.2 var(--body);
  letter-spacing:.12em;
  text-transform:uppercase;
}
.th-p-sunglasses .hd .nav a:hover,
.th-p-sunglasses .hd .cart:hover{
  color:var(--accent);
}
.th-p-sunglasses .sunglasses-hero{
  position:relative;
  overflow:hidden;
  background:var(--bg);
}
.th-p-sunglasses .sunglasses-stage{
  position:relative;
  display:grid;
  grid-template-columns:minmax(24px,1fr) minmax(360px,650px) minmax(24px,1fr);
  grid-template-rows:minmax(600px,calc(100svh - 70px));
  isolation:isolate;
  overflow:hidden;
  min-height:600px;
  padding:clamp(28px,4vw,62px) clamp(22px,5vw,82px);
}
.th-p-sunglasses .sunglasses-stage::before{
  position:absolute;
  z-index:-3;
  inset:0;
  content:'';
  background:radial-gradient(circle at 53% 48%,rgba(255,215,135,.68) 0 9%,rgba(230,166,95,.38) 9.2% 18%,transparent 47%),linear-gradient(112deg,#F7ECD9 0%,#F3E5D0 42%,#EBC8A6 100%);
}
.th-p-sunglasses .sunglasses-sunburst{
  position:absolute;
  z-index:-2;
  top:50%;
  left:50%;
  width:min(80vw,1050px);
  aspect-ratio:1;
  border-radius:50%;
  background:repeating-conic-gradient(from -15deg at 50% 50%,rgba(192,69,37,.16) 0 1.2deg,transparent 1.4deg 12deg);
  transform:translate(-50%,-50%);
}
.th-p-sunglasses .sunglasses-orbit{
  position:absolute;
  z-index:-1;
  top:50%;
  left:50%;
  border:1px solid rgba(126,92,83,.38);
  border-radius:50%;
  pointer-events:none;
  transform:translate(-50%,-50%);
}
.th-p-sunglasses .sunglasses-orbit-outer{
  width:min(74vw,850px);
  aspect-ratio:1.35;
}
.th-p-sunglasses .sunglasses-orbit-inner{
  width:min(45vw,530px);
  aspect-ratio:1;
  border-color:rgba(255,246,235,.82);
  box-shadow:0 0 0 12px rgba(192,69,36,.09);
}
.th-p-sunglasses .sunglasses-lens{
  position:relative;
  z-index:1;
  grid-column:2;
  grid-row:1;
  align-self:center;
  justify-self:center;
  width:min(100%,clamp(390px,47vw,650px));
  aspect-ratio:1;
  overflow:hidden;
  border:clamp(10px,1.5vw,22px) solid rgba(255,237,209,.92);
  border-radius:50%;
  background:var(--panel);
  box-shadow:0 24px 60px rgba(51,17,22,.28),0 0 0 1px rgba(50,17,22,.22);
}
.th-p-sunglasses .sunglasses-lens::after{
  position:absolute;
  z-index:1;
  inset:0;
  content:'';
  pointer-events:none;
  background:linear-gradient(135deg,rgba(255,248,232,.16),transparent 26% 70%,rgba(46,12,15,.25)),radial-gradient(circle at 24% 13%,rgba(255,241,197,.25),transparent 23%);
}
.th-p-sunglasses .sunglasses-lens .hero-media,
.th-p-sunglasses .sunglasses-lens .theme-empty-media{
  display:block;
  width:100%;
  height:100%;
  min-height:0;
  object-fit:cover;
}
.th-p-sunglasses .sunglasses-lens .hero-media{
  object-position:center;
}
.th-p-sunglasses .sunglasses-lens .theme-empty-media{
  background:radial-gradient(circle at 68% 30%,#FFCD6F 0 3%,transparent 3.5% 18%),radial-gradient(circle at 38% 66%,#B14B35 0 6%,transparent 6.5% 32%),linear-gradient(140deg,#41141A,#8B3D2E 50%,#E19A57);
}
.th-p-sunglasses .sunglasses-caption{
  position:relative;
  z-index:2;
  grid-column:1 / 4;
  grid-row:1;
  align-self:end;
  width:min(100%,840px);
  margin:0 0 clamp(2px,2.6vw,38px) clamp(0px,2vw,34px);
  pointer-events:none;
}
.th-p-sunglasses .sunglasses-caption .sunglasses-kicker,
.th-p-sunglasses .sunglasses-caption .sunglasses-title,
.th-p-sunglasses .sunglasses-caption .sunglasses-sub,
.th-p-sunglasses .sunglasses-caption .ctas{
  pointer-events:auto;
}
.th-p-sunglasses .sunglasses-kicker{
  margin:0 0 15px;
  color:var(--accent);
  font:800 clamp(9px,.74vw,11px)/1.25 var(--body);
  letter-spacing:.19em;
  text-transform:uppercase;
}
.th-p-sunglasses .sunglasses-title{
  max-width:11.4ch;
  margin:0;
  color:var(--ink);
  font-family:var(--display);
  font-size:calc(clamp(67px,9.6vw,164px) * var(--hero));
  font-weight:400;
  letter-spacing:calc(var(--dt) - .034em);
  line-height:.76;
  overflow-wrap:anywhere;
  text-wrap:balance;
}
.th-p-sunglasses .sunglasses-title.is-long{
  max-width:15ch;
  font-size:calc(clamp(49px,6.7vw,108px) * min(var(--hero),1.12));
  line-height:.82;
}
.th-p-sunglasses .sunglasses-sub{
  width:min(33ch,100%);
  margin:22px 0 0;
  color:var(--muted);
  font:600 clamp(13px,1.1vw,16px)/1.5 var(--body);
  overflow-wrap:anywhere;
}
.th-p-sunglasses .sunglasses-caption .ctas{
  display:flex;
  flex-wrap:wrap;
  gap:10px;
  margin-top:25px;
}
.th-p-sunglasses .sunglasses-caption .btn{
  min-height:48px;
  padding-inline:23px;
  border:1px solid var(--ink);
  border-radius:999px;
  background:var(--ink);
  box-shadow:none;
  color:var(--onFoot);
  font:800 10px/1 var(--body);
  letter-spacing:.13em;
  text-transform:uppercase;
}
.th-p-sunglasses .sunglasses-caption .btn:hover{
  border-color:var(--accent);
  background:var(--accent);
  color:var(--onAccent);
}
.th-p-sunglasses .sunglasses-caption .btn.ghost{
  background:rgba(255,247,237,.5);
  color:var(--ink);
}
.th-p-sunglasses .sunglasses-caption .btn.ghost:hover{
  background:var(--bg);
  color:var(--ink);
}
.th-p-sunglasses .sunglasses-ray-index{
  position:absolute;
  z-index:2;
  top:clamp(26px,5.5vw,74px);
  right:clamp(24px,5vw,88px);
  display:grid;
  gap:8px;
  width:38px;
  pointer-events:none;
}
.th-p-sunglasses .sunglasses-ray-index span{
  display:block;
  height:2px;
  background:var(--accent);
}
.th-p-sunglasses .sunglasses-ray-index span:nth-child(2){
  width:72%;
  margin-left:auto;
  background:var(--muted);
}
.th-p-sunglasses .sunglasses-ray-index span:nth-child(3){
  width:46%;
  margin-left:auto;
  background:var(--ink);
}
.th-p-sunglasses .sunglasses-hero .motion-toggle{
  position:absolute;
  z-index:4;
  right:clamp(18px,3vw,48px);
  bottom:clamp(18px,2.3vw,36px);
  min-width:44px;
  min-height:44px;
  border:1px solid rgba(34,13,18,.42);
  border-radius:999px;
  background:rgba(255,246,235,.74);
  color:var(--ink);
  font:800 9px/1 var(--body);
  letter-spacing:.11em;
  text-transform:uppercase;
}
.th-p-sunglasses .sunglasses-hero .motion-toggle:hover{
  border-color:var(--accent);
  background:var(--accent);
  color:var(--onAccent);
}
.th-p-sunglasses .sunglasses-discovery{
  overflow:hidden;
  padding:clamp(60px,8vw,126px) clamp(20px,5vw,80px) clamp(66px,8vw,122px);
  background:var(--panel);
  color:var(--onPanel);
}
.th-p-sunglasses .sunglasses-discovery-head{
  display:grid;
  grid-template-columns:minmax(0,1fr) minmax(190px,300px);
  align-items:end;
  gap:28px;
  width:min(100%,1340px);
  margin:0 auto clamp(36px,5vw,72px);
  padding-bottom:20px;
  border-bottom:1px solid rgba(255,231,194,.35);
}
.th-p-sunglasses .sunglasses-discovery-kicker{
  margin:0 0 10px;
  color:#FFC66A;
  font:800 10px/1.3 var(--body);
  letter-spacing:.18em;
  text-transform:uppercase;
}
.th-p-sunglasses .sunglasses-discovery h2{
  max-width:12ch;
  margin:0;
  color:var(--onPanel);
  font-family:var(--display);
  font-size:calc(clamp(46px,5.8vw,96px) * var(--ts));
  font-weight:400;
  letter-spacing:calc(var(--dt) - .025em);
  line-height:.82;
  overflow-wrap:anywhere;
  text-wrap:balance;
}
.th-p-sunglasses .sunglasses-discovery-note{
  max-width:29ch;
  margin:0 0 4px auto;
  color:rgba(255,231,194,.68);
  font:600 12px/1.55 var(--body);
  text-align:right;
}
.th-p-sunglasses .sunglasses-spectrum{
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  gap:clamp(12px,2vw,28px);
  width:min(100%,1340px);
  margin:auto;
}
.th-p-sunglasses .sunglasses-spectrum-card{
  position:relative;
  display:grid;
  min-width:0;
  min-height:44px;
  color:var(--onPanel);
  text-decoration:none;
}
.th-p-sunglasses .sunglasses-spectrum-card:nth-child(even){
  margin-top:clamp(28px,4.5vw,74px);
}
.th-p-sunglasses .sunglasses-spectrum-card::before{
  position:absolute;
  z-index:0;
  top:-10px;
  left:-10px;
  width:42%;
  aspect-ratio:1;
  border:1px solid rgba(255,231,194,.35);
  border-radius:50%;
  content:'';
}
.th-p-sunglasses .sunglasses-spectrum-image{
  position:relative;
  z-index:1;
  display:block;
  aspect-ratio:1.04 / 1;
  overflow:hidden;
  border-radius:50% 50% 8px 8px;
  background:#642B28;
  box-shadow:0 0 0 1px rgba(255,231,194,.42);
}
.th-p-sunglasses .sunglasses-spectrum-image img,
.th-p-sunglasses .sunglasses-spectrum-image .theme-empty-media{
  display:block;
  width:100%;
  height:100%;
  min-height:0;
  object-fit:cover;
}
.th-p-sunglasses .sunglasses-spectrum-image .theme-empty-media{
  background:radial-gradient(circle at 70% 26%,#F4B95E 0 7%,transparent 7.3% 25%),radial-gradient(circle at 34% 66%,#B64B38 0 11%,transparent 11.3% 34%),linear-gradient(135deg,#2B141A,#70312A 57%,#B5623C);
}
.th-p-sunglasses .sunglasses-spectrum-number{
  position:relative;
  z-index:2;
  display:block;
  margin:15px 0 8px;
  color:#FFC66A;
  font:800 9px/1 var(--body);
  letter-spacing:.16em;
}
.th-p-sunglasses .sunglasses-spectrum-label{
  position:relative;
  z-index:2;
  display:block;
  max-width:16ch;
  color:var(--onPanel);
  font-family:var(--display);
  font-size:calc(clamp(25px,2.3vw,37px) * var(--ts));
  font-weight:400;
  letter-spacing:calc(var(--dt) - .015em);
  line-height:.92;
  overflow-wrap:anywhere;
}
.th-p-sunglasses .sunglasses-spectrum-count{
  position:relative;
  z-index:2;
  display:block;
  margin-top:9px;
  color:rgba(255,231,194,.7);
  font:700 9px/1.3 var(--body);
  letter-spacing:.12em;
  text-transform:uppercase;
}
.th-p-sunglasses .sunglasses-spectrum-card:hover .sunglasses-spectrum-image{
  box-shadow:0 0 0 2px #FFC66A;
}
.th-p-sunglasses .sunglasses-spectrum-card:hover .sunglasses-spectrum-label{
  color:#FFC66A;
}
.th-p-sunglasses .sunglasses-product-strip{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  width:min(100%,1340px);
  margin:auto;
  border-top:1px solid rgba(255,231,194,.38);
  border-left:1px solid rgba(255,231,194,.38);
}
.th-p-sunglasses .sunglasses-product-strip .pc{
  min-width:0;
  padding:clamp(14px,2vw,28px);
  border:0;
  border-right:1px solid rgba(255,231,194,.38);
  border-bottom:1px solid rgba(255,231,194,.38);
  border-radius:0;
  background:transparent;
  box-shadow:none;
  color:var(--onPanel);
}
.th-p-sunglasses .sunglasses-product-strip .pc .im{
  aspect-ratio:1.15 / 1;
  overflow:hidden;
  border:0;
  border-radius:50% 50% 8px 8px;
  background:#642B28;
}
.th-p-sunglasses .sunglasses-product-strip .pc .im img,
.th-p-sunglasses .sunglasses-product-strip .pc .im .noimg{
  display:block;
  width:100%;
  height:100%;
  object-fit:cover;
}
.th-p-sunglasses .sunglasses-product-strip .pc .im .noimg{
  background:radial-gradient(circle at 68% 28%,#F4B95E 0 8%,transparent 8.3% 26%),linear-gradient(135deg,#2B141A,#70312A 58%,#B5623C);
}
.th-p-sunglasses .sunglasses-product-strip .pc .bd{
  padding-top:17px;
}
.th-p-sunglasses .sunglasses-product-strip .pc h3{
  color:inherit;
  font-family:var(--display);
  font-size:calc(clamp(25px,2.2vw,37px) * var(--ts));
  font-weight:400;
  letter-spacing:calc(var(--dt) - .015em);
  line-height:.9;
  overflow-wrap:anywhere;
}
.th-p-sunglasses .sunglasses-product-strip .pc .pr{
  color:#FFC66A;
  font:800 10px/1.2 var(--body);
  letter-spacing:.08em;
}
.th-p-sunglasses .sunglasses-product-strip .pc .tag{
  border-radius:999px;
  background:#FFC66A;
  color:#291008;
  font:800 8px/1 var(--body);
  letter-spacing:.1em;
  text-transform:uppercase;
}
.th-p-sunglasses .sunglasses-product-strip .pc .go{
  border-color:#FFC66A;
  border-radius:50%;
  background:var(--panel);
  color:#FFC66A;
}
.th-p-sunglasses .sec{
  background:var(--bg);
}
.th-p-sunglasses .sec > .wrap > .sec-h{
  border-color:var(--line);
}
.th-p-sunglasses .sec > .wrap > .sec-h h2{
  font-family:var(--display);
  font-weight:400;
  letter-spacing:calc(var(--dt) - .018em);
}
.th-p-sunglasses .chips .chip{
  min-height:44px;
  border-color:var(--line);
  border-radius:999px;
  color:var(--ink);
  font:800 10px/1 var(--body);
  letter-spacing:.09em;
  text-transform:uppercase;
}
.th-p-sunglasses .chips .chip.on,
.th-p-sunglasses .chips .chip:hover{
  border-color:var(--accent);
  background:var(--accent);
  color:var(--onAccent);
}
.th-p-sunglasses .grid .pc{
  border-radius:28px 28px 8px 8px;
}
.th-p-sunglasses .grid .pc .im{
  border-radius:24px 24px 4px 4px;
}
.th-p-sunglasses .ft{
  background:var(--foot);
  color:var(--onFoot);
}
.th-p-sunglasses .ft a,
.th-p-sunglasses .ft h4{
  color:var(--onFoot);
}
.th-p-sunglasses .ft .brand{
  font-family:var(--display);
  font-weight:400;
  letter-spacing:.08em;
}
.th-p-sunglasses .sunglasses-hero.has-hero-motion[data-hero-motion="pan"] .sunglasses-lens .hero-media{
  animation:sunglasses-pan 18s ease-in-out infinite alternate;
}
.th-p-sunglasses .sunglasses-hero.has-hero-motion[data-hero-motion="drift"] .sunglasses-lens .hero-media{
  animation:sunglasses-drift 15s ease-in-out infinite alternate;
}
@keyframes sunglasses-pan{
  from{transform:scale(1.04) translate3d(-1.2%,.5%,0)}
  to{transform:scale(1.10) translate3d(1.1%,-.8%,0)}
}
@keyframes sunglasses-drift{
  from{transform:scale(1.04) translate3d(.5%,0,0)}
  to{transform:scale(1.08) translate3d(-1.1%,-.9%,0)}
}
@media (max-width:860px){
  .th-p-sunglasses .sunglasses-stage{
    grid-template-columns:minmax(18px,1fr) minmax(320px,540px) minmax(18px,1fr);
    grid-template-rows:minmax(600px,76svh);
    padding-inline:28px;
  }
  .th-p-sunglasses .sunglasses-caption{
    margin-left:0;
  }
  .th-p-sunglasses .sunglasses-title{
    max-width:10.8ch;
    font-size:calc(clamp(64px,10.3vw,116px) * var(--hero));
  }
  .th-p-sunglasses .sunglasses-title.is-long{
    font-size:calc(clamp(43px,7.4vw,78px) * min(var(--hero),1.12));
  }
  .th-p-sunglasses .sunglasses-discovery-head{
    grid-template-columns:1fr;
    gap:18px;
  }
  .th-p-sunglasses .sunglasses-discovery-note{
    margin:0;
    text-align:left;
  }
  .th-p-sunglasses .sunglasses-spectrum{
    grid-template-columns:repeat(2,minmax(0,1fr));
    gap:34px 22px;
  }
  .th-p-sunglasses .sunglasses-spectrum-card:nth-child(even){
    margin-top:48px;
  }
}
@media (max-width:560px){
  .th-p-sunglasses .hd .wrap{
    min-height:60px;
  }
  .th-p-sunglasses .hd .nav{
    display:none;
  }
  .th-p-sunglasses .hd .brand{
    font-size:calc(23px * var(--ts));
  }
  .th-p-sunglasses .sunglasses-stage{
    display:flex;
    flex-direction:column;
    justify-content:flex-start;
    min-height:0;
    padding:20px 18px 37px;
  }
  .th-p-sunglasses .sunglasses-sunburst{
    top:244px;
    width:620px;
  }
  .th-p-sunglasses .sunglasses-orbit-outer{
    top:242px;
    width:500px;
  }
  .th-p-sunglasses .sunglasses-orbit-inner{
    top:242px;
    width:310px;
  }
  .th-p-sunglasses .sunglasses-lens{
    order:1;
    width:min(88vw,400px);
    margin:26px auto 0;
  }
  .th-p-sunglasses .sunglasses-caption{
    order:2;
    width:100%;
    margin:clamp(28px,8vw,42px) 0 0;
  }
  .th-p-sunglasses .sunglasses-kicker{
    margin-bottom:13px;
  }
  .th-p-sunglasses .sunglasses-title,
  .th-p-sunglasses .sunglasses-title.is-long{
    max-width:11ch;
    font-size:calc(clamp(49px,15.3vw,71px) * var(--hero));
    line-height:.78;
  }
  .th-p-sunglasses .sunglasses-sub{
    width:min(100%,32ch);
    margin-top:17px;
    font-size:13px;
  }
  .th-p-sunglasses .sunglasses-caption .ctas{
    margin-top:21px;
  }
  .th-p-sunglasses .sunglasses-caption .btn{
    flex:1 1 165px;
    min-height:46px;
    padding-inline:17px;
  }
  .th-p-sunglasses .sunglasses-ray-index{
    top:33px;
    right:22px;
  }
  .th-p-sunglasses .sunglasses-hero .motion-toggle{
    right:17px;
    bottom:17px;
  }
  .th-p-sunglasses .sunglasses-discovery{
    padding:58px 20px 68px;
  }
  .th-p-sunglasses .sunglasses-discovery-head{
    margin-bottom:34px;
    padding-bottom:17px;
  }
  .th-p-sunglasses .sunglasses-discovery h2{
    max-width:11ch;
    font-size:calc(47px * var(--ts));
  }
  .th-p-sunglasses .sunglasses-spectrum{
    gap:28px 15px;
  }
  .th-p-sunglasses .sunglasses-spectrum-card:nth-child(even){
    margin-top:34px;
  }
  .th-p-sunglasses .sunglasses-spectrum-label{
    font-size:calc(25px * var(--ts));
  }
  .th-p-sunglasses .sunglasses-product-strip{
    grid-template-columns:1fr;
  }
  .th-p-sunglasses .sunglasses-product-strip .pc{
    padding:16px;
  }
}
@media (max-width:390px){
  .th-p-sunglasses .sunglasses-stage{
    padding-inline:15px;
  }
  .th-p-sunglasses .sunglasses-lens{
    width:min(91vw,360px);
  }
  .th-p-sunglasses .sunglasses-title,
  .th-p-sunglasses .sunglasses-title.is-long{
    font-size:calc(45px * var(--hero));
  }
  .th-p-sunglasses .sunglasses-spectrum{
    gap:24px 12px;
  }
}
@media (prefers-reduced-motion:reduce){
  .th-p-sunglasses .sunglasses-hero.has-hero-motion .sunglasses-lens .hero-media{
    animation:none;
    transform:none;
  }
}
`;

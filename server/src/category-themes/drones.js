import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-drones',
  name: 'AERIAL COMMONS',
  for: 'Aerial camera drones and flight accessories',
  vibe: 'Salt-flat light, field-note typography, and a calm launch-deck geometry',
  category: 'Aerial camera drones',
  group: 'technology',
  display: 'Archivo',
  body: 'DM Sans',
  displayWeight: 700,
  tracking: '-.055em',
  colors: {
    bg: '#E9EDF0',
    surface: '#F7F9FA',
    ink: '#102036',
    muted: '#5F6D7D',
    line: '#BBC7D0',
    accent: '#E85D32',
    onAccent: '#FFFFFF',
    panel: '#18314D',
    onPanel: '#F1F5F7',
    foot: '#0C1A2A',
    onFoot: '#DDE7ED',
    bar: '#18314D',
    onBar: '#F1F5F7',
    badge: '#C6DFE6',
    onBadge: '#102036',
  },
  header: 'stack',
  hero: 'collage',
  card: 'boxed',
  ratio: '3/2',
  rCard: 16,
  rBtn: 999,
  motion: 'pan',
  copy: {
    eyebrow: 'Aerial field equipment',
    collection: 'Choose a flight line',
    cta: 'See the flight board',
    title: 'Find your clear altitude.',
    subtitle: 'Purposeful aerial tools for the view ahead.',
  },
});

const countLabel = (ctx, count) => {
  const value = Number(count);
  if (!Number.isFinite(value)) return '';
  return `<small>${ctx.esc(value)} ${value === 1 ? 'item' : 'items'}</small>`;
};

const flightRoute = (ctx, cat, index) => `<a class="drones-hero__route" href="${ctx.categoryLink(cat.name)}">
  <span class="drones-hero__route-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
  <span class="drones-hero__route-label"><b>${ctx.esc(cat.name)}</b>${countLabel(ctx, cat.count)}</span>
  <span class="drones-hero__route-arrow" aria-hidden="true">↗</span>
</a>`;

const discoveryRoute = (ctx, cat, index) => {
  const name = ctx.esc(cat.name);
  const image = cat.image
    ? `<img src="${ctx.esc(cat.image)}" alt="${name}" loading="lazy" decoding="async">`
    : '<span class="drones-discovery__empty-image" aria-hidden="true"></span>';

  return `<a class="drones-discovery__route" href="${ctx.categoryLink(cat.name)}">
    <span class="drones-discovery__ordinal" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
    <span class="drones-discovery__image">${image}</span>
    <span class="drones-discovery__meta"><b>${name}</b>${countLabel(ctx, cat.count)}</span>
    <span class="drones-discovery__go" aria-hidden="true">↗</span>
  </a>`;
};

export function hero(ctx) {
  const routes = ctx.cats.slice(0, 3);
  const routeRail = routes.length > 1
    ? `<nav class="drones-hero__routes" aria-label="Shop aerial categories">${routes.map((cat, index) => flightRoute(ctx, cat, index)).join('')}</nav>`
    : '';

  return `<section class="hero category-hero drones-hero${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="drones-hero__deck">
      <div class="drones-hero__media-stage">
        <div class="drones-hero__media">
          ${ctx.media(0, { priority: true, lazy: false })}
          <span class="drones-hero__ring drones-hero__ring--one" aria-hidden="true"></span>
          <span class="drones-hero__ring drones-hero__ring--two" aria-hidden="true"></span>
          <span class="drones-hero__bearing" aria-hidden="true"><i></i>N / FIELD</span>
          <span class="drones-hero__coordinate" aria-hidden="true">01 — OPEN AIR</span>
        </div>
      </div>
      <div class="drones-hero__base">
        <div class="drones-hero__mast" aria-hidden="true">
          <span>AERIAL</span><span>FIELD</span><i></i><small>0—∞</small>
        </div>
        ${ctx.copy('drones-hero__copy')}
        <p class="drones-hero__note">Takeoff begins with the equipment that suits your point of view.</p>
      </div>
      ${routeRail}
    </div>
    ${ctx.controls}
  </section>`;
}

export function discovery(ctx) {
  if (ctx.cats.length >= 2) {
    const routes = ctx.cats.slice(0, 3).map((cat, index) => discoveryRoute(ctx, cat, index)).join('');
    return `<section class="theme-discovery drones-discovery" aria-labelledby="drones-discovery-title">
      <div class="drones-discovery__head">
        <div>
          <p class="drones-discovery__eyebrow">Flight board</p>
          <h2 id="drones-discovery-title">Choose a flight line.</h2>
        </div>
        <a class="drones-discovery__all" href="#shop">All equipment <span aria-hidden="true">→</span></a>
      </div>
      <div class="drones-discovery__routes">${routes}</div>
    </section>`;
  }

  if (!ctx.products.length) return '';

  return `<section class="theme-discovery drones-discovery drones-discovery--products" aria-labelledby="drones-discovery-title">
    <div class="drones-discovery__head">
      <div>
        <p class="drones-discovery__eyebrow">Current flight board</p>
        <h2 id="drones-discovery-title">A clear view of what is ready.</h2>
      </div>
      <a class="drones-discovery__all" href="#shop">All equipment <span aria-hidden="true">→</span></a>
    </div>
    <div class="drones-discovery__products">${ctx.products.slice(0, 3).map((product) => ctx.productCard(product)).join('')}</div>
  </section>`;
}

export const css = `
.th-p-drones{
  background:var(--bg);
  color:var(--ink);
}

.th-p-drones .ann{
  background:var(--panel);
  color:var(--on-panel);
  border:0;
  font:700 10px/1.2 var(--body);
  letter-spacing:.14em;
  text-transform:uppercase;
}

.th-p-drones .hd{
  background:color-mix(in srgb,var(--bg) 93%,transparent);
  border-bottom:1px solid color-mix(in srgb,var(--ink) 13%,transparent);
  box-shadow:none;
}

.th-p-drones .brand{
  color:var(--ink);
  font-family:var(--display);
  font-size:clamp(17px,1.5vw,23px);
  font-weight:700;
  letter-spacing:.13em;
}

.th-p-drones .nav{
  gap:clamp(14px,2.1vw,30px);
}

.th-p-drones .nav a,
.th-p-drones .cart{
  color:var(--ink);
  font:700 11px/1.2 var(--body);
  letter-spacing:.09em;
  text-transform:uppercase;
}

.th-p-drones .nav a{
  background-image:linear-gradient(var(--accent),var(--accent));
}

.th-p-drones .cart{
  border:1px solid color-mix(in srgb,var(--ink) 18%,transparent);
  border-radius:999px;
}

.th-p-drones :is(.btn,.buy):hover{
  transform:none;
}

.th-p-drones .drones-hero{
  position:relative;
  isolation:isolate;
  overflow:hidden;
  padding:clamp(16px,2.7vw,42px) clamp(14px,4.2vw,70px) clamp(44px,6vw,92px);
  background:
    linear-gradient(90deg,transparent 0 7%,color-mix(in srgb,var(--ink) 6%,transparent) 7% calc(7% + 1px),transparent calc(7% + 1px) 93%,color-mix(in srgb,var(--ink) 6%,transparent) 93% calc(93% + 1px),transparent calc(93% + 1px)),
    var(--bg);
}

.th-p-drones .drones-hero::before{
  position:absolute;
  inset:auto 0 0;
  z-index:-1;
  height:38%;
  content:"";
  background:linear-gradient(90deg,var(--panel) 0 8%,transparent 8% 92%,var(--panel) 92% 100%);
  opacity:.06;
}

.th-p-drones .drones-hero__deck{
  position:relative;
  width:min(100%,1440px);
  margin-inline:auto;
}

.th-p-drones .drones-hero__media-stage{
  position:relative;
  z-index:1;
  padding-inline:clamp(0px,4.8vw,72px);
}

.th-p-drones .drones-hero__media{
  position:relative;
  aspect-ratio:16/8.4;
  min-height:clamp(310px,39vw,570px);
  overflow:hidden;
  background:#BFC9D0;
  box-shadow:0 32px 62px -42px rgba(10,28,47,.72);
  clip-path:polygon(0 0,100% 0,100% calc(100% - 26px),calc(100% - 26px) 100%,0 100%);
}

.th-p-drones .drones-hero__media::before{
  position:absolute;
  inset:0;
  z-index:1;
  content:"";
  pointer-events:none;
  background:
    linear-gradient(90deg,rgba(11,30,49,.56) 0%,rgba(11,30,49,.16) 24%,transparent 52%,rgba(11,30,49,.23) 100%),
    linear-gradient(0deg,rgba(9,22,37,.38),transparent 48%);
}

.th-p-drones .drones-hero__media::after{
  position:absolute;
  inset:clamp(14px,2vw,26px);
  z-index:2;
  content:"";
  pointer-events:none;
  border:1px solid rgba(241,245,247,.44);
  border-bottom-color:transparent;
}

.th-p-drones .drones-hero__media > .hero-media,
.th-p-drones .drones-hero__media > .theme-empty-media{
  position:absolute;
  inset:0;
  display:block;
  width:100%;
  height:100%;
  min-height:0;
  object-fit:cover;
  object-position:center;
}

.th-p-drones .drones-hero__media > .theme-empty-media{
  display:grid;
  place-items:center;
  padding:42px;
  background:
    radial-gradient(circle at 68% 45%,transparent 0 12%,rgba(247,249,250,.5) 12.15% 12.5%,transparent 12.65% 24%,rgba(247,249,250,.34) 24.15% 24.5%,transparent 24.65%),
    linear-gradient(135deg,#58728A,#D5DDE2);
  color:#F7F9FA;
}

.th-p-drones .drones-hero__ring{
  position:absolute;
  z-index:2;
  width:clamp(116px,16vw,230px);
  aspect-ratio:1;
  border:1px solid rgba(247,249,250,.54);
  border-radius:50%;
  pointer-events:none;
}

.th-p-drones .drones-hero__ring--one{
  right:clamp(20px,6vw,92px);
  bottom:clamp(20px,5vw,70px);
}

.th-p-drones .drones-hero__ring--two{
  right:calc(clamp(20px,6vw,92px) + clamp(34px,4vw,64px));
  bottom:calc(clamp(20px,5vw,70px) + clamp(34px,4vw,64px));
  opacity:.62;
}

.th-p-drones .drones-hero__bearing,
.th-p-drones .drones-hero__coordinate{
  position:absolute;
  z-index:3;
  color:#F1F5F7;
  font:700 10px/1.1 var(--body);
  letter-spacing:.15em;
}

.th-p-drones .drones-hero__bearing{
  top:clamp(28px,4vw,56px);
  left:clamp(28px,4vw,56px);
  display:flex;
  align-items:center;
  gap:9px;
}

.th-p-drones .drones-hero__bearing i{
  display:block;
  width:17px;
  height:17px;
  border:1px solid currentColor;
  border-radius:50%;
}

.th-p-drones .drones-hero__bearing i::after{
  display:block;
  width:1px;
  height:11px;
  margin:2px auto;
  content:"";
  background:var(--accent);
}

.th-p-drones .drones-hero__coordinate{
  right:clamp(28px,4vw,56px);
  bottom:clamp(28px,4vw,56px);
  color:rgba(241,245,247,.84);
}

.th-p-drones .drones-hero__base{
  position:relative;
  z-index:2;
  display:grid;
  grid-template-columns:clamp(66px,9.6vw,138px) minmax(0,1fr) minmax(180px,23%,300px);
  gap:clamp(18px,3vw,48px);
  align-items:end;
  width:calc(100% - clamp(0px,9.6vw,144px));
  margin:-clamp(62px,8vw,116px) auto 0;
  padding:clamp(28px,4vw,60px) clamp(24px,4vw,64px) clamp(24px,3vw,42px);
  background:var(--panel);
  color:var(--on-panel);
  clip-path:polygon(0 0,calc(100% - 30px) 0,100% 30px,100% 100%,0 100%);
}

.th-p-drones .drones-hero__mast{
  display:grid;
  grid-template-columns:1fr;
  gap:7px;
  align-self:stretch;
  padding-right:clamp(12px,2vw,28px);
  border-right:1px solid color-mix(in srgb,var(--on-panel) 28%,transparent);
  color:var(--on-panel);
  font:700 10px/1 var(--body);
  letter-spacing:.2em;
  text-transform:uppercase;
}

.th-p-drones .drones-hero__mast span:nth-child(2){
  color:#92B6C3;
}

.th-p-drones .drones-hero__mast i{
  display:block;
  width:1px;
  height:100%;
  min-height:25px;
  margin-left:4px;
  background:var(--accent);
}

.th-p-drones .drones-hero__mast small{
  color:color-mix(in srgb,var(--on-panel) 55%,transparent);
  font:700 9px/1 var(--body);
  letter-spacing:.16em;
}

.th-p-drones .drones-hero__copy{
  display:grid;
  justify-items:start;
  gap:clamp(10px,1.2vw,16px);
  min-width:0;
}

.th-p-drones .drones-hero .eyebrow{
  color:#92B6C3;
  font:700 10px/1.3 var(--body);
  letter-spacing:.19em;
  text-transform:uppercase;
}

.th-p-drones .drones-hero h1{
  max-width:13ch;
  margin:0;
  color:var(--on-panel);
  font-family:var(--display);
  font-size:clamp(44px,6.9vw,100px);
  font-weight:700;
  letter-spacing:-.07em;
  line-height:.88;
  overflow-wrap:anywhere;
  text-wrap:balance;
}

.th-p-drones .drones-hero h1.long{
  max-width:17ch;
  font-size:clamp(34px,4.8vw,72px);
  line-height:.94;
}

.th-p-drones .drones-hero .sub{
  max-width:48ch;
  margin:0;
  color:color-mix(in srgb,var(--on-panel) 78%,transparent);
  font-size:clamp(14px,1.1vw,17px);
  line-height:1.55;
}

.th-p-drones .drones-hero .ctas{
  gap:10px;
  margin-top:4px;
}

.th-p-drones .drones-hero .btn{
  min-height:46px;
  padding-inline:21px;
  border:1px solid var(--accent);
  border-radius:999px;
  background:var(--accent);
  color:var(--onAccent);
  font-size:11px;
  letter-spacing:.08em;
  text-transform:uppercase;
}

.th-p-drones .drones-hero .btn.ghost{
  border-color:color-mix(in srgb,var(--on-panel) 45%,transparent);
  background:transparent;
  color:var(--on-panel);
}

.th-p-drones .drones-hero__note{
  align-self:end;
  max-width:23ch;
  margin:0 0 3px;
  padding-left:clamp(14px,2vw,28px);
  color:color-mix(in srgb,var(--on-panel) 74%,transparent);
  font:500 clamp(13px,1vw,15px)/1.45 var(--body);
  border-left:1px solid var(--accent);
}

.th-p-drones .drones-hero__routes{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  width:calc(100% - clamp(0px,9.6vw,144px));
  margin:0 auto;
  background:var(--surface);
  border:1px solid var(--line);
  border-top:0;
}

.th-p-drones .drones-hero__route{
  display:grid;
  grid-template-columns:auto minmax(0,1fr) auto;
  gap:12px;
  align-items:center;
  min-width:0;
  min-height:76px;
  padding:14px clamp(13px,2vw,24px);
  color:var(--ink);
  text-decoration:none;
  border-right:1px solid var(--line);
}

.th-p-drones .drones-hero__route:last-child{
  border-right:0;
}

.th-p-drones .drones-hero__route-number{
  color:var(--accent);
  font:700 10px/1 var(--body);
  letter-spacing:.12em;
}

.th-p-drones .drones-hero__route-label{
  display:grid;
  gap:4px;
  min-width:0;
}

.th-p-drones .drones-hero__route-label b{
  overflow-wrap:anywhere;
  font:700 clamp(13px,1.05vw,16px)/1.1 var(--display);
  letter-spacing:-.03em;
}

.th-p-drones .drones-hero__route-label small{
  color:var(--muted);
  font:600 10px/1.1 var(--body);
  letter-spacing:.04em;
}

.th-p-drones .drones-hero__route-arrow{
  color:var(--accent);
  font-size:18px;
}

.th-p-drones .drones-hero .motion-toggle{
  position:absolute;
  z-index:6;
  top:clamp(28px,4vw,56px);
  right:clamp(28px,4vw,56px);
  border:1px solid rgba(241,245,247,.55);
  border-radius:999px;
  background:rgba(16,32,54,.5);
  color:#F1F5F7;
  backdrop-filter:blur(8px);
  font:700 10px/1 var(--body);
  letter-spacing:.08em;
  text-transform:uppercase;
}

.th-p-drones .theme-discovery{
  width:min(100%,1440px);
  margin-inline:auto;
  padding:clamp(56px,8vw,116px) clamp(16px,4.2vw,70px) clamp(60px,8vw,128px);
}

.th-p-drones .drones-discovery__head{
  display:flex;
  align-items:end;
  justify-content:space-between;
  gap:26px;
  padding-bottom:clamp(20px,3vw,36px);
  border-bottom:1px solid var(--ink);
}

.th-p-drones .drones-discovery__eyebrow{
  margin:0 0 10px;
  color:var(--accent);
  font:700 10px/1.2 var(--body);
  letter-spacing:.2em;
  text-transform:uppercase;
}

.th-p-drones .drones-discovery h2{
  max-width:12ch;
  margin:0;
  font-family:var(--display);
  font-size:clamp(35px,5vw,70px);
  font-weight:700;
  letter-spacing:-.065em;
  line-height:.9;
  overflow-wrap:anywhere;
}

.th-p-drones .drones-discovery__all{
  display:inline-flex;
  flex:none;
  align-items:center;
  gap:12px;
  min-height:44px;
  color:var(--ink);
  font:700 11px/1.2 var(--body);
  letter-spacing:.1em;
  text-decoration:none;
  text-transform:uppercase;
}

.th-p-drones .drones-discovery__all span{
  color:var(--accent);
  font-size:19px;
}

.th-p-drones .drones-discovery__routes{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:clamp(12px,1.8vw,26px);
  padding-top:clamp(24px,3.7vw,54px);
}

.th-p-drones .drones-discovery__route{
  position:relative;
  display:grid;
  grid-template-rows:auto minmax(156px,1fr) auto;
  gap:clamp(12px,1.8vw,22px);
  min-width:0;
  min-height:390px;
  padding:clamp(16px,2vw,28px);
  overflow:hidden;
  color:var(--ink);
  text-decoration:none;
  background:var(--surface);
  border:1px solid var(--line);
  border-radius:0 0 28px 0;
}

.th-p-drones .drones-discovery__route::before{
  position:absolute;
  top:0;
  left:0;
  width:35%;
  height:4px;
  content:"";
  background:var(--accent);
}

.th-p-drones .drones-discovery__ordinal{
  color:var(--muted);
  font:700 10px/1 var(--body);
  letter-spacing:.18em;
}

.th-p-drones .drones-discovery__image{
  position:relative;
  display:block;
  min-height:0;
  overflow:hidden;
  background:linear-gradient(145deg,#C6D2D9,#EEF2F4);
  clip-path:polygon(0 0,100% 0,100% calc(100% - 20px),calc(100% - 20px) 100%,0 100%);
}

.th-p-drones .drones-discovery__image::after{
  position:absolute;
  inset:0;
  content:"";
  pointer-events:none;
  background:linear-gradient(0deg,rgba(16,32,54,.25),transparent 52%);
}

.th-p-drones .drones-discovery__image img{
  display:block;
  width:100%;
  height:100%;
  object-fit:cover;
}

.th-p-drones .drones-discovery__empty-image{
  display:block;
  width:100%;
  height:100%;
  background:
    radial-gradient(circle at 50% 50%,transparent 0 18%,rgba(16,32,54,.1) 18.3% 18.8%,transparent 19.1% 35%,rgba(16,32,54,.08) 35.3% 35.8%,transparent 36.1%),
    linear-gradient(140deg,#B7C7D0,#EEF2F4);
}

.th-p-drones .drones-discovery__meta{
  display:grid;
  gap:5px;
  padding-right:24px;
}

.th-p-drones .drones-discovery__meta b{
  font:700 clamp(19px,1.8vw,28px)/1 var(--display);
  letter-spacing:-.055em;
  overflow-wrap:anywhere;
}

.th-p-drones .drones-discovery__meta small{
  color:var(--muted);
  font:600 11px/1.2 var(--body);
}

.th-p-drones .drones-discovery__go{
  position:absolute;
  right:clamp(16px,2vw,28px);
  bottom:clamp(18px,2vw,28px);
  color:var(--accent);
  font-size:22px;
}

.th-p-drones .drones-discovery__products{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:clamp(16px,2.4vw,36px);
  padding-top:clamp(28px,3.8vw,54px);
}

.th-p-drones .drones-discovery__products .pc{
  min-width:0;
}

.th-p-drones #shop{
  position:relative;
  background:var(--surface);
  border-top:1px solid var(--line);
}

.th-p-drones #shop .sec-h{
  align-items:end;
  margin-bottom:clamp(24px,3.2vw,48px);
}

.th-p-drones #shop .sec-h h2{
  font-family:var(--display);
  font-size:clamp(34px,4.2vw,62px);
  font-weight:700;
  letter-spacing:-.06em;
  line-height:.9;
}

.th-p-drones #shop .chips{
  gap:8px;
}

.th-p-drones #shop .chip{
  min-height:44px;
  padding-inline:17px;
  border:1px solid var(--line);
  border-radius:999px;
  background:transparent;
  color:var(--ink);
  font:700 11px/1.2 var(--body);
  letter-spacing:.07em;
  text-transform:uppercase;
}

.th-p-drones #shop .chip[aria-current]{
  background:var(--panel);
  color:var(--on-panel);
  border-color:var(--panel);
}

.th-p-drones .grid{
  gap:clamp(28px,4vw,58px) clamp(16px,2.4vw,34px);
}

.th-p-drones .pc{
  gap:13px;
}

.th-p-drones .pc .im{
  overflow:hidden;
  background:#D8E0E4;
  border:1px solid var(--line);
  border-radius:0 0 18px 0;
}

.th-p-drones .pc .im img{
  transition:none;
}

.th-p-drones .pc:hover .im img{
  transform:none;
}

.th-p-drones .pc .bd{
  grid-template-columns:minmax(0,1fr) auto;
  column-gap:12px;
}

.th-p-drones .pc h3{
  font:700 16px/1.22 var(--display);
  letter-spacing:-.035em;
}

.th-p-drones .pc .pr{
  grid-column:2;
  grid-row:1;
  color:var(--ink);
  font:700 14px/1.2 var(--body);
  white-space:nowrap;
}

.th-p-drones .pc .ct{
  grid-column:1 / -1;
  color:var(--muted);
  font-size:12px;
}

.th-p-drones .pc .tag{
  border-radius:999px;
  background:var(--badge);
  color:var(--onBadge);
  font-size:10px;
  letter-spacing:.07em;
  text-transform:uppercase;
}

.th-p-drones .pc .go{
  border-radius:999px;
  background:var(--panel);
  color:var(--on-panel);
  transition:none;
}

.th-p-drones .ft{
  border-top:1px solid color-mix(in srgb,var(--on-foot) 22%,transparent);
}

@media (max-width:920px){
  .th-p-drones .drones-hero__base{
    grid-template-columns:82px minmax(0,1fr);
  }

  .th-p-drones .drones-hero__note{
    grid-column:2;
    max-width:44ch;
  }

  .th-p-drones .drones-discovery__route{
    min-height:340px;
  }
}

@media (max-width:700px){
  .th-p-drones .drones-hero{
    padding:14px 16px 52px;
  }

  .th-p-drones .drones-hero__media-stage{
    padding:0;
  }

  .th-p-drones .drones-hero__media{
    min-height:0;
    aspect-ratio:4/3;
    clip-path:polygon(0 0,100% 0,100% calc(100% - 18px),calc(100% - 18px) 100%,0 100%);
  }

  .th-p-drones .drones-hero__media > .hero-media{
    object-position:59% center;
  }

  .th-p-drones .drones-hero__bearing{
    top:23px;
    left:23px;
  }

  .th-p-drones .drones-hero__coordinate{
    right:23px;
    bottom:23px;
  }

  .th-p-drones .drones-hero__base{
    grid-template-columns:48px minmax(0,1fr);
    gap:17px;
    width:calc(100% - 18px);
    margin-top:-36px;
    padding:27px 22px 24px;
  }

  .th-p-drones .drones-hero h1{
    max-width:14ch;
    font-size:clamp(43px,12vw,66px);
  }

  .th-p-drones .drones-hero h1.long{
    font-size:clamp(32px,9.5vw,50px);
  }

  .th-p-drones .drones-hero__note{
    max-width:32ch;
    padding-left:15px;
  }

  .th-p-drones .drones-hero__routes{
    grid-template-columns:1fr;
    width:calc(100% - 18px);
  }

  .th-p-drones .drones-hero__route,
  .th-p-drones .drones-hero__route:last-child{
    min-height:64px;
    border-right:0;
    border-bottom:1px solid var(--line);
  }

  .th-p-drones .drones-hero__route:last-child{
    border-bottom:0;
  }

  .th-p-drones .drones-hero .motion-toggle{
    top:22px;
    right:22px;
  }

  .th-p-drones .theme-discovery{
    padding:58px 16px 74px;
  }

  .th-p-drones .drones-discovery__head{
    align-items:start;
    flex-direction:column;
    gap:13px;
  }

  .th-p-drones .drones-discovery__routes,
  .th-p-drones .drones-discovery__products{
    grid-template-columns:1fr;
  }

  .th-p-drones .drones-discovery__route{
    grid-template-columns:44px minmax(0,1fr) auto;
    grid-template-rows:minmax(150px,1fr) auto;
    min-height:250px;
  }

  .th-p-drones .drones-discovery__ordinal{
    grid-column:1;
    grid-row:1;
    padding-top:4px;
  }

  .th-p-drones .drones-discovery__image{
    grid-column:2 / -1;
    grid-row:1;
  }

  .th-p-drones .drones-discovery__meta{
    grid-column:1 / -1;
    grid-row:2;
    padding-right:30px;
  }

  .th-p-drones #shop .chips{
    overflow-x:auto;
    flex-wrap:nowrap;
    padding-bottom:2px;
  }

  .th-p-drones #shop .chip{
    flex:none;
  }
}

@media (max-width:420px){
  .th-p-drones .brand{
    font-size:16px;
    letter-spacing:.09em;
  }

  .th-p-drones .drones-hero__mast{
    font-size:9px;
  }

  .th-p-drones .drones-hero .ctas{
    width:100%;
  }

  .th-p-drones .drones-hero .btn{
    flex:1 1 100%;
    width:100%;
  }

  .th-p-drones .drones-hero__ring--two{
    display:none;
  }

  .th-p-drones .drones-discovery h2{
    font-size:clamp(34px,11vw,46px);
  }
}
`;

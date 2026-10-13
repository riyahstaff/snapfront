import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-computers',
  name: 'AURELION LAB',
  for: 'Computer workstations and displays',
  vibe: 'Architectural white space, graphite hardware, and exacting studio order',
  category: 'Computers and workstations',
  group: 'technology',
  display: 'Space Grotesk',
  body: 'Manrope',
  displayWeight: 700,
  tracking: '-.045em',
  colors: {
    bg: '#F4F6F5',
    surface: '#FFFFFF',
    ink: '#151C20',
    muted: '#68737A',
    line: '#D9E0E2',
    accent: '#1B7A8E',
    onAccent: '#FFFFFF',
    panel: '#E7ECEC',
    onPanel: '#151C20',
    foot: '#11181B',
    onFoot: '#E9EFEF',
    bar: '#151C20',
    onBar: '#F4F6F5',
    badge: '#CFE3E6',
    onBadge: '#102C34',
  },
  header: 'split',
  hero: 'editorial',
  card: 'clean',
  ratio: '4/3',
  rCard: 2,
  rBtn: 3,
  motion: 'pan',
  copy: {
    eyebrow: 'Systems for focused work',
    collection: 'Configuration studies',
    cta: 'Explore systems',
    title: 'Precision, made visible.',
    subtitle: 'Workstations, displays, and tools for a clearer desktop.',
  },
});

const countLabel = (ctx, count) => {
  const value = Number(count);
  if (!Number.isFinite(value)) return '';
  return `<small>${ctx.esc(value)} ${value === 1 ? 'item' : 'items'}</small>`;
};

const categoryRail = (ctx, cat, index) => {
  const name = ctx.esc(cat.name);
  const image = cat.image
    ? `<img src="${ctx.esc(cat.image)}" alt="" loading="lazy" decoding="async">`
    : '<span class="computers-hero__rail-empty" aria-hidden="true"></span>';

  return `<a class="computers-hero__rail-item" href="${ctx.categoryLink(cat.name)}">
    <span class="computers-hero__rail-index" aria-hidden="true">0${index + 1}</span>
    <span class="computers-hero__rail-thumb">${image}</span>
    <span class="computers-hero__rail-meta"><b>${name}</b>${countLabel(ctx, cat.count)}</span>
  </a>`;
};

const discoveryPath = (ctx, cat, index) => {
  const image = cat.image
    ? `<img src="${ctx.esc(cat.image)}" alt="" loading="lazy" decoding="async">`
    : '<span class="computers-discovery__image-empty" aria-hidden="true"></span>';
  const name = ctx.esc(cat.name);

  return `<a class="computers-discovery__path" href="${ctx.categoryLink(cat.name)}">
    <span class="computers-discovery__sequence" aria-hidden="true">0${index + 1}</span>
    <span class="computers-discovery__image">${image}</span>
    <span class="computers-discovery__label"><b>${name}</b>${countLabel(ctx, cat.count)}<i aria-hidden="true">↗</i></span>
  </a>`;
};

export function hero(ctx) {
  const rail = ctx.cats.slice(0, 3).map((cat, index) => categoryRail(ctx, cat, index)).join('');

  return `<section class="hero category-hero computers-hero${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="computers-hero__frame${rail ? ' has-rail' : ''}">
      <aside class="computers-hero__rail" aria-label="Shop by category">${rail}</aside>
      <div class="computers-hero__core">
        ${ctx.copy('computers-hero__copy')}
        <div class="computers-hero__visual">
          <span class="computers-hero__corner computers-hero__corner--one" aria-hidden="true"></span>
          <span class="computers-hero__corner computers-hero__corner--two" aria-hidden="true"></span>
          ${ctx.media(0, { priority: true, lazy: false })}
        </div>
      </div>
      <aside class="computers-hero__measure" aria-hidden="true">
        <span></span><span></span><span></span><span></span>
      </aside>
    </div>
    ${ctx.controls}
  </section>`;
}

export function discovery(ctx) {
  if (ctx.cats.length >= 2) {
    const paths = ctx.cats.slice(0, 3).map((cat, index) => discoveryPath(ctx, cat, index)).join('');
    return `<section class="theme-discovery computers-discovery" aria-labelledby="computers-discovery-title">
      <div class="computers-discovery__head">
        <div>
          <p class="computers-discovery__eyebrow">Start with the work</p>
          <h2 id="computers-discovery-title">Choose a system path.</h2>
        </div>
        <a class="computers-discovery__all" href="#shop">View all products <span aria-hidden="true">→</span></a>
      </div>
      <div class="computers-discovery__paths">${paths}</div>
    </section>`;
  }

  if (!ctx.products.length) return '';

  return `<section class="theme-discovery computers-discovery computers-discovery--products" aria-labelledby="computers-discovery-title">
    <div class="computers-discovery__head">
      <div>
        <p class="computers-discovery__eyebrow">Available now</p>
        <h2 id="computers-discovery-title">A focused current edit.</h2>
      </div>
      <a class="computers-discovery__all" href="#shop">View all products <span aria-hidden="true">→</span></a>
    </div>
    <div class="computers-discovery__products">${ctx.products.slice(0, 3).map((product) => ctx.productCard(product)).join('')}</div>
  </section>`;
}

export const css = `
.th-p-computers{
  background:var(--bg);
  color:var(--ink);
}

.th-p-computers .hd{
  background:color-mix(in srgb,var(--bg) 91%,transparent);
  border-bottom:1px solid color-mix(in srgb,var(--ink) 11%,transparent);
  box-shadow:none;
}

.th-p-computers .brand{
  font-family:var(--body);
  font-size:clamp(16px,1.35vw,20px);
  font-weight:800;
  letter-spacing:.19em;
}

.th-p-computers .nav{
  gap:clamp(16px,2.4vw,34px);
  font-size:13px;
  letter-spacing:.025em;
}

.th-p-computers .nav a{
  background-image:linear-gradient(var(--accent),var(--accent));
  transition:none;
}

.th-p-computers .cart{
  border-radius:3px;
}

.th-p-computers :is(.btn,.buy):hover{
  transform:none;
}

.th-p-computers .computers-hero{
  position:relative;
  overflow:hidden;
  isolation:isolate;
  background:
    linear-gradient(90deg,transparent 0 calc(100% - 1px),color-mix(in srgb,var(--ink) 10%,transparent) calc(100% - 1px)),
    var(--bg);
  padding:clamp(18px,2.6vw,42px) clamp(14px,3vw,48px) clamp(26px,3.8vw,56px);
}

.th-p-computers .computers-hero::before{
  position:absolute;
  inset:0;
  z-index:-1;
  background:linear-gradient(90deg,transparent 0 8%,color-mix(in srgb,var(--ink) 3%,transparent) 8% calc(8% + 1px),transparent calc(8% + 1px) 92%,color-mix(in srgb,var(--ink) 3%,transparent) 92% calc(92% + 1px),transparent calc(92% + 1px));
  content:"";
  pointer-events:none;
}

.th-p-computers .computers-hero__frame{
  display:grid;
  grid-template-columns:minmax(0,1fr) 30px;
  gap:clamp(14px,2.4vw,36px);
  width:min(100%,1510px);
  margin-inline:auto;
}

.th-p-computers .computers-hero__frame.has-rail{
  grid-template-columns:minmax(150px,188px) minmax(0,1fr) 30px;
}

.th-p-computers .computers-hero__rail{
  display:grid;
  align-content:end;
  gap:clamp(8px,1vw,14px);
  min-width:0;
  padding-bottom:clamp(8px,1vw,14px);
}

.th-p-computers .computers-hero__rail:empty{
  display:none;
}

.th-p-computers .computers-hero__rail-item{
  position:relative;
  display:grid;
  grid-template-columns:46px minmax(0,1fr);
  gap:8px 10px;
  min-height:78px;
  padding:0 0 10px;
  color:inherit;
  text-decoration:none;
  border-bottom:1px solid var(--line);
}

.th-p-computers .computers-hero__rail-index{
  grid-row:span 2;
  align-self:start;
  color:var(--muted);
  font:700 10px/1 var(--body);
  letter-spacing:.16em;
  padding-top:4px;
}

.th-p-computers .computers-hero__rail-thumb{
  grid-column:2;
  position:relative;
  display:block;
  height:42px;
  overflow:hidden;
  background:linear-gradient(135deg,#D9E0E1,#F8FAFA);
}

.th-p-computers .computers-hero__rail-thumb::after{
  position:absolute;
  inset:0;
  background:linear-gradient(90deg,transparent 60%,rgba(244,246,245,.72));
  content:"";
  pointer-events:none;
}

.th-p-computers .computers-hero__rail-thumb img{
  width:100%;
  height:100%;
  object-fit:cover;
}

.th-p-computers .computers-hero__rail-empty{
  display:block;
  width:100%;
  height:100%;
  background:repeating-linear-gradient(135deg,transparent 0 7px,rgba(21,28,32,.08) 7px 8px);
}

.th-p-computers .computers-hero__rail-meta{
  grid-column:2;
  display:flex;
  align-items:baseline;
  justify-content:space-between;
  gap:8px;
  min-width:0;
}

.th-p-computers .computers-hero__rail-meta b{
  overflow:hidden;
  font:700 11px/1.15 var(--body);
  letter-spacing:.035em;
  text-overflow:ellipsis;
  white-space:nowrap;
}

.th-p-computers .computers-hero__rail-meta small{
  flex:none;
  color:var(--muted);
  font:600 10px/1.15 var(--body);
}

.th-p-computers .computers-hero__core{
  display:grid;
  grid-template-rows:auto minmax(0,1fr);
  min-width:0;
}

.th-p-computers .computers-hero__copy{
  justify-items:center;
  max-width:920px;
  margin:clamp(10px,1.3vw,20px) auto clamp(18px,2.7vw,40px);
  text-align:center;
}

.th-p-computers .computers-hero .txt{
  gap:clamp(10px,1.35vw,18px);
}

.th-p-computers .computers-hero .eyebrow{
  color:var(--accent);
  font-size:10px;
  font-weight:800;
  letter-spacing:.2em;
}

.th-p-computers .computers-hero h1{
  max-width:16ch;
  font-size:clamp(42px,5.25vw,88px);
  font-weight:500;
  letter-spacing:-.065em;
  line-height:.98;
}

.th-p-computers .computers-hero h1.long{
  max-width:18ch;
  font-size:clamp(34px,4.25vw,68px);
  line-height:1.02;
}

.th-p-computers .computers-hero .sub{
  max-width:59ch;
  color:var(--muted);
  font-size:clamp(14px,1.1vw,17px);
  line-height:1.55;
}

.th-p-computers .computers-hero .ctas{
  justify-content:center;
  margin-top:2px;
}

.th-p-computers .computers-hero .btn{
  min-height:46px;
  padding-inline:23px;
  border-radius:3px;
  background:var(--ink);
  color:var(--bg);
  font-size:12px;
  letter-spacing:.08em;
  text-transform:uppercase;
}

.th-p-computers .computers-hero .btn.ghost{
  background:transparent;
  color:var(--ink);
  border-color:color-mix(in srgb,var(--ink) 48%,transparent);
}

.th-p-computers .computers-hero__visual{
  position:relative;
  min-height:280px;
  overflow:hidden;
  background:var(--surface);
  border:1px solid color-mix(in srgb,var(--ink) 14%,transparent);
  box-shadow:0 25px 58px -48px rgba(16,29,34,.55);
  aspect-ratio:16/9;
}

.th-p-computers .computers-hero__visual > .hero-media,
.th-p-computers .computers-hero__visual > .theme-empty-media{
  position:absolute;
  inset:0;
  width:100%;
  height:100%;
}

.th-p-computers .computers-hero__visual > .hero-media{
  object-fit:cover;
  object-position:center;
}

.th-p-computers .computers-hero__visual > .theme-empty-media{
  min-height:0;
  background:
    linear-gradient(135deg,transparent 0 49.6%,var(--line) 49.7% 50.3%,transparent 50.4%),
    linear-gradient(45deg,transparent 0 49.6%,var(--line) 49.7% 50.3%,transparent 50.4%),
    var(--surface);
}

.th-p-computers .computers-hero__corner{
  position:absolute;
  z-index:2;
  width:28px;
  height:28px;
  pointer-events:none;
}

.th-p-computers .computers-hero__corner--one{
  top:14px;
  left:14px;
  border-top:1px solid rgba(255,255,255,.88);
  border-left:1px solid rgba(255,255,255,.88);
}

.th-p-computers .computers-hero__corner--two{
  right:14px;
  bottom:14px;
  border-right:1px solid rgba(255,255,255,.88);
  border-bottom:1px solid rgba(255,255,255,.88);
}

.th-p-computers .computers-hero__measure{
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:space-between;
  padding-block:clamp(4px,3vw,42px);
}

.th-p-computers .computers-hero__measure span{
  display:block;
  width:1px;
  height:clamp(28px,6vw,76px);
  background:var(--line);
}

.th-p-computers .computers-hero .motion-toggle{
  right:clamp(22px,4.7vw,72px);
  bottom:clamp(36px,5.3vw,78px);
  border-color:var(--line);
  border-radius:3px;
  background:color-mix(in srgb,var(--bg) 88%,transparent);
  color:var(--ink);
  font-size:11px;
}

.th-p-computers .theme-discovery{
  width:min(100%,1510px);
  margin-inline:auto;
  padding:clamp(46px,6.5vw,102px) clamp(16px,4vw,48px) clamp(58px,7.4vw,118px);
}

.th-p-computers .computers-discovery__head{
  display:flex;
  align-items:end;
  justify-content:space-between;
  gap:24px;
  padding-bottom:clamp(20px,2.6vw,38px);
  border-bottom:1px solid var(--ink);
}

.th-p-computers .computers-discovery__eyebrow{
  margin-bottom:9px;
  color:var(--accent);
  font:800 10px/1.2 var(--body);
  letter-spacing:.18em;
  text-transform:uppercase;
}

.th-p-computers .computers-discovery h2{
  max-width:14ch;
  font-size:clamp(31px,4.15vw,64px);
  font-weight:500;
  letter-spacing:-.055em;
  line-height:.98;
}

.th-p-computers .computers-discovery__all{
  display:inline-flex;
  flex:none;
  align-items:center;
  gap:14px;
  min-height:44px;
  color:var(--ink);
  font:700 12px/1.2 var(--body);
  letter-spacing:.085em;
  text-decoration:none;
  text-transform:uppercase;
}

.th-p-computers .computers-discovery__all span{
  color:var(--accent);
  font-size:18px;
}

.th-p-computers .computers-discovery__paths{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  border-left:1px solid var(--line);
}

.th-p-computers .computers-discovery__path{
  position:relative;
  display:grid;
  grid-template-rows:auto 1fr auto;
  min-width:0;
  min-height:360px;
  padding:clamp(16px,2vw,30px);
  color:inherit;
  text-decoration:none;
  border-right:1px solid var(--line);
  border-bottom:1px solid var(--line);
}

.th-p-computers .computers-discovery__sequence{
  position:relative;
  z-index:1;
  color:var(--accent);
  font:800 10px/1 var(--body);
  letter-spacing:.18em;
}

.th-p-computers .computers-discovery__image{
  position:relative;
  align-self:center;
  justify-self:center;
  width:100%;
  max-width:340px;
  overflow:hidden;
  background:linear-gradient(145deg,#E4EBEC,#FAFBFB);
  aspect-ratio:1.25/1;
}

.th-p-computers .computers-discovery__image img{
  width:100%;
  height:100%;
  object-fit:cover;
}

.th-p-computers .computers-discovery__image-empty{
  display:block;
  width:100%;
  height:100%;
  background:
    linear-gradient(90deg,transparent 0 49.6%,rgba(21,28,32,.09) 49.7% 50.3%,transparent 50.4%),
    linear-gradient(transparent 0 49.6%,rgba(21,28,32,.09) 49.7% 50.3%,transparent 50.4%);
}

.th-p-computers .computers-discovery__label{
  position:relative;
  display:grid;
  grid-template-columns:minmax(0,1fr) auto;
  gap:4px 12px;
  align-items:end;
  min-height:56px;
  padding-top:16px;
  border-top:1px solid var(--line);
}

.th-p-computers .computers-discovery__label b{
  min-width:0;
  font:700 clamp(16px,1.4vw,21px)/1.15 var(--display);
  letter-spacing:-.04em;
  overflow-wrap:anywhere;
}

.th-p-computers .computers-discovery__label small{
  grid-column:1;
  color:var(--muted);
  font:600 11px/1.2 var(--body);
}

.th-p-computers .computers-discovery__label i{
  grid-column:2;
  grid-row:1 / span 2;
  align-self:center;
  color:var(--accent);
  font-size:20px;
  font-style:normal;
}

.th-p-computers .computers-discovery__products{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:clamp(18px,2.3vw,32px);
  padding-top:clamp(26px,3.4vw,48px);
}

.th-p-computers .computers-discovery__products .pc{
  min-width:0;
}

.th-p-computers #shop{
  position:relative;
  border-top:1px solid var(--line);
  background:var(--surface);
}

.th-p-computers #shop .sec-h{
  margin-bottom:clamp(26px,3vw,44px);
}

.th-p-computers #shop .sec-h h2{
  font-size:clamp(31px,3.4vw,54px);
  font-weight:500;
  letter-spacing:-.05em;
}

.th-p-computers #shop .chips{
  gap:0;
  border-block:1px solid var(--line);
}

.th-p-computers #shop .chip{
  min-height:44px;
  padding:12px 16px;
  border:0;
  border-right:1px solid var(--line);
  border-radius:0;
  font-size:12px;
  letter-spacing:.055em;
  text-transform:uppercase;
}

.th-p-computers #shop .chip[aria-current]{
  background:var(--ink);
  color:var(--bg);
}

.th-p-computers .grid{
  gap:clamp(34px,4vw,68px) clamp(14px,2.2vw,34px);
}

.th-p-computers .pc{
  gap:12px;
}

.th-p-computers .pc .im{
  background:linear-gradient(135deg,#E9EEEF,#F9FAFA);
  border:1px solid var(--line);
  border-radius:0;
}

.th-p-computers .pc .im img{
  transition:none;
}

.th-p-computers .pc:hover .im img{
  transform:none;
}

.th-p-computers .pc .bd{
  grid-template-columns:minmax(0,1fr) auto;
  column-gap:14px;
  padding-right:2px;
}

.th-p-computers .pc h3{
  font:700 15px/1.28 var(--body);
  letter-spacing:-.015em;
}

.th-p-computers .pc .pr{
  grid-column:2;
  grid-row:1;
  font:700 14px/1.3 var(--body);
  color:var(--ink);
  white-space:nowrap;
}

.th-p-computers .pc .ct{
  grid-column:1 / -1;
  font-size:12px;
}

.th-p-computers .pc .tag{
  border-radius:0;
  font-size:10px;
  letter-spacing:.08em;
  text-transform:uppercase;
}

.th-p-computers .pc .go{
  border-radius:2px;
  transition:none;
}

.th-p-computers .ft{
  border-top:1px solid color-mix(in srgb,var(--on-foot) 20%,transparent);
}

@media (max-width:1000px){
  .th-p-computers .computers-hero__frame.has-rail{
    grid-template-columns:142px minmax(0,1fr) 18px;
    gap:18px;
  }

  .th-p-computers .computers-hero__rail-item{
    grid-template-columns:34px minmax(0,1fr);
  }

  .th-p-computers .computers-discovery__path{
    min-height:310px;
  }
}

@media (max-width:760px){
  .th-p-computers .brand{
    font-size:15px;
    letter-spacing:.13em;
  }

  .th-p-computers .computers-hero{
    padding:16px 16px 30px;
  }

  .th-p-computers .computers-hero__frame,
  .th-p-computers .computers-hero__frame.has-rail{
    grid-template-columns:minmax(0,1fr);
    gap:18px;
  }

  .th-p-computers .computers-hero__rail{
    grid-template-columns:repeat(3,minmax(0,1fr));
    order:2;
    gap:8px;
    padding:0;
  }

  .th-p-computers .computers-hero__rail-item{
    grid-template-columns:1fr;
    grid-template-rows:auto auto;
    min-height:94px;
    padding:0 0 8px;
  }

  .th-p-computers .computers-hero__rail-index{
    display:none;
  }

  .th-p-computers .computers-hero__rail-thumb,
  .th-p-computers .computers-hero__rail-meta{
    grid-column:1;
  }

  .th-p-computers .computers-hero__rail-thumb{
    height:50px;
  }

  .th-p-computers .computers-hero__rail-meta{
    align-items:start;
    flex-direction:column;
    gap:3px;
  }

  .th-p-computers .computers-hero__rail-meta b{
    max-width:100%;
  }

  .th-p-computers .computers-hero__measure{
    display:none;
  }

  .th-p-computers .computers-hero__copy{
    margin:6px auto 16px;
  }

  .th-p-computers .computers-hero h1{
    font-size:clamp(42px,11vw,62px);
  }

  .th-p-computers .computers-hero h1.long{
    font-size:clamp(31px,8.6vw,49px);
  }

  .th-p-computers .computers-hero__visual{
    min-height:0;
    aspect-ratio:4/3;
  }

  .th-p-computers .computers-hero__visual > .hero-media{
    object-position:54% center;
  }

  .th-p-computers .computers-hero .motion-toggle{
    right:26px;
    bottom:calc(30px + 112px);
  }

  .th-p-computers .computers-discovery__head{
    align-items:start;
    flex-direction:column;
    gap:14px;
  }

  .th-p-computers .computers-discovery__paths,
  .th-p-computers .computers-discovery__products{
    grid-template-columns:1fr;
  }

  .th-p-computers .computers-discovery__path{
    min-height:264px;
    grid-template-columns:48px minmax(0,1fr);
    grid-template-rows:1fr auto;
    gap:0 14px;
  }

  .th-p-computers .computers-discovery__sequence{
    grid-column:1;
    grid-row:1;
  }

  .th-p-computers .computers-discovery__image{
    grid-column:2;
    grid-row:1;
    align-self:stretch;
    max-width:none;
  }

  .th-p-computers .computers-discovery__label{
    grid-column:1 / -1;
    grid-row:2;
  }

  .th-p-computers .computers-discovery__products{
    gap:32px;
  }

  .th-p-computers #shop .chips{
    overflow-x:auto;
    flex-wrap:nowrap;
  }

  .th-p-computers #shop .chip{
    flex:none;
  }
}

@media (max-width:420px){
  .th-p-computers .computers-hero .ctas{
    width:100%;
  }

  .th-p-computers .computers-hero .btn{
    flex:1 1 100%;
    width:100%;
  }

  .th-p-computers .computers-hero__rail-meta small{
    display:none;
  }

.th-p-computers .computers-discovery{
    padding-inline:16px;
  }
}
`;

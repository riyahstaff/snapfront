import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-camera-equipment',
  name: 'FOCAL / FIELD',
  for: 'Cameras, lenses, and image-making equipment',
  vibe: 'A nocturnal field notebook for image-makers, framed by viewfinder marks and silver-blue exposure',
  category: 'Camera equipment',
  group: 'technology',
  display: 'DM Serif Display',
  body: 'Space Grotesk',
  displayWeight: 400,
  tracking: '-.035em',
  colors: {
    bg: '#E9E7E1',
    surface: '#F6F4EF',
    ink: '#17202A',
    muted: '#64717C',
    line: '#C8CAC5',
    accent: '#C84F3D',
    onAccent: '#FFFFFF',
    panel: '#182A3B',
    onPanel: '#E9EDF1',
    foot: '#101922',
    onFoot: '#E4E7E3',
    bar: '#17202A',
    onBar: '#F6F4EF',
    badge: '#D7E0E4',
    onBadge: '#17202A',
  },
  header: 'stack',
  hero: 'spotlight',
  card: 'boxed',
  ratio: '4/3',
  rCard: 0,
  rBtn: 0,
  motion: 'pan',
  copy: {
    eyebrow: 'Equipment for the looking',
    collection: 'The field edit',
    cta: 'View the edit',
    title: 'Build a frame worth following.',
    subtitle: 'Cameras, glass, and practical tools for paying closer attention.',
  },
});

const countLabel = (ctx, count) => {
  const number = Number(count);
  if (!Number.isFinite(number)) return '';
  return `<small>${ctx.esc(number)} ${number === 1 ? 'item' : 'items'}</small>`;
};

const categoryFrame = (ctx, cat, index) => {
  const image = cat.image
    ? `<img src="${ctx.esc(cat.image)}" alt="" loading="lazy" decoding="async">`
    : '<span class="camera-field__category-empty" aria-hidden="true"></span>';

  return `<a class="camera-field__category" href="${ctx.categoryLink(cat.name)}">
    <span class="camera-field__category-number" aria-hidden="true">0${index + 1}</span>
    <span class="camera-field__category-image">${image}</span>
    <span class="camera-field__category-meta"><b>${ctx.esc(cat.name)}</b>${countLabel(ctx, cat.count)}<i aria-hidden="true">↗</i></span>
  </a>`;
};

export function hero(ctx) {
  const categoryCount = ctx.cats.length;
  const measure = categoryCount ? `${String(categoryCount).padStart(2, '0')} routes` : 'live edit';

  return `<section class="hero category-hero camera-field${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="camera-field__frame">
      <div class="camera-field__eyeline" aria-hidden="true"><span>FOCAL FIELD</span><span>01—${measure}</span></div>
      <div class="camera-field__viewfinder">
        <div class="camera-field__media">
          ${ctx.media(0, { priority: true, lazy: false })}
          <span class="camera-field__mark camera-field__mark--tl" aria-hidden="true"></span>
          <span class="camera-field__mark camera-field__mark--tr" aria-hidden="true"></span>
          <span class="camera-field__mark camera-field__mark--bl" aria-hidden="true"></span>
          <span class="camera-field__mark camera-field__mark--br" aria-hidden="true"></span>
          <span class="camera-field__horizon" aria-hidden="true"></span>
          <span class="camera-field__focus" aria-hidden="true"></span>
        </div>
        <div class="camera-field__caption">
          ${ctx.copy('camera-field__copy')}
        </div>
        <p class="camera-field__exposure" aria-hidden="true">AVAILABLE LIGHT · OPEN FRAME</p>
      </div>
      <div class="camera-field__baseline" aria-hidden="true"><span>SHOP THE CURRENT EQUIPMENT EDIT</span><i></i><span>SCROLL TO SELECT</span></div>
    </div>
    ${ctx.controls}
  </section>`;
}

export function discovery(ctx) {
  if (ctx.cats.length >= 2) {
    const categories = ctx.cats.slice(0, 4).map((cat, index) => categoryFrame(ctx, cat, index)).join('');
    return `<section class="theme-discovery camera-index" aria-labelledby="camera-index-title">
      <div class="camera-index__intro">
        <p class="camera-index__kicker">Choose your angle</p>
        <h2 id="camera-index-title">Start with what belongs in the frame.</h2>
        <a class="camera-index__all" href="#shop">See all equipment <span aria-hidden="true">↓</span></a>
      </div>
      <div class="camera-index__catalogue">${categories}</div>
    </section>`;
  }

  if (!ctx.products.length) return '';

  return `<section class="theme-discovery camera-index camera-index--products" aria-labelledby="camera-index-title">
    <div class="camera-index__intro">
      <p class="camera-index__kicker">Current edit</p>
      <h2 id="camera-index-title">A few considered places to begin.</h2>
      <a class="camera-index__all" href="#shop">See all equipment <span aria-hidden="true">↓</span></a>
    </div>
    <div class="camera-index__products">${ctx.products.slice(0, 3).map((product) => ctx.productCard(product)).join('')}</div>
  </section>`;
}

export const css = `
.th-p-camera-equipment{
  background:var(--bg);
  color:var(--ink);
}

.th-p-camera-equipment .hd{
  background:color-mix(in srgb,var(--bg) 93%,transparent);
  border-bottom:1px solid color-mix(in srgb,var(--ink) 17%,transparent);
  box-shadow:none;
}

.th-p-camera-equipment .brand{
  color:var(--ink);
  font-family:var(--body);
  font-size:clamp(14px,1.2vw,18px);
  font-weight:700;
  letter-spacing:.22em;
}

.th-p-camera-equipment .nav{
  gap:clamp(14px,2.1vw,30px);
  font:500 11px/1.2 var(--body);
  letter-spacing:.1em;
  text-transform:uppercase;
}

.th-p-camera-equipment .nav a{
  background-image:linear-gradient(var(--accent),var(--accent));
}

.th-p-camera-equipment .cart{
  min-width:44px;
  border-radius:0;
}

.th-p-camera-equipment .camera-field{
  position:relative;
  overflow:hidden;
  padding:clamp(14px,2.3vw,34px) clamp(14px,3vw,50px) clamp(28px,4.5vw,72px);
  background:
    linear-gradient(90deg,transparent 0 7.5%,color-mix(in srgb,var(--ink) 6%,transparent) 7.5% calc(7.5% + 1px),transparent calc(7.5% + 1px) 92.5%,color-mix(in srgb,var(--ink) 6%,transparent) 92.5% calc(92.5% + 1px),transparent calc(92.5% + 1px)),
    var(--bg);
}

.th-p-camera-equipment .camera-field__frame{
  width:min(100%,1480px);
  margin-inline:auto;
}

.th-p-camera-equipment .camera-field__eyeline,
.th-p-camera-equipment .camera-field__baseline{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:16px;
  color:var(--muted);
  font:600 9px/1.2 var(--body);
  letter-spacing:.17em;
  text-transform:uppercase;
}

.th-p-camera-equipment .camera-field__eyeline{
  min-height:32px;
  padding:0 2px 10px;
}

.th-p-camera-equipment .camera-field__viewfinder{
  position:relative;
  min-height:clamp(500px,51vw,750px);
  overflow:hidden;
  background:var(--panel);
  isolation:isolate;
}

.th-p-camera-equipment .camera-field__media{
  position:absolute;
  inset:0;
  overflow:hidden;
  background:
    radial-gradient(circle at 76% 58%,#607890 0 1%,transparent 1.2%),
    linear-gradient(114deg,#101923 0%,#283949 53%,#8797a1 100%);
}

.th-p-camera-equipment .camera-field__media > .hero-media,
.th-p-camera-equipment .camera-field__media > .theme-empty-media{
  width:100%;
  height:100%;
}

.th-p-camera-equipment .camera-field__media > .hero-media{
  display:block;
  object-fit:cover;
  object-position:center;
  filter:saturate(.76) contrast(1.04) brightness(.82);
}

.th-p-camera-equipment .camera-field__media > .theme-empty-media{
  min-height:0;
  background:
    linear-gradient(90deg,rgba(6,14,21,.86) 0%,rgba(14,26,37,.6) 43%,rgba(16,31,42,.15) 100%),
    linear-gradient(132deg,#172c3d,#718595);
  color:#edf1f1;
}

.th-p-camera-equipment .camera-field__media::after{
  position:absolute;
  inset:0;
  background:
    linear-gradient(90deg,rgba(8,15,22,.76) 0%,rgba(8,15,22,.47) 31%,rgba(8,15,22,.08) 62%,rgba(8,15,22,.14) 100%),
    linear-gradient(0deg,rgba(8,15,22,.44),transparent 35%,rgba(8,15,22,.17));
  content:"";
  pointer-events:none;
}

.th-p-camera-equipment .camera-field__mark{
  position:absolute;
  z-index:2;
  width:clamp(24px,3vw,45px);
  height:clamp(24px,3vw,45px);
  border-color:rgba(241,243,240,.7);
  border-style:solid;
  border-width:0;
  pointer-events:none;
}

.th-p-camera-equipment .camera-field__mark--tl{top:clamp(17px,2vw,30px);left:clamp(17px,2vw,30px);border-top-width:1px;border-left-width:1px;}
.th-p-camera-equipment .camera-field__mark--tr{top:clamp(17px,2vw,30px);right:clamp(17px,2vw,30px);border-top-width:1px;border-right-width:1px;}
.th-p-camera-equipment .camera-field__mark--bl{bottom:clamp(17px,2vw,30px);left:clamp(17px,2vw,30px);border-bottom-width:1px;border-left-width:1px;}
.th-p-camera-equipment .camera-field__mark--br{right:clamp(17px,2vw,30px);bottom:clamp(17px,2vw,30px);border-right-width:1px;border-bottom-width:1px;}

.th-p-camera-equipment .camera-field__horizon{
  position:absolute;
  z-index:2;
  top:49%;
  right:0;
  left:0;
  height:1px;
  background:linear-gradient(90deg,transparent 0 12%,rgba(241,243,240,.36) 12% 88%,transparent 88%);
  pointer-events:none;
}

.th-p-camera-equipment .camera-field__focus{
  position:absolute;
  z-index:2;
  top:49%;
  left:63%;
  width:clamp(42px,5vw,72px);
  aspect-ratio:1;
  border:1px solid rgba(241,243,240,.72);
  transform:translate(-50%,-50%);
  pointer-events:none;
}

.th-p-camera-equipment .camera-field__focus::before,
.th-p-camera-equipment .camera-field__focus::after{
  position:absolute;
  top:50%;
  left:50%;
  background:rgba(241,243,240,.72);
  content:"";
  transform:translate(-50%,-50%);
}

.th-p-camera-equipment .camera-field__focus::before{width:calc(100% + 14px);height:1px;}
.th-p-camera-equipment .camera-field__focus::after{width:1px;height:calc(100% + 14px);}

.th-p-camera-equipment .camera-field__caption{
  position:absolute;
  z-index:3;
  bottom:clamp(30px,4.2vw,64px);
  left:clamp(30px,5.5vw,84px);
  width:min(610px,calc(100% - 90px));
  padding:clamp(22px,2.8vw,42px) clamp(21px,3.5vw,52px) clamp(23px,3vw,43px);
  border-left:1px solid rgba(245,246,242,.8);
  background:linear-gradient(90deg,rgba(12,21,30,.84),rgba(12,21,30,.58));
  color:#f4f4ef;
  backdrop-filter:blur(4px);
}

.th-p-camera-equipment .camera-field__copy{
  align-items:flex-start;
  gap:clamp(11px,1.45vw,19px);
  text-align:left;
}

.th-p-camera-equipment .camera-field .eyebrow{
  color:#d9c7ab;
  font:600 10px/1.2 var(--body);
  letter-spacing:.18em;
}

.th-p-camera-equipment .camera-field h1{
  max-width:12ch;
  font-family:var(--display);
  font-size:clamp(47px,5.75vw,93px);
  font-weight:400;
  letter-spacing:var(--dt);
  line-height:.91;
}

.th-p-camera-equipment .camera-field h1.long{
  max-width:15ch;
  font-size:clamp(39px,4.55vw,71px);
  line-height:.97;
}

.th-p-camera-equipment .camera-field .sub{
  max-width:47ch;
  color:#e1e4e1;
  font:400 clamp(13px,1.1vw,16px)/1.55 var(--body);
}

.th-p-camera-equipment .camera-field .ctas{gap:10px;margin-top:3px;}

.th-p-camera-equipment .camera-field .btn{
  min-height:46px;
  padding:0 19px;
  border-color:#e7e8e3;
  border-radius:0;
  background:#e7e8e3;
  color:#17202a;
  font:600 11px/1.2 var(--body);
  letter-spacing:.09em;
  text-transform:uppercase;
}

.th-p-camera-equipment .camera-field .btn.ghost{
  background:transparent;
  color:#f3f4f0;
  border-color:rgba(243,244,240,.66);
}

.th-p-camera-equipment .camera-field__exposure{
  position:absolute;
  z-index:3;
  right:clamp(31px,4vw,62px);
  bottom:clamp(32px,4.2vw,64px);
  margin:0;
  color:rgba(241,243,240,.79);
  font:600 9px/1.2 var(--body);
  letter-spacing:.16em;
  text-align:right;
  text-transform:uppercase;
  writing-mode:vertical-rl;
}

.th-p-camera-equipment .camera-field__baseline{
  min-height:47px;
  padding:15px 2px 0;
}

.th-p-camera-equipment .camera-field__baseline i{
  flex:1;
  height:1px;
  background:var(--line);
}

.th-p-camera-equipment .camera-field .motion-toggle{
  right:clamp(28px,5.6vw,84px);
  bottom:clamp(46px,6.2vw,94px);
  border:1px solid rgba(241,243,240,.48);
  border-radius:0;
  background:rgba(12,21,30,.78);
  color:#f4f4ef;
  font:600 10px/1.2 var(--body);
  letter-spacing:.08em;
  text-transform:uppercase;
}

.th-p-camera-equipment .camera-field.has-hero-motion[data-hero-motion="pan"] .camera-field__media > .hero-media{
  animation:camera-equipment-pan 18s ease-in-out infinite alternate;
}

.th-p-camera-equipment .camera-field.has-hero-motion[data-hero-motion="drift"] .camera-field__media > .hero-media{
  animation:camera-equipment-drift 13s ease-in-out infinite alternate;
}

.th-p-camera-equipment .camera-index{
  width:min(100%,1480px);
  margin-inline:auto;
  padding:clamp(62px,8vw,126px) clamp(16px,4vw,50px) clamp(68px,9vw,140px);
}

.th-p-camera-equipment .camera-index__intro{
  display:grid;
  grid-template-columns:minmax(0,1fr) minmax(190px,1.1fr) auto;
  gap:20px;
  align-items:end;
  padding-bottom:clamp(21px,3vw,42px);
  border-bottom:1px solid var(--ink);
}

.th-p-camera-equipment .camera-index__kicker{
  align-self:start;
  margin:5px 0 0;
  color:var(--accent);
  font:700 10px/1.2 var(--body);
  letter-spacing:.18em;
  text-transform:uppercase;
}

.th-p-camera-equipment .camera-index h2{
  max-width:13ch;
  margin:0;
  font-family:var(--display);
  font-size:clamp(35px,4.25vw,67px);
  font-weight:400;
  letter-spacing:var(--dt);
  line-height:.95;
}

.th-p-camera-equipment .camera-index__all{
  display:inline-flex;
  align-items:center;
  justify-content:flex-end;
  gap:11px;
  min-height:44px;
  color:var(--ink);
  font:700 11px/1.2 var(--body);
  letter-spacing:.1em;
  text-decoration:none;
  text-transform:uppercase;
}

.th-p-camera-equipment .camera-index__all span{color:var(--accent);font-size:19px;}

.th-p-camera-equipment .camera-index__catalogue{
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  border-left:1px solid var(--line);
}

.th-p-camera-equipment .camera-field__category{
  position:relative;
  display:grid;
  grid-template-rows:auto minmax(160px,1fr) auto;
  min-width:0;
  min-height:clamp(330px,29vw,470px);
  color:var(--ink);
  text-decoration:none;
  border-right:1px solid var(--line);
  border-bottom:1px solid var(--line);
}

.th-p-camera-equipment .camera-field__category-number{
  padding:15px 16px;
  color:var(--muted);
  font:600 10px/1 var(--body);
  letter-spacing:.14em;
}

.th-p-camera-equipment .camera-field__category-image{
  position:relative;
  display:block;
  min-height:0;
  overflow:hidden;
  margin:0 16px;
  background:linear-gradient(135deg,#cfd4d3,#edf0ec);
}

.th-p-camera-equipment .camera-field__category-image img{
  display:block;
  width:100%;
  height:100%;
  object-fit:cover;
  filter:saturate(.72) contrast(1.03);
}

.th-p-camera-equipment .camera-field__category-image::after{
  position:absolute;
  inset:0;
  background:linear-gradient(0deg,rgba(18,28,37,.18),transparent 46%);
  content:"";
  pointer-events:none;
}

.th-p-camera-equipment .camera-field__category-empty{
  display:block;
  width:100%;
  height:100%;
  background:
    linear-gradient(135deg,transparent 0 49.5%,rgba(23,32,42,.16) 49.6% 50.4%,transparent 50.5%),
    linear-gradient(45deg,transparent 0 49.5%,rgba(23,32,42,.08) 49.6% 50.4%,transparent 50.5%),
    #e1e2dc;
}

.th-p-camera-equipment .camera-field__category-meta{
  display:grid;
  grid-template-columns:minmax(0,1fr) auto;
  gap:5px 10px;
  align-items:end;
  min-height:94px;
  padding:17px 16px 20px;
}

.th-p-camera-equipment .camera-field__category-meta b{
  overflow-wrap:anywhere;
  font:500 clamp(19px,1.75vw,28px)/1.04 var(--display);
  letter-spacing:-.025em;
}

.th-p-camera-equipment .camera-field__category-meta small{
  grid-column:1;
  color:var(--muted);
  font:600 10px/1.2 var(--body);
  letter-spacing:.07em;
  text-transform:uppercase;
}

.th-p-camera-equipment .camera-field__category-meta i{
  grid-row:1 / span 2;
  grid-column:2;
  align-self:center;
  color:var(--accent);
  font-size:22px;
  font-style:normal;
}

.th-p-camera-equipment .camera-index__products{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:clamp(18px,2.5vw,38px);
  padding-top:clamp(26px,3.5vw,50px);
}

.th-p-camera-equipment #shop{
  border-top:1px solid var(--line);
  background:var(--surface);
}

.th-p-camera-equipment #shop .sec-h{margin-bottom:clamp(26px,3vw,46px);}

.th-p-camera-equipment #shop .sec-h h2{
  font-family:var(--display);
  font-size:clamp(35px,4vw,61px);
  font-weight:400;
  letter-spacing:var(--dt);
}

.th-p-camera-equipment #shop .chips{
  gap:7px;
  padding-bottom:clamp(18px,2.5vw,31px);
  border-bottom:1px solid var(--line);
}

.th-p-camera-equipment #shop .chip{
  min-height:44px;
  border-radius:0;
  font:600 11px/1.2 var(--body);
  letter-spacing:.07em;
  text-transform:uppercase;
}

.th-p-camera-equipment #shop .chip[aria-current]{
  background:var(--ink);
  color:var(--surface);
}

.th-p-camera-equipment .grid{gap:clamp(30px,4vw,64px) clamp(14px,2.4vw,36px);}

.th-p-camera-equipment .pc{gap:13px;}

.th-p-camera-equipment .pc .im{
  border:1px solid var(--line);
  border-radius:0;
  background:#e1e4e1;
}

.th-p-camera-equipment .pc .im img{filter:saturate(.78) contrast(1.02);}

.th-p-camera-equipment .pc .bd{grid-template-columns:minmax(0,1fr) auto;gap:5px 14px;}

.th-p-camera-equipment .pc h3{
  font-family:var(--display);
  font-size:clamp(18px,1.5vw,24px);
  font-weight:400;
  letter-spacing:-.025em;
}

.th-p-camera-equipment .pc .pr{
  grid-row:1;
  grid-column:2;
  color:var(--ink);
  font:700 13px/1.3 var(--body);
  white-space:nowrap;
}

.th-p-camera-equipment .pc .ct{grid-column:1 / -1;color:var(--muted);font-size:12px;}
.th-p-camera-equipment .pc .tag{border-radius:0;font:600 9px/1.15 var(--body);letter-spacing:.11em;text-transform:uppercase;}
.th-p-camera-equipment .pc .go{border-radius:0;}

.th-p-camera-equipment .ft{border-top:1px solid color-mix(in srgb,var(--on-foot) 18%,transparent);}

@keyframes camera-equipment-pan{
  from{transform:scale(1.01) translate3d(0,0,0);}
  to{transform:scale(1.08) translate3d(-1.8%,0,0);}
}

@keyframes camera-equipment-drift{
  from{transform:scale(1.025) translate3d(0,0,0);}
  to{transform:scale(1.055) translate3d(0,-1.2%,0);}
}

@media (max-width:900px){
  .th-p-camera-equipment .camera-field__viewfinder{min-height:620px;}
  .th-p-camera-equipment .camera-index__intro{grid-template-columns:minmax(130px,.65fr) minmax(0,1fr);}
  .th-p-camera-equipment .camera-index__all{grid-column:2;justify-content:flex-start;}
  .th-p-camera-equipment .camera-index__catalogue{grid-template-columns:repeat(2,minmax(0,1fr));}
  .th-p-camera-equipment .camera-field__category{min-height:380px;}
}

@media (max-width:640px){
  .th-p-camera-equipment .brand{font-size:13px;letter-spacing:.15em;}
  .th-p-camera-equipment .camera-field{padding:10px 10px 24px;}
  .th-p-camera-equipment .camera-field__eyeline{padding:0 5px 8px;font-size:8px;}
  .th-p-camera-equipment .camera-field__viewfinder{min-height:690px;}
  .th-p-camera-equipment .camera-field__media > .hero-media{object-position:59% center;}
  .th-p-camera-equipment .camera-field__media::after{background:linear-gradient(0deg,rgba(8,15,22,.58),rgba(8,15,22,.04) 60%),linear-gradient(90deg,rgba(8,15,22,.83),rgba(8,15,22,.1) 100%);}
  .th-p-camera-equipment .camera-field__horizon{top:43%;background:linear-gradient(90deg,transparent 0 7%,rgba(241,243,240,.35) 7% 93%,transparent 93%);}
  .th-p-camera-equipment .camera-field__focus{top:43%;left:69%;}
  .th-p-camera-equipment .camera-field__caption{right:17px;bottom:28px;left:17px;width:auto;padding:25px 21px 24px;background:linear-gradient(90deg,rgba(12,21,30,.89),rgba(12,21,30,.69));}
  .th-p-camera-equipment .camera-field h1{max-width:12ch;font-size:clamp(46px,13vw,65px);}
  .th-p-camera-equipment .camera-field h1.long{font-size:clamp(35px,9.7vw,52px);}
  .th-p-camera-equipment .camera-field .sub{font-size:13px;}
  .th-p-camera-equipment .camera-field .ctas{width:100%;}
  .th-p-camera-equipment .camera-field .btn{flex:1 1 140px;padding-inline:12px;}
  .th-p-camera-equipment .camera-field__exposure{display:none;}
  .th-p-camera-equipment .camera-field__baseline{padding:12px 5px 0;font-size:8px;}
  .th-p-camera-equipment .camera-field__baseline i{min-width:18px;}
  .th-p-camera-equipment .camera-field .motion-toggle{right:29px;bottom:32px;}
  .th-p-camera-equipment .camera-index{padding:64px 16px 76px;}
  .th-p-camera-equipment .camera-index__intro{display:flex;align-items:flex-start;flex-direction:column;gap:14px;}
  .th-p-camera-equipment .camera-index__kicker{margin:0;}
  .th-p-camera-equipment .camera-index h2{max-width:11ch;font-size:clamp(38px,10.5vw,49px);}
  .th-p-camera-equipment .camera-index__all{justify-content:flex-start;}
  .th-p-camera-equipment .camera-index__catalogue{grid-template-columns:1fr;}
  .th-p-camera-equipment .camera-field__category{min-height:268px;grid-template-columns:42px minmax(0,1fr);grid-template-rows:1fr auto;}
  .th-p-camera-equipment .camera-field__category-number{grid-column:1;grid-row:1;padding:16px 8px;}
  .th-p-camera-equipment .camera-field__category-image{grid-column:2;grid-row:1;margin:16px 16px 0 0;}
  .th-p-camera-equipment .camera-field__category-meta{grid-column:1 / -1;grid-row:2;min-height:75px;padding:13px 16px 16px;}
  .th-p-camera-equipment .camera-index__products{grid-template-columns:1fr;gap:30px;}
  .th-p-camera-equipment #shop .chips{overflow-x:auto;flex-wrap:nowrap;}
  .th-p-camera-equipment #shop .chip{flex:none;}
}

@media (max-width:390px){
  .th-p-camera-equipment .camera-field__eyeline span:last-child{display:none;}
  .th-p-camera-equipment .camera-field__viewfinder{min-height:675px;}
  .th-p-camera-equipment .camera-field .btn{flex-basis:100%;width:100%;}
  .th-p-camera-equipment .camera-field__baseline span:last-child{display:none;}
}

@media (prefers-reduced-motion:reduce){
  .th-p-camera-equipment .camera-field.has-hero-motion .camera-field__media > .hero-media{animation:none;transform:none;}
}
`;

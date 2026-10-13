import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-hats-and-caps',
  name: 'BRIM / FOLD',
  for: 'People who choose an angle before an outfit',
  vibe: 'Sculptural millinery study in ink, parchment, and sun-warmed olive',
  category: 'Hats and caps',
  group: 'fashion',
  display: 'DM Serif Display',
  body: 'Manrope',
  displayWeight: 400,
  tracking: '-.045em',
  colors: {
    bg: '#EEE8DE',
    surface: '#F8F4EC',
    ink: '#1B1B18',
    muted: '#706C63',
    line: '#CFC7BA',
    accent: '#C45632',
    onAccent: '#FFF8F0',
    panel: '#252722',
    onPanel: '#F7F0E6',
    foot: '#1B1B18',
    onFoot: '#F7F0E6',
    bar: '#EEE8DE',
    onBar: '#1B1B18',
    badge: '#C45632',
    onBadge: '#FFF8F0',
  },
  header: 'split',
  hero: 'editorial',
  card: 'minimal',
  ratio: '4/5',
  rCard: 2,
  rBtn: 999,
  motion: 'pan',
  copy: {
    eyebrow: 'The angle edit',
    collection: 'Crown / brim / fold',
    cta: 'Browse the edit',
    title: 'Make room for an angle.',
    subtitle: 'Pieces with shape, shade, and an easy point of view.',
  },
  collection: 'premium',
  family: 'hats-and-caps',
  demoPhoto: '/theme-assets/hats-and-caps-hero.webp',
});

export function hero(ctx) {
  return `
    <section class="hero category-hero cap-hero${ctx.heroClass}"${ctx.heroAttrs}>
      <div class="cap-hero__orbit" aria-hidden="true"><span></span><i></i></div>
      <div class="cap-hero__index" aria-hidden="true"><span>01</span><b>Angle<br>study</b></div>
      <div class="cap-hero__media">
        ${ctx.media(0, { priority: true, lazy: false, decorative: false })}
      </div>
      <div class="cap-hero__copy">
        ${ctx.copy('cap-hero__txt')}
      </div>
      <p class="cap-hero__caption"><span aria-hidden="true">↗</span> A live selection for the way you face the day.</p>
      ${ctx.controls}
    </section>
  `;
}

export function discovery(ctx) {
  const categories = (Array.isArray(ctx.cats) ? ctx.cats : [])
    .filter((category) => category && category.name)
    .slice(0, 5);
  const products = Array.isArray(ctx.products) ? ctx.products : [];
  const safe = (value) => ctx.esc(String(value ?? ''));

  if (categories.length >= 2) {
    const ledger = categories.map((category, index) => {
      const count = Number.isFinite(Number(category.count)) ? Number(category.count) : 0;
      const countLabel = `${count} ${count === 1 ? 'piece' : 'pieces'}`;
      const categoryImage = category.image
        ? `<img src="${safe(category.image)}" alt="" loading="lazy" decoding="async">`
        : `<span class="cap-index__placeholder" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>`;
      return `
        <a class="cap-index__row" href="${ctx.categoryLink(category.name)}">
          <span class="cap-index__thumb">${categoryImage}</span>
          <span class="cap-index__number">${String(index + 1).padStart(2, '0')}</span>
          <span class="cap-index__name">${safe(category.name)}</span>
          <span class="cap-index__count">${safe(countLabel)}</span>
          <span class="cap-index__arrow" aria-hidden="true">↗</span>
        </a>
      `;
    }).join('');

    return `
      <section class="theme-discovery cap-index" aria-labelledby="cap-index-title">
        <div class="cap-index__heading">
          <p class="eyebrow">Silhouette index</p>
          <h2 id="cap-index-title">Find the shape<br>that meets your day.</h2>
          <p>Browse the live collection by the categories currently available in this store.</p>
        </div>
        <div class="cap-index__ledger">${ledger}</div>
      </section>
    `;
  }

  if (!products.length) return '';
  const currentEdit = products.slice(0, 2).map((product) => ctx.productCard(product)).join('');
  return `
    <section class="theme-discovery cap-current" aria-labelledby="cap-current-title">
      <div class="cap-current__heading">
        <p class="eyebrow">Current edit</p>
        <h2 id="cap-current-title">Shape is the first impression.</h2>
        <p>Explore the pieces currently available in this store.</p>
      </div>
      <div class="cap-current__products">${currentEdit}</div>
    </section>
  `;
}

export const css = `
.th-p-hats-and-caps{
  --cap-paper:#EEE8DE;
  --cap-cream:#F8F4EC;
  --cap-ink:#1B1B18;
  --cap-charcoal:#252722;
  --cap-clay:#C45632;
  --cap-line:#CFC7BA;
  --cap-muted:#706C63;
  background:var(--cap-paper);
}
.th-p-hats-and-caps .hd{
  background:color-mix(in srgb,var(--cap-paper) 94%,transparent);
  border-bottom-color:color-mix(in srgb,var(--cap-ink) 14%,transparent);
}
.th-p-hats-and-caps .hd .wrap{max-width:1500px;min-height:70px}
.th-p-hats-and-caps .hd .brand{font-size:calc(26px * var(--ts));letter-spacing:.055em}
.th-p-hats-and-caps .hd .nav a{font:600 11px/1 var(--body);letter-spacing:.1em;text-transform:uppercase}
.th-p-hats-and-caps .hd .cart{border-radius:999px;border-color:var(--cap-ink);font:700 11px/1 var(--body);letter-spacing:.08em}
.th-p-hats-and-caps .cap-hero{
  position:relative;
  isolation:isolate;
  display:grid;
  grid-template-columns:repeat(12,minmax(0,1fr));
  grid-template-rows:minmax(430px,70vh) auto;
  column-gap:clamp(12px,2vw,30px);
  align-items:end;
  overflow:hidden;
  padding:clamp(18px,2.5vw,40px) max(20px,calc((100vw - 1440px)/2 + 30px)) clamp(28px,4vw,62px);
  background:var(--cap-paper);
}
.th-p-hats-and-caps .cap-hero__media{
  grid-column:3 / -1;
  grid-row:1;
  position:relative;
  min-height:100%;
  overflow:hidden;
  background:#C8BBA7;
  border-radius:46% 4px 4px 4px;
  box-shadow:inset 0 0 0 1px #1B1B1814;
}
.th-p-hats-and-caps .cap-hero__media::after{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  background:linear-gradient(110deg,#1B1B1833 0%,transparent 36%,transparent 100%);
}
.th-p-hats-and-caps .cap-hero__media .hero-media{
  display:block;
  width:100%;
  height:100%;
  object-fit:cover;
  object-position:center;
}
.th-p-hats-and-caps .cap-hero__media .theme-empty-media{
  width:100%;
  height:100%;
  min-height:430px;
  background:linear-gradient(135deg,#D5C8B6,#B9AA94);
  color:var(--cap-ink);
}
.th-p-hats-and-caps .cap-hero__copy{
  grid-column:1 / 8;
  grid-row:1 / 3;
  z-index:2;
  align-self:end;
  justify-self:start;
  width:min(100%,690px);
  margin:0 0 clamp(-3px,-.3vw,-1px) clamp(-20px,-1vw,-4px);
  padding:clamp(24px,4vw,62px) clamp(23px,4vw,62px) clamp(25px,3.5vw,52px) 0;
  background:var(--cap-paper);
}
.th-p-hats-and-caps .cap-hero__txt{max-width:100%}
.th-p-hats-and-caps .cap-hero__txt .eyebrow{
  display:flex;
  align-items:center;
  gap:10px;
  margin:0 0 20px;
  color:var(--cap-clay);
  font:800 10px/1 var(--body);
  letter-spacing:.16em;
  text-transform:uppercase;
}
.th-p-hats-and-caps .cap-hero__txt .eyebrow::before{content:"";width:30px;height:1px;background:currentColor}
.th-p-hats-and-caps .cap-hero__txt h1{
  max-width:12ch;
  margin:0;
  color:var(--cap-ink);
  font-family:var(--display);
  font-size:clamp(54px,7.1vw,126px);
  font-weight:400;
  letter-spacing:var(--tracking);
  line-height:.78;
  overflow-wrap:anywhere;
  text-wrap:balance;
}
.th-p-hats-and-caps .cap-hero__txt h1.long{max-width:13ch;font-size:clamp(46px,5.8vw,94px);line-height:.84}
.th-p-hats-and-caps .cap-hero__txt .sub{
  max-width:43ch;
  margin:26px 0 0;
  color:var(--cap-muted);
  font:500 clamp(14px,1.15vw,17px)/1.55 var(--body);
}
.th-p-hats-and-caps .cap-hero__txt .ctas{margin-top:27px;display:flex;flex-wrap:wrap;gap:10px}
.th-p-hats-and-caps .cap-hero__txt .btn{
  min-height:46px;
  padding:13px 20px;
  border-radius:999px;
  border:1px solid var(--cap-ink);
  background:var(--cap-ink);
  color:var(--cap-cream);
  font:800 10px/1 var(--body);
  letter-spacing:.11em;
  text-transform:uppercase;
}
.th-p-hats-and-caps .cap-hero__txt .btn.ghost{background:transparent;color:var(--cap-ink)}
.th-p-hats-and-caps .cap-hero__txt .btn:hover{background:var(--cap-clay);border-color:var(--cap-clay);color:var(--onAccent)}
.th-p-hats-and-caps .cap-hero__index{
  grid-column:1 / 3;
  grid-row:1;
  z-index:2;
  align-self:start;
  display:flex;
  align-items:flex-start;
  gap:10px;
  padding-top:6px;
  color:var(--cap-ink);
}
.th-p-hats-and-caps .cap-hero__index>span{font:800 11px/1 var(--body);letter-spacing:.12em}
.th-p-hats-and-caps .cap-hero__index>b{
  padding-left:10px;
  border-left:1px solid var(--cap-ink);
  font:700 9px/1.15 var(--body);
  letter-spacing:.13em;
  text-transform:uppercase;
}
.th-p-hats-and-caps .cap-hero__caption{
  grid-column:8 / -1;
  grid-row:2;
  z-index:2;
  align-self:end;
  margin:0;
  padding:22px 0 0;
  color:var(--cap-muted);
  font:700 10px/1.35 var(--body);
  letter-spacing:.1em;
  text-transform:uppercase;
}
.th-p-hats-and-caps .cap-hero__caption span{margin-right:7px;color:var(--cap-clay);font-size:14px}
.th-p-hats-and-caps .cap-hero__orbit{
  position:absolute;
  z-index:1;
  right:-12vw;
  bottom:-25vw;
  width:min(62vw,900px);
  aspect-ratio:1;
  border:1px solid #1B1B1828;
  border-radius:50%;
  pointer-events:none;
}
.th-p-hats-and-caps .cap-hero__orbit span{position:absolute;inset:12%;border:1px solid #1B1B181F;border-radius:50%}
.th-p-hats-and-caps .cap-hero__orbit i{position:absolute;top:17%;left:12%;width:9px;height:9px;border-radius:50%;background:var(--cap-clay)}
.th-p-hats-and-caps .cap-hero .motion-toggle{
  right:max(20px,calc((100vw - 1440px)/2 + 30px));
  bottom:16px;
  border-radius:999px;
  background:var(--cap-cream);
  color:var(--cap-ink);
}
.th-p-hats-and-caps .cap-index{
  display:grid;
  grid-template-columns:minmax(230px,.78fr) minmax(0,1.22fr);
  gap:clamp(30px,7vw,130px);
  padding:clamp(54px,8vw,128px) max(20px,calc((100vw - 1320px)/2 + 30px));
  background:var(--cap-charcoal);
  color:var(--onPanel);
}
.th-p-hats-and-caps .cap-index__heading{max-width:30rem}
.th-p-hats-and-caps .cap-index__heading .eyebrow,
.th-p-hats-and-caps .cap-current__heading .eyebrow{
  margin:0 0 16px;
  color:#D98A6B;
  font:800 10px/1 var(--body);
  letter-spacing:.16em;
  text-transform:uppercase;
}
.th-p-hats-and-caps .cap-index__heading h2,
.th-p-hats-and-caps .cap-current__heading h2{
  margin:0;
  font:400 clamp(42px,5vw,78px)/.86 var(--display);
  letter-spacing:var(--tracking);
  overflow-wrap:anywhere;
}
.th-p-hats-and-caps .cap-index__heading>p:last-child,
.th-p-hats-and-caps .cap-current__heading>p:last-child{
  max-width:34ch;
  margin:22px 0 0;
  color:#C7C1B8;
  font:500 14px/1.6 var(--body);
}
.th-p-hats-and-caps .cap-index__ledger{border-top:1px solid #F7F0E633}
.th-p-hats-and-caps .cap-index__row{
  display:grid;
  grid-template-columns:42px 34px minmax(0,1fr) auto 24px;
  gap:clamp(10px,1.5vw,20px);
  align-items:center;
  min-height:92px;
  border-bottom:1px solid #F7F0E633;
  color:inherit;
  text-decoration:none;
}
.th-p-hats-and-caps .cap-index__thumb{
  position:relative;
  display:grid;
  width:42px;
  aspect-ratio:1;
  overflow:hidden;
  border:1px solid #F7F0E666;
  border-radius:50%;
  background:#45463F;
}
.th-p-hats-and-caps .cap-index__thumb img{width:100%;height:100%;object-fit:cover}
.th-p-hats-and-caps .cap-index__placeholder{place-self:center;color:#D9D3C9;font:700 9px/1 var(--body);letter-spacing:.08em}
.th-p-hats-and-caps .cap-index__number{color:#D98A6B;font:800 10px/1 var(--body);letter-spacing:.12em}
.th-p-hats-and-caps .cap-index__name{font:400 clamp(24px,2.8vw,44px)/.9 var(--display);letter-spacing:-.035em;overflow-wrap:anywhere}
.th-p-hats-and-caps .cap-index__count{color:#C7C1B8;font:700 10px/1.2 var(--body);letter-spacing:.08em;text-align:right;text-transform:uppercase;white-space:nowrap}
.th-p-hats-and-caps .cap-index__arrow{color:#D98A6B;font:400 24px/1 var(--display);text-align:right}
.th-p-hats-and-caps .cap-index__row:hover{color:#FFFFFF}
.th-p-hats-and-caps .cap-index__row:hover .cap-index__thumb{border-color:#D98A6B}
.th-p-hats-and-caps .cap-current{
  display:grid;
  grid-template-columns:minmax(220px,.75fr) minmax(0,1.25fr);
  gap:clamp(30px,6vw,100px);
  align-items:start;
  padding:clamp(54px,8vw,120px) max(20px,calc((100vw - 1320px)/2 + 30px));
  background:var(--cap-charcoal);
  color:var(--onPanel);
}
.th-p-hats-and-caps .cap-current__products{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.th-p-hats-and-caps .cap-current__products .pc{border-color:#F7F0E633;background:transparent;color:var(--onPanel);box-shadow:none}
.th-p-hats-and-caps .cap-current__products .pc .im{border-radius:2px;background:#3B3C36}
.th-p-hats-and-caps .cap-current__products .pc .bd{padding:14px 0 0}
.th-p-hats-and-caps .cap-current__products .pc h3{font-family:var(--display);font-weight:400;letter-spacing:-.02em}
.th-p-hats-and-caps .cap-current__products .pc .pr{color:#D98A6B}
.th-p-hats-and-caps #shop{background:var(--cap-cream);padding-top:clamp(54px,8vw,110px)}
.th-p-hats-and-caps #shop .sec-h{align-items:end;margin-bottom:clamp(26px,4vw,48px);padding-bottom:16px;border-bottom:1px solid var(--cap-line)}
.th-p-hats-and-caps #shop .sec-h h2{max-width:12ch;font:400 clamp(46px,5vw,78px)/.84 var(--display);letter-spacing:var(--tracking)}
.th-p-hats-and-caps #shop .chip{
  min-height:44px;
  border-radius:999px;
  border-color:var(--cap-line);
  background:transparent;
  color:var(--cap-ink);
  font:800 10px/1 var(--body);
  letter-spacing:.09em;
  text-transform:uppercase;
}
.th-p-hats-and-caps #shop .chip[aria-current],
.th-p-hats-and-caps #shop .chip:hover{border-color:var(--cap-ink);background:var(--cap-ink);color:var(--cap-cream)}
.th-p-hats-and-caps #shop .grid{gap:clamp(22px,3vw,42px) clamp(12px,1.7vw,26px)}
.th-p-hats-and-caps #shop .pc{border:0;border-radius:0;background:transparent;box-shadow:none;gap:13px}
.th-p-hats-and-caps #shop .pc .im{border-radius:2px;background:#E3DACE}
.th-p-hats-and-caps #shop .pc .bd{padding:0}
.th-p-hats-and-caps #shop .pc h3{font:400 clamp(20px,1.8vw,29px)/.98 var(--display);letter-spacing:-.025em}
.th-p-hats-and-caps #shop .pc .pr{color:var(--cap-clay);font:800 11px/1 var(--body);letter-spacing:.07em}
.th-p-hats-and-caps #shop .pc .tag{border-radius:999px;background:var(--cap-clay);color:var(--onAccent);font:800 9px/1 var(--body);letter-spacing:.09em}
.th-p-hats-and-caps #shop .pc .tag.out{background:var(--cap-ink);color:var(--cap-cream)}
.th-p-hats-and-caps .perks{background:var(--cap-paper);border-top-color:var(--cap-line);border-bottom-color:var(--cap-line)}
.th-p-hats-and-caps .perk{padding:20px 8px}
.th-p-hats-and-caps .perk svg{color:var(--cap-clay)}
.th-p-hats-and-caps .ft{background:var(--cap-ink);color:var(--onFoot)}
.th-p-hats-and-caps .ft .brand{color:#D98A6B}
@media (max-width:900px){
  .th-p-hats-and-caps .cap-hero{grid-template-rows:minmax(390px,62vh) auto}
  .th-p-hats-and-caps .cap-hero__media{grid-column:2 / -1}
  .th-p-hats-and-caps .cap-hero__copy{grid-column:1 / 9;max-width:570px}
  .th-p-hats-and-caps .cap-hero__caption{grid-column:9 / -1}
  .th-p-hats-and-caps .cap-index{gap:36px}
}
@media (max-width:700px){
  .th-p-hats-and-caps .hd .wrap{min-height:62px}
  .th-p-hats-and-caps .hd .brand{font-size:calc(22px * var(--ts))}
  .th-p-hats-and-caps .cap-hero{display:flex;flex-direction:column;align-items:stretch;gap:0;min-height:0;padding:14px 16px 0}
  .th-p-hats-and-caps .cap-hero__media{order:1;min-height:0;aspect-ratio:5/4;border-radius:38% 2px 2px 2px}
  .th-p-hats-and-caps .cap-hero__media .theme-empty-media{min-height:0}
  .th-p-hats-and-caps .cap-hero__index{order:0;position:absolute;z-index:3;top:26px;left:27px;color:var(--cap-cream);text-shadow:0 1px 8px #1B1B1888}
  .th-p-hats-and-caps .cap-hero__index>b{border-left-color:currentColor}
  .th-p-hats-and-caps .cap-hero__copy{order:2;width:auto;margin:-2px 0 0;padding:31px 18px 36px;background:var(--cap-paper)}
  .th-p-hats-and-caps .cap-hero__txt h1{max-width:11ch;font-size:clamp(52px,16vw,76px);line-height:.79}
  .th-p-hats-and-caps .cap-hero__txt h1.long{max-width:13ch;font-size:clamp(42px,12vw,59px)}
  .th-p-hats-and-caps .cap-hero__txt .sub{margin-top:21px;font-size:14px}
  .th-p-hats-and-caps .cap-hero__caption{order:3;margin:0;padding:15px 4px 25px;color:var(--cap-muted);font-size:9px}
  .th-p-hats-and-caps .cap-hero__orbit{right:-48vw;bottom:24%;width:108vw}
  .th-p-hats-and-caps .cap-hero .motion-toggle{right:27px;bottom:auto;top:calc(14px + min(80vw,420px) * .8 - 54px)}
  .th-p-hats-and-caps .cap-index,
  .th-p-hats-and-caps .cap-current{grid-template-columns:1fr;gap:34px;padding:54px 20px 62px}
  .th-p-hats-and-caps .cap-index__heading h2,
  .th-p-hats-and-caps .cap-current__heading h2{font-size:clamp(44px,13vw,65px)}
  .th-p-hats-and-caps .cap-index__row{grid-template-columns:36px 27px minmax(0,1fr) 20px;gap:10px;min-height:78px}
  .th-p-hats-and-caps .cap-index__thumb{width:36px}
  .th-p-hats-and-caps .cap-index__count{display:none}
  .th-p-hats-and-caps .cap-index__name{font-size:clamp(25px,8vw,38px)}
  .th-p-hats-and-caps .cap-current__products{gap:12px}
  .th-p-hats-and-caps #shop .sec-h{align-items:flex-start;gap:18px}
  .th-p-hats-and-caps #shop .sec-h h2{font-size:clamp(44px,13vw,62px)}
  .th-p-hats-and-caps #shop .chips{width:100%;flex-wrap:nowrap;overflow-x:auto;padding-bottom:2px}
  .th-p-hats-and-caps #shop .chip{flex:0 0 auto}
}
@media (max-width:390px){
  .th-p-hats-and-caps .cap-hero__txt h1{font-size:clamp(48px,15.4vw,60px)}
  .th-p-hats-and-caps .cap-hero__txt .ctas{gap:8px}
  .th-p-hats-and-caps .cap-hero__txt .btn{padding-inline:15px}
  .th-p-hats-and-caps .cap-current__products{grid-template-columns:1fr}
}
`;

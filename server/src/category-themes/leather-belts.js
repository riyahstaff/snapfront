import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-leather-belts',
  name: 'Line & Loop',
  for: 'Leather belts and considered everyday accessories',
  vibe: 'A quiet cutting-table study in dark hide, worn brass, and measured lines',
  category: 'Leather belts',
  group: 'fashion',
  display: 'Bodoni Moda',
  body: 'Manrope',
  displayWeight: 600,
  tracking: '-.045em',
  colors: {
    bg: '#EAE5DA',
    surface: '#F7F3EB',
    ink: '#201C17',
    muted: '#746B5F',
    line: '#C9C0B0',
    accent: '#8A492D',
    onAccent: '#FFF9F0',
    panel: '#DCD3C2',
    onPanel: '#201C17',
    foot: '#27221C',
    onFoot: '#F4EDE2',
    bar: '#41342A',
    onBar: '#F8F2E8',
    badge: '#C89B58',
    onBadge: '#211A13',
  },
  header: 'stack',
  hero: 'editorial',
  card: 'boxed',
  ratio: '4/5',
  rCard: 2,
  rBtn: 0,
  motion: 'pan',
  copy: {
    eyebrow: 'A study in the long line',
    collection: 'The considered belt edit',
    cta: 'Shop the edit',
    title: 'The line that holds.',
    subtitle: 'A measured collection for the everyday turn.',
  },
});

export function hero(ctx) {
  const hasDetail = Boolean(ctx.pics[1]);
  return `<section class="hero category-hero belts-hero${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="belts-hero-ruler" aria-hidden="true"><span></span><i></i><i></i><i></i><i></i><i></i><i></i></div>
    <div class="belts-hero-caption" aria-hidden="true">
      <span>Line study</span>
      <b>01</b>
      <span>Long form</span>
    </div>
    <div class="belts-hero-stage">
      <div class="belts-hero-topline">
        <p>Measured in the details</p>
        <p>${ctx.esc(ctx.store.store_name)}</p>
      </div>
      <div class="belts-main-media">
        ${ctx.media(0, { priority: true, lazy: false })}
        <span class="belts-main-wash" aria-hidden="true"></span>
      </div>
      <div class="belts-hero-copy">${ctx.copy('belts-copy')}</div>
      <span class="belts-buckle-mark" aria-hidden="true"><i></i></span>
      ${hasDetail
        ? `<div class="belts-detail-media">${ctx.media(1, { lazy: true, decorative: true })}</div>`
        : '<div class="belts-detail-media belts-detail-empty" aria-hidden="true"><span></span></div>'}
      <div class="belts-hero-baseline" aria-hidden="true"><span>Edge</span><i></i><span>Turn</span><i></i><span>Loop</span></div>
    </div>
    ${ctx.controls}
  </section>`;
}

export function discovery(ctx) {
  if (ctx.cats.length >= 2) {
    const categories = ctx.cats.slice(0, 3).map((cat, index) => `<a class="belts-category" href="${ctx.esc(ctx.categoryLink(cat.name))}">
      <span class="belts-category-index" aria-hidden="true">0${index + 1}</span>
      <span class="belts-category-loop">
        <span class="belts-category-media">${cat.image ? `<img src="${ctx.esc(cat.image)}" alt="" loading="lazy" decoding="async">` : '<i aria-hidden="true"></i>'}</span>
      </span>
      <span class="belts-category-copy"><b>${ctx.esc(cat.name)}</b><small>${cat.count} ${cat.count === 1 ? 'piece' : 'pieces'}</small><em>See the edit <span aria-hidden="true">↗</span></em></span>
    </a>`).join('');

    return `<section class="theme-discovery belts-discovery" aria-labelledby="belts-discovery-title">
      <div class="belts-discovery-head">
        <p>Follow the line</p>
        <h2 id="belts-discovery-title">Choose a point of view.</h2>
        <span aria-hidden="true">01—03</span>
      </div>
      <div class="belts-category-list">${categories}</div>
    </section>`;
  }

  if (!ctx.products.length) return '';
  const pieces = ctx.products.slice(0, 3).map((product, index) => `<a class="belts-piece" href="${ctx.esc(ctx.productLink(product))}">
    <span class="belts-piece-number" aria-hidden="true">0${index + 1}</span>
    <span class="belts-piece-media">${product.image_url ? `<img src="${ctx.esc(product.image_url)}" alt="${ctx.esc(product.alt_text || product.title)}" loading="lazy" decoding="async">` : '<i aria-hidden="true"></i>'}</span>
    <span class="belts-piece-copy"><b>${ctx.esc(product.title)}</b>${product.category ? `<small>${ctx.esc(product.category)}</small>` : ''}${product.price_cents != null ? `<em>${ctx.esc(ctx.money(product.price_cents, product.currency))}</em>` : ''}</span>
  </a>`).join('');

  return `<section class="theme-discovery belts-discovery belts-piece-discovery" aria-labelledby="belts-pieces-title">
    <div class="belts-discovery-head">
      <p>First marks</p>
      <h2 id="belts-pieces-title">Begin with a line.</h2>
      <span aria-hidden="true">Selected pieces</span>
    </div>
    <div class="belts-piece-list">${pieces}</div>
  </section>`;
}

export const css = `
.th-p-leather-belts{background:var(--bg);color:var(--ink)}
.th-p-leather-belts .ann{font-size:10px;letter-spacing:.18em;text-transform:uppercase}
.th-p-leather-belts .hd{background:color-mix(in srgb,var(--bg) 94%,transparent);border-bottom:1px solid color-mix(in srgb,var(--ink) 17%,transparent)}
.th-p-leather-belts .hd .wrap{max-width:1480px;min-height:72px;padding-inline:clamp(16px,3vw,48px)}
.th-p-leather-belts .brand{font-family:var(--body);font-size:calc(16px*var(--ts));font-weight:800;letter-spacing:.19em;text-transform:uppercase}
.th-p-leather-belts .nav{gap:clamp(13px,2.35vw,31px);font-size:10px;font-weight:700;letter-spacing:.15em;text-transform:uppercase}
.th-p-leather-belts .nav a{background-image:linear-gradient(currentColor,currentColor);background-size:0 1px;background-position:left bottom;background-repeat:no-repeat}
.th-p-leather-belts .nav a:hover,.th-p-leather-belts .nav a[aria-current]{background-size:100% 1px}
.th-p-leather-belts .cart{width:43px;height:43px;border:1px solid var(--ink);border-radius:0;background:transparent}
.th-p-leather-belts .cart b{border-radius:0;background:var(--accent)}
.th-p-leather-belts .belts-hero{position:relative;isolation:isolate;min-height:min(800px,calc(100svh - 98px));padding:clamp(22px,3.2vw,52px) clamp(18px,4vw,70px) clamp(32px,4.5vw,72px);overflow:hidden;background:var(--bg)}
.th-p-leather-belts .belts-hero::before{position:absolute;z-index:-1;inset:0;background:linear-gradient(90deg,transparent 0 7.2%,color-mix(in srgb,var(--ink) 15%,transparent) 7.2% calc(7.2% + 1px),transparent calc(7.2% + 1px));content:"";pointer-events:none}
.th-p-leather-belts .belts-hero-ruler{position:absolute;z-index:1;top:clamp(28px,4vw,64px);bottom:clamp(28px,4vw,64px);left:clamp(9px,2vw,34px);display:flex;width:13px;flex-direction:column;justify-content:space-between;pointer-events:none}
.th-p-leather-belts .belts-hero-ruler::before{position:absolute;top:0;bottom:0;left:6px;width:1px;background:color-mix(in srgb,var(--ink) 40%,transparent);content:""}
.th-p-leather-belts .belts-hero-ruler span,.th-p-leather-belts .belts-hero-ruler i{position:relative;z-index:1;display:block;width:13px;height:1px;background:var(--ink)}
.th-p-leather-belts .belts-hero-ruler i:nth-of-type(2n){width:7px}
.th-p-leather-belts .belts-hero-caption{position:absolute;z-index:2;top:clamp(26px,4.1vw,62px);left:clamp(34px,6.1vw,100px);display:flex;align-items:baseline;gap:13px;color:var(--muted);font-size:9px;font-weight:800;letter-spacing:.17em;text-transform:uppercase}
.th-p-leather-belts .belts-hero-caption b{color:var(--accent);font-size:11px}
.th-p-leather-belts .belts-hero-stage{position:relative;display:grid;grid-template-columns:minmax(0,1fr) minmax(270px,31%);grid-template-rows:auto minmax(420px,1fr) auto;gap:0 clamp(18px,2.4vw,38px);width:min(1320px,100%);min-height:clamp(620px,74vh,745px);margin:0 auto;padding-top:clamp(38px,5vw,72px)}
.th-p-leather-belts .belts-hero-topline{grid-column:1/-1;display:flex;justify-content:space-between;gap:18px;min-width:0;margin:0 0 12px 10%;color:var(--muted);font-size:10px;font-weight:700;letter-spacing:.14em;line-height:1.25;text-transform:uppercase}
.th-p-leather-belts .belts-hero-topline p:last-child{max-width:25ch;overflow-wrap:anywhere;text-align:right}
.th-p-leather-belts .belts-main-media{position:relative;grid-column:1/-1;grid-row:2;min-width:0;min-height:0;overflow:hidden;border:1px solid color-mix(in srgb,var(--ink) 34%,transparent);background:#b7a99a}
.th-p-leather-belts .belts-main-media>.hero-media,.th-p-leather-belts .belts-main-media>.theme-empty-media{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.th-p-leather-belts .belts-main-media>.theme-empty-media{min-height:100%;background:linear-gradient(125deg,#c3b6a3,#7e6250);color:#33271e}
.th-p-leather-belts .belts-main-wash{position:absolute;inset:0;background:linear-gradient(90deg,rgba(30,23,18,.32),transparent 38%,rgba(30,23,18,.05) 72%),linear-gradient(0deg,rgba(30,23,18,.42),transparent 43%);pointer-events:none}
.th-p-leather-belts .belts-hero-copy{position:relative;z-index:3;grid-column:1;grid-row:2;align-self:end;justify-self:start;max-width:min(620px,78%);margin:0 0 clamp(24px,4.2vw,66px) clamp(18px,4.5vw,74px);padding:clamp(22px,3.2vw,46px) clamp(22px,3.8vw,56px) clamp(21px,3vw,38px);border-top:4px solid var(--accent);background:var(--surface);box-shadow:16px 16px 0 color-mix(in srgb,var(--ink) 14%,transparent)}
.th-p-leather-belts .belts-copy.txt{display:grid;gap:clamp(9px,1.3vw,16px);justify-items:start;color:var(--ink)}
.th-p-leather-belts .belts-copy .eyebrow{font-size:10px;font-weight:800;letter-spacing:.19em;line-height:1.3;text-transform:uppercase}
.th-p-leather-belts .belts-copy h1{max-width:10ch;font-size:calc(clamp(48px,6vw,92px)*var(--hero));font-weight:600;letter-spacing:-.065em;line-height:.84;text-wrap:balance}
.th-p-leather-belts .belts-copy h1.long{max-width:13ch;font-size:calc(clamp(37px,4.5vw,68px)*min(var(--hero),1.12));line-height:.9}
.th-p-leather-belts .belts-copy .sub{max-width:38ch;color:var(--muted);font-size:clamp(13px,1.13vw,16px);line-height:1.56}
.th-p-leather-belts .belts-copy .ctas{gap:10px;margin-top:5px}
.th-p-leather-belts .belts-copy .btn{min-height:46px;padding-inline:20px;border-radius:0;background:var(--ink);color:var(--surface);font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}
.th-p-leather-belts .belts-copy .btn.ghost{border:1px solid var(--ink);background:transparent;color:var(--ink)}
.th-p-leather-belts .belts-buckle-mark{position:absolute;z-index:4;right:clamp(20px,4vw,66px);bottom:clamp(32px,5vw,76px);display:grid;width:clamp(70px,8vw,116px);height:clamp(38px,4.1vw,58px);place-items:center;border:2px solid color-mix(in srgb,var(--surface) 78%,transparent);border-radius:20px;background:color-mix(in srgb,var(--ink) 28%,transparent);box-shadow:inset 0 0 0 7px color-mix(in srgb,var(--ink) 20%,transparent);transform:rotate(-5deg);pointer-events:none}
.th-p-leather-belts .belts-buckle-mark i{width:66%;height:2px;background:color-mix(in srgb,var(--surface) 80%,transparent)}
.th-p-leather-belts .belts-detail-media{position:absolute;z-index:4;top:clamp(68px,8.7vw,122px);right:clamp(18px,2.8vw,44px);width:clamp(92px,11.8vw,174px);aspect-ratio:1;overflow:hidden;border:8px solid var(--surface);border-radius:50% 50% 50% 8%;background:var(--panel);box-shadow:0 0 0 1px color-mix(in srgb,var(--ink) 35%,transparent);transform:rotate(5deg)}
.th-p-leather-belts .belts-detail-media>.hero-media{width:100%;height:100%;object-fit:cover;filter:saturate(.75) contrast(1.05)}
.th-p-leather-belts .belts-detail-empty{background:repeating-linear-gradient(137deg,#876956 0 2px,#594335 2px 8px)}
.th-p-leather-belts .belts-detail-empty::before{position:absolute;inset:22%;border:1px solid color-mix(in srgb,var(--surface) 72%,transparent);border-radius:50%;content:""}
.th-p-leather-belts .belts-detail-empty span{position:absolute;top:50%;right:11%;left:11%;height:1px;background:color-mix(in srgb,var(--surface) 75%,transparent);transform:rotate(-16deg)}
.th-p-leather-belts .belts-hero-baseline{position:relative;z-index:3;grid-column:1/-1;grid-row:3;display:flex;align-items:center;gap:10px;min-width:0;padding:13px 0 0 10%;color:var(--muted);font-size:9px;font-weight:800;letter-spacing:.17em;text-transform:uppercase}
.th-p-leather-belts .belts-hero-baseline i{display:block;flex:1 1 70px;height:1px;background:var(--line)}
.th-p-leather-belts .belts-hero .motion-toggle{right:clamp(18px,3.4vw,55px);bottom:clamp(20px,3vw,42px);z-index:7;border-color:color-mix(in srgb,var(--surface) 72%,transparent);border-radius:0;background:color-mix(in srgb,var(--ink) 58%,transparent);color:var(--surface);font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase}
.th-p-leather-belts .belts-discovery{display:grid;grid-template-columns:minmax(240px,.72fr) minmax(0,1.28fr);gap:clamp(30px,7vw,118px);width:min(1320px,100%);margin:0 auto;padding:clamp(62px,9vw,132px) clamp(18px,4vw,70px) clamp(58px,8vw,116px);border-top:1px solid var(--line)}
.th-p-leather-belts .belts-discovery-head{align-self:start;display:grid;gap:12px;padding-top:5px}
.th-p-leather-belts .belts-discovery-head p{color:var(--accent);font-size:10px;font-weight:800;letter-spacing:.18em;text-transform:uppercase}
.th-p-leather-belts .belts-discovery-head h2{max-width:9ch;font-size:calc(clamp(42px,4.5vw,69px)*var(--ts));font-weight:600;letter-spacing:-.06em;line-height:.88;text-wrap:balance}
.th-p-leather-belts .belts-discovery-head>span{margin-top:12px;color:var(--muted);font-size:10px;font-weight:800;letter-spacing:.18em;text-transform:uppercase}
.th-p-leather-belts .belts-category-list{border-top:1px solid var(--ink)}
.th-p-leather-belts .belts-category{display:grid;grid-template-columns:40px minmax(104px,22%) minmax(0,1fr);gap:clamp(12px,2vw,28px);align-items:center;min-width:0;min-height:164px;padding:15px 0;border-bottom:1px solid var(--line);color:inherit;text-decoration:none}
.th-p-leather-belts .belts-category-index{align-self:start;padding-top:8px;color:var(--accent);font-size:10px;font-weight:800;letter-spacing:.13em}
.th-p-leather-belts .belts-category-loop{display:block;position:relative;aspect-ratio:1.3/1;overflow:hidden;border:1px solid var(--ink);border-radius:42% 8% 42% 8%;background:var(--panel);transform:rotate(-4deg)}
.th-p-leather-belts .belts-category-loop::before{position:absolute;z-index:1;inset:10%;border:1px solid color-mix(in srgb,var(--surface) 72%,transparent);border-radius:42% 8% 42% 8%;content:"";pointer-events:none}
.th-p-leather-belts .belts-category-media{position:absolute;inset:0;overflow:hidden}
.th-p-leather-belts .belts-category-media img{width:100%;height:100%;object-fit:cover;filter:saturate(.76) contrast(1.04);transition:transform .5s cubic-bezier(.2,.7,.2,1)}
.th-p-leather-belts .belts-category:hover .belts-category-media img{transform:scale(1.06)}
.th-p-leather-belts .belts-category-media i{position:absolute;top:50%;right:16%;left:16%;height:2px;background:var(--muted);transform:rotate(-13deg)}
.th-p-leather-belts .belts-category-media i::after{position:absolute;top:-12px;right:30%;width:24px;height:24px;border:1px solid var(--muted);border-radius:50%;content:""}
.th-p-leather-belts .belts-category-copy{display:grid;gap:5px;align-content:center;min-width:0}
.th-p-leather-belts .belts-category-copy b{overflow-wrap:anywhere;font-family:var(--display);font-size:clamp(25px,2.3vw,36px);font-weight:600;letter-spacing:-.045em;line-height:.95}
.th-p-leather-belts .belts-category-copy small{color:var(--muted);font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}
.th-p-leather-belts .belts-category-copy em{margin-top:7px;color:var(--accent);font-size:11px;font-style:normal;font-weight:800;letter-spacing:.06em}
.th-p-leather-belts .belts-category-copy em span{padding-left:3px;font-size:15px}
.th-p-leather-belts .belts-piece-discovery{align-items:start}
.th-p-leather-belts .belts-piece-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(12px,1.8vw,25px)}
.th-p-leather-belts .belts-piece{display:grid;position:relative;gap:12px;min-width:0;padding-top:9px;border-top:1px solid var(--ink);color:inherit;text-decoration:none}
.th-p-leather-belts .belts-piece-number{position:absolute;z-index:1;top:9px;left:0;padding:5px 8px;background:var(--accent);color:var(--on-accent);font-size:9px;font-weight:800;letter-spacing:.14em}
.th-p-leather-belts .belts-piece-media{position:relative;display:block;aspect-ratio:4/5;overflow:hidden;background:var(--panel)}
.th-p-leather-belts .belts-piece-media img{width:100%;height:100%;object-fit:cover;transition:transform .55s cubic-bezier(.2,.7,.2,1)}
.th-p-leather-belts .belts-piece:hover .belts-piece-media img{transform:scale(1.045)}
.th-p-leather-belts .belts-piece-media i{position:absolute;top:49%;right:17%;left:17%;height:1px;background:var(--muted);transform:rotate(-10deg)}
.th-p-leather-belts .belts-piece-media i::after{position:absolute;top:-17px;right:27%;width:34px;height:34px;border:1px solid var(--muted);border-radius:50%;content:""}
.th-p-leather-belts .belts-piece-copy{display:grid;gap:3px;min-width:0}
.th-p-leather-belts .belts-piece-copy b{overflow-wrap:anywhere;font-family:var(--display);font-size:calc(21px*var(--ts));font-weight:600;letter-spacing:-.03em;line-height:1}
.th-p-leather-belts .belts-piece-copy small{color:var(--muted);font-size:11px;line-height:1.35}
.th-p-leather-belts .belts-piece-copy em{margin-top:4px;color:var(--accent);font-size:12px;font-style:normal;font-weight:800}
.th-p-leather-belts #shop.sec{width:min(1320px,100%);margin:0 auto;padding:clamp(46px,7vw,96px) clamp(18px,4vw,70px) clamp(66px,9vw,128px);border-top:1px solid var(--line)}
.th-p-leather-belts #shop .sec-h{align-items:end;margin-bottom:clamp(29px,4.2vw,58px)}
.th-p-leather-belts #shop .sec-h h2{max-width:11ch;font-size:calc(clamp(44px,5vw,76px)*var(--ts));font-weight:600;letter-spacing:-.06em;line-height:.88}
.th-p-leather-belts .chips{gap:0;border:1px solid var(--ink);border-radius:0;overflow-x:auto;scrollbar-width:none}
.th-p-leather-belts .chip{min-height:44px;padding-inline:14px;border:0;border-right:1px solid var(--line);border-radius:0;font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
.th-p-leather-belts .chip:last-child{border-right:0}
.th-p-leather-belts .chip[aria-current]{background:var(--ink);color:var(--surface)}
.th-p-leather-belts .grid{gap:clamp(34px,4vw,64px) clamp(14px,2.4vw,34px)}
.th-p-leather-belts .pc{gap:13px;padding-top:9px;border-top:1px solid var(--ink);text-align:left}
.th-p-leather-belts .pc .im{border-radius:0;background:var(--panel)}
.th-p-leather-belts .pc .tag{top:0;left:0;border-radius:0;background:var(--accent);color:var(--on-accent);font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
.th-p-leather-belts .pc .bd{grid-template-columns:minmax(0,1fr) auto;gap:5px 12px;align-items:start}
.th-p-leather-belts .pc h3{font-family:var(--display);font-size:calc(25px*var(--ts));font-weight:600;letter-spacing:-.035em;line-height:.98}
.th-p-leather-belts .pc .pr{grid-column:2;grid-row:1;color:var(--accent);font-size:13px;font-weight:800}
.th-p-leather-belts .pc .rt{grid-column:1/-1;color:var(--muted)}
.th-p-leather-belts .pc .go{border-radius:0;background:var(--ink);color:var(--surface);font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}
.th-p-leather-belts .perks{border-color:var(--line);background:var(--surface)}
.th-p-leather-belts .perk svg{color:var(--accent)}
.th-p-leather-belts .ft{background:var(--foot)}
@media(max-width:900px){
  .th-p-leather-belts .belts-hero-stage{min-height:640px}
  .th-p-leather-belts .belts-hero-copy{max-width:min(570px,80%)}
  .th-p-leather-belts .belts-discovery{gap:44px}
  .th-p-leather-belts .belts-category{grid-template-columns:34px minmax(90px,25%) minmax(0,1fr)}
}
@media(max-width:700px){
  .th-p-leather-belts .hd .wrap{min-height:64px}
  .th-p-leather-belts .brand{font-size:calc(13px*var(--ts));letter-spacing:.15em}
  .th-p-leather-belts .belts-hero{min-height:0;padding:18px 16px 28px}
  .th-p-leather-belts .belts-hero::before{background:linear-gradient(90deg,transparent 0 16px,color-mix(in srgb,var(--ink) 15%,transparent) 16px 17px,transparent 17px)}
  .th-p-leather-belts .belts-hero-ruler{top:80px;bottom:55px;left:5px}
  .th-p-leather-belts .belts-hero-caption{top:20px;left:30px;font-size:8px}
  .th-p-leather-belts .belts-hero-caption span:last-child{display:none}
  .th-p-leather-belts .belts-hero-stage{display:grid;min-height:0;padding-top:54px}
  .th-p-leather-belts .belts-hero-topline{margin-left:0;margin-bottom:9px;font-size:8px;letter-spacing:.12em}
  .th-p-leather-belts .belts-main-media{grid-row:2;min-height:clamp(400px,106vw,530px)}
  .th-p-leather-belts .belts-main-media>.hero-media{object-position:56% center}
  .th-p-leather-belts .belts-main-wash{background:linear-gradient(0deg,rgba(29,22,17,.56),rgba(29,22,17,.02) 66%)}
  .th-p-leather-belts .belts-hero-copy{grid-column:1/-1;grid-row:2;align-self:end;max-width:calc(100% - 20px);margin:0 0 22px 18px;padding:22px 20px 20px;box-shadow:9px 9px 0 color-mix(in srgb,var(--ink) 16%,transparent)}
  .th-p-leather-belts .belts-copy h1{font-size:calc(clamp(45px,13vw,63px)*var(--hero))}
  .th-p-leather-belts .belts-copy h1.long{font-size:calc(clamp(33px,9.6vw,46px)*min(var(--hero),1.12))}
  .th-p-leather-belts .belts-copy .sub{font-size:13px}
  .th-p-leather-belts .belts-copy .btn{min-height:44px;padding-inline:15px;font-size:9px}
  .th-p-leather-belts .belts-detail-media{top:98px;right:14px;width:82px;border-width:5px}
  .th-p-leather-belts .belts-buckle-mark{right:17px;bottom:136px;width:66px;height:34px;border-width:1px;box-shadow:inset 0 0 0 4px color-mix(in srgb,var(--ink) 20%,transparent)}
  .th-p-leather-belts .belts-hero-baseline{gap:7px;padding:10px 0 0;font-size:8px}
  .th-p-leather-belts .belts-hero .motion-toggle{right:26px;bottom:43px}
  .th-p-leather-belts .belts-discovery{grid-template-columns:1fr;gap:29px;padding:58px 18px 68px}
  .th-p-leather-belts .belts-discovery-head h2{max-width:12ch;font-size:calc(clamp(40px,11vw,54px)*var(--ts))}
  .th-p-leather-belts .belts-category{grid-template-columns:28px 108px minmax(0,1fr);min-height:138px;gap:12px}
  .th-p-leather-belts .belts-category-copy b{font-size:clamp(22px,6.5vw,29px)}
  .th-p-leather-belts .belts-piece-list{grid-template-columns:repeat(2,minmax(0,1fr));gap:22px 14px}
  .th-p-leather-belts .belts-piece-copy b{font-size:calc(19px*var(--ts))}
  .th-p-leather-belts #shop.sec{padding:48px 18px 72px}
  .th-p-leather-belts #shop .sec-h{align-items:start;margin-bottom:31px}
  .th-p-leather-belts #shop .sec-h h2{font-size:calc(clamp(40px,10.8vw,53px)*var(--ts))}
  .th-p-leather-belts .chips{width:100%}
  .th-p-leather-belts .chip{flex:1 0 auto;padding-inline:12px}
  .th-p-leather-belts .pc h3{font-size:calc(21px*var(--ts))}
  .th-p-leather-belts .pc .bd{display:block}
  .th-p-leather-belts .pc .pr{display:block;margin-top:5px}
}
@media(max-width:390px){
  .th-p-leather-belts .belts-hero-topline p:first-child{max-width:16ch}
  .th-p-leather-belts .belts-hero-copy{max-width:calc(100% - 13px);margin-left:13px}
  .th-p-leather-belts .belts-copy .ctas{display:grid;width:100%}
  .th-p-leather-belts .belts-copy .btn{width:100%}
  .th-p-leather-belts .belts-category{grid-template-columns:24px 90px minmax(0,1fr)}
  .th-p-leather-belts .belts-category-copy em{font-size:10px}
}
`;
import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-denim-jeans',
  name: 'RIVET / LINE',
  for: 'Denim jeans, selvedge essentials, and everyday indigo staples',
  vibe: 'Sun-faded indigo, copper rivets, chalked worktable lines, and the satisfying gravity of a well-worn pair',
  category: 'Denim jeans and indigo essentials',
  group: 'fashion',
  display: 'Bodoni Moda',
  body: 'IBM Plex Sans',
  displayWeight: 700,
  tracking: '-.045em',
  colors: {
    bg: '#E7E0D4',
    surface: '#F3EEE5',
    ink: '#14263A',
    muted: '#627080',
    line: '#C9C0B1',
    accent: '#173B63',
    onAccent: '#F7F1E8',
    panel: '#D9D1C4',
    onPanel: '#14263A',
    foot: '#122337',
    onFoot: '#E9E2D5',
    bar: '#173B63',
    onBar: '#F7F1E8',
    badge: '#B76C3E',
    onBadge: '#FFFFFF',
  },
  header: 'stack',
  hero: 'editorial',
  card: 'boxed',
  ratio: '3/4',
  rCard: 2,
  rBtn: 0,
  motion: 'pan',
  copy: {
    eyebrow: 'Indigo worktable',
    collection: 'The line-up',
    cta: 'Shop the line',
    title: 'Find your own line.',
    subtitle: 'Indigo made for the turn, the crease, and the long way home.',
  },
});

export function hero(ctx) {
  const detail = ctx.pics[1]
    ? `<div class="dj-swatch"><div class="dj-swatch-media">${ctx.media(1, { lazy: true, decorative: true })}</div><span aria-hidden="true">in the weave</span></div>`
    : '';

  return `<section class="hero category-hero dj-worktable${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="dj-main-media">${ctx.media(0, { priority: true, lazy: false })}</div>
    <div class="dj-wash" aria-hidden="true"></div>
    <div class="dj-measure-mark dj-measure-top" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
    <div class="dj-measure-mark dj-measure-side" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
    <p class="dj-margin-note" aria-hidden="true"><span>01</span> made to move</p>
    <div class="dj-copy-wrap">${ctx.copy('dj-copy')}</div>
    ${detail}
    <span class="dj-copper-rivet dj-rivet-a" aria-hidden="true"></span>
    <span class="dj-copper-rivet dj-rivet-b" aria-hidden="true"></span>
    ${ctx.controls}
  </section>`;
}

export function discovery(ctx) {
  if (ctx.cats.length >= 2) {
    const drawers = ctx.cats.slice(0, 4).map((category, index) => `<a class="dj-drawer" href="${ctx.esc(ctx.categoryLink(category.name))}">
      <span class="dj-drawer-num" aria-hidden="true">0${index + 1}</span>
      <span class="dj-drawer-name">${ctx.esc(category.name)}</span>
      <span class="dj-drawer-count">${category.count} ${category.count === 1 ? 'piece' : 'pieces'}</span>
      <span class="dj-drawer-art">${category.image ? `<img src="${ctx.esc(category.image)}" alt="" loading="lazy" decoding="async">` : '<i aria-hidden="true"></i>'}</span>
      <span class="dj-drawer-go" aria-hidden="true">↗</span>
    </a>`).join('');
    return `<section class="theme-discovery dj-lineup" aria-labelledby="dj-lineup-title">
      <div class="dj-lineup-intro">
        <p class="dj-kicker">${ctx.esc(ctx.t.copy?.collection || 'The line-up')}</p>
        <h2 id="dj-lineup-title">Start with the shape that calls you.</h2>
        <p>Every drawer opens onto the live collection.</p>
        <a class="dj-shop-link" href="#shop">Browse all pieces <span aria-hidden="true">↓</span></a>
      </div>
      <div class="dj-drawers">${drawers}</div>
    </section>`;
  }

  if (!ctx.products.length) return '';
  const pieces = ctx.products.slice(0, 3).map((product, index) => `<a class="dj-piece" href="${ctx.esc(ctx.productLink(product))}">
    <span class="dj-piece-index" aria-hidden="true">0${index + 1}</span>
    <span class="dj-piece-image">${product.image_url ? `<img src="${ctx.esc(product.image_url)}" alt="${ctx.esc(product.alt_text || product.title)}" loading="lazy" decoding="async">` : '<i aria-hidden="true"></i>'}</span>
    <span class="dj-piece-copy"><b>${ctx.esc(product.title)}</b>${product.category ? `<small>${ctx.esc(product.category)}</small>` : ''}${product.price_cents != null ? `<em>${ctx.esc(ctx.money(product.price_cents, product.currency))}</em>` : ''}</span>
  </a>`).join('');
  return `<section class="theme-discovery dj-piece-table" aria-labelledby="dj-piece-title">
    <div class="dj-piece-heading"><p class="dj-kicker">First cut</p><h2 id="dj-piece-title">A few good places to begin.</h2></div>
    <div class="dj-pieces">${pieces}</div>
  </section>`;
}

export const css = `
.th-p-denim-jeans{background:var(--bg);color:var(--ink)}
.th-p-denim-jeans .hd{background:color-mix(in srgb,var(--bg) 94%,transparent);border-bottom:1px solid var(--line)}
.th-p-denim-jeans .hd .wrap{max-width:1540px;min-height:72px;padding-inline:clamp(16px,3.2vw,52px)}
.th-p-denim-jeans .brand{font-family:var(--body);font-size:calc(18px*var(--ts));font-weight:700;letter-spacing:.14em}
.th-p-denim-jeans .nav{gap:clamp(16px,2.5vw,36px);font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase}
.th-p-denim-jeans .nav a{background-size:0 1px}
.th-p-denim-jeans .nav a:hover,.th-p-denim-jeans .nav a[aria-current]{background-size:100% 1px}
.th-p-denim-jeans .cart{width:42px;height:42px;border:1px solid var(--ink);border-radius:0;background:var(--surface)}
.th-p-denim-jeans .cart b{border-radius:0;background:var(--accent);color:var(--on-accent)}

.th-p-denim-jeans .dj-worktable{position:relative;display:grid;isolation:isolate;min-height:min(760px,calc(100svh - 74px));overflow:hidden;margin:clamp(10px,1.6vw,24px);background:#53616A;color:#F5EEE3}
.th-p-denim-jeans .dj-main-media{position:absolute;inset:0;overflow:hidden;background:#53616A}
.th-p-denim-jeans .dj-main-media>.hero-media,.th-p-denim-jeans .dj-main-media>.theme-empty-media{width:100%;height:100%;min-height:100%;object-fit:cover;object-position:center center}
.th-p-denim-jeans .dj-main-media>.theme-empty-media{background:linear-gradient(135deg,#6B7680,#354D62);color:#F7F1E8}
.th-p-denim-jeans .dj-wash{position:absolute;z-index:1;inset:0;pointer-events:none;background:linear-gradient(90deg,rgba(14,31,47,.72) 0%,rgba(14,31,47,.3) 34%,rgba(14,31,47,.03) 63%),linear-gradient(0deg,rgba(10,23,35,.36),transparent 44%)}
.th-p-denim-jeans .dj-measure-mark{position:absolute;z-index:2;display:flex;gap:clamp(17px,2.3vw,34px);pointer-events:none}
.th-p-denim-jeans .dj-measure-mark i{display:block;width:1px;height:10px;background:rgba(245,238,227,.72)}
.th-p-denim-jeans .dj-measure-top{top:clamp(22px,3.5vw,52px);left:clamp(28px,4vw,68px)}
.th-p-denim-jeans .dj-measure-side{bottom:clamp(33px,4.5vw,70px);left:clamp(28px,4vw,68px);flex-direction:column;gap:clamp(17px,2.3vw,34px)}
.th-p-denim-jeans .dj-measure-side i{width:10px;height:1px}
.th-p-denim-jeans .dj-margin-note{position:absolute;z-index:2;right:clamp(23px,3vw,52px);top:clamp(25px,3.8vw,58px);display:flex;gap:10px;align-items:center;color:rgba(245,238,227,.92);font-size:10px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;writing-mode:vertical-rl}
.th-p-denim-jeans .dj-margin-note span{color:#D48B51;font-family:var(--display);font-size:18px;font-weight:700;letter-spacing:0}
.th-p-denim-jeans .dj-copy-wrap{position:relative;z-index:3;display:grid;align-self:end;max-width:min(790px,70%);padding:clamp(50px,8vw,122px) clamp(30px,6.5vw,102px) clamp(48px,7vw,100px)}
.th-p-denim-jeans .dj-copy{display:grid;justify-items:start;gap:clamp(13px,1.7vw,23px);text-shadow:0 2px 20px rgba(9,21,31,.38)}
.th-p-denim-jeans .dj-copy .eyebrow{font-size:10px;font-weight:700;letter-spacing:.2em;text-transform:uppercase}
.th-p-denim-jeans .dj-copy h1{max-width:9ch;font-size:calc(clamp(64px,8.5vw,140px)*var(--hero));font-weight:700;line-height:.78;letter-spacing:-.07em;text-wrap:balance;overflow-wrap:anywhere}
.th-p-denim-jeans .dj-copy h1.long{max-width:12ch;font-size:calc(clamp(43px,5.7vw,90px)*min(var(--hero),1.1));line-height:.88}
.th-p-denim-jeans .dj-copy .sub{max-width:38ch;font-size:clamp(14px,1.3vw,18px);line-height:1.55}
.th-p-denim-jeans .dj-copy .ctas{gap:9px;margin-top:5px}
.th-p-denim-jeans .dj-copy .btn{min-height:47px;padding-inline:21px;border:1px solid #F5EEE3;border-radius:0;background:#F5EEE3;color:#14304B;font-size:11px;font-weight:700;letter-spacing:.11em;text-shadow:none;text-transform:uppercase}
.th-p-denim-jeans .dj-copy .btn.ghost{background:rgba(20,43,62,.24);color:#F5EEE3}
.th-p-denim-jeans .dj-swatch{position:absolute;z-index:3;right:clamp(56px,7vw,120px);bottom:clamp(42px,6vw,92px);width:clamp(118px,14.5vw,204px);padding:8px;background:#EFE8DD;box-shadow:12px 12px 0 rgba(12,28,43,.18);color:#183855;transform:rotate(2.4deg)}
.th-p-denim-jeans .dj-swatch-media{position:relative;aspect-ratio:1/1;overflow:hidden;background:#84909A}
.th-p-denim-jeans .dj-swatch-media>.hero-media{width:100%;height:100%;object-fit:cover}
.th-p-denim-jeans .dj-swatch>span{display:block;padding:8px 2px 1px;font-size:9px;font-weight:700;letter-spacing:.14em;text-transform:uppercase}
.th-p-denim-jeans .dj-copper-rivet{position:absolute;z-index:2;width:clamp(12px,1.3vw,18px);height:clamp(12px,1.3vw,18px);border:1px solid rgba(251,218,170,.9);border-radius:50%;background:radial-gradient(circle at 35% 31%,#FFE4B1 0 8%,#C77B45 34%,#6D3822 76%);box-shadow:0 1px 4px rgba(0,0,0,.4)}
.th-p-denim-jeans .dj-rivet-a{right:clamp(27px,4.3vw,70px);bottom:clamp(32px,4vw,64px)}
.th-p-denim-jeans .dj-rivet-b{right:clamp(70px,8vw,135px);bottom:clamp(26px,3vw,47px)}
.th-p-denim-jeans .dj-worktable .motion-toggle{right:clamp(18px,2.3vw,34px);bottom:clamp(20px,2.3vw,34px);border:1px solid rgba(245,238,227,.75);border-radius:0;background:rgba(20,43,62,.75);color:#F5EEE3;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase}

.th-p-denim-jeans .dj-lineup{display:grid;grid-template-columns:minmax(250px,.77fr) minmax(0,1.23fr);max-width:1540px;margin:0 auto;padding:clamp(56px,8vw,118px) clamp(16px,3.2vw,52px);gap:clamp(36px,6vw,112px)}
.th-p-denim-jeans .dj-lineup-intro{display:grid;align-content:start;justify-items:start;gap:clamp(15px,2vw,24px);padding-top:clamp(0px,1.3vw,18px)}
.th-p-denim-jeans .dj-kicker{color:var(--accent);font-size:10px;font-weight:700;letter-spacing:.19em;text-transform:uppercase}
.th-p-denim-jeans .dj-lineup h2,.th-p-denim-jeans .dj-piece-heading h2{max-width:10ch;font-size:calc(clamp(42px,4.4vw,71px)*var(--ts));font-weight:700;line-height:.86;letter-spacing:-.055em;overflow-wrap:anywhere}
.th-p-denim-jeans .dj-lineup-intro>p:last-of-type{max-width:25ch;color:var(--muted);font-size:15px;line-height:1.55}
.th-p-denim-jeans .dj-shop-link{display:inline-flex;align-items:center;gap:12px;min-height:44px;margin-top:4px;border-bottom:1px solid currentColor;color:inherit;font-size:11px;font-weight:700;letter-spacing:.1em;text-decoration:none;text-transform:uppercase}
.th-p-denim-jeans .dj-shop-link:hover{color:var(--accent)}
.th-p-denim-jeans .dj-shop-link span{font-size:18px;line-height:1}
.th-p-denim-jeans .dj-drawers{display:grid;border-top:1px solid var(--ink)}
.th-p-denim-jeans .dj-drawer{position:relative;display:grid;grid-template-columns:46px minmax(0,1fr) auto 64px 27px;gap:clamp(10px,1.5vw,24px);align-items:center;min-height:102px;border-bottom:1px solid var(--ink);color:inherit;text-decoration:none}
.th-p-denim-jeans .dj-drawer::before{position:absolute;inset:0;z-index:-1;background:var(--accent);content:"";transform:scaleX(0);transform-origin:left}
.th-p-denim-jeans .dj-drawer:hover{color:var(--on-accent)}
.th-p-denim-jeans .dj-drawer:hover::before{transform:scaleX(1)}
.th-p-denim-jeans .dj-drawer-num{align-self:stretch;display:grid;place-items:center;border-right:1px solid var(--line);color:var(--accent);font-size:10px;font-weight:700;letter-spacing:.12em}
.th-p-denim-jeans .dj-drawer:hover .dj-drawer-num{border-color:rgba(247,241,232,.4);color:#E5A06B}
.th-p-denim-jeans .dj-drawer-name{min-width:0;font-family:var(--display);font-size:clamp(24px,2.2vw,35px);font-weight:700;line-height:.95;letter-spacing:-.04em;overflow-wrap:anywhere}
.th-p-denim-jeans .dj-drawer-count{font-size:10px;font-weight:700;letter-spacing:.1em;text-align:right;text-transform:uppercase;white-space:nowrap}
.th-p-denim-jeans .dj-drawer-art{position:relative;display:block;width:64px;height:64px;overflow:hidden;background:var(--panel)}
.th-p-denim-jeans .dj-drawer-art img{width:100%;height:100%;object-fit:cover;filter:saturate(.75)}
.th-p-denim-jeans .dj-drawer-art i{position:absolute;inset:13px;border:1px solid var(--muted);border-radius:50%;transform:rotate(-32deg)}
.th-p-denim-jeans .dj-drawer-go{font-size:22px;line-height:1;text-align:center}

.th-p-denim-jeans .dj-piece-table{display:grid;grid-template-columns:minmax(250px,.76fr) minmax(0,1.24fr);max-width:1540px;margin:0 auto;padding:clamp(56px,8vw,118px) clamp(16px,3.2vw,52px);gap:clamp(36px,6vw,112px);border-bottom:1px solid var(--line)}
.th-p-denim-jeans .dj-piece-heading{display:grid;align-content:start;gap:18px}
.th-p-denim-jeans .dj-pieces{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(12px,1.7vw,26px)}
.th-p-denim-jeans .dj-piece{position:relative;display:grid;gap:12px;min-width:0;color:inherit;text-decoration:none}
.th-p-denim-jeans .dj-piece-index{position:absolute;z-index:1;top:0;left:0;padding:7px 9px;background:var(--accent);color:var(--on-accent);font-size:10px;font-weight:700;letter-spacing:.1em}
.th-p-denim-jeans .dj-piece-image{position:relative;display:block;aspect-ratio:3/4;overflow:hidden;background:var(--panel)}
.th-p-denim-jeans .dj-piece-image img{width:100%;height:100%;object-fit:cover;filter:saturate(.82)}
.th-p-denim-jeans .dj-piece-image i{position:absolute;inset:24%;border:1px solid var(--muted);border-radius:48% 48% 42% 42%}
.th-p-denim-jeans .dj-piece-copy{display:grid;gap:4px;min-width:0}
.th-p-denim-jeans .dj-piece-copy b{font-family:var(--display);font-size:clamp(20px,1.8vw,28px);font-weight:700;line-height:.98;letter-spacing:-.035em;overflow-wrap:anywhere}
.th-p-denim-jeans .dj-piece-copy small{color:var(--muted);font-size:11px;line-height:1.35;overflow-wrap:anywhere}
.th-p-denim-jeans .dj-piece-copy em{margin-top:2px;color:var(--accent);font-size:12px;font-style:normal;font-weight:700}

.th-p-denim-jeans #shop.sec{max-width:1540px;margin:0 auto;padding:clamp(58px,8vw,116px) clamp(16px,3.2vw,52px) clamp(72px,9vw,132px)}
.th-p-denim-jeans #shop .sec-h{align-items:end;margin-bottom:clamp(26px,4vw,52px);padding-bottom:clamp(16px,2vw,26px);border-bottom:2px solid var(--ink)}
.th-p-denim-jeans #shop .sec-h h2{max-width:10ch;font-size:calc(clamp(45px,5vw,78px)*var(--ts));font-weight:700;line-height:.84;letter-spacing:-.055em}
.th-p-denim-jeans .chips{gap:7px;border-radius:0}
.th-p-denim-jeans .chip{min-height:44px;border:1px solid var(--line);border-radius:0;background:transparent;font-size:10px;font-weight:700;letter-spacing:.09em;text-transform:uppercase}
.th-p-denim-jeans .chip[aria-current]{border-color:var(--accent);background:var(--accent);color:var(--on-accent)}
.th-p-denim-jeans .grid{gap:clamp(30px,4vw,58px) clamp(12px,1.7vw,26px)}
.th-p-denim-jeans .pc{gap:12px;text-align:left}
.th-p-denim-jeans .pc .im{border-radius:0;background:var(--panel)}
.th-p-denim-jeans .pc .tag{top:0;left:0;border-radius:0;background:var(--badge);color:var(--on-badge);font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
.th-p-denim-jeans .pc .bd{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 10px;padding-top:3px}
.th-p-denim-jeans .pc h3{font-family:var(--display);font-size:calc(24px*var(--ts));font-weight:700;line-height:.95;letter-spacing:-.035em}
.th-p-denim-jeans .pc .pr{grid-column:2;grid-row:1;color:var(--accent);font-size:13px;font-weight:700}
.th-p-denim-jeans .pc .rt{grid-column:1/-1;color:var(--muted)}
.th-p-denim-jeans .pc .go{border-radius:0;background:var(--accent);color:var(--on-accent);font-size:10px;font-weight:700;letter-spacing:.09em;text-transform:uppercase}
.th-p-denim-jeans .perks{background:var(--surface);border-color:var(--line)}
.th-p-denim-jeans .perk svg{color:var(--accent)}
.th-p-denim-jeans .ft{background:var(--foot)}

@media(max-width:900px){
  .th-p-denim-jeans .dj-worktable{min-height:650px}
  .th-p-denim-jeans .dj-copy-wrap{max-width:76%}
  .th-p-denim-jeans .dj-swatch{right:54px;width:150px}
  .th-p-denim-jeans .dj-lineup,.th-p-denim-jeans .dj-piece-table{grid-template-columns:minmax(210px,.66fr) minmax(0,1.34fr);gap:36px}
  .th-p-denim-jeans .dj-drawer{grid-template-columns:36px minmax(0,1fr) auto 54px 22px;gap:12px;min-height:92px}
  .th-p-denim-jeans .dj-drawer-art{width:54px;height:54px}
}
@media(max-width:680px){
  .th-p-denim-jeans .hd .wrap{min-height:62px;padding-inline:16px}
  .th-p-denim-jeans .brand{font-size:16px;letter-spacing:.1em}
  .th-p-denim-jeans .dj-worktable{min-height:clamp(560px,148vw,660px);margin:0}
  .th-p-denim-jeans .dj-main-media>.hero-media{object-position:60% center}
  .th-p-denim-jeans .dj-wash{background:linear-gradient(0deg,rgba(10,24,37,.78),rgba(10,24,37,.08) 69%),linear-gradient(90deg,rgba(10,24,37,.36),transparent 76%)}
  .th-p-denim-jeans .dj-measure-top{top:20px;left:23px;gap:19px}
  .th-p-denim-jeans .dj-measure-top i:nth-last-child(-n+2){display:none}
  .th-p-denim-jeans .dj-measure-side{display:none}
  .th-p-denim-jeans .dj-margin-note{right:18px;top:20px;font-size:9px}
  .th-p-denim-jeans .dj-copy-wrap{max-width:100%;padding:38px 21px 32px;align-self:end}
  .th-p-denim-jeans .dj-copy{gap:13px}
  .th-p-denim-jeans .dj-copy h1{max-width:9ch;font-size:calc(clamp(59px,17.4vw,78px)*var(--hero));line-height:.78}
  .th-p-denim-jeans .dj-copy h1.long{max-width:11ch;font-size:calc(clamp(38px,11.5vw,53px)*min(var(--hero),1.1))}
  .th-p-denim-jeans .dj-copy .sub{max-width:31ch;font-size:14px}
  .th-p-denim-jeans .dj-copy .ctas{width:100%}
  .th-p-denim-jeans .dj-copy .btn{flex:1 1 160px;min-height:45px;padding-inline:14px}
  .th-p-denim-jeans .dj-swatch{right:22px;bottom:30px;width:104px;padding:5px;box-shadow:7px 7px 0 rgba(12,28,43,.18)}
  .th-p-denim-jeans .dj-swatch>span{padding:5px 1px 1px;font-size:7px;letter-spacing:.1em}
  .th-p-denim-jeans .dj-copper-rivet{display:none}
  .th-p-denim-jeans .dj-worktable .motion-toggle{right:14px;bottom:auto;top:104px;min-height:44px}
  .th-p-denim-jeans .dj-lineup,.th-p-denim-jeans .dj-piece-table{display:block;padding:52px 20px 62px}
  .th-p-denim-jeans .dj-lineup-intro{gap:15px;margin-bottom:34px}
  .th-p-denim-jeans .dj-lineup h2,.th-p-denim-jeans .dj-piece-heading h2{max-width:11ch;font-size:clamp(40px,11.5vw,55px)}
  .th-p-denim-jeans .dj-drawer{grid-template-columns:32px minmax(0,1fr) 46px 18px;gap:10px;min-height:82px}
  .th-p-denim-jeans .dj-drawer-count{display:none}
  .th-p-denim-jeans .dj-drawer-art{width:46px;height:46px}
  .th-p-denim-jeans .dj-drawer-name{font-size:clamp(23px,7vw,31px)}
  .th-p-denim-jeans .dj-piece-heading{margin-bottom:28px}
  .th-p-denim-jeans .dj-pieces{gap:22px 12px;grid-template-columns:repeat(2,minmax(0,1fr))}
  .th-p-denim-jeans .dj-piece:nth-child(3){grid-column:1/-1;grid-template-columns:minmax(0,.62fr) minmax(0,1fr);gap:14px;align-items:end}
  .th-p-denim-jeans .dj-piece:nth-child(3) .dj-piece-copy{padding-bottom:3px}
  .th-p-denim-jeans #shop.sec{padding:57px 20px 82px}
  .th-p-denim-jeans #shop .sec-h{align-items:start;gap:18px}
  .th-p-denim-jeans #shop .sec-h h2{font-size:calc(clamp(42px,11vw,56px)*var(--ts))}
  .th-p-denim-jeans .chips{width:100%;overflow-x:auto;scrollbar-width:none}
  .th-p-denim-jeans .chip{flex:1 0 auto}
  .th-p-denim-jeans .grid{gap:30px 13px}
  .th-p-denim-jeans .pc h3{font-size:calc(21px*var(--ts))}
  .th-p-denim-jeans .pc .bd{display:block}
  .th-p-denim-jeans .pc .pr{display:block;margin-top:5px}
}
@media(max-width:390px){
  .th-p-denim-jeans .dj-copy h1{font-size:calc(54px*var(--hero))}
  .th-p-denim-jeans .dj-copy .ctas{display:grid}
  .th-p-denim-jeans .dj-copy .btn{width:100%}
  .th-p-denim-jeans .dj-swatch{width:92px}
  .th-p-denim-jeans .dj-piece-copy b{font-size:19px}
}
`;

import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-boots',
  name: 'Cairn & Hide',
  for: 'Heritage leather boots and hardwearing footwear',
  vibe: 'Oxblood workshop light, weathered leather, and a highland field-note sensibility',
  category: 'Heritage leather boots',
  group: 'fashion',
  display: 'DM Serif Display',
  body: 'Work Sans',
  displayWeight: 400,
  tracking: '-.015em',
  colors: {
    bg: '#F3EDE1',
    surface: '#FBF7EF',
    ink: '#241810',
    muted: '#75685B',
    line: '#D7C8B5',
    accent: '#6F211B',
    onAccent: '#FFF8ED',
    panel: '#E6DAC8',
    onPanel: '#241810',
    foot: '#241810',
    onFoot: '#F3EDE1',
    bar: '#6F211B',
    onBar: '#FFF8ED',
    badge: '#C79A54',
    onBadge: '#241810',
  },
  header: 'split',
  hero: 'collage',
  card: 'minimal',
  ratio: '4/5',
  rCard: 0,
  rBtn: 0,
  motion: 'pan',
  copy: {
    eyebrow: 'Boot room notes',
    collection: 'A field-minded footwear edit',
    cta: 'Shop boots',
    title: 'Made for the long way',
    subtitle: 'Boots for days that ask a little more.',
  },
});

export function hero(ctx) {
  const hasDetail = Boolean(ctx.pics[1]);
  return `<section class="hero category-hero boots-hero${ctx.heroClass}"${ctx.heroAttrs}>
    <aside class="boots-rail" aria-label="${ctx.esc(ctx.store.store_name)} field notes">
      <span class="boots-rail-rule" aria-hidden="true"></span>
      <p class="boots-rail-kicker">Field notes</p>
      <p class="boots-rail-index" aria-hidden="true">01 /</p>
      <p class="boots-rail-store">${ctx.esc(ctx.store.store_name)}</p>
      <span class="boots-rail-terrain" aria-hidden="true">ground<br>weather<br>distance</span>
    </aside>
    <div class="boots-hero-core">
      <div class="boots-main-media">
        ${ctx.media(0, { priority: true, lazy: false })}
        <div class="boots-main-shade" aria-hidden="true"></div>
        <div class="boots-hero-copy">${ctx.copy('boots-copy')}</div>
      </div>
      <aside class="boots-detail-panel">
        ${hasDetail ? `<div class="boots-detail-media">${ctx.media(1, { lazy: true, decorative: true })}</div>` : '<div class="boots-detail-empty" aria-hidden="true"><span></span></div>'}
        <div class="boots-detail-caption"><span>Small details</span><strong>Longer journeys</strong><i aria-hidden="true"></i></div>
      </aside>
    </div>
    ${ctx.controls}
  </section>`;
}

export function discovery(ctx) {
  if (ctx.cats.length >= 2) {
    const paths = ctx.cats.slice(0, 3).map((cat, index) => `<a class="boots-path" href="${ctx.esc(ctx.categoryLink(cat.name))}">
      <span class="boots-path-number" aria-hidden="true">0${index + 1}</span>
      <span class="boots-path-media">${cat.image ? `<img src="${ctx.esc(cat.image)}" alt="" loading="lazy" decoding="async">` : '<i aria-hidden="true"></i>'}</span>
      <span class="boots-path-copy"><b>${ctx.esc(cat.name)}</b><small>${cat.count} ${cat.count === 1 ? 'product' : 'products'}</small><em>Explore the edit <span aria-hidden="true">→</span></em></span>
    </a>`).join('');
    return `<section class="theme-discovery boots-discovery" aria-labelledby="boots-paths-title">
      <div class="boots-discovery-intro">
        <p class="boots-discovery-kicker">Field notes</p>
        <h2 id="boots-paths-title">Choose your direction.</h2>
        <p>Find the collection that meets you where you are.</p>
      </div>
      <div class="boots-paths">${paths}</div>
    </section>`;
  }

  if (!ctx.products.length) return '';
  const pieces = ctx.products.slice(0, 3).map((product, index) => `<a class="boots-piece" href="${ctx.esc(ctx.productLink(product))}">
    <span class="boots-piece-number" aria-hidden="true">0${index + 1}</span>
    <span class="boots-piece-media">${product.image_url ? `<img src="${ctx.esc(product.image_url)}" alt="${ctx.esc(product.alt_text || product.title)}" loading="lazy" decoding="async">` : '<i aria-hidden="true"></i>'}</span>
    <span class="boots-piece-copy"><b>${ctx.esc(product.title)}</b>${product.category ? `<small>${ctx.esc(product.category)}</small>` : ''}${product.price_cents != null ? `<em>${ctx.esc(ctx.money(product.price_cents, product.currency))}</em>` : ''}</span>
  </a>`).join('');
  return `<section class="theme-discovery boots-discovery boots-discovery-pieces" aria-labelledby="boots-pieces-title">
    <div class="boots-discovery-intro">
      <p class="boots-discovery-kicker">The first steps</p>
      <h2 id="boots-pieces-title">Begin at the threshold.</h2>
    </div>
    <div class="boots-pieces">${pieces}</div>
  </section>`;
}

export const css = `
.th-p-boots{background:var(--bg);color:var(--ink)}
.th-p-boots .ann{font-size:11px;letter-spacing:.16em;text-transform:uppercase}
.th-p-boots .hd{background:color-mix(in srgb,var(--bg) 92%,transparent);border-bottom-color:color-mix(in srgb,var(--ink) 18%,transparent)}
.th-p-boots .hd .wrap{max-width:1440px;min-height:70px}
.th-p-boots .brand{font-size:calc(27px*var(--ts));letter-spacing:.06em}
.th-p-boots .nav{gap:clamp(16px,2.4vw,34px);font-size:13px;letter-spacing:.075em;text-transform:uppercase}
.th-p-boots .nav a{background-size:0 1px}
.th-p-boots .nav a:hover,.th-p-boots .nav a[aria-current]{background-size:100% 1px}
.th-p-boots .cart{border:1px solid var(--line);border-radius:0;width:42px;height:42px}
.th-p-boots .cart b{border-radius:0}
.th-p-boots .boots-hero{display:grid;grid-template-columns:clamp(120px,11.25vw,180px) minmax(0,1fr);min-height:min(760px,calc(100svh - 104px));background:#2a130f;color:#fff4e4;isolation:isolate}
.th-p-boots .boots-rail{display:flex;position:relative;z-index:2;flex-direction:column;align-items:flex-start;gap:clamp(14px,2vh,22px);min-width:0;padding:clamp(24px,3.1vw,48px) clamp(16px,2.3vw,36px);background:linear-gradient(150deg,#571c19 0%,#39110f 72%,#2a130f 100%);color:#f2d9c2}
.th-p-boots .boots-rail-rule{width:30px;height:1px;background:currentColor;opacity:.75}
.th-p-boots .boots-rail-kicker{font-size:10px;font-weight:600;letter-spacing:.19em;line-height:1.35;text-transform:uppercase}
.th-p-boots .boots-rail-index{margin-top:auto;font-family:var(--display);font-size:clamp(24px,2vw,34px);letter-spacing:.03em;line-height:1}
.th-p-boots .boots-rail-store{max-width:7ch;font-family:var(--display);font-size:clamp(17px,1.55vw,23px);letter-spacing:.02em;line-height:1.05;overflow-wrap:anywhere}
.th-p-boots .boots-rail-terrain{font-size:9px;font-weight:600;letter-spacing:.16em;line-height:1.75;text-transform:uppercase;opacity:.72}
.th-p-boots .boots-hero-core{display:grid;grid-template-columns:minmax(0,1fr) clamp(200px,21vw,336px);min-width:0}
.th-p-boots .boots-main-media{position:relative;min-width:0;overflow:hidden;background:#4b2d1c}
.th-p-boots .boots-main-media>.hero-media,.th-p-boots .boots-main-media>.theme-empty-media{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.th-p-boots .boots-main-media>.theme-empty-media{min-height:100%;background:linear-gradient(135deg,#51311e,#271712);color:#e8ceb3}
.th-p-boots .boots-main-shade{position:absolute;inset:0;background:linear-gradient(180deg,transparent 32%,rgba(11,5,3,.23) 57%,rgba(11,5,3,.79) 100%),linear-gradient(90deg,rgba(11,5,3,.18),transparent 55%);pointer-events:none}
.th-p-boots .boots-hero-copy{position:absolute;z-index:1;left:clamp(22px,4vw,64px);right:clamp(22px,4vw,64px);bottom:clamp(30px,6vh,78px);max-width:min(760px,100%)}
.th-p-boots .boots-hero-copy .txt{display:grid;gap:clamp(12px,1.8vw,22px);justify-items:start;color:#fff4e4;text-shadow:0 2px 22px rgba(8,4,2,.5)}
.th-p-boots .boots-hero-copy .eyebrow{font-size:10px;font-weight:600;letter-spacing:.25em;line-height:1.4;text-transform:uppercase;opacity:.9}
.th-p-boots .boots-hero-copy h1{max-width:12ch;font-size:calc(clamp(44px,5.7vw,94px)*var(--hero));letter-spacing:-.035em;line-height:.88;text-wrap:balance}
.th-p-boots .boots-hero-copy h1.long{max-width:15ch;font-size:calc(clamp(34px,4.25vw,68px)*min(var(--hero),1.1));line-height:.94}
.th-p-boots .boots-hero-copy .sub{max-width:37ch;font-size:clamp(14px,1.25vw,18px);line-height:1.55;opacity:.9}
.th-p-boots .boots-hero-copy .ctas{gap:10px;margin-top:4px}
.th-p-boots .boots-hero-copy .btn{min-height:46px;padding-inline:21px;border:1px solid #f5d6b2;border-radius:0;background:#d0a056;color:#2c1810;font-size:12px;letter-spacing:.08em;text-shadow:none;text-transform:uppercase}
.th-p-boots .boots-hero-copy .btn.ghost{background:rgba(20,8,5,.3);color:#fff4e4}
.th-p-boots .boots-detail-panel{display:flex;position:relative;flex-direction:column;min-width:0;overflow:hidden;background:#1f1210;border-left:1px solid rgba(255,244,228,.36)}
.th-p-boots .boots-detail-media{position:absolute;inset:0;overflow:hidden}
.th-p-boots .boots-detail-media>.hero-media{width:100%;height:100%;object-fit:cover;filter:saturate(.72) contrast(1.08) brightness(.64)}
.th-p-boots .boots-detail-empty{position:absolute;inset:0;overflow:hidden;background:radial-gradient(circle at 18% 18%,#80583b 0 2%,transparent 2.5%),radial-gradient(circle at 72% 44%,#4e2b1f 0 3%,transparent 3.5%),repeating-linear-gradient(132deg,#342018 0 2px,#291710 2px 8px);opacity:.88}
.th-p-boots .boots-detail-empty::before{position:absolute;inset:-10%;border:1px solid rgba(233,191,135,.42);border-radius:50% 38% 52% 44%;content:"";transform:rotate(-20deg)}
.th-p-boots .boots-detail-empty span{position:absolute;inset:13%;border:1px solid rgba(233,191,135,.32);border-radius:46% 58% 40% 64%}
.th-p-boots .boots-detail-panel::after{position:absolute;inset:0;background:linear-gradient(180deg,rgba(14,6,3,.18),rgba(14,6,3,.86));content:"";pointer-events:none}
.th-p-boots .boots-detail-caption{position:relative;z-index:1;display:grid;gap:5px;margin-top:auto;padding:clamp(22px,2.6vw,38px) clamp(18px,2.5vw,34px);color:#f8e4cf;text-align:center;text-shadow:0 2px 16px rgba(0,0,0,.66)}
.th-p-boots .boots-detail-caption span{font-size:9px;font-weight:600;letter-spacing:.2em;text-transform:uppercase}
.th-p-boots .boots-detail-caption strong{font-family:var(--display);font-size:clamp(19px,1.8vw,28px);font-weight:400;letter-spacing:.01em;line-height:1.05}
.th-p-boots .boots-detail-caption i{width:28px;height:1px;margin:12px auto 0;background:#f8e4cf}
.th-p-boots .boots-hero .motion-toggle{right:clamp(16px,2vw,28px);bottom:clamp(16px,2vw,28px);border-color:rgba(255,244,228,.6);border-radius:0;background:rgba(35,13,9,.7);color:#fff4e4;font-size:11px;letter-spacing:.08em;text-transform:uppercase}
.th-p-boots .boots-discovery{display:grid;grid-template-columns:minmax(220px,.66fr) minmax(0,1.34fr);gap:clamp(26px,5.5vw,92px);max-width:1440px;margin:0 auto;padding:clamp(56px,8vw,120px) clamp(16px,4vw,56px);border-bottom:1px solid var(--line)}
.th-p-boots .boots-discovery-intro{align-self:start;padding-top:clamp(0px,2vw,22px)}
.th-p-boots .boots-discovery-kicker{margin-bottom:10px;color:var(--accent);font-size:10px;font-weight:700;letter-spacing:.2em;text-transform:uppercase}
.th-p-boots .boots-discovery h2{max-width:8ch;font-size:calc(clamp(38px,4.2vw,66px)*var(--ts));line-height:.93}
.th-p-boots .boots-discovery-intro>p:last-child{max-width:25ch;margin-top:20px;color:var(--muted);font-size:15px;line-height:1.6}
.th-p-boots .boots-paths{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-top:1px solid var(--line)}
.th-p-boots .boots-path{position:relative;display:grid;grid-template-rows:auto 1fr auto;min-width:0;min-height:340px;padding:16px 0 0;color:inherit;text-decoration:none}
.th-p-boots .boots-path+.boots-path{border-left:1px solid var(--line);padding-left:clamp(14px,2vw,28px)}
.th-p-boots .boots-path:not(:last-child){padding-right:clamp(14px,2vw,28px)}
.th-p-boots .boots-path-number{color:var(--accent);font-size:10px;font-weight:700;letter-spacing:.16em}
.th-p-boots .boots-path-media{position:relative;display:grid;min-height:160px;place-items:center;overflow:hidden;margin:16px 0 18px;background:var(--panel)}
.th-p-boots .boots-path-media img{width:100%;height:100%;object-fit:cover;transition:transform .6s cubic-bezier(.2,.7,.2,1)}
.th-p-boots .boots-path:hover .boots-path-media img{transform:scale(1.045)}
.th-p-boots .boots-path-media i{position:relative;display:block;width:72%;height:1px;background:var(--muted);opacity:.7;transform:rotate(-8deg)}
.th-p-boots .boots-path-media i::before,.th-p-boots .boots-path-media i::after{position:absolute;bottom:0;width:58%;height:26px;border-top:1px solid var(--muted);content:""}
.th-p-boots .boots-path-media i::before{left:3%;transform:skewX(37deg)}
.th-p-boots .boots-path-media i::after{right:3%;transform:skewX(-37deg)}
.th-p-boots .boots-path-copy{display:grid;gap:4px;align-content:start}
.th-p-boots .boots-path-copy b{font-family:var(--display);font-size:clamp(21px,2vw,30px);font-weight:400;letter-spacing:-.015em;line-height:1}
.th-p-boots .boots-path-copy small{color:var(--muted);font-size:11px;font-weight:600;letter-spacing:.09em;text-transform:uppercase}
.th-p-boots .boots-path-copy em{margin-top:15px;color:var(--accent);font-size:12px;font-style:normal;font-weight:600;letter-spacing:.04em}
.th-p-boots .boots-path-copy em span{padding-left:4px;font-size:15px}
.th-p-boots .boots-discovery-pieces{align-items:start}
.th-p-boots .boots-pieces{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(10px,1.3vw,18px)}
.th-p-boots .boots-piece{display:grid;position:relative;gap:12px;min-width:0;color:inherit;text-decoration:none}
.th-p-boots .boots-piece-number{position:absolute;z-index:1;top:10px;left:10px;padding:4px 6px;background:var(--bg);color:var(--accent);font-size:10px;font-weight:700;letter-spacing:.14em}
.th-p-boots .boots-piece-media{display:grid;aspect-ratio:4/5;place-items:center;overflow:hidden;background:var(--panel)}
.th-p-boots .boots-piece-media img{width:100%;height:100%;object-fit:cover;transition:transform .6s cubic-bezier(.2,.7,.2,1)}
.th-p-boots .boots-piece:hover .boots-piece-media img{transform:scale(1.045)}
.th-p-boots .boots-piece-media i{width:44%;height:44%;border:1px solid var(--muted);border-radius:50% 48% 45% 52%;opacity:.55}
.th-p-boots .boots-piece-copy{display:grid;gap:2px}
.th-p-boots .boots-piece-copy b{font-family:var(--display);font-size:19px;font-weight:400;line-height:1.1}
.th-p-boots .boots-piece-copy small{color:var(--muted);font-size:12px;line-height:1.35}
.th-p-boots .boots-piece-copy em{margin-top:3px;font-size:13px;font-style:normal;font-weight:600}
.th-p-boots #shop.sec{max-width:1440px;margin:0 auto;padding-inline:clamp(16px,4vw,56px)}
.th-p-boots #shop .sec-h{align-items:center;margin-bottom:clamp(28px,4vw,54px);padding-top:clamp(46px,7vw,92px);border-top:1px solid var(--line)}
.th-p-boots #shop .sec-h h2{font-size:calc(clamp(40px,4.6vw,70px)*var(--ts));letter-spacing:-.025em}
.th-p-boots .chips{gap:0;border:1px solid var(--line);border-right:0;border-radius:0;overflow-x:auto;scrollbar-width:none}
.th-p-boots .chip{min-height:44px;padding:0 13px;border:0;border-right:1px solid var(--line);border-radius:0;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase}
.th-p-boots .chip[aria-current]{background:var(--accent);border-color:var(--accent);color:var(--on-accent)}
.th-p-boots .grid{gap:clamp(34px,4vw,64px) clamp(14px,2vw,30px)}
.th-p-boots .pc{gap:12px;padding-top:10px;border-top:1px solid var(--line);text-align:left}
.th-p-boots .pc .im{border-radius:0;background:var(--panel)}
.th-p-boots .pc .tag{top:0;left:0;border-radius:0;background:var(--accent);color:var(--on-accent);font-size:10px;letter-spacing:.08em;text-transform:uppercase}
.th-p-boots .pc .bd{grid-template-columns:minmax(0,1fr) auto;gap:4px 12px;align-items:start}
.th-p-boots .pc h3{font-family:var(--display);font-size:calc(22px*var(--ts));font-weight:400;letter-spacing:-.01em;line-height:1.08}
.th-p-boots .pc .pr{grid-column:2;grid-row:1;color:var(--accent);font-size:13px;font-weight:600}
.th-p-boots .pc .rt{grid-column:1/-1;color:var(--muted)}
.th-p-boots .pc .go{border-radius:0;background:var(--accent);color:var(--on-accent);font-size:11px;letter-spacing:.06em;text-transform:uppercase}
.th-p-boots .perks{background:var(--surface);border-color:var(--line)}
.th-p-boots .perk svg{color:var(--accent)}
.th-p-boots .ft{background:#241810}
@media(max-width:960px){
  .th-p-boots .boots-hero{grid-template-columns:104px minmax(0,1fr)}
  .th-p-boots .boots-hero-core{grid-template-columns:minmax(0,1fr) 220px}
  .th-p-boots .boots-rail{padding-inline:16px}
  .th-p-boots .boots-paths{grid-template-columns:repeat(2,minmax(0,1fr))}
  .th-p-boots .boots-path:last-child{grid-column:span 2;border-left:0;border-top:1px solid var(--line);padding-left:0;padding-right:0}
  .th-p-boots .boots-path:last-child .boots-path-media{min-height:190px}
}
@media(max-width:720px){
  .th-p-boots .boots-hero{display:block;min-height:0}
  .th-p-boots .boots-rail{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;min-height:56px;padding:10px 16px}
  .th-p-boots .boots-rail-kicker{display:none}
  .th-p-boots .boots-rail-index{margin:0;font-size:20px}
  .th-p-boots .boots-rail-store{max-width:none;font-size:16px;text-align:center}
  .th-p-boots .boots-rail-terrain{display:none}
  .th-p-boots .boots-hero-core{display:block}
  .th-p-boots .boots-main-media{min-height:clamp(440px,122vw,600px)}
  .th-p-boots .boots-main-media>.hero-media{object-position:43% center}
  .th-p-boots .boots-detail-panel{min-height:130px;border-top:1px solid rgba(255,244,228,.36);border-left:0}
  .th-p-boots .boots-detail-media>.hero-media{object-position:center 62%}
  .th-p-boots .boots-detail-caption{margin:auto;padding:20px 22px}
  .th-p-boots .boots-hero-copy{left:20px;right:20px;bottom:30px}
  .th-p-boots .boots-hero-copy h1{max-width:11ch;font-size:calc(clamp(43px,13vw,64px)*var(--hero))}
  .th-p-boots .boots-hero-copy h1.long{font-size:calc(clamp(32px,9.5vw,48px)*min(var(--hero),1.1))}
  .th-p-boots .boots-hero-copy .sub{font-size:14px}
  .th-p-boots .boots-hero-copy .btn{min-height:44px;padding-inline:16px;font-size:11px}
  .th-p-boots .boots-hero .motion-toggle{right:16px;bottom:147px}
  .th-p-boots .boots-discovery{grid-template-columns:1fr;gap:28px;padding-block:52px 64px}
  .th-p-boots .boots-discovery h2{max-width:11ch}
  .th-p-boots .boots-paths{grid-template-columns:1fr}
  .th-p-boots .boots-path,.th-p-boots .boots-path:last-child{grid-column:auto;grid-template-columns:26px minmax(100px,.75fr) minmax(0,1fr);grid-template-rows:1fr;min-height:142px;gap:12px;padding:14px 0}
  .th-p-boots .boots-path+.boots-path,.th-p-boots .boots-path:last-child{border-top:1px solid var(--line);border-left:0;padding-left:0;padding-right:0}
  .th-p-boots .boots-path-media,.th-p-boots .boots-path:last-child .boots-path-media{min-height:112px;margin:0}
  .th-p-boots .boots-path-copy{align-content:center}
  .th-p-boots .boots-path-copy em{margin-top:8px}
  .th-p-boots .boots-pieces{grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
  .th-p-boots #shop.sec{padding-bottom:68px}
  .th-p-boots #shop .sec-h{padding-top:48px}
  .th-p-boots #shop .sec-h h2{font-size:calc(clamp(38px,10vw,52px)*var(--ts))}
  .th-p-boots .chips{width:100%}
  .th-p-boots .chip{flex:1 0 auto;text-align:center}
  .th-p-boots .pc h3{font-size:calc(19px*var(--ts))}
  .th-p-boots .pc .bd{display:block}
  .th-p-boots .pc .pr{display:block;margin-top:5px}
}
@media(max-width:390px){
  .th-p-boots .boots-main-media{min-height:470px}
  .th-p-boots .boots-hero-copy .ctas{display:grid;width:100%}
  .th-p-boots .boots-hero-copy .btn{width:100%}
  .th-p-boots .boots-piece-copy b{font-size:17px}
}
`;

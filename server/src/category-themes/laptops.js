import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-laptops',
  name: 'FOLD / STUDIO',
  for: 'Portable laptops for focused work wherever it takes shape',
  vibe: 'A paper-and-patina field studio with quiet graphite hardware and warm afternoon light',
  category: 'Portable laptops for creative and flexible work',
  group: 'technology',
  display: 'Bodoni Moda',
  body: 'DM Mono',
  displayWeight: 500,
  tracking: '-.055em',
  colors: {
    bg: '#E9E2D5',
    surface: '#F8F3EA',
    ink: '#1C292C',
    muted: '#69716D',
    line: '#C8BFB1',
    accent: '#B94730',
    onAccent: '#FFF8EF',
    panel: '#20383B',
    onPanel: '#F4EBDD',
    foot: '#172225',
    onFoot: '#EAE2D5',
    bar: '#2B4447',
    onBar: '#FFF5E8',
    badge: '#D3DCCF',
    onBadge: '#1C302F',
  },
  header: 'stack',
  hero: 'collage',
  card: 'boxed',
  ratio: '16/10',
  rCard: 0,
  rBtn: 999,
  motion: 'drift',
  copy: {
    eyebrow: 'Portable practice',
    collection: 'The folding desk',
    cta: 'Open the catalog',
    title: 'Make room for the work.',
    subtitle: 'A composed edit of laptops for desks that move with you.',
  },
});

const categoriesFor = (ctx) => (Array.isArray(ctx.cats) ? ctx.cats : []).filter((category) => category?.name);
const productsFor = (ctx) => (Array.isArray(ctx.products) ? ctx.products : []).filter(Boolean);

const countText = (count) => {
  const value = Number(count);
  return Number.isFinite(value) ? `${value} ${value === 1 ? 'piece' : 'pieces'}` : '';
};

const productPrice = (ctx, product) => {
  const price = Number(product?.price_cents);
  return Number.isFinite(price) ? ctx.money(price, product.currency, product?.billing_interval) : '';
};

const heroRoute = (ctx, category, index) => {
  const count = countText(category.count);
  return `<a class="laptop-field__route" href="${ctx.esc(ctx.categoryLink(category.name))}">
    <span class="laptop-field__route-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
    <span class="laptop-field__route-name">${ctx.esc(category.name)}</span>
    ${count ? `<small>${ctx.esc(count)}</small>` : ''}
    <span class="laptop-field__route-arrow" aria-hidden="true">↗</span>
  </a>`;
};

const categorySheet = (ctx, category, index) => {
  const count = countText(category.count);
  const visual = category.image
    ? `<img src="${ctx.esc(category.image)}" alt="" loading="lazy" decoding="async">`
    : `<span class="laptop-drawer__blank" aria-hidden="true"><i></i><i></i></span>`;

  return `<a class="laptop-drawer__sheet" href="${ctx.esc(ctx.categoryLink(category.name))}">
    <span class="laptop-drawer__number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
    <span class="laptop-drawer__image">${visual}</span>
    <span class="laptop-drawer__meta"><b>${ctx.esc(category.name)}</b>${count ? `<small>${ctx.esc(count)}</small>` : ''}</span>
    <span class="laptop-drawer__arrow" aria-hidden="true">↗</span>
  </a>`;
};

const productSheet = (ctx, product, index) => {
  const price = productPrice(ctx, product);
  return `<a class="laptop-drawer__product" href="${ctx.esc(ctx.productLink(product))}">
    <span class="laptop-drawer__number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
    <span class="laptop-drawer__meta"><b>${ctx.esc(product.title)}</b>${price ? `<small>${ctx.esc(price)}</small>` : ''}</span>
    <span class="laptop-drawer__arrow" aria-hidden="true">↗</span>
  </a>`;
};

export function hero(ctx) {
  const categories = categoriesFor(ctx).slice(0, 4);
  const routes = categories.length
    ? `<nav class="laptop-field__index" aria-label="Browse laptop categories"><p>Open by category</p>${categories.map((category, index) => heroRoute(ctx, category, index)).join('')}</nav>`
    : '';

  return `<section class="hero category-hero laptop-field${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="laptop-field__canvas">
      <div class="laptop-field__media">${ctx.media(0, { priority: true, lazy: false, decorative: true })}</div>
      <p class="laptop-field__folio" aria-hidden="true"><span>FIELD NOTE</span><b>01</b></p>
      <div class="laptop-field__copy-card">${ctx.copy('laptop-field__copy')}</div>
      ${routes}
      <span class="laptop-field__corner laptop-field__corner--top" aria-hidden="true"></span>
      <span class="laptop-field__corner laptop-field__corner--bottom" aria-hidden="true"></span>
    </div>
    ${ctx.controls}
  </section>`;
}

export function discovery(ctx) {
  const categories = categoriesFor(ctx);
  const products = productsFor(ctx);

  if (categories.length >= 2) {
    return `<section class="theme-discovery laptop-drawer" aria-labelledby="laptop-drawer-title">
      <div class="laptop-drawer__heading">
        <div><p class="laptop-drawer__eyebrow">The working shelf</p><h2 id="laptop-drawer-title">Choose a place to begin.</h2></div>
        <p>Browse the live categories your store has ready for the next desk.</p>
      </div>
      <div class="laptop-drawer__sheets">${categories.slice(0, 4).map((category, index) => categorySheet(ctx, category, index)).join('')}</div>
      <a class="laptop-drawer__all" href="#shop">See every available laptop <span aria-hidden="true">→</span></a>
    </section>`;
  }

  if (!products.length) return '';

  return `<section class="theme-discovery laptop-drawer laptop-drawer--products" aria-labelledby="laptop-drawer-title">
    <div class="laptop-drawer__heading">
      <div><p class="laptop-drawer__eyebrow">On the desk</p><h2 id="laptop-drawer-title">Start with what is here.</h2></div>
      <p>Available pieces from this current laptop edit.</p>
    </div>
    <div class="laptop-drawer__products">${products.slice(0, 4).map((product, index) => productSheet(ctx, product, index)).join('')}</div>
    <a class="laptop-drawer__all" href="#shop">See every available laptop <span aria-hidden="true">→</span></a>
  </section>`;
}

export const css = `
.th-p-laptops{background:var(--bg);color:var(--ink)}
.th-p-laptops .hd{background:color-mix(in srgb,var(--bg) 94%,#fff 6%);border-bottom:1px solid var(--line);box-shadow:none}
.th-p-laptops .hd .wrap{max-width:1540px}
.th-p-laptops .hd .brand{font-family:var(--body);font-size:clamp(.67rem,1vw,.78rem);font-weight:700;letter-spacing:.19em;text-transform:uppercase}
.th-p-laptops .hd .nav{gap:clamp(15px,2.2vw,31px)}
.th-p-laptops .hd .nav a{font:500 .69rem/1.1 var(--body);letter-spacing:.07em;text-transform:uppercase}
.th-p-laptops .hd .cart{border-radius:999px;border-color:var(--ink)}
.th-p-laptops .laptop-field{position:relative;overflow:hidden;padding:clamp(12px,2.4vw,38px);background:var(--bg)}
.th-p-laptops .laptop-field__canvas{position:relative;isolation:isolate;display:grid;grid-template-columns:minmax(0,1.22fr) minmax(190px,.48fr);grid-template-rows:minmax(0,1fr);width:min(100%,1560px);min-height:clamp(590px,55vw,770px);margin:auto;overflow:hidden;background:#263B3D;border:1px solid color-mix(in srgb,var(--ink) 42%,transparent)}
.th-p-laptops .laptop-field__media{position:relative;z-index:-2;grid-column:1/-1;grid-row:1;overflow:hidden;background:linear-gradient(135deg,#4C5E5B,#182E33)}
.th-p-laptops .laptop-field__media::after{position:absolute;inset:0;content:"";pointer-events:none;background:linear-gradient(90deg,rgba(20,33,35,.22),transparent 42%,rgba(15,25,27,.31)),linear-gradient(0deg,rgba(19,31,32,.35),transparent 44%)}
.th-p-laptops .laptop-field__media .hero-media,.th-p-laptops .laptop-field__media .theme-empty-media{display:block;width:100%;height:100%;min-height:100%;object-fit:cover;object-position:center;filter:saturate(.7) contrast(1.04)}
.th-p-laptops .laptop-field__media .theme-empty-media{background:radial-gradient(circle at 31% 38%,#65756D 0 3%,transparent 3.2%),linear-gradient(120deg,#24393B 0 42%,#63746A 42% 43%,#1E3235 43%);color:#EDE2D2}
.th-p-laptops .laptop-field__folio{position:absolute;z-index:2;top:clamp(18px,2.2vw,32px);left:clamp(18px,2.5vw,40px);display:flex;gap:9px;align-items:baseline;margin:0;color:#F4EBDD;font:600 .59rem/1 var(--body);letter-spacing:.17em;text-transform:uppercase}
.th-p-laptops .laptop-field__folio b{font:400 1.2rem/.8 var(--display);letter-spacing:-.04em}
.th-p-laptops .laptop-field__copy-card{z-index:2;grid-column:1;grid-row:1;align-self:end;justify-self:start;width:min(100% - clamp(28px,5vw,78px),680px);margin:0 0 clamp(28px,4.2vw,66px) clamp(20px,4.2vw,66px);padding:clamp(25px,3.6vw,56px) clamp(22px,3.7vw,58px) clamp(24px,3.2vw,48px);background:rgba(248,243,234,.95);border:1px solid rgba(255,250,240,.6);box-shadow:0 26px 54px rgba(10,20,21,.23);backdrop-filter:blur(8px)}
.th-p-laptops .laptop-field__copy{display:grid;justify-items:start;gap:0;max-width:31rem}
.th-p-laptops .laptop-field__copy .eyebrow,.th-p-laptops .laptop-drawer__eyebrow{margin:0 0 13px;color:var(--accent);font:700 .61rem/1.25 var(--body);letter-spacing:.18em;text-transform:uppercase}
.th-p-laptops .laptop-field__copy h1{max-width:11ch;margin:0;color:var(--ink);font:var(--dw) clamp(3rem,6.05vw,6.4rem)/.86 var(--display);letter-spacing:var(--dt);text-wrap:balance}
.th-p-laptops .laptop-field__copy h1.long{max-width:13.6ch;font-size:clamp(2.35rem,4.7vw,4.95rem);line-height:.94}
.th-p-laptops .laptop-field__copy .sub{max-width:34rem;margin:20px 0 0;color:#52605E;font:500 clamp(.78rem,1.1vw,.96rem)/1.66 var(--body);letter-spacing:.005em}
.th-p-laptops .laptop-field__copy .ctas{display:flex;flex-wrap:wrap;gap:10px;margin-top:27px}
.th-p-laptops .laptop-field__copy .btn{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 19px;border:1px solid var(--accent);border-radius:999px;background:var(--accent);color:var(--onAccent);font:700 .65rem/1 var(--body);letter-spacing:.07em;text-decoration:none;text-transform:uppercase}
.th-p-laptops .laptop-field__copy .btn.ghost{border-color:var(--ink);background:transparent;color:var(--ink)}
.th-p-laptops .laptop-field__index{z-index:3;grid-column:2;grid-row:1;align-self:end;display:grid;gap:0;width:100%;padding:clamp(18px,2vw,32px) clamp(16px,2vw,29px);background:rgba(27,48,49,.93);border-top:1px solid rgba(244,235,221,.42);border-left:1px solid rgba(244,235,221,.42);backdrop-filter:blur(10px)}
.th-p-laptops .laptop-field__index p{margin:0 0 12px;color:#E6CDBE;font:700 .58rem/1.2 var(--body);letter-spacing:.17em;text-transform:uppercase}
.th-p-laptops .laptop-field__route{display:grid;grid-template-columns:24px minmax(0,1fr) auto 14px;gap:7px;align-items:baseline;min-height:47px;padding:10px 0;border-top:1px solid rgba(244,235,221,.24);color:#F7EFE2;text-decoration:none}
.th-p-laptops .laptop-field__route-number{color:#D89B7D;font:700 .55rem/1 var(--body);letter-spacing:.06em}
.th-p-laptops .laptop-field__route-name{min-width:0;overflow-wrap:anywhere;font:700 .65rem/1.2 var(--body);letter-spacing:.02em}
.th-p-laptops .laptop-field__route small{max-width:7ch;color:#C3CEC5;font:500 .54rem/1.2 var(--body);letter-spacing:.035em;text-align:right}
.th-p-laptops .laptop-field__route-arrow{color:#E2B599;font:400 1rem/1 var(--body)}
.th-p-laptops .laptop-field__corner{position:absolute;z-index:2;width:clamp(30px,4vw,60px);height:clamp(30px,4vw,60px);pointer-events:none}
.th-p-laptops .laptop-field__corner--top{top:clamp(15px,2vw,30px);right:clamp(15px,2vw,30px);border-top:1px solid rgba(248,243,234,.8);border-right:1px solid rgba(248,243,234,.8)}
.th-p-laptops .laptop-field__corner--bottom{right:calc(clamp(15px,2vw,30px) + clamp(18px,2vw,32px));bottom:calc(clamp(15px,2vw,30px) + clamp(18px,2vw,32px));border-right:1px solid rgba(248,243,234,.55);border-bottom:1px solid rgba(248,243,234,.55)}
.th-p-laptops .laptop-field .motion-toggle{position:absolute;z-index:4;right:clamp(26px,4.5vw,74px);bottom:clamp(27px,4.7vw,74px);min-height:44px;padding:0 14px;border:1px solid rgba(248,243,234,.7);border-radius:999px;background:rgba(28,41,44,.88);color:#F8F3EA;font:700 .58rem/1 var(--body);letter-spacing:.08em;text-transform:uppercase}
.th-p-laptops .laptop-field.has-hero-motion[data-hero-motion="drift"] .laptop-field__media .hero-media{animation:laptops-drift 17s ease-in-out infinite alternate}
.th-p-laptops .laptop-field.has-hero-motion[data-hero-motion="pan"] .laptop-field__media .hero-media{animation:laptops-pan 20s ease-in-out infinite alternate}
.th-p-laptops .laptop-drawer{width:min(100%,1560px);margin:auto;padding:clamp(58px,8vw,126px) clamp(18px,4.5vw,72px) clamp(54px,7vw,104px);background:var(--surface);border-inline:1px solid color-mix(in srgb,var(--line) 75%,transparent)}
.th-p-laptops .laptop-drawer__heading{display:grid;grid-template-columns:minmax(0,1fr) minmax(180px,29%);gap:28px;align-items:end;margin-bottom:clamp(28px,4.2vw,56px);padding-bottom:clamp(20px,2.7vw,37px);border-bottom:1px solid var(--ink)}
.th-p-laptops .laptop-drawer__heading h2{max-width:10.5ch;margin:0;font:var(--dw) clamp(2.4rem,4.8vw,5.2rem)/.9 var(--display);letter-spacing:var(--dt);text-wrap:balance}
.th-p-laptops .laptop-drawer__heading>p{max-width:30ch;margin:0;color:var(--muted);font:500 .75rem/1.65 var(--body)}
.th-p-laptops .laptop-drawer__sheets{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border-top:1px solid var(--line);border-left:1px solid var(--line)}
.th-p-laptops .laptop-drawer__sheet{position:relative;display:grid;grid-template-rows:auto 1fr auto;min-width:0;min-height:clamp(310px,29vw,440px);padding:clamp(14px,1.9vw,27px);overflow:hidden;background:#EFE8DD;color:var(--ink);text-decoration:none;border-right:1px solid var(--line);border-bottom:1px solid var(--line)}
.th-p-laptops .laptop-drawer__number{position:relative;z-index:2;color:var(--accent);font:700 .59rem/1 var(--body);letter-spacing:.12em}
.th-p-laptops .laptop-drawer__image{position:relative;align-self:center;justify-self:center;display:block;width:100%;overflow:hidden;background:#D9D4C9;aspect-ratio:1.06/1}
.th-p-laptops .laptop-drawer__image img{display:block;width:100%;height:100%;object-fit:cover;filter:saturate(.7) contrast(1.03)}
.th-p-laptops .laptop-drawer__blank{position:relative;display:block;width:100%;height:100%;overflow:hidden;background:linear-gradient(135deg,#E2DACE 0 49.6%,#B8C5BD 49.8% 50.2%,#E2DACE 50.4%)}
.th-p-laptops .laptop-drawer__blank i{position:absolute;display:block;border:1px solid rgba(34,56,56,.32);border-radius:50%}
.th-p-laptops .laptop-drawer__blank i:first-child{width:44%;height:44%;top:14%;left:17%}
.th-p-laptops .laptop-drawer__blank i:last-child{width:59%;height:59%;right:10%;bottom:9%}
.th-p-laptops .laptop-drawer__meta{position:relative;z-index:2;display:grid;gap:6px;min-width:0;margin-top:clamp(15px,2vw,28px);padding-top:14px;border-top:1px solid rgba(28,41,44,.32)}
.th-p-laptops .laptop-drawer__meta b{min-width:0;overflow-wrap:anywhere;font:var(--dw) clamp(1.08rem,1.7vw,1.72rem)/1.03 var(--display);letter-spacing:-.045em}
.th-p-laptops .laptop-drawer__meta small{color:var(--muted);font:600 .58rem/1.2 var(--body);letter-spacing:.07em;text-transform:uppercase}
.th-p-laptops .laptop-drawer__arrow{position:absolute;z-index:3;right:clamp(14px,1.9vw,27px);bottom:clamp(14px,1.9vw,27px);color:var(--accent);font:400 1.36rem/1 var(--body)}
.th-p-laptops .laptop-drawer__all{display:inline-flex;align-items:center;gap:14px;min-height:48px;margin-top:clamp(23px,3vw,40px);color:var(--ink);font:700 .64rem/1.2 var(--body);letter-spacing:.08em;text-decoration:none;text-transform:uppercase}
.th-p-laptops .laptop-drawer__all span{color:var(--accent);font-size:1.2rem}
.th-p-laptops .laptop-drawer__products{border-top:1px solid var(--line)}
.th-p-laptops .laptop-drawer__product{display:grid;grid-template-columns:48px minmax(0,1fr) 28px;align-items:center;gap:18px;min-height:78px;color:var(--ink);text-decoration:none;border-bottom:1px solid var(--line)}
.th-p-laptops .laptop-drawer__product .laptop-drawer__meta{margin:0;padding:0;border:0}
.th-p-laptops .laptop-drawer__product .laptop-drawer__arrow{position:static;justify-self:end}
.th-p-laptops #shop{padding-top:clamp(55px,7.5vw,108px);background:var(--bg);border-top:1px solid var(--line)}
.th-p-laptops #shop .sec-h{align-items:end;gap:25px;padding-bottom:18px;border-bottom:1px solid var(--ink)}
.th-p-laptops #shop .sec-h h2{font:var(--dw) clamp(2.2rem,4vw,4.4rem)/.9 var(--display);letter-spacing:var(--dt)}
.th-p-laptops #shop .chips{gap:7px}
.th-p-laptops #shop .chip{min-height:44px;border-radius:999px;border-color:var(--line);background:transparent;color:var(--ink);font:600 .6rem/1 var(--body);letter-spacing:.07em;text-transform:uppercase}
.th-p-laptops #shop .chip[aria-current]{border-color:var(--panel);background:var(--panel);color:var(--onPanel)}
.th-p-laptops #shop .grid{gap:clamp(28px,4vw,62px) clamp(14px,2.1vw,32px)}
.th-p-laptops #shop .pc{gap:12px;border-radius:0}
.th-p-laptops #shop .pc .im{border:1px solid var(--line);border-radius:0;background:#E0D8CB}
.th-p-laptops #shop .pc .im img{filter:saturate(.72) contrast(1.02)}
.th-p-laptops #shop .pc .bd{grid-template-columns:minmax(0,1fr) auto;gap:5px 14px;padding:0}
.th-p-laptops #shop .pc h3{font:var(--dw) clamp(1.08rem,1.55vw,1.42rem)/1.03 var(--display);letter-spacing:-.04em}
.th-p-laptops #shop .pc .pr{grid-column:2;grid-row:1;color:var(--accent);font:700 .72rem/1.1 var(--body);white-space:nowrap}
.th-p-laptops #shop .pc .ct{grid-column:1/-1;color:var(--muted);font:500 .62rem/1.3 var(--body);letter-spacing:.025em}
.th-p-laptops #shop .pc .tag{border-radius:999px;background:var(--badge);color:var(--onBadge);font:700 .56rem/1 var(--body);letter-spacing:.07em;text-transform:uppercase}
.th-p-laptops #shop .pc .go{border-radius:999px;background:var(--panel);color:var(--onPanel);font:700 .6rem/1 var(--body);letter-spacing:.06em;text-transform:uppercase}
.th-p-laptops .perks{background:var(--panel);border-color:var(--panel)}
.th-p-laptops .perks .perk{color:var(--onPanel)}
.th-p-laptops .perks .perk svg{color:#D7B093}
.th-p-laptops .ft{border-top-color:color-mix(in srgb,var(--onFoot) 24%,transparent)}
@keyframes laptops-drift{from{transform:scale(1.025) translate3d(-.6%,-.35%,0)}to{transform:scale(1.075) translate3d(.65%,.45%,0)}}
@keyframes laptops-pan{from{transform:scale(1.025) translate3d(-1.1%,0,0)}to{transform:scale(1.09) translate3d(1.1%,-.3%,0)}}
@media (max-width:980px){
  .th-p-laptops .laptop-field__canvas{min-height:650px}
  .th-p-laptops .laptop-field__copy-card{width:min(100% - 48px,570px)}
  .th-p-laptops .laptop-field__copy h1{font-size:clamp(3rem,7.7vw,5.25rem)}
  .th-p-laptops .laptop-drawer__sheets{grid-template-columns:repeat(2,minmax(0,1fr))}
  .th-p-laptops .laptop-drawer__sheet{min-height:350px}
}
@media (max-width:680px){
  .th-p-laptops .hd .nav{display:none}
  .th-p-laptops .laptop-field{padding:0}
  .th-p-laptops .laptop-field__canvas{display:flex;flex-direction:column;min-height:0;border-inline:0}
  .th-p-laptops .laptop-field__media{position:absolute;inset:0;min-height:660px}
  .th-p-laptops .laptop-field__media .hero-media{object-position:52% center}
  .th-p-laptops .laptop-field__media::after{background:linear-gradient(180deg,rgba(18,31,32,.21),rgba(18,31,32,.63) 48%,rgba(18,31,32,.9)),linear-gradient(90deg,rgba(18,31,32,.25),transparent 76%)}
  .th-p-laptops .laptop-field__folio{position:relative;top:auto;left:auto;margin:23px 20px 0}
  .th-p-laptops .laptop-field__copy-card{position:relative;align-self:auto;width:calc(100% - 32px);margin:190px 16px 18px;padding:29px 23px 26px}
  .th-p-laptops .laptop-field__copy h1{font-size:clamp(2.9rem,13vw,4.65rem);line-height:.87}
  .th-p-laptops .laptop-field__copy h1.long{font-size:clamp(2.2rem,10vw,3.5rem)}
  .th-p-laptops .laptop-field__copy .sub{margin-top:17px;font-size:.75rem}
  .th-p-laptops .laptop-field__copy .ctas{width:100%;margin-top:23px}
  .th-p-laptops .laptop-field__copy .btn{flex:1 1 145px;padding-inline:14px}
  .th-p-laptops .laptop-field__index{position:relative;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0;margin:0 16px 18px;padding:15px 16px;border:1px solid rgba(244,235,221,.42)}
  .th-p-laptops .laptop-field__index p{grid-column:1/-1}
  .th-p-laptops .laptop-field__route{grid-template-columns:20px minmax(0,1fr) 14px;gap:5px;min-height:44px;padding:8px 6px 8px 0}
  .th-p-laptops .laptop-field__route:nth-of-type(odd){padding-left:9px;border-left:1px solid rgba(244,235,221,.2)}
  .th-p-laptops .laptop-field__route small{display:none}
  .th-p-laptops .laptop-field__route-arrow{grid-column:3}
  .th-p-laptops .laptop-field__corner{display:none}
  .th-p-laptops .laptop-field .motion-toggle{right:26px;bottom:28px}
  .th-p-laptops .laptop-drawer{padding:65px 18px 58px;border-inline:0}
  .th-p-laptops .laptop-drawer__heading{grid-template-columns:1fr;gap:17px;margin-bottom:30px}
  .th-p-laptops .laptop-drawer__heading h2{font-size:clamp(2.55rem,11vw,4rem)}
  .th-p-laptops .laptop-drawer__sheets{grid-template-columns:1fr}
  .th-p-laptops .laptop-drawer__sheet{grid-template-columns:34px minmax(0,1fr);grid-template-rows:1fr auto;gap:0 14px;min-height:242px}
  .th-p-laptops .laptop-drawer__number{grid-column:1;grid-row:1}
  .th-p-laptops .laptop-drawer__image{grid-column:2;grid-row:1;align-self:stretch;justify-self:stretch;max-width:360px;aspect-ratio:auto}
  .th-p-laptops .laptop-drawer__meta{grid-column:1/-1;grid-row:2;margin-top:15px}
  .th-p-laptops .laptop-drawer__arrow{bottom:17px}
  .th-p-laptops .laptop-drawer__product{grid-template-columns:34px minmax(0,1fr) 22px;gap:10px;min-height:70px}
  .th-p-laptops #shop .sec-h{align-items:start;flex-direction:column;gap:17px}
  .th-p-laptops #shop .chips{overflow-x:auto;flex-wrap:nowrap;padding-bottom:2px}
  .th-p-laptops #shop .chip{flex:none}
}
@media (max-width:420px){
  .th-p-laptops .hd .wrap{min-height:58px}
  .th-p-laptops .hd .brand{font-size:.61rem;letter-spacing:.14em}
  .th-p-laptops .laptop-field__copy-card{width:calc(100% - 24px);margin-left:12px;margin-right:12px;padding:27px 19px 23px}
  .th-p-laptops .laptop-field__copy h1{font-size:clamp(2.65rem,13.3vw,3.75rem)}
  .th-p-laptops .laptop-field__index{display:block;margin:0 12px 14px;padding:13px}
  .th-p-laptops .laptop-field__route:nth-of-type(odd){padding-left:0;border-left:0}
  .th-p-laptops .laptop-field__route{grid-template-columns:21px minmax(0,1fr) 14px}
  .th-p-laptops .laptop-field .motion-toggle{right:19px;bottom:23px}
  .th-p-laptops .laptop-drawer{padding-inline:14px}
  .th-p-laptops .laptop-drawer__sheet{padding:14px;min-height:220px}
  .th-p-laptops .laptop-drawer__meta b{font-size:1.25rem}
  .th-p-laptops #shop .sec-h h2{font-size:clamp(2.1rem,11vw,3rem)}
}
@media (prefers-reduced-motion:reduce){
  .th-p-laptops .laptop-field.has-hero-motion .laptop-field__media .hero-media{animation:none;transform:none}
}
`;

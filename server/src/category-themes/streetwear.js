import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-streetwear',
  name: 'CUTLINE UNION',
  for: 'Graphic apparel and streetwear',
  vibe: 'Concrete, cut-paper type, and an acid-lime interruption',
  category: 'Streetwear and graphic apparel',
  group: 'fashion',
  display: 'Anton',
  body: 'IBM Plex Mono',
  displayWeight: 400,
  tracking: '-.015em',
  colors: {
    bg: '#0A0A0A',
    surface: '#171717',
    ink: '#F2F1EB',
    muted: '#AAA9A1',
    line: '#343430',
    accent: '#D7FF2F',
    onAccent: '#0A0A0A',
    panel: '#E8E6DE',
    onPanel: '#0A0A0A',
    foot: '#0A0A0A',
    onFoot: '#C6C5BE',
    bar: '#D7FF2F',
    onBar: '#0A0A0A',
    badge: '#D7FF2F',
    onBadge: '#0A0A0A',
  },
  header: 'split',
  hero: 'type',
  card: 'bold',
  ratio: '4/5',
  rCard: 0,
  rBtn: 0,
  motion: 'pan',
  copy: {
    eyebrow: 'City-made / graphic apparel',
    collection: 'The print run',
    cta: 'Shop the run',
    title: 'Wear the interruption.',
    subtitle: 'Graphic layers made for a louder route.',
  },
});

const padded = (number) => String(number + 1).padStart(2, '0');

function priceFor(ctx, product) {
  const variantPrice = product?.variants?.find((variant) => variant?.price_cents != null)?.price_cents;
  return ctx.money(product?.price_cents ?? variantPrice ?? 0, product?.currency || 'usd');
}

export function hero(ctx) {
  const hasDetail = Boolean(ctx.pics?.[1]?.url);
  const eyebrow = ctx.eyebrow ? `<p class="eyebrow">${ctx.esc(ctx.eyebrow)}</p>` : '';
  const subtitle = ctx.sub ? `<p class="sub">${ctx.esc(ctx.sub)}</p>` : '';
  const storeName = ctx.esc(ctx.store?.store_name || ctx.t.name);

  return `<section class="hero category-hero sw-hero${hasDetail ? ' sw-has-detail' : ' sw-single'}${ctx.heroClass}"${ctx.heroAttrs}>
  <aside class="sw-rail" aria-label="${storeName} identity"><span>${storeName}</span><i aria-hidden="true">01</i></aside>
  <div class="sw-main" aria-label="Storefront photograph">${ctx.media(0, { priority: true, lazy: false })}</div>
  <div class="sw-copy">
    <div class="sw-copy-top">${eyebrow}<h1${ctx.head.length > 56 ? ' class="long"' : ''}>${ctx.esc(ctx.head)}</h1></div>
    <div class="sw-copy-bottom">${subtitle}${ctx.ctas}</div>
  </div>
  ${hasDetail ? `<div class="sw-detail" aria-hidden="true">${ctx.media(1, { lazy: true, decorative: true })}</div>` : ''}
  <div class="sw-stamp" aria-hidden="true"><span>${ctx.esc(ctx.t.copy?.collection || 'Shop the collection')}</span><b>///</b></div>
  ${ctx.controls}
</section>`;
}

export function discovery(ctx) {
  const cats = Array.isArray(ctx.cats) ? ctx.cats.filter((category) => category?.name).slice(0, 5) : [];
  const products = Array.isArray(ctx.products) ? ctx.products : [];

  if (cats.length >= 2) {
    return `<section class="theme-discovery sw-run" aria-labelledby="sw-run-title">
  <div class="wrap">
    <div class="sw-run-head"><p class="eyebrow">${ctx.esc(ctx.t.copy?.collection || 'Shop the collection')}</p><h2 id="sw-run-title">Find your line.</h2><span>${cats.length} active categories</span></div>
    <nav class="sw-run-list" aria-label="Browse product categories">
      ${cats.map((category, index) => `<a class="sw-run-item" href="${ctx.esc(ctx.categoryLink(category.name))}">
        <b>${padded(index)}</b>
        <span><strong>${ctx.esc(category.name)}</strong><small>${ctx.esc(String(category.count))} ${Number(category.count) === 1 ? 'piece' : 'pieces'}</small></span>
        <i aria-hidden="true">↗</i>
      </a>`).join('')}
    </nav>
  </div>
</section>`;
  }

  if (!products.length) return '';

  return `<section class="theme-discovery sw-run sw-run-products" aria-labelledby="sw-run-title">
  <div class="wrap">
    <div class="sw-run-head"><p class="eyebrow">${ctx.esc(ctx.t.copy?.collection || 'Shop the collection')}</p><h2 id="sw-run-title">Available now.</h2></div>
    <div class="sw-fallback-list">
      ${products.slice(0, 3).map((product, index) => `<a class="sw-fallback-item" href="${ctx.esc(ctx.productLink(product))}"><b>${padded(index)}</b><span>${ctx.esc(product.title)}</span><strong>${ctx.esc(priceFor(ctx, product))}</strong><i aria-hidden="true">↗</i></a>`).join('')}
    </div>
  </div>
</section>`;
}

export const css = `
.th-p-streetwear .hd{background:#0A0A0A;color:#F2F1EB;border-bottom-color:#343430}
.th-p-streetwear .hd .brand{letter-spacing:.025em}
.th-p-streetwear .hd .cart:hover{background:#FFFFFF16}
.th-p-streetwear .hd .cart b{background:#D7FF2F;color:#0A0A0A}
.th-p-streetwear .sw-hero{display:grid;grid-template-columns:clamp(58px,6vw,94px) minmax(260px,.9fr) minmax(360px,1.08fr) minmax(178px,.48fr);grid-template-rows:minmax(360px,58vh) minmax(154px,auto);min-height:clamp(520px,76vh,770px);background:#0A0A0A;color:#F2F1EB;border-bottom:1px solid #343430;isolation:isolate;overflow:hidden}
.th-p-streetwear .sw-rail{grid-column:1;grid-row:1 / -1;position:relative;display:flex;flex-direction:column;justify-content:space-between;align-items:center;padding:16px 10px;border-right:1px solid #343430;background:#E8E6DE;color:#0A0A0A;overflow:hidden}
.th-p-streetwear .sw-rail::before{content:"+";font:400 clamp(38px,4vw,62px)/.8 var(--display);letter-spacing:0}
.th-p-streetwear .sw-rail span{writing-mode:vertical-rl;transform:rotate(180deg);font:600 clamp(10px,1.05vw,13px)/1 var(--body);letter-spacing:.18em;text-transform:uppercase;white-space:nowrap}
.th-p-streetwear .sw-rail i{font:500 10px/1 var(--body);font-style:normal;letter-spacing:.12em}
.th-p-streetwear .sw-main{grid-column:2;grid-row:1 / -1;position:relative;overflow:hidden;background:#171717;min-height:100%}
.th-p-streetwear .sw-main .hero-media{width:100%;height:100%;object-fit:cover;object-position:42% center;filter:grayscale(.2) contrast(1.07)}
.th-p-streetwear .sw-main .theme-empty-media{width:100%;height:100%;min-height:520px;background:linear-gradient(135deg,#1C1C1A,#0A0A0A);color:#AAA9A1}
.th-p-streetwear .sw-copy{grid-column:3 / 5;grid-row:1 / -1;display:grid;grid-template-rows:1fr auto;align-content:stretch;gap:24px;min-width:0;padding:clamp(32px,5.2vw,84px) clamp(24px,4vw,68px) clamp(28px,4.2vw,66px);background:#0A0A0A}
.th-p-streetwear .sw-copy-top{display:grid;align-content:start;gap:clamp(20px,2.5vw,34px);min-width:0}
.th-p-streetwear .sw-copy .eyebrow,.th-p-streetwear .sw-run .eyebrow{color:#D7FF2F;font:600 11px/1.2 var(--body);letter-spacing:.16em;text-transform:uppercase}
.th-p-streetwear .sw-copy h1{max-width:9ch;color:#E8E6DE;font-size:calc(clamp(72px,9.1vw,174px)*var(--hero));font-weight:400;line-height:.76;letter-spacing:calc(var(--dt) - .012em);text-wrap:balance}
.th-p-streetwear .sw-copy h1.long{max-width:14ch;font-size:calc(clamp(48px,6.2vw,108px)*var(--hero));line-height:.84}
.th-p-streetwear .sw-copy-bottom{display:grid;justify-items:start;gap:20px;max-width:32rem;position:relative;z-index:2}
.th-p-streetwear .sw-copy .sub{max-width:34ch;color:#AAA9A1;font:400 clamp(13px,1.1vw,16px)/1.55 var(--body)}
.th-p-streetwear .sw-copy .ctas{gap:8px}
.th-p-streetwear .sw-copy .btn{min-height:48px;border:1px solid #D7FF2F;background:#D7FF2F;color:#0A0A0A;padding-inline:20px;font:600 12px/1 var(--body);letter-spacing:.08em;text-transform:uppercase}
.th-p-streetwear .sw-copy .btn.ghost{border-color:#E8E6DE;background:transparent;color:#E8E6DE}
.th-p-streetwear .sw-copy .btn:hover{background:#E8E6DE;color:#0A0A0A;transform:none}
.th-p-streetwear .sw-detail{grid-column:4;grid-row:2;position:relative;overflow:hidden;z-index:3;min-height:154px;border:1px solid #343430;border-right:0;border-bottom:0;background:#171717}
.th-p-streetwear .sw-detail .hero-media{width:100%;height:100%;object-fit:cover;object-position:center;filter:grayscale(.55) contrast(1.1)}
.th-p-streetwear .sw-stamp{grid-column:3;grid-row:2;align-self:end;display:flex;align-items:flex-end;justify-content:space-between;gap:16px;min-width:0;padding:20px clamp(24px,4vw,68px) 22px 0;color:#AAA9A1;font:500 10px/1.25 var(--body);letter-spacing:.13em;text-transform:uppercase}
.th-p-streetwear .sw-stamp span{max-width:18ch}
.th-p-streetwear .sw-stamp b{color:#D7FF2F;font:400 clamp(38px,3vw,58px)/.6 var(--display);letter-spacing:-.08em}
.th-p-streetwear .sw-single .sw-copy{grid-column:3 / 5}
.th-p-streetwear .sw-single .sw-stamp{grid-column:3 / 5;justify-content:flex-start;gap:24px}
.th-p-streetwear .sw-hero .motion-toggle{right:16px;bottom:16px;border:1px solid #343430;border-radius:0;background:#0A0A0A;color:#F2F1EB;font:600 10px/1 var(--body);letter-spacing:.08em;text-transform:uppercase}
.th-p-streetwear .sw-run{background:#E8E6DE;color:#0A0A0A;padding-block:clamp(48px,7vw,104px);border-bottom:1px solid #343430}
.th-p-streetwear .sw-run .wrap{display:grid;grid-template-columns:minmax(200px,.8fr) minmax(0,1.2fr);gap:clamp(28px,6vw,104px);align-items:start}
.th-p-streetwear .sw-run-head{display:grid;gap:17px;align-content:start}
.th-p-streetwear .sw-run-head .eyebrow{color:#474741}
.th-p-streetwear .sw-run-head h2{max-width:7ch;font-size:clamp(48px,6.1vw,104px);font-weight:400;line-height:.8;letter-spacing:-.02em}
.th-p-streetwear .sw-run-head>span{max-width:18ch;font:500 11px/1.45 var(--body);letter-spacing:.1em;text-transform:uppercase}
.th-p-streetwear .sw-run-list,.th-p-streetwear .sw-fallback-list{border-top:2px solid #0A0A0A}
.th-p-streetwear .sw-run-item{display:grid;grid-template-columns:minmax(40px,.2fr) 1fr auto;align-items:center;gap:16px;min-height:82px;padding:14px 0;border-bottom:1px solid #77766F;color:inherit;text-decoration:none}
.th-p-streetwear .sw-run-item b,.th-p-streetwear .sw-fallback-item b{font:500 11px/1 var(--body);letter-spacing:.08em}
.th-p-streetwear .sw-run-item span{display:grid;gap:3px;min-width:0}
.th-p-streetwear .sw-run-item strong{font:400 clamp(22px,2.2vw,34px)/.95 var(--display);letter-spacing:.005em;overflow-wrap:anywhere}
.th-p-streetwear .sw-run-item small{font:500 10px/1.25 var(--body);letter-spacing:.1em;text-transform:uppercase;color:#474741}
.th-p-streetwear .sw-run-item i,.th-p-streetwear .sw-fallback-item i{font:400 28px/1 var(--display);font-style:normal;color:#0A0A0A}
.th-p-streetwear .sw-run-item:hover strong,.th-p-streetwear .sw-run-item:focus-visible strong{color:#4C7100}
.th-p-streetwear .sw-fallback-item{display:grid;grid-template-columns:minmax(40px,.2fr) minmax(0,1fr) auto auto;align-items:center;gap:16px;min-height:72px;padding:12px 0;border-bottom:1px solid #77766F;color:inherit;text-decoration:none}
.th-p-streetwear .sw-fallback-item>span{font:400 clamp(20px,2vw,30px)/.95 var(--display);overflow-wrap:anywhere}
.th-p-streetwear .sw-fallback-item>strong{font:600 12px/1 var(--body);letter-spacing:.04em;white-space:nowrap}
.th-p-streetwear #shop{background:#0A0A0A;color:#F2F1EB;border-bottom:1px solid #343430}
.th-p-streetwear #shop .sec-h{align-items:end;border-bottom:1px solid #343430;margin-bottom:clamp(22px,3vw,38px);padding-bottom:16px}
.th-p-streetwear #shop .sec-h h2{font-size:clamp(36px,4.3vw,68px);font-weight:400;line-height:.82}
.th-p-streetwear #shop .chip{border-radius:0;border-color:#5B5A54;color:#F2F1EB;min-height:44px;padding:9px 14px;font:600 11px/1.1 var(--body);letter-spacing:.08em;text-transform:uppercase}
.th-p-streetwear #shop .chip[aria-current],.th-p-streetwear #shop .chip:hover{background:#D7FF2F;border-color:#D7FF2F;color:#0A0A0A}
.th-p-streetwear #shop .grid{gap:clamp(22px,3vw,42px) clamp(10px,1.2vw,18px)}
.th-p-streetwear #shop .pc{border:0;border-radius:0;background:transparent;box-shadow:none;color:#F2F1EB;gap:12px}
.th-p-streetwear #shop .pc .im{border:1px solid #343430;border-radius:0;background:#171717}
.th-p-streetwear #shop .pc .im::after{content:"";position:absolute;inset:0;background:linear-gradient(135deg,transparent 0 85%,#D7FF2F 85% 100%);opacity:0;pointer-events:none}
.th-p-streetwear #shop .pc:hover{transform:none;box-shadow:none}
.th-p-streetwear #shop .pc:hover .im{border-color:#D7FF2F}
.th-p-streetwear #shop .pc:hover .im::after{opacity:1}
.th-p-streetwear #shop .pc .bd{padding:0;gap:5px}
.th-p-streetwear #shop .pc h3{font:400 clamp(19px,1.6vw,27px)/.96 var(--display);letter-spacing:.005em}
.th-p-streetwear #shop .pc .pr{color:#D7FF2F;font:600 12px/1.2 var(--body);letter-spacing:.04em}
.th-p-streetwear #shop .pc .tag{border-radius:0;background:#D7FF2F;color:#0A0A0A}
.th-p-streetwear #shop .pc .tag.out{background:#F2F1EB;color:#0A0A0A}
.th-p-streetwear .perks{background:#0A0A0A;color:#F2F1EB;border-color:#343430}
.th-p-streetwear .perk{justify-content:flex-start;padding:18px 8px}
.th-p-streetwear .perk svg{color:#D7FF2F}
.th-p-streetwear .ft{background:#0A0A0A;border-top:1px solid #343430}
.th-p-streetwear .ft .brand{color:#D7FF2F}
@media (max-width:1020px){
  .th-p-streetwear .sw-hero{grid-template-columns:58px minmax(230px,.88fr) minmax(300px,1.12fr);grid-template-rows:minmax(390px,62vh) auto}
  .th-p-streetwear .sw-copy,.th-p-streetwear .sw-single .sw-copy{grid-column:3;grid-row:1 / -1}
  .th-p-streetwear .sw-detail{display:none}
  .th-p-streetwear .sw-stamp,.th-p-streetwear .sw-single .sw-stamp{grid-column:3;grid-row:2;padding-right:0}
  .th-p-streetwear .sw-copy h1{font-size:calc(clamp(66px,10vw,128px)*var(--hero))}
}
@media (max-width:720px){
  .th-p-streetwear .sw-hero{display:block;min-height:0;overflow:hidden}
  .th-p-streetwear .sw-rail{height:52px;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:14px;padding:0 16px;border-right:0;border-bottom:1px solid #343430}
  .th-p-streetwear .sw-rail::before{font-size:32px;line-height:1}
  .th-p-streetwear .sw-rail span{writing-mode:horizontal-tb;transform:none;justify-self:start;font-size:10px;letter-spacing:.12em;overflow:hidden;text-overflow:ellipsis}
  .th-p-streetwear .sw-main{min-height:0;aspect-ratio:4/3}
  .th-p-streetwear .sw-main .theme-empty-media{min-height:0}
  .th-p-streetwear .sw-copy{display:grid;min-height:360px;padding:36px 20px 76px}
  .th-p-streetwear .sw-copy h1{max-width:12ch;font-size:calc(clamp(60px,17.6vw,94px)*var(--hero));line-height:.79}
  .th-p-streetwear .sw-copy h1.long{font-size:calc(clamp(40px,11.5vw,64px)*var(--hero));line-height:.86}
  .th-p-streetwear .sw-copy-bottom{gap:16px}
  .th-p-streetwear .sw-copy .btn{min-height:46px;font-size:11px;padding-inline:16px}
  .th-p-streetwear .sw-stamp,.th-p-streetwear .sw-single .sw-stamp{position:absolute;left:20px;right:20px;bottom:16px;z-index:2;display:flex;padding:0;pointer-events:none}
  .th-p-streetwear .sw-hero .motion-toggle{right:12px;bottom:11px}
  .th-p-streetwear .sw-run{padding-block:44px 54px}
  .th-p-streetwear .sw-run .wrap{grid-template-columns:1fr;gap:30px}
  .th-p-streetwear .sw-run-head{gap:14px}
  .th-p-streetwear .sw-run-head h2{max-width:9ch;font-size:clamp(48px,15vw,72px)}
  .th-p-streetwear .sw-run-item{min-height:72px;gap:10px}
  .th-p-streetwear .sw-run-item strong{font-size:25px}
  .th-p-streetwear .sw-fallback-item{grid-template-columns:32px minmax(0,1fr) auto;gap:10px}
  .th-p-streetwear .sw-fallback-item i{display:none}
  .th-p-streetwear #shop .sec-h{gap:18px;padding-bottom:14px}
  .th-p-streetwear #shop .sec-h h2{font-size:clamp(37px,12vw,56px)}
  .th-p-streetwear #shop .chips{width:100%;overflow-x:auto;flex-wrap:nowrap;padding-bottom:2px}
  .th-p-streetwear #shop .chip{flex:0 0 auto}
}
`;

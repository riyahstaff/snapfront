import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-sandals',
  name: 'Cala Forma',
  for: 'Warm-weather sandals, slides, and easy footwear',
  vibe: 'Limestone heat, still water, woven leather, and an unhurried Mediterranean afternoon',
  category: 'Warm-weather sandals and slides',
  group: 'fashion',
  display: 'Bodoni Moda',
  body: 'DM Sans',
  displayWeight: 600,
  tracking: '-.035em',
  colors: {
    bg: '#F7F0E4',
    surface: '#FFF9F0',
    ink: '#2A211C',
    muted: '#71675F',
    line: '#D9CDBB',
    accent: '#AD543A',
    onAccent: '#FFF9F0',
    panel: '#DDE5D7',
    onPanel: '#243127',
    foot: '#203C45',
    onFoot: '#FFF8ED',
    bar: '#E8A676',
    onBar: '#2A211C',
    badge: '#7E9A93',
    onBadge: '#102A2B',
  },
  header: 'center',
  hero: 'spotlight',
  card: 'minimal',
  ratio: '3/4',
  rCard: 18,
  rBtn: 999,
  motion: 'pan',
  copy: {
    eyebrow: 'Warm-weather footwear',
    collection: 'A light-footed edit for the long afternoon',
    cta: 'Shop sandals',
    title: 'Take the day slowly.',
    subtitle: 'Sandals for the bright, in-between hours.',
  },
});

export function hero(ctx) {
  const collection = ctx.t.copy?.collection ? `<p class="sandals-hero__collection">${ctx.esc(ctx.t.copy.collection)}</p>` : '';
  const detail = ctx.pics[1]
    ? `<figure class="sandals-hero__detail" aria-hidden="true">${ctx.media(1, { lazy: true, decorative: true })}</figure>`
    : '';

  return `<section class="hero category-hero sandals-hero${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="sandals-hero__sun" aria-hidden="true"><span></span></div>
    <p class="sandals-hero__marker" aria-hidden="true">01 — sunward</p>
    <div class="sandals-hero__portal">
      ${ctx.media(0, { priority: true, lazy: false })}
      <span class="sandals-hero__waterline" aria-hidden="true"></span>
    </div>
    ${detail}
    <div class="sandals-hero__caption">
      ${collection}
      ${ctx.copy('sandals-hero__copy')}
    </div>
    <span class="sandals-hero__arc sandals-hero__arc--one" aria-hidden="true"></span>
    <span class="sandals-hero__arc sandals-hero__arc--two" aria-hidden="true"></span>
    ${ctx.controls}
  </section>`;
}

export function discovery(ctx) {
  const categories = (Array.isArray(ctx.cats) ? ctx.cats : [])
    .filter((category) => category && category.name)
    .slice(0, 3);
  const products = Array.isArray(ctx.products) ? ctx.products : [];

  if (categories.length >= 2) {
    const steps = categories.map((category, index) => {
      const count = Number.isFinite(Number(category.count)) ? Number(category.count) : 0;
      const countLabel = `${count} ${count === 1 ? 'piece' : 'pieces'}`;
      const media = category.image
        ? `<img src="${ctx.esc(category.image)}" alt="" loading="lazy" decoding="async">`
        : '<span class="sandals-step__empty" aria-hidden="true"></span>';
      return `<a class="sandals-step" href="${ctx.esc(ctx.categoryLink(category.name))}">
        <span class="sandals-step__number" aria-hidden="true">0${index + 1}</span>
        <span class="sandals-step__media">${media}</span>
        <span class="sandals-step__meta"><b>${ctx.esc(category.name)}</b><small>${ctx.esc(countLabel)}</small><i aria-hidden="true">↗</i></span>
      </a>`;
    }).join('');

    return `<section class="theme-discovery sandals-discovery" aria-labelledby="sandals-discovery-title">
      <div class="sandals-discovery__intro">
        <p class="sandals-discovery__eyebrow">The terrace edit</p>
        <h2 id="sandals-discovery-title">Choose your place in the light.</h2>
        <p>Follow the live categories in this collection, from first step to last light.</p>
      </div>
      <div class="sandals-steps">${steps}</div>
    </section>`;
  }

  if (!products.length) return '';

  const pieces = products.slice(0, 3).map((product, index) => {
    const image = product.image_url
      ? `<img src="${ctx.esc(product.image_url)}" alt="${ctx.esc(product.alt_text || product.title)}" loading="lazy" decoding="async">`
      : '<span class="sandals-piece__empty" aria-hidden="true"></span>';
    const price = product.price_cents != null
      ? `<em>${ctx.esc(ctx.money(product.price_cents, product.currency, product?.billing_interval))}</em>`
      : '';
    return `<a class="sandals-piece" href="${ctx.esc(ctx.productLink(product))}">
      <span class="sandals-piece__number" aria-hidden="true">0${index + 1}</span>
      <span class="sandals-piece__media">${image}</span>
      <span class="sandals-piece__meta"><b>${ctx.esc(product.title)}</b>${product.category ? `<small>${ctx.esc(product.category)}</small>` : ''}${price}</span>
    </a>`;
  }).join('');

  return `<section class="theme-discovery sandals-discovery sandals-discovery--pieces" aria-labelledby="sandals-discovery-title">
    <div class="sandals-discovery__intro">
      <p class="sandals-discovery__eyebrow">The live selection</p>
      <h2 id="sandals-discovery-title">A few places to begin.</h2>
      <p>Selected from the sandals currently available in this store.</p>
    </div>
    <div class="sandals-pieces">${pieces}</div>
  </section>`;
}

export const css = `
.th-p-sandals{--sandals-stone:#F7F0E4;--sandals-paper:#FFF9F0;--sandals-ink:#2A211C;--sandals-line:#D9CDBB;--sandals-water:#203C45;--sandals-terracotta:#AD543A;background:var(--sandals-stone);color:var(--sandals-ink);overflow-x:clip}
.th-p-sandals .ann{background:var(--bar);color:var(--on-bar);font-size:10px;letter-spacing:.14em;text-transform:uppercase}
.th-p-sandals .hd{background:color-mix(in srgb,var(--sandals-stone) 94%,transparent);border-bottom:1px solid color-mix(in srgb,var(--sandals-ink) 13%,transparent)}
.th-p-sandals .hd .wrap{max-width:1480px;min-height:72px}
.th-p-sandals .brand{font-family:var(--display);font-size:calc(30px*var(--ts));font-weight:600;letter-spacing:-.045em}
.th-p-sandals .nav{gap:clamp(14px,2.2vw,32px);font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase}
.th-p-sandals .nav a{background-size:0 1px}
.th-p-sandals .nav a:hover,.th-p-sandals .nav a[aria-current]{background-size:100% 1px}
.th-p-sandals .cart{width:42px;height:42px;border:1px solid var(--sandals-ink);border-radius:50%;background:var(--sandals-paper)}
.th-p-sandals .cart b{border-radius:50%;background:var(--sandals-terracotta);color:var(--onAccent)}
.th-p-sandals .sandals-hero{position:relative;display:grid;grid-template-columns:minmax(20px,1fr) minmax(0,.68fr) minmax(0,1.08fr) minmax(20px,1fr);grid-template-rows:clamp(32px,5vw,76px) minmax(370px,44vw) auto;min-height:min(790px,calc(100svh - 104px));overflow:hidden;isolation:isolate;background:var(--sandals-stone)}
.th-p-sandals .sandals-hero__sun{position:absolute;z-index:-1;top:clamp(22px,4.2vw,70px);right:clamp(-74px,-2vw,-20px);width:clamp(245px,28vw,470px);aspect-ratio:1;border-radius:50%;background:var(--bar);opacity:.72}
.th-p-sandals .sandals-hero__sun span{position:absolute;inset:12%;border:1px solid rgba(42,33,28,.33);border-radius:50%}
.th-p-sandals .sandals-hero__marker{z-index:2;grid-column:2;grid-row:1;align-self:center;margin:0;color:var(--sandals-terracotta);font-size:10px;font-weight:700;letter-spacing:.16em;line-height:1.2;text-transform:uppercase}
.th-p-sandals .sandals-hero__portal{position:relative;z-index:1;grid-column:2/5;grid-row:1/3;min-width:0;min-height:0;overflow:hidden;background:linear-gradient(135deg,#DDE5D7,#8BA6A2);border-radius:48% 48% 0 0/22% 22% 0 0;box-shadow:inset 0 0 0 1px rgba(42,33,28,.11)}
.th-p-sandals .sandals-hero__portal>.hero-media,.th-p-sandals .sandals-hero__portal>.theme-empty-media{display:block;width:100%;height:100%;min-height:100%;object-fit:cover}
.th-p-sandals .sandals-hero__portal>.theme-empty-media{background:linear-gradient(145deg,#E5D5B7 0 47%,#7D9A98 47% 55%,#D5E1D5 55%);color:var(--sandals-water)}
.th-p-sandals .sandals-hero__portal::after{position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,249,240,.06),transparent 42%,rgba(32,60,69,.1));content:"";pointer-events:none}
.th-p-sandals .sandals-hero__waterline{position:absolute;z-index:1;right:0;bottom:clamp(32px,5vw,78px);left:clamp(18px,3vw,52px);height:1px;background:rgba(255,249,240,.8)}
.th-p-sandals .sandals-hero__caption{position:relative;z-index:3;grid-column:1/4;grid-row:3;align-self:end;min-width:0;margin-top:clamp(-90px,-6.6vw,-38px);padding:clamp(28px,4.2vw,64px) clamp(20px,4.5vw,76px) clamp(34px,5vw,78px);background:var(--sandals-paper);box-shadow:0 14px 40px rgba(62,42,26,.09)}
.th-p-sandals .sandals-hero__collection{max-width:40ch;margin:0 0 13px;color:var(--sandals-terracotta);font-size:10px;font-weight:700;letter-spacing:.15em;line-height:1.35;text-transform:uppercase}
.th-p-sandals .sandals-hero__copy{display:grid;gap:clamp(12px,1.4vw,19px);justify-items:start;max-width:760px}
.th-p-sandals .sandals-hero__copy .eyebrow{margin:0;color:var(--sandals-water);font-size:10px;font-weight:700;letter-spacing:.16em;line-height:1.3;text-transform:uppercase}
.th-p-sandals .sandals-hero__copy h1{max-width:12ch;margin:0;font-family:var(--display);font-size:calc(clamp(48px,6.1vw,100px)*var(--hero));font-weight:600;letter-spacing:-.055em;line-height:.84;text-wrap:balance}
.th-p-sandals .sandals-hero__copy h1.long{max-width:15ch;font-size:calc(clamp(37px,4.6vw,72px)*min(var(--hero),1.1));line-height:.9}
.th-p-sandals .sandals-hero__copy .sub{max-width:44ch;margin:0;color:var(--muted);font-size:clamp(14px,1.15vw,17px);line-height:1.55}
.th-p-sandals .sandals-hero__copy .ctas{gap:10px;margin-top:4px}
.th-p-sandals .sandals-hero__copy .btn{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:11px 20px;border:1px solid var(--sandals-ink);border-radius:999px;background:var(--sandals-terracotta);color:var(--onAccent);font-size:11px;font-weight:700;letter-spacing:.08em;line-height:1.2;text-decoration:none;text-transform:uppercase}
.th-p-sandals .sandals-hero__copy .btn.ghost{background:transparent;color:var(--sandals-ink)}
.th-p-sandals .sandals-hero__detail{position:relative;z-index:4;grid-column:4;grid-row:2/4;align-self:end;width:min(100%,220px);height:clamp(130px,14vw,230px);margin:0 clamp(14px,2.2vw,34px) clamp(18px,2vw,34px) auto;overflow:hidden;border:7px solid var(--sandals-stone);border-radius:50% 50% 0 0/26% 26% 0 0;box-shadow:0 12px 30px rgba(42,33,28,.15)}
.th-p-sandals .sandals-hero__detail>.hero-media{display:block;width:100%;height:100%;object-fit:cover}
.th-p-sandals .sandals-hero__arc{position:absolute;z-index:0;border:1px solid rgba(42,33,28,.23);border-radius:50%;pointer-events:none}
.th-p-sandals .sandals-hero__arc--one{bottom:clamp(-240px,-15vw,-120px);left:clamp(-140px,-8vw,-42px);width:clamp(330px,32vw,560px);aspect-ratio:1}
.th-p-sandals .sandals-hero__arc--two{right:clamp(5px,5vw,86px);bottom:clamp(19px,3vw,52px);width:clamp(30px,3.6vw,58px);aspect-ratio:1;background:var(--sandals-water);border-color:var(--sandals-water)}
.th-p-sandals .sandals-hero .motion-toggle{position:absolute;z-index:6;top:clamp(14px,1.7vw,26px);right:clamp(14px,2vw,32px);min-height:44px;border:1px solid rgba(255,249,240,.75);border-radius:999px;background:rgba(32,60,69,.78);color:#FFF9F0;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
.th-p-sandals .sandals-discovery{display:grid;grid-template-columns:minmax(210px,.72fr) minmax(0,1.6fr);gap:clamp(32px,6vw,110px);align-items:start;max-width:1480px;margin:0 auto;padding:clamp(62px,9vw,140px) clamp(20px,5vw,80px);border-bottom:1px solid var(--sandals-line)}
.th-p-sandals .sandals-discovery__intro{min-width:0;padding-top:clamp(0px,3vw,36px)}
.th-p-sandals .sandals-discovery__eyebrow{margin:0 0 12px;color:var(--sandals-terracotta);font-size:10px;font-weight:700;letter-spacing:.16em;line-height:1.3;text-transform:uppercase}
.th-p-sandals .sandals-discovery h2{max-width:9ch;margin:0;font-family:var(--display);font-size:calc(clamp(40px,4.65vw,75px)*var(--ts));font-weight:600;letter-spacing:-.055em;line-height:.89;text-wrap:balance}
.th-p-sandals .sandals-discovery__intro>p:last-child{max-width:30ch;margin:21px 0 0;color:var(--muted);font-size:15px;line-height:1.6}
.th-p-sandals .sandals-steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(10px,1.4vw,22px);align-items:end;min-width:0}
.th-p-sandals .sandals-step{display:grid;grid-template-rows:auto 1fr auto;min-width:0;color:var(--sandals-ink);text-decoration:none}
.th-p-sandals .sandals-step:nth-child(2){margin-bottom:clamp(22px,4vw,72px)}
.th-p-sandals .sandals-step:nth-child(3){margin-bottom:clamp(4px,.8vw,14px)}
.th-p-sandals .sandals-step__number{padding:0 0 9px;color:var(--sandals-terracotta);font-size:10px;font-weight:700;letter-spacing:.14em}
.th-p-sandals .sandals-step__media{position:relative;display:block;min-height:clamp(190px,22vw,350px);overflow:hidden;background:var(--panel);border:1px solid color-mix(in srgb,var(--sandals-ink) 10%,transparent);border-radius:50% 50% 13px 13px/18% 18% 13px 13px}
.th-p-sandals .sandals-step:nth-child(2) .sandals-step__media{border-radius:50% 50% 13px 13px/28% 28% 13px 13px;background:#E8D3B0}
.th-p-sandals .sandals-step:nth-child(3) .sandals-step__media{border-radius:50% 50% 13px 13px/12% 12% 13px 13px;background:#9DB1A7}
.th-p-sandals .sandals-step__media img{display:block;width:100%;height:100%;object-fit:cover}
.th-p-sandals .sandals-step__empty{position:absolute;inset:20%;display:block;border:1px solid rgba(36,49,39,.42);border-radius:50% 50% 45% 45%;transform:rotate(-19deg)}
.th-p-sandals .sandals-step__empty::after{position:absolute;top:24%;right:11%;bottom:24%;left:11%;border-top:1px solid rgba(36,49,39,.42);border-bottom:1px solid rgba(36,49,39,.42);content:""}
.th-p-sandals .sandals-step__meta{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:3px 8px;min-width:0;padding:14px 2px 0}
.th-p-sandals .sandals-step__meta b{overflow-wrap:anywhere;font-family:var(--display);font-size:clamp(21px,1.9vw,30px);font-weight:600;letter-spacing:-.035em;line-height:1}
.th-p-sandals .sandals-step__meta small{grid-column:1;color:var(--muted);font-size:10px;font-weight:700;letter-spacing:.09em;line-height:1.3;text-transform:uppercase}
.th-p-sandals .sandals-step__meta i{grid-column:2;grid-row:1/3;align-self:center;color:var(--sandals-terracotta);font-size:21px;font-style:normal;line-height:1}
.th-p-sandals .sandals-discovery--pieces{align-items:center}
.th-p-sandals .sandals-pieces{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(10px,1.4vw,22px);min-width:0}
.th-p-sandals .sandals-piece{display:grid;gap:12px;min-width:0;color:var(--sandals-ink);text-decoration:none}
.th-p-sandals .sandals-piece:nth-child(2){margin-top:clamp(18px,3vw,48px)}
.th-p-sandals .sandals-piece__number{color:var(--sandals-terracotta);font-size:10px;font-weight:700;letter-spacing:.14em}
.th-p-sandals .sandals-piece__media{position:relative;display:block;aspect-ratio:3/4;overflow:hidden;background:var(--panel);border-radius:50% 50% 12px 12px/16% 16% 12px 12px}
.th-p-sandals .sandals-piece__media img{display:block;width:100%;height:100%;object-fit:cover}
.th-p-sandals .sandals-piece__empty{position:absolute;inset:18%;display:block;border:1px solid rgba(36,49,39,.42);border-radius:50% 48% 44% 50%;transform:rotate(-18deg)}
.th-p-sandals .sandals-piece__meta{display:grid;gap:3px;min-width:0}
.th-p-sandals .sandals-piece__meta b{overflow-wrap:anywhere;font-family:var(--display);font-size:clamp(20px,1.75vw,28px);font-weight:600;letter-spacing:-.03em;line-height:1.05}
.th-p-sandals .sandals-piece__meta small{color:var(--muted);font-size:11px;line-height:1.4}
.th-p-sandals .sandals-piece__meta em{margin-top:2px;color:var(--sandals-terracotta);font-size:12px;font-style:normal;font-weight:700;letter-spacing:.03em}
.th-p-sandals #shop.sec{max-width:1480px;margin:0 auto;padding:clamp(54px,8vw,120px) clamp(20px,5vw,80px)}
.th-p-sandals #shop .sec-h{align-items:end;margin-bottom:clamp(26px,4vw,54px);padding-bottom:20px;border-bottom:1px solid var(--sandals-line)}
.th-p-sandals #shop .sec-h h2{max-width:11ch;font-family:var(--display);font-size:calc(clamp(42px,4.8vw,76px)*var(--ts));font-weight:600;letter-spacing:-.05em;line-height:.9}
.th-p-sandals .chips{gap:7px;overflow-x:auto;scrollbar-width:none}
.th-p-sandals .chip{min-height:44px;border:1px solid var(--sandals-line);border-radius:999px;background:var(--sandals-paper);font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
.th-p-sandals .chip[aria-current]{border-color:var(--sandals-water);background:var(--sandals-water);color:var(--onFoot)}
.th-p-sandals .grid{gap:clamp(34px,5vw,72px) clamp(14px,2vw,30px)}
.th-p-sandals .pc{gap:13px;text-align:left}
.th-p-sandals .pc .im{border-radius:50% 50% 16px 16px/12% 12% 16px 16px;background:var(--panel)}
.th-p-sandals .pc .tag{top:12px;left:12px;border-radius:999px;background:var(--sandals-water);color:var(--onFoot);font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
.th-p-sandals .pc .bd{grid-template-columns:minmax(0,1fr) auto;gap:5px 12px;align-items:start}
.th-p-sandals .pc h3{font-family:var(--display);font-size:calc(23px*var(--ts));font-weight:600;letter-spacing:-.03em;line-height:1.04}
.th-p-sandals .pc .pr{color:var(--sandals-terracotta);font-size:13px;font-weight:700}
.th-p-sandals .pc .rt{grid-column:1/-1;color:var(--muted)}
.th-p-sandals .pc .go{border-radius:999px;background:var(--sandals-terracotta);color:var(--onAccent);font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
.th-p-sandals .perks{background:var(--sandals-paper);border-color:var(--sandals-line)}
.th-p-sandals .perk svg{color:var(--sandals-terracotta)}
.th-p-sandals .ft{background:var(--sandals-water);color:var(--onFoot)}
.th-p-sandals :is(.sandals-hero,.sandals-discovery) a:focus-visible{outline:3px solid var(--sandals-terracotta);outline-offset:4px}
@media(max-width:920px){
  .th-p-sandals .sandals-hero{grid-template-columns:20px minmax(0,.78fr) minmax(0,1fr) 20px;grid-template-rows:42px minmax(360px,53vw) auto}
  .th-p-sandals .sandals-hero__caption{grid-column:1/4;padding-right:clamp(20px,5vw,48px)}
  .th-p-sandals .sandals-hero__detail{width:min(100%,165px);height:170px;margin-right:4px}
  .th-p-sandals .sandals-discovery{grid-template-columns:minmax(190px,.68fr) minmax(0,1.32fr);gap:clamp(26px,4vw,54px)}
}
@media(max-width:700px){
  .th-p-sandals .hd .wrap{min-height:64px}
  .th-p-sandals .nav{display:none}
  .th-p-sandals .sandals-hero{display:grid;grid-template-columns:16px minmax(0,1fr) 16px;grid-template-rows:46px minmax(362px,108vw) auto;min-height:0}
  .th-p-sandals .sandals-hero__sun{top:75px;right:-100px;width:270px}
  .th-p-sandals .sandals-hero__marker{grid-column:2;grid-row:1}
  .th-p-sandals .sandals-hero__portal{grid-column:2/4;grid-row:1/3;border-radius:48% 0 0 0/13% 0 0 0}
  .th-p-sandals .sandals-hero__portal>.hero-media{object-position:center center}
  .th-p-sandals .sandals-hero__caption{grid-column:1/4;grid-row:3;margin-top:-43px;padding:27px 20px 34px}
  .th-p-sandals .sandals-hero__collection{max-width:32ch;font-size:9px}
  .th-p-sandals .sandals-hero__copy h1{max-width:11ch;font-size:calc(clamp(46px,13.8vw,66px)*var(--hero));line-height:.84}
  .th-p-sandals .sandals-hero__copy h1.long{font-size:calc(clamp(34px,10vw,50px)*min(var(--hero),1.1))}
  .th-p-sandals .sandals-hero__copy .sub{max-width:34ch;font-size:14px}
  .th-p-sandals .sandals-hero__detail{display:none}
  .th-p-sandals .sandals-hero__arc--one{bottom:-145px;left:-125px;width:330px}
  .th-p-sandals .sandals-hero__arc--two{right:20px;bottom:28px;width:32px}
  .th-p-sandals .sandals-hero .motion-toggle{top:11px;right:11px}
  .th-p-sandals .sandals-discovery,.th-p-sandals .sandals-discovery--pieces{grid-template-columns:1fr;gap:30px;padding:56px 16px 68px}
  .th-p-sandals .sandals-discovery__intro{padding:0}
  .th-p-sandals .sandals-discovery h2{max-width:10ch;font-size:calc(clamp(39px,11vw,56px)*var(--ts))}
  .th-p-sandals .sandals-steps,.th-p-sandals .sandals-pieces{gap:10px}
  .th-p-sandals .sandals-step:nth-child(2),.th-p-sandals .sandals-step:nth-child(3),.th-p-sandals .sandals-piece:nth-child(2){margin-top:0;margin-bottom:0}
  .th-p-sandals .sandals-step__media{min-height:170px}
  .th-p-sandals .sandals-step__meta b{font-size:21px}
  .th-p-sandals .sandals-piece__meta b{font-size:20px}
  .th-p-sandals #shop.sec{padding:58px 16px 74px}
  .th-p-sandals #shop .sec-h{display:block;margin-bottom:28px}
  .th-p-sandals #shop .sec-h h2{font-size:calc(clamp(40px,11vw,56px)*var(--ts))}
  .th-p-sandals .chips{width:100%;margin-top:20px}
  .th-p-sandals .chip{flex:0 0 auto}
  .th-p-sandals .pc h3{font-size:calc(20px*var(--ts))}
  .th-p-sandals .pc .bd{display:block}
  .th-p-sandals .pc .pr{display:block;margin-top:5px}
}
@media(max-width:430px){
  .th-p-sandals .sandals-hero__copy .ctas{display:grid;width:100%}
  .th-p-sandals .sandals-hero__copy .btn{width:100%}
  .th-p-sandals .sandals-steps,.th-p-sandals .sandals-pieces{grid-template-columns:repeat(2,minmax(0,1fr))}
  .th-p-sandals .sandals-step:nth-child(3),.th-p-sandals .sandals-piece:nth-child(3){grid-column:1/-1;width:calc(50% - 5px)}
  .th-p-sandals .sandals-step__media{min-height:154px}
  .th-p-sandals .sandals-step__meta{padding-top:10px}
  .th-p-sandals .sandals-step__meta b{font-size:20px}
  .th-p-sandals .sandals-piece__meta b{font-size:19px}
}
@media(prefers-reduced-motion:reduce){
  .th-p-sandals .sandals-hero .hero-media{animation:none!important;transform:none!important}
}
`;

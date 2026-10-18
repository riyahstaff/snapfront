import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-pet-goods',
  name: 'Morrow & Moss',
  for: 'Thoughtful dog and cat essentials for a softer home life',
  vibe: 'Sunlit conservatory, mossy textiles, limestone warmth, and gentle daily rituals',
  category: 'Pet products and home essentials',
  group: 'lifestyle',
  display: 'Cormorant Garamond',
  body: 'Manrope',
  displayWeight: 500,
  tracking: '-.035em',
  colors: {
    bg: '#F6F0E4',
    surface: '#FFFDF7',
    ink: '#273025',
    muted: '#6B7467',
    line: '#D8D3C5',
    accent: '#4E6648',
    onAccent: '#FFFDF6',
    panel: '#344436',
    onPanel: '#F7F1E4',
    foot: '#1D281F',
    onFoot: '#F5EEDF',
    bar: '#EFF0E6',
    onBar: '#273025',
    badge: '#DDB36A',
    onBadge: '#273025',
  },
  header: 'center',
  hero: 'editorial',
  card: 'pastel',
  ratio: '4/5',
  rCard: 18,
  rBtn: 999,
  motion: 'drift',
  copy: {
    eyebrow: 'Thoughtful things for animals at home',
    collection: 'Choose a companion’s corner',
    cta: 'Browse the collection',
    title: 'A little wild, beautifully at home.',
    subtitle: 'Daily essentials shaped for the spaces and rituals you share.',
  },
  collection: 'premium',
  family: 'pet-goods',
  demoPhoto: '/assets/themes/pet-goods-hero.webp',
});

const countLabel = (count) => `${count} ${count === 1 ? 'item' : 'items'}`;

const categoryPanel = (ctx, category, index) => {
  const image = category.image
    ? `<img src="${ctx.esc(category.image)}" alt="" loading="lazy" decoding="async">`
    : '<span class="moss-path-empty" aria-hidden="true"><i></i><i></i><i></i></span>';

  return `<a class="moss-path moss-path-${index + 1}" href="${ctx.categoryLink(category.name)}">
    <span class="moss-path-image">${image}</span>
    <span class="moss-path-shade" aria-hidden="true"></span>
    <span class="moss-path-copy">
      <small>Explore the collection</small>
      <strong>${ctx.esc(category.name)}</strong>
      <em>${countLabel(category.count)}</em>
    </span>
    <span class="moss-path-arrow" aria-hidden="true">↗</span>
  </a>`;
};

const productRow = (ctx, product, index) => {
  const image = product.image_url
    ? `<img src="${ctx.esc(product.image_url)}" alt="${ctx.esc(product.alt_text || product.title)}" loading="lazy" decoding="async">`
    : '<span class="moss-product-empty" aria-hidden="true">✦</span>';
  const price = Number.isFinite(Number(product.price_cents))
    ? `<small>${ctx.money(Number(product.price_cents), product.currency || 'usd', product?.billing_interval)}</small>`
    : '';
  return `<a class="moss-product-row" href="${ctx.productLink(product)}">
    <span class="moss-product-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
    <span class="moss-product-image">${image}</span>
    <span class="moss-product-copy"><strong>${ctx.esc(product.title)}</strong>${product.category ? `<em>${ctx.esc(product.category)}</em>` : ''}${price}</span>
    <span class="moss-product-arrow" aria-hidden="true">↗</span>
  </a>`;
};

export function hero(ctx) {
  return `<section class="hero category-hero moss-hero${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="moss-hero-canvas" aria-hidden="true">
      <span class="moss-shelf moss-shelf-left"><i></i><i></i><i></i></span>
      <span class="moss-shelf moss-shelf-right"><i></i><i></i><i></i></span>
    </div>
    <div class="moss-hero-arch">${ctx.media(0, { priority: true, lazy: false, decorative: true })}</div>
    <div class="moss-hero-glow" aria-hidden="true"></div>
    <div class="wrap moss-hero-wrap">
      <div class="moss-hero-copy">${ctx.copy('moss-copy')}</div>
      <p class="moss-hero-whisper"><span aria-hidden="true"></span>Made for the ordinary magic of home</p>
    </div>
    ${ctx.controls}
  </section>`;
}

export function discovery(ctx) {
  const categories = (ctx.cats || []).filter((category) => category?.name).slice(0, 2);
  const products = (ctx.products || []).filter((product) => product?.title).slice(0, 4);

  if (categories.length >= 2) {
    return `<section class="theme-discovery moss-discovery" aria-labelledby="moss-discovery-title">
      <div class="wrap moss-discovery-wrap">
        <div class="moss-discovery-intro">
          <p class="eyebrow">${ctx.esc(ctx.t.copy?.collection || 'Choose a companion’s corner')}</p>
          <h2 id="moss-discovery-title">Small things that make a home feel shared.</h2>
          <p>Begin with the collection that feels most like their everyday.</p>
        </div>
        <div class="moss-paths">${categories.map((category, index) => categoryPanel(ctx, category, index)).join('')}</div>
      </div>
    </section>`;
  }

  if (products.length) {
    return `<section class="theme-discovery moss-discovery moss-discovery-products" aria-labelledby="moss-discovery-title">
      <div class="wrap moss-discovery-wrap">
        <div class="moss-discovery-intro">
          <p class="eyebrow">${ctx.esc(ctx.t.copy?.collection || 'Everyday companions')}</p>
          <h2 id="moss-discovery-title">For the bright, busy, restful moments.</h2>
          <p>Explore what is currently in the shop.</p>
        </div>
        <div class="moss-product-list">${products.map((product, index) => productRow(ctx, product, index)).join('')}</div>
      </div>
    </section>`;
  }

  return '';
}

export const css = `
.th-p-pet-goods .hd{background:rgba(246,240,228,.96);border-bottom:1px solid #D8D3C5;box-shadow:none}
.th-p-pet-goods .hd .wrap{min-height:76px}
.th-p-pet-goods .hd .brand{font-family:var(--display);font-size:clamp(20px,1.6vw,25px);font-weight:500;letter-spacing:.055em;text-transform:uppercase}
.th-p-pet-goods .hd .nav a{font-size:12px;font-weight:600;letter-spacing:.055em}
.th-p-pet-goods .hd .cart{border:1px solid #A5AD9D;border-radius:999px;padding:9px 13px}
.th-p-pet-goods .moss-hero{isolation:isolate;position:relative;min-height:clamp(560px,48vw,700px);overflow:hidden;background:#EDE7D9;color:#253025}
.th-p-pet-goods .moss-hero-canvas{position:absolute;inset:0;z-index:-4;overflow:hidden;background:linear-gradient(90deg,#E9E3D5 0%,#F4F0E6 35%,#EEE9DD 100%)}
.th-p-pet-goods .moss-hero-canvas::before{content:'';position:absolute;inset:-12% 0 auto;width:100%;height:76%;background:radial-gradient(ellipse at 50% 100%,rgba(255,253,245,.92),rgba(255,253,245,0) 67%)}
.th-p-pet-goods .moss-hero-canvas::after{content:'';position:absolute;inset:auto 0 0;height:17%;background:linear-gradient(90deg,#D8D1C1,#F8F4EA 47%,#D8D1C1);border-top:1px solid rgba(55,65,52,.14)}
.th-p-pet-goods .moss-shelf{position:absolute;top:0;bottom:0;width:clamp(115px,15vw,255px);opacity:.8}
.th-p-pet-goods .moss-shelf::before,.th-p-pet-goods .moss-shelf::after{content:'';position:absolute;left:10%;right:0;height:1px;background:rgba(56,69,54,.25)}
.th-p-pet-goods .moss-shelf::before{top:22%}
.th-p-pet-goods .moss-shelf::after{top:48%}
.th-p-pet-goods .moss-shelf-left{left:0;border-right:1px solid rgba(56,69,54,.17);background:linear-gradient(90deg,rgba(209,201,184,.46),transparent)}
.th-p-pet-goods .moss-shelf-right{right:0;border-left:1px solid rgba(56,69,54,.17);background:linear-gradient(270deg,rgba(209,201,184,.46),transparent)}
.th-p-pet-goods .moss-shelf i{position:absolute;display:block;border:1px solid rgba(54,67,52,.24);border-radius:45% 45% 35% 35%;background:rgba(78,102,72,.15)}
.th-p-pet-goods .moss-shelf i:nth-child(1){top:27%;left:clamp(16px,3vw,52px);width:40px;height:55px}
.th-p-pet-goods .moss-shelf i:nth-child(2){top:53%;left:clamp(40px,6vw,96px);width:24px;height:36px;background:rgba(191,148,81,.17)}
.th-p-pet-goods .moss-shelf i:nth-child(3){top:59%;left:clamp(12px,2.2vw,35px);width:62px;height:30px;border-radius:50%;background:rgba(255,253,247,.52)}
.th-p-pet-goods .moss-shelf-right i:nth-child(1){top:17%;left:auto;right:clamp(20px,4vw,75px);width:56px;height:37px;border-radius:6px;background:rgba(255,253,247,.5)}
.th-p-pet-goods .moss-shelf-right i:nth-child(2){top:53%;left:auto;right:clamp(38px,7vw,115px);width:48px;height:52px;background:rgba(78,102,72,.17)}
.th-p-pet-goods .moss-shelf-right i:nth-child(3){top:62%;left:auto;right:clamp(10px,2vw,35px);width:37px;height:49px;border-radius:48% 48% 42% 42%;background:rgba(191,148,81,.18)}
.th-p-pet-goods .moss-hero-arch{position:absolute;z-index:-3;top:clamp(26px,4vw,62px);bottom:0;left:50%;width:min(58vw,890px);overflow:hidden;border-radius:min(29vw,430px) min(29vw,430px) 0 0;transform:translateX(-50%);background:linear-gradient(145deg,#839071,#D7C19A);box-shadow:0 0 0 8px rgba(255,253,246,.66),0 0 0 9px rgba(69,84,63,.16)}
.th-p-pet-goods .moss-hero-arch .hero-media{width:100%;height:100%;max-width:none;display:block;object-fit:cover;object-position:center 53%;transform:scale(1.001)}
.th-p-pet-goods .moss-hero-arch .theme-empty-media{width:100%;height:100%;min-height:0;background:radial-gradient(circle at 69% 60%,#D8B66E 0 4%,transparent 4.5%),radial-gradient(ellipse at 52% 76%,#75866E 0 14%,transparent 14.5%),linear-gradient(145deg,#394C39,#BAA27B 54%,#E6D8C0);color:#F6F0E4}
.th-p-pet-goods .moss-hero-glow{position:absolute;z-index:-2;inset:0;background:linear-gradient(90deg,rgba(246,240,228,.48) 0%,rgba(246,240,228,.12) 25%,rgba(246,240,228,.06) 73%,rgba(246,240,228,.48) 100%),linear-gradient(0deg,rgba(49,62,46,.19),transparent 30%)}
.th-p-pet-goods .moss-hero-wrap{position:relative;min-height:inherit;display:flex;flex-direction:column;align-items:center;justify-content:center;padding-top:clamp(62px,7vw,110px);padding-bottom:clamp(80px,9vw,130px);pointer-events:none}
.th-p-pet-goods .moss-hero-copy{width:min(100%,610px);text-align:center;pointer-events:auto}
.th-p-pet-goods .moss-copy .txt{max-width:100%}
.th-p-pet-goods .moss-copy .eyebrow{margin:0 0 17px;color:#4E6648;font:700 10px/1.3 var(--body);letter-spacing:.24em;text-transform:uppercase}
.th-p-pet-goods .moss-copy h1{max-width:11.3ch;margin:0 auto;color:#263126;font-family:var(--display);font-size:clamp(51px,5.7vw,84px);font-weight:var(--dw);letter-spacing:var(--dt);line-height:.88;text-wrap:balance;text-shadow:0 1px 22px rgba(255,254,248,.7)}
.th-p-pet-goods .moss-copy h1.long{max-width:16ch;font-size:clamp(40px,4.3vw,65px);line-height:.94}
.th-p-pet-goods .moss-copy .sub{max-width:40ch;margin:20px auto 0;color:#3D4B3C;font-size:clamp(14px,1.15vw,17px);line-height:1.55;text-wrap:balance}
.th-p-pet-goods .moss-copy .ctas{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-top:26px}
.th-p-pet-goods .moss-copy .btn{display:inline-flex;align-items:center;justify-content:center;min-height:47px;border:1px solid #4E6648;border-radius:999px;background:#4E6648;color:#FFFDF6;padding:11px 21px;font-size:12px;font-weight:700;letter-spacing:.04em;box-shadow:0 5px 14px rgba(49,66,47,.15)}
.th-p-pet-goods .moss-copy .btn:hover{border-color:#344C35;background:#344C35;color:#FFFDF6}
.th-p-pet-goods .moss-copy .btn.ghost{background:rgba(255,253,246,.74);color:#304332}
.th-p-pet-goods .moss-copy .btn.ghost:hover{background:#FFFDF6;color:#263126}
.th-p-pet-goods .moss-hero-whisper{position:absolute;bottom:clamp(23px,4vw,43px);left:50%;display:flex;align-items:center;gap:10px;margin:0;color:#536251;font:700 9px/1.2 var(--body);letter-spacing:.18em;text-transform:uppercase;transform:translateX(-50%);white-space:nowrap}
.th-p-pet-goods .moss-hero-whisper span{display:block;width:28px;height:1px;background:#829078}
.th-p-pet-goods .moss-hero .motion-toggle{position:absolute;right:clamp(16px,3vw,44px);bottom:20px;z-index:3;min-height:44px;border:1px solid rgba(50,67,49,.37);border-radius:999px;background:rgba(255,253,246,.78);color:#304331;padding:9px 13px;font:700 10px/1 var(--body);letter-spacing:.05em}
.th-p-pet-goods .moss-hero .motion-toggle:hover{background:#4E6648;border-color:#4E6648;color:#FFFDF6}
.th-p-pet-goods .moss-hero.has-hero-motion .moss-hero-arch .hero-media{animation:pet-goods-drift 20s ease-in-out infinite alternate}
.th-p-pet-goods .moss-hero.has-hero-motion.is-motion-paused .moss-hero-arch .hero-media{animation-play-state:paused}
@keyframes pet-goods-drift{0%{transform:scale(1.025) translate3d(-.65%,.25%,0)}100%{transform:scale(1.09) translate3d(.65%,-.65%,0)}}
.th-p-pet-goods .perks{background:#E9EADF;border-block:1px solid #D0D5C7}
.th-p-pet-goods .perks .wrap{gap:0}
.th-p-pet-goods .perks .perk{padding:20px clamp(13px,2.5vw,31px);border-inline-start:1px solid #CDD2C3;color:#364236}
.th-p-pet-goods .perks .perk:first-child{border-inline-start:0}
.th-p-pet-goods .perks .perk svg{color:#60755B}
.th-p-pet-goods .perks .perk b{font-family:var(--display);font-size:18px;font-weight:500;letter-spacing:-.01em}
.th-p-pet-goods .moss-discovery{position:relative;overflow:hidden;padding:clamp(62px,8vw,116px) 0;background:#F6F0E4}
.th-p-pet-goods .moss-discovery::before{content:'';position:absolute;inset:auto -9% -22% auto;width:47vw;height:47vw;border:1px solid rgba(79,102,73,.12);border-radius:50%;box-shadow:0 0 0 28px rgba(79,102,73,.035),0 0 0 57px rgba(79,102,73,.025)}
.th-p-pet-goods .moss-discovery-wrap{position:relative}
.th-p-pet-goods .moss-discovery-intro{max-width:660px;margin:0 auto clamp(33px,4vw,55px);text-align:center}
.th-p-pet-goods .moss-discovery .eyebrow{margin:0 0 12px;color:#56704F;font:700 10px/1.2 var(--body);letter-spacing:.23em;text-transform:uppercase}
.th-p-pet-goods .moss-discovery h2{margin:0;color:#273025;font-family:var(--display);font-size:clamp(39px,4.2vw,65px);font-weight:var(--dw);letter-spacing:var(--dt);line-height:.93;text-wrap:balance}
.th-p-pet-goods .moss-discovery-intro>p:last-child{max-width:48ch;margin:17px auto 0;color:#687268;font-size:15px;line-height:1.55}
.th-p-pet-goods .moss-paths{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:clamp(12px,1.7vw,25px)}
.th-p-pet-goods .moss-path{position:relative;display:flex;min-height:clamp(315px,32vw,470px);align-items:flex-end;overflow:hidden;border:1px solid #CAC7B7;border-radius:2px;background:#879076;color:#FFFDF6;text-decoration:none;isolation:isolate}
.th-p-pet-goods .moss-path-image{position:absolute;inset:0;z-index:-3;overflow:hidden;background:linear-gradient(145deg,#617560,#C6A97D)}
.th-p-pet-goods .moss-path-image img{width:100%;height:100%;display:block;object-fit:cover;transition:transform .45s ease}
.th-p-pet-goods .moss-path-shade{position:absolute;z-index:-2;inset:0;background:linear-gradient(0deg,rgba(26,37,27,.86),rgba(29,40,28,.08) 69%)}
.th-p-pet-goods .moss-path:hover .moss-path-image img{transform:scale(1.045)}
.th-p-pet-goods .moss-path-empty{width:100%;height:100%;display:flex;align-items:center;justify-content:center;gap:14px;background:radial-gradient(circle at 67% 55%,#D5B66E 0 6%,transparent 6.5%),linear-gradient(145deg,#536C55,#A98A62)}
.th-p-pet-goods .moss-path-empty i{display:block;width:25px;height:25px;border:1px solid rgba(255,253,246,.78);border-radius:50% 50% 43% 43%;transform:rotate(45deg)}
.th-p-pet-goods .moss-path-empty i:nth-child(2){width:42px;height:42px;background:rgba(255,253,246,.12)}
.th-p-pet-goods .moss-path-copy{position:relative;z-index:1;display:flex;min-width:0;flex-direction:column;gap:5px;padding:clamp(20px,2.6vw,35px)}
.th-p-pet-goods .moss-path-copy small{font:700 9px/1.2 var(--body);letter-spacing:.19em;text-transform:uppercase}
.th-p-pet-goods .moss-path-copy strong{max-width:10ch;overflow-wrap:anywhere;font-family:var(--display);font-size:clamp(36px,4vw,59px);font-weight:500;letter-spacing:-.035em;line-height:.85;text-wrap:balance}
.th-p-pet-goods .moss-path-copy em{font:600 10px/1.2 var(--body);letter-spacing:.13em;text-transform:uppercase}
.th-p-pet-goods .moss-path-arrow{position:absolute;right:clamp(17px,2.4vw,32px);bottom:clamp(17px,2.4vw,32px);display:grid;width:43px;height:43px;place-items:center;border:1px solid rgba(255,253,246,.7);border-radius:50%;color:#FFFDF6;font-size:18px;transition:background .2s ease,color .2s ease}
.th-p-pet-goods .moss-path:hover .moss-path-arrow{background:#FFFDF6;color:#304332}
.th-p-pet-goods .moss-product-list{border-top:1px solid #C9C8B9}
.th-p-pet-goods .moss-product-row{display:grid;grid-template-columns:56px minmax(130px,200px) minmax(0,1fr) 48px;align-items:center;min-height:128px;gap:clamp(12px,2vw,29px);border-bottom:1px solid #C9C8B9;color:#2C372C;text-decoration:none}
.th-p-pet-goods .moss-product-number{align-self:stretch;display:grid;place-items:center;border-right:1px solid #C9C8B9;color:#65805E;font:700 10px/1 var(--body);letter-spacing:.13em}
.th-p-pet-goods .moss-product-image{align-self:stretch;position:relative;display:block;overflow:hidden;background:#D6D7C8}
.th-p-pet-goods .moss-product-image img{width:100%;height:100%;display:block;object-fit:cover;transition:transform .35s ease}
.th-p-pet-goods .moss-product-row:hover .moss-product-image img{transform:scale(1.045)}
.th-p-pet-goods .moss-product-empty{display:grid;width:100%;height:100%;place-items:center;background:#5F755D;color:#F8F3E8;font:400 28px/1 var(--display)}
.th-p-pet-goods .moss-product-copy{display:flex;min-width:0;flex-direction:column;gap:5px;padding:17px 0}
.th-p-pet-goods .moss-product-copy strong{overflow-wrap:anywhere;font-family:var(--display);font-size:clamp(24px,2.3vw,35px);font-weight:500;letter-spacing:-.025em;line-height:.98}
.th-p-pet-goods .moss-product-copy em{color:#677164;font:700 10px/1.2 var(--body);letter-spacing:.13em;text-transform:uppercase}
.th-p-pet-goods .moss-product-copy small{color:#4E6648;font:700 13px/1.2 var(--body)}
.th-p-pet-goods .moss-product-arrow{display:grid;width:44px;height:44px;place-items:center;border:1px solid transparent;border-radius:50%;color:#4E6648;font-size:19px;transition:background .2s ease,color .2s ease}
.th-p-pet-goods .moss-product-row:hover .moss-product-arrow{border-color:#93A189;background:#E5E8DC;color:#304332}
.th-p-pet-goods #shop{padding-block:clamp(64px,8vw,112px);background:linear-gradient(180deg,#344436 0 128px,#F6F0E4 128px)}
.th-p-pet-goods #shop .wrap{padding-top:clamp(18px,3vw,40px)}
.th-p-pet-goods #shop .sec-h{align-items:end;margin-bottom:clamp(26px,3.5vw,47px)}
.th-p-pet-goods #shop .sec-h h2{max-width:11ch;color:#FFF8EA;font-family:var(--display);font-size:clamp(40px,4.5vw,65px);font-weight:500;letter-spacing:-.04em;line-height:.88}
.th-p-pet-goods #shop .chips{max-width:660px;justify-content:flex-end}
.th-p-pet-goods #shop .chip{min-height:42px;border:1px solid rgba(255,248,234,.54);border-radius:999px;background:transparent;color:#FFF8EA;font-size:11px;font-weight:700;letter-spacing:.025em}
.th-p-pet-goods #shop .chip.on,.th-p-pet-goods #shop .chip:hover{border-color:#DDB36A;background:#DDB36A;color:#273025}
.th-p-pet-goods #shop .grid{gap:clamp(22px,2.8vw,38px) clamp(13px,1.8vw,24px)}
.th-p-pet-goods #shop .pc{overflow:hidden;border:1px solid #D4D1C2;border-radius:18px;background:#FFFDF7;box-shadow:none;transition:transform .25s ease,box-shadow .25s ease}
.th-p-pet-goods #shop .pc:hover{transform:translateY(-4px);box-shadow:0 16px 30px rgba(47,61,47,.14)}
.th-p-pet-goods #shop .pc .im{position:relative;overflow:hidden;background:#E1E3D6}
.th-p-pet-goods #shop .pc .im img{transition:transform .38s ease}
.th-p-pet-goods #shop .pc:hover .im img{transform:scale(1.035)}
.th-p-pet-goods #shop .pc .bd{display:grid;gap:8px;padding:18px 18px 20px}
.th-p-pet-goods #shop .pc h3{font-family:var(--display);font-size:clamp(22px,1.9vw,29px);font-weight:500;letter-spacing:-.025em;line-height:.99}
.th-p-pet-goods #shop .pc .pr{color:#4E6648;font:700 13px/1.2 var(--body)}
.th-p-pet-goods #shop .pc .tag{top:11px;left:11px;border-radius:999px;background:#344436;color:#FFF8EA;font:700 9px/1 var(--body);letter-spacing:.09em;text-transform:uppercase}
.th-p-pet-goods #shop .pc .go{right:11px;bottom:11px;border-radius:50%;background:#FFFDF7;color:#344436}
.th-p-pet-goods .feat{background:#E9EADF}
.th-p-pet-goods .feat .pic{position:relative;overflow:hidden;border:1px solid #CED3C5;border-radius:2px}
.th-p-pet-goods .feat .txt h2,.th-p-pet-goods .story .txt h2{font-family:var(--display);font-weight:500;letter-spacing:-.03em}
.th-p-pet-goods .ft{background:#1D281F;color:#F5EEDF}
.th-p-pet-goods .ft a{color:#FFF9EC}
@media (max-width:820px){
  .th-p-pet-goods .hd .wrap{min-height:66px}
  .th-p-pet-goods .moss-hero{min-height:590px}
  .th-p-pet-goods .moss-hero-arch{width:min(78vw,690px)}
  .th-p-pet-goods .moss-shelf{width:15vw;opacity:.45}
  .th-p-pet-goods .moss-path{min-height:350px}
  .th-p-pet-goods #shop{background:linear-gradient(180deg,#344436 0 105px,#F6F0E4 105px)}
  .th-p-pet-goods #shop .chips{justify-content:flex-start}
}
@media (max-width:620px){
  .th-p-pet-goods .hd .brand{font-size:17px;letter-spacing:.04em}
  .th-p-pet-goods .moss-hero{min-height:620px}
  .th-p-pet-goods .moss-hero-canvas::after{height:13%}
  .th-p-pet-goods .moss-shelf{display:none}
  .th-p-pet-goods .moss-hero-arch{top:25px;width:calc(100% - 42px);border-radius:45vw 45vw 0 0}
  .th-p-pet-goods .moss-hero-arch .hero-media{object-position:57% center}
  .th-p-pet-goods .moss-hero-glow{background:linear-gradient(180deg,rgba(246,240,228,.52),rgba(246,240,228,.11) 42%,rgba(246,240,228,.35) 100%)}
  .th-p-pet-goods .moss-hero-wrap{justify-content:flex-end;padding-top:115px;padding-bottom:113px}
  .th-p-pet-goods .moss-copy h1{max-width:10.2ch;font-size:clamp(47px,13vw,62px)}
  .th-p-pet-goods .moss-copy h1.long{max-width:12.5ch;font-size:clamp(37px,10vw,50px)}
  .th-p-pet-goods .moss-copy .sub{font-size:14px}
  .th-p-pet-goods .moss-copy .ctas{margin-top:21px}
  .th-p-pet-goods .moss-copy .btn{flex:1 1 170px;min-height:46px}
  .th-p-pet-goods .moss-hero-whisper{bottom:28px;font-size:8px;letter-spacing:.12em}
  .th-p-pet-goods .moss-hero .motion-toggle{right:14px;bottom:14px}
  .th-p-pet-goods .perks .wrap{display:block}
  .th-p-pet-goods .perks .perk{border-inline-start:0;border-top:1px solid #CDD2C3;padding:16px 0}
  .th-p-pet-goods .perks .perk:first-child{border-top:0}
  .th-p-pet-goods .moss-discovery{padding-block:61px}
  .th-p-pet-goods .moss-discovery h2{font-size:clamp(37px,10.5vw,50px)}
  .th-p-pet-goods .moss-paths{grid-template-columns:1fr;gap:13px}
  .th-p-pet-goods .moss-path{min-height:266px}
  .th-p-pet-goods .moss-path-copy strong{font-size:42px}
  .th-p-pet-goods .moss-product-row{grid-template-columns:38px 95px minmax(0,1fr) 36px;min-height:110px;gap:11px}
  .th-p-pet-goods .moss-product-copy{padding-block:14px}
  .th-p-pet-goods .moss-product-copy strong{font-size:24px}
  .th-p-pet-goods .moss-product-arrow{width:36px;height:36px}
  .th-p-pet-goods #shop{padding-top:60px;background:linear-gradient(180deg,#344436 0 93px,#F6F0E4 93px)}
  .th-p-pet-goods #shop .sec-h h2{font-size:clamp(39px,11vw,54px)}
  .th-p-pet-goods #shop .chip{min-height:44px}
}
@media (prefers-reduced-motion:reduce){
  .th-p-pet-goods .moss-hero.has-hero-motion .moss-hero-arch .hero-media{animation:none}
  .th-p-pet-goods .moss-path-image img,.th-p-pet-goods #shop .pc,.th-p-pet-goods #shop .pc .im img{transition:none}
}
`;

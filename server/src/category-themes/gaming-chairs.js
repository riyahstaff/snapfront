import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-gaming-chairs',
  name: 'SIT / SIGNAL',
  for: 'Gaming chairs and focused play setups',
  vibe: 'Cobalt signal bay, midnight studio light, and precise cockpit-gallery framing',
  category: 'Gaming chairs',
  group: 'technology',
  display: 'Archivo',
  body: 'DM Sans',
  displayWeight: 800,
  tracking: '-.065em',
  colors: {
    bg: '#07101F',
    surface: '#0D1A2E',
    ink: '#F2F7FF',
    muted: '#9AA9BF',
    line: '#304560',
    accent: '#5BA7FF',
    onAccent: '#06101F',
    panel: '#142744',
    onPanel: '#E7F2FF',
    foot: '#050B14',
    onFoot: '#AEBED2',
    bar: '#091321',
    onBar: '#EFF6FF',
    badge: '#B7D7FF',
    onBadge: '#07101F',
  },
  header: 'split',
  hero: 'spotlight',
  card: 'bold',
  ratio: '4/5',
  rCard: 0,
  rBtn: 0,
  motion: 'pan',
  copy: {
    eyebrow: 'Focused seating / current selection',
    collection: 'The seat index',
    cta: 'Explore seating',
    title: 'Take your seat in the signal.',
    subtitle: 'A focused edit for the place play happens.',
  },
});

const safeProducts = (ctx) => (Array.isArray(ctx.products) ? ctx.products : []).filter(Boolean);
const safeCategories = (ctx) => (Array.isArray(ctx.cats) ? ctx.cats : []).filter((category) => category?.name);
const countLabel = (count) => `${count} ${Number(count) === 1 ? 'piece' : 'pieces'}`;

const productPrice = (ctx, product) => {
  const rawAmount = product?.price_cents;
  if (rawAmount === undefined || rawAmount === null || rawAmount === '') return '';
  const amount = Number(rawAmount);
  return Number.isFinite(amount) ? ctx.money(amount, product.currency || 'usd') : '';
};

const heroChannels = (ctx, categories) => {
  if (!categories.length) {
    return `<a class="gc-channel gc-channel-only" href="#shop"><span class="gc-channel-index">01</span><span class="gc-channel-name">Browse current seating</span><span class="gc-channel-arrow" aria-hidden="true">↗</span></a>`;
  }

  return categories.slice(0, 3).map((category, index) => {
    const count = Number(category.count) || 0;
    return `<a class="gc-channel" href="${ctx.esc(ctx.categoryLink(category.name))}"><span class="gc-channel-index">${String(index + 1).padStart(2, '0')}</span><span class="gc-channel-name">${ctx.esc(category.name)}</span><small>${ctx.esc(countLabel(count))}</small><span class="gc-channel-arrow" aria-hidden="true">↗</span></a>`;
  }).join('');
};

const categoryCard = (ctx, category, index) => {
  const count = Number(category.count) || 0;
  const art = category.image
    ? `<img src="${ctx.esc(category.image)}" alt="" loading="lazy" decoding="async">`
    : `<span class="gc-category-empty" aria-hidden="true"><i></i></span>`;

  return `<a class="gc-category-card" href="${ctx.esc(ctx.categoryLink(category.name))}">
    <span class="gc-category-number">${String(index + 1).padStart(2, '0')}</span>
    <span class="gc-category-art">${art}</span>
    <span class="gc-category-copy"><b>${ctx.esc(category.name)}</b><small>${ctx.esc(countLabel(count))}</small></span>
    <span class="gc-category-arrow" aria-hidden="true">↗</span>
  </a>`;
};

const productCard = (ctx, product, index) => {
  const title = product.title || 'Available chair';
  const price = productPrice(ctx, product);
  const art = product.image_url
    ? `<img src="${ctx.esc(product.image_url)}" alt="${ctx.esc(product.alt_text || title)}" loading="lazy" decoding="async">`
    : `<span class="gc-product-empty" aria-hidden="true"><i></i></span>`;

  return `<a class="gc-product-card" href="${ctx.esc(ctx.productLink(product))}">
    <span class="gc-product-art">${art}<i class="gc-product-number">${String(index + 1).padStart(2, '0')}</i></span>
    <span class="gc-product-copy"><b>${ctx.esc(title)}</b>${product.category ? `<small>${ctx.esc(product.category)}</small>` : ''}${price ? `<em>${ctx.esc(price)}</em>` : ''}</span>
    <span class="gc-product-arrow" aria-hidden="true">↗</span>
  </a>`;
};

export function hero(ctx) {
  const categories = safeCategories(ctx);
  return `<section class="hero category-hero gc-signal-bay${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="gc-hero-photo">${ctx.media(0, { priority: true, lazy: false, decorative: true })}</div>
    <div class="gc-photo-shade" aria-hidden="true"></div>
    <div class="gc-arc gc-arc-one" aria-hidden="true"></div>
    <div class="gc-arc gc-arc-two" aria-hidden="true"></div>
    <div class="gc-hero-grid">
      <aside class="gc-bay-marker" aria-hidden="true"><span>SEAT</span><i></i><strong>01</strong><small>FOCUS<br>FIELD</small></aside>
      <div class="gc-copy-field">${ctx.copy('gc-copy')}</div>
      <div class="gc-corner-caption" aria-hidden="true"><span>POSITION / READY</span><i></i><span>MOVE WITH INTENT</span></div>
      <div class="gc-channel-bank">
        <p>Browse the selection</p>
        <nav class="gc-channel-list" aria-label="Browse chair categories">${heroChannels(ctx, categories)}</nav>
      </div>
    </div>
    ${ctx.controls}
  </section>`;
}

export function discovery(ctx) {
  const categories = safeCategories(ctx);
  const products = safeProducts(ctx);

  if (categories.length >= 2) {
    return `<section class="theme-discovery gc-discovery" aria-labelledby="gc-discovery-title">
      <div class="gc-discovery-radar" aria-hidden="true"><span>02</span><i></i><b>SELECT<br>A LANE</b></div>
      <div class="gc-discovery-intro">
        <p class="gc-kicker">${ctx.esc(ctx.t.copy.collection)}</p>
        <h2 id="gc-discovery-title">Find the chair that holds your focus.</h2>
        <p>Browse the live collection by the categories this store has ready.</p>
        <a class="gc-all-link" href="#shop">See all seating <span aria-hidden="true">↘</span></a>
      </div>
      <div class="gc-category-board">${categories.slice(0, 4).map((category, index) => categoryCard(ctx, category, index)).join('')}</div>
    </section>`;
  }

  if (products.length) {
    return `<section class="theme-discovery gc-discovery gc-discovery-products" aria-labelledby="gc-discovery-title">
      <div class="gc-discovery-radar" aria-hidden="true"><span>02</span><i></i><b>CURRENT<br>SEATS</b></div>
      <div class="gc-discovery-intro">
        <p class="gc-kicker">Current selection</p>
        <h2 id="gc-discovery-title">Settle into what is here now.</h2>
        <p>Explore the chairs currently available in this store.</p>
        <a class="gc-all-link" href="#shop">See all seating <span aria-hidden="true">↘</span></a>
      </div>
      <div class="gc-product-board">${products.slice(0, 4).map((product, index) => productCard(ctx, product, index)).join('')}</div>
    </section>`;
  }

  return '';
}

export const css = `
.th-p-gaming-chairs{background:#07101F;color:#F2F7FF}
.th-p-gaming-chairs .hd{background:#091321;border-bottom:1px solid #304560}
.th-p-gaming-chairs .hd .wrap{max-width:1560px}
.th-p-gaming-chairs .hd :is(.brand,.nav a,.cart){color:#EFF6FF}
.th-p-gaming-chairs .hd .brand{font-family:var(--display);font-size:calc(14px * var(--ts));font-weight:800;letter-spacing:.085em;text-transform:uppercase}
.th-p-gaming-chairs .hd .nav a{font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}
.th-p-gaming-chairs .hd .nav a:hover{color:#8FC4FF}
.th-p-gaming-chairs .hd .cart{border-color:#405774;border-radius:0;background:#142744}
.th-p-gaming-chairs .gc-signal-bay{position:relative;isolation:isolate;min-height:clamp(620px,53vw,790px);overflow:hidden;background:#07101F;color:#F2F7FF}
.th-p-gaming-chairs .gc-hero-photo{position:absolute;z-index:-3;inset:0;overflow:hidden;background:#0D1A2E}
.th-p-gaming-chairs .gc-hero-photo .hero-media{display:block;width:100%;height:100%;object-fit:cover;object-position:center center}
.th-p-gaming-chairs .gc-hero-photo .theme-empty-media{height:100%;min-height:clamp(620px,53vw,790px);background:radial-gradient(circle at 67% 50%,#315B91 0 3%,#142744 21%,#081526 57%,#050A12 100%)}
.th-p-gaming-chairs .gc-photo-shade{position:absolute;z-index:-2;inset:0;pointer-events:none;background:linear-gradient(90deg,#06101FF5 0%,#07101FD9 22%,#07101F70 52%,#07101F13 76%),linear-gradient(0deg,#07101FC9 0%,transparent 39%,#07101F28 100%)}
.th-p-gaming-chairs .gc-arc{position:absolute;z-index:-1;pointer-events:none;border:1px solid #9ACBFF2B;border-radius:50%}
.th-p-gaming-chairs .gc-arc-one{width:clamp(510px,61vw,1000px);aspect-ratio:1;right:clamp(-325px,-12vw,-130px);top:clamp(-100px,-7vw,-28px)}
.th-p-gaming-chairs .gc-arc-two{width:clamp(360px,45vw,720px);aspect-ratio:1;right:clamp(-235px,-9vw,-82px);top:clamp(5px,6vw,98px);border-color:#5BA7FF38}
.th-p-gaming-chairs .gc-hero-grid{position:relative;display:grid;grid-template-columns:clamp(76px,10vw,152px) minmax(0,1fr) minmax(220px,25vw,365px);grid-template-rows:minmax(0,1fr) auto;min-height:clamp(620px,53vw,790px);max-width:1640px;margin:0 auto}
.th-p-gaming-chairs .gc-bay-marker{grid-column:1;grid-row:1 / -1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:15px;padding:clamp(31px,4vw,62px) 0 clamp(24px,3vw,44px);border-right:1px solid #A8D2FF3C;background:linear-gradient(90deg,#07101FC9,#07101F5C);color:#DCEEFF}
.th-p-gaming-chairs .gc-bay-marker span{font:700 9px/1 var(--body);letter-spacing:.25em;writing-mode:vertical-rl}
.th-p-gaming-chairs .gc-bay-marker i{display:block;width:1px;height:clamp(84px,12vw,177px);background:linear-gradient(#5BA7FF,#5BA7FF22)}
.th-p-gaming-chairs .gc-bay-marker strong{font:800 clamp(36px,4.7vw,72px)/.72 var(--display);letter-spacing:-.1em}
.th-p-gaming-chairs .gc-bay-marker small{color:#B8CBE1;font:700 8px/1.6 var(--body);letter-spacing:.16em;writing-mode:vertical-rl}
.th-p-gaming-chairs .gc-copy-field{grid-column:2;grid-row:1;align-self:center;min-width:0;padding:clamp(56px,8vw,127px) clamp(20px,5vw,86px) clamp(34px,5vw,74px)}
.th-p-gaming-chairs .gc-copy{max-width:47rem}
.th-p-gaming-chairs .gc-copy .eyebrow,.th-p-gaming-chairs .gc-kicker{margin:0 0 18px;color:#8FC4FF;font:700 10px/1.2 var(--body);letter-spacing:.19em;text-transform:uppercase}
.th-p-gaming-chairs .gc-copy h1{max-width:10.2ch;margin:0;color:#F5F9FF;font:800 clamp(58px,8.1vw,132px)/.79 var(--display);letter-spacing:-.082em;overflow-wrap:anywhere;text-wrap:balance;text-shadow:0 4px 30px #07101F59}
.th-p-gaming-chairs .gc-copy h1.long{max-width:12ch;font-size:clamp(44px,5.8vw,94px);line-height:.86}
.th-p-gaming-chairs .gc-copy .sub{max-width:30ch;margin:25px 0 0;color:#D0DFEF;font:500 clamp(14px,1.2vw,17px)/1.6 var(--body)}
.th-p-gaming-chairs .gc-copy .ctas{display:flex;flex-wrap:wrap;gap:10px;margin-top:29px}
.th-p-gaming-chairs .gc-copy .btn{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 20px;border:1px solid #5BA7FF;border-radius:0;background:#5BA7FF;color:#06101F;font:800 11px/1 var(--body);letter-spacing:.1em;text-decoration:none;text-transform:uppercase}
.th-p-gaming-chairs .gc-copy .btn:hover{border-color:#C7E2FF;background:#C7E2FF;color:#06101F}
.th-p-gaming-chairs .gc-copy .btn.ghost{border-color:#B2D8FF81;background:#07101F8A;color:#F2F7FF}
.th-p-gaming-chairs .gc-copy .btn.ghost:hover{border-color:#E4F2FF;background:#E4F2FF;color:#06101F}
.th-p-gaming-chairs .gc-corner-caption{grid-column:3;grid-row:1;align-self:start;justify-self:end;display:flex;align-items:center;gap:11px;min-width:0;padding:clamp(26px,3vw,45px) clamp(18px,3.2vw,51px);color:#E4F2FF;font:700 8px/1.2 var(--body);letter-spacing:.16em;text-align:right;text-transform:uppercase}
.th-p-gaming-chairs .gc-corner-caption i{display:block;flex:0 0 clamp(30px,4vw,62px);height:1px;background:#B8D9FF8F}
.th-p-gaming-chairs .gc-channel-bank{grid-column:2 / -1;grid-row:2;min-width:0;padding:0 clamp(18px,3.2vw,51px) clamp(22px,2.8vw,43px) 0}
.th-p-gaming-chairs .gc-channel-bank>p{margin:0 0 9px;color:#AFC7DF;font:700 8px/1.2 var(--body);letter-spacing:.17em;text-transform:uppercase}
.th-p-gaming-chairs .gc-channel-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-top:1px solid #B8D9FF3D;border-left:1px solid #B8D9FF3D}
.th-p-gaming-chairs .gc-channel{display:grid;grid-template-columns:27px minmax(0,1fr) 18px;grid-template-areas:"index name arrow" "index count arrow";align-items:center;column-gap:9px;min-height:66px;padding:9px 12px;border-right:1px solid #B8D9FF3D;border-bottom:1px solid #B8D9FF3D;background:#07101F6B;color:#F2F7FF;text-decoration:none}
.th-p-gaming-chairs .gc-channel:hover{background:#5BA7FF;color:#06101F}
.th-p-gaming-chairs .gc-channel-index{grid-area:index;color:#8FC4FF;font:800 9px/1 var(--body);letter-spacing:.09em}
.th-p-gaming-chairs .gc-channel:hover .gc-channel-index{color:#163251}
.th-p-gaming-chairs .gc-channel-name{grid-area:name;min-width:0;overflow-wrap:anywhere;font:800 12px/1.12 var(--body);letter-spacing:.035em;text-transform:uppercase}
.th-p-gaming-chairs .gc-channel small{grid-area:count;margin-top:4px;color:#B8CBE1;font:600 9px/1.1 var(--body);letter-spacing:.05em}
.th-p-gaming-chairs .gc-channel:hover small{color:#163251}
.th-p-gaming-chairs .gc-channel-arrow{grid-area:arrow;font-size:16px;line-height:1}
.th-p-gaming-chairs .gc-channel-only{grid-column:span 3}
.th-p-gaming-chairs .gc-signal-bay .motion-toggle{position:absolute;z-index:4;right:clamp(17px,2.8vw,44px);top:clamp(80px,10vw,140px);min-height:44px;padding:0 12px;border:1px solid #B8D9FF87;border-radius:0;background:#07101FD1;color:#EFF6FF;font:700 9px/1 var(--body);letter-spacing:.09em;text-transform:uppercase}
.th-p-gaming-chairs .gc-signal-bay.has-hero-motion[data-hero-motion="pan"] .gc-hero-photo .hero-media{animation:gaming-chairs-pan 18s ease-in-out infinite alternate}
.th-p-gaming-chairs .gc-signal-bay.has-hero-motion[data-hero-motion="drift"] .gc-hero-photo .hero-media{animation:gaming-chairs-drift 14s ease-in-out infinite alternate}
.th-p-gaming-chairs .gc-signal-bay.is-motion-paused .gc-hero-photo .hero-media{animation-play-state:paused}
.th-p-gaming-chairs .gc-discovery{position:relative;display:grid;grid-template-columns:clamp(84px,11vw,166px) minmax(235px,.7fr) minmax(0,1.45fr);gap:clamp(24px,4.4vw,78px);padding:clamp(62px,8vw,126px) clamp(21px,4.4vw,75px) clamp(70px,9vw,140px) 0;overflow:hidden;background:#0D1A2E;border-top:1px solid #304560;border-bottom:1px solid #304560;color:#F2F7FF}
.th-p-gaming-chairs .gc-discovery::before{position:absolute;inset:0;pointer-events:none;content:"";background:linear-gradient(103deg,transparent 0 51%,#5BA7FF0A 51.1%,transparent 51.25%)}
.th-p-gaming-chairs .gc-discovery-radar{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:14px;min-width:0;padding-top:4px;border-right:1px solid #304560;color:#B7D7FF}
.th-p-gaming-chairs .gc-discovery-radar span{font:800 clamp(37px,4.4vw,67px)/.78 var(--display);letter-spacing:-.1em}
.th-p-gaming-chairs .gc-discovery-radar i{display:block;width:1px;height:clamp(68px,9vw,132px);background:linear-gradient(#5BA7FF,#5BA7FF14)}
.th-p-gaming-chairs .gc-discovery-radar b{font:700 8px/1.55 var(--body);letter-spacing:.16em;text-align:center}
.th-p-gaming-chairs .gc-discovery-intro{position:relative;z-index:1;min-width:0;padding-top:7px}
.th-p-gaming-chairs .gc-discovery-intro h2{max-width:9.2ch;margin:0;color:#F2F7FF;font:800 clamp(39px,4.8vw,75px)/.86 var(--display);letter-spacing:-.072em;overflow-wrap:anywhere;text-wrap:balance}
.th-p-gaming-chairs .gc-discovery-intro>p:not(.gc-kicker){max-width:30ch;margin:20px 0 0;color:#AFC1D5;font:500 15px/1.6 var(--body)}
.th-p-gaming-chairs .gc-all-link{display:inline-flex;align-items:center;justify-content:space-between;gap:34px;min-height:44px;margin-top:29px;padding-bottom:5px;border-bottom:1px solid #B8D9FF;color:#F2F7FF;font:800 10px/1 var(--body);letter-spacing:.11em;text-decoration:none;text-transform:uppercase}
.th-p-gaming-chairs .gc-all-link:hover{border-color:#5BA7FF;color:#8FC4FF}
.th-p-gaming-chairs .gc-all-link span{color:#5BA7FF;font-size:18px;line-height:1}
.th-p-gaming-chairs .gc-category-board{position:relative;z-index:1;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));align-self:start;gap:1px;min-width:0;background:#304560;border:1px solid #304560}
.th-p-gaming-chairs .gc-category-card{position:relative;display:grid;grid-template-rows:minmax(170px,22vw) auto;min-width:0;overflow:hidden;background:#0A1525;color:#F2F7FF;text-decoration:none}
.th-p-gaming-chairs .gc-category-card:nth-child(1){grid-column:span 2;grid-row:span 2;grid-template-rows:minmax(310px,44vw) auto}
.th-p-gaming-chairs .gc-category-card:nth-child(4):last-child{grid-column:span 2}
.th-p-gaming-chairs .gc-category-art{position:relative;display:block;overflow:hidden;background:#142744}
.th-p-gaming-chairs .gc-category-art::after{position:absolute;inset:0;content:"";pointer-events:none;background:linear-gradient(180deg,#07101F0B 10%,#07101FC7 100%)}
.th-p-gaming-chairs .gc-category-art img,.th-p-gaming-chairs .gc-category-empty{display:block;width:100%;height:100%;object-fit:cover}
.th-p-gaming-chairs .gc-category-empty{position:relative;background:radial-gradient(circle at 70% 35%,#385E8B 0 4%,transparent 4.2%),linear-gradient(140deg,#0B182A 0 47%,#24466A 47.3% 48%,#0B182A 48.3% 69%,#16345A 69.3% 70%,#0B182A 70.3%)}
.th-p-gaming-chairs .gc-category-empty i{position:absolute;right:11%;bottom:11%;width:44%;aspect-ratio:1;border:1px solid #9ACBFF37;border-radius:50%}
.th-p-gaming-chairs .gc-category-number{position:absolute;z-index:2;top:14px;left:14px;display:grid;width:28px;height:28px;place-items:center;background:#C8E3FF;color:#07101F;font:800 9px/1 var(--body);letter-spacing:.08em}
.th-p-gaming-chairs .gc-category-copy{position:relative;display:grid;gap:6px;min-width:0;padding:16px 42px 19px 17px;border-top:1px solid #304560;background:#0A1525}
.th-p-gaming-chairs .gc-category-copy b{overflow-wrap:anywhere;font:800 clamp(17px,1.8vw,27px)/.94 var(--display);letter-spacing:-.045em}
.th-p-gaming-chairs .gc-category-copy small{color:#9AA9BF;font:700 9px/1.2 var(--body);letter-spacing:.08em;text-transform:uppercase}
.th-p-gaming-chairs .gc-category-arrow{position:absolute;z-index:2;right:16px;bottom:20px;color:#5BA7FF;font-size:18px;line-height:1}
.th-p-gaming-chairs .gc-category-card:hover{background:#142744}
.th-p-gaming-chairs .gc-category-card:hover .gc-category-copy{background:#142744}
.th-p-gaming-chairs .gc-discovery-products{align-items:start}
.th-p-gaming-chairs .gc-product-board{position:relative;z-index:1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1px;min-width:0;background:#304560;border:1px solid #304560}
.th-p-gaming-chairs .gc-product-card{position:relative;display:grid;grid-template-columns:minmax(110px,.68fr) minmax(0,1fr);min-height:186px;background:#0A1525;color:#F2F7FF;text-decoration:none}
.th-p-gaming-chairs .gc-product-art{position:relative;display:block;overflow:hidden;background:#142744}
.th-p-gaming-chairs .gc-product-art img,.th-p-gaming-chairs .gc-product-empty{display:block;width:100%;height:100%;object-fit:cover}
.th-p-gaming-chairs .gc-product-empty{background:linear-gradient(140deg,#1B385A 0 49%,#5BA7FF 49.3% 50%,#0D1A2E 50.3%)}
.th-p-gaming-chairs .gc-product-empty i{position:absolute;inset:19% 26%;border:1px solid #B7D7FF61;border-radius:50%}
.th-p-gaming-chairs .gc-product-number{position:absolute;top:11px;left:11px;display:grid;width:25px;height:25px;place-items:center;background:#C8E3FF;color:#07101F;font:800 8px/1 var(--body);font-style:normal;letter-spacing:.06em}
.th-p-gaming-chairs .gc-product-copy{display:grid;align-content:center;gap:5px;min-width:0;padding:18px 40px 18px 16px}
.th-p-gaming-chairs .gc-product-copy b{overflow-wrap:anywhere;font:800 clamp(19px,2vw,29px)/.93 var(--display);letter-spacing:-.05em}
.th-p-gaming-chairs .gc-product-copy small{color:#9AA9BF;font:700 9px/1.3 var(--body);letter-spacing:.07em;text-transform:uppercase}
.th-p-gaming-chairs .gc-product-copy em{color:#8FC4FF;font:800 11px/1.2 var(--body);font-style:normal}
.th-p-gaming-chairs .gc-product-arrow{position:absolute;right:15px;bottom:15px;color:#5BA7FF;font-size:18px;line-height:1}
.th-p-gaming-chairs .gc-product-card:hover{background:#142744}
.th-p-gaming-chairs #shop{padding-top:clamp(58px,8vw,112px);background:#07101F}
.th-p-gaming-chairs #shop .sec-h{align-items:end;padding-bottom:20px;border-bottom:1px solid #304560}
.th-p-gaming-chairs #shop .sec-h h2{font:800 clamp(35px,4.4vw,66px)/.84 var(--display);letter-spacing:-.07em}
.th-p-gaming-chairs #shop .chips{gap:7px}
.th-p-gaming-chairs #shop .chip{min-height:44px;border:1px solid #304560;border-radius:0;background:#0D1A2E;color:#B9C9DC;font:800 10px/1 var(--body);letter-spacing:.08em;text-transform:uppercase}
.th-p-gaming-chairs #shop .chip:hover,.th-p-gaming-chairs #shop .chip[aria-current="page"]{border-color:#5BA7FF;background:#5BA7FF;color:#06101F}
.th-p-gaming-chairs #shop .grid{gap:1px;background:#304560;border:1px solid #304560}
.th-p-gaming-chairs #shop .pc{border-radius:0;background:#0A1525}
.th-p-gaming-chairs #shop .pc .im{border-radius:0;background:#142744}
.th-p-gaming-chairs #shop .pc .bd{padding:15px 16px 19px}
.th-p-gaming-chairs #shop .pc h3{font:800 clamp(19px,1.6vw,25px)/.98 var(--display);letter-spacing:-.045em}
.th-p-gaming-chairs #shop .pc .pr{color:#8FC4FF;font-weight:800}
.th-p-gaming-chairs #shop .pc .go{border-radius:0;background:#5BA7FF;color:#06101F}
.th-p-gaming-chairs .perks{border-color:#304560;background:#0D1A2E}
.th-p-gaming-chairs .perks .perk{color:#E7F2FF}
.th-p-gaming-chairs .perks .perk svg{color:#5BA7FF}
.th-p-gaming-chairs .ft{border-top-color:#304560}
@keyframes gaming-chairs-pan{0%{transform:scale(1.035) translate3d(-.7%,0,0)}100%{transform:scale(1.09) translate3d(1.4%,-.6%,0)}}
@keyframes gaming-chairs-drift{0%{transform:scale(1.025) translate3d(-.45%,-.25%,0)}100%{transform:scale(1.055) translate3d(.55%,.45%,0)}}
@media (max-width:1040px){
  .th-p-gaming-chairs .gc-hero-grid{grid-template-columns:clamp(64px,9vw,95px) minmax(0,1fr) minmax(185px,22vw,250px)}
  .th-p-gaming-chairs .gc-copy-field{padding-right:29px}
  .th-p-gaming-chairs .gc-copy h1{font-size:clamp(57px,8vw,94px)}
  .th-p-gaming-chairs .gc-corner-caption{padding-right:22px;padding-left:5px}
  .th-p-gaming-chairs .gc-channel{grid-template-columns:22px minmax(0,1fr) 16px;column-gap:6px;padding-inline:9px}
  .th-p-gaming-chairs .gc-channel-name{font-size:11px}
  .th-p-gaming-chairs .gc-discovery{grid-template-columns:84px minmax(210px,.7fr) minmax(0,1.32fr);gap:27px;padding-right:27px}
  .th-p-gaming-chairs .gc-category-board{grid-template-columns:repeat(2,minmax(0,1fr))}
  .th-p-gaming-chairs .gc-category-card,.th-p-gaming-chairs .gc-category-card:nth-child(1){grid-column:auto;grid-row:auto;grid-template-rows:minmax(205px,29vw) auto}
  .th-p-gaming-chairs .gc-category-card:nth-child(1){grid-column:span 2;grid-template-rows:minmax(260px,39vw) auto}
}
@media (max-width:720px){
  .th-p-gaming-chairs .hd .nav{display:none}
  .th-p-gaming-chairs .gc-signal-bay{min-height:650px}
  .th-p-gaming-chairs .gc-hero-photo .theme-empty-media{min-height:650px}
  .th-p-gaming-chairs .gc-hero-photo .hero-media{object-position:61% center}
  .th-p-gaming-chairs .gc-photo-shade{background:linear-gradient(90deg,#06101FEF 0%,#07101FCB 47%,#07101F40 100%),linear-gradient(0deg,#07101FEA 0%,#07101F1C 68%)}
  .th-p-gaming-chairs .gc-hero-grid{grid-template-columns:62px minmax(0,1fr);grid-template-rows:minmax(0,1fr) auto;min-height:650px}
  .th-p-gaming-chairs .gc-bay-marker{padding-top:28px;padding-bottom:24px}
  .th-p-gaming-chairs .gc-bay-marker i{height:105px}
  .th-p-gaming-chairs .gc-copy-field{grid-column:2;grid-row:1;padding:74px 22px 24px}
  .th-p-gaming-chairs .gc-copy h1{max-width:9.7ch;font-size:clamp(50px,12vw,79px)}
  .th-p-gaming-chairs .gc-copy h1.long{font-size:clamp(38px,9.1vw,59px)}
  .th-p-gaming-chairs .gc-copy .sub{max-width:28ch;margin-top:18px;font-size:14px}
  .th-p-gaming-chairs .gc-copy .ctas{margin-top:23px}
  .th-p-gaming-chairs .gc-copy .btn{min-height:46px;padding-inline:15px}
  .th-p-gaming-chairs .gc-copy .btn.ghost{display:none}
  .th-p-gaming-chairs .gc-corner-caption{display:none}
  .th-p-gaming-chairs .gc-channel-bank{grid-column:2;grid-row:2;padding:0 13px 14px 0}
  .th-p-gaming-chairs .gc-channel-list{grid-template-columns:1fr}
  .th-p-gaming-chairs .gc-channel{min-height:44px;grid-template-columns:24px minmax(0,1fr) auto;grid-template-areas:"index name arrow";padding:6px 10px}
  .th-p-gaming-chairs .gc-channel small{display:none}
  .th-p-gaming-chairs .gc-channel-only{grid-column:auto}
  .th-p-gaming-chairs .gc-signal-bay .motion-toggle{right:16px;top:15px}
  .th-p-gaming-chairs .gc-discovery{grid-template-columns:62px minmax(0,1fr);gap:23px;padding:58px 18px 67px 0}
  .th-p-gaming-chairs .gc-discovery-radar{gap:12px}
  .th-p-gaming-chairs .gc-discovery-radar i{height:76px}
  .th-p-gaming-chairs .gc-discovery-intro{padding-right:12px}
  .th-p-gaming-chairs .gc-discovery-intro h2{max-width:10ch;font-size:clamp(38px,10vw,59px)}
  .th-p-gaming-chairs .gc-discovery-intro>p:not(.gc-kicker){margin-top:17px;font-size:14px}
  .th-p-gaming-chairs .gc-category-board,.th-p-gaming-chairs .gc-product-board{grid-column:2;grid-template-columns:1fr}
  .th-p-gaming-chairs .gc-category-card,.th-p-gaming-chairs .gc-category-card:nth-child(1),.th-p-gaming-chairs .gc-category-card:nth-child(4):last-child{grid-column:auto;grid-row:auto;grid-template-columns:minmax(0,1fr) minmax(135px,.58fr);grid-template-rows:auto;min-height:160px}
  .th-p-gaming-chairs .gc-category-art{grid-column:2;grid-row:1}
  .th-p-gaming-chairs .gc-category-copy{grid-column:1;grid-row:1;align-content:end;padding:16px 39px 18px 16px;border-top:0}
  .th-p-gaming-chairs .gc-category-copy b{font-size:clamp(22px,6.4vw,31px)}
  .th-p-gaming-chairs .gc-category-arrow{right:auto;left:15px;bottom:15px}
  .th-p-gaming-chairs .gc-product-board{gap:1px}
  .th-p-gaming-chairs .gc-product-card{min-height:140px}
  .th-p-gaming-chairs #shop .sec-h{align-items:flex-start;flex-direction:column;gap:17px}
  .th-p-gaming-chairs #shop .sec-h h2{font-size:clamp(35px,10vw,55px)}
  .th-p-gaming-chairs #shop .chips{width:100%;overflow-x:auto;flex-wrap:nowrap;scrollbar-width:none}
  .th-p-gaming-chairs #shop .chip{flex:0 0 auto}
}
@media (max-width:420px){
  .th-p-gaming-chairs .hd .brand{font-size:calc(12px * var(--ts));letter-spacing:.065em}
  .th-p-gaming-chairs .gc-hero-grid{grid-template-columns:53px minmax(0,1fr)}
  .th-p-gaming-chairs .gc-bay-marker strong{font-size:34px}
  .th-p-gaming-chairs .gc-copy-field{padding:70px 15px 20px}
  .th-p-gaming-chairs .gc-copy .eyebrow{font-size:8px;letter-spacing:.14em}
  .th-p-gaming-chairs .gc-copy h1{font-size:clamp(44px,12.6vw,56px);line-height:.82}
  .th-p-gaming-chairs .gc-copy h1.long{font-size:clamp(34px,9.8vw,43px)}
  .th-p-gaming-chairs .gc-copy .ctas{width:100%}
  .th-p-gaming-chairs .gc-copy .btn{width:100%}
  .th-p-gaming-chairs .gc-channel-bank{padding-right:9px}
  .th-p-gaming-chairs .gc-channel-bank>p{font-size:7px}
  .th-p-gaming-chairs .gc-channel{min-height:44px}
  .th-p-gaming-chairs .gc-discovery{grid-template-columns:50px minmax(0,1fr);gap:16px;padding-right:12px}
  .th-p-gaming-chairs .gc-discovery-radar span{font-size:33px}
  .th-p-gaming-chairs .gc-discovery-radar b{font-size:7px;letter-spacing:.1em}
  .th-p-gaming-chairs .gc-discovery-intro h2{font-size:clamp(34px,10.8vw,44px)}
  .th-p-gaming-chairs .gc-category-card,.th-p-gaming-chairs .gc-category-card:nth-child(1),.th-p-gaming-chairs .gc-category-card:nth-child(4):last-child{grid-template-columns:minmax(0,1fr) 112px;min-height:150px}
  .th-p-gaming-chairs .gc-product-card{grid-template-columns:94px minmax(0,1fr);min-height:132px}
  .th-p-gaming-chairs .gc-product-copy{padding:14px 35px 14px 13px}
  .th-p-gaming-chairs .gc-product-copy b{font-size:20px}
}
@media (prefers-reduced-motion:reduce){
  .th-p-gaming-chairs .gc-signal-bay.has-hero-motion .gc-hero-photo .hero-media{animation:none;transform:none}
}
`;

import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-toys',
  name: 'Morrow & Marbles',
  for: 'Handcrafted toys and creative play',
  vibe: 'A sunlit miniature play world made from tactile wood, felt, paper, and gentle color',
  category: 'Handcrafted toys and creative play',
  group: 'lifestyle',
  display: 'DM Serif Display',
  body: 'Manrope',
  displayWeight: 400,
  tracking: '-.035em',
  colors: {
    bg: '#F8F2E7',
    surface: '#FFFDF8',
    ink: '#172333',
    muted: '#617075',
    line: '#D9D0C0',
    accent: '#D66A3A',
    onAccent: '#FFF9EC',
    panel: '#244C5C',
    onPanel: '#FFF7E7',
    foot: '#172A33',
    onFoot: '#FFF5E2',
    bar: '#F1B63E',
    onBar: '#172333',
    badge: '#DCE6C9',
    onBadge: '#172333',
  },
  header: 'center',
  hero: 'collage',
  card: 'pastel',
  ratio: '4/5',
  rCard: 28,
  rBtn: 999,
  motion: 'drift',
  copy: {
    eyebrow: 'Good toys, brighter days',
    collection: 'Ways to make a world',
    cta: 'Find your kind of play',
    title: 'Make a little world.',
    subtitle: 'Open-ended things for hands, hearts, and big ideas.',
  },
});

const itemCount = (count) => {
  const value = Number(count);
  if (!Number.isFinite(value)) return '';
  return `${value} ${value === 1 ? 'item' : 'items'}`;
};

const categoryTile = (ctx, category, index) => {
  const image = category.image
    ? `<img src="${ctx.esc(category.image)}" alt="" loading="lazy" decoding="async">`
    : '<span class="morrow-category-empty" aria-hidden="true"><i></i><i></i><i></i></span>';
  const count = itemCount(category.count);
  const shapes = ['is-arch', 'is-scoop', 'is-petal', 'is-hill'];
  return `<a class="morrow-category-card ${shapes[index % shapes.length]}" href="${ctx.categoryLink(category.name)}">
    <span class="morrow-category-media">${image}</span>
    <span class="morrow-category-wash" aria-hidden="true"></span>
    <span class="morrow-category-count">${count ? ctx.esc(count) : ''}</span>
    <span class="morrow-category-copy"><strong>${ctx.esc(category.name)}</strong><small>Explore the collection <b aria-hidden="true">→</b></small></span>
  </a>`;
};

const productTile = (ctx, product, index) => {
  const image = product.image_url
    ? `<img src="${ctx.esc(product.image_url)}" alt="${ctx.esc(product.alt_text || product.title)}" loading="lazy" decoding="async">`
    : '<span class="morrow-product-empty" aria-hidden="true"><i></i><i></i></span>';
  const hasPrice = product.price_cents !== undefined && product.price_cents !== null && product.price_cents !== ''
    && Number.isFinite(Number(product.price_cents));
  const price = hasPrice ? `<small>${ctx.money(Number(product.price_cents), product.currency || 'usd')}</small>` : '';
  const palette = ['is-coral', 'is-gold', 'is-blue', 'is-green'];
  return `<a class="morrow-product-card ${palette[index % palette.length]}" href="${ctx.productLink(product)}">
    <span class="morrow-product-media">${image}</span>
    <span class="morrow-product-copy"><strong>${ctx.esc(product.title)}</strong>${product.category ? `<em>${ctx.esc(product.category)}</em>` : ''}${price}</span>
    <span class="morrow-product-arrow" aria-hidden="true">→</span>
  </a>`;
};

export function hero(ctx) {
  return `<section class="hero category-hero morrow-hero${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="morrow-hero-media">${ctx.media(0, { priority: true, lazy: false, decorative: true })}</div>
    <div class="morrow-hero-wash" aria-hidden="true"></div>
    <div class="morrow-hero-stage" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
    <div class="wrap morrow-hero-wrap">
      <div class="morrow-hero-copy">${ctx.copy('morrow-copy')}</div>
      <p class="morrow-hero-note"><span aria-hidden="true"></span> Small things. Wide open worlds.</p>
    </div>
    ${ctx.controls}
  </section>`;
}

export function discovery(ctx) {
  const categories = (ctx.cats || []).filter((category) => category?.name).slice(0, 4);
  const products = (ctx.products || []).filter((product) => product?.title).slice(0, 4);

  if (categories.length >= 2) {
    return `<section class="theme-discovery morrow-discovery" aria-labelledby="morrow-discovery-title">
      <div class="wrap">
        <div class="morrow-discovery-head">
          <p class="eyebrow">${ctx.esc(ctx.t.copy?.collection || 'Ways to make a world')}</p>
          <h2 id="morrow-discovery-title">Start with the kind of play that calls to you.</h2>
          <p>Follow an idea into the collections waiting to be discovered.</p>
        </div>
        <div class="morrow-category-grid">${categories.map((category, index) => categoryTile(ctx, category, index)).join('')}</div>
      </div>
    </section>`;
  }

  if (products.length >= 2) {
    return `<section class="theme-discovery morrow-discovery morrow-discovery-products" aria-labelledby="morrow-discovery-title">
      <div class="wrap">
        <div class="morrow-discovery-head">
          <p class="eyebrow">${ctx.esc(ctx.t.copy?.collection || 'Ways to make a world')}</p>
          <h2 id="morrow-discovery-title">A few small beginnings.</h2>
          <p>Choose something to hold, make, or imagine with next.</p>
        </div>
        <div class="morrow-product-grid">${products.map((product, index) => productTile(ctx, product, index)).join('')}</div>
      </div>
    </section>`;
  }

  return '';
}

export const css = `
.th-p-toys .hd{background:var(--bg);border-bottom:1px solid #D9D0C0;box-shadow:none}
.th-p-toys .hd .wrap{min-height:76px}
.th-p-toys .hd .brand{color:var(--ink);font-family:var(--body);font-size:clamp(14px,1.22vw,18px);font-weight:800;letter-spacing:.15em;text-transform:uppercase}
.th-p-toys .hd .brand::before{content:'';display:inline-block;width:11px;height:11px;margin:0 8px 1px 0;border-radius:50% 50% 48% 48%;background:#D66A3A;vertical-align:middle;box-shadow:13px 10px 0 -2px #244C5C}
.th-p-toys .hd .nav a{color:var(--ink);font-size:12px;font-weight:700;letter-spacing:.055em}
.th-p-toys .hd .cart{border:1px solid #172333;border-radius:999px;background:#FFFDF8;color:#172333;padding:9px 14px}
.th-p-toys .morrow-hero{isolation:isolate;position:relative;min-height:clamp(535px,52vw,735px);overflow:hidden;background:#A96E3D;color:#172333}
.th-p-toys .morrow-hero-media{position:absolute;inset:0;z-index:-5;overflow:hidden;background:linear-gradient(105deg,#C9783F,#F0CC87 53%,#556D55)}
.th-p-toys .morrow-hero-media .hero-media{display:block;width:100%;height:100%;max-width:none;object-fit:cover;object-position:center;transform:scale(1.002)}
.th-p-toys .morrow-hero-media .theme-empty-media{display:block;width:100%;height:100%;min-height:0;background:radial-gradient(ellipse at 22% 82%,#D66A3A 0 9%,transparent 9.4%),radial-gradient(ellipse at 75% 24%,#F1B63E 0 8%,transparent 8.4%),linear-gradient(130deg,#F3D69A,#E9B467 49%,#365665);color:#172333}
.th-p-toys .morrow-hero-wash{position:absolute;inset:0;z-index:-4;background:linear-gradient(90deg,rgba(255,249,236,.42),rgba(255,248,234,.16) 42%,rgba(37,39,29,.12) 100%),linear-gradient(0deg,rgba(59,37,24,.34),transparent 46%)}
.th-p-toys .morrow-hero-stage{position:absolute;z-index:-2;top:50%;left:47%;width:min(47vw,690px);height:clamp(300px,30vw,450px);border:clamp(16px,1.8vw,28px) solid rgba(246,203,113,.95);border-bottom:0;border-radius:52% 52% 0 0 / 52% 52% 0 0;background:rgba(255,249,236,.82);box-shadow:inset 0 0 0 1px rgba(151,92,45,.18),0 12px 30px rgba(76,45,23,.11);transform:translate(-50%,-42%)}
.th-p-toys .morrow-hero-stage::before,.th-p-toys .morrow-hero-stage::after{content:'';position:absolute;bottom:-1px;width:clamp(34px,4.2vw,64px);height:clamp(45px,5vw,82px);background:#244C5C;box-shadow:inset 0 0 0 1px rgba(255,255,255,.2)}
.th-p-toys .morrow-hero-stage::before{left:-1px;border-radius:0 0 0 8px}
.th-p-toys .morrow-hero-stage::after{right:-1px;background:#D66A3A;border-radius:0 0 8px 0}
.th-p-toys .morrow-hero-stage i{position:absolute;display:block;box-shadow:inset 0 0 0 1px rgba(103,59,31,.14)}
.th-p-toys .morrow-hero-stage i:nth-child(1){top:calc(clamp(16px,1.8vw,28px) * -1);left:15%;width:22%;height:clamp(34px,4vw,61px);border-radius:50% 50% 0 0;background:#D66A3A}
.th-p-toys .morrow-hero-stage i:nth-child(2){top:calc(clamp(16px,1.8vw,28px) * -1);right:12%;width:18%;height:clamp(34px,4vw,61px);border-radius:50% 50% 0 0;background:#F1B63E}
.th-p-toys .morrow-hero-stage i:nth-child(3){bottom:0;left:clamp(34px,4.2vw,64px);width:clamp(42px,5vw,78px);height:clamp(40px,4.7vw,72px);border-radius:50% 50% 0 0;background:#D66A3A}
.th-p-toys .morrow-hero-stage i:nth-child(4){right:clamp(34px,4.2vw,64px);bottom:0;width:clamp(42px,5vw,78px);height:clamp(40px,4.7vw,72px);border-radius:50% 50% 0 0;background:#244C5C}
.th-p-toys .morrow-hero-stage i:nth-child(5){top:clamp(9px,1.25vw,18px);left:50%;width:clamp(34px,4.1vw,62px);height:clamp(34px,4.1vw,62px);border-radius:50%;background:#F1B63E;transform:translateX(-50%)}
.th-p-toys .morrow-hero-wrap{position:relative;display:flex;min-height:inherit;flex-direction:column;justify-content:center;align-items:center;padding-top:clamp(76px,8vw,116px);padding-bottom:clamp(76px,8vw,116px);text-align:center}
.th-p-toys .morrow-hero-copy{width:min(100%,540px)}
.th-p-toys .morrow-hero-copy .txt{max-width:100%}
.th-p-toys .morrow-hero-copy .eyebrow{margin:0 0 15px;color:#92512D;font:800 10px/1.2 var(--body);letter-spacing:.22em;text-transform:uppercase}
.th-p-toys .morrow-hero-copy h1{max-width:10.5ch;margin:0 auto;color:#172333;font-family:var(--display);font-size:clamp(54px,6.4vw,94px);font-weight:var(--dw);letter-spacing:var(--dt);line-height:.88;text-wrap:balance}
.th-p-toys .morrow-hero-copy h1.long{max-width:14ch;font-size:clamp(43px,4.9vw,74px);line-height:.94}
.th-p-toys .morrow-hero-copy .sub{max-width:36ch;margin:21px auto 0;color:#35464A;font-size:clamp(14px,1.25vw,17px);line-height:1.55}
.th-p-toys .morrow-hero-copy .ctas{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-top:26px}
.th-p-toys .morrow-hero-copy .btn{display:inline-flex;min-height:46px;align-items:center;justify-content:center;border:1px solid #172333;border-radius:999px;background:#172333;color:#FFF9EC;padding:11px 19px;font-size:12px;font-weight:800;letter-spacing:.045em;box-shadow:none}
.th-p-toys .morrow-hero-copy .btn:hover{border-color:#D66A3A;background:#D66A3A;color:#FFF9EC}
.th-p-toys .morrow-hero-copy .btn.ghost{background:rgba(255,253,248,.58);color:#172333}
.th-p-toys .morrow-hero-copy .btn.ghost:hover{background:#FFFDF8;color:#172333}
.th-p-toys .morrow-hero-note{display:flex;align-items:center;gap:9px;margin:21px 0 0;color:#455251;font:700 10px/1.25 var(--body);letter-spacing:.15em;text-transform:uppercase}
.th-p-toys .morrow-hero-note span{display:block;width:8px;height:8px;border-radius:50%;background:#D66A3A;box-shadow:12px 7px 0 -2px #244C5C}
.th-p-toys .morrow-hero .motion-toggle{position:absolute;right:clamp(16px,3vw,46px);bottom:20px;z-index:3;min-height:44px;border:1px solid rgba(23,35,51,.38);border-radius:999px;background:rgba(255,253,248,.78);color:#172333;padding:9px 13px;font:800 10px/1 var(--body);letter-spacing:.055em}
.th-p-toys .morrow-hero .motion-toggle:hover{background:#172333;color:#FFF9EC}
.th-p-toys .morrow-hero.has-hero-motion .morrow-hero-media .hero-media{animation:p-toys-drift 18s ease-in-out infinite alternate}
.th-p-toys .morrow-hero.has-hero-motion.is-motion-paused .morrow-hero-media .hero-media{animation-play-state:paused}
@keyframes p-toys-drift{0%{transform:scale(1.035) translate3d(-.6%,.25%,0)}100%{transform:scale(1.09) translate3d(.7%,-.55%,0)}}
.th-p-toys .perks{background:#F1B63E;border-block:1px solid #D99D28}
.th-p-toys .perks .wrap{gap:0}
.th-p-toys .perks .perk{padding:20px clamp(14px,2vw,28px);border-inline-start:1px solid rgba(23,35,51,.28);color:#172333}
.th-p-toys .perks .perk:first-child{border-inline-start:0}
.th-p-toys .perks .perk svg{color:#D66A3A}
.th-p-toys .perks .perk b{font-family:var(--display);font-size:17px;font-weight:400;letter-spacing:-.02em}
.th-p-toys .morrow-discovery{position:relative;overflow:hidden;padding:clamp(62px,8vw,116px) 0;background:var(--bg)}
.th-p-toys .morrow-discovery::before{content:'';position:absolute;top:-80px;right:-60px;width:clamp(175px,24vw,350px);height:clamp(175px,24vw,350px);border-radius:42% 58% 58% 42%;background:#E5EBCF;opacity:.58;transform:rotate(24deg)}
.th-p-toys .morrow-discovery::after{content:'';position:absolute;bottom:-120px;left:-75px;width:clamp(190px,27vw,380px);height:clamp(155px,21vw,290px);border-radius:60% 40% 0 0;background:#F4D5C8;opacity:.62;transform:rotate(-12deg)}
.th-p-toys .morrow-discovery .wrap{position:relative;z-index:1}
.th-p-toys .morrow-discovery-head{max-width:650px;margin:0 auto clamp(32px,4vw,54px);text-align:center}
.th-p-toys .morrow-discovery .eyebrow{margin:0 0 13px;color:#A7522D;font:800 10px/1.2 var(--body);letter-spacing:.22em;text-transform:uppercase}
.th-p-toys .morrow-discovery h2{margin:0;color:#172333;font-family:var(--display);font-size:clamp(38px,4.4vw,63px);font-weight:var(--dw);letter-spacing:var(--dt);line-height:.96;text-wrap:balance}
.th-p-toys .morrow-discovery-head>p:last-child{max-width:45ch;margin:15px auto 0;color:var(--muted);font-size:15px;line-height:1.58}
.th-p-toys .morrow-category-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));align-items:start;gap:clamp(12px,1.8vw,25px)}
.th-p-toys .morrow-category-card{position:relative;display:flex;min-height:clamp(335px,30vw,465px);flex-direction:column;justify-content:flex-end;overflow:hidden;padding:clamp(18px,2vw,27px);background:#EFD4C8;color:#172333;text-decoration:none;isolation:isolate}
.th-p-toys .morrow-category-card.is-arch{border-radius:48% 48% 24px 24px / 18% 18% 24px 24px;background:#F0D7CC}
.th-p-toys .morrow-category-card.is-scoop{border-radius:30% 30% 42% 42% / 13% 13% 28% 28%;background:#F4D889}
.th-p-toys .morrow-category-card.is-petal{border-radius:38% 38% 18% 42% / 18% 42% 18% 42%;background:#C9DDEF}
.th-p-toys .morrow-category-card.is-hill{border-radius:48% 48% 26% 26% / 15% 15% 34% 34%;background:#D7E2D0}
.th-p-toys .morrow-category-media{position:absolute;inset:0;z-index:-3;display:block;overflow:hidden;background:linear-gradient(140deg,#E2A172,#617E69)}
.th-p-toys .morrow-category-media img{display:block;width:100%;height:100%;object-fit:cover}
.th-p-toys .morrow-category-wash{position:absolute;inset:0;z-index:-2;background:linear-gradient(0deg,rgba(20,34,37,.72),rgba(20,34,37,.04) 63%)}
.th-p-toys .morrow-category-empty{display:flex;width:100%;height:100%;align-items:center;justify-content:center;gap:12px;background:linear-gradient(145deg,#D66A3A,#F1B63E 48%,#244C5C)}
.th-p-toys .morrow-category-empty i{display:block;width:36px;height:52px;border-radius:50% 50% 4px 4px;background:rgba(255,252,241,.65)}
.th-p-toys .morrow-category-empty i:nth-child(2){width:48px;height:34px;border-radius:48% 48% 4px 4px;background:rgba(255,252,241,.85)}
.th-p-toys .morrow-category-empty i:nth-child(3){width:28px;height:28px;border-radius:50%;background:rgba(23,35,51,.7)}
.th-p-toys .morrow-category-count{position:absolute;top:17px;left:18px;min-height:24px;border-radius:999px;background:rgba(255,253,248,.87);color:#172333;padding:7px 10px;font:800 9px/1 var(--body);letter-spacing:.09em;text-transform:uppercase}
.th-p-toys .morrow-category-count:empty{display:none}
.th-p-toys .morrow-category-copy{position:relative;display:flex;max-width:100%;flex-direction:column;gap:9px;color:#FFF9EC}
.th-p-toys .morrow-category-copy strong{overflow-wrap:anywhere;font-family:var(--display);font-size:clamp(29px,2.65vw,42px);font-weight:400;letter-spacing:-.035em;line-height:.94;text-wrap:balance}
.th-p-toys .morrow-category-copy small{display:flex;align-items:center;justify-content:space-between;gap:10px;font:800 10px/1.25 var(--body);letter-spacing:.075em;text-transform:uppercase}
.th-p-toys .morrow-category-copy b{display:grid;width:28px;height:28px;flex:0 0 28px;place-items:center;border:1px solid rgba(255,249,236,.66);border-radius:50%;font-size:15px;font-weight:400}
.th-p-toys .morrow-product-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:clamp(12px,1.8vw,24px)}
.th-p-toys .morrow-product-card{position:relative;display:flex;min-height:370px;flex-direction:column;overflow:hidden;border:1px solid #D7CDBC;border-radius:25px;background:#FFFDF8;color:#172333;text-decoration:none}
.th-p-toys .morrow-product-media{display:block;height:245px;overflow:hidden;background:#EBD8BB}
.th-p-toys .morrow-product-card.is-coral .morrow-product-media{background:#EAC0AF}
.th-p-toys .morrow-product-card.is-gold .morrow-product-media{background:#F0D68C}
.th-p-toys .morrow-product-card.is-blue .morrow-product-media{background:#C8DBE9}
.th-p-toys .morrow-product-card.is-green .morrow-product-media{background:#D5E0CF}
.th-p-toys .morrow-product-media img{display:block;width:100%;height:100%;object-fit:cover}
.th-p-toys .morrow-product-empty{display:flex;width:100%;height:100%;align-items:center;justify-content:center;gap:10px}
.th-p-toys .morrow-product-empty i{display:block;width:64px;height:64px;border-radius:50% 50% 10px 10px;background:rgba(23,35,51,.22)}
.th-p-toys .morrow-product-empty i:last-child{width:42px;height:92px;border-radius:45% 45% 8px 8px;background:rgba(23,35,51,.37)}
.th-p-toys .morrow-product-copy{display:flex;min-width:0;flex:1;flex-direction:column;gap:6px;padding:18px 18px 20px}
.th-p-toys .morrow-product-copy strong{overflow-wrap:anywhere;font-family:var(--display);font-size:clamp(23px,2vw,30px);font-weight:400;letter-spacing:-.025em;line-height:1.02}
.th-p-toys .morrow-product-copy em{overflow-wrap:anywhere;color:var(--muted);font:800 9px/1.3 var(--body);letter-spacing:.095em;text-transform:uppercase}
.th-p-toys .morrow-product-copy small{margin-top:auto;padding-top:6px;color:#A7522D;font:800 13px/1.2 var(--body)}
.th-p-toys .morrow-product-arrow{position:absolute;right:15px;bottom:16px;display:grid;width:32px;height:32px;place-items:center;border:1px solid #172333;border-radius:50%;color:#172333;font-size:16px}
.th-p-toys #shop{padding-block:clamp(62px,8vw,112px);background:linear-gradient(180deg,#244C5C 0 126px,#F8F2E7 126px)}
.th-p-toys #shop .wrap{padding-top:clamp(19px,3vw,42px)}
.th-p-toys #shop .sec-h{align-items:end;margin-bottom:clamp(26px,3.4vw,46px)}
.th-p-toys #shop .sec-h h2{max-width:12ch;color:#FFF7E7;font-family:var(--display);font-size:clamp(40px,4.5vw,66px);font-weight:400;letter-spacing:-.035em;line-height:.92}
.th-p-toys #shop .chips{max-width:650px;justify-content:flex-end}
.th-p-toys #shop .chip{min-height:42px;border:1px solid rgba(255,247,231,.5);border-radius:999px;background:transparent;color:#FFF7E7;font:800 10px/1 var(--body);letter-spacing:.065em}
.th-p-toys #shop .chip.on,.th-p-toys #shop .chip:hover{border-color:#F1B63E;background:#F1B63E;color:#172333}
.th-p-toys #shop .grid{gap:clamp(21px,2.5vw,35px) clamp(13px,1.7vw,23px)}
.th-p-toys #shop .pc{overflow:hidden;border:1px solid #D7CDBC;border-radius:24px;background:#FFFDF8;box-shadow:none}
.th-p-toys #shop .pc .im{position:relative;overflow:hidden;background:#E7D7C0}
.th-p-toys #shop .pc .bd{display:grid;gap:8px;padding:17px 16px 19px}
.th-p-toys #shop .pc h3{overflow-wrap:anywhere;font-family:var(--display);font-size:clamp(21px,1.85vw,28px);font-weight:400;letter-spacing:-.02em;line-height:1.04}
.th-p-toys #shop .pc .pr{color:#A7522D;font:800 13px/1.2 var(--body)}
.th-p-toys #shop .pc .tag{top:11px;left:11px;border-radius:999px;background:#244C5C;color:#FFF7E7;font:800 9px/1 var(--body);letter-spacing:.09em;text-transform:uppercase}
.th-p-toys #shop .pc .go{right:11px;bottom:11px;border-radius:50%;background:#FFFDF8;color:#172333}
.th-p-toys .feat{background:#E6EDCF}
.th-p-toys .feat .pic{position:relative;overflow:hidden;border-radius:32px;background:#D6E0BF}
.th-p-toys .feat .txt h2,.th-p-toys .story .txt h2{font-family:var(--display);font-weight:400;letter-spacing:-.03em}
.th-p-toys .story{background:#FFFDF8}
.th-p-toys .ft{background:#172A33;color:#FFF5E2}
.th-p-toys .ft a{color:#FFF5E2}
@media (max-width:940px){
  .th-p-toys .morrow-hero-stage{left:50%;width:min(65vw,650px)}
  .th-p-toys .morrow-category-grid{grid-template-columns:repeat(2,minmax(0,1fr));max-width:710px;margin-inline:auto}
  .th-p-toys .morrow-category-card{min-height:365px}
  .th-p-toys .morrow-product-grid{grid-template-columns:repeat(2,minmax(0,1fr));max-width:710px;margin-inline:auto}
  .th-p-toys #shop{background:linear-gradient(180deg,#244C5C 0 100px,#F8F2E7 100px)}
  .th-p-toys #shop .chips{justify-content:flex-start}
}
@media (max-width:620px){
  .th-p-toys .hd .wrap{min-height:64px}
  .th-p-toys .hd .brand{font-size:13px;letter-spacing:.1em}
  .th-p-toys .hd .brand::before{width:9px;height:9px;margin-right:7px;box-shadow:11px 8px 0 -2px #244C5C}
  .th-p-toys .morrow-hero{min-height:590px}
  .th-p-toys .morrow-hero-media .hero-media{object-position:58% center}
  .th-p-toys .morrow-hero-wash{background:linear-gradient(0deg,rgba(255,248,232,.88) 0%,rgba(255,248,232,.42) 54%,rgba(255,248,232,.06) 100%)}
  .th-p-toys .morrow-hero-stage{top:auto;bottom:33px;left:50%;width:min(87vw,460px);height:325px;transform:translateX(-50%)}
  .th-p-toys .morrow-hero-wrap{justify-content:flex-start;padding-top:86px;padding-bottom:114px}
  .th-p-toys .morrow-hero-copy h1{max-width:9.5ch;font-size:clamp(48px,14vw,68px)}
  .th-p-toys .morrow-hero-copy h1.long{max-width:12ch;font-size:clamp(38px,11vw,52px)}
  .th-p-toys .morrow-hero-copy .sub{max-width:31ch;font-size:15px}
  .th-p-toys .morrow-hero-copy .ctas{margin-top:22px}
  .th-p-toys .morrow-hero-copy .btn{flex:1 1 170px;min-height:46px}
  .th-p-toys .morrow-hero-note{margin-top:18px;font-size:9px;letter-spacing:.1em}
  .th-p-toys .morrow-hero .motion-toggle{right:15px;bottom:16px}
  .th-p-toys .perks .wrap{display:block}
  .th-p-toys .perks .perk{border-top:1px solid rgba(23,35,51,.28);border-inline-start:0;padding:16px 0}
  .th-p-toys .perks .perk:first-child{border-top:0}
  .th-p-toys .morrow-discovery{padding-block:61px}
  .th-p-toys .morrow-discovery h2{font-size:clamp(36px,10.5vw,49px)}
  .th-p-toys .morrow-category-grid{grid-template-columns:1fr;max-width:430px}
  .th-p-toys .morrow-category-card{min-height:280px;padding:21px}
  .th-p-toys .morrow-category-copy strong{font-size:38px}
  .th-p-toys .morrow-product-grid{grid-template-columns:1fr;max-width:430px}
  .th-p-toys .morrow-product-card{min-height:142px;flex-direction:row;border-radius:20px}
  .th-p-toys .morrow-product-media{width:125px;height:auto;flex:0 0 125px}
  .th-p-toys .morrow-product-copy{padding:16px 46px 16px 15px}
  .th-p-toys .morrow-product-copy strong{font-size:27px}
  .th-p-toys .morrow-product-arrow{right:12px;bottom:50%;transform:translateY(50%)}
  .th-p-toys #shop{padding-top:62px;background:linear-gradient(180deg,#244C5C 0 82px,#F8F2E7 82px)}
  .th-p-toys #shop .sec-h{margin-bottom:28px}
  .th-p-toys #shop .sec-h h2{font-size:44px}
  .th-p-toys #shop .chips{gap:7px}
  .th-p-toys #shop .chip{min-height:44px;padding-inline:12px}
  .th-p-toys #shop .pc .bd{padding:15px 13px 17px}
}
@media (prefers-reduced-motion:reduce){
  .th-p-toys .morrow-hero.has-hero-motion .morrow-hero-media .hero-media{animation:none;transform:scale(1.002)}
}
`;

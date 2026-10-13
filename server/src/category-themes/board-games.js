import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-board-games',
  name: 'Afterhour Assembly',
  for: 'Board games and tabletop gatherings',
  vibe: 'Candlelit strategy tables, parchment paper, and a warm after-hours invitation',
  category: 'Board games and tabletop',
  group: 'lifestyle',
  display: 'DM Serif Display',
  body: 'DM Sans',
  displayWeight: 400,
  tracking: '-.025em',
  colors: {
    bg: '#F3EBDD',
    surface: '#FBF7EE',
    ink: '#201D19',
    muted: '#756D61',
    line: '#D9CFBE',
    accent: '#A33B32',
    onAccent: '#FFF9F0',
    panel: '#26372F',
    onPanel: '#F6EEDC',
    foot: '#171B19',
    onFoot: '#EDE1CD',
    bar: '#26372F',
    onBar: '#F6EEDC',
    badge: '#D8B36B',
    onBadge: '#201D19',
  },
  header: 'center',
  hero: 'overlay',
  card: 'boxed',
  ratio: '4/5',
  rCard: 2,
  rBtn: 2,
  motion: 'pan',
  copy: {
    eyebrow: 'Great games, brighter nights',
    collection: 'Choose your table',
    cta: 'Find your next game',
    title: 'The table is where the night begins.',
    subtitle: 'Stories to play. People to share them with.',
  },
});

const countLabel = (count) => `${count} ${count === 1 ? 'game' : 'games'}`;

const categoryTile = (ctx, category, index) => {
  const image = category.image
    ? `<img src="${ctx.esc(category.image)}" alt="" loading="lazy" decoding="async">`
    : '<span class="table-category-empty" aria-hidden="true"><i></i><i></i><i></i></span>';
  return `<a class="table-category-card" href="${ctx.categoryLink(category.name)}">
    <span class="table-category-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
    <span class="table-category-media">${image}</span>
    <span class="table-category-meta"><strong>${ctx.esc(category.name)}</strong><small>${countLabel(category.count)}</small></span>
    <span class="table-category-arrow" aria-hidden="true">↗</span>
  </a>`;
};

const productTile = (ctx, product, index) => {
  const image = product.image_url
    ? `<img src="${ctx.esc(product.image_url)}" alt="${ctx.esc(product.alt_text || product.title)}" loading="lazy" decoding="async">`
    : '<span class="table-product-empty" aria-hidden="true">◒</span>';
  const price = Number.isFinite(Number(product.price_cents))
    ? `<small>${ctx.money(Number(product.price_cents), product.currency || 'usd')}</small>`
    : '';
  return `<a class="table-product-tile" href="${ctx.productLink(product)}">
    <span class="table-product-index" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
    <span class="table-product-media">${image}</span>
    <span class="table-product-copy"><strong>${ctx.esc(product.title)}</strong>${product.category ? `<em>${ctx.esc(product.category)}</em>` : ''}${price}</span>
    <span class="table-product-arrow" aria-hidden="true">↗</span>
  </a>`;
};

export function hero(ctx) {
  return `<section class="hero category-hero table-hero${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="table-hero-media">${ctx.media(0, { priority: true, lazy: false, decorative: true })}</div>
    <div class="table-hero-wash" aria-hidden="true"></div>
    <div class="table-hero-constellation" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
    <div class="wrap table-hero-wrap">
      <div class="table-hero-copy">${ctx.copy('table-copy')}</div>
      <p class="table-hero-note"><span aria-hidden="true">✦</span> Gather close. Take a turn.</p>
    </div>
    ${ctx.controls}
  </section>`;
}

export function discovery(ctx) {
  const categories = (ctx.cats || []).filter((category) => category?.name).slice(0, 3);
  const products = (ctx.products || []).filter((product) => product?.title).slice(0, 3);

  if (categories.length >= 2) {
    return `<section class="theme-discovery table-discovery" aria-labelledby="table-discovery-title">
      <div class="wrap">
        <div class="table-discovery-head">
          <span class="table-rule" aria-hidden="true"><i></i></span>
          <p class="eyebrow">${ctx.esc(ctx.t.copy?.collection || 'Choose your table')}</p>
          <h2 id="table-discovery-title">Find the game that draws everyone in.</h2>
          <p>Browse the shelves by the kind of game night you want to make.</p>
        </div>
        <div class="table-category-grid">${categories.map((category, index) => categoryTile(ctx, category, index)).join('')}</div>
      </div>
    </section>`;
  }

  if (products.length) {
    return `<section class="theme-discovery table-discovery table-discovery-products" aria-labelledby="table-discovery-title">
      <div class="wrap">
        <div class="table-discovery-head">
          <span class="table-rule" aria-hidden="true"><i></i></span>
          <p class="eyebrow">${ctx.esc(ctx.t.copy?.collection || 'Choose your table')}</p>
          <h2 id="table-discovery-title">A few invitations to the table.</h2>
          <p>Pick a game, bring the people, and let the evening unfold.</p>
        </div>
        <div class="table-product-list">${products.map((product, index) => productTile(ctx, product, index)).join('')}</div>
      </div>
    </section>`;
  }

  return '';
}

export const css = `
.th-p-board-games .hd{background:var(--bg);border-bottom:1px solid color-mix(in srgb,var(--ink) 15%,transparent);box-shadow:none}
.th-p-board-games .hd .wrap{min-height:74px}
.th-p-board-games .hd .brand{font-family:var(--display);font-size:clamp(18px,1.45vw,23px);letter-spacing:.08em;text-transform:uppercase}
.th-p-board-games .hd .nav a{font-size:13px;letter-spacing:.04em}
.th-p-board-games .hd .cart{border:1px solid var(--line);border-radius:2px;padding:9px}
.th-p-board-games .table-hero{isolation:isolate;position:relative;min-height:clamp(490px,47vw,660px);overflow:hidden;background:#171A18;color:#FFF7E9}
.th-p-board-games .table-hero-media{position:absolute;inset:0;overflow:hidden;z-index:-3;background:linear-gradient(115deg,#17130f,#45301f)}
.th-p-board-games .table-hero-media .hero-media{width:100%;height:100%;max-width:none;display:block;object-fit:cover;object-position:center;transform:scale(1.001)}
.th-p-board-games .table-hero-media .theme-empty-media{width:100%;height:100%;min-height:0;background:radial-gradient(circle at 74% 52%,#50604e 0 1%,transparent 1.4%),radial-gradient(circle at 68% 43%,#A67237 0 1%,transparent 1.5%),linear-gradient(120deg,#10110f,#394437 58%,#201A14);color:#F3E5C8}
.th-p-board-games .table-hero-wash{position:absolute;inset:0;z-index:-2;background:linear-gradient(90deg,rgba(12,14,13,.91) 0%,rgba(16,17,16,.79) 30%,rgba(18,19,17,.25) 66%,rgba(12,13,11,.22) 100%),linear-gradient(0deg,rgba(15,13,10,.42),transparent 44%)}
.th-p-board-games .table-hero-constellation{position:absolute;z-index:-1;left:clamp(26px,5.5vw,96px);bottom:clamp(30px,6vw,86px);display:flex;align-items:center;gap:12px;opacity:.65}
.th-p-board-games .table-hero-constellation::before,.th-p-board-games .table-hero-constellation::after{content:'';width:clamp(32px,4vw,62px);height:1px;background:#E4CC9A}
.th-p-board-games .table-hero-constellation i{width:5px;height:5px;border:1px solid #E4CC9A;transform:rotate(45deg)}
.th-p-board-games .table-hero-constellation i:nth-of-type(2){width:8px;height:8px;background:#E4CC9A}
.th-p-board-games .table-hero-wrap{min-height:inherit;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;padding-top:clamp(56px,7vw,112px);padding-bottom:clamp(80px,10vw,146px)}
.th-p-board-games .table-hero-copy{width:min(100%,590px);padding-left:clamp(0px,2vw,30px)}
.th-p-board-games .table-hero-copy .txt{max-width:100%}
.th-p-board-games .table-hero-copy .eyebrow{color:#F3D89F;font:600 10px/1.2 var(--body);letter-spacing:.28em;text-transform:uppercase;margin:0 0 16px}
.th-p-board-games .table-hero-copy h1{max-width:11.5ch;margin:0;color:#FFF8EA;font-family:var(--display);font-size:clamp(48px,5.5vw,82px);font-weight:var(--dw);letter-spacing:var(--dt);line-height:.94;text-wrap:balance}
.th-p-board-games .table-hero-copy h1.long{font-size:clamp(39px,4.2vw,65px);max-width:15ch;line-height:.98}
.th-p-board-games .table-hero-copy .sub{max-width:42ch;margin:22px 0 0;color:#E9DDD0;font-size:clamp(15px,1.25vw,18px);line-height:1.52}
.th-p-board-games .table-hero-copy .ctas{display:flex;flex-wrap:wrap;gap:11px;margin-top:28px}
.th-p-board-games .table-hero-copy .btn{min-height:46px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--accent);border-radius:2px;background:var(--accent);color:var(--on-accent);padding:12px 19px;font-size:13px;font-weight:600;letter-spacing:.04em;box-shadow:none}
.th-p-board-games .table-hero-copy .btn:hover{background:#BA4B40;border-color:#BA4B40}
.th-p-board-games .table-hero-copy .btn.ghost{border-color:#F4E7D2;background:transparent;color:#FFF8EA}
.th-p-board-games .table-hero-copy .btn.ghost:hover{background:#F4E7D2;color:#171A18}
.th-p-board-games .table-hero-note{display:flex;align-items:center;gap:9px;margin:26px 0 0 clamp(0px,2vw,30px);color:#E4D1AD;font:500 11px/1.2 var(--body);letter-spacing:.16em;text-transform:uppercase}
.th-p-board-games .table-hero-note span{font-size:15px;color:#D8B36B}
.th-p-board-games .table-hero .motion-toggle{position:absolute;z-index:3;right:clamp(18px,3vw,48px);bottom:22px;border:1px solid rgba(246,238,220,.46);border-radius:2px;background:rgba(20,23,20,.76);color:#FFF7E9;padding:9px 13px;font:600 11px/1 var(--body);letter-spacing:.06em}
.th-p-board-games .table-hero .motion-toggle:hover{background:#F6EEDC;color:#1C211D}
.th-p-board-games .table-hero.has-hero-motion .table-hero-media .hero-media{animation:board-games-pan 19s ease-in-out infinite alternate}
.th-p-board-games .table-hero.has-hero-motion.is-motion-paused .table-hero-media .hero-media{animation-play-state:paused}
@keyframes board-games-pan{0%{transform:scale(1.03) translate3d(-.7%,.2%,0)}100%{transform:scale(1.1) translate3d(1.1%,-.7%,0)}}
.th-p-board-games .perks{background:#E7D8BD;border-block:1px solid #CFC0A4}
.th-p-board-games .perks .wrap{gap:0}
.th-p-board-games .perks .perk{padding:22px clamp(14px,2vw,28px);border-inline-start:1px solid #CFC0A4;color:var(--ink)}
.th-p-board-games .perks .perk:first-child{border-inline-start:0}
.th-p-board-games .perks .perk svg{color:#8E332C}
.th-p-board-games .perks .perk b{font-family:var(--display);font-weight:400;letter-spacing:.01em}
.th-p-board-games .table-discovery{position:relative;padding:clamp(58px,8vw,112px) 0 clamp(54px,7vw,92px);overflow:hidden;background:var(--bg)}
.th-p-board-games .table-discovery::before{content:'';position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 5% 8%,rgba(163,59,50,.08),transparent 22%),radial-gradient(circle at 95% 83%,rgba(38,55,47,.1),transparent 19%)}
.th-p-board-games .table-discovery .wrap{position:relative}
.th-p-board-games .table-discovery-head{max-width:660px;margin:0 auto clamp(30px,4vw,54px);text-align:center}
.th-p-board-games .table-rule{display:flex;align-items:center;justify-content:center;gap:13px;margin-bottom:15px}
.th-p-board-games .table-rule::before,.th-p-board-games .table-rule::after{content:'';width:43px;height:1px;background:#B9A785}
.th-p-board-games .table-rule i{display:block;width:8px;height:8px;border:1px solid #8D332D;transform:rotate(45deg)}
.th-p-board-games .table-discovery .eyebrow{margin:0 0 10px;color:#8D332D;font:700 10px/1.2 var(--body);letter-spacing:.22em;text-transform:uppercase}
.th-p-board-games .table-discovery h2{margin:0;color:var(--ink);font-family:var(--display);font-size:clamp(37px,4vw,58px);font-weight:var(--dw);letter-spacing:var(--dt);line-height:1.02;text-wrap:balance}
.th-p-board-games .table-discovery-head>p:last-child{max-width:48ch;margin:15px auto 0;color:var(--muted);font-size:15px;line-height:1.55}
.th-p-board-games .table-category-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-top:1px solid #CFC3AE;border-left:1px solid #CFC3AE;background:#F8F2E7}
.th-p-board-games .table-category-card{position:relative;display:flex;min-height:390px;flex-direction:column;justify-content:flex-end;overflow:hidden;padding:20px;border-right:1px solid #CFC3AE;border-bottom:1px solid #CFC3AE;background:#E8DDCA;color:var(--ink);text-decoration:none;isolation:isolate}
.th-p-board-games .table-category-media{position:absolute;inset:0;z-index:-1;display:block;overflow:hidden;background:linear-gradient(145deg,#314137,#A3774A)}
.th-p-board-games .table-category-media::after{content:'';position:absolute;inset:0;background:linear-gradient(0deg,rgba(23,24,20,.84),rgba(23,24,20,.06) 62%)}
.th-p-board-games .table-category-media img{width:100%;height:100%;display:block;object-fit:cover;transition:transform .35s ease}
.th-p-board-games .table-category-card:hover .table-category-media img{transform:scale(1.045)}
.th-p-board-games .table-category-empty{width:100%;height:100%;display:flex;align-items:center;justify-content:center;gap:11px;background:linear-gradient(145deg,#2B3A32,#8B6440)}
.th-p-board-games .table-category-empty i{width:13px;height:13px;border:1px solid #EAD6AD;transform:rotate(45deg)}
.th-p-board-games .table-category-empty i:nth-child(2){width:22px;height:22px;background:rgba(234,214,173,.22)}
.th-p-board-games .table-category-number{position:absolute;top:17px;left:19px;color:#F6EBD6;font:600 10px/1 var(--body);letter-spacing:.15em}
.th-p-board-games .table-category-meta{position:relative;z-index:1;display:flex;flex-direction:column;gap:5px;max-width:85%;color:#FFF7EA}
.th-p-board-games .table-category-meta strong{font-family:var(--display);font-size:clamp(27px,2.5vw,39px);font-weight:400;line-height:.98;letter-spacing:-.025em;text-wrap:balance}
.th-p-board-games .table-category-meta small{color:#E6D8BD;font:600 10px/1.2 var(--body);letter-spacing:.12em;text-transform:uppercase}
.th-p-board-games .table-category-arrow{position:absolute;right:18px;bottom:19px;z-index:1;display:grid;width:35px;height:35px;place-items:center;border:1px solid rgba(255,247,234,.62);color:#FFF7EA;font-size:17px;transition:background .2s ease,color .2s ease}
.th-p-board-games .table-category-card:hover .table-category-arrow{background:#FFF7EA;color:#1D2420}
.th-p-board-games .table-product-list{border-top:1px solid #CFC3AE}
.th-p-board-games .table-product-tile{position:relative;display:grid;grid-template-columns:52px minmax(130px,230px) minmax(0,1fr) 44px;align-items:center;min-height:122px;gap:clamp(12px,2vw,28px);border-bottom:1px solid #CFC3AE;color:var(--ink);text-decoration:none}
.th-p-board-games .table-product-index{align-self:stretch;display:grid;place-items:center;border-right:1px solid #CFC3AE;color:#8D332D;font:600 10px/1 var(--body);letter-spacing:.12em}
.th-p-board-games .table-product-media{align-self:stretch;position:relative;display:block;overflow:hidden;background:#DED1BD}
.th-p-board-games .table-product-media img{width:100%;height:100%;display:block;object-fit:cover;transition:transform .35s ease}
.th-p-board-games .table-product-tile:hover .table-product-media img{transform:scale(1.045)}
.th-p-board-games .table-product-empty{width:100%;height:100%;display:grid;place-items:center;background:#26372F;color:#F3EBDD;font:400 32px/1 var(--display)}
.th-p-board-games .table-product-copy{display:flex;min-width:0;flex-direction:column;gap:4px;padding:18px 0}
.th-p-board-games .table-product-copy strong{overflow-wrap:anywhere;font-family:var(--display);font-size:clamp(22px,2.2vw,31px);font-weight:400;line-height:1.03;letter-spacing:-.02em}
.th-p-board-games .table-product-copy em{color:var(--muted);font:500 11px/1.2 var(--body);letter-spacing:.1em;text-transform:uppercase}
.th-p-board-games .table-product-copy small{color:#8D332D;font:600 13px/1.2 var(--body)}
.th-p-board-games .table-product-arrow{display:grid;width:44px;height:44px;place-items:center;color:#8D332D;font-size:19px}
.th-p-board-games .table-product-tile:hover .table-product-arrow{color:#1D2420}
.th-p-board-games #shop{padding-block:clamp(58px,7vw,108px);background:linear-gradient(180deg,#26372F 0 120px,#F3EBDD 120px)}
.th-p-board-games #shop .wrap{padding-top:clamp(18px,3vw,38px)}
.th-p-board-games #shop .sec-h{align-items:end;margin-bottom:clamp(24px,3.5vw,48px)}
.th-p-board-games #shop .sec-h h2{max-width:12ch;color:#F8F0E2;font-family:var(--display);font-size:clamp(38px,4.3vw,63px);font-weight:400;letter-spacing:-.025em;line-height:.95}
.th-p-board-games #shop .chips{max-width:650px;justify-content:flex-end}
.th-p-board-games #shop .chip{border:1px solid rgba(248,240,226,.45);border-radius:2px;background:transparent;color:#F8F0E2;font-size:12px}
.th-p-board-games #shop .chip.on,.th-p-board-games #shop .chip:hover{border-color:#D8B36B;background:#D8B36B;color:#201D19}
.th-p-board-games #shop .grid{gap:clamp(20px,2.5vw,34px) clamp(12px,1.7vw,22px)}
.th-p-board-games #shop .pc{overflow:hidden;border:1px solid #CFC3AE;border-radius:2px;background:#FBF7EE;box-shadow:none;transition:transform .24s ease,box-shadow .24s ease}
.th-p-board-games #shop .pc:hover{transform:translateY(-4px);box-shadow:0 14px 26px rgba(44,34,24,.13)}
.th-p-board-games #shop .pc .im{position:relative;overflow:hidden;background:#DED1BD}
.th-p-board-games #shop .pc .im img{transition:transform .35s ease}
.th-p-board-games #shop .pc:hover .im img{transform:scale(1.035)}
.th-p-board-games #shop .pc .bd{display:grid;gap:8px;padding:17px 16px 18px}
.th-p-board-games #shop .pc h3{font-family:var(--display);font-size:clamp(20px,1.8vw,27px);font-weight:400;letter-spacing:-.015em;line-height:1.03}
.th-p-board-games #shop .pc .pr{color:#8D332D;font:700 13px/1.2 var(--body)}
.th-p-board-games #shop .pc .tag{top:10px;left:10px;border-radius:0;background:#26372F;color:#F8F0E2;font:700 9px/1 var(--body);letter-spacing:.1em;text-transform:uppercase}
.th-p-board-games #shop .pc .go{right:10px;bottom:10px;border-radius:0;background:#F8F0E2;color:#201D19;font-size:10px}
.th-p-board-games .feat{background:#E7D8BD}
.th-p-board-games .feat .pic{position:relative;overflow:hidden;border:1px solid #CFC0A4}
.th-p-board-games .feat .txt h2,.th-p-board-games .story .txt h2{font-family:var(--display);font-weight:400;letter-spacing:-.02em}
.th-p-board-games .ft{background:#171B19;color:#EDE1CD}
.th-p-board-games .ft a{color:#F7EDDB}
@media (max-width:820px){
  .th-p-board-games .hd .wrap{min-height:64px}
  .th-p-board-games .table-hero{min-height:570px}
  .th-p-board-games .table-hero-media .hero-media{object-position:61% center}
  .th-p-board-games .table-hero-wash{background:linear-gradient(90deg,rgba(12,14,13,.91),rgba(16,17,16,.7) 56%,rgba(12,13,11,.31)),linear-gradient(0deg,rgba(15,13,10,.48),transparent 46%)}
  .th-p-board-games .table-category-card{min-height:335px}
  .th-p-board-games .table-category-meta strong{font-size:30px}
  .th-p-board-games #shop{background:linear-gradient(180deg,#26372F 0 93px,#F3EBDD 93px)}
  .th-p-board-games #shop .sec-h h2{color:#F8F0E2}
  .th-p-board-games #shop .chips{justify-content:flex-start}
}
@media (max-width:620px){
  .th-p-board-games .hd .brand{font-size:16px;letter-spacing:.055em}
  .th-p-board-games .table-hero{min-height:555px}
  .th-p-board-games .table-hero-wrap{justify-content:flex-end;padding-top:100px;padding-bottom:104px}
  .th-p-board-games .table-hero-copy{padding-left:0}
  .th-p-board-games .table-hero-copy h1{max-width:10.5ch;font-size:clamp(45px,13vw,62px)}
  .th-p-board-games .table-hero-copy h1.long{max-width:12.5ch;font-size:clamp(36px,10vw,50px)}
  .th-p-board-games .table-hero-copy .sub{font-size:15px}
  .th-p-board-games .table-hero-copy .ctas{margin-top:23px}
  .th-p-board-games .table-hero-copy .btn{flex:1 1 170px;min-height:46px}
  .th-p-board-games .table-hero-note{margin-left:0;letter-spacing:.115em}
  .th-p-board-games .table-hero-constellation{left:22px;bottom:auto;top:27px;transform:scale(.82);transform-origin:left top}
  .th-p-board-games .table-hero .motion-toggle{right:16px;bottom:18px;min-height:44px}
  .th-p-board-games .perks .wrap{display:block}
  .th-p-board-games .perks .perk{border-inline-start:0;border-top:1px solid #CFC0A4;padding:16px 0}
  .th-p-board-games .perks .perk:first-child{border-top:0}
  .th-p-board-games .table-discovery{padding-top:60px}
  .th-p-board-games .table-discovery-head{margin-bottom:29px}
  .th-p-board-games .table-discovery h2{font-size:clamp(35px,10vw,48px)}
  .th-p-board-games .table-category-grid{grid-template-columns:1fr}
  .th-p-board-games .table-category-card{min-height:255px}
  .th-p-board-games .table-category-meta strong{font-size:34px}
  .th-p-board-games .table-product-tile{grid-template-columns:38px 92px minmax(0,1fr) 34px;min-height:106px;gap:12px}
  .th-p-board-games .table-product-copy{padding-block:14px}
  .th-p-board-games .table-product-copy strong{font-size:24px}
  .th-p-board-games .table-product-arrow{width:34px;height:34px}
  .th-p-board-games #shop{padding-top:61px;background:linear-gradient(180deg,#26372F 0 78px,#F3EBDD 78px)}
  .th-p-board-games #shop .sec-h{margin-bottom:27px}
  .th-p-board-games #shop .sec-h h2{font-size:43px}
  .th-p-board-games #shop .chips{gap:7px}
  .th-p-board-games #shop .chip{min-height:44px;padding-inline:12px}
  .th-p-board-games #shop .pc .bd{padding:14px 12px 15px}
  .th-p-board-games #shop .pc h3{font-size:21px}
}
@media (prefers-reduced-motion:reduce){
  .th-p-board-games .table-hero.has-hero-motion .table-hero-media .hero-media{animation:none;transform:scale(1.001)}
  .th-p-board-games .table-category-media img,.th-p-board-games .table-product-media img,.th-p-board-games #shop .pc,.th-p-board-games #shop .pc .im img{transition:none}
}
`;

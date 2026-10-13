import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-video-games',
  name: 'AFTERFRAME',
  for: 'Video games, consoles, and controllers',
  vibe: 'Cinematic, architectural, and electric after-dark play',
  category: 'Video games and gaming hardware',
  group: 'technology',
  display: 'Space Grotesk',
  body: 'Manrope',
  displayWeight: 700,
  tracking: '-.055em',
  colors: {
    bg: '#07090D',
    surface: '#10151C',
    ink: '#F4F7FB',
    muted: '#A8B0BC',
    line: '#26313D',
    accent: '#FF6B5D',
    onAccent: '#120805',
    panel: '#142331',
    onPanel: '#EFF7FF',
    foot: '#050609',
    onFoot: '#AEB7C3',
    bar: '#0C1118',
    onBar: '#F8FAFF',
    badge: '#DDE8F7',
    onBadge: '#0A1623',
  },
  header: 'split',
  hero: 'overlay',
  card: 'bold',
  ratio: '4/5',
  rCard: 0,
  rBtn: 0,
  motion: 'pan',
  copy: {
    eyebrow: 'THE PLAYFIELD',
    collection: 'Build your next world',
    cta: 'Explore the collection',
    title: 'Play beyond the frame.',
    subtitle: 'A cinematic edit of game hardware and worlds worth entering.',
  },
});

const countLabel = (count) => `${count} ${count === 1 ? 'item' : 'items'}`;

const categoryRail = (ctx, cats) => cats.slice(0, 4).map((category, index) => {
  const count = Number.isFinite(Number(category.count)) ? Number(category.count) : 0;
  return `<a class="vg-rail-link" href="${ctx.esc(ctx.categoryLink(category.name))}"><span class="vg-rail-index">0${index + 1}</span><span class="vg-rail-name">${ctx.esc(category.name)}</span><small>${ctx.esc(countLabel(count))}</small><span class="vg-rail-arrow" aria-hidden="true">↗</span></a>`;
}).join('');

const productPrice = (ctx, product) => {
  const values = [product.price_cents, ...(product.variants || []).map((variant) => variant.price_cents ?? product.price_cents)]
    .filter((value) => Number.isFinite(Number(value)))
    .map(Number);
  return values.length ? ctx.money(Math.min(...values), product.currency) : '';
};

export function hero(ctx) {
  const cats = (ctx.cats || []).filter((category) => category?.name);
  const rail = cats.length
    ? `<aside class="vg-rail" aria-label="Browse collections"><p class="vg-rail-label">Browse</p><nav class="vg-rail-links" aria-label="Store categories">${categoryRail(ctx, cats)}</nav>${ctx.pics.length > 1 ? `<div class="vg-rail-media">${ctx.media(1, { lazy: true, decorative: true })}</div>` : ''}</aside>`
    : '';

  return `<section class="hero category-hero vg-stage${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="vg-screen">
      <div class="vg-media">${ctx.media(0, { priority: true, lazy: false, decorative: true })}</div>
      <div class="vg-scan" aria-hidden="true"></div>
      <div class="vg-copy-frame">${ctx.copy('vg-copy')}</div>
      ${rail}
      <p class="vg-corner-note" aria-hidden="true">MORE WORLDS<br>AWAIT</p>
    </div>
    ${ctx.controls}
  </section>`;
}

export function discovery(ctx) {
  const cats = (ctx.cats || []).filter((category) => category?.name);
  const products = ctx.products || [];

  if (cats.length >= 2) {
    return `<section class="theme-discovery vg-discovery" aria-labelledby="vg-discovery-title">
      <div class="wrap vg-discovery-wrap">
        <div class="vg-discovery-intro"><p class="eyebrow">CHOOSE A SIGNAL</p><h2 id="vg-discovery-title">Your next world starts here.</h2><p>Enter through the collections your store has ready to play.</p></div>
        <div class="vg-lanes">${cats.slice(0, 4).map((category, index) => {
          const count = Number.isFinite(Number(category.count)) ? Number(category.count) : 0;
          return `<a class="vg-lane" href="${ctx.esc(ctx.categoryLink(category.name))}"><span class="vg-lane-number">0${index + 1}</span><span class="vg-lane-name">${ctx.esc(category.name)}</span><span class="vg-lane-count">${ctx.esc(countLabel(count))}</span><span class="vg-lane-arrow" aria-hidden="true">↗</span></a>`;
        }).join('')}</div>
      </div>
    </section>`;
  }

  if (!products.length) return '';

  return `<section class="theme-discovery vg-discovery vg-discovery-products" aria-labelledby="vg-discovery-title">
    <div class="wrap vg-discovery-wrap">
      <div class="vg-discovery-intro"><p class="eyebrow">IN FRAME</p><h2 id="vg-discovery-title">Explore what is ready to play.</h2></div>
      <div class="vg-lanes">${products.slice(0, 3).map((product, index) => `<a class="vg-lane" href="${ctx.esc(ctx.productLink(product))}"><span class="vg-lane-number">0${index + 1}</span><span class="vg-lane-name">${ctx.esc(product.title)}</span><span class="vg-lane-count">${ctx.esc(productPrice(ctx, product))}</span><span class="vg-lane-arrow" aria-hidden="true">↗</span></a>`).join('')}</div>
    </div>
  </section>`;
}

export const css = `
.th-p-video-games{background:#07090D}
.th-p-video-games .hd{background:rgba(5,7,10,.94);border-bottom:1px solid #26313D;backdrop-filter:blur(14px)}
.th-p-video-games .hd .wrap{max-width:1540px}
.th-p-video-games .hd .brand{font-family:var(--display);font-size:.92rem;font-weight:700;letter-spacing:.26em;text-transform:uppercase}
.th-p-video-games .hd .nav a{font-size:.72rem;letter-spacing:.11em;text-transform:uppercase}
.th-p-video-games .hd .nav a:hover{color:#FF6B5D}
.th-p-video-games .hd .cart{border-color:#374452}
.th-p-video-games .vg-stage{position:relative;isolation:isolate;overflow:hidden;background:#05070A;color:#F4F7FB;margin:0;padding:0}
.th-p-video-games .vg-screen{position:relative;display:grid;grid-template-columns:minmax(300px,.9fr) minmax(320px,2.4fr) minmax(168px,.45fr);min-height:clamp(590px,53vw,760px);max-width:1680px;margin:0 auto;overflow:hidden}
.th-p-video-games .vg-media{grid-column:1/-1;grid-row:1;position:relative;overflow:hidden;background:#10151C}
.th-p-video-games .vg-media::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,rgba(4,6,9,.95) 0%,rgba(4,6,9,.8) 25%,rgba(4,6,9,.24) 51%,rgba(4,6,9,.15) 100%),linear-gradient(0deg,rgba(2,4,7,.54),transparent 38%)}
.th-p-video-games .vg-media .hero-media{display:block;width:100%;height:100%;object-fit:cover;object-position:center;transform:scale(1.002)}
.th-p-video-games .vg-media .theme-empty-media{height:100%;min-height:clamp(590px,53vw,760px);background:radial-gradient(circle at 72% 32%,#1B3D5C 0%,#101820 29%,#05070A 73%)}
.th-p-video-games .vg-scan{grid-column:1/-1;grid-row:1;z-index:1;pointer-events:none;background:linear-gradient(110deg,transparent 0 45%,rgba(138,209,255,.28) 45.12%,transparent 45.28%),repeating-linear-gradient(0deg,transparent 0 5px,rgba(221,240,255,.025) 6px 7px);mix-blend-mode:screen;opacity:.48}
.th-p-video-games .vg-copy-frame{grid-column:1/3;grid-row:1;z-index:2;align-self:center;max-width:min(43rem,92%);padding:clamp(42px,6vw,100px);padding-right:clamp(30px,8vw,150px)}
.th-p-video-games .vg-copy{max-width:42rem}
.th-p-video-games .vg-copy .eyebrow,.th-p-video-games .vg-discovery .eyebrow{margin:0 0 18px;color:#FF6B5D;font:700 .68rem/1.2 var(--body);letter-spacing:.18em;text-transform:uppercase}
.th-p-video-games .vg-copy h1{max-width:10ch;margin:0;color:#F4F7FB;font:700 clamp(3.15rem,6.15vw,6.65rem)/.88 var(--display);letter-spacing:-.07em;text-wrap:balance}
.th-p-video-games .vg-copy h1.long{max-width:12.5ch;font-size:clamp(2.75rem,5vw,5.65rem);line-height:.94}
.th-p-video-games .vg-copy .sub{max-width:32rem;margin:23px 0 0;color:#CCD5DF;font-size:clamp(.92rem,1.15vw,1.12rem);line-height:1.65}
.th-p-video-games .vg-copy .ctas{display:flex;flex-wrap:wrap;gap:10px;margin-top:30px}
.th-p-video-games .vg-copy .btn{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 21px;border:1px solid #FF6B5D;border-radius:0;background:#FF6B5D;color:#120805;font-size:.76rem;font-weight:800;letter-spacing:.04em;text-transform:uppercase}
.th-p-video-games .vg-copy .btn:hover{background:#FFC0B9;border-color:#FFC0B9;color:#120805}
.th-p-video-games .vg-copy .btn.ghost{border-color:#52606E;background:rgba(5,7,10,.36);color:#F4F7FB}
.th-p-video-games .vg-copy .btn.ghost:hover{border-color:#F4F7FB;background:#F4F7FB;color:#0B0E13}
.th-p-video-games .vg-rail{grid-column:3;grid-row:1;z-index:3;align-self:stretch;display:flex;flex-direction:column;min-width:0;padding:29px 18px 18px;border-left:1px solid rgba(212,230,246,.22);background:rgba(5,7,10,.66);backdrop-filter:blur(11px)}
.th-p-video-games .vg-rail-label{margin:0 0 14px;color:#DCE6EF;font:700 .61rem/1 var(--body);letter-spacing:.18em;text-transform:uppercase}
.th-p-video-games .vg-rail-links{display:flex;flex-direction:column;border-top:1px solid rgba(212,230,246,.22)}
.th-p-video-games .vg-rail-link{position:relative;display:grid;grid-template-columns:20px minmax(0,1fr) auto;align-items:center;column-gap:7px;min-height:52px;padding:7px 0;border-bottom:1px solid rgba(212,230,246,.16);color:#F4F7FB;text-decoration:none}
.th-p-video-games .vg-rail-index{color:#7891A6;font:700 .58rem/1 var(--body);letter-spacing:.04em}
.th-p-video-games .vg-rail-name{min-width:0;overflow-wrap:anywhere;font:700 .66rem/1.15 var(--body);letter-spacing:.04em;text-transform:uppercase}
.th-p-video-games .vg-rail-link small{grid-column:2;color:#A8B0BC;font-size:.58rem;line-height:1.2}
.th-p-video-games .vg-rail-arrow{grid-column:3;grid-row:1/3;color:#FF6B5D;font-size:1rem}
.th-p-video-games .vg-rail-media{position:relative;overflow:hidden;min-height:130px;margin-top:auto;padding-top:16px;border-top:1px solid rgba(212,230,246,.22)}
.th-p-video-games .vg-rail-media .hero-media{display:block;width:100%;height:130px;object-fit:cover;filter:saturate(.83) contrast(1.08)}
.th-p-video-games .vg-rail-media .theme-empty-media{display:none}
.th-p-video-games .vg-corner-note{position:absolute;z-index:2;left:clamp(24px,3vw,55px);bottom:27px;margin:0;color:rgba(244,247,251,.74);font:700 .56rem/1.45 var(--body);letter-spacing:.17em;text-transform:uppercase}
.th-p-video-games .vg-stage .motion-toggle{position:absolute;z-index:4;right:clamp(18px,3vw,42px);bottom:18px;min-height:44px;padding:0 12px;border:1px solid rgba(244,247,251,.48);border-radius:0;background:#090C11;color:#F4F7FB;font:700 .62rem/1 var(--body);letter-spacing:.08em;text-transform:uppercase}
.th-p-video-games .vg-stage.has-hero-motion[data-hero-motion="pan"] .vg-media .hero-media{animation:video-games-pan 18s ease-in-out infinite alternate}
.th-p-video-games .vg-stage.has-hero-motion[data-hero-motion="drift"] .vg-media .hero-media{animation:video-games-drift 13s ease-in-out infinite alternate}
.th-p-video-games .vg-stage.is-motion-paused .vg-media .hero-media{animation-play-state:paused}
.th-p-video-games .vg-discovery{position:relative;overflow:hidden;padding:clamp(64px,8vw,118px) 0;background:#0A0E13;border-top:1px solid #26313D;border-bottom:1px solid #26313D;color:#F4F7FB}
.th-p-video-games .vg-discovery::before{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(114deg,transparent 0 55%,rgba(82,153,202,.1) 55.1%,transparent 55.3%)}
.th-p-video-games .vg-discovery-wrap{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,.86fr) minmax(0,1.4fr);gap:clamp(32px,7vw,110px);align-items:start}
.th-p-video-games .vg-discovery-intro{max-width:31rem}
.th-p-video-games .vg-discovery-intro h2{max-width:9.4ch;margin:0;color:#F4F7FB;font:700 clamp(2.15rem,4.3vw,4.75rem)/.93 var(--display);letter-spacing:-.065em;text-wrap:balance}
.th-p-video-games .vg-discovery-intro>p:not(.eyebrow){margin:23px 0 0;color:#A8B0BC;font-size:.95rem;line-height:1.65}
.th-p-video-games .vg-lanes{border-top:1px solid #344351}
.th-p-video-games .vg-lane{display:grid;grid-template-columns:42px minmax(0,1fr) auto 24px;align-items:center;gap:16px;min-height:89px;padding:14px 0;border-bottom:1px solid #344351;color:#F4F7FB;text-decoration:none}
.th-p-video-games .vg-lane-number{color:#FF6B5D;font:700 .68rem/1 var(--body);letter-spacing:.09em}
.th-p-video-games .vg-lane-name{min-width:0;overflow-wrap:anywhere;font:700 clamp(1rem,1.45vw,1.35rem)/1.1 var(--display);letter-spacing:-.035em}
.th-p-video-games .vg-lane-count{color:#A8B0BC;font:600 .68rem/1.2 var(--body);letter-spacing:.06em;text-transform:uppercase;text-align:right}
.th-p-video-games .vg-lane-arrow{color:#FF6B5D;font-size:1.15rem}
.th-p-video-games #shop{background:#07090D;padding-top:clamp(58px,8vw,110px)}
.th-p-video-games #shop .sec-h{align-items:end;border-bottom:1px solid #26313D;padding-bottom:18px}
.th-p-video-games #shop .sec-h h2{font:700 clamp(2rem,4vw,4.4rem)/.9 var(--display);letter-spacing:-.065em}
.th-p-video-games #shop .chips{gap:6px}
.th-p-video-games #shop .chip{min-height:44px;border-radius:0;border-color:#344351;background:transparent;color:#A8B0BC;font-size:.68rem;letter-spacing:.07em;text-transform:uppercase}
.th-p-video-games #shop .chip:hover,.th-p-video-games #shop .chip[aria-current="page"]{border-color:#FF6B5D;background:#FF6B5D;color:#120805}
.th-p-video-games #shop .grid{gap:1px;background:#26313D}
.th-p-video-games #shop .pc{background:#0D1218;border-radius:0}
.th-p-video-games #shop .pc .im{background:#10151C;border-radius:0}
.th-p-video-games #shop .pc .bd{padding:15px 16px 18px}
.th-p-video-games #shop .pc h3{font-family:var(--display);letter-spacing:-.035em}
.th-p-video-games #shop .pc .pr{color:#FF9A91;font-weight:800}
.th-p-video-games #shop .pc .go{border-radius:0;background:#FF6B5D;color:#120805;font-size:.68rem;font-weight:800;letter-spacing:.07em;text-transform:uppercase}
.th-p-video-games .perks{background:#0C1118;border-color:#26313D}
.th-p-video-games .perks .perk{color:#F4F7FB}
.th-p-video-games .perks .perk svg{color:#FF6B5D}
.th-p-video-games .ft{border-top-color:#26313D}
@keyframes video-games-pan{0%{transform:scale(1.035) translate3d(-.7%,0,0)}100%{transform:scale(1.09) translate3d(1.4%,-.5%,0)}}
@keyframes video-games-drift{0%{transform:scale(1.03) translate3d(-.5%,-.4%,0)}100%{transform:scale(1.06) translate3d(.6%,.5%,0)}}
@media (max-width:1050px){
  .th-p-video-games .vg-screen{grid-template-columns:minmax(260px,1fr) minmax(170px,.42fr);min-height:650px}
  .th-p-video-games .vg-copy-frame{grid-column:1/2;max-width:34rem;padding-right:36px}
  .th-p-video-games .vg-rail{grid-column:2;padding:24px 14px 14px}
  .th-p-video-games .vg-rail-media{min-height:112px}
  .th-p-video-games .vg-rail-media .hero-media{height:112px}
  .th-p-video-games .vg-copy h1{font-size:clamp(3.4rem,7vw,5.6rem)}
}
@media (max-width:720px){
  .th-p-video-games .hd .nav{display:none}
  .th-p-video-games .vg-screen{display:block;min-height:650px}
  .th-p-video-games .vg-media{position:absolute;inset:0}
  .th-p-video-games .vg-media .theme-empty-media{min-height:650px}
  .th-p-video-games .vg-media .hero-media{object-position:58% center}
  .th-p-video-games .vg-media::after{background:linear-gradient(180deg,rgba(4,6,9,.57),rgba(4,6,9,.88) 54%,rgba(4,6,9,.98)),linear-gradient(90deg,rgba(4,6,9,.64),transparent 72%)}
  .th-p-video-games .vg-copy-frame{position:relative;display:flex;align-items:flex-start;min-height:460px;max-width:none;padding:72px 24px 40px}
  .th-p-video-games .vg-copy{max-width:31rem}
  .th-p-video-games .vg-copy h1{max-width:10.8ch;font-size:clamp(3rem,13vw,4.8rem)}
  .th-p-video-games .vg-copy .sub{max-width:29rem;font-size:.92rem}
  .th-p-video-games .vg-rail{position:relative;display:grid;grid-template-columns:minmax(0,1fr) 102px;gap:0;margin:0 14px;padding:14px;border:1px solid rgba(212,230,246,.24);background:rgba(5,7,10,.84)}
  .th-p-video-games .vg-rail-label{grid-column:1/-1;margin-bottom:9px}
  .th-p-video-games .vg-rail-links{grid-column:1}
  .th-p-video-games .vg-rail-link{min-height:46px}
  .th-p-video-games .vg-rail-media{grid-column:2;grid-row:2;margin:0 0 0 12px;padding:0;border:0;min-height:100%}
  .th-p-video-games .vg-rail-media .hero-media{height:100%;min-height:157px}
  .th-p-video-games .vg-corner-note{display:none}
  .th-p-video-games .vg-stage .motion-toggle{right:24px;bottom:20px}
  .th-p-video-games .vg-discovery-wrap{grid-template-columns:1fr;gap:38px}
  .th-p-video-games .vg-discovery-intro h2{max-width:12ch}
}
@media (max-width:480px){
  .th-p-video-games .hd .wrap{min-height:58px}
  .th-p-video-games .hd .brand{font-size:.74rem;letter-spacing:.19em}
  .th-p-video-games .vg-screen,.th-p-video-games .vg-media .theme-empty-media{min-height:620px}
  .th-p-video-games .vg-copy-frame{min-height:410px;padding:62px 20px 27px}
  .th-p-video-games .vg-copy .eyebrow{margin-bottom:13px;font-size:.6rem}
  .th-p-video-games .vg-copy h1{font-size:clamp(2.8rem,14.2vw,4rem);line-height:.9}
  .th-p-video-games .vg-copy h1.long{font-size:clamp(2.4rem,12vw,3.35rem)}
  .th-p-video-games .vg-copy .sub{margin-top:17px;line-height:1.55}
  .th-p-video-games .vg-copy .ctas{margin-top:23px}
  .th-p-video-games .vg-copy .btn{width:100%;min-height:48px}
  .th-p-video-games .vg-rail{display:block;margin:0 10px;padding:12px}
  .th-p-video-games .vg-rail-media{display:none}
  .th-p-video-games .vg-rail-link{grid-template-columns:20px minmax(0,1fr) 18px;min-height:46px}
  .th-p-video-games .vg-rail-link small{display:none}
  .th-p-video-games .vg-rail-arrow{grid-row:1;grid-column:3}
  .th-p-video-games .vg-stage .motion-toggle{right:20px;bottom:18px}
  .th-p-video-games .vg-discovery{padding:58px 0}
  .th-p-video-games .vg-discovery-wrap{gap:30px}
  .th-p-video-games .vg-discovery-intro h2{font-size:clamp(2.1rem,11vw,3rem)}
  .th-p-video-games .vg-lane{grid-template-columns:30px minmax(0,1fr) 20px;gap:9px;min-height:64px}
  .th-p-video-games .vg-lane-count{display:none}
  .th-p-video-games .vg-lane-arrow{grid-column:3}
  .th-p-video-games #shop .sec-h{align-items:flex-start;gap:18px}
  .th-p-video-games #shop .sec-h h2{font-size:clamp(2rem,11vw,3rem)}
}
@media (prefers-reduced-motion:reduce){
  .th-p-video-games .vg-stage.has-hero-motion .vg-media .hero-media{animation:none;transform:none}
}
`;

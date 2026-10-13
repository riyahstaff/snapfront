import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-retro-gaming-consoles',
  name: 'MEMORY SLOT',
  for: 'Vintage consoles, cartridge systems, and analog play',
  vibe: 'Collector-grade CRT glow with a tactile service-manual sensibility',
  category: 'Retro gaming consoles',
  group: 'technology',
  display: 'Bricolage Grotesque',
  body: 'DM Mono',
  displayWeight: 800,
  tracking: '-.065em',
  colors: {
    bg: '#E7E0D0',
    surface: '#F4EEDF',
    ink: '#17202B',
    muted: '#687078',
    line: '#B8B0A0',
    accent: '#F15B36',
    onAccent: '#23140F',
    panel: '#253548',
    onPanel: '#F5F0E5',
    foot: '#17202B',
    onFoot: '#E7E0D0',
    bar: '#D8CFBD',
    onBar: '#17202B',
    badge: '#B7F1D1',
    onBadge: '#14241E',
  },
  header: 'stack',
  hero: 'spotlight',
  card: 'boxed',
  ratio: '1/1',
  rCard: 10,
  rBtn: 2,
  motion: 'pan',
  copy: {
    eyebrow: 'THE REPLAY ARCHIVE',
    collection: 'Console memory, kept alive',
    cta: 'Open the collection',
    title: 'Press play on the past.',
    subtitle: 'A thoughtful edit for the ritual of cartridges, cables, and glowing screens.',
  },
});

const validCategories = (ctx) => (ctx.cats || []).filter((category) => category?.name);
const countLabel = (count) => {
  const value = Number.isFinite(Number(count)) ? Number(count) : 0;
  return `${value} ${value === 1 ? 'item' : 'items'}`;
};

const productPrice = (ctx, product) => {
  const values = [product?.price_cents, ...(product?.variants || []).map((variant) => variant?.price_cents)]
    .filter((value) => Number.isFinite(Number(value)))
    .map(Number);
  return values.length ? ctx.money(Math.min(...values), product.currency) : '';
};

const shelfLinks = (ctx, categories, className) => categories.slice(0, 4).map((category, index) => {
  const number = String(index + 1).padStart(2, '0');
  return `<a class="${className}" href="${ctx.esc(ctx.categoryLink(category.name))}"><span class="rgc-format-no">${number}</span><span class="rgc-format-name">${ctx.esc(category.name)}</span><span class="rgc-format-count">${ctx.esc(countLabel(category.count))}</span><span class="rgc-arrow" aria-hidden="true">↗</span></a>`;
}).join('');

export function hero(ctx) {
  const categories = validCategories(ctx);
  const formats = categories.length >= 2
    ? `<nav class="rgc-formats" aria-label="Browse store categories"><p class="rgc-formats-label">Shelf index</p>${shelfLinks(ctx, categories, 'rgc-format-link')}</nav>`
    : '';

  return `<section class="hero category-hero rgc-hero${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="rgc-topline"><span>MEMORY SLOT / 09</span><span>${ctx.esc(ctx.store.store_name)}</span></div>
    <div class="rgc-stage">
      <figure class="rgc-screen" aria-label="Featured collection photography">
        ${ctx.media(0, { priority: true, lazy: false, decorative: true })}
        <span class="rgc-screen-glass" aria-hidden="true"></span>
      </figure>
      <div class="rgc-copy-bay">${ctx.copy('rgc-copy')}</div>
      <p class="rgc-ticket" aria-hidden="true"><span>CARTRIDGE</span><span>CONSOLE</span><span>KEEP</span></p>
      ${formats}
    </div>
    ${ctx.controls}
  </section>`;
}

export function discovery(ctx) {
  const categories = validCategories(ctx);
  const products = ctx.products || [];

  if (categories.length >= 2) {
    return `<section class="theme-discovery rgc-discovery" aria-labelledby="rgc-discovery-title">
      <div class="wrap rgc-discovery-wrap">
        <div class="rgc-index-intro">
          <p class="eyebrow">START AT THE SHELF</p>
          <h2 id="rgc-discovery-title">Every system has its own signal.</h2>
          <p>Browse the parts of this collection that are ready to be replayed.</p>
        </div>
        <div class="rgc-spines" aria-label="Store categories">${shelfLinks(ctx, categories, 'rgc-spine')}</div>
      </div>
    </section>`;
  }

  if (!products.length) return '';

  return `<section class="theme-discovery rgc-discovery rgc-discovery-pulls" aria-labelledby="rgc-discovery-title">
    <div class="wrap rgc-discovery-wrap">
      <div class="rgc-index-intro">
        <p class="eyebrow">FIRST PULL</p>
        <h2 id="rgc-discovery-title">Ready for another round.</h2>
      </div>
      <div class="rgc-pulls">${products.slice(0, 4).map((product, index) => {
        const price = productPrice(ctx, product);
        return `<a class="rgc-pull" href="${ctx.esc(ctx.productLink(product))}"><span class="rgc-pull-no">${String(index + 1).padStart(2, '0')}</span><span class="rgc-pull-title">${ctx.esc(product.title)}</span>${price ? `<span class="rgc-pull-price">${ctx.esc(price)}</span>` : ''}<span class="rgc-arrow" aria-hidden="true">↗</span></a>`;
      }).join('')}</div>
    </div>
  </section>`;
}

export const css = `
.th-p-retro-gaming-consoles{background:#E7E0D0;color:#17202B}
.th-p-retro-gaming-consoles .hd{background:rgba(231,224,208,.95);border-bottom:1px solid #B8B0A0;backdrop-filter:blur(14px)}
.th-p-retro-gaming-consoles .hd .wrap{max-width:1540px}
.th-p-retro-gaming-consoles .hd .brand{font-family:var(--body);font-size:.77rem;font-weight:700;letter-spacing:.13em;text-transform:uppercase}
.th-p-retro-gaming-consoles .hd .nav a{font-family:var(--body);font-size:.68rem;letter-spacing:.075em;text-transform:uppercase}
.th-p-retro-gaming-consoles .hd .nav a:hover{color:#F15B36}
.th-p-retro-gaming-consoles .hd .cart{border-color:#8E887C;border-radius:2px}
.th-p-retro-gaming-consoles .rgc-hero{position:relative;isolation:isolate;overflow:hidden;background:#E7E0D0;color:#17202B;padding-bottom:clamp(30px,4vw,62px)}
.th-p-retro-gaming-consoles .rgc-topline{display:flex;justify-content:space-between;gap:18px;max-width:1540px;margin:0 auto;padding:13px clamp(20px,4vw,62px) 12px;border-bottom:1px solid #B8B0A0;color:#687078;font:700 clamp(.55rem,.65vw,.68rem)/1.1 var(--body);letter-spacing:.12em;text-transform:uppercase}
.th-p-retro-gaming-consoles .rgc-topline span:last-child{max-width:42%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:right}
.th-p-retro-gaming-consoles .rgc-stage{position:relative;display:grid;grid-template-columns:repeat(12,minmax(0,1fr));grid-template-rows:minmax(180px,.55fr) minmax(360px,1fr);max-width:1540px;min-height:clamp(620px,52vw,760px);margin:0 auto;padding:clamp(24px,4vw,62px) clamp(20px,4vw,62px) 0}
.th-p-retro-gaming-consoles .rgc-screen{grid-column:4/12;grid-row:1/3;position:relative;z-index:1;min-height:0;margin:0;overflow:hidden;border:1px solid #263548;border-radius:46% 46% 10% 10% / 12% 12% 5% 5%;background:#253548;box-shadow:10px 14px 0 #B9B09E}
.th-p-retro-gaming-consoles .rgc-screen::before{content:"";position:absolute;z-index:1;inset:13px;pointer-events:none;border:1px solid rgba(231,224,208,.42);border-radius:44% 44% 8% 8% / 12% 12% 5% 5%}
.th-p-retro-gaming-consoles .rgc-screen-glass{position:absolute;z-index:2;inset:0;pointer-events:none;background:linear-gradient(112deg,rgba(231,224,208,.22),transparent 23%,transparent 68%,rgba(144,246,225,.12)),repeating-linear-gradient(0deg,rgba(5,12,20,.15) 0 1px,transparent 1px 4px);mix-blend-mode:screen}
.th-p-retro-gaming-consoles .rgc-screen .hero-media{display:block;width:100%;height:100%;object-fit:cover;object-position:center;filter:saturate(.82) contrast(1.04)}
.th-p-retro-gaming-consoles .rgc-screen .theme-empty-media{height:100%;min-height:clamp(620px,52vw,760px);background:radial-gradient(circle at 54% 34%,#887ED4 0%,#344D60 28%,#1B2733 58%,#0E141B 100%);color:#E7E0D0}
.th-p-retro-gaming-consoles .rgc-copy-bay{grid-column:1/8;grid-row:2;z-index:3;align-self:end;max-width:43rem;padding:clamp(26px,4vw,55px) clamp(22px,3vw,44px) clamp(26px,4vw,48px) 0;background:#E7E0D0;clip-path:polygon(0 0,calc(100% - 25px) 0,100% 25px,100% 100%,0 100%)}
.th-p-retro-gaming-consoles .rgc-copy{max-width:40rem}
.th-p-retro-gaming-consoles .rgc-copy .eyebrow,.th-p-retro-gaming-consoles .rgc-index-intro .eyebrow{margin:0 0 15px;color:#F15B36;font:700 .67rem/1.2 var(--body);letter-spacing:.13em;text-transform:uppercase}
.th-p-retro-gaming-consoles .rgc-copy h1{max-width:8.7ch;margin:0;color:#17202B;font:800 clamp(3.4rem,7.3vw,7.25rem)/.83 var(--display);letter-spacing:-.08em;text-wrap:balance}
.th-p-retro-gaming-consoles .rgc-copy h1.long{max-width:11.5ch;font-size:clamp(2.8rem,5.5vw,5.8rem);line-height:.88}
.th-p-retro-gaming-consoles .rgc-copy .sub{max-width:31rem;margin:22px 0 0;color:#4D565E;font-size:clamp(.89rem,1.1vw,1.04rem);line-height:1.65}
.th-p-retro-gaming-consoles .rgc-copy .ctas{display:flex;flex-wrap:wrap;gap:9px;margin-top:27px}
.th-p-retro-gaming-consoles .rgc-copy .btn{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 19px;border:1px solid #17202B;border-radius:2px;background:#17202B;color:#F4EEDF;font:700 .68rem/1 var(--body);letter-spacing:.08em;text-transform:uppercase}
.th-p-retro-gaming-consoles .rgc-copy .btn:hover{border-color:#F15B36;background:#F15B36;color:#23140F}
.th-p-retro-gaming-consoles .rgc-copy .btn.ghost{background:transparent;color:#17202B}
.th-p-retro-gaming-consoles .rgc-copy .btn.ghost:hover{background:#B7F1D1;border-color:#B7F1D1;color:#14241E}
.th-p-retro-gaming-consoles .rgc-ticket{grid-column:12/13;grid-row:1;z-index:3;justify-self:end;display:flex;flex-direction:column;align-items:center;justify-content:space-between;min-height:150px;margin:0;padding:11px 7px;border:1px solid #17202B;background:#B7F1D1;color:#14241E;font:700 .59rem/1 var(--body);letter-spacing:.1em;text-align:center;writing-mode:vertical-rl}
.th-p-retro-gaming-consoles .rgc-formats{grid-column:8/13;grid-row:2;z-index:4;align-self:end;justify-self:end;width:min(100%,300px);margin-bottom:clamp(19px,3vw,44px);padding:14px 15px 0;border:1px solid #17202B;background:rgba(231,224,208,.93);box-shadow:6px 7px 0 #F15B36}
.th-p-retro-gaming-consoles .rgc-formats-label{margin:0 0 9px;color:#687078;font:700 .57rem/1 var(--body);letter-spacing:.13em;text-transform:uppercase}
.th-p-retro-gaming-consoles .rgc-format-link{display:grid;grid-template-columns:25px minmax(0,1fr) auto 16px;align-items:center;gap:7px;min-height:48px;border-top:1px solid #B8B0A0;color:#17202B;text-decoration:none}
.th-p-retro-gaming-consoles .rgc-format-link:hover{color:#F15B36}
.th-p-retro-gaming-consoles .rgc-format-no,.th-p-retro-gaming-consoles .rgc-pull-no{color:#F15B36;font:700 .61rem/1 var(--body);letter-spacing:.05em}
.th-p-retro-gaming-consoles .rgc-format-name{min-width:0;overflow-wrap:anywhere;font:700 .68rem/1.2 var(--body);letter-spacing:.035em;text-transform:uppercase}
.th-p-retro-gaming-consoles .rgc-format-count{color:#687078;font:500 .56rem/1.1 var(--body);text-align:right;white-space:nowrap}
.th-p-retro-gaming-consoles .rgc-arrow{color:#F15B36;font:700 1.08rem/1 var(--display)}
.th-p-retro-gaming-consoles .rgc-hero .motion-toggle{position:absolute;z-index:6;right:clamp(20px,4vw,62px);bottom:12px;min-height:44px;padding:0 11px;border:1px solid #17202B;border-radius:2px;background:#E7E0D0;color:#17202B;font:700 .58rem/1 var(--body);letter-spacing:.08em;text-transform:uppercase}
.th-p-retro-gaming-consoles .rgc-hero.has-hero-motion[data-hero-motion="pan"] .rgc-screen .hero-media{animation:retro-gaming-consoles-pan 19s ease-in-out infinite alternate}
.th-p-retro-gaming-consoles .rgc-hero.has-hero-motion[data-hero-motion="drift"] .rgc-screen .hero-media{animation:retro-gaming-consoles-drift 14s ease-in-out infinite alternate}
.th-p-retro-gaming-consoles .rgc-hero.is-motion-paused .rgc-screen .hero-media{animation-play-state:paused}
.th-p-retro-gaming-consoles .rgc-discovery{position:relative;overflow:hidden;padding:clamp(66px,9vw,132px) 0;background:#253548;color:#F4EEDF;border-top:1px solid #17202B;border-bottom:1px solid #17202B}
.th-p-retro-gaming-consoles .rgc-discovery::after{content:"";position:absolute;right:-12vw;bottom:-24vw;width:56vw;aspect-ratio:1;border:1px solid rgba(183,241,209,.25);border-radius:50%;box-shadow:0 0 0 33px rgba(183,241,209,.06),0 0 0 66px rgba(183,241,209,.04);pointer-events:none}
.th-p-retro-gaming-consoles .rgc-discovery-wrap{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,.76fr) minmax(0,1.24fr);gap:clamp(38px,9vw,145px);align-items:end}
.th-p-retro-gaming-consoles .rgc-index-intro{max-width:31rem}
.th-p-retro-gaming-consoles .rgc-index-intro .eyebrow{color:#B7F1D1}
.th-p-retro-gaming-consoles .rgc-index-intro h2{max-width:9.5ch;margin:0;color:#F4EEDF;font:800 clamp(2.55rem,5vw,5.55rem)/.87 var(--display);letter-spacing:-.07em;text-wrap:balance}
.th-p-retro-gaming-consoles .rgc-index-intro>p:not(.eyebrow){max-width:26rem;margin:23px 0 0;color:#CFD7D9;font-size:.94rem;line-height:1.65}
.th-p-retro-gaming-consoles .rgc-spines{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-items:end;gap:9px}
.th-p-retro-gaming-consoles .rgc-spine{position:relative;display:grid;grid-template-columns:1fr auto;align-content:space-between;min-height:clamp(185px,18vw,256px);padding:17px;border:1px solid rgba(244,238,223,.53);background:#30445A;color:#F4EEDF;text-decoration:none}
.th-p-retro-gaming-consoles .rgc-spine:nth-child(2n){min-height:clamp(155px,15vw,220px);background:#1D2A39}
.th-p-retro-gaming-consoles .rgc-spine:nth-child(3n){background:#426263;color:#F5F0E5}
.th-p-retro-gaming-consoles .rgc-spine:hover{background:#F15B36;border-color:#F15B36;color:#23140F}
.th-p-retro-gaming-consoles .rgc-spine .rgc-format-no{grid-column:1;align-self:start;color:#B7F1D1}
.th-p-retro-gaming-consoles .rgc-spine:hover .rgc-format-no,.th-p-retro-gaming-consoles .rgc-spine:hover .rgc-arrow{color:#23140F}
.th-p-retro-gaming-consoles .rgc-spine .rgc-format-name{grid-column:1/-1;align-self:end;padding-top:25px;font:800 clamp(1.15rem,1.8vw,1.72rem)/.96 var(--display);letter-spacing:-.045em;text-transform:none}
.th-p-retro-gaming-consoles .rgc-spine .rgc-format-count{grid-column:1;align-self:end;margin-top:11px;color:currentColor;font:500 .59rem/1.2 var(--body);text-align:left;letter-spacing:.05em;text-transform:uppercase}
.th-p-retro-gaming-consoles .rgc-spine .rgc-arrow{grid-column:2;grid-row:1;align-self:start;color:#B7F1D1}
.th-p-retro-gaming-consoles .rgc-pulls{border-top:1px solid rgba(244,238,223,.46)}
.th-p-retro-gaming-consoles .rgc-pull{display:grid;grid-template-columns:36px minmax(0,1fr) auto 20px;align-items:center;gap:13px;min-height:66px;border-bottom:1px solid rgba(244,238,223,.46);color:#F4EEDF;text-decoration:none}
.th-p-retro-gaming-consoles .rgc-pull:hover{color:#B7F1D1}
.th-p-retro-gaming-consoles .rgc-pull-title{min-width:0;overflow-wrap:anywhere;font:700 clamp(.84rem,1.25vw,1rem)/1.2 var(--body);letter-spacing:.025em}
.th-p-retro-gaming-consoles .rgc-pull-price{color:#B7F1D1;font:500 .68rem/1.1 var(--body);text-align:right}
.th-p-retro-gaming-consoles #shop{background:#E7E0D0;padding-top:clamp(62px,9vw,126px)}
.th-p-retro-gaming-consoles #shop .sec-h{align-items:end;padding-bottom:19px;border-bottom:2px solid #17202B}
.th-p-retro-gaming-consoles #shop .sec-h h2{font:800 clamp(2.25rem,5vw,5.2rem)/.86 var(--display);letter-spacing:-.075em}
.th-p-retro-gaming-consoles #shop .chips{gap:7px}
.th-p-retro-gaming-consoles #shop .chip{min-height:44px;border:1px solid #8E887C;border-radius:2px;background:transparent;color:#4D565E;font:700 .64rem/1 var(--body);letter-spacing:.065em;text-transform:uppercase}
.th-p-retro-gaming-consoles #shop .chip:hover,.th-p-retro-gaming-consoles #shop .chip[aria-current="page"]{border-color:#17202B;background:#17202B;color:#F4EEDF}
.th-p-retro-gaming-consoles #shop .grid{gap:12px}
.th-p-retro-gaming-consoles #shop .pc{border:1px solid #17202B;border-radius:10px;background:#F4EEDF;box-shadow:4px 4px 0 #B9B09E}
.th-p-retro-gaming-consoles #shop .pc .im{border-bottom:1px solid #17202B;border-radius:9px 9px 0 0;background:#D8CFBD}
.th-p-retro-gaming-consoles #shop .pc .bd{padding:16px}
.th-p-retro-gaming-consoles #shop .pc h3{font-family:var(--display);font-weight:800;letter-spacing:-.045em}
.th-p-retro-gaming-consoles #shop .pc .pr{color:#B34126;font-family:var(--body);font-weight:700}
.th-p-retro-gaming-consoles #shop .pc .go{border-radius:2px;background:#17202B;color:#F4EEDF;font:700 .62rem/1 var(--body);letter-spacing:.07em;text-transform:uppercase}
.th-p-retro-gaming-consoles .perks{background:#D8CFBD;border-color:#B8B0A0}
.th-p-retro-gaming-consoles .perks .perk{color:#17202B}
.th-p-retro-gaming-consoles .perks .perk svg{color:#F15B36}
.th-p-retro-gaming-consoles .ft{border-top-color:#B8B0A0}
@keyframes retro-gaming-consoles-pan{0%{transform:scale(1.025) translate3d(-.8%,.25%,0)}100%{transform:scale(1.08) translate3d(.85%,-.45%,0)}}
@keyframes retro-gaming-consoles-drift{0%{transform:scale(1.025) translate3d(-.45%,-.25%,0)}100%{transform:scale(1.055) translate3d(.65%,.35%,0)}}
@media (max-width:980px){
  .th-p-retro-gaming-consoles .rgc-stage{grid-template-rows:minmax(150px,.45fr) minmax(365px,1fr);min-height:660px}
  .th-p-retro-gaming-consoles .rgc-screen{grid-column:3/12}
  .th-p-retro-gaming-consoles .rgc-copy-bay{grid-column:1/8}
  .th-p-retro-gaming-consoles .rgc-copy h1{font-size:clamp(3.3rem,8.4vw,5.9rem)}
  .th-p-retro-gaming-consoles .rgc-formats{grid-column:8/13;width:min(100%,265px);padding:12px 12px 0}
  .th-p-retro-gaming-consoles .rgc-discovery-wrap{gap:clamp(32px,6vw,68px)}
}
@media (max-width:700px){
  .th-p-retro-gaming-consoles .hd .nav{display:none}
  .th-p-retro-gaming-consoles .rgc-hero{padding-bottom:20px}
  .th-p-retro-gaming-consoles .rgc-stage{display:flex;flex-direction:column;min-height:0;padding:20px 18px 0}
  .th-p-retro-gaming-consoles .rgc-screen{order:1;min-height:clamp(350px,104vw,480px);margin:0 4px;border-radius:44% 44% 8% 8% / 13% 13% 4% 4%;box-shadow:7px 9px 0 #B9B09E}
  .th-p-retro-gaming-consoles .rgc-screen .theme-empty-media{min-height:clamp(350px,104vw,480px)}
  .th-p-retro-gaming-consoles .rgc-copy-bay{order:2;align-self:stretch;max-width:none;margin-top:-32px;padding:35px 22px 29px;background:#E7E0D0;clip-path:polygon(0 0,calc(100% - 18px) 0,100% 18px,100% 100%,0 100%)}
  .th-p-retro-gaming-consoles .rgc-copy h1{max-width:11ch;font-size:clamp(3rem,13vw,4.9rem);line-height:.86}
  .th-p-retro-gaming-consoles .rgc-copy h1.long{font-size:clamp(2.45rem,10vw,3.85rem)}
  .th-p-retro-gaming-consoles .rgc-copy .sub{margin-top:18px}
  .th-p-retro-gaming-consoles .rgc-ticket{order:3;align-self:flex-end;min-height:auto;margin-top:-19px;writing-mode:horizontal-tb}
  .th-p-retro-gaming-consoles .rgc-formats{order:4;align-self:stretch;width:auto;margin:20px 0 0;box-shadow:5px 6px 0 #F15B36}
  .th-p-retro-gaming-consoles .rgc-hero .motion-toggle{right:24px;bottom:auto;top:clamp(390px,108vw,510px)}
  .th-p-retro-gaming-consoles .rgc-discovery{padding:64px 0}
  .th-p-retro-gaming-consoles .rgc-discovery-wrap{grid-template-columns:1fr;gap:36px}
  .th-p-retro-gaming-consoles .rgc-index-intro h2{max-width:11ch}
}
@media (max-width:430px){
  .th-p-retro-gaming-consoles .hd .wrap{min-height:58px}
  .th-p-retro-gaming-consoles .hd .brand{font-size:.68rem;letter-spacing:.09em}
  .th-p-retro-gaming-consoles .rgc-topline{padding:12px 18px;font-size:.53rem}
  .th-p-retro-gaming-consoles .rgc-topline span:last-child{max-width:49%}
  .th-p-retro-gaming-consoles .rgc-stage{padding-inline:14px}
  .th-p-retro-gaming-consoles .rgc-screen{min-height:350px}
  .th-p-retro-gaming-consoles .rgc-screen .theme-empty-media{min-height:350px}
  .th-p-retro-gaming-consoles .rgc-copy-bay{margin-top:-24px;padding:31px 19px 26px}
  .th-p-retro-gaming-consoles .rgc-copy h1{font-size:clamp(2.7rem,14vw,3.95rem)}
  .th-p-retro-gaming-consoles .rgc-copy .ctas{margin-top:23px}
  .th-p-retro-gaming-consoles .rgc-copy .btn{width:100%;min-height:48px}
  .th-p-retro-gaming-consoles .rgc-ticket{font-size:.54rem}
  .th-p-retro-gaming-consoles .rgc-formats{padding:11px 11px 0}
  .th-p-retro-gaming-consoles .rgc-format-link{grid-template-columns:22px minmax(0,1fr) 15px;gap:6px;min-height:46px}
  .th-p-retro-gaming-consoles .rgc-format-count{display:none}
  .th-p-retro-gaming-consoles .rgc-index-intro h2{font-size:clamp(2.35rem,12vw,3.4rem)}
  .th-p-retro-gaming-consoles .rgc-spines{grid-template-columns:1fr;gap:8px}
  .th-p-retro-gaming-consoles .rgc-spine,.th-p-retro-gaming-consoles .rgc-spine:nth-child(2n){min-height:142px}
  .th-p-retro-gaming-consoles .rgc-pull{grid-template-columns:28px minmax(0,1fr) 18px;gap:8px;min-height:62px}
  .th-p-retro-gaming-consoles .rgc-pull-price{display:none}
  .th-p-retro-gaming-consoles #shop .sec-h{align-items:flex-start;gap:18px}
  .th-p-retro-gaming-consoles #shop .sec-h h2{font-size:clamp(2.15rem,11vw,3.2rem)}
}
@media (prefers-reduced-motion:reduce){
  .th-p-retro-gaming-consoles .rgc-hero.has-hero-motion .rgc-screen .hero-media{animation:none;transform:none}
}
`;

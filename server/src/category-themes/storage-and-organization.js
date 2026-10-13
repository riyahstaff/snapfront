import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-storage-and-organization',
  name: 'STOW / FORM',
  for: 'modular home storage and organization',
  vibe: 'filed, calm, architectural, and quietly practical',
  category: 'Storage and organization',
  group: 'home',
  display: 'Space Grotesk',
  body: 'Manrope',
  displayWeight: 500,
  tracking: '-.055em',
  colors: {
    bg: '#F0F1EA',
    surface: '#E2E4DB',
    ink: '#172724',
    muted: '#64706A',
    line: '#BEC6BA',
    accent: '#718A45',
    onAccent: '#FFFFFF',
    panel: '#24332E',
    onPanel: '#F3F4EC',
    foot: '#17231F',
    onFoot: '#E8E9DF',
    bar: '#E8EAE2',
    onBar: '#172724',
    badge: '#CED8A8',
    onBadge: '#1E3025',
  },
  header: 'stack',
  hero: 'collage',
  card: 'boxed',
  ratio: '4/5',
  rCard: 3,
  rBtn: 0,
  motion: 'pan',
  copy: {
    eyebrow: 'Everyday systems',
    collection: 'The order edit',
    cta: 'Browse the edit',
    title: 'Give every day a place.',
    subtitle: 'Thoughtful storage for the things you reach for, return to, and keep close.',
  },
});

const itemLabel = (count) => `${count} ${count === 1 ? 'item' : 'items'}`;

const categoryImage = (ctx, category) => {
  const source = typeof category?.image === 'string' ? category.image : category?.image?.url;
  return source
    ? `<img src="${ctx.esc(source)}" alt="${ctx.esc(category.name)}" loading="lazy" decoding="async">`
    : '<span class="archive-category-empty" aria-hidden="true"><i></i><i></i><i></i></span>';
};

const productImage = (ctx, product) => product.image_url
  ? `<img src="${ctx.esc(product.image_url)}" alt="${ctx.esc(product.alt_text || product.title)}" loading="lazy" decoding="async">`
  : '<span class="archive-product-empty" aria-hidden="true"><i></i><i></i></span>';

const categoryTabs = (ctx, categories) => {
  if (!categories.length) {
    return '<a class="archive-catalog-all" href="#shop"><span>Open the collection</span><b aria-hidden="true">↗</b></a>';
  }
  return categories.map((category, index) => {
    const count = Number.isFinite(Number(category.count)) ? Number(category.count) : 0;
    return `<a class="archive-catalog-tab" href="${ctx.esc(ctx.categoryLink(category.name))}">
      <span class="archive-tab-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
      <span>${ctx.esc(category.name)}</span>
      <small>${ctx.esc(itemLabel(count))}</small>
    </a>`;
  }).join('');
};

const categoryRows = (ctx, categories) => categories.map((category, index) => {
  const count = Number.isFinite(Number(category.count)) ? Number(category.count) : 0;
  return `<a class="archive-category-row" href="${ctx.esc(ctx.categoryLink(category.name))}">
    <span class="archive-row-index" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
    <span class="archive-row-copy"><small>${ctx.esc(itemLabel(count))} available</small><strong>${ctx.esc(category.name)}</strong></span>
    <span class="archive-row-media">${categoryImage(ctx, category)}</span>
    <span class="archive-row-arrow" aria-hidden="true">↗</span>
  </a>`;
}).join('');

const productRows = (ctx, products) => products.map((product, index) => {
  const hasPrice = Number.isFinite(Number(product.price_cents));
  const price = hasPrice ? `<small>${ctx.esc(ctx.money(Number(product.price_cents), product.currency || 'usd'))}</small>` : '';
  const category = product.category ? `<em>${ctx.esc(product.category)}</em>` : '';
  return `<a class="archive-product-row" href="${ctx.esc(ctx.productLink(product))}">
    <span class="archive-row-index" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
    <span class="archive-product-media">${productImage(ctx, product)}</span>
    <span class="archive-product-copy"><strong>${ctx.esc(product.title)}</strong>${category}${price}</span>
    <span class="archive-row-arrow" aria-hidden="true">↗</span>
  </a>`;
}).join('');

export function hero(ctx) {
  const categories = (ctx.cats || []).filter((category) => category?.name).slice(0, 3);
  return `<section class="hero category-hero archive-hero${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="archive-hero-ruler" aria-hidden="true"><span>01</span><i></i><span>home / held</span><i></i><span>catalogue</span></div>
    <div class="archive-hero-stage">
      <div class="archive-hero-media">${ctx.media(0, { priority: true, lazy: false, decorative: true })}</div>
      <div class="archive-hero-grid" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      <div class="archive-copy-panel">${ctx.copy('archive-copy')}</div>
      <nav class="archive-catalog" aria-label="Browse storage collections">${categoryTabs(ctx, categories)}</nav>
      <p class="archive-hero-note">Make room for what matters.</p>
    </div>
    ${ctx.controls}
  </section>`;
}

export function discovery(ctx) {
  const categories = (ctx.cats || []).filter((category) => category?.name).slice(0, 4);
  const products = (ctx.products || []).filter((product) => product?.title).slice(0, 4);

  if (categories.length >= 2) {
    return `<section class="theme-discovery archive-discovery" aria-labelledby="archive-discovery-title">
      <div class="archive-discovery-intro">
        <p class="archive-kicker">${ctx.esc(ctx.t.copy?.collection || 'The order edit')}</p>
        <h2 id="archive-discovery-title">Start with the space<br>that needs <em>room.</em></h2>
        <p>Choose a shelf, drawer, or corner and build out from there.</p>
        <a class="archive-all-link" href="#shop">View every piece <span aria-hidden="true">→</span></a>
      </div>
      <div class="archive-category-rows">${categoryRows(ctx, categories)}</div>
    </section>`;
  }

  if (products.length) {
    return `<section class="theme-discovery archive-discovery archive-product-discovery" aria-labelledby="archive-discovery-title">
      <div class="archive-discovery-intro">
        <p class="archive-kicker">${ctx.esc(ctx.t.copy?.collection || 'The order edit')}</p>
        <h2 id="archive-discovery-title">A place for the<br>pieces <em>available now.</em></h2>
        <p>A focused view of the storage solutions ready to explore.</p>
        <a class="archive-all-link" href="#shop">View every piece <span aria-hidden="true">→</span></a>
      </div>
      <div class="archive-product-rows">${productRows(ctx, products)}</div>
    </section>`;
  }

  return '';
}

export const css = `
.th-p-storage-and-organization{background:var(--bg);color:var(--ink)}
.th-p-storage-and-organization .hd{background:var(--bar);border-bottom:1px solid var(--line);box-shadow:none}
.th-p-storage-and-organization .hd .wrap{min-height:72px}
.th-p-storage-and-organization .hd .brand{font-family:var(--display);font-size:clamp(18px,1.7vw,25px);font-weight:500;letter-spacing:-.055em}
.th-p-storage-and-organization .hd .nav a{font:600 10px/1 var(--body);letter-spacing:.1em;text-transform:uppercase}
.th-p-storage-and-organization .hd .cart{min-height:40px;border:1px solid var(--ink);border-radius:0;background:var(--ink);color:var(--bg)}
.th-p-storage-and-organization .archive-hero{position:relative;overflow:hidden;padding:clamp(17px,2.2vw,30px) clamp(18px,4.2vw,72px) clamp(28px,3.5vw,54px);background:var(--bg);color:var(--ink);isolation:isolate}
.th-p-storage-and-organization .archive-hero::before{position:absolute;z-index:-1;inset:0;background:repeating-linear-gradient(90deg,transparent 0 calc(8.333% - 1px),#bec6ba36 calc(8.333% - 1px) 8.333%);content:'';pointer-events:none}
.th-p-storage-and-organization .archive-hero-ruler{display:flex;align-items:center;gap:11px;min-height:26px;margin:0 0 12px;color:var(--muted);font:700 9px/1 var(--body);letter-spacing:.18em;text-transform:uppercase}
.th-p-storage-and-organization .archive-hero-ruler i{display:block;flex:1;height:1px;background:var(--line)}
.th-p-storage-and-organization .archive-hero-stage{position:relative;display:grid;grid-template-columns:repeat(12,minmax(0,1fr));grid-template-rows:minmax(204px,1fr) auto;min-height:clamp(530px,55vw,720px);overflow:hidden;background:var(--panel)}
.th-p-storage-and-organization .archive-hero-media{position:absolute;inset:0;overflow:hidden;background:#304038}
.th-p-storage-and-organization .archive-hero-media::after{position:absolute;inset:0;background:linear-gradient(90deg,rgba(20,34,29,.22) 0%,rgba(20,34,29,.07) 43%,rgba(20,34,29,.26) 100%),linear-gradient(0deg,rgba(20,32,28,.6) 0%,transparent 38%);content:'';pointer-events:none}
.th-p-storage-and-organization .archive-hero-media .hero-media{display:block;width:100%;height:100%;max-width:none;object-fit:cover;object-position:center;transform:scale(1.001)}
.th-p-storage-and-organization .archive-hero-media .theme-empty-media{height:100%;min-height:0;background:linear-gradient(90deg,#25362f 0 13%,#49604d 13% 14%,#25362f 14% 32%,#6c8264 32% 33%,#25362f 33% 60%,#49604d 60% 61%,#25362f 61% 100%);color:#edf0e6}
.th-p-storage-and-organization .archive-hero-grid{position:absolute;z-index:1;inset:0;display:grid;grid-template-columns:repeat(4,1fr);pointer-events:none}
.th-p-storage-and-organization .archive-hero-grid i{border-right:1px solid rgba(240,241,234,.35)}
.th-p-storage-and-organization .archive-hero-grid i:first-child{border-left:1px solid rgba(240,241,234,.35)}
.th-p-storage-and-organization .archive-copy-panel{z-index:2;grid-column:2 / span 6;grid-row:1;align-self:start;min-width:0;margin-top:clamp(30px,5vw,78px);padding:clamp(27px,3.6vw,61px) clamp(24px,3.7vw,64px) clamp(24px,3.1vw,50px);background:rgba(240,241,234,.96);box-shadow:12px 12px 0 rgba(23,39,36,.18)}
.th-p-storage-and-organization .archive-copy .eyebrow{margin:0 0 17px;color:var(--accent);font:700 10px/1.15 var(--body);letter-spacing:.22em;text-transform:uppercase}
.th-p-storage-and-organization .archive-copy h1{max-width:10ch;margin:0;color:var(--ink);font:500 clamp(3.1rem,6.2vw,6.6rem)/.87 var(--display);letter-spacing:var(--dt);text-wrap:balance;overflow-wrap:anywhere}
.th-p-storage-and-organization .archive-copy h1.long{max-width:12.5ch;font-size:clamp(2.55rem,4.75vw,5.2rem);line-height:.92}
.th-p-storage-and-organization .archive-copy .sub{max-width:40ch;margin:22px 0 0;color:#405049;font:500 clamp(.89rem,1.2vw,1.08rem)/1.55 var(--body)}
.th-p-storage-and-organization .archive-copy .ctas{display:flex;flex-wrap:wrap;gap:9px;margin-top:27px}
.th-p-storage-and-organization .archive-copy .btn{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 18px;border:1px solid var(--ink);border-radius:0;background:var(--ink);color:var(--bg);font:700 10px/1 var(--body);letter-spacing:.12em;text-align:center;text-decoration:none;text-transform:uppercase}
.th-p-storage-and-organization .archive-copy .btn:hover{border-color:var(--accent);background:var(--accent);color:var(--onAccent)}
.th-p-storage-and-organization .archive-copy .btn.ghost{background:transparent;color:var(--ink)}
.th-p-storage-and-organization .archive-copy .btn.ghost:hover{background:var(--ink);color:var(--bg)}
.th-p-storage-and-organization .archive-catalog{z-index:2;grid-column:8 / -1;grid-row:2;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));align-self:end;min-width:0;border-top:1px solid rgba(240,241,234,.72);border-left:1px solid rgba(240,241,234,.72);background:rgba(23,39,36,.88)}
.th-p-storage-and-organization .archive-catalog-tab,.th-p-storage-and-organization .archive-catalog-all{display:grid;min-width:0;min-height:131px;align-content:center;gap:7px;padding:18px 15px;border-right:1px solid rgba(240,241,234,.55);color:#f4f5ed;text-decoration:none}
.th-p-storage-and-organization .archive-catalog-tab:hover,.th-p-storage-and-organization .archive-catalog-all:hover{background:#eef0e8;color:var(--ink)}
.th-p-storage-and-organization .archive-tab-number{color:#d3dfa7;font:700 9px/1 var(--body);letter-spacing:.16em}
.th-p-storage-and-organization .archive-catalog-tab>span:nth-child(2){font:500 clamp(1rem,1.45vw,1.38rem)/.98 var(--display);letter-spacing:-.04em;overflow-wrap:anywhere}
.th-p-storage-and-organization .archive-catalog-tab small{color:#d7ded5;font:600 9px/1.25 var(--body);letter-spacing:.08em;text-transform:uppercase}
.th-p-storage-and-organization .archive-catalog-tab:hover .archive-tab-number,.th-p-storage-and-organization .archive-catalog-tab:hover small{color:#53684a}
.th-p-storage-and-organization .archive-catalog-all{grid-column:1 / -1;grid-template-columns:minmax(0,1fr) auto;align-items:center;min-height:74px;font:500 clamp(1rem,1.55vw,1.35rem)/1 var(--display);letter-spacing:-.04em}
.th-p-storage-and-organization .archive-catalog-all b{font:400 20px/1 var(--display)}
.th-p-storage-and-organization .archive-hero-note{z-index:2;grid-column:1 / span 3;grid-row:2;align-self:end;margin:0;padding:20px;color:#f1f2ea;font:700 9px/1.4 var(--body);letter-spacing:.17em;text-transform:uppercase}
.th-p-storage-and-organization .archive-hero .motion-toggle{position:absolute;z-index:4;right:clamp(32px,5vw,86px);bottom:clamp(45px,7vw,95px);min-height:44px;padding:0 12px;border:1px solid rgba(240,241,234,.72);border-radius:0;background:rgba(23,39,36,.86);color:#f4f5ed;font:700 9px/1 var(--body);letter-spacing:.11em;text-transform:uppercase}
.th-p-storage-and-organization .archive-hero .motion-toggle:hover{border-color:#edf0e8;background:#edf0e8;color:var(--ink)}
.th-p-storage-and-organization .archive-hero.has-hero-motion .archive-hero-media .hero-media{animation:storage-and-organization-pan 20s ease-in-out infinite alternate}
.th-p-storage-and-organization .archive-hero.has-hero-motion.is-motion-paused .archive-hero-media .hero-media{animation-play-state:paused}
@keyframes storage-and-organization-pan{0%{transform:scale(1.025) translate3d(-.45%,.15%,0)}100%{transform:scale(1.095) translate3d(.7%,-.55%,0)}}
.th-p-storage-and-organization .archive-discovery{display:grid;grid-template-columns:minmax(250px,.38fr) minmax(0,.62fr);gap:clamp(30px,5vw,82px);padding:clamp(54px,8vw,112px) clamp(20px,5.4vw,96px);border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:var(--bg)}
.th-p-storage-and-organization .archive-discovery-intro{min-width:0;padding-left:clamp(0px,1vw,18px)}
.th-p-storage-and-organization .archive-kicker{margin:0 0 18px;color:var(--accent);font:700 10px/1.2 var(--body);letter-spacing:.21em;text-transform:uppercase}
.th-p-storage-and-organization .archive-discovery-intro h2{max-width:11ch;margin:0;color:var(--ink);font:500 clamp(2.55rem,4.5vw,5.1rem)/.9 var(--display);letter-spacing:var(--dt);text-wrap:balance;overflow-wrap:anywhere}
.th-p-storage-and-organization .archive-discovery-intro h2 em{color:#5d744c;font-style:normal}
.th-p-storage-and-organization .archive-discovery-intro>p:not(.archive-kicker){max-width:31ch;margin:24px 0 26px;color:var(--muted);font:500 14px/1.55 var(--body)}
.th-p-storage-and-organization .archive-all-link{display:inline-flex;align-items:center;gap:11px;min-height:44px;border-bottom:1px solid var(--ink);color:var(--ink);font:700 10px/1 var(--body);letter-spacing:.12em;text-decoration:none;text-transform:uppercase}
.th-p-storage-and-organization .archive-all-link span{font-size:17px;line-height:0}
.th-p-storage-and-organization .archive-category-rows,.th-p-storage-and-organization .archive-product-rows{border-top:1px solid var(--line)}
.th-p-storage-and-organization .archive-category-row{display:grid;grid-template-columns:42px minmax(0,1fr) minmax(118px,26%) 42px;align-items:stretch;min-height:132px;border-bottom:1px solid var(--line);color:var(--ink);text-decoration:none}
.th-p-storage-and-organization .archive-category-row:hover{background:#e2e6d7}
.th-p-storage-and-organization .archive-row-index{display:grid;place-items:center;border-right:1px solid var(--line);color:#6b824b;font:700 10px/1 var(--body);letter-spacing:.12em}
.th-p-storage-and-organization .archive-row-copy{display:flex;min-width:0;flex-direction:column;justify-content:center;gap:6px;padding:20px clamp(15px,2.2vw,32px)}
.th-p-storage-and-organization .archive-row-copy small{color:var(--muted);font:700 9px/1.2 var(--body);letter-spacing:.12em;text-transform:uppercase}
.th-p-storage-and-organization .archive-row-copy strong{font:500 clamp(1.5rem,2.7vw,2.65rem)/.95 var(--display);letter-spacing:-.05em;overflow-wrap:anywhere}
.th-p-storage-and-organization .archive-row-media{position:relative;display:block;overflow:hidden;border-left:1px solid var(--line);background:#cdd3c6}
.th-p-storage-and-organization .archive-row-media img{display:block;width:100%;height:100%;object-fit:cover}
.th-p-storage-and-organization .archive-category-empty{display:flex;width:100%;height:100%;align-items:center;justify-content:center;gap:7px;background:repeating-linear-gradient(135deg,#c6cdbc 0 2px,#e5e7df 2px 9px)}
.th-p-storage-and-organization .archive-category-empty i{display:block;width:15px;height:15px;border:1px solid #718a45;transform:rotate(45deg)}
.th-p-storage-and-organization .archive-category-empty i:nth-child(2){width:25px;height:25px;background:#718a4554}
.th-p-storage-and-organization .archive-row-arrow{display:grid;place-items:center;color:#52694a;font:400 20px/1 var(--display)}
.th-p-storage-and-organization .archive-product-row{display:grid;grid-template-columns:42px minmax(105px,22%) minmax(0,1fr) 42px;align-items:stretch;min-height:128px;border-bottom:1px solid var(--line);color:var(--ink);text-decoration:none}
.th-p-storage-and-organization .archive-product-row:hover{background:#e2e6d7}
.th-p-storage-and-organization .archive-product-media{position:relative;display:block;overflow:hidden;background:#cdd3c6}
.th-p-storage-and-organization .archive-product-media img{display:block;width:100%;height:100%;object-fit:cover}
.th-p-storage-and-organization .archive-product-empty{display:flex;width:100%;height:100%;align-items:center;justify-content:center;gap:6px;background:linear-gradient(135deg,#bdc7b6,#e4e7dc)}
.th-p-storage-and-organization .archive-product-empty i{display:block;width:18px;height:18px;border:1px solid #597048}
.th-p-storage-and-organization .archive-product-empty i:nth-child(2){width:30px;height:30px;background:#718a4550}
.th-p-storage-and-organization .archive-product-copy{display:flex;min-width:0;flex-direction:column;justify-content:center;gap:5px;padding:17px clamp(15px,2.2vw,32px)}
.th-p-storage-and-organization .archive-product-copy strong{font:500 clamp(1.3rem,2.2vw,2.15rem)/1 var(--display);letter-spacing:-.045em;overflow-wrap:anywhere}
.th-p-storage-and-organization .archive-product-copy em{color:var(--muted);font:700 9px/1.2 var(--body);letter-spacing:.12em;text-transform:uppercase}
.th-p-storage-and-organization .archive-product-copy small{color:#5e754b;font:700 13px/1.2 var(--body)}
.th-p-storage-and-organization #shop{padding-top:clamp(54px,7vw,104px);padding-bottom:clamp(64px,8vw,116px);background:linear-gradient(180deg,#24332e 0 123px,var(--bg) 123px)}
.th-p-storage-and-organization #shop .sec-h{align-items:end;margin-bottom:clamp(24px,3vw,45px)}
.th-p-storage-and-organization #shop .sec-h h2{max-width:12ch;color:#f0f1ea;font-family:var(--display);font-size:clamp(2.6rem,4.2vw,4.8rem);font-weight:500;letter-spacing:var(--dt);line-height:.9}
.th-p-storage-and-organization #shop .chips{justify-content:flex-end;gap:8px}
.th-p-storage-and-organization #shop .chip{min-height:44px;border:1px solid #aebbad;background:transparent;border-radius:0;color:#f0f1ea;font:700 10px/1 var(--body);letter-spacing:.08em}
.th-p-storage-and-organization #shop .chip.on,.th-p-storage-and-organization #shop .chip:hover{border-color:#ced8a8;background:#ced8a8;color:#1e3025}
.th-p-storage-and-organization #shop .grid{gap:clamp(18px,2.3vw,30px) clamp(12px,1.6vw,22px)}
.th-p-storage-and-organization #shop .pc{overflow:hidden;border:1px solid var(--line);border-radius:0;background:#f9faf4;box-shadow:none}
.th-p-storage-and-organization #shop .pc .im{position:relative;overflow:hidden;background:#d9ded2}
.th-p-storage-and-organization #shop .pc .im img{display:block;transition:transform .3s ease}
.th-p-storage-and-organization #shop .pc:hover .im img{transform:scale(1.035)}
.th-p-storage-and-organization #shop .pc .bd{padding:16px 16px 19px}
.th-p-storage-and-organization #shop .pc h3{font-family:var(--display);font-size:clamp(1.25rem,1.9vw,1.75rem);font-weight:500;letter-spacing:-.04em;line-height:1}
.th-p-storage-and-organization #shop .pc .pr{color:#587047;font:700 13px/1.2 var(--body)}
.th-p-storage-and-organization #shop .pc .tag{top:10px;left:10px;border-radius:0;background:#24332e;color:#f0f1ea;font:700 9px/1 var(--body);letter-spacing:.1em;text-transform:uppercase}
.th-p-storage-and-organization #shop .pc .go{right:10px;bottom:10px;border-radius:0;background:#ced8a8;color:#1e3025}
.th-p-storage-and-organization .feat{background:#dce2d4}
.th-p-storage-and-organization .feat .pic{position:relative;overflow:hidden;border:1px solid var(--line)}
.th-p-storage-and-organization .feat .txt h2,.th-p-storage-and-organization .story .txt h2{font-family:var(--display);font-weight:500;letter-spacing:var(--dt)}
.th-p-storage-and-organization .ft{background:var(--foot);color:var(--onFoot)}
.th-p-storage-and-organization .ft a{color:var(--onFoot)}
.th-p-storage-and-organization .archive-copy .btn:focus-visible,.th-p-storage-and-organization .archive-catalog a:focus-visible,.th-p-storage-and-organization .archive-all-link:focus-visible,.th-p-storage-and-organization .archive-category-row:focus-visible,.th-p-storage-and-organization .archive-product-row:focus-visible{outline:3px solid var(--accent);outline-offset:4px}
@media (max-width:900px){
  .th-p-storage-and-organization .archive-copy-panel{grid-column:2 / span 7}
  .th-p-storage-and-organization .archive-catalog{grid-column:7 / -1}
  .th-p-storage-and-organization .archive-hero-note{grid-column:1 / span 2}
  .th-p-storage-and-organization .archive-discovery{grid-template-columns:minmax(218px,.34fr) minmax(0,.66fr);gap:34px;padding-right:28px;padding-left:28px}
  .th-p-storage-and-organization #shop{background:linear-gradient(180deg,#24332e 0 108px,var(--bg) 108px)}
}
@media (max-width:680px){
  .th-p-storage-and-organization .hd .wrap{min-height:64px}
  .th-p-storage-and-organization .archive-hero{padding:14px 16px 28px}
  .th-p-storage-and-organization .archive-hero-ruler{gap:7px;margin-bottom:9px;font-size:8px;letter-spacing:.12em}
  .th-p-storage-and-organization .archive-hero-ruler span:nth-of-type(2){white-space:nowrap}
  .th-p-storage-and-organization .archive-hero-stage{display:flex;min-height:0;flex-direction:column;overflow:visible;background:transparent}
  .th-p-storage-and-organization .archive-hero-media{position:relative;min-height:340px;overflow:hidden;background:#304038}
  .th-p-storage-and-organization .archive-hero-media .hero-media{position:absolute;inset:0;object-position:59% center}
  .th-p-storage-and-organization .archive-hero-grid{top:0;bottom:auto;height:340px}
  .th-p-storage-and-organization .archive-copy-panel{order:2;width:calc(100% - 24px);margin:-42px 0 0 12px;padding:29px 23px 25px;box-shadow:8px 8px 0 rgba(23,39,36,.16)}
  .th-p-storage-and-organization .archive-copy h1{max-width:11ch;font-size:clamp(2.95rem,12.6vw,4.75rem)}
  .th-p-storage-and-organization .archive-copy h1.long{max-width:13ch;font-size:clamp(2.45rem,10.2vw,3.85rem)}
  .th-p-storage-and-organization .archive-copy .sub{margin-top:17px;font-size:14px}
  .th-p-storage-and-organization .archive-copy .ctas{margin-top:23px}
  .th-p-storage-and-organization .archive-copy .btn{flex:1 1 145px;padding-right:12px;padding-left:12px}
  .th-p-storage-and-organization .archive-catalog{order:3;grid-template-columns:repeat(3,minmax(0,1fr));width:100%;margin-top:17px}
  .th-p-storage-and-organization .archive-catalog-tab{min-height:112px;padding:15px 9px}
  .th-p-storage-and-organization .archive-catalog-tab>span:nth-child(2){font-size:clamp(.89rem,4.1vw,1.1rem)}
  .th-p-storage-and-organization .archive-catalog-tab small{font-size:8px;letter-spacing:.04em}
  .th-p-storage-and-organization .archive-catalog-all{min-height:54px;padding:13px}
  .th-p-storage-and-organization .archive-hero-note{order:4;margin:0;padding:18px 0 0;color:var(--muted)}
  .th-p-storage-and-organization .archive-hero .motion-toggle{right:28px;bottom:auto;top:286px}
  .th-p-storage-and-organization .archive-discovery{display:block;padding:56px 20px 62px}
  .th-p-storage-and-organization .archive-discovery-intro{padding-bottom:34px}
  .th-p-storage-and-organization .archive-discovery-intro h2{max-width:12ch;font-size:clamp(2.5rem,11.5vw,4rem)}
  .th-p-storage-and-organization .archive-category-row{grid-template-columns:34px minmax(0,1fr) 96px 34px;min-height:114px}
  .th-p-storage-and-organization .archive-row-copy{padding:15px 11px}
  .th-p-storage-and-organization .archive-row-copy strong{font-size:clamp(1.35rem,6.8vw,2rem)}
  .th-p-storage-and-organization .archive-row-copy small{font-size:8px;letter-spacing:.07em}
  .th-p-storage-and-organization .archive-product-row{grid-template-columns:34px 94px minmax(0,1fr) 34px;min-height:112px}
  .th-p-storage-and-organization .archive-product-copy{padding:14px 11px}
  .th-p-storage-and-organization .archive-product-copy strong{font-size:clamp(1.2rem,6vw,1.72rem)}
  .th-p-storage-and-organization #shop{padding-top:61px;background:linear-gradient(180deg,#24332e 0 77px,var(--bg) 77px)}
  .th-p-storage-and-organization #shop .sec-h{margin-bottom:27px}
  .th-p-storage-and-organization #shop .sec-h h2{font-size:clamp(2.45rem,11vw,3.8rem)}
  .th-p-storage-and-organization #shop .chips{justify-content:flex-start;gap:7px}
  .th-p-storage-and-organization #shop .chip{padding-inline:12px}
}
@media (max-width:430px){
  .th-p-storage-and-organization .archive-hero{padding-right:12px;padding-left:12px}
  .th-p-storage-and-organization .archive-hero-ruler span:last-child{display:none}
  .th-p-storage-and-organization .archive-hero-media{min-height:310px}
  .th-p-storage-and-organization .archive-hero-grid{height:310px}
  .th-p-storage-and-organization .archive-copy-panel{width:calc(100% - 16px);margin-top:-34px;margin-left:8px;padding:26px 18px 22px}
  .th-p-storage-and-organization .archive-copy h1{font-size:clamp(2.7rem,12.7vw,3.7rem)}
  .th-p-storage-and-organization .archive-copy h1.long{font-size:clamp(2.25rem,10.7vw,3.25rem)}
  .th-p-storage-and-organization .archive-catalog-tab{min-height:103px;padding-right:7px;padding-left:7px}
  .th-p-storage-and-organization .archive-catalog-tab small{display:none}
  .th-p-storage-and-organization .archive-hero .motion-toggle{top:258px;right:20px}
  .th-p-storage-and-organization .archive-discovery{padding-right:16px;padding-left:16px}
  .th-p-storage-and-organization .archive-category-row{grid-template-columns:31px minmax(0,1fr) 82px 31px;min-height:104px}
  .th-p-storage-and-organization .archive-product-row{grid-template-columns:31px 82px minmax(0,1fr) 31px;min-height:104px}
  .th-p-storage-and-organization .archive-row-copy{padding-right:8px;padding-left:9px}
  .th-p-storage-and-organization .archive-product-copy{padding-right:8px;padding-left:9px}
}
@media (prefers-reduced-motion:reduce){
  .th-p-storage-and-organization .archive-hero.has-hero-motion .archive-hero-media .hero-media{animation:none;transform:scale(1.001)}
  .th-p-storage-and-organization #shop .pc .im img{transition:none}
}
`;

import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-rugs',
  name: 'Tessera Rug House',
  for: 'artful rugs and floor textiles',
  vibe: 'sunlit color fields, gallery-catalog calm, and tactile floor studies',
  category: 'Artisan rugs and floor textiles',
  group: 'home',
  display: 'DM Serif Display',
  body: 'Manrope',
  displayWeight: 400,
  tracking: '-.045em',
  colors: {
    bg: '#F3EFE7',
    surface: '#E5DDD1',
    ink: '#24313A',
    muted: '#6E716B',
    line: '#CFC4B5',
    accent: '#B74F34',
    onAccent: '#FFF8EF',
    panel: '#24313A',
    onPanel: '#F3EFE7',
    foot: '#24313A',
    onFoot: '#F3EFE7',
    bar: '#E7DED0',
    onBar: '#24313A',
    badge: '#D9A286',
    onBadge: '#24313A',
  },
  header: 'stack',
  hero: 'collage',
  card: 'boxed',
  ratio: '4/5',
  rCard: 0,
  rBtn: 2,
  motion: 'pan',
  copy: {
    eyebrow: 'The floor edit',
    collection: 'Pattern index',
    cta: 'Explore rugs',
    title: 'A room begins at the ground.',
    subtitle: 'Color, line, and softness for the places you keep coming back to.',
  },
});

const imageForCategory = (ctx, category) => {
  const source = typeof category?.image === 'string' ? category.image : category?.image?.url;
  return source
    ? `<img src="${ctx.esc(source)}" alt="" loading="lazy" decoding="async">`
    : '<span class="rugs-archive-weave" aria-hidden="true"></span>';
};

const categoryCount = (category) => {
  const count = Number(category?.count);
  return Number.isFinite(count) ? Math.max(0, count) : 0;
};

export function hero(ctx) {
  return `<section class="hero category-hero rugs-hero${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="rugs-hero-field">
      <div class="rugs-field-rule rugs-field-rule-a" aria-hidden="true"></div>
      <div class="rugs-field-rule rugs-field-rule-b" aria-hidden="true"></div>
      <p class="rugs-side-label" aria-hidden="true"><span>Floor studies</span><i></i><span>01</span></p>
      <div class="rugs-sun-chip" aria-hidden="true"><span></span></div>
      <div class="rugs-hero-image">
        ${ctx.media(0, { priority: true, lazy: false })}
        <span class="rugs-image-corner rugs-image-corner-a" aria-hidden="true"></span>
        <span class="rugs-image-corner rugs-image-corner-b" aria-hidden="true"></span>
        <p class="rugs-image-note" aria-hidden="true">Made for the<br>room around it</p>
      </div>
      <div class="rugs-copy-plinth">
        ${ctx.copy('rugs-copy')}
      </div>
      <div class="rugs-thread-swatch" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
    </div>
    ${ctx.controls}
  </section>`;
}

export function discovery(ctx) {
  const products = Array.isArray(ctx.products) ? ctx.products : [];
  const categories = (Array.isArray(ctx.cats) ? ctx.cats : []).filter((category) => category?.name);

  if (!products.length) return '';

  if (categories.length >= 2) {
    const shown = categories.slice(0, 4);
    return `<section class="theme-discovery rugs-index" aria-labelledby="rugs-index-title">
      <div class="rugs-index-head">
        <p class="rugs-section-label">${ctx.esc(ctx.t.copy?.collection || 'Pattern index')}</p>
        <h2 id="rugs-index-title">Follow the shape<br>of the room.</h2>
        <p>Browse the pieces currently gathered in each collection.</p>
        <a class="rugs-all-link" href="#shop">See every piece <span aria-hidden="true">→</span></a>
      </div>
      <div class="rugs-index-list" role="list">
        ${shown.map((category, index) => {
          const count = categoryCount(category);
          const number = String(index + 1).padStart(2, '0');
          const countLabel = `${count} ${count === 1 ? 'piece' : 'pieces'}`;
          return `<a class="rugs-index-card rugs-index-card-${index + 1}" href="${ctx.esc(ctx.categoryLink(category.name))}" role="listitem" aria-label="Browse ${ctx.esc(category.name)}">
            <span class="rugs-index-no">${number}</span>
            <span class="rugs-index-media">${imageForCategory(ctx, category)}</span>
            <span class="rugs-index-copy"><b>${ctx.esc(category.name)}</b><small>${ctx.esc(countLabel)}</small></span>
            <span class="rugs-index-arrow" aria-hidden="true">↗</span>
          </a>`;
        }).join('')}
      </div>
    </section>`;
  }

  const featured = products.slice(0, 2);
  return `<section class="theme-discovery rugs-available" aria-labelledby="rugs-available-title">
    <div class="rugs-available-copy">
      <p class="rugs-section-label">Available now</p>
      <h2 id="rugs-available-title">Start with a<br>grounding piece.</h2>
      <a class="rugs-all-link" href="#shop">See every piece <span aria-hidden="true">→</span></a>
    </div>
    <div class="rugs-available-products">${featured.map((product) => ctx.productCard(product)).join('')}</div>
  </section>`;
}

export const css = `
.th-p-rugs{background:var(--bg);color:var(--ink)}
.th-p-rugs .store-header,.th-p-rugs .site-header,.th-p-rugs .hd{background:var(--bar);border-color:var(--line)}
.th-p-rugs .store-header a,.th-p-rugs .site-header a,.th-p-rugs .hd a{color:var(--onBar)}
.th-p-rugs .brand{font-family:var(--display);font-weight:400;letter-spacing:.02em}
.th-p-rugs .rugs-hero{position:relative;min-width:0;margin:0;overflow:hidden;background:var(--bg);border-bottom:1px solid var(--line)}
.th-p-rugs .rugs-hero-field{position:relative;display:grid;grid-template-columns:clamp(22px,4.4vw,70px) minmax(0,1fr) clamp(42px,6vw,98px);grid-template-rows:minmax(390px,1fr) minmax(220px,.48fr);min-height:clamp(650px,76vh,820px);padding:clamp(16px,2.5vw,34px);overflow:hidden;background:linear-gradient(112deg,#e8ded0 0%,#f3efe7 56%,#e9dfd1 100%)}
.th-p-rugs .rugs-field-rule{position:absolute;z-index:0;display:block;pointer-events:none;border-color:#24313a22;border-style:solid}
.th-p-rugs .rugs-field-rule-a{top:0;right:clamp(35px,6vw,102px);bottom:0;width:16%;border-width:0 0 0 1px}
.th-p-rugs .rugs-field-rule-b{top:clamp(34px,6vw,86px);right:0;left:0;height:20%;border-width:1px 0 0}
.th-p-rugs .rugs-side-label{position:relative;z-index:3;display:flex;grid-column:1;grid-row:1 / -1;align-items:center;justify-content:space-between;gap:12px;margin:0;color:var(--muted);font:700 9px/1 var(--body);letter-spacing:.19em;text-transform:uppercase;writing-mode:vertical-rl}
.th-p-rugs .rugs-side-label i{display:block;flex:1;width:1px;background:var(--line)}
.th-p-rugs .rugs-sun-chip{position:absolute;z-index:2;top:clamp(20px,3.7vw,58px);left:clamp(42px,8.4vw,138px);display:grid;place-items:center;width:clamp(42px,5vw,74px);aspect-ratio:1;border-radius:50%;background:var(--accent);box-shadow:0 0 0 9px #f3efe799}
.th-p-rugs .rugs-sun-chip span{display:block;width:34%;aspect-ratio:1;border-radius:50%;border:1px solid #fff2}
.th-p-rugs .rugs-hero-image{position:relative;z-index:1;grid-column:2 / 4;grid-row:1 / -1;min-width:0;min-height:0;margin:0 0 0 clamp(18px,3vw,52px);overflow:hidden;background:#b9ad9d;box-shadow:0 18px 44px #24313a1f}
.th-p-rugs .rugs-hero-image .hero-media,.th-p-rugs .rugs-hero-image .theme-empty-media{display:block;width:100%;height:100%;object-fit:cover;object-position:center}
.th-p-rugs .rugs-hero-image .theme-empty-media{background:linear-gradient(140deg,#ae9783 0 29%,#e6d3bc 29% 53%,#26323a 53% 70%,#b64d35 70%);color:#f8f3eb}
.th-p-rugs .rugs-image-corner{position:absolute;z-index:1;display:block;width:clamp(44px,7vw,112px);height:clamp(44px,7vw,112px);pointer-events:none}
.th-p-rugs .rugs-image-corner-a{top:0;right:0;border-top:clamp(6px,1vw,14px) solid var(--accent);border-right:clamp(6px,1vw,14px) solid var(--accent)}
.th-p-rugs .rugs-image-corner-b{bottom:0;left:0;border-bottom:clamp(6px,1vw,14px) solid var(--panel);border-left:clamp(6px,1vw,14px) solid var(--panel)}
.th-p-rugs .rugs-image-note{position:absolute;right:clamp(17px,2.4vw,38px);bottom:clamp(17px,2.4vw,38px);z-index:2;margin:0;padding:9px 11px;background:#f3efe7e8;color:var(--ink);font:700 9px/1.25 var(--body);letter-spacing:.13em;text-align:right;text-transform:uppercase}
.th-p-rugs .rugs-copy-plinth{position:relative;z-index:4;display:grid;grid-column:2;grid-row:2;align-self:end;min-width:0;margin:0 clamp(-2px,2vw,32px) clamp(6px,1.5vw,24px) 0;padding:clamp(26px,4vw,62px) clamp(24px,4.3vw,70px);background:var(--panel);color:var(--onPanel);box-shadow:15px 15px 0 var(--accent)}
.th-p-rugs .rugs-copy{min-width:0;max-width:720px}
.th-p-rugs .rugs-copy .eyebrow{margin:0 0 15px;color:#d9a286;font:700 10px/1.2 var(--body);letter-spacing:.2em;text-transform:uppercase}
.th-p-rugs .rugs-copy h1{max-width:13ch;margin:0;color:inherit;font:400 clamp(3rem,6.6vw,7.3rem)/.85 var(--display);letter-spacing:var(--tracking);overflow-wrap:anywhere;text-wrap:balance}
.th-p-rugs .rugs-copy h1.long{max-width:15ch;font-size:clamp(2.55rem,5.15vw,5.65rem);line-height:.91}
.th-p-rugs .rugs-copy .sub{max-width:42ch;margin:22px 0 0;color:#f3efe7d9;font:500 clamp(.9rem,1.1vw,1.05rem)/1.55 var(--body);overflow-wrap:anywhere}
.th-p-rugs .rugs-copy .ctas{display:flex;flex-wrap:wrap;gap:9px;margin-top:27px}
.th-p-rugs .rugs-copy .btn{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 20px;border:1px solid #f3efe7;background:#f3efe7;color:var(--ink);border-radius:2px;font:700 10px/1 var(--body);letter-spacing:.11em;text-decoration:none;text-transform:uppercase}
.th-p-rugs .rugs-copy .btn:hover{background:var(--accent);border-color:var(--accent);color:var(--onAccent)}
.th-p-rugs .rugs-copy .btn.ghost{background:transparent;color:var(--onPanel)}
.th-p-rugs .rugs-copy .btn.ghost:hover{background:#f3efe726;border-color:#f3efe766;color:var(--onPanel)}
.th-p-rugs .rugs-thread-swatch{position:relative;z-index:4;display:grid;grid-column:3;grid-row:2;align-self:end;justify-self:end;gap:5px;width:clamp(34px,4.5vw,64px);padding:8px;background:var(--bg);box-shadow:0 0 0 1px var(--line)}
.th-p-rugs .rugs-thread-swatch span{display:block;height:4px;background:#b74f34}
.th-p-rugs .rugs-thread-swatch span:nth-child(2){background:#d9a286}
.th-p-rugs .rugs-thread-swatch span:nth-child(3){background:#24313a}
.th-p-rugs .rugs-thread-swatch span:nth-child(4){background:#b8aea0}
.th-p-rugs .rugs-hero .motion-toggle{position:absolute;z-index:6;top:clamp(24px,3.4vw,52px);right:clamp(24px,4.5vw,72px);min-height:44px;padding:0 12px;border:1px solid #f3efe7aa;border-radius:2px;background:#24313ad9;color:#f3efe7;font:700 9px/1 var(--body);letter-spacing:.1em;text-transform:uppercase}
.th-p-rugs .rugs-hero.has-hero-motion .rugs-hero-image .hero-media{animation:rugs-hero-pan 16s ease-in-out infinite alternate}
.th-p-rugs .rugs-index{display:grid;grid-template-columns:minmax(250px,.78fr) minmax(0,1.22fr);gap:clamp(28px,5vw,82px);padding:clamp(62px,8vw,122px) clamp(22px,6vw,100px);background:var(--bg);border-bottom:1px solid var(--line)}
.th-p-rugs .rugs-index-head{min-width:0;padding-top:12px}
.th-p-rugs .rugs-section-label{margin:0 0 20px;color:var(--accent);font:700 10px/1.2 var(--body);letter-spacing:.18em;text-transform:uppercase}
.th-p-rugs .rugs-index-head h2,.th-p-rugs .rugs-available-copy h2{max-width:10ch;margin:0;color:var(--ink);font:400 clamp(2.8rem,4.8vw,5.4rem)/.88 var(--display);letter-spacing:var(--tracking);overflow-wrap:anywhere}
.th-p-rugs .rugs-index-head>p:not(.rugs-section-label){max-width:31ch;margin:24px 0 0;color:var(--muted);font:500 14px/1.55 var(--body)}
.th-p-rugs .rugs-all-link{display:inline-flex;align-items:center;gap:11px;min-height:44px;margin-top:30px;border-bottom:1px solid var(--ink);color:var(--ink);font:700 10px/1 var(--body);letter-spacing:.1em;text-decoration:none;text-transform:uppercase}
.th-p-rugs .rugs-all-link span{font-size:18px;font-weight:400}
.th-p-rugs .rugs-index-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-self:start;border-top:1px solid var(--line);border-left:1px solid var(--line)}
.th-p-rugs .rugs-index-card{display:grid;grid-template-columns:auto minmax(0,1fr) auto;grid-template-rows:auto 1fr;gap:13px;min-width:0;min-height:clamp(188px,20vw,274px);padding:16px;border-right:1px solid var(--line);border-bottom:1px solid var(--line);background:var(--surface);color:var(--ink);text-decoration:none}
.th-p-rugs .rugs-index-card:nth-child(2),.th-p-rugs .rugs-index-card:nth-child(3){background:#eee5d9}
.th-p-rugs .rugs-index-card:nth-child(3) .rugs-index-media{order:3;grid-column:1 / -1;grid-row:1;background:#cda084}
.th-p-rugs .rugs-index-card:nth-child(4) .rugs-index-media{background:#a9b4ae}
.th-p-rugs .rugs-index-no{color:var(--muted);font:700 9px/1 var(--body);letter-spacing:.12em}
.th-p-rugs .rugs-index-arrow{align-self:start;color:var(--accent);font:400 20px/1 var(--display)}
.th-p-rugs .rugs-index-media{position:relative;grid-column:1 / -1;grid-row:2;min-height:116px;overflow:hidden;background:#d8c7b4}
.th-p-rugs .rugs-index-media img{display:block;width:100%;height:100%;object-fit:cover}
.th-p-rugs .rugs-archive-weave{position:absolute;inset:0;display:block;background:repeating-linear-gradient(135deg,#b75036 0 3px,#e7d6bf 3px 8px,#27333a 8px 10px,#d39a7d 10px 14px)}
.th-p-rugs .rugs-index-card:nth-child(2) .rugs-archive-weave{background:repeating-linear-gradient(45deg,#d8b189 0 4px,#f2e8db 4px 8px,#576a68 8px 10px)}
.th-p-rugs .rugs-index-card:nth-child(3) .rugs-archive-weave{background:repeating-linear-gradient(90deg,#f0e5d2 0 3px,#bd654a 3px 5px,#27333a 5px 9px)}
.th-p-rugs .rugs-index-card:nth-child(4) .rugs-archive-weave{background:repeating-linear-gradient(135deg,#85958e 0 3px,#e7e0d3 3px 7px,#b64d35 7px 10px)}
.th-p-rugs .rugs-index-copy{display:grid;align-content:start;gap:5px;min-width:0}
.th-p-rugs .rugs-index-copy b{overflow-wrap:anywhere;font:400 clamp(1.35rem,1.85vw,2rem)/.95 var(--display);letter-spacing:-.035em}
.th-p-rugs .rugs-index-copy small{color:var(--muted);font:700 9px/1.25 var(--body);letter-spacing:.11em;text-transform:uppercase}
.th-p-rugs .rugs-index-card:hover{background:var(--panel);color:var(--onPanel)}
.th-p-rugs .rugs-index-card:hover .rugs-index-no,.th-p-rugs .rugs-index-card:hover .rugs-index-copy small{color:#d9a286}
.th-p-rugs .rugs-available{display:grid;grid-template-columns:minmax(220px,.7fr) minmax(0,1.3fr);gap:clamp(28px,6vw,90px);align-items:end;padding:clamp(54px,8vw,108px) clamp(22px,6vw,100px);border-bottom:1px solid var(--line);background:#e9dfd1}
.th-p-rugs .rugs-available-copy{min-width:0}
.th-p-rugs .rugs-available-products{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;min-width:0}
.th-p-rugs .rugs-available-products .product-card,.th-p-rugs .rugs-available-products .pc{min-width:0;background:transparent;border:0;border-radius:0}
.th-p-rugs .rugs-available-products .product-card img,.th-p-rugs .rugs-available-products .pc img{aspect-ratio:4/5;object-fit:cover}
.th-p-rugs #shop{padding-top:clamp(56px,7vw,106px);background:var(--bg)}
.th-p-rugs #shop .sec-h,.th-p-rugs #shop .section-header{align-items:end;padding-bottom:20px;border-bottom:1px solid var(--line)}
.th-p-rugs #shop .sec-h h2,.th-p-rugs #shop .section-title,.th-p-rugs #shop h2{font-family:var(--display);font-weight:400;letter-spacing:var(--tracking)}
.th-p-rugs #shop .chips{gap:0;border-top:1px solid var(--line);border-left:1px solid var(--line)}
.th-p-rugs #shop .chip{min-height:44px;border:0;border-right:1px solid var(--line);border-bottom:1px solid var(--line);border-radius:0;background:var(--surface);color:var(--ink);font:700 10px/1 var(--body);letter-spacing:.08em;text-transform:uppercase}
.th-p-rugs #shop .chip[aria-current],.th-p-rugs #shop .chip:hover{background:var(--accent);color:var(--onAccent)}
.th-p-rugs #shop .grid{gap:clamp(28px,4vw,60px) clamp(14px,2vw,30px)}
.th-p-rugs #shop .product-card,.th-p-rugs #shop .pc{border-radius:0}
.th-p-rugs #shop .product-card img,.th-p-rugs #shop .pc img{border-radius:0;aspect-ratio:4/5;object-fit:cover}
.th-p-rugs #shop .product-card h3,.th-p-rugs #shop .pc h3{font-family:var(--display);font-weight:400;letter-spacing:-.025em}
.th-p-rugs .rugs-copy .btn:focus-visible,.th-p-rugs .rugs-index-card:focus-visible,.th-p-rugs .rugs-all-link:focus-visible{outline:3px solid var(--accent);outline-offset:4px}
@keyframes rugs-hero-pan{from{transform:scale(1)}to{transform:scale(1.055)}}
@media (max-width:880px){
.th-p-rugs .rugs-hero-field{grid-template-columns:46px minmax(0,1fr) 50px;grid-template-rows:minmax(390px,1fr) 240px;min-height:650px}
.th-p-rugs .rugs-copy-plinth{margin-right:0;padding:34px 38px}
.th-p-rugs .rugs-copy h1{font-size:clamp(3.3rem,8.6vw,5.5rem)}
.th-p-rugs .rugs-index{grid-template-columns:minmax(210px,.65fr) minmax(0,1.35fr);gap:32px;padding-right:30px;padding-left:30px}
.th-p-rugs .rugs-index-card{min-height:210px;padding:13px}
.th-p-rugs .rugs-available{gap:35px;padding-right:30px;padding-left:30px}
}
@media (max-width:640px){
.th-p-rugs .rugs-hero-field{display:grid;grid-template-columns:30px minmax(0,1fr) 24px;grid-template-rows:minmax(380px,62vw) auto;min-height:0;padding:13px 13px 0}
.th-p-rugs .rugs-field-rule-a{right:24px;width:24%}
.th-p-rugs .rugs-field-rule-b{top:46%;height:16%}
.th-p-rugs .rugs-side-label{grid-row:1;font-size:8px;letter-spacing:.13em}
.th-p-rugs .rugs-side-label span:last-child{display:none}
.th-p-rugs .rugs-sun-chip{top:21px;left:48px;width:42px;box-shadow:0 0 0 6px #f3efe7bb}
.th-p-rugs .rugs-hero-image{grid-column:2 / 4;grid-row:1;margin-left:9px;min-height:380px}
.th-p-rugs .rugs-hero-image .hero-media{object-position:58% center}
.th-p-rugs .rugs-image-note{right:12px;bottom:12px;font-size:8px}
.th-p-rugs .rugs-copy-plinth{grid-column:1 / -1;grid-row:2;margin:-36px 16px 0 0;padding:28px 22px 24px;box-shadow:10px 10px 0 var(--accent)}
.th-p-rugs .rugs-copy .eyebrow{margin-bottom:12px;font-size:9px}
.th-p-rugs .rugs-copy h1{max-width:12ch;font-size:clamp(2.9rem,13vw,4.6rem)}
.th-p-rugs .rugs-copy h1.long{max-width:13ch;font-size:clamp(2.35rem,10.5vw,3.75rem)}
.th-p-rugs .rugs-copy .sub{margin-top:16px;font-size:.89rem}
.th-p-rugs .rugs-copy .ctas{margin-top:22px}
.th-p-rugs .rugs-copy .btn{flex:1 1 142px;padding-right:12px;padding-left:12px}
.th-p-rugs .rugs-thread-swatch{display:none}
.th-p-rugs .rugs-hero .motion-toggle{top:24px;right:24px}
.th-p-rugs .rugs-index{display:block;padding:55px 20px 62px}
.th-p-rugs .rugs-index-head{padding-top:0}
.th-p-rugs .rugs-index-head h2,.th-p-rugs .rugs-available-copy h2{font-size:clamp(2.7rem,12vw,4rem)}
.th-p-rugs .rugs-index-head>p:not(.rugs-section-label){margin-top:17px}
.th-p-rugs .rugs-all-link{margin-top:23px}
.th-p-rugs .rugs-index-list{margin-top:36px;grid-template-columns:1fr}
.th-p-rugs .rugs-index-card{grid-template-columns:auto minmax(0,1fr) 17px;grid-template-rows:auto minmax(96px,1fr);min-height:174px;padding:12px}
.th-p-rugs .rugs-index-card:nth-child(3) .rugs-index-media{order:initial;grid-column:1 / -1;grid-row:2}
.th-p-rugs .rugs-index-media{min-height:102px}
.th-p-rugs .rugs-index-copy{grid-column:2;grid-row:1}
.th-p-rugs .rugs-index-arrow{grid-column:3;grid-row:1}
.th-p-rugs .rugs-index-copy b{font-size:1.55rem}
.th-p-rugs .rugs-available{display:block;padding:54px 20px 62px}
.th-p-rugs .rugs-available-products{gap:12px;margin-top:36px}
.th-p-rugs #shop .sec-h,.th-p-rugs #shop .section-header{align-items:start;flex-direction:column}
.th-p-rugs #shop .chips{width:100%;overflow-x:auto;flex-wrap:nowrap;scrollbar-width:none}
.th-p-rugs #shop .chip{flex:0 0 auto;min-height:44px}
}
@media (max-width:390px){
.th-p-rugs .rugs-hero-field{grid-template-columns:24px minmax(0,1fr) 18px}
.th-p-rugs .rugs-hero-image{min-height:350px}
.th-p-rugs .rugs-copy-plinth{margin-right:10px;padding:24px 18px 21px}
.th-p-rugs .rugs-copy h1{font-size:clamp(2.65rem,12.5vw,3.6rem)}
.th-p-rugs .rugs-copy h1.long{font-size:clamp(2.1rem,10vw,3rem)}
.th-p-rugs .rugs-index-card{min-height:160px}
.th-p-rugs .rugs-index-media{min-height:88px}
.th-p-rugs .rugs-available-products{grid-template-columns:1fr}
}
@media (prefers-reduced-motion:reduce){
.th-p-rugs .rugs-hero.has-hero-motion .rugs-hero-image .hero-media{animation:none;transform:none}
}
`;

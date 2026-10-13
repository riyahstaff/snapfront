import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-bedding',
  name: 'Aube Linen House',
  for: 'restful bedding and bath textiles',
  vibe: 'warm, tactile, quietly restorative',
  category: 'Bedding and bath textiles',
  group: 'home',
  display: 'Newsreader',
  body: 'DM Sans',
  displayWeight: 500,
  tracking: '-.045em',
  colors: {
    bg: '#F4F1EA',
    surface: '#E9E2D5',
    ink: '#211A14',
    muted: '#756D60',
    line: '#D4CCBF',
    accent: '#4C573F',
    onAccent: '#FFFFFF',
    panel: '#35251B',
    onPanel: '#F8F4ED',
    foot: '#211A14',
    onFoot: '#F4F1EA',
    bar: '#ECE5D9',
    onBar: '#211A14',
    badge: '#D6CAB4',
    onBadge: '#211A14',
  },
  header: 'split',
  hero: 'editorial',
  card: 'minimal',
  ratio: '4/5',
  rCard: 0,
  rBtn: 0,
  motion: 'pan',
  copy: {
    eyebrow: 'Rest lives here',
    collection: 'The bedroom edit',
    cta: 'Build your bed',
    title: 'The quiet art of turning in.',
    subtitle: 'A softer rhythm for every room.',
  },
});

const categoryImage = (ctx, category) => {
  const image = typeof category?.image === 'string' ? category.image : category?.image?.url;
  return image
    ? `<div class="bed-category-media"><img src="${ctx.esc(image)}" alt="${ctx.esc(category.name)}" loading="lazy" decoding="async"></div>`
    : `<div class="bed-category-media bed-category-placeholder" aria-hidden="true"><span></span></div>`;
};

const categoryRail = (ctx, categories) => {
  if (!categories.length) {
    return `<a class="bed-rail-all" href="#shop"><span>Explore the collection</span><b aria-hidden="true">↗</b></a>`;
  }
  return categories.map((category) => {
    const count = Number.isFinite(Number(category.count)) ? Number(category.count) : 0;
    return `<a class="bed-rail-card" href="${ctx.esc(ctx.categoryLink(category.name))}"><span class="bed-rail-weave" aria-hidden="true"></span><span class="bed-rail-name">${ctx.esc(category.name)}</span><span class="bed-rail-count">${ctx.esc(String(count))} ${count === 1 ? 'item' : 'items'}</span><b aria-hidden="true">→</b></a>`;
  }).join('');
};

export function hero(ctx) {
  const categories = (ctx.cats || []).filter((category) => category?.name).slice(0, 3);
  return `<section class="hero category-hero bed-hero${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="bed-stage">
      <div class="bed-hero-media">${ctx.media(0, { priority: true, lazy: false })}</div>
      <div class="bed-hero-veil" aria-hidden="true"></div>
      ${ctx.copy('bed-copy')}
    </div>
    <aside class="bed-rail" aria-label="Browse collections">
      <div class="bed-rail-intro"><p>Choose<br>your collection</p><span aria-hidden="true">01—03</span></div>
      <div class="bed-rail-list">${categoryRail(ctx, categories)}</div>
      <p class="bed-rail-signoff">Thoughtfully made<br>for the everyday.</p>
    </aside>
    ${ctx.controls}
  </section>`;
}

export function discovery(ctx) {
  const categories = (ctx.cats || []).filter((category) => category?.name).slice(0, 3);
  const products = (ctx.products || []).slice(0, 3);

  if (categories.length >= 2) {
    const steps = categories.map((category, index) => {
      const count = Number.isFinite(Number(category.count)) ? Number(category.count) : 0;
      return `<a class="bed-step" href="${ctx.esc(ctx.categoryLink(category.name))}">
        <div class="bed-step-top"><span class="bed-step-number">${String(index + 1).padStart(2, '0')}</span><span class="bed-step-arrow" aria-hidden="true">→</span></div>
        <div class="bed-step-copy"><h2>${ctx.esc(category.name)}</h2><p>${ctx.esc(String(count))} ${count === 1 ? 'item' : 'items'} to explore.</p></div>
        ${categoryImage(ctx, category)}
      </a>`;
    }).join('');
    return `<section class="theme-discovery bed-discovery" aria-labelledby="bed-discovery-title">
      <div class="bed-discovery-intro"><p class="bed-kicker">The Aube room edit</p><h2 id="bed-discovery-title">Create a room<br>that feels like <em>you.</em></h2><p>Begin with the pieces that invite you to slow down.</p><a class="bed-text-link" href="#shop">Shop all pieces <span aria-hidden="true">→</span></a></div>
      <div class="bed-steps">${steps}</div>
    </section>`;
  }

  if (products.length) {
    return `<section class="theme-discovery bed-discovery bed-product-discovery" aria-labelledby="bed-discovery-title">
      <div class="bed-discovery-intro"><p class="bed-kicker">The Aube room edit</p><h2 id="bed-discovery-title">A quiet beginning<br>for the <em>everyday.</em></h2><p>A considered selection from the pieces available now.</p><a class="bed-text-link" href="#shop">Shop all pieces <span aria-hidden="true">→</span></a></div>
      <div class="bed-product-notes">${products.map((product) => ctx.productCard(product)).join('')}</div>
    </section>`;
  }

  return '';
}

export const css = `
.th-p-bedding{background:var(--bg);color:var(--ink)}
.th-p-bedding .store-header,.th-p-bedding .site-header{background:var(--bar);border-color:var(--line)}
.th-p-bedding .store-header a,.th-p-bedding .site-header a{color:var(--onBar)}
.th-p-bedding .bed-hero{position:relative;display:grid;grid-template-columns:minmax(0,1fr) 238px;min-height:clamp(570px,72vh,780px);margin:0;background:var(--panel);overflow:hidden}
.th-p-bedding .bed-stage{position:relative;display:grid;min-width:0;overflow:hidden}
.th-p-bedding .bed-hero-media{position:absolute;inset:0;overflow:hidden;background:#30251f}
.th-p-bedding .bed-hero-media .hero-media{display:block;width:100%;height:100%;object-fit:cover;object-position:64% center}
.th-p-bedding .bed-hero-media .theme-empty-media{height:100%;min-height:100%;background:linear-gradient(128deg,#584838 0%,#30251f 54%,#77705d 100%);color:#f5efe4}
.th-p-bedding .bed-hero-veil{position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,rgba(29,21,16,.88) 0%,rgba(29,21,16,.62) 35%,rgba(29,21,16,.1) 72%,rgba(29,21,16,.02) 100%)}
.th-p-bedding .bed-copy{position:relative;z-index:1;align-self:center;width:min(650px,76%);padding:clamp(48px,7vw,120px) clamp(32px,5.2vw,92px);color:#faf6ef}
.th-p-bedding .bed-copy .eyebrow{margin:0 0 23px;color:#e4d9ca;font:600 10px/1.2 var(--body);letter-spacing:.24em;text-transform:uppercase}
.th-p-bedding .bed-copy h1{max-width:10ch;margin:0;color:inherit;font:500 clamp(3.2rem,6vw,6.8rem)/.9 var(--display);letter-spacing:var(--tracking);overflow-wrap:anywhere}
.th-p-bedding .bed-copy h1.long{max-width:13ch;font-size:clamp(2.85rem,5.1vw,5.6rem)}
.th-p-bedding .bed-copy .sub{max-width:29ch;margin:27px 0 0;color:#eee7dc;font:400 clamp(1rem,1.25vw,1.18rem)/1.45 var(--display)}
.th-p-bedding .bed-copy .ctas{display:flex;flex-wrap:wrap;gap:10px;margin-top:34px}
.th-p-bedding .bed-copy .btn{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 24px;border:1px solid #f5efe4;background:#f5efe4;color:#292019;font:600 11px/1 var(--body);letter-spacing:.08em;text-transform:uppercase;text-decoration:none}
.th-p-bedding .bed-copy .btn:hover{border-color:#d6cab4;background:#d6cab4;color:#211a14}
.th-p-bedding .bed-copy .btn.ghost{background:transparent;color:#f5efe4}
.th-p-bedding .bed-copy .btn.ghost:hover{background:#f5efe4;color:#292019}
.th-p-bedding .bed-rail{display:flex;min-width:0;flex-direction:column;padding:30px 23px 26px;background:#f6f3ed;color:#28211c}
.th-p-bedding .bed-rail-intro{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:0 0 20px}
.th-p-bedding .bed-rail-intro p{margin:0;font:500 clamp(1.45rem,2vw,2rem)/.94 var(--display);letter-spacing:-.045em}
.th-p-bedding .bed-rail-intro span{padding-top:5px;color:var(--muted);font:600 9px/1 var(--body);letter-spacing:.12em}
.th-p-bedding .bed-rail-list{display:grid;gap:12px}
.th-p-bedding .bed-rail-card,.th-p-bedding .bed-rail-all{position:relative;display:grid;grid-template-columns:50px minmax(0,1fr) auto;align-items:center;column-gap:11px;min-height:69px;padding:0 0 12px;border-bottom:1px solid var(--line);color:inherit;text-decoration:none}
.th-p-bedding .bed-rail-card b,.th-p-bedding .bed-rail-all b{font:400 18px/1 var(--display)}
.th-p-bedding .bed-rail-weave{grid-row:span 2;display:block;width:50px;aspect-ratio:1.25;background:repeating-linear-gradient(115deg,#d1c7b8 0 2px,#e8e2d9 2px 5px,#b9b09f 5px 6px);box-shadow:inset 0 0 0 1px #bcb3a5}
.th-p-bedding .bed-rail-card:nth-child(2) .bed-rail-weave{background:repeating-linear-gradient(115deg,#aaa18f 0 2px,#d0c8b9 2px 5px,#776f5f 5px 6px)}
.th-p-bedding .bed-rail-card:nth-child(3) .bed-rail-weave{background:repeating-linear-gradient(115deg,#59614a 0 2px,#8b9274 2px 5px,#3e4634 5px 6px)}
.th-p-bedding .bed-rail-name{align-self:end;overflow-wrap:anywhere;font:500 15px/1.1 var(--display)}
.th-p-bedding .bed-rail-count{align-self:start;color:var(--muted);font:500 9px/1.2 var(--body);letter-spacing:.08em;text-transform:uppercase}
.th-p-bedding .bed-rail-all{grid-template-columns:minmax(0,1fr) auto;min-height:80px;font:500 15px/1.15 var(--display)}
.th-p-bedding .bed-rail-signoff{margin:auto 0 0;padding-top:25px;color:#83796d;font:600 9px/1.45 var(--body);letter-spacing:.22em;text-transform:uppercase}
.th-p-bedding .bed-hero .motion-toggle{position:absolute;z-index:3;right:calc(238px + 24px);bottom:24px;min-height:44px;padding:0 12px;border:1px solid #ffffff66;background:#211a14d9;color:#f8f4ed;font:600 9px/1 var(--body);letter-spacing:.1em;text-transform:uppercase}
.th-p-bedding .bed-discovery{display:grid;grid-template-columns:minmax(250px,.28fr) minmax(0,.72fr);gap:0;padding:34px clamp(24px,4vw,72px) 42px;background:var(--bg);border-bottom:1px solid var(--line)}
.th-p-bedding .bed-discovery-intro{padding:9px clamp(24px,4vw,60px) 25px 0}
.th-p-bedding .bed-kicker{margin:0 0 19px;color:var(--muted);font:600 9px/1.2 var(--body);letter-spacing:.22em;text-transform:uppercase}
.th-p-bedding .bed-discovery-intro h2{margin:0;color:var(--ink);font:500 clamp(2.25rem,3.3vw,4.1rem)/.93 var(--display);letter-spacing:-.055em}
.th-p-bedding .bed-discovery-intro h2 em{font-style:italic}
.th-p-bedding .bed-discovery-intro>p:not(.bed-kicker){max-width:23ch;margin:24px 0 24px;color:var(--muted);font:400 1rem/1.45 var(--body)}
.th-p-bedding .bed-text-link{display:inline-flex;align-items:center;gap:10px;min-height:44px;border-bottom:1px solid var(--ink);color:var(--ink);font:600 10px/1 var(--body);letter-spacing:.12em;text-decoration:none;text-transform:uppercase}
.th-p-bedding .bed-text-link span{font-size:17px;line-height:0}
.th-p-bedding .bed-steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-left:1px solid var(--line)}
.th-p-bedding .bed-step{display:grid;grid-template-rows:auto auto 1fr;min-width:0;padding:0 20px 0 28px;border-right:1px solid var(--line);color:inherit;text-decoration:none}
.th-p-bedding .bed-step-top{display:flex;align-items:center;justify-content:space-between;min-height:40px}
.th-p-bedding .bed-step-number{font:500 24px/1 var(--display);letter-spacing:-.04em}
.th-p-bedding .bed-step-arrow{font:400 21px/1 var(--display)}
.th-p-bedding .bed-step-copy{min-height:94px;padding:9px 0 15px}
.th-p-bedding .bed-step-copy h2{margin:0;color:var(--ink);font:500 clamp(1.35rem,1.65vw,2rem)/1 var(--display);letter-spacing:-.04em;overflow-wrap:anywhere}
.th-p-bedding .bed-step-copy p{margin:8px 0 0;color:var(--muted);font:400 12px/1.35 var(--body)}
.th-p-bedding .bed-category-media{position:relative;min-height:150px;overflow:hidden;background:#ddd5c8}
.th-p-bedding .bed-category-media img{display:block;width:100%;height:100%;object-fit:cover}
.th-p-bedding .bed-category-placeholder{background:repeating-linear-gradient(135deg,#d8d0c3 0 3px,#eee9e0 3px 7px)}
.th-p-bedding .bed-category-placeholder span{position:absolute;inset:19% 10%;border:1px solid #afa79866}
.th-p-bedding .bed-product-discovery{align-items:start}
.th-p-bedding .bed-product-notes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;padding-left:26px}
.th-p-bedding .bed-product-notes .product-card{min-width:0;background:transparent;border:0}
.th-p-bedding .bed-product-notes .product-card img{aspect-ratio:4/5;object-fit:cover}
.th-p-bedding #shop{padding-top:clamp(38px,5vw,76px)}
.th-p-bedding #shop .section-title,.th-p-bedding #shop h2{font-family:var(--display);font-weight:500;letter-spacing:-.045em}
.th-p-bedding #shop .product-card{border-radius:0}
.th-p-bedding #shop .product-card img{border-radius:0}
.th-p-bedding .bed-copy .btn:focus-visible,.th-p-bedding .bed-rail a:focus-visible,.th-p-bedding .bed-step:focus-visible,.th-p-bedding .bed-text-link:focus-visible{outline:3px solid var(--accent);outline-offset:4px}
@media (max-width:900px){
  .th-p-bedding .bed-hero{grid-template-columns:minmax(0,1fr) 206px}
  .th-p-bedding .bed-copy{width:min(680px,88%);padding-left:clamp(28px,5vw,56px)}
  .th-p-bedding .bed-copy h1{font-size:clamp(3rem,7.2vw,5.6rem)}
  .th-p-bedding .bed-hero .motion-toggle{right:calc(206px + 18px)}
  .th-p-bedding .bed-rail{padding-right:17px;padding-left:17px}
  .th-p-bedding .bed-rail-card{grid-template-columns:43px minmax(0,1fr) auto;column-gap:8px}
  .th-p-bedding .bed-rail-weave{width:43px}
  .th-p-bedding .bed-discovery{grid-template-columns:minmax(210px,.3fr) minmax(0,.7fr);padding-right:28px;padding-left:28px}
  .th-p-bedding .bed-discovery-intro{padding-right:28px}
  .th-p-bedding .bed-step{padding-right:13px;padding-left:17px}
}
@media (max-width:680px){
  .th-p-bedding .bed-hero{display:flex;min-height:auto;flex-direction:column}
  .th-p-bedding .bed-stage{min-height:560px}
  .th-p-bedding .bed-hero-media .hero-media{object-position:66% center}
  .th-p-bedding .bed-hero-veil{background:linear-gradient(90deg,rgba(29,21,16,.78) 0%,rgba(29,21,16,.38) 100%),linear-gradient(0deg,rgba(29,21,16,.52) 0%,rgba(29,21,16,0) 60%)}
  .th-p-bedding .bed-copy{align-self:end;width:100%;padding:68px 24px 30px}
  .th-p-bedding .bed-copy h1{max-width:11ch;font-size:clamp(3rem,13vw,4.8rem)}
  .th-p-bedding .bed-copy h1.long{font-size:clamp(2.6rem,11vw,4rem)}
  .th-p-bedding .bed-copy .sub{margin-top:18px}
  .th-p-bedding .bed-copy .ctas{margin-top:24px}
  .th-p-bedding .bed-copy .btn{flex:1 1 152px;padding-right:16px;padding-left:16px}
  .th-p-bedding .bed-rail{display:block;padding:20px 24px 23px}
  .th-p-bedding .bed-rail-intro{padding-bottom:15px}
  .th-p-bedding .bed-rail-intro p{font-size:1.7rem}
  .th-p-bedding .bed-rail-list{grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
  .th-p-bedding .bed-rail-card{display:grid;grid-template-columns:1fr auto;grid-template-rows:auto auto;min-height:110px;padding-bottom:10px}
  .th-p-bedding .bed-rail-weave{grid-column:1 / -1;grid-row:auto;width:100%;height:43px;aspect-ratio:auto}
  .th-p-bedding .bed-rail-name{align-self:end;font-size:14px}
  .th-p-bedding .bed-rail-count{display:none}
  .th-p-bedding .bed-rail-card b{align-self:end;font-size:16px}
  .th-p-bedding .bed-rail-all{grid-template-columns:minmax(0,1fr) auto;min-height:44px}
  .th-p-bedding .bed-rail-signoff{display:none}
  .th-p-bedding .bed-hero .motion-toggle{right:16px;bottom:calc(100% - 541px)}
  .th-p-bedding .bed-discovery{display:block;padding:34px 24px 32px}
  .th-p-bedding .bed-discovery-intro{padding:0 0 27px}
  .th-p-bedding .bed-discovery-intro>p:not(.bed-kicker){max-width:29ch}
  .th-p-bedding .bed-steps{grid-template-columns:1fr;border-top:1px solid var(--line);border-left:0}
  .th-p-bedding .bed-step{grid-template-columns:42px minmax(0,1fr) 92px;grid-template-rows:auto;align-items:center;gap:13px;min-height:116px;padding:13px 0;border-bottom:1px solid var(--line);border-right:0}
  .th-p-bedding .bed-step-top{display:contents}
  .th-p-bedding .bed-step-number{grid-column:1;grid-row:1;font-size:20px}
  .th-p-bedding .bed-step-arrow{grid-column:2;grid-row:1;justify-self:end}
  .th-p-bedding .bed-step-copy{grid-column:2;grid-row:1;min-height:0;padding:0 22px 0 0}
  .th-p-bedding .bed-step-copy h2{font-size:1.5rem}
  .th-p-bedding .bed-step-copy p{margin-top:5px;font-size:11px}
  .th-p-bedding .bed-category-media{grid-column:3;grid-row:1;min-height:88px}
  .th-p-bedding .bed-product-notes{grid-template-columns:repeat(2,minmax(0,1fr));gap:13px;padding-left:0}
}
@media (max-width:430px){
  .th-p-bedding .bed-stage{min-height:540px}
  .th-p-bedding .bed-copy{padding-right:20px;padding-left:20px}
  .th-p-bedding .bed-rail{padding-right:20px;padding-left:20px}
  .th-p-bedding .bed-rail-list{gap:8px}
  .th-p-bedding .bed-rail-card{min-height:104px}
  .th-p-bedding .bed-rail-name{font-size:13px}
  .th-p-bedding .bed-hero .motion-toggle{bottom:calc(100% - 521px)}
  .th-p-bedding .bed-discovery{padding-right:20px;padding-left:20px}
  .th-p-bedding .bed-step{grid-template-columns:31px minmax(0,1fr) 78px;gap:9px}
  .th-p-bedding .bed-step-copy{padding-right:10px}
  .th-p-bedding .bed-category-media{min-height:76px}
}
`;

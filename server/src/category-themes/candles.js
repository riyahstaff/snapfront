import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-candles',
  name: 'Nocturne Wax House',
  for: 'artisanal candles and after-dark home fragrance',
  vibe: 'ink-blue rooms, oxblood wax, amber glass, and the quiet geometry of flame',
  category: 'Artisanal candles and home fragrance',
  group: 'home',
  display: 'Bodoni Moda',
  body: 'Manrope',
  displayWeight: 500,
  tracking: '-.055em',
  colors: {
    bg: '#F1E9DE',
    surface: '#FFF9F1',
    ink: '#172534',
    muted: '#6E6A64',
    line: '#D6C8B7',
    accent: '#9B3C34',
    onAccent: '#FFF8F0',
    panel: '#102130',
    onPanel: '#FFF6EB',
    foot: '#102130',
    onFoot: '#F4E9DA',
    bar: '#FAF3E8',
    onBar: '#172534',
    badge: '#E5B968',
    onBadge: '#172534',
  },
  header: 'center',
  hero: 'editorial',
  card: 'boxed',
  ratio: '4/5',
  rCard: 2,
  rBtn: 999,
  motion: 'pan',
  copy: {
    eyebrow: 'The afterlight edit',
    collection: 'The candle cabinet',
    cta: 'Browse the cabinet',
    title: 'Light, arranged slowly.',
    subtitle: 'A study in glow, shadow, and the rituals that gather around them.',
  },
});

const selectedCategories = (ctx) => (ctx.cats || [])
  .filter((category) => category?.name)
  .slice(0, 4);

const categoryImage = (ctx, category) => {
  const image = typeof category?.image === 'string' ? category.image : category?.image?.url;
  return image
    ? `<div class="candle-chapter-image"><img src="${ctx.esc(image)}" alt="${ctx.esc(category.name)}" loading="lazy" decoding="async"></div>`
    : `<div class="candle-chapter-image candle-chapter-blank" aria-hidden="true"><i></i><b></b></div>`;
};

const itemCount = (category) => {
  const count = Number(category?.count);
  return Number.isFinite(count) ? Math.max(0, count) : 0;
};

const chapterNav = (ctx, categories) => {
  if (!categories.length) {
    return `<a class="candle-chapter-link candle-chapter-all" href="#shop"><span class="candle-chapter-num">01</span><span>Available pieces</span><b aria-hidden="true">↗</b></a>`;
  }

  return categories.map((category, index) => {
    const count = itemCount(category);
    const href = ctx.esc(ctx.categoryLink(category.name));
    return `<a class="candle-chapter-link" href="${href}"><span class="candle-chapter-num">${String(index + 1).padStart(2, '0')}</span><span>${ctx.esc(category.name)}</span><em>${ctx.esc(String(count))}</em></a>`;
  }).join('');
};

export function hero(ctx) {
  const categories = selectedCategories(ctx);
  return `<section class="hero category-hero candle-hero${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="candle-hero-shell">
      <aside class="candle-spine" aria-label="Collection introduction">
        <p>Volume<br>one</p>
        <span aria-hidden="true">NWH / 01</span>
        <i aria-hidden="true"></i>
      </aside>
      <figure class="candle-hero-image">
        ${ctx.media(0, { priority: true, lazy: false, decorative: true })}
        <figcaption><span aria-hidden="true"></span>Keep the hour.</figcaption>
      </figure>
      <div class="candle-copy-panel">
        <div class="candle-copy-mark" aria-hidden="true"><i></i><span>after<br>dark</span></div>
        ${ctx.copy('candle-copy')}
      </div>
      <nav class="candle-chapters" aria-label="Browse candle collections">
        <div class="candle-chapters-head"><p>Open by chapter</p><span>Index</span></div>
        <div class="candle-chapters-list">${chapterNav(ctx, categories)}</div>
      </nav>
    </div>
    ${ctx.controls}
  </section>`;
}

export function discovery(ctx) {
  const categories = selectedCategories(ctx);
  const products = (ctx.products || []).slice(0, 3);

  if (categories.length >= 2) {
    const chapters = categories.map((category, index) => {
      const count = itemCount(category);
      const href = ctx.esc(ctx.categoryLink(category.name));
      return `<a class="candle-chapter-card" href="${href}">
        <div class="candle-chapter-top"><span>${String(index + 1).padStart(2, '0')}</span><b aria-hidden="true">↗</b></div>
        ${categoryImage(ctx, category)}
        <div class="candle-chapter-details"><p>${ctx.esc(String(count))} ${count === 1 ? 'piece' : 'pieces'}</p><h3>${ctx.esc(category.name)}</h3><span>Open chapter</span></div>
      </a>`;
    }).join('');

    return `<section class="theme-discovery candle-discovery" aria-labelledby="candle-discovery-title">
      <div class="candle-discovery-intro">
        <p class="candle-kicker">The flame index</p>
        <h2 id="candle-discovery-title">Find the <em>light</em><br>that fits the moment.</h2>
        <p>Explore the collection in chapters, then stay a while with the pieces that call you back.</p>
        <a class="candle-all-link" href="#shop">View all available pieces <span aria-hidden="true">→</span></a>
      </div>
      <div class="candle-chapter-grid">${chapters}</div>
    </section>`;
  }

  if (products.length) {
    return `<section class="theme-discovery candle-product-edit" aria-labelledby="candle-product-edit-title">
      <div class="candle-discovery-intro">
        <p class="candle-kicker">The current burn</p>
        <h2 id="candle-product-edit-title">A few lights<br>to begin with.</h2>
        <p>Take a closer look at the pieces available in this collection now.</p>
        <a class="candle-all-link" href="#shop">View all available pieces <span aria-hidden="true">→</span></a>
      </div>
      <div class="candle-product-notes">${products.map((product) => ctx.productCard(product)).join('')}</div>
    </section>`;
  }

  return '';
}

export const css = `
.th-p-candles{
  --candle-ink:#172534;
  --candle-night:#102130;
  --candle-paper:#fff9f1;
  --candle-cream:#f1e9de;
  --candle-amber:#e5b968;
  --candle-wax:#9b3c34;
  --candle-line:#d6c8b7;
  background:var(--candle-cream);
  color:var(--candle-ink);
  overflow-x:clip;
}
.th-p-candles .store-header,.th-p-candles .site-header{background:var(--candle-paper);border-color:var(--candle-line)}
.th-p-candles .store-header a,.th-p-candles .site-header a{color:var(--candle-ink);letter-spacing:.05em}
.th-p-candles .candle-hero{position:relative;isolation:isolate;min-height:clamp(37rem,57vw,51rem);background:var(--candle-night);color:var(--candle-paper);overflow:hidden}
.th-p-candles .candle-hero::before{position:absolute;z-index:-1;top:-18rem;right:-15rem;width:43rem;aspect-ratio:1;border:1px solid #e5b9683b;border-radius:50%;box-shadow:0 0 0 5.2rem #e5b96809,0 0 0 10rem #e5b96808;content:''}
.th-p-candles .candle-hero-shell{display:grid;grid-template-columns:minmax(8.75rem,.55fr) minmax(23rem,1.48fr) minmax(19rem,.97fr);grid-template-rows:minmax(22rem,.97fr) minmax(15rem,.7fr);min-height:inherit}
.th-p-candles .candle-spine{position:relative;z-index:2;display:flex;grid-row:1 / -1;min-width:0;flex-direction:column;justify-content:space-between;padding:clamp(1.4rem,3.3vw,3.6rem) clamp(1rem,2.6vw,2.8rem);background:linear-gradient(180deg,#152b3d,#0e1b28);border-right:1px solid #f8ecd926}
.th-p-candles .candle-spine::after{position:absolute;right:-1px;bottom:0;width:1px;height:34%;background:var(--candle-amber);content:''}
.th-p-candles .candle-spine p{margin:0;color:#fff6e9;font:500 clamp(1.45rem,2.1vw,2.45rem)/.83 var(--display);letter-spacing:-.06em}
.th-p-candles .candle-spine span{color:#e7d7beaa;font:700 .55rem/1.5 var(--body);letter-spacing:.17em;text-transform:uppercase;writing-mode:vertical-rl}
.th-p-candles .candle-spine i{width:1px;height:3.75rem;background:var(--candle-amber)}
.th-p-candles .candle-hero-image{position:relative;grid-row:1 / -1;min-width:0;margin:0;overflow:hidden;background:#34404a}
.th-p-candles .candle-hero-image::before{position:absolute;z-index:1;inset:0;box-shadow:inset 0 0 0 1px #fff2;content:'';pointer-events:none}
.th-p-candles .candle-hero-image::after{position:absolute;z-index:1;right:0;bottom:0;left:0;height:38%;background:linear-gradient(0deg,#0c1926a8,transparent);content:'';pointer-events:none}
.th-p-candles .candle-hero-image .hero-media,.th-p-candles .candle-hero-image .theme-empty-media{display:block;width:100%;height:100%;min-height:inherit;object-fit:cover;object-position:42% center}
.th-p-candles .candle-hero-image .theme-empty-media{position:relative;background:radial-gradient(ellipse at 45% 40%,#f3b75e55 0 7%,transparent 26%),radial-gradient(ellipse at 51% 61%,#b6473833 0 14%,transparent 42%),linear-gradient(138deg,#3d2b2c,#182d3b 63%,#0d1722);color:#fff4e7}
.th-p-candles .candle-hero-image .theme-empty-media::before,.th-p-candles .candle-hero-image .theme-empty-media::after{position:absolute;bottom:16%;width:19%;background:linear-gradient(90deg,#8a342e,#d18e6d);content:''}
.th-p-candles .candle-hero-image .theme-empty-media::before{left:30%;height:43%;border-radius:2px 2px 10px 10px;box-shadow:0 -7.2rem 0 -6.8rem #ffc86d}
.th-p-candles .candle-hero-image .theme-empty-media::after{right:24%;height:29%;border-radius:36% 36% 2px 2px;background:repeating-linear-gradient(90deg,#eed8b4 0 3px,#b99d78 3px 5px);box-shadow:0 -5.3rem 0 -5rem #ffc86d}
.th-p-candles .candle-hero-image figcaption{position:absolute;z-index:2;bottom:clamp(1.2rem,2.6vw,2.8rem);left:clamp(1.2rem,2.8vw,3.1rem);display:flex;align-items:center;gap:.65rem;margin:0;color:#fff2e2d9;font:700 .56rem/1.25 var(--body);letter-spacing:.18em;text-transform:uppercase}
.th-p-candles .candle-hero-image figcaption span{display:block;width:1.65rem;height:1px;background:var(--candle-amber)}
.th-p-candles .candle-copy-panel{position:relative;z-index:2;display:flex;min-width:0;flex-direction:column;justify-content:center;padding:clamp(2.1rem,4.3vw,5.3rem) clamp(1.65rem,4vw,4.5rem);background:var(--candle-paper);color:var(--candle-ink)}
.th-p-candles .candle-copy-panel::after{position:absolute;right:0;bottom:0;width:clamp(3rem,6vw,6.4rem);aspect-ratio:1;background:linear-gradient(135deg,transparent 49%,#e5b968 50%);content:''}
.th-p-candles .candle-copy-mark{display:flex;align-items:center;gap:.55rem;margin-bottom:clamp(1.15rem,2.4vw,2.45rem);color:var(--candle-wax)}
.th-p-candles .candle-copy-mark i{display:block;width:.55rem;height:.55rem;border-radius:50%;background:var(--candle-wax);box-shadow:0 0 0 .35rem #9b3c3414}
.th-p-candles .candle-copy-mark span{font:700 .53rem/.95 var(--body);letter-spacing:.15em;text-transform:uppercase}
.th-p-candles .candle-copy{max-width:26rem}
.th-p-candles .candle-copy .eyebrow{margin:0 0 1.05rem;color:#86671f;font:700 .58rem/1.3 var(--body);letter-spacing:.2em;text-transform:uppercase}
.th-p-candles .candle-copy h1{max-width:9ch;margin:0;color:var(--candle-ink);font:500 clamp(3.15rem,5.7vw,6.8rem)/.83 var(--display);letter-spacing:-.075em;overflow-wrap:anywhere}
.th-p-candles .candle-copy h1.long{max-width:12ch;font-size:clamp(2.45rem,4.5vw,5rem);line-height:.91}
.th-p-candles .candle-copy .sub{max-width:29ch;margin:1.45rem 0 0;color:#4a5962;font:500 clamp(.74rem,.9vw,.86rem)/1.65 var(--body);letter-spacing:.01em}
.th-p-candles .candle-copy .ctas{display:flex;flex-wrap:wrap;gap:.6rem;margin-top:1.85rem}
.th-p-candles .candle-copy .btn{display:inline-flex;align-items:center;justify-content:center;min-height:2.85rem;padding:.7rem 1.05rem;border:1px solid var(--candle-ink);border-radius:999px;background:var(--candle-ink);color:var(--candle-paper);font:700 .59rem/1 var(--body);letter-spacing:.13em;text-decoration:none;text-transform:uppercase}
.th-p-candles .candle-copy .btn.ghost{background:transparent;color:var(--candle-ink)}
.th-p-candles .candle-copy .btn:hover,.th-p-candles .candle-copy .btn:focus-visible{border-color:var(--candle-wax);background:var(--candle-wax);color:#fff8f0}
.th-p-candles .candle-chapters{position:relative;display:flex;min-width:0;flex-direction:column;padding:1.25rem clamp(1.3rem,3.4vw,3.6rem) clamp(1.3rem,3.5vw,3.5rem);background:#172a39;color:#f8ede0;border-top:1px solid #fff2}
.th-p-candles .candle-chapters::before{position:absolute;top:0;right:0;width:2.8rem;height:1px;background:var(--candle-amber);content:''}
.th-p-candles .candle-chapters-head{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding-bottom:.85rem;border-bottom:1px solid #fff2}
.th-p-candles .candle-chapters-head p,.th-p-candles .candle-chapters-head span{margin:0;font:700 .54rem/1.2 var(--body);letter-spacing:.17em;text-transform:uppercase}
.th-p-candles .candle-chapters-head p{color:#e5b968}
.th-p-candles .candle-chapters-head span{color:#eee0cc88}
.th-p-candles .candle-chapters-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 .85rem;margin-top:auto}
.th-p-candles .candle-chapter-link{display:grid;grid-template-columns:1.6rem minmax(0,1fr) auto;align-items:center;gap:.35rem;min-width:0;min-height:2.75rem;border-bottom:1px solid #fff2;color:#fff4e6;font:600 .68rem/1.2 var(--body);letter-spacing:.01em;text-decoration:none}
.th-p-candles .candle-chapter-link span:nth-child(2){overflow-wrap:anywhere}
.th-p-candles .candle-chapter-num,.th-p-candles .candle-chapter-link em{color:#e5b968;font:700 .52rem/1 var(--body);letter-spacing:.1em;font-style:normal}
.th-p-candles .candle-chapter-link em{color:#f5e5cf8c}
.th-p-candles .candle-chapter-all{grid-column:1 / -1}
.th-p-candles .candle-chapter-all b{font:400 1rem/1 var(--display)}
.th-p-candles .candle-chapter-link:hover,.th-p-candles .candle-chapter-link:focus-visible{color:var(--candle-amber)}
.th-p-candles .candle-hero>.motion-toggle{position:absolute;z-index:5;bottom:1rem;left:calc(clamp(8.75rem,.55fr) + clamp(1rem,2.6vw,2.8rem));min-height:2.75rem;padding:.55rem .8rem;border:1px solid #fff5;border-radius:999px;background:#102130d9;color:#fff8ed;font:700 .55rem/1 var(--body);letter-spacing:.12em;text-transform:uppercase}
.th-p-candles .candle-discovery{display:grid;grid-template-columns:minmax(17rem,.72fr) minmax(0,1.65fr);gap:clamp(1.5rem,4vw,4.5rem);padding:clamp(3.25rem,6.5vw,7.5rem) clamp(1.25rem,5.4vw,6.7rem);background:var(--candle-cream)}
.th-p-candles .candle-discovery-intro{align-self:start;min-width:0;padding-top:.35rem}
.th-p-candles .candle-kicker{margin:0 0 1.2rem;color:#916f20;font:700 .58rem/1.2 var(--body);letter-spacing:.2em;text-transform:uppercase}
.th-p-candles .candle-discovery-intro h2{margin:0;max-width:9ch;color:var(--candle-ink);font:500 clamp(2.75rem,4.5vw,5.45rem)/.85 var(--display);letter-spacing:-.075em;overflow-wrap:anywhere}
.th-p-candles .candle-discovery-intro h2 em{color:var(--candle-wax);font-style:italic}
.th-p-candles .candle-discovery-intro>p:not(.candle-kicker){max-width:30ch;margin:1.55rem 0 0;color:#58626a;font:500 .79rem/1.7 var(--body)}
.th-p-candles .candle-all-link{display:inline-flex;align-items:center;gap:.7rem;min-height:2.75rem;margin-top:1.85rem;border-bottom:1px solid var(--candle-ink);color:var(--candle-ink);font:700 .58rem/1 var(--body);letter-spacing:.14em;text-decoration:none;text-transform:uppercase}
.th-p-candles .candle-all-link span{color:var(--candle-wax);font-size:1.05rem;transition:transform 160ms ease}
.th-p-candles .candle-all-link:hover span,.th-p-candles .candle-all-link:focus-visible span{transform:translateX(.25rem)}
.th-p-candles .candle-chapter-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));min-width:0;border-top:1px solid var(--candle-line);border-left:1px solid var(--candle-line)}
.th-p-candles .candle-chapter-card{display:flex;min-width:0;flex-direction:column;border-right:1px solid var(--candle-line);border-bottom:1px solid var(--candle-line);background:var(--candle-paper);color:var(--candle-ink);text-decoration:none}
.th-p-candles .candle-chapter-card:nth-child(even){background:#f6eee2}
.th-p-candles .candle-chapter-top{display:flex;align-items:center;justify-content:space-between;min-height:2.7rem;padding:0 .85rem;color:#8e6c1d;font:700 .55rem/1 var(--body);letter-spacing:.15em}
.th-p-candles .candle-chapter-top b{color:var(--candle-wax);font:400 1.1rem/1 var(--display)}
.th-p-candles .candle-chapter-image{position:relative;min-height:clamp(9rem,14vw,13rem);overflow:hidden;background:linear-gradient(135deg,#c7a270,#e5d7c1 53%,#947061)}
.th-p-candles .candle-chapter-image img{display:block;width:100%;height:100%;object-fit:cover}
.th-p-candles .candle-chapter-blank{isolation:isolate;background:radial-gradient(ellipse at 54% 34%,#fff0b3 0 3%,#e8ae5240 8%,transparent 24%),linear-gradient(135deg,#293a45,#98634e 57%,#edc97d)}
.th-p-candles .candle-chapter-blank::before,.th-p-candles .candle-chapter-blank::after,.th-p-candles .candle-chapter-blank i,.th-p-candles .candle-chapter-blank b{position:absolute;display:block;content:''}
.th-p-candles .candle-chapter-blank::before{bottom:12%;left:20%;width:21%;height:48%;border-radius:18px 18px 3px 3px;background:#f0d7a8;box-shadow:0 -1.7rem 0 -1.28rem #ffca62}
.th-p-candles .candle-chapter-blank::after{right:16%;bottom:15%;width:28%;height:31%;border:1px solid #f7d68c;background:#3b2427b3;box-shadow:0 -1.1rem 0 -1rem #ffca62}
.th-p-candles .candle-chapter-blank i{top:21%;left:47%;width:1px;height:56%;background:#f3d27b55;transform:rotate(27deg)}
.th-p-candles .candle-chapter-blank b{right:5%;bottom:7%;width:74%;height:1px;background:#f7e1b677}
.th-p-candles .candle-chapter-details{display:flex;flex:1;min-width:0;flex-direction:column;align-items:flex-start;padding:1rem .85rem 1.15rem}
.th-p-candles .candle-chapter-details p{margin:0;color:#9a7626;font:700 .53rem/1.2 var(--body);letter-spacing:.15em;text-transform:uppercase}
.th-p-candles .candle-chapter-details h3{margin:.6rem 0 1.2rem;color:var(--candle-ink);font:500 clamp(1.3rem,1.8vw,1.95rem)/.98 var(--display);letter-spacing:-.05em;overflow-wrap:anywhere}
.th-p-candles .candle-chapter-details>span{margin-top:auto;color:#52606a;font:700 .53rem/1.2 var(--body);letter-spacing:.13em;text-transform:uppercase}
.th-p-candles .candle-chapter-card:hover .candle-chapter-details h3,.th-p-candles .candle-chapter-card:focus-visible .candle-chapter-details h3{color:var(--candle-wax)}
.th-p-candles .candle-product-edit{align-items:start}
.th-p-candles .candle-product-notes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem;min-width:0}
.th-p-candles .candle-product-notes .product-card{min-width:0;border-color:var(--candle-line);border-radius:2px;background:var(--candle-paper)}
.th-p-candles .candle-product-notes .product-card img{border-radius:0}
.th-p-candles #shop{padding-top:clamp(3.2rem,6vw,6rem)}
.th-p-candles #shop .section-title,.th-p-candles #shop h2{font-family:var(--display);font-weight:500;letter-spacing:-.055em}
.th-p-candles #shop .product-card{border-radius:2px;border-color:var(--candle-line);background:var(--candle-paper)}
.th-p-candles #shop .product-card img{border-radius:0}
.th-p-candles :is(.candle-copy .btn,.candle-chapter-link,.candle-chapter-card,.candle-all-link,.candle-hero>.motion-toggle):focus-visible{outline:3px solid var(--candle-amber);outline-offset:3px}
@media (max-width:1050px){
  .th-p-candles .candle-hero-shell{grid-template-columns:7.2rem minmax(18rem,1.25fr) minmax(16.5rem,.9fr)}
  .th-p-candles .candle-spine{padding-right:1rem;padding-left:1rem}
  .th-p-candles .candle-copy-panel{padding-right:1.55rem;padding-left:1.55rem}
  .th-p-candles .candle-copy h1{font-size:clamp(3rem,5.8vw,5.2rem)}
  .th-p-candles .candle-chapters{padding-right:1.5rem;padding-left:1.5rem}
  .th-p-candles .candle-chapters-list{grid-template-columns:1fr}
  .th-p-candles .candle-hero>.motion-toggle{left:8.2rem}
  .th-p-candles .candle-discovery{grid-template-columns:minmax(14.5rem,.7fr) minmax(0,1.55fr);gap:2.2rem;padding-right:2rem;padding-left:2rem}
  .th-p-candles .candle-chapter-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media (max-width:720px){
  .th-p-candles .candle-hero{min-height:0}
  .th-p-candles .candle-hero-shell{display:flex;min-height:0;flex-direction:column}
  .th-p-candles .candle-copy-panel{order:1;min-height:0;padding:2.4rem 1.25rem 2.7rem}
  .th-p-candles .candle-copy h1{max-width:10ch;font-size:clamp(3.25rem,13.4vw,4.7rem)}
  .th-p-candles .candle-copy h1.long{font-size:clamp(2.5rem,10.5vw,3.8rem)}
  .th-p-candles .candle-copy .sub{max-width:36ch}
  .th-p-candles .candle-hero-image{order:2;min-height:17.5rem;aspect-ratio:16/10}
  .th-p-candles .candle-hero-image .hero-media,.th-p-candles .candle-hero-image .theme-empty-media{min-height:0;object-position:44% center}
  .th-p-candles .candle-chapters{order:3;padding:1.15rem 1.25rem 1.35rem}
  .th-p-candles .candle-chapters-list{grid-template-columns:repeat(2,minmax(0,1fr));gap:0 1rem;margin-top:.5rem}
  .th-p-candles .candle-chapter-link{min-height:2.95rem;font-size:.65rem}
  .th-p-candles .candle-spine{order:4;display:grid;grid-template-columns:auto 1fr auto;align-items:center;min-height:4.1rem;padding:0 1.25rem;border-top:1px solid #fff2;border-right:0}
  .th-p-candles .candle-spine::after{top:0;right:auto;bottom:auto;left:1.25rem;width:2.4rem;height:1px}
  .th-p-candles .candle-spine p{font-size:1.4rem}
  .th-p-candles .candle-spine span{justify-self:center;font-size:.48rem;writing-mode:initial}
  .th-p-candles .candle-spine i{justify-self:end;width:2rem;height:1px}
  .th-p-candles .candle-hero>.motion-toggle{bottom:calc(4.1rem + 1rem);left:1rem}
  .th-p-candles .candle-discovery{display:block;padding:3.2rem 1.25rem}
  .th-p-candles .candle-discovery-intro{padding-bottom:2.3rem}
  .th-p-candles .candle-discovery-intro h2{max-width:10ch;font-size:clamp(3rem,11vw,4.35rem)}
  .th-p-candles .candle-chapter-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .th-p-candles .candle-chapter-image{min-height:10.5rem}
  .th-p-candles .candle-product-notes{grid-template-columns:repeat(2,minmax(0,1fr));gap:.8rem}
}
@media (max-width:420px){
  .th-p-candles .candle-copy-panel{padding-right:1rem;padding-left:1rem}
  .th-p-candles .candle-copy h1{font-size:clamp(3rem,13.2vw,4.1rem)}
  .th-p-candles .candle-copy .ctas{gap:.45rem}
  .th-p-candles .candle-copy .btn{flex:1 1 9rem;padding-right:.75rem;padding-left:.75rem}
  .th-p-candles .candle-hero-image{min-height:15rem}
  .th-p-candles .candle-chapters{padding-right:1rem;padding-left:1rem}
  .th-p-candles .candle-chapters-list{grid-template-columns:1fr;gap:0}
  .th-p-candles .candle-spine{padding-right:1rem;padding-left:1rem}
  .th-p-candles .candle-hero>.motion-toggle{bottom:calc(4.1rem + .7rem)}
  .th-p-candles .candle-discovery{padding-right:1rem;padding-left:1rem}
  .th-p-candles .candle-chapter-image{min-height:8.5rem}
  .th-p-candles .candle-chapter-details{padding-right:.7rem;padding-left:.7rem}
  .th-p-candles .candle-chapter-details h3{font-size:1.28rem}
}
@media (prefers-reduced-motion:reduce){
  .th-p-candles .has-hero-motion .hero-media,.th-p-candles .candle-all-link span{animation:none!important;transition:none!important;transform:none!important}
}
`;

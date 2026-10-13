import { defineTheme } from "../category-theme-kit.js";

export const theme = defineTheme({
  id: "p-audio",
  name: "VANTA / FIELD",
  for: "Headphones and considered audio electronics",
  vibe: "Graphite acoustic architecture, warm amber edge light, and a focused listening room",
  category: "Audio electronics and headphones",
  group: "technology",
  display: "Sora",
  body: "Manrope",
  displayWeight: 700,
  tracking: "-.045em",
  colors: {
    bg: "#0B0C0C",
    surface: "#151616",
    ink: "#F1EEE8",
    muted: "#AAA49A",
    line: "#393735",
    accent: "#D18A54",
    onAccent: "#17100C",
    panel: "#1B1B1B",
    onPanel: "#F1EEE8",
    foot: "#070808",
    onFoot: "#D7D1C7",
    bar: "#D18A54",
    onBar: "#17100C",
    badge: "#E8B281",
    onBadge: "#17100C"
  },
  header: "split",
  hero: "spotlight",
  card: "glass",
  ratio: "1/1",
  rCard: 6,
  rBtn: 999,
  motion: "pan",
  copy: {
    eyebrow: "Sound, held in space",
    collection: "The listening room",
    cta: "Explore headphones",
    title: "Hear the architecture of sound.",
    subtitle: "A focused edit for the way you listen."
  }
});

const countLabel = (count) => `${count} ${count === 1 ? "piece" : "pieces"}`;

function listeningRoutes(ctx) {
  const categories = Array.isArray(ctx.cats) ? ctx.cats.slice(0, 3) : [];
  if (!categories.length) {
    return `<a class="audio-route-link audio-route-fallback" href="#shop"><span class="audio-route-number">01</span><span class="audio-route-name">${ctx.esc(ctx.t.copy.collection)}</span><span class="audio-route-count">Browse pieces</span></a>`;
  }
  return categories.map((category, index) => {
    const count = Number(category.count) || 0;
    return `<a class="audio-route-link" href="${ctx.categoryLink(category.name)}"><span class="audio-route-number">${String(index + 1).padStart(2, "0")}</span><span class="audio-route-name">${ctx.esc(category.name)}</span><span class="audio-route-count">${countLabel(count)}</span></a>`;
  }).join("");
}

function categoryRoute(ctx, category, index) {
  const count = Number(category.count) || 0;
  const image = category.image
    ? `<img src="${ctx.esc(category.image)}" alt="" loading="lazy" decoding="async">`
    : `<div class="audio-route-no-media" aria-hidden="true"><span>${String(index + 1).padStart(2, "0")}</span></div>`;
  return `<a class="audio-category-route" href="${ctx.categoryLink(category.name)}">
    <span class="audio-category-media">${image}</span>
    <span class="audio-category-meta"><span class="audio-category-index">${String(index + 1).padStart(2, "0")}</span><strong>${ctx.esc(category.name)}</strong><small>${countLabel(count)}</small><span class="audio-route-arrow" aria-hidden="true">→</span></span>
  </a>`;
}

export function hero(ctx) {
  return `<section class="hero category-hero audio-chamber${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="audio-chamber-shell">
      <div class="audio-media">${ctx.media(0, { priority: true, lazy: false, decorative: true })}</div>
      <div class="audio-acoustic-rings" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      <div class="audio-sound-scale" aria-hidden="true"><span>20K</span><span>10K</span><span>1K</span><span>100</span><span>20</span><b>HZ</b></div>
      <div class="audio-copy-wrap">${ctx.copy("audio-copy")}</div>
      <nav class="audio-listening-selector" aria-label="Browse audio categories">${listeningRoutes(ctx)}</nav>
      <div class="audio-motion">${ctx.controls}</div>
    </div>
  </section>`;
}

export function discovery(ctx) {
  const categories = Array.isArray(ctx.cats) ? ctx.cats : [];
  const products = Array.isArray(ctx.products) ? ctx.products : [];
  if (categories.length >= 2) {
    return `<section class="theme-discovery audio-listening-map" aria-labelledby="audio-discovery-title">
      <div class="audio-discovery-heading"><p class="eyebrow">${ctx.esc(ctx.t.copy.collection)}</p><h2 id="audio-discovery-title">Choose your listening room.</h2><p>Browse the categories available in this collection.</p></div>
      <div class="audio-category-grid">${categories.slice(0, 3).map((category, index) => categoryRoute(ctx, category, index)).join("")}</div>
    </section>`;
  }
  if (products.length >= 2) {
    return `<section class="theme-discovery audio-signal-shelf" aria-labelledby="audio-signal-title">
      <div class="audio-discovery-heading"><p class="eyebrow">${ctx.esc(ctx.t.copy.collection)}</p><h2 id="audio-signal-title">Start with what is here.</h2><p>Available pieces from this collection.</p></div>
      <div class="audio-product-grid">${products.slice(0, 3).map((product) => ctx.productCard(product)).join("")}</div>
    </section>`;
  }
  return "";
}

export const css = `
.th-p-audio{background:var(--bg);color:var(--ink);}
.th-p-audio .site-header,.th-p-audio .store-header{border-color:color-mix(in srgb,var(--line) 82%,transparent);}
.th-p-audio .category-hero.audio-chamber{padding:clamp(10px,1.8vw,28px);background:var(--bg);color:var(--ink);}
.th-p-audio .audio-chamber-shell{position:relative;isolation:isolate;display:grid;min-height:clamp(560px,62vw,760px);max-width:1640px;margin:0 auto;overflow:hidden;border:1px solid var(--line);background:#101010;box-shadow:0 24px 70px #0008;}
.th-p-audio .audio-media{position:absolute;inset:0;z-index:-3;overflow:hidden;background:radial-gradient(circle at 50% 48%,#433326 0 12%,#1c1b1a 36%,#0b0c0c 74%);}
.th-p-audio .audio-media::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,#070808c9 0%,transparent 26%,transparent 69%,#070808e0 100%),linear-gradient(0deg,#080909b8 0%,transparent 40%,#070808a6 100%);pointer-events:none;}
.th-p-audio .audio-media .hero-media{display:block;width:100%;height:100%;object-fit:cover;object-position:center;filter:saturate(.78) contrast(1.05) brightness(.82);}
.th-p-audio .audio-media .theme-empty-media{height:100%;min-height:100%;background:radial-gradient(circle at 50% 48%,#483628 0 12%,#171717 41%,#090a0a 78%);color:#d8c6b5;}
.th-p-audio .audio-acoustic-rings{position:absolute;z-index:-1;inset:4.5% 20%;display:grid;place-items:center;border:clamp(10px,1.2vw,18px) solid #c98b563b;border-radius:50%;box-shadow:inset 0 0 0 clamp(10px,1.2vw,18px) #030303a3,0 0 50px #d38c4b28;pointer-events:none;}
.th-p-audio .audio-acoustic-rings i{position:absolute;border:1px solid #d2a0772d;border-radius:50%;}
.th-p-audio .audio-acoustic-rings i:nth-child(1){inset:8%;}
.th-p-audio .audio-acoustic-rings i:nth-child(2){inset:17%;}
.th-p-audio .audio-acoustic-rings i:nth-child(3){inset:27%;}
.th-p-audio .audio-acoustic-rings i:nth-child(4){inset:38%;box-shadow:0 0 38px #d18a5455;}
.th-p-audio .audio-copy-wrap{position:relative;z-index:2;display:grid;place-items:start center;width:min(100% - 420px,760px);margin:clamp(40px,7vw,94px) auto auto;text-align:center;pointer-events:none;}
.th-p-audio .audio-copy{display:grid;justify-items:center;gap:0;width:100%;text-wrap:balance;pointer-events:auto;}
.th-p-audio .audio-copy .eyebrow{margin:0 0 14px;color:#edcfb6;font:600 10px/1.3 var(--body);letter-spacing:.22em;text-transform:uppercase;}
.th-p-audio .audio-copy h1{max-width:12ch;margin:0;color:#fbf7f1;font:var(--dw) clamp(40px,5.15vw,80px)/.99 var(--display);letter-spacing:var(--dt);text-shadow:0 3px 24px #000;}
.th-p-audio .audio-copy h1.long{max-width:18ch;font-size:clamp(36px,4.1vw,64px);}
.th-p-audio .audio-copy .sub{max-width:49ch;margin:19px auto 0;color:#e1d8ce;font:400 clamp(14px,1.1vw,17px)/1.55 var(--body);}
.th-p-audio .audio-copy .ctas{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-top:25px;}
.th-p-audio .audio-copy .btn{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 22px;border:1px solid #f6ede3;color:#17110d;background:#f6ede3;border-radius:999px;font:700 12px/1 var(--body);letter-spacing:.02em;text-decoration:none;transition:background-color .2s ease,color .2s ease,border-color .2s ease;}
.th-p-audio .audio-copy .btn:hover{color:#fff;background:var(--accent);border-color:var(--accent);}
.th-p-audio .audio-copy .btn.ghost{color:#fbf7f1;background:#11111162;border-color:#f6ede37d;}
.th-p-audio .audio-copy .btn.ghost:hover{color:#17110d;background:#f6ede3;border-color:#f6ede3;}
.th-p-audio .audio-sound-scale{position:absolute;z-index:2;top:50%;left:clamp(22px,5.6vw,95px);display:grid;gap:clamp(13px,2vw,26px);width:38px;transform:translateY(-22%);color:#e2c3aa;font:500 9px/1 var(--body);letter-spacing:.04em;text-align:right;opacity:.86;}
.th-p-audio .audio-sound-scale::before{content:"";position:absolute;right:-9px;top:2px;bottom:18px;width:1px;background:linear-gradient(#d6a677,transparent 18%,#d6a677 81%,transparent);box-shadow:7px 0 0 -3px #d6a677;}
.th-p-audio .audio-sound-scale span{position:relative;}
.th-p-audio .audio-sound-scale b{margin-top:4px;color:#d6a677;font:700 8px/1 var(--body);letter-spacing:.16em;}
.th-p-audio .audio-listening-selector{position:absolute;z-index:3;right:clamp(20px,5vw,86px);top:50%;display:grid;width:min(175px,16vw);transform:translateY(-35%);border-top:1px solid #e7ceb74d;}
.th-p-audio .audio-route-link{position:relative;display:grid;grid-template-columns:31px 1fr;column-gap:7px;align-items:baseline;min-height:70px;padding:14px 0;border-bottom:1px solid #e7ceb735;color:#f6eee5;text-decoration:none;transition:color .2s ease,transform .2s ease;}
.th-p-audio .audio-route-link:hover{color:#edbd94;transform:translateX(-4px);}
.th-p-audio .audio-route-number{grid-row:span 2;display:grid;place-items:center;width:28px;height:28px;border:1px solid currentColor;border-radius:50%;font:500 9px/1 var(--body);}
.th-p-audio .audio-route-name{overflow:hidden;font:600 13px/1.2 var(--body);text-overflow:ellipsis;white-space:nowrap;}
.th-p-audio .audio-route-count{margin-top:4px;color:#c9b6a6;font:400 10px/1.2 var(--body);letter-spacing:.04em;}
.th-p-audio .audio-route-fallback{width:100%;}
.th-p-audio .audio-motion{position:absolute;z-index:4;right:clamp(18px,2vw,30px);bottom:clamp(16px,2vw,26px);}
.th-p-audio .audio-motion .motion-toggle{min-height:44px;padding:0 14px;border:1px solid #f5ebdf70;border-radius:999px;color:#f5ebdf;background:#0c0c0cc4;font:600 10px/1 var(--body);letter-spacing:.07em;text-transform:uppercase;}
.th-p-audio .audio-motion .motion-toggle:hover{background:#f5ebdf;color:#15100c;}
.th-p-audio .audio-chamber.has-hero-motion[data-hero-motion="pan"] .audio-media .hero-media{animation:audio-pan 16s ease-in-out infinite alternate;}
.th-p-audio .audio-chamber.has-hero-motion[data-hero-motion="drift"] .audio-media .hero-media{animation:audio-drift 13s ease-in-out infinite alternate;}
@keyframes audio-pan{from{transform:scale(1.03) translateX(-1.5%);}to{transform:scale(1.1) translateX(1.5%);}}
@keyframes audio-drift{from{transform:scale(1.035) translate3d(-.6%,-.4%,0);}to{transform:scale(1.085) translate3d(.7%,.5%,0);}}
.th-p-audio .theme-discovery{max-width:1640px;margin:0 auto;padding:clamp(64px,8vw,124px) clamp(20px,5vw,82px);}
.th-p-audio .audio-listening-map{background:linear-gradient(180deg,#0b0c0c 0%,#111111 100%);}
.th-p-audio .audio-discovery-heading{display:grid;grid-template-columns:minmax(0,1fr) minmax(190px,31%);column-gap:32px;align-items:end;margin-bottom:clamp(28px,4vw,54px);}
.th-p-audio .audio-discovery-heading .eyebrow{grid-column:1/-1;margin:0 0 13px;color:var(--accent);font:700 10px/1.2 var(--body);letter-spacing:.2em;text-transform:uppercase;}
.th-p-audio .audio-discovery-heading h2{max-width:15ch;margin:0;color:var(--ink);font:var(--dw) clamp(32px,4vw,58px)/1.02 var(--display);letter-spacing:var(--dt);text-wrap:balance;}
.th-p-audio .audio-discovery-heading>p:last-child{max-width:30ch;margin:0 0 3px;color:var(--muted);font:400 15px/1.55 var(--body);}
.th-p-audio .audio-category-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:2px;background:var(--line);border:1px solid var(--line);}
.th-p-audio .audio-category-route{position:relative;display:grid;min-height:clamp(350px,31vw,480px);overflow:hidden;background:#191919;color:var(--ink);text-decoration:none;isolation:isolate;}
.th-p-audio .audio-category-media{position:absolute;inset:0;overflow:hidden;background:radial-gradient(circle at 50% 33%,#4d4238 0,#211f1c 42%,#0f1010 85%);}
.th-p-audio .audio-category-media::after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,#090909f2 0%,#09090925 58%,#0909090d 100%);}
.th-p-audio .audio-category-media img{display:block;width:100%;height:100%;object-fit:cover;filter:grayscale(.2) saturate(.72) contrast(1.08);transition:transform .55s ease,filter .55s ease;}
.th-p-audio .audio-category-route:hover .audio-category-media img{transform:scale(1.055);filter:grayscale(0) saturate(.9) contrast(1.04);}
.th-p-audio .audio-route-no-media{display:grid;width:100%;height:100%;place-items:center;background:radial-gradient(circle at 50% 45%,#4f3b2b 0 7%,#25211e 32%,#0e0f0f 73%);color:#d7a77b;font:500 clamp(62px,8vw,120px)/1 var(--display);opacity:.86;}
.th-p-audio .audio-category-meta{position:relative;z-index:1;align-self:end;display:grid;grid-template-columns:29px minmax(0,1fr) 22px;column-gap:11px;row-gap:4px;align-items:baseline;padding:22px;}
.th-p-audio .audio-category-index{grid-row:span 2;color:#e1bd9c;font:600 10px/1 var(--body);letter-spacing:.1em;}
.th-p-audio .audio-category-meta strong{overflow:hidden;color:#fff;font:600 clamp(18px,2vw,27px)/1.1 var(--display);letter-spacing:var(--dt);text-overflow:ellipsis;white-space:nowrap;}
.th-p-audio .audio-category-meta small{grid-column:2;color:#ded1c5;font:500 10px/1.2 var(--body);letter-spacing:.09em;text-transform:uppercase;}
.th-p-audio .audio-route-arrow{grid-row:span 2;grid-column:3;align-self:center;color:#edc5a3;font:400 26px/1 var(--body);transition:transform .2s ease;}
.th-p-audio .audio-category-route:hover .audio-route-arrow{transform:translateX(4px);}
.th-p-audio .audio-signal-shelf{border-top:1px solid var(--line);background:var(--bg);}
.th-p-audio .audio-product-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;}
.th-p-audio .audio-product-grid .product-card{border:1px solid var(--line);border-radius:6px;background:var(--surface);box-shadow:none;}
.th-p-audio .audio-product-grid .product-card img{filter:saturate(.78) contrast(1.04);}
.th-p-audio :is(.audio-route-link,.audio-category-route,.audio-copy .btn):focus-visible{outline:3px solid var(--accent);outline-offset:-3px;}
@media (max-width:900px){
  .th-p-audio .audio-chamber-shell{min-height:680px;}
  .th-p-audio .audio-copy-wrap{width:min(100% - 48px,590px);margin-top:clamp(58px,12vw,100px);}
  .th-p-audio .audio-copy h1{font-size:clamp(40px,8.5vw,68px);}
  .th-p-audio .audio-acoustic-rings{inset:10% 13% 15%;}
  .th-p-audio .audio-sound-scale{left:20px;top:auto;bottom:42px;display:flex;gap:14px;width:auto;transform:none;}
  .th-p-audio .audio-sound-scale::before{display:none;}
  .th-p-audio .audio-sound-scale b{margin:0;}
  .th-p-audio .audio-listening-selector{right:20px;top:auto;bottom:88px;width:min(178px,42vw);transform:none;}
  .th-p-audio .audio-route-link{min-height:58px;padding:9px 0;}
  .th-p-audio .audio-discovery-heading{grid-template-columns:1fr;gap:16px;}
  .th-p-audio .audio-category-route{min-height:330px;}
}
@media (max-width:620px){
  .th-p-audio .category-hero.audio-chamber{padding:0;}
  .th-p-audio .audio-chamber-shell{min-height:700px;border-right:0;border-left:0;}
  .th-p-audio .audio-media .hero-media{object-position:48% center;}
  .th-p-audio .audio-media::after{background:linear-gradient(0deg,#080909d9 0%,transparent 57%,#080909aa 100%);}
  .th-p-audio .audio-acoustic-rings{inset:13% -15% 26%;border-width:9px;}
  .th-p-audio .audio-copy-wrap{width:calc(100% - 36px);margin-top:64px;}
  .th-p-audio .audio-copy .eyebrow{font-size:9px;}
  .th-p-audio .audio-copy h1,.th-p-audio .audio-copy h1.long{max-width:13ch;font-size:clamp(38px,11vw,54px);}
  .th-p-audio .audio-copy .sub{font-size:14px;}
  .th-p-audio .audio-copy .ctas{width:100%;}
  .th-p-audio .audio-copy .btn{flex:1 1 150px;padding:0 15px;}
  .th-p-audio .audio-listening-selector{right:18px;bottom:92px;width:calc(100% - 36px);grid-template-columns:repeat(3,minmax(0,1fr));border-top:1px solid #e7ceb74d;}
  .th-p-audio .audio-route-link{grid-template-columns:1fr;min-height:70px;padding:10px 8px;border-bottom:0;border-right:1px solid #e7ceb735;}
  .th-p-audio .audio-route-link:last-child{border-right:0;}
  .th-p-audio .audio-route-number{display:none;}
  .th-p-audio .audio-route-name{font-size:11px;}
  .th-p-audio .audio-route-count{font-size:9px;white-space:nowrap;}
  .th-p-audio .audio-sound-scale{bottom:22px;left:18px;gap:9px;font-size:8px;}
  .th-p-audio .audio-motion{right:15px;bottom:12px;}
  .th-p-audio .audio-motion .motion-toggle{min-height:44px;padding:0 10px;font-size:9px;}
  .th-p-audio .theme-discovery{padding:68px 18px;}
  .th-p-audio .audio-discovery-heading h2{font-size:clamp(31px,9vw,44px);}
  .th-p-audio .audio-category-grid{grid-template-columns:1fr;gap:1px;}
  .th-p-audio .audio-category-route{min-height:300px;}
  .th-p-audio .audio-product-grid{grid-template-columns:1fr;gap:12px;}
}
@media (prefers-reduced-motion:reduce){
  .th-p-audio .audio-chamber.has-hero-motion .audio-media .hero-media{animation:none;}
  .th-p-audio :is(.audio-route-link,.audio-category-media img,.audio-route-arrow,.audio-copy .btn){transition:none;}
}
`;

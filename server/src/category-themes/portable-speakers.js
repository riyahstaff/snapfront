import { defineTheme } from "../category-theme-kit.js";

export const theme = defineTheme({
  id: "p-portable-speakers",
  name: "TIDELINE SIGNAL",
  for: "Portable wireless speakers and sound on the move",
  vibe: "Sun-struck cobalt, mineral concrete, and a free-moving outdoor listening session",
  category: "Portable speakers",
  group: "technology",
  display: "Space Grotesk",
  body: "DM Sans",
  displayWeight: 700,
  tracking: "-.06em",
  colors: {
    bg: "#F4EFE6",
    surface: "#FFF9F1",
    ink: "#142238",
    muted: "#607082",
    line: "#BBC6CC",
    accent: "#FF5E3B",
    onAccent: "#172238",
    panel: "#173B7A",
    onPanel: "#F5F0E8",
    foot: "#142238",
    onFoot: "#F4EFE6",
    bar: "#1F5FD0",
    onBar: "#F4EFE6",
    badge: "#FFD05B",
    onBadge: "#142238"
  },
  header: "stack",
  hero: "collage",
  card: "boxed",
  ratio: "4/5",
  rCard: 18,
  rBtn: 999,
  motion: "pan",
  copy: {
    eyebrow: "Music leaves the room",
    collection: "The carry-on session",
    cta: "Browse speakers",
    title: "Carry the good part outside.",
    subtitle: "Portable sound for wherever the day opens up."
  }
});

const countLabel = (count) => `${Number(count) || 0} ${(Number(count) || 0) === 1 ? "piece" : "pieces"}`;

function stationCard(ctx, category, index) {
  const image = category.image
    ? `<img src="${ctx.esc(category.image)}" alt="" loading="lazy" decoding="async">`
    : `<span class="ps-station-fallback" aria-hidden="true"><i></i><i></i><i></i></span>`;
  return `<a class="ps-station" href="${ctx.categoryLink(category.name)}">
    <span class="ps-station-art">${image}</span>
    <span class="ps-station-number">${String(index + 1).padStart(2, "0")}</span>
    <span class="ps-station-name">${ctx.esc(category.name)}</span>
    <span class="ps-station-count">${countLabel(category.count)}</span>
    <span class="ps-station-arrow" aria-hidden="true">↗</span>
  </a>`;
}

export function hero(ctx) {
  return `<section class="hero category-hero ps-waterline${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="ps-stage">
      <div class="ps-media-frame">${ctx.media(0, { priority: true, lazy: false, decorative: true })}</div>
      <div class="ps-sunwash" aria-hidden="true"></div>
      <div class="ps-frequency-slats" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
      <div class="ps-location-mark" aria-hidden="true"><span>OUT</span><b>01</b><span>LOUD</span></div>
      <div class="ps-copy-deck">${ctx.copy("ps-copy")}</div>
      <div class="ps-hero-footer" aria-hidden="true"><span>${ctx.esc(ctx.t.copy.collection)}</span><span>—</span><span>sound, unboxed</span></div>
      <div class="ps-motion">${ctx.controls}</div>
    </div>
  </section>`;
}

export function discovery(ctx) {
  const categories = Array.isArray(ctx.cats) ? ctx.cats : [];
  const products = Array.isArray(ctx.products) ? ctx.products : [];

  if (categories.length >= 2) {
    return `<section class="theme-discovery ps-station-map" aria-labelledby="ps-station-title">
      <div class="ps-discovery-heading">
        <p class="eyebrow">${ctx.esc(ctx.t.copy.collection)}</p>
        <h2 id="ps-station-title">Choose a way into the collection.</h2>
        <p>Browse the categories available here, then take the session with you.</p>
      </div>
      <div class="ps-station-grid">${categories.slice(0, 4).map((category, index) => stationCard(ctx, category, index)).join("")}</div>
      <a class="ps-all-link" href="#shop"><span>See every available piece</span><b aria-hidden="true">→</b></a>
    </section>`;
  }

  if (products.length >= 2) {
    return `<section class="theme-discovery ps-open-case" aria-labelledby="ps-open-case-title">
      <div class="ps-discovery-heading">
        <p class="eyebrow">${ctx.esc(ctx.t.copy.collection)}</p>
        <h2 id="ps-open-case-title">What is ready to play.</h2>
        <p>A small edit of the pieces currently in this store.</p>
      </div>
      <div class="ps-product-strip">${products.slice(0, 3).map((product) => ctx.productCard(product)).join("")}</div>
    </section>`;
  }

  return "";
}

export const css = `
.th-p-portable-speakers{background:var(--bg);color:var(--ink);}
.th-p-portable-speakers .site-header,.th-p-portable-speakers .store-header{border-color:var(--line);background:color-mix(in srgb,var(--bg) 88%,transparent);}
.th-p-portable-speakers .category-hero.ps-waterline{padding:clamp(10px,1.6vw,25px);background:var(--bg);color:var(--ink);}
.th-p-portable-speakers .ps-stage{position:relative;isolation:isolate;min-height:clamp(585px,58vw,790px);max-width:1660px;margin:0 auto;overflow:hidden;border:1px solid #14356b;background:#164083;box-shadow:0 22px 50px #14223829;}
.th-p-portable-speakers .ps-media-frame{position:absolute;inset:0;z-index:-4;overflow:hidden;background:linear-gradient(142deg,#4a6a96 0%,#d5b276 46%,#153e7d 100%);}
.th-p-portable-speakers .ps-media-frame::after{position:absolute;inset:0;content:"";background:linear-gradient(90deg,#092d69df 0%,#0f3971a8 28%,#16315e26 58%,#10264529 100%),linear-gradient(0deg,#10264bb8 0%,transparent 38%,#10254a22 100%);pointer-events:none;}
.th-p-portable-speakers .ps-media-frame .hero-media{display:block;width:100%;height:100%;object-fit:cover;object-position:center;filter:saturate(1.07) contrast(1.04);}
.th-p-portable-speakers .ps-media-frame .theme-empty-media{height:100%;min-height:100%;background:linear-gradient(135deg,#1d5aa5 0 28%,#f3d9a5 28% 56%,#245bb4 56%);color:#f6eee3;}
.th-p-portable-speakers .ps-sunwash{position:absolute;z-index:-2;inset:0;pointer-events:none;background:radial-gradient(circle at 83% 20%,#ffe4ad45 0 4%,transparent 20%),linear-gradient(114deg,transparent 0 50%,#ffdd9f16 50% 51%,transparent 51% 100%);mix-blend-mode:screen;}
.th-p-portable-speakers .ps-frequency-slats{position:absolute;z-index:1;right:clamp(20px,4vw,68px);top:0;display:flex;align-items:flex-start;gap:clamp(7px,1vw,15px);height:clamp(160px,23vw,304px);pointer-events:none;}
.th-p-portable-speakers .ps-frequency-slats i{display:block;width:1px;background:#f4efe6b5;box-shadow:0 0 0 1px #173b7a55;}
.th-p-portable-speakers .ps-frequency-slats i:nth-child(1){height:27%;}
.th-p-portable-speakers .ps-frequency-slats i:nth-child(2){height:46%;}
.th-p-portable-speakers .ps-frequency-slats i:nth-child(3){height:76%;}
.th-p-portable-speakers .ps-frequency-slats i:nth-child(4){height:53%;}
.th-p-portable-speakers .ps-frequency-slats i:nth-child(5){height:91%;}
.th-p-portable-speakers .ps-location-mark{position:absolute;z-index:2;top:clamp(22px,3vw,46px);left:clamp(22px,4vw,64px);display:grid;grid-template-columns:auto auto;gap:3px 9px;align-items:baseline;color:#f7f1e7;font:600 9px/1 var(--body);letter-spacing:.18em;}
.th-p-portable-speakers .ps-location-mark b{grid-row:span 2;grid-column:2;color:#ffd05b;font:var(--dw) clamp(38px,4.6vw,68px)/.72 var(--display);letter-spacing:var(--dt);}
.th-p-portable-speakers .ps-copy-deck{position:relative;z-index:2;display:grid;align-items:end;min-height:clamp(585px,58vw,790px);padding:clamp(152px,18vw,235px) clamp(22px,5.7vw,92px) clamp(94px,11vw,155px);}
.th-p-portable-speakers .ps-copy{display:grid;justify-items:start;width:min(100%,740px);text-wrap:balance;}
.th-p-portable-speakers .ps-copy .eyebrow{margin:0 0 15px;color:#ffd05b;font:700 10px/1.25 var(--body);letter-spacing:.2em;text-transform:uppercase;}
.th-p-portable-speakers .ps-copy h1{max-width:11ch;margin:0;color:#fff9ee;font:var(--dw) clamp(50px,7.3vw,118px)/.87 var(--display);letter-spacing:var(--dt);text-shadow:0 3px 20px #12316b49;}
.th-p-portable-speakers .ps-copy h1.long{max-width:15ch;font-size:clamp(39px,5.6vw,82px);line-height:.94;}
.th-p-portable-speakers .ps-copy .sub{max-width:43ch;margin:20px 0 0;color:#f3e8dc;font:500 clamp(14px,1.2vw,17px)/1.55 var(--body);}
.th-p-portable-speakers .ps-copy .ctas{display:flex;flex-wrap:wrap;gap:10px;margin-top:26px;}
.th-p-portable-speakers .ps-copy .btn{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 21px;border:1px solid #fff7ea;color:#142238;background:#fff7ea;border-radius:999px;font:700 11px/1 var(--body);letter-spacing:.04em;text-decoration:none;transition:background-color .2s ease,color .2s ease,border-color .2s ease;}
.th-p-portable-speakers .ps-copy .btn:hover{border-color:var(--accent);color:#fff7ea;background:var(--accent);}
.th-p-portable-speakers .ps-copy .btn.ghost{border-color:#fff6e08c;color:#fff7ea;background:#143a7359;}
.th-p-portable-speakers .ps-copy .btn.ghost:hover{border-color:#fff7ea;color:#142238;background:#fff7ea;}
.th-p-portable-speakers .ps-hero-footer{position:absolute;z-index:2;right:0;bottom:0;left:0;display:flex;justify-content:space-between;gap:14px;padding:18px clamp(22px,4vw,64px);border-top:1px solid #fff6e078;color:#f7ebdb;font:700 9px/1.25 var(--body);letter-spacing:.15em;text-transform:uppercase;}
.th-p-portable-speakers .ps-motion{position:absolute;z-index:3;right:clamp(18px,2vw,30px);bottom:clamp(59px,6.5vw,93px);}
.th-p-portable-speakers .ps-motion .motion-toggle{min-height:44px;padding:0 13px;border:1px solid #fff6e08a;border-radius:999px;color:#fff8ed;background:#153774b5;font:700 9px/1 var(--body);letter-spacing:.1em;text-transform:uppercase;}
.th-p-portable-speakers .ps-motion .motion-toggle:hover{color:#17325f;background:#fff7ea;}
.th-p-portable-speakers .ps-waterline.has-hero-motion[data-hero-motion="pan"] .ps-media-frame .hero-media{animation:portable-speakers-pan 17s ease-in-out infinite alternate;}
.th-p-portable-speakers .ps-waterline.has-hero-motion[data-hero-motion="drift"] .ps-media-frame .hero-media{animation:portable-speakers-drift 14s ease-in-out infinite alternate;}
@keyframes portable-speakers-pan{from{transform:scale(1.025) translateX(-1.1%);}to{transform:scale(1.085) translateX(1.25%);}}
@keyframes portable-speakers-drift{from{transform:scale(1.035) translate3d(-.6%,-.25%,0);}to{transform:scale(1.08) translate3d(.6%,.4%,0);}}
.th-p-portable-speakers .theme-discovery{max-width:1660px;margin:0 auto;padding:clamp(68px,9vw,135px) clamp(21px,5.5vw,92px);}
.th-p-portable-speakers .ps-station-map{background:linear-gradient(180deg,#f4efe6 0%,#fffaf2 100%);}
.th-p-portable-speakers .ps-discovery-heading{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(185px,.52fr);column-gap:clamp(28px,7vw,120px);align-items:end;margin-bottom:clamp(31px,4vw,60px);}
.th-p-portable-speakers .ps-discovery-heading .eyebrow{grid-column:1/-1;margin:0 0 14px;color:#ef4e31;font:700 10px/1.2 var(--body);letter-spacing:.19em;text-transform:uppercase;}
.th-p-portable-speakers .ps-discovery-heading h2{max-width:12ch;margin:0;color:var(--ink);font:var(--dw) clamp(35px,4.6vw,70px)/.94 var(--display);letter-spacing:var(--dt);text-wrap:balance;}
.th-p-portable-speakers .ps-discovery-heading>p:last-child{max-width:31ch;margin:0 0 2px;color:var(--muted);font:500 15px/1.55 var(--body);}
.th-p-portable-speakers .ps-station-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:clamp(9px,1.2vw,18px);}
.th-p-portable-speakers .ps-station{position:relative;display:grid;grid-template-rows:minmax(195px,20vw) auto auto;gap:6px;min-width:0;overflow:hidden;padding:10px 10px 16px;border:1px solid var(--line);border-radius:18px;color:var(--ink);background:var(--surface);text-decoration:none;box-shadow:0 8px 18px #14223808;}
.th-p-portable-speakers .ps-station-art{position:relative;display:block;overflow:hidden;border-radius:10px;background:linear-gradient(140deg,#305b9f 0%,#f4d298 49%,#ff603f 100%);}
.th-p-portable-speakers .ps-station-art::after{position:absolute;inset:0;content:"";background:linear-gradient(0deg,#13294a42,transparent 52%);pointer-events:none;}
.th-p-portable-speakers .ps-station-art img{display:block;width:100%;height:100%;object-fit:cover;filter:saturate(.9) contrast(1.03);transition:transform .35s ease,filter .35s ease;}
.th-p-portable-speakers .ps-station:hover .ps-station-art img{transform:scale(1.05);filter:saturate(1.08) contrast(1.04);}
.th-p-portable-speakers .ps-station-fallback{display:flex;align-items:end;gap:8%;width:100%;height:100%;padding:17%;background:linear-gradient(145deg,#1f58b3 0 42%,#f1c476 42% 44%,#ee593b 44% 100%);}
.th-p-portable-speakers .ps-station-fallback i{display:block;flex:1;background:#fff6e3b5;}
.th-p-portable-speakers .ps-station-fallback i:nth-child(1){height:37%;}
.th-p-portable-speakers .ps-station-fallback i:nth-child(2){height:70%;}
.th-p-portable-speakers .ps-station-fallback i:nth-child(3){height:49%;}
.th-p-portable-speakers .ps-station-number{margin-top:6px;color:#ea5237;font:700 10px/1 var(--body);letter-spacing:.11em;}
.th-p-portable-speakers .ps-station-name{min-width:0;overflow:hidden;font:var(--dw) clamp(18px,1.7vw,27px)/1.02 var(--display);letter-spacing:var(--dt);text-overflow:ellipsis;white-space:nowrap;}
.th-p-portable-speakers .ps-station-count{min-width:0;overflow:hidden;color:var(--muted);font:600 10px/1.3 var(--body);letter-spacing:.07em;text-overflow:ellipsis;text-transform:uppercase;white-space:nowrap;}
.th-p-portable-speakers .ps-station-arrow{position:absolute;right:15px;bottom:15px;display:grid;place-items:center;width:30px;height:30px;border-radius:50%;color:#fff8ee;background:var(--ink);font:500 18px/1 var(--body);transition:background-color .2s ease,color .2s ease;}
.th-p-portable-speakers .ps-station:hover .ps-station-arrow{color:#fff8ee;background:var(--accent);}
.th-p-portable-speakers .ps-all-link{display:flex;align-items:center;justify-content:space-between;gap:18px;min-height:54px;margin-top:clamp(24px,3vw,42px);padding:0 2px;border-bottom:1px solid var(--ink);color:var(--ink);font:700 clamp(14px,1.35vw,18px)/1 var(--body);text-decoration:none;}
.th-p-portable-speakers .ps-all-link b{font:400 27px/1 var(--body);transition:transform .2s ease;}
.th-p-portable-speakers .ps-all-link:hover b{transform:translateX(5px);}
.th-p-portable-speakers .ps-open-case{border-top:1px solid var(--line);background:var(--surface);}
.th-p-portable-speakers .ps-product-strip{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(12px,2vw,26px);}
.th-p-portable-speakers .ps-product-strip :is(.pc,.product-card){overflow:hidden;border:1px solid var(--line);border-radius:18px;background:#fffaf3;box-shadow:none;}
.th-p-portable-speakers .ps-product-strip :is(.pc,.product-card) .im{overflow:hidden;background:#e1e1d9;}
.th-p-portable-speakers .ps-product-strip :is(.pc,.product-card) img{filter:saturate(.9) contrast(1.02);}
.th-p-portable-speakers .ps-product-strip :is(.pc,.product-card) .bd{padding:16px;}
.th-p-portable-speakers .ps-product-strip :is(.pc,.product-card) .pr{color:#e84d31;}
.th-p-portable-speakers :is(.ps-copy .btn,.ps-station,.ps-all-link):focus-visible{outline:3px solid var(--accent);outline-offset:4px;}
@media (max-width:900px){
  .th-p-portable-speakers .ps-stage,.th-p-portable-speakers .ps-copy-deck{min-height:690px;}
  .th-p-portable-speakers .ps-copy-deck{padding-top:166px;}
  .th-p-portable-speakers .ps-discovery-heading{grid-template-columns:1fr;gap:16px;}
  .th-p-portable-speakers .ps-station-grid{grid-template-columns:repeat(2,minmax(0,1fr));}
  .th-p-portable-speakers .ps-station{grid-template-rows:minmax(210px,34vw) auto auto;}
}
@media (max-width:620px){
  .th-p-portable-speakers .category-hero.ps-waterline{padding:0;}
  .th-p-portable-speakers .ps-stage,.th-p-portable-speakers .ps-copy-deck{min-height:690px;}
  .th-p-portable-speakers .ps-media-frame .hero-media{object-position:62% center;}
  .th-p-portable-speakers .ps-media-frame::after{background:linear-gradient(0deg,#0e2c60db 0%,#12336955 54%,#102a5847 100%);}
  .th-p-portable-speakers .ps-frequency-slats{right:19px;height:180px;}
  .th-p-portable-speakers .ps-location-mark{top:26px;left:19px;}
  .th-p-portable-speakers .ps-copy-deck{align-items:end;padding:134px 19px 115px;}
  .th-p-portable-speakers .ps-copy h1,.th-p-portable-speakers .ps-copy h1.long{max-width:11ch;font-size:clamp(45px,13vw,62px);line-height:.9;}
  .th-p-portable-speakers .ps-copy .sub{max-width:34ch;margin-top:16px;font-size:14px;}
  .th-p-portable-speakers .ps-copy .ctas{width:100%;}
  .th-p-portable-speakers .ps-copy .btn{flex:1 1 145px;padding:0 14px;}
  .th-p-portable-speakers .ps-hero-footer{padding:15px 19px;font-size:8px;letter-spacing:.11em;}
  .th-p-portable-speakers .ps-hero-footer span:nth-child(2){display:none;}
  .th-p-portable-speakers .ps-motion{right:14px;bottom:57px;}
  .th-p-portable-speakers .ps-motion .motion-toggle{min-height:44px;padding:0 10px;font-size:8px;}
  .th-p-portable-speakers .theme-discovery{padding:68px 18px;}
  .th-p-portable-speakers .ps-discovery-heading h2{font-size:clamp(34px,10.5vw,48px);}
  .th-p-portable-speakers .ps-discovery-heading>p:last-child{font-size:14px;}
  .th-p-portable-speakers .ps-station-grid{gap:10px;}
  .th-p-portable-speakers .ps-station{grid-template-rows:minmax(152px,42vw) auto auto;padding:8px 8px 14px;border-radius:13px;}
  .th-p-portable-speakers .ps-station-art{border-radius:8px;}
  .th-p-portable-speakers .ps-station-name{font-size:clamp(16px,5vw,22px);}
  .th-p-portable-speakers .ps-station-count{font-size:9px;}
  .th-p-portable-speakers .ps-station-arrow{right:11px;bottom:11px;width:27px;height:27px;font-size:16px;}
  .th-p-portable-speakers .ps-product-strip{grid-template-columns:1fr;gap:12px;}
}
@media (prefers-reduced-motion:reduce){
  .th-p-portable-speakers .ps-waterline.has-hero-motion .ps-media-frame .hero-media{animation:none;}
  .th-p-portable-speakers :is(.ps-copy .btn,.ps-station-art img,.ps-station-arrow,.ps-all-link b){transition:none;}
}
`;
